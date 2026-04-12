import * as THREE from 'three';

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWave: number;
  currentAct: number;
  score: number;
  startTime: number;
}

export interface EnemyConfig {
  type: EnemyType;
  position: THREE.Vector3;
  health: number;
  speed: number;
  zSpeed: number;
  behavior: EnemyBehavior;
}

export enum EnemyType {
  BASIC = 'basic',
  FAST = 'fast',
  HEAVY = 'heavy',
  ECHO = 'echo',
  SPLIT = 'split'
}

export enum EnemyBehavior {
  DRIFT = 'drift',
  DODGE = 'dodge',
  CHASE = 'chase',
  ECHO = 'echo',
  SPLIT = 'split'
}

export interface WaveConfig {
  waveNumber: number;
  act: number;
  enemyCount: number;
  enemyTypes: EnemyType[];
  spawnPattern: SpawnPattern;
  narration?: string;
}

export enum SpawnPattern {
  SINGLE = 'single',
  SEQUENTIAL = 'sequential',
  SIMULTANEOUS = 'simultaneous',
  RANDOM = 'random'
}

export interface ConvergenceData {
  enemyId: string;
  alignment: number;
  isConverged: boolean;
  screenPosition: THREE.Vector2;
  depth: number;
}

export interface PoolableObject {
  mesh: THREE.Mesh;
  isActive: boolean;
  velocity: THREE.Vector3;
  lifetime: number;
}
