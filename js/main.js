// main.js — App initialization, game state, undo/redo, progress

const STORAGE_KEY = 'signal-circuit-progress';
const LEADERBOARD_KEY = 'signal-circuit-leaderboard';

class UndoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = 50;
  }

  push(action) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return null;
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    return action;
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    return action;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

class GameState {
  constructor() {
    this.gates = [];
    this.inputNodes = [];
    this.outputNodes = [];
    this.nextId = 1000;
    this.currentLevel = null;
    this.selectedGate = null;
    this.wireManager = new WireManager(this);
    this.simulation = new Simulation(this);
    this.undoManager = new UndoManager();
    this.renderer = null;
    this.ui = null;
    this.isAnimating = false;
    this.currentScreen = 'level-select';
    this.progress = this.loadProgress();
    this.leaderboard = this.loadLeaderboard();
    this.isSandboxMode = false;
    this.isChallengeMode = false;
    this.audio = new AudioEngine();
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(canvas, this);
    this.ui = new UI(this);

    this.setupCanvasEvents(canvas);
    this.setupMuteButton();
    this.ui.showScreen('level-select');
  }

  setupMuteButton() {
    const btn = document.getElementById('mute-btn');
    if (!btn) return;
    // Set initial state
    if (this.audio.isMuted) {
      btn.textContent = '🔇';
      btn.classList.add('muted');
    }
    btn.addEventListener('click', () => {
      const newMuted = !this.audio.isMuted;
      this.audio.setMute(newMuted);
      btn.textContent = newMuted ? '🔇' : '🔊';
      btn.classList.toggle('muted', newMuted);
      if (!newMuted) this.audio.playButtonClick();
    });
  }

