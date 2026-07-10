# Day 133 QA — Cycle 6 PRUNE Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-07-10 (Friday) · cycleDay 84 · Day 133
**Build under audit:** deployed `https://mikedyan.github.io/signal-circuit/` · `?v=1783036800` · `sw.js CACHE_NAME = 'signal-circuit-v81'` (Day 127 artifact, unchanged through Cycle 6 HARDEN week).
**Harness:** `qa-reports/day-133-qa.cdp.js` (cloned from Day 118 Cycle 5 Fresh Eyes Audit, re-aimed at Cycle 6 surfaces).
**Result:** **37 / 37 assertions** across 9 phases. **0** console.error. **0** `Runtime.exceptionThrown`.

## First-run self-bugs (2, both harness-side, 0 app changes)

- **P4.d** probed `#tournament-connect-btn` / `#tournament-worker-url` / `#tournament-display-name` — the real ids are `#tournament-worker-save-btn` (🔌 Connect), `#tournament-worker-url-input`, `#tournament-display-name-input`, inside `#settings-tournament-section`. The Day 125 surface was present all along (section header "Tournament (Online)" + 4 buttons rendered in the settings labels dump). Fixed harness-side.
- **P8.a** probed `game.getCohort()` — the Day 126 accessor is `window.__onboardingExperiment.getCohort()` (or `game.onboardingExperiment.getCohort()`); the direct `game.getCohort` alias doesn't exist. Fixed harness-side; cohort resolves to `live`.

Same class as the recurring "harness over-assumed shape, app was correct" self-bugs (Days 97/98/108/115/117/122/125/131).

## Tier staircase (deployed, live `seedProgress`)

```
seed= 0 → nav= 2  overflow= 0  cards=50   (cold start)
seed= 3 → nav= 2  overflow= 3  cards=50
seed= 6 → nav= 5  overflow= 6  cards=50
seed=12 → nav= 9  overflow=12  cards=50
seed=18 → nav=14  overflow=18  cards=50
seed=50 → nav=14  overflow=50  cards=50   (end-game)
```

**End-game nav 18 → 14** via the Day 124 Profile-hub merge — the headline finding. Tier-2 mid also dropped 10 → 9.

## Coverage (9 phases / 37 assertions)

- **P1 (4):** Build identity — deployed host, 11 cache-bust refs unified at `?v=1783036800`, sw v81.
- **P2 (5):** Cold-start — level-select visible, 2 nav buttons, 50 cards, 0 overflow, silent-default difficulty `standard`.
- **P3 (10):** Tier staircase 0/3/6/12/18/50 — overflow rises 1:1 with completions; **P3.i asserts end-game nav === 14 (Day 124 merge)**; cards hold at 50.
- **P4 (4):** Settings modal — 17 buttons, 2 sliders, 7 sections incl. `Tournament (Online)`; Developer hidden by default (Day 126 cohort readout NOT leaked); Day 125 connect surface (section + save-btn + url-input + name-input) present.
- **P5 (5):** Stats tabs — **new player sees exactly 1 visible tab (📊 Overview)**; after 10 completions the Day 127 `📈 Progress` heatmap reveals (11 chapter cells, summary `10 / 50 levels · ★ 30 / 150 · …`).
- **P6 (3):** Day 124 Profile hub — 5 old collection buttons removed, single `🗂️ Profile` button visible, hub opens with 5 tabs (Achievements/Mastery/Customize/Collection/Logic).
- **P7 (3):** Structural regressions — Day 123 simulation.js ES module + `window.Simulation` binding; Day 92/107 Gate/GateTypes(8)/Wire/WireManager bindings; Day 79 7 dead ids undefined + `#weekly-puzzle-btn` absent.
- **P8 (1):** Day 126 cohort API resolves to `local|live` (got `live`), readout debug-gated.
- **P9 (2):** 0 `Runtime.exceptionThrown`, 0 `console.error`.

## Verdict

Clutter score **4/10** (held from Cycle 5). The 3-cycle collection-modal carry-over is retired (nav 18→14). One new clutter source: the Day 125 `Tournament (Online)` settings section (4 buttons + 2 inputs for a self-hosted-worker feature). Full analysis + proposed cuts in `PRUNE_REPORT.md`.

**Day 134 next:** Cycle 6 PRUNE Week Day 2 — Design Simplification (ship the 2 Tier-1 cuts: collapse Tournament-Online settings section; trim heatmap summary tail).
