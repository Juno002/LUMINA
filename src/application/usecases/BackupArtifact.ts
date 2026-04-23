/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BackupArtifact {
  filename: string;
  mimeType: 'application/json';
  content: string;
  exportedAt: string;
}

export function buildBackupFilename(exportedAt: string): string {
  const date = new Date(exportedAt);
  const safeTimestamp = Number.isNaN(date.getTime())
    ? exportedAt.replace(/[:.]/g, '-')
    : date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace('T', '_').replace(/:/g, '-');

  return `lumina-backup-${safeTimestamp}.json`;
}
