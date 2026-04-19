/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Plus, CheckCircle2, Check } from 'lucide-react';
import { Goal, RecurrencePattern, Milestone } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import GoalItem from '../components/domain/goals/GoalItem';
import { cn } from '../../shared/utils/TailwindMerge';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialInput, 
  EditorialTextArea 
} from '../components/shared';

export default function GoalsView({ goals, onUpdate }: { goals: Goal[], onUpdate: (g: Goal[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: todayISO(),
    isSmart: true,
    recurrence: 'none' as RecurrencePattern,
    priority: 'medium' as 'low' | 'medium' | 'high',
    measurement: '',
    milestones: [] as { id: string, title: string, completed: boolean }[]
  });
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setNewGoal({
      ...newGoal,
      milestones: [...newGoal.milestones, { id: crypto.randomUUID(), title: newMilestoneTitle.trim(), completed: false }]
    });
    setNewMilestoneTitle('');
  };

  const removeMilestone = (id: string) => {
    setNewGoal({
      ...newGoal,
      milestones: newGoal.milestones.filter(m => m.id !== id)
    });
  };

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    const item: Goal = {
      id: crypto.randomUUID(),
      title: newGoal.title,
      description: newGoal.description,
      targetDate: newGoal.targetDate,
      completed: false,
      isSmart: true,
      recurrence: newGoal.recurrence,
      priority: newGoal.priority,
      measurement: newGoal.measurement,
      progress: 0,
      status: 'active',
      milestones: newGoal.milestones as Milestone[]
    };
    onUpdate([item, ...goals]);
    setIsAdding(false);
    setNewGoal({ 
      title: '', 
      description: '', 
      targetDate: todayISO(), 
      isSmart: true, 
      recurrence: 'none', 
      priority: 'medium', 
      measurement: '', 
      milestones: [] 
    });
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    onUpdate(goals.map(g => {
      if (g.id !== goalId) return g;
      const updatedMilestones = g.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? todayISO() : undefined } : m
      );
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : (g.completed ? 100 : 0);
      return { 
        ...g, 
        milestones: updatedMilestones, 
        progress,
        status: progress === 100 ? 'completed' : g.status
      };
    }));
  };

  const handleToggleGoal = (id: string) => {
    onUpdate(goals.map(g => {
      if (g.id !== id) return g;
      const isCompleting = !g.completed;
      return { 
        ...g, 
        completed: isCompleting, 
        progress: isCompleting ? 100 : 0,
        status: isCompleting ? 'completed' : 'active',
        milestones: g.milestones.map(m => ({ ...m, completed: isCompleting }))
      };
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm("Cancel this strategic objective?")) {
      onUpdate(goals.filter(g => g.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Strategy / Objectives</div>
          <h2 className="font-serif text-3xl md:text-4xl">The Master Plan.</h2>
        </div>
        <EditorialButton 
          onClick={() => setIsAdding(true)}
          icon={<Zap size={14} />}
        >
          Define SMART Goal
        </EditorialButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 flex flex-col gap-10">
          <div className="p-10 border border-ink/10 rounded-[3.5rem] bg-ink text-paper flex flex-col gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
            <h3 className="font-serif text-4xl leading-tight">Clarity of Intent.</h3>
            <p className="text-sm italic opacity-60 leading-relaxed font-serif max-w-2xl">
              A SMART goal is a contract with your future self. It removes the ambiguity that leads to procrastination and provides a direct path to achievement.
            </p>
            <div className="flex flex-col gap-4 pt-6 max-w-sm">
               <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono opacity-40">
                 <span>Active Strategic Alignment</span>
                 <span>{goals.filter(g => g.status === 'active').length} Active</span>
               </div>
               <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: goals.length > 0 ? `${(goals.filter(g => g.status === 'completed').length / goals.length) * 100}%` : "0%" }} 
                    className="h-full bg-white" 
                 />
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="editorial-meta flex items-center gap-2 opacity-40 mb-2"><CheckCircle2 size={12} /> Current Objectives</div>
          {goals.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-ink/5 rounded-[3rem]">
               <Target size={60} className="mx-auto opacity-10" strokeWidth={1} />
               <div className="text-center">
                 <p className="editorial-meta text-lg">The master plan is empty.</p>
                 <p className="editorial-meta text-accent opacity-40 text-xs italic mt-1">Define your first SMART goal to begin calibration.</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => (
                <GoalItem 
                  key={goal.id} 
                  goal={goal} 
                  onToggle={() => handleToggleGoal(goal.id)} 
                  onToggleMilestone={(mid) => toggleMilestone(goal.id, mid)}
                  onDelete={() => handleDelete(goal.id)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EditorialModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Define Objective."
        subtitle="Strategy / SMART"
      >
        <div className="flex flex-col gap-8">
          <EditorialInput 
            autoFocus
            label="Objective Title"
            placeholder="e.g., Achieve deep work mastery..."
            value={newGoal.title}
            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
          />

          <EditorialTextArea 
            label="Measurable Criterion (S.M.A.R.T)"
            placeholder="e.g., Complete 3 pomodoros without distractions every weekday..."
            value={newGoal.description}
            onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
          />

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button 
                    key={p}
                    onClick={() => setNewGoal({...newGoal, priority: p})}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-mono text-[8px] uppercase tracking-widest border transition-all",
                      newGoal.priority === p 
                        ? "bg-ink text-paper border-ink" 
                        : "border-ink/10 text-accent hover:bg-ink/5"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <EditorialInput 
              label="Target Date"
              type="date"
              variant="mono"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-ink/5 pt-6">
            <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50">Milestones (Sub-goals)</label>
            <div className="flex gap-2">
              <input 
                placeholder="Add sub-task..."
                className="flex-grow bg-transparent border-b border-ink/10 py-1 outline-none font-serif italic text-sm focus:border-ink"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
              />
              <button onClick={handleAddMilestone} className="p-2 bg-ink/5 rounded-full hover:bg-ink hover:text-paper transition-all">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
               {newGoal.milestones.map(m => (
                 <div key={m.id} className="group flex items-center gap-2 bg-ink/[0.03] border border-ink/5 px-3 py-1.5 rounded-full">
                    <span className="text-[10px] font-serif italic">{m.title}</span>
                    <button onClick={() => removeMilestone(m.id)} className="opacity-0 group-hover:opacity-100 text-red-400 transition-opacity">
                      <Plus className="rotate-45" size={12} />
                    </button>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-ink/5">
            <button onClick={() => setIsAdding(false)} className="editorial-meta text-accent hover:text-ink transition-colors">Discard</button>
            <EditorialButton onClick={handleAddGoal} icon={<Check size={14} />}>
              Establish Goal
            </EditorialButton>
          </div>
        </div>
      </EditorialModal>
    </div>
  );
}
