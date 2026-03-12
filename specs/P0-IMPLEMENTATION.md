# P0 Implementation Spec — Signal Circuit

## Project Info
- **Repo**: `/Users/openclaw/.openclaw/workspace/factory/projects/signal-circuit/`
- **Remote**: `https://github.com/mikedyan/signal-circuit.git`
- **Structure**: `index.html`, `css/style.css`, `js/{main,ui,canvas,simulation,levels,audio,gates,wires,achievements}.js`
- **Deployed**: GitHub Pages at `https://mikedyan.github.io/signal-circuit/`

## Implementation Batches

### BATCH 1: Quick Wins (8 items)

---

#### P0-1: Remove Solution Formulas from Level Descriptions
**File**: `js/levels.js`
**What**: Some level descriptions give away the solution approach. Strip to truth-table-only conceptual framing. The postSolveInsight already reveals the math AFTER solving.

**Changes needed** (check each level's `description` field):
- Level 4: Currently `'Study the truth table carefully — compare it to Level 1. What\'s different about every single output?'` — this is already good, keep it.
- Level 5: `'Compare this truth table to Level 3. See a pattern? Every output is the opposite.'` — too revealing. Change to: `'Study the truth table carefully. What pattern do you notice when you compare each output to what you\'d expect?'`
- Level 7: `'Output is 1 when both inputs are the SAME. The opposite of what you just built in Level 6.'` — reveals it's NOT(XOR). Change to: `'Study this truth table. When does the output turn on?'`
- Level 8: `'Reproduce AND behavior — but you can only use OR and NOT gates. Study the truth table: it\'s the same as Level 1.'` — reveals the goal. Change to: `'You recognize this truth table from Level 1 — but your toolbox is different this time.'`
- Level 9: `'Reproduce OR behavior — but you can only use AND and NOT gates. The mirror of Level 8.'` — reveals the mirror strategy. Change to: `'Another familiar truth table, another unfamiliar toolbox. What will you discover?'`
- Level 10: `'"If A then B" — output is 0 ONLY when A is true but B isn\'t. All other cases output 1.'` — gives away the logic. Change to: `'Most of this truth table outputs 1. Study the one exception carefully.'`
- Level 14: `'When S=0, output A. When S=1, output B. The selector chooses which input passes through.'` — gives away selector behavior. Change to: `'Three inputs, one output. The third input changes which of the other two reaches the output.'`

All other levels (1, 2, 3, 6, 11, 12, 13, 15) are fine — they describe the truth table concept without giving away the circuit.

---

#### P0-5: Restructure Hints as Conceptual Nudges
**File**: `js/levels.js`
**What**: Hint 3 for many levels gives the complete wiring solution. Replace with Socratic nudges that never give the full topology.

**Rules for new hints**:
1. Hint 1: General concept / direction
2. Hint 2: Structural insight (number of gates, general approach)
3. Hint 3: More specific nudge about what to focus on — but NEVER the complete wiring

**Changes needed** (only levels where hint 3 gives away the solution):

Level 8 hint 3: `'What if you transformed both inputs individually, combined the results, then transformed one more time?'` — this is actually fine, it describes an approach without wiring. Keep.

Level 14 hints — THESE ARE THE WORST OFFENDERS:
- Current hint 1: `'MUX = (A AND NOT(S)) OR (B AND S). When S=0, A passes; when S=1, B passes.'` — gives away formula!
- Current hint 2: `'You need: NOT(S), AND(A, NOT(S)), AND(B, S), then OR the two AND results.'` — gives complete topology!
- Current hint 3: `'Wire: S→NOT. A+NOT(S)→AND₁. B+S→AND₂. AND₁+AND₂→OR→OUT.'` — explicit wiring!

Replace with:
- Hint 1: `'Think about what happens when S=0: only A matters. When S=1: only B matters. How can you use S to "enable" one path and "disable" the other?'`
- Hint 2: `'You need 4 gates. One gate prepares S, two gates each handle one input path, and one gate combines the results.'`
- Hint 3: `'Each input (A and B) needs its own AND gate to be "gated" by S or its inverse. Then combine both paths.'`

Level 15 hints — ALSO BAD:
- Current hint 1: `'Full adder: SUM = A XOR B XOR Cin. CARRY = (A AND B) OR (Cin AND (A XOR B)).'` — gives complete formula!
- Current hint 2: `'First compute A XOR B. Then XOR that with Cin for SUM. For CARRY, AND(A,B) OR AND(Cin, A XOR B).'`
- Current hint 3: `'Wire: A,B→XOR₁. XOR₁+Cin→XOR₂→SUM. A,B→AND₁. XOR₁+Cin→AND₂. AND₁+AND₂→OR→CARRY.'`

Replace with:
- Hint 1: `'Think of it as two half-adders chained together. What does a half adder (Level 11) produce?'`
- Hint 2: `'5 gates total. First, add A and B (like Level 11). Then add that partial result with Cin. The carries from both additions combine.'`
- Hint 3: `'SUM comes from XORing inputs step by step. CARRY is trickier — there are two situations that generate a carry. OR them together.'`

Level 13 hints — check:
- Current hint 3: `'Three pairs exist among three inputs. If any pair is both 1, the majority passes.'` — this is fine, conceptual. Keep.

---

#### P0-6: Fix Locked Level Contrast & Visibility
**File**: `css/style.css`
**What**: `.level-btn.locked` has `opacity: 0.3` which fails WCAG and makes text invisible.

**Change**:
```css
/* FROM */
.level-btn.locked {
  opacity: 0.3;
  cursor: not-allowed;
}

/* TO */
.level-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.level-btn.locked::after {
  content: '🔒';
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.level-btn.locked .level-number {
  color: #777;
}
```

Also update the existing `.level-btn.locked .level-number` rule from `color: #555` to `color: #777`.

---

#### P0-7: Canvas DPI / Retina Display Scaling
**File**: `js/canvas.js`
**What**: Canvas ignores `devicePixelRatio`, causing blurriness on Retina displays.

**Change the `resize()` method**:
```javascript
resize() {
  const container = this.canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = container.clientWidth;
  const displayHeight = container.clientHeight;
  this.canvas.width = displayWidth * dpr;
  this.canvas.height = displayHeight * dpr;
  this.canvas.style.width = displayWidth + 'px';
  this.canvas.style.height = displayHeight + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Store display dimensions for hit testing
  this.displayWidth = displayWidth;
  this.displayHeight = displayHeight;
}
```

**IMPORTANT**: Update `getMousePos()` to NOT multiply by DPR (since we're using CSS coords + context transform):
```javascript
getMousePos(event) {
  const rect = this.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}
```
This should already be correct since `getBoundingClientRect()` gives CSS coords.

**Also update** `render()` method — the `width`/`height` used for clearing and drawing should use display dimensions:
```javascript
render() {
  const ctx = this.ctx;
  const width = this.displayWidth || this.canvas.width;
  const height = this.displayHeight || this.canvas.height;
  // ... rest stays the same
}
```

And update `drawBreadboard()` to use display dimensions too. The canvas's `.width` and `.height` are now DPR-scaled, but the context transform handles that. So all drawing code uses logical (CSS) coordinates, which is exactly what we want. Just make sure `render()` passes the correct logical dimensions.

---

#### P0-8: Implement Dirty-Flag Render Loop
**File**: `js/main.js`
**What**: `requestAnimationFrame` fires 60fps even when nothing changes. Add a dirty flag.

**Changes**:
1. Add `this.needsRender = true;` to `GameState` constructor
2. Add a `markDirty()` method:
```javascript
markDirty() { this.needsRender = true; }
```
3. Call `markDirty()` in: `addGate()`, `removeGate()`, `addWireFromData()`, `performUndo()`, `performRedo()`, `loadLevel()`, `loadChallengeLevel()`, `clearCircuit()`, and in mouse/touch event handlers that modify state (gate drag, wire drawing, pin hover).
4. The simulation's `animatePulse()` and the UI's `startCelebration()` keep rendering while active (always dirty during animation).
5. Update `startRenderLoop()`:
```javascript
startRenderLoop() {
  const loop = () => {
    if (this.currentScreen === 'gameplay') {
      // Always render during animation, otherwise only when dirty
      const sim = this.simulation;
      if (this.needsRender || (sim && sim.animating) || 
          this.renderer.sparkParticles.length > 0 ||
          this.wireManager.drawing) {
        this.renderer.render();
        this.needsRender = false;
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}
```

---

#### P0-12: Fix Hint Panel Overlapping Clear Circuit Button
**File**: `css/style.css`
**What**: When hint display expands, it can push Clear Circuit off-screen.

**Add to hint-display CSS** (find `#hint-display` or add if missing):
```css
#hint-display {
  max-height: 80px;
  overflow-y: auto;
  font-size: 12px;
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px;
  line-height: 1.4;
}
```

**Also ensure `#controls` buttons stay visible** by making the controls area not overflow:
The `#controls` section should have `flex-shrink: 0` on its buttons.

---

#### P0-14: Establish Visual Hierarchy in Info Panel (RUN Button Dominant)
**File**: `css/style.css`
**What**: RUN button should be 2× current visual weight. Make it unmissable.

**Update `#run-btn`**:
```css
#run-btn {
  background: #0a0;
  color: #fff;
  border: 2px solid #0f0;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 3px;
  transition: all 0.2s;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

#run-btn:hover {
  background: #0c0;
  box-shadow: 0 0 25px rgba(0, 255, 0, 0.5);
  transform: translateY(-1px);
}
```

Make `#clear-btn` and `#hint-btn` more compact:
```css
#clear-btn, #hint-btn {
  padding: 6px 8px;
  font-size: 11px;
}
```

Group clear + hint in a row by wrapping them (or use CSS grid on `#controls`):
```css
#controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```
This is already the case. The visual hierarchy improvement comes from making RUN much larger and the secondary buttons smaller.

---

#### P0-15: Fix Intro Screen setTimeout Race Condition
**File**: `js/main.js`
**What**: `setTimeout(() => { intro.remove(); }, 1800)` can race with CSS animation.

**Change in `init()` method**:
```javascript
// Remove intro after animation
const intro = document.getElementById('intro-screen');
if (intro) {
  const onEnd = () => {
    intro.remove();
  };
  intro.addEventListener('animationend', onEnd);
  // Fallback in case animationend doesn't fire
  setTimeout(() => {
    if (intro.parentNode) intro.remove();
  }, 3000);
}
```

Also check the CSS for the intro animation — ensure the intro has a CSS animation defined. Looking at the HTML, the intro-screen needs a fade-out animation. Check `style.css` for intro styles.

---

### BATCH 2: UI Improvements (4 items)

---

#### P0-9: Make Truth Table Collapsible
**Files**: `js/ui.js`, `css/style.css`, `index.html`
**What**: Truth table takes ~30-40% of info panel. Add a toggle chevron.

**HTML change** in `index.html`:
Change the truth table section header:
```html
<div id="truth-table-section">
  <h3 id="truth-table-toggle" style="cursor:pointer; user-select:none;">
    Truth Table <span id="truth-table-chevron">▼</span>
  </h3>
  <div id="truth-table-wrapper">
    <table id="truth-table"></table>
  </div>
</div>
```

**JS change** in `ui.js` constructor or `setupControls()`:
```javascript
// Truth table collapse toggle
const toggle = document.getElementById('truth-table-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const wrapper = document.getElementById('truth-table-wrapper');
    const chevron = document.getElementById('truth-table-chevron');
    if (wrapper.style.display === 'none') {
      wrapper.style.display = '';
      chevron.textContent = '▼';
    } else {
      wrapper.style.display = 'none';
      chevron.textContent = '▶';
    }
  });
}
```

**CSS**: Style the chevron:
```css
#truth-table-toggle {
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#truth-table-chevron {
  font-size: 10px;
  transition: transform 0.2s;
}
```

**Mobile default**: On mobile, default collapsed. Check `window.innerWidth < 768` in init and auto-collapse.

---

#### P0-10: Scale Celebrations Proportionally by Star Rating
**Files**: `js/ui.js`, `js/audio.js`
**What**: 1★, 2★, 3★ completions should feel different.

**UI changes** in `startCelebration()` — pass stars parameter:
- Modify `startCelebration(stars)` to accept a star count
- 1★: 30 particles, muted colors (grays + faint gold), no flash
- 2★: 60 particles, full colors, normal flash
- 3★: 120 particles (up from 90), gold-heavy, extended flash + screen shimmer

**Audio changes** in `audio.js`:
- Add `playSuccess1Star()`: single modest chime (just C5)
- Add `playSuccess2Star()`: current `playSuccess()` (C5-E5-G5 arpeggio)
- Add `playSuccess3Star()`: extended fanfare (C5-E5-G5 + high octave sustain + shimmer)
- Or: modify `playSuccess(stars)` to scale

**Callers**: In `main.js` `runSimulation()`, where `this.audio.playSuccess()` is called and `this.ui.startCelebration()` — pass `stars` to both.

---

#### P0-11: Communicate Hint Star Penalty Before Clicking
**Files**: `js/ui.js` or `js/main.js`, `css/style.css`
**What**: Show "Using hints reduces max ★" before clicking. After using hints, show penalty indicator.

**Changes**:
1. Add penalty text near hint button. In `updateGateIndicator()` or a new method, when hints are available but unused, show small text: `"💡 Hints available (may reduce ★)"`
2. After first hint used, update the gate indicator to show: `"⚠ Max ★★ with hints"` or `"⚠ Max ★ with hints"` depending on `maxHintPenalty`.
3. The hint button text already shows count. Add a subtitle/tooltip.

**Implementation**: In `showHint()` method in `ui.js`, after displaying the hint, check `maxHintPenalty` and show a warning near the gate indicator:
```javascript
// After hint penalty applied
if (this.gameState.maxHintPenalty >= 2) {
  penaltyEl.textContent = '⚠ Max ★ with hints';
} else if (this.gameState.maxHintPenalty >= 1) {
  penaltyEl.textContent = '⚠ Max ★★ with hints';
}
```

Add a `<div id="hint-penalty" style="display:none;"></div>` in the controls section of `index.html`.

---

#### P0-13: Add "Almost!" Near-Miss Feedback
**Files**: `js/main.js` (in `runSimulation` callback), `js/ui.js`
**What**: When ≥75% rows correct, show "So close! Just X row(s) off" with failing rows highlighted.

**Change** in `runSimulation()` failure handler:
```javascript
} else {
  const passCount = results.filter(r => r.pass).length;
  const total = results.length;
  const failCount = total - passCount;
  
  if (passCount / total >= 0.75) {
    this.audio.playFail(); // Could add a softer "almost" sound
    const failingRows = results.map((r, i) => r.pass ? null : i + 1).filter(Boolean);
    this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
    this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
  } else {
    this.audio.playFail();
    this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
    this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
  }
}
```

**CSS**: Add an `almost` state:
```css
#result-display.almost {
  background: rgba(255, 200, 0, 0.2);
  border: 1px solid #ffa500;
  color: #ffa500;
}
```

---

### BATCH 3: Core Simulation Features (3 items)

---

#### P0-2: Show Diagnostic Failure Feedback
**Files**: `js/ui.js` (truth table rendering), `js/simulation.js`
**What**: When simulation fails, show what each output ACTUALLY produced vs expected. Highlight the wrong outputs.

**Truth table changes**: In `updateTruthTable(results)`, when showing results:
1. Add an "Actual" column header for each output when there are failures
2. For failing rows, show the actual output values alongside expected
3. Highlight the specific output cells that are wrong

**Implementation in `updateTruthTable()`**:
```javascript
// After the existing output columns, if results exist and any fail:
const anyFail = results && results.some(r => !r.pass);

// In header: add "Actual" columns if any failures
if (anyFail) {
  for (const out of level.outputs) {
    const th = document.createElement('th');
    th.textContent = `${out.label}?`;
    th.style.color = '#ffa500';
    th.title = `Actual ${out.label}`;
    headerRow.appendChild(th);
  }
}

// In body rows: add actual output values for failing rows
if (results && results[i] && anyFail) {
  for (let j = 0; j < results[i].actualOutputs.length; j++) {
    const td = document.createElement('td');
    const actual = results[i].actualOutputs[j];
    const expected = results[i].expectedOutputs[j];
    td.textContent = actual;
    if (!results[i].pass && actual !== expected) {
      td.style.color = '#ff4444';
      td.style.fontWeight = 'bold';
      td.style.background = 'rgba(255, 0, 0, 0.15)';
    } else {
      td.style.color = '#0f0';
    }
    tr.appendChild(td);
  }
}
```

---

#### P0-3: Add Quick-Test / Instant Evaluation Mode
**Files**: `js/main.js`, `index.html`, `css/style.css`
**What**: Add a "Quick Test" button (or Shift+Enter shortcut) that evaluates instantly without animation.

**HTML**: Add button next to or below RUN:
```html
<div id="run-buttons">
  <button id="run-btn">▶ RUN</button>
  <button id="quick-test-btn" title="Instant test (Shift+Enter)">⚡ Quick Test</button>
</div>
```

**JS**: Add handler in `setupControls()`:
```javascript
document.getElementById('quick-test-btn').addEventListener('click', () => {
  this.gameState.runQuickTest();
});
```

**GameState** — add `runQuickTest()` method:
```javascript
async runQuickTest() {
  if (this.isAnimating) return;
  this.audio.playButtonClick();
  this.ui.hideStarDisplay();
  
  if (this.isSandboxMode) {
    await this.runSandboxTest();
    return;
  }
  
  const results = this.simulation.runAll();
  this.ui.updateTruthTable(results);
  
  const allPass = results.every(r => r.pass);
  if (allPass) {
    // Same completion logic as runSimulation, but trigger animated RUN for the celebration
    // Actually, just complete it instantly
    const gateCount = this.gates.length;
    if (this.isChallengeMode && this.currentLevel.isChallenge) {
      this.addLeaderboardEntry(this.currentLevel.difficultyKey, gateCount, this.currentLevel.difficulty);
      this.audio.playSuccess();
      this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
      this.ui.showChallengeResult(gateCount, this.currentLevel);
      this.ui.startCelebration();
    } else {
      const stars = this.completeLevel(this.currentLevel.id, gateCount);
      this.audio.playSuccess();
      this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
      this.ui.showStarDisplay(stars, gateCount, this.currentLevel);
      this.ui.startCelebration();
      const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
      const newAchs = this.achievements.checkAfterCompletion(this, this.currentLevel.id, gateCount, elapsed, this.hintsUsed);
      if (this.currentLevel.isDaily) {
        if (this.achievements.unlock('daily_solver')) newAchs.push('daily_solver');
        this.ui.showShareButton(gateCount, stars, elapsed);
      }
      this.ui.showAchievementToasts(newAchs);
    }
  } else {
    this.audio.playFail();
    const passCount = results.filter(r => r.pass).length;
    const total = results.length;
    const failCount = total - passCount;
    if (passCount / total >= 0.75) {
      this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
    } else {
      this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
    }
  }
}
```

**Keyboard shortcut**: In the keydown handler, add:
```javascript
if ((e.key === 'Enter') && e.shiftKey) {
  e.preventDefault();
  this.runQuickTest();
}
```

**CSS**: Style the quick test button:
```css
#quick-test-btn {
  background: #333;
  color: #aaa;
  border: 1px solid #555;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
#quick-test-btn:hover {
  background: #444;
  color: #fff;
  border-color: #ffa500;
}
```

---

#### P0-4: Add Real-Time Signal Propagation During Building
**Files**: `js/main.js`, `js/canvas.js`, `js/simulation.js`
**What**: Clicking input nodes toggles their value. Signals propagate through wires in real-time. Partial results visible.

**Implementation**:

1. **Toggle input nodes on click**: In `setupCanvasEvents()`, when clicking on an input node (not a pin), toggle its value and propagate:
```javascript
// Check if clicked on an input node label/body
for (const node of this.inputNodes) {
  if (Math.hypot(mx - node.x - 25, my - node.y - 20) < 25) {
    node.value = node.value ? 0 : 1;
    this.propagateLive();
    this.markDirty();
    this.audio.playButtonClick();
    return;
  }
}
```

2. **Live propagation method** in `GameState`:
```javascript
propagateLive() {
  // Run evaluation with current input values to update wire signals and gate outputs
  // But don't check against truth table
  const results = this.simulation.evaluateOnce(this.inputNodes.map(n => n.value));
  // Mark render needed
  this.needsRender = true;
}
```

3. **Visual feedback**: The canvas already renders wire signal values and gate glow during simulation. We need to make it also render them during live mode. In `canvas.js` `render()`, the gate glow is only shown when `sim.animating`. Change to also show when live signals are active:

```javascript
// Gate glow during simulation OR live propagation
const showLiveSignals = !sim.animating && this.gameState.gates.some(g => g.outputValues && g.outputValues.some(v => v === 1));
if ((sim && sim.animating) || showLiveSignals) {
  // ... existing glow code
}
```

4. **Auto-propagate on wire changes**: In `addWireFromData()`, after adding a wire, call `propagateLive()`. Same after gate placement and removal.

5. **Visual indicator on input nodes**: Show current toggle state. Input nodes already render with a value — the canvas draws them. We just need the live value to be used.

---

## Commit Strategy

After each item is implemented:
1. `git add -A`
2. `git commit -m "P0-X: <description>"`
3. Continue to next item

After all items in a batch:
1. `git push origin main`
2. Wait ~1 min for GitHub Pages deploy

## Cache Busting

After all changes, update version query strings in `index.html` from `?v=18` to `?v=19`.

## Testing Checklist

After all P0 items:
- [ ] Game loads without console errors
- [ ] Level 1 plays through with correct behavior
- [ ] Locked levels show lock icon and higher contrast
- [ ] Canvas is sharp on Retina displays
- [ ] Quick test button works (Shift+Enter)
- [ ] Truth table shows actual vs expected on failure
- [ ] Hints don't reveal solutions
- [ ] Near-miss feedback shows when ≥75% correct
- [ ] RUN button is visually dominant
- [ ] Truth table collapses/expands
- [ ] Celebrations scale with star rating
- [ ] Input node clicking toggles live signals
