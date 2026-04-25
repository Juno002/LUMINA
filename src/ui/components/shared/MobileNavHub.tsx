/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon, Shield } from 'lucide-react';
import { cn } from '../../../shared/utils/TailwindMerge';
import { useTranslation } from '../../../application/contexts/LanguageContext';
import type { AppTab, NavItemConfig } from '../../navigation/menuItems';

interface MobileNavHubProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItemConfig[];
  activeTab: AppTab;
  onNavigate: (id: AppTab) => void;
}

export default function MobileNavHub({ isOpen, onClose, items, activeTab, onNavigate }: MobileNavHubProps) {
  const { t, language } = useTranslation();

  const getSubLabel = (id: string) => {
    const labels: Record<string, Record<string, string>> = {
      en: {
        dashboard: 'Daily overview',
        journal: 'Log thoughts',
        habits: 'Track discipline',
        mood: 'Emotional flux',
        exposure: 'ERP sessions',
        activation: 'Behavioral tasks',
        breathing: 'Rhythm & calm',
        goals: 'Long-term aim',
        sleep: 'Night patterns',
        analysis: 'View progress'
      },
      es: {
        dashboard: 'Resumen diario',
        journal: 'Registrar pensamientos',
        habits: 'Rastrear disciplina',
        mood: 'Flujo emocional',
        exposure: 'Sesiones ERP',
        activation: 'Tareas conductuales',
        breathing: 'Ritmo y calma',
        goals: 'Objetivos a largo plazo',
        sleep: 'Patrones nocturnos',
        analysis: 'Ver progreso'
      }
    };
    return labels[language]?.[id] || '';
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="editorial-modal-shell fixed inset-0 z-[100] flex items-end justify-center bg-ink/20 md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-modal-surface flex w-full max-w-2xl flex-col overflow-hidden border border-ink/10 bg-paper shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-8 md:px-10 md:py-10">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-ink font-serif text-sm">λ</div>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em]">{t('nav.vault_hub')}</span>
              </div>
              <button 
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/5 transition-all hover:bg-ink hover:text-paper"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Grid */}
            <div className="min-h-0 flex-grow overflow-y-auto px-8 pb-8 md:px-10">
              <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={cn(
                      "group flex flex-col items-start gap-4 rounded-[2rem] border p-6 text-left transition-all duration-300",
                      activeTab === item.id 
                        ? "border-ink bg-ink text-paper" 
                        : "bg-paper border-ink/5 hover:border-ink/20"
                    )}
                  >
                      <item.icon 
                        size={20} 
                        className={cn(
                        "transition-transform duration-300 group-active:scale-90",
                          activeTab === item.id ? "text-paper" : "text-accent"
                        )} 
                      />
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[8px] uppercase tracking-widest leading-none">
                          {t(item.label)}
                        </span>
                        <span className={cn(
                          "text-[10px] font-serif italic opacity-40 leading-none",
                          activeTab === item.id && "text-paper/60"
                        )}>
                          {getSubLabel(item.id)}
                        </span>
                      </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="lumina-safe-bottom flex flex-col gap-4 border-t border-ink/5 bg-paper/60 p-8">
               <button 
                  onClick={() => {
                    onNavigate('settings');
                    onClose();
                  }}
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-ink/10 py-5 transition-all hover:bg-ink hover:text-paper"
               >
                  <SettingsIcon size={14} className="text-accent transition-colors group-hover:text-paper" />
                  <span className="font-mono text-[9px] uppercase tracking-widest">{t('nav.settings')}</span>
               </button>
               
               <div className="mt-2 flex items-center justify-center gap-2 opacity-20">
                  <Shield size={10} />
                  <span className="font-mono text-[8px] uppercase tracking-tighter">
                    {language === 'es' ? 'Entorno Clínico Cifrado' : 'Encrypted Clinical Environment'}
                  </span>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
