# Signal Circuit — Phase 3 Roadmap (30 Days)

**Start:** Day 36  
**Focus:** Fix replayability weakness, deepen engagement, smooth difficulty curve  
**Philosophy:** Fix weaknesses first, then add features that maximize fun  

---

## Day 1 — Difficulty Bridge Levels (Chapter 3.5)

**Summary:** Add 3 bridge levels between Chapter 3 and Chapter 4 to smooth the difficulty cliff.

**Items:**
1. New Level 17.5a: "2-Input Decoder" — a 2-to-2 decoder (simpler version of the 2-to-4 decoder) using AND + NOT (acceptance: outputs Y0=NOT(A)·B, Y1=A·B, 3 gates optimal)
2. New Level 17.5b: "Bit Comparator" — compare two single bits for equality using XOR + NOT (acceptance: EQ output = XNOR(A,B), 2 gates optimal)
3. New Level 17.5c: "Data Selector" — simplified 2-to-1 multiplexer with enable (acceptance: OUT = A when S=0, B when S=1, 4 gates optimal — same as L16 but positioned as bridge)
4. Add these to a new "Chapter 3.5: Bridge — Systems Check" with narrative: "Running diagnostics before engaging the warp drive..."
5. Renumber level IDs to maintain sequential ordering (or use fractional IDs like 17.1, 17.2, 17.3)
6. Update CHAPTERS array with new bridge chapter between chapters 3 and 4
7. Add appropriate hints (3 tiers) and postSolveInsight for each new level
8. Add real-world connection blurb for the bridge chapter
9. Test that progress save/load handles the new level IDs without breaking existing saves
10. Update progress bar total to reflect new level count

## Day 2 — Signal Flow Animation

**Summary:** Animate signals traveling along wires during simulation for a visceral "electricity flowing" feel.

**Items:**
1. Add `_animPhase` property to Wire class (0-1 float representing signal travel progress)
2. During `animatePulse()`, stagger wire animation by topological order — signals flow from inputs through gates to outputs
3. Render animated signal dot traveling along bezier wire path using `getPointOnBezier(t)` helper
4. Signal dot color: green for 1, dim for 0, with glow trail effect (3-4 trailing dots with decreasing opacity)
5. Add canvas rendering for signal dots in `_renderWires()` — draw after static wire, before gates
6. Animate input node "pulse" when its value is being read (brief expand-contract)
7. Animate output node "receive" when signal arrives (brief flash + value update)
8. Gate glow should intensify as signal arrives at its inputs, then pulse when it evaluates
9. Skip signal flow animation when using Quick Test (instant mode stays instant)
10. Performance guard: cap at 60fps, skip if >50 active wire animations

## Day 3 — Interactive Wire-Drawing Tutorial

**Summary:** Replace Level 1's passive onboarding tooltip with an interactive guided wire-draw sequence.

**Items:**
1. Create `InteractiveTutorial` class that overlays step-by-step instructions on the canvas
2. Step 1: Highlight the toolbox OR gate with pulsing arrow — "Drag this gate to the board"
3. Step 2: After gate placed, highlight input A's output pin — "Click this pin to start a wire"
4. Step 3: After wire started, highlight gate's input pin — "Click here to complete the connection"
5. Step 4: Highlight input B and guide second wire connection
6. Step 5: Highlight gate output and guide wire to OUT node
7. Step 6: Highlight RUN button — "Press RUN to test your circuit!"
8. Dim non-relevant elements during each step (semi-transparent overlay with cutout)
9. Allow skipping the tutorial at any point ("Skip Tutorial" button)
10. Track tutorial completion in localStorage; never show again after first completion

## Day 4 — Truth Table Enhancement

**Summary:** Make large truth tables manageable with filtering, highlighting, and progressive disclosure.

