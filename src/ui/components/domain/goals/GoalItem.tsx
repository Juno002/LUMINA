/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Flag, RefreshCcw, CheckSquare, Square } from "lucide-react";
import { Goal } from "../../../../domain/entities";
import { cn } from '../../../../shared/utils/TailwindMerge';
import { motion, AnimatePresence } from 'motion/react';

interface GoalItemProps {
  goal: Goal;
  onToggle: () => void;
  onToggleMilestone: (id: string) => void;
  onDelete: () => void;
}

const GoalItem: React.FC<GoalItemProps> = ({ goal, onToggle, onToggleMilestone, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-500/5 border-red-500/10';
      case 'medium': return 'text-yellow-600 bg-yellow-500/5 border-yellow-500/10';
      default: return 'text-green-600 bg-green-500/5 border-green-500/10';
    }
  };

  const isOverdue = new Date(goal.targetDate) < new Date() && !goal.completed;

  return (
    <div className={cn(
      "group border border-ink/5 rounded-[2.5rem] bg-paper overflow-hidden transition-all duration-500",
      goal.completed ? "opacity-60" : "hover:border-ink/20 hover:shadow-xl hover:shadow-ink/[0.02]",
      isOverdue && "border-red-500/20"
    )}>
      <div className="p-8 flex items-start gap-8">
        <button 
          onClick={onToggle}
          className="shrink-0 pt-1 group/check transition-transform active:scale-90"
        >
          {goal.completed ? (
            <CheckCircle2 size={28} className="text-ink" />
          ) : (
            <Circle size={28} className="text-ink/10 group-hover/check:text-ink/30 transition-colors" />
          )}
        </button>

        <div className="flex-grow flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
               <h4 className={cn("font-serif text-2xl italic leading-tight", goal.completed && "line-through")}>
                 {goal.title}
               </h4>
               <div className="flex items-center gap-4">
                  <span className={cn(
                    "editorial-meta text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    getPriorityColor(goal.priority)
                  )}>
                    {goal.priority}
                  </span>
                  {goal.recurrence !== 'none' && (
                    <div className="flex items-center gap-1 opacity-30">
                      <RefreshCcw size={10} />
                      <span className="editorial-meta text-[8px] uppercase">{goal.recurrence}</span>
                    </div>
                  )}
                  {isOverdue && (
                    <span className="editorial-meta text-[8px] uppercase text-red-500 font-bold">Overdue</span>
                  )}
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="font-mono text-xs opacity-40">{goal.targetDate}</span>
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="mt-2 text-accent hover:text-ink transition-colors"
               >
                 {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
               </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center text-[9px] editorial-meta uppercase opacity-30">
               <span>Progress</span>
               <span>{goal.progress}%</span>
             </div>
             <div className="h-1 w-full bg-ink/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  className="h-full bg-ink"
                />
             </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-6 pt-4"
              >
                <div className="flex flex-col gap-2">
                   <span className="editorial-meta text-[9px] uppercase tracking-widest opacity-40">Measurable Criterion</span>
                   <p className="text-sm font-serif italic opacity-70 leading-relaxed">
                     {goal.description || "No description established."}
                   </p>
                </div>

                {goal.milestones.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="editorial-meta text-[9px] uppercase tracking-widest opacity-40">Milestones</span>
                    <div className="flex flex-col gap-2">
                       {goal.milestones.map(m => (
                         <button 
                           key={m.id}
                           onClick={() => onToggleMilestone(m.id)}
                           className="flex items-center gap-3 text-left group/m"
                         >
                            {m.completed ? (
                              <CheckSquare size={16} className="text-ink" />
                            ) : (
                              <Square size={16} className="text-ink/20 group-hover/m:text-ink/40 transition-colors" />
                            )}
                            <span className={cn("font-serif text-sm italic", m.completed && "line-through opacity-40")}>
                              {m.title}
                            </span>
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-ink/5">
                   <div className="flex items-center gap-2 text-[9px] editorial-meta opacity-40">
                      <Flag size={12} />
                      {goal.measurement || "Direct measurement"}
                   </div>
                   <button 
                     onClick={onDelete}
                     className="editorial-meta text-[8px] text-red-500/40 hover:text-red-500 transition-colors uppercase flex items-center gap-1"
                   >
                     <Trash2 size={12} /> Archive Strategic Objective
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GoalItem;
