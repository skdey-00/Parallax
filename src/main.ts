import * as THREE from 'three';
import { GameScene } from './world/Scene.js';
import { GameCamera } from './world/Camera.js';
import { Player } from './entities/Player.js';
import { WaveManager } from './systems/WaveManager.js';
import { ConvergenceSystem } from './systems/Convergence.js';
import { CombatSystem } from './systems/Combat.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { DeltaTime } from './utils/DeltaTime.js';
import { eventBus, GameEvent } from './core/EventBus.js';
import { COLORS } from './core/Constants.js';
import { EffectsAssets } from './assets/EffectsAssets.js';
import { AudioManager } from './audio/AudioManager.js';
import { SoundGenerator } from './audio/SoundGenerator.js';
import { ScoringSystem } from './systems/ScoringSystem.js';

class Game {
  private scene: GameScene;
  private camera: GameCamera;
  private player: Player;
  private waveManager: WaveManager;
  private convergenceSystem: ConvergenceSystem;
  private combatSystem: CombatSystem;
  private hud: HUD;
  private menu: Menu;
  private deltaTime: DeltaTime;
  private audioManager: AudioManager;
  private soundGenerator: SoundGenerator;
  private scoringSystem: ScoringSystem;
  private isPlaying: boolean = false;
  private animationId: number | null = null;
  private mousePressed: boolean = false;

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
    this.scoringSystem = new ScoringSystem();
    this.hud = new HUD();
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

    // Keyboard input for firing
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.tryFire();
      }
    });
  }

  private tryFire(): void {
    if (!this.isPlaying) return;

    const convergedEnemy = this.convergenceSystem.getConvergedEnemy();
    if (convergedEnemy) {
      // Get convergence data for scoring
      const convergenceData = this.convergenceSystem.getConvergenceData(convergedEnemy);
      const isCrit = convergenceData && convergenceData.alignment >= 0.98;

      if (this.combatSystem.fire(this.scene.getThreeScene())) {
        // Check if enemy is destroyed
        const enemy = this.waveManager.getEnemy(convergedEnemy);
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

            this.waveManager.destroyEnemy(convergedEnemy);
            this.convergenceSystem.removeEnemy(convergedEnemy);
          }
        }
      }
    }
  }

  private startGame(): void {
    this.isPlaying = true;
    this.scoringSystem.reset();
    this.waveManager.startNextWave();
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

      // Update combat system (particles)
      this.combatSystem.update(delta, this.scene.getThreeScene());

      // Update enhanced effects
      EffectsAssets.update(delta);

      // Update scene (debris)
      this.scene.update(performance.now() / 1000);

      // ADDICTIVE: Update scoring system (combo timers, etc.)
      this.scoringSystem.update(delta);

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
    this.scoringSystem.dispose();
    this.hud.dispose();
    this.menu.dispose();
    EffectsAssets.dispose();
  }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
