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
 * Format percentage safely with exactly 2 decimal places.
 * Handles both float percentages (e.g. -21.3464 -> "−21.35%", -63.3927 -> "−63.39%")
 * and basis points (e.g. -2135 -> "−21.35%").
 */
export function formatPercent(val: number | null | undefined, showPlus = true): string {
  if (val == null || !Number.isFinite(val)) return '—';
  let pct = val;
  if (Math.abs(val) > 100 && Number.isInteger(val)) {
    pct = val / 100;
  }
  const sign = pct > 0 && showPlus ? '+' : pct < 0 ? '−' : '';
  const abs = Math.abs(pct);
  return `${sign}${abs.toFixed(2)}%`;
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

