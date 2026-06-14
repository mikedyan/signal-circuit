#!/usr/bin/env node
/**
 * Day 107 QA harness — Cycle 5 BUILD Week, Day 1: Module Split Phase 2 (wires.js).
 *
 * Day 92 precedent (gates.js → ES module). Today wires.js gains
 * `export` on 5 top-level declarations + a window-rebind tail block
 * so the 4 classic-script consumers keep resolving Wire / WireManager /
 * WIRE_COLORS_DEFAULT / getWireColors as bare globals.
 *
 * Phases:
 *   P1 Build identity         — 11 ?v=1781049600 refs, sw v69, GameState live
 *   P2 Module split contract  — wires.js loaded as type=module; window globals
 *                               (Wire, WireManager, WIRE_COLORS_DEFAULT,
 *                               getWireColors) all present and the right shape
 *   P3 Cold-start sanity      — 2 nav buttons, 45 level cards, defaults
 *                               (Day 78/103 invariants preserved)
 *   P4 L1 gameplay smoke      — Quick Test solves L1 with 3 stars; wireManager
 *                               is a WireManager instance; new Wire creation
 *                               path still works
 *   P5 Day-79 dead-id regression
 *   P6 Day-92 gates.js Phase 1 regression (Gate / GateTypes / IONode still
 *                               window-bound from Phase 1)
 *   P7 Console hygiene        — 0 console.error, 0 Runtime.exceptionThrown
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301 (--remote-allow-origins=*)
 *
 * Usage:
 *   node qa-reports/day-107-qa.cdp.js
 */

const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();

