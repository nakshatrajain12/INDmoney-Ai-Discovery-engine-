import { describe, it, expect } from 'vitest';
import { computeConfidence, type ConfidenceInput } from '@/domain/confidence/confidence';
import { classify } from '@/domain/returns/classify';
import { BANDS_V1, BandsConfig, validateBands } from '@/domain/returns/config';

describe('rules/bands.v1.json', () => {
  it('parses, is internally consistent, and is honestly labelled as awaiting owner review', () => {
    expect(validateBands(BANDS_V1)).toEqual([]);
    expect(BANDS_V1.reviewStatus).toBe('PROPOSED_PENDING_OWNER_REVIEW');
    expect(BANDS_V1.setBy).toMatch(/NOT yet reviewed by the owner/);
    expect(BANDS_V1.why).toMatch(/NOT research findings/);
  });
  it('every threshold carries a status, and none claims owner approval yet', () => {
    const t = BANDS_V1.thresholds;
    const all = [t.flatBandPct, t.negativeAtOrBelowPct, t.positiveAtOrAbovePct, t.minInstalmentsForClassification, ...Object.values(t.stageLowerBoundMonths), t.shortPeriodXirrBelowMonths, t.providerXirrToleranceBps];
    for (const x of all) expect(x.status).toBe('PROPOSED');
  });
  it('rejects malformed rules', () => {
    const bad = structuredClone(BANDS_V1) as unknown as Record<string, unknown>;
    (bad.thresholds as Record<string, unknown>).flatBandPct = { value: -1, status: 'PROPOSED' };
    expect(BandsConfig.safeParse(bad).success).toBe(false);
    const unordered = structuredClone(BANDS_V1);
    unordered.thresholds.stageLowerBoundMonths.M3_6.value = 9;
    expect(validateBands(unordered)).toContain('stage boundaries must be strictly increasing');
  });
});

describe('classify: band boundaries use the displayed 2 dp figure (hundredths of a percent)', () => {
  const c = (pct: number | null, paid = 6) => classify({ absolutePctE2: pct, instalmentsPaid: paid }, BANDS_V1);
  it.each([
    [-1181, 'NEGATIVE'],
    [-501, 'NEGATIVE'],
    [-500, 'NEGATIVE'], // -5.00% is at the cut-off: NEGATIVE
    [-499, 'SMALL_NEGATIVE'],
    [-51, 'SMALL_NEGATIVE'],
    [-50, 'SMALL_NEGATIVE'], // -0.50% is at the flat edge: SMALL_NEGATIVE
    [-49, 'FLAT'],
    [0, 'FLAT'],
    [49, 'FLAT'],
    [50, 'SMALL_POSITIVE'], // +0.50% is at the flat edge: SMALL_POSITIVE
    [499, 'SMALL_POSITIVE'],
    [500, 'POSITIVE'], // +5.00% is at the cut-off: POSITIVE
    [765, 'POSITIVE']
  ] as const)('A%% = %s hundredths -> %s', (pct, want) => {
    expect(c(pct)).toBe(want);
  });
  it('INSUFFICIENT_DATA with no A% or too few instalments', () => {
    expect(c(null)).toBe('INSUFFICIENT_DATA');
    expect(c(430, 1)).toBe('INSUFFICIENT_DATA');
    expect(c(430, 0)).toBe('INSUFFICIENT_DATA');
    expect(c(430, 2)).toBe('SMALL_POSITIVE');
  });
  it('is config-driven', () => {
    const custom = structuredClone(BANDS_V1);
    custom.thresholds.flatBandPct.value = 1;
    expect(classify({ absolutePctE2: 75, instalmentsPaid: 6 }, custom)).toBe('FLAT');
    expect(c(75)).toBe('SMALL_POSITIVE');
  });
});

const ok: ConfidenceInput = {
  figuresComplete: true,
  ruleMatched: true,
  xirrNeeded: true,
  xirrAvailable: true,
  xirrMismatch: false,
  verifiedSourceCount: 1,
  validation: 'TEMPLATE_PATH',
  outOfScope: false,
  generalEducationOnly: false
};

describe('confidence: table-driven per docs/architecture.md section 6.4', () => {
  it.each([
    ['everything present, template path', {}, 'HIGH'],
    ['validator passed', { validation: 'PASSED' }, 'HIGH'],
    ['XIRR not needed and missing', { xirrNeeded: false, xirrAvailable: false }, 'HIGH'],
    ['several sources', { verifiedSourceCount: 3 }, 'HIGH'],
    ['XIRR mismatch', { xirrMismatch: true }, 'MEDIUM'],
    ['XIRR needed but missing', { xirrAvailable: false }, 'MEDIUM'],
    ['general education only', { generalEducationOnly: true }, 'MEDIUM'],
    ['mismatch and missing XIRR', { xirrMismatch: true, xirrAvailable: false }, 'MEDIUM'],
    ['figures incomplete', { figuresComplete: false }, 'LOW'],
    ['no rule matched (insufficient data situation)', { ruleMatched: false }, 'LOW'],
    ['no verified source', { verifiedSourceCount: 0 }, 'LOW'],
    ['out of scope', { outOfScope: true }, 'LOW'],
    ['validator failed', { validation: 'FAILED' }, 'LOW'],
    ['LOW beats MEDIUM: mismatch plus no source', { xirrMismatch: true, verifiedSourceCount: 0 }, 'LOW'],
    ['LOW beats MEDIUM: education only plus failed validator', { generalEducationOnly: true, validation: 'FAILED' }, 'LOW']
  ] as const)('%s -> %s', (_name, patch, label) => {
    expect(computeConfidence({ ...ok, ...patch }).label).toBe(label);
  });

  it('reasons explain the label', () => {
    expect(computeConfidence(ok).reasons).toEqual(['FIGURES_COMPLETE', 'RULE_MATCHED', 'SOURCE_ATTACHED', 'VALIDATED']);
    expect(computeConfidence({ ...ok, xirrMismatch: true }).reasons).toEqual(['XIRR_MISMATCH']);
    expect(computeConfidence({ ...ok, figuresComplete: false, verifiedSourceCount: 0 }).reasons).toEqual(['INSUFFICIENT_DATA', 'NO_VERIFIED_SOURCE']);
  });

  it('exhaustive: all 2^7 boolean/threshold combinations follow the precedence rule (LOW > MEDIUM > HIGH)', () => {
    const bools = [true, false];
    for (const figuresComplete of bools)
      for (const ruleMatched of bools)
        for (const xirrAvailable of bools)
          for (const xirrMismatch of bools)
            for (const hasSource of bools)
              for (const outOfScope of bools)
                for (const generalEducationOnly of bools)
                  for (const validation of ['PASSED', 'TEMPLATE_PATH', 'FAILED'] as const) {
                    const input: ConfidenceInput = { figuresComplete, ruleMatched, xirrNeeded: true, xirrAvailable, xirrMismatch, verifiedSourceCount: hasSource ? 1 : 0, validation, outOfScope, generalEducationOnly };
                    const low = !figuresComplete || !ruleMatched || !hasSource || outOfScope || validation === 'FAILED';
                    const medium = xirrMismatch || !xirrAvailable || generalEducationOnly;
                    expect(computeConfidence(input).label).toBe(low ? 'LOW' : medium ? 'MEDIUM' : 'HIGH');
                  }
  });
});
