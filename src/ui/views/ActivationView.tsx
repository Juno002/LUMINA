/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Flame, Sparkles, Plus, Check } from 'lucide-react';
import { ActivationActivity, Habit, Goal } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import { sensoryFeedback } from '../../infrastructure/services/SensoryFeedbackService';
import ActivityItem from '../components/domain/activation/ActivityItem';
import { 
  ConfirmActionModal,
  EditorialChoiceField,
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
  const [feedbackActivityId, setFeedbackActivityId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({ actualValue: 5, actualDifficulty: 5 });
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null);

  const activeActivities = useMemo(() => 
    activities.filter(a => !a.completed).sort((a,b) => b.value - a.value), 
    [activities]
  );

  const completedToday = useMemo(() => 
    activities.filter(a => a.completed && a.completedDate === todayISO()),
    [activities]
  );
  const habitOptions = useMemo(
    () => habits.map((habit) => ({ value: habit.id, label: habit.name })),
    [habits]
  );
  const goalOptions = useMemo(
    () => goals.map((goal) => ({ value: goal.id, label: goal.title })),
    [goals]
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
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    if (!activity.completed) {
      // Opening feedback modal before completion
      sensoryFeedback.tap();
      setFeedbackActivityId(id);
      setFeedbackData({ 
        actualValue: activity.value, 
        actualDifficulty: activity.difficulty 
      });
    } else {
      // Un-completing
      sensoryFeedback.undo();
      onUpdate(activities.map(a => 
        a.id === id ? { ...a, completed: false, completedDate: undefined } : a
      ));
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackActivityId) return;
    sensoryFeedback.complete();
    onUpdate(activities.map(a => 
      a.id === feedbackActivityId 
        ? { 
            ...a, 
            completed: true, 
            completedDate: todayISO(),
            completedAt: new Date().toISOString(),
            actualValue: feedbackData.actualValue,
            actualDifficulty: feedbackData.actualDifficulty
          } 
        : a
    ));
    setFeedbackActivityId(null);
  };

  const handleDelete = (id: string) => {
    setActivityToDeleteId(id);
  };

  const confirmDelete = () => {
    if (!activityToDeleteId) return;
    triggerHaptic('heavy');
    onUpdate(activities.filter(a => a.id !== activityToDeleteId));
    setActivityToDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">{t('momentum.breadcrumb.momentum')} / {t('momentum.breadcrumb.flow')}</div>
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
        subtitle={t('momentum.modal_subtitle')}
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
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {habits && habits.length > 0 && (
              <EditorialChoiceField
                label={language === 'es' ? 'Anclar a Hábito (Opcional)' : 'Anchor to Habit (Optional)'}
                placeholder={language === 'es' ? 'Seleccionar hábito' : 'Select habit'}
                emptyLabel={language === 'es' ? 'Sin hábito' : 'No habit'}
                options={habitOptions}
                value={newActivity.linkedHabitId}
                onChange={(linkedHabitId) => setNewActivity({...newActivity, linkedHabitId})}
              />
            )}
            {goals && goals.length > 0 && (
              <EditorialChoiceField
                label={language === 'es' ? 'Anclar a Objetivo (Opcional)' : 'Anchor to Goal (Optional)'}
                placeholder={language === 'es' ? 'Seleccionar objetivo' : 'Select goal'}
                emptyLabel={language === 'es' ? 'Sin objetivo' : 'No goal'}
                options={goalOptions}
                value={newActivity.linkedGoalId}
                onChange={(linkedGoalId) => setNewActivity({...newActivity, linkedGoalId})}
              />
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

      {/* Feedback Modal */}
      <EditorialModal
        isOpen={!!feedbackActivityId}
        onClose={() => setFeedbackActivityId(null)}
        title={t('momentum.feedback_title')}
        subtitle={activities.find(a => a.id === feedbackActivityId)?.title || ''}
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label className="editorial-meta text-[9px]">{t('momentum.actual_joy')} ({feedbackData.actualValue}/10)</label>
              <input type="range" min="1" max="10" className="accent-ink h-10" value={feedbackData.actualValue} onChange={(e) => setFeedbackData({...feedbackData, actualValue: parseInt(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="editorial-meta text-[9px]">{t('momentum.actual_effort')} ({feedbackData.actualDifficulty}/10)</label>
              <input type="range" min="1" max="10" className="accent-ink h-10" value={feedbackData.actualDifficulty} onChange={(e) => setFeedbackData({...feedbackData, actualDifficulty: parseInt(e.target.value)})} />
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
              <button onClick={() => setFeedbackActivityId(null)} className="editorial-meta">{t('common.cancel')}</button>
              <EditorialButton onClick={handleFeedbackSubmit} icon={<Check size={14} />}>
                {language === 'es' ? 'Finalizar' : 'Finish'}
              </EditorialButton>
          </div>
        </div>
      </EditorialModal>

      <ConfirmActionModal
        isOpen={!!activityToDeleteId}
        onClose={() => setActivityToDeleteId(null)}
        onConfirm={confirmDelete}
        title={language === 'es' ? 'Abandonar intención.' : 'Abandon intention.'}
        description={
          language === 'es'
            ? 'Esta intención saldrá de tu arquitectura activa de momentum.'
            : 'This intention will be removed from your active momentum architecture.'
        }
        confirmLabel={language === 'es' ? 'Abandonar' : 'Abandon'}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
