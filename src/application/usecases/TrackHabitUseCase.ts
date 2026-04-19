/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vault, HabitLog, Habit } from '../../domain/entities';

/**
 * Toggles the completion status of a habit for a specific date.
 */
export function toggleHabitLog(vault: Vault, habitId: string, today: string): Vault {
  const existingLog = (vault.habitLogs || []).find(l => l.habitId === habitId && l.date === today);
  
  let newLogs: HabitLog[];
  if (existingLog) {
    newLogs = vault.habitLogs.map(l => 
      l.id === existingLog.id ? { ...l, completed: !l.completed } : l
    );
  } else {
    newLogs = [...(vault.habitLogs || []), {
      id: crypto.randomUUID(),
      habitId,
      date: today,
      completed: true,
      createdAt: new Date().toISOString()
    }];
  }
  
  return { ...vault, habitLogs: newLogs };
}

/**
 * Calculates the current streak of days where ALL active habits were completed.
 */
export function calculateStreak(habitLogs: HabitLog[], habits: Habit[], today: string): number {
  const activeHabits = (habits || []).filter(h => h.isActive);
  if (activeHabits.length === 0) return 0;
  
  const logs = habitLogs || [];
  let streak = 0;
  let currentDate = today;
  
  while (true) {
    const allCompleted = activeHabits.every(h =>
      logs.some(l => l.habitId === h.id && l.date === currentDate && l.completed)
    );
    
    if (!allCompleted) break;
    
    streak++;
    
    // Get previous day safely
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    currentDate = d.toISOString().split('T')[0];
    
    if (streak > 365) break; 
  }
  
  return streak;
}

/**
 * Returns completion stats for a specific date.
 */
export function getHabitCompletionForDate(vault: Vault, date: string): {
  total: number;
  completed: number;
  percentage: number;
} {
  const activeHabits = (vault.habits || []).filter(h => h.isActive);
  const logsForDate = (vault.habitLogs || []).filter(l => l.date === date && l.completed);
  const completedCount = activeHabits.filter(h => logsForDate.some(l => l.habitId === h.id)).length;
  
  return {
    total: activeHabits.length,
    completed: completedCount,
    percentage: activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0
  };
}

/**
 * Updates a specific numeric/timer value for a habit.
 */
export function updateHabitValue(vault: Vault, habitId: string, date: string, value: number): Vault {
  const habit = (vault.habits || []).find(h => h.id === habitId);
  if (!habit) return vault;

  const existingLog = (vault.habitLogs || []).find(l => l.habitId === habitId && l.date === date);
  
  // If habit has a target, mark as completed only if value >= target
  const isCompleted = habit.targetValue !== undefined ? value >= habit.targetValue : true;

  let newLogs: HabitLog[];
  if (existingLog) {
    newLogs = vault.habitLogs.map(l => 
      l.id === existingLog.id ? { ...l, value, completed: isCompleted } : l
    );
  } else {
    newLogs = [...(vault.habitLogs || []), {
      id: crypto.randomUUID(),
      habitId,
      date,
      value,
      completed: isCompleted,
      createdAt: new Date().toISOString()
    }];
  }

  return { ...vault, habitLogs: newLogs };
}

/**
 * Returns completion percentage for the last 7 days.
 */
export function getWeeklyHistory(vault: Vault, today: string): { date: string; percentage: number }[] {
  const history = [];
  let currentDate = today;

  for (let i = 0; i < 7; i++) {
    const stats = getHabitCompletionForDate(vault, currentDate);
    history.push({
      date: currentDate,
      percentage: stats.percentage
    });

    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    currentDate = d.toISOString().split('T')[0];
  }

  return history.reverse();
}

/**
 * Detects if today is a 'recovery' day (first completion after at least one empty day).
 */
export function isRecoveryDay(vault: Vault, today: string): boolean {
  const statsToday = getHabitCompletionForDate(vault, today);
  if (statsToday.completed === 0) return false;

  // Check if yesterday was empty
  const d = new Date(today + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];
  
  const statsYesterday = getHabitCompletionForDate(vault, yesterday);
  
  // If yesterday had no completions, and today has at least one, it's a recovery!
  return statsYesterday.completed === 0;
}
