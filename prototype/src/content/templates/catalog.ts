import type { NarrativeTemplate } from './types';
import type { ReturnSituation, TenureStage } from '@/contracts/domain';

export const TEMPLATES: readonly NarrativeTemplate[] = [
  // --- FLAT ---
  {
    id: 'TPL_FLAT_EARLY',
    situation: 'FLAT',
    stages: ['M1', 'M1_3', 'M3_6'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your portfolio valuation closely aligns with your total invested capital. In equity mutual funds, periods of sideways index movement are frequent. During these phases, consistent instalments steadily accumulate units without significant divergence in overall valuation.',
      takeaway: 'Sideways periods allow systematic accumulation of units near current price levels.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not mean your SIP is inactive or ineffective. Wealth accumulation in equity funds typically reflects multi-year cycles where accumulated units participate in subsequent market movements. Early months focus on steady unit acquisition.',
      takeaway: 'Flat valuation does not prevent systematic unit accumulation over time.'
    }
  },
  {
    id: 'TPL_FLAT_MATURE',
    situation: 'FLAT',
    stages: ['M6_12', 'OVER_12'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your portfolio value remains close to your total invested amount. Extended sideways market phases are a recognised pattern across equity market cycles. Each ongoing instalment continues to add units at prevailing market valuations.',
      takeaway: 'Ongoing instalments maintain disciplined accumulation during extended sideways markets.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not indicate a shortfall in portfolio potential. Long-term returns in mutual funds often concentrate around specific recovery phases following consolidation intervals.',
      takeaway: 'A consolidated valuation does not diminish the role of accumulated folio units.'
    }
  },

  // --- SMALL_NEGATIVE ---
  {
    id: 'TPL_SMALL_NEG_EARLY',
    situation: 'SMALL_NEGATIVE',
    stages: ['M1', 'M1_3', 'M3_6'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your portfolio shows a modest difference between invested capital and current valuation. During early tenure, capital accumulation is just beginning. Short-term market movements regularly cause minor fluctuations around your cost basis while monthly instalments continue to build your unit balance.',
      takeaway: 'Modest valuation movements around invested capital are common in the early stages of a SIP.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not mean the investment strategy is lagging. Short-term NAV movements do not indicate the eventual trajectory of an equity portfolio. Early tenure serves primarily to establish an accumulated unit base across diverse market conditions.',
      takeaway: 'Minor paper dips do not determine eventual investment outcomes.'
    }
  },
  {
    id: 'TPL_SMALL_NEG_MATURE',
    situation: 'SMALL_NEGATIVE',
    stages: ['M6_12', 'OVER_12'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, a modest unrealised dip is visible against your invested principal. Moderate market softening affects short-term valuations while your holding continues to accrue units at lower per-unit costs.',
      takeaway: 'Moderate market softening provides opportunities for ongoing rupee-cost averaging.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not signify capital erosion. Because your units remain unliquidated, temporary valuation changes remain notional and reflect current market pricing.',
      takeaway: 'Notional portfolio changes remain unsettled until units are redeemed.'
    }
  },

  // --- NEGATIVE ---
  {
    id: 'TPL_NEG_EARLY',
    situation: 'NEGATIVE',
    stages: ['M1', 'M1_3', 'M3_6'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your SIP is in its initial accumulation phase. When equity markets experience fluctuations during early months, each instalment acquires units at varying NAV levels. Through rupee-cost averaging, downward market periods allocate more units for the same instalment amount, which lowers the average cost per unit across your holding period.',
      takeaway: 'Market dips in early months allow fixed instalments to accumulate units at lower average NAVs.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not mean your investment has experienced permanent capital loss. Market valuations fluctuate daily, and unrealised changes reflect a point-in-time calculation while units remain held. Early performance reflects short-term market cycles rather than long-term mutual fund compounding.',
      takeaway: 'Unrealised changes represent portfolio snapshots, not settled outcomes.'
    }
  },
  {
    id: 'TPL_NEG_MATURE',
    situation: 'NEGATIVE',
    stages: ['M6_12', 'OVER_12'],
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, broader market conditions have influenced recent fund valuations. Equity mutual funds reflect macroeconomic cycles over intermediate periods. Ongoing monthly instalments continue purchasing units at current market levels, maintaining discipline across varying market environments.',
      takeaway: 'Intermediate market cycles affect valuation while ongoing contributions continue disciplined accumulation.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not mean past market corrections are permanent. While fund units remain in your folio, valuation changes remain unrealised. Historical data demonstrates that market indices experience periodic contractions as part of regular economic cycles.',
      takeaway: 'Cyclical market pullbacks are standard characteristics of equity mutual fund investments.'
    }
  },

  // --- SMALL_POSITIVE ---
  {
    id: 'TPL_SMALL_POS',
    situation: 'SMALL_POSITIVE',
    stages: 'ALL',
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your portfolio valuation shows a modest positive increment relative to invested capital. Favorable market conditions during recent instalment dates have supported unit values while your overall holding continues to grow.',
      takeaway: 'Modest initial gains reflect favorable entry levels across your instalment schedule.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not guarantee that valuation will increase every consecutive month. Mutual fund valuations fluctuate across economic cycles, and occasional pullbacks remain standard in equity investing.',
      takeaway: 'Initial positive performance remains subject to ordinary market movements.'
    }
  },

  // --- POSITIVE ---
  {
    id: 'TPL_POS',
    situation: 'POSITIVE',
    stages: 'ALL',
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}, representing a net change of {{abs_return}} ({{abs_return_pct}}).',
    means: {
      title: 'What this means at month {{tenure_months}}',
      body: 'At month {{tenure_months}}, your accumulated units reflect positive market performance across your investment horizon. Instalments made across prior months have benefited from upward NAV movement in the scheme.',
      takeaway: 'Portfolio value reflects compound accumulation across favorable market intervals.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not imply that short-term gains are locked or insulated from future market cycles. Equity funds remain exposed to broader market developments, and long-term horizons remain central to managing risk.',
      takeaway: 'Past gains do not guarantee identical returns in future periods.'
    }
  },

  // --- INSUFFICIENT_DATA ---
  {
    id: 'TPL_INSUFFICIENT_DATA',
    situation: 'INSUFFICIENT_DATA',
    stages: 'ALL',
    figuresSummary: 'Total invested is {{invested}} across {{instalments_paid}} instalments. Current valuation is {{current_value}}.',
    means: {
      title: 'What this means at this stage',
      body: 'Your SIP currently has fewer than two settled instalments or is awaiting updated valuation figures from the fund house. Performance calculations require settled cash flows and published NAV data to provide meaningful comparisons.',
      takeaway: 'Performance calculations activate once settled instalments and fund valuations are available.'
    },
    doesNotMean: {
      title: 'What it does not mean',
      body: 'This does not indicate any failure in your SIP registration or bank autopay mandate. Processing and settlement cycles between the payment aggregator and fund registrar follow standard settlement timelines.',
      takeaway: 'Pending calculation data is normal during early registration and initial settlement.'
    }
  }
] as const;

export function selectTemplate(situation: ReturnSituation, stage: TenureStage): NarrativeTemplate {
  // Find specific situation and stage match first
  const specific = TEMPLATES.find(
    (t) => t.situation === situation && Array.isArray(t.stages) && t.stages.includes(stage)
  );
  if (specific) return specific;

  // Find general match for situation
  const general = TEMPLATES.find((t) => t.situation === situation);
  if (general) return general;

  // Fallback to INSUFFICIENT_DATA template
  return TEMPLATES.find((t) => t.situation === 'INSUFFICIENT_DATA')!;
}

