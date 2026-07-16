# Day 139 QA — Cycle 7 BUILD Week, Day 2: Per-mode stat badges in the Modes hub

**Date:** 2026-07-16 · **cycleDay 90 · Day 139**
**Build:** LOCAL `?v=1784073600` / sw `signal-circuit-v86` (bumped from Day 138 `?v=1783987200` / v85).
**Result:** **37 / 37** assertions across 6 phases (36/37 first run — 1 harness self-bug, fixed harness-side, **0 app changes**); **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

## What shipped
Turned the Day 138 `🎮 Modes` hub from a launcher into a dashboard. Each `.mode-card` now
shows the player's own headline stat, read from **existing** GameState fields — **no new
persistence** (Day 139 guardrail). New `UI.updateModeHubStats()` populates 6 `#mode-stat-<key>`
pills; called at the tail of `setupModesHub()` and inside the hub `open()` so a fresh best set
this session shows on return.

| key | source (existing) | has-value | empty |
|-----|-------------------|-----------|-------|
| daily | `gs.getStreakData().streak` | `🔥 {n}-day streak` | `✨ Start a streak today` |
| adaptive | `gs.skillTracker.getSkillLevel().label` | `🎯 Skill: {label}` | — |
| tournament | `gs.weeklyTournament.getSubmissionHistory()[0].rank` | `🏆 Last rank: #{n}` | `🏅 No runs yet` |
| infinite | `gs.infiniteRun.best.bestSolved` | `♾️ Best: {n} solved` | `♾️ Not played yet` |
| blitz | `gs._getBlitzBest()` | `🔥 Best: rung {n}` | `🔥 Not played yet` |
| speedrun | `gs._getSpeedrunBest()` (sec→m:ss) | `🏁 Best: {m}:{ss}` | `🏁 Not played yet` |

**Random / Sandbox** have no persisted per-mode counter and the day's guardrail forbids new
persistence, so they intentionally render no stat badge (card = button + description only).

## Phases
- **P1 Build identity (7):** 11× `?v=1784073600`, sw v86, 6 `#mode-stat-*` spans inside stat-bearing cards, no span on random/sandbox, `updateModeHubStats` present, Day 138 hub + 8 cards intact.
- **P2 Cold-start stats (7):** brand-new profile → daily `✨ Start a streak today` (zero-streak), tournament `🏅 No runs yet`, infinite/blitz/speedrun `Not played yet`, adaptive `🎯 Skill: {label}` (Novice cold); random/sandbox render no badge.
- **P3 Seeded stats (6):** streak=5 → `🔥 5-day streak`; blitz-best=7 → `Best: rung 7`; speedrun-best=95 → `Best: 1:35`; infinite bestSolved=12 → `Best: 12 solved`; submitted tournament score → `Last rank: #N` (rank matches `getSubmissionHistory()[0].rank`); adaptive still `Skill: …`. Stats refresh on re-open.
- **P4 Launch integrity (8):** Day 138 regression — all 8 mode buttons still launch their flow from inside the hub + hub closes on pick.
- **P5 Regression floor (7):** Day 79 dead-ids absent; Day 92 Gate/GateTypes, Day 107 Wire/WireManager, Day 123 Simulation instanceof; LEVELS=50; Day 124 Profile hub intact.
- **P6 Console hygiene (2):** 0 console.error, 0 Runtime.exceptionThrown.

## First-run harness self-bug (0 app changes)
**P2.1** read the daily stat after `seedProgress(18)` and expected the zero-streak empty state,
but `seedProgress` marks the day played → `updateStreak()` sets the streak to 1, so the pill
correctly read `🔥 1-day streak`. The app was right; the harness over-assumed a seeded-fresh
profile has streak 0. Fixed by `localStorage.removeItem('signal-circuit-streak')` before the
zero-state read. Same class as the recurring HARDEN/BUILD harness-shape self-bugs (Days 97/108/
115/117/122/125/131/135).

## Source LOC
- `index.html`: +6 (6 `<span class="mode-stat">` spans) + 11 cache-bust refs.
- `js/ui.js`: +~55 (`updateModeHubStats()` + 2 call sites).
- `css/style.css`: +~15 (`.mode-stat` pill + light-mode mirror).
- `sw.js`: v85 → v86.
Net ≈ +76 functional. No new persistence, no new cold-start surface (Modes reveals at g6 — cold nav still 2, 50 cards).

**Open Bugs queue:** 0 → 0 (streak: **64 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Harness: `qa-reports/day-139-qa.cdp.js` (37 assertions, 6 phases). Spec: `specs/day-139-mode-stat-badges.md`.

**Day 140 next:** Cycle 7 BUILD Week Day 3 — "Recommended for you" spotlight card at the top of the hub (deterministic heuristic from player state; no new data).
