# Day 83 QA Report — Tournament Backend Adapter Shell

**Date:** 2026-05-21
**Build under test:** `?v=1779897600`, `sw.js CACHE_NAME = 'signal-circuit-v57'`
**Harness:** raw CDP against permissive headless Chromium on port 9301 + localhost server `:8901`
**Result:** PASS

## Verification

- ✅ Syntax: `node -c js/main.js`, `node -c js/ui.js`.
- ✅ Build identity: 11 `?v=` refs all unified at `1779897600`; SW controller resolved to `http://localhost:8901/sw.js`.
- ✅ Adapter exists by default:
  - `game.tournamentBackend.constructor.name` = `LocalTournamentAdapter`
  - `getMode()` = `'local'`
  - `isLive()` = `false`
  - `describe()` = `🏠 Local leaderboard · same puzzle, deterministic bots`
  - `window.{TournamentBackend, LocalTournamentAdapter, RemoteTournamentAdapter, selectTournamentBackend}` all defined.
- ✅ After `game.seedProgress(20)`, `#tournament-btn` visible on level-select.
- ✅ Tournament screen opens with 3 tabs (`This Week`, `My Best`, `Archive`) and 3 panes; leaderboard renders 10 rows.
- ✅ Mode label visible under week label: `🏠 Local leaderboard · same puzzle, deterministic bots`.
- ✅ `game.tournamentBackend.submitScore(1, 5, 'QA')` returns:
  ```json
  {
    "rank": 1,
    "percentile": 98,
    "isNewBest": true,
    "score": 100,
    "podium": true,
    "crowned": true,
    "achievements": ["tournament_podium", "tournament_crowned"],
    "gates": 1,
    "time": 5,
    "weekKey": "2026-W21"
  }
  ```
  All required keys present (`rank`, `percentile`, `isNewBest`, `score`, `weekKey`, `achievements`), `rank ≥ 1`, `achievements` is an array.
- ✅ Achievement unlocks fire:
  - `tournament_podium` → unlocked (rank 1 ≤ 3).
  - `tournament_crowned` → unlocked (rank 1).
- ✅ Toggle `window.__SC_TOURNAMENT_BACKEND__ = {mode:'remote'}` and re-init:
  - `constructor.name` = `RemoteTournamentAdapter`
  - `getMode()` = `'remote-ready'`
  - `isLive()` = `false`
  - `describe()` = `🌐 Cloud-ready · local fallback active (no Worker configured)`
  - `submitScore(2, 12, 'QA-remote')` still returns a populated `{rank, percentile, isNewBest, score}` (rank 1, percentile 98, score 200) — local fallback engaged, no fetch attempted.
- ✅ Re-opening tournament screen with remote mode active updates the mode label to the cloud-ready string.
- ✅ Configured `workerUrl`: `describe()` flips to `🌐 Cloud-ready · Worker URL set, awaiting go-live`; `isLive()` still `false` (no live mode yet).
- ✅ `localStorage.setItem('signal-circuit-tournament-backend', 'remote')` (without the window override) also produces a `RemoteTournamentAdapter` after re-init.
- ✅ Restoring defaults (no override, no localStorage flag) returns a `LocalTournamentAdapter` with `getMode()` = `'local'`.
- ✅ Console: 0 JS errors / exceptions across the entire QA suite.

## Notes

The QA harness stubs `navigator.vibrate()` (Day 82 pattern) to silence the browser's “Blocked call to navigator.vibrate because user hasn't tapped…” warning during programmatic interactions. With that stub in place, console error count is 0.

The remote adapter never issues a `fetch()` call today, by design. Day 83's contract is *plumbing only*; a future day will wire a real Worker URL, schema versioning, and live mode.
