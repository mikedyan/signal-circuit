#!/usr/bin/env node
/**
 * Day 93 QA harness — Tournament Backend Worker Go-Live.
 *
 * Verifies:
 *   P1 (4): Build identity — cache-bust unified at 1780358400, sw v62,
 *           main.js HTTP body contains new RemoteTournamentAdapter shape
 *           (`refreshReachability`), worker.js + local-mock-worker.js
 *           shipped under tools/tournament-worker/.
 *   P2 (3): Cold-start surface — level-select visible, 2 non-level
 *           buttons, 43 level cards.
 *   P3 (2): Default local mode — tournamentBackend.getMode() === 'local',
 *           describe() contains '🏠'.
 *   P4 (5): Remote mode + reachable worker — getMode() === 'remote',
 *           isLive() === true, describe() contains '🌐 Live leaderboard',
 *           after submitScore(): mock worker /leaderboard/:key shows the
 *           submitted entry (proves real network round-trip), local
 *           submission still returns sync-shape with rank.
 *   P5 (3): Remote mode + unreachable worker — getMode() === 'remote-fallback',
 *           isLive() === false, describe() contains 'offline'.
 *   P6 (2): Mode toggle round-trip — set LS to 'local', reload, getMode()
 *           back to 'local'. Clear LS, reload, getMode() === 'local'.
 *   P7 (3): Regression — Day 78 staircase (40 overflow at seed=40),
 *           Day 84 Lab Bench II L42 hard cap, L1 core loop persists 3 stars.
 *   P8 (2): Console hygiene — 0 Runtime.exceptionThrown + 0 console.error.
 *
 * Total target: 24 assertions across 8 phases.
 *
 * Boots the mock worker on 127.0.0.1:8902 internally (then kills it).
 * Uses raw CDP via ws@8.20.0 from OpenClaw's node_modules (Day 86+ pattern).
 * Connects to a permissive headless Chromium at ws://127.0.0.1:9301/.
 *
 * Run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node \
 *     qa-reports/day-93-qa.cdp.js
 */

const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const APP_URL = 'http://localhost:8901/';
const CACHE_BUST = '1780358400';
const SW_VERSION = 'signal-circuit-v62';
const MOCK_PORT = 8902;
const DEAD_WORKER_URL = 'http://127.0.0.1:9999'; // intentionally not listening

const results = [];
let exceptionCount = 0;
let consoleErrorCount = 0;

