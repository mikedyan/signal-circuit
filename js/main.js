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
const SKILL_KEY = 'signal-circuit-skill';
const SUBCIRCUIT_KEY = 'signal-circuit-subcircuits';
const DIFFICULTY_KEY = 'signal-circuit-difficulty-mode';
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
  // Day 71: Mythic palette — unlocked once any mythic achievement is earned.
  { id: 'mythic', name: 'Mythic', desc: 'Iridescent prismatic wires — only after your first mythic unlock', condition: { type: 'anyMythic' },
    palette: ['#ff6bff','#9d6bff','#6b9dff','#6bffd9','#a8ff6b','#ffe26b','#ff8c6b','#ff6bb6','#cc6bff','#6bf2ff'] },
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
      case 'anyMythic': {
        // Day 71: Unlocked once any mythic achievement is earned.
        if (!gs || !gs.achievements || !gs.achievements.unlocked) return false;
        if (typeof ACHIEVEMENTS === 'undefined') return false;
        for (const a of ACHIEVEMENTS) {
          if (a.tier === 'mythic' && gs.achievements.unlocked[a.id]) return true;
        }
        return false;
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
      case 'anyMythic': return 'Earn any Mythic achievement';
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
    // Day 61 (Harden Day 4): track used names to enforce uniqueness — fixes P2 duplicate name bug
    const usedNames = new Set();
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

      // Generate anonymous name — enforce uniqueness by walking the name list on collision
      let nameIdx = Math.floor(lbRand() * DAILY_LB_NAMES.length);
      let pickedName = DAILY_LB_NAMES[nameIdx];
      let probes = 0;
      while (usedNames.has(pickedName) && probes < DAILY_LB_NAMES.length) {
        nameIdx = (nameIdx + 1) % DAILY_LB_NAMES.length;
        pickedName = DAILY_LB_NAMES[nameIdx];
        probes++;
      }
      // If the entire pool is exhausted, suffix a numeric tag for stability
      if (usedNames.has(pickedName)) {
        pickedName = pickedName + '_' + i;
      }
      usedNames.add(pickedName);
      scores.push({
        gates: gates,
        time: time,
        name: pickedName,
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


// ── Day 50: Adaptive Challenge Difficulty — Skill Tracker ──

const SKILL_LEVELS = [
  { id: 'novice', label: 'Novice', min: 0, max: 30, color: '#44dd44' },
  { id: 'intermediate', label: 'Intermediate', min: 31, max: 60, color: '#00ccee' },
  { id: 'advanced', label: 'Advanced', min: 61, max: 85, color: '#ff8800' },
  { id: 'expert', label: 'Expert', min: 86, max: 100, color: '#ffd700' },
];

class SkillTracker {
  constructor(gameState) {
    this.gameState = gameState;
    this._load();
  }

  _load() {
    try {
      const saved = SafeStorage.getItem(SKILL_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.score = typeof data.score === 'number' ? Math.max(0, Math.min(100, data.score)) : 0;
        this.history = Array.isArray(data.history) ? data.history.slice(-30) : [];
        return;
      }
    } catch (e) {}
    this.score = 0;
    this.history = [];
  }

  _save() {
    SafeStorage.setItem(SKILL_KEY, JSON.stringify({
      score: this.score,
      history: this.history.slice(-30),
    }));
  }

  // Calculate skill score from current player progress
  calculate() {
    const gs = this.gameState;
    if (!gs) return 0;
    const progress = gs.progress;
    const totalLevels = typeof getLevelCount === 'function' ? getLevelCount() : 40;

    // Factor 1: Levels completed (30% weight)
    let completedCount = 0;
    let totalStars = 0;
    let totalPossibleStars = 0;
    let hintLevels = 0;
    let totalGateRatio = 0;
    let gateRatioCount = 0;
    let fastSolves = 0;
    let solvedCount = 0;

    const allLevels = typeof LEVELS !== 'undefined' ? LEVELS : [];
    for (const level of allLevels) {
      const p = progress.levels[level.id];
      if (!p || !p.completed) continue;
      completedCount++;
      totalStars += (p.stars || 0);
      totalPossibleStars += 3;

      // Hint usage
      if (!p.pureLogic) hintLevels++;

      // Gate efficiency: bestGateCount / optimalGates (lower is better)
      if (p.bestGateCount && level.optimalGates && level.optimalGates > 0) {
        totalGateRatio += Math.min(2, p.bestGateCount / level.optimalGates);
        gateRatioCount++;
      }

      // Speed: consider anything under 90s as fast for campaign
      if (p.bestTime && p.bestTime < 90) fastSolves++;
      solvedCount++;
    }

    // F1: Completion ratio (0-30)
    const completionRatio = totalLevels > 0 ? completedCount / totalLevels : 0;
    const f1 = completionRatio * 30;

    // F2: Average stars (0-25)
    const avgStars = totalPossibleStars > 0 ? totalStars / totalPossibleStars : 0;
    const f2 = avgStars * 25;

    // F3: Speed factor (0-20) — % of fast solves
    const speedRatio = solvedCount > 0 ? fastSolves / solvedCount : 0;
    const f3 = speedRatio * 20;

    // F4: Low hint usage (0-15) — higher when fewer hints used
    const hintRatio = solvedCount > 0 ? 1 - (hintLevels / solvedCount) : 0;
    const f4 = Math.max(0, hintRatio) * 15;

    // F5: Gate efficiency (0-10) — avg ratio near 1.0 is best
    const avgGateRatio = gateRatioCount > 0 ? totalGateRatio / gateRatioCount : 2;
    const efficiencyScore = Math.max(0, 1 - (avgGateRatio - 1)); // 1.0 → 1, 2.0 → 0
    const f5 = Math.max(0, efficiencyScore) * 10;

    const raw = Math.round(f1 + f2 + f3 + f4 + f5);
    this.score = Math.max(0, Math.min(100, raw));

    // Record in history
    this.history.push({ score: this.score, ts: Date.now() });
    if (this.history.length > 30) this.history = this.history.slice(-30);
    this._save();
    return this.score;
  }

  // Record result of an adaptive/challenge completion and adjust score
  recordResult(gateCount, elapsed, hintsUsed, optimalGates) {
    let delta = 0;
    const gateRatio = optimalGates > 0 ? gateCount / optimalGates : 2;

    // Good performance: close to optimal, fast, no hints
    if (gateRatio <= 1.5 && elapsed < 120 && hintsUsed === 0) {
      delta = 3; // Strong performance
    } else if (gateRatio <= 2.0 && hintsUsed === 0) {
      delta = 2; // Solid
    } else if (gateRatio <= 2.5) {
      delta = 1; // Adequate
    } else if (gateRatio > 3.0 || hintsUsed > 1) {
      delta = -1; // Struggled
    } else if (gateRatio > 4.0 && hintsUsed > 2) {
      delta = -2; // Way over
    }

    this.score = Math.max(0, Math.min(100, this.score + delta));
    this.history.push({ score: this.score, ts: Date.now() });
    if (this.history.length > 30) this.history = this.history.slice(-30);
    this._save();
    return delta;
  }

  getSkillLevel() {
    for (const level of SKILL_LEVELS) {
      if (this.score >= level.min && this.score <= level.max) {
        return {
          score: this.score,
          level: level.id,
          label: level.label,
          color: level.color,
          min: level.min,
          max: level.max,
        };
      }
    }
    return { score: this.score, level: 'novice', label: 'Novice', color: '#44dd44', min: 0, max: 30 };
  }

  // Get skill data for export/import
  exportData() {
    return { score: this.score, history: this.history };
  }

  importData(data) {
    if (data && typeof data.score === 'number') {
      this.score = Math.max(0, Math.min(100, data.score));
      this.history = Array.isArray(data.history) ? data.history.slice(-30) : [];
      this._save();
    }
  }
}


// ── Day 68: Infinite Mode ───────────────────────────────
// Endless adaptive run loop on top of generateAdaptiveChallenge.
// 3 lives, skip costs a life, streak builds skill tier.
const INFINITE_BEST_KEY = 'signal_circuit_infinite_v1';
const INFINITE_TIERS = ['novice', 'intermediate', 'advanced', 'expert'];
const INFINITE_TIER_SCORES = { novice: 15, intermediate: 45, advanced: 75, expert: 95 };
const INFINITE_TIER_LABELS = { novice: 'Novice', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

class InfiniteRunManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.lives = 0;
    this.streak = 0;
    this.totalSolved = 0;
    this.bestStreak = 0;
    this.runStartMs = 0;
    this.tier = 'novice';
    this._hintUsedThisPuzzle = false;
    this._pureLogicCount = 0;
    this._timerInterval = null;
    this.best = this._loadBest();
  }

  _loadBest() {
    try {
      const raw = localStorage.getItem(INFINITE_BEST_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          bestStreak: data.bestStreak || 0,
          bestSolved: data.bestSolved || 0,
          bestTimeSec: data.bestTimeSec || 0,
          totalRuns: data.totalRuns || 0,
        };
      }
    } catch (e) {}
    return { bestStreak: 0, bestSolved: 0, bestTimeSec: 0, totalRuns: 0 };
  }

  _saveBest() {
    try { localStorage.setItem(INFINITE_BEST_KEY, JSON.stringify(this.best)); } catch (e) {}
  }

  defaultStartingTier() {
    if (!this.game || !this.game.skillTracker) return 'novice';
    try { this.game.skillTracker.calculate(); } catch (e) {}
    const score = (this.game.skillTracker.score || 0);
    if (score <= 30) return 'novice';
    if (score <= 60) return 'intermediate';
    if (score <= 85) return 'advanced';
    return 'expert';
  }

  startRun(tier) {
    this.active = true;
    this.lives = 3;
    this.streak = 0;
    this.totalSolved = 0;
    this.runStartMs = Date.now();
    this.tier = INFINITE_TIERS.indexOf(tier) >= 0 ? tier : 'novice';
    this._hintUsedThisPuzzle = false;
    this._pureLogicCount = 0;
    this.best.totalRuns = (this.best.totalRuns || 0) + 1;
    this._saveBest();
    this._loadNextPuzzle();
    this._startTimer();
    this._updateHud();
  }

  _bumpTierFromStreak() {
    if (this.streak > 0 && this.streak % 5 === 0) {
      const idx = INFINITE_TIERS.indexOf(this.tier);
      if (idx >= 0 && idx < INFINITE_TIERS.length - 1) {
        this.tier = INFINITE_TIERS[idx + 1];
      }
    }
  }

  _loadNextPuzzle() {
    if (!this.active) return;
    this._hintUsedThisPuzzle = false;
    const score = INFINITE_TIER_SCORES[this.tier] || 15;
    let level;
    try {
      level = generateAdaptiveChallenge(score);
    } catch (e) {
      level = generateChallenge(2, 1);
    }
    if (!level) level = generateChallenge(2, 1);
    level.isInfinite = true;
    level.title = `♾️ ${INFINITE_TIER_LABELS[this.tier]} #${this.totalSolved + 1}`;
    level.description = `Infinite Run — ${INFINITE_TIER_LABELS[this.tier]} tier`;
    this.game.isChallengeMode = true;
    this.game.isSandboxMode = false;
    this.game.currentScreen = 'gameplay';
    this.game.ui.showScreen('gameplay');
    this.game.audio.startAmbient();
    this.game.renderer.resize();
    this.game.renderer.resetView();
    this.game.loadChallengeLevel(level);
    setTimeout(() => this.game.renderer.resize(), 60);
  }

  onSolve() {
    if (!this.active) return;
    this.streak++;
    this.totalSolved++;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    if (!this._hintUsedThisPuzzle) {
      this._pureLogicCount++;
      if (this._pureLogicCount >= 10 && this.game.achievements.unlock('pure_logic_run')) {
        this.game.ui.showAchievementToasts(['pure_logic_run']);
      }
    } else {
      this._pureLogicCount = 0;
    }
    if (this.streak >= 50 && this.game.achievements.unlock('infinite_marathon')) {
      this.game.ui.showAchievementToasts(['infinite_marathon']);
    }
    // Day 71: Lightning mythic — 100-streak in a single run.
    if (this.streak >= 100 && this.game.achievements.unlock('mythic_lightning')) {
      this.game.ui.showAchievementToasts(['mythic_lightning']);
    }
    this._bumpTierFromStreak();
    this._updateHud();
    setTimeout(() => this._loadNextPuzzle(), 700);
  }

  onSkip() {
    if (!this.active) return;
    this.lives--;
    this.streak = 0;
    this._pureLogicCount = 0;
    this._updateHud();
    if (this.lives <= 0) {
      this.endRun(false);
    } else {
      this._loadNextPuzzle();
    }
  }

  noteHintUsed() {
    this._hintUsedThisPuzzle = true;
  }

  endRun(byUser) {
    if (!this.active) return;
    this.active = false;
    this._stopTimer();
    const elapsed = Math.floor((Date.now() - this.runStartMs) / 1000);
    let isNewBest = false;
    if (this.bestStreak > (this.best.bestStreak || 0)) { this.best.bestStreak = this.bestStreak; isNewBest = true; }
    if (this.totalSolved > (this.best.bestSolved || 0)) { this.best.bestSolved = this.totalSolved; isNewBest = true; }
    if (elapsed > 10 && (this.totalSolved >= (this.best.bestSolved || 0)) && (this.best.bestTimeSec === 0 || this.totalSolved > 0)) {
      this.best.bestTimeSec = elapsed;
    }
    this._saveBest();
    this._hideHud();
    this.game.isChallengeMode = false;
    this.game.ui.showInfiniteSummary({
      streak: this.bestStreak,
      solved: this.totalSolved,
      timeSec: elapsed,
      tier: this.tier,
      isNewBest: isNewBest,
      byUser: !!byUser,
    });
  }

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => this._updateHud(), 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  // Day 79 Code Cleanup: removed _showHud() (never called — _updateHud handles display).

  _hideHud() {
    const hud = document.getElementById('infinite-hud');
    if (hud) hud.style.display = 'none';
  }

  _updateHud() {
    const hud = document.getElementById('infinite-hud');
    if (!hud) return;
    if (this.active) {
      hud.style.display = 'flex';
      const livesEl = document.getElementById('ihud-lives');
      const streakEl = document.getElementById('ihud-streak');
      const totalEl = document.getElementById('ihud-total');
      const timeEl = document.getElementById('ihud-time');
      const tierEl = document.getElementById('ihud-tier');
      if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 3 - this.lives));
      if (streakEl) streakEl.textContent = '🔥 ' + this.streak;
      if (totalEl) totalEl.textContent = '🧮 ' + this.totalSolved;
      if (timeEl) {
        const sec = Math.floor((Date.now() - this.runStartMs) / 1000);
        const mm = Math.floor(sec / 60);
        const ss = String(sec % 60).padStart(2, '0');
        timeEl.textContent = '⏱ ' + mm + ':' + ss;
      }
      if (tierEl) tierEl.textContent = INFINITE_TIER_LABELS[this.tier] || 'Novice';
    } else {
      hud.style.display = 'none';
    }
  }
}


