# PARALLAX - Playtest Guide

## Quick Start

1. Open terminal: `cd C:\Users\sanme\desktop\Vibejam\Parallax`
2. Run: `npm run dev`
3. Browser opens to: `http://localhost:3000`
4. Click "INITIALIZE" to start

## Understanding the Core Mechanic

**The Innovation**: Enemies exist in 3D space at different depths (Z-axis). Your weapon only fires when you align your screen-space position with the enemy's projected position.

### How It Works

1. **Move** with WASD/Arrow Keys to position your ship
2. **Watch the Convergence Meter** (top center) - it shows alignment percentage
3. **Align** with enemies by matching their apparent screen position
4. **Fire** with SPACE or Mouse Click when convergence > 95%
5. **Enemies dodge** by sliding along the Z-axis (toward/away from camera)

### Key Insight

- When an enemy is at a different depth than you, your screen positions don't match
- You must move to align the perspective
- Enemies survive by changing depth, not by moving left/right
- The crosshair center is where you're aiming

## Enemy Types

### Act I: Contact (Waves 1-3)
- **Basic** (White Box): Slow Z-drift, easy to predict

### Act II: Escalation (Waves 4-7)
- **Fast** (Tetrahedron): Quick Z-dodging
- **Echo** (Blue Sphere): Erratic Z-movement, phases in/out

### Act III: Collapse (Waves 8+)
- **Heavy** (Red Box): Chases in XY, slower Z-dodge
- **Split** (Octahedron): Complex circular Z-movement

## HUD Elements

- **Convergence** (top): Alignment percentage with nearest enemy
- **Wave** (top right): Current wave and act
- **Kills** (top left): Total enemies destroyed
- **Depth** (bottom left): Average Z-depth of enemies, entity count
- **Lock Indicator** (crosshair): Red ring appears when converged
- **Narration** (bottom): Story text between waves

## Visual Feedback

- **Amber crosshair**: Your ship/aiming point
- **Red lock indicator**: Convergence achieved (>95%)
- **Convergence color**:
  - Blue: < 70% alignment
  - Amber: 70-95% alignment
  - Red: > 95% (ready to fire)
- **Flash**: Enemy destroyed

## Gameplay Tips

1. **Lead your target**: Since enemies dodge in Z, anticipate movement
2. **Watch the depth readout**: Understanding enemy depth helps predict behavior
3. **Fast enemies** require quick reactions
4. **Echo enemies** are hardest to hit due to phasing
5. **Heavy enemies** chase you - keep moving
6. **Multiple enemies**: Prioritize those closest to your depth

## Controls Reference

```
WASD / Arrows    - Move ship (XY plane)
SPACE / Click    - Fire (only when converged)
```

## Technical Details

- **Frame-rate**: Capped delta for consistency
- **Performance**: Object pooling for particles
- **Architecture**: Event-driven, modular systems
- **Renderer**: Three.js with WebGL
- **Build**: Vite for optimized bundles

## Known Behaviors

- Camera lags slightly behind player for weight
- Debris floats in background for depth perception
- Fog fades distant objects
- Grid at Z=0 for reference
- Scanlines and vignette for aesthetic

## What Makes This Original

1. **No hitboxes**: Collision is screen-space projection alignment
2. **Z-axis is the dodge**: Enemies don't move left/right to dodge
3. **Your position IS the aim**: No mouse aiming
4. **Perspective is the weapon**: 3D space is the mechanic, not just visual
5. **Zero assets**: All procedural geometry

---

**The truth lies in alignment.**
