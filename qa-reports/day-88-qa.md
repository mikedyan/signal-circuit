# Day 88 — Cycle 3 HARDEN Week, Day 2: Level Playthrough

**Date:** 2026-05-26 (Tuesday)
**Cycle / Week / Day:** Cycle 3 · HARDEN Week · Day 2
**cycleDay:** 36
**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (unchanged from Day 86/87)
**Result:** **100 / 100** assertions passed. **0** console errors. **0** new user-facing bugs found.
**Harness:** `qa-reports/day-88-qa.cdp.js` (CDP via `ws@8.20.0`, headless `chrome-for-testing` on `:9301`, local server on `:8901`)
**No code changed today** — cache-bust + SW version intentionally NOT bumped (Day 86 + Day 87 precedent: only bump on real change).

---

## Scope

Per HARDEN Week Tuesday spec: **sample-play levels 1, 5, 10, 15, 20, 25, 30, 35, 40 + Day 84 additions 41, 42, 43.** For each, verify truth table correctness, hint shape, star-rating computation, completion path. Also exercise each mode entry/exit (Daily, Random, Blitz, Speedrun, Sandbox) and load 4 community levels.

No new features today (HARDEN policy). Only test and document.

---

## Assertion Matrix (13 phases / 100 assertions)

### Phase 1 — Build identity (2/2)
- 11 cache-bust refs at `?v=1780156800` (matches Day 86/87)
- `sw.js CACHE_NAME = 'signal-circuit-v60'`

