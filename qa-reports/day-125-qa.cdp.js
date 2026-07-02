#!/usr/bin/env node
/**
 * Day 125 QA harness — Cycle 6 BUILD Week Day 3:
 * Tournament Worker production-readiness + opt-in display name.
 *
 * What shipped today:
 *   1. Settings → Tournament (Online) surface: worker-URL input + 🔌 Connect /
 *      🏠 Go Local buttons + a connection-status chip (Day 93 4-state describe()
 *      vocabulary), and an opt-in display-name input + 💾 Save / 🖩 Anonymous.
 *   2. GameState.reconfigureTournamentBackend() re-selects the backend live
 *      (no reload) when the worker URL / mode changes.
 *   3. Privacy: RemoteTournamentAdapter.submitScore() POSTs a personal name
 *      ONLY when the opt-in display name is set; otherwise name:"Anonymous"
 *      + anonymous:true. The daily-leaderboard name never leaks to the cloud.
 *   4. tools/tournament-worker/deploy.sh — idempotent deploy helper.
 *
 * Phases:
 *   P1 Build identity        — 11 ?v=1782864000 refs, sw v79, game live
 *   P2 Local default + surface present, accessors exposed, name empty cold
 *   P3 Connect via Settings button → backend flips to remote, mode='remote'
 *   P4 Privacy: anonymous default POSTs "Anonymous"; opt-in name POSTs the name
 *   P5 Go Local button → back to LocalTournamentAdapter, status chip local
 *   P6 Offline fallback → mode='remote-fallback' after mock killed
 *   P7 Regression invariants (Day 78 / 79 / 92 / 107 / 123 ESM)
 *   P8 Console hygiene
 *
 * Prereqs:
 *   - tools/cdp-launch.sh start   (static server 8901 + headless Chromium 9301)
 *   - (this script spawns + kills the mock worker on 8902 itself)
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-125-qa.cdp.js
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
const V = '1782864000';

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
      Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=${V}')).length +
      Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=${V}')).length
    )
  `);
  assert(`P1.1 11 cache-bust refs at ?v=${V}`, vCount === 11, { vCount });
  const gameLive = await evalExpr(`!!window.game && !!window.game.tournamentBackend && !!window.game.weeklyTournament`);
  assert('P1.2 window.game + tournamentBackend + weeklyTournament live', gameLive === true);
  const swVer = await evalExpr(`fetch('sw.js?probe=' + Date.now()).then(r=>r.text()).then(t=>{const m=t.match(/signal-circuit-v(\\d+)/);return m?m[1]:null;})`, true);
  assert('P1.3 sw.js CACHE_NAME = signal-circuit-v79', swVer === '79', { swVer });

  // ── P2 Local default + surface present ──────────────────────────────
  console.log('\n── P2 Local default + surface ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_local');
  await sleep(400);

  const p2 = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    isLocal: window.game.tournamentBackend instanceof window.LocalTournamentAdapter,
    getName: typeof window.getTournamentDisplayName,
    setName: typeof window.setTournamentDisplayName,
    clearName: typeof window.clearTournamentDisplayName,
    nameCold: window.getTournamentDisplayName(),
    reconfigure: typeof window.game.reconfigureTournamentBackend,
    urlInput: !!document.getElementById('tournament-worker-url-input'),
    saveBtn: !!document.getElementById('tournament-worker-save-btn'),
    clearBtn: !!document.getElementById('tournament-worker-clear-btn'),
    nameInput: !!document.getElementById('tournament-display-name-input'),
    statusEl: !!document.getElementById('tournament-connection-status'),
  })`);
  assert('P2.1 default mode = "local"', p2.mode === 'local', p2);
  assert('P2.2 backend is LocalTournamentAdapter', p2.isLocal === true, p2);
  assert('P2.3 display-name accessors exposed on window', p2.getName === 'function' && p2.setName === 'function' && p2.clearName === 'function', p2);
  assert('P2.4 cold display name is empty (anonymous default)', p2.nameCold === '', p2);
  assert('P2.5 reconfigureTournamentBackend() present', p2.reconfigure === 'function', p2);
  assert('P2.6 Settings tournament surface DOM present', p2.urlInput && p2.saveBtn && p2.clearBtn && p2.nameInput && p2.statusEl, p2);

  // Open Settings so renderTournamentSettings() paints the chip + inputs.
  const p2render = await evalExpr(`
    (function(){
      window.game.ui.renderTournamentSettings();
      return {
        urlVal: document.getElementById('tournament-worker-url-input').value,
        nameVal: document.getElementById('tournament-display-name-input').value,
        status: document.getElementById('tournament-connection-status').textContent,
        statusMode: document.getElementById('tournament-connection-status').getAttribute('data-mode'),
      };
    })()
  `);
  assert('P2.7 cold URL input empty', p2render.urlVal === '', p2render);
  assert('P2.8 cold name input empty', p2render.nameVal === '', p2render);
  assert('P2.9 status chip = Local leaderboard, data-mode=local', p2render.status.includes('Local leaderboard') && p2render.statusMode === 'local', p2render);

  // ── P3 Connect via Settings button ──────────────────────────────────
  console.log('\n── P3 Connect via Settings button ──');
  const p3set = await evalExpr(`
    (function(){
      const input = document.getElementById('tournament-worker-url-input');
      input.value = '${MOCK_URL}';
      document.getElementById('tournament-worker-save-btn').click();
      return {
        lsUrl: localStorage.getItem('signal-circuit-tournament-worker-url'),
        lsBackend: localStorage.getItem('signal-circuit-tournament-backend'),
        isRemote: window.game.tournamentBackend instanceof window.RemoteTournamentAdapter,
        cfgUrl: window.game.tournamentBackend.config && window.game.tournamentBackend.config.workerUrl,
      };
    })()
  `);
  assert('P3.1 worker URL persisted to localStorage', p3set.lsUrl === MOCK_URL, p3set);
  assert('P3.2 backend LS flag flipped to remote', p3set.lsBackend === 'remote', p3set);
  assert('P3.3 live backend is now RemoteTournamentAdapter', p3set.isRemote === true, p3set);
  assert('P3.4 worker URL wired into adapter config', p3set.cfgUrl === MOCK_URL, p3set);

  await evalExpr(`window.game.tournamentBackend.refreshReachability()`, true);
  await sleep(200);
  const p3mode = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    isLive: window.game.tournamentBackend.isLive(),
    describe: window.game.tournamentBackend.describe(),
  })`);
  assert('P3.5 mode after probe = "remote"', p3mode.mode === 'remote', p3mode);
  assert('P3.6 isLive() === true', p3mode.isLive === true, p3mode);
  assert('P3.7 describe = Live leaderboard', p3mode.describe.includes('Live leaderboard'), p3mode);

  const p3chip = await evalExpr(`
    (function(){
      window.game.ui.updateTournamentConnectionStatus();
      return {
        status: document.getElementById('tournament-connection-status').textContent,
        statusMode: document.getElementById('tournament-connection-status').getAttribute('data-mode'),
      };
    })()
  `);
  assert('P3.8 status chip reflects remote (Live + data-mode=remote)', p3chip.status.includes('Live') && p3chip.statusMode === 'remote', p3chip);

  // ── P4 Privacy: anonymous default vs opt-in name ────────────────────
  console.log('\n── P4 Privacy: anonymous default vs opt-in name ──');
  const weekInfo = await evalExpr(`window.game.weeklyTournament.getCurrentWeekInfo()`);
  const weekKey = weekInfo && weekInfo.key;
  assert('P4.1 current weekKey matches YYYY-Www', /^\d{4}-W\d{2}$/.test(weekKey || ''), { weekKey });

  // 4a. Anonymous default: no display name set → POST carries "Anonymous"
  await nodeFetchJson(MOCK_URL + '/__reset', { method: 'POST', body: '{}' });
  await evalExpr(`window.clearTournamentDisplayName()`);
  await evalExpr(`window.game.tournamentBackend.submitScore(3, 25, 'You')`);
  await sleep(700);
  const anonLb = await nodeFetchJson(`${MOCK_URL}/leaderboard/${encodeURIComponent(weekKey)}`);
  const anonEntries = (anonLb.body && anonLb.body.entries) || [];
  assert('P4.2 anonymous default: mock stored exactly 1 entry', anonEntries.length === 1, { total: anonEntries.length });
  assert('P4.3 anonymous default: POSTed name = "Anonymous" (daily name NOT leaked)', anonEntries[0] && anonEntries[0].name === 'Anonymous', anonEntries[0]);

  // 4b. Opt-in: set display name via the accessor → POST carries the name
  await nodeFetchJson(MOCK_URL + '/__reset', { method: 'POST', body: '{}' });
  const savedName = await evalExpr(`window.setTournamentDisplayName('Mochi🐯 the tiger overflow')`);
  assert('P4.4 setTournamentDisplayName trims/clamps to <=16 chars', typeof savedName === 'string' && savedName.length <= 16 && savedName.startsWith('Mochi'), { savedName });
  assert('P4.5 getTournamentDisplayName round-trips the saved value', (await evalExpr(`window.getTournamentDisplayName()`)) === savedName, { savedName });
  await evalExpr(`window.game.tournamentBackend.submitScore(2, 18, 'You')`);
  await sleep(700);
  const namedLb = await nodeFetchJson(`${MOCK_URL}/leaderboard/${encodeURIComponent(weekKey)}`);
  const namedEntries = (namedLb.body && namedLb.body.entries) || [];
  assert('P4.6 opt-in: mock stored exactly 1 entry', namedEntries.length === 1, { total: namedEntries.length });
  assert('P4.7 opt-in: POSTed name = saved display name', namedEntries[0] && namedEntries[0].name === savedName, namedEntries[0]);

  // 4c. Save via the Settings button path too (real wiring)
  const p4btn = await evalExpr(`
    (function(){
      const input = document.getElementById('tournament-display-name-input');
      input.value = 'ButtonName';
      document.getElementById('tournament-name-save-btn').click();
      return { stored: window.getTournamentDisplayName(), inputVal: input.value };
    })()
  `);
  assert('P4.8 Save Name button persists the display name', p4btn.stored === 'ButtonName' && p4btn.inputVal === 'ButtonName', p4btn);

  // 4d. Anonymous button clears it
  const p4clr = await evalExpr(`
    (function(){
      document.getElementById('tournament-name-clear-btn').click();
      return { stored: window.getTournamentDisplayName(), inputVal: document.getElementById('tournament-display-name-input').value };
    })()
  `);
  assert('P4.9 Anonymous button clears the display name', p4clr.stored === '' && p4clr.inputVal === '', p4clr);

  // ── P5 Go Local button ──────────────────────────────────────────────
  console.log('\n── P5 Go Local button ──');
  const p5 = await evalExpr(`
    (function(){
      document.getElementById('tournament-worker-clear-btn').click();
      return {
        lsUrl: localStorage.getItem('signal-circuit-tournament-worker-url'),
        lsBackend: localStorage.getItem('signal-circuit-tournament-backend'),
        isLocal: window.game.tournamentBackend instanceof window.LocalTournamentAdapter,
        mode: window.game.tournamentBackend.getMode(),
        urlVal: document.getElementById('tournament-worker-url-input').value,
        statusMode: document.getElementById('tournament-connection-status').getAttribute('data-mode'),
      };
    })()
  `);
  assert('P5.1 Go Local clears worker URL from localStorage', !p5.lsUrl, p5);
  assert('P5.2 backend LS flag back to local', p5.lsBackend === 'local', p5);
  assert('P5.3 live backend is LocalTournamentAdapter again', p5.isLocal === true, p5);
  assert('P5.4 mode = local, url input cleared, chip data-mode=local', p5.mode === 'local' && p5.urlVal === '' && p5.statusMode === 'local', p5);

  // ── P6 Offline fallback ─────────────────────────────────────────────
  console.log('\n── P6 Offline fallback ──');
  // Reconnect to the mock, confirm remote, then kill the mock and probe.
  await evalExpr(`
    localStorage.setItem('signal-circuit-tournament-worker-url', '${MOCK_URL}');
    localStorage.setItem('signal-circuit-tournament-backend', 'remote');
    window.game.reconfigureTournamentBackend();
    true;
  `);
  await evalExpr(`window.game.tournamentBackend.refreshReachability()`, true);
  await sleep(150);
  const preKill = await evalExpr(`window.game.tournamentBackend.getMode()`);
  assert('P6.1 reconnected mode = "remote" before kill', preKill === 'remote', { preKill });

  await killMockWorker(mock);
  mock = null;
  await sleep(300);
  await evalExpr(`window.game.tournamentBackend.refreshReachability()`, true);
  await sleep(200);
  const offline = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    isLive: window.game.tournamentBackend.isLive(),
    describe: window.game.tournamentBackend.describe(),
  })`);
  assert('P6.2 mode drops to "remote-fallback"', offline.mode === 'remote-fallback', offline);
  assert('P6.3 isLive() === false on fallback', offline.isLive === false, offline);
  assert('P6.4 describe = "Live · offline"', offline.describe.includes('offline'), offline);
  // submitScore on fallback still writes locally (never blocks gameplay)
  const offlineSubmit = await evalExpr(`
    (function(){ const r = window.game.tournamentBackend.submitScore(5, 40, 'You'); return { score: r && r.score }; })()
  `);
  assert('P6.5 submitScore on fallback still returns a local payload', offlineSubmit && typeof offlineSubmit.score === 'number', offlineSubmit);

  // ── P7 Regression invariants ────────────────────────────────────────
  console.log('\n── P7 Regression invariants ──');
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
  assert('P7.1 cold-start non-level button count = 2 (Day 78)', coldNavBtns === 2, { coldNavBtns });
  const cardCount = await evalExpr(`document.querySelectorAll('#level-select-screen .level-btn').length`);
  assert('P7.2 50 level cards visible cold (Day 109)', cardCount === 50, { cardCount });

  const day79 = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P7.3 Day 79 dead-id showFirstLaunchDifficultyModal undefined', day79.showFirstLaunchDifficultyModal === 'undefined', day79);
  assert('P7.4 Day 79 #weekly-puzzle-btn DOM absent', day79.weeklyPuzzleBtn === false, day79);

  const esm = await evalExpr(`({
    Gate: typeof window.Gate,
    GateTypes: typeof window.GateTypes,
    Wire: typeof window.Wire,
    WireManager: typeof window.WireManager,
    Simulation: typeof window.Simulation,
    simInstance: window.game.simulation instanceof window.Simulation,
  })`);
  assert('P7.5 Day 92 window.Gate / GateTypes bound', esm.Gate === 'function' && esm.GateTypes === 'object', esm);
  assert('P7.6 Day 107 window.Wire / WireManager bound', esm.Wire === 'function' && esm.WireManager === 'function', esm);
  assert('P7.7 Day 123 window.Simulation bound + instance identity', esm.Simulation === 'function' && esm.simInstance === true, esm);

  const swReg = await evalExpr(`navigator.serviceWorker.getRegistration().then(r => r ? { active: !!r.active } : null)`, true);
  assert('P7.8 service worker registration active', swReg && swReg.active === true, swReg);

  // Cold default backend after clean load = local + anonymous
  const coldBackend = await evalExpr(`({
    mode: window.game.tournamentBackend.getMode(),
    name: window.getTournamentDisplayName(),
  })`);
  assert('P7.9 cold backend = local + anonymous', coldBackend.mode === 'local' && coldBackend.name === '', coldBackend);

  // ── P8 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P8 Console hygiene ──');
  assert('P8.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P8.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

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
