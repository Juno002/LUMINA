import { describe, it, expect } from 'vitest';
import { cn } from './TailwindMerge';

describe('TailwindMerge cn()', () => {
  it('should merge tailwind classes properly', () => {
    expect(cn('p-2 text-red-500', 'p-4')).toBe('text-red-500 p-4');
  });

  it('should conditionally merge classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class', !isActive && 'hidden')).toBe('base-class active-class');
  });
});
