import { eventBus, GameEvent } from '../core/EventBus.js';

export class GameTutorial {
  private overlay: HTMLElement | null = null;
  private currentStep: number = 0;
  private isActive: boolean = false;
  private hasSeenTutorial: boolean = false;

  // Tutorial steps with visual examples
  private steps: TutorialStep[] = [
    {
      title: 'YOUR SHIP',
      content: `
        <div style="display: flex; gap: 40px; align-items: center; margin: 20px 0;">
          <div style="flex: 1;">
            ${this.createShipSVG()}
          </div>
          <div style="flex: 1.5; text-align: left; line-height: 1.8;">
            <div style="color: #40C0FF; font-size: 18px; margin-bottom: 10px;">YOU ARE HERE</div>
            <div style="color: #AAA; font-size: 14px;">• Your ship stays in the <span style="color: #FFF;">center</span></div>
            <div style="color: #AAA; font-size: 14px;">• Enemies move around YOU in 3D space</div>
            <div style="color: #AAA; font-size: 14px;">• You CAN'T move - only <span style="color: #40C0FF;">AIM</span></div>
          </div>
        </div>
      `,
      color: '#40C0FF'
    },
    {
      title: 'HOW TO PLAY',
      content: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0;">
          <div style="background: rgba(64, 192, 255, 0.1); border: 1px solid #40C0FF; border-radius: 10px; padding: 20px;">
            <div style="color: #40C0FF; font-size: 24px; margin-bottom: 15px;">🎯 AIM</div>
            <div style="color: #CCC; font-size: 14px; line-height: 1.6;">
              Move your <span style="color: #FFF;">MOUSE</span> to aim the crosshair at enemies
            </div>
          </div>
          <div style="background: rgba(255, 0, 64, 0.1); border: 1px solid #FF0040; border-radius: 10px; padding: 20px;">
            <div style="color: #FF0040; font-size: 24px; margin-bottom: 15px;">💥 FIRE</div>
            <div style="color: #CCC; font-size: 14px; line-height: 1.6;">
              Press <span style="color: #FFF; background: #333; padding: 2px 8px; border-radius: 4px;">SPACE</span> or <span style="color: #FFF; background: #333; padding: 2px 8px; border-radius: 4px;">CLICK</span> when locked on
            </div>
          </div>
        </div>
        <div style="color: #FFB000; font-size: 16px; margin-top: 20px;">
          ⚠️ IMPORTANT: Wait for the <span style="color: #FF0040;">RED LOCK indicator</span> before firing!
        </div>
      `,
      color: '#FFB000'
    },
    {
      title: 'WHAT IS WHAT?',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
          ${this.createEntityCard('ENEMY', '⬡', '#FFFFFF', 'Basic enemy - Shoot it!', 'WHITE wireframe box')}
          ${this.createEntityCard('HEAVY ENEMY', '⬢', '#FF0040', 'Takes 3 hits to destroy', 'RED with armor plates')}
          ${this.createEntityCard('HAZARD', '◇', '#FFB000', 'DANGER! Shoot to destroy', 'YELLOW with red core - AVOID')}
          ${this.createEntityCard('POWER-UP', '◆', '#00FF00', 'Collect for abilities', 'GREEN octahedron - helpful')}
        </div>
      `,
      color: '#FFB000'
    },
    {
      title: 'POWER-UPS',
      content: `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
          ${this.createPowerUpCard('SPEED', '#00FF00', 'Move cursor faster')}
          ${this.createPowerUpCard('SHIELD', '#00FFFF', 'Blocks one hit')}
          ${this.createPowerUpCard('SPREAD', '#FF8000', '3-way shot')}
          ${this.createPowerUpCard('DAMAGE x2', '#FF00FF', 'Double damage')}
          ${this.createPowerUpCard('RAPID FIRE', '#FFFF00', 'Faster shooting')}
          ${this.createPowerUpCard('TIME SLOW', '#8000FF', 'Slow enemies')}
        </div>
        <div style="color: #AAA; font-size: 14px; margin-top: 20px;">
          Aim at power-ups and fire to collect them!
        </div>
      `,
      color: '#00FF00'
    },
    {
      title: 'BOSS FIGHT',
      content: `
        <div style="display: flex; gap: 40px; align-items: center; margin: 20px 0;">
          <div style="flex: 1;">
            ${this.createBossSVG()}
          </div>
          <div style="flex: 1.5; text-align: left; line-height: 1.8;">
            <div style="color: #00FFFF; font-size: 18px; margin-bottom: 10px;">PHASE 1: SHIELDS</div>
            <div style="color: #AAA; font-size: 14px;">• Destroy all <span style="color: #00FFFF;">cyan orbiting spheres</span></div>
            <div style="color: #AAA; font-size: 14px;">• Each shield can be targeted separately</div>
            <div style="margin-top: 15px; color: #FF0040; font-size: 18px; margin-bottom: 10px;">PHASE 2: CORE</div>
            <div style="color: #AAA; font-size: 14px;">• Core <span style="color: #FFFFFF;">exposes and turns WHITE</span></div>
            <div style="color: #AAA; font-size: 14px;">• Shoot the core to damage boss!</div>
          </div>
        </div>
      `,
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

  private createShipSVG(): string {
    return `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <polygon points="60,10 90,90 60,80 30,90" fill="none" stroke="#40C0FF" stroke-width="2"/>
        <polygon points="60,30 75,70 60,65 45,70" fill="#40C0FF" opacity="0.5"/>
        <circle cx="60" cy="60" r="5" fill="#40C0FF"/>
      </svg>
    `;
  }

  private createBossSVG(): string {
    return `
      <svg width="120" height="120" viewBox="0 0 120 120">
        <polygon points="60,10 80,40 110,40 110,80 80,110 60,100 40,110 10,80 10,40 40,40"
                  fill="none" stroke="#FF0040" stroke-width="2" opacity="0.5"/>
        <polygon points="60,25 75,50 60,95 45,50" fill="#FF0040" opacity="0.3"/>
        <circle cx="60" cy="60" r="15" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="30" cy="40" r="8" fill="#00FFFF" opacity="0.8"/>
        <circle cx="90" cy="40" r="8" fill="#00FFFF" opacity="0.8"/>
        <circle cx="60" cy="20" r="8" fill="#00FFFF" opacity="0.8"/>
        <circle cx="30" cy="80" r="8" fill="#00FFFF" opacity="0.8"/>
        <circle cx="90" cy="80" r="8" fill="#00FFFF" opacity="0.8"/>
      </svg>
    `;
  }

  private createEntityCard(name: string, icon: string, color: string, desc: string, detail: string): string {
    return `
      <div style="background: rgba(255,255,255,0.05); border: 1px solid ${color}; border-radius: 8px; padding: 15px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">${icon}</div>
        <div style="color: ${color}; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${name}</div>
        <div style="color: #CCC; font-size: 12px; margin-bottom: 5px;">${desc}</div>
        <div style="color: #666; font-size: 11px;">${detail}</div>
      </div>
    `;
  }

  private createPowerUpCard(name: string, color: string, desc: string): string {
    return `
      <div style="background: rgba(255,255,255,0.05); border: 1px solid ${color}; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="width: 40px; height: 40px; margin: 0 auto 10px;">
          <svg viewBox="0 0 40 40">
            <polygon points="20,5 35,20 20,35 5,20" fill="none" stroke="${color}" stroke-width="2"/>
            <polygon points="20,12 28,20 20,28 12,20" fill="${color}" opacity="0.5"/>
          </svg>
        </div>
        <div style="color: ${color}; font-size: 13px; font-weight: bold; margin-bottom: 5px;">${name}</div>
        <div style="color: #AAA; font-size: 11px;">${desc}</div>
      </div>
    `;
  }

  show(): void {
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
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
      background: rgba(0, 0, 0, 0.95);
      z-index: 200;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-out;
    `;

    document.getElementById('game-container')?.appendChild(this.overlay);
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('tutorial-styles')) return;

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .tutorial-btn {
        background: transparent;
        border: 2px solid #40C0FF;
        color: #40C0FF;
        padding: 12px 30px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        margin: 0 10px;
      }
      .tutorial-btn:hover {
        background: #40C0FF;
        color: #000;
      }
      .tutorial-btn-skip {
        border-color: #444;
        color: #444;
      }
      .tutorial-btn-skip:hover {
        background: #444;
        color: #FFF;
      }
    `;
    document.head.appendChild(style);
  }

  private showStep(index: number): void {
    if (!this.overlay || index >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[index];
    const isFirst = index === 0;
    const isLast = index === this.steps.length - 1;

    this.overlay.innerHTML = `
      <div style="
        max-width: 700px;
        width: 90%;
        text-align: center;
        animation: slideUp 0.3s ease-out;
      ">
        <!-- Progress bar -->
        <div style="display: flex; gap: 5px; margin-bottom: 20px; justify-content: center;">
          ${this.steps.map((_, i) => `
            <div style="
              width: ${i === index ? '30' : '8'}px;
              height: 8px;
              background: ${i === index ? step.color : '#333'};
              border-radius: 4px;
              transition: all 0.3s;
            "></div>
          `).join('')}
        </div>

        <!-- Title -->
        <div style="
          color: ${step.color};
          font-size: 36px;
          font-weight: bold;
          text-shadow: 0 0 20px ${step.color};
          margin-bottom: 10px;
        ">${step.title}</div>

        <!-- Content -->
        <div style="
          color: #CCC;
          font-size: 14px;
          margin-bottom: 25px;
        ">${step.content}</div>

        <!-- Buttons -->
        <div style="display: flex; gap: 15px; justify-content: center; align-items: center; flex-wrap: wrap;">
          ${!isFirst ? `<button class="tutorial-btn" id="tutorial-prev">◄ BACK</button>` : ''}
          <button class="tutorial-btn" id="tutorial-next" style="
            background: ${step.color};
            border-color: ${step.color};
            color: #000;
            font-weight: bold;
          ">${isLast ? '▶ START PLAYING' : 'NEXT ►'}</button>
          ${!isLast ? `<button class="tutorial-btn tutorial-btn-skip" id="tutorial-skip">SKIP TUTORIAL</button>` : ''}
        </div>

        <!-- Keyboard hint -->
        <div style="color: #444; font-size: 12px; margin-top: 25px;">
          Use Arrow Keys or Space to navigate • ESC to skip
        </div>
      </div>
    `;

    // Event listeners
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
      if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') {
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

  complete(): void {
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

    // Emit event that tutorial is complete
    eventBus.emit('tutorial:complete', {});
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
  content: string;
  color: string;
}
