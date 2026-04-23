import React from 'react';
import {
  Zap,
  Repeat,
  Target,
  BookOpen,
  LayoutGrid,
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ViewMode, Task, DayClosure, Objective } from '../types';
import { cn } from '../utils';

interface ViewHeaderProps {
  viewMode: ViewMode;
  streak: number;
  isDayClosed: (date: Date) => boolean;
  handleOpenCloseDayModal: () => void;
  filteredTasks: Task[];
  closedDays: DayClosure[];
  setIsObjectiveModalOpen: (open: boolean) => void;
  setObjectiveToEdit: (obj: Objective | undefined) => void;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  viewMode,
  streak,
  isDayClosed,
  handleOpenCloseDayModal,
  filteredTasks,
  closedDays,
  setIsObjectiveModalOpen,
  setObjectiveToEdit,
}) => {
  const isToday = viewMode === 'today';
  const today = new Date();

  return (
    <div className="flex flex-col gap-2">
      <div className="text-accent flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
        {viewMode === 'today' && <Zap className="h-3 w-3" />}
        {viewMode === 'habits' && <Repeat className="h-3 w-3" />}
        {viewMode === 'objectives' && <Target className="h-3 w-3" />}
        {viewMode === 'journal' && <BookOpen className="h-3 w-3" />}
        {viewMode === 'week' && <LayoutGrid className="h-3 w-3" />}
        {viewMode === 'month' && <CalendarIcon className="h-3 w-3" />}
        {viewMode === 'today' ? 'Ejecución' : viewMode.toUpperCase()}
      </div>
      <h2 className="text-4xl font-bold capitalize">
        {viewMode === 'today'
          ? 'Hoy'
          : viewMode === 'habits'
            ? 'Hábitos'
            : viewMode === 'objectives'
              ? 'Objetivos'
              : viewMode === 'journal'
                ? 'Diario'
                : viewMode}
      </h2>

      {isToday && (
        <div className="flex flex-col gap-6">
          {streak >= 7 && !isDayClosed(today) && (
            <div className="bg-accent/10 border-accent/20 animate-in fade-in slide-in-from-top-2 flex items-center justify-between gap-4 rounded-[24px] border p-4">
              <div className="flex items-center gap-3">
                <div className="bg-accent shadow-accent/20 flex h-10 w-10 items-center justify-center rounded-full shadow-lg">
                  <Flame className="text-bg-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">¡Estás en racha de {streak} días!</p>
                  <p className="text-text-muted text-[10px] tracking-widest uppercase">
                    ¿Qué tal un nuevo objetivo mensual?
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setObjectiveToEdit(undefined);
                  setIsObjectiveModalOpen(true);
                }}
                className="bg-accent text-bg-primary rounded-full px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-105"
              >
                Crear Objetivo
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-text-muted dark:text-[--dark-text-muted]">
              {filteredTasks.filter((t) => !t.completed).length} ítems prioritarios para hoy.
            </p>
            <button
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all',
                isDayClosed(today)
                  ? 'cursor-default bg-green-500/10 text-green-500'
                  : 'bg-accent/10 text-accent hover:bg-accent/20',
              )}
              onClick={isDayClosed(today) ? undefined : handleOpenCloseDayModal}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isDayClosed(today) ? 'Día Cerrado' : 'Cerrar Día'}
            </button>
          </div>

          {isDayClosed(today) && (
            <div className="bg-accent/5 border-accent/10 relative overflow-hidden rounded-[24px] border p-6">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BookOpen className="text-accent h-12 w-12" />
              </div>
              <div className="relative z-10">
                <p className="text-accent mb-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                  <BookOpen className="h-3 w-3" />
                  Resumen del día
                </p>
                <p className="text-text-primary text-sm font-medium italic dark:text-[--dark-text-primary]">
                  &quot;
                  {closedDays.find((d) => d.date === format(today, 'yyyy-MM-dd'))?.summary}
                  &quot;
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
