/**
 * Pressure-language and advice linter for user-facing copy (docs/product-requirements.md FS-8, section 5.4).
 * Used by tests today and by CI over src/content in later phases.
 */
export interface BannedMatch {
  rule: string;
  match: string;
}

const RULES: Array<{ rule: string; rx: RegExp }> = [
  { rule: 'urgency', rx: /\b(act now|don.t miss|do not miss|hurry|last chance|limited time|before it.s too late|running out of time|only \d+ (days|hours) left)\b/i },
  { rule: 'instruction', rx: /\b(you should|you must|should\s+(buy|sell|switch|redeem|invest)|must\s+(buy|sell|switch|redeem|invest)|you need to|we recommend|i recommend|it is best to|you ought to)\b/i },
  { rule: 'imperative-advice', rx: /(^|[.!?]\s+)(buy|sell|switch|redeem|stay invested|continue investing|stop your sip|keep your sip)\b/i },
  { rule: 'reassurance-prediction', rx: /\b(don.t panic|do not panic|nothing to worry|will recover|will grow|sure to|guaranteed|risk.free)\b/i },
  { rule: 'loss-framing', rx: /\b(you.re losing|you are losing|losing money|missing out|fear of)\b/i },
  { rule: 'guilt-streak', rx: /\b(you.ve paused for|streak|streak broken|broken streak|don.t break|let (us|your family) down)\b/i }
];

/** Fixed, pre-approved refusal sentences may name the words buy/sell. Everything else must pass the rules. */
const ALLOWED = [/I can.t tell you whether to continue, stop, buy or sell/i, /I can.t compare investments/i];

export function findBannedPhrases(text: string, allow: RegExp[] = ALLOWED): BannedMatch[] {
  let t = text;
  for (const a of allow) t = t.replace(a, ' ');
  const out: BannedMatch[] = [];
  for (const { rule, rx } of RULES) {
    const m = t.match(rx);
    if (m) out.push({ rule, match: m[0].trim() });
  }
  return out;
}
