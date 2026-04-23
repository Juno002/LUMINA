/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Wind, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../shared/utils/TailwindMerge';
import { 
  EditorialButton 
} from '../components/shared';
import { useTranslation } from '../../application/contexts/LanguageContext';

type ExerciseType = 'box' | '478' | 'anchor' | 'calm';

interface Exercise {
  id: ExerciseType;
  name: string;
  description: string;
  phases: { name: string; duration: number }[];
}

const EXERCISES: Record<string, Record<ExerciseType, Exercise>> = {
  en: {
    box: {
      id: 'box',
      name: 'Square Breathing',
      description: 'A tactical technique used to regain focus and calm the nervous system.',
      phases: [
        { name: 'Inhale', duration: 4 },
        { name: 'Hold', duration: 4 },
        { name: 'Exhale', duration: 4 },
        { name: 'Hold', duration: 4 },
      ]
    },
    '478': {
      id: '478',
      name: '4-7-8 Technique',
      description: 'A natural tranquilizer for the nervous system, helping with sleep and anxiety.',
      phases: [
        { name: 'Inhale', duration: 4 },
        { name: 'Hold', duration: 7 },
        { name: 'Exhale', duration: 8 },
      ]
    },
    calm: {
      id: 'calm',
      name: 'Equal Breathing',
      description: 'Simple balance for heart rate variability and coherence.',
      phases: [
        { name: 'Inhale', duration: 6 },
        { name: 'Exhale', duration: 6 },
      ]
    },
    anchor: {
      id: 'anchor',
      name: 'The Anchor',
      description: 'Immediate grounding for high-intensity states. Focus on the long exhale.',
      phases: [
        { name: 'Inhale', duration: 2 },
        { name: 'Exhale', duration: 5 },
        { name: 'Pause', duration: 3 },
      ]
    }
  },
  es: {
    box: {
      id: 'box',
      name: 'Respiración Cuadrada',
      description: 'Una técnica táctica utilizada para recuperar el enfoque y calmar el sistema nervioso.',
      phases: [
        { name: 'Inhala', duration: 4 },
        { name: 'Retén', duration: 4 },
        { name: 'Exhala', duration: 4 },
        { name: 'Retén', duration: 4 },
      ]
    },
    '478': {
      id: '478',
      name: 'Técnica 4-7-8',
      description: 'Un tranquilizante natural para el sistema nervioso, ayudando con el sueño y la ansiedad.',
      phases: [
        { name: 'Inhala', duration: 4 },
        { name: 'Retén', duration: 7 },
        { name: 'Exhala', duration: 8 },
      ]
    },
    calm: {
      id: 'calm',
      name: 'Respiración Equitativa',
      description: 'Equilibrio simple para la variabilidad del ritmo cardíaco y la coherencia.',
      phases: [
        { name: 'Inhala', duration: 6 },
        { name: 'Exhala', duration: 6 },
      ]
    },
    anchor: {
      id: 'anchor',
      name: 'El Ancla',
      description: 'Arraigo inmediato para estados de alta intensidad. Enfoque en la exhalación larga.',
      phases: [
        { name: 'Inhala', duration: 2 },
        { name: 'Exhala', duration: 5 },
        { name: 'Pausa', duration: 3 },
      ]
    }
  }
};

