/**
 * MusicGenerator - Procedural music for specific game moments
 * Creates a minimal, unsettling dissonant choir for Act III
 */

import { AudioManager } from './AudioManager.js';

export class MusicGenerator {
  private audioManager: AudioManager;
  private choirOscs: OscillatorNode[] = [];
  private choirGain: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Start Act III dissonant choir
   * Minimal, unsettling - signals Veil's interference
   */
  startActIIIMusic(): void {
    if (!this.audioManager.isReady() || this.isPlaying) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    this.isPlaying = true;

    // Create choir gain node
    this.choirGain = ctx.createGain();
    this.choirGain.gain.value = 0;
    if (masterGain) {
      this.choirGain.connect(masterGain);
    }

    // Fade in
    const fadeInTime = ctx.currentTime + 2;
    this.choirGain.gain.linearRampToValueAtTime(0.08, fadeInTime);

    // Create dissonant choir using multiple oscillators
    // Using slightly detuned frequencies for unsettling harmony
    const baseFreq = 220; // A3

    // Create 6 oscillators for choir effect
    // Frequencies chosen for dissonance (minor seconds, tritones)
    const frequencies = [
      baseFreq,           // A3
      baseFreq * 1.045,   // Bb3 (minor second)
      baseFreq * 1.414,   // Eb4 (tritone)
      baseFreq * 1.498,   // D4 (minor seventh)
      baseFreq * 1.618,   // F#4 (golden ratio - dissonant)
      baseFreq * 2.0      // A4 (octave)
    ];

    frequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      // Use triangle for richer, more vocal-like tone
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Low volume for each voice
      oscGain.gain.value = 0.3;

      // Add slight vibrato for more organic feel
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 4 + Math.random() * 2; // 4-6 Hz
      vibratoGain.gain.value = 3; // Vibrato depth

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start();

      osc.connect(oscGain);
      if (this.choirGain) {
        oscGain.connect(this.choirGain);
      }

      osc.start();
      this.choirOscs.push(osc);
    });

    console.log('[Music] Act III choir started');
  }

  /**
   * Stop Act III music with fade out
   */
  stopActIIIMusic(): void {
    if (!this.isPlaying) return;

    const ctx = this.audioManager.getAudioContext();
    if (!ctx) return;

    const fadeOutTime = ctx.currentTime + 1.5;

    // Fade out
    if (this.choirGain) {
      this.choirGain.gain.linearRampToValueAtTime(0, fadeOutTime);
    }

    // Stop all oscillators after fade
    setTimeout(() => {
      this.choirOscs.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });
      this.choirOscs = [];
      this.isPlaying = false;
      console.log('[Music] Act III choir stopped');
    }, 1500);
  }

  /**
   * Check if music is playing
   */
  isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopActIIIMusic();
  }
}
