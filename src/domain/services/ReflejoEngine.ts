/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReflejoMode = 'mentor' | 'observer' | 'anchor';

export interface ReflejoState {
  mode: ReflejoMode;
  message: string;
  color: string;        // Tailwind color class
  animation: 'float' | 'neutral' | 'pulse-slow';
}

/**
 * ReflejoEngine:
 * Pure logic to determine the state of the Lambda (λ) avatar based on clinical metrics.
 * Lambda is a reflection of data, not an AI personality.
 */
export function getReflejoState(params: {
  avgICC: number | null;           // Average ICC from recent L3 entries
  currentIntensity: number | null; // Current/last entry intensity
  isCrisis: boolean;               // High-risk language detected
  isRumination: boolean;           // Same distortion 3+ times in recent entries
  totalEntries: number;
  todayEntries: number;
}): ReflejoState {
  
  // Priority 1: ANCHOR (crisis, high intensity, low ICC, rumination)
  // Purpose: Grounding and pattern recognition when internal volatility is high.
  if (params.isCrisis || (params.currentIntensity && params.currentIntensity >= 8)) {
    return {
      mode: 'anchor',
      message: 'Breathe. This feeling is real, but it is temporary.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }

  if (params.isRumination) {
    return {
      mode: 'anchor',
      message: 'A pattern is forming. Consider a different angle.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }

  if (params.avgICC !== null && params.avgICC < 0.35) {
    return {
      mode: 'anchor',
      message: 'The belief persists. Try gathering more counter-evidence.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }

  // Priority 2: MENTOR (high ICC, consistency)
  // Purpose: Reinforce positive cognitive shifts and discipline.
  if (params.avgICC !== null && params.avgICC > 0.60) {
    return {
      mode: 'mentor',
      message: 'Your restructuring is working. The pattern is shifting.',
      color: 'text-emerald-400',
      animation: 'float'
    };
  }

  if (params.todayEntries === 1 && params.totalEntries > 1) {
    return {
      mode: 'mentor',
      message: 'Consistency is its own reward. Welcome back.',
      color: 'text-emerald-400',
      animation: 'float'
    };
  }

  // Priority 3: OBSERVER (default)
  // Purpose: Non-judgmental presence during stable states.
  return {
    mode: 'observer',
    message: 'Observing without judgment.',
    color: 'text-blue-400',
    animation: 'neutral'
  };
}
