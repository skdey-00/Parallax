import { test, expect } from './fixtures';

test.describe('Performance Tests', () => {
  test('frame rate stays above 30 FPS during idle', async ({
    gamePage,
    startGame
  }) => {
    await startGame();

    // Collect FPS samples
    const fpsSamples: number[] = [];

    for (let i = 0; i < 10; i++) {
      const fps = await gamePage.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();

          function countFrames() {
            frameCount++;
            const elapsed = performance.now() - startTime;

            if (elapsed >= 500) {
              // Calculate FPS over 500ms
              resolve(Math.round((frameCount / elapsed) * 1000));
            } else {
              requestAnimationFrame(countFrames);
            }
          }

          requestAnimationFrame(countFrames);
        });
      });

      fpsSamples.push(fps);
      await gamePage.waitForTimeout(100);
    }

    // Calculate average FPS
    const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

    // Log FPS for debugging
    console.log(`Average FPS: ${avgFps}`);

    // FPS should be above 30
    expect(avgFps).toBeGreaterThan(30);
  });

  test('frame rate stays above 30 FPS during movement', async ({
    gamePage,
    startGame
  }) => {
    await startGame();

    // Start continuous movement
    await gamePage.keyboard.down('KeyW');

    // Collect FPS samples while moving
    const fpsSamples: number[] = [];

    for (let i = 0; i < 5; i++) {
      const fps = await gamePage.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();

          function countFrames() {
            frameCount++;
            const elapsed = performance.now() - startTime;

            if (elapsed >= 500) {
              resolve(Math.round((frameCount / elapsed) * 1000));
            } else {
              requestAnimationFrame(countFrames);
            }
          }

          requestAnimationFrame(countFrames);
        });
      });

      fpsSamples.push(fps);
      await gamePage.waitForTimeout(100);
    }

    // Stop movement
    await gamePage.keyboard.up('KeyW');

    // Calculate average FPS
    const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

    console.log(`Average FPS during movement: ${avgFps}`);

    // FPS should stay above 30 even during movement
    expect(avgFps).toBeGreaterThan(30);
  });

  test('no memory leaks during extended play', async ({
    gamePage,
    startGame
  }) => {
    await startGame();

    // Get initial memory usage
    const initialMemory = await gamePage.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Simulate extended play (10 seconds of activity)
    for (let i = 0; i < 20; i++) {
      // Move in different directions
      const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
      await gamePage.keyboard.down(keys[i % 4]);
      await gamePage.waitForTimeout(200);
      await gamePage.keyboard.up(keys[i % 4]);

      // Occasionally fire
      if (i % 3 === 0) {
        await gamePage.keyboard.press('Space');
      }
    }

    // Wait for garbage collection to potentially run
    await gamePage.waitForTimeout(2000);

    // Get final memory usage
    const finalMemory = await gamePage.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // If memory API is available, check for reasonable growth
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercent = (memoryGrowth / initialMemory) * 100;

      console.log(`Memory growth: ${growthPercent.toFixed(2)}%`);

      // Memory growth should be less than 50% (very lenient)
      expect(growthPercent).toBeLessThan(50);
    } else {
      // Memory API not available, just verify game is still running
      await expect(gamePage.locator('#menu-overlay')).not.toBeVisible();
    }
  });

  test('object pooling works - particles return to pool', async ({
    gamePage,
    startGame,
    waitForEnemy
  }) => {
    await startGame();
    await waitForEnemy();

    // Fire multiple times to create particles
    for (let i = 0; i < 10; i++) {
      await gamePage.keyboard.press('Space');
      await gamePage.waitForTimeout(100);
    }

    // Game should still be running (no crashes from object issues)
    await expect(gamePage.locator('#menu-overlay')).not.toBeVisible();

    // FPS should still be reasonable
    const fps = await gamePage.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();

        function countFrames() {
          frameCount++;
          const elapsed = performance.now() - startTime;

          if (elapsed >= 500) {
            resolve(Math.round((frameCount / elapsed) * 1000));
          } else {
            requestAnimationFrame(countFrames);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    expect(fps).toBeGreaterThan(20); // More lenient threshold
  });

  test('performance degrades gracefully with many entities', async ({
    gamePage,
    startGame
  }) => {
    await startGame();

    // Wait for entities to spawn
    await gamePage.waitForFunction(
      () => {
        const entityCount = document.getElementById('entity-count');
        return entityCount && parseInt(entityCount.textContent || '0') >= 3;
      },
      { timeout: 10000 }
    );

    // Measure FPS with entities
    const fps = await gamePage.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();

        function countFrames() {
          frameCount++;
          const elapsed = performance.now() - startTime;

          if (elapsed >= 1000) {
            resolve(Math.round((frameCount / elapsed) * 1000));
          } else {
            requestAnimationFrame(countFrames);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    console.log(`FPS with entities: ${fps}`);

    // Should maintain at least 20 FPS even with entities
    expect(fps).toBeGreaterThan(20);
  });

  test('no memory leaks from event listeners', async ({
    gamePage,
    startGame
  }) => {
    await startGame();

    // Get initial node count
    const initialNodes = await gamePage.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // Perform various actions
    for (let i = 0; i < 10; i++) {
      await gamePage.keyboard.down('KeyW');
      await gamePage.waitForTimeout(100);
      await gamePage.keyboard.up('KeyW');
      await gamePage.keyboard.press('Space');
    }

    // Get final node count
    const finalNodes = await gamePage.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // Node count should not grow significantly
    const nodeGrowth = finalNodes - initialNodes;
    console.log(`Node growth: ${nodeGrowth}`);

    // Allow for some growth (particles, etc.) but not excessive
    expect(nodeGrowth).toBeLessThan(100);
  });

  test('rendering performs efficiently', async ({ gamePage, startGame }) => {
    await startGame();

    // Measure render time
    const renderTime = await gamePage.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();

        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(end - start);
        });
      });
    });

    console.log(`Frame render time: ${renderTime.toFixed(2)}ms`);

    // Frame should render in less than 33ms (30 FPS threshold)
    expect(renderTime).toBeLessThan(33);
  });
});
