// main.js — App initialization, game state, undo/redo, progress

const STORAGE_KEY = 'signal-circuit-progress';
const LEADERBOARD_KEY = 'signal-circuit-leaderboard';
const STATS_KEY = 'signal-circuit-stats';
const MILESTONES_KEY = 'signal-circuit-milestones';
const AUTOSAVE_KEY = 'signal-circuit-autosave';
const GHOST_KEY = 'signal-circuit-ghost';
const SCHEMA_VERSION = 1;

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
    this.achievements = new AchievementManager();
    this.timerStart = null;
    this.timerInterval = null;
    this.timerRunning = false;
    this.hintsUsed = 0;
    this.maxHintPenalty = 0; // 0 = no penalty, 1 = max 2 stars, 2 = max 1 star
    this.levelStartTime = null;
    this.skipVisible = false;
    this.activeHintHighlights = null; // Array of I/O labels to highlight for visual hint
    this.needsRender = true;
    this.ghostOverlay = null; // {gates: [...], wires: [...]} for replay ghost (T10)
    this.showGhost = false;
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(canvas, this);
    this.ui = new UI(this);

    this.setupCanvasEvents(canvas);
    this.setupMuteButton();

    // Zoom reset button
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.renderer.resetView();
      });
    }
    this.setupHintAndSkip();
    this.ui.updateProgressBar(this.progress);
    this.ui.showScreen('level-select');
    this.trackPlaytimeStart();

    // Remove intro after animation (skip for returning players)
    const intro = document.getElementById('intro-screen');
    if (intro) {
      let isReturning = false;
      try { isReturning = localStorage.getItem('signal-circuit-visited') === 'true'; } catch (e) {}

      if (isReturning) {
        // Skip intro entirely for returning players
        intro.remove();
      } else {
        const onEnd = () => {
          intro.remove();
        };
        intro.addEventListener('animationend', onEnd);
        // Fallback in case animationend doesn't fire
        setTimeout(() => {
          if (intro.parentNode) intro.remove();
        }, 3000);
      }
    }
  }

  markDirty() {
    this.needsRender = true;
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
        const data = JSON.parse(saved);
        // Schema version check — migrate or reset if version mismatch
        if (!data.version || data.version < SCHEMA_VERSION) {
          // For version 1: old data without version is compatible, just add version
          data.version = SCHEMA_VERSION;
          if (!data.levels) data.levels = {};
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data;
      }
    } catch (e) {
      // Corrupted data — reset gracefully
      try { localStorage.removeItem(STORAGE_KEY); } catch (e2) {}
    }
    return { levels: {}, version: SCHEMA_VERSION };
  }

  saveProgress() {
    try {
      this.progress.version = SCHEMA_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {}
  }

  resetProgress() {
    this.progress = { levels: {}, version: SCHEMA_VERSION };
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

  // ── Lifetime Stats ──
  loadLifetimeStats() {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { totalGatesPlaced: 0, totalPlaytime: 0, sessionStart: null };
  }

  saveLifetimeStats(stats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  trackGatePlaced() {
    const stats = this.loadLifetimeStats();
    stats.totalGatesPlaced = (stats.totalGatesPlaced || 0) + 1;
    this.saveLifetimeStats(stats);
  }

  trackPlaytimeStart() {
    this._sessionStart = Date.now();
  }

  trackPlaytimeEnd() {
    if (!this._sessionStart) return;
    const elapsed = Math.floor((Date.now() - this._sessionStart) / 1000);
    if (elapsed > 0 && elapsed < 86400) { // Sanity cap at 24h
      const stats = this.loadLifetimeStats();
      stats.totalPlaytime = (stats.totalPlaytime || 0) + elapsed;
      this.saveLifetimeStats(stats);
    }
    this._sessionStart = Date.now(); // Reset for next interval
  }

  // ── Milestones ──
  loadMilestones() {
    try {
      const saved = localStorage.getItem(MILESTONES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  saveMilestones(milestones) {
    try {
      localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
    } catch (e) {}
  }

  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    const prev = this.progress.levels[levelId - 1];
    return prev && (prev.completed || prev.bookmarked);
  }

  bookmarkLevel(levelId) {
    const existing = this.progress.levels[levelId];
    if (existing && existing.completed) return; // Already solved
    this.progress.levels[levelId] = {
      ...(existing || {}),
      bookmarked: true,
      completed: existing ? existing.completed : false,
    };
    // Unlock next level
    const nextId = levelId + 1;
    if (nextId <= getLevelCount() && !this.progress.levels[nextId]) {
      // Next level becomes unlockable
    }
    this.saveProgress();
  }

  isLevelBookmarked(levelId) {
    const data = this.progress.levels[levelId];
    return data && data.bookmarked && !data.completed;
  }

  calculateStars(gateCount, level) {
    let stars;
    if (gateCount <= level.optimalGates) stars = 3;
    else if (gateCount <= level.goodGates) stars = 2;
    else stars = 1;

    // T8: Hints no longer reduce stars. Pure Logic badge tracked separately.
    return stars;
  }

  completeLevel(levelId, gateCount) {
    const level = getLevel(levelId);
    if (!level) return;

    const stars = this.calculateStars(gateCount, level);
    const elapsed = this.stopTimer();
    const existing = this.progress.levels[levelId];
    const pureLogic = this.hintsUsed === 0; // T8: Pure Logic tracking

    if (!existing || stars > existing.stars) {
      this.progress.levels[levelId] = {
        completed: true,
        stars: stars,
        bestGateCount: existing ? Math.min(existing.bestGateCount || gateCount, gateCount) : gateCount,
        bestTime: existing ? Math.min(existing.bestTime || elapsed, elapsed) : elapsed,
        pureLogic: pureLogic || (existing && existing.pureLogic), // Once earned, keep it
      };
    } else {
      if (gateCount < (existing.bestGateCount || Infinity)) existing.bestGateCount = gateCount;
      if (elapsed < (existing.bestTime || Infinity)) existing.bestTime = elapsed;
      if (pureLogic) existing.pureLogic = true;
    }

    // Clear bookmark if it was bookmarked
    if (this.progress.levels[levelId].bookmarked) {
      delete this.progress.levels[levelId].bookmarked;
    }

    this.saveProgress();
    this._saveGhost(levelId); // T10: save solution as ghost for replay
    this._clearAutoSave(); // Clear auto-save on completion

    // Check for chapter completion
    this._checkChapterCompletion(levelId);

    // Check for milestones
    if (this.ui) {
      this.ui.checkMilestones(stars, levelId);
    }

    return stars;
  }

  _checkChapterCompletion(levelId) {
    const chapters = getChapters();
    for (const chapter of chapters) {

      if (!chapter.levels.includes(levelId)) continue;
      // Is this the last level of the chapter?
      const lastLevel = chapter.levels[chapter.levels.length - 1];
      if (levelId !== lastLevel) continue;
      // Are all levels in this chapter completed?
      const allComplete = chapter.levels.every(lid => {
        const p = this.progress.levels[lid];
        return p && p.completed;
      });
      if (allComplete) {
        // Trigger chapter completion modal after a short delay
        setTimeout(() => {
          if (this.ui) this.ui.showChapterCompleteModal(chapter);
        }, 2000);
      }
    }
  }

  // ── Screen Management ──
  showLevelSelect() {
    this.currentScreen = 'level-select';
    this.isSandboxMode = false;
    this.isChallengeMode = false;
    this.stopTimer();
    this.trackPlaytimeEnd();
    this.audio.stopAmbient();
    this.ui.renderLevelSelect();
    this.ui.updateProgressBar(this.progress);
    this.ui.showScreen('level-select');
    this.isAnimating = false;
  }

  showChallengeConfig() {
    this.currentScreen = 'challenge-config';
    this.stopTimer();
    this.audio.stopAmbient();
    this.ui.showScreen('challenge-config');
    // Trigger initial leaderboard render
    const ni = parseInt(document.getElementById('input-count-slider').value);
    const no = parseInt(document.getElementById('output-count-slider').value);
    this.ui.renderLeaderboard(ni, no);
  }

  showSandboxConfig() {
    this.currentScreen = 'sandbox-config';
    this.stopTimer();
    this.audio.stopAmbient();
    this.ui.showScreen('sandbox-config');
  }

  startChallenge(numInputs, numOutputs) {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    const level = generateChallenge(numInputs, numOutputs);
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startDailyChallenge() {
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    const level = generateDailyChallenge();
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startSandbox(numInputs, numOutputs) {
    this.isSandboxMode = true;
    this.isChallengeMode = false;
    const level = generateSandboxLevel(numInputs || 2, numOutputs || 1);
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startLevel(levelId) {
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();

    // Must resize canvas BEFORE loading level so positions scale correctly
    this.renderer.resize();
    this.renderer.resetView();
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

  setupHintAndSkip() {
    document.getElementById('hint-btn').addEventListener('click', () => {
      if (!this.currentLevel || !this.currentLevel.hints) return;
      if (this.hintsUsed >= this.currentLevel.hints.length) return;
      if (this.isSandboxMode || this.isChallengeMode) return;

      this.hintsUsed++;
      if (this.hintsUsed >= 2) this.maxHintPenalty = Math.max(this.maxHintPenalty, this.hintsUsed - 1);
      this.audio.playButtonClick();

      // Activate visual highlights on hint 3 (the final hint)
      const isVisualHint = this.hintsUsed === 3 && this.currentLevel.hintHighlights;
      if (isVisualHint) {
        this.activeHintHighlights = this.currentLevel.hintHighlights;
      }

      this.ui.showHint(this.currentLevel.hints[this.hintsUsed - 1], this.hintsUsed, this.currentLevel.hints.length, isVisualHint);

      // Update hint button via centralized method
      this.ui.updateHintButton();
      if (this.hintsUsed >= this.currentLevel.hints.length) {
        this.showSkipButton();
      }

      // Update hint penalty display
      this.ui.updateHintPenalty();
      this.ui.updateGateIndicator();
    });

    document.getElementById('skip-btn').addEventListener('click', () => {
      if (!this.currentLevel || this.isChallengeMode || this.isSandboxMode) return;
      this.ui.showConfirmModal('Bookmark this level and move on? You can come back anytime.', () => {
        this.bookmarkLevel(this.currentLevel.id);
        this.audio.playButtonClick();
        this.showLevelSelect();
      });
    });

    // Timer to show skip after 60 seconds
    this._skipTimer = null;
  }

  showSkipButton() {
    if (this.skipVisible) return;
    if (this.isChallengeMode || this.isSandboxMode) return;
    this.skipVisible = true;
    document.getElementById('skip-btn').style.display = '';
  }

  resetHintState() {
    this.hintsUsed = 0;
    this.maxHintPenalty = 0;
    this.skipVisible = false;
    this.activeHintHighlights = null;
    this.levelStartTime = Date.now();

    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('hint-display').style.display = 'none';
    if (this.ui) this.ui.updateHintButton();

    // Show skip after 60 seconds
    if (this._skipTimer) clearTimeout(this._skipTimer);
    this._skipTimer = setTimeout(() => {
      if (this.currentScreen === 'gameplay' && !this.isChallengeMode && !this.isSandboxMode) {
        this.showSkipButton();
      }
    }, 60000);
  }

  startTimer() {
    this.timerStart = Date.now();
    this.timerRunning = true;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      // Hide timer during campaign play, show in challenge mode
      timerEl.style.display = (this.isChallengeMode || this.isSandboxMode) ? '' : 'none';
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
    this.updateTimerDisplay();
  }

  stopTimer() {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    return this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 0;
  }

  updateTimerDisplay() {
    if (!this.timerRunning || !this.timerStart) return;
    const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const el = document.getElementById('timer-display');
    if (el) el.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
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
    this.audio.playGatePlace(type);
    // Impact ripple effect
    if (this.renderer) {
      this.renderer.spawnRipple(x + (GateTypes[type].width / 2), y + (GateTypes[type].height / 2));
    }
    if (!skipUndo) {
      this.undoManager.push({
        type: 'addGate',
        gateId: gate.id,
        gateType: type,
        x, y,
      });
    }
    this.trackGatePlaced();
    this.ui.updateGateIndicator();
    this.markDirty();
    this._autoSave();
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
    this.ui.updateGateIndicator();
    this.markDirty();
    this._autoSave();
  }

  addWireFromData(fromGateId, fromPinIndex, toGateId, toPinIndex) {
    const wire = new Wire(fromGateId, fromPinIndex, toGateId, toPinIndex, this.wireManager.nextId++);
    this.wireManager.wires.push(wire);
    this.markDirty();
    this._autoSave();
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
      case 'moveIONode': {
        const undoNode = this.findNode(action.nodeId);
        if (undoNode) {
          undoNode.x = action.fromX;
          undoNode.y = action.fromY;
        }
        break;
      }
      case 'clearCircuit': {
        // Restore all gates and wires from before the clear
        for (const g of action.gates) {
          const gate = new Gate(g.type, g.x, g.y, g.id);
          this.gates.push(gate);
        }
        if (action.nextId) this.nextId = Math.max(this.nextId, action.nextId);
        for (const w of action.wires) {
          this.addWireFromData(w.fromGateId, w.fromPinIndex, w.toGateId, w.toPinIndex);
        }
        break;
      }
    }
    this.ui.updateStatusBar('Undo');
    this.ui.updateGateIndicator();
    this.markDirty();
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
      case 'moveIONode': {
        const redoNode = this.findNode(action.nodeId);
        if (redoNode) {
          redoNode.x = action.toX;
          redoNode.y = action.toY;
        }
        break;
      }
      case 'clearCircuit': {
        // Re-clear the circuit
        this.gates = [];
        this.wireManager.wires = [];
        this.wireManager.selectedWire = null;
        this.selectedGate = null;
        for (const node of this.inputNodes) node.value = 0;
        for (const node of this.outputNodes) node.value = 0;
        break;
      }
    }
    this.ui.updateStatusBar('Redo');
    this.ui.updateGateIndicator();
    this.markDirty();
  }

  // Scale level positions to fit the actual canvas
  _scalePosition(x, y) {
    if (!this.renderer) return { x, y };
    const canvas = this.renderer.canvas;
    const cw = this.renderer.displayWidth || canvas.clientWidth || 800;
    const ch = this.renderer.displayHeight || canvas.clientHeight || 500;
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

    // Level transition choreography: power-down/up
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && this.currentLevel && this.currentLevel.id !== id) {
      canvasContainer.classList.remove('level-power-up');
      canvasContainer.classList.add('level-power-down');
      setTimeout(() => {
        canvasContainer.classList.remove('level-power-down');
        canvasContainer.classList.add('level-power-up');
        setTimeout(() => canvasContainer.classList.remove('level-power-up'), 200);
      }, 200);
    }

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
    this.resetHintState();
    this.startTimer();

    // Sync hint button state
    this.ui.updateHintButton();

    // Show onboarding tooltip on Level 1
    if (level.id === 1) {
      this.ui.showOnboarding();
    }

    this.ui.updateGateIndicator();

    // T3: Reset wire pitch escalation
    this.audio.resetWireCount();

    // T10: Load ghost overlay if this level was previously solved
    this._loadGhost(id);

    // T7: Restore auto-saved circuit state
    this._restoreAutoSave(id);

    this.markDirty();
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
    this.ui.updateGateIndicator();
    this.markDirty();
  }

  _propagateLiveSignals() {
    // Propagate current input node values through the circuit in real-time
    const inputValues = this.inputNodes.map(n => n.value);
    this.simulation.evaluateOnce(inputValues);
    this.markDirty();
  }

  clearCircuit() {
    // Save current state for undo
    const savedGates = this.gates.map(g => ({ type: g.type, x: g.x, y: g.y, id: g.id }));
    const savedWires = this.wireManager.wires.map(w => ({
      fromGateId: w.fromGateId, fromPinIndex: w.fromPinIndex,
      toGateId: w.toGateId, toPinIndex: w.toPinIndex,
    }));

    if (savedGates.length > 0 || savedWires.length > 0) {
      this.undoManager.push({
        type: 'clearCircuit',
        gates: savedGates,
        wires: savedWires,
        nextId: this.nextId,
      });
    }

    this.gates = [];
    this.wireManager.clear();
    this.selectedGate = null;

    for (const node of this.inputNodes) node.value = 0;
    for (const node of this.outputNodes) node.value = 0;

    this.ui.updateTruthTable(null);
    this.ui.updateGateIndicator();
    this.audio.resetWireCount(); // T3: Reset pitch escalation
    this._clearAutoSave(); // T7: Clear auto-save
    this.markDirty();
  }

  async runSimulation() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    try {
      this.audio.playButtonClick();
      this.ui.updateResultDisplay('idle', 'Simulating...');
      this.ui.hideStarDisplay();

      // Sandbox mode: just evaluate and show actual truth table
      if (this.isSandboxMode) {
        await this.runSandboxTest();
        return;
      }

      // RUN tension: brief charging animation
      await this._runTensionAnimation();

      // Reset audio escalation pitch + shift music to tension chord
      this.audio.resetSimPitch();
      this.audio.musicTension();

      await this.simulation.runAnimated(
        (results, rowIndex) => {
          // Escalating audio: pass vs fail
          const lastResult = results[results.length - 1];
          if (lastResult && lastResult.pass) {
            this.audio.playSimPulsePass();
          } else {
            this.audio.playSimPulseFail();
          }
          this.ui.updateTruthTable(results);
        },
        (results) => {
          const allPass = results.every(r => r.pass);
          this.ui.updateTruthTable(results);

          if (allPass) {
            this.audio.musicResolve();
            const gateCount = this.gates.length;

            if (this.isChallengeMode && this.currentLevel.isChallenge) {
              // Challenge mode completion
              this.addLeaderboardEntry(
                this.currentLevel.difficultyKey,
                gateCount,
                this.currentLevel.difficulty
              );
              this.audio.playSuccess(2);
              this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
              this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
              this.ui.showChallengeResult(gateCount, this.currentLevel);
              this.ui.startCelebration(2);
              // Track challenge achievements
              const chAchs = this.achievements.trackChallengeComplete();
              this.ui.showAchievementToasts(chAchs);
            } else {
              const stars = this.completeLevel(this.currentLevel.id, gateCount);
              this.audio.playSuccess(stars);
              this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
              this.ui.updateStatusBar('Level complete! All truth table rows match.');
              this.ui.showStarDisplay(stars, gateCount, this.currentLevel);
              this.ui.startCelebration(stars);
              // Check achievements
              const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
              const newAchs = this.achievements.checkAfterCompletion(this, this.currentLevel.id, gateCount, elapsed, this.hintsUsed);
              if (this.currentLevel.isDaily) {
                if (this.achievements.unlock('daily_solver')) newAchs.push('daily_solver');
                // Show share button for daily challenge
                this.ui.showShareButton(gateCount, stars, elapsed);
              }
              this.ui.showAchievementToasts(newAchs);
            }
          } else {
            const passCount = results.filter(r => r.pass).length;
            const total = results.length;
            const failCount = total - passCount;
            
            if (passCount / total >= 0.75) {
              // Near-miss feedback: ≥75% correct
              this.audio.playFail();
              this._shakeScreen();
              const failingRows = results.map((r, i) => r.pass ? null : i + 1).filter(Boolean);
              this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
              this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
            } else {
              this.audio.playFail();
              this._shakeScreen();
              this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
              this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
            }
          }
        }
      );
    } catch (err) {
      console.error('Simulation error:', err);
      this.ui.updateResultDisplay('fail', 'Error during simulation');
    } finally {
      this.isAnimating = false;
    }
  }

  runQuickTest() {
    if (this.isAnimating) return;

    this.audio.playButtonClick();
    this.ui.hideStarDisplay();

    if (this.isSandboxMode) {
      this.runSandboxTest();
      return;
    }

    const results = this.simulation.runAll();
    const allPass = results.every(r => r.pass);
    this.ui.updateTruthTable(results);

    if (allPass) {
      const gateCount = this.gates.length;

      if (this.isChallengeMode && this.currentLevel.isChallenge) {
        this.addLeaderboardEntry(this.currentLevel.difficultyKey, gateCount, this.currentLevel.difficulty);
        this.audio.playSuccess(2);
        this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
        this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
        this.ui.showChallengeResult(gateCount, this.currentLevel);
        this.ui.startCelebration(2);
      } else {
        const stars = this.completeLevel(this.currentLevel.id, gateCount);
        this.audio.playSuccess(stars);
        this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
        this.ui.updateStatusBar('Level complete! All truth table rows match.');
        this.ui.showStarDisplay(stars, gateCount, this.currentLevel);
        this.ui.startCelebration(stars);
        const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
        const newAchs = this.achievements.checkAfterCompletion(this, this.currentLevel.id, gateCount, elapsed, this.hintsUsed);
        if (this.currentLevel.isDaily) {
          if (this.achievements.unlock('daily_solver')) newAchs.push('daily_solver');
          this.ui.showShareButton(gateCount, stars, elapsed);
        }
        this.ui.showAchievementToasts(newAchs);
      }
    } else {
      const passCount = results.filter(r => r.pass).length;
      const total = results.length;
      const failCount = total - passCount;

      if (passCount / total >= 0.75) {
        this.audio.playFail();
        this._shakeScreen();
        const failingRows = results.map((r, i) => r.pass ? null : i + 1).filter(Boolean);
        this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
        this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
      } else {
        this.audio.playFail();
        this._shakeScreen();
        this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
        this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
      }
    }
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
    // isAnimating reset handled by runSimulation's finally block
  }

  setupCanvasEvents(canvas) {
    let isDraggingGate = false;
    let dragGate = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // ── Touch support ──
    let longPressTimer = null;
    let touchMoved = false;

    // ── I/O node drag ──
    let isDraggingIONode = false;
    let dragIONode = null;
    let dragIOOffsetX = 0;
    let dragIOOffsetY = 0;
    let dragIOStartX = 0;
    let dragIOStartY = 0;

    // ── Pinch-to-zoom + pan ──
    let pinchState = null;
    let isTwoFingerGesture = false;
    let lastTapTime = 0;

    const getTouchPos = (touch) => {
      const rect = canvas.getBoundingClientRect();
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isAnimating) return;

      // Two-finger gesture: start pinch-to-zoom + pan
      if (e.touches.length >= 2) {
        isTwoFingerGesture = true;
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        isDraggingGate = false;
        dragGate = null;
        isDraggingIONode = false;
        dragIONode = null;
        this.wireManager.cancelDrawing();

        const t1 = getTouchPos(e.touches[0]);
        const t2 = getTouchPos(e.touches[1]);
        const dist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
        const midX = (t1.x + t2.x) / 2;
        const midY = (t1.y + t2.y) / 2;
        const vt = this.renderer.viewTransform;
        pinchState = {
          initialDist: dist,
          initialScale: vt.scale,
          initialMidX: midX,
          initialMidY: midY,
          initialVtX: vt.x,
          initialVtY: vt.y,
        };
        return;
      }

      if (isTwoFingerGesture) return;

      const touch = e.touches[0];
      const screenPos = getTouchPos(touch);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      touchMoved = false;

      // Double-tap to reset zoom
      const now = Date.now();
      if (now - lastTapTime < 300) {
        if (!this.renderer.isDefaultView()) {
          this.renderer.resetView();
          lastTapTime = 0;
          if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
          return;
        }
      }
      lastTapTime = now;

      // Long-press timer for deletion
      longPressTimer = setTimeout(() => {
        if (touchMoved) return;
        const wire = this.wireManager.findWireAt(pos.x, pos.y);
        if (wire) {
          this.audio.playWireDisconnect();
          this.undoManager.push({ type: 'removeWire', fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
          this.wireManager.removeWire(wire);
          this.markDirty();
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
            this.renderer.spawnSparks(pin.x, pin.y);
            this.undoManager.push({ type: 'addWire', wireId: wire.id, fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
            this.markDirty();
          }
        } else {
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          this.markDirty();
        }
        this.wireManager.selectedWire = null;
        return;
      }

      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        return;
      }

      // Check for I/O node — start drag (toggle on tap in touchend)
      const tappedIO = this.inputNodes.find(n => n.containsPoint(pos.x, pos.y)) ||
                       this.outputNodes.find(n => n.containsPoint(pos.x, pos.y));
      if (tappedIO) {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        isDraggingIONode = true;
        dragIONode = tappedIO;
        dragIOOffsetX = pos.x - tappedIO.x;
        dragIOOffsetY = pos.y - tappedIO.y;
        dragIOStartX = tappedIO.x;
        dragIOStartY = tappedIO.y;
        return;
      }

      // Check for wire tap (selection + mobile delete)
      const wire = this.wireManager.findWireAt(pos.x, pos.y);
      if (wire) {
        this.wireManager.selectedWire = wire;
        this.selectedGate = null;
        if (this.ui) this.ui.showMobileDelete(screenPos.x, screenPos.y);
        this.markDirty();
        return;
      }

      // Gate drag
      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.selectedGate = gate;
        this.wireManager.selectedWire = null;
        isDraggingGate = true;
        dragGate = gate;
        dragOffsetX = pos.x - gate.x;
        dragOffsetY = pos.y - gate.y;
        if (this.ui) this.ui.showMobileDelete(screenPos.x, screenPos.y);
        return;
      }

      this.selectedGate = null;
      this.wireManager.selectedWire = null;
      if (this.ui) this.ui.hideMobileDelete();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      // Two-finger pinch-to-zoom + pan
      if (e.touches.length >= 2 && pinchState) {
        const t1 = getTouchPos(e.touches[0]);
        const t2 = getTouchPos(e.touches[1]);
        const dist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
        const midX = (t1.x + t2.x) / 2;
        const midY = (t1.y + t2.y) / 2;

        const scaleRatio = dist / pinchState.initialDist;
        const newScale = Math.min(this.renderer.maxScale, Math.max(this.renderer.minScale, pinchState.initialScale * scaleRatio));

        const worldX = (pinchState.initialMidX - pinchState.initialVtX) / pinchState.initialScale;
        const worldY = (pinchState.initialMidY - pinchState.initialVtY) / pinchState.initialScale;

        const vt = this.renderer.viewTransform;
        vt.scale = newScale;
        vt.x = midX - worldX * newScale;
        vt.y = midY - worldY * newScale;
        this.renderer._updateZoomButton();

        this.markDirty();
        return;
      }

      if (isTwoFingerGesture) return;

      const touch = e.touches[0];
      const screenPos = getTouchPos(touch);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      touchMoved = true;
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      this.wireManager.updateMouse(pos.x, pos.y);

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }

      if (isDraggingIONode && dragIONode) {
        const gridSize = 20;
        dragIONode.x = Math.round((pos.x - dragIOOffsetX) / gridSize) * gridSize;
        dragIONode.y = Math.round((pos.y - dragIOOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      if (e.touches.length < 2) {
        pinchState = null;
      }
      if (isTwoFingerGesture && e.touches.length === 0) {
        isTwoFingerGesture = false;
        return;
      }
      if (isTwoFingerGesture) return;

      // I/O node: tap = toggle input value, drag = reposition
      if (isDraggingIONode && dragIONode) {
        if (!touchMoved) {
          if (dragIONode.type === 'input') {
            dragIONode.value = dragIONode.value ? 0 : 1;
            this._propagateLiveSignals();
            this.audio.playClick();
          }
        } else if (dragIONode.x !== dragIOStartX || dragIONode.y !== dragIOStartY) {
          this.undoManager.push({
            type: 'moveIONode',
            nodeId: dragIONode.id,
            fromX: dragIOStartX,
            fromY: dragIOStartY,
            toX: dragIONode.x,
            toY: dragIONode.y,
          });
          this._autoSave();
        }
        isDraggingIONode = false;
        dragIONode = null;
        this.markDirty();
      }

      isDraggingGate = false;
      dragGate = null;
    }, { passive: false });

    // ── Mouse support ──
    canvas.addEventListener('mousedown', (e) => {
      if (this.isAnimating) return;
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this.audio.playWireConnect();
            this.renderer.spawnSparks(pin.x, pin.y);
            this.undoManager.push({
              type: 'addWire',
              wireId: wire.id,
              fromGateId: wire.fromGateId,
              fromPinIndex: wire.fromPinIndex,
              toGateId: wire.toGateId,
              toPinIndex: wire.toPinIndex,
            });
            // Track first wire achievement
            const wireAchs = this.achievements.trackFirstWire();
            this.ui.showAchievementToasts(wireAchs);
            this.markDirty();
          }
        } else {
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          this.markDirty();
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

      // Check for I/O node — start drag (toggle on click-without-move in mouseup)
      const clickedIO = this.inputNodes.find(n => n.containsPoint(pos.x, pos.y)) ||
                        this.outputNodes.find(n => n.containsPoint(pos.x, pos.y));
      if (clickedIO) {
        isDraggingIONode = true;
        dragIONode = clickedIO;
        dragIOOffsetX = pos.x - clickedIO.x;
        dragIOOffsetY = pos.y - clickedIO.y;
        dragIOStartX = clickedIO.x;
        dragIOStartY = clickedIO.y;
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
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      this.wireManager.updateMouse(pos.x, pos.y);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      this.renderer.hoveredPin = pin;

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }

      if (isDraggingIONode && dragIONode) {
        const gridSize = 20;
        dragIONode.x = Math.round((pos.x - dragIOOffsetX) / gridSize) * gridSize;
        dragIONode.y = Math.round((pos.y - dragIOOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }

      if (pin) {
        canvas.style.cursor = 'pointer';
      } else if (this.wireManager.hoveredWire) {
        canvas.style.cursor = 'pointer';
      } else if (this.renderer.findGateAt(pos.x, pos.y)) {
        canvas.style.cursor = 'grab';
      } else if (this.inputNodes.find(n => n.containsPoint(pos.x, pos.y)) ||
                 this.outputNodes.find(n => n.containsPoint(pos.x, pos.y))) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    });

    canvas.addEventListener('mouseup', () => {
      // I/O node: click-without-drag = toggle input, drag = reposition
      if (isDraggingIONode && dragIONode) {
        if (dragIONode.x === dragIOStartX && dragIONode.y === dragIOStartY) {
          if (dragIONode.type === 'input') {
            dragIONode.value = dragIONode.value ? 0 : 1;
            this._propagateLiveSignals();
            this.audio.playClick();
            this.markDirty();
          }
        } else {
          this.undoManager.push({
            type: 'moveIONode',
            nodeId: dragIONode.id,
            fromX: dragIOStartX,
            fromY: dragIOStartY,
            toX: dragIONode.x,
            toY: dragIONode.y,
          });
          this._autoSave();
        }
        isDraggingIONode = false;
        dragIONode = null;
      }
      isDraggingGate = false;
      dragGate = null;
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.isAnimating) return;
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);

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
        this.markDirty();
        return;
      }

      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.removeGate(gate);
      }
    });

    // Mouse wheel zoom (desktop)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const screenPos = this.renderer.getMousePos(e);
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const vt = this.renderer.viewTransform;
      this.renderer.zoomAt(vt.scale * zoomFactor, screenPos.x, screenPos.y);
    }, { passive: false });

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
          this.markDirty();
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

      if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !e.shiftKey) {
        e.preventDefault();
        this.performRedo();
      }

      // Shift+Enter: Quick Test (instant, no animation)
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        this.runQuickTest();
      }

      // Enter: Normal run
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.runSimulation();
      }
    });
  }

  async _runTensionAnimation() {
    // Brief workspace dim + input pulse before simulation starts
    const overlay = document.getElementById('run-tension-overlay');
    if (overlay) {
      overlay.classList.add('active');
      // Pulse input nodes
      for (const node of this.inputNodes) {
        node._tensionPulse = true;
      }
      this.markDirty();
      await new Promise(r => setTimeout(r, 600));
      overlay.classList.remove('active');
      for (const node of this.inputNodes) {
        node._tensionPulse = false;
      }
      this.markDirty();
    }
  }

  _shakeScreen() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    container.classList.remove('screen-shake');
    void container.offsetWidth;
    container.classList.add('screen-shake');
    setTimeout(() => container.classList.remove('screen-shake'), 400);
  }

  // ── T7: Auto-Save Circuit State ──
  _autoSave() {
    if (!this.currentLevel || this.currentLevel.isSandbox) return;
    const levelId = this.currentLevel.id;
    if (!levelId || levelId === 'challenge' || levelId === 'daily') return;

    const data = {
      levelId,
      gates: this.gates.map(g => ({ type: g.type, x: g.x, y: g.y, id: g.id })),
      wires: this.wireManager.wires.map(w => ({
        fromGateId: w.fromGateId,
        fromPinIndex: w.fromPinIndex,
        toGateId: w.toGateId,
        toPinIndex: w.toPinIndex,
      })),
      ioPositions: [
        ...this.inputNodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
        ...this.outputNodes.map(n => ({ id: n.id, x: n.x, y: n.y })),
      ],
      nextId: this.nextId,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  _restoreAutoSave(levelId) {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.levelId !== levelId) return;
      // Check not too stale (24 hours)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        this._clearAutoSave();
        return;
      }

      // Restore gates
      for (const g of data.gates) {
        const gate = new Gate(g.type, g.x, g.y, g.id);
        this.gates.push(gate);
      }
      // Update nextId
      if (data.nextId) this.nextId = Math.max(this.nextId, data.nextId);

      // Restore wires
      for (const w of data.wires) {
        const wire = new Wire(w.fromGateId, w.fromPinIndex, w.toGateId, w.toPinIndex, this.wireManager.nextId++);
        this.wireManager.wires.push(wire);
      }

      // Restore I/O node positions
      if (data.ioPositions) {
        for (const pos of data.ioPositions) {
          const node = this.findNode(pos.id);
          if (node) {
            node.x = pos.x;
            node.y = pos.y;
          }
        }
      }

      if (data.gates.length > 0 || data.wires.length > 0) {
        this.ui.updateStatusBar('Circuit restored from auto-save');
        this.ui.updateGateIndicator();
      }
    } catch (e) {
      // Corrupt autosave — ignore
    }
  }

  _clearAutoSave() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {}
  }

  // ── T10: Replay Ghost ──
  _saveGhost(levelId) {
    if (!levelId || typeof levelId !== 'number') return;
    const data = {
      levelId,
      gates: this.gates.map(g => ({ type: g.type, x: g.x, y: g.y })),
      wires: this.wireManager.wires.map(w => ({
        fromGateId: w.fromGateId,
        fromPinIndex: w.fromPinIndex,
        toGateId: w.toGateId,
        toPinIndex: w.toPinIndex,
      })),
    };
    try {
      const all = JSON.parse(localStorage.getItem(GHOST_KEY) || '{}');
      all[levelId] = data;
      localStorage.setItem(GHOST_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  _loadGhost(levelId) {
    this.ghostOverlay = null;
    this.showGhost = false;
    try {
      const all = JSON.parse(localStorage.getItem(GHOST_KEY) || '{}');
      const data = all[levelId];
      if (data && (data.gates.length > 0 || data.wires.length > 0)) {
        this.ghostOverlay = data;
        this.showGhost = true;
        this.ui.updateGhostButton(true);
      } else {
        this.ui.updateGhostButton(false);
      }
    } catch (e) {
      this.ui.updateGhostButton(false);
    }
  }

  toggleGhost() {
    if (!this.ghostOverlay) return;
    this.showGhost = !this.showGhost;
    this.markDirty();
  }

  startRenderLoop() {
    const loop = () => {
      if (this.currentScreen === 'gameplay') {
        // Always render during animation, otherwise only when dirty
        const sim = this.simulation;
        if (this.needsRender || (sim && sim.animating) || 
            this.renderer.sparkParticles.length > 0 ||
            this.renderer.ripples.length > 0 ||
            this.wireManager.drawing) {
          this.renderer.render();
          this.needsRender = false;
        }
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

  // Save playtime on page unload
  window.addEventListener('beforeunload', () => {
    game.trackPlaytimeEnd();
  });
});
