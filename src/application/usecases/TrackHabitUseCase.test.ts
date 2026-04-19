import { describe, it, expect } from 'vitest';
import { toggleHabitLog, calculateStreak, getHabitCompletionForDate, updateHabitValue, getWeeklyHistory } from './TrackHabitUseCase';
import { Vault, Habit, HabitLog } from '../../domain/entities';

describe('TrackHabitUseCase', () => {
  const mockHabit: Habit = {
    id: 'h1',
    name: 'Test',
    type: 'yesno',
    frequency: 'daily',
    isActive: true,
    createdAt: '2026-01-01'
  };

  const mockVault: Vault = {
    profile: { name: 'User', initialized: true },
    createdAt: '2026-01-01',
    journal: [],
    exposure: { hierarchy: [], logs: [] },
    activations: [],
    goals: [],
    sleep: [],
    wellness: { gratitudeEntries: [], moodEntries: [] },
    habits: [mockHabit],
    habitLogs: [],
    stats: {
      discipline: { exp: 0, level: 1 },
      consistency: { exp: 0, level: 1 },
      totalExp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0
    }
  };

  it('toggles habit log (creates new)', () => {
    const today = '2026-04-18';
    const updated = toggleHabitLog(mockVault, 'h1', today);
    expect(updated.habitLogs.length).toBe(1);
    expect(updated.habitLogs[0].completed).toBe(true);
  });

  it('toggles habit log (flips existing)', () => {
    const today = '2026-04-18';
    const v1 = toggleHabitLog(mockVault, 'h1', today);
    const v2 = toggleHabitLog(v1, 'h1', today);
    expect(v2.habitLogs.length).toBe(1);
    expect(v2.habitLogs[0].completed).toBe(false);
  });

  it('calculates streaks correctly', () => {
    const habits = [mockHabit];
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h1', date: '2026-04-18', completed: true, createdAt: '' },
      { id: '2', habitId: 'h1', date: '2026-04-17', completed: true, createdAt: '' },
      { id: '3', habitId: 'h1', date: '2026-04-16', completed: false, createdAt: '' },
    ];
    
    expect(calculateStreak(logs, habits, '2026-04-18')).toBe(2);
    expect(calculateStreak(logs, habits, '2026-04-17')).toBe(1);
    expect(calculateStreak(logs, habits, '2026-04-15')).toBe(0);
  });

  it('calculates daily completion percentage', () => {
    const vault: Vault = {
      ...mockVault,
      habits: [
        { ...mockHabit, id: 'h1' },
        { ...mockHabit, id: 'h2' }
      ],
      habitLogs: [
        { id: 'l1', habitId: 'h1', date: '2026-04-18', completed: true, createdAt: '' }
      ]
    };

    const stats = getHabitCompletionForDate(vault, '2026-04-18');
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.percentage).toBe(50);
  });

  it('updates habit value and checks target', () => {
    const numericHabit: Habit = { ...mockHabit, id: 'h2', type: 'numeric', targetValue: 10 };
    const vault: Vault = { ...mockVault, habits: [numericHabit] };

    const v1 = updateHabitValue(vault, 'h2', '2026-04-18', 5);
    expect(v1.habitLogs[0].completed).toBe(false);
    expect(v1.habitLogs[0].value).toBe(5);

    const v2 = updateHabitValue(v1, 'h2', '2026-04-18', 10);
    expect(v2.habitLogs[0].completed).toBe(true);
  });

  it('gets weekly history', () => {
    const history = getWeeklyHistory(mockVault, '2026-04-18');
    expect(history.length).toBe(7);
    expect(history[6].date).toBe('2026-04-18');
    expect(history[0].date).toBe('2026-04-12');
  });
});
