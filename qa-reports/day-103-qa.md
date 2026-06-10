# Day 103 QA — Cycle 4 PRUNE Week, Day 2: Design Simplification

**Date:** 2026-06-10 (Wednesday)
**Cycle:** 4, cycleDay 51, weekType=prune, weekDay=2
**Build under test:** `?v=1780704000`, SW `signal-circuit-v66` (Day 103 bump — first source-file change since Day 96).
**Browser:** Chromium 146.0.7663.0 headless, `--remote-debugging-port=9301`, `--remote-allow-origins=*`, `--user-data-dir=/tmp/sc-cdp-d103`.
**Local server:** `python3 -m http.server 8901` from the repo root.
**Harness:** `qa-reports/day-103-qa.cdp.js` — raw WebSocket CDP, no puppeteer.
**Result:** **40 / 40 assertions passed**, 0 console errors, 0 Runtime.exceptionThrown, 0 new bugs. LO-1 fixed on both bypass paths (Day 102 P5/P5b reproduction harness FAILS as expected — the success signal).

---

## What shipped (5 Tier-1 PRUNE cuts)

### Cut #1 — LO-1 fix at the screen-transition layer
- **Where:** `js/ui.js` `UI.showScreen()` (entry block, runs when destination is `level-select`).
- **What:** Cleans BOTH `blitzMode`/`blitzTimer`/`#blitz-hud` AND `speedrunMode`/`speedrunTimer`/`speedrunStart`/`#speedrun-hud` whenever any caller routes to `level-select` (wrapper OR bypass path).
- **Companion:** The Day 61 (Blitz) + Day 74 (Speedrun) defensive blocks in `GameState.showLevelSelect()` were removed — the transition layer owns the contract now.
- **Regression baseline:** P2 (Speedrun) + P3 (Blitz) explicitly run the Day 102 bypass-path reproduction — both now leave `speedrunMode=false` + `#speedrun-hud display=none` (and the Blitz analogue). Day 102 P5.c / P5.d / P5b.b would FAIL to reproduce LO-1 on this build, which is the documented success signal.
- **LO-1 retired** after **12 days** of latency (re-verified non-user-reachable on Days 87 / 88 / 89 / 90 / 91 / 97 / 98 / 99 / 100 / 101 / 102).

### Cut #2 — Tournament mode label compression
- **Where:** `LocalTournamentAdapter.describe()` + `RemoteTournamentAdapter.describe()` in `js/main.js`; CSS rule on `#tournament-mode-label` in `css/style.css`.
- **Vocabulary:**
  - `local` → `🏠 Local leaderboard` (51 → 20 chars, **-60%**)
  - `remote` → `🌐 Live leaderboard`
  - `remote-fallback` → `🌐 Live · offline`
  - `cloud-ready` → `🌐 Connecting…`
- **Bound:** `max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` on the label so any future state string can't spill into paragraph apology copy again.

### Cut #3 — Stats modal defaults to Cards when library non-empty
- **Where:** `UI.setupStatsDashboard()` open handler in `js/ui.js`.
- **Behavior:** Open handler reads `gameState.getCardLibrary().length`. If `> 0`, the default tab + pane visibility flip to Cards via `_switchStatsTab('cards')`; otherwise Overview wins (Day 96 default preserved for cold-start players).
- **Verified live in P5:** empty library → tab=overview, overview pane visible. After one card added → tab=cards, cards pane visible, overview pane hidden, badge `📸 My Cards (1)`.

### Cut #4 — Mastery card gating
- **Where:** `index.html` moved `<div id="mastery-section">` from the level-select panel into `#mastery-tree-modal`. `js/ui.js` removed `this.renderMasterySection()` from `renderLevelSelect()` and added it to the Mastery Tree modal open handler.
- **Net effect:**
  - End-game level-select grid drops from **50 → 45 cards** (Cycle 2 invariant restored).
  - All 5 Chapter Mastery challenges remain reachable through `🌳 Mastery Tree` modal.
  - Click handlers + completion bookkeeping unchanged — the same `renderMasterySection()` function paints them, just in a different container.

