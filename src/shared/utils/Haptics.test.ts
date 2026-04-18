import { describe, it, expect, vi } from 'vitest';
import { triggerHaptic } from './Haptics';

describe('Haptics', () => {
  it('should not throw when navigator.vibrate is missing', () => {
    expect(() => triggerHaptic('light')).not.toThrow();
  });

  it('should call navigator.vibrate when available', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(global.navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true
    });

    triggerHaptic('heavy');
    expect(vibrateMock).toHaveBeenCalled();
  });
});
