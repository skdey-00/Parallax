import { eventBus, GameEvent } from '../core/EventBus.js';

export class GameTutorial {
  private overlay: HTMLElement | null = null;
  private currentStep: number = 0;
  private isActive: boolean = false;
  private hasSeenTutorial: boolean = false;

  // Tutorial steps
  private steps: TutorialStep[] = [
    {
      title: 'CONTROLS',
      content: [
        '<span style="color: #40C0FF">WASD / ARROWS</span> - Move your ship',
        '<span style="color: #40C0FF">SPACE / CLICK</span> - Fire when locked on',
        '<span style="color: #40C0FF">TAB</span> - Switch weapons',
        '<span style="color: #40C0FF">H</span> - Toggle this help'
      ],
      color: '#40C0FF'
    },
    {
      title: 'CONVERGENCE MECHANIC',
      content: [
        'Enemies exist at different depths in 3D space',
        '<span style="color: #FFB000">Move to align</span> your crosshair with enemies',
        'Watch the <span style="color: #40C0FF">CONVERGENCE meter</span> at the top',
        'At <span style="color: #FF0040">95%+</span> you\'ll see a <span style="color: #FF0040">red lock-on ring</span>',
        '<span style="color: #40C0FF">Fire!</span> when locked to destroy enemies'
      ],
      color: '#FFB000'
    },
    {
      title: 'ENEMY TYPES',
      content: [
        '<span style="color: #FF0040">Red spheres</span> - Basic enemies, dodge left/right',
        '<span style="color: #FF8000">Orange pyramids</span> - Faster, dive toward you',
        '<span style="color: #FF00FF">Magenta shapes</span> - Heavy, split into multiples',
        'Enemies <span style="color: #40C0FF">move along Z-axis</span> (depth), not sideways!'
      ],
      color: '#FF0040'
    },
    {
      title: 'POWER-UPS',
      content: [
        '<span style="color: #00FF00">Green</span> octahedrons = Speed boost',
        '<span style="color: #00FFFF">Cyan</span> = Shield (blocks one hit)',
        '<span style="color: #FF00FF">Magenta</span> = Spread shot (3x fire)',
        '<span style="color: #FFFF00">Yellow</span> = Rapid fire',
        'Align and press SPACE to collect!'
      ],
      color: '#00FF00'
    },
    {
      title: 'BOSS FIGHT',
      content: [
        '<span style="color: #00FFFF">STAGE 1:</span> Destroy orbiting shields',
        'Each shield can be targeted individually',
        '<span style="color: #00FFFF">STAGE 2:</span> Core exposed!',
        '<span style="color: #FFFFFF">Shoot the white core</span> to damage boss',
        'Shields regenerate on boss phase change!'
      ],
      color: '#FF0040'
    }
  ];

  constructor() {
    this.checkTutorialStatus();
  }

  private checkTutorialStatus(): void {
    const seen = localStorage.getItem('parallax_tutorial_seen');
    this.hasSeenTutorial = seen === 'true';
  }

  show(): void {
    if (this.hasSeenTutorial) return;

    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    this.setupInput();
  }

  private createOverlay(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'game-tutorial';
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 200;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-out;
    `;

    document.getElementById('game-container')?.appendChild(this.overlay);
  }

  private showStep(index: number): void {
    if (!this.overlay || index >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[index];

    this.overlay.innerHTML = `
      <div style="
        max-width: 600px;
        width: 90%;
        text-align: center;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="
          color: ${step.color};
          font-size: 36px;
          font-weight: bold;
          text-shadow: 0 0 20px ${step.color};
          margin-bottom: 30px;
        ">${step.title}</div>
        <div style="
          color: #CCC;
          font-size: 16px;
          line-height: 2;
          margin-bottom: 30px;
        ">
          ${step.content.map(line => `<div style="margin: 8px 0;">${line}</div>`).join('')}
        </div>
        <div style="
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 20px;
        ">
          ${index > 0 ? `
            <button id="tutorial-prev" style="
              background: transparent;
              border: 2px solid #666;
              color: #666;
              padding: 10px 30px;
              font-family: 'Share Tech Mono', monospace;
              font-size: 16px;
              cursor: pointer;
            ">◄ PREV</button>
          ` : ''}
          <button id="tutorial-next" style="
            background: ${step.color};
            border: 2px solid ${step.color};
            color: #000;
            padding: 10px 30px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
          ">${index < this.steps.length - 1 ? 'NEXT ►' : 'START GAME'}</button>
          ${index < this.steps.length - 1 ? `
            <button id="tutorial-skip" style="
              background: transparent;
              border: 2px solid #444;
              color: #444;
              padding: 10px 30px;
              font-family: 'Share Tech Mono', monospace;
              font-size: 14px;
              cursor: pointer;
            ">SKIP ALL</button>
          ` : ''}
        </div>
        <div style="color: #444; font-size: 12px;">
          Step ${index + 1} of ${this.steps.length}
        </div>
      </div>
    `;

    // Add event listeners
    const nextBtn = this.overlay.querySelector('#tutorial-next') as HTMLElement;
    const prevBtn = this.overlay.querySelector('#tutorial-prev') as HTMLElement;
    const skipBtn = this.overlay.querySelector('#tutorial-skip') as HTMLElement;

    const goToNext = () => {
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.complete();
      } else {
        this.showStep(this.currentStep);
      }
    };

    const goToPrev = () => {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.showStep(this.currentStep);
      }
    };

    nextBtn?.addEventListener('click', goToNext);
    prevBtn?.addEventListener('click', goToPrev);
    skipBtn?.addEventListener('click', () => this.complete());

    // Keyboard navigation
    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'Space') {
        e.preventDefault();
        goToNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        this.complete();
      }
    };

    document.addEventListener('keydown', keyHandler, { once: true });
  }

  private setupInput(): void {
    // Show tutorial when boss spawns
    eventBus.on('boss:spawned', () => {
      this.showBossReminder();
    });
  }

  private showBossReminder(): void {
    const reminder = document.createElement('div');
    reminder.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00FFFF;
      border-radius: 10px;
      padding: 20px 40px;
      text-align: center;
      z-index: 150;
      animation: popIn 0.3s ease-out;
    `;
    reminder.innerHTML = `
      <div style="color: #00FFFF; font-size: 20px; font-weight: bold; margin-bottom: 10px;">
        BOSS INCOMING!
      </div>
      <div style="color: #CCC; font-size: 14px; line-height: 1.6;">
        <span style="color: #00FFFF">1.</span> Destroy orbiting shields<br>
        <span style="color: #00FFFF">2.</span> Shoot the exposed core<br>
        <span style="color: #00FFFF">3.</span> Survive!
      </div>
    `;

    document.getElementById('game-container')?.appendChild(reminder);

    setTimeout(() => {
      reminder.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => reminder.remove(), 500);
    }, 4000);

    // Add CSS
    if (!document.getElementById('tutorial-animations')) {
      const style = document.createElement('style');
      style.id = 'tutorial-animations';
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); } 70% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }
        @keyframes fadeOut { to { opacity: 0; } }
      `;
      document.head.appendChild(style);
    }
  }

  private complete(): void {
    this.isActive = false;
    this.hasSeenTutorial = true;
    localStorage.setItem('parallax_tutorial_seen', 'true');

    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        this.overlay?.remove();
        this.overlay = null;
      }, 300);
    }
  }

  reset(): void {
    this.hasSeenTutorial = false;
    localStorage.removeItem('parallax_tutorial_seen');
  }

  dispose(): void {
    this.overlay?.remove();
  }
}

interface TutorialStep {
  title: string;
  content: string[];
  color: string;
}
