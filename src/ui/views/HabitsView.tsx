/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Flame, 
  Check, 
  Hash, 
  Clock, 
  ChevronRight, 
  Trash2,
  Calendar,
  Zap,
  Settings2,
  Trophy
} from 'lucide-react';
import { Vault, Habit, Goal } from '../../domain/entities';
import { HABIT_TEMPLATES, HabitTemplate } from '../../domain/constants/HabitTemplates';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import { 
  toggleHabitLog, 
  calculateStreak, 
  getHabitCompletionForDate, 
  updateHabitValue,
  getWeeklyHistory 
} from '../../application/usecases/TrackHabitUseCase';
import { awardXP, checkStreakBonuses } from '../../application/usecases/GamificationEngine';
import { getXPForNextLevel } from '../../domain/constants/Gamification';
import { audioFeedback } from '../../infrastructure/services/WebAudioFeedbackService';
import { confetti } from '../../infrastructure/services/ConfettiService';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialInput 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';

interface HabitsViewProps {
  vault: Vault;
  onUpdate: (v: Vault) => void;
  onLevelUp?: (level: number) => void;
}

export default function HabitsView({ vault, onUpdate, onLevelUp }: HabitsViewProps) {
  const { t, language } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const today = todayISO();

  const activeHabits = useMemo(() => (vault.habits || []).filter(h => h.isActive), [vault.habits]);
  const currentStreak = useMemo(() => calculateStreak(vault.habitLogs || [], vault.habits || [], today), [vault.habitLogs, vault.habits, today, vault]);
  const weeklyHistory = useMemo(() => getWeeklyHistory(vault, today), [vault.habitLogs, vault.habits, today, vault]);
  
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
    audioFeedback.playComplete();
    
    // Award XP
    const { vault: xpVault, event } = awardXP(updatedVault, 'HABIT_COMPLETE');
    let finalVault = xpVault;
    
    if (event.didLevelUp && onLevelUp) {
      onLevelUp(event.newLevel!);
    }

    // Check for daily completion bonus
    const stats = getHabitCompletionForDate(finalVault, today);
    if (stats.completed === stats.total && stats.total > 0) {
      const { vault: bonusVault, event: bonusEvent } = awardXP(finalVault, 'ALL_HABITS_DAILY');
      finalVault = bonusVault;
      audioFeedback.playSuccess();
      
      // Recalculate streak to see if we hit a milestone
      const newStreak = calculateStreak(finalVault.habitLogs, finalVault.habits, today);
      const { vault: streakVault, events: streakEvents } = checkStreakBonuses(finalVault, newStreak);
      finalVault = streakVault;

      if (streakEvents.length > 0) {
        confetti.trigger({ particleCount: 40, spread: 70 });
        audioFeedback.playLevelUp(); // Use level up sound for big streak milestones
      }

      if (bonusEvent.didLevelUp && onLevelUp) {
        onLevelUp(bonusEvent.newLevel!);
      }
    }

    onUpdate(finalVault);
  };

  const handleDelete = (id: string) => {
    if (confirm("Archive this architectural rhythm?")) {
      triggerHaptic('heavy');
      onUpdate({
        ...vault,
        habits: (vault.habits || []).filter(h => h.id !== id)
      });
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Rhythm / Daily Architecture</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('habits.title')}.</h2>
        </div>
        <EditorialButton 
          onClick={() => setIsAdding(true)}
          icon={<Plus size={14} />}
        >
          {t('habits.new_habit')}
        </EditorialButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 border border-ink/5 rounded-3xl bg-ink/[0.01] flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="editorial-meta">{t('habits.streak')}</div>
            <Flame size={16} className={currentStreak > 0 ? "text-orange-400" : "text-accent opacity-20"} />
          </div>
          <div className="font-serif text-5xl font-light">{currentStreak} <span className="text-sm editorial-meta italic">{language === 'es' ? 'días' : 'days'}</span></div>
          <div className="editorial-meta text-accent">{language === 'es' ? 'Disciplina Consecutiva' : 'Consecutive Discipline'}</div>
        </div>

        <div className="p-8 border border-ink/5 rounded-3xl bg-ink/[0.01] flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="editorial-meta">Experience Level</div>
            <Zap size={16} className="text-accent" />
          </div>
          <div className="font-serif text-5xl font-light">{vault.stats?.level || 1}</div>
          <div className="w-full h-1 bg-ink/5 rounded-full overflow-hidden mt-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpInfo.progress * 100}%` }}
              className="h-full bg-ink"
            />
          </div>
          <div className="editorial-meta text-accent text-[9px]">{xpInfo.current} / {xpInfo.needed} XP for Level {(vault.stats?.level || 1) + 1}</div>
        </div>

        <div className="p-8 border border-ink/5 rounded-3xl bg-ink/[0.01] flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="editorial-meta">{language === 'es' ? 'Récord de Racha' : 'Record Streak'}</div>
            <Trophy size={16} className="text-accent opacity-20" />
          </div>
          <div className="font-serif text-5xl font-light">{vault.stats?.longestStreak || 0} <span className="text-sm editorial-meta italic">{language === 'es' ? 'días' : 'days'}</span></div>
          <div className="editorial-meta text-accent">{language === 'es' ? 'Mejor Marca Personal' : 'Personal Best'}</div>
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div className="flex flex-col gap-4 p-8 border border-ink/5 rounded-3xl bg-paper">
        <div className="flex justify-between items-center">
          <div className="editorial-meta">{language === 'es' ? 'Consistencia Semanal / Mapa de Calor' : 'Weekly Consistency / Heatmap'}</div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-ink/5"></div><span className="text-[8px] editorial-meta uppercase opacity-40">{language === 'es' ? 'Ninguno' : 'None'}</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-ink"></div><span className="text-[8px] editorial-meta uppercase opacity-40">{language === 'es' ? 'Completado' : 'All Done'}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {weeklyHistory.map((day) => {
            const isToday = day.date === today;
            const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' });
            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-full aspect-square rounded-lg transition-all duration-700 ${
                    day.percentage === 100 ? 'bg-ink' : 
                    day.percentage > 0 ? 'bg-ink/40' : 'bg-ink/5'
                  } ${isToday ? 'ring-2 ring-ink ring-offset-4' : ''}`}
                />
                <span className={`text-[9px] font-mono uppercase tracking-tighter ${isToday ? 'text-ink font-bold' : 'text-accent opacity-40'}`}>
                  {dayName[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="editorial-rule"></div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {activeHabits.map((habit) => {
            const log = (vault.habitLogs || []).find(l => l.habitId === habit.id && l.date === today);
            const isCompleted = log?.completed;
            const currentValue = log?.value || 0;
            const progress = habit.targetValue ? Math.min(100, (currentValue / habit.targetValue) * 100) : 0;
            
            return (
              <motion.div 
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group p-8 border border-ink/10 rounded-[2rem] bg-paper flex flex-col gap-6 hover:shadow-xl hover:shadow-ink/[0.02] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleToggle(habit.id)}
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        isCompleted ? 'bg-ink border-ink text-paper' : 'border-ink/10 text-ink/10 hover:border-ink/30'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check size={24} strokeWidth={3} />
                          </motion.div>
                        ) : (
                          <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            {habit.type === 'yesno' ? <Plus size={20} /> : <Settings2 size={20} />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        {habit.type === 'numeric' ? <Hash size={12} className="text-accent" /> : habit.type === 'timer' ? <Clock size={12} className="text-accent" /> : <Check size={12} className="text-accent" />}
                        <span className="editorial-meta text-[9px] uppercase tracking-tighter opacity-50">{habit.type}</span>
                      </div>
                      <h3 className={`font-serif text-2xl italic leading-none transition-all ${isCompleted ? 'opacity-30 line-through' : ''}`}>
                        {habit.name}
                      </h3>
                      {habit.linkedGoalId && (
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-ink/5 text-ink/50 rounded-full w-fit mt-2">
                          {language === 'es' ? 'Objetivo:' : 'Aim:'} {(vault.goals || []).find(g => g.id === habit.linkedGoalId)?.title || 'Goal'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={() => handleDelete(habit.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/30 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                    <div className="editorial-rule h-8 w-px bg-ink/5 hidden md:block"></div>
                    <ChevronRight size={18} className="text-accent opacity-20 group-hover:opacity-100 transition-all" />
                  </div>
                </div>

                {(habit.type === 'numeric' || habit.type === 'timer') && (
                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[10px] editorial-meta uppercase opacity-40">{t('habits.progress')}</span>
                         <span className="font-serif text-xl italic">{currentValue} / {habit.targetValue} <span className="text-[10px] editorial-meta not-italic opacity-40">{habit.unit}</span></span>
                      </div>
                      <button 
                        onClick={() => setEditingValueId(habit.id)}
                        className="text-[9px] font-mono uppercase tracking-widest text-accent hover:text-ink transition-colors"
                      >
                        {language === 'es' ? 'Ajustar Valor' : 'Adjust Value'}
                      </button>
                    </div>
                    <div className="w-full h-1 bg-ink/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${isCompleted ? 'bg-ink' : 'bg-accent opacity-30'}`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
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
      <ValueModal 
        isOpen={!!editingValueId}
        habit={(vault.habits || []).find(h => h.id === editingValueId)}
        currentValue={(vault.habitLogs || []).find(l => l.habitId === editingValueId && l.date === today)?.value || 0}
        onCancel={() => setEditingValueId(null)}
        onSave={(val) => handleValueUpdate(editingValueId!, val)}
      />

      {/* Add Habit Modal */}
      <AddHabitModal 
        isOpen={isAdding}
        goals={vault.goals || []}
        onCancel={() => setIsAdding(false)} 
        onSave={(habit) => {
          onUpdate({
            ...vault,
            habits: [...(vault.habits || []), habit]
          });
          setIsAdding(false);
          triggerHaptic('success');
        }}
      />
    </div>
  );
}

function ValueModal({ isOpen, habit, currentValue, onCancel, onSave }: { isOpen: boolean; habit?: Habit; currentValue: number; onCancel: () => void; onSave: (v: number) => void }) {
  const [val, setVal] = useState(currentValue.toString());

  // Keep track of the last known habit for exit animations
  const [persistedHabit, setPersistedHabit] = useState<Habit | undefined>(habit);
  
  useEffect(() => {
    if (habit) setPersistedHabit(habit);
  }, [habit]);

  useEffect(() => {
    if (isOpen) {
      setVal(currentValue.toString());
    }
  }, [isOpen, currentValue]);

  const displayHabit = habit || persistedHabit;

  return (
    <EditorialModal 
      isOpen={isOpen} 
      onClose={onCancel}
      title={displayHabit?.name || ''}
      subtitle={`Log ${displayHabit?.unit || 'value'}`}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <input 
            autoFocus
            type="number"
            className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-4 text-center font-serif text-5xl italic w-full"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <div className="text-center editorial-meta opacity-40 uppercase tracking-widest">
            {displayHabit?.unit || 'Units'} / Target {displayHabit?.targetValue}
          </div>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button onClick={onCancel} className="editorial-meta">{t('common.cancel')}</button>
          <EditorialButton onClick={() => onSave(Number(val))}>
            {language === 'es' ? 'Actualizar Registro' : 'Update Log'}
          </EditorialButton>
        </div>
      </div>
    </EditorialModal>
  );
}

function AddHabitModal({ isOpen, goals, onCancel, onSave }: { isOpen: boolean; goals: Goal[]; onCancel: () => void; onSave: (h: Habit) => void }) {
  const [showTemplates, setShowTemplates] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<Habit['type']>('yesno');
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const { t, language } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setShowTemplates(true);
      setName('');
      setType('yesno');
      setTarget('1');
      setUnit('');
      setLinkedGoalId('');
    }
  }, [isOpen]);

  const selectTemplate = (tpl: HabitTemplate) => {
    setName(tpl.name);
    setType(tpl.type);
    if (tpl.targetValue) setTarget(tpl.targetValue.toString());
    if (tpl.unit) setUnit(tpl.unit);
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({
      id: crypto.randomUUID(),
      name,
      type,
      targetValue: type !== 'yesno' ? Number(target) : undefined,
      unit: type !== 'yesno' ? unit : undefined,
      frequency: 'daily',
      isActive: true,
      linkedGoalId: linkedGoalId || undefined,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <EditorialModal 
      isOpen={isOpen} 
      onClose={onCancel}
      title={showTemplates ? t('habits.templates') : t('habits.new_habit')}
      subtitle="Creation / Architecture"
    >
      {showTemplates ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HABIT_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => selectTemplate(tpl)}
                className="text-left p-4 rounded-2xl border border-ink/5 hover:border-ink/20 hover:bg-ink/5 transition-all flex flex-col gap-2 group"
              >
                <div className="flex justify-between items-start">
                  <span className="font-serif italic text-lg group-hover:text-ink">{tpl.name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-1 bg-ink/5 rounded-full text-ink/40">{tpl.category}</span>
                </div>
                <span className="text-xs opacity-50 leading-relaxed">{tpl.description}</span>
              </button>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <button 
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-xs uppercase tracking-widest font-mono text-accent hover:text-ink transition-colors border-b border-transparent hover:border-ink pb-1"
            >
              {language === 'es' ? 'O crear desde cero' : 'Or create from scratch'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <EditorialInput 
            label={language === 'es' ? 'Nombre del Hábito' : "Habit Name"}
            required
            autoFocus
            placeholder={language === 'es' ? 'ej. Reflexión Matutina' : "e.g., Morning Reflection"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <label className="editorial-meta">{language === 'es' ? 'Tipo de Medición' : 'Measurement Type'}</label>
            <div className="flex gap-4">
              {[
                { id: 'yesno', icon: Check, label: language === 'es' ? 'Sí/No' : 'Yes/No' },
                { id: 'numeric', icon: Hash, label: language === 'es' ? 'Valor' : 'Value' },
                { id: 'timer', icon: Clock, label: language === 'es' ? 'Reloj' : 'Timer' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as Habit['type'])}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    type === opt.id ? 'bg-ink border-ink text-paper' : 'border-ink/5 hover:border-ink/20 text-accent'
                  }`}
                >
                  <opt.icon size={18} />
                  <span className="font-mono text-[9px] uppercase tracking-tighter">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {type !== 'yesno' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">{language === 'es' ? 'Meta Objetivo' : 'Target Goal'}</label>
                <div className="flex items-end gap-4">
                  <EditorialInput 
                    type="number"
                    required
                    className="flex-1"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                  <EditorialInput 
                    className="w-24"
                    variant="mono"
                    placeholder={language === 'es' ? 'Unidad' : "Unit"}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {goals && goals.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="editorial-meta">{language === 'es' ? 'Anclar a un Objetivo (Opcional)' : 'Anchor to a Goal (Optional)'}</label>
              <select 
                className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 font-serif text-lg italic appearance-none cursor-pointer"
                value={linkedGoalId}
                onChange={(e) => setLinkedGoalId(e.target.value)}
              >
                <option value="" className="font-sans not-italic text-sm">-- {language === 'es' ? 'Sin objetivo' : 'No goal'} --</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id} className="font-sans not-italic text-sm">{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-ink/5">
            <button type="button" onClick={() => setShowTemplates(true)} className="editorial-meta hover:text-ink transition-colors">{t('common.back')}</button>
            <EditorialButton type="submit" icon={<Plus size={14} />}>
              {language === 'es' ? 'Establecer Hábito' : 'Establish Habit'}
            </EditorialButton>
          </div>
        </form>
      )}
    </EditorialModal>
  );
}
