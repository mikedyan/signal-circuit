# Build Report — Day 46

## Change Plan
- **index.html**: Replace single volume slider with dual SFX/Music sliders in gameplay status bar. Add volume controls to level select settings section.
- **css/style.css**: New `.vol-row`, `.vol-icon`, `.vol-slider`, `.sfx-slider`, `.music-slider` styles. Light mode support.
- **js/audio.js**: Migrate ALL SFX methods from `this.masterVolume` to `this._sfxVol`. Update defaults (SFX 40%, Music 20%). Add sim normalization (`_effectiveSfxVol`). Add preview methods.
- **js/main.js**: Replace `setupMuteButton()` with `setupVolumeControls()`. Dual slider wiring with sync, mute toggle, and debounced preview.
- **sw.js**: Bump cache version to v33.

## Changes Made
- **index.html**: Replaced `#volume-control` div with `#volume-controls` containing two `.vol-row` divs for SFX and Music. Added `#ls-volume-row` to level select settings. Updated cache bust params.
- **css/style.css**: Replaced old `#volume-control/slider/icon` styles with new `.vol-row/.vol-icon/.vol-slider` classes. SFX slider has green thumb, Music slider has cyan thumb. Level select sliders slightly larger.
- **js/audio.js**: 
  - All ~40 `this.masterVolume *` occurrences in SFX methods → `this._sfxVol *`
  - `playSimPulsePass/Fail` uses `this._effectiveSfxVol` for normalization
  - Defaults: sfxVolume=0.4, musicVolume=0.2
  - `setSfxVolume/setMusicVolume` both update `this.muted` flag
  - Added `_startSimNormalization()/_stopSimNormalization()/_effectiveSfxVol`
  - Added `playVolumePreviewSfx()/playVolumePreviewMusic()`
  - `setMasterVolume` kept for backward compat but marked deprecated
- **js/main.js**: 
  - New `setupVolumeControls()` with `_wireVolSlider()` for each pair
  - `_syncVolSliders()` keeps gameplay ↔ level-select in sync
  - `_updateVolIcon()` with category-aware icons (🔇/🔈/🔉/🔊 for SFX, 🔕/🎵 for Music)
  - `_previewVolume()` with 200ms debounce

## Decisions Made
- **Cyan for Music slider**: Visually distinguishes from green SFX slider. Matches the electronic aesthetic.
- **Muted = both at zero**: Global `this.muted` is now true only when BOTH sfx AND music are 0. This means `startAmbient()` won't activate if only SFX is at 0 — this is correct since ambient is music-category.
- **setMasterVolume kept**: Not removed, just deprecated. Prevents breaking any code that still calls it.
- **Sim normalization at row 4+**: Reduces SFX by 30% during rapid sim pulses to prevent ear fatigue on large truth tables.

## Concerns
- The `this.muted` flag is now derived from both volumes. Methods that check `if (this.muted)` at the top will skip even pure-SFX methods when music is also 0. This is correct behavior but QA should verify ambient/music still works when SFX is 0 but music is > 0.
- Preview debounce at 200ms — might feel sluggish or too fast. QA should test slider UX.

## Self-Test Results
- T1 HTML dual sliders: PASS (verified in file)
- T2 CSS styling: PASS (verified classes and selectors)
- T3 SFX migration: PASS (grep shows 0 remaining `this.masterVolume *` in SFX methods)
- T4 Defaults: PASS (sfxVolume=0.4, musicVolume=0.2)
- T5 Main.js wiring: PASS (setupVolumeControls replaces setupMuteButton)
- T6 Level select controls: PASS (added ls-sfx/ls-music sliders)
- T7 Preview: PASS (methods added with debounce)
- T8 Live apply: PASS (setMusicVolume already ramps active nodes)
- T9 Normalization: PASS (effectiveSfxVol with 0.7 factor for sim)
- T10 Cache bust: PASS (v33, new timestamps)
