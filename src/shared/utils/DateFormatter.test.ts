import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { todayISO, formatDate, toLocalISODate, parseLocalISODate, shiftLocalISODate } from './DateFormatter';

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

  it('should format YYYY-MM-DD date correctly', () => {
    expect(formatDate('2026-04-18')).toMatch(/April 18, 2026/);
  });

  it('should convert Date to local ISO string', () => {
    const date = new Date(2026, 3, 18); // April 18, 2026 (month is 0-indexed)
    expect(toLocalISODate(date)).toBe('2026-04-18');
  });

  it('should pad single-digit months and days', () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(toLocalISODate(date)).toBe('2026-01-05');
  });

  it('should parse ISO dates in local time without shifting the day', () => {
    const parsed = parseLocalISODate('2026-04-18');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(3);
    expect(parsed.getDate()).toBe(18);
    expect(parsed.getHours()).toBe(12);
  });

  it('should shift local ISO dates across month boundaries', () => {
    expect(shiftLocalISODate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalISODate('2026-12-31', 1)).toBe('2027-01-01');
  });
});
