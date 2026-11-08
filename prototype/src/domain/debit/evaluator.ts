import type { PaymentFailure, Sip } from '@/contracts/domain';
import { DATA_LABEL } from '@/contracts/domain';
import {
  DebitAction,
  DebitDiagnosis,
  type DebitFailureCategory,
  type DebitRetryInfo,
  type DebitStatusChip
} from '@/contracts/debit';
import { formatINR } from '@/domain/returns/money';
import { DEBIT_RULES, GENERIC_UNKNOWN_RULE, lookupDebitRule, type DebitRuleItem } from './rules';

export interface EvaluateDebitOptions {
  allFailures?: ReadonlyArray<PaymentFailure>;
  asOf?: string;
}

/**
 * Checks for conflicting bank signals (DE-E06 in docs/edge-case.md):
 * e.g. Reason code indicates INSUFFICIENT_FUNDS but providerMessage states BANK_DOWN/SERVER_UNAVAILABLE,
 * or code indicates technical/bank failure but message indicates insufficient funds.
 */
function detectConflictingSignals(reasonCode: string | null, providerMessage: string | null): boolean {
  if (!reasonCode || !providerMessage) return false;

  const codeNorm = reasonCode.toUpperCase();
  const msgNorm = providerMessage.toUpperCase();

  const isFundCode = codeNorm.includes('INSUFFICIENT') || codeNorm.includes('BALANCE');
  const isTechnicalMsg =
    msgNorm.includes('BANK') && (msgNorm.includes('DOWN') || msgNorm.includes('RESPOND') || msgNorm.includes('UNAVAILABLE')) ||
    msgNorm.includes('TECHNICAL') || msgNorm.includes('GATEWAY');

  if (isFundCode && isTechnicalMsg) return true;

  const isTechnicalCode =
    codeNorm.includes('BANK') || codeNorm.includes('SERVER') || codeNorm.includes('TECHNICAL') || codeNorm.includes('TIMEOUT');
  const isFundMsg = msgNorm.includes('INSUFFICIENT') || msgNorm.includes('BALANCE');

  if (isTechnicalCode && isFundMsg) return true;

  return false;
}

/**
 * Calculates consecutive unresolved failure count up to this event.
 */
function countConsecutiveFailures(event: PaymentFailure, allFailures?: ReadonlyArray<PaymentFailure>): number {
  if (!allFailures || allFailures.length === 0) return 1;

  // Filter unresolved failures up to and including the current event date
  const sorted = [...allFailures]
    .filter((f) => !f.resolved && f.occurredOn <= event.occurredOn)
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));

  return Math.max(1, sorted.length);
}

/**
 * Pure, deterministic Debit Explainer evaluation engine (Phase 4).
 * Enforces zero LLM calls, deterministic reason mapping, strict mandate verification,
 * and confirms active SIP status on standard payment failures.
 */
