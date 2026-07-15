# Cycle 7 — BUILD Week Roadmap (Days 138–142)

**Cycle:** 7 · **Week:** BUILD (week 1 of the build→harden→prune rotation)
**Generated:** Day 138 · 2026-07-15
**Prior build under audit:** `?v=1783900800` / sw `signal-circuit-v84` (Day 136 artifact; Day 137 closed Cycle 6 at 9.3/10 with 0 source changes).
**Theme:** **Mode discovery & the meta-loop.** The campaign is the cleanest it's ever been (Day 133 clutter 4/10, nav 18→14 after the Day 124 Profile-hub merge). The remaining rough edge the last three PRUNE reports keep circling is the 8 flat "Challenge Mode" buttons: they crowd the level-select, carry zero context (a new player has no idea what *Blitz* vs *Speedrun* vs *Infinite* even is), and are the flagged next nav plateau. This week folds them into one discoverable **🎮 Modes hub** and turns that hub into a genuine meta-dashboard.

This is the exact BUILD-scale item the Cycle 6 PRUNE_REPORT nominated: *"a single 🎮 Modes hub could fold those 7 into one, dropping nav 14→~8 … a dedicated BUILD-scale item — flag it for Cycle 7 BUILD."*

Why not "deploy the Tournament Worker for real" (the 3-cycle carry-over)? That step requires live Cloudflare credentials + `wrangler deploy`, which is an external human action the unattended factory cannot perform. Day 125 already shipped the productionization surface + `deploy.sh` preflight; the actual deploy stays a human step and is not a valid autonomous BUILD day. The Modes hub is fully browser-testable end-to-end.

---

## Day 138 (Mon) — 🎮 Modes Hub (consolidation) ✅ THIS RUN
Fold the 8 challenge-mode buttons (`daily / tournament / adaptive / infinite / random / blitz / speedrun / sandbox`) into ONE `🎮 Modes` button on the level-select that opens a `#modes-hub-modal`. **Re-parent, don't rewrite** (Day 124 pattern): move the exact `<button>` elements — ids, classes, labels, handlers all preserved — into `.mode-card` wrappers inside the modal, each card adding a one-line description. Tier-gating moves from the buttons to the card wrappers (`mode-card-<key>`), so every existing `setVis` gate, badge updater (`updateDailyButtonBadge` / `updateAdaptiveButtonBadge` / `applySeasonalTheme`), and click handler keeps working untouched. Result: level-select "Challenge Mode" section drops from 8 always-visible buttons to 1; each mode gains a description (discoverability win).

## Day 139 (Tue) — Per-mode stat badges in the hub
Each `.mode-card` shows the player's own headline stat, read from existing progress data — Daily: current streak; Blitz: best rung; Speedrun: best time; Infinite: best depth; Tournament: last rank; Adaptive: skill label; Random/Sandbox: play count. Turns the hub from a launcher into a dashboard. Pure read of existing GameState fields; no new persistence.

## Day 140 (Wed) — "Recommended for you" spotlight
A single highlighted card at the top of the hub suggesting one mode based on player state (new-to-modes → Daily; campaign complete → Blitz ladder; on a daily streak → keep it alive; etc.). Lightweight deterministic heuristic; no new data.

## Day 141 (Thu) — First-time mode intro cards
The first time a player launches each mode, a one-time dismissible intro explains the rules (`signal-circuit-mode-seen-<key>` flags). Reuses the existing toast/hint or confirm-modal infra. Removes the "what is this mode?" confusion the flat buttons caused.

## Day 142 (Fri) — Hub polish + integration pass
Entrance animation, keyboard/focus order, mobile layout sweep at 375/414/768px, ensure the recommended spotlight + stat badges + intro flags all cohere. Cold-start defaults re-audit. Close BUILD week with a clean regression floor for the Cycle 7 HARDEN week.

---

## Week Guardrails
- **Zero regressions** to the 8 mode launch flows — every mode must still start correctly from inside the hub.
- Preserve all tier-gating (daily g6 · random/sandbox g9 · adaptive g12 · tournament/infinite/blitz/speedrun g18).
- Preserve the Day 78 cold-start invariant (2 nav buttons on a fresh profile: How to Play + Settings — the Modes button reveals at g6, so cold start is unchanged).
- Cache-bust + SW bump together every source-change day (Day 78 precedent).
- Keep the empty-Open-Bugs streak (62 days as of Day 137) intact.
