/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { AnalysisMetric } from './AnalysisMetricTabs';
import { useChartPerformance } from '../../../../shared/hooks/useChartPerformance';

interface TrendPoint {
  activity: number;
  icc: number;
  intensity: number;
  name: string;
}

interface AnalysisTrendPanelProps {
  activeMetric: AnalysisMetric;
  noDataLabel: string;
  panelTitle: Record<AnalysisMetric, string>;
  sectionLabel: string;
  trendData: TrendPoint[];
}

export default function AnalysisTrendPanel({
  activeMetric,
  noDataLabel,
  panelTitle,
  sectionLabel,
  trendData
}: AnalysisTrendPanelProps) {
  const { resizeDebounceMs, shouldAnimateCharts } = useChartPerformance();
  const tooltipStyle = useMemo(
    () => ({
      borderRadius: '16px',
      border: '1px solid #1a1a1a10',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      fontFamily: 'serif'
    }),
    []
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-paper p-10">
      <div className="relative z-10 mb-10 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="editorial-meta">{sectionLabel}</div>
          <h3 className="font-serif text-2xl">{panelTitle[activeMetric]}</h3>
        </div>
        <Activity className="text-accent" size={20} />
      </div>

      <div className="relative z-10 h-[350px] w-full">
        {trendData.length === 0 ? (
          <div className="editorial-meta flex h-full items-center justify-center italic opacity-20">
            {noDataLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={resizeDebounceMs}>
            {activeMetric === 'icc' ? (
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#999999', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  isAnimationActive={shouldAnimateCharts}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="icc"
                  stroke="#10b981"
                  fill="#10b98120"
                  strokeWidth={3}
                  isAnimationActive={shouldAnimateCharts}
                  animationDuration={shouldAnimateCharts ? 450 : 0}
                />
              </AreaChart>
            ) : (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#999999', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  isAnimationActive={shouldAnimateCharts}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey={activeMetric === 'mood' ? 'intensity' : 'activity'}
                  stroke="#1a1a1a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1a1a1a' }}
                  activeDot={{ r: 6, fill: '#1a1a1a' }}
                  isAnimationActive={shouldAnimateCharts}
                  animationDuration={shouldAnimateCharts ? 450 : 0}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
