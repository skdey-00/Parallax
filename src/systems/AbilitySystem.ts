import { eventBus, GameEvent } from '../core/EventBus.js';

export enum AbilityType {
  EMP_BOMB = 'emp_bomb',
  TIME_SLOW = 'time_slow',
  OVERCHARGE = 'overcharge'
}

export interface AbilityConfig {
  type: AbilityType;
  name: string;
  key: string;
  cooldown: number;
  duration: number;
  color: string;
  description: string;
}

export const ABILITIES: Record<AbilityType, AbilityConfig> = {
  [AbilityType.EMP_BOMB]: {
    type: AbilityType.EMP_BOMB,
    name: 'EMP BOMB',
    key: 'Q',
    cooldown: 30,
    duration: 0, // Instant
    color: '#FF0040',
    description: 'Destroy all enemies on screen'
  },
  [AbilityType.TIME_SLOW]: {
    type: AbilityType.TIME_SLOW,
    name: 'TIME SLOW',
    key: 'E',
    cooldown: 20,
    duration: 5,
    color: '#8000FF',
    description: 'Slow all enemies for 5 seconds'
  },
  [AbilityType.OVERCHARGE]: {
    type: AbilityType.OVERCHARGE,
    name: 'OVERCHARGE',
    key: 'R',
    cooldown: 25,
    duration: 8,
    color: '#FFFF00',
    description: 'Rapid fire for 8 seconds'
  }
};

export interface AbilityState {
  type: AbilityType;
  cooldownRemaining: number;
  isActive: boolean;
  activeTimeRemaining: number;
}

export class AbilitySystem {
  private cooldowns: Map<AbilityType, number> = new Map();
  private activeAbilities: Map<AbilityType, number> = new Map();
  private keys: Map<string, boolean> = new Map();

  constructor() {
    this.setupInput();
    this.setupEventListeners();
  }

  private setupInput(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
      this.checkActivation(e.code);
    });
    document.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.GAME_START, () => {
      this.reset();
    });
  }

  private checkActivation(code: string): void {
    // Find ability bound to this key
    for (const ability of Object.values(ABILITIES)) {
      if (ability.key === code || `Key${ability.key}` === code) {
        this.tryActivate(ability.type);
      }
    }
  }

  /**
   * Try to activate an ability
   */
  tryActivate(type: AbilityType): boolean {
    const config = ABILITIES[type];
    const cooldown = this.cooldowns.get(type) || 0;

    if (cooldown > 0) {
      // Still on cooldown
      return false;
    }

    // Activate!
    this.activateAbility(type);
    return true;
  }

  /**
   * Activate an ability
   */
  private activateAbility(type: AbilityType): void {
    const config = ABILITIES[type];

    switch (type) {
      case AbilityType.EMP_BOMB:
        // Destroy all enemies
        eventBus.emit('ability:emp', {});
        break;

      case AbilityType.TIME_SLOW:
        // Slow all enemies
        this.activeAbilities.set(type, config.duration);
        eventBus.emit('ability:time_slow', { duration: config.duration });
        break;

      case AbilityType.OVERCHARGE:
        // Rapid fire
        this.activeAbilities.set(type, config.duration);
        eventBus.emit('ability:overcharge', { duration: config.duration });
        break;
    }

    // Set cooldown
    this.cooldowns.set(type, config.cooldown);

    // Emit activation event
    eventBus.emit('ability:activated', {
      type,
      name: config.name,
      cooldown: config.cooldown
    });
  }

  /**
   * Update abilities (cooldowns, durations)
   */
  update(delta: number): void {
    // Update cooldowns
    for (const [type, cooldown] of this.cooldowns) {
      if (cooldown > 0) {
        this.cooldowns.set(type, Math.max(0, cooldown - delta));
      }
    }

    // Update active abilities
    const expired: AbilityType[] = [];
    for (const [type, remaining] of this.activeAbilities) {
      const newRemaining = remaining - delta;
      if (newRemaining <= 0) {
        expired.push(type);
      } else {
        this.activeAbilities.set(type, newRemaining);
      }
    }

    // Handle expired abilities
    for (const type of expired) {
      this.activeAbilities.delete(type);
      const config = ABILITIES[type];
      eventBus.emit('ability:expired', { type, name: config.name });
    }

    // Emit state for HUD
    this.emitState();
  }

  /**
   * Emit current ability states
   */
  private emitState(): void {
    const states: AbilityState[] = [];

    for (const type of Object.values(AbilityType) as AbilityType[]) {
      const config = ABILITIES[type];
      const cooldown = this.cooldowns.get(type) || 0;
      const activeTime = this.activeAbilities.get(type) || 0;

      states.push({
        type,
        cooldownRemaining: cooldown,
        isActive: activeTime > 0,
        activeTimeRemaining: activeTime
      });
    }

    eventBus.emit('abilities:state', states);
  }

  /**
   * Get current ability states
   */
  getStates(): AbilityState[] {
    const states: AbilityState[] = [];

    for (const type of Object.values(AbilityType) as AbilityType[]) {
      const config = ABILITIES[type];
      const cooldown = this.cooldowns.get(type) || 0;
      const activeTime = this.activeAbilities.get(type) || 0;

      states.push({
        type,
        cooldownRemaining: cooldown,
        isActive: activeTime > 0,
        activeTimeRemaining: activeTime
      });
    }

    return states;
  }

  /**
   * Check if an ability is ready
   */
  isReady(type: AbilityType): boolean {
    return (this.cooldowns.get(type) || 0) <= 0;
  }

  /**
   * Check if overcharge is active
   */
  isOverchargeActive(): boolean {
    return (this.activeAbilities.get(AbilityType.OVERCHARGE) || 0) > 0;
  }

  /**
   * Check if time slow is active
   */
  isTimeSlowActive(): boolean {
    return (this.activeAbilities.get(AbilityType.TIME_SLOW) || 0) > 0;
  }

  /**
   * Reset all abilities
   */
  reset(): void {
    this.cooldowns.clear();
    this.activeAbilities.clear();
  }

  dispose(): void {
    this.cooldowns.clear();
    this.activeAbilities.clear();
  }
}
