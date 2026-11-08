import type { PauseSchedule, PaymentFailure, Sip } from '@/contracts/domain';
import type {
  PauseCalculationResult,
  PauseLifecycleState,
  PauseRequestInput
} from '@/contracts/pause';
import { conflict, invalidInput } from '@/lib/errors';
import {
  addDays,
  diffDays,
  isValidISODate,
  monthsBetween,
  nthDueDate,
  type Frequency,
  type ISODate
} from '@/lib/dates';
import { formatINR } from '@/domain/returns/money';

export const RESTART_WINDOW_DAYS = 14;
export const MAX_PAUSE_MONTHS = 6;

/**
 * Valid transitions for the Pause Lifecycle State Machine (architecture.md Section 4.3.2):
 *  ACTIVE -> SCHEDULED_PAUSE (future start date)
 *  ACTIVE -> PAUSED (immediate pause)
 *  SCHEDULED_PAUSE -> PAUSED (start date reached)
 *  SCHEDULED_PAUSE -> ACTIVE (undone or cancelled before start)
 *  PAUSED -> RESTART_PENDING (end date <= 14 days away)
 *  PAUSED -> ACTIVE / RESUMED (user resumes)
 *  PAUSED -> PAUSED (extend pause date)
 *  RESTART_PENDING -> ACTIVE / RESUMED (auto-resume or user resumes)
 *  RESTART_PENDING -> PAUSED (extended beyond 14 days)
 *  ACTIVE / SCHEDULED_PAUSE / PAUSED / RESTART_PENDING -> CANCELLED (SIP cancelled)
 *  CANCELLED -> NO TRANSITIONS PERMITTED (mandate revoked, PR-E08)
 */
const VALID_TRANSITIONS: Record<PauseLifecycleState, ReadonlySet<PauseLifecycleState>> = {
  ACTIVE: new Set(['SCHEDULED_PAUSE', 'PAUSED', 'CANCELLED', 'ACTIVE']),
  SCHEDULED_PAUSE: new Set(['PAUSED', 'ACTIVE', 'CANCELLED', 'SCHEDULED_PAUSE']),
  PAUSED: new Set(['RESTART_PENDING', 'ACTIVE', 'RESUMED', 'PAUSED', 'CANCELLED']),
  RESTART_PENDING: new Set(['ACTIVE', 'RESUMED', 'PAUSED', 'CANCELLED', 'RESTART_PENDING']),
  RESUMED: new Set(['ACTIVE', 'SCHEDULED_PAUSE', 'PAUSED', 'CANCELLED']),
  CANCELLED: new Set()
};

export function canTransition(from: PauseLifecycleState, to: PauseLifecycleState): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.has(to) ?? false;
}

export function validateTransition(
  from: PauseLifecycleState,
  to: PauseLifecycleState,
  context: { pauseEndDate?: string | null; schemeName?: string } = {}
): void {
  if (from === 'CANCELLED') {
    // PR-E08: Resuming a Cancelled SIP
    throw conflict(
      'This SIP has been permanently cancelled and cannot be resumed. You can start a new SIP anytime.'
    );
  }

  if ((from === 'PAUSED' || from === 'RESTART_PENDING') && (to === 'PAUSED' || to === 'SCHEDULED_PAUSE')) {
    // If attempting to create a fresh pause on already paused SIP without explicit extension:
    const endStr = context.pauseEndDate ? ` until ${context.pauseEndDate}` : '';
    throw conflict(
      `This SIP is already paused${endStr}. You can extend your pause or resume debits.`
    );
  }

  if (!canTransition(from, to)) {
    throw conflict(`Cannot transition SIP from ${from} to ${to}.`);
  }
}

/**
 * Returns scheduled due dates for a SIP from anchor onwards up to a target count or date.
 */
export function getUpcomingDueDates(
  first: ISODate,
  frequency: Frequency,
  fromDate: ISODate,
  count: number
): ISODate[] {
  const dates: ISODate[] = [];
  for (let n = 0; dates.length < count && n < 5000; n++) {
    const d = nthDueDate(first, frequency, n);
    if (d >= fromDate) {
      dates.push(d);
    }
  }
  return dates;
}

export interface CalculatePauseDatesOptions {
  inFlightFailures?: PaymentFailure[];
  mandateExpiry?: ISODate | null;
}

/**
 * Validates pause request parameters and calculates exact pause start, end, resume dates,
 * and skipped instalments according to PR-E01 through PR-E10.
 */
