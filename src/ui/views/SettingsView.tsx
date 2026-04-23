/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Compass,
  Download,
  FileText,
  Key,
  Lock,
  Palette,
  Share2,
  Shield,
  ShieldAlert,
  Table,
  Trash2,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import { Vault } from '../../domain/entities';
import { BackupArtifact } from '../../application/usecases/BackupArtifact';
import { useTranslation } from '../../application/contexts/LanguageContext';
import { Language } from '../../shared/i18n/translations';
import { todayISO } from '../../shared/utils/DateFormatter';
import { cn } from '../../shared/utils/TailwindMerge';
import { DataExportService } from '../../infrastructure/services/DataExportService';
import {
  exportBackupArtifact,
  getBackupTransportLabel,
  isNativeApp,
  shareBackupArtifact
} from '../../infrastructure/platform/RuntimePlatform';
import {
  ConfirmActionModal,
  EditorialButton,
  EditorialInput,
  EditorialModal
} from '../components/shared';

interface SettingsViewProps {
  vault: Vault;
  onUpdate: (newVault: Vault) => void;
  onWipe: () => void;
  onLock: () => void;
  onChangePassphrase: (currentPassword: string, nextPassword: string) => Promise<boolean>;
  onCreateBackupArtifact: () => Promise<{
    ok: true;
    artifact: BackupArtifact;
  } | { ok: false; error: string }>;
  onImportBackup: (
    serializedBackup: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onOpenCrisis: () => void;
  lastBackupAt: string | null;
  isSaving: boolean;
  lastSaveError: string | null;
  onGuideResume: () => void;
  onGuideRestart: () => void;
  onGuideComplete: () => void;
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

function formatBackupTimestamp(value: string, locale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function SettingsView({
  vault,
  onUpdate,
  onWipe,
  onLock,
  onChangePassphrase,
  onCreateBackupArtifact,
  onImportBackup,
  onOpenCrisis,
  lastBackupAt,
  isSaving,
  lastSaveError,
  onGuideResume,
  onGuideRestart,
  onGuideComplete
}: SettingsViewProps) {
  const { t, language, setLanguage } = useTranslation();
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const nativeEnvironment = isNativeApp();
  const backupTransportLabel = getBackupTransportLabel() === 'native'
    ? t('settings.backup_transport_native')
    : t('settings.backup_transport_web');

  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isSharingBackup, setIsSharingBackup] = useState(false);
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

  const lastBackupLabel = useMemo(() => {
    if (!lastBackupAt) {
      return t('settings.backup_not_saved_yet');
    }

    return formatBackupTimestamp(lastBackupAt, locale);
  }, [lastBackupAt, locale, t]);

  const wipeDescription = useMemo(() => {
    if (!lastBackupAt) {
      return `${t('settings.wipe_vault_desc')} ${t('settings.wipe_vault_desc_no_backup')}`;
    }

    return `${t('settings.wipe_vault_desc')} ${t('settings.wipe_vault_desc_with_backup')} ${formatBackupTimestamp(lastBackupAt, locale)}.`;
  }, [lastBackupAt, locale, t]);

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
    setBackupStatus(null);
    setIsExportingBackup(true);

    try {
      const result = await onCreateBackupArtifact();

      if ('error' in result) {
        setBackupStatus({ tone: 'error', message: result.error });
        return;
      }

      const exportResult = await exportBackupArtifact(result.artifact);
      setBackupStatus({
        tone: 'success',
        message: exportResult.method === 'download'
          ? t('settings.backup_export_success')
          : t('settings.backup_export_native_success')
      });
    } catch {
      setBackupStatus({ tone: 'error', message: t('settings.backup_export_error') });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleShareBackup = async () => {
    setBackupStatus(null);
    setIsSharingBackup(true);

    try {
      const result = await onCreateBackupArtifact();

      if ('error' in result) {
        setBackupStatus({ tone: 'error', message: result.error });
        return;
      }

      const shareResult = await shareBackupArtifact(result.artifact);
      setBackupStatus({
        tone: 'success',
        message: shareResult.shared
          ? t('settings.backup_share_success')
          : t('settings.backup_export_native_success')
      });
    } catch {
      setBackupStatus({ tone: 'error', message: t('settings.backup_share_error') });
    } finally {
      setIsSharingBackup(false);
    }
  };

  const handleBackupFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

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

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 border-b border-ink/5 pb-10">
            <div className="flex items-center gap-4">
              <Shield size={20} className="text-accent" />
              <div className="editorial-meta uppercase tracking-widest">{t('settings.security_protocol')}</div>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h4 className="font-serif text-xl italic">{t('settings.data_sovereignty')}</h4>
                <p className="text-sm italic leading-relaxed text-accent">
                  {t('settings.data_sovereignty_desc')}
                </p>
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-ink/5 bg-ink/[0.02] p-4">
                  <Key size={16} className="text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('settings.passphrase_management')}</span>
                    <button
                      onClick={() => {
                        resetPassphraseForm();
                        setPassphraseStatus(null);
                        setIsPassphraseModalOpen(true);
                      }}
                      className="mt-1 text-left text-xs text-accent underline underline-offset-4 transition-colors hover:text-ink"
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
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('settings.auto_lock')}</span>
                  </div>
                  <div className="flex gap-2">
                    {AUTO_LOCK_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAutoLock(opt)}
                        className={`rounded-lg px-3 py-2 text-[10px] font-mono transition-all duration-300 ${
                          currentAutoLock === opt
                            ? 'border-ink bg-ink text-paper'
                            : 'border border-ink/10 bg-paper text-accent hover:border-ink/30'
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
                <p className="text-xs italic leading-relaxed text-accent">
                  {t('settings.therapeutic_portability_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={handleExportMD}
                  className="group flex flex-col gap-3 rounded-3xl border border-ink/5 p-6 text-left transition-all hover:border-ink/20 hover:bg-ink/[0.01]"
                >
                  <FileText size={20} className="opacity-40 transition-colors group-hover:text-ink" />
                  <div className="flex flex-col">
                    <span className="font-serif text-sm italic">{t('settings.clinical_report')}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-widest opacity-40">{t('settings.export.markdown')}</span>
                  </div>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="group flex flex-col gap-3 rounded-3xl border border-ink/5 p-6 text-left transition-all hover:border-ink/20 hover:bg-ink/[0.01]"
                >
                  <Table size={20} className="opacity-40 transition-colors group-hover:text-ink" />
                  <div className="flex flex-col">
                    <span className="font-serif text-sm italic">{t('settings.raw_database')}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-widest opacity-40">{t('settings.export.spreadsheet')}</span>
                  </div>
                </button>
                <button
                  onClick={handleExportBackup}
                  disabled={isSaving || isExportingBackup}
                  className="group flex flex-col gap-3 rounded-3xl border border-ink/5 p-6 text-left transition-all hover:border-ink/20 hover:bg-ink/[0.01] disabled:opacity-40 disabled:hover:border-ink/5 disabled:hover:bg-transparent"
                >
                  <Lock size={20} className="opacity-40 transition-colors group-hover:text-ink" />
                  <div className="flex flex-col">
                    <span className="font-serif text-sm italic">{t('settings.encrypted_backup')}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-widest opacity-40">
                      {nativeEnvironment ? t('settings.backup_destination_native') : t('settings.backup_destination_web')}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => backupInputRef.current?.click()}
                  className="group flex flex-col gap-3 rounded-3xl border border-ink/5 p-6 text-left transition-all hover:border-ink/20 hover:bg-ink/[0.01]"
                >
                  <Upload size={20} className="opacity-40 transition-colors group-hover:text-ink" />
                  <div className="flex flex-col">
                    <span className="font-serif text-sm italic">{t('settings.import_backup')}</span>
                    <span className="mt-1 text-[9px] uppercase tracking-widest opacity-40">{t('settings.export.restore_archive')}</span>
                  </div>
                </button>
                {nativeEnvironment && (
                  <button
                    type="button"
                    onClick={handleShareBackup}
                    disabled={isSaving || isSharingBackup}
                    className="group flex flex-col gap-3 rounded-3xl border border-ink/5 p-6 text-left transition-all hover:border-ink/20 hover:bg-ink/[0.01] disabled:opacity-40 disabled:hover:border-ink/5 disabled:hover:bg-transparent sm:col-span-2"
                  >
                    <Share2 size={20} className="opacity-40 transition-colors group-hover:text-ink" />
                    <div className="flex flex-col">
                      <span className="font-serif text-sm italic">{t('settings.share_backup')}</span>
                      <span className="mt-1 text-[9px] uppercase tracking-widest opacity-40">{t('settings.export.share_archive')}</span>
                    </div>
                  </button>
                )}
              </div>

              <div className="rounded-3xl border border-ink/5 bg-ink/[0.02] px-6 py-5">
                <div className="editorial-meta">{t('settings.backup_local_privacy')}</div>
                <p className="mt-2 text-sm italic leading-relaxed text-accent">
                  {t('settings.backup_local_privacy_desc')}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="editorial-meta">{t('settings.backup_last_saved')}</span>
                    <span className="italic text-ink/70">{lastBackupLabel}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="editorial-meta">{t('settings.backup_transport_label')}</span>
                    <span className="italic text-ink/70">{backupTransportLabel}</span>
                  </div>
                </div>
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
                className="flex items-center justify-between rounded-2xl border border-ink/5 px-6 py-4 transition-all hover:bg-ink/[0.02]"
              >
                <div className="flex flex-col items-start">
                  <span className="font-serif italic">{t('settings.sensorial_audio')}</span>
                  <span className="mt-1 text-[9px] editorial-meta opacity-50">{t('settings.sensorial_audio_desc')}</span>
                </div>
                <div className={cn('flex h-6 w-12 items-center rounded-full px-1 transition-all', vault.profile.soundEnabled ? 'bg-ink' : 'bg-ink/10')}>
                  <motion.div
                    animate={{ x: vault.profile.soundEnabled ? 24 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-4 w-4 rounded-full bg-paper"
                  />
                </div>
              </button>

              <div className="grid grid-cols-1 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-6 py-4 transition-all',
                      currentTheme === theme.id
                        ? 'border-ink/20 bg-ink/[0.03]'
                        : 'border-ink/5 hover:bg-ink/[0.02]'
                    )}
                  >
                    <span className={cn('font-serif italic', currentTheme === theme.id ? 'text-ink' : 'text-accent')}>
                      {theme.name}
                    </span>
                    {currentTheme === theme.id && <Check size={14} className="text-ink" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <div className="editorial-meta opacity-40">{t('settings.linguistic_architecture')}</div>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as Language)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-6 py-4 transition-all',
                        language === lang.id
                          ? 'border-ink/20 bg-ink/[0.03]'
                          : 'border-ink/5 hover:bg-ink/[0.02]'
                      )}
                    >
                      <span className={cn('font-serif italic', language === lang.id ? 'text-ink' : 'text-accent')}>
                        {lang.name}
                      </span>
                      {language === lang.id && <Check size={14} className="text-ink" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-ink/5 p-6">
                <div className="flex items-center gap-3">
                  <Compass size={16} className="text-accent" />
                  <div className="flex flex-col items-start">
                    <span className="font-serif italic">{t('settings.lumina_guide')}</span>
                    <span className="mt-1 text-[9px] editorial-meta opacity-50">{t('settings.lumina_guide_desc')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <EditorialButton type="button" variant="outline" size="sm" onClick={onGuideResume}>
                    {t('settings.guide_resume')}
                  </EditorialButton>
                  <EditorialButton type="button" variant="outline" size="sm" onClick={onGuideRestart}>
                    {t('settings.guide_restart')}
                  </EditorialButton>
                  <EditorialButton type="button" variant="ghost" size="sm" onClick={onGuideComplete}>
                    {t('settings.guide_complete')}
                  </EditorialButton>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-12">
          <section className="flex flex-col gap-8 border-t border-ink/5 pt-10">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="text-red-500/50" />
              <div className="editorial-meta uppercase tracking-widest text-red-500/50">{t('settings.critical_termination')}</div>
            </div>
            <div className="flex flex-col justify-between gap-8 rounded-[3rem] border border-red-500/10 bg-red-500/[0.01] p-10 md:flex-row md:items-center">
              <div className="flex flex-col gap-3">
                <h4 className="font-serif text-2xl italic text-red-500/80">{t('settings.wipe_vault')}</h4>
                <p className="max-w-xl text-sm italic leading-relaxed text-red-500/60">
                  {t('settings.wipe_vault_desc')}
                </p>
                {!lastBackupAt && (
                  <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] px-4 py-3 text-xs italic text-red-500/80">
                    {t('settings.wipe_vault_desc_no_backup')}
                  </div>
                )}
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

      <footer className="flex items-center justify-between border-t border-ink/5 pt-10 opacity-30">
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
        closeLabel={t('common.close')}
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

          <div className="flex items-center justify-between border-t border-ink/5 pt-4">
            <button
              onClick={() => {
                setIsPassphraseModalOpen(false);
                resetPassphraseForm();
              }}
              className="editorial-meta text-accent transition-colors hover:text-ink"
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
        closeLabel={t('common.close')}
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

          <div className="flex items-center justify-between border-t border-ink/5 pt-4">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                resetImportState();
              }}
              className="editorial-meta text-accent transition-colors hover:text-ink"
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
        description={wipeDescription}
        confirmLabel={t('settings.execute_wipe')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        isBusy={isSaving}
      />
    </div>
  );
}
