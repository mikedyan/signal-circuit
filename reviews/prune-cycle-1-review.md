# Signal Circuit — Prune Week Validation Review (Cycle 1, Day 5)

**Date:** May 2, 2026
**Reviewer:** Mochi (autonomous factory)
**Build under review:** `index.html?v=1778083200`, SW `signal-circuit-v45`
**Codebase:** ~25,681 lines across 10 JS modules + 1 CSS + 1 HTML
**Cycle stage:** End of Cycle 1 — 14 days into the 90-day rotation, prune week complete

---

## Executive Summary

Cycle 1 is closing on a high note. Build week (Days 35–57) shipped 21 substantive feature days. Harden week (Days 58–62) found and resolved every open bug — the harden ledger ended at 0 P0 / 0 P1 / 0 P2 — and produced a regression-clean live build. Prune week (Days 63–66) reduced first-launch button count from **29 → 5**, removed **14 dead JS methods + 10 orphan CSS rules** (net −217 LOC), and tightened polish around copy length, locked-card emphasis, and fresh-profile chrome.

The result is a game that now genuinely lives up to its strengths instead of burying them. The biggest wins from the original Day 35 review — replayability, addictiveness, the chapter 3→4 cliff, and the "feature breadth exceeds depth" critique — have all been addressed in build week and validated through harden+prune. The remaining ceilings are real but smaller: social leaderboards are pseudo (not federated), level creation is still niche, and the codebase is still monolithic.

---

## Dimension Scores (1–10 Scale)

| Dimension | Day 35 | Day 67 | Δ | Notes |
|---|---|---|---|---|
| First Impression | 8 | 9 | +1 | Cold-start now 1 click to Level 1; subtitle compressed; chrome de-cluttered |
| Clarity | 8 | 9 | +1 | Mode-gating prevents new players from being overwhelmed; "Used in" no longer references locked levels |
| Core Loop | 7 | 8 | +1 | Signal flow visualization + sub-circuit abstraction added genuine "aha" beats |
| Difficulty Curve | 7 | 8 | +1 | Bridge levels 18–20 plus difficulty mode (Relaxed/Standard/Hardcore) smooth the cliff |
| Juice / Polish | 9 | 9 | 0 | Already at ceiling; chapter-specific celebrations preserved during prune |
| Replayability | 5 | 8 | +3 | Adaptive Challenge with skill tracking, daily leaderboard with rank, replay viewer, mastery tree, gate-limit hard mode, community levels |
| Uniqueness | 8 | 8 | 0 | Same core differentiators; Mastery Tree adds a new niche identity |
| Bug-Free | 7 | 9 | +2 | Harden week swept; 0 open bugs, regression clean on live deploy |
| Visual Design | 8 | 8 | 0 | Light mode + 4 board themes + 4 gate skins added; locked cards now tasteful |
| Addictiveness | 6 | 8 | +2 | Streak system surfaced, daily leaderboard rank, achievements expanded, cosmetic unlocks tied to mastery |
| **Average** | **7.3** | **8.4** | **+1.1** | |

---

## What the Cycle Shipped (high-leverage items vs Day 35 backlog)

| Day 35 critical/high-impact item | Status |
|---|---|
| #1 Global leaderboard | ✅ Pseudo-leaderboard (Day 44) — competitive framing live |
| #2 Difficulty bridge levels Ch3→Ch4 | ✅ Three bridge levels added (Day 36) |
| #3 Tutorial for wire drawing | ✅ Interactive tutorial (Day 38) |
| #4 Truth table size mgmt for 4-input | ✅ Compact mode + sorting + key rows + sticky headers (Day 39) |
| #5 Undo/redo shortcut visibility | ✅ Shortcuts overlay (Day 48) |
| #6 Daily-play achievements | ✅ Week Warrior, Month of Logic, Streak Master (Day 41) |
| #7 Cosmetic unlocks | ✅ 6 wire palettes + 4 gate skins + 4 board themes (Day 40) |
| #8 Animated solution replay | ✅ ReplayViewer (Day 51) |
| #9 Community level browser | ✅ 20 curated community levels + Featured (Day 49) |
| #10 Adaptive challenges | ✅ SkillTracker + adaptive generator (Day 50) |
| #11 Signal flow visualization | ✅ Animated dots + gate glow (Day 37) |
| #12 Sub-circuit abstraction | ✅ Save-as-custom-gate (Day 53) |
| #13 Timed daily with rank | ✅ Percentile + rank badge (Day 44) |
| #15 Gate-limit challenges | ✅ Diamond badge mode (Day 45) |
| #16 PWA push notifications | ✅ NotificationManager (Day 52) |
| #17 Separate SFX/Music sliders | ✅ Dual sliders (Day 46) |
| #18 Difficulty selector | ✅ Relaxed/Standard/Hardcore (Day 56) |
| #21 Level preview thumbnails | ✅ Mini-canvas previews (Day 43) |
| #23 Celebration variety | ✅ Chapter-specific particles (Day 47) |
| #24 Keyboard-first wiring | ✅ KB Wiring mode + Tab/Enter (Day 48) |
| #25 Error explanation on failure | ✅ Trace failure path + "Why?" + "Show me" (Day 42) |
| #30 PWA offline hardening | ✅ SW v45, full asset audit (Day 52) |

