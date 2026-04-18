# Signal Circuit — Cycle 1 Build Week Roadmap

**Cycle:** 1 (Apr 18 – Jul 16, 2026)
**Week Type:** Build (Week 1 of 3)
**Focus:** Sub-circuit abstraction + stats depth + endgame mastery content

Based on expert review (7.3/10): replayability (5/10) and addictiveness (6/10) are the critical weaknesses. This week targets those by adding meaningful endgame content, deeper stats engagement, and a mechanic that evolves the core loop.

---

## Day 1 (Saturday Apr 18): Sub-Circuit Abstraction System
**Rationale:** Expert review noted "mechanics never evolve" — this is the single biggest evolution to the core loop. Players can package solved circuits as custom gates, adding a new layer of depth.

Items:
1. `SubCircuitManager` class — stores sub-circuits by name with truth table + metadata
2. "Save as Custom Gate" button on completion screen for campaign levels
3. Custom gate data model: truth table, name, icon color, pin count, original gate count
4. Custom gate rendering — colored block with custom label + pin count indicator
5. Custom gate evaluation — lookup truth table row for given inputs
6. "Custom Gates" section in toolbox (sandbox + challenge modes only)
7. Custom gate placement + wire connection (acts like a normal gate)
8. Custom gate tooltip showing internal truth table on hover
9. localStorage persistence (10 sub-circuit limit with LRU)
10. "Circuit Architect" achievement — create 5 custom sub-circuits

## Day 2 (Sunday Apr 19): Stats Dashboard Overhaul
**Rationale:** Current stats are basic. Charts and deeper analytics increase session time and give players reasons to return.

Items:
1. "Time Played Per Day" bar chart (last 14 days) using canvas rendering
2. "Stars Over Time" line graph — cumulative stars by completion date
3. "Gate Efficiency" sparkline per chapter — player gates vs optimal ratio
4. "Solve Time Distribution" mini histogram — quick vs slow levels
5. "Most Replayed Levels" list — levels with most attempts
6. Session history table: date, levels played, stars earned, time spent
7. "Skill Progression" line from adaptive difficulty score over time
8. Export stats as shareable summary text
9. "Compare with Average" pseudo-averages on charts
10. Lazy chart rendering — only draw charts when stats modal opens

## Day 3 (Monday Apr 20): Endgame Mastery Challenges
**Rationale:** Post-campaign completionists have nothing to do. Mastery challenges give expert players a compelling reason to return.

Items:
1. Unlock "Mastery Challenges" section after all 6 main chapters completed
2. Mastery Challenge 1: "XOR from NANDs" — build XOR using only NAND gates (4 NAND optimal)
3. Mastery Challenge 2: "Full Adder from NORs" — build carry+sum using only NOR gates
4. Mastery Challenge 3: "3-to-8 Decoder" — massive 3-input, 8-output decoder challenge
5. Mastery Challenge 4: "Reverse Engineer v2" — 3-input mystery gate, player deduces truth table by experimentation
6. Mastery Challenge 5: "The Minimalist" — implement 4-input parity using ≤6 gates
7. "Mastery" tab on level select, styled gold/purple with distinctive visual treatment
8. Mastery completion awards unique cosmetic: "Logician" wire color (cyan-gold gradient)
9. Separate mastery progress tracking (doesn't affect campaign stats)
10. "Master Logician" achievement — complete all 5 mastery challenges

## Day 4 (Tuesday Apr 21): Campaign Difficulty Modes (Relaxed vs Hardcore)
**Rationale:** Expert noted hint tokens are too generous AND difficulty cliff at Ch3→4. Dual modes solve both: Relaxed for struggling players, Hardcore for challenge-seekers.

Items:
1. Mode selector on first launch: "📘 Relaxed" vs "⚡ Hardcore" with descriptions
2. Relaxed mode: unlimited hints (no token cost), encouraging failure messages
3. Relaxed mode: truth table permanently expanded, timer hidden
4. Hardcore mode: zero hints, par timer always visible, fail count tracked
5. Hardcore mode: star thresholds 20% tighter, no skip button
6. Both modes share same levels — only framing and support differ
7. Mode selection persisted in localStorage, changeable in settings
8. Hardcore completion badge (⬦) on level select cards
9. "Hardcore Completer" achievement for finishing all campaign in hardcore
10. Default suggestion based on placement test score (0-1: Relaxed, 3: Hardcore)

## Day 5 (Wednesday Apr 22): Mobile Optimization Pass
**Rationale:** Expert gave mobile high marks but noted specific UX issues. PWA is a key differentiator — polish the mobile experience.

Items:
1. Increase pin touch target radius from 36px to 44px (Apple HIG minimum)
2. Double-tap gate context menu: delete, duplicate, info
3. Horizontal scrolling toolbox strip at bottom for mobile (instead of sidebar)
4. Info panel mobile: auto-collapse to sticky footer with RUN + gates + result
5. Gate drag ghost: larger on mobile, show grid-snap preview landing zone
6. Haptic feedback on RUN button press (Vibration API pattern)
7. Landscape-specific layout: horizontal toolbox + truth table side-by-side
8. Pull-to-refresh on level select (reload progress display)
9. iPhone SE (320px) + iPad landscape layout fixes
10. Touch-friendly truth table: larger rows, tap to set inputs for live testing
