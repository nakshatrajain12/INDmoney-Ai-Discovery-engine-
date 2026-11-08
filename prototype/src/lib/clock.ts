import { addDays } from './dates';

/** Demo clock: lets the prototype move "today" without editing fixtures (docs/architecture.md section 4). */
const IST_OFFSET_MIN = 330;
let override: string | null = null;

export function setDemoToday(iso: string | null): void {
  if (iso !== null && !/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('Demo date must be YYYY-MM-DD');
  override = iso;
}

export function resetDemoClock(): void {
  override = null;
}

export function getDemoOverride(): string | null {
  return override;
}

/** Advance current effective date by N days and set as demo override. */
export function advanceDays(days: number): string {
  const current = today();
  const next = addDays(current, days);
  setDemoToday(next);
  return next;
}

/** Rewind current effective date by N days and set as demo override. */
export function rewindDays(days: number): string {
  return advanceDays(-days);
}

/** Today's date as YYYY-MM-DD in Asia/Kolkata, or the demo override. */
export function today(now: Date = new Date()): string {
  if (override) return override;
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  return ist.toISOString().slice(0, 10);
}
