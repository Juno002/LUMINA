/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getReflejoState } from './ReflejoEngine';

describe('ReflejoEngine', () => {
  it('returns anchor mode when intensity is very high', () => {
    const state = getReflejoState({
      avgICC: 0.8,
      currentIntensity: 9,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1
    });
    expect(state.mode).toBe('anchor');
    expect(state.animation).toBe('pulse-slow');
  });

  it('returns anchor mode when rumination is detected', () => {
    const state = getReflejoState({
      avgICC: 0.8,
      currentIntensity: 4,
      isCrisis: false,
      isRumination: true,
      totalEntries: 10,
      todayEntries: 1
    });
    expect(state.mode).toBe('anchor');
  });

  it('returns mentor mode when ICC is high and intensity is low', () => {
    const state = getReflejoState({
      avgICC: 0.75,
      currentIntensity: 3,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1
    });
    expect(state.mode).toBe('mentor');
    expect(state.animation).toBe('float');
  });

  it('returns observer mode by default', () => {
    const state = getReflejoState({
      avgICC: 0.5,
      currentIntensity: 5,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 2 // Second entry, so no mentor welcome back
    });
    expect(state.mode).toBe('observer');
    expect(state.animation).toBe('neutral');
  });

  it('prioritizes anchor over mentor', () => {
    const state = getReflejoState({
      avgICC: 0.9, // Very high ICC
      currentIntensity: 8, // But high intensity right now
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1
    });
    expect(state.mode).toBe('anchor');
  });
});
