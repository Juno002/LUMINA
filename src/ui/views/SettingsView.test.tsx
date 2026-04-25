/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsView from './SettingsView';
import { LanguageProvider } from '../../application/contexts/LanguageContext';
import type { Vault } from '../../domain/entities';
import type { BackupArtifact } from '../../application/usecases/BackupArtifact';

const exportBackupArtifactMock = vi.hoisted(() => vi.fn());
const shareBackupArtifactMock = vi.hoisted(() => vi.fn());
const isNativeAppMock = vi.hoisted(() => vi.fn(() => false));
const getBackupTransportLabelMock = vi.hoisted(() => vi.fn(() => 'download'));
const pickNativeBackupImportSourceMock = vi.hoisted(() => vi.fn());
const getBiometricUnlockStateMock = vi.hoisted(() => vi.fn(async () => ({
  supported: false,
  available: false,
  enrolled: false,
  enabled: false
})));
const clearBiometricUnlockMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('../../infrastructure/platform/RuntimePlatform', () => ({
  clearBiometricUnlock: clearBiometricUnlockMock,
  exportBackupArtifact: exportBackupArtifactMock,
  getBiometricUnlockState: getBiometricUnlockStateMock,
  shareBackupArtifact: shareBackupArtifactMock,
  isNativeApp: isNativeAppMock,
  getBackupTransportLabel: getBackupTransportLabelMock,
  pickNativeBackupImportSource: pickNativeBackupImportSourceMock
}));

