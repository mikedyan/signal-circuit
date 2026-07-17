#!/usr/bin/env node
/**
 * Day 140 QA harness — Cycle 7 BUILD Week Day 3: "Recommended for you" spotlight.
 *
 * What shipped today:
 *   A single highlighted card at the TOP of the Day 138 Modes hub, chosen by a
 *   deterministic heuristic (_recommendMode) over EXISTING player state — no new
 *   persistence. Precedence (top wins, only ever recommends an UNLOCKED mode):
 *     1) streak>0 & not played today → daily  "Keep your streak alive"
 *     2) campaign 100% & blitz unrun → blitz  "Campaign conquered"
 *     3) g18 & no tournament runs    → tournament "Enter the arena"
 *     4) g18 & infinite unrun        → infinite "How far can you go?"
 *     5) g12                         → adaptive "Sized to your skill"
 *     6) g9                          → random   "Mix it up"
 *     7) default (g6)                → daily    "Start here" / "Come back tomorrow"
 *   New: UI.renderModeSpotlight() + UI._recommendMode() + UI._modeButtonId().
 *   Called in setupModesHub() + on every hub open().
 *
 * Phases:
 *   P1 Build identity   — 11 ?v=1784160000 refs, sw v87, spotlight host + game live
 *   P2 Cold-start       — fresh profile → spotlight visible, recommends daily "Start here"
 *   P3 Heuristic branches — seed each state → the correct mode + copy is recommended
 *   P4 Launch integrity — spotlight Play launches the recommended mode + hub closes
 *   P5 Regression floor — Day 138 hub launch of all 8, Day 79/92/107/123, LEVELS=50, cold nav 2
 *   P6 Console hygiene
 *
 * Prereq: tools/cdp-launch.sh start
 * Usage:  NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-140-qa.cdp.js
 */

const http = require('http');
const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const V = '1784160000';

