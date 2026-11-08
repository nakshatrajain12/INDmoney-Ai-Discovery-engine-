import {
  DATA_LABEL,
  type Instalment,
  type PauseSchedule,
  type PaymentFailure,
  type RestartReminder,
  type Sip,
  type SipBundle,
  type Valuation
} from '@/contracts/domain';
import { addDays, dueDatesUpTo, type Frequency, type ISODate } from '@/lib/dates';

/** Money is integer paise; NAV and units are integers scaled by 10,000. All NAV values are ILLUSTRATIVE demo numbers. */
export const rupees = (r: number): number => Math.round(r * 100);
export const navE4 = (nav: number): number => Math.round(nav * 10_000);
export const unitsE4 = (amountPaise: number, nav_E4: number): number => Math.round((amountPaise * 1_000_000) / nav_E4);
export const valuePaise = (totalUnitsE4: number, nav_E4: number): number => Math.round((totalUnitsE4 * nav_E4) / 1_000_000);

export const MOCK_REASON_CODES = {
  INSUFFICIENT_BALANCE: 'MOCK_INSUFFICIENT_BALANCE',
  UPI_DAILY_LIMIT_EXCEEDED: 'MOCK_UPI_DAILY_LIMIT_EXCEEDED',
  MANDATE_EXPIRED: 'MOCK_MANDATE_EXPIRED',
  BANK_SERVER_UNAVAILABLE: 'MOCK_BANK_SERVER_UNAVAILABLE',
  PAYMENT_TIMEOUT: 'MOCK_PAYMENT_TIMEOUT',
  TECHNICAL_FAILURE: 'MOCK_TECHNICAL_FAILURE'
} as const;

type Outcome = 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED' | 'OMIT';

export interface FailureSpec {
  /** Index of the scheduled due date that failed. */
  index: number;
  reasonCode: string | null;
  providerMessage: string | null;
  retry: PaymentFailure['retry'];
  /** If set, the failure was later resolved by a manual payment on this date (instalment becomes SUCCESS). */
  resolvedOn?: ISODate;
  resolvedNav?: number;
}

export interface SipSpec {
  persona: string;
  n: number; // 1-based SIP number within the persona
  schemeName: string;
  category: string;
  folio: string;
  frequency: Frequency;
  amountRupees: number;
  first: ISODate;
  /** NAV for each scheduled due date (null = NAV unavailable). Only used for SUCCESS instalments. */
  navs: Array<number | null>;
  /** Current NAV; null = unavailable. 'BREAK_EVEN' sets NAV so that value equals invested (exact zero return). */
  currentNav: number | null | 'BREAK_EVEN';
  /** Override the computed current value (paise); null = valuation unavailable. */
  valueOverridePaise?: number | null;
  providerXirrBps?: number | null;
  outcomes?: Record<number, Outcome>;
  failure?: FailureSpec;
  mandate?: Partial<Sip['mandate']>;
  cancelledOn?: ISODate | null;
  pause?: {
    start: ISODate;
    end: ISODate | null;
    state: PauseSchedule['state'];
    requestedOn: ISODate;
  };
  reminder?: { remindOn: ISODate | null; optedIn: boolean; status: RestartReminder['status']; channels?: RestartReminder['channels'] };
}

