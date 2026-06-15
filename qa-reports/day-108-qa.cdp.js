#!/usr/bin/env node
/**
 * Day 108 QA harness — Cycle 5 BUILD Week Day 2: Tournament Worker Go-Live.
 *
 * Today's net change vs. Day 93 (which shipped the adapter shell):
 *   1. Roadmap-spec POST /submit/:weekKey URL-keyed alias added to worker.js
 *      + local-mock-worker.js (legacy POST /scores still works).
 *   2. wrangler.toml binding renamed to TOURNAMENT_KV per roadmap; worker.js
 *      reads either env.TOURNAMENT_KV or env.SIGNAL_CIRCUIT_TOURNAMENT.
 *   3. RemoteTournamentAdapter gains getRemoteEntries(weekKey) + a
 *      lightweight onBoardUpdate(weekKey, cb) listener so the rendered
 *      leaderboard can surface real cloud entries asynchronously.
 *   4. ui.js _renderTournamentLeaderboard() merges cloud entries into the
 *      top-10 view when in remote mode + non-empty cloud cache.
 *   5. CSS .tournament-row-cloud cyan-tinted variant for cloud-sourced rows.
 *
 * Phases:
 *   P1 Build identity         — 11 ?v=1781136000 refs, sw v70, game live
 *   P2 Local default          — backend is LocalTournamentAdapter, mode='local'
 *   P3 Remote configured      — LS flags set, reload, RemoteTournamentAdapter,
 *                                mode flips to 'remote' after async probe
 *   P4 submitScore goes live  — POST lands in mock worker; GET /leaderboard/:wk
 *                                shows the submitted entry
 *   P5 Cloud rows render      — tournament screen shows .tournament-row-cloud
 *                                rows with 🌐 prefix
 *   P6 Offline fallback       — kill mock, reload, mode='remote-fallback',
 *                                leaderboard falls back to local pseudo-board
 *   P7 Roadmap POST /submit/:weekKey route alias works
 *   P8 Day 78 / 79 / 107 regression invariants
 *   P9 Console hygiene        — 0 console.error, 0 Runtime.exceptionThrown
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301 (--remote-allow-origins=*)
 *   - (this script spawns + kills the mock worker on 8902 itself)
 *
 * Usage:
 *   node qa-reports/day-108-qa.cdp.js
 */

const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const MOCK_PORT = 8902;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;

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
  const detailStr = (detail === undefined) ? '' : ' — ' + ((JSON.stringify(detail) || String(detail)).slice(0, 220));
  console.log(`[${tag}] ${name}${cond ? '' : detailStr}`);
}

function nodeFetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isPost = opts.method === 'POST';
    const headers = Object.assign({}, opts.headers || {});
    let bodyBuf = null;
    if (isPost && opts.body !== undefined) {
      bodyBuf = Buffer.from(opts.body, 'utf8');
      headers['Content-Length'] = String(bodyBuf.length);
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      method: opts.method || 'GET',
      path: u.pathname + u.search,
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { /* keep null */ }
        resolve({ status: res.statusCode, body: parsed, raw: text });
      });
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

async function waitForHttp(url, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await nodeFetchJson(url);
      if (r.status && r.body && r.body.ok) return true;
    } catch (e) { /* keep polling */ }
    await sleep(120);
  }
  return false;
}

async function getWsUrl() {
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

function spawnMockWorker() {
  const script = path.resolve(__dirname, '..', 'tools', 'tournament-worker', 'local-mock-worker.js');
  const child = spawn('node', [script, '--port', String(MOCK_PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.log(`[mock] ${s}`);
  });
  child.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.log(`[mock-err] ${s}`);
  });
  return child;
}

function killMockWorker(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) return resolve();
    child.once('exit', () => resolve());
    try { child.kill('SIGTERM'); } catch (e) { resolve(); }
    setTimeout(() => resolve(), 1500);
  });
}

