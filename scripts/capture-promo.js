#!/usr/bin/env node

/**
 * Parallax Promo Video Capture Script
 *
 * Records autonomous gameplay at 50 FPS showcasing the parallax convergence mechanic.
 *
 * Usage: node scripts/capture-promo.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  // Video settings
  fps: 50,
  duration: 22, // seconds
  width: 1080,
  height: 1920, // 9:16 portrait for social media

  // Game settings
  gameUrl: 'http://localhost:3000',
  outputPath: join(dirname(__dirname), 'output', 'promo.mp4'),

  // Recording timing
  warmupTime: 3000, // Wait for game to fully initialize
  recordTime: 22000, // 22 seconds of gameplay

  // Autonomous gameplay simulation
  movements: [
    // Opening sequence - show title
    { type: 'wait', duration: 2000 },

    // Start game
    { type: 'click', x: 540, y: 960, duration: 100 },

    // Core mechanic - align with enemy
    { type: 'move', x: 540, y: 800, duration: 1500 },
    { type: 'wait', duration: 1000 },

    // Z-dodge simulation - enemy will slide on its own
    { type: 'move', x: 400, y: 750, duration: 800 },
    { type: 'wait', duration: 500 },

    // Realign for convergence
    { type: 'move', x: 450, y: 820, duration: 1000 },
    { type: 'wait', duration: 1500 },

    // Kill moment - convergence complete
    { type: 'wait', duration: 1000 },

    // Multiple enemies wave
    { type: 'move', x: 600, y: 900, duration: 1200 },
    { type: 'wait', duration: 800 },

    { type: 'move', x: 500, y: 850, duration: 1000 },
    { type: 'wait', duration: 1200 },

    // Visual effects showcase
    { type: 'move', x: 540, y: 1000, duration: 1500 },
    { type: 'wait', duration: 1000 },

    { type: 'move', x: 650, y: 780, duration: 1200 },
    { type: 'wait', duration: 1000 },

    { type: 'move', x: 480, y: 920, duration: 1000 },
    { type: 'wait', duration: 1500 },

    // Final convergence sequence
    { type: 'move', x: 540, y: 860, duration: 800 },
    { type: 'wait', duration: 2000 },
  ],
};

/**
 * Simulate autonomous gameplay movements
 */
async function simulateGameplay(page) {
  const startTime = Date.now();

  for (const movement of CONFIG.movements) {
    const elapsed = Date.now() - startTime;

    // Stop if we've exceeded recording time
    if (elapsed > CONFIG.recordTime) {
      console.log(`  [Movement] Stopping movements after ${elapsed}ms`);
      break;
    }

    switch (movement.type) {
      case 'wait':
        console.log(`  [Movement] Waiting ${movement.duration}ms`);
        await page.waitForTimeout(movement.duration);
        break;

      case 'click':
        console.log(`  [Movement] Click at (${movement.x}, ${movement.y})`);
        await page.mouse.click(movement.x, movement.y);
        await page.waitForTimeout(movement.duration || 100);
        break;

      case 'move':
        console.log(`  [Movement] Moving to (${movement.x}, ${movement.y}) over ${movement.duration}ms`);
        // Smooth movement
        const steps = 10;
        const stepDuration = movement.duration / steps;
        for (let i = 0; i < steps; i++) {
          const progress = (i + 1) / steps;
          // Add some natural variation
          const variationX = (Math.random() - 0.5) * 10;
          const variationY = (Math.random() - 0.5) * 10;
          const targetX = movement.x + variationX;
          const targetY = movement.y + variationY;
          await page.mouse.move(targetX, targetY);
          await page.waitForTimeout(stepDuration);
        }
        break;
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`  [Movement] Total movement time: ${totalTime}ms`);
}

/**
 * Main capture function
 */
async function capturePromo() {
  console.log('\n=== Parallax Promo Video Capture ===\n');
  console.log('Configuration:');
  console.log(`  FPS: ${CONFIG.fps}`);
  console.log(`  Resolution: ${CONFIG.width}x${CONFIG.height} (9:16 portrait)`);
  console.log(`  Duration: ${CONFIG.duration}s`);
  console.log(`  Output: ${CONFIG.outputPath}\n`);

  // Ensure output directory exists
  const outputDir = join(dirname(__dirname), 'output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let browser = null;
  let context = null;
  let page = null;

  try {
    console.log('[1/5] Launching browser...');
    browser = await chromium.launch({
      headless: false, // Show browser for visual feedback
    });

    console.log('[2/5] Creating context with video recording...');
    context = await browser.newContext({
      viewport: { width: CONFIG.width, height: CONFIG.height },
      recordVideo: {
        dir: outputDir,
        size: { width: CONFIG.width, height: CONFIG.height },
      },
      // Ensure smooth rendering
      deviceScaleFactor: 1,
    });

    page = await context.newPage();

    // Log console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ERROR') || text.includes('WARN')) {
        console.log(`  [Browser Console] ${text}`);
      }
    });

    console.log('[3/5] Loading game...');
    await page.goto(CONFIG.gameUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('[4/5] Waiting for game initialization...');
    await page.waitForTimeout(CONFIG.warmupTime);

    console.log('[5/5] Recording gameplay...');

    // Start movements and recording simultaneously
    const movementsPromise = simulateGameplay(page);
    const recordPromise = page.waitForTimeout(CONFIG.recordTime);

    await Promise.all([movementsPromise, recordPromise]);

    console.log('\n[Finalize] Stopping recording...');

    // Close context to finalize video
    await context.close();

    // Playwright saves video with a generated filename
    // We need to find it and rename it
    const videoPath = await page.video().path();
    console.log(`  Video saved to: ${videoPath}`);

    // Use ffmpeg to process the video at exact 50 FPS
    console.log('\n[Post-process] Optimizing video with FFmpeg...');

    const { spawn } = await import('child_process');
    const ffmpegArgs = [
      '-i', videoPath,
      '-r', '50', // Set exact 50 FPS
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      CONFIG.outputPath,
      '-y', // Overwrite if exists
    ];

    console.log(`  FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      ffmpeg.stderr.on('data', (data) => {
        // FFmpeg outputs to stderr
        const output = data.toString();
        if (output.includes('frame=')) {
          process.stdout.write('\r  ' + output.trim().split('\n').pop());
        }
      });
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('\n  FFmpeg processing complete');
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });

    // Clean up original video file
    const { unlinkSync } = await import('fs');
    try {
      unlinkSync(videoPath);
      console.log('\n  Cleaned up temporary video file');
    } catch (err) {
      console.warn('\n  Warning: Could not delete temporary video:', err.message);
    }

    console.log('\n=== Capture Complete ===');
    console.log(`\nOutput file: ${CONFIG.outputPath}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Check the video to verify quality`);
    console.log(`  2. Generate thumbnail: ffmpeg -i ${CONFIG.outputPath} -ss 00:00:05 -vframes 1 output/promo-thumb.png`);

  } catch (error) {
    console.error('\n=== Capture Failed ===');
    console.error(`Error: ${error.message}`);

    if (error.message.includes('connect')) {
      console.error('\nTroubleshooting:');
      console.error('  1. Make sure the dev server is running: npm run dev');
      console.error('  2. Check the game is accessible at: ' + CONFIG.gameUrl);
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the capture
capturePromo().catch(console.error);
