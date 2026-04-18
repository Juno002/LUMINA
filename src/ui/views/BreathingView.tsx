/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../shared/lib/utils';

type ExerciseType = 'box' | '478' | 'calm';

interface Exercise {
  id: ExerciseType;
  name: string;
  description: string;
  phases: { name: string; duration: number }[];
}

const EXERCISES: Record<ExerciseType, Exercise> = {
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
  }
};

export default function BreathingView() {
  const [activeExercise, setActiveExercise] = useState<Exercise>(EXERCISES.box);
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
        <h2 className="font-serif text-3xl md:text-4xl italic">Breath as Architecture.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center min-h-[500px]">
        {/* Visual Cue Column */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-12 border border-ink/5 rounded-[4rem] bg-paper shadow-sm">
          <div className="relative flex items-center justify-center w-full aspect-square max-w-[300px]">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-2 border-ink/5 rounded-full" />
            
            {/* Pulsing Circle */}
            <motion.div
              animate={{
                scale: currentPhase.name === 'Inhale' ? 1.5 : (currentPhase.name === 'Exhale' ? 1 : (phaseIndex === 1 && activeExercise.id === 'box' ? 1.5 : (phaseIndex === 1 && activeExercise.id === '478' ? 1.5 : 1))),
                opacity: isRunning ? 1 : 0.2
              }}
              transition={{
                duration: currentPhase.duration,
                ease: "linear"
              }}
              className="w-32 h-32 bg-ink rounded-full shadow-[0_0_60px_rgba(0,0,0,0.1)]"
            />

            {/* Micro-timer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute flex flex-col items-center gap-1"
              >
                <span className="font-mono text-3xl font-light text-paper mix-blend-difference">{timeLeft}</span>
                <span className="editorial-meta text-[8px] text-paper mix-blend-difference uppercase tracking-widest">{currentPhase.name}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
             {!isRunning ? (
               <button 
                onClick={handleStart}
                className="bg-ink text-paper px-12 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-all"
               >
                 <Play size={14} fill="currentColor" /> Initiate Cycle
               </button>
             ) : (
               <button 
                onClick={handleStop}
                className="border border-ink text-ink px-12 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-ink hover:text-paper transition-all"
               >
                 <Square size={14} fill="currentColor" /> Cease Cycle
               </button>
             )}
             
             <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="editorial-meta opacity-40 hover:opacity-100 flex items-center gap-2"
             >
                {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {isAudioEnabled ? 'Audio Active' : 'Audio Muted'}
             </button>
          </div>
        </div>

        {/* Selection Column */}
        <div className="md:col-span-5 flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h3 className="editorial-meta opacity-50">Select Protocol</h3>
            <div className="flex flex-col gap-3">
               {Object.values(EXERCISES).map((ex) => (
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
             <div className="editorial-meta text-[9px]">Cycle Breakdown</div>
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
            <span className="editorial-meta uppercase tracking-widest">Protocol Philosophy</span>
         </div>
         <p className="text-xl font-serif italic text-accent leading-relaxed">
            "By consciously altering the rhythm of your respiration, you communicate directly with the autonomic nervous system—transitioning from reactive fight-or-flight to deliberate restorative presence."
         </p>
      </div>
    </div>
  );
}
