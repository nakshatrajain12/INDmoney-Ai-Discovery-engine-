import type { TermDefinition, TermKey } from '@/contracts/coach';
import { getSourceById } from '@/domain/sources/library';

export const TERMS: Record<TermKey, TermDefinition> = {
  XIRR: {
    key: 'XIRR',
    title: 'Extended Internal Rate of Return (XIRR)',
    shortDefinition: 'The annualised rate of return for a series of periodic cash flows invested at different dates.',
    fullExplanation: 'XIRR calculates the exact annual compounding rate accounting for every individual instalment date and amount. Because SIP instalments occur monthly across fluctuating NAVs, each cash flow has been invested for a different duration.',
    formula: 'Sum of [C_i / (1 + r)^((d_i - d_0)/365)] = 0',
    shortPeriodNote: 'For investments held for less than 12 months, XIRR extrapolates short-term rate of change over a full 365-day year, which can magnify normal monthly market fluctuations. SEBI standards recommend relying on absolute return for tenures under 1 year.',
    source: getSourceById('SRC_SEBI_XIRR_DISCLAIMER') ?? null
  },
  ABSOLUTE_RETURN: {
    key: 'ABSOLUTE_RETURN',
    title: 'Absolute Return',
    shortDefinition: 'The simple percentage change between your total money invested and its current portfolio value.',
    fullExplanation: 'Absolute return measures net capital change directly as a percentage of total invested capital: (Current Value - Total Invested) / Total Invested * 100. It does not account for instalment timing or annualisation.',
    formula: '((Current Value - Total Invested) / Total Invested) * 100',
    shortPeriodNote: null,
    source: getSourceById('SRC_AMFI_RCA') ?? null
  },
  NAV: {
    key: 'NAV',
    title: 'Net Asset Value (NAV)',
    shortDefinition: 'The per-unit market price of the mutual fund scheme on a specific trading date.',
    fullExplanation: 'NAV is computed at the close of every trading day based on the total market value of all underlying securities held in the scheme, divided by total outstanding units.',
    formula: '(Total Scheme Assets - Scheme Liabilities) / Total Scheme Units',
    shortPeriodNote: null,
    source: getSourceById('SRC_AMFI_RCA') ?? null
  },
  VOLATILITY: {
    key: 'VOLATILITY',
    title: 'Market Volatility',
    shortDefinition: 'Normal fluctuations in fund asset values over short time intervals.',
    fullExplanation: 'Equity asset prices fluctuate daily based on company earnings, macroeconomic factors, and market liquidity. During an active SIP, downward market phases allow your fixed monthly instalment to purchase more units at a lower NAV.',
    formula: null,
    shortPeriodNote: null,
    source: getSourceById('SRC_SEBI_INVESTOR_GUIDE') ?? null
  },
  UNREALISED_RETURN: {
    key: 'UNREALISED_RETURN',
    title: 'Unrealised (Notional) Return',
    shortDefinition: 'Paper gain or loss on units you currently hold without redeeming.',
    fullExplanation: 'An unrealised return reflects today valuation snapshot. Fluctuations remain on paper while you continue to hold your fund units. Value changes during an ongoing SIP do not lock in any actual capital loss.',
    formula: null,
    shortPeriodNote: null,
    source: getSourceById('SRC_SEBI_INVESTOR_GUIDE') ?? null
  }
};

export function getTerm(key: string): TermDefinition | undefined {
  const upper = key.toUpperCase() as TermKey;
  return TERMS[upper];
}

export function getAllTerms(): TermDefinition[] {
  return Object.values(TERMS);
}

