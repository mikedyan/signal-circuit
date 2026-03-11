# Lessons Learned

## Day 15: Bezier Wires and Core Loop Polish
- **Bezier wire hit-testing requires sampling, not math** — Unlike straight line segments, bezier curves don't have a simple "distance from point to curve" formula. Sampling 20 points along the curve with threshold=8px works well and performs fine.
- **Wire colors need simulation state override** — The color system has two modes: unique colors when building (helps trace wires), red/blue during simulation (shows signal state). The transition needs to be clean.
- **Gate count indicator tightens the core loop significantly** — Showing projected stars in real-time while building turns optimization into an active goal rather than a surprise at the end. This is the kind of small UX touch that moves "Core Loop" from 8→9.
- **wireColorIndex must reset on circuit clear** — Otherwise colors keep cycling across different levels, wasting early palette slots.

*This file grows over time. Every QA run adds patterns here. Every agent reads it.*

## Code Patterns
- **Two-click wire drawing** works better than drag for canvas-based pin connections — more precise
- **Grid snapping** (20px) gives a clean look without being restrictive
- **Topological sort** for circuit evaluation handles any gate arrangement correctly
- **IONode pins** have inverted types: input nodes have "output" pins (they feed into the circuit), output nodes have "input" pins (they receive from the circuit)
- **Screen state management** — use a `currentScreen` variable and show/hide DOM containers rather than full-page navigation
- **Canvas resize timing** — when switching from hidden to visible, schedule resize with `setTimeout(() => renderer.resize(), 50)` to let DOM layout settle

## Common Bugs
- **Pin hit-testing offset:** Pin circles are rendered at ±12px from the gate edge. Hit-testing must use the same offset.
- **Wire shadow rendering order:** Draw shadow first, then redraw wire on top. If reversed, shadow covers the wire.
- **Star thresholds:** Always verify optimal gate count by actually solving the puzzle. De Morgan levels need NOT+NOT+GATE+NOT = 4 gates minimum, not 3.
- **Undo after gate removal:** Must store associated wires to restore them on undo.

## Architecture Decisions
- Canvas-based rendering chosen over SVG/DOM for performance with many wires
- No framework — vanilla JS with class-based modules
- GameState is the central state object, accessible globally as `window.game` for debugging
- Script load order matters: gates.js → wires.js → simulation.js → levels.js → canvas.js → ui.js → main.js
- Undo/redo stores action objects with enough data to reverse them
- `roundRect()` utility function used for consistent rounded corner rendering
- Animated simulation uses async/await with requestAnimationFrame
- Wire hit-detection: point-to-segment distance at 8px threshold works well
- Progress stored in localStorage as JSON with level-keyed structure
- Level select uses DOM elements (not canvas) for better text rendering and accessibility
- Celebration particles use a separate overlay canvas with pointer-events: none

## Day 8: Hint System & Caching
- **Cache busting for development** — Python's http.server and browsers cache JS files aggressively. Always add `?v=N` query params to script tags in index.html and increment on each deploy. This prevents stale JS from being served.
- **Progressive hint penalty** — hints 2+ reduce max stars. Track `maxHintPenalty` and cap `calculateStars()` output. First hint free incentivizes exploration before penalty kicks in.
- **Skip appears late** — show skip button only after all hints used OR 60+ seconds. Prevents premature skipping while still being an escape hatch for stuck players.
- **Reset hint state on level load** — clear `hintsUsed`, `maxHintPenalty`, hint display, skip button, and timers every time a level loads. Otherwise hint state leaks between levels.

## Day 6: Mobile & Responsive Patterns
- **Resize before load** — canvas must be resized (to match new container) BEFORE loading level data that depends on canvas dimensions. `showScreen()` → `resize()` → `loadLevel()`, not the reverse.
- **Scale positions** — hardcoded level coordinates designed for desktop (700x400) don't fit mobile screens. Use a `_scalePosition()` method that maps reference coordinates to actual canvas size. Keep reference dimensions consistent (700x400).
- **Touch event order** — use `touchstart` → find interaction target (pin for wire, gate for drag), `touchmove` → update, `touchend` → commit. Always `preventDefault()` with `{ passive: false }` to block scrolling.
- **Long-press for mobile right-click** — 500ms timer on touchstart, cancel on touchmove. Mobile has no right-click, so long-press is the standard alternative for contextual actions.
- **Second resize after layout settle** — CSS flex layouts may not have their final dimensions immediately after `display: flex/block` is set. Schedule a second resize after 100ms.

## Day 5: Audio Patterns
- **Web Audio API lazy init** — AudioContext must be created from a user gesture (click/tap). Use `_ensureContext()` pattern: create on first sound call, not on page load.
- **AudioContext resume** — Chrome suspends AudioContext until user interaction. Always call `ctx.resume()` before playing.
- **Procedural sounds** — oscillators + gain envelopes are cheap and effective. No need for audio files. Sawtooth+noise for "zap", sine for clean tones, square for buzzy fail.
- **Gain envelope cleanup** — use `exponentialRampToValueAtTime(0.001, ...)` not `0` (exponential can't ramp to zero). Stop oscillator after envelope ends.
- **Status bar with child elements** — when adding buttons inside status bar, use a `<span>` for text and target that with `textContent` to avoid clobbering child elements.
- **Compatible pin highlighting** — rendering pulsing highlights on valid connection targets during wire drawing significantly improves UX clarity. Use `performance.now()` for smooth sine-based pulse animation.

## Day 4: Challenge Mode Patterns
- **Procedural truth table generation** — filter degenerate cases by checking: all-0, all-1, matches single input, matches inverted single input. Loop with retry up to 100 attempts.
- **Multi-screen navigation** — showScreen() hides/shows all screen containers. Use `currentScreen` state var to decide render behavior.
- **Challenge vs Campaign mode** — use boolean flags (`isChallengeMode`, `isSandboxMode`) on GameState to toggle scoring, UI, and navigation behavior rather than forking logic.
- **Slider inputs** — use `input` event (not `change`) for live updates as user drags.
- **Leaderboard storage** — separate localStorage key from progress. Key by difficulty (e.g., "2x1") for per-difficulty rankings.
- **Sandbox evaluation** — generate all 2^N input combos programmatically and evaluate once per row. No animation needed — instant results.
