import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useHabits } from '../hooks/useHabits';
import { useObjectives } from '../hooks/useObjectives';
import { useDayClosure } from '../hooks/useDayClosure';
import { useGamification } from '../hooks/useGamification';
import { useJournalStore } from '../store/useJournalStore';
import { useUIStore } from '../store/useUIStore';
import { useTheme } from '../context/useTheme';
import { Habit, Objective, Task, ViewMode } from '../types';
import { cn } from '../utils';
import { calculateObjectiveProgress, shouldHabitOccurOnDate } from '../utils/habitUtils';
import { TaskModal } from '../components/TaskModal';
import { HabitModal } from '../components/HabitModal';
import { ObjectiveModal } from '../components/ObjectiveModal';
import { CloseDayModal } from '../components/CloseDayModal';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { Toast } from '../components/Toast';
import { Confetti } from '../components/Confetti';
import { feedback } from '../utils/feedback';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ViewHeader } from '../components/ViewHeader';
import { ViewManager } from '../components/ViewManager';
import { Atrium } from '../components/Atrium';
import { FocusChamber } from '../components/FocusChamber';
import { CeremonyChamber } from '../components/CeremonyChamber';

export type IterumModuleEvent =
  | { type: 'module_mounted' }
  | { type: 'view_changed'; view: ViewMode }
  | { type: 'task_saved'; entityType: Task['type'] }
  | { type: 'habit_logged'; habitId: string };

export interface IterumModuleProps {
  initialView?: ViewMode;
  className?: string;
  onEvent?: (event: IterumModuleEvent) => void;
}

