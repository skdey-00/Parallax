import * as THREE from 'three';
import { eventBus, GameEvent } from '../core/EventBus.js';
import { COLORS } from '../core/Constants.js';

export interface ActConfig {
  act: number;
  name: string;
  primaryColor: number;
  secondaryColor: number;
  bgColor: number;
  gridColor: number;
  fogDensity: number;
  glitchIntensity: number;
  particleColor: number;
  description: string;
}

export const ACT_CONFIGS: Record<number, ActConfig> = {
  1: {
    act: 1,
    name: 'CONTACT',
    primaryColor: 0x40C0FF,
    secondaryColor: 0x0080FF,
    bgColor: 0x000510,
    gridColor: 0x1a1a2e,
    fogDensity: 0.02,
    glitchIntensity: 0,
    particleColor: 0x40C0FF,
    description: 'First contact with The Veil. Sensors are calibrating.'
  },
  2: {
    act: 2,
    name: 'ESCALATION',
    primaryColor: 0xFFB000,
    secondaryColor: 0xFF8000,
    bgColor: 0x0a0500,
    gridColor: 0x2a1a0a,
    fogDensity: 0.04,
    glitchIntensity: 0.3,
    particleColor: 0xFF8000,
    description: 'The Veil adapts. Reality begins to fragment.'
  },
  3: {
    act: 3,
    name: 'COLLAPSE',
    primaryColor: 0xFF0040,
    secondaryColor: 0xFF0080,
    bgColor: 0x100000,
    gridColor: 0x200505,
    fogDensity: 0.08,
    glitchIntensity: 0.8,
    particleColor: 0xFF0040,
    description: 'Critical mass. Full sensor array deployed.'
  }
};

