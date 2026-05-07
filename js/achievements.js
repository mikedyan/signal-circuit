// achievements.js — Tiered achievement system (Bronze / Silver / Gold)

const ACHIEVEMENTS = [
  // Bronze — Getting started
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first level', icon: '🎯', tier: 'bronze' },
  { id: 'first_wire', name: 'Connected', desc: 'Draw your first wire', icon: '🔌', tier: 'bronze' },
  { id: 'perfect_score', name: 'Perfect Score', desc: 'Earn 3 stars on any level', icon: '⭐', tier: 'bronze' },
  { id: 'no_hints', name: 'Pure Logic', desc: 'Complete level 4+ without using hints', icon: '🧠', tier: 'bronze' },
  { id: 'daily_solver', name: 'Daily Solver', desc: 'Complete a daily challenge', icon: '📅', tier: 'bronze' },
  { id: 'explorer', name: 'Explorer', desc: 'Try all 6 game modes', icon: '🧭', tier: 'bronze' },
  { id: 'social_butterfly', name: 'Social Butterfly', desc: 'Share a friend challenge link', icon: '🦋', tier: 'bronze' },
  { id: 'creator', name: 'Creator', desc: 'Create and share a custom level', icon: '🎨', tier: 'bronze' },
  { id: 'community_creator', name: 'Community Creator', desc: 'Share 3+ custom levels with the community', icon: '🌐', tier: 'silver' },

  // Silver — Building skills
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete any level in under 30 seconds', icon: '⚡', tier: 'silver' },
  { id: 'chapter1_master', name: 'Chapter 1 Master', desc: 'Complete all Chapter 1 levels', icon: '📗', tier: 'silver' },
  { id: 'chapter2_master', name: 'Chapter 2 Master', desc: 'Complete all Chapter 2 levels', icon: '📘', tier: 'silver' },
  { id: 'chapter3_master', name: 'Chapter 3 Master', desc: 'Complete all Chapter 3 levels', icon: '📙', tier: 'silver' },
  { id: 'five_perfect', name: 'Sharpshooter', desc: 'Earn 3 stars on 5 different levels', icon: '🎯', tier: 'silver' },
  { id: 'chapter6_master', name: 'Universal Logician', desc: 'Complete all Chapter 6 levels', icon: '⚛️', tier: 'silver' },
  { id: 'challenge_5', name: 'Challenger', desc: 'Complete 5 random challenges', icon: '🎲', tier: 'silver' },
  { id: 'clean_circuit', name: 'Clean Circuit', desc: 'Achieve 85%+ aesthetics score — elegant wiring!', icon: '✨', tier: 'silver' },
  { id: 'dark_gate', name: 'Dark Gate Master', desc: 'Solve the mystery gate level', icon: '🕵️', tier: 'silver' },
  { id: 'collector', name: 'Collector', desc: 'Build a collection of 10+ solved circuits', icon: '🗂️', tier: 'silver' },
  { id: 'week_warrior', name: 'Week Warrior', desc: 'Complete 7 daily challenges in a row', icon: '📆', tier: 'silver' },
  { id: 'minimalist', name: 'Minimalist', desc: 'Solve 10 levels at optimal gate count', icon: '✂️', tier: 'silver' },
  { id: 'speed_circuit', name: 'Speed Circuit', desc: 'Complete any Chapter 4+ level in under 60 seconds', icon: '⏱️', tier: 'silver' },
  { id: 'universal_builder', name: 'Universal Builder', desc: 'Solve a level using only NAND gates (when others available)', icon: '🔧', tier: 'silver' },

  // Gold — Mastery
  { id: 'circuit_master', name: 'Circuit Master', desc: 'Complete all campaign levels', icon: '🏆', tier: 'gold' },
  { id: 'star_collector', name: 'Star Collector', desc: 'Earn 60 total stars', icon: '🌟', tier: 'gold' },
  { id: 'perfect_campaign', name: 'Flawless', desc: '3 stars on all campaign levels', icon: '💎', tier: 'gold' },
  { id: 'speed_run', name: 'Lightning Run', desc: 'Complete 5 levels in under 30 seconds each', icon: '⚡', tier: 'gold' },
  { id: 'month_of_logic', name: 'Month of Logic', desc: 'Complete 30 daily challenges total', icon: '🗓️', tier: 'gold' },
  { id: 'streak_master', name: 'Streak Master', desc: 'Reach a 14-day play streak', icon: '🔥', tier: 'gold' },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Achieve 100% aesthetics score with 3+ gates', icon: '💯', tier: 'gold' },
  { id: 'efficiency_expert', name: 'Efficiency Expert', desc: 'Complete 10 gate limit challenges', icon: '⬦', tier: 'gold' },
  { id: 'circuit_architect', name: 'Circuit Architect', desc: 'Create 5 custom sub-circuits from solved levels', icon: '🏗️', tier: 'silver' },
  // Day 55: Mastery Challenges
  { id: 'master_logician', name: 'Master Logician', desc: 'Complete all 5 mastery challenges', icon: '👑', tier: 'gold' },
  { id: 'hardcore_completer', name: 'Hardcore Completer', desc: 'Complete all campaign levels in Hardcore mode', icon: '⬦', tier: 'gold' },
  // Day 68: Infinite Mode
  { id: 'infinite_marathon', name: 'Infinite Marathon', desc: 'Reach a 50-streak in a single Infinite run', icon: '🌌', tier: 'gold' },
  { id: 'pure_logic_run', name: 'Pure Logic Run', desc: 'Solve 10 puzzles in one Infinite run without using a hint', icon: '💡', tier: 'gold' },
  // Day 70: Lab Bench / Blueprint Mode
  { id: 'drafted_right', name: 'Drafted Right', desc: 'First-try solve on 3 different Lab Bench blueprints', icon: '📐', tier: 'gold' },
  { id: 'lab_method', name: 'The Method', desc: 'Clear all 5 Lab Bench levels (or any 10 lab clears total)', icon: '🔬', tier: 'gold' },

  // Day 71: Diamond — chase-tier achievements
  { id: 'diamond_hardcore_marathon', name: 'Hardcore Marathon', desc: 'Complete 20 levels in Hardcore mode', icon: '⬛', tier: 'diamond', goal: 20 },
  { id: 'diamond_master_builder', name: 'Master Builder', desc: 'Place 1,000 gates across all play', icon: '🏗', tier: 'diamond', goal: 1000 },
  { id: 'diamond_community_champion', name: 'Community Champion', desc: 'Complete 10 different community levels', icon: '🌐', tier: 'diamond', goal: 10 },

  // Day 71: Mythic — only earnable through extreme play
  { id: 'mythic_galaxy_brain', name: 'Galaxy Brain', desc: '3-star every campaign level AND complete every mastery challenge', icon: '🌌', tier: 'mythic' },
  { id: 'mythic_eclipse_run', name: 'Eclipse Run', desc: '30-day daily-challenge streak', icon: '🌑', tier: 'mythic', goal: 30 },
  { id: 'mythic_architect', name: 'Architect', desc: 'Build 10 sub-circuits', icon: '🏛', tier: 'mythic', goal: 10 },
  { id: 'mythic_lightning', name: 'Lightning', desc: 'Reach a 100-streak in a single Infinite Mode run', icon: '⚡', tier: 'mythic', goal: 100 },
  { id: 'mythic_logicians_path', name: "Logician's Path", desc: 'Pure Logic (no hints) on every campaign level', icon: '📜', tier: 'mythic' },
];

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  diamond: '#b9f2ff',
  mythic: '#ff6bff',
};

