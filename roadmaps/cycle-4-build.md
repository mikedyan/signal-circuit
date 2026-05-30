# Signal Circuit — Cycle 4 BUILD Roadmap

**Cycle:** 4
**Week type:** BUILD
**Start day:** Day 92 / cycleDay 40
**Inputs:** `reviews/prune-cycle-2-review.md` (8.9/10), `reviews/harden-cycle-3-week-summary.md` (286 assertions / 0 bugs / 16-day empty-queue streak), `BUGS.md` (0 open, 1 deferred LO-1), `LESSONS_LEARNED.md`, `specs/module-health.md` (Day 86 baseline)

## Week Thesis

**"Pay down two strategic debts and harvest one user-facing reward each from the three Cycle 3 BUILD seeds (Day 82 share cards, Day 83 tournament adapter, Day 85 onboarding flag)."**

Cycle 3 BUILD shipped five forward-looking foundations — most of them deliberately under-finished so the cycle could close clean. Cycle 4 BUILD turns three of those foundations into shipped user surfaces, takes the first real bite out of the monolithic-code debt that has been deferred across two Prune reviews, and adds one new constraint to Lab Bench II to keep the gameplay surface growing alongside the architectural cleanup.

The week is sequenced so each day either ships a user-visible result OR makes the next day's user-visible result cheaper. No day is purely architectural in isolation, but Day 1 (module split) carries the most structural weight because every subsequent cycle benefits.

## Day 92 (Mon) — Module Split Phase 1: Extract `gates.js` as ES Module

**Why first.** Day 86 left a coupling baseline (`specs/module-health.md`) that identified `gates.js` as the natural first ES-module target: fan-out=0 (zero outbound dependencies — it imports nothing from the rest of the codebase), fan-in=8 files (every other JS module references `Gate` / `GateTypes`), and a leaf in the dependency DAG. Two Prune reviews have flagged "module split" as the #1 deferred cycle-1 backlog item. Doing it Day 1 of BUILD week is the right cadence: the rest of the week can rest on a half-converted-but-stable boundary, and Cycle 4 PRUNE can audit it for regressions before further extraction.

**Spec.** Convert `js/gates.js` from a classic-script global-leaking file into a true ES module. The 4 top-level declarations — `GateTypes`, `Gate`, `IONode`, `roundRect` — gain `export` keywords. A tail block in the same file rebinds the exports to `window` so the 8 classic-script consumers (`wires.js`, `simulation.js`, `levels.js`, `audio.js`, `achievements.js`, `canvas.js`, `ui.js`, `main.js`) continue to find `Gate`/`GateTypes` as globals during their lifetime — but the file now loads via `<script type="module">`, the canonical bindings live in the module scope, and `tools/module-health.js` gains awareness of which files are ESM-converted.

**Acceptance:**
- `js/gates.js` declares `export class Gate`, `export const GateTypes`, `export class IONode`, `export function roundRect`.
- Tail of `gates.js` installs the 4 names on `window` so classic-script consumers continue to work.
- `index.html` loads `gates.js` via `<script type="module" src="js/gates.js?v=...">` (all other scripts remain classic).
- Cache-bust + SW version bumped (v60 → v61).
- CDP harness loads the deployed shape from localhost and asserts: window.Gate is a class, `Gate.toString().includes('class Gate')`, GateTypes contains AND/OR/NOT/XOR keys, an L1 quick test still solves with 3 stars, no console errors.
- `tools/module-health.js` recognizes `gates.js` as the first ESM module (adds a `module` column to the per-file table).

**Risk callout.** Module scripts are deferred by default. The 8 classic-script consumers parse-and-evaluate before `gates.js` runs — but none of them reference `Gate` / `GateTypes` at module-evaluation time (verified by grep — all references are inside class methods, which run after DOMContentLoaded). main.js's `DOMContentLoaded` handler fires AFTER the module evaluates, so by the time `new Game()` constructs the world, the globals are installed.

## Day 93 (Tue) — Tournament Backend Worker Go-Live

**Why now.** Day 83 left an adapter shell with a `local` fallback wired through `WeeklyTournament.submitScore()`. The contract surface (`getMode/describe/isLive`) was already verified by Day 88's playthrough and Day 91's regression pass. Cycle 4 promotes the adapter from "ready-to-wire" to "wired" by shipping a Cloudflare Worker (or equivalent serverless endpoint) and updating the adapter to call it when configured. Local mode remains the offline default.

