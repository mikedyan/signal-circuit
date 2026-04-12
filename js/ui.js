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
    this.setupEncyclopedia();
    this.setupStatsDashboard();
    this.setupMilestoneModal();
    this.setupGhostToggle();
    this.setupFontSizeToggle();
    this.setupJourneyModal();
    this.setupLevelCreator();
    this.setupMasteryTree();
    this.setupCircuitCollection();
    this.setupLogicProfile();
    this.setupShareCard();
    this.setupPlacementTest();
    this.setupCompetitiveModes(); // Day 32
    this.applySeasonalTheme(); // Day 32 T4
    this.setupSimplifiedVisual(); // Day 33 T4
    this.setupSyncButtons(); // Day 33 T8
    this.setupAccessibleWiring(); // Day 33 T9
    this.setupLightMode(); // Day 35 T5
    this.setupUndoTimeline(); // Day 35 T6
    this.setupCosmeticModal(); // Day 40
    this.setupDailyScreen(); // Day 44
    this.updateDailyButtonBadge(); // Day 44
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

  // ── Font Size Toggle ──
  setupFontSizeToggle() {
    const btn = document.getElementById('fontsize-toggle-btn');
    if (!btn) return;

    const sizes = ['normal', 'large', 'x-large'];
    const labels = { normal: '🔤 Text: Normal', large: '🔤 Text: Large', 'x-large': '🔤 Text: X-Large' };

    let currentSize = 'normal';
    try {
      const saved = localStorage.getItem('signal-circuit-fontsize');
      if (saved && sizes.includes(saved)) currentSize = saved;
    } catch (e) {}

    const applySize = (size) => {
      document.body.classList.remove('fontsize-normal', 'fontsize-large', 'fontsize-x-large');
      document.body.classList.add('fontsize-' + size);
      btn.textContent = labels[size];
    };

    applySize(currentSize);

    btn.addEventListener('click', () => {
      const idx = sizes.indexOf(currentSize);
      currentSize = sizes[(idx + 1) % sizes.length];
      applySize(currentSize);
      try { localStorage.setItem('signal-circuit-fontsize', currentSize); } catch (e) {}
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
        const isPureLogic = levelProgress && levelProgress.pureLogic; // T8
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
          // T8: Pure Logic badge (no hints used)
          if (isPureLogic) {
            const pl = document.createElement('span');
            pl.className = 'pure-logic-badge';
            pl.textContent = '🧠';
            pl.title = 'Solved without hints';
            stars.appendChild(pl);
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

        // T8: Difficulty badge with emoji
        const diffLabel = document.createElement('span');
        diffLabel.className = 'level-difficulty';
        const optGates = level.optimalGates || 1;
        if (optGates <= 2) {
          diffLabel.textContent = '🟢 Easy';
          diffLabel.classList.add('diff-easy');
        } else if (optGates <= 4) {
          diffLabel.textContent = '🟡 Med';
          diffLabel.classList.add('diff-medium');
        } else {
          diffLabel.textContent = '🔴 Hard';
          diffLabel.classList.add('diff-hard');
        }
        btn.appendChild(diffLabel);

        // Day 43: Level preview thumbnail for completed levels
        if (isCompleted) {
          const previewData = this.gameState.getPreview(levelId);
          if (previewData) {
            const previewCanvas = document.createElement('canvas');
            previewCanvas.className = 'level-preview-canvas';
            previewCanvas.width = 240;
            previewCanvas.height = 160;
            previewCanvas.style.width = '120px';
            previewCanvas.style.height = '80px';
            previewCanvas.dataset.levelId = levelId;
            btn.appendChild(previewCanvas);

            // Lazy render via IntersectionObserver
            if (!this._previewObserver) {
              this._previewObserver = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                  if (entry.isIntersecting) {
                    const canvas = entry.target;
                    const lid = parseInt(canvas.dataset.levelId);
                    if (lid && !canvas.dataset.rendered) {
                      canvas.dataset.rendered = 'true';
                      this._renderPreviewCanvas(canvas, lid);
                    }
                    this._previewObserver.unobserve(canvas);
                  }
                }
              }, { rootMargin: '100px' });
            }
            this._previewObserver.observe(previewCanvas);

            // Hover/tap to enlarge
            previewCanvas.addEventListener('mouseenter', (e) => {
              e.stopPropagation();
              this._showEnlargedPreview(previewCanvas, levelId, e);
            });
            previewCanvas.addEventListener('mouseleave', () => {
              this._hideEnlargedPreview();
            });
            previewCanvas.addEventListener('click', (e) => {
              e.stopPropagation();
              if (this._enlargedPreview && this._enlargedPreview.style.display !== 'none') {
                this._hideEnlargedPreview();
              } else {
                this._showEnlargedPreview(previewCanvas, levelId, e);
              }
            });
          }

          // View Solution button
          const viewSolBtn = document.createElement('button');
          viewSolBtn.className = 'view-solution-btn';
          viewSolBtn.textContent = '👁 Solution';
          viewSolBtn.title = 'View your solution with ghost overlay';
          viewSolBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.gameState.startLevel(levelId);
            // Enable ghost overlay after level loads
            setTimeout(() => {
              if (this.gameState.ghostOverlay) {
                this.gameState.showGhost = true;
                this.gameState.markDirty();
              }
            }, 200);
          });
          btn.appendChild(viewSolBtn);

          // Day 45: Gate Limit Challenge sub-row for 3-starred levels
          if (levelProgress && levelProgress.stars === 3) {
            const glBtn = document.createElement('button');
            glBtn.className = 'gate-limit-btn' + (levelProgress.gateLimitCompleted ? ' gl-completed' : '');
            glBtn.innerHTML = levelProgress.gateLimitCompleted
              ? '<span class="gl-diamond">⬦</span> Gate Limit ✓'
              : '<span class="gl-trophy">🏆</span> Gate Limit';
            glBtn.title = `Solve with exactly ${level.optimalGates} gate${level.optimalGates === 1 ? '' : 's'}`;
            glBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.gameState.startGateLimitLevel(levelId);
            });
            btn.appendChild(glBtn);
          }
        }

        if (isUnlocked) {
          btn.addEventListener('click', () => {
            this.gameState.startLevel(levelId);
          });
          // T6: Hover tick on level buttons
          btn.addEventListener('mouseenter', () => {
            this.gameState.audio.playHoverTick();
          });
        }

        // Day 34 T6: Level select micro-interactions
        // Staggered fade-in
        const btnIdx = chapter.levels.indexOf(levelId);
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(8px)';
        setTimeout(() => {
          btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          btn.style.opacity = '1';
          btn.style.transform = 'translateY(0)';
        }, 40 * btnIdx);

        // Pulse glow on newly-unlocked but incomplete levels
        if (isUnlocked && !isCompleted) {
          btn.classList.add('level-new-pulse');
        }

        grid.appendChild(btn);
      }

      chapterDiv.appendChild(grid);
      container.appendChild(chapterDiv);
    }

    // Day 32 T10: Render spaced repetition review section
    this.renderReviewSection();
  }

  showScreen(screen) {
    const screens = ['level-select-screen', 'gameplay-screen', 'challenge-config-screen', 'sandbox-config-screen', 'creator-config-screen', 'daily-config-screen'];
    // T6: Play transition whoosh on screen change
    if (this.gameState.audio) this.gameState.audio.playTransitionWhoosh();

    // #92: Determine transition direction
    const fromScreen = this._currentScreen || 'level-select';
    this._currentScreen = screen;
    const isZoomIn = fromScreen === 'level-select' && screen === 'gameplay';
    const isZoomOut = fromScreen === 'gameplay' && screen === 'level-select';

    for (const id of screens) {
      const el = document.getElementById(id);
      if (!el) continue;
      const shouldShow = id === screen + '-screen';
      if (shouldShow) {
        el.style.display = 'flex';
        // #92: Apply directional enter animation
        el.classList.remove('screen-enter', 'screen-zoom-in', 'screen-zoom-out', 'screen-active');
        if (isZoomIn) {
          el.classList.add('screen-zoom-in');
        } else if (isZoomOut) {
          el.classList.add('screen-zoom-out');
        } else {
          el.classList.add('screen-enter');
        }
        void el.offsetWidth;
        el.classList.remove('screen-enter', 'screen-zoom-in', 'screen-zoom-out');
        el.classList.add('screen-active');
      } else {
        el.style.display = 'none';
        el.classList.remove('screen-enter', 'screen-zoom-in', 'screen-zoom-out', 'screen-active');
      }
    }
  }

  setupBackButton() {
    document.getElementById('back-btn').addEventListener('click', () => {
      // Day 32: Handle blitz and speedrun back
      if (this.gameState.blitzMode) {
        this.gameState.stopBlitzMode();
      } else if (this.gameState.speedrunMode) {
        this.gameState.stopSpeedrunMode();
      } else if (this.gameState.isChallengeMode) {
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
      el.style.borderLeftColor = def.color;
      el.style.color = def.color;

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

      // T7: Toolbox hover sound (throttled)
      el.addEventListener('mouseenter', () => {
        const now = Date.now();
        if (!this._lastToolboxHoverTime || now - this._lastToolboxHoverTime > 120) {
          this.gameState.audio.playToolboxHover(gateType);
          this._lastToolboxHoverTime = now;
        }
      });

      el.addEventListener('mousedown', (e) => this.startToolboxDrag(e, gateType));
      el.addEventListener('touchstart', (e) => this.startToolboxDragTouch(e, gateType), { passive: false });
      this.gateContainer.appendChild(el);
    }
  }

  // Day 34 T3: Enhanced drag ghost with gate preview
  _buildDragGhost(gateType) {
    const def = GateTypes[gateType];
    this.dragGhost.innerHTML = '';
    this.dragGhost.style.borderColor = def.color;
    this.dragGhost.style.color = def.color;

    const label = document.createElement('span');
    label.textContent = def.name;
    label.style.fontWeight = 'bold';
    this.dragGhost.appendChild(label);

    const dots = document.createElement('div');
    dots.style.display = 'flex';
    dots.style.justifyContent = 'space-between';
    dots.style.marginTop = '4px';
    dots.style.gap = '3px';
    dots.style.alignItems = 'center';
    for (let i = 0; i < def.inputs; i++) {
      const d = document.createElement('span');
      d.style.cssText = 'width:5px;height:5px;background:#888;border-radius:50%;display:inline-block;';
      dots.appendChild(d);
    }
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.style.cssText = 'color:#666;font-size:9px;margin:0 2px;';
    dots.appendChild(arrow);
    for (let i = 0; i < def.outputs; i++) {
      const d = document.createElement('span');
      d.style.cssText = `width:5px;height:5px;background:${def.color};border-radius:50%;display:inline-block;`;
      dots.appendChild(d);
    }
    this.dragGhost.appendChild(dots);
  }

  startToolboxDrag(e, gateType) {
    e.preventDefault();
    this.isDragging = true;
    this.dragType = gateType;

    this._buildDragGhost(gateType);
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
      const sx = e2.clientX - rect.left;
      const sy = e2.clientY - rect.top;

      if (sx >= 0 && sy >= 0 && sx <= rect.width && sy <= rect.height) {
        const world = this.gameState.renderer.screenToWorld(sx, sy);
        const gridSize = 20;
        const snappedX = Math.round(world.x / gridSize) * gridSize - GateTypes[gateType].width / 2;
        const snappedY = Math.round(world.y / gridSize) * gridSize - GateTypes[gateType].height / 2;
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
    this._buildDragGhost(gateType);
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
      const sx = t.clientX - rect.left;
      const sy = t.clientY - rect.top;

      if (sx >= 0 && sy >= 0 && sx <= rect.width && sy <= rect.height) {
        const world = this.gameState.renderer.screenToWorld(sx, sy);
        const gridSize = 20;
        const snappedX = Math.round(world.x / gridSize) * gridSize - GateTypes[gateType].width / 2;
        const snappedY = Math.round(world.y / gridSize) * gridSize - GateTypes[gateType].height / 2;
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
      document.getElementById('run-btn').textContent = '🔍 TEST';
    } else if (level.isChallenge) {
      document.getElementById('level-title').textContent = `🎲 ${level.title}`;
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = true;
      document.getElementById('next-level').disabled = true;
      document.getElementById('run-btn').textContent = '▶ RUN';
    } else if (level.isDaily) {
      document.getElementById('level-title').textContent = `📅 ${level.title}`;
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = true;
      document.getElementById('next-level').disabled = true;
      document.getElementById('run-btn').textContent = '▶ RUN';
    } else {
      // T8: Show difficulty badge in level title
      const optGates = level.optimalGates || 1;
      const diffBadge = optGates <= 2 ? '🟢' : optGates <= 4 ? '🟡' : '🔴';
      let titleText = `${diffBadge} Level ${level.id}: ${level.title}`;
      // Day 33 T2: Phase indicator for multi-phase levels
      if (this.gameState.isMultiPhase && level.phases) {
        titleText += ` (Phase ${this.gameState.currentPhase + 1}/${level.phases.length})`;
      }
      document.getElementById('level-title').textContent = titleText;
      document.getElementById('level-desc').textContent = level.description;
      document.getElementById('prev-level').disabled = level.id <= 1;
      document.getElementById('next-level').disabled = level.id >= getLevelCount();
      document.getElementById('run-btn').textContent = '▶ RUN';
    }

    // #91: Cross-level "Used In" forward references
    const usedInEl = document.getElementById('used-in-refs');
    if (usedInEl) {
      if (level.id && !level.isSandbox && !level.isChallenge && !level.isDaily) {
        const refs = getForwardReferences(level.id);
        if (refs.length > 0) {
          const refList = refs.slice(0, 8).map(id => `L${id}`).join(', ');
          const extra = refs.length > 8 ? ` +${refs.length - 8} more` : '';
          usedInEl.textContent = `Used in: ${refList}${extra}`;
          usedInEl.style.display = 'block';
        } else {
          usedInEl.textContent = '';
          usedInEl.style.display = 'none';
        }
      } else {
        usedInEl.style.display = 'none';
      }
    }
  }

  // ── Truth Table ──
  // ── Day 39: Truth Table State ──
  _ttState() {
    if (!this._ttS) {
      this._ttS = {
        sortCol: -1,
        sortAsc: true,
        compactMode: false,
        keyRowsMode: false,
        lastResults: null,
      };
    }
    return this._ttS;
  }

  _ttResetState() {
    this._ttS = null;
  }

  // ── Truth Table (Day 39 Enhanced) ──
  updateTruthTable(results, traces) {
    const level = this.gameState.currentLevel;
    if (!level) return;

    const tts = this._ttState();
    if (results) tts.lastResults = results;
    if (traces !== undefined) tts.lastTraces = traces;
    // T4: Auto-enable key rows for 4-input levels on first render (no results yet)
    if (!results && !tts._initialized && level.inputs.length >= 4) {
      tts.keyRowsMode = true;
    }
    tts._initialized = true;

    const table = document.getElementById('truth-table');
    table.innerHTML = '';

    // Auto-compact for wide truth tables (7+ columns)
    const totalCols = level.inputs.length + level.outputs.length;
    table.classList.toggle('compact-table', totalCols >= 7);

    // T1/T4: Controls bar above table (compact mode, key rows)
    this._renderTTControls(level, results);

    // Build row data with original indices
    let rows = level.truthTable.map((row, i) => ({
      row,
      idx: i,
      result: results ? results[i] : null,
    }));

    // T3: Apply column sorting
    if (tts.sortCol >= 0) {
      const col = tts.sortCol;
      const numInputs = level.inputs.length;
      rows = rows.slice().sort((a, b) => {
        let va, vb;
        if (col < numInputs) {
          va = a.row.inputs[col];
          vb = b.row.inputs[col];
        } else {
          va = a.row.outputs[col - numInputs];
          vb = b.row.outputs[col - numInputs];
        }
        return tts.sortAsc ? va - vb : vb - va;
      });
    }

    // T1: Compact mode — show only failing rows
    if (tts.compactMode && results) {
      const hasFailures = rows.some(r => r.result && !r.result.pass);
      if (hasFailures) {
        rows = rows.filter(r => r.result && !r.result.pass);
      }
    }

    // T4: Key rows mode for 4-input levels
    if (tts.keyRowsMode && level.inputs.length >= 4 && !tts.compactMode) {
      rows = this._filterKeyRows(rows, level);
    }

    // Build thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // T5: Decimal index column header
    const thIdx = document.createElement('th');
    thIdx.textContent = '#';
    thIdx.className = 'tt-decimal-col';
    headerRow.appendChild(thIdx);

    const numInputs = level.inputs.length;
    const hasFailures = results && results.some(r => !r.pass);

    for (let c = 0; c < level.inputs.length; c++) {
      const th = document.createElement('th');
      th.textContent = level.inputs[c].label;
      th.className = 'tt-sortable';
      if (tts.sortCol === c) {
        const arrow = document.createElement('span');
        arrow.className = 'tt-sort-arrow';
        arrow.textContent = tts.sortAsc ? '▲' : '▼';
        th.appendChild(arrow);
      }
      const colIdx = c;
      th.addEventListener('click', () => this._ttToggleSort(colIdx));
      headerRow.appendChild(th);
    }
    for (let c = 0; c < level.outputs.length; c++) {
      const th = document.createElement('th');
      th.textContent = level.outputs[c].label;
      th.style.color = '#f88';
      th.className = 'tt-sortable';
      const colIdx = numInputs + c;
      if (tts.sortCol === colIdx) {
        const arrow = document.createElement('span');
        arrow.className = 'tt-sort-arrow';
        arrow.textContent = tts.sortAsc ? '▲' : '▼';
        th.appendChild(arrow);
      }
      th.addEventListener('click', () => this._ttToggleSort(colIdx));
      headerRow.appendChild(th);
    }

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

    // Build tbody
    const tbody = document.createElement('tbody');
    const isTouchDevice = this.isTouchDevice;
    const gs = this.gameState;

    for (const entry of rows) {
      const { row, idx, result } = entry;
      const tr = document.createElement('tr');
      tr.dataset.rowIdx = idx;

      if (result) {
        const isPass = result.pass;
        tr.className = isPass ? 'row-pass' : 'row-fail';
        if (!gs.isSandboxMode) {
          tr.classList.add(isPass ? 'row-flash-pass' : 'row-flash-fail');
        }
      }

      // T5: Decimal index cell
      const tdIdx = document.createElement('td');
      tdIdx.className = 'tt-decimal-col';
      tdIdx.textContent = idx;
      tr.appendChild(tdIdx);

      // T6: Color-coded input cells with T5 tooltip
      const decimalVal = row.inputs.reduce((acc, v, i) => acc + (v << (row.inputs.length - 1 - i)), 0);
      for (let c = 0; c < row.inputs.length; c++) {
        const val = row.inputs[c];
        const td = document.createElement('td');
        td.textContent = val;
        td.className = val ? 'tt-val-1' : 'tt-val-0';
        td.title = `${level.inputs.map((inp, i) => `${inp.label}=${row.inputs[i]}`).join(',')} = ${decimalVal}`;
        tr.appendChild(td);
      }

      // T6: Color-coded output cells
      for (const val of row.outputs) {
        const td = document.createElement('td');
        td.textContent = val;
        td.className = val ? 'tt-val-1' : 'tt-val-0';
        tr.appendChild(td);
      }

      // Actual outputs when failures exist
      if (hasFailures) {
        const actual = result ? result.actualOutputs : [];
        for (let j = 0; j < level.outputs.length; j++) {
          const td = document.createElement('td');
          td.className = 'actual-col';
          const actualVal = actual[j] !== undefined ? actual[j] : '?';
          td.textContent = actualVal;
          if (result && !result.pass) {
            const expected = row.outputs[j];
            td.style.color = actualVal !== expected ? '#f44' : '#0f0';
            td.style.fontWeight = actualVal !== expected ? 'bold' : 'normal';
          } else {
            td.style.color = '#555';
          }
          tr.appendChild(td);
        }
      }

      if (result) {
        const td = document.createElement('td');
        td.textContent = result.pass ? '✓' : '✗';
        td.style.color = result.pass ? '#0f0' : '#f44';
        tr.appendChild(td);
      }

      // T2: Row hover → highlight input nodes on canvas
      tr.addEventListener('mouseenter', () => {
        gs._highlightedInputRow = row.inputs;
        gs.markDirty();
      });
      tr.addEventListener('mouseleave', () => {
        gs._highlightedInputRow = null;
        gs.markDirty();
      });

      // T10: Mobile tap → set input values for live testing
      if (isTouchDevice) {
        tr.addEventListener('click', () => {
          for (let n = 0; n < gs.inputNodes.length && n < row.inputs.length; n++) {
            gs.inputNodes[n].value = row.inputs[n];
          }
          gs._propagateLiveSignals();
          gs.audio.playClick();
          // Brief highlight feedback
          tr.classList.add('tt-tapped');
          setTimeout(() => tr.classList.remove('tt-tapped'), 400);
        });
      }

      tbody.appendChild(tr);

      // Day 42 T3: Expandable error trace for failing rows
      if (result && !result.pass) {
        const allTraces = tts.lastTraces;
        const rowTraces = allTraces ? allTraces[idx] : null;
        if (rowTraces && rowTraces.length > 0) {
          const traceTr = document.createElement('tr');
          traceTr.className = 'error-trace-row';
          const traceTd = document.createElement('td');
          traceTd.colSpan = 100;
          traceTd.innerHTML = this._buildTraceHtml(rowTraces, idx);
          traceTr.appendChild(traceTd);
          tbody.appendChild(traceTr);
        }
      }
    }
    table.appendChild(tbody);

    // T7: Show/hide Focus Failed Rows button
    this._updateFocusFailedBtn(results);
  }

  // T1/T4: Render truth table control buttons
  _renderTTControls(level, results) {
    const section = document.getElementById('truth-table-section');
    let controls = document.getElementById('tt-controls');
    if (controls) controls.remove();

    const numRows = level.truthTable.length;
    const tts = this._ttState();

    // Only show controls if table has 8+ rows
    if (numRows < 8) return;

    controls = document.createElement('div');
    controls.id = 'tt-controls';

    // T1: Compact mode toggle
    const compactBtn = document.createElement('button');
    compactBtn.textContent = tts.compactMode ? 'All Rows' : 'Failing Only';
    if (tts.compactMode) compactBtn.classList.add('tt-active');
    compactBtn.addEventListener('click', () => {
      tts.compactMode = !tts.compactMode;
      if (tts.compactMode) tts.keyRowsMode = false;
      this.updateTruthTable(tts.lastResults);
    });
    controls.appendChild(compactBtn);

    // T4: Key rows mode for 4-input levels
    if (level.inputs.length >= 4) {
      const keyBtn = document.createElement('button');
      keyBtn.textContent = tts.keyRowsMode ? 'Show All' : 'Key Rows';
      if (tts.keyRowsMode) keyBtn.classList.add('tt-active');
      keyBtn.addEventListener('click', () => {
        tts.keyRowsMode = !tts.keyRowsMode;
        if (tts.keyRowsMode) tts.compactMode = false;
        this.updateTruthTable(tts.lastResults);
      });
      controls.appendChild(keyBtn);
    }

    // Sort reset button if sorting is active
    if (tts.sortCol >= 0) {
      const resetBtn = document.createElement('button');
      resetBtn.textContent = '↺ Reset Sort';
      resetBtn.addEventListener('click', () => {
        tts.sortCol = -1;
        tts.sortAsc = true;
        this.updateTruthTable(tts.lastResults);
      });
      controls.appendChild(resetBtn);
    }

    // Insert controls before the table wrapper
    const wrapper = document.getElementById('truth-table-wrapper');
    section.insertBefore(controls, wrapper);
  }

  // T3: Toggle sort on column click
  _ttToggleSort(colIdx) {
    const tts = this._ttState();
    if (tts.sortCol === colIdx) {
      tts.sortAsc = !tts.sortAsc;
    } else {
      tts.sortCol = colIdx;
      tts.sortAsc = true;
    }
    this.updateTruthTable(tts.lastResults);
  }

  // T4: Filter to key rows (first, last, output-change boundaries, failing)
  _filterKeyRows(rows, level) {
    if (rows.length <= 6) return rows; // Not worth filtering
    const keySet = new Set();
    keySet.add(0); // First
    keySet.add(rows.length - 1); // Last

    // Rows where output changes from previous
    for (let i = 1; i < rows.length; i++) {
      const prevOut = rows[i - 1].row.outputs;
      const currOut = rows[i].row.outputs;
      if (prevOut.some((v, j) => v !== currOut[j])) {
        keySet.add(i);
        keySet.add(i - 1); // Include the row before change too
      }
    }

    // Failing rows
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].result && !rows[i].result.pass) keySet.add(i);
    }

    return rows.filter((_, i) => keySet.has(i));
  }

  // Day 42 T3: Build HTML for error trace expansion
  _buildTraceHtml(rowTraces, rowIdx) {
    let html = '';
    for (const trace of rowTraces) {
      const traceId = 'trace-' + rowIdx + '-' + trace.outputLabel;
      // Why? toggle button
      html += '<div style="margin:2px 0;">';
      const toggleFn = 'var s=document.getElementById(this.dataset.tid);if(s){s.classList.toggle(\'expanded\');this.textContent=s.classList.contains(\'expanded\')?\'\u25BC Why?\':\'\u25B6 Why?\'}';
      html += '<span class="error-trace-btn" data-tid="' + traceId + '" onclick="' + toggleFn + '">\u25B6 Why?</span>';
      html += ' <span style="color:#888;font-size:10px;">Expected ' + trace.outputLabel + '=<span class="trace-val-' + trace.expected + '">' + trace.expected + '</span>, got <span class="trace-val-' + trace.actual + '">' + trace.actual + '</span></span>';
      // Expandable section
      html += '<div class="error-trace-section" id="' + traceId + '">';
      if (trace.disconnected) {
        html += '<div class="trace-disconnect-msg">\u26A0 ' + trace.message + '</div>';
      } else {
        html += '<div style="margin-bottom:4px;">';
        for (let pi = 0; pi < trace.path.length; pi++) {
          const step = trace.path[pi];
          if (pi > 0) html += '<span class="trace-arrow"> \u2192 </span>';
          if (step.type === 'input') {
            html += '<span>' + step.label + '=<span class="trace-val-' + step.value + '">' + step.value + '</span></span>';
          } else if (step.type === 'gate') {
            const insHtml = step.inputValues.map(v => '<span class="trace-val-' + v + '">' + v + '</span>').join(',');
            html += '<span class="trace-gate-name">' + step.gateType + '</span>(' + insHtml + ') = <span class="trace-val-' + step.outputValue + '">' + step.outputValue + '</span>';
          }
        }
        html += '<span class="trace-arrow"> \u2192 </span>';
        html += '<span>' + trace.outputLabel + ' gets <span class="trace-val-' + trace.actual + '">' + trace.actual + '</span>, expected <span class="trace-val-' + trace.expected + '">' + trace.expected + '</span></span>';
        html += '</div>';
      }
      // Constant output hint
      if (trace._constantHint !== undefined) {
        html += '<div class="trace-constant-msg">\uD83D\uDCA1 Your circuit always outputs ' + trace._constantHint + ' for ' + trace.outputLabel + ' regardless of inputs</div>';
      }
      // Show me button
      if (trace.gateIds.length > 0 || trace.wireIds.length > 0) {
        html += '<button class="trace-show-me-btn" onclick="if(window.game){window.game._showErrorHighlight(' + JSON.stringify(trace.gateIds) + ',' + JSON.stringify(trace.wireIds) + ')}">\uD83D\uDD0D Show me</button>';
      }
      html += '</div></div>';
    }
    return html;
  }

  // T7: Focus Failed Rows button
  _updateFocusFailedBtn(results) {
    const btn = document.getElementById('focus-failed-btn');
    if (!btn) return;

    const hasFailures = results && results.some(r => !r.pass);
    btn.style.display = hasFailures ? '' : 'none';

    btn.onclick = () => {
      // T9: Auto-expand truth table if collapsed
      this._expandTruthTable();

      // Find first failing row in the table
      const table = document.getElementById('truth-table');
      const failRow = table.querySelector('tr.row-fail');
      if (failRow) {
        failRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse all failing rows
        const failRows = table.querySelectorAll('tr.row-fail');
        failRows.forEach(r => {
          r.classList.remove('tt-focus-pulse');
          void r.offsetWidth;
          r.classList.add('tt-focus-pulse');
          setTimeout(() => r.classList.remove('tt-focus-pulse'), 1300);
        });
      }
    };
  }

  // T9: Expand truth table if collapsed
  _expandTruthTable() {
    const wrapper = document.getElementById('truth-table-wrapper');
    const chevron = document.getElementById('truth-table-chevron');
    if (wrapper && wrapper.style.display === 'none') {
      wrapper.style.display = '';
      if (chevron) chevron.textContent = '▼';
      try { localStorage.setItem('signal-circuit-tt-collapsed', 'false'); } catch (e) {}
    }
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
    // ARIA: Announce status changes for screen readers
    const sr = document.getElementById('sr-status');
    if (sr) sr.textContent = text;
  }

  // ── Star Display ──
  showStarDisplay(stars, gateCount, level, aesthetics) {
    const display = document.getElementById('star-display');
    display.style.display = 'block';

    const container = document.getElementById('stars-container');
    container.innerHTML = '';

    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i < stars ? ' filled' : ' empty');
      star.textContent = '★';

      // Stagger with 400ms delay — builds anticipation
      const delay = 300 + i * 400;
      setTimeout(() => {
        star.classList.add('visible');
        // Play ascending chime for each earned star
        if (i < stars) {
          this.gameState.audio.playStarReveal(i, stars);
        }
      }, delay);
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

    // T9: Par benchmarks display
    const parEl = document.getElementById('par-display');
    if (parEl && level.optimalGates) {
      // Generate consistent "community average" based on level ID
      const seed = typeof level.id === 'number' ? level.id : 1;
      const pseudoRandom = ((seed * 7 + 13) % 3); // 0, 1, or 2
      const communityAvg = level.optimalGates + pseudoRandom;
      const comparison = gateCount <= level.optimalGates ? '🏆' :
                        gateCount <= communityAvg ? '👍' : '📈';
      parEl.textContent = `${comparison} You: ${gateCount} · Par: ${level.optimalGates} · Avg: ${communityAvg.toFixed(1)}`;
      parEl.style.display = 'block';
    }

    // Day 31: Aesthetics score display
    const aestheticsEl = document.getElementById('aesthetics-display');
    if (aestheticsEl && aesthetics && aesthetics.score > 0) {
      aestheticsEl.textContent = `${aesthetics.label} · Aesthetics: ${aesthetics.score}% (${aesthetics.crossings} crossings)`;
      aestheticsEl.style.display = 'block';
      aestheticsEl.style.color = aesthetics.score >= 85 ? '#0f0' : aesthetics.score >= 65 ? '#cc0' : '#f80';
    } else if (aestheticsEl) {
      aestheticsEl.style.display = 'none';
    }

    // Day 31: Show share card button for campaign levels
    const shareCardBtn = document.getElementById('share-card-btn');
    if (shareCardBtn) {
      const isCampaign = !level.isChallenge && !level.isSandbox && !level.isDaily;
      shareCardBtn.style.display = isCampaign ? '' : 'none';
      shareCardBtn.onclick = () => {
        this.generateShareCard(level, stars, gateCount, aesthetics);
      };
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
    const teaserEl = document.getElementById('next-level-teaser');
    if (level.id < getLevelCount()) {
      nextBtn.style.display = 'inline-block';
      // F29-3: "One more level" teaser to hook re-engagement
      if (teaserEl) {
        const nextLevel = getLevel(level.id + 1);
        if (nextLevel) {
          teaserEl.innerHTML = `<span class="teaser-label">Up Next →</span> Level ${nextLevel.id}: ${nextLevel.title}`;
          teaserEl.style.display = 'block';
        } else {
          teaserEl.style.display = 'none';
        }
      }
    } else {
      nextBtn.style.display = 'none';
      if (teaserEl) teaserEl.style.display = 'none';
    }

    // T10: Show "Perfect Retry" button if hints were used and level doesn't have Pure Logic badge yet
    const retryBtn = document.getElementById('perfect-retry-btn');
    if (retryBtn) {
      const gs = this.gameState;
      const levelProgress = gs.progress.levels[level.id];
      const hasPureLogic = levelProgress && levelProgress.pureLogic;
      const usedHints = gs.hintsUsed > 0;
      const isCampaign = !level.isChallenge && !level.isSandbox && !level.isDaily;

      if (usedHints && !hasPureLogic && isCampaign) {
        retryBtn.style.display = 'inline-block';
        retryBtn.onclick = () => {
          retryBtn.style.display = 'none';
          this.hideStarDisplay();
          gs.loadLevel(level.id);
        };
      } else {
        retryBtn.style.display = 'none';
      }
    }
  }

  hideChallengeFriendButton() {
    const btn = document.getElementById('challenge-friend-btn');
    if (btn) btn.style.display = 'none';
  }

  hideStarDisplay() {
    document.getElementById('star-display').style.display = 'none';
    document.getElementById('share-btn').style.display = 'none';
    const insightEl = document.getElementById('post-solve-insight');
    if (insightEl) insightEl.style.display = 'none';
    const parEl = document.getElementById('par-display');
    if (parEl) parEl.style.display = 'none';
    const retryBtn = document.getElementById('perfect-retry-btn');
    if (retryBtn) retryBtn.style.display = 'none';
    const teaserEl = document.getElementById('next-level-teaser');
    if (teaserEl) teaserEl.style.display = 'none';
    const aestheticsEl = document.getElementById('aesthetics-display');
    if (aestheticsEl) aestheticsEl.style.display = 'none';
    const shareCardBtn = document.getElementById('share-card-btn');
    if (shareCardBtn) shareCardBtn.style.display = 'none';
    const focusBtn = document.getElementById("focus-failed-btn");
    if (focusBtn) focusBtn.style.display = "none";
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

  // Day 45: Gate Limit Challenge completion display
  showGateLimitResult(gateCount, level) {
    const display = document.getElementById('star-display');
    if (!display) return;
    // Show diamond badge overlay on star display
    const container = document.getElementById('stars-container');
    if (container) {
      const diamond = document.createElement('span');
      diamond.className = 'star filled gl-diamond-big';
      diamond.textContent = '⬦';
      diamond.style.fontSize = '2.5em';
      diamond.style.color = '#00e5ff';
      setTimeout(() => diamond.classList.add('visible'), 200);
      container.appendChild(diamond);
    }
    const msg = document.getElementById('star-message');
    if (msg) {
      const existing = msg.textContent;
      msg.textContent = existing + ` · ⬦ Perfect efficiency! ${gateCount} gates = optimal`;
      msg.style.color = '#00e5ff';
    }
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

    // Daily challenge button — Day 44: Show pre-screen with leaderboard
    document.getElementById('daily-challenge-btn').addEventListener('click', () => {
      this.showDailyScreen();
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

    // Gate challenge difficulty based on campaign progress
    this._updateChallengeGating(inputSlider, outputSlider);
    inputSlider.addEventListener('input', () => this._updateChallengeGating(inputSlider, outputSlider));
    outputSlider.addEventListener('input', () => this._updateChallengeGating(inputSlider, outputSlider));

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

  _updateChallengeGating(inputSlider, outputSlider) {
    if (!inputSlider || !outputSlider) return;
    const gs = this.gameState;
    const progress = gs.progress;
    const chapters = getChapters();

    // Check chapter completion
    const isChapterComplete = (chapterIdx) => {
      const chapter = chapters[chapterIdx];
      if (!chapter) return false;
      return chapter.levels.every(lid => {
        const p = progress.levels[lid];
        return p && p.completed;
      });
    };

    const ch1Done = isChapterComplete(0);
    const ch2Done = isChapterComplete(1);

    // Gate input slider: 2 (default), 3 after Ch1, 4 after Ch2
    let maxInputs = 2;
    if (ch1Done) maxInputs = 3;
    if (ch2Done) maxInputs = 4;
    inputSlider.max = maxInputs;
    if (parseInt(inputSlider.value) > maxInputs) inputSlider.value = maxInputs;

    // Gate output slider: 1 (default), 2 after Ch2
    let maxOutputs = 1;
    if (ch2Done) maxOutputs = 2;
    outputSlider.max = maxOutputs;
    if (parseInt(outputSlider.value) > maxOutputs) outputSlider.value = maxOutputs;
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
      // Day 44: Include leaderboard rank in share text
      let rankText = '';
      if (this._lastDailyLbResult) {
        const pct = this._lastDailyLbResult.percentile;
        const badge = this.gameState.dailyLeaderboard.getRankBadge(pct);
        rankText = badge ? `\n${badge} Top ${100 - pct}%` : `\n📊 Top ${100 - pct}%`;
      }
      const text = `⚡ Signal Circuit — Daily Challenge\n📅 ${dateStr}\n${starEmoji} ${gateCount} gates | ⏱ ${mins}:${secs.toString().padStart(2, '0')}${rankText}${streakText}\nhttps://mikedyan.github.io/signal-circuit/`;
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

  // ── Day 44: Daily Challenge Leaderboard UI ──

  setupDailyScreen() {
    const backBtn = document.getElementById('daily-back-btn');
    const startBtn = document.getElementById('start-daily-btn');
    const nameInput = document.getElementById('daily-display-name');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.gameState.showLevelSelect();
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // Save display name if entered
        if (nameInput && nameInput.value.trim()) {
          this.gameState.dailyLeaderboard.setDisplayName(nameInput.value.trim());
        }
        this.gameState.startDailyChallenge();
      });
    }

    if (nameInput) {
      // Load saved name
      const savedName = this.gameState.dailyLeaderboard.getDisplayName();
      if (savedName) nameInput.value = savedName;
    }
  }

  showDailyScreen() {
    // Hide all screens
    this.showScreen('daily-config');

    const dateLabel = document.getElementById('daily-date-label');
    const competitiveMsg = document.getElementById('daily-competitive-msg');
    const resultSummary = document.getElementById('daily-result-summary');
    const resultText = document.getElementById('daily-result-text');
    const nameInput = document.getElementById('daily-display-name');

    // Set date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    if (dateLabel) dateLabel.textContent = dateStr;

    // Load saved name
    if (nameInput) {
      const savedName = this.gameState.dailyLeaderboard.getDisplayName();
      if (savedName) nameInput.value = savedName;
    }

    // Competitive framing (T8)
    const lb = this.gameState.dailyLeaderboard;
    const best = lb.getTodaysBest();
    if (competitiveMsg && best) {
      competitiveMsg.textContent = `Today's leader used just ${best.gates} gates — can you match them?`;
      competitiveMsg.style.display = '';
    }

    // Show existing result if already completed (T5)
    const todayResult = lb.getTodayResult();
    if (resultSummary && resultText && todayResult) {
      const pct = lb.getPercentile(todayResult.gates, todayResult.time);
      const badge = lb.getRankBadge(pct);
      const mins = Math.floor(todayResult.time / 60);
      const secs = todayResult.time % 60;
      resultText.innerHTML = `${badge} Today's result: <strong>${todayResult.gates} gates</strong> · ⏱ ${mins}:${secs.toString().padStart(2, '0')} · Top ${100 - pct}%`;
      resultSummary.style.display = 'block';
      // Hide competitive message if already completed
      if (competitiveMsg) competitiveMsg.style.display = 'none';
    } else if (resultSummary) {
      resultSummary.style.display = 'none';
    }

    // Render leaderboard (T3)
    this.renderDailyLeaderboard();

    // Render history (T4)
    this.renderDailyHistory();
  }

  renderDailyLeaderboard() {
    const container = document.getElementById('daily-leaderboard-list');
    if (!container) return;

    const lb = this.gameState.dailyLeaderboard;
    const top10 = lb.getTopScores(10);

    if (top10.length === 0) {
      container.innerHTML = '<div class="daily-lb-empty">No scores yet today</div>';
      return;
    }

    let html = '';
    top10.forEach((entry, idx) => {
      const rank = idx + 1;
      const mins = Math.floor(entry.time / 60);
      const secs = entry.time % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const playerClass = entry.isPlayer ? ' player-entry' : '';
      const nameDisplay = entry.isPlayer ? (entry.name || 'You') : entry.name;

      html += `<div class="daily-lb-entry${playerClass}">
        <span class="daily-lb-rank">${rank}.</span>
        <span class="daily-lb-name">${nameDisplay}</span>
        <span class="daily-lb-gates">${entry.gates} gates</span>
        <span class="daily-lb-time">${timeStr}</span>
      </div>`;
    });

    container.innerHTML = html;
  }

  renderDailyHistory() {
    const container = document.getElementById('daily-history-list');
    if (!container) return;

    const lb = this.gameState.dailyLeaderboard;
    const history = lb.getRecentHistory(7);

    if (history.length === 0) {
      container.innerHTML = '<div class="daily-lb-empty">No daily challenges played recently</div>';
      return;
    }

    let html = '';
    history.forEach(entry => {
      const mins = Math.floor(entry.time / 60);
      const secs = entry.time % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      // Format date nicely
      const d = new Date(entry.dateKey + 'T12:00:00');
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      html += `<div class="daily-history-entry">
        <span class="daily-history-date">${dateStr}</span>
        <span class="daily-history-gates">${entry.gates} gates</span>
        <span class="daily-history-time">⏱ ${timeStr}</span>
        <span class="daily-history-badge">${entry.badge || ''}</span>
      </div>`;
    });

    container.innerHTML = html;
  }

  // Show leaderboard result after daily completion (T2)
  showDailyLeaderboardResult(lbResult) {
    if (!lbResult) return;
    const badge = this.gameState.dailyLeaderboard.getRankBadge(lbResult.percentile);
    const pctBetter = lbResult.percentile;

    // Add result to the par display area
    const parEl = document.getElementById('par-display');
    if (parEl) {
      const rankText = badge ? `${badge} ` : '';
      parEl.textContent = `${rankText}You solved in ${lbResult.gates} gates — faster than ${pctBetter}% of players today!`;
      parEl.style.display = 'block';
      parEl.style.color = pctBetter >= 75 ? '#ffd700' : pctBetter >= 50 ? '#0f0' : '#aaa';
    }

    // Store result for share button enhancement
    this._lastDailyLbResult = lbResult;
  }

  // Update daily challenge button on level select with rank badge (T5)
  updateDailyButtonBadge() {
    const btn = document.getElementById('daily-challenge-btn');
    if (!btn) return;
    const lb = this.gameState.dailyLeaderboard;
    const todayResult = lb.getTodayResult();

    // Get the seasonal theme text (preserve it)
    let baseText = '📅 Daily Challenge';
    try {
      const theme = typeof getSeasonalTheme === 'function' ? getSeasonalTheme() : null;
      if (theme && theme.emoji) baseText = `${theme.emoji} Daily Challenge`;
    } catch (e) {}

    if (todayResult) {
      const pct = lb.getPercentile(todayResult.gates, todayResult.time);
      const badge = lb.getRankBadge(pct);
      if (badge) {
        btn.innerHTML = `${baseText} <span class="daily-rank-badge">${badge}</span>`;
      } else {
        btn.innerHTML = `${baseText} <span class="daily-rank-badge">✅</span>`;
      }
    } else {
      btn.textContent = baseText;
    }
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

    const icons = { 1: '🛸', 2: '📡', 3: '🌬️', 4: '🚀' };
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

    // Day 31: Real-world visualization
    if (chapter.realWorld) {
      const rwDiv = document.createElement('div');
      rwDiv.className = 'real-world-section';
      rwDiv.innerHTML = `
        <div class="real-world-header">${chapter.realWorld.icon} ${chapter.realWorld.title}</div>
        <div class="real-world-fact">${chapter.realWorld.fact}</div>
        <div class="real-world-device">💻 Found in: <strong>${chapter.realWorld.device}</strong></div>
      `;
      gatesList.parentElement.appendChild(rwDiv);
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

    // Day 34 T5: Progress bar milestone markers
    this._updateMilestoneMarkers(pctComplete);
  }

  _updateMilestoneMarkers(pctComplete) {
    const track = document.getElementById('progress-track');
    if (!track) return;
    // Remove old markers
    track.querySelectorAll('.milestone-marker').forEach(m => m.remove());

    const milestones = [
      { pct: 25, label: '25%', icon: '◆' },
      { pct: 50, label: '50%', icon: '◆' },
      { pct: 75, label: '75%', icon: '◆' },
      { pct: 100, label: '100%', icon: '★' },
    ];

    for (const ms of milestones) {
      const marker = document.createElement('div');
      marker.className = 'milestone-marker';
      marker.style.left = ms.pct + '%';
      marker.textContent = ms.icon;
      marker.title = ms.label;
      if (pctComplete >= ms.pct) {
        marker.classList.add('milestone-reached');
      }
      track.appendChild(marker);
    }
  }

  // ── Streak Display (T8) ──
  updateStreakDisplay(streakData) {
    const el = document.getElementById('streak-display');
    if (!el) return;
    if (!streakData || streakData.streak <= 0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    const freeze = streakData.freezeTokens > 0 ? ` 🧊${streakData.freezeTokens}` : '';
    el.textContent = `🔥${streakData.streak}${freeze}`;
    el.title = `${streakData.streak}-day streak${streakData.freezeTokens > 0 ? ` · ${streakData.freezeTokens} freeze token${streakData.freezeTokens > 1 ? 's' : ''}` : ''}`;
  }

  // ── Onboarding ──
  setupOnboarding() {
    const dismissBtn = document.getElementById('tooltip-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissOnboarding();
      });
    }
    // Click anywhere to dismiss (non-blocking) — with grace period
    document.addEventListener('click', (e) => {
      const tooltip = document.getElementById('onboarding-tooltip');
      if (tooltip && tooltip.style.display !== 'none' && this._onboardingShownAt && Date.now() - this._onboardingShownAt > 500) {
        this.dismissOnboarding();
      }
    });
  }

  showOnboarding(levelId) {
    const tooltip = document.getElementById('onboarding-tooltip');
    if (!tooltip) return;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const tap = isMobile ? 'Tap' : 'Click';
    const drag = isMobile ? 'Drag' : 'Drag';

    // Distributed onboarding: different tips for levels 1-4
    const onboardingMessages = {
      1: `${drag} a gate from the Parts toolbox onto the board`,
      2: `${tap} an output pin (right) then an input pin (left) to draw wires`,
      3: 'Match every row in the Truth Table — your circuit must handle all input combinations',
      4: 'Use 💡 Hints if stuck. Fewer gates = more ⭐ stars!',
    };

    const message = onboardingMessages[levelId];
    if (!message) return;

    // Check if this specific onboarding tip was already shown
    const storageKey = `signal-circuit-onboarded-${levelId}`;
    try {
      if (localStorage.getItem(storageKey) === 'true') return;
      // Don't show if level is already completed
      const progress = this.gameState.progress.levels[levelId];
      if (progress && progress.completed) return;
    } catch (e) {}

    const text = document.getElementById('tooltip-text');
    text.textContent = message;
    tooltip.style.display = 'block';
    this._currentOnboardingLevel = levelId;
    // Auto-dismiss after 8 seconds
    if (this._onboardingTimer) clearTimeout(this._onboardingTimer);
    this._onboardingTimer = setTimeout(() => this.dismissOnboarding(), 8000);
  }

  dismissOnboarding() {
    const tooltip = document.getElementById('onboarding-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    if (this._onboardingTimer) {
      clearTimeout(this._onboardingTimer);
      this._onboardingTimer = null;
    }
    // Mark the specific level's onboarding as shown
    if (this._currentOnboardingLevel) {
      try {
        localStorage.setItem(`signal-circuit-onboarded-${this._currentOnboardingLevel}`, 'true');
      } catch (e) {}
      this._currentOnboardingLevel = null;
    }
  }

  // ── Day 34 T2: Return-Player Re-Onboarding ──
  showReOnboarding() {
    const tooltip = document.getElementById('onboarding-tooltip');
    if (!tooltip) return;
    const text = document.getElementById('tooltip-text');
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const tap = isMobile ? 'Tap' : 'Click';
    text.textContent = `Welcome back! Quick reminder: Drag gates → Wire pins → Match the truth table. ${tap} Hint if stuck!`;
    tooltip.style.display = 'block';
    this._onboardingShownAt = Date.now();
    if (this._onboardingTimer) clearTimeout(this._onboardingTimer);
    this._onboardingTimer = setTimeout(() => this.dismissOnboarding(), 10000);
  }

  // ── Hint Button Sync ──
  updateHintButton(tokens) {
    const gs = this.gameState;
    const level = gs.currentLevel;
    const hintBtn = document.getElementById('hint-btn');
    if (!hintBtn) return;

    if (!level || !level.hints || level.hints.length === 0 || gs.isSandboxMode || gs.isChallengeMode || gs.isGateLimitMode) {
      hintBtn.style.display = 'none';
      return;
    }

    const tokenCount = tokens !== undefined ? tokens : (gs.hintTokens ? gs.hintTokens.tokens : 0);
    hintBtn.style.display = '';
    if (gs.hintsUsed >= level.hints.length) {
      hintBtn.disabled = true;
      hintBtn.textContent = '💡 No more hints';
    } else if (tokenCount <= 0) {
      hintBtn.disabled = true;
      hintBtn.textContent = '💡 No tokens (0)';
    } else if (gs.hintsUsed === 0) {
      hintBtn.disabled = false;
      hintBtn.textContent = `💡 Hint (🪙${tokenCount})`;
    } else {
      hintBtn.disabled = false;
      hintBtn.textContent = `💡 Hint ${gs.hintsUsed + 1}/${level.hints.length} (🪙${tokenCount})`;
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
    // Day 33 T5: Exclude pre-placed (locked) gates from count
    const count = gs.gates.filter(g => !g._locked).length;
    const countText = document.getElementById('gate-count-text');
    const starsPreview = document.getElementById('gate-stars-preview');

    // Day 45: Gate Limit mode indicator
    if (gs.isGateLimitMode && gs.gateBudget > 0) {
      const budget = gs.gateBudget;
      countText.innerHTML = `Budget: <span class="count">${count}</span>/${budget}`;
      starsPreview.innerHTML = count <= budget ? '<span class="gl-diamond-live">⬦</span>' : '';
      el.className = count <= budget ? 'optimal' : 'over';
      if (count > budget) {
        el.classList.add('gate-pulse');
        setTimeout(() => el.classList.remove('gate-pulse'), 400);
      }
      return;
    }

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

      // Projected stars — T8: no hint penalty
      let projectedStars = 0;
      if (count > 0) {
        if (count <= optimal) projectedStars = 3;
        else if (count <= good) projectedStars = 2;
        else projectedStars = 1;
      }

      let starsHtml = '';
      for (let i = 0; i < 3; i++) {
        if (i < projectedStars) {
          starsHtml += '<span class="star-gold">★</span>';
        } else {
          starsHtml += '<span class="star-dim">★</span>';
        }
      }
      starsPreview.innerHTML = starsHtml;

      // Style class — T3: Color feedback + pulse on threshold crossing
      const newClass = count <= optimal ? 'optimal' : count <= good ? 'good' : 'over';
      const prevClass = this._prevGateClass || '';
      el.className = newClass;
      if (prevClass && prevClass !== newClass && count > 0) {
        el.classList.add('gate-pulse');
        setTimeout(() => el.classList.remove('gate-pulse'), 400);
      }
      this._prevGateClass = newClass;
    }

    // Update hint penalty display
    this.updateHintPenalty();

    // Day 33 T9: Refresh accessible wiring dropdowns
    this._refreshAccessibleWireDropdowns();
  }

  updateHintPenalty() {
    // T8: Hint penalty removed. Show info-only hint status.
    const infoEl = document.getElementById('hint-info');
    if (!infoEl) return;

    const gs = this.gameState;
    const level = gs.currentLevel;

    if (!level || gs.isSandboxMode || gs.isChallengeMode || !level.hints || level.hints.length === 0) {
      infoEl.style.display = 'none';
      return;
    }

    if (gs.hintsUsed === 0) {
      infoEl.textContent = '💡 Hints won\'t reduce stars · 🧠 No hints = Pure Logic badge';
      infoEl.style.display = 'block';
      infoEl.style.color = '#888';
      infoEl.style.fontSize = '10px';
    } else {
      infoEl.textContent = '💡 Hints used — 🧠 Pure Logic badge requires no hints';
      infoEl.style.display = 'block';
      infoEl.style.color = '#666';
      infoEl.style.fontSize = '10px';
    }
  }

  // ── Gate Count Display (legacy for sandbox) ──
  updateGateCount() {
    const el = document.getElementById('gate-count-display');
    if (el) {
      el.innerHTML = `Gates used: <span>${this.gameState.gates.length}</span>`;
    }
  }

  // ── Gate Encyclopedia ──
  setupEncyclopedia() {
    const modal = document.getElementById('encyclopedia-modal');
    const closeBtn = document.getElementById('encyclopedia-close');
    const levelSelectBtn = document.getElementById('encyclopedia-btn');
    const gameplayBtn = document.getElementById('encyclopedia-gameplay-btn');

    const openEncyclopedia = () => {
      this.renderEncyclopedia();
      if (modal) modal.style.display = 'flex';
    };

    if (levelSelectBtn) levelSelectBtn.addEventListener('click', openEncyclopedia);
    if (gameplayBtn) gameplayBtn.addEventListener('click', openEncyclopedia);
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-cards');
    if (!container) return;
    container.innerHTML = '';

    // Determine which gates the player has encountered
    const progress = this.gameState.progress;
    const encounteredGates = new Set();
    for (const [levelId, data] of Object.entries(progress.levels || {})) {
      const level = getLevel(parseInt(levelId));
      if (level && level.availableGates) {
        level.availableGates.forEach(g => encounteredGates.add(g));
      }
    }
    // Also include gates from unlocked levels
    const allLevels = LEVELS;
    for (const level of allLevels) {
      if (this.gameState.isLevelUnlocked(level.id)) {
        level.availableGates.forEach(g => encounteredGates.add(g));
      }
    }

    const gateInfo = [
      {
        type: 'AND',
        symbol: '∧',
        desc: 'Outputs 1 only when ALL inputs are 1. Like a series circuit — both switches must be ON.',
        analogy: '🔌 Two light switches in series: both must be flipped for the light to turn on.',
        tip: 'AND is great for "require both conditions" logic. Chain two ANDs to handle 3+ inputs.',
        table: [[0,0,0],[0,1,0],[1,0,0],[1,1,1]],
      },
      {
        type: 'OR',
        symbol: '∨',
        desc: 'Outputs 1 when ANY input is 1. Like a parallel circuit — any path lets current through.',
        analogy: '🚪 Two doors to a room: either one being open means you can enter.',
        tip: 'OR handles "at least one" conditions. Useful for combining multiple signal sources.',
        table: [[0,0,0],[0,1,1],[1,0,1],[1,1,1]],
      },
      {
        type: 'NOT',
        symbol: '¬',
        desc: 'Flips the input: 0 becomes 1, 1 becomes 0. The simplest gate — just one transistor.',
        analogy: '🔄 A toggle switch: whatever state the input is in, the output is the opposite.',
        tip: 'NOT is the key to De Morgan\'s Laws: combine with AND/OR to build any other gate.',
        table: [[0,1],[1,0]],
      },
      {
        type: 'XOR',
        symbol: '⊕',
        desc: 'Outputs 1 when inputs are DIFFERENT. Same inputs → 0, different inputs → 1.',
        analogy: '🤝 Two-way light switch: either switch alone turns the light on, but both together cancel out.',
        tip: 'XOR is the foundation of binary addition (half adder). Also used in parity checks and encryption.',
        table: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]],
      },
      {
        type: 'NAND',
        symbol: '⊼',
        desc: 'NOT-AND: outputs 0 ONLY when both inputs are 1. The inverse of AND.',
        analogy: '🏭 A factory alarm: it stays ON unless both safety checks pass simultaneously.',
        tip: 'NAND is a "universal gate" — you can build ANY logic circuit using only NAND gates. Every modern CPU is ultimately made of NANDs.',
        table: [[0,0,1],[0,1,1],[1,0,1],[1,1,0]],
      },
      {
        type: 'NOR',
        symbol: '⊽',
        desc: 'NOT-OR: outputs 1 ONLY when both inputs are 0. The inverse of OR.',
        analogy: '🚀 The Apollo Guidance Computer was built entirely from ~5,600 NOR gates — it navigated humans to the moon!',
        tip: 'NOR is also universal. The entire Apollo 11 computer used only NOR gates — proving you can build anything with just one gate type.',
        table: [[0,0,1],[0,1,0],[1,0,0],[1,1,0]],
      },
    ];

    for (const info of gateInfo) {
      const def = GateTypes[info.type];
      const isLocked = !encounteredGates.has(info.type);

      const card = document.createElement('div');
      card.className = 'enc-card' + (isLocked ? ' enc-locked' : '');

      if (isLocked) {
        card.innerHTML = `
          <div class="enc-header">
            <span class="enc-gate-name" style="color: ${def.color}">${info.type}</span>
            <span class="enc-lock">🔒</span>
          </div>
          <div class="enc-locked-msg">Complete more levels to unlock</div>
        `;
      } else {
        // Mini truth table
        const isUnary = info.type === 'NOT';
        let tableHtml = '<table class="enc-truth-table"><thead><tr>';
        if (isUnary) {
          tableHtml += '<th>IN</th><th>OUT</th>';
        } else {
          tableHtml += '<th>A</th><th>B</th><th>OUT</th>';
        }
        tableHtml += '</tr></thead><tbody>';
        for (const row of info.table) {
          tableHtml += '<tr>';
          for (const val of row) {
            tableHtml += `<td>${val}</td>`;
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';

        card.innerHTML = `
          <div class="enc-header">
            <span class="enc-gate-name" style="color: ${def.color}">${info.type}</span>
            <span class="enc-symbol" style="color: ${def.color}">${info.symbol}</span>
          </div>
          <div class="enc-body">
            <div class="enc-desc">${info.desc}</div>
            ${tableHtml}
            <div class="enc-analogy">${info.analogy}</div>
            <div class="enc-tip">💡 <strong>Pro tip:</strong> ${info.tip}</div>
          </div>
        `;
      }

      container.appendChild(card);
    }
  }

  // ── Stats Dashboard ──
  setupStatsDashboard() {
    const btn = document.getElementById('stats-btn');
    const modal = document.getElementById('stats-modal');
    const closeBtn = document.getElementById('stats-close');

    if (btn) btn.addEventListener('click', () => {
      this.renderEnhancedStats();
      if (modal) modal.style.display = 'flex';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderStatsDashboard() {
    const container = document.getElementById('stats-grid');
    if (!container) return;

    const gs = this.gameState;
    const progress = gs.progress;
    const stats = gs.loadLifetimeStats();

    // Calculate derived stats
    const totalLevels = getLevelCount();
    let completed = 0;
    let totalStars = 0;
    const maxStars = totalLevels * 3;
    let totalBestTime = 0;
    let levelsWithTime = 0;

    for (const [id, data] of Object.entries(progress.levels || {})) {
      if (data.completed) completed++;
      totalStars += data.stars || 0;
      if (data.bestTime) {
        totalBestTime += data.bestTime;
        levelsWithTime++;
      }
    }

    const avgTime = levelsWithTime > 0 ? Math.round(totalBestTime / levelsWithTime) : 0;
    const achCount = gs.achievements.getUnlockedCount();
    const achTotal = ACHIEVEMENTS.length;

    // Challenge stats
    const challengeStats = gs.achievements.stats || {};
    const challengesPlayed = challengeStats.challengesCompleted || 0;

    // Format playtime
    const playtimeSec = stats.totalPlaytime || 0;
    const playMin = Math.floor(playtimeSec / 60);
    const playHour = Math.floor(playMin / 60);
    const playMinRemainder = playMin % 60;
    const playtimeStr = playHour > 0 ? `${playHour}h ${playMinRemainder}m` : `${playMin}m`;

    const starPct = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${completed}/${totalLevels}</div>
        <div class="stat-label">Levels Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">${totalStars}/${maxStars}</div>
        <div class="stat-label">Stars Earned</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${starPct}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔧</div>
        <div class="stat-value">${stats.totalGatesPlaced || 0}</div>
        <div class="stat-label">Gates Placed (Lifetime)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱</div>
        <div class="stat-value">${playtimeStr}</div>
        <div class="stat-label">Total Play Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">${avgTime > 0 ? Math.floor(avgTime / 60) + ':' + (avgTime % 60).toString().padStart(2, '0') : '—'}</div>
        <div class="stat-label">Avg Completion Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">${achCount}/${achTotal}</div>
        <div class="stat-label">Achievements</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎲</div>
        <div class="stat-value">${challengesPlayed}</div>
        <div class="stat-label">Challenges Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⬦</div>
        <div class="stat-value">${gs.getGateLimitCompletionCount()}/${totalLevels}</div>
        <div class="stat-label">Gate Limit Challenges</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${totalLevels > 0 ? Math.round((gs.getGateLimitCompletionCount() / totalLevels) * 100) : 0}%;background:#00e5ff"></div></div>
      </div>
    `;
  }

  // ── Milestone Modal ──
  setupMilestoneModal() {
    const modal = document.getElementById('milestone-modal');
    const dismissBtn = document.getElementById('milestone-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  showMilestoneModal(icon, title, story) {
    const modal = document.getElementById('milestone-modal');
    if (!modal) return;
    document.getElementById('milestone-icon').textContent = icon;
    document.getElementById('milestone-title').textContent = title;
    document.getElementById('milestone-story').textContent = story;
    modal.style.display = 'flex';
  }

  // ── Journey Summary Modal (T9) ──
  setupJourneyModal() {
    const modal = document.getElementById('journey-modal');
    const dismissBtn = document.getElementById('journey-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  showJourneySummary() {
    const modal = document.getElementById('journey-modal');
    if (!modal) return;

    const gs = this.gameState;
    const progress = gs.progress;
    const stats = gs.loadLifetimeStats();
    const achCount = gs.achievements.getUnlockedCount();
    const achTotal = ACHIEVEMENTS.length;

    let totalStars = 0;
    let fastestLevel = null;
    let fastestTime = Infinity;
    let perfectLevels = 0;

    for (const [id, data] of Object.entries(progress.levels || {})) {
      totalStars += data.stars || 0;
      if (data.stars === 3) perfectLevels++;
      if (data.bestTime && data.bestTime < fastestTime) {
        fastestTime = data.bestTime;
        fastestLevel = parseInt(id);
      }
    }

    const totalGates = stats.totalGatesPlaced || 0;
    const playtimeSec = stats.totalPlaytime || 0;
    const playMin = Math.floor(playtimeSec / 60);
    const playHour = Math.floor(playMin / 60);
    const playMinRemainder = playMin % 60;
    const playtimeStr = playHour > 0 ? `${playHour}h ${playMinRemainder}m` : `${playMin}m`;

    let fastestStr = '—';
    if (fastestLevel) {
      const fMins = Math.floor(fastestTime / 60);
      const fSecs = fastestTime % 60;
      fastestStr = `L${fastestLevel} (${fMins}:${fSecs.toString().padStart(2, '0')})`;
    }

    const maxStars = getLevelCount() * 3;
    const totalLevels = getLevelCount();

    // #99: Enhanced graduation title
    const titleEl = document.getElementById('journey-title');
    const iconEl = document.getElementById('journey-icon');
    if (totalStars >= maxStars) {
      titleEl.textContent = '🎓 MASTER LOGICIAN';
      iconEl.textContent = '🎓';
    } else {
      titleEl.textContent = '🛸 JOURNEY COMPLETE';
      iconEl.textContent = '🛸';
    }

    // #99: Build level grid showing all levels with stars
    let levelGridHtml = '<div class="graduation-grid">';
    for (let i = 1; i <= totalLevels; i++) {
      const lp = progress.levels[i];
      const stars = lp ? lp.stars || 0 : 0;
      const completed = lp && lp.completed;
      const starStr = completed ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '—';
      const cls = completed ? (stars === 3 ? 'grad-perfect' : 'grad-done') : 'grad-incomplete';
      levelGridHtml += `<div class="grad-level ${cls}"><span class="grad-level-num">${i}</span><span class="grad-level-stars">${starStr}</span></div>`;
    }
    levelGridHtml += '</div>';

    const container = document.getElementById('journey-stats');
    container.innerHTML = `
      ${levelGridHtml}
      <div class="journey-stat"><div class="journey-stat-icon">⭐</div><div class="journey-stat-value">${totalStars}/${maxStars}</div><div class="journey-stat-label">Stars Earned</div></div>
      <div class="journey-stat"><div class="journey-stat-icon">💎</div><div class="journey-stat-value">${perfectLevels}/${totalLevels}</div><div class="journey-stat-label">Perfect Levels</div></div>
      <div class="journey-stat"><div class="journey-stat-icon">🔧</div><div class="journey-stat-value">${totalGates}</div><div class="journey-stat-label">Gates Placed</div></div>
      <div class="journey-stat"><div class="journey-stat-icon">⏱</div><div class="journey-stat-value">${playtimeStr}</div><div class="journey-stat-label">Total Play Time</div></div>
      <div class="journey-stat"><div class="journey-stat-icon">⚡</div><div class="journey-stat-value">${fastestStr}</div><div class="journey-stat-label">Fastest Level</div></div>
      <div class="journey-stat"><div class="journey-stat-icon">🏆</div><div class="journey-stat-value">${achCount}/${achTotal}</div><div class="journey-stat-label">Achievements</div></div>
    `;

    modal.style.display = 'flex';
  }

  // ── Ghost Toggle (T10) ──
  setupGhostToggle() {
    const btn = document.getElementById('ghost-toggle-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this.gameState.toggleGhost();
      const showing = this.gameState.showGhost;
      btn.textContent = showing ? '👻 Hide Previous Solution' : '👻 Show Previous Solution';
      btn.classList.toggle('ghost-active', showing);
    });
  }

  updateGhostButton(hasGhost) {
    const btn = document.getElementById('ghost-toggle-btn');
    if (!btn) return;
    btn.style.display = hasGhost ? 'block' : 'none';
    btn.textContent = '👻 Show Previous Solution';
    btn.classList.remove('ghost-active');
  }

  checkMilestones(stars, levelId) {
    const gs = this.gameState;
    const progress = gs.progress;
    const milestones = gs.loadMilestones();

    // Milestone 1: First 3-star rating
    if (stars === 3 && !milestones.first3Star) {
      milestones.first3Star = true;
      gs.saveMilestones(milestones);
      setTimeout(() => {
        this.showMilestoneModal('🌟', 'Perfect Logic!', 'Your first 3-star solution! You\'re thinking like a real circuit designer. Keep optimizing — fewer gates means more elegant circuits.');
      }, 2500);
    }

    // Milestone 2: All 17 levels completed
    const totalLevels = getLevelCount();
    let allComplete = true;
    for (let i = 1; i <= totalLevels; i++) {
      const p = progress.levels[i];
      if (!p || !p.completed) { allComplete = false; break; }
    }
    if (allComplete && !milestones.allLevelsComplete) {
      milestones.allLevelsComplete = true;
      gs.saveMilestones(milestones);
      setTimeout(() => {
        this.startCelebration(3);
        this.showMilestoneModal('🛸', 'ALL SYSTEMS ONLINE', 'Navigation, Communications, Life Support — every system on the ship is repaired. The crew is safe. You did it, Engineer. The ship can fly home.');
        // T9: Show journey summary after milestone is dismissed
        const milestoneBtn = document.getElementById('milestone-dismiss');
        if (milestoneBtn) {
          const origClick = milestoneBtn.onclick;
          milestoneBtn.onclick = () => {
            if (origClick) origClick();
            document.getElementById('milestone-modal').style.display = 'none';
            setTimeout(() => this.showJourneySummary(), 400);
          };
        }
      }, 2500);
    }

    // Milestone 3: All 51 stars
    let totalStars = 0;
    for (const [, data] of Object.entries(progress.levels || {})) {
      totalStars += data.stars || 0;
    }
    const maxStars = totalLevels * 3;
    if (totalStars >= maxStars && !milestones.perfectEngineer) {
      milestones.perfectEngineer = true;
      gs.saveMilestones(milestones);
      setTimeout(() => {
        this.startCelebration(3);
        this.showMilestoneModal('💎', 'PERFECT ENGINEER', 'Every circuit optimized to perfection. Every gate placed with precision. You\'ve mastered the art of digital logic. There is nothing left to teach you.');
      }, 3000);
    }
  }

  // ── Day 47: Celebration Variety System ──

  // CelebrationFactory: returns particle config based on context
  _getCelebrationConfig(stars, context) {
    const ctx = context || {};
    const chapterId = ctx.chapterId || null;
    const mode = ctx.mode || 'campaign';

    // Base particle count by stars
    let baseCount = stars === 3 ? 180 : stars === 2 ? 100 : 45;

    // T8: Intensity modulation based on first-time vs improvement vs replay
    let intensityMul = 1.0;
    if (ctx.isImprovement) intensityMul = 1.5;
    else if (ctx.isReplay) intensityMul = 0.7;

    const particleCount = Math.min(Math.round(baseCount * intensityMul), 250);
    const velocityMul = ctx.isImprovement ? 1.2 : 1.0;

    // T1-T5: Chapter-specific particle config
    let colors, shapes;
    const defaultShapes = ['rect', 'circle', 'triangle'];

    if (mode === 'challenge' || !chapterId || chapterId <= 2) {
      // T1: Chapters 1-2 and challenges: classic confetti
      if (stars === 3) {
        colors = ['#ffd700', '#ffa500', '#ffcc00', '#fff4a3', '#ffe066', '#ffd700', '#ffd700'];
      } else if (stars === 2) {
        colors = ['#ffd700', '#ff4444', '#0f0', '#00c8e8', '#c050f0', '#ff8800', '#fff'];
      } else {
        colors = ['#999', '#777', '#aaa', '#ffd700', '#888'];
      }
      shapes = defaultShapes;
    } else if (chapterId === 3) {
      // T2: Chapter 3 — confetti + floating circuit symbols
      colors = ['#c050f0', '#e070ff', '#9933cc', '#ffd700', '#ff88dd', '#fff'];
      shapes = ['rect', 'circle', 'triangle', 'gate_symbol'];
    } else if (chapterId === 4) {
      // Chapter 3.5 (id=4): diagnostic theme
      colors = ['#9966cc', '#bb88ee', '#7744aa', '#ffd700', '#cc99ff', '#fff'];
      shapes = defaultShapes;
    } else if (chapterId === 5) {
      // T3: Chapter 4 — electric sparks radiating outward
      colors = ['#ffdd00', '#00e8ff', '#fff', '#ffe066', '#88ddff', '#ffaa00'];
      shapes = ['spark'];
    } else if (chapterId === 6) {
      // T4: Chapter 5 — shield shimmer (gold/amber hexagonal)
      colors = ['#FFD700', '#ffaa00', '#fff4a3', '#cc8800', '#ffe066'];
      shapes = ['hex_ring'];
    } else if (chapterId === 7) {
      // T5: Chapter 6 — NAND/NOR gate rain
      colors = ['#cc6600', '#ff8844', '#dd7733', '#ffaa66', '#ffd700'];
      shapes = ['gate_rain'];
    } else {
      // Bonus chapters / Discovery Lab: default confetti with chapter color
      const chColor = ctx.chapterColor || '#ffd700';
      colors = [chColor, '#ffd700', '#fff', '#ff8800', chColor, chColor];
      shapes = defaultShapes;
    }

    // T10: Chapter-colored flash
    let flashColor = null;
    if (ctx.chapterColor && mode === 'campaign') {
      flashColor = ctx.chapterColor;
    }

    return {
      particleCount,
      velocityMul,
      colors,
      shapes,
      flashColor,
      stars,
      chapterId,
      isPureLogicNew: !!ctx.isPureLogicNew,
      isImprovement: !!ctx.isImprovement,
      defaultShapes,
    };
  }

  startCelebration(stars = 2, context) {
    this.celebrationActive = true;
    this.celebrationParticles = [];

    const config = this._getCelebrationConfig(stars, context);
    const { particleCount, velocityMul, colors, shapes, flashColor } = config;

    const useFlash = stars >= 2;
    const flashDuration = stars === 3 ? 900 : 600;

    // T10: Chapter-colored victory flash
    if (useFlash) {
      const flash = document.getElementById('victory-flash');
      if (flash) {
        if (flashColor) {
          // Convert hex to rgba with 0.3 alpha for semi-transparent flash
          const fc = flashColor;
          const r = parseInt(fc.slice(1,3), 16) || 0;
          const g = parseInt(fc.slice(3,5), 16) || 0;
          const b = parseInt(fc.slice(5,7), 16) || 0;
          flash.style.background = 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
        } else {
          flash.style.background = '';
        }
        flash.classList.remove('flash-active');
        void flash.offsetWidth;
        flash.classList.add('flash-active');
        setTimeout(() => {
          flash.classList.remove('flash-active');
          flash.style.background = '';
        }, flashDuration);
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
    const cw = canvas.width;
    const ch = canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;

    const gateSymbols = ['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR'];
    const nandNorLabels = ['NAND', 'NOR', 'NAND', 'NOR'];

    // T4: Shield shimmer — generate ring particles
    if (shapes[0] === 'hex_ring') {
      const ringCount = Math.min(Math.round(particleCount / 8), 18);
      for (let r = 0; r < ringCount; r++) {
        const delay = r * 0.08;
        this.celebrationParticles.push({
          x: cx, y: cy,
          vx: 0, vy: 0,
          size: 0,
          color: colors[r % colors.length],
          shape: 'hex_ring',
          rotation: (r % 2) * (Math.PI / 6),
          rotSpeed: (r % 2 === 0 ? 0.005 : -0.005),
          life: 1,
          decay: 0.008 + Math.random() * 0.004,
          _ringRadius: 0,
          _ringSpeed: 2.5 + r * 0.3,
          _delay: delay,
          _sides: 6,
        });
      }
      // Also add some regular confetti
      for (let i = 0; i < Math.round(particleCount * 0.4); i++) {
        this.celebrationParticles.push({
          x: cx + (Math.random() - 0.5) * 300,
          y: cy + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 10 * velocityMul,
          vy: -Math.random() * 8 - 2,
          size: Math.random() * 5 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: 'circle',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          life: 1,
          decay: 0.007 + Math.random() * 0.006,
        });
      }
    }
    // T3: Electric sparks — radial burst
    else if (shapes[0] === 'spark') {
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (3 + Math.random() * 8) * velocityMul;
        this.celebrationParticles.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: 'spark',
          rotation: angle,
          rotSpeed: 0,
          life: 1,
          decay: 0.01 + Math.random() * 0.008,
          _trail: [],
        });
      }
    }
    // T5: NAND/NOR gate rain
    else if (shapes[0] === 'gate_rain') {
      for (let i = 0; i < particleCount; i++) {
        this.celebrationParticles.push({
          x: Math.random() * cw,
          y: -Math.random() * ch * 0.5 - 20,
          vx: (Math.random() - 0.5) * 2,
          vy: 1.5 + Math.random() * 3,
          size: 8 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: 'gate_rain',
          rotation: (Math.random() - 0.5) * 0.3,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          life: 1,
          decay: 0.004 + Math.random() * 0.004,
          _label: nandNorLabels[Math.floor(Math.random() * nandNorLabels.length)],
        });
      }
    }
    // Default confetti (Chapters 1-2, challenges, and T2 circuit symbols)
    else {
      for (let i = 0; i < particleCount; i++) {
        let shape = shapes[Math.floor(Math.random() * shapes.length)];
        let label = null;
        if (shape === 'gate_symbol') {
          label = gateSymbols[Math.floor(Math.random() * gateSymbols.length)];
        }
        this.celebrationParticles.push({
          x: cx + (Math.random() - 0.5) * 300,
          y: cy + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 14 * velocityMul,
          vy: -Math.random() * 12 - 3,
          size: Math.random() * 7 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shape === 'gate_symbol' ? 'gate_symbol' : shape,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.4,
          life: 1,
          decay: 0.006 + Math.random() * 0.008,
          _label: label,
        });
      }
    }

    // T7: Pure Logic brain emoji particles
    if (config.isPureLogicNew) {
      const brainCount = 12;
      for (let i = 0; i < brainCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        this.celebrationParticles.push({
          x: cx + (Math.random() - 0.5) * 100,
          y: cy + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed * velocityMul,
          vy: Math.sin(angle) * speed * velocityMul - 2,
          size: 16 + Math.random() * 8,
          color: '#fff',
          shape: 'emoji',
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          life: 1,
          decay: 0.005 + Math.random() * 0.004,
          _label: '\u{1F9E0}',
        });
      }
    }

    // T6: 3-star spinning starburst
    let starburstAngle = 0;
    let starburstLife = 1;
    const hasStarburst = stars === 3;

    const ctx2 = canvas.getContext('2d');
    const animate = () => {
      if (!this.celebrationActive) {
        ctx2.clearRect(0, 0, cw, ch);
        return;
      }

      ctx2.clearRect(0, 0, cw, ch);

      // T6: Draw starburst behind everything
      if (hasStarburst && starburstLife > 0) {
        starburstAngle += 0.015;
        starburstLife -= 0.005;
        const rayCount = 12;
        const maxLen = Math.min(cw, ch) * 0.4;
        ctx2.save();
        ctx2.translate(cx, cy * 0.45);
        ctx2.rotate(starburstAngle);
        for (let i = 0; i < rayCount; i++) {
          const a = (i / rayCount) * Math.PI * 2;
          const len = maxLen * (0.6 + 0.4 * Math.sin(performance.now() / 300 + i));
          ctx2.beginPath();
          ctx2.moveTo(0, 0);
          ctx2.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx2.strokeStyle = 'rgba(255, 215, 0, ' + (starburstLife * 0.35) + ')';
          ctx2.lineWidth = 3 + starburstLife * 4;
          ctx2.stroke();
        }
        const grad = ctx2.createRadialGradient(0, 0, 5, 0, 0, 50);
        grad.addColorStop(0, 'rgba(255, 235, 100, ' + (starburstLife * 0.5) + ')');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx2.fillStyle = grad;
        ctx2.beginPath();
        ctx2.arc(0, 0, 50, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
      }

      let alive = 0;
      for (const p of this.celebrationParticles) {
        if (p.life <= 0) continue;

        // Handle delay for hex rings
        if (p._delay && p._delay > 0) {
          p._delay -= 0.016;
          alive++;
          continue;
        }

        alive++;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        ctx2.save();
        ctx2.globalAlpha = Math.max(0, p.life);

        if (p.shape === 'hex_ring') {
          p._ringRadius += p._ringSpeed;
          const r = p._ringRadius;
          const sides = p._sides;
          ctx2.translate(p.x, p.y);
          ctx2.rotate(p.rotation);
          ctx2.beginPath();
          for (let s = 0; s <= sides; s++) {
            const a = (s / sides) * Math.PI * 2;
            const hx = Math.cos(a) * r;
            const hy = Math.sin(a) * r;
            if (s === 0) ctx2.moveTo(hx, hy);
            else ctx2.lineTo(hx, hy);
          }
          ctx2.closePath();
          ctx2.strokeStyle = p.color;
          ctx2.lineWidth = 2.5 * p.life;
          ctx2.shadowColor = p.color;
          ctx2.shadowBlur = 8 * p.life;
          ctx2.stroke();
          ctx2.shadowBlur = 0;
        } else if (p.shape === 'spark') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          if (!p._trail) p._trail = [];
          p._trail.push({ x: p.x, y: p.y, a: p.life });
          if (p._trail.length > 6) p._trail.shift();
          for (let t = 0; t < p._trail.length - 1; t++) {
            const tp = p._trail[t];
            ctx2.beginPath();
            ctx2.arc(tp.x, tp.y, p.size * (t / p._trail.length) * 0.6, 0, Math.PI * 2);
            ctx2.fillStyle = p.color;
            ctx2.globalAlpha = tp.a * (t / p._trail.length) * 0.4;
            ctx2.fill();
          }
          ctx2.globalAlpha = p.life;
          ctx2.beginPath();
          ctx2.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx2.fillStyle = '#fff';
          ctx2.shadowColor = p.color;
          ctx2.shadowBlur = 10;
          ctx2.fill();
          ctx2.shadowBlur = 0;
        } else if (p.shape === 'gate_rain') {
          p.x += p.vx;
          p.y += p.vy;
          ctx2.translate(p.x, p.y);
          ctx2.rotate(p.rotation);
          ctx2.font = 'bold ' + p.size + 'px Courier New';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillStyle = p.color;
          ctx2.shadowColor = p.color;
          ctx2.shadowBlur = 4;
          ctx2.fillText(p._label || 'NAND', 0, 0);
          ctx2.shadowBlur = 0;
        } else if (p.shape === 'gate_symbol') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          ctx2.translate(p.x, p.y);
          ctx2.rotate(p.rotation);
          ctx2.font = 'bold ' + Math.max(8, p.size * 1.5) + 'px Courier New';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillStyle = p.color;
          ctx2.fillText(p._label || 'AND', 0, 0);
        } else if (p.shape === 'emoji') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          ctx2.translate(p.x, p.y);
          ctx2.rotate(p.rotation);
          ctx2.font = p.size + 'px sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillText(p._label || '\u{1F9E0}', 0, 0);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          ctx2.translate(p.x, p.y);
          ctx2.rotate(p.rotation);
          ctx2.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx2.beginPath();
            ctx2.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx2.fill();
          } else if (p.shape === 'triangle') {
            ctx2.beginPath();
            ctx2.moveTo(0, -p.size / 2);
            ctx2.lineTo(-p.size / 2, p.size / 2);
            ctx2.lineTo(p.size / 2, p.size / 2);
            ctx2.closePath();
            ctx2.fill();
          } else {
            ctx2.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
        }
        ctx2.restore();
      }

      if (alive > 0 || (hasStarburst && starburstLife > 0)) {
        requestAnimationFrame(animate);
      } else {
        this.celebrationActive = false;
        ctx2.clearRect(0, 0, cw, ch);
      }
    };

    requestAnimationFrame(animate);
  }

  // ── Level Creator (#121) ──
  setupLevelCreator() {
    const createBtn = document.getElementById('create-level-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.gameState.audio.playButtonClick();
        this.showCreatorScreen();
      });
    }

    const backBtn = document.getElementById('creator-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.gameState.audio.playButtonClick();
        this.gameState.showLevelSelect();
      });
    }

    const playBtn = document.getElementById('creator-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.playCustomLevel();
      });
    }

    const shareBtn = document.getElementById('creator-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.shareCustomLevel();
      });
    }

    // Input/output count sliders
    const inputSlider = document.getElementById('creator-input-slider');
    const outputSlider = document.getElementById('creator-output-slider');
    if (inputSlider) {
      inputSlider.addEventListener('input', () => this.renderCreatorTruthTable());
    }
    if (outputSlider) {
      outputSlider.addEventListener('input', () => this.renderCreatorTruthTable());
    }
  }

  showCreatorScreen() {
    this.gameState._saveLevelSelectScroll();
    this.gameState.currentScreen = 'creator-config';
    this.gameState.stopTimer();
    this.gameState.audio.stopAmbient();
    this.showScreen('creator-config');
    this.renderCreatorTruthTable();
  }

  renderCreatorTruthTable() {
    const numInputs = parseInt(document.getElementById('creator-input-slider').value) || 2;
    const numOutputs = parseInt(document.getElementById('creator-output-slider').value) || 1;
    const numRows = Math.pow(2, numInputs);
    const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
    const outputLabels = numOutputs === 1 ? ['OUT'] : Array.from({ length: numOutputs }, (_, i) => `Y${i}`);

    document.getElementById('creator-input-count').textContent = numInputs;
    document.getElementById('creator-output-count').textContent = numOutputs;

    let html = '<table class="creator-tt"><thead><tr>';
    for (const l of inputLabels) html += `<th class="tt-input">${l}</th>`;
    for (const l of outputLabels) html += `<th class="tt-output">${l}</th>`;
    html += '</tr></thead><tbody>';

    for (let r = 0; r < numRows; r++) {
      html += '<tr>';
      for (let i = numInputs - 1; i >= 0; i--) {
        html += `<td class="tt-input">${(r >> i) & 1}</td>`;
      }
      for (let o = 0; o < numOutputs; o++) {
        html += `<td class="tt-output tt-toggle" data-row="${r}" data-col="${o}">0</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';

    const container = document.getElementById('creator-truth-table');
    container.innerHTML = html;

    // Click to toggle output cells
    container.querySelectorAll('.tt-toggle').forEach(cell => {
      cell.addEventListener('click', () => {
        const val = cell.textContent === '0' ? '1' : '0';
        cell.textContent = val;
        cell.classList.toggle('tt-active', val === '1');
        if (this.gameState.audio) this.gameState.audio.playClick();
      });
    });
  }

  _getCreatorData() {
    const name = document.getElementById('creator-name').value.trim() || 'Custom Level';
    const numInputs = parseInt(document.getElementById('creator-input-slider').value) || 2;
    const numOutputs = parseInt(document.getElementById('creator-output-slider').value) || 1;
    const numRows = Math.pow(2, numInputs);

    const truthTable = [];
    const cells = document.querySelectorAll('#creator-truth-table .tt-toggle');
    let cellIdx = 0;
    for (let r = 0; r < numRows; r++) {
      const row = [];
      // Input bits
      for (let i = numInputs - 1; i >= 0; i--) {
        row.push((r >> i) & 1);
      }
      // Output bits
      for (let o = 0; o < numOutputs; o++) {
        row.push(parseInt(cells[cellIdx].textContent) || 0);
        cellIdx++;
      }
      truthTable.push(row);
    }

    // Collect selected gates
    const gates = [];
    document.querySelectorAll('#creator-gate-select input:checked').forEach(cb => {
      gates.push(cb.value);
    });
    if (gates.length === 0) gates.push('AND', 'OR', 'NOT');

    return { n: name, i: numInputs, o: numOutputs, t: truthTable, g: gates };
  }

  playCustomLevel() {
    const data = this._getCreatorData();
    const level = buildCustomLevel(data);
    const gs = this.gameState;

    gs.isChallengeMode = false;
    gs.isSandboxMode = false;
    gs.currentScreen = 'gameplay';
    this.showScreen('gameplay');
    gs.audio.startAmbient();
    gs.renderer.resize();
    gs.renderer.resetView();
    gs.loadChallengeLevel(level);
    setTimeout(() => gs.renderer.resize(), 100);
    gs.audio.playButtonClick();
  }

  shareCustomLevel() {
    const data = this._getCreatorData();
    const encoded = btoa(JSON.stringify(data));
    const url = window.location.origin + window.location.pathname + '#custom=' + encoded;
    // Day 41: Track custom level creation for Creator achievement
    const creatorAchs = this.gameState.achievements.trackCustomLevelCreated();
    this.showAchievementToasts(creatorAchs);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.updateStatusBar('📋 Share link copied to clipboard!');
        const shareBtn = document.getElementById('creator-share-btn');
        if (shareBtn) {
          const orig = shareBtn.textContent;
          shareBtn.textContent = '✓ Copied!';
          setTimeout(() => { shareBtn.textContent = orig; }, 2000);
        }
      }).catch(() => {
        prompt('Copy this link to share your level:', url);
      });
    } else {
      prompt('Copy this link to share your level:', url);
    }
    this.gameState.audio.playButtonClick();
  }

  // ── Placement Test (Day 31 T2) ──
  setupPlacementTest() {
    const skipBtn = document.getElementById('placement-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        document.getElementById('placement-modal').style.display = 'none';
        this.gameState.completePlacementTest(0);
      });
    }
  }

  showPlacementTest() {
    const modal = document.getElementById('placement-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    const questions = [
      {
        q: 'Which gate outputs 1 only when BOTH inputs are 1?',
        opts: ['OR', 'AND', 'NOT', 'XOR'],
        answer: 1,
      },
      {
        q: 'What does a NOT gate do?',
        opts: ['Combines two signals', 'Flips the input (0→1, 1→0)', 'Outputs 1 when inputs differ', 'Outputs 0 always'],
        answer: 1,
      },
      {
        q: 'XOR outputs 1 when inputs are ___',
        opts: ['Both 1', 'Both 0', 'Different', 'The same'],
        answer: 2,
      },
    ];

    let currentQ = 0;
    let score = 0;

    const renderQuestion = () => {
      const qEl = document.getElementById('placement-question');
      const optEl = document.getElementById('placement-options');
      const progEl = document.getElementById('placement-progress');

      if (currentQ >= questions.length) {
        // Done
        qEl.textContent = score >= 2 ? '🎯 Nice! You know your gates.' : '👋 Welcome! Let\'s start learning.';
        optEl.innerHTML = '';
        progEl.textContent = `Score: ${score}/${questions.length}`;
        setTimeout(() => {
          modal.style.display = 'none';
          this.gameState.completePlacementTest(score);
        }, 1500);
        return;
      }

      const q = questions[currentQ];
      qEl.textContent = q.q;
      progEl.textContent = `Question ${currentQ + 1} of ${questions.length}`;
      optEl.innerHTML = '';

      q.opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'placement-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          if (i === q.answer) {
            score++;
            btn.classList.add('correct');
          } else {
            btn.classList.add('wrong');
            optEl.children[q.answer].classList.add('correct');
          }
          // Disable all
          Array.from(optEl.children).forEach(b => b.disabled = true);
          setTimeout(() => {
            currentQ++;
            renderQuestion();
          }, 800);
        });
        optEl.appendChild(btn);
      });
    };

    renderQuestion();
  }

  // ── Mastery Tree (Day 31 T6) ──
  setupMasteryTree() {
    const btn = document.getElementById('mastery-tree-btn');
    const modal = document.getElementById('mastery-tree-modal');
    const closeBtn = document.getElementById('mastery-tree-close');

    if (btn) btn.addEventListener('click', () => {
      this.renderMasteryTree();
      if (modal) modal.style.display = 'flex';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderMasteryTree() {
    const container = document.getElementById('mastery-tree-view');
    if (!container) return;

    const gs = this.gameState;
    const progress = gs.progress;

    // Determine mastered gates
    const mastered = new Set();
    for (const [levelId, data] of Object.entries(progress.levels || {})) {
      if (data.completed) {
        const level = getLevel(parseInt(levelId));
        if (level && level.availableGates) {
          level.availableGates.forEach(g => mastered.add(g));
        }
      }
    }

    const tree = [
      { id: 'AND', label: 'AND', prereqs: [], tier: 0 },
      { id: 'OR', label: 'OR', prereqs: [], tier: 0 },
      { id: 'NOT', label: 'NOT', prereqs: [], tier: 0 },
      { id: 'XOR', label: 'XOR', prereqs: ['AND', 'OR', 'NOT'], tier: 1 },
      { id: 'NAND', label: 'NAND', prereqs: ['AND', 'NOT'], tier: 2 },
      { id: 'NOR', label: 'NOR', prereqs: ['OR', 'NOT'], tier: 2 },
      { id: 'MYSTERY', label: '???', prereqs: ['XOR'], tier: 3 },
    ];

    let html = '<div class="mastery-tree-grid">';
    const tiers = [0, 1, 2, 3];
    const tierLabels = ['🌱 Basics', '🔀 Combinations', '⚛️ Universal', '🕵️ Mystery'];

    tiers.forEach((tier, ti) => {
      const tierNodes = tree.filter(n => n.tier === tier);
      if (tierNodes.length === 0) return;

      html += `<div class="mastery-tier"><div class="mastery-tier-label">${tierLabels[ti]}</div><div class="mastery-tier-nodes">`;
      for (const node of tierNodes) {
        const isMastered = mastered.has(node.id);
        const prereqsMet = node.prereqs.every(p => mastered.has(p));
        const cls = isMastered ? 'mastery-node mastered' : prereqsMet ? 'mastery-node available' : 'mastery-node locked';
        const color = GateTypes[node.id] ? GateTypes[node.id].color : '#888';
        html += `<div class="${cls}" style="border-color:${isMastered ? color : '#444'}">
          <div class="mastery-node-icon" style="color:${isMastered ? color : '#555'}">${isMastered ? node.label : '🔒'}</div>
          <div class="mastery-node-name">${node.label}</div>
          ${isMastered ? '<div class="mastery-check">✓</div>' : ''}
        </div>`;
      }
      html += '</div></div>';

      // Arrow between tiers
      if (ti < tiers.length - 1) {
        html += '<div class="mastery-arrow">↓</div>';
      }
    });
    html += '</div>';

    const masteredCount = tree.filter(n => mastered.has(n.id)).length;
    html += `<div class="mastery-summary">${masteredCount}/${tree.length} gate types mastered</div>`;

    container.innerHTML = html;
  }

  // ── Circuit Collection Gallery (Day 31 T7) ──
  setupCircuitCollection() {
    const btn = document.getElementById('collection-btn');
    const modal = document.getElementById('collection-modal');
    const closeBtn = document.getElementById('collection-close');

    if (btn) btn.addEventListener('click', () => {
      this.renderCircuitCollection();
      if (modal) modal.style.display = 'flex';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderCircuitCollection() {
    const container = document.getElementById('collection-list');
    if (!container) return;

    const collection = this.gameState.getCollection();
    const chapters = getChapters();

    if (Object.keys(collection).length === 0) {
      container.innerHTML = '<div class="collection-empty">No circuits saved yet. Complete levels to build your collection!</div>';
      return;
    }

    let html = '';
    for (const chapter of chapters) {
      const chapterCircuits = chapter.levels
        .filter(lid => collection[lid])
        .map(lid => ({ id: lid, ...collection[lid], level: getLevel(lid) }));

      if (chapterCircuits.length === 0) continue;

      html += `<div class="collection-chapter"><div class="collection-chapter-title" style="border-color:${chapter.color || '#333'}">${chapter.title}</div>`;
      for (const circuit of chapterCircuits) {
        const starsStr = '★'.repeat(circuit.stars || 0) + '☆'.repeat(3 - (circuit.stars || 0));
        const gateTypes = circuit.gates ? [...new Set(circuit.gates.map(g => g.type))].join(', ') : '—';
        html += `<div class="collection-entry">
          <div class="collection-entry-header">
            <span class="collection-level-name">L${circuit.id}: ${circuit.level ? circuit.level.title : 'Level ' + circuit.id}</span>
            <span class="collection-stars">${starsStr}</span>
          </div>
          <div class="collection-entry-details">
            <span>🔧 ${circuit.gateCount} gates</span>
            <span>🔌 ${circuit.wireCount} wires</span>
            <span>📐 ${gateTypes}</span>
          </div>
          <div class="collection-entry-date">${new Date(circuit.date).toLocaleDateString()}</div>
        </div>`;
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── Logic Profile (Day 31 T9) ──
  setupLogicProfile() {
    const btn = document.getElementById('profile-btn');
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('profile-close');

    if (btn) btn.addEventListener('click', () => {
      this.renderLogicProfile();
      if (modal) modal.style.display = 'flex';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderLogicProfile() {
    const container = document.getElementById('profile-view');
    if (!container) return;

    const gs = this.gameState;
    const progress = gs.progress;

    // Calculate per-gate proficiency
    const gateStats = {};
    const gateTypes = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'];

    for (const gType of gateTypes) {
      gateStats[gType] = { levelsUsed: 0, levelsCompleted: 0, totalStars: 0, maxStars: 0 };
    }

    for (const level of LEVELS) {
      if (!level.availableGates) continue;
      for (const gType of level.availableGates) {
        if (!gateStats[gType]) continue;
        gateStats[gType].levelsUsed++;
        gateStats[gType].maxStars += 3;
        const p = progress.levels[level.id];
        if (p && p.completed) {
          gateStats[gType].levelsCompleted++;
          gateStats[gType].totalStars += p.stars || 0;
        }
      }
    }

    // Find strongest and weakest
    let strongest = null, weakest = null;
    let highPct = -1, lowPct = 101;

    for (const [gType, stats] of Object.entries(gateStats)) {
      if (stats.levelsUsed === 0) continue;
      const pct = stats.maxStars > 0 ? (stats.totalStars / stats.maxStars) * 100 : 0;
      if (pct > highPct) { highPct = pct; strongest = gType; }
      if (pct < lowPct && stats.levelsUsed > 0) { lowPct = pct; weakest = gType; }
    }

    // Recommend next action
    let recommendation = '';
    if (weakest && lowPct < 50) {
      recommendation = `Focus on <strong>${weakest}</strong> levels — only ${Math.round(lowPct)}% mastery.`;
    } else if (weakest) {
      recommendation = `Try improving your <strong>${weakest}</strong> scores for perfect mastery.`;
    } else {
      recommendation = 'You\'re doing great! Try the daily challenge.';
    }

    let html = '<div class="profile-grid">';
    for (const [gType, stats] of Object.entries(gateStats)) {
      if (stats.levelsUsed === 0) continue;
      const pct = stats.maxStars > 0 ? Math.round((stats.totalStars / stats.maxStars) * 100) : 0;
      const color = GateTypes[gType] ? GateTypes[gType].color : '#888';
      const barColor = pct >= 80 ? '#0f0' : pct >= 50 ? '#cc0' : '#f44';
      const isStrong = gType === strongest;
      const isWeak = gType === weakest;

      html += `<div class="profile-gate ${isStrong ? 'profile-strong' : ''} ${isWeak ? 'profile-weak' : ''}">
        <div class="profile-gate-name" style="color:${color}">${gType} ${isStrong ? '💪' : ''} ${isWeak ? '📈' : ''}</div>
        <div class="profile-bar"><div class="profile-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <div class="profile-gate-stats">${stats.levelsCompleted}/${stats.levelsUsed} levels · ⭐ ${stats.totalStars}/${stats.maxStars} · ${pct}%</div>
      </div>`;
    }
    html += '</div>';

    // Hint tokens status
    const tokens = gs.hintTokens;
    html += `<div class="profile-tokens">🪙 Hint Tokens: <strong>${tokens.tokens}</strong> (${tokens.earned} earned total)</div>`;

    // Recommendation
    html += `<div class="profile-recommendation">💡 ${recommendation}</div>`;

    // Overall mastery level
    const totalCompleted = Object.values(progress.levels || {}).filter(d => d.completed).length;
    const totalLevels = getLevelCount();
    const overallPct = totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0;
    let rank;
    if (overallPct >= 95) rank = '🎓 Master Logician';
    else if (overallPct >= 75) rank = '⚡ Circuit Expert';
    else if (overallPct >= 50) rank = '🔧 Logic Engineer';
    else if (overallPct >= 25) rank = '📐 Gate Apprentice';
    else rank = '🌱 Beginner';

    html += `<div class="profile-rank"><div class="profile-rank-label">${rank}</div><div class="profile-rank-bar"><div class="profile-rank-fill" style="width:${overallPct}%"></div></div><div class="profile-rank-pct">${overallPct}% complete</div></div>`;

    container.innerHTML = html;
  }

  // ── Share Card Generator (Day 31 T5) ──
  setupShareCard() {
    const modal = document.getElementById('share-card-modal');
    const closeBtn = document.getElementById('share-card-close');
    const downloadBtn = document.getElementById('share-card-download');

    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const canvas = document.getElementById('share-card-canvas');
        const link = document.createElement('a');
        link.download = 'signal-circuit-achievement.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  }

  generateShareCard(level, stars, gateCount, aesthetics) {
    const canvas = document.getElementById('share-card-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = 1200, h = 630;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#1a1a3e');
    grad.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Circuit board pattern
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Brand
    ctx.font = 'bold 48px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ Signal Circuit', 60, 80);

    // Level info
    ctx.font = 'bold 36px Courier New';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Level ${level.id}: ${level.title}`, 60, 160);

    // Stars
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    ctx.font = '72px serif';
    ctx.fillText(starStr, 60, 260);

    // Stats
    ctx.font = '28px Courier New';
    ctx.fillStyle = '#ccc';
    ctx.fillText(`🔧 ${gateCount} gates`, 60, 340);
    ctx.fillText(`📊 Optimal: ${level.optimalGates}`, 60, 380);

    if (aesthetics) {
      ctx.fillText(`${aesthetics.label} (${aesthetics.score}%)`, 60, 420);
    }

    // Time
    const gs = this.gameState;
    const elapsed = gs.timerStart ? Math.floor((Date.now() - gs.timerStart) / 1000) : 0;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, 60, 460);

    // URL
    ctx.font = '20px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.fillText('mikedyan.github.io/signal-circuit', 60, h - 40);

    // Day 34 T7: Subtle watermark overlay
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.font = 'bold 120px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.2);
    ctx.textAlign = 'center';
    ctx.fillText('SIGNAL CIRCUIT', 0, 0);
    ctx.restore();

    // Decorative circuit elements on the right side
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const x = 700 + Math.random() * 400;
      const y = 100 + Math.random() * 400;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 40 + Math.random() * 60, y + (Math.random() - 0.5) * 80);
      ctx.stroke();
    }

    // Show modal
    const modal = document.getElementById('share-card-modal');
    if (modal) modal.style.display = 'flex';
  }

  // ── Day 32 T3: Challenge Friend Button ──
  showChallengeFriendButton(level, gateCount) {
    const btn = document.getElementById('challenge-friend-btn');
    if (!btn) return;
    btn.style.display = '';
    btn.onclick = () => {
      const hash = encodeFriendChallenge(level, gateCount);
      const url = window.location.origin + window.location.pathname + hash;
      // Day 41: Track social share for Social Butterfly achievement
      const shareAchs = this.gameState.achievements.trackFriendChallengeShare();
      this.showAchievementToasts(shareAchs);
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = '✅ Link Copied!';
        setTimeout(() => { btn.textContent = '🤝 Challenge Friend'; }, 2000);
      }).catch(() => {
        // Fallback: show URL in prompt
        prompt('Share this link:', url);
      });
    };
  }

  // ── Day 32 T4: Apply Seasonal Theme ──
  applySeasonalTheme() {
    const theme = getSeasonalTheme();
    const dailyBtn = document.getElementById('daily-challenge-btn');
    if (dailyBtn) {
      dailyBtn.textContent = `${theme.emoji} Daily Challenge`;
      dailyBtn.style.borderColor = theme.accent;
    }
    // Apply seasonal accent as CSS variable
    document.documentElement.style.setProperty('--seasonal-accent', theme.accent);
  }

  // ── Day 32 T5: Enhanced Stats Dashboard ──
  renderEnhancedStats() {
    const container = document.getElementById('stats-grid');
    if (!container) return;

    // Call existing stats render first
    this.renderStatsDashboard();

    const gs = this.gameState;
    const progress = gs.progress;

    // Per-level gate count chart
    let chartHtml = '<div class="stat-card stat-card-wide"><div class="stat-icon">📊</div><h4 style="color:#0f0;margin:4px 0;">Gates per Level</h4>';
    const levels = typeof LEVELS !== 'undefined' ? LEVELS : [];
    const maxGates = Math.max(...levels.map(l => {
      const p = progress.levels[l.id];
      return p && p.bestGateCount ? p.bestGateCount : 0;
    }), 1);

    for (const level of levels.slice(0, 15)) {
      const p = progress.levels[level.id];
      const gates = p && p.bestGateCount ? p.bestGateCount : 0;
      const pct = Math.round((gates / maxGates) * 100);
      const optimal = level.optimalGates || 1;
      const barColor = gates <= optimal ? '#0f0' : gates <= (level.goodGates || optimal + 2) ? '#FFD700' : '#FF6B6B';
      chartHtml += `<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin:2px 0;">
        <span style="width:28px;color:#888;">${level.id}</span>
        <div style="flex:1;height:10px;background:#222;border-radius:3px;overflow:hidden;">
          <div style="width:${gates ? pct : 0}%;height:100%;background:${barColor};border-radius:3px;"></div>
        </div>
        <span style="width:28px;color:#ccc;text-align:right;">${gates || '—'}</span>
      </div>`;
    }
    chartHtml += '</div>';

    // Gate usage distribution
    let gateUsage = {};
    for (const level of levels) {
      const p = progress.levels[level.id];
      if (p && p.completed && level.availableGates) {
        for (const g of level.availableGates) {
          gateUsage[g] = (gateUsage[g] || 0) + 1;
        }
      }
    }
    let gateHtml = '<div class="stat-card"><div class="stat-icon">🔧</div><h4 style="color:#0f0;margin:4px 0;">Gate Exposure</h4>';
    for (const [gate, count] of Object.entries(gateUsage).sort((a, b) => b[1] - a[1])) {
      gateHtml += `<div style="font-size:11px;color:#ccc;">${gate}: ${count} levels</div>`;
    }
    gateHtml += '</div>';

    container.innerHTML += chartHtml + gateHtml;
  }

  // ── Day 32 T7: Setup Weekly Puzzle + T8 Blitz + T9 Speedrun + T10 Review ──
  setupCompetitiveModes() {
    // Weekly puzzle
    const weeklyBtn = document.getElementById('weekly-puzzle-btn');
    if (weeklyBtn) {
      weeklyBtn.addEventListener('click', () => {
        const gs = this.gameState;
        const level = generateWeeklyPuzzle();
        gs.isChallengeMode = false;
        gs.isSandboxMode = false;
        gs.currentScreen = 'gameplay';
        this.showScreen('gameplay');
        gs.audio.startAmbient();
        gs.renderer.resize();
        gs.renderer.resetView();
        gs.loadChallengeLevel(level);
        setTimeout(() => gs.renderer.resize(), 100);
      });
    }

    // Blitz mode
    const blitzBtn = document.getElementById('blitz-mode-btn');
    if (blitzBtn) {
      blitzBtn.addEventListener('click', () => {
        this.gameState.startBlitzMode();
      });
    }

    // Speedrun mode
    const speedrunBtn = document.getElementById('speedrun-btn');
    if (speedrunBtn) {
      speedrunBtn.addEventListener('click', () => {
        this.gameState.startSpeedrunMode();
      });
    }

    // Speedrun exit
    const speedrunExit = document.getElementById('speedrun-exit-btn');
    if (speedrunExit) {
      speedrunExit.addEventListener('click', () => {
        this.gameState.stopSpeedrunMode();
      });
    }
  }

  // ── Day 33 T4: Simplified Visual Mode ──
  setupSimplifiedVisual() {
    const btn = document.getElementById('simplified-visual-btn');
    if (!btn) return;

    let isActive = false;
    try { isActive = localStorage.getItem('signal-circuit-simplified') === 'true'; } catch (e) {}
    if (isActive) {
      document.body.classList.add('simplified-visual');
      btn.textContent = '🧩 Simplified: On';
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      isActive = !isActive;
      document.body.classList.toggle('simplified-visual', isActive);
      btn.textContent = isActive ? '🧩 Simplified: On' : '🧩 Simplified: Off';
      btn.classList.toggle('active', isActive);
      try { localStorage.setItem('signal-circuit-simplified', isActive ? 'true' : 'false'); } catch (e) {}
    });
  }

  // ── Day 33 T8: Cross-Device Sync UI ──
  setupSyncButtons() {
    const exportBtn = document.getElementById('export-progress-btn');
    const importBtn = document.getElementById('import-progress-btn');
    if (!exportBtn || !importBtn) return;

    exportBtn.addEventListener('click', () => {
      const code = this.gameState.exportProgress();
      if (code) {
        // Try clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            this.updateStatusBar('📋 Progress code copied to clipboard!');
            exportBtn.textContent = '✅ Copied!';
            setTimeout(() => { exportBtn.textContent = '📤 Export Progress'; }, 2000);
          }).catch(() => {
            prompt('Copy this code:', code);
          });
        } else {
          prompt('Copy this code:', code);
        }
      }
    });

    importBtn.addEventListener('click', () => {
      const code = prompt('Paste your progress code:');
      if (!code) return;
      const ok = this.gameState.importProgress(code);
      if (ok) {
        this.updateStatusBar('✅ Progress imported successfully!');
        this.renderLevelSelect();
        this.updateProgressBar(this.gameState.progress);
      } else {
        this.updateStatusBar('❌ Invalid progress code');
        alert('Invalid progress code. Please check and try again.');
      }
    });
  }

  // ── Day 33 T9: Accessible Wiring Panel ──
  setupAccessibleWiring() {
    const toggle = document.getElementById('accessible-wiring-btn');
    if (!toggle) return;

    let isActive = false;
    try { isActive = localStorage.getItem('signal-circuit-a11y-wiring') === 'true'; } catch (e) {}

    const panel = document.getElementById('accessible-wire-panel');
    if (panel) panel.style.display = isActive ? '' : 'none';

    if (isActive) {
      toggle.textContent = '🔌 Accessible Wiring: On';
      toggle.classList.add('active');
    }

    toggle.addEventListener('click', () => {
      isActive = !isActive;
      toggle.textContent = isActive ? '🔌 Accessible Wiring: On' : '🔌 Accessible Wiring: Off';
      toggle.classList.toggle('active', isActive);
      if (panel) panel.style.display = isActive ? '' : 'none';
      try { localStorage.setItem('signal-circuit-a11y-wiring', isActive ? 'true' : 'false'); } catch (e) {}
    });

    // Connect button
    const connectBtn = document.getElementById('a11y-wire-connect');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        this._doAccessibleWireConnect();
      });
    }
  }

  _refreshAccessibleWireDropdowns() {
    const srcSelect = document.getElementById('a11y-wire-source');
    const dstSelect = document.getElementById('a11y-wire-dest');
    if (!srcSelect || !dstSelect) return;

    const gs = this.gameState;
    srcSelect.innerHTML = '<option value="">-- Source (output pin) --</option>';
    dstSelect.innerHTML = '<option value="">-- Destination (input pin) --</option>';

    // Collect output pins (sources)
    for (const node of gs.inputNodes) {
      srcSelect.innerHTML += `<option value="io-${node.id}-0">${node.label} (output)</option>`;
    }
    for (const gate of gs.gates) {
      const pins = gate.getOutputPins();
      pins.forEach((p, i) => {
        srcSelect.innerHTML += `<option value="g-${gate.id}-${i}">${gate.type} #${gate.id} out${pins.length > 1 ? i : ''}</option>`;
      });
    }

    // Collect input pins (destinations)
    for (const node of gs.outputNodes) {
      dstSelect.innerHTML += `<option value="io-${node.id}-0">${node.label} (input)</option>`;
    }
    for (const gate of gs.gates) {
      const inputCount = gate.def.inputs;
      for (let i = 0; i < inputCount; i++) {
        dstSelect.innerHTML += `<option value="g-${gate.id}-${i}">${gate.type} #${gate.id} in${i}</option>`;
      }
    }
  }

  _doAccessibleWireConnect() {
    const srcSelect = document.getElementById('a11y-wire-source');
    const dstSelect = document.getElementById('a11y-wire-dest');
    if (!srcSelect || !dstSelect) return;

    const srcVal = srcSelect.value;
    const dstVal = dstSelect.value;
    if (!srcVal || !dstVal) {
      this.updateStatusBar('Select both source and destination pins');
      return;
    }

    const parsePinVal = (val) => {
      const parts = val.split('-');
      if (parts[0] === 'io') return { gateId: parseInt(parts[1]), pinIndex: parseInt(parts[2]) };
      if (parts[0] === 'g') return { gateId: parseInt(parts[1]), pinIndex: parseInt(parts[2]) };
      return null;
    };

    const src = parsePinVal(srcVal);
    const dst = parsePinVal(dstVal);
    if (!src || !dst) return;

    const gs = this.gameState;
    const wire = gs.addWireFromData(src.gateId, src.pinIndex, dst.gateId, dst.pinIndex);
    if (wire) {
      gs.audio.playWireConnect();
      gs.undoManager.push({ type: 'addWire', wireId: wire.id, fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
      gs.ui.updateGateIndicator();
      this.updateStatusBar('Wire connected!');
      this._refreshAccessibleWireDropdowns();
    }
  }

  // ── Day 33 T10: Welcome Back Modal ──
  showWelcomeBackModal(daysSince) {
    const gs = this.gameState;
    const progress = gs.progress;
    const completedCount = Object.values(progress.levels || {}).filter(l => l.completed).length;
    const totalStars = Object.values(progress.levels || {}).reduce((sum, l) => sum + (l.stars || 0), 0);

    // Find last level played
    let lastLevel = null;
    let lastLevelId = 0;
    for (const [id, data] of Object.entries(progress.levels || {})) {
      if (data.lastPlayed && data.lastPlayed > (lastLevel ? lastLevel.lastPlayed : 0)) {
        lastLevel = data;
        lastLevelId = parseInt(id);
      }
    }

    const modal = document.getElementById('welcome-back-modal');
    if (!modal) return;

    const content = document.getElementById('welcome-back-content');
    if (!content) return;

    let html = `<div style="font-size:32px;margin-bottom:8px;">👋</div>`;
    html += `<h3 style="color:#0f0;margin-bottom:8px;">Welcome Back, Engineer!</h3>`;
    html += `<p style="color:#aaa;font-size:12px;margin-bottom:12px;">It's been ${daysSince} days since your last session.</p>`;
    html += `<div style="text-align:left;padding:8px;background:#1a1a2e;border-radius:8px;margin-bottom:12px;">`;
    html += `<div style="color:#ccc;font-size:12px;">📊 Your progress: ${completedCount} levels · ⭐ ${totalStars} stars</div>`;
    if (lastLevelId) {
      const lvl = getLevel(lastLevelId);
      html += `<div style="color:#888;font-size:11px;margin-top:4px;">Last played: Level ${lastLevelId}${lvl ? ' — ' + lvl.title : ''}</div>`;
    }
    html += `</div>`;
    html += `<p style="color:#aaa;font-size:11px;margin-bottom:12px;">Quick refresher: Place gates, draw wires, match the truth table. ⭐⭐⭐ for optimal gate count!</p>`;
    content.innerHTML = html;

    const continueBtn = document.getElementById('welcome-back-continue');
    const freshBtn = document.getElementById('welcome-back-fresh');

    if (continueBtn) {
      continueBtn.onclick = () => { modal.style.display = 'none'; };
    }
    if (freshBtn) {
      freshBtn.onclick = () => {
        gs.resetProgress();
        this.renderLevelSelect();
        this.updateProgressBar(gs.progress);
        modal.style.display = 'none';
      };
    }

    modal.style.display = 'flex';
  }

  // ── Day 32 T10: Render Spaced Repetition Review ──

  // ── Day 43: Level Preview Thumbnail Rendering ──

  _renderPreviewCanvas(canvas, levelId) {
    const preview = this.gameState.getPreview(levelId);
    if (!preview || !preview.g) return;

    const ctx = canvas.getContext('2d');
    const cw = canvas.width;   // 240 (2x for retina)
    const ch = canvas.height;  // 160

    // Compute bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const g of preview.g) {
      const def = typeof GateTypes !== 'undefined' ? GateTypes[g.t] : null;
      const gw = def ? def.width : 80;
      const gh = def ? def.height : 60;
      minX = Math.min(minX, g.x);
      minY = Math.min(minY, g.y);
      maxX = Math.max(maxX, g.x + gw);
      maxY = Math.max(maxY, g.y + gh);
    }
    for (const io of preview.io) {
      minX = Math.min(minX, io.x);
      minY = Math.min(minY, io.y);
      maxX = Math.max(maxX, io.x + 50);
      maxY = Math.max(maxY, io.y + 40);
    }
    for (const w of preview.w) {
      minX = Math.min(minX, w.fx, w.tx);
      minY = Math.min(minY, w.fy, w.ty);
      maxX = Math.max(maxX, w.fx, w.tx);
      maxY = Math.max(maxY, w.fy, w.ty);
    }

    if (minX === Infinity) return; // No elements

    // Add padding
    const pad = 15;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const bw = maxX - minX;
    const bh = maxY - minY;

    // Scale to fit canvas with aspect ratio preservation
    const scaleX = cw / bw;
    const scaleY = ch / bh;
    const scale = Math.min(scaleX, scaleY);
    const offX = (cw - bw * scale) / 2 - minX * scale;
    const offY = (ch - bh * scale) / 2 - minY * scale;

    ctx.clearRect(0, 0, cw, ch);

    // Dark translucent background
    ctx.fillStyle = 'rgba(20, 25, 35, 0.85)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    // Draw wires as thin lines
    ctx.lineWidth = 2 / scale;
    ctx.lineCap = 'round';
    const wireColors = typeof WIRE_COLORS_DEFAULT !== 'undefined' ? WIRE_COLORS_DEFAULT : ['#4488ff'];
    for (let i = 0; i < preview.w.length; i++) {
      const w = preview.w[i];
      ctx.strokeStyle = wireColors[i % wireColors.length];
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      // Simple bezier
      const dx = w.tx - w.fx;
      const cpOffset = Math.abs(dx) * 0.4;
      ctx.moveTo(w.fx, w.fy);
      ctx.bezierCurveTo(w.fx + cpOffset, w.fy, w.tx - cpOffset, w.ty, w.tx, w.ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw I/O nodes as colored dots
    for (const io of preview.io) {
      const cx = io.x + 25;
      const cy = io.y + 20;
      const r = 6 / Math.max(scale, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = io.t === 'i' ? '#44cc88' : '#4488ff';
      ctx.fill();
      ctx.strokeStyle = io.t === 'i' ? '#33aa66' : '#3366cc';
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke();
    }

    // Draw gates as small colored rectangles
    for (const g of preview.g) {
      const def = typeof GateTypes !== 'undefined' ? GateTypes[g.t] : null;
      const gw = def ? def.width : 80;
      const gh = def ? def.height : 60;
      const color = def ? def.color : '#888';
      // Fill
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      const cr = 4 / scale;
      ctx.beginPath();
      ctx.moveTo(g.x + cr, g.y);
      ctx.lineTo(g.x + gw - cr, g.y);
      ctx.quadraticCurveTo(g.x + gw, g.y, g.x + gw, g.y + cr);
      ctx.lineTo(g.x + gw, g.y + gh - cr);
      ctx.quadraticCurveTo(g.x + gw, g.y + gh, g.x + gw - cr, g.y + gh);
      ctx.lineTo(g.x + cr, g.y + gh);
      ctx.quadraticCurveTo(g.x, g.y + gh, g.x, g.y + gh - cr);
      ctx.lineTo(g.x, g.y + cr);
      ctx.quadraticCurveTo(g.x, g.y, g.x + cr, g.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
      // Gate label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.round(10 / Math.max(scale, 0.3)) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g.t, g.x + gw / 2, g.y + gh / 2);
    }

    ctx.restore();
  }

  _showEnlargedPreview(sourceCanvas, levelId, event) {
    this._hideEnlargedPreview(); // Clean up any existing

    const overlay = document.createElement('div');
    overlay.id = 'preview-enlarged-overlay';
    overlay.className = 'preview-enlarged-overlay';

    const bigCanvas = document.createElement('canvas');
    bigCanvas.width = 600;
    bigCanvas.height = 400;
    bigCanvas.style.width = '300px';
    bigCanvas.style.height = '200px';
    bigCanvas.className = 'preview-enlarged-canvas';
    overlay.appendChild(bigCanvas);

    // Level title
    const level = typeof getLevel === 'function' ? getLevel(levelId) : null;
    if (level) {
      const title = document.createElement('div');
      title.className = 'preview-enlarged-title';
      title.textContent = 'Level ' + levelId + ': ' + level.title;
      overlay.appendChild(title);
    }

    document.body.appendChild(overlay);
    this._enlargedPreview = overlay;

    // Position near the source canvas
    const rect = sourceCanvas.getBoundingClientRect();
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '10000';
    // Position above or below depending on space
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow > 230) {
      overlay.style.top = (rect.bottom + 8) + 'px';
    } else {
      overlay.style.top = Math.max(8, rect.top - 228) + 'px';
    }
    overlay.style.left = Math.max(8, Math.min(rect.left - 90, window.innerWidth - 320)) + 'px';

    // Render enlarged version
    this._renderPreviewCanvas(bigCanvas, levelId);

    // Dismiss on click outside
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      this._hideEnlargedPreview();
    });
  }

  _hideEnlargedPreview() {
    if (this._enlargedPreview) {
      this._enlargedPreview.remove();
      this._enlargedPreview = null;
    }
  }

  renderReviewSection() {
    const gs = this.gameState;
    const reviews = gs.getReviewLevels();
    const section = document.getElementById('review-section');
    const container = document.getElementById('review-levels');
    if (!section || !container) return;

    if (reviews.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    container.innerHTML = '';

    for (const rev of reviews) {
      const level = getLevel(rev.levelId);
      if (!level) continue;
      const btn = document.createElement('div');
      btn.className = 'level-btn review-level';
      btn.innerHTML = `<span class="level-number">${rev.levelId}</span>
        <span class="level-btn-title">${level.title}</span>
        <span style="color:#888;font-size:10px;">${rev.daysSincePlay}d ago · ${'★'.repeat(rev.stars)}${'☆'.repeat(3 - rev.stars)}</span>`;
      btn.addEventListener('click', () => gs.startLevel(rev.levelId));
      container.appendChild(btn);
    }
  }

  // ── Day 35 T5: Light Mode Toggle ──
  setupLightMode() {
    const btn = document.getElementById('light-mode-btn');
    if (!btn) return;

    let isLight = false;

    // Auto-detect from system preference on first visit
    try {
      const saved = localStorage.getItem('signal-circuit-theme');
      if (saved) {
        isLight = saved === 'light';
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        isLight = true;
      }
    } catch (e) {}

    const applyTheme = (light) => {
      document.body.classList.toggle('light-mode', light);
      btn.textContent = light ? '☀️ Light Mode' : '🌙 Dark Mode';
      btn.classList.toggle('active', light);
      // Notify canvas renderer to redraw with new colors
      if (this.gameState && this.gameState.renderer) {
        this.gameState.markDirty();
      }
    };

    applyTheme(isLight);

    btn.addEventListener('click', () => {
      isLight = !isLight;
      applyTheme(isLight);
      try { localStorage.setItem('signal-circuit-theme', isLight ? 'light' : 'dark'); } catch (e) {}
    });
  }

  // ── Day 35 T6: Undo History Timeline ──
  setupUndoTimeline() {
    this._undoTimelineEl = document.getElementById('undo-timeline');
    this._undoTimelineTrack = document.getElementById('undo-timeline-track');
  }

  updateUndoTimeline() {
    const el = this._undoTimelineEl;
    const track = this._undoTimelineTrack;
    if (!el || !track) return;

    const gs = this.gameState;
    if (!gs || !gs.undoManager) return;

    const undoStack = gs.undoManager.undoStack;
    const redoStack = gs.undoManager.redoStack;
    const total = undoStack.length + redoStack.length;

    if (total === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = '';
    track.innerHTML = '';

    // Action type labels for tooltips
    const typeLabels = {
      addGate: '+ Gate',
      removeGate: '- Gate',
      addWire: '+ Wire',
      removeWire: '- Wire',
      moveIONode: 'Move',
      clearCircuit: 'Clear',
    };

    // Undo stack entries (past actions)
    for (let i = 0; i < undoStack.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'undo-dot';
      if (i === undoStack.length - 1) dot.classList.add('current');
      const action = undoStack[i];
      dot.title = typeLabels[action.type] || action.type;
      const idx = i;
      dot.addEventListener('click', () => {
        // Undo back to this point
        const steps = undoStack.length - 1 - idx;
        for (let s = 0; s < steps; s++) gs.performUndo();
        this.updateUndoTimeline();
      });
      track.appendChild(dot);
    }

    // Redo stack entries (future actions, shown greyed)
    for (let i = redoStack.length - 1; i >= 0; i--) {
      const dot = document.createElement('div');
      dot.className = 'undo-dot future';
      const action = redoStack[i];
      dot.title = typeLabels[action.type] || action.type;
      const stepsForward = redoStack.length - i;
      dot.addEventListener('click', () => {
        for (let s = 0; s < stepsForward; s++) gs.performRedo();
        this.updateUndoTimeline();
      });
      track.appendChild(dot);
    }

    // Auto-scroll to show current position
    const currentDot = track.querySelector('.current');
    if (currentDot) currentDot.scrollIntoView({ inline: 'center', behavior: 'smooth' });
  }

  // ── Day 40: Cosmetic Customization Modal ──

  setupCosmeticModal() {
    const btn = document.getElementById('customize-btn');
    const modal = document.getElementById('cosmetic-modal');
    const closeBtn = document.getElementById('cosmetic-close');
    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
      this.renderCosmeticModal();
      modal.style.display = 'flex';
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  renderCosmeticModal() {
    const sections = document.getElementById('cosmetic-sections');
    if (!sections || !this.gameState.cosmetics) return;
    const data = this.gameState.cosmetics.getAllForUI();

    let html = '';

    // Wire Colors
    html += '<div class="cosmetic-section-title">Wire Colors</div>';
    html += '<div class="cosmetic-grid">';
    for (const c of data.wireColors) {
      const cls = (c.active ? ' cosmetic-active' : '') + (!c.unlocked ? ' cosmetic-locked' : '');
      html += '<div class="cosmetic-card' + cls + '" data-category="wireColor" data-id="' + c.id + '">';
      html += '<div class="cosmetic-card-preview">';
      if (c.palette) {
        for (let i = 0; i < Math.min(5, c.palette.length); i++) {
          html += '<span class="cosmetic-swatch" style="background:' + c.palette[i] + '"></span>';
        }
      } else {
        const defaults = ['#4488ff', '#ff6644', '#44cc44', '#cc44cc', '#ffaa22'];
        for (const col of defaults) {
          html += '<span class="cosmetic-swatch" style="background:' + col + '"></span>';
        }
      }
      html += '</div>';
      html += '<div class="cosmetic-card-name">' + c.name + '</div>';
      html += '<div class="cosmetic-card-desc">' + c.desc + '</div>';
      if (!c.unlocked) html += '<div class="cosmetic-card-condition">' + c.conditionText + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Gate Skins
    html += '<div class="cosmetic-section-title">Gate Skins</div>';
    html += '<div class="cosmetic-grid">';
    for (const c of data.gateSkins) {
      const cls = (c.active ? ' cosmetic-active' : '') + (!c.unlocked ? ' cosmetic-locked' : '');
      const skinEmojis = { ic_chip: '🔲', neon: '💡', retro: '📻', minimal: '⬜' };
      html += '<div class="cosmetic-card' + cls + '" data-category="gateSkin" data-id="' + c.id + '">';
      html += '<div class="cosmetic-card-preview"><span style="font-size:20px">' + (skinEmojis[c.id] || '🔲') + '</span></div>';
      html += '<div class="cosmetic-card-name">' + c.name + '</div>';
      html += '<div class="cosmetic-card-desc">' + c.desc + '</div>';
      if (!c.unlocked) html += '<div class="cosmetic-card-condition">' + c.conditionText + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Board Themes
    html += '<div class="cosmetic-section-title">Board Themes</div>';
    html += '<div class="cosmetic-grid">';
    for (const c of data.boardThemes) {
      const cls = (c.active ? ' cosmetic-active' : '') + (!c.unlocked ? ' cosmetic-locked' : '');
      const themeColors = { breadboard: '#ece8d8', pcb_green: '#0a4a0a', dark_circuit: '#080810', blueprint: '#f0f4ff' };
      html += '<div class="cosmetic-card' + cls + '" data-category="boardTheme" data-id="' + c.id + '">';
      html += '<div class="cosmetic-card-preview"><span style="display:inline-block;width:40px;height:20px;border-radius:4px;background:' + (themeColors[c.id] || '#888') + ';border:1px solid #555;"></span></div>';
      html += '<div class="cosmetic-card-name">' + c.name + '</div>';
      html += '<div class="cosmetic-card-desc">' + c.desc + '</div>';
      if (!c.unlocked) html += '<div class="cosmetic-card-condition">' + c.conditionText + '</div>';
      html += '</div>';
    }
    html += '</div>';

    sections.innerHTML = html;

    // Attach click handlers
    sections.querySelectorAll('.cosmetic-card:not(.cosmetic-locked)').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        const id = card.dataset.id;
        if (cat === 'wireColor') this.gameState.cosmetics.setWireColor(id);
        else if (cat === 'gateSkin') this.gameState.cosmetics.setGateSkin(id);
        else if (cat === 'boardTheme') this.gameState.cosmetics.setBoardTheme(id);
        this.renderCosmeticModal();
        if (this.gameState.audio) this.gameState.audio.playButtonClick();
      });
    });
  }

  showCosmeticUnlockToast(name) {
    const toast = document.createElement('div');
    toast.className = 'cosmetic-unlock-toast';
    toast.textContent = '\uD83C\uDFA8 New cosmetic unlocked: ' + name;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4100);
  }

}
