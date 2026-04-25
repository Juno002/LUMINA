/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { BackupDocuments } from './BackupDocumentsPlugin';
import { BiometricVault } from './BiometricVaultPlugin';
import type { BackupArtifact } from '../../application/usecases/BackupArtifact';

export type RuntimePlatform = 'web' | 'android' | 'ios';
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error';
export type SensoryHapticEvent =
  | 'tap'
  | 'intentShift'
  | 'complete'
  | 'success'
  | 'streak'
  | 'levelUp'
  | 'undo'
  | 'error';

export interface BackupExportResult {
  method: 'download' | 'native-save' | 'native-share';
  filename: string;
  uri?: string;
  shared: boolean;
}

export interface BackupImportSource {
  name: string;
  content: string;
}

export interface BiometricUnlockState {
  supported: boolean;
  available: boolean;
  enrolled: boolean;
  enabled: boolean;
}

export type BiometricUnlockError =
  | 'KEY_INVALIDATED'
  | 'NOT_AVAILABLE'
  | 'NOT_ENABLED'
  | 'NOT_ENROLLED'
  | 'USER_CANCELED'
  | 'UNKNOWN';

export type BiometricUnlockActionResult =
  | { ok: true }
  | { ok: false; error: BiometricUnlockError };

export type BiometricUnlockPassphraseResult =
  | { ok: true; passphrase: string }
  | { ok: false; error: BiometricUnlockError };

const WEB_HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [10, 50, 10],
  error: [50, 50, 50]
};

const SENSORY_HAPTIC_PATTERNS: Record<SensoryHapticEvent, number | number[]> = {
  tap: 8,
  intentShift: [8, 24, 8],
  complete: [10, 36, 10],
  success: [12, 44, 12],
  streak: [15, 30, 15],
  levelUp: [18, 34, 18, 34, 24],
  undo: 18,
  error: [45, 30, 65]
};

function triggerBrowserVibration(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  navigator.vibrate(pattern);
}

function downloadArtifactInBrowser(artifact: BackupArtifact) {
  const blob = new Blob([artifact.content], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = artifact.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function decodeBase64Utf8(value: string): string {
  const payload = value.includes(',') ? value.split(',').pop() ?? '' : value;
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isUserCanceledError(error: unknown, canceledMessage: string) {
  return error instanceof Error && error.message === canceledMessage;
}

function mapBiometricError(error: unknown): BiometricUnlockError {
  if (!(error instanceof Error)) {
    return 'UNKNOWN';
  }

  switch (error.message) {
    case 'KEY_INVALIDATED':
      return 'KEY_INVALIDATED';
    case 'NOT_AVAILABLE':
    case 'NOT_SUPPORTED':
      return 'NOT_AVAILABLE';
    case 'NOT_ENABLED':
      return 'NOT_ENABLED';
    case 'NOT_ENROLLED':
      return 'NOT_ENROLLED';
    case 'USER_CANCELED':
      return 'USER_CANCELED';
    default:
      return 'UNKNOWN';
  }
}

async function ensureAndroidPublicStoragePermission() {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return;
  }

  try {
    const status = await Filesystem.checkPermissions();
    if (status.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }
  } catch {
    // Android permission semantics vary by version. If the platform manages
    // access implicitly for app-created files, we can continue to write.
  }
}

async function writeNativeBackupArtifact(
  artifact: BackupArtifact,
  directory: Directory = Directory.Documents
) {
  if (directory === Directory.Documents) {
    await ensureAndroidPublicStoragePermission();
  }

  const path = `LUMINA/backups/${artifact.filename}`;
  const { uri } = await Filesystem.writeFile({
    path,
    data: artifact.content,
    directory,
    encoding: Encoding.UTF8,
    recursive: true
  });

  return { path, uri };
}

async function deleteNativeBackupArtifact(path: string, directory: Directory) {
  try {
    await Filesystem.deleteFile({
      path,
      directory
    });
  } catch {
    // Cache cleanup is best effort.
  }
}

export function getRuntimePlatform(): RuntimePlatform {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios' ? platform : 'web';
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getBackupTransportLabel() {
  return isNativeApp() ? 'native' : 'download';
}

export async function getBiometricUnlockState(): Promise<BiometricUnlockState> {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return {
      supported: false,
      available: false,
      enrolled: false,
      enabled: false
    };
  }

  try {
    return await BiometricVault.getStatus();
  } catch {
    return {
      supported: false,
      available: false,
      enrolled: false,
      enabled: false
    };
  }
}

export async function enableBiometricUnlockWithPassphrase(
  passphrase: string
): Promise<BiometricUnlockActionResult> {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return { ok: false, error: 'NOT_AVAILABLE' };
  }

  try {
    await BiometricVault.enableBiometricUnlock({ passphrase });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapBiometricError(error) };
  }
}

