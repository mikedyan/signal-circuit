# Day 89 QA Report — Cycle 3 HARDEN Week, Day 3: Edge Cases & Stress

- **Date:** 2026-05-27
- **Cycle / Day:** Cycle 3, cycleDay 37 of 90, HARDEN Week, weekDay 3
- **Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**)
- **Harness:** `qa-reports/day-89-qa.cdp.js` (permissive headless Chromium on port 9301 + raw CDP over `ws@8.20.0`)
- **Result:** **53 / 53 assertions passed** across **25 test phases**. **0 console errors. 0 new user-facing bugs. 0 source-file changes.**
- **0 open bugs at start of day, 0 open bugs at end.**

## Methodology

OpenClaw's `browser` tool refuses localhost by policy (Day 75 / Day 76 / Day 86 / Day 87 / Day 88 precedent), so this run uses a hand-rolled CDP harness:

1. `python3 -m http.server 8901` from the repo root serves the deployed-identical build.
2. A second permissive headless Chromium launches via `--remote-debugging-port=9301 --remote-allow-origins='*'`.
3. The harness connects to the CDP `webSocketDebuggerUrl` over `ws@8.20.0` (`NODE_PATH=/Users/openclaw/src/openclaw/node_modules`), enables `Page`/`Runtime`/`Network`, and disables HTTP cache.
4. `Runtime.exceptionThrown` and `Runtime.consoleAPICalled` with type `error` or `assert` populate the `consoleErrors` queue. Final assertion fails if non-empty.
5. Every phase pushes one or more `assertions[]` entries via `rec(label, ok, detail)`; final summary asserts `failed === 0 && consoleErrors.length === 0`.

## Phase-by-phase results

### T25 — Build identity (2 assertions)

| ID | Assertion | Result |
|---|---|---|
| T25.1 | 11 cache-bust refs at `?v=1780156800` | ✅ found=11 |
| T25.2 | `sw.js CACHE_NAME = 'signal-circuit-v60'` | ✅ |

### T20 — Day 85 Onboarding default (3 assertions)

| ID | Assertion | Result |
|---|---|---|
| T20.1 | `__onboardingExperiment.getVariant() === 'silent-standard'` | ✅ |
| T20.2 | `getCounters()` is JSON-serializable | ✅ `firstLaunches=1, toastShown=1, toastVariant=silent-standard` |
| T20.3 | Silent-default difficulty resolves to `standard` (via localStorage `signal-circuit-difficulty-mode` or `game.difficultyMode`) | ✅ |

### T4 — Cold-start sanity after `localStorage` clear (4 assertions)

| ID | Assertion | Result |
|---|---|---|
| T4.1 | Cold start lands on `level-select-screen` | ✅ |
| T4.2 | Cold non-level button count === 2 (`📖 How to Play`, `⚙️ Settings`) | ✅ |
| T4.3 | 43 level cards rendered | ✅ |
| T4.4 | Silent-default difficulty resolves to `standard` | ✅ |

### T6 — Colorblind + dark/light mode toggles (4 assertions)

| ID | Assertion | Result |
|---|---|---|
| T6.1 | `body.classList.add('colorblind-mode')` applies | ✅ |
| T6.2 | `body.classList.add('light-mode')` applies | ✅ |
| T6.3 | `body.classList.remove('light-mode')` reverts cleanly | ✅ |
| T6.4 | `body.classList.remove('colorblind-mode')` reverts cleanly | ✅ |

### T1 — Rapid gate placement during simulation (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T1.1 | `runSimulation()` started; 14 `addGate('AND', x, y)` calls fired mid-animation | ✅ no throw, `isAnimating=true` |

### T2 — Wire drawing during animation (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T2.1 | `wireManager.startWire(...)` + `cancelWire()` mid-anim | ✅ no throw |

### T3 — 10× rapid window resize (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T3.1 | 10 sequential `window.dispatchEvent(new Event('resize'))` (sizes range 320×480 → 1920×1080) | ✅ no throw, canvas 676×469 stable |

### T5 — Keyboard tab navigation reachability (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T5.1 | Gameplay screen exposes ≥10 focusable elements (Day 80 `:focus-visible` rings honor) | ✅ count=15 (`back-btn`, `shortcuts-btn`, `encyclopedia-gameplay-btn`, `kb-wiring-btn`, `tutorial-skip-btn`, `next-level`, `run-btn`, `quick-test-btn`, `clear-btn`, `hint-btn`, `focus-failed-btn`, `sfx-icon`, `sfx-slider`, …) |

