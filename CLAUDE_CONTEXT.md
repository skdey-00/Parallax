# PARALLAX GAME - CLAUDE CONTEXT FILE

**Last Updated:** 2025-04-19
**Project:** Parallax 3D Shooter
**Live URL:** https://parallax-game.vercel.app
**GitHub:** https://github.com/skdey-00/Parallax

---

## PROJECT OVERVIEW

Parallax is a 3D space shooter game built with Three.js featuring a unique "convergence" aiming mechanic where players must align their crosshair with enemies at different depths in 3D space.

**Core Mechanic:** The player ship stays stationary in the center. Enemies move in 3D space at different depths. Players use mouse movement to align their crosshair with enemies (convergence), wait for a lock-on indicator (red), then fire.

---

## WHAT HAS BEEN IMPLEMENTED

### Core Systems
- ✅ **Three.js 3D Rendering** - Wireframe aesthetic with neon colors
- ✅ **Convergence System** - Calculates alignment between crosshair and enemies at different depths
- ✅ **Player Ship** - Stationary in center, only crosshair moves
- ✅ **Wave Manager** - Spawns waves of enemies with increasing difficulty
- ✅ **Combat System** - Enemy destruction with particle effects
- ✅ **Health System** - 3 hearts, invulnerability frames after damage
- ✅ **Scoring System** - With combos, multipliers, and streaks
- ✅ **Weapon System** - Multiple weapon types (Plasma, Laser, Spread, Homing)

### Enemy System
- ✅ **Multiple Enemy Types:**
  - BASIC (white wireframe box)
  - FAST (elongated dart shape)
  - ECHO (blue, phases in/out)
  - HEAVY (red with armor plates, takes 3 hits)
  - SPLIT (torus with orbiting spheres)

### Boss System
- ✅ **Boss fights** at waves 3, 7, and every 10 waves
- ✅ **Shield phase** - Destroy orbiting cyan spheres first
- ✅ **Core phase** - White core exposes, shoot to damage
- ✅ **Visual health bars** for both shields and core
- ✅ **Dynamic attack patterns** (spiral, charge, spread, chaos)

### Power-Up System
- ✅ **6 Power-Ups:**
  - SPEED BOOST (green) - Faster aim movement
  - SHIELD (cyan) - Blocks one hit
  - SPREAD SHOT (orange) - 3-way fire
  - DAMAGE x2 (magenta) - Double damage
  - RAPID FIRE (yellow) - Faster fire rate
  - TIME SLOW (purple) - Slows enemies
- ✅ **Collection mechanic** - Aim and fire to collect
- ✅ **Duration tracking** with HUD display
- ✅ **In-game tutorial notifications** for new power-ups

### Hazard System
- ✅ **Dodecahedron hazards** (yellow wireframe with red core)
- ✅ **Drift toward player** from background
- ✅ **Destroyable by shooting** (added in latest update)
- ✅ **Spawn from wave 2 onwards**

