/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../../domain/constants/Theme';
import { cn } from '../../../shared/utils/TailwindMerge';

interface EditorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  closeLabel?: string;
}

export const EditorialModal: React.FC<EditorialModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  className,
  closeLabel = 'Close'
}) => {
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-paper/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
            className={cn(
              "bg-paper border border-ink/10 p-10 rounded-[3rem] shadow-2xl w-full relative",
              widths[maxWidth],
              className
            )}
          >
            <button 
              type="button"
              onClick={onClose}
              className="absolute top-8 right-8 text-accent hover:text-ink transition-colors"
              aria-label={closeLabel}
            >
              <X size={20} />
            </button>

            {(title || subtitle) && (
              <div className="flex flex-col gap-2 mb-10 pr-10">
                {subtitle && <div className="editorial-meta">{subtitle}</div>}
                {title && <h3 className="font-serif text-3xl italic">{title}</h3>}
              </div>
            )}

            <div className="relative">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
