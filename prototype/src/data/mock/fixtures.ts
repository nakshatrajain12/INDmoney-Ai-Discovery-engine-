import { DATA_LABEL, type PersonaFixture, type ReturnBand, type SipExpectation, type SipStatus } from '@/contracts/domain';
import type { ISODate } from '@/lib/dates';
import { buildSip, MOCK_REASON_CODES as RC, type SipSpec } from './builders';

/**
 * Mock personas. EVERYTHING here is illustrative demo data: fictional schemes, a fictional bank, invented NAVs.
 * No historical NAV is real market data, no customer is real, and nothing is derived from the research survey.
 * Each persona exists to exercise a specific requirement or edge case (see src/data/mock/README.md).
 */
export const FIXTURE_AS_OF: ISODate = '2026-11-08';

type Base = Omit<SipSpec, 'persona' | 'n'>;
type Exp = { status: SipStatus; band: ReturnBand; anomalies?: string[] };

function persona(key: string, label: string, description: string, tags: string[], sips: Array<{ spec: Base; exp: Exp }>): PersonaFixture {
  const bundles = sips.map((s, i) => buildSip({ ...s.spec, persona: key, n: i + 1 }, FIXTURE_AS_OF));
  const expectations: Record<string, SipExpectation> = {};
  sips.forEach((s, i) => {
    expectations[`${key}_s${i + 1}`] = { status: s.exp.status, returnBand: s.exp.band, anomalies: s.exp.anomalies ?? [] };
  });
  return {
    key,
    label,
    description,
    asOf: FIXTURE_AS_OF,
    tags,
    user: { id: `u_${key}`, displayName: `Demo investor (${label})`, personaKey: key, isMock: true, dataLabel: DATA_LABEL },
    sips: bundles,
    expectations
  };
}

// ---- reusable scheme identities (fictional) ----
const NORTHSTAR = { schemeName: 'Northstar Flexi Cap Fund', category: 'Flexi Cap · Direct Growth', folio: '••9019' };
const HARBOR = { schemeName: 'Harbor Large Cap Fund', category: 'Large Cap · Direct Growth', folio: '••2144' };
const SUMMIT = { schemeName: 'Summit Small Cap Fund', category: 'Small Cap · Direct Growth', folio: '••7312' };
const EVERGREEN = { schemeName: 'Evergreen Large & Mid Cap Fund', category: 'Large & Mid Cap · Direct Growth', folio: '••5581' };
const BEACON = { schemeName: 'Beacon Blue Chip Fund', category: 'Large Cap · Direct Growth', folio: '••3309' };
const MERIDIAN = { schemeName: 'Meridian Index Fund', category: 'Index · Direct Growth', folio: '••6620' };
const CEDAR = { schemeName: 'Cedar Balanced Fund', category: 'Hybrid · Direct Growth', folio: '••8841' };
const ORCHID = { schemeName: 'Orchid Multi Asset Fund', category: 'Multi Asset · Direct Growth', folio: '••0472' };

// Failure-persona SIP (Harbor, 5 Jul 2026 start, 5th of each month; the 5 Nov instalment fails).
const failingBase = (failure: NonNullable<SipSpec['failure']>, extra: Partial<Base> = {}): Base => ({
  ...HARBOR,
  frequency: 'MONTHLY',
  amountRupees: 4000,
  first: '2026-07-05',
  navs: [41.2, 41.9, 40.6, 40.1, null],
  currentNav: 40.25,
  failure,
  ...extra
});

