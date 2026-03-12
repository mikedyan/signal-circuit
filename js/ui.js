// ui.js — Toolbox, truth table, controls, level select, celebration

class UI {
  constructor(gameState) {
    this.gameState = gameState;
    this.dragGhost = document.getElementById('drag-ghost');
    this.isDragging = false;
    this.dragType = null;
    this.celebrationParticles = [];
    this.celebrationActive = false;

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setupToolbox();
    this.setupControls();
    this.setupLevelNav();
    this.setupLevelSelect();
    this.setupBackButton();
    this.setupChallengeConfig();
    this.setupOnboarding();
    this.setupShortcutsOverlay();
    this.setupAchievements();
    this.setupHowToPlay();
    this.setupColorblindToggle();
    this.setupSandboxConfig();
    this.setupMobileDelete();
    this.adaptCopyForPlatform();
  }

  // ── Colorblind Mode Toggle ──
  setupColorblindToggle() {
    const btn = document.getElementById('colorblind-toggle-btn');
    if (!btn) return;

    // Load saved state
    let isColorblind = false;
    try {
      isColorblind = localStorage.getItem('signal-circuit-colorblind') === 'true';
    } catch (e) {}

    if (isColorblind) {
      document.body.classList.add('colorblind-mode');
      btn.textContent = '👁 Colorblind Mode: On';
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      isColorblind = !isColorblind;
      document.body.classList.toggle('colorblind-mode', isColorblind);
      btn.textContent = isColorblind ? '👁 Colorblind Mode: On' : '👁 Colorblind Mode: Off';
      btn.classList.toggle('active', isColorblind);
      try {
        localStorage.setItem('signal-circuit-colorblind', isColorblind ? 'true' : 'false');
      } catch (e) {}
    });
  }

  // ── Sandbox Config ──
  setupSandboxConfig() {
    const backBtn = document.getElementById('sandbox-back-btn');
    const startBtn = document.getElementById('start-sandbox-btn');
    const inputSlider = document.getElementById('sandbox-input-slider');
    const outputSlider = document.getElementById('sandbox-output-slider');
    const inputLabel = document.getElementById('sandbox-input-label');
    const outputLabel = document.getElementById('sandbox-output-label');

    if (!backBtn || !startBtn) return;

    if (inputSlider) {
      inputSlider.addEventListener('input', () => {
        inputLabel.textContent = inputSlider.value;
      });
    }
    if (outputSlider) {
      outputSlider.addEventListener('input', () => {
        outputLabel.textContent = outputSlider.value;
      });
    }

    backBtn.addEventListener('click', () => {
      this.gameState.showLevelSelect();
    });

    startBtn.addEventListener('click', () => {
      const ni = parseInt(inputSlider.value);
      const no = parseInt(outputSlider.value);
      this.gameState.startSandbox(ni, no);
    });
  }

  // ── Mobile Delete Button ──
  setupMobileDelete() {
    if (!this.isTouchDevice) return;

    const deleteBtn = document.getElementById('mobile-delete-btn');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gs = this.gameState;

      if (gs.wireManager.selectedWire) {
        gs.audio.playWireDisconnect();
        const wire = gs.wireManager.selectedWire;
        gs.undoManager.push({
          type: 'removeWire',
          fromGateId: wire.fromGateId,
          fromPinIndex: wire.fromPinIndex,
          toGateId: wire.toGateId,
          toPinIndex: wire.toPinIndex,
        });
        gs.wireManager.removeWire(wire);
        gs.markDirty();
      } else if (gs.selectedGate) {
        gs.removeGate(gs.selectedGate);
      }

      this.hideMobileDelete();
    });
  }

  showMobileDelete(x, y) {
    if (!this.isTouchDevice) return;
    const btn = document.getElementById('mobile-delete-btn');
    if (!btn) return;

    const canvas = this.gameState.renderer.canvas;
    const rect = canvas.getBoundingClientRect();

    btn.style.display = 'flex';
    btn.style.left = (rect.left + x - 24) + 'px';
    btn.style.top = (rect.top + y - 60) + 'px';
  }

  hideMobileDelete() {
    const btn = document.getElementById('mobile-delete-btn');
    if (btn) btn.style.display = 'none';
  }

  // ── Platform-Adaptive Copy ──
  adaptCopyForPlatform() {
    if (!this.isTouchDevice) return;

    // Update How to Play steps
    const howSteps = document.querySelectorAll('#how-to-play-content .how-step div');
    for (const div of howSteps) {
      div.innerHTML = div.innerHTML
        .replace(/Click an output pin \(right side\) then click an input pin/g, 'Tap an output pin (right side) then tap an input pin')
        .replace(/Click Hint/g, 'Tap Hint');
    }

    // Update shortcuts overlay for touch
    const shortcutRows = document.querySelectorAll('.shortcut-row');
    for (const row of shortcutRows) {
      if (row.textContent.includes('Right-click')) {
        row.innerHTML = '<kbd>Long press</kbd> Delete gate/wire';
      }
    }
  }

  // ── Confirm Modal ──
  showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const okBtn = document.getElementById('confirm-modal-ok');

    msgEl.textContent = message;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      cancelBtn.onclick = null;
      okBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    okBtn.onclick = () => {
      cleanup();
      onConfirm();
    };
  }

  // ── Level Select Screen ──
  setupLevelSelect() {
    const container = document.getElementById('chapters-container');
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
      this.showConfirmModal('Reset all progress? This cannot be undone.', () => {
        this.gameState.resetProgress();
        this.renderLevelSelect();
      });
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
      title.style.borderBottomColor = chapter.color || '#333';
      title.innerHTML = `${chapter.title} <span class="chapter-narrative">${chapter.narrative || ''}</span>`;
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

        const isBookmarked = this.gameState.isLevelBookmarked(levelId);
        btn.className = 'level-btn' + (isCompleted ? ' completed' : '') + (!isUnlocked ? ' locked' : '') + (isBookmarked ? ' bookmarked' : '');
        if (chapter.color && isUnlocked) {
          btn.style.borderColor = isCompleted ? chapter.color : '';
        }

        const num = document.createElement('span');
        num.className = 'level-number';
        num.textContent = levelId;
        btn.appendChild(num);

        const stars = document.createElement('span');
        stars.className = 'level-stars';
        if (isBookmarked && !isCompleted) {
          const bm = document.createElement('span');
          bm.className = 'bookmark-icon';
          bm.textContent = '🔖';
          stars.appendChild(bm);
        } else if (isCompleted && levelProgress.stars) {
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

        // Best time display
        if (isCompleted && levelProgress.bestTime) {
          const timeSpan = document.createElement('span');
          timeSpan.className = 'level-best-time';
          const mins = Math.floor(levelProgress.bestTime / 60);
          const secs = levelProgress.bestTime % 60;
          timeSpan.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
          btn.appendChild(timeSpan);
        }

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
    const screens = ['level-select-screen', 'gameplay-screen', 'challenge-config-screen', 'sandbox-config-screen'];
    for (const id of screens) {
      const el = document.getElementById(id);
      if (!el) continue;
      const shouldShow = id === screen + '-screen';
      if (shouldShow) {
        el.style.display = 'flex';
        el.classList.add('screen-enter');
        void el.offsetWidth;
        el.classList.remove('screen-enter');
        el.classList.add('screen-active');
      } else {
        el.style.display = 'none';
        el.classList.remove('screen-enter', 'screen-active');
      }
    }
  }

  setupBackButton() {
    document.getElementById('back-btn').addEventListener('click', () => {
      if (this.gameState.isChallengeMode) {
        this.gameState.showChallengeConfig();
      } else {
        this.gameState.showLevelSelect();
      }
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
      el.addEventListener('touchstart', (e) => this.startToolboxDragTouch(e, gateType), { passive: false });
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

  startToolboxDragTouch(e, gateType) {
    e.preventDefault();
    this.isDragging = true;
    this.dragType = gateType;

    const touch = e.touches[0];
    this.dragGhost.textContent = GateTypes[gateType].name;
    this.dragGhost.style.display = 'block';
    this.dragGhost.style.left = (touch.clientX - 30) + 'px';
    this.dragGhost.style.top = (touch.clientY - 15) + 'px';

    const onMove = (e2) => {
      e2.preventDefault();
      const t = e2.touches[0];
      this.dragGhost.style.left = (t.clientX - 30) + 'px';
      this.dragGhost.style.top = (t.clientY - 15) + 'px';
    };

    const onEnd = (e2) => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      this.dragGhost.style.display = 'none';
      this.isDragging = false;

      const t = e2.changedTouches[0];
      const canvas = this.gameState.renderer.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;

      if (x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
        const gridSize = 20;
        const snappedX = Math.round(x / gridSize) * gridSize - GateTypes[gateType].width / 2;
        const snappedY = Math.round(y / gridSize) * gridSize - GateTypes[gateType].height / 2;
        this.gameState.addGate(gateType, snappedX, snappedY);
      }
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // ── Controls ──
  setupControls() {
    document.getElementById('run-btn').addEventListener('click', () => {
      this.gameState.runSimulation();
    });

    document.getElementById('quick-test-btn').addEventListener('click', () => {
      this.gameState.runQuickTest();
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

    // Truth table collapse toggle
    const toggle = document.getElementById('truth-table-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const wrapper = document.getElementById('truth-table-wrapper');
        const chevron = document.getElementById('truth-table-chevron');
        if (wrapper.style.display === 'none') {
          wrapper.style.display = '';
          chevron.textContent = '▼';
          try { localStorage.setItem('signal-circuit-tt-collapsed', 'false'); } catch (e) {}
        } else {
          wrapper.style.display = 'none';
          chevron.textContent = '▶';
          try { localStorage.setItem('signal-circuit-tt-collapsed', 'true'); } catch (e) {}
        }
      });
    }

    // Auto-collapse truth table on mobile or revisits
    const isMobile = window.innerWidth < 768;
    let isRevisit = false;
    try {
      isRevisit = localStorage.getItem('signal-circuit-visited') === 'true';
      localStorage.setItem('signal-circuit-visited', 'true');
    } catch (e) {}

    const shouldCollapse = isMobile || (isRevisit && localStorage.getItem('signal-circuit-tt-collapsed') !== 'false');
    if (shouldCollapse) {
      const wrapper = document.getElementById('truth-table-wrapper');
      const chevron = document.getElementById('truth-table-chevron');
      if (wrapper && chevron) {
        wrapper.style.display = 'none';
        chevron.textContent = '▶';
      }
    }
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

    if (level.isSandbox) {
      document.getElementById('level-title').textContent = '🔧 Sandbox Mode';
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = true;
      document.getElementById('next-level').disabled = true;
      // Change run button text for sandbox
      document.getElementById('run-btn').textContent = '🔍 TEST';
    } else if (level.isChallenge) {
      document.getElementById('level-title').textContent = `🎲 ${level.title}`;
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = true;
      document.getElementById('next-level').disabled = true;
      document.getElementById('run-btn').textContent = '▶ RUN';
    } else {
      document.getElementById('level-title').textContent = `Level ${level.id}: ${level.title}`;
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = level.id <= 1;
      document.getElementById('next-level').disabled = level.id >= getLevelCount();
      document.getElementById('run-btn').textContent = '▶ RUN';
    }
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
    // Check if there are any failures to show "Actual" columns
    const hasFailures = results && results.some(r => !r.pass);
    if (hasFailures) {
      for (const out of level.outputs) {
        const th = document.createElement('th');
        th.textContent = 'Got';
        th.style.color = '#f90';
        th.className = 'actual-col';
        headerRow.appendChild(th);
      }
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
        const isPass = results[i].pass;
        tr.className = isPass ? 'row-pass' : 'row-fail';
        // Micro-celebration animation (skip for sandbox)
        if (!this.gameState.isSandboxMode) {
          tr.classList.add(isPass ? 'row-flash-pass' : 'row-flash-fail');
        }
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

      // Show actual outputs when failures exist
      if (hasFailures) {
        const actual = results && results[i] ? results[i].actualOutputs : [];
        for (let j = 0; j < level.outputs.length; j++) {
          const td = document.createElement('td');
          td.className = 'actual-col';
          const actualVal = actual[j] !== undefined ? actual[j] : '?';
          td.textContent = actualVal;
          if (results && results[i] && !results[i].pass) {
            const expected = row.outputs[j];
            td.style.color = actualVal !== expected ? '#f44' : '#0f0';
            td.style.fontWeight = actualVal !== expected ? 'bold' : 'normal';
          } else {
            td.style.color = '#555';
          }
          tr.appendChild(td);
        }
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
    const el = document.getElementById('status-text');
    if (el) {
      el.textContent = text;
    } else {
      document.getElementById('status-bar').textContent = text;
    }
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
    // Show completion time
    const gs = this.gameState;
    const elapsed = gs.timerStart ? Math.floor((Date.now() - gs.timerStart) / 1000) : 0;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = ` · ⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
    // Show timer now that we're done
    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.style.display = '';

    if (stars === 3) {
      msg.textContent = `Perfect! ${gateCount} gates (optimal)${timeStr}`;
    } else if (stars === 2) {
      msg.textContent = `Good! ${gateCount} gates (optimal: ${level.optimalGates})${timeStr}`;
    } else {
      msg.textContent = `Solved with ${gateCount} gates (optimal: ${level.optimalGates})${timeStr}`;
    }

    // Show post-solve insight for campaign levels
    const insightEl = document.getElementById('post-solve-insight');
    if (insightEl && level.postSolveInsight) {
      insightEl.textContent = level.postSolveInsight;
      insightEl.style.display = 'block';
    } else if (insightEl) {
      insightEl.style.display = 'none';
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
    document.getElementById('share-btn').style.display = 'none';
    const insightEl = document.getElementById('post-solve-insight');
    if (insightEl) insightEl.style.display = 'none';
  }

  showChallengeResult(gateCount, level) {
    const display = document.getElementById('star-display');
    display.style.display = 'block';

    const container = document.getElementById('stars-container');
    container.innerHTML = '';
    // Show a trophy instead of stars for challenges
    const trophy = document.createElement('span');
    trophy.className = 'star filled';
    trophy.textContent = '🏆';
    setTimeout(() => trophy.classList.add('visible'), 200);
    container.appendChild(trophy);

    const msg = document.getElementById('star-message');
    msg.textContent = `${level.difficulty} challenge solved with ${gateCount} gates!`;

    // Hide insight for challenge mode
    const insightEl = document.getElementById('post-solve-insight');
    if (insightEl) insightEl.style.display = 'none';

    // Show "New Challenge" button instead of "Next Level"
    const nextBtn = document.getElementById('next-level-btn');
    nextBtn.textContent = '🎲 New Challenge';
    nextBtn.style.display = 'inline-block';
    // Temporarily change behavior
    nextBtn.onclick = () => {
      nextBtn.textContent = 'Next Level →';
      nextBtn.onclick = null;
      this.gameState.showChallengeConfig();
    };
  }

  updateSandboxTruthTable(results) {
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
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of results) {
      const tr = document.createElement('tr');
      tr.className = 'row-pass';

      for (const val of row.inputs) {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      }
      for (const val of row.actualOutputs) {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  // ── Challenge Config ──
  setupChallengeConfig() {
    // Random Challenge button on level select
    document.getElementById('random-challenge-btn').addEventListener('click', () => {
      this.gameState.showChallengeConfig();
    });

    // Daily challenge button
    document.getElementById('daily-challenge-btn').addEventListener('click', () => {
      this.gameState.startDailyChallenge();
    });

    // Sandbox button on level select — show config screen
    document.getElementById('sandbox-btn').addEventListener('click', () => {
      this.gameState.showSandboxConfig();
    });

    // Challenge config back button
    document.getElementById('challenge-back-btn').addEventListener('click', () => {
      this.gameState.showLevelSelect();
    });

    // Sliders
    const inputSlider = document.getElementById('input-count-slider');
    const outputSlider = document.getElementById('output-count-slider');
    const inputLabel = document.getElementById('input-count-label');
    const outputLabel = document.getElementById('output-count-label');

    const updateDifficulty = () => {
      const ni = parseInt(inputSlider.value);
      const no = parseInt(outputSlider.value);
      inputLabel.textContent = ni;
      outputLabel.textContent = no;
      const label = getDifficultyLabel(ni, no);
      const badge = document.getElementById('difficulty-badge');
      badge.textContent = label;
      badge.className = label.toLowerCase();
      this.renderLeaderboard(ni, no);
    };

    inputSlider.addEventListener('input', updateDifficulty);
    outputSlider.addEventListener('input', updateDifficulty);

    // Generate button
    document.getElementById('generate-challenge-btn').addEventListener('click', () => {
      const ni = parseInt(inputSlider.value);
      const no = parseInt(outputSlider.value);
      this.gameState.startChallenge(ni, no);
    });

    // Clear leaderboard
    document.getElementById('clear-leaderboard-btn').addEventListener('click', () => {
      this.showConfirmModal('Clear all challenge scores?', () => {
        this.gameState.clearLeaderboard();
        const ni = parseInt(inputSlider.value);
        const no = parseInt(outputSlider.value);
        this.renderLeaderboard(ni, no);
      });
    });
  }

  renderLeaderboard(numInputs, numOutputs) {
    const container = document.getElementById('leaderboard-container');
    const key = `${numInputs}x${numOutputs}`;
    const scores = this.gameState.getLeaderboard(key);

    if (scores.length === 0) {
      container.innerHTML = '<div class="leaderboard-empty">No scores yet — complete a challenge!</div>';
      return;
    }

    container.innerHTML = '';
    scores.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-entry';

      const rank = document.createElement('span');
      rank.className = 'lb-rank';
      rank.textContent = `#${i + 1}`;

      const gates = document.createElement('span');
      gates.className = 'lb-gates';
      gates.textContent = `${entry.gates} gates`;

      const diff = document.createElement('span');
      diff.className = 'lb-difficulty';
      diff.textContent = entry.difficulty;

      const date = document.createElement('span');
      date.className = 'lb-date';
      date.textContent = new Date(entry.timestamp).toLocaleDateString();

      row.appendChild(rank);
      row.appendChild(gates);
      row.appendChild(diff);
      row.appendChild(date);
      container.appendChild(row);
    });
  }

  // ── How to Play ──
  setupHowToPlay() {
    const btn = document.getElementById('how-to-play-btn');
    const modal = document.getElementById('how-to-play-modal');
    const closeBtn = document.getElementById('how-to-play-close');

    if (btn) btn.addEventListener('click', () => modal.style.display = 'flex');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  // ── Share Button ──
  showShareButton(gateCount, stars, elapsed) {
    const btn = document.getElementById('share-btn');
    if (!btn) return;
    btn.style.display = '';
    btn.onclick = () => {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const starEmoji = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;

      // Daily streak tracking
      let streak = 0;
      try {
        const streakData = JSON.parse(localStorage.getItem('signal-circuit-daily-streak') || '{}');
        const todayKey = today.toISOString().slice(0, 10);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);

        if (streakData.lastDate === yesterdayKey) {
          streak = (streakData.count || 0) + 1;
        } else if (streakData.lastDate === todayKey) {
          streak = streakData.count || 1;
        } else {
          streak = 1;
        }
        localStorage.setItem('signal-circuit-daily-streak', JSON.stringify({ lastDate: todayKey, count: streak }));
      } catch (e) { streak = 1; }

      // Personal best comparison
      let pbText = '';
      try {
        const pb = JSON.parse(localStorage.getItem('signal-circuit-daily-pb') || '{}');
        const todayKey = today.toISOString().slice(0, 10);
        if (pb.date !== todayKey || !pb.gates) {
          pb.date = todayKey;
          pb.gates = gateCount;
          localStorage.setItem('signal-circuit-daily-pb', JSON.stringify(pb));
          pbText = '🆕 First attempt today!';
        } else if (gateCount < pb.gates) {
          pbText = `📉 New personal best! (was ${pb.gates} gates)`;
          pb.gates = gateCount;
          localStorage.setItem('signal-circuit-daily-pb', JSON.stringify(pb));
        } else if (gateCount === pb.gates) {
          pbText = '🎯 Matched personal best!';
        } else {
          pbText = `📊 Personal best: ${pb.gates} gates`;
        }
      } catch (e) {}

      const streakText = streak > 1 ? `\n🔥 ${streak}-day streak` : '';
      const text = `⚡ Signal Circuit — Daily Challenge\n📅 ${dateStr}\n${starEmoji} ${gateCount} gates | ⏱ ${mins}:${secs.toString().padStart(2, '0')}${streakText}\nhttps://mikedyan.github.io/signal-circuit/`;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = '📋 Share Result';
        }, 2000);
      }).catch(() => {
        btn.textContent = '⚠ Copy failed';
      });
    };
  }

  // ── Achievements ──
  setupAchievements() {
    const btn = document.getElementById('achievements-btn');
    const modal = document.getElementById('achievements-modal');
    const closeBtn = document.getElementById('achievements-close');

    if (btn) {
      btn.addEventListener('click', () => {
        this.renderAchievements();
        modal.style.display = 'flex';
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }
  }

  renderAchievements() {
    const list = document.getElementById('achievements-list');
    if (!list) return;
    const all = this.gameState.achievements.getAll();
    list.innerHTML = '';

    // Group by tier
    const tiers = ['gold', 'silver', 'bronze'];
    const tierLabels = { gold: '🥇 Gold', silver: '🥈 Silver', bronze: '🥉 Bronze' };

    for (const tier of tiers) {
      const tierAchs = all.filter(a => a.tier === tier);
      if (tierAchs.length === 0) continue;

      const header = document.createElement('div');
      header.className = 'achievement-tier-header';
      header.style.color = TIER_COLORS[tier] || '#888';
      header.textContent = tierLabels[tier];
      list.appendChild(header);

      for (const ach of tierAchs) {
        const row = document.createElement('div');
        row.className = 'achievement-row ' + (ach.unlocked ? 'unlocked' : 'locked');
        row.style.borderLeftColor = ach.tierColor;
        row.innerHTML = `
          <span class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</span>
          <div class="achievement-info">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
          </div>
        `;
        list.appendChild(row);
      }
    }
  }

  // ── Chapter Complete Modal ──
  showChapterCompleteModal(chapter) {
    const modal = document.getElementById('chapter-complete-modal');
    if (!modal) return;

    const icons = { 1: '🛸', 2: '📡', 3: '🌬️' };
    document.getElementById('chapter-complete-icon').textContent = icons[chapter.id] || '⚡';
    document.getElementById('chapter-complete-title').textContent = `${chapter.title} Complete!`;
    document.getElementById('chapter-complete-story').textContent = chapter.storyComplete || 'Chapter complete!';

    const gatesList = document.getElementById('chapter-gates-list');
    gatesList.innerHTML = '';
    if (chapter.gatesMastered) {
      for (const g of chapter.gatesMastered) {
        const badge = document.createElement('span');
        badge.className = 'chapter-gate-badge';
        badge.textContent = g;
        gatesList.appendChild(badge);
      }
    }

    modal.style.display = 'flex';

    const continueBtn = document.getElementById('chapter-complete-continue');
    const backBtn = document.getElementById('chapter-complete-back');

    const cleanup = () => { modal.style.display = 'none'; };

    continueBtn.onclick = () => {
      cleanup();
      // Start next chapter's first level if available
      const nextChapter = getChapters().find(c => c.id === chapter.id + 1);
      if (nextChapter && nextChapter.levels.length > 0) {
        this.gameState.startLevel(nextChapter.levels[0]);
      } else {
        this.gameState.showLevelSelect();
      }
    };
    backBtn.onclick = () => {
      cleanup();
      this.gameState.showLevelSelect();
    };
  }

  showAchievementToasts(newlyUnlocked) {
    if (!newlyUnlocked || newlyUnlocked.length === 0) return;
    const allAchs = ACHIEVEMENTS;
    let delay = 0;
    for (const id of newlyUnlocked) {
      const ach = allAchs.find(a => a.id === id);
      if (!ach) continue;
      setTimeout(() => {
        const toast = document.getElementById('achievement-toast');
        if (!toast) return;
        this.gameState.audio.playAchievement();
        toast.innerHTML = `${ach.icon} <strong>${ach.name}</strong> unlocked!`;
        toast.style.display = 'block';
        // Reset animation
        toast.style.animation = 'none';
        void toast.offsetWidth;
        toast.style.animation = 'toastSlideIn 0.4s ease, toastSlideOut 0.4s ease 2.6s forwards';
        setTimeout(() => toast.style.display = 'none', 3100);
      }, delay);
      delay += 3200;
    }
  }

  // ── Shortcuts Overlay ──
  setupShortcutsOverlay() {
    const btn = document.getElementById('shortcuts-btn');
    const overlay = document.getElementById('shortcuts-overlay');
    const closeBtn = document.getElementById('shortcuts-close');

    if (btn) {
      btn.addEventListener('click', () => {
        overlay.style.display = 'flex';
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    }
    // Escape key closes overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
        overlay.style.display = 'none';
      }
    });
  }

  // ── Progress Bar ──
  updateProgressBar(progress) {
    const totalLevels = getLevelCount();
    let completed = 0;
    let totalStars = 0;

    for (const [id, data] of Object.entries(progress.levels || {})) {
      if (data.completed) completed++;
      totalStars += data.stars || 0;
    }

    const pctComplete = totalLevels > 0 ? (completed / totalLevels) * 100 : 0;

    const textEl = document.getElementById('progress-text');
    const starsEl = document.getElementById('progress-stars');
    const fillEl = document.getElementById('progress-fill');

    if (textEl) textEl.textContent = `${completed}/${totalLevels} Levels`;
    if (starsEl) starsEl.textContent = `⭐ ${totalStars}`;
    if (fillEl) fillEl.style.width = pctComplete + '%';
  }

  // ── Onboarding ──
  setupOnboarding() {
    const dismissBtn = document.getElementById('tooltip-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.dismissOnboarding());
    }
  }

  showOnboarding() {
    try {
      if (localStorage.getItem('signal-circuit-onboarded') === 'true') return;
    } catch (e) {}

    const tooltip = document.getElementById('onboarding-tooltip');
    if (!tooltip) return;

    const text = document.getElementById('tooltip-text');
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    text.textContent = isMobile ? 'Tap a pin to start drawing a wire' : 'Click a pin to start drawing a wire';
    tooltip.style.display = 'block';
  }

  dismissOnboarding() {
    const tooltip = document.getElementById('onboarding-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    try {
      localStorage.setItem('signal-circuit-onboarded', 'true');
    } catch (e) {}
  }

  // ── Hint Button Sync ──
  updateHintButton() {
    const gs = this.gameState;
    const level = gs.currentLevel;
    const hintBtn = document.getElementById('hint-btn');
    if (!hintBtn) return;

    if (!level || !level.hints || level.hints.length === 0 || gs.isSandboxMode || gs.isChallengeMode) {
      hintBtn.style.display = 'none';
      return;
    }

    hintBtn.style.display = '';
    if (gs.hintsUsed >= level.hints.length) {
      hintBtn.disabled = true;
      hintBtn.textContent = '💡 No more hints';
    } else if (gs.hintsUsed === 0) {
      hintBtn.disabled = false;
      hintBtn.textContent = '💡 Hint';
    } else {
      hintBtn.disabled = false;
      hintBtn.textContent = `💡 Hint ${gs.hintsUsed + 1}/${level.hints.length}`;
    }
  }

  // ── Hint Display ──
  showHint(text, hintNum, totalHints, isVisualHint) {
    const el = document.getElementById('hint-display');
    if (!el) return;
    const visualTag = isVisualHint ? '<div class="hint-visual-tag">👁 Look at the highlighted pins on the board</div>' : '';
    el.innerHTML = `<div class="hint-label">Hint ${hintNum}/${totalHints}</div>${text}${visualTag}`;
    el.style.display = 'block';
  }

  // ── Gate Count Indicator (real-time during gameplay) ──
  updateGateIndicator() {
    const el = document.getElementById('gate-indicator');
    if (!el) return;

    const gs = this.gameState;
    const level = gs.currentLevel;
    if (!level || gs.isSandboxMode) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'flex';
    const count = gs.gates.length;
    const countText = document.getElementById('gate-count-text');
    const starsPreview = document.getElementById('gate-stars-preview');

    if (level.isChallenge || level.isDaily) {
      // Challenge/daily: show count only, no optimal
      countText.innerHTML = `Gates: <span class="count">${count}</span>`;
      starsPreview.innerHTML = '';
      el.className = count > 0 ? 'optimal' : '';
    } else {
      // Campaign: show count vs optimal + projected stars
      const optimal = level.optimalGates;
      const good = level.goodGates;
      countText.innerHTML = `Gates: <span class="count">${count}</span>/${optimal}`;

      // Projected stars
      let rawStars = 0;
      let projectedStars = 0;
      if (count > 0) {
        if (count <= optimal) rawStars = 3;
        else if (count <= good) rawStars = 2;
        else rawStars = 1;

        projectedStars = rawStars;
        // Apply hint penalty preview
        if (gs.maxHintPenalty >= 2) projectedStars = Math.min(projectedStars, 1);
        else if (gs.maxHintPenalty >= 1) projectedStars = Math.min(projectedStars, 2);
      }

      let starsHtml = '';
      for (let i = 0; i < 3; i++) {
        if (i < projectedStars) {
          starsHtml += '<span class="star-gold">★</span>';
        } else if (i < rawStars) {
          // Would have earned this star but hint penalty blocks it
          starsHtml += '<span class="star-blocked">★</span>';
        } else {
          starsHtml += '<span class="star-dim">★</span>';
        }
      }
      starsPreview.innerHTML = starsHtml;

      // Style class
      el.className = count <= optimal ? 'optimal' : count <= good ? 'good' : 'over';
    }

    // Update hint penalty display
    this.updateHintPenalty();
  }

  updateHintPenalty() {
    const penaltyEl = document.getElementById('hint-penalty');
    if (!penaltyEl) return;

    const gs = this.gameState;
    const level = gs.currentLevel;

    // Only show for campaign levels with hints
    if (!level || gs.isSandboxMode || gs.isChallengeMode || !level.hints || level.hints.length === 0) {
      penaltyEl.style.display = 'none';
      return;
    }

    if (gs.hintsUsed === 0) {
      // Before hints used: show clear warning
      penaltyEl.textContent = '💡 Using hints reduces max ★';
      penaltyEl.style.display = 'block';
      penaltyEl.style.color = '#cc0';
      penaltyEl.style.fontSize = '10px';
    } else {
      // After hints used: show penalty
      if (gs.maxHintPenalty >= 2) {
        penaltyEl.textContent = '⚠ Max ★ with hints';
      } else if (gs.maxHintPenalty >= 1) {
        penaltyEl.textContent = '⚠ Max ★★ with hints';
      } else {
        // First hint is free — show mild reminder
        penaltyEl.textContent = '💡 First hint free — next reduces ★';
        penaltyEl.style.display = 'block';
        penaltyEl.style.color = '#aa0';
        penaltyEl.style.fontSize = '10px';
        return;
      }
      penaltyEl.style.display = 'block';
      penaltyEl.style.color = '#f90';
      penaltyEl.style.fontSize = '11px';
    }
  }

  // ── Gate Count Display (legacy for sandbox) ──
  updateGateCount() {
    const el = document.getElementById('gate-count-display');
    if (el) {
      el.innerHTML = `Gates used: <span>${this.gameState.gates.length}</span>`;
    }
  }

  // ── Celebration Particles ──
  startCelebration(stars = 2) {
    this.celebrationActive = true;
    this.celebrationParticles = [];

    // Scale effects by star rating (amplified for Day 22 juice)
    const particleCount = stars === 3 ? 180 : stars === 2 ? 100 : 45;
    const useFlash = stars >= 2;
    const flashDuration = stars === 3 ? 900 : 600;

    // Victory flash
    if (useFlash) {
      const flash = document.getElementById('victory-flash');
      if (flash) {
        flash.classList.remove('flash-active');
        void flash.offsetWidth;
        flash.classList.add('flash-active');
        setTimeout(() => flash.classList.remove('flash-active'), flashDuration);
      }
    }

    // Animate star display
    const starDisplay = document.getElementById('star-display');
    if (starDisplay) {
      starDisplay.classList.remove('star-animate');
      void starDisplay.offsetWidth;
      starDisplay.classList.add('star-animate');
    }

    // Pulse result display
    const resultDisplay = document.getElementById('result-display');
    if (resultDisplay) {
      resultDisplay.classList.remove('result-pulse');
      void resultDisplay.offsetWidth;
      resultDisplay.classList.add('result-pulse');
    }

    const canvas = document.getElementById('celebration-canvas');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Star-based color palettes
    let colors;
    if (stars === 3) {
      // Gold-heavy for 3 stars
      colors = ['#ffd700', '#ffa500', '#ffcc00', '#fff4a3', '#ffe066', '#ffd700', '#ffd700'];
    } else if (stars === 2) {
      // Full colors for 2 stars
      colors = ['#ffd700', '#ff4444', '#0f0', '#00c8e8', '#c050f0', '#ff8800', '#fff'];
    } else {
      // Muted colors for 1 star
      colors = ['#999', '#777', '#aaa', '#ffd700', '#888'];
    }

    const shapes = ['rect', 'circle', 'triangle'];

    // Create particles with varied shapes
    for (let i = 0; i < particleCount; i++) {
      this.celebrationParticles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 3,
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
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
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
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