### Phase 2 — Pre-state (1/1)
- `window.game.difficultyMode === 'standard'` (silent-default from Day 78 #5 / Day 85 onboarding experiment)

### Phase 3 — Per-level static validation (72/72 — 6 per level × 12 levels)

For each level (1, 5, 10, 15, 20, 25, 30, 35, 40, 41, 42, 43):

1. `getLevel(N)` resolves to a level object with title
2. Truth table matches the level's documented semantics (re-derived in harness from logic spec):
   - **L1** AND: 4 rows ✓
   - **L5** NOR: 4 rows ✓
   - **L10** OR: 4 rows ✓
   - **L15** Majority-of-3: 8 rows ✓
   - **L20** 2:1 MUX (A,B,S): 8 rows ✓
   - **L25** 2-bit ripple adder (A1,A0,B1,B0)→(Cout,S1,S0): 16 rows ✓
   - **L30** 1-to-4 demux (D,S1,S0)→(Y0,Y1,Y2,Y3): 8 rows ✓
   - **L35** Dark Gate (XOR): 4 rows ✓
   - **L40** Phase-shift AND (Phase 1): 4 rows ✓
   - **L41** AND via NAND-only: 4 rows ✓
   - **L42** 2:1 MUX (S,A,B): 8 rows ✓
   - **L43** 3-input XOR (parity): 8 rows ✓
3. `hints[].length === 3`
4. `calculateStars(opt, lvl) === 3`
5. `calculateStars(good, lvl) ≤ 2`
6. `calculateStars(good + 5, lvl) === 1`

### Phase 4 — Live L1 + hint button consumption (4/4)
- `startLevel(1)` activates `gameplay-screen`
- `#hint-btn` present in DOM
- `game.hintsUsed === 0` at start
- After `#hint-btn` click, `game.hintsUsed === 1` (token consumed, hint surfaced)

### Phase 5 — completeLevel persistence (2/2)
- `completeLevel(1, lvl.optimalGates)` records `{ completed:true, stars:3, bestGateCount:1, … }`
- Stars ≥ 3 (optimal gate count earns full stars)

### Phase 6 — Daily Challenge (4/4)
- `#daily-challenge-btn` click → `daily-config-screen` active
- `#start-daily-btn` present
- `#start-daily-btn` click → `gameplay-screen` with `game.currentLevel.isDaily === true`
- `#back-btn` returns to `level-select-screen` cleanly

### Phase 7 — Random Challenge (2/2)
- After seeding 18 levels via `GameState.seedProgress(18,{stars:3})`, `#random-challenge-btn` opens `challenge-config-screen`
- `#generate-challenge-btn` → `gameplay-screen` with `game.isChallengeMode === true`

### Phase 8 — Blitz Mode (2/2)
- `#blitz-mode-btn` → `gameplay-screen` + `game.blitzMode === true` + `#blitz-hud` visible
- `#back-btn` cleanup: `blitzMode=false`, HUD `display:none`, screen back to level-select (**Day 61 fix intact**)

### Phase 9 — Speedrun Mode (2/2)
- `#speedrun-btn` → `gameplay-screen` + `game.speedrunMode === true` + `#speedrun-hud` visible
- `#back-btn` cleanup: `speedrunMode=false`, HUD `display:none`, timer cleared, screen back to level-select (**Day 74 fix intact**)

### Phase 10 — Sandbox (1/1)
- `#sandbox-btn` opens `sandbox-config-screen`

### Phase 11 — Community Levels (4/4)
For each of `community_1` (The Implication), `community_2` (Inverted AND), `community_3` (Either But Not A), `community_4` (Always Agree):
- `ui.playCommunityLevel(id)` → `gameplay-screen` with `currentLevel.id === id`, `isCommunityLevel === true`, non-empty truth table, non-empty `availableGates`
- `#back-btn` returns to level-select

### Phase 12 — Lab Bench II (Day 84 regression) (3/3)
- **L41** `availableGates === ['NAND']`, `#lab-constraint` text includes "NAND"
- **L42** `gateHardCap === 4`, `#lab-constraint` text includes "Hard cap"
- **L43** `mustIncludeGate === ['XOR']`, `#lab-constraint` text includes "XOR"

### Phase 13 — Console error tally (1/1)
- 0 `Runtime.exceptionThrown`, 0 `console.error` across the entire suite

---

## Findings

**0 new user-facing bugs.** All 12 sampled levels load cleanly, all 12 truth tables match their documented semantics, the hint button consumes tokens and increments `hintsUsed`, `calculateStars()` returns the expected tiering at the three sampled gate counts, and the completion path records progress with optimal stars.

All five modes (Daily, Random, Blitz, Speedrun, Sandbox) enter and exit cleanly. The Day 61 (Blitz HUD) and Day 74 (Speedrun HUD) defensive cleanup blocks both hold under live `#back-btn` clicks.

All four sampled community levels load via `ui.playCommunityLevel()` → `buildCustomLevel()` → gameplay entry with `isCommunityLevel=true`.

The Day 84 Lab Bench II constraints (NAND-only, hard cap 4, mustInclude XOR) all surface their amber `#lab-constraint` chip with the expected text.

**No code changed today** — Day 87 precedent applies (HARDEN audit days are read-only; cache-bust and SW version stay pinned).

---

## Open Bugs Queue (post-Day 88)

**Empty.** Same as Day 87.

The single latent observation from Day 87 (**LO-1**: direct `ui.showScreen('level-select')` bypasses Day 61+74 HUD cleanup) remains documented in BUGS.md and deferred to a future Polish week. Day 88 explicitly re-verified the user-facing `#back-btn` path for both Blitz and Speedrun — both cleanups hold.

---

## Methodology Notes

- **Truth-table semantic check:** rather than trust `levels.js` is consistent with its own descriptions, the harness re-derives the expected truth table from each level's *stated semantics* (AND, NOR, OR, Majority, MUX2, 2-bit ripple adder, 1-to-4 demux, XOR, parity-XOR3) in pure JavaScript and compares row-by-row. This catches any silent drift where someone might edit a level description but forget to update the table.
- **`startLevel()` vs `loadLevel()`:** `loadLevel(N)` only updates `currentLevel` + draws the level on canvas — it does NOT transition screens. Use `startLevel(N)` to actually navigate to `gameplay-screen` from the QA harness. (Day 88 lesson logged.)
- **`getDifficultyMode()` doesn't exist on GameState** — read `game.difficultyMode` directly. (Day 88 lesson logged.)
- **Screen-active class is `.screen-active`**, not `.active`. Pin this for future harness writers — Day 87 used the right selector, but a refactored Day 88 harness slipped into `.active` and silently returned `undefined` everywhere until the first failure surfaced. (Day 88 lesson logged.)
- **Daily start button id is `#start-daily-btn`**, not `#daily-start-btn`. Symmetric drift: `#speedrun-btn`, not `#speedrun-mode-btn`. (Day 88 lesson logged.)
- **localStorage reset at harness start:** since the chrome-for-testing profile persists across runs (`--user-data-dir=/tmp/sc-cdp-profile`), reset all `signal*` keys before navigation. Otherwise the hint-token state from a previous run can deplete the budget and make Phase 4 flaky. (Day 88 lesson logged.)

---

## Files Produced Today

- `qa-reports/day-88-qa.md` (this file)
- `qa-reports/day-88-qa.cdp.js` (the harness, ~300 LOC)
- BUGS.md (Day 88 audit summary appended)
- LESSONS_LEARNED.md (6 new Day 88 lessons)
- FACTORY_STATE.json (cycleDay 36, weekDay 2, Day 88 entry)
