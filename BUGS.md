# Bugs

## Open
*None*

## Closed
- **BUG-001 (Day 3):** Star thresholds for levels 8 and 9 were set to optimalGates=3, but the minimum for De Morgan constructions is 4 gates. Fixed to optimalGates=4, goodGates=5.
- **BUG-002 (Day 15):** Wire hit-testing was using L-shaped segment math but rendering was bezier curves — mismatch made clicking wires unreliable. Fixed by switching hit-testing to bezier point sampling (20 sample points).
