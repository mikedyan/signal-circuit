# Signal Circuit — Cycle 3 BUILD Roadmap

**Cycle:** 3  
**Week type:** BUILD  
**Start day:** Day 82 / cycleDay 30  
**Inputs:** `reviews/prune-cycle-2-review.md`, `BUGS.md` (0 open bugs), `LESSONS_LEARNED.md`, Cycle 2 recommendations

## Week Thesis

Cycle 2 lifted Signal Circuit to 8.9/10 by deepening replayability and pruning clutter. Cycle 3 should push the remaining ceilings without undoing the clean first-run surface: add one viral/share hook, one real competition foundation, one Lab Bench content expansion, one onboarding instrumentation surface, and one code-health foundation.

## Day 82 — Shareable Circuit Snapshot Cards

Upgrade the existing share-card modal from a generic achievement poster into an actual circuit snapshot card: render the solved circuit preview inside the image, add copy/share affordances, and make the output deterministic and social-ready.

**Why now:** The Cycle 2 review calls out “one social hook” as a top Cycle 3 candidate. The game already saves solution previews (Day 43) and already has a share-card surface (Day 31), so this is high-impact with low architectural risk.

**Acceptance:**
- Completion screen still exposes `📸 Share Card` for campaign levels.
- The generated 1200×630 image includes real solved-circuit preview geometry when available.
- Modal offers image download and clipboard/native-share affordances.
- No regressions to level completion, preview storage, or star display.

## Day 83 — Tournament Backend Adapter Shell

Introduce a transport-shaped adapter around WeeklyTournament score submission: local pseudo-board remains default/offline fallback, but the code path becomes ready for a Cloudflare Worker + KV backend.

**Acceptance:**
- `submitScore` routes through a backend adapter interface.
- Offline/local mode preserves current deterministic behavior.
- UI clearly labels local/offline leaderboard vs. live-ready plumbing.
- No external write required until credentials/Worker URL are explicitly configured.

## Day 84 — Lab Bench II Seed Pack

Add three advanced Lab Bench-style puzzles in a new late-game mini-pack using the existing `isLabBench` state machine, with one new constraint surfaced in copy/UI per level.

**Acceptance:**
- 3 new Lab Bench levels with truth tables, titles, and constraints.
- Existing Lab HUD and 3-submission budget work unchanged.
- Level select remains uncluttered and tier-gated appropriately.

## Day 85 — Onboarding Experiment Flag

Add a tiny local feature flag surface for first-run onboarding experiments: silent-default difficulty vs. explicit chooser, toast copy variants, and optional analytics-free local counters.

**Acceptance:**
- Default remains current Day 78 silent-default behavior.
- Flag can be toggled via query param/localStorage for QA.
- No external analytics; local counters only.

## Day 86 — Module Split Foundation

Start the long-deferred module split safely by extracting the least-coupled code first or by introducing a build-time module boundary report if direct ES-module migration is too risky in one day.

**Acceptance:**
- A measurable reduction in monolithic coupling or a repeatable module-health report checked into `specs/`.
- No gameplay regressions.
- Cache-bust and service worker version updated.

## Week Guardrails

- Keep the cold-start level select at 2 visible non-level buttons.
- Do not add ungated top-level buttons unless replacing an existing surface.
- Every feature must test both normal RUN and Quick Test if it touches completion.
- Bump `index.html` cache query strings and `sw.js` cache version together.
- Use raw CDP localhost verification when the browser tool blocks `localhost`.
