import { registerPlugin } from '@capacitor/core';

export interface BiometricUnlockStatusResult {
  supported: boolean;
  available: boolean;
  enrolled: boolean;
  enabled: boolean;
}

export interface EnableBiometricUnlockOptions {
  passphrase: string;
}

export interface UnlockWithBiometricsResult {
  passphrase: string;
}

interface BiometricVaultPlugin {
  getStatus(): Promise<BiometricUnlockStatusResult>;
  enableBiometricUnlock(options: EnableBiometricUnlockOptions): Promise<{ enabled: boolean }>;
  unlockWithBiometrics(): Promise<UnlockWithBiometricsResult>;
  disableBiometricUnlock(): Promise<void>;
}

export const BiometricVault = registerPlugin<BiometricVaultPlugin>('BiometricVault');
