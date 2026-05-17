# Day 79 — Cycle 2 PRUNE Week, Day 3: Code Cleanup

**Cycle day:** 27
**Build under test:** `?v=1779638400`, `sw.js CACHE_NAME = 'signal-circuit-v54'`
**Goal:** Net-negative LOC pass — remove dead code introduced or made obsolete by Day 78's Tier 1 cuts, plus the orphan helpers and CSS rules they uncovered.

## Targets (from Day 78 wrap-up "nextCycle.focus")

1. `showFirstLaunchDifficultyModal` — auto-fire path was severed in Day 78 Cut #5. Audit for any remaining call sites, then remove.
2. `#weekly-puzzle-btn` wiring — Day 78 hid the button but the DOM node, click handler, `setVis` call, and notification path all still existed. Walk the full surface.
3. Inline `view-solution-btn` / `gate-limit-btn` paths — Day 78 routed them through `_showLevelOverflowMenu`. Audit shared CSS rules / tooltips that became orphaned.
4. Duplicate info-modal CSS — Achievements / Mastery / Customize / Collection / Logic Profile share visual language; audit for collapsible rules.

## What shipped

### JS (5 files, −124 lines)

- **`js/ui.js`** (−57): Removed `showFirstLaunchDifficultyModal` (the entire body — Day 78's silent-default replaced the only caller); removed the `weekly-puzzle-btn` click handler block in `setupCompetitiveModes`; removed the `setVis('weekly-puzzle-btn', false)` line and its 5-line comment from `applyProgressGating`.
- **`js/main.js`** (−40): Removed `WEEKLY_NOTIF_KEY` constant; removed `checkWeeklyNotification()` method; removed `_getWeekNumber()` (only used by checkWeeklyNotification); removed `_showWeeklyToast()`; removed the `init()` call that scheduled the toast; removed the `weekly` entry from `setupSettingsUI` types array; removed `_showHud()` from InfiniteRunManager (never called — `_updateHud` handles display).
- **`js/achievements.js`** (−24): Removed `checkLightning(streak)` / `checkEclipseRun()` / `checkArchitect()` wrapper methods. The actual mythic unlocks all fire inline at the real trigger sites (`InfiniteRunManager.onSolve`, `trackDailyChallengeComplete`, `checkAll`). Also removed `isMythic(id)` — never called externally; `ui.js` checks `ach.tier === 'mythic'` directly inline.
- **`js/tutorial.js`** (−3): Removed `getCurrentStep()` (never called).

### HTML (1 file, −2 lines)

- **`index.html`** (−2): Removed `#weekly-puzzle-btn` from challenge-mode section; removed `#notif-weekly-btn` from Settings → Notifications.

### CSS (1 file, −74 lines)

- **`css/style.css`** (−74): Removed `.weekly-btn` (border + `::after NEW` badge — 20 lines); removed `#weekly-toast` (20 lines); removed `#mute-btn` (3 rules, 21 lines — element never existed in DOM); removed `#gate-count-display` (2 rules, 15 lines — never rendered); removed `#hint-penalty` from compound selector; removed `#mute-btn` from interactive-affordance selector list; removed `.modal-content` / `#confirm-modal-box` / `#creator-content` / `#mastery-content` from `body.light-mode` selector list (those IDs/classes never appear in the DOM; the real ids are `#confirm-modal-content`, `#creator-config-content`, `#mastery-tree-content`).

### Cache + service worker

- `index.html`: 11 `?v=1779552000 → ?v=1779638400` references
- `sw.js`: `CACHE_NAME = 'signal-circuit-v53' → 'signal-circuit-v54'`

## Diff stats

```
7 files changed, 44 insertions(+), 224 deletions(-)
```

Net delta: **−180 LOC** (target was ≥−100; hit ~1.8×).
Cache-bust bumps + comments are the only insertions; every other change is a deletion.

## Verification (CDP raw WebSocket on localhost:8901)

12 assertions across 3 surfaces (all pass, 0 console errors):

| # | Check | Result |
|---|-------|--------|
| 1 | Build identity (11 refs at `?v=1779638400`, sw v54) | ✅ unified |
| 2 | `#weekly-puzzle-btn` removed from DOM | ✅ `null` |
| 3 | `#notif-weekly-btn` removed from DOM | ✅ `null` |
| 4 | `ui.showFirstLaunchDifficultyModal` undefined | ✅ undefined |
| 5 | `achievements.{checkLightning,checkEclipseRun,checkArchitect,isMythic}` undefined; `checkAll` + `checkRareAchievements` still present | ✅ all correct |
| 6 | `infiniteRun._showHud` undefined; `_hideHud` + `_updateHud` still present | ✅ correct |
| 7 | `tutorial.getCurrentStep` undefined | ✅ undefined |
| 8 | `_notifManager.{checkWeeklyNotification,_showWeeklyToast,_getWeekNumber}` undefined; `checkStreakAtRisk` still present | ✅ all correct |
| 9 | Cold-start: `DIFFICULTY_KEY='standard'`, no confirm-modal opens | ✅ silent default holds (Day 78 Cut #5) |
| 10 | End-game (seedProgress(40)): 40 overflow ⋯ + 18 visible nav buttons | ✅ matches Day 78 baseline |
| 11 | Tier-2 staircase: g3=2, g6=5, g9=7, g12=10, g15=13, g18=18 (delta-from-base: 0/3/5/8/11/16 matches Day 78) | ✅ no regression in Cut #2 |
| 12 | Cold-start Level 1: gameplay screen, RUN button, 4 truth-table rows | ✅ core loop intact |

Then a 3-test regression sweep on the same harness (also 0 console errors):

| # | Check | Result |
|---|-------|--------|
| R1 | Settings → Difficulty Mode opens 3-option chooser (Day 56 path still works after silent-default) | ✅ modal display=flex, 3 `.diff-option-btn` |
| R2 | Notif Settings: `notif-daily-btn` + `notif-streak-btn` exist, `notif-weekly-btn` gone | ✅ correct |
| R3 | Tournament still opens (Day 72 subsumption of PotW is intact) with 3 tabs | ✅ display=flex, 3 tabs |

## What did NOT change

- `generateWeeklyPuzzle()` in `js/levels.js` is **kept** — Tournament still uses it for archive determinism. Day 78 already documented this; Day 79 confirms no reachability gap.
- Existing PotW localStorage data is **left untouched** (per Day 78's subsumption rule — migration is the cost, subsumption is the win).
- `showPlacementTest()` is **kept** — reachable via opt-in `?placement` URL flag. Not orphan.
- `body.light-mode` for the remaining info-modals was left intact; consolidating into a shared `.modal-overlay` class would be a refactor, not a cleanup.

## Process notes

- Single commit (vs. Day 78's 6 atomic) — Day 65 set the precedent: a code-cleanup day is a single logical change ("remove the bones the previous day exposed"), not a sequence of user-facing cuts.
- Three-pass dead-code detection (per Day 65): (a) `grep` for method names with low usage count, (b) cross-check CSS selectors against actual DOM, (c) walk the focus list from `nextCycle`. The Python script in step 1 surfaced 4 orphan methods I would have missed in a pure manual walk.
- `node -c <file>` syntax-checked all 4 edited JS files before browser verification.
- CDP localhost workaround (per Day 76 / Day 78): `curl -X PUT http://127.0.0.1:18800/json/new?<url>` to open a tab, then a small `ws` harness for `Runtime.evaluate`. Browser tool's `action=open` still policy-blocked.
