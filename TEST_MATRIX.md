# Test Matrix

## Core Functionality
- [x] Canvas renders without errors
- [x] Gates can be dragged from toolbox to canvas
- [x] Wires can be drawn between gate pins
- [x] Circuit simulation produces correct outputs
- [x] Truth table displays correctly
- [x] Levels load and are completable

## Gates
- [x] AND: correct truth table (0,0→0, 0,1→0, 1,0→0, 1,1→1)
- [x] OR: correct truth table (0,0→0, 0,1→1, 1,0→1, 1,1→1)
- [x] NOT: correct truth table (0→1, 1→0)
- [x] XOR: correct truth table (0,0→0, 0,1→1, 1,0→1, 1,1→0)

## Levels (10 total)
- [x] Level 1: AND Gate Basics — 1 gate ★★★
- [x] Level 2: NOT Gate Inversion — 1 gate ★★★
- [x] Level 3: OR Gate Basics — 1 gate ★★★
- [x] Level 4: Build a NAND — 2 gates ★★★
- [x] Level 5: Build a NOR — 2 gates ★★★
- [x] Level 6: XOR — 1 gate ★★★
- [x] Level 7: XNOR — 2 gates ★★★
- [x] Level 8: AND from OR + NOT — 4 gates ★★★
- [x] Level 9: OR from AND + NOT — 4 gates ★★★
- [x] Level 10: Implication — 2 gates ★★★

## Interaction
- [x] Gate placement via drag-and-drop
- [x] Wire drawing between pins (click-to-click)
- [x] Gate deletion (right-click, Delete key)
- [x] Wire deletion (click to select, Delete key; right-click)
- [x] Wire selection and hover highlighting
- [x] Run/simulate button (animated)
- [x] Clear circuit button
- [x] Level navigation (Prev/Next)
- [x] Undo (Ctrl+Z / Cmd+Z)
- [x] Redo (Ctrl+Shift+Z / Cmd+Shift+Z)

## Level System
- [x] Level select screen with chapters
- [x] Star rating (1-3 based on gate count)
- [x] Level unlocking (complete previous to unlock next)
- [x] localStorage progress persistence
- [x] Progress survives page reload
- [x] Reset progress clears all data
- [x] Next Level button after completion
- [x] Back button returns to level select

## Visual
- [x] Breadboard aesthetic with grid, power rails, channel
- [x] IC chip gates with gradient, rounded corners, notch
- [x] Signal colors (red=1, blue=0)
- [x] LED glow on active output nodes
- [x] Pin hover highlight
- [x] Cursor changes contextually
- [x] Signal pulse animation during simulation
- [x] Confetti celebration on level completion
- [x] Star animation (scale in)
- [x] Level select screen with title and chapters

## Challenge Mode
- [x] Challenge Mode section visible on level select
- [x] Random Challenge button opens config screen
- [x] Sandbox button opens sandbox mode
- [x] Input count slider (2-4) with live label
- [x] Output count slider (1-2) with live label
- [x] Difficulty badge updates (Easy/Medium/Hard/Expert)
- [x] Generate Challenge creates playable level
- [x] 2-input/1-output challenge generates valid truth table
- [x] 3-input/1-output challenge generates 8-row table
- [x] 4-input/2-output challenge generates 16-row, 2-output table
- [x] Non-degenerate tables (no all-0, all-1, or single-input passthroughs)
- [x] Challenge completion shows trophy + gate count
- [x] Challenge completion saves to leaderboard
- [x] Leaderboard shows on config screen
- [x] "New Challenge" button returns to config
- [x] Back button from challenge returns to config
- [x] Back button from config returns to level select

## Sandbox Mode
- [x] Sandbox loads with all 4 gate types
- [x] 2 inputs (A, B) and 1 output (OUT)
- [x] No target truth table
- [x] "TEST" button evaluates actual circuit behavior
- [x] Truth table shows actual outputs (AND behavior verified)
- [x] No star rating or celebration
- [x] Back button returns to level select

## Leaderboard
- [x] Scores saved per difficulty key in localStorage
- [x] Leaderboard renders with rank, gates, difficulty, date
- [x] Empty leaderboard shows "No scores yet"

## Edge Cases
- [x] Empty circuit simulation (graceful)
- [x] Gate add/remove with wire cleanup
- [x] Level switch clears state
- [x] Animation blocks interaction
- [x] Progress persistence across reloads
- [x] Challenge mode doesn't interfere with campaign levels
- [x] Switching between campaign/challenge/sandbox clears state properly

## Audio
- [x] AudioEngine initializes on first user interaction
- [x] Gate placement triggers click sound
- [x] Wire connection triggers zap sound
- [x] Gate/wire deletion triggers disconnect sound
- [x] Simulation row evaluation triggers pulse sound
- [x] Level completion triggers success jingle
- [x] Failed simulation triggers fail buzz
- [x] RUN button triggers button click sound
- [x] Mute button toggles sound on/off
- [x] Mute state persists in localStorage across reload
- [x] No audio errors when AudioContext unavailable
- [x] Mute visual indicator (🔊 / 🔇) updates correctly

## Wire Drawing UX
- [x] Compatible pins highlighted during wire drawing
- [x] Highlights pulse green for visibility
- [x] Highlights disappear on cancel/completion

