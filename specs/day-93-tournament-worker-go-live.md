# Day 93 — Tournament Backend Worker Go-Live

**Cycle 4 BUILD Week, Day 2 (cycleDay 41)** · 2026-05-31

## Thesis

Day 83 shipped an adapter shell: `LocalTournamentAdapter` (live) and `RemoteTournamentAdapter` (skeleton). `selectTournamentBackend()` already routes by `window.__SC_TOURNAMENT_BACKEND__` → `localStorage('signal-circuit-tournament-backend')` → default `'local'`. Day 93 promotes the remote adapter from "ready-to-wire" to "wired" by:

1. Shipping deployable Worker source (Cloudflare Worker shape) **without deploying it** — no Cloudflare credentials are wired into this environment. The deploy procedure is documented for a future credentialed run.
2. Shipping a Node.js mock worker that mimics the same HTTP API on `localhost:8902` — this is what the CDP harness actually talks to.
3. Replacing `RemoteTournamentAdapter`'s pass-through stubs with real `fetch()` calls that POST/GET against the configured worker URL, with a transparent fallback to `LocalTournamentAdapter` on any network failure (DNS, connection refused, timeout, non-2xx).
4. Distinguishing three remote-side modes in the UI: `remote` (configured + reachable → 🌐 Live), `remote-fallback` (configured + unreachable → 🌐 Live · offline), `cloud-ready` (configured but not yet contacted, or future state).

## Mechanism

### Worker API (production-ready, ships in `tools/tournament-worker/worker.js`)

- `GET /health` → `{ok: true, mode: 'cloudflare-worker'}` (200, JSON)
- `POST /scores` body `{weekKey, gates, time, score, name, meta?}` → `{ok: true, rank, total}` (200)
- `GET /leaderboard/:weekKey` → `{ok: true, weekKey, entries: [{name, gates, time, score, ts}], total}` (200)
- CORS: `Access-Control-Allow-Origin: *` (read-only data, no auth)

KV layout: one key per weekKey holding a JSON array sorted by score ascending (lower = better). Cap stored to top 50.

### Mock worker (`tools/tournament-worker/local-mock-worker.js`)

Pure Node http server. In-memory `Map<weekKey, sortedArray>`. Same routes. Boots in <100ms; no deps. The CDP harness `node tools/tournament-worker/local-mock-worker.js &` before tests.

### `RemoteTournamentAdapter` rewrite (in `js/main.js`)

- `_isConfigured()`: unchanged signature — true iff `workerUrl` is a non-empty string.
- `_isReachable()` (new, async): `GET ${workerUrl}/health` with `AbortController` 1.2s timeout. Returns boolean. Caches the last result for `REACH_TTL_MS = 5000` ms to avoid hammering the health endpoint on every getMode() call. Sync `getMode()` reads the cache; an internal `refreshReachability()` writes it.
- `submitScore(gateCount, timeSec, displayName)`:
  - Compute `submission = LocalTournamentAdapter.submitScore(...)` first (this also persists locally and returns the sync-shaped object the existing UI code expects).
  - Fire-and-forget a `POST /scores` to the worker with `{weekKey, gates: gateCount, time: timeSec, score: submission.score, name: displayName, meta: {client: 'signal-circuit', ts: Date.now()}}`. Failures swallowed.
  - Return the local `submission` synchronously. This preserves the existing call-site contract (no Promise refactor) while still cloud-publishing the score.
- `getLeaderboard(weekKey)`: synchronous return of `local.getLeaderboard(weekKey)`. Async refresh-from-server runs in the background on every call and merges into a cached `_remoteBoardCache[weekKey]` for the next render. Out of scope today: render the merged board in the UI — that's a Day 96+ snapshot library job.
- `getMode()`: returns `'remote'` when `_isConfigured() && _lastReachable === true`; `'remote-fallback'` when `_isConfigured() && _lastReachable === false`; `'cloud-ready'` when configured but reachability hasn't been checked yet. Never returns `'local'`.
- `describe()`: distinct labels per mode:
  - `remote`: `🌐 Live leaderboard · cloud-synced`
  - `remote-fallback`: `🌐 Live · offline (using local for now)`
  - `cloud-ready`: `🌐 Cloud-ready · Worker URL set, awaiting first ping`
- `isLive()`: true only in `remote` mode.

### `selectTournamentBackend()` shape

Unchanged. Same three-layer detection. When mode resolves to `'remote'`, the adapter is constructed with `{ workerUrl }`. A new top-of-construction call kicks off `adapter.refreshReachability()` so the first `showTournamentScreen()` after game init has a populated mode.

### UI badge

