import type { SipBundle, FinancialMetrics } from '@/contracts/domain';
import type { EngineDetail } from '@/domain/returns/engine';
import { formatINR, formatPctE2 } from '@/domain/returns/money';

export const ALLOWED_TOKENS = [
  'invested',
  'current_value',
  'abs_return',
  'abs_return_pct',
  'xirr_pct',
  'tenure_months',
  'instalments_paid',
  'scheme_name'
] as const;

export type TokenName = (typeof ALLOWED_TOKENS)[number];

/**
 * Extracts and formats all valid placeholder tokens from the deterministic engine calculation.
 * Ensures consistent Indian rupee formatting (₹1,25,000.00) and signed percentage display (+4.30%).
 */
export function resolveTokens(
  bundle: SipBundle,
  metrics: FinancialMetrics,
  detail: EngineDetail
): Record<TokenName, string> {
  const invested = formatINR(metrics.investedPaise);
  const currentValue = metrics.currentValuePaise !== null ? formatINR(metrics.currentValuePaise) : 'Unavailable';
  const absReturn = metrics.absoluteReturnPaise !== null
    ? formatINR(metrics.absoluteReturnPaise, { showPlus: true })
    : 'Unavailable';
  const absReturnPct = detail.absolutePctE2 !== null
    ? formatPctE2(detail.absolutePctE2, { showPlus: true })
    : 'Unavailable';
  const xirrPct = metrics.xirrPct !== null ? `${metrics.xirrPct.toFixed(2)}%` : 'Unavailable';

  return {
    invested,
    current_value: currentValue,
    abs_return: absReturn,
    abs_return_pct: absReturnPct,
    xirr_pct: xirrPct,
    tenure_months: String(metrics.tenureMonths),
    instalments_paid: String(metrics.instalmentsPaid),
    scheme_name: bundle.sip.schemeName
  };
}

/**
 * Substitutes {{token}} in templateText with exact resolved token values.
 * Throws if an unknown token is encountered or if any unparsed {{...}} token remains.
 */
export function renderTemplate(templateText: string, tokens: Record<string, string>): string {
  // Check for any unrecognised token syntax
  const tokenRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  let result = templateText;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(templateText)) !== null) {
    const key = match[1]!;
    if (!(key in tokens)) {
      throw new RangeError(`Unknown placeholder token in template: {{${key}}}`);
    }
  }

  // Replace all tokens
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }

  // Ensure no unparsed placeholders remain
  const remaining = result.match(/\{\{([a-zA-Z0-9_]+)\}\}/);
  if (remaining) {
    throw new Error(`Unparsed placeholder token remaining after substitution: ${remaining[0]}`);
  }

  return result;
}