// ── Day 72: Weekly Tournament Mode ──
// Seeded weekly puzzle (year-week) wrapper around generateWeeklyPuzzle.
// Single-shot scoring, pseudo-leaderboard (50), 8-week archive.
const TOURNAMENT_KEY = 'signal-circuit-tournament-v1';

class WeeklyTournament {
  constructor(game) {
    this.game = game;
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(TOURNAMENT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return {
          byWeek: d.byWeek || {},
          totalAttempts: d.totalAttempts || 0,
          podiums: d.podiums || 0,
          wins: d.wins || 0,
        };
      }
    } catch (e) {}
    return { byWeek: {}, totalAttempts: 0, podiums: 0, wins: 0 };
  }

  _save() {
    try { localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(this.data)); } catch (e) {}
  }

  // ISO-week key for a given Date — matches generateWeeklyPuzzle's week math.
  getWeekKey(date) {
    const d = date || new Date();
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
    const ww = String(weekNum).padStart(2, '0');
    return `${d.getFullYear()}-W${ww}`;
  }

  getCurrentWeekInfo() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
    return { year: now.getFullYear(), isoWeek: weekNum, key: this.getWeekKey(now) };
  }

  // Resolve a Date for the Monday of a given (year, weekNum) — used to recover archive puzzles.
  _dateForWeek(year, weekNum) {
    // Inverse of generateWeeklyPuzzle's formula: pick mid-week (Wed) to land in the same ISO bucket.
    const oneJan = new Date(year, 0, 1);
    const offsetDays = (weekNum - 1) * 7 - oneJan.getDay() + 3;
    const d = new Date(year, 0, 1 + Math.max(0, offsetDays));
    return d;
  }

  // Build the puzzle object for a given week. Defaults to current week.
  buildPuzzle(weekKey) {
    const targetKey = weekKey || this.getCurrentWeekInfo().key;
    let puzzle;
    if (!weekKey || targetKey === this.getCurrentWeekInfo().key) {
      puzzle = generateWeeklyPuzzle();
    } else {
      // Reproduce a past week deterministically by stubbing Date temporarily.
      const m = /^(\d{4})-W(\d{2})$/.exec(targetKey);
      if (!m) return generateWeeklyPuzzle();
      const year = parseInt(m[1], 10);
      const week = parseInt(m[2], 10);
      const stub = this._dateForWeek(year, week);
      const RealDate = Date;
      const FakeDate = function (...args) {
        if (args.length === 0) return new RealDate(stub.getTime());
        return new RealDate(...args);
      };
      FakeDate.prototype = RealDate.prototype;
      FakeDate.now = () => stub.getTime();
      try {
        // eslint-disable-next-line no-global-assign
        Date = FakeDate;
        puzzle = generateWeeklyPuzzle();
      } finally {
        // eslint-disable-next-line no-global-assign
        Date = RealDate;
      }
    }
    puzzle.id = `tournament-${targetKey}`;
    puzzle.weekKey = targetKey;
    puzzle.isWeekly = true;
    puzzle.isTournament = true;
    puzzle.isChallenge = false;
    puzzle.title = `\ud83c\udfc6 Tournament \u00b7 ${targetKey}`;
    return puzzle;
  }

  // Compute score: gates*100 + over-budget seconds. Lower wins.
  computeScore(gates, timeSec) {
    const overBudget = Math.max(0, timeSec - 60);
    return gates * 100 + overBudget;
  }

  // Seeded PRNG (matches DailyLeaderboard convention).
  _seededRand(seed) {
    let s = seed;
    return function rand() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  _seedFromKey(weekKey) {
    let h = 5381;
    for (let i = 0; i < weekKey.length; i++) h = ((h << 5) + h + weekKey.charCodeAt(i)) & 0x7fffffff;
    return h;
  }

  // Pseudo-leaderboard: 50 deterministic scores for the given week.
  getLeaderboard(weekKey) {
    const key = weekKey || this.getCurrentWeekInfo().key;
    const seed = this._seedFromKey(key) + 31337;
    const rand = this._seededRand(seed);
    const puzzle = this.buildPuzzle(key);
    const optimalGates = puzzle.optimalGates || 3;
    const usedNames = new Set();
    const scores = [];
    const NAMES = (typeof DAILY_LB_NAMES !== 'undefined') ? DAILY_LB_NAMES : ['Player'];
    for (let i = 0; i < 50; i++) {
      const r1 = rand();
      const r2 = rand();
      const normalish = (r1 + r2) / 2;
      const gateOffset = Math.round(normalish * 5);
      const gates = Math.max(optimalGates, optimalGates + gateOffset);
      const baseTime = 25 + Math.floor(rand() * 90);
      const gateTimePenalty = (gates - optimalGates) * Math.floor(8 + rand() * 12);
      const time = baseTime + gateTimePenalty;
      let nameIdx = Math.floor(rand() * NAMES.length);
      let name = NAMES[nameIdx];
      let probes = 0;
      while (usedNames.has(name) && probes < NAMES.length) {
        nameIdx = (nameIdx + 1) % NAMES.length;
        name = NAMES[nameIdx];
        probes++;
      }
      if (usedNames.has(name)) name = name + '_' + i;
      usedNames.add(name);
      scores.push({ name, gates, time, score: this.computeScore(gates, time), isPlayer: false });
    }
    scores.sort((a, b) => a.score - b.score);
    return scores;
  }

  // Combined board (player merged) for display.
  getCombinedBoard(weekKey) {
    const key = weekKey || this.getCurrentWeekInfo().key;
    const board = this.getLeaderboard(key).slice();
    const best = this.data.byWeek[key];
    if (best) {
      board.push({ name: best.name || 'You', gates: best.gates, time: best.time, score: best.score, isPlayer: true });
      board.sort((a, b) => a.score - b.score);
    }
    return board;
  }

  getRank(weekKey, score) {
    const board = this.getLeaderboard(weekKey || this.getCurrentWeekInfo().key);
    let rank = 1;
    for (const s of board) if (s.score < score) rank++;
    return rank;
  }

  getPercentile(weekKey, score) {
    const board = this.getLeaderboard(weekKey || this.getCurrentWeekInfo().key);
    const total = board.length + 1;
    let beat = 0;
    for (const s of board) if (s.score > score) beat++;
    return Math.round((beat / total) * 100);
  }

  getBest(weekKey) {
    const key = weekKey || this.getCurrentWeekInfo().key;
    return this.data.byWeek[key] || null;
  }

  // Last N completed weeks (oldest-first for display).
  getRecentWeeks(n) {
    const out = [];
    const cur = this.getCurrentWeekInfo();
    for (let i = 0; i < n; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const key = this.getWeekKey(d);
      out.push({ key, isCurrent: i === 0, best: this.data.byWeek[key] || null });
    }
    return out;
  }

  // Submit player's score for the current week. Best of week locks at midnight Sunday PT.
  // Returns { rank, percentile, isNewBest, score, podium, crowned, achievements }.
  submitScore(gateCount, timeSec, displayName) {
    const cur = this.getCurrentWeekInfo();
    const key = cur.key;
    const score = this.computeScore(gateCount, timeSec);
    const existing = this.data.byWeek[key];
    const isNewBest = !existing || score < existing.score;
    if (isNewBest) {
      this.data.byWeek[key] = {
        gates: gateCount,
        time: timeSec,
        score: score,
        name: displayName || 'You',
        attempted: true,
        ts: Date.now(),
      };
    } else if (existing) {
      existing.attempted = true;
    }
    this.data.totalAttempts = (this.data.totalAttempts || 0) + 1;
    const result = this.data.byWeek[key];
    const rank = this.getRank(key, result.score);
    const percentile = this.getPercentile(key, result.score);
    result.rank = rank;
    result.percentile = percentile;
    const podium = rank <= 3;
    const crowned = rank === 1;
    const achievements = [];
    if (podium) {
      this.data.podiums = (this.data.podiums || 0) + (existing && existing.podium ? 0 : 1);
      result.podium = true;
      if (this.game && this.game.achievements && this.game.achievements.unlock('tournament_podium')) {
        achievements.push('tournament_podium');
      }
    }
    if (crowned) {
      this.data.wins = (this.data.wins || 0) + (existing && existing.crowned ? 0 : 1);
      result.crowned = true;
      if (this.game && this.game.achievements && this.game.achievements.unlock('tournament_crowned')) {
        achievements.push('tournament_crowned');
      }
    }
    this._save();
    return { rank, percentile, isNewBest, score, podium, crowned, achievements,
             gates: gateCount, time: timeSec, weekKey: key };
  }

  // Launch the current week's tournament puzzle into gameplay.
  startCurrentWeek() {
    const level = this.buildPuzzle();
    const gs = this.game;
    gs.isChallengeMode = false;
    gs.isSandboxMode = false;
    gs.currentScreen = 'gameplay';
    gs.ui.showScreen('gameplay');
    gs.audio.startAmbient();
    gs.renderer.resize();
    gs.renderer.resetView();
    gs.loadChallengeLevel(level);
    setTimeout(() => gs.renderer.resize(), 60);
  }

  // Replay a past week (for archive). No score recorded.
  startArchiveWeek(weekKey) {
    const level = this.buildPuzzle(weekKey);
    level.isTournamentArchive = true; // Suppresses score submission
    const gs = this.game;
    gs.isChallengeMode = false;
    gs.isSandboxMode = false;
    gs.currentScreen = 'gameplay';
    gs.ui.showScreen('gameplay');
    gs.audio.startAmbient();
    gs.renderer.resize();
    gs.renderer.resetView();
    gs.loadChallengeLevel(level);
    setTimeout(() => gs.renderer.resize(), 60);
  }
}


// =====================================================================
// Day 83: Tournament Backend Adapter Shell
//
// A transport-shaped seam between gameplay completion and the
// WeeklyTournament class. Local mode preserves the existing deterministic
// pseudo-leaderboard. Remote mode is plumbed for a future Cloudflare
// Worker + KV backend, but never performs a network write today: it
// transparently falls back to the local adapter unless a Worker URL is
// explicitly configured AND a future revision flips on live mode.
// =====================================================================

const TOURNAMENT_BACKEND_LS_KEY = 'signal-circuit-tournament-backend';

