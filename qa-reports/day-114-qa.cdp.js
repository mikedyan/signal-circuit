#!/usr/bin/env node
/**
 * Day 114 QA harness — Cycle 5 HARDEN Week Day 2: Level Playthrough.
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). Codifies the LO-2 recovery: the
 * harness no longer auto-launches a browser — boot deps first with
 *   tools/cdp-launch.sh start
 * then run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-114-qa.cdp.js
 *
 * Build under test: Day 111 (?v=1781395200 / sw v73 / 50 level cards).
 *
 * Coverage (HARDEN Week Tuesday spec — Level Playthrough):
 *   - Sampled campaign levels 1/5/10/15/20/25/30/35/40 + bonus 45/46/48/50:
 *       structural integrity (truth table row count == 2^numInputs, output
 *       arity, hints present), star-rating monotonicity via game.calculateStars.
 *   - Hands-on L1 solve through Quick Test → 3 stars persisted.
 *   - Challenge mode entries: Daily / Random / Blitz / Speedrun / Sandbox.
 *   - Community levels load via buildCustomLevel.
 *   - Cold-start invariants: 50 cards, 2 nav buttons, Day 79 dead-IDs undefined,
 *       Day 92 window.Gate/GateTypes, Day 107 window.Wire/WireManager, sw v73.
 *   - Console hygiene (0 console.error, 0 Runtime.exceptionThrown).
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
  console.log('\n=== Phase 1: Build identity (Day 111 build) ===');
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
    return {
      gate: typeof window.Gate, gateTypes: window.GateTypes ? Object.keys(window.GateTypes).length : -1,
      wire: typeof window.Wire, wireMgr: typeof window.WireManager,
      levels: (typeof LEVELS !== 'undefined') ? LEVELS.length : -1,
      getLevel: typeof getLevel,
    };
  })()`);
  rec('Day 92 window.Gate is function + GateTypes has 8 keys', bindings.gate === 'function' && bindings.gateTypes === 8, JSON.stringify(bindings));
  rec('Day 107 window.Wire + window.WireManager bound', bindings.wire === 'function' && bindings.wireMgr === 'function', `wire=${bindings.wire} mgr=${bindings.wireMgr}`);
  rec('LEVELS global present with 50 levels', bindings.levels === 50 && bindings.getLevel === 'function', `levels=${bindings.levels}`);

  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    const undef = ids.filter(n => typeof window[n] === 'undefined');
    return { allUndef: undef.length === ids.length, weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers still undefined', deadIds.allUndef, JSON.stringify(deadIds));
  rec('Day 79 #weekly-puzzle-btn DOM absent', deadIds.weeklyBtn === false);

  // ───────── PHASE 3: Sampled level structural playthrough ─────────
  console.log('\n=== Phase 3: Level structural integrity + star monotonicity ===');
  const sample = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 46, 48, 50];
  const levelReport = await evalExpr(ws, `(function(){
    const ids = ${JSON.stringify(sample)};
    const out = [];
    for (const id of ids) {
      const lv = getLevel(id);
      if (!lv) { out.push({ id, ok:false, err:'no level' }); continue; }
      const nIn = (lv.inputs || []).length;
      const nOut = (lv.outputs || []).length;
      const tt = lv.truthTable || [];
      const expectRows = Math.pow(2, nIn);
      const rowsOk = tt.length === expectRows;
      const arityOk = tt.every(r => Array.isArray(r.inputs) && r.inputs.length === nIn && Array.isArray(r.outputs) && r.outputs.length === nOut);
      const hintsOk = Array.isArray(lv.hints) && lv.hints.length >= 1;
      // star monotonicity via the live GameState method
      const opt = lv.optimalGates;
      const sOpt = window.game.calculateStars(opt, lv);
      const sOver = window.game.calculateStars((lv.goodGates || opt) + 3, lv);
      const starsOk = sOpt === 3 && sOver < 3;
      out.push({ id, ok: rowsOk && arityOk && hintsOk && starsOk, nIn, nOut, rows: tt.length, expectRows, hints: (lv.hints||[]).length, sOpt, sOver, isLab: !!lv.isLabBench });
    }
    return out;
  })()`);
  for (const r of levelReport) {
    rec(`L${r.id} integrity (rows=${r.rows}/${r.expectRows}, out=${r.nOut}, hints=${r.hints}, stars ${r.sOpt}/${r.sOver})`, r.ok, r.err || JSON.stringify(r));
  }

  // ───────── PHASE 4: Hands-on L1 solve ─────────
  console.log('\n=== Phase 4: Hands-on L1 solve (Quick Test) ===');
  await evalExpr(ws, `window.game.startLevel(1)`);
  await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L1 gameplay' });
  const solve = await evalExpr(ws, `(function(){
    const gs = window.game;
    const gateId = (gs.nextGateId !== undefined ? gs.nextGateId++ : (Math.max(0, ...gs.gates.map(g=>g.id)) + 1));
    const andGate = new window.Gate('AND', 400, 400, gateId);
    gs.gates.push(andGate);
    const inputs = gs.inputNodes, outputs = gs.outputNodes;
    if (inputs.length < 2 || outputs.length < 1) return { err: 'IO shape', i: inputs.length, o: outputs.length };
    try {
      gs.wireManager.wires.push(new window.Wire(inputs[0].id, 0, gateId, 0, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(inputs[1].id, 0, gateId, 1, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(gateId, 0, outputs[0].id, 0, gs.wireManager.nextId++));
    } catch(e) { return { err: String(e) }; }
    gs.runQuickTest();
    return { stars: (gs.progress.levels[1]||{}).stars, gates: gs.gates.length, wires: gs.wireManager.wires.length };
  })()`);
  await sleep(700);
  rec('L1 solved via Quick Test → 3 stars persisted', solve && solve.stars === 3, JSON.stringify(solve));

  // ───────── PHASE 5: Challenge mode entries ─────────
  console.log('\n=== Phase 5: Challenge/sandbox mode entries ===');
  async function backToSelect() {
    await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b) b.click(); else window.game.ui.showScreen('level-select'); })()`);
    await sleep(400);
  }
  // Daily
  await evalExpr(ws, `(function(){ const b=document.querySelector('#daily-challenge-btn'); if(b) b.click(); })()`);
  await sleep(500);
  const daily = await evalExpr(ws, `!!document.querySelector('#daily-config-screen') && getComputedStyle(document.querySelector('#daily-config-screen')).display !== 'none'`);
  rec('Daily Challenge opens pre-screen', daily);
  await backToSelect();
  // Random
  await evalExpr(ws, `(function(){ const b=document.querySelector('#random-challenge-btn'); if(b) b.click(); })()`);
  await sleep(500);
  const rand = await evalExpr(ws, `!!document.querySelector('#challenge-config-screen') && getComputedStyle(document.querySelector('#challenge-config-screen')).display !== 'none'`);
  rec('Random Challenge opens config screen', rand);
  await backToSelect();
  // Blitz
  await evalExpr(ws, `(function(){ const b=document.querySelector('#blitz-mode-btn'); if(b) b.click(); })()`);
  await sleep(500);
  const blitz = await evalExpr(ws, `({ mode: !!window.game.blitzMode, screen: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none' })`);
  rec('Blitz Mode enters gameplay with blitzMode=true', blitz && blitz.mode && blitz.screen, JSON.stringify(blitz));
  await backToSelect();
  const blitzClean = await evalExpr(ws, `({ mode: !!window.game.blitzMode, hud: (function(){const h=document.querySelector('#blitz-hud'); return h?getComputedStyle(h).display:'none';})() })`);
  rec('Blitz HUD cleaned on back (Day 61 fix)', blitzClean && !blitzClean.mode && blitzClean.hud === 'none', JSON.stringify(blitzClean));
  // Speedrun
  await evalExpr(ws, `(function(){ const b=document.querySelector('#speedrun-btn'); if(b) b.click(); })()`);
  await sleep(500);
  const spd = await evalExpr(ws, `({ mode: !!window.game.speedrunMode, screen: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none' })`);
  rec('Speedrun Mode enters gameplay with speedrunMode=true', spd && spd.mode && spd.screen, JSON.stringify(spd));
  await backToSelect();
  const spdClean = await evalExpr(ws, `({ mode: !!window.game.speedrunMode, hud: (function(){const h=document.querySelector('#speedrun-hud'); return h?getComputedStyle(h).display:'none';})() })`);
  rec('Speedrun HUD cleaned on back (Day 74 fix)', spdClean && !spdClean.mode && spdClean.hud === 'none', JSON.stringify(spdClean));
  // Sandbox
  await evalExpr(ws, `(function(){ const b=document.querySelector('#sandbox-btn'); if(b) b.click(); })()`);
  await sleep(500);
  const sand = await evalExpr(ws, `!!document.querySelector('#sandbox-config-screen') && getComputedStyle(document.querySelector('#sandbox-config-screen')).display !== 'none'`);
  rec('Sandbox Mode opens config screen', sand);
  await backToSelect();

  // ───────── PHASE 6: Community levels load ─────────
  console.log('\n=== Phase 6: Community levels ===');
  const comm = await evalExpr(ws, `(function(){
    if (typeof COMMUNITY_LEVELS === 'undefined') return { err:'no COMMUNITY_LEVELS' };
    const sample = COMMUNITY_LEVELS.slice(0, 4);
    let loaded = 0;
    for (const c of sample) {
      try {
        const data = { n: c.name, i: c.inputCount, o: c.outputCount, t: c.truthTable, g: c.gates };
        const lv = (typeof buildCustomLevel === 'function') ? buildCustomLevel(data) : null;
        if (lv && lv.truthTable && lv.truthTable.length === Math.pow(2, c.inputCount)) loaded++;
      } catch(e) {}
    }
    return { total: COMMUNITY_LEVELS.length, sampled: sample.length, loaded };
  })()`);
  rec('Community levels load via buildCustomLevel', comm && comm.loaded === comm.sampled, JSON.stringify(comm));

  // ───────── PHASE 7: Console hygiene ─────────
  console.log('\n=== Phase 7: Console hygiene ===');
  rec('0 console.error / 0 uncaught exceptions', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  // ───────── SUMMARY ─────────
  const passed = assertions.filter((a) => a.ok).length;
  const failed = assertions.length - passed;
  console.log(`\n=== SUMMARY: ${passed}/${assertions.length} passed, ${failed} failed ===`);
  if (failed) { console.log('FAILED:'); assertions.filter(a => !a.ok).forEach(a => console.log(' ❌ ' + a.label + (a.detail ? ' :: ' + a.detail : ''))); }
  try { ws.close(); } catch {}
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
