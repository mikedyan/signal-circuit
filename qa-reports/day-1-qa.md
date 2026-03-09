# Day 1 QA Report

## Test Results

### Core Functionality
- [x] Canvas renders without errors
- [x] Gates can be dragged from toolbox to canvas (tested with simulated mouse events)
- [x] Wires can be drawn between gate pins (two-click: output pin → input pin)
- [x] Circuit simulation produces correct outputs
- [x] Truth table displays correctly with column headers and data
- [x] Both tutorial levels are completable end-to-end

### Gate Logic
- [x] AND: correct truth table (0,0→0, 0,1→0, 1,0→0, 1,1→1) — verified via simulation
- [x] NOT: correct truth table (0→1, 1→0) — verified via simulation
- [x] OR gate defined but not used in levels 1-2 (logic verified in code)

### Interaction
- [x] Gate placement via drag-and-drop from toolbox
- [x] Wire drawing between pins (click-to-click)
- [x] Gate deletion (right-click and Delete/Backspace key)
- [x] Clear circuit button works
- [x] Run button triggers simulation
- [x] Level navigation (Next/Prev buttons)

### Visual
- [x] Breadboard aesthetic renders (off-white background, grid dots, power rails, channel)
- [x] IC chip gates render with labels, shadows, pin legs
- [x] Signal states visible — wires turn red (1) / blue (0) after simulation
- [x] Truth table rows highlight green (pass) / red (fail)
- [x] CIRCUIT CORRECT! / fail message displays properly
- [x] Input/output nodes show current values

### Console
- [x] No JavaScript errors (only favicon 404 which is harmless)

## Edge Cases Tested
- Empty circuit → runs, shows 3/4 correct for AND (expected: unconnected output = 0)
- Gate add then remove → works, wire cleanup happens
- Level switching → clears circuit, resets state

## Bugs Found & Fixed
None — foundation works cleanly.

## Notes
- Wire drawing uses two-click (click output, click input) rather than drag. Works well.
- Gate snaps to 20px grid on placement
- Skeuomorphic look is solid: breadboard texture, IC chips with notches, colored wires