### T7 — Performance probe: 10× canvas render (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T7.1 | 10× `renderer.render()` completes; avg <5ms per frame | ✅ totalMs=1.80, avg=0.180ms (renderer found via `game.renderer`) |

### T8 — RUN spam (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T8.1 | 15× `runSimulation()` calls no-throw | ✅ count=15, `isAnimating` guard honors re-entry contract |

### T9 — Quick Test spam (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T9.1 | 15× `runQuickTest()` calls no-throw | ✅ count=15 |

### T10 — Undo/redo storm (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T10.1 | 20× undo + 20× redo (no `g.undo`/`g.redo` on empty stack means 0 increments; the assertion is **no-throw**) | ✅ |

### T11 — Mode-switch storm (1 assertion)

10 alternating clicks `level-select ↔ daily/random/sandbox/tournament/infinite`.

| ID | Assertion | Result |
|---|---|---|
| T11.1 | After 10 transitions, screen returns to `level-select-screen` | ✅ no throw |

### T12 — blur/focus + visibilitychange cycle (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T12.1 | `window:blur` → `document:visibilitychange` → `window:focus` → `document:visibilitychange` no-throw | ✅ |

### T13 — Lab Bench attempt exhaustion (Day 70) (2 assertions)

L36 entered, 3× `_consumeLabAttempt()` invocations, then `resetLab()`.

| ID | Assertion | Result |
|---|---|---|
| T13.1 | `_lab.attempts` walks 0 → 3 (exhausted=true) → reset → 0 (firstTryLocked=true) | ✅ |
| T13.2 | RUN button labeled `📐 Submit Blueprint` | ✅ |

### T17 — Day 84 Lab Bench II L41 NAND-only (2 assertions)

| ID | Assertion | Result |
|---|---|---|
| T17.1 | `currentLevel.availableGates === ['NAND']` | ✅ |
| T17.2 | `#lab-constraint` chip text mentions `NAND` | ✅ "🧱 NAND only — universal gate practice" |

### T18 — Day 84 Lab Bench II L42 hard cap 4 (4 assertions)

| ID | Assertion | Result |
|---|---|---|
| T18.1 | `currentLevel.gateHardCap === 4` | ✅ |
| T18.2 | `#lab-constraint` chip mentions `Hard cap` | ✅ "🎯 Hard cap: 4 gates" |
| T18.3 | `_validateLabConstraints()` rejects when `gates.length === 5` | ✅ `Submission rejected: 5 gates exceeds hard cap of 4.` |
| T18.4 | `_validateLabConstraints()` accepts exactly 4 gates | ✅ `ok:true` |

### T19 — Day 84 Lab Bench II L43 mustInclude XOR (4 assertions)

| ID | Assertion | Result |
|---|---|---|
| T19.1 | `currentLevel.mustIncludeGate === ['XOR']` | ✅ |
| T19.2 | `#lab-constraint` chip mentions `XOR` | ✅ "✳️ Must include an XOR gate" |
| T19.3 | `_validateLabConstraints()` rejects circuit without XOR | ✅ `Submission rejected: blueprint must include an XOR gate.` |
| T19.4 | `_validateLabConstraints()` accepts circuit with XOR | ✅ |

### T14 — Tournament archive replay (Day 72 + Day 83) (4 assertions)

| ID | Assertion | Result |
|---|---|---|
| T14.1 | Tournament screen opens (`#tournament-btn` click) | ✅ |
| T14.2 | ≥3 tabs (This Week / My Best / Archive) | ✅ tabs=3 |
| T14.3 | `tournamentBackend.getMode() === 'local'` (Day 83 adapter still default) | ✅ |
| T14.4 | `tournamentBackend.describe()` non-empty (Day 83 mode label) | ✅ "🏠 Local leaderboard · same puzzle, deterministic bots" |

### T15 — Mythic celebration overlay invocation (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T15.1 | `#mythic-celebration` DOM does NOT exist at cold start, but `ui.showMythicCelebration({id:'galaxy_brain', name:'Galaxy Brain'})` lazy-mounts it (`display: flex`) | ✅ |

### T16 — localStorage capacity probe (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| T16.1 | 50 × 50KB writes succeed without `QuotaExceededError` | ✅ written=50 |

### T21 — Onboarding URL override `?onboarding=warm-toast` (2 assertions)

