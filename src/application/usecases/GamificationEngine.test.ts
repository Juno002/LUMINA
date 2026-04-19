import { describe, it, expect } from 'vitest';
import { awardXP } from './GamificationEngine';
import { Vault } from '../../domain/entities';

describe('GamificationEngine', () => {
  const mockVault: Vault = {
    profile: { name: 'User', initialized: true },
    createdAt: '2026-01-01',
    journal: [],
    exposure: { hierarchy: [], logs: [] },
    activations: [],
    goals: [],
    sleep: [],
    wellness: { gratitudeEntries: [], moodEntries: [] },
    habits: [],
    habitLogs: [],
    stats: {
      discipline: { exp: 0, level: 1 },
      consistency: { exp: 0, level: 1 },
      totalExp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0
    },
    closedDays: []
  };

  it('awards XP correctly', () => {
    const { vault, event } = awardXP(mockVault, 'HABIT_COMPLETE');
    expect(vault.stats.totalExp).toBe(10);
    expect(event.amount).toBe(10);
    expect(event.didLevelUp).toBe(false);
  });

  it('detects level up correctly', () => {
    // Current XP: 95. Award 10 XP. Threshold for Level 2 is 100.
    const customVault: Vault = {
      ...mockVault,
      stats: { ...mockVault.stats, totalExp: 95 }
    };

    const { vault, event } = awardXP(customVault, 'HABIT_COMPLETE');
    expect(vault.stats.totalExp).toBe(105);
    expect(event.didLevelUp).toBe(true);
    expect(event.newLevel).toBe(2);
    expect(vault.stats.level).toBe(2);
  });
});
