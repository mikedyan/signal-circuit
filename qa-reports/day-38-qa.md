# QA Report — Day 38

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| Tutorial shows on first Level 1 load | PASS | Overlay appears with Step 1/8, AND gate has pulsing highlight |
| Step 1: Gate placement advances | PASS | addGate('AND') triggers step 1→2 |
| Step 2: Input A wire start | PASS | startDrawing from Input A advances step |
| Step 3: Wire to AND input 0 | PASS | finishDrawing to AND gate pin 0 advances step |
| Step 4: Input B wire start | PASS | startDrawing from Input B advances step |
| Step 5: Wire to AND input 1 | PASS | finishDrawing to AND gate pin 1 advances step |
| Step 6: AND output wire start | PASS | startDrawing from AND output advances step |
| Step 7: Wire to OUT node | PASS | finishDrawing to OUT node advances step |
| Step 8: RUN button press | PASS | runSimulation() completes tutorial |
| Tutorial overlay disappears after completion | PASS | display:none, active=false |
| localStorage tutorial-done set | PASS | 'signal-circuit-tutorial-done' = 'true' |
| Tutorial doesn't show on re-enter | PASS | tutorial=null on subsequent Level 1 loads |
| Skip button works at step 0 | PASS | Tutorial dismissed, localStorage set |
| Tutorial doesn't show for other levels | PASS | Level 2 loads without tutorial |
| Tutorial doesn't show for completed Level 1 | PASS | shouldShow returns false |
| RUN button gets tutorial-highlight class at step 7 | PASS | classList contains 'tutorial-highlight' |
| Toolbox gates get tutorial-highlight at step 0 | PASS | Visual gold border confirmed |
| Canvas pin highlights render | PASS | Gold pulsing circles visible at pin positions |
| No JS errors | PASS | Console clean |
| Service worker updated | PASS | tutorial.js added to ASSETS, cache version bumped to v27 |

## Bugs Found & Fixed
- **SW Cache Bug**: Service worker was caching old index.html without tutorial.js script tag. Fixed by bumping cache version to v27 and adding `/js/tutorial.js` to the ASSETS list.
- **Tutorial overlay placement**: Initially placed outside `#canvas-container` div, causing `position: absolute` to not work relative to the canvas. Moved inside `#canvas-container`.

## Bugs Found & Not Fixed
None.

## Regression Results
- Level select navigation: PASS
- Level loading (level 1, 2): PASS
- Gate placement: PASS
- Wire drawing: PASS
- Simulation: PASS (circuit correct with full celebration)
- Old onboarding tooltip (levels 2-4): PASS (not affected by tutorial changes)
- Return-player re-onboarding: Not tested (requires time gap) — code path unchanged

## Lessons Added
- **SW cache invalidation**: Always bump the service worker cache version AND add new files to the ASSETS list when adding new JS files. The cache-first strategy means new files are invisible until the SW updates.
- **Tutorial overlay must be inside its parent container**: For `position: absolute` with CSS, the overlay must be a child of the `position: relative` container it needs to cover.

## Overall Assessment
Day 38 build is **shippable**. The interactive tutorial works end-to-end across all 8 steps, with proper advancement on correct actions, skip functionality, localStorage persistence, and clean cleanup. The tutorial overlay styling is polished with the gold/amber theme matching the game's aesthetic. No regressions found in existing gameplay.
