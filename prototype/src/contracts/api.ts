import { z } from 'zod';
import { DATA_LABEL, Frequency, IsoDate, Paise, SipBundle, SipStatus } from './domain';

/** API response shapes (all under { requestId, data }). Reused by tests and, later, the frontend. */

export const PersonaSummary = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  userId: z.string(),
  sipCount: z.number().int().positive(),
  asOf: IsoDate,
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type PersonaSummary = z.infer<typeof PersonaSummary>;

export const SipSummary = z.object({
  id: z.string(),
  userId: z.string(),
  schemeName: z.string(),
  category: z.string(),
  frequency: Frequency,
  instalmentAmountPaise: Paise,
  investmentDate: IsoDate,
  lastSuccessfulInstalmentDate: IsoDate.nullable(),
  status: SipStatus,
  asOf: IsoDate,
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type SipSummary = z.infer<typeof SipSummary>;

export const SipDetail = SipBundle.extend({
  status: SipStatus,
  asOf: IsoDate,
  personaKey: z.string(),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type SipDetail = z.infer<typeof SipDetail>;

export const ProviderCapabilities = z.object({
  source: z.literal('MOCK'),
  pauseWithDate: z.boolean(),
  manualRetry: z.boolean(),
  pauseMandate: z.boolean()
});
export type ProviderCapabilities = z.infer<typeof ProviderCapabilities>;

// ---- request validation ----
export const PersonaKeyParam = z.string().regex(/^[a-z0-9-]{1,48}$/, 'Invalid persona key');
export const SipIdParam = z.string().regex(/^[a-z0-9_-]{1,64}$/, 'Invalid SIP id');
export const AsOfParam = IsoDate.optional();
