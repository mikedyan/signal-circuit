#!/usr/bin/env node
/**
 * Day 139 QA harness — Cycle 7 BUILD Week Day 2: Per-mode stat badges in the hub.
 *
 * What shipped today:
 *   Each .mode-card in the Day 138 Modes hub now shows the player's own headline
 *   stat, read from EXISTING GameState fields (no new persistence):
 *     daily→streak · adaptive→skill label · tournament→last rank ·
 *     infinite→best solved · blitz→best rung · speedrun→best time.
 *   random/sandbox have no persisted per-mode counter → intentionally no badge.
 *   New UI.updateModeHubStats(); called at setup + on every hub open().
 *
 * Phases:
 *   P1 Build identity   — 11 ?v=1784073600 refs, sw v86, 6 #mode-stat-* spans, hub intact
 *   P2 Cold-start stats — fresh profile empty-state labels + no random/sandbox badge
 *   P3 Seeded stats     — seed each source → the correct stat text renders on re-open
 *   P4 Launch integrity — Day 138 regression: all 8 buttons still launch + hub closes
 *   P5 Regression floor — Day 79/92/107/123 + Day 124 profile hub + LEVELS=50
 *   P6 Console hygiene
 *
 * Prereq: tools/cdp-launch.sh start
 * Usage:  NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-139-qa.cdp.js
 */