  // ── Progress Persistence ──
  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return { levels: {} };
  }

  saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {}
  }

  resetProgress() {
    this.progress = { levels: {} };
    this.saveProgress();
  }

  // ── Leaderboard Persistence ──
  loadLeaderboard() {
    try {
      const saved = localStorage.getItem(LEADERBOARD_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  saveLeaderboard() {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {}
  }

  getLeaderboard(difficultyKey) {
    return (this.leaderboard[difficultyKey] || []).slice(0, 10);
  }

  addLeaderboardEntry(difficultyKey, gates, difficulty) {
    if (!this.leaderboard[difficultyKey]) {
      this.leaderboard[difficultyKey] = [];
    }
    this.leaderboard[difficultyKey].push({
      gates,
      difficulty,
      timestamp: Date.now(),
    });
    // Sort by gate count ascending, keep top 10
    this.leaderboard[difficultyKey].sort((a, b) => a.gates - b.gates);
    this.leaderboard[difficultyKey] = this.leaderboard[difficultyKey].slice(0, 10);
    this.saveLeaderboard();
  }

  clearLeaderboard() {
    this.leaderboard = {};
    this.saveLeaderboard();
  }

  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    const prev = this.progress.levels[levelId - 1];
    return prev && prev.completed;
  }

  calculateStars(gateCount, level) {
    if (gateCount <= level.optimalGates) return 3;
    if (gateCount <= level.goodGates) return 2;
    return 1;
  }

  completeLevel(levelId, gateCount) {
    const level = getLevel(levelId);
    if (!level) return;

    const stars = this.calculateStars(gateCount, level);
    const existing = this.progress.levels[levelId];

    if (!existing || stars > existing.stars) {
      this.progress.levels[levelId] = {
        completed: true,
        stars: stars,
        bestGateCount: existing ? Math.min(existing.bestGateCount || gateCount, gateCount) : gateCount,
      };
    } else if (existing && gateCount < existing.bestGateCount) {
      existing.bestGateCount = gateCount;
    }

    this.saveProgress();
    return stars;
  }

  // ── Screen Management ──
  showLevelSelect() {
    this.currentScreen = 'level-select';
    this.isSandboxMode = false;
    this.isChallengeMode = false;
    this.ui.renderLevelSelect();
    this.ui.showScreen('level-select');
    this.isAnimating = false;
  }

  showChallengeConfig() {
    this.currentScreen = 'challenge-config';
    this.ui.showScreen('challenge-config');
    // Trigger initial leaderboard render
    const ni = parseInt(document.getElementById('input-count-slider').value);
    const no = parseInt(document.getElementById('output-count-slider').value);
    this.ui.renderLeaderboard(ni, no);
  }

  startChallenge(numInputs, numOutputs) {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    const level = generateChallenge(numInputs, numOutputs);
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.renderer.resize();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startSandbox() {
    this.isSandboxMode = true;
    this.isChallengeMode = false;
    const level = generateSandboxLevel();
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.renderer.resize();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startLevel(levelId) {
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');

    // Must resize canvas BEFORE loading level so positions scale correctly
    this.renderer.resize();
    this.loadLevel(levelId);

    // Second resize after layout settles
    setTimeout(() => {
      const oldW = this.renderer.canvas.width;
      const oldH = this.renderer.canvas.height;
      this.renderer.resize();
      // If size changed after layout settle, reload level positions
      if (this.renderer.canvas.width !== oldW || this.renderer.canvas.height !== oldH) {
        this.loadLevel(levelId);
      }
    }, 100);
  }

  // ── Game State ──
  findNode(id) {
    const gate = this.gates.find(g => g.id === id);
    if (gate) return gate;
    const inp = this.inputNodes.find(n => n.id === id);
    if (inp) return inp;
    const out = this.outputNodes.find(n => n.id === id);
    if (out) return out;
    return null;
  }

  addGate(type, x, y, skipUndo) {
    const gate = new Gate(type, x, y, this.nextId++);
    this.gates.push(gate);
    this.ui.updateStatusBar(`Placed ${type} gate`);
    this.audio.playClick();
    if (!skipUndo) {
      this.undoManager.push({
        type: 'addGate',
        gateId: gate.id,
        gateType: type,
        x, y,
      });
    }
    return gate;
  }

  removeGate(gate, skipUndo) {
    const removedWires = this.wireManager.wires.filter(
      w => w.fromGateId === gate.id || w.toGateId === gate.id
    ).map(w => ({ ...w }));

    this.wireManager.removeWiresForGate(gate.id);
    this.gates = this.gates.filter(g => g.id !== gate.id);
    if (this.selectedGate === gate) this.selectedGate = null;
    this.ui.updateStatusBar(`Removed ${gate.type} gate`);
    this.audio.playWireDisconnect();

    if (!skipUndo) {
      this.undoManager.push({
        type: 'removeGate',
        gateId: gate.id,
        gateType: gate.type,
        x: gate.x,
        y: gate.y,
        removedWires,
      });
    }
  }

  addWireFromData(fromGateId, fromPinIndex, toGateId, toPinIndex) {
    const wire = new Wire(fromGateId, fromPinIndex, toGateId, toPinIndex, this.wireManager.nextId++);
    this.wireManager.wires.push(wire);
    return wire;
  }

  performUndo() {
    const action = this.undoManager.undo();
    if (!action) return;

    switch (action.type) {
      case 'addGate': {
        const gate = this.gates.find(g => g.id === action.gateId);
        if (gate) this.removeGate(gate, true);
        break;
      }
      case 'removeGate': {
        const gate = new Gate(action.gateType, action.x, action.y, action.gateId);
        this.gates.push(gate);
        for (const wd of action.removedWires) {
          this.addWireFromData(wd.fromGateId, wd.fromPinIndex, wd.toGateId, wd.toPinIndex);
        }
        break;
      }
      case 'addWire': {
        const wire = this.wireManager.wires.find(w => w.id === action.wireId);
        if (wire) this.wireManager.removeWire(wire);
        break;
      }
      case 'removeWire': {
        this.addWireFromData(action.fromGateId, action.fromPinIndex, action.toGateId, action.toPinIndex);
        break;
      }
    }
    this.ui.updateStatusBar('Undo');
  }

  performRedo() {
    const action = this.undoManager.redo();
    if (!action) return;

    switch (action.type) {
      case 'addGate': {
        const gate = new Gate(action.gateType, action.x, action.y, action.gateId);
        this.gates.push(gate);
        break;
      }
      case 'removeGate': {
        const gate = this.gates.find(g => g.id === action.gateId);
        if (gate) this.removeGate(gate, true);
        break;
      }
      case 'addWire': {
        this.addWireFromData(action.fromGateId, action.fromPinIndex, action.toGateId, action.toPinIndex);
        break;
      }
      case 'removeWire': {
        const wire = this.wireManager.wires.find(
          w => w.fromGateId === action.fromGateId && w.fromPinIndex === action.fromPinIndex &&
               w.toGateId === action.toGateId && w.toPinIndex === action.toPinIndex
        );
        if (wire) this.wireManager.removeWire(wire);
        break;
      }
    }
    this.ui.updateStatusBar('Redo');
  }

  // Scale level positions to fit the actual canvas
  _scalePosition(x, y) {
    if (!this.renderer) return { x, y };
    const canvas = this.renderer.canvas;
    const cw = canvas.width || 800;
    const ch = canvas.height || 500;
    // Levels are designed for ~700x400 usable area
    const refW = 700;
    const refH = 400;
    const sx = cw / refW;
    const sy = ch / refH;
    const scale = Math.min(sx, sy);
    const offsetX = (cw - refW * scale) / 2;
    const offsetY = (ch - refH * scale) / 2;
    return {
      x: Math.round(x * scale + offsetX),
      y: Math.round(y * scale + offsetY),
    };
  }

  loadLevel(id) {
    const level = getLevel(id);
    if (!level) return;

    this.currentLevel = level;
    this.gates = [];
    this.inputNodes = [];
    this.outputNodes = [];
    this.wireManager.clear();
    this.selectedGate = null;
    this.undoManager.clear();
    this.isAnimating = false;

    for (const inp of level.inputs) {
      const pos = this._scalePosition(inp.x, inp.y);
      const node = new IONode('input', inp.label, pos.x, pos.y, this.nextId++);
      this.inputNodes.push(node);
    }

    for (const out of level.outputs) {
      const pos = this._scalePosition(out.x, out.y);
      const node = new IONode('output', out.label, pos.x, pos.y, this.nextId++);
      this.outputNodes.push(node);
    }

    this.ui.updateLevelInfo();
    this.ui.updateToolbox();
    this.ui.updateTruthTable(null);
    this.ui.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    this.ui.hideStarDisplay();
    this.ui.updateStatusBar(`Level ${level.id}: ${level.title}`);

    // Show onboarding tooltip on Level 1
    if (level.id === 1) {
      this.ui.showOnboarding();
    }
  }

  loadChallengeLevel(level) {
    this.currentLevel = level;
    this.gates = [];
    this.inputNodes = [];
    this.outputNodes = [];
    this.wireManager.clear();
    this.selectedGate = null;
    this.undoManager.clear();
    this.isAnimating = false;

    for (const inp of level.inputs) {
      const pos = this._scalePosition(inp.x, inp.y);
      const node = new IONode('input', inp.label, pos.x, pos.y, this.nextId++);
      this.inputNodes.push(node);
    }

    for (const out of level.outputs) {
      const pos = this._scalePosition(out.x, out.y);
      const node = new IONode('output', out.label, pos.x, pos.y, this.nextId++);
      this.outputNodes.push(node);
    }

    this.ui.updateLevelInfo();
    this.ui.updateToolbox();

    if (level.isSandbox) {
      this.ui.updateTruthTable(null);
      this.ui.updateResultDisplay('idle', 'Free build — test your circuit anytime');
    } else {
      this.ui.updateTruthTable(null);
      this.ui.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    }
    this.ui.hideStarDisplay();
    this.ui.updateStatusBar(level.isSandbox ? 'Sandbox Mode' : `Challenge: ${level.title}`);
  }

  clearCircuit() {
    this.gates = [];
    this.wireManager.clear();
    this.selectedGate = null;
    this.undoManager.clear();

    for (const node of this.inputNodes) node.value = 0;
    for (const node of this.outputNodes) node.value = 0;

    this.ui.updateTruthTable(null);
  }

  async runSimulation() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.audio.playButtonClick();
    this.ui.updateResultDisplay('idle', 'Simulating...');
    this.ui.hideStarDisplay();

    // Sandbox mode: just evaluate and show actual truth table
    if (this.isSandboxMode) {
      await this.runSandboxTest();
      return;
    }

    await this.simulation.runAnimated(
      (results, rowIndex) => {
        this.audio.playSimPulse();
        this.ui.updateTruthTable(results);
      },
      (results) => {
        const allPass = results.every(r => r.pass);
        this.ui.updateTruthTable(results);

        if (allPass) {
          const gateCount = this.gates.length;

          if (this.isChallengeMode && this.currentLevel.isChallenge) {
            // Challenge mode completion
            this.addLeaderboardEntry(
              this.currentLevel.difficultyKey,
              gateCount,
              this.currentLevel.difficulty
            );
            this.audio.playSuccess();
            this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
            this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
            this.ui.showChallengeResult(gateCount, this.currentLevel);
            this.ui.startCelebration();
          } else {
            const stars = this.completeLevel(this.currentLevel.id, gateCount);
            this.audio.playSuccess();
            this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
            this.ui.updateStatusBar('Level complete! All truth table rows match.');
            this.ui.showStarDisplay(stars, gateCount, this.currentLevel);
            this.ui.startCelebration();
          }
        } else {
          this.audio.playFail();
          const passCount = results.filter(r => r.pass).length;
          this.ui.updateResultDisplay('fail', `✗ ${passCount}/${results.length} rows correct`);
          this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
        }

        this.isAnimating = false;
      }
    );
  }

  async runSandboxTest() {
    // In sandbox, evaluate for all input combos and display actual behavior
    const numInputs = this.inputNodes.length;
    const numRows = Math.pow(2, numInputs);
    const results = [];

    for (let r = 0; r < numRows; r++) {
      const inputs = [];
      for (let i = numInputs - 1; i >= 0; i--) {
        inputs.push((r >> i) & 1);
      }
      const outputs = this.simulation.evaluateOnce(inputs);
      results.push({
        inputs,
        expectedOutputs: outputs,
        actualOutputs: outputs,
        pass: true, // Always "pass" in sandbox — just showing actual behavior
      });
    }

    // Build sandbox truth table
    this.ui.updateSandboxTruthTable(results);
    this.ui.updateResultDisplay('pass', `Circuit tested — ${this.gates.length} gates`);
    this.ui.updateStatusBar('Sandbox: circuit evaluated');
    this.isAnimating = false;
  }

  setupCanvasEvents(canvas) {
    let isDraggingGate = false;
    let dragGate = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // ── Touch support ──
    let longPressTimer = null;
    let touchMoved = false;

    const getTouchPos = (touch) => {
      const rect = canvas.getBoundingClientRect();
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isAnimating) return;
      const touch = e.touches[0];
      const pos = getTouchPos(touch);
      touchMoved = false;

      // Long-press timer for deletion
      longPressTimer = setTimeout(() => {
        if (touchMoved) return;
        // Delete gate or wire under finger
        const wire = this.wireManager.findWireAt(pos.x, pos.y);
        if (wire) {
          this.audio.playWireDisconnect();
          this.undoManager.push({ type: 'removeWire', fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
          this.wireManager.removeWire(wire);
          longPressTimer = null;
          return;
        }
        const gate = this.renderer.findGateAt(pos.x, pos.y);
        if (gate) {
          this.removeGate(gate);
          longPressTimer = null;
          return;
        }
      }, 500);

      // Pin tap for wire drawing
      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this.audio.playWireConnect();
            this.undoManager.push({ type: 'addWire', wireId: wire.id, fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
          }
        } else {
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
        }
        this.wireManager.selectedWire = null;
        return;
      }

      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        return;
      }

      // Gate drag
      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.selectedGate = gate;
        isDraggingGate = true;
        dragGate = gate;
        dragOffsetX = pos.x - gate.x;
        dragOffsetY = pos.y - gate.y;
        return;
      }

      this.selectedGate = null;
      this.wireManager.selectedWire = null;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getTouchPos(touch);
      touchMoved = true;
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      this.wireManager.updateMouse(pos.x, pos.y);

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      isDraggingGate = false;
      dragGate = null;
    }, { passive: false });

    // ── Mouse support ──
    canvas.addEventListener('mousedown', (e) => {
      if (this.isAnimating) return;
      const pos = this.renderer.getMousePos(e);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this.audio.playWireConnect();
            this.undoManager.push({
              type: 'addWire',
              wireId: wire.id,
              fromGateId: wire.fromGateId,
              fromPinIndex: wire.fromPinIndex,
              toGateId: wire.toGateId,
              toPinIndex: wire.toPinIndex,
            });
          }
        } else {
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
        }
        this.wireManager.selectedWire = null;
        return;
      }

      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        return;
      }

      const wire = this.wireManager.findWireAt(pos.x, pos.y);
      if (wire) {
        this.wireManager.selectedWire = wire;
        this.selectedGate = null;
        return;
      }

      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.selectedGate = gate;
        this.wireManager.selectedWire = null;
        isDraggingGate = true;
        dragGate = gate;
        dragOffsetX = pos.x - gate.x;
        dragOffsetY = pos.y - gate.y;
        return;
      }

      this.selectedGate = null;
      this.wireManager.selectedWire = null;
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = this.renderer.getMousePos(e);
      this.wireManager.updateMouse(pos.x, pos.y);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      this.renderer.hoveredPin = pin;

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
      }

      if (pin) {
        canvas.style.cursor = 'pointer';
      } else if (this.wireManager.hoveredWire) {
        canvas.style.cursor = 'pointer';
      } else if (this.renderer.findGateAt(pos.x, pos.y)) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDraggingGate = false;
      dragGate = null;
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.isAnimating) return;
      const pos = this.renderer.getMousePos(e);

      const wire = this.wireManager.findWireAt(pos.x, pos.y);
      if (wire) {
        this.audio.playWireDisconnect();
        this.undoManager.push({
          type: 'removeWire',
          fromGateId: wire.fromGateId,
          fromPinIndex: wire.fromPinIndex,
          toGateId: wire.toGateId,
          toPinIndex: wire.toPinIndex,
        });
        this.wireManager.removeWire(wire);
        return;
      }

      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.removeGate(gate);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (this.isAnimating || this.currentScreen !== 'gameplay') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        if (this.wireManager.selectedWire) {
          this.audio.playWireDisconnect();
          const wire = this.wireManager.selectedWire;
          this.undoManager.push({
            type: 'removeWire',
            fromGateId: wire.fromGateId,
            fromPinIndex: wire.fromPinIndex,
            toGateId: wire.toGateId,
            toPinIndex: wire.toPinIndex,
          });
          this.wireManager.removeWire(wire);
        } else if (this.selectedGate) {
          this.removeGate(this.selectedGate);
        }
      }

      if (e.key === 'Escape') {
        this.wireManager.cancelDrawing();
        this.selectedGate = null;
        this.wireManager.selectedWire = null;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.performUndo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.performRedo();
      }
    });
  }

  startRenderLoop() {
    const loop = () => {
      if (this.currentScreen === 'gameplay') {
        this.renderer.render();
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameState();
  game.init();
  game.startRenderLoop();
  window.game = game;
});
