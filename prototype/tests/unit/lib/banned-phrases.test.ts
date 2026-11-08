import { describe, it, expect } from 'vitest';
import { findBannedPhrases } from '@/lib/banned-phrases';

describe('pressure-language and advice linter', () => {
  it('flags urgency, instruction, prediction and loss framing', () => {
    expect(findBannedPhrases('Act now before it is too late')[0]?.rule).toBe('urgency');
    expect(findBannedPhrases('You should buy this stock now.').map((m) => m.rule)).toContain('instruction');
    expect(findBannedPhrases('Investors must sell underperforming funds.').map((m) => m.rule)).toContain('instruction');
    expect(findBannedPhrases('Your 5-month streak broken!').map((m) => m.rule)).toContain('guilt-streak');
    expect(findBannedPhrases('You should continue your SIP.').map((m) => m.rule)).toContain('instruction');
    expect(findBannedPhrases('Your fund will recover soon.').map((m) => m.rule)).toContain('reassurance-prediction');
    expect(findBannedPhrases('You are losing money every day.').map((m) => m.rule)).toContain('loss-framing');
    expect(findBannedPhrases("Don't panic. Stay invested.").length).toBeGreaterThan(0);
    expect(findBannedPhrases('Hurry, limited time offer').length).toBeGreaterThan(0);
  });

  it('flags imperative advice at the start of a sentence', () => {
    expect(findBannedPhrases('Sell now. Buy the dip.').map((m) => m.rule)).toContain('imperative-advice');
    expect(findBannedPhrases('Hold on. Switch to a debt fund.').map((m) => m.rule)).toContain('imperative-advice');
  });

  it('passes calm, neutral copy', () => {
    const ok = [
      'Your SIP is paused until 15 Jan 2027. You can resume, extend, or leave it paused.',
      'This figure is measured over a short period. It describes today, not where this SIP is heading.',
      'The 5 Nov 2026 instalment failed. Your SIP is still active.'
    ];
    for (const t of ok) expect(findBannedPhrases(t)).toEqual([]);
  });

  it('allows the fixed refusal sentence that names buy and sell', () => {
    const refusal = 'I can’t tell you whether to continue, stop, buy or sell. I can’t compare investments.';
    expect(findBannedPhrases(refusal)).toEqual([]);
  });
});
