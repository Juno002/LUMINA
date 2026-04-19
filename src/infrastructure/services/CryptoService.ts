/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AES-GCM + PBKDF2 implementation using the Web Crypto API.
 * Based on docs/idea/idea 2/src/lib/client-crypto.ts
 *
 * Zero external dependencies. Browser-native. < 50ms decryption.
 * Blob format: salt(16) + iv(12) + ciphertext
 */

import { ICryptoService } from '../../domain/contracts/ICryptoService';

const SALT_LEN = 16;
const IV_LEN = 12;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LEN = 256;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.slice(), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

export class CryptoService implements ICryptoService {
  async encrypt(plainText: string, password: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const plainBuffer = encoder.encode(plainText);

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plainBuffer
    );

    // Package: salt(16) + iv(12) + ciphertext
    const combined = new Uint8Array(SALT_LEN + IV_LEN + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LEN);
    combined.set(new Uint8Array(ciphertext), SALT_LEN + IV_LEN);

    return combined.buffer;
  }

  async decrypt(cipherData: ArrayBuffer, password: string): Promise<string | null> {
    try {
      const buffer = new Uint8Array(cipherData);
      if (buffer.length < SALT_LEN + IV_LEN + 1) return null;

      const salt = buffer.slice(0, SALT_LEN);
      const iv = buffer.slice(SALT_LEN, SALT_LEN + IV_LEN);
      const ciphertext = buffer.slice(SALT_LEN + IV_LEN);

      const key = await deriveKey(password, salt);
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(plainBuffer);
    } catch {
      // Wrong password → AES-GCM authentication tag mismatch
      return null;
    }
  }
}

export const cryptoService = new CryptoService();
