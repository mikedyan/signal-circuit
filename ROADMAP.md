# Signal Circuit — Development Roadmap

---

## Phase 1: Initial Build (Complete)

<details>
<summary>Days 1–17: Core game built from scratch → playable, polished, shipped</summary>

- **Day 1** — Foundation: Canvas, 3 gates (AND, OR, NOT), wire drawing, basic simulation, 2 tutorial levels
- **Day 2** — Polish & Interaction: Signal animation, truth table, run button, delete, undo/redo, 3 more levels, gate rotation, skeuomorphic visuals
- **Day 3** — Level System & Progression: Level select, chapter system, star rating, localStorage persistence, 5 more levels, XOR unlock, celebration animation
- **Day 4** — Challenge Mode: Procedural truth table generator, sandbox mode, difficulty slider, gate-count scoring, local leaderboard
- **Day 5** — Advanced Gates & Chapter 2: NAND/NOR gates, Chapter 2 unlock, 5 new levels, constraint levels, gate count display
- **Day 6** — Mobile Support: Touch events, responsive layout, pinch-to-zoom, larger touch targets, iOS/Android testing
- **Day 7** — Audio & Juice: Click sounds, wire snap, success jingle, fail buzz, animations (bounce, trail), background hum toggle
- **Days 8–10** — Chapter 3 & Complex Circuits: MUX gate, half-adder challenges, multi-output, 10 more levels (20 total), difficulty tuning
- **Days 11–14** — Polish & Ship: Performance optimization, cross-browser testing, README, URL sharing, dark mode PCB variant, bug sweep
- **Day 15** — Core Loop Tightening: Real-time gate count, bezier wires, per-row micro-celebrations, wire color coding
- **Day 16** — Dark Mode PCB & Advanced Visuals: Theme toggle, component labels, wire routing intelligence, ambient animation
- **Day 17** — Content & Retention: 5 constraint levels, streak tracking, stats page, social sharing improvements

**Result:** 15 levels across 3 chapters, daily challenges, sandbox mode, mobile support, 2 visual themes. Score: ~4.25/10 across 14-critic expert review.

</details>

---

## Phase 2: Expert Review Overhaul

### Overview
- **Days 18–35**: 176 improvements from 14-critic expert review
- **Pace**: 10 items per day, each through full PM → Builder → QA pipeline
- **Priority**: P0 (Days 18–19) → P1 (Days 20–22) → P2 (Days 23–29) → P3 (Days 30–35)
- **Source**: Prioritized backlog scored by Impact × (6 − Effort)

### Critic Key
CL = Core Loop · FJ = Feedback & Juice · PM = Progression & Mastery · CD = Content Depth · VD = Visual Design · AD = Audio Design · UX = UX & Controls · EA = Emotional Arc · II = Innovation & Identity · AR = Accessibility & Reach · TQ = Technical Quality · RL = Retention & Longevity

---

## Day 18: Core Loop Revolution
**Items**: #1, #5, #11, #2, #13, #3, #4, #10, #14, #9

The single most important day. Overhauls the fundamental puzzle experience — how players discover solutions, get feedback on failures, and feel success. After today, Signal Circuit plays like a different game.

### Item 1 — Remove Solution Formulas from Descriptions
- **Backlog #**: 1 | **Priority**: P0 | **Effort**: 1 | **Critics**: CL, EA, II, PM
- **Description**: Strip level descriptions to truth table + conceptual framing only. Reveal the mathematical principle after solving as a reward.

### Item 2 — Restructure Hints as Conceptual Nudges
- **Backlog #**: 5 | **Priority**: P0 | **Effort**: 2 | **Critics**: CL, CD, II
- **Description**: Replace full-wiring Hint 3 with Socratic progression: (1) general concept, (2) structural insight, (3) visual hint highlighting relevant pins — never the full topology.

### Item 3 — Communicate Hint Star Penalty Before Click
- **Backlog #**: 11 | **Priority**: P0 | **Effort**: 1 | **Critics**: CL, RL, PM
- **Description**: Display "Using hints reduces max ★" next to hint button before clicking. Show "⚠ Max ★★ with hints" after use. Transform hints from opaque punishment into informed choice.

### Item 4 — Show Diagnostic Failure Feedback
- **Backlog #**: 2 | **Priority**: P0 | **Effort**: 2 | **Critics**: CL, FJ, CD, PM, AR, EA
- **Description**: When simulation fails, show what each output produced vs. expected. Trace wire path backward from wrong outputs, flash the offending gate. Add "Actual" column to truth table.

### Item 5 — Add "Almost!" Near-Miss Feedback
- **Backlog #**: 13 | **Priority**: P0 | **Effort**: 1 | **Critics**: EA, CL
- **Description**: When ≥75% rows pass, show "So close! Just 1 row off" with the failing row highlighted. Near-misses create the "one more try" compulsion.

### Item 6 — Add Quick-Test / Instant Evaluation Mode
- **Backlog #**: 3 | **Priority**: P0 | **Effort**: 2 | **Critics**: CL, UX
- **Description**: Add "Quick Test" button or Shift+Enter that evaluates instantly without animation. Keep animated simulation for first successful run only.

### Item 7 — Add Real-Time Signal Propagation During Building
- **Backlog #**: 4 | **Priority**: P0 | **Effort**: 2 | **Critics**: CL, FJ, EA, AD, II
- **Description**: Click input nodes to toggle values, signals propagate through wires immediately during construction. Transforms feel from "written exam" to "live laboratory."

### Item 8 — Scale Celebrations Proportionally by Star Rating
- **Backlog #**: 10 | **Priority**: P0 | **Effort**: 1 | **Critics**: FJ, AD, EA
- **Description**: 1★ = modest pulse; 2★ = full arpeggio + confetti; 3★ = extended fanfare, gold particles, freeze-frame. Victory should feel different based on performance.

### Item 9 — Establish Visual Hierarchy in Info Panel
- **Backlog #**: 14 | **Priority**: P0 | **Effort**: 1 | **Critics**: VD, UX
- **Description**: Make RUN button 2× current size with stronger glow. Reduce secondary controls (Clear, Hint) to compact icon row. Players should instantly know what to do next.

### Item 10 — Make Truth Table Collapsible
- **Backlog #**: 9 | **Priority**: P0 | **Effort**: 1 | **Critics**: UX, VD
- **Description**: Add toggle chevron to truth table. Default expanded on first visit, collapsed on revisits and always on mobile. Reclaims 80-120px of vertical space.

---

## Day 19: Technical Debt & Bug Sweep
**Items**: #6, #7, #8, #12, #15, #34, #40, #41, #42, #43

All quick fixes — every item is effort 1. Clears the entire P0 bug/tech backlog plus the low-hanging P1 technical debt. After today, the codebase is clean and performant.

