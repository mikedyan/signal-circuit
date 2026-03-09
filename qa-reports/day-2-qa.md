# Day 2 QA Report

## Test Results

### Signal Flow Animation (T1)
- [x] Animated simulation runs row-by-row with visible delays
- [x] Truth table rows light up sequentially during animation
- [x] Final result displayed after animation completes
- [x] RUN button disabled during animation (prevents double-run)
- [x] Pulse dots visible on wires during signal propagation

### Wire Deletion (T2)
- [x] Wire hit-detection works on all 3 wire segments (horizontal, vertical, horizontal)
- [x] Wire selection highlights in yellow with glow
- [x] Delete/Backspace removes selected wire
- [x] Right-click wire deletes immediately
- [x] Wire hover shows blue glow

### Undo/Redo (T3)
- [x] Gate add → undo → removes gate (1 → 0)
- [x] Gate undo → redo → restores gate (0 → 1)
- [x] Wire add → undo → removes wire (1 → 0)
- [x] Undo stack tracks correctly
- [x] Ctrl+Z / Cmd+Z works for undo
- [x] Ctrl+Shift+Z works for redo

### New Levels (T4)
- [x] Level 3 (OR Gate): Pass with single OR gate
- [x] Level 4 (Build NAND): Pass with AND → NOT chain
- [x] Level 5 (Build NOR): Pass with OR → NOT chain
- [x] All truth tables verified correct
- [x] Level navigation works across all 5 levels

### Visual Polish (T5)
- [x] IC chips have gradient fill and rounded corners
- [x] Active pins have red glow effect
- [x] Output nodes have LED-style radial glow when value=1
- [x] Wire hover/selection glow effects
- [x] Pin hover shows green circle highlight
- [x] Cursor changes contextually (crosshair/grab/pointer)
- [x] Wire drawing preview now routes like real wires
- [x] Breadboard has subtle gradient background

### Regression
- [x] Level 1 (AND) still passes
- [x] Level 2 (NOT) still passes
- [x] Gate drag from toolbox still works
- [x] Clear circuit still works
- [x] No JavaScript errors in console

## Bugs Found & Fixed
None — all features work correctly.

## Notes
- Animation adds ~2.8s to simulation (4 rows × 700ms per row)
- Wire hit-detection uses point-to-segment distance, works reliably at 8px threshold
- Undo/redo tested for add/remove gates and wires
