import type { BandsConfig } from './config';

export type Situation = 'POSITIVE' | 'SMALL_POSITIVE' | 'FLAT' | 'SMALL_NEGATIVE' | 'NEGATIVE' | 'INSUFFICIENT_DATA';

/**
 * Situation from A% (the displayed, 2 dp figure, so the label can never contradict the number the user sees),
 * plus instalment count. Cut-offs come from rules/bands.v1.json. Fewer than the configured minimum of successful
 * instalments, or no A%, gives INSUFFICIENT_DATA.
 *   pct <= negativeAtOrBelow          NEGATIVE
 *   negativeAtOrBelow < pct <= -flat  SMALL_NEGATIVE
 *   -flat < pct < +flat               FLAT
 *   +flat <= pct < positiveAtOrAbove  SMALL_POSITIVE
 *   pct >= positiveAtOrAbove          POSITIVE
 */
export function classify(input: { absolutePctE2: number | null; instalmentsPaid: number }, cfg: BandsConfig): Situation {
  const t = cfg.thresholds;
  if (input.absolutePctE2 === null || input.instalmentsPaid < t.minInstalmentsForClassification.value) return 'INSUFFICIENT_DATA';
  const p = input.absolutePctE2;
  const flat = Math.round(t.flatBandPct.value * 100);
  const neg = Math.round(t.negativeAtOrBelowPct.value * 100);
  const pos = Math.round(t.positiveAtOrAbovePct.value * 100);
  if (p <= neg) return 'NEGATIVE';
  if (p <= -flat) return 'SMALL_NEGATIVE';
  if (p < flat) return 'FLAT';
  if (p < pos) return 'SMALL_POSITIVE';
  return 'POSITIVE';
}
