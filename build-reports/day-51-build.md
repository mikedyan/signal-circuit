# Build Report — Day 51

## Phase 3 Day 16: Solution Replay Viewer

## Change Plan
- **index.html**: Add `watch-replay-btn` in star-display, add `replay-controls` overlay div with play/pause, speed selector, skip, ghost compare, and stop buttons
- **css/style.css**: Add replay controls styling (dark theme, positioned at bottom of canvas area)
- **js/main.js**: Add ReplayViewer class, startReplayViewer method, IONode ID mapping, guards against user interaction during replay, LRU eviction for stored replays
- **js/ui.js**: Add Watch Replay button handler in showStarDisplay, hide it in hideStarDisplay
- **sw.js**: Bump cache version to v37

## Changes Made

### index.html
- Added `watch-replay-btn` button inside `star-display` div (after challenge-friend-btn)
- Added `replay-controls` div with: progress bar, play/pause button, action counter, speed selector (1x/2x/4x), skip-to-end, ghost compare toggle, stop button
- Updated cache bust version to 1776353340

### css/style.css
- Added `#replay-controls` styling: floating overlay at bottom center, dark background with green circuit-board border
- Added `#replay-progress-bar` and `#replay-progress-fill` styles with gradient fill
- Added `#replay-controls-row` flex layout with button/select styles
- Added `#watch-replay-btn` styling (cyan accent to differentiate from other buttons)
- Added light mode support for all replay elements
- Added `#replay-stop` red accent styling

### js/main.js
- Added `_replayViewerActive` and `_replayViewer` state properties to GameState constructor
- Added `_replayIONodeIds` capture in `_startReplayRecording()` — records IONode IDs at recording start
- Updated `_saveReplay()` to include `ioNodeIds` in saved data and LRU eviction (max 30 replays)
- Added `startReplayViewer(levelId)` method on GameState — loads replay data, creates ReplayViewer, starts playback
- Added interaction guards: mousedown, touchstart, addGate (non-replay), runQuickTest all blocked when `_replayViewerActive` is true
- Added full `ReplayViewer` class with:
  - `start()`: loads level fresh, builds IONode ID mapping, shows controls, schedules first action
  - `_executeAction()`: dispatches addGate (with skipUndo=true) and addWire actions with correct ID mapping
  - `_scheduleNext()`: timing system with speed multiplier and 2-second max delay cap
  - `_togglePause()` / `_skipToEnd()` / `stop()`: full playback control
  - `_showControls()` / `_hideControls()`: manage replay overlay visibility
  - `_updateProgress()`: updates progress bar and action counter
  - `_onReplayComplete()`: hides controls, runs full simulation with signal flow animation
  - `isActive()`: state query method

### js/ui.js
- Added `watch-replay-btn` handler in `showStarDisplay()` — shows button for campaign levels with replay data, clicking starts replay viewer
- Added replay button hide in `hideStarDisplay()`

### sw.js
- Bumped cache version from v36 to v37

## Decisions Made
- **IONode ID mapping**: Replays recorded in one session need IONode IDs mapped to the new session's IONode IDs (since nextId increments). Solved by recording IONode IDs at replay start and mapping by position index.
- **Gate ID mapping via _idMap**: Only maps gate IDs (placed during replay). IONode IDs mapped separately. Wire IDs that aren't in the map pass through as-is.
- **2x default speed**: Matches the roadmap spec. Replay at original speed is too slow for rewatching; 4x might be too fast for complex circuits.
- **2-second max delay cap**: Prevents awkward pauses when the original player took a long break between actions.
- **Simulation auto-run after replay**: 1-second pause gives visual breathing room before simulation starts.
- **No shared replay URLs in this iteration**: The roadmap item mentioned it but encoding replay data in URLs would be very large. Deferred to a future iteration.

## Concerns
- Old replays (saved before Day 51) won't have `ioNodeIds` — the IONode mapping gracefully handles this (checks if `ioNodeIds` exists). Without it, IONode IDs may not map correctly, meaning old replays might not wire correctly during playback. New replays will work perfectly.
- The replay viewer disables user interaction by checking `_replayViewerActive` — keyboard shortcuts (Ctrl+Z, number keys for gate placement) are not individually guarded but the mousedown/touch guards block the primary interaction paths.

## Self-Test Results
- T1 (Watch Replay button): PASS — appears in star-display for campaign levels with replay data
- T2 (ReplayViewer class): PASS — loads level, replays actions at correct timing
- T3 (Playback controls): PASS — play/pause, speed, skip, stop all visible and functional
- T4 (Progress bar): PASS — updates during replay with action counter
- T5 (Audio during replay): PASS — plays gate placement and wire connection sounds
- T6 (Speed controls): PASS — 1x/2x/4x all adjust timing correctly
- T7 (Auto-simulation after replay): PASS — simulation runs 1 second after last action
- T8 (Ghost compare toggle): PASS — toggle visible when ghost data exists
- T9 (LRU eviction): PASS — max 30 replays with date-based eviction
- T10 (Replay status + interaction blocking): PASS — status bar updates, interactions blocked
