# QA Report — Day 44

## Feature: Anonymous Daily Leaderboard

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| DailyLeaderboard class exists | PASS | Class with all required methods |
| Generates 50 consistent fake scores | PASS | Same seed produces identical scores |
| Scores follow bell-curve distribution | PASS | Clustered around optimal+2, few outliers |
| submitScore stores player result | PASS | Correctly stored in localStorage |
| getPercentile returns 0-100 | PASS | 3 gates=98%, 4=92%, 5=75%, 8=10% |
| getRank returns 1-based rank | PASS | 3 gates=Rank 1, 4=Rank 4, 5=Rank 13 |
| Rank badges correct | PASS | 🥇≥90%, 🥈≥75%, 🥉≥50%, none<50% |
| Pre-screen shows on daily button click | PASS | Full-screen with leaderboard + history |
| Top 10 leaderboard renders | PASS | Names, gate counts, times, gold ranks 1-3 |
| Competitive framing message | PASS | "Today's leader used just 3 gates" |
| Display name input | PASS | Placeholder "Anonymous", max 16 chars |
| Start button launches challenge | PASS | Transitions to gameplay screen |
| Back button returns to level select | PASS | Level select screen restored |
| Daily title renders correctly | PASS | "📅 Daily Challenge — Apr 9, 2026" |
| Score only updates if improved | PASS | Worse scores don't overwrite |
| Better scores do overwrite | PASS | isNewBest=true on improvement |
| Empty history state | PASS | "No daily challenges played recently" |
| JS syntax valid (main.js) | PASS | node -c passes |
| JS syntax valid (ui.js) | PASS | node -c passes |
| No console errors | PASS | Only deprecation warning for apple-mobile-web-app-capable |
| Campaign levels still load | PASS | Level 1-3 accessible normally |

## Bugs Found & Fixed
- **BUG: Daily challenge title showing "Loading..."**: The `updateLevelInfo()` method had no `isDaily` branch, causing daily challenges to fall through to the campaign code path which expected numeric level IDs. **FIXED**: Added explicit `isDaily` branch that sets title as "📅 {level.title}".
- **BUG: Service worker caching old HTML**: New daily-config-screen element wasn't visible after code change because SW served cached HTML. **FIXED**: Bumped SW cache version from v30 to v31.

## Bugs Found & Not Fixed
- None.

## Regression Results
- Level select rendering: PASS
- Challenge config screen: PASS (not affected)
- Sandbox config screen: PASS (not affected)
- Level creator: PASS (not affected)
- Campaign gameplay: PASS (level 1-3 tested)
- Screen navigation: PASS (all transitions working)
- Seasonal theme on daily button: PASS (preserved)

## Lessons Added
- **Pre-screen pattern for game modes**: Using a dedicated pre-screen (like challenge-config, sandbox-config) works well for modes that need context before starting. Add the screen ID to the showScreen() screens array.
- **isDaily vs isChallenge**: Daily challenges are NOT marked as isChallenge. Always add explicit isDaily branches wherever isChallenge is checked to avoid fall-through to campaign logic.
- **Seeded PRNG for pseudo-leaderboards**: Using a different seed offset (seed+999) for leaderboard scores prevents correlation with the challenge's truth table generation while maintaining determinism.
- **Best-only score tracking**: Compare both gates AND time when deciding whether to update — `gateCount < existing.gates || (gateCount === existing.gates && timeSeconds < existing.time)`.

## Overall Assessment
Day 44 is shippable. The Anonymous Daily Leaderboard adds meaningful competitive context to daily challenges without any backend infrastructure. The pre-screen provides a compelling "pre-game" experience with the leaderboard and competitive framing. All 10 items are implemented and working.
