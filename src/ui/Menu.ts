import { eventBus, GameEvent } from '../core/EventBus.js';

export class Menu {
  private menuOverlay: HTMLElement;
  private startButton: HTMLElement;
  private instructionsButton: HTMLElement;
  private instructionsOverlay: HTMLElement;
  private closeInstructionsButton: HTMLElement;
  private tutorialHint: HTMLElement;
  private isVisible: boolean = true;
  private hasSeenInstructions: boolean = false;

  constructor() {
    this.menuOverlay = document.getElementById('menu-overlay')!;
    this.startButton = document.getElementById('start-button')!;
    this.instructionsButton = document.getElementById('instructions-button')!;
    this.instructionsOverlay = document.getElementById('instructions-overlay')!;
    this.closeInstructionsButton = document.getElementById('close-instructions')!;
    this.tutorialHint = document.getElementById('tutorial-hint')!;

    // Check if user has seen instructions
    const hasSeen = localStorage.getItem('parallax_instructions_seen');
    this.hasSeenInstructions = hasSeen === 'true';

    this.setupListeners();

    // Auto-show instructions for first-time players
    if (!this.hasSeenInstructions) {
      this.showInstructions();
    }

    // Show tutorial hint during gameplay
    eventBus.on(GameEvent.GAME_START, () => {
      this.showTutorialHint();
    });
  }

  private setupListeners(): void {
    this.startButton.addEventListener('click', () => {
      this.hide();
      eventBus.emit(GameEvent.GAME_START);
    });

    this.instructionsButton.addEventListener('click', () => {
      this.showInstructions();
    });

    this.closeInstructionsButton.addEventListener('click', () => {
      this.hideInstructions();
    });

    // H key to toggle help during gameplay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        if (!this.isVisible && !this.instructionsOverlay.classList.contains('hidden')) {
          this.hideInstructions();
        } else if (!this.isVisible) {
          this.showInstructions();
        }
      }
      // ESC to close instructions
      if (e.key === 'Escape' && !this.instructionsOverlay.classList.contains('hidden')) {
        this.hideInstructions();
      }
    });
  }

  private showInstructions(): void {
    this.instructionsOverlay.classList.remove('hidden');
    this.tutorialHint.classList.remove('visible');
  }

  private hideInstructions(): void {
    this.instructionsOverlay.classList.add('hidden');
    if (!this.isVisible) {
      this.showTutorialHint();
    }
    // Mark as seen
    if (!this.hasSeenInstructions) {
      localStorage.setItem('parallax_instructions_seen', 'true');
      this.hasSeenInstructions = true;
    }
  }

  private showTutorialHint(): void {
    // Show hint for 10 seconds then fade out
    this.tutorialHint.classList.add('visible');
    setTimeout(() => {
      this.tutorialHint.classList.remove('visible');
    }, 10000);
  }

  hide(): void {
    this.menuOverlay.classList.add('hidden');
    this.isVisible = false;
  }

  show(): void {
    this.menuOverlay.classList.remove('hidden');
    this.isVisible = true;
  }

  isMenuVisible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    // Clean up listeners
  }
}
