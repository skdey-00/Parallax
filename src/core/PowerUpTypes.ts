export enum PowerUpType {
  SPEED_BOOST = 'speed_boost',
  SHIELD = 'shield',
  SPREAD_SHOT = 'spread_shot',
  DAMAGE_MULTIPLIER = 'damage_multiplier',
  RAPID_FIRE = 'rapid_fire',
  TIME_SLOW = 'time_slow'
}

export interface PowerUpConfig {
  type: PowerUpType;
  duration: number;
  magnitude: number;
}

export const POWER_UPS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.SPEED_BOOST]: {
    type: PowerUpType.SPEED_BOOST,
    duration: 10,
    magnitude: 2.0  // 2x aim speed
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    duration: 15,
    magnitude: 1  // Blocks 1 hit
  },
  [PowerUpType.SPREAD_SHOT]: {
    type: PowerUpType.SPREAD_SHOT,
    duration: 12,
    magnitude: 3  // 3-way spread
  },
  [PowerUpType.DAMAGE_MULTIPLIER]: {
    type: PowerUpType.DAMAGE_MULTIPLIER,
    duration: 10,
    magnitude: 2.0  // 2x damage
  },
  [PowerUpType.RAPID_FIRE]: {
    type: PowerUpType.RAPID_FIRE,
    duration: 8,
    magnitude: 0.1  // 100ms fire cooldown
  },
  [PowerUpType.TIME_SLOW]: {
    type: PowerUpType.TIME_SLOW,
    duration: 5,
    magnitude: 0.3  // 30% enemy speed
  }
};

export const POWER_UP_COLORS: Record<PowerUpType, number> = {
  [PowerUpType.SPEED_BOOST]: 0x00FF00,      // Green
  [PowerUpType.SHIELD]: 0x00FFFF,          // Cyan
  [PowerUpType.SPREAD_SHOT]: 0xFF8000,     // Orange
  [PowerUpType.DAMAGE_MULTIPLIER]: 0xFF00FF, // Magenta
  [PowerUpType.RAPID_FIRE]: 0xFFFF00,      // Yellow
  [PowerUpType.TIME_SLOW]: 0x8000FF        // Purple
};

export const POWER_UP_NAMES: Record<PowerUpType, string> = {
  [PowerUpType.SPEED_BOOST]: 'SPEED BOOST',
  [PowerUpType.SHIELD]: 'SHIELD',
  [PowerUpType.SPREAD_SHOT]: 'SPREAD SHOT',
  [PowerUpType.DAMAGE_MULTIPLIER]: 'DAMAGE x2',
  [PowerUpType.RAPID_FIRE]: 'RAPID FIRE',
  [PowerUpType.TIME_SLOW]: 'TIME SLOW'
};

export const POWER_UP_DESCRIPTIONS: Record<PowerUpType, string> = {
  [PowerUpType.SPEED_BOOST]: 'Ship movement speed doubled. Dodge attacks and align faster!',
  [PowerUpType.SHIELD]: 'Blocks one hit. Absorbs damage from enemy collisions.',
  [PowerUpType.SPREAD_SHOT]: 'Fire in 3 directions. Hit multiple enemies at once!',
  [PowerUpType.DAMAGE_MULTIPLIER]: 'All attacks deal double damage. Destroy enemies faster.',
  [PowerUpType.RAPID_FIRE]: 'Fire rate drastically increased. Unload devastating firepower.',
  [PowerUpType.TIME_SLOW]: 'Enemy movement slowed to 30%. Easy targets!'
};
