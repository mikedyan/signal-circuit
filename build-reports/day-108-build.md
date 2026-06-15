# Day 108 Build Report — Cycle 5 BUILD Week, Day 2

**Feature:** Tournament Worker Go-Live (cloud leaderboard surfaces in the rendered top-10).
**Date:** 2026-06-15 (Monday) · cycleDay 56
**Roadmap:** `roadmaps/cycle-5-build.md` Day 108
**Build identity:** `?v=1781136000` / `sw signal-circuit-v70`

## What shipped

Day 93 shipped the `RemoteTournamentAdapter` shell with cloud-ready / remote / remote-fallback state machine + fire-and-forget POST to `/scores` + reachability probe. Day 108 closes the loop by surfacing real cloud entries in the rendered Tournament screen and lands the roadmap-spec REST surface.

### Worker (Cloudflare + Node mock)
- `tools/tournament-worker/worker.js` + `tools/tournament-worker/local-mock-worker.js`: new `POST /submit/:weekKey` URL-keyed alias. Legacy `POST /scores` preserved.
- `wrangler.toml` binding renamed `SIGNAL_CIRCUIT_TOURNAMENT → TOURNAMENT_KV` per roadmap; `worker.js` reads either binding for back-compat.
- Response payloads now echo `weekKey` so clients can verify the URL-keyed route landed on the right week.
- `400` returned on invalid weekKey shape in either route.

### Client adapter (`js/main.js`)
- `TournamentBackend` base class: inert defaults `getRemoteEntries() → null`, `onBoardUpdate() → () => {}` so renderers never type-sniff.
- `RemoteTournamentAdapter.getRemoteEntries(weekKey)`: sync cache reader.
- `RemoteTournamentAdapter.onBoardUpdate(weekKey, cb)`: register/dispose listener pair.
- `_emitBoardUpdate(weekKey)` fires registered listeners after `/leaderboard/:weekKey` fetch lands.

### Renderer (`js/ui.js`)
- `showTournamentScreen()`: dispose prior listener, register a fresh one for this week's key, kick `backend.getLeaderboard(info.key)` so the async fetch fires the listener.
- `_renderTournamentLeaderboard()`: when mode is `remote` AND `getRemoteEntries(weekKey).length > 0`, render cloud entries merged with player's local best, sorted by score, top 10, with `.tournament-row-cloud` class + 🌐 (or ⭐ for self) prefix. Else falls back to local pseudo-board verbatim.
- Renderer applies `.replace(/[<>&]/g, ...)` HTML-escape on cloud `name` before injecting (user-submitted data hardening).

### CSS (`css/style.css`)
- `.tournament-row-cloud` cyan-tinted (border-left + subtle bg).
- `.tournament-row-cloud.tournament-row-self` gold override.
- Light-mode mirrors.

### Cache identity
- `index.html` 11 `?v=…` refs bumped `1781049600 → 1781136000`.
- `sw.js` `CACHE_NAME` bumped `signal-circuit-v69 → signal-circuit-v70`.

## How to flip a real player into remote mode

```js
localStorage.setItem('signal-circuit-tournament-backend', 'remote');
localStorage.setItem('signal-circuit-tournament-worker-url', 'https://signal-circuit-tournament.<account>.workers.dev');
location.reload();
```

`#tournament-mode-label` will read `🌐 Connecting…` for ~1s while the `/health` probe runs, then settle to `🌐 Live leaderboard` (reachable) or `🌐 Live · offline` (unreachable). If the latter, no Day-108 behavior change vs. the local pseudo-board.

## QA

`qa-reports/day-108-qa.cdp.js`: 48/48 assertions across 9 phases on second run.
Full report: `qa-reports/day-108-qa.md`.

## LOC delta

- `js/main.js`: ~+50/-2
- `js/ui.js`: ~+55/-15
- `css/style.css`: ~+10
- `tools/tournament-worker/worker.js`: ~+30/-10
- `tools/tournament-worker/local-mock-worker.js`: ~+20/-3
- `tools/tournament-worker/wrangler.toml`: binding name + 5-line comment
- `tools/tournament-worker/README.md`: alias route + TODO strikethrough
- `index.html` + `sw.js`: cache-bust

Net ~+170 LOC, dominated by the new adapter listener + cloud render branch + REST alias.

## Day 109 lock

Cycle 5 BUILD Week Day 3 — Lab Bench III mini-chapter (L46-L50) with fan-out budget. Composite with NAND-only + hardCap. Per `roadmaps/cycle-5-build.md`.
