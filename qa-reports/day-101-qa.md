# Day 101 QA Report — Cycle 4 HARDEN Week, Day 5 (Regression Pass)

**Date:** 2026-06-08
**Day:** 101 (cycleDay 49)
**Cycle:** 4 · HARDEN Week · Day 5 (Regression Pass)
**Build under test:** **deployed** `https://mikedyan.github.io/signal-circuit/` · `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'`
**Harness:** `qa-reports/day-101-qa.cdp.js` (permissive headless Chromium 146 + raw CDP via `ws@8.20.0`)
**Result:** **44 / 44** assertions passed · **0** Runtime.exceptionThrown · **0** console.error · **0** new bugs

---

## Why this is the right shape for HARDEN Week Day 5

The Day 5 prompt asks for a **Regression Pass** on the **deployed** site once GitHub Pages has served the latest build. The Cycle 4 HARDEN week shipped no code changes (Days 97/98/99/100 all closed without touching source — the Day 96 build held), so the deployed `?v=1780617600` / `sw v65` build is the same artifact verified at localhost on Days 97 (82 assertions), 98 (121 assertions), 99 (77 assertions), and 100 (39 assertions).

Today's job is to confirm the *live URL* still works end-to-end — the cache-bust unified at `?v=1780617600`, the SW shipped at v65, the core loop runs, every mode opens, and the queue stays empty. We did **not** re-run the full Day 98 121-assertion playthrough or the Day 99 30-phase stress sweep on the deployed site — those have been run on the unchanged artifact this week and re-running them would burn cycles without new signal. We picked one assertion per mode + the core loop + Day 78/79/84 regression markers + Day 83/93 Tournament adapter shape + console hygiene.

This shape mirrors the Day 91 (Cycle 3) regression-pass precedent verbatim, with three constants swapped (cache-bust v60→v65, card count 43→45 post-Day-94, end-game seed 40→45).

---

## Phase-by-phase

### P1 — Build identity on deployed site (4 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P1.a | Deployed host | `mikedyan.github.io` | ✅ `mikedyan.github.io` |
| P1.b | Cache-bust ref count | 11 | ✅ 11 |
| P1.c | Unified version | `?v=1780617600` | ✅ `["1780617600"]` |
| P1.d | SW deployed with `CACHE_NAME=signal-circuit-v65` | true | ✅ true (fetched `sw.js`, body contains the v65 string) |

**Note on P1.d:** Day 91's race-around-SW-controller pattern transplants verbatim — fetching `sw.js` directly via the page's `fetch()` and grepping for the version string is the reliable cross-cycle identity check. The Day 91 trick is now a reusable HARDEN-Friday primitive.

### P2 — Cold-start surface (5 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P2.a | `level-select-screen` visible | true | ✅ |
| P2.b | Non-level buttons | 2 (`how-to-play-btn`, `open-settings-btn`) | ✅ 2 |
| P2.c | Level cards | 45 (Day 94: 40 campaign + 3 Lab Bench II + 2 composite) | ✅ 45 |
| P2.d | Onboarding variant | `silent-standard` | ✅ |
| P2.e | Difficulty (silent-default) | `standard` | ✅ |

The 2-button cold-start invariant from Day 78 now holds at **24 consecutive days** (Day 78 → Day 101). The +2 cards vs Day 91 (43 → 45) reflect Day 94's L44 + L45 composite-constraint additions; Day 97's full audit verified the cards render and load correctly.

### P3 — Core loop end-to-end on Level 1 (7 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P3.a | Gameplay screen visible on L1 entry | true | ✅ |
| P3.b | RUN button visible | true | ✅ |
| P3.c | Truth-table rows (2-input AND) | 4 | ✅ 4 |
| P3.d | AND gate placed via `gs.addGate('AND', 400, 300)` | 1 | ✅ 1 |
| P3.e | Wires drawn via `gs.addWireFromData(...)` × 3 | 3 | ✅ 3 |
| P3.f | L1 progress recorded after `runQuickTest()` | true | ✅ |
| P3.g | L1 star rating | ≥ 1 | ✅ 3 (optimal) |

This is the full "load level → place gate → draw wires → run sim → complete level" pipeline from the prompt. On the deployed build, an end-to-end solve of L1 with the optimal 1-gate circuit fires completion, persists `{stars:3}`, and unlocks Level 2.

### P4 — Campaign mode progression (2 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P4.a | L2 unlocked after L1 solve | unlocked | ✅ |
| P4.b | L2 loads on gameplay screen, `currentLevel.id === 2` | true | ✅ |

### P5 — Daily Challenge (2 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P5.a | `#daily-challenge-btn` opens `daily-config-screen` | true | ✅ |
| P5.b | `#start-daily-btn` loads gameplay with `currentLevel.isDaily === true` | true | ✅ |

### P6 — Random Challenge (2 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P6.a | `#random-challenge-btn` opens `challenge-config-screen` | true | ✅ |
| P6.b | `#generate-challenge-btn` loads gameplay with `isChallengeMode === true` | true | ✅ |

### P7 — Blitz Mode (3 assertions, Day 61 fix re-verified)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P7.a | `#blitz-mode-btn` enters Blitz (`blitzMode === true`) | true | ✅ |
| P7.b | `#blitz-hud` `display=flex` during mode | not 'none' | ✅ `flex` |
| P7.c | **Day 61 fix** — `gs.showLevelSelect()` cleans HUD (`blitzMode=false`, hud `display=none`) | true | ✅ |

