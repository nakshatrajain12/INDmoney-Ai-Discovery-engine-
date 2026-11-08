import { describe, it, expect } from 'vitest';
import {
  validateRephrasedProse,
  extractPlaceholders,
  stripPlaceholders,
  type CandidateBlocks,
  type OriginalBlocks
} from '@/domain/explain/validator';

const baselineOriginal: OriginalBlocks = {
  means: {
    title: 'What this means at month {{tenure_months}}',
    body: 'At month {{tenure_months}}, your portfolio valuation closely aligns with your total invested capital of {{invested}}.',
    keyTakeaway: 'Sideways periods allow systematic accumulation of units near current price levels.'
  },
  doesNotMean: {
    title: 'What it does not mean',
    body: 'This does not mean your SIP is inactive or ineffective. Early months focus on steady unit acquisition across {{instalments_paid}} instalments.',
    keyTakeaway: 'Flat valuation does not prevent systematic unit accumulation over time.'
  }
};

describe('Zero-Digit & Placeholder Validator (Evaluation Suite V1 - V14 & AI-E01 - AI-E05)', () => {
  it('passes a clean, compliant rephrased block with all placeholders intact and zero digits', () => {
    const validCandidate: CandidateBlocks = {
      means: {
        title: 'Understanding your portfolio at month {{tenure_months}}',
        body: 'During month {{tenure_months}}, the current value of your folio reflects your total invested capital of {{invested}}.',
        keyTakeaway: 'Consolidation phases allow systematic accumulation of folio units.'
      },
      doesNotMean: {
        title: 'Clarifications on your journey',
        body: 'This does not suggest that your investment plan is paused. The early stages build units steadily through {{instalments_paid}} instalments.',
        keyTakeaway: 'A neutral valuation does not interrupt long-term accumulation.'
      }
    };

    const result = validateRephrasedProse(validCandidate, baselineOriginal);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('V1 & AI-E01: rejects output containing numeric digits (0-9) 100% of the time (Phase Gate 6)', () => {
    const testCases = [
      'In month 5, your portfolio is flat.',
      'You have made 6 instalments so far.',
      'Returns stand at 0 percent.',
      'The market changed by 10 points.',
      'Fund value is 5000 rupees.'
    ];

    for (const injected of testCases) {
      const candidate: CandidateBlocks = {
        ...baselineOriginal,
        means: {
          ...baselineOriginal.means,
          body: injected + ' {{invested}} {{tenure_months}}'
        }
      };

      const result = validateRephrasedProse(candidate, baselineOriginal);
      expect(result.valid).toBe(false);
      expect(result.ruleCode).toBe('ZERO_DIGIT_DETECTED');
      expect(result.issues[0]).toMatch(/Zero-digit violation/i);
    }
  });

  it('V2 & AI-E02: rejects output when a required placeholder is removed or missing', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        // Dropped {{invested}}
        body: 'At month {{tenure_months}}, your portfolio valuation closely aligns with your total capital.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('PLACEHOLDER_MISMATCH');
    expect(result.issues[0]).toMatch(/Placeholder count or identity mismatch/i);
  });

  it('V3: rejects new numerical claims injected into prose', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        body: 'At month {{tenure_months}}, expect about 12% a year on {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('ZERO_DIGIT_DETECTED');
  });

  it('V4: rejects unknown placeholder tokens not in allowed catalog', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        body: 'At month {{tenure_months}}, your {{invented_metric}} aligns with {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('UNKNOWN_PLACEHOLDER');
    expect(result.issues[0]).toMatch(/Unknown placeholder token.*invented_metric/i);
  });

  it('V5 & AI-E05: rejects unapproved AMC brands, index names, or stock tickers', () => {
    const prohibitedEntities = ['HDFC', 'SBI', 'Nifty', 'Sensex', 'Bitcoin'];

    for (const ent of prohibitedEntities) {
      const candidate: CandidateBlocks = {
        ...baselineOriginal,
        means: {
          ...baselineOriginal.means,
          body: `Tracking ${ent} at month {{tenure_months}} alongside {{invested}} capital.`
        }
      };

      const result = validateRephrasedProse(candidate, baselineOriginal);
      expect(result.valid).toBe(false);
      expect(result.ruleCode).toBe('FORBIDDEN_ENTITY_DETECTED');
    }
  });

  it('V6 & V7 & AI-E03: rejects output containing advice or banned urgency phrases', () => {
    const prohibitedPhrases = [
      'You should stay invested through market dips.',
      'Do not panic during downturns.',
      'Act now before the next cycle.',
      'You must buy more units.'
    ];

    for (const phrase of prohibitedPhrases) {
      const candidate: CandidateBlocks = {
        ...baselineOriginal,
        means: {
          ...baselineOriginal.means,
          body: `${phrase} At month {{tenure_months}} with {{invested}} invested.`
        }
      };

      const result = validateRephrasedProse(candidate, baselineOriginal);
      expect(result.valid).toBe(false);
      expect(result.ruleCode).toBe('BANNED_PHRASE_DETECTED');
    }
  });

  it('V8 & D-10: rejects spelled-out numbers, percentage words, and units', () => {
    const spelledCases = [
      'At month {{tenure_months}}, with five thousand rupees in {{invested}}.',
      'Your portfolio gained ten per cent over {{invested}} in month {{tenure_months}}.',
      'Accumulation reaches two lakh in {{invested}} at month {{tenure_months}}.',
      'Growth could double your {{invested}} by month {{tenure_months}}.',
      'Value represents half of {{invested}} at month {{tenure_months}}.'
    ];

    for (const text of spelledCases) {
      const candidate: CandidateBlocks = {
        ...baselineOriginal,
        means: {
          ...baselineOriginal.means,
          body: text
        }
      };

      const result = validateRephrasedProse(candidate, baselineOriginal);
      expect(result.valid).toBe(false);
      expect(result.ruleCode).toBe('SPELLED_NUMBER_DETECTED');
      expect(result.issues[0]).toMatch(/Spelled-out number detected/i);
    }
  });

  it('V9: rejects duplicated or extra placeholders', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        // Duplicated {{invested}}
        body: 'At month {{tenure_months}}, your {{invested}} matches your {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('PLACEHOLDER_MISMATCH');
  });

  it('V10: rejects malformed schema or missing block IDs', () => {
    // Missing doesNotMean block
    const candidate = {
      means: baselineOriginal.means
    } as unknown as CandidateBlocks;

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('MALFORMED_SCHEMA');
  });

  it('V11: rejects URLs and web links in prose', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        body: 'Check https://amfiindia.com for month {{tenure_months}} details regarding {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('FORBIDDEN_URL_DETECTED');
  });

  it('V12: rejects output with extreme length deviation', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        // Extremely short body (under 25% of original)
        body: 'Month {{tenure_months}} {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('LENGTH_BOUND_VIOLATION');
  });

  it('V13: rejects placeholder substitution with a mismatched token', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        // Replaced {{invested}} with {{current_value}}
        body: 'At month {{tenure_months}}, your portfolio valuation closely aligns with {{current_value}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('PLACEHOLDER_MISMATCH');
  });

  it('V14: rejects unsupported claims about fees, charges, or taxes', () => {
    const candidate: CandidateBlocks = {
      ...baselineOriginal,
      means: {
        ...baselineOriginal.means,
        body: 'At month {{tenure_months}}, you avoid any penalty fee on {{invested}}.'
      }
    };

    const result = validateRephrasedProse(candidate, baselineOriginal);
    expect(result.valid).toBe(false);
    expect(result.ruleCode).toBe('UNSUPPORTED_FEE_CLAIM');
  });
});

describe('Helper functions: extractPlaceholders & stripPlaceholders', () => {
  it('extracts placeholders properly', () => {
    const tokens = extractPlaceholders('Invested {{invested}} at month {{tenure_months}}.');
    expect(tokens).toEqual(['invested', 'tenure_months']);
  });

  it('strips placeholders without leaving digits from tokens', () => {
    const stripped = stripPlaceholders('Invested {{invested_amount}} at month {{tenure_months}}.');
    expect(stripped).not.toContain('{{');
    expect(stripped).not.toContain('}}');
  });
});

