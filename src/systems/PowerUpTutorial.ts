import { eventBus, GameEvent } from '../core/EventBus.js';
import { PowerUpType, POWER_UP_NAMES, POWER_UP_DESCRIPTIONS } from '../core/PowerUpTypes.js';

export class PowerUpTutorial {
  private overlay: HTMLElement | null = null;
  private hasShownTutorial: Set<PowerUpType> = new Set();
  private currentTutorial: PowerUpType | null = null;
  private hideTimeout: number | null = null;

  constructor() {
    this.createOverlay();
    this.setupEventListeners();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'powerup-tutorial';
    this.overlay.className = 'powerup-tutorial';
    this.overlay.style.cssText = `
      position: absolute;
      bottom: 120px;
      right: 20px;
      width: 280px;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #00FF00;
      border-radius: 8px;
      padding: 15px;
      z-index: 100;
      display: none;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    `;

    this.overlay.innerHTML = `
      <div class="tutorial-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      ">
        <div class="tutorial-title" style="
          color: #00FF00;
          font-size: 16px;
          font-weight: bold;
          text-shadow: 0 0 10px #00FF00;
        "></div>
        <div class="tutorial-close" style="
          color: #666;
          font-size: 12px;
          cursor: pointer;
        ">[HOLD SPACE]</div>
      </div>
      <div class="tutorial-description" style="
        color: #40C0FF;
        font-size: 13px;
        line-height: 1.5;
      "></div>
      <div class="tutorial-hint" style="
        color: #666;
        font-size: 11px;
        margin-top: 10px;
        font-style: italic;
      "></div>
    `;

    document.getElementById('ui-layer')?.appendChild(this.overlay);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        to { transform: translateX(100px); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.3); }
        50% { box-shadow: 0 0 30px rgba(0, 255, 0, 0.6); }
      }
      .powerup-tutorial.pulse {
        animation: pulse 1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Show tutorial when power-up is collected
    eventBus.on('powerup:collected', (data: any) => {
      this.showTutorial(data.type);
    });

    // Show tutorial when power-up spawns (first time)
    eventBus.on('powerup:spawned', (data: any) => {
      if (!this.hasShownTutorial.has(data.type)) {
        this.showTutorial(data.type, true);
      }
    });

    // Hide on game over
    eventBus.on(GameEvent.GAME_OVER, () => {
      this.hide();
    });
  }

  showTutorial(type: PowerUpType, isSpawn: boolean = false): void {
    if (this.hasShownTutorial.has(type)) return;

    this.currentTutorial = type;
    this.hasShownTutorial.add(type);

    const name = POWER_UP_NAMES[type];
    const description = POWER_UP_DESCRIPTIONS[type];

    const titleEl = this.overlay?.querySelector('.tutorial-title') as HTMLElement;
    const descEl = this.overlay?.querySelector('.tutorial-description') as HTMLElement;
    const hintEl = this.overlay?.querySelector('.tutorial-hint') as HTMLElement;

    if (titleEl) titleEl.textContent = name;
    if (descEl) descEl.innerHTML = description;

    if (isSpawn) {
      hintEl.textContent = 'Align crosshair and press SPACE to collect!';
    } else {
      hintEl.textContent = 'Now active! Check top-right for duration.';
    }

    // Update border color based on power-up type
    const colors: Record<PowerUpType, string> = {
      [PowerUpType.SPEED_BOOST]: '#00FF00',
      [PowerUpType.SHIELD]: '#00FFFF',
      [PowerUpType.SPREAD_SHOT]: '#FF00FF',
      [PowerUpType.DAMAGE_MULTIPLIER]: '#FF8000',
      [PowerUpType.RAPID_FIRE]: '#FFFF00',
      [PowerUpType.TIME_SLOW]: '#8000FF'
    };

    const color = colors[type] || '#00FF00';
    if (this.overlay) {
      this.overlay.style.borderColor = color;
      this.overlay.style.boxShadow = `0 0 20px ${color}40`;
      this.overlay.classList.add('pulse');
    }

    if (titleEl) titleEl.style.color = color;

    // Show overlay
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }

    // Auto-hide after 5 seconds
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, 5000);
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.style.display = 'none';
          this.overlay.style.animation = '';
          this.overlay.classList.remove('pulse');
        }
      }, 300);
    }
    this.currentTutorial = null;
  }

  reset(): void {
    this.hasShownTutorial.clear();
  }

  dispose(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.overlay?.remove();
  }
}
