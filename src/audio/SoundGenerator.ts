/**
 * SoundGenerator - Procedural sound generation using Web Audio API
 * Creates all game sound effects with oscillators
 */

import { AudioManager } from './AudioManager.js';

export class SoundGenerator {
  private audioManager: AudioManager;
  private convergenceOsc: OscillatorNode | null = null;
  private convergenceGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private whiteNoiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Start the convergence tone - rises as convergence increases
   */
  startConvergenceTone(): void {
    if (!this.audioManager.isReady()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    // Create oscillator for convergence tone
    this.convergenceOsc = ctx.createOscillator();
    this.convergenceGain = ctx.createGain();

    this.convergenceOsc.type = 'sine';
    this.convergenceOsc.frequency.value = 200; // Starting pitch

    this.convergenceGain.gain.value = 0;

    this.convergenceOsc.connect(this.convergenceGain!);
    this.convergenceGain.connect(masterGain);
    this.convergenceOsc.start();
  }

  /**
   * Update convergence tone based on convergence value (0-1)
   */
  updateConvergenceTone(convergence: number): void {
    if (!this.audioManager.isReady() || !this.convergenceOsc || !this.convergenceGain) return;

    const ctx = this.audioManager.getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;

    // Pitch maps to convergence percentage: 200Hz to 1000Hz
    const pitch = 200 + (convergence * 800);
    this.convergenceOsc.frequency.linearRampToValueAtTime(pitch, time + 0.1);

    // Volume increases with convergence but stays very subtle
    const volume = Math.min(0.15, convergence * 0.2);
    this.convergenceGain.gain.linearRampToValueAtTime(volume, time + 0.1);
  }

  /**
   * Stop convergence tone
   */
  stopConvergenceTone(): void {
    if (!this.audioManager.isReady() || !this.convergenceOsc) return;

    const ctx = this.audioManager.getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;

    if (this.convergenceGain) {
      this.convergenceGain.gain.linearRampToValueAtTime(0, time + 0.1);
    }

    setTimeout(() => {
      if (this.convergenceOsc) {
        this.convergenceOsc.stop();
        this.convergenceOsc = null;
      }
    }, 100);
  }

  /**
   * Play the convergence "lock" sound when >95% converged
   */
  playLockSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    // Create a clean, high-pitched lock sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.1);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Play enemy kill sound - resonant strike
   */
  playKillSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    // Clean resonant strike - sine wave with quick decay
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.3);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * Play convergence beam firing sound
   */
  playBeamSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    // Brief, sharp beam sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.05);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Play UI click sound
   */
  playClickSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Play wave complete sound
   */
  playWaveCompleteSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    // Subtle confirmation - two tones
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, time); // C5
    osc2.frequency.setValueAtTime(659.25, time + 0.1); // E5

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);

    osc1.start(time);
    osc1.stop(time + 0.4);
    osc2.start(time);
    osc2.stop(time + 0.4);
  }

  /**
   * Start ambient drone - barely perceptible background
   */
  startAmbience(): void {
    if (!this.audioManager.isReady()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    // Stop existing ambience first
    this.stopAmbience();

    // Create drone gain
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.03; // Very quiet
    this.droneGain.connect(masterGain);

    // Two low-frequency oscillators slightly detuned for beating
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.value = 55; // A1
    osc2.frequency.value = 56.5; // Slightly sharp for beating

    osc1.connect(this.droneGain);
    osc2.connect(this.droneGain);

    osc1.start();
    osc2.start();

    this.droneOscs = [osc1, osc2];

    // Add white noise layer
    this.startWhiteNoise();
  }

  /**
   * Start white noise for space static
   */
  private startWhiteNoise(): void {
    if (!this.audioManager.isReady()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.whiteNoiseNode = ctx.createBufferSource();
    this.whiteNoiseNode.buffer = buffer;
    this.whiteNoiseNode.loop = true;

    // Filter to make it subtle
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.008; // Very subtle

    this.whiteNoiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(masterGain);

    this.whiteNoiseNode.start();
  }

  /**
   * Stop ambient drone
   */
  stopAmbience(): void {
    const ctx = this.audioManager.getAudioContext();
    const time = ctx?.currentTime || 0;

    // Stop drone oscillators
    this.droneOscs.forEach(osc => {
      try {
        osc.stop(time + 0.1);
      } catch (e) {
        // Already stopped
      }
    });
    this.droneOscs = [];

    // Stop white noise
    if (this.whiteNoiseNode) {
      try {
        this.whiteNoiseNode.stop(time + 0.1);
      } catch (e) {
        // Already stopped
      }
      this.whiteNoiseNode = null;
    }

    // Fade out gains
    if (this.droneGain) {
      this.droneGain.gain.linearRampToValueAtTime(0, time + 0.1);
    }
    if (this.noiseGain) {
      this.noiseGain.gain.linearRampToValueAtTime(0, time + 0.1);
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopConvergenceTone();
    this.stopAmbience();
  }

  /**
   * Play milestone achievement sound - MAJOR dopamine hit
   */
  playMilestoneSound(): void {
    if (!this.audioManager.isReady() || this.audioManager.isAudioMuted()) return;

    const ctx = this.audioManager.getAudioContext();
    const masterGain = this.audioManager.getMasterGain();
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;

    // Triumphant ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + i * 0.08);

      gain.gain.setValueAtTime(0, time + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, time + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.4);
    });
  }
}
