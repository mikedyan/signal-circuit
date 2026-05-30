# Day 92 QA Report — Module Split Phase 1 (gates.js as ES module)

**Cycle:** 4 BUILD Week, Day 1 (cycleDay 40)
**Date:** 2026-05-30 (Saturday)
**Build under test:** `?v=1780272000` · `sw.js CACHE_NAME = 'signal-circuit-v61'` · `<script type="module" src="js/gates.js">`
**Harness:** `qa-reports/day-92-qa.cdp.js` (CDP-driven, permissive headless Chromium on port 9301, localhost:8901)
**Result:** **24 / 24 assertions passed** across 8 phases. **0** Runtime.exceptionThrown. **0** console.error.

## Summary

Day 92 ships **Module Split Phase 1**: converts `js/gates.js` from a classic-script global-leaking file into a true ES module while preserving 100% behavioral compatibility with the 8 classic-script consumers (`wires.js`, `simulation.js`, `levels.js`, `audio.js`, `achievements.js`, `canvas.js`, `ui.js`, `main.js`).

The CDP harness exercises 4 phases of new-feature verification (P1 build identity, P3 ES-module globals, P4 core-loop end-to-end) and 4 phases of regression coverage (P2 cold-start surface, P5 Day 84 Lab Bench II, P6 Day 83 Tournament adapter, P7 Day 78 staircase + P8 console hygiene). Everything passes.

## Phase-by-phase results

### P1 — Build identity (4/4)

- **P1.1** ✅ 11 cache-bust refs in `index.html` unified at `?v=1780272000` (CSS + 10 JS).
- **P1.2** ✅ `index.html` loads `gates.js` via `<script type="module" src="js/gates.js?v=1780272000"></script>` — the new module-script tag is present and well-formed.
- **P1.3** ✅ `js/gates.js` HTTP body contains both `export class Gate {` and `export const GateTypes` substrings.
- **P1.4** ✅ `sw.js` contains `CACHE_NAME = 'signal-circuit-v61'` (bumped from v60).

### P2 — Cold-start surface (4/4)

Surface invariants from Day 78 silent-default + Day 87 audit hold unchanged.

- **P2.1** ✅ `#level-select-screen` visible at cold start (display !== 'none', visibility !== 'hidden').
- **P2.2** ✅ Exactly 2 non-level chrome buttons visible: `#how-to-play-btn` + `#open-settings-btn`.
- **P2.3** ✅ 43 `.level-btn` cards rendered.
- **P2.4** ✅ `window.__onboardingExperiment.getVariant() === 'silent-standard'` and `localStorage['signal-circuit-difficulty-mode'] === 'standard'`.

### P3 — ES-module globals installed on `window` (5/5)

The 4 module exports get rebound to `window` via the tail block in `gates.js`. Classic-script consumers continue to find them as bare globals at call time.

