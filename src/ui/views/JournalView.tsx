/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Plus, Search, BookOpen, X, ArrowRight, Sparkles, Check } from 'lucide-react';
import { ThoughtEntry, ClinicalProfile } from '../../domain/entities';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import EntryCard from '../components/domain/journal/EntryCard';
import { detectDistortions } from '../../application/usecases/DetectDistortionsUseCase';
import { calculateICC } from '../../domain/services/ICCCalculator';
import { COGNITIVE_DISTORTIONS } from '../../domain/constants/Distortions';
import { 
  EditorialButton, 
  EditorialInput, 
  EditorialTextArea 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';

interface JournalViewProps {
  entries: ThoughtEntry[];
  onUpdate: (e: ThoughtEntry[]) => void;
  clinicalProfile?: ClinicalProfile;
}

export default function JournalView({ entries, onUpdate, clinicalProfile }: JournalViewProps) {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingEntry, setEditingEntry] = useState<ThoughtEntry | null>(null);

  const filteredEntries = useMemo(() => entries.filter(e => 
    e.situation?.toLowerCase().includes(search.toLowerCase()) ||
    e.automaticThought?.toLowerCase().includes(search.toLowerCase())
  ), [entries, search]);

  const handleSave = (entry: ThoughtEntry) => {
    triggerHaptic('success');
    if (editingEntry) {
      onUpdate(entries.map(e => e.id === entry.id ? entry : e));
    } else {
      onUpdate([entry, ...entries]);
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Erase this observation summary?")) {
      triggerHaptic('heavy');
      onUpdate(entries.filter(e => e.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">Library / Logs</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('journal.title')}.</h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <EditorialButton 
            onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
            icon={<Plus size={14} />}
          >
            {t('journal.new_entry')}
          </EditorialButton>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-accent opacity-30 group-focus-within:opacity-100 transition-opacity" size={14} />
        <input 
          type="text"
          placeholder="Search archives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-ink/5 focus:border-ink rounded-none py-4 pl-6 pr-4 transition-all outline-none text-sm italic font-serif"
        />
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <JournalForm 
            clinicalProfile={clinicalProfile}
            initialData={editingEntry || undefined}
            onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }} 
            onSave={handleSave} 
          />
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {filteredEntries.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 border-2 border-dashed border-ink/5 rounded-3xl">
                <BookOpen className="opacity-10" size={40} strokeWidth={1} />
                <p className="editorial-meta">{t('journal.empty_state')}</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={() => handleDelete(entry.id)} 
                  onEdit={() => { setEditingEntry(entry); setIsFormOpen(true); }}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FormProps {
  initialData?: ThoughtEntry;
  onCancel: () => void;
  onSave: (e: ThoughtEntry) => void;
  clinicalProfile?: ClinicalProfile;
}

function JournalForm({ initialData, onCancel, onSave, clinicalProfile }: FormProps) {
  const { t, language } = useTranslation();
  const [level, setLevel] = useState<1 | 2 | 3>(initialData?.level || 1);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ThoughtEntry>>(initialData || {
    date: todayISO(),
    intensity: 5,
    level: 1,
    distortions: [],
    tags: []
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Distortion detection with debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.automaticThought) {
        const detected = detectDistortions(formData.automaticThought, clinicalProfile);
        const detectedIds = detected.map(d => d.id);
        // Merge with existing but don't overwrite user-deleted ones (simplified for now: just update)
        setFormData(prev => ({ ...prev, distortions: detectedIds }));
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.automaticThought, clinicalProfile]);

  const iccResult = useMemo(() => {
    if (level === 3 && formData.originalIntensity !== undefined && formData.finalCredibility !== undefined) {
      return calculateICC(formData.originalIntensity, formData.finalCredibility);
    }
    return null;
  }, [level, formData.originalIntensity, formData.finalCredibility]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as ThoughtEntry,
      id: formData.id || crypto.randomUUID(),
      level,
      tags: formData.tags || [],
      distortions: formData.distortions || [],
      rationalResponse: formData.rationalResponse || '',
      outcomeMood: formData.outcomeMood || formData.primaryEmotion || '',
      outcomeIntensity: formData.outcomeIntensity || formData.intensity || 5
    });
  };

  const totalSteps = level === 1 ? 2 : level === 2 ? 3 : 4;
  const canGoNext = currentStep < totalSteps;
  const canGoPrev = currentStep > 1;

  const handleNext = () => {
    if (canGoNext) {
      triggerHaptic('light');
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      triggerHaptic('light');
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
      className="p-8 md:p-12 border border-ink/10 rounded-[2rem] bg-paper shadow-2xl shadow-ink/5"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* Level Indicator */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="editorial-meta uppercase tracking-widest text-[9px] opacity-40">CBT Framework / Level {level}</div>
            <div className="font-serif italic text-lg">
              {level === 1 && (language === 'es' ? 'Observación y Conciencia' : 'Observation & Awareness')}
              {level === 2 && (language === 'es' ? 'Desplazamiento y Perspectiva' : 'Displacement & Perspective')}
              {level === 3 && (language === 'es' ? 'Reestructuración Basada en Evidencia' : 'Evidence-based Restructuring')}
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l as 1 | 2 | 3)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${level >= l ? 'bg-ink' : 'bg-ink/10'}`}
              />
            ))}
          </div>
        </div>        {/* Level 1: Observation */}
        <AnimatePresence mode="wait">
          {(!isMobile || currentStep === 1) && (
            <motion.div 
              key="step1"
              initial={isMobile ? { opacity: 0, x: 20 } : {}}
              animate={isMobile ? { opacity: 1, x: 0 } : {}}
              exit={isMobile ? { opacity: 0, x: -20 } : {}}
              className="grid grid-cols-1 md:grid-cols-2 gap-10"
            >
              <EditorialTextArea 
                label={t('journal.situation')}
                required
                placeholder={language === 'es' ? '¿Qué pasó? (ej. reunión con el jefe)' : "What happened? (e.g., meeting with boss)"}
                value={formData.situation || ''}
                onChange={(e) => setFormData({...formData, situation: e.target.value})}
              />
              <div className="flex flex-col gap-3">
                <EditorialTextArea 
                  label={t('journal.thought')}
                  required
                  placeholder={language === 'es' ? '¿Qué te dijiste a ti mismo?' : "What did you tell yourself?"}
                  value={formData.automaticThought || ''}
                  onChange={(e) => setFormData({...formData, automaticThought: e.target.value})}
                />
                
                {/* Distortion Chips */}
                <AnimatePresence>
                  {formData.distortions && formData.distortions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-2 mt-2"
                    >
                      {formData.distortions.map(dId => {
                        const d = COGNITIVE_DISTORTIONS.find(x => x.id === dId);
                        return d ? (
                          <span key={dId} className="bg-ink/5 text-accent border border-ink/5 px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-tighter flex items-center gap-2">
                            {d.name}
                            <button type="button" onClick={() => setFormData(f => ({ ...f, distortions: f.distortions?.filter(x => x !== dId) }))}>
                              <X size={10} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nudge L2 */}
                {level === 1 && formData.distortions && formData.distortions.length > 0 && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    type="button"
                    onClick={() => { setLevel(2); triggerHaptic('light'); }}
                    className="text-left text-sm text-accent hover:text-ink transition-colors font-serif italic flex items-center gap-2 mt-4"
                  >
                    <No icon={Sparkles} size={14} />
                    {language === 'es' ? 'Distorsiones detectadas. ¿Quieres ir más profundo?' : 'Distortions detected. Would you like to go deeper?'} 
                    <span className="underline underline-offset-4">Level {language === 'es' ? '2' : '2'} →</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {(!isMobile || currentStep === 2) && (
            <motion.div 
              key="step2"
              initial={isMobile ? { opacity: 0, x: 20 } : {}}
              animate={isMobile ? { opacity: 1, x: 0 } : {}}
              exit={isMobile ? { opacity: 0, x: -20 } : {}}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              <EditorialInput 
                label={language === 'es' ? 'Emoción Central' : "Core Emotion"}
                required
                placeholder={language === 'es' ? 'Ansiedad, Tristeza, Frustración...' : "Anxious, Sad, Frustrated..."}
                value={formData.primaryEmotion || ''}
                onChange={(e) => setFormData({...formData, primaryEmotion: e.target.value})}
              />
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">{t('journal.level')} ({formData.intensity}/10)</label>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  className="accent-ink h-10"
                  value={formData.intensity}
                  onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
                />
              </div>
              <EditorialInput 
                label={language === 'es' ? 'Fecha de Observación' : "Observation Date"}
                type="date"
                variant="mono"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level 2: Displacement */}
        <AnimatePresence>
          {level >= 2 && (!isMobile || currentStep === 3) && (
            <motion.div
              initial={isMobile ? { opacity: 0, x: 20 } : { height: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { height: 'auto', opacity: 1 }}
              exit={isMobile ? { opacity: 0, x: -20 } : { height: 0, opacity: 0 }}
              className="flex flex-col gap-10 overflow-hidden"
            >
              {!isMobile && <div className="h-px bg-ink/5 w-full" />}
              <div className="flex flex-col gap-8">
                <EditorialTextArea 
                  label={language === 'es' ? 'Técnica del Amigo' : "The Friend Technique"}
                  placeholder={language === 'es' ? 'Si un buen amigo te dijera esto, ¿qué le dirías?' : "If a dear friend told you this, what would you say to them?"}
                  value={formData.friendResponse || ''}
                  onChange={(e) => setFormData({...formData, friendResponse: e.target.value})}
                />
                
                {/* Nudge L3 */}
                {level === 2 && formData.friendResponse && formData.friendResponse.length > 15 && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    type="button"
                    onClick={() => { setLevel(3); triggerHaptic('light'); }}
                    className="text-left text-sm text-accent hover:text-ink transition-colors font-serif italic flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    {language === 'es' ? '¿Listo para desafiar este pensamiento con evidencia?' : 'Ready to challenge this thought with evidence?'}
                    <span className="underline underline-offset-4">Level 3 →</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level 3: Restructure */}
        <AnimatePresence>
          {level === 3 && (!isMobile || currentStep === 4) && (
            <motion.div
              initial={isMobile ? { opacity: 0, x: 20 } : { height: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { height: 'auto', opacity: 1 }}
              exit={isMobile ? { opacity: 0, x: -20 } : { height: 0, opacity: 0 }}
              className="flex flex-col gap-10 overflow-hidden"
            >
              {!isMobile && <div className="h-px bg-ink/5 w-full" />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <EditorialTextArea 
                  label={language === 'es' ? 'Evidencia A FAVOR' : "Evidence FOR"}
                  placeholder={language === 'es' ? '¿Qué hechos apoyan este pensamiento automático?' : "What facts support this automatic thought?"}
                  value={formData.evidenceFor || ''}
                  onChange={(e) => setFormData({...formData, evidenceFor: e.target.value})}
                />
                <EditorialTextArea 
                  label={language === 'es' ? 'Evidencia EN CONTRA' : "Evidence AGAINST"}
                  placeholder={language === 'es' ? '¿Qué hechos contradicen o desafían este pensamiento?' : "What facts contradict or challenge this thought?"}
                  value={formData.evidenceAgainst || ''}
                  onChange={(e) => setFormData({...formData, evidenceAgainst: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="editorial-meta">{language === 'es' ? 'Creencia Inicial' : 'Initial Belief'} ({formData.originalIntensity || 0}/10)</label>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      className="accent-ink h-10"
                      value={formData.originalIntensity || 5}
                      onChange={(e) => setFormData({...formData, originalIntensity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="editorial-meta">{language === 'es' ? 'Credibilidad Final' : 'Final Credibility'} ({formData.finalCredibility || 0}/10)</label>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      className="accent-ink h-10"
                      value={formData.finalCredibility || 5}
                      onChange={(e) => setFormData({...formData, finalCredibility: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                {/* ICC Display */}
                {iccResult && (
                  <div className="p-6 border border-ink/10 rounded-2xl bg-ink/[0.01] flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-mono text-xl font-bold ${
                      iccResult.label === 'excellent' ? 'text-emerald-500 border-emerald-500/20' : 
                      iccResult.label === 'moderate' ? 'text-amber-500 border-amber-500/20' : 
                      'text-red-400 border-red-400/20'
                    }`}>
                      {iccResult.value.toFixed(2)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="editorial-meta uppercase tracking-widest text-[8px]">Cognitive Change Index</div>
                      <div className="font-serif italic text-sm text-accent leading-tight">{iccResult.message}</div>
                    </div>
                  </div>
                )}
              </div>

              <EditorialTextArea 
                label={t('journal.alternative')}
                className="h-32"
                placeholder={language === 'es' ? 'Síntesis: Una forma más realista y útil de ver esta situación...' : "Synthesis: A more realistic, helpful way to view this situation..."}
                value={formData.rationalResponse || ''}
                onChange={(e) => setFormData({...formData, rationalResponse: e.target.value})}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center pt-10 border-t border-ink/5">
          <div className="flex gap-4">
            {isMobile && canGoPrev && (
              <button type="button" onClick={handlePrev} className="editorial-meta hover:text-ink transition-colors flex items-center gap-2">
                 ← {language === 'es' ? 'Atrás' : 'Back'}
              </button>
            )}
            <button type="button" onClick={onCancel} className="editorial-meta hover:text-ink transition-colors">{t('common.cancel')}</button>
          </div>
          
          <div className="flex gap-4">
            {isMobile && canGoNext && (
              <EditorialButton type="button" onClick={handleNext}>
                {language === 'es' ? 'Siguiente' : 'Next'} →
              </EditorialButton>
            )}
            {(!isMobile || !canGoNext) && (
              <EditorialButton type="submit" icon={<Check size={14} />}>
                {initialData ? (language === 'es' ? 'Actualizar Resumen' : 'Update Summary') : (language === 'es' ? 'Sellar Observación' : 'Seal Observation')}
              </EditorialButton>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
