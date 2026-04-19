/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vault, UserStats } from '../../domain/entities';
import { XP_REWARDS, getLevelFromXP } from '../../domain/constants/Gamification';

export interface XPEvent {
  type: keyof typeof XP_REWARDS;
  amount: number;
  didLevelUp: boolean;
  newLevel?: number;
}

/**
 * Awards experience points for a specific activity and checks for level-up.
 * Returns the updated vault and the event details.
 */
export function awardXP(vault: Vault, eventType: keyof typeof XP_REWARDS): { vault: Vault; event: XPEvent } {
  const amount = XP_REWARDS[eventType];
  const currentTotalExp = vault.stats?.totalExp || 0;
  const oldLevel = getLevelFromXP(currentTotalExp);
  
  const newTotalExp = currentTotalExp + amount;
  const newLevel = getLevelFromXP(newTotalExp);
  const didLevelUp = newLevel > oldLevel;

  const newStats: UserStats = {
    ...vault.stats,
    totalExp: newTotalExp,
    level: newLevel,
    discipline: {
      exp: (vault.stats?.discipline?.exp || 0) + amount,
      level: newLevel
    },
    consistency: {
      ...vault.stats?.consistency || { exp: 0, level: 1 }
    }
  };

  return {
    vault: { ...vault, stats: newStats },
    event: { type: eventType, amount, didLevelUp, newLevel: didLevelUp ? newLevel : undefined }
  };
}

/**
 * Checks for streak-based XP rewards.
 * Should be called when a streak is recalculated and increases.
 */
export function checkStreakBonuses(vault: Vault, streak: number): { vault: Vault; events: XPEvent[] } {
  let currentVault = vault;
  const events: XPEvent[] = [];

  if (streak === 7) {
    const { vault: v, event } = awardXP(currentVault, 'STREAK_BONUS_7');
    currentVault = v;
    events.push(event);
  } else if (streak === 30) {
    const { vault: v, event } = awardXP(currentVault, 'STREAK_BONUS_30');
    currentVault = v;
    events.push(event);
  }

  return { vault: currentVault, events };
}
