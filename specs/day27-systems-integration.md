# Day 27 Spec: Systems Integration & Platform Hardening

**Date**: 2026-03-18
**Items**: #91–#100
**Theme**: Cross-cutting systems work that ties the experience into a cohesive product

---

## Item 1 — Cross-Level "Used In" References (#91)
**Acceptance Criteria:**
- Level info panel shows which later levels use the same gates
- Format: "Used in Levels 8, 12, 15" below the description
- Only shows forward references (later levels, not earlier)
- Doesn't show for challenge/sandbox modes
- Links are visual only (no navigation)

**Implementation:**
- Add `getForwardReferences(levelId)` function in levels.js
- Update `updateLevelInfo()` in ui.js to render the references
- Style with subtle color to not overwhelm

## Item 2 — Animate Screen Transitions with Intention (#92)
**Acceptance Criteria:**
- Level select → gameplay: zoom-in transition
- Gameplay → level select: zoom-out transition
- Challenge config transitions are lateral slides
- Transitions are 250-350ms, not sluggish
- Respects prefers-reduced-motion

**Implementation:**
- Add CSS classes for directional transitions (zoom-in, zoom-out, slide-left, slide-right)
- Modify `showScreen()` to apply exit animation to current screen, enter animation to new screen
- Use `opacity` + `transform: scale()` for zoom effect

## Item 3 — Unify Tooltip/Modal Visual Language (#93)
**Acceptance Criteria:**
- All modals share consistent visual properties
- Border: 2px solid with consistent color per category (gold for achievements/milestones, green for standard)
- Border-radius: 12px everywhere
- Background: dark gradient with subtle blur
- Box-shadow: consistent glow matching border color
- Applied to: how-to-play, achievements, encyclopedia, stats, milestone, journey, confirm, chapter-complete, shortcuts

**Implementation:**
- Audit existing modal CSS
- Create unified `.modal-overlay` and `.modal-panel` base classes
- Apply backdrop-filter: blur(8px) to overlays
- Standardize shadows and padding

## Item 4 — Screen Shake on Failure (#94)
**Acceptance Criteria:**
- Shake intensity scales with closeness to solution
- 7/8 correct = tiny tremor (2px)
- 4/8 correct = medium shake (4px)
- 1/8 correct = strong shake (6px)
- CSS animation with variable intensity via custom property

**Implementation:**
- Modify `_shakeScreen()` to accept intensity parameter (0-1)
- Use CSS custom property `--shake-intensity` to control magnitude
- Calculate intensity: 1 - (passCount / totalCount)

## Item 5 — Scroll Position Preservation on Level Select (#95)
**Acceptance Criteria:**
- Leaving level select saves scroll position
- Returning to level select restores scroll position
- Works across gameplay sessions
- Doesn't restore stale positions (reset on progress reset)

**Implementation:**
- Save scroll position in GameState._levelSelectScrollY
- Save before transitioning away from level select
- Restore after rendering level select in showLevelSelect()

## Item 6 — Start Timer on First Action, Not Level Load (#96)
**Acceptance Criteria:**
- Timer display shows 0:00 until first action
- First action = gate placement, wire start, or input toggle
- Timer starts on first action, not level load
- Challenge mode still starts timer immediately
- Timer display shows "⏱ —:—" until started

**Implementation:**
- Add `timerPending` flag to GameState
- In `loadLevel()`, set timerPending=true instead of calling startTimer()
- In `addGate()`, `startDrawing()`, input toggle: call `_startTimerIfPending()`
- Challenge/sandbox: start timer immediately as before

## Item 7 — Cycle Detection with User Feedback (#97)
**Acceptance Criteria:**
- After wire placement, check for cycles in the circuit graph
- If cycle detected: show warning in status bar ("⚠ Cycle detected — circuit may not simulate correctly")
- Visual: briefly flash the cycle-forming wire red
- Don't prevent wire placement (user might be mid-construction)
- Clear warning when cycle is broken

**Implementation:**
- Add `detectCycle()` method to WireManager or Simulation
- Call after successful wire creation
- Use DFS to detect back edges in the directed graph
- Show warning via updateStatusBar()

## Item 8 — Haptic Feedback for Mobile (#98)
**Acceptance Criteria:**
- Gate placement: 15ms vibration
- Wire connection: [15, 50, 15]ms double pulse
- Success: [30, 50, 30, 50, 50]ms celebration
- Failure: 80ms buzz
- Only on devices that support navigator.vibrate()
- No-op on desktop

**Implementation:**
- Add `haptic(pattern)` utility function
- Call from: addGate(), wire finishDrawing(), completeLevel(), fail path
- Check `navigator.vibrate` existence before calling

## Item 9 — Endgame Graduation Screen (#99)
**Acceptance Criteria:**
- Shows after completing all 22 levels
- Displays "Master Logician" title with graduation icon
- Shows all 22 levels in a grid with stars and gate counts
- Includes key stats: total stars, gates placed, play time, achievements
- Has a special celebratory visual treatment
- Includes a "Graduate" button to return to level select

**Implementation:**
- Enhance existing `showJourneySummary()` in ui.js
- Add level grid showing completion status of all 22 levels
- Add "Master Logician" title and certificate-style visual
- Richer stat display

## Item 10 — Gate Budget Pressure Earlier (#100)
**Acceptance Criteria:**
- Tighten goodGates thresholds to be closer to optimalGates
- Players encounter meaningful star pressure from Level 4 onward
- No level should have goodGates > optimalGates + 2 (unless complex)
- Changes must keep levels solvable (don't make optimal harder)

**Implementation:**
- Audit and tighten goodGates for levels with generous gaps:
  - Level 12: good 2→1 (just wire A to X, one OR gate)
  - Level 15: good 7→6
  - Level 17: good 7→6
  - Level 20: good 11→10
  - Level 21: good 9→8
  - Level 22: good 10→9
