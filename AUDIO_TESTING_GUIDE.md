# Audio Testing Guide - Parallax

## Quick Start

1. **Open the game:**
   ```
   http://localhost:3004
   ```

2. **Initialize audio:**
   - Click "INITIALIZE" button
   - Audio system activates on first user interaction

3. **Test mute functionality:**
   - Look for 🔊 button in bottom-right corner
   - Click to toggle mute (changes to 🔇)
   - All sounds should stop/resume

## Audio Features to Test

### 1. Ambient Drone (Always On)
**What to listen for:**
- Very subtle low-frequency hum
- Barely perceptible white noise (like space static)
- Should feel like "silence with presence"

**Volume:** Extremely low (3% of max)

### 2. Convergence Tone
**How to test:**
1. Wait for enemies to spawn
2. Move to align crosshair with enemy
3. Listen for rising tone as convergence increases

**What to expect:**
- Low pitch (200Hz) at 0% convergence
- High pitch (1000Hz) at 100% convergence
- Volume increases slightly with convergence
- Clean "lock" sound when >95% converged

### 3. Combat Sounds

#### Kill Sound
**How to test:**
1. Achieve >95% convergence (lock indicator appears)
2. Press SPACE or CLICK to fire
3. Listen for resonant strike sound

**What to expect:**
- Clean, impactful tone
- Quick decay (300ms)
- Satisfying "hit" feeling

#### Beam Sound
**How to test:**
- Fire weapon (SPACE or CLICK)
- Listen for brief, sharp sound

**What to expect:**
- Very short (50ms)
- Bright attack
- Subtle texture

### 4. Act III Music
**How to test:**
1. Play through waves until Act III (wave 11+)
2. Listen for dissonant choir entering

**What to expect:**
- Unsettling, minimal harmony
- Fades in over 2 seconds
- Creates tension
- Stops when leaving Act III

### 5. UI Sounds
**How to test:**
- Click mute button → hear click sound
- Complete wave → hear two-tone confirmation

**What to expect:**
- Subtle, non-intrusive
- Quick feedback
- Professional feel

## Debugging

### No Sound?
1. Check browser console for errors
2. Verify audio context is initialized (look for "[Audio] Initialized" in console)
3. Try refreshing and clicking initialize again
4. Check if muted (🔇 icon)

### Audio Too Loud/Quiet?
- Current master volume: 30% (line 25 in AudioManager.ts)
- Adjust `masterGain.gain.value = 0.3` as needed

### Sounds Not Triggering?
1. Check browser console for Web Audio API errors
2. Verify AudioManager.getInstance() is called
3. Check if audio context is suspended

## Browser Compatibility

### Chrome/Edge
- Full support expected
- No issues

### Firefox
- Full support expected
- May have slightly different oscillator characteristics

### Safari
- Should work with webkitAudioContext fallback
- May require additional user interactions

## Performance Notes

### CPU Usage
- Minimal: 3 oscillators (ambience) + 1 (convergence) = 4 continuous
- Act III adds 12 more (total: 16)
- Well within modern device capabilities

### Memory
- Tiny: No audio buffers
- Only oscillator nodes

## Known Issues

### None currently

## Future Enhancements

If you want to expand the audio system:

1. **More Dynamic Music**
   - Add layers that fade in/out
   - Respond to combat intensity

2. **Spatial Audio**
   - Positional sound for enemies
   - 3D panning

3. **More Sound Variation**
   - Slight randomization in kill sounds
   - Different beam sounds per enemy type

4. **Audio Settings UI**
   - Volume sliders
   - Mute individual categories

## Audio Files Reference

### `src/audio/AudioManager.ts`
- Singleton pattern
- Manages AudioContext
- Master volume control
- Mute functionality

### `src/audio/SoundGenerator.ts`
- All game sound effects
- Convergence tone
- Kill/beam sounds
- Ambient drone
- UI sounds

### `src/audio/MusicGenerator.ts`
- Act III dissonant choir
- 6 oscillators with vibrato
- Creates unsettling atmosphere

## Enjoy Testing!

The audio is designed to be minimal and subtle. If you feel it's "too quiet," that's intentional - the aesthetic is near-silent with meaningful audio cues for gameplay feedback.
