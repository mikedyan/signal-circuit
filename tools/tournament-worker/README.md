# Signal Circuit — Tournament Backend Worker

Day 93 (Cycle 4 BUILD Week, Day 2) ships the backend half of the live tournament leaderboard. The game's `RemoteTournamentAdapter` (in `js/main.js`) talks to this Worker.

## Files

| File | Purpose |
| --- | --- |
| `worker.js` | Cloudflare Worker module. Production target. |
| `wrangler.toml` | Worker config: name, compat date, KV namespace binding. |
| `local-mock-worker.js` | Node http server with the same API. Used for CDP harness + local dev. **No deps.** |
| `README.md` | This file. |

## API contract

CORS: `Access-Control-Allow-Origin: *` (read-only data; no auth today — see TODO).

### `GET /health`

```json
{ "ok": true, "mode": "cloudflare-worker" | "local-mock-worker", "ts": 1717145600000 }
```

### `POST /scores`

Request body:

```json
{
  "weekKey": "2026-W22",
  "gates": 4,
  "time": 87,
  "score": 487,
  "name": "Mike",
  "meta": { "client": "signal-circuit", "ts": 1717145600000 }
}
```

Response (200):

```json
{ "ok": true, "rank": 3, "total": 12 }
```

400 on invalid payload (`invalid_json`, `invalid_payload`).

### `GET /leaderboard/:weekKey`

```json
{
  "ok": true,
  "weekKey": "2026-W22",
  "entries": [
    { "name": "Mike", "gates": 4, "time": 87, "score": 487, "ts": 1717145600000 }
  ],
  "total": 12
}
```

Capped at top 50 entries sorted by `score` ascending (lower wins).

`weekKey` must match `^\d{4}-W\d{2}$` (e.g. `2026-W22`) — same shape as `WeeklyTournament.getCurrentWeekInfo().key`.

## Local mock

```bash
node tools/tournament-worker/local-mock-worker.js --port 8902
```

In-memory store; restart wipes everything. Optional debug route `POST /__reset` empties the store.

The Day 93 CDP harness boots the mock on `127.0.0.1:8902`, points `localStorage('signal-circuit-tournament-worker-url')` at it, and asserts both the configured-and-reachable and configured-but-unreachable paths.

## Cloudflare deploy procedure (operator-action)

`wrangler` is not invoked by the factory because no Cloudflare credentials are wired in. To deploy from a credentialed machine:

```bash
cd tools/tournament-worker

# 1. Create KV namespaces (one prod, one preview)
wrangler kv:namespace create SIGNAL_CIRCUIT_TOURNAMENT
wrangler kv:namespace create SIGNAL_CIRCUIT_TOURNAMENT --preview

# 2. Paste the returned ids into wrangler.toml under [[kv_namespaces]].id / preview_id

# 3. Deploy
wrangler deploy

# 4. Note the assigned workers.dev URL. Paste it into the game by running
#    in DevTools console:
#       localStorage.setItem('signal-circuit-tournament-backend', 'remote')
#       localStorage.setItem('signal-circuit-tournament-worker-url',
#                            'https://signal-circuit-tournament.<account>.workers.dev')
#    and reload.
```

`wrangler.toml` ships with placeholder ids; deploy will fail until they are replaced — this is intentional so an accidental deploy can't silently write to a different account's namespace.

## Client integration (already shipped in Day 93)

```js
// One-time bootstrap in DevTools console:
localStorage.setItem('signal-circuit-tournament-backend', 'remote');
localStorage.setItem('signal-circuit-tournament-worker-url', 'http://localhost:8902');
location.reload();
```

`RemoteTournamentAdapter.submitScore()` writes locally first, then fire-and-forget POSTs to the Worker. `getMode()` returns `'remote'` (reachable), `'remote-fallback'` (unreachable), or `'cloud-ready'` (probing). The `#tournament-mode-label` UI chip surfaces the current mode.

## TODOs (future BUILD/HARDEN days)

- **Auth / anti-cheat** — today's POST is open. Future work: Cloudflare Turnstile or HMAC of `{weekKey, score, ts}` with a build-time secret.
- **Rate limit** — Cloudflare Worker can use `CF-IPCountry` + a per-IP KV counter, or Turnstile.
- **Schema version field** — add `version` to submission payload + a server-side migration on read so additive client fields don't break old workers.
- **Merged leaderboard UI** — today only `submitScore()` round-trips. The tournament screen still renders the local board. A future day will merge cloud entries into the rendered top-10.
