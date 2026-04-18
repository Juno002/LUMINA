import { supabase } from './supabase';
import { Habit, HabitLog, Task, Objective, UserStats, Milestone } from '../types';

/**
 * Asserts that the Supabase client is initialized.
 * Throws a descriptive error instead of crashing with null dereference.
 */
function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
    );
  }
  return supabase;
}

function mapObjectiveStatus(
  isActive: boolean | null | undefined,
  currentValue: number | null | undefined,
  targetValue: number | null | undefined,
): Objective['status'] {
  if (!isActive) return 'archived';
  if ((currentValue ?? 0) >= (targetValue ?? 100)) return 'achieved';
  return 'active';
}

function mapMilestone(milestone: {
  id: string;
  title: string;
  completed: boolean | null;
  completed_at: string | null;
}): Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    completed: milestone.completed ?? false,
    completedAt: milestone.completed_at ? new Date(milestone.completed_at) : undefined,
  };
}

async function syncObjectiveMilestones(
  userId: string,
  objectiveId: string,
  milestones: Milestone[] | undefined,
) {
  const client = requireSupabase();
  if (!milestones) return;

  // 1. Upsert all incoming milestones (atomic per-row, no full wipe)
  if (milestones.length > 0) {
    const payload = milestones.map((milestone) => ({
      id: milestone.id,
      user_id: userId,
      objective_id: objectiveId,
      title: milestone.title,
      completed: milestone.completed,
      completed_at: milestone.completedAt?.toISOString() ?? null,
    }));

    const { error: upsertError } = await client
      .from('milestones')
      .upsert(payload, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  const incomingIds = new Set(milestones.map((milestone) => milestone.id));
  const { data: existingMilestones, error: fetchError } = await client
    .from('milestones')
    .select('id')
    .eq('objective_id', objectiveId)
    .eq('user_id', userId);
  if (fetchError) throw fetchError;

  // If there are no incoming IDs, delete all for this objective
  if (incomingIds.size === 0) {
    const { error: deleteAllError } = await client
      .from('milestones')
      .delete()
      .eq('objective_id', objectiveId)
      .eq('user_id', userId);
    if (deleteAllError) throw deleteAllError;
    return;
  }

  const milestoneIdsToDelete = (existingMilestones ?? [])
    .map((milestone) => milestone.id as string)
    .filter((id) => !incomingIds.has(id));

  if (milestoneIdsToDelete.length === 0) return;

  const { error: deleteError } = await client
    .from('milestones')
    .delete()
    .eq('objective_id', objectiveId)
    .eq('user_id', userId)
    .in('id', milestoneIdsToDelete);
  if (deleteError) throw deleteError;
}

export const dbService = {
  // PROFILES
  async getProfile(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserStats>) {
    const client = requireSupabase();
    const profileUpdates: Record<string, unknown> = {};
    if (updates.totalExp !== undefined) profileUpdates.total_exp = updates.totalExp;
    if (updates.level !== undefined) profileUpdates.level = updates.level;
    if (updates.discipline?.exp !== undefined) profileUpdates.discipline_exp = updates.discipline.exp;
    if (updates.discipline?.level !== undefined) profileUpdates.discipline_level = updates.discipline.level;
    if (updates.consistency?.exp !== undefined) profileUpdates.consistency_exp = updates.consistency.exp;
    if (updates.consistency?.level !== undefined) profileUpdates.consistency_level = updates.consistency.level;
    if (updates.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = updates.onboardingCompleted;

    const { error } = await client
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);
    if (error) throw error;
  },

  // HABITS
  async getHabits(userId: string): Promise<Habit[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description || undefined,
      frequency: habit.frequency,
      type: habit.type as any,
      targetValue: habit.target_value,
      unit: habit.unit || undefined,
      color: habit.color || undefined,
      isActive: habit.is_active,
      createdAt: new Date(habit.created_at),
    }));
  },

  async createHabit(userId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) {
    const client = requireSupabase();
    const payload = {
      user_id: userId,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      type: habit.type,
      target_value: habit.targetValue,
      unit: habit.unit,
      color: habit.color,
      is_active: habit.isActive ?? true,
    };
    
    const { data, error } = await client
      .from('habits')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...habit,
      id: data.id,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  },

  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>) {
    const client = requireSupabase();
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.targetValue !== undefined) payload.target_value = updates.targetValue;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { error } = await client
      .from('habits')
      .update(payload)
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteHabit(userId: string, habitId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // HABIT LOGS
  async getHabitLogs(userId: string): Promise<HabitLog[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    
    return (data || []).map((log) => ({
      id: log.id,
      habitId: log.habit_id,
      date: log.date,
      completed: log.completed,
      value: log.value || undefined,
      note: log.note || undefined,
      createdAt: new Date(log.created_at),
    }));
  },

  async upsertHabitLog(userId: string, log: Omit<HabitLog, 'id' | 'createdAt'> & { id?: string }) {
    const client = requireSupabase();
    const payload = {
      id: log.id,
      user_id: userId,
      habit_id: log.habitId,
      date: log.date,
      completed: log.completed,
      value: log.value,
      note: log.note,
    };
    
    const { data, error } = await client
      .from('habit_logs')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...log,
      id: data.id,
      createdAt: new Date(data.created_at),
    };
  },

  async deleteHabitLog(userId: string, logId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // TASKS
  async getTasks(userId: string): Promise<Task[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    
    return (data || []).map((task) => ({
      id: task.id,
      type: task.type as any,
      title: task.title,
      description: task.description || undefined,
      date: new Date(task.date),
      completed: task.completed,
      color: task.color || undefined,
      createdAt: new Date(task.created_at),
    }));
  },

  async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt'>) {
    const client = requireSupabase();
    const payload = {
      user_id: userId,
      title: task.title,
      description: task.description,
      date: task.date.toISOString(),
      completed: task.completed,
      priority: (task as any).priority || 'medium',
      type: task.type,
      color: task.color,
      habit_id: (task as any).habitId || null,
      objective_id: (task as any).objectiveId || null,
    };
    
    const { data, error } = await client
      .from('tasks')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...task,
      id: data.id,
      createdAt: new Date(data.created_at),
    };
  },

  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    const client = requireSupabase();
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.date !== undefined) payload.date = updates.date.toISOString();
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.type !== undefined) payload.type = updates.type;
    if ((updates as any).priority !== undefined) payload.priority = (updates as any).priority;

    const { error } = await client
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteTask(userId: string, taskId: string) {
    const client = requireSupabase();
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // OBJECTIVES
  async getObjectives(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('objectives')
      .select('*, milestones(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((objective) => ({
      id: objective.id,
      user_id: objective.user_id,
      title: objective.title,
      description: objective.description || undefined,
      targetValue: objective.target_value ?? 100,
      currentValue: objective.current_value ?? 0,
      unit: objective.unit ?? '%',
      deadline: objective.deadline ? new Date(objective.deadline) : undefined,
      color: objective.color ?? '#c9935a',
      status: mapObjectiveStatus(
        objective.is_active,
        objective.current_value,
        objective.target_value,
      ),
      progress:
        (objective.target_value ?? 0) > 0
          ? Math.min(100, Math.round(((objective.current_value ?? 0) / objective.target_value) * 100))
          : 0,
      milestones: (objective.milestones ?? []).map(mapMilestone),
      linkedHabitId: objective.linked_habit_id ?? undefined,
      createdAt: new Date(objective.created_at),
    }));
  },

  async createObjective(userId: string, objective: Omit<Objective, 'id' | 'createdAt' | 'user_id'>) {
    const client = requireSupabase();
    const payload = {
      title: objective.title,
      description: objective.description,
      target_value: objective.targetValue,
      current_value: objective.currentValue,
      unit: objective.unit,
      deadline: objective.deadline?.toISOString(),
      color: objective.color,
      linked_habit_id: objective.linkedHabitId ?? null,
      is_active: objective.status !== 'archived',
      user_id: userId,
    };
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { data, error } = await client
        .from('objectives')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      try {
        await syncObjectiveMilestones(userId, data.id, objective.milestones);
      } catch (milestoneError) {
        await client.from('objectives').delete().eq('id', data.id).eq('user_id', userId);
        throw milestoneError;
      }
      return {
        id: data.id,
        user_id: data.user_id,
        title: objective.title,
        description: objective.description,
        targetValue: objective.targetValue,
        currentValue: objective.currentValue,
        unit: objective.unit,
        deadline: objective.deadline,
        color: objective.color,
        status: objective.status,
        progress: objective.progress,
        milestones: objective.milestones || [],
        linkedHabitId: objective.linkedHabitId,
        createdAt: new Date(data.created_at),
      };
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        const fakeId = (objective as any).id || crypto.randomUUID();
        useSyncQueueStore.getState().enqueue('objective', 'create', userId, { ...objective, id: fakeId });
        return { ...objective, id: fakeId, createdAt: new Date() };
      }
      throw e;
    }
  },

  async updateObjective(userId: string, objectiveId: string, updates: Partial<Objective>) {
    const client = requireSupabase();
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.targetValue !== undefined) payload.target_value = updates.targetValue;
    if (updates.currentValue !== undefined) payload.current_value = updates.currentValue;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline?.toISOString() ?? null;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.linkedHabitId !== undefined) payload.linked_habit_id = updates.linkedHabitId ?? null;
    if (updates.status !== undefined) payload.is_active = updates.status !== 'archived';
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const previousObjective = updates.milestones !== undefined
        ? await dbService.getObjectiveById(userId, objectiveId)
        : null;
      const { error } = await client
        .from('objectives')
        .update(payload)
        .eq('id', objectiveId)
        .eq('user_id', userId);
        
      if (error) throw error;
      if (updates.milestones !== undefined) {
        try {
          await syncObjectiveMilestones(userId, objectiveId, updates.milestones);
        } catch (milestoneError) {
          if (previousObjective) {
            try {
              const rollbackPayload: Record<string, unknown> = {
                title: previousObjective.title,
                description: previousObjective.description,
                target_value: previousObjective.targetValue,
                current_value: previousObjective.currentValue,
                unit: previousObjective.unit,
                deadline: previousObjective.deadline?.toISOString() ?? null,
                color: previousObjective.color,
                linked_habit_id: previousObjective.linkedHabitId ?? null,
                is_active: previousObjective.status !== 'archived',
              };
              await client
                .from('objectives')
                .update(rollbackPayload)
                .eq('id', objectiveId)
                .eq('user_id', userId);
              await syncObjectiveMilestones(userId, objectiveId, previousObjective.milestones);
            } catch (rollbackError) {
              console.error('Rollback failed after milestone sync error', rollbackError);
            }
          }
          throw milestoneError;
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('objective', 'update', userId, updates, objectiveId);
        return;
      }
      throw e;
    }
  },
  
  async deleteObjective(userId: string, objectiveId: string) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { error } = await client
        .from('objectives')
        .delete()
        .eq('id', objectiveId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('objective', 'delete', userId, {}, objectiveId);
        return;
      }
      throw e;
    }
  },

  async getObjectiveById(userId: string, objectiveId: string) {
    const objectives = await this.getObjectives(userId);
    return objectives.find((objective) => objective.id === objectiveId) ?? null;
  },

  // JOURNALS
  async getJournals(userId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createJournal(userId: string, journal: Omit<import('../types').JournalEntry, 'id' | 'created_at' | 'user_id' | 'text' | 'objectiveId'>) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { data, error } = await client
        .from('journals')
        .insert([{ payload: journal.payload, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        const fakeId = (journal as any).id || crypto.randomUUID();
        useSyncQueueStore.getState().enqueue('journal', 'create', userId, { ...journal, id: fakeId });
        return { ...journal, id: fakeId, created_at: new Date().toISOString() };
      }
      throw e;
    }
  },

  async deleteJournal(userId: string, journalId: string) {
    const client = requireSupabase();
    try {
      if (!navigator.onLine) throw new Error('Failed to fetch');
      const { error } = await client
        .from('journals')
        .delete()
        .eq('id', journalId)
        .eq('user_id', userId);
        
      if (error) throw error;
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        const { useSyncQueueStore } = await import('../store/useSyncQueueStore');
        useSyncQueueStore.getState().enqueue('journal', 'delete', userId, {}, journalId);
        return;
      }
      throw e;
    }
  }
};
