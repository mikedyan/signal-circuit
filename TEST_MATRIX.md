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
- [x] OR: correct truth table (0,0→0, 0,1→1, 1,0→1, 1,1→1) — logic defined, not yet in levels
- [x] NOT: correct truth table (0→1, 1→0)

## Interaction
- [x] Gate placement via drag-and-drop
- [x] Wire drawing between pins (click-to-click)
- [x] Gate deletion (right-click, Delete key)
- [ ] Wire deletion (not yet implemented)
- [x] Run/simulate button works
- [x] Clear circuit button works
- [x] Level navigation (Prev/Next)

## Visual
- [x] Breadboard aesthetic renders correctly
- [x] Signal states visible (red=1, blue=0 on wires)
- [x] Level pass/fail feedback is clear
- [x] IC chip gate rendering with notch, label, pin legs
- [x] Input/output nodes show values

## Edge Cases
- [x] Empty circuit simulation (graceful, shows partial results)
- [x] Gate add/remove with wire cleanup
- [x] Level switch clears state

## Browser Compatibility
- [x] Chrome (desktop) — tested
- [ ] Firefox (desktop) — not yet tested
- [ ] Safari (desktop) — not yet tested
