/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeFileMock = vi.hoisted(() => vi.fn());
const checkPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ publicStorage: 'granted' })));
const requestPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ publicStorage: 'granted' })));
const deleteFileMock = vi.hoisted(() => vi.fn(async () => undefined));
const shareMock = vi.hoisted(() => vi.fn());
const canShareMock = vi.hoisted(() => vi.fn(async () => ({ value: true })));
const pickFilesMock = vi.hoisted(() => vi.fn());
const saveBackupDocumentMock = vi.hoisted(() => vi.fn());
const openBackupDocumentMock = vi.hoisted(() => vi.fn());
const getBiometricStatusMock = vi.hoisted(() => vi.fn());
const enableBiometricUnlockMock = vi.hoisted(() => vi.fn());
const unlockWithBiometricsMock = vi.hoisted(() => vi.fn());
const disableBiometricUnlockMock = vi.hoisted(() => vi.fn(async () => undefined));
const impactMock = vi.hoisted(() => vi.fn(async () => undefined));
const notificationMock = vi.hoisted(() => vi.fn(async () => undefined));
const selectionStartMock = vi.hoisted(() => vi.fn(async () => undefined));
const selectionChangedMock = vi.hoisted(() => vi.fn(async () => undefined));
const selectionEndMock = vi.hoisted(() => vi.fn(async () => undefined));
const capacitorState = vi.hoisted(() => ({
  isNative: false,
  platform: 'web'
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => capacitorState.isNative,
    getPlatform: () => capacitorState.platform
  }
}));

vi.mock('@capacitor/filesystem', () => ({
  Directory: {
    Cache: 'CACHE',
    Documents: 'DOCUMENTS'
  },
  Encoding: {
    UTF8: 'utf8'
  },
  Filesystem: {
    writeFile: writeFileMock,
    deleteFile: deleteFileMock,
    checkPermissions: checkPermissionsMock,
    requestPermissions: requestPermissionsMock
  }
}));

vi.mock('./BackupDocumentsPlugin', () => ({
  BackupDocuments: {
    saveBackupDocument: saveBackupDocumentMock,
    openBackupDocument: openBackupDocumentMock
  }
}));

vi.mock('./BiometricVaultPlugin', () => ({
  BiometricVault: {
    getStatus: getBiometricStatusMock,
    enableBiometricUnlock: enableBiometricUnlockMock,
    unlockWithBiometrics: unlockWithBiometricsMock,
    disableBiometricUnlock: disableBiometricUnlockMock
  }
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    canShare: canShareMock,
    share: shareMock
  }
}));

vi.mock('@capawesome/capacitor-file-picker', () => ({
  FilePicker: {
    pickFiles: pickFilesMock
  }
}));

vi.mock('@capacitor/haptics', () => ({
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY'
  },
  NotificationType: {
    Success: 'SUCCESS',
    Error: 'ERROR'
  },
  Haptics: {
    impact: impactMock,
    notification: notificationMock,
    selectionStart: selectionStartMock,
    selectionChanged: selectionChangedMock,
    selectionEnd: selectionEndMock
  }
}));

import {
  clearBiometricUnlock,
  enableBiometricUnlockWithPassphrase,
  exportBackupArtifact,
  getBiometricUnlockState,
  pickNativeBackupImportSource,
  shareBackupArtifact,
  triggerPlatformHaptic,
  triggerSensoryHaptic,
  unlockVaultWithBiometrics
} from './RuntimePlatform';

const artifact = {
  filename: 'lumina-backup-2026-04-23_00-00-00Z.json',
  mimeType: 'application/json' as const,
  content: '{"format":"lumina.portable-backup","version":2}',
  exportedAt: '2026-04-23T00:00:00.000Z'
};

