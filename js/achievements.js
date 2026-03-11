// achievements.js — Achievement definitions and tracking

const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first level', icon: '🎯' },
  { id: 'perfect_score', name: 'Perfect Score', desc: 'Earn 3 stars on any level', icon: '⭐' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete any level in under 30 seconds', icon: '⚡' },
  { id: 'chapter1_master', name: 'Chapter 1 Master', desc: 'Complete all Chapter 1 levels', icon: '📗' },
  { id: 'chapter2_master', name: 'Chapter 2 Master', desc: 'Complete all Chapter 2 levels', icon: '📘' },
  { id: 'chapter3_master', name: 'Chapter 3 Master', desc: 'Complete all Chapter 3 levels', icon: '📙' },
  { id: 'circuit_master', name: 'Circuit Master', desc: 'Complete all 15 levels', icon: '🏆' },
  { id: 'star_collector', name: 'Star Collector', desc: 'Earn 30 total stars', icon: '🌟' },
  { id: 'no_hints', name: 'Pure Logic', desc: 'Complete level 4+ without using hints', icon: '🧠' },
  { id: 'daily_solver', name: 'Daily Solver', desc: 'Complete a daily challenge', icon: '📅' },
];

class AchievementManager {
  constructor() {
    this.unlocked = {};
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('signal-circuit-achievements');
      if (saved) this.unlocked = JSON.parse(saved);
    } catch (e) {}
  }

  save() {
    try {
      localStorage.setItem('signal-circuit-achievements', JSON.stringify(this.unlocked));
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
    }

    // No Hints on level 4+
    if (levelId >= 4 && hintsUsed === 0) {
      if (this.unlock('no_hints')) newlyUnlocked.push('no_hints');
    }

    // Chapter completion
    const chapters = getChapters();
    for (const chapter of chapters) {
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
    for (const [, data] of Object.entries(gameState.progress.levels)) {
      totalStars += data.stars || 0;
    }
    if (totalStars >= 30) {
      if (this.unlock('star_collector')) newlyUnlocked.push('star_collector');
    }

    return newlyUnlocked;
  }
}
