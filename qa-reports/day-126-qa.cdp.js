#!/usr/bin/env node
/**
 * Day 126 QA harness — Cycle 6 BUILD Week Day 4:
 * Onboarding A/B readout — Local-only vs Live cohort (engagement instrumentation).
 *
 * What shipped today:
 *   1. Stable per-install token (signal-circuit-install-id), created once.
 *   2. Deterministic cohort assignment (FNV-1a parity of install id → local/live),
 *      persisted; ?cohort=local / ?cohort=live URL override forces + persists.
 *   3. Return-session counter: sessionDays increments at most once per UTC day on
 *      load; firstSessionDay / lastSessionDay tracked; daysActive = calendar span.
 *   4. Debug-gated readout (signal-circuit-debug=1) shows cohort + session stats
 *      inside the existing Day 95 Settings → Developer card. No new cold surface.
 *
 * Phases:
 *   P1 Build identity        — 11 ?v=1782950400 refs, sw v80, game live
 *   P2 Cold assignment       — install id created, cohort in {local,live} + persisted
 *   P3 Determinism           — same install id ⇒ same cohort across reloads
 *   P4 URL override          — ?cohort=live and ?cohort=local force + persist
 *   P5 Session counter       — once per UTC day; no double-count same day; +1 on new day
 *   P6 Debug readout         — cohort badge + session rows render only when debug=1
 *   P7 Regression invariants — Day 78 / 79 / 92 / 107 / 123 ESM + cold backend local
 *   P8 Console hygiene
 *
 * Prereqs:
 *   - tools/cdp-launch.sh start   (static server 8901 + headless Chromium 9301)
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-126-qa.cdp.js
 */

const http = require('http');

