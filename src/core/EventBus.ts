type EventCallback = (...args: any[]) => void;
type EventType = GameEvent | string;

export enum GameEvent {
  INIT = 'init',
  GAME_START = 'game_start',
  GAME_OVER = 'game_over',
  WAVE_START = 'wave_start',
  WAVE_COMPLETE = 'wave_complete',
  CONVERGENCE_ACHIEVED = 'convergence_achieved',
  ENEMY_DESTROYED = 'enemy_destroyed',
  SCORE_CHANGED = 'score_changed',
  PLAYER_DIED = 'player_died',
  ENEMY_SPAWNED = 'enemy_spawned',
  PLAYER_DAMAGED = 'player_damaged',
  PLAYER_HEALED = 'player_healed',
  HEALTH_CHANGED = 'health_changed',
  INTRO_COMPLETE = 'intro_complete'
}

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: EventType, callback: EventCallback): void {
    const eventKey = typeof event === 'string' ? event : event;
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, []);
    }
    this.listeners.get(eventKey)!.push(callback);
  }

  off(event: EventType, callback: EventCallback): void {
    const eventKey = typeof event === 'string' ? event : event;
    const callbacks = this.listeners.get(eventKey);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: EventType, ...args: any[]): void {
    const eventKey = typeof event === 'string' ? event : event;
    const callbacks = this.listeners.get(eventKey);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
