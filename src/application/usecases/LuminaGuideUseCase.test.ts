/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  completeGuideStep,
  completeOnboarding,
  createOnboardingState,
  normalizeOnboardingState,
  pauseOnboarding,
  resetOnboarding,
  shouldShowGuideStep,
  showGuideStep,
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

  it('marks section tour steps as seen without forcing the next section', () => {
    const state = completeGuideStep({ status: 'active', currentStep: 'sanctuary', completedSteps: [] });
    expect(state.status).toBe('not_started');
    expect(state.currentStep).toBe('chronicle');
    expect(state.completedSteps).toContain('sanctuary');
  });

  it('shows first-visit steps unless the guide is paused, skipped, completed, or already seen', () => {
    expect(shouldShowGuideStep(undefined, 'sanctuary')).toBe(true);
    expect(shouldShowGuideStep({ status: 'not_started', currentStep: 'sanctuary', completedSteps: ['sanctuary'] }, 'sanctuary')).toBe(false);
    expect(shouldShowGuideStep({ status: 'paused', currentStep: 'sanctuary', completedSteps: [] }, 'sanctuary')).toBe(false);

    const state = showGuideStep(undefined, 'forge');
    expect(state.status).toBe('active');
    expect(state.currentStep).toBe('forge');
  });

  it('completes when every section has been seen', () => {
    const done = completeGuideStep({
      status: 'active',
      currentStep: 'forge',
      completedSteps: [
        'sanctuary',
        'chronicle',
        'architecture',
        'emotionalFlux',
        'facing',
        'momentum',
        'breathe',
        'fortress',
        'nightfall',
        'resilience',
        'vault'
      ]
    });
    expect(done.status).toBe('completed');
    expect(done.completedSteps).toContain('forge');
  });

  it('pauses, skips, completes, and resets explicitly', () => {
    expect(pauseOnboarding().status).toBe('paused');
    expect(skipOnboarding().status).toBe('skipped');
    expect(completeOnboarding().status).toBe('completed');
    expect(resetOnboarding().status).toBe('active');
  });
});
