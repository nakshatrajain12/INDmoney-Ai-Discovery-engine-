import { z } from 'zod';
import { CurrencyPaise, DATA_LABEL, IsoDate, RetryStatus, SipStatus } from './domain';

/**
 * Contracts for Module 2: Rules-Based Debit Explainer (architecture.md Section 4.2 & implementation-plan.md Phase 4).
 * Enforces strict typing for the 7 failure categories, deterministic diagnoses, action triggers, and retry handlers.
 */

export const DebitFailureCategory = z.enum([
  'UPI_DAILY_LIMIT',
  'INSUFFICIENT_FUNDS',
  'BANK_UNAVAILABLE',
  'MANDATE_EXPIRED',
  'MANDATE_REJECTED',
  'NETWORK_TIMEOUT',
  'GENERIC_UNKNOWN'
]);
export type DebitFailureCategory = z.infer<typeof DebitFailureCategory>;

export const DebitStatusChip = z.object({
  label: z.string().min(1),
  variant: z.enum(['emerald', 'amber', 'coral', 'blue']),
  icon: z.enum(['check', 'alert', 'x', 'pause'])
});
export type DebitStatusChip = z.infer<typeof DebitStatusChip>;

export const DebitActionType = z.enum([
  'RETRY_MANUAL',
  'WAIT_AUTO_RETRY',
  'RENEW_MANDATE',
  'NEW_MANDATE',
  'RETRY_OR_SUPPORT',
  'VERIFY_MANDATE',
  'WAIT_NEXT',
  'OPTIONS',
  'SUPPORT'
]);
export type DebitActionType = z.infer<typeof DebitActionType>;

export const DebitAction = z.object({
  type: DebitActionType,
  label: z.string().min(1),
  buttonText: z.string().min(1),
  actionUrl: z.string().optional()
});
export type DebitAction = z.infer<typeof DebitAction>;

export const SecondaryDebitAction = z.object({
  type: DebitActionType,
  label: z.string().min(1),
  actionUrl: z.string().optional()
});
export type SecondaryDebitAction = z.infer<typeof SecondaryDebitAction>;

export const DebitRetryInfo = z.object({
  allowed: z.boolean(),
  status: RetryStatus,
  nextRetryDate: IsoDate.nullable(),
  verified: z.boolean(),
  autoRetryScheduled: z.boolean(),
  message: z.string().optional()
});
export type DebitRetryInfo = z.infer<typeof DebitRetryInfo>;

export const DebitDiagnosis = z.object({
  eventId: z.string().min(1),
  sipId: z.string().min(1),
  instalmentId: z.string().min(1),
  amountPaise: CurrencyPaise,
  amountFormatted: z.string(),
  occurredOn: IsoDate,
  reasonCode: z.string().nullable(),
  providerMessage: z.string().nullable(),
  category: DebitFailureCategory,
  humanReason: z.string().min(1),
  sipStatus: z.string().min(1),
  sipStatusDetail: z.string().min(1),
  statusChip: DebitStatusChip,
  isSipActive: z.boolean(),
  isMandateActive: z.boolean(),
  isMandateRevoked: z.boolean(),
  nextAction: DebitAction,
  secondaryAction: SecondaryDebitAction.nullable().optional(),
  retry: DebitRetryInfo,
  consequenceNotice: z.string().nullable(),
  consecutiveFailures: z.number().int().nonnegative(),
  inFlight: z.boolean().default(false),
  resolved: z.boolean().default(false),
  resolvedOn: IsoDate.nullable().optional(),
  audit: z.object({
    ruleId: z.string().min(1),
    ruleVersion: z.string().min(1),
    evaluatedAt: z.string()
  }),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type DebitDiagnosis = z.infer<typeof DebitDiagnosis>;

export const DebitEventSummary = z.object({
  id: z.string().min(1),
  sipId: z.string().min(1),
  instalmentId: z.string().min(1),
  occurredOn: IsoDate,
  amountPaise: CurrencyPaise,
  amountFormatted: z.string(),
  reasonCode: z.string().nullable(),
  category: DebitFailureCategory,
  humanReason: z.string().min(1),
  statusChip: DebitStatusChip,
  resolved: z.boolean(),
  resolvedOn: IsoDate.nullable(),
  retryAllowed: z.boolean(),
  nextRetryDate: IsoDate.nullable(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type DebitEventSummary = z.infer<typeof DebitEventSummary>;

export const RetryRequest = z.object({
  idempotencyKey: z.string().max(128).optional()
});
export type RetryRequest = z.infer<typeof RetryRequest>;

export const RetryResult = z.object({
  success: z.boolean(),
  eventId: z.string().min(1),
  sipId: z.string().min(1),
  instalmentId: z.string().min(1),
  resolvedOn: IsoDate,
  newSipStatus: SipStatus,
  message: z.string(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type RetryResult = z.infer<typeof RetryResult>;

export const DebitEventIdParam = z.string().regex(/^[a-z0-9_-]{1,64}$/, 'Invalid debit event id');

