/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShieldAlert, History, LineChart as ChartIcon, ChevronDown, ChevronUp, Zap, Check } from 'lucide-react';
import { FearItem, ExposureLog, ExposureData } from '../../domain/entities';
import { cn } from '../../shared/utils/TailwindMerge';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import HierarchyItem from '../components/domain/exposure/HierarchyItem';
import LogItem from '../components/domain/exposure/LogItem';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialInput, 
  EditorialTextArea 
} from '../components/shared';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ActiveSession {
  item: FearItem;
  preSud: number;
  postSud: number;
  catastrophicPrediction: string;
  realOutcome: string;
  safetyBehaviorsAvoided: string;
  duration: number;
  notes: string;
}

export default function ExposureView({ data, onUpdate }: { data: ExposureData, onUpdate: (d: ExposureData) => void }) {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'logs'>('hierarchy');
  const [isAdding, setIsAdding] = useState(false);
  const [newAnchor, setNewAnchor] = useState({ text: '', sud: 50 });
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedChartId, setExpandedChartId] = useState<string | null>(null);

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
    if (!confirm("Are you sure you want to remove this fear anchor?")) return;
    triggerHaptic('heavy');
    onUpdate({ ...data, hierarchy: data.hierarchy.filter(i => i.id !== id) });
  };

  const handleStartExposure = (item: FearItem) => {
    triggerHaptic('medium');
    setActiveSession({ 
      item, 
      preSud: item.sud, 
      postSud: Math.max(0, item.sud - 20),
      catastrophicPrediction: '',
      realOutcome: '',
      safetyBehaviorsAvoided: '',
      duration: 15,
      notes: ''
    });
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
      duration: activeSession.duration,
      notes: activeSession.notes,
      catastrophicPrediction: activeSession.catastrophicPrediction,
      realOutcome: activeSession.realOutcome,
      safetyBehaviorsAvoided: activeSession.safetyBehaviorsAvoided
    };
    onUpdate({ ...data, logs: [newLog, ...data.logs] });
    setActiveSession(null);
    setShowAdvanced(false);
  };

  const logsByItem = useMemo(() => {
    const groups: Record<string, ExposureLog[]> = {};
    data.logs.forEach(log => {
      if (!groups[log.fearItemId]) groups[log.fearItemId] = [];
      groups[log.fearItemId].push(log);
    });
    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => a.date.localeCompare(b.date));
    });
    return groups;
  }, [data.logs]);

  return (
    <div className="flex flex-col gap-10 pb-20">
      <EditorialModal
        isOpen={!!activeSession}
        onClose={() => setActiveSession(null)}
        title="Active Exposure Cycle."
        subtitle={activeSession?.item.text || "Exposure"}
      >
        <div className="flex flex-col gap-8">
          {activeSession && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50 text-center md:text-left">Distress Level: Before ({activeSession.preSud})</label>
                  <input 
                    type="range" 
                    className="accent-ink h-1 w-full" 
                    value={activeSession.preSud} 
                    onChange={(e) => setActiveSession({...activeSession, preSud: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50 text-center md:text-left">Distress Level: After ({activeSession.postSud})</label>
                  <input 
                    type="range" 
                    className="accent-ink h-1 w-full" 
                    value={activeSession.postSud} 
                    onChange={(e) => setActiveSession({...activeSession, postSud: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <EditorialInput 
                label="Duration (Minutes)"
                type="number"
                value={activeSession.duration}
                onChange={(e) => setActiveSession({...activeSession, duration: parseInt(e.target.value) || 0})}
              />

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 editorial-meta text-accent hover:text-ink transition-colors w-fit"
                >
                  {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Advanced ERP Data
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-6 pt-4"
                    >
                      <EditorialTextArea 
                        label="Catastrophic Prediction (What do you fear will happen?)"
                        placeholder="e.g., I will have a heart attack and no one will help..."
                        value={activeSession.catastrophicPrediction}
                        onChange={(e) => setActiveSession({...activeSession, catastrophicPrediction: e.target.value})}
                      />
                      <EditorialTextArea 
                        label="Actual Outcome (What actually happened?)"
                        placeholder="e.g., I felt tight in my chest but I continued to breathe and it passed..."
                        value={activeSession.realOutcome}
                        onChange={(e) => setActiveSession({...activeSession, realOutcome: e.target.value})}
                      />
                      <EditorialTextArea 
                        label="Safety Behaviors Avoided"
                        placeholder="e.g., I didn't check my pulse, I didn't call my partner for reassurance..."
                        value={activeSession.safetyBehaviorsAvoided}
                        onChange={(e) => setActiveSession({...activeSession, safetyBehaviorsAvoided: e.target.value})}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-ink/5 mt-auto">
                <button 
                  onClick={() => setActiveSession(null)} 
                  className="editorial-meta text-accent hover:text-red-500 transition-colors"
                >
                  Discard
                </button>
                <EditorialButton onClick={commitSession} icon={<Check size={14} />}>
                  Archive Cycle
                </EditorialButton>
              </div>
            </>
          )}
        </div>
      </EditorialModal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Protocol / ERP</div>
          <h2 className="font-serif text-3xl md:text-4xl">Facing the Storm.</h2>
        </div>
        <div className="flex gap-8 w-full md:w-auto border-b md:border-none border-ink/5">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col gap-8">
            <div className="p-10 border border-ink/5 rounded-[2.5rem] bg-ink/[0.01] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-accent" size={20} />
                <span className="editorial-meta text-[10px] uppercase tracking-widest">Therapeutic Wisdom</span>
              </div>
              <p className="text-sm italic leading-relaxed font-serif opacity-60">
                Exposure therapy works through habituation. By gradually approaching feared situations without using safety behaviors, you teach your brain that the danger is not real. 
                SUDs (Subjective Units of Distress) help map this journey.
              </p>
            </div>
            
            {isAdding ? (
              <div className="p-8 border border-ink/10 rounded-[2rem] bg-paper shadow-lg flex flex-col gap-6">
                <EditorialInput 
                  autoFocus
                  label="Anchor Description"
                  placeholder="e.g., Sitting in a crowded cafe alone"
                  value={newAnchor.text}
                  onChange={(e) => setNewAnchor({...newAnchor, text: e.target.value})}
                />
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="editorial-meta text-[9px] uppercase tracking-widest">Expected Intensity</label>
                    <span className="font-mono text-xs">{newAnchor.sud} SUDs</span>
                  </div>
                  <input type="range" className="accent-ink h-1" value={newAnchor.sud} onChange={(e) => setNewAnchor({...newAnchor, sud: parseInt(e.target.value)})} />
                  <div className="flex justify-between text-[8px] editorial-meta opacity-30 uppercase">
                    <span>Peace</span>
                    <span>Panic</span>
                  </div>
                </div>
                <div className="flex justify-end gap-6 mt-4">
                  <button onClick={() => setIsAdding(false)} className="editorial-meta">Cancel</button>
                  <EditorialButton onClick={handleAddAnchor}>
                    Solidify Anchor
                  </EditorialButton>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="group w-full py-6 border-2 border-dashed border-ink/10 rounded-[2rem] hover:border-ink/30 hover:bg-ink/[0.01] transition-all editorial-meta flex items-center justify-center gap-2"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Add Fear Anchor
              </button>
            )}

            <div className="flex flex-col gap-6">
               <div className="editorial-meta flex items-center gap-2 opacity-40"><ChartIcon size={12} /> Habituation Trends</div>
               {data.hierarchy.filter(h => (logsByItem[h.id]?.length || 0) >= 2).map(item => (
                 <div key={item.id} className="border border-ink/5 rounded-2xl overflow-hidden bg-white/50">
                    <button 
                      onClick={() => setExpandedChartId(expandedChartId === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-ink/5 transition-all"
                    >
                      <span className="font-serif italic text-sm">{item.text}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] editorial-meta opacity-40 uppercase">{logsByItem[item.id].length} Cycles</span>
                        {expandedChartId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedChartId === item.id && (
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: 200 }} exit={{ height: 0 }}
                          className="px-4 pb-4"
                        >
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={logsByItem[item.id].map((l, i) => ({ name: i + 1, pre: l.preSud, post: l.postSud }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
                                <XAxis dataKey="name" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'serif' }}
                                  labelFormatter={(val) => `Cycle #${val}`}
                                />
                                <Line type="monotone" dataKey="pre" stroke="#1a1a1a" strokeDasharray="5 5" strokeWidth={1} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="post" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 4 }} />
                              </LineChart>
                           </ResponsiveContainer>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
               ))}
               {data.hierarchy.filter(h => (logsByItem[h.id]?.length || 0) >= 2).length === 0 && (
                 <p className="text-[10px] editorial-meta italic opacity-30 text-center">Consistency is required to map habituation.</p>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {data.hierarchy.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-ink/5 rounded-[2.5rem]">
                <p className="editorial-meta text-accent italic opacity-40">The hierarchy is empty.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between editorial-meta text-[8px] uppercase tracking-widest opacity-30 mb-2">
                  <span>Fear Anchor</span>
                  <span>SUD Intensity</span>
                </div>
                {data.hierarchy.map(item => (
                  <HierarchyItem 
                    key={item.id} 
                    item={item} 
                    onDelete={() => handleDeleteAnchor(item.id)} 
                    onStartExposure={() => handleStartExposure(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
           {data.logs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-ink/5 rounded-[3rem]">
              <History className="opacity-10" size={60} strokeWidth={1} />
              <div className="text-center">
                <p className="editorial-meta text-lg">Your history is a blank page.</p>
                <p className="editorial-meta text-accent opacity-40 text-xs italic mt-1">Every cycle recorded is a step toward freedom.</p>
              </div>
            </div>
           ) : (
             <div className="flex flex-col gap-6">
                {data.logs.map(log => {
                   const item = data.hierarchy.find(i => i.id === log.fearItemId);
                   return (
                     <div key={log.id} className="group border border-ink/5 rounded-[2rem] bg-paper overflow-hidden hover:shadow-xl hover:shadow-ink/[0.02] transition-all">
                        <LogItem log={log} anchorText={item?.text || 'Removed Anchor'} />
                        {(log.catastrophicPrediction || log.realOutcome) && (
                          <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-ink/5 mt-4">
                             {log.catastrophicPrediction && (
                               <div className="flex flex-col gap-2">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-accent opacity-60">The Shadow (Prediction)</span>
                                  <p className="text-sm font-serif italic opacity-80 leading-relaxed">"{log.catastrophicPrediction}"</p>
                               </div>
                             )}
                             {log.realOutcome && (
                               <div className="flex flex-col gap-2">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-accent opacity-60">The Light (Actual Outcome)</span>
                                  <p className="text-sm font-serif italic text-ink leading-relaxed">"{log.realOutcome}"</p>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   );
                })}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
