# Build Report — Item 4: Diagnostic Failure Feedback

## Changes
- **js/ui.js** `updateTruthTable()`: Added "Got" columns when any row fails, showing actual circuit output vs expected. Color-coded: red for mismatches, green for matches, dimmed for passing rows.
- **css/style.css**: Added `.actual-col` styling with orange-tinted background and left border to visually separate actual from expected columns.

## Simplified
- Skipped "trace wire path backward" and "flash offending gate" — too complex for effort-2. The "Got" column diagnostic is the highest-value part.

## Files Modified
- js/ui.js (1 edit)
- css/style.css (1 edit)