export function calculatePauseDates(
  req: PauseRequestInput,
  sip: Sip,
  asOf: ISODate,
  options: CalculatePauseDatesOptions = {}
): PauseCalculationResult {
  let startDate = req.startDate ?? asOf;

  if (!isValidISODate(startDate)) {
    throw invalidInput('The pause start date must be a valid ISO date (YYYY-MM-DD).');
  }

  // PR-E01: Pause Start Date in the Past
  if (startDate < asOf) {
    throw invalidInput('Pause start date cannot be in the past. Select today or an upcoming debit date.');
  }

  // PR-E04: Pause Requested While Debit is In-Flight
  let inFlightWarning: string | undefined;
  if (options.inFlightFailures && options.inFlightFailures.length > 0) {
    const pendingToday = options.inFlightFailures.find(
      (f) => !f.resolved && (f.occurredOn === asOf || f.retry.status === 'PENDING')
    );
    if (pendingToday) {
      const formattedAmount = formatINR(pendingToday.amountPaise);
      inFlightWarning = `Today's instalment of ${formattedAmount} is already being processed. Your pause will begin from the next scheduled debit.`;
      // Pause begins from next day / next debit
      if (startDate === asOf) {
        startDate = addDays(asOf, 1);
      }
    }
  }

  let endDate: ISODate | null = null;
  let resumeDate: ISODate | null = null;
  let skippedDueDates: ISODate[] = [];

  if (req.durationMonths !== undefined) {
    // Duration in months (1 to 6)
    if (req.durationMonths < 1 || req.durationMonths > MAX_PAUSE_MONTHS) {
      // PR-E05: Pause Duration Exceeds Platform Cap
      throw invalidInput('SIPs can be paused for up to 6 months at a time. You can resume earlier at any point.');
    }

    const upcoming = getUpcomingDueDates(sip.investmentDate, sip.frequency, startDate, req.durationMonths + 1);
    if (upcoming.length < req.durationMonths) {
      throw invalidInput('Unable to calculate upcoming instalment dates for the selected duration.');
    }

    skippedDueDates = upcoming.slice(0, req.durationMonths);
    resumeDate = upcoming[req.durationMonths]!;
    endDate = addDays(resumeDate, -1);
  } else if (req.endDate !== undefined) {
    if (req.endDate === null) {
      // Open-ended pause ("Until I resume")
      endDate = null;
      resumeDate = null;
      // Skipped instalments in immediate view: upcoming 6 instalments
      skippedDueDates = getUpcomingDueDates(sip.investmentDate, sip.frequency, startDate, 6);
    } else {
      endDate = req.endDate;
      if (!isValidISODate(endDate)) {
        throw invalidInput('The pause end date must be a valid ISO date (YYYY-MM-DD).');
      }

      // PR-E02: End Date Precedes or Equals Start Date
      if (endDate <= startDate) {
        throw invalidInput('Resume date must be at least one day after the pause start date.');
      }

      // PR-E05: Pause Duration Exceeds Platform Cap (6 months)
      if (monthsBetween(startDate, endDate) > MAX_PAUSE_MONTHS || diffDays(startDate, endDate) > 186) {
        throw invalidInput('SIPs can be paused for up to 6 months at a time. You can resume earlier at any point.');
      }

      // Calculate skipped debits within [startDate, endDate]
      const candidates = getUpcomingDueDates(sip.investmentDate, sip.frequency, startDate, 24);
      skippedDueDates = candidates.filter((d) => d <= endDate!);

      const afterEnd = candidates.find((d) => d > endDate!);
      resumeDate = afterEnd ?? addDays(endDate, 1);
    }
  } else {
    // Default duration: 1 month if neither durationMonths nor endDate was given
    const upcoming = getUpcomingDueDates(sip.investmentDate, sip.frequency, startDate, 2);
    skippedDueDates = upcoming.slice(0, 1);
    resumeDate = upcoming[1]!;
    endDate = addDays(resumeDate, -1);
  }

  // PR-E03: Pause Window Covers Zero Debits
  let notice: string | undefined;
  if (endDate !== null && skippedDueDates.length === 0) {
    const nextDebits = getUpcomingDueDates(sip.investmentDate, sip.frequency, asOf, 1);
    const nextDebitDate = nextDebits[0] ?? 'your next debit date';
    notice = `No scheduled instalments fall within this window. Your next debit remains on ${nextDebitDate}.`;
  }

  // PR-E09: Mandate Expires During Pause Window
  let mandateExpiresDuringPause = false;
  let mandateWarning: string | undefined;
  const mandateExpiry = options.mandateExpiry ?? null;
  if (mandateExpiry && resumeDate && mandateExpiry < resumeDate) {
    mandateExpiresDuringPause = true;
    mandateWarning = `Your bank mandate expires on ${mandateExpiry}. You will need to re-authorize Autopay before debits can resume.`;
  }

  return {
    valid: true,
    startDate,
    endDate,
    resumeDate,
    skippedDueDates,
    mandateExpiresDuringPause,
    mandateExpiryDate: mandateExpiry,
    mandateWarning,
    notice,
    inFlightWarning
  };
}

/**
 * Derives current lifecycle state for a SIP and its pause record as of the given date.
 */
export function getPauseLifecycleState(
  sip: Pick<Sip, 'cancelledOn'>,
  pause: Pick<PauseSchedule, 'state' | 'pauseStart' | 'pauseEnd'> | null,
  asOf: ISODate
): PauseLifecycleState {
  if (sip.cancelledOn !== null && sip.cancelledOn <= asOf) {
    return 'CANCELLED';
  }

  if (!pause || pause.state === 'ENDED' || pause.state === 'CANCELLED_BY_USER') {
    return 'ACTIVE';
  }

  if (pause.state === 'SCHEDULED' && pause.pauseStart > asOf) {
    return 'SCHEDULED_PAUSE';
  }

  const isWithinPauseWindow =
    pause.pauseStart <= asOf && (pause.pauseEnd === null || asOf <= pause.pauseEnd);

  if (isWithinPauseWindow) {
    if (pause.pauseEnd !== null && isValidISODate(pause.pauseEnd)) {
      const daysToRestart = diffDays(asOf, pause.pauseEnd) + 1;
      if (daysToRestart <= RESTART_WINDOW_DAYS) {
        return 'RESTART_PENDING';
      }
    }
    return 'PAUSED';
  }

  if (pause.pauseEnd !== null && asOf > pause.pauseEnd) {
    return 'ACTIVE';
  }

  return 'PAUSED';
}
