import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { COLORS } from '../core/Constants.js';

export interface HazardSpawn {
  id: string;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  size: number;
  damage: number;
}

export class HazardSystem {
  private scene: THREE.Scene;
  private hazards: Map<string, HazardSpawn> = new Map();
  private nextId: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 3; // Spawn every 3 seconds
  private maxHazards: number = 8;
  private enabled: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.GAME_START, () => {
      this.enabled = true;
    });

    eventBus.on(GameEvent.GAME_OVER, () => {
      this.enabled = false;
      this.clear();
    });

    eventBus.on(GameEvent.WAVE_START, (config: any) => {
      // Enable hazards starting from wave 2
      if (config.waveNumber >= 2) {
        this.enabled = true;
      }
    });
  }

  /**
   * Update hazards
   */
  update(delta: number): void {
    if (!this.enabled) return;

    // Spawn new hazards
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.hazards.size < this.maxHazards) {
      this.spawnHazard();
      this.spawnTimer = this.spawnInterval;
    }

    // Update existing hazards
    const toRemove: string[] = [];
    for (const [id, hazard] of this.hazards) {
      // Move hazard
      hazard.mesh.position.add(
        hazard.velocity.clone().multiplyScalar(delta)
      );

      // Rotate hazard
      hazard.mesh.rotation.x += hazard.rotationSpeed.x * delta;
      hazard.mesh.rotation.y += hazard.rotationSpeed.y * delta;
      hazard.mesh.rotation.z += hazard.rotationSpeed.z * delta;

      // Remove if out of bounds
      const pos = hazard.mesh.position;
      if (pos.z > 100 || pos.z < -250 || Math.abs(pos.x) > 150 || Math.abs(pos.y) > 100) {
        toRemove.push(id);
      }
    }

    // Remove off-screen hazards
    for (const id of toRemove) {
      this.removeHazard(id);
    }
  }

  /**
   * Spawn a new hazard
   */
  private spawnHazard(): void {
    const id = `hazard_${this.nextId++}`;

    // Random size
    const size = 5 + Math.random() * 15;

    // Random position (far in depth, random XY)
    const x = (Math.random() - 0.5) * 120;
    const y = (Math.random() - 0.5) * 80;
    const z = -150 - Math.random() * 50;

    // Velocity toward camera
    const speed = 20 + Math.random() * 30;
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      speed
    );

    // Random rotation speed
    const rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    // Create mesh
    const geometry = new THREE.DodecahedronGeometry(size, 0);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    // Add inner solid core
    const coreGeom = new THREE.DodecahedronGeometry(size * 0.5, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: COLORS.THREAT_RED,
      transparent: true,
      opacity: 0.3
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    mesh.add(core);

    this.scene.add(mesh);

    const hazard: HazardSpawn = {
      id,
      mesh,
      velocity,
      rotationSpeed,
      size,
      damage: 1
    };

    this.hazards.set(id, hazard);
  }

  /**
   * Remove a hazard
   */
  private removeHazard(id: string): void {
    const hazard = this.hazards.get(id);
    if (hazard) {
      this.scene.remove(hazard.mesh);

      // Dispose main mesh
      hazard.mesh.geometry.dispose();
      (hazard.mesh.material as THREE.Material).dispose();

      // Dispose child meshes (inner core)
      hazard.mesh.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });

      this.hazards.delete(id);
    }
  }

  /**
   * Check collision with player position
   */
  checkCollision(playerPos: THREE.Vector3): boolean {
    for (const [id, hazard] of this.hazards) {
      const distance = playerPos.distanceTo(hazard.mesh.position);
      if (distance < hazard.size) {
        // Collision!
        this.removeHazard(id);
        return true;
      }
    }
    return false;
  }

  /**
   * Destroy a hazard (for weapon effects)
   */
  destroyHazard(id: string): void {
    this.removeHazard(id);
  }

  /**
   * Get all hazard positions for convergence checking
   */
  getHazardPositions(): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();
    for (const [id, hazard] of this.hazards) {
      positions.set(id, hazard.mesh.position.clone());
    }
    return positions;
  }

  /**
   * Clear all hazards
   */
  clear(): void {
    for (const id of this.hazards.keys()) {
      this.removeHazard(id);
    }
  }

  /**
   * Enable/disable spawning
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  dispose(): void {
    this.clear();
  }
}
