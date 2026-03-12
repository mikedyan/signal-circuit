# Build Report — Day 18, Item 2: Restructure Hints as Conceptual Nudges

## Change Plan
- **js/levels.js**: Rewrite all 15 level hint arrays to Socratic progression; add `hintHighlights` property to each level
- **js/main.js**: Add `activeHintHighlights` state; set on hint 3, clear on reset/load
- **js/canvas.js**: Render pulsing gold highlight on I/O nodes when `activeHintHighlights` is active
- **js/ui.js**: Update `showHint()` to accept `isVisualHint` flag and show visual tag for hint 3
- **css/style.css**: Add `.hint-visual-tag` styling
- **index.html**: Bump cache-buster from v=18 to v=19

## Changes Made
- **js/levels.js**: All 15 levels rewritten:
  - Hint 1: General concept or guiding question
  - Hint 2: Structural insight with gate count
  - Hint 3: Conceptual nudge about approach, never exact wiring
  - Added `hintHighlights` array to each level (I/O labels to highlight)
- **js/main.js**: 
  - Added `this.activeHintHighlights = null` to constructor
  - Set `activeHintHighlights` when hint 3 is shown (only if level has `hintHighlights`)
  - Clear `activeHintHighlights` in `resetHintState()`
  - Pass `isVisualHint` flag to `ui.showHint()`
- **js/canvas.js**: Added hint highlight rendering in `render()`:
  - Matches I/O node labels against `activeHintHighlights`
  - Draws pulsing gold radial gradient + ring around matched nodes
  - Uses `performance.now()` sine-based animation at 400ms period
- **js/ui.js**: Updated `showHint()` signature to accept `isVisualHint`:
  - When true, appends a `👁 Look at the highlighted pins` visual tag
- **css/style.css**: Added `.hint-visual-tag` class with amber/gold styling
- **index.html**: Bumped all `?v=18` to `?v=19`

## Decisions Made
- **No hint reveals wiring**: Verified every hint — none contains arrow notation (→) or explicit connection instructions
- **Visual hint only on hint 3**: Only the final hint triggers pin highlighting, keeping it as the "strongest" nudge
- **Gold color for highlights**: Matches the existing amber/gold hint UI theming
- **Radial gradient + ring**: Two-layer effect (soft glow + crisp ring) for visibility without obscuring the pins

## Concerns
- QA should verify hints render correctly for all 15 levels
- QA should verify the visual highlight appears and disappears properly
- QA should verify hint penalty system still works correctly
- Daily/sandbox/challenge modes don't have hints — verify they're unaffected

## Self-Test Results
- No hint contains exact wiring: PASS (manually verified all 15)
- Hint 1 = concept/question: PASS
- Hint 2 = structural + gate count: PASS
- Hint 3 = conceptual nudge: PASS
- hintHighlights on all 15 levels: PASS
- activeHintHighlights lifecycle: PASS (set on hint 3, cleared on reset)
- Visual tag for hint 3: PASS
- Cache buster bumped: PASS
