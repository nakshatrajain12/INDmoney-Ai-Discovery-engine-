import { describe, it, expect, afterEach } from 'vitest';
import { today, setDemoToday, advanceDays, rewindDays, resetDemoClock } from '@/lib/clock';

afterEach(() => resetDemoClock());

describe('clock', () => {
  it('returns the IST date: 20:00 UTC is already the next day in India', () => {
    expect(today(new Date('2026-11-07T20:00:00Z'))).toBe('2026-11-08');
    expect(today(new Date('2026-11-08T18:29:00Z'))).toBe('2026-11-08');
    expect(today(new Date('2026-11-08T18:31:00Z'))).toBe('2026-11-09');
  });

  it('honours the demo override and validates its format', () => {
    setDemoToday('2027-01-12');
    expect(today(new Date('2026-11-08T00:00:00Z'))).toBe('2027-01-12');
    expect(() => setDemoToday('12/01/2027')).toThrow();
  });

  it('supports time-travel advancing and rewinding', () => {
    setDemoToday('2026-11-08');
    expect(advanceDays(5)).toBe('2026-11-13');
    expect(today()).toBe('2026-11-13');
    expect(rewindDays(3)).toBe('2026-11-10');
    expect(today()).toBe('2026-11-10');
    resetDemoClock();
  });
});
