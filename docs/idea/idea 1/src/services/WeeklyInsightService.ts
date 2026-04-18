import { Habit, HabitLog, Objective, WeeklyInsight } from '../types';

interface JournalReflection {
  date: string;
  content: string;
}

export class WeeklyInsightService {
  constructor(private readonly _apiKey: string) {}

  async generateWeeklyInsight(
    habits: Habit[],
    logs: HabitLog[],
    objectives: Objective[],
    journalReflections: JournalReflection[],
  ): Promise<WeeklyInsight> {
    const completedLogs = logs.filter((log) => log.completed);
    const completionRate = habits.length > 0 ? Math.round((completedLogs.length / habits.length) * 100) : 0;
    const habitCounts = habits.map((habit) => ({
      name: habit.name,
      count: completedLogs.filter((log) => log.habitId === habit.id).length,
    }));
    const mostConsistentHabit =
      habitCounts.sort((a, b) => b.count - a.count)[0]?.name || 'Sin datos suficientes';
    const leastConsistentHabit =
      [...habitCounts].sort((a, b) => a.count - b.count)[0]?.name || 'Sin datos suficientes';
    const activeObjectives = objectives.filter((objective) => objective.status === 'active').length;
    const reflections = journalReflections.length;

    return {
      summary: `Registraste ${completedLogs.length} check-ins, ${reflections} reflexiones y mantienes ${activeObjectives} objetivos activos.`,
      patterns: [
        mostConsistentHabit === 'Sin datos suficientes'
          ? 'Aun no hay suficiente historial para detectar patrones.'
          : `Tu hábito más sólido fue ${mostConsistentHabit}.`,
        leastConsistentHabit === 'Sin datos suficientes'
          ? 'Todavía no hay un hábito rezagado claro.'
          : `Tu hábito con menor constancia fue ${leastConsistentHabit}.`,
      ],
      tips: [
        'Elige una sola prioridad crítica para la próxima semana.',
        'Cierra cada día con una reflexión breve para consolidar el progreso.',
      ],
      weeklyWisdom:
        reflections > 0
          ? 'Tu claridad crece cuando observas tu progreso con honestidad.'
          : 'Lo que no se revisa rara vez mejora con intención.',
      stats: {
        completionRate,
        mostConsistentHabit,
        leastConsistentHabit,
      },
      generatedAt: new Date(),
    };
  }
}
