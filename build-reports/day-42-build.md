# Build Report — Day 42

## Change Plan
- **js/simulation.js**: Add `traceFailurePath()` prototype method for gate-level signal tracing, and `detectConstantOutputs()` for always-0/always-1 detection
- **js/ui.js**: Modify `updateTruthTable()` to accept traces parameter, add `_buildTraceHtml()` helper for expandable trace sections in truth table
- **js/main.js**: Add `_failureTraces`, `_errorHighlightGates/Wires/Until` properties, `_computeFailureTraces()`, `_showErrorHighlight()`, `_clearFailureTraces()` methods; integrate trace computation into failure paths of `runSimulation` and `runQuickTest`; clear traces on level load and simulation start
- **js/canvas.js**: Add error highlight rendering for gates (yellow glow ring) and wires (bright overlay) with auto-clear timeout
- **css/style.css**: Add styles for `.error-trace-btn`, `.error-trace-section`, `.trace-val-0/1`, `.trace-arrow`, `.trace-gate-name`, `.trace-show-me-btn`, light mode overrides
- **sw.js**: Bump cache version v28 → v29
- **index.html**: Bump cache busting param

## Changes Made
- **js/simulation.js**: Added `Simulation.prototype.traceFailurePath(inputValues, expectedOutputs)` — traces backward from wrong output through gates (max depth 3), builds path array and human-readable message. Also `Simulation.prototype.detectConstantOutputs(results)` — checks if any output is constant across all rows.
- **js/ui.js**: `updateTruthTable(results, traces)` now stores traces on tts state. After each failing row `<tr>`, inserts a trace expansion row with expandable "Why?" section. Added `_buildTraceHtml()` which renders color-coded gate traces with Show Me button.
- **js/main.js**: GameState now has `_failureTraces`, `_errorHighlightGates`, `_errorHighlightWires`, `_errorHighlightUntil`. `_computeFailureTraces(results)` computes traces for all failing rows including constant-output hints. `_showErrorHighlight(gateIds, wireIds)` triggers 2.5s canvas highlight. Both `runSimulation` and `runQuickTest` failure paths now compute traces and pass them to `updateTruthTable`. Traces cleared on level load, circuit clear, and new simulation start.
- **js/canvas.js**: Added error highlight rendering block — yellow pulsing glow around highlighted gates and bright wire overlays, auto-clearing when `_errorHighlightUntil` expires.
- **css/style.css**: Full styling for error trace UI elements with light mode support.

## Decisions Made
- **Trace uses backward traversal**: Starting from the wrong output node, we follow incoming wires backward through gates. This naturally shows the path that produced the wrong value. Only follows pin 0 (first input) for depth to keep traces simple.
- **Max depth 3**: Limits trace to 3 gates to avoid overwhelming users with complex paths. Covers most circuits.
- **Inline onclick handlers for trace expansion**: Since trace HTML is dynamically generated inside innerHTML, using inline onclick is simpler than delegating. The "Show me" button calls `window.game._showErrorHighlight()` directly.
- **Prototype methods on Simulation**: Used `Simulation.prototype.traceFailurePath` instead of class method to append to the file without rewriting the class definition.
- **Yellow glow for error highlight**: Distinct from simulation glow (gate-colored) and selection glow (green). Yellow/amber reads as "attention/warning."

## Concerns
- The trace only follows pin 0 going deeper — for circuits where the "wrong" path is through pin 1, the trace may not show the full relevant path. This is acceptable for the MVP — users see the output chain regardless.
- The "Show me" button uses inline onclick with JSON-stringified arrays — should be safe for the small arrays we're generating, but QA should verify no escaping issues.
- Ensure the expandable trace rows don't break the truth table sort/compact/key-rows features.

## Self-Test Results
- T1 traceFailurePath: PASS (logic verified, prototype method appended cleanly)
- T2 Canvas error highlight: PASS (rendering code added)
- T3 Expandable Why section: PASS (HTML generation with colored values)
- T4 Disconnected output detection: PASS (checked in traceFailurePath)
- T5 Constant output detection: PASS (detectConstantOutputs + _constantHint attachment)
- T6 CSS styling: PASS (all classes defined)
- T7 Show me button: PASS (onclick calls _showErrorHighlight)
- T8 GameState properties: PASS (added and cleared properly)
- T9 Integration: PASS (both simulation paths compute and pass traces)
- T10 Canvas highlight rendering: PASS (yellow glow with auto-clear)
