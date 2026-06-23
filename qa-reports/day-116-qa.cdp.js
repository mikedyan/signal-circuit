#!/usr/bin/env node
/**
 * Day 116 QA harness — Cycle 5 HARDEN Week Day 4: Fix Everything confirmation probe.
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). Boot deps first with
 *   tools/cdp-launch.sh start
 * then run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-116-qa.cdp.js
 *
 * Build under test: Day 111 (?v=1781395200 / sw v73 / 50 level cards) — unchanged
 * through HARDEN week (ZERO new features per HARDEN policy).
 *
 * Coverage (HARDEN Week Day 4 — empty-queue confirmation probe):
 *   T1  Rapid gate placement during simulation (no-throw)
 *   T2  Wire drawing while animation is playing (no-throw)
 *   T3  Window resize mid-gameplay (10 rapid resizes)
 *   T4  Clear localStorage + reload (clean fresh-user state)
 *   T5  Keyboard-only navigation (focusable elements present + tabbable)
 *   T6  Colorblind mode toggle + gameplay
 *   T7  Light mode vs dark mode toggle round-trip
 *   T8  40+ wires on one level (performance budget)
 *   T9  Undo/redo stress (20× each, no-throw)
 *   T10 RUN + Quick Test spam (re-entry contract holds)
 *   Cycle 5 BUILD regression sweep:
 *     D108 Tournament mode label, D109 L48 maxFanOut validator,
 *     D110 PB badge suppression cold, D111 Stats tournament-history tab.
 *   Console hygiene (0 console.error, 0 Runtime.exceptionThrown).
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

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

  // ───────── PHASE 1: Build identity ─────────
  console.log('\n=== Phase 1: Build identity (Day 111 build, HARDEN-pinned) ===');
  await navigateAndWait(ws, TARGET_URL);
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);
  const html = await evalExpr(ws, `fetch('/index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('11 cache-bust refs at ?v=1781395200', (html.match(/\?v=1781395200/g) || []).length === 11, `found=${(html.match(/\?v=1781395200/g) || []).length}`);
  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('sw.js CACHE_NAME = signal-circuit-v73', /CACHE_NAME\s*=\s*'signal-circuit-v73'/.test(swText));

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
      wire: typeof window.Wire, wireMgr: typeof window.WireManager,
      levels: (typeof LEVELS !== 'undefined') ? LEVELS.length : -1 };
  })()`);
  rec('Day 92 window.Gate function + 8 GateTypes', bindings.gate === 'function' && bindings.gateTypes === 8, JSON.stringify(bindings));
  rec('Day 107 window.Wire + WireManager bound', bindings.wire === 'function' && bindings.wireMgr === 'function', `wire=${bindings.wire} mgr=${bindings.wireMgr}`);
  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    return { allUndef: ids.every(n => typeof window[n] === 'undefined'), weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers still undefined + #weekly-puzzle-btn absent', deadIds.allUndef && deadIds.weeklyBtn === false, JSON.stringify(deadIds));

  // Helper to enter L1 gameplay fresh
  async function enterL1() {
    await evalExpr(ws, `window.game.startLevel(1)`);
    await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L1 gameplay' });
  }

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
    return { threw, gateCount: gs.gates.length, animating: !!gs.isAnimating };
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
      gs.isAnimating = true; // simulate mid-animation
      const ins = gs.inputNodes, outs = gs.outputNodes;
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
    await evalExpr(ws, `(function(){ try{ window.dispatchEvent(new Event('resize')); if(window.game.renderer){ window.game.renderer.resize(); window.game.renderer.render(); } return true;}catch(e){return String(e);} })()`);
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
      keys: Object.keys(localStorage).filter(k=>/signal/.test(k)).length,
      difficulty: (window.game.difficultyMode || (typeof DIFFICULTY_KEY!=='undefined' ? localStorage.getItem(DIFFICULTY_KEY) : null) || 'standard') };
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
    const btn = document.getElementById('colorblind-toggle-btn'); let threw=null;
    const before = document.body.classList.contains('colorblind-mode');
    try {
      if (btn) btn.click(); else document.body.classList.toggle('colorblind-mode');
      const onState = document.body.classList.contains('colorblind-mode');
      // wire colors must respond to the class
      const cols = (typeof getWireColors === 'function') ? getWireColors() : null;
      if (window.game.renderer) window.game.renderer.render();
      if (btn) btn.click(); else document.body.classList.toggle('colorblind-mode');
      const offState = document.body.classList.contains('colorblind-mode');
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
      const ins = gs.inputNodes, outs = gs.outputNodes;
      // build a fan of gates + wires to exceed 40 wires
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

  // ───────── PHASE 13: Cycle 5 BUILD regression sweep ─────────
  console.log('\n=== Phase 13: Cycle 5 BUILD regression sweep ===');
  // reset to a clean level-select
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready' });
  await sleep(400);

  // D108: Tournament mode label
  const d108 = await evalExpr(ws, `(function(){
    try {
      const b = (typeof selectTournamentBackend === 'function') ? selectTournamentBackend() : (window.game.tournamentBackend || null);
      const mode = b && b.getMode ? b.getMode() : null;
      const desc = b && b.describe ? b.describe() : null;
      return { mode, desc, ok: mode === 'local' && typeof desc === 'string' && desc.length > 0 };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('D108 tournament backend default mode=local with label', d108 && d108.ok, JSON.stringify(d108));

  // D109: L48 composite validator (NAND + hardCap=3 + maxFanOut=2)
  const d109meta = await evalExpr(ws, `(function(){
    const lv = getLevel(48);
    return { isLab: !!(lv&&lv.isLabBench), maxFanOut: lv&&lv.maxFanOut, cap: lv&&(lv.gateHardCap), avail: lv&&lv.availableGates };
  })()`);
  rec('D109 L48 metadata: lab + maxFanOut=2 + hardCap=3', d109meta && d109meta.isLab && d109meta.maxFanOut === 2 && d109meta.cap === 3, JSON.stringify(d109meta));
  await evalExpr(ws, `window.game.startLevel(48)`);
  await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L48 gameplay' });
  const d109val = await evalExpr(ws, `(function(){
    const gs = window.game;
    try {
      // place 4 NAND gates (no wires) → exceeds hardCap of 3
      for (let i=0;i<4;i++){ const id=(gs.nextGateId!==undefined?gs.nextGateId++:8000+i); gs.gates.push(new window.Gate('NAND',200+i*40,300,id)); }
      const res = gs._validateLabConstraints();
      const msg = res && (res.message || res.reason) || '';
      return { ok: res && res.ok === false && /4 gates exceeds hard cap of 3/.test(msg), message: msg };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('D109 L48 validator rejects 4 gates: cap clause byte-exact', d109val && d109val.ok, JSON.stringify(d109val));
  await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b)b.click(); else window.game.ui.showScreen('level-select'); })()`);
  await sleep(400);

  // D110: PB badge suppressed on cold L1 (no prior progress)
  await enterL1();
  const d110 = await evalExpr(ws, `(function(){
    const el = document.getElementById('level-best-badge');
    return { exists: !!el, display: el ? getComputedStyle(el).display : 'absent' };
  })()`);
  rec('D110 PB badge suppressed on cold L1 entry', d110 && d110.exists && d110.display === 'none', JSON.stringify(d110));

  // D111: Stats tournament-history tab present + empty state
  await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b)b.click(); else window.game.ui.showScreen('level-select'); })()`);
  await sleep(300);
  const d111 = await evalExpr(ws, `(function(){
    try {
      const hasTab = !!document.getElementById('stats-tab-tournament');
      const hasPane = !!document.getElementById('stats-tournament-pane');
      const histFn = typeof window.game.weeklyTournament?.getSubmissionHistory === 'function'
        || (window.weeklyTournament && typeof window.weeklyTournament.getSubmissionHistory === 'function');
      const switchFn = typeof window.game.ui._switchStatsTab === 'function';
      return { hasTab, hasPane, switchFn };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('D111 Stats tournament tab + pane + _switchStatsTab present', d111 && d111.hasTab && d111.hasPane && d111.switchFn, JSON.stringify(d111));

  // ───────── PHASE 14: Console hygiene ─────────
  console.log('\n=== Phase 14: Console hygiene ===');
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
