/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeFileMock = vi.hoisted(() => vi.fn());
const checkPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ publicStorage: 'granted' })));
const requestPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ publicStorage: 'granted' })));
const shareMock = vi.hoisted(() => vi.fn());
const canShareMock = vi.hoisted(() => vi.fn(async () => ({ value: true })));
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
    Documents: 'DOCUMENTS'
  },
  Encoding: {
    UTF8: 'utf8'
  },
  Filesystem: {
    writeFile: writeFileMock,
    checkPermissions: checkPermissionsMock,
    requestPermissions: requestPermissionsMock
  }
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    canShare: canShareMock,
    share: shareMock
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
  exportBackupArtifact,
  shareBackupArtifact,
  triggerPlatformHaptic,
  triggerSensoryHaptic
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
    checkPermissionsMock.mockClear();
    requestPermissionsMock.mockClear();
    shareMock.mockReset();
    canShareMock.mockClear();
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

  it('writes the encrypted artifact to native documents and shares it when available', async () => {
    capacitorState.isNative = true;
    capacitorState.platform = 'android';
    writeFileMock.mockResolvedValue({ uri: 'file://lumina-backup.json' });

    const result = await shareBackupArtifact(artifact);

    expect(checkPermissionsMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
      path: expect.stringContaining(`LUMINA/${artifact.filename}`)
    }));
    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(result.method).toBe('native-share');
    expect(result.shared).toBe(true);
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
