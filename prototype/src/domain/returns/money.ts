/**
 * Money is integer PAISE. Percentages are integers too (hundredths or ten-thousandths of a percent), computed with
 * BigInt so no floating point ever touches a rupee figure or a classification boundary.
 * Rounding rule: half away from zero (so +0.005 rounds to 0.01 and -0.005 rounds to -0.01). One rule, used everywhere.
 */
export function assertPaise(n: number, label = 'amount'): number {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${label} must be an integer number of paise, got ${n}`);
  return n;
}

export function sumPaise(values: readonly number[]): number {
  let t = 0n;
  for (const v of values) t += BigInt(assertPaise(v));
  const n = Number(t);
  assertPaise(n, 'sum');
  return n;
}

/** Integer division rounding half away from zero. d must be positive. */
export function divRoundHalfAway(n: bigint, d: bigint): bigint {
  if (d <= 0n) throw new RangeError('divisor must be positive');
  const neg = n < 0n;
  const a = neg ? -n : n;
  const q = (2n * a + d) / (2n * d);
  return neg ? -q : q;
}

/** (numerator / denominator) as a percentage, scaled by 10^scale, rounded half away from zero. */
function pctScaled(numeratorPaise: number, denominatorPaise: number, scale: number): number {
  if (denominatorPaise <= 0) throw new RangeError('denominator must be positive');
  const n = BigInt(assertPaise(numeratorPaise)) * 100n * 10n ** BigInt(scale);
  return Number(divRoundHalfAway(n, BigInt(denominatorPaise)));
}
/** Percent in hundredths of a percent: 4.30% = 430. This is the figure the user sees, and the one bands compare. */
export const pctE2 = (num: number, den: number): number => pctScaled(num, den, 2);
/** Percent in ten-thousandths of a percent, stored precision. */
export const pctE4 = (num: number, den: number): number => pctScaled(num, den, 4);

function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** "₹1,23,456.78"; negatives "-₹1,234.00"; showPlus adds "+" to positives. Used by the Phase 3 placeholder renderer too. */
export function formatINR(paise: number, opts: { showPlus?: boolean } = {}): string {
  assertPaise(paise);
  const neg = paise < 0;
  const a = BigInt(neg ? -paise : paise);
  const rupees = (a / 100n).toString();
  const frac = (a % 100n).toString().padStart(2, '0');
  const sign = neg ? '-' : opts.showPlus && paise > 0 ? '+' : '';
  return `${sign}₹${groupIndian(rupees)}.${frac}`;
}

/** "4.30%" from hundredths of a percent; showPlus adds "+" to positives. */
export function formatPctE2(v: number, opts: { showPlus?: boolean } = {}): string {
  assertPaise(v, 'percent');
  const neg = v < 0;
  const a = Math.abs(v);
  const sign = neg ? '-' : opts.showPlus && v > 0 ? '+' : '';
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}%`;
}
