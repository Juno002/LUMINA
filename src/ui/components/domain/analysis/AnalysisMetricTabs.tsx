/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cn } from '../../../../shared/utils/TailwindMerge';

export type AnalysisMetric = 'mood' | 'activation' | 'icc';

interface AnalysisMetricTabsProps {
  activeMetric: AnalysisMetric;
  labels: Record<AnalysisMetric, string>;
  onChange: (metric: AnalysisMetric) => void;
}

export default function AnalysisMetricTabs({
  activeMetric,
  labels,
  onChange
}: AnalysisMetricTabsProps) {
  return (
    <div className="flex w-full gap-6 border-b border-ink/5 pt-2 md:w-auto md:border-none">
      {(['mood', 'activation', 'icc'] as AnalysisMetric[]).map((metric) => (
        <button
          key={metric}
          onClick={() => onChange(metric)}
          className={cn(
            'editorial-meta flex-grow border-b-2 pb-4 text-center capitalize transition-all md:flex-grow-0 md:pb-2',
            activeMetric === metric ? 'border-ink text-ink' : 'border-transparent text-accent'
          )}
        >
          {labels[metric]}
        </button>
      ))}
    </div>
  );
}
