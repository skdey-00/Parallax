import * as THREE from 'three';
import { GameScene } from './world/Scene.js';
import { GameCamera } from './world/Camera.js';
import { Player } from './entities/Player.js';
import { WaveManager } from './systems/WaveManager.js';
import { ConvergenceSystem } from './systems/Convergence.js';
import { CombatSystem } from './systems/Combat.js';
import { HealthSystem } from './systems/HealthSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';
import { PowerUpTutorial } from './systems/PowerUpTutorial.js';
import { AbilitySystem } from './systems/AbilitySystem.js';
import { HazardSystem } from './systems/HazardSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { BossSystem } from './systems/BossSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { IntroSlideshow } from './ui/IntroSlideshow.js';
import { DeltaTime } from './utils/DeltaTime.js';
import { eventBus, GameEvent } from './core/EventBus.js';
import { COLORS } from './core/Constants.js';
import { EffectsAssets } from './assets/EffectsAssets.js';
import { AudioManager } from './audio/AudioManager.js';
import { SoundGenerator } from './audio/SoundGenerator.js';
import { ScoringSystem } from './systems/ScoringSystem.js';
import { POWER_UP_NAMES } from './core/PowerUpTypes.js';
import { ABILITIES } from './systems/AbilitySystem.js';

class Game {
  private scene: GameScene;
  private camera: GameCamera;
  private player: Player;
  private waveManager: WaveManager;
  private convergenceSystem: ConvergenceSystem;
  private combatSystem: CombatSystem;
  private healthSystem: HealthSystem;
  private powerUpSystem: PowerUpSystem;
  private powerUpTutorial: PowerUpTutorial;
  private abilitySystem: AbilitySystem;
  private hazardSystem: HazardSystem;
  private achievementSystem: AchievementSystem;
  private bossSystem: BossSystem;
  private weaponSystem: WeaponSystem;
  private hud: HUD;
  private menu: Menu;
  private introSlideshow: IntroSlideshow;
  private deltaTime: DeltaTime;
  private audioManager: AudioManager;
  private soundGenerator: SoundGenerator;
  private scoringSystem: ScoringSystem;
  private isPlaying: boolean = false;
  private animationId: number | null = null;
  private mousePressed: boolean = false;
  private lastFireTime: number = 0;

  constructor() {
    // Initialize Three.js
    const container = document.getElementById('game-container');
    if (!container) throw new Error('Game container not found');

    // Initialize audio system
    this.audioManager = AudioManager.getInstance();
    this.soundGenerator = new SoundGenerator();

    // Initialize systems
    this.scene = new GameScene();
    this.camera = new GameCamera();
    this.player = new Player();
    this.waveManager = new WaveManager(this.scene.getThreeScene());
    this.convergenceSystem = new ConvergenceSystem(this.camera.getThreeCamera());
    this.combatSystem = new CombatSystem(this.scene.getThreeScene());
    this.healthSystem = new HealthSystem();
    this.powerUpSystem = new PowerUpSystem(this.scene.getThreeScene());
    this.powerUpTutorial = new PowerUpTutorial();
    this.abilitySystem = new AbilitySystem();
    this.hazardSystem = new HazardSystem(this.scene.getThreeScene());
    this.achievementSystem = new AchievementSystem();
    this.bossSystem = new BossSystem(this.scene.getThreeScene());
    this.weaponSystem = new WeaponSystem(this.scene.getThreeScene());
    this.scoringSystem = new ScoringSystem();
    this.hud = new HUD();
    this.introSlideshow = new IntroSlideshow();
    this.menu = new Menu();
    this.deltaTime = new DeltaTime();

    // Initialize effects system
    EffectsAssets.initialize(this.scene.getThreeScene());

    // Add player to scene
    this.scene.getThreeScene().add(this.player.getMesh());

    // Setup event listeners
    this.setupEventListeners();
    this.setupInput();

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());

    // Play intro slideshow before showing menu
    this.introSlideshow.play().then(() => {
      // Menu is already visible, intro just overlays it
    });

