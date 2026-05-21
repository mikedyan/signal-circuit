# Day 83 Build Report — Tournament Backend Adapter Shell

**Date:** 2026-05-21
**Cycle:** 3 BUILD Week, Day 2 (cycleDay 31)
**Feature:** Tournament Backend Adapter Shell
**Commit target:** Day 83

## What Shipped

- Introduced a transport-shaped adapter seam between gameplay completion and `WeeklyTournament`:
  - `TournamentBackend` — interface (submitScore / getLeaderboard / getCombinedBoard / getMode / isLive / describe).
  - `LocalTournamentAdapter` — wraps current `WeeklyTournament` 1:1, preserves all deterministic behavior.
  - `RemoteTournamentAdapter` — Worker-shaped skeleton with `workerUrl` config + local fallback. No network writes today; gracefully forwards to local until live mode is wired.
  - `selectTournamentBackend(weeklyTournament)` — picks the adapter based on `window.__SC_TOURNAMENT_BACKEND__` → `localStorage('signal-circuit-tournament-backend')` → `'local'` default.
- Wired `GameState.tournamentBackend = selectTournamentBackend(this.weeklyTournament)` immediately after the `WeeklyTournament` instance is created.
- Routed both `submitScore` call sites in `runSimulation` and `runQuickTest` through `this.tournamentBackend.submitScore(...)` (with a `weeklyTournament` fallback guard for paranoia).
- Added `#tournament-mode-label` to the tournament screen and populated it from `tournamentBackend.describe()` in `UI.showTournamentScreen()`:
  - Local: `🏠 Local leaderboard · same puzzle, deterministic bots`
  - Remote, no Worker: `🌐 Cloud-ready · local fallback active (no Worker configured)`
  - Remote, Worker URL set (no live mode yet): `🌐 Cloud-ready · Worker URL set, awaiting go-live`
- Exposed `TournamentBackend`, `LocalTournamentAdapter`, `RemoteTournamentAdapter`, `selectTournamentBackend` on `window` for QA harnesses and future tests.
- Cache bust updated to `?v=1779897600`; service worker bumped to `signal-circuit-v57`.

## Files Changed

- `specs/day-83-tournament-backend-adapter.md` — new spec and QA plan.
- `js/main.js` — adapter classes, `selectTournamentBackend()`, GameState wiring, two routed call sites.
- `js/ui.js` — mode label population in `showTournamentScreen`.
- `index.html` — `#tournament-mode-label` element + cache-bust query strings (×11) bumped to `1779897600`.
- `sw.js` — `CACHE_NAME` → `signal-circuit-v57`.
- `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` — factory state and docs updated.

## Design Notes

- **Surgical, additive shape.** The adapter classes live alongside `WeeklyTournament`, not on top of it. The `WeeklyTournament` API is unchanged, so the existing tournament screen, archive logic, ISO-week math, and pseudo-leaderboard generation are untouched. The seam is at the *call site*, which is the cheapest place to add a transport boundary.
- **Local-first by default.** The default adapter is `LocalTournamentAdapter`. No new screens, no new modals, no new buttons. A player who never opens the dev console sees exactly what shipped on Day 72, plus a single calm mode label.
- **Remote mode that never writes.** `RemoteTournamentAdapter.submitScore` *intentionally* forwards to its internal local adapter today. Cloud go-live is a separate decision (auth, anti-cheat, rate limits) and will arrive as its own day. Anything else risks accidental data leakage during development.
- **Synchronous return preserved.** Both call sites in gameplay completion are synchronous and use `submission.score`, `submission.rank`, etc. directly in `updateResultDisplay`/`updateStatusBar`. Widening to a `Promise` would have rippled through the celebration / achievement toast / status bar flow. That refactor is queued for a later day, when a real cloud call is actually wired.
- **Label, don't lecture.** The mode label is a single soft-grey line under the week label — enough for a player to know what kind of leaderboard they're looking at, without burning real estate or attention.

## Verification

- `node -c js/main.js` ✅
- `node -c js/ui.js` ✅
- Localhost CDP QA (see `qa-reports/day-83-qa.md`): 0 JS errors, all adapter shape checks pass, achievements still fire, label flips on remote toggle.
