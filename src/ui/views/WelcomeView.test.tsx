/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WelcomeView from './WelcomeView';
import { LanguageProvider } from '../../application/contexts/LanguageContext';
import type { Vault } from '../../domain/entities';

const isNativeAppMock = vi.hoisted(() => vi.fn(() => true));
const pickNativeBackupImportSourceMock = vi.hoisted(() => vi.fn());
const rememberBackupMock = vi.hoisted(() => vi.fn());
const saveVaultMock = vi.hoisted(() => vi.fn());
const setItemMock = vi.hoisted(() => vi.fn(async () => undefined));
const removeItemMock = vi.hoisted(() => vi.fn(async () => undefined));
const restorePortableBackupMock = vi.hoisted(() => vi.fn());

vi.mock('../../infrastructure/platform/RuntimePlatform', () => ({
  isNativeApp: isNativeAppMock,
  pickNativeBackupImportSource: pickNativeBackupImportSourceMock
}));

vi.mock('../../infrastructure/services/BackupMetadataService', () => ({
  backupMetadataService: {
    rememberBackup: rememberBackupMock
  }
}));

vi.mock('../../infrastructure/repositories/LocalForageVaultRepository', () => ({
  vaultRepository: {
    save: saveVaultMock
  }
}));

vi.mock('localforage', () => ({
  default: {
    setItem: setItemMock,
    removeItem: removeItemMock
  }
}));

vi.mock('../../application/usecases/PortableBackup', () => ({
  CRISIS_BACKUP_KEY: 'lumina_crisis_config',
  restorePortableBackup: restorePortableBackupMock
}));

const restoredVault: Vault = {
  profile: {
    name: 'Junior',
    initialized: true,
    soundEnabled: true,
    language: 'en',
    onboarding: { status: 'completed', currentStep: 'vault', completedSteps: ['vault'] }
  },
  createdAt: '2026-04-24T00:00:00.000Z',
  schemaVersion: 3,
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

function renderWelcome() {
  return render(
    <LanguageProvider language="en" onLanguageChange={() => undefined}>
      <WelcomeView onCreateVault={async () => true} />
    </LanguageProvider>
  );
}

function getButtonByRole(label: RegExp, index = 0) {
  const button = screen.getAllByRole('button', { name: label })[index];
  if (!button) {
    throw new Error(`No button found for label ${label}`);
  }
  return button;
}

describe('WelcomeView', () => {
  beforeEach(() => {
    isNativeAppMock.mockReturnValue(true);
    pickNativeBackupImportSourceMock.mockReset();
    rememberBackupMock.mockReset();
    saveVaultMock.mockReset();
    setItemMock.mockReset();
    removeItemMock.mockReset();
    restorePortableBackupMock.mockReset();
  });

  it('restores an encrypted backup from the welcome screen before a vault exists', async () => {
    pickNativeBackupImportSourceMock.mockResolvedValue({
      name: 'lumina-backup.json',
      content: '{"format":"lumina.portable-backup","version":2}'
    });
    restorePortableBackupMock.mockResolvedValue({
      ok: true,
      vault: restoredVault,
      crisisData: {
        copingPhrase: 'Breathe.',
        contacts: [{ id: '1', name: 'Alex', phone: '555-0101' }]
      },
      exportedAt: '2026-04-24T00:00:00.000Z'
    });
    saveVaultMock.mockResolvedValue(true);

    renderWelcome();

    fireEvent.click(screen.getByRole('button', { name: /Restore Backup/i }));

    await waitFor(() => expect(pickNativeBackupImportSourceMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Selected file/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Backup Passphrase$/i), {
      target: { value: 'backup-pass' }
    });
    fireEvent.click(getButtonByRole(/Restore Backup/i, 1));

    await waitFor(() => expect(restorePortableBackupMock).toHaveBeenCalledWith(
      '{"format":"lumina.portable-backup","version":2}',
      'backup-pass'
    ));
    await waitFor(() => expect(saveVaultMock).toHaveBeenCalledWith(restoredVault, 'backup-pass'));
    expect(setItemMock).toHaveBeenCalledWith('lumina_crisis_config', expect.any(Object));
    expect(rememberBackupMock).toHaveBeenCalledWith('2026-04-24T00:00:00.000Z');
  });
});
