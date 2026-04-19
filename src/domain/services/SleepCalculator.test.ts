/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { calculateSleepMetrics } from './SleepCalculator';

describe('SleepCalculator', () => {
  it('should calculate metrics correctly for a standard night', () => {
    // 23:00 to 07:00 = 8 hours (480 mins)
    // 15 mins latency, 10 mins awake during night
    const result = calculateSleepMetrics('23:00', '07:00', 15, 10);
    
    expect(result.timeInBedMin).toBe(480);
    expect(result.timeAsleepMin).toBe(455);
    expect(result.sleepEfficiencyPct).toBe(95); // (455 / 480) * 100 = 94.79 -> 95
  });

  it('should handle same-day sleep (e.g., nap or morning shift)', () => {
    // 01:00 to 09:00 = 8 hours
    const result = calculateSleepMetrics('01:00', '09:00', 30, 0);
    expect(result.timeInBedMin).toBe(480);
    expect(result.timeAsleepMin).toBe(450);
  });

  it('should return 100% efficiency for perfect sleep', () => {
    const result = calculateSleepMetrics('22:00', '06:00', 0, 0);
    expect(result.sleepEfficiencyPct).toBe(100);
  });

  it('should handle cases where latency exceeds time in bed', () => {
    const result = calculateSleepMetrics('23:00', '23:30', 60, 0);
    expect(result.timeAsleepMin).toBe(0);
    expect(result.sleepEfficiencyPct).toBe(0);
  });

  it('should handle invalid input gracefully', () => {
    const result = calculateSleepMetrics('invalid', 'times', 0, 0);
    expect(result.timeInBedMin).toBe(0);
    expect(result.sleepEfficiencyPct).toBe(0);
  });
});
