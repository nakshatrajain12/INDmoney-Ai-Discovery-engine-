/* SIP Steady: clickable prototype. MOCK DATA ONLY. No real accounts, no real transactions, no network calls.
   Structure mirrors docs/architecture.md: deterministic core (returns, debit rules, pause logic) + template text.
   There is NO language model in this prototype; every sentence is a template filled with computed values. */
(function () {
'use strict';

/* ===================== utilities ===================== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MS = 86400000;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const P = s => { const a = s.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); };
const ISO = ms => new Date(ms).toISOString().slice(0, 10);
const fmtD = s => { const d = new Date(P(s)); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const fmtDS = s => { const d = new Date(P(s)); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
const addDays = (s, n) => ISO(P(s) + n * MS);
const addMonths = (s, n) => {
  const d = new Date(P(s)); let y = d.getUTCFullYear(), m = d.getUTCMonth() + n; const day = d.getUTCDate();
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return ISO(Date.UTC(y, m, Math.min(day, dim)));
};
const diffDays = (a, b) => Math.round((P(b) - P(a)) / MS);
const monthsBetween = (a, b) => { let n = 0; while (addMonths(a, n + 1) <= b) n++; return n; };
function dueDates(day, from, count) {
  const out = []; const d0 = new Date(P(from)); let y = d0.getUTCFullYear(), m = d0.getUTCMonth();
  while (out.length < count) {
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const c = ISO(Date.UTC(y, m, Math.min(day, dim)));
    if (c >= from) out.push(c);
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const MINUS = '−';
const paise = r => Math.round(r * 100);

/* ===================== mock data (fictional schemes, fictional bank) ===================== */
const TODAY0 = '2026-11-08';
function gen(first, amounts, navs) {
  return navs.map((nav, i) => ({ date: addMonths(first, i), amount: Array.isArray(amounts) ? amounts[i] : amounts, status: 'SUCCESS', nav }));
}
function buildData() {
  return {
    sips: [
      { id: 'A', name: 'Northstar Flexi Cap Fund', cat: 'Flexi Cap · Direct Growth', folio: '••9019', day: 15, amount: 5000, status: 'ACTIVE', mandate: 'ACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 65.87, instalments: gen('2026-06-15', 5000, [68.20, 67.10, 69.40, 66.80, 65.40]), event: null, pause: null, initials: 'NF' },
      { id: 'B', name: 'Harbor Large Cap Fund', cat: 'Large Cap · Direct Growth', folio: '••2144', day: 5, amount: 4000, status: 'ACTIVE', mandate: 'ACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 40.25, instalments: gen('2026-07-05', 4000, [41.20, 41.90, 40.60, 40.10]), pause: null, initials: 'HL',
        event: { id: 'EV1', date: '2026-11-05', amount: 4000, reasonCode: 'INSUFFICIENT_BALANCE', providerMessage: 'Insufficient funds in account ending 4012.', time: '06:15', resolved: false,
                 retry: { auto: true, date: '2026-11-12', time: '06:00', manualAllowed: true }, attempts: 1, mandateType: 'E-mandate (demo)' } },
      { id: 'C', name: 'Summit Small Cap Fund', cat: 'Small Cap · Direct Growth', folio: '••7312', day: 15, amount: 2500, status: 'PAUSED', mandate: 'ACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 101.2, instalments: gen('2026-04-15', 2500, [88.0, 91.5, 95.2, 93.1, 97.8, 99.4]), event: null, initials: 'SS',
        pause: { start: '2026-10-15', end: '2027-01-14', resume: '2027-01-15', skipped: ['2026-10-15', '2026-11-15', '2026-12-15'], reminder: { on: false, mode: null, remindOn: null, daysBefore: null, channels: ['inapp'], sent: false } } },
      { id: 'D', name: 'Evergreen Large & Mid Cap Fund', cat: 'Large & Mid Cap · Direct Growth', folio: '••5581', day: 20, amount: 3000, status: 'PAUSED', mandate: 'ACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 55.1, instalments: gen('2026-03-20', 3000, [54.0, 55.2, 53.8, 55.9]), event: null, initials: 'EL',
        pause: { start: '2026-07-20', end: '2026-11-19', resume: '2026-11-20', skipped: ['2026-07-20', '2026-08-20', '2026-09-20', '2026-10-20'], reminder: { on: true, mode: 'd3', remindOn: '2026-11-17', daysBefore: 3, channels: ['inapp'], sent: false } } },
      { id: 'E', name: 'Beacon Blue Chip Fund', cat: 'Large Cap · Direct Growth', folio: '••3309', day: 10, amount: 3000, status: 'CANCELLED', mandate: 'INACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 33.1, instalments: gen('2026-02-10', 3000, [31.0, 31.8, 30.9, 32.5, 32.9, 33.4]), event: null, pause: null, cancelledOn: '2026-08-10', initials: 'BB' },
      { id: 'F', name: 'Meridian Index Fund', cat: 'Index · Direct Growth', folio: '••6620', day: 5, amount: 1000, status: 'ACTIVE', mandate: 'ACTIVE', bank: 'Demo Bank ••4012',
        currentNav: 12.38, instalments: gen('2026-11-05', 1000, [12.40]), event: null, pause: null, initials: 'MI' }
    ]
  };
}

/* ===================== deterministic engine ===================== */
const FLAT_BAND = 0.5, SMALL_NEG = -5; // demo thresholds (owner sets real values; not research outputs)
function xirrCalc(flows) {
  if (flows.length < 2) return null;
  const hasNeg = flows.some(f => f.c < 0), hasPos = flows.some(f => f.c > 0);
  if (!hasNeg || !hasPos) return null;
  const d0 = P(flows[0].d);
  const f = r => flows.reduce((a, x) => a + x.c / Math.pow(1 + r, (P(x.d) - d0) / MS / 365), 0);
  let lo = -0.9999, hi = 100;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
  const r = (lo + hi) / 2;
  return isFinite(r) ? r * 100 : null;
}
function calcSip(s, today) {
  const paid = s.instalments.filter(i => i.status === 'SUCCESS').sort((a, b) => a.date < b.date ? -1 : 1);
  const investedP = paid.reduce((a, i) => a + paise(i.amount), 0);
  const units = paid.reduce((a, i) => a + i.amount / i.nav, 0);
  const valueP = Math.round(units * s.currentNav * 100);
  const absP = valueP - investedP;
  const absPct = investedP ? absP / investedP * 100 : null;
  const first = paid.length ? paid[0].date : null;
  const months = first ? monthsBetween(first, today) : 0;
  const flows = paid.map(i => ({ d: i.date, c: -i.amount })).concat([{ d: today, c: valueP / 100 }]);
  const x = xirrCalc(flows);
  const stage = months < 1 ? 'M1' : months < 3 ? 'M1_3' : months < 6 ? 'M3_6' : months < 12 ? 'M6_12' : 'OVER_12';
  let situation = 'INSUFFICIENT_DATA';
  if (paid.length >= 2 && investedP > 0) {
    situation = absPct <= SMALL_NEG ? 'NEGATIVE' : absPct <= -FLAT_BAND ? 'SMALL_NEGATIVE' : absPct < FLAT_BAND ? 'FLAT' : absPct < 5 ? 'SMALL_POSITIVE' : 'POSITIVE';
  }
  const avgNav = units ? (investedP / 100) / units : null;
  return { paid, investedP, valueP, absP, absPct, units, avgNav, first, months, monthNo: months + 1, xirr: x, stage, situation, flows,
    daysHeld: first ? diffDays(first, today) : 0 };
}
function portfolio(sips, today) {
  let inv = 0, val = 0, flows = [];
  sips.filter(s => s.status !== 'CANCELLED').forEach(s => { const c = calcSip(s, today); inv += c.investedP; val += c.valueP; flows = flows.concat(c.flows.slice(0, -1)); });
  flows.sort((a, b) => a.d < b.d ? -1 : 1); flows.push({ d: today, c: val / 100 });
  return { investedP: inv, valueP: val, absP: val - inv, absPct: inv ? (val - inv) / inv * 100 : 0, xirr: xirrCalc(flows) };
}
function confidenceFor(c, sourcesVerified) {
  if (c.situation === 'INSUFFICIENT_DATA') return { label: 'LOW', reasons: ['Not enough instalments to explain'] };
  const reasons = ['Figures complete (demo data)', 'Situation matched a rule'];
  if (!sourcesVerified) return { label: 'MEDIUM', reasons: reasons.concat(['Explanatory sources are demo placeholders, not yet verified']) };
  return { label: 'HIGH', reasons: reasons.concat(['Verified source attached']) };
}

/* ---------- debit rules (versioned table; categories are ILLUSTRATIVE, replaced by real provider codes later) ---------- */
const RULE_VERSION = 'demo-v1';
const RULES = {
  INSUFFICIENT_BALANCE: { cat: 'Account balance', reason: 'Your bank reported that the account balance was not enough for this debit.', status: 'MISSED_CONTINUES', primary: 'MANUAL_RETRY' },
  UPI_LIMIT_EXCEEDED: { cat: 'UPI limit', reason: 'The UPI limit on the account was reached on the debit date.', status: 'MISSED_CONTINUES', primary: 'MANUAL_RETRY' },
  MANDATE_EXPIRED: { cat: 'Autopay mandate', reason: 'The autopay mandate is no longer active.', status: 'MISSED_CONTINUES', primary: 'RENEW_MANDATE' },
  BANK_UNAVAILABLE: { cat: 'Bank', reason: 'Your bank did not respond to this debit request.', status: 'MISSED_CONTINUES', primary: 'WAIT_RETRY' }
};
const REASON_LABEL = { INSUFFICIENT_BALANCE: 'Insufficient balance', UPI_LIMIT_EXCEEDED: 'UPI limit exceeded', MANDATE_EXPIRED: 'Mandate expired', BANK_UNAVAILABLE: 'Bank unavailable', UNKNOWN: 'Unknown reason (not in rules)' };
function nextDue(s, today) {
  if (s.status === 'CANCELLED') return null;
  if (s.status === 'PAUSED' && s.pause) return s.pause.resume;
  return dueDates(s.day, today, 1)[0];
}
function evalDebit(s, today) {
  const ev = s.event; const rule = RULES[ev.reasonCode];
  const known = !!rule;
  const nd = nextDue(s, today);
  let primary = null, secondary = null;
  if (s.status === 'CANCELLED') {
    return { cancelled: true, known, statusState: 'CANCELLED', statusText: 'This SIP is cancelled, so no further instalments will be taken.', primary: null, secondary: null };
  }
  const kind = known ? rule.primary : 'SUPPORT';
  if (kind === 'MANUAL_RETRY' && ev.retry && ev.retry.manualAllowed && !ev.resolved) primary = { type: 'PAY', label: 'Pay ' + inrR(ev.amount) + ' manually now' };
  else if (kind === 'RENEW_MANDATE' && s.mandate !== 'ACTIVE') primary = { type: 'MANDATE', label: 'Renew autopay mandate' };
  else if (kind === 'RENEW_MANDATE') primary = { type: 'PAY', label: 'Pay ' + inrR(ev.amount) + ' manually now' };
  else if (kind === 'WAIT_RETRY') primary = { type: 'WAIT', label: 'Wait for the automatic retry' };
  else primary = { type: 'SUPPORT', label: 'Contact support' };
  if (primary.type !== 'MANDATE') secondary = { type: 'MANDATE', label: 'Manage bank mandate' };
  const retryText = ev.retry && ev.retry.auto ? 'Next automatic retry: ' + fmtD(ev.retry.date) + (ev.retry.time ? ', ' + ev.retry.time : '') + ' (from the provider)' : null;
  return {
    known, reasonText: known ? rule.reason : 'We couldn’t complete this debit, and we don’t have a reason to share yet.',
    category: known ? rule.cat : 'Not available', statusState: 'MISSED_CONTINUES',
    statusText: 'Your SIP is still active. The ' + fmtD(ev.date) + ' instalment of ' + inrR(ev.amount) + ' failed. The next scheduled instalment is on ' + (nd ? fmtD(nd) : '—') + '.',
    primary, secondary, retryText, providerMessage: known || ev.providerMessage ? ev.providerMessage : null, ruleVersion: RULE_VERSION
  };
}

/* ---------- Return Coach templates (no model) ---------- */
const SOURCES = [{ id: 'demo-1', publisher: 'Demo content library', title: 'How SIP returns and XIRR work (placeholder)', note: 'Placeholder. Replace with verified AMFI, SEBI or fund-house material before any real use.', date: 'not yet verified' }];
function signedInr(p) { if (S.hidden) return '₹••••'; return (p < 0 ? MINUS : p > 0 ? '+' : '') + '₹' + nf.format(Math.round(Math.abs(p) / 100)); }
function signedPct(x) { return (x < 0 ? MINUS : x > 0 ? '+' : '') + Math.abs(x).toFixed(2) + '%'; }
function coachContent(s, c) {
  if (c.situation === 'INSUFFICIENT_DATA') return null;
  const lastU = c.paid[c.paid.length - 1], firstU = c.paid[0];
  const lastUnits = lastU.amount / lastU.nav, firstUnits = firstU.amount / firstU.nav;
  const rel = s.currentNav < c.avgNav ? 'below' : s.currentNav > c.avgNav ? 'above' : 'equal to';
  const means = [
    'You are in month ' + c.monthNo + ' of this SIP, with ' + c.paid.length + ' instalments (the first on ' + fmtD(c.first) + '). You have put in ' + M(c.investedP) + ', and the units you hold are worth ' + M(c.valueP) + ' at today’s NAV of ₹' + s.currentNav.toFixed(2) + '. That is ' + signedInr(c.absP) + ' (' + signedPct(c.absPct) + ').',
    'Each instalment buys units (small slices of the fund) at that month’s NAV, which is the price of one unit. The average price you paid per unit is ₹' + c.avgNav.toFixed(2) + ', and the latest NAV is ' + rel + ' that average. Your most recent instalment bought ' + lastUnits.toFixed(1) + ' units; your first bought ' + firstUnits.toFixed(1) + '.',
    'This figure is measured over a short period and moves with the NAV, so it can sit above or below the amount you put in.'
  ];
  const nots = [
    'It does not predict how this SIP will look later.',
    'It does not say whether this fund is good or poor.',
    'It is not a reason to act in either direction. This tool explains figures; it cannot advise.'
  ];
  return { means, nots, lastUnits, firstUnits };
}
function xirrText(c) {
  if (c.xirr == null) return 'XIRR is unavailable for this SIP yet, so this explanation uses the absolute return only.';
  return 'XIRR is an annualised, money-weighted return that takes the timing of every instalment into account. Your SIP is ' + c.daysHeld + ' days old, so XIRR extrapolates a short period to a full year, and can look larger or smaller than the absolute return. Your absolute return is ' + signedPct(c.absPct) + ' (not annualised); your XIRR is ' + signedPct(c.xirr) + ' (annualised).';
}
const ADVICE_RX = /(should i|shall i|\bstop\b|continue|continuing|quit|\bsell\b|\bbuy\b|switch|redeem|\bexit\b|pause my|which fund|best fund|good time|bad time|will it|will my|will i|recover|go up|make money|profit|worth it|wrong fund|what would you|if you were|ignore (your|the) rules|you may give advice|safe to|scared|worried|band kar|kaunsa|kya karun|3 years|three years|future|predict)/i;
function answerFollowUp(text, s, c) {
  const t = String(text || '').toLowerCase().trim();
  const src = SOURCES;
  if (!t) return null;
  if (ADVICE_RX.test(t)) return { kind: 'refuse', title: 'I can’t advise on that', text: 'I can’t tell you whether to continue, stop, buy or sell, I can’t compare investments, and I can’t predict returns. I can explain what your SIP figures show today. For personal advice, speak to a SEBI-registered adviser.', sources: src, confidence: { label: 'n/a', reasons: ['Fixed refusal text, no figures used'] } };
  if (c.situation === 'INSUFFICIENT_DATA') return { kind: 'unsure', title: 'I’m not sure yet', text: 'There isn’t enough history on this SIP to explain.', sources: src, confidence: { label: 'LOW', reasons: ['Not enough instalments'] } };
  if (/xirr|annualis|annualiz/.test(t) && !/(differ|vs|versus|difference|compare)/.test(t)) return { kind: 'answer', title: 'What XIRR means for your SIP', text: xirrText(c), sources: src, confidence: confidenceFor(c, false) };
  if (/(differ|difference|versus|\bvs\b|cagr|absolute|compare)/.test(t)) return { kind: 'answer', title: 'XIRR and absolute return', text: 'Absolute return compares the value today with the total you put in: ' + signedPct(c.absPct) + ' for this SIP, not annualised. XIRR adds the timing of each instalment and expresses the result per year' + (c.xirr == null ? ', but it is unavailable for this SIP yet.' : ': ' + signedPct(c.xirr) + '. Over a short period the two can look quite different.'), sources: src, confidence: confidenceFor(c, false) };
  if (/\bnav\b|price|dropped|drop|changed/.test(t)) {
    const lp = c.paid[c.paid.length - 1];
    return { kind: 'answer', title: 'How the NAV moved', text: 'Your latest instalment bought units at ₹' + lp.nav.toFixed(2) + ' on ' + fmtD(lp.date) + '. The NAV today is ₹' + s.currentNav.toFixed(2) + ', a change of ' + signedPct((s.currentNav / lp.nav - 1) * 100) + '. I can show how the NAV changed, but I can’t explain why markets moved.', sources: src, confidence: confidenceFor(c, false) };
  }
  if (/unit/.test(t)) return { kind: 'answer', title: 'Your units', text: 'You hold about ' + c.units.toFixed(1) + ' units from ' + c.paid.length + ' instalments. A fixed amount buys more units when the NAV is lower and fewer when it is higher.', sources: src, confidence: confidenceFor(c, false) };
  if (/average|avg/.test(t)) return { kind: 'answer', title: 'Your average purchase NAV', text: 'Your average purchase NAV is ₹' + c.avgNav.toFixed(2) + ' (total invested divided by total units).', sources: src, confidence: confidenceFor(c, false) };
  if (/instalment|installment|how many|how long|month/.test(t)) return { kind: 'answer', title: 'Your SIP so far', text: 'You have completed ' + c.paid.length + ' instalments since ' + fmtD(c.first) + ', which puts you in month ' + c.monthNo + '.', sources: src, confidence: confidenceFor(c, false) };
  return { kind: 'unsure', title: 'I’m not sure about that', text: 'I can explain your figures, XIRR, absolute return, NAV and units. For anything else, please use the official sources or support.', sources: src, confidence: { label: 'LOW', reasons: ['Out of scope or no approved passage'] } };
}

/* ===================== state ===================== */
const S = {
  theme: 'dark', today: TODAY0, hidden: false, stack: [{ name: 'dashboard', p: {} }], loading: false, error: false,
  sheet: null, toast: null, inbox: [], data: buildData(), guideOpen: false,
  ui: { sel: null, filter: 'all', sipFilter: 'all', thread: [], xirrOpen: false, fb: {}, optSel: null, pauseSel: null, custom: { start: '', end: '' }, ack: false, pauseErr: null,
        rem: { on: false, opt: null, date: '', channels: ['inapp'], err: null }, reduce: { amount: '', err: null }, extendSel: null, payBusy: false, payResult: null, fu: '' },
  sim: { errorNext: false, slow: false, payFails: false, pauseFails: false, reason: 'INSUFFICIENT_BALANCE', noDelay: false },
  journey: { A: {}, B: {}, C: {} }
};
try { const t = localStorage.getItem('ind_theme'); if (t === 'light') S.theme = 'light'; } catch (e) { /* storage unavailable */ }
const sipById = id => S.data.sips.find(s => s.id === id);
const top = () => S.stack[S.stack.length - 1];
const mark = (j, k) => { S.journey[j][k] = true; };
let TIMER = null, TOAST_T = null;

/* ===================== display helpers ===================== */
const IC = {
  back: 'M15 18l-6-6 6-6', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeoff: 'M17.94 17.94A10.07 10.07 0 0112 19c-6 0-10-7-10-7a18.5 18.5 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22 M14.12 14.12a3 3 0 11-4.24-4.24',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01', check: 'M20 6L9 17l-5-5', x: 'M18 6L6 18 M6 6l12 12',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2', calendar: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18', pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
  bank: 'M3 21h18 M5 21V10 M9 21V10 M15 21V10 M19 21V10 M2 10l10-7 10 7z', bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  trend: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6', down: 'M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6', help: 'M12 22a10 10 0 100-20 10 10 0 000 20z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01',
  chev: 'M9 18l6-6-6-6', sun: 'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z', wallet: 'M21 12V7H5a2 2 0 010-4h14v4 M3 5v14a2 2 0 002 2h16v-5 M18 12a2 2 0 000 4h4v-4z',
  compass: 'M12 22a10 10 0 100-20 10 10 0 000 20z M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z', refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z', xc: 'M12 22a10 10 0 100-20 10 10 0 000 20z M15 9l-6 6 M9 9l6 6', chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01', play: 'M5 3l14 9-14 9z', sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6', lock: 'M5 11h14v10H5z M8 11V7a4 4 0 118 0v4'
};
const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + IC[n] + '"/></svg>';
const M = p => S.hidden ? '₹••••' : '₹' + nf.format(Math.round(p / 100));
const MR = r => S.hidden ? '₹••••' : '₹' + nf.format(r);
const inrR = r => S.hidden ? '₹••••' : '₹' + nf.format(r);
const SM = p => S.hidden ? '₹••••' : signedInr(p);
const avatar = s => '<span class="avatar" aria-hidden="true">' + esc(s.initials) + '</span>';

function statusInfo(s) {
  const ev = s.event && !s.event.resolved && s.status === 'ACTIVE';
  if (s.status === 'CANCELLED') return { cls: 'fail', icon: 'xc', label: 'Cancelled', text: 'Cancelled on ' + fmtD(s.cancelledOn) + '. No debits will occur.' };
  if (s.status === 'PAUSED' && s.pause) {
    const sched = s.pause.start > S.today;
    if (sched) return { cls: 'info', icon: 'pause', label: 'Pause scheduled from ' + fmtDS(s.pause.start), text: 'Instalments from ' + fmtDS(s.pause.start) + ' will be skipped' + (s.pause.resume ? ' until ' + fmtD(s.pause.resume) : ' until you resume') + '.' };
    const soon = s.pause.resume && diffDays(S.today, s.pause.resume) <= 14;
    return { cls: 'info', icon: 'pause', label: s.pause.resume ? (soon ? 'Paused · resumes ' + fmtDS(s.pause.resume) : 'Paused until ' + fmtD(s.pause.resume)) : 'Paused (until you resume)', text: s.pause.resume ? 'Paused by you. Resumes on ' + fmtD(s.pause.resume) + '.' : 'Paused by you. It stays paused until you resume.' };
  }
  if (ev) return { cls: 'warn', icon: 'alert', label: 'Active · 1 failed instalment', text: 'Your SIP is active. The ' + fmtDS(s.event.date) + ' instalment failed.' };
  return { cls: 'active', icon: 'check', label: 'Active', text: 'Next debit ' + (nextDue(s, S.today) ? fmtD(nextDue(s, S.today)) : '—') };
}
const chip = (cls, icon, label) => '<span class="chip ' + cls + '">' + ic(icon, 'sm') + esc(label) + '</span>';
const statusChip = s => { const i = statusInfo(s); return chip(i.cls, i.icon, i.label); };
const needsAttention = s => !!(s.event && !s.event.resolved && s.status === 'ACTIVE');
const demoChip = (t) => '<span class="chip demo">' + ic('info', 'sm') + esc(t || 'Demo rule · unverified') + '</span>';
const disclaimer = () => '<div class="disclaimer">' + ic('info', 'sm') + '<span>Explains your SIP figures. Not investment advice.</span></div>';

/* ===================== routing / loading ===================== */
const DATA_ROUTES = ['dashboard', 'sipDetail', 'coachExplain', 'ledger', 'debit', 'statuses', 'coachEntry'];
function delay() { return S.sim.noDelay ? 0 : (S.sim.slow ? 1800 : 380); }
function load(quick) {
  S.error = false; clearTimeout(TIMER);
  if (!quick && DATA_ROUTES.includes(top().name)) {
    S.loading = true; render();
    TIMER = setTimeout(() => { S.loading = false; if (S.sim.errorNext) { S.sim.errorNext = false; S.error = true; } render(); toTop(); }, delay());
  } else { S.loading = false; render(); toTop(); }
}
function go(name, p, o) {
  o = o || {};
  if (o.reset) S.stack = [];
  if (o.replace) S.stack.pop();
  S.stack.push({ name, p: p || {} }); S.sheet = null; trackRoute(name, p || {});
  if (!o.replace) { try { history.pushState({ n: S.stack.length }, ''); } catch (e) { /* no history */ } }
  S.focusScreen = true; load(o.quick);
}
function back() { if (S.stack.length > 1) { S.stack.pop(); S.sheet = null; S.focusScreen = true; load(true); } else { S.sheet = null; go('dashboard', {}, { reset: true, quick: true }); } }
function toTop() { const el = document.getElementById('screen'); if (el) el.scrollTop = 0; }
function toast(t) { S.toast = t; clearTimeout(TOAST_T); render(); TOAST_T = setTimeout(() => { S.toast = null; render(); }, 2600); }
function trackRoute(name, p) {
  if (name === 'dashboard') { mark('A', 'dash'); mark('B', 'dash'); mark('C', 'dash'); }
  if (name === 'sipDetail') mark('A', 'select');
  if (name === 'coachEntry') mark('A', 'select');
  if (name === 'coachExplain') { mark('A', 'coach'); }
  if (name === 'ledger') mark('B', 'ledger');
  if (name === 'debit') { mark('B', 'failed'); mark('B', 'reason'); }
  if (name === 'statuses') mark('C', 'mgmt');
  if (name === 'manage') mark('C', 'mgmt');
  if (name === 'pauseForm') mark('C', 'pause');
  if (name === 'reminder') mark('C', 'reminder');
}

/* ===================== screens ===================== */
function skeleton() {
  return '<div class="stack" style="margin-top:16px" aria-busy="true" aria-live="polite"><div class="skel" style="height:140px"></div><div class="skel" style="height:90px"></div><div class="skel" style="height:90px"></div><span class="sr">Loading</span></div>';
}
function errorState() {
  return '<div class="state bad" role="alert"><div class="big-ic">' + ic('info', 'lg') + '</div><h2 class="h3">We can’t load this right now</h2><p class="sec">This is a simulated network problem. Nothing was lost and no data was changed.</p><div class="btns"><button class="btn primary" data-act="retry">' + ic('refresh', 'sm') + ' Try again</button><button class="btn secondary" data-act="home">Back to SIPs</button></div></div>';
}
function sipCardBrief(s) {
  const c = calcSip(s, S.today); const i = statusInfo(s);
  return '<div class="card sipcard" data-act="openSip" data-id="' + s.id + '" role="button" tabindex="0" aria-label="Open ' + esc(s.name) + '">' +
    '<div class="row top">' + avatar(s) + '<div class="grow" style="flex:1;min-width:0"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">' + esc(s.cat) + '</div><div class="cap muted">Folio ' + esc(s.folio) + ' · ' + MR(s.amount) + '/mo</div></div>' + chip(i.cls, i.icon, i.label) + '</div>' +
    '<div class="grid2" style="margin-top:12px"><div class="kv"><div class="k">Invested</div><div class="v num">' + M(c.investedP) + '</div></div><div class="kv"><div class="k">Current value</div><div class="v num">' + M(c.valueP) + '</div></div></div>' +
    '<div class="row between" style="margin-top:10px"><span class="cap">Return <span class="num" style="color:var(--t1);font-weight:700">' + (c.absPct == null ? '—' : SM(c.absP) + ' (' + signedPct(c.absPct) + ')') + '</span></span><span class="cap">' + (c.paid.length ? 'Month ' + c.monthNo + ' · ' + c.paid.length + ' instalment' + (c.paid.length > 1 ? 's' : '') : 'No instalments yet') + '</span></div></div>';
}
function ledgerRows(filter, limit) {
  let rows = [];
  S.data.sips.forEach(s => {
    s.instalments.forEach(i => rows.push({ date: i.date, sip: s, amount: i.amount, kind: i.manual ? 'MANUAL' : 'OK' }));
    if (s.event && !s.event.resolved) rows.push({ date: s.event.date, sip: s, amount: s.event.amount, kind: 'FAILED' });
    if (s.event && s.event.resolved) rows.push({ date: s.event.date, sip: s, amount: s.event.amount, kind: 'RECOVERED' });
    if (s.pause) s.pause.skipped.filter(d => d <= S.today).forEach(d => rows.push({ date: d, sip: s, amount: s.amount, kind: 'SKIPPED' }));
  });
  rows = rows.filter(r => r.date <= S.today).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  if (filter === 'processed') rows = rows.filter(r => r.kind === 'OK' || r.kind === 'MANUAL');
  if (filter === 'failed') rows = rows.filter(r => r.kind === 'FAILED');
  if (filter === 'skipped') rows = rows.filter(r => r.kind === 'SKIPPED');
  return limit ? rows.slice(0, limit) : rows;
}
function rowHTML(r, noLink) {
  const s = r.sip; const failed = r.kind === 'FAILED';
  const meta = { OK: ['Processed', 'active', 'check'], MANUAL: ['Processed (paid manually)', 'active', 'check'], FAILED: ['Failed · tap to see why', 'fail', 'alert'], RECOVERED: ['Missed, then paid manually', 'neutral', 'check'], SKIPPED: ['Skipped (paused)', 'warn', 'pause'] }[r.kind];
  const col = meta[1] === 'active' ? 'var(--emerald-text)' : meta[1] === 'fail' ? 'var(--coral-text)' : meta[1] === 'warn' ? 'var(--amber-text)' : 'var(--t2)';
  if (noLink && !failed) return '<div class="rowitem"><span style="color:' + col + '">' + ic(meta[2]) + '</span><span class="grow"><span role="heading" aria-level="2" class="h3" style="font-size:14px;display:block">' + fmtD(r.date) + '</span><span class="cap">' + esc(s.bank) + '</span></span><span style="text-align:right"><span class="num" style="font-weight:700;display:block">' + MR(r.amount) + '</span><span class="cap" style="color:' + col + '">' + esc(meta[0]) + '</span></span></div>';
  return '<button class="rowitem" data-act="' + (failed ? 'openDebit' : 'openSip') + '" data-id="' + s.id + '" aria-label="' + esc(s.name + ', ' + fmtD(r.date) + ', ' + meta[0]) + '">' +
    '<span style="color:' + col + '">' + ic(meta[2]) + '</span><span class="grow"><span role="heading" aria-level="2" class="h3" style="font-size:14px;display:block">' + esc(s.name) + '</span><span class="cap">' + fmtD(r.date) + ' · ' + esc(s.bank) + '</span></span>' +
    '<span style="text-align:right"><span class="num" style="font-weight:700;display:block">' + MR(r.amount) + '</span><span class="cap" style="color:' + col + '">' + esc(meta[0]) + '</span></span></button>';
}
function screenDashboard() {
  const act = S.data.sips.filter(s => s.status === 'ACTIVE');
  const pf = portfolio(S.data.sips, S.today);
  const live = S.data.sips.filter(s => s.status !== 'CANCELLED').length;
  const neg = S.data.sips.find(s => s.status !== 'CANCELLED' && calcSip(s, S.today).absPct != null && calcSip(s, S.today).situation !== 'INSUFFICIENT_DATA' && calcSip(s, S.today).absPct < 0);
  const attention = S.data.sips.filter(needsAttention);
  let h = '<div class="hero"><div class="row between"><span class="label">Your SIP portfolio (demo)</span><span class="chip" style="background:rgba(255,255,255,.1);color:#CBD5E1">' + live + ' SIPs</span></div>' +
    '<div class="row" style="margin-top:14px"><div><div class="label">Total invested</div><div class="big num">' + M(pf.investedP) + '</div></div><div><div class="label">Current value</div><div class="big num">' + M(pf.valueP) + '</div></div></div>' +
    '<div class="strip"><span>Return <b class="num" style="color:#F8FAFC">' + SM(pf.absP) + ' (' + signedPct(pf.absPct) + ')</b></span><span>XIRR (annualised) <b class="num" style="color:#F8FAFC">' + (pf.xirr == null ? 'unavailable' : signedPct(pf.xirr)) + '</b></span></div></div>';
  if (neg) {
    const c = calcSip(neg, S.today);
    h += '<button class="card sipcard" style="width:100%;text-align:left;border-left:3px solid var(--blue)" data-act="openCoachEntry" data-id="' + neg.id + '"><div class="row top">' + ic('help', 'lg') + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">What does my ' + esc(neg.name.split(' ')[0]) + ' return mean?</div><div class="sec" style="margin-top:4px">Your ' + c.paid.length + '-instalment SIP shows ' + SM(c.absP) + ' (' + signedPct(c.absPct) + '). See what the figures mean at month ' + c.monthNo + '.</div><div class="row" style="margin-top:8px;color:var(--blue-text);font-weight:600">Understand my returns ' + ic('chev', 'sm') + '</div></div></div></button>';
  }
  if (attention.length) {
    h += attention.map(s => '<div class="card" style="border-left:3px solid var(--coral)"><div class="row top">' + ic('alert', 'lg') + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">An instalment failed</div><div class="sec" style="margin-top:4px">' + esc(s.name) + ' · ' + fmtD(s.event.date) + ' · ' + MR(s.event.amount) + '</div><div class="btns"><button class="btn secondary small" data-act="openDebit" data-id="' + s.id + '">See why</button></div></div></div></div>').join('');
  }
  h += '<div role="heading" aria-level="2" class="h2">Active SIPs <span class="chip neutral">' + act.length + '</span><button class="linkbtn" style="margin-left:auto;font-size:13px" data-act="tab" data-id="statuses">Manage SIPs</button></div>';
  h += act.map(sipCardBrief).join('') || '<div class="card state"><p class="sec">No active SIPs right now.</p></div>';
  h += '<div role="heading" aria-level="2" class="h2">Recent instalments <button class="linkbtn" style="margin-left:auto;font-size:13px" data-act="openLedger">View ledger</button></div>';
  const rows = ledgerRows('all', 4);
  h += '<div class="card" style="padding:4px 16px">' + (rows.length ? rows.map(rowHTML).join('') : '<div class="state"><p class="sec">No instalments yet.</p></div>') + '</div>';
  h += disclaimer();
  return { title: 'SIP Dashboard', eyebrow: 'SIP Steady', nav: 'sips', body: h };
}
function screenSipDetail(p) {
  const s = sipById(p.id); const c = calcSip(s, S.today); const i = statusInfo(s);
  let h = '<div class="hero"><div class="row top"><div style="flex:1"><div class="label">' + esc(s.cat) + '</div><div role="heading" aria-level="2" class="h2" style="margin:4px 0 0;color:#F8FAFC">' + esc(s.name) + '</div><div class="cap" style="color:#94A3B8">Folio ' + esc(s.folio) + ' · ' + MR(s.amount) + ' on the ' + s.day + 'th of each month</div></div>' + statusChip(s) + '</div>' +
    '<div class="row" style="margin-top:14px"><div><div class="label">Invested</div><div class="big num">' + M(c.investedP) + '</div></div><div><div class="label">Current value</div><div class="big num">' + M(c.valueP) + '</div></div></div>' +
    '<div class="strip"><span>Return <b class="num" style="color:#F8FAFC">' + (c.absPct == null ? '—' : SM(c.absP) + ' (' + signedPct(c.absPct) + ')') + '</b></span><span>XIRR (annualised) <b class="num" style="color:#F8FAFC">' + (c.xirr == null ? 'unavailable' : signedPct(c.xirr)) + '</b></span><span>' + (c.paid.length ? 'Month ' + c.monthNo + ' · ' + c.paid.length + ' instalments' : 'No instalments') + '</span></div></div>';
  h += '<div class="card"><div class="note">' + ic(i.icon, 'sm') + '<span><b style="color:var(--t1)">' + esc(i.label) + '.</b> ' + esc(i.text) + '</span></div>' +
    '<div class="btns">' + (s.status !== 'CANCELLED' ? '<button class="btn primary" data-act="openCoachFor" data-id="' + s.id + '">' + ic('help', 'sm') + ' Understand my returns</button>' : '') + '</div>' +
    '<div class="btns">' + (needsAttention(s) ? '<button class="btn secondary" data-act="openDebit" data-id="' + s.id + '">View failed instalment</button>' : '') + '<button class="btn secondary" data-act="openManage" data-id="' + s.id + '">' + ic('sliders', 'sm') + ' Manage SIP</button></div></div>';
  h += '<div role="heading" aria-level="2" class="h2">Instalments</div><div class="card" style="padding:4px 16px">' + (ledgerRows('all').filter(r => r.sip.id === s.id).slice(0, 8).map(x => rowHTML(x, true)).join('') || '<div class="state"><p class="sec">No instalments yet.</p></div>') + '</div>';
  return { title: s.name.length > 22 ? s.name.slice(0, 21) + '…' : s.name, eyebrow: 'SIP detail', back: true, nav: 'sips', body: h };
}
function screenCoachEntry() {
  const list = S.data.sips.filter(s => s.status !== 'CANCELLED');
  let h = '<div style="margin-top:16px"><div class="micro" style="color:var(--emerald-text)">Return Coach</div><h2 class="h2" style="margin-top:4px">Select a SIP to understand</h2><p class="sec">See what your own figures mean at your stage, in plain words. No advice.</p></div>';
  h += list.map(s => {
    const c = calcSip(s, S.today); const sel = S.ui.sel === s.id;
    return '<button class="card sipcard" style="width:100%;text-align:left;' + (sel ? 'border-color:var(--blue);box-shadow:0 0 0 2px rgba(26,107,255,.25)' : '') + '" data-act="selectSip" data-id="' + s.id + '" aria-pressed="' + sel + '"><div class="row top">' + avatar(s) + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">' + esc(s.cat) + ' · ' + (c.paid.length ? c.paid.length + ' instalment' + (c.paid.length > 1 ? 's' : '') + ' · started ' + fmtD(c.first) : 'no instalments') + '</div></div>' + (sel ? ic('check') : '') + '</div>' +
      '<div class="grid2" style="margin-top:10px"><div class="kv"><div class="k">Invested</div><div class="v num">' + M(c.investedP) + '</div></div><div class="kv"><div class="k">Current value</div><div class="v num">' + M(c.valueP) + '</div></div><div class="kv"><div class="k">Return</div><div class="v num">' + (c.absPct == null ? '—' : SM(c.absP) + ' (' + signedPct(c.absPct) + ')') + '</div></div><div class="kv"><div class="k">XIRR (annualised)</div><div class="v num">' + (c.xirr == null ? 'unavailable' : signedPct(c.xirr)) + '</div></div></div></button>';
  }).join('');
  h += '<div class="card flat"><div role="heading" aria-level="2" class="h3">What we’ll cover</div><div class="stack" style="margin-top:8px"><div class="note">' + ic('check', 'sm') + '<span>Your figures, exactly as in your demo account</span></div><div class="note">' + ic('check', 'sm') + '<span>What the figures mean at your month, and what they don’t</span></div><div class="note">' + ic('check', 'sm') + '<span>XIRR and other terms, with sources and a confidence label</span></div></div></div>';
  h += '<div style="margin-top:16px"><button class="btn primary" data-act="explain" ' + (S.ui.sel ? '' : 'disabled') + '>Explain my returns ' + ic('chev', 'sm') + '</button>' + (S.ui.sel ? '' : '<div class="cap" style="text-align:center;margin-top:8px">Select a SIP above to continue</div>') + '</div>';
  h += disclaimer();
  return { title: 'Return Coach', eyebrow: 'Select a SIP', back: S.stack.length > 1, nav: 'coach', body: h };
}
function navChart(s, c) {
  const pts = c.paid.map(i => ({ l: MON[new Date(P(i.date)).getUTCMonth()], v: i.nav })).concat([{ l: 'Now', v: s.currentNav }]);
  const W = 320, H = 130, pad = 28; const vs = pts.map(x => x.v); const mn = Math.min.apply(null, vs) - 1, mx = Math.max.apply(null, vs) + 1;
  const X = i => pad + i * ((W - 2 * pad) / Math.max(1, pts.length - 1)); const Y = v => 18 + (H - 50) * (1 - (v - mn) / (mx - mn));
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="NAV at each instalment: ' + pts.map(p => p.l + ' ' + p.v.toFixed(2)).join(', ') + '"><path d="' + line + '" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round"/>' +
    pts.map((p, i) => '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.5) + '" fill="' + (i === pts.length - 1 ? 'var(--emerald)' : 'var(--blue)') + '"/><text x="' + X(i).toFixed(1) + '" y="' + (Y(p.v) - 9).toFixed(1) + '" text-anchor="middle">' + p.v.toFixed(2) + '</text><text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + p.l + '</text>').join('') + '</svg>';
}
function screenCoachExplain(p) {
  const s = sipById(p.id); const c = calcSip(s, S.today); const content = coachContent(s, c); const conf = confidenceFor(c, false);
  const confCls = conf.label === 'HIGH' ? 'active' : conf.label === 'MEDIUM' ? 'warn' : 'neutral';
  let h = disclaimer();
  if (content) h += '<div class="card summary"><div class="micro" style="color:var(--emerald-text)">In short</div><p style="margin:6px 0 0;font-size:15px">' + esc(s.name) + ' is ' + (c.absPct < 0 ? signedPct(c.absPct).replace(MINUS, '') + ' below' : c.absPct > 0 ? signedPct(c.absPct).replace('+', '') + ' above' : 'level with') + ' what you have put in, in month ' + c.monthNo + '. That figure is measured over a short period. It describes today, not where this SIP is heading.</p></div>';
  if (!content) {
    h += '<div class="card state"><div class="big-ic">' + ic('info', 'lg') + '</div><h2 class="h3">I’m not sure how to explain this one yet</h2><p class="sec">' + esc(s.name) + ' has ' + c.paid.length + ' instalment' + (c.paid.length === 1 ? '' : 's') + ' so far. That isn’t enough history to explain a pattern, and I won’t guess.</p>' +
      '<div class="kv" style="text-align:left"><div class="k">Your figures so far</div><div class="v num">' + M(c.investedP) + ' invested · ' + M(c.valueP) + ' value</div></div>' +
      '<div class="row" style="margin-top:12px;justify-content:center">' + chip('neutral', 'info', 'Confidence: Low') + '</div>' +
      '<div class="btns"><button class="btn secondary" data-act="sheet" data-id="term:ABS">What is absolute return?</button></div><div class="btns"><button class="btn secondary" data-act="sheet" data-id="source">See official sources</button><button class="btn secondary" data-act="sheet" data-id="support">Get help</button></div></div>';
    return { title: 'Return Coach', eyebrow: 'Explanation', back: true, nav: 'coach', body: h };
  }
  h += '<div class="card"><div class="micro" style="color:var(--blue-text)">Block 1</div><div role="heading" aria-level="2" class="h3" style="margin-top:2px">Your figures</div>' +
    '<div class="row top" style="margin-top:10px">' + avatar(s) + '<div><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">' + esc(s.cat) + ' · ' + c.paid.length + ' instalments · month ' + c.monthNo + '</div></div></div>' +
    '<div class="grid2" style="margin-top:12px"><div class="kv"><div class="k">Invested</div><div class="v num">' + M(c.investedP) + '</div></div><div class="kv"><div class="k">Current value</div><div class="v num">' + M(c.valueP) + '</div></div><div class="kv"><div class="k">Return</div><div class="v num">' + SM(c.absP) + ' (' + signedPct(c.absPct) + ')</div></div><div class="kv"><div class="k">Avg price per unit you paid</div><div class="v num">₹' + c.avgNav.toFixed(2) + '</div></div></div>' +
    '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="pillbtn" data-act="sheet" data-id="term:XIRR">XIRR (annualised) ' + (c.xirr == null ? 'n/a' : signedPct(c.xirr)) + ' ' + ic('help', 'sm') + '</button><button class="pillbtn" data-act="sheet" data-id="term:ABS">Return (absolute) ' + signedPct(c.absPct) + ' ' + ic('help', 'sm') + '</button><button class="pillbtn" data-act="sheet" data-id="term:NAV">NAV ₹' + s.currentNav.toFixed(2) + ' ' + ic('help', 'sm') + '</button></div>' + (c.daysHeld < 365 && c.xirr != null ? '<div class="cap" style="margin-top:8px">XIRR is annualised, and this SIP is under a year old, so it can look large. Tap it to see why.</div>' : '') + '</div>';
  h += '<div class="card"><div class="micro" style="color:var(--emerald-text)">Block 2</div><div role="heading" aria-level="2" class="h3" style="margin-top:2px">What this means at month ' + c.monthNo + '</div>' +
    '<div class="card nested">' + navChart(s, c) + '<div class="cap" style="margin-top:4px">NAV at each of your instalments, and today</div></div>' +
    content.means.map(t => '<p style="margin:12px 0 0">' + esc(t) + '</p>').join('') + '<div style="margin-top:10px">' + demoChip('Demo content · source placeholder') + '</div></div>';
  h += '<div class="card"><div class="micro" style="color:var(--amber-text)">Block 3</div><div role="heading" aria-level="2" class="h3" style="margin-top:2px">What it does not mean</div>' +
    content.nots.map(t => '<div class="note" style="margin-top:10px">' + ic('x', 'sm') + '<span>' + esc(t) + '</span></div>').join('') + '</div>';
  h += '<div class="card"><button class="row between" style="width:100%;background:none;border:0;padding:0;text-align:left" data-act="toggleXirr" aria-expanded="' + S.ui.xirrOpen + '"><span><span class="micro" style="color:var(--blue-text)">Term</span><span role="heading" aria-level="2" class="h3" style="display:block">How XIRR is worked out</span></span><span style="transform:rotate(' + (S.ui.xirrOpen ? 90 : 0) + 'deg);display:inline-flex">' + ic('chev') + '</span></button>' +
    (S.ui.xirrOpen ? '<div style="margin-top:10px"><p style="margin:0">' + esc(xirrText(c)) + '</p><div class="callout"><b>Why the two numbers differ:</b> absolute return compares today’s value with the total put in. XIRR also weights each instalment by how long it has been invested, then expresses the result per year.</div><div style="margin-top:10px">' + demoChip('Demo content · source placeholder') + '</div></div>' : '') + '</div>';
  h += '<div class="card"><div class="row between"><span role="heading" aria-level="2" class="h3">Source and confidence</span>' + chip(confCls, 'check', conf.label + ' confidence') + '</div>' +
    '<div class="stack" style="margin-top:10px">' + SOURCES.map(x => '<div class="callout"><b>' + esc(x.title) + '</b><div class="cap">' + esc(x.publisher) + ' · ' + esc(x.date) + '</div><div class="cap" style="margin-top:4px">' + esc(x.note) + '</div></div>').join('') + '</div>' +
    '<div class="cap" style="margin-top:10px"><b>Why ' + conf.label.toLowerCase() + ':</b> ' + conf.reasons.map(esc).join('; ') + '.</div></div>';
  h += '<div class="card"><div role="heading" aria-level="2" class="h3">Ask a follow-up</div><div class="cap">Pick a question or type your own. Answers use your figures and approved text only.</div>' +
    '<div class="stack" style="margin-top:10px"><button class="btn secondary" style="justify-content:space-between" data-act="ask" data-id="How did the NAV change since my last instalment?">How did the NAV change since my last instalment? ' + ic('chev', 'sm') + '</button><button class="btn secondary" style="justify-content:space-between" data-act="ask" data-id="How does XIRR differ from absolute return?">How does XIRR differ from absolute return? ' + ic('chev', 'sm') + '</button><button class="btn secondary" style="justify-content:space-between" data-act="ask" data-id="What will my SIP be worth in 3 years?">What will my SIP be worth in 3 years? ' + ic('chev', 'sm') + '</button></div>' +
    '<div class="row" style="margin-top:12px"><input id="fu-input" type="text" maxlength="140" placeholder="Type a question about your figures" aria-label="Type a question about your figures" value="' + esc(S.ui.fu) + '"><button class="icon-btn" style="background:var(--blue);color:#fff;border-color:var(--blue)" data-act="askTyped" aria-label="Send question">' + ic('send') + '</button></div>' +
    '' + (S.ui.fuErr ? '<div class="err" role="alert">' + ic('alert', 'sm') + '<span>' + esc(S.ui.fuErr) + '</span></div>' : '') + '<div id="thread" aria-live="polite">' + S.ui.thread.map(m => m.q ? '<div class="bubble q">' + esc(m.q) + '</div>' : '<div class="bubble ' + (m.kind === 'refuse' ? 'refuse' : 'a') + '"><b>' + esc(m.title) + '</b><p style="margin:6px 0 0">' + esc(m.text) + '</p><div class="cap" style="margin-top:8px">' + (m.kind === 'refuse' ? 'Fixed refusal text · no figures used' : 'Source: ' + esc(m.sources[0].publisher) + ' (demo placeholder) · Confidence: ' + esc(m.confidence.label)) + '</div></div>').join('') + '</div></div>';
  h += '<div class="card"><div role="heading" aria-level="2" class="h3">Was this clear?</div><div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">' + ['Yes', 'Somewhat', 'No'].map(v => '<button class="pillbtn" aria-pressed="' + (S.ui.fb.clear === v) + '" data-act="fb" data-id="clear:' + v + '">' + v + '</button>').join('') + '</div>' +
    '<div role="heading" aria-level="2" class="h3" style="margin-top:14px">Did this feel like advice?</div><div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">' + [['No', 'No, purely factual'], ['Yes', 'Felt like advice']].map(v => '<button class="pillbtn" aria-pressed="' + (S.ui.fb.advice === v[0]) + '" data-act="fb" data-id="advice:' + v[0] + '">' + v[1] + '</button>').join('') + '</div></div>';
  h += '<div style="margin-top:16px"><button class="btn primary" data-act="doneCoach">' + ic('check', 'sm') + ' Got it, return to SIP dashboard</button></div>';
  return { title: 'Return Coach', eyebrow: 'Explanation', back: true, nav: 'coach', body: h };
}
function screenLedger() {
  const f = S.ui.filter; const rows = ledgerRows(f);
  let h = '<div class="filters" role="group" aria-label="Filter instalments">' + [['all', 'All'], ['processed', 'Processed'], ['failed', 'Failed'], ['skipped', 'Skipped']].map(x => '<button class="pillbtn" aria-pressed="' + (f === x[0]) + '" data-act="filter" data-id="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  h += rows.length ? '<div class="card" style="padding:4px 16px;margin-top:8px">' + rows.map(rowHTML).join('') + '</div>' :
    '<div class="card state"><div class="big-ic">' + ic(f === 'failed' ? 'check' : 'list', 'lg') + '</div><h2 class="h3">' + (f === 'failed' ? 'No failed instalments' : 'Nothing here yet') + '</h2><p class="sec">' + (f === 'failed' ? 'Every instalment so far has gone through or been recovered.' : 'No instalments match this filter.') + '</p><button class="btn secondary" data-act="filter" data-id="all">Show all instalments</button></div>';
  return { title: 'Recent transactions', eyebrow: 'Ledger', back: true, nav: 'sips', body: h };
}
function screenDebit(p) {
  const s = sipById(p.id); const ev = s.event;
  if (!ev) return { title: 'Debit explainer', back: true, nav: 'sips', body: '<div class="card state"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h3">No failed instalments</h2><p class="sec">There is nothing to explain for this SIP.</p><button class="btn secondary" data-act="home">Back to dashboard</button></div>' };
  const r = evalDebit(s, S.today);
  if (r.cancelled) return { title: 'Debit explainer', eyebrow: 'SIP cancelled', back: true, nav: 'sips', body: '<div class="state bad"><div class="big-ic">' + ic('info', 'lg') + '</div><h2 class="h3">This SIP is cancelled</h2><p class="sec">' + esc(r.statusText) + '</p><div class="btns"><button class="btn primary" data-act="home">Back to dashboard</button></div></div>' + disclaimer() };
  if (ev.resolved) {
    return { title: 'Debit explainer', eyebrow: 'Resolved', back: true, nav: 'sips', body: '<div class="state ok"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h3">This instalment has been paid</h2><p class="sec">The ' + fmtD(ev.date) + ' instalment of ' + MR(ev.amount) + ' for ' + esc(s.name) + ' was paid manually on ' + fmtD(ev.resolvedOn) + ' (demo). Your SIP continues as scheduled.</p><div class="btns"><button class="btn primary" data-act="doneDebit">Return to dashboard</button></div></div>' + disclaimer() };
  }
  let h = '<div class="card" style="border-left:3px solid var(--coral)"><div class="row top"><span style="color:var(--coral-text)">' + ic('alert', 'lg') + '</span><div style="flex:1"><div class="row between"><span class="chip fail">' + ic('alert', 'sm') + 'Instalment failed</span><span class="cap num">' + fmtD(ev.date) + '</span></div><div role="heading" aria-level="2" class="h2" style="margin-top:8px">' + esc(s.name) + '</div><div style="font-size:24px;font-weight:700" class="num">' + MR(ev.amount) + ' <span class="cap">scheduled debit</span></div></div></div>' +
    (r.providerMessage ? '<div class="card nested"><div class="cap">Message from your bank (via the demo provider)</div><div style="margin-top:2px">“' + esc(r.providerMessage) + '”</div></div>' : '') + '</div>';
  if (r.retryText) h += '<div class="card"><div class="row top"><span style="color:var(--blue-text)">' + ic('clock', 'lg') + '</span><div><div role="heading" aria-level="2" class="h3">Automatic retry</div><div class="sec">' + esc(r.retryText) + '</div>' + (ev.retry.date <= S.today ? '<div class="cap" style="margin-top:4px">This date has arrived; the demo doesn’t simulate the result.</div>' : '<div class="cap" style="margin-top:4px">Having enough balance in the account by then lets a retry go through.</div>') + '</div></div></div>';
  h += '<div class="card" style="border-left:3px solid var(--blue)"><div class="micro" style="color:var(--blue-text)">What to do next</div><p style="margin:6px 0 0">' + (r.primary.type === 'PAY' ? 'You can pay this instalment now, or wait for the automatic retry shown above.' : r.primary.type === 'MANDATE' ? 'The autopay mandate needs renewing before future instalments can be debited.' : r.primary.type === 'WAIT' ? 'No action is needed from you. The provider will retry automatically.' : 'We don\u2019t have a specific step for this one. Support can look into it.') + '</p><div class="btns" style="flex-direction:column"><button class="btn primary" data-act="nextStep" data-id="' + r.primary.type + '" data-sip="' + s.id + '">' + (r.primary.type === 'PAY' ? ic('send', 'sm') : '') + esc(r.primary.label) + '</button></div></div>';
  h += '<div class="card"><div role="heading" aria-level="2" class="h2" style="margin:0">Detailed breakdown</div>' +
    '<div class="card nested"><div class="row between"><span role="heading" aria-level="3" class="h3">Why it failed</span>' + chip(r.known ? 'neutral' : 'neutral', 'info', r.known ? r.category : 'Reason not available') + '</div><p style="margin:8px 0 0">' + esc(r.reasonText) + '</p><div class="cap" style="margin-top:6px">Reason code (demo provider): ' + esc(r.known ? ev.reasonCode : (ev.reasonCode || 'none supplied')) + ' · rules ' + esc(r.ruleVersion) + '</div></div>' +
    '<div class="card nested"><div class="row between"><span role="heading" aria-level="3" class="h3">Is my SIP still active?</span>' + chip('warn', 'alert', 'Active · 1 failed instalment') + '</div><p style="margin:8px 0 0">' + esc(r.statusText) + '</p><button class="linkbtn" style="margin-top:6px" data-act="sheet" data-id="charges">Will I be charged anything?</button></div>' + '</div>';
  h += '<div class="btns" style="flex-direction:column">' + (r.secondary ? '<button class="btn secondary" data-act="nextStep" data-id="MANDATE" data-sip="' + s.id + '">' + ic('sliders', 'sm') + esc(r.secondary.label) + '</button>' : '') + '<button class="btn secondary" data-act="openManage" data-id="' + s.id + '">See pause or reduce options</button></div>';
  h += '<div role="heading" aria-level="2" class="h2">Instalment track record</div><div class="card"><div class="tl">' + ledgerRows('all').filter(x => x.sip.id === s.id).slice(0, 5).map(x => '<div class="it ' + (x.kind === 'FAILED' ? 'f' : x.kind === 'SKIPPED' ? 'p' : '') + '"><div class="row between"><b>' + fmtD(x.date) + '</b><span class="num">' + MR(x.amount) + '</span></div><div class="cap">' + (x.kind === 'FAILED' ? 'Failed' : x.kind === 'RECOVERED' ? 'Paid manually' : x.kind === 'SKIPPED' ? 'Skipped (paused)' : 'Processed') + '</div></div>').join('') + '</div></div>';
  h += '<div class="card"><div class="row"><span style="color:var(--blue-text)">' + ic('chat', 'lg') + '</span><div style="flex:1"><div role="heading" aria-level="2" class="h3">Need help?</div><div class="cap">Support is not connected in this demo.</div></div><button class="btn secondary small" data-act="sheet" data-id="support">Open</button></div></div>' + disclaimer();
  return { title: 'Failed instalment', eyebrow: 'Explainer', back: true, nav: 'sips', body: h };
}
function screenStatuses() {
  const f = S.ui.sipFilter; const all = S.data.sips;
  const match = s => f === 'all' || (f === 'active' && s.status === 'ACTIVE' && !needsAttention(s)) || (f === 'attention' && needsAttention(s)) || (f === 'paused' && s.status === 'PAUSED') || (f === 'cancelled' && s.status === 'CANCELLED');
  const list = all.filter(match);
  const cnt = k => all.filter(s => ({ all: () => true, active: () => s.status === 'ACTIVE' && !needsAttention(s), attention: () => needsAttention(s), paused: () => s.status === 'PAUSED', cancelled: () => s.status === 'CANCELLED' })[k]()).length;
  const commit = all.filter(s => s.status === 'ACTIVE').reduce((a, s) => a + s.amount, 0);
  let h = '<div class="card"><div class="row between"><div><div class="cap">Total monthly commitment (active SIPs)</div><div class="h2 num" style="margin:0">' + MR(commit) + ' / month</div></div>' + (cnt('attention') ? chip('warn', 'alert', cnt('attention') + ' needs attention') : chip('active', 'check', 'Nothing needs attention')) + '</div></div>';
  h += '<div class="filters" role="group" aria-label="Filter SIPs">' + [['all', 'All'], ['active', 'Active'], ['attention', 'Needs attention'], ['paused', 'Paused'], ['cancelled', 'Cancelled']].map(x => '<button class="pillbtn" aria-pressed="' + (f === x[0]) + '" data-act="sipFilter" data-id="' + x[0] + '">' + x[1] + ' (' + cnt(x[0]) + ')</button>').join('') + '</div>';
  if (!list.length) h += '<div class="card state"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h3">' + (f === 'attention' ? 'Nothing needs attention' : 'No SIPs here') + '</h2><p class="sec">' + (f === 'attention' ? 'All instalments are on track.' : 'No SIPs match this filter.') + '</p><button class="btn secondary" data-act="sipFilter" data-id="all">Show all SIPs</button></div>';
  h += list.map(s => {
    const c = calcSip(s, S.today); const i = statusInfo(s); const rem = s.pause && s.pause.reminder.on;
    const border = needsAttention(s) ? 'var(--amber)' : s.status === 'PAUSED' ? 'var(--blue)' : s.status === 'CANCELLED' ? 'var(--coral)' : 'var(--emerald)';
    return '<div class="card" style="border-left:3px solid ' + border + ';' + (s.status === 'CANCELLED' ? 'opacity:.85' : '') + '"><div class="row top">' + avatar(s) + '<div style="flex:1;min-width:0"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">Folio ' + esc(s.folio) + ' · ' + esc(s.cat) + '</div></div>' + statusChip(s) + '</div>' +
      '<div class="grid2" style="margin-top:10px"><div class="kv"><div class="k">' + (s.status === 'CANCELLED' ? 'Value (as of today)' : 'Monthly SIP') + '</div><div class="v num">' + (s.status === 'CANCELLED' ? M(c.valueP) : MR(s.amount)) + '</div></div><div class="kv"><div class="k">' + (s.status === 'PAUSED' ? (s.pause.resume ? 'Resumes' : 'Resumes') : s.status === 'CANCELLED' ? 'Cancelled on' : 'Next debit') + '</div><div class="v num">' + (s.status === 'PAUSED' ? (s.pause.resume ? fmtD(s.pause.resume) : 'When you choose') : s.status === 'CANCELLED' ? fmtD(s.cancelledOn) : fmtD(nextDue(s, S.today))) + '</div></div></div>' +
      '<div class="note" style="margin-top:10px">' + ic(i.icon, 'sm') + '<span>' + esc(i.text) + (rem ? ' Reminder on ' + fmtD(s.pause.reminder.remindOn) + '.' : (s.status === 'PAUSED' ? ' No reminder set.' : '')) + '</span></div>' +
      '<div class="btns">' + (needsAttention(s) ? '<button class="btn secondary small" data-act="openDebit" data-id="' + s.id + '">View explainer</button>' : '') +
      (s.status === 'ACTIVE' ? '<button class="btn secondary small" data-act="openManage" data-id="' + s.id + '">Manage / Pause</button>' : '') +
      (s.status === 'PAUSED' ? '<button class="btn secondary small" data-act="sheet" data-id="resume:' + s.id + '">Resume early</button><button class="btn secondary small" data-act="openReminder" data-id="' + s.id + '">' + (rem ? 'Edit reminder' : 'Set reminder') + '</button><button class="btn secondary small" data-act="sheet" data-id="extend:' + s.id + '">Change dates</button>' : '') +
      (s.status === 'CANCELLED' ? '<button class="btn secondary small" data-act="sheet" data-id="newSip">Start a new SIP</button>' : '') +
      '<button class="btn text small" data-act="openSip" data-id="' + s.id + '">Details</button></div></div>';
  }).join('');
  h += '<div class="card"><div role="heading" aria-level="2" class="h3">What the labels mean</div><dl class="legend" style="margin:0">' +
    '<dt>' + chip('active', 'check', 'Active') + '</dt><dd>Instalments are being taken as scheduled.</dd>' +
    '<dt>' + chip('warn', 'alert', 'Active · 1 failed instalment') + '</dt><dd>The SIP is still active. One instalment did not go through.</dd>' +
    '<dt>' + chip('info', 'pause', 'Paused') + '</dt><dd>You paused it. Instalments are skipped until it resumes.</dd>' +
    '<dt>' + chip('fail', 'xc', 'Cancelled') + '</dt><dd>No further instalments will be taken.</dd></dl></div>';
  h += '<div class="card flat"><div class="note">' + ic('info', 'sm') + '<span>Statements about what pausing or cancelling does are demo rules, shown with an “unverified” tag, and must be checked against platform, bank and fund-house rules before real use.</span></div></div>' + disclaimer();
  return { title: 'SIP management', eyebrow: 'Statuses', nav: 'sips', body: h };
}
function screenManage(p) {
  const s = sipById(p.id); const sel = S.ui.optSel;
  const opts = [['pause', 'pause', 'Pause SIP', 'Skip instalments for a period you choose. Your SIP stays on your list and you decide when it restarts.'], ['reduce', 'down', 'Reduce amount', 'Lower the monthly amount from the next instalment. You can change it again later.'], ['cancel', 'xc', 'Cancel SIP', 'Stop future instalments. A cancelled SIP can’t be resumed, but you can set up a new one.']];
  let h = '<div class="card"><div class="row top">' + avatar(s) + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">Folio ' + esc(s.folio) + ' · ' + MR(s.amount) + ' on the ' + s.day + 'th</div></div>' + statusChip(s) + '</div></div>';
  h += '<div role="heading" aria-level="2" class="h2" style="margin-top:20px">Choose what you want to do</div><p class="sec" style="margin:4px 0 0">All three are equal options.</p>';
  h += '<div role="radiogroup" aria-label="What do you want to do with this SIP">' + opts.map(o => '<button class="opt" role="radio" aria-checked="' + (sel === o[0]) + '" data-act="opt" data-id="' + o[0] + '"><span style="color:var(--t2)">' + ic(o[1], 'lg') + '</span><span><span role="heading" aria-level="2" class="h3" style="display:block">' + o[2] + '</span><span class="sec">' + o[3] + '</span></span><span class="radio"></span></button>').join('') + '</div>';
  h += '<div style="margin-top:16px"><button class="btn primary" data-act="optContinue" ' + (sel ? '' : 'disabled') + '>Continue</button>' + (sel ? '' : '<div class="cap" style="text-align:center;margin-top:8px">Select an option to continue</div>') + '</div>';
  h += '<div class="card flat" style="margin-top:16px"><div class="row" style="gap:8px;flex-wrap:wrap">' + demoChip() + '</div><div class="note" style="margin-top:8px">' + ic('info', 'sm') + '<span>Units you already hold are not sold, whichever option you choose.</span></div></div>' + disclaimer();
  return { title: 'Manage SIP', eyebrow: 'SIP management', back: true, nav: 'sips', body: h };
}
function computePause(s, sel, custom) {
  const today = S.today;
  if (sel === '1' || sel === '2' || sel === '3') {
    const n = +sel; const dues = dueDates(s.day, today, n + 1);
    return { ok: true, start: today, end: addDays(dues[n], -1), resume: dues[n], skipped: dues.slice(0, n) };
  }
  if (sel === 'open') { const dues = dueDates(s.day, today, 1); return { ok: true, start: today, end: null, resume: null, skipped: dues }; }
  if (sel === 'custom') {
    const a = custom.start, b = custom.end;
    if (!a || !b) return { ok: false, err: 'Choose both a start date and an end date.' };
    if (a < today) return { ok: false, err: 'Choose a start date from today onwards.' };
    if (b < a) return { ok: false, err: 'The end date must be after the start date.' };
    const maxEnd = addMonths(today, 12); if (b > maxEnd) return { ok: false, err: 'The latest end date available is ' + fmtD(maxEnd) + '.' };
    const dues = dueDates(s.day, a, 14).filter(d => d <= b);
    if (!dues.length) return { ok: false, err: 'No instalment falls in this period, so nothing would be skipped.' };
    const resume = dueDates(s.day, addDays(b, 1), 1)[0];
    return { ok: true, start: a, end: b, resume, skipped: dues };
  }
  return { ok: false, err: null };
}
function screenPauseForm(p) {
  const s = sipById(p.id); const sel = S.ui.pauseSel; const c = S.ui.custom;
  const calc = sel ? computePause(s, sel, c) : null;
  const durs = [['1', '1 month', 'Skip next instalment'], ['2', '2 months', 'Skip next 2'], ['3', '3 months', 'Skip next 3'], ['custom', 'Custom', 'Choose dates'], ['open', 'Until I resume', 'No end date']];
  let h = '<div class="card"><div class="row top">' + avatar(s) + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">Folio ' + esc(s.folio) + ' · ' + MR(s.amount) + ' on the ' + s.day + 'th</div></div>' + statusChip(s) + '</div></div>';
  h += '<div role="heading" aria-level="2" class="h2" style="margin-top:20px">Pause duration</div><p class="sec" style="margin:4px 0 8px">You choose how long. Nothing is selected for you.</p><div class="grid2" role="radiogroup" aria-label="Pause duration">' +
    durs.map(d => '<button class="opt" style="margin-top:0;display:block" role="radio" aria-checked="' + (sel === d[0]) + '" data-act="pauseSel" data-id="' + d[0] + '"><span role="heading" aria-level="2" class="h3" style="display:block">' + d[1] + '</span><span class="cap">' + d[2] + '</span></button>').join('') + '</div>';
  if (sel === 'custom') h += '<div class="card nested"><label class="f" for="cs">Pause starts</label><input id="cs" type="date" data-field="start" value="' + esc(c.start) + '" min="' + S.today + '"><label class="f" for="ce">Pause ends</label><input id="ce" type="date" data-field="end" value="' + esc(c.end) + '"></div>';
  if (calc && !calc.ok && calc.err && (sel !== 'custom' || (c.start && c.end))) h += '<div class="err" role="alert">' + ic('alert', 'sm') + '<span>' + esc(calc.err) + '</span></div>';
  if (calc && calc.ok) {
    h += '<div class="card"><div role="heading" aria-level="2" class="h3">Review</div><div class="stack" style="margin-top:8px">' +
      '<div class="note">' + ic('calendar', 'sm') + '<span>Pause window: <b class="num" style="color:var(--t1)">' + fmtD(calc.start) + (calc.end ? ' to ' + fmtD(calc.end) : ' until you resume') + '</b></span></div>' +
      '<div class="note">' + ic('pause', 'sm') + '<span>Instalments skipped: <b class="num" style="color:var(--t1)">' + calc.skipped.map(fmtD).join(', ') + (sel === 'open' ? ' (and each one after, until you resume)' : '') + '</b></span></div>' +
      '<div class="note">' + ic('play', 'sm') + '<span>' + (calc.resume ? 'Your SIP restarts on <b class="num" style="color:var(--t1)">' + fmtD(calc.resume) + '</b>, as you chose.' : 'Your SIP stays paused until <b style="color:var(--t1)">you</b> resume it.') + '</span></div></div>' +
      '<hr class="sep"><div role="heading" aria-level="2" class="h3">What happens during the pause</div><div class="stack" style="margin-top:8px"><div class="note">' + ic('bank', 'sm') + '<span>No debits are taken for the skipped dates.</span></div><div class="note">' + ic('wallet', 'sm') + '<span>Units you already hold are not sold.</span></div><div class="note">' + ic('info', 'sm') + '<span>Whether your bank mandate stays registered, and any charges, depend on platform and bank rules. <b>Not verified in this demo.</b></span></div></div><div style="margin-top:8px">' + demoChip() + '</div></div>';
    h += '<button class="check" role="checkbox" aria-checked="' + S.ui.ack + '" data-act="ack"><span class="box">' + ic('check') + '</span><span>I understand no debits will be made for the skipped dates' + (calc.resume ? ' and my SIP restarts on ' + fmtD(calc.resume) + '.' : ', and I will resume it myself.') + '</span></button>';
  }
  if (S.ui.pauseErr) h += '<div class="card" style="border-left:3px solid var(--coral)" role="alert"><div class="row top"><span style="color:var(--coral-text)">' + ic('alert', 'lg') + '</span><div><div role="heading" aria-level="2" class="h3">The pause wasn\u2019t set up</div><div class="sec">' + esc(S.ui.pauseErr) + '</div></div></div></div>';
  h += '<div class="btns" style="flex-direction:column;margin-top:16px"><button class="btn primary" data-act="confirmPause" ' + (calc && calc.ok && S.ui.ack ? '' : 'disabled') + '>Confirm pause</button><button class="btn secondary" data-act="back">Go back without pausing</button></div>' + disclaimer();
  return { title: 'Pause SIP', eyebrow: 'SIP management', back: true, nav: 'sips', body: h };
}
function screenReduce(p) {
  const s = sipById(p.id); const r = S.ui.reduce;
  let h = '<div class="card"><div class="row top">' + avatar(s) + '<div style="flex:1"><div role="heading" aria-level="2" class="h3">' + esc(s.name) + '</div><div class="cap">Current amount ' + MR(s.amount) + ' on the ' + s.day + 'th</div></div></div></div>' +
    '<div class="card"><label class="f" for="ra">New monthly amount (₹)</label><input id="ra" type="number" inputmode="numeric" min="0" data-field="reduce" value="' + esc(r.amount) + '" placeholder="e.g. 3000">' +
    (r.err ? '<div class="err" role="alert">' + ic('alert', 'sm') + '<span>' + esc(r.err) + '</span></div>' : '') + '<div class="cap" style="margin-top:8px">Demo minimum ₹500. Changes apply from the next instalment (' + (nextDue(s, S.today) ? fmtD(nextDue(s, S.today)) : '—') + ').</div><div style="margin-top:8px">' + demoChip('Demo limits · unverified') + '</div></div>' +
    '<div class="btns" style="flex-direction:column"><button class="btn primary" data-act="confirmReduce" data-id="' + s.id + '">Confirm new amount</button><button class="btn secondary" data-act="back">Go back</button></div>' + disclaimer();
  return { title: 'Reduce amount', eyebrow: 'SIP management', back: true, nav: 'sips', body: h };
}
function noPauseScreen(s) {
  return { title: 'SIP status', eyebrow: 'SIP management', back: S.stack.length > 1, nav: 'sips', body: '<div class="card state"><div class="big-ic">' + ic('info', 'lg') + '</div><h2 class="h3">This SIP is not paused</h2><p class="sec">' + esc(s.name) + ' is ' + esc(statusInfo(s).label.toLowerCase()) + '. There is no pause to change.</p><div class="btns"><button class="btn primary" data-act="goStatuses">View SIP status</button></div></div>' };
}
function screenPauseDone(p) {
  const s = sipById(p.id); if (!s.pause) return noPauseScreen(s); const i = statusInfo(s);
  const h = '<div class="state ok"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h2" style="margin:0">Your pause is set</h2><p class="sec">' + esc(s.name) + ' is now <b>' + esc(i.label.toLowerCase()) + '</b>. ' + (s.pause.resume ? 'It restarts on ' + fmtD(s.pause.resume) + ', as you chose.' : 'It stays paused until you resume it.') + '</p>' + chip(i.cls, i.icon, i.label) + '</div>' +
    '<div class="card"><div role="heading" aria-level="2" class="h3">Want a reminder before it restarts?</div><p class="sec" style="margin:4px 0 0">Entirely optional. If you say yes, we send one message at the time you pick. If not, we send nothing.</p><div class="btns" style="flex-direction:column"><button class="btn primary" data-act="openReminder" data-id="' + s.id + '">' + ic('bell', 'sm') + ' Set a restart reminder</button><button class="btn secondary" data-act="goStatuses">No reminder. View updated SIP status</button><button class="btn text" data-act="undoPause" data-id="' + s.id + '">Undo this pause</button></div></div>' + disclaimer();
  return { title: 'Pause confirmed', eyebrow: 'Success', nav: 'sips', body: h };
}
function remOptions(s) {
  const out = []; const resume = s.pause && s.pause.resume;
  if (resume) [1, 3, 7].forEach(d => { const dt = addDays(resume, -d); out.push({ id: 'd' + d, label: d + (d === 1 ? ' day' : ' days') + ' before restart', date: dt, ok: dt > S.today }); });
  out.push({ id: 'date', label: 'Pick a date', date: null, ok: true });
  return out;
}
function screenReminder(p) {
  const s = sipById(p.id); if (!s.pause) return noPauseScreen(s); const r = S.ui.rem; const opts = remOptions(s); const resume = s.pause && s.pause.resume;
  const chosen = opts.find(o => o.id === r.opt);
  const when = r.on && chosen ? (chosen.id === 'date' ? r.date : chosen.date) : null;
  let h = '<div class="card"><div class="row between">' + statusChip(s) + '<span class="cap">' + (s.pause.reminder.on ? 'Reminder set' : 'No reminder set') + '</span></div><div role="heading" aria-level="2" class="h3" style="margin-top:8px">' + esc(s.name) + '</div><div class="cap">' + (resume ? 'Restarts ' + fmtD(resume) : 'Paused until you resume') + '</div></div>';
  h += '<div class="card"><div class="row between"><div style="flex:1"><div role="heading" aria-level="2" class="h3">Restart reminder</div><div class="sec">One message, at the time you choose. Off unless you turn it on.</div></div><button class="toggle" role="switch" aria-checked="' + r.on + '" aria-label="Enable restart reminder" data-act="remToggle"></button></div>';
  if (r.on) {
    h += '<div class="micro sec" style="margin-top:16px">When should we remind you?</div><div role="radiogroup" aria-label="Reminder timing">' + opts.map(o => '<button class="opt" style="margin-top:8px;padding:12px;' + (o.ok ? '' : 'opacity:.5') + '" role="radio" aria-checked="' + (r.opt === o.id) + '" ' + (o.ok ? '' : 'disabled') + ' data-act="remOpt" data-id="' + o.id + '"><span><span role="heading" aria-level="2" class="h3" style="display:block;font-size:14px">' + o.label + '</span><span class="cap num">' + (o.date ? fmtD(o.date) + (o.ok ? '' : ' (already passed)') : 'Choose any future date') + '</span></span><span class="radio"></span></button>').join('') + '</div>';
    if (r.opt === 'date') h += '<label class="f" for="rd">Reminder date</label><input id="rd" type="date" data-field="remDate" value="' + esc(r.date) + '" min="' + addDays(S.today, 1) + '">';
    h += '<div class="micro sec" style="margin-top:16px">How should we send it?</div>' + [['inapp', 'In-app inbox', 'bell'], ['push', 'Push notification (demo)', 'bell'], ['email', 'Email (demo)', 'send']].map(c => '<button class="check" role="checkbox" aria-checked="' + (r.channels.includes(c[0])) + '" data-act="remCh" data-id="' + c[0] + '"><span class="box">' + ic('check') + '</span><span style="flex:1"><b>' + c[1] + '</b></span></button>').join('');
    if (r.err) h += '<div class="err" role="alert">' + ic('alert', 'sm') + '<span>' + esc(r.err) + '</span></div>';
    h += '<div class="card nested" style="margin-top:16px"><div class="row between"><span role="heading" aria-level="2" class="h3" style="font-size:14px">Preview of your reminder</span><span class="cap">' + (when ? 'Sends ' + fmtD(when) : 'Pick a time') + '</span></div><p style="margin:8px 0 0">Your SIP for ' + esc(s.name) + ' is paused' + (resume ? ' until ' + fmtD(resume) : '') + '. You can resume, extend, or leave it paused.</p><div class="btns"><span class="btn secondary small" style="pointer-events:none">Resume</span><span class="btn secondary small" style="pointer-events:none">Extend</span><span class="btn secondary small" style="pointer-events:none">Leave paused</span></div></div><div class="cap" style="margin-top:8px">' + ic('shield', 'sm') + ' One message only. No countdowns, no follow-ups if you ignore it.</div>';
  }
  h += '</div><div class="btns" style="flex-direction:column"><button class="btn primary" data-act="saveReminder" data-id="' + s.id + '">Save reminder preference</button><button class="btn secondary" data-act="back">Go back</button></div>' + disclaimer();
  return { title: 'Restart reminder', eyebrow: 'SIP management', back: true, nav: 'sips', body: h };
}
function screenReminderDone(p) {
  const s = sipById(p.id); if (!s.pause) return noPauseScreen(s); const rm = s.pause && s.pause.reminder;
  const h = '<div class="state ok"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h2" style="margin:0">' + (rm && rm.on ? 'Reminder saved' : 'No reminder will be sent') + '</h2><p class="sec">' + (rm && rm.on ? 'We’ll send one message on <b>' + fmtD(rm.remindOn) + '</b>. You can change or turn it off any time.' : 'Your SIP stays paused with no messages from us. You can set a reminder later.') + '</p></div>' +
    '<div class="btns" style="flex-direction:column"><button class="btn primary" data-act="goStatuses">View updated SIP status</button><button class="btn secondary" data-act="home">Return to dashboard</button></div>' + disclaimer();
  return { title: 'Reminder', eyebrow: 'Success', nav: 'sips', body: h };
}
function screenInbox() {
  let h = '';
  if (!S.inbox.length) h = '<div class="card state"><div class="big-ic">' + ic('bell', 'lg') + '</div><h2 class="h3">Nothing here</h2><p class="sec">Messages appear only if you ask for them, such as a restart reminder you set up.</p><button class="btn secondary" data-act="home">Back to SIPs</button></div>';
  else h = S.inbox.map((m, i) => '<div class="card"><div class="row between"><span class="micro" style="color:var(--blue-text)">' + esc(m.kind === 'reminder' ? 'Restart reminder' : 'SIP update') + '</span><span class="cap">' + fmtD(m.date) + '</span></div><div role="heading" aria-level="2" class="h3" style="margin-top:4px">' + esc(m.title) + '</div><p class="sec" style="margin:4px 0 0">' + esc(m.body) + '</p>' +
    (m.kind === 'reminder' && !m.done ? '<div class="btns"><button class="btn secondary small" data-act="sheet" data-id="resume:' + m.sip + '">Resume</button><button class="btn secondary small" data-act="sheet" data-id="extend:' + m.sip + '">Extend</button><button class="btn secondary small" data-act="leave" data-id="' + i + '">Leave paused</button></div>' : (m.done ? '<div class="cap" style="margin-top:8px">' + esc(m.done) + '</div>' : '')) + '</div>').join('');
  return { title: 'Messages', eyebrow: 'Inbox', back: true, nav: 'sips', body: h };
}
function screenExplore() {
  return { title: 'Explore', eyebrow: 'Outside this prototype', nav: 'explore', body: '<div class="card state"><div class="big-ic">' + ic('compass', 'lg') + '</div><h2 class="h3">Explore isn’t part of this prototype</h2><p class="sec">This demo covers three things: understanding returns, understanding a failed debit, and pausing or restarting a SIP.</p><div class="btns"><button class="btn primary" data-act="home">Back to my SIPs</button><button class="btn secondary" data-act="tab" data-id="coach">Open Return Coach</button></div></div>' };
}
function screenAccount() {
  const h = '<div class="card"><div class="row"><span class="avatar">' + ic('user') + '</span><div><div role="heading" aria-level="2" class="h3">Demo investor</div><div class="cap">No real account is connected</div></div></div></div>' +
    '<div class="card"><div class="row between"><div><div role="heading" aria-level="2" class="h3">Appearance</div><div class="cap">Dark is the default. Your choice is remembered.</div></div><button class="btn secondary small" data-act="theme">' + ic(S.theme === 'dark' ? 'sun' : 'moon', 'sm') + (S.theme === 'dark' ? ' Light mode' : ' Dark mode') + '</button></div><hr class="sep"><div class="row between"><div><div role="heading" aria-level="2" class="h3">Hide amounts</div><div class="cap">Masks ₹ figures on every screen</div></div><button class="toggle" role="switch" aria-checked="' + S.hidden + '" aria-label="Hide amounts" data-act="hide"></button></div></div>' +
    '<div class="card"><div role="heading" aria-level="2" class="h3">About this prototype</div><div class="stack" style="margin-top:8px"><div class="note">' + ic('shield', 'sm') + '<span>All data is made up: fictional funds, a fictional bank, and invented figures.</span></div><div class="note">' + ic('lock', 'sm') + '<span>No real accounts are connected, no money moves, and nothing leaves your browser.</span></div><div class="note">' + ic('info', 'sm') + '<span>No AI model is used. Every sentence is a template filled with figures calculated on this page.</span></div></div></div>' +
    '<div class="btns" style="flex-direction:column"><button class="btn secondary" data-act="reset">' + ic('refresh', 'sm') + ' Reset demo data</button><button class="btn secondary" data-act="home">Back to my SIPs</button></div>';
  return { title: 'Account', eyebrow: 'Demo', nav: 'account', body: h };
}
function screenMandate(p) {
  const s = sipById(p.id);
  const h = '<div class="card"><div class="row top"><span style="color:var(--blue-text)">' + ic('bank', 'lg') + '</span><div style="flex:1"><div role="heading" aria-level="2" class="h3">Autopay mandate</div><div class="cap">' + esc(s.name) + ' · ' + esc(s.bank) + '</div></div>' + chip(s.mandate === 'ACTIVE' ? 'active' : 'fail', s.mandate === 'ACTIVE' ? 'check' : 'alert', s.mandate === 'ACTIVE' ? 'Active' : 'Not active') + '</div>' +
    '<div class="grid2" style="margin-top:12px"><div class="kv"><div class="k">Type</div><div class="v">E-mandate (demo)</div></div><div class="kv"><div class="k">Debit amount</div><div class="v num">' + MR(s.amount) + '</div></div></div>' +
    '<p class="sec" style="margin-top:12px">' + (s.mandate === 'ACTIVE' ? 'The mandate is active in the demo. No changes are needed.' : 'The mandate is not active in the demo. Renewing it lets future instalments be debited again.') + '</p>' +
    '<div class="btns" style="flex-direction:column">' + (s.mandate === 'ACTIVE' ? '' : '<button class="btn primary" data-act="renewMandate" data-id="' + s.id + '">Renew mandate (demo)</button>') + '<button class="btn secondary" data-act="back">Go back</button></div></div>' + disclaimer();
  return { title: 'Bank mandate', eyebrow: 'Manage', back: true, nav: 'sips', body: h };
}
const SCREENS = { dashboard: screenDashboard, sipDetail: screenSipDetail, coachEntry: screenCoachEntry, coachExplain: screenCoachExplain, ledger: screenLedger, debit: screenDebit, statuses: screenStatuses, manage: screenManage, pauseForm: screenPauseForm, reduce: screenReduce, pauseDone: screenPauseDone, reminder: screenReminder, reminderDone: screenReminderDone, inbox: screenInbox, explore: screenExplore, account: screenAccount, mandate: screenMandate };

/* ===================== sheets ===================== */
const TERMS = {
  XIRR: ['XIRR', 'XIRR is an annualised, money-weighted return. It accounts for when each instalment was made. In the first year it extrapolates a short period to a full year, so it can look large or small compared with the absolute return.'],
  ABS: ['Absolute return', 'Absolute return compares the current value with the total amount invested. It is not annualised: ₹100 turning into ₹98 is −2%, whatever the time taken.'],
  NAV: ['NAV', 'NAV is the price of one unit of a fund on a given day. A fixed instalment buys more units when the NAV is lower and fewer when it is higher.']
};
function sheetHTML() {
  const sh = S.sheet; if (!sh) return '';
  let inner = '';
  const close = '<button class="btn secondary" data-act="closeSheet">Close</button>';
  if (sh.type === 'term') { const t = TERMS[sh.key]; inner = '<h2 class="h2" style="margin:0">' + t[0] + '</h2><p style="margin:8px 0 0">' + esc(t[1]) + '</p><div class="callout">' + demoChip('Demo content · source placeholder') + '<div class="cap" style="margin-top:6px">' + esc(SOURCES[0].title) + '</div></div><div class="btns">' + close + '</div>'; }
  if (sh.type === 'source') inner = '<h2 class="h2" style="margin:0">Official sources</h2><p class="sec">Real sources are not connected in this demo. Before launch this list is replaced with verified AMFI, SEBI and fund-house documents.</p><div class="btns">' + close + '</div>';
  if (sh.type === 'support') inner = '<h2 class="h2" style="margin:0">Support</h2><p class="sec">Support chat isn’t connected in this prototype, and no messages are sent. In a real product this opens help with the details of your SIP.</p><div class="btns">' + close + '</div>';
  if (sh.type === 'charges') inner = '<h2 class="h2" style="margin:0">Will I be charged anything?</h2><p style="margin:8px 0 0">I don’t have verified information about charges for this. Your bank or the fund house can confirm.</p><div class="callout">' + ic('info', 'sm') + ' This prototype never states a fee, penalty or deadline that hasn’t been verified.</div><div class="btns">' + close + '</div>';
  if (sh.type === 'newSip') inner = '<h2 class="h2" style="margin:0">Start a new SIP</h2><p class="sec">Setting up new SIPs is outside this prototype. Nothing was created.</p><div class="btns">' + close + '</div>';
  if (sh.type === 'pay') {
    const s = sipById(sh.id); const ev = s.event; const res = S.ui.payResult;
    if (S.ui.payBusy) inner = '<div class="state" aria-busy="true"><div class="big-ic">' + ic('clock', 'lg') + '</div><h2 class="h3">Processing (demo)</h2><p class="sec">Simulating the payment. No real money moves.</p><div class="skel" style="height:10px"></div></div>';
    else if (res && res.ok) inner = '<div class="state ok"><div class="big-ic">' + ic('check', 'lg') + '</div><h2 class="h2" style="margin:0">Instalment paid (demo)</h2><p class="sec">' + MR(ev.amount) + ' was paid manually for ' + esc(s.name) + '. Your SIP continues as scheduled; the next instalment is on ' + fmtD(nextDue(s, S.today)) + '. No real money moved.</p><div class="btns"><button class="btn primary" data-act="payDone">Return to dashboard</button></div></div>';
    else if (res && !res.ok) inner = '<div class="state bad"><div class="big-ic">' + ic('info', 'lg') + '</div><h2 class="h3">The payment didn’t go through (demo)</h2><p class="sec">We couldn’t complete it, and we don’t have a reason to share. Your SIP is still active. You can try again or contact support.</p><div class="btns"><button class="btn primary" data-act="payAgain">Try again</button><button class="btn secondary" data-act="closeSheet">Close</button></div></div>';
    else inner = '<h2 class="h2" style="margin:0">Pay this instalment now</h2><div class="card nested"><div class="row between"><span class="sec">Fund</span><b>' + esc(s.name) + '</b></div><div class="row between" style="margin-top:6px"><span class="sec">Amount</span><b class="num">' + MR(ev.amount) + '</b></div><div class="row between" style="margin-top:6px"><span class="sec">From</span><b>' + esc(s.bank) + '</b></div><div class="row between" style="margin-top:6px"><span class="sec">Instalment date</span><b class="num">' + fmtD(ev.date) + '</b></div></div><div class="callout amber">' + ic('info', 'sm') + ' Demo only. No real account is debited. In a real product the automatic retry on ' + (ev.retry ? fmtD(ev.retry.date) : '—') + ' may also apply; this screen would warn you about a double debit.</div><div class="btns"><button class="btn secondary" data-act="closeSheet">Not now</button><button class="btn primary" data-act="payConfirm">Pay ' + MR(ev.amount) + '</button></div>';
  }
  if (sh.type === 'resume') { const s = sipById(sh.id); const nd = dueDates(s.day, S.today, 1)[0]; inner = '<h2 class="h2" style="margin:0">Resume this SIP?</h2><p style="margin:8px 0 0">' + esc(s.name) + ' will become active. Your next instalment of ' + MR(s.amount) + ' will be on <b>' + fmtD(nd) + '</b>.</p><div class="btns"><button class="btn secondary" data-act="closeSheet">Keep paused</button><button class="btn primary" data-act="resumeNow" data-id="' + s.id + '">Resume SIP</button></div>'; }
  if (sh.type === 'extend') {
    const s = sipById(sh.id); const sel = S.ui.extendSel;
    inner = '<h2 class="h2" style="margin:0">Change your pause</h2><p class="sec">Currently ' + (s.pause.resume ? 'restarts on ' + fmtD(s.pause.resume) : 'paused until you resume') + '.</p><div class="grid2" role="radiogroup" aria-label="New pause length">' + [['1', 'Extend 1 month'], ['2', 'Extend 2 months'], ['open', 'Until I resume'], ['0', 'Keep as it is']].map(x => '<button class="opt" style="margin-top:0;display:block" role="radio" aria-checked="' + (sel === x[0]) + '" data-act="extSel" data-id="' + x[0] + '"><span role="heading" aria-level="2" class="h3" style="font-size:14px">' + x[1] + '</span></button>').join('') + '</div><div class="btns"><button class="btn secondary" data-act="closeSheet">Close</button><button class="btn primary" data-act="extendApply" data-id="' + s.id + '" ' + (sel ? '' : 'disabled') + '>Apply</button></div>';
  }
  if (sh.type === 'cancel') { const s = sipById(sh.id); inner = '<h2 class="h2" style="margin:0">Cancel this SIP?</h2><p style="margin:8px 0 0">Future instalments for ' + esc(s.name) + ' will stop. A cancelled SIP can’t be resumed, but you can set up a new one.</p><div class="callout">' + demoChip() + '<div class="cap" style="margin-top:6px">Any effect on units, mandates or charges is not verified in this demo.</div></div><div class="btns"><button class="btn secondary" data-act="closeSheet">Go back</button><button class="btn danger" data-act="cancelApply" data-id="' + s.id + '">Yes, cancel SIP</button></div>'; }
  if (sh.type === 'guide') inner = '<div class="guide-sheet">' + guideHTML() + '</div><div class="btns">' + close + '</div>';
  return '<div class="overlay" data-act="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-label="Details">' + '<div class="grab"></div>' + inner + '</div></div>';
}

/* ===================== demo guide ===================== */
const JOURNEYS = {
  A: ['Return confusion', [['dash', 'Open the SIP dashboard'], ['select', 'Select a SIP'], ['coach', 'Open the Return Coach explanation'], ['xirr', 'Expand the XIRR explanation'], ['follow', 'Ask a follow-up question'], ['home', 'Return to the dashboard']]],
  B: ['Failed debit', [['dash', 'Open the SIP dashboard'], ['ledger', 'Open recent transactions'], ['failed', 'Open the failed instalment'], ['reason', 'View the failure reason and SIP status'], ['step', 'Follow the next step'], ['home', 'Return to the dashboard']]],
  C: ['Pause and restart', [['dash', 'Open the SIP dashboard'], ['mgmt', 'Open SIP management'], ['pause', 'Choose Pause and select dates'], ['confirm', 'Confirm the pause'], ['reminder', 'Enable a restart reminder'], ['status', 'View the updated SIP status']]]
};
function guideHTML() {
  const jr = Object.keys(JOURNEYS).map(k => '<div class="card"><div class="row between"><b>Journey ' + k + ': ' + JOURNEYS[k][0] + '</b><button class="btn small secondary" data-act="start" data-id="' + k + '">Start</button></div><div style="margin-top:8px">' + JOURNEYS[k][1].map(st => '<div class="step ' + (S.journey[k][st[0]] ? 'done' : '') + '">' + ic(S.journey[k][st[0]] ? 'check' : 'chev', 'sm') + '<span>' + st[1] + '</span></div>').join('') + '</div></div>').join('');
  const dt = S.today;
  const rem = S.data.sips.filter(s => s.pause && s.pause.reminder.on && !s.pause.reminder.sent).map(s => s.pause.reminder.remindOn).sort()[0];
  const rsm = S.data.sips.filter(s => s.status === 'PAUSED' && s.pause && s.pause.resume).map(s => s.pause.resume).sort()[0];
  return '<div class="card"><h2>Demo guide</h2><p class="sec" style="margin:0">Fictional funds and a fictional bank. No real accounts, no real transactions, no AI model.</p><p class="cap" style="margin:8px 0 0">\u201CStart\u201D resets the demo data so each journey can be replayed from the beginning.</p></div>' + jr +
    '<div class="card"><h2>Demo clock</h2><div class="row between"><span class="sec">Today in the demo</span><b class="num">' + fmtD(dt) + '</b></div><div class="btns"><button class="btn small secondary" data-act="clock" data-id="+1">+1 day</button><button class="btn small secondary" data-act="clock" data-id="rem" ' + (rem ? '' : 'disabled') + '>To next reminder' + (rem ? ' (' + fmtDS(rem) + ')' : '') + '</button></div><div class="btns"><button class="btn small secondary" data-act="clock" data-id="resume" ' + (rsm ? '' : 'disabled') + '>To next restart' + (rsm ? ' (' + fmtDS(rsm) + ')' : '') + '</button><button class="btn small secondary" data-act="clock" data-id="reset">Reset date</button></div></div>' +
    '<div class="card"><h2>Simulate</h2><div class="stack"><button class="check" role="checkbox" aria-checked="' + S.sim.errorNext + '" data-act="sim" data-id="errorNext"><span class="box">' + ic('check') + '</span><span>Network error on the next screen load</span></button><button class="check" role="checkbox" aria-checked="' + S.sim.slow + '" data-act="sim" data-id="slow"><span class="box">' + ic('check') + '</span><span>Slow network (longer loading state)</span></button><button class="check" role="checkbox" aria-checked="' + S.sim.payFails + '" data-act="sim" data-id="payFails"><span class="box">' + ic('check') + '</span><span>Next manual payment fails with no reason</span></button><button class="check" role="checkbox" aria-checked="' + S.sim.pauseFails + '" data-act="sim" data-id="pauseFails"><span class="box">' + ic('check') + '</span><span>Pause request fails (nothing changes)</span></button></div>' +
    '<label class="f" for="reasonSel">Failure reason from the demo provider (SIP B)</label><select id="reasonSel" data-field="reason" style="width:100%;min-height:44px;border-radius:8px;border:1px solid var(--border);background:var(--s2);color:var(--t1);padding:0 8px">' + Object.keys(REASON_LABEL).map(k => '<option value="' + k + '"' + (S.sim.reason === k ? ' selected' : '') + '>' + REASON_LABEL[k] + '</option>').join('') + '</select></div>' +
    '<div class="card"><div class="row between"><span>Theme</span><button class="btn small secondary" data-act="theme">' + (S.theme === 'dark' ? 'Switch to light' : 'Switch to dark') + '</button></div><div class="btns"><button class="btn small secondary" data-act="reset">Reset demo data</button></div></div>';
}

/* ===================== render ===================== */
function render() {
  const t = top(); const fn = SCREENS[t.name]; const phone = document.getElementById('phone'); if (!phone) return;
  const keepScroll = document.getElementById('screen') ? document.getElementById('screen').scrollTop : 0;
  let scr;
  if (S.loading) scr = { title: 'Loading…', back: S.stack.length > 1, nav: navOf(t.name), body: skeleton() };
  else if (S.error) scr = { title: 'Something went wrong', back: S.stack.length > 1, nav: navOf(t.name), body: errorState() };
  else scr = fn(t.p);
  const unread = S.inbox.filter(m => !m.read).length;
  phone.innerHTML = '<aside aria-label="Demo notice"><div class="statusbar" aria-hidden="true"><span>9:41</span><span>Demo</span></div><div class="demo-banner"><span class="dot"></span>Demo data · no real accounts or transactions</div></aside>' +
    '<header class="header">' + (scr.back && S.stack.length > 1 ? '<button class="icon-btn" data-act="back" aria-label="Go back">' + ic('back') + '</button>' : '<span class="wordmark" aria-label="INDmoney">IND</span>') +
    '<h1>' + (scr.eyebrow ? '<span class="eyebrow">' + esc(scr.eyebrow) + '</span>' : '') + esc(scr.title) + '</h1>' +
    '<button class="icon-btn" data-act="hide" aria-label="' + (S.hidden ? 'Show amounts' : 'Hide amounts') + '">' + ic(S.hidden ? 'eyeoff' : 'eye') + '</button>' +
    '<button class="icon-btn" data-act="theme" aria-label="' + (S.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') + '">' + ic(S.theme === 'dark' ? 'sun' : 'moon') + '</button>' +
    '<button class="icon-btn" data-act="openInbox" aria-label="Messages' + (unread ? ', ' + unread + ' unread' : '') + '">' + ic('bell') + (unread ? '<span class="badge-count">' + unread + '</span>' : '') + '</button>' +
    '<button class="icon-btn" data-act="tab" data-id="account" aria-label="Account">' + ic('user') + '</button></header>' +
    '<main class="screen" id="screen" tabindex="-1">' + scr.body + '</main>' +
    '<nav class="nav" aria-label="Main">' + [['sips', 'SIPs', 'trend'], ['explore', 'Explore', 'compass'], ['coach', 'Coach', 'help'], ['account', 'Account', 'wallet']].map(n => '<button data-act="tab" data-id="' + n[0] + '"' + (scr.nav === n[0] ? ' aria-current="page"' : '') + '>' + ic(n[2]) + '<span>' + n[1] + '</span></button>').join('') + '</nav>' +
    '<button class="icon-btn fab-guide" data-act="sheet" data-id="guide" aria-label="Open demo guide">' + ic('gear') + '</button>';
  const screenEl = document.getElementById('screen'); if (screenEl && keepScroll && !S.loading) screenEl.scrollTop = keepScroll;
  document.getElementById('guide').innerHTML = guideHTML();
  document.getElementById('portal').innerHTML = sheetHTML() + (S.busy ? '<div class="busy" role="alert"><div class="box2"><div class="skel" style="height:8px;width:160px;margin:0 auto 12px"></div><b>' + esc(S.busy) + '</b></div></div>' : '') + (S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '');
  document.documentElement.classList.toggle('dark', S.theme === 'dark');
  document.title = scr.title + ' \u00b7 SIP Steady prototype';
  afterRender(scr);
}
function focusables(root) { return [...root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(e => e.offsetWidth || e.offsetHeight); }
function afterRender(scr) {
  const open = !!S.sheet; const was = !!S.sheetWas; S.sheetWas = open;
  if (S.focusScreen && !S.loading && !open) {
    S.focusScreen = false; const el = document.getElementById('screen'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    const a = document.getElementById('announce'); if (a) a.textContent = scr.title;
  }
  if (open && !was) { S.trigger = S.lastTrigger; const sh = document.querySelector('.sheet'); const f = sh ? focusables(sh)[0] : null; if (f) f.focus(); else if (sh) { sh.setAttribute('tabindex', '-1'); sh.focus(); } }
  if (!open && was) { const t = S.trigger; let el = null; if (t) el = document.querySelector('[data-act="' + t.act + '"]' + (t.id ? '[data-id="' + t.id + '"]' : '')); if (!el) el = document.getElementById('screen'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }
  if (open && was) { const sh = document.querySelector('.sheet'); if (sh && !sh.contains(document.activeElement)) { const f = focusables(sh)[0]; if (f) f.focus(); } }
}
function navOf(n) { return { coachEntry: 'coach', coachExplain: 'coach', explore: 'explore', account: 'account' }[n] || 'sips'; }

/* ===================== actions ===================== */
function setToday(d) {
  S.today = d;
  S.data.sips.forEach(s => {
    if (s.status === 'PAUSED' && s.pause) {
      const r = s.pause.reminder;
      if (r.on && !r.sent && r.remindOn && r.remindOn <= S.today && (!s.pause.resume || s.pause.resume > S.today)) {
        r.sent = true;
        S.inbox.unshift({ kind: 'reminder', sip: s.id, date: S.today, read: false, title: s.name + ' is paused', body: 'Your SIP is paused' + (s.pause.resume ? ' until ' + fmtD(s.pause.resume) : '') + '. You can resume, extend, or leave it paused.' });
      }
      if (s.pause.resume && s.pause.resume <= S.today) {
        s.status = 'ACTIVE'; const rs = s.pause.resume;
        S.inbox.unshift({ kind: 'info', sip: s.id, date: S.today, read: false, title: s.name + ' has resumed', body: 'Your pause ended on ' + fmtD(addDays(rs, -1)) + ', as you chose. Your next instalment is on ' + fmtD(dueDates(s.day, S.today, 1)[0]) + '.' });
        s.pause.ended = true; if (s.pause) s.pause.skippedKeep = s.pause.skipped;
      }
    }
  });
}
function applyReason() { const b = sipById('B'); if (b.event && !b.event.resolved) { b.event.reasonCode = S.sim.reason; b.event.providerMessage = S.sim.reason === 'UNKNOWN' ? null : ({ INSUFFICIENT_BALANCE: 'Insufficient funds in account ending 4012.', UPI_LIMIT_EXCEEDED: 'Transaction amount exceeds the daily UPI limit.', MANDATE_EXPIRED: 'Mandate is not active.', BANK_UNAVAILABLE: 'Bank did not respond.' }[S.sim.reason]); if (S.sim.reason === 'MANDATE_EXPIRED') b.mandate = 'EXPIRED'; else if (b.mandate === 'EXPIRED') b.mandate = 'ACTIVE'; } }
function resetAll() {
  S.data = buildData(); S.today = TODAY0; S.inbox = []; S.stack = [{ name: 'dashboard', p: {} }]; S.sheet = null; S.error = false; S.loading = false;
  S.ui = { sel: null, filter: 'all', sipFilter: 'all', thread: [], xirrOpen: false, fb: {}, optSel: null, pauseSel: null, custom: { start: '', end: '' }, ack: false, pauseErr: null, rem: { on: false, opt: null, date: '', channels: ['inapp'], err: null }, reduce: { amount: '', err: null }, extendSel: null, payBusy: false, payResult: null, fu: '' };
  S.sim.errorNext = false; S.sim.payFails = false; S.sim.pauseFails = false; S.busy = null; S.ui.fuErr = null; S.ui.pauseErr = null; S.sim.reason = 'INSUFFICIENT_BALANCE'; S.journey = { A: {}, B: {}, C: {} }; mark('A', 'dash'); mark('B', 'dash'); mark('C', 'dash');
}
function resetDrafts() { S.ui.optSel = null; S.ui.pauseSel = null; S.ui.custom = { start: '', end: '' }; S.ui.ack = false; S.ui.rem = { on: false, opt: null, date: '', channels: ['inapp'], err: null }; S.ui.reduce = { amount: '', err: null }; S.ui.extendSel = null; }
function doPay(id) {
  const s = sipById(id); S.ui.payBusy = true; S.ui.payResult = null; render();
  setTimeout(() => {
    S.ui.payBusy = false;
    if (S.sim.payFails) { S.ui.payResult = { ok: false }; s.event.attempts++; s.event.reasonCode = 'UNKNOWN'; s.event.providerMessage = null; }
    else {
      S.ui.payResult = { ok: true }; s.event.resolved = true; s.event.resolvedOn = S.today;
      s.instalments.push({ date: S.today, amount: s.event.amount, status: 'SUCCESS', nav: s.currentNav, manual: true });
      mark('B', 'step');
    }
    render();
  }, S.sim.noDelay ? 0 : 1100);
}
function applyPauseNow(s, calc) {
  s.status = 'PAUSED'; s.pause = { start: calc.start, end: calc.end, resume: calc.resume, skipped: calc.skipped, reminder: { on: false, mode: null, remindOn: null, daysBefore: null, channels: ['inapp'], sent: false } };
}
const ACT = {
  back, home: () => go('dashboard', {}, { reset: true }),
  retry: () => load(),
  theme: () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('ind_theme', S.theme); } catch (e) { /* ignore */ } render(); },
  hide: () => { S.hidden = !S.hidden; render(); },
  tab: d => { const m = { sips: 'dashboard', explore: 'explore', coach: 'coachEntry', account: 'account', statuses: 'statuses' }[d.id]; if (m === 'coachEntry') S.ui.sel = null; go(m, {}, { reset: true }); },
  openSip: d => go('sipDetail', { id: d.id }),
  openCoachFor: d => { S.ui.thread = []; S.ui.xirrOpen = false; S.ui.fb = {}; go('coachExplain', { id: d.id }); },
  openCoachEntry: d => { S.ui.sel = d.id; go('coachEntry'); },
  selectSip: d => { S.ui.sel = d.id; mark('A', 'select'); render(); },
  explain: () => { if (!S.ui.sel) return; S.ui.thread = []; S.ui.xirrOpen = false; S.ui.fb = {}; go('coachExplain', { id: S.ui.sel }); },
  toggleXirr: () => { S.ui.xirrOpen = !S.ui.xirrOpen; if (S.ui.xirrOpen) mark('A', 'xirr'); render(); },
  sheet: d => { const [t, k] = d.id.split(':'); S.sheet = (t === 'term') ? { type: 'term', key: k } : (t === 'resume' || t === 'extend') ? { type: t, id: k } : { type: t }; if (t === 'extend') S.ui.extendSel = null; if (t === 'guide') S.sheet = { type: 'guide' }; render(); },
  closeSheet: () => { S.sheet = null; S.ui.payBusy = false; S.ui.payResult = null; render(); },
  overlay: (d, ev) => { if (ev.target.classList && ev.target.classList.contains('overlay')) ACT.closeSheet(); },
  ask: d => askQuestion(d.id), askTyped: () => { const i = document.getElementById('fu-input'); askQuestion(i ? i.value : ''); },
  fb: d => { const [k, v] = d.id.split(':'); S.ui.fb[k] = v; render(); toast('Thanks for the feedback (demo, stored only on this page)'); },
  doneCoach: () => { mark('A', 'home'); go('dashboard', {}, { reset: true }); },
  openLedger: () => { S.ui.filter = 'all'; go('ledger'); },
  filter: d => { S.ui.filter = d.id; render(); },
  openDebit: d => { applyReason(); go('debit', { id: d.id }); },
  nextStep: d => {
    if (d.id === 'PAY') { S.ui.payResult = null; S.ui.payBusy = false; S.sheet = { type: 'pay', id: d.sip }; render(); }
    else if (d.id === 'MANDATE') go('mandate', { id: d.sip });
    else if (d.id === 'SUPPORT') { S.sheet = { type: 'support' }; render(); }
    else if (d.id === 'WAIT') { mark('B', 'step'); toast('Noted. The provider will retry automatically.'); }
  },
  payConfirm: () => { doPay(S.sheet.id); }, payAgain: () => { S.ui.payResult = null; render(); },
  payDone: () => { S.sheet = null; S.ui.payResult = null; mark('B', 'home'); go('dashboard', {}, { reset: true }); },
  renewMandate: d => { const s = sipById(d.id); s.mandate = 'ACTIVE'; if (s.event && s.event.reasonCode === 'MANDATE_EXPIRED') { mark('B', 'step'); } toast('Mandate renewed (demo)'); render(); },
  sipFilter: d => { S.ui.sipFilter = d.id; render(); },
  openManage: d => { resetDrafts(); go('manage', { id: d.id }); },
  opt: d => { S.ui.optSel = d.id; render(); },
  optContinue: () => { const id = top().p.id; const o = S.ui.optSel; if (o === 'pause') { S.ui.pauseSel = null; S.ui.ack = false; go('pauseForm', { id }); } else if (o === 'reduce') { S.ui.reduce = { amount: '', err: null }; go('reduce', { id }); } else if (o === 'cancel') { S.sheet = { type: 'cancel', id }; render(); } },
  pauseSel: d => { S.ui.pauseSel = d.id; S.ui.ack = false; render(); },
  ack: () => { S.ui.ack = !S.ui.ack; render(); },
  confirmPause: () => {
    const s = sipById(top().p.id); const calc = computePause(s, S.ui.pauseSel, S.ui.custom); if (!calc.ok || !S.ui.ack) return;
    S.busy = 'Setting up your pause\u2026'; S.ui.pauseErr = null; render();
    setTimeout(() => { S.busy = null; if (S.sim.pauseFails) { S.ui.pauseErr = 'We couldn\u2019t set up the pause (simulated problem). Nothing was changed. Please try again.'; render(); return; } applyPauseNow(s, calc); mark('C', 'confirm'); S.ui.rem = { on: false, opt: null, date: '', channels: ['inapp'], err: null }; go('pauseDone', { id: s.id }, { replace: true, quick: true }); }, S.sim.noDelay ? 0 : 900);
  },
  undoPause: d => { const s = sipById(d.id); s.status = 'ACTIVE'; s.pause = null; go('dashboard', {}, { reset: true, quick: true }); toast('Your pause was undone'); },
  openReminder: d => { const s = sipById(d.id); if (!s.pause) return; const r = s.pause.reminder; S.ui.rem = { on: r.on, opt: r.on ? (r.mode || null) : null, date: r.mode === 'date' ? r.remindOn : '', channels: r.channels.slice(), err: null }; go('reminder', { id: d.id }); },
  remToggle: () => { S.ui.rem.on = !S.ui.rem.on; S.ui.rem.err = null; render(); },
  remOpt: d => { S.ui.rem.opt = d.id; S.ui.rem.err = null; render(); },
  remCh: d => { const c = S.ui.rem.channels; const i = c.indexOf(d.id); if (i >= 0) { if (c.length > 1) { c.splice(i, 1); S.ui.rem.err = null; } else S.ui.rem.err = 'Keep at least one way to receive the reminder.'; } else { c.push(d.id); S.ui.rem.err = null; } render(); },
  saveReminder: d => {
    const s = sipById(d.id); const r = S.ui.rem;
    if (!r.on) { s.pause.reminder = { on: false, mode: null, remindOn: null, daysBefore: null, channels: ['inapp'], sent: false }; mark('C', 'reminder'); go('reminderDone', { id: s.id }, { replace: true }); return; }
    if (!r.opt) { r.err = 'Choose when you’d like the reminder.'; render(); return; }
    let remindOn, days = null;
    if (r.opt === 'date') { remindOn = r.date; if (!remindOn) { r.err = 'Choose a reminder date.'; render(); return; } if (remindOn <= S.today) { r.err = 'Choose a reminder time in the future.'; render(); return; } if (s.pause.resume && remindOn > s.pause.resume) { r.err = 'This reminder is after your pause ends. Choose an earlier date.'; render(); return; } }
    else { days = +r.opt.slice(1); remindOn = addDays(s.pause.resume, -days); if (remindOn <= S.today) { r.err = 'That date has already passed. Choose a later option.'; render(); return; } }
    s.pause.reminder = { on: true, mode: r.opt, remindOn, daysBefore: days, channels: r.channels.slice(), sent: false };
    mark('C', 'reminder'); go('reminderDone', { id: s.id }, { replace: true });
  },
  goStatuses: () => { mark('C', 'status'); S.ui.sipFilter = 'all'; go('statuses', {}, { reset: true }); },
  confirmReduce: d => {
    const s = sipById(d.id); const v = S.ui.reduce.amount; const n = Number(v);
    if (v === '' || isNaN(n)) { S.ui.reduce.err = 'Enter the amount as a number, for example 3000.'; render(); return; }
    if (n <= 0) { S.ui.reduce.err = 'Enter an amount greater than zero.'; render(); return; }
    if (n < 500) { S.ui.reduce.err = 'The demo minimum is ₹500.'; render(); return; }
    if (n >= s.amount) { S.ui.reduce.err = 'Enter an amount lower than the current ' + inrR(s.amount) + '.'; render(); return; }
    const old = s.amount; s.amount = Math.round(n); toast('Your SIP changes from ' + inrR(old) + ' to ' + inrR(s.amount) + ' from the next instalment'); go('statuses', {}, { reset: true });
  },
  cancelApply: d => { const s = sipById(d.id); s.status = 'CANCELLED'; s.cancelledOn = S.today; if (s.pause && s.pause.reminder) s.pause.reminder.on = false; S.sheet = null; toast('Your SIP is cancelled'); S.ui.sipFilter = 'all'; go('statuses', {}, { reset: true }); },
  resumeNow: d => { const s = sipById(d.id); s.status = 'ACTIVE'; if (s.pause) { s.pause.ended = true; if (s.pause.reminder) s.pause.reminder.on = false; } S.inbox.forEach(m => { if (m.sip === d.id && m.kind === 'reminder') m.done = 'You resumed this SIP.'; }); S.sheet = null; toast('Your SIP is active again'); S.ui.sipFilter = 'all'; go('statuses', {}, { reset: true }); },
  extSel: d => { S.ui.extendSel = d.id; render(); },
  extendApply: d => {
    const s = sipById(d.id); const sel = S.ui.extendSel; if (!sel) return;
    if (sel !== '0') {
      if (sel === 'open') { s.pause.end = null; s.pause.resume = null; s.pause.reminder.on = s.pause.reminder.on && s.pause.reminder.mode === 'date'; }
      else { const n = +sel; const base = s.pause.resume || dueDates(s.day, S.today, 1)[0]; const dues = dueDates(s.day, base, n + 1); s.pause.skipped = s.pause.skipped.concat(dues.slice(0, n)); s.pause.resume = dues[n]; s.pause.end = addDays(dues[n], -1); const r = s.pause.reminder; if (r.on && r.mode && r.mode[0] === 'd' && r.daysBefore) { r.remindOn = addDays(s.pause.resume, -r.daysBefore); r.sent = false; } }
    }
    S.inbox.forEach(m => { if (m.sip === d.id && m.kind === 'reminder' && !m.done) m.done = sel === '0' ? 'You left it paused.' : 'You changed your pause.'; });
    S.sheet = null; toast(sel === '0' ? 'Pause unchanged' : 'Your pause was updated'); S.ui.sipFilter = 'all'; go('statuses', {}, { reset: true });
  },
  openInbox: () => { S.inbox.forEach(m => { m.read = true; }); go('inbox'); },
  leave: d => { const m = S.inbox[+d.id]; if (m) m.done = 'You left it paused. We won’t send another message.'; toast('No further messages'); render(); },
  start: d => { const keep = S.theme, hid = S.hidden; resetAll(); S.theme = keep; S.hidden = hid; S.sheet = null; go('dashboard', {}, { reset: true }); toast('Journey ' + d.id + ' ready (demo data reset). Follow the steps in the guide.'); },
  clock: d => {
    let t = S.today;
    if (d.id === '+1') t = addDays(S.today, 1); else if (d.id === 'reset') { t = TODAY0; }
    else if (d.id === 'rem') { const x = S.data.sips.filter(s => s.pause && s.pause.reminder.on && !s.pause.reminder.sent).map(s => s.pause.reminder.remindOn).sort()[0]; if (x) t = x > S.today ? x : S.today; }
    else if (d.id === 'resume') { const x = S.data.sips.filter(s => s.status === 'PAUSED' && s.pause && s.pause.resume).map(s => s.pause.resume).sort()[0]; if (x) t = x > S.today ? x : S.today; }
    if (d.id === 'reset') { const keep = S.theme; resetAll(); S.theme = keep; load(true); return; }
    setToday(t); toast('Demo date: ' + fmtD(S.today)); render();
  },
  sim: d => { S.sim[d.id] = !S.sim[d.id]; render(); },
  reset: () => { const keep = S.theme; resetAll(); S.theme = keep; toast('Demo data reset'); load(true); }
};
function askQuestion(text) {
  const t = top(); if (t.name !== 'coachExplain') return; const s = sipById(t.p.id); const c = calcSip(s, S.today);
  const a = answerFollowUp(text, s, c); if (!a) { S.ui.fuErr = 'Type a question first, or pick one above.'; render(); return; }
  S.ui.fuErr = null;
  S.ui.thread.push({ q: String(text).slice(0, 140) }); S.ui.thread.push(a); S.ui.fu = ''; mark('A', 'follow'); render();
  const th = document.getElementById('thread'); if (th && th.scrollIntoView) { try { th.lastElementChild.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } }
}

/* ===================== events ===================== */
document.addEventListener('click', ev => {
  const el = ev.target.closest ? ev.target.closest('[data-act]') : null; if (!el) return;
  const act = ACT[el.dataset.act]; if (!act) return;
  if (el.hasAttribute('disabled')) return;
  if (!S.sheet) S.lastTrigger = { act: el.dataset.act, id: el.dataset.id || '' };
  act(el.dataset, ev);
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && S.sheet) { ACT.closeSheet(); return; }
  if (ev.key === 'Tab' && S.sheet) { const sh = document.querySelector('.sheet'); if (sh) { const f = focusables(sh); if (f.length) { const i = f.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && (i === f.length - 1 || i < 0)) { ev.preventDefault(); f[0].focus(); } } } return; }
  if (ev.key === 'Enter' && ev.target && ev.target.id === 'fu-input') { ev.preventDefault(); ACT.askTyped(); return; }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.getAttribute && ev.target.getAttribute('role') === 'button' && ev.target.dataset.act) { ev.preventDefault(); ev.target.click(); }
});
document.addEventListener('input', ev => {
  const f = ev.target && ev.target.dataset ? ev.target.dataset.field : null;
  if (ev.target && ev.target.id === 'fu-input') { S.ui.fu = ev.target.value; if (S.ui.fuErr) { S.ui.fuErr = null; const e = document.querySelector('#screen .err'); if (e && e.textContent.indexOf('Type a question') >= 0) e.remove(); } }
  if (f === 'reduce') S.ui.reduce.amount = ev.target.value;
});
document.addEventListener('change', ev => {
  const f = ev.target && ev.target.dataset ? ev.target.dataset.field : null; if (!f) return;
  if (f === 'start') { S.ui.custom.start = ev.target.value; S.ui.ack = false; render(); }
  if (f === 'end') { S.ui.custom.end = ev.target.value; S.ui.ack = false; render(); }
  if (f === 'remDate') { S.ui.rem.date = ev.target.value; S.ui.rem.err = null; render(); }
  if (f === 'reason') { S.sim.reason = ev.target.value; applyReason(); render(); }
});

window.addEventListener('popstate', () => {
  if (S.sheet) { S.sheet = null; render(); try { history.pushState({ n: S.stack.length }, ''); } catch (e) { /* ignore */ } return; }
  if (S.stack.length > 1) { S.stack.pop(); S.focusScreen = true; load(true); } else { try { history.pushState({ n: 1 }, ''); } catch (e) { /* ignore */ } }
});

/* ===================== boot ===================== */
mark('A', 'dash'); mark('B', 'dash'); mark('C', 'dash');
applyReason();
window.SIPSteady = { S, go, ACT, calcSip, xirrCalc, evalDebit, answerFollowUp, computePause, setToday, resetAll, render, load, dueDates, addMonths, monthsBetween };
load();
})();
