/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Encrypted Vault Repository.
 * Acts as a "pasamanos": receives data → passes through CryptoService → stores noise.
 * The rest of the app has no idea data is encrypted.
 */

import localforage from 'localforage';
import { Vault, RecurrencePattern } from '../../domain/entities';
import { IVaultRepository } from '../../domain/repositories/IVaultRepository';
import { cryptoService } from '../services/CryptoService';

const DEFAULT_VAULT: Vault = {
  profile: { name: '', initialized: false, soundEnabled: true },
  createdAt: new Date().toISOString(),
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
  }
};

const VAULT_KEY = 'encrypted_vault_data';

localforage.config({
  name: 'lumina_vault',
  storeName: 'app_data'
});

export class LocalForageVaultRepository implements IVaultRepository {
  async save(data: Vault, password: string): Promise<boolean> {
    try {
      const json = JSON.stringify(data);
      const encrypted = await cryptoService.encrypt(json, password);
      await localforage.setItem(VAULT_KEY, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to save vault:', error);
      return false;
    }
  }

  async load(password: string): Promise<Vault | null> {
    try {
      const encrypted = await localforage.getItem<ArrayBuffer>(VAULT_KEY);
      if (!encrypted) return null;

      const json = await cryptoService.decrypt(encrypted, password);
      if (json === null) return null; // Wrong password

      const data = JSON.parse(json) as Partial<Vault>;

      // Migration / Field Patching — ensure all fields exist
      const migrated: Vault = {
        ...DEFAULT_VAULT,
        ...data,
        wellness: {
          ...DEFAULT_VAULT.wellness,
          ...data.wellness
        },
        goals: (data.goals || []).map(g => ({
          recurrence: 'none' as RecurrencePattern,
          ...g
        })),
        journal: (data.journal || []).map(entry => ({
          ...entry,
          level: entry.level || 1,
          intensity: entry.intensity > 10 ? Math.round(entry.intensity / 10) : entry.intensity,
          outcomeIntensity: (entry.outcomeIntensity || 0) > 10 ? Math.round(entry.outcomeIntensity / 10) : (entry.outcomeIntensity || 0)
        }))
      };

      return migrated;
    } catch (error) {
      console.error('Failed to load vault:', error);
      return null;
    }
  }

  async exists(): Promise<boolean> {
    try {
      const data = await localforage.getItem(VAULT_KEY);
      return data !== null;
    } catch {
      return false;
    }
  }

  async wipe(): Promise<boolean> {
    try {
      await localforage.clear();
      return true;
    } catch (error) {
      console.error('Failed to wipe vault:', error);
      return false;
    }
  }
}

export const vaultRepository = new LocalForageVaultRepository();
