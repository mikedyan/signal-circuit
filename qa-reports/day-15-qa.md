# Day 15 QA Report — Core Loop Tightening & Wire Polish

## Test Environment
- Browser: Chromium (openclaw profile)
- Server: python3 -m http.server 8765
- Date: 2026-03-11

## Tests Performed

### T1: Gate Count Indicator
| Test | Result |
|------|--------|
| Indicator visible on Level 1 | ✅ Shows "Gates: 0/1" |
| Updates on gate placement | ✅ Shows "Gates: 1/1 ★★★" |
| Projected stars correct (1 gate = 3 stars on L1) | ✅ Gold stars |
| Hidden in sandbox mode | ✅ Not visible |
| Shows in challenge mode without optimal | ✅ "Gates: 0" only |
| Shows in daily challenge without optimal | ✅ "Gates: 0" only |
| Updates on undo/redo | ✅ Count changes |
| Green border when optimal | ✅ |
| Resets on level load | ✅ |
| Resets on circuit clear | ✅ |

### T2: Bezier Curved Wires
| Test | Result |
|------|--------|
| Wires render as smooth curves | ✅ Natural S-curves |
| Wire shadow follows curve | ✅ |
| Active glow during simulation | ✅ Red glow on active wires |
| Signal pulse dots follow curve | ✅ Smooth animation |
| Hit-testing with 20 sample points | ✅ Clicks register correctly |
| Hover highlighting on curves | ✅ |
| Selected wire yellow highlight | ✅ |
| Complex circuit (4+ wires) | ✅ Tested on Level 7 XNOR |

### T3: Per-row Micro-celebrations
| Test | Result |
|------|--------|
| Pass rows get green flash | ✅ Animation fires |
| Fail rows get red shake | ✅ Shake animation visible |
| Animations quick (~300ms) | ✅ |
| Works on campaign levels | ✅ |
| Works on challenge mode | ✅ |
| No animation in sandbox | ✅ (sandbox always shows pass) |

### T4: Wire Color Coding
| Test | Result |
|------|--------|
| Unique colors from palette | ✅ Blue, orange-red, green, magenta visible |
| 10 colors in palette | ✅ |
| Colors persist for wire lifetime | ✅ |
| Simulation overrides to red/blue | ✅ |
| Non-simulating shows unique color | ✅ |
| Selected wire still yellow | ✅ |
| Colors reset on circuit clear | ✅ |

### Regression Tests
| Test | Result |
|------|--------|
| Level select screen loads | ✅ |
| All 3 chapters visible | ✅ |
| Progress bar shows 7/15, ⭐19 | ✅ |
| Level 1 completable with 3 stars | ✅ |
| Level 7 completable with 3 stars | ✅ |
| Celebration animation fires | ✅ |
| Challenge mode generates valid levels | ✅ |
| Daily challenge loads | ✅ |
| Sandbox mode works | ✅ |
| Audio engine (sounds heard on actions) | ✅ |
| Mute button works | ✅ |
| Timer runs during gameplay | ✅ |
| Hint button visible on hinted levels | ✅ |
| Console errors | ✅ Zero errors |

## Bugs Found
- None

## Notes
- Bezier wires are a significant visual upgrade — circuits look much more like real PCB traces
- Wire colors make complex circuits (4+ wires) much easier to trace visually
- Gate count indicator provides immediate optimization feedback, tightening the core loop
- Row animations add satisfying feedback during simulation without slowing it down