export default function BreathingView() {
  const { language } = useTranslation();
  const currentExercises = EXERCISES[language] || EXERCISES.en;
  const [activeExercise, setActiveExercise] = useState<Exercise>(currentExercises.box);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(activeExercise.phases[0].duration);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Next phase
            const nextIndex = (phaseIndex + 1) % activeExercise.phases.length;
            setPhaseIndex(nextIndex);
            return activeExercise.phases[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phaseIndex, activeExercise]);

  const handleStart = () => {
    setIsRunning(true);
    setPhaseIndex(0);
    setTimeLeft(activeExercise.phases[0].duration);
  };

  const handleStop = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setTimeLeft(activeExercise.phases[0].duration);
  };

  const handleExerciseChange = (ex: Exercise) => {
    setActiveExercise(ex);
    setIsRunning(false);
    setPhaseIndex(0);
    setTimeLeft(ex.phases[0].duration);
  };

  const currentPhase = activeExercise.phases[phaseIndex];

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <div className="editorial-meta">Rhythm / Coherence</div>
        <h2 className="font-serif text-3xl md:text-4xl italic">{language === 'es' ? 'La Respiración como Arquitectura.' : 'Breath as Architecture.'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center min-h-[500px]">
        {/* Visual Cue Column */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-12 border border-ink/5 rounded-[4rem] bg-paper shadow-sm">
          <div className="relative flex items-center justify-center w-full aspect-square max-w-[300px]">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-2 border-ink/5 rounded-full" />
            
             <motion.div
              animate={{
                scale: currentPhase.name.toLowerCase().includes('inhale') || currentPhase.name.toLowerCase().includes('inhala') ? 1.5 : (currentPhase.name.toLowerCase().includes('exhale') || currentPhase.name.toLowerCase().includes('exhala') ? 1 : (phaseIndex === 1 && activeExercise.id === 'box' ? 1.5 : (phaseIndex === 1 && activeExercise.id === '478' ? 1.5 : 1))),
                opacity: isRunning ? 1 : 0.2
              }}
              transition={{
                duration: currentPhase.duration,
                ease: "linear"
              }}
              className={cn(
                "w-32 h-32 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.1)] transition-colors duration-300",
                activeExercise.id === 'anchor' ? "bg-blue-900 shadow-blue-900/40" : "bg-ink"
              )}
            />

            {/* Micro-timer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                className="absolute flex flex-col items-center gap-1"
              >
                <span className="font-mono text-3xl font-light text-paper mix-blend-difference">{timeLeft}</span>
                <span className="editorial-meta text-[8px] text-paper mix-blend-difference uppercase tracking-widest">{currentPhase.name}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
             {!isRunning ? (
               <EditorialButton 
                onClick={handleStart}
                icon={<Play size={14} fill="currentColor" />}
               >
                 {language === 'es' ? 'Iniciar Ciclo' : 'Initiate Cycle'}
               </EditorialButton>
             ) : (
               <EditorialButton 
                onClick={handleStop}
                variant="outline"
                icon={<Square size={14} fill="currentColor" />}
               >
                 {language === 'es' ? 'Detener Ciclo' : 'Cease Cycle'}
               </EditorialButton>
             )}
             
             <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="editorial-meta opacity-40 hover:opacity-100 flex items-center gap-2"
             >
              {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {isAudioEnabled ? (language === 'es' ? 'Audio Activo' : 'Audio Active') : (language === 'es' ? 'Audio Silenciado' : 'Audio Muted')}
             </button>
          </div>
        </div>

        {/* Selection Column */}
        <div className="md:col-span-5 flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h3 className="editorial-meta opacity-50">{language === 'es' ? 'Seleccionar Protocolo' : 'Select Protocol'}</h3>
            <div className="flex flex-col gap-3">
               {Object.values(currentExercises).map((ex) => (
                 <button
                  key={ex.id}
                  onClick={() => handleExerciseChange(ex)}
                  className={cn(
                    "p-6 rounded-3xl border text-left transition-all",
                    activeExercise.id === ex.id ? "bg-ink text-paper border-ink" : "border-ink/10 hover:border-ink/30"
                  )}
                 >
                    <div className="font-serif text-xl italic mb-1">{ex.name}</div>
                    <p className={cn("text-xs leading-relaxed opacity-60", activeExercise.id === ex.id && "opacity-80")}>
                      {ex.description}
                    </p>
                 </button>
               ))}
            </div>
          </div>

          {/* Dynamic Phase Display */}
          <div className="p-8 bg-ink/[0.02] border border-ink/5 rounded-3xl flex flex-col gap-4">
             <div className="editorial-meta text-[9px]">{language === 'es' ? 'Desglose del Ciclo' : 'Cycle Breakdown'}</div>
             <div className="flex items-center gap-2">
                {activeExercise.phases.map((p, idx) => (
                  <React.Fragment key={idx}>
                    <div className={cn(
                      "flex flex-col items-center gap-1",
                      isRunning && phaseIndex === idx ? "opacity-100" : "opacity-30"
                    )}>
                       <span className="font-mono text-xs">{p.duration}s</span>
                       <span className="editorial-meta text-[8px]">{p.name}</span>
                    </div>
                    {idx < activeExercise.phases.length - 1 && <span className="opacity-10">/</span>}
                  </React.Fragment>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="editorial-rule"></div>
      
      <div className="flex flex-col gap-6 max-w-2xl">
         <div className="flex items-center gap-4">
            <Wind className="text-accent" size={20} />
            <span className="editorial-meta uppercase tracking-widest">{language === 'es' ? 'Filosofía del Protocolo' : 'Protocol Philosophy'}</span>
         </div>
         <p className="text-xl font-serif italic text-accent leading-relaxed">
            {language === 'es' 
              ? '"Al alterar conscientemente el ritmo de tu respiración, te comunicas directamente con el sistema nervioso autónomo, pasando de una lucha o huida reactiva a una presencia restauradora deliberada."'
              : '"By consciously altering the rhythm of your respiration, you communicate directly with the autonomic nervous system—transitioning from reactive fight-or-flight to deliberate restorative presence."'}
         </p>
      </div>
    </div>
  );
}
