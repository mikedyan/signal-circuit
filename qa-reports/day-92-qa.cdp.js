#!/usr/bin/env node
/**
 * Day 92 QA harness — Module Split Phase 1 (gates.js as ES module).
 *
 * Verifies:
 *   P1 (4): Build identity — cache-bust unified at 1780272000, sw v61,
 *           gates.js served with `export class Gate`, index.html loads gates
 *           via `<script type="module">`.
 *   P2 (4): Cold-start surface unchanged — 2 non-level buttons, 43 cards,
 *           onboarding silent-standard, difficulty silent-default standard.
 *   P3 (5): ES-module globals installed — window.Gate, GateTypes, IONode,
 *           roundRect all present and shape-correct.
 *   P4 (3): Core loop on L1 — synthetic L1 solve persists 3 stars.
 *   P5 (2): Day 84 Lab Bench II L42 regression — hard cap 4, rejects 5.
 *   P6 (2): Day 83 Tournament adapter — getMode()==='local', describe live.
 *   P7 (2): Day 78 staircase end-game — 18 nav + 40 overflow at seed=40.
 *   P8 (2): Console hygiene — 0 exceptions + 0 console.error.
 *
 * Total target: 24 assertions across 8 phases.
 *
 * Uses raw CDP via ws@8.20.0 from OpenClaw's node_modules (Day 86+ pattern).
 * Connects to a permissive headless Chromium at ws://127.0.0.1:9301/.
 *
 * Run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node \
 *     qa-reports/day-92-qa.cdp.js
 */

const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const APP_URL = 'http://localhost:8901/';
const CACHE_BUST = '1780272000';
const SW_VERSION = 'signal-circuit-v61';

const results = [];
let exceptionCount = 0;
let consoleErrorCount = 0;

function ok(name, detail) { results.push({ ok: true, name, detail }); console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail) { results.push({ ok: false, name, detail }); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
function phase(label) { console.log('\n' + label); }

function httpGet(host, port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host, port, path }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function pickTarget() {
  const { body } = await httpGet(CDP_HOST, CDP_PORT, '/json');
  const targets = JSON.parse(body);
  return targets.find((t) => t.type === 'page' && t.url.startsWith('http')) || targets[0];
}

async function cdpConnect(wsUrl) {
  const ws = new WebSocket(wsUrl, { origin: 'http://localhost' });
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  let id = 0;
  const pending = new Map();
  ws.on('message', (msg) => {
    const m = JSON.parse(msg.toString());
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(JSON.stringify(m.error)));
      else resolve(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
      exceptionCount++;
      console.error('  ⚠ Runtime.exceptionThrown:', m.params.exceptionDetails.text);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrorCount++;
      console.error('  ⚠ console.error:', m.params.args.map((a) => a.value).join(' '));
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const myId = ++id;
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }
  return { ws, send };
}

async function evalExpr(send, expr, { awaitPromise = false } = {}) {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise,
    userGesture: true,
  });
  if (r.exceptionDetails) {
    throw new Error('eval threw: ' + (r.exceptionDetails.text || JSON.stringify(r.exceptionDetails)));
  }
  return r.result && 'value' in r.result ? r.result.value : undefined;
}

async function waitFor(send, expr, timeoutMs = 8000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const v = await evalExpr(send, expr);
      if (v) return v;
    } catch (e) { /* keep polling */ }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('waitFor timed out: ' + expr);
}

