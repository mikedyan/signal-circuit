#!/usr/bin/env node
/**
 * Day 99 QA harness — Cycle 4 HARDEN Week, Day 3: Edge Cases & Stress.
 *
 * Re-runs Day 89's 25-test stress sweep with Cycle 4 BUILD-week additions
 * (D92 ES module / D93 tournament adapter / D94 composite Lab Bench /
 *  D95 onboarding readout / D96 snapshot card library) layered in.
 *
 * 25 base phases (T1–T25) + Cycle 4 BUILD stress block (T26–T30).
 *
 * Build under test:
 *   - ?v=1780617600 cache-bust (Day 96 build, unchanged through Day 98)
 *   - sw.js CACHE_NAME 'signal-circuit-v65'
 *   - 45 level cards on cold start (Day 94 added L44/45)
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-99-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

const EXPECTED_CACHE_BUST = '?v=1780617600';
const EXPECTED_CACHE_BUST_REGEX = /\?v=1780617600/g;
const EXPECTED_SW_VERSION = 'signal-circuit-v65';
const EXPECTED_LEVEL_CARDS = 45;

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const assertions = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}` + (detail ? ` :: ${String(detail).slice(0, 300)}` : ''));
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
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
  const r = await send(ws, 'Runtime.evaluate', {
    expression: expr, returnByValue, awaitPromise, allowUnsafeEvalBlockedByCSP: true,
  });
  if (r.exceptionDetails) {
    const text = r.exceptionDetails.exception?.description || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails);
    throw new Error('eval threw: ' + text);
  }
  return r.result && r.result.value;
}
async function waitFor(ws, predicate, { timeoutMs = 15000, intervalMs = 200, label = 'waitFor' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = await evalExpr(ws, `(${predicate})()`); if (v) return v; } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label}`);
}
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function navigateAndWait(ws, url) {
  await send(ws, 'Page.navigate', { url });
  await sleep(1500);
  await waitFor(ws, `() => !!document.body && !!window.game`, { label: 'body+game present', timeoutMs: 20000 });
}

async function main() {
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) target = await fetchJson('/json/new?about:blank');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  ws.on('message', (data) => {
    let msg; try { msg = JSON.parse(data.toString()); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const e = msg.params?.exceptionDetails;
      const text = e?.exception?.description || e?.text || JSON.stringify(e);
      consoleErrors.push({ kind: 'Runtime.exceptionThrown', text });
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const p = msg.params;
      if (p?.type === 'error' || p?.type === 'assert') {
        const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        consoleErrors.push({ kind: 'console.' + p.type, text });
      }
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');
  await send(ws, 'Network.setCacheDisabled', { cacheDisabled: true });
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'http://localhost:8901', storageTypes: 'all' }); } catch {}

  await navigateAndWait(ws, TARGET_URL);

  // Pre-install vibrate stub for completion-path stress
  await evalExpr(ws, `(() => { try { navigator.vibrate = () => true; } catch(e){} return true; })()`);

  // -------------------- T25: build identity --------------------
  console.log('\n=== T25: build identity ===');
  {
    const html = await evalExpr(ws, `fetch('/index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
    const cb1 = (html.match(EXPECTED_CACHE_BUST_REGEX) || []).length;
    rec(`T25.1 — 11 cache-bust refs at ${EXPECTED_CACHE_BUST}`, cb1 === 11, `found=${cb1}`);
    const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
    const re = new RegExp(`CACHE_NAME\\s*=\\s*'${EXPECTED_SW_VERSION}'`);
    rec(`T25.2 — sw.js CACHE_NAME ${EXPECTED_SW_VERSION}`, re.test(swText));
  }

  // -------------------- T20: Onboarding default (silent-standard) --------------------
  console.log('\n=== T20: Day 85 Onboarding default ===');
  {
    const variant = await evalExpr(ws, `window.__onboardingExperiment.getVariant()`);
    rec('T20.1 — default onboarding variant = silent-standard', variant === 'silent-standard', `variant=${variant}`);
    const counters = await evalExpr(ws, `window.__onboardingExperiment.getCounters()`);
    rec('T20.2 — counters JSON-serializable', counters && typeof counters === 'object', JSON.stringify(counters).slice(0, 160));
    const diff = await evalExpr(ws, `localStorage.getItem('signal-circuit-difficulty-mode') || window.game.difficultyMode`);
    rec('T20.3 — silent-default difficulty mode resolves to standard', diff === 'standard', `diff=${diff}`);
  }

  // -------------------- T4: cold-start sanity (clear localStorage + reload) --------------------
  console.log('\n=== T4: Cold-start sanity (clear localStorage + reload) ===');
  {
    await evalExpr(ws, `(()=>{const keys=Object.keys(localStorage).filter(k=>k.startsWith('signal')||k.includes('signal-circuit')||k==='communityPlays'); keys.forEach(k=>localStorage.removeItem(k)); return keys.length;})()`);
    await navigateAndWait(ws, TARGET_URL);
    await evalExpr(ws, `(() => { try { navigator.vibrate = () => true; } catch(e){} return true; })()`);
    const cold = await evalExpr(ws, `(() => {
      const all = Array.from(document.querySelectorAll('#level-select-screen button'));
      const nonLevel = all.filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
      return {
        screen: document.querySelector('.screen-active')?.id,
        nonLevelButtons: nonLevel.length,
        labels: nonLevel.map(b => (b.textContent || '').trim().slice(0,40)),
        levelCards: document.querySelectorAll('#level-select-screen .level-btn').length,
        diff: localStorage.getItem('signal-circuit-difficulty-mode') || window.game.difficultyMode,
      };
    })()`);
    rec('T4.1 — cold start lands on level-select', cold.screen === 'level-select-screen', `screen=${cold.screen}`);
    rec('T4.2 — cold non-level buttons === 2', cold.nonLevelButtons === 2, `labels=${JSON.stringify(cold.labels)}`);
    rec(`T4.3 — ${EXPECTED_LEVEL_CARDS} level cards`, cold.levelCards === EXPECTED_LEVEL_CARDS, `cards=${cold.levelCards}`);
    rec('T4.4 — silent-default difficulty=standard', cold.diff === 'standard', `diff=${cold.diff}`);
  }

  // -------------------- T6: colorblind + dark/light mode toggles --------------------
  console.log('\n=== T6: Colorblind + dark/light mode toggles ===');
  {
    const r = await evalExpr(ws, `(() => {
      document.body.classList.add('colorblind-mode');
      const c1 = document.body.classList.contains('colorblind-mode');
      document.body.classList.add('light-mode');
      const c2 = document.body.classList.contains('light-mode');
      document.body.classList.remove('light-mode');
      const c3 = document.body.classList.contains('light-mode');
      document.body.classList.remove('colorblind-mode');
      const c4 = document.body.classList.contains('colorblind-mode');
      return { c1, c2, c3, c4 };
    })()`);
    rec('T6.1 — colorblind class applies', r.c1 === true);
    rec('T6.2 — light-mode class applies', r.c2 === true);
    rec('T6.3 — light-mode class removes', r.c3 === false);
    rec('T6.4 — colorblind class removes', r.c4 === false);
  }

  // -------------------- T1: rapid gate placement during simulation --------------------
  console.log('\n=== T1: Rapid gate placement during sim ===');
  await evalExpr(ws, `window.game.startLevel(1)`);
  await sleep(400);
  {
    const r = await evalExpr(ws, `(async () => {
      const g = window.game;
      g.runSimulation && g.runSimulation();
      let placed = 0, threw = null;
      try {
        for (let i = 0; i < 14; i++) {
          if (g.gateManager && g.gateManager.addGate) {
            g.gateManager.addGate('AND', 200 + i*5, 200 + i*5);
            placed++;
          } else if (g.placeGate) {
            g.placeGate('AND', 200 + i*5, 200 + i*5);
            placed++;
          }
        }
      } catch (e) { threw = e.message; }
      return { placed, threw, isAnimating: !!g.isAnimating };
    })()`, { awaitPromise: true });
    rec('T1.1 — 14 gates inserted mid-anim no-throw', r.threw === null, JSON.stringify(r));
  }
  await sleep(2000);
  await evalExpr(ws, `window.game.clearCircuit && window.game.clearCircuit()`);
  await sleep(200);

  // -------------------- T2: wire drawing during animation --------------------
  console.log('\n=== T2: Wire drawing during animation ===');
  {
    const r = await evalExpr(ws, `(async () => {
      const g = window.game;
      let threw = null;
      try {
        g.runSimulation && g.runSimulation();
        if (g.wireManager && typeof g.wireManager.startWire === 'function') {
          g.wireManager.startWire({ x: 100, y: 100, pinType: 'output' });
          g.wireManager.cancelWire && g.wireManager.cancelWire();
        }
      } catch (e) { threw = e.message; }
      return { threw };
    })()`, { awaitPromise: true });
    rec('T2.1 — wireManager.startWire mid-anim no-throw', r.threw === null, JSON.stringify(r));
  }
  await sleep(2000);

  // -------------------- T3: 10× window resize stress --------------------
  console.log('\n=== T3: 10× rapid window resize ===');
  {
    const r = await evalExpr(ws, `(async () => {
      let threw = null;
      try {
        for (let i = 0; i < 10; i++) window.dispatchEvent(new Event('resize'));
      } catch (e) { threw = e.message; }
      const c = document.getElementById('game-canvas') || document.querySelector('canvas');
      return { threw, canvasW: c?.width || 0, canvasH: c?.height || 0 };
    })()`, { awaitPromise: true });
    rec('T3.1 — 10× resize events fire no-throw', r.threw === null, JSON.stringify(r));
  }

  // -------------------- T5: keyboard tab navigation --------------------
  console.log('\n=== T5: Keyboard tab navigation ===');
  {
    const r = await evalExpr(ws, `(() => {
      const focusables = Array.from(document.querySelectorAll('#gameplay-screen button, #gameplay-screen [tabindex], #gameplay-screen a, #gameplay-screen input'))
        .filter(el => el.offsetParent !== null && !el.disabled && el.getAttribute('aria-hidden') !== 'true');
      return { count: focusables.length, ids: focusables.slice(0, 18).map(e => e.id || e.className || e.tagName) };
    })()`);
    rec('T5.1 — gameplay screen has ≥10 tab-focusables', r.count >= 10, `count=${r.count} ids=${JSON.stringify(r.ids).slice(0,200)}`);
  }

  // -------------------- T7: performance probe --------------------
  console.log('\n=== T7: Performance probe — render frames ===');
  {
    const r = await evalExpr(ws, `(() => {
      const g = window.game;
      const canvas = document.getElementById('game-canvas') || document.querySelector('canvas');
      const renderer = g.renderer || g.canvasRenderer;
      if (!canvas || !renderer) return { skipped: true };
      const t0 = performance.now();
      for (let i = 0; i < 10; i++) {
        try { renderer.render && renderer.render(); } catch (e) {}
      }
      const dt = performance.now() - t0;
      return { renders: 10, totalMs: dt.toFixed(2), avgMs: (dt/10).toFixed(3), wireCount: (g.wireManager?.wires||[]).length, gateCount: (g.gateManager?.gates||[]).length };
    })()`);
    rec('T7.1 — 10× canvas render completes (avg <5ms)', !r.skipped && parseFloat(r.avgMs) < 5, JSON.stringify(r));
  }

  // -------------------- T8: RUN spam (15×) --------------------
  console.log('\n=== T8: RUN spam (15×) ===');
  {
    const r = await evalExpr(ws, `(async () => {
      let threw = null, count = 0;
      try {
        for (let i = 0; i < 15; i++) {
          try { window.game.runSimulation && window.game.runSimulation(); count++; } catch (e) { threw = e.message; break; }
        }
      } catch (e) { threw = e.message; }
      return { threw, count };
    })()`, { awaitPromise: true });
    rec('T8.1 — 15× runSimulation() calls no-throw', r.threw === null && r.count === 15, JSON.stringify(r));
  }
  await sleep(3000);

  // -------------------- T9: Quick Test spam (15×) --------------------
  console.log('\n=== T9: Quick Test spam (15×) ===');
  await evalExpr(ws, `window.game.clearCircuit && window.game.clearCircuit()`);
  await sleep(200);
  {
    const r = await evalExpr(ws, `(async () => {
      let threw = null, count = 0;
      try {
        for (let i = 0; i < 15; i++) {
          try { window.game.runQuickTest && window.game.runQuickTest(); count++; } catch (e) { threw = e.message; break; }
        }
      } catch (e) { threw = e.message; }
      return { threw, count };
    })()`, { awaitPromise: true });
    rec('T9.1 — 15× runQuickTest() calls no-throw', r.threw === null && r.count === 15, JSON.stringify(r));
  }

  // -------------------- T10: undo/redo storm --------------------
  console.log('\n=== T10: Undo/redo storm ===');
  {
    const r = await evalExpr(ws, `(() => {
      const g = window.game;
      let undoCount = 0, redoCount = 0, threw = null;
      try {
        for (let i = 0; i < 20; i++) {
          if (g.undoManager?.undo) { g.undoManager.undo(); undoCount++; }
          else if (g.undo) { g.undo(); undoCount++; }
        }
        for (let i = 0; i < 20; i++) {
          if (g.undoManager?.redo) { g.undoManager.redo(); redoCount++; }
          else if (g.redo) { g.redo(); redoCount++; }
        }
      } catch (e) { threw = e.message; }
      return { undoCount, redoCount, threw };
    })()`);
    rec('T10.1 — 20× undo + 20× redo no-throw', r.threw === null, JSON.stringify(r));
  }

  // -------------------- T11: mode-switch storm --------------------
  console.log('\n=== T11: Mode-switch storm ===');
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);
  await evalExpr(ws, `window.game.seedProgress(18, {stars:3})`);
  await sleep(200);
  {
    const cycles = [
      `document.getElementById('daily-challenge-btn')?.click()`,
      `window.game.showLevelSelect()`,
      `document.getElementById('random-challenge-btn')?.click()`,
      `window.game.showLevelSelect()`,
      `document.getElementById('sandbox-btn')?.click()`,
      `window.game.showLevelSelect()`,
      `document.getElementById('tournament-btn')?.click()`,
      `window.game.showLevelSelect()`,
      `document.getElementById('infinite-btn')?.click()`,
      `window.game.showLevelSelect()`,
    ];
    let threw = null;
    for (const step of cycles) {
      try {
        await evalExpr(ws, step);
        await sleep(150);
      } catch (e) { threw = e.message; break; }
    }
    const final = await evalExpr(ws, `document.querySelector('.screen-active')?.id`);
    rec('T11.1 — 10-step mode-switch storm returns to level-select', threw === null && final === 'level-select-screen', `threw=${threw} final=${final}`);
  }

  // -------------------- T12: blur/focus + visibilitychange --------------------
  console.log('\n=== T12: blur/focus + visibilitychange ===');
  {
    const r = await evalExpr(ws, `(() => {
      let threw = null;
      try {
        window.dispatchEvent(new Event('blur'));
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
      } catch (e) { threw = e.message; }
      return { threw };
    })()`);
    rec('T12.1 — blur+visibilitychange+focus no-throw', r.threw === null, JSON.stringify(r));
  }

  // -------------------- T13: Lab Bench attempt exhaustion --------------------
  console.log('\n=== T13: Lab Bench attempt exhaustion ===');
  await evalExpr(ws, `window.game.startLevel(36)`);
  await sleep(500);
  {
    const r = await evalExpr(ws, `(() => {
      const g = window.game;
      const labBefore = g._lab ? { ...g._lab } : null;
      let consumed = 0;
      for (let i = 0; i < 3; i++) {
        try { g._consumeLabAttempt && g._consumeLabAttempt(); consumed++; } catch (e) {}
      }
      const labAfter = g._lab ? { ...g._lab } : null;
      try { g.resetLab && g.resetLab(); } catch (e) {}
      const labReset = g._lab ? { ...g._lab } : null;
      return { labBefore, consumed, labAfter, labReset, runLabel: document.getElementById('run-btn')?.textContent };
    })()`);
    rec('T13.1 — Lab Bench L36 _lab state machine works (3 consumes → exhausted, reset → 0)',
      r.labAfter && r.labAfter.attempts === 3 && r.labReset && r.labReset.attempts === 0,
      JSON.stringify(r));
    rec('T13.2 — Lab Bench L36 RUN button labeled Submit Blueprint', (r.runLabel || '').includes('Submit Blueprint'), `label="${r.runLabel}"`);
  }
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(200);

  // -------------------- T17/T18/T19: Day 84 Lab Bench II constraints --------------------
  console.log('\n=== T17–T19: Day 84 Lab Bench II constraint enforcement ===');
  {
    await evalExpr(ws, `window.game.startLevel(41)`);
    await sleep(300);
    const lab41 = await evalExpr(ws, `({ gates: window.game.currentLevel.availableGates, chip: document.getElementById('lab-constraint')?.textContent, cap: window.game.currentLevel.gateHardCap, mustInclude: window.game.currentLevel.mustIncludeGate, runLabel: document.getElementById('run-btn')?.textContent })`);
    rec('T17.1 — L41 NAND-only palette enforced', JSON.stringify(lab41.gates) === '["NAND"]', JSON.stringify(lab41));
    rec('T17.2 — L41 lab-constraint chip mentions NAND', (lab41.chip || '').includes('NAND'));

    await evalExpr(ws, `window.game.startLevel(42)`);
    await sleep(300);
    const lab42 = await evalExpr(ws, `({ cap: window.game.currentLevel.gateHardCap, chip: document.getElementById('lab-constraint')?.textContent })`);
    rec('T18.1 — L42 gateHardCap=4', lab42.cap === 4, JSON.stringify(lab42));
    rec('T18.2 — L42 chip mentions Hard cap', (lab42.chip || '').includes('Hard cap'));
    const v42 = await evalExpr(ws, `(() => {
      const g = window.game;
      const saved = g.gates;
      g.gates = [];
      for (let i = 0; i < 5; i++) g.gates.push({ type: 'AND', _locked: false });
      const overRes = g._validateLabConstraints();
      g.gates = [];
      for (let i = 0; i < 4; i++) g.gates.push({ type: 'AND', _locked: false });
      const okRes = g._validateLabConstraints();
      g.gates = saved;
      return { overRes, okRes };
    })()`);
    rec('T18.3 — L42 validator rejects 5 gates (over cap 4)', v42 && v42.overRes && v42.overRes.ok === false && (v42.overRes.message || '').toLowerCase().includes('cap'), JSON.stringify(v42));
    rec('T18.4 — L42 validator accepts exactly 4 gates', v42 && v42.okRes && v42.okRes.ok === true, JSON.stringify(v42.okRes));

    await evalExpr(ws, `window.game.startLevel(43)`);
    await sleep(300);
    const lab43 = await evalExpr(ws, `({ mustInclude: window.game.currentLevel.mustIncludeGate, chip: document.getElementById('lab-constraint')?.textContent })`);
    rec('T19.1 — L43 mustIncludeGate=["XOR"]', Array.isArray(lab43.mustInclude) && lab43.mustInclude[0] === 'XOR', JSON.stringify(lab43));
    rec('T19.2 — L43 chip mentions XOR', (lab43.chip || '').includes('XOR'));
    const v43 = await evalExpr(ws, `(() => {
      const g = window.game;
      const saved = g.gates;
      g.gates = [{type:'AND',_locked:false},{type:'OR',_locked:false},{type:'NOT',_locked:false}];
      const noXorRes = g._validateLabConstraints();
      g.gates = [{type:'XOR',_locked:false},{type:'AND',_locked:false}];
      const withXorRes = g._validateLabConstraints();
      g.gates = saved;
      return { noXorRes, withXorRes };
    })()`);
    rec('T19.3 — L43 validator rejects circuit without XOR', v43.noXorRes && v43.noXorRes.ok === false, JSON.stringify(v43.noXorRes));
    rec('T19.4 — L43 validator accepts circuit with XOR', v43.withXorRes && v43.withXorRes.ok === true, JSON.stringify(v43.withXorRes));
  }
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(200);

  // -------------------- T14: Tournament archive replay --------------------
  console.log('\n=== T14: Tournament archive replay ===');
  await evalExpr(ws, `document.getElementById('tournament-btn')?.click()`);
  await sleep(500);
  {
    const r = await evalExpr(ws, `(() => {
      const screen = document.querySelector('.screen-active')?.id;
      const tabs = document.querySelectorAll('#tournament-screen .tournament-tab, #tournament-screen .tab-btn');
      const modeLabel = document.getElementById('tournament-mode-label')?.textContent;
      const adapter = window.game.tournamentBackend && window.game.tournamentBackend.getMode ? window.game.tournamentBackend.getMode() : null;
      const describe = window.game.tournamentBackend && window.game.tournamentBackend.describe ? window.game.tournamentBackend.describe() : null;
      return { screen, tabCount: tabs.length, modeLabel, adapter, describe };
    })()`);
    rec('T14.1 — Tournament screen opens', r.screen === 'tournament-screen', `screen=${r.screen}`);
    rec('T14.2 — Tournament has ≥3 tabs', r.tabCount >= 3, `tabs=${r.tabCount}`);
    rec('T14.3 — Tournament adapter = local', r.adapter === 'local', `adapter=${r.adapter}`);
    rec('T14.4 — Day 83 describe label present', typeof r.describe === 'string' && r.describe.length > 0, `describe="${r.describe}"`);
  }
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);

  // -------------------- T15: Mythic celebration overlay --------------------
  console.log('\n=== T15: Mythic celebration overlay ===');
  {
    const r = await evalExpr(ws, `(() => {
      const pre = !!document.getElementById('mythic-celebration');
      try {
        window.game.ui.showMythicCelebration && window.game.ui.showMythicCelebration({ id: 'galaxy_brain', name: 'Galaxy Brain' });
      } catch (e) { return { pre, threw: e.message }; }
      const post = document.getElementById('mythic-celebration');
      return { pre, postExists: !!post, postDisplay: post ? getComputedStyle(post).display : null };
    })()`);
    rec('T15.1 — mythic-celebration overlay lazy-mounts', r.threw === undefined && r.postExists === true, JSON.stringify(r));
  }
  await evalExpr(ws, `(()=>{const m=document.getElementById('mythic-celebration'); if(m) m.remove();})()`);

  // -------------------- T16: localStorage capacity probe --------------------
  console.log('\n=== T16: localStorage capacity probe ===');
  {
    const r = await evalExpr(ws, `(() => {
      const key = '__sc_day99_capacity_probe__';
      const block = 'A'.repeat(50 * 1024);
      const writes = 50;
      let written = 0, threw = null;
      try {
        for (let i = 0; i < writes; i++) {
          localStorage.setItem(key + '_' + i, block);
          written++;
        }
      } catch (e) { threw = e.message; }
      for (let i = 0; i < writes; i++) try { localStorage.removeItem(key + '_' + i); } catch {}
      return { written, threw };
    })()`);
    rec('T16.1 — localStorage 50×50KB writes succeed', r.written === 50, JSON.stringify(r));
  }

  // -------------------- T21: Onboarding URL override warm-toast --------------------
  console.log('\n=== T21: Onboarding URL override warm-toast ===');
  {
    await evalExpr(ws, `(()=>{Object.keys(localStorage).filter(k=>k.startsWith('signal')||k.includes('signal-circuit')).forEach(k=>localStorage.removeItem(k));})()`);
    await navigateAndWait(ws, 'http://localhost:8901/?onboarding=warm-toast&_ts=' + Date.now());
    const v = await evalExpr(ws, `window.__onboardingExperiment.getVariant()`);
    rec('T21.1 — URL ?onboarding=warm-toast → variant=warm-toast', v === 'warm-toast', `variant=${v}`);
    const persisted = await evalExpr(ws, `JSON.parse(localStorage.getItem('signal-circuit-onboarding-experiment')||'{}').variant`);
    rec('T21.2 — URL override persists into localStorage', persisted === 'warm-toast', `persisted=${persisted}`);
  }

  // -------------------- T22: Onboarding URL override explicit-chooser --------------------
  console.log('\n=== T22: Onboarding URL override explicit-chooser ===');
  {
    await evalExpr(ws, `(()=>{Object.keys(localStorage).filter(k=>k.startsWith('signal')||k.includes('signal-circuit')).forEach(k=>localStorage.removeItem(k));})()`);
    await navigateAndWait(ws, 'http://localhost:8901/?onboarding=explicit-chooser&_ts=' + Date.now());
    const v = await evalExpr(ws, `window.__onboardingExperiment.getVariant()`);
    rec('T22.1 — URL ?onboarding=explicit-chooser → variant=explicit-chooser', v === 'explicit-chooser', `variant=${v}`);
    const persisted = await evalExpr(ws, `JSON.parse(localStorage.getItem('signal-circuit-onboarding-experiment')||'{}').variant`);
    rec('T22.2 — URL override persists into localStorage', persisted === 'explicit-chooser', `persisted=${persisted}`);
  }

  // -------------------- T24: Day 78 staircase regression --------------------
  console.log('\n=== T24: Day 78 staircase regression ===');
  {
    await evalExpr(ws, `(()=>{Object.keys(localStorage).filter(k=>k.startsWith('signal')||k.includes('signal-circuit')).forEach(k=>localStorage.removeItem(k));})()`);
    await navigateAndWait(ws, TARGET_URL);
    await evalExpr(ws, `(() => { try { navigator.vibrate = () => true; } catch(e){} return true; })()`);
    const cold = await evalExpr(ws, `Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null).length`);
    rec('T24.1 — Cold: 2 non-level buttons', cold === 2, `cold=${cold}`);

    await evalExpr(ws, `window.game.seedProgress(18, {stars:3})`);
    await sleep(200);
    const g18 = await evalExpr(ws, `Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null).length`);
    rec('T24.2 — seed 18: 18 nav buttons (tier3)', g18 === 18, `g18=${g18}`);

    await evalExpr(ws, `window.game.seedProgress(45, {stars:3})`);
    await sleep(200);
    const g45 = await evalExpr(ws, `({ nav: Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null).length, overflow: document.querySelectorAll('#level-select-screen .level-overflow-btn').length })`);
    rec(`T24.3 — seed 45: 18 nav + ${EXPECTED_LEVEL_CARDS} overflow buttons`, g45.nav === 18 && g45.overflow === EXPECTED_LEVEL_CARDS, JSON.stringify(g45));
  }

  // -------------------- T23: Day 86 module-health stability --------------------
  console.log('\n=== T23: Day 86 module-health stability ===');
  {
    const wires = await evalExpr(ws, `fetch('/js/wires.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
    rec('T23.1 — wires.js still has WIRE_COLORS_DEFAULT', wires.includes('WIRE_COLORS_DEFAULT'));
    rec('T23.2 — wires.js no longer redefines const WIRE_COLORS = WIRE_COLORS_DEFAULT', !/^\s*const\s+WIRE_COLORS\s*=\s*WIRE_COLORS_DEFAULT/m.test(wires));
    const dead = await evalExpr(ws, `({
      showFirstLaunchDifficultyModal: typeof window.game?.ui?.showFirstLaunchDifficultyModal,
      checkLightning: typeof window.game?.achievementManager?.checkLightning,
      checkEclipseRun: typeof window.game?.achievementManager?.checkEclipseRun,
      checkArchitect: typeof window.game?.achievementManager?.checkArchitect,
      isMythic: typeof window.game?.achievementManager?.isMythic,
      _showHud: typeof window.game?.infiniteRunManager?._showHud,
      getCurrentStep: typeof window.game?.tutorial?.getCurrentStep,
      weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
    })`);
    const allUndefined = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'].every(k => dead[k] === 'undefined');
    rec('T23.3 — Day 79 7 dead identifiers all undefined', allUndefined, JSON.stringify(dead));
    rec('T23.4 — #weekly-puzzle-btn DOM absent', dead.weeklyPuzzleBtn === false);
  }

  // ============================================================================
  // ────── T26–T30: Cycle 4 BUILD-week feature stress (D92–D96) ──────
  // ============================================================================

  // -------------------- T26: D92 ES module exports stress --------------------
  console.log('\n=== T26: Day 92 ES module exports under stress ===');
  {
    const r = await evalExpr(ws, `(() => {
      const result = {
        Gate: typeof window.Gate,
        GateTypesKeys: window.GateTypes ? Object.keys(window.GateTypes).sort() : [],
        IONode: typeof window.IONode,
        roundRect: typeof window.roundRect,
        // Stress: instantiate Gate + IONode 50x to confirm they're functional, not just typeof-function
        instStress: null,
      };
      try {
        const gs = [];
        for (let i = 0; i < 50; i++) {
          gs.push(new window.Gate('AND', 100+i, 100+i));
          gs.push(new window.IONode('input', 50, 50+i*5, 0));
        }
        result.instStress = { count: gs.length, sampleGateType: gs[0]?.type, sampleNodeType: gs[1]?.type };
      } catch (e) { result.instStress = { threw: e.message }; }
      return result;
    })()`);
    const expectedKeys = ['AND','MYSTERY','MYSTERY3','NAND','NOR','NOT','OR','XOR'].sort();
    rec('T26.1 — window.Gate / IONode / roundRect re-bound as functions',
        r.Gate === 'function' && r.IONode === 'function' && r.roundRect === 'function',
        JSON.stringify({G:r.Gate,I:r.IONode,r:r.roundRect}));
    rec('T26.2 — window.GateTypes has 8 expected keys', JSON.stringify(r.GateTypesKeys) === JSON.stringify(expectedKeys), JSON.stringify(r.GateTypesKeys));
    rec('T26.3 — 100× Gate+IONode instantiation no-throw',
        r.instStress && r.instStress.count === 100 && !r.instStress.threw,
        JSON.stringify(r.instStress));
  }

  // -------------------- T27: D93 Tournament adapter toggle stress --------------------
  console.log('\n=== T27: Day 93 Tournament adapter toggle stress ===');
  {
    const r = await evalExpr(ws, `(() => {
      let threw = null;
      const results = [];
      try {
        const seq = ['local','remote','local','remote','local'];
        for (const mode of seq) {
          if (mode === 'remote') localStorage.setItem('signal-circuit-tournament-backend', 'remote');
          else localStorage.removeItem('signal-circuit-tournament-backend');
          const adapter = window.selectTournamentBackend ? window.selectTournamentBackend() : null;
          results.push({ requested: mode, actualMode: adapter && adapter.getMode && adapter.getMode(), describe: adapter && adapter.describe && adapter.describe() });
        }
      } catch (e) { threw = e.message; }
      // Restore default
      localStorage.removeItem('signal-circuit-tournament-backend');
      return { threw, results, classes: { Remote: typeof window.RemoteTournamentAdapter, Local: typeof window.LocalTournamentAdapter, select: typeof window.selectTournamentBackend } };
    })()`);
    rec('T27.1 — 5× backend toggle (local/remote/local/remote/local) no-throw', r.threw === null, JSON.stringify({threw: r.threw}));
    rec('T27.2 — Adapter classes + selector all functions',
        r.classes && r.classes.Remote === 'function' && r.classes.Local === 'function' && r.classes.select === 'function',
        JSON.stringify(r.classes));
    rec('T27.3 — All 5 toggle results have non-empty describe label',
        Array.isArray(r.results) && r.results.length === 5 && r.results.every(x => typeof x.describe === 'string' && x.describe.length > 0),
        JSON.stringify(r.results).slice(0, 300));
    // Per Day 83 spec: 'remote' selection resolves to mode 'cloud-ready' (no Worker URL wired yet — semantic state name, not a regression).
    const validMap = { local: 'local', remote: 'cloud-ready' };
    rec('T27.4 — Mode resolves correctly (local→local, remote→cloud-ready per Day 83)',
        Array.isArray(r.results) && r.results.every(x => x.actualMode === validMap[x.requested]),
        JSON.stringify(r.results.map(x => `${x.requested}→${x.actualMode}`)));
  }

  // -------------------- T28: D94 Composite Lab Bench rapid validator calls --------------------
  console.log('\n=== T28: Day 94 composite Lab Bench rapid validator stress ===');
  await evalExpr(ws, `window.game.startLevel(44)`);
  await sleep(300);
  {
    const r44 = await evalExpr(ws, `(() => {
      const g = window.game;
      const lvl = g.currentLevel;
      const chip1 = document.getElementById('lab-constraint')?.textContent;
      const chip2 = document.getElementById('lab-constraint-2')?.textContent;
      // 100× rapid validator calls with shifting gate counts
      const saved = g.gates;
      let threw = null, results = [];
      try {
        for (let i = 0; i < 100; i++) {
          const n = (i % 10) + 1; // 1..10 gates cycling
          g.gates = [];
          for (let j = 0; j < n; j++) g.gates.push({ type: 'NAND', _locked: false });
          const res = g._validateLabConstraints();
          if (i < 5 || i > 95) results.push({ n, ok: res.ok, msg: (res.message||'').slice(0,80) });
        }
      } catch (e) { threw = e.message; }
      g.gates = saved;
      return { cap: lvl.gateHardCap, mustInclude: lvl.mustIncludeGate, available: lvl.availableGates, chip1, chip2, threw, results };
    })()`);
    rec('T28.1 — L44 composite chips both render', !!r44.chip1 && !!r44.chip2 && r44.chip1.length > 0 && r44.chip2.length > 0, JSON.stringify({c1:r44.chip1,c2:r44.chip2}));
    rec('T28.2 — L44 metadata: cap=6, NAND-only palette',
        r44.cap === 6 && JSON.stringify(r44.available) === '["NAND"]',
        JSON.stringify({cap:r44.cap,avail:r44.available}));
    rec('T28.3 — L44 100× rapid validator calls no-throw', r44.threw === null, `threw=${r44.threw}`);
    rec('T28.4 — L44 validator rejects 7 NAND gates (over cap)',
        Array.isArray(r44.results) && r44.results.some(x => x.n === 7 && x.ok === false && (x.msg || '').toLowerCase().includes('cap')),
        JSON.stringify(r44.results.slice(0, 8)));
  }

  await evalExpr(ws, `window.game.startLevel(45)`);
  await sleep(300);
  {
    const r45 = await evalExpr(ws, `(() => {
      const g = window.game;
      const lvl = g.currentLevel;
      const chip1 = document.getElementById('lab-constraint')?.textContent;
      const chip2 = document.getElementById('lab-constraint-2')?.textContent;
      // Test composite reject: cap=5 + must include XOR
      const saved = g.gates;
      let threw = null;
      const cases = {};
      try {
        // 6 AND gates: should fail BOTH (over cap 5 + missing XOR) — composite message
        g.gates = [{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false}];
        cases.both = g._validateLabConstraints();
        // 4 AND: under cap but missing XOR
        g.gates = [{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false}];
        cases.noXor = g._validateLabConstraints();
        // 1 XOR + 2 AND: meets both
        g.gates = [{type:'XOR',_locked:false},{type:'AND',_locked:false},{type:'AND',_locked:false}];
        cases.okShape = g._validateLabConstraints();
      } catch (e) { threw = e.message; }
      g.gates = saved;
      return { cap: lvl.gateHardCap, mustInclude: lvl.mustIncludeGate, chip1, chip2, cases, threw };
    })()`);
    rec('T28.5 — L45 composite chips both render', !!r45.chip1 && !!r45.chip2, JSON.stringify({c1:r45.chip1,c2:r45.chip2}));
    rec('T28.6 — L45 metadata: cap=5, mustInclude XOR',
        r45.cap === 5 && Array.isArray(r45.mustInclude) && r45.mustInclude[0] === 'XOR',
        JSON.stringify({cap:r45.cap,must:r45.mustInclude}));
    rec('T28.7 — L45 validator rejects both-violations input (composite message)',
        r45.cases && r45.cases.both && r45.cases.both.ok === false,
        JSON.stringify(r45.cases.both));
    rec('T28.8 — L45 validator rejects missing-XOR input',
        r45.cases && r45.cases.noXor && r45.cases.noXor.ok === false && (r45.cases.noXor.message || '').toLowerCase().includes('xor'),
        JSON.stringify(r45.cases.noXor));
    rec('T28.9 — L45 validator accepts XOR+AND+AND shape',
        r45.cases && r45.cases.okShape && r45.cases.okShape.ok === true,
        JSON.stringify(r45.cases.okShape));
  }
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(200);

  // -------------------- T29: D95 Onboarding readout debug-flag toggle storm --------------------
  console.log('\n=== T29: Day 95 Onboarding readout debug-flag toggle storm ===');
  {
    const r = await evalExpr(ws, `(async () => {
      const results = [];
      let threw = null;
      try {
        // Cycle the debug flag on/off 5 times; each iteration, open settings and check #settings-developer-section visibility
        for (let i = 0; i < 5; i++) {
          const flag = i % 2 === 0 ? '1' : null;
          if (flag) localStorage.setItem('signal-circuit-debug', '1');
          else localStorage.removeItem('signal-circuit-debug');
          // Open settings
          const btn = document.getElementById('open-settings-btn');
          if (btn) btn.click();
          await new Promise(r => setTimeout(r, 200));
          const devSection = document.getElementById('settings-developer-section');
          const visible = devSection && getComputedStyle(devSection).display !== 'none';
          // Close
          const close = document.getElementById('settings-close');
          if (close) close.click();
          await new Promise(r => setTimeout(r, 100));
          results.push({ iter: i, flag, visible: !!visible });
        }
        // Clean up
        localStorage.removeItem('signal-circuit-debug');
      } catch (e) { threw = e.message; }
      return { threw, results };
    })()`, { awaitPromise: true });
    rec('T29.1 — 5× debug-flag toggle storm no-throw', r.threw === null, `threw=${r.threw}`);
    rec('T29.2 — Dev section visible when flag=1 (iters 0/2/4)',
        Array.isArray(r.results) && r.results.filter(x => x.flag === '1').every(x => x.visible === true),
        JSON.stringify(r.results));
    rec('T29.3 — Dev section hidden when flag absent (iters 1/3)',
        Array.isArray(r.results) && r.results.filter(x => x.flag === null).every(x => x.visible === false),
        JSON.stringify(r.results));
  }

  // -------------------- T30: D96 Snapshot card library flood + retrieval --------------------
  console.log('\n=== T30: Day 96 Snapshot card library flood + retrieval ===');
  {
    const r = await evalExpr(ws, `(() => {
      const g = window.game;
      let threw = null;
      try {
        // Reset library to empty
        try { g.resetCardLibrary && g.resetCardLibrary(); } catch (e) {}
        const startLen = g.getCardLibrary ? g.getCardLibrary().length : -1;
        // Flood with 25 fake snapshot cards (placeholder data URL)
        const placeholderPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        for (let i = 0; i < 25; i++) {
          if (g.addSnapshotCard) {
            g.addSnapshotCard({
              dataUrl: placeholderPng,
              levelId: (i % 40) + 1,
              levelTitle: 'Stress Card ' + i,
              shareText: 'Day 99 stress test',
              fileName: 'snapshot-' + i + '.png',
              gateCount: i,
              stars: (i % 3) + 1,
              savedAt: new Date(Date.now() + i * 1000).toISOString(),
            });
          }
        }
        const afterLen = g.getCardLibrary ? g.getCardLibrary().length : -1;
        const lib = g.getCardLibrary ? g.getCardLibrary() : [];
        // Check newest-first (savedAt descending) by levelTitle suffix index
        const titles = lib.map(c => c.levelTitle).slice(0, 5);
        return { startLen, afterLen, top5Titles: titles, last5Titles: lib.slice(-5).map(c => c.levelTitle), threw: null };
      } catch (e) { threw = e.message; return { threw }; }
    })()`);
    rec('T30.1 — Library starts empty after reset', r.startLen === 0, `start=${r.startLen}`);
    rec('T30.2 — Library cap=20 after 25 adds (FIFO eviction)', r.afterLen === 20, `after=${r.afterLen}`);
    rec('T30.3 — addSnapshotCard 25× no-throw', !r.threw, `threw=${r.threw}`);

    // Stats tab scaffolding present
    const tabs = await evalExpr(ws, `(() => {
      return {
        statsTabs: !!document.querySelector('#stats-tabs') || !!document.querySelector('#stats-tab-cards'),
        cardsPane: !!document.querySelector('#stats-cards-pane'),
        libraryApi: {
          get: typeof window.game.getCardLibrary,
          add: typeof window.game.addSnapshotCard,
          reset: typeof window.game.resetCardLibrary,
        },
      };
    })()`);
    rec('T30.4 — Stats tab scaffolding + cards pane present', tabs.statsTabs && tabs.cardsPane, JSON.stringify(tabs));
    rec('T30.5 — Card library API surface complete',
        tabs.libraryApi.get === 'function' && tabs.libraryApi.add === 'function' && tabs.libraryApi.reset === 'function',
        JSON.stringify(tabs.libraryApi));

    // Cleanup
    await evalExpr(ws, `window.game.resetCardLibrary && window.game.resetCardLibrary()`);
  }

  // -------------------- Final: console error tally --------------------
  console.log('\n=== Final: console error tally ===');
  rec('FINAL — 0 Runtime exceptions / console.error across suite', consoleErrors.length === 0, `errors=${consoleErrors.length}: ${JSON.stringify(consoleErrors).slice(0,400)}`);

  const passed = assertions.filter((a) => a.ok).length;
  const failed = assertions.length - passed;
  console.log('\n========================================');
  console.log(`Day 99 QA: ${passed} / ${assertions.length} assertions passed (${failed} failed)`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log('========================================\n');
  if (failed > 0) {
    console.log('Failed assertions:');
    for (const a of assertions) if (!a.ok) console.log(' ❌', a.label, '::', a.detail);
  }
  if (consoleErrors.length > 0) {
    console.log('Console errors:');
    for (const e of consoleErrors) console.log(' ⚠️', e.kind, '::', e.text);
  }
  ws.close();
  process.exit(failed > 0 || consoleErrors.length > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(2); });