That's 22 of the 30 Day 35 backlog items shipped. The 8 not shipped are mostly architectural (#27 i18n, #28 screen-reader circuit description, #29 save slots, #19 wire routing improvements, #26 OffscreenCanvas perf, #20 collaborative sandbox, #14 chapter star gates, #22 gate position memory) — none are blocking.

## What the Prune Week Removed

- **15 visible buttons** consolidated or hidden behind progress gates (level-select cold-start: 29 → 5)
- **2 onboarding modals** dropped from cold-start path (Placement Test now opt-in)
- **1 duplicate Creator entry** merged
- **14 orphan JS methods/functions** deleted (achievements, audio, canvas, levels, main, simulation, ui, wires)
- **10 dead CSS rules** removed
- **−217 LOC net** (insertions were cache-bust-only)
- **1 marketing-y subtitle clause** trimmed
- **1 over-long button label** compressed ("Adaptive Challenge Novice" → "🎯 Adaptive" + skill pill)
- **1 vestigial chrome chip** hidden on fresh profiles ("⭐ 0")
- **2 visual-noise issues** fixed (locked-card opacity + grayscale, "Used in" filter to unlocked levels)

The cycle ended with a tighter, less apologetic, more confident first-launch experience — the single most important thing for a game that wants to be returned to.

---

## Validation Smoke Tests (Day 67, Live Deploy)

Tested against `https://mikedyan.github.io/signal-circuit/` with a fresh `localStorage`:

- ✅ Cold-start renders level select directly (no Placement Test, no Difficulty modal forced)
- ✅ Subtitle is "Repair the ship's logic systems." (single sentence)
- ✅ Cold-start visible challenge entries: 0 (mode-gated until 6 levels completed)
- ✅ Locked level cards render at opacity 0.6 + grayscale(0.5) (light mode)
- ✅ Star chip "⭐ 0" hidden on fresh profile
- ✅ Level 1 entry: gameplay screen, RUN button, 4 truth-table rows, "🟢 Level 1: AND Gate Basics" title, 820×834 canvas
- ✅ "Used in: …" forward references properly filtered (not visible on fresh profile)
- ✅ Console: 0 errors

Build identity: `?v=1778083200` (Day 66 cache-bust), service worker `signal-circuit-v45` — matches the latest deployed prune-polish build.

---

## Remaining Weaknesses (honest, not exhaustive)

- **Pseudo-leaderboard, not real.** Daily Challenge rank/percentile is generated client-side from a date seed. It feels competitive but isn't federated. To go from 8 → 9 on replayability, this needs a real backend (or Cloudflare Workers + KV).
- **Code architecture stays monolithic.** 25,681 LOC, no module system, single-file imports via index.html. Worked fine for Phase 1–3, but adding more features will start to hurt. A future cycle should consider a build step.
- **Mobile is good but not great.** Touch tested fine, haptics fire, layout adapts — but there's no native install promotion at the right moment, and several modals are still cramped on iPhone SE.
- **Discovery Lab (Chapter 8) still feels bolted on.** Open-design levels lack the structured learning of earlier chapters. Either lean into "freeform" framing or absorb into Sandbox.
- **Achievement coverage is wide but shallow.** ~30+ achievements with similar reward shape. A rare/epic tier might add chase appeal.

---

## Recommendations for Cycle 2 Build Week (May 9–15, 2026)

Coming out of Cycle 1, the highest-leverage Cycle 2 build candidates:

1. **Real federated daily leaderboard** (Cloudflare Worker + KV, anonymous score POSTs) — closes the biggest credibility gap.
2. **Module split** (start with `audio.js`, `wires.js` — the tightest modules) so future builders aren't fighting one 25k-line monolith.
3. **Mobile install moment** — show the install prompt after 3 completed levels with a contextual benefit message.
4. **One deep replayability hook** — pick *one* of: "infinite mode" with smartly-generated puzzles that scale to skill, or a real ranked seasons system. Don't add both.
5. **Discovery Lab redesign** — either give it a unique rule set ("solve without simulation") or fold it into Sandbox.

Save these for the Cycle 2 Monday roadmap; do not pre-empt.

---

## Final Scorecard

**Cycle 1 final score: 8.4 / 10 (+1.1 from Day 35 baseline 7.3)**

| Bucket | Status |
|---|---|
| Items completed in cycle | 21 build days, 5 harden days, 4 prune days = 30 day-tasks |
| Open bugs entering Cycle 2 | 0 |
| Visible buttons on cold start | 5 (was 29) |
| Time-to-Level-1 from cold start | 1 click (was 3) |
| Net LOC delta (prune week) | −217 |
| Console errors on live deploy | 0 |
| Day 35 backlog items shipped | 22 / 30 (73%) |

Cycle 1 was a strong opening for the 90-day rotation. The build week earned its features, the harden week proved them, and the prune week made room for the next cycle to add more without suffocating the player.

— *Mochi*
