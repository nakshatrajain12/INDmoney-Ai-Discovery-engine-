import { conflict } from '@/lib/errors';
import type { Instalment, PaymentFailure, Sip } from '@/contracts/domain';
import { DATA_LABEL } from '@/contracts/domain';
import type { ISODate } from '@/lib/dates';
import type { SipDetail } from '@/contracts/api';
import { RetryResult } from '@/contracts/debit';
import { formatINR } from '@/domain/returns/money';
import { lookupDebitRule } from './rules';

// In-memory idempotency cache for DE-E07 (debounces double-clicks and repeated requests)
const idempotencyCache = new Map<string, { result: RetryResult; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

export interface RetryValidationResult {
  eligible: boolean;
  event: PaymentFailure;
  sip: SipDetail;
  instalment: Instalment | null;
}

/**
 * Validates retry eligibility according to edge cases DE-E07 to DE-E10.
 */
export function validateRetryEligibility(
  event: PaymentFailure,
  sip: SipDetail | Pick<Sip, 'id' | 'mandate' | 'cancelledOn'>,
  instalment: Instalment | null
): void {
  const sipObj = 'sip' in sip ? sip.sip : sip;

  // DE-E09: Retry attempt on already settled instalment
  if (event.resolved || (instalment && instalment.status === 'SUCCESS')) {
    throw conflict('This instalment has already been successfully paid. Your account is up to date.');
  }

  // DE-E10: Payment confirmation in-flight
  if (event.retry.status === 'PENDING') {
    throw conflict('Your payment is currently being confirmed by your bank. Status will update shortly.');
  }

  const rule = lookupDebitRule(event.reasonCode);

  // Mandate revoked/rejected: requires new mandate setup
  if (rule.category === 'MANDATE_REJECTED' || sipObj.mandate.status === 'INACTIVE' || sipObj.cancelledOn !== null) {
    throw conflict('This SIP mandate has been revoked. Set up a new Autopay mandate to proceed.');
  }

  // Mandate expired: requires renewal flow
  if (rule.category === 'MANDATE_EXPIRED' || sipObj.mandate.status === 'EXPIRED') {
    throw conflict('Your UPI Autopay mandate has expired. Please re-authorize Autopay.');
  }

  // Bank unavailable: managed via automated retry schedule
  if (rule.category === 'BANK_UNAVAILABLE' && !event.retry.manualRetryAllowed) {
    throw conflict('Automatic retry is scheduled for this bank failure. Manual retry is not available.');
  }

  // General retry permission
  if (!event.retry.manualRetryAllowed && !rule.retryAllowed) {
    throw conflict('Manual retry is not permitted for this failure type.');
  }
}

/**
 * Checks idempotency cache to prevent duplicate charges (DE-E07).
 */
export function checkIdempotency(key?: string): RetryResult | null {
  if (!key) return null;
  const cached = idempotencyCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }
  return null;
}

/**
 * Records successful retry in idempotency cache.
 */
export function recordIdempotency(key: string | undefined, result: RetryResult): void {
  if (!key) return;
  idempotencyCache.set(key, { result, timestamp: Date.now() });
}

/**
 * Pure calculation helper to construct RetryResult payload.
 */
export function buildRetryResult(
  event: PaymentFailure,
  sip: SipDetail | Pick<Sip, 'id'>,
  settledDate: ISODate
): RetryResult {
  const sipId = 'sip' in sip ? sip.sip.id : sip.id;
  const amountFormatted =
    event.amountPaise % 100 === 0
      ? formatINR(event.amountPaise).replace(/\.00$/, '')
      : formatINR(event.amountPaise);

  return RetryResult.parse({
    success: true,
    eventId: event.id,
    sipId,
    instalmentId: event.instalmentId,
    resolvedOn: settledDate,
    newSipStatus: 'ACTIVE',
    message: `Payment of ${amountFormatted} successful. Your instalment has been settled and your SIP is up to date.`,
    isMock: true,
    dataLabel: DATA_LABEL
  });
}
