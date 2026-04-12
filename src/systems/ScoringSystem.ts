import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';

/**
 * ADDICTION SYSTEM: Makes Parallax extremely replayable
 * Combos, multipliers, streaks, bonuses, unlocks
 */
export class ScoringSystem {
  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private maxCombo: number = 0;
  private multiplier: number = 1;
  private streakCount: number = 0;
  private streakTimer: number = 0;
  private maxStreak: number = 0;
  private totalKills: number = 0;
  private perfectWave: boolean = true;
  private waveKills: number = 0;
  private highScore: number = 0;
  private gamesPlayed: number = 0;
  private lastKillTime: number = 0;
  private rapidFireCount: number = 0;

  // Unlockables
  private unlockedSkins: string[] = [];
  private totalScoreAllTime: number = 0;

  // Bonus thresholds
  private readonly COMBO_WINDOW = 2.5; // Seconds to maintain combo
  private readonly STREAK_WINDOW = 1.5; // Seconds to maintain streak
  private readonly RAPID_FIRE_WINDOW = 0.5; // Seconds for rapid fire bonus

  // Multiplier thresholds
  private readonly MULTIPLIER_STEPS = [1, 1.5, 2, 3, 5, 8, 13]; // Fibonacci!

  constructor() {
    this.loadPersistentData();
  }

  /**
   * Called when enemy is destroyed - the CORE addiction loop
   */
  onEnemyDestroyed(convergence: number, enemyType: string, isCrit: boolean): number {
    const now = Date.now();
    const timeSinceLastKill = now - this.lastKillTime;
    this.lastKillTime = now;

    // Base points
    let basePoints = 100;

    // Convergence bonus (aiming skill)
    const convergenceBonus = Math.floor(convergence * 100);
    basePoints += convergenceBonus;

    // Critical hit (fired at 98%+ convergence)
    let critMultiplier = 1;
    if (isCrit || convergence >= 0.98) {
      critMultiplier = 2;
      this.triggerCriticalEffect();
    }

    // Rapid fire bonus (quick successive kills)
    if (timeSinceLastKill < this.RAPID_FIRE_WINDOW * 1000) {
      this.rapidFireCount++;
      basePoints += this.rapidFireCount * 50;
    } else {
      this.rapidFireCount = 0;
    }

    // COMBO SYSTEM
    if (this.comboTimer > 0) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.combo = 1;
    }
    this.comboTimer = this.COMBO_WINDOW;

    // STREAK SYSTEM (faster than combo, more intense)
    if (this.streakTimer > 0) {
      this.streakCount++;
      this.maxStreak = Math.max(this.maxStreak, this.streakCount);
    } else {
      this.streakCount = 1;
    }
    this.streakTimer = this.STREAK_WINDOW;

    // Calculate multiplier based on combo
    const multiplierIndex = Math.min(this.combo, this.MULTIPLIER_STEPS.length - 1);
    this.multiplier = this.MULTIPLIER_STEPS[multiplierIndex];

    // Final score calculation
    const finalPoints = Math.floor(basePoints * this.multiplier * critMultiplier);
    this.score += finalPoints;
    this.totalKills++;
    this.waveKills++;

    // Emit events for UI/sound feedback
    eventBus.emit(GameEvent.SCORE_CHANGED, {
      score: this.score,
      combo: this.combo,
      multiplier: this.multiplier,
      streak: this.streakCount
    } as any);

    // Trigger milestone effects
    this.checkMilestones();

