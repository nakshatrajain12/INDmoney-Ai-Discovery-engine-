import { describe, it, expect } from 'vitest';
import { TEMPLATES, selectTemplate } from '@/content/templates/catalog';
import { renderTemplate, ALLOWED_TOKENS } from '@/domain/explain/templates';
import { findBannedPhrases } from '@/lib/banned-phrases';
import { getAllTerms } from '@/content/terms';
import { NON_ADVICE_REFUSAL, DISCLAIMER_TEXT } from '@/content/refusal';
import type { ReturnSituation } from '@/contracts/domain';

describe('Templates Catalog & Placeholder Engine (Phase 3)', () => {
  const sampleTokens: Record<string, string> = {
    invested: '₹25,000.00',
    current_value: '₹24,449.52',
    abs_return: '-₹550.48',
    abs_return_pct: '-2.20%',
    xirr_pct: '-9.14%',
    tenure_months: '4',
    instalments_paid: '5',
    scheme_name: 'Northstar Flexi Cap Fund'
  };

  it('contains pre-approved templates for every return situation', () => {
    const situations: ReturnSituation[] = [
      'FLAT',
      'SMALL_NEGATIVE',
      'NEGATIVE',
      'SMALL_POSITIVE',
      'POSITIVE',
      'INSUFFICIENT_DATA'
    ];
    for (const sit of situations) {
      const template = selectTemplate(sit, 'M3_6');
      expect(template).toBeDefined();
      expect(template.situation).toBe(sit);
      expect(template.figuresSummary).toBeDefined();
      expect(template.means.title).toBeDefined();
      expect(template.means.body).toBeDefined();
      expect(template.doesNotMean.title).toBeDefined();
      expect(template.doesNotMean.body).toBeDefined();
    }
  });

  it('selects stage-specific templates for early vs mature tenures', () => {
    const early = selectTemplate('NEGATIVE', 'M1_3');
    const mature = selectTemplate('NEGATIVE', 'OVER_12');
    expect(early.id).toBe('TPL_NEG_EARLY');
    expect(mature.id).toBe('TPL_NEG_MATURE');
    expect(early.means.body).not.toEqual(mature.means.body);
  });

  it('every placeholder token in catalog templates is in ALLOWED_TOKENS', () => {
    const tokenRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    for (const tpl of TEMPLATES) {
      const texts = [
        tpl.figuresSummary,
        tpl.means.title,
        tpl.means.body,
        tpl.means.takeaway ?? '',
        tpl.doesNotMean.title,
        tpl.doesNotMean.body,
        tpl.doesNotMean.takeaway ?? ''
      ];
      for (const text of texts) {
        let match: RegExpExecArray | null;
        while ((match = tokenRegex.exec(text)) !== null) {
          const token = match[1]!;
          expect((ALLOWED_TOKENS as readonly string[]).includes(token), `Unknown token {{${token}}} in template ${tpl.id}`).toBe(true);
        }
      }
    }
  });

  it('renderTemplate replaces all placeholders and leaves zero {{...}} tokens', () => {
    for (const tpl of TEMPLATES) {
      const renderedSummary = renderTemplate(tpl.figuresSummary, sampleTokens);
      const renderedMeans = renderTemplate(tpl.means.body, sampleTokens);
      const renderedDoesNotMean = renderTemplate(tpl.doesNotMean.body, sampleTokens);

      expect(renderedSummary).not.toMatch(/\{\{.*\}\}/);
      expect(renderedMeans).not.toMatch(/\{\{.*\}\}/);
      expect(renderedDoesNotMean).not.toMatch(/\{\{.*\}\}/);

      // Numbers are properly formatted
      expect(renderedSummary).toContain('₹25,000.00');
    }
  });

  it('renderTemplate throws when an unknown placeholder is present', () => {
    expect(() => renderTemplate('Hello {{unknown_token}}', sampleTokens)).toThrowError(RangeError);
  });

  it('all template texts pass the banned-phrases and pressure-language linter with zero violations', () => {
    for (const tpl of TEMPLATES) {
      const texts = [
        tpl.figuresSummary,
        tpl.means.title,
        tpl.means.body,
        tpl.means.takeaway ?? '',
        tpl.doesNotMean.title,
        tpl.doesNotMean.body,
        tpl.doesNotMean.takeaway ?? ''
      ];
      for (const text of texts) {
        const violations = findBannedPhrases(text);
        expect(violations, `Banned phrase in template ${tpl.id}: ${JSON.stringify(violations)} in text "${text}"`).toHaveLength(0);
      }
    }
  });

  it('all financial terms pass the banned-phrases linter with zero violations', () => {
    for (const term of getAllTerms()) {
      const texts = [term.title, term.shortDefinition, term.fullExplanation, term.shortPeriodNote ?? ''];
      for (const text of texts) {
        if (!text) continue;
        const violations = findBannedPhrases(text);
        expect(violations, `Banned phrase in term ${term.key}: ${JSON.stringify(violations)} in text "${text}"`).toHaveLength(0);
      }
    }
  });

  it('the refusal message and disclaimer pass the banned-phrases linter', () => {
    const refusalViolations = findBannedPhrases(NON_ADVICE_REFUSAL.message);
    expect(refusalViolations, `Violations in refusal message: ${JSON.stringify(refusalViolations)}`).toHaveLength(0);

    const disclaimerViolations = findBannedPhrases(DISCLAIMER_TEXT);
    expect(disclaimerViolations, `Violations in disclaimer: ${JSON.stringify(disclaimerViolations)}`).toHaveLength(0);
  });
});
