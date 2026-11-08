import { z } from 'zod';
import raw from '@/rules/bands.v1.json';

const T = <S extends z.ZodTypeAny>(v: S) => z.object({ value: v, status: z.enum(['PROPOSED', 'OWNER_APPROVED']) }).passthrough();

export const BandsConfig = z.object({
  version: z.string(),
  reviewStatus: z.enum(['PROPOSED_PENDING_OWNER_REVIEW', 'OWNER_APPROVED']),
  setBy: z.string(),
  why: z.string(),
  thresholds: z.object({
    flatBandPct: T(z.number().positive()),
    negativeAtOrBelowPct: T(z.number().negative()),
    positiveAtOrAbovePct: T(z.number().positive()),
    minInstalmentsForClassification: T(z.number().int().positive()),
    stageLowerBoundMonths: z.object({
      M1_3: T(z.number().int().positive()),
      M3_6: T(z.number().int().positive()),
      M6_12: T(z.number().int().positive()),
      OVER_12: T(z.number().int().positive())
    }),
    shortPeriodXirrBelowMonths: T(z.number().int().positive()),
    providerXirrToleranceBps: T(z.number().nonnegative())
  }),
  xirrSolver: z.object({
    dayCountBasis: z.literal(365),
    lowerRate: z.number().gt(-1).lt(0),
    upperRate: z.number().positive(),
    tolerance: z.string(),
    maxIterations: z.number().int().positive(),
    precisionDigits: z.number().int().min(20)
  })
});
export type BandsConfig = z.infer<typeof BandsConfig>;

/** Parsed and validated once. A malformed rules file fails loudly at load time, never silently at run time. */
export const BANDS_V1: BandsConfig = BandsConfig.parse(raw);

export function validateBands(c: BandsConfig): string[] {
  const t = c.thresholds;
  const s = t.stageLowerBoundMonths;
  const out: string[] = [];
  if (!(s.M1_3.value < s.M3_6.value && s.M3_6.value < s.M6_12.value && s.M6_12.value < s.OVER_12.value)) out.push('stage boundaries must be strictly increasing');
  if (!(t.negativeAtOrBelowPct.value < -t.flatBandPct.value)) out.push('negative cut-off must be below the flat band');
  if (!(t.positiveAtOrAbovePct.value > t.flatBandPct.value)) out.push('positive cut-off must be above the flat band');
  return out;
}
