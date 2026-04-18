/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { CheckCircle2, Flame, Sparkles, Plus } from 'lucide-react';
import { ActivationActivity } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import ActivityItem from '../components/domain/activation/ActivityItem';

export default function ActivationView({ activations, onUpdate }: { activations: ActivationActivity[], onUpdate: (a: ActivationActivity[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: '', value: 5, difficulty: 5 });

  const momentum = activations.filter(a => a.completed && a.plannedDate === todayISO()).length * 20;

  const handleAdd = () => {
    if (!newActivity.title) return;
    triggerHaptic('success');
    const item: ActivationActivity = {
      id: crypto.randomUUID(),
      title: newActivity.title,
      value: newActivity.value,
      difficulty: newActivity.difficulty,
      completed: false,
      plannedDate: todayISO(),
      subtasks: []
    };
    onUpdate([item, ...activations]);
    setNewActivity({ title: '', value: 5, difficulty: 5 });
    setIsAdding(false);
  };

  const toggleComplete = (id: string) => {
    triggerHaptic('light');
    onUpdate(activations.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const handleDelete = (id: string) => {
    triggerHaptic('heavy');
    onUpdate(activations.filter(a => a.id !== id));
  };

  const activeActivities = activations.filter(a => !a.completed);
  const completedActivities = activations.filter(a => a.completed && a.plannedDate === todayISO());

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Behavioral / Flow</div>
          <h2 className="font-serif text-3xl md:text-4xl">Momentum & Drive.</h2>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-none border-ink/5 pt-6 md:pt-0">
          <div className="flex flex-col items-start md:items-end">
            <span className="editorial-meta text-[9px]">Daily Momentum</span>
            <span className="font-serif text-2xl italic text-accent">{momentum}%</span>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-ink text-paper px-8 py-4 md:py-3 rounded-full hover:opacity-80 transition-all font-mono text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} /> Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="flex flex-col gap-8">
           <div className="flex items-center gap-4">
               <Flame className="text-accent" size={20} />
               <div className="editorial-meta uppercase tracking-widest">Active Intentions</div>
           </div>

           {isAdding && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
               className="p-8 border border-ink/10 rounded-3xl bg-ink/[0.02] flex flex-col gap-6"
             >
               <input 
                 autoFocus
                 className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 italic font-serif text-xl"
                 placeholder="Activity name..."
                 value={newActivity.title}
                 onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
               />
               <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="editorial-meta text-[9px]">Anticipated Joy ({newActivity.value}/10)</label>
                    <input type="range" min="1" max="10" className="accent-ink" value={newActivity.value} onChange={(e) => setNewActivity({...newActivity, value: parseInt(e.target.value)})} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="editorial-meta text-[9px]">Mastery Effort ({newActivity.difficulty}/10)</label>
                    <input type="range" min="1" max="10" className="accent-ink" value={newActivity.difficulty} onChange={(e) => setNewActivity({...newActivity, difficulty: parseInt(e.target.value)})} />
                  </div>
               </div>
               <div className="flex justify-end gap-4">
                  <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
                  <button onClick={handleAdd} className="bg-ink text-paper px-8 py-3 rounded-full font-mono text-[9px] uppercase tracking-widest">
                    Commit
                  </button>
               </div>
             </motion.div>
           )}

           <div className="flex flex-col gap-4">
             {activeActivities.length === 0 && !isAdding ? (
               <p className="editorial-meta text-accent italic py-10">All intentions manifested or none set.</p>
             ) : (
               activeActivities.map(activity => (
                 <ActivityItem key={activity.id} activity={activity} onToggle={() => toggleComplete(activity.id)} onDelete={() => handleDelete(activity.id)} />
               ))
             )}
           </div>
        </div>

        <div className="flex flex-col gap-8">
           <div className="flex items-center gap-4 opacity-50">
               <CheckCircle2 size={20} />
               <div className="editorial-meta uppercase tracking-widest">Manifested Today</div>
           </div>
           
           <div className="flex flex-col gap-1">
             {completedActivities.length === 0 ? (
               <p className="editorial-meta text-accent italic opacity-40 py-10">Awaiting action.</p>
             ) : (
               completedActivities.map(activity => (
                 <div key={activity.id} className="py-4 border-b border-ink/5 flex items-center justify-between group">
                    <span className="font-serif text-lg italic opacity-50 line-through decoration-accent">{activity.title}</span>
                    <div className="flex items-center gap-4">
                       <span className="editorial-meta text-[9px] opacity-40">J:{activity.value} E:{activity.difficulty}</span>
                       <button onClick={() => toggleComplete(activity.id)} className="text-accent hover:text-ink"><CheckCircle2 size={16} /></button>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

      <div className="mt-10 p-10 border border-ink/5 rounded-[3rem] bg-ink/5 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-grow flex flex-col gap-2">
              <div className="flex items-center gap-3">
                  <Sparkles className="text-accent" size={16} />
                  <span className="editorial-meta uppercase tracking-widest">Philosophy of Action</span>
              </div>
              <p className="text-xl font-serif italic max-w-2xl">
                "Small, consistent movements in the direction of mastery often dissolve the greatest weights of the spirit."
              </p>
          </div>
          <div className="shrink-0 flex gap-4 opacity-50">
               <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center italic text-xs">J</div>
               <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center italic text-xs">E</div>
          </div>
      </div>
    </div>
  );
}
