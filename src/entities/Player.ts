import * as THREE from 'three';
import { COLORS, CONVERGENCE } from '../core/Constants.js';
import { PlayerAssets } from '../assets/PlayerAssets.js';
import { eventBus, GameEvent } from '../core/EventBus.js';

export class Player {
  private mesh: THREE.Group;
  private crosshair!: HTMLElement;
  private crosshairOuter!: HTMLElement;
  private crosshairInner!: HTMLElement;
  private crosshairDot!: HTMLElement;
  private aimPosition: THREE.Vector2;
  private convergence: number = 0;
  private targetLocked: boolean = false;

  // Keyboard input - direct control like original
  private keys: Map<string, boolean> = new Map();
  private readonly aimSpeed: number = 1.5;  // Normalized units per second (-1 to +1 range)

  constructor() {
    this.mesh = PlayerAssets.createConvergenceEngine();
    this.mesh.position.set(0, 0, 0);

    this.aimPosition = new THREE.Vector2(0, 0);
    this.setupControls();
    this.createCrosshair();
  }

  private createCrosshair(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    // Crosshair container - positioned by aimPosition
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair-fixed';
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 100;
      transform: translate(-50%, -50%);
    `;

    // Outer ring - expands when locked
    this.crosshairOuter = document.createElement('div');
    this.crosshairOuter.className = 'crosshair-outer';
    this.crosshairOuter.style.cssText = `
      position: absolute;
      left: -25px;
      top: -25px;
      width: 50px;
      height: 50px;
      border: 2px solid #40C0FF;
      border-radius: 50%;
      box-shadow: 0 0 15px #40C0FF, inset 0 0 10px rgba(64, 192, 255, 0.3);
      transition: all 0.12s ease-out;
    `;

    // Inner bracket - shows precision
    this.crosshairInner = document.createElement('div');
    this.crosshairInner.className = 'crosshair-inner';
    this.crosshairInner.style.cssText = `
      position: absolute;
      left: -12px;
      top: -12px;
      width: 24px;
      height: 24px;
      border: 2px solid #FFB000;
      border-radius: 50%;
      box-shadow: 0 0 10px #FFB000;
      transition: all 0.08s ease-out;
    `;

    // Center dot - precise aiming point
    this.crosshairDot = document.createElement('div');
    this.crosshairDot.className = 'crosshair-dot';
    this.crosshairDot.style.cssText = `
      position: absolute;
      left: -3px;
      top: -3px;
      width: 6px;
      height: 6px;
      background: #FFB000;
      border-radius: 50%;
      box-shadow: 0 0 8px #FFB000;
      transition: all 0.08s ease-out;
    `;

    this.crosshair.appendChild(this.crosshairOuter);
    this.crosshair.appendChild(this.crosshairInner);
    this.crosshair.appendChild(this.crosshairDot);
    uiLayer.appendChild(this.crosshair);
  }

  private setupControls(): void {
    // Keyboard controls only - arrow keys and WASD
    document.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });
    document.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  private updateCrosshair(): void {
    if (!this.crosshair) return;

    // Convert normalized aim position to screen pixels from center
    const x = this.aimPosition.x * (window.innerWidth / 2);
    const y = -this.aimPosition.y * (window.innerHeight / 2);

    this.crosshair.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    // Update visual based on convergence state
    if (this.targetLocked) {
      // Locked on target - red, expanded outer, contracted inner
      this.crosshairOuter.style.borderColor = '#FF0040';
      this.crosshairOuter.style.boxShadow = '0 0 25px #FF0040, inset 0 0 15px rgba(255, 0, 64, 0.4)';
      this.crosshairOuter.style.transform = 'scale(1.3)';

      this.crosshairInner.style.borderColor = '#FF0040';
      this.crosshairInner.style.boxShadow = '0 0 15px #FF0040';
      this.crosshairInner.style.transform = 'scale(0.8)';

      this.crosshairDot.style.background = '#FF0040';
      this.crosshairDot.style.boxShadow = '0 0 12px #FF0040';
      this.crosshairDot.style.transform = 'scale(1.5)';
    } else if (this.convergence >= CONVERGENCE.LOCK_THRESHOLD) {
      // Near target - amber, slight expansion
      this.crosshairOuter.style.borderColor = '#FFB000';
      this.crosshairOuter.style.boxShadow = '0 0 20px #FFB000, inset 0 0 10px rgba(255, 176, 0, 0.3)';
      this.crosshairOuter.style.transform = 'scale(1.1)';

      this.crosshairInner.style.borderColor = '#FFB000';
      this.crosshairInner.style.boxShadow = '0 0 12px #FFB000';
      this.crosshairInner.style.transform = 'scale(1)';

      this.crosshairDot.style.background = '#FFB000';
      this.crosshairDot.style.boxShadow = '0 0 10px #FFB000';
      this.crosshairDot.style.transform = 'scale(1.2)';
    } else {
      // No target - blue, default size
      this.crosshairOuter.style.borderColor = '#40C0FF';
      this.crosshairOuter.style.boxShadow = '0 0 15px #40C0FF, inset 0 0 10px rgba(64, 192, 255, 0.3)';
      this.crosshairOuter.style.transform = 'scale(1)';

      this.crosshairInner.style.borderColor = '#FFB000';
      this.crosshairInner.style.boxShadow = '0 0 10px #FFB000';
      this.crosshairInner.style.transform = 'scale(1)';

      this.crosshairDot.style.background = '#FFB000';
      this.crosshairDot.style.boxShadow = '0 0 8px #FFB000';
      this.crosshairDot.style.transform = 'scale(1)';
    }
  }

  update(delta: number): void {
    // Direct position control
    const moveAmt = this.aimSpeed * delta;
    let moved = false;

    if (this.keys.get('ArrowUp') || this.keys.get('KeyW')) {
      this.aimPosition.y = Math.min(1, this.aimPosition.y + moveAmt);
      moved = true;
    }
    if (this.keys.get('ArrowDown') || this.keys.get('KeyS')) {
      this.aimPosition.y = Math.max(-1, this.aimPosition.y - moveAmt);
      moved = true;
    }
    if (this.keys.get('ArrowLeft') || this.keys.get('KeyA')) {
      this.aimPosition.x = Math.max(-1, this.aimPosition.x - moveAmt);
      moved = true;
    }
    if (this.keys.get('ArrowRight') || this.keys.get('KeyD')) {
      this.aimPosition.x = Math.min(1, this.aimPosition.x + moveAmt);
      moved = true;
    }

    // Always emit aim position for convergence checks
    eventBus.emit('player:aim', this.aimPosition.clone());

    // Rotate ship to face aim direction
    const aimAngle = Math.atan2(this.aimPosition.y, this.aimPosition.x);
    this.mesh.rotation.z = aimAngle - Math.PI / 2;

    // Update crosshair visuals every frame
    this.updateCrosshair();

    // Update convergence engine visuals
    PlayerAssets.updateConvergenceEngine(this.mesh, new THREE.Vector3(0, 0, 0), this.convergence);
  }

  setConvergence(convergence: number): void {
    this.convergence = convergence;
    this.updateCrosshair();
  }

  setTargetLocked(locked: boolean): void {
    this.targetLocked = locked;
    this.updateCrosshair();
  }

  getAimPosition(): THREE.Vector2 {
    return this.aimPosition.clone();
  }

  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 0);
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  dispose(): void {
    this.crosshair?.remove();
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
