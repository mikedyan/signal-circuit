# Day 93 QA Report — Tournament Backend Worker Go-Live

**Date:** 2026-05-31 (Cycle 4 BUILD Week, Day 2 · cycleDay 41)
**Build under test:** `?v=1780358400` · `sw.js CACHE_NAME = 'signal-circuit-v62'`
**Harness:** `qa-reports/day-93-qa.cdp.js` (raw CDP over ws@8.20.0 via NODE_PATH)
**Headless:** Chromium 146.0.7663.0 on port 9301, permissive origins
**Mock worker:** `tools/tournament-worker/local-mock-worker.js` on 127.0.0.1:8902 (in-memory)

## Verdict

**24 / 24 assertions passed across 8 phases. 0 Runtime.exceptionThrown. 0 console.error.**

First-run pass — no harness iterations. 18-day open-bug-queue empty streak preserved.

## Phase-by-phase

### P1 — Build identity (4 / 4)

- ✅ P1.1: 11 cache-bust refs unified at `?v=1780358400`.
- ✅ P1.2: `js/main.js` HTTP body contains `refreshReachability` and `TOURNAMENT_WORKER_URL_LS_KEY` (proves new adapter shape shipped, not stale).
- ✅ P1.3: `sw.js` CACHE_NAME = `signal-circuit-v62`.
- ✅ P1.4: `tools/tournament-worker/` ships 4 files: `worker.js`, `wrangler.toml`, `local-mock-worker.js`, `README.md`.

### P2 — Cold-start surface unchanged (3 / 3)

- ✅ P2.1: `#level-select-screen` visible at cold start.
- ✅ P2.2: 2 non-level buttons (`#how-to-play-btn` + `#open-settings-btn`).
- ✅ P2.3: 43 level cards rendered.

### P3 — Default local mode, no LS overrides (2 / 2)

- ✅ P3.1: `gs.tournamentBackend.getMode() === 'local'`, `describe()` contains `🏠 Local leaderboard · same puzzle, deterministic …`.
- ✅ P3.2: `isLive() === false`.

### P4 — Remote configured + mock worker reachable (5 / 5)

After setting `localStorage('signal-circuit-tournament-backend','remote')` + `localStorage('signal-circuit-tournament-worker-url','http://127.0.0.1:8902')` and reloading:

- ✅ P4.1: Background reachability probe completes; `getMode() === 'remote'` within 4s.
- ✅ P4.2: `isLive() === true`, `describe()` is `🌐 Live leaderboard · cloud-synced`.
- ✅ P4.3: `adapter.constructor.name === 'RemoteTournamentAdapter'`.
- ✅ P4.4: `submitScore(4, 87, 'CDPHarness')` returns the sync-shape `{score: 427, weekKey: '2026-W23', rank, percentile, …}` (preserving the existing call-site contract).
- ✅ P4.5: Real network round-trip — querying the mock worker at `GET /leaderboard/2026-W23` returns the submitted entry with `total >= 1`. This proves the adapter's fire-and-forget POST landed at the worker, not just locally.

### P5 — Remote configured + worker unreachable (3 / 3)

After reconfiguring with `workerUrl = http://127.0.0.1:9999` (intentionally not listening):

- ✅ P5.1: Reachability probe times out; `getMode() === 'remote-fallback'` within 4s.
- ✅ P5.2: `isLive() === false`.
- ✅ P5.3: `describe()` is `🌐 Live · offline (using local for now)`.

### P6 — Mode toggle round-trip (2 / 2)

- ✅ P6.1: After clearing both LS keys and reloading, adapter falls back to `LocalTournamentAdapter` with `mode === 'local'`.
- ✅ P6.2: Explicit `localStorage.setItem('signal-circuit-tournament-backend','local')` + reload also resolves to `local`.

### P7 — Regression (3 / 3)

- ✅ P7.1: L1 core loop end-to-end — `gs.addGate('AND')` + 3 wires via `addWireFromData` + `runQuickTest()` persists `progress.levels['1'].stars === 3`.
- ✅ P7.2: Day 84 Lab Bench II L42 — `gateHardCap === 4`, `_validateLabConstraints()` with 5 gates returns `{ok:false, msg:'Submission rejected: 5 gates exceeds hard cap of 4.'}`.
- ✅ P7.3: Day 78 staircase end-game — 40 overflow buttons visible at `seedProgress(40, {stars:3})`.

### P8 — Console hygiene (2 / 2)

- ✅ P8.1: 0 `Runtime.exceptionThrown` across all 4 scenarios.
- ✅ P8.2: 0 `console.error`.

## Files exercised

- `index.html` (11 cache-bust refs at `?v=1780358400`)
- `sw.js` (CACHE_NAME bumped to v62)
- `js/main.js` (new `RemoteTournamentAdapter` with `refreshReachability`, `submitScore` POST, leaderboard prefetch; `selectTournamentBackend` adds worker URL LS key + kicks initial probe)
- `js/ui.js` (post-show reachability refresh in `showTournamentScreen`)
- `tools/tournament-worker/worker.js` (Cloudflare Worker source, not deployed)
- `tools/tournament-worker/wrangler.toml` (deploy config with placeholder KV ids)
- `tools/tournament-worker/local-mock-worker.js` (in-memory Node http server, 5.2KB, zero deps)
- `tools/tournament-worker/README.md` (API contract + deploy procedure)

## Notes

- The CDP harness boots and tears down the mock worker itself — no external orchestration required. `node qa-reports/day-93-qa.cdp.js` is the single entry point (provided port 9301 has a permissive headless Chromium up and port 8901 has the game's HTTP server).
- The `_lastReachable` cache TTL is 5000 ms, which is long enough that the harness's reload-cycle (3+ s) doesn't re-probe per check but short enough that a real user toggling LS in a tab gets a fresh result before the next tournament-screen view.
- `submitScore()` writes locally first (preserving the sync-shape return) and then fire-and-forgets the POST. The harness proves the POST lands within 100ms × 40 = 4s with retries; the actual median was the first poll (~100ms).
- No bumps to `tools/module-health.js` baseline today — module count is unchanged (10 JS files, 1 ESM), worker.js + mock-worker.js live under `tools/` and aren't part of the in-app dependency graph.
