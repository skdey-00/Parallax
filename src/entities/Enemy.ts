import * as THREE from 'three';
import { COLORS, DEPTH, ENEMY } from '../core/Constants.js';
import { EnemyType, EnemyBehavior } from '../core/Types.js';
import { EnemyAssets } from '../assets/EnemyAssets.js';

export class Enemy {
  private mesh: THREE.Group;
  private id: string;
  private type: EnemyType;
  private behavior: EnemyBehavior;
  private health: number;
  private speed: number;
  private zSpeed: number;
  private velocity: THREE.Vector3;
  private dodgeTimer: number = 0;
  private isDodging: boolean = false;

  constructor(id: string, type: EnemyType, position: THREE.Vector3) {
    this.id = id;
    this.type = type;
    this.health = this.getHealthForType(type);
    this.speed = this.getSpeedForType(type);
    this.zSpeed = this.getZSpeedForType(type);
    this.behavior = this.getBehaviorForType(type);
    this.velocity = new THREE.Vector3();

    this.mesh = EnemyAssets.createVeilEntity(type);
    this.mesh.position.copy(position);
  }

  private getHealthForType(type: EnemyType): number {
    switch (type) {
      case EnemyType.HEAVY: return 3;
      case EnemyType.ECHO: return 1;
      case EnemyType.SPLIT: return 2;
      default: return 1;
    }
  }

  private getSpeedForType(type: EnemyType): number {
    switch (type) {
      case EnemyType.FAST: return ENEMY.BASE_SPEED * 1.5;
      case EnemyType.HEAVY: return ENEMY.BASE_SPEED * 0.7;
      case EnemyType.ECHO: return ENEMY.BASE_SPEED * 0.5;
      case EnemyType.SPLIT: return ENEMY.BASE_SPEED * 1.2;
      default: return ENEMY.BASE_SPEED;
    }
  }

  private getZSpeedForType(type: EnemyType): number {
    switch (type) {
      case EnemyType.FAST: return ENEMY.BASE_Z_SPEED * 1.8;
      case EnemyType.HEAVY: return ENEMY.BASE_Z_SPEED * 0.5;
      case EnemyType.ECHO: return ENEMY.BASE_Z_SPEED * 2;
      case EnemyType.SPLIT: return ENEMY.BASE_Z_SPEED * 1.3;
      default: return ENEMY.BASE_Z_SPEED;
    }
  }

  private getBehaviorForType(type: EnemyType): EnemyBehavior {
    switch (type) {
      case EnemyType.FAST: return EnemyBehavior.DODGE;
      case EnemyType.HEAVY: return EnemyBehavior.CHASE;
      case EnemyType.ECHO: return EnemyBehavior.ECHO;
      case EnemyType.SPLIT: return EnemyBehavior.SPLIT;
      default: return EnemyBehavior.DRIFT;
    }
  }

  update(delta: number, playerPosition: THREE.Vector3, convergence: number): void {
    // Base movement
    this.velocity.set(0, 0, 0);

    switch (this.behavior) {
      case EnemyBehavior.DRIFT:
        this.updateDrift(delta);
        break;
      case EnemyBehavior.DODGE:
        this.updateDodge(delta, convergence);
        break;
      case EnemyBehavior.CHASE:
        this.updateChase(delta, playerPosition, convergence);
        break;
      case EnemyBehavior.ECHO:
        this.updateEcho(delta, convergence);
        break;
      case EnemyBehavior.SPLIT:
        this.updateSplit(delta, convergence);
        break;
    }

    // Apply velocity
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

    // Rotate based on movement
    this.mesh.rotation.x += this.velocity.z * 0.01;
    this.mesh.rotation.y += this.velocity.x * 0.01;

    // Z bounds - keep very tightly in playable area
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -50, 30);

    // XY bounds - keep tightly in visible area
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -80, 80);
    this.mesh.position.y = THREE.MathUtils.clamp(this.mesh.position.y, -50, 50);

    // Update entity-specific animations with convergence
    EnemyAssets.updateEntity(this.mesh, this.type, Date.now(), convergence);
  }

  private updateDrift(delta: number): void {
    // Slow Z drift
    this.velocity.z = Math.sin(Date.now() * 0.001) * this.zSpeed * 0.3;
  }

  private updateDodge(delta: number, convergence: number): void {
    // If converging, dodge in Z
    if (convergence > 0.7) {
      if (!this.isDodging) {
        this.isDodging = true;
        this.dodgeTimer = 0.5;
      }

      // Dodge toward center of playable area (Z=-10)
      const centerZ = -10;
      const dodgeDirection = this.mesh.position.z > centerZ ? -1 : 1;
      this.velocity.z = dodgeDirection * this.zSpeed * 1.5;
    } else {
      this.isDodging = false;
      // Slow drift when safe
      this.velocity.z = Math.sin(Date.now() * 0.001 + this.mesh.position.x) * this.zSpeed * 0.2;
    }
  }

  private updateChase(delta: number, playerPosition: THREE.Vector3, convergence: number): void {
    // Move toward center (0,0) in XY since player is always there
    const toCenter = new THREE.Vector3(0, 0, 0).sub(this.mesh.position);
    toCenter.z = 0;

    this.velocity.x = toCenter.x * this.speed * 0.3;
    this.velocity.y = toCenter.y * this.speed * 0.3;

    if (convergence > 0.7) {
      const dodgeDirection = Math.random() > 0.5 ? 1 : -1;
      this.velocity.z = dodgeDirection * this.zSpeed * 0.5;
    }
  }

  private updateEcho(delta: number, convergence: number): void {
    // Erratic Z movement
    this.velocity.z = Math.sin(Date.now() * 0.003 + this.mesh.position.x * 0.1) * this.zSpeed * 2;

    // Phase in and out - handle group children
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      }
    });
  }

  private updateSplit(delta: number, convergence: number): void {
    // Circular motion in Z
    const angle = Date.now() * 0.002;
    this.velocity.z = Math.cos(angle) * this.zSpeed;

    // Slight XY movement
    this.velocity.x = Math.sin(angle) * this.speed * 0.3;
    this.velocity.y = Math.cos(angle * 1.3) * this.speed * 0.3;
  }

  takeDamage(): boolean {
    this.health--;
    return this.health <= 0;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getId(): string {
    return this.id;
  }

  getType(): EnemyType {
    return this.type;
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
