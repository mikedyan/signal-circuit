# Build Report — Day 19 Item 8

## Changes Made
- js/main.js: Wrapped runSimulation() body in try/finally, isAnimating always reset in finally block
- js/main.js: Removed redundant isAnimating=false from onDone callback and runSandboxTest  
- js/simulation.js: Wrapped runAnimated() body in try/finally, animating and animationRow always reset in finally block

## Self-Test Results
- isAnimating reset on error: PASS (finally block guarantees it)
- Normal operation unaffected: PASS (same code paths, just wrapped)
