export class DeltaTime {
  private lastTime: number = 0;
  private maxDelta: number = 0.1;

  constructor() {
    this.lastTime = performance.now();
  }

  getDelta(): number {
    const currentTime = performance.now();
    let delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta to prevent huge jumps
    if (delta > this.maxDelta) {
      delta = this.maxDelta;
    }

    return delta;
  }

  reset(): void {
    this.lastTime = performance.now();
  }
}