### Item 1 — Fix Locked Level Contrast & Visibility
- **Backlog #**: 6 | **Priority**: P0 | **Effort**: 1 | **Critics**: VD, UX, TQ, AR, EA
- **Description**: Increase locked levels from opacity 0.3 to 0.5 minimum with lock icon overlay. Keep level names readable (color #777+) so players see what's ahead.

### Item 2 — Canvas DPI / Retina Display Scaling
- **Backlog #**: 7 | **Priority**: P0 | **Effort**: 1 | **Critics**: TQ
- **Description**: Standard 6-line fix: multiply canvas dimensions by devicePixelRatio, scale context, keep CSS size unchanged. Eliminates blurriness on 90%+ of devices.

### Item 3 — Implement Dirty-Flag Render Loop
- **Backlog #**: 8 | **Priority**: P0 | **Effort**: 1 | **Critics**: TQ
- **Description**: Set needsRender = true only on state changes, skip render otherwise. Reduces idle CPU/GPU by ~95%. Critical for mobile battery life.

### Item 4 — Fix Hint Panel Overlapping Clear Circuit Button
- **Backlog #**: 12 | **Priority**: P0 | **Effort**: 1 | **Critics**: TQ
- **Description**: Add max-height: 80px; overflow-y: auto to hint display, or sticky-position action buttons at panel bottom. Fixes functional bug hiding core UI.

### Item 5 — Fix Intro Screen setTimeout Race Condition
- **Backlog #**: 15 | **Priority**: P0 | **Effort**: 1 | **Critics**: TQ
- **Description**: Replace setTimeout(1800) with animationend event listener. Skip intro for returning players (localStorage check), or make tap-to-dismiss.

### Item 6 — Fix Hint Button Counter Desync
- **Backlog #**: 34 | **Priority**: P1 | **Effort**: 1 | **Critics**: TQ, UX
- **Description**: Hint button counter can desynchronize from actual hint state. Fix the counter tracking to stay in sync with hint usage.

### Item 7 — Replace Browser confirm() with In-Game Modals
- **Backlog #**: 40 | **Priority**: P1 | **Effort**: 1 | **Critics**: TQ
- **Description**: Native browser confirm() dialogs break immersion and look different per browser. Replace with styled in-game modal components.

### Item 8 — Add isAnimating Try/Finally Safety Reset
- **Backlog #**: 41 | **Priority**: P1 | **Effort**: 1 | **Critics**: TQ
- **Description**: If animation throws an error, isAnimating flag stays true and locks the UI. Wrap in try/finally to guarantee reset on any exit path.

### Item 9 — Add localStorage Schema Versioning
- **Backlog #**: 42 | **Priority**: P1 | **Effort**: 1 | **Critics**: TQ
- **Description**: Add a version field to localStorage data. On schema change, migrate or reset gracefully instead of silent corruption.

### Item 10 — Fix Timer Interval Leak on Screen Transitions
- **Backlog #**: 43 | **Priority**: P1 | **Effort**: 1 | **Critics**: TQ
- **Description**: Timer interval continues running when navigating away from gameplay. Clear interval on screen transitions to prevent memory leaks.

---

## Day 20: UX Polish & Accessibility Quick Wins
**Items**: #35, #36, #37, #38, #39, #44, #45, #46, #47, #48

Ten effort-1 P1 items that collectively raise the UX floor. Fixes visual inconsistencies, accessibility gaps, and small interaction annoyances. Each is a 15-30 minute fix; together they transform perceived quality.

### Item 1 — Remove Version Number from Gameplay View
- **Backlog #**: 35 | **Priority**: P1 | **Effort**: 1 | **Critics**: VD
- **Description**: Version number displayed during gameplay is developer-facing noise. Move to settings/about screen only.

### Item 2 — Differentiate Interactive Buttons from Info Containers
- **Backlog #**: 36 | **Priority**: P1 | **Effort**: 1 | **Critics**: VD
- **Description**: Buttons and static info containers share similar styling. Add distinct interactive affordances (borders, shadows, hover states) to clickable elements.

### Item 3 — Add Invalid Wire Connection Feedback
- **Backlog #**: 37 | **Priority**: P1 | **Effort**: 1 | **Critics**: UX, AD, AR
- **Description**: Attempting an invalid wire connection gives no feedback. Add a brief red flash on the target pin and a short buzz sound to communicate "can't connect here."

### Item 4 — Fix Platform-Inappropriate Copy ("Click" vs "Tap")
- **Backlog #**: 38 | **Priority**: P1 | **Effort**: 1 | **Critics**: UX
- **Description**: All instructions say "Click" even on mobile. Detect touch devices and swap to "Tap" / "Drag" / "Long press" accordingly.

### Item 5 — Fix Keyboard Shortcut Mismatch (Ctrl+Y)
- **Backlog #**: 39 | **Priority**: P1 | **Effort**: 1 | **Critics**: UX
- **Description**: Ctrl+Y doesn't map to redo on all platforms. Use Ctrl+Shift+Z as primary redo shortcut with Ctrl+Y as alias.

### Item 6 — Show Star Preview Accounting for Hint Penalty
- **Backlog #**: 44 | **Priority**: P1 | **Effort**: 1 | **Critics**: UX
- **Description**: After using hints, star preview should reflect the reduced maximum. Show the actual achievable stars, not the pre-hint maximum.

### Item 7 — Respect prefers-reduced-motion Media Query
- **Backlog #**: 45 | **Priority**: P1 | **Effort**: 1 | **Critics**: AR
- **Description**: Users who set prefers-reduced-motion get the same animations as everyone else. Reduce or disable non-essential animations when this preference is active.

### Item 8 — Add ARIA Labels to Icon-Only Buttons
- **Backlog #**: 46 | **Priority**: P1 | **Effort**: 1 | **Critics**: AR, TQ
- **Description**: Icon-only buttons (mute, settings, hint) have no accessible names. Add aria-label attributes to all icon-only interactive elements.

### Item 9 — Replace Times New Roman Font Fallback
- **Backlog #**: 47 | **Priority**: P1 | **Effort**: 1 | **Critics**: VD
- **Description**: When the primary font fails to load, Times New Roman appears — completely wrong for a tech/circuit aesthetic. Set fallback to system-ui or a monospace stack.

### Item 10 — Improve Wire Deletion Feedback
- **Backlog #**: 48 | **Priority**: P1 | **Effort**: 1 | **Critics**: FJ
- **Description**: Wire deletion is visually abrupt. Add a snap animation, wire fragment particles, and sparks to make deletion feel physical and satisfying.

---

## Day 21: Narrative, Progression & Emotional Arc
**Items**: #16, #17, #27, #30, #22, #23, #25, #28, #29, #31

The game gets a soul. Adds story framing, overhauls the achievement system, creates emotional pacing between chapters, and builds tension into the core RUN moment. Transforms Signal Circuit from "puzzle set" to "journey."

### Item 1 — Add Narrative / Story Frame
- **Backlog #**: 16 | **Priority**: P1 | **Effort**: 2 | **Critics**: CD, EA, II
- **Description**: Add a thin narrative: repairing a spacecraft's logic systems, or apprentice at a chip factory. Each circuit fixed restores a system. No cutscenes — just context.

### Item 2 — Redesign Skip Button as "Bookmark & Return"
- **Backlog #**: 17 | **Priority**: P1 | **Effort**: 2 | **Critics**: CL, PM, CD, EA
- **Description**: Replace "Skip (0 stars)" with "Bookmark & Move On" — bookmark icon, level stays replayable, bookmark clears once solved. Removes shame framing.

### Item 3 — Chapter Completion Screens / Pacing Breaks
- **Backlog #**: 27 | **Priority**: P1 | **Effort**: 2 | **Critics**: PM, EA
- **Description**: Add full-screen chapter completion pause: "You now understand the five fundamental gates." Show all mastered gates. Create breathing valley before next difficulty peak.

### Item 4 — Improve Level Select Visual Storytelling
- **Backlog #**: 30 | **Priority**: P1 | **Effort**: 2 | **Critics**: VD, EA
- **Description**: Add tiny circuit silhouettes per level, progressive color coding per chapter (green → cyan → purple), shimmer on recently completed levels. Map of the journey, not a spreadsheet.

### Item 5 — Overhaul Achievement System
- **Backlog #**: 22 | **Priority**: P1 | **Effort**: 2 | **Critics**: CL, PM, CD, II, RL, EA
- **Description**: Replace participation trophies with tiered system (Bronze/Silver/Gold). Skill-based goals: "3-star all Chapter 2 without hints," "First-try Level 8." Differentiated celebration per tier.

### Item 6 — Make Timer Meaningful or Remove It
- **Backlog #**: 23 | **Priority**: P1 | **Effort**: 2 | **Critics**: CL, EA, PM, RL
- **Description**: Timer tracks bestTime but affects nothing. Either integrate into star criteria, add time-attack mode, or hide by default and show post-completion only.

### Item 7 — Row-by-Row Audio Escalation During Simulation
- **Backlog #**: 25 | **Priority**: P1 | **Effort**: 2 | **Critics**: FJ, AD, EA
- **Description**: Fork playSimPulse into pass (ascending pitch) and fail (descending buzz). Pitch-shift successive passes upward for building momentum. Players hear correctness row by row.

### Item 8 — Build Tension into RUN Button Moment
- **Backlog #**: 28 | **Priority**: P1 | **Effort**: 2 | **Critics**: EA, FJ
- **Description**: Dim workspace briefly, add "charging" animation at inputs, send pulses through wires with output hidden until arrival. Transform every RUN into "will this work?"

### Item 9 — Improve Procedural Challenge Generator
- **Backlog #**: 29 | **Priority**: P1 | **Effort**: 2 | **Critics**: CL, CD
- **Description**: Generate from known circuit patterns (backward from interesting topologies) or curate library of 100+ real logic functions (parity checkers, BCD converters).

### Item 10 — Add Gate Placement Impact Ripple
- **Backlog #**: 31 | **Priority**: P1 | **Effort**: 2 | **Critics**: FJ
- **Description**: Add radial ripple across breadboard grid on gate placement, brightened copper traces near gate, subtle screen nudge. "Installed a component" not just "clicked."

---

## Day 22: Mobile, Accessibility & Social Infrastructure
**Items**: #18, #19, #20, #24, #21, #26, #32, #33, #49, #50

The game becomes truly cross-platform and socially connected. Fixes the mobile experience, adds accessibility modes, builds the social fabric for daily challenges, and begins the content expansion pipeline.

### Item 1 — Add Ambient Soundscape Layer
- **Backlog #**: 18 | **Priority**: P1 | **Effort**: 2 | **Critics**: AD, EA, II
- **Description**: Add subtle ambient bed: lowpass-filtered noise at ~0.03 volume, barely-perceptible 60Hz mains hum, slow LFO on filter cutoff. Breadboard should feel "powered on."

### Item 2 — Increase Pin/Wire Touch Targets for Mobile
- **Backlog #**: 19 | **Priority**: P1 | **Effort**: 2 | **Critics**: UX, AR
- **Description**: Increase pin threshold from 26px to 36px (Apple recommends 44pt). Visible pin to 12px radius. Add connection zone highlight matching hitbox. Est. 40-60% fewer missed taps.

### Item 3 — Add Explicit Mobile Delete Button
- **Backlog #**: 20 | **Priority**: P1 | **Effort**: 2 | **Critics**: UX, TQ, AR
- **Description**: Long-press-to-delete is undiscoverable. Add 🗑 Delete button on tap-select. Keep long-press as power-user shortcut.

### Item 4 — Add Colorblind Mode
- **Backlog #**: 24 | **Priority**: P1 | **Effort**: 2 | **Critics**: VD, AR, II
- **Description**: Add shape redundancy (✓/✗ on rows), alternative palette (blue/orange), distinct animation patterns (pulsing vs. steady). Toggle in settings.

### Item 5 — Improve Sandbox Mode
- **Backlog #**: 21 | **Priority**: P1 | **Effort**: 2 | **Critics**: CL, CD, PM, II
- **Description**: Add configurable I/O (2-8 inputs, 1-4 outputs), creative prompts, circuit save/export, and "Show Truth Table" revealing what the player built.

### Item 6 — Add Service Worker for Offline PWA
- **Backlog #**: 26 | **Priority**: P1 | **Effort**: 2 | **Critics**: TQ, AR
- **Description**: Add minimal cache-first service worker (~30 lines). Enables true offline play and home-screen installability. PWA manifest already exists but SW is missing.

### Item 7 — Daily Challenge Social Features
- **Backlog #**: 32 | **Priority**: P1 | **Effort**: 3 | **Critics**: CL, CD, RL, II, EA
- **Description**: Add clipboard share card, aggregated stats ("You used 4 gates — top 12%!"), opt-in streak counter. The #1 retention driver currently failing to execute.

### Item 8 — Add Bridge Levels Between Chapters
- **Backlog #**: 33 | **Priority**: P1 | **Effort**: 3 | **Critics**: CL, PM, CD
- **Description**: Add 2-3 transitional levels between each chapter. Compress flat difficulty plateau in Levels 1-7. Fix the cliff between Chapter 2 and 3.

### Item 9 — Expand Campaign to 40-60 Levels
- **Backlog #**: 49 | **Priority**: P2 | **Effort**: 4 | **Critics**: CD, RL, II
- **Description**: 15 levels (~90 min) is dangerously thin. Expand to 40-60 levels across 6-8 chapters covering full gate vocabulary and real-world logic functions.

### Item 10 — Add Generative Music System
- **Backlog #**: 50 | **Priority**: P2 | **Effort**: 3 | **Critics**: AD, EA, II
- **Description**: Build a procedural music layer that evolves with gameplay — subtle during building, rising during simulation, celebratory on success. Circuit activity influences the music.

---

## Day 23: Content Architecture & Progression Systems
**Items**: #51, #52, #53, #54, #55, #56, #57, #58, #59, #60

Deepens the gameplay with new level types, non-linear progression, better onboarding, and reward systems. Transforms Signal Circuit from a linear puzzle list into a rich learning platform.

### Item 1 — Create Multi-Solution Levels with Broader Gate Palettes
- **Backlog #**: 51 | **Priority**: P2 | **Effort**: 3 | **Critics**: CL, II
- **Description**: Some levels should accept multiple valid circuit topologies. Expand available gate palette per level to enable creative solutions and replay.

### Item 2 — Add Analysis/Debug/Minimize Level Types
- **Backlog #**: 52 | **Priority**: P2 | **Effort**: 3 | **Critics**: CL, CD
- **Description**: Beyond "build this truth table" — add levels where players debug a broken circuit, analyze what a circuit does, or minimize an existing circuit's gate count.

### Item 3 — Concept Map / Non-Linear Progression (Tech Tree)
- **Backlog #**: 53 | **Priority**: P2 | **Effort**: 3 | **Critics**: PM
- **Description**: Replace linear level list with a visual tech tree. Players can choose which concept to tackle next (e.g., NAND mastery or MUX introduction) based on prerequisites.

### Item 4 — Guided First-Level Onboarding (Animated Ghost Tutorial)
- **Backlog #**: 54 | **Priority**: P2 | **Effort**: 3 | **Critics**: EA, UX, AR
- **Description**: Level 1 gets an animated ghost hand showing exactly where to drag the first gate and wire. Disappears after first action. Zero-confusion first experience.

### Item 5 — Add Constraint-Based Challenge Variants
- **Backlog #**: 55 | **Priority**: P2 | **Effort**: 3 | **Critics**: CL, RL
- **Description**: Add challenge variants for completed levels: NAND-only, no-NOT, minimum wires, maximum speed. Each constraint is a separate star/badge.

### Item 6 — "Insight Unlocked" — Eureka Moment Journal
- **Backlog #**: 56 | **Priority**: P2 | **Effort**: 3 | **Critics**: PM
- **Description**: After solving key levels, record the conceptual insight ("NOT(AND) = NAND") in a persistent journal. Players build a personal reference of discovered principles.

### Item 7 — Progressive Star Criteria (Multi-Axis)
- **Backlog #**: 57 | **Priority**: P2 | **Effort**: 3 | **Critics**: PM, RL
- **Description**: Stars currently based on gate count only. Add multi-axis criteria: gate efficiency + time + no-hints. Each axis visible so players choose what to optimize.

### Item 8 — Fix Canvas-to-Chrome Ratio on Mobile
- **Backlog #**: 58 | **Priority**: P2 | **Effort**: 3 | **Critics**: UX, VD, AR
- **Description**: Info panel consumes too much screen on mobile. Cap info panel at 35% of viewport, ensure canvas gets at least 65%. Collapse/minimize info panel on small screens.

### Item 9 — Add Pinch-to-Zoom / Pan on Mobile Canvas
- **Backlog #**: 59 | **Priority**: P2 | **Effort**: 3 | **Critics**: UX, AR
- **Description**: Complex circuits on small screens need zoom. Implement pinch-to-zoom and two-finger pan on the canvas element with smooth momentum.

### Item 10 — Star Economy — Stars Unlock Content
- **Backlog #**: 60 | **Priority**: P2 | **Effort**: 3 | **Critics**: RL
- **Description**: Stars currently serve as cosmetic score only. Make them a currency: spend stars to unlock bonus levels, sandbox features, or cosmetic themes.

---

## Day 24: Audio Engine & Replay Systems
**Items**: #61, #62, #63, #65, #66, #69, #64, #67, #68, #70

Builds the audio identity and adds systems for replay value. Gate-specific sounds, audio processing, progressive wire animations, and the ghost replay system that lets players compare solutions.

### Item 1 — Par / Community Average Benchmarks
- **Backlog #**: 61 | **Priority**: P2 | **Effort**: 3 | **Critics**: CD, RL
- **Description**: After completing a level, show par gate count and community average. "You used 4 gates. Par: 3. Average: 4.2." Drives optimization replay.

### Item 2 — Auto-Save Circuit State Mid-Puzzle
- **Backlog #**: 62 | **Priority**: P2 | **Effort**: 3 | **Critics**: AR
- **Description**: If a player leaves mid-puzzle (accidental close, phone call), restore their exact circuit state on return. Save to localStorage on every gate/wire change.

### Item 3 — Remove Hint Penalty, Add "Pure Logic" Badge
- **Backlog #**: 63 | **Priority**: P2 | **Effort**: 3 | **Critics**: PM
- **Description**: Instead of penalizing hint users with reduced stars, give full stars but track a separate "Pure Logic" badge for no-hint completions. Stops punishing learning.

### Item 4 — Audio Effects Processing Chain
- **Backlog #**: 65 | **Priority**: P2 | **Effort**: 2 | **Critics**: AD
- **Description**: Add reverb, compression, and subtle delay to the audio engine. Gives the procedural sounds depth and spatial presence instead of raw oscillator output.

### Item 5 — Gate-Type Sound Signatures
- **Backlog #**: 66 | **Priority**: P2 | **Effort**: 2 | **Critics**: AD
- **Description**: Each gate type gets a distinct audio signature: AND = clean sine, OR = warm saw, NOT = sharp square, XOR = bell-like FM. Players learn to hear their circuits.

### Item 6 — Wire Connection Sound Pitch Escalation
- **Backlog #**: 69 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ, AD
- **Description**: Each successive wire connection in a session plays at a slightly higher pitch, creating a building musical progression as the circuit comes together.

### Item 7 — Wire Drawing Progressive Reveal
- **Backlog #**: 64 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: Wires animate an energy flow effect when first drawn — a bright dot travels from source to destination. Visual confirmation that the connection is live.

### Item 8 — Breadboard Environmental Reactivity
- **Backlog #**: 67 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ, VD
- **Description**: During simulation, breadboard traces glow near active signals. Copper traces brighten when current flows through adjacent wires. Board feels alive.

### Item 9 — Gate-Colored Glow During Simulation
- **Backlog #**: 68 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: During simulation, gates glow their type-specific color instead of uniform green. AND = blue, OR = orange, NOT = red. Visual information density increases.

### Item 10 — "Replay Ghost" — Previous Solution Overlay
- **Backlog #**: 70 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM, RL
- **Description**: When replaying a solved level, show a translucent overlay of your previous solution. Helps players see where to optimize and provides optimization context.

---

## Day 25: Visual Identity & Interaction Polish
**Items**: #71, #73, #74, #72, #80, #79, #78, #75, #76, #77

Strengthens visual identity, improves accessibility, and polishes interactions. The game gets a brand mark, better pin visibility, semantic wire colors, and smoother transitions between levels.

### Item 1 — Color-Code Toolbox Gates to Match Canvas Colors
- **Backlog #**: 71 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD
- **Description**: Toolbox gates and canvas gates use different color schemes. Unify so dragging from toolbox to canvas maintains consistent visual identity per gate type.

### Item 2 — Stronger Visual Identity — Brand Mark, Logo
- **Backlog #**: 73 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD, II
- **Description**: The game lacks a distinctive brand mark. Design a minimal logo (stylized circuit/signal icon) that appears on splash, level select, and share cards.

### Item 3 — Improve Pin Visibility
- **Backlog #**: 74 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD, AR
- **Description**: Pins are small and static. Make them larger, add a subtle breathing animation on unconnected pins, and increase contrast against the breadboard background.

### Item 4 — Font Size Toggle / 14px Floor
- **Backlog #**: 72 | **Priority**: P2 | **Effort**: 2 | **Critics**: AR
- **Description**: Some text elements are below 14px. Set a global minimum of 14px and add a font size toggle (Normal / Large / Extra Large) in settings.

### Item 5 — Non-Blocking Onboarding Tooltip
- **Backlog #**: 80 | **Priority**: P2 | **Effort**: 2 | **Critics**: UX, AR
- **Description**: Onboarding tooltips block interaction until dismissed. Make them click-anywhere-to-dismiss and non-modal so players can explore while learning.

### Item 6 — Semantic Wire Color Assignment
- **Backlog #**: 79 | **Priority**: P2 | **Effort**: 2 | **Critics**: UX, II
- **Description**: Wire colors are assigned by creation order. Assign by signal path instead — all wires carrying the same signal share a color. Makes circuit tracing intuitive.

### Item 7 — Clear Circuit Undo Preservation
- **Backlog #**: 78 | **Priority**: P2 | **Effort**: 2 | **Critics**: UX
- **Description**: "Clear Circuit" nukes the undo stack. Make it a single undoable action — Ctrl+Z after clear restores the entire circuit.

### Item 8 — Level Transition Choreography
- **Backlog #**: 75 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ, EA
- **Description**: Add a power-down / power-up sequence between levels. Old circuit fades with a CRT-off effect, new level boots up with a brief initialization animation.

### Item 9 — Sound Micro-Randomization
- **Backlog #**: 76 | **Priority**: P2 | **Effort**: 2 | **Critics**: AD
- **Description**: Add ±5% frequency and ±10% duration variance to all sound effects. Prevents the robotic repetition that makes procedural audio feel synthetic.

### Item 10 — Difficulty-Aware Challenge Mode Gating
- **Backlog #**: 77 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM, RL
- **Description**: Challenge mode difficulty should scale based on campaign progress. Don't show 4-input challenges to players who haven't completed Chapter 2.

---

## Day 26: Onboarding, Animations & Reward Systems
**Items**: #81, #82, #83, #85, #84, #86, #87, #88, #89, #90

Polishes the moment-to-moment feel. Better onboarding flow, satisfying micro-animations, reward streak systems, and post-completion summaries that make players feel their progress.

### Item 1 — Distribute Onboarding Across Levels 1-4
- **Backlog #**: 81 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM, AR
- **Description**: Front-loading all tutorials on Level 1 is overwhelming. Spread onboarding: Level 1 = gates, Level 2 = wires, Level 3 = truth tables, Level 4 = stars/hints.

### Item 2 — Idle Circuit Animation
- **Backlog #**: 82 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: Completed wires should show slow-moving dots traveling along them when idle. The circuit looks alive even when the player is thinking.

### Item 3 — Star Reveal Staggered Anticipation
- **Backlog #**: 83 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: All stars appear simultaneously on completion. Instead, reveal them one at a time with a 400ms delay between each, building anticipation for the final count.

### Item 4 — RUN Button Press Depth Feel
- **Backlog #**: 85 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: RUN button click should feel physical: depress animation on mousedown, release on mouseup, with a satisfying mechanical click sound. Like pressing a real test button.

### Item 5 — Grid Snap Visual Overlay During Drag
- **Backlog #**: 84 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD, UX
- **Description**: When dragging a gate, show the grid snap points as subtle dots or crosshairs. Highlight the nearest valid position. Reduces placement uncertainty.

### Item 6 — Menu/UI Navigation Sounds
- **Backlog #**: 86 | **Priority**: P2 | **Effort**: 2 | **Critics**: AD
- **Description**: Add subtle sounds for menu navigation: hover blips, screen transition whooshes, intro screen boot-up sequence. Complete the audio landscape beyond just gameplay.

### Item 7 — Timer Visual Feedback
- **Backlog #**: 87 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ, AD
- **Description**: Timer is a static number. Add color changes at thresholds (green → yellow → orange) and optional audio ticks. Only if timer becomes meaningful per Item #23.

### Item 8 — Streak System Without Punishing Breaks
- **Backlog #**: 88 | **Priority**: P2 | **Effort**: 2 | **Critics**: RL
- **Description**: Track daily play streaks but use "freeze" tokens instead of hard resets. Missing a day costs one freeze (earned by playing). Rewards consistency without punishing life.

### Item 9 — Post-Completion "Your Circuit Journey" Summary
- **Backlog #**: 89 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM, EA
- **Description**: After completing all levels, show a summary: total gates placed, favorite gate type, fastest level, hardest level, total time. A graduation moment.

### Item 10 — "Perfect Retry" Button After Hint-Penalized Completion
- **Backlog #**: 90 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM
- **Description**: After completing a level with hints (reduced stars), show a prominent "Try for 3★ without hints?" button. One-tap path to the optimal retry.

---

## Day 27: Systems Integration & Platform Hardening
**Items**: #91, #92, #93, #94, #95, #96, #97, #98, #99, #100

Cross-cutting systems work: level references, consistent visual language, mobile haptics, cycle detection, and endgame celebration. Ties the whole experience together into a cohesive product.

### Item 1 — Cross-Level "Used In" References
- **Backlog #**: 91 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM
- **Description**: On each level, show which later levels build on this concept ("AND is used in Levels 8, 12, 15"). Creates a web of meaning and motivation to master fundamentals.

### Item 2 — Animate Screen Transitions with Intention
- **Backlog #**: 92 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD
- **Description**: Screen changes are instant cuts. Add intentional transitions: level select → gameplay zooms into the circuit; back button pulls out. Each transition tells a spatial story.

### Item 3 — Unify Tooltip/Modal Visual Language
- **Backlog #**: 93 | **Priority**: P2 | **Effort**: 2 | **Critics**: VD
- **Description**: Tooltips, modals, and popups use inconsistent borders, backgrounds, and shadows. Establish one visual pattern: consistent border radius, background blur, shadow depth.

### Item 4 — Screen Shake on Failure
- **Backlog #**: 94 | **Priority**: P2 | **Effort**: 2 | **Critics**: FJ
- **Description**: Failure shake intensity scales with closeness: 7/8 correct = tiny tremor; 1/8 correct = strong shake. Physical feedback that communicates magnitude of error.

### Item 5 — Scroll Position Preservation on Level Select
- **Backlog #**: 95 | **Priority**: P2 | **Effort**: 2 | **Critics**: UX
- **Description**: Returning to level select always scrolls to top. Preserve scroll position so players return to exactly where they left off in the level grid.

### Item 6 — Start Timer on First Action, Not Level Load
- **Backlog #**: 96 | **Priority**: P2 | **Effort**: 2 | **Critics**: UX
- **Description**: Timer starts immediately on level load, counting while the player reads the description. Start on first gate placement or wire draw instead.

### Item 7 — Cycle Detection with User Feedback
- **Backlog #**: 97 | **Priority**: P2 | **Effort**: 2 | **Critics**: TQ
- **Description**: Connecting outputs back to inputs can create infinite loops. Detect cycles during wire placement and warn the player with a visual indicator before simulation.

### Item 8 — Haptic Feedback for Mobile
- **Backlog #**: 98 | **Priority**: P2 | **Effort**: 2 | **Critics**: AD, UX, AR
- **Description**: Use navigator.vibrate() for gate placement (short pulse), wire connection (double pulse), success (pattern), and failure (long buzz). Adds tactile dimension on supported devices.

### Item 9 — Endgame Graduation Screen
- **Backlog #**: 99 | **Priority**: P2 | **Effort**: 2 | **Critics**: PM, EA
- **Description**: Completing all levels shows a special graduation visualization: all circuits you've built arranged into a composite image, with stats and a "Master Logician" title.

### Item 10 — Gate Budget Pressure Earlier
- **Backlog #**: 100 | **Priority**: P2 | **Effort**: 2 | **Critics**: CL
- **Description**: Early levels are too generous with gate budgets. Tighten 3-star thresholds starting from Level 3 so optimization thinking begins sooner.

---

## Day 28: Audio & Feedback Micro-Polish
**Items**: #101, #102, #103, #104, #105, #119, #120, #106, #107, #108

Quick audio and feedback additions — all effort 1. Fills in the gaps in the soundscape and adds subtle feedback touches that make every interaction feel acknowledged.

### Item 1 — Undo/Redo Audio Feedback
- **Backlog #**: 101 | **Priority**: P2 | **Effort**: 1 | **Critics**: AD
- **Description**: Undo and redo are silent. Add distinct sounds: undo = backward swoosh, redo = forward swoosh. Audio confirmation of state changes.

### Item 2 — Pin Hover Audio Feedback
- **Backlog #**: 102 | **Priority**: P2 | **Effort**: 1 | **Critics**: FJ
- **Description**: Hovering over a connectable pin plays a quiet blip. Provides audio confirmation that the pin is interactive and ready for connection.

### Item 3 — Gate Counter Live Feedback
- **Backlog #**: 103 | **Priority**: P2 | **Effort**: 1 | **Critics**: FJ
- **Description**: Gate counter changes color at star thresholds: green when under 3★ budget, yellow at 2★, red at 1★. Pulse animation on each threshold crossing.

### Item 4 — Mute/Unmute Transition Sound
- **Backlog #**: 104 | **Priority**: P2 | **Effort**: 1 | **Critics**: FJ, AD
- **Description**: Toggling sound plays a power-on sweep (unmute) or power-off descending tone (mute). Last/first thing you hear confirms the audio state change.

### Item 5 — Tooltip Animation Enhancement
- **Backlog #**: 105 | **Priority**: P2 | **Effort**: 1 | **Critics**: FJ
- **Description**: Onboarding tooltips are static. Add a pulsing arrow or gentle bounce animation to draw attention without being aggressive.

### Item 6 — Keyboard Shortcut Audio Feedback
- **Backlog #**: 119 | **Priority**: P2 | **Effort**: 1 | **Critics**: AD
- **Description**: Delete and Escape keys produce no sound. Add distinct audio feedback for keyboard shortcuts to confirm the action was registered.

### Item 7 — Hover Sound for Toolbox Gates
- **Backlog #**: 120 | **Priority**: P2 | **Effort**: 1 | **Critics**: FJ
- **Description**: Each gate type in the toolbox plays a unique frequency blip on hover. Players begin to associate sounds with gate types before even placing them.

### Item 8 — Pre-Level Complexity Rating Badge
- **Backlog #**: 106 | **Priority**: P2 | **Effort**: 1 | **Critics**: PM
- **Description**: Show a difficulty badge on each level card (e.g., 🟢 Easy, 🟡 Medium, 🔴 Hard) based on inputs/outputs/expected gates. Sets expectations before starting.

### Item 9 — Mobile Toolbox Scroll Indicator
- **Backlog #**: 107 | **Priority**: P2 | **Effort**: 1 | **Critics**: UX
- **Description**: When toolbox overflows on mobile, add a scroll indicator (fade gradient or arrow) so players know more gates are available below the fold.

### Item 10 — Canvas Cursor States
- **Backlog #**: 108 | **Priority**: P2 | **Effort**: 1 | **Critics**: UX
- **Description**: Cursor is always the default pointer. Change to crosshair in wire-drawing mode, grab hand when hovering a draggable gate, and grabbing hand during drag.

---

## Day 29: Technical Cleanup & Emotional Finishes
**Items**: #109, #110, #111, #112, #113, #114, #115, #116, #117, #118

Final P2 sweep: mobile UX details, technical robustness, and subtle emotional touches. Closes out every P2 item — the game is now solid, polished, and emotionally resonant.

### Item 1 — Mobile Wire-Drawing Cancel Affordance
- **Backlog #**: 109 | **Priority**: P2 | **Effort**: 1 | **Critics**: UX
- **Description**: No visible way to cancel a wire mid-draw on mobile. Add a visible ✕ button that appears during wire drawing to cancel the operation.

### Item 2 — Level Select Grid Responsive Columns
- **Backlog #**: 110 | **Priority**: P2 | **Effort**: 1 | **Critics**: UX
- **Description**: Level grid uses fixed column count. Switch to responsive: 2 columns on phone, 4 on tablet, 5-6 on desktop. CSS grid with minmax.

### Item 3 — Wire Color Index Reset Fix
- **Backlog #**: 111 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: Wire color index doesn't reset between levels, causing inconsistent color assignment. Reset the color counter on level load for deterministic colors.

### Item 4 — localStorage Quota Handling with Warning Toast
- **Backlog #**: 112 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: If localStorage is full, saves silently fail. Catch QuotaExceededError and show a toast: "Storage full — oldest replay data cleared to make room."

### Item 5 — Web Audio Context Failure Feedback
- **Backlog #**: 113 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: If Web Audio fails to initialize (privacy settings, browser restrictions), show a disabled mute icon instead of a working-looking but silent toggle.

### Item 6 — Double Resize Hack Cleanup
- **Backlog #**: 114 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: Canvas resize uses a double-fire hack. Replace with ResizeObserver or single rAF-deferred resize for clean, reliable behavior.

### Item 7 — Onboarding Modal Background Interaction Block
- **Backlog #**: 115 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: Players can interact with the circuit behind onboarding modals, causing confusion. Add a semi-transparent backdrop that blocks background interaction.

### Item 8 — Canvas Context Null Check Fallback
- **Backlog #**: 116 | **Priority**: P2 | **Effort**: 1 | **Critics**: TQ
- **Description**: If getContext('2d') returns null (rare but possible), the game crashes. Add a fallback message: "Your browser doesn't support this game. Try Chrome or Firefox."

### Item 9 — "Quiet Moment" Sustained Tone After Completion
- **Backlog #**: 117 | **Priority**: P2 | **Effort**: 1 | **Critics**: EA
- **Description**: After the celebration ends, play a gentle sustained tone for 2-3 seconds. A moment of peace before the "Next Level" prompt. Let the achievement breathe.

### Item 10 — Failure Breathing Room
- **Backlog #**: 118 | **Priority**: P2 | **Effort**: 1 | **Critics**: EA
- **Description**: After failure, the circuit is immediately editable. Add a 2-3 second hold where the failure state is displayed before returning to edit mode. Let the feedback sink in.

---

## Day 30: Ambitious Systems — Creation, Expansion & Backends
**Items**: #121, #122, #123, #124, #125, #126, #127, #128, #129, #130

The big-ticket P3 items. User-generated content, expanded gate vocabulary, sub-circuits, the "Build a CPU" endgame, and backend infrastructure for leaderboards and community features. Each is a major feature.

### Item 1 — User-Generated Level Creator with URL Sharing
- **Backlog #**: 121 | **Priority**: P3 | **Effort**: 5 | **Critics**: PM, CD, II, RL
- **Description**: Full level editor: define truth table, set gate palette/budget, add description, test, and share via URL-encoded puzzle string. Community content pipeline.

### Item 2 — Expand Gate Vocabulary (NAND/NOR Primitive, Flip-Flops, Tri-State)
- **Backlog #**: 122 | **Priority**: P3 | **Effort**: 5 | **Critics**: CD, II
- **Description**: Add NAND/NOR as first-class primitives, introduce sequential logic (flip-flops), and tri-state buffers. Opens entirely new puzzle categories.

### Item 3 — Sub-Circuit Saving and Reuse ("Chips")
- **Backlog #**: 123 | **Priority**: P3 | **Effort**: 5 | **Critics**: CD
- **Description**: Let players save circuit designs as reusable "chips" — custom components that can be placed like gates. Enables hierarchical design and real engineering thinking.

### Item 4 — "Build a CPU" Meta-Challenge Endgame
- **Backlog #**: 124 | **Priority**: P3 | **Effort**: 5 | **Critics**: II, EA
- **Description**: Ultimate endgame: combine all learned concepts to build a simple CPU (ALU → register → program counter). The crescendo that gives the entire game narrative purpose.

### Item 5 — Signal Propagation Delay / Timing Puzzles
- **Backlog #**: 125 | **Priority**: P3 | **Effort**: 5 | **Critics**: CD
- **Description**: New chapter introducing signal timing: gates have propagation delays, wires have length-dependent latency. Puzzles require understanding race conditions and setup/hold times.

### Item 6 — Full Keyboard Navigation for Circuit Building
- **Backlog #**: 126 | **Priority**: P3 | **Effort**: 4 | **Critics**: AR
- **Description**: Complete keyboard-only circuit building: Tab between pins, Enter to start/end wire, arrow keys to navigate grid, number keys to select gate type. Full accessibility.

### Item 7 — Screen Reader Support (Shadow DOM / ARIA Live)
- **Backlog #**: 127 | **Priority**: P3 | **Effort**: 5 | **Critics**: AR
- **Description**: Canvas is invisible to screen readers. Add a shadow DOM representation with ARIA live regions announcing circuit state changes, simulation results, and level progress.

### Item 8 — Localization / i18n Support
- **Backlog #**: 128 | **Priority**: P3 | **Effort**: 4 | **Critics**: AR
- **Description**: Extract all strings to localization files. Support at minimum: English, Spanish, Mandarin, Hindi, Portuguese. RTL layout support for Arabic.

### Item 9 — Global Backend Leaderboards
- **Backlog #**: 129 | **Priority**: P3 | **Effort**: 4 | **Critics**: CD, RL, II
- **Description**: Server-side leaderboards for each level: fewest gates, fastest time, most elegant solution (community-voted). Requires backend infrastructure.

### Item 10 — Solution Comparison Gallery
- **Backlog #**: 130 | **Priority**: P3 | **Effort**: 4 | **Critics**: CD, II
- **Description**: After solving a level, browse other players' solutions. See how different approaches achieve the same truth table. Drives learning and community.

---

## Day 31: Community Features & Mastery Systems
**Items**: #131, #132, #133, #134, #135, #136, #137, #138, #139, #140

Social and mastery layer: solution replays, adaptive difficulty, real-world visualizations, skill trees, and circuit aesthetics scoring. Makes Signal Circuit feel like a learning community, not a solo puzzle set.

### Item 1 — Solution Replays / "Watch How Others Solved It"
- **Backlog #**: 131 | **Priority**: P3 | **Effort**: 4 | **Critics**: RL
- **Description**: Record and replay solutions step-by-step. Players can watch top solutions play out in real time, learning techniques by observation.

### Item 2 — Adaptive Difficulty / Placement Test
- **Backlog #**: 132 | **Priority**: P3 | **Effort**: 4 | **Critics**: CL
- **Description**: New players take a 3-level placement test. If they already know basic gates, skip Chapter 1. If they struggle, add extra scaffolding. Respect prior knowledge.

### Item 3 — "Real World" Visualization After Milestones
- **Backlog #**: 133 | **Priority**: P3 | **Effort**: 3 | **Critics**: EA, II
- **Description**: After key milestones, show how your circuits map to real hardware: "Your half-adder is inside every calculator." Zoom from logic gates → chip → device.

### Item 4 — "Dark Gate" / Surprise Mechanic in Chapter 2
- **Backlog #**: 134 | **Priority**: P3 | **Effort**: 3 | **Critics**: EA
- **Description**: Introduce a mystery gate with unknown behavior. Players must experiment to discover its truth table, then use it to solve the level. A puzzle within a puzzle.

### Item 5 — Visual Share Card
- **Backlog #**: 135 | **Priority**: P3 | **Effort**: 3 | **Critics**: II, EA
- **Description**: Generate a beautiful screenshot card of the completed circuit with stats (gates used, time, stars). Optimized for social media sharing with branded template.

### Item 6 — "Mastery Tree" Visual Skill Progression
- **Backlog #**: 136 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL, PM
- **Description**: Visual skill tree showing concept mastery: AND branch, OR branch, combinational branch, optimization branch. Nodes light up as skills are demonstrated.

### Item 7 — "Circuit Collection" Gallery
- **Backlog #**: 137 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: Persistent gallery of all circuits the player has built, organized by level. Can revisit, compare, and admire previous solutions. Digital trophy case.

### Item 8 — Hint Token Economy
- **Backlog #**: 138 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: Instead of free hints, earn hint tokens through achievements, daily challenges, and streak bonuses. Creates resource management layer and makes hints feel valuable.

### Item 9 — "Your Logic Profile" Mastery Dashboard
- **Backlog #**: 139 | **Priority**: P3 | **Effort**: 3 | **Critics**: PM
- **Description**: Personal dashboard showing strengths and weaknesses: "Strong at optimization, needs practice with multi-output circuits." Recommends what to play next.

### Item 10 — Circuit Aesthetics Recognition
- **Backlog #**: 140 | **Priority**: P3 | **Effort**: 3 | **Critics**: PM
- **Description**: Score circuits on visual cleanliness: minimal wire crossings, aligned gates, efficient routing. Award a "Clean Circuit" bonus badge for elegant solutions.

---

## Day 32: Audio Evolution & Competitive Modes
**Items**: #141, #142, #143, #144, #145, #146, #148, #149, #150, #147

Evolving audio identity, competitive game modes, and content rotation systems. Transforms Signal Circuit from a static puzzle game into a living platform with reasons to return every week.

### Item 1 — Audio Progression Across Chapters
- **Backlog #**: 141 | **Priority**: P3 | **Effort**: 3 | **Critics**: AD
- **Description**: Each chapter has a distinct audio palette that evolves: Chapter 1 = clean sine, Chapter 2 = richer harmonics, Chapter 3 = full FM synthesis. Audio mirrors mastery growth.

### Item 2 — Wire-Drawing Continuous Audio Feedback
- **Backlog #**: 142 | **Priority**: P3 | **Effort**: 3 | **Critics**: AD
- **Description**: While drawing a wire, play a proximity tone that changes pitch based on distance to nearest valid pin. Audio guidance for connection targets.

### Item 3 — "Challenge a Friend" via URL-Encoded Puzzles
- **Backlog #**: 143 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: Share a custom challenge as a URL: "I solved this in 3 gates — can you beat me?" Recipient gets the same level with sender's stats as target.

### Item 4 — Seasonal/Themed Content Rotations
- **Backlog #**: 144 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: Monthly themed challenges: "Binary Valentine" (Feb), "Logic of Spooky" (Oct). Special visual themes and unique puzzle constraints per season.

### Item 5 — Play Statistics Dashboard ("Lab Notebook")
- **Backlog #**: 145 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL, PM
- **Description**: Detailed analytics: time per level, gates per level trend, improvement over time, most-retried levels, favorite gate usage distribution. The data nerd's reward.

### Item 6 — Micro-Celebrations for Intermediate Successes
- **Backlog #**: 146 | **Priority**: P3 | **Effort**: 3 | **Critics**: EA
- **Description**: Celebrate mid-puzzle milestones: first correct wire connection, all gates placed, partial truth table match. Small sparkles and sounds for each sub-achievement.

### Item 7 — "Puzzle of the Week" with Curated Narrative
- **Backlog #**: 148 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: Weekly hand-crafted puzzle with story context ("The Mars rover needs a new fault detector"). Higher production value than daily challenges. Featured on home screen.

### Item 8 — Challenge Ladder / Blitz Mode
- **Backlog #**: 149 | **Priority**: P3 | **Effort**: 3 | **Critics**: CD, RL
- **Description**: Escalating difficulty mode: solve increasingly complex circuits with a shrinking time limit. How far can you get? Leaderboard tracks highest level reached.

### Item 9 — Speedrun Mode
- **Backlog #**: 150 | **Priority**: P3 | **Effort**: 3 | **Critics**: PM
- **Description**: All campaign levels consecutively, total time tracked. Splits per chapter. Global leaderboard. The competitive endgame for mastery players.

### Item 10 — Spaced Repetition Review Levels
- **Backlog #**: 147 | **Priority**: P3 | **Effort**: 4 | **Critics**: RL
- **Description**: Algorithm-driven review: periodically present old concepts in new configurations. Based on spaced repetition science — resurface concepts right before they'd be forgotten.

---

## Day 33: Game Modes & Platform Expansion
**Items**: #151, #152, #153, #154, #155, #156, #157, #158, #159, #160

New game modes, deeper accessibility, mobile-native redesign, and cross-platform infrastructure. Prepares Signal Circuit to reach the widest possible audience on every device.

### Item 1 — Discovery Levels (Full Gate Palette, No Constraints)
- **Backlog #**: 151 | **Priority**: P3 | **Effort**: 3 | **Critics**: CL
- **Description**: Open-ended levels with all gates available and no gate budget. "Build any circuit that produces this truth table." Rewards creativity over optimization.

### Item 2 — Multi-Phase Levels (Progressive Reveal)
- **Backlog #**: 152 | **Priority**: P3 | **Effort**: 4 | **Critics**: CL
- **Description**: Levels that evolve mid-solve: complete phase 1, then new requirements are revealed that build on your existing circuit. Prevents over-engineering.

### Item 3 — Dual-Aesthetic Tension Resolution
- **Backlog #**: 153 | **Priority**: P3 | **Effort**: 3 | **Critics**: VD
- **Description**: The warm wood breadboard and cool chrome UI clash. Either warm up the chrome (amber highlights) or cool down the canvas (blue-tinted traces). Unify the visual temperature.

### Item 4 — "Simplified Visual" Cognitive Accessibility Mode
- **Backlog #**: 154 | **Priority**: P3 | **Effort**: 3 | **Critics**: AR
- **Description**: Reduced visual complexity mode: fewer animations, higher contrast, larger text, simplified gate graphics. For players with cognitive or visual processing differences.

### Item 5 — Variable Canvas / Spatial Variety
- **Backlog #**: 155 | **Priority**: P3 | **Effort**: 4 | **Critics**: CD
- **Description**: Some levels start with pre-placed gates, restricted zones, or unusual canvas shapes. Spatial constraints add a new puzzle dimension beyond truth tables.

### Item 6 — Mobile-Native Interaction Redesign
- **Backlog #**: 156 | **Priority**: P3 | **Effort**: 5 | **Critics**: II
- **Description**: Complete mobile interaction overhaul: bottom sheets for controls, gesture-based gate selection, thumb-zone-optimized layout. Mobile-first, not mobile-adapted.

### Item 7 — Gamepad / Controller Input Support
- **Backlog #**: 157 | **Priority**: P3 | **Effort**: 4 | **Critics**: AR
- **Description**: Gamepad API support: D-pad navigates grid, face buttons for place/connect/delete, shoulder buttons for undo/redo. Enables couch and TV play.

### Item 8 — Cross-Device Progress Sync
- **Backlog #**: 158 | **Priority**: P3 | **Effort**: 4 | **Critics**: AR
- **Description**: Export/import progress as encrypted codes or QR codes. Start on desktop, continue on phone. No account required — just scan and sync.

### Item 9 — Alternative Dropdown-Based Wire Connection
- **Backlog #**: 159 | **Priority**: P3 | **Effort**: 4 | **Critics**: AR
- **Description**: For motor-impaired players: select source pin from dropdown, select destination pin from dropdown, click "Connect." No fine motor control required.

### Item 10 — Cold-Start / Lapsed Player Re-Engagement
- **Backlog #**: 160 | **Priority**: P3 | **Effort**: 4 | **Critics**: RL
- **Description**: If PWA is installed, send gentle push notifications for lapsed players: "Your daily streak is waiting!" Configurable frequency, easy opt-out.

---

## Day 34: Micro-Polish & Visual Flourishes
**Items**: #161, #162, #163, #164, #165, #166, #167, #168, #169, #170

The detail pass. Return-player onboarding, boot sequence animation, progress bar shimmer, volume controls, and audio refinements. The touches that make players say "they really cared about this."

### Item 1 — Session-Awareness / Gentle Stop Suggestions
- **Backlog #**: 161 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL
- **Description**: After 60+ minutes of continuous play, show a subtle "Take a break? Your progress is saved." Not blocking — just a gentle health-conscious nudge.

### Item 2 — Return-Player Contextual Re-Onboarding
- **Backlog #**: 162 | **Priority**: P3 | **Effort**: 3 | **Critics**: RL, AR
- **Description**: Players returning after 7+ days get a brief "Welcome back! You were working on Level 12. Here's a quick refresher on XOR gates." Context-aware re-entry.

### Item 3 — Drag Ghost Enhancement
- **Backlog #**: 163 | **Priority**: P3 | **Effort**: 2 | **Critics**: FJ
- **Description**: Dragged gate shows a proximity hum that changes pitch near valid positions, and the landing zone glows with a subtle pulse when the gate is close enough to snap.

### Item 4 — Intro Screen Boot Sequence
- **Backlog #**: 164 | **Priority**: P3 | **Effort**: 2 | **Critics**: FJ, II
- **Description**: Replace static intro with a CRT boot-up sequence: scanlines appear, typewriter text prints "SIGNAL CIRCUIT v2.0 // INITIALIZING...", then fades to menu. Sets the mood.

### Item 5 — Progress Bar Milestone Markers with Shimmer
- **Backlog #**: 165 | **Priority**: P3 | **Effort**: 2 | **Critics**: VD, EA
- **Description**: Campaign progress bar gets milestone markers at chapter boundaries with a shimmer animation when crossed. Visual proof of long-term progress.

### Item 6 — Level Select Micro-Interactions
- **Backlog #**: 166 | **Priority**: P3 | **Effort**: 2 | **Critics**: VD
- **Description**: Level cards respond to hover: shimmer effect, subtle connection traces appear between adjacent completed levels, stars twinkle gently.

### Item 7 — Screenshot Shareability Watermark
- **Backlog #**: 167 | **Priority**: P3 | **Effort**: 2 | **Critics**: VD
- **Description**: When screenshotting or sharing, add a subtle branded watermark ("Signal Circuit" + URL) in the corner. Free marketing on every shared image.

### Item 8 — Volume Slider Instead of Binary Mute
- **Backlog #**: 168 | **Priority**: P3 | **Effort**: 2 | **Critics**: AD
- **Description**: Replace on/off mute toggle with a volume slider (0-100%). Players who want quiet-but-not-silent can set their preferred level.

### Item 9 — Separate SFX and Music Volume Channels
- **Backlog #**: 169 | **Priority**: P3 | **Effort**: 2 | **Critics**: AD
- **Description**: Once generative music exists, separate SFX and music volume controls. Some players want full SFX with quiet music, or vice versa.

### Item 10 — Hint Sound Urgency Escalation
- **Backlog #**: 170 | **Priority**: P3 | **Effort**: 2 | **Critics**: AD
- **Description**: Each successive hint use plays at a descending pitch: Hint 1 = high clear tone, Hint 2 = mid tone, Hint 3 = low warning tone. Audio communicates escalating cost.

---

## Day 35: Final Polish & Technical Hardening
**Items**: #171, #172, #173, #174, #175, #176

The last 6 items. Stereo audio, technical hardening, and the final visual options. After today, all 176 expert review improvements are complete.

### Item 1 — Stereo Panning Based on Canvas Position
- **Backlog #**: 171 | **Priority**: P3 | **Effort**: 2 | **Critics**: AD
- **Description**: Sounds originate from their canvas position: a gate placed on the left pans left, right pans right. Creates spatial audio that matches the visual layout.

### Item 2 — Event Listeners Cleanup (AbortController Pattern)
- **Backlog #**: 172 | **Priority**: P3 | **Effort**: 2 | **Critics**: TQ
- **Description**: Replace manual removeEventListener calls with AbortController pattern. Cleaner lifecycle management, guaranteed cleanup, no leaked listeners.

### Item 3 — Spark Particles Performance (Pool Pattern)
- **Backlog #**: 173 | **Priority**: P3 | **Effort**: 2 | **Critics**: TQ
- **Description**: Particle effects create/destroy DOM elements. Implement an object pool: pre-allocate particle elements, recycle instead of create. Eliminates GC spikes during celebrations.

### Item 4 — Cache-Busting Automation
- **Backlog #**: 174 | **Priority**: P3 | **Effort**: 2 | **Critics**: TQ
- **Description**: Replace manual ?v=15 cache-busting with automated content hashing in the build step. Never serve stale assets after deployment.

### Item 5 — "Light Mode" Option
- **Backlog #**: 175 | **Priority**: P3 | **Effort**: 3 | **Critics**: VD
- **Description**: Full light theme variant: white/cream backgrounds, dark text, inverted color scheme. Some players prefer or need light backgrounds. Respects prefers-color-scheme.

### Item 6 — Undo History Visualization (Timeline)
- **Backlog #**: 176 | **Priority**: P3 | **Effort**: 3 | **Critics**: CD
- **Description**: Visual undo timeline showing each action as a node. Players can click any point to jump to that state. Makes experimentation feel safe and explorable.

---

## Summary

| Phase | Days | Items | Focus |
|-------|------|-------|-------|
| Phase 1 (Complete) | 1–17 | — | Core game build from scratch |
| **P0 Critical** | 18–19 | 15 | Core loop, bugs, performance |
| **P1 Soon** | 20–22 | 33 | UX, narrative, mobile, social |
| **P2 Later** | 23–29 | 72 | Content depth, audio, polish |
| **P3 Backlog** | 30–35 | 56 | Ambitious features, modes, platform |
| **Total Phase 2** | **18–35** | **176** | **Expert review overhaul** |

**Estimated completion: Day 35** (18 build days from start of Phase 2)
