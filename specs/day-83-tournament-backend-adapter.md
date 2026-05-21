# Day 83 — Tournament Backend Adapter Shell

**Cycle:** 3 · **Week:** Build · **Day:** 2 (cycleDay 31)
**Date:** 2026-05-21
**Theme:** Transport-shaped seam between WeeklyTournament gameplay and a future Cloudflare Worker + KV backend.

## Goal

Insert a thin adapter layer between the gameplay code that submits tournament scores and the existing `WeeklyTournament` class. The adapter exposes a small surface (`submitScore`, `getLeaderboard`, `getCombinedBoard`, `getMode`, `isLive`) that is identical for both:

- **LocalTournamentAdapter** — wraps current deterministic pseudo-leaderboard behavior. Default.
- **RemoteTournamentAdapter** — Worker-shaped skeleton that holds a `workerUrl` config and a `local` fallback. Never performs a network write until a Worker URL is explicitly configured. Until then it transparently falls back to the local adapter, so the player still sees a real rank/percentile.

This gives the codebase the right *shape* for a real backend (one call site, one async-friendly interface, one mode flag) without changing what ships to players.

## Why now

Roadmap (`roadmaps/cycle-3-build.md`, Day 83) flags this as the "one real competition foundation" target for Cycle 3. The Cycle 2 review called out leaderboards as the highest-value future investment, but flipping a real backend on day-one carries hosting, auth, anti-cheat, and rate-limit work. A transport seam unblocks that work without burning a build day on it.

## Items

1. New classes in `js/main.js` (placed directly after `WeeklyTournament`):
   - `TournamentBackend` — abstract base / interface.
   - `LocalTournamentAdapter` — wraps `WeeklyTournament` 1:1.
   - `RemoteTournamentAdapter` — holds `workerUrl` config + local fallback.
   - `selectTournamentBackend(weeklyTournament)` — detection function.
2. `GameState` now instantiates `this.tournamentBackend = selectTournamentBackend(this.weeklyTournament)` immediately after `this.weeklyTournament` is created.
3. The two `submitScore` call sites in `js/main.js` (gameplay-mode completion in `runSimulation` and `runQuickTest`) route through `this.tournamentBackend.submitScore(...)` instead of `this.weeklyTournament.submitScore(...)`.
4. Tournament screen now shows a single, calm mode label so the player understands whether the leaderboard is local or cloud-backed.
5. Service worker version + cache-bust query params bumped.

## Adapter interface

```js
class TournamentBackend {
  submitScore(gateCount, timeSec, displayName) { /* return { rank, percentile, isNewBest, score, podium, crowned, achievements, gates, time, weekKey } */ }
  getLeaderboard(weekKey)     { /* return [{ name, gates, time, score, isPlayer }] */ }
  getCombinedBoard(weekKey)   { /* same shape as wt.getCombinedBoard */ }
  getMode()                   { /* 'local' | 'remote-ready' | 'remote-live' */ }
  isLive()                    { /* true only when a real network round-trip is wired and reachable */ }
  describe()                  { /* short human-readable label, used by the UI */ }
}
```

The adapter contract intentionally returns *synchronously* in the local path because today's call sites are synchronous and a Promise refactor for the entire completion flow is out of scope for this day. The remote adapter still uses the same synchronous return shape: when no Worker is configured (the only state shipping today), it forwards to the local adapter immediately, so the gameplay code never sees a pending state.

A future Day will widen the return type to `Promise` and adjust both call sites in one change. Keeping that as a separate, focused day is part of the "surgical edits only" rule for Day 83.

## Config detection

Detection order (first match wins):

1. `window.__SC_TOURNAMENT_BACKEND__` — an explicit JS-level override of shape `{ mode: 'local' | 'remote', workerUrl?: string }`. Useful for QA and demos.
2. `localStorage.getItem('signal-circuit-tournament-backend')` — single string flag (`'local'` or `'remote'`). Stable across reloads.
3. Default: `'local'`.

`'remote'` mode without a `workerUrl` still produces a `RemoteTournamentAdapter`, but every call path falls through to its internal `LocalTournamentAdapter`. No network requests are issued. This guarantees the acceptance criterion "no external write required until credentials/Worker URL are explicitly configured".

## UI labels

`#tournament-screen` gains a single line under the existing week label:

- **Local mode (default):** `🏠 Local leaderboard · same puzzle, deterministic bots`
- **Remote-ready, no Worker configured:** `🌐 Cloud-ready · local fallback active (no Worker configured)`
- **Remote-live (future):** `🌐 Cloud leaderboard · live`

The label is populated by `UI.showTournamentScreen()` from `gameState.tournamentBackend.describe()`. No other tournament copy changes.

## Call site changes

```diff
- const submission = this.weeklyTournament.submitScore(
+ const submission = this.tournamentBackend.submitScore(
    gateCount, elapsed,
    (this.dailyLeaderboard && this.dailyLeaderboard.getDisplayName)
      ? this.dailyLeaderboard.getDisplayName()
      : 'You'
  );
```

Two occurrences (gameplay-mode completion + Quick Test branch in `runSimulation` / `runQuickTest`).

`WeeklyTournament.submitScore` continues to own:
- localStorage persistence (`signal-circuit-tournament-v1`)
- achievement unlocks (`tournament_podium`, `tournament_crowned`)
- rank / percentile computation

The adapter never re-implements that logic; it forwards.

## Verification

- ✅ `node -c js/main.js`
- ✅ Cache-bust unified across `index.html` `?v=1779897600` and `sw.js` `signal-circuit-v57`
- ✅ Tournament screen opens after seeding 18+ levels; three tabs render
- ✅ Default mode label reads `🏠 Local leaderboard…`
- ✅ `game.tournamentBackend.getMode()` returns `'local'`
- ✅ `game.tournamentBackend.submitScore(1, 5, 'QA')` returns `{ rank, percentile, isNewBest, score, podium, crowned, achievements, gates, time, weekKey }` with `rank` integer ≥ 1
- ✅ With `window.__SC_TOURNAMENT_BACKEND__ = {mode:'remote'}` re-init, `getMode()` returns `'remote-ready'`, the label switches to the cloud-ready string, and `submitScore` still returns a populated rank/percentile via local fallback (no console errors, no fetch attempted)
- ✅ Forcing a 1-gate, low-time submission unlocks `tournament_podium` and `tournament_crowned`
- ✅ 0 console errors / exceptions

## Out of scope

- Promise / async refactor of completion flow (Cycle 3 follow-up).
- Worker code itself (separate repo / future day).
- Auth / anti-cheat / rate-limit design.
- Schema versioning for cloud responses.

## Cache bust

- `?v=1779897600` (May 21 2026 00:00 UTC)
- `sw.js` `CACHE_NAME = 'signal-circuit-v57'`
