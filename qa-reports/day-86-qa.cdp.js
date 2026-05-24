#!/usr/bin/env node
/**
 * Day 86 QA harness — connects to permissive headless Chromium on
 * localhost:9301 over CDP and runs the Day 86 regression suite against
 * http://localhost:8901/.
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node /tmp/sc-day86-qa.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const consoleAll = [];
const assertions = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}` + (detail ? ` :: ${detail}` : ''));
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(buf));
        } catch (e) {
          reject(e);
        }
      });
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

async function evalExpr(ws, expr, returnByValue = true, awaitPromise = false) {
  const r = await send(ws, 'Runtime.evaluate', {
    expression: expr,
    returnByValue,
    awaitPromise,
    allowUnsafeEvalBlockedByCSP: true,
  });
  if (r.exceptionDetails) {
    throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails));
  }
  return r.result && r.result.value;
}

async function waitFor(ws, predicate, { timeoutMs = 10000, intervalMs = 250, label = 'waitFor' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const v = await evalExpr(ws, `(${predicate})()`);
      if (v) return v;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label}`);
}

async function main() {
  // Find / create a target.
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) {
    target = await fetchJson('/json/new?about:blank');
  }
  const wsUrl = target.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl, { perMessageDeflate: false });

  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args || [];
      const text = args.map((a) => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
      consoleAll.push(`[${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') consoleErrors.push(text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      const text = ed && (ed.exception?.description || ed.text) || JSON.stringify(ed);
      consoleErrors.push('uncaught: ' + text);
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');

  // Always clear cache & cookies to simulate cold start.
  await send(ws, 'Network.setCacheDisabled', { cacheDisabled: true });
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'http://localhost:8901', storageTypes: 'all' }); } catch {}

  // ───────────────────────── PHASE 1: Build identity ─────────────────────────
  console.log('\n=== Phase 1: Build identity ===');
  await navigateAndWait(ws, TARGET_URL);

  // Pre-stub vibrate to silence user-gesture warnings.
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);

  // Cache-bust unification: read raw HTML via fetch.
  const html = await evalExpr(ws, `fetch('/index.html', {cache:'no-store'}).then(r=>r.text())`, true, true);
  const matches = (html.match(/\?v=1780156800/g) || []).length;
  rec('11 cache-bust refs unified at ?v=1780156800', matches === 11, `found=${matches}`);
  const stale = (html.match(/\?v=1780070400/g) || []).length;
  rec('zero stale ?v=1780070400 refs remain', stale === 0, `stale=${stale}`);

  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, true, true);
  const swMatch = /CACHE_NAME\s*=\s*'signal-circuit-v60'/.test(swText);
  rec('sw.js CACHE_NAME = signal-circuit-v60', swMatch);

  // ───────────────────────── PHASE 2: Cold-start surface ─────────────────────
  console.log('\n=== Phase 2: Cold-start surface ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+game.ui present' });
  // Brief settle to let initial gating run.
  await evalExpr(ws, `new Promise(r=>setTimeout(r,500))`, true, true);

  // Count cold-start non-level buttons on the level-select screen.
  const coldBtns = await evalExpr(
    ws,
    `(function(){
      const screen = document.querySelector('#level-select-screen');
      if (!screen) return -1;
      const cs = getComputedStyle(screen);
      if (cs.display === 'none') return -2;
      const all = Array.from(screen.querySelectorAll('button'));
      const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
      // Exclude per-level cards/overflows.
      const nonLevel = visible.filter(b => {
        if (b.classList.contains('level-overflow-btn')) return false;
        if (b.classList.contains('level-btn')) return false;
        if (b.classList.contains('level-card')) return false;
        if (b.dataset && b.dataset.levelId) return false;
        if (b.closest('.level-overflow-btn, .level-card, [data-level-id]')) return false;
        return true;
      });
      return nonLevel.length;
    })()`,
  );
  rec('cold-start non-level button count === 2', coldBtns === 2, `count=${coldBtns}`);

  // ───────────────────────── PHASE 3: Day 85 onboarding ──────────────────────
  console.log('\n=== Phase 3: Day 85 onboarding experiment ===');
  const variant = await evalExpr(ws, `window.__onboardingExperiment && window.__onboardingExperiment.getVariant()`);
  rec("__onboardingExperiment.getVariant() === 'silent-standard'", variant === 'silent-standard', `variant=${variant}`);
  const expCounters = await evalExpr(ws, `window.__onboardingExperiment && JSON.stringify(window.__onboardingExperiment.getCounters())`);
  rec('__onboardingExperiment.getCounters() is JSON-serializable object', !!expCounters && expCounters.startsWith('{'), `len=${expCounters && expCounters.length}`);

  // ───────────────────────── PHASE 4: L1 entry + 4 truth rows ────────────────
  console.log('\n=== Phase 4: L1 entry ===');
  await evalExpr(ws, `(function(){ const g=window.game; g.currentScreen='gameplay'; g.ui.showScreen('gameplay'); g.loadLevel(1); return 'loaded'; })()`);
  await waitFor(ws, `() => {
    const gp = document.querySelector('#gameplay-screen');
    return gp && getComputedStyle(gp).display !== 'none';
  }`, { label: 'gameplay screen visible' });
  // RUN button.
  const runVisible = await evalExpr(ws, `(function(){
    const r = document.querySelector('#run-btn');
    if (!r) return false;
    return getComputedStyle(r).display !== 'none';
  })()`);
  rec('RUN button visible on L1', runVisible);
  // 4 truth-table rows.
  const ttRows = await evalExpr(ws, `(function(){
    const tbl = document.querySelector('#truth-table tbody');
    if (!tbl) return -1;
    return tbl.querySelectorAll('tr').length;
  })()`);
  rec('L1 truth table has 4 rows', ttRows === 4, `rows=${ttRows}`);

  // ───────────────────────── PHASE 5: L1 solve via 1 AND gate ────────────────
  console.log('\n=== Phase 5: L1 solve via 1 AND gate ===');
  // Place an AND gate connected from both inputs to the output.
  const solveResult = await evalExpr(ws, `(async function(){
    const g = window.game;
    if (!g) return {ok:false, why:'no game'};
    if (!g.currentLevel || g.currentLevel.id !== 1) g.loadLevel(1);
    const inputs = g.inputNodes || [];
    const outputs = g.outputNodes || [];
    if (inputs.length !== 2 || outputs.length !== 1) return {ok:false, why:'IO mismatch', inputs:inputs.length, outputs:outputs.length};
    g.gates = [];
    g.wireManager.wires = [];
    // Drop an AND gate in the middle.
    const andGate = g.addGate('AND', 400, 300);
    // Wire input0 → AND in0, input1 → AND in1, AND out → output in0.
    g.addWireFromData(inputs[0].id, 0, andGate.id, 0);
    g.addWireFromData(inputs[1].id, 0, andGate.id, 1);
    g.addWireFromData(andGate.id, 0, outputs[0].id, 0);
    // Use simulation.runAll() directly — synchronous, no animation, no audio.
    const results = g.simulation.runAll();
    const allPass = Array.isArray(results) && results.length === 4 && results.every(r => r.pass);
    return {ok: allPass, rowCount: results && results.length, passes: results && results.map(r=>r.pass)};
  })()`, true, true);
  rec('L1 solves with 1 AND gate', solveResult && solveResult.ok, `result=${JSON.stringify(solveResult).slice(0,200)}`);

  // Now actually drive `runQuickTest` to confirm the completion celebration
  // path fires end-to-end (this is synchronous and routes through
  // ui.startCelebration / updateResultDisplay).
  const cele = await evalExpr(ws, `(function(){
    try {
      window.game.runQuickTest();
    } catch (e) { return {err: String(e)}; }
    const status = document.querySelector('#status-bar, #status-message');
    const result = document.querySelector('#result-display, #result-banner');
    const statusTxt = (status && (status.textContent||'')).trim();
    const resultTxt = (result && (result.textContent||'')).trim();
    return {statusTxt: statusTxt.slice(0,160), resultTxt: resultTxt.slice(0,160)};
  })()`);
  const celeOk = !!cele && (
    /solv|success|complete|nice|brilliant|perfect|gate/i.test(cele.statusTxt || '') ||
    /solv|success|complete|nice|brilliant|perfect|\u2713/i.test(cele.resultTxt || '')
  );
  rec('completion celebration surface appears after L1 solve', celeOk, JSON.stringify(cele).slice(0,200));

  // ───────────────────────── PHASE 6: Day 84 Lab Bench II L41 ────────────────
  console.log('\n=== Phase 6: Day 84 Lab Bench II L41 ===');
  // Some lab levels require unlock; bypass by direct loadLevel.
  const l41 = await evalExpr(ws, `(function(){
    try {
      window.game.loadLevel(41);
      const lvl = window.game.currentLevel;
      const constraint = document.querySelector('#lab-constraint');
      const constraintText = constraint ? (constraint.textContent || '').trim() : '';
      const constraintVisible = constraint && getComputedStyle(constraint).display !== 'none';
      return {
        id: lvl && lvl.id,
        labConstraint: lvl && lvl.labConstraint,
        mustIncludeGate: lvl && lvl.mustIncludeGate,
        gateHardCap: lvl && lvl.gateHardCap,
        toolboxGates: lvl && lvl.availableGates,
        constraintChipText: constraintText,
        constraintChipVisible: !!constraintVisible,
      };
    } catch (e) { return {err: String(e)}; }
  })()`);
  rec('L41 currentLevel.id === 41', l41 && l41.id === 41, JSON.stringify(l41).slice(0,260));
  const toolbox = l41 && l41.toolboxGates;
  const nandOnly = Array.isArray(toolbox) && toolbox.length === 1 && toolbox[0] === 'NAND';
  rec('L41 toolbox is NAND-only', nandOnly, `toolbox=${JSON.stringify(toolbox)}`);
  rec('L41 has a labConstraint string', !!(l41 && l41.labConstraint), `labConstraint=${l41 && l41.labConstraint}`);
  rec('L41 lab-constraint chip is visible', !!(l41 && l41.constraintChipVisible));

  // ───────────────────────── PHASE 7: Day 83 tournament adapter ──────────────
  console.log('\n=== Phase 7: Day 83 tournament adapter ===');
  const tmode = await evalExpr(ws, `window.game && window.game.tournamentBackend && window.game.tournamentBackend.getMode && window.game.tournamentBackend.getMode()`);
  rec("game.tournamentBackend.getMode() === 'local'", tmode === 'local', `mode=${tmode}`);
  const tDescribe = await evalExpr(ws, `(function(){
    const a = window.game && window.game.tournamentBackend;
    if (!a || typeof a.describe !== 'function') return null;
    return a.describe();
  })()`);
  rec('tournamentBackend.describe() returns non-empty string', typeof tDescribe === 'string' && tDescribe.length > 0, `describe=${tDescribe}`);

  // ───────────────────────── PHASE 8: Day 78 staircase end-game ──────────────
  console.log('\n=== Phase 8: Day 78 staircase end-game ===');
  // Force back to level-select to read the staircase.
  await evalExpr(ws, `(window.game && window.game.ui && window.game.ui.showScreen) ? window.game.ui.showScreen('level-select') : null; 'ok'`);
  await evalExpr(ws, `new Promise(r=>setTimeout(r,200))`, true, true);
  const stair = await evalExpr(ws, `(function(){
    try {
      window.game.seedProgress(40);
    } catch (e) { return {err: String(e)}; }
    return new Promise(res => setTimeout(()=>{
      const screen = document.querySelector('#level-select-screen');
      if (!screen) return res({err:'no screen'});
      const all = Array.from(screen.querySelectorAll('button'));
      const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
      const overflow = visible.filter(b => b.classList.contains('level-overflow-btn'));
      const nonLevel = visible.filter(b => !b.classList.contains('level-overflow-btn'));
      res({nonLevelCount: nonLevel.length, overflowCount: overflow.length});
    }, 600));
  })()`, true, true);
  rec('Day 78 staircase: 18 non-level buttons after seedProgress(40)', stair && stair.nonLevelCount === 18, JSON.stringify(stair));
  rec('Day 78 staircase: 40 overflow level buttons', stair && stair.overflowCount === 40, JSON.stringify(stair));

  // ───────────────────────── PHASE 9: console error tally ────────────────────
  console.log('\n=== Phase 9: console error tally ===');
  rec('0 console errors across the suite', consoleErrors.length === 0, `errors=${consoleErrors.length}` + (consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''));

  // ────────────────────────── Summary ───────────────────────────────────────
  const passed = assertions.filter(a => a.ok).length;
  const failed = assertions.filter(a => !a.ok).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${assertions.length}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0,5).join('\n'));
  if (failed) {
    console.log('\nFailures:');
    for (const a of assertions) if (!a.ok) console.log(' - ' + a.label + (a.detail ? ' :: ' + a.detail : ''));
  }
  ws.close();
  process.exit(failed === 0 ? 0 : 1);

  async function navigateAndWait(ws, url) {
    await send(ws, 'Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1500));
    // Wait for body to exist.
    await waitFor(ws, `() => !!document.body`, { label: 'body present' });
  }
}

main().catch((e) => {
  console.error('FATAL:', e && e.stack || e);
  process.exit(2);
});
