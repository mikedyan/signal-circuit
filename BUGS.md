# Bugs — Signal Circuit

*Updated: Day 89 — Cycle 3 HARDEN Week, Day 3 (2026-05-27) — Edge Cases & Stress*

## Day 89 — Cycle 3 HARDEN Week, Day 3 (Edge Cases & Stress) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **53 / 53** assertions passed across **25 test phases**. **0** new user-facing bugs. **0** console errors. Day 87 latent observation **LO-1** remains deferred (not user-reachable).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86/87/88 precedent).

**Open Bugs queue:** 0 at start of day, 0 at end of day.

**Stress sweep coverage (25 phases / 53 assertions):**

- **T1–T3:** rapid gate placement during sim / wire-draw during animation / 10× window resize — all no-throw.
- **T4:** localStorage cleared + reload — cold start lands on level-select with 2 buttons, 43 level cards, silent-default difficulty `standard`.
- **T5:** Keyboard Tab reachability — 15 focusable elements on gameplay screen (Day 80 `:focus-visible` rings honor).
- **T6:** Colorblind + light/dark mode class toggles round-trip cleanly.
- **T7:** Performance probe — 10× canvas `renderer.render()` total 1.80ms, avg 0.180ms/frame.
- **T8–T9:** 15× RUN spam + 15× Quick Test spam — all no-throw (re-entry contract holds).
- **T10:** 20× undo + 20× redo — no-throw on empty stacks.
- **T11:** Mode-switch storm — 10 alternating clicks across daily/random/sandbox/tournament/infinite all return to `level-select-screen` cleanly.
- **T12:** `blur` + `visibilitychange` + `focus` event cycle no-throw.
- **T13:** Lab Bench L36 attempt state machine walks `0 → 3 (exhausted=true) → reset → 0 (firstTryLocked=true)`; RUN labeled `📐 Submit Blueprint`.
- **T17–T19 (Day 84 Lab Bench II under stress):** L41 NAND-only palette + chip live; L42 hard cap 4 chip + validator rejects 5-gate / accepts 4-gate; L43 mustInclude XOR chip + validator rejects no-XOR / accepts with-XOR.
- **T14:** Tournament screen opens (3 tabs); `tournamentBackend.getMode()==='local'`; Day 83 describe label `🏠 Local leaderboard · same puzzle, deterministic bots` live.
- **T15:** `#mythic-celebration` overlay lazy-mounts on `ui.showMythicCelebration()` (does NOT exist at cold start).
- **T16:** localStorage 50×50KB writes succeed (no quota exceeded).
- **T20:** Day 85 default variant `silent-standard` + counters JSON-serializable + silent-default difficulty `standard`.
- **T21:** `?onboarding=warm-toast` URL override → variant `warm-toast`, persists into localStorage.
- **T22:** `?onboarding=explicit-chooser` URL override → variant `explicit-chooser`, persists into localStorage.
- **T23:** Day 86 module-health stability — `wires.js` retains `WIRE_COLORS_DEFAULT` and no longer redefines `WIRE_COLORS`; all 7 Day 79 dead identifiers still `undefined`; `#weekly-puzzle-btn` DOM absent.
- **T24:** Day 78 staircase — cold 2 / tier3 18 / end-game 18 nav + 40 overflow.
- **T25:** Build identity — 11 cache-bust refs at `?v=1780156800`, SW `signal-circuit-v60`.
- **FINAL:** 0 `Runtime.exceptionThrown` + 0 `console.error` across entire suite.

Additionally: `node tools/module-health.js` regenerated `specs/module-health.md` byte-identical to Day 86 baseline (timestamp line only).

Full report: `qa-reports/day-89-qa.md`.
Harness: `qa-reports/day-89-qa.cdp.js`.

*Updated: Day 88 — Cycle 3 HARDEN Week, Day 2 (2026-05-26) — Level Playthrough*

## Day 88 — Cycle 3 HARDEN Week, Day 2 (Level Playthrough) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **100 / 100** assertions passed across 13 phases. **0** new user-facing bugs. **0** console errors. Day 87 latent observation **LO-1** remains deferred (not user-reachable).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86/87 precedent).

**Audit coverage (13 phases / 100 assertions):**

