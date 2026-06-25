#!/usr/bin/env node
/**
 * Day 118 QA harness — Cycle 5 PRUNE Week, Day 1: "Fresh Eyes Audit".
 *
 * Per the PRUNE-Week-Monday spec:
 *   1. Open the game as a first-time player. What's confusing? overwhelming?
 *   2. Count: buttons on level select? modes? settings?
 *   3. For each feature, ask: "Does this make the game MORE FUN or just more complex?"
 *   4. Write PRUNE_REPORT.md.
 *
 * Build under audit: deployed https://mikedyan.github.io/signal-circuit/
 * Expected identity: ?v=1781395200 / sw v73 (Day 111 build, unchanged through
 * the entire Cycle 5 HARDEN week Days 112/114/115/116/117).
 *
 * Coverage:
 *   P1   build identity on deployed site (?v=1781395200 / sw v73)
 *   P2   cold-start surface (2 buttons, 50 cards, silent-default)
 *   P3   tier staircase walk at seedProgress 0/3/6/12/18/50
 *   P4   Settings modal headcount + section grouping
 *   P5   Stats modal tab inventory (Overview / My Cards / Tournament — Day 96/111)
 *   P6   New-since-Cycle-4 surface inventory:
 *        - Day 107 wires.js ES module
 *        - Day 108 Tournament Worker live label + leaderboard
 *        - Day 109 Lab Bench III L46-L50 + L48 triple-composite 3-chip HUD
 *        - Day 110 personal-best badge (#level-best-badge)
 *        - Day 111 Stats Tournament History tab
 *   P7   Cycle 4 carry-overs verify (Difficulty under Gameplay = Day 104,
 *        Install-App gated = Day 104, mastery cards out of grid = Day 103,
 *        LO-1 retired = Day 103)
 *   P8   0 console errors across audit
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-118-qa.cdp.js
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
  assert('P1.c — unified ?v=1781395200 (Day 111 build, unchanged HARDEN week)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1781395200', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV73: text.indexOf('signal-circuit-v73') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js deployed with CACHE_NAME=signal-circuit-v73', swProbe.swFetched === true && swProbe.hasV73 === true, JSON.stringify(swProbe));

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
  assert('P2.b — 2 non-level buttons cold (Day 78 invariant)', coldStart.nonLevelBtnCount === 2, `got ${coldStart.nonLevelBtnCount}: ${JSON.stringify(coldStart.nonLevelBtnIds)}`);
  assert('P2.c — 50 level cards (post-Day-109 Lab Bench III)', coldStart.levelCardCount === 50, `got ${coldStart.levelCardCount}`);
  assert('P2.d — 0 overflow buttons cold (no completions)', coldStart.overflowVisible === 0, `got ${coldStart.overflowVisible}`);
  assert('P2.e — variant silent-standard', coldStart.variant === 'silent-standard', `got ${coldStart.variant}`);
  assert('P2.f — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ============================================================
  // P3: TIER STAIRCASE WALK at seedProgress 0/3/6/12/18/50
  // ============================================================
  const tierStaircase = {};
  const tierCounts = [0, 3, 6, 12, 18, 50];
  for (const n of tierCounts) {
    if (n === 0) {
      tierStaircase[n] = {
        nav: coldStart.nonLevelBtnCount,
        navIds: coldStart.nonLevelBtnIds,
        overflow: coldStart.overflowVisible,
        cards: coldStart.levelCardCount,
      };
      continue;
    }
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
  assert('P3.c — cold (seed=0): 50 level cards', tierStaircase[0].cards === 50);
  assert('P3.d — tier1 (seed=3): 3 overflow buttons', tierStaircase[3].overflow === 3, `got ${tierStaircase[3].overflow}`);
  assert('P3.e — tier1.5 (seed=6): 6 overflow + Tier1 nav unlocked', tierStaircase[6].overflow === 6 && tierStaircase[6].nav >= 3, `nav=${tierStaircase[6].nav}, overflow=${tierStaircase[6].overflow}`);
  assert('P3.f — staircase (seed=12): 12 overflow', tierStaircase[12].overflow === 12, `got ${tierStaircase[12].overflow}`);
  assert('P3.g — tier3 (seed=18): 18 nav + 18 overflow', tierStaircase[18].nav === 18 && tierStaircase[18].overflow === 18, `nav=${tierStaircase[18].nav}, overflow=${tierStaircase[18].overflow}`);
  assert('P3.h — end-game (seed=50): 18 nav + 50 overflow', tierStaircase[50].nav === 18 && tierStaircase[50].overflow === 50, `nav=${tierStaircase[50].nav}, overflow=${tierStaircase[50].overflow}`);
  assert('P3.i — end-game (seed=50): 50 cards (mastery still gated out of grid, Day 103)', tierStaircase[50].cards === 50, `cards=${tierStaircase[50].cards}`);

  // ============================================================
  // P4: Settings modal headcount
  // ============================================================
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
    const installBtn = document.getElementById('install-app-btn');
    const installVisible = installBtn ? visible(installBtn) : false;
    const closeBtn = document.getElementById('settings-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { btnCount: allBtns.length, sliderCount: sliders.length, sections, labels, developerSectionVisible, installVisible };
  })()`);
  console.log(`\n[settings] btnCount=${settings.btnCount} sliders=${settings.sliderCount} sections=${JSON.stringify(settings.sections)} developerVisible=${settings.developerSectionVisible} installVisible=${settings.installVisible}`);
  console.log(`[settings labels] ${settings.labels.join(' | ')}`);
  assert('P4.a — Settings modal opens with ≥10 buttons', settings.btnCount >= 10, `count=${settings.btnCount}`);
  assert('P4.b — 2 sliders (SFX + Music)', settings.sliderCount === 2, `count=${settings.sliderCount}`);
  assert('P4.c — Developer section hidden by default', settings.developerSectionVisible === false, `visible=${settings.developerSectionVisible}`);

  // ============================================================
  // P5: Stats modal tab inventory (Day 96 Cards + Day 111 Tournament)
  // ============================================================
  const statsTabs = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const tabStrip = document.getElementById('stats-tabs');
    const tabs = tabStrip ? [...tabStrip.querySelectorAll('.stats-tab, button')].filter(visible).map(t => t.textContent.trim().slice(0, 40)) : [];
    const overviewTab = document.getElementById('stats-tab-overview');
    const cardsTab = document.getElementById('stats-tab-cards');
    const tournamentTab = document.getElementById('stats-tab-tournament');
    const result = {
      tabStripExists: !!tabStrip,
      tabCount: tabs.length,
      tabs,
      overviewExists: !!overviewTab,
      cardsExists: !!cardsTab,
      tournamentExists: !!tournamentTab,
      cardsText: cardsTab?.textContent.trim() || '',
      tournamentText: tournamentTab?.textContent.trim() || '',
    };
    const closeBtn = document.querySelector('#stats-modal .modal-close, #close-stats-btn');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return result;
  })()`);
  console.log(`\n[Stats tabs] count=${statsTabs.tabCount}, tabs=${JSON.stringify(statsTabs.tabs)}`);
  assert('P5.a — Stats modal has tab strip', statsTabs.tabStripExists === true);
  assert('P5.b — 3 tabs present (Overview / My Cards / Tournament)', statsTabs.overviewExists && statsTabs.cardsExists && statsTabs.tournamentExists, JSON.stringify(statsTabs.tabs));
  assert('P5.c — Day 111: Tournament tab renders 🏆 badge', /Tournament/.test(statsTabs.tournamentText), `text=${statsTabs.tournamentText}`);

  // ============================================================
  // P6: New-since-Cycle-4 surface inventory (Days 107-111)
  // ============================================================

  // P6.1: Day 107 wires.js ES module
  const day107 = await evaluate(ws, `(() => {
    const scripts = [...document.querySelectorAll('script[src*="wires.js"]')];
    const isModule = scripts.some(s => s.type === 'module');
    return {
      isModule,
      wireOnWindow: typeof window.Wire === 'function',
      wireManagerOnWindow: typeof window.WireManager === 'function',
      getWireColorsOnWindow: typeof window.getWireColors === 'function',
    };
  })()`);
  console.log(`\n[Day 107] wires.js type=module: ${day107.isModule}, exports: ${JSON.stringify(day107)}`);
  assert('P6.1.a — Day 107: wires.js loaded as ES module', day107.isModule === true);
  assert('P6.1.b — Day 107: Wire/WireManager/getWireColors re-bound on window', day107.wireOnWindow && day107.wireManagerOnWindow && day107.getWireColorsOnWindow);

  // P6.2: Day 108 Tournament Worker live label + backend
  const day108 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));
    const trnBtn = document.getElementById('tournament-btn');
    trnBtn.click();
    await new Promise(r => setTimeout(r, 700));
    const onScreen = screenVisible('tournament-screen');
    const modeLabel = document.getElementById('tournament-mode-label')?.textContent || '';
    const mode = gs.tournamentBackend?.getMode?.();
    const tabStrip = document.getElementById('tournament-screen');
    const trnTabs = tabStrip ? [...tabStrip.querySelectorAll('.tournament-tab, .tab-btn, [role=tab]')].filter(visible).map(t => t.textContent.trim().slice(0, 30)) : [];
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    return { onScreen, modeLabel, mode, trnTabs, labelLen: modeLabel.length };
  })()`);
  console.log(`[Day 108] mode=${day108.mode}, label="${day108.modeLabel}" (${day108.labelLen} chars), tabs=${JSON.stringify(day108.trnTabs)}`);
  assert('P6.2.a — Day 108: Tournament screen opens', day108.onScreen === true);
  assert('P6.2.b — Day 108: backend mode=local (offline fallback default)', day108.mode === 'local', `mode=${day108.mode}`);
  assert('P6.2.c — Day 103/108: mode label compressed (≤25 chars)', day108.labelLen <= 25 && /Local leaderboard/.test(day108.modeLabel), `label="${day108.modeLabel}" len=${day108.labelLen}`);

  // P6.3: Day 109 Lab Bench III L46-L50 + L48 triple-composite
  const day109 = await evaluate(ws, `(async () => {
    const gs = window.game;
    const out = {};
    for (const lvl of [46, 47, 48, 49, 50]) {
      gs.startLevel(lvl);
      await new Promise(r => setTimeout(r, 350));
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      const c3 = document.getElementById('lab-constraint-3');
      out['L' + lvl] = {
        title: gs.currentLevel?.title,
        isLab: gs.currentLevel?.isLabBench,
        maxFanOut: gs.currentLevel?.maxFanOut,
        gateHardCap: gs.currentLevel?.gateHardCap,
        c1Vis: c1 ? getComputedStyle(c1).display !== 'none' : false,
        c2Vis: c2 ? getComputedStyle(c2).display !== 'none' : false,
        c3Vis: c3 ? getComputedStyle(c3).display !== 'none' : false,
      };
    }
    return out;
  })()`);
  console.log(`[Day 109 Lab Bench III]`);
  for (const lvl of ['L46','L47','L48','L49','L50']) {
    const d = day109[lvl];
    console.log(`  ${lvl}: ${d.title} — fanOut=${d.maxFanOut} cap=${d.gateHardCap} chips(${d.c1Vis?1:0}${d.c2Vis?1:0}${d.c3Vis?1:0})`);
  }
  assert('P6.3.a — Day 109: L46-L50 all lab-bench levels', [46,47,48,49,50].every(l => day109['L'+l].isLab === true));
  assert('P6.3.b — Day 109: all have maxFanOut budget', [46,47,48,49,50].every(l => day109['L'+l].maxFanOut === 2));
  assert('P6.3.c — Day 109: L48 triple-composite shows 3 constraint chips', day109.L48.c1Vis && day109.L48.c2Vis && day109.L48.c3Vis, JSON.stringify(day109.L48));

  // P6.4: Day 110 personal-best badge
  // NB: prior phases (P5/P6.2) seeded L1 progress, so a true-cold probe needs a
  // fresh wipe+reload first (Day 117 harness-ordering lesson — clear before cold).
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /^signal-/.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_pb' });
  await wait(4000);
  const day110 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // Cold L1 entry: badge suppressed (no prior progress)
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 400));
    const badge = document.getElementById('level-best-badge');
    const coldHidden = badge ? getComputedStyle(badge).display === 'none' : null;
    // Synthetic prior best then revisit: badge shows
    gs.progress.levels[1] = { completed: true, bestGateCount: 1, bestTime: 22, stars: 3 };
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 400));
    const badge2 = document.getElementById('level-best-badge');
    const revisitVis = badge2 ? getComputedStyle(badge2).display !== 'none' : false;
    const badgeText = document.getElementById('level-best-text')?.textContent || '';
    return { badgeExists: !!badge, coldHidden, revisitVis, badgeText };
  })()`);
  console.log(`[Day 110] PB badge: coldHidden=${day110.coldHidden}, revisitVis=${day110.revisitVis}, text="${day110.badgeText}"`);
  assert('P6.4.a — Day 110: #level-best-badge exists', day110.badgeExists === true);
  assert('P6.4.b — Day 110: badge suppressed on cold L1 entry', day110.coldHidden === true);
  assert('P6.4.c — Day 110: badge visible on completed-level revisit', day110.revisitVis === true && /best/i.test(day110.badgeText), `text=${day110.badgeText}`);

  // P6.5: Day 111 Stats Tournament History tab (covered in P5; assert switch works)
  const day111 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const switchFn = typeof gs.ui._switchStatsTab === 'function';
    const histFn = typeof gs.weeklyTournament?.getSubmissionHistory === 'function';
    return { switchFn, histFn };
  })()`);
  assert('P6.5.a — Day 111: _switchStatsTab present', day111.switchFn === true);
  assert('P6.5.b — Day 111: getSubmissionHistory present', day111.histFn === true);

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
  // P7: Cycle 4 carry-overs verify (shipped Day 103/104)
  // ============================================================
  const carry = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(50, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    // Mastery cards out of grid (Day 103 cut #4): grid should be 50, mastery in modal
    const gridCards = [...document.querySelectorAll('#level-select-screen .level-btn')].length;
    // Difficulty under Gameplay (Day 104 cut #2)
    document.getElementById('open-settings-btn').click();
    await new Promise(r => setTimeout(r, 400));
    const diffBtn = document.getElementById('difficulty-mode-btn');
    let diffSection = null;
    if (diffBtn) {
      let p = diffBtn.closest('.settings-section');
      if (p) {
        const hdr = p.querySelector('.settings-section-header, h3, h4');
        diffSection = hdr ? hdr.textContent.trim() : null;
      }
      // fallback: gameplay-row wrapper
      if (!diffSection && diffBtn.closest('#settings-gameplay-row')) diffSection = 'GAMEPLAY (row)';
    }
    document.getElementById('settings-close').click();
    await new Promise(r => setTimeout(r, 200));
    return { gridCards, diffBtnExists: !!diffBtn, diffSection };
  })()`);
  console.log(`\n[Carry-overs] gridCards=${carry.gridCards}, diffSection=${carry.diffSection}`);
  assert('P7.a — Day 103: mastery cards out of grid (50 cards, not 55)', carry.gridCards === 50, `got ${carry.gridCards}`);
  assert('P7.b — Day 104: Difficulty Mode filed under Gameplay', /GAMEPLAY/i.test(carry.diffSection || ''), `section=${carry.diffSection}`);

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
  console.log(`\n=== DAY 118 FRESH EYES AUDIT (DEPLOYED) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);
  console.log(`\nTIER STAIRCASE:`);
  for (const n of tierCounts) {
    const t = tierStaircase[n];
    console.log(`  seed=${String(n).padStart(2)} → nav=${String(t.nav).padStart(2)}  overflow=${String(t.overflow).padStart(2)}  cards=${t.cards}`);
  }

  const summary = {
    buildIdentity, swProbe, coldStart,
    tierStaircase, settings, statsTabs,
    day107, day108, day109, day110, day111, day79, carry,
    realErrors, realExceptions,
    assertions: results,
    passed, total,
  };
  require('fs').writeFileSync('/tmp/day-118-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-118-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
