/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, Circle, ArrowUpRight, RefreshCcw } from "lucide-react";
import { Goal } from "../../../../domain/entities";
import { cn } from '../../../../shared/utils/TailwindMerge';

interface GoalItemProps {
  goal: Goal;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * GoalItem Component:
 * Representación de un objetivo estratégico.
 */
const GoalItem: React.FC<GoalItemProps> = ({ goal, onToggle, onDelete }) => {
  return (
    <div className="group py-8 border-b border-ink/5 flex gap-8 items-start hover:bg-ink/[0.01] transition-all px-4">
      <div className="shrink-0 pt-1 cursor-pointer" onClick={onToggle}>
        {goal.completed ? (
          <CheckCircle2 size={24} className="text-ink" />
        ) : (
          <Circle size={24} className="text-accent group-hover:text-ink transition-colors" />
        )}
      </div>
      <div className="flex-grow flex flex-col gap-3">
        <div className="flex justify-between items-start">
           <h4 className={cn("font-serif text-2xl italic tracking-tight", goal.completed && "line-through opacity-50")}>
             {goal.title}
           </h4>
           <div className="flex flex-col items-end gap-1">
             <span className="editorial-meta opacity-50 truncate max-w-[100px]">{goal.targetDate}</span>
             {goal.recurrence !== 'none' && (
               <div className="flex items-center gap-1 text-accent">
                 <RefreshCcw size={10} />
                 <span className="editorial-meta text-[8px] uppercase">{goal.recurrence}</span>
               </div>
             )}
           </div>
        </div>
        <p className="text-accent text-sm leading-relaxed italic max-w-xl">
          {goal.description}
        </p>
        <div className="flex items-center gap-4 mt-2">
          {goal.isSmart && (
            <span className="editorial-meta text-[9px] bg-ink/5 px-2 py-0.5 rounded italic">SMART VERIFIED</span>
          )}
          <button 
            onClick={onDelete} 
            className="editorial-meta text-[8px] text-red-500/50 md:text-red-500/0 md:group-hover:text-red-500/50 transition-all uppercase"
          >
            Archive
          </button>
        </div>
      </div>
      <div className="shrink-0 flex items-center h-full">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-ink/5 rounded-full">
          <ArrowUpRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default GoalItem;
