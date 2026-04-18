# Spec: Sub-Circuit Abstraction System (Cycle 1 Day 1)

## Summary
Players can save completed level solutions as reusable custom gates. These custom gates appear in the toolbox during sandbox and challenge modes, acting as black-box components.

## Data Model
- localStorage key: `signal-circuit-subcircuits`
- Max 10 sub-circuits, LRU eviction by creation date
- Each entry: `{ id, name, outputMap, inputCount, color, originalGateCount, levelId, createdAt }`
- `outputMap`: flat array indexed by binary input combination (MSB first)

## Gate Integration
- Registered dynamically in GateTypes as `SUB_{id}`
- Evaluation uses truth table lookup via outputMap
- Gate.evaluate() updated to use spread operator for any input count
- Rendering: distinct purple/teal block with custom label

## UI
- "Save as Custom Gate" button in star-display (campaign levels only)
- Prompt for name (default: level title)
- For multi-output levels, picks first output (with note)
- "Custom Gates" section in toolbox (sandbox/challenge/adaptive modes)
- Hover tooltip shows truth table
- Toast confirmation on save

## Achievement
- "Circuit Architect" (silver) — Create 5 custom sub-circuits
