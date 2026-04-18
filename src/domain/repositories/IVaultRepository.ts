/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vault } from '../entities';

export interface IVaultRepository {
  save(data: Vault): Promise<boolean>;
  load(): Promise<Vault>;
  wipe(): Promise<boolean>;
}
