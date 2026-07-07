# Day 130 QA — Cycle 6 HARDEN Week Day 3: Edge Cases & Stress

**Date:** 2026-07-07 · **cycleDay 81 · Day 130**
**Build under test:** Day 127 artifact — `?v=1783036800` / `sw signal-circuit-v81` / 50 level cards (unchanged; HARDEN policy = ZERO new features).
**Harness:** `qa-reports/day-130-qa.cdp.js` (pure-CDP, ws@8.x). Launcher `tools/cdp-launch.sh`.
**Result:** **36/36 assertions across 18 phases on the FIRST run.** 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs; 0 harness self-bugs.

## What ran

Cloned the Day 115 (Cycle 5) Edge Cases & Stress sweep and layered in the four Cycle 6 BUILD surfaces flagged in the FACTORY_STATE nextCycle plan.

### Classic stress sweep (T1–T10)
- **T1** 25× gate placement during a live simulation → no throw (25 gates).
- **T2** 10× wire push while `isAnimating=true` → no throw (10 wires).
- **T3** 10× window resize mid-gameplay (320→1920 widths) → renders clean, gameplay screen intact.
- **T4** clear localStorage + reload → 50 cards, difficulty silent-default `standard`.
- **T5** keyboard-only nav → 14 focusable elements, programmatic focus lands.
- **T6** colorblind toggle on→off round-trip → wire colors resolve, no throw.
- **T7** light/dark mode round-trip → both render, class round-trips.
- **T8** 44 wires / 22 gates → **0.74ms avg frame** (10-frame render loop), well under the 16ms budget.
- **T9** 20× undo + 20× redo → no throw.
- **T10** 10× RUN + 10× Quick Test spam → no throw (idempotent re-entry).

### Cycle 6 BUILD-surface stress (S1–S4)
- **S1 — Day 124 Profile-hub storm:** 8 rounds of open → hammer all 5 tabs ×2 → close. Hub reopened every round (opens===8), final close clean, `#profile-view` cleared to 0 chars (Day 54 discipline). No throw.
- **S2 — Day 127 Progress heatmap seed/reset churn:** 8-round seed sequence `[0,25,3,50,0,12,50,0]` with `_renderProgressHeatmap()` re-invoked each round. `_progressCompletedTotal()` tracked the seed exactly every round; empty-state shown at 0, 11 chapter cells shown when populated. No throw.
- **S3 — Day 125 Tournament settings churn:** 6 rounds of connect (worker URL + opt-in name) → clear. Every round: connect flipped backend off pure-local (mode `cloud-ready`) + persisted URL; clear reverted to `local` + wiped URL and display name. No throw.
- **S4 — Day 126 cohort determinism:** cold reload minted a stable install id (`sc-xjub691kxry9ratc4kd1p8ktst`), cohort `local`. 4× reload without clearing storage → cohort + install id byte-identical every time (A/B never re-rolls); `daysActive` numeric each reload. `?cohort=live` URL override forced + resolved correctly.

### Standing regression floor
- **Cold-start:** 50 level cards, 2 non-level nav buttons (Day 78), Day 79 7 dead-ids undefined + `#weekly-puzzle-btn` absent.
- **ESM bindings:** Day 92 `window.Gate`+8 GateTypes, Day 107 `window.Wire`/`WireManager`, Day 123 `window.Simulation` + `game.simulation instanceof window.Simulation`.
- **BUILD sweep:** D108/125 tournament default mode=local, D109 L48 lab (maxFanOut=2/hardCap=3), D127 heatmap render fns present, D126 cohort instrumentation present.

## Bug ledger
- Open Bugs: **0 → 0** (55-day empty-queue streak since Day 76).
- Latent observations: **0 → 0**.
- New bugs: **0**.

## Coverage note
Addressed the recurring coverage-rotation concern (flagged Days 89/117) by running all four Cycle 6 BUILD surfaces under *churn/storm* conditions rather than single-shot structural checks — Profile-hub reopen storm, heatmap seed/reset churn, tournament connect/clear churn, and cohort determinism across reloads. All held.

**Day 131 next:** Cycle 6 HARDEN Week Day 4 — Fix Everything (open queue empty at start; Day 90/100/116 rest-day confirmation-probe precedent likely applies).
