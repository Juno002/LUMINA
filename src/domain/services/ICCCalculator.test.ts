import { describe, it, expect } from 'vitest';
import { calculateICC } from './ICCCalculator';

describe('ICCCalculator', () => {
  it('calculates excellent change correctly', () => {
    const result = calculateICC(9, 2);
    expect(result.value).toBe(0.7);
    expect(result.label).toBe('excellent');
  });

  it('calculates moderate change correctly', () => {
    const result = calculateICC(8, 4);
    expect(result.value).toBe(0.4);
    expect(result.label).toBe('moderate');
  });

  it('detects needs work when shift is small', () => {
    const result = calculateICC(6, 4);
    expect(result.value).toBe(0.2);
    expect(result.label).toBe('needs_work');
  });

  it('clumps values between 0 and 1', () => {
    // If credibility somehow increased
    expect(calculateICC(5, 8).value).toBe(0);
    // Max shift
    expect(calculateICC(10, 0).value).toBe(1);
  });
});
