/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShieldAlert, History, LineChart as ChartIcon, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { FearItem, ExposureLog, ExposureData } from '../../domain/entities';
import { cn } from '../../shared/utils/TailwindMerge';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import HierarchyItem from '../components/domain/exposure/HierarchyItem';
import LogItem from '../components/domain/exposure/LogItem';
import { 
  ConfirmActionModal,
  EditorialButton, 
  EditorialModal, 
  EditorialInput, 
  EditorialTextArea 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';
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
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'logs'>('hierarchy');
  const [isAdding, setIsAdding] = useState(false);
  const [newAnchor, setNewAnchor] = useState({ text: '', sud: 50 });
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedChartId, setExpandedChartId] = useState<string | null>(null);
  const [anchorToDeleteId, setAnchorToDeleteId] = useState<string | null>(null);

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
    setAnchorToDeleteId(id);
  };

  const confirmDeleteAnchor = () => {
    if (!anchorToDeleteId) return;
    triggerHaptic('heavy');
    onUpdate({ ...data, hierarchy: data.hierarchy.filter(i => i.id !== anchorToDeleteId) });
    setAnchorToDeleteId(null);
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
    triggerHaptic('success');
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
        title={t('exposure.activeCycle')}
        subtitle={activeSession?.item.text || "Exposure"}
      >
        <div className="flex flex-col gap-8">
          {activeSession && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50 text-center md:text-left">{t('exposure.preSud')} ({activeSession.preSud})</label>
                  <input 
                    type="range" 
                    className="accent-ink h-1 w-full" 
                    value={activeSession.preSud} 
                    onChange={(e) => setActiveSession({...activeSession, preSud: parseInt(e.target.value)})} 
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="editorial-meta text-[9px] uppercase tracking-widest opacity-50 text-center md:text-left">{t('exposure.postSud')} ({activeSession.postSud})</label>
                  <input 
                    type="range" 
                    className="accent-ink h-1 w-full" 
                    value={activeSession.postSud} 
                    onChange={(e) => setActiveSession({...activeSession, postSud: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <EditorialInput 
                label={t('exposure.duration')}
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
                  {t('exposure.advancedData')}
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
                        label={t('exposure.prediction')}
                        placeholder={t('exposure.predictionPlaceholder')}
                        value={activeSession.catastrophicPrediction}
                        onChange={(e) => setActiveSession({...activeSession, catastrophicPrediction: e.target.value})}
                      />
                      <EditorialTextArea 
                        label={t('exposure.outcome')}
                        placeholder={t('exposure.outcomePlaceholder')}
                        value={activeSession.realOutcome}
                        onChange={(e) => setActiveSession({...activeSession, realOutcome: e.target.value})}
                      />
                      <EditorialTextArea 
                        label={t('exposure.safetyBehaviors')}
                        placeholder={t('exposure.safetyBehaviorsPlaceholder')}
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
                  {t('common.cancel')}
                </button>
                <EditorialButton onClick={commitSession} icon={<Check size={14} />}>
                  {t('common.archive')}
                </EditorialButton>
              </div>
            </>
          )}
        </div>
      </EditorialModal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Protocol / ERP</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('exposure.title')}</h2>
        </div>
        <div className="flex gap-8 w-full md:w-auto border-b md:border-none border-ink/5">
          <button 
            onClick={() => setActiveTab('hierarchy')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeTab === 'hierarchy' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            {t('exposure.hierarchy')}
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn("editorial-meta pb-4 md:pb-2 border-b-2 transition-all flex-grow md:flex-grow-0 text-center", activeTab === 'logs' ? "border-ink text-ink" : "border-transparent text-accent")}
          >
            {t('exposure.history')}
          </button>
        </div>
      </div>

      {activeTab === 'hierarchy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col gap-8">
            <div className="p-10 border border-ink/5 rounded-[2.5rem] bg-ink/[0.01] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-accent" size={20} />
                <span className="editorial-meta text-[10px] uppercase tracking-widest">{t('exposure.wisdomTitle')}</span>
              </div>
              <p className="text-sm italic leading-relaxed font-serif opacity-60">
                {t('exposure.wisdomText')}
              </p>
            </div>
            
            {isAdding ? (
              <div className="p-8 border border-ink/10 rounded-[2rem] bg-paper shadow-lg flex flex-col gap-6">
                <EditorialInput 
                  autoFocus
                  label={t('exposure.anchorDescription')}
                  placeholder={t('exposure.anchorPlaceholder')}
                  value={newAnchor.text}
                  onChange={(e) => setNewAnchor({...newAnchor, text: e.target.value})}
                />
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="editorial-meta text-[9px] uppercase tracking-widest">{t('exposure.expectedIntensity')}</label>
                    <span className="font-mono text-xs">{newAnchor.sud} SUDs</span>
                  </div>
                  <input type="range" className="accent-ink h-1" value={newAnchor.sud} onChange={(e) => setNewAnchor({...newAnchor, sud: parseInt(e.target.value)})} />
                  <div className="flex justify-between text-[8px] editorial-meta opacity-30 uppercase">
                    <span>{t('common.peace')}</span>
                    <span>{t('common.panic')}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-6 mt-4">
                  <button onClick={() => setIsAdding(false)} className="editorial-meta">{t('common.cancel')}</button>
                  <EditorialButton onClick={handleAddAnchor}>
                    {t('exposure.solidifyAnchor')}
                  </EditorialButton>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="group w-full py-6 border-2 border-dashed border-ink/10 rounded-[2rem] hover:border-ink/30 hover:bg-ink/[0.01] transition-all editorial-meta flex items-center justify-center gap-2"
              >
                <Plus size={14} className="group-hover:rotate-90 transition-transform" /> {t('exposure.addAnchor')}
              </button>
            )}

            <div className="flex flex-col gap-6">
               <div className="editorial-meta flex items-center gap-2 opacity-40"><ChartIcon size={12} /> {t('exposure.habituationTrends')}</div>
               {data.hierarchy.filter(h => (logsByItem[h.id]?.length || 0) >= 2).map(item => (
                 <div key={item.id} className="border border-ink/5 rounded-2xl overflow-hidden bg-white/50">
                    <button 
                      onClick={() => setExpandedChartId(expandedChartId === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-ink/5 transition-all"
                    >
                      <span className="font-serif italic text-sm">{item.text}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] editorial-meta opacity-40 uppercase">{logsByItem[item.id].length} {t('exposure.cycles')}</span>
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
                                  labelFormatter={(val) => `${t('common.cycle')} #${val}`}
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
                 <p className="text-[10px] editorial-meta italic opacity-30 text-center">{t('exposure.noHabituationData')}</p>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {data.hierarchy.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-ink/5 rounded-[2.5rem]">
                <p className="editorial-meta text-accent italic opacity-40">{t('exposure.emptyHierarchy')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between editorial-meta text-[8px] uppercase tracking-widest opacity-30 mb-2">
                  <span>{t('exposure.fearAnchor')}</span>
                  <span>{t('exposure.sudIntensity')}</span>
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
                <p className="editorial-meta text-lg">{t('exposure.emptyHistory')}</p>
                <p className="editorial-meta text-accent opacity-40 text-xs italic mt-1">{t('exposure.historyEncouragement')}</p>
              </div>
            </div>
           ) : (
             <div className="flex flex-col gap-6">
                {data.logs.map(log => {
                   const item = data.hierarchy.find(i => i.id === log.fearItemId);
                   return (
                     <div key={log.id} className="group border border-ink/5 rounded-[2rem] bg-paper overflow-hidden hover:shadow-xl hover:shadow-ink/[0.02] transition-all">
                        <LogItem log={log} anchorText={item?.text || t('common.removedAnchor')} />
                        {(log.catastrophicPrediction || log.realOutcome) && (
                           <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-ink/5 mt-4">
                             {log.catastrophicPrediction && (
                               <div className="flex flex-col gap-2">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-accent opacity-60">{t('exposure.shadowLabel')}</span>
                                  <p className="text-sm font-serif italic opacity-80 leading-relaxed">"{log.catastrophicPrediction}"</p>
                               </div>
                             )}
                             {log.realOutcome && (
                               <div className="flex flex-col gap-2">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-accent opacity-60">{t('exposure.lightLabel')}</span>
                                  <p className="text-sm font-serif italic text-ink leading-relaxed">"{log.realOutcome}"</p>
                               </div>
                             )}
                             {log.safetyBehaviorsAvoided && (
                               <div className="col-span-1 md:col-span-2 flex flex-col gap-2 border-t border-ink/5 pt-4">
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-accent opacity-60">{t('exposure.safetyBehaviors')}</span>
                                  <p className="text-sm font-serif italic text-green-600/70 leading-relaxed">"{log.safetyBehaviorsAvoided}"</p>
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

      <ConfirmActionModal
        isOpen={!!anchorToDeleteId}
        onClose={() => setAnchorToDeleteId(null)}
        onConfirm={confirmDeleteAnchor}
        title={language === 'es' ? 'Eliminar ancla de miedo.' : 'Delete fear anchor.'}
        description={
          language === 'es'
            ? 'La jerarquía perderá este ancla y su contexto asociado en la vista principal.'
            : 'This anchor will be removed from the hierarchy and disappear from the main protocol view.'
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