describe('RuntimePlatform', () => {
  beforeEach(() => {
    capacitorState.isNative = false;
    capacitorState.platform = 'web';
    writeFileMock.mockReset();
    deleteFileMock.mockReset();
    checkPermissionsMock.mockClear();
    requestPermissionsMock.mockClear();
    shareMock.mockReset();
    canShareMock.mockClear();
    pickFilesMock.mockReset();
    saveBackupDocumentMock.mockReset();
    openBackupDocumentMock.mockReset();
    getBiometricStatusMock.mockReset();
    enableBiometricUnlockMock.mockReset();
    unlockWithBiometricsMock.mockReset();
    disableBiometricUnlockMock.mockClear();
    impactMock.mockClear();
    notificationMock.mockClear();
    selectionStartMock.mockClear();
    selectionChangedMock.mockClear();
    selectionEndMock.mockClear();
    document.body.innerHTML = '';
  });

  it('downloads the encrypted artifact on web', async () => {
    const clickMock = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLAnchorElement;
      if (tagName === 'a') {
        element.click = clickMock;
      }
      return element;
    }) as typeof document.createElement);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lumina');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const result = await exportBackupArtifact(artifact);

    expect(result.method).toBe('download');
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('opens Android save-as for encrypted backup exports and cleans the temp file', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    writeFileMock.mockResolvedValue({ uri: 'file://lumina-backup.json' });
    saveBackupDocumentMock.mockResolvedValue({
      uri: 'content://documents/tree/lumina-backup.json',
      filename: artifact.filename
    });

    const result = await exportBackupArtifact(artifact);

    expect(checkPermissionsMock).not.toHaveBeenCalled();
    expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
      directory: 'CACHE',
      path: expect.stringContaining(`LUMINA/backups/${artifact.filename}`)
    }));
    expect(saveBackupDocumentMock).toHaveBeenCalledWith({
      sourceUri: 'file://lumina-backup.json',
      filename: artifact.filename,
      mimeType: artifact.mimeType
    });
    expect(deleteFileMock).toHaveBeenCalledWith({
      path: `LUMINA/backups/${artifact.filename}`,
      directory: 'CACHE'
    });
    expect(result.method).toBe('native-save');
    expect(result.shared).toBe(false);
  });

  it('writes the encrypted artifact to native cache and shares it when available', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    writeFileMock.mockResolvedValue({ uri: 'file://lumina-backup.json' });

    const result = await shareBackupArtifact(artifact);

    expect(checkPermissionsMock).not.toHaveBeenCalled();
    expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
      directory: 'CACHE',
      path: expect.stringContaining(`LUMINA/backups/${artifact.filename}`)
    }));
    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(deleteFileMock).toHaveBeenCalledWith({
      path: `LUMINA/backups/${artifact.filename}`,
      directory: 'CACHE'
    });
    expect(result.method).toBe('native-share');
    expect(result.shared).toBe(true);
  });

  it('reads a picked native backup file as UTF-8 content', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    openBackupDocumentMock.mockResolvedValue({
      uri: 'content://documents/tree/lumina-backup.json',
      name: 'lumina-backup.json',
      content: '{"format":"lumina.portable-backup","version":2}'
    });

    const result = await pickNativeBackupImportSource();

    expect(openBackupDocumentMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      name: 'lumina-backup.json',
      content: '{"format":"lumina.portable-backup","version":2}'
    });
  });

  it('reads biometric unlock availability from the Android plugin', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    getBiometricStatusMock.mockResolvedValue({
      supported: true,
      available: true,
      enrolled: true,
      enabled: true
    });

    const result = await getBiometricUnlockState();

    expect(result).toEqual({
      supported: true,
      available: true,
      enrolled: true,
      enabled: true
    });
  });

  it('maps biometric unlock responses into runtime-safe results', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    enableBiometricUnlockMock.mockResolvedValue({ enabled: true });
    unlockWithBiometricsMock.mockResolvedValue({ passphrase: 'secret-pass' });

    await expect(enableBiometricUnlockWithPassphrase('secret-pass')).resolves.toEqual({ ok: true });
    await expect(unlockVaultWithBiometrics()).resolves.toEqual({
      ok: true,
      passphrase: 'secret-pass'
    });

    unlockWithBiometricsMock.mockRejectedValueOnce(new Error('USER_CANCELED'));
    await expect(unlockVaultWithBiometrics()).resolves.toEqual({
      ok: false,
      error: 'USER_CANCELED'
    });

    await clearBiometricUnlock();
    expect(disableBiometricUnlockMock).toHaveBeenCalledTimes(1);
  });

  it('routes haptics through Capacitor plugins on native', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';

    await triggerPlatformHaptic('success');
    await triggerSensoryHaptic('intentShift');

    expect(notificationMock).toHaveBeenCalled();
    expect(selectionStartMock).toHaveBeenCalledTimes(1);
    expect(selectionChangedMock).toHaveBeenCalledTimes(1);
    expect(selectionEndMock).toHaveBeenCalledTimes(1);
  });
});
