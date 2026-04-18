/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { AnimationSpeeds, EasingCurves } from '../../domain/constants/Theme';
import { Flame } from "lucide-react";
import { cn } from '../../shared/utils/TailwindMerge';
import { todayISO } from '../../shared/utils/DateFormatter';
import { triggerHaptic } from '../../shared/utils/Haptics';

import { Vault, ActivationActivity, Goal } from '../../domain/entities';

interface DashboardViewProps {
  vault: Vault;
  onUpdate: (v: Vault) => void;
}

/**
 * DashboardView Contract:
 * Dynamic summary of the user's current state and pending actions.
 */
export default function DashboardView({ vault, onUpdate }: DashboardViewProps) {
  const momentum = (vault.activations?.filter((a: ActivationActivity) => a.completed && a.plannedDate === todayISO()).length || 0) * 20;
  const pendingActions = vault.activations?.filter((a: ActivationActivity) => !a.completed).length || 0;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { label: "Morning / Awakening", quote: "The dawn is a tabula rasa. What will you scribe?", suggestion: "Perhaps a moment of coherence in Breathing?" };
    if (hour < 18) return { label: "Mid-Day / Zenith", quote: "Presence is the only absolute. Observe without judgment.", suggestion: "Review your Active Intentions." };
    return { label: "Evening / Restoration", quote: "The day concludes. The vault remains. Rest is ritual.", suggestion: "Register your sleep architecture." };
  };

  const context = getGreeting();

  const handleAddGrace = () => {
    triggerHaptic('light');
    const text = prompt("A moment of grace today?");
    if (text) {
      triggerHaptic('success');
      const g = vault.wellness?.gratitudeEntries || [];
      const updatedVault = {
        ...vault,
        wellness: {
          ...vault.wellness,
          gratitudeEntries: [{ id: crypto.randomUUID(), text, date: todayISO() }, ...g]
        }
      };
      onUpdate(updatedVault);
    }
  };

  return (
    <div className="editorial-grid">
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col gap-4">
          <div className="editorial-meta">{context.label}</div>
          <p className="text-xl md:text-2xl leading-relaxed text-justify-italic max-w-2xl font-serif">
            "{context.quote}"
          </p>
          <p className="editorial-meta text-[9px] opacity-40 italic">{context.suggestion}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="flex flex-col gap-4 p-8 border border-ink/5 rounded-[2rem] hover:border-ink/20 transition-all bg-paper shadow-sm">
            <span className="editorial-meta">Resilience Index</span>
            <div className="flex items-baseline gap-3">
               <h3 className="font-serif text-4xl">68</h3>
               <span className="editorial-meta opacity-40 lowercase tracking-normal">stable</span>
            </div>
            <div className="h-[1px] w-full bg-ink/5 overflow-hidden mt-2">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "68%" }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
                className="h-full bg-ink/40"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4 p-8 border border-ink/5 rounded-[2rem] hover:border-ink/20 transition-all bg-ink text-paper shadow-xl">
            <span className="editorial-meta opacity-50">Active Scope</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-light tracking-tighter leading-none">{pendingActions.toString().padStart(2, '0')}</span>
              <span className="editorial-meta opacity-50">Intentions</span>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-[10px] opacity-40 italic uppercase tracking-widest font-mono">Momentum</p>
              <div className="flex items-center gap-2">
                 <Flame size={14} className="text-accent" />
                 <span className="font-mono text-xs">{momentum}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10 pt-10 border-t border-ink/5">
          <div className="flex justify-between items-center">
            <div className="editorial-meta">Gratitude / Moment</div>
            <button onClick={handleAddGrace} className="text-[9px] uppercase tracking-widest font-mono text-accent hover:text-ink">+ New Grace</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(vault.wellness?.gratitudeEntries || []).slice(0, 3).map((entry: { id: string; text: string; date: string }) => (
              <div key={entry.id} className="flex flex-col gap-2 transition-all hover:-translate-y-1">
                <div className="h-[1px] w-10 bg-ink/20"></div>
                <p className="text-sm italic leading-relaxed text-accent">{entry.text}</p>
              </div>
            ))}
            {(vault.wellness?.gratitudeEntries || []).length === 0 && (
              <p className="editorial-meta italic opacity-30">No grace logs yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
        <div className="flex flex-col gap-10 sticky top-[8vh]">
          <div className="flex flex-col gap-6">
            <div className="editorial-meta">Strategic Progress</div>
            <div className="flex flex-col gap-4">
              {(vault.goals || []).slice(0, 3).map((goal: Goal) => (
                <div key={goal.id} className="flex items-center gap-4 py-3 border-b border-ink/5">
                  <div className={cn("w-2 h-2 rounded-full", goal.completed ? "bg-ink" : "border border-ink/20")}></div>
                  <span className={cn("font-serif italic", goal.completed && "opacity-30 line-through")}>{goal.title}</span>
                </div>
              ))}
              {(vault.goals || []).length === 0 && (
                 <p className="editorial-meta italic opacity-30">No objectives set.</p>
              )}
            </div>
          </div>

          <div className="p-8 bg-paper border border-ink/10 rounded-3xl flex flex-col gap-4">
             <div className="editorial-meta">Pro-active Check</div>
             <p className="text-xs italic leading-relaxed opacity-70">"You have {pendingActions} pending intentions today. Small wins drive major habituation."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
