/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnboardingState } from '../../domain/entities';

export const LUMINA_GUIDE_STEPS = ['sanctuary', 'forge', 'architecture', 'chronicle', 'vault'] as const;

export type LuminaGuideStepId = typeof LUMINA_GUIDE_STEPS[number];

export const DEFAULT_ONBOARDING_STEP: LuminaGuideStepId = 'sanctuary';

export function createOnboardingState(status: OnboardingState['status'] = 'not_started'): OnboardingState {
  return {
    status,
    currentStep: DEFAULT_ONBOARDING_STEP,
    completedSteps: [],
    lastShownAt: new Date().toISOString()
  };
}

export function normalizeOnboardingState(state?: OnboardingState): OnboardingState {
  if (!state) {
    return createOnboardingState('not_started');
  }

  const currentStep = LUMINA_GUIDE_STEPS.includes(state.currentStep as LuminaGuideStepId)
    ? state.currentStep
    : DEFAULT_ONBOARDING_STEP;

  return {
    status: state.status,
    currentStep,
    completedSteps: state.completedSteps || [],
    lastShownAt: state.lastShownAt
  };
}

export function startOnboarding(state?: OnboardingState): OnboardingState {
  const normalized = normalizeOnboardingState(state);
  const nextStep = normalized.status === 'completed' || normalized.status === 'skipped'
    ? DEFAULT_ONBOARDING_STEP
    : normalized.currentStep;

  return {
    ...normalized,
    status: 'active',
    currentStep: nextStep,
    lastShownAt: new Date().toISOString()
  };
}

export function pauseOnboarding(state?: OnboardingState): OnboardingState {
  return {
    ...normalizeOnboardingState(state),
    status: 'paused',
    lastShownAt: new Date().toISOString()
  };
}

export function skipOnboarding(state?: OnboardingState): OnboardingState {
  return {
    ...normalizeOnboardingState(state),
    status: 'skipped',
    lastShownAt: new Date().toISOString()
  };
}

export function completeOnboarding(state?: OnboardingState): OnboardingState {
  return {
    ...normalizeOnboardingState(state),
    status: 'completed',
    currentStep: 'vault',
    completedSteps: [...LUMINA_GUIDE_STEPS],
    lastShownAt: new Date().toISOString()
  };
}

export function advanceOnboarding(state?: OnboardingState): OnboardingState {
  const normalized = normalizeOnboardingState(state);
  const currentIndex = LUMINA_GUIDE_STEPS.indexOf(normalized.currentStep as LuminaGuideStepId);
  const completedSteps = normalized.completedSteps.includes(normalized.currentStep)
    ? normalized.completedSteps
    : [...normalized.completedSteps, normalized.currentStep];

  if (currentIndex >= LUMINA_GUIDE_STEPS.length - 1) {
    return completeOnboarding({ ...normalized, completedSteps });
  }

  return {
    ...normalized,
    status: 'active',
    currentStep: LUMINA_GUIDE_STEPS[currentIndex + 1],
    completedSteps,
    lastShownAt: new Date().toISOString()
  };
}

export function resetOnboarding(): OnboardingState {
  return createOnboardingState('active');
}