class TournamentBackend {
  // Interface contract — subclasses must override.
  submitScore(/* gateCount, timeSec, displayName */) { throw new Error('TournamentBackend.submitScore not implemented'); }
  getLeaderboard(/* weekKey */)   { throw new Error('TournamentBackend.getLeaderboard not implemented'); }
  getCombinedBoard(/* weekKey */) { throw new Error('TournamentBackend.getCombinedBoard not implemented'); }
  getMode()    { return 'unknown'; }
  isLive()     { return false; }
  describe()   { return 'Tournament backend (unknown)'; }
}

class LocalTournamentAdapter extends TournamentBackend {
  constructor(weeklyTournament) {
    super();
    this.wt = weeklyTournament;
  }
  submitScore(gateCount, timeSec, displayName) {
    return this.wt.submitScore(gateCount, timeSec, displayName);
  }
  getLeaderboard(weekKey)   { return this.wt.getLeaderboard(weekKey); }
  getCombinedBoard(weekKey) { return this.wt.getCombinedBoard(weekKey); }
  getMode()  { return 'local'; }
  isLive()   { return false; }
  describe() { return '\ud83c\udfe0 Local leaderboard \u00b7 same puzzle, deterministic bots'; }
}

class RemoteTournamentAdapter extends TournamentBackend {
  // Worker-shaped skeleton. Holds config, but performs no external writes
  // until a workerUrl is configured AND a future revision wires up the
  // actual fetch path. Until then, every call gracefully falls back to
  // local so gameplay never blocks or shows a broken rank.
  constructor(weeklyTournament, config) {
    super();
    this.wt = weeklyTournament;
    this.config = config || {};
    this.local = new LocalTournamentAdapter(weeklyTournament);
  }
  _isConfigured() {
    return !!(this.config && typeof this.config.workerUrl === 'string' && this.config.workerUrl.length > 0);
  }
  submitScore(gateCount, timeSec, displayName) {
    // Cloud write path is intentionally not wired yet. Fall through.
    return this.local.submitScore(gateCount, timeSec, displayName);
  }
  getLeaderboard(weekKey)   { return this.local.getLeaderboard(weekKey); }
  getCombinedBoard(weekKey) { return this.local.getCombinedBoard(weekKey); }
  getMode()  { return this._isConfigured() ? 'remote-ready' : 'remote-ready'; }
  isLive()   { return false; }
  describe() {
    return this._isConfigured()
      ? '\ud83c\udf10 Cloud-ready \u00b7 Worker URL set, awaiting go-live'
      : '\ud83c\udf10 Cloud-ready \u00b7 local fallback active (no Worker configured)';
  }
}

function selectTournamentBackend(weeklyTournament) {
  // Detection order:
  //   1. window.__SC_TOURNAMENT_BACKEND__ = { mode, workerUrl? }
  //   2. localStorage('signal-circuit-tournament-backend') === 'remote'
  //   3. default 'local'
  let mode = null;
  let workerUrl = null;
  try {
    if (typeof window !== 'undefined' && window.__SC_TOURNAMENT_BACKEND__) {
      const cfg = window.__SC_TOURNAMENT_BACKEND__;
      if (cfg && typeof cfg.mode === 'string') mode = cfg.mode;
      if (cfg && typeof cfg.workerUrl === 'string') workerUrl = cfg.workerUrl;
    }
  } catch (e) {}
  try {
    if (!mode && typeof localStorage !== 'undefined') {
      const lsMode = localStorage.getItem(TOURNAMENT_BACKEND_LS_KEY);
      if (lsMode === 'remote' || lsMode === 'local') mode = lsMode;
    }
  } catch (e) {}
  if (mode === 'remote') {
    return new RemoteTournamentAdapter(weeklyTournament, { workerUrl });
  }
  return new LocalTournamentAdapter(weeklyTournament);
}

