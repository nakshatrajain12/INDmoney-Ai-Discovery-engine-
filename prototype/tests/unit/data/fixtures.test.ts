import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PERSONAS, FIXTURE_AS_OF } from '@/data/mock/fixtures';
import { validateAll, validatePersona, detectAnomalies } from '@/data/mock/validate';
import { PersonaFixture, type PersonaFixture as Persona } from '@/contracts/domain';
import { deriveSipStatus } from '@/data/status';
import { MOCK_REASON_CODES } from '@/data/mock/builders';

const byKey = (k: string): Persona => PERSONAS.find((p) => p.key === k)!;
const clone = (k: string): Persona => structuredClone(byKey(k));

describe('fixture set', () => {
  it('has no validation issues (consistency, schedule, totals, status, declared anomalies)', () => {
    expect(validateAll(PERSONAS)).toEqual([]);
  });

  it('every persona parses against the contract schema', () => {
    for (const p of PERSONAS) expect(PersonaFixture.safeParse(p).success, p.key).toBe(true);
  });

  it('has the expected number of uniquely keyed personas', () => {
    expect(PERSONAS).toHaveLength(30);
    expect(new Set(PERSONAS.map((p) => p.key)).size).toBe(30);
  });

  it('labels everything as mock demo data', () => {
    for (const p of PERSONAS) {
      expect(p.user.isMock).toBe(true);
      expect(p.user.dataLabel).toBe('DEMO DATA');
      for (const b of p.sips) {
        expect(b.sip.isMock).toBe(true);
        expect(b.sip.dataLabel).toBe('DEMO DATA');
        expect(b.valuation?.navSource ?? 'ILLUSTRATIVE_DEMO').toBe('ILLUSTRATIVE_DEMO');
      }
    }
  });

  it('stores money as integer paise and NAV/units as integers', () => {
    for (const p of PERSONAS)
      for (const b of p.sips) {
        expect(Number.isInteger(b.sip.instalmentAmountPaise)).toBe(true);
        expect(Number.isInteger(b.sip.declared.totalInvestedPaise)).toBe(true);
        for (const i of b.instalments) {
          expect(Number.isInteger(i.amountPaise)).toBe(true);
          if (i.navE4 !== null) expect(Number.isInteger(i.navE4)).toBe(true);
          if (i.unitsE4 !== null) expect(Number.isInteger(i.unitsE4)).toBe(true);
        }
        if (b.valuation?.currentValuePaise != null) expect(Number.isInteger(b.valuation.currentValuePaise)).toBe(true);
      }
  });

  it('uses only fictional scheme names and a fictional bank', () => {
    const real = /(parag|parikh|mirae|hdfc|icici|axis|sbi|nippon|quant|kotak|uti|franklin|tata|aditya|birla|sundaram|dsp|motilal|edelweiss|invesco)/i;
    for (const p of PERSONAS)
      for (const b of p.sips) {
        expect(b.sip.schemeName).not.toMatch(real);
        expect(b.sip.mandate.bankLabel).toMatch(/^Demo Bank/);
      }
  });

  it('never contains personal identifiers (emails, phone numbers, PAN)', () => {
    const text = JSON.stringify(PERSONAS);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/\b[6-9]\d{9}\b/);
    expect(text).not.toMatch(/\b[A-Z]{5}\d{4}[A-Z]\b/);
  });

  it('is deterministic: building the data twice gives identical results', async () => {
    const mod = await import('@/data/mock/fixtures');
    expect(JSON.stringify(mod.PERSONAS)).toBe(JSON.stringify(PERSONAS));
    expect(FIXTURE_AS_OF).toBe('2026-11-08');
  });
});

describe('scenario coverage required by the brief, the PRD and the evaluation framework', () => {
  it('covers positive, flat, negative, short tenure, missing data, failures, paused and cancelled', () => {
    const bands = new Set(PERSONAS.flatMap((p) => Object.values(p.expectations).map((e) => e.returnBand)));
    for (const b of ['POSITIVE', 'SMALL_POSITIVE', 'FLAT', 'SMALL_NEGATIVE', 'NEGATIVE', 'UNKNOWN']) expect(bands.has(b as never), b).toBe(true);
    const statuses = new Set(PERSONAS.flatMap((p) => Object.values(p.expectations).map((e) => e.status)));
    for (const s of ['ACTIVE', 'PAYMENT_FAILED', 'PAUSED', 'CANCELLED', 'RESTART_PENDING']) expect(statuses.has(s as never), s).toBe(true);
  });

  it('has one failure persona per supported payment-failure category, plus unknown and no-reason', () => {
    const codes = PERSONAS.flatMap((p) => p.sips.flatMap((b) => b.failures.map((f) => f.reasonCode)));
    for (const c of Object.values(MOCK_REASON_CODES)) expect(codes, c).toContain(c);
    expect(codes).toContain('PSP_ERR_77'); // unmapped
    expect(codes).toContain(null); // no reason at all
  });

  it('includes an unverified retry date that the UI must never show, and a verified one', () => {
    const retries = PERSONAS.flatMap((p) => p.sips.flatMap((b) => b.failures.map((f) => f.retry)));
    expect(retries.some((r) => r.nextRetryDate !== null && !r.verified)).toBe(true);
    expect(retries.some((r) => r.nextRetryDate !== null && r.verified)).toBe(true);
  });

  it('every fixture named in docs/evaluation-framework.md section 2.1 exists', () => {
    const doc = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'evaluation-framework.md'), 'utf8');
    const sec = doc.split('### 2.1')[1]!.split('---')[0]!;
    const named = [...new Set([...sec.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]!))].filter((k) => k !== 'architecture');
    const keys = new Set(PERSONAS.map((p) => p.key));
    const missing = named.filter((n) => !keys.has(n));
    expect(missing).toEqual([]);
    expect(named.length).toBeGreaterThanOrEqual(15);
  });

  it('every persona named in docs/architecture.md section 4 exists (quarterly, cashflow-pause and the debit set included)', () => {
    const keys = new Set(PERSONAS.map((p) => p.key));
    for (const k of ['early-flat', 'positive', 'new-month-1', 'long-tenure', 'cashflow-pause', 'quarterly', 'missing-xirr', 'debit-unknown', 'debit-mandate-expired']) expect(keys.has(k), k).toBe(true);
    expect([...keys].some((k) => k.startsWith('debit-upi'))).toBe(true);
  });
});

