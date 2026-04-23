/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Heart, BookOpen, ShieldAlert, Flame } from 'lucide-react';
import { triggerHaptic } from '../../../shared/utils/Haptics';
import { cn } from '../../../shared/utils/TailwindMerge';
import { useTranslation } from '../../../application/contexts/LanguageContext';

interface QuickActionFABProps {
  onAction: (action: 'journal' | 'mood' | 'habits' | 'crisis') => void;
}

export default function QuickActionFAB({ onAction }: QuickActionFABProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    triggerHaptic(isOpen ? 'light' : 'medium');
    setIsOpen(!isOpen);
  };

  const handleAction = (action: 'journal' | 'mood' | 'habits' | 'crisis') => {
    triggerHaptic('success');
    onAction(action);
    setIsOpen(false);
  };

  const actions = [
    { id: 'journal', icon: BookOpen, label: t('nav.chronicle'), color: 'bg-paper text-ink' },
    { id: 'mood', icon: Heart, label: t('nav.emotional_flux'), color: 'bg-paper text-ink' },
    { id: 'habits', icon: Flame, label: t('nav.architecture'), color: 'bg-paper text-ink' },
    { id: 'crisis', icon: ShieldAlert, label: 'SOS', color: 'bg-red-500 text-white' },
  ] as const;

  return (
    <div className="fixed bottom-24 right-6 z-[60] md:hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[-1]"
            />
            
            {/* Menu Items */}
            <div className="flex flex-col gap-4 mb-6 items-end">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 20, stiffness: 300 }}
                  onClick={() => handleAction(action.id)}
                  className="flex items-center gap-4 group"
                >
                  <span className="editorial-meta bg-paper px-3 py-1 rounded-full shadow-lg text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border border-ink/5",
                    action.color
                  )}>
                    <action.icon size={18} />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger */}
      <motion.button
        onClick={toggleMenu}
        animate={{ rotate: isOpen ? 135 : 0 }}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300",
          isOpen ? "bg-paper text-ink border border-ink/10" : "bg-ink text-paper"
        )}
      >
        <Plus size={28} />
      </motion.button>
    </div>
  );
}
