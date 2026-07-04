# Day 127 QA — Cycle 6 BUILD Week Day 5: Stats per-chapter completion heatmap

**Date:** 2026-07-04 · **cycleDay 78 · Day 127** · closes Cycle 6 BUILD week
**Build under test:** local `?v=1783036800` · `sw.js CACHE_NAME = 'signal-circuit-v81'` (Day 127 build)
**Harness:** `qa-reports/day-127-qa.cdp.js` (raw CDP over `ws@8.x`; launcher `tools/cdp-launch.sh`)
**Spec:** `specs/day-127-stats-progress-heatmap.md`

## Result

**31 / 31 assertions across 7 phases.** 0 `console.error`; 0 `Runtime.exceptionThrown`; 0 new user-facing bugs.

First run had **1 harness self-bug** (P3 re-derivation read `game.gameState.progress.levels`, but `window.game` IS the GameState — correct accessor is `game.progress.levels`; `game.gameState` is undefined). Fixed harness-side, **0 app changes**. Second run 31/31.

## What shipped

A fourth tab — **📈 Progress** — in the Stats modal (`#stats-tabs`), joining Overview / My Cards / Tournament. `_renderProgressHeatmap()` renders one cell per chapter into `#stats-progress-pane`:

- **Palette-native tint ramp.** Each cell is tinted with the chapter's own `color` (from `getChapters()`), alpha-ramped by completion band: 0% → dim slate, 1–33% → 0.22α, 34–66% → 0.42α, 67–99% → 0.66α, 100% → 0.9α + gold ✓ corner + glow. Reads as the campaign's own palette, not a generic green ramp.
- **Star overlay** per cell: `N/M · ★earned/max` (max = 3 × chapter level count).
- **Summary strip:** `X / Y levels · ★ A / B` across all chapters.
- **Bonus section:** `isBonus` chapters (Dark Gate, Lab Bench I/II/III) render in a second "Bonus & Lab Bench" grid so the main campaign heatmap stays clean.
- **Hidden-when-empty (Day 119):** the tab is `display:none` until the player completes ≥1 level; `_switchStatsTab('progress')` strand-guards to Overview on an empty profile. A brand-new player's Stats modal collapses to 📊 Overview only.

Pure DOM/CSS grid — no canvas, no chart lifecycle, no writes (read-only over `progress.levels`).

## Phase-by-phase

- **P1 Build identity (5):** 11 `?v=1783036800` refs; `sw v81`; `window.game` + `.ui` + `seedProgress` live; `#stats-tab-progress` + `#stats-progress-pane` in DOM; `_renderProgressHeatmap` + `_progressCompletedTotal` present.
- **P2 Cold empty state (3):** progress tab `display:none` cold; `_progressCompletedTotal() === 0`; `_switchStatsTab('progress')` on empty profile routes to Overview (pane hidden).
- **P3 Seeded correctness (5):** `seedProgress(18)` → tab reveals; progress is active; one cell per chapter; `_progressCompletedTotal` matches a harness re-derivation from `progress.levels`; first non-empty chapter's rendered `.phm-sub` text byte-matches the independently derived `done/total · ★stars/max`.
- **P4 Full completion band (3):** `seedProgress(50,{stars:3})` → every chapter shows `phm-done` + ✓; `_progressCompletedTotal() === getLevelCount()` (50); summary strip shows `50 / 50` and `★ 150 / 150`.
- **P5 Tab switching (4):** Overview ⇄ Progress toggle exactly one visible pane each; active-tab class tracks (progress set, overview cleared); back-to-overview restores single-pane visibility.
- **P6 Regression (9):** Day 78 cold nav = 2; 50 level cards; Day 79 dead-ids undefined + `#weekly-puzzle-btn` absent; Day 92 `Gate`/`GateTypes`, Day 107 `Wire`/`WireManager`, Day 123 `Simulation` bindings + instance identity; cold tournament backend `local`; progress tab hidden again after `localStorage.clear()`.
- **P7 Console hygiene (2):** 0 `console.error`, 0 `Runtime.exceptionThrown`.

## Build identity

`?v=1782950400 / sw v80` → `?v=1783036800 / sw v81` (11 cache-bust refs).

## Source delta

- `index.html`: +2 (tab button + pane) + 11 cache-bust bumps.
- `js/ui.js`: +~95 (`_renderProgressHeatmap`, `_progressCompletedTotal`, `_switchStatsTab` + `_updateStatsTabsUI` + setup wiring extensions).
- `css/style.css`: +~70 (`.progress-heatmap-*`, `.phm-cell` + light-mode).
- `sw.js`: v80 → v81.

## Streak

**Open Bugs queue 0 → 0** (52-day empty-queue streak since Day 76). **Latent observations 0 → 0.** Closes Cycle 6 BUILD week.
