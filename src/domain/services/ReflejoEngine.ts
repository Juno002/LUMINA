/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReflejoMode = 'mentor' | 'observer' | 'anchor';

export interface ReflejoState {
  mode: ReflejoMode;
  messageKey: string;    // Translation key for the message
  color: string;         // Tailwind color class
  animation: 'float' | 'neutral' | 'pulse-slow';
}

/**
 * ReflejoEngine:
 * Pure logic to determine the state of the Lambda (λ) avatar based on clinical metrics.
 * Lambda is a reflection of data, not an AI personality.
 * Returns translation keys instead of literal strings for i18n support.
 */
export function getReflejoState(params: {
  avgICC: number | null;           // Average ICC from recent L3 entries
  currentIntensity: number | null; // Current/last entry intensity
  isCrisis: boolean;               // High-risk language detected
  isRumination: boolean;           // Same distortion 3+ times in recent entries
  totalEntries: number;
  todayEntries: number;
  daysSinceLastEntry: number;      // Protocolo de Ausencia (Ghost)
}): ReflejoState {
  
  // Priority 0: GHOST PROTOCOL (Long absence)
  if (params.daysSinceLastEntry >= 4) {
    return {
      mode: 'observer',
      messageKey: 'lambda.ghost_nudge',
      color: 'text-slate-400',
      animation: 'neutral'
    };
  }

  // Priority 1: ANCHOR (crisis, high intensity, low ICC, rumination)
  if (params.isCrisis || (params.currentIntensity && params.currentIntensity >= 8)) {
    return {
      mode: 'anchor',
      messageKey: 'lambda.anchor_crisis',
      color: 'text-red-500',
      animation: 'pulse-slow'
    };
  }

  if (params.isRumination) {
    return {
      mode: 'anchor',
      messageKey: 'lambda.anchor_rumination',
      color: 'text-red-500',
      animation: 'pulse-slow'
    };
  }

  if (params.avgICC !== null && params.avgICC < 0.35) {
    return {
      mode: 'anchor',
      messageKey: 'lambda.anchor_low_icc',
      color: 'text-red-500',
      animation: 'pulse-slow'
    };
  }

  // Priority 2: MENTOR (high ICC, consistency)
  if (params.avgICC !== null && params.avgICC > 0.60) {
    return {
      mode: 'mentor',
      messageKey: 'lambda.mentor_high_icc',
      color: 'text-amber-500',
      animation: 'float'
    };
  }

  if (params.todayEntries === 1 && params.totalEntries > 1) {
    return {
      mode: 'mentor',
      messageKey: 'lambda.mentor_consistency',
      color: 'text-amber-500',
      animation: 'float'
    };
  }

  // Moderate intensity (Effort/Observer mode)
  if (params.currentIntensity && params.currentIntensity >= 4) {
    return {
      mode: 'observer',
      messageKey: 'lambda.observer_moderate',
      color: 'text-slate-400',
      animation: 'neutral'
    };
  }

  // Priority 3: OBSERVER (default)
  return {
    mode: 'observer',
    messageKey: 'lambda.observer_default',
    color: 'text-slate-400',
    animation: 'neutral'
  };
}

