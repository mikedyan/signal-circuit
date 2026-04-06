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
];

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
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
            challengesCompleted: 0, speedLevels: 0,
            dailyChallengesTotal: 0, dailyChallengeStreak: 0,
            lastDailyChallengeDate: null, optimalSolves: 0,
            modesPlayed: [],
          };
          this.stats = { ...defaults, ...(data.stats || {}) };
          // Ensure modesPlayed is always an array
          if (!Array.isArray(this.stats.modesPlayed)) this.stats.modesPlayed = [];
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

    this.save();
    return newlyUnlocked;
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

  // Track first wire
  trackFirstWire() {
    if (this.unlock('first_wire')) return ['first_wire'];
    return [];
  }
}
