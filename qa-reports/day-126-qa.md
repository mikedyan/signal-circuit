# Day 126 QA — Cycle 6 BUILD Week Day 4: Onboarding A/B cohort instrumentation

**Build under test:** local `?v=1782950400` · `sw.js CACHE_NAME = 'signal-circuit-v80'`
**Harness:** `qa-reports/day-126-qa.cdp.js` (raw CDP over ws@8, `tools/cdp-launch.sh`)
**Result:** **44 / 44 assertions across 8 phases on the FIRST run.** 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs.

## Phases
| Phase | Coverage | Assertions |
|---|---|---|
| P1 | Build identity (11 refs @ ?v=1782950400, sw v80, 4 accessors exposed) | 4/4 |
| P2 | Cold assignment (install id persisted, cohort∈{local,live}, blob persist, ISO stamp, FNV-1a parity match) | 5/5 |
| P3 | Determinism (install id + cohort stable across reload; reset keeps id + re-derives same cohort) | 4/4 |
| P4 | URL override (?cohort=live / ?cohort=local force + persist) | 4/4 |
| P5 | Session counter (cold=1, same-day no double-count, simulated new UTC day +1 once, daysActive span, settle) | 9/9 |
| P6 | Debug readout (hidden without flag, cohort badge+rows match stats, dev section reveals) | 6/6 |
| P7 | Regression (Day 78/79/92/107/123 ESM / Day 125 backend / Day 85 variant / SW) | 10/10 |
| P8 | Console hygiene | 2/2 |

## Key verifications
- **Deterministic cohort**: harness independently re-derives the FNV-1a parity bucket from the install id and confirms the app assigned the same one (P2.5).
- **Reset stability**: `reset()` wipes experiment state but keeps `signal-circuit-install-id`, so the cohort re-derives identically (P3.3/P3.4) — the A/B assignment is never accidentally re-rolled.
- **Once-per-UTC-day counter**: cold load → `sessionDays=1`; same-day reload holds; rewriting `lastSessionDay` to 3 days ago (with `firstSessionDay` 5 days ago, `sessionDays=4`) then reloading bumps to exactly 5 with `daysActive=6`; a further same-day reload holds at 5 (P5.1–P5.9).
- **No new cold surface**: cold non-level nav buttons = 2 (Day 78 invariant holds); the entire feature lives behind the Day 95 debug-gated Developer section.

## Bug ledger
- Open Bugs: **0 → 0** (51-day empty-queue streak since Day 76).
- Latent observations: 0 → 0.
- New bugs: 0. No harness self-bugs (clean first run).

## Source delta
- `js/main.js`: install-id + cohort helpers, OnboardingExperiment cohort/session methods, window alias +4.
- `js/ui.js`: cohort/session block in `renderOnboardingReadoutCard()`.
- `index.html`: 11× cache-bust bump. `sw.js`: v79 → v80.
