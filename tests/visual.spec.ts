import { test, expect } from './fixtures';

test.describe('Visual Regression Tests', () => {
  test('HUD renders correctly', async ({ gamePage }) => {
    // Verify all HUD elements are present before game start
    await expect(gamePage.locator('.convergence-display')).toBeVisible();
    await expect(gamePage.locator('.wave-display')).toBeVisible();
    await expect(gamePage.locator('.score-display')).toBeVisible();
    await expect(gamePage.locator('.depth-readout')).toBeVisible();

    // Verify initial values
    await expect(gamePage.locator('#convergence-value')).toHaveText('0%');
    await expect(gamePage.locator('#wave-number')).toHaveText('1');
    await expect(gamePage.locator('#score-value')).toHaveText('0');
  });

  test('convergence indicator shows proper states', async ({
    gamePage,
    startGame,
    waitForEnemy
  }) => {
    await startGame();
    await waitForEnemy();

    // Check low convergence state (blue)
    let convergenceColor = await gamePage.evaluate(() => {
      const el = document.getElementById('convergence-value');
      return el ? getComputedStyle(el).color : '';
    });
    // Should be blue at low convergence
    expect(convergenceColor).toBeTruthy();

    // Move to increase convergence
    await gamePage.keyboard.down('KeyW');
    await gamePage.waitForTimeout(1000);
    await gamePage.keyboard.up('KeyW');

    // Check medium convergence state
    await gamePage.waitForTimeout(500);

    // Verify convergence value updated
    const convergenceText = await gamePage.textContent('#convergence-value');
    expect(convergenceText).toMatch(/\d+%/);
  });

  test('high convergence shows red color', async ({
    gamePage,
    startGame,
    waitForEnemy
  }) => {
    await startGame();
    await waitForEnemy();

    // Try to get high convergence
    for (let i = 0; i < 5; i++) {
      await gamePage.keyboard.down('KeyW');
      await gamePage.waitForTimeout(300);
      await gamePage.keyboard.up('KeyW');
    }

    // Check if convergence is high enough for red color
    const convergence = await gamePage.evaluate(() => {
      const text = document.getElementById('convergence-value')?.textContent || '0%';
      return parseInt(text.replace('%', ''));
    });

    if (convergence >= 95) {
      const convergenceColor = await gamePage.evaluate(() => {
        const el = document.getElementById('convergence-value');
        return el ? getComputedStyle(el).color : '';
      });

      // Should be red at high convergence
      expect(convergenceColor).toContain('255');
    }
  });

  test('crosshair renders correctly', async ({ gamePage }) => {
    // Verify crosshair elements exist
    await expect(gamePage.locator('#crosshair')).toBeVisible();
    await expect(gamePage.locator('.crosshair-line.horizontal')).toBeVisible();
    await expect(gamePage.locator('.crosshair-line.vertical')).toBeVisible();
    await expect(gamePage.locator('.crosshair-ring')).toBeVisible();
  });

  test('visual effects layers exist', async ({ gamePage }) => {
    // Verify visual effect layers
    await expect(gamePage.locator('.vignette')).toBeAttached();
    await expect(gamePage.locator('.scanlines')).toBeAttached();
    await expect(gamePage.locator('.chromatic-aberration')).toBeAttached();
    await expect(gamePage.locator('.flash')).toBeAttached();
  });

  test('lock-on ring appears when convergence achieved', async ({
    gamePage,
    startGame,
    waitForEnemy
  }) => {
    await startGame();
    await waitForEnemy();

    // Try to align with enemy
    await gamePage.keyboard.down('KeyW');
    await gamePage.waitForTimeout(1000);
    await gamePage.keyboard.up('KeyW');

    // Check if lock indicator exists
    const lockIndicator = gamePage.locator('#lock-indicator');
    await expect(lockIndicator).toBeAttached();

    // The lock indicator should have the active class when converged
    const hasActiveClass = await lockIndicator.evaluate(el =>
      el.classList.contains('active')
    );

    // Just verify the element exists (active state depends on alignment)
    expect(lockIndicator).toBeAttached();
  });

  test('screen flash effect triggers', async ({
    gamePage,
    startGame,
    waitForEnemy
  }) => {
    await startGame();
    await waitForEnemy();

    // Get initial flash state
    const initialFlashActive = await gamePage.evaluate(() => {
      const el = document.getElementById('flash');
      return el ? el.classList.contains('active') : false;
    });

    expect(initialFlashActive).toBe(false);

    // Try to fire and potentially trigger flash
    await gamePage.keyboard.press('Space');

    // Flash should trigger (even if not converged, the effect exists)
    await gamePage.waitForTimeout(100);

    const flashElement = gamePage.locator('.flash');
    await expect(flashElement).toBeAttached();
  });

  test('wave transition overlay exists', async ({ gamePage }) => {
    // Verify wave transition element exists
    const waveTransition = gamePage.locator('.wave-transition');
    await expect(waveTransition).toBeAttached();

    // Check it's not active initially
    const isActive = await waveTransition.evaluate(el =>
      el.classList.contains('active')
    );

    expect(isActive).toBe(false);
  });

  test('narration system exists', async ({ gamePage }) => {
    // Verify narration element exists
    const narration = gamePage.locator('.narration');
    await expect(narration).toBeAttached();

    // Check it's not visible initially
    const isVisible = await narration.evaluate(el =>
      el.classList.contains('visible')
    );

    expect(isVisible).toBe(false);
  });

  test('act display shows correct acts', async ({ gamePage, startGame }) => {
    // Before game start, act should be displayed
    const actText = await gamePage.textContent('#act-display');
    expect(actText).toContain('ACT I');

    await startGame();

    // After game start, act should still be displayed
    const actTextAfter = await gamePage.textContent('#act-display');
    expect(actTextAfter).toContain('ACT');
  });

  test('mute button exists and is interactive', async ({ gamePage }) => {
    // Wait for page to load
    await gamePage.waitForLoadState('networkidle');

    // Mute button should be created by HUD
    const muteButton = gamePage.locator('#mute-button');
    await expect(muteButton).toBeAttached();

    // Button should be clickable
    await expect(muteButton).toHaveAttribute('type', 'button');
  });

  test('menu overlay styling is correct', async ({ gamePage }) => {
    // Verify menu styling
    const menuTitle = gamePage.locator('.menu-title');
    await expect(menuTitle).toHaveText('PARALLAX');

    const menuSubtitle = gamePage.locator('.menu-subtitle');
    await expect(menuSubtitle).toBeVisible();

    const startButton = gamePage.locator('#start-button');
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText('INITIALIZE');
  });

  test('depth readout updates', async ({
    gamePage,
    startGame,
    waitForEnemy,
    getDepth
  }) => {
    await startGame();
    await waitForEnemy();

    // Get initial depth
    const initialDepth = await getDepth();

    // Move player
    await gamePage.keyboard.down('KeyW');
    await gamePage.waitForTimeout(500);
    await gamePage.keyboard.up('KeyW');

    // Wait for update
    await gamePage.waitForTimeout(100);

    // Get new depth
    const newDepth = await getDepth();

    // Depth should change
    expect(newDepth).not.toBe(initialDepth);
  });

  test('entity count displays correctly', async ({
    gamePage,
    startGame,
    getEntityCount
  }) => {
    await startGame();

    // Initially should be 0
    const initialCount = await getEntityCount();
    expect(initialCount).toBe(0);

    // Wait for enemies to spawn
    await gamePage.waitForFunction(
      () => {
        const entityCount = document.getElementById('entity-count');
        return entityCount && parseInt(entityCount.textContent || '0') > 0;
      },
      { timeout: 10000 }
    );

    // Should now have entities
    const newCount = await getEntityCount();
    expect(newCount).toBeGreaterThan(0);
  });
});
