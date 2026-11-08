import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BoundedGenerativeRephraser,
  NoopRephraser,
  type RephraseContext
} from '@/domain/explain/rephraser';
import type { LlmClient } from '@/domain/explain/llm-client';
import type { ThreeBlockNarrative } from '@/contracts/coach';
import type { NarrativeTemplate } from '@/content/templates/types';
import { resetConfigCache } from '@/lib/config';

const sampleNarrative: ThreeBlockNarrative = {
  figures: {
    investedPaise: 2500000,
    investedFormatted: '₹25,000.00',
    currentValuePaise: 2450000,
    currentValueFormatted: '₹24,500.00',
    absoluteReturnPaise: -50000,
    absoluteReturnFormatted: '-₹500.00',
    absoluteReturnPct: -2.0,
    absoluteReturnPctFormatted: '-2.00%',
    xirrPct: -4.5,
    xirrFormatted: '-4.50%',
    instalmentsPaid: 5,
    tenureMonths: 5,
    stage: 'M3_6',
    situation: 'SMALL_NEGATIVE',
    summaryText: 'Total invested is ₹25,000.00 across 5 instalments.'
  },
  means: {
    title: 'What this means at month 5',
    body: 'At month 5, your portfolio valuation of ₹24,500.00 aligns with total invested of ₹25,000.00.',
    keyTakeaway: 'Early months build unit balance.'
  },
  doesNotMean: {
    title: 'What it does not mean',
    body: 'This does not mean your SIP is ineffective. Wealth accumulation reflects multi-year cycles across 5 instalments.',
    keyTakeaway: 'Flat valuation does not halt accumulation.'
  }
};

const sampleTemplate: NarrativeTemplate = {
  id: 'TPL_SMALL_NEG_EARLY',
  situation: 'SMALL_NEGATIVE',
  stages: ['M3_6'],
  figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments.',
  means: {
    title: 'What this means at month {{tenure_months}}',
    body: 'At month {{tenure_months}}, your portfolio valuation of {{current_value}} aligns with total invested of {{invested}}.',
    takeaway: 'Early months build unit balance.'
  },
  doesNotMean: {
    title: 'What it does not mean',
    body: 'This does not mean your SIP is ineffective. Wealth accumulation reflects multi-year cycles across {{instalments_paid}} instalments.',
    takeaway: 'Flat valuation does not halt accumulation.'
  }
};

const sampleTokens: Record<string, string> = {
  invested: '₹25,000.00',
  current_value: '₹24,500.00',
  abs_return: '-₹500.00',
  abs_return_pct: '-2.00%',
  xirr_pct: '-4.50%',
  tenure_months: '5',
  instalments_paid: '5',
  scheme_name: 'Northstar Flexi Cap Fund'
};

const sampleContext: RephraseContext = {
  template: sampleTemplate,
  tokens: sampleTokens
};

