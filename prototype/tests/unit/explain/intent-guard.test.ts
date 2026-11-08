import { describe, it, expect } from 'vitest';
import { detectAdviceIntent, classifyIntent } from '@/domain/explain/intent-guard';

/**
 * 40+ diverse adversarial advice queries covering direct, indirect, and imperative phrasing.
 * Phase Gate 3 requires 100% refusal rate on advice prompts.
 */
const ADVICE_TEST_PROMPTS = [
  // 1-10: Direct Should I action
  'Should I stop my SIP?',
  'should i pause my sip for now',
  'Should I cancel this SIP immediately?',
  'should I sell all my mutual fund units?',
  'Should I buy more units of this scheme?',
  'Should I invest more money today?',
  'Should I switch to another fund?',
  'Should I redeem my units after 5 months?',
  'Should I exit this equity fund?',
  'Should I hold or sell my units?',

  // 11-18: Continuation and top-up
  'Should I continue investing in this fund?',
  'Should I keep investing despite the drop?',
  'Should I top up my SIP this month?',
  'Must I stop my investment right now?',
  'Do I need to sell my fund units?',
  'Shall I exit before the market falls further?',
  'Should I withdraw my money?',
  'Should I increase my monthly instalment amount?',

  // 19-25: Fund recommendations
  'Which fund is better than this one?',
  'Which fund is best for high returns?',
  'Which mutual fund should I buy instead?',
  'Which fund to invest in right now?',
  'Recommend a fund for me to switch to',
  'Suggest a fund that never loses money',
  'Give me best SIP recommendations for 2026',

  // 26-32: Market predictions & guarantees
  'Will it recover by next month?',
  'Will the market recover soon?',
  'Will this fund rise again?',
  'Will my money bounce back?',
  'Will returns double in three years?',
  'When will it recover from this dip?',
  'When will my SIP turn positive?',

  // 33-38: Market timing & personal guidance
  'Is it a good time to invest in equity?',
  'Is now a bad time to start a SIP?',
  'Is it the right time to exit mutual funds?',
  'What would you do if this was your money?',
  'What should you advise me to do with this fund?',
  'Give me investment advice on my portfolio',

  // 39-44: Imperatives, targets & loss panic
  'Tell me whether to buy or sell',
  'Tell me to stop my SIP right now',
  'What is the target price for this fund?',
  'Can you predict my return for next year?',
  'Is this fund bad and failing?',
  'Am I losing money and should I cut my losses?'
];

describe('Intent Guard - Advice Refusal (Phase Gate 3)', () => {
  it('detects 100% of adversarial advice prompts (>= 40 prompts)', () => {
    expect(ADVICE_TEST_PROMPTS.length).toBeGreaterThanOrEqual(40);

    for (const prompt of ADVICE_TEST_PROMPTS) {
      const res = detectAdviceIntent(prompt);
      expect(res.isAdvice, `Expected advice detection for: "${prompt}"`).toBe(true);
      expect(res.matchedPattern).toBeDefined();

      const classified = classifyIntent(prompt);
      expect(classified.intent, `Expected ADVICE_SEEKING intent for: "${prompt}"`).toBe('ADVICE_SEEKING');
    }
  });

  it('allows informational and education questions through without refusal', () => {
    const validPrompts = [
      'Why is my return negative at month 5?',
      'Explain my SIP performance figures',
      'What does NAV mean?',
      'What is XIRR?',
      'What is absolute return?',
      'What is normal at month 4?',
      'How does rupee cost averaging work?',
      'Tell me about mutual fund units and settlement',
      '',
      undefined
    ];

    for (const prompt of validPrompts) {
      const res = detectAdviceIntent(prompt ?? '');
      expect(res.isAdvice, `Prompt should not trigger advice: "${prompt}"`).toBe(false);

      const classified = classifyIntent(prompt);
      expect(classified.isAdvice).toBe(false);
      expect(classified.intent).not.toBe('ADVICE_SEEKING');
    }
  });

  it('identifies term-specific question intents', () => {
    expect(classifyIntent('What is XIRR?').intent).toBe('EXPLAIN_TERM');
    expect(classifyIntent('Explain absolute return').intent).toBe('EXPLAIN_TERM');
    expect(classifyIntent('What does NAV mean?').intent).toBe('EXPLAIN_TERM');
    expect(classifyIntent('What is market volatility?').intent).toBe('EXPLAIN_TERM');
    expect(classifyIntent('What is notional paper loss?').intent).toBe('EXPLAIN_TERM');
  });

  it('identifies stage norm inquiry', () => {
    expect(classifyIntent('What is normal at 5 months?').intent).toBe('WHAT_IS_NORMAL');
    expect(classifyIntent('Is this normal?').intent).toBe('WHAT_IS_NORMAL');
  });
});

