# Build Report — Item 7: Real-Time Signal Propagation

## Changes
- **js/main.js**: Added `_propagateLiveSignals()` method that runs `evaluateOnce()` with current input values. Added input node click toggle in both mouse and touch handlers.
- **js/wires.js**: Updated wire color logic to show active wires in green (#00cc66) during live propagation (non-animation state).

## How It Works
1. User clicks input node → toggles value 0↔1
2. `_propagateLiveSignals()` runs evaluateOnce() with current input values
3. evaluateOnce() sets signalValue on each wire and outputValues on gates
4. Canvas re-renders showing green wires for signal=1, normal color for signal=0
5. Output nodes update their displayed value

## Files Modified
- js/main.js (3 edits)
- js/wires.js (1 edit)
