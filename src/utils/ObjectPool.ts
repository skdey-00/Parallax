import * as THREE from 'three';
import { PoolableObject } from '../core/Types.js';

export class ObjectPool<T extends PoolableObject> {
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 50, maxSize: number = 200) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.isActive = false;
      obj.mesh.visible = false;
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    // Try to get from pool
    let obj = this.pool.pop();

    if (!obj && this.activeObjects.size < this.maxSize) {
      // Create new if under max size
      obj = this.factory();
    }

    if (obj) {
      obj.isActive = true;
      obj.mesh.visible = true;
      this.activeObjects.add(obj);
      return obj;
    }

    return null;
  }

  release(obj: T): void {
    if (this.activeObjects.has(obj)) {
      this.activeObjects.delete(obj);
      obj.isActive = false;
      obj.mesh.visible = false;
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  getActiveObjects(): T[] {
    return Array.from(this.activeObjects);
  }

  update(delta: number): void {
    this.activeObjects.forEach(obj => {
      obj.lifetime -= delta;
      if (obj.lifetime <= 0) {
        this.release(obj);
      }
    });
  }

  dispose(): void {
    this.pool.forEach(obj => {
      obj.mesh.geometry.dispose();
      if (Array.isArray(obj.mesh.material)) {
        obj.mesh.material.forEach(m => m.dispose());
      } else {
        obj.mesh.material.dispose();
      }
    });
    this.pool = [];
    this.activeObjects.clear();
  }
}
