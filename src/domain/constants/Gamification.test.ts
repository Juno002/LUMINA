import { describe, it, expect } from 'vitest';
import { getLevelFromXP, getXPForNextLevel } from './Gamification';

describe('Gamification Constants', () => {
  it('calculates levels correctly', () => {
    expect(getLevelFromXP(0)).toBe(1);
    expect(getLevelFromXP(50)).toBe(1);
    expect(getLevelFromXP(100)).toBe(2);
    expect(getLevelFromXP(1000)).toBe(5);
  });

  it('calculates progress to next level correctly', () => {
    // Level 1: 0-100 XP. At 50 XP, progress should be 0.5
    const p1 = getXPForNextLevel(50);
    expect(p1.current).toBe(50);
    expect(p1.needed).toBe(100);
    expect(p1.progress).toBe(0.5);

    // Level 2: 100-250 XP. At 175 XP, progress should be 0.5
    const p2 = getXPForNextLevel(175);
    expect(p2.current).toBe(75); // 175 - 100
    expect(p2.needed).toBe(150); // 250 - 100
    expect(p2.progress).toBe(0.5);
  });

  it('clumps progress between 0 and 1', () => {
    const p = getXPForNextLevel(999999);
    expect(p.progress).toBe(1);
  });
});