export default function IterumModule({
  initialView = 'today',
  className,
  onEvent,
}: IterumModuleProps = {}) {
  const {
    viewMode,
    setViewMode,
    focusedTaskId,
    setFocusState,
    toast,
    setToast,
    closeToast,
  } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [captureType, setCaptureType] = useState<'task' | 'habit' | 'objective' | 'journal'>('task');
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [objectiveToEdit, setObjectiveToEdit] = useState<Objective | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLevelUp = (level: number) => {
    feedback.celebrate();
    setToast({
      isOpen: true,
      title: '¡Nivel Completado!',
      message: `Has alcanzado el Nivel ${level}. Sigue así, Junior.`,
    });
  };

  const { stats, addExp, completeOnboarding } = useGamification({ onLevelUp: handleLevelUp });
  const { closedDays, isDayClosed, closeDay, calculateStreak, weeklyInsights } = useDayClosure();
  const { habits, logs, addHabit, updateHabit, toggleHabitLog: toggleHabitLogBase } = useHabits();
  const { objectives, addObjective, updateObjective } = useObjectives();
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const addJournal = useJournalStore((state) => state.addJournal);

  useEffect(() => {
    setViewMode(initialView);
  }, [initialView, setViewMode]);

  useEffect(() => {
    onEvent?.({ type: 'module_mounted' });
  }, [onEvent]);

  useEffect(() => {
    onEvent?.({ type: 'view_changed', view: viewMode });
  }, [onEvent, viewMode]);

  const toggleHabitLog = (habitId: string, date: Date, value?: number, note?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find((log) => log.habitId === habitId && log.date === dateStr);

    if (!existingLog) {
      addExp(10, 'discipline');
      feedback.success();
    } else if (note && !existingLog.note) {
      addExp(8, 'consistency');
    }

    toggleHabitLogBase(habitId, date, value, note);
    onEvent?.({ type: 'habit_logged', habitId });
  };

  const objectivesWithProgress = useMemo(
    () =>
      objectives.map((objective) => {
        const currentValue = calculateObjectiveProgress(objective, habits, logs);
        return {
          ...objective,
          currentValue,
          progress:
            objective.targetValue > 0
              ? Math.min(100, Math.round((currentValue / objective.targetValue) * 100))
              : 0,
        };
      }),
    [objectives, habits, logs],
  );

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredHabits = habits.filter(
    (habit) =>
      habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      habit.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredObjectives = objectivesWithProgress.filter(
    (objective) =>
      objective.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      objective.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const todayHabits = habits.filter(
    (habit) => habit.isActive && shouldHabitOccurOnDate(habit.frequency, new Date()),
  );
  const streak = calculateStreak();

  const openCapture = (type: 'task' | 'habit' | 'objective' | 'journal' = 'task') => {
    setSelectedDate(new Date());
    setCaptureType(type);
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCaptureType('task');
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCaptureType(task.type);
    setIsTaskModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setObjectiveToEdit(objective);
    setIsObjectiveModalOpen(true);
  };

  const handleConfirmCloseDay = async () => {
    const result = await closeDay(new Date(), habits, logs, tasks, updateTask, addTask);
    if (result) {
      addExp(25, 'consistency');
    }
    return result;
  };

  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt'> & {
      habitData?: Partial<Habit>;
      objectiveData?: Partial<Objective>;
    },
  ) => {
    onEvent?.({ type: 'task_saved', entityType: taskData.type });

    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
      return;
    }

    if (taskData.type === 'journal') {
      void addJournal([taskData.title, taskData.description].filter(Boolean).join('\n\n'));
      return;
    }

    if (taskData.type === 'habit') {
      addHabit({
        name: taskData.title,
        description: taskData.description,
        frequency: taskData.habitData?.frequency || 'daily',
        type: taskData.habitData?.type || 'yesno',
        targetValue: taskData.habitData?.targetValue,
        unit: taskData.habitData?.unit,
        color: taskData.color,
      });
      return;
    }

    if (taskData.type === 'objective') {
      void addObjective({
        title: taskData.title,
        description: taskData.description,
        targetValue: taskData.objectiveData?.targetValue || 100,
        currentValue: 0,
        unit: taskData.objectiveData?.unit || '%',
        deadline: taskData.objectiveData?.deadline,
        color: taskData.color,
        status: 'active',
        progress: 0,
      });
      return;
    }

    addTask(taskData);
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'isActive' | 'createdAt'>) => {
    if (habitToEdit) {
      updateHabit(habitToEdit.id, habitData);
      return;
    }

    addHabit(habitData);
  };

  const handleSaveObjective = (objectiveData: Omit<Objective, 'id' | 'createdAt'>) => {
    if (objectiveToEdit) {
      void updateObjective(objectiveToEdit.id, objectiveData);
      return;
    }

    void addObjective(objectiveData);
  };

  return (
    <div
      className={cn(
        'bg-bg-primary text-text-primary min-h-screen font-sans transition-all duration-700 dark:bg-[--dark-bg-primary] dark:text-[--dark-text-primary]',
        className,
      )}
    >
      <FocusChamber
        task={tasks.find((task) => task.id === focusedTaskId) || undefined}
        onComplete={(id) => {
          toggleTask(id);
          setTimeout(() => setFocusState('idle'), 1200);
        }}
      />

      <CeremonyChamber />

      {viewMode !== 'today' && (
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          toggleTheme={toggleTheme}
          onNewObjective={() => {
            setObjectiveToEdit(undefined);
            setIsObjectiveModalOpen(true);
          }}
          onCapture={() => openCapture('task')}
        />
      )}

      <main
        className={cn(
          'mx-auto w-full transition-all duration-700',
          viewMode === 'today' ? 'max-w-none px-0 pt-0' : 'max-w-6xl px-6 py-10',
        )}
      >
        {viewMode === 'today' ? (
          <Atrium
            tasks={filteredTasks}
            habits={todayHabits}
            habitLogs={logs}
            streak={streak}
            onOpenHabits={() => setViewMode('habits')}
            onOpenObjectives={() => setViewMode('objectives')}
            onOpenJournal={() => setViewMode('journal')}
            onNewTask={() => openCapture('task')}
            onNewHabit={() => openCapture('habit')}
            onNewObjective={() => openCapture('objective')}
            onTaskSelect={handleEditTask}
            onHabitToggle={(id) => toggleHabitLog(id, new Date())}
            onHabitSelect={handleEditHabit}
          />
        ) : (
          <div className="flex flex-col gap-10">
            <ViewHeader
              viewMode={viewMode}
              streak={streak}
              isDayClosed={isDayClosed}
              handleOpenCloseDayModal={() => setIsCloseDayModalOpen(true)}
              filteredTasks={filteredTasks}
              closedDays={closedDays}
              setIsObjectiveModalOpen={setIsObjectiveModalOpen}
              setObjectiveToEdit={setObjectiveToEdit}
            />

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <ViewManager
                viewMode={viewMode}
                filteredHabits={filteredHabits}
                filteredObjectives={filteredObjectives}
                filteredTasks={filteredTasks}
                todayHabits={todayHabits}
                habits={habits}
                logs={logs}
                weeklyInsights={weeklyInsights}
                stats={stats}
                toggleHabitLog={toggleHabitLog}
                handleEditHabit={handleEditHabit}
                handleEditObjective={handleEditObjective}
                handleEditTask={handleEditTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                handleDateSelect={handleDateSelect}
              />

              <Sidebar
                stats={stats}
                objectivesWithProgress={objectivesWithProgress}
                objectives={objectives}
                setViewMode={setViewMode}
                isFocusMode={false}
                setIsFocusMode={() => {}}
                habits={habits}
                logs={logs}
                tasks={tasks}
                closedDays={closedDays}
                weeklyInsights={weeklyInsights}
              />
            </div>
          </div>
        )}
      </main>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTimeout(() => setTaskToEdit(undefined), 200);
        }}
        onSave={handleSaveTask}
        initialDate={selectedDate}
        initialType={captureType}
        taskToEdit={taskToEdit}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setTimeout(() => setHabitToEdit(undefined), 200);
        }}
        onSave={handleSaveHabit}
        habitToEdit={habitToEdit}
      />

      <ObjectiveModal
        key={`${isObjectiveModalOpen ? 'open' : 'closed'}-${objectiveToEdit?.id ?? 'new'}`}
        isOpen={isObjectiveModalOpen}
        onClose={() => {
          setIsObjectiveModalOpen(false);
          setTimeout(() => setObjectiveToEdit(undefined), 200);
        }}
        onSave={handleSaveObjective}
        objectiveToEdit={objectiveToEdit}
      />

      <CloseDayModal
        isOpen={isCloseDayModalOpen}
        onClose={() => setIsCloseDayModalOpen(false)}
        onConfirm={handleConfirmCloseDay}
      />

      {viewMode !== 'today' && (
        <div className="fixed right-6 bottom-8 z-40 sm:hidden">
          <button
            onClick={() => openCapture('task')}
            className="bg-accent text-bg-primary flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-90"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>
      )}

      {!stats.onboardingCompleted && <OnboardingWizard onComplete={completeOnboarding} />}

      <Confetti />

      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        title={toast.title}
        message={toast.message}
      />
    </div>
  );
}
