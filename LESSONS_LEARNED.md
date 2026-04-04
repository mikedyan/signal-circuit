# Lessons Learned
## Day 39 — Truth Table Enhancement
- **Lazy state objects for UI components**: Using a `_ttState()` method that lazy-initializes and returns a state object (with `_ttResetState()` to clear) keeps component state clean without polluting the constructor. Resets on level load, persists within a session.
- **Canvas highlight via game state bridge**: Setting `_highlightedInputRow` on the game state and reading it in the render loop cleanly bridges DOM hover events to canvas rendering. No coupling between UI and renderer classes needed.
- **Auto-init defaults based on level properties**: For 4-input levels, auto-enabling key rows mode on first render (flagged with `_initialized`) gives a better default UX without requiring explicit per-level configuration.
- **Color-coded cell classes vs inline styles**: Using CSS classes (`tt-val-0`, `tt-val-1`) instead of inline color styles makes the coloring work with light mode, colorblind mode, and other theme toggles via CSS overrides.

## Day 38 — Interactive Tutorial
- **Service worker cache invalidation**: Always bump SW cache version AND add new files to ASSETS list when adding JS files. Cache-first strategy means new files are invisible until the SW updates.
- **DOM overlay placement**: For `position: absolute` overlays, ensure the overlay element is a child of the `position: relative` container. Placing it as a sibling breaks positioning.
- **Tutorial step advancement via hooks**: Using targeted `onGatePlaced()`, `onWireStarted()`, `onWireCompleted()` hooks keeps the tutorial decoupled from core game logic. No changes to the wire/gate core classes needed.
- **Continuous render flag for animations**: Tutorial pulsing highlights need the render loop to keep running. Add the tutorial active check to the render loop condition alongside `isAnimating` and `hasActiveParticles`.


## Day 37 — Signal Flow Animation
- **Per-wire animation is cleaner than global progress**: Using `_animPhase` (0-1) on each wire with topological depth-based delays creates natural signal flow without complex global timing. Each wire independently tracks its own progress.
- **Topological depth assignment via BFS**: Compute wire depths from input nodes (depth 0) through gates. Each wire's delay = depth * stagger_ms. This automatically creates left-to-right flow for any circuit topology.
- **Always reset custom animation properties before BOTH test modes**: Quick Test and normal RUN both need to clear `_signalPulse`, `_receiveFlash`, `_signalArrived` to prevent ghost animations from previous runs.
- **ctx.save()/ctx.restore() for scale transforms**: IONode pulse animation uses canvas scale — must be paired carefully and restored before pin rendering to avoid offset bugs.
- **Performance guard pattern**: Simple wire count check (>50) to skip staggered animation on complex circuits prevents frame drops without needing FPS measurement.

## Day 25
- **Duplicate method definitions are silent bugs in JS**: The Builder concatenated new methods below existing ones without removing originals. JavaScript overwrites the first with the last definition, so it _works_ but accumulates dead code. QA should check for duplicate method/function names after each build.
- **Semantic wire colors dramatically improve readability**: Assigning wire colors by source pin (instead of incrementing globally) makes complex circuits immediately more parseable. Worth doing early in any circuit builder.

## Day 23 — Content Architecture
- **Encyclopedia unlock logic**: Using `isLevelUnlocked()` catches both completed AND available levels, giving a broader view of what the player has access to — better UX than only unlocking gates for completed levels.
- **Lifetime stats**: Simple counter pattern (load → increment → save) works well for localStorage-based analytics. Key insight: track on actual action (gate placement) not on UI event.
- **Milestone timing**: Using `setTimeout` with 2500ms delay for milestones ensures they don't compete with the standard level completion celebration. Stagger your celebrations.
- **Stats modal grid**: CSS grid with 2 columns works well for stat cards. Using emoji as icons keeps it lightweight and thematic.

## Day 21: Narrative, Progression & Emotional Arc
- **Thin narrative > no narrative** — Adding a spacecraft repair theme with per-chapter subsystems (Navigation, Communications, Life Support) creates emotional investment without blocking gameplay. No cutscenes needed — just contextual flavor text.
- **Curated challenge library beats pure random** — 26 curated truth table patterns (NAND, Parity, Majority, etc.) with named titles makes challenges feel designed rather than arbitrary. 70/30 curated/random split keeps variety.
- **Tiered achievements create aspiration** — Bronze/Silver/Gold tiers with increasing difficulty give players something to work toward. Flat achievement lists feel like checklists; tiers feel like progression.
- **Timer visibility matters for mood** — Hiding the timer during campaign play removes pressure; showing it post-completion as "Your time: X:XX" makes it informational rather than stressful. Timer in challenge mode where speed matters.
- **Guard ALL state-dependent UI against mode switches** — The skip button bug (showing in challenge mode) happened because timer-based display logic didn't check game mode. Every UI toggle needs mode awareness.
- **Audio escalation adds unconscious tension** — Ascending pitch for passing rows builds momentum; descending buzz for failures creates "try again" motivation. Small but impactful.

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
