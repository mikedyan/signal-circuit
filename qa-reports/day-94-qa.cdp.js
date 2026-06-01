#!/usr/bin/env node
/**
 * Day 94 QA harness — Lab Bench II Composite Constraints (Lab Bench III seed).
 *
 * Verifies:
 *   P1 (5): Build identity — 11 ?v=1780444800 cache-bust refs, sw v63,
 *           L44/L45 wired into LEVELS, Chapter 10 includes [41..45],
 *           index.html has #lab-constraint-2 second-chip sibling.
 *   P2 (4): Cold-start surface unchanged — level-select visible, 2
 *           non-level buttons, 45 level cards, onboarding silent-standard.
 *   P3 (5): Day 84 single-constraint regression — L41 NAND-only chip,
 *           L42 hardCap=4 single rejection format byte-equivalent, L43
 *           mustIncludeGate single rejection format byte-equivalent.
 *   P4 (6): L44 NAND-Only Half Adder composite — labConstraint is array
 *           of length 2, gateHardCap=6, availableGates=['NAND'], both
 *           chips render, validator accepts 5-NAND solve, validator
 *           rejects 7-gate over-cap submission.
 *   P5 (6): L45 XOR-Heavy MUX composite — labConstraint is array of
 *           length 2, gateHardCap=5, mustIncludeGate=['XOR'], both chips
 *           render, validator rejects no-XOR + over-cap composite with
 *           BOTH reasons in the same message, validator accepts compliant
 *           3-gate XOR/AND/XOR build.
 *   P6 (3): Day 78 staircase + Day 83 tournament + L1 core loop regression.
 *   P7 (2): Console hygiene — 0 Runtime.exceptionThrown + 0 console.error.
 *
 * Total target: 31 assertions across 7 phases.
 *
 * Uses raw CDP via ws@8.20.0 from OpenClaw's node_modules (Day 86+ pattern).
 *
 * Run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node \
 *     qa-reports/day-94-qa.cdp.js
 */

