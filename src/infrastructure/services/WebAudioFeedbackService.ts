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

  private initContext() {
    if (!this.ctx) {
      // @ts-expect-error - webkitAudioContext is non-standard
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, gainValue: number, startTime: number) {
    if (!this.enabled || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(gainValue, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Single clean "ding" for basic completion.
   */
  playComplete() {
    this.initContext();
    const now = this.ctx!.currentTime;
    this.playTone(880, 0.4, 0.1, now); // A5 note
  }

  /**
   * Ascending crystal chime for significant progress.
   */
  playSuccess() {
    this.initContext();
    const now = this.ctx!.currentTime;
    // C5 -> E5 -> G5
    this.playTone(523.25, 0.5, 0.08, now);
    this.playTone(659.25, 0.5, 0.08, now + 0.08);
    this.playTone(783.99, 0.5, 0.08, now + 0.16);
  }

  /**
   * Ascending arpeggio with resonance for level-up celebrations.
   */
  playLevelUp() {
    this.initContext();
    const now = this.ctx!.currentTime;
    // C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.8, 0.12, now + i * 0.12);
    });
  }

  /**
   * Quick rhythmic double-tap for streaks.
   */
  playStreak() {
    this.initContext();
    const now = this.ctx!.currentTime;
    this.playTone(660, 0.2, 0.06, now);
    this.playTone(660, 0.2, 0.06, now + 0.06);
  }
}

export const audioFeedback = new WebAudioFeedbackService();
