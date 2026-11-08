import type { PauseSchedule, RestartReminder, Sip } from '@/contracts/domain';
import { DATA_LABEL } from '@/contracts/domain';
import type { CalmReminderMessage } from '@/contracts/pause';
import type { ISODate } from '@/lib/dates';
import { findBannedPhrases } from '@/lib/banned-phrases';

/**
 * Opt-in Non-Urgent Reminder Scheduler (architecture.md Section 4.3.3 & PR-E11, PR-E12, PR-E13).
 * Generates calm, factual reminders offering equal choices without guilt or pressure.
 */

export function generateCalmReminderMessage(
  sip: Sip,
  pause: PauseSchedule,
  reminder: RestartReminder,
  asOf: ISODate
): CalmReminderMessage | null {
  // PR-E11: Strict Invariant: If user did not opt in, 0 outbound communications.
  if (!reminder.optedIn) {
    return null;
  }

  // PR-E13: Pre-send check: If SIP was resumed or cancelled before reminder date, purge reminder silently.
  if (sip.cancelledOn !== null && sip.cancelledOn <= asOf) {
    return null;
  }
  if (pause.state === 'ENDED' || pause.state === 'CANCELLED_BY_USER' || pause.resumedOn !== null) {
    return null;
  }

  const effectiveResumeDate = pause.pauseEnd ?? 'the scheduled date';
  const headline = 'Upcoming SIP restart';
  // PR-E12: Factual tone enforcement:
  // "Your SIP for {{scheme_name}} was scheduled to resume on {{date}}. Choose to resume, extend the pause, or leave it paused."
  const message = `Your SIP for ${sip.schemeName} was scheduled to resume on ${effectiveResumeDate}. Choose to resume, extend the pause, or leave it paused.`;

  // Verify compliance against banned phrase linter
  const violations = findBannedPhrases(headline + ' ' + message);
  if (violations.length > 0) {
    throw new Error(`Compliance violation detected in reminder copy: ${JSON.stringify(violations)}`);
  }

  return {
    sipId: sip.id,
    pauseId: pause.id,
    schemeName: sip.schemeName,
    remindOn: reminder.remindOn ?? effectiveResumeDate,
    headline,
    message,
    actions: [
      { type: 'RESUME', label: 'Resume SIP' },
      { type: 'EXTEND', label: 'Extend pause' },
      { type: 'KEEP_PAUSED', label: 'Keep paused' }
    ],
    channels: reminder.channels,
    optedIn: true,
    isMock: true,
    dataLabel: DATA_LABEL
  };
}

