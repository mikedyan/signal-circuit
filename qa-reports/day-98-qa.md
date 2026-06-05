# Day 98 QA Report — Cycle 4 HARDEN Week Day 2: Level Playthrough

**Date:** Friday, June 5, 2026 (cycleDay 46, weekDay 2)
**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'`
**Source build:** Day 96 (Snapshot Cards Library Tab). No source files touched today.
**Harness:** `qa-reports/day-98-qa.cdp.js` (Node + raw CDP via `ws@8.20.0`)
**Browser:** Chrome for Testing 145.0.7632.6, headless, `--remote-debugging-port=9301`
**Server:** `python3 -m http.server 8901`

## Verdict

**121 / 121 assertions passed across 26 phases.**
**0** `console.error` · **0** `Runtime.exceptionThrown` · **0** new user-facing bugs.
**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **23 consecutive days** since Day 76).

## Coverage at a glance

| Surface | Phases | Assertions |
|---|---|---|
| Build identity (cache-bust + SW + ES module) | 1 | 3 |
| Cold-start sanity (45 cards + 2 non-level buttons) | 1 | 3 |
| Per-level audit (14 levels × ~5 checks) | 14 | 71 |
| Lab Bench HUD chip render (L41–L45) | 1 | 10 |
| `_validateLabConstraints()` semantics | 1 | 9 |
| Hands-on L1 solve + celebration | 1 | 3 |
| Daily / Random / Blitz / Speedrun + HUD cleanup | 4 | 8 |
| Community levels (4 picks via `buildCustomLevel`) | 1 | 4 |
| Cycle 4 BUILD regression sweep (D92/D93/D95/D96) | 1 | 4 |
| Hygiene (console.error tally) | 1 | 1 |
| **Total** | **26** | **121** ✅ |

D94 (Lab Bench II composite constraints) is fully exercised in the HUD chip phase + the validator phase rather than rolled into the BUILD-sweep phase.

## Levels sampled (14)

Campaign sweep: **L1, L5, L10, L15, L20, L25, L30, L35, L40**
Day 84 Lab Bench: **L41** Pure NAND Builder, **L42** Budgeted Selector (cap 4), **L43** Parity Mandate (XOR mandate)
Day 94 Lab Bench II composite: **L44** NAND-Only Half Adder (NAND-only + cap 6), **L45** XOR-Heavy Multiplexer (must include XOR + cap 5)

For every sampled level the harness verified:
- **Hints array length = 3** (every sampled level passed)
- **Truth table re-derives from semantics** via a pure-JS spec in the harness (e.g. `(a,b)=>[a&b]` for AND, `(a1,a0,b1,b0)=>` for the 2-bit ripple adder, `(a,b,c)=>[a^b^c]` for odd parity). Every row of every level's `truthTable` matched the derived value.
- **`calculateStars()` correctness** at three input gate counts:
  - 3 stars at `optimalGates`
  - 2 stars at `goodGates` (or 3 when `optimalGates === goodGates`, as on L1/L2/L3/L7/L35/L41)
  - 1 star above `goodGates + 5`
- **`isLabBench: true`** for L41–L45.

### Truth-table re-derivation notes

- **L1 AND** — `[0,0]→0, [0,1]→0, [1,0]→0, [1,1]→1` ✓
- **L5 NOR** — `[0,0]→1, [0,1]→0, [1,0]→0, [1,1]→0` ✓
- **L10 OR (from AND+NOT)** — `[0,0]→0, [0,1]→1, [1,0]→1, [1,1]→1` ✓
- **L15 Majority of 3** — `((a&b)|(b&c)|(a&c)) & 1` matches all 8 rows ✓
- **L20 2:1 MUX (A,B,S)** — `S ? B : A` matches all 8 rows ✓
- **L25 2-bit ripple adder** — `(a1*2+a0) + (b1*2+b0)` decomposed into Cout/S1/S0 matches all 16 rows ✓
- **L30 1:4 demux** — `D * one-hot(S1S0)` matches all 8 rows ✓
- **L35 Dark Gate** — XOR identity matches all 4 rows ✓
- **L40 Phase Shift** — base table is AND (Phase 1) ✓ (Phase 2 truth table lives on `level.phases[1]`, not exercised here — out of scope for HARDEN Day 2)
- **L41 AND from NAND** — `a & b` matches all 4 rows ✓
- **L42 2:1 MUX (S,A,B)** — `S ? B : A` matches all 8 rows ✓
- **L43 3-input odd parity** — `a^b^c` matches all 8 rows ✓
- **L44 Half adder (SUM, CARRY)** — `[a^b, a&b]` matches all 4 rows ✓
- **L45 2:1 MUX (S,A,B)** — `S ? B : A` matches all 8 rows ✓ (XOR-based shape, same truth table as L42)

