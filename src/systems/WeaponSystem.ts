import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';

export enum WeaponType {
  PLASMA = 'plasma',
  LASER = 'laser',
  SPREAD = 'spread',
  HOMING = 'homing'
}

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // seconds between shots
  spread: number; // number of projectiles
  color: number;
  description: string;
}

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  [WeaponType.PLASMA]: {
    type: WeaponType.PLASMA,
    name: 'PLASMA',
    damage: 1,
    fireRate: 0.15,
    spread: 1,
    color: 0x40C0FF,
    description: 'Standard plasma bolt'
  },
  [WeaponType.LASER]: {
    type: WeaponType.LASER,
    name: 'LASER',
    damage: 1.5,
    fireRate: 0.3,
    spread: 1,
    color: 0x00FF00,
    description: 'Instant hit beam'
  },
  [WeaponType.SPREAD]: {
    type: WeaponType.SPREAD,
    name: 'SPREAD',
    damage: 0.7,
    fireRate: 0.25,
    spread: 3,
    color: 0xFF8000,
    description: '3-way spread shot'
  },
  [WeaponType.HOMING]: {
    type: WeaponType.HOMING,
    name: 'HOMING',
    damage: 1.2,
    fireRate: 0.4,
    spread: 1,
    color: 0xFF00FF,
    description: 'Tracks enemies'
  }
};

