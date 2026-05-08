# Day 72 — Weekly Tournament Mode + Cycle Polish

**Cycle:** 2 · **Week:** Build · **Day:** 5 (cycleDay 20)
**Date:** 2026-05-08
**Theme:** Closing the build week with a tournament-shaped surface and a polish sweep.

## Goal

Add a weekly tournament loop on top of the existing weekly puzzle: pre-screen with leaderboard + your best + last-8-week archive, single-shot scoring, and two new chase achievements. No backend; everything client-side, deterministic per ISO week.

## Items

1. `WeeklyTournament` class in `main.js` with seeded weekly puzzle (`year-week`)
2. `🏆 Tournament` button on level-select (tier3 gating: 18+ levels completed)
   - When tier3 is reached, hide `weekly-puzzle-btn` (tournament screen subsumes it)
3. Tournament screen shows: this week's puzzle preview, pseudo-leaderboard (50), your best, archive of last 8 weeks
4. Single-shot scoring: `score = gates × 100 + max(0, timeSec - 60)` (lower wins)
5. Tournament archive — last 8 weeks browsable, click loads that week's puzzle for replay (no new score)
6. Two new gold achievements:
   - `tournament_podium` — Podium (top-3 in any week)
   - `tournament_crowned` — Crowned (1st in any week)
7. Polish: cache-bust query strings audited end-to-end (matching v across all asset refs)
8. Polish: single CSS pass for new HUD elements introduced Mon–Thu (lab-hud, infinite-hud, mythic-celebration, tournament screen)
9. Polish: pick one shippable micro-win from PROACTIVITY backlog if appropriate
10. Cache bust + service worker v50 + write `reviews/build-cycle-2-week-summary.md`

## Implementation

- `WeeklyTournament` exposes:
  - `getCurrentWeek()` → `{ year, isoWeek, key: "YYYY-Www" }`
  - `getCurrentPuzzle()` → wraps `generateWeeklyPuzzle()` and adds `isTournament:true`, `weekKey`
  - `getArchivePuzzle(weekKey)` → reproduces a past week's puzzle (deterministic via seed)
  - `getLeaderboard(weekKey)` → 50 pseudo scores (Gaussian-ish around optimal+2 gates / 60s)
  - `submitScore(gates, timeSec)` → returns `{ rank, percentile, isNewBest, score }` and persists best
  - `getBest(weekKey)` → returns `{ gates, time, score, rank, percentile }` if attempted
  - `lockWeek(weekKey)` (Sunday midnight PT) — frozen reads, archive only
- Persist under `signal-circuit-tournament-v1`:
  ```
  { byWeek: { "2026-W19": { gates, time, score, rank, percentile, attempted: true } }, totalAttempts, podiums, wins }
  ```
- Completion intercept in `runSimulation` and `runQuickTest`: if `currentLevel.isTournament`, route through `weeklyTournament.onSolve(gateCount, timeSec)` BEFORE the standard challenge/campaign branches
- Tournament screen render via `UI.showTournamentScreen()` with three tabs: This Week / My Best / Archive
- Achievement unlocks happen inside `submitScore`

## Surfaces touched

- `js/main.js` — `WeeklyTournament` class, GameState wiring, completion intercept
- `js/achievements.js` — 2 new gold achievements
- `js/ui.js` — gating, tournament screen render, archive list, tab switcher
- `index.html` — Tournament button, tournament-screen DOM
- `css/style.css` — tournament-screen styles + cycle polish pass
- `sw.js` — CACHE_NAME → v50
- `reviews/build-cycle-2-week-summary.md` — week recap, score, LOC delta, lessons

## Verification

- Cold start: 5 visible buttons (no tournament yet)
- Seed 6 levels: tier1 reveals daily/encyclopedia/stats
- Seed 12 levels: tier2 reveals weekly + adaptive + infinite + random + blitz + speedrun + sandbox + advanced info
- Seed 18 levels: tier3 reveals tournament-btn, hides weekly-puzzle-btn
- Open Tournament: see this-week preview + leaderboard + your best (empty) + archive (empty)
- Play tournament puzzle: score persists, rank/percentile shown, podium achievement at top-3, crowned at 1st
- Archive: last 8 weeks browsable, deterministic replay
- 0 console errors

## Cache bust

- `?v=1779292800` (May 8 2026 00:00 UTC, the most recent shippable boundary used so far)
- `sw.js` CACHE_NAME → `signal-circuit-v50`
