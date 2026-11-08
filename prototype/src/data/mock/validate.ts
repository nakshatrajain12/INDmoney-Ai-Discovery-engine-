import { PersonaFixture, type ReturnBand, type SipBundle } from '@/contracts/domain';
import { addDays, dueDatesUpTo, isValidISODate, type ISODate } from '@/lib/dates';
import { deriveSipStatus } from '../status';

/**
 * Fixture validator. It checks that every persona is internally consistent AND that every intentional data
 * problem is declared: the anomalies detected in the data must equal the anomalies the fixture declares.
 * This is a sanity check on fixtures only; the real return calculations are built and tested in Phase 2.
 */

/** Fixture-sanity thresholds (same demo values the clickable prototype used; formal bands arrive in Phase 2). */
export function returnBandSanity(investedPaise: number, valuePaise: number | null): ReturnBand {
  if (valuePaise === null || investedPaise <= 0) return 'UNKNOWN';
  const pct = ((valuePaise - investedPaise) / investedPaise) * 100;
  if (pct <= -5) return 'NEGATIVE';
  if (pct <= -0.5) return 'SMALL_NEGATIVE';
  if (pct < 0.5) return 'FLAT';
  if (pct < 5) return 'SMALL_POSITIVE';
  return 'POSITIVE';
}

export function detectAnomalies(b: SipBundle, asOf: ISODate): string[] {
  const out = new Set<string>();
  const { sip, instalments, valuation, failures } = b;

  let dues = dueDatesUpTo(sip.investmentDate, sip.frequency, asOf);
  if (sip.cancelledOn) dues = dues.filter((d) => d < sip.cancelledOn!);
  const recorded = new Set(instalments.map((i) => i.dueDate));
  if (dues.some((d) => !recorded.has(d))) out.add('SCHEDULE_GAP');

  if (!valuation || valuation.currentValuePaise === null) out.add('MISSING_VALUATION');
  if (instalments.some((i) => i.status === 'SUCCESS' && i.navE4 === null)) out.add('MISSING_NAV');

  if (valuation && valuation.providerXirrBps !== null && valuation.currentValuePaise !== null) {
    const invested = instalments.filter((i) => i.status === 'SUCCESS').reduce((a, i) => a + i.amountPaise, 0);
    const diff = valuation.currentValuePaise - invested;
    if (diff !== 0 && valuation.providerXirrBps !== 0 && Math.sign(diff) !== Math.sign(valuation.providerXirrBps)) out.add('PROVIDER_XIRR_SIGN_MISMATCH');
  }
  if (sip.cancelledOn && sip.cancelledOn <= asOf && failures.some((f) => !f.resolved)) out.add('CANCELLED_WITH_OPEN_FAILURE');
  return [...out].sort();
}

