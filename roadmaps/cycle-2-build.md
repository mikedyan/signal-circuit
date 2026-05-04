# Signal Circuit — Cycle 2 Build Week Roadmap (May 4–8, 2026)

**Cycle:** 2
**Week type:** build
**Days covered:** 68–72 (cycleDay 16–20)
**Score baseline:** 8.4 / 10 (end of Cycle 1)
**Theme:** "Depth over breadth" — Cycle 1 added 21 features in 21 days. Cycle 2 picks fewer, bigger features and lets each one earn its place. Replayability and chase-loop are the two highest-leverage targets.

---

## Day 68 (Mon) — Infinite Mode (Endless Skill-Adaptive Puzzles)

**Why first:** Cycle 1 review's #1 deep replayability recommendation. SkillTracker (Day 50) and adaptive challenge generator already exist — Infinite Mode is the "deep run" wrapper that turns those into a chase loop.

**Items (10):**
1. `InfiniteRunManager` class with run state (lives, streak, totalSolved, bestStreak, runStartTime, totalTime)
2. "♾️ Infinite" button on level-select (mode-gated behind 12+ levels completed, sits next to Adaptive)
3. Pre-screen showing best run stats + start button + difficulty floor (Novice / Standard / Expert)
4. Auto-generate next puzzle on solve via adaptive generator; skill tier bumps every 5-streak
5. In-gameplay HUD: ❤️×3 lives + 🔥 streak + ⏱ run time + 🧮 total solved
6. Skip button consumes a life; 0 lives = run ends. Wrong-circuit RUN does NOT cost a life
7. Run-summary screen: streak, total solved, time, best update banner, "Run Again" + "Share" + "Done"
8. Persist best run in localStorage (`bestStreak`, `bestSolved`, `bestTimeSec`, `totalRuns`)
9. Two new achievements: 🌌 Infinite Marathon (50 streak), 💡 Pure Logic Run (10 solves no hints)
10. Cache bust + service worker v46

## Day 69 (Tue) — Mobile Install Moment + Welcome Onramp

**Why:** Cycle 1 review weakness: "no native install promotion at the right moment". Today reframes the install prompt around the player's first 3 wins — the moment of peak intent.

**Items (10):**
1. Replace session-count trigger with level-completion trigger (3 levels solved)
2. Welcome toast arc: L1 done = "🎉 First circuit lit!" / L2 = "⚡ Two down" / L3 = "🚀 You're flowing — install for offline + notifications"
3. Custom branded install modal (not OS default) with benefit copy ("Offline play", "Daily notifications", "1 tap to start")
4. Suppress install prompt entirely if `display-mode: standalone`
5. "Maybe Later" snoozes 14 days; "No Thanks" snoozes 90 days; track in localStorage
6. iOS-specific install instructions modal (Add to Home Screen) when `beforeinstallprompt` is unavailable
7. Onboarding step counter (1/3, 2/3, 3/3) on Level 1–3 cards for fresh profiles
8. Streak seed cleanup: clear the inflated `🔥3 🧊1` chip on truly fresh profiles (Day 67 review found it)
9. Settings → "Install App" entry that re-shows the prompt on demand
10. Cache bust + service worker v47

## Day 70 (Wed) — Discovery Lab Redesign: Blueprint Mode

**Why:** Cycle 1 review: "Discovery Lab (Chapter 8) still feels bolted on." Today gives it a unique rule that no other chapter has — *no simulation allowed* until you commit your design.

