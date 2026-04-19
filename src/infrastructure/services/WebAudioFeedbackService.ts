/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Premium "Crystal" Audio Synthesis Service.
 * Uses Web Audio API to generate subtle, high-fidelity tones without audio assets.
 */
class WebAudioFeedbackService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      // @ts-expect-error - webkitAudioContext is non-standard
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(ctx: AudioContext, frequency: number, duration: number, gainValue: number, startTime: number) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(gainValue, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Single clean "ding" for basic completion.
   */
  async playComplete() {
    if (!this.enabled) return;
    const ctx = await this.ensureContext();
    const now = ctx.currentTime;
    this.playTone(ctx, 880, 0.4, 0.1, now); // A5 note
  }

  /**
   * Ascending crystal chime for significant progress.
   */
  async playSuccess() {
    if (!this.enabled) return;
    const ctx = await this.ensureContext();
    const now = ctx.currentTime;
    // C5 -> E5 -> G5
    this.playTone(ctx, 523.25, 0.5, 0.08, now);
    this.playTone(ctx, 659.25, 0.5, 0.08, now + 0.08);
    this.playTone(ctx, 783.99, 0.5, 0.08, now + 0.16);
  }

  /**
   * Ascending arpeggio with resonance for level-up celebrations.
   */
  async playLevelUp() {
    if (!this.enabled) return;
    const ctx = await this.ensureContext();
    const now = ctx.currentTime;
    // C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      this.playTone(ctx, freq, 0.8, 0.12, now + i * 0.12);
    });
  }

  /**
   * Quick rhythmic double-tap for streaks.
   */
  async playStreak() {
    if (!this.enabled) return;
    const ctx = await this.ensureContext();
    const now = ctx.currentTime;
    this.playTone(ctx, 660, 0.2, 0.06, now);
    this.playTone(ctx, 660, 0.2, 0.06, now + 0.06);
  }
}

export const audioFeedback = new WebAudioFeedbackService();

