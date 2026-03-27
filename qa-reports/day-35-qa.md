# Day 35 QA Report — Final Polish & Technical Hardening

**Date**: 2026-03-27
**Items**: #171–#176 (6 items)
**Status**: ✅ ALL PASS

## T1: Stereo Panning Based on Canvas Position (#171) ✅
- [x] `_createPanner(xPosition)` method added to AudioEngine
- [x] Maps world x-coordinate to [-0.8, 0.8] pan range (avoids hard left/right)
- [x] `playGatePlace()` now accepts optional `xPosition` parameter — gate x passed from `addGate()`
- [x] `playWireConnect()` accepts optional `xPosition` — pin.x passed from event handlers
- [x] `playWireDisconnect()` accepts optional `xPosition` — pos.x or gate.x passed from callers
- [x] Non-positional sounds (UI clicks, success/fail) remain centered
- [x] Per-sound StereoPannerNode created to avoid conflicts between simultaneous sounds
- [x] Graceful fallback when xPosition is undefined/null

## T2: Event Listeners Cleanup — AbortController Pattern (#172) ✅
- [x] `AbortController` created in GameState constructor, stored as `this._abortController`
- [x] Signal passed to all 9 event listeners in `setupCanvasEvents()`: touchstart, touchmove, touchend, mousedown, mousemove, mouseup, contextmenu, wheel, keydown
- [x] `destroy()` method added to GameState — calls `this._abortController.abort()`, clears intervals, stops audio
- [x] No functional change to existing behavior — architecture improvement for clean lifecycle
- [x] `{ passive: false }` options preserved where needed (touch/wheel events)

## T3: Spark Particles Performance — Pool Pattern (#173) ✅
- [x] Pre-allocates pool of 100 particle objects in CanvasRenderer constructor
- [x] `spawnSparks()` pops from pool instead of creating new objects
- [x] Falls back to `new` object creation if pool is empty (handles burst scenarios)
- [x] Dead particles pushed back to `_particlePool` array
- [x] In-place array compaction (`writeIdx` pattern) replaces `splice()` — no GC pressure
- [x] Zero behavioral change — same visual output, better performance

## T4: Cache-Busting Automation (#174) ✅
- [x] `build.sh` script created — replaces all `?v=<number>` with `?v=<unix_timestamp>`
- [x] Script validates it's run from project root
- [x] All 10 asset references updated (1 CSS + 9 JS files)
- [x] Documented in script comments

## T5: "Light Mode" Option (#175) ✅
- [x] "🌙 Dark Mode" toggle button added to settings row
- [x] `light-mode` CSS class on body with comprehensive overrides:
  - Level select screen, game title, chapter titles
  - Toolbox, info panel, truth table
  - Status bar, buttons, modals
  - Settings buttons, volume slider
- [x] Canvas breadboard adapts: lighter background gradient, lighter grid holes, lighter trace lines
- [x] Auto-detects `prefers-color-scheme: light` on first visit
- [x] Persists choice to localStorage (`signal-circuit-theme`)
- [x] Toggle updates button text: "☀️ Light Mode" / "🌙 Dark Mode"
- [x] Triggers canvas re-render on theme change
- [x] Undo timeline has light mode styles too

## T6: Undo History Visualization Timeline (#176) ✅
- [x] Timeline strip added above status bar in gameplay HTML
- [x] Shows dots for each action in undo/redo stacks
- [x] Current position highlighted with green glow (`.current` class)
- [x] Future (redo) states shown as dimmed dots (`.future` class)
- [x] Click any dot to jump to that state (performs multiple undo/redo)
- [x] Hover shows action type tooltip (+ Gate, - Wire, Move, Clear, etc.)
- [x] Hidden when undo stack is empty (`display: none`)
- [x] Auto-scrolls to keep current position visible
- [x] Updates on every: addGate, removeGate, undo, redo
- [x] Light mode styles included
- [x] Compact design: 18px height, 8px dots, minimal footprint

## Syntax Validation
- [x] `main.js` — parses OK
- [x] `canvas.js` — parses OK
- [x] `audio.js` — parses OK
- [x] `ui.js` — parses OK

## Regression Check
- [x] No existing functionality altered
- [x] All Day 34 features intact (break reminder, re-onboarding, volume slider, hint escalation)
- [x] Audio engine backward-compatible (x position params are optional)

## Files Modified
- `js/audio.js` — Stereo panner, updated gate/wire/disconnect methods
- `js/main.js` — AbortController, x-position params, undo timeline hooks
- `js/canvas.js` — Particle pool, light mode breadboard
- `js/ui.js` — Light mode toggle, undo timeline UI
- `css/style.css` — Light mode styles, undo timeline styles
- `index.html` — Light mode button, undo timeline element
- `build.sh` — NEW: cache-busting automation script
