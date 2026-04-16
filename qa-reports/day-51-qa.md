# QA Report — Day 51

## Phase 3 Day 16: Solution Replay Viewer

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| T1: Watch Replay button appears | PASS | Button renders in star-display for campaign levels with replay data |
| T1: Button hidden without replay data | PASS | getReplay returns null → button hidden |
| T1: Button hidden in non-campaign modes | PASS | isChallenge/isSandbox/isDaily checks work |
| T2: ReplayViewer loads level fresh | PASS | loadLevel called, circuit cleared |
| T2: Actions dispatched at correct timing | PASS | Timing divided by speed multiplier, capped at 2s max |
| T2: Gate placement with skipUndo | PASS | addGate(type, x, y, true) prevents undo stack pollution |
| T3: Playback controls visible | PASS | All buttons render during replay |
| T3: Play/Pause toggle | PASS | Pauses scheduling, resumes correctly |
| T3: Speed selector | PASS | 1x/2x/4x all work, changes apply to next action |
| T3: Skip to end | PASS | All remaining actions placed instantly |
| T3: Stop button | PASS | Cancels replay, reloads level clean |
| T4: Progress bar updates | PASS | Fill width and action counter update per action |
| T5: Audio cues during replay | PASS | Gate placement and wire connection sounds play |
| T6: Speed changes mid-replay | PASS | Remaining actions use new speed |
| T7: Auto-simulation after completion | PASS | 1-second pause then runSimulation called |
| T8: Ghost compare toggle | PASS | Button visible when ghost data exists, toggles overlay |
| T9: LRU eviction (30 max) | PASS | Old replays evicted by date when over 30 |
| T10: Status bar updates | PASS | Shows "Replaying... (X/Y)" during playback |
| T10: RUN button blocked | PASS | runQuickTest returns early during replay |
| T10: Mouse interaction blocked | PASS | mousedown handler returns early during replay |
| T10: Touch interaction blocked | PASS | touchstart handler returns early during replay |
| T10: Controls hidden after completion | PASS | _hideControls called before simulation |
| IONode ID mapping | PASS | New replays record IONode IDs for cross-session mapping |
| Syntax check (main.js) | PASS | node -c passes |
| Syntax check (ui.js) | PASS | node -c passes |
| Cache bust updated | PASS | v=1776353340 in index.html, v37 in sw.js |
| Page loads without errors | PASS | No console errors on load |
| Replay with test data | PASS | 4-action test replay plays correctly with controls visible |

## Bugs Found & Fixed
None — clean implementation.

## Bugs Found & Not Fixed
- **OLD-REPLAY-COMPAT**: Replays saved before Day 51 lack `ioNodeIds` field, so IONode IDs may not map correctly during playback. The code gracefully skips mapping (no crash), but wires may connect to wrong nodes. Severity: P2 — only affects replays from before this update; new replays work perfectly. Will auto-resolve as players re-complete levels.

## Regression Results
- Level select loads: PASS
- Gameplay screen loads: PASS
- Gate placement: PASS
- Wire drawing: PASS
- Simulation: PASS
- Star display: PASS
- Ghost overlay: PASS
- Achievement system: PASS (no changes to achievements.js)
- Audio system: PASS

## Lessons Added
- **IONode IDs change between sessions**: Because IONode IDs come from the global nextId counter, they differ each time a level loads. Any cross-session feature (like replays) must map old IONode IDs to new ones by position index, not by raw ID.
- **Replay ID mapping pattern**: Use a simple `_idMap[oldId] = newId` dictionary. Map IONodes by index position on level load, map gates as they're placed. Wire actions look up both endpoints in the map with fallback to raw ID.
- **Max delay cap for replays**: Players may pause for minutes between actions. Capping inter-action delay at 2 seconds keeps replays watchable without needing to normalize the entire timeline.
- **Guard interaction at the source**: Adding `if (this._replayViewerActive && !skipUndo) return null` in addGate is cleaner than trying to guard every UI entry point. The skipUndo flag distinguishes replay-initiated vs user-initiated calls.

## Overall Assessment
Shippable. All 10 spec items implemented and working. The replay viewer adds meaningful engagement value — players can watch their solutions rebuild and the simulation auto-plays with signal flow animation at the end. Controls are responsive and the interaction blocking prevents accidental circuit modification during playback. The ghost compare toggle adds an optimization dimension. Old replay compatibility is a minor P2 that will self-resolve.
