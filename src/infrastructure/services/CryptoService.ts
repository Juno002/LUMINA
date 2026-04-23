/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AES-GCM + PBKDF2 implementation using the Web Crypto API.
 *
 * V2 blob format: UTF-8 JSON envelope with KDF metadata + base64 payload.
 * Legacy support: salt(16) + iv(12) + ciphertext.
 */

import { ICryptoService } from '../../domain/contracts/ICryptoService';

const SALT_LEN = 16;
const IV_LEN = 12;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LEN = 256;
const CRYPTO_FORMAT = 'lumina.crypto-envelope';
const CRYPTO_VERSION = 2;

interface CryptoEnvelopeV2 {
  format: typeof CRYPTO_FORMAT;
  version: typeof CRYPTO_VERSION;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function isCryptoEnvelopeV2(value: unknown): value is CryptoEnvelopeV2 {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const envelope = value as Partial<CryptoEnvelopeV2>;
  return (
    envelope.format === CRYPTO_FORMAT &&
    envelope.version === CRYPTO_VERSION &&
    envelope.algorithm === 'AES-GCM' &&
    envelope.kdf === 'PBKDF2-SHA256' &&
    envelope.iterations === PBKDF2_ITERATIONS &&
    typeof envelope.salt === 'string' &&
    typeof envelope.iv === 'string' &&
    typeof envelope.ciphertext === 'string'
  );
}

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

    const envelope: CryptoEnvelopeV2 = {
      format: CRYPTO_FORMAT,
      version: CRYPTO_VERSION,
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext))
    };

    const encodedEnvelope = encoder.encode(JSON.stringify(envelope));
    return encodedEnvelope.buffer.slice(
      encodedEnvelope.byteOffset,
      encodedEnvelope.byteOffset + encodedEnvelope.byteLength
    ) as ArrayBuffer;
  }

  async decrypt(cipherData: ArrayBuffer, password: string): Promise<string | null> {
    try {
      const buffer = new Uint8Array(cipherData);
      if (buffer.length < SALT_LEN + IV_LEN + 1) return null;

      const decodedEnvelope = new TextDecoder().decode(buffer);
      try {
        const parsedEnvelope = JSON.parse(decodedEnvelope) as unknown;

        if (isCryptoEnvelopeV2(parsedEnvelope)) {
          const salt = base64ToBytes(parsedEnvelope.salt);
          const iv = base64ToBytes(parsedEnvelope.iv);
          const ciphertext = base64ToBytes(parsedEnvelope.ciphertext);

          if (!salt || !iv || !ciphertext || salt.byteLength !== SALT_LEN || iv.byteLength !== IV_LEN) {
            return null;
          }

          const key = await deriveKey(password, salt);
          const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
          );

          return new TextDecoder().decode(plainBuffer);
        }
      } catch {
        // Not a JSON envelope; continue with legacy binary decoding.
      }

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
