import { z } from 'zod';
import { isValidISODate } from '@/lib/dates';

/**
 * Domain contracts (docs/architecture.md section 4). Rules:
 *  - money is integer PAISE, never floating point;
 *  - NAV and units are integers scaled by 10,000 (E4) to avoid floating point;
 *  - dates are ISO calendar dates (YYYY-MM-DD) and must be real dates;
 *  - every record is mock data and says so.
 */

export const IsoDate = z.string().refine(isValidISODate, { message: 'Must be a real ISO date (YYYY-MM-DD)' });
export const Paise = z.number().int().nonnegative();
export const E4 = z.number().int().positive();

// Exact integer currency and unit types enforced across all models
export const CurrencyPaise = Paise;
export type CurrencyPaise = number;

export const ScaledNumber = E4;
export type ScaledNumber = number;

export const Frequency = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']);

/** Five user-visible states (owner brief, Phase 5). Derived, never stored; see src/data/status.ts. */
export const SipStatus = z.enum(['ACTIVE', 'PAYMENT_FAILED', 'PAUSED', 'CANCELLED', 'RESTART_PENDING']);
export type SipStatus = z.infer<typeof SipStatus>;

export const DATA_LABEL = 'DEMO DATA' as const;

export const User = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  personaKey: z.string().min(1),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type User = z.infer<typeof User>;

export const Mandate = z.object({
  type: z.enum(['E_MANDATE', 'UPI_AUTOPAY']),
  status: z.enum(['ACTIVE', 'EXPIRED', 'INACTIVE']),
  bankLabel: z.string().min(1) // fictional, masked ("Demo Bank ••4012")
});

export const Sip = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  schemeName: z.string().min(1), // fictional scheme names only
  category: z.string().min(1),
  folioMasked: z.string().min(1),
  investmentDate: IsoDate, // date of the first scheduled instalment (schedule anchor)
  frequency: Frequency,
  instalmentAmountPaise: Paise.refine((n) => n > 0, 'Instalment amount must be positive'),
  mandate: Mandate,
  cancelledOn: IsoDate.nullable(),
  /** Totals as declared by the data source. The Phase 2 engine recomputes them and must agree. */
  declared: z.object({
    totalInvestedPaise: Paise,
    lastSuccessfulInstalmentDate: IsoDate.nullable()
  }),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type Sip = z.infer<typeof Sip>;

export const InstalmentStatus = z.enum(['SUCCESS', 'FAILED', 'PENDING', 'SKIPPED']);
export const Instalment = z.object({
  id: z.string().min(1),
  sipId: z.string().min(1),
  dueDate: IsoDate,
  amountPaise: Paise.refine((n) => n > 0, 'Amount must be positive'),
  status: InstalmentStatus,
  settledOn: IsoDate.nullable(), // set only for SUCCESS
  navE4: E4.nullable(), // illustrative NAV at purchase; null when unavailable
  unitsE4: E4.nullable() // units allocated; null when unavailable or not yet allocated
});
export type Instalment = z.infer<typeof Instalment>;

export const Valuation = z.object({
  sipId: z.string().min(1),
  asOfDate: IsoDate,
  currentValuePaise: Paise.nullable(), // null = unavailable (must not be estimated)
  currentNavE4: E4.nullable(),
  /** Illustrative NAV at each instalment date and today. Not real market data. */
  navHistory: z.array(z.object({ date: IsoDate, navE4: E4 })),
  /** XIRR as shown by the (mock) provider, in basis points; null when not supplied. */
  providerXirrBps: z.number().int().nullable(),
  navSource: z.literal('ILLUSTRATIVE_DEMO')
});
export type Valuation = z.infer<typeof Valuation>;

export const RetryStatus = z.enum(['NONE', 'SCHEDULED', 'PENDING', 'EXHAUSTED']);
export const PaymentFailure = z.object({
  id: z.string().min(1),
  sipId: z.string().min(1),
  instalmentId: z.string().min(1),
  occurredOn: IsoDate,
  amountPaise: Paise.refine((n) => n > 0),
  /** Raw (mock) provider code. May be null or unmapped; the rules engine (Phase 4) maps it, never guesses. */
  reasonCode: z.string().nullable(),
  providerMessage: z.string().nullable(), // masked, verbatim, never paraphrased
  retry: z.object({
    status: RetryStatus,
    nextRetryDate: IsoDate.nullable(),
    /** A retry date may only be shown to the user when verified is true. */
    verified: z.boolean(),
    manualRetryAllowed: z.boolean()
  }),
  resolved: z.boolean(),
  resolvedOn: IsoDate.nullable()
});
export type PaymentFailure = z.infer<typeof PaymentFailure>;

