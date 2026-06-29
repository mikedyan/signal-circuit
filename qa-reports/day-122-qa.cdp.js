#!/usr/bin/env node
/**
 * Day 122 QA harness — Cycle 5 PRUNE Week, Day 5: "Expert Panel + Validation".
 *
 * Closes Cycle 5. Day 81 / Day 106 precedent: a pure-validation day with ZERO
 * source-file changes. Re-score the 10-dimension expert rubric (done in the
 * review, reviews/prune-cycle-5-review.md) and run a validation sweep proving
 * the build is intact and every Cycle 5 PRUNE cut survived.
 *
 * Build under test: LOCAL http://localhost:8901/  (?v=1782604800 / sw v76, the
 * Day 121 artifact — unchanged today).
 *
 * Coverage (7 phases):
 *   P1  build identity (11 cache-bust refs ?v=1782604800 / sw v76)
 *   P2  tier staircase (cold 2 nav / 50 cards → end-game 18 nav + 50 overflow)
 *       + cold-start defaults audit (SFX 0.4 / Music 0.2 / difficulty standard)
 *   P3  level samples across chapters: L1 (cold tutorial), L6 (end Ch1),
 *       L18 (Tier-3 unlock), L36 (Lab Bench I), L48 (Lab Bench III triple-composite)
 *   P4  Cycle 5 PRUNE cuts intact:
 *         Day 119 #1 — Tournament screen = This Week + Archive (no "My Best" tab)
 *         Day 119 #2 — Reset Progress typed-confirm gate
 *         Day 119 #3 — zero-count Stats tabs hidden cold (collapses to Overview)
 *         Day 120     — orphaned _renderTournamentMyBest() removed
 *         Day 121 #1  — #confirm-modal-content modalPop entrance animation
 *         Day 121 #2  — typed-confirm .is-armed red→green affordance
 *   P5  Day 79 dead-identifier purge (7 ids undefined + #weekly-puzzle-btn absent)
 *   P6  Day 92/107 ES module bindings (window.Gate/GateTypes/Wire/WireManager)
 *   P7  0 console.error / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-122-qa.cdp.js
 *   tools/cdp-launch.sh stop
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

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
  await wait(4000);

  // Cold-start wipe + reload.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_clean' });
  await wait(4000);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity (local)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — unified ?v=1782604800 (Day 121 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782604800', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV76: text.indexOf('signal-circuit-v76') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v76', swProbe.swFetched === true && swProbe.hasV76 === true, JSON.stringify(swProbe));

  // ============================================================
  // P2: tier staircase + cold-start defaults
  // ============================================================
  const stair = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 250));
    const ls = document.getElementById('level-select-screen');
    const navCount = () => [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    const overflowCount = () => [...ls.querySelectorAll('.level-overflow-btn')].filter(b => getComputedStyle(b).display !== 'none').length;
    const cardCount = () => [...ls.querySelectorAll('.level-btn')].length;
    const navCold = navCount();
    const cardsCold = cardCount();
    // cold-start defaults audit (Day 80/105 precedent)
    const audio = gs.audio;
    const defaults = {
      sfxVol: audio ? audio._sfxVol : null,
      musicVol: audio ? audio._musicVol : null,
      difficulty: localStorage.getItem('signal-circuit-difficulty-mode'),
    };
    gs.seedProgress(50, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const navEnd = navCount();
    const overflowEnd = overflowCount();
    const cardsEnd = cardCount();
    return { navCold, cardsCold, defaults, navEnd, overflowEnd, cardsEnd };
  })()`);
  console.log(`\n[Staircase] ${JSON.stringify(stair)}`);
  assert('P2.a — cold: 2 nav buttons (Day 78 invariant)', stair.navCold === 2, `got ${stair.navCold}`);
  assert('P2.b — cold: 50 level cards', stair.cardsCold === 50, `got ${stair.cardsCold}`);
  assert('P2.c — end-game: 18 nav + 50 overflow', stair.navEnd === 18 && stair.overflowEnd === 50, `nav=${stair.navEnd} overflow=${stair.overflowEnd}`);
  assert('P2.d — end-game: 50 cards (mastery out of grid)', stair.cardsEnd === 50, `got ${stair.cardsEnd}`);
  assert('P2.e — cold defaults: SFX 0.4 / Music 0.2', Math.abs(stair.defaults.sfxVol - 0.4) < 0.001 && Math.abs(stair.defaults.musicVol - 0.2) < 0.001, JSON.stringify(stair.defaults));
  assert('P2.f — cold defaults: difficulty silent-default standard', stair.defaults.difficulty === 'standard' || stair.defaults.difficulty === null, `difficulty=${stair.defaults.difficulty}`);

  // ============================================================
  // P3: level samples across chapters
  // ============================================================
  const samples = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    const out = {};
    const sample = async (id) => {
      gs.startLevel(id);
      await new Promise(r => setTimeout(r, 300));
      const lvl = gs.currentLevel;
      const labHud = document.getElementById('lab-hud');
      const runBtn = document.getElementById('run-btn');
      return {
        id: lvl ? lvl.id : null,
        isLabBench: !!(lvl && lvl.isLabBench),
        ttRows: lvl && lvl.truthTable ? lvl.truthTable.length : null,
        hints: lvl && lvl.hints ? lvl.hints.length : null,
        labHudVisible: labHud ? getComputedStyle(labHud).display !== 'none' : null,
        runLabel: runBtn ? runBtn.textContent.trim() : null,
        gameplayVisible: screenVisible('gameplay-screen'),
      };
    };
    out.l1 = await sample(1);
    out.l6 = await sample(6);
    out.l18 = await sample(18);
    out.l36 = await sample(36);
    out.l48 = await sample(48);
    // L48 triple-composite metadata (Day 109). NOTE: there is no gs.getLevel();
    // the campaign accessor is the global window.getLevel(id). After sample(48)
    // the loaded level is also gs.currentLevel, so read it directly to avoid
    // any accessor mismatch.
    let l48meta = null;
    try {
      const lvl = (typeof window.getLevel === 'function') ? window.getLevel(48) : gs.currentLevel;
      l48meta = {
        hasLabConstraint: !!(lvl && lvl.labConstraint),
        labConstraintLen: lvl && lvl.labConstraint ? lvl.labConstraint.length : null,
        maxFanOut: lvl ? lvl.maxFanOut : null,
        gateHardCap: lvl ? (lvl.gateHardCap || lvl.hardCap) : null,
      };
    } catch (e) { l48meta = { error: String(e) }; }
    out.l48meta = l48meta;
    return out;
  })()`);
  console.log(`\n[Samples] ${JSON.stringify(samples)}`);
  assert('P3.a — L1 loads, not lab bench', samples.l1.id === 1 && samples.l1.isLabBench === false && samples.l1.gameplayVisible === true, JSON.stringify(samples.l1));
  assert('P3.b — L1: 3 hints', samples.l1.hints === 3, `hints=${samples.l1.hints}`);
  assert('P3.c — L6 loads (end Ch1)', samples.l6.id === 6 && samples.l6.isLabBench === false, JSON.stringify(samples.l6));
  assert('P3.d — L18 loads (Tier-3 unlock)', samples.l18.id === 18 && samples.l18.isLabBench === false, JSON.stringify(samples.l18));
  assert('P3.e — L36 Lab Bench I: isLabBench + Lab HUD visible + Submit Blueprint', samples.l36.id === 36 && samples.l36.isLabBench === true && samples.l36.labHudVisible === true && /Submit Blueprint/.test(samples.l36.runLabel), JSON.stringify(samples.l36));
  assert('P3.f — L48 Lab Bench III: isLabBench + Lab HUD visible', samples.l48.id === 48 && samples.l48.isLabBench === true && samples.l48.labHudVisible === true, JSON.stringify(samples.l48));
  assert('P3.g — L48 triple-composite metadata (maxFanOut=2 + hardCap=3 + 3 constraint chips)', samples.l48meta.maxFanOut === 2 && samples.l48meta.gateHardCap === 3 && samples.l48meta.labConstraintLen === 3, JSON.stringify(samples.l48meta));

  // ============================================================
  // P4: Cycle 5 PRUNE cuts intact
  // ============================================================
  // Re-cold for clean Stats/tournament probing.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_prune' });
  await wait(4000);
  const prune = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(20, { stars: 3 });
    await new Promise(r => setTimeout(r, 250));

    // Day 119 #1 — Tournament screen: This Week + Archive, NO "My Best" tab.
    let tournamentTabs = null, myBestAbsent = null;
    try {
      gs.ui.showTournamentScreen();
      await new Promise(r => setTimeout(r, 250));
      const tabs = [...document.querySelectorAll('#tournament-screen .tournament-tab, #tournament-screen [data-tournament-tab]')];
      const labels = tabs.map(t => t.textContent.trim().toLowerCase());
      tournamentTabs = labels;
      myBestAbsent = !document.getElementById('tournament-tab-my-best') && !labels.some(l => /my best/.test(l));
      gs.showLevelSelect();
      await new Promise(r => setTimeout(r, 150));
    } catch (e) { tournamentTabs = { error: String(e) }; }

    // Day 120 — orphaned renderer removed.
    const orphanGone = typeof gs.ui._renderTournamentMyBest !== 'function';

    // Day 119 #3 — zero-count Stats tabs hidden cold (collapses to Overview).
    let statsCold = null;
    try {
      gs.ui.openStats ? gs.ui.openStats() : (document.getElementById('stats-btn') && document.getElementById('stats-btn').click());
      await new Promise(r => setTimeout(r, 250));
      const cardsTab = document.getElementById('stats-tab-cards');
      const tourTab = document.getElementById('stats-tab-tournament');
      const overviewTab = document.getElementById('stats-tab-overview');
      statsCold = {
        cardsHidden: cardsTab ? getComputedStyle(cardsTab).display === 'none' : null,
        tourHidden: tourTab ? getComputedStyle(tourTab).display === 'none' : null,
        overviewVisible: overviewTab ? getComputedStyle(overviewTab).display !== 'none' : null,
      };
      const statsModal = document.getElementById('stats-modal');
      const closeBtn = statsModal ? statsModal.querySelector('.modal-close, #stats-close, [data-close]') : null;
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 120));
    } catch (e) { statsCold = { error: String(e) }; }

    // Day 121 #1 — confirm-modal entrance animation.
    const confirmContent = document.getElementById('confirm-modal-content');
    const confirmAnim = confirmContent ? getComputedStyle(confirmContent).animationName : null;

    // Day 119 #2 + Day 121 #2 — Reset Progress typed-confirm + armed affordance.
    let typedConfirm = null;
    try {
      const input = document.getElementById('confirm-modal-input');
      const okBtn = document.getElementById('confirm-modal-ok');
      const modal = document.getElementById('confirm-modal');
      const setVal = (v) => { input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); };
      document.getElementById('reset-progress-btn').click();
      await new Promise(r => setTimeout(r, 200));
      const openShown = getComputedStyle(modal).display === 'flex';
      const inputShown = getComputedStyle(input).display !== 'none';
      const disarmedAtOpen = okBtn.disabled === true && !input.classList.contains('is-armed');
      setVal('reset');
      // The input carries a 0.18s border-color transition (Day 121 Polish #2) and
      // the modal also plays the Day 121 Polish #1 modalPop entrance (0.28s), which
      // can defer the transition start. Wait well past both before sampling the
      // settled computed border (probe confirmed green by ~300ms, solid by 500ms).
      await new Promise(r => setTimeout(r, 550));
      const armedBorder = getComputedStyle(input).borderTopColor;
      const armed = okBtn.disabled === false && input.classList.contains('is-armed');
      // disarmed no-op safety: type wrong, click OK, progress must survive
      setVal('nope');
      await new Promise(r => setTimeout(r, 80));
      const before = Object.keys(gs.progress.levels || {}).length;
      okBtn.click();
      await new Promise(r => setTimeout(r, 150));
      const stillOpen = getComputedStyle(modal).display === 'flex';
      const after = Object.keys(gs.progress.levels || {}).length;
      document.getElementById('confirm-modal-cancel').click();
      await new Promise(r => setTimeout(r, 120));
      const closedClean = getComputedStyle(modal).display === 'none' && !input.classList.contains('is-armed');
      typedConfirm = { openShown, inputShown, disarmedAtOpen, armed, armedBorder, noop: stillOpen && after === before, before, after, closedClean };
    } catch (e) { typedConfirm = { error: String(e) }; }

    return { tournamentTabs, myBestAbsent, orphanGone, statsCold, confirmAnim, typedConfirm };
  })()`);
  console.log(`\n[Prune] ${JSON.stringify(prune)}`);
  assert('P4.a — Day 119 #1: Tournament has no "My Best" tab', prune.myBestAbsent === true, `tabs=${JSON.stringify(prune.tournamentTabs)}`);
  assert('P4.b — Day 119 #1: Tournament tabs = This Week + Archive', Array.isArray(prune.tournamentTabs) && prune.tournamentTabs.some(l => /week/.test(l)) && prune.tournamentTabs.some(l => /archive/.test(l)), JSON.stringify(prune.tournamentTabs));
  assert('P4.c — Day 120: _renderTournamentMyBest() removed', prune.orphanGone === true);
  assert('P4.d — Day 119 #3: My Cards stats tab hidden cold', prune.statsCold && prune.statsCold.cardsHidden === true, JSON.stringify(prune.statsCold));
  assert('P4.e — Day 119 #3: Tournament stats tab hidden cold', prune.statsCold && prune.statsCold.tourHidden === true, JSON.stringify(prune.statsCold));
  assert('P4.f — Day 119 #3: Overview tab visible cold', prune.statsCold && prune.statsCold.overviewVisible === true, JSON.stringify(prune.statsCold));
  assert('P4.g — Day 121 #1: confirm-modal modalPop animation', prune.confirmAnim === 'modalPop', `anim=${prune.confirmAnim}`);
  assert('P4.h — Day 119 #2: Reset typed-confirm opens with input + disarmed', prune.typedConfirm && prune.typedConfirm.openShown === true && prune.typedConfirm.inputShown === true && prune.typedConfirm.disarmedAtOpen === true, JSON.stringify(prune.typedConfirm));
  assert('P4.i — Day 121 #2: typed RESET arms (green + OK enabled)', prune.typedConfirm && prune.typedConfirm.armed === true && /rgb\(0,\s*255,\s*0\)/.test(prune.typedConfirm.armedBorder), `tc=${JSON.stringify(prune.typedConfirm)}`);
  assert('P4.j — Day 119 #2: disarmed OK click is a no-op (progress preserved)', prune.typedConfirm && prune.typedConfirm.noop === true, `before=${prune.typedConfirm && prune.typedConfirm.before} after=${prune.typedConfirm && prune.typedConfirm.after}`);

  // ============================================================
  // P5: Day 79 dead-identifier purge
  // ============================================================
  const deadIds = await evaluate(ws, `(() => {
    const gs = window.game;
    const ids = ['showFirstLaunchDifficultyModal', 'checkLightning', 'checkEclipseRun', 'checkArchitect', 'isMythic', '_showHud', 'getCurrentStep'];
    const stillUndef = ids.every(name => {
      const ach = gs.achievementManager, ui = gs.ui, ir = gs.infiniteRun, tut = gs.tutorial;
      if (ach && typeof ach[name] === 'function') return false;
      if (ui && typeof ui[name] === 'function') return false;
      if (ir && typeof ir[name] === 'function') return false;
      if (tut && typeof tut[name] === 'function') return false;
      return true;
    });
    return { stillUndef, weeklyBtnAbsent: !document.getElementById('weekly-puzzle-btn') };
  })()`);
  assert('P5.a — Day 79: 7 dead ids undefined', deadIds.stillUndef === true);
  assert('P5.b — Day 79: #weekly-puzzle-btn absent', deadIds.weeklyBtnAbsent === true);

  // ============================================================
  // P6: ES module bindings (Day 92 gates.js / Day 107 wires.js)
  // ============================================================
  const esm = await evaluate(ws, `(() => {
    const gtKeys = window.GateTypes ? Object.keys(window.GateTypes).sort() : [];
    return {
      gate: typeof window.Gate,
      ioNode: typeof window.IONode,
      roundRect: typeof window.roundRect,
      gateTypesKeys: gtKeys,
      wire: typeof window.Wire,
      wireManager: typeof window.WireManager,
      wmInstance: !!(window.game && window.game.wireManager instanceof window.WireManager),
    };
  })()`);
  console.log(`\n[ESM] ${JSON.stringify(esm)}`);
  assert('P6.a — window.Gate/IONode/roundRect are functions', esm.gate === 'function' && esm.ioNode === 'function' && esm.roundRect === 'function', JSON.stringify(esm));
  assert('P6.b — GateTypes has 8 keys', esm.gateTypesKeys.length === 8, JSON.stringify(esm.gateTypesKeys));
  assert('P6.c — window.Wire/WireManager are functions + instance binding', esm.wire === 'function' && esm.wireManager === 'function' && esm.wmInstance === true, JSON.stringify(esm));

  // ============================================================
  // P7: console hygiene
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P7.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P7.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 122 EXPERT PANEL + VALIDATION (LOCAL) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);

  const summary = {
    buildIdentity, swProbe, stair, samples, prune, deadIds, esm,
    realErrors, realExceptions, assertions: results, passed, total,
  };
  require('fs').writeFileSync('/tmp/day-122-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-122-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
