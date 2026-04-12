import { eventBus, GameEvent } from '../core/EventBus.js';
import { SoundGenerator } from '../audio/SoundGenerator.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MusicGenerator } from '../audio/MusicGenerator.js';
import { ScoreInfo } from '../systems/ScoringSystem.js';
import { HealthState } from '../systems/HealthSystem.js';
import { ActivePowerUp } from '../systems/PowerUpSystem.js';
import { AbilityState } from '../systems/AbilitySystem.js';

/**
 * ADDICTIVE HUD - Shows combos, multipliers, streaks, milestones
 * Everything designed to give players that "one more try" feeling
 */
export class HUD {
  private convergenceValue: HTMLElement;
  private waveNumber: HTMLElement;
  private actDisplay: HTMLElement;
  private scoreValue: HTMLElement;
  private depthValue: HTMLElement;
  private entityCount: HTMLElement;
  private lockIndicator: HTMLElement;
  private narration: HTMLElement;
  private flash: HTMLElement;
  private waveTransition: HTMLElement;
  private gameContainer: HTMLElement;
  private currentAct: number = 1;
  private score: number = 0;
  private soundGenerator: SoundGenerator;
  private musicGenerator: MusicGenerator;
  private audioManager: AudioManager;
  private muteButton: HTMLElement | null = null;

  // ADDICTIVE ELEMENTS
  private comboDisplay!: HTMLElement;
  private multiplierDisplay!: HTMLElement;
  private streakDisplay!: HTMLElement;
  private milestoneDisplay!: HTMLElement;
  private highScoreDisplay!: HTMLElement;
  private comboBar!: HTMLElement;
  private killFeed!: HTMLElement;
  private floatingTexts: HTMLElement[] = [];

  // HEALTH SYSTEM
  private healthContainer!: HTMLElement;
  private healthBar!: HTMLElement;
  private healthHearts!: HTMLElement[];
  private currentHealth: number = 3;
  private maxHealth: number = 3;

  // POWER-UP SYSTEM
  private powerUpContainer!: HTMLElement;
  private activePowerUps: Map<string, HTMLElement> = new Map();

  // ABILITY SYSTEM
  private abilityContainer!: HTMLElement;
  private abilityIcons: Map<string, HTMLElement> = new Map();

  // Current state
  private currentCombo: number = 0;
  private currentMultiplier: number = 1;
  private currentStreak: number = 0;
  private comboTimer: number = 0;
  private highScore: number = 0;
  private aimIndicator!: HTMLElement;

  constructor() {
    this.convergenceValue = document.getElementById('convergence-value')!;
    this.waveNumber = document.getElementById('wave-number')!;
    this.actDisplay = document.getElementById('act-display')!;
    this.scoreValue = document.getElementById('score-value')!;
    this.depthValue = document.getElementById('depth-value')!;
    this.entityCount = document.getElementById('entity-count')!;
    this.lockIndicator = document.getElementById('lock-indicator')!;
    this.narration = document.getElementById('narration')!;
    this.flash = document.getElementById('flash')!;
    this.waveTransition = document.getElementById('wave-transition')!;
    this.gameContainer = document.getElementById('game-container')!;

    this.soundGenerator = new SoundGenerator();
    this.musicGenerator = new MusicGenerator();
    this.audioManager = AudioManager.getInstance();

    this.createAddictiveElements();
    this.createHealthDisplay();
    this.createPowerUpDisplay();
    this.createAbilityDisplay();
    this.createMuteButton();
    this.setupEventListeners();
    this.loadHighScore();
  }