describe('BoundedGenerativeRephraser & Automated Fallback Router (Phase Gate 6)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetConfigCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetConfigCache();
  });

  it('serves deterministic template seamlessly when LLM_ENABLED is false (Phase Gate 6)', async () => {
    process.env.LLM_ENABLED = 'false';
    resetConfigCache();

    const rephraser = new BoundedGenerativeRephraser();
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('LLM_DISABLED');
    // Output matches deterministic narrative exactly
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('NoopRephraser returns deterministic narrative verbatim', async () => {
    const noop = new NoopRephraser();
    const result = await noop.rephrase(sampleNarrative);
    expect(result.audit.status).toBe('DETERMINISTIC_DEFAULT');
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('substitutes real figures into rephrased prose when model generation passes validation', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const mockClient: LlmClient = {
      complete: async () => JSON.stringify({
        means: {
          title: 'Insights into month {{tenure_months}}',
          body: 'During month {{tenure_months}}, your total valuation of {{current_value}} stays close to your invested amount of {{invested}}.',
          keyTakeaway: 'Consistent instalments continue to build folio units.'
        },
        doesNotMean: {
          title: 'What to keep in mind',
          body: 'This does not indicate a shortfall in long-term potential across your {{instalments_paid}} instalments.',
          keyTakeaway: 'Short-term consolidation is standard in equity mutual funds.'
        }
      })
    };

    const rephraser = new BoundedGenerativeRephraser(mockClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('REPHRASED');
    expect(result.audit.model).toBe('gemini-1.5-flash');

    // Placeholders successfully substituted with real figures
    expect(result.blocks.means.title).toBe('Insights into month 5');
    expect(result.blocks.means.body).toContain('valuation of ₹24,500.00 stays close to your invested amount of ₹25,000.00');
    expect(result.blocks.doesNotMean.body).toContain('across your 5 instalments');

    // Figures block is 100% preserved
    expect(result.blocks.figures).toEqual(sampleNarrative.figures);
  });

  it('AI-E01: automatically falls back to deterministic template when LLM injects a numeric digit (Phase Gate 6)', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const mockClient: LlmClient = {
      complete: async () => JSON.stringify({
        means: {
          title: 'Month {{tenure_months}} report',
          // INJECTED NUMERIC DIGIT: "5"
          body: 'At month 5, your {{current_value}} matches {{invested}}.',
          keyTakeaway: 'Building units.'
        },
        doesNotMean: {
          title: 'What it does not mean',
          body: 'Does not mean poor returns across {{instalments_paid}} instalments.'
        }
      })
    };

    const rephraser = new BoundedGenerativeRephraser(mockClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    // Discarded immediately, fallback triggered
    expect(result.audit.status).toBe('FALLBACK');
    expect(result.audit.validationIssues).toBeDefined();
    expect(result.audit.validationIssues![0]).toMatch(/Zero-digit violation/i);
    // Returns deterministic narrative verbatim
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('AI-E02: automatically falls back when LLM alters or drops a placeholder', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const mockClient: LlmClient = {
      complete: async () => JSON.stringify({
        means: {
          title: 'Month {{tenure_months}} review',
          // Dropped {{invested}}
          body: 'At month {{tenure_months}}, your {{current_value}} is accumulating.',
          keyTakeaway: 'Building units.'
        },
        doesNotMean: {
          title: 'What it does not mean',
          body: 'Does not mean poor returns across {{instalments_paid}} instalments.'
        }
      })
    };

    const rephraser = new BoundedGenerativeRephraser(mockClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('FALLBACK');
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('AI-E03: automatically falls back when LLM includes advice or banned phrases', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const mockClient: LlmClient = {
      complete: async () => JSON.stringify({
        means: {
          title: 'Month {{tenure_months}} advice',
          // Banned phrase: "You should stay invested"
          body: 'You should stay invested at month {{tenure_months}} with {{current_value}} and {{invested}}.',
          keyTakeaway: 'Building units.'
        },
        doesNotMean: {
          title: 'What it does not mean',
          body: 'Does not mean poor returns across {{instalments_paid}} instalments.'
        }
      })
    };

    const rephraser = new BoundedGenerativeRephraser(mockClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('FALLBACK');
    expect(result.audit.validationIssues![0]).toMatch(/Banned phrase detected/i);
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('AI-E04: automatically falls back when LLM call times out or throws an error', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const timeoutClient: LlmClient = {
      complete: async () => {
        throw new Error('LLM call timed out after 1500ms.');
      }
    };

    const rephraser = new BoundedGenerativeRephraser(timeoutClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('FALLBACK');
    expect(result.audit.error).toMatch(/timed out/i);
    expect(result.blocks).toEqual(sampleNarrative);
  });

  it('V10: automatically falls back when LLM returns malformed JSON', async () => {
    process.env.LLM_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'gemini';
    process.env.LLM_MODEL = 'gemini-1.5-flash';
    process.env.LLM_API_KEY = 'mock-key';
    resetConfigCache();

    const badJsonClient: LlmClient = {
      complete: async () => 'Not valid json at all!'
    };

    const rephraser = new BoundedGenerativeRephraser(badJsonClient);
    const result = await rephraser.rephrase(sampleNarrative, sampleContext);

    expect(result.audit.status).toBe('FALLBACK');
    expect(result.audit.error).toMatch(/Malformed JSON/i);
    expect(result.blocks).toEqual(sampleNarrative);
  });
});
