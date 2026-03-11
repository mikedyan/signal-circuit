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

## Browser Compatibility
- [x] Chrome (desktop) — tested
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
