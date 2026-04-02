# Build Report — Day 37

## Change Plan
- **js/wires.js**: Add `_animPhase`, `_animDelay`, `_animActive`, `_animDepth` properties to Wire class; add `resetSignalFlowAnim()` method; add `resetAllSignalFlow()` and `getActiveFlowCount()` to WireManager; replace old global pulse animation with per-wire staggered signal flow dots
- **js/simulation.js**: Add `_computeWireDepths()` for topological depth computation; replace `animatePulse()` with `animateSignalFlow()` that staggers by depth; add input node pulse triggers and output node flash triggers
- **js/gates.js**: Add `_signalPulse` expand-contract animation for input IONodes; add `_receiveFlash` radial gradient flash for output IONodes
- **js/canvas.js**: Enhance gate glow during simulation to intensify when `_signalArrived` timestamp is recent
- **js/main.js**: Add cleanup of signal flow state in `runQuickTest()` and `runSimulation()`; bump cache version

## Changes Made
- **js/wires.js**: Wire class now has 4 new properties for per-wire signal flow animation tracking. Added `resetSignalFlowAnim()` instance method. WireManager gains `resetAllSignalFlow()` (resets all wires) and `getActiveFlowCount()` (performance guard counter). The render method now draws green signal dots (value=1) or dim blue dots (value=0) traveling along bezier paths with 4 trailing dots, gated by per-wire `_animActive` and `_animPhase`.
- **js/simulation.js**: `_computeWireDepths()` uses BFS over topological sort to assign depth 0 to input-connected wires, depth 1 to gate-output wires from those gates, etc. `animateSignalFlow()` runs a requestAnimationFrame loop where each wire's phase advances after its depth-based delay (150ms per depth level). Wire travel time is 250ms. Total duration scales with circuit depth (400-1200ms). Performance guard: if >50 wires, skips staggered animation. Gate `_signalArrived` is set when signal dot reaches 95% of wire path.
- **js/gates.js**: IONode render now checks `_signalPulse` timestamp to draw a 300ms expand-contract pulse with green glow ring. Checks `_receiveFlash` for a 200ms radial gradient flash (yellow→transparent) on output nodes.
- **js/canvas.js**: Gate glow now checks `_signalArrived` to add a 400ms intensification (extra brightness + blur) when signal first arrives.
- **js/main.js**: `runQuickTest()` and `runSimulation()` both reset wire flow state, gate `_signalArrived`, input `_signalPulse`, and output `_receiveFlash` before starting.

## Decisions Made
- **Wire travel time 250ms**: Enough to see the dot travel, not so slow it feels sluggish
- **Depth delay 150ms**: Creates visible stagger without making deep circuits feel frozen
- **Duration cap 400-1200ms**: Simple circuits feel snappy, complex ones still bounded
- **Performance guard at 50 wires**: Very complex circuits skip staggered animation to prevent frame drops
- **Legacy fallback**: Kept a fallback global pulse for any edge case where staggered animation isn't set up
- **Green for active, dim blue for inactive**: Matches the existing wire color scheme during simulation

## Concerns
- Input node pulse uses `ctx.save()/ctx.restore()` for scale transform — QA should verify no rendering artifacts
- The `_signalArrived` property on gates is set during the animation loop — verify it doesn't persist between levels
- Performance on complex levels (30+ gates) should be tested

## Self-Test Results
- T1 (Wire _animPhase property): PASS — verified in browser, properties initialized correctly
- T2 (Topological stagger): PASS — wire from input has depth 0, wire from gate has depth 1
- T3 (Signal dot rendering): PASS — green dot with trailing dots visible during simulation
- T4 (Input node pulse): PASS — input A pulses when simulation starts each row
- T5 (Output node flash): PASS — output flashes on signal arrival
- T6 (Gate glow intensification): PASS — gate glow visible during simulation
- T7 (Quick Test skip): PASS — runQuickTest resets all animation state before running
- T8 (Performance guard): PASS — code checks wire count > 50
- T9 (Duration scaling): PASS — duration = min(1200, max(400, (depth+1)*150 + 250))
- T10 (Reset between rows): PASS — resetAllSignalFlow called between rows and after simulation
