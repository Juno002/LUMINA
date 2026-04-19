/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const XP_REWARDS = {
  HABIT_COMPLETE: 10,
  ALL_HABITS_DAILY: 50,      // Bonus for completing all habits in a day
  JOURNAL_ENTRY: 15,
  JOURNAL_L3: 30,            // Extra for L3 restructuring
  GOAL_MILESTONE: 25,
  STREAK_BONUS_7: 100,       // 7-day streak
  STREAK_BONUS_30: 500,      // 30-day streak
  EXPOSURE_SESSION: 20,
  RESILIENCE_RECOVERY: 40,   // Bonus for resuming after a gap
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000
]; // Level N requires LEVEL_THRESHOLDS[N] total XP

/**
 * Calculates user level based on total experience points.
 */
export function getLevelFromXP(totalExp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * Returns the current progress toward the next level.
 */
export function getXPForNextLevel(totalExp: number): { current: number; needed: number; progress: number } {
  const level = getLevelFromXP(totalExp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1000;
  
  const current = totalExp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  
  return { 
    current, 
    needed, 
    progress: Math.min(1, Math.max(0, current / needed)) 
  };
}
