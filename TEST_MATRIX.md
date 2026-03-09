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

## Levels
- [x] Level 1: AND Gate Basics — pass with single AND
- [x] Level 2: NOT Gate Inversion — pass with single NOT
- [x] Level 3: OR Gate Basics — pass with single OR
- [x] Level 4: Build a NAND — pass with AND → NOT
- [x] Level 5: Build a NOR — pass with OR → NOT

## Interaction
- [x] Gate placement via drag-and-drop
- [x] Wire drawing between pins (click-to-click)
- [x] Gate deletion (right-click, Delete key)
- [x] Wire deletion (click to select, Delete key; right-click to delete)
- [x] Wire selection with yellow highlight
- [x] Wire hover with blue glow
- [x] Run/simulate button works (animated)
- [x] Clear circuit button works
- [x] Level navigation (Prev/Next)
- [x] Undo (Ctrl+Z / Cmd+Z)
- [x] Redo (Ctrl+Shift+Z / Cmd+Shift+Z)

## Visual
- [x] Breadboard aesthetic renders correctly
- [x] Signal states visible (red=1, blue=0 on wires)
- [x] Level pass/fail feedback is clear
- [x] IC chip gate rendering with gradient, rounded corners, notch
- [x] Input/output nodes show values
- [x] LED glow on active output nodes
- [x] Pin glow on active state
- [x] Pin hover highlight (green)
- [x] Cursor changes contextually
- [x] Signal pulse animation during simulation

## Edge Cases
- [x] Empty circuit simulation (graceful, shows partial results)
- [x] Gate add/remove with wire cleanup
- [x] Level switch clears state and undo history
- [x] Animation blocks interaction during simulation

## Browser Compatibility
- [x] Chrome (desktop) — tested
- [ ] Firefox (desktop) — not yet tested
- [ ] Safari (desktop) — not yet tested