### Cut #5 — `#lab-budget` moved out of the constraint chip strip
- **Where:** `index.html` restructured `#lab-hud` into two `.lab-hud-row` divs; `css/style.css` switched `#lab-hud` to `flex-direction: column` with a 6px row gap.
- **Top row:** `#lab-label` + `#lab-constraint` + `#lab-constraint-2` + `#lab-tries` + `#lab-reset-btn` (the constraint manifest + tries + reset).
- **Bottom row:** `#lab-budget` alone (state, not rule).
- **Why:** Day 94 LESSONS_LEARNED.md predicted Lab Bench III would carry the constraint-chip strip forward as a "constraint manifest" vocabulary. Mixing budget (state) into rules diluted the language; the split preserves the seed.
- **Verified live on L44** (composite NAND-only half-adder): HUD visible, `flexDirection=column`, budget parent class includes `lab-hud-budget-row`, budget renders 88px below the constraint strip, both constraint chips still surface (`🧱 NAND only` + `🎯 Hard cap: 6 gates`).

---

## Build identity bump

- `?v=1780617600` → `?v=1780704000` (11 refs in `index.html`)
- `signal-circuit-v65` → `signal-circuit-v66` (in `sw.js`)
- First source-file change since Day 96 (Day 102 was audit-only).

## LOC delta

```
 css/style.css | 26 ++++++++++++++++++++++----
 index.html    | 60 +++++++++++++++++++++++++++++++++++------------------------
 js/main.js    | 30 ++++++++++--------------------
 js/ui.js      | 38 +++++++++++++++++++++++++++++++++----
 sw.js         |  2 +-
 5 files changed, 103 insertions(+), 53 deletions(-)
```

Net source-file delta: +50 (insertions weighted by per-cut documentation comments — every cut left a `// Day 103 PRUNE Cut #N:` audit-trail breadcrumb at the touch site). Comment-stripped delta is approximately net-zero. PRUNE-week net-negative LOC mandate carries forward to Day 104 (Code Cleanup), which will sweep dead identifiers and any orphan helpers exposed by today's gating cuts.

## Phase-by-phase result

| # | Phase | Pass | Notes |
|---|-------|------|-------|
| P1 | Build identity (5) | 5/5 | `?v=1780704000` × 11 refs, SW v66, no stale v65 |
| P2 | LO-1 fix — Speedrun bypass clean (4) | 4/4 | speedrunMode=false, hud=none, timer cleared, start=null |
| P3 | LO-1 fix — Blitz bypass clean (4) | 4/4 | blitzMode=false, hud=none, timer cleared |
| P4 | Tournament label compression (7) | 7/7 | All 4 states correct + CSS ellipsis + nowrap |
| P5 | Stats default-to-Cards (6) | 6/6 | empty → overview, non-empty → cards + badge live |
| P6 | Mastery card gating (5) | 5/5 | grid=45, modal contains section, 5 challenges live |
| P7 | Lab-budget out of constraint strip (7) | 7/7 | column flex, separate row, budget below constraints |
| P8 | Console hygiene (2) | 2/2 | 0 errors, 0 exceptions |
| **Total** | | **40/40** | |

## Console hygiene

**0 console.error** across all 40 assertions / 7 phases.
**0 Runtime.exceptionThrown** across the full run.

---

## Files touched

```
css/style.css      — Cut #2 (#tournament-mode-label ellipsis), Cut #5 (#lab-hud column flex)
index.html         — Cut #4 (mastery-section moved into modal), Cut #5 (lab-hud two-row split), cache-bust × 11
js/main.js         — Cut #1 (Day 61/74 blocks removed), Cut #2 (describe() compression × 4 states)
js/ui.js           — Cut #1 (UI.showScreen() owns HUD cleanup), Cut #3 (default-to-Cards), Cut #4 (modal opens section)
sw.js              — CACHE_NAME v65 → v66
qa-reports/day-103-qa.cdp.js  — new (471 LOC harness, 40 assertions across 7 phases)
qa-reports/day-103-qa.md      — this file
```

## Day 104 plan handoff

Day 104 = PRUNE Week Day 3 = **Code Cleanup** (Day 79 precedent). Sweep:
- Orphan helpers exposed by Cut #4 (any function called only by `renderMasterySection()` in the level-select context).
- Dead identifiers from Cut #1 — e.g. the old `_bh` / `_sh` local names in `GameState.showLevelSelect()` no longer exist; verify no other call site references them.
- Tier-2 carry-overs #8 (Difficulty Mode filing) + #9 (Install-App gating) from PRUNE_REPORT.md are explicitly scoped to Day 104.
- Run `tools/module-health.js` if extant; otherwise grep for unused exports.

LO-1 retires from the BUGS.md Open Bugs section to Resolved with a Day 103 reference.