**Items (10):**
1. Blueprint Mode flag on Discovery Lab levels (RUN button locked until "Submit Blueprint")
2. "Submit Blueprint" CTA replaces RUN button; one-shot evaluation reveals all rows at once
3. Pre-submit budget chip: "estimated gates used / target"
4. Three try counter — 3 submits per attempt, then a "Reset Lab" reveals truth table for free
5. Lab-only celebration: blueprint hologram particle burst (different from chapter celebrations)
6. Discovery Lab UI label change: "Lab Bench" with notebook iconography on level cards
7. Tutorial overlay first-time entering Lab Bench ("In Lab Bench, you design first, test once")
8. Stats: "Blueprints submitted", "First-try success rate", new bar in stats dashboard
9. Two Lab achievements: 📐 Drafted Right (3 first-try blueprints), 🔬 Method (10 lab levels cleared)
10. Cache bust + service worker v48

## Day 71 (Thu) — Rare/Epic Achievement Tier

**Why:** Cycle 1 review weakness: "Achievement coverage is wide but shallow." Today adds chase-tier achievements (gold/diamond/mythic) that take real effort.

**Items (10):**
1. Tier metadata on every achievement (`tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic'`)
2. Migration: backfill tier on existing 30+ achievements (most go bronze/silver)
3. Five new mythic achievements (only earnable through extreme play):
   - 🌌 Galaxy Brain (3-star every campaign level + every mastery)
   - 🌑 Eclipse Run (30-day perfect streak)
   - 🏛️ Architect (build 10 sub-circuits)
   - ⚡ Lightning (Infinite Mode 100-streak)
   - 📜 Logician's Path (Pure Logic on every level)
4. Three new diamond achievements (Hardcore Marathon, 1000 gates placed, 50 community plays)
5. Tier-based card styling (gold border for gold, prismatic for mythic)
6. Mythic unlock celebration: full-screen takeover w/ name engraving animation
7. Achievements modal sorted by tier, mythic-first, with progress bars on locked
8. Tier counts on Logic Profile (e.g., "🥉 12 / 🥈 8 / 🥇 4 / 💎 2 / 🌌 0")
9. Cosmetic unlock: "Mythic" wire palette earned at first mythic
10. Cache bust + service worker v49

## Day 72 (Fri) — Weekly Tournament Mode + Cycle Polish

**Why:** Closes the build week with a community-shaped surface and a polish sweep. Real federated leaderboard is parked; this gives the *feel* of a tournament without backend infrastructure.

**Items (10):**
1. `WeeklyTournament` class with seeded weekly puzzle (`year-week` seed, same for all players)
2. "🏆 Tournament" entry on level select (gated behind 18+ levels) — opens tournament screen
3. Tournament screen shows: this week's puzzle preview + leaderboard (pseudo, like daily) + your best
4. Single-shot scoring: gates × 100 + (60 - timeSec, min 0). Best of week locks at midnight Sunday PT
5. Tournament archive: last 8 weeks browsable from same screen
6. Tournament achievements: 🏅 Podium (top-3 in any week), 🏆 Crowned (1st in any week)
7. Polish: Day 68 cache-bust query strings audited for any straggler `?v=` references
8. Polish: a single CSS pass for new HUD elements introduced Mon–Thu
9. Polish: read PROACTIVITY.md backlog — pick one micro-win that is shippable in <30 min
10. Cache bust + service worker v50 + write `reviews/build-cycle-2-week-summary.md`

---

## Cycle 2 Build Targets

- **Replayability hook:** Infinite Mode (Day 68) + Tournament (Day 72)
- **Conversion hook:** Mobile install (Day 69)
- **Content depth:** Discovery Lab redesign (Day 70)
- **Long-tail engagement:** Mythic achievements (Day 71)
- **Score target:** 8.4 → 8.7 (Cycle 2 should add ~0.3 across replayability, addictiveness, first impression)
- **LOC target:** +2,000 (no module split this cycle — defer to Cycle 3)
- **Bug target:** 0 P0/P1 introduced (HARDEN week will sweep P2)

## Saved for Cycle 3

- Real federated daily leaderboard (Cloudflare Worker + KV) — needs an auth + infra story
- Module split (audio.js → ESM, then wires.js)
- iOS native install instructions polish on iPhone SE
- i18n scaffolding
- Save slots
