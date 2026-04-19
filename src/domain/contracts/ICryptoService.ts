/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contract for encryption/decryption services.
 * Domain layer defines WHAT can be done; Infrastructure implements HOW.
 */
export interface ICryptoService {
  encrypt(plainText: string, password: string): Promise<ArrayBuffer>;
  decrypt(cipherData: ArrayBuffer, password: string): Promise<string | null>;
}
