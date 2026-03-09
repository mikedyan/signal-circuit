// main.js — App initialization, game state, undo/redo, progress

const STORAGE_KEY = 'signal-circuit-progress';

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
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(canvas, this);
    this.ui = new UI(this);

    this.setupCanvasEvents(canvas);
    this.ui.showScreen('level-select');
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
    this.ui.renderLevelSelect();
    this.ui.showScreen('level-select');
    this.isAnimating = false;
  }

  startLevel(levelId) {
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.loadLevel(levelId);

    // Need to resize canvas after showing gameplay screen
    setTimeout(() => {
      this.renderer.resize();
    }, 50);
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
      const node = new IONode('input', inp.label, inp.x, inp.y, this.nextId++);
      this.inputNodes.push(node);
    }

    for (const out of level.outputs) {
      const node = new IONode('output', out.label, out.x, out.y, this.nextId++);
      this.outputNodes.push(node);
    }

    this.ui.updateLevelInfo();
    this.ui.updateToolbox();
    this.ui.updateTruthTable(null);
    this.ui.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    this.ui.hideStarDisplay();
    this.ui.updateStatusBar(`Level ${level.id}: ${level.title}`);
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

    this.ui.updateResultDisplay('idle', 'Simulating...');
    this.ui.hideStarDisplay();

    await this.simulation.runAnimated(
      (results, rowIndex) => {
        this.ui.updateTruthTable(results);
      },
      (results) => {
        const allPass = results.every(r => r.pass);
        this.ui.updateTruthTable(results);

        if (allPass) {
          const gateCount = this.gates.length;
          const stars = this.completeLevel(this.currentLevel.id, gateCount);

          this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
          this.ui.updateStatusBar('Level complete! All truth table rows match.');
          this.ui.showStarDisplay(stars, gateCount, this.currentLevel);
          this.ui.startCelebration();
        } else {
          const passCount = results.filter(r => r.pass).length;
          this.ui.updateResultDisplay('fail', `✗ ${passCount}/${results.length} rows correct`);
          this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
        }

        this.isAnimating = false;
      }
    );
  }

  setupCanvasEvents(canvas) {
    let isDraggingGate = false;
    let dragGate = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    canvas.addEventListener('mousedown', (e) => {
      if (this.isAnimating) return;
      const pos = this.renderer.getMousePos(e);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
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
