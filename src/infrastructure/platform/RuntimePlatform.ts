/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
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

async function writeNativeBackupArtifact(artifact: BackupArtifact) {
  await ensureAndroidPublicStoragePermission();

  const path = `LUMINA/${artifact.filename}`;
  const { uri } = await Filesystem.writeFile({
    path,
    data: artifact.content,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true
  });

  return { path, uri };
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

export async function exportBackupArtifact(artifact: BackupArtifact): Promise<BackupExportResult> {
  if (!isNativeApp()) {
    downloadArtifactInBrowser(artifact);
    return {
      method: 'download',
      filename: artifact.filename,
      shared: false
    };
  }

  const written = await writeNativeBackupArtifact(artifact);
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

  const written = await writeNativeBackupArtifact(artifact);

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
    // Fall through to saved-file response.
  }

  return {
    method: 'native-save',
    filename: artifact.filename,
    uri: written.uri,
    shared: false
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
