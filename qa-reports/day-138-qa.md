# Day 138 QA — Cycle 7 BUILD Week, Day 1: 🎮 Modes Hub (consolidation)

**Date:** 2026-07-15 · cycleDay 89 · Day 138
**Build:** LOCAL `?v=1783987200` / sw `signal-circuit-v85` (bumped from Day 136 `?v=1783900800` / v84 — first source change of Cycle 7).
**Result:** **37 / 37** assertions across 8 phases on the **FIRST run**; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs; **0** harness self-bugs.

## What shipped
Folded the 8 always-visible "Challenge Mode" buttons on the level-select into ONE `🎮 Modes` button (`#modes-hub-btn`) that opens `#modes-hub-modal`. Applied the Day 124 **re-parent, don't rewrite** discipline: the exact `<button>` elements (ids/classes/aria-labels/handlers preserved) were moved into `.mode-card` wrappers inside the modal, each card gaining a one-line `.mode-desc` description — a discoverability win over the context-free flat buttons.

- **Tier-gating moved from buttons → card wrappers.** The 8 `setVis('<btn-id>', gate)` calls in `applyProgressGating()` became `setVis('mode-card-<key>', gate)`; the re-parented buttons stay `display:default` inside their card so every click handler + badge updater keeps working. `#modes-hub-btn` reveals at g6 (earliest mode = Daily). Removed the inline `style="display:none"` from `#tournament-btn` (its card `#mode-card-tournament` now carries the g18 gate).
- **New `setupModesHub()`:** open/close/backdrop (ONE consolidated backdrop handler — Day 61/74 duplicate-path discipline) + a delegated close-on-pick on `#modes-hub-list` so a launched screen never sits behind the overlay. The button's own (unchanged) handler still performs the navigation.
- **Card order = reveal staircase:** daily(g6) · random(g9) · sandbox(g9) · adaptive(g12) · tournament(g18) · infinite(g18) · blitz(g18) · speedrun(g18).

Level-select "Challenge Mode" section: **8 always-visible buttons → 1**. This is the Cycle 6 PRUNE_REPORT Cut #4 promoted to a dedicated BUILD day.

## Phase results
- **P1 Build identity (8):** 11× `?v=1783987200`, sw v85, `#modes-hub-modal`+`#modes-hub-btn`+`#modes-hub-list` present, `setupModesHub` fn, all 8 mode buttons re-parented into the hub, 8 `.mode-card` + 8 `.mode-desc`, old `#challenge-buttons` container gone.
- **P2 Cold-start (4):** 2 nav buttons (How to Play + Settings — Day 78 invariant), Modes button hidden cold (reveals g6), 50 level cards, no flat challenge-buttons list on level-select.
- **P3 Tier reveal (4):** seed 6 → Modes btn + only Daily card; seed 9 → +Random +Sandbox (Adaptive still hidden); seed 12 → +Adaptive (Tournament hidden); seed 18 → all 8 cards visible.
- **P4 Launch integrity (8):** each of the 8 re-parented buttons still launches its flow from inside the hub (daily→daily-config, random→challenge-config, sandbox→sandbox-config, adaptive→gameplay, tournament→tournament-screen, infinite→infinite-pre, blitz→gameplay+blitzMode, speedrun→gameplay+speedrunMode) AND the hub closes on pick.
- **P5 Badge integrity (2):** `updateDailyButtonBadge()` + `updateAdaptiveButtonBadge()` still mutate the re-parented buttons (location-independent, as expected).
- **P6 Close paths (2):** close button + backdrop click both hide the modal.
- **P7 Regression floor (7):** Day 79 dead-ids absent, Day 92/107/123 ESM bindings + `simulation instanceof window.Simulation`, LEVELS=50, Day 124 Profile hub intact.
- **P8 Console hygiene (2):** 0 console.error, 0 Runtime.exceptionThrown.

## Source LOC
`index.html` +54/−13 (challenge section rewrite + modal), `js/ui.js` +45/−7 (setupModesHub + card gating), `css/style.css` +72 (modal shell + `.mode-card`/`.mode-desc` + light-mode), `sw.js` +1/−1, cache-bust ×11. Net ≈ +150 functional LOC.

## Open Bugs / streak
**Open Bugs queue:** 0 → 0 (streak: **63 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Harness: `qa-reports/day-138-qa.cdp.js` (37 assertions, 8 phases). Spec: `specs/day-138-modes-hub.md`. Roadmap: `roadmaps/cycle-7-build.md`.

**Day 139 next:** Cycle 7 BUILD Week Day 2 — per-mode stat badges in the hub (Daily streak / Blitz best rung / Speedrun best time / Infinite depth / Tournament last rank / Adaptive skill).
