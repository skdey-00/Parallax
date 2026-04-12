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
  fire(origin: THREE.Vector3, targetEnemyId: string | null): boolean {
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

      this.createProjectile(origin, targetEnemyId, weapon, angleOffset);
    }

    // Play fire sound
    eventBus.emit('sound:fire', { type: this.currentWeapon });

    return true;
  }

  private createProjectile(
    origin: THREE.Vector3,
    targetEnemyId: string | null,
    weapon: WeaponConfig,
    angleOffset: number
  ): void {
    const id = `proj_${Date.now()}_${Math.random()}`;

    let velocity: THREE.Vector3;

    if (weapon.type === WeaponType.HOMING && targetEnemyId) {
      // Homing projectile - will track enemy
      velocity = new THREE.Vector3(0, 0, 100);
    } else {
      // Standard projectile - moves in Z with angle offset
      const speed = 200;
      velocity = new THREE.Vector3(
        Math.sin(angleOffset) * speed * 0.2,
        Math.cos(angleOffset) * speed * 0.2,
        speed
      );
    }

    // Create mesh
    const geometry = new THREE.SphereGeometry(3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: weapon.color,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const projectile: Projectile = {
      id,
      position: origin.clone(),
      velocity,
      weapon: weapon.type,
      targetId: targetEnemyId,
      damage: weapon.damage,
      alive: true,
      lifetime: 3,
      mesh
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

      // Move projectile
      if (proj.weapon === WeaponType.HOMING && proj.targetId) {
        // Home toward target (simplified - just move toward center)
        proj.position.add(proj.velocity.clone().multiplyScalar(delta));
      } else {
        proj.position.add(proj.velocity.clone().multiplyScalar(delta));
      }

      proj.mesh.position.copy(proj.position);

      // Check bounds
      if (proj.position.z > 100 || proj.position.z < -250 ||
          Math.abs(proj.position.x) > 150 || Math.abs(proj.position.y) > 100) {
        toRemove.push(id);
      }
    }

    // Remove dead projectiles
    for (const id of toRemove) {
      this.removeProjectile(id);
    }
  }

  private removeProjectile(id: string): void {
    const proj = this.projectiles.get(id);
    if (proj) {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
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
  damage: number;
  alive: boolean;
  lifetime: number;
  mesh: THREE.Mesh;
}
