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
    this.setupChallengeConfig();
    this.setupOnboarding();
    this.setupShortcutsOverlay();
    this.setupAchievements();
    this.setupHowToPlay();
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
    const screens = ['level-select-screen', 'gameplay-screen', 'challenge-config-screen'];
    for (const id of screens) {
      const el = document.getElementById(id);
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
    document.getElementById('share-btn').style.display = 'none';
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

    // Sandbox button on level select
    document.getElementById('sandbox-btn').addEventListener('click', () => {
      this.gameState.startSandbox();
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
      if (confirm('Clear all challenge scores?')) {
        this.gameState.clearLeaderboard();
        const ni = parseInt(inputSlider.value);
        const no = parseInt(outputSlider.value);
        this.renderLeaderboard(ni, no);
      }
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
      const text = `⚡ Signal Circuit — Daily Challenge\n📅 ${dateStr}\n${starEmoji} ${gateCount} gates | ⏱ ${mins}:${secs.toString().padStart(2, '0')}\nhttps://mikedyan.github.io/signal-circuit/`;
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
    for (const ach of all) {
      const row = document.createElement('div');
      row.className = 'achievement-row ' + (ach.unlocked ? 'unlocked' : 'locked');
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

  // ── Hint Display ──
  showHint(text, hintNum, totalHints) {
    const el = document.getElementById('hint-display');
    if (!el) return;
    el.innerHTML = `<div class="hint-label">Hint ${hintNum}/${totalHints}</div>${text}`;
    el.style.display = 'block';
  }

  // ── Gate Count Display (for sandbox and challenges) ──
  updateGateCount() {
    const el = document.getElementById('gate-count-display');
    if (el) {
      el.innerHTML = `Gates used: <span>${this.gameState.gates.length}</span>`;
    }
  }

  // ── Celebration Particles ──
  startCelebration() {
    this.celebrationActive = true;
    this.celebrationParticles = [];

    // Victory flash
    const flash = document.getElementById('victory-flash');
    if (flash) {
      flash.classList.remove('flash-active');
      void flash.offsetWidth;
      flash.classList.add('flash-active');
      setTimeout(() => flash.classList.remove('flash-active'), 600);
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

    const colors = ['#ffd700', '#ff4444', '#0f0', '#00c8e8', '#c050f0', '#ff8800', '#fff'];
    const shapes = ['rect', 'circle', 'triangle'];

    // Create more particles with varied shapes
    for (let i = 0; i < 90; i++) {
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