export function validatePersona(raw: unknown): string[] {
  const issues: string[] = [];
  const parsed = PersonaFixture.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `schema: ${i.path.join('.')}: ${i.message}`);
  }
  const p = parsed.data;
  const tag = (m: string) => issues.push(`${p.key}: ${m}`);
  const asOf = p.asOf;

  if (!isValidISODate(asOf)) tag('asOf is not a valid date');
  const sipIds = p.sips.map((b) => b.sip.id);
  if (new Set(sipIds).size !== sipIds.length) tag('duplicate SIP ids');
  if (JSON.stringify([...sipIds].sort()) !== JSON.stringify(Object.keys(p.expectations).sort())) tag('expectations do not cover exactly the SIPs');

  for (const b of p.sips) {
    const { sip, instalments, valuation, failures, pause, reminder } = b;
    const at = (m: string) => tag(`${sip.id}: ${m}`);

    if (sip.userId !== p.user.id) at('SIP userId does not match the persona user');
    if (sip.investmentDate > asOf) at('investment date is after asOf');

    // instalments
    const scheduled = new Set(dueDatesUpTo(sip.investmentDate, sip.frequency, asOf));
    const seenDue = new Set<string>();
    for (const i of instalments) {
      if (i.sipId !== sip.id) at(`instalment ${i.id} references another SIP`);
      if (!scheduled.has(i.dueDate)) at(`instalment ${i.id} is not on the ${sip.frequency} schedule`);
      if (seenDue.has(i.dueDate)) at(`duplicate instalment for ${i.dueDate}`);
      seenDue.add(i.dueDate);
      if (i.dueDate > asOf) at(`instalment ${i.id} is due after asOf`);
      if (i.amountPaise !== sip.instalmentAmountPaise) at(`instalment ${i.id} amount differs from the SIP amount`);
      if (i.status === 'SUCCESS') {
        if (i.settledOn === null) at(`instalment ${i.id} succeeded but has no settledOn`);
        else if (i.settledOn < i.dueDate || i.settledOn > asOf) at(`instalment ${i.id} settledOn is outside [due, asOf]`);
        if ((i.navE4 === null) !== (i.unitsE4 === null)) at(`instalment ${i.id} has NAV without units or the reverse`);
        if (i.navE4 !== null && i.unitsE4 !== null && Math.abs(i.unitsE4 - Math.round((i.amountPaise * 1_000_000) / i.navE4)) > 1) at(`instalment ${i.id} units do not equal amount / NAV`);
      } else if (i.settledOn !== null || i.navE4 !== null || i.unitsE4 !== null) {
        at(`non-successful instalment ${i.id} must not carry settledOn, NAV or units`);
      }
    }
    if (sip.cancelledOn && instalments.some((i) => i.dueDate >= sip.cancelledOn!)) at('instalment recorded on or after the cancellation date');

    // declared totals
    const paid = instalments.filter((i) => i.status === 'SUCCESS');
    const invested = paid.reduce((a, i) => a + i.amountPaise, 0);
    if (sip.declared.totalInvestedPaise !== invested) at(`declared total invested (${sip.declared.totalInvestedPaise}) != sum of successful instalments (${invested})`);
    const last = paid.length ? paid.map((i) => i.settledOn!).sort().at(-1)! : null;
    if (sip.declared.lastSuccessfulInstalmentDate !== last) at('declared last successful instalment date is inconsistent');

    // valuation
    if (valuation) {
      if (valuation.sipId !== sip.id) at('valuation references another SIP');
      if (valuation.asOfDate !== asOf) at('valuation asOfDate differs from persona asOf');
      const allUnits = paid.length > 0 && paid.every((i) => i.unitsE4 !== null);
      if (valuation.currentNavE4 !== null && valuation.currentValuePaise !== null && allUnits) {
        const units = paid.reduce((a, i) => a + i.unitsE4!, 0);
        const implied = Math.round((units * valuation.currentNavE4) / 1_000_000);
        if (Math.abs(implied - valuation.currentValuePaise) > 100) at(`valuation (${valuation.currentValuePaise}) does not match units x NAV (${implied}) within 1 rupee`);
      }
      if (valuation.currentValuePaise !== null && valuation.currentNavE4 === null) at('a value is declared without a NAV');
      const dates = valuation.navHistory.map((h) => h.date);
      if (JSON.stringify(dates) !== JSON.stringify([...dates].sort())) at('NAV history is not in date order');
      if (dates.some((d) => d > asOf)) at('NAV history contains a future date');
    }

    // failures
    for (const f of failures) {
      const inst = instalments.find((x) => x.id === f.instalmentId);
      if (!inst) { at(`failure ${f.id} references a missing instalment`); continue; }
      if (f.occurredOn !== inst.dueDate) at(`failure ${f.id} occurredOn differs from the instalment due date`);
      if (f.amountPaise !== inst.amountPaise) at(`failure ${f.id} amount differs from the instalment`);
      if (f.resolved) {
        if (f.resolvedOn === null) at(`failure ${f.id} is resolved without a date`);
        if (inst.status !== 'SUCCESS' || inst.settledOn !== f.resolvedOn) at(`resolved failure ${f.id} must match a SUCCESS instalment settled on the resolution date`);
      } else {
        if (f.resolvedOn !== null) at(`unresolved failure ${f.id} has a resolution date`);
        if (inst.status !== 'FAILED') at(`unresolved failure ${f.id} must point to a FAILED instalment`);
      }
      if (f.retry.verified && (f.retry.nextRetryDate === null || f.retry.status !== 'SCHEDULED')) at(`failure ${f.id} claims a verified retry without a scheduled date`);
      if (f.retry.nextRetryDate !== null && f.retry.nextRetryDate < f.occurredOn) at(`failure ${f.id} retry date precedes the failure`);
    }
    for (const i of instalments.filter((x) => x.status === 'FAILED')) {
      if (!failures.some((f) => f.instalmentId === i.id && !f.resolved)) at(`FAILED instalment ${i.id} has no failure record`);
    }

    // pause and reminder
    if (pause) {
      if (pause.sipId !== sip.id) at('pause references another SIP');
      if (pause.pauseEnd !== null && pause.pauseEnd < pause.pauseStart) at('pause ends before it starts');
      if (pause.state === 'SCHEDULED' && pause.pauseStart <= asOf) at('a SCHEDULED pause must start after asOf');
      if (pause.state === 'ACTIVE' && pause.pauseStart > asOf) at('an ACTIVE pause cannot start after asOf');
      const horizon = pause.pauseEnd ?? asOf;
      const expectedSkips = dueDatesUpTo(sip.investmentDate, sip.frequency, addDays(horizon, 0)).filter((d) => d >= pause.pauseStart && d <= horizon);
      if (JSON.stringify(expectedSkips) !== JSON.stringify(pause.skippedDueDates)) at('skippedDueDates do not match the scheduled due dates inside the pause window');
      for (const i of instalments) {
        const inWindow = i.dueDate >= pause.pauseStart && (pause.pauseEnd === null || i.dueDate <= pause.pauseEnd);
        if (inWindow && i.status !== 'SKIPPED') at(`instalment ${i.id} falls inside the pause window but is ${i.status}`);
        if (!inWindow && i.status === 'SKIPPED') at(`instalment ${i.id} is SKIPPED outside any pause window`);
      }
    } else if (instalments.some((i) => i.status === 'SKIPPED')) {
      at('SKIPPED instalments exist without a pause');
    }
    if (reminder) {
      if (!pause) at('a restart reminder exists without a pause');
      else if (reminder.pauseId !== pause.id) at('reminder references another pause');
      if (!reminder.optedIn && (reminder.status !== 'NONE' || reminder.remindOn !== null)) at('a reminder without opt-in must have status NONE and no date');
      if (reminder.optedIn && reminder.remindOn === null) at('an opted-in reminder needs a date');
      if (reminder.status === 'SCHEDULED' && (reminder.remindOn === null || reminder.remindOn < asOf)) at('a SCHEDULED reminder must be dated today or later');
      if (pause && pause.pauseEnd !== null && reminder.remindOn !== null && reminder.remindOn > pause.pauseEnd) at('reminder is after the pause ends');
    }

    // expectations: status, return band, declared anomalies
    const exp = p.expectations[sip.id];
    if (exp) {
      const status = deriveSipStatus(sip, failures, pause, asOf);
      if (status !== exp.status) at(`derived status ${status} != declared ${exp.status}`);
      const band = returnBandSanity(invested, valuation?.currentValuePaise ?? null);
      if (band !== exp.returnBand) at(`return band ${band} != declared ${exp.returnBand}`);
      const found = detectAnomalies(b, asOf);
      if (JSON.stringify(found) !== JSON.stringify([...exp.anomalies].sort())) at(`anomalies ${JSON.stringify(found)} != declared ${JSON.stringify([...exp.anomalies].sort())}`);
    }
  }
  return issues;
}

/** Checks a whole fixture set: each persona plus uniqueness of every id and persona key across personas. */
export function validateAll(personas: ReadonlyArray<unknown>): string[] {
  const issues = personas.flatMap((p) => validatePersona(p));
  const keys: string[] = [];
  const ids: string[] = [];
  for (const raw of personas) {
    const p = raw as { key?: string; sips?: SipBundle[] };
    if (p.key) keys.push(p.key);
    for (const b of p.sips ?? []) {
      ids.push(b.sip.id, ...b.instalments.map((i) => i.id), ...b.failures.map((f) => f.id));
      if (b.pause) ids.push(b.pause.id);
      if (b.reminder) ids.push(b.reminder.id);
    }
  }
  const dup = (a: string[]) => a.filter((x, i) => a.indexOf(x) !== i);
  if (dup(keys).length) issues.push(`duplicate persona keys: ${[...new Set(dup(keys))].join(', ')}`);
  if (dup(ids).length) issues.push(`duplicate record ids: ${[...new Set(dup(ids))].join(', ')}`);
  return issues;
}