### P8 — Speedrun Mode (3 assertions, Day 74 fix re-verified)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P8.a | `#speedrun-btn` enters Speedrun (`speedrunMode === true`) | true | ✅ |
| P8.b | `#speedrun-hud` `display=flex` during mode | not 'none' | ✅ `flex` |
| P8.c | **Day 74 fix** — `gs.showLevelSelect()` cleans HUD (`speedrunMode=false`, hud `display=none`) | true | ✅ |

### P9 — Sandbox Mode (1 assertion)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P9.a | `#sandbox-btn` opens `sandbox-config-screen` | true | ✅ |

### P10 — Tournament Mode (5 assertions, Day 72 + Day 83 + Day 93)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P10.a | `#tournament-btn` opens `tournament-screen` | true | ✅ |
| P10.b | Tab count (This Week / My Best / Archive) | 3 | ✅ 3 |
| P10.c | **Day 83 adapter shape** — `tournamentBackend.{getMode,describe,isLive}` all functions | true | ✅ |
| P10.d | `tournamentBackend.getMode()` | `'local'` | ✅ |
| P10.e | `#tournament-mode-label` populated | `🏠 Local leaderboard · …` | ✅ |

### P11 — Infinite Mode (2 assertions, Day 68)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P11.a | `#infinite-mode-btn` opens `infinite-pre-screen` | true | ✅ |
| P11.b | `#infinite-start-btn` loads gameplay with `infiniteRun.active === true` | true | ✅ |

### P12 — Lab Bench II L42 (4 assertions, Day 84)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P12.a | L42 `gateHardCap` | 4 | ✅ 4 |
| P12.b | L42 `labConstraint` text matches `Hard cap.*4` | true | ✅ `🎯 Hard cap: 4 gates` |
| P12.c | `_validateLabConstraints()` rejects 5 gates | `{ok:false, message:'Submission rejected: 5 gates exceeds hard cap of 4.'}` | ✅ |
| P12.d | `_validateLabConstraints()` accepts 4 gates | `{ok:true}` | ✅ |

### P13 — Day 78 end-game staircase (2 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P13.a | Nav buttons at `seedProgress(45, {stars:3})` | 18 | ✅ 18 |
| P13.b | Overflow buttons at end-game | 45 | ✅ 45 |

### P14 — Console hygiene (2 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P14.a | `Runtime.exceptionThrown` events | 0 | ✅ 0 |
| P14.b | `console.error` calls | 0 | ✅ 0 |

(AudioContext autoplay warnings filtered — they are warnings, not errors, and only fire pre-user-gesture.)

---

## All 8 modes confirmed working on the deployed build

| Mode | Entry point | Probe |
|------|-------------|-------|
| Campaign | level-card click → gameplay | P3, P4 |
| Daily Challenge | `#daily-challenge-btn` → `daily-config-screen` → `#start-daily-btn` | P5 |
| Random Challenge | `#random-challenge-btn` → `challenge-config-screen` → `#generate-challenge-btn` | P6 |
| Blitz | `#blitz-mode-btn` → gameplay (HUD) | P7 |
| Speedrun | `#speedrun-btn` → gameplay (HUD) | P8 |
| Sandbox | `#sandbox-btn` → `sandbox-config-screen` | P9 |
| Tournament | `#tournament-btn` → `tournament-screen` (3 tabs) | P10 |
| Infinite | `#infinite-mode-btn` → `infinite-pre-screen` → `#infinite-start-btn` | P11 |

---

## Open Bugs queue

- **Start of day:** 0
- **End of day:** 0
- Latent observations: 1 (LO-1) — deferred to **Cycle 4 PRUNE Week** (starts tomorrow, Day 102) as documented in BUGS.md and per `roadmaps/cycle-4-build.md § Week Guardrails`.

## Files changed today

| File | Reason |
|------|--------|
| `qa-reports/day-101-qa.cdp.js` | New regression harness (44 assertions, 14 phases) |
| `qa-reports/day-101-qa.md` | This report |
| `reviews/harden-cycle-4-week-summary.md` | Cycle 4 HARDEN Week wrap |
| `BUGS.md` | Day 101 summary appended |
| `LESSONS_LEARNED.md` | Day 101 lessons appended |
| `FACTORY_STATE.json` | cycleDay 48→49, weekDay 4→5, lastCompletedDay 100→101, cycle pointer rolled to Cycle 4 PRUNE Day 1 |

**No source-file changes.** Cache-bust stays `?v=1780617600`, SW stays `signal-circuit-v65`. (Day 96 build identity holds through the entire HARDEN week — 319 assertions across 4 days + today's 44 = **363 total HARDEN-week assertions on the same unchanged artifact**.)

---

## Closing

Cycle 4 HARDEN Week ends clean. **Zero new user-facing bugs** across 5 days. **Three-cycle empty-queue streak** confirmed (Cycle 2 closed clean on Day 76, Cycle 3 closed clean on Day 91, Cycle 4 closes clean today). The Open Bugs queue is now empty for **26 consecutive days** (since Day 76). LO-1 remains the only latent observation in the project, tagged for tomorrow's PRUNE Week Day 1.

Day 102 begins **Cycle 4 PRUNE Week** — Day 1 deliverable is `PRUNE_REPORT.md` (Fresh Eyes Audit) plus the LO-1 fix scoped onto the Tier 1 cut list. The deployed `?v=1780617600` / `sw v65` build will finally see its first source-file change since Day 96.