### Projectile System
- ✅ **Player projectiles** - Travel toward target, themed visuals
- ✅ **Impact effects** - Burst and particle effects on hit
- ✅ **EnemyProjectileSystem** - Created but NOT integrated (enemies don't shoot yet)

### UI/HUD
- ✅ **Intro slideshow** - Sets up the story/lore
- ✅ **In-game HUD** - Convergence meter, score, combo, streak, health
- ✅ **Tutorial system** - Visual 5-slide tutorial with SVG diagrams
- ✅ **Help menu** - Press H or ESC during gameplay
- ✅ **Kill feed** - Shows recent kills with points
- ✅ **Achievement notifications** - Popup system

### Audio
- ✅ **Sound Generator** - Procedural sound effects
- ✅ **Music Generator** - Ambient background music
- ✅ **Audio Manager** - Volume control, mute button

### Tutorial/Lore
- ✅ **Intro slideshow** - 5 slides setting up the story
- ✅ **Game tutorial** - Shows on first play with visual diagrams
- ✅ **Boss reminder** - Shows when boss spawns

---

## TECHNICAL ARCHITECTURE

### File Structure
```
src/
├── core/
│   ├── Constants.ts       - Game colors, settings, configurations
│   ├── EventBus.ts        - Event pub/sub system
│   ├── Types.ts           - TypeScript interfaces and enums
│   └── PowerUpTypes.ts    - Power-up configurations
├── systems/
│   ├── WaveManager.ts     - Enemy wave spawning
│   ├── Convergence.ts     - Aim calculation
│   ├── Combat.ts          - Combat effects
│   ├── HealthSystem.ts   - Player health management
│   ├── PowerUpSystem.ts   - Power-up spawning and effects
│   ├── WeaponSystem.ts    - Player weapons and projectiles
│   ├── BossSystem.ts     - Boss fights
│   ├── HazardSystem.ts   - Hazard spawning
│   ├── AbilitySystem.ts   - Special abilities
│   ├── ScoringSystem.ts   - Score, combos, multipliers
│   ├── AchievementSystem.ts
│   ├── EnemyProjectileSystem.ts - Enemy projectiles (NOT INTEGRATED)
│   ├── GameTutorial.ts    - Main tutorial system
│   └── PowerUpTutorial.ts - In-game power-up tips
├── entities/
│   ├── Player.ts
│   └── Enemy.ts
├── assets/
│   ├── EffectsAssets.ts
│   ├── PlayerAssets.ts
│   └── EnemyAssets.ts
├── ui/
│   ├── HUD.ts
│   ├── Menu.ts
│   └── IntroSlideshow.ts
├── audio/
│   ├── AudioManager.ts
│   ├── SoundGenerator.ts
│   └── MusicGenerator.ts
├── world/
│   ├── Scene.ts
│   └── Camera.ts
├── utils/
│   ├── DeltaTime.ts
│   └── ObjectPool.ts
└── main.ts                - Main game orchestrator
```

### Event System (EventBus)
Key events:
- `GAME_START`, `GAME_OVER`
- `WAVE_START`, `WAVE_COMPLETE`
- `ENEMY_SPAWNED`, `ENEMY_DESTROYED`
- `CONVERGENCE_ACHIEVED`
- `PLAYER_DAMAGED`, `PLAYER_HEALED`, `HEALTH_CHANGED`
- `POWER_UP` events (spawned, collected, activated, expired)
- `BOSS` events (spawned, defeated, shield_destroyed, core_exposed)
- `TUTORIAL_COMPLETE`

---

## RECENT CHANGES (Latest Session)

### 2025-04-19 Session

#### Fixed Projectile Damage Bug
- **Issue:** Projectiles fired but didn't damage enemies
- **Cause:** Duplicate nested `fire()` call in tryFire()
- **Fix:** Removed duplicate call, damage now applies correctly

#### Improved Projectiles
- **Before:** Blue sphere flying toward player
- **After:**
  - Travel toward enemies (not player)
  - Themed visuals (white core, colored glow, wireframe cage)
  - Impact effects when hitting targets
  - Point light for glow effect

#### Made Hazards Destroyable
- **Issue:** Hazards (yellow with red core) couldn't be avoided (player can't move)
- **Solution:** Made hazards targetable and destroyable
- Added hazards to convergence system
- Projectiles detect and destroy hazards
- Small score bonus for destroying hazards

#### Added Comprehensive Tutorial
- **5 slides** with SVG visual diagrams
- Shows: ship, controls, enemy types, power-ups, boss mechanics
- Progress bar navigation
- Keyboard shortcuts (arrows, space, ESC)
- Auto-shows on first play
- Stored in localStorage

#### Added In-Game Help Menu
- Press **H** or **ESC** during gameplay
- Shows controls, quick reference for all entities
- Resume button

---

## KNOWN ISSUES

1. **EnemyProjectileSystem exists but is NOT integrated** - Enemies don't shoot back at player
2. **Player cannot move** - This is intentional (game design choice) but confuses some players
3. **Visual clutter** - Many wireframe objects can be confusing (addressed with tutorial)
4. **No rebindable controls** - Mouse and Space/Click only

---

## CURRENT GAME STATE

### Starting a New Game
1. Intro slideshow plays
2. Tutorial shows (first time only)
3. Main menu appears
4. Click/Space to start

### Gameplay Flow
1. Waves spawn enemies
2. Player aims mouse at enemies
3. Convergence meter rises when aligned
4. At 95%+ convergence, red lock indicator appears
5. Press Space/Click to fire
6. Destroy all enemies to complete wave
7. Boss spawns at waves 3, 7, 10+

### Difficulty Progression
- **Waves 1-3 (Act I):** Basic enemies only
- **Waves 4-7 (Act II):** Fast, Echo enemies added
- **Waves 8+ (Act III):** All enemy types, hazards active

---

## DEPLOYMENT

### Vercel Deployment
- **Production URL:** https://parallax-game.vercel.app
- **Auto-deploy:** Connected to GitHub, pushes trigger automatic builds
- **Build command:** `npm run build` (tsc + vite build)
- **Deploy command:** `npm run deploy` or `vercel --prod`

### How to Update
1. Make changes to code
2. Run `npm run build` to verify compilation
3. Run `npm run deploy` to push to Vercel
4. OR just `git push` to trigger auto-deploy

---

## GAME CONSTANTS

### Colors
```typescript
VOID_BLACK: 0x000000
WIREFRAME_WHITE: 0xffffff
AMBER: 0xFFB000
THREAT_RED: 0xFF0040
DEPTH_BLUE: 0x40C0FF
GRID_FAINT: 0x1a1a1a
```

