/**
 * Manual verification CLI for Return Coach (Phase 3).
 *   npx tsx scripts/coach.ts <persona-key> [prompt]
 *   npx tsx scripts/coach.ts --all
 */
import { PERSONAS } from '@/data/mock/fixtures';
import { explainReturn } from '@/domain/explain/orchestrator';

const args = process.argv.slice(2);

async function run() {
  if (args[0] === '--all') {
    console.log('Running Return Coach across all 30 personas (32 SIPs)...\n');
    let passCount = 0;
    for (const persona of PERSONAS) {
      for (const bundle of persona.sips) {
        const res = await explainReturn({ sipId: bundle.sip.id, asOf: persona.asOf });
        if (res.blocks) {
          console.log(`✓ ${bundle.sip.id.padEnd(30)} [${res.blocks.figures.situation.padEnd(14)}] ${res.blocks.figures.stage.padEnd(7)} Conf:${res.confidence.label.padEnd(6)} | ${res.blocks.figures.summaryText}`);
        } else {
          console.log(`✓ ${bundle.sip.id.padEnd(30)} Refusal:${res.isRefusal} Conf:${res.confidence.label}`);
        }
        passCount++;
      }
    }
    console.log(`\nSuccessfully evaluated ${passCount} SIPs.`);
    return;
  }

  if (args[0]) {
    const persona = PERSONAS.find((p) => p.key === args[0]);
    if (!persona) {
      console.error(`Unknown persona "${args[0]}". Available:\n${PERSONAS.map((p) => p.key).join(', ')}`);
      process.exit(1);
    }

    const sip = persona.sips[0]!;
    const prompt = args[1];

    console.log(`\n======================================================================`);
    console.log(`RETURN COACH: ${persona.label} (${persona.key})`);
    console.log(`Scheme: ${sip.sip.schemeName} | As of: ${persona.asOf}`);
    if (prompt) console.log(`Prompt: "${prompt}"`);
    console.log(`======================================================================\n`);

    const res = await explainReturn({
      sipId: sip.sip.id,
      prompt,
      asOf: persona.asOf
    });

    if (res.isRefusal && res.refusal) {
      console.log(`[NON-ADVICE REFUSAL TRIGGERED]`);
      console.log(`Reason: ${res.refusal.reason}`);
      console.log(`Message:\n"${res.refusal.message}"\n`);
      console.log(`Educational Links:`);
      for (const link of res.refusal.educationalLinks) {
        console.log(`  - ${link.label}: ${link.url}`);
      }
    } else if (res.blocks) {
      console.log(`BLOCK 1: YOUR FIGURES`);
      console.log(`----------------------------------------------------------------------`);
      console.log(`Summary: ${res.blocks.figures.summaryText}`);
      console.log(`Invested:           ${res.blocks.figures.investedFormatted} (${res.blocks.figures.instalmentsPaid} instalments)`);
      console.log(`Current Value:      ${res.blocks.figures.currentValueFormatted ?? 'Unavailable'}`);
      console.log(`Absolute Return:    ${res.blocks.figures.absoluteReturnFormatted ?? 'Unavailable'} (${res.blocks.figures.absoluteReturnPctFormatted ?? 'Unavailable'})`);
      console.log(`XIRR:               ${res.blocks.figures.xirrFormatted ?? 'Unavailable'}`);
      console.log(`Tenure:             ${res.blocks.figures.tenureMonths} months (Stage: ${res.blocks.figures.stage})`);
      console.log(`Situation:          ${res.blocks.figures.situation}\n`);

      console.log(`BLOCK 2: ${res.blocks.means.title.toUpperCase()}`);
      console.log(`----------------------------------------------------------------------`);
      console.log(`${res.blocks.means.body}`);
      if (res.blocks.means.keyTakeaway) console.log(`Takeaway: ${res.blocks.means.keyTakeaway}`);
      console.log();

      console.log(`BLOCK 3: ${res.blocks.doesNotMean.title.toUpperCase()}`);
      console.log(`----------------------------------------------------------------------`);
      console.log(`${res.blocks.doesNotMean.body}`);
      if (res.blocks.doesNotMean.keyTakeaway) console.log(`Takeaway: ${res.blocks.doesNotMean.keyTakeaway}`);
      console.log();
    }

    console.log(`SOURCES CITED (${res.sources.length}):`);
    for (const src of res.sources) {
      console.log(`  • [${src.publisher}] ${src.title} (${src.publishedDate})`);
      console.log(`    "${src.citationSnippet}"`);
    }

    console.log(`\nCONFIDENCE: ${res.confidence.label} [${res.confidence.reasons.join(', ')}]`);
    console.log(`DISCLAIMER: ${res.disclaimer}`);
    console.log(`LATENCY: ${res.audit.latencyMs}ms | TEMPLATE: ${res.audit.templateId}\n`);
    return;
  }

  console.error('Usage: npx tsx scripts/coach.ts <persona-key> [prompt] | --all');
  process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

