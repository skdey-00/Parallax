import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';

export interface EnemyProjectile {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  alive: boolean;
}

export class EnemyProjectileSystem {
  private scene: THREE.Scene;
  private projectiles: Map<string, EnemyProjectile> = new Map();
  private nextId: number = 0;
  private playerPos: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Spawn a projectile from an enemy toward the player
   */
  spawnProjectile(position: THREE.Vector3, enemyType: string = 'basic'): void {
    const id = `proj_${this.nextId++}`;

    // Determine projectile properties based on enemy type
    let speed = 30;
    let size = 2;
    let color = 0xFF0040;
    let damage = 1;

    switch (enemyType) {
      case 'fast':
        speed = 50;
        size = 1.5;
        color = 0xFF8000;
        break;
      case 'heavy':
        speed = 20;
        size = 4;
        color = 0xFF00FF;
        damage = 2;
        break;
    }

    // Create projectile mesh
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    // Add glow
    const glowGeom = new THREE.SphereGeometry(size * 1.5, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    mesh.add(glow);

    this.scene.add(mesh);

    // Calculate velocity toward player
    const velocity = new THREE.Vector3()
      .subVectors(this.playerPos, position)
      .normalize()
      .multiplyScalar(speed);

    this.projectiles.set(id, {
      id,
      mesh,
      position: position.clone(),
      velocity,
      damage,
      alive: true
    });
  }

  /**
   * Update all projectiles
   * Returns array of projectiles that hit the player
   */
  update(delta: number, playerPos: THREE.Vector3): EnemyProjectile[] {
    this.playerPos.copy(playerPos);
    const hits: EnemyProjectile[] = [];
    const toRemove: string[] = [];

    for (const [id, proj] of this.projectiles) {
      if (!proj.alive) continue;

      // Update position
      proj.position.add(proj.velocity.clone().multiplyScalar(delta));
      proj.mesh.position.copy(proj.position);

      // Rotate for visual effect
      proj.mesh.rotation.x += delta * 5;
      proj.mesh.rotation.y += delta * 3;

      // Check if out of bounds (remove if too far)
      if (Math.abs(proj.position.x) > 150 ||
          Math.abs(proj.position.y) > 100 ||
          proj.position.z < -200 || proj.position.z > 50) {
        toRemove.push(id);
        continue;
      }

      // Check collision with player (simple distance check)
      const distToPlayer = proj.position.distanceTo(playerPos);
      if (distToPlayer < 8) { // Player hitbox radius
        hits.push(proj);
        toRemove.push(id);
      }
    }

    // Remove dead projectiles
    for (const id of toRemove) {
      this.removeProjectile(id);
    }

    return hits;
  }

  /**
   * Remove a projectile with effect
   */
  private removeProjectile(id: string): void {
    const proj = this.projectiles.get(id);
    if (!proj) return;

    this.scene.remove(proj.mesh);
    proj.mesh.geometry.dispose();
    (proj.mesh.material as THREE.Material).dispose();

    // Remove glow if exists
    if (proj.mesh.children.length > 0) {
      const glow = proj.mesh.children[0];
      if (glow instanceof THREE.Mesh) {
        glow.geometry.dispose();
        (glow.material as THREE.Material).dispose();
      }
    }

    this.projectiles.delete(id);
  }

  /**
   * Clear all projectiles
   */
  clear(): void {
    for (const id of this.projectiles.keys()) {
      this.removeProjectile(id);
    }
  }

  /**
   * Get all projectile positions for rendering/convergence
   */
  getProjectilePositions(): { id: string; position: THREE.Vector3 }[] {
    const result: { id: string; position: THREE.Vector3 }[] = [];
    for (const [id, proj] of this.projectiles) {
      if (proj.alive) {
        result.push({ id, position: proj.position.clone() });
      }
    }
    return result;
  }

  dispose(): void {
    this.clear();
  }
}