export class WeaponSystem {
  private currentWeapon: WeaponType = WeaponType.PLASMA;
  private availableWeapons: Set<WeaponType> = new Set([WeaponType.PLASMA]);
  private lastFireTime: number = 0;
  private scene: THREE.Scene;
  private projectiles: Map<string, Projectile> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.GAME_START, () => {
      this.reset();
    });

    // Weapon collection
    eventBus.on('weapon:collected', (type: WeaponType) => {
      this.availableWeapons.add(type);
    });
  }

  /**
   * Try to fire the current weapon
   */
  fire(origin: THREE.Vector3, targetEnemyId: string | null, targetPosition: THREE.Vector3 | null): boolean {
    const now = Date.now();
    const weapon = WEAPONS[this.currentWeapon];

    if (now - this.lastFireTime < weapon.fireRate * 1000) {
      return false; // Still on cooldown
    }

    this.lastFireTime = now;

    // Create projectiles based on spread
    const spread = weapon.spread;
    const spreadAngle = spread === 3 ? 0.3 : spread === 5 ? 0.15 : 0;

    for (let i = 0; i < spread; i++) {
      const angleOffset = (i - (spread - 1) / 2) * spreadAngle;

      this.createProjectile(origin, targetEnemyId, targetPosition, weapon, angleOffset);
    }

    // Play fire sound
    eventBus.emit('sound:fire', { type: this.currentWeapon });

    return true;
  }

  private createProjectile(
    origin: THREE.Vector3,
    targetEnemyId: string | null,
    targetPosition: THREE.Vector3 | null,
    weapon: WeaponConfig,
    angleOffset: number
  ): void {
    const id = `proj_${Date.now()}_${Math.random()}`;

    // Calculate velocity toward target
    let velocity: THREE.Vector3;
    let actualTarget = targetPosition;

    if (targetPosition) {
      // Calculate direction from origin to target
      const direction = new THREE.Vector3()
        .subVectors(targetPosition, origin)
        .normalize();

      // Apply spread offset perpendicular to direction
      if (angleOffset !== 0) {
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(direction, up).normalize();
        const actualUp = new THREE.Vector3().crossVectors(right, direction).normalize();

        direction.add(right.multiplyScalar(Math.sin(angleOffset) * 0.3));
        direction.add(actualUp.multiplyScalar(Math.cos(angleOffset) * 0.3));
        direction.normalize();
      }

      const speed = weapon.type === WeaponType.HOMING ? 150 : 300;
      velocity = direction.multiplyScalar(speed);
    } else {
      // No target - fire forward (negative Z)
      const speed = 300;
      velocity = new THREE.Vector3(
        Math.sin(angleOffset) * speed * 0.2,
        Math.cos(angleOffset) * speed * 0.2,
        -speed
      );
      actualTarget = null;
    }

    // Create themed projectile mesh - energy bolt with trail
    const group = new THREE.Group();

    // Core bolt - bright glowing line
    const coreGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Outer glow - colored cylinder
    const glowGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
    glowGeom.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: weapon.color,
      transparent: true,
      opacity: 0.6
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    // Wireframe cage
    const cageGeom = new THREE.OctahedronGeometry(1.5, 0);
    const cageMat = new THREE.MeshBasicMaterial({
      color: weapon.color,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const cage = new THREE.Mesh(cageGeom, cageMat);
    group.add(cage);

    // Point light for glow effect
    const light = new THREE.PointLight(weapon.color, 2, 15);
    group.add(light);

    // Orient projectile in velocity direction
    if (velocity.length() > 0) {
      const lookTarget = origin.clone().add(velocity);
      group.lookAt(lookTarget);
    }

    group.position.copy(origin);
    this.scene.add(group);

    const projectile: Projectile = {
      id,
      position: origin.clone(),
      velocity,
      weapon: weapon.type,
      targetId: targetEnemyId,
      targetPosition: actualTarget,
      damage: weapon.damage,
      alive: true,
      lifetime: 3,
      mesh: group,
      color: weapon.color
    };

    this.projectiles.set(id, projectile);
  }

  /**
   * Update all projectiles
   */
  update(delta: number): void {
    const toRemove: string[] = [];

    for (const [id, proj] of this.projectiles) {
      if (!proj.alive) continue;

      // Update lifetime
      proj.lifetime -= delta;
      if (proj.lifetime <= 0) {
        toRemove.push(id);
        continue;
      }

      // Homing behavior - adjust velocity toward target
      if (proj.weapon === WeaponType.HOMING && proj.targetPosition) {
        const toTarget = new THREE.Vector3()
          .subVectors(proj.targetPosition, proj.position)
          .normalize();

        // Steer toward target (lerp velocity)
        const steerSpeed = 5 * delta;
        proj.velocity.lerp(toTarget.multiplyScalar(200), steerSpeed);
      }

      // Move projectile
      proj.position.add(proj.velocity.clone().multiplyScalar(delta));
      proj.mesh.position.copy(proj.position);

      // Rotate wireframe cage for visual effect
      if (proj.mesh.children.length >= 3) {
        const cage = proj.mesh.children[2] as THREE.Mesh;
        cage.rotation.z += delta * 10;
        cage.rotation.y += delta * 5;
      }

      // Pulse effect
      const pulse = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
      if (proj.mesh.children[0] instanceof THREE.Mesh) {
        (proj.mesh.children[0].material as THREE.MeshBasicMaterial).opacity = pulse;
      }

      // Check if reached target distance
      if (proj.targetPosition) {
        const distToTarget = proj.position.distanceTo(proj.targetPosition);
        if (distToTarget < 10) {
          // Hit!
          this.createImpactEffect(proj.targetPosition, proj.color);
          toRemove.push(id);
          continue;
        }
      }

      // Check bounds
      if (proj.position.z > 50 || proj.position.z < -250 ||
          Math.abs(proj.position.x) > 150 || Math.abs(proj.position.y) > 100) {
        toRemove.push(id);
      }
    }

    // Remove dead projectiles
    for (const id of toRemove) {
      this.removeProjectile(id);
    }
  }

  /**
   * Create impact effect when projectile hits
   */
  private createImpactEffect(position: THREE.Vector3, color: number): void {
    // Flash burst
    const burstGeom = new THREE.SphereGeometry(3, 8, 8);
    const burstMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1
    });
    const burst = new THREE.Mesh(burstGeom, burstMat);
    burst.position.copy(position);
    this.scene.add(burst);

    // Animate and remove
    const startTime = Date.now();
    const animateBurst = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0.3) {
        this.scene.remove(burst);
        burstGeom.dispose();
        burstMat.dispose();
        return;
      }

      const scale = 1 + elapsed * 5;
      burst.scale.setScalar(scale);
      burstMat.opacity = 1 - (elapsed / 0.3);
      requestAnimationFrame(animateBurst);
    };
    animateBurst();

    // Particle sparks
    for (let i = 0; i < 8; i++) {
      const sparkGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const sparkMat = new THREE.MeshBasicMaterial({ color });
      const spark = new THREE.Mesh(sparkGeom, sparkMat);
      spark.position.copy(position);

      const sparkVel = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );

      this.scene.add(spark);

      const sparkLife = 0.3 + Math.random() * 0.2;
      const sparkStart = Date.now();

      const animateSpark = () => {
        const elapsed = (Date.now() - sparkStart) / 1000;
        if (elapsed > sparkLife) {
          this.scene.remove(spark);
          sparkGeom.dispose();
          sparkMat.dispose();
          return;
        }

        spark.position.add(sparkVel.clone().multiplyScalar(0.016));
        sparkMat.opacity = 1 - (elapsed / sparkLife);
        requestAnimationFrame(animateSpark);
      };
      animateSpark();
    }
  }

  private removeProjectile(id: string): void {
    const proj = this.projectiles.get(id);
    if (proj) {
      this.scene.remove(proj.mesh);
      // Dispose all children
      proj.mesh.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
        if (child instanceof THREE.PointLight) {
          child.dispose();
        }
      });
      this.projectiles.delete(id);
    }
  }

  /**
   * Switch weapon
   */
  switchWeapon(type: WeaponType): boolean {
    if (!this.availableWeapons.has(type)) return false;

    this.currentWeapon = type;
    eventBus.emit('weapon:switched', { type, name: WEAPONS[type].name });
    return true;
  }

  /**
   * Cycle to next weapon
   */
  cycleWeapon(): void {
    const types = Array.from(this.availableWeapons);
    if (types.length <= 1) return;

    const currentIndex = types.indexOf(this.currentWeapon);
    const nextIndex = (currentIndex + 1) % types.length;
    this.switchWeapon(types[nextIndex]);
  }

  /**
   * Get current weapon
   */
  getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }

  /**
   * Get current weapon config
   */
  getCurrentWeaponConfig(): WeaponConfig {
    return WEAPONS[this.currentWeapon];
  }

  /**
   * Get all available weapons
   */
  getAvailableWeapons(): WeaponType[] {
    return Array.from(this.availableWeapons);
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.currentWeapon = WeaponType.PLASMA;
    this.availableWeapons = new Set([WeaponType.PLASMA]);
    this.lastFireTime = 0;
    this.clear();
  }

  /**
   * Clear all projectiles
   */
  clear(): void {
    for (const id of this.projectiles.keys()) {
      this.removeProjectile(id);
    }
  }

  dispose(): void {
    this.clear();
  }
}

interface Projectile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  weapon: WeaponType;
  targetId: string | null;
  targetPosition: THREE.Vector3 | null;
  damage: number;
  alive: boolean;
  lifetime: number;
  mesh: THREE.Group;
  color: number;
}