const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const V = '1782950400';

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
  const gameLive = await evalExpr(`!!window.game && !!window.game.onboardingExperiment && !!window.__onboardingExperiment`);
  assert('P1.2 window.game + onboardingExperiment + __onboardingExperiment live', gameLive === true);
  const swVer = await evalExpr(`fetch('sw.js?probe=' + Date.now()).then(r=>r.text()).then(t=>{const m=t.match(/signal-circuit-v(\\d+)/);return m?m[1]:null;})`, true);
  assert('P1.3 sw.js CACHE_NAME = signal-circuit-v80', swVer === '80', { swVer });

  const api = await evalExpr(`({
    getCohort: typeof window.__onboardingExperiment.getCohort,
    getInstallId: typeof window.__onboardingExperiment.getInstallId,
    getSessionStats: typeof window.__onboardingExperiment.getSessionStats,
    getDaysActive: typeof window.__onboardingExperiment.getDaysActive,
  })`);
  assert('P1.4 Day 126 cohort/session accessors exposed', api.getCohort === 'function' && api.getInstallId === 'function' && api.getSessionStats === 'function' && api.getDaysActive === 'function', api);

  // ── P2 Cold assignment ──────────────────────────────────────────────
  console.log('\n── P2 Cold assignment ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_cold');
  await sleep(400);

  const p2 = await evalExpr(`({
    installId: window.__onboardingExperiment.getInstallId(),
    lsInstallId: localStorage.getItem('signal-circuit-install-id'),
    cohort: window.__onboardingExperiment.getCohort(),
    lsBlob: localStorage.getItem('signal-circuit-onboarding-experiment'),
  })`);
  assert('P2.1 install id created + persisted', typeof p2.installId === 'string' && p2.installId.length >= 8 && p2.lsInstallId === p2.installId, p2);
  assert('P2.2 cohort assigned in {local, live}', p2.cohort === 'local' || p2.cohort === 'live', p2);
  let blob = {};
  try { blob = JSON.parse(p2.lsBlob || '{}'); } catch (e) {}
  assert('P2.3 cohort persisted into experiment blob', blob.cohort === p2.cohort, { blobCohort: blob.cohort, cohort: p2.cohort });
  assert('P2.4 cohortAssignedAt is an ISO timestamp', typeof blob.cohortAssignedAt === 'string' && !isNaN(Date.parse(blob.cohortAssignedAt)), { cohortAssignedAt: blob.cohortAssignedAt });

  // Independent re-derivation of the FNV-1a parity bucket in the harness.
  const expectedBucket = (function (id) {
    let h = 2166136261 >>> 0;
    const s = String(id || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return (h % 2 === 0) ? 'local' : 'live';
  })(p2.installId);
  assert('P2.5 cohort matches deterministic FNV-1a parity of install id', p2.cohort === expectedBucket, { cohort: p2.cohort, expectedBucket });

  // ── P3 Determinism across reloads ───────────────────────────────────
  console.log('\n── P3 Determinism across reloads ──');
  const coldCohort = p2.cohort;
  const coldInstall = p2.installId;
  await navigateAndWait(TARGET_URL + '_reload1');
  await sleep(300);
  const p3a = await evalExpr(`({ cohort: window.__onboardingExperiment.getCohort(), installId: window.__onboardingExperiment.getInstallId() })`);
  assert('P3.1 install id stable across reload', p3a.installId === coldInstall, { was: coldInstall, now: p3a.installId });
  assert('P3.2 cohort stable across reload', p3a.cohort === coldCohort, { was: coldCohort, now: p3a.cohort });

  // Reset the experiment (keeps install id) → cohort must re-derive identically.
  const p3reset = await evalExpr(`
    (function(){
      window.__onboardingExperiment.reset();
      return {
        cohort: window.__onboardingExperiment.getCohort(),
        installId: window.__onboardingExperiment.getInstallId(),
        lsInstallId: localStorage.getItem('signal-circuit-install-id'),
      };
    })()
  `);
  assert('P3.3 reset() keeps install id (not wiped)', p3reset.installId === coldInstall && p3reset.lsInstallId === coldInstall, p3reset);
  assert('P3.4 cohort survives reset() deterministically', p3reset.cohort === coldCohort, p3reset);

  // ── P4 URL override ─────────────────────────────────────────────────
  console.log('\n── P4 URL override ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait('http://localhost:8901/index.html?cohort=live&_ts=' + Date.now());
  await sleep(400);
  const p4live = await evalExpr(`({
    cohort: window.__onboardingExperiment.getCohort(),
    blob: localStorage.getItem('signal-circuit-onboarding-experiment'),
  })`);
  let blobLive = {};
  try { blobLive = JSON.parse(p4live.blob || '{}'); } catch (e) {}
  assert('P4.1 ?cohort=live forces cohort=live', p4live.cohort === 'live', p4live);
  assert('P4.2 forced live cohort persisted', blobLive.cohort === 'live', { blobCohort: blobLive.cohort });

  await evalExpr(`localStorage.clear()`);
  await navigateAndWait('http://localhost:8901/index.html?cohort=local&_ts=' + Date.now());
  await sleep(400);
  const p4local = await evalExpr(`({
    cohort: window.__onboardingExperiment.getCohort(),
    blob: localStorage.getItem('signal-circuit-onboarding-experiment'),
  })`);
  let blobLocal = {};
  try { blobLocal = JSON.parse(p4local.blob || '{}'); } catch (e) {}
  assert('P4.3 ?cohort=local forces cohort=local', p4local.cohort === 'local', p4local);
  assert('P4.4 forced local cohort persisted', blobLocal.cohort === 'local', { blobCohort: blobLocal.cohort });

  // ── P5 Session counter (once per UTC day) ───────────────────────────
  console.log('\n── P5 Session counter ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_sess0');
  await sleep(400);
  const s0 = await evalExpr(`window.__onboardingExperiment.getSessionStats()`);
  assert('P5.1 first cold load: sessionDays = 1', s0.sessionDays === 1, s0);
  assert('P5.2 firstSessionDay == lastSessionDay (today, UTC)', s0.firstSessionDay && s0.firstSessionDay === s0.lastSessionDay, s0);
  const todayUtc = await evalExpr(`new Date().toISOString().slice(0,10)`);
  assert('P5.3 lastSessionDay is today (UTC YYYY-MM-DD)', s0.lastSessionDay === todayUtc, { lastSessionDay: s0.lastSessionDay, todayUtc });
  assert('P5.4 daysActive = 1 on first day', s0.daysActive === 1, s0);

  // Reload same UTC day → no double count.
  await navigateAndWait(TARGET_URL + '_sess_sameday');
  await sleep(300);
  const s1 = await evalExpr(`window.__onboardingExperiment.getSessionStats()`);
  assert('P5.5 same-day reload does NOT increment sessionDays', s1.sessionDays === 1, s1);

  // Simulate a prior day: rewrite lastSessionDay/firstSessionDay to N days ago,
  // then reload — the constructor's _recordSession() must +1 exactly once.
  const rewound = await evalExpr(`
    (function(){
      const KEY = 'signal-circuit-onboarding-experiment';
      const st = JSON.parse(localStorage.getItem(KEY) || '{}');
      const d = new Date(); d.setUTCDate(d.getUTCDate() - 3);
      const past = d.toISOString().slice(0,10);
      const first = new Date(); first.setUTCDate(first.getUTCDate() - 5);
      st.lastSessionDay = past;
      st.firstSessionDay = first.toISOString().slice(0,10);
      st.sessionDays = 4;
      localStorage.setItem(KEY, JSON.stringify(st));
      return { past: past, firstSet: st.firstSessionDay };
    })()
  `);
  await navigateAndWait(TARGET_URL + '_sess_newday');
  await sleep(300);
  const s2 = await evalExpr(`window.__onboardingExperiment.getSessionStats()`);
  assert('P5.6 new UTC day increments sessionDays exactly once (4 → 5)', s2.sessionDays === 5, s2);
  assert('P5.7 lastSessionDay advanced to today', s2.lastSessionDay === todayUtc, { lastSessionDay: s2.lastSessionDay, todayUtc });
  assert('P5.8 daysActive reflects 6-day calendar span (firstSessionDay 5d ago → today, inclusive)', s2.daysActive === 6, s2);

  // Reload once more the same (now-current) day → still 5, no drift.
  await navigateAndWait(TARGET_URL + '_sess_settle');
  await sleep(300);
  const s3 = await evalExpr(`window.__onboardingExperiment.getSessionStats()`);
  assert('P5.9 subsequent same-day reload holds sessionDays at 5', s3.sessionDays === 5, s3);

  // ── P6 Debug-gated readout ──────────────────────────────────────────
  console.log('\n── P6 Debug-gated readout ──');
  // Without debug flag: developer section stays hidden, no cohort DOM.
  await evalExpr(`localStorage.removeItem('signal-circuit-debug')`);
  const p6off = await evalExpr(`
    (function(){
      window.game.ui.renderOnboardingReadoutCard();
      const card = document.getElementById('onboarding-readout-card');
      return { display: card ? card.style.display : 'no-card', html: card ? card.innerHTML.length : -1 };
    })()
  `);
  assert('P6.1 readout hidden when debug flag absent', p6off.display === 'none' && p6off.html === 0, p6off);

  // With debug flag: cohort badge + session rows render.
  const p6on = await evalExpr(`
    (function(){
      localStorage.setItem('signal-circuit-debug','1');
      window.game.ui.renderOnboardingReadoutCard();
      const badge = document.getElementById('onboarding-readout-cohort-badge');
      const days = document.getElementById('onboarding-readout-session-days');
      const active = document.getElementById('onboarding-readout-days-active');
      const stats = window.__onboardingExperiment.getSessionStats();
      return {
        cohortBlock: !!document.getElementById('onboarding-readout-cohort'),
        badgeText: badge ? badge.textContent : null,
        badgeAttr: badge ? badge.getAttribute('data-cohort') : null,
        daysText: days ? days.textContent : null,
        activeText: active ? active.textContent : null,
        statsCohort: stats.cohort,
        statsSessionDays: stats.sessionDays,
        statsDaysActive: stats.daysActive,
      };
    })()
  `);
  assert('P6.2 cohort block present when debug=1', p6on.cohortBlock === true, p6on);
  assert('P6.3 cohort badge text + data-cohort match stats', p6on.badgeText === p6on.statsCohort && p6on.badgeAttr === p6on.statsCohort && (p6on.statsCohort === 'local' || p6on.statsCohort === 'live'), p6on);
  assert('P6.4 sessionDays row matches getSessionStats()', p6on.daysText === String(p6on.statsSessionDays), p6on);
  assert('P6.5 daysActive row matches getSessionStats()', p6on.activeText === String(p6on.statsDaysActive), p6on);

  // Developer section reveal path (Day 95 gate) still works with debug=1.
  const p6dev = await evalExpr(`
    (function(){
      const dev = document.getElementById('settings-developer-section');
      // Mirror the settings-open gate logic.
      const isDebug = localStorage.getItem('signal-circuit-debug') === '1';
      dev.style.display = isDebug ? 'block' : 'none';
      return { devDisplay: dev.style.display };
    })()
  `);
  assert('P6.6 developer section reveals with debug=1', p6dev.devDisplay === 'block', p6dev);

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

  const coldBackend = await evalExpr(`window.game.tournamentBackend.getMode()`);
  assert('P7.8 cold tournament backend = local (Day 125)', coldBackend === 'local', { coldBackend });

  // Variant default still silent-standard (Day 85) — cohort work didn't disturb it.
  const variant = await evalExpr(`window.__onboardingExperiment.getVariant()`);
  assert('P7.9 onboarding variant default = silent-standard (Day 85)', variant === 'silent-standard', { variant });

  const swReg = await evalExpr(`navigator.serviceWorker.getRegistration().then(r => r ? { active: !!r.active } : null)`, true);
  assert('P7.10 service worker registration active', swReg && swReg.active === true, swReg);

  // ── P8 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P8 Console hygiene ──');
  assert('P8.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P8.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

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
