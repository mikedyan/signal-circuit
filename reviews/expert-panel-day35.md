# Signal Circuit — Expert Panel Review (Day 35)

**Date:** March 31, 2026  
**Reviewer:** Expert Game Review Panel (AI)  
**Build:** Day 35, Phase 2 Complete — 176 items shipped  
**Codebase:** 17,344 lines across 9 files (JS/CSS/HTML)  
**Content:** 37 levels, 8 chapters, 6 game modes, 19 achievements

---

## Executive Summary

Signal Circuit is a remarkably well-executed educational puzzle game that teaches digital logic through hands-on circuit building. For a 35-day development sprint, the breadth and polish are genuinely impressive — this feels like a game with 3-6 months of work behind it. The space-ship narrative provides light but effective framing, the audio design is outstanding for a web game, and the accessibility story is best-in-class. However, the game has clear growth ceilings in replayability, difficulty progression, and the gap between its rich feature set and the stickiness needed for long-term engagement.

---

## Dimension Scores (1-10 Scale)

### 1. First Impression — 8/10

The CRT boot sequence intro is a perfect tone-setter. The level select screen is clean, immediately readable, and the space-ship narrative ("Repair the ship's logic systems") gives context without being overbearing. The brand logo SVG, streak counter, and progress bar create an immediate sense of progression. The only miss is that new players face a placement test modal that feels slightly jarring before they've even seen the game.

**Strengths:** Boot sequence, clean visual hierarchy, monospace typography, narrative framing  
**Weaknesses:** Placement test timing, no animated preview of gameplay on first load

### 2. Clarity — 8/10

Instructions are excellent. Each level has a description, progressive hints (3 tiers), and "Used in" forward references. The truth table is front and center. The onboarding is smartly distributed across levels 1-4 rather than dumped upfront. The "How to Play" modal covers all mechanics. Gate encyclopedia provides reference material.

**Strengths:** Distributed onboarding, truth table with "Got" column on failure, forward references, encyclopedia  
**Weaknesses:** Info panel can be overwhelming with too many elements visible simultaneously, truth table auto-collapses which hides the core puzzle element

### 3. Core Loop — 7/10

Place gates → draw wires → match truth table → earn stars. It's clean and satisfying. The RUN tension animation adds drama. Quick Test provides a fast iteration path. The "CIRCUIT CORRECT!" moment with confetti and ascending chimes lands well every time.

However, the loop is essentially the same from Level 1 to Level 37 — the mechanics don't evolve. You're always placing the same 6 gate types and drawing wires. There's no unlock of new interaction mechanics (gate rotation, bus wires, sub-circuits, etc.) that would keep the *feel* fresh even as puzzles get harder.

**Strengths:** Tight feedback loop, dual test modes (animated + instant), near-miss feedback  
**Weaknesses:** Mechanics never evolve, no "aha" moments in interaction design, wiring can be fiddly

### 4. Difficulty Curve — 7/10

Chapters 1-2 ramp beautifully. Each level introduces one new concept. Chapter 3 (multi-output) is where it gets interesting. But the curve has a few problems:

- The jump from Chapter 3 to Chapter 4 is steep — the 2-to-4 decoder (Level 18) and equality comparator (Level 19) are significantly harder than anything before
- Chapter 5 (Shield Systems) and Chapter 6 (Universal Gates) are well-paced internally
- Chapter 8 (Discovery Lab) feels disconnected — "open design" levels lack the structured learning of earlier chapters
- The 4-input levels (19-22, 24-25, 27) have 16-row truth tables that become hard to reason about visually

**Strengths:** Gradual chapter 1-3 ramp, chapter narratives, bridge levels between chapters  
**Weaknesses:** Chapter 3→4 cliff, large truth tables overwhelming, Discovery Lab feels bolted on

### 5. Juice / Polish — 9/10

This is where Signal Circuit truly shines. The procedural audio engine is exceptional — gate-type-specific placement sounds, wire connection zaps with pitch escalation, ambient soundscape with generative music pad, chapter-specific audio palettes, simulation pass/fail escalation. The visual polish includes:

- Breadboard background with copper traces that glow during simulation
- Pin breathing animations, spark particles on wire connection
- Bounce easing on gate placement, screen shake on failure (intensity-scaled)
- Victory flash, confetti with physics (shape variety, gravity, star-scaled intensity)
- Run tension overlay, level transition choreography
- Gate-colored glow during simulation
- Stereo panning based on canvas position

