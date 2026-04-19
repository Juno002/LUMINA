/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vault } from '../entities';

export interface IVaultRepository {
  save(data: Vault, password: string): Promise<boolean>;
  load(password: string): Promise<Vault | null>;
  exists(): Promise<boolean>;
  wipe(): Promise<boolean>;
}
