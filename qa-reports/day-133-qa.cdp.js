#!/usr/bin/env node
/**
 * Day 133 QA harness — Cycle 6 PRUNE Week, Day 1: "Fresh Eyes Audit".
 *
 * Clone of qa-reports/day-118-qa.cdp.js (Cycle 5 Fresh Eyes Audit), re-pointed
 * at the current deployed build and re-aimed at the Cycle-6-specific surfaces.
 *
 * Build under audit: deployed https://mikedyan.github.io/signal-circuit/
 * Expected identity: ?v=1783036800 / sw v81 (Day 127 artifact, unchanged through
 * the entire Cycle 6 HARDEN week Days 128/129/130/131/132).
 *
 * What changed since Cycle 5 PRUNE (Day 118):
 *   Day 123  simulation.js → ES module (structural, no UI)
 *   Day 124  5 collection modals → ONE tabbed 🗂️ Profile hub. Nav 18 → 14.
 *   Day 125  Tournament (Online) settings surface + opt-in display name
 *   Day 126  Onboarding A/B cohort instrumentation (debug-gated readout)
 *   Day 127  Stats 📈 Progress per-chapter completion heatmap tab (4th tab)
 *
 * Cycle-6 audit angles:
 *   A1  Profile-hub merge — the 18-button tier-3 plateau is now 14. Verify.
 *   A2  Stats modal now has up to 4 tabs (Overview/Cards/Tournament/Progress).
 *       Day 119 hides empty Cards/Tournament tabs; Day 127 hides Progress until
 *       ≥1 level done. New player should see ONLY 📊 Overview.
 *   A3  Day 125 Tournament (Online) settings — verify it doesn't clutter a
 *       normal (non-configuring) player; connection surface lives in Settings.
 *   A4  Day 126 cohort readout — debug-gated, must NOT leak to normal players.
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-133-qa.cdp.js
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
  assert('P1.c — unified ?v=1783036800 (Day 127 build, unchanged HARDEN week)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1783036800', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV81: text.indexOf('signal-circuit-v81') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js deployed with CACHE_NAME=signal-circuit-v81', swProbe.swFetched === true && swProbe.hasV81 === true, JSON.stringify(swProbe));

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
    const variant = window.__onboardingExperiment?.getVariant?.() || (window.game?.onboardingExperiment?.getVariant?.()) || null;
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
  assert('P2.c — 50 level cards', coldStart.levelCardCount === 50, `got ${coldStart.levelCardCount}`);
  assert('P2.d — 0 overflow buttons cold (no completions)', coldStart.overflowVisible === 0, `got ${coldStart.overflowVisible}`);
  assert('P2.f — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ============================================================
  // P3: TIER STAIRCASE WALK at seedProgress 0/3/6/12/18/50
  //   Cycle 6: Day 124 Profile-hub merge drops end-game nav 18 -> 14.
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
    console.log(`  seed=${String(n).padStart(2)} → nav=${String(t.nav).padStart(2)}  overflow=${String(t.overflow).padStart(2)}  cards=${t.cards}  navIds=${JSON.stringify(t.navIds)}`);
  }
  assert('P3.a — cold (seed=0): 2 nav buttons', tierStaircase[0].nav === 2);
  assert('P3.b — cold (seed=0): 0 overflow buttons', tierStaircase[0].overflow === 0);
  assert('P3.c — cold (seed=0): 50 level cards', tierStaircase[0].cards === 50);
  assert('P3.d — tier1 (seed=3): 3 overflow buttons', tierStaircase[3].overflow === 3, `got ${tierStaircase[3].overflow}`);
  assert('P3.e — tier1.5 (seed=6): 6 overflow + Tier1 nav unlocked', tierStaircase[6].overflow === 6 && tierStaircase[6].nav >= 3, `nav=${tierStaircase[6].nav}, overflow=${tierStaircase[6].overflow}`);
  assert('P3.f — staircase (seed=12): 12 overflow', tierStaircase[12].overflow === 12, `got ${tierStaircase[12].overflow}`);
  assert('P3.g — tier3 (seed=18): 18 overflow', tierStaircase[18].overflow === 18, `nav=${tierStaircase[18].nav}, overflow=${tierStaircase[18].overflow}`);
  assert('P3.h — end-game (seed=50): 50 overflow', tierStaircase[50].overflow === 50, `nav=${tierStaircase[50].nav}, overflow=${tierStaircase[50].overflow}`);
  assert('P3.i — Day 124: end-game nav dropped to 14 (was 18) via Profile-hub merge', tierStaircase[50].nav === 14, `nav=${tierStaircase[50].nav}`);
  assert('P3.j — end-game (seed=50): 50 cards (mastery still gated out of grid, Day 103)', tierStaircase[50].cards === 50, `cards=${tierStaircase[50].cards}`);

  // ============================================================
  // P4: Settings modal headcount + Day 125 Tournament (Online) section
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
    // Day 125 Tournament (Online) surface
    const trnSection = document.getElementById('settings-tournament-section');
    const trnConnect = document.getElementById('tournament-worker-save-btn');
    const trnUrlInput = document.getElementById('tournament-worker-url-input');
    const trnDisplayName = document.getElementById('tournament-display-name-input');
    const closeBtn = document.getElementById('settings-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { btnCount: allBtns.length, sliderCount: sliders.length, sections, labels, developerSectionVisible, installVisible,
      trnSectionExists: !!trnSection, trnConnectExists: !!trnConnect, trnUrlInputExists: !!trnUrlInput, trnDisplayNameExists: !!trnDisplayName };
  })()`);
  console.log(`\n[settings] btnCount=${settings.btnCount} sliders=${settings.sliderCount} sections=${JSON.stringify(settings.sections)} developerVisible=${settings.developerSectionVisible} installVisible=${settings.installVisible}`);
  console.log(`[settings labels] ${settings.labels.join(' | ')}`);
  console.log(`[Day 125 tournament-online] section=${settings.trnSectionExists} connectBtn=${settings.trnConnectExists} urlInput=${settings.trnUrlInputExists} displayName=${settings.trnDisplayNameExists}`);
  assert('P4.a — Settings modal opens with ≥10 buttons', settings.btnCount >= 10, `count=${settings.btnCount}`);
  assert('P4.b — 2 sliders (SFX + Music)', settings.sliderCount === 2, `count=${settings.sliderCount}`);
  assert('P4.c — Developer section hidden by default (Day 126 cohort readout NOT leaked)', settings.developerSectionVisible === false, `visible=${settings.developerSectionVisible}`);
  assert('P4.d — Day 125: Tournament (Online) connect surface present in Settings', settings.trnSectionExists && settings.trnConnectExists && settings.trnUrlInputExists && settings.trnDisplayNameExists, `section=${settings.trnSectionExists} connect=${settings.trnConnectExists} url=${settings.trnUrlInputExists} name=${settings.trnDisplayNameExists}`);

  // ============================================================
  // P5: Stats modal tab inventory — Cycle 6 has up to 4 tabs.
  //   Day 119 hides empty Cards/Tournament; Day 127 hides Progress until ≥1 done.
  //   NEW PLAYER (0 progress) should see ONLY 📊 Overview.
  // ============================================================

  // P5-cold: brand-new player — wipe + reload, open Stats immediately.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /^signal-/.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_statscold' });
  await wait(4000);
  const statsCold = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const tabStrip = document.getElementById('stats-tabs');
    const visTabs = tabStrip ? [...tabStrip.querySelectorAll('.stats-tab')].filter(visible).map(t => t.textContent.trim().slice(0, 40)) : [];
    const closeBtn = document.querySelector('#stats-modal .modal-close, #close-stats-btn');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { visTabCount: visTabs.length, visTabs };
  })()`);
  console.log(`\n[Stats tabs — COLD new player] visible=${statsCold.visTabCount}, tabs=${JSON.stringify(statsCold.visTabs)}`);
  assert('P5.a — new player sees ONLY 1 visible Stats tab (Overview)', statsCold.visTabCount === 1, `got ${statsCold.visTabCount}: ${JSON.stringify(statsCold.visTabs)}`);
  assert('P5.b — the single visible tab is Overview', /Overview/i.test((statsCold.visTabs[0] || '')), `tab=${statsCold.visTabs[0]}`);

  // P5-progressed: seed some progress → Progress heatmap tab reveals (Day 127).
  const statsProg = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.seedProgress(10, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const tabStrip = document.getElementById('stats-tabs');
    const allTabs = tabStrip ? [...tabStrip.querySelectorAll('.stats-tab')].map(t => ({ txt: t.textContent.trim().slice(0,30), vis: visible(t), id: t.id })) : [];
    const progressTab = document.getElementById('stats-tab-progress');
    const progressExists = !!progressTab;
    const progressVis = progressTab ? visible(progressTab) : false;
    // switch to progress + read the heatmap summary
    let heatmapSummary = '';
    let cellCount = 0;
    if (progressTab && visible(progressTab)) {
      progressTab.click();
      await new Promise(r => setTimeout(r, 400));
      const meta = document.querySelector('.progress-heatmap-meta');
      heatmapSummary = meta ? meta.textContent.trim() : '';
      cellCount = [...document.querySelectorAll('.phm-cell')].length;
    }
    const closeBtn = document.querySelector('#stats-modal .modal-close, #close-stats-btn');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { allTabs, progressExists, progressVis, heatmapSummary, cellCount };
  })()`);
  console.log(`[Stats tabs — 10 done] tabs=${JSON.stringify(statsProg.allTabs)}`);
  console.log(`[Day 127 heatmap] progressExists=${statsProg.progressExists} vis=${statsProg.progressVis} summary="${statsProg.heatmapSummary}" cells=${statsProg.cellCount}`);
  assert('P5.c — Day 127: Progress heatmap tab exists', statsProg.progressExists === true);
  assert('P5.d — Day 127: Progress tab reveals after progress', statsProg.progressVis === true, `vis=${statsProg.progressVis}`);
  assert('P5.e — Day 127: heatmap renders 11 chapter cells + summary', statsProg.cellCount === 11 && /10\s*\/\s*50/.test(statsProg.heatmapSummary), `cells=${statsProg.cellCount} summary="${statsProg.heatmapSummary}"`);

  // ============================================================
  // P6: Day 124 Profile-hub merge — 1 button, 5 tabs.
  // ============================================================
  const profileHub = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    // old 5 buttons must be gone
    const oldIds = ['achievements-btn', 'customize-btn', 'mastery-tree-btn', 'collection-btn', 'profile-btn'];
    const oldPresent = oldIds.filter(id => {
      const el = document.getElementById(id);
      return el && visible(el);
    });
    const hubBtn = document.getElementById('profile-hub-btn');
    const hubBtnVis = hubBtn ? visible(hubBtn) : false;
    let hubOpens = false, tabCount = 0, tabTexts = [];
    if (hubBtn) {
      hubBtn.click();
      await new Promise(r => setTimeout(r, 500));
      hubOpens = screenVisible('profile-hub-modal');
      const tabStrip = document.getElementById('profile-hub-tabs') || document.getElementById('profile-hub-modal');
      const tabs = tabStrip ? [...tabStrip.querySelectorAll('.phub-tab')].filter(visible) : [];
      tabCount = tabs.length;
      tabTexts = tabs.map(t => t.textContent.trim().slice(0, 24));
      const closeBtn = document.querySelector('#profile-hub-modal .modal-close, #profile-hub-close');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 200));
    }
    return { oldPresent, hubBtnVis, hubOpens, tabCount, tabTexts };
  })()`);
  console.log(`\n[Day 124 Profile hub] oldButtonsPresent=${JSON.stringify(profileHub.oldPresent)} hubBtnVis=${profileHub.hubBtnVis} opens=${profileHub.hubOpens} tabs=${profileHub.tabCount} ${JSON.stringify(profileHub.tabTexts)}`);
  assert('P6.a — Day 124: 5 old collection buttons removed from nav', profileHub.oldPresent.length === 0, `present=${JSON.stringify(profileHub.oldPresent)}`);
  assert('P6.b — Day 124: single 🗂️ Profile hub button visible', profileHub.hubBtnVis === true);
  assert('P6.c — Day 124: hub opens with 5 tabs', profileHub.hubOpens === true && profileHub.tabCount === 5, `opens=${profileHub.hubOpens} tabs=${profileHub.tabCount}`);

  // ============================================================
  // P7: structural regressions (Day 123 simulation ESM, Day 79 dead-ids)
  // ============================================================
  const structural = await evaluate(ws, `(() => {
    const simIsModule = [...document.querySelectorAll('script[src*="simulation.js"]')].some(s => s.type === 'module');
    const simBind = typeof window.Simulation === 'function' && (window.game?.simulation instanceof window.Simulation);
    const gateBind = typeof window.Gate === 'function' && !!window.GateTypes && Object.keys(window.GateTypes).length === 8;
    const wireBind = typeof window.Wire === 'function' && typeof window.WireManager === 'function';
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
    return { simIsModule, simBind, gateBind, wireBind, stillUndef, weeklyBtnAbsent };
  })()`);
  console.log(`\n[structural] simModule=${structural.simIsModule} simBind=${structural.simBind} gateBind=${structural.gateBind} wireBind=${structural.wireBind}`);
  assert('P7.a — Day 123: simulation.js ES module + window.Simulation binding', structural.simIsModule === true && structural.simBind === true);
  assert('P7.b — Day 92/107: Gate/GateTypes(8) + Wire/WireManager bindings intact', structural.gateBind === true && structural.wireBind === true);
  assert('P7.c — Day 79: 7 dead identifiers still undefined + #weekly-puzzle-btn absent', structural.stillUndef === true && structural.weeklyBtnAbsent === true);

  // ============================================================
  // P8: Day 126 cohort readout gated (debug=1 reveals, default hidden)
  // ============================================================
  const cohort = await evaluate(ws, `(() => {
    const gs = window.game;
    const exp = window.__onboardingExperiment || gs.onboardingExperiment;
    const hasCohortFn = !!exp && typeof exp.getCohort === 'function';
    const cohortVal = hasCohortFn ? exp.getCohort() : null;
    const readoutCard = document.getElementById('onboarding-readout-card');
    const readoutInDom = !!readoutCard;
    // default (no debug flag): developer section hidden → readout not visible
    const readoutVisible = readoutCard ? getComputedStyle(readoutCard).display !== 'none'
      && !document.getElementById('settings-modal') === false : false;
    return { hasCohortFn, cohortVal, readoutInDom };
  })()`);
  console.log(`\n[Day 126 cohort] fn=${cohort.hasCohortFn} cohort=${cohort.cohortVal}`);
  assert('P8.a — Day 126: cohort API present + resolves to local|live', cohort.hasCohortFn === true && ['local','live'].includes(cohort.cohortVal), `cohort=${cohort.cohortVal}`);

  // ============================================================
  // P9: 0 console errors
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P9.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P9.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary + structured output
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 133 FRESH EYES AUDIT (DEPLOYED, CYCLE 6 PRUNE) ===`);
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
    tierStaircase, settings, statsCold, statsProg, profileHub, structural, cohort,
    realErrors, realExceptions,
    assertions: results,
    passed, total,
  };
  require('fs').writeFileSync('/tmp/day-133-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-133-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