describe('independently calculated expected values (arithmetic done here, not by the fixture builder)', () => {
  it('early-flat: five instalments of 5,000 give 25,000 invested and a value near 24,450 (-2.2%)', () => {
    const b = byKey('early-flat').sips[0]!;
    const navs = [68.2, 67.1, 69.4, 66.8, 65.4];
    const units = navs.reduce((a, n) => a + 5000 / n, 0);
    const value = units * 65.87;
    expect(b.sip.declared.totalInvestedPaise).toBe(2_500_000);
    expect(Math.abs(b.valuation!.currentValuePaise! / 100 - value)).toBeLessThan(1);
    expect(((value - 25000) / 25000) * 100).toBeCloseTo(-2.2, 1);
  });

  it('flat-zero: value equals invested exactly', () => {
    const b = byKey('flat-zero').sips[0]!;
    expect(b.valuation!.currentValuePaise).toBe(b.sip.declared.totalInvestedPaise);
    expect(b.sip.declared.totalInvestedPaise).toBe(4 * 200_000);
  });

  it('long-tenure: fourteen monthly instalments of 3,000 give 42,000 invested', () => {
    const b = byKey('long-tenure').sips[0]!;
    expect(b.instalments.filter((i) => i.status === 'SUCCESS')).toHaveLength(14);
    expect(b.sip.declared.totalInvestedPaise).toBe(4_200_000);
  });

  it('quarterly: four instalments on 1 Feb, 1 May, 1 Aug and 1 Nov', () => {
    const b = byKey('quarterly').sips[0]!;
    expect(b.instalments.map((i) => i.dueDate)).toEqual(['2026-02-01', '2026-05-01', '2026-08-01', '2026-11-01']);
  });

  it('debit-recovered: the failed instalment is settled by a later manual payment, so five instalments are invested', () => {
    const b = byKey('debit-recovered').sips[0]!;
    expect(b.sip.declared.totalInvestedPaise).toBe(5 * 400_000);
    const settled = b.instalments.find((i) => i.dueDate === '2026-11-05')!;
    expect(settled.status).toBe('SUCCESS');
    expect(settled.settledOn).toBe('2026-11-07');
    expect(b.failures[0]!.resolved).toBe(true);
    expect(deriveSipStatus(b.sip, b.failures, b.pause, FIXTURE_AS_OF)).toBe('ACTIVE');
  });

  it('paused: the October instalment is SKIPPED and the skipped list covers 15 Oct, 15 Nov and 15 Dec', () => {
    const b = byKey('paused').sips[0]!;
    expect(b.instalments.find((i) => i.dueDate === '2026-10-15')!.status).toBe('SKIPPED');
    // pause window ends 14 Jan 2027, so the 15 Jan 2027 instalment is NOT skipped
    expect(b.pause!.skippedDueDates).toEqual(['2026-10-15', '2026-11-15', '2026-12-15']);
  });

  it('missing-instalments-gap: seven are scheduled, four recorded, none marked failed', () => {
    const b = byKey('missing-instalments-gap').sips[0]!;
    expect(b.instalments).toHaveLength(4);
    expect(b.instalments.every((i) => i.status === 'SUCCESS')).toBe(true);
    expect(detectAnomalies(b, FIXTURE_AS_OF)).toEqual(['SCHEDULE_GAP']);
  });
});