- **P3.1** ✅ `typeof window.Gate === 'function'`.
- **P3.2** ✅ `window.Gate.toString()` starts with `class Gate` (proves it's a true class declaration carried through ES-module re-binding).
- **P3.3** ✅ `window.GateTypes` is an object with 8 gate types: `AND, OR, NOT, XOR, NAND, NOR, MYSTERY, MYSTERY3`.
- **P3.4** ✅ `typeof window.IONode === 'function'` (IONode class).
- **P3.5** ✅ `typeof window.roundRect === 'function'` (helper function).

### P4 — Core loop end-to-end on L1 (3/3)

Proves that the classic-script consumers can still construct gates, wires, and run a quick test even though `Gate` and `GateTypes` now flow through the ES-module boundary.

- **P4.1** ✅ `gs.startLevel(1)` loads L1; `gs.inputNodes.length === 2`, `gs.outputNodes.length === 1`.
- **P4.2** ✅ Synthetic solve persists 3 stars: `gs.addGate('AND', 400, 300)` + 3 wires via `gs.addWireFromData(...)` + `gs.runQuickTest()` → `gs.progress.levels['1'].stars === 3` (gates=1, wires=3).
- **P4.3** ✅ `gs.runSimulation()` runs to completion without throwing.

### P5 — Day 84 Lab Bench II L42 regression (2/2)

- **P5.1** ✅ L42 loads with `currentLevel.gateHardCap === 4`.
- **P5.2** ✅ `gs._validateLabConstraints()` with 5 gates returns `{ok: false, msg: 'Submission rejected: 5 gates exceeds hard cap of 4.'}` — exact match.

### P6 — Day 83 Tournament backend adapter shape (2/2)

- **P6.1** ✅ `gs.tournamentBackend.getMode() === 'local'`.
- **P6.2** ✅ `gs.tournamentBackend.describe() === '🏠 Local leaderboard · same puzzle, deterministic bots'`.

### P7 — Day 78 staircase end-game at seedProgress(40) (2/2)

- **P7.1** ✅ 40 `.level-overflow-btn` visible after `seedProgress(40, {stars:3})`.
- **P7.2** ✅ 18 `button.challenge-btn` visible at end-game tier.

### P8 — Console hygiene (2/2)

- **P8.1** ✅ 0 `Runtime.exceptionThrown` across the entire harness.
- **P8.2** ✅ 0 `console.error` across the entire harness.

## Harness iteration notes

Three harness bugs surfaced and were fixed without app changes:

1. **Wrong tournament path.** Initial selector tried `gs.weeklyTournament.backend` — but the adapter is at `gs.tournamentBackend` (Day 83 spec). Fix: read `gs.tournamentBackend` directly.
2. **Wrong wires accessor.** Used `gs.wires.length` (Day 91 lesson said the engine has no `gs.wires`). Real path is `gs.wireManager.wires.length`. Fix: pulled the Day 91 idiom verbatim.
3. **Wrong progress key.** Used `gs.progress.completed['1']` — the actual key shape is `gs.progress.levels['1']`. Fix: aligned with Day 91 harness.

All three are harness drift, not app drift — the app code paths were unchanged from Day 91. Logged as a Day 92 lesson: harness selectors and accessor paths converge slowly across days, and copy-pasting from the most recent passing harness beats writing fresh ones from spec.

## Lessons closed

- **ES-module conversion + classic-script consumers via `window` rebind works in practice.** The deferred-module-script execution order (modules run *after* HTML parsing but *before* DOMContentLoaded) means the 8 classic-script consumers all parse first (registering their class bindings without referencing `Gate`/`GateTypes` at top level), the module evaluates and installs globals, then `DOMContentLoaded` fires and `new Game()` constructs the world with all globals present.

- **Module-health.js now tracks ESM progress.** Updated to recognize `^export\s+` as the top-level declaration prefix and added an "ESM" column to the per-file table + an `ESM=N/M` segment to the stdout summary line. Day 92 baseline: 1 of 10 files converted (`gates.js` only). Future audits can spot regressions if this drops.

## Risk re-check

- **R1: a classic script references Gate/GateTypes at top level.** Pre-implementation grep audit said no. Post-implementation harness P4.2 (synthetic solve) and P5.2 (`_validateLabConstraints` walks Gate instances) prove the runtime path doesn't trip on the deferred-module timing.
- **R2: SW serves stale gates.js.** Mitigated by `CACHE_NAME` v60→v61. Harness preamble explicitly disables Network cache (`Network.setCacheDisabled`) and clears origin storage on tab init, then navigates with a `?day92=Date.now()` suffix.
- **R3: Module evaluation order.** Not observed as an issue — the L1 quick-test (which constructs `new Gate(...)` inside `gs.addGate('AND', ...)`) succeeds, proving `Gate` is on `window` by the time main.js's DOMContentLoaded handler runs.
- **R4: Future cycle regression.** Mitigated by `tools/module-health.js` ESM column. If a future cycle accidentally reverts to `class Gate {}` (classic-script form), the report would flag `ESM: 0/10`.

## Files changed (commit footprint)

| File | Change |
|---|---|
| `js/gates.js` | +12 LOC: 4 `export` keyword adds + tail `window.*` rebind block |
| `index.html` | 11 cache-bust bumps + 1 `type="module"` add |
| `sw.js` | 1 line — CACHE_NAME v60 → v61 |
| `tools/module-health.js` | +18 LOC: ESM detection + summary count + per-file ESM column |
| `specs/module-health.md` | regenerated (1 of 10 ESM-converted) |
| `roadmaps/cycle-4-build.md` | NEW — Cycle 4 BUILD roadmap, 5 days |
| `specs/day-92-module-split-gates-esm.md` | NEW — Day 92 spec |
| `qa-reports/day-92-qa.cdp.js` | NEW — harness |
| `qa-reports/day-92-qa.md` | NEW — this report |
| `build-reports/day-92-build.md` | NEW — build report |
| `BUGS.md` | Day 92 section appended |
| `LESSONS_LEARNED.md` | Day 92 lessons appended |
| `FACTORY_STATE.json` | Day 92 entry + nextCycle for Day 93 |

Single commit covering all of the above.
