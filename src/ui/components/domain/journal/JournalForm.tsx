/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../../../domain/constants/Theme';
import { ClinicalProfile, ThoughtEntry, Vault } from '../../../../domain/entities';
import { COGNITIVE_DISTORTIONS } from '../../../../domain/constants/Distortions';
import { calculateICC } from '../../../../domain/services/ICCCalculator';
import { useTranslation } from '../../../../application/contexts/LanguageContext';
import { detectDistortions } from '../../../../application/usecases/DetectDistortionsUseCase';
import { computeReflejoState } from '../../../../application/usecases/GetReflejoStateUseCase';
import { todayISO } from '../../../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../../../shared/utils/Haptics';
import LambdaAvatar from '../../shared/LambdaAvatar';
import { EditorialButton, EditorialInput, EditorialTextArea } from '../../shared';

interface JournalFormProps {
  clinicalProfile?: ClinicalProfile;
  initialData?: Partial<ThoughtEntry>;
  onCancel: () => void;
  onSave: (entry: ThoughtEntry) => void;
  vault?: Vault;
}

export default function JournalForm({
  clinicalProfile,
  initialData,
  onCancel,
  onSave,
  vault
}: JournalFormProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<1 | 2 | 3>(initialData?.level || 1);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ThoughtEntry>>(
    initialData || {
      date: todayISO(),
      intensity: 5,
      level: 1,
      distortions: [],
      tags: []
    }
  );

  const reflejoState = useMemo(() => (vault ? computeReflejoState(vault) : null), [vault]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!formData.automaticThought) {
        return;
      }

      const detected = detectDistortions(formData.automaticThought, clinicalProfile);
      setFormData((current) => ({ ...current, distortions: detected.map((distortion) => distortion.id) }));
    }, 600);

    return () => clearTimeout(timer);
  }, [clinicalProfile, formData.automaticThought]);

  const iccResult = useMemo(() => {
    if (level === 3 && formData.originalIntensity !== undefined && formData.finalCredibility !== undefined) {
      return calculateICC(formData.originalIntensity, formData.finalCredibility);
    }

    return null;
  }, [formData.finalCredibility, formData.originalIntensity, level]);

  const totalSteps = level === 1 ? 2 : level === 2 ? 3 : 4;
  const canGoNext = currentStep < totalSteps;
  const canGoPrev = currentStep > 1;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...(formData as ThoughtEntry),
      id: formData.id || crypto.randomUUID(),
      level,
      tags: formData.tags || [],
      distortions: formData.distortions || [],
      rationalResponse: formData.rationalResponse || '',
      outcomeMood: formData.outcomeMood || formData.primaryEmotion || '',
      outcomeIntensity: formData.outcomeIntensity || formData.intensity || 5
    });
  };

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }
    triggerHaptic('light');
    setCurrentStep((step) => step + 1);
  };

  const handlePrev = () => {
    if (!canGoPrev) {
      return;
    }
    triggerHaptic('light');
    setCurrentStep((step) => step - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
      className="rounded-[2rem] border border-ink/10 bg-paper p-8 shadow-2xl shadow-ink/5 md:p-12"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="editorial-meta text-[9px] uppercase tracking-widest opacity-40">
              {t('journal.framework')} / {t('journal.level_word')} {level}
            </div>
            <div className="font-serif text-lg italic">
              {level === 1 && t('journal.level_1_title')}
              {level === 2 && t('journal.level_2_title')}
              {level === 3 && t('journal.level_3_title')}
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((candidateLevel) => (
              <button
                key={candidateLevel}
                type="button"
                onClick={() => setLevel(candidateLevel as 1 | 2 | 3)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  level >= candidateLevel ? 'bg-ink' : 'bg-ink/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-r-2xl border-l-2 border-accent bg-ink/[0.02] p-6">
          <p className="font-serif text-xs italic leading-relaxed text-accent opacity-70">
            {t(`journal.prompts.${clinicalProfile || 'general'}`)}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {(!isMobile || currentStep === 1) && (
            <motion.div
              key="step1"
              initial={isMobile ? { opacity: 0, x: 20 } : {}}
              animate={isMobile ? { opacity: 1, x: 0 } : {}}
              exit={isMobile ? { opacity: 0, x: -20 } : {}}
              className="grid grid-cols-1 gap-10 md:grid-cols-2"
            >
              <EditorialTextArea
                label={t('journal.situation')}
                required
                placeholder={
                  t('journal.situation_placeholder')
                }
                value={formData.situation || ''}
                onChange={(event) => setFormData({ ...formData, situation: event.target.value })}
              />
              <div className="flex flex-col gap-3">
                <EditorialTextArea
                  label={t('journal.thought')}
                  required
                  placeholder={t('journal.thought_placeholder')}
                  value={formData.automaticThought || ''}
                  onChange={(event) => setFormData({ ...formData, automaticThought: event.target.value })}
                />

                <AnimatePresence>
                  {formData.distortions && formData.distortions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 flex flex-wrap gap-2"
                    >
                      {formData.distortions.map((distortionId) => {
                        const distortion = COGNITIVE_DISTORTIONS.find((candidate) => candidate.id === distortionId);
                        if (!distortion) {
                          return null;
                        }

                        return (
                          <span
                            key={distortionId}
                            className="flex items-center gap-2 rounded-full border border-ink/5 bg-ink/5 px-3 py-1 font-mono text-[9px] uppercase tracking-tighter text-accent"
                          >
                            {distortion.name}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((current) => ({
                                  ...current,
                                  distortions: current.distortions?.filter((candidate) => candidate !== distortionId)
                                }))
                              }
                            >
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {level === 1 && formData.distortions && formData.distortions.length > 0 && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    type="button"
                    onClick={() => {
                      setLevel(2);
                      triggerHaptic('light');
                    }}
                    className="mt-4 flex items-center gap-2 text-left font-serif text-sm italic text-accent transition-colors hover:text-ink"
                  >
                    <Sparkles size={14} />
                    {t('journal.go_deeper_cta')}
                    <span className="underline underline-offset-4">{t('journal.level_2_cta')}</span>
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
              className="grid grid-cols-1 gap-10 md:grid-cols-3"
            >
              <EditorialInput
                label={t('journal.core_emotion')}
                required
                placeholder={t('journal.core_emotion_placeholder')}
                value={formData.primaryEmotion || ''}
                onChange={(event) => setFormData({ ...formData, primaryEmotion: event.target.value })}
              />
              <div className="flex flex-col gap-3">
                <label className="editorial-meta">
                  {t('journal.level')} ({formData.intensity}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  className="h-10 accent-ink"
                  value={formData.intensity}
                  onChange={(event) =>
                    setFormData({ ...formData, intensity: Number.parseInt(event.target.value, 10) })
                  }
                />
              </div>
              <EditorialInput
                label={t('journal.observation_date')}
                type="date"
                variant="mono"
                value={formData.date}
                onChange={(event) => setFormData({ ...formData, date: event.target.value })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {level >= 2 && (!isMobile || currentStep === 3) && (
            <motion.div
              initial={isMobile ? { opacity: 0, x: 20 } : { height: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { height: 'auto', opacity: 1 }}
              exit={isMobile ? { opacity: 0, x: -20 } : { height: 0, opacity: 0 }}
              className="flex flex-col gap-10 overflow-hidden"
            >
              {!isMobile && <div className="h-px w-full bg-ink/5" />}
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-4">
                    <span className="editorial-meta text-[8px] uppercase tracking-widest opacity-40">
                      {t('journal.friend_prompt')}
                    </span>
                    <div className="flex max-w-xl flex-col gap-6">
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-l border-ink/10 pl-4 font-serif text-2xl italic leading-tight text-accent/60 md:text-3xl"
                      >
                        « {formData.automaticThought || '...'} »
                      </motion.p>

                      {reflejoState && (
                        <div className="flex justify-center py-2">
                          <div className="scale-75 opacity-50">
                            <LambdaAvatar state={reflejoState} onLongPress={() => {}} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-col md:items-end">
                    <div className="w-full md:max-w-xl">
                      <EditorialTextArea
                        label={t('journal.compassionate_response')}
                        placeholder={t('journal.compassionate_response_placeholder')}
                        value={formData.friendResponse || ''}
                        onChange={(event) => setFormData({ ...formData, friendResponse: event.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {level === 2 && formData.friendResponse && formData.friendResponse.length > 15 && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    type="button"
                    onClick={() => {
                      setLevel(3);
                      triggerHaptic('light');
                    }}
                    className="flex items-center gap-2 text-left font-serif text-sm italic text-accent transition-colors hover:text-ink"
                  >
                    <ArrowRight size={14} />
                    {t('journal.evidence_cta')}
                    <span className="underline underline-offset-4">{t('journal.level_3_cta')}</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {level === 3 && (!isMobile || currentStep === 4) && (
            <motion.div
              initial={isMobile ? { opacity: 0, x: 20 } : { height: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { height: 'auto', opacity: 1 }}
              exit={isMobile ? { opacity: 0, x: -20 } : { height: 0, opacity: 0 }}
              className="flex flex-col gap-10 overflow-hidden"
            >
              {!isMobile && <div className="h-px w-full bg-ink/5" />}
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <EditorialTextArea
                  label={t('journal.evidence_for')}
                  placeholder={t('journal.evidence_for_placeholder')}
                  value={formData.evidenceFor || ''}
                  onChange={(event) => setFormData({ ...formData, evidenceFor: event.target.value })}
                />
                <EditorialTextArea
                  label={t('journal.evidence_against')}
                  placeholder={t('journal.evidence_against_placeholder')}
                  value={formData.evidenceAgainst || ''}
                  onChange={(event) => setFormData({ ...formData, evidenceAgainst: event.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-2">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="editorial-meta">
                      {t('journal.initial_belief')} ({formData.originalIntensity || 0}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="h-10 accent-ink"
                      value={formData.originalIntensity || 5}
                      onChange={(event) =>
                        setFormData({ ...formData, originalIntensity: Number.parseInt(event.target.value, 10) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="editorial-meta">
                      {t('journal.final_credibility')} ({formData.finalCredibility || 0}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="h-10 accent-ink"
                      value={formData.finalCredibility || 5}
                      onChange={(event) =>
                        setFormData({ ...formData, finalCredibility: Number.parseInt(event.target.value, 10) })
                      }
                    />
                  </div>
                </div>

                {iccResult && (
                  <div className="flex items-center gap-6 rounded-2xl border border-ink/10 bg-ink/[0.01] p-6">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-2 font-mono text-xl font-bold ${
                        iccResult.label === 'excellent'
                          ? 'border-emerald-500/20 text-emerald-500'
                          : iccResult.label === 'moderate'
                            ? 'border-amber-500/20 text-amber-500'
                            : 'border-red-400/20 text-red-400'
                      }`}
                    >
                      {iccResult.value.toFixed(2)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="editorial-meta text-[8px] uppercase tracking-widest">
                        {t('journal.cognitive_change_index')}
                      </div>
                      <div className="font-serif text-sm italic leading-tight text-accent">
                        {iccResult.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <EditorialTextArea
                label={t('journal.alternative')}
                className="h-32"
                placeholder={
                  t('journal.alternative_placeholder')
                }
                value={formData.rationalResponse || ''}
                onChange={(event) => setFormData({ ...formData, rationalResponse: event.target.value })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-ink/5 pt-10">
          <div className="flex gap-4">
            {isMobile && canGoPrev && (
              <button
                type="button"
                onClick={handlePrev}
                className="editorial-meta flex items-center gap-2 transition-colors hover:text-ink"
              >
                ← {t('common.back')}
              </button>
            )}
            <button type="button" onClick={onCancel} className="editorial-meta transition-colors hover:text-ink">
              {t('common.cancel')}
            </button>
          </div>

          <div className="flex gap-4">
            {isMobile && canGoNext && (
              <EditorialButton type="button" onClick={handleNext}>
                {t('common.next')} →
              </EditorialButton>
            )}
            {(!isMobile || !canGoNext) && (
              <EditorialButton type="submit" icon={<Check size={14} />}>
                {initialData
                  ? t('journal.update_summary')
                  : t('journal.seal_observation')}
              </EditorialButton>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
