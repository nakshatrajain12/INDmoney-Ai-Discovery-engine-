import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/**
 * Format integer paise to INR format.
 * If hide is true, returns "••••••".
 */
export function formatRupees(paise: number, hide = false, showFraction = false): string {
  if (hide) return '••••••';
  const neg = paise < 0;
  const abs = BigInt(Math.abs(paise));
  const rs = (abs / 100n).toString();
  const frac = (abs % 100n).toString().padStart(2, '0');
  const formatted = `₹${groupIndian(rs)}${showFraction ? `.${frac}` : ''}`;
  return neg ? `-${formatted}` : formatted;
}

/**
 * Format integer paise with explicit sign (+ / -).
 */
export function formatSignedRupees(paise: number, hide = false, showFraction = false): string {
  if (hide) return '••••••';
  if (paise === 0) return formatRupees(0, false, showFraction);
  const sign = paise > 0 ? '+' : '-';
  const abs = BigInt(Math.abs(paise));
  const rs = (abs / 100n).toString();
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${sign}₹${groupIndian(rs)}${showFraction ? `.${frac}` : ''}`;
}

/**
 * Format percentage scaled by 100 (hundredths of a percent, e.g. 430 -> "4.30%").
 */
export function formatPercent(scaledPct: number | null | undefined, showPlus = true): string {
  if (scaledPct == null) return '—';
  const neg = scaledPct < 0;
  const abs = Math.abs(scaledPct);
  const whole = Math.floor(abs / 100);
  const frac = (abs % 100).toString().padStart(2, '0');
  const sign = neg ? '−' : showPlus && scaledPct > 0 ? '+' : '';
  return `${sign}${whole}.${frac}%`;
}

/**
 * Format float percentage (e.g. -2.45 -> "-2.45%").
 */
export function formatFloatPercent(val: number | null | undefined, showPlus = true): string {
  if (val == null || !Number.isFinite(val)) return '—';
  const sign = val > 0 && showPlus ? '+' : val < 0 ? '−' : '';
  return `${sign}${Math.abs(val).toFixed(2)}%`;
}

/**
 * Format ISO string (YYYY-MM-DD) to "15 Nov 2026".
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return `${d} ${MONTHS[m] ?? ''} ${y}`;
}

/**
 * Format ISO string (YYYY-MM-DD) to "15 Nov".
 */
export function formatShortDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return `${d} ${MONTHS[m] ?? ''}`;
}

