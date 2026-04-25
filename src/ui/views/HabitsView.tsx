/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { Calendar, Plus } from 'lucide-react';
import { Vault } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import { 
  toggleHabitLog, 
  calculateStreak, 
  getHabitCompletionForDate, 
  updateHabitValue,
  getWeeklyHistory,
  isRecoveryDay 
} from '../../application/usecases/TrackHabitUseCase';
import { awardXP, checkStreakBonuses } from '../../application/usecases/GamificationEngine';
import { getXPForNextLevel } from '../../domain/constants/Gamification';
import { sensoryFeedback } from '../../infrastructure/services/SensoryFeedbackService';
import { ensureHabitReminderPermission } from '../../infrastructure/services/HabitReminderService';
import { 
  ConfirmActionModal,
  EditorialButton
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';
import AddHabitModal from '../components/domain/habits/AddHabitModal';
import HabitCard from '../components/domain/habits/HabitCard';
import HabitOverviewStats from '../components/domain/habits/HabitOverviewStats';
import HabitValueModal from '../components/domain/habits/HabitValueModal';
import WeeklyConsistencyHeatmap from '../components/domain/habits/WeeklyConsistencyHeatmap';

interface HabitsViewProps {
  vault: Vault;
  onUpdate: (v: Vault) => void;
  onLevelUp?: (level: number) => void;
}

export default function HabitsView({ vault, onUpdate, onLevelUp }: HabitsViewProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [addModalKey, setAddModalKey] = useState(0);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editModalKey, setEditModalKey] = useState(0);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [valueModalKey, setValueModalKey] = useState(0);
  const [habitToDeleteId, setHabitToDeleteId] = useState<string | null>(null);
  const today = todayISO();

  const activeHabits = useMemo(() => (vault.habits || []).filter(h => h.isActive), [vault.habits]);
  const currentStreak = useMemo(() => calculateStreak(vault.habitLogs || [], vault.habits || [], today), [today, vault]);
  const weeklyHistory = useMemo(() => getWeeklyHistory(vault, today), [today, vault]);
  
  const xpInfo = useMemo(() => getXPForNextLevel(vault.stats?.totalExp || 0), [vault.stats?.totalExp]);

  const handleToggle = (habitId: string) => {
    triggerHaptic('light');
    
    const updatedVault = toggleHabitLog(vault, habitId, today);
    const isNowCompleted = updatedVault.habitLogs.find(l => l.habitId === habitId && l.date === today)?.completed;
    
    if (isNowCompleted) {
      processCompletion(updatedVault);
    } else {
      onUpdate(updatedVault);
    }
  };

  const handleValueUpdate = (habitId: string, value: number) => {
    const updatedVault = updateHabitValue(vault, habitId, today, value);
    const isNowCompleted = updatedVault.habitLogs.find(l => l.habitId === habitId && l.date === today)?.completed;
    
    if (isNowCompleted) {
      processCompletion(updatedVault);
    } else {
      onUpdate(updatedVault);
    }
    setEditingValueId(null);
  };

  const processCompletion = (updatedVault: Vault) => {
    sensoryFeedback.complete();
    
    // Award XP
    const { vault: xpVault, event } = awardXP(updatedVault, 'HABIT_COMPLETE');
    let finalVault = xpVault;

    // Check for Recovery Bonus (first completion after a gap)
    const statsToday = getHabitCompletionForDate(finalVault, today);
    if (statsToday.completed === 1 && isRecoveryDay(finalVault, today)) {
       const { vault: recoveryVault } = awardXP(finalVault, 'RESILIENCE_RECOVERY');
       finalVault = recoveryVault;
       // Notify user somehow? 
    }
    
    if (event.didLevelUp && onLevelUp) {
      onLevelUp(event.newLevel!);
    }

    // Check for daily completion bonus
    const stats = getHabitCompletionForDate(finalVault, today);
    if (stats.completed === stats.total && stats.total > 0) {
      const { vault: bonusVault, event: bonusEvent } = awardXP(finalVault, 'ALL_HABITS_DAILY');
      finalVault = bonusVault;
      sensoryFeedback.success();
      
      // Recalculate streak to see if we hit a milestone
      const newStreak = calculateStreak(finalVault.habitLogs, finalVault.habits, today);
      const { vault: streakVault, events: streakEvents } = checkStreakBonuses(finalVault, newStreak);
      finalVault = streakVault;

      if (streakEvents.length > 0) {
        sensoryFeedback.levelUp();
      }

      if (bonusEvent.didLevelUp && onLevelUp) {
        onLevelUp(bonusEvent.newLevel!);
      }
    }

    onUpdate(finalVault);
  };

  const handleDelete = () => {
    if (!habitToDeleteId) return;
    triggerHaptic('heavy');
    onUpdate({
      ...vault,
      habits: (vault.habits || []).filter(h => h.id !== habitToDeleteId)
    });
    setHabitToDeleteId(null);
  };

  const selectedHabit = (vault.habits || []).find((habit) => habit.id === editingHabitId) || null;

  const persistHabit = async (habit: Vault['habits'][number]) => {
    if (habit.reminder?.enabled) {
      await ensureHabitReminderPermission();
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">{t('habits.breadcrumb')}</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('habits.title')}.</h2>
        </div>
        <EditorialButton 
          onClick={() => { setAddModalKey(k => k + 1); setIsAdding(true); }}
          icon={<Plus size={14} />}
        >
          {t('habits.new_habit')}
        </EditorialButton>
      </div>

      <HabitOverviewStats
        currentLevel={vault.stats?.level || 1}
        currentStreak={currentStreak}
        longestStreak={vault.stats?.longestStreak || 0}
        xpInfo={xpInfo}
      />

      <WeeklyConsistencyHeatmap today={today} weeklyHistory={weeklyHistory} />

      <div className="editorial-rule"></div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {activeHabits.map((habit) => {
            const log = (vault.habitLogs || []).find(l => l.habitId === habit.id && l.date === today);
            const isCompleted = !!log?.completed;
            const currentValue = log?.value || 0;
            
            return (
              <HabitCard
                key={habit.id}
                currentValue={currentValue}
                habit={habit}
                isCompleted={isCompleted}
                linkedGoalTitle={(vault.goals || []).find(g => g.id === habit.linkedGoalId)?.title}
                onAdjustValue={() => {
                  setValueModalKey((key) => key + 1);
                  setEditingValueId(habit.id);
                }}
                onEdit={() => {
                  setEditModalKey((key) => key + 1);
                  setEditingHabitId(habit.id);
                }}
                onDelete={() => setHabitToDeleteId(habit.id)}
                onToggle={() => handleToggle(habit.id)}
              />
            );
          })}
        </AnimatePresence>

        {activeHabits.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-ink/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
            <Calendar className="opacity-10" size={48} strokeWidth={1} />
            <p className="editorial-meta text-accent italic">{t('habits.no_habits')}</p>
          </div>
        )}
      </div>

      {/* Value Update Modal */}
      <HabitValueModal
        key={valueModalKey}
        isOpen={!!editingValueId}
        habit={(vault.habits || []).find(h => h.id === editingValueId)}
        currentValue={(vault.habitLogs || []).find(l => l.habitId === editingValueId && l.date === today)?.value || 0}
        onCancel={() => setEditingValueId(null)}
        onSave={(val) => handleValueUpdate(editingValueId!, val)}
      />

      <AddHabitModal
        key={addModalKey}
        isOpen={isAdding}
        goals={vault.goals || []}
        onCancel={() => setIsAdding(false)} 
        onSave={async (habit) => {
          await persistHabit(habit);

          onUpdate({
            ...vault,
            habits: [...(vault.habits || []), habit]
          });
          setIsAdding(false);
          triggerHaptic('success');
        }}
      />

      <AddHabitModal
        key={editModalKey}
        initialHabit={selectedHabit}
        isOpen={!!selectedHabit}
        goals={vault.goals || []}
        onCancel={() => setEditingHabitId(null)}
        onSave={async (habit) => {
          await persistHabit(habit);

          onUpdate({
            ...vault,
            habits: (vault.habits || []).map((currentHabit) =>
              currentHabit.id === habit.id ? habit : currentHabit
            )
          });
          setEditingHabitId(null);
          triggerHaptic('success');
        }}
      />

      <ConfirmActionModal
        isOpen={!!habitToDeleteId}
        onClose={() => setHabitToDeleteId(null)}
        onConfirm={handleDelete}
        title={t('habits.archive_title')}
        description={t('habits.archive_description')}
        confirmLabel={t('common.archive')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
