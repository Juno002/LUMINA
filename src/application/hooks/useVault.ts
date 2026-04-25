/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useVault Hook (Application Layer)
 * Bridges the UI and the domain/infrastructure.
 * Manages vault lifecycle: create → unlock → use → auto-lock.
 * Password lives in memory only while vault is open.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';
import { Vault, ClinicalProfile, CrisisContact, HabitReminder } from '../../domain/entities';
import { vaultRepository } from '../../infrastructure/repositories/LocalForageVaultRepository';
import { cryptoService } from '../../infrastructure/services/CryptoService';
import { backupMetadataService } from '../../infrastructure/services/BackupMetadataService';
import {
  clearBiometricUnlock,
  enableBiometricUnlockWithPassphrase
} from '../../infrastructure/platform/RuntimePlatform';
import { createOnboardingState } from '../usecases/LuminaGuideUseCase';
import { BackupArtifact, buildBackupFilename } from '../usecases/BackupArtifact';

const CURRENT_SCHEMA_VERSION = 3;
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keypress', 'touchstart', 'click'] as const;
const CRISIS_KEY = 'lumina_crisis_config';
const BACKUP_FORMAT = 'lumina.portable-backup';
const BACKUP_VERSION = 2;
const SUPPORTED_BACKUP_VERSIONS = [1, 2] as const;

interface CrisisBackupData {
  copingPhrase: string;
  contacts: CrisisContact[];
}

interface PortableBackupPayload {
  vault: Vault;
  crisisData: CrisisBackupData | null;
  exportedFromSchema: number;
}

interface PortableBackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof SUPPORTED_BACKUP_VERSIONS[number];
  exportedAt: string;
  payload: string;
}

type BackupExportResult =
  | { ok: true; backup: string }
  | { ok: false; error: string };

type BackupImportResult =
  | { ok: true }
  | { ok: false; error: string };

type BackupArtifactResult =
  | { ok: true; artifact: BackupArtifact }
  | { ok: false; error: string };

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer | null {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return bytes.buffer;
  } catch {
    return null;
  }
}

function isPortableBackupEnvelope(value: unknown): value is PortableBackupEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PortableBackupEnvelope>;
  return (
    candidate.format === BACKUP_FORMAT &&
    SUPPORTED_BACKUP_VERSIONS.includes(candidate.version as typeof SUPPORTED_BACKUP_VERSIONS[number]) &&
    typeof candidate.exportedAt === 'string' &&
    typeof candidate.payload === 'string'
  );
}

/**
 * Applies any necessary schema migrations to a loaded vault.
 */
function normalizeHabitReminder(reminder: HabitReminder | undefined): HabitReminder | undefined {
  if (!reminder || reminder.enabled !== true) {
    return undefined;
  }

  const weekdays = Array.isArray(reminder.weekdays)
    ? reminder.weekdays.filter((day, index, source) =>
      Number.isInteger(day) && day >= 0 && day <= 6 && source.indexOf(day) === index
    )
    : [];

  return {
    enabled: true,
    cadence: reminder.cadence ?? 'daily',
    time: reminder.time ?? '08:00',
    weekdays
  };
}

function migrateVault(vault: Vault): Vault {
  let migrated = {
    ...vault,
    profile: {
      ...vault.profile,
      soundEnabled: vault.profile.soundEnabled ?? true,
      language: vault.profile.language ?? 'en',
      onboarding: vault.profile.onboarding ?? createOnboardingState('not_started')
    },
    habits: (vault.habits || []).map((habit) => ({
      ...habit,
      reminder: normalizeHabitReminder(habit.reminder)
    }))
  };

  if (!migrated.schemaVersion) {
    migrated = { ...migrated, schemaVersion: 1 };
  }

  if (migrated.schemaVersion < 2) {
    migrated = {
      ...migrated,
      schemaVersion: 2,
      profile: {
        ...migrated.profile,
        onboarding: migrated.profile.onboarding ?? createOnboardingState('not_started')
      }
    };
  }

  if (migrated.schemaVersion < 3) {
    migrated = {
      ...migrated,
      schemaVersion: 3,
      habits: (migrated.habits || []).map((habit) => ({
        ...habit,
        reminder: normalizeHabitReminder(habit.reminder)
      }))
    };
  }

  return migrated;
}