const baseVault: Vault = {
  profile: {
    name: 'Junior',
    initialized: true,
    soundEnabled: true,
    language: 'en',
    onboarding: { status: 'completed', currentStep: 'vault', completedSteps: ['vault'] }
  },
  createdAt: '2026-04-23T00:00:00.000Z',
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

const artifact: BackupArtifact = {
  filename: 'lumina-backup-2026-04-23_00-00-00Z.json',
  mimeType: 'application/json',
  content: '{"format":"lumina.portable-backup","version":2}',
  exportedAt: '2026-04-23T00:00:00.000Z'
};

function renderSettings(overrideProps: Partial<React.ComponentProps<typeof SettingsView>> = {}) {
  return render(
    <LanguageProvider language="en" onLanguageChange={() => undefined}>
      <SettingsView
        vault={baseVault}
        onUpdate={() => undefined}
        onWipe={() => undefined}
        onLock={() => undefined}
        onChangePassphrase={async () => true}
        onEnableBiometricUnlock={async () => ({ ok: true as const })}
        onCreateBackupArtifact={async () => ({
          ok: true as const,
          artifact
        })}
        onImportBackup={async () => ({ ok: true as const })}
        onOpenCrisis={() => undefined}
        lastBackupAt={null}
        isSaving={false}
        lastSaveError={null}
        onGuideResume={() => undefined}
        onGuideRestart={() => undefined}
        onGuideComplete={() => undefined}
        {...overrideProps}
      />
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

describe('SettingsView', () => {
  beforeEach(() => {
    exportBackupArtifactMock.mockReset();
    shareBackupArtifactMock.mockReset();
    isNativeAppMock.mockReturnValue(false);
    getBackupTransportLabelMock.mockReturnValue('download');
    pickNativeBackupImportSourceMock.mockReset();
    getBiometricUnlockStateMock.mockReset();
    getBiometricUnlockStateMock.mockResolvedValue({
      supported: false,
      available: false,
      enrolled: false,
      enabled: false
    });
    clearBiometricUnlockMock.mockClear();
  });

  it('shows the local encrypted backup flow in web mode and exports through the platform adapter', async () => {
    const createBackupArtifact = vi.fn(async () => ({
      ok: true as const,
      artifact
    }));

    exportBackupArtifactMock.mockResolvedValue({
      method: 'download',
      filename: artifact.filename,
      shared: false
    });

    renderSettings({
      onCreateBackupArtifact: createBackupArtifact,
      lastBackupAt: '2026-04-23T00:00:00.000Z'
    });

    expect(screen.getByText(/^Encrypted Backup$/i)).toBeInTheDocument();
    expect(screen.getByText(/LUMINA keeps backups local/i)).toBeInTheDocument();
    expect(screen.getByText(/^Browser download$/i)).toBeInTheDocument();
    expect(screen.getByText(/Clinical reports are exported without encryption/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Raw Database$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share Backup/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Encrypted Backup/i }));

    await waitFor(() => expect(createBackupArtifact).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(exportBackupArtifactMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/downloaded successfully/i)).toBeInTheDocument();
  });

  it('shows native share controls and warns when wiping without a recorded backup', async () => {
    isNativeAppMock.mockReturnValue(true);
    getBackupTransportLabelMock.mockReturnValue('native');
    getBiometricUnlockStateMock.mockResolvedValue({
      supported: true,
      available: true,
      enrolled: true,
      enabled: false
    });
    const createBackupArtifact = vi.fn(async () => ({
      ok: true as const,
      artifact
    }));
    exportBackupArtifactMock.mockResolvedValue({
      method: 'native-save',
      filename: artifact.filename,
      uri: 'file://lumina-backup.json',
      shared: false
    });
    shareBackupArtifactMock.mockResolvedValue({
      method: 'native-share',
      filename: artifact.filename,
      uri: 'file://lumina-backup.json',
      shared: true
    });

    renderSettings({ onCreateBackupArtifact: createBackupArtifact });

    expect(await screen.findByRole('button', { name: /Enable Biometric Unlock/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share Backup/i })).toBeInTheDocument();
    expect(screen.getAllByText(/No encrypted backup has been recorded on this device yet/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Encrypted Backup/i }));
    expect(await screen.findByLabelText(/^Backup Passphrase$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Backup Passphrase$/i), { target: { value: 'secret-pass' } });
    fireEvent.change(screen.getByLabelText(/Confirm Backup Passphrase/i), { target: { value: 'secret-pass' } });
    fireEvent.click(getButtonByRole(/Encrypted Backup/i, 1));

    await waitFor(() => expect(createBackupArtifact).toHaveBeenCalledWith('secret-pass'));
    await waitFor(() => expect(exportBackupArtifactMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(new RegExp(artifact.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Share Backup/i }));
    await waitFor(() => expect(shareBackupArtifactMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/prepared for native sharing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Execute Wipe Protocol/i }));
    expect(await screen.findAllByText(/No encrypted backup has been recorded on this device yet/i)).not.toHaveLength(0);
  });

  it('enables biometric unlock from settings when secure hardware is available', async () => {
    isNativeAppMock.mockReturnValue(true);
    getBackupTransportLabelMock.mockReturnValue('native');
    getBiometricUnlockStateMock
      .mockResolvedValueOnce({
        supported: true,
        available: true,
        enrolled: true,
        enabled: false
      })
      .mockResolvedValueOnce({
        supported: true,
        available: true,
        enrolled: true,
        enabled: true
      });

    const onEnableBiometricUnlock = vi.fn(async () => ({ ok: true as const }));

    renderSettings({ onEnableBiometricUnlock });

    fireEvent.click(await screen.findByRole('button', { name: /Enable Biometric Unlock/i }));

    await waitFor(() => expect(onEnableBiometricUnlock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/enabled for this device/i)).toBeInTheDocument();
  });

  it('imports native backups through the same vault restore pipeline', async () => {
    isNativeAppMock.mockReturnValue(true);
    getBackupTransportLabelMock.mockReturnValue('native');
    pickNativeBackupImportSourceMock.mockResolvedValue({
      name: 'lumina-backup.json',
      content: '{"format":"lumina.portable-backup","version":2}'
    });
    const onImportBackup = vi.fn(async () => ({ ok: true as const }));

    renderSettings({ onImportBackup });

    fireEvent.click(screen.getByRole('button', { name: /Restore Backup/i }));
    fireEvent.change(screen.getByLabelText(/^Backup Passphrase$/i), { target: { value: 'secret-pass' } });
    fireEvent.click(getButtonByRole(/Restore Backup/i, 1));

    await waitFor(() => expect(pickNativeBackupImportSourceMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onImportBackup).toHaveBeenCalledWith(
      '{"format":"lumina.portable-backup","version":2}',
      'secret-pass'
    ));
    expect(await screen.findByText(/restored successfully/i)).toBeInTheDocument();
  });
});