  /**
   * Create aim indicator showing where player is aiming
   */
  private createAimIndicator(uiLayer: HTMLElement): void {
    this.aimIndicator = document.createElement('div');
    this.aimIndicator.className = 'aim-indicator';
    this.aimIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 80px;
      background: linear-gradient(to top, #FFB000 0%, #FFB000 50%, transparent 100%);
      transform-origin: bottom center;
      pointer-events: none;
      z-index: 5;
      transition: transform 0.05s linear;
    `;
    uiLayer.appendChild(this.aimIndicator);

    // Aim reticle circle
    const reticle = document.createElement('div');
    reticle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      border: 2px solid #FFB000;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 5;
      opacity: 0.7;
      box-shadow: 0 0 10px #FFB000;
    `;
    uiLayer.appendChild(reticle);
  }

  /**
   * Create all the addictive UI elements
   */
  private createAddictiveElements(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    // COMBO DISPLAY (left side, big)
    this.comboDisplay = document.createElement('div');
    this.comboDisplay.className = 'hud-element combo-display';
    this.comboDisplay.innerHTML = '<span class="combo-number">0</span><span class="combo-label">COMBO</span>';
    this.comboDisplay.style.cssText = `
      position: absolute;
      top: 100px;
      left: 20px;
      text-align: left;
      opacity: 0;
      transition: all 0.2s ease-out;
      transform: scale(0.8);
    `;
    uiLayer.appendChild(this.comboDisplay);

    // COMBO BAR (timer)
    this.comboBar = document.createElement('div');
    this.comboBar.className = 'combo-bar';
    this.comboBar.style.cssText = `
      position: absolute;
      top: 145px;
      left: 20px;
      width: 0px;
      height: 4px;
      background: linear-gradient(90deg, #FFB000, #FF0040);
      box-shadow: 0 0 10px #FF0040;
      transition: width 0.1s linear;
    `;
    uiLayer.appendChild(this.comboBar);

    // MULTIPLIER DISPLAY (center, flashy)
    this.multiplierDisplay = document.createElement('div');
    this.multiplierDisplay.className = 'hud-element multiplier-display';
    this.multiplierDisplay.innerHTML = '×1';
    this.multiplierDisplay.style.cssText = `
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 36px;
      font-weight: bold;
      color: #FFB000;
      text-shadow: 0 0 20px #FFB000;
      opacity: 0;
      transition: all 0.2s;
    `;
    uiLayer.appendChild(this.multiplierDisplay);

    // STREAK DISPLAY (right side)
    this.streakDisplay = document.createElement('div');
    this.streakDisplay.className = 'hud-element streak-display';
    this.streakDisplay.innerHTML = '<span class="streak-icon">🔥</span><span class="streak-number">0</span>';
    this.streakDisplay.style.cssText = `
      position: absolute;
      top: 100px;
      right: 20px;
      font-size: 20px;
      opacity: 0;
      transition: all 0.2s;
    `;
    uiLayer.appendChild(this.streakDisplay);

    // HIGH SCORE DISPLAY
    this.highScoreDisplay = document.createElement('div');
    this.highScoreDisplay.className = 'hud-element high-score-display';
    this.highScoreDisplay.innerHTML = `HI: ${this.highScore}`;
    this.highScoreDisplay.style.cssText = `
      position: absolute;
      top: 60px;
      left: 20px;
      font-size: 12px;
      color: #666;
    `;
    uiLayer.appendChild(this.highScoreDisplay);

    // MILESTONE DISPLAY (center popup)
    this.milestoneDisplay = document.createElement('div');
    this.milestoneDisplay.className = 'milestone-display';
    this.milestoneDisplay.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%) scale(0);
      font-size: 48px;
      font-weight: bold;
      color: #FF0040;
      text-shadow: 0 0 30px #FF0040, 0 0 60px #FF0040;
      text-align: center;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 20;
    `;
    uiLayer.appendChild(this.milestoneDisplay);

    // KILL FEED (bottom right)
    this.killFeed = document.createElement('div');
    this.killFeed.className = 'kill-feed';
    this.killFeed.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 20px;
      width: 200px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    `;
    uiLayer.appendChild(this.killFeed);

    // Add CSS animations for combo pop
    const style = document.createElement('style');
    style.textContent = `
      .combo-pop {
        animation: comboPop 0.3s ease-out;
      }
      @keyframes comboPop {
        0% { transform: scale(0.8); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      .multiplier-pulse {
        animation: multiplierPulse 0.5s ease-out;
      }
      @keyframes multiplierPulse {
        0% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.5); }
        100% { transform: translateX(-50%) scale(1); }
      }
      .streak-fire {
        animation: streakFire 0.3s ease-out;
      }
      @keyframes streakFire {
        0% { transform: scale(1) rotate(-5deg); }
        50% { transform: scale(1.3) rotate(5deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .kill-feed-item {
        animation: killFeedSlide 0.3s ease-out, killFeedFade 0.5s ease-in 2.5s forwards;
      }
      @keyframes killFeedSlide {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes killFeedFade {
        to { opacity: 0; }
      }
      .floating-text {
        animation: floatUp 1s ease-out forwards;
        pointer-events: none;
      }
      @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
      }
      .perfect-wave {
        animation: perfectWave 2s ease-out;
      }
      @keyframes perfectWave {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        20% { transform: translateX(-50%) scale(1.2); opacity: 1; }
        80% { transform: translateX(-50%) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
      }
      @keyframes healthPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes powerUpSlide {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes powerUpPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes powerUpFade {
        to { opacity: 0; transform: translateX(20px); }
      }
    `;
    document.head.appendChild(style);
  }

