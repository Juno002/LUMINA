/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getReflejoState } from './ReflejoEngine';

describe('ReflejoEngine', () => {
  it('returns anchor mode when intensity is very high (scale 1-10)', () => {
    const state = getReflejoState({
      avgICC: 0.8,
      currentIntensity: 9,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1,
      daysSinceLastEntry: 0
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
      todayEntries: 1,
      daysSinceLastEntry: 0
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
      todayEntries: 1,
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('mentor');
    expect(state.animation).toBe('float');
  });

  it('returns observer mode by default', () => {
    const state = getReflejoState({
      avgICC: 0.5,
      currentIntensity: 3,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 2, // Second entry, so no mentor welcome back
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('observer');
    expect(state.animation).toBe('neutral');
  });

  it('prioritizes anchor over mentor when intensity is high', () => {
    const state = getReflejoState({
      avgICC: 0.9, // Very high ICC
      currentIntensity: 8, // But high intensity right now (>= 8 threshold)
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1,
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('anchor');
  });

  it('returns observer mode for ghost protocol when absent >= 4 days', () => {
    const state = getReflejoState({
      avgICC: 0.9,
      currentIntensity: 3,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 0,
      daysSinceLastEntry: 5
    });
    expect(state.mode).toBe('observer');
    expect(state.messageKey).toBe('lambda.ghost_nudge');
  });

  it('returns anchor mode on crisis regardless of other metrics', () => {
    const state = getReflejoState({
      avgICC: 0.9,
      currentIntensity: 2,
      isCrisis: true,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 1,
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('anchor');
    expect(state.messageKey).toBe('lambda.anchor_crisis');
  });

  it('returns anchor mode for low ICC', () => {
    const state = getReflejoState({
      avgICC: 0.2,
      currentIntensity: 3,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 2,
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('anchor');
    expect(state.messageKey).toBe('lambda.anchor_low_icc');
  });

  it('returns observer for moderate intensity (4-7)', () => {
    const state = getReflejoState({
      avgICC: 0.5,
      currentIntensity: 5,
      isCrisis: false,
      isRumination: false,
      totalEntries: 10,
      todayEntries: 2,
      daysSinceLastEntry: 0
    });
    expect(state.mode).toBe('observer');
    expect(state.messageKey).toBe('lambda.observer_moderate');
  });
});
