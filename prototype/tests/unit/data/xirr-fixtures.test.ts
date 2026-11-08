import { describe, it, expect } from 'vitest';
import { PERSONAS, FIXTURE_AS_OF } from '@/data/mock/fixtures';
import { referenceXirr, type Flow } from './reference-xirr';

const flowsFor = (key: string): Flow[] => {
  const b = PERSONAS.find((p) => p.key === key)!.sips[0]!;
  const paid = b.instalments.filter((i) => i.status === 'SUCCESS');
  return [
    ...paid.map((i) => ({ date: i.settledOn!, amount: -i.amountPaise / 100 })),
    { date: FIXTURE_AS_OF, amount: b.valuation!.currentValuePaise! / 100 }
  ];
};

describe('reference XIRR (independent of production code)', () => {
  it('solves a textbook case: one investment of 100 grows to 110 in exactly one year', () => {
    expect(referenceXirr([{ date: '2025-11-08', amount: -100 }, { date: '2026-11-08', amount: 110 }])).toBeCloseTo(10, 6);
  });

  it('returns null with a single flow, same-sign flows or no valuation', () => {
    expect(referenceXirr([{ date: '2026-11-08', amount: -100 }])).toBeNull();
    expect(referenceXirr([{ date: '2026-10-08', amount: -100 }, { date: '2026-11-08', amount: -50 }])).toBeNull();
    expect(referenceXirr([{ date: '2026-10-08', amount: 100 }, { date: '2026-11-08', amount: 50 }])).toBeNull();
  });

  it('a zero-elapsed-time case has no root', () => {
    expect(referenceXirr([{ date: '2026-11-08', amount: -100 }, { date: '2026-11-08', amount: 101 }])).toBeNull();
  });
});

describe('XIRR facts the fixtures rely on', () => {
  it.each([
    ['early-flat', -914],
    ['positive', 1660],
    ['long-tenure', 727]
  ])('%s: the provider XIRR (%i bp) equals the independently solved value within 1 bp', (key, bps) => {
    const b = PERSONAS.find((p) => p.key === key)!.sips[0]!;
    expect(b.valuation!.providerXirrBps).toBe(bps);
    const x = referenceXirr(flowsFor(key));
    expect(x).not.toBeNull();
    expect(Math.abs(x! * 100 - bps)).toBeLessThan(1);
  });

  it('xirr-fails: the annualised return lies outside any sensible bound, so there is no solution to report', () => {
    expect(referenceXirr(flowsFor('xirr-fails'))).toBeNull();
    const b = PERSONAS.find((p) => p.key === 'xirr-fails')!.sips[0]!;
    const invested = b.sip.declared.totalInvestedPaise;
    const value = b.valuation!.currentValuePaise!;
    expect(((value - invested) / invested) * 100).toBeGreaterThan(2); // a plain +2.5% move, nothing exotic
  });

  it('new-month-1: XIRR is mathematically solvable but the history is too short to explain (the engine must not use it)', () => {
    const x = referenceXirr(flowsFor('new-month-1'));
    expect(x).not.toBeNull();
    expect(PERSONAS.find((p) => p.key === 'new-month-1')!.sips[0]!.instalments).toHaveLength(1);
  });

  it('inconsistent-xirr: the provider figure has the opposite sign to the independently solved one', () => {
    const b = PERSONAS.find((p) => p.key === 'inconsistent-xirr')!.sips[0]!;
    const x = referenceXirr(flowsFor('inconsistent-xirr'))!;
    expect(x).toBeLessThan(0);
    expect(b.valuation!.providerXirrBps!).toBeGreaterThan(0);
  });

  it('missing-valuation: XIRR cannot be computed because there is no value', () => {
    const b = PERSONAS.find((p) => p.key === 'missing-valuation')!.sips[0]!;
    expect(b.valuation!.currentValuePaise).toBeNull();
  });
});
