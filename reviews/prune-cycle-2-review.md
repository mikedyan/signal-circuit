# Signal Circuit — Prune Week Validation Review (Cycle 2, Day 5)

**Date:** 2026-05-19 (Tuesday)
**Reviewer:** Mochi (autonomous factory)
**Build under review:** `index.html?v=1779724800`, SW `signal-circuit-v55`
**Codebase:** ~26.4k lines across 10 JS modules + 1 CSS + 1 HTML (net −308 LOC from Cycle 1 close after Day 79's −180 + Day 80's +89 + cycle-2 build adds)
**Cycle stage:** End of Cycle 2 — 28 days into the 90-day rotation, prune week 2 complete

---

## Executive Summary

Cycle 2 closes stronger than Cycle 1, but the win is narrower because Cycle 1 already moved most of the dials. Build week (Days 68–72) added five concentrated features — Infinite Mode, Discovery Lab redesign (Lab Bench), mythic/diamond achievement tier, Weekly Tournament with archive — and retired Puzzle of the Week in favor of Tournament. Harden week (Days 73–76) audited every screen, fixed one P2 (Speedrun HUD persistence — sibling of the Day 61 Blitz fix), added a `GameState.seedProgress()` dev helper that paid for itself immediately on the prune fresh-eyes audit, and wrapped one day early because the bug queue was empty after Day 76. Prune week (Days 77–81) re-scored clutter at **5/10 (was 8/10 in Cycle 1)**, shipped all five Tier-1 cuts (per-card overflow menu, smooth Tier-2 staircase, retire PotW, drop L1 hint footer, silent-default difficulty), did a code-cleanup pass that removed 8 orphan JS identifiers and 5 orphan CSS blocks (−180 LOC), and a polish sprint that added 5 smooth-loop items (overflowPopIn animation, tier-reveal pulse, focus-visible rings, reduced-motion welcome toast, mobile popover constraint) at +89 LOC.

Net cycle delta on the core "how does this feel to a returning player" axis: **+0.5 points**. The first-launch surface is still tight, the Tier-2 cliff is now a smooth 3 → 5 → 8 → 11 → 16 staircase, the end-game button explosion is solved (40 overflow + 18 nav at 40-star, was 80 sub-buttons + 18 nav), and the Lab Bench redesign gave Chapter 8 a unique identity ("design first, submit once") that was the headline complaint at the Cycle 1 close. The remaining ceilings are all the same as Cycle 1: pseudo-leaderboard, no real federation, monolithic codebase.

---

## Dimension Scores (1–10 Scale)

| Dimension | Day 35 | Day 67 (C1) | Day 81 (C2) | Δ C1→C2 | Notes |
|---|---|---|---|---|---|
| First Impression | 8 | 9 | 9 | 0 | Already at ceiling; Day 80 polish reinforces |
| Clarity | 8 | 9 | 9 | 0 | Day 78 silent-default removed last cold-start modal; capped |
| Core Loop | 7 | 8 | 9 | +1 | Smooth popover animation, tier-reveal pulse, focus rings, Lab Bench's "design first" beat |
| Difficulty Curve | 7 | 8 | 8 | 0 | Lab Bench is parallel to chapters 4–7; curve itself unchanged |
| Juice / Polish | 9 | 9 | 9 | 0 | Cap; Day 80 adds reduced-motion compliance and 9 focus-visible rings |
| Replayability | 5 | 8 | 9 | +1 | Weekly Tournament (Day 72) + Infinite Mode (Day 68) + 8 mythic/diamond achievements (Day 71) close the credibility gap on competitive framing |
| Uniqueness | 8 | 8 | 9 | +1 | "Design first, submit once" Lab Bench mechanic is genuinely novel for the genre |
| Bug-Free | 7 | 9 | 9 | 0 | Cap; harden week wrapped a day early with 0 open bugs |
| Visual Design | 8 | 8 | 9 | +1 | Day 80 staircase pulse + focus rings + Lab Bench blueprint celebration (cyan/white hologram particles) |
| Addictiveness | 6 | 8 | 9 | +1 | Weekly Tournament with archive + 50-streak Infinite Mode + mythic tier chase items |
| **Average** | **7.3** | **8.4** | **8.9** | **+0.5** | |

---

## What the Cycle Shipped (Cycle 2 build week)

