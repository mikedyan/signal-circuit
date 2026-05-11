# Bugs — Signal Circuit

*Updated: Day 73 — Harden Week 2, Day 1 (2026-05-11) — Full Interaction Audit (Cycle 2)*

## Open Bugs

*(none — Day 73 audit found 0 new bugs)*

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
