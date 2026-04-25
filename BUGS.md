# Bugs — Signal Circuit

*Updated: Day 60 — Harden Week 1, Day 3 (2026-04-25)*

## Open Bugs

### P2 — Blitz Mode Bar Persists on Level Select
- **Screen:** Level Select (after exiting Blitz Mode)
- **Issue:** The Blitz Mode info bar ("Level 1 ⏱ X:XX Best: —") remains visible at the top of the level select screen after returning from Blitz Mode via Back button or `showLevelSelect()`. The bar does not get hidden when transitioning away from Blitz gameplay.
- **Expected:** Blitz Mode info bar should be hidden when leaving Blitz gameplay and returning to level select.
- **Root cause:** `showLevelSelect()` does not hide the `blitz-info` element. Needs an explicit `blitz-info.style.display = 'none'` in the level select transition.
- **Found:** Day 59, Harden Day 2
- **Re-confirmed:** Day 60, Harden Day 3 — `blitz-info` element has computed `display: flex` after returning to level select. Not visually visible because parent `blitz-hud` container collapses to 0×0 dimensions, but the DOM element is still active with a running timer.

### P2 — Daily Leaderboard Duplicate Name
- **Screen:** Daily Challenge pre-screen
- **Issue:** "pulseRider" appears in both positions 8 and 9 with identical gate counts. The pseudo-leaderboard PRNG generates duplicate names.
- **Expected:** All 10 leaderboard entries should have unique names.
- **Root cause:** The seeded name selection algorithm doesn't enforce uniqueness across entries.

### P2 — Stats: Empty Sessions Recorded
- **Screen:** Stats Dashboard → Recent Sessions
- **Issue:** Sessions show "0 played ⭐0" entries (e.g., two entries for 4/23 with 0 levels played but non-zero time). Page loads/navigations are being counted as sessions even when no levels are actually played.
- **Expected:** Sessions with 0 levels completed should not appear in the Recent Sessions table, or sessions should only start counting when a level is actually loaded.

## Cosmetic / Minor Observations (Not Bugs)
- AudioContext warnings on page load (expected — resumes after first user gesture)
- Collection shows 4 of 6 completed levels (expected — only levels with saved preview data appear)
- Level 3 shows ★☆☆ in Review Suggested but ★★★🧠 on the card (review tracks worst score, card shows best — working as intended)
- Deprecated meta tag warning: `apple-mobile-web-app-capable` should be `mobile-web-app-capable` (cosmetic, non-breaking)

## Audit Results — Day 60 (Harden Week 1, Day 3: Edge Cases & Stress)

### Test 1: Rapid Gate Placement During Simulation ✅
- Placed AND gate, wired circuit, ran simulation, immediately added 3 more gates via JS
- Simulation evaluated correctly despite extra gates (only connected circuit matters)
- Gate counter correctly showed 4/1 (3 extra unconnected gates)
- Console: 0 JS errors

### Test 2: Wire Drawing During Animation ✅
- Programmatic wire creation (startDrawing/finishDrawing API) works correctly
- 10 wires created between 10 gates with no errors
- Wire rendering stable at 0.59ms average per frame

### Test 3: Resize Window Mid-Gameplay ✅
- Single resize event dispatched during gameplay: no errors
- 10 rapid consecutive resize events: no errors, no layout breakage
- Canvas re-renders correctly after resize

### Test 4: Clear localStorage and Reload ✅
- Backed up 30 localStorage keys, cleared all, reloaded
- Game loads cleanly with Quick Placement Test (fresh user experience)
- No JS errors on fresh load
- Difficulty selector and placement test display correctly
- All 40 levels show correctly (Level 1 unlocked, rest locked)

### Test 5: Keyboard-Only Navigation (Tab) ✅
- Tab cycles through interactive elements on level select
- Buttons receive focus correctly (tested: Daily Challenge button focused after 3 tabs)
- Enter key activates focused buttons
- No keyboard traps detected

### Test 6: Colorblind Mode ✅
- Toggle works (On/Off) on level select
- Visual indicators change to colorblind-friendly scheme
- Level select renders correctly in colorblind mode
- Gameplay canvas renders correctly with colorblind colors
- No errors when toggling

### Test 7: Light Mode vs Dark Mode ✅
- Dark mode toggle works correctly
- Level select, gameplay, and all UI elements render properly in dark mode
- Colorblind + dark mode combination works correctly
- Settings persist across navigation (level select → gameplay → back)

### Test 8: Performance with Many Wires/Gates ✅
- 10 gates placed programmatically: no errors
- 10 wires connected between gates: no errors
- Render performance: avg 0.59ms, max 0.80ms, min 0.50ms per frame
- Well under 16.67ms budget for 60fps

### Test 9: Empty Simulation (No Gates/Wires) ✅
- Running simulation with 0 gates and 0 wires: returns result (4 rows evaluated), no crash
- Quick Test with no circuit: passes without error

### Test 10: Undo/Redo Stability ✅
- Gate placement tracked in undo stack (2 items after add + clear)
- Clear circuit works correctly (0 gates after clear)
- No errors from undo/redo operations

### Test 11: Text Size Toggle ✅
- Large text mode toggles correctly
- Level select layout adapts to larger text
- No overflow or layout breakage

### Test 12: Blitz Mode Entry/Exit ✅
- Blitz Mode loads correctly: curated challenge "Converse" with timer
- Full toolbox available (AND, OR, NOT, XOR, NAND, NOR)
- Back button returns to level select
- **Known P2 bug confirmed**: blitz-info DOM element remains active after exit (see Open Bugs)

### Test 13: localStorage Capacity ✅
- Successfully stored and removed 5MB string: no overflow errors
- localStorage handling is robust

