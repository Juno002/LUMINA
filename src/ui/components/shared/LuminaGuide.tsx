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
  const { language } = useTranslation();
  const state = normalizeOnboardingState(onboarding);
  const isOpen = state.status === 'active';
  const currentIndex = STEP_INDEX[state.currentStep as LuminaGuideStepId] || 1;
  const totalSteps = LUMINA_GUIDE_STEPS.length;

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
    chronicle: {
      id: 'chronicle',
      icon: BookOpen,
      tab: 'journal',
      title: language === 'es' ? 'Crónica te ayuda a pensar con evidencia.' : 'Chronicle helps you think with evidence.',
      body:
        language === 'es'
          ? 'L1 observa, L2 toma perspectiva y L3 reestructura. Es un complemento para terapia: útil, privado y sin prometer reemplazar acompañamiento clínico.'
          : 'L1 observes, L2 takes perspective, and L3 restructures. It complements therapy: useful, private, and never framed as a replacement for clinical support.',
      actionLabel: language === 'es' ? 'Abrir Crónica' : 'Open Chronicle'
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
    emotionalFlux: {
      id: 'emotionalFlux',
      icon: Heart,
      tab: 'mood',
      title: language === 'es' ? 'Flujo emocional registra el clima interno.' : 'Emotional Flux records the inner weather.',
      body:
        language === 'es'
          ? 'Marca intensidad, sensaciones, detonantes e impulsos. La idea es detectar patrones sin convertir cada emoción en una emergencia.'
          : 'Log intensity, sensations, triggers, and urges. The point is to detect patterns without turning every emotion into an emergency.',
      actionLabel: language === 'es' ? 'Ver Flujo' : 'View Flux'
    },
    facing: {
      id: 'facing',
      icon: Activity,
      tab: 'exposure',
      title: language === 'es' ? 'Exposición trabaja con aproximaciones graduales.' : 'Exposure works through gradual approach.',
      body:
        language === 'es'
          ? 'Construye jerarquías, registra SUDs y observa predicciones contra resultados. Es una bitácora de práctica, no una orden de empujarte de golpe.'
          : 'Build hierarchies, track SUDs, and compare predictions against outcomes. It is a practice log, not a command to force yourself all at once.',
      actionLabel: language === 'es' ? 'Ver Exposición' : 'View Exposure'
    },
    momentum: {
      id: 'momentum',
      icon: Target,
      tab: 'activation',
      title: language === 'es' ? 'Momentum convierte intención en movimiento.' : 'Momentum turns intention into motion.',
      body:
        language === 'es'
          ? 'Aquí viven las tareas pequeñas, planificadas para hoy. Completar una intención abre feedback real para comparar expectativa, esfuerzo y alegría.'
          : 'Small tasks planned for today live here. Completing an intention opens real feedback so you can compare expectation, effort, and joy.',
      actionLabel: language === 'es' ? 'Ver Momentum' : 'View Momentum'
    },
    breathe: {
      id: 'breathe',
      icon: Wind,
      tab: 'breathing',
      title: language === 'es' ? 'Respirar es el botón de aterrizaje.' : 'Breathing is the landing control.',
      body:
        language === 'es'
          ? 'Usa este espacio cuando el sistema esté cargado. El ritmo visual mantiene la guía simple para bajar intensidad sin añadir ruido.'
          : 'Use this space when the system feels loaded. The visual rhythm keeps guidance simple so intensity can drop without more noise.',
      actionLabel: language === 'es' ? 'Respirar' : 'Breathe'
    },
    fortress: {
      id: 'fortress',
      icon: Shield,
      tab: 'goals',
      title: language === 'es' ? 'Fortaleza guarda tus metas activas.' : 'Fortress holds your active goals.',
      body:
        language === 'es'
          ? 'Define objetivos claros, prioridad y progreso. Lumen puede crear una meta rápida con Meta: cuando una idea pide estructura.'
          : 'Define clear goals, priority, and progress. Lumen can create a quick goal with Goal: when an idea needs structure.',
      actionLabel: language === 'es' ? 'Ver Metas' : 'View Goals'
    },
    nightfall: {
      id: 'nightfall',
      icon: Moon,
      tab: 'sleep',
      title: language === 'es' ? 'Sueño cuida la arquitectura nocturna.' : 'Sleep protects the night architecture.',
      body:
        language === 'es'
          ? 'Registra duración, calidad y notas. LUMINA cruza descanso con resiliencia para leer el día con más contexto.'
          : 'Log duration, quality, and notes. LUMINA connects rest with resilience so the day is read with more context.',
      actionLabel: language === 'es' ? 'Ver Sueño' : 'View Sleep'
    },
    resilience: {
      id: 'resilience',
      icon: BarChart3,
      tab: 'analysis',
      title: language === 'es' ? 'Resiliencia revela patrones, no juicios.' : 'Resilience reveals patterns, not judgments.',
      body:
        language === 'es'
          ? 'Este panel resume intensidad, momentum y cambio cognitivo. Sirve para mirar tendencias, no para calificarte.'
          : 'This panel summarizes intensity, momentum, and cognitive change. It is for spotting trends, not grading yourself.',
      actionLabel: language === 'es' ? 'Ver Resiliencia' : 'View Resilience'
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
    },
    forge: {
      id: 'forge',
      icon: Sparkles,
      title: language === 'es' ? 'Lumen convierte pensamiento en acción.' : 'Lumen turns thought into action.',
      body:
        language === 'es'
          ? 'Escribe una frase para crear una intención. Usa * para hábitos, Meta: para objetivos o > para abrir una reflexión en Crónica.'
          : 'Write a phrase to create an intention. Use * for habits, Goal: for goals, or > to open a Chronicle reflection.',
      actionLabel: language === 'es' ? 'Abrir Lumen' : 'Open Lumen'
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
                  Lumina Guide / {currentIndex} {language === 'es' ? 'de' : 'of'} {totalSteps}
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
                <CheckCircle2 size={12} />
                {language === 'es' ? 'Entendido' : 'Got it'}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
