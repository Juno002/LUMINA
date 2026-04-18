import React, { useState } from 'react';
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { Task, Habit, HabitLog } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Focus, Repeat } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../utils';
import { feedback } from '../utils/feedback';
import { UniversalForge } from './UniversalForge';

function ForgeTaskItem({ task, onSelect }: { task: Task; onSelect: (task: Task) => void }) {
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const x = useMotionValue(0);
  const backgroundColor = useTransform(x, [0, 150], ['rgba(0,0,0,0)', 'rgba(21, 61, 36, 0.4)']);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 120) {
      feedback.success();
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);
      toggleTask(task.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative -mx-4 overflow-hidden rounded-2xl"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center px-6"
        style={{ opacity: useTransform(x, [0, 80], [0, 1]) }}
      >
        <span className="text-[10px] font-bold tracking-widest text-[#c9935a] uppercase">
          [ COMPLETAR ]
        </span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor }}
        className="group relative z-10 flex cursor-pointer flex-col gap-1 rounded-2xl p-4 transition-colors hover:bg-bg-secondary"
        onClick={() => onSelect(task)}
      >
        <h3 className={cn('text-lg font-medium', task.completed && 'line-through opacity-50')}>
          {task.title}
        </h3>
        {task.description && (
          <p className="line-clamp-1 text-sm text-text-muted">{task.description}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

interface AtriumProps {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  streak: number;
  onOpenHabits: () => void;
  onOpenObjectives: () => void;
  onOpenJournal: () => void;
  onNewTask: () => void;
  onNewHabit: () => void;
  onNewObjective: () => void;
  onTaskSelect: (task: Task) => void;
  onHabitToggle: (id: string) => void;
  onHabitSelect: (habit: Habit) => void;
}

export function Atrium({
  tasks,
  habits,
  habitLogs,
  streak,
  onOpenHabits,
  onOpenObjectives,
  onOpenJournal,
  onNewTask,
  onNewHabit,
  onNewObjective,
  onTaskSelect,
  onHabitToggle,
  onHabitSelect,
}: AtriumProps) {
  const { focusState, focusedTaskId, setFocusState } = useUIStore();
  const { scrollY } = useScroll();
  const [isFabExpanded, setIsFabExpanded] = useState(true);

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (current > previous && current > 50) {
      setIsFabExpanded(false);
    } else {
      setIsFabExpanded(true);
    }
  });

  const masterTask = tasks.find((t) => t.id === focusedTaskId);
  const forgeTasks = tasks.filter((t) => !t.completed && t.type === 'task' && t.id !== focusedTaskId);
  const todayHabits = habits.slice(0, 4);
  const todayStr = new Date().toISOString().split('T')[0];
  const completedHabitsToday = habits.filter((habit) =>
    habitLogs.some((log) => log.habitId === habit.id && log.date === todayStr && log.completed),
  ).length;

  return (
    <div className="relative min-h-screen pb-32">
      <header className="flex w-full items-center justify-between px-6 pt-12 pb-6">
        <div className="text-[10px] font-bold tracking-[0.15em] text-text-muted uppercase">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-[1px] w-12 bg-accent opacity-50" />
          <div className="text-[10px] font-bold tracking-[0.15em] text-accent uppercase">
            Racha de {streak} días
          </div>
        </div>
      </header>

      <section className="flex min-h-[40vh] flex-col items-center justify-center px-6 pt-10 pb-20">
        <div className="mb-8 w-full max-w-md rounded-[28px] border border-border-subtle bg-bg-secondary/60 p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-[0.18em] text-text-muted uppercase">
            Empieza aquí
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-primary">
            Crea una tarea, un hábito o una meta desde esta pantalla. Lo importante del día debería
            verse claro apenas entras.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[18px] bg-bg-primary px-3 py-3 text-center">
              <p className="text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase">Tareas</p>
              <p className="mt-1 text-lg font-bold text-text-primary">{forgeTasks.length}</p>
            </div>
            <div className="rounded-[18px] bg-bg-primary px-3 py-3 text-center">
              <p className="text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase">Hábitos</p>
              <p className="mt-1 text-lg font-bold text-text-primary">
                {completedHabitsToday}/{habits.length}
              </p>
            </div>
            <div className="rounded-[18px] bg-bg-primary px-3 py-3 text-center">
              <p className="text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase">Foco</p>
              <p className="mt-1 text-lg font-bold text-text-primary">{masterTask ? '1' : '0'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onNewTask}
              className="rounded-full bg-accent px-4 py-2 text-[11px] font-bold tracking-[0.15em] text-bg-primary uppercase"
            >
              Nueva tarea
            </button>
            <button
              onClick={onNewHabit}
              className="rounded-full border border-border-subtle bg-bg-primary px-4 py-2 text-[11px] font-bold tracking-[0.15em] text-text-primary uppercase"
            >
              Nuevo hábito
            </button>
            <button
              onClick={onNewObjective}
              className="rounded-full border border-border-subtle bg-bg-primary px-4 py-2 text-[11px] font-bold tracking-[0.15em] text-text-primary uppercase"
            >
              Nueva meta
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onOpenHabits}
              className="rounded-full border border-border-subtle px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase"
            >
              Ver hábitos
            </button>
            <button
              onClick={onOpenObjectives}
              className="rounded-full border border-border-subtle px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase"
            >
              Ver metas
            </button>
            <button
              onClick={onOpenJournal}
              className="rounded-full border border-border-subtle px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-text-muted uppercase"
            >
              Abrir diario
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {masterTask ? (
            <motion.div
              layoutId={masterTask.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm"
              style={{ zIndex: focusState === 'entering' || focusState === 'exiting' ? 100 : 10 }}
              onPanStart={() => setFocusState('entering', masterTask.id)}
              onPanEnd={() => setFocusState('idle', masterTask.id)}
            >
              <div
                className="iterum-card flex cursor-pointer flex-col items-center gap-4 text-center select-none [-webkit-touch-callout:none]"
                onContextMenu={(e) => e.preventDefault()}
              >
                <span className="text-[10px] font-bold tracking-[0.15em] text-accent uppercase">
                  Tarea principal
                </span>
                <h2 className="text-2xl leading-tight font-bold tracking-tight font-sans">
                  {masterTask.title}
                </h2>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-primary text-text-muted">
                  <Focus className="h-5 w-5" />
                </div>
                <p className="mt-2 text-[10px] tracking-widest text-text-muted uppercase">
                  Mantén presionado para entrar en modo foco
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="iterum-card w-full max-w-md cursor-pointer text-center"
              onClick={onNewTask}
            >
              <p className="text-[10px] font-bold tracking-[0.18em] text-text-muted uppercase">
                Sin tarea principal
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight">Define lo más importante del día</h2>
              <p className="mt-2 text-sm text-text-muted">
                Empieza por una tarea clara y la verás destacada aquí.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-8 px-6 pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-border-subtle" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
              Hábitos de hoy
            </span>
            <div className="h-[1px] flex-1 bg-border-subtle" />
          </div>

          {todayHabits.length > 0 ? (
            <div className="space-y-3">
              {todayHabits.map((habit) => {
                const completedToday = habitLogs.some(
                  (log) => log.habitId === habit.id && log.date === todayStr && log.completed,
                );

                return (
                  <button
                    key={habit.id}
                    onClick={() => onHabitSelect(habit)}
                    className="iterum-card flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">{habit.name}</p>
                      <p className="mt-1 text-[10px] font-bold tracking-[0.15em] text-text-muted uppercase">
                        {completedToday ? 'Completado hoy' : 'Toca hacerlo hoy'}
                      </p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onHabitToggle(habit.id);
                      }}
                      className={cn(
                        'ml-4 flex h-11 w-11 items-center justify-center rounded-2xl border transition-all',
                        completedToday
                          ? 'border-accent bg-accent text-bg-primary'
                          : 'border-border-subtle bg-bg-secondary text-text-muted',
                      )}
                    >
                      {completedToday ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Repeat className="h-5 w-5" />
                      )}
                    </button>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="iterum-card border-dashed p-6 text-center">
              <p className="text-sm text-text-muted">
                No tienes hábitos activos para hoy. Crea uno y aparecerá aquí.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-border-subtle" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
            Tareas pendientes
          </span>
          <div className="h-[1px] flex-1 bg-border-subtle" />
        </div>

        <div className="space-y-6">
          {forgeTasks.map((task) => (
            <ForgeTaskItem key={task.id} task={task} onSelect={onTaskSelect} />
          ))}
          {forgeTasks.length === 0 && (
            <div className="iterum-card border-dashed py-8 text-center">
              <p className="text-sm text-text-muted">
                No tienes tareas pendientes. Usa el botón de abajo para capturar algo nuevo.
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {(masterTask?.completed || new Date().getHours() >= 20) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex w-full justify-center pt-16 pb-10"
            >
              <button
                onClick={() => {
                  setFocusState('idle');
                  useUIStore.getState().setCeremonyState('entering');
                }}
                className="flex cursor-pointer flex-col items-center gap-3 text-text-muted transition-colors duration-700 ease-out hover:text-accent select-none"
              >
                <div className="h-0.5 w-12 bg-current opacity-20" />
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase">
                  [ SELLAR LA JORNADA ]
                </h2>
                <div className="h-0.5 w-12 bg-current opacity-20" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <UniversalForge isFabExpanded={isFabExpanded} />
    </div>
  );
}
