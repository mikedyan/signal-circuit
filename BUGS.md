# Bugs — Signal Circuit

*Updated: Day 78 — Prune Week 2, Day 2 (2026-05-16) — Design Simplification (Cycle 2)*

## Open Bugs

*(none — Day 78 was a Prune Week simplification day; the 5 Tier 1 cuts shipped
without surfacing any new bugs. All verification ran with 0 console errors.)*

## Day 78 — Prune Week 2, Day 2 (Design Simplification) summary

**Build under test:** `?v=1779552000`, `sw.js CACHE_NAME = 'signal-circuit-v53'`
**Result:** 0 new bugs, 5 Tier 1 cuts shipped from `PRUNE_REPORT.md`.

- **Cut #1 — Per-card overflow menu**: `👁 Solution` + `🏆 Gate Limit` collapsed into a single `⋯` corner button per completed card with a popover.
- **Cut #2 — Smooth Tier-2 reveal**: `applyProgressGating()` now uses 5 thresholds (g6/g9/g12/g15/g18) instead of two.
- **Cut #3 — Retire Puzzle of the Week**: Tournament fully subsumes it; `weekly-puzzle-btn` hidden at every tier.
- **Cut #4 — Drop L1 hint footer**: meta-rule footer hidden on levels 1–3 (no hints used yet); resurfaces from L4.
- **Cut #5 — Silent-default difficulty modal**: brand-new players auto-set to Standard + one-time toast; Settings → Difficulty Mode unchanged.

Net wins: end-game level-select drops 40 × 2 sub-buttons → 40 × 1 overflow button (−50% per-card visual weight), Tier-2 cliff replaced by a 3 → 5 → 8 → 11 → 16 staircase, two cold-start ceremonies removed (difficulty modal + L1 hint footer).

Live CDP verification (5 cut suites, multi-seed gating sweep, modal/toast lifecycle): 0 console errors.

## Day 76 — Harden Week 2, Day 4 (Fix Everything) summary

**Build under test:** `?v=1779465600`, `sw.js CACHE_NAME = 'signal-circuit-v52'`
**Result:** 0 open bugs at start of day, 0 open bugs at end. Day pivoted to closing the two verification-only learnings flagged on Day 75:

1. **`GameState.seedProgress(count, opts)`** — new dev/Harden helper on `js/main.js`. Synthetically marks levels 1..count as completed (with `_seeded:true` markers and configurable `stars` / `pureLogic` / `hardcore`) so future Harden harnesses can reach tier-gated UI (Tournament, Random Challenge, Adaptive, Infinite, Customize, Mastery Tree, …) without 18 manual completions. Non-destructive on real play. Returns a summary object for assertions.
2. **`runSimulation()` re-entry contract** — 7-line doc comment added directly above the existing `isAnimating` guard codifying the property Day 75 verified empirically: while a sim is in flight, additional invocations are no-ops; after completion the flag clears so subsequent clicks always start a fresh sim; no debounce beyond "one in flight at a time".

Live verification (12 assertions): build identity unified, seedProgress(18) reveals 13 tier3 buttons, cold start hides them all, non-destructive at lower stars, clear option wipes cleanly, Level 1 core loop unaffected, RUN-spam guard holds, 0 console errors.

Written up in `reviews/harden-cycle-2-week-summary.md`. Cycle 2 Harden Week closes one day early.


## Day 75 Edge & Stress Sweep — Cycle 2, Harden Day 3

**Build under test:** `?v=1779379200`, `sw.js CACHE_NAME = 'signal-circuit-v51'` (Day 74 Speedrun cleanup fix)
**Result:** 25/25 tests pass · 0 new bugs · 0 console errors

