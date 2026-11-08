import { z } from 'zod';
import {
  CurrencyPaise,
  DATA_LABEL,
  IsoDate,
  ReminderChannel,
  RestartReminder,
  PauseSchedule,
  PauseState,
  SipStatus
} from './domain';

/**
 * Contracts for Module 3: Pause & Restart State Machine (architecture.md Section 4.3 & implementation-plan.md Phase 5).
 * Enforces strict typing for Options Comparison (Pause vs Reduce vs Cancel),
 * Pause lifecycle states, date validation, and calm non-urgent restart reminders.
 */

export const PauseIdParam = z.string().regex(/^[a-z0-9_-]{1,64}$/, 'Invalid pause id');

// ==================== 1. Options Comparison ====================

export const OptionChoice = z.enum(['PAUSE', 'REDUCE', 'CANCEL']);
export type OptionChoice = z.infer<typeof OptionChoice>;

export const OptionConsequences = z.object({
  whatHappens: z.string().min(1),
  mandateStatus: z.string().min(1),
  existingInvestments: z.string().min(1),
  penalties: z.string().min(1),
  resumption: z.string().min(1)
});
export type OptionConsequences = z.infer<typeof OptionConsequences>;

export const OptionsComparisonItem = z.object({
  type: OptionChoice,
  title: z.string().min(1),
  subtitle: z.string().min(1),
  badge: z.string().optional(),
  consequences: OptionConsequences,
  primaryAction: z.object({
    label: z.string().min(1),
    actionUrl: z.string().min(1)
  })
});
export type OptionsComparisonItem = z.infer<typeof OptionsComparisonItem>;

export const OptionsComparisonPayload = z.object({
  sipId: z.string().min(1),
  schemeName: z.string().min(1),
  currentAmountPaise: CurrencyPaise,
  minimumAmountPaise: CurrencyPaise,
  nextScheduledDebit: IsoDate.nullable(),
  mandateStatus: z.string().min(1),
  options: z.array(OptionsComparisonItem).length(3),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type OptionsComparisonPayload = z.infer<typeof OptionsComparisonPayload>;

// ==================== 2. Pause Lifecycle State Machine ====================

export const PauseLifecycleState = z.enum([
  'ACTIVE',
  'SCHEDULED_PAUSE',
  'PAUSED',
  'RESTART_PENDING',
  'RESUMED',
  'CANCELLED'
]);
export type PauseLifecycleState = z.infer<typeof PauseLifecycleState>;

export const PauseDurationPreset = z.enum(['1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', 'CUSTOM', 'OPEN_ENDED']);
export type PauseDurationPreset = z.infer<typeof PauseDurationPreset>;

export const PauseRequest = z.object({
  startDate: IsoDate.optional(),
  endDate: IsoDate.nullable().optional(),
  durationMonths: z.number().int().min(1).max(6, 'SIPs can be paused for up to 6 months at a time. You can resume earlier at any point.').optional(),
  optInReminder: z.boolean().default(false),
  reminderDate: IsoDate.optional(),
  reminderChannels: z.array(ReminderChannel).optional().default(['IN_APP'])
});
export type PauseRequest = z.infer<typeof PauseRequest>;
export type PauseRequestInput = z.input<typeof PauseRequest>;

export const PauseCalculationResult = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
  startDate: IsoDate,
  endDate: IsoDate.nullable(),
  resumeDate: IsoDate.nullable(),
  skippedDueDates: z.array(IsoDate),
  mandateExpiresDuringPause: z.boolean(),
  mandateExpiryDate: IsoDate.nullable().optional(),
  mandateWarning: z.string().optional(),
  notice: z.string().optional(),
  inFlightWarning: z.string().optional()
});
export type PauseCalculationResult = z.infer<typeof PauseCalculationResult>;

export const PauseResponse = z.object({
  pause: PauseSchedule,
  reminder: RestartReminder.nullable(),
  status: SipStatus,
  lifecycleState: PauseLifecycleState,
  message: z.string(),
  mandateWarning: z.string().optional(),
  inFlightWarning: z.string().optional(),
  undoExpiresAt: z.string().optional(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type PauseResponse = z.infer<typeof PauseResponse>;

export const ResumeRequest = z.object({
  resumeDate: IsoDate.optional()
});
export type ResumeRequest = z.infer<typeof ResumeRequest>;

export const ResumeResponse = z.object({
  sipId: z.string().min(1),
  pauseId: z.string().min(1),
  previousState: PauseState,
  resumedOn: IsoDate,
  status: SipStatus,
  lifecycleState: PauseLifecycleState,
  message: z.string(),
  nextDebitDate: IsoDate.nullable(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type ResumeResponse = z.infer<typeof ResumeResponse>;

// ==================== 3. Calm Restart Reminder ====================

export const CalmReminderAction = z.object({
  type: z.enum(['RESUME', 'EXTEND', 'KEEP_PAUSED']),
  label: z.string().min(1)
});
export type CalmReminderAction = z.infer<typeof CalmReminderAction>;

export const CalmReminderMessage = z.object({
  sipId: z.string().min(1),
  pauseId: z.string().min(1),
  schemeName: z.string().min(1),
  remindOn: IsoDate,
  headline: z.string().min(1),
  message: z.string().min(1),
  actions: z.array(CalmReminderAction),
  channels: z.array(ReminderChannel),
  optedIn: z.boolean(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type CalmReminderMessage = z.infer<typeof CalmReminderMessage>;