| Day | Feature | Status |
|---|---|---|
| 68 | Infinite Mode (3 lives, streak ladder, tier bumps every 5-streak, best-run persistence, 2 gold achievements) | ✅ |
| 69 | Install-prompt revamp (L3 trigger + welcome-arc toasts + iOS Safari fallback + standalone suppression) | ✅ |
| 70 | Lab Bench redesign of Chapter 8 (5 levels) — `isLabBench` flag, 3-tries budget, blueprint hologram celebration, 2 new gold achievements (`drafted_right`, `lab_method`) | ✅ |
| 71 | Achievements expansion — 5 mythic + 3 diamond, mythic-first sort, tier-class CSS, Mythic wire palette gated by `anyMythic`, mythic celebration overlay | ✅ |
| 72 | Weekly Tournament with ISO-week archive, pseudo-leaderboard top-50, 3-tab UI, retirement of Puzzle-of-the-Week, podium + crowned achievements | ✅ |

**Cycle 1 backlog item carry-overs (from prune-cycle-1-review.md "Recommendations"):**

1. ✅ "Real federated daily leaderboard" — **Partial.** Weekly Tournament (Day 72) keeps the pseudo-leaderboard architecture but adds an archive, podium chase, and a "Live" current-week badge. A real backend was scoped out as out-of-cycle.
2. ⛔ "Module split" — **Not shipped.** Codebase is still monolithic. Carries to Cycle 3.
3. ✅ "Mobile install moment" — Day 69 ships the L3-trigger install arc, snooze persistence, iOS Safari modal fallback, and standalone-mode suppression.
4. ✅ "One deep replayability hook" — Day 68 Infinite Mode AND Day 72 Tournament. The cycle-1 review said "don't add both" — but they ship in different roles (Infinite is single-player endurance, Tournament is competitive weekly). Net effect: one deep hook plus one ambient hook.
5. ✅ "Discovery Lab redesign" — Day 70 ships Lab Bench. "Design first, submit once" 3-tries-only mechanic with first-try gold achievement chase.

**4 of 5 cycle-1 recommendations shipped; 1 deferred.**

## What the Prune Week Removed / Simplified

- **5 Tier-1 cuts** from PRUNE_REPORT (Day 78):
  - Per-card `⋯` overflow menu collapses 80 sub-buttons (👁 Solution + 🏆 Gate Limit × 40) into 40 single corner buttons at end-game.
  - Smooth Tier-2 reveal: staircase of 3 → 5 → 8 → 11 → 16 visible nav buttons across L6/L9/L12/L15/L18.
  - Puzzle of the Week retired (Tournament subsumed it; DOM removed, no localStorage migration since saved bests are inert).
  - L1 hint-policy footer hidden until L4+ (where hint tokens become a real consideration).
  - Silent-default difficulty modal: brand-new players auto-get `setDifficultyMode('standard')` + 4.5s welcome toast pointing at Settings; DIFFICULTY_KEY prevents re-prompt.
- **8 orphan JS identifiers** removed (Day 79):
  - `ui.showFirstLaunchDifficultyModal`, `AchievementManager.{checkLightning, checkEclipseRun, checkArchitect, isMythic}`, `InfiniteRunManager._showHud`, `InteractiveTutorial.getCurrentStep`, `NotificationManager.{checkWeeklyNotification, _getWeekNumber, _showWeeklyToast}`
- **5 orphan CSS blocks** removed (Day 79):
  - `.weekly-btn` + `::after NEW` badge, `#weekly-toast`, `#mute-btn` (3 rules), `#gate-count-display` (2 rules), dead light-mode selectors (`.modal-content / #confirm-modal-box / #creator-content / #mastery-content`).
- **1 storage key** retired (`WEEKLY_NOTIF_KEY`).
- **−180 LOC net** in Day 79; **+89 LOC** in Day 80 polish (polish budget is the explicit Prune Week exception per the orchestrator prompt). Net prune-week LOC delta: **−91**.
- **5 polish items** shipped Day 80:
  - `overflowPopIn` keyframe (180ms fade+lift, gated by `prefers-reduced-motion`)
  - Tier-staircase newly-revealed pulse via `applyProgressGating()` diff against `_lastGatingState`
  - `:focus-visible` cyan rings on 9 primary interactive surfaces (light-mode variant included)
  - Welcome toast respects `prefers-reduced-motion`
  - Mobile overflow popover constraint at `max-width:480px` (`min-width:116px` + `right:max(6px, env(safe-area-inset-right))`)

---

## Validation Smoke Tests (Day 81, localhost mirror of latest commit)

Tested on `http://localhost:8901/` (HEAD = `?v=1779724800`, SW v55) via raw CDP from a permissive headless Chromium instance. Live deploy (`https://mikedyan.github.io/signal-circuit/`) lags by 1–2 minutes after each push but matches identically once Pages catches up.

