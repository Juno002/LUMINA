/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from "motion/react";
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Flame, Moon as MoonIcon, Star, CheckCircle2 } from "lucide-react";
import { cn } from '../../shared/utils/TailwindMerge';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';
import { useTranslation } from '../../application/contexts/LanguageContext';

import { Vault, ActivationActivity, Goal } from '../../domain/entities';
import LambdaAvatar from '../components/shared/LambdaAvatar';
import { computeReflejoState } from '../../application/usecases/GetReflejoStateUseCase';
import { 
  EditorialButton, 
  EditorialModal, 
  EditorialTextArea 
} from '../components/shared';

interface DashboardViewProps {
  vault: Vault;
  onUpdate: (v: Vault) => void;
  onOpenCrisis?: () => void;
  onOpenDayClosure?: () => void;
}

/**
 * DashboardView Component:
 * Central hub of Lumina. Features the Lambda Avatar and daily momentum tracking.
 */
export default function DashboardView({ vault, onUpdate, onOpenCrisis, onOpenDayClosure }: DashboardViewProps) {
  const { t } = useTranslation();
  const momentum = (vault.activations?.filter((a: ActivationActivity) => a.completed && a.plannedDate === todayISO()).length || 0) * 20;
  const pendingActions = vault.activations?.filter((a: ActivationActivity) => !a.completed).length || 0;
  
  const reflejoState = useMemo(() => computeReflejoState(vault), [vault]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.morning');
    if (hour < 18) return t('dashboard.midday');
    return t('dashboard.evening');
  };

  const context = getGreeting();

  const [isAddingGrace, setIsAddingGrace] = useState(false);
  const [graceText, setGraceText] = useState('');

  const handleAddGrace = () => {
    if (!graceText.trim()) return;
    triggerHaptic('success');
    const g = vault.wellness?.gratitudeEntries || [];
    const updatedVault = {
      ...vault,
      wellness: {
        ...vault.wellness,
        gratitudeEntries: [{ id: crypto.randomUUID(), text: graceText, date: todayISO() }, ...g]
      }
    };
    onUpdate(updatedVault);
    setGraceText('');
    setIsAddingGrace(false);
  };

  const isDayClosed = vault.closedDays?.some(d => d.date === todayISO());

  return (
    <div className="editorial-grid pb-20 max-md:flex max-md:flex-col">
      {/* Right Column (Moved to Top on Mobile) */}
      <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-10 md:order-2">
        <div className="flex flex-col gap-10 sticky top-[6vh] max-md:relative max-md:top-0">
          {/* Lambda Avatar Card */}
          <div className="p-8 md:p-12 border border-ink/10 rounded-[3rem] md:rounded-[4rem] bg-paper shadow-xl shadow-ink/[0.02] flex flex-col items-center">
            <LambdaAvatar 
              state={reflejoState} 
              onLongPress={() => onOpenCrisis?.()} 
            />
          </div>

          {/* Strategic Progress (Now visible on mobile but optimized) */}
          <div className="flex flex-col gap-8 px-4">
            <div className="editorial-meta opacity-40">{t('dashboard.strategic_progress')}</div>
            <div className="flex flex-col gap-4">
              {(vault.goals || []).slice(0, 3).map((goal: Goal) => (
                <div key={goal.id} className="flex items-center gap-5 py-4 border-b border-ink/5 group">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500", 
                    goal.completed ? "bg-ink" : "border border-ink/20 group-hover:border-ink/40"
                  )}></div>
                  <div className="flex flex-col">
                    <span className={cn("font-serif text-lg italic leading-none", goal.completed && "opacity-20 line-through")}>{goal.title}</span>
                    <span className="text-[8px] font-mono opacity-30 uppercase mt-1 tracking-widest">{goal.progress}% {t('dashboard.strategic_progress').includes('Progreso') ? 'completado' : 'complete'}</span>
                  </div>
                </div>
              ))}
              {(vault.goals || []).length === 0 && (
                 <p className="editorial-meta italic opacity-20 text-xs">{t('dashboard.no_goals')}</p>
              )}
            </div>
          </div>

          {/* Closure Ritual Button */}
          <button 
            disabled={isDayClosed}
            onClick={() => onOpenDayClosure?.()}
            className={cn(
              "w-full p-8 rounded-[3rem] transition-all duration-500 flex flex-col gap-4 items-center text-center group",
              isDayClosed 
                ? "bg-ink/5 cursor-default" 
                : "bg-ink text-paper hover:scale-[1.02] shadow-2xl shadow-ink/10"
            )}
          >
             {isDayClosed ? (
               <>
                 <CheckCircle2 size={32} className="text-ink/20" />
                 <div className="flex flex-col">
                    <span className="editorial-meta opacity-30 text-[9px] uppercase tracking-widest">{t('dashboard.ritual_complete')}</span>
                    <span className="font-serif italic text-accent/40 text-sm">{t('dashboard.day_secured')}</span>
                 </div>
               </>
             ) : (
               <>
                 <MoonIcon size={32} className="group-hover:rotate-12 transition-transform duration-700" />
                 <div className="flex flex-col">
                    <span className="editorial-meta opacity-50 text-[9px] uppercase tracking-widest">{t('dashboard.closure_ritual')}</span>
                    <span className="font-serif italic text-paper/80 text-sm">{t('dashboard.begin_synthesis')}</span>
                 </div>
               </>
             )}
          </button>
        </div>
      </div>

      {/* Left Column: Context & Momentum (Order 1 on Desktop) */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-12 md:gap-16 md:order-1">
        <div className="flex flex-col gap-4">
          <div className="editorial-meta">{context.label}</div>
          <p className="text-xl md:text-3xl leading-tight font-serif italic max-w-2xl">
            "{context.quote}"
          </p>
          <p className="editorial-meta text-[9px] opacity-40 italic uppercase tracking-widest">{context.suggestion}</p>
        </div>

        {/* Mobile-Only Quick Stats Pulse */}
        <div className="flex md:hidden gap-4 overflow-x-auto pb-4 no-scrollbar">
           {[
             { label: 'XP', value: vault.profile.experience || 0, icon: Flame },
             { label: t('nav.nightfall'), value: (vault.sleep?.[0]?.quality || '-') + '/5', icon: MoonIcon },
             { label: t('nav.architecture'), value: (vault.habits?.filter(h => h.completedDates.includes(todayISO())).length || 0), icon: Star }
           ].map((stat, i) => (
             <div key={i} className="flex-shrink-0 flex flex-col gap-2 p-6 rounded-3xl border border-ink/5 bg-paper shadow-sm min-w-[140px]">
                <div className="flex justify-between items-center opacity-40">
                  <stat.icon size={12} />
                  <span className="editorial-meta text-[8px] uppercase tracking-tighter">{stat.label}</span>
                </div>
                <span className="font-serif text-2xl italic">{stat.value}</span>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="flex flex-col gap-6 p-10 border border-ink/5 rounded-[3rem] bg-paper shadow-sm">
            <span className="editorial-meta opacity-50 uppercase text-[9px] tracking-[0.2em]">{t('dashboard.resilience_index')}</span>
            <div className="flex items-baseline gap-3">
               <h3 className="font-serif text-5xl">68</h3>
               <span className="editorial-meta opacity-30 lowercase tracking-normal italic text-sm">stable</span>
            </div>
            <div className="h-[2px] w-full bg-ink/5 rounded-full overflow-hidden mt-4">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "68%" }} 
                transition={{ duration: 1.5, ease: EasingCurves.editorial }}
                className="h-full bg-ink/60"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-6 p-10 border border-ink/5 rounded-[3rem] bg-ink text-paper shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
            <span className="editorial-meta opacity-40 uppercase text-[9px] tracking-[0.2em]">{t('dashboard.active_scope')}</span>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-light tracking-tighter leading-none">{pendingActions.toString().padStart(2, '0')}</span>
              <span className="editorial-meta opacity-40 italic text-sm">{t('dashboard.intentions')}</span>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <p className="text-[10px] opacity-30 italic uppercase tracking-widest font-mono">{t('dashboard.daily_momentum')}</p>
              <div className="flex items-center gap-2">
                 <Flame size={14} className="text-amber-400" />
                 <span className="font-mono text-xs">{momentum}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10 pt-16 border-t border-ink/5">
          <div className="flex justify-between items-center">
            <div className="editorial-meta opacity-40">{t('dashboard.gratitude_logs')}</div>
            <button onClick={() => setIsAddingGrace(true)} className="text-[9px] uppercase tracking-widest font-mono text-accent hover:text-ink transition-colors">{t('dashboard.new_entry')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {(vault.wellness?.gratitudeEntries || []).slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex flex-col gap-4 group">
                <div className="h-[1px] w-8 bg-ink/10 group-hover:w-16 transition-all duration-500"></div>
                <p className="text-sm italic leading-relaxed text-accent font-serif group-hover:text-ink transition-colors">"{entry.text}"</p>
              </div>
            ))}
            {(vault.wellness?.gratitudeEntries || []).length === 0 && (
              <p className="editorial-meta italic opacity-20 text-xs">{t('dashboard.no_entries')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal for adding grace */}
      <EditorialModal 
        isOpen={isAddingGrace} 
        onClose={() => setIsAddingGrace(false)}
        title="Register Grace"
      >
        <div className="flex flex-col gap-8">
          <EditorialTextArea
            label="What are you grateful for in this absolute present?"
            value={graceText}
            onChange={(e) => setGraceText(e.target.value)}
            placeholder="A moment of silence, the coffee's warmth..."
          />
          <EditorialButton onClick={handleAddGrace}>Save to Vault</EditorialButton>
        </div>
      </EditorialModal>
    </div>
  );
}
