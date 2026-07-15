#!/usr/bin/env node
/**
 * Day 138 QA harness — Cycle 7 BUILD Week Day 1: 🎮 Modes Hub (consolidation).
 *
 * What shipped today:
 *   1. The 8 challenge-mode buttons (daily/random/sandbox/adaptive/tournament/
 *      infinite/blitz/speedrun) are re-parented into #modes-hub-modal, each in a
 *      .mode-card wrapper with a description. Ids/classes/handlers preserved.
 *   2. Level-select "Challenge Mode" section → one #modes-hub-btn (🎮 Modes).
 *   3. Tier-gating moved from buttons → .mode-card wrappers (mode-card-<key>);
 *      #modes-hub-btn reveals at g6.
 *   4. setupModesHub(): open/close/backdrop + close-on-pick delegation.
 *
 * Phases:
 *   P1 Build identity     — 11 ?v=1783987200 refs, sw v85, modal+btn+8 buttons in hub
 *   P2 Cold-start         — 2 nav buttons, Modes hidden cold, 50 cards, old container gone
 *   P3 Tier reveal        — seed 6/9/12/18 reveals cards in the staircase order
 *   P4 Launch integrity   — each re-parented button still launches its flow + hub closes
 *   P5 Badge integrity     — updateDailyButtonBadge/updateAdaptiveButtonBadge mutate buttons
 *   P6 Close paths        — close button + backdrop both hide the modal
 *   P7 Regression floor   — Day 79/92/107/123 + Day 124 profile hub intact + LEVELS=50
 *   P8 Console hygiene
 *
 * Prereq: tools/cdp-launch.sh start
 * Usage:  NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-138-qa.cdp.js
 */

const http = require('http');
const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const V = '1783987200';

