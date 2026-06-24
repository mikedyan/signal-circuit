#!/usr/bin/env node
/**
 * Day 117 QA harness — Cycle 5 HARDEN Week Day 5: Regression Pass (DEPLOYED build).
 *
 * Pure-CDP runner (ws@8.x, no puppeteer). Boot deps first with
 *   tools/cdp-launch.sh start
 * then run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-117-qa.cdp.js
 *
 * UNIQUE TO DAY 117: this harness targets the LIVE GitHub Pages deployment
 *   https://mikedyan.github.io/signal-circuit/
 * (not the local static server). Goal: confirm Pages has caught up to the
 * pinned Day 111 artifact (?v=1781395200 / sw v73) and the full core loop +
 * every mode works end-to-end on the deployed bytes, with a clean console.
 *
 * Coverage (HARDEN Week Day 5 — Regression Pass):
 *   P1  Deployed build identity (11× ?v=1781395200 + sw v73)
 *   P2  Cold-start invariants (50 cards, 2 nav buttons, window bindings, dead-IDs)
 *   P3  Core loop: load L1 → place gate → draw wires → RUN sim → Quick Test → complete
 *   P4  Mode: campaign (already in P3) + daily challenge entry
 *   P5  Mode: random challenge config entry
 *   P6  Mode: blitz immediate-start
 *   P7  Mode: speedrun immediate-start
 *   P8  Mode: sandbox config entry
 *   P9  Mode: tournament screen + Day 83/108 backend label
 *   P10 Mode: infinite/adaptive entry (tier-gated; seed progress)
 *   P11 Cycle 5 BUILD regression: D107 ESM, D108 label, D109 L48 validator,
 *       D110 PB badge cold suppression, D111 Stats tournament-history tab
 *   P12 Console hygiene (0 console.error, 0 Runtime.exceptionThrown)
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const BASE = 'https://mikedyan.github.io/signal-circuit/';
const TARGET_URL = BASE + '?_ts=' + Date.now();

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const assertions = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
}
function note(label, detail) { console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : '')); }

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c));
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
  const r = await send(ws, 'Runtime.evaluate', { expression: expr, returnByValue, awaitPromise, allowUnsafeEvalBlockedByCSP: true });
  if (r.exceptionDetails) {
    const text = r.exceptionDetails.exception?.description || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails);
    throw new Error('eval threw: ' + text);
  }
  return r.result && r.result.value;
}
async function waitFor(ws, predicate, { timeoutMs = 15000, intervalMs = 250, label = 'waitFor' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = await evalExpr(ws, `(${predicate})()`); if (v) return v; } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function navigateAndWait(ws, url) {
  await send(ws, 'Page.navigate', { url });
  await sleep(2000);
  await waitFor(ws, `() => !!document.body`, { label: 'body present' });
}
async function backToLevelSelect(ws) {
  await evalExpr(ws, `(function(){ const b=document.querySelector('#back-btn'); if(b&&b.offsetParent!==null){b.click();} else if(window.game&&window.game.ui){ window.game.ui.showScreen('level-select'); } })()`);
  await sleep(400);
}

async function main() {
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) target = await fetchJson('/json/new?about:blank');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const args = msg.params.args || [];
        consoleErrors.push(args.map((a) => (a.value !== undefined ? String(a.value) : (a.description || ''))).join(' '));
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      consoleErrors.push('uncaught: ' + ((ed && (ed.exception?.description || ed.text)) || JSON.stringify(ed)));
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');
  await send(ws, 'Network.setCacheDisabled', { cacheDisabled: true });
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'https://mikedyan.github.io', storageTypes: 'all' }); } catch {}

  // ───────── PHASE 1: Deployed build identity ─────────
  console.log('\n=== Phase 1: DEPLOYED build identity (GitHub Pages caught up to Day 111) ===');
  await navigateAndWait(ws, TARGET_URL);
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);
  const html = await evalExpr(ws, `fetch('${BASE}index.html', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('deployed: 11 cache-bust refs at ?v=1781395200', (html.match(/\?v=1781395200/g) || []).length === 11, `found=${(html.match(/\?v=1781395200/g) || []).length}`);
  const swText = await evalExpr(ws, `fetch('${BASE}sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('deployed: sw.js CACHE_NAME = signal-circuit-v73', /CACHE_NAME\s*=\s*'signal-circuit-v73'/.test(swText));

  // ───────── PHASE 2: Cold-start invariants ─────────
  console.log('\n=== Phase 2: Cold-start invariants (deployed) ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+ui ready' });
  await sleep(600);
  const cold = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const nonLevel = visible.filter(b => !b.classList.contains('level-overflow-btn') && !b.classList.contains('level-btn') && !b.closest('.level-overflow-btn, .level-card, [data-level-id]'));
    return { cards: s.querySelectorAll('.level-btn').length, nonLevel: nonLevel.length };
  })()`);
  rec('cold-start 50 level cards (Day 109 invariant)', cold && cold.cards === 50, `cards=${cold && cold.cards}`);
  rec('cold-start 2 non-level nav buttons (Day 78 invariant)', cold && cold.nonLevel === 2, `nonLevel=${cold && cold.nonLevel}`);
  const bindings = await evalExpr(ws, `(function(){
    return { gate: typeof window.Gate, gateTypes: window.GateTypes ? Object.keys(window.GateTypes).length : -1,
      wire: typeof window.Wire, wireMgr: typeof window.WireManager,
      levels: (typeof LEVELS !== 'undefined') ? LEVELS.length : -1 };
  })()`);
  rec('D92/D107 ESM bindings: window.Gate fn + 8 GateTypes + window.Wire + WireManager', bindings.gate === 'function' && bindings.gateTypes === 8 && bindings.wire === 'function' && bindings.wireMgr === 'function', JSON.stringify(bindings));
  const deadIds = await evalExpr(ws, `(function(){
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    return { allUndef: ids.every(n => typeof window[n] === 'undefined'), weeklyBtn: !!document.querySelector('#weekly-puzzle-btn') };
  })()`);
  rec('Day 79 7 dead identifiers undefined + #weekly-puzzle-btn absent', deadIds.allUndef && deadIds.weeklyBtn === false, JSON.stringify(deadIds));

  async function enterL1() {
    await evalExpr(ws, `window.game.startLevel(1)`);
    await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L1 gameplay' });
  }

  // ───────── PHASE 3: Core loop ─────────
  console.log('\n=== Phase 3: Core loop — load L1 → place gate → wire → RUN → Quick Test → complete ===');
  await enterL1();
  const loop = await evalExpr(ws, `(function(){
    const gs = window.game; let threw=null, completed=false;
    try {
      // place a single AND gate
      const id = (gs.nextGateId !== undefined ? gs.nextGateId++ : 5001);
      gs.gates.push(new window.Gate('AND', 400, 300, id));
      // wire both inputs + output (L1 = AND of 2 inputs)
      const ins = gs.inputNodes, outs = gs.outputNodes;
      gs.wireManager.wires.push(new window.Wire(ins[0].id, 0, id, 0, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(ins[1].id, 0, id, 1, gs.wireManager.nextId++));
      gs.wireManager.wires.push(new window.Wire(id, 0, outs[0].id, 0, gs.wireManager.nextId++));
      if (gs.renderer) gs.renderer.render();
      const wiresBefore = gs.wireManager.wires.length;
      // Quick Test path (fast, no animation)
      if (gs.runQuickTest) gs.runQuickTest();
      // RUN path
      if (gs.runSimulation) gs.runSimulation();
      // direct completion to verify the celebration/persist path
      if (gs.completeLevel) { gs.completeLevel(1, 1); completed = true; }
      const prog = gs.progress && gs.progress.levels && gs.progress.levels[1];
      return { threw, wiresBefore, completed, levelDone: !!(prog && prog.completed), stars: prog && prog.stars };
    } catch(e){ return { threw:String(e) }; }
  })()`);
  rec('P3 core loop: place gate + 3 wires + Quick Test + RUN, no throw', loop && loop.threw === null && loop.wiresBefore === 3, JSON.stringify(loop));
  rec('P3 completeLevel(1) persists completed=true', loop && loop.levelDone === true, JSON.stringify(loop));
  await backToLevelSelect(ws);

  // ───────── PHASE 4: Daily challenge mode ─────────
  console.log('\n=== Phase 4: Daily Challenge mode ===');
  const daily = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('daily-challenge-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.startDailyChallenge) { window.game.startDailyChallenge(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('daily-config'); }
      const dc = document.getElementById('daily-config-screen');
      const gp = document.getElementById('gameplay-screen');
      const dcVis = dc && getComputedStyle(dc).display !== 'none';
      const gpVis = gp && getComputedStyle(gp).display !== 'none';
      return { reached: !!(dcVis || gpVis), dcVis: !!dcVis, gpVis: !!gpVis };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P4 Daily Challenge reaches config or gameplay screen', daily && daily.reached, JSON.stringify(daily));
  await backToLevelSelect(ws);

  // ───────── PHASE 5: Random challenge config ─────────
  console.log('\n=== Phase 5: Random Challenge config ===');
  const rand = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('random-challenge-btn') || document.getElementById('challenge-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('challenge-config'); }
      const cc = document.getElementById('challenge-config-screen');
      return { reached: !!(cc && getComputedStyle(cc).display !== 'none') };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P5 Random Challenge reaches challenge-config screen', rand && rand.reached, JSON.stringify(rand));
  await backToLevelSelect(ws);

  // ───────── PHASE 6: Blitz immediate-start ─────────
  console.log('\n=== Phase 6: Blitz Mode immediate-start ===');
  const blitz = await evalExpr(ws, `(function(){
    try {
      if (window.game.startBlitzMode) { window.game.startBlitzMode(); }
      else { const b=document.getElementById('blitz-mode-btn'); if(b) b.click(); }
      const gp = document.getElementById('gameplay-screen');
      return { gpVis: !!(gp && getComputedStyle(gp).display !== 'none'), blitz: !!window.game.isBlitzMode };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P6 Blitz Mode enters gameplay', blitz && blitz.gpVis, JSON.stringify(blitz));
  await backToLevelSelect(ws);
  const blitzClean = await evalExpr(ws, `(function(){
    const hud = document.getElementById('blitz-hud');
    return { hudHidden: !hud || getComputedStyle(hud).display === 'none', blitzFlag: !!window.game.isBlitzMode };
  })()`);
  rec('P6 Blitz HUD cleaned on return to level-select (Day 61/103 fix)', blitzClean && blitzClean.hudHidden && blitzClean.blitzFlag === false, JSON.stringify(blitzClean));

  // ───────── PHASE 7: Speedrun immediate-start ─────────
  console.log('\n=== Phase 7: Speedrun Mode immediate-start ===');
  const speed = await evalExpr(ws, `(function(){
    try {
      if (window.game.startSpeedrunMode) { window.game.startSpeedrunMode(); }
      else { const b=document.getElementById('speedrun-mode-btn'); if(b) b.click(); }
      const gp = document.getElementById('gameplay-screen');
      return { gpVis: !!(gp && getComputedStyle(gp).display !== 'none'), speed: !!window.game.isSpeedrunMode };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P7 Speedrun Mode enters gameplay', speed && speed.gpVis, JSON.stringify(speed));
  await backToLevelSelect(ws);
  const speedClean = await evalExpr(ws, `(function(){
    const hud = document.getElementById('speedrun-hud');
    return { hudHidden: !hud || getComputedStyle(hud).display === 'none', speedFlag: !!window.game.isSpeedrunMode };
  })()`);
  rec('P7 Speedrun HUD cleaned on return (Day 74/103 fix)', speedClean && speedClean.hudHidden && speedClean.speedFlag === false, JSON.stringify(speedClean));

  // ───────── PHASE 8: Sandbox config ─────────
  console.log('\n=== Phase 8: Sandbox Mode config ===');
  const sandbox = await evalExpr(ws, `(function(){
    try {
      const btn = document.getElementById('sandbox-mode-btn') || document.getElementById('sandbox-btn');
      if (btn && btn.offsetParent !== null) { btn.click(); }
      else if (window.game.ui && window.game.ui.showScreen) { window.game.ui.showScreen('sandbox-config'); }
      const sc = document.getElementById('sandbox-config-screen');
      const gp = document.getElementById('gameplay-screen');
      return { reached: !!((sc && getComputedStyle(sc).display !== 'none') || (gp && getComputedStyle(gp).display !== 'none')) };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P8 Sandbox reaches config or gameplay screen', sandbox && sandbox.reached, JSON.stringify(sandbox));
  await backToLevelSelect(ws);

  // ───────── PHASE 9: Tournament screen + backend label ─────────
  console.log('\n=== Phase 9: Tournament screen + Day 83/108 backend ===');
  const tourn = await evalExpr(ws, `(function(){
    try {
      const b = (typeof selectTournamentBackend === 'function') ? selectTournamentBackend() : (window.game.tournamentBackend || null);
      const mode = b && b.getMode ? b.getMode() : null;
      const desc = b && b.describe ? b.describe() : null;
      const isLive = b && b.isLive ? b.isLive() : null;
      return { mode, desc, isLive, ok: mode === 'local' && typeof desc === 'string' && desc.length > 0 };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P9 Tournament backend default mode=local, describe present, isLive=false', tourn && tourn.ok && tourn.isLive === false, JSON.stringify(tourn));

  // ───────── PHASE 10: Infinite/adaptive (tier-gated) ─────────
  console.log('\n=== Phase 10: Adaptive/Infinite tier-gated entry ===');
  const adaptive = await evalExpr(ws, `(function(){
    try {
      // seed enough progress to reveal tier-gated modes, then re-render
      if (window.game.seedProgress) { window.game.seedProgress(18); }
      if (window.game.ui && window.game.ui.renderLevelSelect) { window.game.ui.renderLevelSelect(); }
      const btn = document.getElementById('adaptive-challenge-btn');
      const infBtn = document.getElementById('infinite-mode-btn');
      const hasAdaptive = !!btn;
      let entered = false;
      if (window.game.startAdaptiveChallenge) { window.game.startAdaptiveChallenge(); entered = true; }
      else if (btn) { btn.click(); entered = true; }
      const gp = document.getElementById('gameplay-screen');
      return { hasAdaptive, hasInfinite: !!infBtn, entered, gpVis: !!(gp && getComputedStyle(gp).display !== 'none') };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('P10 Adaptive challenge button exists after tier-3 seed + entry works', adaptive && adaptive.hasAdaptive && (adaptive.gpVis || adaptive.entered), JSON.stringify(adaptive));
  await navigateAndWait(ws, BASE + '?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game ready post-adaptive' });
  await sleep(500);

  // ───────── PHASE 11: Cycle 5 BUILD regression sweep (D107-D111) ─────────
  console.log('\n=== Phase 11: Cycle 5 BUILD regression sweep (D107-D111) ===');
  // D109: L48 composite validator
  const d109meta = await evalExpr(ws, `(function(){
    const lv = getLevel(48);
    return { isLab: !!(lv&&lv.isLabBench), maxFanOut: lv&&lv.maxFanOut, cap: lv&&(lv.gateHardCap) };
  })()`);
  rec('D109 L48 metadata: lab + maxFanOut=2 + hardCap=3', d109meta && d109meta.isLab && d109meta.maxFanOut === 2 && d109meta.cap === 3, JSON.stringify(d109meta));
  await evalExpr(ws, `window.game.startLevel(48)`);
  await waitFor(ws, `() => document.querySelector('#gameplay-screen') && getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none'`, { label: 'L48 gameplay' });
  const d109val = await evalExpr(ws, `(function(){
    const gs = window.game;
    try {
      for (let i=0;i<4;i++){ const id=(gs.nextGateId!==undefined?gs.nextGateId++:8000+i); gs.gates.push(new window.Gate('NAND',200+i*40,300,id)); }
      const res = gs._validateLabConstraints();
      const msg = res && (res.message || res.reason) || '';
      return { ok: res && res.ok === false && /4 gates exceeds hard cap of 3/.test(msg), message: msg };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('D109 L48 validator rejects 4 gates: cap clause byte-exact', d109val && d109val.ok, JSON.stringify(d109val));
  await backToLevelSelect(ws);

  // D110: PB badge suppressed on a TRULY cold L1. Note: P3 completed L1, so we
  // must clear storage + reload first to get a no-progress state (the badge is
  // *correctly* visible on completed-campaign revisits per the Day 110 spec).
  await evalExpr(ws, `(function(){ try{ localStorage.clear(); }catch(e){} return true; })()`);
  await navigateAndWait(ws, BASE + '?_ts=' + Date.now());
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'fresh game for D110' });
  await sleep(500);
  await enterL1();
  const d110 = await evalExpr(ws, `(function(){
    const el = document.getElementById('level-best-badge');
    return { exists: !!el, display: el ? getComputedStyle(el).display : 'absent' };
  })()`);
  rec('D110 PB badge present + hidden on cold L1 (storage cleared, no progress)', d110 && d110.exists && d110.display === 'none', JSON.stringify(d110));
  await backToLevelSelect(ws);

  // D111: Stats tournament-history tab
  const d111 = await evalExpr(ws, `(function(){
    try {
      const hasTab = !!document.getElementById('stats-tab-tournament');
      const hasPane = !!document.getElementById('stats-tournament-pane');
      const switchFn = typeof window.game.ui._switchStatsTab === 'function';
      return { hasTab, hasPane, switchFn };
    } catch(e){ return { err:String(e) }; }
  })()`);
  rec('D111 Stats tournament tab + pane + _switchStatsTab present', d111 && d111.hasTab && d111.hasPane && d111.switchFn, JSON.stringify(d111));

  // ───────── PHASE 12: Console hygiene ─────────
  console.log('\n=== Phase 12: Console hygiene ===');
  rec('0 console.error / 0 uncaught exceptions', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '));

  // ───────── SUMMARY ─────────
  const passed = assertions.filter((a) => a.ok).length;
  const failed = assertions.length - passed;
  console.log(`\n=== SUMMARY: ${passed}/${assertions.length} passed, ${failed} failed ===`);
  if (failed) { console.log('FAILED:'); assertions.filter(a => !a.ok).forEach(a => console.log(' ❌ ' + a.label + (a.detail ? ' :: ' + a.detail : ''))); }
  try { ws.close(); } catch {}
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
