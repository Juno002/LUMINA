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
import { useTranslation } from '../../application/contexts/LanguageContext';
import { Language } from '../../shared/i18n/translations';

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

const LANGUAGES = [
  { id: 'en', name: 'English (US)' },
  { id: 'es', name: 'Español (ES)' }
] as const;

export default function SettingsView({ vault, onUpdate, onWipe, onLock, onOpenCrisis }: SettingsViewProps) {
  const { t, language, setLanguage } = useTranslation();
  const hardwareId = useMemo(() => {
    let id = localStorage.getItem('lumina_hwid');
    if (!id) {
      id = crypto.randomUUID().split('-')[0].toUpperCase();
      localStorage.setItem('lumina_hwid', id);
    }
    return id;
  }, []);

  const handleWipe = async () => {
    if (confirm(t('settings.wipe_vault_desc'))) {
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
        <h2 className="font-serif text-4xl">{t('settings.title')}.</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 pb-10 border-b border-ink/5">
            <div className="flex items-center gap-4">
              <Shield size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">{t('settings.security_protocol')}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <h4 className="font-serif text-xl italic">{t('settings.data_sovereignty')}</h4>
                <p className="text-sm text-accent leading-relaxed italic">
                  {t('settings.data_sovereignty_desc')}
                </p>
                <div className="mt-4 p-4 bg-ink/[0.02] border border-ink/5 rounded-2xl flex items-center gap-4">
                  <Key size={16} className="text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold">{t('settings.passphrase_management')}</span>
                    <button className="text-left text-xs text-accent hover:text-ink transition-colors underline underline-offset-4 mt-1">
                      {t('settings.change_passphrase')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h4 className="font-serif text-xl italic">{t('settings.session_control')}</h4>
                  <div className="flex flex-wrap gap-3">
                    <EditorialButton
                      onClick={onLock}
                      variant="ink"
                      icon={<Lock size={12} />}
                    >
                      {t('settings.lock_vault')}
                    </EditorialButton>
                    <EditorialButton
                      onClick={onOpenCrisis}
                      variant="outline"
                      icon={<ShieldAlert size={12} />}
                    >
                      {t('settings.crisis_plan')}
                    </EditorialButton>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Clock size={14} />
                    <span className="text-[10px] uppercase tracking-wider font-bold">{t('settings.auto_lock')}</span>
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
              <div className="editorial-meta uppercase tracking-widest">{t('settings.data_stewardship')}</div>
            </div>
            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <h4 className="font-serif text-xl italic">{t('settings.therapeutic_portability')}</h4>
                  <p className="text-xs text-accent italic leading-relaxed">
                    {t('settings.therapeutic_portability_desc')}
                  </p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleExportMD}
                    className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                  >
                     <FileText size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                     <div className="flex flex-col">
                        <span className="font-serif italic text-sm">{t('settings.clinical_report')}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">Markdown (.md)</span>
                     </div>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                  >
                     <Table size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                     <div className="flex flex-col">
                        <span className="font-serif italic text-sm">{t('settings.raw_database')}</span>
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
              <div className="editorial-meta uppercase tracking-widest">{t('settings.aesthetic_feedback')}</div>
            </div>
            <div className="flex flex-col gap-4">
               {/* Audio Feedback Toggle */}
               <button 
                  onClick={() => onUpdate({ ...vault, profile: { ...vault.profile, soundEnabled: !vault.profile.soundEnabled } })}
                  className="flex justify-between items-center py-4 px-6 border border-ink/5 rounded-2xl hover:bg-ink/[0.02] transition-all"
               >
                  <div className="flex flex-col items-start">
                    <span className="font-serif italic">{t('settings.sensorial_audio')}</span>
                    <span className="text-[9px] editorial-meta opacity-50 mt-1">{t('settings.sensorial_audio_desc')}</span>
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

               {/* Language Switcher */}
               <div className="flex flex-col gap-4 mt-6">
                 <div className="editorial-meta opacity-40">{t('settings.linguistic_architecture')}</div>
                 <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => (
                      <button 
                        key={lang.id}
                        onClick={() => setLanguage(lang.id as Language)}
                        className={cn(
                          "flex justify-between items-center py-4 px-6 border rounded-2xl transition-all",
                          language === lang.id 
                            ? "bg-ink/[0.03] border-ink/20" 
                            : "border-ink/5 hover:bg-ink/[0.02]"
                        )}
                      >
                          <span className={cn("font-serif italic", language === lang.id ? "text-ink" : "text-accent")}>
                            {lang.name}
                          </span>
                          {language === lang.id && <Check size={14} className="text-ink" />}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 pt-10 border-t border-ink/5">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-500/50" />
              <div className="editorial-meta uppercase tracking-widest text-red-500/50">{t('settings.critical_termination')}</div>
            </div>
            <div className="p-10 border border-red-500/10 rounded-[3rem] bg-red-500/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="flex flex-col gap-2">
                 <h4 className="font-serif text-2xl italic text-red-500/80">{t('settings.wipe_vault')}</h4>
                 <p className="text-sm text-red-500/60 leading-relaxed italic max-w-xl">
                   {t('settings.wipe_vault_desc')}
                 </p>
               </div>
               <button 
                onClick={handleWipe}
                className="bg-red-500/10 text-red-500 px-10 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all shrink-0"
               >
                 {t('settings.execute_wipe')}
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