function ok(name, detail) { results.push({ ok: true, name, detail }); console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail) { results.push({ ok: false, name, detail }); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
function phase(label) { console.log('\n' + label); }

function httpGet(host, port, urlPath) {
  return new Promise((resolve, reject) => {
    http.get({ host, port, path: urlPath }, (res) => {
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

async function navigateAndWait(send, query) {
  await send('Page.navigate', { url: APP_URL + '?' + query });
  await waitFor(send, 'typeof window.game === "object" && window.game !== null', 12000);
  await new Promise((r) => setTimeout(r, 350));
}

async function configureRemoteAndReload(send, workerUrl, query) {
  await evalExpr(send, `(() => {
    try {
      localStorage.setItem('signal-circuit-tournament-backend', 'remote');
      localStorage.setItem('signal-circuit-tournament-worker-url', ${JSON.stringify(workerUrl)});
    } catch (e) {}
    return true;
  })()`);
  await navigateAndWait(send, query);
}

async function clearTournamentConfigAndReload(send, query) {
  await evalExpr(send, `(() => {
    try {
      localStorage.removeItem('signal-circuit-tournament-backend');
      localStorage.removeItem('signal-circuit-tournament-worker-url');
    } catch (e) {}
    return true;
  })()`);
  await navigateAndWait(send, query);
}

function startMockWorker() {
  const scriptPath = path.resolve(__dirname, '..', 'tools', 'tournament-worker', 'local-mock-worker.js');
  if (!fs.existsSync(scriptPath)) throw new Error('mock worker missing at ' + scriptPath);
  const proc = spawn(process.execPath, [scriptPath, '--port', String(MOCK_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  proc.stdout.on('data', (d) => process.stdout.write('  [mock] ' + d.toString()));
  proc.stderr.on('data', (d) => process.stderr.write('  [mock-err] ' + d.toString()));
  return proc;
}

async function waitForMockHealthy(timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await httpGet('127.0.0.1', MOCK_PORT, '/health');
      if (r.status === 200) {
        const j = JSON.parse(r.body);
        if (j && j.ok) return true;
      }
    } catch (e) { /* keep polling */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function resetMockStore() {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: MOCK_PORT, path: '/__reset', method: 'POST' }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve(buf));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchMockBoard(weekKey) {
  const r = await httpGet('127.0.0.1', MOCK_PORT, '/leaderboard/' + encodeURIComponent(weekKey));
  return JSON.parse(r.body);
}

async function main() {
  console.log('Day 93 QA harness — Tournament Backend Worker Go-Live');
  console.log('================================================================');

  // Boot the mock worker before any browser tests
  const mock = startMockWorker();
  const healthy = await waitForMockHealthy();
  if (!healthy) {
    console.error('Mock worker failed to start; aborting harness.');
    try { mock.kill('SIGTERM'); } catch (e) {}
    process.exit(2);
  }
  console.log('  [mock-worker] healthy on port ' + MOCK_PORT);

  try {
    // ─── P1: Build identity ───
    phase('P1 — Build identity');

    const { body: html } = await httpGet('localhost', 8901, '/');
    const cacheRefs = (html.match(new RegExp(`\\?v=${CACHE_BUST}`, 'g')) || []).length;
    if (cacheRefs === 11) ok('P1.1: 11 cache-bust refs unified at ?v=' + CACHE_BUST, `${cacheRefs}/11`);
    else fail('P1.1: cache-bust refs', `expected 11, got ${cacheRefs}`);

    const { body: mainSrc } = await httpGet('localhost', 8901, `/js/main.js?v=${CACHE_BUST}`);
    if (mainSrc.includes('refreshReachability') && mainSrc.includes('TOURNAMENT_WORKER_URL_LS_KEY')) {
      ok('P1.2: main.js contains new RemoteTournamentAdapter (refreshReachability + worker URL key)');
    } else {
      fail('P1.2: main.js missing Day 93 adapter symbols');
    }

    const { body: swSrc } = await httpGet('localhost', 8901, '/sw.js');
    if (swSrc.includes(`CACHE_NAME = '${SW_VERSION}'`)) ok('P1.3: sw.js CACHE_NAME = ' + SW_VERSION);
    else fail('P1.3: sw.js CACHE_NAME', `expected ${SW_VERSION}`);

    // Worker source shipped
    const repoRoot = path.resolve(__dirname, '..');
    const wantedFiles = ['tools/tournament-worker/worker.js', 'tools/tournament-worker/wrangler.toml', 'tools/tournament-worker/local-mock-worker.js', 'tools/tournament-worker/README.md'];
    const missing = wantedFiles.filter((p) => !fs.existsSync(path.join(repoRoot, p)));
    if (missing.length === 0) ok('P1.4: tools/tournament-worker/ ships 4 files', wantedFiles.join(','));
    else fail('P1.4: missing worker files', missing.join(','));

    // ─── Connect to CDP ───
    const target = await pickTarget();
    const { send } = await cdpConnect(target.webSocketDebuggerUrl);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    try { await send('Storage.clearDataForOrigin', { origin: APP_URL.replace(/\/$/, ''), storageTypes: 'all' }); } catch (e) {}

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { Object.defineProperty(navigator, 'vibrate', { value: () => true, writable: true }); } catch (e) {}`,
    });

    // Default-mode load
    await navigateAndWait(send, 'day93p2=' + Date.now());

    // ─── P2: Cold-start surface ───
    phase('P2 — Cold-start surface');

    const levelSelectVisible = await evalExpr(send, `(() => {
      const el = document.getElementById('level-select-screen');
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    })()`);
    if (levelSelectVisible) ok('P2.1: level-select-screen visible at cold start');
    else fail('P2.1: level-select-screen NOT visible');

    const nonLevelBtns = await evalExpr(send, `(() => {
      function vis(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      let c = 0;
      if (vis('how-to-play-btn')) c++;
      if (vis('open-settings-btn')) c++;
      return c;
    })()`);
    if (nonLevelBtns === 2) ok('P2.2: 2 non-level buttons (How to Play + Settings)');
    else fail('P2.2: non-level button count', `expected 2, got ${nonLevelBtns}`);

    const levelCards = await evalExpr(send, `document.querySelectorAll('#level-select-screen .level-btn').length`);
    if (levelCards === 43) ok('P2.3: 43 level cards rendered');
    else fail('P2.3: level card count', `expected 43, got ${levelCards}`);

    // ─── P3: Default local mode ───
    phase('P3 — Default local mode (no LS overrides)');

    const localShape = await evalExpr(send, `(() => {
      const a = window.game.tournamentBackend;
      if (!a) return { error: 'no adapter' };
      return {
        mode: a.getMode ? a.getMode() : null,
        describe: a.describe ? a.describe() : null,
        isLive: a.isLive ? a.isLive() : null,
        ctor: a.constructor && a.constructor.name,
      };
    })()`);
    if (localShape && localShape.mode === 'local' && /\ud83c\udfe0|🏠/.test(localShape.describe || '')) {
      ok('P3.1: default getMode()===local + describe contains 🏠', localShape.describe.slice(0, 50));
    } else {
      fail('P3.1: default-mode shape', JSON.stringify(localShape));
    }
    if (localShape && localShape.isLive === false) ok('P3.2: default isLive()===false');
    else fail('P3.2: default isLive', JSON.stringify(localShape && localShape.isLive));

    // ─── P4: Remote mode + reachable mock worker ───
    phase('P4 — Remote configured + mock worker reachable');

    await resetMockStore();
    await configureRemoteAndReload(send, `http://127.0.0.1:${MOCK_PORT}`, 'day93p4=' + Date.now());

    // Wait for the reachability probe (kicked off in selectTournamentBackend) to land
    const reached = await waitFor(send, `(() => {
      const a = window.game.tournamentBackend;
      return a && a.getMode && a.getMode() === 'remote';
    })()`, 4000);
    if (reached) ok('P4.1: remote mode reachable — getMode()===remote');
    else fail('P4.1: remote mode never reached after configure');

    const remoteShape = await evalExpr(send, `(() => {
      const a = window.game.tournamentBackend;
      return {
        mode: a.getMode(),
        isLive: a.isLive(),
        describe: a.describe(),
        ctor: a.constructor && a.constructor.name,
      };
    })()`);
    if (remoteShape.isLive === true && /Live leaderboard/i.test(remoteShape.describe)) {
      ok('P4.2: isLive()===true + describe contains "Live leaderboard"', remoteShape.describe.slice(0, 60));
    } else {
      fail('P4.2: live-mode shape', JSON.stringify(remoteShape));
    }
    if (remoteShape.ctor === 'RemoteTournamentAdapter') ok('P4.3: adapter is RemoteTournamentAdapter');
    else fail('P4.3: adapter ctor', remoteShape.ctor);

    // Submit a score and verify the mock worker received it.
    const submission = await evalExpr(send, `(() => {
      const a = window.game.tournamentBackend;
      const sub = a.submitScore(4, 87, 'CDPHarness');
      return sub;
    })()`);
    if (submission && typeof submission.score === 'number' && submission.weekKey) {
      ok('P4.4: submitScore() returned sync-shape with score+weekKey', `score=${submission.score}, wk=${submission.weekKey}`);
    } else {
      fail('P4.4: submitScore return', JSON.stringify(submission));
    }

    // Give the fire-and-forget POST a moment to land
    let mockBoard = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      mockBoard = await fetchMockBoard(submission.weekKey);
      if (mockBoard && mockBoard.total > 0) break;
    }
    if (mockBoard && mockBoard.total >= 1 && mockBoard.entries.some((e) => e.name === 'CDPHarness' && e.score === submission.score)) {
      ok('P4.5: mock worker /leaderboard/:wk shows submitted entry', `total=${mockBoard.total}`);
    } else {
      fail('P4.5: mock worker board did NOT receive the submission', JSON.stringify(mockBoard));
    }

    // ─── P5: Remote configured + unreachable worker ───
    phase('P5 — Remote configured + worker unreachable (fallback)');

    await configureRemoteAndReload(send, DEAD_WORKER_URL, 'day93p5=' + Date.now());

    // Wait for the reachability probe to fail and the mode to settle to 'remote-fallback'
    const fellBack = await waitFor(send, `(() => {
      const a = window.game.tournamentBackend;
      return a && a.getMode && a.getMode() === 'remote-fallback';
    })()`, 4000);
    if (fellBack) ok('P5.1: unreachable worker → getMode()===remote-fallback');
    else fail('P5.1: never fell back');

    const fallbackShape = await evalExpr(send, `(() => {
      const a = window.game.tournamentBackend;
      return { mode: a.getMode(), isLive: a.isLive(), describe: a.describe() };
    })()`);
    if (fallbackShape.isLive === false) ok('P5.2: fallback isLive()===false');
    else fail('P5.2: fallback isLive', JSON.stringify(fallbackShape));

    if (/offline/i.test(fallbackShape.describe)) {
      ok('P5.3: fallback describe contains "offline"', fallbackShape.describe.slice(0, 60));
    } else {
      fail('P5.3: fallback describe', fallbackShape.describe);
    }

    // ─── P6: Mode toggle round-trip ───
    phase('P6 — Mode toggle round-trip (local)');

    await clearTournamentConfigAndReload(send, 'day93p6=' + Date.now());
    const backToLocal = await evalExpr(send, `(() => {
      const a = window.game.tournamentBackend;
      return { mode: a.getMode(), ctor: a.constructor && a.constructor.name };
    })()`);
    if (backToLocal && backToLocal.mode === 'local' && backToLocal.ctor === 'LocalTournamentAdapter') {
      ok('P6.1: after clearing LS, adapter falls back to LocalTournamentAdapter');
    } else {
      fail('P6.1: did not revert to local', JSON.stringify(backToLocal));
    }

    // Explicit 'local' setting should also resolve local
    await evalExpr(send, `localStorage.setItem('signal-circuit-tournament-backend', 'local')`);
    await navigateAndWait(send, 'day93p6b=' + Date.now());
    const explicitLocal = await evalExpr(send, `window.game.tournamentBackend.getMode()`);
    if (explicitLocal === 'local') ok('P6.2: explicit LS="local" → getMode()===local');
    else fail('P6.2: explicit local', explicitLocal);

    // ─── P7: Regression checks ───
    phase('P7 — Regression (Day 78 staircase + Day 84 L42 + L1 core loop)');

    // Reset progress and do L1
    const l1 = await evalExpr(send, `(() => {
      const gs = window.game;
      try { gs.seedProgress(0); } catch (e) {}
      gs.startLevel(1);
      const g = gs.addGate('AND', 400, 300);
      const inA = gs.inputNodes[0], inB = gs.inputNodes[1], out = gs.outputNodes[0];
      gs.addWireFromData(inA.id, 0, g.id, 0);
      gs.addWireFromData(inB.id, 0, g.id, 1);
      gs.addWireFromData(g.id, 0, out.id, 0);
      gs.runQuickTest();
      const entry = gs.progress.levels && gs.progress.levels['1'];
      return entry && entry.stars;
    })()`);
    if (l1 === 3) ok('P7.1: L1 core loop persists 3 stars');
    else fail('P7.1: L1 stars', String(l1));

    // L42 hard cap
    const l42 = await evalExpr(send, `(() => {
      const gs = window.game;
      gs.showLevelSelect();
      gs.startLevel(42);
      const hardCap = gs.currentLevel && gs.currentLevel.gateHardCap;
      for (let i = 0; i < 5; i++) gs.addGate('AND', 200 + i * 60, 300);
      const v = gs._validateLabConstraints();
      return { hardCap, ok: v.ok, msg: v.msg || v.message };
    })()`);
    if (l42 && l42.hardCap === 4 && l42.ok === false && /hard cap of 4/i.test(l42.msg || '')) {
      ok('P7.2: L42 hard cap 4 + validator rejects 5 gates');
    } else {
      fail('P7.2: L42 shape', JSON.stringify(l42));
    }

    // Day 78 staircase at seed=40
    const stair = await evalExpr(send, `(() => {
      const gs = window.game;
      gs.seedProgress(40, { stars: 3 });
      gs.showLevelSelect();
      const overflow = document.querySelectorAll('#level-select-screen .level-overflow-btn');
      let visible = 0;
      for (const b of overflow) {
        const cs = getComputedStyle(b);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') visible++;
      }
      return visible;
    })()`);
    if (stair === 40) ok('P7.3: 40 overflow buttons at seedProgress(40)');
    else fail('P7.3: overflow count', String(stair));

    // ─── P8: Console hygiene ───
    phase('P8 — Console hygiene');

    await new Promise((r) => setTimeout(r, 500));

    if (exceptionCount === 0) ok('P8.1: 0 Runtime.exceptionThrown');
    else fail('P8.1: Runtime.exceptionThrown', String(exceptionCount));

    if (consoleErrorCount === 0) ok('P8.2: 0 console.error');
    else fail('P8.2: console.error', String(consoleErrorCount));

    // ─── Summary ───
    console.log('\n================================================================');
    const pass = results.filter((r) => r.ok).length;
    const total = results.length;
    console.log(`Day 93 QA: ${pass}/${total} assertions passed`);
    console.log(`Exceptions: ${exceptionCount} · console.error: ${consoleErrorCount}`);
    if (pass !== total) {
      console.log('\nFAILED:');
      for (const r of results) if (!r.ok) console.log(`  ❌ ${r.name} — ${r.detail || ''}`);
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } finally {
    try { mock.kill('SIGTERM'); } catch (e) {}
  }
}

main().catch((e) => {
  console.error('Harness error:', e);
  process.exitCode = 2;
});
