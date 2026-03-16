# Build Report — Day 25

## Tasks Completed
- **T1**: Color-coded toolbox gates — left border + text color now matches each gate type's canvas color (AND=yellow, OR=cyan, NOT=red-orange, XOR=purple)
- **T2**: Brand mark SVG logo — signal waveform inside a circle, appears on level select header next to title. Clean, minimal, circuit-themed
- **T3**: Pin visibility improved — pin radius 5→7px, added breathing animation (subtle pulse on unconnected pins), better contrast colors (#3a5588 vs old #336)
- **T4**: Font size toggle — 3 modes (Normal/Large/X-Large) persisted in localStorage. 14px floor enforced on key UI elements (status bar, info panel, buttons)
- **T5**: Non-blocking onboarding tooltip — repositioned to bottom of canvas, click-anywhere-to-dismiss, auto-dismiss after 8s. Doesn't block canvas interactions
- **T6**: Semantic wire colors — wires from same output pin share a color. Uses `_semanticColorMap` keyed by `gateId:pinIndex`. Colors reset on level load/clear
- **T7**: Clear Circuit is now undoable — saves full gate/wire state before clear, Ctrl+Z restores everything. Redo re-clears
- **T8**: Level transition choreography — power-down/up CSS animation (200ms dim out, 200ms fade in) when navigating between levels
- **T9**: Sound micro-randomization extended — playClick, playWireDisconnect, playButtonClick, playFail all now use _randomize for frequency and duration variance
- **T10**: Challenge mode gating — input slider max gated: 2 (default) → 3 (after Ch1) → 4 (after Ch2). Output slider: 1 → 2 (after Ch2)

## Key Decisions
- Pin breathing animation uses `performance.now() / 600` for a slow, subtle pulse — not distracting
- Font size toggle uses body class (`fontsize-normal/large/x-large`) rather than CSS variables for broader compatibility
- Semantic wire colors use a map that resets on clear — colors are assigned on first wire from each source pin
- Tooltip moved to bottom-center of canvas to avoid blocking circuit interaction area
- Brand logo is inline SVG (no external asset needed), renders at 36x36 with drop-shadow glow

## Concerns
- Pin breathing animation keeps needsRender dirty — could slightly impact idle performance (but it's a tiny overhead)
- Font size toggle only affects CSS — canvas text (gate labels, I/O labels) won't scale since they use canvas ctx.font
