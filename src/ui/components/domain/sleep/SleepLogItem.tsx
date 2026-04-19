/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SleepEntry } from "../../../../domain/entities";
import { Star } from 'lucide-react';

interface SleepLogItemProps {
  entry: SleepEntry;
}

const SleepLogItem: React.FC<SleepLogItemProps> = ({ entry }) => {
  const getEfficiencyColor = (eff: number) => {
    if (eff >= 85) return 'text-green-500';
    if (eff >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6 border border-ink/5 rounded-[2rem] flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-ink/[0.01] transition-all">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
           <span className="editorial-meta text-[9px] opacity-40 uppercase tracking-tighter">{entry.date}</span>
           <div className="flex gap-0.5">
             {[1,2,3,4,5].map(s => (
               <Star key={s} size={8} fill={entry.quality >= s ? "currentColor" : "none"} className={entry.quality >= s ? "text-ink" : "text-ink/10"} />
             ))}
           </div>
        </div>
        <div className="flex items-baseline gap-2">
           <span className="font-serif text-xl italic">{entry.bedTime}</span>
           <span className="editorial-meta opacity-20 text-xs">to</span>
           <span className="font-serif text-xl italic">{entry.wakeTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 md:gap-12">
        <div className="flex flex-col">
           <span className="text-[8px] editorial-meta uppercase opacity-30">Duration</span>
           <span className="font-mono text-xs">{Math.floor(entry.timeAsleepMin / 60)}h {entry.timeAsleepMin % 60}m</span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[8px] editorial-meta uppercase opacity-30">Efficiency</span>
           <span className={`font-mono text-xl font-light ${getEfficiencyColor(entry.sleepEfficiencyPct)}`}>
             {entry.sleepEfficiencyPct}%
           </span>
        </div>
      </div>
    </div>
  );
};

export default SleepLogItem;
