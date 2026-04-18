import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { todayISO, formatDate } from './DateFormatter';

describe('DateFormatter', () => {
  beforeAll(() => {
    // Mock system time to a fixed date
    const mockDate = new Date('2026-04-18T12:30:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return ISO string for today', () => {
    expect(todayISO()).toBe('2026-04-18');
  });

  it('should format date correctly', () => {
    expect(formatDate('2026-04-18T12:00:00Z')).toMatch(/April 18, 2026/); // Simple match
  });
});
