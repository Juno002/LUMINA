/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LockScreenView from './LockScreenView';
import { LanguageProvider } from '../../application/contexts/LanguageContext';

const getBiometricUnlockStateMock = vi.hoisted(() => vi.fn());
const unlockVaultWithBiometricsMock = vi.hoisted(() => vi.fn());
const clearBiometricUnlockMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('../../infrastructure/platform/RuntimePlatform', () => ({
  clearBiometricUnlock: clearBiometricUnlockMock,
  getBiometricUnlockState: getBiometricUnlockStateMock,
  unlockVaultWithBiometrics: unlockVaultWithBiometricsMock
}));

function renderLockScreen(onUnlock = vi.fn(async () => true)) {
  render(
    <LanguageProvider language="en" onLanguageChange={() => undefined}>
      <LockScreenView
        onUnlock={onUnlock}
        error={false}
        onOpenCrisis={() => undefined}
      />
    </LanguageProvider>
  );

  return { onUnlock };
}

describe('LockScreenView', () => {
  beforeEach(() => {
    getBiometricUnlockStateMock.mockReset();
    unlockVaultWithBiometricsMock.mockReset();
    clearBiometricUnlockMock.mockClear();
  });

  it('auto-prompts biometric unlock when a sealed passphrase is available', async () => {
    getBiometricUnlockStateMock.mockResolvedValue({
      supported: true,
      available: true,
      enrolled: true,
      enabled: true
    });
    unlockVaultWithBiometricsMock.mockResolvedValue({
      ok: true,
      passphrase: 'secret-pass'
    });

    const { onUnlock } = renderLockScreen();

    await waitFor(() => expect(unlockVaultWithBiometricsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onUnlock).toHaveBeenCalledWith('secret-pass'));
    expect(await screen.findByRole('button', { name: /Unlock with Biometrics/i })).toBeInTheDocument();
  });
});
