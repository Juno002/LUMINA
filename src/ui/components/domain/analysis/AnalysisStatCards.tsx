/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LucideIcon } from 'lucide-react';

interface AnalysisStatCard {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: string | number;
}

interface AnalysisStatCardsProps {
  stats: AnalysisStatCard[];
}

export default function AnalysisStatCards({ stats }: AnalysisStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-4 rounded-3xl border border-ink/5 p-8 transition-all hover:bg-ink/[0.01]"
        >
          <div className="flex items-start justify-between">
            <div className="editorial-meta">{stat.label}</div>
            <stat.icon size={16} className="text-accent opacity-30" />
          </div>
          <div className="font-serif text-5xl font-light">{stat.value}</div>
          <div className="editorial-meta text-accent">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}