let msgId = 0;
let ws;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];
const results = [];

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      pending.delete(id);
      reject(new Error('CDP timeout (8s) on ' + method + ' :: ' + JSON.stringify(params).slice(0, 160)));
    }, 8000);
    pending.set(id, {
      resolve: (v) => { clearTimeout(t); resolve(v); },
      reject: (e) => { clearTimeout(t); reject(e); },
    });
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
// Open hub (fires open() → renderModeSpotlight), read the spotlight, close hub.
async function readSpotlight() {
  await evalExpr(`document.getElementById('modes-hub-btn').click()`);
  await sleep(140);
  const out = await evalExpr(`
    (function(){
      const host = document.getElementById('modes-hub-spotlight');
      if (!host) return { hostExists:false };
      const btn = document.getElementById('mode-spotlight-btn');
      return {
        hostExists:true,
        visible: getComputedStyle(host).display !== 'none',
        mode: btn ? btn.getAttribute('data-mode') : null,
        title: btn ? (btn.querySelector('.spotlight-title')||{}).textContent : null,
        reason: btn ? (btn.querySelector('.spotlight-reason')||{}).textContent : null,
      };
    })()`);
  await evalExpr(`document.getElementById('modes-hub-close').click()`);
  await sleep(80);
  return out;
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
  await send('Page.enable');
  await send('Runtime.enable');
  await navigateAndWait(TARGET_URL);
  // Purge any stale service-worker + Cache Storage in the persistent CDP profile
  // so we always test the freshly-served ui.js/css/sw from disk (Day 134 lesson:
  // a same-version SW precache can mask an in-place source edit). Real users are
  // unaffected — the v86→v87 SW upgrade precaches the new bytes on install.
  await evalExpr(`(async()=>{ try {
    if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); for (const r of rs) await r.unregister(); }
    if (window.caches) { const ks = await caches.keys(); for (const k of ks) await caches.delete(k); }
  } catch(e){} return true; })()`, true);
  await navigateAndWait(TARGET_URL);

  const BTN = {
    daily: 'daily-challenge-btn', random: 'random-challenge-btn', sandbox: 'sandbox-btn',
    adaptive: 'adaptive-challenge-btn', tournament: 'tournament-btn', infinite: 'infinite-mode-btn',
    blitz: 'blitz-mode-btn', speedrun: 'speedrun-btn',
  };
  const MODES = ['daily', 'random', 'sandbox', 'adaptive', 'tournament', 'infinite', 'blitz', 'speedrun'];

  // ── P1 Build identity ─────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`(document.documentElement.innerHTML.match(/\\?v=${V}/g)||[]).length`);
  assert('P1.1 11 ?v=' + V + ' refs', vCount === 11, vCount);
  const gameLive = await evalExpr(`!!window.game && !!window.game.ui && typeof window.game.seedProgress === 'function'`);
  assert('P1.2 window.game + ui + seedProgress live', gameLive === true);
  const hostExists = await evalExpr(`!!document.getElementById('modes-hub-spotlight')`);
  assert('P1.3 #modes-hub-spotlight host in DOM', hostExists === true);
  const apiLive = await evalExpr(`typeof window.game.ui.renderModeSpotlight === 'function' && typeof window.game.ui._recommendMode === 'function' && typeof window.game.ui._modeButtonId === 'function'`);
  assert('P1.4 renderModeSpotlight + _recommendMode + _modeButtonId live', apiLive === true);
  const swv = await evalExpr(`fetch('/sw.js').then(r=>r.text()).then(t=>/signal-circuit-v87/.test(t))`, true);
  assert('P1.5 sw.js CACHE_NAME = signal-circuit-v87', swv === true);
  const btnMap = await evalExpr(`(function(){
    const u = window.game.ui;
    return JSON.stringify(${JSON.stringify(MODES)}.map(k=>u._modeButtonId(k)));
  })()`);
  assert('P1.6 _modeButtonId maps all 8 keys',
    btnMap === JSON.stringify(MODES.map((k) => BTN[k])), btnMap);

  // Yesterday (UTC) — for the app-open-streak return-player case (updateStreak
  // on load turns lastPlayDate=yesterday into streak+1 / today).
  const YDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  // NB: seedProgress merges onto in-memory progress; use {clear:true} so a
  // DECREASING seed doesn't keep the previous phase's higher progress. Pair
  // with localStorage.clear() to also wipe per-mode best keys, then reload so
  // every in-memory manager re-reads the cleared storage.

  // ── P2 Cold-start recommendation ──────────────────────────────────────
  console.log('\n── P2 Cold-start ──');
  await evalExpr(`localStorage.clear(); window.game.seedProgress(0, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const cold = await readSpotlight();
  assert('P2.1 spotlight visible on cold profile', cold.hostExists === true && cold.visible === true, cold);
  assert('P2.2 cold recommends daily', cold.mode === 'daily', cold);
  assert('P2.3 cold title "Start here"', /Start here/.test(cold.title || ''), cold);
  assert('P2.4 cold reason mentions Daily Challenge', /Daily Challenge/.test(cold.reason || ''), cold);

  // ── P3 Heuristic branches ─────────────────────────────────────────────
  console.log('\n── P3 Heuristic branches ──');
  // R1: campaign 100% (50) & blitz unrun → blitz "Campaign conquered"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(50, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const r1 = await readSpotlight();
  assert('P3.1 campaign 100% & blitz unrun → blitz "Campaign conquered"',
    r1.mode === 'blitz' && /Campaign conquered/.test(r1.title || '') && /all 50 levels/.test(r1.reason || ''), r1);

  // R2: g18 (18) & no tournament runs → tournament "Enter the arena"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const r2 = await readSpotlight();
  assert('P3.2 g18 & no tournament runs → tournament "Enter the arena"',
    r2.mode === 'tournament' && /Enter the arena/.test(r2.title || ''), r2);

  // R3: g18 + a tournament run → infinite "How far can you go?"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await evalExpr(`(function(){ const wt = window.game.weeklyTournament; if (wt && wt.submitScore) wt.submitScore(3, 25, 'Mochi'); })()`);
  await navigateAndWait(TARGET_URL);
  const r3 = await readSpotlight();
  assert('P3.3 g18 + tournament run & infinite unrun → infinite "How far can you go?"',
    r3.mode === 'infinite' && /How far can you go/.test(r3.title || ''), r3);

  // R4: g18 + tournament run + infinite depth → blitz "Beat the clock"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await evalExpr(`(function(){
    const wt = window.game.weeklyTournament; if (wt && wt.submitScore) wt.submitScore(3, 25, 'Mochi');
    const ir = window.game.infiniteRun; if (ir) { ir.best = ir.best || {bestStreak:0,bestSolved:0,bestTimeSec:0,totalRuns:0}; ir.best.bestSolved = 8; if (ir._saveBest) ir._saveBest(); }
  })()`);
  await navigateAndWait(TARGET_URL);
  const r4 = await readSpotlight();
  assert('P3.4 g18 + tour + infinite & blitz unrun → blitz "Beat the clock"',
    r4.mode === 'blitz' && /Beat the clock/.test(r4.title || ''), r4);

  // R5: g18 + tournament + infinite + blitz best → speedrun "Set a time trial"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await evalExpr(`(function(){
    const wt = window.game.weeklyTournament; if (wt && wt.submitScore) wt.submitScore(3, 25, 'Mochi');
    const ir = window.game.infiniteRun; if (ir) { ir.best = ir.best || {bestStreak:0,bestSolved:0,bestTimeSec:0,totalRuns:0}; ir.best.bestSolved = 8; if (ir._saveBest) ir._saveBest(); }
  })()`);
  await evalExpr(`localStorage.setItem('signal-circuit-blitz-best', '6')`);
  await navigateAndWait(TARGET_URL);
  const r5 = await readSpotlight();
  assert('P3.5 g18 + tour + infinite + blitz & speedrun unrun → speedrun "Set a time trial"',
    r5.mode === 'speedrun' && /Set a time trial/.test(r5.title || ''), r5);

  // R6: g12 (12) → adaptive "Sized to your skill"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(12, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const r6 = await readSpotlight();
  assert('P3.6 g12 → adaptive "Sized to your skill"',
    r6.mode === 'adaptive' && /Sized to your skill/.test(r6.title || ''), r6);

  // R7: g9 (9) → random "Mix it up"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(9, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const r7 = await readSpotlight();
  assert('P3.7 g9 → random "Mix it up"',
    r7.mode === 'random' && /Mix it up/.test(r7.title || ''), r7);

  // R8: g6, first-timer (streak 1) → daily "Start here"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(6, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const r8 = await readSpotlight();
  assert('P3.8 g6 first-timer → daily "Start here"',
    r8.mode === 'daily' && /Start here/.test(r8.title || ''), r8);

  // R9: g6, returning player (app-open streak) → daily "Keep your streak going"
  await evalExpr(`localStorage.clear(); window.game.seedProgress(6, {clear:true});`);
  await evalExpr(`localStorage.setItem('signal-circuit-streak', JSON.stringify({ streak: 5, freezeTokens: 0, lastPlayDate: '${YDAY}' }))`);
  await navigateAndWait(TARGET_URL);
  const r9 = await readSpotlight();
  assert('P3.9 g6 returning (streak>=2) → daily "Keep your streak going"',
    r9.mode === 'daily' && /Keep your streak going/.test(r9.title || '') && /day streak/.test(r9.reason || ''), r9);

  // ── P4 Spotlight launch integrity ─────────────────────────────────────
  console.log('\n── P4 Spotlight launch ──');
  // g12 → adaptive, click Play → gameplay screen.
  await evalExpr(`localStorage.clear(); window.game.seedProgress(12, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  await evalExpr(`document.getElementById('modes-hub-btn').click()`);
  await sleep(140);
  const recMode = await evalExpr(`document.getElementById('mode-spotlight-btn').getAttribute('data-mode')`);
  await evalExpr(`document.getElementById('mode-spotlight-btn').click()`);
  await sleep(340);
  const launchAdaptive = await evalExpr(`getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`);
  const hubClosed = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display === 'none'`);
  assert('P4.1 g12 spotlight recommends adaptive', recMode === 'adaptive', recMode);
  assert('P4.2 spotlight Play launches adaptive gameplay', launchAdaptive === true, launchAdaptive);
  assert('P4.3 hub closes on spotlight pick', hubClosed === true, hubClosed);

  // g18 → tournament, click Play → tournament screen.
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  await evalExpr(`document.getElementById('modes-hub-btn').click()`);
  await sleep(140);
  const recMode2 = await evalExpr(`document.getElementById('mode-spotlight-btn').getAttribute('data-mode')`);
  await evalExpr(`document.getElementById('mode-spotlight-btn').click()`);
  await sleep(340);
  const launchTour = await evalExpr(`getComputedStyle(document.getElementById('tournament-screen')||{}).display !== 'none'`);
  const hubClosed2 = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display === 'none'`);
  assert('P4.4 g18 spotlight recommends tournament', recMode2 === 'tournament', recMode2);
  assert('P4.5 spotlight Play launches tournament screen', launchTour === true, launchTour);
  assert('P4.6 hub closes on tournament spotlight pick', hubClosed2 === true, hubClosed2);

  // ── P5 Regression floor ───────────────────────────────────────────────
  console.log('\n── P5 Regression floor ──');
  // Day 138 hub launch integrity: all 8 buttons still launch from inside the hub.
  const LAUNCH = {
    daily: `getComputedStyle(document.getElementById('daily-config-screen')||{}).display !== 'none'`,
    random: `getComputedStyle(document.getElementById('challenge-config-screen')||{}).display !== 'none'`,
    sandbox: `getComputedStyle(document.getElementById('sandbox-config-screen')||{}).display !== 'none'`,
    adaptive: `getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    tournament: `getComputedStyle(document.getElementById('tournament-screen')||{}).display !== 'none'`,
    infinite: `getComputedStyle(document.getElementById('infinite-pre-screen')||{}).display !== 'none'`,
    blitz: `!!window.game.blitzMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    speedrun: `!!window.game.speedrunMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
  };
  await evalExpr(`localStorage.clear(); window.game.seedProgress(18, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  for (const k of MODES) {
    await evalExpr(`(function(){
      try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
      try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
      window.game.showLevelSelect();
    })()`);
    await sleep(120);
    await evalExpr(`document.getElementById('modes-hub-btn').click()`);
    await sleep(110);
    await evalExpr(`document.getElementById('${BTN[k]}').click()`);
    await sleep(300);
    const reached = await evalExpr(`(${LAUNCH[k]})`);
    const hc = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display === 'none'`);
    assert(`P5.${k} hub still launches ${k} + closes`, reached === true && hc === true, { reached, hc });
  }
  await evalExpr(`(function(){
    try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
    try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
    window.game.showLevelSelect();
  })()`);
  await sleep(160);
  const day79 = await evalExpr(`({
    a: typeof weeklyPuzzleBtn, b: typeof showWeeklyPuzzle, c: typeof renderWeeklyPuzzle,
    d: typeof weeklyPuzzleState, e: typeof openWeeklyPuzzle, f: typeof loadWeeklyPuzzle,
    g: typeof weeklyPuzzleData, dom: !!document.getElementById('weekly-puzzle-btn')
  })`);
  const d79ok = Object.entries(day79).every(([k, v]) => k === 'dom' ? v === false : v === 'undefined');
  assert('P5.day79 7 dead ids undefined + #weekly-puzzle-btn absent', d79ok, day79);
  const esm = await evalExpr(`({
    gate: typeof window.Gate, gt: (window.GateTypes ? Object.keys(window.GateTypes).length : 0),
    wire: typeof window.Wire, wm: typeof window.WireManager,
    sim: typeof window.Simulation, simInst: (window.game.simulation instanceof window.Simulation)
  })`);
  assert('P5.esm Gate+8 GateTypes / Wire / Simulation bindings intact',
    esm.gate === 'function' && esm.gt === 8 && esm.wire === 'function' && esm.wm === 'function' && esm.sim === 'function' && esm.simInst === true, esm);
  const levelCount = await evalExpr(`(typeof getLevelCount === 'function') ? getLevelCount() : -1`);
  assert('P5.levels LEVELS=50', levelCount === 50, levelCount);
  // Cold-start nav invariant (Day 78): 2 nav buttons on fresh profile.
  await evalExpr(`localStorage.clear(); window.game.seedProgress(0, {clear:true});`);
  await navigateAndWait(TARGET_URL);
  const navCount = await evalExpr(`Array.from(document.querySelectorAll('#level-select-screen button')).filter(b=>getComputedStyle(b).display!=='none' && b.offsetParent!==null).length`);
  assert('P5.nav cold-start nav buttons === 2 (Day 78)', navCount === 2, navCount);
  // Spotlight is inside the modal → not visible while hub closed.
  const spotHiddenClosed = await evalExpr(`(function(){
    const modal = document.getElementById('modes-hub-modal');
    return getComputedStyle(modal).display === 'none';
  })()`);
  assert('P5.spot hub closed at cold start (spotlight not floating)', spotHiddenClosed === true);

  // ── P6 Console hygiene ────────────────────────────────────────────────
  console.log('\n── P6 Console hygiene ──');
  assert('P6.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P6.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

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
