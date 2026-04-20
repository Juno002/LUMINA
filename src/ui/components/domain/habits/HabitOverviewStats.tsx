/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Flame, Trophy, Zap } from 'lucide-react';
import { useTranslation } from '../../../../application/contexts/LanguageContext';

interface HabitOverviewStatsProps {
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  xpInfo: {
    current: number;
    needed: number;
    progress: number;
  };
}

export default function HabitOverviewStats({
  currentLevel,
  currentStreak,
  longestStreak,
  xpInfo
}: HabitOverviewStatsProps) {
  const { t, language } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-3xl border border-ink/5 bg-ink/[0.01] p-8">
        <div className="flex items-start justify-between">
          <div className="editorial-meta">{t('habits.streak')}</div>
          <Flame size={16} className={currentStreak > 0 ? 'text-orange-400' : 'text-accent opacity-20'} />
        </div>
        <div className="font-serif text-5xl font-light">
          {currentStreak} <span className="editorial-meta text-sm italic">{t('habits.days')}</span>
        </div>
        <div className="editorial-meta text-accent">{t('habits.consecutive_discipline')}</div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-ink/5 bg-ink/[0.01] p-8">
        <div className="flex items-start justify-between">
          <div className="editorial-meta">{t('habits.experience_level')}</div>
          <Zap size={16} className="text-accent" />
        </div>
        <div className="font-serif text-5xl font-light">{currentLevel}</div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpInfo.progress * 100}%` }}
            className="h-full bg-ink"
          />
        </div>
        <div className="editorial-meta text-[9px] text-accent">
          {xpInfo.current} / {xpInfo.needed} XP {t('habits.for_level')} {currentLevel + 1}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-ink/5 bg-ink/[0.01] p-8">
        <div className="flex items-start justify-between">
          <div className="editorial-meta">
            {language === 'es' ? 'Record de Racha' : 'Record Streak'}
          </div>
          <Trophy size={16} className="text-accent opacity-20" />
        </div>
        <div className="font-serif text-5xl font-light">
          {longestStreak}{' '}
          <span className="editorial-meta text-sm italic">{language === 'es' ? 'dias' : 'days'}</span>
        </div>
        <div className="editorial-meta text-accent">
          {language === 'es' ? 'Mejor Marca Personal' : 'Personal Best'}
        </div>
      </div>
    </div>
  );
}