  private createMuteButton(): void {
    this.muteButton = document.createElement('button');
    this.muteButton.id = 'mute-button';
    this.muteButton.className = 'hud-element mute-button';
    this.muteButton.innerHTML = '🔊';
    this.muteButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: transparent;
      border: 1px solid #40C0FF;
      color: #40C0FF;
      padding: 8px 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 16px;
      cursor: pointer;
      pointer-events: auto;
      text-shadow: 0 0 10px #40C0FF;
      transition: all 0.3s;
    `;

    this.muteButton.addEventListener('mouseenter', () => {
      this.muteButton!.style.background = '#40C0FF';
      this.muteButton!.style.color = '#000';
    });

    this.muteButton.addEventListener('mouseleave', () => {
      this.muteButton!.style.background = 'transparent';
      this.muteButton!.style.color = '#40C0FF';
    });

    this.muteButton.addEventListener('click', () => {
      const isMuted = this.audioManager.toggleMute();
      this.muteButton!.innerHTML = isMuted ? '🔇' : '🔊';
      this.soundGenerator.playClickSound();
    });

    document.getElementById('ui-layer')?.appendChild(this.muteButton);
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.WAVE_START, (config: any) => {
      this.triggerWaveTransition(() => {
        this.updateWave(config.waveNumber, config.act);
        if (config.narration) {
          this.showNarration(config.narration);
        }

        // Start Act III music when entering Act III
        if (config.act === 3 && !this.musicGenerator.isMusicPlaying()) {
          this.musicGenerator.startActIIIMusic();
        } else if (config.act < 3 && this.musicGenerator.isMusicPlaying()) {
          this.musicGenerator.stopActIIIMusic();
        }
      });
    });

    // ADDICTIVE: Score changed with combo info
    eventBus.on(GameEvent.SCORE_CHANGED, (data: any) => {
      if (data && typeof data === 'object') {
        this.updateScoreInfo(data);
      } else {
        this.score = data;
        this.updateScore();
      }
    });

    eventBus.on(GameEvent.CONVERGENCE_ACHIEVED, () => {
      this.lockIndicator.classList.add('active');
    });

    eventBus.on(GameEvent.WAVE_COMPLETE, () => {
      this.soundGenerator.playWaveCompleteSound();
    });

    // Combo lost
    eventBus.on('combo:lost', (data: any) => {
      this.showFloatingText('COMBO LOST', '#FF0040');
    });

    // Perfect wave
    eventBus.on('wave:perfect', (data: any) => {
      this.showMilestone(`PERFECT WAVE! +${data.bonus}`);
    });

    // Milestones
    eventBus.on('milestone:show', (data: any) => {
      this.showMilestone(data.text);
    });

    // Critical hit effect
    eventBus.on('effect:critical', () => {
      this.showFloatingText('CRITICAL!', '#FF0040');
    });

    // Player damaged
    eventBus.on('player:damaged', () => {
      this.showFloatingText('HIT!', '#FF0040');
      this.triggerScreenshake();
    });

    // Health changed
    eventBus.on(GameEvent.HEALTH_CHANGED, (state: HealthState) => {
      this.updateHealth(state);
    });

    // Player healed
    eventBus.on(GameEvent.PLAYER_HEALED, (data: any) => {
      this.showFloatingText(`+${data.healAmount} HP`, '#40C0FF');
    });

    // Power-up state changed
    eventBus.on('powerup:state', (powerUps: ActivePowerUp[]) => {
      this.updatePowerUps(powerUps);
    });

    // Power-up activated
    eventBus.on('powerup:activated', (data: any) => {
      this.showFloatingText(`${data.name}`, '#00FF00');
    });

    // Power-up expired
    eventBus.on('powerup:expired', (data: any) => {
      this.removePowerUpDisplay(data.type);
    });

    // Abilities state changed
    eventBus.on('abilities:state', (states: AbilityState[]) => {
      this.updateAbilities(states);
    });

    // Enemy destroyed for kill feed
    eventBus.on(GameEvent.ENEMY_DESTROYED, (data: any) => {
      this.addKillFeedItem(data);
    });

    // Update aim indicator when player aims
    eventBus.on('player:aim', (angle: number) => {
      this.updateAimIndicator(angle);
    });
  }

  /**
   * Update aim indicator to show where player is pointing
   */
  private updateAimIndicator(angle: number): void {
    if (this.aimIndicator) {
      // Convert angle to degrees and add 90 to offset
      const degrees = (angle * 180 / Math.PI) + 90;
      this.aimIndicator.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
    }
  }

  /**
   * Update score with combo/multiplier info - THE ADDICTIVE LOOP
   */
  updateScoreInfo(info: ScoreInfo): void {
    this.score = info.score;
    this.updateScore();
    this.updateCombo(info.combo, info.multiplier, info.comboTimer);
    this.updateStreak(info.streak);
    this.highScore = Math.max(this.highScore, info.highScore);
    this.highScoreDisplay.innerHTML = `HI: ${this.highScore}`;
  }

  /**
   * Update combo display with visual flair
   */
  private updateCombo(combo: number, multiplier: number, timer: number): void {
    this.currentCombo = combo;
    this.currentMultiplier = multiplier;
    this.comboTimer = timer;

    // Update combo number
    const comboNumber = this.comboDisplay.querySelector('.combo-number') as HTMLElement;
    comboNumber.textContent = combo.toString();

    // Update combo bar (timer visualization)
    const barWidth = (timer / 2.5) * 150; // Max width 150px
    this.comboBar.style.width = `${barWidth}px`;

    // Show/hide combo display
    if (combo > 1) {
      this.comboDisplay.style.opacity = '1';
      this.comboDisplay.style.transform = 'scale(1)';

      // Color intensifies with combo
      const colors = ['#40C0FF', '#FFB000', '#FF8000', '#FF0040'];
      const colorIndex = Math.min(Math.floor(combo / 5), colors.length - 1);
      const color = colors[colorIndex];
      this.comboDisplay.style.color = color;
      this.comboBar.style.background = `linear-gradient(90deg, ${color}, #FF0040)`;

      // Pop animation on milestone combos
      if (combo % 5 === 0) {
        this.comboDisplay.classList.add('combo-pop');
        setTimeout(() => this.comboDisplay.classList.remove('combo-pop'), 300);
      }
    } else {
      this.comboDisplay.style.opacity = '0';
      this.comboDisplay.style.transform = 'scale(0.8)';
    }

    // Update multiplier
    this.multiplierDisplay.innerHTML = `×${multiplier}`;
    if (multiplier > 1) {
      this.multiplierDisplay.style.opacity = '1';

      // Scale multiplier with value
      const scale = 1 + (multiplier - 1) * 0.1;
      this.multiplierDisplay.style.fontSize = `${36 * scale}px`;

      // Color changes
      if (multiplier >= 5) {
        this.multiplierDisplay.style.color = '#FF0040';
        this.multiplierDisplay.style.textShadow = '0 0 30px #FF0040';
      } else if (multiplier >= 2) {
        this.multiplierDisplay.style.color = '#FFB000';
        this.multiplierDisplay.style.textShadow = '0 0 20px #FFB000';
      } else {
        this.multiplierDisplay.style.color = '#40C0FF';
        this.multiplierDisplay.style.textShadow = '0 0 15px #40C0FF';
      }

      // Pulse on multiplier change
      if (multiplier !== this.currentMultiplier) {
        this.multiplierDisplay.classList.add('multiplier-pulse');
        setTimeout(() => this.multiplierDisplay.classList.remove('multiplier-pulse'), 500);
      }
    } else {
      this.multiplierDisplay.style.opacity = '0';
    }
  }

