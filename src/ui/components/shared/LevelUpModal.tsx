/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimationSpeeds } from '../../../domain/constants/Theme';
import { sensoryFeedback } from '../../../infrastructure/services/SensoryFeedbackService';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    sensoryFeedback.levelUp();

    // Auto-close after celebration
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [level, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: AnimationSpeeds.fluid }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/90 backdrop-blur-md cursor-pointer"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.1, opacity: 0, y: -20 }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 200, 
          duration: AnimationSpeeds.fluid 
        }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <motion.div 
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 0.5, letterSpacing: '0.4em' }}
          transition={{ duration: AnimationSpeeds.fluid }}
          className="font-mono text-[10px] uppercase text-paper tracking-[0.4em] mb-4"
        >
          {t('level_up.eyebrow')}
        </motion.div>

        <div className="relative">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.1 }}
            transition={{ duration: AnimationSpeeds.fluid }}
            className="absolute inset-0 bg-paper rounded-full blur-3xl"
          />
          <h1 className="font-serif text-[12rem] leading-none text-paper font-light select-none relative z-10">
            {level}
          </h1>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <div className="font-serif text-2xl text-paper italic">{t('level_up.title')}</div>
          <p className="font-serif text-sm text-paper/40 max-w-[240px]">
            {t('level_up.body')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: AnimationSpeeds.fluid }}
          className="mt-10 font-mono text-[9px] uppercase text-paper/30 tracking-widest"
        >
          {t('level_up.continue')}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
