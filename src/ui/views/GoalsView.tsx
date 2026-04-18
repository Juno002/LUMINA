/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Target, Zap } from 'lucide-react';
import { Goal, RecurrencePattern } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import GoalItem from '../components/domain/goals/GoalItem';

export default function GoalsView({ goals, onUpdate }: { goals: Goal[], onUpdate: (g: Goal[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    targetDate: todayISO(),
    isSmart: true,
    completed: false,
    recurrence: 'none'
  });

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    const item: Goal = {
      id: crypto.randomUUID(),
      title: newGoal.title,
      description: newGoal.description || '',
      targetDate: newGoal.targetDate || todayISO(),
      completed: false,
      isSmart: true,
      recurrence: newGoal.recurrence || 'none'
    };
    onUpdate([item, ...goals]);
    setIsAdding(false);
    setNewGoal({ title: '', description: '', targetDate: todayISO(), isSmart: true, recurrence: 'none' });
  };

  const toggleComplete = (id: string) => {
    onUpdate(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const handleDelete = (id: string) => {
    if (confirm("Cancel this objective?")) {
      onUpdate(goals.filter(g => g.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Strategy / Objectives</div>
          <h2 className="font-serif text-3xl md:text-4xl">The Master Plan.</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-ink text-paper px-8 py-4 md:py-3 rounded-full font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2"
        >
          <Zap size={14} /> Define SMART Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 flex flex-col gap-10">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-8 border border-ink/10 rounded-3xl bg-paper flex flex-col gap-6 shadow-xl mb-10">
                  <h3 className="editorial-meta">Definition Panel</h3>
                  <input 
                    placeholder="Objective title..."
                    className="bg-transparent border-b border-ink/10 focus:border-ink outline-none py-2 font-serif text-xl italic"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  />
                  <textarea 
                    placeholder="Measurable description..."
                    className="bg-transparent border-b border-ink/10 focus:border-ink outline-none py-2 h-24 italic text-sm resize-none"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="editorial-meta text-[9px]">Target Date</label>
                      <input 
                        type="date"
                        className="bg-transparent border-b border-ink/10 focus:border-ink outline-none py-2 italic text-sm"
                        value={newGoal.targetDate}
                        onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="editorial-meta text-[9px]">Recurrence</label>
                       <select 
                         className="bg-transparent border-b border-ink/10 focus:border-ink outline-none py-2 italic text-sm"
                         value={newGoal.recurrence}
                         onChange={(e) => setNewGoal({...newGoal, recurrence: e.target.value as RecurrencePattern})}
                       >
                         <option value="none" className="text-paper bg-ink">None</option>
                         <option value="daily" className="text-paper bg-ink">Daily</option>
                         <option value="weekly" className="text-paper bg-ink">Weekly</option>
                         <option value="monthly" className="text-paper bg-ink">Monthly</option>
                       </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
                    <button onClick={handleAddGoal} className="bg-ink text-paper px-6 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest">
                       Establish
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-8 border border-ink/10 rounded-3xl bg-ink text-paper flex flex-col gap-6">
            <h3 className="font-serif text-3xl leading-tight">Clarity of Intent.</h3>
            <p className="text-sm italic opacity-70 leading-relaxed">
              SMART goals (Specific, Measurable, Actionable, Relevant, Time-bound) 
              transform abstract desires into concrete achievements.
            </p>
            <div className="flex flex-col gap-2 pt-4">
               <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono opacity-50">
                 <span>Projected Success</span>
                 <span>72%</span>
               </div>
               <div className="h-[1px] w-full bg-paper/20">
                 <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }} className="h-full bg-paper" />
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col gap-1">
          {goals.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-ink/5 rounded-3xl">
               <Target size={40} className="mx-auto opacity-10 mb-4" />
               <p className="editorial-meta">No strategic objectives defined for this period.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <GoalItem 
                key={goal.id} 
                goal={goal} 
                onToggle={() => toggleComplete(goal.id)} 
                onDelete={() => handleDelete(goal.id)} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