## Gate Count Indicator (Day 15)
- [x] Shows "Gates: X/Y" during campaign levels
- [x] Shows projected star rating (★★★) in gold
- [x] Updates in real-time when gates are added/removed
- [x] Updates on undo/redo
- [x] Shows green border when at/below optimal gate count
- [x] Shows yellow border when at good gate count
- [x] Hidden in sandbox mode
- [x] Shows for challenge/daily without optimal reference
- [x] Resets on level load and circuit clear

## Bezier Wires (Day 15)
- [x] Placed wires render as smooth bezier curves
- [x] Wire shadow follows the curve
- [x] Active wire glow follows curve during simulation
- [x] Signal pulse dots animate along bezier path
- [x] Wire hit-testing works with curved wires
- [x] Wire hover highlighting works
- [x] Selected wire highlight works (yellow)
- [x] No visual regression on any existing features

## Wire Color Coding (Day 15)
- [x] Each wire gets a unique color from rotating palette
- [x] 10 distinguishable colors in palette
- [x] Colors persist for wire's lifetime
- [x] During simulation, active wires glow red, inactive show blue
- [x] When not simulating, wires show their unique color
- [x] Selected wire still highlighted yellow
- [x] Colors reset on circuit clear

## Row Micro-celebrations (Day 15)
- [x] Passing rows get green flash animation
- [x] Failing rows get red shake animation
- [x] Animations are quick (~300ms)
- [x] Works for campaign, challenge, and daily levels
- [x] No animation in sandbox mode

## Narrative System (Day 21)
- [x] Level select shows "Repair the ship's logic systems" subtitle
- [x] Chapter 1 shows "Navigation Systems" narrative label
- [x] Chapter 2 shows "Communications Array" narrative label
- [x] Chapter 3 shows "Life Support" narrative label
- [x] Post-solve insights include narrative context
- [x] Chapter colors: green (Ch1), cyan (Ch2), purple (Ch3)

## Bookmark System (Day 21)
- [x] Skip button shows "🔖 Bookmark & Move On"
- [x] Bookmark button hidden in challenge/sandbox mode
- [x] bookmarkLevel/isLevelBookmarked methods work

## Chapter Completion (Day 21)
- [x] Chapter complete modal exists with icon, title, story, gates
- [x] Triggers after completing last level of a chapter

## Tiered Achievements (Day 21)
- [x] 15 achievements: Bronze (5), Silver (6), Gold (4)
- [x] Tier headers displayed (🥇🥈🥉)
- [x] First Steps and Perfect Score unlock correctly
- [x] Achievement modal shows tiers in order: Gold → Silver → Bronze

## Timer Improvements (Day 21)
- [x] Timer hidden during campaign play
- [x] Timer shown post-completion with time
- [x] Timer visible in challenge mode
- [x] Best time on level select cards

## Audio Escalation (Day 21)
- [x] Ascending pitch for passing rows
- [x] Descending buzz for failing rows
- [x] Pitch resets at start of each simulation

## RUN Tension (Day 21)
- [x] Tension overlay exists
- [x] 350ms dim before simulation
- [x] Not applied to Quick Test

## Challenge Generator (Day 21)
- [x] 26 curated patterns across 6 key types
- [x] Named challenges (e.g., "Easy: NAND")
- [x] 70% curated / 30% random fallback
- [x] Non-degenerate tables maintained

## Gate Ripple (Day 21)
- [x] spawnRipple method on canvas renderer
- [x] Ripple on gate placement
- [x] Copper/gold colors, ~400ms duration

## Gate Encyclopedia (Day 23)
- [x] Encyclopedia button visible on level select screen
- [x] Encyclopedia button visible in toolbox during gameplay (📚 icon)
- [x] Modal opens with all 4 gate types as cards
- [x] Each card shows: gate name, symbol, mini truth table, description, analogy, pro tip
- [x] Gates not yet encountered show as locked (just name + lock icon)
- [x] Gate unlock state updates correctly as levels are unlocked
- [x] Modal closes with close button
- [x] Modal closes by clicking backdrop
- [x] Styling matches game aesthetic

## Stats Dashboard (Day 23)
- [x] Stats button visible on level select screen
- [x] Stats modal opens showing 7 stat cards
- [x] Levels completed count is accurate
- [x] Stars earned with progress bar
- [x] Lifetime gate counter increments and persists in localStorage
- [x] Total playtime accumulates and persists
- [x] Achievements count matches unlocked count
- [x] Challenge mode stats shown
- [x] Modal closes properly

## Milestone Celebrations (Day 23)
- [x] First 3-star rating triggers "PERFECT LOGIC!" milestone modal
- [x] Milestone has golden border, large icon, narrative text
- [x] Milestone only triggers once (stored in localStorage)
- [x] Milestone modal closes with dismiss button
- [x] Milestone modal closes by clicking backdrop
- [x] Milestone persistence survives page reload

## Level Difficulty Labels (Day 23)
- [x] Each level card shows Easy/Med/Hard difficulty label
- [x] Easy levels (1-2 optimal gates) show green label
- [x] Medium levels (3-4 optimal gates) show yellow label
- [x] Hard levels (5+ optimal gates) show orange label
- [x] Labels visible on all level cards including locked ones

## Browser Compatibility
- [x] Chrome (desktop) — tested
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
