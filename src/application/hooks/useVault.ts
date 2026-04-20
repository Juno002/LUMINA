/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useVault Hook (Application Layer)
 * Bridges the UI and the domain/infrastructure.
 * Manages vault lifecycle: create → unlock → use → auto-lock.
 * Password lives in memory only while vault is open.
 */

import { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { Vault, ClinicalProfile, CrisisContact } from '../../domain/entities';
import { vaultRepository } from '../../infrastructure/repositories/LocalForageVaultRepository';
import { cryptoService } from '../../infrastructure/services/CryptoService';

const CURRENT_SCHEMA_VERSION = 1;
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keypress', 'touchstart', 'click'] as const;
const CRISIS_KEY = 'lumina_crisis_config';
const BACKUP_FORMAT = 'lumina.portable-backup';
const BACKUP_VERSION = 1;

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
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  payload: string;
}

type BackupExportResult =
  | { ok: true; backup: string }
  | { ok: false; error: string };

type BackupImportResult =
  | { ok: true }
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
    candidate.version === BACKUP_VERSION &&
    typeof candidate.exportedAt === 'string' &&
    typeof candidate.payload === 'string'
  );
}

/**
 * Applies any necessary schema migrations to a loaded vault.
 */
function migrateVault(vault: Vault): Vault {
  const migrated = { ...vault };
  if (!migrated.schemaVersion) {
    migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  }
  // Future migrations go here:
  // if (migrated.schemaVersion < 2) { ... migrated.schemaVersion = 2; }
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

  // Password stays in memory only while vault is open
  const passwordRef = useRef<string | null>(null);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Lock function (defined first, used by auto-lock) ---
  const lockVault = () => {
    setVaultState(null);
    setIsLocked(true);
    passwordRef.current = null;
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
      autoLockTimer.current = null;
    }
  };

  // Check if a vault exists on mount
  useEffect(() => {
    const init = async () => {
      const exists = await vaultRepository.exists();
      setVaultExists(exists);
      setIsReady(true);
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
      profile: { name, initialized: true, clinicalProfile, soundEnabled: true, language },
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
    if (passwordRef.current) {
      setIsSaving(true);
      setLastSaveError(null);
      try {
        await vaultRepository.save(newVault, passwordRef.current);
      } catch (e) {
        setLastSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const changePassphrase = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!vault || !passwordRef.current) return false;
    if (currentPassword !== passwordRef.current) return false;
    
    setIsSaving(true);
    setLastSaveError(null);
    try {
      const saved = await vaultRepository.save(vault, newPassword);
      if (saved) {
        passwordRef.current = newPassword;
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
    const success = await vaultRepository.wipe();
    if (success) {
      lockVault();
      setVaultExists(false);
    }
  };

  const exportBackup = async (): Promise<BackupExportResult> => {
    if (!vault || !passwordRef.current) {
      const error = 'Vault must be unlocked before exporting a backup.';
      setLastSaveError(error);
      return { ok: false, error };
    }

    try {
      const crisisData = await localforage.getItem<CrisisBackupData>(CRISIS_KEY);
      const portablePayload: PortableBackupPayload = {
        vault,
        crisisData: crisisData ?? null,
        exportedFromSchema: vault.schemaVersion ?? CURRENT_SCHEMA_VERSION
      };

      const encryptedPayload = await cryptoService.encrypt(
        JSON.stringify(portablePayload),
        passwordRef.current
      );

      const backupEnvelope: PortableBackupEnvelope = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        payload: arrayBufferToBase64(encryptedPayload)
      };

      setLastSaveError(null);
      return {
        ok: true,
        backup: JSON.stringify(backupEnvelope, null, 2)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate backup.';
      setLastSaveError(message);
      return { ok: false, error: message };
    }
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

      passwordRef.current = password;
      setUnlockError(false);
      setLastSaveError(null);
      setVaultState(migratedVault);
      setVaultExists(true);
      setIsLocked(false);

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
    unlockVault,
    createVault,
    lockVault,
    updateVault,
    changePassphrase,
    wipeAllData,
    exportBackup,
    importBackup
  };
}
