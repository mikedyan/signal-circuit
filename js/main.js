// main.js — App initialization, game state, undo/redo, progress

// ── Info Panel Toggle ──
function toggleInfoPanel() {
  const panel = document.getElementById('info-panel');
  const btn = document.getElementById('panel-toggle');
  const isMobile = window.innerWidth <= 768;
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  if (isMobile) {
    btn.textContent = collapsed ? '▲ Info' : '▼ Hide';
  } else {
    btn.textContent = collapsed ? '◀' : '▶';
  }
  // Let canvas re-fill the space
  setTimeout(() => {
    if (window.game && window.game.renderer) window.game.renderer.resize();
  }, 300);
}

const COSMETICS_KEY = 'signal-circuit-cosmetics';
const STORAGE_KEY = 'signal-circuit-progress';
const LEADERBOARD_KEY = 'signal-circuit-leaderboard';
const STATS_KEY = 'signal-circuit-stats';
const MILESTONES_KEY = 'signal-circuit-milestones';
const AUTOSAVE_KEY = 'signal-circuit-autosave';
const GHOST_KEY = 'signal-circuit-ghost';
const REPLAY_KEY = 'signal-circuit-replays';
const COLLECTION_KEY = 'signal-circuit-collection';
const TOKENS_KEY = 'signal-circuit-hint-tokens';
const PROFILE_KEY = 'signal-circuit-profile';
const PREVIEW_KEY = 'signal-circuit-previews';
const PLACEMENT_KEY = 'signal-circuit-placement-done';
const DAILY_LB_KEY = 'signal-circuit-daily-leaderboard';
const SCHEMA_VERSION = 1;

// F29-4: Safe localStorage wrapper — graceful fallback on quota exceeded
const SafeStorage = {
  _warned: false,

  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (!this._warned && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
        this._warned = true;
        this._showWarning();
      }
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },

  _showWarning() {
    // Show a brief toast warning
    let toast = document.getElementById('storage-warning');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'storage-warning';
      toast.textContent = '⚠ Storage full — progress may not save. Clear browser data to fix.';
      document.body.appendChild(toast);
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5200);
    }
  },
};

// ── Cosmetic Unlock System (Day 40) ──

const COSMETIC_WIRE_COLORS = [
  { id: 'classic', name: 'Classic', desc: 'Standard jumper wire palette', condition: null, palette: null },
  { id: 'blue', name: 'Arctic Blue', desc: 'Cool blue-toned wires', condition: { type: 'stars', count: 10 },
    palette: ['#2288ff','#44aaff','#66ccff','#0066dd','#3399ee','#1177cc','#55bbff','#0088ff','#77aadd','#aaccff'] },
  { id: 'orange', name: 'Ember', desc: 'Warm orange and amber wires', condition: { type: 'stars', count: 25 },
    palette: ['#ff8822','#ffaa44','#ff6600','#cc5500','#ee7711','#ffbb55','#dd6622','#ff9933','#cc7733','#ee8844'] },
  { id: 'purple', name: 'Ultraviolet', desc: 'Deep purple and violet wires', condition: { type: 'stars', count: 50 },
    palette: ['#aa44ff','#cc66ff','#8833dd','#bb55ee','#9944cc','#dd88ff','#7722bb','#ee99ff','#6611aa','#cc77ee'] },
  { id: 'rainbow', name: 'Prismatic', desc: 'Full rainbow spectrum', condition: { type: 'all3star' },
    palette: ['#ff4444','#ff8800','#ffcc00','#44dd44','#00cccc','#4488ff','#8844ff','#cc44cc','#ff4488','#88ff44'] },
  { id: 'gold', name: 'Gold Circuit', desc: 'Prestigious gold wires', condition: { type: 'perfectCampaign' },
    palette: ['#ffd700','#ffcc33','#daa520','#f0c040','#e6b422','#ccaa00','#ffdd55','#c8a020','#e8c840','#ddb840'] },
];

const COSMETIC_GATE_SKINS = [
  { id: 'ic_chip', name: 'IC Chip', desc: 'Classic integrated circuit look', condition: null },
  { id: 'neon', name: 'Neon', desc: 'Bright outlines with glow effects', condition: { type: 'chapter', chapter: 2 } },
  { id: 'retro', name: 'Retro', desc: 'Rounded vintage electronics style', condition: { type: 'chapter', chapter: 4 } },
  { id: 'minimal', name: 'Minimal', desc: 'Clean flat design, no frills', condition: { type: 'halfPerfect' } },
];

const COSMETIC_BOARD_THEMES = [
  { id: 'breadboard', name: 'Breadboard', desc: 'Classic prototyping board', condition: null },
  { id: 'pcb_green', name: 'PCB Green', desc: 'Printed circuit board aesthetic', condition: { type: 'chapter', chapter: 3 } },
  { id: 'dark_circuit', name: 'Dark Circuit', desc: 'Near-black with cyan traces', condition: { type: 'chapter', chapter: 5 } },
  { id: 'blueprint', name: 'Blueprint', desc: 'White background with blue grid', condition: { type: 'allChapters' } },
];

class CosmeticManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.wireColors = COSMETIC_WIRE_COLORS;
    this.gateSkins = COSMETIC_GATE_SKINS;
    this.boardThemes = COSMETIC_BOARD_THEMES;
    this._load();
  }

  _load() {
    try {
      const saved = SafeStorage.getItem(COSMETICS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.activeWireColor = data.wireColor || 'classic';
        this.activeGateSkin = data.gateSkin || 'ic_chip';
        this.activeBoardTheme = data.boardTheme || 'breadboard';
        return;
      }
    } catch (e) {}
    this.activeWireColor = 'classic';
    this.activeGateSkin = 'ic_chip';
    this.activeBoardTheme = 'breadboard';
  }

  _save() {
    SafeStorage.setItem(COSMETICS_KEY, JSON.stringify({
      wireColor: this.activeWireColor,
      gateSkin: this.activeGateSkin,
      boardTheme: this.activeBoardTheme,
    }));
  }

  setWireColor(id) {
    if (this.isUnlocked('wireColor', id)) {
      this.activeWireColor = id;
      this._save();
      if (this.gameState) this.gameState.markDirty();
    }
  }

  setGateSkin(id) {
    if (this.isUnlocked('gateSkin', id)) {
      this.activeGateSkin = id;
      this._save();
      if (this.gameState) this.gameState.markDirty();
    }
  }

  setBoardTheme(id) {
    if (this.isUnlocked('boardTheme', id)) {
      this.activeBoardTheme = id;
      this._save();
      if (this.gameState) this.gameState.markDirty();
    }
  }

  getActiveWirePalette() {
    const c = this.wireColors.find(w => w.id === this.activeWireColor);
    return (c && c.palette) ? c.palette : null;
  }

  getActiveGateSkin() { return this.activeGateSkin; }
  getActiveBoardTheme() { return this.activeBoardTheme; }

  isUnlocked(category, id) {
    let items;
    if (category === 'wireColor') items = this.wireColors;
    else if (category === 'gateSkin') items = this.gateSkins;
    else if (category === 'boardTheme') items = this.boardThemes;
    else return false;
    const item = items.find(i => i.id === id);
    if (!item) return false;
    return this._checkCondition(item.condition);
  }

  _checkCondition(cond) {
    if (!cond) return true;
    const gs = this.gameState;
    if (!gs) return false;
    const progress = gs.progress;

    switch (cond.type) {
      case 'stars': {
        let total = 0;
        for (const data of Object.values(progress.levels || {})) {
          total += (data.stars || 0);
        }
        return total >= cond.count;
      }
      case 'chapter': {
        const chapters = getChapters();
        const ch = chapters.find(c => c.id === cond.chapter);
        if (!ch) return false;
        return ch.levels.every(lid => {
          const p = progress.levels[lid];
          return p && p.completed;
        });
      }
      case 'all3star':
      case 'perfectCampaign': {
        const allLevels = typeof LEVELS !== 'undefined' ? LEVELS : [];
        if (allLevels.length === 0) return false;
        return allLevels.every(l => {
          const p = progress.levels[l.id];
          return p && p.stars === 3;
        });
      }
      case 'halfPerfect': {
        const allLevels2 = typeof LEVELS !== 'undefined' ? LEVELS : [];
        if (allLevels2.length === 0) return false;
        let count = 0;
        for (const l of allLevels2) {
          const p = progress.levels[l.id];
          if (p && p.stars === 3) count++;
        }
        return count >= Math.ceil(allLevels2.length / 2);
      }
      case 'allChapters': {
        const chapters2 = getChapters();
        return chapters2.filter(c => !c.isBridge).every(ch => {
          return ch.levels.every(lid => {
            const p = progress.levels[lid];
            return p && p.completed;
          });
        });
      }
      default:
        return false;
    }
  }

  checkUnlocks() {
    const newUnlocks = [];
    const allItems = [
      ...this.wireColors.map(c => ({ ...c, category: 'wireColor' })),
      ...this.gateSkins.map(c => ({ ...c, category: 'gateSkin' })),
      ...this.boardThemes.map(c => ({ ...c, category: 'boardTheme' })),
    ];
    if (!this._prevUnlocked) {
      this._prevUnlocked = new Set();
      for (const item of allItems) {
        if (this._checkCondition(item.condition)) this._prevUnlocked.add(item.id);
      }
      return newUnlocks;
    }
    for (const item of allItems) {
      if (this._prevUnlocked.has(item.id)) continue;
      if (this._checkCondition(item.condition)) {
        this._prevUnlocked.add(item.id);
        newUnlocks.push(item.name);
      }
    }
    return newUnlocks;
  }

  getAllForUI() {
    return {
      wireColors: this.wireColors.map(c => ({
        ...c,
        unlocked: this._checkCondition(c.condition),
        active: c.id === this.activeWireColor,
        conditionText: this._conditionText(c.condition),
      })),
      gateSkins: this.gateSkins.map(c => ({
        ...c,
        unlocked: this._checkCondition(c.condition),
        active: c.id === this.activeGateSkin,
        conditionText: this._conditionText(c.condition),
      })),
      boardThemes: this.boardThemes.map(c => ({
        ...c,
        unlocked: this._checkCondition(c.condition),
        active: c.id === this.activeBoardTheme,
        conditionText: this._conditionText(c.condition),
      })),
    };
  }

  _conditionText(cond) {
    if (!cond) return 'Free';
    switch (cond.type) {
      case 'stars': return 'Earn ' + cond.count + ' total stars';
      case 'chapter': return 'Complete Chapter ' + cond.chapter;
      case 'all3star': return '3-star every campaign level';
      case 'perfectCampaign': return 'Perfect all campaign levels';
      case 'halfPerfect': return '3-star 50% of campaign levels';
      case 'allChapters': return 'Complete all chapters';
      default: return '???';
    }
  }
}

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


// ── Day 44: Anonymous Daily Leaderboard ──
class DailyLeaderboard {
  constructor() {
    this._cache = {};
  }