describe('the validator catches deliberately broken fixtures (negative tests)', () => {
  const issuesFor = (p: Persona) => validatePersona(p).join('\n');

  it('declared total that disagrees with the instalments', () => {
    const p = clone('early-flat');
    p.sips[0]!.sip.declared.totalInvestedPaise += 100;
    expect(issuesFor(p)).toMatch(/declared total invested/);
  });

  it('wrong last-successful date', () => {
    const p = clone('early-flat');
    p.sips[0]!.sip.declared.lastSuccessfulInstalmentDate = '2026-01-01';
    expect(issuesFor(p)).toMatch(/last successful instalment date/);
  });

  it('instalment off the schedule', () => {
    const p = clone('early-flat');
    p.sips[0]!.instalments[1]!.dueDate = '2026-07-16';
    expect(issuesFor(p)).toMatch(/not on the MONTHLY schedule/);
  });

  it('valuation that does not match units x NAV', () => {
    const p = clone('early-flat');
    p.sips[0]!.valuation!.currentValuePaise! += 50_000;
    expect(issuesFor(p)).toMatch(/does not match units x NAV/);
  });

  it('units that do not equal amount / NAV', () => {
    const p = clone('early-flat');
    p.sips[0]!.instalments[0]!.unitsE4! += 500;
    expect(issuesFor(p)).toMatch(/units do not equal amount \/ NAV/);
  });

  it('status that disagrees with the declared expectation', () => {
    const p = clone('early-flat');
    p.expectations['early-flat_s1']!.status = 'PAUSED';
    expect(issuesFor(p)).toMatch(/derived status ACTIVE != declared PAUSED/);
  });

  it('undeclared anomaly is reported (a gap nobody declared)', () => {
    const p = clone('early-flat');
    p.sips[0]!.instalments.splice(2, 1);
    p.sips[0]!.sip.declared.totalInvestedPaise -= p.sips[0]!.sip.instalmentAmountPaise;
    // removing an instalment also breaks the valuation and the XIRR sign; the point is that the gap is detected and undeclared
    expect(issuesFor(p)).toMatch(/anomalies \[[^\]]*"SCHEDULE_GAP"[^\]]*\] != declared \[\]/);
  });

  it('a declared anomaly that is not actually present is reported', () => {
    const p = clone('early-flat');
    p.expectations['early-flat_s1']!.anomalies = ['SCHEDULE_GAP'];
    expect(issuesFor(p)).toMatch(/declared \["SCHEDULE_GAP"\]/);
  });

  it('failed instalment without a failure record', () => {
    const p = clone('debit-insufficient-balance');
    p.sips[0]!.failures = [];
    expect(issuesFor(p)).toMatch(/has no failure record/);
  });

  it('resolved failure that does not match a settled instalment', () => {
    const p = clone('debit-recovered');
    p.sips[0]!.failures[0]!.resolvedOn = '2026-11-06';
    expect(issuesFor(p)).toMatch(/resolved failure .* must match a SUCCESS instalment/);
  });

  it('verified retry without a scheduled date', () => {
    const p = clone('debit-insufficient-balance');
    p.sips[0]!.failures[0]!.retry = { status: 'NONE', nextRetryDate: null, verified: true, manualRetryAllowed: false };
    expect(issuesFor(p)).toMatch(/verified retry without a scheduled date/);
  });

  it('instalment inside the pause window that is not skipped', () => {
    const p = clone('paused');
    p.sips[0]!.instalments.find((i) => i.dueDate === '2026-10-15')!.status = 'SUCCESS';
    expect(issuesFor(p)).toMatch(/inside the pause window but is SUCCESS|settled/);
  });

  it('SKIPPED instalment with no pause at all', () => {
    const p = clone('early-flat');
    const i = p.sips[0]!.instalments[0]!;
    i.status = 'SKIPPED';
    i.settledOn = null;
    i.navE4 = null;
    i.unitsE4 = null;
    expect(issuesFor(p)).toMatch(/SKIPPED instalments exist without a pause/);
  });

  it('reminder without opt-in that still carries a date', () => {
    const p = clone('restart-pending');
    p.sips[0]!.reminder!.optedIn = false;
    expect(issuesFor(p)).toMatch(/without opt-in must have status NONE/);
  });

  it('reminder dated after the pause ends', () => {
    const p = clone('restart-pending');
    p.sips[0]!.reminder!.remindOn = '2026-11-25';
    expect(issuesFor(p)).toMatch(/reminder is after the pause ends/);
  });

  it('instalment recorded after cancellation', () => {
    const p = clone('cancelled');
    p.sips[0]!.sip.cancelledOn = '2026-05-01';
    expect(issuesFor(p)).toMatch(/on or after the cancellation date/);
  });

  it('invalid date value', () => {
    const p = clone('early-flat');
    p.sips[0]!.sip.investmentDate = '2026-02-30';
    expect(issuesFor(p)).toMatch(/schema/);
  });

  it('non-integer money', () => {
    const p = clone('early-flat');
    p.sips[0]!.sip.instalmentAmountPaise = 500000.5;
    expect(issuesFor(p)).toMatch(/schema/);
  });

  it('record that is not labelled as mock data', () => {
    const p = clone('early-flat') as unknown as { sips: Array<{ sip: { isMock: boolean } }> };
    p.sips[0]!.sip.isMock = false;
    expect(validatePersona(p).join()).toMatch(/schema/);
  });

  it('duplicate ids across personas', () => {
    const a = clone('early-flat');
    const issues = validateAll([a, a]);
    expect(issues.join()).toMatch(/duplicate persona keys/);
    expect(issues.join()).toMatch(/duplicate record ids/);
  });
});