- Phase 1 (2): build identity — cache-bust + SW match Day 86/87.
- Phase 2 (1): difficulty mode default = `standard` (silent-default from Day 78 #5 / Day 85 onboarding experiment).
- Phase 3 (72): per-level static validation — 12 levels (1, 5, 10, 15, 20, 25, 30, 35, 40, 41, 42, 43) × 6 checks each:
  - level resolves via `getLevel(N)`
  - truth table matches re-derived semantics (AND / NOR / OR / Majority / MUX / ripple adder / demux / XOR / parity-3 / etc.)
  - `hints[].length === 3`
  - `calculateStars(opt) === 3`
  - `calculateStars(good) ≤ 2`
  - `calculateStars(good + 5) === 1`
- Phase 4 (4): live L1 gameplay + `#hint-btn` click increments `hintsUsed` 0→1.
- Phase 5 (2): `completeLevel(1, opt)` persists `{stars:3}`.
- Phase 6 (4): Daily Challenge — pre-screen → `#start-daily-btn` → gameplay with `isDaily=true` → back-btn returns clean.
- Phase 7 (2): Random Challenge — `seedProgress(18)` → `#random-challenge-btn` → `#generate-challenge-btn` → gameplay with `isChallengeMode=true`.
- Phase 8 (2): Blitz Mode — entry + back-btn HUD cleanup (Day 61 fix intact).
- Phase 9 (2): Speedrun Mode — entry + back-btn HUD cleanup (Day 74 fix intact).
- Phase 10 (1): Sandbox config screen opens.
- Phase 11 (4): Community levels 1–4 (`The Implication`, `Inverted AND`, `Either But Not A`, `Always Agree`) load via `ui.playCommunityLevel()` with `isCommunityLevel=true`.
- Phase 12 (3): Day 84 Lab Bench II regression — L41 NAND-only chip, L42 hard cap 4 chip, L43 mustInclude XOR chip all live.
- Phase 13 (1): 0 console errors across entire suite.

Full report: `qa-reports/day-88-qa.md`.
Harness: `qa-reports/day-88-qa.cdp.js`.

*Updated: Day 87 — Cycle 3 HARDEN Week, Day 1 (2026-05-25) — Full Interaction Audit*

## Open Bugs

*(none user-facing — Day 87 audit found 0 new bugs across 66 assertions, 29 phases, 0 console errors.)*

## Latent Observations (P2, not user-reachable)

### LO-1 — Direct `ui.showScreen('level-select')` bypasses Day 61 + Day 74 HUD cleanup

- **Surfaced:** Day 87 (Cycle 3 HARDEN Day 1 — Full Interaction Audit).
- **Symptom:** Calling `window.game.ui.showScreen('level-select')` directly from the dev console (or any future internal caller) leaves `speedrunMode=true` and `#speedrun-hud` `display: flex`. Same shape would surface for `blitzMode` if an internal caller bypassed `GameState.showLevelSelect()` while Blitz Mode is active.
- **Severity:** P2 latent. Documented as code-smell, NOT a user-reachable bug.
- **Why not user-reachable:** All user-facing transitions go through the `#back-btn` click handler, which calls `GameState.showLevelSelect()` — the wrapper that holds the Day 61 (Blitz) and Day 74 (Speedrun) defensive cleanup blocks. Day 87 explicitly verified the back-btn paths for both modes; both pass.
- **Root cause:** The defensive HUD cleanup lives on the **GameState wrapper layer** (`GameState.showLevelSelect()`), not on the **UI layer** (`ui.showScreen('level-select')`). When the UI layer is invoked directly, the cleanup never runs.
- **Fix plan (future Polish/Prune Week):** Move the cleanup blocks down to `ui.showScreen('level-select')` so the cleanup is invariant to caller. The cleanup is genuinely "any time this screen becomes visible" — the right home is the screen-transition function itself, not the high-level wrapper.
- **Day 87 chose not to fix:** HARDEN Week policy is fix-only-user-facing-bugs. This observation is preserved here so a future Polish day can ship the fix at zero risk.

## Day 87 — Cycle 3 HARDEN Week, Day 1 (Full Interaction Audit) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **66 / 66** assertions passed across 29 phases. **0** new user-facing bugs. **0** console errors. **1** latent observation logged (LO-1 above).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86 precedent: only bump on real change).

**Module-health diff vs Day 86 baseline:** timestamp-only change. 10 files / 21208 LOC / 110 globals / 25-sym `ui.js` fan-out / 0 collisions — all byte-identical.

**Audit coverage (29 phases / 66 assertions):**

- Phase 1 (2): build identity — cache-bust + SW match Day 86.
- Phase 2 (6): cold-start surface — 2 buttons, 43 level cards, 'silent-standard' onboarding, DIFFICULTY_KEY=`standard`.
- Phase 3 (4): Settings modal — 13 buttons, accessibility toggles non-throwing, Difficulty Mode chooser opens, Install App click safe.
- Phase 4 (1): How to Play modal opens.
- Phase 5 (5): Day 82 Shareable Snapshot Cards regression — L1 solve + `#share-card-modal` 1200×630 canvas + 4 controls.
- Phase 6 (4): Day 83 Tournament Backend Adapter regression — `getMode()==='local'`, `isLive()===false`, describe label, full interface.
- Phase 7 (6): Day 84 Lab Bench II regression — L41 NAND-only + chip, L42 hard cap 4 + chip, L43 must include XOR + chip.
- Phase 8 (2): Day 85 Onboarding Experiment Flag regression — default variant + full interface.
- Phase 9 (2): Day 86 Module Split Foundation — report regenerated, 10 files / 110 globals confirmed.
- Phase 10 (2): Daily Challenge — pre-screen + gameplay entry with `currentLevel.isDaily=true`.
- Phase 11 (2): Random Challenge — config + generate → isChallengeMode=true.
- Phase 12 (2): Blitz Mode — entry + back-btn HUD cleanup (Day 61 fix intact).
- Phase 13 (2): Speedrun Mode — entry + back-btn HUD cleanup (Day 74 fix intact).
- Phase 14 (1): Sandbox config screen opens.
- Phase 15 (1): Creator config screen opens via `#create-level-btn`.
- Phase 16 (3): Tournament screen — 3 tabs + Day 83 mode label live.
- Phase 17 (1): Encyclopedia modal opens with content.
- Phase 18 (2): Achievements modal — 269 row elements, 6 with `tier-mythic` class.
- Phase 19 (1): Stats modal — 3 chart canvases render.
- Phase 20 (1): Customize modal `#cosmetic-modal` opens.
- Phase 21 (1): Logic Profile modal opens.
- Phase 22 (1): Mastery Tree button visible at tier3 (seed=18).
- Phase 23 (1): Circuit Collection modal opens.
- Phase 24 (6): L6 gameplay deep dive — all 9 core buttons present, truth table 4 rows, hint/clear/panel/back all non-throwing.
- Phase 25 (1): Tier3 staircase — 18 non-level buttons at seed=18 (Day 78 target).
- Phase 26 (1): End-game — 18 nav + 40 overflow at seed=40 (Day 78 target).
- Phase 27 (1): Mastery Tree modal opens at campaign complete.
- Phase 28 (2): Day 79 dead-identifier regression — all 7 removed identifiers still undefined, `#weekly-puzzle-btn` DOM absent.
- Phase 28b (info): LO-1 latent observation logged.
- Phase 29 (1): 0 console errors across entire suite.

**Cycle 3 BUILD-week regression verdict:** All 5 features (Days 82, 83, 84, 85, 86) intact end-to-end.

## Day 86 — Cycle 3 Build Week, Day 5 (Module Split Foundation) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'`.
**Result:** 0 new bugs. Feature QA passed 19/19. 0 open bugs at start, 0 open bugs at end.

**What changed:**

- `tools/module-health.js` (new, ~240 LOC, pure Node, no npm deps): scans `js/*.js`, computes per-file LOC, globals defined, classes exposed, fan-in (symbols this file defines that others reference) and fan-out (symbols from other files this file references). Emits markdown at `specs/module-health.md`. Idempotent; re-runnable with `node tools/module-health.js`.
- `specs/module-health.md` (new, auto-generated baseline, ~270 LOC).
- `specs/day-86-module-split-foundation.md` (new, spec).
- `js/wires.js`: removed dead-global `const WIRE_COLORS = WIRE_COLORS_DEFAULT;` at line 43 (referenced nowhere outside its own definition; surfaced by the report's fan-in=0 column). Replaced with a 3-line comment for archaeology. Net +2 LOC, −1 global.
- `qa-reports/day-86-qa.cdp.js` (new, CDP harness).
- `index.html`: 11 `?v=` refs bumped to `?v=1780156800`.
- `sw.js`: `CACHE_NAME = 'signal-circuit-v60'`.

**Baseline module-health story (post-reduction):**

- 10 files, 21,208 LOC, 110 top-level globals, 0 cross-file symbol collisions.
- `ui.js`: biggest fan-out (25 syms across 5 files), fan-in=1 (just `UI`).
- `gates.js`: biggest fan-in (8 files reference its `Gate`/`IONode`/`GateTypes`/`roundRect`), fan-out=0. Natural first extraction target.
- `main.js`: 60 globals defined (54% of total), fan-in=6, fan-out=24. Biggest single coupling-reduction lever for future days.

**Verification matrix (CDP via permissive headless Chromium on localhost:8901, port 9301):**

- ✅ Syntax: `node -c js/wires.js`, `node -c sw.js`.
- ✅ Build identity: 11 cache-bust refs unified at `?v=1780156800`; zero stale `?v=1780070400` refs remain; SW `CACHE_NAME = 'signal-circuit-v60'`.
- ✅ Cold-start non-level button count on `#level-select-screen` = 2.
- ✅ Day 85 onboarding default: `window.__onboardingExperiment.getVariant() === 'silent-standard'`; counters JSON-serializable.
- ✅ L1 entry: `#gameplay-screen` visible, `#run-btn` visible, 4 truth-table rows.
- ✅ L1 solve via 1 AND gate: `simulation.runAll()` returns 4 rows all `pass === true`; subsequent `runQuickTest()` produces "Level complete!" status banner.
- ✅ Day 84 L41: `availableGates === ['NAND']`; `labConstraint === '🧱 NAND only — universal gate practice'`; `#lab-constraint` chip visible.
- ✅ Day 83 tournament adapter: `game.tournamentBackend.getMode() === 'local'`; `describe()` returns `'🏠 Local leaderboard · same puzzle, deterministic bots'`.
- ✅ Day 78 staircase: after `seedProgress(40)`, 18 non-level buttons + 40 `.level-overflow-btn` buttons visible.
- ✅ 0 `Runtime.exceptionThrown`, 0 `console.error` events across 8 phases.

## Day 85 — Cycle 3 Build Week, Day 4 (Onboarding Experiment Flag) summary

**Build under test:** `?v=1780070400`, `sw.js CACHE_NAME = 'signal-circuit-v59'`.
**Result:** 0 new bugs. Feature QA passed 44/44.

**What changed:**

- `js/main.js`: new `OnboardingExperiment` class (~150 LOC) right above `NotificationManager`; new constants `ONBOARDING_EXPERIMENT_KEY`, `ONBOARDING_VARIANTS`, `ONBOARDING_DEFAULT_VARIANT`, `ONBOARDING_TOAST_COPY`. `GameState` constructor instantiates `this.onboardingExperiment` and exposes `window.__onboardingExperiment`. Day 78 silent-default block (`_checkPlacementTest`) now calls `this.onboardingExperiment.applyFirstLaunch()` instead of inlining.
- `js/ui.js`: `setupSettingsModal()` toggles `#settings-developer-section` based on `localStorage signal-circuit-debug === '1'` on each open; wires `#onboarding-experiment-btn` to a new `showOnboardingExperimentPanel()` modal that lists the current variant, counters, and a reset+reload button.
- `index.html`: new `#settings-developer-section` (display:none by default) inside the Settings modal with one `#onboarding-experiment-btn`.
- `index.html` + `sw.js`: cache bust to `?v=1780070400` (11 refs) and `CACHE_NAME = 'signal-circuit-v59'`.

## Day 84 — Cycle 3 Build Week, Day 3 (Lab Bench II Seed Pack) summary

## Day 84 — Cycle 3 Build Week, Day 3 (Lab Bench II Seed Pack) summary

**Build under test:** `?v=1779984000`, `sw.js CACHE_NAME = 'signal-circuit-v58'`.
**Result:** 0 new bugs. Feature QA passed 49/49.

**What changed:**

- `js/levels.js`: new chapter id 10 ("Chapter 9: Lab Bench II", levels [41,42,43]); three new lab levels with one extra constraint each (palette/cap/required-gate); new optional level fields `labConstraint`, `gateHardCap`, `mustIncludeGate`.
- `js/main.js`: new helper `_validateLabConstraints()` called after `_consumeLabAttempt()` in both `runSimulation` and `runQuickTest`; constraint violation surfaces in result + status bar and consumes the attempt.
- `js/ui.js`: `updateLabHud()` now populates `#lab-constraint` from `level.labConstraint` (hides on legacy lab levels), and toggles `.over-cap` on `#lab-budget` when `gateHardCap` is exceeded.
- `index.html`: new `<span id="lab-constraint">` in the lab HUD strip.
- `css/style.css`: `.lab-constraint` amber chip style + `.over-cap` red pulse on the budget chip; light-mode mirrors.
- Cache bust unified at `?v=1779984000`; SW bumped to `signal-circuit-v58`.

**Verification matrix (CDP via headless Chromium on localhost:8901):**

- ✅ Syntax: `node -c js/levels.js`, `node -c js/main.js`, `node -c js/ui.js`.
- ✅ Build identity: 11 cache-bust refs all `1779984000`; SW v58 active.
- ✅ `LEVELS.length === 43`, `getLevelCount() === 43`, Chapter 10 has levels [41,42,43].
- ✅ L41 isLabBench, `availableGates=['NAND']`, toolbox shows only NAND.
- ✅ L42 isLabBench, `gateHardCap=4`.
- ✅ L43 isLabBench, `mustIncludeGate=['XOR']`.
- ✅ L41 constraint chip visible with copy `🧱 NAND only — universal gate practice`.
- ✅ L41 NAND → NAND-as-NOT chain solves all 4 truth rows.
- ✅ L42 constraint chip visible with copy `🎯 Hard cap: 4 gates`.
- ✅ L42 5-gate submission rejected with message `Submission rejected: 5 gates exceeds hard cap of 4.`; attempt is consumed (1/3).
- ✅ L42 `#lab-budget` gains `.over-cap` class at 5 gates and drops it after building the valid 4-gate MUX.
- ✅ L42 Reset Lab restores 3 tries; 4-gate MUX solves all 8 truth rows; `_validateLabConstraints()` returns ok.
- ✅ L43 constraint chip visible with copy `✳️ Must include an XOR gate`.
- ✅ L43 AND+OR submission rejected with message containing `XOR`; attempt is consumed (1/3).
- ✅ L43 Reset Lab restores 3 tries; 2-XOR chain solves all 8 truth rows; `_validateLabConstraints()` returns ok.
- ✅ L36 legacy lab level: `#lab-constraint` hidden, lab HUD still flex, RUN reads `📐 Submit Blueprint`.
- ✅ L1 normal level: lab HUD hidden, RUN reads `▶ RUN`, constraint chip hidden.
- ✅ Cold-start non-level button count still 2 (no top-level chrome added).
- ✅ Console: 0 JS errors across all 49 assertions.


## Day 83 — Cycle 3 Build Week, Day 2 (Tournament Backend Adapter Shell) summary

**Build under test:** `?v=1779897600`, `sw.js CACHE_NAME = 'signal-circuit-v57'`.
**Result:** 0 new bugs. Feature QA passed.

**What changed:**

- `js/main.js` gained a `TournamentBackend` interface and two concrete adapters (`LocalTournamentAdapter`, `RemoteTournamentAdapter`) plus a `selectTournamentBackend()` factory.
- `GameState.tournamentBackend` is now instantiated immediately after `this.weeklyTournament`.
- Both gameplay-completion `weeklyTournament.submitScore(...)` call sites now route through `this.tournamentBackend.submitScore(...)`.
- `#tournament-mode-label` added to `#tournament-screen` and populated from `backend.describe()` in `UI.showTournamentScreen()`.
- Cache bust unified at `?v=1779897600`; SW bumped to `signal-circuit-v57`.

**Verification matrix:**

- ✅ Syntax: `node -c js/main.js`, `node -c js/ui.js`.
- ✅ Build identity: 11 cache-bust refs all `1779897600`; SW v57 active.
- ✅ Default adapter is `LocalTournamentAdapter`, `getMode()='local'`, `isLive()=false`.
- ✅ Tournament button reveals at tier3 (seeded 20 levels); 3 tabs + 3 panes render, leaderboard has 10 rows.
- ✅ Local `submitScore(1, 5)` → `{rank:1, percentile:98, isNewBest:true, score:100, podium:true, crowned:true, achievements:['tournament_podium','tournament_crowned'], gates:1, time:5, weekKey:'2026-W21'}`.
- ✅ Achievements `tournament_podium` and `tournament_crowned` unlocked after submission.
- ✅ Toggle `window.__SC_TOURNAMENT_BACKEND__={mode:'remote'}` + re-init → `RemoteTournamentAdapter`, `getMode()='remote-ready'`, describe label switches to cloud-ready string, submitScore still returns full rank/percentile via local fallback. No fetch attempted.
- ✅ `localStorage('signal-circuit-tournament-backend','remote')` path also produces `RemoteTournamentAdapter`.
- ✅ Restoring defaults returns to `LocalTournamentAdapter`.
- ✅ Console: 0 JS errors.

## Day 82 — Cycle 3 Build Week, Day 1 (Shareable Circuit Snapshot Cards) summary

**Build under test:** `?v=1779811200`, `sw.js CACHE_NAME = 'signal-circuit-v56'`.
**Result:** 0 new bugs. Feature QA passed.

**What changed:**

- Existing `📸 Share Card` modal now renders a real solved-circuit snapshot on the right side of the 1200×630 image.
- Snapshot uses existing Day 43 preview data (`gameState.getPreview(level.id)`) and `_renderPreviewCanvas()`.
- Modal now exposes `💾 Save Image`, `📋 Copy Image`, `🔗 Share`, and Close controls.
- Clipboard image copy uses `ClipboardItem` when supported, with text fallback.
- Native Web Share uses image files when supported, with text/link fallback.
- Deterministic fallback circuit art appears if no saved preview exists.

**Verification matrix:**

- ✅ Syntax: `node -c js/ui.js`, `node -c js/main.js`.
- ✅ Build identity: 11 cache-bust refs unified at `?v=1779811200`; SW v56.
- ✅ Cold start: still 2 visible non-level buttons (`how-to-play-btn`, `open-settings-btn`).
- ✅ Level 1 solved through Quick Test: result `✓ CIRCUIT CORRECT!`, star display visible.
- ✅ Preview persisted: 1 gate, 3 wires, 3 IO nodes, `gc=1`.
- ✅ Share-card button visible after solve; modal opens.
- ✅ Canvas dimensions: 1200×630.
- ✅ Snapshot panel has non-background circuit pixels (`nonDark=4750`, `tealish=977`).
- ✅ All four modal controls visible.
- ✅ Console: 0 JS errors / exceptions.

## Day 81 — Prune Week 2, Day 5 (Expert Panel + Validation) summary

**Build under test:** `?v=1779724800`, `sw.js CACHE_NAME = 'signal-circuit-v55'` (Day 80 build, unchanged).
**Result:** 0 new bugs. Full validation suite passed.

**Verification matrix (24 probes + 5 navigations):**

- ✅ Build identity: 11 cache-bust refs unified at `?v=1779724800`; SW controller = `signal-circuit-v55`; `game.constructor.name === 'GameState'`.
- ✅ Cold start: `level-select-screen` visible, 2 non-level buttons (How to Play + Settings), 40 level cards, 0 overflow buttons, welcome toast fires, no difficulty modal forced, Tournament hidden, `#weekly-puzzle-btn` DOM absent, star chip hidden.
- ✅ L1 (AND Gate Basics): tutorial fires, 4 truth-table rows, hint-footer hidden, Lab HUD hidden, `isLabBench=false`, Quick Test visible, RUN labeled "▶ RUN".
- ✅ L6 (Signal Selector): 4 truth rows, hint footer reappears at L6+ as intended (Day 78 #4 only hides L<4).
- ✅ L12 (Dual Output Router): 4 truth rows.
- ✅ L18 (2-Input Decoder): 4 truth rows, gold-tier marker.
- ✅ L36 (Lab Bench · Open Design: 3-Input Selector): `isLabBench=true`, RUN="📐 Submit Blueprint", Quick Test hidden, lab HUD visible, `_lab={attempts:0,maxAttempts:3,exhausted:false,firstTryLocked:false,cleared:false}`, lab tutorial fires, 8 truth rows.
- ✅ Tier staircase verified: non-level buttons 2/5/7/10/18/18 at seeds 0/6/9/12/18/40; overflow buttons 0/6/9/12/18/40; Tournament appears at tier3 (seed 18); end-game = 58 buttons (Day 78 target).
- ✅ Day 80 polish: `overflowPopIn`, `tierRevealPulse`, `.newly-revealed`, `:focus-visible`, `prefers-reduced-motion` + `#welcome-toast` rules all present.
- ✅ Day 79 dead identifiers regression: `showFirstLaunchDifficultyModal`, `checkLightning`, `isMythic` all `undefined`; `#weekly-puzzle-btn` DOM absent.
- ✅ Cold-start defaults: `sfxVol=0.4`, `musicVol=0.2`, `light-mode` class auto-applied.
- ✅ Console: 0 errors across all 24 probes + 5 navigations.

**Final cycle 2 score:** 8.9/10 (+0.5 from Cycle 1's 8.4). Wrote `reviews/prune-cycle-2-review.md` (15.7 KB).

**Cycle 2 wrap:** 14 day-tasks (5 build + 4 harden early wrap + 5 prune). 0 open bugs entering Cycle 3. End-game button count 98 → 58 (Day 78). Tier-2 cliff smoothed to 5-step staircase. Lab Bench shipped (Day 70). Mythic+Diamond tier shipped (Day 71). Weekly Tournament shipped (Day 72). Net LOC: build dominated (+1244); prune week net-negative on its own (−91 across Day 79 cleanup and Day 80 polish).

## Prior — Day 80 — Prune Week 2, Day 4 (Polish Sprint) summary

**Build under test:** `?v=1779724800`, `sw.js CACHE_NAME = 'signal-circuit-v55'`
**Result:** 0 new bugs, ~+70 LOC (polish budget — net-neutral expected).

**Cold-start defaults audit:** SFX 0.4 / Music 0.2 / dark-mode auto-detect /
Standard difficulty (silent default since Day 78) / Daily+Streak notifs
(post-Day 79) — all confirmed sane. No defaults changed. Added a code
comment in `audio.js` annotating the SFX/Music verdict so a future Prune
doesn't re-litigate.

**Polish items shipped:**

- **Overflow popover open animation** — Day 78's per-card `⋯` popover now
  fades+lifts in via the new `overflowPopIn` keyframe (180ms). Pure CSS;
  gated by `prefers-reduced-motion: reduce`.
- **Tier-staircase "newly revealed" pulse** — `applyProgressGating()` now
  diffs against `this._lastGatingState`; any IDs that flip hidden→visible
  on a re-gate get a one-shot `.newly-revealed` class (cyan glow pulse,
  1.2s). Cold-start (no prior state) suppresses the pulse so a fresh load
  doesn't strobe. JS strips the class after 1300ms. Verified: cross-L6
  pulses daily/encyclopedia/stats; class is gone after 1500ms.
- **`:focus-visible` rings** — added a unified cyan focus ring on
  `.level-btn`, `.level-overflow-btn`, popover menu items,
  `#open-settings-btn`, `.tool-gate`, `#how-to-play-btn`, `#run-btn`,
  `#back-btn`. `:focus-visible` only fires for keyboard nav, so mouse
  users keep their existing `:hover` styling. Light-mode variant uses a
  darker teal.
- **Welcome toast `prefers-reduced-motion`** — under reduced-motion the
  toast snaps in/out without the 0.4s slide animation.
- **Mobile overflow popover constraint** — at `max-width: 480px` the
  popover min-width drops from 132px to 116px and uses
  `right: max(6px, env(safe-area-inset-right))` so iPhone notch frames
  stay clear. Verified at 375 and 414 widths: popover stays inside the
  card; no horizontal scroll on any breakpoint.

**Verification:** 13 CDP assertions on localhost:8901 (build identity
unified, polish CSS keyframes present, popover lifecycle, focus ring
rule, gating diff state, cold-start no-pulse, g6/g9/g18 staircase
pulses, 1500ms timer strip, mobile 375/414/768/1024 popover containment
and no horizontal scroll, Day 78 5-cut regression intact, Day 79 dead
identifiers still `undefined`, L1 gameplay smoke). 0 console errors.



## Day 79 — Prune Week 2, Day 3 (Code Cleanup) summary

**Build under test:** `?v=1779638400`, `sw.js CACHE_NAME = 'signal-circuit-v54'`
**Result:** 0 new bugs, **−180 LOC** (target was ≥−100).

Removed (all callsites verified dead before deletion):

- **`ui.showFirstLaunchDifficultyModal`** — only caller was Day 78 Cut #5; silent-default replaced it.
- **`#weekly-puzzle-btn`** DOM node + `setupCompetitiveModes` click handler + `setVis` gating call + `.weekly-btn` CSS — Tournament subsumed it Day 72.
- **Weekly notification path** — `WEEKLY_NOTIF_KEY` const, `checkWeeklyNotification()`, `_getWeekNumber()`, `_showWeeklyToast()`, `#weekly-toast` CSS, `notif-weekly-btn` button + Settings entry.
- **`AchievementManager.{checkLightning, checkEclipseRun, checkArchitect, isMythic}`** — Day 71 added these wrappers but every mythic unlock fires inline at the real trigger site.
- **`InfiniteRunManager._showHud`** — never called; `_updateHud` handles display.
- **`InteractiveTutorial.getCurrentStep`** — never called.
- **Orphan CSS**: `#mute-btn` (3 rules — element never existed), `#gate-count-display` (2 rules — never rendered), dead light-mode selectors `.modal-content` / `#confirm-modal-box` / `#creator-content` / `#mastery-content` (wrong IDs; real ones are `#confirm-modal-content`, `#creator-config-content`, `#mastery-tree-content`), `#hint-penalty` from compound static-info selector.

**Verification:** 12 CDP checks + 3-test regression sweep, all pass, 0 console errors. End-game overflow count (40 ⋯) and Tier-2 staircase deltas (0/3/5/8/11/16) confirmed no Day 78 regression. Tournament + Settings→Difficulty chooser both still work after the trim.

## Day 78 — Prune Week 2, Day 2 (Design Simplification) summary

**Build under test:** `?v=1779552000`, `sw.js CACHE_NAME = 'signal-circuit-v53'`
**Result:** 0 new bugs, 5 Tier 1 cuts shipped from `PRUNE_REPORT.md`.

- **Cut #1 — Per-card overflow menu**: `👁 Solution` + `🏆 Gate Limit` collapsed into a single `⋯` corner button per completed card with a popover.
- **Cut #2 — Smooth Tier-2 reveal**: `applyProgressGating()` now uses 5 thresholds (g6/g9/g12/g15/g18) instead of two.
- **Cut #3 — Retire Puzzle of the Week**: Tournament fully subsumes it; `weekly-puzzle-btn` hidden at every tier.
- **Cut #4 — Drop L1 hint footer**: meta-rule footer hidden on levels 1–3 (no hints used yet); resurfaces from L4.
- **Cut #5 — Silent-default difficulty modal**: brand-new players auto-set to Standard + one-time toast; Settings → Difficulty Mode unchanged.

Net wins: end-game level-select drops 40 × 2 sub-buttons → 40 × 1 overflow button (−50% per-card visual weight), Tier-2 cliff replaced by a 3 → 5 → 8 → 11 → 16 staircase, two cold-start ceremonies removed (difficulty modal + L1 hint footer).

Live CDP verification (5 cut suites, multi-seed gating sweep, modal/toast lifecycle): 0 console errors.

## Day 76 — Harden Week 2, Day 4 (Fix Everything) summary

**Build under test:** `?v=1779465600`, `sw.js CACHE_NAME = 'signal-circuit-v52'`
**Result:** 0 open bugs at start of day, 0 open bugs at end. Day pivoted to closing the two verification-only learnings flagged on Day 75:

1. **`GameState.seedProgress(count, opts)`** — new dev/Harden helper on `js/main.js`. Synthetically marks levels 1..count as completed (with `_seeded:true` markers and configurable `stars` / `pureLogic` / `hardcore`) so future Harden harnesses can reach tier-gated UI (Tournament, Random Challenge, Adaptive, Infinite, Customize, Mastery Tree, …) without 18 manual completions. Non-destructive on real play. Returns a summary object for assertions.
2. **`runSimulation()` re-entry contract** — 7-line doc comment added directly above the existing `isAnimating` guard codifying the property Day 75 verified empirically: while a sim is in flight, additional invocations are no-ops; after completion the flag clears so subsequent clicks always start a fresh sim; no debounce beyond "one in flight at a time".

Live verification (12 assertions): build identity unified, seedProgress(18) reveals 13 tier3 buttons, cold start hides them all, non-destructive at lower stars, clear option wipes cleanly, Level 1 core loop unaffected, RUN-spam guard holds, 0 console errors.

Written up in `reviews/harden-cycle-2-week-summary.md`. Cycle 2 Harden Week closes one day early.


## Day 75 Edge & Stress Sweep — Cycle 2, Harden Day 3

**Build under test:** `?v=1779379200`, `sw.js CACHE_NAME = 'signal-circuit-v51'` (Day 74 Speedrun cleanup fix)
**Result:** 25/25 tests pass · 0 new bugs · 0 console errors

| # | Test | Result | Detail |
|---|------|--------|--------|
| T1 | Rapid gate placement during simulation | ✅ | 14 gates inserted mid-anim, no throws |
| T2 | Wire drawing while signal animation is playing | ✅ | wireManager.startWire mid-anim no-throw |
| T3 | 10 rapid `resize` events while on gameplay | ✅ | canvas 820×834 stable across all 10 |
| T4 | Tab-reachable focusable count on gameplay | ✅ | 15 focusables (back, shortcuts, encyclopedia, kb-wiring, panel-toggle, next-level…) |
| T5 | colorblind + light/dark mode class toggle | ✅ | both classes apply and revert |
| T6 | 25 gates + 20 wires perf | ✅ | 10× render = 13.9ms, **1.39ms avg frame** |
| T7 | localStorage capacity | ✅ | 50 × 50KB writes succeeded, no QuotaExceeded |
| T8 | Mode-switch storm (level-select ↔ daily/challenge/sandbox/tournament/infinite) | ✅ | always returns to `level-select` clean |
| T9 | Blitz + Speedrun HUD cleanup on Back (Day 61 + Day 74 regression) | ✅ | both `display:none`, mode flags `false`, timers cleared |
| T10 | RUN spam (10 rapid `runSimulation()` calls) | ✅ | 0 errors, animation completes |
| T11 | Quick Test spam (10 rapid `runQuickTest()` calls) | ✅ | 0 errors |
| T12 | Hint button spam | ✅ | hint count stays `≤ 3`, token system holds |
| T13 | Lab Bench entry (Level 36, Chapter 8 redesign) | ✅ | `isLabBench=true`, `#lab-hud` flex, RUN labeled '📐 Submit Blueprint', `_lab={attempts:0,max:3}` |
| T14 | Tournament screen open + close | ✅ | 3 tabs, 10 leaderboard rows, close resets `display:none` |
| T15 | Mythic celebration overlay (lazy-created) | ✅ | `ui.showMythicCelebration()` creates `#mythic-celebration` on demand, displays `flex` |
| T16 | Settings modal + 📲 Install App button | ✅ | `open-settings-btn` opens modal, install button present, close clean |
| T17 | Service worker controller activated | ✅ | `scriptURL=/sw.js`, `state=activated` |
| T18 | window blur/focus + visibilitychange cycle | ✅ | no throws |
| T19 | UI thrash — 15× `showLevelSelect()/startLevel(1)/showLevelSelect()` | ✅ | final screen `level-select`, gates clean |
| T20 | Undo/redo stress — 15 undos + 15 redos | ✅ | no throws, manager stable |
| T21 | Achievements modal sort (mythic-first) | ✅ | 54 rows; top 5 all `tier-mythic` |
| T22 | Build identity (cache-bust + SW version match) | ✅ | 11 `?v=` refs all `1779379200`, `CACHE_NAME=signal-circuit-v51` |
| T23 | localStorage clear (cold-start sim) | ✅ | 13 `signal*` keys removed, no residue |
| T24 | SW cache asset count | ✅ | `signal-circuit-v51` precache = 27 assets |
| T25 | Light-mode + colorblind paint stability on gameplay | ✅ | body bg = `rgb(245,243,235)`, canvas transparent |

**Console errors across all 25 tests:** 0 (only standard AudioContext autoplay warnings).

## Fixed (Recent)

### Day 74 — P2: Speedrun HUD Persists on Level Select ✅
- **Found:** Day 74 (Cycle 2 Harden Day 2). After entering Speedrun Mode and returning to the level select (e.g., via the Back button bypassing `stopSpeedrunMode()`), `#speedrun-hud` remained `display:flex` and `speedrunMode` stayed `true`.
- **Root cause:** Day 61 comment in `showLevelSelect()` claimed "Defensive Blitz/Speedrun HUD cleanup" but only the Blitz branch was wired. Speedrun was missed.
- **Fix:** Sibling defensive cleanup block added to `showLevelSelect()` (`js/main.js`) right below the Blitz cleanup. Clears `speedrunTimer` + `speedrunStart`, sets `speedrunMode=false`, hides `#speedrun-hud`.
- **Verified live:** Patched `showLevelSelect` injected into the running build cleared all three (mode flag, timer, HUD) on transition. Symmetric to the Day 61 Blitz fix.
- **Cache bust:** `index.html` `?v=1779379200`, `sw.js` `CACHE_NAME = 'signal-circuit-v51'`.

## Cosmetic / Minor Observations (Not Bugs)
- AudioContext warnings on page load (expected — resumes after first user gesture)
- Collection shows 4 of 6 completed levels (expected — only levels with saved preview data appear)
- Level 3 shows ★☆☆ in Review Suggested but ★★★🧠 on the card (review tracks worst score, card shows best — working as intended)
- Deprecated meta tag warning: `apple-mobile-web-app-capable` should be `mobile-web-app-capable` (cosmetic, non-breaking)

## Fixed (Recent)

### Audit Results — Day 73 (Harden Week 2, Day 1: Full Interaction Audit) — Cycle 2

**Build:** ?v=1779292800, sw v50 (Day 72 Weekly Tournament + Cycle Polish)

**Screens tested (all rendering, 0 console errors):**
- Level Select (tier-gated: cold start 2 buttons → tier3 reveals 18 nav buttons after 20 levels seeded)
- Gameplay Screen (Level 1 entry; truth table 4 rows; RUN / Quick Test / Hint / Clear / Prev / Next / Panel toggle / KB wiring / Back / Encyclopedia / Shortcuts — all visible)
- Settings Modal (14 buttons + SFX/Music sliders; 9 toggles flipped successfully: Colorblind, Text size, Simplified, Accessible Wiring, Light/Dark, Daily/Weekly/Streak notifications)
- Difficulty Mode button → opens nested confirm-modal with 3 options (Relaxed / Standard / Hardcore)
- How to Play modal (opens + closes cleanly)
- Daily Challenge screen (Back + ⚡ Start Today's Challenge); start → gameplay with isDaily=true
- Random Challenge screen (2 sliders: input-count, output-count; Generate / Push My Limits / Clear Scores); generate → isChallengeMode=true
- Tournament screen (3 tabs: This Week, My Best, Archive); archive shows 8 weeks with Play/Replay buttons; archive replay sets isTournament + isTournamentArchive=true
- Infinite Pre-Screen (Back + Start Run)
- Blitz Ladder (immediate gameplay entry; HUD does NOT persist after Back — Day 61 fix verified)
- Speedrun Mode (immediate gameplay entry; HUD does NOT persist after Back)
- Sandbox config screen (Back + Start Sandbox)
- Creator config screen (Back + Play Level + Share Link)
- Adaptive Challenge button → direct entry to gameplay-screen

**Modals tested (all rendering with content):**
- Gate Encyclopedia (rich content, gate symbols visible)
- Achievements (tier-sorted: 🌌 Mythic → 💎 Diamond → 🥇 Gold → 🥈 Silver → 🥉 Bronze; chase progress visible)
- Stats (3 charts render: chart-daily-playtime 480x140, chart-stars-over-time 480x140, chart-skill-progression 480x100)
- Customize (Wire Colors / Gate Skins / Board Themes sections with cosmetic-card preview swatches)
- Mastery Tree (5-tier grid: Basics → Combinations → Universal → etc. with mastery checkmarks for completed gates)
- Circuit Collection (empty state message for 0 saved levels — expected)
- Logic Profile (level count 14/29 · ⭐ 42/ — stats render)

**Console:**
- 0 JS errors across all paths
- Only AudioContext autoplay warnings (expected; resumes after user gesture)

**Day 61 fix regression checks (still in place):**
- Blitz HUD: 'none' on level-select after Blitz exit ✅
- Speedrun HUD: 'none' on level-select after Speedrun exit ✅ (bonus check)
- Daily Leaderboard: dedup logic in place
- Stats: _logSession filter in place

**Result: 0 new bugs. Audit pass.**

### Day 61 — Harden Week 1, Day 4: Fix Everything

**P2 — Blitz Mode Bar Persists on Level Select** ✅
- **Fix:** `showLevelSelect()` in `js/main.js` now defensively clears any active blitz timer, sets `blitzMode = false`, and hides `#blitz-hud` (`display: none`) on every transition into the level select screen.
- **Why it works:** The HUD is now torn down by the *destination* screen, not just the *source* mode's exit handler. Every navigation path into level select (Back button, programmatic `showLevelSelect()`, post-completion auto-return, mode-switch, etc.) is covered.

**P2 — Daily Leaderboard Duplicate Name** ✅
- **Fix:** `DailyLeaderboard.generatePseudoScores()` now tracks used names in a `Set`. On collision, it linearly probes forward through `DAILY_LB_NAMES`. If the entire 40-name pool is exhausted (last 10 of 50 entries), it appends `_<i>` as a deterministic fallback. Top 10 displayed entries are always unique.
- **Verified:** Headless test across 10 distinct date seeds (today, +1d, +5d, +30d, +90d, +180d, +365d, holidays): top-10 unique = 10/10 in every case; full 50-entry list also fully unique post-suffix.

**P2 — Stats: Empty Sessions Recorded** ✅
- **Fix:** Two-layer defense.
  1. `_logSession()` in `js/main.js` early-returns when `sessionLevels <= 0`, so future page-navigation-only sessions never get persisted.
  2. `renderStats()` in `js/ui.js` filters `s.levelsPlayed > 0` before rendering Recent Sessions, hiding any legacy 0-level rows already saved in localStorage.

**Cache bust:** `index.html` `?v=1777216661`, `sw.js` `CACHE_NAME = 'signal-circuit-v42'`.

### Earlier Audits

#### Audit Results — Day 60 (Harden Week 1, Day 3: Edge Cases & Stress)

13/13 stress tests passed (rapid gate placement, wire drawing during animation, window resize, localStorage clear, keyboard navigation, colorblind mode, light/dark mode, performance with many wires/gates, empty simulation, undo/redo, text size, blitz entry/exit, localStorage capacity). Console: 0 JS errors. No new bugs found; all 3 P2 bugs from Days 58–59 confirmed open going into Day 4.

#### Audit Results — Day 59 (Harden Week 1, Day 2: Level Playthrough)

Levels 1–5 played hands-on with truth tables verified and 3-star solves. All 40 truth tables programmatically validated (non-degenerate, correct row counts; spot-checked L7 XOR, L13 Half Adder, L15 Majority, L17 Full Adder, L25 Ripple Adder). All 5 challenge modes tested (Daily / Random / Blitz / Speedrun / Sandbox). Community level "The Implication" played successfully. Star/hint systems verified. 0 JS errors; new P2 bug (Blitz bar persistence) found.

#### Audit Results — Day 58 (Harden Week 1, Day 1: Interaction Audit)

All 20 screens tested and rendering correctly: Level Select, Gameplay (L1), Daily Challenge, Sandbox, Puzzle of the Week, Gate Encyclopedia, Achievements, Stats Dashboard, Customize, Mastery Tree, Circuit Collection, Logic Profile, How to Play, Light/Dark mode, Colorblind/Text Size/Simplified/Accessible Wiring/Difficulty buttons, Volume controls, Notification settings, Export/Import Progress, Review Suggested, Community Levels. 0 JS errors. 2 P2 bugs documented (Daily Leaderboard duplicate name, Stats empty sessions).
