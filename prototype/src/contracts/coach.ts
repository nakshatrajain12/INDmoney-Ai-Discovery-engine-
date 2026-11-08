import { z } from 'zod';
import { DATA_LABEL, IsoDate, TenureStage, ReturnSituation, VerifiedSource, CurrencyPaise } from './domain';

/**
 * Coach contracts for Return Coach (docs/architecture.md Section 4.1 & Phase 3).
 * Enforces strict typing for 3-block narrative, terms, sources, confidence, and non-advice refusal.
 */

export const CoachIntent = z.enum([
  'EXPLAIN_RETURN',
  'EXPLAIN_TERM',
  'WHAT_IS_NORMAL',
  'ADVICE_SEEKING'
]);
export type CoachIntent = z.infer<typeof CoachIntent>;

export const FiguresBlock = z.object({
  investedPaise: CurrencyPaise,
  investedFormatted: z.string(),
  currentValuePaise: CurrencyPaise.nullable(),
  currentValueFormatted: z.string().nullable(),
  absoluteReturnPaise: z.number().int().nullable(),
  absoluteReturnFormatted: z.string().nullable(),
  absoluteReturnPct: z.number().nullable(),
  absoluteReturnPctFormatted: z.string().nullable(),
  xirrPct: z.number().nullable(),
  xirrFormatted: z.string().nullable(),
  instalmentsPaid: z.number().int().nonnegative(),
  tenureMonths: z.number().int().nonnegative(),
  stage: TenureStage,
  situation: ReturnSituation,
  summaryText: z.string()
});
export type FiguresBlock = z.infer<typeof FiguresBlock>;

export const NarrativeBlock = z.object({
  title: z.string(),
  body: z.string(),
  keyTakeaway: z.string().optional()
});
export type NarrativeBlock = z.infer<typeof NarrativeBlock>;

export const ThreeBlockNarrative = z.object({
  figures: FiguresBlock,
  means: NarrativeBlock,
  doesNotMean: NarrativeBlock
});
export type ThreeBlockNarrative = z.infer<typeof ThreeBlockNarrative>;

export const TermKey = z.enum([
  'XIRR',
  'ABSOLUTE_RETURN',
  'NAV',
  'VOLATILITY',
  'UNREALISED_RETURN'
]);
export type TermKey = z.infer<typeof TermKey>;

export const TermDefinition = z.object({
  key: TermKey,
  title: z.string(),
  shortDefinition: z.string(),
  fullExplanation: z.string(),
  formula: z.string().nullable(),
  shortPeriodNote: z.string().nullable(),
  source: VerifiedSource.nullable()
});
export type TermDefinition = z.infer<typeof TermDefinition>;

export const EducationalLink = z.object({
  label: z.string(),
  url: z.string().url()
});
export type EducationalLink = z.infer<typeof EducationalLink>;

export const RefusalDetail = z.object({
  reason: z.literal('INVESTMENT_ADVICE_REQUESTED'),
  message: z.string(),
  educationalLinks: z.array(EducationalLink)
});
export type RefusalDetail = z.infer<typeof RefusalDetail>;

export const ConfidenceResultSchema = z.object({
  label: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  reasons: z.array(z.string())
});
export type ConfidenceResultSchema = z.infer<typeof ConfidenceResultSchema>;

export const CoachResponse = z.object({
  sipId: z.string(),
  asOf: IsoDate,
  isRefusal: z.boolean(),
  refusal: RefusalDetail.nullable(),
  disclaimer: z.string(),
  blocks: ThreeBlockNarrative.nullable(),
  termDefinitions: z.array(TermDefinition),
  sources: z.array(VerifiedSource),
  confidence: ConfidenceResultSchema,
  audit: z.object({
    templateId: z.string(),
    latencyMs: z.number().int().nonnegative(),
    rephraseStatus: z.enum(['DETERMINISTIC_DEFAULT', 'REPHRASED', 'FALLBACK', 'LLM_DISABLED']).optional(),
    model: z.string().optional(),
    validationIssues: z.array(z.string()).optional()
  }),
  isMock: z.literal(true),
  dataLabel: z.literal(DATA_LABEL)
});
export type CoachResponse = z.infer<typeof CoachResponse>;

export const CoachRequest = z.object({
  intent: CoachIntent.optional().default('EXPLAIN_RETURN'),
  prompt: z.string().max(500).optional(),
  termKey: TermKey.optional(),
  asOf: IsoDate.optional()
});
export type CoachRequest = z.infer<typeof CoachRequest>;
