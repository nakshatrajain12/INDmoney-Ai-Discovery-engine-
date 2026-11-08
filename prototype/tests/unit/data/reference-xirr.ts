import { toMs } from '@/lib/dates';

/**
 * REFERENCE XIRR, deliberately independent of any production code (the Phase 2 engine is built separately and
 * must agree with this). Plain bisection on the net-present-value function with a 365-day year and float math.
 * Returns the annualised rate in percent, or null when no root exists inside [-99.99%, +10,000%].
 */
export interface Flow {
  date: string;
  amount: number; // rupees; investments negative, current value positive
}

export function referenceXirr(flows: Flow[]): number | null {
  if (flows.length < 2) return null;
  const sorted = [...flows].sort((a, b) => toMs(a.date) - toMs(b.date));
  if (!sorted.some((f) => f.amount < 0) || !sorted.some((f) => f.amount > 0)) return null;
  const t0 = toMs(sorted[0]!.date);
  const npv = (r: number) => sorted.reduce((s, f) => s + f.amount / Math.pow(1 + r, (toMs(f.date) - t0) / 86_400_000 / 365), 0);
  let lo = -0.9999;
  let hi = 100;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}