## Lab Bench HUD chip render (L41–L45)

| Level | Chip 1 | Chip 2 |
|---|---|---|
| L41 | `🧱 NAND only — universal gate practice` | (hidden, single constraint) |
| L42 | `🎯 Hard cap: 4 gates` | (hidden, single constraint) |
| L43 | `✳️ Must include an XOR gate` | (hidden, single constraint) |
| L44 | `🧱 NAND only` | `🎯 Hard cap: 6 gates` |
| L45 | `✳️ Must include an XOR gate` | `🎯 Hard cap: 5 gates` |

All 10 chip-visibility assertions passed. The D94 composite-render path (`#lab-constraint` + `#lab-constraint-2` side-by-side) is verified on both L44 and L45.

## `_validateLabConstraints()` behavior (9/9 ✅)

Per-validator coverage:

- **L41** — NAND-only enforced via `availableGates` (toolbox-level). Validator surface here is empty; `availableGates === ['NAND']` confirmed instead. (See Lessons.)
- **L42** — 5 ANDs → `Submission rejected: 5 gates exceeds hard cap of 4.`
- **L43** — `[AND, OR]` (no XOR) → `Submission rejected: blueprint must include an XOR gate.`
- **L44 composite** —
  - 7 NANDs → `Submission rejected: 7 gates exceeds hard cap of 6.`
  - 7 ANDs → `Submission rejected: 7 gates exceeds hard cap of 6.` (cap violation only; NAND-only is toolbox-level)
  - 5 NANDs (optimal) → accept ✓
- **L45 composite** —
  - 6 gates with XOR → `Submission rejected: 6 gates exceeds hard cap of 5.`
  - `[AND, OR, NOT]` (no XOR) → `Submission rejected: blueprint must include an XOR gate.`
  - 3 gates including XOR (optimal shape `XOR/AND/XOR`) → accept ✓

L45 is the **only sampled level that exercises BOTH validator axes simultaneously** (`gateHardCap` + `mustIncludeGate`). L44's composite is `availableGates` (toolbox) + `gateHardCap` (validator), so only one validator axis fires on a rejection — that's by design.

## Hands-on L1 solve

Placed `AND` gate, drew 3 wires (A→pin0, B→pin1, AND→OUT), invoked `runQuickTest()`.

- Gates placed: 1, wires routed: 3 ✓
- `#star-display` visible after solve ✓
- `progress.levels[1].stars === 3` ✓ (3 stars at optimal gate count)

Note (not a bug): `runQuickTest()` does **not** increment `game.attempts` — that counter only fires in `runSimulation()` (the full animated RUN path) at `js/main.js:3744`, against `progress.levels[lvlId].attempts`. Day 97 had the same observation. The 3-star earned + visible star display together prove the completion path fired correctly.

## Mode entry + HUD cleanup (Day 61 / Day 74 regressions)

All 4 challenge modes were entered hands-on (via real button clicks) and exited via `#back-btn`:

- **Daily Challenge** — `#daily-challenge-btn` → pre-screen → `#start-daily-btn` → gameplay with `currentLevel.isDaily=true` ✓
- **Random Challenge** — `#random-challenge-btn` → config screen → `#generate-challenge-btn` → gameplay with `isChallengeMode=true` ✓
- **Blitz Mode** — gameplay+HUD visible, back-btn cleans `blitzMode=false` + `#blitz-hud display:none` ✓ (Day 61 fix still holds)
- **Speedrun Mode** — gameplay+HUD visible, back-btn cleans `speedrunMode=false` + `#speedrun-hud display:none` ✓ (Day 74 fix still holds)

## Community levels (Day 49 — `COMMUNITY_LEVELS`)

Four community picks loaded via the same `playCommunityLevel()` shape (`{n,i,o,t,g}` → `buildCustomLevel()` → `loadChallengeLevel()`):