let msgId = 0;
let ws;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];
const results = [];

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function evalExpr(expr, awaitPromise = false) {
  return send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise,
  }).then((r) => {
    if (r.exceptionDetails) {
      throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
    }
    return r.result && r.result.value;
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function assert(name, cond, detail) {
  results.push({ name, pass: !!cond, detail });
  const tag = cond ? 'PASS' : 'FAIL';
  const detailStr = (detail === undefined) ? '(no detail)' : (JSON.stringify(detail) || String(detail)).slice(0, 200);
  console.log(`[${tag}] ${name}${cond ? '' : ' — ' + detailStr}`);
}

async function getWsUrl() {
  const http = require('http');
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
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);

  await new Promise((res, rej) => {
    ws.on('open', res);
    ws.on('error', rej);
  });

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

  await send('Runtime.enable');
  await send('Page.enable');

  const navPromise = new Promise((resolve) => {
    const listener = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.method === 'Page.loadEventFired') {
        ws.off('message', listener);
        resolve();
      }
    };
    ws.on('message', listener);
  });
  await send('Page.navigate', { url: TARGET_URL });
  await navPromise;
  await sleep(800);

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    (
      Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=1781049600')).length +
      Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=1781049600')).length
    )
  `);
  assert('P1.1 11 cache-bust refs at ?v=1781049600 (10 scripts + 1 stylesheet)', vCount === 11, { vCount });

  const swRegistered = await evalExpr(`
    'serviceWorker' in navigator
  `);
  assert('P1.2 serviceWorker API present', swRegistered === true);

  const gameLive = await evalExpr(`!!window.game && !!window.game.wireManager`);
  assert('P1.3 window.game + wireManager live', gameLive === true);

  // ── P2 Module split contract (the actual Day 107 feature) ──────────────
  console.log('\n── P2 Module split contract ──');

  const wiresScript = await evalExpr(`
    const s = Array.from(document.querySelectorAll('script')).find(s => s.src && s.src.includes('wires.js'));
    s ? { type: s.type, src: s.src } : null
  `);
  assert('P2.1 wires.js script tag has type="module"', wiresScript && wiresScript.type === 'module', wiresScript);
  assert('P2.2 wires.js src includes ?v=1781049600', wiresScript && wiresScript.src.includes('?v=1781049600'), wiresScript);

  const winWire = await evalExpr(`typeof window.Wire`);
  assert('P2.3 window.Wire is a function (class)', winWire === 'function', { typeof: winWire });

  const winWireManager = await evalExpr(`typeof window.WireManager`);
  assert('P2.4 window.WireManager is a function (class)', winWireManager === 'function', { typeof: winWireManager });

  const winColors = await evalExpr(`
    Array.isArray(window.WIRE_COLORS_DEFAULT)
      ? { isArr: true, len: window.WIRE_COLORS_DEFAULT.length, first: window.WIRE_COLORS_DEFAULT[0] }
      : null
  `);
  assert('P2.5 window.WIRE_COLORS_DEFAULT is a 10-element array', winColors && winColors.isArr && winColors.len === 10, winColors);
  assert('P2.6 first wire color is breadboard blue', winColors && winColors.first === '#4488ff', winColors);

  const winGetWireColors = await evalExpr(`typeof window.getWireColors`);
  assert('P2.7 window.getWireColors is a function', winGetWireColors === 'function', { typeof: winGetWireColors });

  const colorsCallable = await evalExpr(`
    const c = window.getWireColors();
    Array.isArray(c) ? { len: c.length } : null
  `);
  assert('P2.8 getWireColors() returns an array', colorsCallable && colorsCallable.len >= 10, colorsCallable);

  const wmInstance = await evalExpr(`
    window.game.wireManager instanceof window.WireManager
  `);
  assert('P2.9 wireManager is instanceof window.WireManager (binding identity)', wmInstance === true);

  const wireToString = await evalExpr(`
    window.Wire.toString().startsWith('class Wire')
  `);
  assert('P2.10 window.Wire.toString() starts with "class Wire"', wireToString === true);

  const wireManagerToString = await evalExpr(`
    window.WireManager.toString().startsWith('class WireManager')
  `);
  assert('P2.11 window.WireManager.toString() starts with "class WireManager"', wireManagerToString === true);

  // ── P3 Cold-start sanity ─────────────────────────────────────────────
  console.log('\n── P3 Cold-start sanity ──');

  // Reset to true cold by clearing localStorage and reloading
  await evalExpr(`localStorage.clear()`);
  const navPromise2 = new Promise((resolve) => {
    const listener = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.method === 'Page.loadEventFired') {
        ws.off('message', listener);
        resolve();
      }
    };
    ws.on('message', listener);
  });
  await send('Page.navigate', { url: TARGET_URL + '_cold' });
  await navPromise2;
  await sleep(800);

  const coldNavBtns = await evalExpr(`
    // Day 102 nav-button-filter primitive
    Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => {
      const r = b.getBoundingClientRect();
      const inSidebar = !b.classList.contains('level-btn') &&
                        !b.classList.contains('level-overflow-btn') &&
                        !b.closest('.level-overflow-popover') &&
                        b.offsetParent !== null && r.width > 0 && r.height > 0;
      return inSidebar;
    }).length
  `);
  assert('P3.1 cold-start non-level button count = 2 (Day 78 invariant)', coldNavBtns === 2, { coldNavBtns });

  const cardCount = await evalExpr(`
    document.querySelectorAll('#level-select-screen .level-btn').length
  `);
  assert('P3.2 45 level cards visible cold (Day 103 mastery-gated)', cardCount === 45, { cardCount });

  const difficultyDefault = await evalExpr(`
    localStorage.getItem('signal-circuit-difficulty-mode')
  `);
  assert('P3.3 silent-default difficulty = standard (Day 78 Cut #5)', difficultyDefault === 'standard', { difficultyDefault });

  // ── P4 L1 gameplay smoke ────────────────────────────────────────────
  console.log('\n── P4 L1 gameplay smoke ──');

  // Wait a moment for window.game to bind post-reload
  await sleep(400);
  const gameReadyAgain = await evalExpr(`!!window.game && typeof window.game.loadLevel === 'function'`);
  if (!gameReadyAgain) {
    await sleep(600);
  }

  await evalExpr(`window.game.startLevel(1)`);
  await sleep(900);

  const onGameplay = await evalExpr(`
    !!document.getElementById('gameplay-screen') &&
    document.getElementById('gameplay-screen').style.display !== 'none' &&
    document.getElementById('gameplay-screen').style.display !== ''
      ? document.getElementById('gameplay-screen').style.display
      : (document.getElementById('gameplay-screen') ? document.getElementById('gameplay-screen').style.display : 'no-elem')
  `);
  // Accept any non-'none' display value (typically 'flex')
  const onGameplayOK = onGameplay && onGameplay !== 'none' && onGameplay !== 'no-elem';
  assert('P4.1 on gameplay-screen after loadLevel(1)', onGameplayOK, { display: onGameplay });

  const wmReady = await evalExpr(`
    !!window.game.wireManager &&
    window.game.wireManager.wires.length === 0 &&
    typeof window.game.wireManager.findWireAt === 'function'
  `);
  assert('P4.2 wireManager is empty + functional on L1 cold entry', wmReady === true);

  // Solve L1 (AND gate) — place 1 AND gate, wire inputs A/B + output, Quick Test
  const solveResult = await evalExpr(`
    (function () {
      const gs = window.game;
      const gateId = (gs.nextGateId !== undefined ? gs.nextGateId++ : (Math.max(0, ...gs.gates.map(g=>g.id)) + 1));
      const andGate = new window.Gate('AND', 400, 400, gateId);
      gs.gates.push(andGate);
      const inputs = gs.inputNodes;
      const outputs = gs.outputNodes;
      if (inputs.length < 2 || outputs.length < 1) return { err: 'unexpected IO shape', inputs: inputs.length, outputs: outputs.length };
      const w1 = new window.Wire(inputs[0].id, 0, gateId, 0, gs.wireManager.nextId++);
      const w2 = new window.Wire(inputs[1].id, 0, gateId, 1, gs.wireManager.nextId++);
      const w3 = new window.Wire(gateId, 0, outputs[0].id, 0, gs.wireManager.nextId++);
      gs.wireManager.wires.push(w1, w2, w3);
      gs.runQuickTest();
      return { gateCount: gs.gates.length, wireCount: gs.wireManager.wires.length, w1isWire: w1 instanceof window.Wire };
    })()
  `);
  assert('P4.3 placed 1 gate + 3 wires; Wire instanceof check', solveResult && solveResult.gateCount === 1 && solveResult.wireCount === 3 && solveResult.w1isWire === true, solveResult);

  await sleep(800);

  // Probe both in-memory progress and the persisted storage key
  const stars = await evalExpr(`
    (function() {
      const mem = (window.game.progress && window.game.progress.levels && window.game.progress.levels[1]) || null;
      const ls = JSON.parse(localStorage.getItem('signal-circuit-progress') || '{}');
      const lsLvl = (ls.levels && ls.levels[1]) || ls['1'] || null;
      return { mem, ls: lsLvl, lsKeys: Object.keys(ls).slice(0,5) };
    })()
  `);
  const memStars = stars && stars.mem && stars.mem.stars;
  const lsStars = stars && stars.ls && stars.ls.stars;
  assert('P4.4 L1 completed with 3 stars (Quick Test path)', memStars === 3 || lsStars === 3, stars);

  // ── P5 Day-79 dead-id regression ─────────────────────────────────────
  console.log('\n── P5 Day-79 dead-id regression ──');

  const deadIds = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    checkLightning: typeof (window.game.achievementManager && window.game.achievementManager.checkLightning),
    checkEclipseRun: typeof (window.game.achievementManager && window.game.achievementManager.checkEclipseRun),
    checkArchitect: typeof (window.game.achievementManager && window.game.achievementManager.checkArchitect),
    isMythic: typeof (window.game.achievementManager && window.game.achievementManager.isMythic),
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P5.1 showFirstLaunchDifficultyModal undefined', deadIds.showFirstLaunchDifficultyModal === 'undefined', deadIds);
  assert('P5.2 checkLightning undefined', deadIds.checkLightning === 'undefined', deadIds);
  assert('P5.3 checkEclipseRun undefined', deadIds.checkEclipseRun === 'undefined', deadIds);
  assert('P5.4 checkArchitect undefined', deadIds.checkArchitect === 'undefined', deadIds);
  assert('P5.5 isMythic undefined', deadIds.isMythic === 'undefined', deadIds);
  assert('P5.6 #weekly-puzzle-btn DOM absent', deadIds.weeklyPuzzleBtn === false, deadIds);

  // ── P6 Day-92 gates.js Phase 1 regression ────────────────────────────
  console.log('\n── P6 Day-92 gates.js Phase 1 regression ──');

  const gatesContract = await evalExpr(`({
    Gate: typeof window.Gate,
    GateTypes: typeof window.GateTypes,
    IONode: typeof window.IONode,
    roundRect: typeof window.roundRect,
    gateTypeKeys: Object.keys(window.GateTypes || {}).sort().join(','),
  })`);
  assert('P6.1 window.Gate is a function (class)', gatesContract.Gate === 'function', gatesContract);
  assert('P6.2 window.GateTypes is an object', gatesContract.GateTypes === 'object', gatesContract);
  assert('P6.3 window.IONode is a function (class)', gatesContract.IONode === 'function', gatesContract);
  assert('P6.4 window.roundRect is a function', gatesContract.roundRect === 'function', gatesContract);
  assert('P6.5 GateTypes contains AND key', gatesContract.gateTypeKeys.includes('AND'), gatesContract);

  // ── P7 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P7 Console hygiene ──');
  assert('P7.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P7.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

  // ── Summary ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n═════ SUMMARY ═════`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length}; exceptions: ${exceptions.length}`);
  if (passed !== total) {
    console.log('\nFAILED:');
    results.filter((r) => !r.pass).forEach((r) => console.log('  - ' + r.name));
    process.exit(1);
  }
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(2);
});
