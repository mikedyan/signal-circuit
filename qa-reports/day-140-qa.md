# Day 140 QA — "Recommended for you" spotlight

**Build under test:** local `?v=1784160000` / sw `signal-circuit-v87`
**Harness:** `qa-reports/day-140-qa.cdp.js` (raw CDP over ws@8, port 9301)
**Result:** **40/40 assertions across 6 phases**, 0 console.error, 0 Runtime.exceptionThrown.

## Phases
- **P1 Build identity** (6) — 11× `?v=1784160000`, sw v87, spotlight host in DOM,
  `renderModeSpotlight`/`_recommendMode`/`_modeButtonId` live, button-id map for all 8 keys.
- **P2 Cold-start** (4) — fresh profile → spotlight visible, recommends daily, "Start here",
  reason mentions Daily Challenge.
- **P3 Heuristic branches** (9) — every deterministic branch reached with a seeded state:
  campaign-100%→blitz "Campaign conquered"; g18→tournament "Enter the arena";
  g18+tour→infinite "How far can you go?"; g18+tour+inf→blitz "Beat the clock";
  g18+tour+inf+blitz→speedrun "Set a time trial"; g12→adaptive "Sized to your skill";
  g9→random "Mix it up"; g6 first-timer→daily "Start here"; g6 returning→daily
  "Keep your streak going".
- **P4 Spotlight launch** (6) — spotlight Play launches the recommended mode's flow
  (adaptive→gameplay, tournament→tournament-screen) and closes the hub.
- **P5 Regression floor** (13) — Day 138 hub still launches all 8 modes + closes;
  Day 79 dead-ids absent; Day 92/107/123 ESM bindings (Gate+8 GateTypes / Wire / Simulation);
  LEVELS=50; Day 78 cold-start 2 nav buttons; hub closed at cold start.
- **P6 Console hygiene** (2) — 0 console.error, 0 Runtime.exceptionThrown.

## Harness notes / self-bugs fixed (0 app changes)
1. **Design realignment (real, app-informed):** first heuristic branched on
   "streak alive & not played today" — unreachable because `updateStreak()` runs on
   every load (streak always ≥1 / lastPlayDate always today). Redesigned the heuristic
   to treat the streak as an engagement signal only. This was a source-code change, not
   a harness change, done before the passing run.
2. **Seed state bleed:** `seedProgress(N)` merges onto in-memory progress, so a
   decreasing seed (50→18→…) kept the higher count. Fixed harness-side by using
   `seedProgress(N, {clear:true})` + `localStorage.clear()` + reload.
3. **Stale SW precache:** re-editing `ui.js` under the same `?v` let the service worker
   serve the first-edit bytes (Day 134 class). Fixed harness-side with a one-time
   `serviceWorker.unregister()` + `caches.delete()` purge after the first load, then
   reload. Real users unaffected — the v86→v87 SW upgrade precaches the new bytes on install.
4. **Silent CDP hang:** added an 8s per-call timeout to `send()` so a stuck CDP call
   surfaces as a clear error instead of an infinite wait; a clean `cdp-launch.sh
   stop/start` cleared a lingering page-target debug session left by a killed run.

Visual confirmation screenshot: `/tmp/day140-hub.png` (spotlight above the mode list).
