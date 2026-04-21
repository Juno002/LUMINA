/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { Shield, Trash2, Palette, Lock, ShieldAlert, Clock, Key, Download, FileText, Table, Check, Upload } from 'lucide-react';
import { Vault } from '../../domain/entities';
import { motion } from 'motion/react';
import { DataExportService } from '../../infrastructure/services/DataExportService';
import {
  ConfirmActionModal,
  EditorialButton,
  EditorialInput,
  EditorialModal
} from '../components/shared';
import { cn } from '../../shared/utils/TailwindMerge';
import { useTranslation } from '../../application/contexts/LanguageContext';
import { Language } from '../../shared/i18n/translations';
import { todayISO } from '../../shared/utils/DateFormatter';

interface SettingsViewProps {
  vault: Vault;
  onUpdate: (newVault: Vault) => void;
  onWipe: () => void;
  onLock: () => void;
  onChangePassphrase: (currentPassword: string, nextPassword: string) => Promise<boolean>;
  onExportBackup: () => Promise<{ ok: true; backup: string } | { ok: false; error: string }>;
  onImportBackup: (
    serializedBackup: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onOpenCrisis: () => void;
  isSaving: boolean;
  lastSaveError: string | null;
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

export default function SettingsView({
  vault,
  onUpdate,
  onWipe,
  onLock,
  onChangePassphrase,
  onExportBackup,
  onImportBackup,
  onOpenCrisis,
  isSaving,
  lastSaveError
}: SettingsViewProps) {
  const { t, language, setLanguage } = useTranslation();
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [passphraseForm, setPassphraseForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [backupImportPassphrase, setBackupImportPassphrase] = useState('');
  const [backupImportSource, setBackupImportSource] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [passphraseStatus, setPassphraseStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [backupStatus, setBackupStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [backupImportError, setBackupImportError] = useState<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const hardwareId = useMemo(() => {
    let id = localStorage.getItem('lumina_hwid');
    if (!id) {
      id = crypto.randomUUID().split('-')[0].toUpperCase();
      localStorage.setItem('lumina_hwid', id);
    }
    return id;
  }, []);

  const handleExportMD = () => {
    const report = DataExportService.exportMarkdownReport(vault);
    const date = todayISO();
    DataExportService.downloadFile(report, `lumina-report-${date}.md`, 'text/markdown');
  };

  const handleExportCSV = () => {
    const data = DataExportService.exportCSV(vault);
    const date = todayISO();
    DataExportService.downloadFile(data, `lumina-data-${date}.csv`, 'text/csv');
  };

  const handleExportBackup = async () => {
    const date = todayISO();
    const result = await onExportBackup();

    if ('error' in result) {
      setBackupStatus({ tone: 'error', message: result.error });
      return;
    }

    DataExportService.downloadFile(
      result.backup,
      `lumina-backup-${date}.json`,
      'application/json'
    );
    setBackupStatus({ tone: 'success', message: t('settings.backup_export_success') });
  };

  const handleBackupFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const content = await file.text();
    setBackupImportSource({ name: file.name, content });
    setBackupImportPassphrase('');
    setBackupImportError(null);
    setBackupStatus(null);
    setIsImportModalOpen(true);
  };

  const resetImportState = () => {
    setBackupImportPassphrase('');
    setBackupImportSource(null);
    setBackupImportError(null);
  };

  const handleImportBackup = async () => {
    if (!backupImportSource || !backupImportPassphrase.trim()) {
      setBackupImportError(t('settings.backup_import_empty'));
      return;
    }

    const result = await onImportBackup(backupImportSource.content, backupImportPassphrase.trim());
    if ('error' in result) {
      setBackupImportError(result.error);
      return;
    }

    setBackupStatus({ tone: 'success', message: t('settings.backup_import_success') });
    setIsImportModalOpen(false);
    resetImportState();
  };

  const resetPassphraseForm = () => {
    setPassphraseForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePassphraseSubmit = async () => {
    if (
      !passphraseForm.currentPassword.trim() ||
      !passphraseForm.newPassword.trim() ||
      !passphraseForm.confirmPassword.trim()
    ) {
      setPassphraseStatus({ tone: 'error', message: t('settings.passphrase_empty') });
      return;
    }

    if (passphraseForm.newPassword !== passphraseForm.confirmPassword) {
      setPassphraseStatus({ tone: 'error', message: t('settings.passphrase_mismatch') });
      return;
    }

    const changed = await onChangePassphrase(
      passphraseForm.currentPassword,
      passphraseForm.newPassword
    );

    if (!changed) {
      setPassphraseStatus({
        tone: 'error',
        message: lastSaveError
          ? `${t('settings.passphrase_error_prefix')} ${lastSaveError}`
          : t('settings.passphrase_incorrect')
      });
      return;
    }

    setPassphraseStatus({ tone: 'success', message: t('settings.passphrase_success') });
    resetPassphraseForm();
    setIsPassphraseModalOpen(false);
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
        <div className="editorial-meta">{t('settings.breadcrumb.configurations')} / {t('settings.breadcrumb.sovereignty')}</div>
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
                    <button
                      onClick={() => {
                        resetPassphraseForm();
                        setPassphraseStatus(null);
                        setIsPassphraseModalOpen(true);
                      }}
                      className="text-left text-xs text-accent hover:text-ink transition-colors underline underline-offset-4 mt-1"
                    >
                      {t('settings.change_passphrase')}
                    </button>
                  </div>
                </div>
                {passphraseStatus && (
                  <div
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm italic',
                      passphraseStatus.tone === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-700'
                        : 'border-red-500/20 bg-red-500/[0.03] text-red-600'
                    )}
                  >
                    {passphraseStatus.message}
                  </div>
                )}
                {backupStatus && (
                  <div
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-sm italic',
                      backupStatus.tone === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-700'
                        : 'border-red-500/20 bg-red-500/[0.03] text-red-600'
                    )}
                  >
                    {backupStatus.message}
                  </div>
                )}
                {!passphraseStatus && lastSaveError && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] px-4 py-3 text-sm italic text-red-600">
                    {t('settings.passphrase_error_prefix')} {lastSaveError}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h4 className="font-serif text-xl italic">{t('settings.session_control')}</h4>
                  <div className="flex flex-wrap gap-3">
                    <EditorialButton
                      onClick={onLock}
                      variant="outline"
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
                        <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{t('settings.export.markdown')}</span>
                     </div>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                  >
                     <Table size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                     <div className="flex flex-col">
                        <span className="font-serif italic text-sm">{t('settings.raw_database')}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{t('settings.export.spreadsheet')}</span>
                     </div>
                   </button>
                   <button 
                     onClick={handleExportBackup}
                     className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                   >
                      <Lock size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                      <div className="flex flex-col">
                         <span className="font-serif italic text-sm">{t('settings.encrypted_backup')}</span>
                         <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{t('settings.export.portable_archive')}</span>
                      </div>
                   </button>
                   <button 
                     onClick={() => backupInputRef.current?.click()}
                     className="flex flex-col gap-3 p-6 border border-ink/5 rounded-3xl hover:border-ink/20 hover:bg-ink/[0.01] transition-all text-left group"
                   >
                      <Upload size={20} className="opacity-40 group-hover:text-ink transition-colors" />
                      <div className="flex flex-col">
                         <span className="font-serif italic text-sm">{t('settings.import_backup')}</span>
                         <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{t('settings.export.restore_archive')}</span>
                      </div>
                   </button>
                </div>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleBackupFileSelection}
                />
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
               <EditorialButton
                 onClick={() => setIsWipeConfirmOpen(true)}
                 variant="danger"
                 size="lg"
               >
                 {t('settings.execute_wipe')}
               </EditorialButton>
            </div>
          </section>
        </div>
      </div>
      
      <footer className="pt-10 flex border-t border-ink/5 justify-between items-center opacity-30">
        <div className="editorial-meta">Hardware ID: {hardwareId}</div>
        <div className="editorial-meta">Lumina Core / 1.0.0-mvp</div>
      </footer>

      <EditorialModal
        isOpen={isPassphraseModalOpen}
        onClose={() => {
          setIsPassphraseModalOpen(false);
          resetPassphraseForm();
        }}
        title={t('settings.passphrase_modal_title')}
        subtitle={t('settings.passphrase_modal_subtitle')}
      >
        <div className="flex flex-col gap-8">
          <EditorialInput
            autoFocus
            type="password"
            label={t('settings.current_passphrase')}
            value={passphraseForm.currentPassword}
            onChange={(event) =>
              setPassphraseForm((current) => ({ ...current, currentPassword: event.target.value }))
            }
          />
          <EditorialInput
            type="password"
            label={t('settings.new_passphrase')}
            value={passphraseForm.newPassword}
            onChange={(event) =>
              setPassphraseForm((current) => ({ ...current, newPassword: event.target.value }))
            }
          />
          <EditorialInput
            type="password"
            label={t('settings.confirm_new_passphrase')}
            value={passphraseForm.confirmPassword}
            onChange={(event) =>
              setPassphraseForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
          />

          {passphraseStatus?.tone === 'error' && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] px-4 py-3 text-sm italic text-red-600">
              {passphraseStatus.message}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-ink/5">
            <button
              onClick={() => {
                setIsPassphraseModalOpen(false);
                resetPassphraseForm();
              }}
              className="editorial-meta text-accent hover:text-ink transition-colors"
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
            <EditorialButton onClick={handlePassphraseSubmit} disabled={isSaving}>
              {t('settings.change_passphrase')}
            </EditorialButton>
          </div>
        </div>
      </EditorialModal>

      <EditorialModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          resetImportState();
        }}
        title={t('settings.backup_import_modal_title')}
        subtitle={t('settings.backup_import_modal_subtitle')}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 rounded-3xl border border-ink/5 bg-ink/[0.02] px-6 py-5">
            <div className="editorial-meta">{t('settings.backup_import_warning')}</div>
            {backupImportSource && (
              <div className="text-sm italic text-accent">
                {t('settings.backup_file_selected')}: {backupImportSource.name}
              </div>
            )}
          </div>

          <EditorialInput
            autoFocus
            type="password"
            label={t('settings.backup_passphrase')}
            value={backupImportPassphrase}
            onChange={(event) => setBackupImportPassphrase(event.target.value)}
          />

          {backupImportError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] px-4 py-3 text-sm italic text-red-600">
              {backupImportError}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-ink/5">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                resetImportState();
              }}
              className="editorial-meta text-accent hover:text-ink transition-colors"
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
            <EditorialButton onClick={handleImportBackup} disabled={isSaving}>
              {t('settings.import_backup')}
            </EditorialButton>
          </div>
        </div>
      </EditorialModal>

      <ConfirmActionModal
        isOpen={isWipeConfirmOpen}
        onClose={() => setIsWipeConfirmOpen(false)}
        onConfirm={() => {
          setIsWipeConfirmOpen(false);
          onWipe();
        }}
        title={t('settings.wipe_vault')}
        description={t('settings.wipe_vault_desc')}
        confirmLabel={t('settings.execute_wipe')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        isBusy={isSaving}
      />
    </div>
  );
}
