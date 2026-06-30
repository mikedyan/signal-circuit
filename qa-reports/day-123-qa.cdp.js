#!/usr/bin/env node
/**
 * Day 123 QA harness — Cycle 6 BUILD Week, Day 1: "Module Split Phase 3".
 *
 * Converts js/simulation.js from a classic-script global-leaking file into a
 * true ES module (export class Simulation + window rebind tail). Day 92
 * (gates.js) / Day 107 (wires.js) precedent. Net-functional change = zero.
 *
 * Build under test: LOCAL http://localhost:8901/ (?v=1782691200 / sw v77).
 *
 * Coverage (8 phases):
 *   P1  build identity (11 cache-bust refs ?v=1782691200 / sw v77)
 *   P2  module binding: window.Simulation is a class +
 *       game.simulation instanceof window.Simulation (binding-identity proof)
 *   P3  evaluate path: L1 AND-gate synthetic solve via runQuickTest() → 3 stars
 *       (exercises Simulation.evaluateOnce + runAll)
 *   P4  trace path: empty L1 circuit → traceFailurePath() returns a trace;
 *       detectConstantOutputs() callable
 *   P5  regression — Day 92 gates.js + Day 107 wires.js bindings intact
 *   P6  regression — Day 79 dead-identifier purge (7 ids undefined + #weekly-puzzle-btn absent)
 *   P7  cold-start invariants (2 nav buttons, 50 level cards, silent-default difficulty)
 *   P8  0 console.error / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-123-qa.cdp.js
 *   tools/cdp-launch.sh stop
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const runtimeExceptions = [];

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (err) { reject(err); } });
    }).on('error', reject);
  });
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(ws, expression) {
  const result = await send(ws, 'Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, timeout: 15000,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate threw: ${result.exceptionDetails.text} :: ${expression.slice(0, 200)}`);
  }
  return result.result && result.result.value;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

const SCREEN_HELPERS = `
  const screenVisible = (id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };
`;

async function main() {
  const targets = await getJSON('/json/list');
  let target = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) throw new Error('No CDP page target found');
  console.log(`[cdp] target: ${target.url}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (_) { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => (a && a.value) || (a && a.description) || '').join(' ');
      consoleErrors.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      runtimeExceptions.push(msg.params.exceptionDetails.text || String(msg.params));
    }
  });

  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.enable');
  await send(ws, 'Page.navigate', { url: TARGET_URL });
  await wait(4000);

  // Cold-start wipe + reload.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_clean' });
  await wait(4000);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity (local)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — unified ?v=1782691200 (Day 123 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782691200', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV77: text.indexOf('signal-circuit-v77') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v77', swProbe.swFetched === true && swProbe.hasV77 === true, JSON.stringify(swProbe));

  // simulation.js carries type="module"
  const simTag = await evaluate(ws, `(() => {
    const s = [...document.querySelectorAll('script[src*="simulation.js"]')][0];
    return { found: !!s, type: s ? s.getAttribute('type') : null };
  })()`);
  assert('P1.d — simulation.js loaded as type="module"', simTag.found && simTag.type === 'module', JSON.stringify(simTag));

  // ============================================================
  // P2: module binding (the actual Day 123 deliverable)
  // ============================================================
  const binding = await evaluate(ws, `(() => {
    return {
      simType: typeof window.Simulation,
      isClass: typeof window.Simulation === 'function' && /^class\\s/.test(Function.prototype.toString.call(window.Simulation)),
      instOf: !!(window.game && window.game.simulation instanceof window.Simulation),
      hasEvaluateOnce: !!(window.Simulation && window.Simulation.prototype.evaluateOnce),
      hasRunAll: !!(window.Simulation && window.Simulation.prototype.runAll),
      hasTrace: !!(window.Simulation && window.Simulation.prototype.traceFailurePath),
      hasDetectConst: !!(window.Simulation && window.Simulation.prototype.detectConstantOutputs),
    };
  })()`);
  console.log(`\n[Binding] ${JSON.stringify(binding)}`);
  assert('P2.a — window.Simulation is a class', binding.simType === 'function' && binding.isClass === true, JSON.stringify(binding));
  assert('P2.b — game.simulation instanceof window.Simulation (binding-identity)', binding.instOf === true, `instOf=${binding.instOf}`);
  assert('P2.c — Simulation.prototype has evaluateOnce + runAll', binding.hasEvaluateOnce && binding.hasRunAll, JSON.stringify(binding));
  assert('P2.d — Day 42 prototype augmentations present (trace + detectConst)', binding.hasTrace && binding.hasDetectConst, JSON.stringify(binding));

  // ============================================================
  // P3: evaluate path — L1 AND-gate synthetic solve via runQuickTest
  // ============================================================
  const solve = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 350));
    // Build a minimal correct L1 (2-input AND) circuit programmatically.
    const inA = gs.inputNodes[0], inB = gs.inputNodes[1];
    const out = gs.outputNodes[0];
    const g = new window.Gate('AND', 400, 300);
    gs.gates.push(g);
    const w1 = new window.Wire(inA.id, 0, g.id, 0);
    const w2 = new window.Wire(inB.id, 0, g.id, 1);
    const w3 = new window.Wire(g.id, 0, out.id, 0);
    gs.wireManager.wires.push(w1, w2, w3);
    // Run the instant quick-test path (exercises Simulation.runAll/evaluateOnce).
    const res = gs.simulation.runAll();
    const allPass = res.length > 0 && res.every(r => r.pass);
    // Drive the official completion path.
    let stars = null;
    try {
      gs.runQuickTest();
      await new Promise(r => setTimeout(r, 400));
      if (allPass) { gs.completeLevel(1, gs.gates.length); }
      await new Promise(r => setTimeout(r, 200));
      stars = gs.progress && gs.progress.levels && gs.progress.levels[1] ? gs.progress.levels[1].stars : null;
    } catch (e) { stars = 'err:' + e; }
    return { rows: res.length, allPass, stars };
  })()`);
  console.log(`\n[Solve] ${JSON.stringify(solve)}`);
  assert('P3.a — Simulation.runAll evaluates all truth-table rows', solve.rows === 4, `rows=${solve.rows}`);
  assert('P3.b — correct AND circuit passes every row', solve.allPass === true, `allPass=${solve.allPass}`);
  assert('P3.c — completeLevel persists 3 stars (optimal)', solve.stars === 3, `stars=${solve.stars}`);

  // ============================================================
  // P4: trace path — empty circuit yields a failure trace
  // ============================================================
  const trace = await evaluate(ws, `(async () => {
    const gs = window.game;
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 300));
    // No gates, no wires → output disconnected → guaranteed failure trace.
    const row = gs.currentLevel.truthTable[gs.currentLevel.truthTable.length - 1];
    const traces = gs.simulation.traceFailurePath(row.inputs, row.outputs);
    const results = gs.simulation.runAll();
    const consts = gs.simulation.detectConstantOutputs(results);
    return {
      traceCount: traces.length,
      hasMsg: traces.length > 0 && typeof traces[0].message === 'string' && traces[0].message.length > 0,
      disconnected: traces.length > 0 ? !!traces[0].disconnected : null,
      constCallable: consts && typeof consts === 'object',
    };
  })()`);
  console.log(`\n[Trace] ${JSON.stringify(trace)}`);
  assert('P4.a — traceFailurePath returns ≥1 trace on empty circuit', trace.traceCount >= 1, `count=${trace.traceCount}`);
  assert('P4.b — trace carries a human-readable message', trace.hasMsg === true, JSON.stringify(trace));
  assert('P4.c — detectConstantOutputs callable', trace.constCallable === true, `constCallable=${trace.constCallable}`);

  // ============================================================
  // P5: regression — prior module bindings (Day 92 + Day 107)
  // ============================================================
  const prior = await evaluate(ws, `(() => {
    const gateKeys = window.GateTypes ? Object.keys(window.GateTypes).sort() : [];
    return {
      gate: typeof window.Gate,
      ionode: typeof window.IONode,
      roundRect: typeof window.roundRect,
      gateTypeKeys: gateKeys,
      wire: typeof window.Wire,
      wireManager: typeof window.WireManager,
      wireColors: Array.isArray(window.WIRE_COLORS_DEFAULT) ? window.WIRE_COLORS_DEFAULT.length : null,
      getWireColors: typeof window.getWireColors,
    };
  })()`);
  console.log(`\n[Prior modules] ${JSON.stringify(prior)}`);
  const expectGateKeys = ['AND','MYSTERY','MYSTERY3','NAND','NOR','NOT','OR','XOR'];
  assert('P5.a — Day 92 gates.js: Gate/IONode/roundRect bound', prior.gate === 'function' && prior.ionode === 'function' && prior.roundRect === 'function', JSON.stringify(prior));
  assert('P5.b — Day 92 gates.js: GateTypes has 8 expected keys', JSON.stringify(prior.gateTypeKeys) === JSON.stringify(expectGateKeys), JSON.stringify(prior.gateTypeKeys));
  assert('P5.c — Day 107 wires.js: Wire/WireManager bound', prior.wire === 'function' && prior.wireManager === 'function', JSON.stringify(prior));
  assert('P5.d — Day 107 wires.js: WIRE_COLORS_DEFAULT array + getWireColors callable', prior.wireColors !== null && prior.wireColors > 0 && prior.getWireColors === 'function', JSON.stringify(prior));

  // ============================================================
  // P6: regression — Day 79 dead-identifier purge
  // ============================================================
  const deadIds = await evaluate(ws, `(() => {
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    const undefinedCount = ids.filter(n => typeof window[n] === 'undefined').length;
    const weeklyAbsent = !document.getElementById('weekly-puzzle-btn');
    return { total: ids.length, undefinedCount, weeklyAbsent };
  })()`);
  assert('P6.a — 7 dead identifiers still undefined', deadIds.undefinedCount === deadIds.total, `${deadIds.undefinedCount}/${deadIds.total}`);
  assert('P6.b — #weekly-puzzle-btn DOM absent', deadIds.weeklyAbsent === true, `weeklyAbsent=${deadIds.weeklyAbsent}`);

  // ============================================================
  // P7: cold-start invariants
  // ============================================================
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_cold2' });
  await wait(4000);
  const cold = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 250));
    const ls = document.getElementById('level-select-screen');
    const navCount = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    const cardCount = [...ls.querySelectorAll('.level-btn')].length;
    const difficulty = localStorage.getItem('signal-circuit-difficulty-mode');
    return { navCount, cardCount, difficulty };
  })()`);
  console.log(`\n[Cold] ${JSON.stringify(cold)}`);
  assert('P7.a — cold: 2 nav buttons (Day 78 invariant)', cold.navCount === 2, `got ${cold.navCount}`);
  assert('P7.b — cold: 50 level cards (Day 109 invariant)', cold.cardCount === 50, `got ${cold.cardCount}`);
  assert('P7.c — cold: silent-default difficulty standard', cold.difficulty === 'standard' || cold.difficulty === null, `difficulty=${cold.difficulty}`);

  // ============================================================
  // P8: console hygiene
  // ============================================================
  assert('P8.a — 0 console.error', consoleErrors.length === 0, `errors=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''}`);
  assert('P8.b — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, `exceptions=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.slice(0,3).join(' | ') : ''}`);

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Day 123 QA — Module Split Phase 3 (simulation.js → ES module)`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length} | Runtime.exceptionThrown: ${runtimeExceptions.length}`);
  console.log(`${'='.repeat(60)}`);
  if (passed !== total) {
    console.log('\nFAILURES:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name} — ${r.detail || ''}`));
  }

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('HARNESS ERROR:', err); process.exit(2); });
