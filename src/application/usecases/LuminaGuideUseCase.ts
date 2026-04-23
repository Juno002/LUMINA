/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnboardingState } from '../../domain/entities';

export const LUMINA_GUIDE_STEPS = [
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
  'vault',
  'forge'
] as const;

export type LuminaGuideStepId = typeof LUMINA_GUIDE_STEPS[number];

export const DEFAULT_ONBOARDING_STEP: LuminaGuideStepId = 'sanctuary';

const terminalStatuses: OnboardingState['status'][] = ['completed', 'skipped', 'paused'];

function uniqueGuideSteps(steps: string[] = []): LuminaGuideStepId[] {
  return steps.filter((step, index): step is LuminaGuideStepId => (
    LUMINA_GUIDE_STEPS.includes(step as LuminaGuideStepId) && steps.indexOf(step) === index
  ));
}

function getNextUncompletedStep(completedSteps: string[] = []): LuminaGuideStepId {
  const completed = new Set(uniqueGuideSteps(completedSteps));
  return LUMINA_GUIDE_STEPS.find((step) => !completed.has(step)) || DEFAULT_ONBOARDING_STEP;
}

function isGuideComplete(completedSteps: string[] = []): boolean {
  const completed = new Set(uniqueGuideSteps(completedSteps));
  return LUMINA_GUIDE_STEPS.every((step) => completed.has(step));
}

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
    completedSteps: uniqueGuideSteps(state.completedSteps),
    lastShownAt: state.lastShownAt
  };
}

export function startOnboarding(state?: OnboardingState): OnboardingState {
  const normalized = normalizeOnboardingState(state);
  const nextStep = normalized.status === 'completed' || normalized.status === 'skipped'
    ? DEFAULT_ONBOARDING_STEP
    : normalized.completedSteps.includes(normalized.currentStep)
      ? getNextUncompletedStep(normalized.completedSteps)
      : normalized.currentStep;

  return {
    ...normalized,
    status: 'active',
    currentStep: nextStep,
    completedSteps: normalized.status === 'completed' || normalized.status === 'skipped' ? [] : normalized.completedSteps,
    lastShownAt: new Date().toISOString()
  };
}

export function shouldShowGuideStep(state: OnboardingState | undefined, step: LuminaGuideStepId): boolean {
  const normalized = normalizeOnboardingState(state);
  return !terminalStatuses.includes(normalized.status) && !normalized.completedSteps.includes(step);
}

export function showGuideStep(state: OnboardingState | undefined, step: LuminaGuideStepId): OnboardingState {
  const normalized = normalizeOnboardingState(state);
  return {
    ...normalized,
    status: 'active',
    currentStep: step,
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

export function completeGuideStep(state?: OnboardingState): OnboardingState {
  const normalized = normalizeOnboardingState(state);
  const completedSteps = normalized.completedSteps.includes(normalized.currentStep)
    ? normalized.completedSteps
    : [...normalized.completedSteps, normalized.currentStep];

  if (isGuideComplete(completedSteps)) {
    return completeOnboarding({ ...normalized, completedSteps });
  }

  return {
    ...normalized,
    status: 'not_started',
    currentStep: getNextUncompletedStep(completedSteps),
    completedSteps,
    lastShownAt: new Date().toISOString()
  };
}

export function advanceOnboarding(state?: OnboardingState): OnboardingState {
  return completeGuideStep(state);
}

export function resetOnboarding(): OnboardingState {
  return createOnboardingState('active');
}