export const PauseState = z.enum(['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED_BY_USER']);
export const PauseSchedule = z.object({
  id: z.string().min(1),
  sipId: z.string().min(1),
  requestedOn: IsoDate,
  pauseStart: IsoDate,
  pauseEnd: IsoDate.nullable(), // null = until the user resumes
  state: PauseState,
  skippedDueDates: z.array(IsoDate),
  resumedOn: IsoDate.nullable(),
  cancelledOn: IsoDate.nullable()
});
export type PauseSchedule = z.infer<typeof PauseSchedule>;

export const ReminderChannel = z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']);
export const RestartReminder = z.object({
  id: z.string().min(1),
  pauseId: z.string().min(1),
  optedIn: z.boolean(),
  remindOn: IsoDate.nullable(),
  channels: z.array(ReminderChannel),
  status: z.enum(['NONE', 'SCHEDULED', 'SENT', 'CANCELLED']),
  sentOn: IsoDate.nullable()
});
export type RestartReminder = z.infer<typeof RestartReminder>;

export const TenureStage = z.enum(['M1', 'M1_3', 'M3_6', 'M6_12', 'OVER_12']);
export type TenureStage = z.infer<typeof TenureStage>;

export const ReturnSituation = z.enum(['POSITIVE', 'SMALL_POSITIVE', 'FLAT', 'SMALL_NEGATIVE', 'NEGATIVE', 'INSUFFICIENT_DATA']);
export type ReturnSituation = z.infer<typeof ReturnSituation>;

/** Output of the Phase 2 deterministic engine. Defined now so the frontend and API can depend on it. */
export const FinancialMetrics = z.object({
  sipId: z.string(),
  asOf: IsoDate,
  investedPaise: Paise,
  currentValuePaise: Paise.nullable(),
  absoluteReturnPaise: z.number().int().nullable(),
  absoluteReturnPct: z.number().nullable(),
  xirrPct: z.number().nullable(),
  xirrStatus: z.enum(['OK', 'UNAVAILABLE_INSUFFICIENT_DATA', 'UNAVAILABLE_NOT_CONVERGED', 'UNAVAILABLE_NO_VALUATION']),
  instalmentsPaid: z.number().int().nonnegative(),
  instalmentsFailed: z.number().int().nonnegative(),
  instalmentsPending: z.number().int().nonnegative(),
  tenureMonths: z.number().int().nonnegative(),
  stage: TenureStage,
  situation: ReturnSituation
});
export type FinancialMetrics = z.infer<typeof FinancialMetrics>;

/** Everything the data layer knows about one SIP. */
export const SipBundle = z.object({
  sip: Sip,
  instalments: z.array(Instalment),
  valuation: Valuation.nullable(),
  failures: z.array(PaymentFailure),
  pause: PauseSchedule.nullable(),
  reminder: RestartReminder.nullable()
});
export type SipBundle = z.infer<typeof SipBundle>;

export const ReturnBand = z.enum(['POSITIVE', 'SMALL_POSITIVE', 'FLAT', 'SMALL_NEGATIVE', 'NEGATIVE', 'UNKNOWN']);
export type ReturnBand = z.infer<typeof ReturnBand>;

/** Declared expectations that the fixture validator and tests check against what the data actually implies. */
export const SipExpectation = z.object({
  status: SipStatus,
  returnBand: ReturnBand,
  anomalies: z.array(z.string())
});
export type SipExpectation = z.infer<typeof SipExpectation>;

export const PersonaFixture = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  asOf: IsoDate,
  tags: z.array(z.string()),
  user: User,
  sips: z.array(SipBundle).min(1),
  expectations: z.record(z.string(), SipExpectation)
});
export type PersonaFixture = z.infer<typeof PersonaFixture>;

// Type aliases aligning with architecture and implementation specifications
export const SipAccount = Sip;
export type SipAccount = Sip;

export const ValuationSnapshot = Valuation;
export type ValuationSnapshot = Valuation;

export const DebitEvent = PaymentFailure;
export type DebitEvent = PaymentFailure;

export const PauseRecord = PauseSchedule;
export type PauseRecord = PauseSchedule;

// SEBI / AMFI Verified Source definition
export const SourcePublisher = z.enum(['AMFI', 'SEBI', 'CRISIL', 'RESERVE_BANK_OF_INDIA']);
export type SourcePublisher = z.infer<typeof SourcePublisher>;

export const VerifiedSource = z.object({
  id: z.string().min(1),
  publisher: SourcePublisher,
  title: z.string().min(1),
  url: z.string().url(),
  publishedDate: IsoDate,
  verifiedDate: IsoDate,
  citationSnippet: z.string().min(1)
});
export type VerifiedSource = z.infer<typeof VerifiedSource>;

// User clarity and non-advice feedback definition
export const Feedback = z.object({
  id: z.string().optional(),
  explanationId: z.string().min(1),
  isClear: z.boolean(),
  feltLikeAdvice: z.boolean(),
  comments: z.string().optional(),
  submittedAt: IsoDate.optional()
});
export type Feedback = z.infer<typeof Feedback>;

