import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { COLORS } from '../core/Constants.js';
import { EnemyType } from '../core/Types.js';

export interface BossConfig {
  act: number;
  health: number;
  size: number;
  speed: number;
  attackPatterns: string[];
}

export const BOSSES: Record<number, BossConfig> = {
  1: { // Act I boss
    act: 1,
    health: 10,
    size: 40,
    speed: 8,
    attackPatterns: ['spiral', 'charge']
  },
  2: { // Act II boss
    act: 2,
    health: 20,
    size: 50,
    speed: 10,
    attackPatterns: ['spiral', 'charge', 'spread']
  },
  3: { // Act III boss
    act: 3,
    health: 30,
    size: 60,
    speed: 12,
    attackPatterns: ['spiral', 'charge', 'spread', 'chaos']
  }
};

export class BossEnemy {
  private id: string;
  public config: BossConfig;
  public mesh: THREE.Group;
  private health: number;
  private maxHealth: number;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private attackTimer: number = 0;
  private currentAttack: string = '';
  private alive: boolean = true;

  constructor(act: number, id: string) {
    this.id = id;
    this.config = BOSSES[act] || BOSSES[1];
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.position = new THREE.Vector3(0, 0, -100);
    this.velocity = new THREE.Vector3(0, 0, 5);

    this.mesh = this.createBossMesh(act);
    this.mesh.position.copy(this.position);
  }

  private createBossMesh(act: number): THREE.Group {
    const group = new THREE.Group();

    const size = this.config.size;
    const colors = [0xFF0040, 0xFF8000, 0xFF00FF];
    const color = colors[Math.min(act - 1, colors.length - 1)];

    // Main body - icosahedron
    const bodyGeom = new THREE.IcosahedronGeometry(size, 1);
    const bodyMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Inner core
    const coreGeom = new THREE.IcosahedronGeometry(size * 0.5, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Orbiting shields
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const shieldGeom = new THREE.SphereGeometry(size * 0.15, 8, 8);
      const shieldMat = new THREE.MeshBasicMaterial({ color });
      const shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.position.set(
        Math.cos(angle) * size * 1.5,
        Math.sin(angle) * size * 1.5,
        0
      );
      group.add(shield);
    }

    // Health bar above boss
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 5),
      new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    healthBarBg.position.set(0, size + 15, 0);
    group.add(healthBarBg);

