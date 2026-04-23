/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface WeeklyHistoryPoint {
  date: string;
  percentage: number;
}

interface WeeklyConsistencyHeatmapProps {
  today: string;
  weeklyHistory: WeeklyHistoryPoint[];
}

export default function WeeklyConsistencyHeatmap({
  today,
  weeklyHistory
}: WeeklyConsistencyHeatmapProps) {
  const { language } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-ink/5 bg-paper p-8">
      <div className="flex items-center justify-between">
        <div className="editorial-meta">
          {language === 'es' ? 'Consistencia Semanal / Mapa de Calor' : 'Weekly Consistency / Heatmap'}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-ink/5"></div>
            <span className="editorial-meta text-[8px] uppercase opacity-40">
              {language === 'es' ? 'Ninguno' : 'None'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-ink"></div>
            <span className="editorial-meta text-[8px] uppercase opacity-40">
              {language === 'es' ? 'Completado' : 'All Done'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {weeklyHistory.map((day) => {
          const isToday = day.date === today;
          const dayName = new Date(`${day.date}T12:00:00`).toLocaleDateString(
            language === 'es' ? 'es-ES' : 'en-US',
            { weekday: 'short' }
          );

          return (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <div
                  className={`aspect-square w-full rounded-lg transition-all duration-300 ${
                  day.percentage === 100
                    ? 'bg-ink'
                    : day.percentage > 0
                      ? 'bg-ink/40'
                      : 'bg-ink/5'
                } ${isToday ? 'ring-2 ring-ink ring-offset-4' : ''}`}
              />
              <span
                className={`font-mono text-[9px] uppercase tracking-tighter ${
                  isToday ? 'font-bold text-ink' : 'text-accent opacity-40'
                }`}
              >
                {dayName[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
