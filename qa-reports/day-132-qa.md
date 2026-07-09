# Day 132 QA — Cycle 6 HARDEN Week Day 5: Regression Pass (DEPLOYED build)

**Date:** 2026-07-09 (Thu) · cycleDay 83 · Day 132
**Target:** https://mikedyan.github.io/signal-circuit/ (LIVE GitHub Pages)
**Build under test:** `?v=1783036800` · `sw.js CACHE_NAME = 'signal-circuit-v81'` (Day 127 artifact — unchanged the entire HARDEN week)
**Harness:** `qa-reports/day-132-qa.cdp.js` (cloned from day-117 deployed Regression Pass + day-131 Cycle-6 surface probes)
**Result:** **30/30 assertions passed on the FIRST run**; 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs; 0 harness self-bugs.

---

## Deployment confirmation

GitHub Pages has caught up to the pinned Day 127 artifact:
- Deployed `index.html` serves **11× `?v=1783036800`** (byte-matching local).
- Deployed `sw.js` `CACHE_NAME = 'signal-circuit-v81'`.

`git log` head = `Day 131` at run time; Pages served the Day 127 build bytes as expected (no code shipped Days 128–131, all HARDEN no-op days).

---

## Coverage (12 phases)

| Phase | Area | Assertions | Result |
|---|---|---|---|
| P1 | Deployed build identity (11× ?v=1783036800 + sw v81) | 2 | ✅ |
| P2 | Cold-start invariants (50 cards / 2 nav / ESM bindings / dead-ids) | 6 | ✅ |
| P3 | Core loop L1 (place AND + 3 wires + Quick Test + RUN + complete → 3★) | 2 | ✅ |
| P4 | Daily Challenge entry | 1 | ✅ |
| P5 | Random Challenge config | 1 | ✅ |
| P6 | Blitz immediate-start + HUD cleanup (Day 61) | 2 | ✅ |
| P7 | Speedrun immediate-start + HUD cleanup (Day 74) | 2 | ✅ |
| P8 | Sandbox config | 1 | ✅ |
| P9 | Tournament backend label (Day 108/125) — `🏠 Local leaderboard`, mode=local, isLive=false | 1 | ✅ |
| P10 | Adaptive/Infinite tier-gated entry (seed 18) | 1 | ✅ |
| P11 | Cycle 6 BUILD regression D123–D127 | 10 | ✅ |
| P12 | Console hygiene | 1 | ✅ |
| **Total** | | **30** | **30/30** |

---

## Cycle 6 BUILD regression sweep (P11, D123–D127) — all intact on deployed bytes

- **D123 (simulation.js ESM):** `game.simulation instanceof window.Simulation === true`; Day 42 prototype augmentations `traceFailurePath` + `detectConstantOutputs` present.
- **D124 (Profile-hub 5-tab merge):** hub opens; all 5 tabs (achievements/mastery/customize/collection/profile) switch to non-empty panes; close clears `#profile-view` to 0 chars (Day 54 lifecycle).
- **D125 (Tournament Worker settings):** connect → mode flips `local` → `cloud-ready` + URL persisted to `signal-circuit-tournament-worker-url`; clear → back to `local` + URL wiped.
- **D126 (onboarding A/B cohort):** baseline cohort resolved (`live` this run) ∈ {local,live}; install id `sc-o9qlfawloema4br8hnqx1ax9` persisted + matches localStorage; cohort + install id **stable across 3 reloads** (A/B never re-rolls).
- **D127 (Progress heatmap):** empty-state at 0 completed (no meta); partial 10 → `10 / 50 levels · ★ 30 / 150` + 11 cells with ≥1 lit; full 50 → `50 / 50 levels · ★ 150 / 150` + 11 cells complete.

Standing floor also confirmed on deployed: 50 level cards / 2 nav buttons (Day 78/109), Day 92/107/123 ESM bindings (Gate+8 GateTypes / Wire+WireManager / Simulation), LEVELS=50, Day 79 7 dead-ids undefined + `#weekly-puzzle-btn` absent.

---

## Bugs

| Severity | Found | Fixed | Open at end |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 0 | 0 | 0 |

Open Bugs queue empty at start and end. Empty-queue streak: **57 consecutive days** since Day 76. Latent observations: 0.

---

## Verdict

Deployed regression sweep **PASS**. GitHub Pages serves the Day 127 artifact; the full core loop + all 8 modes + all five Cycle 6 BUILD surfaces work end-to-end on the deployed bytes with a clean console. **Zero source-file changes** this HARDEN week (only tooling/QA/docs). This **closes Cycle 6 HARDEN Week** → Day 133 begins Cycle 6 PRUNE Week Day 1 (Fresh Eyes Audit).
