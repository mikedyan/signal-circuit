# Signal Circuit — Cycle 6 BUILD Roadmap

**Cycle:** 6
**Week type:** BUILD
**Start day:** Day 123 / cycleDay 74
**Inputs:** `reviews/prune-cycle-5-review.md` (9.2/10), `PRUNE_REPORT.md`, `BUGS.md` (0 open, 47-day empty-queue streak, LO-1 retired C4-D103 / LO-2 resolved C5-D114), `LESSONS_LEARNED.md`, `specs/day-121-collection-merge-scaffold.md` (deferred Tier-2 Cut #4), `roadmaps/cycle-5-build.md` (module-split + tournament-worker precedent)

## Week Thesis

**"Pay down the third module-split debt (`simulation.js` → ES module), finally land the long-deferred collection-modal merge as a dedicated BUILD day, and make the Tournament Worker production-deployable + the engagement loop measurable."**

Cycle 5 closed at 9.2/10 with nine of ten rubric dimensions at the ceiling. The expert panel was explicit that the last half-point lives in exactly one place it has lived for three cycles: **a real, deployed, populated leaderboard**, and that two big chunks of debt were ready to land — the `simulation.js` module conversion (Phase 3) and the collection-modal merge (promoted from a polish-day squeeze to a dedicated BUILD day). Cycle 6 BUILD sequences low-risk-first per the Day 92/107 pattern: Day 1 is the structural bootstrap, Days 2–5 deliver user-visible payloads, with the highest-risk user-facing change (the modal merge) landing on Day 2 so the rest of the week + the Cycle 6 HARDEN week can absorb any regression.

## Day 123 (Day 1) — Module Split Phase 3: Extract `simulation.js` as ES Module

**Why first.** Mirrors Day 92 (gates.js) and Day 107 (wires.js): the rest of the week rests on a half-converted-but-stable boundary, and Cycle 6 PRUNE can audit it for regressions before further extraction. `simulation.js` is the natural next module after gates+wires: it has exactly one externally-consumed top-level symbol (`Simulation`), referenced only by `main.js` (`new Simulation(this)` inside the `Game` constructor, which runs on DOMContentLoaded — after all deferred module scripts evaluate). It references `Gate` / `IONode` only inside method bodies, both already on `window` post-Day-92, so module-scope global fall-through resolves them at call time.

**Spec.** Convert `js/simulation.js` from a classic-script global-leaking file into a true ES module. Add `export` to the single top-level declaration (`class Simulation`). The two `Simulation.prototype.*` augmentations (`traceFailurePath`, `detectConstantOutputs`) stay in module scope and reference `Simulation` locally — no change needed. Append a tail block that rebinds `Simulation` to `window` so the classic-script `main.js` consumer continues to find it as a global at construction time.

**Acceptance:**
- `js/simulation.js` declares `export class Simulation`.
- Tail of `simulation.js` installs `window.Simulation = Simulation` (guarded by `typeof window !== 'undefined'`).
- `index.html` loads `simulation.js` via `<script type="module" src="js/simulation.js?v=...">`; the 7 still-unconverted scripts remain classic.
- Cache-bust + SW version bumped together (v76 → v77).
- CDP harness loads localhost and asserts: `window.Simulation` is a class; `game.simulation instanceof window.Simulation` (binding-identity proof); L1 AND-gate synthetic solve through `runQuickTest()` persists 3 stars (exercises `evaluateOnce` + `runAll`); a failing circuit produces a `traceFailurePath` trace; Day 92 gates.js + Day 107 wires.js bindings still present; Day 79 dead-id purge intact; cold-start Day 78 invariants hold (2 nav, 50 cards); 0 console errors.

**Risk callout.** Same risk profile as Day 92/107. Module scripts are deferred. `main.js` is a classic script and executes during parse, but only touches `Simulation` inside `new Game()` on DOMContentLoaded, which fires after the module evaluates. Verified by grep: no module-evaluation-time reference to `Simulation` exists outside `main.js`'s constructor.

## Day 124 (Day 2) — Collection-Modal Merge → tabbed Profile hub (dedicated BUILD day)

**Why now.** The Cycle 5 review promoted this from "deferred polish squeeze" to "dedicated BUILD day with a full HARDEN week behind it." Five standalone collection modals (Achievements / Mastery / Customize / Collection / Logic Profile) are the 18-button Tier-3 plateau flagged in the last three PRUNE audits. Use `specs/day-121-collection-merge-scaffold.md` verbatim as the build plan.

**Acceptance (per scaffold):**
- New `#profile-hub-modal` with `#profile-hub-tabs` (5 tabs) + `#profile-hub-content`, mirroring the Day 96 `#stats-tabs` / `_switchStatsTab` pattern + Day 119 hidden-when-empty guard.
- Re-parent (don't rewrite) the five existing content roots into the hub panes; keep each `render*()` renderer intact; lazy-render on tab open.
- Single `🗂 Profile` entry button replaces the 5 header buttons; old button ids fold into the Day 79 dead-id sweep.
- ONE consolidated backdrop/close handler on the hub (avoid the Day 61/74 duplicate-path bug).
- Logic Profile canvas sparkline: lazy-render on tab open, destroy on hub close (Day 54 chart-lifecycle precedent).
- Keep `#stats-modal` SEPARATE.
- CDP harness: hub opens, all 5 tabs switch + lazy-render, cosmetic select still mutates live render, no canvas leak after close, end-game nav-button count drops by the merged buttons, 0 console errors.

## Day 125 (Day 3) — Tournament Worker production-readiness + opt-in display name

**Why now.** Day 108 wired `RemoteTournamentAdapter` to read a real cloud cache with an offline fallback; the REST surface, UI labels, and `wrangler.toml` exist. What's missing for a real deploy: a connection-settings surface (worker URL entry), an opt-in display name (privacy — no name posted without consent), and deploy automation. Factory writes the code + deploy script; external `wrangler deploy` remains a manual human step.

**Acceptance:**
- Settings entry to set/clear the tournament worker URL (`signal-circuit-tournament-worker-url`) + a connection-status readout reusing Day 93's 4-state vocabulary.
- Opt-in display name (`signal-circuit-tournament-display-name`) — no name is POSTed unless explicitly set; default is anonymous.
- `tools/tournament-worker/deploy.sh` + README deploy checklist; idempotent, safe to re-run.
- Offline fallback verifiable in the same CDP harness (kill mock → `remote-fallback` → local pseudo-board).
- CDP harness: set worker URL → mode flips to remote; opt-in name posts, anonymous default doesn't; clear URL → back to local.

## Day 126 (Day 4) — Onboarding A/B readout: Local-only vs Live cohort (engagement instrumentation)

**Why now.** Review rec #1's second half. Day 85/95 shipped the `OnboardingExperiment` flag + debug-gated readout. Cycle 6 turns it into a real measurable A/B: cohort-assign new players Local-only vs Live-leaderboard, track a 7-day-retention-proxy metric (return-session count) locally, and surface it in the debug readout. No external analytics — all localStorage.

**Acceptance:**
- Deterministic cohort assignment on first run (hash of install id → `local` / `live` bucket), persisted.
- Lightweight return-session counter (increment once per UTC day on load) keyed per cohort.
- Debug-gated readout (`signal-circuit-debug=1`) shows cohort + session count + days-active.
- No new cold-start surface; entirely behind the Day 95 developer section.
- CDP harness: force each cohort via URL override, verify assignment persists, verify session counter increments once per simulated day.

## Day 127 (Day 5) — Stats Dashboard: per-chapter completion heatmap tab

**Why now.** Closes the BUILD week with a depth/insight feature in the now-canonical Stats surface (Day 96 tab pattern). A compact per-chapter completion + star heatmap gives returning players a sense of progress at a glance and reinforces the revisit loop the PB badge (Day 110) started.

**Acceptance:**
- New `📊 Progress` (or folded into Overview) heatmap: one cell per chapter, color by completion %, star total overlay.
- Gated/empty-state clean for brand-new players (Day 119 hidden-when-empty discipline).
- CDP harness: cold empty state → seed progress → heatmap reflects per-chapter completion + star counts; 0 console errors.

## Week Guardrails

- **Cold-start surface frozen at 2 non-level buttons** (How to Play + Settings). No new top-level buttons may ungate at tier 0. (Day 124's `🗂 Profile` button *replaces* 5 existing buttons — net negative, and reveals at g12, not tier 0.)
- **One module per BUILD week** — Day 123's `simulation.js` is the entire Cycle 6 module-split budget. Don't also extract `levels.js`; that waits for Cycle 7.
- **Every feature that touches completion paths must test both `runSimulation()` AND `runQuickTest()`.**
- **Bump `index.html` cache-bust + `sw.js` CACHE_NAME together** on every day that ships code (not on no-code days).
- **CDP localhost verification** is the canonical QA surface (browser tool blocks localhost). Use `tools/cdp-launch.sh` (Day 114 LO-2 fix) + the raw-WebSocket harness pattern.
- **Backend changes** (Day 125) need offline fallback verifiable in the same CDP harness — never make local development depend on the worker being reachable.
- **Open Bugs queue must stay at 0** — report end-of-day count daily. The empty-queue streak (47 days entering Cycle 6) is the operating mode, not the exception.

## Cycle Score Forecast

Cycle 5 closed at **9.2/10**. Cycle 6 BUILD lays groundwork for:
- **Replayability 9 → 10** if Day 125 makes the worker genuinely deployable and a real backend gets stood up (the one dimension the review says is gated on a deployed leaderboard).
- **Clarity / First Impression hold-or-+** if Day 124's modal merge collapses the 18-button plateau into one entry without losing reachability.
- **Bug-Free hold** — Day 123 module split + Day 124 modal merge are the two highest-risk items; if they ship clean the floor holds; if either regresses, Cycle 6 HARDEN absorbs the fix.

Target Cycle 6 PRUNE score: **9.3–9.4**. Conservative floor: 9.1 (within Cycle 5's tolerance).
