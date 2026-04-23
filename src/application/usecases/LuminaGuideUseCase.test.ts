/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  advanceOnboarding,
  completeOnboarding,
  createOnboardingState,
  normalizeOnboardingState,
  pauseOnboarding,
  resetOnboarding,
  skipOnboarding,
  startOnboarding
} from './LuminaGuideUseCase';

describe('LuminaGuideUseCase', () => {
  it('creates a not-started guide state by default', () => {
    const state = createOnboardingState();
    expect(state.status).toBe('not_started');
    expect(state.currentStep).toBe('sanctuary');
    expect(state.completedSteps).toEqual([]);
  });

  it('normalizes missing state for existing vaults', () => {
    expect(normalizeOnboardingState(undefined).status).toBe('not_started');
  });

  it('starts from the current unfinished step', () => {
    const state = startOnboarding({ status: 'paused', currentStep: 'forge', completedSteps: ['sanctuary'] });
    expect(state.status).toBe('active');
    expect(state.currentStep).toBe('forge');
  });

  it('advances through steps and completes at the end', () => {
    const forge = advanceOnboarding({ status: 'active', currentStep: 'sanctuary', completedSteps: [] });
    expect(forge.currentStep).toBe('forge');
    expect(forge.completedSteps).toContain('sanctuary');

    const done = advanceOnboarding({ status: 'active', currentStep: 'vault', completedSteps: [] });
    expect(done.status).toBe('completed');
    expect(done.completedSteps).toContain('vault');
  });

  it('pauses, skips, completes, and resets explicitly', () => {
    expect(pauseOnboarding().status).toBe('paused');
    expect(skipOnboarding().status).toBe('skipped');
    expect(completeOnboarding().status).toBe('completed');
    expect(resetOnboarding().status).toBe('active');
  });
});
