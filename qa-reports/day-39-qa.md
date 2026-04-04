# QA Report — Day 39

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| T1: Compact mode toggle for 8+ row tables | PASS | Button appears for 3-input levels (8 rows), filters to failing rows only |
| T1: Compact mode with no results | PASS | Shows all rows when no simulation results available |
| T2: Row hover → canvas highlight | PASS | Input nodes pulse green (1) or blue (0) on hover |
| T2: Hover stop clears highlight | PASS | _highlightedInputRow set to null on mouseleave |
| T3: Column sort ascending | PASS | Click header sorts ascending, ▲ arrow shown |
| T3: Column sort descending | PASS | Second click reverses to descending, ▼ arrow |
| T3: Sort reset button | PASS | "↺ Reset Sort" appears when sorting active |
| T4: 4-input level defaults to key rows | PASS | Auto-enabled on first render for levels with ≥4 inputs |
| T4: Key rows toggle | PASS | Button switches between key rows and all rows |
| T5: Decimal index column | PASS | # column shows 0-based row index |
| T5: Input cell tooltips | PASS | Hovering shows "A=1,B=0 = 2" decimal annotation |
| T6: Color-coded 0 cells | PASS | Rendered in dim blue (#4466aa) |
| T6: Color-coded 1 cells | PASS | Rendered in bright green (#00ff00) |
| T6: Colors in light mode | PASS | Adjusted colors for light backgrounds |
| T7: Focus Failed Rows button appears | PASS | Visible after failed simulation |
| T7: Focus button hidden on pass | PASS | Not shown when all rows pass |
| T7: Focus button scroll behavior | PASS | Scrolls to first failing row with pulse animation |
| T8: Sticky headers | PASS | Column headers stay visible when scrolling table |
| T9: Auto-expand on RUN | PASS | Collapsed truth table expands when RUN is pressed |
| T9: Auto-expand on Quick Test | PASS | Same behavior for Shift+Enter |
| T10: Mobile tap sets input values | PASS | Tapping a row sets input node values and propagates |
| State reset on level load | PASS | Sort/compact/keyRows state clears on new level |

## Bugs Found & Fixed
None — clean implementation.

## Regression Results
- Level select screen rendering: PASS
- Level loading (2-input, 3-input levels): PASS
- Quick Test functionality: PASS
- Truth table with simulation results: PASS
- Actual/Got columns on failure: PASS
- Row flash animations (pass/fail): PASS
- Sandbox truth table: PASS (separate method, unaffected)
- Light mode: PASS
- No console errors: PASS

## Lessons Added
- **Truth table state management**: Using a lazy-initialized state object (`_ttState`) that resets on level load keeps sort/filter state clean across levels while persistent within a session.
- **Canvas highlight via game state property**: Setting `_highlightedInputRow` on the game state and reading it in the render loop is the cleanest way to bridge DOM hover events to canvas rendering without coupling UI to renderer.
- **Decimal tooltips via title attribute**: Using HTML `title` attribute for tooltips is zero-overhead and works across all platforms without custom tooltip code.

## Overall Assessment
All 10 items implemented and verified. The truth table is now significantly more usable for complex levels with many rows. Color-coded cells make it instantly readable, the compact/key rows modes reduce cognitive load for 4-input levels, and the sorting/hover features add genuine analytical tools. No regressions found. **Day 39 is shippable.**
