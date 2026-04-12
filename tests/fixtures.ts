import { test as base } from '@playwright/test';

export interface GameFixtures {
  gamePage: Page;
  startGame: () => Promise<void>;
  waitForEnemy: () => Promise<void>;
  getConvergence: () => Promise<number>;
  getWave: () => Promise<number>;
  getScore: () => Promise<number>;
  getDepth: () => Promise<number>;
  getEntityCount: () => Promise<number>;
}

export const test = base.extend<GameFixtures>({
  gamePage: async ({ page }, use) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  startGame: async ({ page }, use) => {
    await use(async () => {
      // Wait for start button to be visible
      await page.waitForSelector('#start-button', { timeout: 5000 });

      // Click start button
      await page.click('#start-button');

      // Wait for menu to have hidden class
      await page.waitForFunction(() => {
        const menu = document.getElementById('menu-overlay');
        return menu && menu.classList.contains('hidden');
      }, { timeout: 5000 });

      // Wait a bit for game to initialize
      await page.waitForTimeout(500);
    });
  },

  waitForEnemy: async ({ page }, use) => {
    await use(async () => {
      // Wait for entity count to be greater than 0
      await page.waitForFunction(
        () => {
          const entityCount = document.getElementById('entity-count');
          return entityCount && parseInt(entityCount.textContent || '0') > 0;
        },
        { timeout: 10000 }
      );
    });
  },

  getConvergence: async ({ page }, use) => {
    await use(async () => {
      const text = await page.textContent('#convergence-value');
      return parseInt(text?.replace('%', '') || '0');
    });
  },

  getWave: async ({ page }, use) => {
    await use(async () => {
      const text = await page.textContent('#wave-number');
      return parseInt(text || '0');
    });
  },

  getScore: async ({ page }, use) => {
    await use(async () => {
      const text = await page.textContent('#score-value');
      return parseInt(text || '0');
    });
  },

  getDepth: async ({ page }, use) => {
    await use(async () => {
      const text = await page.textContent('#depth-value');
      return parseInt(text || '0');
    });
  },

  getEntityCount: async ({ page }, use) => {
    await use(async () => {
      const text = await page.textContent('#entity-count');
      return parseInt(text || '0');
    });
  }
});

export { expect } from '@playwright/test';
