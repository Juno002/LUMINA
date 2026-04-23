/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { CryptoService } from './CryptoService';

describe('CryptoService', () => {
  const service = new CryptoService();
  const password = 'test-passphrase-2024';

  it('should encrypt and decrypt a roundtrip successfully', async () => {
    const original = JSON.stringify({ name: 'test', data: [1, 2, 3] });
    const encrypted = await service.encrypt(original, password);

    expect(encrypted.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(encrypted)).toContain('lumina.crypto-envelope');

    const decrypted = await service.decrypt(encrypted, password);
    expect(decrypted).toBe(original);
  });

  it('should return null for wrong password', async () => {
    const original = 'sensitive data';
    const encrypted = await service.encrypt(original, password);
    const decrypted = await service.decrypt(encrypted, 'wrong-password');
    expect(decrypted).toBeNull();
  });

  it('should produce different ciphertexts for same input (random salt/iv)', async () => {
    const original = 'identical plaintext';
    const encrypted1 = await service.encrypt(original, password);
    const encrypted2 = await service.encrypt(original, password);

    const buf1 = new Uint8Array(encrypted1);
    const buf2 = new Uint8Array(encrypted2);

    // Different salts → different ciphertexts
    const areDifferent = buf1.some((byte, i) => byte !== buf2[i]);
    expect(areDifferent).toBe(true);
  });

  it('should handle empty string', async () => {
    const encrypted = await service.encrypt('', password);
    const decrypted = await service.decrypt(encrypted, password);
    expect(decrypted).toBe('');
  });

  it('should return null for malformed data', async () => {
    const garbage = new ArrayBuffer(5); // Too short to be valid
    const decrypted = await service.decrypt(garbage, password);
    expect(decrypted).toBeNull();
  });
});