export function useVault() {
  const [vault, setVaultState] = useState<Vault | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [vaultExists, setVaultExists] = useState(false);
  const [unlockError, setUnlockError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => backupMetadataService.readLastBackupAt());

  // Password stays in memory only while vault is open
  const passwordRef = useRef<string | null>(null);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedVaultRef = useRef<Vault | null>(null);
  const queuedPasswordRef = useRef<string | null>(null);
  const saveInFlightRef = useRef<Promise<void> | null>(null);

  // --- Lock function (defined first, used by auto-lock) ---
  const lockVault = () => {
    setVaultState(null);
    setIsLocked(true);
    passwordRef.current = null;
    queuedVaultRef.current = null;
    queuedPasswordRef.current = null;
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
      autoLockTimer.current = null;
    }
  };

  const persistQueuedVault = useCallback(() => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }

    const nextVault = queuedVaultRef.current;
    const nextPassword = queuedPasswordRef.current;
    if (!nextVault || !nextPassword) {
      return null;
    }

    queuedVaultRef.current = null;
    queuedPasswordRef.current = null;
    setIsSaving(true);
    setLastSaveError(null);

    const task = (async () => {
      try {
        const saved = await vaultRepository.save(nextVault, nextPassword);
        if (!saved) {
          throw new Error('Unable to write the encrypted vault to local storage.');
        }
      } catch (e) {
        setLastSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        saveInFlightRef.current = null;
        if (queuedVaultRef.current && queuedPasswordRef.current) {
          void persistQueuedVault();
        } else {
          setIsSaving(false);
        }
      }
    })();

    saveInFlightRef.current = task;
    return task;
  }, []);

  const queueVaultPersistence = useCallback((nextVault: Vault) => {
    if (!passwordRef.current) {
      return;
    }

    queuedVaultRef.current = nextVault;
    queuedPasswordRef.current = passwordRef.current;
    void persistQueuedVault();
  }, [persistQueuedVault]);

  const flushVaultPersistence = useCallback(async () => {
    while (saveInFlightRef.current || (queuedVaultRef.current && queuedPasswordRef.current)) {
      if (saveInFlightRef.current) {
        await saveInFlightRef.current;
        continue;
      }

      const pendingTask = persistQueuedVault();
      if (pendingTask) {
        await pendingTask;
      }
    }
  }, [persistQueuedVault]);

  // Check if a vault exists on mount
  useEffect(() => {
    const init = async () => {
      try {
        const exists = await vaultRepository.exists();
        setVaultExists(exists);
      } catch (error) {
        console.error('Failed to initialize vault:', error);
        setVaultExists(false);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  // --- Auto-lock ---
  useEffect(() => {
    if (isLocked || !vault) return;

    const minutes = vault.profile.autoLockMinutes ?? 5;
    const ms = minutes * 60 * 1000;

    const resetTimer = () => {
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
      autoLockTimer.current = setTimeout(() => {
        lockVault();
      }, ms || DEFAULT_AUTO_LOCK_MS);
    };

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer(); // Start timer

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    };
  }, [isLocked, vault]);

  // --- Core operations ---
  const unlockVault = async (password: string): Promise<boolean> => {
    setUnlockError(false);
    const loaded = await vaultRepository.load(password);
    if (!loaded) {
      setUnlockError(true);
      return false;
    }
    const migrated = migrateVault(loaded);
    passwordRef.current = password;
    setVaultState(migrated);
    setIsLocked(false);
    // Persist migration if version changed
    if (migrated.schemaVersion !== loaded.schemaVersion) {
      await vaultRepository.save(migrated, password);
    }
    return true;
  };

  const createVault = async (name: string, password: string, clinicalProfile: ClinicalProfile = 'unspecified', language: 'en' | 'es' = 'en'): Promise<boolean> => {
    const newVault: Vault = {
      profile: { name, initialized: true, clinicalProfile, soundEnabled: true, language, onboarding: createOnboardingState('active') },
      createdAt: new Date().toISOString(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      journal: [],
      exposure: { hierarchy: [], logs: [] },
      activations: [],
      goals: [],
      sleep: [],
      wellness: { gratitudeEntries: [], moodEntries: [] },
      habits: [],
      habitLogs: [],
      stats: {
        discipline: { exp: 0, level: 1 },
        consistency: { exp: 0, level: 1 },
        totalExp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0
      },
      closedDays: []
    };
    const saved = await vaultRepository.save(newVault, password);
    if (saved) {
      passwordRef.current = password;
      setVaultState(newVault);
      setVaultExists(true);
      setIsLocked(false);
    }
    return saved;
  };

  const updateVault = async (newVault: Vault) => {
    setVaultState(newVault);
    queueVaultPersistence(newVault);
  };

  const enableBiometricUnlock = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!passwordRef.current) {
      return { ok: false, error: 'VAULT_LOCKED' };
    }

    const result = await enableBiometricUnlockWithPassphrase(passwordRef.current);
    if ('error' in result) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  };

  const changePassphrase = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!vault || !passwordRef.current) return false;
    if (currentPassword !== passwordRef.current) return false;
    
    setIsSaving(true);
    setLastSaveError(null);
    try {
      await flushVaultPersistence();
      const saved = await vaultRepository.save(vault, newPassword);
      if (saved) {
        passwordRef.current = newPassword;
        await clearBiometricUnlock();
        return true;
      }
      return false;
    } catch (e) {
      setLastSaveError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const wipeAllData = async () => {
    await flushVaultPersistence();
    await clearBiometricUnlock();
    const success = await vaultRepository.wipe();
    if (success) {
      backupMetadataService.clear();
      setLastBackupAt(null);
      lockVault();
      setVaultExists(false);
    }
  };

  const createBackupArtifact = async (backupPassword?: string): Promise<BackupArtifactResult> => {
    if (!vault || !passwordRef.current) {
      const error = 'Vault must be unlocked before exporting a backup.';
      setLastSaveError(error);
      return { ok: false, error };
    }

    const exportPassword = backupPassword?.trim() || passwordRef.current;

    try {
      const crisisData = await localforage.getItem<CrisisBackupData>(CRISIS_KEY);
      const exportedAt = new Date().toISOString();
      const portablePayload: PortableBackupPayload = {
        vault,
        crisisData: crisisData ?? null,
        exportedFromSchema: vault.schemaVersion ?? CURRENT_SCHEMA_VERSION
      };

      const encryptedPayload = await cryptoService.encrypt(
        JSON.stringify(portablePayload),
        exportPassword
      );

      const backupEnvelope: PortableBackupEnvelope = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt,
        payload: arrayBufferToBase64(encryptedPayload)
      };

      const serializedBackup = JSON.stringify(backupEnvelope, null, 2);
      backupMetadataService.rememberBackup(exportedAt);
      setLastBackupAt(exportedAt);
      setLastSaveError(null);
      return {
        ok: true,
        artifact: {
          filename: buildBackupFilename(exportedAt),
          mimeType: 'application/json',
          content: serializedBackup,
          exportedAt
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate backup.';
      setLastSaveError(message);
      return { ok: false, error: message };
    }
  };

  const exportBackup = async (backupPassword?: string): Promise<BackupExportResult> => {
    const artifactResult = await createBackupArtifact(backupPassword);
    if (artifactResult.ok === false) {
      return { ok: false, error: artifactResult.error };
    }

    return {
      ok: true,
      backup: artifactResult.artifact.content
    };
  };

  const importBackup = async (
    serializedBackup: string,
    password: string
  ): Promise<BackupImportResult> => {
    try {
      const envelope = JSON.parse(serializedBackup) as unknown;
      if (!isPortableBackupEnvelope(envelope)) {
        const error = 'Backup file is not a valid Lumina encrypted archive.';
        setLastSaveError(error);
        return { ok: false, error };
      }

      const encryptedPayload = base64ToArrayBuffer(envelope.payload);
      if (!encryptedPayload) {
        const error = 'Backup payload could not be decoded.';
        setLastSaveError(error);
        return { ok: false, error };
      }

      const decryptedPayload = await cryptoService.decrypt(encryptedPayload, password);
      if (!decryptedPayload) {
        const error = 'The provided passphrase could not unlock this backup.';
        setLastSaveError(error);
        setUnlockError(true);
        return { ok: false, error };
      }

      const parsedPayload = JSON.parse(decryptedPayload) as Partial<PortableBackupPayload>;
      if (!parsedPayload.vault) {
        const error = 'Backup contents are incomplete.';
        setLastSaveError(error);
        return { ok: false, error };
      }

      const migratedVault = migrateVault(parsedPayload.vault as Vault);
      const saved = await vaultRepository.save(migratedVault, password);
      if (!saved) {
        const error = 'Backup could not be written to the local vault.';
        setLastSaveError(error);
        return { ok: false, error };
      }

      if (parsedPayload.crisisData) {
        await localforage.setItem(CRISIS_KEY, parsedPayload.crisisData);
      } else {
        await localforage.removeItem(CRISIS_KEY);
      }

      await clearBiometricUnlock();
      passwordRef.current = password;
      setUnlockError(false);
      setLastSaveError(null);
      setVaultState(migratedVault);
      setVaultExists(true);
      setIsLocked(false);
      queuedVaultRef.current = null;
      queuedPasswordRef.current = null;

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to restore the backup.';
      setLastSaveError(message);
      return { ok: false, error: message };
    }
  };

  return {
    vault,
    isReady,
    isLocked,
    vaultExists,
    unlockError,
    isSaving,
    lastSaveError,
    lastBackupAt,
    unlockVault,
    createVault,
    lockVault,
    updateVault,
    changePassphrase,
    enableBiometricUnlock,
    wipeAllData,
    createBackupArtifact,
    exportBackup,
    importBackup
  };
}
