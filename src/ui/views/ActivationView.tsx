/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { CheckCircle2, Flame, Sparkles, Plus, Check } from 'lucide-react';
import { ActivationActivity, Habit, Goal } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import ActivityItem from '../components/domain/activation/ActivityItem';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialInput 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';

interface ActivationViewProps {
  activities: ActivationActivity[];
  habits?: Habit[];
  goals?: Goal[];
  onUpdate: (activities: ActivationActivity[]) => void;
}

export default function ActivationView({ activities, habits = [], goals = [], onUpdate }: ActivationViewProps) {
  const { t, language } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', value: 5, difficulty: 5, linkedHabitId: '', linkedGoalId: '' });

  const activeActivities = useMemo(() => 
    activities.filter(a => !a.completed).sort((a,b) => b.value - a.value), 
    [activities]
  );

  const completedToday = useMemo(() => 
    activities.filter(a => a.completed && a.completedDate === todayISO()),
    [activities]
  );

  const handleAdd = () => {
    if (!newActivity.title) return;
    triggerHaptic('success');
    const activity: ActivationActivity = {
      id: crypto.randomUUID(),
      title: newActivity.title,
      value: newActivity.value,
      difficulty: newActivity.difficulty,
      completed: false,
      subtasks: [],
      plannedDate: todayISO(),
      linkedHabitId: newActivity.linkedHabitId || undefined,
      linkedGoalId: newActivity.linkedGoalId || undefined
    };
    onUpdate([activity, ...activities]);
    setNewActivity({ title: '', value: 5, difficulty: 5, linkedHabitId: '', linkedGoalId: '' });
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    triggerHaptic('medium');
    onUpdate(activities.map(a => 
      a.id === id ? { ...a, completed: !a.completed, completedDate: !a.completed ? todayISO() : undefined } : a
    ));
  };

  const handleDelete = (id: string) => {
    triggerHaptic('heavy');
    onUpdate(activities.filter(a => a.id !== id));
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Momentum / Flow</div>
          <h2 className="font-serif text-3xl md:text-4xl italic">{t('momentum.title')}.</h2>
        </div>
        <EditorialButton 
          onClick={() => setIsAdding(true)}
          icon={<Plus size={14} />}
        >
          {language === 'es' ? 'Programar' : 'Schedule'}
        </EditorialButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Main List */}
         <div className="lg:col-span-7 flex flex-col gap-8">
             <div className="editorial-meta opacity-40">{language === 'es' ? 'Intenciones Activas' : 'Active Intentions'}</div>
             
             <div className="flex flex-col gap-4">
               {activeActivities.length === 0 ? (
                 <div className="py-20 text-center border border-dashed border-ink/5 rounded-3xl flex flex-col items-center gap-4">
                    <Sparkles className="text-accent opacity-20" size={32} />
                    <p className="editorial-meta opacity-30 italic">{t('momentum.no_tasks')}</p>
                 </div>
               ) : (
                 activeActivities.map(activity => (
                   <ActivityItem 
                     key={activity.id} 
                     activity={activity} 
                     linkedHabit={habits.find(h => h.id === activity.linkedHabitId)}
                     linkedGoal={goals.find(g => g.id === activity.linkedGoalId)}
                     onToggle={() => handleToggle(activity.id)}
                     onDelete={() => handleDelete(activity.id)}
                   />
                 ))
               )}
             </div>
         </div>

         {/* Stats & History */}
         <div className="lg:col-span-5 flex flex-col gap-10">
            <div className="p-10 border border-ink/5 rounded-[3rem] bg-paper shadow-sm flex flex-col gap-8">
               <div className="flex items-center gap-3">
                  <Flame className="text-amber-500" size={20} />
                  <span className="editorial-meta uppercase tracking-widest text-[10px]">{language === 'es' ? 'Velocidad Diaria' : 'Daily Velocity'}</span>
               </div>
               <div className="flex items-baseline gap-3">
                  <span className="font-serif text-6xl">{completedToday.length}</span>
                  <span className="editorial-meta opacity-30 italic lowercase">{language === 'es' ? 'actividades manifestadas' : 'activities manifested'}</span>
               </div>
               <div className="h-[2px] w-full bg-ink/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (completedToday.length / 5) * 100)}%` }}
                    className="h-full bg-ink"
                  />
               </div>
               <p className="text-[10px] editorial-meta opacity-40 italic">
                 {language === 'es' 
                   ? 'Apunta a 3-5 actividades de maestría o placer diarias para mantener la activación conductual.' 
                   : 'Aim for 3-5 mastery or pleasure activities daily to maintain behavioral activation.'}
               </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 editorial-meta opacity-40">
                <CheckCircle2 size={12} /> {language === 'es' ? 'Éxito Reciente' : 'Recent Success'}
              </div>
              <div className="flex flex-col gap-3">
                {completedToday.slice(0, 3).map(a => (
                  <div key={a.id} className="p-4 border border-ink/5 rounded-2xl flex items-center justify-between opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <span className="font-serif italic text-sm">{a.title}</span>
                    <span className="font-mono text-[8px] uppercase">{a.value}v / {a.difficulty}d</span>
                  </div>
                ))}
              </div>
            </div>
         </div>
      </div>

      <EditorialModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={language === 'es' ? 'Programar Intención.' : "Schedule Intention."}
        subtitle="Behavioral / Flow"
      >
        <div className="flex flex-col gap-8">
          <EditorialInput 
            autoFocus
            label={language === 'es' ? 'Descripción de la Actividad' : "Activity Description"}
            placeholder={language === 'es' ? '¿Qué vas a manifestar?' : "What will you manifest?"}
            value={newActivity.title}
            onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
          />
          <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="editorial-meta text-[9px]">{language === 'es' ? 'Alegría Anticipada' : 'Anticipated Joy'} ({newActivity.value}/10)</label>
                <input type="range" min="1" max="10" className="accent-ink h-10" value={newActivity.value} onChange={(e) => setNewActivity({...newActivity, value: parseInt(e.target.value)})} />
              </div>
              <div className="flex flex-col gap-3">
                <label className="editorial-meta text-[9px]">{language === 'es' ? 'Esfuerzo de Maestría' : 'Mastery Effort'} ({newActivity.difficulty}/10)</label>
                <input type="range" min="1" max="10" className="accent-ink h-10" value={newActivity.difficulty} onChange={(e) => setNewActivity({...newActivity, difficulty: parseInt(e.target.value)})} />
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits && habits.length > 0 && (
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">{language === 'es' ? 'Anclar a Hábito (Opcional)' : 'Anchor to Habit (Optional)'}</label>
                <select 
                  className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 font-serif text-lg italic appearance-none cursor-pointer"
                  value={newActivity.linkedHabitId}
                  onChange={(e) => setNewActivity({...newActivity, linkedHabitId: e.target.value})}
                >
                  <option value="" className="font-sans not-italic text-sm">-- {language === 'es' ? 'Sin hábito' : 'No habit'} --</option>
                  {habits.map(h => (
                    <option key={h.id} value={h.id} className="font-sans not-italic text-sm">{h.name}</option>
                  ))}
                </select>
              </div>
            )}
            {goals && goals.length > 0 && (
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">{language === 'es' ? 'Anclar a Objetivo (Opcional)' : 'Anchor to Goal (Optional)'}</label>
                <select 
                  className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 font-serif text-lg italic appearance-none cursor-pointer"
                  value={newActivity.linkedGoalId}
                  onChange={(e) => setNewActivity({...newActivity, linkedGoalId: e.target.value})}
                >
                  <option value="" className="font-sans not-italic text-sm">-- {language === 'es' ? 'Sin objetivo' : 'No goal'} --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id} className="font-sans not-italic text-sm">{g.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4">
              <button onClick={() => setIsAdding(false)} className="editorial-meta">{t('common.cancel')}</button>
              <EditorialButton onClick={handleAdd} icon={<Check size={14} />}>
                {language === 'es' ? 'Comprometer' : 'Commit'}
              </EditorialButton>
          </div>
        </div>
      </EditorialModal>
    </div>
  );
}
