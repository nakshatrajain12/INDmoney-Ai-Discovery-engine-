/**
 * Manual-check CLI for the Phase 2 engine.
 *   npx tsx scripts/calc.ts <persona-key> [asOf]     full calculation for every SIP of one persona
 *   npx tsx scripts/calc.ts --all                    one line per SIP for all personas
 *   npx tsx scripts/calc.ts --json                   machine-readable results for all personas
 * All data is DEMO DATA with illustrative NAVs. Nothing here is market data or advice.
 */
import { PERSONAS } from '@/data/mock/fixtures';
import { BANDS_V1 } from '@/domain/returns/config';
import { computeMetrics } from '@/domain/returns/engine';
import { formatINR, formatPctE2 } from '@/domain/returns/money';

const args = process.argv.slice(2);
const money = (p: number | null) => (p === null ? 'unavailable' : formatINR(p));

if (args[0] === '--json') {
  const out = PERSONAS.flatMap((p) => p.sips.map((b) => ({ persona: p.key, ...computeMetrics(b, p.asOf) })));
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} else if (args[0] === '--all') {
  for (const p of PERSONAS)
    for (const b of p.sips) {
      const { metrics: m, detail: d } = computeMetrics(b, p.asOf);
      const pct = d.absolutePctE2 === null ? 'n/a' : formatPctE2(d.absolutePctE2, { showPlus: true });
      console.log(`${b.sip.id.padEnd(34)} I=${money(m.investedPaise).padStart(14)} V=${money(m.currentValuePaise).padStart(14)} A%=${pct.padStart(8)} xirr=${String(m.xirrPct).padStart(10)} [${m.xirrStatus}] ${m.stage} ${m.situation}`);
    }
} else if (args[0]) {
  const p = PERSONAS.find((x) => x.key === args[0]);
  if (!p) {
    console.error(`Unknown persona "${args[0]}". Known: ${PERSONAS.map((x) => x.key).join(', ')}`);
    process.exit(1);
  }
  const asOf = args[1] ?? p.asOf;
  console.log(`DEMO DATA. Illustrative NAVs, not market data. Rules: ${BANDS_V1.version} (${BANDS_V1.reviewStatus})`);
  console.log(`Persona ${p.key}: ${p.label}   as of ${asOf}`);
  for (const b of p.sips) {
    const { metrics: m, detail: d } = computeMetrics(b, asOf);
    console.log(`\n${b.sip.id}  ${b.sip.schemeName}  ${b.sip.frequency}  ${formatINR(b.sip.instalmentAmountPaise)} per instalment`);
    console.log(`  successful instalments (cash out):`);
    for (const i of b.instalments.filter((x) => x.status === 'SUCCESS' && x.settledOn !== null && x.settledOn <= asOf))
      console.log(`    ${i.settledOn}  ${formatINR(i.amountPaise)}`);
    console.log(`  not counted: ${b.instalments.filter((x) => x.status !== 'SUCCESS').map((x) => `${x.dueDate} ${x.status}`).join(', ') || 'none'}`);
    console.log(`  invested (I)            ${formatINR(m.investedPaise)}   (paid ${m.instalmentsPaid}, failed ${m.instalmentsFailed}, pending ${m.instalmentsPending})`);
    console.log(`  current value (V)       ${money(m.currentValuePaise)}`);
    console.log(`  absolute return (A)     ${m.absoluteReturnPaise === null ? 'unavailable' : formatINR(m.absoluteReturnPaise, { showPlus: true })}   A% = ${d.absolutePctE2 === null ? 'unavailable' : formatPctE2(d.absolutePctE2, { showPlus: true })}`);
    console.log(`  first successful date   ${d.firstSuccessfulDate ?? 'none'}   tenure ${m.tenureMonths} months / ${d.tenureDays} days   stage ${m.stage}`);
    console.log(`  XIRR                    ${m.xirrPct === null ? 'unavailable' : m.xirrPct + '%'}   [${m.xirrStatus}]${d.xirrAnnualisedShortPeriod ? '   annualised from a short period' : ''}`);
    console.log(`  provider XIRR           ${d.providerXirrBps === null ? 'not supplied' : d.providerXirrBps / 100 + '%'}   reconciliation ${d.reconciliation.status}${d.reconciliation.diffBps === null ? '' : ' (diff ' + d.reconciliation.diffBps + ' bps)'}`);
    console.log(`  situation               ${m.situation}`);
    console.log(`  flags                   ${d.flags.join(', ') || 'none'}`);
  }
} else {
  console.error('Usage: npx tsx scripts/calc.ts <persona-key> [asOf] | --all | --json');
  process.exit(1);
}
