/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
