import Decimal from 'decimal.js';
import { diffDays, isValidISODate, type ISODate } from '@/lib/dates';
import type { BandsConfig } from './config';

export interface CashFlow {
  date: ISODate;
  /** Integer paise. Money out of the investor's pocket is negative; the terminal value is positive. */
  amountPaise: number;
}

export type XirrStatus = 'OK' | 'UNAVAILABLE_INSUFFICIENT_DATA' | 'UNAVAILABLE_NOT_CONVERGED';

export interface XirrResult {
  status: XirrStatus;
  /** Annualised rate in percent, 4 dp, or null. Null is never replaced by an estimate. */
  ratePct: number | null;
  iterations: number;
}

/**
 * XIRR: the rate r with sum(c_i / (1 + r)^((d_i - d_0)/365)) = 0, solved with Decimal arithmetic by a bracketed
 * Newton iteration that falls back to bisection whenever a Newton step would leave the bracket, so it cannot diverge.
 * The search is limited to the configured rate range (default -99.99% to +10,000%). Returns null when
 *  - there are fewer than 2 flows, no outflow, no inflow, invalid dates, or every flow falls on one date (INSUFFICIENT_DATA), or
 *  - no root lies inside the range, or the iteration cap is hit (NOT_CONVERGED).
 */
export function xirr(flows: readonly CashFlow[], cfg: BandsConfig): XirrResult {
  const none = (status: XirrStatus, iterations = 0): XirrResult => ({ status, ratePct: null, iterations });
  if (flows.length < 2) return none('UNAVAILABLE_INSUFFICIENT_DATA');
  if (flows.some((f) => !isValidISODate(f.date) || !Number.isSafeInteger(f.amountPaise))) {
    return none('UNAVAILABLE_INSUFFICIENT_DATA');
  }
  if (!flows.some((f) => f.amountPaise < 0) || !flows.some((f) => f.amountPaise > 0)) return none('UNAVAILABLE_INSUFFICIENT_DATA');

  const D = Decimal.clone({ precision: cfg.xirrSolver.precisionDigits });
  const sorted = [...flows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const d0 = sorted[0]!.date;
  if (sorted.every((f) => f.date === d0)) return none('UNAVAILABLE_INSUFFICIENT_DATA');

  const terms = sorted.map((f) => ({ c: new D(f.amountPaise), t: new D(diffDays(d0, f.date)).div(cfg.xirrSolver.dayCountBasis) }));
  const one = new D(1);
  const f = (r: Decimal): Decimal => terms.reduce((s, x) => s.plus(x.c.mul(one.plus(r).pow(x.t.neg()))), new D(0));
  const df = (r: Decimal): Decimal => terms.reduce((s, x) => s.plus(x.c.mul(x.t.neg()).mul(one.plus(r).pow(x.t.neg().minus(1)))), new D(0));

  let lo = new D(cfg.xirrSolver.lowerRate);
  let hi = new D(cfg.xirrSolver.upperRate);
  const tol = new D(cfg.xirrSolver.tolerance);
  const flo = f(lo);
  const fhi = f(hi);
  const done = (r: Decimal, n: number): XirrResult => ({
    status: 'OK',
    ratePct: r.mul(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    iterations: n
  });
  if (flo.isZero()) return done(lo, 0);
  if (fhi.isZero()) return done(hi, 0);
  if (flo.isPositive() === fhi.isPositive()) return none('UNAVAILABLE_NOT_CONVERGED');

  const loPositive = flo.isPositive();
  let x = lo.plus(hi).div(2);
  for (let i = 1; i <= cfg.xirrSolver.maxIterations; i++) {
    const fx = f(x);
    if (fx.isZero()) return done(x, i);
    if (fx.isPositive() === loPositive) lo = x;
    else hi = x;
    if (hi.minus(lo).lt(tol)) return done(lo.plus(hi).div(2), i);
    const d = df(x);
    let next: Decimal | null = d.isZero() ? null : x.minus(fx.div(d));
    if (next === null || next.lte(lo) || next.gte(hi)) next = lo.plus(hi).div(2);
    x = next;
  }
  return none('UNAVAILABLE_NOT_CONVERGED', cfg.xirrSolver.maxIterations);
}

export type Reconciliation =
  | { status: 'MATCH'; diffBps: number }
  | { status: 'MISMATCH'; diffBps: number }
  | { status: 'NOT_COMPARABLE'; diffBps: null };

/** Compares our XIRR with the provider's (basis points). Needs both; otherwise NOT_COMPARABLE, which is not a mismatch. */
export function reconcileXirr(computedPct: number | null, providerBps: number | null, cfg: BandsConfig): Reconciliation {
  if (computedPct === null || providerBps === null) return { status: 'NOT_COMPARABLE', diffBps: null };
  const diff = Math.abs(Math.round(computedPct * 100) - providerBps);
  return { status: diff > cfg.thresholds.providerXirrToleranceBps.value ? 'MISMATCH' : 'MATCH', diffBps: diff };
}
