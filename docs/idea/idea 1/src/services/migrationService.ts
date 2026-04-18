import { dbService } from './dbService';
import { HabitLog } from '../types';

/**
 * Safely coerces a value to a Date or returns undefined.
 * Handles: Date objects, ISO strings, timestamps, null, undefined.
 */
function safeDate(val: unknown): Date | undefined {
  if (val == null) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export const migrationService = {
  async migrateLocalToCloud(userId: string) {
    console.log('Starting migration for user:', userId);
    const habitIdMap = new Map<string, string>();

    // 1. Migrate Profile & Stats
    const userStorage = localStorage.getItem('iterum_user_storage');
    if (userStorage) {
      const { state } = JSON.parse(userStorage);
      if (state.stats) {
        await dbService.updateProfile(userId, state.stats);
        console.log('Profile migrated');
      }
    }

    // 2. Migrate Habits
    const habitStorage = localStorage.getItem('iterum_habits_storage');
    if (habitStorage) {
      const { state } = JSON.parse(habitStorage);
      if (state.habits && state.habits.length > 0) {
        for (const habit of state.habits) {
          const { id, createdAt, ...habitData } = habit;
          const newHabit = await dbService.createHabit(userId, habitData);
          habitIdMap.set(id, newHabit.id);
          
          // Migrate logs for this habit
          if (state.logs) {
            const habitLogs = state.logs.filter((l: HabitLog) => l.habitId === id);
            for (const log of habitLogs) {
              const { id: logId, createdAt: logCreated, ...logData } = log;
              await dbService.upsertHabitLog(userId, { ...logData, habitId: newHabit.id });
            }
          }
        }
        console.log('Habits and logs migrated');
      }
    }

    // 3. Migrate Tasks
    const taskStorage = localStorage.getItem('planner_tasks');
    if (taskStorage) {
      const { state } = JSON.parse(taskStorage);
      if (state.tasks && state.tasks.length > 0) {
        for (const task of state.tasks) {
          const { id, createdAt, ...taskData } = task;
          // Ensure date is a Date object
          const sanitizedTask = {
            ...taskData,
            date: safeDate(taskData.date) || new Date(),
          };
          await dbService.createTask(userId, sanitizedTask);
        }
        console.log('Tasks migrated');
      }
    }

    // 4. Migrate Objectives (with safe date handling)
    const objectiveStorage =
      localStorage.getItem('iterum_objectives_v1') ||
      localStorage.getItem('iterum_objectives_storage');
    if (objectiveStorage) {
      const { state } = JSON.parse(objectiveStorage);
      if (state.objectives && state.objectives.length > 0) {
        for (const objective of state.objectives) {
          // Strip transient/ID fields and sanitize deadline
          const {
            id, createdAt, created_at, user_id, progress,
            ...rest
          } = objective;
          const objData = {
            ...rest,
            linkedHabitId: rest.linkedHabitId ? habitIdMap.get(rest.linkedHabitId) : undefined,
            deadline: safeDate(rest.deadline),
          };
          try {
            await dbService.createObjective(userId, objData);
          } catch (e) {
            console.warn('Failed to migrate objective:', objective.title, e);
          }
        }
        console.log('Objectives migrated');
      }
    }

    // 5. Migrate Journals
    const journalStorage = localStorage.getItem('iterum_journals_v1');
    if (journalStorage) {
      const { state } = JSON.parse(journalStorage);
      if (state.journals && state.journals.length > 0) {
        for (const journal of state.journals) {
          // Only migrate if it has an encrypted payload
          if (!journal.payload) continue;
          try {
            await dbService.createJournal(userId, { payload: journal.payload });
          } catch (e) {
            console.warn('Failed to migrate journal entry:', journal.id, e);
          }
        }
        console.log('Journals migrated');
      }
    }

    console.log('Migration completed successfully');
  }
};
