import * as THREE from 'three';
import { CONVERGENCE } from '../core/Constants.js';
import { ConvergenceData } from '../core/Types.js';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { SoundGenerator } from '../audio/SoundGenerator.js';

export class ConvergenceSystem {
  private camera: THREE.PerspectiveCamera;
  private convergenceData: Map<string, ConvergenceData> = new Map();
  private maxConvergence: number = 0;
  private convergedEnemy: string | null = null;
  private soundGenerator: SoundGenerator;
  private hasPlayedLockSound: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.soundGenerator = new SoundGenerator();
    this.soundGenerator.startConvergenceTone();
  }

  /**
   * Convergence: how close is the crosshair to the enemy?
   * Uses normalized screen coordinates (-1 to +1) for keyboard aiming
   */
  calculateConvergence(
    enemyId: string,
    enemyPosition: THREE.Vector3,
    playerAimPos: THREE.Vector2
  ): ConvergenceData {
    // Project enemy to screen space (-1 to +1)
    const screenPos = enemyPosition.clone().project(this.camera);

    // Calculate distance in normalized screen space
    const distance = Math.sqrt(
      Math.pow(screenPos.x - playerAimPos.x, 2) +
      Math.pow(screenPos.y - playerAimPos.y, 2)
    );

    // Use hit zone from Constants for easier aiming
    const hitZone = CONVERGENCE.HIT_ZONE || 0.35;
    const alignment = Math.max(0, 1 - (distance / hitZone));

    const isConverged = alignment >= CONVERGENCE.THRESHOLD;

    const data: ConvergenceData = {
      enemyId,
      alignment,
      isConverged,
      screenPosition: new THREE.Vector2(screenPos.x, screenPos.y),
      depth: enemyPosition.z
    };

    this.convergenceData.set(enemyId, data);

    // Track max convergence across all enemies
    if (alignment > this.maxConvergence) {
      this.maxConvergence = alignment;
    }

    // Update convergence tone
    this.soundGenerator.updateConvergenceTone(this.maxConvergence);

    // Lock sound when fully converged
    if (alignment >= 0.90 && !this.hasPlayedLockSound) {
      this.soundGenerator.playLockSound();
      this.hasPlayedLockSound = true;
    }

    if (alignment < 0.70) {
      this.hasPlayedLockSound = false;
    }

    // Handle lock state changes
    if (isConverged && this.convergedEnemy !== enemyId) {
      this.convergedEnemy = enemyId;
      eventBus.emit(GameEvent.CONVERGENCE_ACHIEVED, enemyId, alignment);
      eventBus.emit('target:locked', { enemyId, alignment });
    } else if (!isConverged && this.convergedEnemy === enemyId) {
      this.convergedEnemy = null;
      eventBus.emit('target:lost', {});
    }

    // Emit target state for player crosshair (always emit for visual feedback)
    eventBus.emit('target:state', {
      isLocked: isConverged,
      alignment,
      enemyId
    });

    return data;
  }

  getMaxConvergence(): number {
    return this.maxConvergence;
  }

  getConvergedEnemy(): string | null {
    return this.convergedEnemy;
  }

  getConvergenceData(enemyId: string): ConvergenceData | undefined {
    return this.convergenceData.get(enemyId);
  }

  resetMaxConvergence(): void {
    this.maxConvergence = 0;
    this.hasPlayedLockSound = false;
  }

  removeEnemy(enemyId: string): void {
    this.convergenceData.delete(enemyId);
    if (this.convergedEnemy === enemyId) {
      this.convergedEnemy = null;
      eventBus.emit('target:lost', {});
    }
  }

  update(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  dispose(): void {
    this.convergenceData.clear();
    this.soundGenerator.stopConvergenceTone();
    this.soundGenerator.dispose();
  }
}
