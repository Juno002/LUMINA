import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  type LucideIcon,
  Sparkles,
  Target,
  Repeat,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { cn } from '../utils';

type Step = {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const STEPS: Step[] = [
  {
    id: 0,
    title: 'Bienvenido a Iterum',
    description:
      'Iterum es tu compañero para cerrar ciclos diarios de forma consciente y construir una vida con propósito. Todo vive en tu dispositivo y puedes empezar de inmediato.',
    icon: Sparkles,
    color: 'text-accent',
  },
  {
    id: 1,
    title: 'Hábitos con Intención',
    description:
      'No solo taches tareas. Registra tus hábitos, añade reflexiones y mira cómo tus rachas crecen día a día.',
    icon: Repeat,
    color: 'text-accent-secondary',
  },
  {
    id: 2,
    title: 'Objetivos Claros',
    description:
      'Vincula tus hábitos diarios a metas a largo plazo. Cada pequeña acción te acerca a tu gran objetivo.',
    icon: Target,
    color: 'text-green-500',
  },
  {
    id: 3,
    title: 'Gamificación Real',
    description:
      'Gana EXP por tu disciplina y consistencia. Desbloquea nuevas funciones a medida que subes de nivel.',
    icon: Trophy,
    color: 'text-yellow-500',
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="bg-bg-primary/90 fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md dark:bg-[--dark-bg-primary]/90">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-bg-secondary border-border-subtle w-full max-w-lg overflow-hidden rounded-[32px] border shadow-2xl dark:border-[--dark-border-subtle] dark:bg-[--dark-bg-secondary]"
      >
        <div className="p-10">
          <div className="mb-12 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    idx === currentStep
                      ? 'bg-accent w-8'
                      : 'bg-border-subtle w-2 dark:bg-[--dark-border-subtle]',
                  )}
                />
              ))}
            </div>
            <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div
                className={cn(
                  'bg-bg-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] shadow-inner dark:bg-[--dark-bg-primary]',
                  step.color,
                )}
              >
                <Icon className="h-10 w-10" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">{step.title}</h2>
              <p className="text-text-muted mb-12 leading-relaxed dark:text-[--dark-text-muted]">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all',
                currentStep === 0
                  ? 'pointer-events-none opacity-0'
                  : 'text-text-muted hover:text-text-primary dark:hover:text-[--dark-text-primary]',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>

            <button
              onClick={handleNext}
              className="bg-accent text-bg-primary shadow-accent/20 flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              {currentStep === STEPS.length - 1 ? 'Empezar ahora' : 'Siguiente'}
              {currentStep === STEPS.length - 1 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {currentStep === 3 && (
          <div className="bg-accent/5 border-border-subtle border-t p-6 text-center dark:border-[--dark-border-subtle]">
            <p className="text-accent flex items-center justify-center gap-2 text-xs font-medium">
              <Zap className="h-3 w-3" />
              ITERUM funciona 100% local y offline por diseño.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
