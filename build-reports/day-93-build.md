# Day 93 Build Report — Tournament Backend Worker Go-Live

**Date:** 2026-05-31 (Cycle 4 BUILD Week, Day 2 · cycleDay 41)
**Cache-bust:** `?v=1780272000` → `?v=1780358400`
**SW version:** `signal-circuit-v61` → `signal-circuit-v62`

## What shipped

Day 83 left a working `LocalTournamentAdapter` and a skeleton `RemoteTournamentAdapter` that just delegated everything back to local. Day 93 promotes the remote adapter to a real, network-aware implementation, plus a deployable Cloudflare Worker (not actually deployed today — no credentials in scope) and a Node-only mock worker that the CDP harness drives.

### Adapter changes (`js/main.js`)

- `RemoteTournamentAdapter` rewritten:
  - **State:** `_lastReachable` (`null | true | false`), `_lastReachAt` (ms timestamp), `_reachInFlight` (de-dupe Promise), `_remoteBoardCache` (per-week entry list).
  - **`refreshReachability()`:** async `fetch(workerUrl + '/health')` with `AbortController` 1.2s timeout. Result cached for 5s. Concurrent calls return the same in-flight Promise. Failure → `_lastReachable = false`.
  - **`submitScore()`:** always returns the local sync-shape (so the existing call-site contract `submission.score` / `submission.rank` still works). Then fire-and-forget POSTs `{weekKey, gates, time, score, name, meta}` to `${workerUrl}/scores`. POST success updates `_lastReachable=true`; failure flips to false. Network errors swallowed.
  - **`getLeaderboard(weekKey)`:** synchronous return of `local.getLeaderboard()`. Kicks off async `GET /leaderboard/:key` to populate `_remoteBoardCache` for the next render. The cache isn't read by the UI yet — that's a Day 96+ snapshot-library job.
  - **`getMode()`:** `'remote'` when configured + reachable; `'remote-fallback'` when configured + unreachable; `'cloud-ready'` when configured but reachability hasn't been probed yet. Never returns `'local'`.
  - **`isLive()`:** `true` iff `getMode() === 'remote'`.
  - **`describe()`:** three distinct labels:
    - `🌐 Live leaderboard · cloud-synced` (remote)
    - `🌐 Live · offline (using local for now)` (remote-fallback)
    - `🌐 Cloud-ready · Worker URL set, awaiting first ping` (cloud-ready / probe-in-flight)

- `selectTournamentBackend()` gains a worker-URL detection layer (`localStorage('signal-circuit-tournament-worker-url')`) and kicks off `adapter.refreshReachability()` synchronously so the first `showTournamentScreen()` after game init has a populated mode cache.

- New constants near the adapter: `TOURNAMENT_WORKER_URL_LS_KEY`, `TOURNAMENT_REACH_TTL_MS = 5000`, `TOURNAMENT_REACH_TIMEOUT_MS = 1200`.

### UI changes (`js/ui.js`)

- `showTournamentScreen()` now calls `backend.refreshReachability()` after the initial `setText('tournament-mode-label', describe())` paint, and re-paints once the probe resolves. Guarded so a closed-then-reopened screen doesn't write into a hidden element.
- No HTML changes — the `#tournament-mode-label` chip from Day 83 already exists and is `aria-live="polite"`.

### Worker source (`tools/tournament-worker/`)

- **`worker.js`:** Cloudflare Worker module (~120 LOC). Three routes: `GET /health`, `POST /scores`, `GET /leaderboard/:weekKey`. KV-backed (binding `SIGNAL_CIRCUIT_TOURNAMENT`), top-50 cap, weekKey regex-validated (`^\d{4}-W\d{2}$`). CORS open (read-only data).
- **`wrangler.toml`:** Deploy config with placeholder KV ids (intentionally — a misconfigured deploy can't silently write to a stranger's namespace).
- **`local-mock-worker.js`:** Zero-dep Node http server (~140 LOC) on port 8902. In-memory Map. Same API plus a debug `POST /__reset` for harness use. Handles SIGINT/SIGTERM gracefully.
- **`README.md`:** API contract + deploy procedure + TODO list (auth, rate limiting, schema versioning, merged-leaderboard UI).

### Cache-bust + SW

- `index.html`: 11 `?v=1780272000` → `?v=1780358400` (CSS + 10 JS files unified).
- `sw.js`: `CACHE_NAME = 'signal-circuit-v61'` → `'signal-circuit-v62'`.

## LOC delta

| File | LOC before | LOC after | Δ |
| --- | --- | --- | --- |
| `js/main.js` | 5454 | 5594 | +140 |
| `js/ui.js` | unchanged shape | +14 | +14 |
| `index.html` | 11 sed-substitutions only | — | 0 |
| `sw.js` | 1 line changed | — | 0 |
| `tools/tournament-worker/worker.js` | 0 | 110 | +110 |
| `tools/tournament-worker/wrangler.toml` | 0 | 18 | +18 |
| `tools/tournament-worker/local-mock-worker.js` | 0 | 152 | +152 |
| `tools/tournament-worker/README.md` | 0 | 95 | +95 |
| `qa-reports/day-93-qa.cdp.js` | 0 | 451 | +451 |

Net production code delta: **+264 LOC** (140 main.js + 14 ui.js + 110 worker.js). The remainder is QA harness, deploy infra, docs.

## QA

24 / 24 assertions across 8 CDP phases. 0 Runtime.exceptionThrown. 0 console.error. First-run pass.

Full report: `qa-reports/day-93-qa.md`. Harness: `qa-reports/day-93-qa.cdp.js`.

## Bugs

- 0 open at start of day. 0 found. 0 fixed. 0 open at end of day.
- 18-day open-queue empty streak (since Day 76).
- LO-1 still deferred to Cycle 4 PRUNE Week.

## Verification gates

- `node -c js/main.js` — clean
- `node -c js/ui.js` — clean
- `node -c tools/tournament-worker/local-mock-worker.js` — clean
- `node -c tools/tournament-worker/worker.js` — uses `export default` (Worker module syntax) — only valid in a module context; Cloudflare Workers eval it as ESM. Local Node `-c` skipped for this file.
- Curl smoke-tested mock worker: `/health`, `POST /scores`, `GET /leaderboard/:wk` all 200.
- CDP harness verified real network round-trip: score submitted from headless Chromium → mock worker → board read confirms the entry.

## Deferred work (TODO list in `tools/tournament-worker/README.md`)

- Real Cloudflare deploy (operator-action; placeholder KV ids in `wrangler.toml`).
- Auth / anti-cheat (Turnstile or HMAC).
- Rate limiting (per-IP KV counter or Turnstile).
- Schema version field on POST body.
- Merged leaderboard UI (cloud entries blended into the rendered top-10 — today only cached server-side).
