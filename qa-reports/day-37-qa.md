# QA Report — Day 37

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| T1: Wire _animPhase property | PASS | Wire class has _animPhase, _animDelay, _animActive, _animDepth initialized to 0/false |
| T2: Topological stagger | PASS | Wire from input node has depth 0, wire from gate output has depth 1. Signal flows left-to-right. |
| T3: Signal dot rendering | PASS | Green dot travels along active wires with 4 trailing dots. Dim blue dot on inactive wires. |
| T4: Input node pulse | PASS | Input nodes pulse with expand-contract animation at row start |
| T5: Output node flash | PASS | Output nodes flash on signal arrival |
| T6: Gate glow intensification | PASS | Gates glow brighter when signal arrives at inputs |
| T7: Quick Test skip | PASS | Quick Test produces instant results, no signal flow animation, no artifacts |
| T8: Performance guard | PASS | Code checks wire count > 50, skips staggered animation |
| T9: Duration scaling | PASS | Duration = min(1200, max(400, (depth+1)*150 + 250)) |
| T10: Reset between rows | PASS | All wire/gate/node animation state resets between rows and after simulation |

## Bugs Found & Fixed
None — clean implementation.

## Bugs Found & Not Fixed
None.

## Regression Results
- Level loading: PASS — Level 2 loads correctly
- Circuit building (gate placement + wiring): PASS
- Normal RUN simulation: PASS — runs with animation, shows correct result
- Quick Test: PASS — instant evaluation, no animation
- Celebration particles: PASS — confetti appears on success
- Wire rendering (idle dots, semantic colors): PASS
- Gate rendering: PASS
- Canvas rendering: PASS
- Truth table display: PASS
- Star calculation: PASS (3 stars for optimal gate count)

## Lessons Added
- Day 37: Per-wire animation using _animPhase (0-1) and topological depth is cleaner than global progress. Stagger delay per depth level creates natural signal flow feel without complex timing code.
- Day 37: Always reset custom animation properties (_signalPulse, _receiveFlash, _signalArrived) before both Quick Test and normal RUN to prevent ghost animations from previous runs.
- Day 37: ctx.save()/ctx.restore() for IONode pulse scaling is necessary but must be paired carefully — the restore must happen after all rendering that uses the scale transform.

## Overall Assessment
Day 37 build is shippable. Signal flow animation works correctly:
- Signals visibly flow from inputs through gates to outputs
- Topological ordering creates natural left-to-right flow
- Quick Test bypasses animation entirely (instant)
- Performance guard prevents issues on complex circuits
- All animation state cleans up properly between rows and after simulation
- No regressions detected in existing functionality
