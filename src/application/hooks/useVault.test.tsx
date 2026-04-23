/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vault } from '../../domain/entities';
import { useVault } from './useVault';

const localforageState = vi.hoisted(() => ({
  crisisData: null as {
    copingPhrase: string;
    contacts: Array<{ id: string; name: string; phone: string }>;
  } | null
}));

const repositoryState = vi.hoisted(() => ({
  storedPassword: null as string | null,
  storedVault: null as Vault | null
}));

const fakeLocalforage = vi.hoisted(() => ({
  getItem: vi.fn(async (key: string) => {
    if (key === 'lumina_crisis_config') {
      return localforageState.crisisData;
    }
    return null;
  }),
  setItem: vi.fn(async (key: string, value: unknown) => {
    if (key === 'lumina_crisis_config') {
      localforageState.crisisData = JSON.parse(JSON.stringify(value)) as typeof localforageState.crisisData;
    }
    return value;
  }),
  removeItem: vi.fn(async (key: string) => {
    if (key === 'lumina_crisis_config') {
      localforageState.crisisData = null;
    }
  })
}));

const fakeRepository = vi.hoisted(() => ({
  exists: vi.fn(async () => repositoryState.storedVault !== null),
  load: vi.fn(async (password: string) =>
    password === repositoryState.storedPassword ? repositoryState.storedVault : null
  ),
  save: vi.fn(async (vault: Vault, password: string) => {
    repositoryState.storedVault = JSON.parse(JSON.stringify(vault)) as Vault;
    repositoryState.storedPassword = password;
    return true;
  }),
  wipe: vi.fn(async () => {
    repositoryState.storedVault = null;
    repositoryState.storedPassword = null;
    return true;
  })
}));

const fakeCryptoService = vi.hoisted(() => ({
  encrypt: vi.fn(async (plainText: string) => new TextEncoder().encode(plainText).buffer),
  decrypt: vi.fn(async (cipherData: ArrayBuffer) => new TextDecoder().decode(cipherData))
}));

vi.mock('localforage', () => ({
  default: fakeLocalforage
}));

vi.mock('../../infrastructure/repositories/LocalForageVaultRepository', () => ({
  vaultRepository: fakeRepository
}));

vi.mock('../../infrastructure/services/CryptoService', () => ({
  cryptoService: fakeCryptoService
}));

