/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the current date as YYYY-MM-DD in LOCAL timezone.
 * Avoids the UTC shift bug from toISOString().
 */
export function todayISO(): string {
  return toLocalISODate(new Date());
}

/**
 * Converts a Date object to YYYY-MM-DD string in LOCAL timezone.
 */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD date string as a local date.
 * Uses noon to avoid DST and timezone boundary issues.
 */
export function parseLocalISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Shifts a YYYY-MM-DD date string by the provided number of days in local time.
 */
export function shiftLocalISODate(dateStr: string, days: number): string {
  const date = parseLocalISODate(dateStr);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

/**
 * Formats a YYYY-MM-DD date string into a localized display format.
 * Parses manually to avoid timezone shift when constructing Date from string.
 */
export function formatDate(dateStr: string, locale: string = 'en'): string {
  const date = parseLocalISODate(dateStr);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
