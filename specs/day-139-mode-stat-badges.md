# Day 139 Spec — Per-mode stat badges in the Modes hub

**Cycle 7 · BUILD Week · Day 2 · cycleDay 90 · Day 139 · 2026-07-16**

## Goal
Turn the Day 138 `🎮 Modes` hub from a launcher into a dashboard: each `.mode-card`
shows the player's own headline stat for that mode, read from **existing** GameState
fields. **No new persistence** — pure read of already-stored values.

## Stat per mode (source → rendered text)
| key | source (existing) | has-value text | empty text |
|-----|-------------------|----------------|------------|
| daily | `gs.getStreakData().streak` | `🔥 {n}-day streak` | `✨ Start a streak today` |
| adaptive | `gs.skillTracker.getSkillLevel().label` | `🎯 Skill: {label}` | — |
| tournament | `gs.weeklyTournament.getSubmissionHistory()[0].rank` (newest-first) | `🏆 Last rank: #{n}` | `🏅 No runs yet` |
| infinite | `gs.infiniteRun.best.bestSolved` | `♾️ Best: {n} solved` | `♾️ Not played yet` |
| blitz | `gs._getBlitzBest()` (rung int) | `🔥 Best: rung {n}` | `🔥 Not played yet` |
| speedrun | `gs._getSpeedrunBest()` (seconds) | `🏁 Best: {m}:{ss}` | `🏁 Not played yet` |
| random | — (no persisted headline stat) | *(no badge)* | *(no badge)* |
| sandbox | — (no persisted headline stat) | *(no badge)* | *(no badge)* |

Random/Sandbox have no existing per-mode counter and the Day 139 guardrail forbids new
persistence, so they intentionally render no stat badge (card = button + description only).

## DOM changes (`index.html`)
- Add `<span class="mode-stat" id="mode-stat-<key>" style="display:none;"></span>` after the
  `.mode-desc` inside the 6 stat-bearing cards (daily, adaptive, tournament, infinite, blitz,
  speedrun). random/sandbox unchanged.

## JS changes (`js/ui.js`)
- New `UI.updateModeHubStats()`: reads the 6 sources above and sets each `#mode-stat-<key>`
  text + toggles `style.display`. Fully try/guarded per stat (a missing manager can't break
  the hub). Empty string → `display:none`.
- Call it: once at the tail of `setupModesHub()`, and inside the hub `open()` (fresh每 open).

## CSS (`css/style.css`)
- `.mode-stat`: small pill badge (green accent on dark, green on light-mode mirror),
  `align-self:flex-start` so it hugs the left under the description.

## Cache-bust
`?v=1783987200` → `?v=1784073600` (11 refs); `sw.js` v85 → v86.

## QA (CDP, `qa-reports/day-139-qa.cdp.js`)
- P1 build identity: 11× `?v=1784073600`, sw v86, 6 `#mode-stat-*` spans present, hub intact.
- P2 cold-start: fresh profile → daily `✨ Start a streak today`, tournament `🏅 No runs yet`,
  infinite/blitz/speedrun `Not played yet`, adaptive shows `🎯 Skill: {label}` (Novice cold).
  random/sandbox have NO stat span. Cold nav still 2, 50 cards, Modes hidden cold (g6).
- P3 seeded stats: write `signal-circuit-streak` streak=5 → daily `🔥 5-day streak`;
  `signal-circuit-blitz-best`=7 → blitz `🔥 Best: rung 7`; `signal-circuit-speedrun-best`=95 →
  speedrun `🏁 Best: 1:35`; seed infinite best bestSolved=12 → `♾️ Best: 12 solved`;
  submit a tournament score → tournament `🏆 Last rank: #{n}`. Re-open hub → stats refresh.
- P4 launch integrity: all 8 mode buttons still launch + hub closes (Day 138 regression).
- P5 regression floor: Day 79 dead-ids absent, Day 124 Profile hub intact, ESM bindings
  (Gate/Wire/Simulation), LEVELS=50.
- P6 console hygiene: 0 console.error, 0 Runtime.exceptionThrown.
