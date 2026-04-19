/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vault } from '../../domain/entities';
import { getReflejoState, ReflejoState } from '../../domain/services/ReflejoEngine';
import { calculateICC } from '../../domain/services/ICCCalculator';

/**
 * computeReflejoState:
 * Orchestrates the gathering of clinical data from the Vault to feed the ReflejoEngine.
 */
export function computeReflejoState(vault: Vault): ReflejoState {
  const journal = vault.journal || [];
  const today = new Date().toISOString().split('T')[0];
  
  // Average ICC from last 10 L3 entries
  const l3Entries = journal.filter(e => e.level === 3 && e.originalIntensity !== undefined && e.finalCredibility !== undefined);
  const recentL3 = l3Entries.slice(0, 10);
  const avgICC = recentL3.length > 0
    ? recentL3.reduce((sum, e) => sum + calculateICC(e.originalIntensity!, e.finalCredibility!).value, 0) / recentL3.length
    : null;
  
  // Rumination detection: same distortion present in 3 or more of the last 5 entries
  const recentEntries = journal.slice(0, 5);
  const distortionCount: Record<string, number> = {};
  recentEntries.forEach(e => {
    (e.distortions || []).forEach(d => {
      distortionCount[d] = (distortionCount[d] || 0) + 1;
    });
  });
  const isRumination = Object.values(distortionCount).some(count => count >= 3);
  
  // Daily activity metrics
  const todayEntries = journal.filter(e => e.date === today).length;
  
  // Ghost Protocol: Days since last entry
  let daysSinceLastEntry = 0;
  if (journal.length > 0) {
    const lastDate = new Date(journal[0].date + 'T12:00:00');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    daysSinceLastEntry = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Immediate state: intensity of the most recent session
  const lastEntry = journal[0];
  const currentIntensity = lastEntry?.intensity ?? null;
  
  return getReflejoState({
    avgICC,
    currentIntensity,
    isCrisis: false, 
    isRumination,
    totalEntries: journal.length,
    todayEntries,
    daysSinceLastEntry
  });
}