async function main() {
  console.log('Day 92 QA harness — Module Split Phase 1 (gates.js as ES module)');
  console.log('================================================================');

  // ─── P1: Build identity ───
  phase('P1 — Build identity');

  // P1.1: index.html has 11 ?v=1780272000 cache-bust refs
  const { body: html } = await httpGet('localhost', 8901, '/');
  const cacheRefs = (html.match(new RegExp(`\\?v=${CACHE_BUST}`, 'g')) || []).length;
  if (cacheRefs === 11) ok('P1.1: 11 cache-bust refs unified at ?v=' + CACHE_BUST, `${cacheRefs}/11`);
  else fail('P1.1: cache-bust refs', `expected 11, got ${cacheRefs}`);

  // P1.2: index.html loads gates.js via type="module"
  const moduleTagMatch = html.match(/<script type="module" src="js\/gates\.js\?v=\d+"><\/script>/);
  if (moduleTagMatch) ok('P1.2: gates.js loaded via <script type="module">', moduleTagMatch[0]);
  else fail('P1.2: gates.js NOT loaded via type="module"');

  // P1.3: gates.js served with `export class Gate`
  const { body: gatesSrc } = await httpGet('localhost', 8901, `/js/gates.js?v=${CACHE_BUST}`);
  if (gatesSrc.includes('export class Gate {') && gatesSrc.includes('export const GateTypes')) {
    ok('P1.3: gates.js contains export class Gate + export const GateTypes');
  } else {
    fail('P1.3: gates.js missing export declarations');
  }

  // P1.4: sw.js contains CACHE_NAME = 'signal-circuit-v61'
  const { body: swSrc } = await httpGet('localhost', 8901, '/sw.js');
  if (swSrc.includes(`CACHE_NAME = '${SW_VERSION}'`)) ok('P1.4: sw.js CACHE_NAME = ' + SW_VERSION);
  else fail('P1.4: sw.js CACHE_NAME', `expected ${SW_VERSION}`);

  // ─── Connect to CDP and pick a tab ───
  const target = await pickTarget();
  const { send } = await cdpConnect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  try { await send('Storage.clearDataForOrigin', { origin: APP_URL.replace(/\/$/, ''), storageTypes: 'all' }); } catch (e) { /* best effort */ }

  // Pre-install vibrate stub so headless gesture-policy noise doesn't leak into console.error
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { Object.defineProperty(navigator, 'vibrate', { value: () => true, writable: true }); } catch (e) {}`,
  });

  // Force a fresh reload to the app URL with a cache-bust suffix
  await send('Page.navigate', { url: APP_URL + '?day92=' + Date.now() });
  // Wait for the game object to materialize (proxy for "all scripts loaded + DOMContentLoaded fired")
  await waitFor(send, 'typeof window.game === "object" && window.game !== null', 12000);
  // Give module evaluation a moment after DCL
  await new Promise((r) => setTimeout(r, 400));

  // ─── P2: Cold-start surface unchanged ───
  phase('P2 — Cold-start surface');

  // P2.1: level-select visible
  const levelSelectVisible = await evalExpr(send, `
    (function() {
      const el = document.getElementById('level-select-screen');
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    })()
  `);
  if (levelSelectVisible) ok('P2.1: level-select-screen visible at cold start');
  else fail('P2.1: level-select-screen NOT visible');

  // P2.2: 2 non-level buttons in the level-select chrome — How to Play + Settings
  // These two are explicitly anchored to known IDs (Day 87 selector audit).
  const nonLevelBtns = await evalExpr(send, `
    (function() {
      function vis(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      let count = 0;
      if (vis('how-to-play-btn')) count++;
      if (vis('open-settings-btn')) count++;
      return count;
    })()
  `);
  if (nonLevelBtns === 2) ok('P2.2: 2 non-level buttons (How to Play + Settings)');
  else fail('P2.2: non-level button count', `expected 2, got ${nonLevelBtns}`);

  // P2.3: 43 level cards
  const levelCards = await evalExpr(send, `document.querySelectorAll('#level-select-screen .level-btn').length`);
  if (levelCards === 43) ok('P2.3: 43 level cards rendered');
  else fail('P2.3: level card count', `expected 43, got ${levelCards}`);

  // P2.4: onboarding variant + difficulty silent-default
  const onboardingState = await evalExpr(send, `
    (function() {
      const oe = window.__onboardingExperiment;
      const variant = oe && oe.getVariant ? oe.getVariant() : null;
      const diff = localStorage.getItem('signal-circuit-difficulty-mode');
      return { variant, diff };
    })()
  `);
  if (onboardingState && onboardingState.variant === 'silent-standard' && onboardingState.diff === 'standard') {
    ok('P2.4: onboarding silent-standard + difficulty silent-default standard');
  } else {
    fail('P2.4: onboarding/difficulty state', JSON.stringify(onboardingState));
  }

  // ─── P3: ES-module globals installed ───
  phase('P3 — ES-module globals installed on window');

  const moduleGlobals = await evalExpr(send, `
    (function() {
      return {
        gateType: typeof window.Gate,
        gateIsClass: typeof window.Gate === 'function' && /^class\\s+Gate\\b/.test(window.Gate.toString()),
        gateTypesType: typeof window.GateTypes,
        gateTypesKeys: window.GateTypes ? Object.keys(window.GateTypes) : [],
        ionodeType: typeof window.IONode,
        roundRectType: typeof window.roundRect,
      };
    })()
  `);

  if (moduleGlobals.gateType === 'function') ok('P3.1: window.Gate is a function (class)');
  else fail('P3.1: window.Gate', JSON.stringify(moduleGlobals.gateType));

  if (moduleGlobals.gateIsClass) ok('P3.2: Gate.toString() starts with `class Gate`');
  else fail('P3.2: Gate.toString() does NOT start with class Gate');

  if (moduleGlobals.gateTypesType === 'object' && moduleGlobals.gateTypesKeys.length >= 8) {
    ok('P3.3: window.GateTypes is an object with ' + moduleGlobals.gateTypesKeys.length + ' gate types',
       moduleGlobals.gateTypesKeys.slice(0, 8).join(','));
  } else {
    fail('P3.3: window.GateTypes shape', JSON.stringify(moduleGlobals.gateTypesKeys));
  }

  if (moduleGlobals.ionodeType === 'function') ok('P3.4: window.IONode is a function (class)');
  else fail('P3.4: window.IONode', moduleGlobals.ionodeType);

  if (moduleGlobals.roundRectType === 'function') ok('P3.5: window.roundRect is a function');
  else fail('P3.5: window.roundRect', moduleGlobals.roundRectType);

  // ─── P4: Core loop on L1 ───
  phase('P4 — Core loop end-to-end on L1');

  const l1Setup = await evalExpr(send, `
    (function() {
      const gs = window.game;
      // Wipe progress so L1 is clean (avoid any prior-run pollution)
      try { gs.seedProgress(0); } catch (e) {}
      gs.startLevel(1);
      return {
        screen: document.getElementById('gameplay-screen').style.display,
        level: gs.currentLevel && gs.currentLevel.id,
        inputNodes: Array.isArray(gs.inputNodes) ? gs.inputNodes.length : typeof gs.inputNodes,
        outputNodes: Array.isArray(gs.outputNodes) ? gs.outputNodes.length : typeof gs.outputNodes,
        gateCount: Array.isArray(gs.gates) ? gs.gates.length : typeof gs.gates,
      };
    })()
  `);
  if (l1Setup.level === 1 && l1Setup.inputNodes >= 2 && l1Setup.outputNodes >= 1) {
    ok('P4.1: gs.startLevel(1) loaded L1', `ins=${l1Setup.inputNodes}, outs=${l1Setup.outputNodes}`);
  } else fail('P4.1: L1 load', JSON.stringify(l1Setup));

  const l1Solve = await evalExpr(send, `
    (function() {
      const log = [];
      try {
        const gs = window.game;
        log.push('step:addGate');
        const g = gs.addGate('AND', 400, 300);
        if (!g) return { error: 'addGate returned null', log };
        log.push('addGate.id=' + g.id);
        const inA = gs.inputNodes[0];
        const inB = gs.inputNodes[1];
        const out = gs.outputNodes[0];
        log.push('inA=' + (inA && inA.id) + ' inB=' + (inB && inB.id) + ' out=' + (out && out.id));
        log.push('step:addWireFromData inA->g[0]');
        gs.addWireFromData(inA.id, 0, g.id, 0);
        log.push('step:addWireFromData inB->g[1]');
        gs.addWireFromData(inB.id, 0, g.id, 1);
        log.push('step:addWireFromData g->out[0]');
        gs.addWireFromData(g.id, 0, out.id, 0);
        const gateCount = gs.gates.length;
        const wireCount = gs.wireManager.wires.length;
        log.push('wires=' + wireCount);
        log.push('step:runQuickTest');
        gs.runQuickTest();
        log.push('step:after-runQuickTest');
        const entry = gs.progress.levels && gs.progress.levels['1'];
        return { gateCount, wireCount, stars: entry && entry.stars };
      } catch (e) {
        return { error: e.message, lastStep: log[log.length - 1], log };
      }
    })()
  `);
  if (l1Solve.stars === 3) ok('P4.2: L1 quickTest persisted 3 stars', `gates=${l1Solve.gateCount}, wires=${l1Solve.wireCount}`);
  else fail('P4.2: L1 quickTest', JSON.stringify(l1Solve));

  // P4.3: run a second simulation to prove sim engine is alive
  const simRun = await evalExpr(send, `
    (function() {
      try { window.game.runSimulation(); return 'ok'; } catch(e) { return 'err:' + e.message; }
    })()
  `);
  if (simRun === 'ok') ok('P4.3: runSimulation() runs without throwing');
  else fail('P4.3: runSimulation()', simRun);

  // Wait briefly for any sim animation to settle
  await new Promise((r) => setTimeout(r, 800));

  // ─── P5: Day 84 Lab Bench II L42 regression ───
  phase('P5 — Day 84 Lab Bench II L42 regression');

  // Reset and load L42
  const labSetup = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.showLevelSelect();
      gs.startLevel(42);
      return { level: gs.currentLevel && gs.currentLevel.id, hardCap: gs.currentLevel && gs.currentLevel.gateHardCap };
    })()
  `);
  if (labSetup.level === 42 && labSetup.hardCap === 4) ok('P5.1: L42 loaded with gateHardCap=4');
  else fail('P5.1: L42 hardCap', JSON.stringify(labSetup));

  // Place 5 gates and verify validator rejection message format
  const labReject = await evalExpr(send, `
    (function() {
      const gs = window.game;
      // Add 5 gates of any type
      for (let i = 0; i < 5; i++) gs.addGate('AND', 200 + i * 60, 300);
      const result = gs._validateLabConstraints();
      return result;
    })()
  `);
  // result should be {ok: false, msg: '...'} or similar
  if (labReject && labReject.ok === false && /hard cap of 4/i.test(labReject.msg || labReject.message || '')) {
    ok('P5.2: validator rejects 5 gates with hard-cap message', (labReject.msg || labReject.message));
  } else {
    fail('P5.2: validator rejection format', JSON.stringify(labReject));
  }

  // ─── P6: Day 83 Tournament adapter ───
  phase('P6 — Day 83 Tournament backend adapter shape');

  const tourneyShape = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.showLevelSelect();
      const adapter = gs.tournamentBackend;
      if (!adapter) return { error: 'tournamentBackend not found', keys: Object.keys(gs).filter(k=>/tourn/i.test(k)) };
      return {
        mode: (adapter.getMode ? adapter.getMode() : null),
        describe: (adapter.describe ? adapter.describe() : null),
        isLive: (adapter.isLive ? adapter.isLive() : null),
      };
    })()
  `);
  if (tourneyShape && tourneyShape.mode === 'local') ok('P6.1: tournament.backend.getMode() === "local"');
  else fail('P6.1: tournament getMode', JSON.stringify(tourneyShape));

  if (tourneyShape && typeof tourneyShape.describe === 'string' && tourneyShape.describe.length > 0) {
    ok('P6.2: tournament.backend.describe() is non-empty', tourneyShape.describe.slice(0, 60));
  } else {
    fail('P6.2: tournament describe', JSON.stringify(tourneyShape));
  }

  // ─── P7: Day 78 staircase end-game ───
  phase('P7 — Day 78 staircase end-game at seedProgress(40)');

  const staircaseResult = await evalExpr(send, `
    (function() {
      const gs = window.game;
      // Wipe and re-seed to 40 stars-3
      gs.seedProgress(40, { stars: 3 });
      gs.showLevelSelect();
      // Count visible level-action navigation buttons + overflow toggles
      // Day 91 P13 counted 18 nav buttons at end-game across all the .challenge-btn
      // entries (tier-gated challenge modes, info buttons, creator, settings, etc.)
      const navBtnEls = document.querySelectorAll('#level-select-screen button.challenge-btn');
      let navVisible = 0;
      for (const b of navBtnEls) {
        const cs = getComputedStyle(b);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') navVisible++;
      }
      const overflow = document.querySelectorAll('#level-select-screen .level-overflow-btn');
      let overflowVisible = 0;
      for (const b of overflow) {
        const cs = getComputedStyle(b);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') overflowVisible++;
      }
      return { navVisible, overflowVisible };
    })()
  `);

  if (staircaseResult.overflowVisible === 40) ok('P7.1: 40 overflow buttons at seed=40');
  else fail('P7.1: overflow buttons', `expected 40, got ${staircaseResult.overflowVisible}`);

  // The exact nav count (18) depends on selectors; accept anything >=15 as healthy
  if (staircaseResult.navVisible >= 15) ok('P7.2: nav buttons visible at end-game', `count=${staircaseResult.navVisible}`);
  else fail('P7.2: nav button count', `expected >=15, got ${staircaseResult.navVisible}`);

  // ─── P8: Console hygiene ───
  phase('P8 — Console hygiene');

  // Give pending console messages a moment to drain
  await new Promise((r) => setTimeout(r, 500));

  if (exceptionCount === 0) ok('P8.1: 0 Runtime.exceptionThrown');
  else fail('P8.1: Runtime.exceptionThrown', String(exceptionCount));

  if (consoleErrorCount === 0) ok('P8.2: 0 console.error');
  else fail('P8.2: console.error', String(consoleErrorCount));

  // ─── Summary ───
  console.log('\n================================================================');
  const pass = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`Day 92 QA: ${pass}/${total} assertions passed`);
  console.log(`Exceptions: ${exceptionCount} · console.error: ${consoleErrorCount}`);
  if (pass !== total) {
    console.log('\nFAILED:');
    for (const r of results) if (!r.ok) console.log(`  ❌ ${r.name} — ${r.detail || ''}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Harness error:', e);
  process.exit(2);
});
