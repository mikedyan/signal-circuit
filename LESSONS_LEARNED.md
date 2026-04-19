# Lessons Learned
## Day 41 — Achievement Expansion
- **Stats schema migration with spread defaults**: Using `{ ...defaults, ...(data.stats || {}) }` cleanly handles loading old saves that lack new fields. No explicit migration code needed — new fields get default values, existing fields are preserved. Always define a full defaults object for this pattern.
- **Separate tracking for similar-but-distinct events**: Daily challenges and random challenges look similar but need separate counters (dailyChallengesTotal vs challengesCompleted) and separate streak logic. When adding new achievement types, audit whether existing counters truly match or need splitting.
- **Mode tracking at entry points**: Each game mode has a clear entry function (startLevel, startDailyChallenge, startChallenge, startSandbox, startBlitzMode, startSpeedrunMode) — ideal hook points for tracking. Call tracking before mode-specific setup so the array persists even if setup fails.
- **Achievement condition checks need gameState access**: Some achievements (like Universal Builder) need to inspect the actual game state (gates array, level config). Pass gameState to checkAfterCompletion and use it directly rather than storing derived state separately.

## Day 40 — Cosmetic Unlock System
- **Non-invasive rendering overlays**: Using early-return dispatch (`if (skin !== 'ic_chip') { this._renderSkin(ctx, isSelected, skin); return; }`) keeps the default render path completely unchanged. Zero regression risk on existing visuals. Same pattern works for board themes.
- **Delta-based unlock detection**: Seed a baseline Set of unlocked IDs on first `checkUnlocks()` call, then detect new unlocks by comparing against the baseline on subsequent calls. Prevents false "NEW UNLOCK!" toasts on page reload.
- **Cosmetic priority chain**: For wire colors: colorblind mode > cosmetic palette > default. Accessibility needs always take priority over aesthetic preferences. Check accessibility flags first in `getWireColors()`.
- **Global access via `window.game`**: Rendering code (gates.js, wires.js, canvas.js) loads before main.js, so they can't import CosmeticManager directly. Using `window.game.cosmetics` as the access path works because render methods are only called after initialization. Always guard with `typeof window !== 'undefined' && window.game && window.game.cosmetics`.

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

## Day 42 — Error Explanation System
- **Backward trace from wrong outputs**: Starting at the output node and following incoming wires backward through gates is the natural approach for "why did this fail?" explanations. Max depth of 3 keeps traces readable while covering most circuits.
- **Prototype methods for appending behavior**: Using `Simulation.prototype.traceFailurePath = function(...)` allows adding methods to existing classes without rewriting the class body. Safe for append-only file edits.
- **Storing traces by row index**: Using `tracesByRow[rowIndex]` maps cleanly to the truth table rendering, where each row already has an index. Avoids needing to cross-reference.
- **Canvas highlight with auto-clear timestamp**: Using `performance.now() + duration` for `_errorHighlightUntil` is cleaner than setTimeout — no timer cleanup needed, and the render loop naturally stops when the time expires.
- **Inline onclick for dynamic HTML**: When generating HTML via innerHTML in truth table rows, inline onclick handlers that reference `window.game` are the simplest approach. More complex event delegation isn't worth it for these small, transient DOM elements.

## Day 43 — Level Preview Thumbnails
- **IntersectionObserver for lazy canvas rendering**: Creating many canvas elements is cheap, but rendering to them is expensive. Using IntersectionObserver to defer rendering until visible eliminates performance impact of dozens of preview canvases off-screen.
- **Bounding box + proportional scaling for any-size content**: Computing the bounding box of all elements, then scaling with aspect ratio preservation and centering, handles any circuit size uniformly — from 1-gate tutorials to 10-gate complex circuits.
- **2x canvas for retina sharpness**: Setting canvas.width to 2x the CSS display size gives crisp previews on high-DPI displays. Same pattern as the main game canvas.
- **stopPropagation on nested clickables**: Preview canvas and View Solution button sit inside the clickable level card. Without stopPropagation(), clicking the preview triggers both the preview action AND the card's click-to-play handler. Always stop propagation on nested interactive elements.
- **Compact data keys for localStorage economy**: Using single-letter keys (g, w, io, t, fx) instead of full names (gates, wires, inputOutput, type, fromX) reduces per-preview storage by ~40%. With LRU eviction at 20 entries, total storage stays well under 50KB.

## Day 44 — Anonymous Daily Leaderboard
- **Pre-screen pattern for game modes**: Using a dedicated pre-screen (like challenge-config, sandbox-config) works well for modes that need context before starting. Add the screen ID to the `showScreen()` screens array, and create a `showXConfig()` method on GameState for navigation.
- **isDaily vs isChallenge**: Daily challenges are NOT marked as `isChallenge`. Always add explicit `isDaily` branches wherever `isChallenge` is checked to avoid fall-through to campaign logic. This caused the title to break on daily challenges.
- **Seeded PRNG for pseudo-leaderboards**: Using a different seed offset (seed+999) for leaderboard scores prevents correlation with the challenge's truth table generation while maintaining determinism. Same date always produces same leaderboard.
- **Best-only score tracking**: Compare both gates AND time when deciding whether to update — `gateCount < existing.gates || (gateCount === existing.gates && timeSeconds < existing.time)`. This prevents worse scores from overwriting better ones while allowing time improvements at the same gate count.
- **Bell-curve score distribution**: Using `(r1 + r2) / 2` as a simple normal-distribution approximation (central limit theorem with 2 samples) creates believable score clusters around the mean without importing a statistics library.

