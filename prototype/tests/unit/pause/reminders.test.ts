import { describe, it, expect } from 'vitest';
import { generateCalmReminderMessage } from '@/domain/pause/reminders';
import type { Sip, PauseSchedule, RestartReminder } from '@/contracts/domain';
import { findBannedPhrases } from '@/lib/banned-phrases';
import { CalmReminderMessage } from '@/contracts/pause';

const mockSip: Sip = {
  id: 'sip-test-reminder',
  userId: 'usr-1',
  schemeName: 'Northstar Flexi Cap Fund',
  category: 'Flexi Cap · Direct Growth',
  folioMasked: '••9019',
  investmentDate: '2026-01-15',
  frequency: 'MONTHLY',
  instalmentAmountPaise: 500000,
  mandate: {
    type: 'UPI_AUTOPAY',
    status: 'ACTIVE',
    bankLabel: 'Demo Bank ••4012'
  },
  cancelledOn: null,
  declared: {
    totalInvestedPaise: 5000000,
    lastSuccessfulInstalmentDate: '2026-10-15'
  },
  isMock: true,
  dataLabel: 'DEMO DATA'
};

const mockPause: PauseSchedule = {
  id: 'pause-1',
  sipId: mockSip.id,
  requestedOn: '2026-10-15',
  pauseStart: '2026-10-15',
  pauseEnd: '2026-11-20',
  state: 'ACTIVE',
  skippedDueDates: ['2026-10-15', '2026-11-15'],
  resumedOn: null,
  cancelledOn: null
};

describe('Opt-in Non-Urgent Reminder Scheduler (Phase 5 Task 3 & PR-E11, PR-E12, PR-E13)', () => {
  it('PR-E11: sends 0 outbound communications when optInReminder is false', () => {
    const reminder: RestartReminder = {
      id: 'rem-1',
      pauseId: mockPause.id,
      optedIn: false,
      remindOn: null,
      channels: ['IN_APP'],
      status: 'NONE',
      sentOn: null
    };

    const msg = generateCalmReminderMessage(mockSip, mockPause, reminder, '2026-11-17');
    expect(msg).toBeNull();
  });

  it('PR-E12: generates calm, factual reminder copy with equal choices when opted in', () => {
    const reminder: RestartReminder = {
      id: 'rem-1',
      pauseId: mockPause.id,
      optedIn: true,
      remindOn: '2026-11-17',
      channels: ['IN_APP'],
      status: 'SCHEDULED',
      sentOn: null
    };

    const msg = generateCalmReminderMessage(mockSip, mockPause, reminder, '2026-11-17');
    expect(msg).not.toBeNull();

    // Validate with Zod schema
    const parsed = CalmReminderMessage.safeParse(msg);
    expect(parsed.success).toBe(true);

    expect(msg?.headline).toBe('Upcoming SIP restart');
    expect(msg?.message).toBe(
      'Your SIP for Northstar Flexi Cap Fund was scheduled to resume on 2026-11-20. Choose to resume, extend the pause, or leave it paused.'
    );

    // Offers 3 equal choices
    expect(msg?.actions).toEqual([
      { type: 'RESUME', label: 'Resume SIP' },
      { type: 'EXTEND', label: 'Extend pause' },
      { type: 'KEEP_PAUSED', label: 'Keep paused' }
    ]);

    // Zero violations against banned phrase and pressure linter
    const violations = findBannedPhrases(`${msg?.headline} ${msg?.message}`);
    expect(violations).toEqual([]);
  });

  it('PR-E13: purges reminder if SIP was resumed or cancelled before reminder date', () => {
    const reminder: RestartReminder = {
      id: 'rem-1',
      pauseId: mockPause.id,
      optedIn: true,
      remindOn: '2026-11-17',
      channels: ['IN_APP'],
      status: 'SCHEDULED',
      sentOn: null
    };

    // Case 1: SIP was already resumed
    const resumedPause: PauseSchedule = {
      ...mockPause,
      state: 'ENDED',
      resumedOn: '2026-11-05'
    };
    expect(generateCalmReminderMessage(mockSip, resumedPause, reminder, '2026-11-17')).toBeNull();

    // Case 2: SIP was cancelled
    const cancelledSip: Sip = {
      ...mockSip,
      cancelledOn: '2026-11-01'
    };
    expect(generateCalmReminderMessage(cancelledSip, mockPause, reminder, '2026-11-17')).toBeNull();
  });
});

