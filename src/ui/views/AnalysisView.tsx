/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Activity, Brain } from 'lucide-react';
import { cn } from '../../shared/utils/TailwindMerge';
import { Vault, ThoughtEntry, ActivationActivity } from '../../domain/entities';

export default function AnalysisView({ vault }: { vault: Vault }) {
  const [activeMetric, setActiveMetric] = useState<'mood' | 'activation'>('mood');

  const journalEntries = vault.journal || [];
  const activations = vault.activations || [];

  // Data processing
  const trendData = [...journalEntries].reverse().slice(0, 7).map((e: ThoughtEntry) => ({
    name: e.date.split('-').slice(1).join('/'),
    intensity: e.intensity,
    activity: activations.filter((a: ActivationActivity) => a.plannedDate === e.date && a.completed).length * 20
  }));

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

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Metrics / Behavioral Synapse</div>
          <h2 className="font-serif text-3xl md:text-4xl">Statistical Resilience.</h2>
        </div>
        <div className="flex gap-6 w-full md:w-auto border-b md:border-none border-ink/5 pt-2">
          <button
            onClick={() => setActiveMetric('mood')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeMetric === 'mood' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            Emotional Flux
          </button>
          <button
            onClick={() => setActiveMetric('activation')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeMetric === 'activation' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            Activity Pulse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8">
          <div className="p-10 border border-ink/10 rounded-[2rem] bg-paper">
            <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col gap-1">
                <div className="editorial-meta">7-Day Horizon</div>
                <h3 className="font-serif text-2xl">Intensity Correlation.</h3>
              </div>
              <Activity className="text-accent" size={20} />
            </div>

            <div className="h-[350px] w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center editorial-meta opacity-20 italic">No historical data in current orbit.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#999999', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis
                      hide
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #1a1a1a10',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        fontFamily: 'serif'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={activeMetric === 'mood' ? "intensity" : "activity"}
                      stroke="#1a1a1a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#1a1a1a' }}
                      activeDot={{ r: 6, fill: '#1a1a1a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="editorial-meta">Foundations & Patterns</div>
            <div className="flex flex-col gap-4">
              {distortionData.length === 0 ? (
                <p className="editorial-meta text-xs italic opacity-30 py-4">Scan archive for cognitive patterns...</p>
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
            <div className="editorial-meta opacity-50">Pulse Insights</div>
            <p className="text-sm italic leading-relaxed">
              {journalEntries.length > 5 ? (
                "Pattern detected: Increasing behavioral momentum correlates with stronger emotional resilience."
              ) : (
                "Awaiting further data logs to establish significant behavioral correlations."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="editorial-rule"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Weekly Intensity', value: (journalEntries[0]?.intensity || 0) + '%', sub: 'Last Record' },
          { label: 'Momentum Store', value: activations.filter((a: ActivationActivity) => a.completed).length, sub: 'Total Wins' },
          { label: 'Continuity', value: journalEntries.length + ' Days', sub: 'Obs. Logged' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <div className="editorial-meta">{stat.label}</div>
            <div className="font-serif text-5xl font-light">{stat.value}</div>
            <div className="editorial-meta text-accent">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
