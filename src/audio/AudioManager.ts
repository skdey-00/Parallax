/**
 * AudioManager - Singleton Web Audio API manager
 * Handles all audio in Parallax with a minimal, procedural aesthetic
 */

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize audio context on first user interaction
   * Required by browser autoplay policies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Low volume for minimal aesthetic
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;
      console.log('[Audio] Initialized');
    } catch (error) {
      console.warn('[Audio] Failed to initialize:', error);
    }
  }

  /**
   * Ensure audio context is running (resumes if suspended)
   */
  async resumeIfNeeded(): Promise<void> {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Get the audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the master gain node
   */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateMasterVolume();
    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateMasterVolume();
  }

  /**
   * Check if audio is muted
   */
  isAudioMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Update master volume based on mute state
   */
  private updateMasterVolume(): void {
    if (!this.masterGain) return;

    const targetVolume = this.isMuted ? 0 : 0.3;
    const currentTime = this.audioContext?.currentTime || 0;

    // Smooth volume transition
    this.masterGain.gain.cancelScheduledValues(currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.1);
  }

  /**
   * Check if audio is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext !== null;
  }

  /**
   * Get current time for scheduling
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Create and connect an oscillator to master output
   */
  createOscillator(type: OscillatorType = 'sine'): OscillatorNode | null {
    if (!this.audioContext || !this.masterGain) return null;

    const osc = this.audioContext.createOscillator();
    osc.type = type;
    return osc;
  }

  /**
   * Create a gain node for volume control
   */
  createGain(): GainNode | null {
    if (!this.audioContext) return null;
    return this.audioContext.createGain();
  }

  /**
   * Create a filter for sound shaping
   */
  createFilter(type: BiquadFilterType = 'lowpass'): BiquadFilterNode | null {
    if (!this.audioContext) return null;
    return this.audioContext.createBiquadFilter();
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
    this.masterGain = null;
    this.isInitialized = false;
  }
}
