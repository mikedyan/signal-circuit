# Day 111 QA Report — Cycle 5 BUILD Week, Day 5

**Date:** 2026-06-18 (Thursday)
**Feature:** Stats Dashboard — **Tournament History Tab**
**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'`
**Harness:** `qa-reports/day-111-qa.cdp.js` — 35 assertions across 9 phases
**Result:** **35 / 35 PASS on first run** · 0 console.error · 0 Runtime.exceptionThrown

---

## Scope

Added a third tab to the Stats modal — **🏆 Tournament (N)** — that surfaces the
player's per-week tournament submissions. The tab joins the Day 96 Overview /
My Cards rotation managed by `UI._switchStatsTab()` and `UI._updateStatsTabsUI()`.

When the player has zero submissions the tab still renders (consistent with the
Day 96 My Cards pattern), but the pane shows an empty state and the tab carries
the Day 104 `.empty` dim class.

After at least one submission lands, the tab badge updates to `🏆 Tournament (N)`,
the dim class strips, and the pane renders newest-first rows. Each row shows:

- `weekKey` (e.g. `2026-W25`) — purple-tinted, mirrors the existing
  `.tournament-archive-row .tarc-week` color language so a player switching
  between the Tournament screen and Stats reads them as one surface
- A rank chip: `👑 #1` (crowned, gold gradient), `🏅 #N` (podium, gold tint), or
  `#N` (neutral)
- A stat string: `N gates · m:ss · top X%` (singular `1 gate` handled)
- A `Live` chip on the current-week row
- A `View Replay` button that closes the Stats modal and launches either
  `WeeklyTournament.startCurrentWeek()` (live week) or `startArchiveWeek(key)`
  (past week). Saved-circuit restore is a no-op today, per the roadmap spec.

## Net changes

- **`index.html`** — third `.stats-tab` button (`#stats-tab-tournament`) + a
  hidden `#stats-tournament-pane` sibling of `#stats-cards-pane`. Cache-bust
  `?v=1781308800` → `?v=1781395200` across 11 references.
- **`css/style.css`** — `#stats-tournament-pane` fade-in animation reuses the
  Day 96 `tFadeIn` keyframe. New `.tournament-history-row` block defines layout,
  chip styling (`.th-chip-rank`, `.th-chip-podium`, `.th-chip-crowned`,
  `.th-chip-live`), and a light-mode mirror.
- **`js/main.js`** — new `WeeklyTournament.getSubmissionHistory()` method.
  Filters `this.data.byWeek` to entries with a numeric `score`, recomputes
  `rank` and `percentile` against the seeded pseudo-board per week (so older
  persisted values from pre-Day-72 builds can't render wrong), and sorts
  newest-first by `ts` with `weekKey` tiebreak.
- **`js/ui.js`** — three changes:
  1. `_switchStatsTab(which)` accepts `'tournament'`, validates the input
     against a whitelist (defaults to `'overview'` so stale `_activeStatsTab`
     values can never strand the modal on a hidden pane), and routes to
     `_renderTournamentHistoryGrid()`.
  2. `_updateStatsTabsUI()` updates the third tab's text, `.active`, and
     `.empty` classes (mirroring the My Cards pattern).
  3. New `_renderTournamentHistoryGrid()` method renders rows or the empty
     state; wires the Replay button click into `WeeklyTournament` after
     closing the modal.
- **`sw.js`** — `CACHE_NAME` `signal-circuit-v72` → `signal-circuit-v73`.

**LOC delta:** `index.html` (+5/-2), `css/style.css` (+76), `js/main.js` (+42),
`js/ui.js` (+90), `sw.js` (+1/-1) — **≈ +214/-3 net**.

## Verification phases

### P1 Build identity (5 assertions, all PASS)

- 11 cache-bust refs at `?v=1781395200`
- `sw.js` declares `signal-circuit-v73`
- `window.game` + `weeklyTournament` live
- Tournament tab + pane in DOM; companion Overview + Cards panes intact
- Tab strip exposes exactly 3 `.stats-tab` IDs (Overview / Cards / Tournament)

### P2 Tab strip cold (2 assertions, all PASS)

- Tournament tab text matches `/Tournament/`
- Cold `aria-selected="false"`

### P3 Stats modal default (2 assertions, all PASS)

Opening the modal lands on **Overview** (Day 96 default when card library is
empty). Both Cards and Tournament panes start hidden.

### P4 Empty-state Tournament tab (4 assertions, all PASS)

Switching to Tournament tab:
- Pane visible
- `.tournament-history-empty` rendered with `🏆 No tournament runs yet` copy
- Tab badge shows `(0)` and carries `.empty` class
- Tab becomes `.active`

### P5 Single submission (8 assertions, all PASS)

`weeklyTournament.submitScore(3, 25, 'Mochi')` against the current week:
- Row count = 1
- Tab label updates to `🏆 Tournament (1)`
- `.empty` class strips
- `.th-week` text matches `YYYY-Wxx` format
- Chip + stat string contain `3 gates` (plural handled) and `0:25` (mm:ss)
- Replay button renders with label `View Replay` and `data-current="1"`
- Submission return payload carries numeric `rank` + non-empty `weekKey`

### P6 Two distinct-week submissions (4 assertions, all PASS)

Backfill `2026-W18` directly into `byWeek` (older `ts`):
- Row count = 2
- Tab label `🏆 Tournament (2)`
- Current-week row sits above the archived `2026-W18` (newest-first)
- At least one row carries `data-current="0"`

### P7 Replay click (2 assertions, all PASS)

Stub `WeeklyTournament.startArchiveWeek` and `startCurrentWeek`. Click the
archived row's Replay button:
- Stub captured `{ kind: 'archive', key: '2026-W18' }`
- Stats modal closed (`display:none`)

### P8 Cold-start invariants (6 assertions, all PASS)

After `localStorage.clear()` + reload:
- How to Play + Settings buttons visible (Day 78 invariant)
- 50 level cards (Day 109 invariant)
- `#weekly-puzzle-btn` DOM absent (Day 79)
- `window.Gate` / `GateTypes` live (Day 92 ES module)
- `window.Wire` / `WireManager` live (Day 107 ES module)
- 7 Day 79 dead identifiers all `undefined`

### P9 Console hygiene (2 assertions, all PASS)

- 0 `Runtime.exceptionThrown`
- 0 real `console.error` (AudioContext autoplay warnings filtered as
  established noise)

## Open Bugs queue

**0 → 0** — streak now **36 consecutive days** since Day 76.

## Latent observations

**0 → 0.** LO-1 retired on Day 103. No new observations today.

## Roadmap status

**Cycle 5 BUILD Week complete.** Day 107 (wires.js ES module) → Day 108
(Tournament Worker go-live) → Day 109 (Lab Bench III) → Day 110 (Personal-best
badge) → **Day 111 (Tournament History tab).** Cycle 5 BUILD scorecard:
35 + 42 + 48 + 42 + 34 = **201 assertions across 5 days, 0 user-facing bugs,
0 regressions**.

**Day 112 (Friday)** opens Cycle 5 HARDEN Week — Day 1 Full Interaction Audit
(per `factory/prompts/signal-circuit-daily.md`).
