import type { PauseSchedule, PaymentFailure, Sip, SipStatus } from '@/contracts/domain';
import { diffDays, isValidISODate, type ISODate } from '@/lib/dates';

/**
 * One function decides the user-visible SIP status, so every screen and API agrees.
 * [A] RESTART_PENDING means: the SIP is paused with a chosen restart date that is within
 * RESTART_WINDOW_DAYS. The brief names the state but does not define it; this definition is recorded
 * in docs/decisions.md (D-11) and was APPROVED by the owner on 2026-11-08. Keep it identical in the data model,
 * business logic, frontend labels and tests.
 */
export const RESTART_WINDOW_DAYS = 14;

/**
 * Precedence (highest first):
 *  CANCELLED  >  PAUSED / RESTART_PENDING  >  PAYMENT_FAILED  >  ACTIVE
 * A failed instalment never makes a paused or cancelled SIP look "failed", and a pause is never
 * confused with a payment failure. A pause only counts while today is inside [pauseStart, pauseEnd]
 * (open-ended pauses count until the user resumes); after pauseEnd the SIP is back to ACTIVE or PAYMENT_FAILED.
 */
export function deriveSipStatus(
  sip: Pick<Sip, 'cancelledOn'>,
  failures: ReadonlyArray<Pick<PaymentFailure, 'resolved'>>,
  pause: Pick<PauseSchedule, 'state' | 'pauseStart' | 'pauseEnd'> | null,
  asOf: ISODate
): SipStatus {
  if (sip.cancelledOn !== null && sip.cancelledOn <= asOf) return 'CANCELLED';

  const pauseLive =
    pause !== null &&
    (pause.state === 'ACTIVE' || pause.state === 'SCHEDULED') &&
    pause.pauseStart <= asOf &&
    (pause.pauseEnd === null || asOf <= pause.pauseEnd);

  if (pauseLive && pause) {
    // D-11 (owner-approved): RESTART_PENDING needs a live pause AND a present, valid restart date
    // (a real date, not before the pause start) that is RESTART_WINDOW_DAYS or fewer calendar days away.
    // Open-ended pauses and reminders never qualify; a reminder is not an input to this function.
    if (pause.pauseEnd !== null && isValidISODate(pause.pauseEnd) && pause.pauseEnd >= pause.pauseStart) {
      const daysToRestart = diffDays(asOf, pause.pauseEnd) + 1; // pauseEnd is the last paused day
      if (daysToRestart <= RESTART_WINDOW_DAYS) return 'RESTART_PENDING';
    }
    return 'PAUSED';
  }

  if (failures.some((f) => !f.resolved)) return 'PAYMENT_FAILED';
  return 'ACTIVE';
}
