import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { PersonaFixture, SipBundle } from '@/contracts/domain';
import { PERSONAS } from '@/data/mock/fixtures';
import { deriveSipStatus, RESTART_WINDOW_DAYS } from '@/data/status';
import { BANDS_V1 } from '@/domain/returns/config';
import { computeMetrics } from '@/domain/returns/engine';

const persona = (key: string): PersonaFixture => PERSONAS.find((p) => p.key === key)!;
const run = (key: string, n = 0) => {
  const p = persona(key);
  return computeMetrics(p.sips[n]!, p.asOf);
};

/**
 * Hand calculation for ten personas. Figures are integer paise, taken from the raw instalments and valuation of each
 * fixture, and the divisions were re-done by hand (A% = A / I x 100, rounded half away from zero to 2 dp).
 * They were also confirmed by tests/fixtures/verify_personas.py, an independent Python implementation.
 * NOTE: the NAVs behind these values are illustrative demo numbers, never market data.
 */
describe('ten personas: invested, value and absolute return match hand calculation (mock data, illustrative NAVs)', () => {
  it.each([
    // persona, invested, value, A, A% in hundredths, paid, situation
    ['positive', 1_800_000, 1_878_082, 78_082, 434, 6, 'SMALL_POSITIVE'], // 78,082 / 1,800,000 = 4.3379%
    ['early-flat', 2_500_000, 2_444_952, -55_048, -220, 5, 'SMALL_NEGATIVE'], // -2.20192%
    ['negative-large', 2_400_000, 2_116_662, -283_338, -1181, 6, 'NEGATIVE'], // -11.80575%
    ['flat-zero', 800_000, 800_000, 0, 0, 4, 'FLAT'],
    ['new-month-1', 100_000, 99_839, -161, -16, 1, 'INSUFFICIENT_DATA'], // -0.161%, but one instalment
    ['two-instalments', 400_000, 393_606, -6_394, -160, 2, 'SMALL_NEGATIVE'], // -1.5985%
    ['long-tenure', 4_200_000, 4_388_226, 188_226, 448, 14, 'SMALL_POSITIVE'], // 4.4816%
    ['quarterly', 2_400_000, 2_418_000, 18_000, 75, 4, 'SMALL_POSITIVE'], // 0.75%
    ['debit-recovered', 2_000_000, 1_972_577, -27_423, -137, 5, 'SMALL_NEGATIVE'], // -1.37115%
    ['cashflow-pause', 3_500_000, 3_359_156, -140_844, -402, 7, 'SMALL_NEGATIVE'] // -4.0241%
  ] as const)('%s', (key, invested, value, a, pct2, paid, situation) => {
    const { metrics: m, detail: d } = run(key);
    expect(m.investedPaise).toBe(invested);
    expect(m.currentValuePaise).toBe(value);
    expect(m.absoluteReturnPaise).toBe(a);
    expect(m.absoluteReturnPaise).toBe(value - invested);
    expect(d.absolutePctE2).toBe(pct2);
    expect(m.instalmentsPaid).toBe(paid);
    expect(m.situation).toBe(situation);
  });
});

describe('all 30 personas (32 SIPs)', () => {
  const all = PERSONAS.flatMap((p) => p.sips.map((b) => ({ p, b, r: computeMetrics(b, p.asOf) })));

  it('covers every persona and SIP', () => {
    expect(PERSONAS).toHaveLength(30);
    expect(all).toHaveLength(32);
  });
  it('invested equals the sum of SUCCESS instalments only; failed, pending and skipped never enter it', () => {
    for (const { b, r } of all) {
      const sum = b.instalments.filter((i) => i.status === 'SUCCESS').reduce((a, i) => a + i.amountPaise, 0);
      expect(r.metrics.investedPaise, b.sip.id).toBe(sum);
    }
    const f = run('debit-insufficient-balance').metrics;
    expect(f.instalmentsFailed).toBe(1);
    expect(f.investedPaise).toBe(1_600_000); // 16,000 from 4 paid; the failed 4,000 is not in it
  });
  it('the engine agrees with the totals declared by the data source (no DECLARED_INVESTED_MISMATCH)', () => {
    for (const { b, r } of all) expect(r.detail.flags, b.sip.id).not.toContain('DECLARED_INVESTED_MISMATCH');
  });
  it('every money field is an integer number of paise; nothing is a float', () => {
    for (const { b, r } of all) {
      const m = r.metrics;
      for (const v of [m.investedPaise, m.currentValuePaise, m.absoluteReturnPaise]) if (v !== null) expect(Number.isInteger(v), b.sip.id).toBe(true);
    }
  });
  it('is deterministic: the same input gives identical output 100 times', () => {
    const p = persona('multi-sip');
    const first = JSON.stringify(p.sips.map((b) => computeMetrics(b, p.asOf)));
    for (let i = 0; i < 100; i++) expect(JSON.stringify(p.sips.map((b) => computeMetrics(b, p.asOf)))).toBe(first);
  }, 60_000);
  it('does not mutate its input', () => {
    const p = structuredClone(persona('early-flat'));
    const before = JSON.stringify(p);
    computeMetrics(p.sips[0]!, p.asOf);
    expect(JSON.stringify(p)).toBe(before);
  });
  it('every result says it is mock data and carries the illustrative-NAV label (or none)', () => {
    for (const { b, r } of all) {
      expect(r.detail.isMock).toBe(true);
      expect(['ILLUSTRATIVE_DEMO', null], b.sip.id).toContain(r.detail.valuationSource);
    }
    expect(run('early-flat').detail.valuationSource).toBe('ILLUSTRATIVE_DEMO');
  });
});