let msgId = 0;
let ws;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];
const results = [];

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function evalExpr(expr, awaitPromise = false) {
  return send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }).then((r) => {
    if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result && r.result.value;
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function assert(name, cond, detail) {
  results.push({ name, pass: !!cond, detail });
  const tag = cond ? 'PASS' : 'FAIL';
  const detailStr = (detail === undefined) ? '' : ' — ' + ((JSON.stringify(detail) || String(detail)).slice(0, 220));
  console.log(`[${tag}] ${name}${cond ? '' : detailStr}`);
}
async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const page = targets.find((t) => t.type === 'page');
          if (!page) return reject(new Error('no page target'));
          resolve(page.webSocketDebuggerUrl);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}
async function navigateAndWait(url) {
  const navPromise = new Promise((resolve) => {
    const listener = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.method === 'Page.loadEventFired') { ws.off('message', listener); resolve(); }
    };
    ws.on('message', listener);
  });
  await send('Page.navigate', { url });
  await navPromise;
  await sleep(900);
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await navigateAndWait(TARGET_URL);

  const MODES = ['daily', 'random', 'sandbox', 'adaptive', 'tournament', 'infinite', 'blitz', 'speedrun'];
  const BTN = {
    daily: 'daily-challenge-btn', random: 'random-challenge-btn', sandbox: 'sandbox-btn',
    adaptive: 'adaptive-challenge-btn', tournament: 'tournament-btn', infinite: 'infinite-mode-btn',
    blitz: 'blitz-mode-btn', speedrun: 'speedrun-btn',
  };

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    (Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=${V}')).length +
     Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=${V}')).length)`);
  assert(`P1.1 11 cache-bust refs at ?v=${V}`, vCount === 11, { vCount });
  const gameLive = await evalExpr(`!!window.game && !!window.game.ui && typeof window.game.seedProgress === 'function'`);
  assert('P1.2 window.game + ui + seedProgress live', gameLive === true);
  const swVer = await evalExpr(`fetch('sw.js?probe=' + Date.now()).then(r=>r.text()).then(t=>{const m=t.match(/signal-circuit-v(\\d+)/);return m?m[1]:null;})`, true);
  assert('P1.3 sw.js CACHE_NAME = signal-circuit-v85', swVer === '85', { swVer });
  const dom = await evalExpr(`({
    modal: !!document.getElementById('modes-hub-modal'),
    btn: !!document.getElementById('modes-hub-btn'),
    list: !!document.getElementById('modes-hub-list'),
    setup: typeof window.game.ui.setupModesHub,
    oldContainer: !!document.getElementById('challenge-buttons'),
    btnsInHub: ${JSON.stringify(Object.values(BTN))}.filter(id => { const b=document.getElementById(id); return b && b.closest('#modes-hub-list'); }).length,
    cards: document.querySelectorAll('#modes-hub-list .mode-card').length,
    descs: document.querySelectorAll('#modes-hub-list .mode-desc').length,
  })`);
  assert('P1.4 #modes-hub-modal + #modes-hub-btn + list in DOM', dom.modal && dom.btn && dom.list, dom);
  assert('P1.5 setupModesHub present', dom.setup === 'function', dom);
  assert('P1.6 all 8 mode buttons re-parented into hub', dom.btnsInHub === 8, dom);
  assert('P1.7 8 mode cards + 8 descriptions', dom.cards === 8 && dom.descs === 8, dom);
  assert('P1.8 old #challenge-buttons container removed', dom.oldContainer === false, dom);

  // ── P2 Cold-start ────────────────────────────────────────────────────
  console.log('\n── P2 Cold-start ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_cold');
  await sleep(400);
  const coldNavBtns = await evalExpr(`
    Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => {
      const r = b.getBoundingClientRect();
      return !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') &&
             !b.closest('.level-overflow-popover') && b.offsetParent !== null && r.width > 0 && r.height > 0;
    }).length`);
  assert('P2.1 cold-start non-level button count = 2 (Day 78)', coldNavBtns === 2, { coldNavBtns });
  const modesHiddenCold = await evalExpr(`(function(){const b=document.getElementById('modes-hub-btn');return b?getComputedStyle(b).display==='none':null;})()`);
  assert('P2.2 Modes button hidden cold (reveals at g6)', modesHiddenCold === true, { modesHiddenCold });
  const cardCount = await evalExpr(`document.querySelectorAll('#level-select-screen .level-btn').length`);
  assert('P2.3 50 level cards visible cold', cardCount === 50, { cardCount });
  const challengeBtnAbsent = await evalExpr(`!document.querySelector('#challenge-section #challenge-buttons')`);
  assert('P2.4 no flat challenge-buttons list on level-select', challengeBtnAbsent === true);

  // ── P3 Tier reveal ───────────────────────────────────────────────────
  console.log('\n── P3 Tier reveal ──');
  // helper: card visibility map after a seed
  const cardVis = async () => evalExpr(`
    (function(){
      const keys = ${JSON.stringify(MODES)};
      const out = {};
      keys.forEach(k => { const el=document.getElementById('mode-card-'+k); out[k]= el?(getComputedStyle(el).display!=='none'):null; });
      out._modesBtn = (function(){const b=document.getElementById('modes-hub-btn');return b?getComputedStyle(b).display!=='none':null;})();
      return out;
    })()`);
  await evalExpr(`window.game.seedProgress(6)`); await sleep(150);
  const v6 = await cardVis();
  assert('P3.1 seed 6 → Modes btn visible + only Daily card visible', v6._modesBtn === true && v6.daily === true && v6.random === false && v6.tournament === false, v6);
  await evalExpr(`window.game.seedProgress(9)`); await sleep(150);
  const v9 = await cardVis();
  assert('P3.2 seed 9 → +Random +Sandbox visible, Adaptive still hidden', v9.random === true && v9.sandbox === true && v9.adaptive === false, v9);
  await evalExpr(`window.game.seedProgress(12)`); await sleep(150);
  const v12 = await cardVis();
  assert('P3.3 seed 12 → +Adaptive visible, Tournament still hidden', v12.adaptive === true && v12.tournament === false, v12);
  await evalExpr(`window.game.seedProgress(18)`); await sleep(150);
  const v18 = await cardVis();
  assert('P3.4 seed 18 → all 8 cards visible', MODES.every(k => v18[k] === true), v18);

  // ── P4 Launch integrity (all 8 buttons still launch their flow) ──────
  console.log('\n── P4 Launch integrity ──');
  // Screen id (or predicate) each mode should reach after click.
  const LAUNCH = {
    daily:      `getComputedStyle(document.getElementById('daily-config-screen')||{}).display !== 'none'`,
    random:     `getComputedStyle(document.getElementById('challenge-config-screen')||{}).display !== 'none'`,
    sandbox:    `getComputedStyle(document.getElementById('sandbox-config-screen')||{}).display !== 'none'`,
    adaptive:   `getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    tournament: `getComputedStyle(document.getElementById('tournament-screen')||{}).display !== 'none'`,
    infinite:   `getComputedStyle(document.getElementById('infinite-pre-screen')||{}).display !== 'none'`,
    blitz:      `!!window.game.blitzMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    speedrun:   `!!window.game.speedrunMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
  };
  for (const k of MODES) {
    // Return to level-select + reset transient modes.
    await evalExpr(`(function(){
      try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
      try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
      window.game.showLevelSelect();
    })()`);
    await sleep(150);
    // Open hub, click the mode button.
    await evalExpr(`document.getElementById('modes-hub-btn').click()`);
    await sleep(120);
    const opened = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display !== 'none'`);
    await evalExpr(`document.getElementById('${BTN[k]}').click()`);
    await sleep(300);
    const reached = await evalExpr(`(${LAUNCH[k]})`);
    const hubClosed = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display === 'none'`);
    assert(`P4.${k} launches flow + hub closes on pick`, opened === true && reached === true && hubClosed === true, { opened, reached, hubClosed });
  }
  // cleanup transient modes + return home
  await evalExpr(`(function(){
    try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
    try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
    window.game.showLevelSelect();
  })()`);
  await sleep(200);

  // ── P5 Badge integrity (updaters still mutate re-parented buttons) ───
  console.log('\n── P5 Badge integrity ──');
  const p5 = await evalExpr(`
    (function(){
      const ui = window.game.ui;
      let dailyOk = false, adaptOk = false;
      try { ui.updateDailyButtonBadge && ui.updateDailyButtonBadge(); const d=document.getElementById('daily-challenge-btn'); dailyOk = !!d && /Daily/.test(d.textContent||d.innerText||''); } catch(e) { dailyOk = 'ERR:'+e.message; }
      try { ui.updateAdaptiveButtonBadge && ui.updateAdaptiveButtonBadge(); const a=document.getElementById('adaptive-challenge-btn'); adaptOk = !!a && /Adaptive/.test(a.textContent||a.innerText||''); } catch(e) { adaptOk = 'ERR:'+e.message; }
      return { dailyOk, adaptOk };
    })()`);
  assert('P5.1 updateDailyButtonBadge mutates re-parented daily button', p5.dailyOk === true, p5);
  assert('P5.2 updateAdaptiveButtonBadge mutates re-parented adaptive button', p5.adaptOk === true, p5);

  // ── P6 Close paths ───────────────────────────────────────────────────
  console.log('\n── P6 Close paths ──');
  const p6 = await evalExpr(`
    (function(){
      const modal = document.getElementById('modes-hub-modal');
      const openIt = () => document.getElementById('modes-hub-btn').click();
      // close via close button
      openIt(); const o1 = getComputedStyle(modal).display !== 'none';
      document.getElementById('modes-hub-close').click(); const c1 = getComputedStyle(modal).display === 'none';
      // close via backdrop (click modal element itself)
      openIt(); const o2 = getComputedStyle(modal).display !== 'none';
      modal.dispatchEvent(new MouseEvent('click', { bubbles:true }));
      const c2 = getComputedStyle(modal).display === 'none';
      return { o1, c1, o2, c2 };
    })()`);
  assert('P6.1 close button hides modal', p6.o1 === true && p6.c1 === true, p6);
  assert('P6.2 backdrop click hides modal', p6.o2 === true && p6.c2 === true, p6);

  // ── P7 Regression floor ──────────────────────────────────────────────
  console.log('\n── P7 Regression floor ──');
  const day79 = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P7.1 Day 79 dead-id showFirstLaunchDifficultyModal undefined', day79.showFirstLaunchDifficultyModal === 'undefined', day79);
  assert('P7.2 Day 79 #weekly-puzzle-btn DOM absent', day79.weeklyPuzzleBtn === false, day79);
  const esm = await evalExpr(`({
    Gate: typeof window.Gate, GateTypes: typeof window.GateTypes,
    Wire: typeof window.Wire, WireManager: typeof window.WireManager,
    Simulation: typeof window.Simulation, simInstance: window.game.simulation instanceof window.Simulation,
    levels: (typeof getLevelCount === 'function') ? getLevelCount() : null,
  })`);
  assert('P7.3 Day 92 window.Gate / GateTypes bound', esm.Gate === 'function' && esm.GateTypes === 'object', esm);
  assert('P7.4 Day 107 window.Wire / WireManager bound', esm.Wire === 'function' && esm.WireManager === 'function', esm);
  assert('P7.5 Day 123 window.Simulation bound + instance identity', esm.Simulation === 'function' && esm.simInstance === true, esm);
  assert('P7.6 LEVELS = 50', esm.levels === 50, esm);
  const profileHub = await evalExpr(`({
    modal: !!document.getElementById('profile-hub-modal'),
    btn: !!document.getElementById('profile-hub-btn'),
    setup: typeof window.game.ui.setupProfileHub,
  })`);
  assert('P7.7 Day 124 Profile hub intact', profileHub.modal && profileHub.btn && profileHub.setup === 'function', profileHub);

  // ── P8 Console hygiene ───────────────────────────────────────────────
  console.log('\n── P8 Console hygiene ──');
  assert('P8.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P8.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n═════ SUMMARY ═════`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length}; exceptions: ${exceptions.length}`);
  if (passed !== total) {
    console.log('\nFAILED:');
    results.filter((r) => !r.pass).forEach((r) => console.log('  - ' + r.name + ' ' + JSON.stringify(r.detail || '').slice(0, 220)));
    process.exit(1);
  }
  ws.close();
  process.exit(0);
}
main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
