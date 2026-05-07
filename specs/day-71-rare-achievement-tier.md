# Day 71 Spec — Rare/Epic Achievement Tier (Mythic + Diamond)

**Cycle 2 / Build Week / Day 4 — Thursday May 7, 2026**

## Goal
Add chase-tier achievements (diamond + mythic) plus tier metadata, tier-sorted modal, mythic celebration, and Logic Profile tier breakdown. Earn a Mythic wire palette when first mythic unlocks.

## Items (10)

### 1. Tier metadata + colors
- Extend `TIER_COLORS` in `achievements.js` with `diamond: '#b9f2ff'` and `mythic: '#ff6bff'` (prismatic shimmer on cards).

### 2. Tier audit
- Existing 30+ achievements already have `tier`. No data migration needed. Keep current bronze/silver/gold tiers.

### 3. Mythic achievements (5)
- `mythic_galaxy_brain` — 3-star every campaign level **and** complete all 5 mastery challenges.
- `mythic_eclipse_run` — Reach a 30-day daily-challenge streak.
- `mythic_architect` — Build 10 sub-circuits.
- `mythic_lightning` — Infinite Mode 100-streak.
- `mythic_logicians_path` — Pure Logic on every campaign level.

### 4. Diamond achievements (3)
- `diamond_hardcore_marathon` — Complete 20 levels in Hardcore mode.
- `diamond_master_builder` — Place 1000 gates lifetime (uses `totalGatesPlaced`).
- `diamond_community_champion` — Complete 10 distinct community levels.

### 5. Tier-based card styling
- `.achievement-row.tier-diamond` — pale-blue glassy border + subtle icy glow.
- `.achievement-row.tier-mythic` — animated prismatic gradient border + soft glow.

### 6. Mythic unlock celebration
- New `#mythic-celebration` fullscreen overlay (z-index 3000). Engraving animation: name draws letter-by-letter in prismatic gradient text, "MYTHIC" subtitle fades in, dismiss after 3.6s or click-anywhere.
- Triggered from `showAchievementToasts` whenever a mythic id is in `newlyUnlocked`. Toast still fires after the celebration completes.

### 7. Achievements modal: tier-sorted + progress bars
- `renderAchievements` re-orders tiers: mythic → diamond → gold → silver → bronze.
- For locked achievements with quantitative progress (Architect, Hardcore Marathon, Master Builder, Community Champion, Eclipse Run, Lightning, Galaxy Brain (combined campaign+mastery), Logician's Path), append `<div class="achievement-progress"><div class="achievement-progress-fill"></div></div>` + `X / Y` label.

### 8. Tier counts on Logic Profile
- Append a tier-breakdown chip after the rank bar: `🥉 N · 🥈 N · 🥇 N · 💎 N · 🌌 N`.

### 9. Mythic wire palette cosmetic
- Add `COSMETIC_WIRE_COLORS` entry `mythic` with iridescent palette. Condition: `{ type: 'anyMythic' }`. Add `_checkCondition` branch reading the achievement manager.

### 10. Cache bust + service worker v49
- `?v=1779206400` on all 11 asset references.
- `sw.js` `CACHE_NAME` bumps to `signal-circuit-v49`.

## Hooks (where mythic/diamond fires)

| Achievement | Hook site |
|---|---|
| Galaxy Brain | `checkAfterCompletion` (campaign + mastery completion) |
| Eclipse Run | `trackDailyChallengeComplete` (after streak update) |
| Architect | `AchievementManager.checkAll` (already runs after sub-circuit save) |
| Lightning | `InfiniteRunManager.onSolve` (after streak increment) |
| Logician's Path | `checkAfterCompletion` (any campaign level w/ pureLogic) |
| Hardcore Marathon | `checkAfterCompletion` (after `hardcoreCompleted` marked) |
| Master Builder | `trackGatePlaced` (after counter increment) |
| Community Champion | community completion path in `runSimulation` / `runQuickTest` |

## Verification
1. Cold-start: achievements modal opens, mythic section first w/ 5 locked + progress bars (where applicable).
2. Seed `subCircuitsCreated=10` → `checkAll` unlocks Architect → mythic celebration fires once → toast shows → repeat call no-ops.
3. Seed lifetime gates 1000 → `trackGatePlaced(0)` triggers Master Builder.
4. Seed all 40 campaign levels @ 3 stars + all 5 mastery progress → `checkAfterCompletion` unlocks Galaxy Brain.
5. Seed `dailyChallengeStreak=30` → next daily completion fires Eclipse Run.
6. Logic Profile shows tier counts including 💎/🌌.
7. Once any mythic is unlocked, Mythic palette appears unlocked in Customize.
8. 0 console errors across all paths; cache `v49` served.

## Risks
- `checkAfterCompletion` already large; keep new checks compact and idempotent (every `unlock()` is no-op on already-unlocked).
- Mythic celebration must not block other modals — auto-dismiss timer + click-anywhere both close it.
- Progress bars on locked achievements must not leak a 0/N label when truly zero — show `0 / N` only for in-progress mythic/diamond chase items.
