import { useReducedMotion } from 'motion/react';
import { isNativeApp } from '../../infrastructure/platform/RuntimePlatform';
import { usePageVisibility } from './usePageVisibility';

export function useChartPerformance() {
  const prefersReducedMotion = useReducedMotion();
  const isPageVisible = usePageVisibility();
  const nativeEnvironment = isNativeApp();

  return {
    isPageVisible,
    nativeEnvironment,
    resizeDebounceMs: nativeEnvironment ? 160 : 0,
    shouldAnimateCharts: !nativeEnvironment && !prefersReducedMotion && isPageVisible
  };
}
