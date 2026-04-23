/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HapticStyle, triggerPlatformHaptic } from '../../infrastructure/platform/RuntimePlatform';

/**
 * Triggers a simple haptic feedback (vibration) if supported.
 */
export function triggerHaptic(style: HapticStyle = 'light') {
  void triggerPlatformHaptic(style);
}
