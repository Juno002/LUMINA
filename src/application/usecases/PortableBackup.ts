/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BackupArtifact } from './BackupArtifact';
import { buildBackupFilename } from './BackupArtifact';
import { createOnboardingState } from './LuminaGuideUseCase';
import type { CrisisContact, HabitReminder, Vault } from '../../domain/entities';
import { cryptoService } from '../../infrastructure/services/CryptoService';

const CURRENT_SCHEMA_VERSION = 3;
const SUPPORTED_BACKUP_VERSIONS = [1, 2] as const;

export const BACKUP_FORMAT = 'lumina.portable-backup';
export const BACKUP_VERSION = 2;
export const CRISIS_BACKUP_KEY = 'lumina_crisis_config';

export interface CrisisBackupData {
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

export type RestorePortableBackupResult =
  | {
      ok: true;
      vault: Vault;
      crisisData: CrisisBackupData | null;
      exportedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

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
    SUPPORTED_BACKUP_VERSIONS.includes(
      candidate.version as typeof SUPPORTED_BACKUP_VERSIONS[number]
    ) &&
    typeof candidate.exportedAt === 'string' &&
    typeof candidate.payload === 'string'
  );
}

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

export function migrateVault(vault: Vault): Vault {
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

export async function createPortableBackupArtifact(options: {
  vault: Vault;
  crisisData: CrisisBackupData | null;
  password: string;
  exportedAt?: string;
}): Promise<BackupArtifact> {
  const exportedAt = options.exportedAt ?? new Date().toISOString();
  const portablePayload: PortableBackupPayload = {
    vault: options.vault,
    crisisData: options.crisisData,
    exportedFromSchema: options.vault.schemaVersion ?? CURRENT_SCHEMA_VERSION
  };

  const encryptedPayload = await cryptoService.encrypt(
    JSON.stringify(portablePayload),
    options.password
  );

  const backupEnvelope: PortableBackupEnvelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    payload: arrayBufferToBase64(encryptedPayload)
  };

  return {
    filename: buildBackupFilename(exportedAt),
    mimeType: 'application/json',
    content: JSON.stringify(backupEnvelope, null, 2),
    exportedAt
  };
}

export async function restorePortableBackup(
  serializedBackup: string,
  password: string
): Promise<RestorePortableBackupResult> {
  try {
    const envelope = JSON.parse(serializedBackup) as unknown;
    if (!isPortableBackupEnvelope(envelope)) {
      return {
        ok: false,
        error: 'Backup file is not a valid Lumina encrypted archive.'
      };
    }

    const encryptedPayload = base64ToArrayBuffer(envelope.payload);
    if (!encryptedPayload) {
      return {
        ok: false,
        error: 'Backup payload could not be decoded.'
      };
    }

    const decryptedPayload = await cryptoService.decrypt(encryptedPayload, password);
    if (!decryptedPayload) {
      return {
        ok: false,
        error: 'The provided passphrase could not unlock this backup.'
      };
    }

    const parsedPayload = JSON.parse(decryptedPayload) as Partial<PortableBackupPayload>;
    if (!parsedPayload.vault) {
      return {
        ok: false,
        error: 'Backup contents are incomplete.'
      };
    }

    return {
      ok: true,
      vault: migrateVault(parsedPayload.vault as Vault),
      crisisData: parsedPayload.crisisData ?? null,
      exportedAt: envelope.exportedAt
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to restore the backup.'
    };
  }
}
