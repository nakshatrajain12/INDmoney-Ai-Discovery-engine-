import type { Instalment } from '@/contracts/domain';
import type { ISODate } from '@/lib/dates';
import { pctE2, pctE4, sumPaise } from './money';
import { settledInstalments } from './tenure';

/** Invested = sum of successful instalments only. Failed, pending and skipped never count. */
export function investedPaise(instalments: readonly Instalment[], asOf: ISODate): number {
  return sumPaise(settledInstalments(instalments, asOf).map((i) => i.amountPaise));
}

export interface AbsoluteReturn {
  paise: number;
  /** Hundredths of a percent, half away from zero. What the user sees. */
  pctE2: number;
  /** Ten-thousandths of a percent. Stored precision. */
  pctE4: number;
}

/** A = V - I and A% = A / I. Returns null when there is no basis (I <= 0) or no valuation (V unavailable); never estimates. */
export function absoluteReturn(invested: number, currentValue: number | null): AbsoluteReturn | null {
  if (currentValue === null || invested <= 0) return null;
  const a = currentValue - invested;
  return { paise: a, pctE2: pctE2(a, invested), pctE4: pctE4(a, invested) };
}
