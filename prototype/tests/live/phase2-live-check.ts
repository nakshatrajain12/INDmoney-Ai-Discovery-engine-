// Usage: npx tsx tests/live/phase2-live-check.ts
// Phase 2 live verification: exercises the deterministic calculation engine,
// tenure calculator, bisection XIRR, classification, confidence, and edge cases.
import fs from 'node:fs';
import path from 'node:path';
import { PERSONAS, FIXTURE_AS_OF } from '@/data/mock/fixtures';
import { BANDS_V1 } from '@/domain/returns/config';
import { computeMetrics } from '@/domain/returns/engine';
import { formatINR, formatPctE2, sumPaise } from '@/domain/returns/money';
import { computeTenure } from '@/domain/returns/tenure';
import { xirr } from '@/domain/returns/xirr';
import { computeConfidence } from '@/domain/confidence/confidence';

let failures = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    failures++;
    console.log('FAIL: ' + m);
  } else {
    console.log('ok:   ' + m);
  }
};

console.log('=== PHASE 2 LIVE ENGINE & DETERMINISTIC VERIFICATION ===\n');

// 1. Check all 30 personas (32 SIPs)
ok(PERSONAS.length === 30, 'All 30 mock personas loaded');
const allSips = PERSONAS.flatMap((p) => p.sips.map((b) => ({ p, b, r: computeMetrics(b, p.asOf) })));
ok(allSips.length === 32, 'All 32 SIP bundles evaluated by computeMetrics');

// 2. Strict Integer Paise Arithmetic & Exact Balance
let allInteger = true;
let allSumConsistent = true;
for (const { b, r } of allSips) {
  if (!Number.isSafeInteger(r.metrics.investedPaise)) allInteger = false;
  if (r.metrics.currentValuePaise !== null && !Number.isSafeInteger(r.metrics.currentValuePaise)) allInteger = false;
  if (r.metrics.absoluteReturnPaise !== null && !Number.isSafeInteger(r.metrics.absoluteReturnPaise)) allInteger = false;

  const successInstalments = b.instalments.filter((i) => i.status === 'SUCCESS');
  const expectedInvested = sumPaise(successInstalments.map((i) => i.amountPaise));
  if (r.metrics.investedPaise !== expectedInvested) allSumConsistent = false;

  if (r.metrics.currentValuePaise !== null && r.metrics.absoluteReturnPaise !== null) {
    if (r.metrics.absoluteReturnPaise !== r.metrics.currentValuePaise - r.metrics.investedPaise) {
      allSumConsistent = false;
    }
  }
}
ok(allInteger, 'All monetary fields across 32 SIPs are strictly safe integer paise');
ok(allSumConsistent, 'Invested strictly equals sum of successful instalments; A = V - I exactly');

// 3. Failed Instalments Never Count in Invested
const debitInsuff = computeMetrics(PERSONAS.find((p) => p.key === 'debit-insufficient-balance')!.sips[0]!, FIXTURE_AS_OF);
ok(debitInsuff.metrics.instalmentsFailed === 1, 'debit-insufficient-balance has 1 failed instalment');
ok(debitInsuff.metrics.investedPaise === 1600000, 'Invested paise includes only 4 settled instalments (₹16,000.00), excluding failed 5th');

// 4. Reference Persona Exact Calculations
const earlyFlat = computeMetrics(PERSONAS.find((p) => p.key === 'early-flat')!.sips[0]!, FIXTURE_AS_OF);
ok(earlyFlat.metrics.investedPaise === 2500000, 'early-flat invested = ₹25,000.00 (2,500,000 paise)');
ok(earlyFlat.metrics.currentValuePaise === 2444952, 'early-flat value = ₹24,449.52 (2,444,952 paise)');
ok(earlyFlat.metrics.absoluteReturnPaise === -55048, 'early-flat return = -₹550.48 (-55,048 paise)');
ok(earlyFlat.detail.absolutePctE2 === -220, 'early-flat absolute return pct = -2.20% (-220 hundredths)');
ok(earlyFlat.metrics.stage === 'M3_6', 'early-flat stage = M3_6 (4 months elapsed)');
ok(earlyFlat.metrics.situation === 'SMALL_NEGATIVE', 'early-flat situation = SMALL_NEGATIVE');
ok(earlyFlat.detail.xirrAnnualisedShortPeriod === true, 'early-flat short tenure flagged (< 12 months)');
ok(earlyFlat.metrics.xirrPct === -9.1433, 'early-flat XIRR = -9.1433% (reconciled within 0 bps with mock provider)');

const positive = computeMetrics(PERSONAS.find((p) => p.key === 'positive')!.sips[0]!, FIXTURE_AS_OF);
ok(positive.metrics.situation === 'SMALL_POSITIVE', 'positive persona classified as SMALL_POSITIVE (+4.34%)');
ok(positive.metrics.stage === 'M3_6', 'positive persona stage = M3_6');