    // Initial render
    this.render();
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.GAME_START, async () => {
      // Initialize audio on first user interaction
      await this.audioManager.initialize();
      await this.audioManager.resumeIfNeeded();

      // Start ambient drone
      this.soundGenerator.startAmbience();

      // Play click sound
      this.soundGenerator.playClickSound();

      this.startGame();
    });

    eventBus.on(GameEvent.GAME_OVER, () => {
      this.gameOver();
    });

    eventBus.on(GameEvent.WAVE_COMPLETE, (wave: number) => {
      // ADDICTIVE: Wave complete bonus
      const bonus = this.scoringSystem.onWaveComplete(wave);
      this.soundGenerator.playWaveCompleteSound();

      // Check if boss should spawn
      if (wave === 3 || wave === 7 || wave % 10 === 0) {
        const act = wave === 3 ? 1 : wave === 7 ? 2 : 3;
        setTimeout(() => {
          if (this.isPlaying) {
            this.bossSystem.spawnBoss(act);
          }
        }, 2000);
      }

      // Start next wave after delay
      setTimeout(() => {
        if (this.isPlaying) {
          this.waveManager.startNextWave();
        }
      }, 3000);
    });

    eventBus.on(GameEvent.CONVERGENCE_ACHIEVED, (enemyId: string) => {
      // Auto-fire when converged
      if (this.mousePressed) {
        this.tryFire();
      }
    });

    eventBus.on(GameEvent.ENEMY_SPAWNED, (position: THREE.Vector3) => {
      // Spawn effect
      EffectsAssets.createBurst(position, COLORS.DEPTH_BLUE);
    });

    // Target locked state for crosshair feedback
    eventBus.on('target:state', (state: any) => {
      this.player.setTargetLocked(state.isLocked);
    });

    // Player death - trigger game over
    eventBus.on(GameEvent.PLAYER_DIED, () => {
      this.gameOver();
    });

    // Power-up collected
    eventBus.on('powerup:collected', (data: any) => {
      const typeName = data.type as keyof typeof POWER_UP_NAMES;
      this.showFloatingText(`${POWER_UP_NAMES[typeName]}!`, '#00FF00');
    });

    // Shield status
    eventBus.on('player:shield', (data: any) => {
      if (data.active) {
        this.showFloatingText('SHIELD ACTIVE', '#00FFFF');
      }
    });

    // Ability activated
    eventBus.on('ability:activated', (data: any) => {
      const typeKey = data.type as keyof typeof ABILITIES;
      this.showFloatingText(`${data.name}!`, ABILITIES[typeKey].color);
    });

    // EMP Bomb - destroy all enemies
    eventBus.on('ability:emp', () => {
      this.triggerEMP();
    });

    // Overcharge - rapid fire
    eventBus.on('ability:overcharge', (data: any) => {
      this.showFloatingText('RAPID FIRE!', '#FFFF00');
    });

    // Achievement unlocked
    eventBus.on('achievement:unlocked', (achievement: any) => {
      this.showAchievementNotification(achievement);
    });
  }

  private setupInput(): void {
    // Mouse/Touch input for firing
    window.addEventListener('mousedown', () => {
      this.mousePressed = true;
      this.tryFire();
    });

    window.addEventListener('mouseup', () => {
      this.mousePressed = false;
    });

    // Keyboard input for firing and weapon switching
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.tryFire();
      }
      // Switch weapons with Tab
      if (e.code === 'Tab') {
        e.preventDefault();
        this.weaponSystem.cycleWeapon();
      }
    });
  }

  private tryFire(): void {
    if (!this.isPlaying) return;

    const convergedTarget = this.convergenceSystem.getConvergedEnemy();

    // Check if converged on a power-up first
    const powerUpId = this.powerUpSystem.checkCollection(
      this.player.getAimPosition(),
      this.camera.getThreeCamera()
    );

    if (powerUpId && convergedTarget === powerUpId) {
      // Collect the power-up when space is pressed
      this.powerUpSystem.collectPowerUp(powerUpId);
      // Remove from convergence system
      this.convergenceSystem.removeEnemy(powerUpId);
      return;
    }

    if (!convergedTarget) return;

    // Get convergence data for scoring
    const convergenceData = this.convergenceSystem.getConvergenceData(convergedTarget);
    const isCrit = convergenceData && convergenceData.alignment >= 0.98;

    // Use weapon system to fire
    if (this.weaponSystem.fire(this.player.getPosition(), convergedTarget)) {
      // Get convergence data for scoring
      const convergenceData = this.convergenceSystem.getConvergenceData(convergedTarget);
      const isCrit = convergenceData && convergenceData.alignment >= 0.98;

      // Check if enemy is destroyed
      const enemy = this.waveManager.getEnemy(convergedTarget);
      if (enemy) {
        const destroyed = enemy.takeDamage();
        if (destroyed) {
          // ADDICTIVE: Score with combo system
          const points = this.scoringSystem.onEnemyDestroyed(
            convergenceData?.alignment || 0.95,
            enemy.getType().toString(),
            isCrit || false
          );

          // Emit kill event for HUD kill feed
          eventBus.emit(GameEvent.ENEMY_DESTROYED, {
            points,
            combo: this.scoringSystem.getScoreInfo().combo,
            crit: isCrit
          });

          // Enhanced destruction effects
          EffectsAssets.createBurst(enemy.getPosition(), COLORS.THREAT_RED);
          EffectsAssets.createEnemyFragmentation(enemy.getPosition(), COLORS.THREAT_RED);
          this.combatSystem.createExplosion(
            enemy.getPosition(),
            COLORS.THREAT_RED,
            this.scene.getThreeScene()
          );

          // Critical hit gets extra effects
          if (isCrit) {
            eventBus.emit('effect:critical', {});
          }

          this.waveManager.destroyEnemy(convergedTarget);
          this.convergenceSystem.removeEnemy(convergedTarget);
        }
      }

      // Check if boss target is hit (shield or core)
      const boss = this.bossSystem.getCurrentBoss();
      if (boss && this.bossSystem.isBossTarget(convergedTarget)) {
        const wasDestroyed = this.bossSystem.damageTarget(convergedTarget);

        // Visual feedback
        const hitPos = this.bossSystem.getTargetPosition(convergedTarget);
        if (hitPos) {
          if (convergedTarget.includes('_shield_')) {
            EffectsAssets.createBurst(hitPos, 0x00FFFF);
          } else if (convergedTarget.includes('_core')) {
            EffectsAssets.createBurst(hitPos, 0xFF0040);
          }
        }

        if (wasDestroyed && !boss.isAlive()) {
          // Boss defeated bonus
          const bonusPoints = 5000;
          this.scoringSystem.onEnemyDestroyed(1.0, 'boss', true);
          eventBus.emit(GameEvent.ENEMY_DESTROYED, {
            points: bonusPoints,
            combo: 0,
            crit: true
          });

          // Spawn effect
          EffectsAssets.createBurst(boss.getPosition(), COLORS.AMBER);
        }
      }
    }
  }

  private startGame(): void {
    this.isPlaying = true;
    this.scoringSystem.reset();
    this.healthSystem.reset();
    this.powerUpSystem.reset();
    this.powerUpTutorial.reset();
    this.abilitySystem.reset();
    this.achievementSystem.reset();
    this.bossSystem.reset();
    this.weaponSystem.reset();
    this.waveManager.startNextWave();
  }

  private showAchievementNotification(achievement: any): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%) scale(0);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #FFB000;
      border-radius: 10px;
      padding: 20px 40px;
      text-align: center;
      z-index: 100;
      animation: achievementPop 0.5s ease-out forwards;
    `;

    notification.innerHTML = `
      <div style="font-size: 40px;">${achievement.icon}</div>
      <div style="color: #FFB000; font-size: 14px; margin-top: 5px;">ACHIEVEMENT UNLOCKED</div>
      <div style="color: #FFF; font-size: 18px; font-weight: bold; margin-top: 5px;">${achievement.name}</div>
    `;

    document.getElementById('game-container')?.appendChild(notification);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes achievementPop {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }
      @keyframes achievementFade {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      notification.style.animation = 'achievementFade 0.5s ease-out forwards';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 500);
    }, 3000);
  }

  private triggerEMP(): void {
    // Get all enemies
    const enemies = this.waveManager.getEnemies();
    const enemyIds = Array.from(enemies.keys());

    // Destroy all enemies with bonus points
    enemyIds.forEach(id => {
      const enemy = enemies.get(id);
      if (enemy) {
        // Create explosion effect
        EffectsAssets.createBurst(enemy.getPosition(), COLORS.THREAT_RED);
        EffectsAssets.createEnemyFragmentation(enemy.getPosition(), COLORS.THREAT_RED);

        // Grant bonus points
        this.scoringSystem.onEnemyDestroyed(1.0, enemy.getType().toString(), true);

        // Remove enemy
        this.waveManager.destroyEnemy(id);
        this.convergenceSystem.removeEnemy(id);
      }
    });

    // Screen flash
    this.hud.triggerFlash();

    // Play sound
    this.soundGenerator.playWaveCompleteSound();
  }

  private gameOver(): void {
    this.isPlaying = false;

    // ADDICTIVE: Show final stats and save high score
    const stats = this.scoringSystem.onGameOver();
    this.showGameOverStats(stats);

    this.menu.show();
  }

  private showGameOverStats(stats: any): void {
    // Create game over overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 30;
      animation: fadeIn 0.5s ease-out;
    `;

    const isNewHigh = stats.isNewHigh;
    overlay.innerHTML = `
      <div style="text-align: center;">
        <h1 style="color: #FF0040; font-size: 64px; text-shadow: 0 0 30px #FF0040; margin-bottom: 20px;">
          GAME OVER
        </h1>
        ${isNewHigh ? `
          <h2 style="color: #FFB000; font-size: 32px; text-shadow: 0 0 20px #FFB000; margin-bottom: 30px; animation: pulse 0.5s ease-in-out infinite;">
            🏆 NEW HIGH SCORE! 🏆
          </h2>
        ` : `
          <div style="color: #666; font-size: 18px; margin-bottom: 10px;">HIGH SCORE: ${stats.highScore}</div>
        `}
        <div style="color: #40C0FF; font-size: 48px; text-shadow: 0 0 20px #40C0FF; margin-bottom: 30px;">
          SCORE: ${stats.score}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="color: #FFB000;">MAX COMBO</div>
          <div style="color: #fff;">${stats.combo}</div>
          <div style="color: #FFB000;">MAX STREAK</div>
          <div style="color: #fff;">${stats.streak}</div>
          <div style="color: #FFB000;">KILLS</div>
          <div style="color: #fff;">${stats.kills}</div>
          <div style="color: #FFB000;">GAMES</div>
          <div style="color: #fff;">${stats.gamesPlayed}</div>
        </div>
        <button id="retry-button" style="
          background: transparent;
          border: 2px solid #40C0FF;
          color: #40C0FF;
          padding: 15px 40px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s;
        ">
          RETRY
        </button>
      </div>
    `;

    document.getElementById('game-container')?.appendChild(overlay);

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    // Retry button
    const retryButton = overlay.querySelector('#retry-button') as HTMLElement;
    retryButton.addEventListener('click', () => {
      overlay.remove();
      this.startGame();
    });

    retryButton.addEventListener('mouseenter', () => {
      retryButton.style.background = '#40C0FF';
      retryButton.style.color = '#000';
    });

    retryButton.addEventListener('mouseleave', () => {
      retryButton.style.background = 'transparent';
      retryButton.style.color = '#40C0FF';
    });
  }

  private onResize(): void {
    this.camera.onResize(window.innerWidth, window.innerHeight);
  }

  private update(): void {
    const delta = this.deltaTime.getDelta();

    if (this.isPlaying) {
      // Update player
      const playerVelocity = this.player.getMesh().position.clone();
      this.player.update(delta);

      // Create player motion trails when moving fast
      const newPos = this.player.getMesh().position;
      const movement = newPos.clone().sub(playerVelocity);
      if (movement.length() > 0.1) {
        EffectsAssets.createPlayerTrail(newPos, movement);
      }

      // Update camera
      this.camera.update(this.player.getPosition(), delta);

      // Update convergence system with new camera position
      this.convergenceSystem.update(this.camera.getThreeCamera());

      // Update wave manager (spawns enemies)
      this.waveManager.update(delta);

      // Update all enemies
      const enemies = this.waveManager.getEnemies();
      const playerAimPos = this.player.getAimPosition();

      enemies.forEach(enemy => {
        // Calculate convergence based on crosshair position
        const convergenceData = this.convergenceSystem.calculateConvergence(
          enemy.getId(),
          enemy.getPosition(),
          playerAimPos
        );

        // Update enemy with convergence data
        enemy.update(delta, this.player.getPosition(), convergenceData.alignment);
      });

      // Update boss convergence (if boss is alive)
      const boss = this.bossSystem.getCurrentBoss();
      if (boss) {
        // Add boss shields and core to convergence system
        const targetableIds = this.bossSystem.getTargetableIds();
        targetableIds.forEach(targetId => {
          const targetPos = this.bossSystem.getTargetPosition(targetId);
          if (targetPos) {
            this.convergenceSystem.calculateConvergence(
              targetId,
              targetPos,
              playerAimPos
            );
          }
        });
      }

      // Add power-ups to convergence system (so they can be collected)
      const spawnedPowerUps = this.powerUpSystem.getSpawnedPowerUps();
      spawnedPowerUps.forEach((spawn: any) => {
        this.convergenceSystem.calculateConvergence(
          spawn.id,
          spawn.position,
          playerAimPos
        );
      });

      // Update combat system (particles)
      this.combatSystem.update(delta, this.scene.getThreeScene());

      // Update enhanced effects
      EffectsAssets.update(delta);

      // Update scene (debris)
      this.scene.update(performance.now() / 1000);

      // ADDICTIVE: Update scoring system (combo timers, etc.)
      this.scoringSystem.update(delta);

      // Update health system (invulnerability timers)
      this.healthSystem.update(delta);

      // Update power-up system
      this.powerUpSystem.update(delta);

      // Update ability system
      this.abilitySystem.update(delta);

      // Update hazard system
      this.hazardSystem.update(delta);

      // Update boss system
      this.bossSystem.updateBoss(delta, this.player.getPosition());

      // Update weapon system (projectiles)
      this.weaponSystem.update(delta);

      // Check for hazard collisions
      if (this.hazardSystem.checkCollision(this.player.getPosition())) {
        this.healthSystem.takeDamage(1);
      }

      // Check for power-up collection
      const collectedPowerUp = this.powerUpSystem.checkCollection(
        this.player.getAimPosition(),
        this.camera.getThreeCamera()
      );
      if (collectedPowerUp) {
        this.powerUpSystem.collectPowerUp(collectedPowerUp);
      }

      // Check for enemy-player collisions
      enemies.forEach(enemy => {
        const playerPos = this.player.getPosition();
        const enemyPos = enemy.getPosition();
        const distance = playerPos.distanceTo(enemyPos);

        // Collision threshold (adjust based on enemy size)
        if (distance < 15 && !this.healthSystem.getIsInvulnerable()) {
          this.healthSystem.takeDamage(1, enemy.getId());
        }
      });

      // Update HUD
      const maxConv = this.convergenceSystem.getMaxConvergence();
      this.hud.updateConvergence(maxConv);
      this.convergenceSystem.resetMaxConvergence();

      // ADDICTIVE: Update HUD with score info (combo, multiplier, streak)
      const scoreInfo = this.scoringSystem.getScoreInfo();
      this.hud.updateScoreInfo(scoreInfo);

      // Calculate average depth
      let totalDepth = 0;
      enemies.forEach(e => totalDepth += e.getPosition().z);
      const avgDepth = enemies.size > 0 ? totalDepth / enemies.size : 0;
      this.hud.updateDepth(avgDepth, enemies.size);

      // Pass max convergence to player for visual feedback
      this.player.setConvergence(maxConv);
    }
  }

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
      animation: floatUp 1s ease-out forwards;
    `;

    document.getElementById('ui-layer')?.appendChild(floating);

    setTimeout(() => {
      if (floating.parentNode) {
        floating.parentNode.removeChild(floating);
      }
    }, 1000);
  }

  private render(): void {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('game-container')!.appendChild(renderer.domElement);

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
      renderer.render(this.scene.getThreeScene(), this.camera.getThreeCamera());
    };

    animate();
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.soundGenerator.dispose();
    this.audioManager.dispose();
    this.scene.dispose();
    this.camera.dispose();
    this.player.dispose();
    this.waveManager.dispose();
    this.convergenceSystem.dispose();
    this.combatSystem.dispose();
    this.healthSystem.dispose();
    this.powerUpSystem.dispose();
    this.powerUpTutorial.dispose();
    this.abilitySystem.dispose();
    this.hazardSystem.dispose();
    this.achievementSystem.dispose();
    this.bossSystem.dispose();
    this.weaponSystem.dispose();
    this.scoringSystem.dispose();
    this.hud.dispose();
    this.menu.dispose();
    this.introSlideshow.dispose();
    EffectsAssets.dispose();
  }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
