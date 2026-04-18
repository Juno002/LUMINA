/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Shield, ShieldAlert, History } from 'lucide-react';
import { FearItem, ExposureLog } from '../../domain/entities';
import { cn, todayISO, triggerHaptic } from '../../shared/lib/utils';
import HierarchyItem from '../components/domain/exposure/HierarchyItem';
import LogItem from '../components/domain/exposure/LogItem';

export default function ExposureView({ data, onUpdate }: { data: { hierarchy: FearItem[], logs: ExposureLog[] }, onUpdate: (d: any) => void }) {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'logs'>('hierarchy');
  const [isAdding, setIsAdding] = useState(false);
  const [newAnchor, setNewAnchor] = useState({ text: '', sud: 50 });
  const [activeSession, setActiveSession] = useState<{ item: FearItem, preSud: number, postSud: number } | null>(null);

  const handleAddAnchor = () => {
    if (!newAnchor.text) return;
    triggerHaptic('success');
    const newItem: FearItem = { 
      id: crypto.randomUUID(), 
      text: newAnchor.text, 
      sud: newAnchor.sud 
    };
    onUpdate({ ...data, hierarchy: [...data.hierarchy, newItem].sort((a,b) => a.sud - b.sud) });
    setNewAnchor({ text: '', sud: 50 });
    setIsAdding(false);
  };

  const handleDeleteAnchor = (id: string) => {
    triggerHaptic('heavy');
    onUpdate({ ...data, hierarchy: data.hierarchy.filter(i => i.id !== id) });
  };

  const handleStartExposure = (item: FearItem) => {
    triggerHaptic('medium');
    setActiveSession({ item, preSud: item.sud, postSud: item.sud });
  };

  const commitSession = () => {
    if (!activeSession) return;
    triggerHaptic('success');
    const newLog: ExposureLog = {
      id: crypto.randomUUID(),
      fearItemId: activeSession.item.id,
      date: todayISO(),
      preSud: activeSession.preSud,
      postSud: activeSession.postSud,
      duration: 0,
      notes: ''
    };
    onUpdate({ ...data, logs: [newLog, ...data.logs] });
    setActiveSession(null);
  };

  return (
    <div className="flex flex-col gap-10">
      {activeSession && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-[100] bg-paper/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-xl bg-paper border border-ink/10 rounded-[3rem] p-10 shadow-2xl flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <div className="editorial-meta">Active Session</div>
              <h3 className="font-serif text-3xl italic">{activeSession.item.text}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <label className="editorial-meta">Initial SUD ({activeSession.preSud})</label>
                <input 
                  type="range" 
                  className="accent-ink" 
                  value={activeSession.preSud} 
                  onChange={(e) => setActiveSession({...activeSession, preSud: parseInt(e.target.value)})} 
                />
              </div>
              <div className="flex flex-col gap-4">
                <label className="editorial-meta text-ink">Target / Post SUD ({activeSession.postSud})</label>
                <input 
                  type="range" 
                  className="accent-ink" 
                  value={activeSession.postSud} 
                  onChange={(e) => setActiveSession({...activeSession, postSud: parseInt(e.target.value)})} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-10 border-t border-ink/5">
              <button 
                onClick={() => setActiveSession(null)} 
                className="editorial-meta"
              >
                Abort
              </button>
              <button 
                onClick={commitSession} 
                className="bg-ink text-paper px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest"
              >
                Archive Session
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Protocol / ERP</div>
          <h2 className="font-serif text-3xl md:text-4xl">Facing the Storm.</h2>
        </div>
        <div className="flex gap-6 w-full md:w-auto border-b md:border-none border-ink/5">
          <button 
            onClick={() => setActiveTab('hierarchy')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeTab === 'hierarchy' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            Hierarchy
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeTab === 'logs' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'hierarchy' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            <div className="p-8 border border-ink/10 rounded-3xl bg-ink/[0.02] flex flex-col gap-4">
              <ShieldAlert className="text-ink" size={24} />
              <p className="text-sm italic leading-relaxed">
                Exposure therapy works by gradually approaching feared situations. 
                SUDs (Subjective Units of Distress) help map your journey from 0 (Peace) to 100 (Peak Anxiety).
              </p>
            </div>
            
            {isAdding ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border border-ink/10 rounded-2xl flex flex-col gap-4"
              >
                <input 
                  autoFocus
                  className="bg-transparent border-b border-ink/20 focus:border-ink outline-none py-2 italic font-serif text-xl"
                  placeholder="Describe the fear anchor..."
                  value={newAnchor.text}
                  onChange={(e) => setNewAnchor({...newAnchor, text: e.target.value})}
                />
                <div className="flex flex-col gap-2">
                  <label className="editorial-meta text-[9px]">SUD Intensity ({newAnchor.sud})</label>
                  <input type="range" className="accent-ink" value={newAnchor.sud} onChange={(e) => setNewAnchor({...newAnchor, sud: parseInt(e.target.value)})} />
                </div>
                <div className="flex justify-end gap-4 mt-2">
                  <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
                  <button onClick={handleAddAnchor} className="bg-ink text-paper px-6 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest">
                    Solidify Anchor
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-ink/10 rounded-2xl hover:border-ink/30 transition-all editorial-meta flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Fear Anchor
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {data.hierarchy.length === 0 ? (
              <div className="py-10 text-center editorial-meta text-accent italic">
                No anchors established.
              </div>
            ) : (
              data.hierarchy.map(item => (
                <HierarchyItem 
                  key={item.id} 
                  item={item} 
                  onDelete={() => handleDeleteAnchor(item.id)} 
                  onStartExposure={() => handleStartExposure(item)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
           {data.logs.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 border border-dashed border-ink/10 rounded-3xl">
              <History className="opacity-10" size={40} />
              <p className="editorial-meta">No exposure cycles recorded yet.</p>
            </div>
           ) : (
             <div className="flex flex-col gap-1">
                {data.logs.map(log => {
                   const item = data.hierarchy.find(i => i.id === log.fearItemId);
                   return (
                     <LogItem key={log.id} log={log} anchorText={item?.text || 'Removed Anchor'} />
                   );
                })}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
