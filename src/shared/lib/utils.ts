/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Triggers a simple haptic feedback (vibration) if supported.
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [40],
      success: [10, 50, 10],
      error: [50, 50, 50],
    };
    window.navigator.vibrate(patterns[style]);
  }
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

/**
 * Calculates the Cognitive Change Index (ICC).
 * Simplistic version: difference in intensities.
 */
export function calculateICC(pre: number, post: number) {
  return pre - post;
}

/**
 * Normalizes text for search (lowercase and diacritic removal).
 */
export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Escapes HTML characters.
 */
export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
