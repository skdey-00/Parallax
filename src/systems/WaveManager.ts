import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { DEPTH, WAVES } from '../core/Constants.js';
import { Enemy } from '../entities/Enemy.js';
import { WaveConfig, EnemyType, SpawnPattern } from '../core/Types.js';
import { ACT_NARRATIONS } from '../core/Constants.js';

export class WaveManager {
  private scene: THREE.Scene;
  private enemies: Map<string, Enemy> = new Map();
  private currentWave: number = 0;
  private currentAct: number = 1;
  private waveInProgress: boolean = false;
  private spawnTimer: number = 0;
  private enemiesSpawned: number = 0;
  private enemiesToSpawn: number = 0;
  private spawnPattern: SpawnPattern = SpawnPattern.SINGLE;
  private enemyTypes: EnemyType[] = [];
  private nextEnemyId: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  startNextWave(): void {
    this.currentWave++;
    this.updateAct();

    const waveConfig = this.generateWaveConfig();
    this.startWave(waveConfig);
  }

  private updateAct(): void {
    if (this.currentWave > WAVES.ACT_2_END) {
      this.currentAct = 3;
    } else if (this.currentWave > WAVES.ACT_1_END) {
      this.currentAct = 2;
    }
  }

  private generateWaveConfig(): WaveConfig {
    const waveConfig: WaveConfig = {
      waveNumber: this.currentWave,
      act: this.currentAct,
      enemyCount: 3 + this.currentWave * 2,
      enemyTypes: this.getEnemyTypesForAct(),
      spawnPattern: this.getSpawnPatternForWave(),
      narration: this.getNarrationForWave()
    };

    return waveConfig;
  }

  private getEnemyTypesForAct(): EnemyType[] {
    switch (this.currentAct) {
      case 1:
        return [EnemyType.BASIC];
      case 2:
        return [EnemyType.BASIC, EnemyType.FAST, EnemyType.ECHO];
      case 3:
        return [EnemyType.BASIC, EnemyType.FAST, EnemyType.HEAVY, EnemyType.ECHO, EnemyType.SPLIT];
      default:
        return [EnemyType.BASIC];
    }
  }

  private getSpawnPatternForWave(): SpawnPattern {
    switch (this.currentAct) {
      case 1:
        return this.currentWave % 2 === 0 ? SpawnPattern.SEQUENTIAL : SpawnPattern.SINGLE;
      case 2:
        return this.currentWave % 3 === 0 ? SpawnPattern.SIMULTANEOUS : SpawnPattern.SEQUENTIAL;
      case 3:
        return SpawnPattern.RANDOM;
      default:
        return SpawnPattern.SINGLE;
    }
  }

  private getNarrationForWave(): string {
    const narrations = ACT_NARRATIONS[this.currentAct as keyof typeof ACT_NARRATIONS];
    if (narrations) {
      const index = (this.currentWave - 1) % narrations.length;
      return narrations[index];
    }
    return '';
  }

  private startWave(config: WaveConfig): void {
    this.waveInProgress = true;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = config.enemyCount;
    this.spawnPattern = config.spawnPattern;
    this.spawnTimer = 0;
    this.enemyTypes = config.enemyTypes;

    eventBus.emit(GameEvent.WAVE_START, config);

    if (config.narration) {
      setTimeout(() => {
        eventBus.emit(GameEvent.WAVE_START, config);
      }, 2000);
    }
  }

  update(delta: number): void {
    if (!this.waveInProgress) return;

    this.spawnTimer -= delta;

    // Spawn enemies based on pattern
    if (this.enemiesSpawned < this.enemiesToSpawn && this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.getSpawnDelay();
    }

    // Check if wave is complete
    if (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.size === 0) {
      this.completeWave();
    }
  }

  private getSpawnDelay(): number {
    switch (this.spawnPattern) {
      case SpawnPattern.SINGLE:
        return 2;
      case SpawnPattern.SEQUENTIAL:
        return 1.5;
      case SpawnPattern.SIMULTANEOUS:
        return 0.3;
      case SpawnPattern.RANDOM:
        return 0.5 + Math.random() * 1.5;
      default:
        return 1;
    }
  }

  private spawnEnemy(): void {
    const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    const id = `enemy_${this.nextEnemyId++}`;
    const position = this.generateSpawnPosition();

    const enemy = new Enemy(id, type, position);
    this.enemies.set(id, enemy);
    this.scene.add(enemy.getMesh());

    this.enemiesSpawned++;
    eventBus.emit(GameEvent.ENEMY_SPAWNED, enemy);
  }

  private generateSpawnPosition(): THREE.Vector3 {
    // Spawn enemies in a circle around the player (who is at 0,0)
    // Enemies will move toward center
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 40; // 80-120 units from center
    const depth = -40 + Math.random() * 60; // Depth variation

    return new THREE.Vector3(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance * 0.6,
      depth
    );
  }

  destroyEnemy(enemyId: string): boolean {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) return false;

    this.scene.remove(enemy.getMesh());
    enemy.dispose();
    this.enemies.delete(enemyId);
    return true;
  }

  getEnemies(): Map<string, Enemy> {
    return this.enemies;
  }

  getEnemy(id: string): Enemy | undefined {
    return this.enemies.get(id);
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getCurrentAct(): number {
    return this.currentAct;
  }

  isWaveInProgress(): boolean {
    return this.waveInProgress;
  }

  private completeWave(): void {
    this.waveInProgress = false;
    eventBus.emit(GameEvent.WAVE_COMPLETE, this.currentWave, this.currentAct);
  }

  dispose(): void {
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.getMesh());
      enemy.dispose();
    });
    this.enemies.clear();
  }
}