const http = require('http');
const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const V = '1784073600';

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
  return send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }).then((r) => {
    if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
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
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}
async function navigateAndWait(url) {
  const navPromise = new Promise((resolve) => {
    const listener = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.method === 'Page.loadEventFired') { ws.off('message', listener); resolve(); }
    };
    ws.on('message', listener);
  });
  await send('Page.navigate', { url });
  await navPromise;
  await sleep(900);
}
// open the hub (calls updateModeHubStats via open()) and read a stat's text+visibility
async function readStat(key) {
  await evalExpr(`document.getElementById('modes-hub-btn').click()`);
  await sleep(120);
  const out = await evalExpr(`
    (function(){
      const el = document.getElementById('mode-stat-${key}');
      if (!el) return { exists:false };
      return { exists:true, text: el.textContent, visible: getComputedStyle(el).display !== 'none' };
    })()`);
  await evalExpr(`document.getElementById('modes-hub-close').click()`);
  await sleep(80);
  return out;
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
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

  const MODES = ['daily', 'random', 'sandbox', 'adaptive', 'tournament', 'infinite', 'blitz', 'speedrun'];
  const STAT_MODES = ['daily', 'adaptive', 'tournament', 'infinite', 'blitz', 'speedrun'];
  const BTN = {
    daily: 'daily-challenge-btn', random: 'random-challenge-btn', sandbox: 'sandbox-btn',
    adaptive: 'adaptive-challenge-btn', tournament: 'tournament-btn', infinite: 'infinite-mode-btn',
    blitz: 'blitz-mode-btn', speedrun: 'speedrun-btn',
  };

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    (Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=${V}')).length +
     Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=${V}')).length)`);
  assert(`P1.1 11 cache-bust refs at ?v=${V}`, vCount === 11, { vCount });
  const gameLive = await evalExpr(`!!window.game && !!window.game.ui && typeof window.game.seedProgress === 'function'`);
  assert('P1.2 window.game + ui + seedProgress live', gameLive === true);
  const swVer = await evalExpr(`fetch('sw.js?probe=' + Date.now()).then(r=>r.text()).then(t=>{const m=t.match(/signal-circuit-v(\\d+)/);return m?m[1]:null;})`, true);
  assert('P1.3 sw.js CACHE_NAME = signal-circuit-v86', swVer === '86', { swVer });
  const dom = await evalExpr(`({
    statSpans: ${JSON.stringify(STAT_MODES)}.filter(k => { const e=document.getElementById('mode-stat-'+k); return e && e.closest('.mode-card'); }).length,
    randomSpan: !!document.getElementById('mode-stat-random'),
    sandboxSpan: !!document.getElementById('mode-stat-sandbox'),
    updater: typeof window.game.ui.updateModeHubStats,
    hub: !!document.getElementById('modes-hub-modal') && !!document.getElementById('modes-hub-btn'),
    cards: document.querySelectorAll('#modes-hub-list .mode-card').length,
  })`);
  assert('P1.4 6 #mode-stat-* spans inside stat-bearing cards', dom.statSpans === 6, dom);
  assert('P1.5 no stat span on random/sandbox cards', dom.randomSpan === false && dom.sandboxSpan === false, dom);
  assert('P1.6 updateModeHubStats present', dom.updater === 'function', dom);
  assert('P1.7 hub + btn + 8 cards intact (Day 138)', dom.hub && dom.cards === 8, dom);

  // ── P2 Cold-start stats (empty-state labels) ─────────────────────────
  console.log('\n── P2 Cold-start stats ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_cold');
  await sleep(400);
  await evalExpr(`window.game.seedProgress(18)`); // reveal all cards so stats render
  await sleep(200);
  // seedProgress marks the day played (streak→1); clear the streak key to read the
  // genuine brand-new-player empty state (streak 0). The '1-day streak' text after
  // seeding is itself correct app behavior; this isolates the zero-state label.
  await evalExpr(`localStorage.removeItem('signal-circuit-streak')`);
  const coldDaily = await readStat('daily');
  assert('P2.1 daily zero-streak → "Start a streak today"', coldDaily.visible === true && /Start a streak/.test(coldDaily.text), coldDaily);
  const coldTour = await readStat('tournament');
  assert('P2.2 tournament cold → "No runs yet"', coldTour.visible === true && /No runs yet/.test(coldTour.text), coldTour);
  const coldInf = await readStat('infinite');
  assert('P2.3 infinite cold → "Not played yet"', coldInf.visible === true && /Not played yet/.test(coldInf.text), coldInf);
  const coldBlitz = await readStat('blitz');
  assert('P2.4 blitz cold → "Not played yet"', coldBlitz.visible === true && /Not played yet/.test(coldBlitz.text), coldBlitz);
  const coldSpeed = await readStat('speedrun');
  assert('P2.5 speedrun cold → "Not played yet"', coldSpeed.visible === true && /Not played yet/.test(coldSpeed.text), coldSpeed);
  const coldAdapt = await readStat('adaptive');
  assert('P2.6 adaptive cold → "Skill: <label>"', coldAdapt.visible === true && /Skill:/.test(coldAdapt.text), coldAdapt);
  // random/sandbox have no span → readStat reports exists:false
  const rnd = await readStat('random');
  const sbx = await readStat('sandbox');
  assert('P2.7 random/sandbox render no stat badge', rnd.exists === false && sbx.exists === false, { rnd, sbx });

  // ── P3 Seeded stats (correct source read) ────────────────────────────
  console.log('\n── P3 Seeded stats ──');
  // Daily streak = 5
  await evalExpr(`localStorage.setItem('signal-circuit-streak', JSON.stringify({ streak: 5, freezeTokens: 0, lastPlayDate: '2000-01-01' }))`);
  const s3Daily = await readStat('daily');
  assert('P3.1 seed streak=5 → "🔥 5-day streak"', /5-day streak/.test(s3Daily.text), s3Daily);
  // Blitz best rung = 7
  await evalExpr(`localStorage.setItem('signal-circuit-blitz-best', '7')`);
  const s3Blitz = await readStat('blitz');
  assert('P3.2 seed blitz-best=7 → "Best: rung 7"', /Best: rung 7/.test(s3Blitz.text), s3Blitz);
  // Speedrun best = 95s → 1:35
  await evalExpr(`localStorage.setItem('signal-circuit-speedrun-best', '95')`);
  const s3Speed = await readStat('speedrun');
  assert('P3.3 seed speedrun-best=95 → "Best: 1:35"', /Best: 1:35/.test(s3Speed.text), s3Speed);
  // Infinite best solved = 12 (write via manager so the in-memory best updates)
  await evalExpr(`(function(){
    const ir = window.game.infiniteRun;
    ir.best = ir.best || { bestStreak:0, bestSolved:0, bestTimeSec:0, totalRuns:0 };
    ir.best.bestSolved = 12; if (ir._saveBest) ir._saveBest();
  })()`);
  const s3Inf = await readStat('infinite');
  assert('P3.4 seed infinite bestSolved=12 → "Best: 12 solved"', /Best: 12 solved/.test(s3Inf.text), s3Inf);
  // Tournament: submit a score → last rank appears
  const submittedRank = await evalExpr(`(function(){
    const wt = window.game.weeklyTournament;
    if (!wt || !wt.submitScore) return null;
    wt.submitScore(3, 25, 'Mochi');
    const h = wt.getSubmissionHistory();
    return (h && h.length) ? h[0].rank : null;
  })()`);
  const s3Tour = await readStat('tournament');
  assert('P3.5 submit tournament score → "Last rank: #N"', submittedRank !== null && s3Tour.text.indexOf('Last rank: #' + submittedRank) !== -1, { submittedRank, s3Tour });
  // Adaptive skill label present after seeding
  const s3Adapt = await readStat('adaptive');
  assert('P3.6 adaptive still shows "Skill: <label>"', /Skill:/.test(s3Adapt.text), s3Adapt);

  // ── P4 Launch integrity (Day 138 regression) ────────────────────────
  console.log('\n── P4 Launch integrity ──');
  const LAUNCH = {
    daily:      `getComputedStyle(document.getElementById('daily-config-screen')||{}).display !== 'none'`,
    random:     `getComputedStyle(document.getElementById('challenge-config-screen')||{}).display !== 'none'`,
    sandbox:    `getComputedStyle(document.getElementById('sandbox-config-screen')||{}).display !== 'none'`,
    adaptive:   `getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    tournament: `getComputedStyle(document.getElementById('tournament-screen')||{}).display !== 'none'`,
    infinite:   `getComputedStyle(document.getElementById('infinite-pre-screen')||{}).display !== 'none'`,
    blitz:      `!!window.game.blitzMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
    speedrun:   `!!window.game.speedrunMode && getComputedStyle(document.getElementById('gameplay-screen')||{}).display !== 'none'`,
  };
  for (const k of MODES) {
    await evalExpr(`(function(){
      try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
      try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
      window.game.showLevelSelect();
    })()`);
    await sleep(130);
    await evalExpr(`document.getElementById('modes-hub-btn').click()`);
    await sleep(110);
    const opened = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display !== 'none'`);
    await evalExpr(`document.getElementById('${BTN[k]}').click()`);
    await sleep(300);
    const reached = await evalExpr(`(${LAUNCH[k]})`);
    const hubClosed = await evalExpr(`getComputedStyle(document.getElementById('modes-hub-modal')).display === 'none'`);
    assert(`P4.${k} launches flow + hub closes on pick`, opened === true && reached === true && hubClosed === true, { opened, reached, hubClosed });
  }
  await evalExpr(`(function(){
    try{ if(window.game.blitzMode && window.game.stopBlitzMode) window.game.stopBlitzMode(); }catch(e){}
    try{ if(window.game.speedrunMode && window.game.stopSpeedrunMode) window.game.stopSpeedrunMode(); }catch(e){}
    window.game.showLevelSelect();
  })()`);
  await sleep(200);

  // ── P5 Regression floor ──────────────────────────────────────────────
  console.log('\n── P5 Regression floor ──');
  const day79 = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P5.1 Day 79 dead-id showFirstLaunchDifficultyModal undefined', day79.showFirstLaunchDifficultyModal === 'undefined', day79);
  assert('P5.2 Day 79 #weekly-puzzle-btn DOM absent', day79.weeklyPuzzleBtn === false, day79);
  const esm = await evalExpr(`({
    Gate: typeof window.Gate, GateTypes: typeof window.GateTypes,
    Wire: typeof window.Wire, WireManager: typeof window.WireManager,
    Simulation: typeof window.Simulation, simInstance: window.game.simulation instanceof window.Simulation,
    levels: (typeof getLevelCount === 'function') ? getLevelCount() : null,
  })`);
  assert('P5.3 Day 92 window.Gate / GateTypes bound', esm.Gate === 'function' && esm.GateTypes === 'object', esm);
  assert('P5.4 Day 107 window.Wire / WireManager bound', esm.Wire === 'function' && esm.WireManager === 'function', esm);
  assert('P5.5 Day 123 window.Simulation bound + instance identity', esm.Simulation === 'function' && esm.simInstance === true, esm);
  assert('P5.6 LEVELS = 50', esm.levels === 50, esm);
  const profileHub = await evalExpr(`({
    modal: !!document.getElementById('profile-hub-modal'),
    btn: !!document.getElementById('profile-hub-btn'),
    setup: typeof window.game.ui.setupProfileHub,
  })`);
  assert('P5.7 Day 124 Profile hub intact', profileHub.modal && profileHub.btn && profileHub.setup === 'function', profileHub);

  // ── P6 Console hygiene ───────────────────────────────────────────────
  console.log('\n── P6 Console hygiene ──');
  assert('P6.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P6.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

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
main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
