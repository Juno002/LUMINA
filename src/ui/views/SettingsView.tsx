/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Shield, Trash2, Palette, Lock, ShieldAlert, Clock, Key, Download, FileText, Table, Check } from 'lucide-react';
import { Vault } from '../../domain/entities';
import { motion } from 'motion/react';
import { DataExportService } from '../../infrastructure/services/DataExportService';
import { 
  EditorialButton 
} from '../components/shared';
import { cn } from '../../shared/utils/TailwindMerge';

interface SettingsViewProps {
  vault: Vault;
  onUpdate: (newVault: Vault) => void;
  onWipe: () => void;
  onLock: () => void;
  onOpenCrisis: () => void;
}

const AUTO_LOCK_OPTIONS = [1, 3, 5, 10, 30];

const THEMES = [
  { id: 'default', name: 'Paper White' },
  { id: 'night', name: 'Editorial Night' },
  { id: 'ink-deep', name: 'Ink Deep' }
] as const;

export default function SettingsView({ vault, onUpdate, onWipe, onLock, onOpenCrisis }: SettingsViewProps) {
  const hardwareId = useMemo(() => {
    let id = localStorage.getItem('lumina_hwid');
    if (!id) {
      id = crypto.randomUUID().split('-')[0].toUpperCase();
      localStorage.setItem('lumina_hwid', id);
    }
    return id;
  }, []);

  const handleWipe = async () => {
    if (confirm("Are you certain? This will permanently erase your local vault and all recorded observations.")) {
      onWipe();
    }
  };

  const handleExportMD = () => {
    const report = DataExportService.exportMarkdownReport(vault);
    const date = new Date().toISOString().split('T')[0];
    DataExportService.downloadFile(report, `lumina-report-${date}.md`, 'text/markdown');
  };

  const handleExportCSV = () => {
    const data = DataExportService.exportCSV(vault);
    const date = new Date().toISOString().split('T')[0];
    DataExportService.downloadFile(data, `lumina-data-${date}.csv`, 'text/csv');
  };

  const currentAutoLock = vault.profile.autoLockMinutes ?? 5;
  const currentTheme = vault.profile.theme || 'default';

  const setAutoLock = (minutes: number) => {
    onUpdate({
      ...vault,
      profile: {
        ...vault.profile,
        autoLockMinutes: minutes
      }
    });
  };

  const setTheme = (theme: typeof THEMES[number]['id']) => {
    onUpdate({
      ...vault,
      profile: {
        ...vault.profile,
        theme
      }
    });
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-2">
        <div className="editorial-meta">Configurations / Sovereignty</div>
        <h2 className="font-serif text-4xl">System Control.</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 pb-10 border-b border-ink/5">
            <div className="flex items-center gap-4">
              <Shield size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">Security Protocol</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <h4 className="font-serif text-xl italic">Data Sovereignty</h4>
                <p className="text-sm text-accent leading-relaxed italic">
                  Your data is stored using browser-native IndexedDB via the Lumina Vault protocol. 
                  No metrics, observations, or identifiers ever leave your hardware environment.
                </p>
                <div className="mt-4 p-4 bg-ink/[0.02] border border-ink/5 rounded-2xl flex items-center gap-4">
                  <Key size={16} className="text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold">Passphrase Management</span>
                    <button className="text-left text-xs text-accent hover:text-ink transition-colors underline underline-offset-4 mt-1">
                      Change Security Passphrase (requires current)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h4 className="font-serif text-xl italic">Session Control</h4>
                  <div className="flex flex-wrap gap-3">
                    <EditorialButton
                      onClick={onLock}
                      variant="ink"
                      icon={<Lock size={12} />}
                    >
                      Lock Vault
                    </EditorialButton>
                    <EditorialButton
                      onClick={onOpenCrisis}
                      variant="outline"
                      icon={<ShieldAlert size={12} />}
                    >
                      Crisis Plan
                    </EditorialButton>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Clock size={14} />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Auto-lock Inactivity Timer</span>
                  </div>
                  <div className="flex gap-2">
                    {AUTO_LOCK_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setAutoLock(opt)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-mono transition-all duration-200 ${
                          currentAutoLock === opt 
                            ? 'bg-ink text-paper border-ink' 
                            : 'bg-paper border border-ink/10 text-accent hover:border-ink/30'
                        }`}
                      >
                        {opt}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Data Export Section */}
        <div className="lg:col-span-6">
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Download size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">Data Stewardship</div>
            </div>
            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <h4 className="font-serif text-xl italic">Therapeutic Portability</h4>
                  <p className="text-xs text-accent italic leading-relaxed">
                    Generate reports for review or extract your raw history. 
                    Your observations belong to you.
                  </p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleExportMD}
                    className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                  >
                     <FileText size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                     <div className="flex flex-col">
                        <span className="font-serif italic text-sm">Clinical Report</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">Markdown (.md)</span>
                     </div>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                  >
                     <Table size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                     <div className="flex flex-col">
                        <span className="font-serif italic text-sm">Raw Database</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">Spreadsheet (.csv)</span>
                     </div>
                  </button>
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-6">
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Palette size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">Aesthetic & Feedback</div>
            </div>
            <div className="flex flex-col gap-4">
               {/* Audio Feedback Toggle */}
               <button 
                  onClick={() => onUpdate({ ...vault, profile: { ...vault.profile, soundEnabled: !vault.profile.soundEnabled } })}
                  className="flex justify-between items-center py-4 px-6 border border-ink/5 rounded-2xl hover:bg-ink/[0.02] transition-all"
               >
                  <div className="flex flex-col items-start">
                    <span className="font-serif italic">Sensorial Audio</span>
                    <span className="text-[9px] editorial-meta opacity-50 mt-1">Crystal Synthesis Feedback</span>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full transition-all flex items-center px-1", vault.profile.soundEnabled ? 'bg-ink' : 'bg-ink/10')}>
                    <motion.div 
                      animate={{ x: vault.profile.soundEnabled ? 24 : 0 }}
                      className="w-4 h-4 bg-paper rounded-full" 
                    />
                  </div>
               </button>

               <div className="grid grid-cols-1 gap-3">
                  {THEMES.map((theme) => (
                    <button 
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={cn(
                        "flex justify-between items-center py-4 px-6 border rounded-2xl transition-all",
                        currentTheme === theme.id 
                          ? "bg-ink/[0.03] border-ink/20" 
                          : "border-ink/5 hover:bg-ink/[0.02]"
                      )}
                    >
                        <span className={cn("font-serif italic", currentTheme === theme.id ? "text-ink" : "text-accent")}>
                          {theme.name}
                        </span>
                        {currentTheme === theme.id && <Check size={14} className="text-ink" />}
                    </button>
                  ))}
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 pt-10 border-t border-ink/5">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-500/50" />
              <div className="editorial-meta uppercase tracking-widest text-red-500/50">Critical Termination</div>
            </div>
            <div className="p-10 border border-red-500/10 rounded-[3rem] bg-red-500/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="flex flex-col gap-2">
                 <h4 className="font-serif text-2xl italic text-red-500/80">Wipe Local Vault</h4>
                 <p className="text-sm text-red-500/60 leading-relaxed italic max-w-xl">
                   This action is irreversible. It will permanently delete 
                   all stored objects from the Lumina engine in this hardware environment.
                 </p>
               </div>
               <button 
                onClick={handleWipe}
                className="bg-red-500/10 text-red-500 px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all shrink-0"
               >
                 Execute Wipe Protocol
               </button>
            </div>
          </section>
        </div>
      </div>
      
      <footer className="pt-10 flex border-t border-ink/5 justify-between items-center opacity-30">
        <div className="editorial-meta">Hardware ID: {hardwareId}</div>
        <div className="editorial-meta">Lumina Core / 0.8.2-R</div>
      </footer>
    </div>
  );
}
