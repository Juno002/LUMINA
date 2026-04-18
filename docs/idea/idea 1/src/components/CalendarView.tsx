import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function CalendarView({ tasks, onDateSelect, onToggle, onEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'MMMM yyyy';
  const days = [];
  let day = startDate;
  let formattedDate = '';

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, 'd');
      const cloneDay = day;
      const dayTasks = tasks.filter((task) => isSameDay(task.date, cloneDay));

      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateSelect(cloneDay)}
          className={cn(
            'group relative min-h-[120px] cursor-pointer border-r border-b border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50',
            !isSameMonth(day, monthStart)
              ? 'bg-zinc-50/50 text-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-600'
              : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100',
            isToday(day) && 'bg-indigo-50/30 dark:bg-indigo-500/5',
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                isToday(day) ? 'bg-indigo-600 text-white' : '',
              )}
            >
              {formattedDate}
            </span>
            <button className="p-1 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="scrollbar-hide mt-2 max-h-[80px] space-y-1 overflow-y-auto">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className={cn(
                  'truncate rounded-md px-1.5 py-1 text-xs transition-all',
                  task.completed
                    ? 'bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-500'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                )}
                style={
                  !task.completed && task.color ? { borderLeft: `3px solid ${task.color}` } : {}
                }
              >
                {format(task.date, 'HH:mm')} {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                +{dayTasks.length - 3} más
              </div>
            )}
          </div>
        </div>,
      );
      day = addDays(day, 1);
    }
  }

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="iterum-card shadow-accent/5 overflow-hidden border-none p-0 shadow-xl">
      <div className="border-border-subtle flex items-center justify-between border-b px-8 py-6 dark:border-[--dark-border-subtle]">
        <h2 className="text-text-primary text-2xl font-bold capitalize dark:text-[--dark-text-primary]">
          {format(currentDate, dateFormat, { locale: es })}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="hover:bg-bg-primary text-text-muted rounded-[12px] p-2.5 transition-colors dark:hover:bg-[--dark-bg-primary]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-accent hover:bg-accent/10 rounded-[12px] px-4 py-2 text-sm font-bold transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="hover:bg-bg-primary text-text-muted rounded-[12px] p-2.5 transition-colors dark:hover:bg-[--dark-bg-primary]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-bg-primary/30 grid grid-cols-7 dark:bg-[--dark-bg-primary]/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-text-muted py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{days}</div>
    </div>
  );
}