**Acceptance:**
- Cloudflare Worker (or equivalent — Fly.io machine, Deno Deploy edge function) stands up at a stable URL with a tiny KV store for {weekKey → top-50 score list}.
- Adapter gains `remote` mode that activates when a worker URL is configured via localStorage (or build-time constant). When unconfigured, `local` mode remains.
- UI gains a "🌐 Live leaderboard" badge when in remote mode, distinguishing it from the existing 🏠 Local label.
- Submitted scores survive a hard reload + new-incognito-session (proving they're server-side, not localStorage).
- CDP harness exercises both modes; offline mode falls back gracefully when the worker URL is unreachable.

## Day 94 (Wed) — Lab Bench II Composite Constraints (Lab Bench III seed)

**Why now.** Day 84 shipped Lab Bench II with three single-constraint puzzles (NAND-only, hard cap, must-include). Cycle 4 introduces **composite** constraints: a single level can carry both `labConstraint='NAND-only'` AND `gateHardCap=N`, with the validator surfacing both rules in the chip strip and rejecting on either violation. Adds 2 new Chapter-10 puzzles with composite rules.

**Acceptance:**
- 2 new lab levels added to Chapter 10 with composite constraints — e.g. L44 'NAND-Only Adder' (NAND-only + hard cap 6), L45 'XOR-Heavy Multiplexer' (must-include XOR + hard cap 5).
- `_validateLabConstraints()` evaluates ALL active constraints, not just the first matched one. Rejection message lists ALL violations.
- HUD `#lab-constraint` chip strip renders up to 2 chips side-by-side for composite levels.
- CDP harness verifies that a 5-gate NAND-only solve gets rejected (would pass single-constraint), and a 6-gate NAND-only solve with hard cap 6 succeeds.

## Day 95 (Thu) — Onboarding Experiment Readout UI

**Why now.** Day 85 added local counters for variant + funnel events, but the only readout is `window.__onboardingExperiment.getCounters()` in the dev console. Day 95 ships a Settings → "Developer" surface (gated behind the existing `signal-circuit-debug` flag) that displays the current variant, counters, and a Reset button. This makes the experiment usable for actual data collection — Mike can run the game on a fresh profile, complete an arc, and read off the funnel without opening DevTools.

**Acceptance:**
- Settings modal's "Developer" section (gated by `signal-circuit-debug`) gains a "Onboarding Experiment" card showing: variant name, applied-at timestamp, counters (variant_resolved / chooser_shown / chooser_picked / first_level_started / first_level_completed), Reset button.
- Card auto-refreshes on settings-modal open (re-reads counters fresh each time).
- Reset button wipes the experiment state (`window.__onboardingExperiment.reset()`) and re-runs `applyFirstLaunch()`.
- CDP harness sets the debug flag, opens settings, asserts the card renders with expected counters after a synthetic flow.

## Day 96 (Fri) — Snapshot Cards Library Tab

**Why now.** Day 82 shipped per-level "📸 Share Card" generation but threw the generated images away after the user downloaded/shared them. Day 96 closes the loop: completed share cards persist in a thumbnail library (last 20, IndexedDB or localStorage), and a new "📸 My Cards" tab in the Stats screen lets the user browse their gallery and re-share any saved card without re-solving the level. This turns share-cards into a small but real social artifact users can collect.

**Acceptance:**
- Generating a share card stores its data URL (or a re-renderable seed) in a capped library (last 20).
- Stats screen gains a "📸 My Cards" tab with a grid of thumbnails.
- Clicking a thumbnail re-opens the share-card modal pre-populated.
- Cap eviction: 21st card evicts the oldest. Reset Game wipes the library.
- CDP harness solves L1 twice, asserts 2 cards in the library, then floods to 21 and asserts cap.

## Week Guardrails

- **Cold-start surface frozen at 2 non-level buttons** (How to Play + Settings). No new top-level buttons may ungate at tier 0.
- **One module per BUILD week** — Day 92's gates.js is the entire Cycle 4 module-split budget. Don't try to also extract `wires.js` or `simulation.js`; those wait for Cycle 5.
- **Every feature must test both `runSimulation()` AND `runQuickTest()`** if it touches completion paths.
- **Bump `index.html` cache-bust + `sw.js` CACHE_NAME together** on every day that ships code (not on no-code days).
- **CDP localhost verification** is the canonical QA surface (browser tool blocks localhost). Use the Day 86+ permissive-Chromium + raw-WebSocket pattern.
- **Backend changes** (Day 93) need offline fallback that's verifiable in the same CDP harness — don't make the local-development experience depend on the worker being reachable.
- **No LO-1 fix this week** — LO-1 is explicitly tagged for Cycle 4 PRUNE Week (Day 110ish). BUILD week doesn't touch it.

## Cycle Score Forecast

Cycle 3 closed at **8.9/10** (Day 81 expert panel). Cycle 4 BUILD lays groundwork for:
- **Replayability +0.5** if Day 93 worker goes live with a real federated leaderboard (Cycle 1 review's #1 backlog item finally lands).
- **Uniqueness +0.5** if Day 94 composite Lab Bench levels land cleanly (compounds Day 70's "design first, submit once" differentiation).
- **Bug-Free hold** — module split is the highest-risk item; if it ships clean, the score floor holds; if it regresses, Cycle 4 HARDEN absorbs the fix.

Target Cycle 4 PRUNE score: **9.1–9.3**. Conservative floor: 8.9 (hold).
