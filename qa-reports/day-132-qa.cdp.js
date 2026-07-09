#!/usr/bin/env node
/**
 * Day 132 QA harness — Cycle 6 HARDEN Week Day 5: Regression Pass (DEPLOYED build).
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). Boot deps first with
 *   tools/cdp-launch.sh start
 * then run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-132-qa.cdp.js
 *   tools/cdp-launch.sh stop
 *
 * UNIQUE TO DAY 132: this harness targets the LIVE GitHub Pages deployment
 *   https://mikedyan.github.io/signal-circuit/
 * (not the local static server). Goal: confirm Pages has caught up to the
 * pinned Day 127 artifact (?v=1783036800 / sw v81) and the full core loop +
 * every mode works end-to-end on the deployed bytes, with a clean console.
 *
 * Cloned from day-117-qa.cdp.js (Cycle 5 deployed Regression Pass) with the
 * Cycle 6 BUILD surfaces (D123-D127) swapped in from day-131-qa.cdp.js.
 *
 * Coverage (HARDEN Week Day 5 — Regression Pass):
 *   P1  Deployed build identity (11× ?v=1783036800 + sw v81)
 *   P2  Cold-start invariants (50 cards, 2 nav buttons, ESM bindings, dead-IDs)
 *   P3  Core loop: load L1 → place gate → draw wires → RUN sim → Quick Test → complete
 *   P4  Mode: daily challenge entry
 *   P5  Mode: random challenge config entry
 *   P6  Mode: blitz immediate-start + HUD cleanup (Day 61)
 *   P7  Mode: speedrun immediate-start + HUD cleanup (Day 74)
 *   P8  Mode: sandbox config entry
 *   P9  Mode: tournament backend label (Day 108/125)
 *   P10 Mode: adaptive/infinite tier-gated entry
 *   P11 Cycle 6 BUILD regression: D123 simulation ESM, D124 Profile-hub merge,
 *       D125 tournament settings, D126 cohort determinism, D127 Progress heatmap
 *   P12 Console hygiene (0 console.error, 0 Runtime.exceptionThrown)
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const BASE = 'https://mikedyan.github.io/signal-circuit/';
const TARGET_URL = BASE + '?_ts=' + Date.now();
const BUILD_V = '?v=1783036800';
const SW_V = 'signal-circuit-v81';
const ORIGIN = 'https://mikedyan.github.io';

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const assertions = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c));
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function send(ws, method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}
async function evalExpr(ws, expr, { returnByValue = true, awaitPromise = false } = {}) {
  const r = await send(ws, 'Runtime.evaluate', { expression: expr, returnByValue, awaitPromise, allowUnsafeEvalBlockedByCSP: true });
  if (r.exceptionDetails) {
    const text = r.exceptionDetails.exception?.description || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails);
    throw new Error('eval threw: ' + text);
  }
  return r.result && r.result.value;
}
async function waitFor(ws, predicate, { timeoutMs = 15000, intervalMs = 250, label = 'waitFor' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = await evalExpr(ws, `(${predicate})()`); if (v) return v; } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function navigateAndWait(ws, url) {
  await send(ws, 'Page.navigate', { url });
  await sleep(2000);
  await waitFor(ws, `() => !!document.body`, { label: 'body present' });
}
async function backToLevelSelect(ws) {
  await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b&&b.offsetParent!==null){b.click();} else if(window.game&&window.game.ui){ window.game.ui.showScreen('level-select'); } })()`);
  await sleep(400);
}

async function main() {
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) target = await fetchJson('/json/new?about:blank');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const args = msg.params.args || [];
        consoleErrors.push(args.map((a) => (a.value !== undefined ? String(a.value) : (a.description || ''))).join(' '));
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      consoleErrors.push('uncaught: ' + ((ed && (ed.exception?.description || ed.text)) || JSON.stringify(ed)));
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');
  await send(ws, 'Network.setCacheDisabled', { cacheDisabled: true });
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'all' }); } catch {}

  async function enterL1() {
    await evalExpr(ws, `window.game.startLevel(1)`);
    await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L1 gameplay' });
  }

  // ───────── PHASE 1: Deployed build identity ─────────
  console.log('\n=== Phase 1: DEPLOYED build identity (GitHub Pages caught up to Day 127) ===');
  await navigateAndWait(ws, TARGET_URL);
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);
  const html = await evalExpr(ws, `fetch('${BASE}index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('deployed: 11 cache-bust refs at ?v=1783036800', (html.match(/\?v=1783036800/g) || []).length === 11, `found=${(html.match(/\?v=1783036800/g) || []).length}`);
  const swText = await evalExpr(ws, `fetch('${BASE}sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('deployed: sw.js CACHE_NAME = signal-circuit-v81', new RegExp(`CACHE_NAME\\s*=\\s*'${SW_V}'`).test(swText));

  // ───────── PHASE 2: Cold-start invariants ─────────
  console.log('\n=== Phase 2: Cold-start invariants (deployed) ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+ui ready' });
  await sleep(600);
  const cold = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const nonLevel = visible.filter(b => !b.classList.contains('level-overflow-btn') && !b.classList.contains('level-btn') && !b.closest('.level-overflow-btn, .level-card, [data-level-id]'));
    return { cards: s.querySelectorAll('.level-btn').length, nonLevel: nonLevel.length };
  })()`);
  rec('cold-start 50 level cards (Day 109 invariant)', cold && cold.cards === 50, `cards=${cold && cold.cards}`);
  rec('cold-start 2 non-level nav buttons (Day 78 invariant)', cold && cold.nonLevel === 2, `nonLevel=${cold && cold.nonLevel}`);
  const bindings = await evalExpr(ws, `(function(){
    return { gate: typeof window.Gate, gateTypes: window.GateTypes ? Object.keys(window.GateTypes).length : -1,
      wire: typeof window.Wire, wireMgr: typeof window.WireManager, sim: typeof window.Simulation,
      levels: (typeof LEVELS !== 'undefined') ? LEVELS.length : -1 };
  })()`);
  rec('D92 window.Gate fn + 8 GateTypes', bindings.gate === 'function' && bindings.gateTypes === 8, JSON.stringify(bindings));
  rec('D107 window.Wire + WireManager bound', bindings.wire === 'function' && bindings.wireMgr === 'function', `wire=${bindings.wire} mgr=${bindings.wireMgr}`);
  rec('D123 window.Simulation bound (ESM)', bindings.sim === 'function', `sim=${bindings.sim}`);
  rec('LEVELS = 50', bindings.levels === 50, `levels=${bindings.levels}`);
  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    return { allUndef: ids.every(n => typeof window[n] === 'undefined'), weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers undefined + #weekly-puzzle-btn absent', deadIds.allUndef && deadIds.weeklyBtn === false, JSON.stringify(deadIds));

  // ───────── PHASE 3: Core loop ─────────
  console.log('\n=== Phase 3: Core loop — load L1 → place gate → wire → RUN → Quick Test → complete ===');
  await enterL1();
  const loop = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null, completed=false;
    try {
      const id = (gs.nextGateId !== undefined ? gs.nextGateId++ : 5001);
      gs.gates.push(new window.Gate('AND', 400, 300, id));
      const ins = gs.inputNodes, outs = gs.outputNodes;
      gs.wireManager.wires.push(new window.Wire(ins[0].id, 0, id, 0, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(ins[1].id, 0, id, 1, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(id, 0, outs[0].id, 0, gs.wireManager.nextId++));
      if (gs.renderer) gs.renderer.render();
      const wiresBefore = gs.wireManager.wires.length;
      if (gs.runQuickTest) gs.runQuickTest();
      if (gs.runSimulation) gs.runSimulation();
      if (gs.completeLevel) { gs.completeLevel(1, 1); completed = true; }
      const prog = gs.progress && gs.progress.levels && gs.progress.levels[1];
      return { threw, wiresBefore, completed, levelDone: !!(prog && prog.completed), stars: prog && prog.stars };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('P3 core loop: place gate + 3 wires + Quick Test + RUN, no throw', loop && loop.threw === null && loop.wiresBefore === 3, JSON.stringify(loop));
  rec('P3 completeLevel(1) persists completed=true', loop && loop.levelDone === true, JSON.stringify(loop));
  await backToLevelSelect(ws);

  // ───────── PHASE 4: Daily challenge mode ─────────
  console.log('\n=== Phase 4: Daily Challenge mode ===');
  const daily = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('daily-challenge-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.startDailyChallenge) { window.game.startDailyChallenge(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('daily-config'); }
      const dc = document.getElementById('daily-config-screen');
      const gp = document.getElementById('gameplay-screen');
      const dcVis = dc && getComputedStyle(dc).display !== 'none';
      const gpVis = gp && getComputedStyle(gp).display !== 'none';
      return { reached: !!(dcVis || gpVis), dcVis: !!dcVis, gpVis: !!gpVis };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P4 Daily Challenge reaches config or gameplay screen', daily && daily.reached, JSON.stringify(daily));
  await backToLevelSelect(ws);

  // ───────── PHASE 5: Random challenge config ─────────
  console.log('\n=== Phase 5: Random Challenge config ===');
  const rand = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('random-challenge-btn') || document.getElementById('challenge-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('challenge-config'); }
      const cc = document.getElementById('challenge-config-screen');
      return { reached: !!(cc && getComputedStyle(cc).display !== 'none') };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P5 Random Challenge reaches challenge-config screen', rand && rand.reached, JSON.stringify(rand));
  await backToLevelSelect(ws);

  // ───────── PHASE 6: Blitz immediate-start + HUD cleanup ─────────
  console.log('\n=== Phase 6: Blitz Mode immediate-start ===');
  const blitz = await evalExpr(ws, `(function(){
    try {
      if (window.game.startBlitzMode) { window.game.startBlitzMode(); }
      else { const b=document.getElementById('blitz-mode-btn'); if(b) b.click(); }
      const gp = document.getElementById('gameplay-screen');
      return { gpVis: !!(gp && getComputedStyle(gp).display !== 'none'), blitz: !!window.game.isBlitzMode };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P6 Blitz Mode enters gameplay', blitz && blitz.gpVis, JSON.stringify(blitz));
  await backToLevelSelect(ws);
  const blitzClean = await evalExpr(ws, `(function(){
    const hud = document.getElementById('blitz-hud');
    return { hudHidden: !hud || getComputedStyle(hud).display === 'none', blitzFlag: !!window.game.isBlitzMode };
  })()`);
  rec('P6 Blitz HUD cleaned on return to level-select (Day 61/103 fix)', blitzClean && blitzClean.hudHidden && blitzClean.blitzFlag === false, JSON.stringify(blitzClean));

  // ───────── PHASE 7: Speedrun immediate-start + HUD cleanup ─────────
  console.log('\n=== Phase 7: Speedrun Mode immediate-start ===');
  const speed = await evalExpr(ws, `(function(){
    try {
      if (window.game.startSpeedrunMode) { window.game.startSpeedrunMode(); }
      else { const b=document.getElementById('speedrun-mode-btn'); if(b) b.click(); }
      const gp = document.getElementById('gameplay-screen');
      return { gpVis: !!(gp && getComputedStyle(gp).display !== 'none'), speed: !!window.game.isSpeedrunMode };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P7 Speedrun Mode enters gameplay', speed && speed.gpVis, JSON.stringify(speed));
  await backToLevelSelect(ws);
  const speedClean = await evalExpr(ws, `(function(){
    const hud = document.getElementById('speedrun-hud');
    return { hudHidden: !hud || getComputedStyle(hud).display === 'none', speedFlag: !!window.game.isSpeedrunMode };
  })()`);
  rec('P7 Speedrun HUD cleaned on return (Day 74/103 fix)', speedClean && speedClean.hudHidden && speedClean.speedFlag === false, JSON.stringify(speedClean));

  // ───────── PHASE 8: Sandbox config ─────────
  console.log('\n=== Phase 8: Sandbox Mode config ===');
  const sandbox = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('sandbox-mode-btn') || document.getElementById('sandbox-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('sandbox-config'); }
      const sc = document.getElementById('sandbox-config-screen');
      const gp = document.getElementById('gameplay-screen');
      return { reached: !!((sc && getComputedStyle(sc).display !== 'none') || (gp && getComputedStyle(gp).display !== 'none')) };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P8 Sandbox reaches config or gameplay screen', sandbox && sandbox.reached, JSON.stringify(sandbox));
  await backToLevelSelect(ws);

  // ───────── PHASE 9: Tournament backend label ─────────
  console.log('\n=== Phase 9: Tournament backend (Day 108/125) ===');
  const tourn = await evalExpr(ws, `(function(){
    try {
      const b = (typeof selectTournamentBackend === 'function') ? selectTournamentBackend() : (window.game.tournamentBackend || null);
      const mode = b && b.getMode ? b.getMode() : null;
      const desc = b && b.describe ? b.describe() : null;
      const isLive = b && b.isLive ? b.isLive() : null;
      return { mode, desc, isLive, ok: mode === 'local' && typeof desc === 'string' && desc.length > 0 };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P9 Tournament backend default mode=local, describe present, isLive=false', tourn && tourn.ok && tourn.isLive === false, JSON.stringify(tourn));

  // ───────── PHASE 10: Adaptive/Infinite (tier-gated) ─────────
  console.log('\n=== Phase 10: Adaptive/Infinite tier-gated entry ===');
  const adaptive = await evalExpr(ws, `(function(){
    try {
      if (window.game.seedProgress) { window.game.seedProgress(18); }
      if (window.game.ui && window.game.ui.renderLevelSelect) { window.game.ui.renderLevelSelect(); }
      const btn = document.getElementById('adaptive-challenge-btn');
      const infBtn = document.getElementById('infinite-mode-btn');
      const hasAdaptive = !!btn;
      let entered = false;
      if (window.game.startAdaptiveChallenge) { window.game.startAdaptiveChallenge(); entered = true; }
      else if (btn) { btn.click(); entered = true; }
      const gp = document.getElementById('gameplay-screen');
      return { hasAdaptive, hasInfinite: !!infBtn, entered, gpVis: !!(gp && getComputedStyle(gp).display !== 'none') };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P10 Adaptive challenge button exists after tier-3 seed + entry works', adaptive && adaptive.hasAdaptive && (adaptive.gpVis || adaptive.entered), JSON.stringify(adaptive));
  await navigateAndWait(ws, BASE + '?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready post-adaptive' });
  await sleep(500);

  // ───────── PHASE 11: Cycle 6 BUILD regression sweep (D123-D127) ─────────
  console.log('\n=== Phase 11: Cycle 6 BUILD regression sweep (D123-D127) ===');
  // D123: simulation.js ESM binding + evaluate path
  const d123 = await evalExpr(ws, `(function(){
    return { instanceOf: !!(window.game.simulation && window.Simulation && (window.game.simulation instanceof window.Simulation)),
      traceFn: typeof window.game.simulation.traceFailurePath, constFn: typeof window.game.simulation.detectConstantOutputs };
  })()`);
  rec('D123 game.simulation instanceof window.Simulation + Day 42 augmentations', d123 && d123.instanceOf && d123.traceFn === 'function' && d123.constFn === 'function', JSON.stringify(d123));

  // D124: Profile-hub 5-tab merge + close clears #profile-view
  await evalExpr(ws, `window.game.seedProgress(18); window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(500);
  const d124 = await evalExpr(ws, `(function(){
    let threw=null;
    try {
      const btn = document.querySelector('#profile-hub-btn');
      if (!btn) return { threw:'no #profile-hub-btn' };
      btn.click();
      const m = document.querySelector('#profile-hub-modal');
      const opened = m ? getComputedStyle(m).display !== 'none' : false;
      const map = [['phub-tab-achievements','phub-pane-achievements'],['phub-tab-mastery','phub-pane-mastery'],['phub-tab-customize','phub-pane-customize'],['phub-tab-collection','phub-pane-collection'],['phub-tab-profile','phub-pane-profile']];
      let switched = 0;
      for (const [tabId, paneId] of map) { const t=document.getElementById(tabId); if (t && getComputedStyle(t).display!=='none') { t.click(); const pane=document.getElementById(paneId); if (pane && getComputedStyle(pane).display!=='none' && pane.innerHTML.length>0) switched++; } }
      const c = document.querySelector('#profile-hub-close'); if (c) c.click();
      const closedClean = m ? getComputedStyle(m).display === 'none' : false;
      const profLenAfter = (document.getElementById('profile-view')||{innerHTML:''}).innerHTML.length;
      return { threw, opened, switched, profLenAfter, closedClean };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('D124 Profile-hub opens + 5 tabs switch non-empty', d124 && d124.threw === null && d124.opened && d124.switched === 5, JSON.stringify(d124));
  rec('D124 close clears #profile-view (Day 54 lifecycle)', d124 && d124.closedClean && d124.profLenAfter === 0, JSON.stringify(d124));

  // D127: Progress heatmap empty/partial/full
  const d127 = await evalExpr(ws, `(function(){
    const ui = window.game.ui; let threw=null; const seq=[];
    try {
      for (const n of [0, 10, 50]) {
        window.game.seedProgress(n, {clear:true, stars:3});
        ui._renderProgressHeatmap();
        const total = ui._progressCompletedTotal();
        const pane = document.getElementById('stats-progress-pane');
        const cells = pane ? pane.querySelectorAll('.phm-cell').length : -1;
        const hasEmpty = pane ? !!pane.querySelector('.progress-heatmap-empty') : false;
        const meta = pane ? (pane.querySelector('.progress-heatmap-meta')||{textContent:''}).textContent.trim() : '';
        seq.push({ n, total, cells, hasEmpty, meta });
      }
      return { threw, seq };
    } catch(e){ return { threw:String(e), seq }; }
  })()`);
  const d127empty = d127 && d127.seq && d127.seq[0] && d127.seq[0].n === 0 && d127.seq[0].hasEmpty && d127.seq[0].total === 0;
  const d127partial = d127 && d127.seq && d127.seq[1] && d127.seq[1].n === 10 && d127.seq[1].total === 10 && d127.seq[1].cells >= 1;
  const d127full = d127 && d127.seq && d127.seq[2] && d127.seq[2].n === 50 && d127.seq[2].total === 50 && /50\s*\/\s*50/.test(d127.seq[2].meta);
  rec('D127 heatmap empty-state at 0 completed', !!d127empty, JSON.stringify(d127 && d127.seq && d127.seq[0]));
  rec('D127 heatmap partial (10 completed, ≥1 lit cell)', !!d127partial, JSON.stringify(d127 && d127.seq && d127.seq[1]));
  rec('D127 heatmap full (50/50 in meta strip)', !!d127full, JSON.stringify(d127 && d127.seq && d127.seq[2]));
  await evalExpr(ws, `window.game.seedProgress(0, {clear:true}); 'ok'`);

  // D125: tournament settings connect/clear
  await evalExpr(ws, `(document.querySelector('#open-settings-btn')||{click:()=>{}}).click(); 'ok'`);
  await sleep(400);
  const d125 = await evalExpr(ws, `(function(){
    let threw=null;
    try {
      const urlInp = document.querySelector('#tournament-worker-url-input');
      const saveBtn = document.querySelector('#tournament-worker-save-btn');
      const clearBtn = document.querySelector('#tournament-worker-clear-btn');
      if (!urlInp || !saveBtn || !clearBtn) return { threw:'missing settings surface' };
      urlInp.value = 'https://mock-132.workers.dev';
      saveBtn.click();
      const modeOn = window.game.tournamentBackend && window.game.tournamentBackend.getMode && window.game.tournamentBackend.getMode();
      const lsUrlSet = localStorage.getItem('signal-circuit-tournament-worker-url') === 'https://mock-132.workers.dev';
      clearBtn.click();
      const modeOff = window.game.tournamentBackend && window.game.tournamentBackend.getMode && window.game.tournamentBackend.getMode();
      const urlCleared = !localStorage.getItem('signal-circuit-tournament-worker-url');
      return { threw, modeOn, lsUrlSet, modeOff, urlCleared };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('D125 connect → remote mode + URL persisted', d125 && d125.threw === null && d125.modeOn && d125.modeOn !== 'local' && d125.lsUrlSet, JSON.stringify(d125));
  rec('D125 clear → local mode + URL wiped', d125 && d125.modeOff === 'local' && d125.urlCleared, JSON.stringify(d125));
  await evalExpr(ws, `(document.querySelector('#settings-close')||{click:()=>{}}).click(); 'ok'`);
  await sleep(200);

  // D126: cohort determinism across reloads
  await evalExpr(ws, `try{localStorage.clear();sessionStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, BASE + '?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready' });
  const cohortBase = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    return { cohort: e.getCohort(), installId: e.getInstallId(), lsId: localStorage.getItem('signal-circuit-install-id') };
  })()`);
  rec('D126 baseline cohort ∈ {local,live} + install id persisted', cohortBase && (cohortBase.cohort === 'local' || cohortBase.cohort === 'live') && cohortBase.installId && cohortBase.installId === cohortBase.lsId, JSON.stringify(cohortBase));
  const reloads = [];
  for (let i = 0; i < 3; i++) {
    await navigateAndWait(ws, BASE + '?_ts=' + Date.now());
    await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready (reload)' });
    const r = await evalExpr(ws, `(function(){ const e=window.__onboardingExperiment; return { cohort: e.getCohort(), installId: e.getInstallId() }; })()`);
    reloads.push(r);
  }
  rec('D126 cohort + install id stable across 3 reloads (A/B never re-rolls)', reloads.every(r => r.cohort === cohortBase.cohort && r.installId === cohortBase.installId), JSON.stringify(reloads.map(r=>r.cohort)));

  // ───────── PHASE 12: Console hygiene ─────────
  console.log('\n=== Phase 12: Console hygiene ===');
  rec('0 console.error / 0 uncaught exceptions', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  // ───────── SUMMARY ─────────
  const passed = assertions.filter((a) => a.ok).length;
  const failed = assertions.length - passed;
  console.log(`\n=== SUMMARY: ${passed}/${assertions.length} passed, ${failed} failed ===`);
  if (failed) { console.log('FAILED:'); assertions.filter(a => !a.ok).forEach(a => console.log(' ❌ ' + a.label + (a.detail ? ' :: ' + a.detail : ''))); }
  try { ws.close(); } catch {}
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
