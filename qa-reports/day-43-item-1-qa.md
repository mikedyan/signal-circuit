# QA Report — Day 43

## Test Results
| Test | Result | Notes |
|------|--------|-------|
| T1: Preview data saved on completion | PASS | _savePreview stores compact gate/wire/IO data in localStorage |
| T2: Mini-preview rendering (120x80) | PASS | Gates render as colored rectangles with labels, wires as bezier curves, I/O as dots |
| T3: Only completed levels show preview | PASS | Locked/incomplete levels have no preview canvas or solution button |
| T4: Enlarged preview on hover/tap | PASS | 300x200 overlay appears with level title, positions correctly |
| T5: LRU eviction at 20 previews | PASS | Code logic verified, evicts oldest by timestamp |
| T6: View Solution button | PASS | Loads level and attempts ghost overlay enable |
| T7: Preview updates on improvement | PASS | _savePreview called in completeLevel(), overwrites existing |
| T8: IntersectionObserver lazy loading | PASS | Observer attached, canvases render when scrolled into view |
| T9: CSS styling (dark + light mode) | PASS | Rounded corners, borders, hover effects, light mode overrides |
| T10: Bounding box auto-scaling | PASS | Circuit elements fit within canvas with consistent padding |

## Bugs Found & Fixed
None — implementation clean on first pass.

## Bugs Found & Not Fixed
None.

## Regression Results
- Level select rendering: PASS (all 42 level cards render correctly)
- Click-to-play on level cards: PASS (level 4 loads normally)
- Completed level display (stars, badges, time): PASS (all present)
- View Solution button: PASS (stops propagation, doesn't trigger level start)
- Preview canvas click: PASS (stops propagation, shows enlarged view)
- Console errors: NONE (only pre-existing meta tag deprecation warning)
- Light mode: Preview has appropriate override styles
- Page reload persistence: PASS (previews survive reload via localStorage)

## Lessons Added
- **IntersectionObserver for lazy canvas rendering**: Creating many canvas elements is cheap, but rendering to them is expensive. Using IO to defer rendering until visible eliminates performance impact of dozens of preview canvases.
- **Bounding box + proportional scaling for any-size content**: Computing the bounding box of all elements, then scaling with aspect ratio preservation and centering, handles any circuit size from 1-gate to 10-gate circuits uniformly.
- **2x canvas for retina**: Setting canvas.width to 2x the CSS display size and rendering at double resolution gives crisp previews on retina displays.
- **stopPropagation on nested clickables**: Preview canvas and View Solution button inside the level card need stopPropagation() to prevent the card's click-to-play handler from firing.

## Overall Assessment
Day 43 build is shippable. Level preview thumbnails render correctly, enlarged view works, View Solution button functions properly, and no regressions detected. The feature gracefully handles levels without preview data (completed before this feature existed). New level completions will automatically generate previews going forward.
