# Day 125 QA Report — Tournament Worker production-readiness + opt-in display name

**Cycle 6 BUILD Week Day 3 · cycleDay 76 · Day 125**
Harness: `qa-reports/day-125-qa.cdp.js` (raw CDP over WebSocket + spawned mock worker)
Build under test: `?v=1782864000` · `sw.js CACHE_NAME = signal-circuit-v79`

## Result

**49/49 assertions passed across 8 phases (second run). 0 console.error; 0 Runtime.exceptionThrown.**

### Run history
- **First run:** P1–P5 all green (35/35). P6 threw a harness error `Object reference
  chain is too long` — a P6 multi-statement `evalExpr` ended on
  `reconfigureTournamentBackend()`, whose return value (the full adapter object with
  circular refs) failed `returnByValue` serialization. **Harness fix:** append `true;`
  so the completion value is a primitive. **0 app changes.**
- **Second attempt:** P6.2–P6.4 failed once — after killing the harness's own mock,
  `/health` still resolved reachable. Root cause: an **orphaned mock worker** (pid from
  the crashed first run) still listening on port 8902. Killed it; re-ran. **0 app changes.**
- **Final run:** 49/49, exit 0.

## Phases

| Phase | Assertions | What it proves |
| --- | --- | --- |
| P1 Build identity | 3 | 11× ?v=1782864000, sw v79, window.game live |
| P2 Local default + surface | 9 | mode=local, LocalTournamentAdapter, display-name accessors on window, cold name empty, reconfigure present, all 5 surface DOM nodes present, cold inputs empty, chip=Local/data-mode=local |
| P3 Connect button | 8 | URL persists to LS, backend flag→remote, live backend=RemoteTournamentAdapter, config.workerUrl wired, mode→remote after probe, isLive=true, describe=Live, chip data-mode=remote |
| P4 Privacy | 9 | anonymous default POSTs "Anonymous" (daily name NOT leaked); opt-in name clamps ≤16 + round-trips; opt-in POSTs the name; Save Name button persists; Anonymous button clears |
| P5 Go Local button | 4 | clears LS URL, flag→local, LocalTournamentAdapter, chip data-mode=local, input cleared |
| P6 Offline fallback | 5 | reconnect→remote; kill mock→remote-fallback, isLive=false, describe="Live · offline"; submitScore still returns local payload |
| P7 Regression | 9 | Day 78 (2 nav), Day 109 (50 cards), Day 79 dead-ids, Day 92/107/123 ESM bindings, sw active, cold backend local+anonymous |
| P8 Console hygiene | 2 | 0 console.error, 0 Runtime.exceptionThrown |

## Privacy verification (P4 — the headline)

- **P4.3** — with no display name set, the mock worker received `name: "Anonymous"`.
  The `displayName` argument passed to `submitScore` (`'You'`) was **not** forwarded to
  the cloud. Confirms the daily-leaderboard name cannot leak without consent.
- **P4.7** — after `setTournamentDisplayName('Mochi…')` (clamped to 16 chars), the mock
  worker received the exact saved name.

## Notes

- Cold-start non-level button count holds at **2** (Day 78 invariant) — the new
  Tournament section lives inside the existing Settings modal, no new top-level surface.
- `deploy.sh check` passes preflight (warns on placeholder KV ids + missing wrangler,
  as designed).
- Open Bugs queue: 0 → 0 (50-day empty-queue streak since Day 76).
