#!/usr/bin/env node
/**
 * Day 98 QA harness — Cycle 4 HARDEN Week Day 2: Level Playthrough.
 *
 * Build under test: Day 96 (Snapshot Cards Library Tab) — same as Day 97.
 * Expected build identity: ?v=1780617600 / sw v65 / 45 level cards.
 *
 * Coverage:
 *   - Campaign sweep: L1, L5, L10, L15, L20, L25, L30, L35, L40
 *   - Lab Bench (Day 84): L41 (NAND-only), L42 (cap=4), L43 (mustInclude XOR)
 *   - Lab Bench II composite (Day 94): L44 (NAND+cap6), L45 (XOR+cap5)
 *   - Per level: truth table re-derived from semantics, hints array length=3,
 *     calculateStars at 3/2/1 thresholds, completion celebration DOM probe
 *   - Hands-on L1 solve via Quick Test (attempts increments, celebration fires)
 *   - Daily / Random / Blitz / Speedrun mode entry + HUD cleanup on Back
 *   - 4 community levels loaded via buildCustomLevel + playCommunityLevel
 *   - Composite validator on L44/L45 (NAND+cap6 + XOR+cap5)
 *   - Cycle 4 BUILD regression sweep (D92/D93/D94/D95/D96)
 *   - Console hygiene (Runtime.exceptionThrown + console.error counts)
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-98-qa.cdp.js
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
  console.log(`${tag} ${label}` + (detail ? ` :: ${String(detail).slice(0, 260)}` : ''));
}

function note(label, detail) {
  console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 260)}` : ''));
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch (e) { reject(e); }
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

async function evalExpr(ws, expr, { returnByValue = true, awaitPromise = false } = {}) {
  const r = await send(ws, 'Runtime.evaluate', {
    expression: expr,
    returnByValue,
    awaitPromise,
    allowUnsafeEvalBlockedByCSP: true,
  });
  if (r.exceptionDetails) {
    const text = r.exceptionDetails.exception?.description || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails);
    throw new Error('eval threw: ' + text);
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

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function navigateAndWait(ws, url) {
  await send(ws, 'Page.navigate', { url });
  await sleep(1500);
  await waitFor(ws, `() => !!document.body`, { label: 'body present' });
}

// ── Truth table re-derivation specs ──
// Each spec is a pure JS function string that takes a row's inputs (array) and
// returns the expected outputs (array). The harness compares the derived table
// to the level's actual truthTable row-by-row.
const SPECS = {
  1:  `(a,b) => [a & b]`,                                                       // AND
  5:  `(a,b) => [1 - (a | b)]`,                                                  // NOR
  10: `(a,b) => [a | b]`,                                                        // OR (from AND+NOT)
  15: `(a,b,c) => [((a&b)|(b&c)|(a&c)) & 1]`,                                    // Majority 3
  20: `(a,b,s) => [s ? b : a]`,                                                  // 2:1 MUX (A,B,S)
  25: `(a1,a0,b1,b0) => {                                                        // 2-bit ripple adder
         const v = (a1*2 + a0) + (b1*2 + b0);
         const cout = (v >> 2) & 1, s1 = (v >> 1) & 1, s0 = v & 1;
         return [cout, s1, s0];
       }`,
  30: `(d,s1,s0) => {                                                            // 1:4 demux
         const sel = (s1<<1)|s0;
         return [d && sel===0 ? 1:0, d && sel===1 ? 1:0, d && sel===2 ? 1:0, d && sel===3 ? 1:0];
       }`,
  35: `(a,b) => [a ^ b]`,                                                        // Dark Gate = XOR
  40: `(a,b) => [a & b]`,                                                        // L40 final truth table (1 output of AND)
  41: `(a,b) => [a & b]`,                                                        // AND from NAND
  42: `(s,a,b) => [s ? b : a]`,                                                  // 2:1 MUX (S,A,B)
  43: `(a,b,c) => [a ^ b ^ c]`,                                                  // Odd parity
  44: `(a,b) => [a ^ b, a & b]`,                                                 // Half adder (SUM, CARRY)
  45: `(s,a,b) => [s ? b : a]`,                                                  // 2:1 MUX (S,A,B), XOR-based
};

async function main() {
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) target = await fetchJson('/json/new?about:blank');
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
      const text = args.map((a) => (a.value !== undefined ? String(a.value) : (a.description || ''))).join(' ');
      consoleAll.push(`[${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') consoleErrors.push(text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      const text = (ed && (ed.exception?.description || ed.text)) || JSON.stringify(ed);
      consoleErrors.push('uncaught: ' + text);
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');
  await send(ws, 'Network.setCacheDisabled', { cacheDisabled: true });
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'http://localhost:8901', storageTypes: 'all' }); } catch {}

  // ───────── PHASE 1: Build identity ─────────
  console.log('\n=== Phase 1: Build identity ===');
  await navigateAndWait(ws, TARGET_URL);
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);

  const html = await evalExpr(ws, `fetch('/index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  const cb1 = (html.match(/\?v=1780617600/g) || []).length;
  rec('11 cache-bust refs at ?v=1780617600 (Day 96 build, pinned)', cb1 === 11, `found=${cb1}`);
  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('sw.js CACHE_NAME = signal-circuit-v65 (pinned)', /CACHE_NAME\s*=\s*'signal-circuit-v65'/.test(swText));
  rec('gates.js loads as ES module (Day 92)', /<script\s+type=["\']module["\']\s+src=["\']js\/gates\.js/.test(html));

  // ───────── PHASE 2: Cold-start sanity ─────────
  console.log('\n=== Phase 2: Cold-start sanity ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready' });
  await sleep(500);
  const cold = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const nonLevel = visible.filter(b =>
      !b.classList.contains('level-overflow-btn') &&
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') &&
      !(b.dataset && b.dataset.levelId) &&
      !b.closest('.level-overflow-btn, .level-card, [data-level-id]'));
    return {
      visible: getComputedStyle(s).display !== 'none',
      nonLevel: nonLevel.length,
      levelCards: s.querySelectorAll('.level-btn').length,
    };
  })()`);
  rec('cold-start level-select visible', cold && cold.visible, JSON.stringify(cold));
  rec('cold-start non-level button count === 2 (Day 78 invariant)', cold && cold.nonLevel === 2, `count=${cold && cold.nonLevel}`);
  rec('cold-start shows 45 level cards (Day 94 +L44/L45)', cold && cold.levelCards === 45, `cards=${cold && cold.levelCards}`);

  // ───────── PHASE 3..: per-level audit ─────────
  // For each sampled level, verify:
  //   3.1 hints array length === 3
  //   3.2 truth table re-derives correctly from semantics
  //   3.3 calculateStars returns 3 at optimal, 2 at goodGates, 1 above goodGates
  //   3.4 lab metadata (when applicable) — isLabBench, constraints
  const SAMPLE = [1, 5, 10, 15, 20, 25, 30, 35, 40, 41, 42, 43, 44, 45];
  let phaseIdx = 3;
  for (const id of SAMPLE) {
    console.log(`\n=== Phase ${phaseIdx}: L${id} audit ===`);
    phaseIdx++;
    const lvl = await evalExpr(ws, `(function(){
      const L = (typeof LEVELS !== 'undefined') ? LEVELS.find(l=>l.id===${id}) : null;
      if (!L) return {missing:true};
      return {
        id: L.id,
        title: L.title,
        hintsLen: Array.isArray(L.hints) ? L.hints.length : -1,
        tableLen: Array.isArray(L.truthTable) ? L.truthTable.length : -1,
        table: L.truthTable,
        optimalGates: L.optimalGates,
        goodGates: L.goodGates,
        isLabBench: !!L.isLabBench,
        labConstraint: L.labConstraint || null,
        gateHardCap: L.gateHardCap || null,
        mustIncludeGate: L.mustIncludeGate || null,
        availableGates: L.availableGates || null,
        isMultiPhase: !!L.isMultiPhase,
      };
    })()`);
    if (!lvl || lvl.missing) { rec(`L${id} present in LEVELS`, false, 'missing'); continue; }
    rec(`L${id} hints array length === 3`, lvl.hintsLen === 3, `len=${lvl.hintsLen}`);

    // Re-derive truth table
    const spec = SPECS[id];
    if (spec) {
      const derived = await evalExpr(ws, `(function(){
        const L = LEVELS.find(l=>l.id===${id});
        const fn = ${spec};
        const rows = L.truthTable.map(r => {
          const exp = fn.apply(null, r.inputs);
          const a = JSON.stringify(exp);
          const b = JSON.stringify(r.outputs);
          return { inputs: r.inputs, expected: exp, actual: r.outputs, match: a === b };
        });
        return { all: rows.every(r => r.match), mismatches: rows.filter(r => !r.match).slice(0,4) };
      })()`);
      rec(`L${id} truth table re-derives from semantics`, derived && derived.all, derived && derived.mismatches.length ? JSON.stringify(derived.mismatches) : `ok (${lvl.tableLen} rows)`);
    }

    // calculateStars: 3 at optimal, 2 at goodGates, 1 above goodGates
    const stars = await evalExpr(ws, `(function(){
      const g = window.game;
      const L = LEVELS.find(l=>l.id===${id});
      const opt = L.optimalGates;
      const good = L.goodGates;
      // For levels where opt===good (e.g. L1: 1/1, L41 optimalGates===2 goodGates===4 — distinct, but L1 1/1)
      // calculateStars: <=optimal => 3, <=good => 2, else 1
      return {
        atOpt: g.calculateStars(opt, L),
        atGood: g.calculateStars(good, L),
        atOver: g.calculateStars(good + 5, L),
      };
    })()`);
    rec(`L${id} stars: 3 at optimal (${lvl.optimalGates})`, stars && stars.atOpt === 3, JSON.stringify(stars));
    // When optimal === good, atGood is also 3 — but atOver should still be 1
    rec(`L${id} stars: ≤2 at goodGates (${lvl.goodGates})`, stars && stars.atGood <= (lvl.optimalGates === lvl.goodGates ? 3 : 2) && stars.atGood >= 2, JSON.stringify(stars));
    rec(`L${id} stars: 1 above goodGates`, stars && stars.atOver === 1, JSON.stringify(stars));

    // Lab metadata
    if (id >= 36 && id <= 45) {
      rec(`L${id} isLabBench === true`, lvl.isLabBench === true, JSON.stringify({lab:lvl.isLabBench}));
    }
  }

  // ───────── PHASE: Lab Bench HUD chip render for L41-L45 ─────────
  console.log('\n=== Phase: Lab Bench HUD chip render (L41-L45) ===');
  // Need to actually navigate into the level so #lab-constraint becomes visible
  // (Day 88 lesson: use startLevel not loadLevel for screen transition)
  for (const id of [41, 42, 43, 44, 45]) {
    const chipState = await evalExpr(ws, `(function(){
      window.game.startLevel(${id});
      const chip = document.querySelector('#lab-constraint');
      const chip2 = document.querySelector('#lab-constraint-2');
      return {
        chipVisible: !!chip && getComputedStyle(chip).display !== 'none',
        chipText: chip ? (chip.textContent || '').trim() : '',
        chip2Visible: !!chip2 && getComputedStyle(chip2).display !== 'none',
        chip2Text: chip2 ? (chip2.textContent || '').trim() : '',
      };
    })()`);
    await sleep(150);
    if (id <= 43) {
      // Single constraint
      rec(`L${id} HUD chip visible (single)`, chipState && chipState.chipVisible && chipState.chipText.length > 0, JSON.stringify(chipState));
      rec(`L${id} HUD chip2 hidden (single, not composite)`, chipState && !chipState.chip2Visible, JSON.stringify(chipState));
    } else {
      // Composite (L44, L45)
      rec(`L${id} HUD chip visible (composite c1)`, chipState && chipState.chipVisible && chipState.chipText.length > 0, JSON.stringify(chipState));
      rec(`L${id} HUD chip2 visible (composite c2)`, chipState && chipState.chip2Visible && chipState.chip2Text.length > 0, JSON.stringify(chipState));
    }
  }

  // ───────── PHASE: _validateLabConstraints behavior ─────────
  console.log('\n=== Phase: _validateLabConstraints() ===');
  // L41 NAND-only: enforcement is at the TOOLBOX level (availableGates hides non-NAND buttons),
  // NOT at _validateLabConstraints (which only checks gateHardCap + mustIncludeGate).
  // Verify the toolbox-level restriction instead.
  const v41 = await evalExpr(ws, `(function(){
    window.game.startLevel(41);
    return {
      availableGates: window.game.currentLevel.availableGates,
      isOnlyNAND: Array.isArray(window.game.currentLevel.availableGates) && window.game.currentLevel.availableGates.length === 1 && window.game.currentLevel.availableGates[0] === 'NAND',
    };
  })()`);
  rec('L41 NAND-only enforced via availableGates (toolbox-level)', v41 && v41.isOnlyNAND, JSON.stringify(v41));

  // L42: gateHardCap === 4 — 5 gates must reject
  const v42 = await evalExpr(ws, `(function(){
    window.game.startLevel(42);
    const saved = window.game.gates.slice();
    window.game.gates = [{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'OR',_locked:false},{type:'NOT',_locked:false},{type:'OR',_locked:false}];
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L42 rejects 5 gates (hard cap 4)', v42 && v42.ok === false && /hard cap of 4/.test(v42.msg), JSON.stringify(v42));

  // L43: mustIncludeGate XOR — circuit without XOR must reject
  const v43 = await evalExpr(ws, `(function(){
    window.game.startLevel(43);
    const saved = window.game.gates.slice();
    window.game.gates = [{type:'AND',_locked:false},{type:'OR',_locked:false}];
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L43 rejects missing XOR (mustIncludeGate)', v43 && v43.ok === false && /XOR/.test(v43.msg), JSON.stringify(v43));

  // L44: composite — NAND-only + cap 6. Use 7 NANDs (over cap) AND 7 ANDs (wrong type + over cap)
  const v44a = await evalExpr(ws, `(function(){
    window.game.startLevel(44);
    const saved = window.game.gates.slice();
    window.game.gates = Array.from({length:7}, () => ({type:'NAND',_locked:false}));
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L44 composite rejects 7 NANDs (hard cap 6)', v44a && v44a.ok === false && /hard cap of 6/.test(v44a.msg), JSON.stringify(v44a));

  // L44 composite: 7 ANDs over-cap test — validator only surfaces the cap violation;
  // NAND-only is toolbox-enforced (same as L41). Confirm cap violation fires.
  const v44b = await evalExpr(ws, `(function(){
    window.game.startLevel(44);
    const saved = window.game.gates.slice();
    window.game.gates = Array.from({length:7}, () => ({type:'AND',_locked:false}));
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L44 composite rejects 7 ANDs (cap violation; NAND-only is toolbox-level)',
      v44b && v44b.ok === false && /hard cap of 6/.test(v44b.msg), JSON.stringify(v44b));

  // L44 with 5 NANDs (optimal) should ACCEPT
  const v44c = await evalExpr(ws, `(function(){
    window.game.startLevel(44);
    const saved = window.game.gates.slice();
    window.game.gates = Array.from({length:5}, () => ({type:'NAND',_locked:false}));
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L44 composite accepts 5 NANDs (optimal)', v44c && v44c.ok === true, JSON.stringify(v44c));

  // L45: composite — must include XOR + cap 5. Use 6 gates with XOR (over cap) AND 4 gates without XOR (no XOR)
  const v45a = await evalExpr(ws, `(function(){
    window.game.startLevel(45);
    const saved = window.game.gates.slice();
    window.game.gates = [{type:'XOR',_locked:false},{type:'XOR',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'OR',_locked:false},{type:'NOT',_locked:false}];
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L45 composite rejects 6 gates with XOR (hard cap 5)', v45a && v45a.ok === false && /hard cap of 5/.test(v45a.msg), JSON.stringify(v45a));

  const v45b = await evalExpr(ws, `(function(){
    window.game.startLevel(45);
    const saved = window.game.gates.slice();
    window.game.gates = [{type:'AND',_locked:false},{type:'OR',_locked:false},{type:'NOT',_locked:false}];
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L45 composite rejects no-XOR (mustIncludeGate)', v45b && v45b.ok === false && /XOR/.test(v45b.msg), JSON.stringify(v45b));

  const v45c = await evalExpr(ws, `(function(){
    window.game.startLevel(45);
    const saved = window.game.gates.slice();
    window.game.gates = [{type:'XOR',_locked:false},{type:'AND',_locked:false},{type:'XOR',_locked:false}];
    const v = window.game._validateLabConstraints();
    window.game.gates = saved;
    return { ok: v.ok, msg: v.message || '' };
  })()`);
  rec('L45 composite accepts 3 gates with XOR (optimal shape)', v45c && v45c.ok === true, JSON.stringify(v45c));

  // ───────── PHASE: Hands-on L1 solve + completion ─────────
  console.log('\n=== Phase: Hands-on L1 solve + completion celebration ===');
  // Reset state and ensure we're on cold L1
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(200);
  const solveL1 = await evalExpr(ws, `(async function(){
    const g = window.game;
    g.startLevel(1);
    await new Promise(r=>setTimeout(r,300));
    const attemptsBefore = g.attempts || 0;
    g.gates = []; g.wireManager.wires = [];
    const inp = g.inputNodes, out = g.outputNodes;
    const a = g.addGate('AND', 400, 300);
    g.addWireFromData(inp[0].id, 0, a.id, 0);
    g.addWireFromData(inp[1].id, 0, a.id, 1);
    g.addWireFromData(a.id, 0, out[0].id, 0);
    g.runQuickTest();
    await new Promise(r=>setTimeout(r,1200));
    const attemptsAfter = g.attempts || 0;
    return {
      gates: g.gates.length,
      wires: g.wireManager.wires.length,
      attemptsBefore, attemptsAfter,
      attemptsDelta: attemptsAfter - attemptsBefore,
      starDisplayVisible: (function(){
        const sd = document.querySelector('#star-display');
        return !!sd && getComputedStyle(sd).display !== 'none';
      })(),
      starsEarned: (function(){
        const p = g.progress.levels[1];
        return p && p.stars;
      })(),
    };
  })()`, { awaitPromise: true });
  rec('L1 solved with 1 AND gate', solveL1 && solveL1.gates === 1, JSON.stringify(solveL1));
  // Note: Quick Test does NOT bump game.attempts (RUN does; attempts live on progress.levels[id].attempts).
  // Stars-earned + star-display visibility prove completion fired.
  rec('L1 completion celebration (#star-display) visible after solve', solveL1 && solveL1.starDisplayVisible, JSON.stringify(solveL1));
  rec('L1 earns 3 stars at optimal (1 gate) — completion path fired', solveL1 && solveL1.starsEarned === 3, JSON.stringify(solveL1));

  // Close completion overlay & return
  await evalExpr(ws, `(function(){
    const sd = document.querySelector('#star-display');
    if (sd) sd.style.display='none';
    const nx = document.querySelector('#next-btn, #completion-menu-btn');
    if (nx) try{nx.click();}catch(e){}
  })(); 'ok'`);
  await sleep(300);
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(300);

  // Seed tier3 for gated buttons
  await evalExpr(ws, `window.game.seedProgress(18); 'ok'`);
  await sleep(500);

  // ───────── PHASE: Daily Challenge mode ─────────
  console.log('\n=== Phase: Daily Challenge ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#daily-challenge-btn, #daily-btn'); if(b) b.click();})()`);
  await sleep(500);
  const dailyPre = await evalExpr(ws, `(function(){
    const s = document.querySelector('#daily-config-screen, #daily-pre-screen');
    return { visible: s ? getComputedStyle(s).display !== 'none' : false };
  })()`);
  rec('Daily Challenge pre-screen opens', dailyPre && dailyPre.visible, JSON.stringify(dailyPre));
  await evalExpr(ws, `(function(){const b=document.querySelector('#start-daily-btn'); if(b) b.click();})()`);
  await sleep(800);
  const dailyGameplay = await evalExpr(ws, `(function(){
    const gp = document.querySelector('#gameplay-screen');
    const lvl = window.game.currentLevel;
    return {
      visible: gp && getComputedStyle(gp).display !== 'none',
      isDaily: !!(lvl && lvl.isDaily),
    };
  })()`);
  rec('Daily Challenge enters gameplay (currentLevel.isDaily)', dailyGameplay && dailyGameplay.visible && dailyGameplay.isDaily, JSON.stringify(dailyGameplay));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(400);

  // ───────── PHASE: Random Challenge ─────────
  console.log('\n=== Phase: Random Challenge ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#random-challenge-btn, #challenge-btn'); if(b) b.click();})()`);
  await sleep(500);
  const randPre = await evalExpr(ws, `(function(){
    const s = document.querySelector('#challenge-config-screen');
    return { visible: s ? getComputedStyle(s).display !== 'none' : false };
  })()`);
  rec('Random Challenge config screen opens', randPre && randPre.visible, JSON.stringify(randPre));
  await evalExpr(ws, `(function(){const b=document.querySelector('#generate-challenge-btn'); if(b) b.click();})()`);
  await sleep(800);
  const randGameplay = await evalExpr(ws, `(function(){
    return {
      visible: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      isChallenge: window.game.isChallengeMode,
    };
  })()`);
  rec('Random Challenge enters gameplay (isChallengeMode=true)', randGameplay && randGameplay.visible && randGameplay.isChallenge, JSON.stringify(randGameplay));
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); window.game.isChallengeMode=false; 'ok'`);
  await sleep(300);

  // ───────── PHASE: Blitz Mode + HUD cleanup (Day 61 regression) ─────────
  console.log('\n=== Phase: Blitz Mode + HUD cleanup ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#blitz-mode-btn'); if(b) b.click();})()`);
  await sleep(800);
  const blitz = await evalExpr(ws, `(function(){
    return {
      gpVis: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      mode: window.game.blitzMode,
      hudVis: (function(){const h=document.querySelector('#blitz-hud'); return h && getComputedStyle(h).display !== 'none';})(),
    };
  })()`);
  rec('Blitz Mode enters gameplay with HUD visible', blitz && blitz.gpVis && blitz.mode && blitz.hudVis, JSON.stringify(blitz));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const blitzClean = await evalExpr(ws, `(function(){
    return {
      mode: window.game.blitzMode,
      hudDisplay: (function(){const h=document.querySelector('#blitz-hud'); return h ? getComputedStyle(h).display : 'no-hud';})(),
    };
  })()`);
  rec('Day 61 regression: back-btn cleans Blitz HUD + mode flag', blitzClean && blitzClean.mode === false && blitzClean.hudDisplay === 'none', JSON.stringify(blitzClean));

  // ───────── PHASE: Speedrun Mode + HUD cleanup (Day 74 regression) ─────────
  console.log('\n=== Phase: Speedrun Mode + HUD cleanup ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#speedrun-btn'); if(b) b.click();})()`);
  await sleep(800);
  const spd = await evalExpr(ws, `(function(){
    return {
      gpVis: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      mode: window.game.speedrunMode,
      hudVis: (function(){const h=document.querySelector('#speedrun-hud'); return h && getComputedStyle(h).display !== 'none';})(),
    };
  })()`);
  rec('Speedrun Mode enters gameplay with HUD visible', spd && spd.gpVis && spd.mode && spd.hudVis, JSON.stringify(spd));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const spdClean = await evalExpr(ws, `(function(){
    return {
      mode: window.game.speedrunMode,
      hudDisplay: (function(){const h=document.querySelector('#speedrun-hud'); return h ? getComputedStyle(h).display : 'no-hud';})(),
    };
  })()`);
  rec('Day 74 regression: back-btn cleans Speedrun HUD + mode flag', spdClean && spdClean.mode === false && spdClean.hudDisplay === 'none', JSON.stringify(spdClean));

  // ───────── PHASE: Community levels (Day 49) ─────────
  console.log('\n=== Phase: Community levels (4 picks) ===');
  // 4 known-good community levels — pick spread: c1 (The Implication), c5 (One Hot/XOR), c8 (Majority Vote/featured), c11 (Half Adder Redux/2-out)
  const COMMUNITY_PICKS = ['community_1', 'community_5', 'community_8', 'community_11'];
  for (const cid of COMMUNITY_PICKS) {
    const out = await evalExpr(ws, `(function(){
      const cl = (typeof COMMUNITY_LEVELS !== 'undefined') ? COMMUNITY_LEVELS.find(l=>l.id==='${cid}') : null;
      if (!cl) return {missing:true};
      // Build it via the same path as ui.playCommunityLevel
      const data = { n: cl.name, i: cl.inputCount, o: cl.outputCount, t: cl.truthTable, g: cl.gates };
      const built = buildCustomLevel(data);
      built.id = '${cid}';
      built.isCommunityLevel = true;
      const gs = window.game;
      gs.isChallengeMode = false; gs.isSandboxMode = false;
      gs.currentScreen='gameplay';
      gs.ui.showScreen('gameplay');
      gs.loadChallengeLevel(built);
      // Read back the loaded level
      const lvl = gs.currentLevel;
      return {
        loaded: !!lvl,
        title: lvl && lvl.title,
        inputs: lvl && lvl.inputs && lvl.inputs.length,
        outputs: lvl && lvl.outputs && lvl.outputs.length,
        tableLen: lvl && lvl.truthTable && lvl.truthTable.length,
        isCommunity: !!(lvl && lvl.isCommunityLevel),
        gpVis: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      };
    })()`);
    rec(`Community ${cid} loads via buildCustomLevel`, out && out.loaded && out.isCommunity && out.gpVis && out.tableLen > 0, JSON.stringify(out));
    await sleep(200);
  }
  // Recover to level-select
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(300);

  // ───────── PHASE: Cycle 4 BUILD regression sweep (D92/D93/D94/D95/D96) ─────────
  console.log('\n=== Phase: Cycle 4 BUILD regression sweep ===');
  const c4 = await evalExpr(ws, `(function(){
    return {
      // D92
      Gate: typeof window.Gate,
      GateTypesKeys: window.GateTypes ? Object.keys(window.GateTypes) : [],
      IONode: typeof window.IONode,
      roundRect: typeof window.roundRect,
      // D93
      RemoteCls: typeof window.RemoteTournamentAdapter,
      LocalCls: typeof window.LocalTournamentAdapter,
      selectFn: typeof window.selectTournamentBackend,
      tbMode: window.game.tournamentBackend && window.game.tournamentBackend.getMode && window.game.tournamentBackend.getMode(),
      // D94 already covered by HUD chip + composite validator phases above
      // D95
      onbVariant: window.__onboardingExperiment && window.__onboardingExperiment.getVariant(),
      onbHasReset: typeof (window.__onboardingExperiment && window.__onboardingExperiment.reset),
      // D96
      cardLibLen: (window.game && window.game.getCardLibrary) ? window.game.getCardLibrary().length : -1,
      statsTabsPresent: !!document.querySelector('#stats-tabs') || !!document.querySelector('#stats-tab-cards'),
    };
  })()`);
  rec('D92 ES module exports re-bound (Gate/GateTypes×8/IONode/roundRect)',
      c4 && c4.Gate === 'function' && c4.GateTypesKeys.length >= 8 && c4.IONode === 'function' && c4.roundRect === 'function',
      JSON.stringify(c4).slice(0,200));
  rec('D93 Tournament adapter classes present + default mode "local"',
      c4 && c4.RemoteCls === 'function' && c4.LocalCls === 'function' && c4.selectFn === 'function' && c4.tbMode === 'local',
      JSON.stringify({rc:c4.RemoteCls,lc:c4.LocalCls,sf:c4.selectFn,m:c4.tbMode}));
  rec('D95 OnboardingExperiment exposes silent-standard variant + reset()',
      c4 && c4.onbVariant === 'silent-standard' && c4.onbHasReset === 'function',
      JSON.stringify({v:c4.onbVariant,r:c4.onbHasReset}));
  rec('D96 Snapshot card library API + Stats tab scaffolding present',
      c4 && c4.cardLibLen >= 0 && c4.statsTabsPresent,
      JSON.stringify({n:c4.cardLibLen,t:c4.statsTabsPresent}));

  // ───────── PHASE: Console hygiene ─────────
  console.log('\n=== Phase: Console hygiene ===');
  rec('0 console.error across full sweep', consoleErrors.length === 0,
      `errors=${consoleErrors.length}` + (consoleErrors.length ? ' :: ' + consoleErrors.slice(0,5).join(' | ') : ''));

  // ─── Summary ───
  const passed = assertions.filter(a => a.ok).length;
  const failed = assertions.filter(a => !a.ok).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${assertions.length}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0,10).join('\n'));
  if (failed) {
    console.log('\n--- Failures ---');
    for (const a of assertions) if (!a.ok) console.log(' - ' + a.label + (a.detail ? ' :: ' + a.detail : ''));
  }
  ws.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e && e.stack || e);
  process.exit(2);
});