export function buildSip(spec: SipSpec, asOf: ISODate): SipBundle {
  const sipId = `${spec.persona}_s${spec.n}`;
  const userId = `u_${spec.persona}`;
  const amountPaise = rupees(spec.amountRupees);

  let dues = dueDatesUpTo(spec.first, spec.frequency, asOf);
  if (spec.cancelledOn) dues = dues.filter((d) => d < spec.cancelledOn!);

  const pauseDue = (d: ISODate) => spec.pause !== undefined && d >= spec.pause.start && (spec.pause.end === null || d <= spec.pause.end);

  const instalments: Instalment[] = [];
  dues.forEach((due, i) => {
    let outcome: Outcome = spec.outcomes?.[i] ?? (pauseDue(due) ? 'SKIPPED' : 'SUCCESS');
    if (spec.failure && spec.failure.index === i) outcome = spec.failure.resolvedOn ? 'SUCCESS' : 'FAILED';
    if (outcome === 'OMIT') return;
    const id = `${sipId}_i${i}`;
    if (outcome === 'SUCCESS') {
      const resolved = spec.failure && spec.failure.index === i && spec.failure.resolvedOn;
      const nav = resolved ? (spec.failure!.resolvedNav ?? null) : (spec.navs[i] ?? null);
      const nE4 = nav === null ? null : navE4(nav);
      instalments.push({
        id,
        sipId,
        dueDate: due,
        amountPaise,
        status: 'SUCCESS',
        settledOn: resolved ? spec.failure!.resolvedOn! : due,
        navE4: nE4,
        unitsE4: nE4 === null ? null : unitsE4(amountPaise, nE4)
      });
    } else {
      instalments.push({ id, sipId, dueDate: due, amountPaise, status: outcome, settledOn: null, navE4: null, unitsE4: null });
    }
  });

  const paid = instalments.filter((x) => x.status === 'SUCCESS');
  const investedPaise = paid.reduce((a, x) => a + x.amountPaise, 0);
  const allUnits = paid.every((x) => x.unitsE4 !== null);
  const totalUnits = paid.reduce((a, x) => a + (x.unitsE4 ?? 0), 0);

  let currentNavE4: number | null = null;
  let currentValuePaise: number | null = null;
  if (spec.currentNav === 'BREAK_EVEN') {
    currentNavE4 = Math.round((investedPaise * 1_000_000) / totalUnits);
    currentValuePaise = investedPaise;
  } else if (spec.currentNav !== null) {
    currentNavE4 = navE4(spec.currentNav);
    currentValuePaise = allUnits && paid.length > 0 ? valuePaise(totalUnits, currentNavE4) : null;
  }
  if (spec.valueOverridePaise !== undefined) currentValuePaise = spec.valueOverridePaise;

  const navHistory = [
    ...paid.filter((x) => x.navE4 !== null).map((x) => ({ date: x.settledOn!, navE4: x.navE4! })),
    ...(currentNavE4 !== null ? [{ date: asOf, navE4: currentNavE4 }] : [])
  ];

  const valuation: Valuation = {
    sipId,
    asOfDate: asOf,
    currentValuePaise,
    currentNavE4,
    navHistory,
    providerXirrBps: spec.providerXirrBps ?? null,
    navSource: 'ILLUSTRATIVE_DEMO'
  };

  const failures: PaymentFailure[] = [];
  if (spec.failure) {
    const idx = spec.failure.index;
    failures.push({
      id: `${sipId}_f1`,
      sipId,
      instalmentId: `${sipId}_i${idx}`,
      occurredOn: dues[idx]!,
      amountPaise,
      reasonCode: spec.failure.reasonCode,
      providerMessage: spec.failure.providerMessage,
      retry: spec.failure.retry,
      resolved: Boolean(spec.failure.resolvedOn),
      resolvedOn: spec.failure.resolvedOn ?? null
    });
  }

  let pause: PauseSchedule | null = null;
  if (spec.pause) {
    // Every scheduled due date inside the pause window is skipped, including future ones (open-ended: up to asOf only).
    const horizon = spec.pause.end ?? asOf;
    const skipped: ISODate[] = dueDatesUpTo(spec.first, spec.frequency, addDays(horizon, 0)).filter(
      (d) => d >= spec.pause!.start && d <= horizon
    );
    pause = {
      id: `${sipId}_p1`,
      sipId,
      requestedOn: spec.pause.requestedOn,
      pauseStart: spec.pause.start,
      pauseEnd: spec.pause.end,
      state: spec.pause.state,
      skippedDueDates: skipped,
      resumedOn: null,
      cancelledOn: null
    };
  }

  let reminder: RestartReminder | null = null;
  if (spec.reminder && pause) {
    reminder = {
      id: `${sipId}_r1`,
      pauseId: pause.id,
      optedIn: spec.reminder.optedIn,
      remindOn: spec.reminder.remindOn,
      channels: spec.reminder.channels ?? ['IN_APP'],
      status: spec.reminder.status,
      sentOn: null
    };
  }

  const lastSuccessful = paid.length ? paid.map((x) => x.settledOn!).sort().at(-1)! : null;
  const sip: Sip = {
    id: sipId,
    userId,
    schemeName: spec.schemeName,
    category: spec.category,
    folioMasked: spec.folio,
    investmentDate: spec.first,
    frequency: spec.frequency,
    instalmentAmountPaise: amountPaise,
    mandate: { type: 'E_MANDATE', status: 'ACTIVE', bankLabel: 'Demo Bank ••4012', ...spec.mandate },
    cancelledOn: spec.cancelledOn ?? null,
    declared: { totalInvestedPaise: investedPaise, lastSuccessfulInstalmentDate: lastSuccessful },
    isMock: true,
    dataLabel: DATA_LABEL
  };

  return { sip, instalments, valuation, failures, pause, reminder };
}
