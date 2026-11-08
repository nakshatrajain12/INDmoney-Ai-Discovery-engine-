/**
 * Calendar-date helpers. Dates are ISO strings (YYYY-MM-DD) with no time zone; all arithmetic is done in UTC
 * so results never depend on the machine's zone. Used by fixtures, validators and (from Phase 2) the returns engine.
 */
export type ISODate = string;

const MS = 86_400_000;
const RX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for real calendar dates (rejects 2026-02-30 and malformed strings). */
export function isValidISODate(s: unknown): s is ISODate {
  if (typeof s !== 'string') return false;
  const m = RX.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

function assertDate(s: string): void {
  if (!isValidISODate(s)) throw new RangeError(`Invalid ISO date: ${String(s)}`);
}

export function toMs(s: ISODate): number {
  assertDate(s);
  const m = RX.exec(s)!;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function fromMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(s: ISODate, n: number): ISODate {
  return fromMs(toMs(s) + n * MS);
}

/** Adds calendar months and clamps the day (31 Jan + 1 month = 28 or 29 Feb). */
export function addMonths(s: ISODate, n: number): ISODate {
  const d = new Date(toMs(s));
  const day = d.getUTCDate();
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + n;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return fromMs(Date.UTC(y, m, Math.min(day, dim)));
}

/** Whole days from a to b (negative if b is before a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toMs(b) - toMs(a)) / MS);
}

/** Whole calendar months from a to b (a plus N months is on or before b). Returns 0 if b is before a. */
export function monthsBetween(a: ISODate, b: ISODate): number {
  if (toMs(b) < toMs(a)) return 0;
  let n = 0;
  while (addMonths(a, n + 1) <= b) n++;
  return n;
}

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

/** The nth due date (0-based) of a schedule anchored at `first`. */
export function nthDueDate(first: ISODate, frequency: Frequency, n: number): ISODate {
  switch (frequency) {
    case 'DAILY':
      return addDays(first, n);
    case 'WEEKLY':
      return addDays(first, 7 * n);
    case 'MONTHLY':
      return addMonths(first, n);
    case 'QUARTERLY':
      return addMonths(first, 3 * n);
  }
}

/** All scheduled due dates from `first` up to and including `asOf`. */
export function dueDatesUpTo(first: ISODate, frequency: Frequency, asOf: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let n = 0; n < 5000; n++) {
    const d = nthDueDate(first, frequency, n);
    if (d > asOf) break;
    out.push(d);
  }
  return out;
}
