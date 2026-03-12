// achievements.js — Tiered achievement system (Bronze / Silver / Gold)

const ACHIEVEMENTS = [
  // Bronze — Getting started
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first level', icon: '🎯', tier: 'bronze' },
  { id: 'first_wire', name: 'Connected', desc: 'Draw your first wire', icon: '🔌', tier: 'bronze' },
  { id: 'perfect_score', name: 'Perfect Score', desc: 'Earn 3 stars on any level', icon: '⭐', tier: 'bronze' },
  { id: 'no_hints', name: 'Pure Logic', desc: 'Complete level 4+ without using hints', icon: '🧠', tier: 'bronze' },
  { id: 'daily_solver', name: 'Daily Solver', desc: 'Complete a daily challenge', icon: '📅', tier: 'bronze' },

  // Silver — Building skills
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete any level in under 30 seconds', icon: '⚡', tier: 'silver' },
  { id: 'chapter1_master', name: 'Chapter 1 Master', desc: 'Complete all Chapter 1 levels', icon: '📗', tier: 'silver' },
  { id: 'chapter2_master', name: 'Chapter 2 Master', desc: 'Complete all Chapter 2 levels', icon: '📘', tier: 'silver' },
  { id: 'chapter3_master', name: 'Chapter 3 Master', desc: 'Complete all Chapter 3 levels', icon: '📙', tier: 'silver' },
  { id: 'five_perfect', name: 'Sharpshooter', desc: 'Earn 3 stars on 5 different levels', icon: '🎯', tier: 'silver' },
  { id: 'challenge_5', name: 'Challenger', desc: 'Complete 5 random challenges', icon: '🎲', tier: 'silver' },

  // Gold — Mastery
  { id: 'circuit_master', name: 'Circuit Master', desc: 'Complete all 17 levels', icon: '🏆', tier: 'gold' },
  { id: 'star_collector', name: 'Star Collector', desc: 'Earn 40 total stars', icon: '🌟', tier: 'gold' },
  { id: 'perfect_campaign', name: 'Flawless', desc: '3 stars on all 17 levels', icon: '💎', tier: 'gold' },
  { id: 'speed_run', name: 'Lightning Run', desc: 'Complete 5 levels in under 30 seconds each', icon: '⚡', tier: 'gold' },
];

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

class AchievementManager {
  constructor() {
    this.unlocked = {};
    this.stats = { challengesCompleted: 0, speedLevels: 0 };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('signal-circuit-achievements');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.unlocked) {
          this.unlocked = data.unlocked;
          this.stats = data.stats || { challengesCompleted: 0, speedLevels: 0 };
        } else {
          // Legacy format: flat object
          this.unlocked = data;
        }
      }
    } catch (e) {}
  }

  save() {
    try {
      localStorage.setItem('signal-circuit-achievements', JSON.stringify({
        unlocked: this.unlocked,
        stats: this.stats,
      }));
    } catch (e) {}
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

    // Circuit Master (all 15)
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
    if (totalStars >= 40) {
      if (this.unlock('star_collector')) newlyUnlocked.push('star_collector');
    }

    // Five Perfect
    if (perfectCount >= 5) {
      if (this.unlock('five_perfect')) newlyUnlocked.push('five_perfect');
    }

    // Perfect Campaign
    if (perfectCount >= 17 && allLevelsComplete) {
      if (this.unlock('perfect_campaign')) newlyUnlocked.push('perfect_campaign');
    }

    // Speed Run (5 levels under 30s)
    if (this.stats.speedLevels >= 5) {
      if (this.unlock('speed_run')) newlyUnlocked.push('speed_run');
    }

    this.save();
    return newlyUnlocked;
  }

  // Track challenge completions
  trackChallengeComplete() {
    this.stats.challengesCompleted = (this.stats.challengesCompleted || 0) + 1;
    const newlyUnlocked = [];
    if (this.stats.challengesCompleted >= 5) {
      if (this.unlock('challenge_5')) newlyUnlocked.push('challenge_5');
    }
    this.save();
    return newlyUnlocked;
  }

  // Track first wire
  trackFirstWire() {
    if (this.unlock('first_wire')) return ['first_wire'];
    return [];
  }
}