**Items:**
1. Add "Compact Mode" toggle for truth tables with 8+ rows — shows only failing rows when results are available
2. Add row highlighting: hover a truth table row → highlight the corresponding input combination on the canvas (input nodes pulse with their values)
3. Add column sorting: click a column header to sort truth table by that column
4. For 4-input levels (16 rows), default to a collapsed "Show key rows" view showing first row, last row, and any failing rows
5. Add binary-to-decimal annotation: show the decimal value of each input/output combination in a subtle tooltip (e.g., "A=1,B=0 = 2")
6. Color-code truth table cells: 0 = dim blue, 1 = bright green (matching wire signal colors)
7. Add "Focus Failed Rows" button after a failed run — scrolls to and highlights failing rows
8. Add sticky headers for truth table so column labels stay visible when scrolling
9. Ensure truth table auto-expands when running simulation (override manual collapse)
10. Mobile: make truth table rows tappable — tapping sets input nodes to that row's values for live testing

## Day 5 — Cosmetic Unlock System

**Summary:** Wire colors, gate skins, and breadboard themes that players unlock through achievements and stars.

**Items:**
1. Create `CosmeticManager` class with categories: wireColors, gateSkins, boardThemes
2. Default wire color: green. Unlockable: blue (10 stars), orange (25 stars), purple (50 stars), rainbow (all 3-star), gold (perfect campaign)
3. Default gate skin: IC chip. Unlockable: neon (Chapter 2 complete), retro (Chapter 4 complete), minimal (50% 3-star)
4. Default board theme: breadboard. Unlockable: PCB green (Chapter 3), dark circuit (Chapter 5), blueprint (all chapters)
5. Add "Customization" section to level select screen with preview thumbnails
6. Store selected cosmetics in localStorage, load on init
7. Modify wire rendering to use selected color (pass through to WireManager)
8. Modify gate rendering to use selected skin (alternate render paths in Gate.render())
9. Modify breadboard rendering to use selected theme (alternate drawBreadboard styles)
10. Show "NEW UNLOCK!" toast when a cosmetic is earned (tie to achievement system)

## Day 6 — Achievement Expansion

**Summary:** Add 15 new achievements focused on daily engagement, streaks, and mastery milestones.

**Items:**
1. "Week Warrior" (silver) — Complete 7 daily challenges in a row
2. "Month of Logic" (gold) — Complete 30 daily challenges total
3. "Streak Master" (gold) — Reach a 14-day play streak
4. "Minimalist" (silver) — Solve 10 levels at optimal gate count
5. "Speed Circuit" (silver) — Complete any Chapter 4+ level in under 60 seconds
6. "Explorer" (bronze) — Try all 6 game modes (campaign, daily, random, blitz, speedrun, sandbox)
7. "Social Butterfly" (bronze) — Share a friend challenge link
8. "Creator" (bronze) — Create and play a custom level
9. "Universal Builder" (silver) — Solve a level using only NAND gates (when other gates available)
10. "Perfectionist" (gold) — Achieve 100% aesthetics score on any level with 3+ gates

## Day 7 — Error Explanation System

**Summary:** When simulation fails, explain WHY each row failed with specific gate-level diagnosis.

