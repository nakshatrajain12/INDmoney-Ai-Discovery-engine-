import { describe, it, expect } from 'vitest';
import type { Instalment } from '@/contracts/domain';
import { BANDS_V1 } from '@/domain/returns/config';
import { investedPaise } from '@/domain/returns/returns';
import { computeTenure, countInstalments, firstSuccessfulDate, settledInstalments, stageFor } from '@/domain/returns/tenure';
import { addDays, addMonths, dueDatesUpTo } from '@/lib/dates';

function inst(n: number, dueDate: string, status: Instalment['status'], amountPaise = 100_000): Instalment {
  return { id: `i${n}`, sipId: 's', dueDate, amountPaise, status, settledOn: status === 'SUCCESS' ? dueDate : null, navE4: null, unitsE4: null };
}

describe('stage boundaries: on, one day before and one day after each boundary', () => {
  const first = '2025-01-15';
  // [boundary in months, stage just below, stage at/after]
  it.each([
    [1, 'M1', 'M1_3'],
    [3, 'M1_3', 'M3_6'],
    [6, 'M3_6', 'M6_12'],
    [12, 'M6_12', 'OVER_12']
  ] as const)('boundary at %s months', (months, below, atOrAfter) => {
    const boundary = addMonths(first, months);
    expect(computeTenure(first, addDays(boundary, -1), BANDS_V1).stage).toBe(below); // one day before
    expect(computeTenure(first, boundary, BANDS_V1).stage).toBe(atOrAfter); // on the boundary: lower bound inclusive
    expect(computeTenure(first, addDays(boundary, 1), BANDS_V1).stage).toBe(atOrAfter); // one day after
    expect(computeTenure(first, boundary, BANDS_V1).months).toBe(months);
    expect(computeTenure(first, addDays(boundary, -1), BANDS_V1).months).toBe(months - 1);
  });

  it('same-day tenure is zero months, stage M1', () => {
    expect(computeTenure('2026-11-08', '2026-11-08', BANDS_V1)).toMatchObject({ months: 0, days: 0, stage: 'M1' });
  });

  it('month-end start dates clamp: 31 Jan + 1 month is 28 Feb (non-leap) and 29 Feb (leap)', () => {
    expect(computeTenure('2026-01-31', '2026-02-27', BANDS_V1).stage).toBe('M1');
    expect(computeTenure('2026-01-31', '2026-02-28', BANDS_V1).stage).toBe('M1_3');
    expect(computeTenure('2024-01-31', '2024-02-28', BANDS_V1).stage).toBe('M1');
    expect(computeTenure('2024-01-31', '2024-02-29', BANDS_V1).stage).toBe('M1_3');
  });

  it('no first instalment, or a first date after as-of, gives tenure 0', () => {
    expect(computeTenure(null, '2026-11-08', BANDS_V1)).toMatchObject({ months: 0, days: 0, stage: 'M1' });
    expect(computeTenure('2026-12-01', '2026-11-08', BANDS_V1)).toMatchObject({ months: 0, days: 0, stage: 'M1' });
  });

  it('stageFor follows the configured lower bounds (config-driven, not hard-coded)', () => {
    const custom = structuredClone(BANDS_V1);
    custom.thresholds.stageLowerBoundMonths.M1_3.value = 2;
    expect(stageFor(1, custom)).toBe('M1');
    expect(stageFor(2, custom)).toBe('M1_3');
    expect(stageFor(1, BANDS_V1)).toBe('M1_3');
  });
});

describe('invested and counts: failed instalments never enter invested', () => {
  const asOf = '2026-11-08';
  const rows: Instalment[] = [
    inst(0, '2026-07-08', 'SUCCESS'),
    inst(1, '2026-08-08', 'FAILED'),
    inst(2, '2026-09-08', 'SUCCESS'),
    inst(3, '2026-10-08', 'SKIPPED'),
    inst(4, '2026-11-08', 'PENDING')
  ];
  it('sums only successful instalments', () => {
    expect(investedPaise(rows, asOf)).toBe(200_000);
    expect(settledInstalments(rows, asOf).map((r) => r.id)).toEqual(['i0', 'i2']);
  });
  it('counts each status', () => {
    expect(countInstalments(rows, asOf)).toEqual({ paid: 2, failed: 1, pending: 1, skipped: 1 });
  });
  it('a SUCCESS that settles after as-of is not counted yet', () => {
    const later: Instalment = { ...inst(9, '2026-11-20', 'SUCCESS'), settledOn: '2026-11-20' };
    expect(investedPaise([...rows, later], asOf)).toBe(200_000);
    expect(investedPaise([...rows, later], '2026-11-20')).toBe(300_000);
  });
  it('a SUCCESS with no settlement date is not counted (cannot place it in time)', () => {
    const broken: Instalment = { ...inst(9, '2026-09-30', 'SUCCESS'), settledOn: null };
    expect(investedPaise([broken], asOf)).toBe(0);
  });
  it('a FAILED, PENDING or SKIPPED row never counts even if corrupt data gives it a settlement date', () => {
    for (const status of ['FAILED', 'PENDING', 'SKIPPED'] as const) {
      const corrupt: Instalment = { ...inst(9, '2026-09-30', status), settledOn: '2026-09-30' };
      expect(investedPaise([corrupt], asOf), status).toBe(0);
      expect(settledInstalments([corrupt], asOf), status).toEqual([]);
    }
  });
  it('first successful date is the earliest settlement, ignoring failures', () => {
    expect(firstSuccessfulDate(settledInstalments(rows, asOf))).toBe('2026-07-08');
    expect(firstSuccessfulDate([])).toBeNull();
    const failedFirst = [inst(0, '2026-01-01', 'FAILED'), inst(1, '2026-02-01', 'SUCCESS')];
    expect(firstSuccessfulDate(settledInstalments(failedFirst, asOf))).toBe('2026-02-01');
  });
});

describe('frequencies: counts and tenure for daily, weekly, monthly and quarterly SIPs', () => {
  const asOf = '2026-11-08';
  const build = (first: string, freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY') => dueDatesUpTo(first, freq, asOf).map((d, i) => inst(i, d, 'SUCCESS'));
  it.each([
    ['DAILY', '2026-11-04', 5, 'M1', 0, 4],
    ['WEEKLY', '2026-10-18', 4, 'M1', 0, 21],
    ['MONTHLY', '2026-05-08', 7, 'M6_12', 6, 184],
    ['QUARTERLY', '2025-11-08', 5, 'OVER_12', 12, 365],
    ['QUARTERLY', '2026-02-08', 4, 'M6_12', 9, 273]
  ] as const)('%s from %s: %s instalments, stage %s', (freq, first, count, stage, months, days) => {
    const rows = build(first, freq);
    expect(countInstalments(rows, asOf).paid).toBe(count);
    expect(investedPaise(rows, asOf)).toBe(count * 100_000);
    const t = computeTenure(firstSuccessfulDate(settledInstalments(rows, asOf)), asOf, BANDS_V1);
    expect(t).toMatchObject({ stage, months, days });
  });
});
