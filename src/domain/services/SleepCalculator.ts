/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates clinical sleep metrics based on raw time data.
 */
export function calculateSleepMetrics(
  bedTime: string, 
  wakeTime: string, 
  latencyMin: number, 
  awakeMinutes: number
): {
  timeInBedMin: number;
  timeAsleepMin: number;
  sleepEfficiencyPct: number;
} {
  // Parse HH:mm to minutes since midnight
  const [bH, bM] = bedTime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  
  if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) {
    return { timeInBedMin: 0, timeAsleepMin: 0, sleepEfficiencyPct: 0 };
  }

  const bedMinTotal = bH * 60 + bM;
  let wakeMinTotal = wH * 60 + wM;
  
  // Handle crossing midnight (e.g., 23:00 to 07:00)
  if (wakeMinTotal <= bedMinTotal) {
    wakeMinTotal += 24 * 60;
  }
  
  const timeInBedMin = wakeMinTotal - bedMinTotal;
  
  // Calculate total sleep time (clamped to 0)
  const timeAsleepMin = Math.max(0, timeInBedMin - latencyMin - awakeMinutes);
  
  // Sleep Efficiency = (Actual Sleep Time / Total Time in Bed) * 100
  const sleepEfficiencyPct = timeInBedMin > 0 
    ? Math.round((timeAsleepMin / timeInBedMin) * 100) 
    : 0;
  
  return { timeInBedMin, timeAsleepMin, sleepEfficiencyPct };
}
