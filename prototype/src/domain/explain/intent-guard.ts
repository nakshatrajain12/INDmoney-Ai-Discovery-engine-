import type { CoachIntent } from '@/contracts/coach';

export interface IntentDetectionResult {
  intent: CoachIntent;
  isAdvice: boolean;
  matchedPattern?: string;
}

/**
 * Strict regex rules covering financial advice requests, buy/sell imperatives,
 * fund recommendations, recovery predictions, and personal decision prompting.
 */
const ADVICE_PATTERNS: Array<{ id: string; rx: RegExp }> = [
  // Direct "Should I" questions
  {
    id: 'SHOULD_I_ACTION',
    rx: /\bshould\s+i\s+(stop|pause|cancel|sell|buy|invest|switch|redeem|exit|hold|continue|keep|withdraw|increase|decrease|top\s*up)\b/i
  },
  // "Must I" or "Do I need to"
  {
    id: 'MUST_I_ACTION',
    rx: /\b(must\s+i|do\s+i\s+need\s+to|shall\s+i)\s+(stop|pause|cancel|sell|buy|invest|switch|redeem|exit|hold|continue|withdraw)\b/i
  },
  // Which fund / recommendations
  {
    id: 'WHICH_FUND',
    rx: /\b(which|what)\s+(mutual\s+)?fund\s+(is\s+(better|best|good)|should\s+i\s+buy|to\s+buy|to\s+invest|to\s+choose)\b/i
  },
  {
    id: 'RECOMMEND_FUND',
    rx: /\b(recommend|suggest|give\s+me)\s+(a\s+fund|funds|investment|stocks|portfolio|scheme|best\s+sip)\b/i
  },
  // Market predictions & recovery guarantees
  {
    id: 'WILL_IT_RECOVER',
    rx: /\bwill\s+(it|the\s+market|this\s+fund|(my\s+)?mutual\s+fund|my\s+sip|my\s+money|returns?|nav)\s+(recover|grow|rise|increase|bounce\s*back|double)\b/i
  },
  {
    id: 'WHEN_WILL_RECOVER',
    rx: /\bwhen\s+will\s+(it|this\s+fund|my\s+sip|returns?)\s+(recover|turn\s+positive|give\s+profit)\b/i
  },
  // Market timing ("is it a good time", "is it the right time")
  {
    id: 'MARKET_TIMING',
    rx: /\b(is\s+it|is\s+now)\s+(a|the)?\s*(good|bad|right|wrong|best)\s+time\s+to\s+(invest|buy|sell|exit|enter|start|stop)\b/i
  },
  // Personal advice ("what would you do")
  {
    id: 'WHAT_WOULD_YOU_DO',
    rx: /\bwhat\s+(would|should)\s+you\s+(do|advise|recommend)\b/i
  },
  {
    id: 'GIVE_ADVICE',
    rx: /\b(give\s+me\s+advice|financial\s+advice|investment\s+advice|tell\s+me\s+what\s+to\s+do)\b/i
  },
  // Guarantees and targets
  {
    id: 'TARGET_PRICE_PREDICTION',
    rx: /\b(target\s+price|guaranteed\s+return|expected\s+return\s+next\s+year|predict|forecast)\b/i
  },
  // Imperatives directed at the coach
  {
    id: 'TELL_ME_TO',
    rx: /\btell\s+me\s+(whether\s+to\s+)?(to\s+)?(buy|sell|pause|stop|exit|switch)\b/i
  },
  // Evaluative judgement on the user's specific fund
  {
    id: 'FUND_JUDGEMENT',
    rx: /\bis\s+(this|my)\s+fund\s+(bad|badly|good|performing\s+(badly|well|poorly)|worth\s+it|failing|useless|safe)\b/i
  },
  // Loss anxiety advice query
  {
    id: 'AM_I_LOSING',
    rx: /\b(am\s+i\s+losing\s+money|how\s+do\s+i\s+stop\s+losing|should\s+i\s+cut\s+my\s+losses)\b/i
  },
  // Ambiguous open-ended action prompt ("What should I do?")
  {
    id: 'WHAT_SHOULD_I_DO',
    rx: /\bwhat\s+should\s+i\s+do\b/i
  },
  // Guarantees and profit promises
  {
    id: 'PROFIT_GUARANTEE',
    rx: /\b(guaranteed?(\s+to)?(\s+give)?\s+(profit|returns?|money)|promise\s+returns?|zero\s+risk|never\s+loses?\s+money)\b/i
  },
  // Comparison with market indices or other funds
  {
    id: 'INDEX_OR_FUND_COMPARISON',
    rx: /\b(compare\b.*?\b(with|to|against)\b.*?\b(nifty|sensex|index|peers|other|funds?)|better\s+alternative\s+funds?)\b/i
  },
  // Prompt injection & system override attempts
  {
    id: 'PROMPT_INJECTION_OVERRIDE',
    rx: /\b(system\s+override|ignore\s+(all\s+)?(sebi|guidelines|instructions|rules|previous)|disregard\s+(all\s+)?instructions)\b/i
  },
  // Hinglish advice questions ("SIP band kar dun?", "rok dun?")
  {
    id: 'HINGLISH_ADVICE',
    rx: /\b(sip\s+(band|pause|rok)\s+kard?un|band\s+kar\s+d[u|u]n|rok\s+d[u|u]n|kya\s+sip\s+band|paise\s+nikal\s+lu|band\s+karna\s+chahiye)\b/i
  }
];

