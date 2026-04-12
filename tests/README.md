# Parallax Test Suite

Comprehensive Playwright-based test suite for the Parallax 3D shooter game.

## Test Structure

```
tests/
├── fixtures.ts          # Reusable test fixtures and helpers
├── gameplay.spec.ts     # Core gameplay mechanics tests
├── visual.spec.ts       # Visual regression and UI tests
├── performance.spec.ts  # Performance and memory tests
└── integration.spec.ts  # System integration tests
```

## Test Coverage

### Gameplay Tests (`gameplay.spec.ts`)
- Game starts successfully
- Player movement (WASD and Arrow keys)
- Convergence meter updates
- Convergence threshold mechanics
- Lock-on ring behavior
- Firing mechanics (Space and Mouse)
- Enemy destruction
- Wave progression
- HUD updates
- Game state management

### Visual Tests (`visual.spec.ts`)
- HUD element rendering
- Convergence color states (blue → amber → red)
- Crosshair display
- Visual effects layers (vignette, scanlines, chromatic aberration)
- Lock-on ring appearance
- Screen flash effects
- Wave transition overlay
- Narration system
- Act display updates
- Mute button
- Menu overlay styling
- Depth readout updates
- Entity count display

### Performance Tests (`performance.spec.ts`)
- Frame rate monitoring (idle and active)
- Memory leak detection
- Object pooling verification
- Performance with multiple entities
- Event listener cleanup
- Rendering efficiency

### Integration Tests (`integration.spec.ts`)
- System initialization
- EventBus integration
- Game state transitions
- Convergence-HUD integration
- Wave manager-combat integration
- Audio initialization
- Player input integration
- Effects-combat integration
- Camera-player integration
- Game loop stability
- HUD synchronization
- Menu system integration

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Debug specific test
```bash
npm run test:debug gameplay.spec.ts
```

### Run specific test file
```bash
npx playwright test gameplay.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "convergence"
```

## Test Fixtures

The test suite uses custom fixtures defined in `fixtures.ts`:

- `gamePage`: Page initialized with game URL
- `startGame()`: Helper to start the game from menu
- `waitForEnemy()`: Helper to wait for enemy spawn
- `getConvergence()`: Get current convergence value
- `getWave()`: Get current wave number
- `getScore()`: Get current score
- `getDepth()`: Get current depth value
- `getEntityCount()`: Get current entity count

## Configuration

Tests are configured in `playwright.config.ts`:

- **Browser**: Chromium
- **Base URL**: http://localhost:3000
- **Server**: Automatically starts dev server before tests
- **Workers**: 1 (to avoid port conflicts)
- **Retries**: 2 in CI, 0 locally
- **Reporter**: HTML report with screenshots/videos on failure

## Writing New Tests

When adding new tests, use the fixtures for consistency:

```typescript
import { test, expect } from './fixtures';

test('my new test', async ({ gamePage, startGame, getConvergence }) => {
  await startGame();

  // Your test logic here
  const convergence = await getConvergence();
  expect(convergence).toBeGreaterThan(0);
});
```

## Troubleshooting

### Tests fail to start
- Ensure port 3000 is available
- Check that Vite dev server can start: `npm run dev`

### Flaky tests
- Some tests depend on timing (enemy spawn, convergence)
- Increase timeouts if needed
- Run multiple times to identify timing issues

### Performance tests fail
- Performance varies by machine
- Adjust thresholds in `performance.spec.ts` if needed
- Close other applications while running performance tests

### Tests timeout
- Default timeout is 30 seconds per test
- Increase in playwright.config.ts if needed
- Check for infinite loops or blocking operations

## CI/CD Integration

The test suite is designed to run in CI environments:

```yaml
- name: Run tests
  run: npm test
```

Tests will automatically:
- Use retries in CI
- Generate HTML reports
- Capture screenshots on failure
- Record video on failure

## Test Results

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Coverage Goals

Current test coverage:
- **Gameplay**: Core mechanics (movement, convergence, combat)
- **Visual**: UI elements and effects
- **Performance**: FPS, memory, rendering
- **Integration**: System interactions and state management

## Future Improvements

Potential additions to the test suite:
- Visual regression screenshots (with Playwright screenshots)
- Accessibility testing
- Cross-browser testing (Firefox, Safari)
- Mobile device testing
- Network throttling tests
- E2E scenario tests (complete gameplay sessions)

## Notes

- Tests are designed to be non-destructive (don't modify game code)
- Some tests are timing-dependent due to game mechanics
- Performance thresholds are set conservatively
- Tests run serially to avoid race conditions
- Dev server is automatically managed by Playwright
