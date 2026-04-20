/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from "motion/react";
import { Circle, CheckCircle2 } from "lucide-react";
import { ActivationActivity, Habit, Goal } from "../../../../domain/entities";
import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface ActivityItemProps {
  activity: ActivationActivity;
  linkedHabit?: Habit;
  linkedGoal?: Goal;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * ActivityItem Component:
 * Un ítem de activación conductual. Mantiene el contrato de la tarea.
 */
const ActivityItem: React.FC<ActivityItemProps> = ({ activity, linkedHabit, linkedGoal, onToggle, onDelete }) => {
  const { t, language } = useTranslation();

  return (
    <motion.div 
      layout
      className="p-6 border border-ink/10 rounded-2xl flex items-center justify-between group hover:border-ink/20 transition-all bg-paper"
    >
      <div className="flex flex-col gap-1">
        <h4 className={`font-serif text-xl ${activity.completed ? 'opacity-30 line-through' : ''}`}>
          {activity.title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 mt-1">
            {!activity.completed ? (
              <>
                <span className="editorial-meta text-[8px] uppercase text-accent border border-ink/5 rounded px-1.5 py-0.5">
                  {t('momentum.compare_anticipated')}{language === 'es' ? 'Alegría' : 'Joy'}: {activity.value}/10
                </span>
                <span className="editorial-meta text-[8px] uppercase text-accent border border-ink/5 rounded px-1.5 py-0.5">
                  {t('momentum.compare_anticipated')}{language === 'es' ? 'Esfuerzo' : 'Effort'}: {activity.difficulty}/10
                </span>
              </>
            ) : (
              <>
                <span className="editorial-meta text-[8px] uppercase text-emerald-500 border border-emerald-500/10 rounded px-1.5 py-0.5">
                  {t('momentum.compare_actual')}{language === 'es' ? 'Alegría' : 'Joy'}: {activity.actualValue}/10
                </span>
                <span className="editorial-meta text-[8px] uppercase text-amber-500 border border-amber-500/10 rounded px-1.5 py-0.5">
                  {t('momentum.compare_actual')}{language === 'es' ? 'Esfuerzo' : 'Effort'}: {activity.actualDifficulty}/10
                </span>
                <span className="editorial-meta text-[8px] uppercase text-accent/30 italic ml-1">
                  ({language === 'es' ? 'Plan' : 'Plan'}: {activity.value}v / {activity.difficulty}d)
                </span>
              </>
            )}
            {linkedHabit && (
              <span className="editorial-meta text-[8px] uppercase text-ink bg-ink/5 rounded px-1.5 py-0.5">
                {language === 'es' ? 'Hábito' : 'Habit'}: {linkedHabit.name}
              </span>
            )}
            {linkedGoal && (
              <span className="editorial-meta text-[8px] uppercase text-ink bg-ink/5 rounded px-1.5 py-0.5">
                {t('habits.linked_aim')}: {linkedGoal.title}
              </span>
            )}
        </div>
        {!activity.completed && (
          <button 
            onClick={onDelete} 
            className="editorial-meta text-[8px] text-red-500/0 md:group-hover:text-red-500/50 transition-all text-left uppercase mt-2"
          >
            {language === 'es' ? 'Abandonar intención' : 'Abandon task'}
          </button>
        )}
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
          activity.completed 
            ? "border-ink bg-ink text-paper" 
            : "border-ink/10 group-hover:border-ink text-ink/20 group-hover:text-accent"
        }`}
      >
        {activity.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
    </motion.div>
  );
};

export default ActivityItem;
