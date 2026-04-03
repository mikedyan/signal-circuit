# Build Report — Day 38

## Change Plan
- **js/tutorial.js** (new): InteractiveTutorial class with 8-step guided workflow
- **index.html**: Add tutorial overlay DOM, tutorial.js script tag
- **css/style.css**: Tutorial overlay styling, pulsing highlight animation
- **js/canvas.js**: Render tutorial pin highlights in world-space before ctx.restore()
- **js/main.js**: Initialize tutorial on Level 1, wire event hooks, RUN notification, cleanup on exit

## Changes Made
- **js/tutorial.js**: Created `InteractiveTutorial` class with:
  - 8 steps: place gate → click Input A pin → click AND input 0 → click Input B pin → click AND input 1 → click AND output → click OUT input → press RUN
  - `static shouldShow(gameState)` checks localStorage + level 1 completion
  - `onGatePlaced()`, `onWireStarted()`, `onWireCompleted()`, `onRunPressed()` hooks
  - `renderHighlights(ctx)` draws gold pulsing circle + animated arrow at pin targets
  - `getHighlightTarget()` returns world-space pin coordinates per step
  - Skip button marks tutorial complete and removes all highlights
  - CSS class `tutorial-highlight` toggled on toolbox gates (step 0) and RUN button (step 7)

- **index.html**: 
  - Added `#tutorial-overlay` div inside `#canvas-container` with step indicator, text, and skip button
  - Added `<script src="js/tutorial.js">` between ui.js and main.js

- **css/style.css**: 
  - Tutorial overlay with semi-transparent backdrop, bottom-aligned instruction panel
  - Gold-themed styling matching the game's achievement aesthetic
  - `@keyframes tutorial-pulse` for toolbox/button highlights
  - Reduced-motion fallback

- **js/canvas.js**: 
  - Added tutorial highlight rendering before `ctx.restore()` (world-space coordinates)
  - Only renders when tutorial is active (zero cost when inactive)

- **js/main.js**:
  - Added `this.tutorial = null` in constructor
  - Level 1 loading: if tutorial should show, create InteractiveTutorial and start() it; otherwise fall through to old tooltip
  - Added `_tutorialWireStarted()` and `_tutorialWireCompleted()` helper methods
  - Added tutorial notifications at all 6 wire start/finish locations (touch, mouse, keyboard handlers)
  - Added tutorial notification in `runSimulation()` 
  - Added tutorial continuous render flag in animation loop
  - Added tutorial cleanup in `showLevelSelect()`

## Decisions Made
- **8 steps vs 7**: Split wire drawing into start+finish steps (click source pin, then click dest pin) for clarity. Each wire needs two actions, so 3 wires = 6 steps, plus gate placement + RUN = 8 total.
- **Canvas-rendered highlights**: Pin highlights are rendered in canvas world-space (not DOM overlays) to match exact pin positions regardless of zoom/pan state.
- **DOM overlay for instructions**: The instruction panel is a DOM element at bottom of canvas-container, not canvas-rendered, for text clarity and skip button interactivity.
- **Suppresses old tooltip**: When tutorial is active for Level 1, the old single-line tooltip is bypassed. Levels 2-4 still get their tooltips.
- **Flexible step advancement**: Tutorial watches for actions on ANY matching element (not pixel-perfect). If player wires to wrong pin or different order, tutorial only advances on the correct connection. Wrong actions are simply ignored by the tutorial (normal gameplay continues).

## Concerns
- **Pin index matching**: Steps 2 and 4 expect specific pin indices (0 and 1) on the AND gate. If the gate layout changes, these would need updating.
- **Gate reference**: Tutorial assumes `gs.gates[0]` is the AND gate placed in step 0. If player somehow has pre-existing gates (shouldn't happen on Level 1), this could misfire.
- **Mobile touch targets**: Tutorial highlights are rendered at pin positions. On mobile with zoom, they should track correctly since they're in world-space, but worth testing.

## Self-Test Results
- InteractiveTutorial class exists with all methods: PASS
- 8-step workflow defined: PASS
- localStorage check for tutorial completion: PASS
- Skip button functionality: PASS (by code review)
- Toolbox highlight CSS class toggle: PASS
- RUN button highlight CSS class toggle: PASS
- Canvas pin highlight rendering: PASS
- Tutorial cleanup on level exit: PASS
- Old tooltip suppressed during tutorial: PASS
- Continuous rendering during tutorial: PASS