| ID | Assertion | Result |
|---|---|---|
| T21.1 | Variant resolves to `warm-toast` after URL override | ✅ |
| T21.2 | Override persists into `localStorage('signal-circuit-onboarding-experiment').variant` | ✅ |

### T22 — Onboarding URL override `?onboarding=explicit-chooser` (2 assertions)

| ID | Assertion | Result |
|---|---|---|
| T22.1 | Variant resolves to `explicit-chooser` after URL override | ✅ |
| T22.2 | Override persists into localStorage | ✅ |

### T24 — Day 78 staircase regression (3 assertions)

| ID | Assertion | Result |
|---|---|---|
| T24.1 | Cold: 2 non-level buttons | ✅ |
| T24.2 | `seedProgress(18, {stars:3})`: 18 nav buttons (tier3 target) | ✅ |
| T24.3 | `seedProgress(40, {stars:3})`: 18 nav + 40 overflow buttons (Day 78 target) | ✅ |

### T23 — Day 86 module-health stability (4 assertions)

Additionally verified out-of-band by running `node tools/module-health.js`: report was **byte-identical** to Day 86 baseline except for the timestamp line.

| ID | Assertion | Result |
|---|---|---|
| T23.1 | `js/wires.js` still defines `WIRE_COLORS_DEFAULT` | ✅ |
| T23.2 | `js/wires.js` no longer contains `const WIRE_COLORS = WIRE_COLORS_DEFAULT` (Day 86 reduction holds) | ✅ |
| T23.3 | Day 79 7 dead identifiers all `typeof === 'undefined'` (`showFirstLaunchDifficultyModal`, `checkLightning`, `checkEclipseRun`, `checkArchitect`, `isMythic`, `_showHud`, `getCurrentStep`) | ✅ |
| T23.4 | `#weekly-puzzle-btn` DOM absent | ✅ |

### FINAL — Console error tally (1 assertion)

| ID | Assertion | Result |
|---|---|---|
| FINAL | 0 `Runtime.exceptionThrown` and 0 `console.error` across entire suite | ✅ `errors=0` |

## Cycle 3 BUILD-week regression verdict

All 5 features still intact end-to-end:

- **Day 82 Shareable Snapshot Cards** — not directly re-exercised today (covered Day 87/88); no regressions in dependent screens.
- **Day 83 Tournament Backend Adapter** — `getMode() === 'local'`, `describe()` label live (T14.3 / T14.4).
- **Day 84 Lab Bench II** — L41 / L42 / L43 chips all live; validator enforces hard cap and mustInclude XOR via `_validateLabConstraints()` (T17 / T18 / T19, 10 assertions).
- **Day 85 Onboarding Experiment Flag** — silent-standard default holds (T20); URL overrides for `warm-toast` and `explicit-chooser` both work and persist (T21 / T22).
- **Day 86 Module Split Foundation** — module-health re-run is byte-identical (T23, plus filesystem-level diff).

## Day 87 LO-1 status

LO-1 (direct `ui.showScreen('level-select')` bypassing Day 61+74 HUD cleanup) remains **deferred**. Not user-reachable; today's mode-switch storm (T11) went through `GameState.showLevelSelect()` and `#back-btn` paths, both of which DO carry the cleanup blocks. No new latent observations surfaced today.

## Bugs / changes

- **0 P0 / 0 P1 / 0 P2 bugs found.**
- **0 source-file changes.**
- Cache bust + SW version intentionally **NOT bumped** (Day 86/87/88 precedent: only bump on real code change).

## Files updated today

- `qa-reports/day-89-qa.md` — this report
- `qa-reports/day-89-qa.cdp.js` — harness
- `specs/module-health.md` — regenerated (byte-identical except timestamp)
- `BUGS.md` — Day 89 summary appended
- `LESSONS_LEARNED.md` — Day 89 lessons appended
- `FACTORY_STATE.json` — `lastCompletedDay`, `nextDay`, `cycleDay`, `weekDay`, `lastRun`, `status`, `lastRunNote`, `days["89"]`, `hardenWeekCycle3.edgeCasesComplete`, `nextCycle.focus` for Day 90

## Day 90 plan (HARDEN Week Day 4 — Fix Everything)

Day 90 is **Fix Day**: read `BUGS.md`, fix P0 → P1 → P2 with atomic commits, re-test each fix. At start of Day 90, the open queue is empty — so today's edge-case-and-stress sweep set up Day 90 to either be a no-op rest day or to ship LO-1's fix as a polish-day-style move (TBD by Day 90 agent).
