# Day 121 Scaffold — Collection-Modal Merge (Tier-2 Cut #4)

> **Status: PLANNING ONLY — nothing shipped Day 120.** This document maps the five
> standalone "collection" modals and their open handlers so Day 121 can merge them
> into a single tabbed **Profile** surface without re-discovering the DOM.
>
> Source of truth: PRUNE_REPORT.md (Day 118) Tier-2 Cut #4 — "5 collection modals
> still unmerged (18-button Tier-3 plateau)."

## Goal

Collapse five top-level modals into **one tabbed Profile modal** with five tabs:
`Achievements · Mastery · Customize · Collection · Logic Profile`.
This removes up to 4 level-select buttons (the 18-button Tier-3 plateau noted in the
last three PRUNE audits) by routing them through one entry point + a tab strip
(reuse the Stats-modal `#stats-tabs` pattern from Day 96).

## Modal / handler map (verified Day 120)

| # | Feature | Open button (id) | Modal DOM (id) | Setup method (js/ui.js) | Close button (id) |
|---|---------|------------------|----------------|-------------------------|-------------------|
| 1 | Achievements  | `achievements-btn`  | `achievements-modal`  | `setupAchievements()` (~2959)    | `achievements-close` |
| 2 | Mastery       | `mastery-tree-btn`  | `mastery-tree-modal`  | `setupMasteryTree()` (~5240)     | `mastery-tree-close` |
| 3 | Customize     | `customize-btn`     | `cosmetic-modal`      | `setupCosmeticModal()` (~6923)   | (in-modal close)     |
| 4 | Collection    | `collection-btn`    | `collection-modal`    | `setupCircuitCollection()` (~5321) | (in-modal close)   |
| 5 | Logic Profile | `profile-btn`       | `profile-modal`       | `setupLogicProfile()` (~5380)    | (in-modal close)     |

All five open buttons live in the level-select header button row (index.html ~128-137)
and are gated by the Day-12 / Day-15 tier reveal (`setVis(...,g12)` / `g15` at
ui.js ~885-890). Mastery/Collection/Profile reveal at g15; Achievements/Customize at g12.

## Proposed Day 121 approach (do NOT ship until Day 121)

1. **New host modal** `#profile-hub-modal` with a `#profile-hub-tabs` strip (5 tabs)
   and a `#profile-hub-content` pane — mirror the `#stats-tabs` / `_switchStatsTab`
   pattern (Day 96) including the Day 119 Cut #3 hidden-when-empty guard where a tab
   has no content yet (e.g. zero unlocked cosmetics).
2. **Re-parent, don't rewrite**: move the five existing modal *content* roots
   (`#achievements-list`, `#mastery-tree-view`, the cosmetic grid, `#collection-*`,
   `#profile-*`) into the hub panes. Keep each `render*()` renderer intact; the tab
   switch calls the matching renderer on demand (lazy, like Stats charts).
3. **Single entry button** `🗂 Profile` replaces the 5 header buttons; old button ids
   become dead identifiers → fold them into the Day 79 dead-id sweep on Day 122.
4. **Tier gating**: hub button reveals at g12 (earliest of the five); individual tabs
   self-hide until their own tier/condition is met so the staircase stays smooth.
5. **Net-LOC discipline**: PRUNE week is net-negative — the merge should delete more
   modal-shell/CSS than the hub scaffold adds. Track in the Day 121 build report.

## Risks / watch-items for Day 121

- Each modal currently has its own backdrop-click + close-button wiring; consolidate
  to ONE handler on the hub to avoid the Day 74/61 HUD-cleanup-style duplicate-path bug.
- `setupCosmeticModal()` mutates live rendering (wire colors / gate skins) on select —
  ensure re-parenting doesn't detach its event delegation.
- Logic Profile renders skill sparklines on a canvas (Day 50); lazy-render on tab open,
  destroy on hub close (Day 54 chart-lifecycle precedent) to avoid leaked canvases.
- Keep `#stats-modal` SEPARATE — it is the data/analytics surface, not a collection.
