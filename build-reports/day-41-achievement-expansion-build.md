# Build Report — Day 41: Achievement Expansion

## Change Plan
- `js/achievements.js`: Add 10 new achievements to ACHIEVEMENTS array, expand stats object with new tracking fields, add new tracking methods
- `js/main.js`: Wire mode tracking into all 6 mode entry points, add streak achievement check on init, add daily challenge tracking + perfectionist check in both simulation paths
- `js/ui.js`: Wire social_butterfly into challenge friend share, wire creator into custom level share
- `index.html`: Bump cache versions

## Changes Made

### js/achievements.js
- Added 10 new achievements across all tiers:
  - Bronze: explorer, social_butterfly, creator
  - Silver: week_warrior, minimalist, speed_circuit, universal_builder
  - Gold: month_of_logic, streak_master, perfectionist
- Expanded default stats with: dailyChallengesTotal, dailyChallengeStreak, lastDailyChallengeDate, optimalSolves, modesPlayed
- Added migration-safe stats loading (spread defaults with saved data)
- Added `trackDailyChallengeComplete()` — tracks daily-specific streak and total separately from random challenges
- Added `checkStreakAchievement()` — checks 14-day play streak
- Added `trackModeExplored()` — records which game modes have been tried
- Added `trackFriendChallengeShare()` — for Social Butterfly
- Added `trackCustomLevelCreated()` — for Creator
- Added `checkPerfectionist()` — 100% aesthetics with 3+ gates
- Enhanced `checkAfterCompletion()` with speed_circuit, minimalist, and universal_builder checks
- Used `getLevel()` to access level data for optimal gate count and available gates checks

### js/main.js
- Added streak achievement check in `init()` after `updateStreak()` — fires toast if streak ≥ 14
- Added `trackModeExplored()` calls in all 6 entry points: startLevel, startDailyChallenge, startChallenge, startSandbox, startBlitzMode, startSpeedrunMode
- Added perfectionist achievement check in both `runSimulation()` and `runQuickTest()` completion paths
- Added `trackDailyChallengeComplete()` in both simulation paths when `currentLevel.isDaily`

### js/ui.js
- Added `trackFriendChallengeShare()` call in showChallengeFriendButton's onclick
- Added `trackCustomLevelCreated()` call in shareCustomLevel()

### index.html
- Bumped cache version for achievements.js, main.js, ui.js

## Decisions Made
- **Daily vs Random tracking**: Daily challenge streak tracks only daily challenges (not random/blitz), using calendar date comparison. Random challenges use the existing `challengesCompleted` counter.
- **Mode names**: Used 6 strings: 'campaign', 'daily', 'random', 'blitz', 'speedrun', 'sandbox' — stored as array in stats.modesPlayed
- **Universal Builder check location**: In `checkAfterCompletion()` where we have access to gameState.gates — checks if ALL placed gates are NAND and level had other gates available
- **Perfectionist threshold**: Score must be exactly 100 (max) with 3+ gates. This is intentionally hard (gold tier).
- **Stats migration**: Used spread operator with defaults so old saves missing new fields get them automatically

## Concerns
- The `getLevel()` function is used in `checkAfterCompletion` — need to verify it's available in scope (it's in levels.js which loads before achievements.js)
- Mode tracking fires `showAchievementToasts` which may try to show toasts before UI is fully ready on very first call — but this is guarded by the empty array return
- Daily challenge streak uses ISO date comparison which is timezone-dependent on the user's local clock
