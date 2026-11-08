import { describe, it, expect } from 'vitest';
import {
  canTransition,
  validateTransition,
  calculatePauseDates,
  getPauseLifecycleState
} from '@/domain/pause/machine';
import type { Sip, PauseSchedule, PaymentFailure } from '@/contracts/domain';
import { addMonths } from '@/lib/dates';
import { AppError } from '@/lib/errors';

const mockSip: Sip = {
  id: 'sip-test-1',
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

describe('Pause Lifecycle State Machine — Transitions', () => {
  it('allows valid transitions according to architecture state diagram', () => {
    // ACTIVE -> SCHEDULED_PAUSE (future pause)
    expect(canTransition('ACTIVE', 'SCHEDULED_PAUSE')).toBe(true);
    // ACTIVE -> PAUSED (immediate pause)
    expect(canTransition('ACTIVE', 'PAUSED')).toBe(true);
    // ACTIVE -> CANCELLED
    expect(canTransition('ACTIVE', 'CANCELLED')).toBe(true);

    // SCHEDULED_PAUSE -> PAUSED (start date reached)
    expect(canTransition('SCHEDULED_PAUSE', 'PAUSED')).toBe(true);
    // SCHEDULED_PAUSE -> ACTIVE (undone before start)
    expect(canTransition('SCHEDULED_PAUSE', 'ACTIVE')).toBe(true);
    // SCHEDULED_PAUSE -> CANCELLED
    expect(canTransition('SCHEDULED_PAUSE', 'CANCELLED')).toBe(true);

    // PAUSED -> RESTART_PENDING (within 14 days)
    expect(canTransition('PAUSED', 'RESTART_PENDING')).toBe(true);
    // PAUSED -> ACTIVE / RESUMED (user resumes)
    expect(canTransition('PAUSED', 'ACTIVE')).toBe(true);
    expect(canTransition('PAUSED', 'RESUMED')).toBe(true);
    // PAUSED -> PAUSED (extend pause)
    expect(canTransition('PAUSED', 'PAUSED')).toBe(true);
    // PAUSED -> CANCELLED
    expect(canTransition('PAUSED', 'CANCELLED')).toBe(true);

    // RESTART_PENDING -> ACTIVE / RESUMED (auto-resume or manual resume)
    expect(canTransition('RESTART_PENDING', 'ACTIVE')).toBe(true);
    expect(canTransition('RESTART_PENDING', 'RESUMED')).toBe(true);
    // RESTART_PENDING -> PAUSED (extend beyond 14 days)
    expect(canTransition('RESTART_PENDING', 'PAUSED')).toBe(true);
    // RESTART_PENDING -> CANCELLED
    expect(canTransition('RESTART_PENDING', 'CANCELLED')).toBe(true);

    // RESUMED -> ACTIVE / PAUSED
    expect(canTransition('RESUMED', 'ACTIVE')).toBe(true);
    expect(canTransition('RESUMED', 'PAUSED')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    // CANCELLED cannot transition to ANY state (PR-E08)
    expect(canTransition('CANCELLED', 'ACTIVE')).toBe(false);
    expect(canTransition('CANCELLED', 'PAUSED')).toBe(false);
    expect(canTransition('CANCELLED', 'RESUMED')).toBe(false);
    expect(canTransition('CANCELLED', 'SCHEDULED_PAUSE')).toBe(false);

    // ACTIVE cannot directly become RESTART_PENDING or RESUMED
    expect(canTransition('ACTIVE', 'RESTART_PENDING')).toBe(false);
    expect(canTransition('ACTIVE', 'RESUMED')).toBe(false);
  });

  it('validateTransition throws 409 conflict when resuming a cancelled SIP (PR-E08)', () => {
    expect(() => validateTransition('CANCELLED', 'ACTIVE')).toThrowError(
      /This SIP has been permanently cancelled and cannot be resumed/i
    );
    try {
      validateTransition('CANCELLED', 'ACTIVE');
    } catch (err: unknown) {
      expect((err as AppError).status).toBe(409);
    }
  });

  it('validateTransition throws 409 conflict when attempting duplicate pause on already paused SIP (PR-E06)', () => {
    expect(() =>
      validateTransition('PAUSED', 'PAUSED', { pauseEndDate: '2027-01-14' })
    ).toThrowError(/This SIP is already paused until 2027-01-14\. You can extend your pause or resume debits\./i);

    expect(() =>
      validateTransition('RESTART_PENDING', 'PAUSED', { pauseEndDate: '2026-11-20' })
    ).toThrowError(/This SIP is already paused until 2026-11-20/i);
  });
});

describe('Pause Date Calculator & Boundary Edge Cases (PR-E01 to PR-E10, PR-E14)', () => {
  const asOf = '2026-11-09';

  it('PR-E01: rejects pause start date in the past', () => {
    expect(() =>
      calculatePauseDates({ startDate: '2026-11-08' }, mockSip, asOf)
    ).toThrowError(/Pause start date cannot be in the past\. Select today or an upcoming debit date\./i);
  });

  it('PR-E02: rejects end date preceding or equal to start date', () => {
    expect(() =>
      calculatePauseDates({ startDate: '2026-11-15', endDate: '2026-11-15' }, mockSip, asOf)
    ).toThrowError(/Resume date must be at least one day after the pause start date\./i);

    expect(() =>
      calculatePauseDates({ startDate: '2026-11-15', endDate: '2026-11-10' }, mockSip, asOf)
    ).toThrowError(/Resume date must be at least one day after the pause start date\./i);
  });

  it('PR-E05: rejects pause duration exceeding platform cap (6 months)', () => {
    expect(() =>
      calculatePauseDates({ durationMonths: 7 }, mockSip, asOf)
    ).toThrowError(/SIPs can be paused for up to 6 months at a time\. You can resume earlier at any point\./i);

    expect(() =>
      calculatePauseDates(
        { startDate: asOf, endDate: addMonths(asOf, 7) },
        mockSip,
        asOf
      )
    ).toThrowError(/SIPs can be paused for up to 6 months at a time\./i);
  });

  it('calculates duration correctly for preset months (1, 2, 3, 6 months)', () => {
    // 1 month pause from 2026-11-09: monthly due day is 15th
    // Upcoming dues: 2026-11-15 (skipped), 2026-12-15 (resume)
    const res1 = calculatePauseDates({ durationMonths: 1 }, mockSip, asOf);
    expect(res1.valid).toBe(true);
    expect(res1.startDate).toBe('2026-11-09');
    expect(res1.skippedDueDates).toEqual(['2026-11-15']);
    expect(res1.resumeDate).toBe('2026-12-15');
    expect(res1.endDate).toBe('2026-12-14');

    // 3 month pause: skips 2026-11-15, 2026-12-15, 2027-01-15; resumes 2027-02-15
    const res3 = calculatePauseDates({ durationMonths: 3 }, mockSip, asOf);
    expect(res3.skippedDueDates).toEqual(['2026-11-15', '2026-12-15', '2027-01-15']);
    expect(res3.resumeDate).toBe('2027-02-15');
    expect(res3.endDate).toBe('2027-02-14');
  });

  it('supports open-ended pause (until user resumes)', () => {
    const resOpen = calculatePauseDates({ endDate: null }, mockSip, asOf);
    expect(resOpen.valid).toBe(true);
    expect(resOpen.endDate).toBeNull();
    expect(resOpen.resumeDate).toBeNull();
    expect(resOpen.skippedDueDates.length).toBeGreaterThan(0);
  });

  it('PR-E03: warns when pause window covers zero scheduled debits', () => {
    // Due date is 15th of month. Today is 16th, window 2026-11-16 to 2026-11-30 has no 15th
    const res = calculatePauseDates(
      { startDate: '2026-11-16', endDate: '2026-11-30' },
      mockSip,
      '2026-11-16'
    );
    expect(res.skippedDueDates).toEqual([]);
    expect(res.notice).toMatch(/No scheduled instalments fall within this window\. Your next debit remains on 2026-12-15\./i);
  });

  it('PR-E04: warns when pause is requested while a debit is in-flight today', () => {
    const inFlight: PaymentFailure[] = [
      {
        id: 'fail-1',
        sipId: mockSip.id,
        instalmentId: 'inst-1',
        occurredOn: asOf,
        amountPaise: 500000,
        reasonCode: null,
        providerMessage: null,
        retry: {
          status: 'PENDING',
          nextRetryDate: null,
          verified: false,
          manualRetryAllowed: false
        },
        resolved: false,
        resolvedOn: null
      }
    ];

    const res = calculatePauseDates(
      { startDate: asOf, durationMonths: 1 },
      mockSip,
      asOf,
      { inFlightFailures: inFlight }
    );

    expect(res.inFlightWarning).toMatch(/Today's instalment of ₹5,000\.00 is already being processed\. Your pause will begin from the next scheduled debit\./i);
    expect(res.startDate).toBe('2026-11-10');
  });

  it('PR-E09: flags mandate expiration during pause window', () => {
    const res = calculatePauseDates(
      { durationMonths: 3 },
      mockSip,
      asOf,
      { mandateExpiry: '2026-12-31' }
    );
    expect(res.mandateExpiresDuringPause).toBe(true);
    expect(res.mandateWarning).toMatch(/Your bank mandate expires on 2026-12-31\. You will need to re-authorize Autopay before debits can resume\./i);
  });
});

describe('Derived Lifecycle State & 14-day RESTART_PENDING (PR-E14, D-11)', () => {
  it('derives SCHEDULED_PAUSE when start date is in the future', () => {
    const pause: PauseSchedule = {
      id: 'p-1',
      sipId: mockSip.id,
      requestedOn: '2026-11-09',
      pauseStart: '2026-11-20',
      pauseEnd: '2027-01-14',
      state: 'SCHEDULED',
      skippedDueDates: ['2026-12-15'],
      resumedOn: null,
      cancelledOn: null
    };
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-09')).toBe('SCHEDULED_PAUSE');
  });

  it('derives PAUSED when pause is active and resume date is > 14 days away', () => {
    const pause: PauseSchedule = {
      id: 'p-1',
      sipId: mockSip.id,
      requestedOn: '2026-11-09',
      pauseStart: '2026-11-09',
      pauseEnd: '2027-01-14',
      state: 'ACTIVE',
      skippedDueDates: ['2026-11-15', '2026-12-15'],
      resumedOn: null,
      cancelledOn: null
    };
    // 2026-11-09 to 2027-01-14 is > 60 days
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-09')).toBe('PAUSED');
  });

  it('derives RESTART_PENDING exactly when days to pauseEnd <= 14 days (D-11)', () => {
    const pause: PauseSchedule = {
      id: 'p-1',
      sipId: mockSip.id,
      requestedOn: '2026-10-15',
      pauseStart: '2026-10-15',
      pauseEnd: '2026-11-24', // Resume is 2026-11-25
      state: 'ACTIVE',
      skippedDueDates: ['2026-10-15', '2026-11-15'],
      resumedOn: null,
      cancelledOn: null
    };

    // On 2026-11-09: 2026-11-24 is (15 + 1) = 16 days away -> PAUSED
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-09')).toBe('PAUSED');

    // On 2026-11-10: 2026-11-24 is (14 + 1) = 15 days away -> PAUSED
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-10')).toBe('PAUSED');

    // On 2026-11-11: 2026-11-24 is (13 + 1) = 14 days away -> RESTART_PENDING
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-11')).toBe('RESTART_PENDING');

    // On 2026-11-24 (last paused day): 1 day away -> RESTART_PENDING
    expect(getPauseLifecycleState(mockSip, pause, '2026-11-24')).toBe('RESTART_PENDING');
  });

  it('open-ended pause never derives RESTART_PENDING (remains PAUSED)', () => {
    const openPause: PauseSchedule = {
      id: 'p-open',
      sipId: mockSip.id,
      requestedOn: '2026-11-09',
      pauseStart: '2026-11-09',
      pauseEnd: null,
      state: 'ACTIVE',
      skippedDueDates: ['2026-11-15'],
      resumedOn: null,
      cancelledOn: null
    };
    expect(getPauseLifecycleState(mockSip, openPause, '2026-11-09')).toBe('PAUSED');
    expect(getPauseLifecycleState(mockSip, openPause, '2027-05-01')).toBe('PAUSED');
  });

  it('returns CANCELLED if SIP was cancelled', () => {
    const cancelledSip: Sip = {
      ...mockSip,
      cancelledOn: '2026-10-01'
    };
    expect(getPauseLifecycleState(cancelledSip, null, '2026-11-09')).toBe('CANCELLED');
  });
});