export async function unlockVaultWithBiometrics(): Promise<BiometricUnlockPassphraseResult> {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return { ok: false, error: 'NOT_AVAILABLE' };
  }

  try {
    const result = await BiometricVault.unlockWithBiometrics();
    return { ok: true, passphrase: result.passphrase };
  } catch (error) {
    return { ok: false, error: mapBiometricError(error) };
  }
}

export async function clearBiometricUnlock() {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return;
  }

  try {
    await BiometricVault.disableBiometricUnlock();
  } catch {
    // Clearing secure state is best effort.
  }
}

export async function exportBackupArtifact(artifact: BackupArtifact): Promise<BackupExportResult> {
  if (!isNativeApp()) {
    downloadArtifactInBrowser(artifact);
    return {
      method: 'download',
      filename: artifact.filename,
      shared: false
    };
  }

  if (getRuntimePlatform() === 'android') {
    const written = await writeNativeBackupArtifact(artifact, Directory.Cache);

    try {
      const saved = await BackupDocuments.saveBackupDocument({
        sourceUri: written.uri,
        filename: artifact.filename,
        mimeType: artifact.mimeType
      });

      return {
        method: 'native-save',
        filename: saved.filename,
        uri: saved.uri,
        shared: false
      };
    } catch (error) {
      if (isUserCanceledError(error, 'saveBackupDocument canceled.')) {
        throw new Error('USER_CANCELED');
      }
      throw error;
    } finally {
      await deleteNativeBackupArtifact(written.path, Directory.Cache);
    }
  }

  const written = await writeNativeBackupArtifact(artifact, Directory.Documents);
  return {
    method: 'native-save',
    filename: artifact.filename,
    uri: written.uri,
    shared: false
  };
}

export async function shareBackupArtifact(artifact: BackupArtifact): Promise<BackupExportResult> {
  if (!isNativeApp()) {
    return exportBackupArtifact(artifact);
  }

  const written = await writeNativeBackupArtifact(artifact, Directory.Cache);

  try {
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({
        title: 'LUMINA',
        text: 'Encrypted local backup',
        files: [written.uri],
        dialogTitle: 'Export encrypted backup'
      });

      return {
        method: 'native-share',
        filename: artifact.filename,
        uri: written.uri,
        shared: true
      };
    }
  } catch {
    // Fall through to Android's secure save dialog below.
  } finally {
    await deleteNativeBackupArtifact(written.path, Directory.Cache);
  }

  return exportBackupArtifact(artifact);
}

export async function pickNativeBackupImportSource(): Promise<BackupImportSource | null> {
  if (getRuntimePlatform() === 'android') {
    try {
      const file = await BackupDocuments.openBackupDocument({
        mimeTypes: ['application/json', 'application/octet-stream']
      });

      return {
        name: file.name || 'lumina-backup.json',
        content: file.content
      };
    } catch (error) {
      if (isUserCanceledError(error, 'openBackupDocument canceled.')) {
        return null;
      }
      throw error;
    }
  }

  const result = await FilePicker.pickFiles({
    types: ['application/json', 'application/octet-stream'],
    limit: 1,
    readData: true
  });

  const file = result.files?.[0];
  if (!file) {
    return null;
  }

  if (!file.data) {
    throw new Error('Selected backup file could not be read.');
  }

  return {
    name: file.name || 'lumina-backup.json',
    content: decodeBase64Utf8(file.data)
  };
}

async function triggerNativeHaptic(style: HapticStyle) {
  if (!isNativeApp()) {
    triggerBrowserVibration(WEB_HAPTIC_PATTERNS[style]);
    return;
  }

  try {
    if (style === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }

    if (style === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
      return;
    }

    const mappedStyle =
      style === 'heavy' ? ImpactStyle.Heavy :
      style === 'medium' ? ImpactStyle.Medium :
      ImpactStyle.Light;

    await Haptics.impact({ style: mappedStyle });
  } catch {
    triggerBrowserVibration(WEB_HAPTIC_PATTERNS[style]);
  }
}

export async function triggerPlatformHaptic(style: HapticStyle = 'light') {
  await triggerNativeHaptic(style);
}

export async function triggerSensoryHaptic(event: SensoryHapticEvent) {
  if (!isNativeApp()) {
    triggerBrowserVibration(SENSORY_HAPTIC_PATTERNS[event]);
    return;
  }

  try {
    switch (event) {
      case 'tap':
        await Haptics.selectionChanged();
        return;
      case 'intentShift':
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
        return;
      case 'complete':
      case 'success':
      case 'streak':
        await Haptics.notification({ type: NotificationType.Success });
        return;
      case 'levelUp':
        await Haptics.notification({ type: NotificationType.Success });
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case 'undo':
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        return;
    }
  } catch {
    triggerBrowserVibration(SENSORY_HAPTIC_PATTERNS[event]);
  }
}
