/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: AnimationSpeeds.micro, ease: EasingCurves.editorial }}
          className="editorial-modal-shell fixed inset-0 z-[100] flex items-end justify-center bg-paper/80 backdrop-blur-md md:items-center"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.97, y: 48, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.985, y: 28, opacity: 0 }}
            transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
            className={cn(
              "editorial-modal-surface relative flex w-full flex-col overflow-hidden border border-ink/10 bg-paper shadow-2xl",
              widths[maxWidth],
              className
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <button 
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-10 text-accent hover:text-ink transition-colors md:right-8 md:top-8"
              aria-label={closeLabel}
            >
              <X size={20} />
            </button>

            {(title || subtitle) && (
              <div className="flex flex-col gap-2 px-6 pb-6 pt-8 pr-14 md:px-10 md:pb-8 md:pt-10">
                {subtitle && <div className="editorial-meta">{subtitle}</div>}
                {title && <h3 className="font-serif text-3xl italic">{title}</h3>}
              </div>
            )}

            <div className="relative min-h-0 overflow-y-auto px-6 pb-8 md:px-10 md:pb-10">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
