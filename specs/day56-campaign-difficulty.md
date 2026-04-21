# Day 56 Spec: Campaign Difficulty Modes (Relaxed vs Hardcore)

## Rationale
Expert review noted hint tokens are too generous AND difficulty cliff at Ch3→Ch4. Dual modes solve both: Relaxed for struggling players, Hardcore for challenge-seekers.

## Items
1. Mode selector on first launch: "📘 Relaxed" vs "⚡ Hardcore" with descriptions
2. Relaxed mode: unlimited hints (no token cost), encouraging failure messages
3. Relaxed mode: truth table permanently expanded, timer hidden
4. Hardcore mode: zero hints, par timer always visible, fail count tracked
5. Hardcore mode: star thresholds 20% tighter, no skip button
6. Both modes share same levels — only framing and support differ
7. Mode selection persisted in localStorage, changeable in settings
8. Hardcore completion badge (⬦) on level select cards
9. "Hardcore Completer" achievement for finishing all campaign in hardcore
10. Default suggestion based on placement test score (0-1: Relaxed, 3: Hardcore)

## Technical Design

### Storage
- `signal-circuit-difficulty-mode` localStorage key: `'relaxed'` | `'hardcore'` | null
- GameState property: `this.difficultyMode` ('relaxed' | 'hardcore' | 'standard')
- Default for existing players (no mode set): 'standard' (current behavior, no changes)

### Mode Behaviors

**Standard (default/existing):**
- Current hint token system
- Current star thresholds
- Timer hidden during campaign, shown on completion
- Skip button after 60s or all hints used

**Relaxed:**
- `spendHintToken()` always returns true (no token cost)
- Failure messages use encouraging language
- Truth table always expanded (no collapse toggle)
- Timer always hidden (even on completion)
- Skip button available immediately
- Hint button label: "💡 Hint (Free)"

**Hardcore:**
- Hint button hidden entirely
- Par timer always visible during gameplay
- Star thresholds: optimalGates stays same, goodGates tightened by 20%
- No skip button ever
- Fail counter shown in status bar
- Hardcore badge ⬦ shown on completed levels
- Separate tracking: `hardcoreCompleted` flag per level

### UI Changes
- First launch modal (before placement test, if no mode set)
- Settings row button: "📘 Relaxed | ⚡ Hardcore | 🔧 Standard"
- Level card: show ⬦ badge for hardcore completions

### Achievement
- `hardcore_completer`: Complete all campaign levels in hardcore mode
