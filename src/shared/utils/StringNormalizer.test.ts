import { describe, it, expect } from 'vitest';
import { normalizeText, escapeHtml } from './StringNormalizer';

describe('StringNormalizer', () => {
  it('should lowercase text and remove diacritics', () => {
    expect(normalizeText('MÚSICA Élógica áéíóú')).toBe('musica elogica aeiou');
  });

  it('should escape malicious HTML', () => {
    expect(escapeHtml('<script>alert("XSS & Hack\'s")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS &amp; Hack&#039;s&quot;)&lt;/script&gt;');
  });
});