`js/ui.js` already calls `backend.describe()` and pipes the result into `#tournament-mode-label` (Day 83 wired this). No HTML changes needed. The new `describe()` labels render automatically. The `aria-live="polite"` attribute already on the element will announce mode transitions.

Optional polish: re-call `setText('tournament-mode-label', ...)` after a short delay so a fresh reachability ping result paints into the chip without requiring a screen close+reopen. Implemented as a 1.5s post-show refresh hook.

## Acceptance

1. `tools/tournament-worker/worker.js` + `wrangler.toml` + `README.md` shipped. Wrangler config production-ready (`compatibility_date`, `kv_namespaces` placeholder).
2. `tools/tournament-worker/local-mock-worker.js` boots on port 8902 with `node tools/tournament-worker/local-mock-worker.js`. Health check returns `{ok:true}`.
3. `RemoteTournamentAdapter` rewritten per spec; CDP harness asserts all 4 scenarios:
   - **(a) Default local mode**: `gs.tournamentBackend.getMode() === 'local'`, describe contains `🏠`.
   - **(b) Remote configured + worker reachable**: After setting `localStorage('signal-circuit-tournament-backend','remote')` + `localStorage('signal-circuit-tournament-worker-url','http://localhost:8902')` + reload + `refreshReachability()`, `getMode() === 'remote'`, `isLive() === true`, describe contains `🌐`. After a `submitScore()` call, the mock worker reports the score on its in-memory `/leaderboard/:weekKey`.
   - **(c) Remote configured + worker unreachable**: Configure with a dead URL (`http://localhost:9999`), force reachability refresh, expect `getMode() === 'remote-fallback'`, describe contains `🌐 Live · offline`, `isLive() === false`.
   - **(d) Mode toggle round-trip**: Setting LS to `'local'` then reloading reverts to `getMode() === 'local'`.
4. Cache-bust `?v=1780272000` → `?v=1780358400` across 11 refs in `index.html`. SW `signal-circuit-v61` → `signal-circuit-v62`.
5. 0 console.error + 0 Runtime.exceptionThrown across all 4 scenarios.
6. Day 78 staircase + Day 84 L42 hard cap + L1 core loop regressions still pass.

## Out of scope

- **Real Cloudflare deployment.** No creds wired. The worker source is shippable, but `wrangler deploy` is operator-action.
- **Auth / anti-cheat / rate limits.** Worker is open POST. Real production deploy would add `Cloudflare Turnstile` or HMAC. Day 93 ships the network seam; security hardening is a future BUILD day.
- **Merged leaderboard UI.** Today only `submitScore()` round-trips to cloud. The tournament screen still renders `local.getCombinedBoard()`. Cloud reads populate a cache; a future Polish/BUILD day will switch the renderer to merged data.
- **Schema migration.** Today's POST shape is `v1`. Worker silently ignores unknown fields; client silently absorbs missing fields on read.

## Risks

- **Reachability check during page load.** The `_isReachable()` call shouldn't block UI. Mitigation: fully async, cached for 5s; first call kicks off in background and `getMode()` returns `'cloud-ready'` until the result lands.
- **Mock worker hangs CDP harness.** Mitigation: harness kills mock worker in a `finally` block; CDP teardown is unconditional.
- **CORS in headless Chromium.** Mitigation: mock worker sets `Access-Control-Allow-Origin: *` + responds to `OPTIONS`. The Day 83 lessons noted localhost CDP works fine; this is the same setup.

## Files touched

- `js/main.js` — `RemoteTournamentAdapter` body + `selectTournamentBackend()` reachability kickoff (surgical).
- `js/ui.js` — 1.5s post-show refresh hook (surgical).
- `index.html` — 11 cache-bust refs.
- `sw.js` — CACHE_NAME bump.
- `tools/tournament-worker/worker.js` — new (~120 LOC, deployable to Cloudflare).
- `tools/tournament-worker/wrangler.toml` — new (~20 LOC).
- `tools/tournament-worker/local-mock-worker.js` — new (~120 LOC, zero deps).
- `tools/tournament-worker/README.md` — new (deploy procedure + API contract).
- `specs/day-93-tournament-worker-go-live.md` — this file.
- `qa-reports/day-93-qa.cdp.js` — new harness.
- `qa-reports/day-93-qa.md` — new QA report.
- `build-reports/day-93-build.md` — new build report.
- `BUGS.md` — Day 93 entry.
- `LESSONS_LEARNED.md` — 5–8 Day 93 lessons.
- `FACTORY_STATE.json` — `days['93']` + `status`/`lastRunNote`/`lastRun`/`nextCycle`.
