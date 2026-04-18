import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { PowerUpType, POWER_UPS, POWER_UP_COLORS, POWER_UP_NAMES, PowerUpConfig } from '../core/PowerUpTypes.js';
import { CONVERGENCE } from '../core/Constants.js';

export interface ActivePowerUp {
  type: PowerUpType;
  name?: string;
  timeRemaining: number;
  duration?: number;
  config: PowerUpConfig;
}

export interface PowerUpSpawn {
  id: string;
  type: PowerUpType;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  createdAt: number;
}

export class PowerUpSystem {
  private scene: THREE.Scene;
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  private spawnedPowerUps: Map<string, PowerUpSpawn> = new Map();
  private nextId: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 15; // Spawn every 15 seconds
  private maxSpawned: number = 3; // Max 3 power-ups on screen

  // Power-up effects
  private aimSpeedMultiplier: number = 1.0;
  private damageMultiplier: number = 1.0;
  private hasShield: boolean = false;
  private fireCooldown: number = 0; // 0 = normal
  private enemySpeedMultiplier: number = 1.0;
  private spreadCount: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for game start to reset
    eventBus.on(GameEvent.GAME_START, () => {
      this.reset();
    });
  }

  /**
   * Spawn a random power-up at a random screen position
   */
  spawnPowerUp(): void {
    if (this.spawnedPowerUps.size >= this.maxSpawned) return;

    // Pick random power-up type (exclude shield if player has shield)
    const types = Object.values(PowerUpType);
    let type = types[Math.floor(Math.random() * types.length)];

    // Don't spawn duplicate of active power-up
    if (this.activePowerUps.has(type)) {
      const availableTypes = types.filter(t => !this.activePowerUps.has(t));
      if (availableTypes.length > 0) {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      } else {
        return; // All power-ups active
      }
    }

    const id = `powerup_${this.nextId++}`;

    // Random position in screen space
    const x = (Math.random() - 0.5) * 80; // -40 to 40
    const y = (Math.random() - 0.5) * 60; // -30 to 30
    const z = (Math.random() - 0.5) * 100; // Depth variation

    const position = new THREE.Vector3(x, y, z);

    // Create visual mesh
    const mesh = this.createPowerUpMesh(type, position);
    this.scene.add(mesh);

    const spawn: PowerUpSpawn = {
      id,
      type,
      position,
      mesh,
      createdAt: Date.now()
    };

    this.spawnedPowerUps.set(id, spawn);

    // Emit spawn event
    eventBus.emit('powerup:spawned', { id, type, position });
  }

  /**
   * Create visual mesh for power-up
   */
  private createPowerUpMesh(type: PowerUpType, position: THREE.Vector3): THREE.Mesh {
    const color = POWER_UP_COLORS[type];
    const geometry = new THREE.OctahedronGeometry(5, 0);
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    // Add inner glow
    const innerGeom = new THREE.OctahedronGeometry(3, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    mesh.add(innerMesh);

    // Add orbiting particles
    for (let i = 0; i < 4; i++) {
      const particleGeom = new THREE.SphereGeometry(0.5, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({ color });
      const particle = new THREE.Mesh(particleGeom, particleMat);

      const angle = (i / 4) * Math.PI * 2;
      particle.position.set(Math.cos(angle) * 8, Math.sin(angle) * 8, 0);
      mesh.add(particle);
    }

    return mesh;
  }

  /**
   * Get all spawned power-ups for convergence system
   */
  getSpawnedPowerUps(): PowerUpSpawn[] {
    return Array.from(this.spawnedPowerUps.values());
  }

  /**
   * Check if player's crosshair is over a power-up
   */
  checkCollection(aimPosition: THREE.Vector2, camera: THREE.Camera): string | null {
    for (const [id, spawn] of this.spawnedPowerUps) {
      // Project power-up position to screen space
      const screenPos = spawn.position.clone().project(camera);

      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(screenPos.x - aimPosition.x, 2) +
        Math.pow(screenPos.y - aimPosition.y, 2)
      );

      // Check if converged (use larger hit zone for power-ups)
      if (distance < CONVERGENCE.HIT_ZONE * 1.5) {
        return id;
      }
    }
    return null;
  }

  /**
   * Collect a power-up
   */
  collectPowerUp(id: string): void {
    const spawn = this.spawnedPowerUps.get(id);
    if (!spawn) return;

    // Remove from scene
    this.scene.remove(spawn.mesh);
    spawn.mesh.geometry.dispose();
    (spawn.mesh.material as THREE.Material).dispose();

    // Remove from spawned
    this.spawnedPowerUps.delete(id);

    // Apply power-up effect
    this.activatePowerUp(spawn.type);

    // Emit event
    eventBus.emit('powerup:collected', { type: spawn.type });
  }

  /**
   * Activate a power-up
   */
  private activatePowerUp(type: PowerUpType): void {
    const config = POWER_UPS[type];

    // If already active, refresh duration
    if (this.activePowerUps.has(type)) {
      const existing = this.activePowerUps.get(type)!;
      existing.timeRemaining = config.duration;
    } else {
      // New power-up
      this.activePowerUps.set(type, {
        type,
        timeRemaining: config.duration,
        config
      });

      // Apply effect
      switch (type) {
        case PowerUpType.SPEED_BOOST:
          this.aimSpeedMultiplier = config.magnitude;
          break;
        case PowerUpType.SHIELD:
          this.hasShield = true;
          // Also grant brief invulnerability
          eventBus.emit('player:shield', { active: true });
          break;
        case PowerUpType.SPREAD_SHOT:
          this.spreadCount = Math.floor(config.magnitude);
          break;
        case PowerUpType.DAMAGE_MULTIPLIER:
          this.damageMultiplier = config.magnitude;
          break;
        case PowerUpType.RAPID_FIRE:
          this.fireCooldown = config.magnitude;
          break;
        case PowerUpType.TIME_SLOW:
          this.enemySpeedMultiplier = config.magnitude;
          eventBus.emit('time:slow', { active: true });
          break;
      }
    }

    // Emit state change
    eventBus.emit('powerup:activated', {
      type,
      name: POWER_UP_NAMES[type],
      duration: config.duration
    });
  }

  /**
   * Update power-ups (timers, rotation, etc.)
   */
  update(delta: number): void {
    // Update spawn timer
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnPowerUp();
      this.spawnTimer = this.spawnInterval;
    }

    // Update spawned power-ups (rotation, bobbing)
    const now = Date.now();
    for (const spawn of this.spawnedPowerUps.values()) {
      spawn.mesh.rotation.y += delta * 2;
      spawn.mesh.rotation.z += delta;
      spawn.mesh.position.y += Math.sin(now / 500) * 0.02;
    }

    // Update active power-ups
    const expiredTypes: PowerUpType[] = [];
    for (const [type, active] of this.activePowerUps) {
      active.timeRemaining -= delta;

      if (active.timeRemaining <= 0) {
        expiredTypes.push(type);
      }
    }

    // Remove expired power-ups
    for (const type of expiredTypes) {
      this.deactivatePowerUp(type);
    }

    // Emit current state for HUD
    if (this.activePowerUps.size > 0) {
      const activeArray = Array.from(this.activePowerUps.values()).map(p => ({
        type: p.type,
        name: POWER_UP_NAMES[p.type],
        timeRemaining: p.timeRemaining,
        duration: p.config.duration
      } as any));
      eventBus.emit('powerup:state', activeArray);
    }
  }

  /**
   * Deactivate an expired power-up
   */
  private deactivatePowerUp(type: PowerUpType): void {
    this.activePowerUps.delete(type);

    // Remove effect
    switch (type) {
      case PowerUpType.SPEED_BOOST:
        this.aimSpeedMultiplier = 1.0;
        break;
      case PowerUpType.SHIELD:
        this.hasShield = false;
        eventBus.emit('player:shield', { active: false });
        break;
      case PowerUpType.SPREAD_SHOT:
        this.spreadCount = 1;
        break;
      case PowerUpType.DAMAGE_MULTIPLIER:
        this.damageMultiplier = 1.0;
        break;
      case PowerUpType.RAPID_FIRE:
        this.fireCooldown = 0;
        break;
      case PowerUpType.TIME_SLOW:
        this.enemySpeedMultiplier = 1.0;
        eventBus.emit('time:slow', { active: false });
        break;
    }

    eventBus.emit('powerup:expired', { type, name: POWER_UP_NAMES[type] });
  }

  /**
   * Get current power-up effects
   */
  getEffects() {
    return {
      aimSpeedMultiplier: this.aimSpeedMultiplier,
      damageMultiplier: this.damageMultiplier,
      hasShield: this.hasShield,
      fireCooldown: this.fireCooldown,
      enemySpeedMultiplier: this.enemySpeedMultiplier,
      spreadCount: this.spreadCount
    };
  }

  /**
   * Check if player has shield
   */
  getHasShield(): boolean {
    return this.hasShield;
  }

  /**
   * Use shield (when hit)
   */
  useShield(): boolean {
    if (this.hasShield) {
      // Deactivate shield immediately
      this.deactivatePowerUp(PowerUpType.SHIELD);
      return true;
    }
    return false;
  }

  /**
   * Reset all power-ups
   */
  reset(): void {
    // Clear spawned
    for (const spawn of this.spawnedPowerUps.values()) {
      this.scene.remove(spawn.mesh);
      spawn.mesh.geometry.dispose();
      (spawn.mesh.material as THREE.Material).dispose();
    }
    this.spawnedPowerUps.clear();

    // Clear active
    const types = Array.from(this.activePowerUps.keys());
    for (const type of types) {
      this.deactivatePowerUp(type);
    }

    // Reset effects
    this.aimSpeedMultiplier = 1.0;
    this.damageMultiplier = 1.0;
    this.hasShield = false;
    this.fireCooldown = 0;
    this.enemySpeedMultiplier = 1.0;
    this.spreadCount = 1;

    this.spawnTimer = this.spawnInterval;
  }

  dispose(): void {
    this.reset();
  }
}
