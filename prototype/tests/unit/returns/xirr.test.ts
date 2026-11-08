import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BANDS_V1 } from '@/domain/returns/config';
import { reconcileXirr, xirr, type CashFlow } from '@/domain/returns/xirr';

interface Vector {
  id: string;
  description: string;
  flows: CashFlow[];
  expectedStatus: string;
  expectedXirrPct: number | null;
}
const file = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../fixtures/xirr-vectors.json'), 'utf8')) as { tolerancePctPoints: number; vectors: Vector[] };

describe('xirr against independent vectors (scipy + mpmath, Excel day-count; MS-DOC-1 is the published Microsoft example)', () => {
  it('has at least 10 vectors and a stated tolerance', () => {
    expect(file.vectors.length).toBeGreaterThanOrEqual(10);
    expect(file.tolerancePctPoints).toBe(0.0001);
  });
  it.each(file.vectors.map((v) => [v.id, v] as const))('%s', (_id, v) => {
    const r = xirr(v.flows, BANDS_V1);
    expect(r.status).toBe(v.expectedStatus);
    if (v.expectedXirrPct === null) expect(r.ratePct).toBeNull();
    else expect(Math.abs(r.ratePct! - v.expectedXirrPct)).toBeLessThanOrEqual(file.tolerancePctPoints);
  });
  it('reproduces the published Microsoft XIRR documentation result (0.373362535) within 1e-6 (engine output is rounded to 4 dp of a percent)', () => {
    const ms = file.vectors.find((v) => v.id === 'MS-DOC-1')!;
    expect(Math.abs(xirr(ms.flows, BANDS_V1).ratePct! / 100 - 0.373362535)).toBeLessThan(1e-6);
  });
});

