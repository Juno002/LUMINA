/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { confetti } from './ConfettiService';
import { triggerSensoryHaptic } from '../platform/RuntimePlatform';

type SensoryEvent = 'tap' | 'intentShift' | 'complete' | 'success' | 'streak' | 'levelUp' | 'undo' | 'error';

class SensoryFeedbackService {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private get prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.ctx) {
      // @ts-expect-error - webkitAudioContext is non-standard
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  private playTone(ctx: AudioContext, frequency: number, duration: number, gainValue: number, startTime: number, type: OscillatorType = 'sine') {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(gainValue, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  private async play(event: SensoryEvent) {
    if (!this.enabled) {
      return;
    }

    const ctx = await this.ensureContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    if (event === 'tap') {
      this.playTone(ctx, 920, 0.045, 0.035, now, 'square');
    } else if (event === 'intentShift') {
      this.playTone(ctx, 620, 0.08, 0.045, now);
      this.playTone(ctx, 820, 0.08, 0.035, now + 0.045);
    } else if (event === 'complete') {
      this.playTone(ctx, 760, 0.12, 0.065, now);
      this.playTone(ctx, 980, 0.1, 0.045, now + 0.07);
    } else if (event === 'success') {
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        this.playTone(ctx, frequency, 0.32, 0.055, now + index * 0.08);
      });
    } else if (event === 'streak') {
      this.playTone(ctx, 700, 0.13, 0.06, now);
      this.playTone(ctx, 880, 0.18, 0.05, now + 0.09, 'triangle');
    } else if (event === 'levelUp') {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        this.playTone(ctx, frequency, 0.46, 0.075, now + index * 0.1);
      });
    } else if (event === 'undo') {
      this.playTone(ctx, 540, 0.1, 0.045, now);
      this.playTone(ctx, 360, 0.12, 0.035, now + 0.07);
    } else if (event === 'error') {
      this.playTone(ctx, 260, 0.16, 0.05, now, 'sawtooth');
    }
  }

  async emit(event: SensoryEvent) {
    if (!this.enabled) {
      return;
    }

    if (!this.prefersReducedMotion) {
      await triggerSensoryHaptic(event);
    }
    await this.play(event);

    if (this.prefersReducedMotion) {
      return;
    }

    if (event === 'streak') {
      confetti.trigger({ particleCount: 24, spread: 52 });
    } else if (event === 'levelUp') {
      confetti.trigger({ particleCount: 40, spread: 70 });
    }
  }

  tap() {
    void this.emit('tap');
  }

  intentShift() {
    void this.emit('intentShift');
  }

  complete() {
    void this.emit('complete');
  }

  success() {
    void this.emit('success');
  }

  streak() {
    void this.emit('streak');
  }

  levelUp() {
    void this.emit('levelUp');
  }

  undo() {
    void this.emit('undo');
  }

  error() {
    void this.emit('error');
  }
}

export const sensoryFeedback = new SensoryFeedbackService();
