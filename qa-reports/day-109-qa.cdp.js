#!/usr/bin/env node
/**
 * Day 109 QA harness — Cycle 5 BUILD Week, Day 3: Lab Bench III mini-chapter
 * (L46-L50) with fan-out budget.
 *
 * Day 84 + Day 94 precedents extended: `_validateLabConstraints()` gains a
 * third clause for `level.maxFanOut`; HUD chip strip gains `#lab-constraint-3`;
 * 5 new lab levels in Chapter 11 (L48 = triple-composite NAND + hardCap +
 * maxFanOut).
 *
 * Phases:
 *   P1 Build identity            — 11 ?v=1781222400 refs, sw v71 reachable,
 *                                  GameState live
 *   P2 Levels exist              — LEVELS contains L46-L50; each has
 *                                  isLabBench:true + maxFanOut; L48 has
 *                                  3-element labConstraint array
 *   P3 Chapter 11 metadata       — getChapters() returns id 11 with
 *                                  levels=[46,47,48,49,50]
 *   P4 Fan-out reject (L46)      — naive 3-wire route triggers byte-exact
 *                                  "Submission rejected: fan-out 3 exceeds
 *                                   budget of 2."
 *   P5 Triple-composite reject   — L48 with 4 NANDs + A fanned to 3 →
 *      (L48)                       rejection message contains BOTH
 *                                  "4 gates exceeds hard cap of 3" AND
 *                                  "fan-out 3 exceeds budget of 2" joined
 *                                  with "; "
 *   P6 HUD 3-chip render         — L48 shows 3 visible chips; L46 shows 1
 *   P7 Optimal L48 solve         — 2-NAND solve completes
 *   P8 Day 94 regression         — L44 7-NAND submission still rejects with
 *                                  byte-exact "7 gates exceeds hard cap of 6."
 *   P9 Cold-start invariants     — Day 78 2 nav buttons; Day 79 dead IDs;
 *                                  Day 92 window.Gate/GateTypes; Day 107
 *                                  window.Wire/WireManager; SW reachable
 *   P10 Console hygiene          — 0 console.error, 0 Runtime.exceptionThrown
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301 (--remote-allow-origins=*)
 *
 * Usage:
 *   node qa-reports/day-109-qa.cdp.js
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
  const detailStr = (detail === undefined) ? '(no detail)' : (JSON.stringify(detail) || String(detail)).slice(0, 300);
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

async function navAndWait(url) {
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
  await send('Page.navigate', { url });
  await navPromise;
  await sleep(900);
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

  await navAndWait(TARGET_URL);

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=1781222400')).length +
    Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=1781222400')).length
  `);
  assert('P1.1 11 cache-bust refs at ?v=1781222400', vCount === 11, { vCount });

  // SW v71 reachable via fetch (HARDEN Day 91 precedent works for any CDP run)
  const swText = await evalExpr(`fetch('sw.js').then(r => r.text()).then(t => t.match(/signal-circuit-v\\d+/)[0])`, true);
  assert('P1.2 sw.js declares signal-circuit-v71', swText === 'signal-circuit-v71', { swText });

  const gameLive = await evalExpr(`!!window.game && !!window.game.wireManager`);
  assert('P1.3 window.game + wireManager live', gameLive === true);

  // ── P2 Levels exist ──────────────────────────────────────────────────
  console.log('\n── P2 Levels exist ──');
  const levelsShape = await evalExpr(`
    (function() {
      const ids = [46, 47, 48, 49, 50];
      const out = {};
      for (const id of ids) {
        const lvl = (typeof getLevel === 'function') ? getLevel(id) : null;
        if (!lvl) { out[id] = null; continue; }
        out[id] = {
          isLabBench: !!lvl.isLabBench,
          maxFanOut: lvl.maxFanOut,
          hardCap: lvl.gateHardCap,
          mustInclude: lvl.mustIncludeGate,
          palette: lvl.availableGates,
          chipsKind: Array.isArray(lvl.labConstraint) ? lvl.labConstraint.length : (typeof lvl.labConstraint === 'string' ? 1 : 0),
          chips: lvl.labConstraint,
        };
      }
      return out;
    })()
  `);
  assert('P2.1 L46 exists with isLabBench + maxFanOut=2', levelsShape['46'] && levelsShape['46'].isLabBench && levelsShape['46'].maxFanOut === 2, levelsShape['46']);
  assert('P2.2 L47 has maxFanOut=2 + hardCap=3', levelsShape['47'] && levelsShape['47'].maxFanOut === 2 && levelsShape['47'].hardCap === 3, levelsShape['47']);
  assert('P2.3 L48 (triple): NAND palette + hardCap=3 + maxFanOut=2 + 3-chip array', levelsShape['48'] && levelsShape['48'].maxFanOut === 2 && levelsShape['48'].hardCap === 3 && Array.isArray(levelsShape['48'].palette) && levelsShape['48'].palette.length === 1 && levelsShape['48'].palette[0] === 'NAND' && levelsShape['48'].chipsKind === 3, levelsShape['48']);
  assert('P2.4 L49 has mustIncludeGate=[XOR] + maxFanOut=2', levelsShape['49'] && Array.isArray(levelsShape['49'].mustInclude) && levelsShape['49'].mustInclude.includes('XOR') && levelsShape['49'].maxFanOut === 2, levelsShape['49']);
  assert('P2.5 L50 has NAND palette + maxFanOut=2 + hardCap=2', levelsShape['50'] && levelsShape['50'].palette[0] === 'NAND' && levelsShape['50'].maxFanOut === 2 && levelsShape['50'].hardCap === 2, levelsShape['50']);

  // ── P3 Chapter 11 metadata ───────────────────────────────────────────
  console.log('\n── P3 Chapter 11 metadata ──');
  const chap11 = await evalExpr(`
    (function() {
      const cs = (typeof getChapters === 'function') ? getChapters() : [];
      const ch = cs.find(c => c.id === 11);
      return ch ? { title: ch.title, levels: ch.levels, isBonus: !!ch.isBonus } : null;
    })()
  `);
  assert('P3.1 Chapter 11 exists', chap11 !== null, chap11);
  assert('P3.2 Chapter 11 levels = [46,47,48,49,50]', chap11 && JSON.stringify(chap11.levels) === '[46,47,48,49,50]', chap11);
  assert('P3.3 Chapter 11 is bonus', chap11 && chap11.isBonus === true, chap11);

  // ── P4 Fan-out reject on L46 ─────────────────────────────────────────
  console.log('\n── P4 Fan-out reject (L46) ──');
  await evalExpr(`window.game.startLevel(46)`);
  await sleep(700);

  // L46: 1 input A, 3 outputs X/Y/Z. Naive: A -> X, A -> Y, A -> Z. Fan-out 3.
  const p4Reject = await evalExpr(`
    (function() {
      const gs = window.game;
      // Clear and reset lab
      gs.wireManager.wires = [];
      gs.gates = [];
      if (gs._lab) { gs._lab.attempts = 0; gs._lab.exhausted = false; }
      const A = gs.inputNodes[0];
      const X = gs.outputNodes[0];
      const Y = gs.outputNodes[1];
      const Z = gs.outputNodes[2];
      if (!A || !X || !Y || !Z) return { err: 'unexpected IO shape', inputs: gs.inputNodes.length, outputs: gs.outputNodes.length };
      const w1 = new window.Wire(A.id, 0, X.id, 0, gs.wireManager.nextId++);
      const w2 = new window.Wire(A.id, 0, Y.id, 0, gs.wireManager.nextId++);
      const w3 = new window.Wire(A.id, 0, Z.id, 0, gs.wireManager.nextId++);
      gs.wireManager.wires.push(w1, w2, w3);
      const cv = gs._validateLabConstraints();
      return { ok: cv.ok, msg: cv.message, wires: gs.wireManager.wires.length };
    })()
  `);
  assert('P4.1 L46 IO probe + 3 wires set up', p4Reject && p4Reject.wires === 3, p4Reject);
  assert('P4.2 validator returns ok=false', p4Reject && p4Reject.ok === false, p4Reject);
  assert('P4.3 byte-exact rejection: "Submission rejected: fan-out 3 exceeds budget of 2."', p4Reject && p4Reject.msg === 'Submission rejected: fan-out 3 exceeds budget of 2.', p4Reject);

  // Verify L46 optimal solve passes (2 NOTs + buffer chain).
  const p4Pass = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.wireManager.wires = [];
      gs.gates = [];
      if (gs._lab) { gs._lab.attempts = 0; gs._lab.exhausted = false; }
      const A = gs.inputNodes[0];
      const X = gs.outputNodes[0], Y = gs.outputNodes[1], Z = gs.outputNodes[2];
      const id1 = gs.nextId !== undefined ? gs.nextId++ : 1000;
      const id2 = gs.nextId !== undefined ? gs.nextId++ : 1001;
      const G1 = new window.Gate('NOT', 300, 200, id1);
      const G2 = new window.Gate('NOT', 450, 200, id2);
      gs.gates.push(G1, G2);
      // A -> X (1 wire), A -> G1 (2nd wire), G1 -> G2, G2 -> Y, G2 -> Z.
      const ws = gs.wireManager;
      ws.wires.push(new window.Wire(A.id, 0, X.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(A.id, 0, id1, 0, ws.nextId++));
      ws.wires.push(new window.Wire(id1, 0, id2, 0, ws.nextId++));
      ws.wires.push(new window.Wire(id2, 0, Y.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(id2, 0, Z.id, 0, ws.nextId++));
      const cv = gs._validateLabConstraints();
      return { ok: cv.ok, msg: cv.message, gates: gs.gates.length, wires: ws.wires.length };
    })()
  `);
  assert('P4.4 L46 optimal solve (2 NOT buffers) passes validator', p4Pass && p4Pass.ok === true, p4Pass);

  // ── P5 Triple-composite reject (L48) ─────────────────────────────────
  console.log('\n── P5 Triple-composite reject (L48) ──');
  await evalExpr(`window.game.startLevel(48)`);
  await sleep(700);

  // L48: NAND-only + hardCap=3 + maxFanOut=2. Place 4 NANDs with A fanned to 3 of them.
  const p5Reject = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.wireManager.wires = [];
      gs.gates = [];
      if (gs._lab) { gs._lab.attempts = 0; gs._lab.exhausted = false; }
      const A = gs.inputNodes[0], B = gs.inputNodes[1];
      const OUT = gs.outputNodes[0];
      if (!A || !B || !OUT) return { err: 'L48 IO shape' };
      // 4 NAND gates (exceeds hardCap=3)
      const G1 = new window.Gate('NAND', 300, 150, gs.nextId++);
      const G2 = new window.Gate('NAND', 300, 220, gs.nextId++);
      const G3 = new window.Gate('NAND', 300, 290, gs.nextId++);
      const G4 = new window.Gate('NAND', 450, 200, gs.nextId++);
      gs.gates.push(G1, G2, G3, G4);
      const ws = gs.wireManager;
      // A fans out to G1, G2, G3 (fan-out 3, exceeds maxFanOut=2)
      ws.wires.push(new window.Wire(A.id, 0, G1.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(A.id, 0, G2.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(A.id, 0, G3.id, 0, ws.nextId++));
      // B feeds one
      ws.wires.push(new window.Wire(B.id, 0, G1.id, 1, ws.nextId++));
      // G1 -> G4, G2 -> G4 (pad)
      ws.wires.push(new window.Wire(G1.id, 0, G4.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(G2.id, 0, G4.id, 1, ws.nextId++));
      ws.wires.push(new window.Wire(G4.id, 0, OUT.id, 0, ws.nextId++));
      const cv = gs._validateLabConstraints();
      return { ok: cv.ok, msg: cv.message, gates: gs.gates.length };
    })()
  `);
  assert('P5.1 L48 reject with 4 NAND + fan-out 3', p5Reject && p5Reject.ok === false, p5Reject);
  assert('P5.2 message contains "4 gates exceeds hard cap of 3"', p5Reject && p5Reject.msg && p5Reject.msg.includes('4 gates exceeds hard cap of 3'), p5Reject);
  assert('P5.3 message contains "fan-out 3 exceeds budget of 2"', p5Reject && p5Reject.msg && p5Reject.msg.includes('fan-out 3 exceeds budget of 2'), p5Reject);
  assert('P5.4 single message string joined with "; " (Day 94 composite format)', p5Reject && p5Reject.msg && /Submission rejected: [^.]+; [^.]+\./.test(p5Reject.msg), p5Reject);
  assert('P5.5 byte-exact composite message', p5Reject && p5Reject.msg === 'Submission rejected: 4 gates exceeds hard cap of 3; fan-out 3 exceeds budget of 2.', p5Reject);

  // ── P6 HUD 3-chip render ─────────────────────────────────────────────
  console.log('\n── P6 HUD 3-chip render ──');
  // We're still on L48. updateLabHud should already have rendered.
  await evalExpr(`window.game.ui.updateLabHud()`);
  await sleep(120);
  const p6Chips = await evalExpr(`
    (function() {
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      const c3 = document.getElementById('lab-constraint-3');
      function vis(el) { return el ? (el.style.display !== 'none' && el.textContent.length > 0) : false; }
      return {
        exists3: !!c3,
        c1_visible: vis(c1), c1_text: c1 ? c1.textContent : null,
        c2_visible: vis(c2), c2_text: c2 ? c2.textContent : null,
        c3_visible: vis(c3), c3_text: c3 ? c3.textContent : null,
      };
    })()
  `);
  assert('P6.1 #lab-constraint-3 element exists in DOM', p6Chips.exists3 === true);
  assert('P6.2 L48: chip 1 visible & non-empty', p6Chips.c1_visible === true, p6Chips);
  assert('P6.3 L48: chip 2 visible & non-empty', p6Chips.c2_visible === true, p6Chips);
  assert('P6.4 L48: chip 3 visible & non-empty (triple-composite render)', p6Chips.c3_visible === true, p6Chips);
  assert('P6.5 L48: chip texts match labConstraint array', p6Chips.c1_text && p6Chips.c1_text.includes('NAND') && p6Chips.c2_text && p6Chips.c2_text.includes('Hard cap') && p6Chips.c3_text && p6Chips.c3_text.includes('Fan-out'), p6Chips);

  // L46 (single-string labConstraint) should hide chips 2 & 3
  await evalExpr(`window.game.startLevel(46)`);
  await sleep(600);
  const p6Single = await evalExpr(`
    (function() {
      const c1 = document.getElementById('lab-constraint');
      const c2 = document.getElementById('lab-constraint-2');
      const c3 = document.getElementById('lab-constraint-3');
      return {
        c1_visible: c1 && c1.style.display !== 'none' && c1.textContent.length > 0,
        c2_hidden: c2 && c2.style.display === 'none',
        c3_hidden: c3 && c3.style.display === 'none',
        c1_text: c1 ? c1.textContent : null,
      };
    })()
  `);
  assert('P6.6 L46 single-chip render: chip 1 visible', p6Single.c1_visible === true, p6Single);
  assert('P6.7 L46 single-chip render: chip 2 hidden', p6Single.c2_hidden === true, p6Single);
  assert('P6.8 L46 single-chip render: chip 3 hidden', p6Single.c3_hidden === true, p6Single);

  // ── P7 Optimal L48 solve passes ──────────────────────────────────────
  console.log('\n── P7 Optimal L48 solve ──');
  await evalExpr(`window.game.startLevel(48)`);
  await sleep(700);
  const p7 = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.wireManager.wires = [];
      gs.gates = [];
      if (gs._lab) { gs._lab.attempts = 0; gs._lab.exhausted = false; }
      const A = gs.inputNodes[0], B = gs.inputNodes[1];
      const OUT = gs.outputNodes[0];
      // 2-NAND solve: G1 = NAND(A,B); G2 = NAND(G1, G1) -> OUT.
      const G1 = new window.Gate('NAND', 300, 200, gs.nextId++);
      const G2 = new window.Gate('NAND', 450, 200, gs.nextId++);
      gs.gates.push(G1, G2);
      const ws = gs.wireManager;
      ws.wires.push(new window.Wire(A.id, 0, G1.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(B.id, 0, G1.id, 1, ws.nextId++));
      ws.wires.push(new window.Wire(G1.id, 0, G2.id, 0, ws.nextId++));
      ws.wires.push(new window.Wire(G1.id, 0, G2.id, 1, ws.nextId++));
      ws.wires.push(new window.Wire(G2.id, 0, OUT.id, 0, ws.nextId++));
      const cv = gs._validateLabConstraints();
      return { ok: cv.ok, msg: cv.message, gates: gs.gates.length, wires: ws.wires.length };
    })()
  `);
  assert('P7.1 L48 optimal 2-NAND solve: validator ok=true', p7 && p7.ok === true, p7);
  assert('P7.2 L48 optimal solve uses exactly 2 gates', p7 && p7.gates === 2, p7);

  // Run quick test to actually solve and complete
  await evalExpr(`window.game.runQuickTest()`);
  await sleep(900);
  const p7Stars = await evalExpr(`
    (function() {
      const ls = JSON.parse(localStorage.getItem('signal-circuit-progress') || '{}');
      const mem = (window.game.progress && window.game.progress.levels && window.game.progress.levels[48]) || null;
      const lsLvl = (ls.levels && ls.levels[48]) || ls['48'] || null;
      return { mem, ls: lsLvl };
    })()
  `);
  const p7memStars = p7Stars && p7Stars.mem && p7Stars.mem.stars;
  const p7lsStars = p7Stars && p7Stars.ls && p7Stars.ls.stars;
  assert('P7.3 L48 completes via Quick Test (stars persisted)', (p7memStars && p7memStars >= 1) || (p7lsStars && p7lsStars >= 1), p7Stars);

  // ── P8 Day 94 regression (L44 hardCap still byte-exact) ──────────────
  console.log('\n── P8 Day 94 regression (L44 hardCap) ──');
  await evalExpr(`window.game.startLevel(44)`);
  await sleep(600);
  const p8 = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.wireManager.wires = [];
      gs.gates = [];
      if (gs._lab) { gs._lab.attempts = 0; gs._lab.exhausted = false; }
      // 7 NAND gates, no wires (just count violation)
      for (let i = 0; i < 7; i++) {
        gs.gates.push(new window.Gate('NAND', 300 + i*10, 200, gs.nextId++));
      }
      const cv = gs._validateLabConstraints();
      return { ok: cv.ok, msg: cv.message, gates: gs.gates.length };
    })()
  `);
  assert('P8.1 L44 with 7 NAND gates rejects', p8 && p8.ok === false, p8);
  assert('P8.2 L44 byte-exact "Submission rejected: 7 gates exceeds hard cap of 6." (Day 94 preserved)', p8 && p8.msg === 'Submission rejected: 7 gates exceeds hard cap of 6.', p8);

  // ── P9 Cold-start invariants ─────────────────────────────────────────
  console.log('\n── P9 Cold-start invariants ──');
  await evalExpr(`localStorage.clear()`);
  await navAndWait(TARGET_URL + '_cold');

  const coldNavBtns = await evalExpr(`
    Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => {
      const r = b.getBoundingClientRect();
      return !b.classList.contains('level-btn') &&
             !b.classList.contains('level-overflow-btn') &&
             !b.closest('.level-overflow-popover') &&
             b.offsetParent !== null && r.width > 0 && r.height > 0;
    }).length
  `);
  assert('P9.1 cold-start non-level button count = 2 (Day 78 invariant)', coldNavBtns === 2, { coldNavBtns });

  const cardCount = await evalExpr(`
    document.querySelectorAll('#level-select-screen .level-btn').length
  `);
  // Day 103 set cold-start cards to 45 (mastery gated to modal). Day 109 adds
  // 5 bonus-chapter levels to LEVELS array. Bonus chapters render with the
  // rest of the campaign cards by default. Expected: 50 cards cold.
  assert('P9.2 50 level cards visible cold (45 + 5 new bonus L46-L50)', cardCount === 50, { cardCount });

  const difficultyDefault = await evalExpr(`localStorage.getItem('signal-circuit-difficulty-mode')`);
  assert('P9.3 silent-default difficulty = standard (Day 78 #5)', difficultyDefault === 'standard', { difficultyDefault });

  const deadIds = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    checkLightning: typeof (window.game && window.game.achievementManager && window.game.achievementManager.checkLightning),
    isMythic: typeof (window.game && window.game.achievementManager && window.game.achievementManager.isMythic),
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P9.4 Day 79 dead-IDs still undefined', deadIds.showFirstLaunchDifficultyModal === 'undefined' && deadIds.checkLightning === 'undefined' && deadIds.isMythic === 'undefined' && deadIds.weeklyPuzzleBtn === false, deadIds);

  const gatesContract = await evalExpr(`({
    Gate: typeof window.Gate,
    GateTypes: typeof window.GateTypes,
    Wire: typeof window.Wire,
    WireManager: typeof window.WireManager,
    gateAndKey: !!(window.GateTypes && window.GateTypes.AND),
  })`);
  assert('P9.5 Day 92 window.Gate / window.GateTypes still bound', gatesContract.Gate === 'function' && gatesContract.GateTypes === 'object' && gatesContract.gateAndKey === true, gatesContract);
  assert('P9.6 Day 107 window.Wire / window.WireManager still bound', gatesContract.Wire === 'function' && gatesContract.WireManager === 'function', gatesContract);

  const swText2 = await evalExpr(`fetch('sw.js').then(r => r.text()).then(t => t.match(/signal-circuit-v\\d+/)[0])`, true);
  assert('P9.7 SW v71 still reachable after cold reload', swText2 === 'signal-circuit-v71', { swText2 });

  // ── P10 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P10 Console hygiene ──');
  assert('P10.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P10.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

  // ── Summary ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n═════ SUMMARY ═════`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length}; exceptions: ${exceptions.length}`);
  if (passed !== total) {
    console.log('\nFAILED:');
    results.filter((r) => !r.pass).forEach((r) => console.log('  - ' + r.name + (r.detail !== undefined ? ' :: ' + (JSON.stringify(r.detail) || '').slice(0, 200) : '')));
    process.exit(1);
  }
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(2);
});
