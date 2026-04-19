/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon, Shield } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../../domain/constants/Theme';
import { cn } from '../../../shared/utils/TailwindMerge';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
}

interface MobileNavHubProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  activeTab: string;
  onNavigate: (id: any) => void;
}

export default function MobileNavHub({ isOpen, onClose, items, activeTab, onNavigate }: MobileNavHubProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-paper/90 backdrop-blur-xl flex flex-col md:hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border border-ink flex items-center justify-center font-serif text-sm">λ</div>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">The Vault</span>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-ink/5 flex items-center justify-center hover:bg-ink hover:text-paper transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Grid */}
          <div className="flex-grow overflow-y-auto px-8 pb-20">
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={cn(
                    "flex flex-col items-start gap-4 p-6 rounded-[2rem] border transition-all duration-500 text-left group",
                    activeTab === item.id 
                      ? "bg-ink text-paper border-ink" 
                      : "bg-paper border-ink/5 hover:border-ink/20"
                  )}
                >
                  <item.icon 
                    size={20} 
                    className={cn(
                      "transition-transform duration-500 group-active:scale-90",
                      activeTab === item.id ? "text-paper" : "text-accent"
                    )} 
                  />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-ink/5 bg-paper/50 flex flex-col gap-4">
             <button 
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full py-5 rounded-full border border-ink/10 flex items-center justify-center gap-3 hover:bg-ink hover:text-paper transition-all group"
             >
                <SettingsIcon size={14} className="text-accent group-hover:text-paper transition-colors" />
                <span className="font-mono text-[9px] uppercase tracking-widest">Global Settings</span>
             </button>
             
             <div className="flex justify-center items-center gap-2 opacity-20 mt-2">
                <Shield size={10} />
                <span className="font-mono text-[8px] uppercase tracking-tighter">Encrypted Clinical Environment</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