describe('useVault', () => {
  beforeEach(() => {
    window.localStorage.clear();
    localforageState.crisisData = null;
    repositoryState.storedVault = null;
    repositoryState.storedPassword = null;
    fakeLocalforage.getItem.mockClear();
    fakeLocalforage.setItem.mockClear();
    fakeLocalforage.removeItem.mockClear();
    fakeRepository.exists.mockClear();
    fakeRepository.load.mockClear();
    fakeRepository.save.mockClear();
    fakeRepository.wipe.mockClear();
    fakeCryptoService.encrypt.mockClear();
    fakeCryptoService.decrypt.mockClear();
  });

  it('creates a vault and unlocks it immediately', async () => {
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.vaultExists).toBe(false);
    expect(result.current.isLocked).toBe(true);

    await act(async () => {
      const created = await result.current.createVault('Junior', 'secret-pass', 'anxiety', 'es');
      expect(created).toBe(true);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.vaultExists).toBe(true);
    expect(result.current.vault?.schemaVersion).toBe(2);
    expect(result.current.vault?.profile.name).toBe('Junior');
    expect(result.current.vault?.profile.language).toBe('es');
    expect(fakeRepository.save).toHaveBeenCalledTimes(1);
  });

  it('locks, rejects wrong passwords, rotates passphrase, and wipes data', async () => {
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.createVault('Junior', 'secret-pass');
    });

    act(() => {
      result.current.lockVault();
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.vault).toBeNull();

    await act(async () => {
      const unlocked = await result.current.unlockVault('wrong-pass');
      expect(unlocked).toBe(false);
    });

    expect(result.current.unlockError).toBe(true);
    expect(result.current.isLocked).toBe(true);

    await act(async () => {
      const unlocked = await result.current.unlockVault('secret-pass');
      expect(unlocked).toBe(true);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.vault?.profile.name).toBe('Junior');

    await act(async () => {
      const changed = await result.current.changePassphrase('secret-pass', 'new-secret');
      expect(changed).toBe(true);
    });

    act(() => {
      result.current.lockVault();
    });

    await act(async () => {
      const unlockedWithOld = await result.current.unlockVault('secret-pass');
      expect(unlockedWithOld).toBe(false);
    });

    await act(async () => {
      const unlockedWithNew = await result.current.unlockVault('new-secret');
      expect(unlockedWithNew).toBe(true);
    });

    await act(async () => {
      await result.current.wipeAllData();
    });

    expect(result.current.vaultExists).toBe(false);
    expect(result.current.isLocked).toBe(true);
    expect(result.current.vault).toBeNull();
    expect(result.current.lastBackupAt).toBeNull();
    expect(fakeRepository.wipe).toHaveBeenCalledTimes(1);
  });

  it('migrates legacy vaults without schemaVersion on unlock', async () => {
    repositoryState.storedPassword = 'legacy-pass';
    repositoryState.storedVault = {
      profile: { name: 'Legacy', initialized: true, soundEnabled: true, language: 'en' },
      createdAt: '2026-04-19T00:00:00.000Z',
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
    } as Vault;
    delete (repositoryState.storedVault as Partial<Vault>).schemaVersion;

    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      const unlocked = await result.current.unlockVault('legacy-pass');
      expect(unlocked).toBe(true);
    });

    expect(result.current.vault?.schemaVersion).toBe(2);
    expect(fakeRepository.save).toHaveBeenCalled();
  });

  it('exports and restores an encrypted backup with crisis data', async () => {
    localforageState.crisisData = {
      copingPhrase: 'Stay here. One breath at a time.',
      contacts: [{ id: '1', name: 'Alex', phone: '555-0101' }]
    };

    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.createVault('Junior', 'secret-pass', 'anxiety', 'es');
    });

    let backup: string | null = null;

    await act(async () => {
      const exported = await result.current.createBackupArtifact();
      expect(exported.ok).toBe(true);
      if (exported.ok) {
        backup = exported.artifact.content;
      }
    });

    expect(backup).toContain('lumina.portable-backup');
    expect(JSON.parse(backup!).version).toBe(2);

    await act(async () => {
      await result.current.wipeAllData();
    });

    localforageState.crisisData = null;

    await act(async () => {
      const imported = await result.current.importBackup(backup!, 'secret-pass');
      expect(imported.ok).toBe(true);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.vault?.profile.name).toBe('Junior');
    expect(result.current.vault?.profile.language).toBe('es');
    expect(localforageState.crisisData?.copingPhrase).toBe('Stay here. One breath at a time.');
    expect(fakeLocalforage.setItem).toHaveBeenCalledWith('lumina_crisis_config', expect.any(Object));
  });

  it('accepts portable backup v1 envelopes for compatibility', async () => {
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.createVault('Legacy Portable', 'secret-pass', 'unspecified', 'en');
    });

    let backup = '';
    await act(async () => {
      const exported = await result.current.createBackupArtifact();
      expect(exported.ok).toBe(true);
      if (exported.ok) {
        const envelope = JSON.parse(exported.artifact.content) as { version: number };
        envelope.version = 1;
        backup = JSON.stringify(envelope);
      }
    });

    await act(async () => {
      await result.current.wipeAllData();
    });

    await act(async () => {
      const imported = await result.current.importBackup(backup, 'secret-pass');
      expect(imported.ok).toBe(true);
    });

    expect(result.current.vault?.profile.name).toBe('Legacy Portable');
    expect(result.current.vault?.schemaVersion).toBe(2);
  });

  it('creates a reusable backup artifact for local download or native export', async () => {
    const { result } = renderHook(() => useVault());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.createVault('Artifact User', 'secret-pass', 'unspecified', 'en');
    });

    let artifact: { filename: string; mimeType: string; content: string; exportedAt: string } | null = null;
    await act(async () => {
      const exported = await result.current.createBackupArtifact();
      expect(exported.ok).toBe(true);
      if (exported.ok) {
        artifact = exported.artifact;
      }
    });

    expect(artifact?.filename).toMatch(/^lumina-backup-.*\.json$/);
    expect(artifact?.mimeType).toBe('application/json');
    expect(artifact?.content).toContain('lumina.portable-backup');
    expect(result.current.lastBackupAt).toBe(artifact?.exportedAt ?? null);
    expect(window.localStorage.getItem('lumina_backup_metadata_v1')).toContain('lastBackupAt');
  });
});
