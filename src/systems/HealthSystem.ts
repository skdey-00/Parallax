import { eventBus, GameEvent } from '../core/EventBus.js';
import { PLAYER } from '../core/Constants.js';

export interface HealthState {
  currentHealth: number;
  maxHealth: number;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
}

export class HealthSystem {
  private currentHealth: number;
  private maxHealth: number;
  private isInvulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;
  private damageCooldowns: Map<string, number> = new Map(); // Track damage from each enemy

  constructor() {
    this.currentHealth = PLAYER.MAX_HEALTH;
    this.maxHealth = PLAYER.MAX_HEALTH;
  }

  /**
   * Take damage with invulnerability check
   * Returns true if damage was taken, false if invulnerable
   */
  takeDamage(amount: number = 1, enemyId?: string): boolean {
    // Check if invulnerable
    if (this.isInvulnerable) {
      return false;
    }

    // Check damage cooldown for specific enemy
    if (enemyId) {
      const lastDamageTime = this.damageCooldowns.get(enemyId) || 0;
      const now = Date.now();
      if (now - lastDamageTime < PLAYER.DAMAGE_COOLDOWN * 1000) {
        return false;
      }
      this.damageCooldowns.set(enemyId, now);
    }

    // Apply damage
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    // Trigger invulnerability
    this.isInvulnerable = true;
    this.invulnerabilityTimer = PLAYER.INVULNERABILITY_TIME;

    // Emit events
    eventBus.emit(GameEvent.PLAYER_DAMAGED, {
      currentHealth: this.currentHealth,
      maxHealth: this.maxHealth,
      damageAmount: amount
    });
    eventBus.emit(GameEvent.HEALTH_CHANGED, this.getHealthState());

    // Check for death
    if (this.currentHealth <= 0) {
      eventBus.emit(GameEvent.PLAYER_DIED);
    }

    return true;
  }

  /**
   * Heal player
   */
  heal(amount: number): void {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

    if (this.currentHealth > oldHealth) {
      eventBus.emit(GameEvent.PLAYER_HEALED, {
        currentHealth: this.currentHealth,
        maxHealth: this.maxHealth,
        healAmount: amount
      });
      eventBus.emit(GameEvent.HEALTH_CHANGED, this.getHealthState());
    }
  }

  /**
   * Update timers (called each frame)
   */
  update(delta: number): void {
    // Update invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.damageCooldowns.clear(); // Clear all cooldowns when invulnerability ends
      }
    }
  }

  /**
   * Reset health (new game)
   */
  reset(): void {
    this.currentHealth = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.damageCooldowns.clear();
    eventBus.emit(GameEvent.HEALTH_CHANGED, this.getHealthState());
  }

  /**
   * Get current health state
   */
  getHealthState(): HealthState {
    return {
      currentHealth: this.currentHealth,
      maxHealth: this.maxHealth,
      isInvulnerable: this.isInvulnerable,
      invulnerabilityTimer: this.invulnerabilityTimer
    };
  }

  /**
   * Check if player is alive
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * Check if player is invulnerable
   */
  getIsInvulnerable(): boolean {
    return this.isInvulnerable;
  }

  /**
   * Get invulnerability timer (for visual effects)
   */
  getInvulnerabilityTimer(): number {
    return this.invulnerabilityTimer;
  }

  /**
   * Set max health (for upgrades/difficulty)
   */
  setMaxHealth(max: number): void {
    this.maxHealth = max;
    this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
    eventBus.emit(GameEvent.HEALTH_CHANGED, this.getHealthState());
  }

  dispose(): void {
    this.damageCooldowns.clear();
  }
}