  // Seeded PRNG matching levels.js daily challenge generation
  _seededRand(seed) {
    let s = seed;
    return function rand() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // Get today's date seed (same seed as daily challenge generation)
  _getDateSeed(date) {
    const d = date || new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // Get today's date key (YYYY-MM-DD)
  _getDateKey(date) {
    const d = date || new Date();
    return d.toISOString().slice(0, 10);
  }

  // Generate pseudo-leaderboard of 50 anonymous scores for a given day
  generatePseudoScores(date) {
    const seed = this._getDateSeed(date);
    const cacheKey = seed.toString();
    if (this._cache[cacheKey]) return this._cache[cacheKey];

    // Determine daily challenge params (mirrors generateDailyChallenge logic)
    const rand = this._seededRand(seed);
    const numInputs = Math.floor(rand() * 2) + 2; // 2-3 inputs
    const optimalGates = numInputs + 1;

    // Use a different seed offset for leaderboard scores
    const lbRand = this._seededRand(seed + 999);

    const scores = [];
    for (let i = 0; i < 50; i++) {
      // Bell-curve-ish distribution: most around optimal+2, some outliers
      const r1 = lbRand();
      const r2 = lbRand();
      // Box-Muller-ish approximation for normal distribution
      const normalish = (r1 + r2) / 2; // 0-1, centered around 0.5
      const gateOffset = Math.round(normalish * 6); // 0-6 above optimal
      const gates = Math.max(optimalGates, optimalGates + gateOffset);

      // Time: 30-300 seconds, correlated with gate count (more gates = slower)
      const baseTime = 30 + Math.floor(lbRand() * 120);
      const gateTimePenalty = (gates - optimalGates) * Math.floor(15 + lbRand() * 20);
      const time = baseTime + gateTimePenalty;

      // Generate anonymous name
      const nameIdx = Math.floor(lbRand() * DAILY_LB_NAMES.length);
      scores.push({
        gates: gates,
        time: time,
        name: DAILY_LB_NAMES[nameIdx],
        isPlayer: false
      });
    }

    // Sort by gates (primary), then time (secondary)
    scores.sort((a, b) => a.gates - b.gates || a.time - b.time);

    this._cache[cacheKey] = scores;
    return scores;
  }

  // Submit the player's real score — returns { rank, percentile, isNewBest }
  submitScore(gateCount, timeSeconds, displayName) {
    const dateKey = this._getDateKey();
    const scores = this.generatePseudoScores();

    // Load existing daily results
    const history = this._loadHistory();
    const existing = history[dateKey];
    let isNewBest = false;

    if (!existing || gateCount < existing.gates || (gateCount === existing.gates && timeSeconds < existing.time)) {
      isNewBest = !existing || gateCount < existing.gates;
      history[dateKey] = {
        gates: gateCount,
        time: timeSeconds,
        name: displayName || 'You',
        date: dateKey
      };
      this._saveHistory(history);
      // Clear cache to force recalculation with player's new score
      delete this._cache[this._getDateSeed().toString()];
    }

    const result = history[dateKey];
    const rank = this.getRank(result.gates, result.time);
    const percentile = this.getPercentile(result.gates, result.time);

    return { rank, percentile, isNewBest, gates: result.gates, time: result.time };
  }

  // Get rank (1-based) among pseudo-scores + player
  getRank(gateCount, timeSeconds) {
    const scores = this.generatePseudoScores();
    let rank = 1;
    for (const s of scores) {
      if (s.gates < gateCount || (s.gates === gateCount && s.time < timeSeconds)) {
        rank++;
      }
    }
    return rank;
  }

  // Get percentile (0-100, higher = better)
  getPercentile(gateCount, timeSeconds) {
    const scores = this.generatePseudoScores();
    const total = scores.length + 1; // Include player
    let beatCount = 0;
    for (const s of scores) {
      if (s.gates > gateCount || (s.gates === gateCount && s.time > timeSeconds)) {
        beatCount++;
      }
    }
    return Math.round((beatCount / total) * 100);
  }

  // Get rank badge emoji based on percentile
  getRankBadge(percentile) {
    if (percentile >= 90) return '🥇';
    if (percentile >= 75) return '🥈';
    if (percentile >= 50) return '🥉';
    return '';
  }

  // Get top N scores for display (including player if completed)
  getTopScores(n) {
    const scores = [...this.generatePseudoScores()];
    const dateKey = this._getDateKey();
    const history = this._loadHistory();
    const playerResult = history[dateKey];

    if (playerResult) {
      scores.push({
        gates: playerResult.gates,
        time: playerResult.time,
        name: playerResult.name || 'You',
        isPlayer: true
      });
    }

    scores.sort((a, b) => a.gates - b.gates || a.time - b.time);
    return scores.slice(0, n);
  }

  // Get today's best pseudo-score (for competitive framing)
  getTodaysBest() {
    const scores = this.generatePseudoScores();
    return scores.length > 0 ? scores[0] : null;
  }

  // Check if today's challenge has been completed
  isTodayCompleted() {
    const history = this._loadHistory();
    return !!history[this._getDateKey()];
  }

  // Get today's result
  getTodayResult() {
    const history = this._loadHistory();
    return history[this._getDateKey()] || null;
  }

  // Get last N days of results
  getRecentHistory(days) {
    const history = this._loadHistory();
    const results = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = this._getDateKey(d);
      if (history[key]) {
        const entry = { ...history[key], dateKey: key };
        // Compute percentile for this day
        const dayScores = this.generatePseudoScores(d);
        let beatCount = 0;
        for (const s of dayScores) {
          if (s.gates > entry.gates || (s.gates === entry.gates && s.time > entry.time)) {
            beatCount++;
          }
        }
        entry.percentile = Math.round((beatCount / (dayScores.length + 1)) * 100);
        entry.badge = this.getRankBadge(entry.percentile);
        results.push(entry);
      }
    }
    return results;
  }

  // Load history from localStorage
  _loadHistory() {
    try {
      const saved = SafeStorage.getItem(DAILY_LB_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Prune entries older than 30 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffKey = cutoff.toISOString().slice(0, 10);
        for (const key of Object.keys(data)) {
          if (key < cutoffKey) delete data[key];
        }
        return data;
      }
    } catch (e) {}
    return {};
  }

  // Save history to localStorage
  _saveHistory(history) {
    SafeStorage.setItem(DAILY_LB_KEY, JSON.stringify(history));
  }

  // Update display name for today's entry
  setDisplayName(name) {
    const history = this._loadHistory();
    const dateKey = this._getDateKey();
    if (history[dateKey]) {
      history[dateKey].name = name.slice(0, 16) || 'You';
      this._saveHistory(history);
    }
    SafeStorage.setItem('signal-circuit-daily-name', name.slice(0, 16));
  }

  // Get saved display name
  getDisplayName() {
    return SafeStorage.getItem('signal-circuit-daily-name') || '';
  }
}

// Anonymous names for pseudo-leaderboard entries
const DAILY_LB_NAMES = [
  'logicfan42', 'circuitwiz', 'nandmaster', 'gatekeep3r', 'booleanBoss',
  'xor_ninja', 'chipDesigner', 'wireRunner', 'truthSeeker', 'bitFlipper',
  'nor_knight', 'muxMaster', 'flipFlop99', 'signalPro', 'andGate_ace',
  'orOrNot', 'notBad_lol', 'gateForce', 'logicLord', 'wireWitch',
  'bitBender', 'nandNotNor', 'circuitSam', 'boolBear', 'gateCraft',
  'pulseRider', 'techTinkr', 'sparkPlug', 'ohmsLaw42', 'byteMe',
  'digiDaemon', 'logicLeap', 'andOrBut', 'pinConnect', 'solderSam',
  'pcbPilot', 'gndControl', 'vccVibes', 'rippleCarry', 'fullAdder'
];

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
    this.cosmetics = new CosmeticManager(this);
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
    this.tapConnectSource = null; // For tap-to-connect: node/gate id
    this._tapConnectTimeout = null;
    this.timerPending = false; // #96: Start timer on first action
    this._levelSelectScrollY = 0; // #95: Preserve scroll position
    this._lastPinHoverId = null; // T2: Track last hovered pin for audio
    this._lastPinHoverTime = 0; // T2: Throttle pin hover audio
    // Day 31: Replay recording
    this._replayActions = [];
    this._replayStartTime = null;
    // Day 31: Hint tokens
    this.hintTokens = this._loadHintTokens();
    // Day 32 T6: Micro-celebration tracking per level
    this._microCelebrations = { firstWire: false, allWired: false };
    // Day 32 T8: Blitz Mode state
    this.blitzMode = false;
    this.blitzLevel = 0;
    this.blitzTimer = null;
    this.blitzStart = null;
    // Day 32 T9: Speedrun Mode state
    this.speedrunMode = false;
    this.speedrunLevelIdx = 0;
    this.speedrunStart = null;
    this.speedrunTimer = null;
    this.speedrunSplits = [];
    // Day 33 T2: Multi-phase level tracking
    this.currentPhase = 0;
    this.isMultiPhase = false;
    // Day 34 T1: Session-awareness break reminder
    this._sessionStartTime = Date.now();
    this._breakReminderShown = false;
    // Day 34 T2: Return-player re-onboarding flag
    this._reOnboardingShown = false;
    // Day 33 T5: Pre-placed (locked) gate IDs
    this._lockedGateIds = new Set();
    // Day 33 T7: Gamepad state
    this._gamepadConnected = false;
    this._gamepadCursor = null;
    this._gamepadPollId = null;
    // Day 33 T10: Last visit tracking
    this._updateLastVisit();
    // Day 35 T2: AbortController for event listener cleanup
    this._abortController = new AbortController();
    // Day 38: Interactive tutorial
    this.tutorial = null;
    // Day 39 T2: Truth table row hover → canvas highlight
    this._highlightedInputRow = null;
    // Day 42 T8: Error explanation traces for canvas highlighting
    this._failureTraces = null;
    this._errorHighlightGates = [];
    this._errorHighlightWires = [];
    this._errorHighlightUntil = 0;
    // Day 44: Anonymous Daily Leaderboard
    this.dailyLeaderboard = new DailyLeaderboard();
    // Day 45: Gate Limit Challenge mode
    this.isGateLimitMode = false;
    this.gateBudget = 0;
  }

  // ── Hint Token System (Day 31) ──
  _loadHintTokens() {
    try {
      const saved = SafeStorage.getItem(TOKENS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { tokens: 3, earned: 0 }; // Start with 3 free tokens
  }

  _saveHintTokens() {
    SafeStorage.setItem(TOKENS_KEY, JSON.stringify(this.hintTokens));
  }

  spendHintToken() {
    if (this.hintTokens.tokens <= 0) return false;
    this.hintTokens.tokens--;
    this._saveHintTokens();
    return true;
  }

  earnHintToken(reason) {
    this.hintTokens.tokens++;
    this.hintTokens.earned++;
    this._saveHintTokens();
    if (this.ui) this.ui.updateStatusBar(`💡 +1 hint token (${reason})`);
  }

  // ── Replay Recording (Day 31) ──
  _startReplayRecording() {
    this._replayActions = [];
    this._replayStartTime = Date.now();
  }

  _recordReplayAction(type, data) {
    if (!this._replayStartTime) return;
    this._replayActions.push({
      type,
      data,
      time: Date.now() - this._replayStartTime,
    });
  }

  _saveReplay(levelId) {
    if (!levelId || typeof levelId !== 'number' || this._replayActions.length === 0) return;
    try {
      const all = JSON.parse(SafeStorage.getItem(REPLAY_KEY) || '{}');
      all[levelId] = {
        actions: this._replayActions,
        totalTime: Date.now() - this._replayStartTime,
        gateCount: this.gates.length,
        date: new Date().toISOString(),
      };
      SafeStorage.setItem(REPLAY_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  getReplay(levelId) {
    try {
      const all = JSON.parse(SafeStorage.getItem(REPLAY_KEY) || '{}');
      return all[levelId] || null;
    } catch (e) { return null; }
  }

  // ── Circuit Collection (Day 31) ──
  _saveToCollection(levelId) {
    if (!levelId || typeof levelId !== 'number') return;
    try {
      const all = JSON.parse(SafeStorage.getItem(COLLECTION_KEY) || '{}');
      all[levelId] = {
        gates: this.gates.map(g => ({ type: g.type, x: g.x, y: g.y })),
        wireCount: this.wireManager.wires.length,
        gateCount: this.gates.length,
        date: new Date().toISOString(),
        stars: this.progress.levels[levelId] ? this.progress.levels[levelId].stars : 1,
      };
      SafeStorage.setItem(COLLECTION_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  getCollection() {
    try {
      return JSON.parse(SafeStorage.getItem(COLLECTION_KEY) || '{}');
    } catch (e) { return {}; }
  }

  // ── Circuit Aesthetics Score (Day 31) ──
  calculateAestheticsScore() {
    const gates = this.gates;
    const wires = this.wireManager.wires;
    if (gates.length === 0) return { score: 0, crossings: 0, alignment: 0, label: 'N/A' };

    // Count wire crossings
    let crossings = 0;
    const wireEndpoints = wires.map(w => this.wireManager.getWireEndpoints(w)).filter(Boolean);
    for (let i = 0; i < wireEndpoints.length; i++) {
      for (let j = i + 1; j < wireEndpoints.length; j++) {
        const a = wireEndpoints[i];
        const b = wireEndpoints[j];
        if (a && b && this._wiresCross(a, b)) crossings++;
      }
    }

    // Check gate alignment (how many gates share X or Y coordinates)
    let alignedPairs = 0;
    const threshold = 5;
    for (let i = 0; i < gates.length; i++) {
      for (let j = i + 1; j < gates.length; j++) {
        if (Math.abs(gates[i].x - gates[j].x) <= threshold ||
            Math.abs(gates[i].y - gates[j].y) <= threshold) {
          alignedPairs++;
        }
      }
    }

    const maxPairs = gates.length * (gates.length - 1) / 2;
    const alignmentScore = maxPairs > 0 ? (alignedPairs / maxPairs) * 100 : 100;
    const crossingPenalty = Math.min(crossings * 15, 60);
    const rawScore = Math.max(0, Math.round(alignmentScore - crossingPenalty));

    let label;
    if (rawScore >= 85) label = '✨ Pristine';
    else if (rawScore >= 65) label = '🔧 Clean';
    else if (rawScore >= 40) label = '📐 Decent';
    else label = '🔀 Messy';

    return { score: rawScore, crossings, alignment: Math.round(alignmentScore), label };
  }

  _wiresCross(a, b) {
    // Simple line segment crossing test
    return this._segmentsCross(
      a.fromPin.x, a.fromPin.y, a.toPin.x, a.toPin.y,
      b.fromPin.x, b.fromPin.y, b.toPin.x, b.toPin.y
    );
  }

  _segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (Math.abs(d) < 0.001) return false;
    const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return t > 0.05 && t < 0.95 && u > 0.05 && u < 0.95;
  }

  // #98: Haptic feedback for mobile
  haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  // #96: Start timer on first user action (not level load)
  _startTimerIfPending() {
    if (this.timerPending && !this.timerRunning) {
      this.timerPending = false;
      this.startTimer();
    }
  }

  // #97: Cycle detection — DFS for back edges in the circuit graph
  detectCycle() {
    const wires = this.wireManager.wires;
    const adj = {};
    // Build adjacency list from wires
    for (const w of wires) {
      if (!adj[w.fromGateId]) adj[w.fromGateId] = [];
      adj[w.fromGateId].push(w.toGateId);
    }
    const visited = new Set();
    const recStack = new Set();

    const dfs = (node) => {
      visited.add(node);
      recStack.add(node);
      for (const neighbor of (adj[node] || [])) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      recStack.delete(node);
      return false;
    };

    // Check from all nodes that have outgoing edges
    const allSources = new Set(wires.map(w => w.fromGateId));
    for (const src of allSources) {
      if (!visited.has(src)) {
        if (dfs(src)) return true;
      }
    }
    return false;
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(canvas, this);
    this.ui = new UI(this);

    this.setupCanvasEvents(canvas);
    this.setupVolumeControls();

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

    // T8: Update streak on app start
    this.streakData = this.updateStreak();
    // Day 41: Check streak achievement
    if (this.streakData && this.streakData.streak >= 14) {
      const streakAchs = this.achievements.checkStreakAchievement(this.streakData.streak);
      if (streakAchs.length > 0) setTimeout(() => this.ui.showAchievementToasts(streakAchs), 2000);
    }
    // Day 40: Seed cosmetic unlock baseline
    if (this.cosmetics) this.cosmetics.checkUnlocks();
    this.ui.updateStreakDisplay(this.streakData);

    // Day 33 T10: Welcome back for lapsed players (check before placement test)
    this._checkWelcomeBack();

    // Day 31: Show placement test for brand new players
    this._checkPlacementTest();

    // Day 33 T7: Gamepad support
    this._setupGamepad();

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

  // ── Placement Test (Day 31) ──
  _checkPlacementTest() {
    // Only show for brand new players (no progress, no placement test done)
    try {
      if (SafeStorage.getItem(PLACEMENT_KEY) === 'true') return;
      const progress = this.loadProgress();
      const hasProgress = Object.keys(progress.levels || {}).length > 0;
      if (hasProgress) {
        SafeStorage.setItem(PLACEMENT_KEY, 'true');
        return;
      }
    } catch (e) { return; }

    // Show after intro animation settles
    setTimeout(() => {
      if (this.ui) this.ui.showPlacementTest();
    }, 3500);
  }

  completePlacementTest(score) {
    SafeStorage.setItem(PLACEMENT_KEY, 'true');
    // Score 0-3: skip ahead based on knowledge
    if (score >= 3) {
      // Know all basics — unlock through chapter 2
      for (let i = 1; i <= 12; i++) {
        if (!this.progress.levels[i]) {
          this.progress.levels[i] = { completed: false, bookmarked: true };
        }
      }
      this.earnHintToken('placement test ace');
    } else if (score >= 2) {
      // Know AND/OR — unlock chapter 1
      for (let i = 1; i <= 6; i++) {
        if (!this.progress.levels[i]) {
          this.progress.levels[i] = { completed: false, bookmarked: true };
        }
      }
    }
    // score 0-1: start from beginning (default)
    this.saveProgress();
    if (this.ui) {
      this.ui.renderLevelSelect();
      this.ui.updateProgressBar(this.progress);
    }
  }

  // Day 46: Separate SFX/Music volume controls
  setupVolumeControls() {
    this._sfxPreviewTimer = null;
    this._musicPreviewTimer = null;

    // Wire up SFX controls (gameplay + level select)
    this._wireVolSlider('sfx-slider', 'sfx-icon', 'sfx');
    this._wireVolSlider('ls-sfx-slider', 'ls-sfx-icon', 'sfx');
    // Wire up Music controls (gameplay + level select)
    this._wireVolSlider('music-slider', 'music-icon', 'music');
    this._wireVolSlider('ls-music-slider', 'ls-music-icon', 'music');
  }

  _wireVolSlider(sliderId, iconId, category) {
    const slider = document.getElementById(sliderId);
    const icon = document.getElementById(iconId);
    if (!slider || !icon) return;

    // Set initial value from audio engine
    const vol = category === 'sfx' ? this.audio.sfxVolume : this.audio.musicVolume;
    slider.value = Math.round(vol * 100);
    this._updateVolIcon(icon, parseInt(slider.value), category);

    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      if (category === 'sfx') {
        this.audio.setSfxVolume(val / 100);
      } else {
        this.audio.setMusicVolume(val / 100);
      }
      this._updateVolIcon(icon, val, category);
      this._syncVolSliders(category, val);
      // Debounced audio preview
      this._previewVolume(category);
    });

    icon.addEventListener('click', () => {
      const prevKey = '_prev' + category.charAt(0).toUpperCase() + category.slice(1) + 'Vol';
      if (parseInt(slider.value) > 0) {
        this[prevKey] = parseInt(slider.value);
        slider.value = 0;
        if (category === 'sfx') {
          this.audio.playMuteOff();
          this.audio.setSfxVolume(0);
        } else {
          this.audio.setMusicVolume(0);
        }
        this._updateVolIcon(icon, 0, category);
        this._syncVolSliders(category, 0);
      } else {
        const restore = this[prevKey] || (category === 'sfx' ? 40 : 20);
        slider.value = restore;
        if (category === 'sfx') {
          this.audio.setSfxVolume(restore / 100);
          this.audio.playMuteOn();
        } else {
          this.audio.setMusicVolume(restore / 100);
        }
        this._updateVolIcon(icon, restore, category);
        this._syncVolSliders(category, restore);
      }
    });
  }

  _syncVolSliders(category, val) {
    // Keep gameplay and level-select sliders in sync
    const ids = category === 'sfx'
      ? ['sfx-slider', 'ls-sfx-slider']
      : ['music-slider', 'ls-music-slider'];
    const iconIds = category === 'sfx'
      ? ['sfx-icon', 'ls-sfx-icon']
      : ['music-icon', 'ls-music-icon'];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
      const ic = document.getElementById(iconIds[i]);
      if (ic) this._updateVolIcon(ic, val, category);
    });
  }

  _updateVolIcon(icon, val, category) {
    if (category === 'sfx') {
      if (val === 0) icon.textContent = '🔇';
      else if (val <= 33) icon.textContent = '🔈';
      else if (val <= 66) icon.textContent = '🔉';
      else icon.textContent = '🔊';
    } else {
      if (val === 0) icon.textContent = '🔕';
      else icon.textContent = '🎵';
    }
  }

  _previewVolume(category) {
    const timerKey = '_' + category + 'PreviewTimer';
    if (this[timerKey]) clearTimeout(this[timerKey]);
    this[timerKey] = setTimeout(() => {
      if (category === 'sfx') {
        this.audio.playVolumePreviewSfx();
      } else {
        this.audio.playVolumePreviewMusic();
      }
      this[timerKey] = null;
    }, 200);
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
    this.progress.version = SCHEMA_VERSION;
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  resetProgress() {
    this.progress = { levels: {}, version: SCHEMA_VERSION };
    this.saveProgress();
    this._levelSelectScrollY = 0; // #95: Reset scroll on progress reset
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
    SafeStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
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
    SafeStorage.setItem(STATS_KEY, JSON.stringify(stats));
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

  // ── Streak System (T8 Day 26) ──
  getStreakData() {
    try {
      const saved = localStorage.getItem('signal-circuit-streak');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { streak: 0, freezeTokens: 0, lastPlayDate: null };
  }

  saveStreakData(data) {
    SafeStorage.setItem('signal-circuit-streak', JSON.stringify(data));
  }

  updateStreak() {
    const data = this.getStreakData();
    const today = new Date().toISOString().slice(0, 10);

    if (data.lastPlayDate === today) {
      return data; // Already played today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (data.lastPlayDate === yesterdayStr) {
      // Consecutive day — increment streak
      data.streak += 1;
      // Award freeze token every 3 consecutive days
      if (data.streak > 0 && data.streak % 3 === 0) {
        data.freezeTokens = (data.freezeTokens || 0) + 1;
      }
      // Day 31: Award hint token every 5-day streak
      if (data.streak > 0 && data.streak % 5 === 0) {
        this.earnHintToken(`${data.streak}-day streak`);
      }
    } else if (data.lastPlayDate && data.lastPlayDate !== today) {
      // Missed day(s) — use freeze token or reset
      if (data.freezeTokens > 0) {
        data.freezeTokens -= 1;
        // Don't increment streak, but preserve it
      } else {
        data.streak = 1; // Reset to 1 (today counts)
      }
    } else {
      data.streak = 1; // First time playing
    }

    data.lastPlayDate = today;
    this.saveStreakData(data);
    return data;
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
    SafeStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
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
        lastPlayed: Date.now(), // Day 32 T10: track for spaced repetition
      };
    } else {
      if (gateCount < (existing.bestGateCount || Infinity)) existing.bestGateCount = gateCount;
      if (elapsed < (existing.bestTime || Infinity)) existing.bestTime = elapsed;
      if (pureLogic) existing.pureLogic = true;
      existing.lastPlayed = Date.now(); // Day 32 T10
    }

    // Clear bookmark if it was bookmarked
    if (this.progress.levels[levelId].bookmarked) {
      delete this.progress.levels[levelId].bookmarked;
    }

    this.saveProgress();
    this._saveGhost(levelId); // T10: save solution as ghost for replay
    this._saveReplay(levelId); // Day 31: save replay
    this._saveToCollection(levelId); // Day 31: save to circuit collection
    this._savePreview(levelId); // Day 43: save level preview thumbnail
    this._clearAutoSave(); // Clear auto-save on completion

    // Check for chapter completion
    this._checkChapterCompletion(levelId);

    // Day 40: Check cosmetic unlocks
    if (this.cosmetics) {
      const newCosmetics = this.cosmetics.checkUnlocks();
      if (newCosmetics.length > 0 && this.ui) {
        setTimeout(() => {
          for (const name of newCosmetics) {
            this.ui.showCosmeticUnlockToast(name);
          }
        }, 3000);
      }
    }

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
    this.isGateLimitMode = false; // Day 45: Reset gate limit mode
    this.gateBudget = 0;
    this.stopTimer();
    this.trackPlaytimeEnd();
    this.audio.stopAmbient();
    // Day 38: Clean up tutorial on level exit
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
    this.ui.renderLevelSelect();
    this.ui.updateProgressBar(this.progress);
    this.ui.updateDailyButtonBadge(); // Day 44: Update daily rank badge
    this.ui.showScreen('level-select');
    this.isAnimating = false;
    // #95: Restore scroll position after rendering
    const scrollContainer = document.getElementById('level-select-screen');
    if (scrollContainer && this._levelSelectScrollY > 0) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = this._levelSelectScrollY;
      });
    }
  }

  // #95: Save level select scroll position before navigating away
  _saveLevelSelectScroll() {
    const scrollContainer = document.getElementById('level-select-screen');
    if (scrollContainer) {
      this._levelSelectScrollY = scrollContainer.scrollTop;
    }
  }

  showChallengeConfig() {
    this._saveLevelSelectScroll(); // #95
    this.currentScreen = 'challenge-config';
    this.stopTimer();
    this.audio.stopAmbient();
    // Day 38: Clean up tutorial on level exit
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
    this.ui.showScreen('challenge-config');
    // Trigger initial leaderboard render
    const ni = parseInt(document.getElementById('input-count-slider').value);
    const no = parseInt(document.getElementById('output-count-slider').value);
    this.ui.renderLeaderboard(ni, no);
  }

  showSandboxConfig() {
    this._saveLevelSelectScroll(); // #95
    this.currentScreen = 'sandbox-config';
    this.stopTimer();
    this.audio.stopAmbient();
    // Day 38: Clean up tutorial on level exit
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
    this.ui.showScreen('sandbox-config');
  }

  // Day 44: Daily challenge pre-screen
  showDailyConfig() {
    this._saveLevelSelectScroll(); // #95
    this.currentScreen = 'daily-config';
    this.stopTimer();
    this.audio.stopAmbient();
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
    this.ui.showDailyScreen();
  }

  startChallenge(numInputs, numOutputs) {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('random'));
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
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('daily'));
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
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('sandbox'));
    const level = generateSandboxLevel(numInputs || 2, numOutputs || 1);
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  // Day 45: Gate Limit Challenge Mode
  startGateLimitLevel(levelId) {
    const level = getLevel(levelId);
    if (!level) return;
    const p = this.progress.levels[levelId];
    if (!p || p.stars < 3) return; // Must be 3-starred

    this._saveLevelSelectScroll();
    this.isGateLimitMode = true;
    this.gateBudget = level.optimalGates;
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadLevel(levelId);
    setTimeout(() => this.renderer.resize(), 100);
  }

  completeGateLimitLevel(levelId, gateCount) {
    const level = getLevel(levelId);
    if (!level) return;
    if (!this.progress.levels[levelId]) return;
    this.progress.levels[levelId].gateLimitCompleted = true;
    this.saveProgress();
    // Track stats for achievement
    const stats = this.achievements.stats;
    stats.gateLimitCompletions = (stats.gateLimitCompletions || 0) + 1;
    this.achievements.save();
  }

  getGateLimitCompletionCount() {
    let count = 0;
    for (const data of Object.values(this.progress.levels || {})) {
      if (data.gateLimitCompleted) count++;
    }
    return count;
  }

    startLevel(levelId) {
    this._saveLevelSelectScroll(); // #95
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('campaign'));
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

      // Day 31: Hint token economy
      if (!this.spendHintToken()) {
        this.ui.updateStatusBar('💡 No hint tokens! Earn more from challenges and achievements.');
        this.audio.playFail();
        return;
      }

      this.hintsUsed++;
      if (this.hintsUsed >= 2) this.maxHintPenalty = Math.max(this.maxHintPenalty, this.hintsUsed - 1);
      // Day 34 T10: Hint sound urgency escalation
      this.audio.playHintReveal(this.hintsUsed);

      // Activate visual highlights on hint 3 (the final hint)
      const isVisualHint = this.hintsUsed === 3 && this.currentLevel.hintHighlights;
      if (isVisualHint) {
        this.activeHintHighlights = this.currentLevel.hintHighlights;
      }

      this.ui.showHint(this.currentLevel.hints[this.hintsUsed - 1], this.hintsUsed, this.currentLevel.hints.length, isVisualHint);

      // Update hint button via centralized method
      this.ui.updateHintButton(this.hintTokens.tokens);
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
    if (this.ui) this.ui.updateHintButton(this.hintTokens.tokens);

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
    if (el) {
      el.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
      // T7: Timer color feedback at thresholds
      if (elapsed < 60) {
        el.style.color = '#4c4'; // green
      } else if (elapsed < 120) {
        el.style.color = '#cc0'; // yellow
      } else {
        el.style.color = '#f80'; // orange
      }
    }

    // Day 34 T1: Session-awareness break reminder (45 min)
    this._checkBreakReminder();
  }

  _checkBreakReminder() {
    if (this._breakReminderShown) return;
    const sessionElapsed = Math.floor((Date.now() - this._sessionStartTime) / 1000);
    if (sessionElapsed >= 45 * 60) {
      this._breakReminderShown = true;
      this._showBreakToast();
    }
  }

  _showBreakToast() {
    const toast = document.getElementById('break-reminder-toast');
    if (!toast) return;
    toast.textContent = "⏸ You've been playing for 45 min — take a break? 🧠";
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastSlideIn 0.4s ease, toastSlideOut 0.4s ease 7.6s forwards';
    setTimeout(() => { toast.style.display = 'none'; }, 8100);
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
    this._startTimerIfPending(); // #96
    // Day 45: Gate budget enforcement in gate limit mode
    if (this.isGateLimitMode && this.gateBudget > 0) {
      const currentCount = this.gates.filter(g => !g._locked).length;
      if (currentCount >= this.gateBudget) {
        this.ui.updateStatusBar('⚠ Gate budget reached! Remove a gate first.');
        this.audio.playFail();
        this.haptic(40);
        return null;
      }
    }
    const gate = new Gate(type, x, y, this.nextId++);
    this.gates.push(gate);
    this.ui.updateStatusBar(`Placed ${type} gate`);
    this.audio.playGatePlace(type, x);
    this.haptic(15); // #98: short pulse on gate place
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
    this._recordReplayAction('addGate', { type, x, y, id: gate.id });
    this.ui.updateGateIndicator();
    if (this.ui) this.ui.updateUndoTimeline(); // Day 35 T6
    this.markDirty();
    this._autoSave();
    // Day 38: Notify tutorial of gate placement
    if (this.tutorial && this.tutorial.isActive()) this.tutorial.onGatePlaced();
    return gate;
  }

  removeGate(gate, skipUndo) {
    // Day 33 T5: Prevent removing locked (pre-placed) gates
    if (gate._locked || this._lockedGateIds.has(gate.id)) {
      this.ui.updateStatusBar('🔒 This gate is locked and cannot be removed');
      this.audio.playFail();
      return;
    }
    const removedWires = this.wireManager.wires.filter(
      w => w.fromGateId === gate.id || w.toGateId === gate.id
    ).map(w => ({ ...w }));

    this.wireManager.removeWiresForGate(gate.id);
    this.gates = this.gates.filter(g => g.id !== gate.id);
    if (this.selectedGate === gate) this.selectedGate = null;
    this.ui.updateStatusBar(`Removed ${gate.type} gate`);
    this.audio.playWireDisconnect(gate.x);

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
    if (this.ui) this.ui.updateUndoTimeline(); // Day 35 T6
    this.markDirty();
    this._autoSave();
  }

  addWireFromData(fromGateId, fromPinIndex, toGateId, toPinIndex) {
    const wire = new Wire(fromGateId, fromPinIndex, toGateId, toPinIndex, this.wireManager.nextId++);
    this.wireManager.wires.push(wire);
    this._recordReplayAction('addWire', { fromGateId, fromPinIndex, toGateId, toPinIndex });
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
    this.audio.playUndo();
    this.ui.updateStatusBar('Undo');
    this.ui.updateGateIndicator();
    if (this.ui) this.ui.updateUndoTimeline(); // Day 35 T6
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
    this.audio.playRedo();
    this.ui.updateStatusBar('Redo');
    this.ui.updateGateIndicator();
    if (this.ui) this.ui.updateUndoTimeline(); // Day 35 T6
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
    this.ui._ttResetState(); // Day 39: Reset truth table sort/compact state on level load
    this._highlightedInputRow = null; // Day 39 T2: Clear highlight on level load
    this._clearFailureTraces(); // Day 42: Clear error traces on level load
    this.ui.updateTruthTable(null);
    this.ui.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    this.ui.hideStarDisplay();
    this.ui.updateStatusBar(`Level ${level.id}: ${level.title}`);
    this.resetHintState();
    this._startReplayRecording(); // Day 31: begin recording
    // #96: Defer timer start to first user action (campaign only)
    if (!this.isChallengeMode && !this.isSandboxMode) {
      this.timerPending = true;
      // Show placeholder timer
      const timerEl = document.getElementById('timer-display');
      if (timerEl) timerEl.textContent = '⏱ —:——';
    } else {
      this.startTimer();
    }

    // Sync hint button state
    this.ui.updateHintButton();

    // Show distributed onboarding tooltips for levels 1-4
    // Day 38: Level 1 uses interactive tutorial instead of tooltip
    if (level.id === 1 && InteractiveTutorial.shouldShow(this)) {
      this.tutorial = new InteractiveTutorial(this);
      this.tutorial.start();
    } else if (level.id >= 1 && level.id <= 4) {
      this.ui.showOnboarding(level.id);
    }

    // Day 34 T2: Return-player contextual re-onboarding
    if (!this._reOnboardingShown) {
      try {
        const lastVisit = localStorage.getItem('signal-circuit-last-visit');
        if (lastVisit) {
          const daysSince = Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
          if (daysSince >= 3) {
            this._reOnboardingShown = true;
            this.ui.showReOnboarding();
          }
        }
      } catch (e) {}
    }

    this.ui.updateGateIndicator();
    this._clearTapConnect();

    // T3: Reset wire pitch escalation
    this.audio.resetWireCount();

    // Day 32 T1: Set chapter audio palette based on current level's chapter
    const chapters = getChapters();
    const chapterIdx = chapters.findIndex(ch => ch.levels.includes(id));
    if (chapterIdx >= 0) this.audio.setChapterPalette(chapterIdx);

    // Day 32 T6: Reset micro-celebration tracking for this level
    this._microCelebrations = { firstWire: false, allWired: false };

    // Day 33 T2: Multi-phase init
    this._lockedGateIds = new Set();
    if (level.isMultiPhase && level.phases) {
      this.isMultiPhase = true;
      this.currentPhase = 0;
      // Start with phase 1 truth table
      this.currentLevel.truthTable = level.phases[0].truthTable;
      this.currentLevel.description = level.phases[0].description;
      // Re-render info with phase indicator
      this.ui.updateLevelInfo();
      this.ui.updateTruthTable(null);
    } else {
      this.isMultiPhase = false;
      this.currentPhase = 0;
    }

    // Day 33 T5: Pre-placed gates
    if (level.preplacedGates && level.preplacedGates.length > 0) {
      for (const pg of level.preplacedGates) {
        const pos = this._scalePosition(pg.x, pg.y);
        const gate = new Gate(pg.type, pos.x, pos.y, this.nextId++);
        gate._locked = true;
        this.gates.push(gate);
        this._lockedGateIds.add(gate.id);
      }
    }

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

  // ── Tap-to-Connect (mobile-friendly wiring) ──

  _setTapConnectSource(nodeId) {
    this.tapConnectSource = nodeId;
    this.audio.playClick();
    if (this._tapConnectTimeout) clearTimeout(this._tapConnectTimeout);
    this._tapConnectTimeout = setTimeout(() => this._clearTapConnect(), 4000);
    this.markDirty();
  }

  _clearTapConnect() {
    if (this._tapConnectTimeout) {
      clearTimeout(this._tapConnectTimeout);
      this._tapConnectTimeout = null;
    }
    if (this.tapConnectSource !== null) {
      this.tapConnectSource = null;
      this.markDirty();
    }
  }

  _executeTapConnect(targetId) {
    if (this.tapConnectSource === null) return false;
    const sourceId = this.tapConnectSource;
    this._clearTapConnect();

    if (sourceId === targetId) return false;
    if (this.isAnimating) return false;

    const sourceNode = this.findNode(sourceId);
    const targetNode = this.findNode(targetId);
    if (!sourceNode || !targetNode) return false;

    // Try both directions
    const wired = this._autoWire(sourceId, sourceNode, targetId, targetNode) ||
                  this._autoWire(targetId, targetNode, sourceId, sourceNode);

    if (!wired) {
      let tx, ty;
      if (targetNode instanceof Gate) {
        tx = targetNode.x + targetNode.def.width / 2;
        ty = targetNode.y + targetNode.def.height / 2;
      } else {
        tx = targetNode.x + targetNode.width / 2;
        ty = targetNode.y + targetNode.height / 2;
      }
      this.wireManager._showInvalidFeedback(tx, ty);
    }

    this.markDirty();
    return wired;
  }

  _autoWire(fromId, fromNode, toId, toNode) {
    // Determine output pin on "from" node
    let outputPinIndex = -1;
    if (fromNode instanceof IONode && fromNode.type === 'input') {
      outputPinIndex = 0;
    } else if (fromNode instanceof Gate) {
      const outPins = fromNode.getOutputPins();
      if (outPins.length > 0) outputPinIndex = 0;
    }
    if (outputPinIndex === -1) return false;

    // Find first open input pin on "to" node
    let inputPinIndex = -1;
    if (toNode instanceof IONode && toNode.type === 'output') {
      const connected = this.wireManager.wires.some(
        w => w.toGateId === toId && w.toPinIndex === 0
      );
      if (!connected) inputPinIndex = 0;
    } else if (toNode instanceof Gate) {
      const inputCount = toNode.def.inputs;
      for (let i = 0; i < inputCount; i++) {
        const connected = this.wireManager.wires.some(
          w => w.toGateId === toId && w.toPinIndex === i
        );
        if (!connected) {
          inputPinIndex = i;
          break;
        }
      }
    }
    if (inputPinIndex === -1) return false;

    // Create wire
    const wire = new Wire(fromId, outputPinIndex, toId, inputPinIndex, this.wireManager.nextId++);
    this.wireManager.wires.push(wire);

    const endpoints = this.wireManager.getWireEndpoints(wire);
    this.audio.playWireConnect(endpoints ? endpoints.toPin.x : undefined);
    if (endpoints && this.renderer) {
      this.renderer.spawnSparks(endpoints.toPin.x, endpoints.toPin.y);
    }

    this.undoManager.push({
      type: 'addWire',
      wireId: wire.id,
      fromGateId: wire.fromGateId,
      fromPinIndex: wire.fromPinIndex,
      toGateId: wire.toGateId,
      toPinIndex: wire.toPinIndex,
    });

    const wireAchs = this.achievements.trackFirstWire();
    this.ui.showAchievementToasts(wireAchs);
    this._autoSave();
    this.ui.updateGateIndicator();
    this._checkMicroCelebrations(); // Day 32 T6
    return true;
  }

  async runSimulation() {
    // Day 38: Tutorial RUN notification
    if (this.tutorial && this.tutorial.isActive()) this.tutorial.onRunPressed();
    if (this.isAnimating) return;
    this.isAnimating = true;

    try {
      this.audio.playButtonClick();
      this.ui.updateResultDisplay('idle', 'Simulating...');
      this.ui.hideStarDisplay();
      // Day 42 T8: Clear previous failure traces
      this._clearFailureTraces();

      // Day 39 T9: Auto-expand truth table when running simulation
      if (this.ui) this.ui._expandTruthTable();

      // Sandbox mode: just evaluate and show actual truth table
      if (this.isSandboxMode) {
        await this.runSandboxTest();
        return;
      }

      // Day 37: Clear signal flow animation state before starting
      this.wireManager.resetAllSignalFlow();
      for (const gate of this.gates) { gate._signalArrived = null; }
      for (const node of this.inputNodes) { node._signalPulse = null; }
      for (const node of this.outputNodes) { node._receiveFlash = null; }

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
            // Day 33 T2: Multi-phase — advance instead of completing
            if (this.isMultiPhase && this.currentPhase < this.currentLevel.phases.length - 1) {
              this.audio.playSuccess(1);
              setTimeout(() => this.advancePhase(), 1200);
              return;
            }

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
              this.haptic([30, 50, 30, 50, 50]); // #98: celebration pattern
              this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
              this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
              this.ui.showChallengeResult(gateCount, this.currentLevel);
              this.ui.startCelebration(2, { mode: 'challenge' });
              // Track challenge achievements + earn hint token
              const chAchs = this.achievements.trackChallengeComplete();
              this.ui.showAchievementToasts(chAchs);
              this.earnHintToken('challenge complete');

              // Day 32 T3: Show Challenge Friend button for challenges
              this.ui.showChallengeFriendButton(this.currentLevel, gateCount);

              // Day 32 T8: Blitz auto-advance after short delay
              if (this.blitzMode) {
                setTimeout(() => this._blitzAdvance(), 1500);
              }
            } else {
              // Day 47: Capture pre-completion state for celebration context
              const prevProg = this.progress.levels[this.currentLevel.id];
              const wasCompleted = prevProg && prevProg.completed;
              const prevStars = prevProg ? (prevProg.stars || 0) : 0;
              const hadPureLogic = prevProg ? !!prevProg.pureLogic : false;
              const isPureLogicNew = this.hintsUsed === 0 && !hadPureLogic;
              const celebChapters = getChapters();
              let celebChapter = null;
              for (const ch of celebChapters) {
                if (ch.levels.includes(this.currentLevel.id)) { celebChapter = ch; break; }
              }

              const stars = this.completeLevel(this.currentLevel.id, gateCount);
              this.audio.playSuccess(stars);
              this.haptic([30, 50, 30, 50, 50]); // #98: celebration pattern
              this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
              this.ui.updateStatusBar('Level complete! All truth table rows match.');
              // Day 31: Calculate aesthetics score
              const aesthetics = this.calculateAestheticsScore();
              this.ui.showStarDisplay(stars, gateCount, this.currentLevel, aesthetics);
              // Day 47: Context-aware celebration
              this.ui.startCelebration(stars, {
                mode: 'campaign',
                chapterId: celebChapter ? celebChapter.id : null,
                chapterColor: celebChapter ? celebChapter.color : null,
                isPureLogicNew: isPureLogicNew,
                isImprovement: wasCompleted && stars > prevStars,
                isReplay: wasCompleted && stars <= prevStars,
                isFirstTime: !wasCompleted,
              });
              // Check achievements
              const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
              const newAchs = this.achievements.checkAfterCompletion(this, this.currentLevel.id, gateCount, elapsed, this.hintsUsed);
              // Day 31: Clean Circuit achievement
              if (aesthetics.score >= 85 && this.achievements.unlock('clean_circuit')) {
                newAchs.push('clean_circuit');
              }
              // Day 41: Perfectionist achievement
              const perfAchs = this.achievements.checkPerfectionist(aesthetics.score, gateCount);
              newAchs.push(...perfAchs);
              if (this.currentLevel.isDaily) {
                if (this.achievements.unlock('daily_solver')) newAchs.push('daily_solver');
                // Day 41: Track daily challenge completion for streak/total
                const dailyAchs = this.achievements.trackDailyChallengeComplete();
                newAchs.push(...dailyAchs);
                // Show share button for daily challenge
                this.ui.showShareButton(gateCount, stars, elapsed);
                this.earnHintToken('daily challenge');
                // Day 32 T3: Challenge Friend for dailies too
                this.ui.showChallengeFriendButton(this.currentLevel, gateCount);
                // Day 44: Submit to daily leaderboard
                const lbResult = this.dailyLeaderboard.submitScore(gateCount, elapsed, this.dailyLeaderboard.getDisplayName());
                this.ui.showDailyLeaderboardResult(lbResult);
              }
              this.ui.showAchievementToasts(newAchs);

              // Day 45: Gate Limit completion
              if (this.isGateLimitMode) {
                this.completeGateLimitLevel(this.currentLevel.id, gateCount);
                const glAchs = this.achievements.checkGateLimitAchievement();
                this.ui.showAchievementToasts(glAchs);
                this.ui.showGateLimitResult(gateCount, this.currentLevel);
              }

              // Day 32 T9: Speedrun auto-advance
              if (this.speedrunMode) {
                setTimeout(() => this._speedrunAdvance(), 1200);
              }
            }
          } else {
            // Day 42 T9: Compute and store failure traces
            const failTraces = this._computeFailureTraces(results);
            this._failureTraces = failTraces;
            this.ui.updateTruthTable(results, failTraces);

            const passCount = results.filter(r => r.pass).length;
            const total = results.length;
            const failCount = total - passCount;
            // #94: Scale shake intensity with closeness (closer = weaker shake)
            const shakeIntensity = 1 - (passCount / total);
            
            if (passCount / total >= 0.75) {
              // Near-miss feedback: ≥75% correct
              this.audio.playFail();
              this._shakeScreen(shakeIntensity);
              this.haptic(40); // #98: medium buzz for near-miss
              const failingRows = results.map((r, i) => r.pass ? null : i + 1).filter(Boolean);
              this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
              this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
            } else {
              this.audio.playFail();
              this._shakeScreen(shakeIntensity);
              this.haptic(80); // #98: long buzz for failure
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
    // Day 42 T8: Clear previous failure traces
    this._clearFailureTraces();

    // Day 39 T9: Auto-expand truth table when running simulation
    if (this.ui) this.ui._expandTruthTable();

    // Day 37 T7: Ensure no signal flow animation artifacts from previous runs
    this.wireManager.resetAllSignalFlow();
    for (const gate of this.gates) { gate._signalArrived = null; }
    for (const node of this.inputNodes) { node._signalPulse = null; }
    for (const node of this.outputNodes) { node._receiveFlash = null; }

    if (this.isSandboxMode) {
      this.runSandboxTest();
      return;
    }

    const results = this.simulation.runAll();
    const allPass = results.every(r => r.pass);
    this.ui.updateTruthTable(results);

    if (allPass) {
      // Day 33 T2: Multi-phase — advance instead of completing
      if (this.isMultiPhase && this.currentPhase < this.currentLevel.phases.length - 1) {
        this.audio.playSuccess(1);
        setTimeout(() => this.advancePhase(), 800);
        return;
      }

      const gateCount = this.gates.length;

      if (this.isChallengeMode && this.currentLevel.isChallenge) {
        this.addLeaderboardEntry(this.currentLevel.difficultyKey, gateCount, this.currentLevel.difficulty);
        this.audio.playSuccess(2);
        this.haptic([30, 50, 30, 50, 50]); // #98
        this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
        this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
        this.ui.showChallengeResult(gateCount, this.currentLevel);
        this.ui.startCelebration(2, { mode: 'challenge' });
        this.earnHintToken('challenge complete');
        this.ui.showChallengeFriendButton(this.currentLevel, gateCount);
        if (this.blitzMode) setTimeout(() => this._blitzAdvance(), 1500);
      } else {
        // Day 47: Capture pre-completion state for celebration context
        const prevProg2 = this.progress.levels[this.currentLevel.id];
        const wasCompleted2 = prevProg2 && prevProg2.completed;
        const prevStars2 = prevProg2 ? (prevProg2.stars || 0) : 0;
        const hadPL2 = prevProg2 ? !!prevProg2.pureLogic : false;
        const isPLNew2 = this.hintsUsed === 0 && !hadPL2;
        const celebCh2 = getChapters();
        let celebChap2 = null;
        for (const ch of celebCh2) {
          if (ch.levels.includes(this.currentLevel.id)) { celebChap2 = ch; break; }
        }

        const stars = this.completeLevel(this.currentLevel.id, gateCount);
        this.audio.playSuccess(stars);
        this.haptic([30, 50, 30, 50, 50]); // #98
        this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
        this.ui.updateStatusBar('Level complete! All truth table rows match.');
        const aesthetics = this.calculateAestheticsScore();
        this.ui.showStarDisplay(stars, gateCount, this.currentLevel, aesthetics);
        // Day 47: Context-aware celebration
        this.ui.startCelebration(stars, {
          mode: 'campaign',
          chapterId: celebChap2 ? celebChap2.id : null,
          chapterColor: celebChap2 ? celebChap2.color : null,
          isPureLogicNew: isPLNew2,
          isImprovement: wasCompleted2 && stars > prevStars2,
          isReplay: wasCompleted2 && stars <= prevStars2,
          isFirstTime: !wasCompleted2,
        });
        const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
        const newAchs = this.achievements.checkAfterCompletion(this, this.currentLevel.id, gateCount, elapsed, this.hintsUsed);
        if (aesthetics.score >= 85 && this.achievements.unlock('clean_circuit')) {
          newAchs.push('clean_circuit');
        }
        // Day 41: Perfectionist achievement
        const perfAchs2 = this.achievements.checkPerfectionist(aesthetics.score, gateCount);
        newAchs.push(...perfAchs2);
        if (this.currentLevel.isDaily) {
          if (this.achievements.unlock('daily_solver')) newAchs.push('daily_solver');
          // Day 41: Track daily challenge completion for streak/total
          const dailyAchs2 = this.achievements.trackDailyChallengeComplete();
          newAchs.push(...dailyAchs2);
          this.ui.showShareButton(gateCount, stars, elapsed);
          this.earnHintToken('daily challenge');
          this.ui.showChallengeFriendButton(this.currentLevel, gateCount);
          // Day 44: Submit to daily leaderboard
          const lbResult2 = this.dailyLeaderboard.submitScore(gateCount, elapsed, this.dailyLeaderboard.getDisplayName());
          this.ui.showDailyLeaderboardResult(lbResult2);
        }
        this.ui.showAchievementToasts(newAchs);
        // Day 45: Gate Limit completion
        if (this.isGateLimitMode) {
          this.completeGateLimitLevel(this.currentLevel.id, gateCount);
          const glAchs2 = this.achievements.checkGateLimitAchievement();
          this.ui.showAchievementToasts(glAchs2);
          this.ui.showGateLimitResult(gateCount, this.currentLevel);
        }
        if (this.speedrunMode) setTimeout(() => this._speedrunAdvance(), 1200);
      }
    } else {
      // Day 42 T9: Compute and store failure traces
      const failTraces = this._computeFailureTraces(results);
      this._failureTraces = failTraces;
      this.ui.updateTruthTable(results, failTraces);

      const passCount = results.filter(r => r.pass).length;
      const total = results.length;
      const failCount = total - passCount;
      // #94: Scale shake intensity
      const shakeIntensity = 1 - (passCount / total);

      if (passCount / total >= 0.75) {
        this.audio.playFail();
        this._shakeScreen(shakeIntensity);
        this.haptic(40); // #98
        const failingRows = results.map((r, i) => r.pass ? null : i + 1).filter(Boolean);
        this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
        this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
      } else {
        this.audio.playFail();
        this._shakeScreen(shakeIntensity);
        this.haptic(80); // #98
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
    let dragGateStartX = 0;
    let dragGateStartY = 0;

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

    const signal = this._abortController ? this._abortController.signal : undefined;

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
        this._clearTapConnect();

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
          this.audio.playWireDisconnect(pos.x);
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
        this._clearTapConnect();
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this._tutorialWireCompleted(wire);
            this._startTimerIfPending(); // #96
            this.audio.playWireConnect(pin.x);
            this.haptic([15, 50, 15]); // #98: double pulse on wire connect
            this.renderer.spawnSparks(pin.x, pin.y);
            this.undoManager.push({ type: 'addWire', wireId: wire.id, fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
            // #97: Cycle detection
            if (this.detectCycle()) {
              this.ui.updateStatusBar('⚠ Cycle detected — circuit may not simulate correctly');
              wire._cycleWarning = true;
            }
            this.markDirty();
          }
        } else {
          this._startTimerIfPending(); // #96
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          this._tutorialWireStarted(pin.gateId, pin.pinIndex, pin.pinType);
          this.markDirty();
        }
        this.wireManager.selectedWire = null;
        return;
      }

      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        this._clearTapConnect();
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
      this._clearTapConnect();
      if (this.ui) this.ui.hideMobileDelete();
    }, { passive: false, signal });

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
        // T5: Grid snap overlay
        if (this.renderer) this.renderer._dragSnapOverlay = { x: pos.x - dragOffsetX, y: pos.y - dragOffsetY };
        this.markDirty();
      }

      if (isDraggingIONode && dragIONode) {
        const gridSize = 20;
        dragIONode.x = Math.round((pos.x - dragIOOffsetX) / gridSize) * gridSize;
        dragIONode.y = Math.round((pos.y - dragIOOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }
    }, { passive: false, signal });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      // T5: Clear grid snap overlay on touch end
      if (this.renderer) this.renderer._dragSnapOverlay = null;

      if (e.touches.length < 2) {
        pinchState = null;
      }
      if (isTwoFingerGesture && e.touches.length === 0) {
        isTwoFingerGesture = false;
        return;
      }
      if (isTwoFingerGesture) return;

      // I/O node: tap = toggle input value (or tap-to-connect), drag = reposition
      if (isDraggingIONode && dragIONode) {
        if (!touchMoved) {
          if (this.tapConnectSource !== null) {
            this._executeTapConnect(dragIONode.id);
          } else if (dragIONode.type === 'input') {
            dragIONode.value = dragIONode.value ? 0 : 1;
            this._propagateLiveSignals();
            this.audio.playClick();
          } else {
            // Output IO node: enter tap-to-connect as source
            this._setTapConnectSource(dragIONode.id);
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

      // Gate tap-to-connect (when tapped without dragging)
      if (isDraggingGate && dragGate && !touchMoved) {
        if (this.tapConnectSource !== null) {
          this._executeTapConnect(dragGate.id);
        } else {
          this._setTapConnectSource(dragGate.id);
        }
      }

      isDraggingGate = false;
      dragGate = null;
    }, { passive: false, signal });

    // ── Mouse support ──
    canvas.addEventListener('mousedown', (e) => {
      if (this.isAnimating) return;
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        this._clearTapConnect();
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this._tutorialWireCompleted(wire);
            this._startTimerIfPending(); // #96
            this.audio.playWireConnect(pin.x);
            this.haptic([15, 50, 15]); // #98
            this.renderer.spawnSparks(pin.x, pin.y);
            this.undoManager.push({
              type: 'addWire',
              wireId: wire.id,
              fromGateId: wire.fromGateId,
              fromPinIndex: wire.fromPinIndex,
              toGateId: wire.toGateId,
              toPinIndex: wire.toPinIndex,
            });
            // #97: Cycle detection
            if (this.detectCycle()) {
              this.ui.updateStatusBar('⚠ Cycle detected — circuit may not simulate correctly');
              wire._cycleWarning = true;
            }
            // Track first wire achievement
            const wireAchs = this.achievements.trackFirstWire();
            this.ui.showAchievementToasts(wireAchs);
            this.markDirty();
          }
        } else {
          this._startTimerIfPending(); // #96
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          this._tutorialWireStarted(pin.gateId, pin.pinIndex, pin.pinType);
          this.markDirty();
        }
        this.wireManager.selectedWire = null;
        return;
      }

      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        this._clearTapConnect();
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
        dragGateStartX = gate.x;
        dragGateStartY = gate.y;
        return;
      }

      this.selectedGate = null;
      this.wireManager.selectedWire = null;
      this._clearTapConnect();
    }, { signal });

    canvas.addEventListener('mousemove', (e) => {
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      this.wireManager.updateMouse(pos.x, pos.y);

      const pin = this.renderer.findPinAt(pos.x, pos.y);
      this.renderer.hoveredPin = pin;

      // Day 32 T2: Update wire proximity audio during wire drawing
      if (this.wireManager.drawing && this.audio._wireProxOsc) {
        const nearestDist = this._findNearestValidPinDistance(pos.x, pos.y);
        this.audio.updateWireProximity(nearestDist);
      }

      // T2: Pin hover audio feedback (throttled)
      if (pin) {
        const pinKey = pin.gateId + '-' + pin.pinIndex + '-' + pin.pinType;
        const now = Date.now();
        if (pinKey !== this._lastPinHoverId && now - this._lastPinHoverTime > 100) {
          this.audio.playPinHover();
          this._lastPinHoverId = pinKey;
          this._lastPinHoverTime = now;
        }
      } else {
        this._lastPinHoverId = null;
      }

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
        // T5: Grid snap overlay
        if (this.renderer) this.renderer._dragSnapOverlay = { x: pos.x - dragOffsetX, y: pos.y - dragOffsetY };
        this.markDirty();
      }

      if (isDraggingIONode && dragIONode) {
        const gridSize = 20;
        dragIONode.x = Math.round((pos.x - dragIOOffsetX) / gridSize) * gridSize;
        dragIONode.y = Math.round((pos.y - dragIOOffsetY) / gridSize) * gridSize;
        this.markDirty();
      }

      // T10: Context-aware cursor states
      if (isDraggingGate || isDraggingIONode) {
        canvas.style.cursor = 'grabbing';
      } else if (this.wireManager.drawing) {
        canvas.style.cursor = 'crosshair';
      } else if (pin) {
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
    }, { signal });

    canvas.addEventListener('mouseup', () => {
      // T5: Clear grid snap overlay
      if (this.renderer) this.renderer._dragSnapOverlay = null;
      this.markDirty();
      // I/O node: click-without-drag = toggle input (or tap-to-connect), drag = reposition
      if (isDraggingIONode && dragIONode) {
        if (dragIONode.x === dragIOStartX && dragIONode.y === dragIOStartY) {
          if (this.tapConnectSource !== null) {
            this._executeTapConnect(dragIONode.id);
          } else if (dragIONode.type === 'input') {
            dragIONode.value = dragIONode.value ? 0 : 1;
            this._propagateLiveSignals();
            this.audio.playClick();
            this.markDirty();
          } else {
            this._setTapConnectSource(dragIONode.id);
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
      // Gate: click-without-drag = tap-to-connect
      if (isDraggingGate && dragGate) {
        if (dragGate.x === dragGateStartX && dragGate.y === dragGateStartY) {
          if (this.tapConnectSource !== null) {
            this._executeTapConnect(dragGate.id);
          } else {
            this._setTapConnectSource(dragGate.id);
          }
        }
      }
      isDraggingGate = false;
      dragGate = null;
    }, { signal });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.isAnimating) return;
      const screenPos = this.renderer.getMousePos(e);
      const pos = this.renderer.screenToWorld(screenPos.x, screenPos.y);

      const wire = this.wireManager.findWireAt(pos.x, pos.y);
      if (wire) {
        this.audio.playWireDisconnect(pos.x);
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
    }, { signal });

    // Mouse wheel zoom (desktop)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const screenPos = this.renderer.getMousePos(e);
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const vt = this.renderer.viewTransform;
      this.renderer.zoomAt(vt.scale * zoomFactor, screenPos.x, screenPos.y);
    }, { passive: false, signal });

    document.addEventListener('keydown', (e) => {
      if (this.isAnimating || this.currentScreen !== 'gameplay') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        if (this.wireManager.selectedWire) {
          this.audio.playDeleteKey();
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
          this.audio.playDeleteKey();
          this.removeGate(this.selectedGate);
        }
      }

      if (e.key === 'Escape') {
        if (this.wireManager.drawing) {
          this.audio.playEscapeCancel();
        }
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

      // Number keys 1-6: Quick-place available gates at canvas center
      if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const level = this.currentLevel;
        if (level && level.availableGates) {
          const idx = parseInt(e.key) - 1;
          if (idx < level.availableGates.length) {
            const gateType = level.availableGates[idx];
            const def = GateTypes[gateType];
            if (def) {
              const cw = this.renderer.displayWidth || 800;
              const ch = this.renderer.displayHeight || 500;
              const center = this.renderer.screenToWorld(cw / 2, ch / 2);
              const gridSize = 20;
              // Offset each placed gate slightly to avoid stacking
              const jitter = this.gates.length * 30;
              const x = Math.round((center.x - def.width / 2 + jitter) / gridSize) * gridSize;
              const y = Math.round((center.y - def.height / 2) / gridSize) * gridSize;
              this.addGate(gateType, x, y);
            }
          }
        }
      }

      // Tab: Cycle through placed gates
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (this.gates.length > 0) {
          const currentIdx = this.selectedGate ? this.gates.indexOf(this.selectedGate) : -1;
          const nextIdx = (currentIdx + (e.shiftKey ? -1 : 1) + this.gates.length) % this.gates.length;
          this.selectedGate = this.gates[nextIdx];
          this.wireManager.selectedWire = null;
          this.markDirty();
          this.ui.updateStatusBar(`Selected: ${this.selectedGate.type} gate`);
          this.audio.playClick();
        }
      }

      // Arrow keys: Nudge selected gate
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && this.selectedGate && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 20;
        if (e.key === 'ArrowUp') this.selectedGate.y -= step;
        if (e.key === 'ArrowDown') this.selectedGate.y += step;
        if (e.key === 'ArrowLeft') this.selectedGate.x -= step;
        if (e.key === 'ArrowRight') this.selectedGate.x += step;
        this.markDirty();
        this._autoSave();
      }
    }, { signal });
  }

  // Day 32 T2: Find distance to nearest valid pin for wire proximity audio
  _findNearestValidPinDistance(mx, my) {
    let minDist = 999;
    if (!this.wireManager.drawFrom) return minDist;
    const fromType = this.wireManager.drawFrom.pinType;
    const targetType = fromType === 'output' ? 'input' : 'output';

    const checkPin = (px, py) => {
      const d = Math.hypot(mx - px, my - py);
      if (d < minDist) minDist = d;
    };

    for (const gate of this.gates) {
      if (targetType === 'input') {
        const pins = gate.getInputPins();
        pins.forEach(p => checkPin(gate.x + p.x, gate.y + p.y));
      } else {
        const pins = gate.getOutputPins();
        pins.forEach(p => checkPin(gate.x + p.x, gate.y + p.y));
      }
    }
    for (const node of this.inputNodes) {
      if (targetType === 'output') checkPin(node.x + node.width, node.y + node.height / 2);
    }
    for (const node of this.outputNodes) {
      if (targetType === 'input') checkPin(node.x, node.y + node.height / 2);
    }
    return minDist;
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

  _shakeScreen(intensity) {
    // #94: Scale shake intensity with closeness. intensity 0-1 (0=tiny, 1=strong)
    intensity = typeof intensity === 'number' ? intensity : 0.5;
    const container = document.getElementById('canvas-container');
    if (!container) return;
    container.style.setProperty('--shake-intensity', Math.max(0.15, intensity));
    container.classList.remove('screen-shake');
    void container.offsetWidth;
    container.classList.add('screen-shake');
    setTimeout(() => container.classList.remove('screen-shake'), 400);
  }

  // ── T7: Auto-Save Circuit State ──
  // Day 38: Tutorial wire event helpers
  _tutorialWireStarted(gateId, pinIndex, pinType) {
    if (this.tutorial && this.tutorial.isActive()) {
      this.tutorial.onWireStarted(gateId, pinIndex, pinType);
    }
  }
  _tutorialWireCompleted(wire) {
    if (this.tutorial && this.tutorial.isActive() && wire) {
      this.tutorial.onWireCompleted(wire.fromGateId, wire.toGateId, wire.toPinIndex);
    }
  }

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
    SafeStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  }

  _restoreAutoSave(levelId) {
    try {
      const raw = SafeStorage.getItem(AUTOSAVE_KEY);
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
    SafeStorage.removeItem(AUTOSAVE_KEY);
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
      const all = JSON.parse(SafeStorage.getItem(GHOST_KEY) || '{}');
      all[levelId] = data;
      SafeStorage.setItem(GHOST_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  _loadGhost(levelId) {
    this.ghostOverlay = null;
    this.showGhost = false;
    try {
      const all = JSON.parse(SafeStorage.getItem(GHOST_KEY) || '{}');
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


  // ── Day 43: Level Preview Thumbnails ──
  _savePreview(levelId) {
    if (!levelId || typeof levelId !== 'number') return;
    try {
      // Capture gate positions/types, wire endpoint coords, I/O node positions
      const wireData = [];
      for (const wire of this.wireManager.wires) {
        const endpoints = this.wireManager.getWireEndpoints(wire);
        if (!endpoints) continue;
        wireData.push({
          fx: Math.round(endpoints.fromPin.x),
          fy: Math.round(endpoints.fromPin.y),
          tx: Math.round(endpoints.toPin.x),
          ty: Math.round(endpoints.toPin.y),
        });
      }
      const preview = {
        g: this.gates.map(g => ({ t: g.type, x: Math.round(g.x), y: Math.round(g.y) })),
        w: wireData,
        io: [
          ...this.inputNodes.map(n => ({ t: 'i', x: Math.round(n.x), y: Math.round(n.y) })),
          ...this.outputNodes.map(n => ({ t: 'o', x: Math.round(n.x), y: Math.round(n.y) })),
        ],
        ts: Date.now(),
        gc: this.gates.length,
      };

      const all = JSON.parse(SafeStorage.getItem(PREVIEW_KEY) || '{}');
      all[levelId] = preview;

      // LRU eviction: keep only 20 most recent previews
      const keys = Object.keys(all);
      if (keys.length > 20) {
        keys.sort((a, b) => (all[a].ts || 0) - (all[b].ts || 0));
        while (Object.keys(all).length > 20) {
          const oldest = keys.shift();
          delete all[oldest];
        }
      }

      SafeStorage.setItem(PREVIEW_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  getPreview(levelId) {
    try {
      const all = JSON.parse(SafeStorage.getItem(PREVIEW_KEY) || '{}');
      return all[levelId] || null;
    } catch (e) { return null; }
  }

  getAllPreviews() {
    try {
      return JSON.parse(SafeStorage.getItem(PREVIEW_KEY) || '{}');
    } catch (e) { return {}; }
  }

  toggleGhost() {
    if (!this.ghostOverlay) return;
    this.showGhost = !this.showGhost;
    this.markDirty();
  }

  // ── Day 32 T6: Micro-Celebrations ──
  _checkMicroCelebrations() {
    if (!this._microCelebrations || this.isSandboxMode) return;
    // First wire in level
    if (!this._microCelebrations.firstWire && this.wireManager.wires.length === 1) {
      this._microCelebrations.firstWire = true;
      this.audio.playMicroCelebration();
      if (this.renderer) {
        const wire = this.wireManager.wires[0];
        const endpoints = this.wireManager.getWireEndpoints(wire);
        if (endpoints) this.renderer.spawnSparks(endpoints.toPin.x, endpoints.toPin.y);
      }
    }
  }

  // ── Day 32 T8: Blitz Ladder Mode ──
  startBlitzMode() {
    this.blitzMode = true;
    this.blitzLevel = 0;
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    this.blitzStart = Date.now();
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('blitz'));
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this._showBlitzHud(true);
    this._loadNextBlitzPuzzle();
    if (this.blitzTimer) clearInterval(this.blitzTimer);
    this.blitzTimer = setInterval(() => this._updateBlitzTimer(), 1000);
    setTimeout(() => this.renderer.resize(), 100);
  }

  _loadNextBlitzPuzzle() {
    // Escalating difficulty: level 0-2 = 2x1, 3-5 = 3x1, 6-8 = 2x2, 9+ = 3x2
    const ladderConfig = [
      { i: 2, o: 1 }, { i: 2, o: 1 }, { i: 2, o: 1 },
      { i: 3, o: 1 }, { i: 3, o: 1 }, { i: 3, o: 1 },
      { i: 2, o: 2 }, { i: 2, o: 2 }, { i: 2, o: 2 },
      { i: 3, o: 2 }, { i: 3, o: 2 }, { i: 4, o: 1 },
    ];
    const cfg = ladderConfig[Math.min(this.blitzLevel, ladderConfig.length - 1)];
    const level = generateChallenge(cfg.i, cfg.o);
    level.title = `Blitz #${this.blitzLevel + 1}: ${level.title}`;
    this.loadChallengeLevel(level);
  }

  _blitzAdvance() {
    this.blitzLevel++;
    this._saveBlitzBest(this.blitzLevel);
    this._updateBlitzHud();
    this._loadNextBlitzPuzzle();
  }

  _updateBlitzTimer() {
    if (!this.blitzStart) return;
    const elapsed = Math.floor((Date.now() - this.blitzStart) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const el = document.getElementById('blitz-timer');
    if (el) el.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _updateBlitzHud() {
    const el = document.getElementById('blitz-level');
    if (el) el.textContent = `Level ${this.blitzLevel + 1}`;
    const best = this._getBlitzBest();
    const bestEl = document.getElementById('blitz-best');
    if (bestEl) bestEl.textContent = best > 0 ? `Best: Level ${best}` : 'Best: —';
  }

  _showBlitzHud(show) {
    const hud = document.getElementById('blitz-hud');
    if (hud) hud.style.display = show ? 'flex' : 'none';
  }

  _getBlitzBest() {
    try { return parseInt(SafeStorage.getItem('signal-circuit-blitz-best') || '0'); } catch (e) { return 0; }
  }

  _saveBlitzBest(level) {
    const current = this._getBlitzBest();
    if (level > current) SafeStorage.setItem('signal-circuit-blitz-best', String(level));
  }

  stopBlitzMode() {
    this.blitzMode = false;
    this.isChallengeMode = false;
    if (this.blitzTimer) { clearInterval(this.blitzTimer); this.blitzTimer = null; }
    this._showBlitzHud(false);
    this.showLevelSelect();
  }

  // ── Day 32 T9: Speedrun Mode ──
  startSpeedrunMode() {
    const allLevels = LEVELS.map(l => l.id);
    if (allLevels.length === 0) return;
    this.speedrunMode = true;
    // Day 45: Check gate limit toggle for speedrun hard mode
    const glToggle = document.getElementById('speedrun-gl-toggle');
    this._speedrunGateLimit = glToggle && glToggle.checked;
    // Day 41: Track mode exploration
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('speedrun'));
    this.speedrunLevelIdx = 0;
    this.speedrunSplits = [];
    this.isChallengeMode = false;
    this.isSandboxMode = false;
    this.speedrunStart = Date.now();
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this._showSpeedrunHud(true);
    this.loadLevel(allLevels[0]);
    // Day 45: Apply gate limit on first speedrun level
    if (this._speedrunGateLimit) {
      const firstLvl = getLevel(allLevels[0]);
      if (firstLvl) { this.isGateLimitMode = true; this.gateBudget = firstLvl.optimalGates; }
    }
    if (this.speedrunTimer) clearInterval(this.speedrunTimer);
    this.speedrunTimer = setInterval(() => this._updateSpeedrunTimer(), 1000);
    setTimeout(() => this.renderer.resize(), 100);
  }

  _speedrunAdvance() {
    // Record split
    const elapsed = Date.now() - this.speedrunStart;
    this.speedrunSplits.push(elapsed);
    this.speedrunLevelIdx++;
    const allLevels = LEVELS.map(l => l.id);
    if (this.speedrunLevelIdx >= allLevels.length) {
      // Speedrun complete!
      this._finishSpeedrun();
      return;
    }
    this._updateSpeedrunHud();
    this.loadLevel(allLevels[this.speedrunLevelIdx]);
    // Day 45: Apply gate limit in speedrun if enabled
    if (this._speedrunGateLimit) {
      const lvl = getLevel(allLevels[this.speedrunLevelIdx]);
      if (lvl) { this.isGateLimitMode = true; this.gateBudget = lvl.optimalGates; }
    }
  }

  _finishSpeedrun() {
    const totalMs = Date.now() - this.speedrunStart;
    const totalSec = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    this._saveSpeedrunBest(totalSec);
    this.stopSpeedrunMode();
    this.ui.showConfirmModal(
      `🏁 Speedrun Complete!\nTime: ${mins}:${secs.toString().padStart(2, '0')}\n${this._getSpeedrunBest() === totalSec ? '🎉 New Personal Best!' : `PB: ${this._formatSpeedrunBest()}`}`,
      () => {}
    );
  }

  _updateSpeedrunTimer() {
    if (!this.speedrunStart) return;
    const elapsed = Math.floor((Date.now() - this.speedrunStart) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const el = document.getElementById('speedrun-timer');
    if (el) el.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _updateSpeedrunHud() {
    const total = LEVELS.length;
    const el = document.getElementById('speedrun-progress');
    if (el) el.textContent = `${this.speedrunLevelIdx + 1}/${total}`;
    const bestEl = document.getElementById('speedrun-best');
    if (bestEl) bestEl.textContent = `PB: ${this._formatSpeedrunBest()}`;
  }

  _showSpeedrunHud(show) {
    const hud = document.getElementById('speedrun-hud');
    if (hud) hud.style.display = show ? 'flex' : 'none';
  }

  _getSpeedrunBest() {
    try { return parseInt(SafeStorage.getItem('signal-circuit-speedrun-best') || '0'); } catch (e) { return 0; }
  }

  _saveSpeedrunBest(seconds) {
    const key = this._speedrunGateLimit ? 'signal-circuit-speedrun-gl-best' : 'signal-circuit-speedrun-best';
    const current = parseInt(SafeStorage.getItem(key) || '0');
    if (current === 0 || seconds < current) SafeStorage.setItem(key, String(seconds));
  }

  _formatSpeedrunBest() {
    const best = this._getSpeedrunBest();
    if (!best) return '—';
    const m = Math.floor(best / 60);
    const s = best % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  stopSpeedrunMode() {
    this.speedrunMode = false;
    if (this.speedrunTimer) { clearInterval(this.speedrunTimer); this.speedrunTimer = null; }
    this._showSpeedrunHud(false);
    this.showLevelSelect();
  }

  // ── Day 32 T10: Spaced Repetition ──
  getReviewLevels() {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const candidates = [];

    for (const [id, data] of Object.entries(this.progress.levels || {})) {
      if (!data.completed) continue;
      const lastPlayed = data.lastPlayed || data.completedAt || 0;
      if (!lastPlayed || (now - lastPlayed) < threeDaysMs) continue;
      candidates.push({
        levelId: parseInt(id),
        stars: data.stars || 0,
        daysSincePlay: Math.floor((now - lastPlayed) / 86400000),
        score: (4 - (data.stars || 0)) * 10 + Math.floor((now - lastPlayed) / 86400000), // Higher = more needy
      });
    }

    // Sort by review priority (highest score first) and take top 3
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 3);
  }

  // ── Day 33 T7: Gamepad Support ──
  _setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      this._gamepadConnected = true;
      this._gamepadCursor = { x: 350, y: 200 }; // Center of reference canvas
      this.ui.updateStatusBar('🎮 Gamepad connected');
      this.markDirty();
    });
    window.addEventListener('gamepaddisconnected', () => {
      this._gamepadConnected = false;
      this._gamepadCursor = null;
      this.ui.updateStatusBar('🎮 Gamepad disconnected');
      this.markDirty();
    });
  }

  _pollGamepad() {
    if (!this._gamepadConnected || this.currentScreen !== 'gameplay') return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const deadzone = 0.2;
    const speed = 5;
    let cx = this._gamepadCursor ? this._gamepadCursor.x : 350;
    let cy = this._gamepadCursor ? this._gamepadCursor.y : 200;

    // Left stick or D-pad
    const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    const ly = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
    // D-pad buttons (indices 12-15: up, down, left, right)
    const dpUp = gp.buttons[12] && gp.buttons[12].pressed ? -1 : 0;
    const dpDown = gp.buttons[13] && gp.buttons[13].pressed ? 1 : 0;
    const dpLeft = gp.buttons[14] && gp.buttons[14].pressed ? -1 : 0;
    const dpRight = gp.buttons[15] && gp.buttons[15].pressed ? 1 : 0;

    cx += (lx + dpLeft + dpRight) * speed;
    cy += (ly + dpUp + dpDown) * speed;
    cx = Math.max(0, Math.min(700, cx));
    cy = Math.max(0, Math.min(500, cy));
    this._gamepadCursor = { x: cx, y: cy };

    // A button (0) — select/place
    if (gp.buttons[0] && gp.buttons[0].pressed && !this._gpAWasPressed) {
      const pos = this.renderer ? this.renderer.screenToWorld(cx, cy) : { x: cx, y: cy };
      const pin = this.renderer ? this.renderer.findPinAt(pos.x, pos.y) : null;
      if (pin) {
        if (this.wireManager.drawing) {
          const wire = this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          if (wire) {
            this._tutorialWireCompleted(wire);
            this.audio.playWireConnect();
            this.undoManager.push({ type: 'addWire', wireId: wire.id, fromGateId: wire.fromGateId, fromPinIndex: wire.fromPinIndex, toGateId: wire.toGateId, toPinIndex: wire.toPinIndex });
          }
        } else {
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
          this._tutorialWireStarted(pin.gateId, pin.pinIndex, pin.pinType);
        }
      } else {
        const gate = this.renderer ? this.renderer.findGateAt(pos.x, pos.y) : null;
        if (gate) {
          this.selectedGate = gate;
        }
      }
      this.markDirty();
    }
    this._gpAWasPressed = gp.buttons[0] && gp.buttons[0].pressed;

    // B button (1) — delete
    if (gp.buttons[1] && gp.buttons[1].pressed && !this._gpBWasPressed) {
      if (this.selectedGate) {
        this.removeGate(this.selectedGate);
        this.selectedGate = null;
      }
    }
    this._gpBWasPressed = gp.buttons[1] && gp.buttons[1].pressed;

    // LB (4) — undo, RB (5) — redo
    if (gp.buttons[4] && gp.buttons[4].pressed && !this._gpLBWasPressed) {
      this.performUndo();
    }
    this._gpLBWasPressed = gp.buttons[4] && gp.buttons[4].pressed;

    if (gp.buttons[5] && gp.buttons[5].pressed && !this._gpRBWasPressed) {
      this.performRedo();
    }
    this._gpRBWasPressed = gp.buttons[5] && gp.buttons[5].pressed;

    this.markDirty();
  }

  // ── Day 33 T10: Last Visit Tracking ──
  _updateLastVisit() {
    SafeStorage.setItem('signal-circuit-last-visit', String(Date.now()));
  }

  _getLastVisit() {
    try {
      const ts = SafeStorage.getItem('signal-circuit-last-visit');
      return ts ? parseInt(ts) : 0;
    } catch (e) { return 0; }
  }

  _checkWelcomeBack() {
    const lastVisit = this._getLastVisit();
    if (!lastVisit) return; // First visit
    const daysSince = Math.floor((Date.now() - lastVisit) / 86400000);
    if (daysSince >= 7 && this.ui) {
      this.ui.showWelcomeBackModal(daysSince);
    }
  }

  // ── Day 33 T2: Multi-Phase Level Support ──
  advancePhase() {
    if (!this.isMultiPhase || !this.currentLevel || !this.currentLevel.phases) return false;
    const nextPhaseIdx = this.currentPhase + 1;
    if (nextPhaseIdx >= this.currentLevel.phases.length) return false;

    this.currentPhase = nextPhaseIdx;
    const phase = this.currentLevel.phases[nextPhaseIdx];

    // Update truth table
    this.currentLevel.truthTable = phase.truthTable;
    this.currentLevel.description = phase.description;
    if (phase.optimalGates) this.currentLevel.optimalGates = phase.optimalGates;
    if (phase.goodGates) this.currentLevel.goodGates = phase.goodGates;

    // Phase 2 may add new outputs
    if (phase.outputs) {
      // Remove existing output nodes and recreate
      this.outputNodes = [];
      for (const out of phase.outputs) {
        const pos = this._scalePosition(out.x, out.y);
        const node = new IONode('output', out.label, pos.x, pos.y, this.nextId++);
        this.outputNodes.push(node);
      }
    }

    // Update UI
    this.ui.updateLevelInfo();
    this.ui.updateTruthTable(null);
    this.ui.updateResultDisplay('idle', `Phase ${nextPhaseIdx + 1} — ${phase.description}`);
    this.ui.updateStatusBar(`⚡ Phase ${nextPhaseIdx + 1} activated!`);
    this.audio.playSuccess(1); // Brief celebration for phase advance
    this.ui.updateGateIndicator();
    this.markDirty();
    return true;
  }

  // ── Day 33 T5: Check if a gate is locked (pre-placed) ──
  isGateLocked(gateId) {
    return this._lockedGateIds.has(gateId);
  }

  // ── Day 33 T8: Cross-Device Sync ──
  exportProgress() {
    try {
      const data = {
        v: 1,
        levels: this.progress.levels,
        streak: this.getStreakData(),
        tokens: this.hintTokens,
        ts: Date.now(),
      };
      return btoa(JSON.stringify(data));
    } catch (e) {
      return null;
    }
  }

  importProgress(code) {
    try {
      const json = atob(code.trim());
      const data = JSON.parse(json);
      if (!data.v || !data.levels) return false;
      this.progress.levels = data.levels;
      this.saveProgress();
      if (data.streak) this.saveStreakData(data.streak);
      if (data.tokens) {
        this.hintTokens = data.tokens;
        this._saveHintTokens();
      }
      if (this.ui) {
        this.ui.renderLevelSelect();
        this.ui.updateProgressBar(this.progress);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  startRenderLoop() {
    let idleFrameCount = 0;
    const loop = () => {
      // Day 33 T7: Poll gamepad
      if (this._gamepadConnected) this._pollGamepad();

      if (this.currentScreen === 'gameplay') {
        // Always render during animation, otherwise only when dirty
        const sim = this.simulation;
        const hasActiveParticles = this.renderer.sparkParticles.length > 0 || this.renderer.ripples.length > 0;
        if (this.needsRender || (sim && sim.animating) || 
            hasActiveParticles || (this.tutorial && this.tutorial.isActive()) ||
            this.wireManager.drawing) {
          this.renderer.render();
          this.needsRender = false;
          idleFrameCount = 0;
        } else {
          // F29-2: Trim idle rendering — only redraw every 30 frames (~2Hz) when idle
          idleFrameCount++;
          if (idleFrameCount >= 30) {
            this.renderer.render();
            idleFrameCount = 0;
          }
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Day 35 T2: Clean up all event listeners via AbortController
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.blitzTimer) clearInterval(this.blitzTimer);
    if (this.speedrunTimer) clearInterval(this.speedrunTimer);
    this.audio.stopAmbient();
    // Day 38: Clean up tutorial on level exit
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
  }

  // Day 42 T9: Compute failure traces for all failing rows
  _computeFailureTraces(results) {
    if (!results || !this.currentLevel) return null;
    var level = this.currentLevel;
    var tracesByRow = {};
    var constantOutputs = this.simulation.detectConstantOutputs(results);

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.pass) continue;
      var rowTraces = this.simulation.traceFailurePath(r.inputs, r.expectedOutputs);
      // Attach constant output hints
      if (rowTraces && rowTraces.length > 0) {
        var outputLabels = level.outputs.map(function(o) { return o.label; });
        for (var ti = 0; ti < rowTraces.length; ti++) {
          var trace = rowTraces[ti];
          // Find the output index by label
          var outIdx = outputLabels.indexOf(trace.outputLabel);
          if (outIdx >= 0 && constantOutputs[outIdx] !== undefined) {
            trace._constantHint = constantOutputs[outIdx];
          }
        }
      }
      tracesByRow[i] = rowTraces;
    }
    return tracesByRow;
  }

  // Day 42 T7: Show error highlight on canvas for specific gates/wires
  _showErrorHighlight(gateIds, wireIds) {
    this._errorHighlightGates = gateIds || [];
    this._errorHighlightWires = wireIds || [];
    this._errorHighlightUntil = performance.now() + 2500;
    this.markDirty();
  }

  // Day 42 T8: Clear failure traces
  _clearFailureTraces() {
    this._failureTraces = null;
    this._errorHighlightGates = [];
    this._errorHighlightWires = [];
    this._errorHighlightUntil = 0;
  }
}

// ── Custom Level URL Hash ──
function parseCustomLevelFromHash() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#custom=')) return null;
    const encoded = hash.slice(8);
    const json = atob(encoded);
    const data = JSON.parse(json);
    if (!data.n || !data.i || !data.o || !data.t || !data.g) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function buildCustomLevel(data) {
  const numInputs = data.i;
  const numOutputs = data.o;
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : Array.from({ length: numOutputs }, (_, i) => `Y${i}`);

  const inputs = inputLabels.map((label, i) => ({
    label,
    x: 60,
    y: 80 + i * Math.min(100, 300 / numInputs),
  }));
  const outputs = outputLabels.map((label, i) => ({
    label,
    x: 620,
    y: 80 + i * Math.min(100, 300 / numOutputs) + (numInputs - numOutputs) * 25,
  }));

  const truthTable = data.t.map(row => ({
    inputs: row.slice(0, numInputs),
    outputs: row.slice(numInputs),
  }));

  return {
    id: 'custom',
    title: data.n || 'Custom Level',
    description: 'A community-created custom level!',
    hints: [],
    availableGates: data.g,
    optimalGates: Math.max(1, numInputs),
    goodGates: Math.max(2, numInputs + 2),
    inputs,
    outputs,
    truthTable,
    isCustom: true,
  };
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameState();
  game.init();
  game.startRenderLoop();
  window.game = game;

  // Set correct toggle label for mobile
  const toggleBtn = document.getElementById('panel-toggle');
  if (toggleBtn && window.innerWidth <= 768) {
    toggleBtn.textContent = '▼ Hide';
  }

  // Check for custom level in URL hash
  const customData = parseCustomLevelFromHash();
  if (customData) {
    const customLevel = buildCustomLevel(customData);
    game.isChallengeMode = false;
    game.isSandboxMode = false;
    game.currentScreen = 'gameplay';
    game.ui.showScreen('gameplay');
    game.audio.startAmbient();
    game.renderer.resize();
    game.renderer.resetView();
    game.loadChallengeLevel(customLevel);
    setTimeout(() => game.renderer.resize(), 100);
  }

  // Day 32 T3: Check for friend challenge URL
  const friendData = parseFriendChallenge();
  if (friendData) {
    const friendLevel = buildFriendChallengeLevel(friendData);
    game.isChallengeMode = true;
    game.isSandboxMode = false;
    game.currentScreen = 'gameplay';
    game.ui.showScreen('gameplay');
    game.audio.startAmbient();
    game.renderer.resize();
    game.renderer.resetView();
    game.loadChallengeLevel(friendLevel);
    setTimeout(() => game.renderer.resize(), 100);
  }

  // Save playtime on page unload
  window.addEventListener('beforeunload', () => {
    game.trackPlaytimeEnd();
  });
});
