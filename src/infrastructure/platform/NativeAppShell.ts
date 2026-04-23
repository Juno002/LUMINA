/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { getRuntimePlatform, isNativeApp } from './RuntimePlatform';

let isInitialized = false;

function setKeyboardOffset(value: number) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty('--lumina-keyboard-offset', `${value}px`);
}

export async function initializeNativeAppShell() {
  if (typeof document === 'undefined') {
    return;
  }

  const runtimePlatform = getRuntimePlatform();
  document.documentElement.dataset.platform = runtimePlatform;
  document.documentElement.dataset.nativeApp = String(isNativeApp());
  setKeyboardOffset(0);

  if (!isNativeApp() || isInitialized) {
    return;
  }

  isInitialized = true;

  try {
    await StatusBar.setStyle({ style: Style.Default });
    if (runtimePlatform === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    // Native chrome adjustments are best-effort polish.
  }

  try {
    await Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      setKeyboardOffset(keyboardHeight);
    });
    await Keyboard.addListener('keyboardDidShow', ({ keyboardHeight }) => {
      setKeyboardOffset(keyboardHeight);
    });
    await Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardOffset(0);
    });
    await Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOffset(0);
    });
  } catch {
    // Keyboard listeners are optional.
  }
}
