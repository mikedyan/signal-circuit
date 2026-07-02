# Day 125 — Tournament Worker production-readiness + opt-in display name

**Cycle 6 BUILD Week Day 3 · cycleDay 76 · Day 125**
Build identity: `?v=1782777600 / sw v78` → `?v=1782864000 / sw v79`

## Goal (per roadmaps/cycle-6-build.md Day 125)

Day 108 wired `RemoteTournamentAdapter` to read a real cloud cache with an
offline fallback; the REST surface, UI labels, and `wrangler.toml` exist. What
was missing for a real deploy:

1. A **Settings connection surface** to set/clear the tournament worker URL
   (`signal-circuit-tournament-worker-url`) + a connection-status readout
   reusing Day 93's 4-state vocabulary.
2. An **opt-in display name** (`signal-circuit-tournament-display-name`) — no
   name POSTed unless explicitly set; default anonymous.
3. `tools/tournament-worker/deploy.sh` + README deploy checklist — idempotent,
   safe to re-run (external `wrangler deploy` stays a manual human step).

## What shipped

### 1. Settings → Tournament (Online) surface (index.html + ui.js + css)
- New `#settings-tournament-section` between Notifications and Data.
- Worker-URL `<input>` + `🔌 Connect` / `🏠 Go Local` buttons.
- Connection-status chip `#tournament-connection-status` painted from
  `backend.describe()` (Day 93 vocabulary) with a `data-mode` attribute driving
  the CSS color state (local / remote / remote-fallback / cloud-ready).
- Opt-in display-name `<input maxlength=16>` + `💾 Save Name` / `🖩 Anonymous`.
- `UI._wireTournamentSettings()` — one-time button wiring (called from
  `setupSettingsModal`). Enter-to-submit on both inputs.
- `UI.renderTournamentSettings()` — repopulates inputs + chip on every settings
  open (idempotent).
- `UI.updateTournamentConnectionStatus()` — paints the chip; for remote
  backends kicks `refreshReachability()` and repaints when it lands (guarded so
  it only repaints while the modal is open).

### 2. Opt-in display name + privacy (js/main.js)
- New `TOURNAMENT_DISPLAY_NAME_LS_KEY = 'signal-circuit-tournament-display-name'`
  + `TOURNAMENT_DISPLAY_NAME_MAX = 16`.
- Free functions `getTournamentDisplayName()` / `setTournamentDisplayName()`
  (trim + clamp to 16) / `clearTournamentDisplayName()`, exposed on `window`.
- `RemoteTournamentAdapter.submitScore()` POST body now uses the opt-in name:
  `name: optInName || 'Anonymous'` + `anonymous: !optInName`. The `displayName`
  argument (the daily-leaderboard name) is intentionally **not** forwarded to
  the cloud — it only feeds the local pseudo-board the UI reads synchronously.
- `GameState.reconfigureTournamentBackend()` re-runs `selectTournamentBackend()`
  live (no reload) when the worker URL / mode changes, then kicks a reachability
  probe.

### 3. Deploy automation (tools/tournament-worker/)
- `deploy.sh` — `check` (preflight: worker.js/wrangler.toml/wrangler/KV-ids/
  `node -c`), `plan` (prints command sequence + optional client bootstrap),
  `deploy` (refuses without `--yes`; aborts on placeholder KV ids). Idempotent.
- README updated: `deploy.sh` usage, the in-game connection path (no more
  DevTools required), and an explicit privacy/opt-in section.

## Privacy model

Anonymous by default. A personal name leaves the device only after the player
explicitly sets one in Settings → Tournament (Online) → Display name. With no
name set, the POST carries `name:"Anonymous"` + `anonymous:true`. The local
board still shows `"You"`; that data never leaves the device.

## QA — qa-reports/day-125-qa.cdp.js

**49/49 assertions across 8 phases on the second run; 0 console.error; 0
Runtime.exceptionThrown.** (First run: P1–P5 green 35/35; P6 hit a harness
serialization bug — a multi-statement eval returned the huge backend object;
fixed by appending `true;`. Then P6 fallback failed once due to an orphaned mock
worker from the crashed first run still holding port 8902 — killed it, 0 app
changes.)

- P1 Build identity (11× ?v=1782864000, sw v79, game live)
- P2 Local default + surface DOM present + accessors exposed + cold anonymous
- P3 Connect button → LS set, backend flips to RemoteTournamentAdapter, mode →
  remote after probe, chip data-mode=remote
- P4 Privacy: anonymous default POSTs `"Anonymous"`; opt-in name (clamped ≤16)
  POSTs the name; Save/Anonymous buttons persist/clear
- P5 Go Local button → LocalTournamentAdapter again, chip data-mode=local
- P6 Offline fallback: kill mock → mode=remote-fallback, isLive=false,
  describe="Live · offline"; submitScore still returns a local payload
- P7 Regression: Day 78 (2 nav), Day 109 (50 cards), Day 79 dead-ids, Day 92/
  107/123 ESM bindings, sw active, cold backend local+anonymous
- P8 Console hygiene

## Source LOC

- `js/main.js`: +~55 (display-name key/helpers/accessors + POST-body privacy +
  reconfigure method)
- `js/ui.js`: +~95 (wire + render + status methods)
- `index.html`: +21 (settings section) + 11 cache-bust bumps
- `css/style.css`: +51 (`.ts-*` surface styles + light-mode)
- `sw.js`: v78 → v79
- `tools/tournament-worker/deploy.sh`: new (+~155)
- `tools/tournament-worker/README.md`: deploy.sh + privacy docs

No cold-start surface added (the Tournament section lives inside the existing
Settings modal). Cold nav-button count holds at 2 (Day 78 invariant).
