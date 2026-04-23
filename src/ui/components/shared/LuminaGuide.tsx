/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Heart,
  Home,
  Moon,
  Pause,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Target,
  Wind
} from 'lucide-react';
import {
  LUMINA_GUIDE_STEPS,
  LuminaGuideStepId,
  normalizeOnboardingState
} from '../../../application/usecases/LuminaGuideUseCase';
import { OnboardingState } from '../../../domain/entities';
import { AppTab } from '../../navigation/menuItems';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface LuminaGuideProps {
  onboarding?: OnboardingState;
  onAdvance: () => void;
  onPause: () => void;
  onSkip: () => void;
  onNavigate: (tab: AppTab) => void;
  onOpenForge: () => void;
}

interface GuideStepContent {
  id: LuminaGuideStepId;
  icon: typeof Home;
  tab?: AppTab;
  title: string;
  body: string;
  actionLabel: string;
}

const STEP_INDEX: Record<LuminaGuideStepId, number> = {
  sanctuary: 1,
  chronicle: 2,
  architecture: 3,
  emotionalFlux: 4,
  facing: 5,
  momentum: 6,
  breathe: 7,
  fortress: 8,
  nightfall: 9,
  resilience: 10,
  vault: 11,
  forge: 12
};

export default function LuminaGuide({
  onboarding,
  onAdvance,
  onPause,
  onSkip,
  onNavigate,
  onOpenForge
}: LuminaGuideProps) {
  const { t } = useTranslation();
  const state = normalizeOnboardingState(onboarding);
  const isOpen = state.status === 'active';
  const currentIndex = STEP_INDEX[state.currentStep as LuminaGuideStepId] || 1;
  const totalSteps = LUMINA_GUIDE_STEPS.length;

  const copy: Record<LuminaGuideStepId, GuideStepContent> = {
    sanctuary: {
      id: 'sanctuary',
      icon: Home,
      tab: 'dashboard',
      title: t('guide.steps.sanctuary.title'),
      body: t('guide.steps.sanctuary.body'),
      actionLabel: t('guide.steps.sanctuary.action')
    },
    chronicle: {
      id: 'chronicle',
      icon: BookOpen,
      tab: 'journal',
      title: t('guide.steps.chronicle.title'),
      body: t('guide.steps.chronicle.body'),
      actionLabel: t('guide.steps.chronicle.action')
    },
    architecture: {
      id: 'architecture',
      icon: Flame,
      tab: 'habits',
      title: t('guide.steps.architecture.title'),
      body: t('guide.steps.architecture.body'),
      actionLabel: t('guide.steps.architecture.action')
    },
    emotionalFlux: {
      id: 'emotionalFlux',
      icon: Heart,
      tab: 'mood',
      title: t('guide.steps.emotionalFlux.title'),
      body: t('guide.steps.emotionalFlux.body'),
      actionLabel: t('guide.steps.emotionalFlux.action')
    },
    facing: {
      id: 'facing',
      icon: Activity,
      tab: 'exposure',
      title: t('guide.steps.facing.title'),
      body: t('guide.steps.facing.body'),
      actionLabel: t('guide.steps.facing.action')
    },
    momentum: {
      id: 'momentum',
      icon: Target,
      tab: 'activation',
      title: t('guide.steps.momentum.title'),
      body: t('guide.steps.momentum.body'),
      actionLabel: t('guide.steps.momentum.action')
    },
    breathe: {
      id: 'breathe',
      icon: Wind,
      tab: 'breathing',
      title: t('guide.steps.breathe.title'),
      body: t('guide.steps.breathe.body'),
      actionLabel: t('guide.steps.breathe.action')
    },
    fortress: {
      id: 'fortress',
      icon: Shield,
      tab: 'goals',
      title: t('guide.steps.fortress.title'),
      body: t('guide.steps.fortress.body'),
      actionLabel: t('guide.steps.fortress.action')
    },
    nightfall: {
      id: 'nightfall',
      icon: Moon,
      tab: 'sleep',
      title: t('guide.steps.nightfall.title'),
      body: t('guide.steps.nightfall.body'),
      actionLabel: t('guide.steps.nightfall.action')
    },
    resilience: {
      id: 'resilience',
      icon: BarChart3,
      tab: 'analysis',
      title: t('guide.steps.resilience.title'),
      body: t('guide.steps.resilience.body'),
      actionLabel: t('guide.steps.resilience.action')
    },
    vault: {
      id: 'vault',
      icon: Settings,
      tab: 'settings',
      title: t('guide.steps.vault.title'),
      body: t('guide.steps.vault.body'),
      actionLabel: t('guide.steps.vault.action')
    },
    forge: {
      id: 'forge',
      icon: Sparkles,
      title: t('guide.steps.forge.title'),
      body: t('guide.steps.forge.body'),
      actionLabel: t('guide.steps.forge.action')
    }
  };

  const step = copy[state.currentStep as LuminaGuideStepId] || copy.sanctuary;
  const StepIcon = step.icon;

  const handlePrimaryAction = () => {
    if (step.id === 'forge') {
      onOpenForge();
      return;
    }

    if (step.tab) {
      onNavigate(step.tab);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-4 right-4 z-[65] mx-auto max-w-2xl rounded-[2rem] border border-ink/10 bg-paper/95 p-5 shadow-2xl shadow-ink/10 backdrop-blur-md md:bottom-8 md:p-6"
          role="dialog"
          aria-label={t('guide.label')}
          aria-live="polite"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <StepIcon size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent">
                  {t('guide.label')} / {currentIndex} {t('guide.of')} {totalSteps}
                </span>
                <div className="flex gap-1">
                  {LUMINA_GUIDE_STEPS.map((guideStep) => (
                    <span
                      key={guideStep}
                      className={`h-1.5 w-4 rounded-full ${state.completedSteps.includes(guideStep) ? 'bg-ink' : guideStep === step.id ? 'bg-accent' : 'bg-ink/10'}`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="font-serif text-2xl italic leading-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-accent">{step.body}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPause}
                className="flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-accent transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Pause size={12} />
                {t('guide.pause')}
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-accent transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {t('guide.skip')}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest transition-all hover:border-ink/30 active:scale-95"
              >
                <RotateCcw size={12} />
                {step.actionLabel}
              </button>
              <button
                type="button"
                onClick={onAdvance}
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-paper transition-all active:scale-95"
              >
                <CheckCircle2 size={12} />
                {t('guide.got_it')}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