### Console Summary: 0 JS Errors ✅
- Only expected warnings throughout entire test session:
  - `apple-mobile-web-app-capable` deprecation (cosmetic)
  - AudioContext pre-gesture warnings (expected behavior)
- Zero actual JavaScript errors across all edge case tests

### New Bugs Found: 0
- All 3 existing P2 bugs remain open (no new bugs introduced)
- No new bugs discovered during edge case & stress testing

## Audit Results — Day 59 (Harden Week 1, Day 2: Level Playthrough)

### Campaign Levels Tested
| Level | Title | Truth Table | Solve | Stars | Completion |
|-------|-------|-------------|-------|-------|------------|
| 1 | AND Gate Basics | ✅ Correct (A∧B) | ✅ 1 gate | ★★★ | ✅ Celebration + educational insight |
| 2 | NOT Gate — Inversion | ✅ Correct (¬A) | ✅ 1 gate | ★★★ | ✅ |
| 3 | OR Gate — Any Will Do | ✅ Correct (A∨B) | ✅ 1 gate | ★★★ | ✅ |
| 4 | Build a NAND | ✅ Correct (¬(A∧B)) | ✅ 2 gates (optimal) | ★★★ | ✅ Celebration + cosmetic unlock |
| 5 | Build a NOR | ✅ Correct (¬(A∨B)) | ✅ 2 gates (optimal) | ★★★ | ✅ |

### Truth Table Validation (All 40 Levels)
- ✅ All 40 levels have non-degenerate truth tables
- ✅ Row counts match 2^inputs for every level
- ✅ L7 XOR: (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0 — correct
- ✅ L13 Half Adder: 2 outputs (Sum, Carry) — correct
- ✅ L15 Majority Vote: 3 inputs, 8 rows — correct
- ✅ L17 Full Adder: 3 inputs, 2 outputs — correct
- ✅ L25 2-Bit Ripple Adder: 4 inputs, 3 outputs, 16 rows — correct

### Challenge Modes Tested
| Mode | Status | Notes |
|------|--------|-------|
| Daily Challenge | ✅ Working | Pre-screen, leaderboard, date, timer all correct. Bug: duplicate name (known P2) |
| Random Challenge | ✅ Working | Config screen with sliders, Generate/Push My Limits buttons |
| Blitz Mode | ✅ Working | Ladder with timer, named curated challenges. Bug: bar persists (new P2) |
| Speedrun Mode | ✅ Working | 1/32 counter, timer, PB tracking, Gate Limit toggle, Exit button |
| Sandbox Mode | ✅ Working | Config screen with input/output sliders |

### Community Levels Tested
- ✅ "The Implication" — Loads via click, truth table correct, gates available, status bar shows challenge name

### Console Errors: 0 ✅
- Only 1 deprecation warning (apple-mobile-web-app-capable meta tag)
- Zero JS errors through all testing

### Star Rating System
- ✅ Gate counter shows projected stars in real-time
- ✅ 3 stars at optimal gate count
- ✅ Star display shows correctly on completion
- ✅ Aesthetics score (crossing count) shown

### Hints System (Relaxed Mode)
- ✅ "Hint (Free)" button displayed correctly in Relaxed mode
- ✅ Hint note: "Hints won't reduce stars · 🧠 No hints = Pure Logic badge"

## Audit Results — Day 58 (Harden Week 1, Day 1)

### Screens Tested: ALL ✅
1. **Level Select** — All 40 levels render, chapters labeled correctly, progress bar accurate (6/40, 16 stars)
2. **Gameplay (Level 1)** — Canvas renders, toolbox shows AND gate, truth table visible, RUN/Quick Test/Clear/Hint buttons functional
3. **Daily Challenge** — Pre-screen with leaderboard and 7-day history loads correctly (bug: duplicate name)
4. **Sandbox Mode** — Config screen with input/output sliders renders
5. **Puzzle of the Week** — "Submarine Depth Alarm" loads with 3 inputs, proper description
6. **Gate Encyclopedia** — AND, OR, NOT, XOR displayed with truth tables, analogies, pro tips. NAND/NOR correctly locked
7. **Achievements** — Gold/Silver/Bronze tiers display, Lightning Run highlighted as earned, 7/34 unlocked
8. **Stats Dashboard** — 8 stat cards render, Time Played chart shows, Gate Efficiency sparklines present (bug: empty sessions)
9. **Customize** — Wire colors (6 palettes), Gate skins (4), Board themes (4) all render with lock/unlock states
10. **Mastery Tree** — 4/7 gate types mastered, tree hierarchy renders correctly
11. **Circuit Collection** — 4 entries with gate/wire counts and dates
12. **Logic Profile** — Gate mastery bars, hint tokens, skill level, focus recommendation all render
13. **How to Play** — 6-step tutorial modal with icons renders cleanly
14. **Settings: Light/Dark Mode** — Toggle works both directions, persists correctly
15. **Settings: Colorblind, Text Size, Simplified, Accessible Wiring, Difficulty Mode** — Buttons present and responsive
16. **Volume Controls** — Dual SFX/Music sliders present on both level select and gameplay
17. **Notification Settings** — Daily/Weekly/Streak toggles present
18. **Export/Import Progress** — Buttons present
19. **Review Suggested** — Shows 3 levels for review with age and star info
20. **Community Levels** — 20 levels display with difficulty, creator, plays, and upvotes

### Console Errors: 0 ✅
- Only 2 AudioContext warnings (expected, pre-gesture)
- Zero JS errors through all screen navigation

## Fixed (Recent)
- Day 32: All bugs from Day 31 resolved
- Day 33: No new bugs introduced