  /**
   * Update streak display
   */
  private updateStreak(streak: number): void {
    this.currentStreak = streak;
    const streakNumber = this.streakDisplay.querySelector('.streak-number') as HTMLElement;
    streakNumber.textContent = streak.toString();

    if (streak >= 3) {
      this.streakDisplay.style.opacity = '1';

      // More fire with higher streaks
      const fireCount = Math.min(Math.floor(streak / 3), 5);
      let fireEmoji = '🔥'.repeat(fireCount);
      const streakIcon = this.streakDisplay.querySelector('.streak-icon') as HTMLElement;
      streakIcon.textContent = fireEmoji;

      // Size increases
      const scale = 1 + Math.min(streak * 0.05, 0.5);
      this.streakDisplay.style.transform = `scale(${scale})`;

      if (streak % 5 === 0) {
        this.streakDisplay.classList.add('streak-fire');
        setTimeout(() => this.streakDisplay.classList.remove('streak-fire'), 300);
      }
    } else {
      this.streakDisplay.style.opacity = '0';
    }
  }

  /**
   * Add item to kill feed
   */
  private addKillFeedItem(data: any): void {
    const item = document.createElement('div');
    item.className = 'kill-feed-item hud-element';
    item.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      padding: 5px 10px;
      border-left: 2px solid ${data.crit ? '#FF0040' : '#40C0FF'};
      font-size: 12px;
    `;

    const points = data.points || 100;
    const combo = data.combo || 0;
    const crit = data.crit || false;

    item.innerHTML = `
      <span style="color: ${crit ? '#FF0040' : '#40C0FF'}">${crit ? '⚡' : '💀'}</span>
      +${points}
      ${combo > 1 ? `<span style="color: #FFB000;">×${combo}</span>` : ''}
    `;

    this.killFeed.appendChild(item);

    // Remove after animation
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 3000);
  }

  /**
   * Show milestone popup - MAJOR dopamine hit
   */
  private showMilestone(text: string): void {
    this.milestoneDisplay.innerHTML = text;
    this.milestoneDisplay.style.transform = 'translateX(-50%) scale(1)';
    this.milestoneDisplay.style.opacity = '1';

    // Play milestone sound
    this.soundGenerator.playMilestoneSound?.();

    setTimeout(() => {
      this.milestoneDisplay.style.transform = 'translateX(-50%) scale(0)';
      this.milestoneDisplay.style.opacity = '0';
    }, 2000);
  }

  /**
   * Show floating combat text
   */
  private showFloatingText(text: string, color: string): void {
    const floating = document.createElement('div');
    floating.className = 'floating-text';
    floating.textContent = text;
    floating.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: ${color};
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 0 10px ${color};
      z-index: 15;
      pointer-events: none;
    `;

    document.getElementById('ui-layer')?.appendChild(floating);

    setTimeout(() => {
      if (floating.parentNode) {
        floating.parentNode.removeChild(floating);
      }
    }, 1000);
  }