async function navigateAndWait(url) {
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
  // ── Boot the mock worker ────────────────────────────────────────────
  console.log('Booting local-mock-worker on port', MOCK_PORT);
  let mock = spawnMockWorker();
  const mockReady = await waitForHttp(MOCK_URL + '/health');
  if (!mockReady) {
    console.error('Mock worker did not become reachable on /health');
    process.exit(2);
  }

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

  await navigateAndWait(TARGET_URL);

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    (
      Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=1781136000')).length +
      Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=1781136000')).length
    )
  `);
  assert('P1.1 11 cache-bust refs at ?v=1781136000', vCount === 11, { vCount });

  const gameLive = await evalExpr(`!!window.game && !!window.game.tournamentBackend && !!window.game.weeklyTournament`);
  assert('P1.2 window.game + tournamentBackend + weeklyTournament live', gameLive === true);

  // ── P2 Local default ────────────────────────────────────────────────
  console.log('\n── P2 Local default ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_local');
  await sleep(400);

  const localShape = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    describe: window.game.tournamentBackend.describe(),
    isLocal: window.game.tournamentBackend instanceof window.LocalTournamentAdapter,
    isRemote: window.game.tournamentBackend instanceof window.RemoteTournamentAdapter,
    getRemoteEntries: typeof window.game.tournamentBackend.getRemoteEntries,
    onBoardUpdate: typeof window.game.tournamentBackend.onBoardUpdate,
  })`);
  assert('P2.1 default mode = "local"', localShape.mode === 'local', localShape);
  assert('P2.2 describe = local emoji', localShape.describe && localShape.describe.includes('Local leaderboard'), localShape);
  assert('P2.3 backend is LocalTournamentAdapter', localShape.isLocal === true, localShape);
  assert('P2.4 backend is NOT RemoteTournamentAdapter', localShape.isRemote === false, localShape);
  assert('P2.5 getRemoteEntries is a function (base-class no-op on Local)', localShape.getRemoteEntries === 'function', localShape);
  assert('P2.6 onBoardUpdate is a function (base-class no-op on Local)', localShape.onBoardUpdate === 'function', localShape);

  const localRemoteEntries = await evalExpr(`window.game.tournamentBackend.getRemoteEntries('2026-W25')`);
  assert('P2.7 Local.getRemoteEntries() returns null', localRemoteEntries === null, { localRemoteEntries });

  // ── P3 Remote configured + reachable ─────────────────────────────────
  console.log('\n── P3 Remote configured ──');
  await evalExpr(`
    localStorage.setItem('signal-circuit-tournament-backend', 'remote');
    localStorage.setItem('signal-circuit-tournament-worker-url', '${MOCK_URL}');
  `);
  await navigateAndWait(TARGET_URL + '_remote');
  await sleep(400);

  const remoteShape = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    describe: window.game.tournamentBackend.describe(),
    isRemote: window.game.tournamentBackend instanceof window.RemoteTournamentAdapter,
    workerUrl: window.game.tournamentBackend.config && window.game.tournamentBackend.config.workerUrl,
  })`);
  assert('P3.1 backend is RemoteTournamentAdapter', remoteShape.isRemote === true, remoteShape);
  assert('P3.2 workerUrl wired through', remoteShape.workerUrl === MOCK_URL, remoteShape);
  // probe may still be in flight on first read — wait for refresh to land
  await evalExpr(`window.game.tournamentBackend.refreshReachability()`, true);
  await sleep(200);
  const remoteAfterProbe = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    describe: window.game.tournamentBackend.describe(),
    isLive: window.game.tournamentBackend.isLive(),
  })`);
  assert('P3.3 mode after probe = "remote"', remoteAfterProbe.mode === 'remote', remoteAfterProbe);
  assert('P3.4 isLive() === true', remoteAfterProbe.isLive === true, remoteAfterProbe);
  assert('P3.5 describe = Live leaderboard', remoteAfterProbe.describe && remoteAfterProbe.describe.includes('Live leaderboard'), remoteAfterProbe);

  // ── P4 submitScore goes live ────────────────────────────────────────
  console.log('\n── P4 submitScore goes live ──');
  // Reset mock store for a clean assertion
  await nodeFetchJson(MOCK_URL + '/__reset', { method: 'POST', body: '{}' });

  const weekInfo = await evalExpr(`window.game.weeklyTournament.getCurrentWeekInfo()`);
  const weekKey = weekInfo && weekInfo.key;
  assert('P4.1 current weekKey matches YYYY-Www', /^\d{4}-W\d{2}$/.test(weekKey || ''), { weekKey });

  // Submit through the live adapter (this fires POST /scores in the background)
  const submitted = await evalExpr(`
    (function() {
      const r = window.game.tournamentBackend.submitScore(3, 25, 'Mochi');
      return { score: r && r.score, rank: r && r.rank, isNewBest: r && r.isNewBest };
    })()
  `);
  assert('P4.2 local submission returned a payload', submitted && typeof submitted.score === 'number', submitted);

  // Allow the async POST to land in the mock store
  await sleep(700);
  const leaderboard = await nodeFetchJson(`${MOCK_URL}/leaderboard/${encodeURIComponent(weekKey)}`);
  const cloudEntries = (leaderboard && leaderboard.body && leaderboard.body.entries) || [];
  assert('P4.3 mock worker received the POST and stored 1 entry', cloudEntries.length === 1, { total: cloudEntries.length, status: leaderboard.status });
  const cloudEntry = cloudEntries[0] || {};
  assert('P4.4 stored entry has gates=3, time=25, name=Mochi', cloudEntry.gates === 3 && cloudEntry.time === 25 && cloudEntry.name === 'Mochi', cloudEntry);
  assert('P4.5 stored score = local-submission score', cloudEntry.score === submitted.score, { stored: cloudEntry.score, local: submitted.score });

  // ── P5 Cloud rows render in the tournament screen ───────────────────
  console.log('\n── P5 Cloud rows render ──');

  // Seed two extra cloud-only entries so the rendered board has visible cloud rows
  await nodeFetchJson(`${MOCK_URL}/submit/${encodeURIComponent(weekKey)}`, {
    method: 'POST',
    body: JSON.stringify({ gates: 2, time: 18, score: 218, name: 'CloudPlayerA' }),
  });
  await nodeFetchJson(`${MOCK_URL}/submit/${encodeURIComponent(weekKey)}`, {
    method: 'POST',
    body: JSON.stringify({ gates: 4, time: 90, score: 430, name: 'CloudPlayerB' }),
  });

  // Open the tournament screen (which kicks getLeaderboard + onBoardUpdate listener)
  await evalExpr(`window.game.ui.showTournamentScreen()`);
  await sleep(900); // wait for async fetch + onBoardUpdate repaint

  const renderSnapshot = await evalExpr(`({
    leaderboardRows: document.querySelectorAll('#tournament-leaderboard .tournament-row').length,
    cloudRows: document.querySelectorAll('#tournament-leaderboard .tournament-row-cloud').length,
    selfCloudRows: document.querySelectorAll('#tournament-leaderboard .tournament-row-cloud.tournament-row-self').length,
    namesHtml: document.querySelectorAll('#tournament-leaderboard .trow-name').length,
    firstName: (document.querySelector('#tournament-leaderboard .trow-name') || {}).textContent || '',
    modeLabel: (document.getElementById('tournament-mode-label') || {}).textContent || '',
    cachedRemote: !!(window.game.tournamentBackend.getRemoteEntries('${weekKey}') || []).length,
  })`);
  assert('P5.1 leaderboard has at least 3 rendered rows', renderSnapshot.leaderboardRows >= 3, renderSnapshot);
  assert('P5.2 rows carry .tournament-row-cloud class', renderSnapshot.cloudRows >= 3, renderSnapshot);
  assert('P5.3 exactly one self-cloud row (Mochi submission)', renderSnapshot.selfCloudRows === 1, renderSnapshot);
  assert('P5.4 first-row name shows 🌐 or ⭐ prefix', /^(🌐|⭐)/.test(renderSnapshot.firstName), renderSnapshot);
  assert('P5.5 mode label = Live leaderboard', renderSnapshot.modeLabel.includes('Live leaderboard'), renderSnapshot);
  assert('P5.6 backend remoteBoardCache populated', renderSnapshot.cachedRemote === true, renderSnapshot);

  // ── P6 Offline fallback ─────────────────────────────────────────────
  console.log('\n── P6 Offline fallback ──');
  await killMockWorker(mock);
  mock = null;
  await sleep(300);

  await evalExpr(`window.game.tournamentBackend.refreshReachability()`, true);
  await sleep(200);

  const offlineMode = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    describe: window.game.tournamentBackend.describe(),
    isLive: window.game.tournamentBackend.isLive(),
  })`);
  assert('P6.1 mode drops to "remote-fallback"', offlineMode.mode === 'remote-fallback', offlineMode);
  assert('P6.2 isLive() === false on fallback', offlineMode.isLive === false, offlineMode);
  assert('P6.3 describe = "Live · offline"', offlineMode.describe && offlineMode.describe.includes('offline'), offlineMode);

  // The leaderboard should fall back to the local pseudo-board on next render.
  // Force a fresh getLeaderboard + re-render. Cache may still hold prior cloud
  // entries, so getMode!='remote' is the gate that flips us back to the local
  // pseudo-board path.
  await evalExpr(`window.game.ui._renderTournamentLeaderboard()`);
  await sleep(150);

  const fallbackRender = await evalExpr(`({
    cloudRows: document.querySelectorAll('#tournament-leaderboard .tournament-row-cloud').length,
    rows: document.querySelectorAll('#tournament-leaderboard .tournament-row').length,
    firstName: (document.querySelector('#tournament-leaderboard .trow-name') || {}).textContent || '',
  })`);
  assert('P6.4 leaderboard reverts to pseudo-board (no cloud rows)', fallbackRender.cloudRows === 0 && fallbackRender.rows === 10, fallbackRender);
  assert('P6.5 no row shows 🌐 prefix on fallback', !/^🌐/.test(fallbackRender.firstName), fallbackRender);

  // A submitScore on fallback should still write locally (the unhappy-path
  // protection that prevents gameplay from blocking on the network).
  const offlineSubmit = await evalExpr(`
    (function() {
      const r = window.game.tournamentBackend.submitScore(5, 40, 'OfflinePlayer');
      return { score: r && r.score, rank: r && r.rank };
    })()
  `);
  assert('P6.6 submitScore on fallback still returns a local payload', offlineSubmit && typeof offlineSubmit.score === 'number', offlineSubmit);

  // ── P7 Roadmap-spec POST /submit/:weekKey route ─────────────────────
  console.log('\n── P7 Roadmap POST /submit/:weekKey route ──');
  // Re-spawn the mock worker to test the route directly via Node.
  mock = spawnMockWorker();
  const mockReady2 = await waitForHttp(MOCK_URL + '/health');
  if (!mockReady2) {
    assert('P7.0 mock worker re-spawned reachable', false, { mockReady2 });
  } else {
    assert('P7.0 mock worker re-spawned reachable', true);
  }

  await nodeFetchJson(MOCK_URL + '/__reset', { method: 'POST', body: '{}' });

  const submitAlias = await nodeFetchJson(`${MOCK_URL}/submit/${encodeURIComponent(weekKey)}`, {
    method: 'POST',
    body: JSON.stringify({ gates: 6, time: 120, score: 660, name: 'AliasUser' }),
  });
  assert('P7.1 POST /submit/:weekKey returns 200', submitAlias.status === 200, submitAlias);
  assert('P7.2 alias response.ok === true', submitAlias.body && submitAlias.body.ok === true, submitAlias.body);
  assert('P7.3 alias response.weekKey echoed', submitAlias.body && submitAlias.body.weekKey === weekKey, submitAlias.body);
  assert('P7.4 alias response.rank === 1', submitAlias.body && submitAlias.body.rank === 1, submitAlias.body);

  // Confirm legacy /scores still works alongside.
  const legacyScores = await nodeFetchJson(MOCK_URL + '/scores', {
    method: 'POST',
    body: JSON.stringify({ weekKey, gates: 5, time: 60, score: 500, name: 'LegacyUser' }),
  });
  assert('P7.5 legacy POST /scores still returns 200', legacyScores.status === 200, legacyScores.body);

  const lbAfter = await nodeFetchJson(`${MOCK_URL}/leaderboard/${encodeURIComponent(weekKey)}`);
  assert('P7.6 leaderboard has 2 entries after alias + legacy POSTs', lbAfter.body && lbAfter.body.total === 2, lbAfter.body);

  // Invalid week key rejected.
  const badAlias = await nodeFetchJson(`${MOCK_URL}/submit/notaweek`, {
    method: 'POST',
    body: JSON.stringify({ gates: 1, time: 10, score: 100, name: 'X' }),
  });
  assert('P7.7 POST /submit/:badweekkey returns 400', badAlias.status === 400, badAlias);

  // ── P8 Regression invariants ────────────────────────────────────────
  console.log('\n── P8 Regression invariants ──');

  // Clean state for cold-start probes
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_regression');
  await sleep(400);

  const coldNavBtns = await evalExpr(`
    Array.from(document.querySelectorAll('#level-select-screen button')).filter(b => {
      const r = b.getBoundingClientRect();
      return !b.classList.contains('level-btn') &&
             !b.classList.contains('level-overflow-btn') &&
             !b.closest('.level-overflow-popover') &&
             b.offsetParent !== null && r.width > 0 && r.height > 0;
    }).length
  `);
  assert('P8.1 cold-start non-level button count = 2 (Day 78)', coldNavBtns === 2, { coldNavBtns });

  const cardCount = await evalExpr(`document.querySelectorAll('#level-select-screen .level-btn').length`);
  assert('P8.2 45 level cards visible cold (Day 103)', cardCount === 45, { cardCount });

  const day79Dead = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P8.3 Day 79 dead-id showFirstLaunchDifficultyModal undefined', day79Dead.showFirstLaunchDifficultyModal === 'undefined', day79Dead);
  assert('P8.4 Day 79 #weekly-puzzle-btn DOM absent', day79Dead.weeklyPuzzleBtn === false, day79Dead);

  const day107Mod = await evalExpr(`({
    Wire: typeof window.Wire,
    WireManager: typeof window.WireManager,
    Gate: typeof window.Gate,
    GateTypes: typeof window.GateTypes,
  })`);
  assert('P8.5 Day 107 window.Wire / WireManager still classes', day107Mod.Wire === 'function' && day107Mod.WireManager === 'function', day107Mod);
  assert('P8.6 Day 92 window.Gate / GateTypes still bound', day107Mod.Gate === 'function' && day107Mod.GateTypes === 'object', day107Mod);

  const swReg = await evalExpr(`
    navigator.serviceWorker.getRegistration().then(r => r ? { active: !!r.active } : null)
  `, true);
  assert('P8.7 service worker registration active', swReg && swReg.active === true, swReg);

  // ── P9 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P9 Console hygiene ──');
  assert('P9.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P9.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

  // Tear down mock worker
  await killMockWorker(mock);

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n═════ SUMMARY ═════`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length}; exceptions: ${exceptions.length}`);
  if (passed !== total) {
    console.log('\nFAILED:');
    results.filter((r) => !r.pass).forEach((r) => console.log('  - ' + r.name + ' ' + JSON.stringify(r.detail || '').slice(0, 220)));
    process.exit(1);
  }
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(2);
});
