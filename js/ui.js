// ui.js — Toolbox, truth table, controls, drag handling

class UI {
  constructor(gameState) {
    this.gameState = gameState;
    this.dragGhost = document.getElementById('drag-ghost');
    this.isDragging = false;
    this.dragType = null;
    this.draggingGate = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.setupToolbox();
    this.setupControls();
    this.setupLevelNav();
  }

  setupToolbox() {
    const toolbox = document.getElementById('toolbox');
    const gateContainer = document.createElement('div');
    gateContainer.id = 'gate-tools';
    toolbox.appendChild(gateContainer);
    this.gateContainer = gateContainer;
  }

  updateToolbox() {
    const gs = this.gameState;
    const level = gs.currentLevel;
    if (!level) return;

    this.gateContainer.innerHTML = '';

    for (const gateType of level.availableGates) {
      const def = GateTypes[gateType];
      if (!def) continue;

      const el = document.createElement('div');
      el.className = 'tool-gate';
      el.textContent = def.name;
      el.dataset.gateType = gateType;

      const dots = document.createElement('div');
      dots.className = 'pin-dots';
      for (let i = 0; i < def.inputs; i++) {
        const dot = document.createElement('span');
        dot.className = 'pin-dot';
        dots.appendChild(dot);
      }
      const arrow = document.createElement('span');
      arrow.textContent = '→';
      arrow.style.color = '#666';
      arrow.style.fontSize = '10px';
      dots.appendChild(arrow);
      for (let i = 0; i < def.outputs; i++) {
        const dot = document.createElement('span');
        dot.className = 'pin-dot';
        dot.style.background = def.color;
        dots.appendChild(dot);
      }
      el.appendChild(dots);

      el.addEventListener('mousedown', (e) => this.startToolboxDrag(e, gateType));
      this.gateContainer.appendChild(el);
    }
  }

  startToolboxDrag(e, gateType) {
    e.preventDefault();
    this.isDragging = true;
    this.dragType = gateType;

    this.dragGhost.textContent = GateTypes[gateType].name;
    this.dragGhost.style.display = 'block';
    this.dragGhost.style.left = (e.clientX - 30) + 'px';
    this.dragGhost.style.top = (e.clientY - 15) + 'px';

    const onMove = (e2) => {
      this.dragGhost.style.left = (e2.clientX - 30) + 'px';
      this.dragGhost.style.top = (e2.clientY - 15) + 'px';
    };

    const onUp = (e2) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.dragGhost.style.display = 'none';
      this.isDragging = false;

      // Check if dropped on canvas
      const canvas = this.gameState.renderer.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = e2.clientX - rect.left;
      const y = e2.clientY - rect.top;

      if (x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
        // Snap to grid
        const gridSize = 20;
        const snappedX = Math.round(x / gridSize) * gridSize - GateTypes[gateType].width / 2;
        const snappedY = Math.round(y / gridSize) * gridSize - GateTypes[gateType].height / 2;
        this.gameState.addGate(gateType, snappedX, snappedY);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  setupControls() {
    document.getElementById('run-btn').addEventListener('click', () => {
      this.gameState.runSimulation();
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      this.gameState.clearCircuit();
      this.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    });
  }

  setupLevelNav() {
    document.getElementById('prev-level').addEventListener('click', () => {
      const gs = this.gameState;
      if (gs.currentLevel && gs.currentLevel.id > 1) {
        gs.loadLevel(gs.currentLevel.id - 1);
      }
    });

    document.getElementById('next-level').addEventListener('click', () => {
      const gs = this.gameState;
      if (gs.currentLevel && gs.currentLevel.id < getLevelCount()) {
        gs.loadLevel(gs.currentLevel.id + 1);
      }
    });
  }

  updateLevelInfo() {
    const level = this.gameState.currentLevel;
    if (!level) return;

    document.getElementById('level-title').textContent = `Level ${level.id}: ${level.title}`;
    document.getElementById('level-desc').textContent = level.description;
    document.getElementById('prev-level').disabled = level.id <= 1;
    document.getElementById('next-level').disabled = level.id >= getLevelCount();
  }

  updateTruthTable(results) {
    const level = this.gameState.currentLevel;
    if (!level) return;

    const table = document.getElementById('truth-table');
    table.innerHTML = '';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const inp of level.inputs) {
      const th = document.createElement('th');
      th.textContent = inp.label;
      headerRow.appendChild(th);
    }
    for (const out of level.outputs) {
      const th = document.createElement('th');
      th.textContent = out.label;
      th.style.color = '#f88';
      headerRow.appendChild(th);
    }
    if (results) {
      const th = document.createElement('th');
      th.textContent = '✓';
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    level.truthTable.forEach((row, i) => {
      const tr = document.createElement('tr');

      if (results && results[i]) {
        tr.className = results[i].pass ? 'row-pass' : 'row-fail';
      }

      for (const val of row.inputs) {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      }
      for (const val of row.outputs) {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      }

      if (results && results[i]) {
        const td = document.createElement('td');
        td.textContent = results[i].pass ? '✓' : '✗';
        td.style.color = results[i].pass ? '#0f0' : '#f44';
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  updateResultDisplay(state, message) {
    const el = document.getElementById('result-display');
    el.className = state;
    el.textContent = message;
  }

  updateStatusBar(text) {
    document.getElementById('status-bar').textContent = text;
  }
}