// Day 71: Display order (mythic-first in achievements modal)
const TIER_ORDER = ['mythic', 'diamond', 'gold', 'silver', 'bronze'];
const TIER_LABELS = {
  mythic: '🌌 Mythic',
  diamond: '💎 Diamond',
  gold: '🥇 Gold',
  silver: '🥈 Silver',
  bronze: '🥉 Bronze',
};

class AchievementManager {
  constructor() {
    this.unlocked = {};
    this.stats = {
      challengesCompleted: 0,
      speedLevels: 0,
      dailyChallengesTotal: 0,
      dailyChallengeStreak: 0,
      lastDailyChallengeDate: null,
      optimalSolves: 0,
      modesPlayed: [],
      // Day 70: Lab Bench / Blueprint Mode
      blueprintsSubmitted: 0,
      blueprintsFirstTrySolved: 0,
      blueprintLevelsCleared: 0,
      blueprintsFirstTryLevels: [],
      blueprintLevelsClearedSet: [],
    };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('signal-circuit-achievements');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.unlocked) {
          this.unlocked = data.unlocked;
          const defaults = {
            challengesCompleted: 0, speedLevels: 0, gateLimitCompletions: 0,
            dailyChallengesTotal: 0, dailyChallengeStreak: 0,
            lastDailyChallengeDate: null, optimalSolves: 0,
            modesPlayed: [],
            // Day 70: Lab Bench / Blueprint Mode
            blueprintsSubmitted: 0,
            blueprintsFirstTrySolved: 0,
            blueprintLevelsCleared: 0,
            blueprintsFirstTryLevels: [],
            blueprintLevelsClearedSet: [],
          };
          this.stats = { ...defaults, ...(data.stats || {}) };
          // Ensure modesPlayed is always an array
          if (!Array.isArray(this.stats.modesPlayed)) this.stats.modesPlayed = [];
          // Day 70: Ensure lab arrays are always arrays
          if (!Array.isArray(this.stats.blueprintsFirstTryLevels)) this.stats.blueprintsFirstTryLevels = [];
          if (!Array.isArray(this.stats.blueprintLevelsClearedSet)) this.stats.blueprintLevelsClearedSet = [];
        } else {
          // Legacy format: flat object
          this.unlocked = data;
        }
      }
    } catch (e) {}
  }

  save() {
    // F29-4: Use SafeStorage for graceful quota handling
    if (typeof SafeStorage !== 'undefined') {
      SafeStorage.setItem('signal-circuit-achievements', JSON.stringify({
        unlocked: this.unlocked,
        stats: this.stats,
      }));
    } else {
      try {
        localStorage.setItem('signal-circuit-achievements', JSON.stringify({
          unlocked: this.unlocked,
          stats: this.stats,
        }));
      } catch (e) {}
    }
  }

  isUnlocked(id) {
    return !!this.unlocked[id];
  }

  unlock(id) {
    if (this.unlocked[id]) return false; // already unlocked
    this.unlocked[id] = { date: new Date().toISOString() };
    this.save();
    return true; // newly unlocked
  }

  getAll() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: !!this.unlocked[a.id],
      unlockedDate: this.unlocked[a.id] ? this.unlocked[a.id].date : null,
      tierColor: TIER_COLORS[a.tier] || '#888',
    }));
  }

  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  // Check all achievement conditions after a level completion
  checkAfterCompletion(gameState, levelId, gateCount, elapsed, hintsUsed) {
    const newlyUnlocked = [];
    const level = typeof getLevel === 'function' ? getLevel(levelId) : null;

    // First Steps
    if (this.unlock('first_steps')) newlyUnlocked.push('first_steps');

    // Perfect Score
    const progress = gameState.progress.levels[levelId];
    if (progress && progress.stars === 3) {
      if (this.unlock('perfect_score')) newlyUnlocked.push('perfect_score');
    }

    // Speed Demon
    if (elapsed < 30) {
      if (this.unlock('speed_demon')) newlyUnlocked.push('speed_demon');
      this.stats.speedLevels = (this.stats.speedLevels || 0) + 1;
    }

    // No Hints on level 4+
    if (levelId >= 4 && hintsUsed === 0) {
      if (this.unlock('no_hints')) newlyUnlocked.push('no_hints');
    }

    // Day 41: Speed Circuit — Chapter 4+ level (id >= 21) in under 60 seconds
    if (levelId >= 21 && elapsed < 60) {
      if (this.unlock('speed_circuit')) newlyUnlocked.push('speed_circuit');
    }

    // Day 41: Minimalist — track optimal solves
    if (level && gateCount <= level.optimalGates) {
      this.stats.optimalSolves = (this.stats.optimalSolves || 0) + 1;
      if (this.stats.optimalSolves >= 10) {
        if (this.unlock('minimalist')) newlyUnlocked.push('minimalist');
      }
    }

    // Day 41: Universal Builder — all gates are NAND, other gate types were available
    if (gameState && gameState.gates && gameState.gates.length > 0 && level && level.availableGates) {
      const allNand = gameState.gates.every(g => g.type === 'NAND');
      const hasOtherGates = level.availableGates.some(g => g !== 'NAND');
      if (allNand && hasOtherGates) {
        if (this.unlock('universal_builder')) newlyUnlocked.push('universal_builder');
      }
    }

    // Chapter completion
    const chapters = getChapters();
    for (const chapter of chapters) {
      if (chapter.isBridge) continue;
      const allComplete = chapter.levels.every(lid => {
        const p = gameState.progress.levels[lid];
        return p && p.completed;
      });
      if (allComplete) {
        const achId = `chapter${chapter.id}_master`;
        if (this.unlock(achId)) newlyUnlocked.push(achId);
      }
    }

    // Circuit Master (all levels)
    const allLevelsComplete = LEVELS.every(l => {
      const p = gameState.progress.levels[l.id];
      return p && p.completed;
    });
    if (allLevelsComplete) {
      if (this.unlock('circuit_master')) newlyUnlocked.push('circuit_master');
    }

    // Star Collector
    let totalStars = 0;
    let perfectCount = 0;
    for (const [, data] of Object.entries(gameState.progress.levels)) {
      totalStars += data.stars || 0;
      if (data.stars === 3) perfectCount++;
    }
    if (totalStars >= 60) {
      if (this.unlock('star_collector')) newlyUnlocked.push('star_collector');
    }

    // Five Perfect
    if (perfectCount >= 5) {
      if (this.unlock('five_perfect')) newlyUnlocked.push('five_perfect');
    }

    // Perfect Campaign
    if (perfectCount >= LEVELS.length && allLevelsComplete) {
      if (this.unlock('perfect_campaign')) newlyUnlocked.push('perfect_campaign');
    }

    // Speed Run (5 levels under 30s)
    if (this.stats.speedLevels >= 5) {
      if (this.unlock('speed_run')) newlyUnlocked.push('speed_run');
    }

    // Dark Gate (level 32)
    if (levelId === 32) {
      if (this.unlock('dark_gate')) newlyUnlocked.push('dark_gate');
    }

    // Collector (10+ solved circuits)
    let solvedCount = 0;
    for (const [, data] of Object.entries(gameState.progress.levels || {})) {
      if (data.completed) solvedCount++;
    }
    if (solvedCount >= 10) {
      if (this.unlock('collector')) newlyUnlocked.push('collector');
    }

    // Day 71: Mythic + Diamond — chase-tier checks (idempotent; unlock() no-ops on dup)
    const rareNew = this._checkRareAchievements(gameState);
    for (const id of rareNew) newlyUnlocked.push(id);

    // Day 70: Lab Bench / Blueprint Mode achievements
    if (level && level.isLabBench) {
      const lvlIdStr = String(levelId);
      if (!Array.isArray(this.stats.blueprintLevelsClearedSet)) this.stats.blueprintLevelsClearedSet = [];
      if (!this.stats.blueprintLevelsClearedSet.includes(lvlIdStr)) {
        this.stats.blueprintLevelsClearedSet.push(lvlIdStr);
        this.stats.blueprintLevelsCleared = this.stats.blueprintLevelsClearedSet.length;
      }
      // Lab Method: 5 distinct levels cleared (the lab has only 5 levels) OR 10 total clears tracked separately
      if (this.stats.blueprintLevelsCleared >= 5) {
        if (this.unlock('lab_method')) newlyUnlocked.push('lab_method');
      }
      // Drafted Right: 3 first-try blueprint levels
      const ftLvls = Array.isArray(this.stats.blueprintsFirstTryLevels) ? this.stats.blueprintsFirstTryLevels : [];
      if (ftLvls.length >= 3) {
        if (this.unlock('drafted_right')) newlyUnlocked.push('drafted_right');
      }
    }

    this.save();
    return newlyUnlocked;
  }

  // Day 71: Public alias — callable from completion paths that don't go through checkAfterCompletion (e.g. community level via challenge flow).
  checkRareAchievements(gameState) {
    return this._checkRareAchievements(gameState);
  }

  // Day 71: Mythic + Diamond — chase-tier evaluation. Idempotent.
  _checkRareAchievements(gameState) {
    const newly = [];
    if (!gameState) return newly;
    const progress = gameState.progress || { levels: {} };
    const allLevels = (typeof LEVELS !== 'undefined') ? LEVELS : [];

    // mythic_galaxy_brain — 3-star every campaign level + every mastery
    if (allLevels.length > 0) {
      const allCampaign3Star = allLevels.every(l => {
        const p = progress.levels[l.id];
        return p && p.stars === 3;
      });
      let allMasteryDone = false;
      try {
        const masterySaved = JSON.parse(localStorage.getItem('signal-circuit-mastery') || '{}');
        const masteryList = (typeof MASTERY_CHALLENGES !== 'undefined') ? MASTERY_CHALLENGES : [];
        if (masteryList.length > 0) {
          allMasteryDone = masteryList.every(m => masterySaved[m.id] && masterySaved[m.id].completed);
        }
      } catch (e) {}
      if (allCampaign3Star && allMasteryDone) {
        if (this.unlock('mythic_galaxy_brain')) newly.push('mythic_galaxy_brain');
      }
    }

    // mythic_logicians_path — Pure Logic on every campaign level
    if (allLevels.length > 0) {
      const allPureLogic = allLevels.every(l => {
        const p = progress.levels[l.id];
        return p && p.completed && p.pureLogic;
      });
      if (allPureLogic) {
        if (this.unlock('mythic_logicians_path')) newly.push('mythic_logicians_path');
      }
    }

    // diamond_hardcore_marathon — 20 hardcore-completed levels
    let hardcoreCount = 0;
    for (const data of Object.values(progress.levels || {})) {
      if (data && data.hardcoreCompleted) hardcoreCount++;
    }
    this.stats.hardcoreCompletedCount = hardcoreCount;
    if (hardcoreCount >= 20) {
      if (this.unlock('diamond_hardcore_marathon')) newly.push('diamond_hardcore_marathon');
    }

    // diamond_community_champion — 10 distinct community levels completed
    let communityCount = 0;
    try {
      const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
      if (Array.isArray(cc)) communityCount = new Set(cc).size;
    } catch (e) {}
    this.stats.communityCompletedCount = communityCount;
    if (communityCount >= 10) {
      if (this.unlock('diamond_community_champion')) newly.push('diamond_community_champion');
    }

    return newly;
  }

  // Day 71: Master Builder hook — lifetime gates placed.
  checkMasterBuilder(totalGatesPlaced) {
    const newly = [];
    if ((totalGatesPlaced || 0) >= 1000) {
      if (this.unlock('diamond_master_builder')) newly.push('diamond_master_builder');
    }
    return newly;
  }

  // Day 71: Lightning — Infinite Mode 100-streak.
  checkLightning(streak) {
    const newly = [];
    if ((streak || 0) >= 100) {
      if (this.unlock('mythic_lightning')) newly.push('mythic_lightning');
    }
    return newly;
  }

  // Day 71: Eclipse Run — 30-day daily streak.
  checkEclipseRun() {
    const newly = [];
    if ((this.stats.dailyChallengeStreak || 0) >= 30) {
      if (this.unlock('mythic_eclipse_run')) newly.push('mythic_eclipse_run');
    }
    return newly;
  }

  // Day 71: Architect — 10 sub-circuits.
  checkArchitect() {
    const newly = [];
    if ((this.stats.subCircuitsCreated || 0) >= 10) {
      if (this.unlock('mythic_architect')) newly.push('mythic_architect');
    }
    return newly;
  }

  // Day 71: Tier-counts breakdown for Logic Profile.
  getTierCounts() {
    const counts = { bronze: 0, silver: 0, gold: 0, diamond: 0, mythic: 0 };
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked[a.id] && counts[a.tier] !== undefined) counts[a.tier]++;
    }
    return counts;
  }

  // Day 71: Progress lookup for locked achievements (mythic/diamond chase).
  // Returns { current, goal } or null if no progress meter applies.
  getProgress(id, gameState) {
    if (!gameState) return null;
    const progress = gameState.progress || { levels: {} };
    const allLevels = (typeof LEVELS !== 'undefined') ? LEVELS : [];
    switch (id) {
      case 'diamond_hardcore_marathon': {
        let n = 0;
        for (const d of Object.values(progress.levels || {})) if (d && d.hardcoreCompleted) n++;
        return { current: n, goal: 20 };
      }
      case 'diamond_master_builder': {
        let total = 0;
        try {
          const saved = JSON.parse(localStorage.getItem('signal-circuit-stats') || '{}');
          total = saved.totalGatesPlaced || 0;
        } catch (e) {}
        return { current: total, goal: 1000 };
      }
      case 'diamond_community_champion': {
        let n = 0;
        try {
          const cc = JSON.parse(localStorage.getItem('communityCompleted') || '[]');
          if (Array.isArray(cc)) n = new Set(cc).size;
        } catch (e) {}
        return { current: n, goal: 10 };
      }
      case 'mythic_eclipse_run':
        return { current: this.stats.dailyChallengeStreak || 0, goal: 30 };
      case 'mythic_architect':
        return { current: this.stats.subCircuitsCreated || 0, goal: 10 };
      case 'mythic_lightning': {
        let best = 0;
        try {
          const saved = JSON.parse(localStorage.getItem('signal_circuit_infinite_v1') || '{}');
          best = saved.bestStreak || 0;
        } catch (e) {}
        return { current: best, goal: 100 };
      }
      case 'mythic_galaxy_brain': {
        const stars3 = allLevels.filter(l => {
          const p = progress.levels[l.id]; return p && p.stars === 3;
        }).length;
        let masteryDone = 0;
        try {
          const m = JSON.parse(localStorage.getItem('signal-circuit-mastery') || '{}');
          for (const k of Object.keys(m)) if (m[k] && m[k].completed) masteryDone++;
        } catch (e) {}
        const total = allLevels.length + ((typeof MASTERY_CHALLENGES !== 'undefined') ? MASTERY_CHALLENGES.length : 5);
        return { current: stars3 + masteryDone, goal: total };
      }
      case 'mythic_logicians_path': {
        const n = allLevels.filter(l => {
          const p = progress.levels[l.id]; return p && p.completed && p.pureLogic;
        }).length;
        return { current: n, goal: allLevels.length };
      }
      default:
        return null;
    }
  }

  // Day 71: Mark id as mythic for caller convenience.
  isMythic(id) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    return !!(a && a.tier === 'mythic');
  }

  // Day 70: Track a Blueprint submission (success or fail) — increments submit counter only.
  trackBlueprintSubmit() {
    this.stats.blueprintsSubmitted = (this.stats.blueprintsSubmitted || 0) + 1;
    this.save();
  }

  // Day 70: Track a Blueprint first-try success. Returns array of newly unlocked ids.
  trackBlueprintFirstTry(levelId) {
    const newly = [];
    if (!Array.isArray(this.stats.blueprintsFirstTryLevels)) this.stats.blueprintsFirstTryLevels = [];
    const lid = String(levelId);
    if (!this.stats.blueprintsFirstTryLevels.includes(lid)) {
      this.stats.blueprintsFirstTryLevels.push(lid);
      this.stats.blueprintsFirstTrySolved = this.stats.blueprintsFirstTryLevels.length;
      if (this.stats.blueprintsFirstTrySolved >= 3) {
        if (this.unlock('drafted_right')) newly.push('drafted_right');
      }
      this.save();
    }
    return newly;
  }

  // Track challenge completions (random challenges)
  trackChallengeComplete() {
    this.stats.challengesCompleted = (this.stats.challengesCompleted || 0) + 1;
    const newlyUnlocked = [];
    if (this.stats.challengesCompleted >= 5) {
      if (this.unlock('challenge_5')) newlyUnlocked.push('challenge_5');
    }
    this.save();
    return newlyUnlocked;
  }

  // Day 41: Track daily challenge completions (separate from random challenges)
  // Day 71: Eclipse Run hooks in here.
  trackDailyChallengeComplete() {
    const today = new Date().toISOString().slice(0, 10);
    const newlyUnlocked = [];

    // Total daily challenges
    this.stats.dailyChallengesTotal = (this.stats.dailyChallengesTotal || 0) + 1;
    if (this.stats.dailyChallengesTotal >= 30) {
      if (this.unlock('month_of_logic')) newlyUnlocked.push('month_of_logic');
    }

    // Daily challenge streak
    const lastDate = this.stats.lastDailyChallengeDate;
    if (lastDate === today) {
      // Already completed today — no streak change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (lastDate === yesterdayStr) {
        this.stats.dailyChallengeStreak = (this.stats.dailyChallengeStreak || 0) + 1;
      } else {
        this.stats.dailyChallengeStreak = 1; // Reset streak
      }
      this.stats.lastDailyChallengeDate = today;
    }

    if (this.stats.dailyChallengeStreak >= 7) {
      if (this.unlock('week_warrior')) newlyUnlocked.push('week_warrior');
    }

    // Day 71: Eclipse Run — 30-day daily streak
    if (this.stats.dailyChallengeStreak >= 30) {
      if (this.unlock('mythic_eclipse_run')) newlyUnlocked.push('mythic_eclipse_run');
    }

    this.save();
    return newlyUnlocked;
  }

  // Day 41: Track streak achievement (called from updateStreak in main.js)
  checkStreakAchievement(streakCount) {
    const newlyUnlocked = [];
    if (streakCount >= 14) {
      if (this.unlock('streak_master')) newlyUnlocked.push('streak_master');
    }
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  // Day 41: Track mode exploration
  trackModeExplored(modeName) {
    if (!Array.isArray(this.stats.modesPlayed)) this.stats.modesPlayed = [];
    if (this.stats.modesPlayed.includes(modeName)) return [];
    this.stats.modesPlayed.push(modeName);
    const newlyUnlocked = [];
    // All 6 modes: campaign, daily, random, blitz, speedrun, sandbox
    if (this.stats.modesPlayed.length >= 6) {
      if (this.unlock('explorer')) newlyUnlocked.push('explorer');
    }
    this.save();
    return newlyUnlocked;
  }

  // Day 41: Track social share
  trackFriendChallengeShare() {
    const newlyUnlocked = [];
    if (this.unlock('social_butterfly')) newlyUnlocked.push('social_butterfly');
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  // Day 41: Track custom level creation
  trackCustomLevelCreated() {
    const newlyUnlocked = [];
    if (this.unlock('creator')) newlyUnlocked.push('creator');
    // Day 49: Track total custom levels shared for community_creator
    this.stats.customLevelsShared = (this.stats.customLevelsShared || 0) + 1;
    if (this.stats.customLevelsShared >= 3) {
      if (this.unlock('community_creator')) newlyUnlocked.push('community_creator');
    }
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  // Day 41: Check perfectionist achievement (100% aesthetics with 3+ gates)
  checkPerfectionist(aestheticsScore, gateCount) {
    const newlyUnlocked = [];
    if (gateCount >= 3 && aestheticsScore >= 100) {
      if (this.unlock('perfectionist')) newlyUnlocked.push('perfectionist');
    }
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  // Day 45: Check gate limit challenge achievement
  checkGateLimitAchievement() {
    const newlyUnlocked = [];
    const count = this.stats.gateLimitCompletions || 0;
    if (count >= 10 && this.unlock('efficiency_expert')) {
      newlyUnlocked.push('efficiency_expert');
    }
    return newlyUnlocked;
  }


  // Day 53: Check sub-circuit creation achievement
  // Day 71: also fires Architect mythic at 10 sub-circuits.
  checkAll(gameState) {
    const newlyUnlocked = [];
    const count = this.stats.subCircuitsCreated || 0;
    if (count >= 5 && this.unlock('circuit_architect')) {
      newlyUnlocked.push('circuit_architect');
    }
    if (count >= 10 && this.unlock('mythic_architect')) {
      newlyUnlocked.push('mythic_architect');
    }
    if (newlyUnlocked.length > 0) {
      this.save();
      // Day 71: route through showAchievementToasts (plural; takes id array) — fixes latent
      // Day 53 bug where this called the non-existent showAchievementToast(ach) singular.
      if (gameState && gameState.ui && typeof gameState.ui.showAchievementToasts === 'function') {
        gameState.ui.showAchievementToasts(newlyUnlocked);
      }
    }
    return newlyUnlocked;
  }

  // Track first wire
  trackFirstWire() {
    if (this.unlock('first_wire')) return ['first_wire'];
    return [];
  }
}
