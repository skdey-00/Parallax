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
  shieldCount: number;
  shieldHealth: number;
}

export const BOSSES: Record<number, BossConfig> = {
  1: { // Act I boss
    act: 1,
    health: 10,
    size: 40,
    speed: 8,
    attackPatterns: ['spiral', 'charge'],
    shieldCount: 4,
    shieldHealth: 1
  },
  2: { // Act II boss
    act: 2,
    health: 15,
    size: 50,
    speed: 10,
    attackPatterns: ['spiral', 'charge', 'spread'],
    shieldCount: 6,
    shieldHealth: 2
  },
  3: { // Act III boss
    act: 3,
    health: 20,
    size: 60,
    speed: 12,
    attackPatterns: ['spiral', 'charge', 'spread', 'chaos'],
    shieldCount: 8,
    shieldHealth: 2
  }
};

export interface ShieldData {
  id: string;
  mesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  position: THREE.Vector3;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  alive: boolean;
}

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

  // Shield system
  private shields: ShieldData[] = [];
  private coreExposed: boolean = false;
  private coreMesh: THREE.Mesh | null = null;
  private shieldOrbitAngle: number = 0;

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

    // Main body - outer wireframe icosahedron (NOT targetable, just visual)
    const bodyGeom = new THREE.IcosahedronGeometry(size, 1);
    const bodyMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = 'outerBody';
    group.add(body);

    // Inner core (THE WEAK POINT - only targetable when shields are down)
    const coreGeom = new THREE.IcosahedronGeometry(size * 0.4, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, // White core when exposed
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.coreMesh.name = 'core';
    this.coreMesh.visible = false; // Hidden until shields destroyed
    group.add(this.coreMesh);

    // Create orbiting shields
    for (let i = 0; i < this.config.shieldCount; i++) {
      const angle = (i / this.config.shieldCount) * Math.PI * 2;
      const orbitRadius = size * 1.3;

      const shieldGeom = new THREE.SphereGeometry(size * 0.18, 12, 12);
      const shieldMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      });
      const shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.name = `shield_${i}`;

      const shieldPos = new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle) * orbitRadius,
        0
      );
      shield.position.copy(shieldPos);

      group.add(shield);

      // Store shield data
      this.shields.push({
        id: `${this.id}_shield_${i}`,
        mesh: shield,
        health: this.config.shieldHealth,
        maxHealth: this.config.shieldHealth,
        position: shieldPos,
        angle,
        orbitRadius,
        orbitSpeed: 0.5 + Math.random() * 0.3,
        alive: true
      });
    }

    // Shield glow (visual indicator)
    const shieldGlowGeom = new THREE.RingGeometry(size * 1.2, size * 1.4, 32);
    const shieldGlowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const shieldGlow = new THREE.Mesh(shieldGlowGeom, shieldGlowMat);
    shieldGlow.name = 'shieldGlow';
    group.add(shieldGlow);

    // Health bar above boss
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 5),
      new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    healthBarBg.position.set(0, size + 20, 0);
    group.add(healthBarBg);

    const healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 5),
      new THREE.MeshBasicMaterial({ color: 0xFF0040, side: THREE.DoubleSide })
    );
    healthBarFill.position.set(0, size + 20, 0.01);
    healthBarFill.name = 'healthBar';
    group.add(healthBarFill);

    // Shield indicator bar
    const shieldBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 3),
      new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    shieldBarBg.position.set(0, size + 13, 0);
    group.add(shieldBarBg);

    const shieldBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, 3),
      new THREE.MeshBasicMaterial({ color: 0x00FFFF, side: THREE.DoubleSide })
    );
    shieldBarFill.position.set(0, size + 13, 0.01);
    shieldBarFill.name = 'shieldBar';
    group.add(shieldBarFill);

    return group;
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    if (!this.alive) return;

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(delta));
    this.mesh.position.copy(this.position);

    // Rotate main body
    this.mesh.rotation.y += delta * 0.3;

    // Update shield orbit
    this.shieldOrbitAngle += delta * 0.5;
    this.shields.forEach((shield, index) => {
      if (!shield.alive) return;

      const orbitAngle = shield.angle + this.shieldOrbitAngle * shield.orbitSpeed;
      shield.position.set(
        Math.cos(orbitAngle) * shield.orbitRadius,
        Math.sin(orbitAngle) * shield.orbitRadius,
        Math.sin(this.shieldOrbitAngle * 2 + index) * 10 // Slight Z variation
      );
      shield.mesh.position.copy(shield.position);
    });

    // Pulse core when exposed
    if (this.coreExposed && this.coreMesh) {
      const pulse = 0.3 + Math.sin(Date.now() / 200) * 0.2;
      (this.coreMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      this.coreMesh.scale.setScalar(1 + Math.sin(Date.now() / 150) * 0.1);
    }

    // Update attack timer
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.chooseAttack();
    }

    // Execute current attack
    this.executeAttack(delta, playerPos);

    // Update UI bars
    this.updateHealthBar();
    this.updateShieldBar();
  }

  private chooseAttack(): void {
    const attacks = this.config.attackPatterns;
    this.currentAttack = attacks[Math.floor(Math.random() * attacks.length)];
    this.attackTimer = 3 + Math.random() * 2;

    eventBus.emit('boss:attack', { id: this.id, attack: this.currentAttack });
  }

  private executeAttack(delta: number, playerPos: THREE.Vector3): void {
    switch (this.currentAttack) {
      case 'spiral':
        const time = Date.now() / 1000;
        this.velocity.x = Math.sin(time * 2) * 20;
        this.velocity.y = Math.cos(time * 2) * 20;
        break;

      case 'charge':
        const toPlayer = playerPos.clone().sub(this.position).normalize();
        this.velocity.x = toPlayer.x * this.config.speed * 2;
        this.velocity.y = toPlayer.y * this.config.speed * 2;
        break;

      case 'spread':
        eventBus.emit('boss:spread', {
          id: this.id,
          position: this.position.clone()
        });
        this.currentAttack = '';
        break;

      case 'chaos':
        this.velocity.x = (Math.random() - 0.5) * 50;
        this.velocity.y = (Math.random() - 0.5) * 50;
        break;
    }

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

  private updateShieldBar(): void {
    const shieldBar = this.mesh.getObjectByName('shieldBar') as THREE.Mesh;
    if (shieldBar) {
      const aliveShields = this.shields.filter(s => s.alive).length;
      const shieldPercent = aliveShields / this.config.shieldCount;
      shieldBar.scale.x = shieldPercent;
      shieldBar.position.x = -this.config.size * (1 - shieldPercent);

      // Change color when about to break
      if (aliveShields <= 2) {
        (shieldBar.material as THREE.MeshBasicMaterial).color.setHex(0xFF0040);
      }
    }
  }

  /**
   * Get world position of a specific shield (for convergence targeting)
   */
  getShieldPosition(shieldId: string): THREE.Vector3 | null {
    const shieldIndex = parseInt(shieldId.split('_').pop() || '-1');
    if (shieldIndex >= 0 && shieldIndex < this.shields.length) {
      const shield = this.shields[shieldIndex];
      if (shield.alive) {
        // Return world position
        return shield.mesh.getWorldPosition(new THREE.Vector3());
      }
    }
    return null;
  }

  /**
   * Damage a specific shield
   */
  damageShield(shieldId: string): boolean {
    const shieldIndex = parseInt(shieldId.split('_').pop() || '-1');
    if (shieldIndex >= 0 && shieldIndex < this.shields.length) {
      const shield = this.shields[shieldIndex];
      if (!shield.alive) return false;

      shield.health--;

      // Visual feedback
      shield.mesh.scale.setScalar(1.3);
      setTimeout(() => {
        if (shield.alive) shield.mesh.scale.setScalar(1);
      }, 100);

      if (shield.health <= 0) {
        return this.destroyShield(shieldIndex);
      }

      eventBus.emit('boss:shield_damaged', {
        shieldId,
        health: shield.health,
        maxHealth: shield.maxHealth
      });
      return true;
    }
    return false;
  }

  private destroyShield(index: number): boolean {
    const shield = this.shields[index];
    if (!shield.alive) return false;

    shield.alive = false;
    shield.mesh.visible = false;

    // Explosion effect
    eventBus.emit('effect:explosion', {
      position: shield.mesh.getWorldPosition(new THREE.Vector3()),
      color: 0x00FFFF
    });

    // Check if all shields destroyed
    const aliveShields = this.shields.filter(s => s.alive).length;
    if (aliveShields === 0 && !this.coreExposed) {
      this.exposeCore();
    }

    eventBus.emit('boss:shield_destroyed', {
      bossId: this.id,
      shieldId: shield.id,
      remaining: aliveShields
    });

    return true;
  }

  private exposeCore(): void {
    this.coreExposed = true;

    if (this.coreMesh) {
      this.coreMesh.visible = true;

      // Make core pulse intensely
      const pulseAnim = () => {
        if (!this.coreExposed || !this.coreMesh) return;
        const scale = 1 + Math.sin(Date.now() / 100) * 0.2;
        this.coreMesh.scale.setScalar(scale);
        requestAnimationFrame(pulseAnim);
      };
      pulseAnim();
    }

    // Hide outer wireframe to make core more visible
    const outerBody = this.mesh.getObjectByName('outerBody');
    if (outerBody) {
      (outerBody as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.2
      });
    }

    // Hide shield glow
    const shieldGlow = this.mesh.getObjectByName('shieldGlow');
    if (shieldGlow) {
      shieldGlow.visible = false;
    }

    eventBus.emit('boss:core_exposed', { id: this.id });
  }

  /**
   * Get core position (only when exposed)
   */
  getCorePosition(): THREE.Vector3 | null {
    if (!this.coreExposed || !this.coreMesh) return null;
    return this.coreMesh.getWorldPosition(new THREE.Vector3());
  }

  /**
   * Damage the core (main boss health)
   */
  damageCore(): boolean {
    if (!this.coreExposed) return false;

    this.health--;

    // Visual feedback
    if (this.coreMesh) {
      (this.coreMesh.material as THREE.MeshBasicMaterial).color.setHex(0xFF0000);
      setTimeout(() => {
        if (this.coreMesh) {
          (this.coreMesh.material as THREE.MeshBasicMaterial).color.setHex(0xFFFFFF);
        }
      }, 100);
    }

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

  /**
   * Damage a specific target (shield or core)
   */
  takeDamage(targetId?: string): boolean {
    // If targeting a shield
    if (targetId && targetId.includes('_shield_')) {
      return this.damageShield(targetId);
    }

    // If targeting core (bossId_core format) or boss directly
    if (targetId?.endsWith('_core') || targetId === this.id) {
      if (this.coreExposed) {
        return this.damageCore();
      }
      // Boss not vulnerable yet - show feedback
      eventBus.emit('narration:show', 'DESTROY SHIELDS FIRST!');
      return false;
    }

    // If no target specified but core exposed
    if (this.coreExposed) {
      return this.damageCore();
    }

    return false;
  }

  private die(): void {
    this.alive = false;

    eventBus.emit('boss:defeated', { id: this.id, act: this.config.act });

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

  isCoreExposed(): boolean {
    return this.coreExposed;
  }

  getAliveShields(): ShieldData[] {
    return this.shields.filter(s => s.alive);
  }

  getAllShields(): ShieldData[] {
    return this.shields;
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

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupEventListeners();
    this.createBossUI();
  }

  private setupEventListeners(): void {
    eventBus.on('boss:damaged', (data: any) => {
      this.updateBossHealthBar(data.health, data.maxHealth);
    });

    eventBus.on('boss:shield_destroyed', (data: any) => {
      this.updateShieldDisplay(data.remaining);
    });

    eventBus.on('boss:core_exposed', () => {
      this.showCoreExposedMessage();
    });

    eventBus.on('boss:defeated', (data: any) => {
      this.onBossDefeated(data);
    });
  }

  private createBossUI(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    this.bossHealthBar = document.createElement('div');
    this.bossHealthBar.id = 'boss-health-bar';
    this.bossHealthBar.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      display: none;
      flex-direction: column;
      align-items: center;
      z-index: 20;
    `;

    this.bossHealthBar.innerHTML = `
      <div class="boss-status" style="
        color: #FF0040;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 0 10px #FF0040;
        margin-bottom: 5px;
        text-align: center;
      ">DESTROY SHIELDS FIRST</div>
      <div class="boss-bars-container" style="
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 5px;
      ">
        <div class="bar-label" style="color: #00FFFF; font-size: 11px;">SHIELDS</div>
        <div class="boss-shield-bar" style="
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #00FFFF;
          border-radius: 4px;
          overflow: hidden;
        ">
          <div class="boss-shield-fill" style="
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #00FFFF, #0080FF);
            transition: width 0.3s;
          "></div>
        </div>
        <div class="bar-label" style="color: #FF0040; font-size: 11px; margin-top: 5px;">CORE</div>
        <div class="boss-core-bar" style="
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #FF0040;
          border-radius: 4px;
          overflow: hidden;
        ">
          <div class="boss-core-fill" style="
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #FF0040, #FF8000);
            transition: width 0.3s;
          "></div>
        </div>
      </div>
    `;

    uiLayer.appendChild(this.bossHealthBar);
  }

  spawnBoss(act: number): void {
    if (this.currentBoss) return;

    const id = `boss_act_${act}`;
    this.currentBoss = new BossEnemy(act, id);
    this.scene.add(this.currentBoss.mesh);

    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'flex';
      this.updateShieldDisplay(this.currentBoss.getAliveShields().length);
      this.updateBossHealthBar(this.currentBoss.getHealth(), this.currentBoss.getMaxHealth());
    }

    eventBus.emit('boss:spawned', { act, id });
    eventBus.emit('sound:boss', { type: 'spawn' });
  }

  updateBoss(delta: number, playerPos: THREE.Vector3): void {
    if (this.currentBoss && this.currentBoss.isAlive()) {
      this.currentBoss.update(delta, playerPos);
    }
  }

  /**
   * Check if a target ID belongs to this boss (shield or core)
   */
  isBossTarget(targetId: string): boolean {
    if (!this.currentBoss) return false;

    // Check if it's the boss itself
    if (targetId === this.currentBoss.getId()) return true;

    // Check if it's the core (bossId_core format)
    if (targetId === this.currentBoss.getId() + '_core') return true;

    // Check if it's a shield (bossId_shield_N format)
    if (targetId.includes(this.currentBoss.getId() + '_shield_')) return true;

    return false;
  }

  /**
   * Get position of a boss target (shield or core)
   */
  getTargetPosition(targetId: string): THREE.Vector3 | null {
    if (!this.currentBoss) return null;

    // Check shields
    if (targetId.includes('_shield_')) {
      return this.currentBoss.getShieldPosition(targetId);
    }

    // Check core (targetId format: bossId_core)
    if (targetId.endsWith('_core') || targetId === this.currentBoss.getId()) {
      if (this.currentBoss.isCoreExposed()) {
        return this.currentBoss.getCorePosition();
      }
    }

    // Default to boss center
    return this.currentBoss.getPosition();
  }

  /**
   * Check if target is damageable (core exposed, or shield exists)
   */
  isTargetDamageable(targetId: string): boolean {
    if (!this.currentBoss) return false;

    // Shields always damageable
    if (targetId.includes('_shield_')) {
      const shieldIndex = parseInt(targetId.split('_').pop() || '-1');
      const shields = this.currentBoss.getAllShields();
      return shieldIndex >= 0 && shieldIndex < shields.length && shields[shieldIndex].alive;
    }

    // Core only damageable when exposed (check for bossId_core format)
    if (targetId.endsWith('_core') || targetId === this.currentBoss.getId()) {
      return this.currentBoss.isCoreExposed();
    }

    return false;
  }

  /**
   * Damage a specific target
   */
  damageTarget(targetId: string): boolean {
    if (!this.currentBoss) return false;
    return this.currentBoss.takeDamage(targetId);
  }

  getCurrentBoss(): BossEnemy | null {
    return this.currentBoss && this.currentBoss.isAlive() ? this.currentBoss : null;
  }

  /**
   * Get all targetable IDs (for convergence system)
   */
  getTargetableIds(): string[] {
    if (!this.currentBoss) return [];

    const ids: string[] = [];

    // Add living shields
    for (const shield of this.currentBoss.getAliveShields()) {
      ids.push(shield.id);
    }

    // Add core if exposed
    if (this.currentBoss.isCoreExposed()) {
      ids.push(this.currentBoss.getId() + '_core');
    }

    return ids;
  }

  private updateBossHealthBar(health: number, maxHealth: number): void {
    if (this.bossHealthBar) {
      const fill = this.bossHealthBar.querySelector('.boss-core-fill') as HTMLElement;
      if (fill) {
        const percent = (health / maxHealth) * 100;
        fill.style.width = `${percent}%`;
      }
    }
  }

  private updateShieldDisplay(remaining: number): void {
    if (!this.currentBoss || !this.bossHealthBar) return;

    const total = this.currentBoss.getAllShields().length;
    const fill = this.bossHealthBar.querySelector('.boss-shield-fill') as HTMLElement;
    const status = this.bossHealthBar.querySelector('.boss-status') as HTMLElement;

    if (fill) {
      const percent = (remaining / total) * 100;
      fill.style.width = `${percent}%`;
    }

    if (status) {
      if (remaining === 0) {
        status.textContent = 'CORE EXPOSED! DESTROY IT!';
        status.style.color = '#FFFFFF';
        status.style.textShadow = '0 0 20px #FFFFFF';
      } else if (remaining <= 2) {
        status.textContent = `${remaining} SHIELD${remaining > 1 ? 'S' : ''} LEFT!`;
        status.style.color = '#FF0040';
      } else {
        status.textContent = `DESTROY ${remaining} SHIELD${remaining > 1 ? 'S' : ''}`;
        status.style.color = '#00FFFF';
      }
    }
  }

  private showCoreExposedMessage(): void {
    eventBus.emit('narration:show', 'CORE EXPOSED! FIRE AT THE CENTER!');
  }

  private onBossDefeated(data: any): void {
    if (this.bossHealthBar) {
      this.bossHealthBar.style.display = 'none';
    }

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