| ID | Name | I/O | Table rows | Result |
|---|---|---|---|---|
| `community_1` | The Implication | 2/1 | 4 | ✓ loaded, gameplay visible |
| `community_5` | One Hot | 2/1 | 4 | ✓ loaded, gameplay visible |
| `community_8` | Majority Vote (featured) | 3/1 | 8 | ✓ loaded, gameplay visible |
| `community_11` | Half Adder Redux | 2/2 | 4 | ✓ loaded, gameplay visible (multi-output community level) |

`buildCustomLevel()` correctly produces `inputs`/`outputs` arrays with the right label counts (`A,B[,C]` → `OUT` or `Y0,Y1`) and a per-row `{inputs, outputs}` truth table.

## Cycle 4 BUILD regression sweep (D92/D93/D94/D95/D96)

| Day | Surface | Status |
|---|---|---|
| D92 | `window.Gate` (function), `window.GateTypes` (8 keys: AND/OR/NOT/XOR/NAND/NOR/MYSTERY/MYSTERY3), `window.IONode` + `window.roundRect` all `function` | ✅ |
| D93 | `RemoteTournamentAdapter` + `LocalTournamentAdapter` + `selectTournamentBackend` exposed; default mode `local` | ✅ |
| D94 | `#lab-constraint` + `#lab-constraint-2` chips render on L44/L45 with correct copy; composite validator rejects 7-NAND with `Submission rejected: 7 gates exceeds hard cap of 6.` | ✅ |
| D95 | `window.__onboardingExperiment.getVariant() === 'silent-standard'`, `reset` is `function` | ✅ |
| D96 | `getCardLibrary()` API present (cold count = 0; harness profile-clean), `#stats-tabs` / `#stats-tab-cards` scaffolding present | ✅ |

## Harness false alarms on first run (3)

Logged here per HARDEN-day convention; **none of these are app bugs**:

1. **`L41 rejects non-NAND gate` failed (ok:true, msg:'')** — `_validateLabConstraints()` only enforces `gateHardCap` + `mustIncludeGate`. NAND-only on L41 is enforced one layer earlier at the **toolbox** (`addGate()` doesn't gate on type, but the toolbox UI only renders the buttons in `level.availableGates`). Harness fix: assert `availableGates === ['NAND']` instead.
2. **`L44 composite rejects 7 ANDs (both NAND + cap violations surfaced)` failed (only cap surfaced)** — same root cause: NAND-only is toolbox-level, only `gateHardCap` is in the validator. So `L44` 7-ANDs validator-tests as a pure cap violation. Harness fix: drop the "NAND" reason expectation.
3. **`L1 completion overlay fires` failed (`#completion-overlay` null)** — wrong selector. The completion celebration paints `#star-display` (not `#completion-overlay`). Also, `runQuickTest` doesn't bump `game.attempts` (only `runSimulation` does, on `progress.levels[lvlId].attempts`). `starsEarned === 3` already proved completion fired. Harness fix: probe `#star-display` and drop the attempts assertion.

Second run: 121/121 ✅.

## Invariants intact

- **Cold-start non-level button count = 2** (Day 78 invariant, 23 days running)
- **45 level cards on cold start** (Day 94 added L44 + L45, indexed correctly by `renderLevelSelect`)
- **0 console errors / 0 uncaught exceptions** across full sweep (Day 75 hygiene target)
- **Day 61 / Day 74 HUD cleanups** still fire via `#back-btn` user-path
- **Day 92 ES module exports** all re-bound to `window`
- **Day 93 tournament adapter mode** defaults to `local`
- **D94 composite chip render** byte-stable on L44/L45
- **D95 onboarding readout** silent-standard variant on cold start
- **D96 Snapshot Cards Library Tab** present and badge format `📸 My Cards (N)` valid

## LO-1 (deferred)

Unchanged from Day 87. Direct `ui.showScreen('level-select')` bypasses Day 61/74 HUD cleanup, but no user-reachable path triggers it. Deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails.

## Outcome

**Cycle 4 HARDEN Week Day 2 complete.** No source-file changes. Cache-bust + SW pinned at the Day 96 build. Empty-queue streak now **23 consecutive days** since Day 76. Day 99 next: **HARDEN Week Day 3 — Edge Cases & Stress** (rapid gate placement during sim, wire drawing during animation, 10× resize, localStorage clear+reload, keyboard-only nav, colorblind+light/dark mode, performance with 25+ gates and 20+ wires, RUN spam, Quick Test spam, undo/redo stress, mode-switch storm).
