/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Moon, Sun, Clock, Star, TrendingUp, AlertCircle, Check, Plus } from 'lucide-react';
import { todayISO } from '../../shared/utils/DateFormatter';
import { SleepEntry } from '../../domain/entities';
import { calculateSleepMetrics } from '../../domain/services/SleepCalculator';
import { cn } from '../../shared/utils/TailwindMerge';
import SleepLogItem from '../components/domain/sleep/SleepLogItem';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialInput 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function SleepView({ entries, onUpdate }: { entries: SleepEntry[], onUpdate: (e: SleepEntry[]) => void }) {
  const { t, language } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: todayISO(),
    bedTime: '22:30',
    wakeTime: '07:00',
    quality: 4,
    latencyMin: 15,
    awakenings: 0,
    awakeMinutes: 0,
    notes: ''
  });

  const currentMetrics = useMemo(() => {
    return calculateSleepMetrics(newEntry.bedTime, newEntry.wakeTime, newEntry.latencyMin, newEntry.awakeMinutes);
  }, [newEntry.bedTime, newEntry.wakeTime, newEntry.latencyMin, newEntry.awakeMinutes]);

  const handleAdd = () => {
    const item: SleepEntry = {
      id: crypto.randomUUID(),
      date: newEntry.date,
      bedTime: newEntry.bedTime,
      wakeTime: newEntry.wakeTime,
      quality: newEntry.quality,
      latencyMin: newEntry.latencyMin,
      awakenings: newEntry.awakenings,
      awakeMinutes: newEntry.awakeMinutes,
      notes: newEntry.notes,
      ...currentMetrics
    };
    onUpdate([item, ...entries]);
    setIsAdding(false);
  };

  const lastEntry = entries[0];
  const weeklyTrends = useMemo(() => {
    return entries.slice(0, 7).reverse().map(e => ({
      date: e.date,
      efficiency: e.sleepEfficiencyPct
    }));
  }, [entries]);

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 85) return 'text-green-500';
    if (eff >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Circadian / Restoration</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('sleep.title')}.</h2>
        </div>
        <EditorialButton 
          onClick={() => setIsAdding(true)}
          icon={<Plus size={14} />}
        >
          {t('sleep.log_rest')}
        </EditorialButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="flex flex-col gap-10">
      <EditorialModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={language === 'es' ? 'Reflexión Nocturna.' : "Night Reflection."}
        subtitle="Circadian / Restoration"
      >
        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-2 gap-8">
            <EditorialInput 
              label={language === 'es' ? 'Hora de Acostarse' : "Bed Time"}
              type="time"
              variant="mono"
              value={newEntry.bedTime}
              onChange={(e) => setNewEntry({...newEntry, bedTime: e.target.value})}
            />
            <EditorialInput 
              label={language === 'es' ? 'Hora de Despertar' : "Wake Time"}
              type="time"
              variant="mono"
              value={newEntry.wakeTime}
              onChange={(e) => setNewEntry({...newEntry, wakeTime: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <EditorialInput 
              label={language === 'es' ? 'Latencia (min)' : "Latency (min)"}
              type="number"
              value={newEntry.latencyMin}
              onChange={(e) => setNewEntry({...newEntry, latencyMin: parseInt(e.target.value) || 0})}
            />
            <EditorialInput 
              label={language === 'es' ? 'Despierto (min)' : "Awake (min)"}
              type="number"
              value={newEntry.awakeMinutes}
              onChange={(e) => setNewEntry({...newEntry, awakeMinutes: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="editorial-meta opacity-50">{language === 'es' ? 'Calidad (1-5)' : 'Quality (1-5)'}</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setNewEntry({...newEntry, quality: star})}
                  className={cn("p-2 transition-all", newEntry.quality >= star ? "text-ink" : "text-ink/10")}
                >
                  <Star size={24} fill={newEntry.quality >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-ink/[0.02] border border-ink/5 rounded-2xl flex justify-between items-center">
             <div className="flex flex-col">
                <span className="editorial-meta text-[9px] uppercase tracking-widest opacity-40">{language === 'es' ? 'Eficiencia Calculada' : 'Calculated Efficiency'}</span>
                <span className={cn("font-serif text-3xl italic", getEfficiencyColor(currentMetrics.sleepEfficiencyPct))}>
                  {currentMetrics.sleepEfficiencyPct}%
                </span>
             </div>
             {currentMetrics.sleepEfficiencyPct < 85 && (
               <div className="flex items-center gap-2 text-[9px] editorial-meta text-yellow-600/60 max-w-[150px] text-right italic">
                 <AlertCircle size={14} /> {language === 'es' ? 'Bajo el objetivo clínico del 85%' : 'Below clinical target of 85%'}
               </div>
             )}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-ink/5">
            <button onClick={() => setIsAdding(false)} className="editorial-meta text-accent hover:text-ink transition-colors">{t('common.cancel')}</button>
            <EditorialButton onClick={handleAdd} icon={<Check size={14} />}>
              {language === 'es' ? 'Solidificar Ciclo' : 'Solidify Cycle'}
            </EditorialButton>
          </div>
        </div>
      </EditorialModal>

          <div className="p-10 border border-ink/10 rounded-[3rem] bg-paper flex flex-col gap-12 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="editorial-meta flex items-center gap-2"><Moon size={12} className="text-accent" /> {language === 'es' ? 'Arquitectura de Anoche' : "Last Night's Architecture"}</div>
                <div className="flex items-center gap-4">
                   <h3 className="font-serif text-5xl font-light">{lastEntry?.sleepEfficiencyPct || '--'}%</h3>
                    <div className="flex flex-col">
                       <span className="editorial-meta text-[8px] uppercase tracking-[0.2em] opacity-40">{language === 'es' ? 'Eficiencia' : 'Efficiency'}</span>
                       <span className={cn("text-[9px] editorial-meta uppercase", getEfficiencyColor(lastEntry?.sleepEfficiencyPct || 0))}>
                         {lastEntry && lastEntry.sleepEfficiencyPct >= 85 ? (language === 'es' ? 'Óptimo' : 'Optimal') : (language === 'es' ? 'Sub-óptimo' : 'Sub-Optimal')}
                       </span>
                    </div>
                </div>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} fill={lastEntry && lastEntry.quality >= s ? "currentColor" : "none"} className={lastEntry && lastEntry.quality >= s ? "text-ink" : "text-ink/10"} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col gap-1">
                <span className="editorial-meta text-[8px] uppercase opacity-40">{language === 'es' ? 'Acostado' : 'Bedtime'}</span>
                <span className="font-serif text-lg italic">{lastEntry?.bedTime || '--:--'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="editorial-meta text-[8px] uppercase opacity-40">{language === 'es' ? 'Despertar' : 'Wake'}</span>
                <span className="font-serif text-lg italic">{lastEntry?.wakeTime || '--:--'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="editorial-meta text-[8px] uppercase opacity-40">{language === 'es' ? 'Duración' : 'Duration'}</span>
                <span className="font-serif text-lg italic">{lastEntry ? `${Math.floor(lastEntry.timeAsleepMin / 60)}h ${lastEntry.timeAsleepMin % 60}m` : '--'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="editorial-meta text-[8px] uppercase opacity-40">{language === 'es' ? 'Latencia' : 'Latency'}</span>
                <span className="font-serif text-lg italic">{lastEntry?.latencyMin || '0'}m</span>
              </div>
            </div>

            <div className="editorial-rule"></div>

            <p className="text-sm italic leading-relaxed text-accent opacity-60 font-serif">
              {lastEntry ? (
                language === 'es' 
                  ? "Mantener una alta eficiencia del sueño es crítico para la reestructuración cognitiva. Una puntuación por encima del 85% indica una fuerte alineación circadiana."
                  : "Maintaining a high sleep efficiency is critical for cognitive restructuring. A score above 85% indicates strong circadian alignment."
              ) : (
                language === 'es'
                  ? "Comienza a registrar tus noches para mapear tu arquitectura restaurativa."
                  : "Start registering your nights to map your restorative architecture."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-ink/5 rounded-[2rem] bg-paper flex flex-col gap-4">
               <TrendingUp size={20} className="text-accent" />
               <div className="editorial-meta">{language === 'es' ? 'Tendencia de Eficiencia' : 'Efficiency Trend'}</div>
               <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a05" />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[0, 100]} hide />
                      <ReferenceLine y={85} stroke="#1a1a1a" strokeDasharray="3 3" opacity={0.2} />
                      <Line type="monotone" dataKey="efficiency" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 4, fill: '#1a1a1a' }} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="p-8 border border-ink/5 rounded-[2rem] bg-paper flex flex-col gap-6">
               <Sun size={20} className="text-accent" />
               <div className="flex flex-col gap-2">
                 <div className="editorial-meta">{language === 'es' ? 'Protocolo Matutino' : 'Morning Protocol'}</div>
                 <p className="text-xs italic opacity-50 font-serif">
                   {language === 'es'
                     ? "Busca 10-20 minutos de luz solar intensa dentro de los 30 minutos posteriores al despertar para anclar tu reloj biológico."
                     : "Seek 10-20 minutes of bright sunlight within 30 minutes of waking to anchor your clock."}
                 </p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="editorial-meta flex items-center gap-2 opacity-40"><Clock size={12} /> {language === 'es' ? 'Ciclos Históricos' : 'Historical Cycles'}</div>
          <div className="flex flex-col gap-4">
            {entries.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-ink/5 rounded-[3rem]">
                <p className="editorial-meta italic opacity-30">{t('sleep.empty_state')}</p>
              </div>
            ) : (
              entries.map((entry) => (
                <SleepLogItem key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