    return finalPoints;
  }

  /**
   * Update timers (called each frame)
   */
  update(delta: number): void {
    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0 && this.combo > 0) {
        // Combo lost - emit event
        eventBus.emit('combo:lost', { maxCombo: this.combo });
        this.combo = 0;
        this.multiplier = 1;
      }
    }

    // Streak decay (faster)
    if (this.streakTimer > 0) {
      this.streakTimer -= delta;
      if (this.streakTimer <= 0) {
        this.streakCount = 0;
      }
    }
  }

  /**
   * Player got hit - resets combo, ends perfect wave
   */
  onPlayerHit(): void {
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplier = 1;
    this.perfectWave = false;
    eventBus.emit('player:damaged', {});
  }

  /**
   * Wave completed - calculate bonuses
   */
  onWaveComplete(waveNumber: number): number {
    let waveBonus = 0;

    // Perfect wave bonus
    if (this.perfectWave && this.waveKills > 0) {
      waveBonus += 500 * waveNumber;
      eventBus.emit('wave:perfect', { wave: waveNumber, bonus: waveBonus });
    }

    // Wave completion bonus
    waveBonus += 200 * waveNumber;

    // Streak preservation bonus
    if (this.streakCount >= 5) {
      waveBonus += this.streakCount * 100;
    }

    this.score += waveBonus;
    this.waveKills = 0;
    this.perfectWave = true;

    return waveBonus;
  }

  /**
   * Check for milestone achievements
   */
  private checkMilestones(): void {
    // Combo milestones
    const comboMilestones = [5, 10, 20, 50, 100];
    comboMilestones.forEach(m => {
      if (this.combo === m) {
        eventBus.emit('milestone:combo', { combo: m });
        this.triggerMilestoneEffect(`${m} COMBO!`);
      }
    });

    // Streak milestones
    const streakMilestones = [3, 5, 10, 15, 20];
    streakMilestones.forEach(m => {
      if (this.streakCount === m) {
        eventBus.emit('milestone:streak', { streak: m });
        this.triggerMilestoneEffect(`${m} STREAK!`);
      }
    });

    // Score milestones
    const scoreMilestones = [1000, 5000, 10000, 25000, 50000, 100000];
    scoreMilestones.forEach(m => {
      if (this.score >= m && (this.score - m) < 1000) {
        eventBus.emit('milestone:score', { score: m });
        this.triggerMilestoneEffect(`${m} POINTS!`);
      }
    });
  }

  /**
   * Trigger visual effect for critical hits
   */
  private triggerCriticalEffect(): void {
    eventBus.emit('effect:critical', {});
  }

  /**
   * Trigger milestone announcement
   */
  private triggerMilestoneEffect(text: string): void {
    eventBus.emit('milestone:show', { text });
  }

  /**
   * Game over - save high score
   */
  onGameOver(): GameStats {
    this.gamesPlayed++;
    this.totalScoreAllTime += this.score;

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
    }

    this.savePersistentData();

    const stats: GameStats = {
      score: this.score,
      highScore: this.highScore,
      isNewHigh,
      combo: this.maxCombo,
      streak: this.maxStreak,
      kills: this.totalKills,
      gamesPlayed: this.gamesPlayed
    };

    return stats;
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplier = 1;
    this.streakCount = 0;
    this.streakTimer = 0;
    this.totalKills = 0;
    this.perfectWave = true;
    this.waveKills = 0;
    this.rapidFireCount = 0;
    this.lastKillTime = 0;
  }

  /**
   * Get current score info
   */
  getScoreInfo(): ScoreInfo {
    return {
      score: this.score,
      combo: this.combo,
      multiplier: this.multiplier,
      streak: this.streakCount,
      comboTimer: this.comboTimer,
      highScore: this.highScore
    };
  }

  /**
   * Load/save persistent data
   */
  private loadPersistentData(): void {
    try {
      const data = localStorage.getItem('parallax_stats');
      if (data) {
        const parsed = JSON.parse(data);
        this.highScore = parsed.highScore || 0;
        this.gamesPlayed = parsed.gamesPlayed || 0;
        this.totalScoreAllTime = parsed.totalScoreAllTime || 0;
        this.unlockedSkins = parsed.unlockedSkins || [];
      }
    } catch (e) {
      console.warn('Failed to load persistent data');
    }
  }

  private savePersistentData(): void {
    try {
      const data = {
        highScore: this.highScore,
        gamesPlayed: this.gamesPlayed,
        totalScoreAllTime: this.totalScoreAllTime,
        unlockedSkins: this.unlockedSkins
      };
      localStorage.setItem('parallax_stats', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save persistent data');
    }
  }

  dispose(): void {
    this.savePersistentData();
  }
}

export interface GameStats {
  score: number;
  highScore: number;
  isNewHigh: boolean;
  combo: number;
  streak: number;
  kills: number;
  gamesPlayed: number;
}

export interface ScoreInfo {
  score: number;
  combo: number;
  multiplier: number;
  streak: number;
  comboTimer: number;
  highScore: number;
}
