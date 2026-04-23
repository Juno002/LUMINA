/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronRight,
  Clock,
  Hash,
  Plus,
  Settings2,
  Trash2
} from 'lucide-react';
import { Habit } from '../../../../domain/entities';
import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface HabitCardProps {
  key?: string | number;
  currentValue: number;
  habit: Habit;
  isCompleted: boolean;
  linkedGoalTitle?: string;
  onAdjustValue: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export default function HabitCard({
  currentValue,
  habit,
  isCompleted,
  linkedGoalTitle,
  onAdjustValue,
  onDelete,
  onToggle
}: HabitCardProps) {
  const { t } = useTranslation();
  const progress = habit.targetValue ? Math.min(100, (currentValue / habit.targetValue) * 100) : 0;
  const TypeIcon = habit.type === 'numeric' ? Hash : habit.type === 'timer' ? Clock : Check;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="group flex flex-col gap-6 rounded-[2rem] border border-ink/10 bg-paper p-8 transition-all hover:shadow-xl hover:shadow-ink/[0.02]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onToggle}
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-500 ${
              isCompleted
                ? 'border-ink bg-ink text-paper shadow-lg shadow-ink/10'
                : 'border-ink/10 text-ink/10 hover:border-ink/30'
            }`}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -24 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
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
            <div className="mb-1 flex items-center gap-2">
              <TypeIcon size={12} className="text-accent" />
              <span className="editorial-meta text-[9px] uppercase tracking-tighter opacity-50">
                {t(`habits.type_${habit.type}`)}
              </span>
            </div>
            <h3
              className={`font-serif text-2xl italic leading-none transition-all ${
                isCompleted ? 'line-through opacity-30' : ''
              }`}
            >
              {habit.name}
            </h3>
            {habit.linkedGoalId && (
              <span className="mt-2 w-fit rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                {t('habits.linked_aim')}: {linkedGoalTitle || t('habits.goal_fallback')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onDelete}
            className="p-2 text-red-500/30 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
          <div className="editorial-rule hidden h-8 w-px bg-ink/5 md:block"></div>
          <ChevronRight size={18} className="text-accent opacity-20 transition-all group-hover:opacity-100" />
        </div>
      </div>

      {(habit.type === 'numeric' || habit.type === 'timer') && (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="editorial-meta text-[10px] uppercase opacity-40">{t('habits.progress')}</span>
              <span className="font-serif text-xl italic">
                {currentValue} / {habit.targetValue}{' '}
                <span className="editorial-meta text-[10px] not-italic opacity-40">{habit.unit}</span>
              </span>
            </div>
            <button
              onClick={onAdjustValue}
              className="font-mono text-[9px] uppercase tracking-widest text-accent transition-colors hover:text-ink"
            >
              {t('habits.adjust_value')}
            </button>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink/5">
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
}
