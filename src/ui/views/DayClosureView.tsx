/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { X, ArrowRight, Heart, Star, Flame, BookOpen, Activity, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Vault, DayClosure } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import { getHabitCompletionForDate } from '../../application/usecases/TrackHabitUseCase';
import { 
  EditorialButton 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';
import LambdaAvatar from '../components/shared/LambdaAvatar';
import { computeReflejoState } from '../../application/usecases/GetReflejoStateUseCase';

interface DayClosureViewProps {
  vault: Vault;
  onClose: () => void;
  onSave: (closure: DayClosure) => void;
}

export default function DayClosureView({ vault, onClose, onSave }: DayClosureViewProps) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState('');
  const [gratitude, setGratitude] = useState(['', '', '']);

  // Calculate day stats
  const today = todayISO();
  const habitStats = getHabitCompletionForDate(vault, today);
  const journalCount = vault.journal?.filter(e => e.date === today).length || 0;
  const exposureCount = vault.exposure?.logs?.filter(l => l.date === today).length || 0;
  const sleepEntry = vault.sleep?.find(s => s.date === today);

  const reflejoState = useMemo(() => computeReflejoState(vault), [vault]);

  // Sleep Efficiency calculation
  const sleepEfficiency = useMemo(() => {
    if (!sleepEntry?.duration || !sleepEntry?.timeInBed) return null;
    return (sleepEntry.duration / sleepEntry.timeInBed) * 100;
  }, [sleepEntry]);

  const handleFinish = () => {
    const closure: DayClosure = {
      id: crypto.randomUUID(),
      date: today,
      summary,
      gratitude: gratitude.filter(g => g.trim() !== ''),
      closedAt: new Date().toISOString()
    };
    triggerHaptic('success');
    onSave(closure);
  };

  const updateGratitude = (index: number, val: string) => {
    const newG = [...gratitude];
    newG[index] = val;
    setGratitude(newG);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink flex items-center justify-center p-6 md:p-12 text-paper overflow-y-auto"
    >
      <button 
        onClick={onClose}
        className="absolute top-10 right-10 text-paper/30 hover:text-paper transition-colors"
      >
        <X size={32} />
      </button>

      <div className="max-w-2xl w-full flex flex-col gap-12 py-20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col gap-2">
                <span className="editorial-meta text-paper/40 uppercase tracking-[0.3em]">{language === 'es' ? 'Síntesis' : 'Synthesis'}</span>
                <h2 className="font-serif text-4xl md:text-5xl italic leading-tight">{language === 'es' ? '¿Cómo resumirías el día de hoy?' : 'How would you summarize today?'}</h2>
              </div>
              
              <textarea 
                autoFocus
                placeholder={language === 'es' ? 'En una frase...' : "In one sentence..."}
                className="bg-transparent border-b border-paper/20 focus:border-paper outline-none py-4 font-serif text-2xl md:text-3xl italic w-full resize-none h-40 leading-relaxed transition-colors"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />

              <div className="flex justify-between items-center mt-10">
                <p className="text-paper/30 font-serif italic text-sm">{language === 'es' ? 'Observa el día como un solo trazo de tinta.' : 'Observe the day as a single stroke of ink.'}</p>
                <EditorialButton 
                  disabled={!summary.trim()}
                  onClick={() => setStep(2)}
                  icon={<ArrowRight size={14} />}
                >
                  {t('common.continue')}
                </EditorialButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col gap-2">
                <span className="editorial-meta text-paper/40 uppercase tracking-[0.3em]">{language === 'es' ? 'Gracia' : 'Grace'}</span>
                <h2 className="font-serif text-4xl md:text-5xl italic leading-tight">{language === 'es' ? 'Tres cosas por las que estás agradecido:' : "Three things you're grateful for:"}</h2>
              </div>

              <div className="flex flex-col gap-8">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex gap-6 items-center">
                    <span className="font-mono text-sm opacity-20">0{i+1}</span>
                    <input 
                      autoFocus={i === 0}
                      placeholder="..."
                      className="bg-transparent border-b border-paper/10 focus:border-paper outline-none py-2 font-serif text-2xl italic flex-grow transition-colors"
                      value={gratitude[i]}
                      onChange={(e) => updateGratitude(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-10">
                <button onClick={() => setStep(1)} className="editorial-meta text-paper/30 flex items-center gap-2">
                  <ChevronLeft size={14} /> {t('common.back')}
                </button>
                <EditorialButton 
                  onClick={() => setStep(3)}
                  icon={<ArrowRight size={14} />}
                >
                  {language === 'es' ? 'Analizar Reposo' : 'Analyze Rest'}
                </EditorialButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col gap-2">
                <span className="editorial-meta text-paper/40 uppercase tracking-[0.3em]">CBT-I / Sleep Efficiency</span>
                <h2 className="font-serif text-4xl md:text-5xl italic leading-tight">
                  {language === 'es' ? 'Calibración del Sueño' : 'Sleep Calibration'}
                </h2>
              </div>

              <div className="p-10 border border-paper/10 rounded-[2.5rem] bg-white/5 flex flex-col gap-8">
                {sleepEntry ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="editorial-meta text-[10px] opacity-40 uppercase tracking-widest">{language === 'es' ? 'Eficiencia Real' : 'Real Efficiency'}</span>
                        <span className="font-serif text-6xl italic">{sleepEfficiency?.toFixed(0)}%</span>
                      </div>
                      <div className="text-right">
                        <span className="editorial-meta text-[10px] opacity-40 uppercase tracking-widest">{language === 'es' ? 'Objetivo TCC' : 'CBT Target'}</span>
                        <p className="font-mono text-lg text-emerald-400">&gt; 85%</p>
                      </div>
                    </div>
                    <p className="text-xs opacity-50 leading-relaxed italic">
                      {language === 'es' 
                        ? 'Tip: Para resultados exactos, considera usar un gadget (Oura, Apple Watch) o apps como Sleep Cycle. El registro manual es el primer paso hacia la conciencia.'
                        : 'Tip: For exact results, consider using a gadget (Oura, Apple Watch) or apps like Sleep Cycle. Manual logging is the first step toward awareness.'}
                    </p>
                  </div>
                ) : (
                  <p className="editorial-meta italic opacity-40 text-center py-10">
                    {language === 'es' ? 'No se detectó registro de sueño para hoy.' : 'No sleep log detected for today.'}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center mt-10">
                <button onClick={() => setStep(2)} className="editorial-meta text-paper/30 flex items-center gap-2">
                  <ChevronLeft size={14} /> {t('common.back')}
                </button>
                <EditorialButton 
                  onClick={() => setStep(4)}
                  icon={<CheckCircle2 size={14} />}
                >
                  {language === 'es' ? 'Ver Sello Final' : 'View Final Seal'}
                </EditorialButton>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col gap-12"
            >
              <div className="flex flex-col gap-4 items-center mb-6">
                <div className="scale-125">
                  <LambdaAvatar state={reflejoState} onLongPress={() => {}} />
                </div>
                <p className="editorial-meta text-paper/40 italic mt-6">
                   {t(reflejoState.messageKey)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="editorial-meta text-paper/40 uppercase tracking-[0.3em]">{language === 'es' ? 'Alineación' : 'Alignment'}</span>
                <h2 className="font-serif text-4xl md:text-5xl italic leading-tight text-center">{language === 'es' ? 'El día está asegurado.' : 'The day is secured.'}</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-paper/10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 opacity-40">
                    <Flame size={12} />
                    <span className="editorial-meta text-[8px] uppercase tracking-widest">{language === 'es' ? 'Hábitos' : 'Habits'}</span>
                  </div>
                  <span className="font-mono text-xl">{habitStats.completed}/{habitStats.total}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 opacity-40">
                    <BookOpen size={12} />
                    <span className="editorial-meta text-[8px] uppercase tracking-widest">{language === 'es' ? 'Diario' : 'Journal'}</span>
                  </div>
                  <span className="font-mono text-xl">{journalCount}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 opacity-40">
                    <Activity size={12} />
                    <span className="editorial-meta text-[8px] uppercase tracking-widest">{language === 'es' ? 'Exposiciones' : 'Exposures'}</span>
                  </div>
                  <span className="font-mono text-xl">{exposureCount}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 opacity-40">
                    <Star size={12} />
                    <span className="editorial-meta text-[8px] uppercase tracking-widest">{language === 'es' ? 'Sueño' : 'Sleep'}</span>
                  </div>
                  <span className="font-mono text-xl">{sleepEntry?.quality || '--'}/5</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                 <p className="text-paper/60 italic font-serif leading-relaxed text-center px-10">
                   {language === 'es'
                     ? '"Has observado, reestructurado y persistido. Descansa ahora. La crónica permanece a salvo."'
                     : '"You have observed, restructured, and persisted. Rest now. The chronicle remains safe."'}
                 </p>
              </div>

              <div className="flex justify-center mt-10">
                <EditorialButton 
                  onClick={handleFinish}
                  size="lg"
                  className="px-20 py-8 text-lg tracking-[0.2em]"
                  icon={<CheckCircle2 size={24} />}
                >
                  {language === 'es' ? 'Cerrar Bóveda' : 'Close the Vault'}
                </EditorialButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
