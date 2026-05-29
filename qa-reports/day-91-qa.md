# Day 91 QA Report — Cycle 3 HARDEN Week, Day 5 (Regression Pass)

**Date:** 2026-05-29
**Day:** 91 (cycleDay 39)
**Cycle:** 3 · HARDEN Week · Day 5 (Regression Pass)
**Build under test:** **deployed** `https://mikedyan.github.io/signal-circuit/` · `?v=1780156800` · `sw.js CACHE_NAME = 'signal-circuit-v60'`
**Harness:** `qa-reports/day-91-qa.cdp.js` (permissive headless Chromium 145 + raw CDP via `ws@8.20.0`)
**Result:** **44 / 44** assertions passed · **0** Runtime.exceptionThrown · **0** console.error · **0** new bugs

---

## Why this is the right shape for HARDEN Week Day 5

The Day 5 prompt asks for a **Regression Pass** on the **deployed** site once GitHub Pages has served the latest build. The Cycle 3 HARDEN week shipped no code changes (Days 87/88/89/90 all closed without touching source — the Day 86 build held), so the deployed v=1780156800 / sw v60 build is the same artifact verified at localhost on Days 87 (66 assertions), 88 (100 assertions), 89 (53 assertions), and 90 (23 assertions).

Today's job is to confirm the *live URL* still works end-to-end — the cache-bust unified at v=1780156800, the SW shipped at v60, the core loop runs, every mode opens, and the queue stays empty. We did **not** re-run the full Day 88 100-assertion playthrough or the Day 89 25-test stress sweep on the deployed site — those have been run on the unchanged artifact this week and re-running them would burn cycles without new signal. We picked one assertion per mode + the core loop + Day 78/79/84 regression markers + console hygiene.

This shape matches the Cycle 1 (Day 62) and Cycle 2 (folded into Day 76) regression-pass precedents.

---

## Phase-by-phase

### P1 — Build identity on deployed site (4 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P1.a | Deployed host | `mikedyan.github.io` | ✅ `mikedyan.github.io` |
| P1.b | Cache-bust ref count | 11 | ✅ 11 |
| P1.c | Unified version | `?v=1780156800` | ✅ `["1780156800"]` |
| P1.d | SW deployed with `CACHE_NAME=signal-circuit-v60` | true | ✅ true (fetched `sw.js`, body contains the v60 string) |

**Note on P1.d:** On a permissive-CORS headless profile the SW registration race-conditions against the first navigation (controller is null on first hit until the SW activates, even though it's registered). We sidestepped the race by fetching `sw.js` directly via the page's `fetch()` and grepping for the version string. This is a *more reliable* identity check than `navigator.serviceWorker.getRegistration().active` on first load.

### P2 — Cold-start surface (5 assertions)

| # | Check | Expected | Got |
|---|-------|----------|-----|
| P2.a | `level-select-screen` visible | true | ✅ |
| P2.b | Non-level buttons | 2 (`how-to-play-btn`, `open-settings-btn`) | ✅ 2 |
| P2.c | Level cards | 43 (Day 84: 40 campaign + 3 Lab Bench II) | ✅ 43 |
| P2.d | Onboarding variant | `silent-standard` | ✅ |
| P2.e | Difficulty (silent-default) | `standard` | ✅ |

**Note:** Headless profile reuse means localStorage persists across CDP sessions. The harness explicitly wipes all `signal*` keys + reloads before P2 so cold-start checks are real.

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

### P10 — Tournament Mode (5 assertions, Day 72 + Day 83)

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
| P13.a | Nav buttons at `seedProgress(40, {stars:3})` | 18 | ✅ 18 |
| P13.b | Overflow buttons at end-game | 40 | ✅ 40 |

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
- Latent observations: 1 (LO-1) — deferred to **Cycle 4 PRUNE Week** as documented in BUGS.md.

## Files changed today

| File | Reason |
|------|--------|
| `qa-reports/day-91-qa.cdp.js` | New regression harness (44 assertions, 14 phases) |
| `qa-reports/day-91-qa.md` | This report |
| `reviews/harden-cycle-3-week-summary.md` | Cycle 3 HARDEN Week wrap |
| `BUGS.md` | Day 91 summary appended |
| `LESSONS_LEARNED.md` | Day 91 lessons appended |
| `FACTORY_STATE.json` | cycleDay 38→39, weekDay 4→5, lastCompletedDay 90→91, cycle pointer rolled to Cycle 4 BUILD Day 1 |

**No source-file changes.** Cache-bust stays `?v=1780156800`, SW stays `signal-circuit-v60`. (Day 86 build identity holds through the entire HARDEN week — 242 assertions across 4 days + today's 44 = **286 total HARDEN-week assertions on the same unchanged artifact**.)

---

## Closing

Cycle 3 HARDEN Week ends clean. **Zero new user-facing bugs** across 5 days. **Two-cycle empty-queue streak** confirmed (Cycle 2 also closed clean). The harness has likely converged on its own greatest hits — Cycle 4 HARDEN should rotate coverage onto less-trodden surfaces (sandbox-mode deep play, community-level loader edge cases, audio-engine state transitions across mode switches — these are flagged in the Cycle 3 wrap as Cycle 4 candidates).

Day 92 begins **Cycle 4 BUILD Week** on Monday — Day 1 deliverable is `roadmaps/cycle-4-build.md` plus the first feature.
