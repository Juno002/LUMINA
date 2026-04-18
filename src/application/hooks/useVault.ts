/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Vault } from "../../domain/entities";
import { vaultRepository } from "../../infrastructure/repositories/LocalForageVaultRepository";

/**
 * useVault Hook (Application Layer)
 * Bridges the UI and the domain/infrastructure.
 */
export function useVault() {
  const [vault, setVaultState] = useState<Vault | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const v = await vaultRepository.load();
      setVaultState(v);
      setIsReady(true);
    };
    init();
  }, []);

  const updateVault = (newVault: Vault) => {
    setVaultState(newVault);
    vaultRepository.save(newVault);
  };

  const initializeUser = (name: string) => {
    if (!vault) return;
    const initialVault: Vault = {
      ...vault,
      profile: { ...vault.profile, name, initialized: true }
    };
    updateVault(initialVault);
  };

  const wipeAllData = async () => {
    const success = await vaultRepository.wipe();
    if (success) {
      window.location.reload();
    }
  };

  return {
    vault,
    isReady,
    updateVault,
    initializeUser,
    wipeAllData
  };
}