For a browser game, this level of audio-visual polish is genuinely impressive.

**Strengths:** Procedural audio is professional-grade, particle effects, animation choreography  
**Weaknesses:** Celebration can feel over-the-top for 1-star solutions, ambient sound gets repetitive in long sessions

### 6. Replayability — 5/10

This is the game's weakest dimension. Once you 3-star all 37 levels, there's limited reason to return. The replayability features exist but feel thin:

- Daily Challenge: random truth table, no narrative, no leaderboard comparison
- Random Challenge: generates puzzles but they're not curated for fun
- Blitz Ladder: interesting but no persistence beyond "best level reached"
- Speedrun: good concept but only meaningful for dedicated players
- Weekly Puzzle: curated but 8 puzzles rotating — you'll see repeats quickly
- Sandbox: useful for learning, not for fun

Missing: no social features (no shared leaderboards, no asynchronous competition), no unlockable content tied to replay, no meta-progression system, no procedural levels that feel designed.

**Strengths:** Multiple challenge modes, daily challenges, blitz/speedrun  
**Weaknesses:** No social leaderboards, limited procedural quality, no meta-progression

### 7. Uniqueness — 8/10

Logic gate puzzle games exist (NAND Game, Logic World, Silicon Zeroes), but Signal Circuit occupies a unique niche: it's a polished, accessible, narrative-driven web game that works on mobile. The breadboard aesthetic, space-ship narrative, and educational depth (real-world applications, post-solve insights, gate encyclopedia) set it apart. The level creator and friend challenge features add community potential.

**Strengths:** Breadboard aesthetic, educational depth, mobile-first, narrative framing  
**Weaknesses:** Core mechanic is well-trodden, no killer differentiator vs NAND Game

### 8. Bug-Free — 7/10

The code is defensive — SafeStorage wrapper, schema versioning, AbortController cleanup, cycle detection, autosave with 24h expiry. No crashes observed during testing. However:

- The Wire class relies on global `Wire` constructor that's not in a separate module
- Ghost overlay rendering can't resolve pin positions for ghost gates (comments acknowledge this)
- The `addGate()` function creates a global `Gate` dependency — no module system
- Simulation topological sort doesn't handle disconnected gate islands gracefully
- The `_wiresCross` check in aesthetics scoring uses simplified line-segment math that may miscount with bezier wire rendering
- `generateNonDegenerateColumn()` could theoretically infinite-loop if given degenerate parameters

**Strengths:** SafeStorage, defensive coding, autosave, schema versioning  
**Weaknesses:** No module system, some theoretical edge cases, ghost overlay limitations

### 9. Visual Design — 8/10

The dark-theme breadboard aesthetic is cohesive and distinctive. The green-on-dark terminal feel, IC-chip gate rendering with notches, copper trace grid, and power rails create a convincing electronics workbench. Color coding is consistent (gate types, input/output nodes). The light mode option is a nice touch. Colorblind mode, simplified visual mode, and font size options show genuine accessibility care.

**Strengths:** Cohesive theme, IC-chip rendering, chapter-colored borders, accessibility options  
**Weaknesses:** Gate symbols are small and hard to distinguish at default size, truth table typography could be larger, 4-output levels get visually crowded

### 10. Addictiveness — 6/10

Signal Circuit is engaging while you're progressing through the campaign. The "just one more level" feeling works well in chapters 1-3. But it fades once you hit the difficulty wall in chapter 4, and the endgame offers no compelling hook. There's no daily ritual beyond a random daily challenge. No social pressure. No meta-progression to chase. No cosmetic unlocks.

The hint token economy is clever but too generous — starting with 3 free tokens and earning more from streaks means most players never run out. The streak system (fire emoji + freeze tokens) is good but not surfaced prominently enough to drive daily returns.

**Strengths:** Good early-game momentum, streak system, star-chasing  
**Weaknesses:** No endgame hook, no social pressure, weak daily ritual, hint tokens too generous

---

## Overall Score: 7.3/10

| Dimension | Score |
|-----------|-------|
| First Impression | 8 |
| Clarity | 8 |
| Core Loop | 7 |
| Difficulty Curve | 7 |
| Juice/Polish | 9 |
| Replayability | 5 |
| Uniqueness | 8 |
| Bug-Free | 7 |
| Visual Design | 8 |
| Addictiveness | 6 |
| **Average** | **7.3** |