**Items:**
1. After failed simulation, trace the signal path for each failing row
2. Show "Expected OUT=1, Got OUT=0" with highlighted path from inputs to output showing where the signal diverged
3. Highlight the specific gate whose output was wrong in red on the canvas
4. Add expandable "Why did this fail?" section below each failing row in the truth table
5. For disconnected outputs, show "Output [name] is not connected to any gate"
6. For always-0 or always-1 outputs, detect and suggest "Your circuit always outputs X regardless of inputs"
7. Include gate-level trace: "A=1 → AND(1,0) = 0 → NOT(0) = 1 → OUT gets 1, but expected 0"
8. Limit explanation depth to 3 gates (don't trace through entire 8-gate circuits)
9. Style explanations with monospace font and color-coded values (green=1, red=0)
10. Add "Show me" button that briefly highlights the traced signal path on the canvas

## Day 8 — Level Preview Thumbnails

**Summary:** Show miniature circuit previews on the level select for completed levels.

**Items:**
1. After solving a level, capture a simplified canvas snapshot of the solution
2. Store as compact data (gate types + positions + wire endpoints) in localStorage (not full image)
3. Render mini-preview as 120x80 canvas on level select cards using simplified renderer
4. Show gates as small colored rectangles, wires as thin lines, I/O nodes as dots
5. Only show for completed levels (locked levels stay as-is)
6. Add hover/tap to enlarge preview to 300x200 overlay
7. Limit storage to last 20 level previews (LRU eviction)
8. Add "View Solution" button on completed level cards that loads the level with ghost overlay pre-enabled
9. Ensure previews update when player improves a solution (fewer gates)
10. Performance: render previews lazily (only when scrolled into view using IntersectionObserver)

## Day 9 — Anonymous Daily Leaderboard

**Summary:** Hash-based anonymous leaderboard for daily challenges — competitive without accounts.

**Items:**
1. Create simple serverless function (Cloudflare Workers or GitHub Actions + JSON file) for leaderboard API
2. Daily challenge results: submit gate count + solve time (no PII, just anonymous hash)
3. Show "You solved in X gates — faster than Y% of players today" after daily challenge completion
4. Display top 10 anonymous scores on daily challenge screen (gate count, time, rank)
5. Fallback: if no server, generate pseudo-leaderboard from seeded PRNG based on date (fake but consistent)
6. Add "Your Daily Rank" badge on level select showing today's performance
7. Show historical daily performance (last 7 days) in stats dashboard
8. Rate-limit submissions (1 per day per browser fingerprint hash)
9. Add subtle competitive framing: "Today's leader used just 3 gates — can you match them?"
10. Include opt-in display name (stored locally, submitted with score) for personalization

## Day 10 — Gate Limit Challenge Variants

**Summary:** For every completed level, unlock a "gate limit" variant with a tighter constraint.

**Items:**
1. After 3-starring a level, unlock "🏆 Gate Limit Challenge" variant
2. Gate limit = optimal gate count (force players to find THE optimal solution)
3. Show gate limit challenges as a sub-row under the original level on level select
4. Track separate completion status for gate limit challenges (new badge: diamond ⬦)
5. Add "Gate Budget: X" indicator in gameplay that turns red when exceeded, preventing RUN
6. Award special achievement: "Efficiency Expert" — complete 10 gate limit challenges
7. Gate limit challenges don't give hints (tokens not spent)
8. Show optimal solution comparison after gate limit completion (if known)
9. Add gate limit challenges to speedrun mode as an optional "hard mode" speedrun
10. Track total gate limit completions in stats dashboard

## Day 11 — Separate SFX/Music Volume Controls

**Summary:** Expose the existing SFX/music volume split to the UI and add per-category sliders.

**Items:**
1. Replace single volume slider with two sliders: "🔊 SFX" and "🎵 Music"
2. SFX slider controls: gate placement, wire connection, simulation pulses, UI clicks, achievements
3. Music slider controls: ambient pad, generative music, chapter palette shifts
4. Add volume controls to both the gameplay status bar and level select settings
5. Store separate volume levels in localStorage (already architected in audio.js)
6. Add quick-mute icons next to each slider (click icon = mute that category)
7. Default: SFX 40%, Music 20% (music is currently too quiet relative to SFX)
8. Add volume normalization: auto-reduce SFX volume during loud simulation sequences
9. Add audio preview: brief sound plays when slider is adjusted
10. Ensure volume changes apply immediately to currently-playing ambient sound

## Day 12 — Celebration Variety System

**Summary:** Different celebration animations based on chapter, star rating, and special conditions.

**Items:**
1. Chapter 1-2: Classic confetti (current behavior)
2. Chapter 3: Confetti + floating circuit symbols (AND, OR, XOR rendered as tiny particles)
3. Chapter 4: Electric sparks radiating from circuit center outward
4. Chapter 5: Shield shimmer effect (expanding hexagonal grid pattern)
5. Chapter 6: NAND/NOR gate rain (tiny gate shapes falling instead of confetti)
6. 3-star celebration: Add spinning star burst behind the star display
7. "Pure Logic" badge earned: Brain emoji explosion (🧠 particles)
8. First time solving a level: Gentler celebration. Retry with improvement: more intense
9. Create `CelebrationFactory` that selects celebration type based on context
10. Add screen-wide pulse effect that matches chapter color (green for Ch1, blue for Ch2, etc.)

## Day 13 — Keyboard-First Wiring Mode

**Summary:** Complete keyboard workflow: Tab between elements, Enter to connect, Arrow keys to position.

**Items:**
1. Add "Keyboard Wiring" mode toggle (K key or button in toolbox)
2. Tab cycles through: input nodes → placed gates → output nodes (in topological order)
3. Selected element gets prominent highlight ring (green glow, different from mouse selection)
4. Press Enter on selected element to start wire from it (selects first available output pin)
5. Tab again to cycle through compatible destination elements
6. Press Enter to complete wire connection to selected destination
7. Show "Wiring from: [source] → Select destination (Tab/Enter)" status message
8. Escape cancels wire drawing (same as mouse)
9. Number keys (1-6) place gates at current cursor position (existing behavior enhanced with grid-snap preview)
10. Add keyboard shortcut reference card in shortcuts overlay with wiring mode section

## Day 14 — Community Level Browser

**Summary:** Curated "community picks" section showing player-created levels via URL-encoded sharing.

**Items:**
1. Create curated list of 20 community levels as JSON data embedded in the game
2. Add "🌐 Community Levels" section on level select screen below Challenge Mode
3. Display community levels as cards with: name, creator (optional), difficulty estimate, play count
4. Each community level loads via the existing `#custom=` URL mechanism
5. Add "Featured Level of the Week" spotlight at the top of community section
6. Add difficulty rating system for community levels (Easy/Medium/Hard based on input/output count + truth table complexity)
7. Add "Submit Your Level" button that generates a shareable URL + copy-to-clipboard
8. Track completed community levels separately in localStorage
9. Add "Community Creator" achievement for sharing 3+ custom levels
10. Add upvote counter (client-side tracking, no server needed for MVP)

## Day 15 — Adaptive Challenge Difficulty

**Summary:** Track player skill and generate challenges at their edge of competence.

**Items:**
1. Calculate player "skill score" from: levels completed, average stars, solve times, hint usage
2. Skill levels: Novice (0-30), Intermediate (31-60), Advanced (61-85), Expert (86-100)
3. Adaptive challenges pick input/output count and truth table complexity based on skill score
4. Novice: 2x1 curated patterns, Intermediate: 3x1 or 2x2, Advanced: 3x2, Expert: 4x1 or 4x2
5. Show "Recommended for you" difficulty badge on generated challenges
6. After solving, adjust skill score: fast solve with few gates = score up, hints/retries = score down
7. Track skill history over time, show graph in Logic Profile
8. Add "Push My Limits" button that generates one tier above current skill level
9. Ensure skill score persists across sessions (localStorage)
10. Show skill level on Logic Profile page with progress bar to next level

## Day 16 — Solution Replay Viewer

**Summary:** Watch your own solution play back with signal flow visualization.

**Items:**
1. Leverage existing `_replayActions` recording (already captures gate placement + wire drawing with timestamps)
2. Add "📹 Watch Replay" button on completed level star display
3. Replay viewer: progressive playback of recorded actions at 2x speed
4. Show ghost cursor following the recorded mouse positions
5. Play original audio cues at each action (gate place, wire connect) during replay
6. Add playback controls: play/pause, speed (1x/2x/4x), skip to end
7. After replay ends, run simulation automatically with signal flow animation
8. Add "Share Replay" that encodes replay data into a shareable URL
9. Limit replay data size: only store gate type/position and wire connections, not mouse movements
10. Add "Compare with Optimal" toggle that shows ghost overlay of optimal solution alongside replay

## Day 17 — PWA Offline + Push Notifications

**Summary:** Harden offline support and add push notifications for daily challenges.

**Items:**
1. Audit service worker: ensure all game assets (JS, CSS, HTML, SVG) are cached for offline play
2. Add cache versioning: bump cache version on each deploy, clean old caches
3. Add offline indicator: show subtle "📴 Offline" badge when navigator.onLine is false
4. Ensure daily challenge generation works offline (it uses date-based seed — should work)
5. Add "Install App" prompt for mobile users (beforeinstallprompt event)
6. Add push notification permission request (subtle, after 3+ sessions)
7. Daily notification at player's typical play time: "🔔 Today's Daily Challenge is ready!"
8. Weekly notification: "🏗️ New Puzzle of the Week!"
9. Streak at-risk notification: "🔥 Your 5-day streak expires tonight — play now!"
10. Add notification settings in settings section (on/off toggle per notification type)

## Day 18 — Sub-Circuit Abstraction System

**Summary:** Let players package solved circuits as custom gates for use in later levels.

**Items:**
1. After completing a level, offer "Save as Custom Gate" option
2. Custom gate stores: truth table, gate count, name, and visual appearance (colored block with custom label)
3. Add "Custom Gates" section to toolbox when playing sandbox or challenge mode
4. Custom gate behaves like a black-box: inputs go in, truth table outputs come out
5. Limit custom gate usage to sandbox and challenge modes (not campaign — keeps campaign pure)
6. Show custom gate internals on hover (mini-preview of internal circuit)
7. Allow renaming custom gates (e.g., "My Half Adder", "My MUX")
8. Store custom gates in localStorage with 10-gate limit
9. Import/export custom gates as part of progress sync
10. Add "Custom Gate Master" achievement for creating 5 custom gates

## Day 19 — Stats Dashboard Overhaul

**Summary:** Transform the basic stats page into a rich analytics dashboard with charts.

**Items:**
1. Add "Time Played Per Day" bar chart (last 14 days) using canvas rendering
2. Add "Stars Over Time" line graph showing cumulative stars by completion date
3. Add "Gate Efficiency" radar chart: per-chapter ratio of player gates vs optimal gates
4. Add "Solve Time Distribution" histogram: how long levels typically take the player
5. Add "Most Replayed Levels" list — levels with the most auto-save restores or retries
6. Add "Skill Progression" line showing adaptive difficulty score over time
7. Add "Session History" table: date, levels played, stars earned, time spent
8. Export stats as shareable image (similar to share card but for overall stats)
9. Add "Compare with Average" overlay on all charts showing pseudo-average player data
10. Performance: render charts lazily, cache chart images until stats change

## Day 20 — Mobile Optimization Pass

**Summary:** Polish the mobile experience — larger touch targets, better layout, gesture improvements.

**Items:**
1. Increase pin touch target radius from 36px to 44px (Apple HIG minimum)
2. Add double-tap gate to open context menu: delete, duplicate, info
3. Improve toolbox layout on mobile: horizontal scrolling strip at bottom instead of sidebar
4. Add swipe-left on level select to quick-access next chapter
5. Fix info panel on mobile: auto-collapse to "sticky footer" showing only RUN + gates + result
6. Add pull-to-refresh on level select (reload progress)
7. Improve gate drag ghost: larger on mobile, show landing zone preview
8. Add haptic feedback to RUN button press (longer vibration pattern)
9. Test and fix layout on iPhone SE (320px width) and iPad (landscape)
10. Add landscape-specific layout that uses horizontal space for toolbox + truth table side-by-side

## Day 21 — Wire Routing Improvement

**Summary:** Upgrade wire rendering from simple bezier to L-shaped orthogonal routing that avoids gates.

**Items:**
1. Implement A* pathfinding on 20px grid for wire routing (from output pin to input pin)
2. Wire path avoids gate bounding boxes (with 10px padding)
3. Draw wires as orthogonal segments (horizontal → vertical → horizontal) with rounded corners
4. Maintain bezier fallback for wires that can't find orthogonal path (very long distances)
5. Add wire "routing quality" to aesthetics score calculation
6. Wire segments highlight independently on hover (not entire wire)
7. Add wire label showing signal value (0 or 1) at midpoint during simulation
8. Animate signal flow along orthogonal path segments (dot travels corner-by-corner)
9. Performance: cache wire paths, only recalculate when gates/I/O nodes are moved
10. Option to toggle between "clean routing" and "free bezier" wire styles in settings

## Day 22 — Multi-Language Infrastructure

**Summary:** Add i18n framework for gate names, descriptions, hints, and UI strings.

**Items:**
1. Create `i18n.js` module with language packs: `en` (default), structure for `es`, `zh`, `ja`, `de`
2. Extract all user-facing strings from levels.js, ui.js, main.js into i18n keys
3. Gate names: AND, OR, NOT, XOR, NAND, NOR → localized equivalents
4. Level descriptions and hints: translate for en, add placeholder keys for other languages
5. UI strings: "Build your circuit", "CIRCUIT CORRECT!", button labels, etc.
6. Add language selector in settings section (dropdown or flag buttons)
7. Store selected language in localStorage, apply on load
8. Ensure truth table column headers use translated labels
9. Right-to-left (RTL) consideration: add `dir="rtl"` support for Arabic/Hebrew future support
10. Community translation contribution guide in README

## Day 23 — Timed Challenge Ranking

**Summary:** Add time-based ranking to daily challenges with percentile display.

**Items:**
1. After daily challenge completion, show "Your time: X:XX — faster than Y% of players"
2. Generate percentile from seeded distribution (no server needed): use date seed + solve time to place on bell curve
3. Show rank badges: 🥇 Top 10%, 🥈 Top 25%, 🥉 Top 50%
4. Add "Daily Challenge History" section in stats showing last 30 days: date, gates, time, rank
5. Add "Daily Best" tracking: lowest gate count and fastest time for each day's challenge
6. Show "today's top score" generated from seed (gives players a target to beat)
7. Add timer prominently displayed during daily challenge (already hidden for campaign)
8. After completion, show split times: "Time to first gate: Xs, Time to first wire: Xs, Total: Xs"
9. Add "Daily Streaker" achievement: rank in top 25% for 5 consecutive days
10. Share daily result with rank: "⚡ Signal Circuit Daily — Top 15%! 🥈"

## Day 24 — Canvas Performance Optimization

**Summary:** Batch draw calls, optimize particle system, add OffscreenCanvas for heavy rendering.

**Items:**
1. Batch gate rendering: group gates by type, draw all gates of same type in one pass (reduce context switches)
2. Use OffscreenCanvas for celebration particles (separate from main game canvas)
3. Implement dirty-region rendering: only redraw changed areas instead of full canvas clear
4. Pool all canvas objects: gates, wires, I/O nodes maintain their own path caches
5. Reduce breadboard grid rendering: draw to offscreen buffer once, blit on each frame
6. Cap particle count more aggressively: 100 max celebration particles (currently 200 theoretical)
7. Use `requestIdleCallback` for non-critical rendering (ghost overlay, grid snap preview)
8. Profile and optimize `topologicalSort`: cache result until circuit topology changes
9. Reduce DOM queries: cache all frequently-accessed elements in constructor
10. Add FPS counter in debug mode (toggled by `game.debug = true`) for performance monitoring

## Day 25 — Save Slots + Cloud Sync Prep

**Summary:** Multiple save profiles and architecture for future cloud sync.

**Items:**
1. Add "Save Profiles" section in settings: Profile 1, Profile 2, Profile 3
2. Each profile has independent: progress, stats, achievements, cosmetics, custom gates
3. Default: Profile 1 (migrate existing localStorage data)
4. Profile switcher: dropdown in settings with current profile name
5. Allow naming profiles (e.g., "Mike", "Mark", "Demo")
6. Export profile as JSON file (full state dump with versioning)
7. Import profile from JSON file (validate schema, merge or replace)
8. Add "Copy Profile" function to duplicate a profile
9. Prepare sync architecture: each profile has UUID, lastModified timestamp, schema version
10. Add "Reset Profile" with double-confirmation

## Day 26 — Campaign Mode: Relaxed vs Hardcore

**Summary:** Two difficulty modes for the campaign — Relaxed (chill learning) and Hardcore (mastery).

**Items:**
1. Add mode selector on first launch or in settings: "📘 Relaxed" vs "⚡ Hardcore"
2. Relaxed mode: unlimited hints (no token cost), no star pressure messaging, larger time thresholds, encouraging messages on failure
3. Hardcore mode: no hints at all, par timer visible, fail count tracked, "optimal or nothing" star thresholds
4. Relaxed mode: show truth table permanently expanded, add "explain this gate" tooltips inline
5. Hardcore mode: truth table collapses after 10 seconds, no difficulty badges, no "Used in" hints
6. Both modes share same levels — only the framing and support systems differ
7. Track mode separately per profile; allow switching mid-campaign (warn about progress impact)
8. Hardcore completion badge on level select (separate from regular stars)
9. Add "Hardcore Completer" achievement: finish all campaign levels in hardcore mode
10. Default to Relaxed for placement test score 0-1, Hardcore suggestion for score 3

## Day 27 — Social Share Enhancement

**Summary:** Rich share cards, social media integration, and "challenge a friend" improvements.

**Items:**
1. Generate Open Graph meta tags for friend challenge URLs (title, description, image)
2. Add "Share to Twitter/X" button with pre-formatted tweet text
3. Generate animated GIF of solution replay (using canvas recording + GIF encoder library)
4. Improve share card design: add QR code linking to the game
5. Add "Share Campaign Progress" that generates a summary card (levels completed, stars, achievements)
6. Friend challenge improvement: show sender's name (stored locally) in challenge URL
7. Add "Challenge Leaderboard" for friend challenges: track who beat whose score
8. Deep-link support: friend challenge URLs should work as app deep links on PWA
9. Add "Invite a Friend" button with personalized invitation message
10. Track social shares in stats (total shares, share types)

## Day 28 — Screen Reader Accessibility

**Summary:** Full screen reader support with ARIA annotations and circuit topology descriptions.

**Items:**
1. Add `aria-label` to all interactive canvas elements via overlay div with positioned buttons
2. Describe circuit topology in text: "Circuit has 2 inputs (A, B), 1 OR gate, 1 output (OUT). A connects to OR input 1. B connects to OR input 2. OR output connects to OUT."
3. Add `aria-live="assertive"` announcements for simulation results
4. Make truth table screen-reader-friendly with proper `scope="col"` and `scope="row"` headers
5. Add "Circuit Description" button in accessible wiring panel that reads out current topology
6. Keyboard trap prevention: ensure Escape always returns to a known state
7. Focus management: auto-focus appropriate element when opening modals/switching screens
8. Add skip-to-content links for level select navigation
9. Test with VoiceOver (macOS) and NVDA (Windows) — document any workarounds
10. Add "Accessible Mode" toggle that enables all accessibility features as a bundle

## Day 29 — Endgame Content: Mastery Challenges

**Summary:** Post-campaign mastery content that gives completionists a reason to return.

**Items:**
1. Unlock "Mastery Challenges" after all campaign levels completed
2. Mastery Challenge 1: "Build XOR from only NAND gates" (4 NAND gates optimal)
3. Mastery Challenge 2: "Build a Full Adder from only NOR gates"
4. Mastery Challenge 3: "Build a 3-to-8 decoder" (8 outputs, massive but doable)
5. Mastery Challenge 4: "Reverse engineer a 3-input mystery gate" (player must deduce truth table by experimentation)
6. Mastery Challenge 5: "Build a circuit that matches a given waveform over 8 timesteps" (sequential logic teaser)
7. Add "Mastery" tab on level select, styled in gold/purple
8. Mastery completions award unique cosmetics (gold wire color, "Logician" title)
9. Track mastery progress separately; don't affect main campaign stats
10. Add "Master Logician" final achievement for completing all mastery challenges

## Day 30 — Polish Pass + Phase 3 Ship

**Summary:** Final bug fixes, performance testing, and Phase 3 release.

**Items:**
1. Full regression test: play through all campaign levels, challenge modes, and new features
2. Mobile testing pass: test on iPhone (Safari), Android (Chrome), iPad (landscape + portrait)
3. Performance profiling: ensure 60fps on mid-range devices for all new features
4. Audit localStorage usage: ensure total storage stays under 5MB with all new features
5. Update "How to Play" modal with any new mechanics or features
6. Update Gate Encyclopedia if any new gate types were added
7. Update achievement descriptions to match any changed criteria
8. Clean up console.log statements and debug code
9. Update manifest.json and service worker cache list for new assets
10. Git tag as `v3.0-phase3`, update README with Phase 3 changelog
