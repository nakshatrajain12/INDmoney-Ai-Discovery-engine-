import { describe, it, expect } from 'vitest';
import { PERSONAS } from '@/data/mock/fixtures';
import { explainReturn } from '@/domain/explain/orchestrator';
import { CoachResponse } from '@/contracts/coach';
import { DISCLAIMER_TEXT } from '@/content/refusal';

describe('Return Coach Orchestrator (Phase Gate 3)', () => {
  it('generates schema-valid 3-block responses for all 30 mock personas (32 SIPs)', async () => {
    let sipsEvaluated = 0;

    for (const persona of PERSONAS) {
      for (const bundle of persona.sips) {
        const res = await explainReturn({
          sipId: bundle.sip.id,
          asOf: persona.asOf
        });

        // 1. Zod schema validation
        const parsed = CoachResponse.safeParse(res);
        expect(parsed.success, `SIP ${bundle.sip.id} failed schema: ${parsed.error?.message}`).toBe(true);

        // 2. Base integrity
        expect(res.sipId).toBe(bundle.sip.id);
        expect(res.isRefusal).toBe(false);
        expect(res.disclaimer).toBe(DISCLAIMER_TEXT);
        expect(res.isMock).toBe(true);
        expect(res.dataLabel).toBe('DEMO DATA');

        // 3. 3-Block Narrative structure
        expect(res.blocks).not.toBeNull();
        const { figures, means, doesNotMean } = res.blocks!;

        expect(figures.investedPaise).toBeGreaterThanOrEqual(0);
        expect(figures.investedFormatted).toMatch(/^₹[\d,]+\.\d{2}$/);
        expect(figures.summaryText.length).toBeGreaterThan(10);
        expect(means.title.length).toBeGreaterThan(5);
        expect(means.body.length).toBeGreaterThan(20);
        expect(doesNotMean.title.length).toBeGreaterThan(5);
        expect(doesNotMean.body.length).toBeGreaterThan(20);

        // 4. Zero unparsed {{...}} placeholders anywhere
        const allText = [
          figures.summaryText,
          means.title,
          means.body,
          means.keyTakeaway ?? '',
          doesNotMean.title,
          doesNotMean.body,
          doesNotMean.keyTakeaway ?? ''
        ].join(' ');

        expect(allText).not.toMatch(/\{\{.*\}\}/);

        // 5. Sources attached
        expect(res.sources.length).toBeGreaterThanOrEqual(1);

        // 6. Term definitions present
        expect(res.termDefinitions.length).toBeGreaterThanOrEqual(2);

        sipsEvaluated++;
      }
    }

    expect(sipsEvaluated).toBe(32);
  });

  it('triggers non-advice refusal on advice queries across test prompts', async () => {
    const advicePrompts = [
      'Should I stop my SIP?',
      'Should I sell my mutual fund?',
      'Which fund is better to invest in?',
      'Will it recover soon?',
      'What would you do with this fund?'
    ];

    const testPersona = PERSONAS.find((p) => p.key === 'early-flat')!;
    const sipId = testPersona.sips[0]!.sip.id;

    for (const prompt of advicePrompts) {
      const res = await explainReturn({
        sipId,
        prompt,
        asOf: testPersona.asOf
      });

      expect(res.isRefusal, `Failed to refuse advice for prompt: "${prompt}"`).toBe(true);
      expect(res.refusal).not.toBeNull();
      expect(res.refusal?.reason).toBe('INVESTMENT_ADVICE_REQUESTED');
      expect(res.refusal?.message).toContain("I can't tell you whether to continue, stop, buy or sell");
      expect(res.blocks).toBeNull();
      expect(res.disclaimer).toBe(DISCLAIMER_TEXT);
      expect(res.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('verifies that numeric digits in summary narrative match computed figures (no hallucinated figures)', async () => {
    const testPersona = PERSONAS.find((p) => p.key === 'early-flat')!;
    const bundle = testPersona.sips[0]!;

    const res = await explainReturn({
      sipId: bundle.sip.id,
      asOf: testPersona.asOf
    });

    const figures = res.blocks!.figures;
    const summary = figures.summaryText;

    // Check that figures in summary correspond to the actual computed values
    expect(summary).toContain(figures.investedFormatted); // ₹25,000.00
    expect(summary).toContain(figures.currentValueFormatted!); // ₹24,449.52
    expect(summary).toContain(figures.absoluteReturnFormatted!); // -₹550.48
    expect(summary).toContain(figures.absoluteReturnPctFormatted!); // -2.20%
    expect(summary).toContain(`${figures.instalmentsPaid} instalments`); // 5 instalments
  });

  it('assigns LOW confidence to insufficient-data personas', async () => {
    const newMonth = PERSONAS.find((p) => p.key === 'new-month-1')!;
    const res1 = await explainReturn({ sipId: newMonth.sips[0]!.sip.id, asOf: newMonth.asOf });
    expect(res1.confidence.label).toBe('LOW');
    expect(res1.confidence.reasons).toContain('NO_RULE_MATCH');

    const missingVal = PERSONAS.find((p) => p.key === 'missing-valuation')!;
    const res2 = await explainReturn({ sipId: missingVal.sips[0]!.sip.id, asOf: missingVal.asOf });
    expect(res2.confidence.label).toBe('LOW');
    expect(res2.confidence.reasons).toContain('INSUFFICIENT_DATA');
  });

  it('assigns MEDIUM confidence to personas with provider XIRR mismatch', async () => {
    const inconsistent = PERSONAS.find((p) => p.key === 'inconsistent-xirr')!;
    const res = await explainReturn({ sipId: inconsistent.sips[0]!.sip.id, asOf: inconsistent.asOf });
    expect(res.confidence.label).toBe('MEDIUM');
    expect(res.confidence.reasons).toContain('XIRR_MISMATCH');
  });

  it('assigns HIGH confidence to complete standard personas', async () => {
    const flat = PERSONAS.find((p) => p.key === 'flat-zero')!;
    const res = await explainReturn({ sipId: flat.sips[0]!.sip.id, asOf: flat.asOf });
    expect(res.confidence.label).toBe('HIGH');
  });
});
