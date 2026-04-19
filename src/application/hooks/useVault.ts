/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useVault Hook (Application Layer)
 * Bridges the UI and the domain/infrastructure.
 * Manages vault lifecycle: create → unlock → use → auto-lock.
 * Password lives in memory only while vault is open.
 */

import { useState, useEffect, useRef } from 'react';
import { Vault, ClinicalProfile } from '../../domain/entities';
import { vaultRepository } from '../../infrastructure/repositories/LocalForageVaultRepository';

const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keypress', 'touchstart', 'click'] as const;

export function useVault() {
  const [vault, setVaultState] = useState<Vault | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [vaultExists, setVaultExists] = useState(false);
  const [unlockError, setUnlockError] = useState(false);

  // Password stays in memory only while vault is open
  const passwordRef = useRef<string | null>(null);
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Lock function (defined first, used by auto-lock) ---
  const lockVault = () => {
    setVaultState(null);
    setIsLocked(true);
    passwordRef.current = null;
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
      autoLockTimer.current = null;
    }
  };

  // Check if a vault exists on mount
  useEffect(() => {
    const init = async () => {
      const exists = await vaultRepository.exists();
      setVaultExists(exists);
      setIsReady(true);
    };
    init();
  }, []);

  // --- Auto-lock ---
  useEffect(() => {
    if (isLocked || !vault) return;

    const minutes = vault.profile.autoLockMinutes ?? 5;
    const ms = minutes * 60 * 1000;

    const resetTimer = () => {
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
      autoLockTimer.current = setTimeout(() => {
        lockVault();
      }, ms || DEFAULT_AUTO_LOCK_MS);
    };

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer(); // Start timer

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
      if (autoLockTimer.current) clearTimeout(autoLockTimer.current);
    };
  }, [isLocked, vault]);

  // --- Core operations ---
  const unlockVault = async (password: string): Promise<boolean> => {
    setUnlockError(false);
    const loaded = await vaultRepository.load(password);
    if (!loaded) {
      setUnlockError(true);
      return false;
    }
    passwordRef.current = password;
    setVaultState(loaded);
    setIsLocked(false);
    return true;
  };

  const createVault = async (name: string, password: string, clinicalProfile: ClinicalProfile = 'unspecified'): Promise<boolean> => {
    const newVault: Vault = {
      profile: { name, initialized: true, clinicalProfile, soundEnabled: true },
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
      },
      closedDays: []
    };
    const saved = await vaultRepository.save(newVault, password);
    if (saved) {
      passwordRef.current = password;
      setVaultState(newVault);
      setVaultExists(true);
      setIsLocked(false);
    }
    return saved;
  };

  const updateVault = (newVault: Vault) => {
    setVaultState(newVault);
    if (passwordRef.current) {
      vaultRepository.save(newVault, passwordRef.current);
    }
  };

  const wipeAllData = async () => {
    const success = await vaultRepository.wipe();
    if (success) {
      lockVault();
      setVaultExists(false);
    }
  };

  return {
    vault,
    isReady,
    isLocked,
    vaultExists,
    unlockError,
    unlockVault,
    createVault,
    lockVault,
    updateVault,
    wipeAllData
  };
}
