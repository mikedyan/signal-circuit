// ui.js — Toolbox, truth table, controls, level select, celebration

class UI {
  constructor(gameState) {
    this.gameState = gameState;
    this.dragGhost = document.getElementById('drag-ghost');
    this.isDragging = false;
    this.dragType = null;
    this.celebrationParticles = [];
    this.celebrationActive = false;

    this.setupToolbox();
    this.setupControls();
    this.setupLevelNav();
    this.setupLevelSelect();
    this.setupBackButton();
  }

  // ── Level Select Screen ──
  setupLevelSelect() {
    const container = document.getElementById('chapters-container');
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        this.gameState.resetProgress();
        this.renderLevelSelect();
      }
    });
    this.renderLevelSelect();
  }

  renderLevelSelect() {
    const container = document.getElementById('chapters-container');
    container.innerHTML = '';
    const progress = this.gameState.progress;
    const chapters = getChapters();

    for (const chapter of chapters) {
      const chapterDiv = document.createElement('div');
      chapterDiv.className = 'chapter';

      const title = document.createElement('div');
      title.className = 'chapter-title';
      title.textContent = chapter.title;
      chapterDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'level-grid';

      for (const levelId of chapter.levels) {
        const level = getLevel(levelId);
        if (!level) continue;

        const btn = document.createElement('div');
        const isUnlocked = this.gameState.isLevelUnlocked(levelId);
        const levelProgress = progress.levels[levelId];
        const isCompleted = levelProgress && levelProgress.completed;

        btn.className = 'level-btn' + (isCompleted ? ' completed' : '') + (!isUnlocked ? ' locked' : '');

        const num = document.createElement('span');
        num.className = 'level-number';
        num.textContent = levelId;
        btn.appendChild(num);

        const stars = document.createElement('span');
        stars.className = 'level-stars';
        if (isCompleted && levelProgress.stars) {
          for (let i = 0; i < 3; i++) {
            const s = document.createElement('span');
            s.className = i < levelProgress.stars ? 'star-filled' : 'star-empty';
            s.textContent = '★';
            stars.appendChild(s);
          }
        }
        btn.appendChild(stars);

        const titleSpan = document.createElement('span');
        titleSpan.className = 'level-btn-title';
        titleSpan.textContent = level.title;
        btn.appendChild(titleSpan);

        if (isUnlocked) {
          btn.addEventListener('click', () => {
            this.gameState.startLevel(levelId);
          });
        }

        grid.appendChild(btn);
      }

      chapterDiv.appendChild(grid);
      container.appendChild(chapterDiv);
    }
  }

  showScreen(screen) {
    document.getElementById('level-select-screen').style.display = screen === 'level-select' ? 'flex' : 'none';
    document.getElementById('gameplay-screen').style.display = screen === 'gameplay' ? 'flex' : 'none';
  }

  setupBackButton() {
    document.getElementById('back-btn').addEventListener('click', () => {
      this.gameState.showLevelSelect();
    });
  }

  // ── Toolbox ──
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

      const canvas = this.gameState.renderer.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = e2.clientX - rect.left;
      const y = e2.clientY - rect.top;

      if (x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
        const gridSize = 20;
        const snappedX = Math.round(x / gridSize) * gridSize - GateTypes[gateType].width / 2;
        const snappedY = Math.round(y / gridSize) * gridSize - GateTypes[gateType].height / 2;
        this.gameState.addGate(gateType, snappedX, snappedY);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Controls ──
  setupControls() {
    document.getElementById('run-btn').addEventListener('click', () => {
      this.gameState.runSimulation();
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      this.gameState.clearCircuit();
      this.updateResultDisplay('idle', 'Build your circuit, then press RUN');
      this.hideStarDisplay();
    });

    document.getElementById('next-level-btn').addEventListener('click', () => {
      const gs = this.gameState;
      if (gs.currentLevel && gs.currentLevel.id < getLevelCount()) {
        gs.loadLevel(gs.currentLevel.id + 1);
        this.hideStarDisplay();
      }
    });
  }

  setupLevelNav() {
    document.getElementById('prev-level').addEventListener('click', () => {
      const gs = this.gameState;
      if (gs.currentLevel && gs.currentLevel.id > 1) {
        gs.loadLevel(gs.currentLevel.id - 1);
        this.hideStarDisplay();
      }
    });

    document.getElementById('next-level').addEventListener('click', () => {
      const gs = this.gameState;
      if (gs.currentLevel && gs.currentLevel.id < getLevelCount()) {
        gs.loadLevel(gs.currentLevel.id + 1);
        this.hideStarDisplay();
      }
    });
  }

  // ── Level Info ──
  updateLevelInfo() {
    const level = this.gameState.currentLevel;
    if (!level) return;

    document.getElementById('level-title').textContent = `Level ${level.id}: ${level.title}`;
    document.getElementById('level-desc').textContent = level.description;
    document.getElementById('prev-level').disabled = level.id <= 1;
    document.getElementById('next-level').disabled = level.id >= getLevelCount();
  }

  // ── Truth Table ──
  updateTruthTable(results) {
    const level = this.gameState.currentLevel;
    if (!level) return;

    const table = document.getElementById('truth-table');
    table.innerHTML = '';

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

  // ── Star Display ──
  showStarDisplay(stars, gateCount, level) {
    const display = document.getElementById('star-display');
    display.style.display = 'block';

    const container = document.getElementById('stars-container');
    container.innerHTML = '';

    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i < stars ? ' filled' : ' empty');
      star.textContent = '★';

      // Stagger animation
      setTimeout(() => star.classList.add('visible'), 200 + i * 300);
      container.appendChild(star);
    }

    const msg = document.getElementById('star-message');
    if (stars === 3) {
      msg.textContent = `Perfect! ${gateCount} gates (optimal)`;
    } else if (stars === 2) {
      msg.textContent = `Good! ${gateCount} gates (optimal: ${level.optimalGates})`;
    } else {
      msg.textContent = `Solved with ${gateCount} gates (optimal: ${level.optimalGates})`;
    }

    // Show next level button if there's a next level
    const nextBtn = document.getElementById('next-level-btn');
    if (level.id < getLevelCount()) {
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
    }
  }

  hideStarDisplay() {
    document.getElementById('star-display').style.display = 'none';
  }

  // ── Celebration Particles ──
  startCelebration() {
    this.celebrationActive = true;
    this.celebrationParticles = [];

    const canvas = document.getElementById('celebration-canvas');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const colors = ['#ffd700', '#ff4444', '#0f0', '#00c8e8', '#c050f0', '#ff8800'];

    // Create particles
    for (let i = 0; i < 60; i++) {
      this.celebrationParticles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
      });
    }

    const ctx = canvas.getContext('2d');
    const animate = () => {
      if (!this.celebrationActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of this.celebrationParticles) {
        if (p.life <= 0) continue;
        alive++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (alive > 0) {
        requestAnimationFrame(animate);
      } else {
        this.celebrationActive = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  }
}