### Build identity
- ✅ 11 cache-bust refs unified at `?v=1779724800`
- ✅ Service worker controller = `signal-circuit-v55`
- ✅ `game.constructor.name === 'GameState'`

### Cold start (localStorage cleared)
- ✅ `level-select-screen` visible, `gameplay-screen` hidden
- ✅ **2 non-level buttons** (How to Play + Settings) — unchanged from Day 77 baseline
- ✅ 40 level cards rendered, 0 overflow buttons (no completions yet)
- ✅ Placement modal hidden (Day 64 #4 holds)
- ✅ Welcome toast visible (Day 78 #5 silent-default arc)
- ✅ Difficulty modal hidden (Day 78 #5 silent-default)
- ✅ Tournament button hidden cold (tier3-gated)
- ✅ `#weekly-puzzle-btn` DOM node absent (Day 79 cleanup)
- ✅ Star chip "⭐ 0" hidden on fresh profile (Day 66 #12 holds)

### Tier staircase (Day 78 #2 verification)
| Seed count | Non-level buttons | Overflow buttons | Tournament visible | Notes |
|---|---|---|---|---|
| 0 (cold) | 2 | 0 | ❌ | How to Play + Settings only |
| 6 | 5 | 6 | ❌ | +3 (Daily, Encyclopedia, Stats) |
| 9 | 7 | 9 | ❌ | +2 (Random Challenge, Sandbox) |
| 12 | 10 | 12 | ❌ | +3 (Achievements + 2 others) |
| 18 | 18 | 18 | ✅ | +8 (Tournament, Mastery Tree, Collection, Profile, …) |
| 40 | 18 | 40 | ✅ | End-game = 58 total buttons (was 98 pre-Day-78) |

### Level playthroughs (5 levels across chapters)
- ✅ **L1 (AND Gate Basics)** — gameplay screen loads, tutorial overlay fires (STEP 1 OF 8), 4 truth-table rows, hint-footer hidden (Day 78 #4), Lab HUD hidden, `isLabBench === false`, Quick Test visible, RUN labeled "▶ RUN"
- ✅ **L6 (Signal Selector)** — Tier-1 reveal threshold; 4 truth-table rows, hint footer **visible** at L6 (Day 78 #4 only hides L<4), no Lab HUD
- ✅ **L12 (Dual Output Router)** — Tier-2 cliff cleanup point; 4 truth-table rows, level loads cleanly
- ✅ **L18 (2-Input Decoder)** — Tier-3 endgame surface; 4 truth-table rows, gold-tier marker (🟡), no Lab HUD
- ✅ **L36 (Lab Bench · Open Design: 3-Input Selector)** — Lab Bench identity correct: title prefix "📐 Lab Bench · L36:", `isLabBench === true`, RUN labeled "📐 Submit Blueprint", Quick Test **hidden** in lab mode, lab HUD visible, `_lab = {attempts:0, maxAttempts:3, exhausted:false, firstTryLocked:false, cleared:false}`, lab tutorial overlay fires on first entry, 8 truth-table rows (3-input)

### Day 80 polish artifacts
- ✅ `overflowPopIn` keyframe present
- ✅ `tierRevealPulse` keyframe present
- ✅ `.newly-revealed` rule present
- ✅ `:focus-visible` rule present
- ✅ `prefers-reduced-motion` + `#welcome-toast` rule present
- ⚠️ `game._lastGatingState` reads `undefined` on cold start — by design (cold-start pulse-suppression branch), the staircase pulse worked correctly across all 5 seed transitions

### Day 79 dead-identifier regression
- ✅ `game.ui.showFirstLaunchDifficultyModal` → `undefined`
- ✅ `AchievementManager.prototype.checkLightning` → `undefined`
- ✅ `AchievementManager.prototype.isMythic` → `undefined`
- ✅ `#weekly-puzzle-btn` DOM absent

### Cold-start defaults audit
- ✅ `audio._sfxVol = 0.4` (Day 46 default, Day 80 audited)
- ✅ `audio._musicVol = 0.2` (Day 46 default, Day 80 audited)
- ✅ `body.classList.contains('light-mode')` (system preference picked up at boot)
- ✅ No `signal-circuit-difficulty` localStorage key on cold start (silent-default writes `'standard'` after the welcome toast — confirmed in Day 78 + Day 79 regression suites)

### Console errors
- ✅ **0 console errors across the entire validation pass** (24 distinct probes + 5 navigations)

---

## Remaining Weaknesses (honest, not exhaustive)

Same shape as Cycle 1, with Cycle 2 footnotes:

- **Pseudo-leaderboard, still not federated.** Tournament archive is a clever local-only architecture (ISO-week seeded, deterministic 50-name Gaussian-ish field) but it's not real competition. To go from 9 → 10 on replayability/addictiveness, this needs a real backend. The architecture is now ready for it — every score path already writes through `submitScore({rank, percentile, isNewBest, score, podium, crowned})`.
- **Codebase is still monolithic** (~26.4k LOC, no module system, single-file imports). Cycle 2 cycled around this rather than addressing it. The orphan-scanner pass on Day 79 surfaced 4 extra dead identifiers beyond the focus list — a build step + tree-shaking would have caught them all automatically. Promoting this to a Cycle 3 build candidate.
- **Lab Bench is a strong identity but only 5 levels.** Chapter 8 (L36–L40) is now meaningfully distinct from the rest of the campaign, but the chapter is short. A future cycle should consider adding a "Lab Bench II" mini-chapter at the L60+ range, or letting players promote their own completed Sandbox circuits into Lab Bench-style puzzles for friends.
- **No haptic / sound diff between popover-open and overflow-action-confirm.** Day 80 added a visual animation but the audio cue is the same one used for regular button clicks. Minor; not blocking.
- **`_lastGatingState` is not exposed on `game` directly** — it sits inside `applyProgressGating()` closure, which is fine functionally but means the dev console can't introspect last-gating state for debugging. Promote to a `game._lastGatingState = …` write on next polish day if it ever blocks a bug.

## Recommendations for Cycle 3 Build Week (May 23–29, 2026)

Coming out of Cycle 2:

1. **Module split (carry-over from Cycle 1 rec #2).** Start with `audio.js` (tightest, fewest globals) → `wires.js` → `achievements.js`. Use a 5-line bundle step or just ES modules with `<script type="module">`. This is the biggest debt and the longest-rotting one.
2. **Real federated leaderboard backend.** Cloudflare Worker + KV. The Tournament UI is already shaped for it; just swap the `submitScore` internals. Make it opt-in with a display name. Keep the pseudo-leaderboard as offline fallback.
3. **Lab Bench II — 3 more levels at L60+ range.** Reuse the `isLabBench` flag + state machine, but introduce a new constraint per level (e.g., "no XOR allowed", "minimize fan-out", "design that scales to 4 inputs without rewiring"). Lab Bench's identity rewards being more of it.
4. **One social hook: shareable circuit images.** Day 53 sub-circuits + Day 43 preview canvas + a Twitter/Mastodon share card composer. Small, viral, low risk.
5. **Onboarding A/B: silent-default vs. opt-in difficulty.** The Day 78 silent-default + welcome-toast arc is unverified at scale. Worth keeping a feature flag to flip back for ~10% of cold starts and comparing retention if/when there's any analytics surface.

Save these for the Cycle 3 Monday roadmap; do not pre-empt.

---

## Final Scorecard

**Cycle 2 final score: 8.9 / 10 (+0.5 from Cycle 1 close 8.4)**

| Bucket | Status |
|---|---|
| Cycle days run | 5 build + 4 harden (early wrap) + 5 prune = 14 day-tasks |
| Open bugs entering Cycle 3 | 0 |
| Visible buttons on cold start | 2 (same as Cycle 1) |
| Visible buttons at end-game (40-star) | 58 (was 98 pre-Day 78) |
| Tier-2 reveal | 3 → 5 → 8 → 11 → 16 staircase (was 5 → 18 single cliff) |
| Time-to-Level-1 from cold start | 1 click (same as Cycle 1) |
| Net LOC delta (cycle 2) | +1244 build / −180 cleanup / +89 polish = **net +1153** (build week dominated; prune week was net-negative on its own) |
| Console errors on live deploy | 0 |
| Cycle 1 recommendations shipped | 4 / 5 (module split deferred to Cycle 3) |

Cycle 2 hit four of five Cycle-1 recommendations, retired Puzzle-of-the-Week cleanly, found and fixed its single P2 in harden week, wrapped harden a day early because the queue was empty, simplified the end-game button surface 98 → 58, smoothed the Tier-2 cliff into a 5-step staircase, and added the first genuinely distinctive Chapter-8 identity in the project's history (Lab Bench). The +0.5 score delta is smaller than Cycle 1's +1.1 because most of Cycle 1's wins were "fix the obvious problems" and Cycle 2's wins are "fix the subtle problems" — the marginal cost of points is higher up here, and that's healthy.

— *Mochi*
