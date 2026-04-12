import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { COLORS } from '../core/Constants.js';
import { PoolableObject } from '../core/Types.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { SoundGenerator } from '../audio/SoundGenerator.js';

interface Particle extends PoolableObject {
  color: number;
}

export class CombatSystem {
  private particles: ObjectPool<Particle>;
  private canFire: boolean = true;
  private fireCooldown: number = 0.15;
  private cooldownTimer: number = 0;
  private soundGenerator: SoundGenerator;

  constructor(scene: THREE.Scene) {
    this.particles = new ObjectPool<Particle>(
      () => this.createParticle(),
      (obj) => this.resetParticle(obj),
      200,
      500
    );
    this.soundGenerator = new SoundGenerator();
  }

  private createParticle(): Particle {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      transparent: true,
      opacity: 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    return {
      mesh,
      isActive: false,
      velocity: new THREE.Vector3(),
      lifetime: 1,
      color: COLORS.AMBER
    };
  }

  private resetParticle(obj: Particle): void {
    obj.mesh.position.set(0, 0, 0);
    obj.velocity.set(0, 0, 0);
    obj.lifetime = 1;
    obj.mesh.visible = false;
  }

  update(delta: number, scene: THREE.Scene): void {
    // Update cooldown
    if (!this.canFire) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.canFire = true;
      }
    }

    // Update particles
    const active = this.particles.getActiveObjects();
    active.forEach(particle => {
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.velocity.multiplyScalar(0.95); // Drag

      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = particle.lifetime;

      scene.add(particle.mesh);
    });
  }

  fire(scene: THREE.Scene): boolean {
    if (!this.canFire) return false;

    this.canFire = false;
    this.cooldownTimer = this.fireCooldown;

    // Play beam sound
    this.soundGenerator.playBeamSound();

    // Create muzzle flash particles
    for (let i = 0; i < 10; i++) {
      const particle = this.particles.acquire();
      if (particle) {
        particle.mesh.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          0
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        particle.lifetime = 0.3;
        particle.color = COLORS.AMBER;
        scene.add(particle.mesh);
      }
    }

    return true;
  }

  createExplosion(position: THREE.Vector3, color: number = COLORS.THREAT_RED, scene: THREE.Scene): void {
    // Play kill sound
    this.soundGenerator.playKillSound();

    for (let i = 0; i < 30; i++) {
      const particle = this.particles.acquire();
      if (particle) {
        particle.mesh.position.copy(position);
        particle.velocity.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 60
        );
        particle.lifetime = 0.8;
        particle.color = color;

        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.color.setHex(color);

        scene.add(particle.mesh);
      }
    }

    eventBus.emit(GameEvent.ENEMY_DESTROYED, position);
  }

  dispose(): void {
    this.particles.dispose();
  }
}
