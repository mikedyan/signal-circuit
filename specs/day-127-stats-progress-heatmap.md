# Day 127 — Stats Dashboard: per-chapter completion heatmap tab

**Cycle:** 6 · **Week:** BUILD · **Day:** 5 (cycleDay 78, Day 127) — closes Cycle 6 BUILD week
**Roadmap:** `roadmaps/cycle-6-build.md` Day 127
**Precedent:** Day 96 (`#stats-tabs` / `_switchStatsTab` pattern), Day 111 (Tournament tab), Day 119 (hidden-when-empty discipline), Day 76 (`GameState.seedProgress()` harness helper)

## Goal

Close the BUILD week with a depth/insight feature in the now-canonical Stats surface: a
compact **per-chapter completion + star heatmap**. One cell per chapter, colored by
completion %, with a star-total overlay. Gives returning players a glance-able sense of
progress and reinforces the revisit loop the PB badge (Day 110) started.

## What ships

### New tab: `📈 Progress`
A fourth tab in `#stats-tabs`, joining Overview / My Cards / Tournament.

- **index.html**: `#stats-tab-progress` button + `#stats-progress-pane` div (default `display:none`).
- **Hidden-when-empty (Day 119)**: the tab is `display:none` until the player has completed
  **≥1 level**. A brand-new player's Stats modal shows only 📊 Overview. Reveals on first
  completion. `_switchStatsTab('progress')` on an empty profile routes to Overview
  (strand-guard mirrors the cards/tournament guards).

### `_renderProgressHeatmap()`
Renders into `#stats-progress-pane`:

- Iterates `getChapters()` (global from `levels.js`).
- Per chapter: count `completed` levels + sum `stars` from
  `this.gameState.progress.levels[id]` over `chapter.levels`.
- **Completion %** = completed / total levels in chapter.
- **Cell color** ramps by completion band:
  - 0% → dim slate (locked/untouched)
  - 1–33% → faint chapter tint
  - 34–66% → mid chapter tint
  - 67–99% → strong chapter tint
  - 100% → full chapter color + gold "✓" corner + glow
- Each cell uses the chapter's own `color` as the tint hue (alpha ramps by band), so the
  heatmap reads as the campaign's own palette rather than a generic green ramp.
- **Star overlay**: `★ N/M` (earned / max=3×levelCount) beneath the chapter label.
- **Summary strip** above the grid: `X / Y levels · ★ A / B` totals across all chapters.
- Bonus chapters (Lab Bench, Dark Gate — `isBonus:true`) render in a second "Bonus"
  row/section so the main campaign heatmap stays clean.

### Empty state
If somehow rendered with 0 completions (shouldn't happen — tab is hidden), the pane shows a
short "Complete a level to light up the map" placeholder (defense-in-depth; matches the
cards/tournament empty-pane idiom).

## Non-goals
- No new cold-start surface (tab lives inside the existing Stats modal; cold nav stays 2 —
  Day 78 invariant).
- No canvas — pure DOM/CSS grid (no chart-lifecycle concern; nothing to destroy on close).
- No writes — read-only view over existing progress.

## Files touched
- `index.html` — tab button + pane + 11 cache-bust refs (`?v=1782950400` → `?v=1783036800`).
- `js/ui.js` — `_switchStatsTab` (add `progress`), setup wiring, `_updateStatsTabsUI`,
  new `_renderProgressHeatmap()` + `_progressCompletedTotal()` helper.
- `css/style.css` — `#stats-progress-pane`, `.progress-heatmap-*`, `.phm-cell` + light-mode.
- `sw.js` — `CACHE_NAME` v80 → v81.

## Build identity
`?v=1782950400 / sw v80` → `?v=1783036800 / sw v81`.

## Acceptance / CDP harness (`qa-reports/day-127-qa.cdp.js`)
- **P1 Build identity**: 11 `?v=1783036800` refs, `sw v81`, game live, progress tab present in DOM.
- **P2 Cold empty state**: fresh localStorage → `#stats-tab-progress` is `display:none`;
  Stats modal opens on Overview; `_switchStatsTab('progress')` strand-guards to Overview.
- **P3 Seeded state**: `seedProgress(18)` → progress tab reveals; heatmap renders one cell
  per chapter; per-chapter completed count + star sum match a harness re-derivation from
  `game.gameState.progress.levels` (correctness, not just shape).
- **P4 Full completion band**: `seedProgress(50,{stars:3})` → every non-bonus chapter cell
  shows 100% + ✓; summary strip totals match `getLevelCount()` and 3×count stars.
- **P5 Tab switching**: Overview ⇄ Progress ⇄ (Cards/Tournament if present) toggle panes
  correctly; only one pane visible at a time; active-tab class tracks.
- **P6 Regression**: Day 78 cold (2 nav / 50 cards), Day 79 dead-ids undefined,
  Day 92/107/123 ESM bindings, Day 126 cohort accessors intact.
- **P7 Console hygiene**: 0 `console.error`, 0 `Runtime.exceptionThrown`.
