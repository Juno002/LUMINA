/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const BACKUP_METADATA_KEY = 'lumina_backup_metadata_v1';

interface BackupMetadataSnapshot {
  lastBackupAt: string | null;
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function parseSnapshot(value: string | null): BackupMetadataSnapshot {
  if (!value) {
    return { lastBackupAt: null };
  }

  try {
    const parsed = JSON.parse(value) as Partial<BackupMetadataSnapshot>;
    return {
      lastBackupAt: typeof parsed.lastBackupAt === 'string' ? parsed.lastBackupAt : null
    };
  } catch {
    return { lastBackupAt: null };
  }
}

export const backupMetadataService = {
  readLastBackupAt(): string | null {
    if (!isBrowser()) {
      return null;
    }

    return parseSnapshot(window.localStorage.getItem(BACKUP_METADATA_KEY)).lastBackupAt;
  },

  rememberBackup(exportedAt: string) {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.setItem(
      BACKUP_METADATA_KEY,
      JSON.stringify({ lastBackupAt: exportedAt } satisfies BackupMetadataSnapshot)
    );
  },

  clear() {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.removeItem(BACKUP_METADATA_KEY);
  }
};
