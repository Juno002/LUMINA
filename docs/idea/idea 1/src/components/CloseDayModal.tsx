import { useState } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { DayClosure } from '../types';
import { cn } from '../utils';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';

interface CloseDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<DayClosure | null>;
}

export function CloseDayModal({ isOpen, onClose, onConfirm }: CloseDayModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [closure, setClosure] = useState<DayClosure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter((t) => format(t.date, 'yyyy-MM-dd') === todayStr);
  const todayLogs = logs.filter((l) => l.date === todayStr);

  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTasks = todayTasks.filter((t) => !t.completed).length;

  const completedHabits = habits.filter((h) =>
    todayLogs.find((l) => l.habitId === h.id && l.completed),
  ).length;
  // We don't easily know total habits for today here without the utility,
  // but we can just show completed vs pending tasks for now.

  const handleCloseDay = async () => {
    setIsClosing(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (result) {
        setClosure(result);
      } else {
        setError('El día ya está cerrado o hubo un error.');
      }
    } catch (e) {
      console.error('Close day failed', e);
      setError('No se pudo cerrar el día. Inténtalo de nuevo.');
    } finally {
      setIsClosing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-primary/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md dark:bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-primary border-border-subtle w-full max-w-lg overflow-hidden rounded-[32px] border shadow-2xl dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-primary]"
        onClick={(e) => e.stopPropagation()}
      >
        {!closure ? (
          <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Cerrar Jornada</h2>
                <p className="text-text-muted text-sm">
                  Repasa tu progreso antes de archivar el día.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-accent bg-bg-secondary rounded-[12px] p-2 transition-colors dark:bg-[--dark-bg-secondary]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-secondary border-border-subtle space-y-2 rounded-[20px] border p-4 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]">
                <div className="text-accent flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Completado
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{completedTasks + completedHabits}</span>
                  <span className="text-text-muted text-xs">ítems</span>
                </div>
              </div>
              <div className="bg-bg-secondary border-border-subtle space-y-2 rounded-[20px] border p-4 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]">
                <div className="text-accent-secondary flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Pendiente</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{pendingTasks}</span>
                  <span className="text-text-muted text-xs">ítems</span>
                </div>
              </div>
            </div>

            {pendingTasks > 0 && (
              <div className="bg-accent/5 border-accent/10 flex items-start gap-3 rounded-[20px] border p-4">
                <ArrowRight className="text-accent mt-0.5 h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Migración Automática</p>
                  <p className="text-text-muted text-xs">
                    {pendingTasks} tareas pendientes se moverán a mañana con el indicador
                    &quot;retrasado&quot;.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-[16px] bg-red-500/10 p-4 text-sm font-medium text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleCloseDay}
                disabled={isClosing}
                className={cn(
                  'iterum-button-primary flex w-full items-center justify-center gap-3 py-4 text-base',
                  isClosing && 'cursor-not-allowed opacity-70',
                )}
              >
                {isClosing ? (
                  <>
                    <div className="border-bg-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                    Cerrando día...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Cerrar Jornada
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-[16px]">
                  <CheckCircle2 className="text-accent h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold tracking-tight">Día Completado</h2>
                  <p className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                    {format(new Date(closure.date), 'dd MMMM yyyy')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-accent bg-bg-secondary rounded-[12px] p-2 transition-colors dark:bg-[--dark-bg-secondary]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-bg-secondary border-border-subtle relative overflow-hidden rounded-[24px] border p-6 dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]">
              <div className="relative z-10 space-y-4">
                <p className="text-text-primary text-lg leading-relaxed font-medium italic dark:text-[--dark-text-primary]">
                  &quot;{closure.summary}&quot;
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-accent flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                <CheckCircle2 className="h-4 w-4" />
                Día Archivado con Éxito
              </div>
              <p className="text-text-muted text-sm">
                Tus tareas pendientes han sido migradas y tu racha ha sido actualizada. ¡Descansa,
                te lo has ganado!
              </p>
            </div>

            <button onClick={onClose} className="iterum-button-primary w-full py-4 text-base">
              Entendido
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