  updateConvergence(convergence: number): void {
    const percentage = Math.floor(convergence * 100);
    this.convergenceValue.textContent = `${percentage}%`;

    // Color based on convergence level
    if (convergence >= 0.95) {
      this.convergenceValue.style.color = '#FF0040';
      this.convergenceValue.style.textShadow = '0 0 20px #FF0040';
    } else if (convergence >= 0.7) {
      this.convergenceValue.style.color = '#FFB000';
      this.convergenceValue.style.textShadow = '0 0 15px #FFB000';
    } else {
      this.convergenceValue.style.color = '#40C0FF';
      this.convergenceValue.style.textShadow = '0 0 10px #40C0FF';
    }

    if (convergence < 0.7) {
      this.lockIndicator.classList.remove('active');
    }
  }

  updateWave(wave: number, act: number): void {
    this.waveNumber.textContent = wave.toString();
    this.currentAct = act;

    const actNames = ['ACT I: CONTACT', 'ACT II: ESCALATION', 'ACT III: COLLAPSE'];
    this.actDisplay.textContent = actNames[act - 1] || `ACT ${act}`;

    this.applyActEffects(act);
  }

  updateScore(): void {
    this.scoreValue.textContent = this.score.toString();
  }

  updateDepth(depth: number, entityCount: number): void {
    this.depthValue.textContent = Math.floor(depth).toString();
    this.entityCount.textContent = entityCount.toString();
  }