## Day 45 — Gate Limit Challenge Variants
- **Mode flags + early return in indicators**: Adding `isGateLimitMode` check before the existing challenge/daily branch in `updateGateIndicator()` with an early `return` prevents the new mode from falling through to incompatible styling logic. Always put new mode checks before existing ones.
- **Budget enforcement at the source**: Blocking gate placement in `addGate()` rather than at simulation time gives immediate feedback. Returning `null` is safe because all callers (toolbox drag, number keys, gamepad) already handle the case.
- **Separate completion tracking from regular progress**: Using `gateLimitCompleted` as a separate boolean on the existing progress entry (rather than a new save structure) means zero migration code. The field simply doesn't exist until earned.
- **Achievement counter in stats object**: Storing `gateLimitCompletions` in `achievements.stats` (already persisted and loaded with defaults spread) is cleaner than a separate localStorage key. The spread defaults pattern handles missing fields gracefully.
- **Speedrun mode variants via toggle + separate key**: A simple checkbox toggle + reading state at start + separate localStorage key for the best time gives variant speedruns without forking the speedrun logic. The `_speedrunGateLimit` flag carries through all advance calls.

## Day 46 — Separate SFX/Music Volume Controls
- **Bulk `this.masterVolume *` → `this._sfxVol *` migration**: Since virtually all `this.masterVolume` usages in play methods follow the `this.masterVolume * <float>` pattern, a simple string replace catches them all. Only constructor init, property loader, and the deprecated `setMasterVolume` method use `this.masterVolume` without ` * `, so they're naturally excluded.
- **Dual slider sync pattern**: When the same setting has UI in two screens (gameplay + level select), use `_syncVolSliders(category, val)` to update all sliders of the same category. Simpler and more reliable than cross-listening event handlers.
- **Category-aware muted flag**: When splitting volume into categories, `this.muted` should be `sfx === 0 && music === 0`, not tied to either alone. Methods that check `this.muted` at the top (like `startAmbient`) need this dual check.
- **Volume preview debounce at 200ms**: Fires once after the user pauses slider adjustment. Prevents audio spam during rapid drags while still feeling responsive.
- **Sim normalization via `_effectiveSfxVol`**: A simple `_simNormFactor` (0.7 = 30% reduction) applied only in sim pulse methods prevents ear fatigue on large truth tables (8+ rows) without affecting other SFX. Resets on `resetSimPitch()`.

## Day 47 — Celebration Variety System
- **Pre-mutation state capture for context**: When you need to compare "before" vs "after" state (e.g., was this an improvement?), capture the relevant data BEFORE the mutating function call. In this case, reading `progress.levels[id]` before `completeLevel()` modifies it.
- **Chapter ID ≠ chapter index**: CHAPTERS array uses id field (1-9) which doesn't match array index due to bonus chapters. Always use `chapter.id` from the array, not the index.
- **Flash color needs alpha**: CSS flash animations that control opacity still need the background color to have alpha. Using solid hex as background with CSS opacity:0.6 creates overly bright flashes. Convert to `rgba(r,g,b,0.3)`.
- **Backward-compatible context parameter**: Adding an optional `context` parameter to `startCelebration(stars, context)` means all existing call sites (milestone celebrations) continue to work without changes. Default to empty object in the factory method.
- **Dispatch by shape[0] for unique particle types**: Using `shapes[0]` as the primary dispatch key (spark, hex_ring, gate_rain) keeps the particle generation logic clean. Default confetti shapes (rect, circle, triangle, gate_symbol) all go through the same loop.

## Day 48 — Keyboard-First Wiring Mode
- **Guard existing handlers with mode flag**: When adding a new keyboard mode that overrides Tab/Enter, add `!this._newMode` to existing `if` conditions rather than relying solely on `stopImmediatePropagation()`. Belt and suspenders prevents the original handler from also firing in edge cases.
- **Pin coordinate offsets are the source of truth**: Gate input pins render at `pin.x - 12`, output pins at `pin.x + 12` (visual pin circle offset from gate edge). KB wiring must construct wire endpoint coordinates using these same offsets for consistency with mouse-drawn wires.
- **Cycling through filtered subsets needs separate state**: When Tab has dual behavior (cycle all elements vs cycle destinations), store separate state for each: `_kbDestCandidates[]` with `_kbDestIndex` for the wiring phase, vs the general `_kbSelectedElement` for the selection phase.
- **Output nodes are wire sinks, not sources**: IONode with type='output' has a pin of type='input' (receives signal). Attempting to start a wire from an output node should show a helpful error message, not silently fail. Always check the element type when determining available pins.

