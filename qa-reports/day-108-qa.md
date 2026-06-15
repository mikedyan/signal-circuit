# Day 108 QA Report — Cycle 5 BUILD Week Day 2: Tournament Worker Go-Live

**Date:** 2026-06-15 (Monday)
**Build under test:** `?v=1781136000` / sw `signal-circuit-v70`
**Harness:** `qa-reports/day-108-qa.cdp.js`
**Result:** 48/48 assertions across 9 phases on second run (1 harness self-bug on first run: P3.2 had a stray literal `${MOCK_URL}` template tag in the comparison — fixed harness-side, zero app changes).
**Console errors:** 0  **Runtime exceptions:** 0

## Day 108 net change vs. Day 93

Day 93 shipped the adapter shell (cloud-ready / remote / remote-fallback state machine, fire-and-forget POST to `/scores`, reachability probe TTL). The Day 93 spec explicitly deferred surfacing cloud entries in the rendered leaderboard:

> "UI doesn't read the cache yet — that's deferred to Day 96+ (snapshot library tab)."

Day 108 closes that loop and adds the roadmap-spec REST surface:

1. **Roadmap-spec POST `/submit/:weekKey` URL-keyed alias** on both Cloudflare Worker (`worker.js`) and the Node mock (`local-mock-worker.js`). Legacy `/scores` route preserved for back-compat.
2. **`wrangler.toml` binding renamed to `TOURNAMENT_KV`** per roadmap; `worker.js` reads either `env.TOURNAMENT_KV` (new) or `env.SIGNAL_CIRCUIT_TOURNAMENT` (Day 93 legacy) so an in-flight deployed config doesn't break.
3. **`RemoteTournamentAdapter.getRemoteEntries(weekKey)`** — synchronous read of the `_remoteBoardCache`, returns array or null.
4. **`RemoteTournamentAdapter.onBoardUpdate(weekKey, cb)`** — register/dispose listener fired after the async `/leaderboard/:weekKey` fetch lands.
5. **`ui.js _renderTournamentLeaderboard()`** — when mode is `remote` AND cloud cache is non-empty, render cloud entries merged with the player's local best, sorted by score, top 10. `.tournament-row-cloud` class + 🌐 prefix make cloud rows visually distinct; `⭐` prefix wins for the player's own row. Falls back to the local pseudo-board on every other path (local mode, cloud-ready, remote-fallback, or remote+empty-cloud).
6. **`ui.js showTournamentScreen()`** — disposes any prior listener and registers a fresh one for the current week key on every screen open. Kicks `backend.getLeaderboard(info.key)` so the listener fires once the network round-trip completes.
7. **CSS** — `.tournament-row-cloud` cyan-tinted border + light-mode mirror.

`TournamentBackend` base + `LocalTournamentAdapter` ship inert defaults (`getRemoteEntries() → null`, `onBoardUpdate() → () => {}`) so the renderer can call them blindly without type-sniffing the active backend class.

## Phase summary

| Phase | Subject | Assertions | Outcome |
|------|---------|-----------:|---------|
| P1 | Build identity (11 `?v=1781136000` refs + game live) | 2 | PASS |
| P2 | Local default backend shape + describe + new listener fns | 7 | PASS |
| P3 | Remote configured via LS flags + workerUrl wired + reachable | 5 | PASS |
| P4 | `submitScore` round-trips to mock worker; entry stored | 5 | PASS |
| P5 | Tournament screen renders cloud rows with `.tournament-row-cloud` | 6 | PASS |
| P6 | Mock killed → mode → `remote-fallback` → board reverts | 6 | PASS |
| P7 | POST `/submit/:weekKey` alias + legacy `/scores` + bad-weekkey 400 | 8 | PASS |
| P8 | Day 78 / 79 / 92 / 103 / 107 regression invariants | 7 | PASS |
| P9 | Console hygiene (0 errors, 0 exceptions) | 2 | PASS |

**Total:** 48 / 48

## Detailed evidence

### P3 — Remote backend + reachability probe
- Backend instance is `RemoteTournamentAdapter`; `config.workerUrl` matches the LS-configured `http://127.0.0.1:8902`.
- `refreshReachability()` await + 200ms settle lands `getMode() === 'remote'`, `isLive() === true`, `describe()` includes `Live leaderboard`.

### P4 — submitScore goes live
- `tournamentBackend.submitScore(3, 25, 'Mochi')` returns a synchronous payload from the local layer (same shape Day 83+).
- Within 700ms the fire-and-forget POST lands in the mock worker. `GET /leaderboard/:weekKey` shows exactly 1 entry with `{name: 'Mochi', gates: 3, time: 25, score: <local>}`. Stored score equals locally-returned score (no drift).

### P5 — Cloud rows render
- Seeded two extra cloud-only entries via the alias route (`CloudPlayerA: 2 gates / 18s / 218`, `CloudPlayerB: 4 gates / 90s / 430`).
- Opening the tournament screen kicks the listener; `.tournament-row-cloud` count = 3, `.tournament-row-cloud.tournament-row-self` count = 1 (Mochi's entry marked as self).
- Mode label reads `🌐 Live leaderboard`.

### P6 — Offline fallback
- Killed mock with `SIGTERM`. `refreshReachability()` settles `getMode() === 'remote-fallback'`, `isLive() === false`, `describe()` includes `offline`.
- Forced `_renderTournamentLeaderboard()` → 0 `.tournament-row-cloud` rows, 10 rows total (local pseudo-board).
- `submitScore` on fallback still returns a local payload (gameplay unblocked even when worker is unreachable — Day 93 contract).

### P7 — Roadmap REST surface
- `POST /submit/2026-Wxx` body `{gates: 6, time: 120, score: 660, name: 'AliasUser'}` → 200, `{ok: true, weekKey, rank: 1}`.
- Legacy `POST /scores` body still works (rank 2 entry from `LegacyUser`).
- `GET /leaderboard/2026-Wxx` shows `total: 2` (alias + legacy stored side-by-side).
- `POST /submit/notaweek` returns 400 (week-key validator rejects).

### P8 — Regression invariants
- Cold-start non-level button count = 2 (Day 78 invariant, 33 days running).
- 45 level cards visible cold (Day 103 mastery-section gating).
- Day 79 `showFirstLaunchDifficultyModal === 'undefined'`; `#weekly-puzzle-btn` DOM absent.
- Day 107 `window.Wire` + `window.WireManager` still classes; Day 92 `window.Gate` still class + `window.GateTypes` still object.
- Service worker registration active.

## Harness self-bugs noted

- **First run, P3.2 only:** assertion compared `remoteShape.workerUrl === '${MOCK_URL}'.replace('${MOCK_URL}', '${MOCK_URL}')` — a stray literal template tag (the wrap of `evalExpr` inside a `\`` template string masked the lint). Fix was 1-line: `remoteShape.workerUrl === MOCK_URL`. Second run: 48/48.

Day 107 had 3 harness self-bugs; Day 108 had 1. The harness is converging.