describe('the engine does not depend on invented NAV (never treated as market data)', () => {
  it('scrambling every NAV, unit count and NAV-history entry changes nothing', () => {
    for (const p of PERSONAS)
      for (const b of p.sips) {
        const scrambled: SipBundle = structuredClone(b);
        scrambled.instalments.forEach((i, n) => {
          if (i.navE4 !== null) i.navE4 = 7 + n;
          if (i.unitsE4 !== null) i.unitsE4 = 3 + n;
        });
        if (scrambled.valuation) {
          scrambled.valuation.navHistory = [];
          if (scrambled.valuation.currentNavE4 !== null) scrambled.valuation.currentNavE4 = 999_999;
        }
        expect(computeMetrics(scrambled, p.asOf), b.sip.id).toEqual(computeMetrics(b, p.asOf));
      }
  });
  it('source scan: domain/returns and domain/confidence never reference NAV, units or NAV history', () => {
    const dirs = ['src/domain/returns', 'src/domain/confidence'].map((d) => path.resolve(__dirname, '../../..', d));
    const files = dirs.flatMap((d) => fs.readdirSync(d).map((f) => path.join(d, f)));
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const f of files) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/navE4|unitsE4|navHistory|currentNavE4/);
  });
  it('source scan: no floating-point money helpers (toFixed, parseFloat) in the returns engine', () => {
    const dir = path.resolve(__dirname, '../../../src/domain/returns');
    for (const f of fs.readdirSync(dir)) expect(fs.readFileSync(path.join(dir, f), 'utf8'), f).not.toMatch(/\.toFixed\(|parseFloat\(/);
  });
});

