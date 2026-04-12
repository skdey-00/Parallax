import { eventBus, GameEvent } from '../core/EventBus.js';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'FIRST BLOOD',
    description: 'Destroy your first enemy',
    icon: '💀',
    unlocked: false
  },
  {
    id: 'combo_5',
    name: 'COMBO MASTER',
    description: 'Reach a 5x combo',
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'combo_10',
    name: 'ON FIRE',
    description: 'Reach a 10x combo',
    icon: '🔥🔥',
    unlocked: false
  },
  {
    id: 'streak_10',
    name: 'STREAK MASTER',
    description: 'Get a 10 kill streak',
    icon: '⚡',
    unlocked: false
  },
  {
    id: 'wave_clear_3',
    name: 'WAVE CLEARER',
    description: 'Complete wave 3',
    icon: '🌊',
    unlocked: false
  },
  {
    id: 'wave_clear_7',
    name: 'VETERAN',
    description: 'Complete wave 7',
    icon: '🎖️',
    unlocked: false
  },
  {
    id: 'perfect_wave',
    name: 'PERFECT',
    description: 'Complete a wave without taking damage',
    icon: '⭐',
    unlocked: false
  },
  {
    id: 'crit_10',
    name: 'SHARPSHOOTER',
    description: 'Get 10 critical hits',
    icon: '🎯',
    unlocked: false
  },
  {
    id: 'boss_killer',
    name: 'BOSS SLAYER',
    description: 'Defeat a boss enemy',
    icon: '👹',
    unlocked: false
  },
  {
    id: 'survivor',
    name: 'SURVIVOR',
    description: 'Reach wave 10',
    icon: '🛡️',
    unlocked: false
  },
  {
    id: 'score_10k',
    name: 'HIGH SCORER',
    description: 'Score 10,000 points',
    icon: '💎',
    unlocked: false
  },
  {
    id: 'score_50k',
    name: 'LEGEND',
    description: 'Score 50,000 points',
    icon: '👑',
    unlocked: false
  }
];

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private stats: Map<string, number> = new Map();

  // Tracking stats
  private totalKills: number = 0;
  private totalCrits: number = 0;
  private totalScore: number = 0;
  private maxCombo: number = 0;
  private maxStreak: number = 0;
  private perfectWaves: number = 0;
  private wavesCompleted: number = 0;
  private bossesKilled: number = 0;
  private damageTakenThisWave: boolean = false;

  constructor() {
    this.load();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Enemy destroyed
    eventBus.on(GameEvent.ENEMY_DESTROYED, (data: any) => {
      this.totalKills++;
      if (data.crit) {
        this.totalCrits++;
      }
      this.checkAchievements();
    });

    // Combo milestones
    eventBus.on('milestone:combo', (data: any) => {
      this.maxCombo = Math.max(this.maxCombo, data.combo);
      this.checkAchievements();
    });

    // Streak milestones
    eventBus.on('milestone:streak', (data: any) => {
      this.maxStreak = Math.max(this.maxStreak, data.streak);
      this.checkAchievements();
    });

    // Wave complete
    eventBus.on(GameEvent.WAVE_COMPLETE, (wave: number) => {
      this.wavesCompleted = wave;
      if (!this.damageTakenThisWave) {
        this.perfectWaves++;
        this.unlock('perfect_wave');
      }
      this.damageTakenThisWave = false;
      this.checkAchievements();
    });

    // Player damaged
    eventBus.on(GameEvent.PLAYER_DAMAGED, () => {
      this.damageTakenThisWave = true;
    });

    // Boss killed
    eventBus.on('boss:defeated', () => {
      this.bossesKilled++;
      this.unlock('boss_killer');
    });

    // Score changed
    eventBus.on(GameEvent.SCORE_CHANGED, (data: any) => {
      if (data && typeof data === 'object' && 'score' in data) {
        this.totalScore = (data as any).score;
        this.checkAchievements();
      }
    });
  }

  /**
   * Check if any achievements should be unlocked
   */
  private checkAchievements(): void {
    // First blood
    if (this.totalKills >= 1) this.unlock('first_blood');

    // Combo achievements
    if (this.maxCombo >= 5) this.unlock('combo_5');
    if (this.maxCombo >= 10) this.unlock('combo_10');

    // Streak achievements
    if (this.maxStreak >= 10) this.unlock('streak_10');

    // Wave achievements
    if (this.wavesCompleted >= 3) this.unlock('wave_clear_3');
    if (this.wavesCompleted >= 7) this.unlock('wave_clear_7');
    if (this.wavesCompleted >= 10) this.unlock('survivor');

    // Crit achievements
    if (this.totalCrits >= 10) this.unlock('crit_10');

    // Score achievements
    if (this.totalScore >= 10000) this.unlock('score_10k');
    if (this.totalScore >= 50000) this.unlock('score_50k');

    this.save();
  }

  /**
   * Unlock an achievement
   */
  unlock(id: string): void {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();

      // Emit unlock event for HUD
      eventBus.emit('achievement:unlocked', achievement);

      // Play sound
      this.save();
    }
  }

  /**
   * Get all achievements
   */
  getAll(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get unlocked count
   */
  getUnlockedCount(): number {
    return Array.from(this.achievements.values()).filter(a => a.unlocked).length;
  }

  /**
   * Get total count
  */
  getTotalCount(): number {
    return this.achievements.size;
  }

  /**
   * Load achievements from localStorage
   */
  private load(): void {
    try {
      const data = localStorage.getItem('parallax_achievements');
      if (data) {
        const parsed = JSON.parse(data);

        // Create achievement map
        for (const achievement of ACHIEVEMENTS) {
          const saved = parsed.find((p: any) => p.id === achievement.id);
          this.achievements.set(achievement.id, {
            ...achievement,
            unlocked: saved?.unlocked || false,
            unlockedAt: saved?.unlockedAt
          });
        }
      } else {
        // Initialize all achievements
        for (const achievement of ACHIEVEMENTS) {
          this.achievements.set(achievement.id, { ...achievement });
        }
      }
    } catch (e) {
      console.warn('Failed to load achievements');
      // Initialize defaults
      for (const achievement of ACHIEVEMENTS) {
        this.achievements.set(achievement.id, { ...achievement });
      }
    }
  }

  /**
   * Save achievements to localStorage
   */
  private save(): void {
    try {
      const data = Array.from(this.achievements.values());
      localStorage.setItem('parallax_achievements', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements');
    }
  }

  /**
   * Reset tracking stats (not unlocked achievements)
   */
  reset(): void {
    this.totalKills = 0;
    this.totalCrits = 0;
    this.totalScore = 0;
    this.maxCombo = 0;
    this.maxStreak = 0;
    this.perfectWaves = 0;
    this.wavesCompleted = 0;
    this.damageTakenThisWave = false;
  }

  dispose(): void {
    this.save();
  }
}
