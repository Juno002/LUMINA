/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { calculateICC } from '../../domain/services/ICCCalculator';
import { useTranslation } from '../../application/contexts/LanguageContext';

export default function AnalysisView({ vault }: { vault: Vault }) {
  const { t, language } = useTranslation();
  const [activeMetric, setActiveMetric] = useState<'mood' | 'activation' | 'icc'>('mood');

  const journalEntries = useMemo(() => vault.journal || [], [vault.journal]);
  const activations = useMemo(() => vault.activations || [], [vault.activations]);

  // Data processing
  const trendData = useMemo(() => [...journalEntries].reverse().slice(0, 10).map((e: ThoughtEntry) => {
    let iccVal = 0;
    if (e.level === 3 && e.originalIntensity !== undefined && e.finalCredibility !== undefined) {
      iccVal = calculateICC(e.originalIntensity, e.finalCredibility).value * 100;
    }

    return {
      name: e.date.split('-').slice(1).join('/'),
      intensity: (e.intensity || 0) * 10, // Scale 1-10 to 1-100
      activity: activations.filter((a: ActivationActivity) => a.plannedDate === e.date && a.completed).length * 20,
      icc: iccVal
    };
  }), [journalEntries, activations]);

  const distortionCounts: Record<string, number> = {};
  journalEntries.forEach((e: ThoughtEntry) => {
    (e.distortions || []).forEach((d: string) => {
      distortionCounts[d] = (distortionCounts[d] || 0) + 1;
    });
  });

  const distortionData = Object.entries(distortionCounts).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const avgICC = useMemo(() => {
    const l3Entries = journalEntries.filter(e => e.level === 3 && e.originalIntensity !== undefined && e.finalCredibility !== undefined);
    if (l3Entries.length === 0) return 0;
    const sum = l3Entries.reduce((acc, e) => acc + calculateICC(e.originalIntensity!, e.finalCredibility!).value, 0);
    return sum / l3Entries.length;
  }, [journalEntries]);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Metrics / Behavioral Synapse</div>
          <h2 className="font-serif text-3xl md:text-4xl">{language === 'es' ? 'Resiliencia Estadística.' : 'Statistical Resilience.'}</h2>
        </div>
        <div className="flex gap-6 w-full md:w-auto border-b md:border-none border-ink/5 pt-2">
          {['mood', 'activation', 'icc'].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m as 'mood' | 'activation' | 'icc')}
              className={cn(
                "editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center capitalize", 
                activeMetric === m ? "border-ink text-ink" : "border-transparent text-accent"
              )}
            >
              {m === 'mood' 
                ? (language === 'es' ? 'Flujo de Intensidad' : 'Intensity Flux') 
                : m === 'activation' 
                  ? (language === 'es' ? 'Pulso de Actividad' : 'Activity Pulse') 
                  : (language === 'es' ? 'Cambio Cognitivo' : 'Cognitive Change')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8">
          <div className="p-10 border border-ink/10 rounded-[2rem] bg-paper relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex flex-col gap-1">
                <div className="editorial-meta">{language === 'es' ? 'Horizonte Histórico' : 'Historical Horizon'}</div>
                <h3 className="font-serif text-2xl">
                  {activeMetric === 'mood' && (language === 'es' ? 'Intensidad Emocional.' : 'Emotional Intensity.')}
                  {activeMetric === 'activation' && (language === 'es' ? 'Momentum Conductual.' : 'Behavioral Momentum.')}
                  {activeMetric === 'icc' && (language === 'es' ? 'Reestructuración Cognitiva.' : 'Cognitive Restructuring.')}
                </h3>
              </div>
              <Activity className="text-accent" size={20} />
            </div>

            <div className="h-[350px] w-full relative z-10">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center editorial-meta opacity-20 italic">{language === 'es' ? 'No hay datos históricos en la órbita actual.' : 'No historical data in current orbit.'}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeMetric === 'icc' ? (
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999999', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #1a1a1a10', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontFamily: 'serif' }} />
                      <Area type="monotone" dataKey="icc" stroke="#10b981" fill="#10b98120" strokeWidth={3} />
                    </AreaChart>
                  ) : (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999999', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #1a1a1a10', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontFamily: 'serif' }} />
                      <Line type="monotone" dataKey={activeMetric === 'mood' ? "intensity" : "activity"} stroke="#1a1a1a" strokeWidth={3} dot={{ r: 4, fill: '#1a1a1a' }} activeDot={{ r: 6, fill: '#1a1a1a' }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="editorial-meta">{language === 'es' ? 'Fundamentos y Patrones' : 'Foundations & Patterns'}</div>
            <div className="flex flex-col gap-4">
              {distortionData.length === 0 ? (
                <p className="editorial-meta text-xs italic opacity-30 py-4">{language === 'es' ? 'Escaneando archivo en busca de patrones cognitivos...' : 'Scan archive for cognitive patterns...'}</p>
              ) : (
                distortionData.map((d, i) => (
                  <div key={d.name} className="flex flex-col gap-2">
                    <div className="flex justify-between italic text-sm">
                      <span className="capitalize">{d.name}</span>
                      <span className="font-mono text-[10px] opacity-50">{d.count} x</span>
                    </div>
                    <div className="h-[1px] w-full bg-ink/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((d.count / 10) * 100, 100)}%` }}
                        transition={{ delay: i * 0.1, duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                        className="h-full bg-ink/40"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-8 border border-ink/10 rounded-3xl bg-ink text-paper flex flex-col gap-4 mt-auto">
            <Brain size={24} className="opacity-50" />
            <div className="editorial-meta opacity-50">{language === 'es' ? 'Información del Pulso' : 'Pulse Insights'}</div>
            <p className="text-sm italic leading-relaxed">
              {avgICC > 0.6 ? (
                language === 'es' 
                  ? "Alta flexibilidad cognitiva detectada. Tu capacidad para desafiar pensamientos automáticos está aumentando significativamente."
                  : "High cognitive flexibility detected. Your ability to challenge automatic thoughts is significantly increasing."
              ) : avgICC > 0.35 ? (
                language === 'es'
                  ? "Índice de cambio moderado. Los cambios de perspectiva son más frecuentes. Continúa con la técnica del amigo."
                  : "Moderate change index. Perspective shifts are becoming more frequent. Continue the friend technique."
              ) : (
                language === 'es'
                  ? "Esperando más registros de reestructuración para establecer un índice de cambio cognitivo significativo."
                  : "Awaiting further restructuring logs to establish significant cognitive change index."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="editorial-rule"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: language === 'es' ? 'Índice Promedio' : 'Avg Change Index', value: avgICC.toFixed(2), sub: language === 'es' ? 'Efectividad del cambio' : 'Shift effectiveness', icon: TrendingUp },
          { label: language === 'es' ? 'Reserva de Momentum' : 'Momentum Store', value: activations.filter((a: ActivationActivity) => a.completed).length, sub: language === 'es' ? 'Logros Totales' : 'Total Wins', icon: Activity },
          { label: language === 'es' ? 'Continuidad' : 'Obs. Continuity', value: journalEntries.length, sub: language === 'es' ? 'Registros' : 'Log Entries', icon: Brain },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-4 p-8 border border-ink/5 rounded-3xl hover:bg-ink/[0.01] transition-all">
            <div className="flex justify-between items-start">
              <div className="editorial-meta">{stat.label}</div>
              <stat.icon size={16} className="text-accent opacity-30" />
            </div>
            <div className="font-serif text-5xl font-light">{stat.value}</div>
            <div className="editorial-meta text-accent">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
