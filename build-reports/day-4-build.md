# Day 4 Build Report — Challenge Mode

## Change Plan

### T1: Challenge Mode entry on level select
- Add challenge-mode section to `index.html` inside `#level-select-content`
- Add "Random Challenge" and "Sandbox" buttons
- Style in `css/style.css` with matching neon aesthetic
- Wire up clicks in `js/ui.js`

### T2: Procedural truth table generator
- Add `generateChallenge(numInputs, numOutputs)` to `js/levels.js`
- Generate all 2^N input combinations
- Randomly assign output columns, filtering degenerate cases
- Return a level-compatible object with positioned I/O nodes

### T3: Difficulty slider UI
- Add challenge config panel to `index.html` (hidden by default)
- Sliders for input count (2-4) and output count (1-2)
- Dynamic difficulty label
- "Generate" button calls generator and starts gameplay
- Wire everything in `js/ui.js`

### T4: Sandbox mode
- Add sandbox screen state
- All gates available, 2 inputs + 1 output, no target truth table
- "Test Circuit" button evaluates and shows actual behavior
- Gate count display
- No stars, no celebration

### T5: Scoring & leaderboard
- On challenge completion, show gate count as score
- Store top 10 per difficulty key in localStorage
- Render leaderboard table on challenge config panel
- Clear leaderboard button

## Files Modified
- `index.html` — new DOM sections for challenge config, sandbox
- `css/style.css` — challenge mode styling
- `js/levels.js` — procedural generator
- `js/ui.js` — challenge UI, difficulty panel, sandbox, leaderboard
- `js/main.js` — challenge/sandbox game state support
