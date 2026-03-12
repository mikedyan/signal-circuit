# Build Report — Day 18, Item 1

## Change Plan
- **js/levels.js**: Rewrite all 15 level descriptions to remove formulas, gate counts, and solution hints. Add `postSolveInsight` field to each level.
- **index.html**: Add `#post-solve-insight` div inside `#star-display`. Bump cache version to v=18.
- **js/ui.js**: Populate insight in `showStarDisplay()`, hide in `hideStarDisplay()` and `showChallengeResult()`.
- **css/style.css**: Style the insight element with blue accent, fade-in animation.

## Changes Made
- **js/levels.js**: All 15 descriptions rewritten. Key changes:
  - Level 4: Removed "NAND = NOT(AND). You need TWO gates" → "Study the truth table carefully — compare it to Level 1."
  - Level 5: Removed "NOR = NOT(OR). Same trick as NAND" → "Compare this truth table to Level 3."
  - Level 7: Removed "combine a gate with NOT" → "The opposite of what you just built in Level 6."
  - Level 8: Removed entire De Morgan's formula → "Reproduce AND behavior — but you can only use OR and NOT gates."
  - Level 9: Same treatment as Level 8.
  - Level 11: Removed "SUM (XOR) and CARRY (AND)" → "SUM is the single-digit result, CARRY is what overflows."
  - Level 12: Removed "Chain two AND gates together!" → "You have three inputs but your gates only take two..."
  - All 15 levels now have `postSolveInsight` with the removed formulas + fun facts.
- **index.html**: Added `<div id="post-solve-insight">` inside star-display. Version bumped to v=18.
- **js/ui.js**: 
  - `showStarDisplay()`: Shows insight if level has `postSolveInsight`
  - `hideStarDisplay()`: Hides insight element
  - `showChallengeResult()`: Explicitly hides insight (no insights for challenges)
- **css/style.css**: Blue-tinted insight box with `insightReveal` animation.

## Decisions Made
- **Levels 1-3, 6 kept gate-name references**: These are single-gate teaching levels where the only available gate IS the solution. Naming the gate type is conceptual framing, not a spoiler.
- **Level descriptions still hint at relationships**: e.g., "compare to Level 1" — this is conceptual framing without giving away the formula.
- **Blue accent for insights**: Differentiates from the gold star display and green success, making it visually distinct as a "knowledge reward."
- **Hints array untouched**: The existing progressive hint system handles step-by-step guidance. Descriptions should frame the goal, hints reveal the method.

## Concerns
- QA should verify each level's description reads naturally and doesn't give away the solution
- Verify the insight appears after solving a campaign level and NOT in challenge/sandbox modes
- Check that the insight animation doesn't conflict with star animations