### Convergence Thresholds
- **THRESHOLD:** 0.70 (70% - minimum to count as converged)
- **LOCK_THRESHOLD:** 0.50 (50% - when to show lock indicator)
- **HIT_ZONE:** 0.35 (35% - hit zone radius)

### Player Settings
- **Speed:** 400
- **Size:** 2
- **Max Health:** 3
- **Invulnerability Time:** 2.0 seconds
- **Damage Cooldown:** 0.5 seconds

### Enemy Settings
- **Base Speed:** 15
- **Base Z Speed:** 20
- **Size:** 20

---

## POWER-UP REFERENCE

| Type | Color | Duration | Effect |
|------|-------|----------|--------|
| SPEED_BOOST | Green #00FF00 | 10s | 2x aim speed |
| SHIELD | Cyan #00FFFF | 15s | Blocks 1 hit |
| SPREAD_SHOT | Orange #FF8000 | 12s | 3-way shot |
| DAMAGE_MULTIPLIER | Magenta #FF00FF | 10s | 2x damage |
| RAPID_FIRE | Yellow #FFFF00 | 8s | Faster shooting |
| TIME_SLOW | Purple #8000FF | 5s | 30% enemy speed |

---

## ABILITIES REFERENCE

| Key | Ability | Cooldown | Description |
|-----|---------|----------|-------------|
| Q | EMP Bomb | 30s | Destroys all enemies |
| E | Time Slow | 20s | Slows enemies |
| R | Overcharge | 25s | Rapid fire mode |

---

## NEXT STEPS / FUTURE WORK

### Potential Features to Add
1. **Enable enemy projectiles** - Integrate EnemyProjectileSystem so enemies shoot back
2. **Add more weapon types** - Currently only Plasma is available by default
3. **Weapon power-up drops** - Collect new weapons during gameplay
4. **More boss patterns** - Additional attack types
5. **High score leaderboard** - Local storage based
6. **Achievement system integration** - Actual achievement tracking

### Known Bugs to Fix
- None currently known

### Performance Considerations
- Bundle size is ~630KB (consider code splitting for future)
- Object pooling implemented for particles and trails
- Consider lazy loading for large systems

---

## DEVELOPMENT NOTES

### Controls
- **Aim:** Mouse movement
- **Fire:** Space or Click
- **Switch Weapon:** Tab (when multiple available)
- **Pause/Help:** H or Escape
- **Restart:** After game over, click RETRY

### Convergence Mechanic Details
- The convergence meter at the top shows how well-aligned you are with the nearest enemy
- Yellow (70%+) = Getting close
- Red lock indicator (95%+) = FIRE!
- Projectiles only hit when locked on

### Boss Fight Pattern
1. **Shield Phase:** Target the cyan spheres orbiting the boss
2. **Each shield** can be targeted and destroyed individually
3. **Core Phase:** Once all shields are gone, white core exposes
4. **Shoot core** to damage boss
5. **Repeat** until boss is defeated

---

## GIT REPOSITORY

### Remote
- **URL:** https://github.com/skdey-00/Parallax
- **Main Branch:** master

### Recent Commits
- `5d25995` - Add comprehensive tutorial system and help menu
- `32e1516` - Make hazards destroyable by shooting them
- `1129512` - Improve projectiles: travel toward enemies, themed visuals, impact effects
- `5742583` - Fix: Remove duplicate fire() call that prevented projectile damage
- `fa57417` - Add deploy script, enemy projectile system, game tutorial, and UI updates

---

## LOCAL STORAGE KEYS

- `parallax_tutorial_seen` - Whether player has seen the tutorial
- `parallax_stats` - High score and game statistics

---

## BUILD COMMANDS

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Build and deploy to Vercel
npm run test         # Run Playwright tests
```

---

## DEPENDENCIES

### Production
- **three** ^0.183.2 - 3D rendering library

### Development
- **vite** ^8.0.8 - Build tool
- **typescript** ^6.0.2 - TypeScript compiler
- **@types/three** ^0.183.1 - Three.js types
- **playwright** ^1.59.1 - Testing framework

---

## DESIGN DECISIONS

### Why No Player Movement?
- The convergence aiming mechanic is the core skill
- Player movement would make the game too easy
- Creates a unique "aim and time your shots" gameplay loop

### Why Wireframe Aesthetic?
- Fits the "digital/cyber" theme of the story
- Performance-friendly (simple geometries)
- Distinctive visual style
- Allows colors to convey information (threat levels, convergence state)

### Why Lock-On Mechanic?
- Adds skill ceiling (aiming quickly vs. aiming carefully)
- Clear visual feedback (yellow → red progression)
- Satisfying when you get the lock

---

## CONTACT / SUPPORT

**Developer:** sanmeetdey@gmail.com
**Project Repository:** https://github.com/skdey-00/Parallax

---

*This file is automatically updated by Claude during development sessions. It serves as context continuity between different Claude instances.*
