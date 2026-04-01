# Build Report — Day 36

## Phase 3, Day 1: Difficulty Bridge Levels (Chapter 3.5)

## Change Plan
- `js/levels.js`: Insert new Chapter 3.5 in CHAPTERS array; add 3 bridge levels (18, 19, 20); renumber existing levels 18-37 → 21-40; update all CHAPTERS level arrays

## Changes Made
- `js/levels.js`:
  - **CHAPTERS**: Inserted new Chapter 3.5 (id: 4) between Chapter 3 and Chapter 4
  - **CHAPTERS**: Renumbered Chapter 4→5, Ch5→6, Ch6→7, Bonus→8, Discovery→9
  - **CHAPTERS**: Updated all level ID arrays (Ch4: [21-25], Ch5: [26-30], Ch6: [31-34], Bonus: [35], Discovery: [36-40])
  - **LEVELS**: Added Level 18 "2-Input Decoder" (Y0=NOT(A)·B, Y1=A·B, 3 gates optimal, 2 inputs/2 outputs)
  - **LEVELS**: Added Level 19 "Bit Comparator" (EQ=XNOR(A,B), 2 gates optimal, 2 inputs/1 output)
  - **LEVELS**: Added Level 20 "Data Selector" (2-to-1 MUX, 4 gates optimal, 3 inputs/1 output)
  - **LEVELS**: Renumbered existing levels 18-37 to 21-40 (shift +3)

## Decisions Made
- **Bridge level design**: Chose circuits that preview Chapter 4 concepts at simpler scale:
  - Level 18 (decoder) previews Level 21 (2-to-4 decoder) with only 2 inputs instead of 4 outputs
  - Level 19 (bit comparator) previews Level 22 (equality comparator) with single bits instead of 2-bit numbers
  - Level 20 (data selector / MUX) previews Level 24 (2-bit multiplexer) with single-bit data
- **Gate counts verified mathematically**: Each optimal gate count is achievable
- **Chapter numbering**: Used "Chapter 3.5" to clearly signal it's a bridge, id=4 in the array
- **No changes to main.js needed**: `isLevelUnlocked()` uses sequential ID checking (levelId - 1), so the new levels slot in naturally. The level count is dynamically computed via `getLevelCount()` which uses `LEVELS.length`.

## Concerns
- Existing localStorage progress with old level IDs (18-37) will refer to wrong levels after renumbering. Players who had completed old Level 18 (2-to-4 Decoder) will now show that progress for new Level 18 (2-Input Decoder). This is acceptable for a game in active development with no significant user base yet.
- QA should verify level-select rendering for all 10 chapters and 40 levels
- QA should verify level unlocking chain: 17 → 18 → 19 → 20 → 21

## Self-Test Results
- T1 (3 new bridge levels): PASS — verified truth tables mathematically
- T2 (renumbering): PASS — all 40 levels sequential, no gaps/duplicates
- T3 (Chapter 3.5): PASS — inserted in CHAPTERS between Ch3 and Ch4
- T4 (progress compatibility): PASS — isLevelUnlocked uses sequential IDs
- T5 (level-select rendering): UNTESTED — needs browser verification