export const PERSONAS: PersonaFixture[] = [
  // ------------------------------------------------------------------ returns scenarios
  persona('positive', 'Small positive return', 'Month 6, small positive return. Quiet default: nothing to fix.', ['returns', 'positive'], [
    { spec: { ...SUMMIT, frequency: 'MONTHLY', amountRupees: 3000, first: '2026-05-15', navs: [88.0, 89.2, 90.5, 91.1, 92.4, 93.0], currentNav: 94.6, providerXirrBps: 1660 }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),
  persona('early-flat', 'Early small negative', 'Month 5 with a small negative return (the core Return Coach case).', ['returns', 'negative', 'core'], [
    { spec: { ...NORTHSTAR, frequency: 'MONTHLY', amountRupees: 5000, first: '2026-06-15', navs: [68.2, 67.1, 69.4, 66.8, 65.4], currentNav: 65.87, providerXirrBps: -914 }, exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('negative-large', 'Larger negative return', 'Return well below the small-negative band; the tone must stay calm.', ['returns', 'negative'], [
    { spec: { ...HARBOR, frequency: 'MONTHLY', amountRupees: 4000, first: '2026-06-05', navs: [41.2, 40.1, 38.9, 37.8, 36.9, 36.2], currentNav: 33.9 }, exp: { status: 'ACTIVE', band: 'NEGATIVE' } }
  ]),
  persona('flat-zero', 'Exactly flat', 'Current value equals the amount invested (zero return, no sign artefact).', ['returns', 'flat'], [
    { spec: { ...MERIDIAN, frequency: 'MONTHLY', amountRupees: 2000, first: '2026-07-10', navs: [12.0, 12.2, 11.9, 12.1], currentNav: 'BREAK_EVEN' }, exp: { status: 'ACTIVE', band: 'FLAT' } }
  ]),
  persona('new-month-1', 'One instalment only', 'First instalment three days ago: not enough history to explain.', ['tenure', 'short'], [
    { spec: { ...MERIDIAN, frequency: 'MONTHLY', amountRupees: 1000, first: '2026-11-05', navs: [12.4], currentNav: 12.38 }, exp: { status: 'ACTIVE', band: 'FLAT' } }
  ]),
  persona('two-instalments', 'Two instalments', 'Limited history: two monthly instalments.', ['tenure', 'short'], [
    { spec: { ...CEDAR, frequency: 'MONTHLY', amountRupees: 2000, first: '2026-10-02', navs: [25.1, 24.9], currentNav: 24.6 }, exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('short-weekly', 'Weekly SIP, under a month', 'Weekly SIP with three instalments; annualised figures can look extreme.', ['tenure', 'short', 'frequency'], [
    { spec: { ...CEDAR, frequency: 'WEEKLY', amountRupees: 500, first: '2026-10-19', navs: [18.1, 18.0, 18.15], currentNav: 18.22 }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),
  persona('long-tenure', 'Over 12 months', 'Fourteen monthly instalments; small positive return.', ['returns', 'tenure', 'long'], [
    { spec: { ...ORCHID, frequency: 'MONTHLY', amountRupees: 3000, first: '2025-09-10', navs: [30.0, 30.4, 30.1, 30.9, 31.2, 31.0, 31.8, 32.1, 32.6, 32.2, 32.9, 33.4, 33.1, 33.8], currentNav: 33.2, providerXirrBps: 727 }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),
  persona('quarterly', 'Quarterly SIP', 'Quarterly instalments: tenure and counts must follow the SIP frequency.', ['frequency'], [
    { spec: { ...CEDAR, frequency: 'QUARTERLY', amountRupees: 6000, first: '2026-02-01', navs: [24.0, 24.8, 25.1, 25.4], currentNav: 25.0 }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),

  // ------------------------------------------------------------------ missing / inconsistent data
  persona('missing-valuation', 'No current valuation', 'Instalments exist but no current value or NAV: must not be estimated.', ['data', 'missing'], [
    { spec: { ...BEACON, frequency: 'MONTHLY', amountRupees: 3000, first: '2026-07-20', navs: [40.1, 40.8, 39.9, 40.4], currentNav: null }, exp: { status: 'ACTIVE', band: 'UNKNOWN', anomalies: ['MISSING_VALUATION'] } }
  ]),
  persona('missing-xirr', 'Provider supplies no XIRR', 'Valuation present, provider XIRR absent: the engine recomputes it.', ['data', 'xirr'], [
    { spec: { ...EVERGREEN, frequency: 'MONTHLY', amountRupees: 3000, first: '2026-06-20', navs: [54.0, 55.2, 53.8, 55.9, 55.0], currentNav: 55.1, providerXirrBps: null }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),
  persona('xirr-fails', 'XIRR not meaningful', 'Daily SIP of three days with a +2.5% move: annualised, that is many thousands of times the amount, far outside any sensible bound (independently checked), so XIRR must be unavailable, never approximated.', ['data', 'xirr', 'frequency'], [
    { spec: { ...CEDAR, frequency: 'DAILY', amountRupees: 100, first: '2026-11-06', navs: [10.0, 10.1, 10.2], currentNav: 10.35 }, exp: { status: 'ACTIVE', band: 'SMALL_POSITIVE' } }
  ]),
  persona('inconsistent-xirr', 'Provider XIRR disagrees with return', 'Provider XIRR is positive while the absolute return is negative.', ['data', 'xirr', 'inconsistent'], [
    { spec: { ...NORTHSTAR, frequency: 'MONTHLY', amountRupees: 2500, first: '2026-06-12', navs: [50.0, 49.2, 50.5, 48.9, 48.1], currentNav: 48.3, providerXirrBps: 412 }, exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE', anomalies: ['PROVIDER_XIRR_SIGN_MISMATCH'] } }
  ]),
  persona('missing-instalments-gap', 'Gaps in instalment records', 'Seven instalments are scheduled but three have no record and no failure status.', ['data', 'missing'], [
    {
      spec: { ...HARBOR, frequency: 'MONTHLY', amountRupees: 3500, first: '2026-05-07', navs: [34.0, 34.6, 35.2, 35.9, 35.1, 34.8, 34.2], currentNav: 34.0, outcomes: { 2: 'OMIT', 3: 'OMIT', 5: 'OMIT' } },
      exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE', anomalies: ['SCHEDULE_GAP'] }
    }
  ]),
  persona('multi-sip', 'Three SIPs', 'One investor with several SIPs in different states (the Coach must never aggregate silently).', ['multi', 'dashboard'], [
    { spec: { ...SUMMIT, frequency: 'MONTHLY', amountRupees: 2500, first: '2026-04-15', navs: [88.0, 91.5, 95.2, 93.1, 97.8, 99.4, 100.1], currentNav: 101.2 }, exp: { status: 'ACTIVE', band: 'POSITIVE' } },
    { spec: { ...NORTHSTAR, frequency: 'MONTHLY', amountRupees: 5000, first: '2026-06-15', navs: [68.2, 67.1, 69.4, 66.8, 65.4], currentNav: 65.87 }, exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' } },
    { spec: failingBase({ index: 4, reasonCode: RC.INSUFFICIENT_BALANCE, providerMessage: 'Insufficient funds in account ending 4012.', retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-12', verified: true, manualRetryAllowed: true } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),

  // ------------------------------------------------------------------ failed instalments (one persona per supported category)
  persona('debit-insufficient-balance', 'Failed: insufficient balance', 'Mock provider code: insufficient balance; verified automatic retry; manual retry allowed.', ['debit', 'failure'], [
    { spec: failingBase({ index: 4, reasonCode: RC.INSUFFICIENT_BALANCE, providerMessage: 'Insufficient funds in account ending 4012.', retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-12', verified: true, manualRetryAllowed: true } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-upi-limit', 'Failed: UPI daily limit', 'Mock provider code: UPI daily limit exceeded; no automatic retry; manual retry allowed.', ['debit', 'failure'], [
    { spec: failingBase({ index: 4, reasonCode: RC.UPI_DAILY_LIMIT_EXCEEDED, providerMessage: 'Transaction amount exceeds the daily UPI limit.', retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: true } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-mandate-expired', 'Failed: mandate expired', 'Mock provider code: mandate expired; mandate status EXPIRED; no retry.', ['debit', 'failure', 'mandate'], [
    { spec: failingBase({ index: 4, reasonCode: RC.MANDATE_EXPIRED, providerMessage: 'Mandate is not active.', retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: false } }, { mandate: { status: 'EXPIRED' } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-bank-unavailable', 'Failed: bank unavailable', 'Mock provider code: bank server unavailable; verified automatic retry; no manual retry.', ['debit', 'failure'], [
    { spec: failingBase({ index: 4, reasonCode: RC.BANK_SERVER_UNAVAILABLE, providerMessage: 'Bank did not respond.', retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-09', verified: true, manualRetryAllowed: false } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-timeout', 'Failed: payment timeout', 'Mock provider code: payment timeout; retry pending with no confirmed date.', ['debit', 'failure'], [
    { spec: failingBase({ index: 4, reasonCode: RC.PAYMENT_TIMEOUT, providerMessage: 'Payment request timed out.', retry: { status: 'PENDING', nextRetryDate: null, verified: false, manualRetryAllowed: false } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-technical', 'Failed: technical error, unverified retry date', 'Mock provider code: technical failure. A retry date exists but is NOT verified, so it must never be shown.', ['debit', 'failure', 'unverified-retry'], [
    { spec: failingBase({ index: 4, reasonCode: RC.TECHNICAL_FAILURE, providerMessage: 'A technical error occurred.', retry: { status: 'SCHEDULED', nextRetryDate: '2026-11-11', verified: false, manualRetryAllowed: true } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-unknown', 'Failed: unmapped code', 'Provider code is not in the rules table: the unknown-reason fallback applies; never guess.', ['debit', 'failure', 'unknown'], [
    { spec: failingBase({ index: 4, reasonCode: 'PSP_ERR_77', providerMessage: 'Declined (code 77).', retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: false } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-no-reason', 'Failed: no reason supplied', 'No provider code and no message at all: the unknown-reason fallback applies.', ['debit', 'failure', 'unknown'], [
    { spec: failingBase({ index: 4, reasonCode: null, providerMessage: null, retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: false } }), exp: { status: 'PAYMENT_FAILED', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('debit-recovered', 'Failed, then paid manually', 'A failure resolved by a manual payment: the SIP is ACTIVE again and the failure stays in history.', ['debit', 'failure', 'recovered'], [
    {
      spec: failingBase({ index: 4, reasonCode: RC.INSUFFICIENT_BALANCE, providerMessage: 'Insufficient funds in account ending 4012.', retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: false }, resolvedOn: '2026-11-07', resolvedNav: 40.3 }),
      exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' }
    }
  ]),

  // ------------------------------------------------------------------ pause and restart
  persona('cashflow-pause', 'Active SIP, may need a pause', 'Active SIP with a small negative return; the investor is about to pause for cash-flow reasons.', ['pause'], [
    { spec: { ...NORTHSTAR, frequency: 'MONTHLY', amountRupees: 5000, first: '2026-04-15', navs: [70.0, 69.2, 70.1, 68.2, 67.1, 69.4, 66.8], currentNav: 65.9 }, exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' } }
  ]),
  persona('paused', 'Paused until January', 'Paused by the user until 14 Jan 2027, no restart reminder.', ['pause', 'paused'], [
    {
      spec: { ...SUMMIT, frequency: 'MONTHLY', amountRupees: 2500, first: '2026-04-15', navs: [88.0, 91.5, 95.2, 93.1, 97.8, 99.4, null], currentNav: 101.2, pause: { start: '2026-10-15', end: '2027-01-14', state: 'ACTIVE', requestedOn: '2026-10-12' } },
      exp: { status: 'PAUSED', band: 'POSITIVE' }
    }
  ]),
  persona('restart-pending', 'Paused, restart soon', 'Paused until 19 Nov 2026 with an opted-in restart reminder scheduled for 17 Nov.', ['pause', 'reminder', 'restart-pending'], [
    {
      spec: { ...EVERGREEN, frequency: 'MONTHLY', amountRupees: 3000, first: '2026-03-20', navs: [54.0, 55.2, 53.8, 55.9, null, null, null, null], currentNav: 55.1, pause: { start: '2026-07-20', end: '2026-11-19', state: 'ACTIVE', requestedOn: '2026-07-18' }, reminder: { remindOn: '2026-11-17', optedIn: true, status: 'SCHEDULED', channels: ['IN_APP'] } },
      exp: { status: 'RESTART_PENDING', band: 'SMALL_POSITIVE' }
    }
  ]),
  persona('pause-scheduled', 'Pause scheduled for later', 'A pause is scheduled to start 20 Nov 2026; today the SIP is still active.', ['pause', 'scheduled'], [
    {
      spec: { ...HARBOR, frequency: 'MONTHLY', amountRupees: 2500, first: '2026-06-15', navs: [40.0, 39.5, 40.8, 39.9, 39.2], currentNav: 39.6, pause: { start: '2026-11-20', end: '2026-12-19', state: 'SCHEDULED', requestedOn: '2026-11-06' } },
      exp: { status: 'ACTIVE', band: 'SMALL_NEGATIVE' }
    }
  ]),

  // ------------------------------------------------------------------ cancelled
  persona('cancelled', 'Cancelled SIP', 'Cancelled on 10 Aug 2026; accumulated units remain; no further instalments.', ['cancelled'], [
    { spec: { ...BEACON, frequency: 'MONTHLY', amountRupees: 3000, first: '2026-02-10', navs: [31.0, 31.8, 30.9, 32.5, 32.9, 33.4], currentNav: 33.1, cancelledOn: '2026-08-10', mandate: { status: 'INACTIVE' } }, exp: { status: 'CANCELLED', band: 'SMALL_POSITIVE' } }
  ]),
  persona('cancelled-with-failure', 'Cancelled after a failed instalment', 'A failure notice exists for a SIP that has since been cancelled: no retry or renew action may be offered.', ['cancelled', 'failure'], [
    {
      spec: failingBase({ index: 4, reasonCode: RC.INSUFFICIENT_BALANCE, providerMessage: 'Insufficient funds in account ending 4012.', retry: { status: 'NONE', nextRetryDate: null, verified: false, manualRetryAllowed: false } }, { cancelledOn: '2026-11-07', mandate: { status: 'INACTIVE' } }),
      exp: { status: 'CANCELLED', band: 'SMALL_NEGATIVE', anomalies: ['CANCELLED_WITH_OPEN_FAILURE'] }
    }
  ])
];

export const PERSONA_KEYS = PERSONAS.map((p) => p.key);