## Day 51 — Solution Replay Viewer
- **IONode IDs change between sessions**: Because IONode IDs come from the global nextId counter, they differ each time a level loads. Any cross-session feature (like replays) must map old IONode IDs to new ones by position index, not by raw ID. Record IONode IDs at recording start and build a mapping table at replay start.
- **Replay ID mapping pattern**: Use a simple `_idMap[oldId] = newId` dictionary. Map IONodes by index position on level load, map gates as they're placed. Wire actions look up both endpoints in the map with fallback to raw ID for backward compatibility.
- **Max delay cap for replays**: Players may pause for minutes between actions. Capping inter-action delay at 2 seconds keeps replays watchable without needing to normalize the entire timeline.
- **Guard interaction at the source**: Adding `if (this._replayViewerActive && !skipUndo) return null` in addGate is cleaner than trying to guard every UI entry point. The skipUndo flag distinguishes replay-initiated vs user-initiated calls.
- **Separate overlay from completion UI**: Replay controls are a gameplay overlay (sibling of star-display), not part of the completion screen. This allows them to persist during replay and hide independently.

## Day 52 — PWA Offline + Push Notifications
- **Service worker on-the-fly caching**: Adding a `cache.put()` in the fetch handler for non-precached requests ensures that dynamically loaded resources are also available offline after first visit. Use `response.clone()` since Response body can only be consumed once.
- **Offline navigation fallback**: When a navigation request fails offline and isn't cached, fall back to `/index.html` since it's a single-page app. This prevents the browser's default offline error page.
- **beforeinstallprompt must be deferred**: The install prompt can only be triggered inside a user gesture. Capture the event, store it, then call `.prompt()` later in a button click handler.
- **Session counting for engagement gating**: Using a simple localStorage counter incremented on each page load is the most reliable way to gate features (install prompt, notification permission) behind "user has used the app N times."
- **Notification permission on user action only**: Never auto-request notification permission — it causes instant dismissal/denial. Instead, tie the permission request to the user explicitly toggling a notification setting ON.
- **In-app toasts > system notifications for web games**: System notifications require permission, may not work on all browsers, and can feel intrusive. In-app toasts (CSS-animated DOM elements) are always available and better match the game's aesthetic.
- **Week number calculation for weekly features**: Use ISO 8601 week numbering (UTC-based) for consistent cross-timezone behavior. Store `YYYY-WNN` as the dedup key.

## Day 53 — Sub-Circuit Abstraction System
- **Dynamic GateTypes registration**: Sub-circuits register themselves in the global `GateTypes` object at runtime using `SUB_{id}` keys. This avoids modifying the static gate definitions while making custom gates work with existing placement, wiring, and rendering code.
- **Truth table as evaluation engine**: Instead of simulating an internal circuit, sub-circuits store their truth table output map and look up results by converting input values to a binary index. Simpler, faster, and handles any input/output count.
- **Gate.evaluate() dispatch pattern**: Adding a sub-circuit check at the top of `evaluate()` with early return keeps the default path clean. The `isSubCircuit` flag on the GateType def makes the check nearly free.
- **Toolbox extension via mode flags**: Checking `isSandboxMode || isChallengeMode || isDaily` to conditionally add custom gates keeps them out of campaign mode (preserving puzzle integrity) while making them available in creative modes.
- **Status bar display name**: Sub-circuit gate types have IDs like `SUB_1776526103859` — adding a `fullName` property to the GateType def and falling back to it in the status bar prevents ugly ID strings from showing to the player.

## Day 54 — Stats Dashboard Overhaul
- **Level property names differ from expected**: LEVELS use `title` not `name`, CHAPTERS use `levels` array not a `chapter` field on each level. Always inspect actual object keys with `Object.keys()` in dev console before writing code that references them.
- **Falsy zero trap in JS**: `p.bestTime` and `p.bestGateCount` can legitimately be 0. Using them in boolean checks (`if (p.bestTime)`) skips valid zero values. Always use `p.bestTime != null` or `p.bestTime >= 0` for numeric fields that can be zero.
- **Service worker caches old JS aggressively**: Even with cache-busting query params on script tags, the SW may serve old responses from its runtime cache. During development, always clear SW caches before testing. For production, bumping the SW's CACHE_VERSION is necessary.
- **Canvas chart rendering needs rAF after modal display**: Canvas elements have zero dimensions if the parent is `display:none`. Always use `requestAnimationFrame()` after setting the modal visible to ensure canvases have their correct size before drawing.
- **innerHTML += destroys event listeners on existing DOM**: Using `container.innerHTML += html` re-parses the entire container, destroying any event listeners on existing elements. Acceptable here because `renderStatsDashboard()` uses `innerHTML =` (full replace) followed by `+=` for new sections, and we wire up event listeners AFTER the final `innerHTML +=`.
- **Lazy chart pattern: create on open, destroy on close**: Canvas chart elements created via innerHTML when the modal opens, drawn via rAF callback, and removed via `querySelectorAll('canvas.stats-chart').forEach(c => c.remove())` on close. Zero overhead when modal is closed.
