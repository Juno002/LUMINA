/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ICCResult {
  value: number;       // 0.0 to 1.0
  label: 'excellent' | 'moderate' | 'needs_work';
  message: string;
}

/**
 * Calculates the Cognitive Change Index (ICC).
 * ICC = (Original Intensity - Final Credibility) / 10
 */
export function calculateICC(originalIntensity: number, finalCredibility: number): ICCResult {
  // Normalize intensity to 0-10 if not already, then calculate shift
  const value = Math.max(0, Math.min(1, (originalIntensity - finalCredibility) / 10));
  
  if (value > 0.60) {
    return { value, label: 'excellent', message: 'Excellent cognitive shift detected.' };
  }
  if (value >= 0.35) {
    return { value, label: 'moderate', message: 'Moderate restructuring. Try deeper evidence.' };
  }
  return { value, label: 'needs_work', message: 'The belief is still strong. Gather more counter-evidence.' };
}
