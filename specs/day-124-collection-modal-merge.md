# Day 124 Spec — Collection-Modal Merge → tabbed Profile hub

**Cycle 6 BUILD Week, Day 2 (cycleDay 75, Day 124).**
Build plan source: `specs/day-121-collection-merge-scaffold.md` (verbatim) + `roadmaps/cycle-6-build.md` Day 124 acceptance.

## Goal

Collapse the five standalone "collection" modals into ONE tabbed **Profile hub**:

| Tab | Old modal | Content root (preserved) | Renderer (unchanged) |
|-----|-----------|--------------------------|----------------------|
| 🏆 Achievements | `#achievements-modal` | `#achievements-list` | `renderAchievements()` |
| 🌳 Mastery | `#mastery-tree-modal` | `#mastery-tree-view` + `#mastery-section` | `renderMasteryTree()` + `renderMasterySection()` |
| 🎨 Customize | `#cosmetic-modal` | `#cosmetic-sections` | `renderCosmeticModal()` |
| 🗂️ Collection | `#collection-modal` | `#collection-list` | `renderCircuitCollection()` |
| 🧬 Logic | `#profile-modal` | `#profile-view` | `renderLogicProfile()` |

## Approach — re-parent, don't rewrite

1. **New host modal** `#profile-hub-modal` with `#profile-hub-tabs` (5 `.phub-tab`) + `#profile-hub-panes` (5 `.phub-pane`). Mirrors the Day 96 `#stats-tabs` / `_switchStatsTab` pattern.
2. **Move the five content roots** (with their existing IDs intact) into the hub panes. Every `render*()` writes by `getElementById`, so preserving the IDs means the renderers work untouched regardless of DOM location.
3. **Delete the five old modal wrappers** from `index.html`.
4. **Single entry button** `🗂️ Profile` (`#profile-hub-btn`) replaces the five header buttons (`achievements-btn`, `customize-btn`, `mastery-tree-btn`, `collection-btn`, `profile-btn`). Old ids become dead → fold into the Day 79 dead-id sweep in Cycle 6 PRUNE.
5. **Lazy-render on tab open** (only the active pane's renderer runs).
6. **ONE consolidated backdrop/close handler** on the hub (avoid the Day 61/74 duplicate-path bug). The old per-modal close/backdrop handlers are removed with their modals.
7. **Logic Profile lifecycle**: its sparkline is inline SVG (not a canvas), but on hub close we still clear `#profile-view` innerHTML so nothing lingers (Day 54 chart-lifecycle discipline).

## Tier gating (keep the staircase smooth)

- Hub button reveals at **g12** (earliest of the five — Achievements/Customize were g12).
- Individual tabs self-hide until their tier: **Mastery / Collection / Logic** stay hidden until **g15** (they were g15 buttons). Achievements + Customize show from g12.
- `_switchProfileTab` strand-guard: if a requested tab isn't available yet, route to `achievements`.

## Files touched

- `index.html`: header buttons (5→1), remove 5 modal blocks, add `#profile-hub-modal`, cache-bust ×11 (`?v=1782691200` → `?v=1782777600`).
- `css/style.css`: `#profile-hub-modal` overlay + `#profile-hub-content` + `.phub-tab*` + `.phub-pane` (mirror `.stats-tab`).
- `js/ui.js`: new `setupProfileHub()` + `_switchProfileTab()` + `_updateProfileTabsUI()` + `_profileCompletedCount()` + `_profileTabAvailable()`; call `setupProfileHub()` in constructor; swap the 5 `setVis` calls for `setVis('profile-hub-btn', g12)`; the 5 old `setup*` methods keep their button/modal wiring but no-op on the now-absent elements (cleaned in PRUNE).
- `sw.js`: CACHE_NAME v77 → v78.

## Acceptance (CDP harness `qa-reports/day-124-qa.cdp.js`)

- P1 build identity: 11× `?v=1782777600` + sw v78.
- P2 hub opens from `#profile-hub-btn`; `#profile-hub-modal` display:flex.
- P3 all 5 tabs switch + lazy-render their content root (non-empty innerHTML after switch).
- P4 cosmetic select still mutates live render (`cosmetics.setWireColor` reachable via card click path).
- P5 close via button + backdrop; `#profile-view` cleared; no leaked overlay.
- P6 tier gating: <g15 hides Mastery/Collection/Logic tabs, Achievements/Customize visible; ≥g15 all 5 visible.
- P7 end-game nav-button count drops by 4 (5 old buttons → 1 hub button) vs the Day 123 baseline.
- P8 Day 79 dead-id purge intact; cold 2 nav / 50 cards; 0 console.error / 0 Runtime.exceptionThrown.
