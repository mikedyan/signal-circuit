# Day 57 — Mobile Optimization Pass

**Week:** Build 1 | **Day:** 5 (Wednesday Apr 22)
**Goal:** Polish mobile UX — larger touch targets, better layout, haptic feedback, landscape support

## Items

1. **Pin touch target: 36px → 44px** — canvas.js `findPinAt()` base for mobile → 44 (Apple HIG minimum)
2. **Double-tap gate context menu** — On double-tap a gate, show contextual popup: Delete / Duplicate / Info
3. **Horizontal scrolling toolbox strip at bottom for mobile** — Mobile toolbox becomes a fixed bottom strip with horizontal scroll
4. **Info panel mobile: compact sticky footer** — On mobile, collapse info panel to a compact fixed footer with RUN + gate count + result status
5. **Gate drag ghost: larger on mobile** — Increase drag ghost size on touch devices + show grid-snap landing preview
6. **Haptic feedback on RUN button** — Add `navigator.vibrate(40)` on RUN button press
7. **Landscape layout** — When `(orientation: landscape) and (max-height: 500px)`, toolbox + truth table side-by-side
8. **Pull-to-refresh on level select** — Touch pulldown gesture to reload progress display
9. **iPhone SE (320px) + iPad landscape fixes** — Breakpoint fixes for small and wide screens
10. **Touch-friendly truth table** — Larger row height (36px → 44px on mobile), tap row to set those inputs for live testing
