/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from "motion/react";
import { Circle, CheckCircle2 } from "lucide-react";
import { ActivationActivity } from "../../../../domain/entities";

interface ActivityItemProps {
  activity: ActivationActivity;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * ActivityItem Component:
 * Un ítem de activación conductual. Mantiene el contrato de la tarea.
 */
const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onToggle, onDelete }) => {
  return (
    <motion.div 
      layout
      className="p-6 border border-ink/10 rounded-2xl flex items-center justify-between group hover:border-ink/20 transition-all bg-paper"
    >
      <div className="flex flex-col gap-1">
        <h4 className={`font-serif text-xl ${activity.completed ? 'opacity-30 line-through' : ''}`}>
          {activity.title}
        </h4>
        <div className="flex gap-4">
           <span className="editorial-meta text-[8px] uppercase text-accent">Joy: {activity.value}/10</span>
           <span className="editorial-meta text-[8px] uppercase text-accent">Effort: {activity.difficulty}/10</span>
        </div>
        {!activity.completed && (
          <button 
            onClick={onDelete} 
            className="editorial-meta text-[8px] text-red-500/0 md:group-hover:text-red-500/50 transition-all text-left uppercase mt-2"
          >
            Abandon task
          </button>
        )}
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
          activity.completed 
            ? "border-ink bg-ink text-paper" 
            : "border-ink/10 group-hover:border-ink text-ink/20 group-hover:text-accent"
        }`}
      >
        {activity.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
    </motion.div>
  );
};

export default ActivityItem;
