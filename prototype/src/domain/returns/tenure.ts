import type { Instalment } from '@/contracts/domain';
import { diffDays, monthsBetween, type ISODate } from '@/lib/dates';
import type { BandsConfig } from './config';

export type Stage = 'M1' | 'M1_3' | 'M3_6' | 'M6_12' | 'OVER_12';

/**
 * Successful instalments that had actually happened by `asOf`. Failed, pending and skipped instalments are never
 * included: a failed debit must never enter "invested".
 */
export function settledInstalments(instalments: readonly Instalment[], asOf: ISODate): Instalment[] {
  return instalments.filter((i) => i.status === 'SUCCESS' && i.settledOn !== null && i.settledOn <= asOf);
}

export function firstSuccessfulDate(settled: readonly Instalment[]): ISODate | null {
  let min: ISODate | null = null;
  for (const i of settled) if (i.settledOn !== null && (min === null || i.settledOn < min)) min = i.settledOn;
  return min;
}

export interface InstalmentCounts {
  paid: number;
  failed: number;
  pending: number;
  skipped: number;
}

export function countInstalments(instalments: readonly Instalment[], asOf: ISODate): InstalmentCounts {
  const c: InstalmentCounts = { paid: settledInstalments(instalments, asOf).length, failed: 0, pending: 0, skipped: 0 };
  for (const i of instalments) {
    if (i.dueDate > asOf) continue;
    if (i.status === 'FAILED') c.failed++;
    else if (i.status === 'PENDING') c.pending++;
    else if (i.status === 'SKIPPED') c.skipped++;
  }
  return c;
}

/** Stage from whole calendar months. Lower bounds are inclusive: exactly one month after d0 is M1_3. */
export function stageFor(months: number, cfg: BandsConfig): Stage {
  const b = cfg.thresholds.stageLowerBoundMonths;
  if (months >= b.OVER_12.value) return 'OVER_12';
  if (months >= b.M6_12.value) return 'M6_12';
  if (months >= b.M3_6.value) return 'M3_6';
  if (months >= b.M1_3.value) return 'M1_3';
  return 'M1';
}

export interface Tenure {
  firstSuccessfulDate: ISODate | null;
  months: number;
  days: number;
  stage: Stage;
}

/** Tenure runs from the first successful instalment to the as-of date. No successful instalment means tenure 0. */
export function computeTenure(first: ISODate | null, asOf: ISODate, cfg: BandsConfig): Tenure {
  if (first === null || first > asOf) return { firstSuccessfulDate: first, months: 0, days: 0, stage: 'M1' };
  const months = monthsBetween(first, asOf);
  return { firstSuccessfulDate: first, months, days: diffDays(first, asOf), stage: stageFor(months, cfg) };
}