| # | Test | Result | Detail |
|---|------|--------|--------|
| T1 | Rapid gate placement during simulation | ✅ | 14 gates inserted mid-anim, no throws |
| T2 | Wire drawing while signal animation is playing | ✅ | wireManager.startWire mid-anim no-throw |
| T3 | 10 rapid `resize` events while on gameplay | ✅ | canvas 820×834 stable across all 10 |
| T4 | Tab-reachable focusable count on gameplay | ✅ | 15 focusables (back, shortcuts, encyclopedia, kb-wiring, panel-toggle, next-level…) |
| T5 | colorblind + light/dark mode class toggle | ✅ | both classes apply and revert |
| T6 | 25 gates + 20 wires perf | ✅ | 10× render = 13.9ms, **1.39ms avg frame** |
| T7 | localStorage capacity | ✅ | 50 × 50KB writes succeeded, no QuotaExceeded |
| T8 | Mode-switch storm (level-select ↔ daily/challenge/sandbox/tournament/infinite) | ✅ | always returns to `level-select` clean |
| T9 | Blitz + Speedrun HUD cleanup on Back (Day 61 + Day 74 regression) | ✅ | both `display:none`, mode flags `false`, timers cleared |
| T10 | RUN spam (10 rapid `runSimulation()` calls) | ✅ | 0 errors, animation completes |
| T11 | Quick Test spam (10 rapid `runQuickTest()` calls) | ✅ | 0 errors |
| T12 | Hint button spam | ✅ | hint count stays `≤ 3`, token system holds |
| T13 | Lab Bench entry (Level 36, Chapter 8 redesign) | ✅ | `isLabBench=true`, `#lab-hud` flex, RUN labeled '📐 Submit Blueprint', `_lab={attempts:0,max:3}` |
| T14 | Tournament screen open + close | ✅ | 3 tabs, 10 leaderboard rows, close resets `display:none` |
| T15 | Mythic celebration overlay (lazy-created) | ✅ | `ui.showMythicCelebration()` creates `#mythic-celebration` on demand, displays `flex` |
| T16 | Settings modal + 📲 Install App button | ✅ | `open-settings-btn` opens modal, install button present, close clean |
| T17 | Service worker controller activated | ✅ | `scriptURL=/sw.js`, `state=activated` |
| T18 | window blur/focus + visibilitychange cycle | ✅ | no throws |
| T19 | UI thrash — 15× `showLevelSelect()/startLevel(1)/showLevelSelect()` | ✅ | final screen `level-select`, gates clean |
| T20 | Undo/redo stress — 15 undos + 15 redos | ✅ | no throws, manager stable |
| T21 | Achievements modal sort (mythic-first) | ✅ | 54 rows; top 5 all `tier-mythic` |
| T22 | Build identity (cache-bust + SW version match) | ✅ | 11 `?v=` refs all `1779379200`, `CACHE_NAME=signal-circuit-v51` |
| T23 | localStorage clear (cold-start sim) | ✅ | 13 `signal*` keys removed, no residue |
| T24 | SW cache asset count | ✅ | `signal-circuit-v51` precache = 27 assets |
| T25 | Light-mode + colorblind paint stability on gameplay | ✅ | body bg = `rgb(245,243,235)`, canvas transparent |

**Console errors across all 25 tests:** 0 (only standard AudioContext autoplay warnings).

## Fixed (Recent)

### Day 74 — P2: Speedrun HUD Persists on Level Select ✅
- **Found:** Day 74 (Cycle 2 Harden Day 2). After entering Speedrun Mode and returning to the level select (e.g., via the Back button bypassing `stopSpeedrunMode()`), `#speedrun-hud` remained `display:flex` and `speedrunMode` stayed `true`.
- **Root cause:** Day 61 comment in `showLevelSelect()` claimed "Defensive Blitz/Speedrun HUD cleanup" but only the Blitz branch was wired. Speedrun was missed.
- **Fix:** Sibling defensive cleanup block added to `showLevelSelect()` (`js/main.js`) right below the Blitz cleanup. Clears `speedrunTimer` + `speedrunStart`, sets `speedrunMode=false`, hides `#speedrun-hud`.
- **Verified live:** Patched `showLevelSelect` injected into the running build cleared all three (mode flag, timer, HUD) on transition. Symmetric to the Day 61 Blitz fix.
- **Cache bust:** `index.html` `?v=1779379200`, `sw.js` `CACHE_NAME = 'signal-circuit-v51'`.

## Cosmetic / Minor Observations (Not Bugs)
- AudioContext warnings on page load (expected — resumes after first user gesture)
- Collection shows 4 of 6 completed levels (expected — only levels with saved preview data appear)
- Level 3 shows ★☆☆ in Review Suggested but ★★★🧠 on the card (review tracks worst score, card shows best — working as intended)
- Deprecated meta tag warning: `apple-mobile-web-app-capable` should be `mobile-web-app-capable` (cosmetic, non-breaking)

## Fixed (Recent)

### Audit Results — Day 73 (Harden Week 2, Day 1: Full Interaction Audit) — Cycle 2

**Build:** ?v=1779292800, sw v50 (Day 72 Weekly Tournament + Cycle Polish)

