import { describe, it, expect } from 'vitest';
import { deriveSipStatus, RESTART_WINDOW_DAYS } from '@/data/status';

const active = { cancelledOn: null };
const failed = [{ resolved: false }];
const fixed = [{ resolved: true }];
const pause = (start: string, end: string | null, state: 'ACTIVE' | 'SCHEDULED' | 'ENDED' | 'CANCELLED_BY_USER' = 'ACTIVE') => ({ state, pauseStart: start, pauseEnd: end });

describe('deriveSipStatus', () => {
  it('is ACTIVE with no failures and no pause', () => {
    expect(deriveSipStatus(active, [], null, '2026-11-08')).toBe('ACTIVE');
    expect(deriveSipStatus(active, fixed, null, '2026-11-08')).toBe('ACTIVE');
  });

  it('is PAYMENT_FAILED only while a failure is unresolved', () => {
    expect(deriveSipStatus(active, failed, null, '2026-11-08')).toBe('PAYMENT_FAILED');
    expect(deriveSipStatus(active, [...fixed, ...failed], null, '2026-11-08')).toBe('PAYMENT_FAILED');
  });

  it('is CANCELLED on or after the cancellation date, never before', () => {
    expect(deriveSipStatus({ cancelledOn: '2026-11-07' }, [], null, '2026-11-08')).toBe('CANCELLED');
    expect(deriveSipStatus({ cancelledOn: '2026-11-08' }, [], null, '2026-11-08')).toBe('CANCELLED');
    expect(deriveSipStatus({ cancelledOn: '2026-11-09' }, [], null, '2026-11-08')).toBe('ACTIVE');
  });

  it('precedence: CANCELLED beats a failure and a pause', () => {
    expect(deriveSipStatus({ cancelledOn: '2026-11-07' }, failed, pause('2026-10-01', null), '2026-11-08')).toBe('CANCELLED');
  });

  it('precedence: a pause beats a failure (a pause is never shown as "failed")', () => {
    expect(deriveSipStatus(active, failed, pause('2026-10-01', '2027-01-14'), '2026-11-08')).toBe('PAUSED');
  });

  it('PAUSED when the restart date is far, RESTART_PENDING inside the window', () => {
    expect(deriveSipStatus(active, [], pause('2026-10-15', '2027-01-14'), '2026-11-08')).toBe('PAUSED');
    expect(deriveSipStatus(active, [], pause('2026-07-20', '2026-11-19'), '2026-11-08')).toBe('RESTART_PENDING');
  });

  it('window boundary: exactly RESTART_WINDOW_DAYS before restart is pending, one more day is still paused', () => {
    // pauseEnd is the last paused day; restart day = pauseEnd + 1. With asOf = 2026-11-08 and window 14 days:
    expect(RESTART_WINDOW_DAYS).toBe(14);
    expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-21'), '2026-11-08')).toBe('RESTART_PENDING'); // 14 days
    expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-22'), '2026-11-08')).toBe('PAUSED'); // 15 days
  });

  it('an open-ended pause is PAUSED until the user resumes (never pending)', () => {
    expect(deriveSipStatus(active, [], pause('2026-10-01', null), '2026-11-08')).toBe('PAUSED');
    expect(deriveSipStatus(active, [], pause('2026-10-01', null), '2027-06-01')).toBe('PAUSED');
  });

  it('a scheduled pause that has not started yet leaves the SIP ACTIVE', () => {
    expect(deriveSipStatus(active, [], pause('2026-11-20', '2026-12-19', 'SCHEDULED'), '2026-11-08')).toBe('ACTIVE');
  });

  it('after the pause end date the SIP is no longer paused', () => {
    expect(deriveSipStatus(active, [], pause('2026-07-20', '2026-11-19'), '2026-11-20')).toBe('ACTIVE');
    expect(deriveSipStatus(active, failed, pause('2026-07-20', '2026-11-19'), '2026-11-20')).toBe('PAYMENT_FAILED');
  });

  it('ended or cancelled pauses never count', () => {
    expect(deriveSipStatus(active, [], pause('2026-10-01', '2027-01-14', 'ENDED'), '2026-11-08')).toBe('ACTIVE');
    expect(deriveSipStatus(active, [], pause('2026-10-01', '2027-01-14', 'CANCELLED_BY_USER'), '2026-11-08')).toBe('ACTIVE');
  });

  it('the pause start day itself counts as paused', () => {
    expect(deriveSipStatus(active, [], pause('2026-11-08', '2027-02-01'), '2026-11-08')).toBe('PAUSED');
    expect(deriveSipStatus(active, [], pause('2026-11-09', '2027-02-01'), '2026-11-08')).toBe('ACTIVE');
  });

  describe('D-11 (approved): RESTART_PENDING rules', () => {
    const asOf = '2026-11-08';
    it('14-day boundary: restart date exactly 14 days away is pending, 15 is not, 13 is pending', () => {
      expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-20'), asOf)).toBe('RESTART_PENDING'); // 13
      expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-21'), asOf)).toBe('RESTART_PENDING'); // 14
      expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-22'), asOf)).toBe('PAUSED'); // 15
    });
    it('past restart dates are never pending (pause is over)', () => {
      expect(deriveSipStatus(active, [], pause('2026-08-01', '2026-11-07'), asOf)).toBe('ACTIVE');
      expect(deriveSipStatus(active, [], pause('2026-08-01', '2026-10-01'), asOf)).toBe('ACTIVE');
    });
    it('restart on the last paused day (today) is pending', () => {
      expect(deriveSipStatus(active, [], pause('2026-08-01', asOf), asOf)).toBe('RESTART_PENDING');
    });
    it('open-ended pauses never qualify, however long they run', () => {
      expect(deriveSipStatus(active, [], pause('2026-10-01', null), asOf)).toBe('PAUSED');
    });
    it('an invalid restart date (before the pause start, or not a real date) never qualifies', () => {
      expect(deriveSipStatus(active, [], pause('2026-11-01', '2026-10-15'), asOf)).toBe('ACTIVE'); // past and inverted
      expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-02-30'), asOf)).not.toBe('RESTART_PENDING'); // the Zod schema rejects such dates before they get here
      expect(deriveSipStatus(active, [], pause('2026-11-20', '2026-11-10'), asOf)).toBe('ACTIVE'); // not started
    });
    it('a pause that is not in a paused state never qualifies', () => {
      for (const state of ['ENDED', 'CANCELLED_BY_USER'] as const) {
        expect(deriveSipStatus(active, [], pause('2026-10-01', '2026-11-15', state), asOf)).toBe('ACTIVE');
      }
      expect(deriveSipStatus(active, [], null, asOf)).toBe('ACTIVE');
    });
    it('a restart reminder alone does not qualify: status takes no reminder input and an ACTIVE SIP with a reminder stays ACTIVE', () => {
      expect(deriveSipStatus.length).toBe(4); // (sip, failures, pause, asOf): no reminder parameter
      expect(deriveSipStatus(active, [], null, asOf)).toBe('ACTIVE');
    });
  });
});
