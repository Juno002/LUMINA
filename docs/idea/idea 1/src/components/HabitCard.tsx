import React, { useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Target,
  Edit2,
  MoreVertical,
  MessageSquare,
  Save,
} from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { cn } from '../utils';
import { calculateCurrentStreak } from '../utils/habitUtils';
import { motion, AnimatePresence } from 'motion/react';
import { feedback } from '../utils/feedback';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onAddNote?: (id: string, note: string) => void;
  compact?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  logs,
  onToggle,
  onEdit,
  onAddNote,
  compact = false,
}) => {
  const [isReflecting, setIsReflecting] = useState(false);
  const [note, setNote] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);

  const streak = calculateCurrentStreak(logs, habit);
  const todayStr = new Date().toISOString().split('T')[0];
  const currentLog = logs.find((l) => l.habitId === habit.id && l.date === todayStr);
  const isCompletedToday = currentLog?.completed || false;

  const handleToggle = () => {
    if (!isCompletedToday) {
      // Completing — play success
      feedback.success();
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);

      // Check for streak milestones
      const nextStreak = streak + 1;
      if ([7, 14, 30, 60, 100].includes(nextStreak)) {
        setTimeout(() => feedback.celebrate(), 400);
      } else if (nextStreak >= 3 && nextStreak % 3 === 0) {
        setTimeout(() => feedback.streak(), 300);
      }
    } else {
      // Uncompleting — play undo
      feedback.undo();
    }
    onToggle(habit.id);
  };

  const handleSaveNote = () => {
    if (onAddNote) {
      feedback.tap();
      onAddNote(habit.id, note);
      setIsReflecting(false);
    }
  };

  const [prevLogId, setPrevLogId] = useState<string | undefined>(currentLog?.id);
  if (currentLog?.id !== prevLogId) {
    setNote(currentLog?.note || '');
    setPrevLogId(currentLog?.id);
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="iterum-card flex items-center justify-between border-none p-4 transition-all hover:translate-x-1"
      >
        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleToggle}
            className="flex-shrink-0"
            whileTap={{ scale: 0.85 }}
          >
            {isCompletedToday ? (
              <motion.div
                className="bg-accent shadow-accent/20 flex h-8 w-8 items-center justify-center rounded-full shadow-lg"
                initial={justCompleted ? { scale: 0 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <CheckCircle2 className="text-bg-primary h-5 w-5" />
              </motion.div>
            ) : (
              <div className="border-border-subtle hover:border-accent h-8 w-8 rounded-full border-2 transition-colors" />
            )}
          </motion.button>
          <div>
            <h4
              className={cn(
                'text-sm font-bold transition-all duration-300',
                isCompletedToday && 'text-text-muted line-through',
              )}
            >
              {habit.name}
            </h4>
            <div className="text-text-muted flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
              <motion.div
                animate={
                  streak > 3
                    ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: streak > 7 ? Infinity : 0, repeatDelay: 3 }}
              >
                <Flame className={cn('h-3 w-3', streak > 0 ? 'text-accent' : 'text-text-muted')} />
              </motion.div>
              {streak} días
            </div>
          </div>
        </div>
        {isCompletedToday && onAddNote && (
          <button
            onClick={() => {
              feedback.tap();
              setIsReflecting(!isReflecting);
            }}
            className={cn(
              'rounded-full p-2 transition-colors',
              currentLog?.note ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent',
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="iterum-card group relative flex flex-col gap-4 overflow-hidden p-6"
    >
      {/* Completion pulse ring */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            className="bg-accent/10 absolute inset-0 rounded-[32px]"
            initial={{ opacity: 0.6, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{habit.name}</h3>
            {habit.category && (
              <span className="bg-accent/10 text-accent border-accent/20 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                {habit.category}
              </span>
            )}
          </div>
          <p className="text-text-muted text-xs font-medium tracking-widest uppercase">
            {habit.frequency === 'daily' ? 'Cada día' : habit.frequency}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCompletedToday && (
            <button
              onClick={() => {
                feedback.tap();
                setIsReflecting(!isReflecting);
              }}
              className={cn(
                'rounded-full p-2 transition-all',
                currentLog?.note
                  ? 'text-accent bg-accent/10'
                  : 'text-text-muted hover:text-accent opacity-0 group-hover:opacity-100',
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              feedback.tap();
              onEdit(habit);
            }}
            className="text-text-muted hover:text-accent p-2 opacity-0 transition-all group-hover:opacity-100"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="text-text-muted hover:text-accent p-2">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isReflecting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-end gap-2 pt-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="¿Cómo te sentiste hoy con este hábito?"
                className="iterum-input h-20 flex-1 resize-none py-2 text-sm"
                autoFocus
              />
              <button
                onClick={handleSaveNote}
                className="bg-accent text-bg-primary rounded-[12px] p-3 transition-all hover:opacity-90"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex items-end justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase',
              streak > 0 ? 'bg-accent/10 text-accent' : 'bg-bg-secondary text-text-muted',
            )}
            animate={
              streak >= 7
                ? {
                    boxShadow: [
                      '0 0 0px rgba(200,149,108,0)',
                      '0 0 12px rgba(200,149,108,0.4)',
                      '0 0 0px rgba(200,149,108,0)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={
                streak > 3
                  ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
                  : {}
              }
              transition={{
                duration: 0.6,
                repeat: streak > 7 ? Infinity : 0,
                repeatDelay: 2,
              }}
            >
              <Flame className="h-4 w-4" />
            </motion.div>
            {streak} días racha
          </motion.div>

          <div className="bg-bg-secondary text-text-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase">
            <Target className="h-4 w-4" />
            {habit.type === 'numeric' ? `${habit.targetValue} ${habit.unit}` : 'Check'}
          </div>
        </div>

        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-500',
            isCompletedToday
              ? 'bg-accent text-bg-primary shadow-accent/30 scale-95'
              : 'bg-bg-secondary text-text-muted hover:bg-accent/10 hover:text-accent border-border-subtle border',
          )}
        >
          {isCompletedToday ? (
            <motion.div
              initial={justCompleted ? { scale: 0, rotate: -180 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-current" />
          )}
        </motion.button>
      </div>

      {/* Progress Bar for Numeric Habits */}
      {habit.type === 'numeric' && (
        <div className="bg-bg-secondary mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <motion.div
            className="bg-accent h-full"
            initial={{ width: '0%' }}
            animate={{ width: isCompletedToday ? '100%' : '0%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
    </motion.div>
  );
};
