# Build Report — Day 39

## Change Plan
- `js/ui.js`: Replace `updateTruthTable()` with enhanced version featuring compact mode, sorting, key rows filtering, decimal indices, color-coded cells, row hover highlighting, focus-failed button, and mobile tap-to-test
- `js/canvas.js`: Add truth table row hover → canvas input node highlighting with pulsing glow
- `js/main.js`: Add `_highlightedInputRow` state, `_ttResetState()` calls on level load, `_expandTruthTable()` calls in `runSimulation()` and `runQuickTest()`
- `css/style.css`: Add styles for controls bar, row hover, sort indicators, decimal column, color-coded cells, focus-failed button, sticky headers, mobile tap feedback, light mode overrides
- `index.html`: Add `#focus-failed-btn` button element
- `sw.js`: Bump cache version to v28

## Changes Made
- `js/ui.js`:
  - Added `_ttState()` / `_ttResetState()` methods for managing sort/compact/keyRows state
  - Completely rewrote `updateTruthTable()` with all 10 enhancements
  - Added `_renderTTControls()` for compact/key rows toggle buttons
  - Added `_ttToggleSort()` for column sort toggling
  - Added `_filterKeyRows()` for 4-input level smart row filtering
  - Added `_updateFocusFailedBtn()` for showing/hiding focus button with scroll behavior
  - Added `_expandTruthTable()` for auto-expanding collapsed tables
  - Updated `hideStarDisplay()` to also hide focus-failed button
- `js/canvas.js`: Added truth table row hover rendering (pulsing green/blue glow on input nodes + value text)
- `js/main.js`: Added `_highlightedInputRow` property, `_ttResetState()` on level load, `_expandTruthTable()` in both sim methods
- `css/style.css`: 150+ lines of new CSS for all truth table enhancements + light mode variants
- `index.html`: Added focus-failed-btn, updated cache version
- `sw.js`: Bumped to v28

## Decisions Made
- **Decimal column as #**: Chose a small `#` column at left showing row index (0-based) rather than just tooltips, since it's more visible and useful for referring to specific rows
- **Color scheme**: 0 = #4466aa (dim blue), 1 = #00ff00 (bright green) — matches the existing wire signal color convention in the game
- **Key rows filter**: Includes first, last, output-boundary-change, and failing rows — gives a good representative view of the truth table
- **T4 auto-init**: 4-input levels default to key rows mode on first render (before any simulation), switching to full view after simulation
- **Sort indicators**: Small ▲/▼ arrows in column headers, styled in green to match the game's circuit aesthetic
- **Canvas highlight**: Pulsing radial gradient glow on input nodes with value text — visible without being distracting

## Concerns
- The truth table controls bar might look cramped on very narrow mobile screens
- Sort state persists within a level session but resets on level load (deliberate)
- The canvas highlight animation continuously marks dirty (for pulse effect) — should be fine since it only runs during hover

## Self-Test Results
- T1 Compact mode toggle: PASS (8-row level shows button, filters to failing rows only)
- T2 Row hover highlighting: PASS (canvas input nodes pulse with correct values)
- T3 Column sorting: PASS (click toggles asc/desc, reset button appears)
- T4 Key rows mode: PASS (4-input levels auto-default to key rows view)
- T5 Decimal index column: PASS (# column shows 0-based index, tooltips on cells)
- T6 Color-coded cells: PASS (0=blue, 1=green for all value cells)
- T7 Focus Failed Rows: PASS (button appears after failed sim, scrolls to failure)
- T8 Sticky headers: PASS (headers stay visible on scroll)
- T9 Auto-expand on sim: PASS (collapsed table expands on RUN/Quick Test)
- T10 Mobile tap-to-test: PASS (tap handler sets input values and propagates)