// 5. Tenure Band Stages
ok(computeTenure('2026-10-15', '2026-11-08', BANDS_V1).stage === 'M1', 'Tenure < 1 mo evaluates to M1');
ok(computeTenure('2026-09-15', '2026-11-08', BANDS_V1).stage === 'M1_3', 'Tenure 1-3 mo evaluates to M1_3');
ok(computeTenure('2026-06-15', '2026-11-08', BANDS_V1).stage === 'M3_6', 'Tenure 3-6 mo evaluates to M3_6');
ok(computeTenure('2026-02-15', '2026-11-08', BANDS_V1).stage === 'M6_12', 'Tenure 6-12 mo evaluates to M6_12');
ok(computeTenure('2025-01-15', '2026-11-08', BANDS_V1).stage === 'OVER_12', 'Tenure > 12 mo evaluates to OVER_12');

// 6. XIRR Bisection Solver Against Reference Vectors
const vectorsFile = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/xirr-vectors.json'), 'utf8'));
const msDoc = vectorsFile.vectors.find((v: { id: string }) => v.id === 'MS-DOC-1');
const msResult = xirr(msDoc.flows, BANDS_V1);
ok(msResult.status === 'OK', 'MS-DOC-1 XIRR solver converges');
ok(Math.abs(msResult.ratePct! / 100 - 0.373362535) < 1e-6, 'MS-DOC-1 reproduced within 1e-6 tolerance (0.373363 vs 0.373362535)');

const oneYr = vectorsFile.vectors.find((v: { id: string }) => v.id === 'ONE-YEAR-PLUS-10');
const oneYrResult = xirr(oneYr.flows, BANDS_V1);
ok(oneYrResult.ratePct === 10.0, 'ONE-YEAR-PLUS-10 resolves to exactly 10.0000%');

// 7. Edge Cases & Safe Null Handling
ok(xirr([], BANDS_V1).ratePct === null, 'Empty cash flows return null');
ok(xirr([{ date: '2026-01-01', amountPaise: -1000 }], BANDS_V1).ratePct === null, 'Single cash flow returns null safely');
ok(xirr([{ date: '2026-01-01', amountPaise: -1000 }, { date: '2026-02-01', amountPaise: -500 }], BANDS_V1).ratePct === null, 'All outflows return null');
ok(xirr([{ date: 'invalid-date', amountPaise: -1000 }, { date: '2026-02-01', amountPaise: 1100 }], BANDS_V1).ratePct === null, 'Invalid date returns null without throwing');
ok(xirr([{ date: '2026-02-30', amountPaise: -1000 }, { date: '2026-03-01', amountPaise: 1100 }], BANDS_V1).ratePct === null, 'Out-of-range calendar date returns null without throwing');

// 8. Confidence Calculation Precedence
const highConf = computeConfidence({
  figuresComplete: true,
  ruleMatched: true,
  xirrNeeded: true,
  xirrAvailable: true,
  xirrMismatch: false,
  verifiedSourceCount: 1,
  validation: 'PASSED',
  outOfScope: false,
  generalEducationOnly: false
});
ok(highConf.label === 'HIGH', 'Complete figures + rule match + verified source = HIGH confidence');

const medConf = computeConfidence({
  figuresComplete: true,
  ruleMatched: true,
  xirrNeeded: true,
  xirrAvailable: false,
  xirrMismatch: false,
  verifiedSourceCount: 1,
  validation: 'PASSED',
  outOfScope: false,
  generalEducationOnly: false
});
ok(medConf.label === 'MEDIUM', 'Missing needed XIRR degrades confidence to MEDIUM');

const lowConf = computeConfidence({
  figuresComplete: false,
  ruleMatched: true,
  xirrNeeded: false,
  xirrAvailable: false,
  xirrMismatch: false,
  verifiedSourceCount: 1,
  validation: 'PASSED',
  outOfScope: false,
  generalEducationOnly: false
});
ok(lowConf.label === 'LOW', 'Incomplete figures yields LOW confidence');

// 9. Determinism and NAV Independence
const scrambled = structuredClone(PERSONAS.find((p) => p.key === 'early-flat')!.sips[0]!);
scrambled.valuation!.currentNavE4 = 999999;
scrambled.valuation!.navHistory = [];
scrambled.instalments.forEach((i) => {
  i.navE4 = 888888;
  i.unitsE4 = 777777;
});
const scrambledResult = computeMetrics(scrambled, FIXTURE_AS_OF);
ok(
  scrambledResult.metrics.investedPaise === earlyFlat.metrics.investedPaise &&
  scrambledResult.metrics.currentValuePaise === earlyFlat.metrics.currentValuePaise &&
  scrambledResult.metrics.absoluteReturnPaise === earlyFlat.metrics.absoluteReturnPaise &&
  scrambledResult.metrics.xirrPct === earlyFlat.metrics.xirrPct,
  'NAV scrambling property verified: invented demo NAV does not affect returns calculation'
);

console.log(`\n=== PHASE 2 LIVE CHECK RESULTS: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ===`);
if (failures > 0) process.exit(1);

