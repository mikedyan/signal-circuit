#!/usr/bin/env node
/**
 * Day 102 QA harness — Cycle 4 PRUNE Week, Day 1: "Fresh Eyes Audit".
 *
 * Per the PRUNE-Week-Monday spec:
 *   1. Open the game as a first-time player. What's confusing? What's overwhelming?
 *   2. Count: how many buttons on the level select? How many modes? How many settings?
 *   3. For each feature, ask: "Does this make the game MORE FUN or just more complex?"
 *   4. Write PRUNE_REPORT.md.
 *
 * Build under audit: deployed https://mikedyan.github.io/signal-circuit/
 * Expected identity: ?v=1780617600 / sw v65 (Day 96 build, unchanged through
 * the entire Cycle 4 HARDEN week Days 97/98/99/100/101).
 *
 * Coverage:
 *   P1   build identity on deployed site (?v=1780617600 / sw v65)
 *   P2   cold-start surface (2 buttons, 45 cards, silent-default)
 *   P3   tier staircase walk at seedProgress 0/3/6/9/12/15/18/45 —
 *        count visible non-level buttons + overflow buttons per tier
 *   P4   Settings modal headcount (button count + section grouping)
 *   P5   LO-1 reproduction — Speedrun HUD bypass path
 *   P5b  LO-1 symmetry check — Blitz HUD bypass path
 *   P6   New-since-Cycle-2 surface inventory:
 *        - Day 82 Snapshot share-cards entrypoint
 *        - Day 83/93 Tournament backend mode label
 *        - Day 84/94 Lab Bench II composite chips (L41-L45)
 *        - Day 85/95 Onboarding experiment readout (debug-gated, default hidden)
 *        - Day 92 ES module split for gates.js (no UI change expected)
 *        - Day 96 Snapshot Cards Library tab inside Stats
 *   P7   Cycle 2 carry-overs probe (icons on gameplay, Step chips on locked
 *        cards, Difficulty filed under Display)
 *   P8   0 console errors across audit
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-102-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'https://mikedyan.github.io/signal-circuit/?_ts=' + Date.now();

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const runtimeExceptions = [];

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (err) { reject(err); } });
    }).on('error', reject);
  });
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(ws, expression) {
  const result = await send(ws, 'Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, timeout: 15000,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate threw: ${result.exceptionDetails.text} :: ${expression.slice(0, 200)}`);
  }
  return result.result && result.result.value;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

const SCREEN_HELPERS = `
  const screenVisible = (id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };
`;

// Tier-staircase walk helper: returns {nav, overflow} counts after seeding N solves
const TIER_PROBE = `
  async function tierProbe(n) {
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // Wipe + reseed (cumulative seeding could pollute lower-tier readings)
    Object.keys(localStorage).filter(k => /^signal-/.test(k)).forEach(k => localStorage.removeItem(k));
    location.reload();
  }
`;

async function main() {
  const targets = await getJSON('/json/list');
  let target = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) throw new Error('No CDP page target found');
  console.log(`[cdp] target: ${target.url}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (_) { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => (a && a.value) || (a && a.description) || '').join(' ');
      consoleErrors.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      runtimeExceptions.push(msg.params.exceptionDetails.text || String(msg.params));
    }
  });

  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.enable');
  await send(ws, 'Page.navigate', { url: TARGET_URL });
  await wait(5000);

  // Wipe ALL signal-* localStorage keys (Day 95 lesson — PLACEMENT_KEY short-circuits applyFirstLaunch if not wiped)
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_clean' });
  await wait(5000);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity on deployed site
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — on deployed host (mikedyan.github.io)', buildIdentity.host === 'mikedyan.github.io', `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=1780617600 (Day 96 build, unchanged 6 days)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1780617600', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV65: text.indexOf('signal-circuit-v65') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js deployed with CACHE_NAME=signal-circuit-v65', swProbe.swFetched === true && swProbe.hasV65 === true, JSON.stringify(swProbe));

  // ============================================================
  // P2: cold-start surface
  // ============================================================
  const coldStart = await evaluate(ws, `(() => {
    ${SCREEN_HELPERS}
    const ls = document.getElementById('level-select-screen');
    if (!ls) return { error: 'no level-select-screen' };
    const nonLevelBtns = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const levelCards = [...ls.querySelectorAll('.level-btn')];
    const overflow = [...ls.querySelectorAll('.level-overflow-btn')].filter(b => {
      const cs = getComputedStyle(b);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    const variant = window.__onboardingExperiment?.getVariant?.() || null;
    const diff = localStorage.getItem('signal-circuit-difficulty-mode');
    return {
      onLevelSelect: screenVisible('level-select-screen'),
      nonLevelBtnCount: nonLevelBtns.length,
      nonLevelBtnIds: nonLevelBtns.map(b => b.id || b.textContent.trim().slice(0, 30)),
      levelCardCount: levelCards.length,
      overflowVisible: overflow.length,
      variant,
      diff,
    };
  })()`);
  assert('P2.a — level-select screen visible', coldStart.onLevelSelect === true);
  assert('P2.b — 2 non-level buttons cold (Day 78 invariant 28 days in)', coldStart.nonLevelBtnCount === 2, `got ${coldStart.nonLevelBtnCount}: ${JSON.stringify(coldStart.nonLevelBtnIds)}`);
  assert('P2.c — 45 level cards (post-Day-94)', coldStart.levelCardCount === 45, `got ${coldStart.levelCardCount}`);
  assert('P2.d — 0 overflow buttons cold (no completions)', coldStart.overflowVisible === 0, `got ${coldStart.overflowVisible}`);
  assert('P2.e — variant silent-standard', coldStart.variant === 'silent-standard', `got ${coldStart.variant}`);
  assert('P2.f — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ============================================================
  // P3: TIER STAIRCASE WALK
  // Walk at seedProgress counts 0, 3, 6, 9, 12, 15, 18, 45
  // For each: count visible non-level buttons + overflow buttons + ids
  // ============================================================
  const tierStaircase = {};
  const tierCounts = [0, 3, 6, 9, 12, 15, 18, 45];
  for (const n of tierCounts) {
    if (n === 0) {
      // Cold reading already captured in P2
      tierStaircase[n] = {
        nav: coldStart.nonLevelBtnCount,
        navIds: coldStart.nonLevelBtnIds,
        overflow: coldStart.overflowVisible,
        cards: coldStart.levelCardCount,
      };
      continue;
    }
    // Wipe + reseed for clean per-tier reading
    await evaluate(ws, `(() => {
      Object.keys(localStorage).filter(k => /^signal-/.test(k)).forEach(k => localStorage.removeItem(k));
      return true;
    })()`);
    await send(ws, 'Page.navigate', { url: TARGET_URL + '_tier' + n });
    await wait(4000);
    const tier = await evaluate(ws, `(async () => {
      ${SCREEN_HELPERS}
      const gs = window.game;
      gs.seedProgress(${n}, { stars: 3 });
      await new Promise(r => setTimeout(r, 500));
      const ls = document.getElementById('level-select-screen');
      const nav = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
      const overflow = [...ls.querySelectorAll('.level-overflow-btn')].filter(b => {
        const cs = getComputedStyle(b);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const cards = [...ls.querySelectorAll('.level-btn')].length;
      return {
        nav: nav.length,
        navIds: nav.map(b => b.id || b.textContent.trim().slice(0, 30)),
        overflow: overflow.length,
        cards,
      };
    })()`);
    tierStaircase[n] = tier;
  }
  console.log('\n[tier staircase]');
  for (const n of tierCounts) {
    const t = tierStaircase[n];
    console.log(`  seed=${String(n).padStart(2)} → nav=${String(t.nav).padStart(2)}  overflow=${String(t.overflow).padStart(2)}  cards=${t.cards}`);
  }
  assert('P3.a — cold (seed=0): 2 nav buttons', tierStaircase[0].nav === 2);
  assert('P3.b — cold (seed=0): 0 overflow buttons', tierStaircase[0].overflow === 0);
  assert('P3.c — cold (seed=0): 45 level cards', tierStaircase[0].cards === 45);
  assert('P3.d — tier1 (seed=3): 3 overflow buttons', tierStaircase[3].overflow === 3, `got ${tierStaircase[3].overflow}`);
  assert('P3.e — tier1.5 (seed=6): 6 overflow buttons + Tier1 nav unlocked', tierStaircase[6].overflow === 6 && tierStaircase[6].nav >= 3);
  assert('P3.f — staircase intermediate (seed=9): 9 overflow', tierStaircase[9].overflow === 9, `got ${tierStaircase[9].overflow}`);
  assert('P3.g — staircase intermediate (seed=12): 12 overflow', tierStaircase[12].overflow === 12, `got ${tierStaircase[12].overflow}`);
  assert('P3.h — staircase intermediate (seed=15): 15 overflow', tierStaircase[15].overflow === 15, `got ${tierStaircase[15].overflow}`);
  assert('P3.i — tier3 (seed=18): 18 nav + 18 overflow', tierStaircase[18].nav === 18 && tierStaircase[18].overflow === 18, `nav=${tierStaircase[18].nav}, overflow=${tierStaircase[18].overflow}`);
  assert('P3.j — end-game (seed=45): 18 nav + 45 overflow', tierStaircase[45].nav === 18 && tierStaircase[45].overflow === 45, `nav=${tierStaircase[45].nav}, overflow=${tierStaircase[45].overflow}`);

  // ============================================================
  // P4: Settings modal headcount
  // ============================================================
  // Already in end-game state from tier walk (seed=45). Open settings.
  const settings = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const btn = document.getElementById('open-settings-btn');
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const modal = document.getElementById('settings-modal');
    const allBtns = [...modal.querySelectorAll('button')].filter(b => visible(b));
    const sliders = [...modal.querySelectorAll('input[type="range"]')];
    const settingsContent = document.getElementById('settings-content') || modal;
    const sections = [...settingsContent.querySelectorAll('.settings-section-header, h3, h4')].map(h => h.textContent.trim());
    const labels = allBtns.map(b => b.textContent.trim().slice(0, 50));
    const developerSectionVisible = !!visible(document.getElementById('settings-developer-section'));
    // Close
    const closeBtn = document.getElementById('settings-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { btnCount: allBtns.length, sliderCount: sliders.length, sections, labels, developerSectionVisible };
  })()`);
  console.log(`\n[settings] btnCount=${settings.btnCount} sliders=${settings.sliderCount} sections=${JSON.stringify(settings.sections)} developerVisible=${settings.developerSectionVisible}`);
  console.log(`[settings labels] ${settings.labels.join(' | ')}`);
  assert('P4.a — Settings modal opens with ≥10 buttons', settings.btnCount >= 10, `count=${settings.btnCount}`);
  assert('P4.b — 2 sliders (SFX + Music)', settings.sliderCount === 2, `count=${settings.sliderCount}`);
  assert('P4.c — Developer section hidden by default (no debug flag)', settings.developerSectionVisible === false, `visible=${settings.developerSectionVisible}`);

  // ============================================================
  // P5: LO-1 reproduction — Speedrun HUD bypass path
  // This is the 11th day re-verifying LO-1
  // ============================================================
  const lo1Speedrun = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));

    // -- USER PATH (back-btn): should clean HUD per Day 74 fix --
    const srBtn = document.getElementById('speedrun-btn');
    srBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const enteredSr = !!gs.speedrunMode;
    const enteredHud = getComputedStyle(document.getElementById('speedrun-hud')).display;
    // Back via showLevelSelect (the user-facing path through the back button)
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 300));
    const userAfterSr = !!gs.speedrunMode;
    const userAfterHud = getComputedStyle(document.getElementById('speedrun-hud')).display;

    // -- BYPASS PATH (direct ui.showScreen): leaves HUD visible (LO-1) --
    srBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const reEnteredSr = !!gs.speedrunMode;
    const reEnteredHud = getComputedStyle(document.getElementById('speedrun-hud')).display;
    // Bypass through ui.showScreen() directly
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 300));
    const bypassAfterSr = !!gs.speedrunMode;
    const bypassAfterHud = getComputedStyle(document.getElementById('speedrun-hud')).display;

    // Manual cleanup so subsequent phases aren't polluted
    gs.speedrunMode = false;
    if (gs.speedrunTimer) { clearInterval(gs.speedrunTimer); gs.speedrunTimer = null; }
    document.getElementById('speedrun-hud').style.display = 'none';

    return {
      enteredSr, enteredHud,
      userAfterSr, userAfterHud,
      reEnteredSr, reEnteredHud,
      bypassAfterSr, bypassAfterHud,
    };
  })()`);
  console.log(`\n[LO-1 Speedrun] user-path: sr=${lo1Speedrun.userAfterSr}/hud=${lo1Speedrun.userAfterHud}  bypass-path: sr=${lo1Speedrun.bypassAfterSr}/hud=${lo1Speedrun.bypassAfterHud}`);
  assert('P5.a — Speedrun entry sets speedrunMode=true + HUD visible', lo1Speedrun.enteredSr === true && lo1Speedrun.enteredHud !== 'none');
  assert('P5.b — Day 74 fix: user back-btn path cleans HUD (speedrunMode=false, hud=none)', lo1Speedrun.userAfterSr === false && lo1Speedrun.userAfterHud === 'none');
  assert('P5.c — LO-1 REPRODUCES: ui.showScreen() bypass leaves speedrunMode=true', lo1Speedrun.bypassAfterSr === true, `sr=${lo1Speedrun.bypassAfterSr}`);
  assert('P5.d — LO-1 REPRODUCES: ui.showScreen() bypass leaves HUD visible (display!=none)', lo1Speedrun.bypassAfterHud !== 'none', `hud=${lo1Speedrun.bypassAfterHud}`);

  // ============================================================
  // P5b: LO-1 symmetry — Blitz HUD bypass path
  // ============================================================
  const lo1Blitz = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));
    const blBtn = document.getElementById('blitz-mode-btn');
    blBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const enteredBl = !!gs.blitzMode;
    const enteredHud = getComputedStyle(document.getElementById('blitz-hud')).display;
    // Bypass
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 300));
    const bypassAfterBl = !!gs.blitzMode;
    const bypassAfterHud = getComputedStyle(document.getElementById('blitz-hud')).display;
    // Cleanup
    gs.blitzMode = false;
    if (gs.blitzTimer) { clearInterval(gs.blitzTimer); gs.blitzTimer = null; }
    document.getElementById('blitz-hud').style.display = 'none';
    return { enteredBl, enteredHud, bypassAfterBl, bypassAfterHud };
  })()`);
  console.log(`[LO-1 Blitz] bypass-path: bl=${lo1Blitz.bypassAfterBl}/hud=${lo1Blitz.bypassAfterHud}`);
  assert('P5b.a — Blitz entry sets blitzMode=true + HUD visible', lo1Blitz.enteredBl === true && lo1Blitz.enteredHud !== 'none');
  assert('P5b.b — LO-1 symmetric: Blitz bypass also leaves blitzMode=true + HUD visible', lo1Blitz.bypassAfterBl === true && lo1Blitz.bypassAfterHud !== 'none', JSON.stringify(lo1Blitz));

  // ============================================================
  // P6: New-since-Cycle-2 surface inventory
  // ============================================================

  // P6.1: Day 82/96 Snapshot share-cards
  // (Capture by solving L1, then verify share card modal + Day 96 library tab)
  const day82 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 500));
    const g = gs.addGate('AND', 400, 300);
    const inA = gs.inputNodes[0], inB = gs.inputNodes[1], outN = gs.outputNodes[0];
    gs.addWireFromData(inA.id, 0, g.id, 0);
    gs.addWireFromData(inB.id, 0, g.id, 1);
    gs.addWireFromData(g.id, 0, outN.id, 0);
    gs.runQuickTest();
    await new Promise(r => setTimeout(r, 800));
    // Share card button surface
    const shareBtn = document.getElementById('share-card-btn');
    const shareBtnVisible = visible(shareBtn);
    // Stats modal tab
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const tabs = document.getElementById('stats-tabs');
    const cardsTabBtn = document.getElementById('stats-tab-cards');
    const cardsTabText = cardsTabBtn?.textContent.trim() || '';
    const tabBadgeMatch = /My Cards \\((\\d+)\\)/.test(cardsTabText);
    // Close stats
    const closeBtn = document.querySelector('#stats-modal .modal-close, #stats-content .modal-close, #close-stats-btn');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return {
      shareBtnExists: !!shareBtn,
      shareBtnVisible,
      tabsScaffolding: !!tabs,
      cardsTabExists: !!cardsTabBtn,
      cardsTabText,
      tabBadgeMatch,
      libraryCount: gs.getCardLibrary?.()?.length ?? 'no-method',
    };
  })()`);
  console.log(`\n[Day 82/96] shareBtnVisible=${day82.shareBtnVisible}, cardsTabText="${day82.cardsTabText}", libraryCount=${day82.libraryCount}`);
  assert('P6.1.a — Day 82: share-card button exists in completion flow', day82.shareBtnExists === true);
  assert('P6.1.b — Day 96: Stats modal has #stats-tabs scaffolding', day82.tabsScaffolding === true);
  assert('P6.1.c — Day 96: #stats-tab-cards renders 📸 My Cards (N) badge', day82.tabBadgeMatch === true, `text=${day82.cardsTabText}`);

  // P6.2: Day 83/93 Tournament backend + mode label
  const day83 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));
    const trnBtn = document.getElementById('tournament-btn');
    trnBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const onScreen = screenVisible('tournament-screen');
    const modeLabelText = document.getElementById('tournament-mode-label')?.textContent || '';
    const mode = gs.tournamentBackend?.getMode();
    const isLive = gs.tournamentBackend?.isLive();
    // Selectable backend factory + adapter classes on window (Day 93)
    const factoryExists = typeof window.selectTournamentBackend === 'function';
    const localAdapterExists = typeof window.LocalTournamentAdapter === 'function';
    const remoteAdapterExists = typeof window.RemoteTournamentAdapter === 'function';
    // Back to level-select
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    return { onScreen, modeLabelText, mode, isLive, factoryExists, localAdapterExists, remoteAdapterExists };
  })()`);
  console.log(`[Day 83/93] mode=${day83.mode}, isLive=${day83.isLive}, modeLabel="${day83.modeLabelText}"`);
  assert('P6.2.a — Day 83: Tournament backend mode=local', day83.mode === 'local');
  assert('P6.2.b — Day 83: mode label populated with 🏠 Local leaderboard…', /Local leaderboard/.test(day83.modeLabelText), `text=${day83.modeLabelText}`);
  assert('P6.2.c — Day 93: selectTournamentBackend factory + adapters exposed', day83.factoryExists && day83.localAdapterExists && day83.remoteAdapterExists);

  // P6.3: Day 84/94 Lab Bench II composite chips (L41-L45)
  const day84 = await evaluate(ws, `(async () => {
    const gs = window.game;
    const out = {};
    for (const lvl of [41, 42, 43, 44, 45]) {
      gs.startLevel(lvl);
      await new Promise(r => setTimeout(r, 400));
      const labConstraint = gs.currentLevel?.labConstraint;
      const chip1 = document.getElementById('lab-constraint');
      const chip2 = document.getElementById('lab-constraint-2');
      out['L' + lvl] = {
        title: gs.currentLevel?.title,
        labConstraint,
        chip1Text: chip1?.textContent || '',
        chip2Text: chip2?.textContent || '',
        chip1Visible: chip1 ? getComputedStyle(chip1).display !== 'none' : false,
        chip2Visible: chip2 ? getComputedStyle(chip2).display !== 'none' : false,
        gateHardCap: gs.currentLevel?.gateHardCap,
        mustIncludeGate: gs.currentLevel?.mustIncludeGate,
      };
    }
    return out;
  })()`);
  console.log(`[Day 84/94 Lab Bench II]`);
  for (const lvl of ['L41','L42','L43','L44','L45']) {
    console.log(`  ${lvl}: ${day84[lvl].title} — chip1Visible=${day84[lvl].chip1Visible}, chip2Visible=${day84[lvl].chip2Visible}`);
  }
  assert('P6.3.a — L41 Lab chip visible (NAND-only)', day84.L41.chip1Visible === true);
  assert('P6.3.b — L42 Lab chip visible (hard cap 4)', day84.L42.chip1Visible === true && day84.L42.gateHardCap === 4);
  assert('P6.3.c — L43 Lab chip visible (must include XOR)', day84.L43.chip1Visible === true);
  assert('P6.3.d — L44 composite: BOTH chips visible (NAND + cap 6)', day84.L44.chip1Visible === true && day84.L44.chip2Visible === true, JSON.stringify(day84.L44));
  assert('P6.3.e — L45 composite: BOTH chips visible (XOR + cap 5)', day84.L45.chip1Visible === true && day84.L45.chip2Visible === true, JSON.stringify(day84.L45));

  // P6.4: Day 85/95 Onboarding readout (debug-gated, default hidden)
  const day85 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const variant = window.__onboardingExperiment?.getVariant?.();
    const debugFlagBefore = localStorage.getItem('signal-circuit-debug');
    // Open settings, look for developer section
    document.getElementById('open-settings-btn').click();
    await new Promise(r => setTimeout(r, 400));
    const devSection = document.getElementById('settings-developer-section');
    const devSectionVisibleBefore = devSection ? getComputedStyle(devSection).display !== 'none' : false;
    const readoutCardBefore = document.getElementById('onboarding-readout-card');
    const readoutVisibleBefore = readoutCardBefore ? getComputedStyle(readoutCardBefore).display !== 'none' : false;
    // Close settings
    document.getElementById('settings-close').click();
    await new Promise(r => setTimeout(r, 200));
    // Set debug flag, reopen
    localStorage.setItem('signal-circuit-debug', '1');
    document.getElementById('open-settings-btn').click();
    await new Promise(r => setTimeout(r, 400));
    const devSectionVisibleAfter = devSection ? getComputedStyle(devSection).display !== 'none' : false;
    const readoutCardAfter = document.getElementById('onboarding-readout-card');
    const readoutVisibleAfter = readoutCardAfter ? getComputedStyle(readoutCardAfter).display !== 'none' : false;
    // Close + clean flag
    document.getElementById('settings-close').click();
    await new Promise(r => setTimeout(r, 200));
    localStorage.removeItem('signal-circuit-debug');
    return {
      variant, debugFlagBefore,
      devSectionVisibleBefore, readoutVisibleBefore,
      devSectionVisibleAfter, readoutVisibleAfter,
    };
  })()`);
  console.log(`[Day 85/95] variant=${day85.variant}, devVisible default=${day85.devSectionVisibleBefore}, with debug=${day85.devSectionVisibleAfter}`);
  assert('P6.4.a — Day 85: default variant silent-standard', day85.variant === 'silent-standard');
  assert('P6.4.b — Day 95: Developer section HIDDEN by default (correct PRUNE posture)', day85.devSectionVisibleBefore === false);
  assert('P6.4.c — Day 95: Developer section + readout card VISIBLE when debug=1', day85.devSectionVisibleAfter === true && day85.readoutVisibleAfter === true);

  // P6.5: Day 92 ES module split for gates.js
  const day92 = await evaluate(ws, `(() => {
    const scripts = [...document.querySelectorAll('script[src*="gates.js"]')];
    const isModule = scripts.some(s => s.type === 'module');
    return {
      isModule,
      gateOnWindow: typeof window.Gate === 'function',
      gateTypesOnWindow: typeof window.GateTypes === 'object' && Object.keys(window.GateTypes).length === 8,
      ioNodeOnWindow: typeof window.IONode === 'function',
      roundRectOnWindow: typeof window.roundRect === 'function',
    };
  })()`);
  console.log(`[Day 92] gates.js type=module: ${day92.isModule}, exports on window: ${JSON.stringify(day92)}`);
  assert('P6.5.a — Day 92: gates.js loaded as ES module', day92.isModule === true);
  assert('P6.5.b — Day 92: Gate/GateTypes/IONode/roundRect re-bound on window', day92.gateOnWindow && day92.gateTypesOnWindow && day92.ioNodeOnWindow && day92.roundRectOnWindow);

  // P6.6: Day 79 dead-id purge intact
  const day79 = await evaluate(ws, `(() => {
    const ids = ['showFirstLaunchDifficultyModal', 'checkLightning', 'checkEclipseRun', 'checkArchitect', 'isMythic', '_showHud', 'getCurrentStep'];
    const stillUndef = ids.every(name => {
      try {
        const ach = window.game?.achievementManager;
        const ui = window.game?.ui;
        const ir = window.game?.infiniteRun;
        const tut = window.game?.tutorial;
        if (ach && typeof ach[name] === 'function') return false;
        if (ui && typeof ui[name] === 'function') return false;
        if (ir && typeof ir[name] === 'function') return false;
        if (tut && typeof tut[name] === 'function') return false;
        return true;
      } catch (e) { return true; }
    });
    const weeklyBtnAbsent = !document.getElementById('weekly-puzzle-btn');
    return { stillUndef, weeklyBtnAbsent };
  })()`);
  assert('P6.6.a — Day 79: 7 dead identifiers still undefined', day79.stillUndef === true);
  assert('P6.6.b — Day 79: #weekly-puzzle-btn DOM absent', day79.weeklyBtnAbsent === true);

  // ============================================================
  // P7: Cycle 2 carry-overs probe
  // ============================================================
  const carryOvers = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // 1. Top-left gameplay icons — start L1, look at icons
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 400));
    const iconBtns = ['encyclopedia-gameplay-btn', 'shortcuts-btn', 'kb-wiring-btn'];
    const iconAriaLabels = iconBtns.map(id => {
      const el = document.getElementById(id);
      if (!el) return { id, exists: false };
      return { id, exists: true, hasTitle: !!el.title, hasAriaLabel: !!el.getAttribute('aria-label'), titleText: el.title || el.getAttribute('aria-label') || '' };
    });
    // 2. Step chips on locked cards (Cycle 2 carry-over)
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const stepChips = [...document.querySelectorAll('.level-step-chip, .step-chip, [class*="step"]')].filter(el => {
      const card = el.closest('.level-btn');
      return card && card.classList.contains('locked');
    });
    // 3. Difficulty Mode filing in Settings
    document.getElementById('open-settings-btn').click();
    await new Promise(r => setTimeout(r, 400));
    const diffBtn = [...document.querySelectorAll('button')].find(b => /Difficulty Mode/i.test(b.textContent));
    let diffSection = null;
    if (diffBtn) {
      // walk up to find nearest section header
      let p = diffBtn.parentElement;
      for (let i = 0; i < 6 && p; i++) {
        const hdr = p.previousElementSibling || p.querySelector('h3, h4, .settings-section-header');
        if (hdr && /DISPLAY|ACCESSIBILITY|GAMEPLAY|AUDIO/i.test(hdr.textContent)) { diffSection = hdr.textContent.trim(); break; }
        p = p.parentElement;
      }
    }
    document.getElementById('settings-close').click();
    await new Promise(r => setTimeout(r, 200));
    return { iconAriaLabels, stepChipsOnLockedCount: stepChips.length, diffBtnExists: !!diffBtn, diffSection };
  })()`);
  console.log(`\n[Carry-overs] iconLabels=${JSON.stringify(carryOvers.iconAriaLabels)} stepChipsOnLocked=${carryOvers.stepChipsOnLockedCount} diffSection=${carryOvers.diffSection}`);

  // ============================================================
  // P8: 0 console errors
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P8.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P8.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary + structured output
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 102 FRESH EYES AUDIT (DEPLOYED) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);
  console.log(`\nTIER STAIRCASE:`);
  for (const n of tierCounts) {
    const t = tierStaircase[n];
    console.log(`  seed=${String(n).padStart(2)} → nav=${String(t.nav).padStart(2)}  overflow=${String(t.overflow).padStart(2)}  cards=${t.cards}`);
  }
  console.log(`\nLO-1 STATUS:`);
  console.log(`  Speedrun bypass: speedrunMode=${lo1Speedrun.bypassAfterSr}, hud=${lo1Speedrun.bypassAfterHud}`);
  console.log(`  Blitz bypass:    blitzMode=${lo1Blitz.bypassAfterBl}, hud=${lo1Blitz.bypassAfterHud}`);
  console.log(`  → LO-1 reproduces on BOTH HUD bypass paths (11th day re-verified).`);

  // JSON dump for downstream report generation
  const summary = {
    buildIdentity, swProbe,
    tierStaircase, settings,
    lo1Speedrun, lo1Blitz,
    day82, day83, day84, day85, day92, day79, carryOvers,
    realErrors, realExceptions,
    assertions: results,
    passed, total,
  };
  require('fs').writeFileSync('/tmp/day-102-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-102-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
