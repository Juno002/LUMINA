/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats a date string into a localized format.
 */
export function formatDate(dateStr: string, locale: string = 'en') {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
