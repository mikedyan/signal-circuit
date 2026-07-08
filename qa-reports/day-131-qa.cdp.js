#!/usr/bin/env node
/**
 * Day 131 QA harness — Cycle 6 HARDEN Week Day 4: Fix Everything (rest-day confirmation probe).
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). LO-2 recovery flow:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-131-qa.cdp.js
 *   tools/cdp-launch.sh stop
 *
 * Build under test: Day 127 (?v=1783036800 / sw v81 / 50 level cards) — unchanged
 * (HARDEN policy, empty Open Bugs queue → Day 90/100/116 rest-day precedent).
 *
 * Coverage (HARDEN Week Thursday spec — Fix Everything with empty queue → tight
 * confirmation probe; cloned from day-116 rest-day + day-130 Cycle-6 surfaces):
 *   Standing regression floor:
 *     Build identity, cold-start (50 cards / 2 nav), ESM bindings
 *     (Day 92 Gate, Day 107 Wire, Day 123 Simulation), Day 79 dead-ids.
 *   Cycle 6 BUILD-surface confirmation:
 *     D123 game.simulation instanceof window.Simulation + evaluate path
 *     D124 Profile-hub 5-tab merge + close-clears-#profile-view
 *     D125 tournament settings connect/clear
 *     D126 cohort determinism across reloads
 *     D127 heatmap empty/partial/full states
 *   High-signal stress seams (Day 116 precedent):
 *     rapid gate placement during sim, mid-animation wire push, resize storm,
 *     RUN/Quick Test spam, undo/redo stress.
 *   Console hygiene (0 console.error, 0 Runtime.exceptionThrown).
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();
const BUILD_V = '?v=1783036800';
const SW_V = 'signal-circuit-v81';

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
async function waitFor(ws, predicate, { timeoutMs = 10000, intervalMs = 250, label = 'waitFor' } = {}) {
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
  await sleep(1500);
  await waitFor(ws, `() => !!document.body`, { label: 'body present' });
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
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'http://localhost:8901', storageTypes: 'all' }); } catch {}

  async function enterL1() {
    await evalExpr(ws, `window.game.startLevel(1)`);
    await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L1 gameplay' });
  }

  // ───────── PHASE 1: Build identity (Day 127 build, HARDEN-pinned) ─────────
  console.log('\n=== Phase 1: Build identity (Day 127 build, HARDEN-pinned) ===');
  await navigateAndWait(ws, TARGET_URL);
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);
  const html = await evalExpr(ws, `fetch('/index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('11 cache-bust refs at ?v=1783036800', (html.match(/\?v=1783036800/g) || []).length === 11, `found=${(html.match(/\?v=1783036800/g) || []).length}`);
  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('sw.js CACHE_NAME = signal-circuit-v81', new RegExp(`CACHE_NAME\\s*=\\s*'${SW_V}'`).test(swText));

  // ───────── PHASE 2: Cold-start invariants + ESM bindings ─────────
  console.log('\n=== Phase 2: Cold-start invariants + ESM bindings ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+ui ready' });
  await sleep(500);
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
  rec('Day 92 window.Gate function + 8 GateTypes', bindings.gate === 'function' && bindings.gateTypes === 8, JSON.stringify(bindings));
  rec('Day 107 window.Wire + WireManager bound', bindings.wire === 'function' && bindings.wireMgr === 'function', `wire=${bindings.wire} mgr=${bindings.wireMgr}`);
  rec('Day 123 window.Simulation bound (ESM)', bindings.sim === 'function', `sim=${bindings.sim}`);
  rec('LEVELS = 50', bindings.levels === 50, `levels=${bindings.levels}`);
  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    return { allUndef: ids.every(n => typeof window[n] === 'undefined'), weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers still undefined + #weekly-puzzle-btn absent', deadIds.allUndef && deadIds.weeklyBtn === false, JSON.stringify(deadIds));

  // ───────── PHASE 3: D123 simulation.js ESM binding + evaluate path ─────────
  console.log('\n=== Phase 3: D123 simulation.js ESM binding + evaluate path ===');
  const d123bind = await evalExpr(ws, `(function(){
    return { instanceOf: !!(window.game.simulation && window.Simulation && (window.game.simulation instanceof window.Simulation)),
      traceFn: typeof window.game.simulation.traceFailurePath, constFn: typeof window.game.simulation.detectConstantOutputs };
  })()`);
  rec('D123 game.simulation instanceof window.Simulation', d123bind && d123bind.instanceOf, JSON.stringify(d123bind));
  rec('D123 Day 42 prototype augmentations present', d123bind && d123bind.traceFn === 'function' && d123bind.constFn === 'function', JSON.stringify(d123bind));
  await enterL1();
  const d123eval = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null;
    try {
      const g = new window.Gate('AND', 400, 300, (gs.nextGateId!==undefined?gs.nextGateId++:5001));
      gs.gates.push(g);
      const ins = gs.inputNodes, outs = gs.outputNodes;
      gs.wireManager.wires.push(new window.Wire(ins[0].id, 0, g.id, 0, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(ins[1].id, 0, g.id, 1, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(g.id, 0, outs[0].id, 0, gs.wireManager.nextId++));
      gs.runQuickTest && gs.runQuickTest();
      const stars = (gs.progress && gs.progress.levels && gs.progress.levels[1]) ? gs.progress.levels[1].stars : null;
      return { threw, stars };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('D123 L1 AND-gate solve → runQuickTest evaluates → 3★ persists', d123eval && d123eval.threw === null && d123eval.stars === 3, JSON.stringify(d123eval));
  await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b)b.click(); else window.game.ui.showScreen('level-select'); })()`);
  await sleep(300);

  // ───────── PHASE 4: D124 Profile-hub 5-tab merge + close-clears ─────────
  console.log('\n=== Phase 4: D124 Profile-hub 5-tab merge + close-clears-#profile-view ===');
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
      // panes are shown via style.display (id phub-pane-<key>), not an .active class
      const map = [['phub-tab-achievements','phub-pane-achievements'],['phub-tab-mastery','phub-pane-mastery'],['phub-tab-customize','phub-pane-customize'],['phub-tab-collection','phub-pane-collection'],['phub-tab-profile','phub-pane-profile']];
      let switched = 0;
      for (const [tabId, paneId] of map) { const t=document.getElementById(tabId); if (t && getComputedStyle(t).display!=='none') { t.click(); const pane=document.getElementById(paneId); if (pane && getComputedStyle(pane).display!=='none' && pane.innerHTML.length>0) switched++; } }
      const profLenBefore = (document.getElementById('profile-view')||{innerHTML:''}).innerHTML.length;
      const c = document.querySelector('#profile-hub-close'); if (c) c.click();
      const closedClean = m ? getComputedStyle(m).display === 'none' : false;
      const profLenAfter = (document.getElementById('profile-view')||{innerHTML:''}).innerHTML.length;
      return { threw, opened, switched, profLenBefore, profLenAfter, closedClean };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('D124 Profile-hub opens + 5 tabs switch non-empty', d124 && d124.threw === null && d124.opened && d124.switched === 5, JSON.stringify(d124));
  rec('D124 close clears #profile-view (Day 54 lifecycle)', d124 && d124.closedClean && d124.profLenAfter === 0, JSON.stringify(d124));

  // ───────── PHASE 5: D127 heatmap empty/partial/full ─────────
  console.log('\n=== Phase 5: D127 Progress heatmap empty/partial/full ===');
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

  // ───────── PHASE 6: D125 tournament settings connect/clear ─────────
  console.log('\n=== Phase 6: D125 tournament settings connect/clear ===');
  await evalExpr(ws, `(document.querySelector('#open-settings-btn')||{click:()=>{}}).click(); 'ok'`);
  await sleep(400);
  const d125 = await evalExpr(ws, `(function(){
    let threw=null;
    try {
      const urlInp = document.querySelector('#tournament-worker-url-input');
      const saveBtn = document.querySelector('#tournament-worker-save-btn');
      const clearBtn = document.querySelector('#tournament-worker-clear-btn');
      if (!urlInp || !saveBtn || !clearBtn) return { threw:'missing settings surface' };
      urlInp.value = 'https://mock-131.workers.dev';
      saveBtn.click();
      const modeOn = window.game.tournamentBackend && window.game.tournamentBackend.getMode && window.game.tournamentBackend.getMode();
      const lsUrlSet = localStorage.getItem('signal-circuit-tournament-worker-url') === 'https://mock-131.workers.dev';
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

  // ───────── PHASE 7: D126 cohort determinism across reloads ─────────
  console.log('\n=== Phase 7: D126 cohort determinism across reloads ===');
  await evalExpr(ws, `try{localStorage.clear();sessionStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready' });
  const base = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    return { cohort: e.getCohort(), installId: e.getInstallId(), lsId: localStorage.getItem('signal-circuit-install-id') };
  })()`);
  rec('D126 baseline cohort ∈ {local,live} + install id persisted', base && (base.cohort === 'local' || base.cohort === 'live') && base.installId && base.installId === base.lsId, JSON.stringify(base));
  const reloads = [];
  for (let i = 0; i < 3; i++) {
    await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
    await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready (reload)' });
    const r = await evalExpr(ws, `(function(){ const e=window.__onboardingExperiment; const s=e.getSessionStats?e.getSessionStats():null; return { cohort: e.getCohort(), installId: e.getInstallId(), days: e.getDaysActive?e.getDaysActive():null }; })()`);
    reloads.push(r);
  }
  rec('D126 cohort + install id stable across 3 reloads (A/B never re-rolls)', reloads.every(r => r.cohort === base.cohort && r.installId === base.installId), JSON.stringify(reloads.map(r=>r.cohort)));

  // ───────── PHASE 8: Stress seams (Day 116 precedent) ─────────
  console.log('\n=== Phase 8: Stress seams — gate placement / wires / RUN / undo ===');
  await evalExpr(ws, `try{localStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready' });
  await enterL1();
  const stress = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null;
    try {
      // rapid gate placement during sim
      gs.runSimulation && gs.runSimulation();
      for (let i=0;i<25;i++){ const id=(gs.nextGateId!==undefined?gs.nextGateId++:6000+i); gs.gates.push(new window.Gate('AND',200+i*6,200+i*3,id)); if(gs.renderer)gs.renderer.render(); }
      // mid-animation wire push
      gs.isAnimating = true;
      const ins = gs.inputNodes;
      for (let i=0;i<10;i++){ gs.wireManager.wires.push(new window.Wire(ins[0].id,0,gs.gates[gs.gates.length-1].id,0,gs.wireManager.nextId++)); if(gs.renderer)gs.renderer.render(); }
      gs.isAnimating = false;
      // RUN + Quick Test spam
      for (let i=0;i<10;i++){ gs.runSimulation && gs.runSimulation(); }
      for (let i=0;i<10;i++){ gs.runQuickTest && gs.runQuickTest(); }
      // undo/redo stress
      for (let i=0;i<20;i++){ try{ gs.undoManager.undo(); }catch(e){} }
      for (let i=0;i<20;i++){ try{ gs.undoManager.redo(); }catch(e){} }
      if (gs.renderer) gs.renderer.render();
      return { threw, ok:true };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('Stress seams (gate/wire/RUN/undo storm) — no throw', stress && stress.threw === null, JSON.stringify(stress));

  // resize storm
  const sizes = [[800,600],[375,667],[1440,900],[320,568],[1920,1080]];
  for (const [w,h] of sizes) {
    try { await send(ws, 'Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); } catch {}
    await evalExpr(ws, `(function(){ try{ window.dispatchEvent(new Event('resize')); if(window.game.renderer){ window.game.renderer.resize && window.game.renderer.resize(); window.game.renderer.render(); } return true;}catch(e){return String(e);} })()`);
  }
  try { await send(ws, 'Emulation.clearDeviceMetricsOverride'); } catch {}
  const resz = await evalExpr(ws, `(function(){ try{ window.game.renderer.render(); return { ok:true, screen: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none' }; }catch(e){ return { ok:false, err:String(e) }; } })()`);
  rec('Resize storm mid-gameplay — renders clean, screen intact', resz && resz.ok && resz.screen, JSON.stringify(resz));

  // ───────── PHASE 9: Cycle 6 BUILD regression sweep (structural) ─────────
  console.log('\n=== Phase 9: Cycle 6 BUILD regression sweep (structural) ===');
  const reg = await evalExpr(ws, `(function(){
    const lv48 = getLevel(48);
    return {
      tourMode: (window.game.tournamentBackend && window.game.tournamentBackend.getMode) ? window.game.tournamentBackend.getMode() : null,
      l48lab: !!(lv48 && lv48.isLabBench) && lv48.maxFanOut === 2 && lv48.gateHardCap === 3,
      progFn: typeof window.game.ui._renderProgressHeatmap === 'function' && typeof window.game.ui._progressCompletedTotal === 'function',
      cohortFn: !!(window.__onboardingExperiment && typeof window.__onboardingExperiment.getCohort === 'function'),
    };
  })()`);
  rec('D108/125 tournament backend default mode=local', reg && reg.tourMode === 'local', `mode=${reg && reg.tourMode}`);
  rec('D109 L48 lab metadata (maxFanOut=2, hardCap=3)', reg && reg.l48lab, JSON.stringify(reg));
  rec('D127 heatmap render fns present', reg && reg.progFn, JSON.stringify(reg));
  rec('D126 cohort instrumentation present', reg && reg.cohortFn, JSON.stringify(reg));

  // ───────── PHASE 10: Console hygiene ─────────
  console.log('\n=== Phase 10: Console hygiene ===');
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