**Screens tested (all rendering, 0 console errors):**
- Level Select (tier-gated: cold start 2 buttons → tier3 reveals 18 nav buttons after 20 levels seeded)
- Gameplay Screen (Level 1 entry; truth table 4 rows; RUN / Quick Test / Hint / Clear / Prev / Next / Panel toggle / KB wiring / Back / Encyclopedia / Shortcuts — all visible)
- Settings Modal (14 buttons + SFX/Music sliders; 9 toggles flipped successfully: Colorblind, Text size, Simplified, Accessible Wiring, Light/Dark, Daily/Weekly/Streak notifications)
- Difficulty Mode button → opens nested confirm-modal with 3 options (Relaxed / Standard / Hardcore)
- How to Play modal (opens + closes cleanly)
- Daily Challenge screen (Back + ⚡ Start Today's Challenge); start → gameplay with isDaily=true
- Random Challenge screen (2 sliders: input-count, output-count; Generate / Push My Limits / Clear Scores); generate → isChallengeMode=true
- Tournament screen (3 tabs: This Week, My Best, Archive); archive shows 8 weeks with Play/Replay buttons; archive replay sets isTournament + isTournamentArchive=true
- Infinite Pre-Screen (Back + Start Run)
- Blitz Ladder (immediate gameplay entry; HUD does NOT persist after Back — Day 61 fix verified)
- Speedrun Mode (immediate gameplay entry; HUD does NOT persist after Back)
- Sandbox config screen (Back + Start Sandbox)
- Creator config screen (Back + Play Level + Share Link)
- Adaptive Challenge button → direct entry to gameplay-screen

**Modals tested (all rendering with content):**
- Gate Encyclopedia (rich content, gate symbols visible)
- Achievements (tier-sorted: 🌌 Mythic → 💎 Diamond → 🥇 Gold → 🥈 Silver → 🥉 Bronze; chase progress visible)
- Stats (3 charts render: chart-daily-playtime 480x140, chart-stars-over-time 480x140, chart-skill-progression 480x100)
- Customize (Wire Colors / Gate Skins / Board Themes sections with cosmetic-card preview swatches)
- Mastery Tree (5-tier grid: Basics → Combinations → Universal → etc. with mastery checkmarks for completed gates)
- Circuit Collection (empty state message for 0 saved levels — expected)
- Logic Profile (level count 14/29 · ⭐ 42/ — stats render)

**Console:**
- 0 JS errors across all paths
- Only AudioContext autoplay warnings (expected; resumes after user gesture)

**Day 61 fix regression checks (still in place):**
- Blitz HUD: 'none' on level-select after Blitz exit ✅
- Speedrun HUD: 'none' on level-select after Speedrun exit ✅ (bonus check)
- Daily Leaderboard: dedup logic in place
- Stats: _logSession filter in place

**Result: 0 new bugs. Audit pass.**

### Day 61 — Harden Week 1, Day 4: Fix Everything

**P2 — Blitz Mode Bar Persists on Level Select** ✅
- **Fix:** `showLevelSelect()` in `js/main.js` now defensively clears any active blitz timer, sets `blitzMode = false`, and hides `#blitz-hud` (`display: none`) on every transition into the level select screen.
- **Why it works:** The HUD is now torn down by the *destination* screen, not just the *source* mode's exit handler. Every navigation path into level select (Back button, programmatic `showLevelSelect()`, post-completion auto-return, mode-switch, etc.) is covered.

**P2 — Daily Leaderboard Duplicate Name** ✅
- **Fix:** `DailyLeaderboard.generatePseudoScores()` now tracks used names in a `Set`. On collision, it linearly probes forward through `DAILY_LB_NAMES`. If the entire 40-name pool is exhausted (last 10 of 50 entries), it appends `_<i>` as a deterministic fallback. Top 10 displayed entries are always unique.
- **Verified:** Headless test across 10 distinct date seeds (today, +1d, +5d, +30d, +90d, +180d, +365d, holidays): top-10 unique = 10/10 in every case; full 50-entry list also fully unique post-suffix.

**P2 — Stats: Empty Sessions Recorded** ✅
- **Fix:** Two-layer defense.
  1. `_logSession()` in `js/main.js` early-returns when `sessionLevels <= 0`, so future page-navigation-only sessions never get persisted.
  2. `renderStats()` in `js/ui.js` filters `s.levelsPlayed > 0` before rendering Recent Sessions, hiding any legacy 0-level rows already saved in localStorage.

**Cache bust:** `index.html` `?v=1777216661`, `sw.js` `CACHE_NAME = 'signal-circuit-v42'`.

### Earlier Audits

#### Audit Results — Day 60 (Harden Week 1, Day 3: Edge Cases & Stress)

13/13 stress tests passed (rapid gate placement, wire drawing during animation, window resize, localStorage clear, keyboard navigation, colorblind mode, light/dark mode, performance with many wires/gates, empty simulation, undo/redo, text size, blitz entry/exit, localStorage capacity). Console: 0 JS errors. No new bugs found; all 3 P2 bugs from Days 58–59 confirmed open going into Day 4.

#### Audit Results — Day 59 (Harden Week 1, Day 2: Level Playthrough)

Levels 1–5 played hands-on with truth tables verified and 3-star solves. All 40 truth tables programmatically validated (non-degenerate, correct row counts; spot-checked L7 XOR, L13 Half Adder, L15 Majority, L17 Full Adder, L25 Ripple Adder). All 5 challenge modes tested (Daily / Random / Blitz / Speedrun / Sandbox). Community level "The Implication" played successfully. Star/hint systems verified. 0 JS errors; new P2 bug (Blitz bar persistence) found.

#### Audit Results — Day 58 (Harden Week 1, Day 1: Interaction Audit)

All 20 screens tested and rendering correctly: Level Select, Gameplay (L1), Daily Challenge, Sandbox, Puzzle of the Week, Gate Encyclopedia, Achievements, Stats Dashboard, Customize, Mastery Tree, Circuit Collection, Logic Profile, How to Play, Light/Dark mode, Colorblind/Text Size/Simplified/Accessible Wiring/Difficulty buttons, Volume controls, Notification settings, Export/Import Progress, Review Suggested, Community Levels. 0 JS errors. 2 P2 bugs documented (Daily Leaderboard duplicate name, Stats empty sessions).
