/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Moon, Sun, Wind } from 'lucide-react';
import { todayISO } from '../../shared/utils/DateFormatter';
import { SleepEntry } from '../../domain/entities';
import SleepLogItem from '../components/domain/sleep/SleepLogItem';

export default function SleepView({ entries, onUpdate }: { entries: SleepEntry[], onUpdate: (e: SleepEntry[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<SleepEntry>>({
    date: todayISO(),
    bedTime: '22:30',
    wakeTime: '07:00',
    quality: 80
  });

  const handleAdd = () => {
    const item: SleepEntry = {
      id: crypto.randomUUID(),
      date: newEntry.date || todayISO(),
      bedTime: newEntry.bedTime || '22:30',
      wakeTime: newEntry.wakeTime || '07:00',
      quality: newEntry.quality || 80,
      efficiency: 90 // Placeholder for now
    };
    onUpdate([item, ...entries]);
    setIsAdding(false);
  };

  const lastEntry = entries[0];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Circadian / Restoration</div>
          <h2 className="font-serif text-3xl md:text-4xl">Architecture of Rest.</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-ink text-paper px-8 py-4 md:py-3 rounded-full font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-all font-bold text-center"
        >
          Register Night
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-10">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-10 border border-ink/10 rounded-[2.5rem] bg-paper flex flex-col gap-8 shadow-2xl"
              >
                <h3 className="editorial-meta">Morning Reflection</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="editorial-meta">Bed Time</label>
                    <input type="time" className="bg-transparent border-b border-ink/20 py-2 outline-none font-serif text-xl" value={newEntry.bedTime} onChange={(e) => setNewEntry({...newEntry, bedTime: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="editorial-meta">Wake Time</label>
                    <input type="time" className="bg-transparent border-b border-ink/20 py-2 outline-none font-serif text-xl" value={newEntry.wakeTime} onChange={(e) => setNewEntry({...newEntry, wakeTime: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="editorial-meta">Sleep Quality ({newEntry.quality}%)</label>
                  <input type="range" className="accent-ink" value={newEntry.quality} onChange={(e) => setNewEntry({...newEntry, quality: parseInt(e.target.value)})} />
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
                  <button onClick={handleAdd} className="bg-ink text-paper px-8 py-3 rounded-full font-mono text-[9px] uppercase tracking-widest">
                    Solidify Cycle
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-10 border border-ink/10 rounded-[2.5rem] bg-paper flex flex-col gap-10">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="editorial-meta">Last Cycle</div>
                <h3 className="font-serif text-3xl">Quality Score: {lastEntry?.quality || '--'}</h3>
              </div>
              <div className="w-16 h-16 rounded-full border border-ink/5 flex items-center justify-center">
                <Moon size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-1">
                <div className="editorial-meta text-accent">Rhythm</div>
                <div className="font-serif text-2xl italic">{lastEntry ? `${lastEntry.bedTime} - ${lastEntry.wakeTime}` : '--:--'}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="editorial-meta text-accent">Efficiency</div>
                <div className="font-serif text-2xl italic">{lastEntry?.efficiency || '--'}%</div>
              </div>
            </div>

            <div className="editorial-rule"></div>

            <p className="text-sm italic leading-relaxed text-accent">
              {lastEntry ? (
                "Your circadian rhythm is stabilizing. Maintaining consistent Bed/Wake times is the architecture of restoration."
              ) : (
                "Start registering your nights to map your restorative architecture."
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 border border-ink/10 rounded-3xl flex flex-col gap-3">
               <Sun size={18} className="text-accent" />
               <div className="editorial-meta">Morning Routine</div>
               <p className="text-xs italic">Sunlight within 20min of waking.</p>
            </div>
            <div className="p-6 border border-ink/10 rounded-3xl flex flex-col gap-3">
               <Wind size={18} className="text-accent" />
               <div className="editorial-meta">Environment</div>
               <p className="text-xs italic">Ideal Temp: 18.5°C reached.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <div className="editorial-meta">History / Trends</div>
          <div className="flex flex-col gap-1">
            {entries.length === 0 ? (
              <div className="py-20 text-center editorial-meta opacity-40 italic">No historical cycles recorded.</div>
            ) : (
              entries.map((entry) => (
                <SleepLogItem key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
