import * as THREE from 'three';
import { COLORS } from '../core/Constants.js';

/**
 * Visual Effects System
 * Particle bursts, convergence beams, screen flash
 */
export class EffectsAssets {
  private static particlePool: THREE.Mesh[] = [];
  private static readonly MAX_PARTICLES = 200;
  private static fragmentPool: THREE.Group[] = [];
  private static readonly MAX_FRAGMENTS = 50;
  private static trailPool: THREE.Mesh[] = [];
  private static readonly MAX_TRAILS = 30;
  private static scene: THREE.Scene | null = null;

  static initialize(scene: THREE.Scene): void {
    this.scene = scene;

    // Pre-allocate particles with varied sizes
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const size = 0.1 + Math.random() * 0.4;
      const geometry = new THREE.OctahedronGeometry(size, 0);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.WIREFRAME_WHITE,
        transparent: true,
        opacity: 0
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.visible = false;
      this.particlePool.push(particle);
      this.scene.add(particle);
    }

    // Pre-allocate enemy fragments
    for (let i = 0; i < this.MAX_FRAGMENTS; i++) {
      const fragment = new THREE.Group();
      const geometry = new THREE.TetrahedronGeometry(0.5, 0);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.THREAT_RED,
        transparent: true,
        opacity: 0,
        wireframe: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      fragment.add(mesh);
      fragment.visible = false;
      this.fragmentPool.push(fragment);
      this.scene.add(fragment);
    }