export function evaluateDebitEvent(
  event: PaymentFailure,
  sip: Pick<Sip, 'id' | 'mandate' | 'cancelledOn'>,
  options: EvaluateDebitOptions = {}
): DebitDiagnosis {
  const amountFormatted =
    event.amountPaise % 100 === 0
      ? formatINR(event.amountPaise).replace(/\.00$/, '')
      : formatINR(event.amountPaise);

  const hasConflict = detectConflictingSignals(event.reasonCode, event.providerMessage);

  // Initial rule lookup
  const rule: DebitRuleItem = hasConflict
    ? GENERIC_UNKNOWN_RULE
    : lookupDebitRule(event.reasonCode);

  let category: DebitFailureCategory = rule.category;
  let humanReason = rule.humanReason;

  // DE-E06: If conflicting signals detected, safe fallback message
  if (hasConflict) {
    category = 'GENERIC_UNKNOWN';
    humanReason = 'We encountered an unconfirmed status from your bank. Your SIP remains active.';
  }

  // Derive active / cancelled state
  // KEY RULE: A failed debit NEVER displays the SIP as cancelled unless the mandate is explicitly revoked/cancelled.
  const isMandateExplicitlyRevoked =
    category === 'MANDATE_REJECTED' ||
    sip.mandate.status === 'INACTIVE' ||
    (sip.cancelledOn !== null && (options.asOf ? sip.cancelledOn <= options.asOf : true));

  const isMandateExpired =
    category === 'MANDATE_EXPIRED' || sip.mandate.status === 'EXPIRED';

  let isSipActive = !isMandateExplicitlyRevoked && !isMandateExpired;
  let isMandateActive = !isMandateExplicitlyRevoked && !isMandateExpired;
  const isMandateRevoked = isMandateExplicitlyRevoked;

  let sipStatus = rule.sipStatusImpact;
  let sipStatusDetail = rule.sipStatusDetail;
  let statusChip: DebitStatusChip = { ...rule.statusChip };

  if (isMandateRevoked) {
    sipStatus = 'Cancelled by Bank';
    sipStatusDetail = 'The bank mandate has been revoked. Future automatic debits cannot proceed under this mandate.';
    statusChip = { label: 'Mandate Cancelled by Bank', variant: 'coral', icon: 'x' };
    isSipActive = false;
    isMandateActive = false;
  } else if (isMandateExpired) {
    sipStatus = 'Attention Required';
    sipStatusDetail = 'Your Autopay mandate has expired. Upcoming instalments are paused until re-authorized.';
    statusChip = { label: 'Attention Required', variant: 'amber', icon: 'alert' };
    isSipActive = false;
    isMandateActive = false;
  } else {
    // Standard failure: ALWAYS ACTIVE
    isSipActive = true;
    isMandateActive = true;
    sipStatus = 'Active · 1 failed instalment';
    statusChip = { label: 'Active · 1 failed instalment', variant: 'amber', icon: 'alert' };
  }

  // DE-E10: Payment confirmation in-flight
  const inFlight = event.retry.status === 'PENDING';

  // DE-E08 / Auto-retry schedule
  const autoRetryScheduled = event.retry.status === 'SCHEDULED';
  let retryMessage: string | undefined;

  if (autoRetryScheduled && event.retry.verified && event.retry.nextRetryDate) {
    retryMessage = `Automated retry scheduled for ${event.retry.nextRetryDate}.`;
  } else if (inFlight) {
    retryMessage = 'Your payment is currently being confirmed by your bank. Status will update shortly.';
  }

  // Determine manual retry capability
  const manualRetryAllowed =
    !inFlight &&
    !isMandateRevoked &&
    !isMandateExpired &&
    rule.retryAllowed &&
    event.retry.manualRetryAllowed;

  const retryInfo: DebitRetryInfo = {
    allowed: manualRetryAllowed,
    status: event.retry.status,
    nextRetryDate: event.retry.verified ? event.retry.nextRetryDate : null,
    verified: event.retry.verified,
    autoRetryScheduled,
    message: retryMessage
  };

  // Next action determination
  let nextAction: DebitAction = {
    type: rule.nextAction.type,
    label: rule.nextAction.label,
    buttonText: rule.nextAction.buttonText.replace('{{amount}}', amountFormatted)
  };

  let consequenceNotice: string | null = rule.consequenceNotice;
  const consecutiveFailures = countConsecutiveFailures(event, options.allFailures);

  // DE-E11: 3+ Consecutive failures
  if (consecutiveFailures >= 3 && isMandateActive) {
    consequenceNotice =
      '3 consecutive instalments have failed. Re-authenticate your bank mandate to prevent automatic cancellation.';
    nextAction = {
      type: 'VERIFY_MANDATE',
      label: 'Verify Bank Mandate',
      buttonText: 'Verify Bank Mandate'
    };
  }

  // If already resolved (e.g. debit-recovered persona)
  if (event.resolved) {
    statusChip = { label: 'Resolved · Paid', variant: 'emerald', icon: 'check' };
    nextAction = {
      type: 'WAIT_NEXT',
      label: 'Instalment settled',
      buttonText: 'Instalment settled'
    };
    sipStatus = 'Active · Up to date';
    sipStatusDetail = 'This failed instalment has been successfully recovered and settled.';
  }

  const diagnosis: DebitDiagnosis = {
    eventId: event.id,
    sipId: sip.id,
    instalmentId: event.instalmentId,
    amountPaise: event.amountPaise,
    amountFormatted,
    occurredOn: event.occurredOn,
    reasonCode: event.reasonCode ?? null,
    providerMessage: event.providerMessage ?? null,
    category,
    humanReason,
    sipStatus,
    sipStatusDetail,
    statusChip,
    isSipActive,
    isMandateActive,
    isMandateRevoked,
    nextAction,
    secondaryAction: rule.secondaryAction ?? null,
    retry: retryInfo,
    consequenceNotice,
    consecutiveFailures,
    inFlight,
    resolved: event.resolved,
    resolvedOn: event.resolvedOn ?? null,
    audit: {
      ruleId: rule.ruleId,
      ruleVersion: DEBIT_RULES.version,
      evaluatedAt: options.asOf ?? '2026-11-08'
    },
    isMock: true,
    dataLabel: DATA_LABEL
  };

  return DebitDiagnosis.parse(diagnosis);
}