    const healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 5),
      new THREE.MeshBasicMaterial({ color: 0xFF0040, side: THREE.DoubleSide })
    );
    healthBarFill.position.set(0, size + 15, 0.01);
    healthBarFill.name = 'healthBar';
    group.add(healthBarFill);

    return group;
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    if (!this.alive) return;

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(delta));
    this.mesh.position.copy(this.position);

    // Rotate
    this.mesh.rotation.y += delta * 0.5;
    this.mesh.rotation.z += delta * 0.3;

    // Update attack timer
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.chooseAttack();
    }

    // Execute current attack
    this.executeAttack(delta, playerPos);

    // Update health bar
    this.updateHealthBar();
  }

  private chooseAttack(): void {
    const attacks = this.config.attackPatterns;
    this.currentAttack = attacks[Math.floor(Math.random() * attacks.length)];
    this.attackTimer = 3 + Math.random() * 2; // 3-5 seconds between attacks

    // Emit attack start event
    eventBus.emit('boss:attack', { id: this.id, attack: this.currentAttack });
  }

  private executeAttack(delta: number, playerPos: THREE.Vector3): void {
    switch (this.currentAttack) {
      case 'spiral':
        // Move in spiral pattern
        const time = Date.now() / 1000;
        this.velocity.x = Math.sin(time * 2) * 20;
        this.velocity.y = Math.cos(time * 2) * 20;
        break;

      case 'charge':
        // Charge toward player
        const toPlayer = playerPos.clone().sub(this.position).normalize();
        this.velocity.x = toPlayer.x * this.config.speed * 2;
        this.velocity.y = toPlayer.y * this.config.speed * 2;
        break;

      case 'spread':
        // Emit spread projectiles
        eventBus.emit('boss:spread', {
          id: this.id,
          position: this.position.clone()
        });
        this.currentAttack = '';
        break;

      case 'chaos':
        // Random movement
        this.velocity.x = (Math.random() - 0.5) * 50;
        this.velocity.y = (Math.random() - 0.5) * 50;
        break;
    }

    // Keep boss in bounds
    this.position.x = Math.max(-80, Math.min(80, this.position.x));
    this.position.y = Math.max(-50, Math.min(50, this.position.y));
  }

  private updateHealthBar(): void {
    const healthBar = this.mesh.getObjectByName('healthBar') as THREE.Mesh;
    if (healthBar) {
      const healthPercent = this.health / this.maxHealth;
      healthBar.scale.x = healthPercent;
      healthBar.position.x = -this.config.size * (1 - healthPercent);
    }
  }

  takeDamage(): boolean {
    if (!this.alive) return false;

    this.health--;

    // Emit damage event
    eventBus.emit('boss:damaged', {
      id: this.id,
      health: this.health,
      maxHealth: this.maxHealth
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private die(): void {
    this.alive = false;

    // Emit death event
    eventBus.emit('boss:defeated', { id: this.id, act: this.config.act });

    // Create death explosion
    eventBus.emit('effect:explosion', {
      position: this.position.clone(),
      color: this.config.act === 3 ? 0xFF00FF : 0xFF8000
    });
  }

  getId(): string {
    return this.id;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getType(): EnemyType {
    return EnemyType.HEAVY;
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

export class BossSystem {
  private scene: THREE.Scene;
  private currentBoss: BossEnemy | null = null;
  private bossHealthBar: HTMLElement | null = null;
  private bossNameDisplay: HTMLElement | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupEventListeners();
    this.createBossUI();
  }

  private setupEventListeners(): void {
    eventBus.on('boss:damaged', (data: any) => {
      this.updateBossHealthBar(data.health, data.maxHealth);
    });

    eventBus.on('boss:defeated', (data: any) => {
      this.onBossDefeated(data);
    });
  }

  private createBossUI(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    // Boss health bar container
    this.bossHealthBar = document.createElement('div');
    this.bossHealthBar.id = 'boss-health-bar';
    this.bossHealthBar.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 30px;
      display: none;
      flex-direction: column;
      align-items: center;
      z-index: 20;
    `;

    this.bossHealthBar.innerHTML = `
      <div class="boss-name" style="
        color: #FF0040;
        font-size: 18px;
        font-weight: bold;
        text-shadow: 0 0 10px #FF0040;
        margin-bottom: 5px;
      "></div>
      <div class="boss-health-container" style="
        width: 100%;
        height: 10px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #FF0040;
        border-radius: 5px;
        overflow: hidden;
      ">
        <div class="boss-health-fill" style="
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #FF0040, #FF8000);
          transition: width 0.3s;
        "></div>
      </div>
    `;

    uiLayer.appendChild(this.bossHealthBar);
  }

  spawnBoss(act: number): void {
    if (this.currentBoss) return;

    const id = `boss_act_${act}`;
    this.currentBoss = new BossEnemy(act, id);
    this.scene.add(this.currentBoss.mesh);

    // Show boss UI
    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'flex';
      const nameEl = this.bossHealthBar.querySelector('.boss-name');
      if (nameEl) {
        nameEl.textContent = `ACT ${act} BOSS`;
      }
    }

    // Emit spawn event
    eventBus.emit('boss:spawned', { act, id });

    // Play boss spawn sound
    eventBus.emit('sound:boss', { type: 'spawn' });
  }

  updateBoss(delta: number, playerPos: THREE.Vector3): void {
    if (this.currentBoss && this.currentBoss.isAlive()) {
      this.currentBoss.update(delta, playerPos);
    }
  }

  /**
   * Check if player can damage the boss (aimed at it)
   */
  checkBossDamage(convergedEnemy: string | null): boolean {
    if (this.currentBoss && convergedEnemy === this.currentBoss.getId()) {
      return this.currentBoss.takeDamage();
    }
    return false;
  }

  /**
   * Get current boss for convergence checks
   */
  getCurrentBoss(): BossEnemy | null {
    return this.currentBoss && this.currentBoss.isAlive() ? this.currentBoss : null;
  }

  private updateBossHealthBar(health: number, maxHealth: number): void {
    if (this.bossHealthBar) {
      const fill = this.bossHealthBar.querySelector('.boss-health-fill') as HTMLElement;
      if (fill) {
        const percent = (health / maxHealth) * 100;
        fill.style.width = `${percent}%`;
      }
    }
  }

  private onBossDefeated(data: any): void {
    // Hide boss UI
    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'none';
    }

    // Remove boss from scene
    if (this.currentBoss) {
      this.scene.remove(this.currentBoss.mesh);
      this.currentBoss.dispose();
      this.currentBoss = null;
    }
  }

  reset(): void {
    if (this.currentBoss) {
      this.scene.remove(this.currentBoss.mesh);
      this.currentBoss.dispose();
      this.currentBoss = null;
    }

    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'none';
    }
  }

  dispose(): void {
    this.reset();
    this.bossHealthBar?.remove();
  }
}
