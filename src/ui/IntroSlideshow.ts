import { eventBus, GameEvent } from '../core/EventBus.js';
import { INTRO_SLIDES, INTRO_TIMING } from '../core/Constants.js';
import type { Slide } from '../core/Constants.js';

export type { Slide } from '../core/Constants.js';

export class IntroSlideshow {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;
  private currentSlide: number = 0;
  private isPlaying: boolean = false;
  private isSkipped: boolean = false;
  private typewriterTimeout: number | null = null;
  private slideTimeout: number | null = null;

  constructor() {
    this.container = document.getElementById('game-container')!;

    // Check if already seen
    const hasSeen = localStorage.getItem('parallax_intro_seen');
    if (hasSeen === 'true') {
      this.isSkipped = true;
      return;
    }

    this.createOverlay();
    this.setupInput();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'intro-slideshow';
    this.overlay.className = 'intro-slideshow';
    this.overlay.innerHTML = `
      <div class="slide-content">
        <div class="slide-title"></div>
        <div class="slide-subtitle"></div>
        <div class="slide-text"></div>
        <div class="slide-indicator"></div>
        <div class="slide-hint">Press SPACE or CLICK to skip</div>
      </div>
      <div class="scanlines-overlay"></div>
      <div class="vignette-overlay"></div>
    `;

    this.container.appendChild(this.overlay);
  }

  private setupInput(): void {
    const skipHandler = () => {
      if (this.isPlaying) {
        this.skip();
      }
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        skipHandler();
      }
    });

    document.addEventListener('click', skipHandler);
  }

  play(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isSkipped) {
        resolve();
        return;
      }

      this.isPlaying = true;
      this.showSlide(0);

      // Auto-advance slides
      const advanceSlide = () => {
        if (!this.isPlaying) return;

        this.currentSlide++;

        if (this.currentSlide >= INTRO_SLIDES.length) {
          // End of slideshow
          setTimeout(() => this.complete(resolve), INTRO_TIMING.SLIDE_DURATION);
        } else {
          this.showSlide(this.currentSlide);
          this.slideTimeout = window.setTimeout(advanceSlide, INTRO_TIMING.SLIDE_DURATION);
        }
      };

      this.slideTimeout = window.setTimeout(advanceSlide, INTRO_TIMING.SLIDE_DURATION);
    });
  }

  private showSlide(index: number): void {
    if (!this.overlay) return;

    const slide = INTRO_SLIDES[index];
    const titleEl = this.overlay.querySelector('.slide-title') as HTMLElement;
    const subtitleEl = this.overlay.querySelector('.slide-subtitle') as HTMLElement;
    const textEl = this.overlay.querySelector('.slide-text') as HTMLElement;
    const indicatorEl = this.overlay.querySelector('.slide-indicator') as HTMLElement;

    // Clear any ongoing typewriter
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }

    // Update indicator
    indicatorEl.textContent = `${index + 1} / ${INTRO_SLIDES.length}`;

    // Apply slide-specific styles
    this.overlay.style.setProperty('--slide-color', slide.color);

    // Clear previous content
    titleEl.textContent = '';
    subtitleEl.textContent = '';
    textEl.innerHTML = '';

    // Animate based on effect type
    this.overlay.classList.remove('glitch-active');
    void this.overlay.offsetWidth; // Trigger reflow

    switch (slide.effect) {
      case 'glitch':
        this.overlay.classList.add('glitch-active');
        this.glitchText(titleEl, slide.title, 0);
        subtitleEl.textContent = slide.subtitle;
        setTimeout(() => {
          slide.content.forEach((line, i) => {
            const p = document.createElement('p');
            p.className = 'slide-line';
            textEl.appendChild(p);
            this.glitchText(p, line, i * 100);
          });
        }, 500);
        break;

      case 'typewriter':
        this.typeText(titleEl, slide.title, 30);
        setTimeout(() => {
          this.typeText(subtitleEl, slide.subtitle, 20);
        }, slide.title.length * 30 + 200);
        setTimeout(() => {
          slide.content.forEach((line, i) => {
            const p = document.createElement('p');
            p.className = 'slide-line';
            textEl.appendChild(p);
            this.typeText(p, line, 15, i * 300);
          });
        }, slide.title.length * 30 + slide.subtitle.length * 20 + 400);
        break;

      case 'fade':
        titleEl.style.opacity = '0';
        subtitleEl.style.opacity = '0';
        textEl.style.opacity = '0';

        titleEl.textContent = slide.title;
        subtitleEl.textContent = slide.subtitle;

        setTimeout(() => {
          titleEl.style.transition = 'opacity 1s';
          titleEl.style.opacity = '1';
        }, 300);

        setTimeout(() => {
          subtitleEl.style.transition = 'opacity 1s';
          subtitleEl.style.opacity = '1';
        }, 600);

        setTimeout(() => {
          textEl.style.transition = 'opacity 1s';
          textEl.style.opacity = '1';
          slide.content.forEach((line) => {
            const p = document.createElement('p');
            p.className = 'slide-line';
            p.textContent = line;
            textEl.appendChild(p);
          });
        }, 900);
        break;

      default:
        titleEl.textContent = slide.title;
        subtitleEl.textContent = slide.subtitle;
        slide.content.forEach((line) => {
          const p = document.createElement('p');
          p.className = 'slide-line';
          p.textContent = line;
          textEl.appendChild(p);
        });
    }
  }

  private typeText(element: HTMLElement, text: string, speed: number, delay: number = 0): void {
    setTimeout(() => {
      let i = 0;
      const type = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          this.typewriterTimeout = window.setTimeout(type, speed);
        }
      };
      type();
    }, delay);
  }

  private glitchText(element: HTMLElement, text: string, delay: number = 0): void {
    setTimeout(() => {
      const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      let iterations = 0;
      const maxIterations = 10;

      const glitch = () => {
        if (iterations < maxIterations) {
          element.textContent = text.split('').map((char, i) => {
            if (i < iterations * (text.length / maxIterations)) {
              return char;
            }
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
          iterations++;
          this.typewriterTimeout = window.setTimeout(glitch, 50);
        } else {
          element.textContent = text;
        }
      };
      glitch();
    }, delay);
  }

  private skip(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Clear timeouts
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
    }
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    // Fade out quickly
    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => {
        this.overlay?.remove();
        // Mark as seen
        localStorage.setItem('parallax_intro_seen', 'true');
        // Emit completion event
        eventBus.emit(GameEvent.INTRO_COMPLETE);
      }, 300);
    }
  }

  private complete(resolve: () => void): void {
    this.isPlaying = false;

    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 1s forwards';
      setTimeout(() => {
        this.overlay?.remove();
        localStorage.setItem('parallax_intro_seen', 'true');
        eventBus.emit(GameEvent.INTRO_COMPLETE);
        resolve();
      }, 1000);
    } else {
      resolve();
    }
  }

  dispose(): void {
    if (this.slideTimeout) {
      clearTimeout(this.slideTimeout);
    }
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
    this.overlay?.remove();
  }
}