export class LevelSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private currentAct: number = 1;
  private actElements: Map<string, THREE.Object3D> = new Map();
  private uiLayer: HTMLElement | null = null;
  private backgroundOverlay: HTMLElement | null = null;
  private scanlines: HTMLElement | null = null;
  private vignette: HTMLElement | null = null;
  private glitchInterval: number | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.setupEventListeners();
    this.createBackgroundEffects();
    this.setAct(1);
  }

  private setupEventListeners(): void {
    eventBus.on(GameEvent.WAVE_START, (config: any) => {
      if (config.act !== this.currentAct) {
        this.setAct(config.act);
      }
    });

    eventBus.on(GameEvent.GAME_START, () => {
      this.setAct(1);
    });
  }

  private createBackgroundEffects(): void {
    this.uiLayer = document.getElementById('ui-layer');

    // Background color overlay
    this.backgroundOverlay = document.createElement('div');
    this.backgroundOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      transition: background 1s ease-out;
    `;
    this.uiLayer?.appendChild(this.backgroundOverlay);

    // Scanlines effect
    this.scanlines = document.createElement('div');
    this.scanlines.className = 'scanlines';
    this.scanlines.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
      opacity: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
      );
    `;
    this.uiLayer?.appendChild(this.scanlines);

    // Vignette
    this.vignette = document.createElement('div');
    this.vignette.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 3;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%);
    `;
    this.uiLayer?.appendChild(this.vignette);
  }

  /**
   * Set the current act and update visuals
   */
  setAct(act: number): void {
    if (act < 1 || act > 3) act = 1;
    this.currentAct = act;

    const config = ACT_CONFIGS[act];

    // Update scene background
    this.updateSceneBackground(config);

    // Update UI colors
    this.updateUIColors(config);

    // Add/Remove glitch effects
    this.updateGlitchEffects(config);

    // Update particle colors
    this.updateParticleColors(config);

    // Show act transition
    this.showActTransition(config);
  }

  private updateSceneBackground(config: ActConfig): void {
    // Update fog
    this.scene.fog = new THREE.FogExp2(config.bgColor, config.fogDensity);

    // Update background overlay
    if (this.backgroundOverlay) {
      const bgColor = '#' + config.bgColor.toString(16).padStart(6, '0');
      this.backgroundOverlay.style.background = `radial-gradient(ellipse at center, ${bgColor}40 40%, ${bgColor} 100%)`;
    }

    // Update scene background color
    this.scene.background = new THREE.Color(config.bgColor);
  }

  private updateUIColors(config: ActConfig): void {
    // Update CSS custom properties for UI theming
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#' + config.primaryColor.toString(16).padStart(6, '0'));
    root.style.setProperty('--secondary-color', '#' + config.secondaryColor.toString(16).padStart(6, '0'));
    root.style.setProperty('--act-bg-color', '#' + config.bgColor.toString(16).padStart(6, '0'));

    // Update scanlines for Act II+
    if (this.scanlines) {
      this.scanlines.style.opacity = this.currentAct >= 2 ? '0.3' : '0';
    }
  }

  private updateGlitchEffects(config: ActConfig): void {
    // Clear existing glitch interval
    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

    // Add glitch effects for Act II+
    if (config.glitchIntensity > 0) {
      this.glitchInterval = window.setInterval(() => {
        if (Math.random() < config.glitchIntensity * 0.1) {
          this.triggerGlitch();
        }
      }, 100);
    }
  }

  private triggerGlitch(): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    // CSS glitch effect
    container.style.animation = 'glitch 0.1s ease-in-out';

    setTimeout(() => {
      container.style.animation = '';
    }, 100);
  }

  private updateParticleColors(config: ActConfig): void {
    // Emit event for other systems to update their particle colors
    eventBus.emit('act:color:change', {
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      particleColor: config.particleColor
    });
  }

  private showActTransition(config: ActConfig): void {
    // Create act announcement overlay
    const overlay = document.createElement('div');
    overlay.className = 'act-transition';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 50;
      animation: fadeIn 0.5s ease-out;
    `;

    const color = '#' + config.primaryColor.toString(16).padStart(6, '0');

    overlay.innerHTML = `
      <div style="
        text-align: center;
        animation: slideIn 0.5s ease-out;
      ">
        <div style="
          color: ${color};
          font-size: 72px;
          font-weight: bold;
          text-shadow: 0 0 30px ${color};
          margin-bottom: 10px;
          animation: pulse 1s ease-in-out infinite;
        ">ACT ${config.act}</div>
        <div style="
          color: ${color};
          font-size: 24px;
          text-shadow: 0 0 20px ${color};
          letter-spacing: 10px;
        ">${config.name}</div>
        <div style="
          color: #888;
          font-size: 14px;
          margin-top: 20px;
          max-width: 400px;
        ">${config.description}</div>
      </div>
    `;

    // Add CSS animations
    if (!document.getElementById('act-animations')) {
      const style = document.createElement('style');
      style.id = 'act-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { text-shadow: 0 0 30px ${color}; }
          50% { text-shadow: 0 0 50px ${color}, 0 0 70px ${color}; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-5px, 5px); }
          40% { transform: translate(-5px, -5px); }
          60% { transform: translate(5px, 5px); }
          80% { transform: translate(5px, -5px); }
          100% { transform: translate(0); }
        }
        .glitch-text {
          animation: glitch 0.3s steps(10) infinite;
        }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('game-container')?.appendChild(overlay);

    // Play transition sound
    eventBus.emit('sound:act-transition', { act: config.act });

    // Remove after delay
    setTimeout(() => {
      overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }, 2500);
  }

  /**
   * Add environmental particles specific to each act
   */
  spawnActParticles(): void {
    const config = ACT_CONFIGS[this.currentAct];

    // Create floating particles
    const particleCount = 20 + this.currentAct * 10;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(1 + Math.random(), 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: config.particleColor,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 150,
        -50 - Math.random() * 100
      );

      this.scene.add(particle);
      this.actElements.set(`particle_${i}`, particle);

      // Animate particles
      this.animateParticle(particle);
    }
  }

  private animateParticle(particle: THREE.Mesh): void {
    const speed = 0.5 + Math.random() * 0.5;
    const targetY = particle.position.y + (Math.random() - 0.5) * 20;

    const animate = () => {
      particle.position.y += speed * 0.016;
      particle.rotation.x += 0.01;
      particle.rotation.y += 0.01;

      if (particle.position.y > 75) {
        particle.position.y = -75;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get current act config
   */
  getCurrentAct(): number {
    return this.currentAct;
  }

  getCurrentActConfig(): ActConfig {
    return ACT_CONFIGS[this.currentAct];
  }

  dispose(): void {
    // Clear intervals
    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
    }

    // Remove act elements
    for (const [id, element] of this.actElements) {
      this.scene.remove(element);
      if (element instanceof THREE.Mesh) {
        element.geometry.dispose();
        (element.material as THREE.Material).dispose();
      }
    }
    this.actElements.clear();
  }
}
