import { describe, it, expect } from 'vitest';
import { addDays, addMonths, diffDays, dueDatesUpTo, isValidISODate, monthsBetween, nthDueDate, toMs } from '@/lib/dates';

describe('isValidISODate', () => {
  it.each(['2026-11-08', '2024-02-29', '2000-02-29', '2026-12-31'])('accepts %s', (d) => expect(isValidISODate(d)).toBe(true));
  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-31', '26-11-08', '2026/11/08', '2026-1-8', '', 'tomorrow', ' 2026-11-08'])(
    'rejects %j',
    (d) => expect(isValidISODate(d)).toBe(false)
  );
  it('rejects non-strings', () => {
    expect(isValidISODate(20261108)).toBe(false);
    expect(isValidISODate(null)).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
  });
  it('throws a clear error when an arithmetic helper gets an invalid date', () => {
    expect(() => toMs('2026-02-30')).toThrow(RangeError);
    expect(() => addDays('nope', 1)).toThrow(/Invalid ISO date/);
  });
});

describe('date arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-08', 1)).toBe('2026-11-09');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('adds months and clamps the day to the end of shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30');
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -2)).toBe('2025-11-15');
    expect(addMonths('2026-03-15', 12)).toBe('2027-03-15');
  });

  it('counts whole days, signed', () => {
    expect(diffDays('2026-11-08', '2026-11-08')).toBe(0);
    expect(diffDays('2026-06-15', '2026-11-08')).toBe(146);
    expect(diffDays('2026-11-08', '2026-06-15')).toBe(-146);
    expect(diffDays('2024-02-28', '2024-03-01')).toBe(2);
    expect(diffDays('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('counts whole calendar months (anchor plus N months must not pass the end date)', () => {
    expect(monthsBetween('2026-06-15', '2026-11-08')).toBe(4);
    expect(monthsBetween('2026-06-15', '2026-11-15')).toBe(5);
    expect(monthsBetween('2026-06-15', '2026-11-14')).toBe(4);
    expect(monthsBetween('2025-09-10', '2026-11-08')).toBe(13);
    expect(monthsBetween('2026-11-08', '2026-11-08')).toBe(0);
    expect(monthsBetween('2026-11-08', '2026-06-15')).toBe(0);
    expect(monthsBetween('2026-01-31', '2026-02-28')).toBe(1);
  });
});

describe('schedules', () => {
  it('generates monthly due dates up to and including asOf', () => {
    expect(dueDatesUpTo('2026-06-15', 'MONTHLY', '2026-11-08')).toEqual(['2026-06-15', '2026-07-15', '2026-08-15', '2026-09-15', '2026-10-15']);
    expect(dueDatesUpTo('2026-06-15', 'MONTHLY', '2026-11-15').at(-1)).toBe('2026-11-15');
  });

  it('handles weekly, daily and quarterly schedules', () => {
    expect(dueDatesUpTo('2026-10-19', 'WEEKLY', '2026-11-08')).toEqual(['2026-10-19', '2026-10-26', '2026-11-02']);
    expect(dueDatesUpTo('2026-11-04', 'DAILY', '2026-11-08')).toHaveLength(5);
    expect(dueDatesUpTo('2026-02-01', 'QUARTERLY', '2026-11-08')).toEqual(['2026-02-01', '2026-05-01', '2026-08-01', '2026-11-01']);
  });

  it('keeps the anchor day when a month is short (anchor 31st)', () => {
    expect(nthDueDate('2026-01-31', 'MONTHLY', 1)).toBe('2026-02-28');
    expect(nthDueDate('2026-01-31', 'MONTHLY', 2)).toBe('2026-03-31');
  });

  it('returns nothing when the first due date is after asOf', () => {
    expect(dueDatesUpTo('2026-12-01', 'MONTHLY', '2026-11-08')).toEqual([]);
  });
});
