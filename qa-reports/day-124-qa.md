# Day 124 QA — Cycle 6 BUILD Week, Day 2: Collection-Modal Merge → tabbed Profile hub

**Date:** 2026-07-01
**Build under test:** local `http://localhost:8901/` · `?v=1782777600` · `sw.js CACHE_NAME = 'signal-circuit-v78'`
**Result:** **33 / 33** assertions across 9 phases on the **FIRST run**. **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.
**Harness:** `qa-reports/day-124-qa.cdp.js` (raw CDP over `ws@8.x`, permissive Chromium on :9301 via `tools/cdp-launch.sh`).

## What shipped

The five standalone "collection" modals merged into **one tabbed `#profile-hub-modal`**:

| Tab | Old modal (removed) | Content root (re-parented, id preserved) | Renderer (unchanged) |
|-----|---------------------|------------------------------------------|----------------------|
| 🏆 Achievements | `#achievements-modal` | `#achievements-list` | `renderAchievements()` |
| 🌳 Mastery | `#mastery-tree-modal` | `#mastery-tree-view` + `#mastery-section` | `renderMasteryTree()` + `renderMasterySection()` |
| 🎨 Customize | `#cosmetic-modal` | `#cosmetic-sections` | `renderCosmeticModal()` |
| 🗂️ Collection | `#collection-modal` | `#collection-list` | `renderCircuitCollection()` |
| 🧬 Logic | `#profile-modal` | `#profile-view` | `renderLogicProfile()` |

- Single **🗂️ Profile** button (`#profile-hub-btn`, reveals at **g12**) replaces the five header buttons. End-game nav-button count drops **18 → 14** (−4: five buttons out, one in).
- Re-parent, don't rewrite: every content root keeps its original id, so all five `render*()` methods work untouched.
- **Lazy-render on tab open** (Day 96 `_switchStatsTab` precedent).
- **ONE consolidated backdrop/close handler** on the hub (avoids the Day 61/74 duplicate-path bug).
- **Tier gating**: Achievements + Customize (old g12 buttons) show from g12; Mastery/Collection/Logic (old g15 buttons) self-hide until g15. Strand-guard routes a gated tab → Achievements.
- **Logic Profile lifecycle**: `#profile-view` cleared on hub close (Day 54 chart-lifecycle discipline; its sparkline is inline SVG, not canvas).

## Phase results

- **P1 build identity + structure (6/6):** 11× `?v=1782777600`, sw v78; 5 old modals absent; all 6 content roots present exactly once; hub + 5 tabs + 5 panes exist.
- **P2 hub opens (2/2):** `#profile-hub-btn` visible at g15; hub opens `display:flex`.
- **P3 all 5 tabs (5/5):** each tab activates, shows its pane, and lazy-renders non-empty content.
- **P4 cosmetic live-mutate (2/2):** 3 unlocked wire-color cards; clicking `blue` (from active `classic`) flips the active wire color → live render preserved through re-parenting.
- **P5 close paths (5/5):** Logic pane had content (4099 chars) → close button hides hub + clears `#profile-view` to 0 → re-opens → backdrop click closes.
- **P6 tier gating (4/4):** g12 → Achievements+Customize visible, Mastery/Collection/Logic hidden, active tab non-stranded (`achievements`); g15 → all 5 visible.
- **P7 end-game (2/2):** 5 old collection buttons removed from DOM; single 🗂️ Profile button visible; nav count = 14.
- **P8 cold + dead-id (5/5):** cold 2 nav / 50 cards; hub button hidden cold (reveals g12); 7 Day 79 dead ids undefined; `#weekly-puzzle-btn` absent.
- **P9 console hygiene (2/2):** 0 console.error, 0 Runtime.exceptionThrown.

## Source LOC

- `index.html`: −40 (5 modal wrappers) / +38 (hub) + 11 cache-bust; header 5 buttons → 1.
- `css/style.css`: +~80 (`#profile-hub-modal` overlay + `#profile-hub-content` + `.phub-tab*` + `.phub-pane` + light-mode mirror).
- `js/ui.js`: +~110 (`setupProfileHub` + `_switchProfileTab` + `_updateProfileTabsUI` + `_profileCompletedCount` + `_profileTabAvailable`); −6 (5 `setVis` calls → 1).
- `sw.js`: +1/−1 (v77 → v78).

Net user-facing surface: **−4 top-level buttons** (five collection entries collapse into one hub).

**Open Bugs queue:** 0 → 0 (streak: **49 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

**Day 125 next:** Cycle 6 BUILD Week Day 3 — Tournament Worker production-readiness + opt-in display name.