describe('data-quality handling: never estimate', () => {
  it('missing valuation: value, return, XIRR all unavailable, INSUFFICIENT_DATA, flagged', () => {
    const { metrics: m, detail: d } = run('missing-valuation');
    expect(m).toMatchObject({ currentValuePaise: null, absoluteReturnPaise: null, absoluteReturnPct: null, xirrPct: null, xirrStatus: 'UNAVAILABLE_NO_VALUATION', situation: 'INSUFFICIENT_DATA' });
    expect(m.investedPaise).toBe(1_200_000);
    expect(d.flags).toContain('VALUATION_MISSING');
  });
  it('a valuation dated other than the as-of date is not mixed in: treated as unavailable and flagged', () => {
    const p = persona('early-flat');
    const stale = structuredClone(p.sips[0]!);
    stale.valuation!.asOfDate = '2026-11-01';
    const r = computeMetrics(stale, p.asOf);
    expect(r.metrics.currentValuePaise).toBeNull();
    expect(r.metrics.xirrStatus).toBe('UNAVAILABLE_NO_VALUATION');
    expect(r.detail.flags).toContain('VALUATION_DATE_MISMATCH');
  });
  it('a zero current value against money invested is suspect data (RC-E2d): flagged, unavailable, never shown as -100%', () => {
    const p = persona('early-flat');
    const zero = structuredClone(p.sips[0]!);
    zero.valuation!.currentValuePaise = 0;
    const r = computeMetrics(zero, p.asOf);
    expect(r.detail.flags).toContain('VALUATION_SUSPECT');
    expect(r.metrics).toMatchObject({ currentValuePaise: null, absoluteReturnPaise: null, absoluteReturnPct: null, xirrPct: null, xirrStatus: 'UNAVAILABLE_NO_VALUATION', situation: 'INSUFFICIENT_DATA' });
    expect(r.metrics.investedPaise).toBe(2_500_000);
  });
  it('xirr-fails: XIRR unavailable for the documented reason (rate beyond bounds), but the return is still computed', () => {
    const { metrics: m } = run('xirr-fails');
    expect(m.xirrStatus).toBe('UNAVAILABLE_NOT_CONVERGED');
    expect(m.xirrPct).toBeNull();
    expect(m.investedPaise).toBe(30_000);
    expect(m.absoluteReturnPaise).toBe(745); // 307.45 - 300.00
  });
  it('inconsistent-xirr: provider XIRR disagrees, so xirrMismatch is set and the provider figure is kept, not replaced', () => {
    const { metrics: m, detail: d } = run('inconsistent-xirr');
    expect(d.xirrMismatch).toBe(true);
    expect(d.providerXirrBps).toBe(412);
    expect(m.xirrPct).toBeLessThan(0); // we do not adopt the provider's positive figure
    expect(d.flags).toContain('XIRR_PROVIDER_MISMATCH');
  });
  it('personas with provider XIRR that is consistent reconcile as MATCH (positive, early-flat, long-tenure)', () => {
    for (const k of ['positive', 'early-flat', 'long-tenure']) expect(run(k).detail.reconciliation.status, k).toBe('MATCH');
  });
  it('missing provider XIRR is NOT_COMPARABLE, never a mismatch', () => {
    const d = run('missing-xirr').detail;
    expect(d.reconciliation.status).toBe('NOT_COMPARABLE');
    expect(d.xirrMismatch).toBe(false);
  });
  it('short-period XIRR is flagged under 12 months and not at or over 12 months', () => {
    expect(run('early-flat').detail.xirrAnnualisedShortPeriod).toBe(true);
    expect(run('long-tenure').detail.xirrAnnualisedShortPeriod).toBe(false);
  });
  it('cancelled SIP with a late failure still reports figures from successful instalments only', () => {
    const { metrics: m } = run('cancelled-with-failure');
    expect(m.instalmentsFailed).toBeGreaterThanOrEqual(1);
    expect(m.investedPaise).toBe(1_600_000);
  });
  it('config-driven: changing the flat band changes situations without code changes', () => {
    const p = persona('quarterly'); // +0.75%
    const wide = structuredClone(BANDS_V1);
    wide.thresholds.flatBandPct.value = 1;
    expect(computeMetrics(p.sips[0]!, p.asOf, wide).metrics.situation).toBe('FLAT');
    expect(computeMetrics(p.sips[0]!, p.asOf).metrics.situation).toBe('SMALL_POSITIVE');
  });
});

describe('D-11 stays consistent: the engine never decides or alters SIP status', () => {
  it('RESTART_PENDING comes only from data/status.ts, using RESTART_WINDOW_DAYS = 14', () => {
    expect(RESTART_WINDOW_DAYS).toBe(14);
    const p = persona('restart-pending');
    const b = p.sips[0]!;
    expect(deriveSipStatus(b.sip, b.failures, b.pause, p.asOf)).toBe('RESTART_PENDING');
    expect(b.reminder?.optedIn).toBe(true); // it has a reminder, but that is not why it is pending
    const noReminder = { ...b, reminder: null };
    expect(deriveSipStatus(noReminder.sip, noReminder.failures, noReminder.pause, p.asOf)).toBe('RESTART_PENDING');
  });
  it('a reminder alone does not make an active SIP pending', () => {
    const p = persona('restart-pending');
    const b = p.sips[0]!;
    expect(deriveSipStatus(b.sip, b.failures, null, p.asOf)).toBe('ACTIVE'); // same reminder object exists, but no pause
  });
  it('metrics have no status field: a paused SIP and the same SIP unpaused get identical figures', () => {
    const p = persona('restart-pending');
    const b = p.sips[0]!;
    expect(computeMetrics({ ...b, pause: null, reminder: null }, p.asOf)).toEqual(computeMetrics(b, p.asOf));
    expect('status' in computeMetrics(b, p.asOf).metrics).toBe(false);
  });
});
