/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import localforage from 'localforage';
import { Vault, RecurrencePattern } from '../../domain/entities';
import { IVaultRepository } from '../../domain/repositories/IVaultRepository';

// In a real clean architecture, the default state might live in the entity layer or a factory
// but for simplicity we keep it here as a detail of the storage implementation.
const DEFAULT_VAULT: Vault = {
  profile: { name: '', initialized: false },
  createdAt: new Date().toISOString(),
  journal: [],
  exposure: { hierarchy: [], logs: [] },
  activations: [],
  goals: [],
  sleep: [],
  wellness: { gratitudeEntries: [], moodEntries: [] }
};

const VAULT_KEY = 'encrypted_vault_data';

localforage.config({
  name: 'lumina_vault',
  storeName: 'app_data'
});

export class LocalForageVaultRepository implements IVaultRepository {
  async save(data: Vault): Promise<boolean> {
    try {
      await localforage.setItem(VAULT_KEY, data);
      return true;
    } catch (error) {
      console.error('Failed to save vault:', error);
      return false;
    }
  }

  async load(): Promise<Vault> {
    try {
      const data = await localforage.getItem<Vault>(VAULT_KEY);
      if (!data) return DEFAULT_VAULT;

      // Simple Migration / Field Patching
      const migrated = {
        ...DEFAULT_VAULT,
        ...data,
        wellness: {
          ...DEFAULT_VAULT.wellness,
          ...data.wellness
        },
        goals: (data.goals || []).map(g => ({
          recurrence: 'none' as RecurrencePattern,
          ...g
        }))
      };

      return migrated;
    } catch (error) {
      console.error('Failed to load vault:', error);
      return DEFAULT_VAULT;
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
