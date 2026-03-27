# Day 35: Final Polish & Technical Hardening

## T1: Stereo Panning Based on Canvas Position (#171)
- Add a StereoPannerNode to AudioEngine's output chain
- For spatial sounds (gate placement, wire connect, sparks), calculate pan value from x-position on canvas: left edge = -1, center = 0, right edge = +1
- Add helper method `_panForPosition(x)` that maps world x-coordinate to [-1, 1]
- Modify `playGatePlace()`, `playWireConnect()`, `playWireDisconnect()` to accept optional x-position for panning
- Non-positional sounds (UI clicks, success/fail jingles) remain centered (pan = 0)
- Create per-sound StereoPannerNode rather than a global one, to avoid conflicts between simultaneous sounds

## T2: Event Listeners Cleanup — AbortController Pattern (#172)
- Add an `AbortController` to GameState, created in `init()`, stored as `this._abortController`
- Pass `{ signal: this._abortController.signal }` to all event listeners registered in `setupCanvasEvents()` and other setup methods
- Add a `destroy()` method to GameState that calls `this._abortController.abort()` — cleans up all listeners at once
- This is primarily an architecture improvement for code hygiene; the game is single-page so listeners don't actually leak, but it demonstrates best practice

## T3: Spark Particles Performance — Pool Pattern (#173)
- Replace `sparkParticles` array's push/splice pattern with an object pool
- Pre-allocate a pool of 100 particle objects in `CanvasRenderer`
- `spawnSparks()` grabs particles from the pool instead of creating new objects
- Dead particles return to the pool instead of being spliced out (GC-free)
- Pool struct: `_particlePool[]` (available), `_activeParticles[]` (in use)
- Celebration canvas particles in ui.js also benefit but are lower priority; focus on canvas.js sparks

## T4: Cache-Busting Automation (#174)
- Replace hardcoded `?v=46` in index.html script/CSS tags with a timestamp-based version
- Add a small build script `build.sh` that reads index.html and replaces all `?v=<number>` with `?v=<unix_timestamp>`
- Update the version strings in index.html to current timestamp now
- Document in README that `./build.sh` should be run before deploy (or use it in the factory pipeline)

## T5: "Light Mode" Option (#175)
- Add a "Light Mode" toggle button in the settings row on level-select
- CSS class `light-mode` on body that overrides key color variables
- Light mode colors: white/cream backgrounds (#f5f3eb), dark text (#222), dark borders, green accent stays
- Canvas breadboard adapts: lighter board color, darker grid holes
- Respects `prefers-color-scheme: light` on first load (auto-detect)
- Persists choice to localStorage
- Gameplay screen, modals, toolbox, info panel all adapt

## T6: Undo History Visualization Timeline (#176)
- Add a small horizontal timeline strip below the status bar in gameplay
- Shows dots for each undo stack entry, with the current position highlighted
- Clicking a dot jumps to that state (performs multiple undo/redo operations)
- Timeline updates on every undo/redo/new action
- Compact design: thin bar, small dots, doesn't take much space
- Hidden when undo stack is empty
- Optional: hover shows action type tooltip
