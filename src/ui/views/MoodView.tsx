/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Heart, Plus, Trash2, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { MoodEntry } from '../../domain/entities';
import { cn } from '../../shared/utils/TailwindMerge';
import { todayISO, formatDate } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';

interface MoodViewProps {
  entries: MoodEntry[];
  onUpdate: (entries: MoodEntry[]) => void;
}

export default function MoodView({ entries, onUpdate }: MoodViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<MoodEntry>>({
    mood: 'Good',
    intensity: 70,
    note: '',
    date: todayISO()
  });

  const handleAdd = () => {
    triggerHaptic('success');
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      date: newEntry.date || todayISO(),
      mood: newEntry.mood || 'Good',
      intensity: newEntry.intensity || 70,
      note: newEntry.note || ''
    };
    onUpdate([entry, ...entries]);
    setIsAdding(false);
    setNewEntry({ mood: 'Good', intensity: 70, note: '', date: todayISO() });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this mood record?")) {
      onUpdate(entries.filter(e => e.id !== id));
    }
  };

  const moodIcons = {
    'Great': <Sparkles className="text-yellow-500" size={24} />,
    'Good': <Smile className="text-green-500" size={24} />,
    'Meh': <Meh className="text-blue-500" size={24} />,
    'Bad': <Frown className="text-orange-500" size={24} />,
    'Awful': <Frown className="text-red-500" size={24} />
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Emotional / Spectrum</div>
          <h2 className="font-serif text-3xl md:text-4xl text-balance italic">Weather of the Spirit.</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-ink text-paper px-8 py-4 md:py-3 rounded-full font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Log Presence
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
            exit={{ opacity: 0, y: 10 }}
            className="p-10 border border-ink/10 rounded-[3rem] bg-paper shadow-2xl flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-6">
                <label className="editorial-meta">Atmosphere</label>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(moodIcons).map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewEntry({...newEntry, mood: m})}
                      className={cn(
                        "px-6 py-3 rounded-2xl border transition-all flex items-center gap-3",
                        newEntry.mood === m ? "bg-ink text-paper border-ink" : "border-ink/10 hover:border-ink/30"
                      )}
                    >
                      {moodIcons[m as keyof typeof moodIcons]}
                      <span className="font-serif italic">{m}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <label className="editorial-meta">Intensity ({newEntry.intensity}%)</label>
                <input 
                  type="range" 
                  className="accent-ink h-10" 
                  value={newEntry.intensity} 
                  onChange={(e) => setNewEntry({...newEntry, intensity: parseInt(e.target.value)})} 
                />
                <div className="flex justify-between editorial-meta text-[9px] opacity-40">
                  <span>Subtle</span>
                  <span>Overwhelming</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="editorial-meta">Reflection (Optional)</label>
              <textarea 
                className="bg-transparent border-b border-ink/10 focus:border-ink outline-none py-4 font-serif text-xl italic resize-none h-32"
                placeholder="What defines this moment?"
                value={newEntry.note}
                onChange={(e) => setNewEntry({...newEntry, note: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-6 pt-6 border-t border-ink/5">
              <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
              <button onClick={handleAdd} className="bg-ink text-paper px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest">
                Commit to Vault
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {entries.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-ink/5 rounded-[3rem]">
            <Heart size={40} className="mx-auto opacity-10 mb-4" />
            <p className="editorial-meta">The horizon of presence is empty.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div 
              layout
              key={entry.id}
              className="p-8 border border-ink/5 rounded-[2rem] bg-paper shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6 group relative"
            >
              <button 
                onClick={() => handleDelete(entry.id)}
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-30 hover:opacity-100 transition-opacity text-red-500"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="editorial-meta text-[9px] opacity-40">{formatDate(entry.date)}</span>
                  <div className="flex items-center gap-3">
                    {moodIcons[entry.mood as keyof typeof moodIcons] || <Heart size={18} />}
                    <h3 className="font-serif text-2xl italic">{entry.mood}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="editorial-meta text-[9px] opacity-40">Intensity</div>
                   <span className="font-mono text-xs">{entry.intensity}%</span>
                </div>
              </div>
              {entry.note && (
                <p className="text-sm italic text-accent leading-relaxed border-l-2 border-ink/5 pl-4">
                  {entry.note}
                </p>
              )}
              <div className="mt-auto h-1 w-full bg-ink/5 rounded-full overflow-hidden">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${entry.intensity}%` }}
 transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                  className="h-full bg-ink/20"
                 />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
