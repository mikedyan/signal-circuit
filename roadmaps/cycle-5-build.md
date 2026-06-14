# Signal Circuit — Cycle 5 BUILD Roadmap

**Cycle:** 5
**Week type:** BUILD
**Start day:** Day 107 / cycleDay 55
**Inputs:** `reviews/prune-cycle-4-review.md` (9.1/10), `PRUNE_REPORT.md`, `BUGS.md` (0 open, 31-day empty-queue streak, LO-1 retired), `LESSONS_LEARNED.md`, `specs/module-health.md` (Day 86 baseline + Day 92 gates.js conversion)

## Week Thesis

**"Pay down the second strategic debt (wires.js → ES module), turn the dormant Tournament adapter into a real federated leaderboard, and add the next gameplay frontier (Lab Bench III with fan-out budget)."**

Cycle 4 BUILD shipped five forward-looking surfaces and Cycle 4 PRUNE closed at 9.1/10 — the cleanest cycle yet. Cycle 5 BUILD's job is to convert the largest remaining piece of dormant infrastructure (Tournament adapter shell from Day 83) into a real shipped feature, take the second bite out of the monolithic-code debt (wires.js → ES module after Day 92's gates.js conversion), and push the gameplay surface forward with Lab Bench III. The week is sequenced low-risk-first: Day 1 is the structural bootstrap (matching Day 92's Cycle 4 pattern), Days 2-5 deliver user-visible payloads.

## Day 107 (Sun) — Module Split Phase 2: Extract `wires.js` as ES Module

**Why first.** Mirrors Day 92's clean Day-1 structural pattern: the rest of the week rests on a half-converted-but-stable boundary, and Cycle 5 PRUNE can audit it for regressions before further extraction. `wires.js` is the natural next module after gates.js: fan-out=1 (only references `Gate` / `IONode` from gates.js, both already on window post-Day-92), fan-in≈5 (referenced by simulation.js, canvas.js, ui.js, main.js for `Wire` / `WireManager` / `WIRE_COLORS_DEFAULT`), and a single 20KB file. Day 86's `specs/module-health.md` flagged it as the next ES-module candidate after gates.js.

**Spec.** Convert `js/wires.js` from a classic-script global-leaking file into a true ES module. Add `export` to the 5 top-level declarations: `WIRE_COLORS_DEFAULT`, `WIRE_COLORS_COLORBLIND`, `getWireColors`, `Wire`, `WireManager`. Append a tail block that rebinds the externally-consumed names (`Wire`, `WireManager`, `WIRE_COLORS_DEFAULT`, `getWireColors`) to `window` so the 4 classic-script consumers continue to find them as globals at call time.

**Acceptance:**
- `js/wires.js` declares `export class Wire`, `export class WireManager`, `export const WIRE_COLORS_DEFAULT`, `export const WIRE_COLORS_COLORBLIND`, `export function getWireColors`.
- Tail of `wires.js` installs `Wire`, `WireManager`, `WIRE_COLORS_DEFAULT`, `getWireColors` on `window`.
- `index.html` loads `wires.js` via `<script type="module" src="js/wires.js?v=...">` (other unconverted scripts remain classic).
- Cache-bust + SW version bumped (v68 → v69).
- CDP harness loads localhost and asserts: `window.Wire` and `window.WireManager` are classes; `window.WIRE_COLORS_DEFAULT` is a 10-element array; `window.getWireColors` is callable; L1 quick-test still solves with 3 stars; no console errors.

**Risk callout.** Same risk profile as Day 92. Module scripts are deferred by default. The 4 classic-script consumers (`simulation.js`, `canvas.js`, `ui.js`, `main.js`) parse-and-evaluate before `wires.js` runs — but none reference `Wire` / `WireManager` / `WIRE_COLORS_DEFAULT` at module-evaluation time (verified by grep — all are inside class methods or run after DOMContentLoaded). `main.js`'s `new Game()` constructs `new WireManager(this)` only on DOMContentLoaded, which fires after the module evaluates.

## Day 108 (Mon) — Tournament Worker Go-Live

**Why now.** Day 83 left an adapter shell (`LocalTournamentAdapter` / `RemoteTournamentAdapter` / `selectTournamentBackend()`) with a `local` fallback wired through `WeeklyTournament.submitScore()`. Day 93 didn't actually ship the worker. Cycle 5 promotes the adapter from "ready-to-wire" to "wired" by shipping a Cloudflare Worker stub with KV-backed score storage, and updates `RemoteTournamentAdapter` to call it when configured. Local mode remains the offline default. **BIGGEST dial-mover on Replayability + Addictiveness (Cycle 4 review weakest dimensions at 5/10 and 6/10).**

**Acceptance:**
- `tools/tournament-worker/` directory with `wrangler.toml`, `src/worker.js`, README, deployment script (manual deploy step OK — factory writes the code, doesn't deploy externally).
- Worker exposes `GET /leaderboard/:weekKey` and `POST /submit/:weekKey` with a tiny KV namespace `TOURNAMENT_KV`.
- `RemoteTournamentAdapter` updated to call worker URL when `localStorage('signal-circuit-tournament-worker-url')` is set. Falls back to `LocalTournamentAdapter` on 4xx/5xx/timeout.
- UI shows "🌐 Live leaderboard" badge when in remote mode (uses Day 93's 4-state vocabulary already shipped). Day 103 PRUNE Cut #2 label-compression preserved.
- CDP harness exercises mock-worker mode (XHR/fetch stub) + offline-fallback mode. Local mode still works with worker URL unset.

## Day 109 (Tue) — Lab Bench III mini-chapter (L46-L50) with fan-out budget

**Why now.** Day 94 shipped Lab Bench II composite constraints (NAND-only + hardCap; mustInclude + hardCap). Cycle 5 adds a third constraint axis: **fan-out budget** — total wire endpoint count `<N` forces players to share intermediate signals rather than duplicate gates feeding multiple destinations. This compounds Day 70's "design first, submit once" identity and introduces 5 new lab-bench levels (L46-L50) as a Chapter 11 mini-arc.

**Acceptance:**
- 5 new lab levels in Chapter 11 (`isLabBench: true` + `maxFanOut: N` field).
- `_validateLabConstraints()` extended to check fan-out: count incoming wires to each output node + each gate input, reject if any exceeds the budget. Composite with NAND-only + hardCap still works.
- HUD `#lab-constraint` chip strip renders up to 3 chips side-by-side for triple-composite levels.
- CDP harness verifies: L46 solve fails when fan-out budget exceeded; L48 NAND-only + hardCap + maxFanOut triple-composite rejects on first violation matched.

## Day 110 (Wed) — Gameplay HUD personal-best badge

**Why now.** Players currently see no signal on level revisits that they've already beaten a level — the gameplay HUD treats every entry as a cold attempt. A persistent "🏆 Your best: 3 gates · 18s · ⭐⭐⭐" badge in the gameplay HUD (on revisits only) creates a continuous improvement loop and is the gateway feature to per-level leaderboards (post-Cycle-5).

**Acceptance:**
- New `#level-best-badge` element in gameplay HUD, gated on `gameState.progress[levelId]` being non-empty.
- Renders best gate count, best time, best star count, and a "📈 Try to beat" call-to-action subtext.
- Suppressed on first entry of a level (no prior data). Reappears on revisit.
- Updates live after improving the run on the current attempt (best score replaces in real time).
- CDP harness: L1 cold-entry no badge → solve 3★ → exit → re-enter L1 → badge visible with correct values → solve in fewer gates → badge updates.

## Day 111 (Thu) — Stats Dashboard Enhancement: Tournament History Tab

**Why now.** Day 96 shipped the Snapshot Cards library tab inside Stats. Day 108's Tournament Worker creates a need to surface tournament results — players need a way to see their tournament submissions across weeks. A new "🏆 Tournament" tab in the Stats modal (gated on having ≥1 tournament submission) lists past-week scores, ranks, and a "View Replay" hook that loads the saved circuit if available.

**Acceptance:**
- New Stats tab `#stats-tournament-tab` showing per-week: weekKey, score, rank, percentile, podium status, crowned flag.
- Tab badge `🏆 Tournament (N)` shows submission count.
- Empty state for players with no submissions (gates the tab).
- "View Replay" button on each row attempts to load the saved circuit (no-op if not stored).
- CDP harness: cold tab shows empty state → submit a tournament score → tab populates with 1 row → submit another → tab shows 2 rows.

## Week Guardrails

- **Cold-start surface frozen at 2 non-level buttons** (How to Play + Settings). No new top-level buttons may ungate at tier 0.
- **One module per BUILD week** — Day 107's wires.js is the entire Cycle 5 module-split budget. Don't try to also extract `simulation.js`; that waits for Cycle 6.
- **Every feature must test both `runSimulation()` AND `runQuickTest()`** if it touches completion paths.
- **Bump `index.html` cache-bust + `sw.js` CACHE_NAME together** on every day that ships code (not on no-code days).
- **CDP localhost verification** is the canonical QA surface (browser tool blocks localhost). Use the Day 86+ permissive-Chromium + raw-WebSocket pattern.
- **Backend changes** (Day 108) need offline fallback that's verifiable in the same CDP harness — don't make the local-development experience depend on the worker being reachable.
- **No LO-related work this week** — LO-1 retired on Day 103. Open Bugs queue must stay at 0; report end-of-day count daily.

## Cycle Score Forecast

Cycle 4 closed at **9.1/10** (Day 106 expert panel). Cycle 5 BUILD lays groundwork for:
- **Replayability +0.5** if Day 108 worker goes live with a real federated leaderboard (Cycle 1's #1 review backlog, finally landing).
- **Addictiveness +0.5** if Day 110 personal-best badge creates a measurable revisit loop.
- **Uniqueness +0.5** if Day 109 fan-out budget lands cleanly (compounds Day 70's "design first" + Day 94's composite-constraint identity).
- **Bug-Free hold** — module split is the highest-risk Day-1 item; if it ships clean, the score floor holds; if it regresses, Cycle 5 HARDEN absorbs the fix.

Target Cycle 5 PRUNE score: **9.3–9.5**. Conservative floor: 9.0 (within Cycle 4's tolerance).
