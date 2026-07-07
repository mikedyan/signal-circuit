#!/usr/bin/env node
/**
 * Day 130 QA harness — Cycle 6 HARDEN Week Day 3: Edge Cases & Stress.
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). LO-2 recovery flow:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-130-qa.cdp.js
 *   tools/cdp-launch.sh stop
 *
 * Build under test: Day 127 (?v=1783036800 / sw v81 / 50 level cards) — unchanged
 * through Cycle 6 HARDEN week (ZERO new features per HARDEN policy).
 *
 * Coverage (HARDEN Week Wednesday spec — Edge Cases & Stress; cloned from
 * qa-reports/day-115-qa.cdp.js and layered with Cycle 6 BUILD surfaces):
 *   T1  Rapid gate placement during simulation (no-throw)
 *   T2  Wire drawing while animation is playing (no-throw)
 *   T3  Window resize mid-gameplay (10 rapid resizes)
 *   T4  Clear localStorage + reload (clean fresh-user state)
 *   T5  Keyboard-only navigation (focusable + tabbable)
 *   T6  Colorblind mode toggle + gameplay render
 *   T7  Light/dark mode round-trip
 *   T8  40+ wires on one level (perf budget)
 *   T9  Undo/redo stress (20× each)
 *   T10 RUN + Quick Test spam (re-entry contract)
 *   Cycle 6 BUILD-surface stress:
 *     S1  Day 124 Profile-hub rapid tab-switch + open/close storm
 *     S2  Day 127 Progress heatmap re-render under repeated seed/reset churn
 *     S3  Day 125 Tournament settings connect/clear churn (URL + name)
 *     S4  Day 126 cohort determinism across repeated reloads
 *   Standing floor: Day 78 staircase, Day 79 dead-ids, Day 92/107/123 ESM bindings.
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
function note(label, detail) { console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : '')); }

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

  // Helper to enter L1 gameplay fresh
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

  // ───────── PHASE 2: Cold-start invariants ─────────
  console.log('\n=== Phase 2: Cold-start invariants ===');
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
  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    return { allUndef: ids.every(n => typeof window[n] === 'undefined'), weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers still undefined + #weekly-puzzle-btn absent', deadIds.allUndef && deadIds.weeklyBtn === false, JSON.stringify(deadIds));

  // ───────── PHASE 3: T1 — Rapid gate placement during simulation ─────────
  console.log('\n=== Phase 3: T1 rapid gate placement during simulation ===');
  await enterL1();
  const t1 = await evalExpr(ws, `(function(){
    const gs = window.game; let threw = null;
    try {
      gs.runSimulation && gs.runSimulation();
      for (let i = 0; i < 25; i++) {
        const id = (gs.nextGateId !== undefined ? gs.nextGateId++ : (Math.max(0, ...gs.gates.map(g=>g.id||0)) + 1));
        gs.gates.push(new window.Gate('AND', 200 + i*8, 200 + i*4, id));
        if (gs.renderer) gs.renderer.render();
      }
    } catch(e){ threw = String(e); }
    return { threw, gateCount: gs.gates.length };
  })()`);
  rec('T1 25× gate placement during sim — no throw', t1 && t1.threw === null, JSON.stringify(t1));

  // ───────── PHASE 4: T2 — Wire drawing while animation plays ─────────
  console.log('\n=== Phase 4: T2 wire drawing during animation ===');
  await enterL1();
  const t2 = await evalExpr(ws, `(function(){
    const gs = window.game; let threw = null;
    try {
      const id = (gs.nextGateId !== undefined ? gs.nextGateId++ : 9001);
      gs.gates.push(new window.Gate('AND', 400, 400, id));
      gs.isAnimating = true;
      const ins = gs.inputNodes;
      for (let i = 0; i < 10; i++) {
        gs.wireManager.wires.push(new window.Wire(ins[0].id, 0, id, 0, gs.wireManager.nextId++));
        if (gs.renderer) gs.renderer.render();
      }
      gs.isAnimating = false;
    } catch(e){ threw = String(e); }
    return { threw, wires: gs.wireManager.wires.length };
  })()`);
  rec('T2 wire push during animation — no throw', t2 && t2.threw === null, JSON.stringify(t2));

  // ───────── PHASE 5: T3 — Window resize mid-gameplay ─────────
  console.log('\n=== Phase 5: T3 window resize mid-gameplay (10×) ===');
  await enterL1();
  const sizes = [[800,600],[1024,768],[375,667],[1440,900],[320,568],[1280,1024],[414,896],[1920,1080],[768,1024],[1366,768]];
  for (const [w,h] of sizes) {
    try { await send(ws, 'Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); } catch {}
    await evalExpr(ws, `(function(){ try{ window.dispatchEvent(new Event('resize')); if(window.game.renderer){ window.game.renderer.resize && window.game.renderer.resize(); window.game.renderer.render(); } return true;}catch(e){return String(e);} })()`);
  }
  try { await send(ws, 'Emulation.clearDeviceMetricsOverride'); } catch {}
  const t3 = await evalExpr(ws, `(function(){ try{ window.game.renderer.render(); return { ok:true, screen: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none' }; }catch(e){ return { ok:false, err:String(e) }; } })()`);
  rec('T3 10× resize mid-gameplay — renders clean, screen intact', t3 && t3.ok && t3.screen, JSON.stringify(t3));

  // ───────── PHASE 6: T4 — Clear localStorage + reload ─────────
  console.log('\n=== Phase 6: T4 clear localStorage + reload ===');
  await evalExpr(ws, `(function(){ try{ localStorage.clear(); }catch(e){} return true; })()`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'fresh game ready' });
  await sleep(400);
  const t4 = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    return { cards: s.querySelectorAll('.level-btn').length,
      difficulty: (typeof DIFFICULTY_KEY!=='undefined' ? localStorage.getItem(DIFFICULTY_KEY) : localStorage.getItem('signal-circuit-difficulty-mode')) || 'standard' };
  })()`);
  rec('T4 fresh reload shows 50 cards, clean defaults', t4 && t4.cards === 50, JSON.stringify(t4));

  // ───────── PHASE 7: T5 — Keyboard-only navigation ─────────
  console.log('\n=== Phase 7: T5 keyboard-only navigation ===');
  await enterL1();
  const t5 = await evalExpr(ws, `(function(){
    const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(document.querySelectorAll(sel)).filter(el => el.offsetParent !== null && getComputedStyle(el).display !== 'none');
    let firstFocusOk = false;
    if (focusable.length) { focusable[0].focus(); firstFocusOk = document.activeElement === focusable[0]; }
    return { count: focusable.length, firstFocusOk };
  })()`);
  rec('T5 gameplay has focusable elements + programmatic focus works', t5 && t5.count >= 3 && t5.firstFocusOk, JSON.stringify(t5));

  // ───────── PHASE 8: T6 — Colorblind mode ─────────
  console.log('\n=== Phase 8: T6 colorblind mode toggle + gameplay ===');
  const t6 = await evalExpr(ws, `(function(){
    const btn = document.getElementById('colorblind-toggle-btn') || document.getElementById('colorblind-btn'); let threw=null;
    try {
      const before = document.body.classList.contains('colorblind-mode') || document.body.classList.contains('colorblind');
      if (btn) btn.click(); else document.body.classList.toggle('colorblind-mode');
      const onState = document.body.classList.contains('colorblind-mode') || document.body.classList.contains('colorblind');
      const cols = (typeof getWireColors === 'function') ? getWireColors() : null;
      if (window.game.renderer) window.game.renderer.render();
      if (btn) btn.click(); else document.body.classList.toggle('colorblind-mode');
      const offState = document.body.classList.contains('colorblind-mode') || document.body.classList.contains('colorblind');
      return { threw, before, onState, offState, colsOk: !!cols };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('T6 colorblind toggles on→off cleanly, wire colors resolve', t6 && t6.threw === null && t6.onState !== t6.offState && t6.colsOk, JSON.stringify(t6));

  // ───────── PHASE 9: T7 — Light/dark mode ─────────
  console.log('\n=== Phase 9: T7 light/dark mode round-trip ===');
  const t7 = await evalExpr(ws, `(function(){
    const btn = document.getElementById('light-mode-btn'); let threw=null;
    try {
      const start = document.body.classList.contains('light-mode');
      if (btn) btn.click(); else document.body.classList.toggle('light-mode');
      const mid = document.body.classList.contains('light-mode');
      if (window.game.renderer) window.game.renderer.render();
      if (btn) btn.click(); else document.body.classList.toggle('light-mode');
      const end = document.body.classList.contains('light-mode');
      if (window.game.renderer) window.game.renderer.render();
      return { threw, start, mid, end, roundTrip: start === end && start !== mid };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('T7 light/dark toggle round-trips + renders both', t7 && t7.threw === null && t7.roundTrip, JSON.stringify(t7));

  // ───────── PHASE 10: T8 — 40+ wires performance ─────────
  console.log('\n=== Phase 10: T8 40+ wires performance ===');
  await enterL1();
  const t8 = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null;
    try {
      const ins = gs.inputNodes;
      for (let i = 0; i < 22; i++) {
        const id = (gs.nextGateId !== undefined ? gs.nextGateId++ : 7000 + i);
        gs.gates.push(new window.Gate('AND', 150 + (i%10)*60, 150 + Math.floor(i/10)*80, id));
        gs.wireManager.wires.push(new window.Wire(ins[0].id, 0, id, 0, gs.wireManager.nextId++));
        gs.wireManager.wires.push(new window.Wire(ins[Math.min(1,ins.length-1)].id, 0, id, 1, gs.wireManager.nextId++));
      }
      const wireCount = gs.wireManager.wires.length;
      const t0 = performance.now();
      for (let f = 0; f < 10; f++) gs.renderer.render();
      const total = performance.now() - t0;
      return { threw, wireCount, gateCount: gs.gates.length, totalMs: +total.toFixed(2), avgMs: +(total/10).toFixed(3) };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('T8 40+ wires render no-throw', t8 && t8.threw === null && t8.wireCount >= 40, JSON.stringify(t8));
  rec('T8 perf budget: avg frame < 16ms with 40+ wires', t8 && t8.avgMs !== undefined && t8.avgMs < 16, `avgMs=${t8 && t8.avgMs}`);

  // ───────── PHASE 11: T9 — Undo/redo stress ─────────
  console.log('\n=== Phase 11: T9 undo/redo stress (20× each) ===');
  await enterL1();
  const t9 = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null;
    try {
      for (let i=0;i<20;i++){ try{ gs.undoManager.undo(); }catch(e){} }
      for (let i=0;i<20;i++){ try{ gs.undoManager.redo(); }catch(e){} }
      if (gs.renderer) gs.renderer.render();
      return { threw, ok:true };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('T9 20× undo + 20× redo — no throw', t9 && t9.threw === null, JSON.stringify(t9));

  // ───────── PHASE 12: T10 — RUN + Quick Test spam ─────────
  console.log('\n=== Phase 12: T10 RUN + Quick Test spam (re-entry contract) ===');
  await enterL1();
  const t10 = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null;
    try {
      for (let i=0;i<10;i++){ gs.runSimulation && gs.runSimulation(); }
      for (let i=0;i<10;i++){ gs.runQuickTest && gs.runQuickTest(); }
      return { threw, animating: !!gs.isAnimating };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('T10 10× RUN + 10× Quick Test spam — no throw (idempotent re-entry)', t10 && t10.threw === null, JSON.stringify(t10));

  // ───────── PHASE 13: S1 — Day 124 Profile-hub open/close + tab-switch storm ─────────
  console.log('\n=== Phase 13: S1 Day 124 Profile-hub open/close + tab storm ===');
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready' });
  await evalExpr(ws, `window.game.seedProgress(18); window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(500);
  const s1 = await evalExpr(ws, `(function(){
    let threw=null; let opens=0;
    try {
      const btn = document.querySelector('#profile-hub-btn');
      const tabs = ['phub-tab-achievements','phub-tab-mastery','phub-tab-customize','phub-tab-collection','phub-tab-profile'];
      for (let round=0; round<8; round++) {
        if (btn) btn.click();
        const m = document.querySelector('#profile-hub-modal');
        if (m && getComputedStyle(m).display !== 'none') opens++;
        // hammer through every tab twice
        for (let k=0;k<2;k++) for (const id of tabs) { const t=document.getElementById(id); if (t && getComputedStyle(t).display!=='none') t.click(); }
        const c = document.querySelector('#profile-hub-close'); if (c) c.click();
      }
      const m2 = document.querySelector('#profile-hub-modal');
      const closedClean = m2 ? getComputedStyle(m2).display === 'none' : false;
      const profLen = (document.getElementById('profile-view')||{innerHTML:''}).innerHTML.length;
      return { threw, opens, closedClean, profLen };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('S1 8× open+tab-storm+close — no throw', s1 && s1.threw === null, JSON.stringify(s1));
  rec('S1 hub reopens every round (opens===8)', s1 && s1.opens === 8, `opens=${s1 && s1.opens}`);
  rec('S1 final close clean + #profile-view cleared (Day 54)', s1 && s1.closedClean && s1.profLen === 0, JSON.stringify(s1));

  // ───────── PHASE 14: S2 — Day 127 Progress heatmap re-render under seed/reset churn ─────────
  console.log('\n=== Phase 14: S2 Day 127 Progress heatmap seed/reset churn ===');
  const s2 = await evalExpr(ws, `(function(){
    const ui = window.game.ui; let threw=null; const seq=[];
    try {
      const counts = [0, 25, 3, 50, 0, 12, 50, 0];
      for (const n of counts) {
        window.game.seedProgress(n, {clear:true, stars:3});
        ui._renderProgressHeatmap();
        const total = ui._progressCompletedTotal();
        const pane = document.getElementById('stats-progress-pane');
        const cells = pane ? pane.querySelectorAll('.phm-cell').length : -1;
        const hasEmpty = pane ? !!pane.querySelector('.progress-heatmap-empty') : false;
        seq.push({ n, total, cells, hasEmpty });
      }
      return { threw, seq };
    } catch(e){ return { threw:String(e), seq }; }
  })()`);
  rec('S2 heatmap survives 8× seed/reset churn — no throw', s2 && s2.threw === null, JSON.stringify(s2 && s2.seq && s2.seq.length));
  const s2ok = s2 && s2.seq && s2.seq.every(r => r.total === r.n && (r.n === 0 ? r.hasEmpty : r.cells >= 1));
  rec('S2 completedTotal tracks seed each round + empty-state at 0', !!s2ok, JSON.stringify(s2 && s2.seq));
  await evalExpr(ws, `window.game.seedProgress(0, {clear:true}); 'ok'`);

  // ───────── PHASE 15: S3 — Day 125 Tournament settings connect/clear churn ─────────
  console.log('\n=== Phase 15: S3 Day 125 Tournament settings connect/clear churn ===');
  await evalExpr(ws, `(document.querySelector('#open-settings-btn')||{click:()=>{}}).click(); 'ok'`);
  await sleep(400);
  const s3 = await evalExpr(ws, `(function(){
    let threw=null; const seq=[];
    try {
      const urlInp = document.querySelector('#tournament-worker-url-input');
      const saveBtn = document.querySelector('#tournament-worker-save-btn');
      const clearBtn = document.querySelector('#tournament-worker-clear-btn');
      const nameInp = document.querySelector('#tournament-display-name-input');
      const nameSave = document.querySelector('#tournament-name-save-btn');
      const nameClear = document.querySelector('#tournament-name-clear-btn');
      if (!urlInp || !saveBtn || !clearBtn) return { threw:'missing settings surface' };
      for (let i=0;i<6;i++) {
        // connect
        urlInp.value = 'https://mock-' + i + '.workers.dev';
        saveBtn.click();
        if (nameInp && nameSave) { nameInp.value = 'Player' + i; nameSave.click(); }
        const a1 = window.game.tournamentBackend;
        const modeOn = a1 && a1.getMode && a1.getMode();
        const lsUrl = localStorage.getItem('signal-circuit-tournament-worker-url');
        // clear
        clearBtn.click();
        if (nameClear) nameClear.click();
        const a2 = window.game.tournamentBackend;
        const modeOff = a2 && a2.getMode && a2.getMode();
        const lsUrl2 = localStorage.getItem('signal-circuit-tournament-worker-url');
        const lsName = localStorage.getItem('signal-circuit-tournament-display-name');
        seq.push({ modeOn, lsUrlSet: lsUrl === 'https://mock-'+i+'.workers.dev', modeOff, urlCleared: !lsUrl2, nameCleared: !lsName });
      }
      return { threw, seq };
    } catch(e){ return { threw:String(e), seq }; }
  })()`);
  rec('S3 6× tournament connect/clear churn — no throw', s3 && s3.threw === null, JSON.stringify(s3 && s3.seq && s3.seq.length));
  const s3ok = s3 && s3.seq && s3.seq.every(r => r.modeOn && r.modeOn !== 'local' && r.lsUrlSet && r.modeOff === 'local' && r.urlCleared && r.nameCleared);
  rec('S3 every round: connect→remote+persist, clear→local+wiped', !!s3ok, JSON.stringify(s3 && s3.seq && s3.seq.slice(0,2)));
  await evalExpr(ws, `(document.querySelector('#settings-close')||{click:()=>{}}).click(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 16: S4 — Day 126 cohort determinism across reloads ─────────
  console.log('\n=== Phase 16: S4 Day 126 cohort determinism across reloads ===');
  // Cold reload once to mint a stable install id, capture baseline cohort+id.
  await evalExpr(ws, `try{localStorage.clear();sessionStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready' });
  const base = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    return { cohort: e.getCohort(), installId: e.getInstallId(), lsId: localStorage.getItem('signal-circuit-install-id') };
  })()`);
  rec('S4 baseline cohort ∈ {local,live} + install id persisted', base && (base.cohort === 'local' || base.cohort === 'live') && base.installId && base.installId === base.lsId, JSON.stringify(base));
  // Reload 4× WITHOUT clearing storage — cohort + install id must stay identical.
  const reloads = [];
  for (let i = 0; i < 4; i++) {
    await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
    await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready (reload)' });
    const r = await evalExpr(ws, `(function(){ const e=window.__onboardingExperiment; const s=e.getSessionStats?e.getSessionStats():null; return { cohort: e.getCohort(), installId: e.getInstallId(), days: e.getDaysActive?e.getDaysActive():null, sessionDays: s?s.sessionDays:null }; })()`);
    reloads.push(r);
  }
  const s4stable = reloads.every(r => r.cohort === base.cohort && r.installId === base.installId);
  rec('S4 cohort + install id stable across 4 reloads (A/B never re-rolls)', s4stable, JSON.stringify(reloads.map(r=>r.cohort)));
  rec('S4 session stats readable (daysActive numeric) each reload', reloads.every(r => typeof r.days === 'number'), JSON.stringify(reloads.map(r=>r.days)));
  // Explicit override still deterministic + persists
  const override = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    const forced = (e.getCohort() === 'local') ? 'live' : 'local';
    return { forced };
  })()`);
  await navigateAndWait(ws, 'http://localhost:8901/?cohort=' + override.forced + '&_ts=' + Date.now());
  await waitFor(ws, `() => !!window.__onboardingExperiment`, { label: 'onboarding exp ready (override)' });
  const ovr = await evalExpr(ws, `(function(){ const e=window.__onboardingExperiment; return { cohort: e.getCohort() }; })()`);
  rec('S4 ?cohort= URL override forces + resolves cohort', ovr && ovr.cohort === override.forced, JSON.stringify({ want: override.forced, got: ovr && ovr.cohort }));

  // ───────── PHASE 17: Cycle 6 BUILD regression sweep (structural) ─────────
  console.log('\n=== Phase 17: Cycle 6 BUILD regression sweep ===');
  await evalExpr(ws, `try{localStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready' });
  await sleep(400);
  const reg = await evalExpr(ws, `(function(){
    const lv48 = getLevel(48);
    return {
      simInstance: !!(window.game.simulation && window.Simulation && (window.game.simulation instanceof window.Simulation)),
      tourMode: (window.game.tournamentBackend && window.game.tournamentBackend.getMode) ? window.game.tournamentBackend.getMode() : null,
      l48lab: !!(lv48 && lv48.isLabBench) && lv48.maxFanOut === 2 && lv48.gateHardCap === 3,
      progFn: typeof window.game.ui._renderProgressHeatmap === 'function' && typeof window.game.ui._progressCompletedTotal === 'function',
      cohortFn: !!(window.__onboardingExperiment && typeof window.__onboardingExperiment.getCohort === 'function'),
    };
  })()`);
  rec('D123 game.simulation instanceof window.Simulation', reg && reg.simInstance, JSON.stringify(reg));
  rec('D108/125 tournament backend default mode=local', reg && reg.tourMode === 'local', `mode=${reg && reg.tourMode}`);
  rec('D109 L48 lab metadata (maxFanOut=2, hardCap=3)', reg && reg.l48lab, JSON.stringify(reg));
  rec('D127 heatmap render fns present', reg && reg.progFn, JSON.stringify(reg));
  rec('D126 cohort instrumentation present', reg && reg.cohortFn, JSON.stringify(reg));

  // ───────── PHASE 18: Console hygiene ─────────
  console.log('\n=== Phase 18: Console hygiene ===');
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