---

## Top Insights

1. **The audio engine is the game's secret weapon.** It single-handedly elevates the experience from "educational tool" to "polished game." Protect this investment.

2. **Replayability is the critical weakness.** The game has enormous surface area (6 modes, 37 levels, level creator) but lacks the hook that makes players return daily. Social features and meta-progression are the highest-leverage additions.

3. **The difficulty curve needs smoothing, not flattening.** Don't make hard levels easier — add intermediate levels that bridge the gaps. The chapter 3→4 jump needs 2-3 transitional puzzles.

4. **Feature breadth exceeds feature depth.** The level creator, sandbox, blitz mode, speedrun, weekly puzzle, collection, mastery tree, logic profile, and share cards are individually thin. Pick 3-4 and make them deep rather than having 10 shallow features.

5. **Mobile is a first-class platform.** The touch support (tap-to-connect, pinch-to-zoom, mobile delete, haptic feedback) is excellent. This game should be a PWA success story. Double down on mobile-first features.

6. **The educational content is genuinely good.** Post-solve insights, real-world applications, and the gate encyclopedia make this valuable as a learning tool. This is a competitive advantage over pure puzzle games.

7. **17K lines with no module system is a maintenance risk.** The codebase is remarkably well-organized for a monolithic architecture, but adding features will get increasingly painful. A build step isn't strictly necessary, but some modularization would help.

---

## Top 30 Improvements

### Critical (Fix First)
1. **Global leaderboard system** — Even a simple hash-based anonymous leaderboard for daily/weekly challenges would transform engagement
2. **Difficulty bridge levels** — Add 3-4 levels between Chapter 3 and Chapter 4 to smooth the cliff
3. **Tutorial for wire drawing** — The single biggest source of friction; add an interactive guided wire-draw in Level 1
4. **Truth table size management** — For 4-input levels, add filtering/highlighting to make 16-row tables manageable
5. **Undo/redo keyboard shortcuts visibility** — Many players don't know Ctrl+Z works; show in-canvas hint

### High Impact
6. **Achievements tied to daily play** — "7-day streak", "30 challenges completed", "all daily challenges in a month"
7. **Cosmetic unlocks** — Wire colors, gate skins, breadboard themes unlocked by stars/achievements
8. **Animated solution replay** — Let players watch their own solution play back with signal flow visualization
9. **Community level browser** — Share levels via URL already exists; add a curated "community picks" section
10. **Adaptive difficulty in challenges** — Track player skill and generate challenges at their edge of competence

### Medium Impact
11. **Signal flow visualization** — During simulation, animate signals traveling along wires (not just color change)
12. **Sub-circuit abstraction** — Let players package solved circuits as custom gates for later levels
13. **Timed daily challenge with rank** — "Your time: 2:30 — faster than 73% of players today"
14. **Level star requirements gate progress** — Require X total stars to unlock later chapters (soft gate)
15. **Gate limit challenges** — "Solve with exactly N gates" variants for solved levels
16. **Puzzle-of-the-day push notifications** — PWA notification support for daily engagement
17. **Sound design settings** — Separate SFX/Music sliders (architecture exists but UI is single slider)
18. **Campaign difficulty selector** — "Relaxed" (more hints, no star pressure) vs "Hardcore" (no hints, par timers)
19. **Wire routing improvement** — Bezier curves that avoid gates and follow clean L-shaped paths
20. **Collaborative sandbox** — Real-time shared sandbox via WebRTC for co-building circuits

### Polish
21. **Level preview thumbnails** — Show miniature circuit preview on level select for completed levels
22. **Gate drag-and-drop between levels** — Remember gate positions for retry attempts
23. **Celebration variety** — Different celebration animations based on chapter/stars (not always confetti)
24. **Keyboard-first wiring mode** — Tab between pins, Enter to connect — full keyboard workflow
25. **Error explanation on failure** — "Row 3 failed: A=1, B=0 should output 1, but your circuit outputs 0 because..."
26. **Performance optimization** — Canvas rendering: batch draw calls, use OffscreenCanvas for particles
27. **Multi-language support** — i18n infrastructure for gate names, descriptions, hints
28. **Accessibility: screen reader circuit description** — Describe circuit topology in text for blind players
29. **Save slots** — Multiple progress profiles for shared devices
30. **PWA offline support hardening** — Service worker caching for full offline play with proper cache invalidation
