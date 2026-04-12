# PARALLAX

A deeply original 3D shooter where collision is determined by screen-space projection alignment rather than physical 3D collision.

## The Core Mechanic

- **No traditional hitboxes or physical collision**
- You are a Parallax Operative with a Convergence Engine
- Enemies exist at different Z-depths (distances from camera)
- To destroy an enemy, align your XY position so the enemy's screen projection overlaps with your targeting reticle
- Enemies survive by sliding along the Z-axis — breaking alignment without moving left/right
- The apparent position is a lie; only convergence reveals truth

## The Setting

Set in the dying hours of the Observation War against "The Veil" — a distributed electromagnetic intelligence. The Veil cannot be detected directly, only inferred by distortions. Your weapon fires coherent light that only exists at resolved coordinates.

**Three Acts:**
- **Act I: Contact** (Waves 1-3) - Initial engagement, basic enemies
- **Act II: Escalation** (Waves 4-7) - The Veil adapts, introduces fast and echo enemies
- **Act III: Collapse** (Waves 8+) - Full sensor array, heavy and split enemies

## Controls

- **Arrow Keys / WASD** - Move the targeting crosshair
- **SPACE / Mouse Click** - Fire when crosshair locks onto an enemy (turns red)
- **Position strategically** — Your ship rotates to face your aim direction

**Crosshair States:**
- 🔵 **Blue** - No target in range
- 🟡 **Amber** - Target near (getting close to alignment)
- 🔴 **Red** - LOCKED — Fire to destroy!

## Installation & Running

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Game Mechanics

### Convergence System

The core innovation: enemies exist in 3D space at various depths (Z-axis). Your weapon only fires when:
1. Your XY position aligns with the enemy's screen-space projection
2. Convergence percentage exceeds 95%

### Enemy AI

Enemies dodge by moving along the Z-axis, breaking your screen-space alignment without moving left/right. Different enemy types exhibit different behaviors:

- **Basic** - Slow Z-drift, simple geometry
- **Fast** - Quick Z-dodging, tetrahedron shape
- **Heavy** - Larger, slower, chases in XY
- **Echo** - Erratic Z-movement, phases in/out
- **Split** - Complex Z and XY movement patterns

### Visual Design

- Black void, white wireframe, amber/red/blue palette
- No textures, only geometry
- Monospaced terminal-like HUD
- Chromatic aberration vignette
- Scanlines and film grain effects

## Technical Details

- **Engine**: Three.js for 3D rendering
- **Build**: Vite for fast development and optimized builds
- **Language**: TypeScript for type safety
- **Architecture**: EventBus pattern for decoupled systems
- **Performance**: Object pooling, delta time capping, frame-rate independence

## Design Philosophy

1. **3D IS the mechanic** — Not just the medium
2. **Zero asset loading** — Instant play, procedural Three.js primitives
3. **Movement is the input** — Your position IS the aim
4. **Enemy intelligence is spatial** — They dodge in Z, not XY
5. **Minimal aesthetic** — Geometry, light, and convergence

## Future Features

- Multiplayer as collaborative geometry
- More enemy types and behaviors
- Procedural wave generation
- AION narration system (AI-generated from play data)
- Sensor interference mechanics

---

**PARALLAX** — The truth lies in alignment.
