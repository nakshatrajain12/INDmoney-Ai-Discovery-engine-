import type { FinancialMetrics, SipBundle } from '@/contracts/domain';
import type { ISODate } from '@/lib/dates';
import { classify, type Situation } from './classify';
import { BANDS_V1, type BandsConfig } from './config';
import { absoluteReturn, investedPaise } from './returns';
import { computeTenure, countInstalments, firstSuccessfulDate, settledInstalments } from './tenure';
import { reconcileXirr, xirr, type Reconciliation } from './xirr';

/**
 * The deterministic returns engine: a pure function of one SIP bundle, an as-of date and the rules file.
 * It uses only instalment cash amounts and dates and the valuation's current value. It never reads NAV, units or
 * NAV history, so illustrative demo NAVs can never be mistaken for market data by this code (verified by a test
 * that perturbs them and by a source scan). No I/O, no clock, no randomness, no LLM.
 */
export type DataFlag =
  | 'VALUATION_MISSING'
  | 'VALUATION_DATE_MISMATCH'
  | 'VALUATION_SUSPECT'
  | 'DECLARED_INVESTED_MISMATCH'
  | 'XIRR_ANNUALISED_SHORT_PERIOD'
  | 'XIRR_PROVIDER_MISMATCH'
  | 'NO_SUCCESSFUL_INSTALMENT';

export interface EngineDetail {
  firstSuccessfulDate: ISODate | null;
  tenureDays: number;
  /** A% in hundredths of a percent: the figure shown to users and compared with the bands. */
  absolutePctE2: number | null;
  xirrAnnualisedShortPeriod: boolean;
  xirrMismatch: boolean;
  reconciliation: Reconciliation;
  providerXirrBps: number | null;
  flags: DataFlag[];
  /** Always the label the data carries: the engine passes it through, it never upgrades it. */
  valuationSource: 'ILLUSTRATIVE_DEMO' | null;
  isMock: true;
}

export interface EngineResult {
  metrics: FinancialMetrics;
  detail: EngineDetail;
}

export function computeMetrics(bundle: SipBundle, asOf: ISODate, cfg: BandsConfig = BANDS_V1): EngineResult {
  const { sip, instalments, valuation } = bundle;
  const flags: DataFlag[] = [];

  const settled = settledInstalments(instalments, asOf);
  const invested = investedPaise(instalments, asOf);
  const counts = countInstalments(instalments, asOf);
  const first = firstSuccessfulDate(settled);
  if (first === null) flags.push('NO_SUCCESSFUL_INSTALMENT');
  if (invested !== sip.declared.totalInvestedPaise) flags.push('DECLARED_INVESTED_MISMATCH');

  // One valuation date only: a valuation for another date is never mixed with as-of figures.
  let value: number | null = valuation?.currentValuePaise ?? null;
  if (valuation && value !== null && valuation.asOfDate !== asOf) {
    flags.push('VALUATION_DATE_MISMATCH');
    value = null;
  } else if (value === null) {
    flags.push('VALUATION_MISSING');
  }
  // edge-cases RC-E2d: a zero value against money invested is treated as suspect data. We never present -100% as fact.
  if (value === 0 && invested > 0) {
    flags.push('VALUATION_SUSPECT');
    value = null;
  }

  const tenure = computeTenure(first, asOf, cfg);
  const abs = absoluteReturn(invested, value);
  const situation: Situation = classify({ absolutePctE2: abs?.pctE2 ?? null, instalmentsPaid: counts.paid }, cfg);

  let xirrStatus: FinancialMetrics['xirrStatus'];
  let xirrPct: number | null = null;
  if (value === null) {
    xirrStatus = 'UNAVAILABLE_NO_VALUATION';
  } else {
    const flows = [...settled.map((i) => ({ date: i.settledOn!, amountPaise: -i.amountPaise })), { date: asOf, amountPaise: value }];
    const r = xirr(flows, cfg);
    xirrStatus = r.status === 'OK' ? 'OK' : r.status;
    xirrPct = r.ratePct;
  }

  const shortPeriod = xirrPct !== null && tenure.months < cfg.thresholds.shortPeriodXirrBelowMonths.value;
  if (shortPeriod) flags.push('XIRR_ANNUALISED_SHORT_PERIOD');
  const providerXirrBps = valuation?.providerXirrBps ?? null;
  const reconciliation = reconcileXirr(xirrPct, providerXirrBps, cfg);
  const xirrMismatch = reconciliation.status === 'MISMATCH';
  if (xirrMismatch) flags.push('XIRR_PROVIDER_MISMATCH');

  const metrics: FinancialMetrics = {
    sipId: sip.id,
    asOf,
    investedPaise: invested,
    currentValuePaise: value,
    absoluteReturnPaise: abs?.paise ?? null,
    absoluteReturnPct: abs === null ? null : abs.pctE4 / 10_000,
    xirrPct,
    xirrStatus,
    instalmentsPaid: counts.paid,
    instalmentsFailed: counts.failed,
    instalmentsPending: counts.pending,
    tenureMonths: tenure.months,
    stage: tenure.stage,
    situation
  };

  return {
    metrics,
    detail: {
      firstSuccessfulDate: first,
      tenureDays: tenure.days,
      absolutePctE2: abs?.pctE2 ?? null,
      xirrAnnualisedShortPeriod: shortPeriod,
      xirrMismatch,
      reconciliation,
      providerXirrBps,
      flags,
      valuationSource: valuation?.navSource ?? null,
      isMock: true
    }
  };
}