// Expose to global for QA harness + future tests. Safe in non-window envs.
try {
  if (typeof window !== 'undefined') {
    window.TournamentBackend = TournamentBackend;
    window.LocalTournamentAdapter = LocalTournamentAdapter;
    window.RemoteTournamentAdapter = RemoteTournamentAdapter;
    window.selectTournamentBackend = selectTournamentBackend;
  }
} catch (e) {}


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
    this.isMasteryMode = false; // Day 55
    this._currentMasteryId = null; // Day 55
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
    // Day 50: Adaptive Challenge Difficulty
    this.skillTracker = new SkillTracker(this);
    // Day 45: Gate Limit Challenge mode
    this.isGateLimitMode = false;
    this.gateBudget = 0;
    // Day 48: Keyboard-First Wiring Mode
    this._kbWiringMode = false;
    this._kbSelectedElement = null;
    this._kbWiring = false;
    this._kbWireSource = null;
    this._kbDestCandidates = [];
    this._kbDestIndex = -1;
    // Day 51: Replay Viewer state
    this._replayViewerActive = false;
    // Day 53: Sub-Circuit Abstraction
    this.subCircuits = new SubCircuitManager(this);
    this._replayViewer = null;
    // Day 56: Campaign Difficulty Mode
    this.difficultyMode = this._loadDifficultyMode();
    this._hardcoreFailCount = 0;
    // Day 68: Infinite Run
    this.infiniteRun = new InfiniteRunManager(this);
    // Day 72: Weekly Tournament
    this.weeklyTournament = new WeeklyTournament(this);
    // Day 83: Tournament backend adapter (local by default).
    this.tournamentBackend = selectTournamentBackend(this.weeklyTournament);
  }

  // Day 68: Infinite Mode entry points
  showInfiniteConfig() {
    this.ui.showScreen('infinite-pre');
    if (this.ui.renderInfinitePreScreen) this.ui.renderInfinitePreScreen();
  }

  startInfiniteRun(tier) {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('adaptive'));
    this.infiniteRun.startRun(tier);
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

  // ── Day 56: Campaign Difficulty Mode ──
  _loadDifficultyMode() {
    try {
      var saved = SafeStorage.getItem(DIFFICULTY_KEY);
      if (saved === 'relaxed' || saved === 'hardcore') return saved;
    } catch (e) {}
    return 'standard';
  }

  setDifficultyMode(mode) {
    if (mode === 'relaxed' || mode === 'hardcore' || mode === 'standard') {
      this.difficultyMode = mode;
      SafeStorage.setItem(DIFFICULTY_KEY, mode);
    }
  }

  isRelaxedMode() { return this.difficultyMode === 'relaxed'; }
  isHardcoreMode() { return this.difficultyMode === 'hardcore'; }

  spendHintToken() {
    if (this.hintTokens.tokens <= 0) return false;
    // Day 56: Relaxed mode = free hints, Hardcore mode = no hints
    if (this.isRelaxedMode()) return true;
    if (this.isHardcoreMode()) return false;
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
    // Day 51: Record IONode IDs at start for replay mapping
    this._replayIONodeIds = {
      inputs: this.inputNodes.map(n => n.id),
      outputs: this.outputNodes.map(n => n.id),
    };
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
        ioNodeIds: this._replayIONodeIds || null, // Day 51: for replay ID mapping
      };
      // Day 51 T9: LRU eviction — keep max 30 replays
      const keys = Object.keys(all);
      if (keys.length > 30) {
        keys.sort((a, b) => {
          const da = all[a].date || '';
          const db = all[b].date || '';
          return da.localeCompare(db);
        });
        while (Object.keys(all).length > 30) {
          const oldest = keys.shift();
          delete all[oldest];
        }
      }
      SafeStorage.setItem(REPLAY_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  getReplay(levelId) {
    try {
      const all = JSON.parse(SafeStorage.getItem(REPLAY_KEY) || '{}');
      return all[levelId] || null;
    } catch (e) { return null; }
  }

  // ── Day 51: Start Replay Viewer ──
  startReplayViewer(levelId) {
    const replay = this.getReplay(levelId);
    if (!replay) {
      this.ui.updateStatusBar('No replay data for this level');
      return;
    }
    // Load ghost overlay for the compare feature
    this._loadGhost(levelId);
    this._replayViewer = new ReplayViewer(this, replay, levelId);
    this._replayViewer.start();
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

  // Day 57: Double-tap gate context menu
  _showGateContextMenu(gate, touch) {
    const menu = document.getElementById('gate-context-menu');
    if (!menu) return;
    this.haptic(25);

    // Position near the touch point
    const x = Math.min(touch.clientX, window.innerWidth - 160);
    const y = Math.max(touch.clientY - 120, 10);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'flex';
    menu._targetGate = gate;

    // Wire up handlers (once)
    if (!menu._wired) {
      menu._wired = true;
      menu.addEventListener('click', (e) => {
        const btn = e.target.closest('.gate-ctx-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const g = menu._targetGate;
        if (!g) return;

        if (action === 'delete') {
          this.removeGate(g);
          this.haptic(30);
        } else if (action === 'duplicate') {
          const newGate = this.addGate(g.type, g.x + 40, g.y + 40);
          if (newGate) {
            this.selectedGate = newGate;
            this.haptic(15);
          }
        } else if (action === 'info') {
          const def = g.def || GateTypes[g.type];
          if (def) {
            this.ui.updateStatusBar(def.name + ': ' + (def.desc || g.type));
          }
        }
        menu.style.display = 'none';
        this.markDirty();
      });

      // Dismiss on outside tap
      document.addEventListener('touchstart', (e) => {
        if (!menu.contains(e.target) && menu.style.display !== 'none') {
          menu.style.display = 'none';
        }
      });
    }
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
    // Day 50: Calculate initial skill score
    if (this.skillTracker) this.skillTracker.calculate();
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
    // Day 64 (Prune cut #4): Skip placement test by default — the campaign
    // teaches the same content. Power users / QA can opt in via ?placement.
    let placementOptIn = false;
    try {
      placementOptIn = /[?&]placement(=1|=true)?(&|$)/.test(window.location.search);
    } catch (e) { /* no-op */ }

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

    // Day 78 Cut #5 (PRUNE Tier 1): Silent-default the difficulty modal.
    // Cold-start ceremony is a tax — Standard works for ~all first-time
    // players. Set Standard silently, persist the suggestion flag so we
    // never re-prompt, and surface a one-time toast pointing at Settings
    // for power users who want Relaxed/Hardcore. Settings → Difficulty
    // Mode still opens the full chooser (unchanged).
    if (!SafeStorage.getItem(DIFFICULTY_KEY)) {
      try { this.setDifficultyMode('standard'); } catch (e) {}
      setTimeout(() => {
        try {
          if (window._notifManager && typeof window._notifManager.showWelcomeToast === 'function') {
            window._notifManager.showWelcomeToast('🔧 Mode set to Standard. Change anytime in Settings.', 4500);
          }
        } catch (e) {}
      }, 1200);
    }

    if (!placementOptIn) {
      // Mark as done so we never auto-show; the campaign opens to Level 1.
      SafeStorage.setItem(PLACEMENT_KEY, 'true');
      return;
    }

    // Opt-in path — show after intro animation settles.
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

  // ── Day 76: Dev/Harden seeder ──
  // Synthetically marks levels 1..count as completed so Harden harnesses (and
  // local debugging) can reach tier-gated UI (Tournament, Random Challenge,
  // Adaptive, Infinite, Customize, Mastery Tree, …) without manually solving
  // 18 levels. Non-destructive on real play: levels already completed at >=
  // requested stars are left untouched; only synthetic entries are written.
  // Returns a summary object so test harnesses can assert.
  //
  // Usage from console / CDP:
  //   window.game.seedProgress(18);           // tier3 (Tournament unlocked)
  //   window.game.seedProgress(40, {stars:3, pureLogic:true});
  //   window.game.seedProgress(0, {clear:true}); // wipe back to cold-start
  seedProgress(count = 18, opts = {}) {
    const stars = Math.max(1, Math.min(3, opts.stars ?? 3));
    const pureLogic = !!opts.pureLogic;
    const hardcore = !!opts.hardcore;
    if (opts.clear) {
      this.resetProgress();
    }
    const max = Math.min(count, getLevelCount());
    let seeded = 0;
    const now = Date.now();
    for (let id = 1; id <= max; id++) {
      const level = getLevel(id);
      if (!level) continue;
      const existing = this.progress.levels[id];
      if (existing && existing.completed && (existing.stars || 0) >= stars) {
        continue; // already at or above requested mastery
      }
      const bestGates = level.optimalGates || 1;
      this.progress.levels[id] = {
        completed: true,
        stars,
        bestGateCount: existing?.bestGateCount ?? bestGates,
        bestTime: existing?.bestTime ?? 30,
        pureLogic: pureLogic || !!existing?.pureLogic,
        hardcoreCompleted: hardcore || !!existing?.hardcoreCompleted,
        lastPlayed: now,
        completedAt: existing?.completedAt || now,
        attempts: existing?.attempts || 1,
        _seeded: true, // marker — never written by real completion
      };
      seeded++;
    }
    this.saveProgress();
    // Re-render level select + re-evaluate tier gating if UI is mounted.
    if (this.ui && typeof this.ui.renderLevelSelect === 'function') {
      try { this.ui.renderLevelSelect(); } catch (e) {}
      try { this.ui.applyProgressGating?.(); } catch (e) {}
      try { this.ui.updateProgressBar?.(); } catch (e) {}
    }
    return { seeded, requested: count, max, stars, pureLogic, hardcore };
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
    // Day 71: Master Builder — 1000 lifetime gates.
    if (this.achievements && typeof this.achievements.checkMasterBuilder === 'function') {
      const newAchs = this.achievements.checkMasterBuilder(stats.totalGatesPlaced);
      if (newAchs && newAchs.length && this.ui) {
        this.ui.showAchievementToasts(newAchs);
      }
    }
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
      // Day 54: Track daily playtime
      const today = new Date().toISOString().slice(0, 10);
      if (!stats.dailyPlaytime) stats.dailyPlaytime = {};
      stats.dailyPlaytime[today] = (stats.dailyPlaytime[today] || 0) + elapsed;
      // Keep only last 30 days
      const keys = Object.keys(stats.dailyPlaytime).sort();
      while (keys.length > 30) { delete stats.dailyPlaytime[keys.shift()]; }
      this.saveLifetimeStats(stats);
    }
    this._sessionStart = Date.now(); // Reset for next interval
  }

  // Day 54: Session logging for stats dashboard
  _logSession() {
    if (!this._sessionStartTime) return;
    const elapsed = Math.floor((Date.now() - this._sessionStartTime) / 1000);
    if (elapsed < 5) return; // Skip trivially short sessions
    // Count levels played and stars earned this session
    const sessionLevels = this._sessionLevelsPlayed || 0;
    const sessionStars = this._sessionStarsEarned || 0;
    // Day 61 (Harden Day 4): Don't record sessions where no level was actually played —
    // fixes P2 "empty sessions in stats" bug. Page navigations no longer create rows.
    if (sessionLevels <= 0) {
      this._sessionLevelsPlayed = 0;
      this._sessionStarsEarned = 0;
      return;
    }
    const stats = this.loadLifetimeStats();
    if (!stats.sessions) stats.sessions = [];
    stats.sessions.push({
      date: Date.now(),
      levelsPlayed: sessionLevels,
      starsEarned: sessionStars,
      duration: elapsed
    });
    // Keep last 20 sessions
    while (stats.sessions.length > 20) stats.sessions.shift();
    this.saveLifetimeStats(stats);
    this._sessionLevelsPlayed = 0;
    this._sessionStarsEarned = 0;
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
    // Day 56: Hardcore mode has tighter star thresholds (goodGates reduced by 20%)
    const goodThreshold = this.isHardcoreMode() ? Math.max(level.optimalGates + 1, Math.floor(level.goodGates * 0.8)) : level.goodGates;
    if (gateCount <= level.optimalGates) stars = 3;
    else if (gateCount <= goodThreshold) stars = 2;
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
    // Day 69: capture first-time-completion flag BEFORE we mutate progress
    const isFirstCompletion = !existing || !existing.completed;
    const pureLogic = this.hintsUsed === 0; // T8: Pure Logic tracking

    if (!existing || stars > existing.stars) {
      this.progress.levels[levelId] = {
        completed: true,
        stars: stars,
        bestGateCount: existing ? Math.min(existing.bestGateCount || gateCount, gateCount) : gateCount,
        bestTime: existing ? Math.min(existing.bestTime || elapsed, elapsed) : elapsed,
        pureLogic: pureLogic || (existing && existing.pureLogic), // Once earned, keep it
        hardcoreCompleted: (this.isHardcoreMode() ? true : (existing && existing.hardcoreCompleted)), // Day 56
        lastPlayed: Date.now(), // Day 32 T10: track for spaced repetition
        completedAt: (existing && existing.completedAt) || Date.now(), // Day 54: first completion timestamp
        attempts: (existing && existing.attempts) || 0, // Day 54: preserve attempt count
      };
    } else {
      if (gateCount < (existing.bestGateCount || Infinity)) existing.bestGateCount = gateCount;
      if (elapsed < (existing.bestTime || Infinity)) existing.bestTime = elapsed;
      if (pureLogic) existing.pureLogic = true;
      if (this.isHardcoreMode()) existing.hardcoreCompleted = true; // Day 56
      existing.lastPlayed = Date.now(); // Day 32 T10
      if (!existing.completedAt) existing.completedAt = Date.now(); // Day 54: backfill
    }

    // Clear bookmark if it was bookmarked
    if (this.progress.levels[levelId].bookmarked) {
      delete this.progress.levels[levelId].bookmarked;
    }

    this.saveProgress();
    // Day 54: Track session-level stats
    this._sessionLevelsPlayed = (this._sessionLevelsPlayed || 0) + 1;
    this._sessionStarsEarned = (this._sessionStarsEarned || 0) + stars;
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

    // Day 69: Mobile install onramp — first-time L1/L2/L3 triggers welcome toast,
    // and L3 surfaces the branded install modal at peak intent.
    if (isFirstCompletion && window._notifManager && typeof window._notifManager.onLevelCompleted === 'function') {
      try { window._notifManager.onLevelCompleted(levelId); } catch (e) {}
    }

    // Day 70: Lab Bench / Blueprint Mode tracking on success.
    if (level.isLabBench && this._lab) {
      this._lab.cleared = true;
      const wasFirstTry = (this._lab.attempts === 1 && !this._lab.firstTryLocked);
      if (wasFirstTry && this.achievements && typeof this.achievements.trackBlueprintFirstTry === 'function') {
        const newFTAchs = this.achievements.trackBlueprintFirstTry(levelId);
        if (newFTAchs && newFTAchs.length && this.ui && this.ui.showAchievementToasts) {
          this.ui.showAchievementToasts(newFTAchs);
        }
      }
      if (this.ui && this.ui.updateLabHud) this.ui.updateLabHud();
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
    this.isMasteryMode = false; // Day 55: Reset mastery mode
    this._currentMasteryId = null;
    this.isGateLimitMode = false; // Day 45: Reset gate limit mode
    this.gateBudget = 0;
    // Day 48: Reset KB wiring state (but preserve mode preference)
    this._kbResetOnLevelChange();
    // Day 61 (Harden Day 4): Defensive Blitz/Speedrun HUD cleanup — fixes P2 blitz-info persistence
    if (this.blitzMode || this.blitzTimer) {
      if (this.blitzTimer) { clearInterval(this.blitzTimer); this.blitzTimer = null; }
      this.blitzMode = false;
      const _bh = document.getElementById('blitz-hud');
      if (_bh) _bh.style.display = 'none';
    }
    // Day 74 (Harden Day 2 — Cycle 2): Defensive Speedrun HUD cleanup — fixes P2 speedrun-hud persistence
    // The Day 61 comment claimed Speedrun coverage but only Blitz was wired. Sibling fix lands here.
    if (this.speedrunMode || this.speedrunTimer) {
      if (this.speedrunTimer) { clearInterval(this.speedrunTimer); this.speedrunTimer = null; }
      this.speedrunMode = false;
      this.speedrunStart = null;
      const _sh = document.getElementById('speedrun-hud');
      if (_sh) _sh.style.display = 'none';
    }
    this.stopTimer();
    this.trackPlaytimeEnd();
    // Day 54: Log session entry
    this._logSession();
    this.audio.stopAmbient();
    // Day 38: Clean up tutorial on level exit
    if (this.tutorial) { this.tutorial.destroy(); this.tutorial = null; }
    this.ui.renderLevelSelect();
    this.ui.updateProgressBar(this.progress);
    this.ui.updateDailyButtonBadge(); // Day 44: Update daily rank badge
    if (this.ui.updateAdaptiveButtonBadge) this.ui.updateAdaptiveButtonBadge(); // Day 50
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


  // Day 50: Adaptive Challenge
  startAdaptiveChallenge() {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('adaptive'));
    // Recalculate skill before generating
    this.skillTracker.calculate();
    const level = generateAdaptiveChallenge(this.skillTracker.score);
    this.currentScreen = 'gameplay';
    this.ui.showScreen('gameplay');
    this.audio.startAmbient();
    this.renderer.resize();
    this.renderer.resetView();
    this.loadChallengeLevel(level);
    setTimeout(() => this.renderer.resize(), 100);
  }

  startPushMyLimits() {
    this.isChallengeMode = true;
    this.isSandboxMode = false;
    this.ui.showAchievementToasts(this.achievements.trackModeExplored('adaptive'));
    this.skillTracker.calculate();
    const level = generatePushMyLimits(this.skillTracker.score);
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
      // Day 56: Hardcore mode has no hints
      if (this.isHardcoreMode()) { this.ui.updateStatusBar("⚡ Hardcore mode — no hints available"); this.audio.playFail(); return; }

      // Day 31: Hint token economy
      if (!this.spendHintToken()) {
        this.ui.updateStatusBar('💡 No hint tokens! Earn more from challenges and achievements.');
        this.audio.playFail();
        return;
      }

      this.hintsUsed++;
      // Day 68: Mark hint used for Infinite Run pure-logic streak
      if (this.infiniteRun && this.infiniteRun.active) this.infiniteRun.noteHintUsed();
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
    // Day 56: Hardcore mode never shows skip button
    if (this.isHardcoreMode()) return;
    this.skipVisible = true;
    document.getElementById('skip-btn').style.display = '';
  }

  resetHintState() {
    this.hintsUsed = 0;
    this.maxHintPenalty = 0;
    this.skipVisible = false;
    this.activeHintHighlights = null;
    this.levelStartTime = Date.now();
    this._hardcoreFailCount = 0; // Day 56: Reset fail count per level

    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('hint-display').style.display = 'none';

    // Day 56: Mode-specific hint button behavior
    if (this.isHardcoreMode()) {
      document.getElementById('hint-btn').style.display = 'none';
    } else {
      document.getElementById('hint-btn').style.display = '';
      if (this.isRelaxedMode()) {
        document.getElementById('hint-btn').textContent = '\ud83d\udca1 Hint (Free)';
      } else if (this.ui) {
        this.ui.updateHintButton(this.hintTokens.tokens);
      }
    }

    // Day 56: Relaxed mode shows skip immediately
    if (this.isRelaxedMode()) {
      this.showSkipButton();
    }

    // Show skip after 60 seconds (standard mode)
    if (this._skipTimer) clearTimeout(this._skipTimer);
    if (!this.isRelaxedMode() && !this.isHardcoreMode()) {
      this._skipTimer = setTimeout(() => {
        if (this.currentScreen === 'gameplay' && !this.isChallengeMode && !this.isSandboxMode) {
          this.showSkipButton();
        }
      }, 60000);
    }
  }

  startTimer() {
    this.timerStart = Date.now();
    this.timerRunning = true;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      // Hide timer during campaign play, show in challenge mode
      // Day 56: Hardcore always shows timer, Relaxed always hides it
      if (this.isHardcoreMode()) {
        timerEl.style.display = '';
      } else if (this.isRelaxedMode()) {
        timerEl.style.display = 'none';
      } else {
        timerEl.style.display = (this.isChallengeMode || this.isSandboxMode) ? '' : 'none';
      }
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
    // Day 51: Block user-initiated gate placement during replay
    if (this._replayViewerActive && !skipUndo) return null;
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
    const displayName = (GateTypes[type] && GateTypes[type].fullName) || type;
    this.ui.updateStatusBar(`Placed ${displayName} gate`);
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
    this._kbResetOnLevelChange(); // Day 48: Reset KB wiring state on level change
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

    // Day 70: Initialize Lab Bench / Blueprint mode state for this level.
    this._initLabState();
    this.ui.updateLabHud();
    this.ui.maybeShowLabTutorial();

    this.markDirty();
  }

  // Day 70: Lab Bench / Blueprint Mode helpers
  _isLabBench() {
    return !!(this.currentLevel && this.currentLevel.isLabBench && !this.isChallengeMode && !this.isSandboxMode);
  }

  _initLabState() {
    this._lab = {
      attempts: 0,
      maxAttempts: 3,
      exhausted: false,
      firstTryLocked: false, // becomes true after any failed submit OR a Reset Lab
      cleared: false,
    };
  }

  // Returns true if the run should proceed; false if exhausted/blocked.
  _consumeLabAttempt() {
    if (!this._isLabBench()) return true;
    if (!this._lab) this._initLabState();
    if (this._lab.exhausted || this._lab.cleared) return false;
    this._lab.attempts++;
    if (this.achievements && typeof this.achievements.trackBlueprintSubmit === 'function') {
      this.achievements.trackBlueprintSubmit();
    }
    if (this._lab.attempts >= this._lab.maxAttempts) {
      this._lab.exhausted = true;
    }
    this.ui.updateLabHud();
    return true;
  }

  resetLab() {
    if (!this._isLabBench()) return;
    if (!this._lab) this._initLabState();
    this._lab.attempts = 0;
    this._lab.exhausted = false;
    this._lab.firstTryLocked = true; // resetting forfeits the first-try achievement chase
    this.ui.updateLabHud();
    this.ui.updateResultDisplay('idle', '🔬 Lab reset — 3 fresh tries. Take another look at the truth table.');
    this.ui.updateStatusBar('Lab Bench: 3 fresh submissions. First-try lock retained for this attempt cycle.');
    this.audio.playClick();
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
    // Day 76 — Re-entry contract: while a simulation animation is in flight
    // (`isAnimating === true`), additional `runSimulation()` invocations are
    // no-ops (early return). After completion the flag is cleared in the
    // `finally` block, so subsequent clicks always start a *fresh* sim — there
    // is no debounce beyond "one in flight at a time". RUN-spam is therefore
    // idempotent at the simulation layer; any future feature that depends on
    // rate-limiting (e.g. submission throttling) must add its own guard.
    if (this.isAnimating) return;

    // Day 70: Lab Bench gate — consume an attempt before any animation cost.
    if (this._isLabBench()) {
      if (!this._consumeLabAttempt()) {
        this.audio.playClick();
        this.ui.updateResultDisplay('idle', '🔬 Lab tries exhausted — click 🔬 Reset Lab to restore.');
        this.ui.updateStatusBar('Lab Bench: 3/3 submissions used. Reset to retry.');
        return;
      }
    }

    this.isAnimating = true;

    // Day 54: Track attempt count per level
    if (this.currentLevel && !this.isSandboxMode) {
      const lvlId = this.currentLevel.id;
      if (!this.progress.levels[lvlId]) this.progress.levels[lvlId] = {};
      this.progress.levels[lvlId].attempts = (this.progress.levels[lvlId].attempts || 0) + 1;
      this.saveProgress();
    }

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

            if (this.infiniteRun && this.infiniteRun.active && this.currentLevel.isInfinite) {
              // Day 68: Infinite Run — intercept and continue
              this.audio.playSuccess(2);
              this.haptic([30, 50, 30, 50, 50]);
              this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates — Streak ${this.infiniteRun.streak + 1}`);
              this.ui.updateStatusBar(`Infinite · Streak ${this.infiniteRun.streak + 1} · ${gateCount} gates`);
              this.ui.startCelebration(1, { mode: 'challenge' });
              this.infiniteRun.onSolve();
              return;
            }
            if (this.currentLevel && this.currentLevel.isTournament) {
              // Day 72: Weekly Tournament — single-shot scoring + leaderboard
              const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 60;
              this.audio.playSuccess(2);
              this.haptic([30, 50, 30, 50, 50]);
              this.ui.startCelebration(2, { mode: 'challenge' });
              if (this.currentLevel.isTournamentArchive) {
                this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates · Archive replay (no score)`);
                this.ui.updateStatusBar(`Archive week ${this.currentLevel.weekKey} — replayed in ${elapsed}s`);
              } else {
                // Day 83: route through tournament backend adapter (local by default).
                const submission = (this.tournamentBackend || this.weeklyTournament).submitScore(
                  gateCount, elapsed,
                  (this.dailyLeaderboard && this.dailyLeaderboard.getDisplayName) ? this.dailyLeaderboard.getDisplayName() : 'You'
                );
                this.ui.updateResultDisplay('pass',
                  `✓ SOLVED! ${gateCount} gates · ${elapsed}s · score ${submission.score}`);
                this.ui.updateStatusBar(
                  `🏆 Tournament rank #${submission.rank} (top ${100 - submission.percentile}%) — ${submission.isNewBest ? 'new personal best!' : 'best stands'}`);
                if (submission.achievements && submission.achievements.length) {
                  this.ui.showAchievementToasts(submission.achievements);
                }
                if (this.ui.showTournamentResult) this.ui.showTournamentResult(submission, this.currentLevel.weekKey);
              }
              return;
            }
            if (this.isChallengeMode && this.currentLevel.isChallenge) {
              // Challenge mode completion
              this.addLeaderboardEntry(
                this.currentLevel.difficultyKey,
                gateCount,
                this.currentLevel.difficulty
              );
              this.audio.playSuccess(2);
              this.haptic([30, 50, 30, 50, 50]); // #98: celebration pattern
              // Day 49: Track community level completion
              if (this.currentLevel && this.currentLevel.isCommunityLevel) {
                try {
                  const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
                  if (!cc.includes(this.currentLevel.id)) {
                    cc.push(this.currentLevel.id);
                    localStorage.setItem('communityCompleted', JSON.stringify(cc));
                  }
                } catch(e) {}
              }
              this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
              this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
              this.ui.showChallengeResult(gateCount, this.currentLevel);
              this.ui.startCelebration(2, { mode: 'challenge' });
              // Track challenge achievements + earn hint token
              const chAchs = this.achievements.trackChallengeComplete();
              this.ui.showAchievementToasts(chAchs);
              // Day 71: rare-tier check (Community Champion etc.) for community challenge solves.
              if (this.currentLevel && this.currentLevel.isCommunityLevel) {
                const rareAchs = this.achievements.checkRareAchievements(this);
                if (rareAchs.length) this.ui.showAchievementToasts(rareAchs);
              }
              this.earnHintToken('challenge complete');
              // Day 50: Track adaptive challenge result
              if (this.currentLevel && this.currentLevel.isAdaptive) {
                const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
                this.skillTracker.recordResult(gateCount, elapsed, this.hintsUsed, this.currentLevel.optimalGates);
              }

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
              // Day 49: Track community level completion
              if (this.currentLevel && this.currentLevel.isCommunityLevel) {
                try {
                  const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
                  if (!cc.includes(this.currentLevel.id)) {
                    cc.push(this.currentLevel.id);
                    localStorage.setItem('communityCompleted', JSON.stringify(cc));
                  }
                } catch(e) {}
              }
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

              // Day 56: Check Hardcore Completer achievement
              if (this.isHardcoreMode()) {
                const allLevels = typeof LEVELS !== 'undefined' ? LEVELS : [];
                const allHardcore = allLevels.length > 0 && allLevels.every(l => {
                  const p = this.progress.levels[l.id];
                  return p && p.hardcoreCompleted;
                });
                if (allHardcore && this.achievements.unlock('hardcore_completer')) {
                  newAchs.push('hardcore_completer');
                }
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
              // Day 56: Mode-specific failure messages
              if (this.isRelaxedMode()) {
                this.ui.updateResultDisplay('almost', `Almost there! Just ${failCount} row${failCount > 1 ? 's' : ''} to go — you've got this! 💪`);
                this.ui.updateStatusBar(`You're so close! Try tweaking the circuit near row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
              } else {
                this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
                this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
              }
              if (this.isHardcoreMode()) { this._hardcoreFailCount++; this.ui.updateStatusBar(`Attempt ${this._hardcoreFailCount} — ${failCount} row${failCount > 1 ? 's' : ''} wrong`); }
            } else {
              this.audio.playFail();
              this._shakeScreen(shakeIntensity);
              this.haptic(80); // #98: long buzz for failure
              if (this.isRelaxedMode()) {
                this.ui.updateResultDisplay('fail', `${passCount}/${total} rows correct — keep going! 🔧`);
                this.ui.updateStatusBar('Not quite yet, but every attempt teaches you something!');
              } else {
                this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
                this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
              }
              if (this.isHardcoreMode()) { this._hardcoreFailCount++; this.ui.updateStatusBar(`Attempt ${this._hardcoreFailCount} — ${total - passCount} rows wrong`); }
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
    if (this._replayViewerActive) return; // Day 51: Block during replay
    if (this.isAnimating) return;

    // Day 70: Lab Bench: Quick Test is hidden in lab mode, but if it's invoked via
    // a keyboard shortcut, route it through the same submit-gate as RUN.
    if (this._isLabBench()) {
      if (!this._consumeLabAttempt()) {
        this.audio.playClick();
        this.ui.updateResultDisplay('idle', '🔬 Lab tries exhausted — click 🔬 Reset Lab to restore.');
        this.ui.updateStatusBar('Lab Bench: 3/3 submissions used. Reset to retry.');
        return;
      }
    }

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

      if (this.infiniteRun && this.infiniteRun.active && this.currentLevel.isInfinite) {
        // Day 68: Infinite Run — intercept Quick Test solve
        this.audio.playSuccess(2);
        this.haptic([30, 50, 30, 50, 50]);
        this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates — Streak ${this.infiniteRun.streak + 1}`);
        this.ui.updateStatusBar(`Infinite · Streak ${this.infiniteRun.streak + 1} · ${gateCount} gates`);
        this.ui.startCelebration(1, { mode: 'challenge' });
        this.infiniteRun.onSolve();
        return;
      }
      if (this.currentLevel && this.currentLevel.isTournament) {
        // Day 72: Weekly Tournament — Quick Test routes through same scoring path
        const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 60;
        this.audio.playSuccess(2);
        this.haptic([30, 50, 30, 50, 50]);
        this.ui.startCelebration(2, { mode: 'challenge' });
        if (this.currentLevel.isTournamentArchive) {
          this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates · Archive replay (no score)`);
          this.ui.updateStatusBar(`Archive week ${this.currentLevel.weekKey} — replayed in ${elapsed}s`);
        } else {
          // Day 83: route through tournament backend adapter (local by default).
          const submission = (this.tournamentBackend || this.weeklyTournament).submitScore(
            gateCount, elapsed,
            (this.dailyLeaderboard && this.dailyLeaderboard.getDisplayName) ? this.dailyLeaderboard.getDisplayName() : 'You'
          );
          this.ui.updateResultDisplay('pass',
            `✓ SOLVED! ${gateCount} gates · ${elapsed}s · score ${submission.score}`);
          this.ui.updateStatusBar(
            `🏆 Tournament rank #${submission.rank} (top ${100 - submission.percentile}%) — ${submission.isNewBest ? 'new personal best!' : 'best stands'}`);
          if (submission.achievements && submission.achievements.length) {
            this.ui.showAchievementToasts(submission.achievements);
          }
          if (this.ui.showTournamentResult) this.ui.showTournamentResult(submission, this.currentLevel.weekKey);
        }
        return;
      }
      if (this.isChallengeMode && this.currentLevel.isChallenge) {
        this.addLeaderboardEntry(this.currentLevel.difficultyKey, gateCount, this.currentLevel.difficulty);
        this.audio.playSuccess(2);
        this.haptic([30, 50, 30, 50, 50]); // #98
        this.ui.updateResultDisplay('pass', `✓ SOLVED! ${gateCount} gates`);
        this.ui.updateStatusBar(`Challenge complete with ${gateCount} gates!`);
        this.ui.showChallengeResult(gateCount, this.currentLevel);
        this.ui.startCelebration(2, { mode: 'challenge' });
        // Day 71: rare-tier check (Community Champion etc.) for community Quick-Test solves.
        if (this.currentLevel && this.currentLevel.isCommunityLevel) {
          try {
            const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
            if (!cc.includes(this.currentLevel.id)) {
              cc.push(this.currentLevel.id);
              localStorage.setItem('communityCompleted', JSON.stringify(cc));
            }
          } catch(e) {}
          const rareAchs = this.achievements.checkRareAchievements(this);
          if (rareAchs.length) this.ui.showAchievementToasts(rareAchs);
        }
        this.earnHintToken('challenge complete');
        // Day 50: Track adaptive challenge result
        if (this.currentLevel && this.currentLevel.isAdaptive) {
          const elapsed = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 999;
          this.skillTracker.recordResult(gateCount, elapsed, this.hintsUsed, this.currentLevel.optimalGates);
        }
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
        // Day 49: Track community level completion
        if (this.currentLevel && this.currentLevel.isCommunityLevel) {
          try {
            const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
            if (!cc.includes(this.currentLevel.id)) {
              cc.push(this.currentLevel.id);
              localStorage.setItem('communityCompleted', JSON.stringify(cc));
            }
          } catch(e) {}
        }
        // Day 55: Track mastery challenge completion
        if (this.isMasteryMode && this._currentMasteryId && this.ui) {
          this.ui.completeMasteryChallenge(this._currentMasteryId, gateCount, stars);
        }
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

        // Day 56: Check Hardcore Completer achievement
        if (this.isHardcoreMode()) {
          const allLevelsQT = typeof LEVELS !== 'undefined' ? LEVELS : [];
          const allHardcoreQT = allLevelsQT.length > 0 && allLevelsQT.every(l => {
            const p = this.progress.levels[l.id];
            return p && p.hardcoreCompleted;
          });
          if (allHardcoreQT && this.achievements.unlock('hardcore_completer')) {
            newAchs.push('hardcore_completer');
          }
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
        // Day 56: Mode-specific failure messages
        if (this.isRelaxedMode()) {
          this.ui.updateResultDisplay('almost', `Almost there! Just ${failCount} row${failCount > 1 ? 's' : ''} to go — you've got this! 💪`);
          this.ui.updateStatusBar(`You're so close! Try tweaking near row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
        } else {
          this.ui.updateResultDisplay('almost', `Almost! ${failCount === 1 ? 'Just 1 row' : `Just ${failCount} rows`} off`);
          this.ui.updateStatusBar(`So close! Check row${failCount > 1 ? 's' : ''} ${failingRows.join(', ')}`);
        }
        if (this.isHardcoreMode()) { this._hardcoreFailCount++; this.ui.updateStatusBar(`Attempt ${this._hardcoreFailCount} — ${failCount} row${failCount > 1 ? 's' : ''} wrong`); }
      } else {
        this.audio.playFail();
        this._shakeScreen(shakeIntensity);
        this.haptic(80); // #98
        if (this.isRelaxedMode()) {
          this.ui.updateResultDisplay('fail', `${passCount}/${total} rows correct — keep going! 🔧`);
          this.ui.updateStatusBar('Not quite yet, but every attempt teaches!');
        } else {
          this.ui.updateResultDisplay('fail', `✗ ${passCount}/${total} rows correct`);
          this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
        }
        if (this.isHardcoreMode()) { this._hardcoreFailCount++; this.ui.updateStatusBar(`Attempt ${this._hardcoreFailCount} — ${total - passCount} rows wrong`); }
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

    // Day 57: Double-tap gate context menu tracking
    let lastGateTapTime = 0;
    let lastGateTapId = null;

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
      if (this._replayViewerActive) return; // Day 51: Block interaction during replay

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

      // Gate tap-to-connect OR double-tap context menu (Day 57)
      if (isDraggingGate && dragGate && !touchMoved) {
        const now = Date.now();
        if (lastGateTapId === dragGate.id && now - lastGateTapTime < 350) {
          // Double-tap detected — show context menu
          lastGateTapTime = 0;
          lastGateTapId = null;
          this._showGateContextMenu(dragGate, e.changedTouches[0]);
        } else if (this.tapConnectSource !== null) {
          this._executeTapConnect(dragGate.id);
          lastGateTapTime = 0;
          lastGateTapId = null;
        } else {
          lastGateTapTime = now;
          lastGateTapId = dragGate.id;
          this._setTapConnectSource(dragGate.id);
        }
      }

      isDraggingGate = false;
      dragGate = null;
    }, { passive: false, signal });

    // ── Mouse support ──
    canvas.addEventListener('mousedown', (e) => {
      if (this.isAnimating) return;
      if (this._replayViewerActive) return; // Day 51: Block interaction during replay
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

      // Enter: Normal run (skip in KB wiring mode — handled below)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !this._kbWiringMode) {
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

      // Tab: Cycle through placed gates (skip in KB wiring mode — handled below)
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !this._kbWiringMode) {
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

      // Day 48: K key toggles Keyboard Wiring mode
      if (e.key === 'k' || e.key === 'K') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          this._toggleKbWiringMode();
        }
      }

      // Day 48: KB wiring mode — Tab cycles elements, Enter connects, Escape cancels
      if (this._kbWiringMode) {
        if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this._kbCycleElement(e.shiftKey ? -1 : 1);
          return; // prevent default Tab handler above
        }
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this._kbEnterAction();
          return; // prevent RUN
        }
        if (e.key === 'Escape') {
          if (this._kbWiring) {
            e.preventDefault();
            this._kbCancelWire();
          }
        }
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

  // ── Day 48: Keyboard-First Wiring Mode Methods ──

  _toggleKbWiringMode() {
    this._kbWiringMode = !this._kbWiringMode;
    if (this._kbWiringMode) {
      this._kbSelectedElement = null;
      this._kbWiring = false;
      this._kbWireSource = null;
      this._kbDestCandidates = [];
      this._kbDestIndex = -1;
      this.ui.updateStatusBar('⌨ Keyboard Wiring: ON — Tab to select, Enter to wire');
      this.audio.playClick();
      // Update toolbox button
      const btn = document.getElementById('kb-wiring-btn');
      if (btn) btn.classList.add('active');
    } else {
      this._kbSelectedElement = null;
      this._kbWiring = false;
      this._kbWireSource = null;
      this._kbDestCandidates = [];
      this._kbDestIndex = -1;
      this.wireManager.cancelDrawing();
      this.ui.updateStatusBar('Keyboard Wiring: OFF');
      const btn = document.getElementById('kb-wiring-btn');
      if (btn) btn.classList.remove('active');
    }
    this.markDirty();
  }

  _kbGetAllElements() {
    // Returns elements in order: input nodes → placed gates → output nodes
    const elements = [];
    for (const node of this.inputNodes) elements.push(node);
    for (const gate of this.gates) elements.push(gate);
    for (const node of this.outputNodes) elements.push(node);
    return elements;
  }

  _kbElementLabel(el) {
    if (!el) return '?';
    if (el instanceof IONode) return el.label + ' (' + el.type + ')';
    if (el instanceof Gate) return el.type + ' gate #' + el.id;
    return 'Element #' + el.id;
  }

  _kbCycleElement(direction) {
    if (this._kbWiring) {
      // Cycling through destination candidates
      if (this._kbDestCandidates.length === 0) {
        this.ui.updateStatusBar('⚠ No compatible destinations available');
        return;
      }
      this._kbDestIndex = (this._kbDestIndex + direction + this._kbDestCandidates.length) % this._kbDestCandidates.length;
      const dest = this._kbDestCandidates[this._kbDestIndex];
      this._kbSelectedElement = dest.element;
      this.selectedGate = (dest.element instanceof Gate) ? dest.element : null;
      this.ui.updateStatusBar('Wiring to: ' + this._kbElementLabel(dest.element) + ' — Enter to connect, Esc to cancel');
      this.audio.playClick();
      this.markDirty();
    } else {
      // Cycling through all elements
      const all = this._kbGetAllElements();
      if (all.length === 0) return;
      let idx = this._kbSelectedElement ? all.indexOf(this._kbSelectedElement) : -1;
      idx = (idx + direction + all.length) % all.length;
      this._kbSelectedElement = all[idx];
      this.selectedGate = (this._kbSelectedElement instanceof Gate) ? this._kbSelectedElement : null;
      this.wireManager.selectedWire = null;
      this.ui.updateStatusBar('Selected: ' + this._kbElementLabel(this._kbSelectedElement) + ' — Enter to start wire');
      this.audio.playClick();
      this.markDirty();
    }
  }

  _kbEnterAction() {
    if (this._kbWiring) {
      // Complete wire to currently selected destination
      if (this._kbDestIndex < 0 || this._kbDestIndex >= this._kbDestCandidates.length) {
        this.ui.updateStatusBar('⚠ No destination selected — Tab to pick one');
        return;
      }
      const dest = this._kbDestCandidates[this._kbDestIndex];
      const wire = this.wireManager.finishDrawing(dest.gateId, dest.pinIndex, dest.pinType, dest.x, dest.y);
      if (wire) {
        this._startTimerIfPending();
        this.audio.playWireConnect(dest.x);
        this.renderer.spawnSparks(dest.x, dest.y);
        this.undoManager.push({
          type: 'addWire',
          wireId: wire.id,
          fromGateId: wire.fromGateId,
          fromPinIndex: wire.fromPinIndex,
          toGateId: wire.toGateId,
          toPinIndex: wire.toPinIndex,
        });
        if (this.detectCycle()) {
          this.ui.updateStatusBar('⚠ Cycle detected — circuit may not simulate correctly');
          wire._cycleWarning = true;
        } else {
          this.ui.updateStatusBar('✓ Wire connected! Tab to select next element');
        }
        const wireAchs = this.achievements.trackFirstWire();
        this.ui.showAchievementToasts(wireAchs);
      }
      // Reset wiring state but stay in KB mode
      this._kbWiring = false;
      this._kbWireSource = null;
      this._kbDestCandidates = [];
      this._kbDestIndex = -1;
      this._kbSelectedElement = null;
      this.markDirty();
      this._autoSave();
    } else {
      // Start wire from selected element
      if (!this._kbSelectedElement) {
        this.ui.updateStatusBar('⚠ No element selected — Tab to pick one first');
        return;
      }
      const el = this._kbSelectedElement;
      const pin = this._kbGetBestOutputPin(el);
      if (!pin) {
        this.ui.updateStatusBar('⚠ No available output pin on ' + this._kbElementLabel(el));
        return;
      }
      // Start wire drawing through wireManager
      this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
      this._kbWiring = true;
      this._kbWireSource = pin;
      // Build destination candidates
      this._kbDestCandidates = this._kbGetDestCandidates(pin);
      this._kbDestIndex = this._kbDestCandidates.length > 0 ? 0 : -1;
      if (this._kbDestCandidates.length > 0) {
        this._kbSelectedElement = this._kbDestCandidates[0].element;
        this.selectedGate = (this._kbSelectedElement instanceof Gate) ? this._kbSelectedElement : null;
        this.ui.updateStatusBar('Wiring from: ' + this._kbElementLabel(el) + ' → Tab to pick destination, Enter to connect');
      } else {
        this.ui.updateStatusBar('⚠ No compatible destinations for ' + this._kbElementLabel(el));
        this.wireManager.cancelDrawing();
        this._kbWiring = false;
      }
      this._startTimerIfPending();
      this.markDirty();
    }
  }

  _kbGetBestOutputPin(el) {
    // For input nodes: their pin is type 'output' (feeds into circuit)
    if (el instanceof IONode && el.type === 'input') {
      const p = el.getPin();
      return { gateId: el.id, pinIndex: 0, pinType: 'output', x: p.x + 12, y: p.y };
    }
    // For gates: first available output pin
    if (el instanceof Gate) {
      const pins = el.getOutputPins();
      if (pins.length > 0) {
        return { gateId: el.id, pinIndex: 0, pinType: 'output', x: pins[0].x + 12, y: pins[0].y };
      }
    }
    // For output nodes: their pin is type 'input' — so we start from an input pin
    // But we can also wire TO output nodes. For KB mode, output nodes aren't typical sources.
    // Let users start from output nodes by selecting their input pin
    if (el instanceof IONode && el.type === 'output') {
      // Output nodes receive wires, not send. Treat Enter on output node as no-op with message.
      return null;
    }
    return null;
  }

  _kbGetDestCandidates(sourcePin) {
    // Returns array of { element, gateId, pinIndex, pinType, x, y } for compatible dest pins
    const candidates = [];
    const wires = this.wireManager.wires;
    const srcType = sourcePin.pinType; // 'output'
    const targetType = srcType === 'output' ? 'input' : 'output';

    if (targetType === 'input') {
      // Target: gate input pins and output node input pins
      for (const gate of this.gates) {
        if (gate.id === sourcePin.gateId) continue; // no self-connect
        const pins = gate.getInputPins();
        for (let i = 0; i < pins.length; i++) {
          const connected = wires.some(w => w.toGateId === gate.id && w.toPinIndex === i);
          if (!connected) {
            candidates.push({
              element: gate,
              gateId: gate.id,
              pinIndex: i,
              pinType: 'input',
              x: pins[i].x - 12,
              y: pins[i].y,
            });
          }
        }
      }
      for (const node of this.outputNodes) {
        const connected = wires.some(w => w.toGateId === node.id && w.toPinIndex === 0);
        if (!connected) {
          const p = node.getPin();
          candidates.push({
            element: node,
            gateId: node.id,
            pinIndex: 0,
            pinType: 'input',
            x: p.x - 12,
            y: p.y,
          });
        }
      }
    }
    return candidates;
  }

  _kbCancelWire() {
    this.wireManager.cancelDrawing();
    this._kbWiring = false;
    this._kbWireSource = null;
    this._kbDestCandidates = [];
    this._kbDestIndex = -1;
    this._kbSelectedElement = null;
    this.ui.updateStatusBar('Wire cancelled — Tab to select element');
    this.audio.playEscapeCancel();
    this.markDirty();
  }

  _kbResetOnLevelChange() {
    this._kbWiring = false;
    this._kbWireSource = null;
    this._kbDestCandidates = [];
    this._kbDestIndex = -1;
    this._kbSelectedElement = null;
    // Don't disable the mode itself — user preference persists
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

  // ── Day 33 T8: Cross-Device Sync ──
  exportProgress() {
    try {
      const data = {
        v: 1,
        levels: this.progress.levels,
        streak: this.getStreakData(),
        tokens: this.hintTokens,
        skill: this.skillTracker.exportData(),
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
      if (data.skill && this.skillTracker) {
        this.skillTracker.importData(data.skill);
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

// ── Day 51: Solution Replay Viewer ──
class ReplayViewer {
  constructor(gameState, replayData, levelId) {
    this._gs = gameState;
    this._replay = replayData;
    this._levelId = levelId;
    this._actionIndex = 0;
    this._speed = 2;
    this._paused = false;
    this._stopped = false;
    this._timer = null;
    this._idMap = {}; // maps replay gate id → actual placed gate id
    this._active = false;
  }

  start() {
    if (!this._replay || !this._replay.actions || this._replay.actions.length === 0) return;
    this._active = true;
    this._gs._replayViewerActive = true;
    this._actionIndex = 0;
    this._idMap = {};
    this._stopped = false;
    this._paused = false;
    this._speed = 2;

    // Reload level fresh (clears circuit)
    this._gs.loadLevel(this._levelId);
    // Stop recording since we're replaying, not building
    this._gs._replayStartTime = null;

    // Build IONode ID mapping: old IDs (from recording) → new IDs (current session)
    if (this._replay.ioNodeIds) {
      const oldInputIds = this._replay.ioNodeIds.inputs || [];
      const oldOutputIds = this._replay.ioNodeIds.outputs || [];
      for (let i = 0; i < oldInputIds.length && i < this._gs.inputNodes.length; i++) {
        this._idMap[oldInputIds[i]] = this._gs.inputNodes[i].id;
      }
      for (let i = 0; i < oldOutputIds.length && i < this._gs.outputNodes.length; i++) {
        this._idMap[oldOutputIds[i]] = this._gs.outputNodes[i].id;
      }
    }

    // Show replay controls
    this._showControls();
    this._updateProgress();
    this._gs.ui.updateStatusBar('📹 Replaying solution...');

    // Hide star display if showing
    this._gs.ui.hideStarDisplay();

    // Schedule first action
    this._scheduleNext();
  }

  _showControls() {
    const el = document.getElementById('replay-controls');
    if (el) el.style.display = '';

    // Set speed selector to default
    const speedSel = document.getElementById('replay-speed-select');
    if (speedSel) {
      speedSel.value = '2';
      speedSel.onchange = () => {
        this._speed = parseInt(speedSel.value) || 2;
      };
    }

    // Play/Pause
    const ppBtn = document.getElementById('replay-play-pause');
    if (ppBtn) {
      ppBtn.textContent = '⏸';
      ppBtn.onclick = () => this._togglePause();
    }

    // Skip to end
    const skipBtn = document.getElementById('replay-skip-end');
    if (skipBtn) {
      skipBtn.onclick = () => this._skipToEnd();
    }

    // Stop
    const stopBtn = document.getElementById('replay-stop');
    if (stopBtn) {
      stopBtn.onclick = () => this.stop();
    }

    // Ghost compare toggle
    const ghostBtn = document.getElementById('replay-ghost-toggle');
    if (ghostBtn) {
      const hasGhost = this._gs.ghostOverlay && (this._gs.ghostOverlay.gates.length > 0 || this._gs.ghostOverlay.wires.length > 0);
      ghostBtn.style.display = hasGhost ? '' : 'none';
      if (hasGhost) {
        this._gs.showGhost = false;
        ghostBtn.onclick = () => {
          this._gs.showGhost = !this._gs.showGhost;
          ghostBtn.textContent = this._gs.showGhost ? '👻 Hide' : '👻 Compare';
          this._gs.markDirty();
        };
      }
    }
  }

  _hideControls() {
    const el = document.getElementById('replay-controls');
    if (el) el.style.display = 'none';
  }

  _updateProgress() {
    const total = this._replay.actions.length;
    const current = this._actionIndex;
    const pct = total > 0 ? (current / total) * 100 : 0;

    const fill = document.getElementById('replay-progress-fill');
    if (fill) fill.style.width = pct + '%';

    const counter = document.getElementById('replay-action-counter');
    if (counter) counter.textContent = `${current}/${total}`;
  }

  _scheduleNext() {
    if (this._stopped || this._paused) return;
    if (this._actionIndex >= this._replay.actions.length) {
      this._onReplayComplete();
      return;
    }

    const action = this._replay.actions[this._actionIndex];
    let delay;

    if (this._actionIndex === 0) {
      delay = 500; // Brief pause before first action
    } else {
      const prevAction = this._replay.actions[this._actionIndex - 1];
      delay = Math.max(50, (action.time - prevAction.time) / this._speed);
      // Cap max delay between actions at 2 seconds
      delay = Math.min(delay, 2000);
    }

    this._timer = setTimeout(() => {
      if (this._stopped) return;
      this._executeAction(action);
      this._actionIndex++;
      this._updateProgress();
      this._gs.ui.updateStatusBar(`📹 Replaying... (${this._actionIndex}/${this._replay.actions.length})`);
      this._scheduleNext();
    }, delay);
  }

  _executeAction(action) {
    const gs = this._gs;
    if (action.type === 'addGate') {
      const gate = gs.addGate(action.data.type, action.data.x, action.data.y, true);
      if (gate) {
        // Map the replay's gate id to the actual gate id
        this._idMap[action.data.id] = gate.id;
        // Play placement audio
        gs.audio.playGatePlace(action.data.type, action.data.x);
      }
    } else if (action.type === 'addWire') {
      // Translate replay gate IDs to actual gate IDs
      const fromId = this._idMap[action.data.fromGateId] !== undefined ? this._idMap[action.data.fromGateId] : action.data.fromGateId;
      const toId = this._idMap[action.data.toGateId] !== undefined ? this._idMap[action.data.toGateId] : action.data.toGateId;
      gs.addWireFromData(fromId, action.data.fromPinIndex, toId, action.data.toPinIndex);
      // Play wire connection audio
      gs.audio.playWireConnect();
    }
    gs.markDirty();
  }

  _togglePause() {
    this._paused = !this._paused;
    const ppBtn = document.getElementById('replay-play-pause');
    if (ppBtn) ppBtn.textContent = this._paused ? '▶' : '⏸';

    if (!this._paused) {
      this._scheduleNext();
    } else if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _skipToEnd() {
    // Cancel pending timer
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    // Execute all remaining actions instantly
    while (this._actionIndex < this._replay.actions.length) {
      const action = this._replay.actions[this._actionIndex];
      this._executeAction(action);
      this._actionIndex++;
    }
    this._updateProgress();
    this._onReplayComplete();
  }

  _onReplayComplete() {
    this._updateProgress();
    this._gs.ui.updateStatusBar('📹 Replay complete — running simulation...');

    // Brief pause, then run simulation with full animation
    setTimeout(() => {
      if (this._stopped) return;
      this._hideControls();
      this._active = false;
      this._gs._replayViewerActive = false;
      this._gs.runSimulation();
    }, 1000);
  }

  stop() {
    this._stopped = true;
    this._active = false;
    this._gs._replayViewerActive = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._hideControls();
    this._gs.ui.updateStatusBar('Replay stopped');
    // Reload the level to clean state
    this._gs.loadLevel(this._levelId);
  }

  isActive() {
    return this._active;
  }
}
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


// ── Day 52: PWA Offline + Push Notifications ──

const NOTIF_PREFS_KEY = 'signal-circuit-notif-prefs';
const SESSION_COUNT_KEY = 'signal-circuit-session-count';
const INSTALL_DISMISS_KEY = 'signal-circuit-install-dismiss';
// Day 79 Code Cleanup: removed WEEKLY_NOTIF_KEY (Puzzle of the Week retired Day 78).
// Day 69: Mobile install onramp
const INSTALL_LATER_KEY = 'signal-circuit-install-later'; // 14d snooze epoch
const INSTALL_NEVER_KEY = 'signal-circuit-install-never'; // 90d snooze epoch
const WELCOME_TOAST_KEY = 'signal-circuit-welcome-toasts'; // {l1:bool,l2:bool,l3:bool}
const INSTALL_LATER_MS = 14 * 24 * 60 * 60 * 1000;
const INSTALL_NEVER_MS = 90 * 24 * 60 * 60 * 1000;

class NotificationManager {
  constructor() {
    this._deferredInstallPrompt = null;
    this._prefs = this._loadPrefs();
    this._sessionCount = this._getSessionCount();
  }

  _loadPrefs() {
    try {
      const saved = SafeStorage.getItem(NOTIF_PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { daily: true, weekly: true, streak: true, permissionGranted: false };
  }

  _savePrefs() {
    SafeStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(this._prefs));
  }

  _getSessionCount() {
    try {
      const count = parseInt(SafeStorage.getItem(SESSION_COUNT_KEY) || '0');
      return isNaN(count) ? 0 : count;
    } catch (e) { return 0; }
  }

  _incrementSession() {
    this._sessionCount++;
    SafeStorage.setItem(SESSION_COUNT_KEY, String(this._sessionCount));
  }

  async requestPermission() {
    if (!('Notification' in window)) return 'unavailable';
    if (Notification.permission === 'granted') {
      this._prefs.permissionGranted = true;
      this._savePrefs();
      return 'granted';
    }
    if (Notification.permission === 'denied') return 'denied';
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this._prefs.permissionGranted = true;
        this._savePrefs();
      }
      return result;
    } catch (e) {
      return 'error';
    }
  }

  async scheduleNotification(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
          tag: tag || 'signal-circuit',
        });
        return true;
      }
      new Notification(title, { body, tag: tag || 'signal-circuit' });
      return true;
    } catch (e) {
      return false;
    }
  }

  scheduleDailyReminder(game) {
    if (!this._prefs.daily) return;
    if (game.dailyLeaderboard && game.dailyLeaderboard.isTodayCompleted()) return;
    const typicalHour = this._getTypicalPlayHour(game);
    const now = new Date();
    if (now.getHours() >= typicalHour + 1) return;
    const msUntilTarget = this._msUntilHour(typicalHour);
    if (msUntilTarget > 0 && msUntilTarget < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if (game.dailyLeaderboard && !game.dailyLeaderboard.isTodayCompleted()) {
          this.scheduleNotification(
            '🔔 Daily Challenge Ready!',
            "Today's logic puzzle is waiting. Can you crack it?",
            'signal-circuit-daily'
          );
        }
      }, msUntilTarget);
    }
  }

  _getTypicalPlayHour(game) {
    try {
      const history = game.dailyLeaderboard.getRecentHistory(7);
      // Future: analyze timestamps to find typical play hour
    } catch (e) {}
    return 10; // Default 10am
  }

  _msUntilHour(hour) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target - now;
  }

  // Day 79 Code Cleanup: removed checkWeeklyNotification() + _getWeekNumber()
  // (Puzzle of the Week was retired Day 78; Tournament uses its own week math).

  checkStreakAtRisk(game) {
    if (!this._prefs.streak) return false;
    const streakData = game.getStreakData();
    if (!streakData || streakData.streak < 3) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (streakData.lastPlayDate === today) return false;
    const hour = new Date().getHours();
    if (hour < 18) return false;
    return true;
  }

  scheduleStreakNotification(game) {
    if (!this._prefs.streak) return;
    const streakData = game.getStreakData();
    if (!streakData || streakData.streak < 3) return;
    const today = new Date().toISOString().slice(0, 10);
    if (streakData.lastPlayDate === today) return;
    const msUntil8pm = this._msUntilHour(20);
    if (msUntil8pm > 0 && msUntil8pm < 12 * 60 * 60 * 1000) {
      setTimeout(() => {
        const current = game.getStreakData();
        if (current && current.lastPlayDate !== new Date().toISOString().slice(0, 10) && current.streak >= 3) {
          this.scheduleNotification(
            '🔥 Streak at Risk!',
            'Your ' + current.streak + '-day streak expires tonight! Play now to keep it alive.',
            'signal-circuit-streak'
          );
        }
      }, msUntil8pm);
    }
  }

  setupInstallPrompt() {
    // Day 69: Capture event for later use by maybeShowInstallModal()
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredInstallPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      this._deferredInstallPrompt = null;
    });
    // Day 69: Settings → Install App entry
    const settingsBtn = document.getElementById('install-app-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        // Close settings modal first if open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) settingsModal.style.display = 'none';
        this.maybeShowInstallModal({ source: 'settings', force: true });
      });
    }
    // Day 69: Wire branded modal buttons (idempotent — safe to call once)
    this._wireInstallModal();
  }

  // Day 69: Detect standalone (PWA installed) — never show prompt then
  _isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (navigator.standalone === true) return true; // iOS Safari
    } catch (e) {}
    return false;
  }

  // Day 69: Detect iOS (Safari without beforeinstallprompt)
  _isIOS() {
    try {
      const ua = navigator.userAgent || '';
      const isiOS = /iPhone|iPad|iPod/i.test(ua) && !/Android/i.test(ua);
      // iPad on iOS 13+ reports as Mac — also treat touch-enabled Mac as iOS-like
      const isiPadOS = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
      return isiOS || isiPadOS;
    } catch (e) { return false; }
  }

  // Day 69: Snooze status — returns ms until snooze expires (0 if not snoozed)
  _installSnoozeRemainingMs() {
    let remaining = 0;
    try {
      const later = parseInt(SafeStorage.getItem(INSTALL_LATER_KEY) || '0');
      if (later > 0) {
        const r = (later + INSTALL_LATER_MS) - Date.now();
        if (r > remaining) remaining = r;
      }
      const never = parseInt(SafeStorage.getItem(INSTALL_NEVER_KEY) || '0');
      if (never > 0) {
        const r = (never + INSTALL_NEVER_MS) - Date.now();
        if (r > remaining) remaining = r;
      }
      // Honor legacy Day 52 dismiss key for 7 days
      const legacy = parseInt(SafeStorage.getItem(INSTALL_DISMISS_KEY) || '0');
      if (legacy > 0) {
        const r = (legacy + 7 * 24 * 60 * 60 * 1000) - Date.now();
        if (r > remaining) remaining = r;
      }
    } catch (e) {}
    return remaining;
  }

  // Day 69: Reusable welcome toast
  showWelcomeToast(text, durationMs) {
    const dur = durationMs || 4500;
    let toast = document.getElementById('welcome-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'welcome-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastSlideIn 0.4s ease, toastSlideOut 0.4s ease ' + ((dur - 400) / 1000) + 's forwards';
    clearTimeout(this._welcomeToastTimer);
    this._welcomeToastTimer = setTimeout(() => { toast.style.display = 'none'; }, dur + 100);
  }

  // Day 69: Welcome toast arc + install pitch on level-completion
  onLevelCompleted(levelId) {
    if (levelId !== 1 && levelId !== 2 && levelId !== 3) return;
    let arc = {};
    try { arc = JSON.parse(SafeStorage.getItem(WELCOME_TOAST_KEY) || '{}'); } catch (e) {}
    const key = 'l' + levelId;
    if (arc[key]) return; // already shown for this level
    arc[key] = true;
    SafeStorage.setItem(WELCOME_TOAST_KEY, JSON.stringify(arc));
    if (levelId === 1) {
      this.showWelcomeToast('🎉 First circuit lit!', 3800);
    } else if (levelId === 2) {
      this.showWelcomeToast('⚡ Two down — flowing!', 3800);
    } else if (levelId === 3) {
      this.showWelcomeToast('🚀 You\'re flowing — install for offline + notifications', 5200);
      // Surface install modal a moment after the celebratory toast lands
      setTimeout(() => this.maybeShowInstallModal({ source: 'L3-completion' }), 1800);
    }
  }

  // Day 69: Branded install modal — central entry point
  maybeShowInstallModal(opts) {
    const options = opts || {};
    if (this._isStandalone() && !options.force) return;
    if (!options.force && this._installSnoozeRemainingMs() > 0) return;

    if (this._deferredInstallPrompt) {
      this._showInstallModal();
      return;
    }
    if (this._isIOS()) {
      // iOS Safari has no beforeinstallprompt — show manual instructions
      this._showIOSInstallModal();
      return;
    }
    if (options.force) {
      // Forced from settings on a desktop without a deferred prompt — show iOS-style
      // instructions modal as the closest fallback so the button isn't a dead end.
      this._showIOSInstallModal();
    }
  }

  _showInstallModal() {
    const modal = document.getElementById('install-modal');
    if (modal) modal.style.display = 'flex';
  }

  _showIOSInstallModal() {
    const modal = document.getElementById('ios-install-modal');
    if (modal) modal.style.display = 'flex';
  }

  _wireInstallModal() {
    if (this._installModalWired) return;
    this._installModalWired = true;
    const modal = document.getElementById('install-modal');
    const yes = document.getElementById('install-modal-yes');
    const later = document.getElementById('install-modal-later');
    const never = document.getElementById('install-modal-never');
    const close = () => { if (modal) modal.style.display = 'none'; };
    if (yes) {
      yes.addEventListener('click', async () => {
        if (this._deferredInstallPrompt) {
          try {
            this._deferredInstallPrompt.prompt();
            const { outcome } = await this._deferredInstallPrompt.userChoice;
            if (outcome === 'dismissed') {
              SafeStorage.setItem(INSTALL_LATER_KEY, String(Date.now()));
            }
          } catch (e) {}
          this._deferredInstallPrompt = null;
        }
        close();
      });
    }
    if (later) {
      later.addEventListener('click', () => {
        SafeStorage.setItem(INSTALL_LATER_KEY, String(Date.now()));
        close();
      });
    }
    if (never) {
      never.addEventListener('click', () => {
        SafeStorage.setItem(INSTALL_NEVER_KEY, String(Date.now()));
        close();
      });
    }
    // iOS modal
    const iosModal = document.getElementById('ios-install-modal');
    const iosClose = document.getElementById('ios-install-close');
    const iosLater = document.getElementById('ios-install-later');
    const closeIOS = () => { if (iosModal) iosModal.style.display = 'none'; };
    if (iosClose) iosClose.addEventListener('click', closeIOS);
    if (iosLater) iosLater.addEventListener('click', () => {
      SafeStorage.setItem(INSTALL_LATER_KEY, String(Date.now()));
      closeIOS();
    });
  }

  setupOfflineIndicator() {
    const badge = document.getElementById('offline-badge');
    if (!badge) return;
    const update = () => { badge.style.display = navigator.onLine ? 'none' : 'block'; };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  setupSettingsUI() {
    // Day 79 Code Cleanup: removed 'weekly' notif (Puzzle of the Week retired Day 78).
    const types = [
      { id: 'notif-daily-btn', key: 'daily', emoji: '🔔', label: 'Daily' },
      { id: 'notif-streak-btn', key: 'streak', emoji: '🔥', label: 'Streak' },
    ];
    for (const t of types) {
      const btn = document.getElementById(t.id);
      if (!btn) continue;
      const on = this._prefs[t.key];
      btn.textContent = t.emoji + ' ' + t.label + ': ' + (on ? 'On' : 'Off');
      btn.style.opacity = on ? '1' : '0.5';
      btn.addEventListener('click', async () => {
        const newVal = !this._prefs[t.key];
        if (newVal && !this._prefs.permissionGranted && 'Notification' in window) {
          const result = await this.requestPermission();
          if (result !== 'granted') return;
        }
        this._prefs[t.key] = newVal;
        this._savePrefs();
        btn.textContent = t.emoji + ' ' + t.label + ': ' + (newVal ? 'On' : 'Off');
        btn.style.opacity = newVal ? '1' : '0.5';
      });
    }
  }

  init(game) {
    this._incrementSession();
    this.setupOfflineIndicator();
    this.setupInstallPrompt();
    this.setupSettingsUI();
    if (this._prefs.permissionGranted || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
      this.scheduleDailyReminder(game);
      this.scheduleStreakNotification(game);
    }
    if (this.checkStreakAtRisk(game)) {
      const streakData = game.getStreakData();
      setTimeout(() => this._showStreakRiskToast(streakData.streak), 2500);
    }
  }

  // Day 79 Code Cleanup: removed _showWeeklyToast() (Puzzle of the Week retired Day 78).

  _showStreakRiskToast(streak) {
    let toast = document.getElementById('streak-risk-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'streak-risk-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = '🔥 Your ' + streak + '-day streak expires tonight — play now!';
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastSlideIn 0.4s ease, toastSlideOut 0.4s ease 7.6s forwards';
    setTimeout(() => { toast.style.display = 'none'; }, 8100);
  }
}

window._notifManager = null;

// Initialize notification manager after game is ready
(function() {
  const initNotif = () => {
    if (window.game && !window._notifManager) {
      window._notifManager = new NotificationManager();
      window._notifManager.init(window.game);
    }
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initNotif, 500);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(initNotif, 500));
  }
  setTimeout(initNotif, 1000);
  setTimeout(initNotif, 2000);
})();

// ── Day 53: Sub-Circuit Abstraction System ──
class SubCircuitManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.circuits = this._load();
    this.MAX_CIRCUITS = 10;
  }

  _load() {
    try {
      const saved = SafeStorage.getItem(SUBCIRCUIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  _save() {
    // LRU eviction: keep newest MAX_CIRCUITS
    while (this.circuits.length > this.MAX_CIRCUITS) {
      this.circuits.shift(); // Remove oldest (front of array)
    }
    SafeStorage.setItem(SUBCIRCUIT_KEY, JSON.stringify(this.circuits));
  }

  // Save current level's solution as a sub-circuit
  saveFromLevel(levelId, customName) {
    const gs = this.gameState;
    const level = gs.currentLevel;
    if (!level) return null;

    const name = customName || level.title || ('Sub-Circuit ' + (this.circuits.length + 1));

    // Build the truth table output map for the first output
    // For multi-output levels, we store ALL outputs as an array per input combination
    const inputCount = level.inputs.length;
    const outputCount = level.outputs.length;

    // Create output map: for each input combination, store the array of output values
    const outputMap = [];
    for (const row of level.truthTable) {
      outputMap.push(row.outputs.slice());
    }

    // Assign a color based on the level's chapter
    const chapters = typeof getChapters === 'function' ? getChapters() : [];
    let color = '#00bcd4'; // default teal
    for (const ch of chapters) {
      if (ch.levels && ch.levels.includes(levelId)) {
        color = ch.color || '#00bcd4';
        break;
      }
    }

    const id = Date.now();
    const entry = {
      id,
      name,
      inputCount,
      outputCount,
      outputMap, // Array of [outputs] arrays, indexed by truth table row
      color,
      originalGateCount: gs.gates.filter(g => !g._locked).length,
      levelId,
      createdAt: new Date().toISOString(),
    };

    // Check for duplicate (same levelId) — replace if exists
    const existingIdx = this.circuits.findIndex(c => c.levelId === levelId);
    if (existingIdx >= 0) {
      this.circuits[existingIdx] = entry;
    } else {
      this.circuits.push(entry);
    }

    this._save();

    // Track for achievement
    const stats = gs.achievements.stats || {};
    stats.subCircuitsCreated = (stats.subCircuitsCreated || 0) + (existingIdx >= 0 ? 0 : 1);
    gs.achievements.stats = stats;
    gs.achievements.save();
    gs.achievements.checkAll(gs);

    return entry;
  }

  // Remove a sub-circuit by id
  remove(id) {
    this.circuits = this.circuits.filter(c => c.id !== id);
    this._save();
  }

  // Get all saved sub-circuits
  getAll() {
    return this.circuits.slice();
  }

  // Register sub-circuits as dynamic gate types for the current session
  registerGateTypes() {
    for (const sc of this.circuits) {
      const gateKey = 'SUB_' + sc.id;
      if (GateTypes[gateKey]) continue; // Already registered

      GateTypes[gateKey] = {
        name: sc.name.length > 8 ? sc.name.substring(0, 7) + '…' : sc.name,
        fullName: sc.name,
        inputs: sc.inputCount,
        outputs: sc.outputCount || 1,
        isSubCircuit: true,
        subCircuitId: sc.id,
        outputMap: sc.outputMap,
        color: sc.color || '#00bcd4',
        width: 90,
        height: Math.max(60, (Math.max(sc.inputCount, sc.outputCount || 1) + 1) * 25),
        logic: function() {
          // Evaluated via evaluateSubCircuit instead
          return 0;
        },
      };
    }
  }

  // Evaluate a sub-circuit gate given its input values
  evaluateSubCircuit(gateType, inputValues) {
    const def = GateTypes[gateType];
    if (!def || !def.isSubCircuit || !def.outputMap) return [0];

    // Convert input values to a row index (binary to decimal, MSB first)
    let rowIndex = 0;
    for (let i = 0; i < inputValues.length; i++) {
      rowIndex = (rowIndex << 1) | (inputValues[i] ? 1 : 0);
    }

    // Look up in the output map
    if (rowIndex >= 0 && rowIndex < def.outputMap.length) {
      const outputs = def.outputMap[rowIndex];
      return Array.isArray(outputs) ? outputs : [outputs];
    }
    return new Array(def.outputs || 1).fill(0);
  }
}