    // Pre-allocate trail particles
    for (let i = 0; i < this.MAX_TRAILS; i++) {
      const geometry = new THREE.PlaneGeometry(0.3, 0.3);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.AMBER,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });

      const trail = new THREE.Mesh(geometry, material);
      trail.visible = false;
      this.trailPool.push(trail);
      this.scene.add(trail);
    }
  }

  /**
   * Create particle burst at position
   */
  static createBurst(position: THREE.Vector3, color: number = COLORS.WIREFRAME_WHITE): void {
    const burstCount = 24;
    let particlesUsed = 0;

    for (const particle of this.particlePool) {
      if (particlesUsed >= burstCount) break;
      if (particle.visible) continue;

      particle.visible = true;
      particle.position.copy(position);

      const material = particle.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
      material.opacity = 1;

      // Random velocity with more explosive force
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );

      particle.userData.velocity = velocity;
      particle.userData.life = 1.0;
      particle.userData.decay = 0.8 + Math.random() * 0.7;
      particle.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );

      particlesUsed++;
    }
  }

  /**
   * Create convergence beam effect
   */
  static createConvergenceBeam(
    start: THREE.Vector3,
    end: THREE.Vector3,
    intensity: number
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: intensity > 0.9 ? COLORS.THREAT_RED : COLORS.AMBER,
      transparent: true,
      opacity: intensity * 0.6,
      linewidth: 2
    });

    const line = new THREE.Line(geometry, material);
    line.userData.isBeam = true;
    line.userData.intensity = intensity;

    if (this.scene) {
      this.scene.add(line);
    }

    return line;
  }

  /**
   * Create enemy fragmentation effect
   */
  static createEnemyFragmentation(position: THREE.Vector3, color: number = COLORS.THREAT_RED): void {
    const fragmentCount = 8;
    let fragmentsUsed = 0;

    for (const fragment of this.fragmentPool) {
      if (fragmentsUsed >= fragmentCount) break;
      if (fragment.visible) continue;

      fragment.visible = true;
      fragment.position.copy(position);
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const mesh = fragment.children[0] as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
      material.opacity = 1;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );

      fragment.userData.velocity = velocity;
      fragment.userData.life = 1.0;
      fragment.userData.decay = 0.6 + Math.random() * 0.4;
      fragment.userData.rotVelocity = new THREE.Vector3(
        Math.random() * 8 - 4,
        Math.random() * 8 - 4,
        Math.random() * 8 - 4
      );

      fragmentsUsed++;
    }
  }

  /**
   * Create player motion trail
   */
  static createPlayerTrail(position: THREE.Vector3, velocity: THREE.Vector3): void {
    for (const trail of this.trailPool) {
      if (!trail.visible) {
        trail.visible = true;
        trail.position.copy(position);

        // Orient trail opposite to movement
        trail.lookAt(position.clone().add(velocity));

        const material = trail.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6;

        trail.userData.life = 1.0;
        trail.userData.decay = 2.0;
        break;
      }
    }
  }

  /**
   * Update all effects
   */
  static update(delta: number): void {
    // Update particles
    for (const particle of this.particlePool) {
      if (!particle.visible) continue;

      const velocity = particle.userData.velocity as THREE.Vector3;
      const decay = particle.userData.decay as number;
      const rotSpeed = particle.userData.rotationSpeed as THREE.Vector3;

      // Update position
      particle.position.add(velocity.clone().multiplyScalar(delta));

      // Update rotation
      if (rotSpeed) {
        particle.rotation.x += rotSpeed.x * delta;
        particle.rotation.y += rotSpeed.y * delta;
        particle.rotation.z += rotSpeed.z * delta;
      }

      // Decay
      particle.userData.life -= decay * delta;

      const material = particle.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, particle.userData.life);

      // Hide when dead
      if (particle.userData.life <= 0) {
        particle.visible = false;
      }
    }

    // Update fragments
    for (const fragment of this.fragmentPool) {
      if (!fragment.visible) continue;

      const velocity = fragment.userData.velocity as THREE.Vector3;
      const decay = fragment.userData.decay as number;
      const rotVelocity = fragment.userData.rotVelocity as THREE.Vector3;

      // Update position
      fragment.position.add(velocity.clone().multiplyScalar(delta));

      // Update rotation
      fragment.rotation.x += rotVelocity.x * delta;
      fragment.rotation.y += rotVelocity.y * delta;
      fragment.rotation.z += rotVelocity.z * delta;

      // Decay
      fragment.userData.life -= decay * delta;

      const mesh = fragment.children[0] as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, fragment.userData.life);

      // Hide when dead
      if (fragment.userData.life <= 0) {
        fragment.visible = false;
      }
    }

    // Update trails
    for (const trail of this.trailPool) {
      if (!trail.visible) continue;

      const decay = trail.userData.decay as number;
      trail.userData.life -= decay * delta;

      const material = trail.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, trail.userData.life * 0.6);

      // Scale down as it fades
      const scale = Math.max(0.1, trail.userData.life);
      trail.scale.set(scale, scale, scale);

      // Hide when dead
      if (trail.userData.life <= 0) {
        trail.visible = false;
      }
    }
  }

  /**
   * Clean up effects
   */
  static dispose(): void {
    this.particlePool.forEach(particle => {
      particle.geometry.dispose();
      (particle.material as THREE.Material).dispose();
      if (this.scene) {
        this.scene.remove(particle);
      }
    });
    this.particlePool = [];

    this.fragmentPool.forEach(fragment => {
      fragment.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      if (this.scene) {
        this.scene.remove(fragment);
      }
    });
    this.fragmentPool = [];

    this.trailPool.forEach(trail => {
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
      if (this.scene) {
        this.scene.remove(trail);
      }
    });
    this.trailPool = [];
  }

  /**
   * Get screen flash overlay
   */
  static createScreenFlash(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      transparent: true,
      opacity: 0,
      depthTest: false
    });

    const flash = new THREE.Mesh(geometry, material);
    flash.renderOrder = 999; // Render on top
    flash.userData.isFlash = true;

    return flash;
  }

  /**
   * Trigger screen flash
   */
  static triggerScreenFlash(flashMesh: THREE.Mesh, duration: number = 0.2): void {
    const material = flashMesh.material as THREE.MeshBasicMaterial;
    material.opacity = 1;
    flashMesh.userData.flashDuration = duration;
    flashMesh.userData.flashTimer = 0;
    flashMesh.visible = true;
  }

  /**
   * Update screen flash
   */
  static updateScreenFlash(flashMesh: THREE.Mesh, delta: number): void {
    if (!flashMesh.visible) return;

    const material = flashMesh.material as THREE.MeshBasicMaterial;
    flashMesh.userData.flashTimer += delta;

    const progress = flashMesh.userData.flashTimer / flashMesh.userData.flashDuration;
    material.opacity = 1 - progress;

    if (progress >= 1) {
      flashMesh.visible = false;
    }
  }
}
