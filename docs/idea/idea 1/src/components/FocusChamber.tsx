import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { useUIStore } from '../store/useUIStore';
import { CheckCircle2, X } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface FocusChamberProps {
  task: Task | undefined;
  onComplete: (taskId: string) => void;
}

export function FocusChamber({ task, onComplete }: FocusChamberProps) {
  const { focusState, setFocusState } = useUIStore();
  const [showTimer, setShowTimer] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (focusState === 'focused') {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [focusState]);

  const handleMouseMove = () => {
    if (focusState !== 'focused') return;
    setShowTimer(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowTimer(false);
    }, 3000);
  };

  const handleComplete = () => {
    if (!task) return;
    feedback.celebrate();
    onComplete(task.id);
    setFocusState('exiting');
  };

  const handleAbort = () => {
    feedback.error();
    setFocusState('exiting');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!task && focusState === 'focused') {
    // Failsafe
    setTimeout(() => setFocusState('idle'), 0);
    return null;
  }

  return (
    <AnimatePresence>
      {(focusState === 'entering' || focusState === 'focused' || focusState === 'exiting') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.3 } }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#0C0C0C] text-[#ede0d0] flex flex-col items-center justify-center overflow-hidden"
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseMove}
        >
          {/* Breathing Background / GPU Heavy lifting */}
          {focusState === 'focused' && (
            <motion.div
              className="absolute inset-0 bg-[#c9935a]"
              initial={{ scale: 1, opacity: 0.05 }}
              animate={{ scale: 1.1, opacity: 0 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ filter: 'blur(100px)' }}
            />
          )}

          {/* On-Demand Timer */}
          <AnimatePresence>
            {showTimer && focusState === 'focused' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 0.2, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-12 font-mono text-2xl tracking-[0.2em]"
              >
                {formatTime(elapsed)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Master Task Obelisk */}
          {task && (
            <motion.div
              layoutId={task.id}
              className="relative z-10 w-full max-w-md p-8 flex flex-col items-center text-center"
            >
              <h2 className="text-3xl font-sans font-bold tracking-tight mb-12">
                {task.title}
              </h2>

              {/* Interaction Ring */}
              <div className="flex items-center gap-12 mt-12">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onPanEnd={handleAbort}
                  className="flex flex-col items-center gap-3 text-[#5c4a3a] hover:text-[#ede0d0] transition-colors group"
                >
                  <div className="h-16 w-16 rounded-full border border-[#3a2e24] flex items-center justify-center group-hover:border-[#ede0d0] transition-colors">
                    <X className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] tracking-[0.2em] font-bold uppercase opacity-50">Abortar</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  className="flex flex-col items-center gap-3 text-[#c9935a] hover:text-[#e8c9a0] transition-colors group"
                >
                  <div className="h-24 w-24 rounded-full bg-[#3a2e24] flex items-center justify-center group-hover:bg-[#c9935a] transition-all duration-500 shadow-[0_0_40px_rgba(201,147,90,0.1)] group-hover:shadow-[0_0_60px_rgba(201,147,90,0.3)]">
                    <CheckCircle2 className="h-10 w-10 text-[#0C0C0C]" />
                  </div>
                  <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Completar</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