  showNarration(text: string): void {
    this.narration.textContent = text;
    this.narration.classList.add('visible');

    setTimeout(() => {
      this.narration.classList.remove('visible');
    }, 4000);
  }

  triggerFlash(): void {
    this.flash.classList.add('active');
    setTimeout(() => {
      this.flash.classList.remove('active');
    }, 200);
  }

  triggerScreenshake(): void {
    this.gameContainer.classList.add('screenshake');
    setTimeout(() => {
      this.gameContainer.classList.remove('screenshake');
    }, 300);
  }

  triggerWaveTransition(callback: () => void): void {
    this.waveTransition.classList.add('active');
    setTimeout(() => {
      callback();
      setTimeout(() => {
        this.waveTransition.classList.remove('active');
      }, 100);
    }, 1000);
  }

  applyActEffects(act: number): void {
    this.actDisplay.classList.remove('glitch-text');
    this.gameContainer.classList.remove('act-iii-flicker');

    if (act === 3) {
      this.actDisplay.classList.add('glitch-text');
      this.gameContainer.classList.add('act-iii-flicker');
    }
  }

  private loadHighScore(): void {
    try {
      const data = localStorage.getItem('parallax_stats');
      if (data) {
        const parsed = JSON.parse(data);
        this.highScore = parsed.highScore || 0;
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Create health display with hearts
   */
  private createHealthDisplay(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    // Health container (bottom left, above mute button)
    this.healthContainer = document.createElement('div');
    this.healthContainer.className = 'health-container';
    this.healthContainer.style.cssText = `
      position: absolute;
      bottom: 60px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      z-index: 10;
    `;

    // Health label
    const healthLabel = document.createElement('div');
    healthLabel.textContent = 'INTEGRITY';
    healthLabel.style.cssText = `
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    `;
    this.healthContainer.appendChild(healthLabel);

    // Health bar background
    const healthBarBg = document.createElement('div');
    healthBarBg.style.cssText = `
      width: 150px;
      height: 8px;
      background: rgba(255, 0, 64, 0.2);
      border: 1px solid #FF0040;
      border-radius: 4px;
      overflow: hidden;
    `;

    // Health bar fill
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'health-bar-fill';
    this.healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #FF0040, #FF4080);
      box-shadow: 0 0 10px #FF0040;
      transition: width 0.3s ease-out, background 0.3s;
    `;
    healthBarBg.appendChild(this.healthBar);
    this.healthContainer.appendChild(healthBarBg);

    // Health hearts (for visual representation)
    const heartsContainer = document.createElement('div');
    heartsContainer.style.cssText = `
      display: flex;
      gap: 5px;
      margin-top: 5px;
    `;
    this.healthHearts = [];
    for (let i = 0; i < this.maxHealth; i++) {
      const heart = document.createElement('span');
      heart.textContent = '◆';
      heart.style.cssText = `
        font-size: 14px;
        color: #FF0040;
        text-shadow: 0 0 5px #FF0040;
        transition: all 0.3s;
      `;
      heartsContainer.appendChild(heart);
      this.healthHearts.push(heart);
    }
    this.healthContainer.appendChild(heartsContainer);

    uiLayer.appendChild(this.healthContainer);
  }

  /**
   * Update health display
   */
  private updateHealth(state: HealthState): void {
    this.currentHealth = state.currentHealth;
    this.maxHealth = state.maxHealth;

    // Update health bar
    const healthPercent = (this.currentHealth / this.maxHealth) * 100;
    this.healthBar.style.width = `${healthPercent}%`;

    // Change color based on health
    if (healthPercent > 66) {
      this.healthBar.style.background = 'linear-gradient(90deg, #FF0040, #FF4080)';
      this.healthBar.style.boxShadow = '0 0 10px #FF0040';
    } else if (healthPercent > 33) {
      this.healthBar.style.background = 'linear-gradient(90deg, #FFB000, #FF4040)';
      this.healthBar.style.boxShadow = '0 0 10px #FFB000';
    } else {
      this.healthBar.style.background = 'linear-gradient(90deg, #FF0000, #FF4040)';
      this.healthBar.style.boxShadow = '0 0 15px #FF0000';
    }

    // Update hearts
    this.healthHearts.forEach((heart, index) => {
      if (index < this.currentHealth) {
        heart.style.opacity = '1';
        heart.style.color = '#FF0040';
        heart.style.textShadow = '0 0 5px #FF0040';
      } else {
        heart.style.opacity = '0.3';
        heart.style.color = '#333';
        heart.style.textShadow = 'none';
      }
    });

    // Invulnerability flash effect
    if (state.isInvulnerable) {
      this.healthBar.style.animation = 'healthPulse 0.5s ease-in-out infinite';
    } else {
      this.healthBar.style.animation = '';
    }
  }

  /**
   * Create power-up display area
   */
  private createPowerUpDisplay(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    this.powerUpContainer = document.createElement('div');
    this.powerUpContainer.className = 'powerup-container';
    this.powerUpContainer.style.cssText = `
      position: absolute;
      bottom: 60px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      align-items: flex-end;
      z-index: 10;
    `;

    const label = document.createElement('div');
    label.textContent = 'ACTIVE SYSTEMS';
    label.style.cssText = `
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    `;
    this.powerUpContainer.appendChild(label);

    uiLayer.appendChild(this.powerUpContainer);
  }

  /**
   * Update active power-ups display
   */
  private updatePowerUps(powerUps: ActivePowerUp[]): void {
    // Clear current displays
    for (const [type, element] of this.activePowerUps) {
      let found = false;
      for (const pu of powerUps) {
        if (pu.type === type) {
          found = true;
          break;
        }
      }
      if (!found) {
        element.remove();
        this.activePowerUps.delete(type);
      }
    }

    // Add/update displays
    for (const pu of powerUps) {
      if (!this.activePowerUps.has(pu.type)) {
        this.createPowerUpElement(pu);
      } else {
        this.updatePowerUpElement(pu);
      }
    }
  }

  /**
   * Create a power-up status element
   */
  private createPowerUpElement(pu: ActivePowerUp): void {
    const element = document.createElement('div');
    element.className = 'powerup-status';
    element.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #00FF00;
      border-radius: 4px;
      animation: powerUpSlide 0.3s ease-out;
    `;

    const icon = document.createElement('span');
    icon.textContent = '⚡';
    icon.style.fontSize = '14px';

    const name = document.createElement('span');
    name.textContent = pu.name || pu.type.toString();
    name.style.cssText = `
      font-size: 11px;
      color: #00FF00;
      font-weight: bold;
    `;

    const timer = document.createElement('span');
    timer.textContent = Math.ceil(pu.timeRemaining) + 's';
    timer.className = 'powerup-timer';
    timer.style.cssText = `
      font-size: 10px;
      color: #FFF;
      min-width: 25px;
      text-align: right;
    `;

    element.appendChild(icon);
    element.appendChild(name);
    element.appendChild(timer);

    this.powerUpContainer.appendChild(element);
    this.activePowerUps.set(pu.type, element);
  }

  /**
   * Update existing power-up element
   */
  private updatePowerUpElement(pu: ActivePowerUp): void {
    const element = this.activePowerUps.get(pu.type);
    if (element) {
      const timer = element.querySelector('.powerup-timer') as HTMLElement;
      if (timer) {
        timer.textContent = Math.ceil(pu.timeRemaining) + 's';
      }

      // Pulse when low
      if (pu.timeRemaining < 3) {
        element.style.animation = 'powerUpPulse 0.5s ease-in-out infinite';
      }
    }
  }

  /**
   * Remove power-up display
   */
  private removePowerUpDisplay(type: string): void {
    const element = this.activePowerUps.get(type);
    if (element) {
      element.style.animation = 'powerUpFade 0.3s ease-out forwards';
      setTimeout(() => {
        element.remove();
        this.activePowerUps.delete(type);
      }, 300);
    }
  }

  /**
   * Create ability display area
   */
  private createAbilityDisplay(): void {
    const uiLayer = document.getElementById('ui-layer')!;

    this.abilityContainer = document.createElement('div');
    this.abilityContainer.className = 'ability-container';
    this.abilityContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      z-index: 10;
    `;

    uiLayer.appendChild(this.abilityContainer);
  }

  /**
   * Update abilities display
   */
  private updateAbilities(states: AbilityState[]): void {
    for (const state of states) {
      const abilityKey = state.type.toString();
      let element = this.abilityIcons.get(abilityKey);

      if (!element) {
        element = this.createAbilityElement(state);
        this.abilityIcons.set(abilityKey, element);
      }

      this.updateAbilityElement(state, element);
    }
  }

  /**
   * Create an ability icon element
   */
  private createAbilityElement(state: AbilityState): HTMLElement {
    const element = document.createElement('div');
    element.className = 'ability-icon';
    element.style.cssText = `
      position: relative;
      width: 50px;
      height: 50px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid ${this.getAbilityColor(state.type)};
      border-radius: 8px;
      transition: all 0.2s;
    `;

    // Icon/key
    const icon = document.createElement('div');
    icon.textContent = this.getAbilityKey(state.type);
    icon.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #FFF;
      z-index: 2;
    `;

    // Cooldown overlay
    const cooldown = document.createElement('div');
    cooldown.className = 'ability-cooldown';
    cooldown.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0%;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 6px;
      transition: height 0.1s linear;
    `;

    // Active indicator
    const active = document.createElement('div');
    active.className = 'ability-active';
    active.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      width: 15px;
      height: 15px;
      background: #FF0040;
      border-radius: 50%;
      display: none;
      box-shadow: 0 0 10px #FF0040;
    `;

    element.appendChild(icon);
    element.appendChild(cooldown);
    element.appendChild(active);
    this.abilityContainer.appendChild(element);

    return element;
  }

  /**
   * Update ability element state
   */
  private updateAbilityElement(state: AbilityState, element: HTMLElement): void {
    const cooldown = element.querySelector('.ability-cooldown') as HTMLElement;
    const active = element.querySelector('.ability-active') as HTMLElement;

    // Update cooldown overlay
    if (state.cooldownRemaining > 0) {
      const percent = (state.cooldownRemaining / this.getAbilityCooldown(state.type)) * 100;
      cooldown.style.height = `${percent}%`;
      element.style.opacity = '0.5';
    } else {
      cooldown.style.height = '0%';
      element.style.opacity = '1';
    }

    // Update active indicator
    if (state.isActive) {
      active.style.display = 'block';
      element.style.boxShadow = `0 0 20px ${this.getAbilityColor(state.type)}`;
    } else {
      active.style.display = 'none';
      element.style.boxShadow = 'none';
    }
  }

  private getAbilityColor(type: string): string {
    const colors: Record<string, string> = {
      emp_bomb: '#FF0040',
      time_slow: '#8000FF',
      overcharge: '#FFFF00'
    };
    return colors[type] || '#40C0FF';
  }

  private getAbilityKey(type: string): string {
    const keys: Record<string, string> = {
      emp_bomb: 'Q',
      time_slow: 'E',
      overcharge: 'R'
    };
    return keys[type] || '?';
  }

  private getAbilityCooldown(type: string): number {
    const cooldowns: Record<string, number> = {
      emp_bomb: 30,
      time_slow: 20,
      overcharge: 25
    };
    return cooldowns[type] || 30;
  }

  dispose(): void {
    this.musicGenerator.dispose();
    this.soundGenerator.dispose();
  }
}