const TERM_PATTERNS: Array<{ key: string; rx: RegExp }> = [
  { key: 'XIRR', rx: /\b(what\s+is\s+xirr|define\s+xirr|explain\s+xirr|how\s+is\s+xirr\s+calculated)\b/i },
  { key: 'ABSOLUTE_RETURN', rx: /\b(what\s+is\s+absolute\s+return|define\s+absolute\s+return|explain\s+absolute\s+return)\b/i },
  { key: 'NAV', rx: /\b(what\s+is\s+nav|define\s+nav|explain\s+nav|what\s+does\s+nav\s+mean)\b/i },
  { key: 'VOLATILITY', rx: /\b(what\s+is\s+volatility|define\s+volatility|market\s+volatility)\b/i },
  { key: 'UNREALISED_RETURN', rx: /\b(unrealised\s+return|notional\s+return|paper\s+loss|paper\s+gain)\b/i }
];

export function detectAdviceIntent(prompt: string): { isAdvice: boolean; matchedPattern?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isAdvice: false };
  }
  const clean = prompt.trim();
  for (const { id, rx } of ADVICE_PATTERNS) {
    if (rx.test(clean)) {
      return { isAdvice: true, matchedPattern: id };
    }
  }
  return { isAdvice: false };
}

export function classifyIntent(prompt?: string, declaredIntent?: CoachIntent): IntentDetectionResult {
  if (!prompt || prompt.trim().length === 0) {
    return {
      intent: declaredIntent ?? 'EXPLAIN_RETURN',
      isAdvice: false
    };
  }

  const adviceCheck = detectAdviceIntent(prompt);
  if (adviceCheck.isAdvice) {
    return {
      intent: 'ADVICE_SEEKING',
      isAdvice: true,
      matchedPattern: adviceCheck.matchedPattern
    };
  }

  // Check for term explanation intents
  for (const term of TERM_PATTERNS) {
    if (term.rx.test(prompt)) {
      return {
        intent: 'EXPLAIN_TERM',
        isAdvice: false,
        matchedPattern: term.key
      };
    }
  }

  if (/\b(what\s+is\s+normal|is\s+this\s+normal|normal\s+at\s+\d+\s+months?)\b/i.test(prompt)) {
    return {
      intent: 'WHAT_IS_NORMAL',
      isAdvice: false
    };
  }

  return {
    intent: declaredIntent ?? 'EXPLAIN_RETURN',
    isAdvice: false
  };
}
