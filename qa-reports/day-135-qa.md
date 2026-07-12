# Day 135 QA — Cycle 6 PRUNE Week, Day 3: Code Cleanup

**Date:** 2026-07-12 (Sunday) · cycleDay 86 · Day 135
**Build under test:** LOCAL `http://localhost:8901/` — `?v=1783814400` / sw `signal-circuit-v83` (bumped from Day 134 `?v=1783728000` / v82).
**Harness:** `qa-reports/day-135-qa.cdp.js` — **42 / 42 assertions across 7 phases**; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.
**First run:** 41/42 (1 harness self-bug on the cosmetics accessor — used `getActive('wireColor')`; real accessor is the `activeWireColor` property. Fixed harness-side, 0 app changes.)

## What shipped — Tier-2 Cut #3 (dead-id sweep)

The Day 124 Profile-hub merge (5 collection modals → 1 tabbed `🗂️ Profile` hub) left behind 5 orphaned `setup*` binder methods in `js/ui.js`. Each only wired the OLD top-level button + standalone modal + close-button ids — all of which were deleted from `index.html` on Day 124 — so every one of them no-op'd on absent elements. Removed:

| Removed method | Bound-to (all now absent from index.html) | Live replacement |
|---|---|---|
| `setupAchievements()` | `achievements-btn` / `achievements-modal` / `achievements-close` | `renderAchievements()` via `_switchProfileTab('achievements')` |
| `setupMasteryTree()` | `mastery-tree-btn` / `mastery-tree-modal` / `mastery-tree-close` | `renderMasteryTree()` + `renderMasterySection()` |
| `setupCircuitCollection()` | `collection-btn` / `collection-modal` / `collection-close` | `renderCircuitCollection()` |
| `setupLogicProfile()` | `profile-btn` / `profile-modal` / `profile-close` | `renderLogicProfile()` |
| `setupCosmeticModal()` | `customize-btn` / `cosmetic-modal` / `cosmetic-close` | `renderCosmeticModal()` (its card-click delegation is inside `renderCosmeticModal`, not the setup method) |

The 5 `render*()` methods are **kept** — they are the live rendering path reached through `setupProfileHub` → `_switchProfileTab`. Also removed the 5 `this.setup*()` call sites in the `UI` constructor, replaced with a single breadcrumb comment for future factory agents.

**The whole risk of this cleanup:** did removing the setup wiring break the hub's ability to render those panes? P4/P5 answer that directly — the hub opens, all 5 tabs render non-empty, and the cosmetic card-click still flips the active wire color (`classic → blue`), proving the delegation in `renderCosmeticModal()` survived.

## Phase results

- **P1 (build identity, 4):** 11 cache-bust refs unified at `?v=1783814400`; sw.js CACHE_NAME = `signal-circuit-v83` (no v82 residue).
- **P2 (prototype surface, 12):** all 5 `setup*` binders `undefined` on the UI instance; all 6 `render*` methods (incl. `renderMasterySection`) still `function`; `setupProfileHub` + `_switchProfileTab` live.
- **P3 (served source, 7):** fetched `js/ui.js?v=1783814400` — 0 `setupX()` method definitions, 0 `this.setupX()` call sites for all 5.
- **P4 (hub render safety, 6):** `🗂️ Profile` button opens the hub (`display:flex`); after `seedProgress(15)` all 5 panes (Achievements 270 els / Mastery 48 / Customize 119 / Collection 2 / Logic 64) render visible + non-empty.
- **P5 (cosmetic delegation + close, 3):** customize pane has 3 clickable wireColor cards; clicking `blue` sets `activeWireColor` `classic → blue`; hub closes and `#profile-view` clears to 0 chars (Day 54 discipline).
- **P6 (regression floor, 8):** cold nav = 2 (Day 78), 50 cards, Gate+8 GateTypes / Wire / Simulation ESM bindings intact, LEVELS = 50, all 6 retired ids absent from DOM (`weekly-puzzle-btn` + the 5 collection ids), hub modal + button still present.
- **P7 (console hygiene, 2):** 0 console.error, 0 Runtime.exceptionThrown.

## LOC delta (net-negative — PRUNE mandate)

```
js/ui.js    +11 / -98   (net -87; removals only)
index.html  +11 / -11   (cache-bust only)
sw.js        +1 / -1    (v82 → v83)
------------------------------------
TOTAL       +23 / -110  =  net -87 LOC
```

PRUNE week net-negative mandate satisfied at both the day and week level.

**Open Bugs:** 0 → 0 (60-day empty-queue streak since Day 76). **Latent observations:** 0 → 0.

**Day 136 next:** Cycle 6 PRUNE Week Day 4 — Polish Sprint (Tier-3 cuts #6 Tournament mode-label cross-fade + #7 heatmap cell tap-hold detail popover, + cold-start defaults re-audit).
