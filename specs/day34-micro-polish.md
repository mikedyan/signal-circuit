# Day 34: Micro-Polish & Visual Flourishes

## T1: Session-Awareness / Gentle Stop Suggestions (#161)
- After 45+ continuous minutes of play, show a non-intrusive toast: "You've been at it for 45 min — take a break? 🧠"
- Non-blocking, auto-dismisses after 8 seconds
- Only triggers once per session, won't repeat if dismissed
- Uses existing toast pattern (achievement-toast style)

## T2: Return-Player Contextual Re-Onboarding (#162)
- When a player returns after 3+ days AND enters a gameplay level, show contextual tooltip reminders
- Extends existing welcome-back modal flow
- Shows one brief tooltip: "Quick reminder: drag gates → wire them → match the truth table"
- Marks as shown so it doesn't repeat in the same session

## T3: Drag Ghost Enhancement (#163)
- Make the drag ghost show colored border matching gate type + pin dots preview
- Include gate color in ghost border
- Add miniature pin indicators (input/output dots)

## T4: Intro Screen Boot Sequence (#164)
- Add CRT-style boot sequence lines before title appears
- Lines like "INITIALIZING SYSTEM...", "LOADING LOGIC CORES...", "SIGNAL READY"
- Flickering CRT scanline effect + text typing animation
- Sequence completes in ~1.2s then title appears normally

## T5: Progress Bar Milestone Markers (#165)
- Add diamond markers at 25%, 50%, 75%, 100% on the progress bar track
- Shimmer animation on reached milestones
- Tooltips showing milestone names

## T6: Level Select Micro-Interactions (#166)
- Hover scale already exists; add:
  - Pulse animation on newly-unlocked levels (glow pulse)
  - Staggered fade-in on level grid render
  - Subtle bob animation on incomplete levels

## T7: Screenshot Shareability Watermark (#167)
- Add subtle "⚡ Signal Circuit" watermark with circuit pattern to share card
- Already partially exists in generateShareCard; enhance with semi-transparent watermark overlay

## T8: Volume Slider Instead of Binary Mute (#168)
- Replace mute button with a mini volume slider in the status bar
- Slider range 0-100, default 30 (matching masterVolume * 100)
- 0 = muted, saves to localStorage
- Shows volume icon that changes based on level

## T9: Separate SFX and Music Volume Channels (#169)
- Split AudioEngine into SFX channel and Music channel
- Add `sfxVolume` and `musicVolume` properties
- SFX: all gameplay sounds (clicks, zaps, success, fail)
- Music: ambient pad, generative music
- Two sliders in settings, persisted to localStorage

## T10: Hint Sound Urgency Escalation (#170)
- Each successive hint request plays a sound with increasing urgency
- Hint 1: gentle chime (low frequency, simple)
- Hint 2: moderate alert (mid frequency, two tones)
- Hint 3: urgent signal (high frequency, complex, FM synthesis)
- Add `playHintReveal(hintNumber)` method to AudioEngine
