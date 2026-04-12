# PARALLAX - Game Summary

## Overview

**PARALLAX** is a deeply original 3D shooter where collision is determined by screen-space projection alignment rather than physical 3D collision. The game is fully implemented and playable at `http://localhost:3000`.

## Key Files Created

### Configuration
- `package.json` - Project dependencies and scripts
- `vite.config.js` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `index.html` - Main HTML with embedded CSS

### Documentation
- `README.md` - Project overview and setup
- `PLAYTEST.md` - Detailed playtest guide
- `GAME_SUMMARY.md` - This file

### Core Systems (15 TypeScript files)

#### src/core/
- `Types.ts` - Type definitions for game entities and state
- `Constants.ts` - Game constants (colors, depths, thresholds)
- `EventBus.ts` - Event-driven communication system

#### src/entities/
- `Player.ts` - Player ship with WASD movement
- `Enemy.ts` - 5 enemy types with unique AI behaviors

#### src/systems/
- `Convergence.ts` - Core mechanic: screen-space alignment calculation
- `Combat.ts` - Firing system with particle effects
- `WaveManager.ts` - 3-act wave progression system

#### src/world/
- `Scene.ts` - 3D scene with fog, grid, and debris
- `Camera.ts` - Camera with smooth follow behavior

#### src/ui/
- `HUD.ts` - Diegetic UI with convergence display
- `Menu.ts` - Start menu system

#### src/utils/
- `DeltaTime.ts` - Frame-rate independent time capping
- `ObjectPool.ts` - Performance optimization for particles

#### Main
- `main.ts` - Game initialization and main loop

## Game Features Implemented

### Core Mechanic
- Screen-space convergence system
- Z-axis enemy dodging AI
- No traditional hitboxes - perspective alignment determines hits

### Enemy Types
1. **Basic** - Simple Z-drift (Act I)
2. **Fast** - Quick Z-dodging (Act II)
3. **Echo** - Phasing with erratic Z-movement (Act II)
4. **Heavy** - XY chasing with slower Z-dodge (Act III)
5. **Split** - Complex circular Z-movement (Act III)

### Visual Design
- Black void with white wireframe geometry
- Amber (player), red (threat), blue (depth) color palette
- Grid helper for depth perception
- Floating geometric debris
- Chromatic vignette and scanlines
- Particle explosions

### Systems
- Event-driven architecture
- Object pooling for performance
- Delta time capping for frame-rate independence
- Resource disposal pattern
- Three-act wave progression
- Dynamic narration system

## How to Run

```bash
cd C:\Users\sanme\desktop\Vibejam\Parallax
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Build Status

**SUCCESS** - Game builds without errors

```bash
npm run build
```

Creates optimized production build in `dist/` directory.

## Technical Stack

- **Three.js** (v0.183.2) - 3D rendering
- **TypeScript** - Type-safe development
- **Vite** (v8.0.8) - Fast build tool
- **EventBus Pattern** - Decoupled systems
- **Object Pooling** - Memory efficiency

## Innovation Points

1. **Screen-space collision** - No physical hitboxes
2. **Z-axis as dodge mechanic** - Enemies break alignment by changing depth
3. **Position-based aiming** - No mouse look, your ship position IS the aim
4. **Zero assets** - All procedural geometry
5. **Perspective as weapon** - 3D space is integral to gameplay

## Game Feel

- Smooth camera lag for weight
- Responsive player movement with friction
- Visual convergence feedback (color changes, lock indicator)
- Satisfying particle explosions
- Tension through enemy Z-dodging
- Progressive difficulty across acts

## Future Enhancements

Potential additions mentioned in original spec:
- Multiplayer collaborative geometry
- Procedural wave generation
- AION AI narration from play data
- Sensor interference mechanics
- More enemy types and behaviors

## Files Reference

**Total Lines of Code**: ~2,000 lines TypeScript
**Total Files**: 21 source files
**Build Size**: ~530KB (includes Three.js)

---

**Status**: COMPLETE and PLAYABLE
**Location**: `C:\Users\sanme\desktop\Vibejam\Parallax`
**URL**: `http://localhost:3000`

The truth lies in alignment.
