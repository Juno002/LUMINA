/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReflejoState } from '../../../domain/services/ReflejoEngine';
import { AnimationSpeeds, EasingCurves } from '../../../domain/constants/Theme';
import { cn } from '../../../shared/utils/TailwindMerge';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface LambdaAvatarProps {
  state: ReflejoState;
  onLongPress: () => void;
}

/**
 * LambdaAvatar Component:
 * The visual heart of Lumina. A minimalist indicator that reflects the user's data state.
 * Supports Anchor, Observer, and Mentor modes with subtle animations.
 */
const LambdaAvatar: React.FC<LambdaAvatarProps> = ({ state, onLongPress }) => {
  const { t } = useTranslation();
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStart = () => {
    setIsPressing(true);
    pressTimer.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
    }, 800); // 800ms for safety/emergency feel
  };

  const handleEnd = () => {
    setIsPressing(false);
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const getAnimationProps = () => {
    switch (state.animation) {
      case 'float':
        return {
          animate: { y: [0, -6, 0] },
          transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        };
      case 'pulse-slow':
        return {
          animate: { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] },
          transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
        };
      case 'neutral':
      default:
        return {
          animate: { opacity: [0.6, 1, 0.6] },
          transition: { repeat: Infinity, duration: 5, ease: "easeInOut" }
        };
    }
  };

  const getGlowColor = () => {
    switch (state.mode) {
      case 'anchor': return 'shadow-[0_0_40px_rgba(239,68,68,0.2)]';
      case 'mentor': return 'shadow-[0_0_40px_rgba(245,158,11,0.2)]';
      case 'observer': return 'shadow-[0_0_40px_rgba(148,163,184,0.15)]';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div 
        className="relative cursor-pointer"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >
        {/* Animated Background Ring */}
        <motion.div 
          {...getAnimationProps()}
          className={cn(
            "w-24 h-24 rounded-full border border-ink/5 flex items-center justify-center transition-colors duration-1000",
            state.mode === 'anchor' && "bg-red-500/5 border-red-500/20",
            state.mode === 'mentor' && "bg-amber-500/5 border-amber-500/20",
            state.mode === 'observer' && "bg-slate-400/5 border-slate-400/20",
            getGlowColor()
          )}
        >
          {/* Progress Ring (Long Press Indicator) */}
          <AnimatePresence>
            {isPressing && (
              <motion.svg 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full h-full -rotate-90"
              >
                <motion.circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-ink/10"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "linear" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Central Symbol */}
          <span className={cn(
            "font-serif text-3xl font-light transition-colors duration-1000",
            state.color
          )}>
            λ
          </span>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-4 max-w-[200px] text-center">
         <motion.p 
           key={state.messageKey}
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-xs font-serif italic opacity-60 leading-relaxed"
         >
           "{t(state.messageKey)}"
         </motion.p>

         <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {(['anchor', 'observer', 'mentor'] as const).map(m => (
                <div 
                  key={m} 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-700",
                    state.mode === m ? "bg-ink scale-110" : "bg-ink/10"
                  )} 
                />
              ))}
            </div>
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] opacity-30">
              {t(`lambda.mode_${state.mode}`)}
            </span>
         </div>
      </div>
    </div>
  );
};

export default LambdaAvatar;