const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const APP_URL = 'http://localhost:8901/';
const CACHE_BUST = '1780444800';
const SW_VERSION = 'signal-circuit-v63';

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
  console.log('Day 94 QA harness — Lab Bench II Composite Constraints');
  console.log('=====================================================');

  // ─── P1: Build identity ───
  phase('P1 — Build identity');

  const { body: html } = await httpGet('localhost', 8901, '/');
  const cacheRefs = (html.match(new RegExp(`\\?v=${CACHE_BUST}`, 'g')) || []).length;
  if (cacheRefs === 11) ok('P1.1: 11 cache-bust refs unified at ?v=' + CACHE_BUST, `${cacheRefs}/11`);
  else fail('P1.1: cache-bust refs', `expected 11, got ${cacheRefs}`);

  const { body: swSrc } = await httpGet('localhost', 8901, '/sw.js');
  if (swSrc.includes(`CACHE_NAME = '${SW_VERSION}'`)) ok('P1.2: sw.js CACHE_NAME = ' + SW_VERSION);
  else fail('P1.2: sw.js CACHE_NAME', `expected ${SW_VERSION}`);

  if (html.includes('id="lab-constraint-2"')) ok('P1.3: index.html has #lab-constraint-2 sibling chip');
  else fail('P1.3: #lab-constraint-2 missing from index.html');

  const { body: levelsSrc } = await httpGet('localhost', 8901, `/js/levels.js?v=${CACHE_BUST}`);
  if (levelsSrc.includes("id: 44") && levelsSrc.includes("id: 45") &&
      levelsSrc.includes("NAND-Only Half Adder") && levelsSrc.includes("XOR-Heavy Multiplexer")) {
    ok('P1.4: js/levels.js declares L44 NAND-Only Half Adder + L45 XOR-Heavy Multiplexer');
  } else {
    fail('P1.4: L44/L45 declarations missing');
  }

  if (levelsSrc.includes("levels: [41, 42, 43, 44, 45]")) ok('P1.5: Chapter 10 includes [41..45]');
  else fail('P1.5: Chapter 10 levels array');

  // ─── Connect to CDP and pick a tab ───
  const target = await pickTarget();
  const { send } = await cdpConnect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  try { await send('Storage.clearDataForOrigin', { origin: APP_URL.replace(/\/$/, ''), storageTypes: 'all' }); } catch (e) { /* best effort */ }

  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { Object.defineProperty(navigator, 'vibrate', { value: () => true, writable: true }); } catch (e) {}`,
  });

  await send('Page.navigate', { url: APP_URL + '?day94=' + Date.now() });
  await waitFor(send, 'typeof window.game === "object" && window.game !== null', 12000);
  await new Promise((r) => setTimeout(r, 500));

  // ─── P2: Cold-start surface ───
  phase('P2 — Cold-start surface');

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

  const levelCards = await evalExpr(send, `document.querySelectorAll('#level-select-screen .level-btn').length`);
  if (levelCards === 45) ok('P2.3: 45 level cards rendered (43 → 45 with L44 + L45)');
  else fail('P2.3: level card count', `expected 45, got ${levelCards}`);

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

  // ─── P3: Day 84 single-constraint regression ───
  phase('P3 — Day 84 single-constraint regression (L41/L42/L43)');

  // L41: NAND-only — single string labConstraint
  const l41 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(41);
      const lvl = gs.currentLevel;
      // Force HUD update
      if (window.ui && window.ui.updateLabHud) window.ui.updateLabHud();
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      return {
        id: lvl.id,
        labConstraint: lvl.labConstraint,
        c1Text: c1 ? c1.textContent : null,
        c1Vis: c1 ? c1.style.display !== 'none' : null,
        c2Text: c2 ? c2.textContent : null,
        c2Vis: c2 ? (c2.style.display !== 'none') : null,
        availableGates: lvl.availableGates,
      };
    })()
  `);
  if (l41.id === 41 && typeof l41.labConstraint === 'string' && /NAND only/.test(l41.labConstraint) &&
      l41.c1Vis === true && /NAND only/.test(l41.c1Text) && l41.c2Vis === false &&
      Array.isArray(l41.availableGates) && l41.availableGates.length === 1 && l41.availableGates[0] === 'NAND') {
    ok('P3.1: L41 single-chip NAND-only render unchanged (c1 visible, c2 hidden)');
  } else {
    fail('P3.1: L41 single-chip render', JSON.stringify(l41));
  }

  // L42: hardCap=4, single-violation message byte-equivalent
  const l42 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(42);
      if (window.ui && window.ui.updateLabHud) window.ui.updateLabHud();
      // Place 5 gates and run validator
      gs.gates = []; // start clean
      for (let i = 0; i < 5; i++) gs.addGate('AND', 200 + i * 40, 300);
      const v = gs._validateLabConstraints();
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      return {
        hardCap: gs.currentLevel.gateHardCap,
        validator: v,
        c1Vis: c1 && c1.style.display !== 'none',
        c2Vis: c2 && c2.style.display !== 'none',
      };
    })()
  `);
  const expectedMsgL42 = 'Submission rejected: 5 gates exceeds hard cap of 4.';
  if (l42.hardCap === 4 && l42.validator && l42.validator.ok === false &&
      l42.validator.message === expectedMsgL42 && l42.c1Vis === true && l42.c2Vis === false) {
    ok('P3.2: L42 hardCap rejection message byte-equivalent to Day 84', l42.validator.message);
  } else {
    fail('P3.2: L42 rejection format drift', JSON.stringify(l42));
  }

  // L43: mustIncludeGate=['XOR'], single-violation message byte-equivalent
  const l43 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(43);
      if (window.ui && window.ui.updateLabHud) window.ui.updateLabHud();
      gs.gates = []; // start clean
      // Place 2 NANDs (no XOR) — should be rejected for missing XOR
      gs.addGate('NAND', 200, 200);
      gs.addGate('NAND', 260, 300);
      const v = gs._validateLabConstraints();
      return {
        mustInclude: gs.currentLevel.mustIncludeGate,
        validator: v,
      };
    })()
  `);
  const expectedMsgL43 = 'Submission rejected: blueprint must include an XOR gate.';
  if (Array.isArray(l43.mustInclude) && l43.mustInclude[0] === 'XOR' &&
      l43.validator && l43.validator.ok === false &&
      l43.validator.message === expectedMsgL43) {
    ok('P3.3: L43 mustIncludeGate single-violation message byte-equivalent', l43.validator.message);
  } else {
    fail('P3.3: L43 rejection format drift', JSON.stringify(l43));
  }

  // L42 baseline still cleanly accepts the valid 4-gate state (empty placeholders)
  const l42Accept = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(42);
      gs.gates = [];
      // 4 gates, mustIncludeGate empty for L42 — should pass validator
      for (let i = 0; i < 4; i++) gs.addGate('AND', 200 + i * 40, 300);
      return gs._validateLabConstraints();
    })()
  `);
  if (l42Accept && l42Accept.ok === true) ok('P3.4: L42 with 4 gates passes validator');
  else fail('P3.4: L42 4-gate validator should accept', JSON.stringify(l42Accept));

  // L43 with XOR present should accept
  const l43Accept = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(43);
      gs.gates = [];
      gs.addGate('XOR', 200, 200);
      gs.addGate('XOR', 320, 250);
      return gs._validateLabConstraints();
    })()
  `);
  if (l43Accept && l43Accept.ok === true) ok('P3.5: L43 with XOR gates passes validator');
  else fail('P3.5: L43 XOR-present validator should accept', JSON.stringify(l43Accept));

  // ─── P4: L44 NAND-Only Half Adder composite ───
  phase('P4 — L44 NAND-Only Half Adder composite constraint');

  const l44Shape = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(44);
      if (window.ui && window.ui.updateLabHud) window.ui.updateLabHud();
      const lvl = gs.currentLevel;
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      return {
        id: lvl.id,
        title: lvl.title,
        labConstraint: lvl.labConstraint,
        gateHardCap: lvl.gateHardCap,
        availableGates: lvl.availableGates,
        c1Text: c1 ? c1.textContent : null,
        c1Vis: c1 ? c1.style.display !== 'none' : null,
        c2Text: c2 ? c2.textContent : null,
        c2Vis: c2 ? c2.style.display !== 'none' : null,
      };
    })()
  `);
  if (l44Shape.id === 44 && Array.isArray(l44Shape.labConstraint) && l44Shape.labConstraint.length === 2) {
    ok('P4.1: L44 labConstraint is array of length 2', l44Shape.labConstraint.join(' / '));
  } else {
    fail('P4.1: L44 labConstraint shape', JSON.stringify(l44Shape.labConstraint));
  }
  if (l44Shape.gateHardCap === 6) ok('P4.2: L44 gateHardCap = 6');
  else fail('P4.2: L44 gateHardCap', String(l44Shape.gateHardCap));
  if (Array.isArray(l44Shape.availableGates) && l44Shape.availableGates.length === 1 && l44Shape.availableGates[0] === 'NAND') {
    ok('P4.3: L44 availableGates = [NAND]');
  } else {
    fail('P4.3: L44 availableGates', JSON.stringify(l44Shape.availableGates));
  }
  if (l44Shape.c1Vis === true && l44Shape.c2Vis === true &&
      /NAND/.test(l44Shape.c1Text) && /Hard cap/.test(l44Shape.c2Text)) {
    ok('P4.4: L44 both chips render — c1="' + l44Shape.c1Text + '" c2="' + l44Shape.c2Text + '"');
  } else {
    fail('P4.4: L44 chip strip composite render', JSON.stringify(l44Shape));
  }

  // Validator: 5 NANDs (valid optimal-shape count) → accept (no composite violation)
  const l44Accept = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(44);
      gs.gates = [];
      for (let i = 0; i < 5; i++) gs.addGate('NAND', 200 + i * 40, 200);
      return gs._validateLabConstraints();
    })()
  `);
  if (l44Accept && l44Accept.ok === true) ok('P4.5: L44 with 5 NANDs passes composite validator (≤ hard cap 6, NAND palette)');
  else fail('P4.5: L44 5-NAND validator should accept', JSON.stringify(l44Accept));

  // Validator: 7 NANDs (over cap) → reject for hard-cap reason
  const l44Reject = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(44);
      gs.gates = [];
      for (let i = 0; i < 7; i++) gs.addGate('NAND', 200 + i * 40, 200);
      return gs._validateLabConstraints();
    })()
  `);
  if (l44Reject && l44Reject.ok === false &&
      /7 gates exceeds hard cap of 6/.test(l44Reject.message)) {
    ok('P4.6: L44 7-gate over-cap rejection', l44Reject.message);
  } else {
    fail('P4.6: L44 7-gate over-cap', JSON.stringify(l44Reject));
  }

  // ─── P5: L45 XOR-Heavy Multiplexer composite ───
  phase('P5 — L45 XOR-Heavy Multiplexer composite constraint');

  const l45Shape = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(45);
      if (window.ui && window.ui.updateLabHud) window.ui.updateLabHud();
      const lvl = gs.currentLevel;
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      return {
        id: lvl.id,
        title: lvl.title,
        labConstraint: lvl.labConstraint,
        gateHardCap: lvl.gateHardCap,
        mustIncludeGate: lvl.mustIncludeGate,
        c1Text: c1 ? c1.textContent : null,
        c1Vis: c1 ? c1.style.display !== 'none' : null,
        c2Text: c2 ? c2.textContent : null,
        c2Vis: c2 ? c2.style.display !== 'none' : null,
      };
    })()
  `);
  if (l45Shape.id === 45 && Array.isArray(l45Shape.labConstraint) && l45Shape.labConstraint.length === 2) {
    ok('P5.1: L45 labConstraint is array of length 2', l45Shape.labConstraint.join(' / '));
  } else {
    fail('P5.1: L45 labConstraint shape', JSON.stringify(l45Shape.labConstraint));
  }
  if (l45Shape.gateHardCap === 5) ok('P5.2: L45 gateHardCap = 5');
  else fail('P5.2: L45 gateHardCap', String(l45Shape.gateHardCap));
  if (Array.isArray(l45Shape.mustIncludeGate) && l45Shape.mustIncludeGate[0] === 'XOR') {
    ok('P5.3: L45 mustIncludeGate = [XOR]');
  } else {
    fail('P5.3: L45 mustIncludeGate', JSON.stringify(l45Shape.mustIncludeGate));
  }
  if (l45Shape.c1Vis === true && l45Shape.c2Vis === true &&
      /XOR/.test(l45Shape.c1Text) && /Hard cap/.test(l45Shape.c2Text)) {
    ok('P5.4: L45 both chips render — c1="' + l45Shape.c1Text + '" c2="' + l45Shape.c2Text + '"');
  } else {
    fail('P5.4: L45 chip strip composite render', JSON.stringify(l45Shape));
  }

  // Composite double-violation: 6 NANDs (no XOR, over hard cap 5)
  const l45DoubleReject = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(45);
      gs.gates = [];
      for (let i = 0; i < 6; i++) gs.addGate('NAND', 200 + i * 40, 200);
      return gs._validateLabConstraints();
    })()
  `);
  // Should reject with BOTH reasons joined by ';'
  if (l45DoubleReject && l45DoubleReject.ok === false &&
      /6 gates exceeds hard cap of 5/.test(l45DoubleReject.message) &&
      /blueprint must include an XOR gate/.test(l45DoubleReject.message) &&
      l45DoubleReject.message.includes(';')) {
    ok('P5.5: L45 composite double-violation lists BOTH reasons', l45DoubleReject.message);
  } else {
    fail('P5.5: L45 double-violation message', JSON.stringify(l45DoubleReject));
  }

  // Compliant: XOR + AND + XOR (3 gates ≤ cap 5, contains XOR)
  const l45Accept = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(45);
      gs.gates = [];
      gs.addGate('XOR', 200, 200);
      gs.addGate('AND', 300, 250);
      gs.addGate('XOR', 400, 200);
      return gs._validateLabConstraints();
    })()
  `);
  if (l45Accept && l45Accept.ok === true) ok('P5.6: L45 with 3-gate XOR/AND/XOR passes composite validator');
  else fail('P5.6: L45 3-gate XOR-based validator should accept', JSON.stringify(l45Accept));

  // ─── P6: Regression ───
  phase('P6 — Day 78 staircase + Day 83 tournament + L1 core loop regression');

  const staircase = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.seedProgress(45, { stars: 3 });
      gs.showLevelSelect();
      const overflow = document.querySelectorAll('#level-select-screen .level-overflow-btn');
      let overflowVisible = 0;
      for (const b of overflow) {
        const cs = getComputedStyle(b);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') overflowVisible++;
      }
      return { overflowVisible };
    })()
  `);
  // We now have 45 levels (was 43) — expect 45 overflow buttons at full unlock
  if (staircase.overflowVisible === 45) ok('P6.1: 45 overflow buttons at seed=45 (43 → 45 with L44+L45)');
  else fail('P6.1: overflow buttons', `expected 45, got ${staircase.overflowVisible}`);

  const tourney = await evalExpr(send, `
    (function() {
      const gs = window.game;
      const a = gs.tournamentBackend;
      return { mode: a && a.getMode ? a.getMode() : null, isLive: a && a.isLive ? a.isLive() : null };
    })()
  `);
  if (tourney.mode === 'local' && tourney.isLive === false) ok('P6.2: tournament backend default mode=local, isLive=false');
  else fail('P6.2: tournament mode', JSON.stringify(tourney));

  const l1 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.seedProgress(0);
      gs.startLevel(1);
      gs.gates = [];
      const g = gs.addGate('AND', 400, 300);
      const inA = gs.inputNodes[0], inB = gs.inputNodes[1], out = gs.outputNodes[0];
      gs.addWireFromData(inA.id, 0, g.id, 0);
      gs.addWireFromData(inB.id, 0, g.id, 1);
      gs.addWireFromData(g.id, 0, out.id, 0);
      gs.runQuickTest();
      const e = gs.progress.levels && gs.progress.levels['1'];
      return { stars: e && e.stars, gates: gs.gates.length };
    })()
  `);
  if (l1.stars === 3 && l1.gates === 1) ok('P6.3: L1 1-gate AND solve persists 3 stars');
  else fail('P6.3: L1 core loop regression', JSON.stringify(l1));

  // ─── P7: Console hygiene ───
  phase('P7 — Console hygiene');

  await new Promise((r) => setTimeout(r, 500));

  if (exceptionCount === 0) ok('P7.1: 0 Runtime.exceptionThrown');
  else fail('P7.1: Runtime.exceptionThrown', String(exceptionCount));

  if (consoleErrorCount === 0) ok('P7.2: 0 console.error');
  else fail('P7.2: console.error', String(consoleErrorCount));

  // ─── Summary ───
  console.log('\n=====================================================');
  const pass = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`Day 94 QA: ${pass}/${total} assertions passed`);
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