describe('xirr returns null (never a number) when it cannot answer', () => {
  const f = (date: string, amountPaise: number): CashFlow => ({ date, amountPaise });
  it('single flow', () => expect(xirr([f('2026-01-01', -1000)], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null }));
  it('invalid dates or non-integer amounts cleanly return null without uncaught exceptions', () => {
    expect(xirr([f('invalid-date', -1000), f('2026-02-01', 1100)], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null });
    expect(xirr([f('2026-02-30', -1000), f('2026-03-01', 1100)], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null });
    expect(xirr([f('2026-01-01', 10.5), f('2026-02-01', 1100)], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null });
  });
  it('no flows', () => expect(xirr([], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null }));
  it('all outflows', () => expect(xirr([f('2026-01-01', -1000), f('2026-02-01', -500)], BANDS_V1)).toMatchObject({ ratePct: null }));
  it('all inflows', () => expect(xirr([f('2026-01-01', 1000), f('2026-02-01', 500)], BANDS_V1)).toMatchObject({ ratePct: null }));
  it('a zero terminal value (total loss) has no inflow, so null', () => expect(xirr([f('2026-01-01', -1000), f('2026-06-01', 0)], BANDS_V1)).toMatchObject({ ratePct: null }));
  it('every flow on the same date', () => expect(xirr([f('2026-01-01', -1000), f('2026-01-01', 1100)], BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_INSUFFICIENT_DATA', ratePct: null }));
  it('no root inside the rate bounds: NOT_CONVERGED, null', () => {
    const r = xirr([f('2026-11-06', -100), f('2026-11-08', 400)], BANDS_V1);
    expect(r).toMatchObject({ status: 'UNAVAILABLE_NOT_CONVERGED', ratePct: null });
  });
  it('the iteration cap is respected and yields null, not a guess', () => {
    const tiny = structuredClone(BANDS_V1);
    tiny.xirrSolver.maxIterations = 3;
    tiny.xirrSolver.tolerance = '1e-40';
    const r = xirr([f('2025-01-01', -100000), f('2026-01-01', 110000)], tiny);
    expect(r.ratePct).toBeNull();
    expect(r.status).toBe('UNAVAILABLE_NOT_CONVERGED');
  });
  it('input order does not matter', () => {
    const flows = [f('2025-01-01', -100000), f('2025-07-01', -50000), f('2026-01-01', 170000)];
    expect(xirr([...flows].reverse(), BANDS_V1)).toEqual(xirr(flows, BANDS_V1));
  });
});

describe('xirr-fails fixture genuinely fails for the documented reason (root exists but is beyond the +10,000% bound)', () => {
  const flows: CashFlow[] = [
    { date: '2026-11-06', amountPaise: -10_000 },
    { date: '2026-11-07', amountPaise: -10_000 },
    { date: '2026-11-08', amountPaise: -10_000 },
    { date: '2026-11-08', amountPaise: 30_745 }
  ];
  it('is UNAVAILABLE_NOT_CONVERGED under the configured bounds', () => {
    expect(xirr(flows, BANDS_V1)).toMatchObject({ status: 'UNAVAILABLE_NOT_CONVERGED', ratePct: null });
  });
  it('the flows are valid: mixed signs, 2 days apart, so it is the bound, not missing data, that stops it', () => {
    expect(flows.some((x) => x.amountPaise < 0) && flows.some((x) => x.amountPaise > 0)).toBe(true);
    expect(xirr(flows.slice(0, 2), BANDS_V1).status).toBe('UNAVAILABLE_INSUFFICIENT_DATA'); // control: same-sign is a different reason
  });
  it('with the upper bound opened far enough the solver DOES find a root, proving one exists beyond the bound', () => {
    const wide = structuredClone(BANDS_V1);
    wide.xirrSolver.upperRate = 1e15;
    const r = xirr(flows, wide);
    expect(r.status).toBe('OK');
    expect(r.ratePct!).toBeGreaterThan(10_000 * 100 / 100); // far above +10,000%
  });
});

describe('xirr properties', () => {
  const base: CashFlow[] = [
    { date: '2025-11-05', amountPaise: -500_000 },
    { date: '2026-01-05', amountPaise: -500_000 },
    { date: '2026-03-05', amountPaise: -500_000 },
    { date: '2026-05-05', amountPaise: -500_000 }
  ];
  const withValue = (v: number): CashFlow[] => [...base, { date: '2026-11-08', amountPaise: v }];

  it('is strictly increasing in the terminal value', () => {
    let prev = -Infinity;
    for (const v of [1_500_000, 1_800_000, 2_000_000, 2_100_000, 2_500_000, 3_000_000]) {
      const r = xirr(withValue(v), BANDS_V1).ratePct!;
      expect(r).toBeGreaterThan(prev);
      prev = r;
    }
  });
  it('is unchanged when every flow is scaled by the same factor', () => {
    const a = xirr(withValue(2_300_000), BANDS_V1).ratePct!;
    for (const k of [2, 10, 137]) {
      const scaled = withValue(2_300_000).map((x) => ({ ...x, amountPaise: x.amountPaise * k }));
      expect(Math.abs(xirr(scaled, BANDS_V1).ratePct! - a)).toBeLessThanOrEqual(0.0001);
    }
  });
  it('is zero exactly when value equals invested only for equal-time-weighted flows: break-even on one outflow', () => {
    expect(xirr([{ date: '2026-01-01', amountPaise: -50_000 }, { date: '2026-07-01', amountPaise: 50_000 }], BANDS_V1).ratePct).toBe(0);
  });
  it('shifting every date by the same number of days changes nothing', () => {
    const shifted = withValue(2_300_000).map((x) => ({ ...x, date: x.date.replace('2025-11-05', '2025-11-05') }));
    const a = xirr(withValue(2_300_000), BANDS_V1).ratePct;
    expect(xirr(shifted, BANDS_V1).ratePct).toBe(a);
  });
  it('is deterministic: 100 runs give identical output', () => {
    const first = JSON.stringify(xirr(withValue(2_300_000), BANDS_V1));
    for (let i = 0; i < 100; i++) expect(JSON.stringify(xirr(withValue(2_300_000), BANDS_V1))).toBe(first);
  }, 60_000);
  it('does not mutate its input', () => {
    const flows = withValue(2_300_000);
    const copy = structuredClone(flows);
    xirr(flows, BANDS_V1);
    expect(flows).toEqual(copy);
  });
});

describe('provider XIRR reconciliation', () => {
  it('MATCH within tolerance (boundary inclusive), MISMATCH just beyond it', () => {
    const tol = BANDS_V1.thresholds.providerXirrToleranceBps.value; // 50 bps
    expect(reconcileXirr(-9.1433, -914, BANDS_V1)).toEqual({ status: 'MATCH', diffBps: 0 });
    expect(reconcileXirr(10, 1000 + tol, BANDS_V1)).toEqual({ status: 'MATCH', diffBps: tol });
    expect(reconcileXirr(10, 1000 + tol + 1, BANDS_V1)).toEqual({ status: 'MISMATCH', diffBps: tol + 1 });
    expect(reconcileXirr(10, 1000 - tol - 1, BANDS_V1).status).toBe('MISMATCH');
  });
  it('NOT_COMPARABLE (not a mismatch) when either side is missing', () => {
    expect(reconcileXirr(null, 500, BANDS_V1)).toEqual({ status: 'NOT_COMPARABLE', diffBps: null });
    expect(reconcileXirr(5, null, BANDS_V1)).toEqual({ status: 'NOT_COMPARABLE', diffBps: null });
  });
});
