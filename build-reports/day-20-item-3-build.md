# Build Report — Day 20 Item 3

## Changes Made
- js/audio.js: Added playInvalidConnection() — short harsh buzz sound
- js/wires.js: Added _showInvalidFeedback(x,y) — plays buzz + sets red flash
- js/wires.js: finishDrawing() now calls _showInvalidFeedback for same-type and self-connection attempts
- js/wires.js: render() draws animated red flash ring at invalid pin location

## Self-Test Results
- Output→Output feedback: PASS
- Input→Input feedback: PASS
- Self-connection feedback: PASS
- Valid connections unaffected: PASS
