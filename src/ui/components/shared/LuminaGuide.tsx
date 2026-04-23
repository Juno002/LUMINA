/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BookOpen, CheckCircle2, Flame, Home, Pause, RotateCcw, Settings, Sparkles } from 'lucide-react';
import {
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
  forge: 2,
  architecture: 3,
  chronicle: 4,
  vault: 5
};

export default function LuminaGuide({
  onboarding,
  onAdvance,
  onPause,
  onSkip,
  onNavigate,
  onOpenForge
}: LuminaGuideProps) {
  const { language } = useTranslation();
  const state = normalizeOnboardingState(onboarding);
  const isOpen = state.status === 'active';

  const copy: Record<LuminaGuideStepId, GuideStepContent> = {
    sanctuary: {
      id: 'sanctuary',
      icon: Home,
      tab: 'dashboard',
      title: language === 'es' ? 'Tu Santuario responde al día.' : 'Your Sanctuary responds to the day.',
      body:
        language === 'es'
          ? 'Reflejo observa señales reales: intensidad, hábitos, sueño, cierre del día y resiliencia. No tienes que aprender todo ahora; solo nota qué te pide el espacio.'
          : 'Reflejo watches real signals: intensity, habits, sleep, day closure, and resilience. You do not need to learn everything now; just notice what the space asks from you.',
      actionLabel: language === 'es' ? 'Ver Santuario' : 'View Sanctuary'
    },
    forge: {
      id: 'forge',
      icon: Sparkles,
      title: language === 'es' ? 'La Forja convierte pensamiento en acción.' : 'The Forge turns thought into action.',
      body:
        language === 'es'
          ? 'Escribe una frase para crear una intención. Usa * para hábitos, Meta: para objetivos o > para abrir una reflexión en Crónica.'
          : 'Write a phrase to create an intention. Use * for habits, Meta: for goals, or > to open a Chronicle reflection.',
      actionLabel: language === 'es' ? 'Abrir Forja' : 'Open Forge'
    },
    architecture: {
      id: 'architecture',
      icon: Flame,
      tab: 'habits',
      title: language === 'es' ? 'Arquitectura se aprende tocando.' : 'Architecture is learned by touch.',
      body:
        language === 'es'
          ? 'Completar un hábito debe sentirse claro: microsonido, vibración, progreso y una recompensa tranquila cuando sostienes la racha.'
          : 'Completing a habit should feel clear: micro-sound, haptic touch, progress, and a quiet reward when you sustain the streak.',
      actionLabel: language === 'es' ? 'Ir a Hábitos' : 'Go to Habits'
    },
    chronicle: {
      id: 'chronicle',
      icon: BookOpen,
      tab: 'journal',
      title: language === 'es' ? 'Crónica no reemplaza terapia.' : 'Chronicle does not replace therapy.',
      body:
        language === 'es'
          ? 'L1 observa, L2 toma perspectiva, L3 reestructura con evidencia. LUMINA complementa terapia y mantiene tus datos en la bóveda local.'
          : 'L1 observes, L2 takes perspective, L3 restructures with evidence. LUMINA complements therapy and keeps your data in the local vault.',
      actionLabel: language === 'es' ? 'Abrir Crónica' : 'Open Chronicle'
    },
    vault: {
      id: 'vault',
      icon: Settings,
      tab: 'settings',
      title: language === 'es' ? 'La Bóveda es tu control.' : 'The Vault is your control.',
      body:
        language === 'es'
          ? 'Desde Configuración puedes bloquear, exportar, restaurar, cambiar sonido/tema y repetir esta guía cuando quieras.'
          : 'From Settings you can lock, export, restore, change sound/theme, and repeat this guide whenever you want.',
      actionLabel: language === 'es' ? 'Ir a Bóveda' : 'Go to Vault'
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
          className="fixed bottom-6 left-4 right-4 z-[65] mx-auto max-w-2xl rounded-[2rem] border border-ink/10 bg-paper/95 p-5 shadow-2xl shadow-ink/10 backdrop-blur-md md:bottom-8 md:p-6"
          role="dialog"
          aria-live="polite"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <StepIcon size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent">
                  Lumina Guide / {STEP_INDEX[step.id]} de 5
                </span>
                <div className="flex gap-1">
                  {Object.values(STEP_INDEX).map((index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-5 rounded-full ${index <= STEP_INDEX[step.id] ? 'bg-ink' : 'bg-ink/10'}`}
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
                {language === 'es' ? 'Pausar' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-accent transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {language === 'es' ? 'Saltar' : 'Skip'}
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
                {step.id === 'vault' ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
                {step.id === 'vault'
                  ? language === 'es' ? 'Completar' : 'Complete'
                  : language === 'es' ? 'Siguiente' : 'Next'}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
