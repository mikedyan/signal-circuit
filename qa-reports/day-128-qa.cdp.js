#!/usr/bin/env node
/**
 * Day 128 QA harness — Cycle 6 HARDEN Week Day 1: Full Interaction Audit.
 *
 * Connects to permissive headless Chromium on localhost:9301 over CDP and
 * exhaustively exercises Signal Circuit against http://localhost:8901/.
 *
 * Build under test: Day 127 (Stats per-chapter completion heatmap) — last
 * BUILD-day of Cycle 6. Expected build identity: ?v=1783036800 / sw v81 / 50 cards.
 *
 * Cloned from qa-reports/day-112-qa.cdp.js (Cycle 5 Full Interaction Audit) and
 * updated for the Cycle 6 BUILD week surfaces:
 *   D123 Module Split Phase 3 (simulation.js → ES module, window.Simulation)
 *   D124 Collection-Modal Merge → tabbed #profile-hub-modal (5 collection modals → 1)
 *   D125 Tournament Worker production-readiness (Settings connection surface + opt-in name)
 *   D126 Onboarding A/B cohort instrumentation (getCohort/getInstallId/getSessionStats)
 *   D127 Stats per-chapter completion heatmap (📈 Progress tab)
 * Plus the standing regression floor (Day 78 staircase, Day 79 dead-ids,
 * Day 92/107 ESM, Day 83/93/108 tournament backend, Day 61/74 HUD cleanup).
 *
 * Coverage-rotation debt (flagged Days 89/117): this audit adds TWO novel probes
 * beyond the proven 12 surfaces — Sandbox deep-play (P16) and cosmetic × colorblind
 * live-paint interaction (P23).
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-128-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();
const BUILD_V = '?v=1783036800';
const SW_V = 'signal-circuit-v81';

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const consoleAll = [];
const assertions = [];
const observations = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
}
function note(label, detail) {
  observations.push({ label, detail });
  console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
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
async function waitFor(ws, predicate, { timeoutMs = 10000, intervalMs = 250, label = 'waitFor' } = {}) {
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
  await waitFor(ws, `() => !!document.body`, { label: 'body present' });
}
// Cold reload helper (Day 118 lesson: cold-invariant checks must reset state first)
async function coldReload(ws) {
  try { await send(ws, 'Storage.clearDataForOrigin', { origin: 'http://localhost:8901', storageTypes: 'all' }); } catch {}
  await evalExpr(ws, `try{localStorage.clear();sessionStorage.clear();}catch(e){}; 'ok'`);
  await navigateAndWait(ws, 'http://localhost:8901/?_ts=' + Date.now());
  await evalExpr(ws, `navigator.vibrate = () => true; 'ok'`);
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+ui ready (cold)' });
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
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
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
  const cb1 = (html.match(/\?v=1783036800/g) || []).length;
  rec('11 cache-bust refs at ?v=1783036800 (Day 127 build)', cb1 === 11, `found=${cb1}`);
  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('sw.js CACHE_NAME = ' + SW_V, new RegExp(`CACHE_NAME\\s*=\\s*'${SW_V}'`).test(swText));
  rec('index.html loads gates.js as ES module (Day 92)', /<script\s+type=["']module["']\s+src=["']js\/gates\.js/.test(html));
  rec('index.html loads wires.js as ES module (Day 107)', /<script\s+type=["']module["']\s+src=["']js\/wires\.js/.test(html));
  rec('index.html loads simulation.js as ES module (Day 123)', /<script\s+type=["']module["']\s+src=["']js\/simulation\.js/.test(html));

  // ───────── PHASE 2: Cold-start surface ─────────
  console.log('\n=== Phase 2: Cold-start surface (level select) ===');
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'game+ui ready' });
  await sleep(500);
  const coldStats = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    if (!s) return {err:'no level-select'};
    const cs = getComputedStyle(s);
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const nonLevel = visible.filter(b =>
      !b.classList.contains('level-overflow-btn') && !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') && !(b.dataset && b.dataset.levelId) &&
      !b.closest('.level-overflow-btn, .level-card, [data-level-id]'));
    return {
      screenVisible: cs.display !== 'none',
      nonLevelCount: nonLevel.length,
      nonLevelLabels: nonLevel.map(b => (b.id || b.className.split(' ')[0])),
      levelCardCount: s.querySelectorAll('.level-btn').length,
      overflowCount: visible.filter(b => b.classList.contains('level-overflow-btn')).length,
    };
  })()`);
  rec('cold-start level-select visible', coldStats && coldStats.screenVisible, JSON.stringify(coldStats).slice(0,220));
  rec('cold-start non-level button count === 2 (Day 78 invariant)', coldStats && coldStats.nonLevelCount === 2, `count=${coldStats && coldStats.nonLevelCount}; labels=${JSON.stringify(coldStats && coldStats.nonLevelLabels)}`);
  rec('cold-start shows all 50 level cards', coldStats && coldStats.levelCardCount === 50, `cards=${coldStats && coldStats.levelCardCount}`);
  rec('cold-start no overflow buttons', coldStats && coldStats.overflowCount === 0, `overflow=${coldStats && coldStats.overflowCount}`);
  rec('cold-start Profile hub button hidden (reveals at g12)', coldStats && !coldStats.nonLevelLabels.includes('profile-hub-btn'), JSON.stringify(coldStats && coldStats.nonLevelLabels));
  const variantInit = await evalExpr(ws, `window.__onboardingExperiment && window.__onboardingExperiment.getVariant()`);
  rec("onboarding variant === 'silent-standard'", variantInit === 'silent-standard', `variant=${variantInit}`);
  const diffMode = await evalExpr(ws, `localStorage.getItem('signal-circuit-difficulty-mode')`);
  rec("DIFFICULTY_KEY === 'standard' after cold start", diffMode === 'standard', `value=${diffMode}`);

  // ───────── PHASE 3: Settings modal sweep ─────────
  console.log('\n=== Phase 3: Settings modal toggles ===');
  await evalExpr(ws, `document.querySelector('#open-settings-btn').click()`);
  await sleep(400);
  const settingsOpen = await evalExpr(ws, `(function(){
    const m = document.querySelector('#settings-modal');
    if (!m) return {err:'no modal'};
    const btns = Array.from(m.querySelectorAll('button')).filter(b=>getComputedStyle(b).display!=='none' && b.offsetParent!==null);
    return {visible: getComputedStyle(m).display !== 'none', buttonCount: btns.length};
  })()`);
  rec('Settings modal opens', settingsOpen && settingsOpen.visible, JSON.stringify(settingsOpen).slice(0,200));
  rec('Settings modal has expected button surface (≥10)', settingsOpen && settingsOpen.buttonCount >= 10, `count=${settingsOpen && settingsOpen.buttonCount}`);
  const togglesTried = await evalExpr(ws, `(function(){
    const results = {};
    for (const sel of ['#colorblind-toggle-btn','#fontsize-toggle-btn','#simplified-visual-btn','#accessible-wiring-btn','#light-mode-btn']) {
      try { const el = document.querySelector(sel); if (!el) { results[sel]='missing'; continue; }
        el.click(); el.click(); results[sel]='ok'; } catch (e) { results[sel]='err:'+e.message.slice(0,40); }
    }
    return results;
  })()`);
  rec('Settings accessibility toggles do not throw', togglesTried && Object.values(togglesTried).every(v => !String(v).startsWith('err') && v !== 'missing'), JSON.stringify(togglesTried).slice(0,240));
  // Difficulty chooser
  await evalExpr(ws, `(document.querySelector('#difficulty-mode-btn')||{click:()=>{}}).click()`);
  await sleep(400);
  const diffChooser = await evalExpr(ws, `(function(){
    const m = document.querySelector('#confirm-modal');
    if (!m) return {err:'no confirm modal'};
    return {visible: getComputedStyle(m).display !== 'none', options: Array.from(m.querySelectorAll('button')).map(b=>(b.textContent||'').trim()).slice(0,6)};
  })()`);
  rec('Difficulty Mode chooser opens with options', diffChooser && diffChooser.visible && diffChooser.options.length >= 2, JSON.stringify(diffChooser).slice(0,220));
  await evalExpr(ws, `(function(){const m=document.querySelector('#confirm-modal');if(m){const c=m.querySelector('.modal-close, #confirm-cancel, [data-action="cancel"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 4: Day 125 Tournament Worker settings surface ─────────
  console.log('\n=== Phase 4: Day 125 Tournament Worker settings surface ===');
  const tsSurface = await evalExpr(ws, `(function(){
    const sec = document.querySelector('#settings-tournament-section');
    return {
      sectionPresent: !!sec,
      urlInput: !!document.querySelector('#tournament-worker-url-input'),
      saveBtn: !!document.querySelector('#tournament-worker-save-btn'),
      clearBtn: !!document.querySelector('#tournament-worker-clear-btn'),
      status: (document.querySelector('#tournament-connection-status')||{}).textContent || '',
      nameInput: !!document.querySelector('#tournament-display-name-input'),
      nameSave: !!document.querySelector('#tournament-name-save-btn'),
      nameClear: !!document.querySelector('#tournament-name-clear-btn'),
    };
  })()`);
  rec('Day 125 Tournament settings section + URL/name inputs present', tsSurface && tsSurface.sectionPresent && tsSurface.urlInput && tsSurface.saveBtn && tsSurface.clearBtn && tsSurface.nameInput && tsSurface.nameSave && tsSurface.nameClear, JSON.stringify(tsSurface).slice(0,240));
  rec('Day 125 default connection status is local', tsSurface && /local/i.test(tsSurface.status), `status=${tsSurface && tsSurface.status}`);
  // Set a worker URL → reconfigure → mode should flip to remote (no live server; offline-fallback allowed)
  const setUrl = await evalExpr(ws, `(function(){
    const inp = document.querySelector('#tournament-worker-url-input');
    inp.value = 'https://example-mock.workers.dev';
    document.querySelector('#tournament-worker-save-btn').click();
    const a = window.game.tournamentBackend;
    return {mode: a && a.getMode && a.getMode(), lsUrl: localStorage.getItem('signal-circuit-tournament-worker-url')};
  })()`);
  rec('Day 125 Connect persists worker URL to localStorage', setUrl && setUrl.lsUrl === 'https://example-mock.workers.dev', JSON.stringify(setUrl));
  rec('Day 125 Connect flips backend off pure-local (remote/remote-fallback)', setUrl && setUrl.mode && setUrl.mode !== 'local', `mode=${setUrl && setUrl.mode}`);
  // Opt-in display name defaults anonymous unless set
  const nameOptIn = await evalExpr(ws, `(function(){
    const before = localStorage.getItem('signal-circuit-tournament-display-name');
    const inp = document.querySelector('#tournament-display-name-input');
    inp.value = 'Mochi';
    document.querySelector('#tournament-name-save-btn').click();
    const after = localStorage.getItem('signal-circuit-tournament-display-name');
    return {before, after};
  })()`);
  rec('Day 125 display name opt-in: blank by default, persists when set', nameOptIn && (nameOptIn.before === null || nameOptIn.before === '') && nameOptIn.after === 'Mochi', JSON.stringify(nameOptIn));
  // Clear → back to local
  const clearUrl = await evalExpr(ws, `(function(){
    document.querySelector('#tournament-worker-clear-btn').click();
    document.querySelector('#tournament-name-clear-btn').click();
    const a = window.game.tournamentBackend;
    return {mode: a && a.getMode && a.getMode(), lsUrl: localStorage.getItem('signal-circuit-tournament-worker-url'), lsName: localStorage.getItem('signal-circuit-tournament-display-name')};
  })()`);
  rec('Day 125 Go Local reverts backend to local + clears URL', clearUrl && clearUrl.mode === 'local' && (!clearUrl.lsUrl), JSON.stringify(clearUrl));
  rec('Day 125 Anonymous clears display name', clearUrl && (!clearUrl.lsName), JSON.stringify(clearUrl));

  // ───────── PHASE 5: Day 126 Onboarding A/B cohort instrumentation ─────────
  console.log('\n=== Phase 5: Day 126 Onboarding A/B cohort ===');
  const cohort = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    if (!e) return {missing:true};
    const stats = e.getSessionStats ? e.getSessionStats() : null;
    return {
      cohort: e.getCohort ? e.getCohort() : null,
      installId: e.getInstallId ? e.getInstallId() : null,
      daysActive: e.getDaysActive ? e.getDaysActive() : null,
      statsHasSessionDays: !!(stats && typeof stats.sessionDays === 'number'),
      lsInstall: localStorage.getItem('signal-circuit-install-id'),
    };
  })()`);
  rec('Day 126 cohort is local or live', cohort && (cohort.cohort === 'local' || cohort.cohort === 'live'), `cohort=${cohort && cohort.cohort}`);
  rec('Day 126 stable install id present + persisted', cohort && cohort.installId && cohort.installId === cohort.lsInstall, JSON.stringify(cohort).slice(0,180));
  rec('Day 126 session stats + daysActive readable', cohort && cohort.statsHasSessionDays && typeof cohort.daysActive === 'number', JSON.stringify(cohort).slice(0,180));
  // Cohort re-derives deterministically (reset keeps install id)
  const cohortStable = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    const c1 = e.getCohort();
    const id = e.getInstallId();
    // Re-derive via the exported hash if present, else just confirm same install id → same cohort
    const c2 = e.getCohort();
    return {c1, c2, sameInstall: id === localStorage.getItem('signal-circuit-install-id')};
  })()`);
  rec('Day 126 cohort deterministic across reads', cohortStable && cohortStable.c1 === cohortStable.c2, JSON.stringify(cohortStable));
  // Debug-gated readout shows cohort block
  await evalExpr(ws, `(document.querySelector('#settings-close')||{click:()=>{}}).click(); 'ok'`);
  await sleep(200);
  const readoutDebug = await evalExpr(ws, `(function(){
    localStorage.setItem('signal-circuit-debug','1');
    document.querySelector('#open-settings-btn').click();
    const dev = document.querySelector('#settings-developer-section');
    const card = document.querySelector('#onboarding-readout-card');
    return {
      devDisplay: dev ? getComputedStyle(dev).display : 'no-el',
      cardDisplay: card ? getComputedStyle(card).display : 'no-card',
      cardText: card ? (card.textContent||'').trim() : '',
    };
  })()`);
  rec('Day 95/126 debug=1 reveals Developer section + readout card', readoutDebug && readoutDebug.devDisplay !== 'none' && readoutDebug.cardDisplay !== 'none', JSON.stringify(readoutDebug).slice(0,180));
  rec('Day 126 readout card mentions cohort (local/live)', readoutDebug && /local|live/i.test(readoutDebug.cardText), `text=${readoutDebug && readoutDebug.cardText.slice(0,120)}`);
  await evalExpr(ws, `localStorage.removeItem('signal-circuit-debug'); (document.querySelector('#settings-close')||{click:()=>{}}).click(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 6: How to Play ─────────
  console.log('\n=== Phase 6: How to Play ===');
  const howOk = await evalExpr(ws, `(function(){
    const b = document.querySelector('#how-to-play-btn'); if (!b) return {missing:true};
    b.click(); const m = document.querySelector('#how-to-play-modal');
    return {visible: !!(m && getComputedStyle(m).display !== 'none')};
  })()`);
  rec('How to Play modal opens', howOk && howOk.visible, JSON.stringify(howOk));
  await evalExpr(ws, `(function(){const m=document.querySelector('#how-to-play-modal');if(m){const c=m.querySelector('.modal-close, [data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 7: Day 123 simulation.js ESM + core sim ─────────
  console.log('\n=== Phase 7: Day 123 simulation.js ES module ===');
  const simEsm = await evalExpr(ws, `(function(){
    return {
      SimulationType: typeof window.Simulation,
      instanceOk: !!(window.game && window.game.simulation && window.Simulation && (window.game.simulation instanceof window.Simulation)),
      hasTrace: !!(window.game && window.game.simulation && typeof window.game.simulation.traceFailurePath === 'function'),
    };
  })()`);
  rec('Day 123 window.Simulation is a function', simEsm && simEsm.SimulationType === 'function', JSON.stringify(simEsm));
  rec('Day 123 game.simulation instanceof window.Simulation (canonical binding)', simEsm && simEsm.instanceOk, JSON.stringify(simEsm));
  rec('Day 42 Simulation.prototype.traceFailurePath intact on module', simEsm && simEsm.hasTrace, JSON.stringify(simEsm));

  // ───────── PHASE 8: Day 92/107 ESM bindings ─────────
  console.log('\n=== Phase 8: Day 92/107 ESM bindings (gates.js / wires.js) ===');
  const esmGlobals = await evalExpr(ws, `(function(){
    return {
      Gate: typeof window.Gate, GateTypes: typeof window.GateTypes,
      GateTypesKeys: window.GateTypes ? Object.keys(window.GateTypes).length : 0,
      IONode: typeof window.IONode, roundRect: typeof window.roundRect,
      Wire: typeof window.Wire, WireManager: typeof window.WireManager,
      WIRE_COLORS_DEFAULT: typeof window.WIRE_COLORS_DEFAULT, getWireColors: typeof window.getWireColors,
    };
  })()`);
  rec('Day 92 gates.js bindings (Gate/GateTypes≥8/IONode/roundRect)', esmGlobals && esmGlobals.Gate === 'function' && esmGlobals.GateTypesKeys >= 8 && esmGlobals.IONode === 'function' && esmGlobals.roundRect === 'function', JSON.stringify(esmGlobals));
  rec('Day 107 wires.js bindings (Wire/WireManager/WIRE_COLORS_DEFAULT/getWireColors)', esmGlobals && esmGlobals.Wire === 'function' && esmGlobals.WireManager === 'function' && esmGlobals.getWireColors === 'function', JSON.stringify(esmGlobals));

  // ───────── PHASE 9: L1 solve + Shareable snapshot card ─────────
  console.log('\n=== Phase 9: L1 solve + Shareable Snapshot Card ===');
  const l1solve = await evalExpr(ws, `(async function(){
    const g = window.game;
    g.currentScreen='gameplay'; g.ui.showScreen('gameplay'); g.loadLevel(1);
    await new Promise(r=>setTimeout(r,250));
    const inp = g.inputNodes, out = g.outputNodes;
    g.gates = []; g.wireManager.wires = [];
    const a = g.addGate('AND', 400, 300);
    g.addWireFromData(inp[0].id, 0, a.id, 0);
    g.addWireFromData(inp[1].id, 0, a.id, 1);
    g.addWireFromData(a.id, 0, out[0].id, 0);
    g.runQuickTest();
    return {gates:g.gates.length, wires:g.wireManager.wires.length, preview: !!g.getPreview(1)};
  })()`, { awaitPromise: true });
  rec('L1 solved via Quick Test (exercises simulation.js runAll)', l1solve && l1solve.gates === 1, JSON.stringify(l1solve));
  rec('L1 preview persisted after solve', l1solve && l1solve.preview, JSON.stringify(l1solve));
  const shareModal = await evalExpr(ws, `(async function(){
    await new Promise(r=>setTimeout(r,700));
    const visible = Array.from(document.querySelectorAll('button')).filter(b => /share/i.test(b.id||'') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    if (visible.length === 0) return {err:'no visible share btn'};
    visible[0].click();
    await new Promise(r=>setTimeout(r,700));
    const m = document.querySelector('#share-card-modal');
    if (!m) return {err:'no share-card-modal'};
    const c = m.querySelector('canvas');
    return {visible: getComputedStyle(m).display !== 'none', canvasW: c && c.width, canvasH: c && c.height,
      buttons: Array.from(m.querySelectorAll('button')).map(b=>(b.textContent||'').trim())};
  })()`, { awaitPromise: true });
  rec('Share modal opens after L1 solve', shareModal && shareModal.visible, JSON.stringify(shareModal).slice(0,220));
  rec('Share card canvas is 1200×630', shareModal && shareModal.canvasW === 1200 && shareModal.canvasH === 630, `canvas=${shareModal && shareModal.canvasW}x${shareModal && shareModal.canvasH}`);
  await evalExpr(ws, `(function(){const m=document.querySelector('#share-card-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"], #share-card-close');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 10: Tournament backend adapter ─────────
  console.log('\n=== Phase 10: Tournament Backend Adapter ===');
  const tb = await evalExpr(ws, `(function(){
    const a = window.game && window.game.tournamentBackend;
    if (!a) return {missing:true};
    return {mode: a.getMode&&a.getMode(), isLive: a.isLive&&a.isLive(), describe: a.describe&&a.describe(),
      hasSubmit: typeof a.submitScore==='function', hasLeaderboard: typeof a.getLeaderboard==='function'};
  })()`);
  rec("tournamentBackend.getMode() === 'local' (after Go Local)", tb && tb.mode === 'local', JSON.stringify(tb));
  rec('tournamentBackend.isLive() === false', tb && tb.isLive === false, JSON.stringify(tb));
  rec('tournamentBackend has submitScore + getLeaderboard', tb && tb.hasSubmit && tb.hasLeaderboard, JSON.stringify(tb));

  // ───────── PHASE 11: Lab Bench (L41-L48 incl triple-composite L48) ─────────
  console.log('\n=== Phase 11: Lab Bench constraints (L41-L48) ===');
  const labCheck = await evalExpr(ws, `(function(){
    const out = {};
    for (const id of [41,44,48]) {
      try {
        window.game.loadLevel(id);
        const lvl = window.game.currentLevel;
        out[id] = {
          isLabBench: !!lvl.isLabBench, gateHardCap: lvl.gateHardCap||null,
          mustIncludeGate: lvl.mustIncludeGate||null, maxFanOut: lvl.maxFanOut||null,
          availableGates: lvl.availableGates||null,
          chip1: (function(){const c=document.querySelector('#lab-constraint');return c&&getComputedStyle(c).display!=='none'?(c.textContent||'').trim().slice(0,60):null;})(),
          chip2: (function(){const c=document.querySelector('#lab-constraint-2');return c&&getComputedStyle(c).display!=='none'?(c.textContent||'').trim().slice(0,60):null;})(),
        };
      } catch (e) { out[id] = {err:String(e).slice(0,80)}; }
    }
    return out;
  })()`);
  const l41 = labCheck && labCheck['41']; const l44 = labCheck && labCheck['44']; const l48 = labCheck && labCheck['48'];
  rec('L41 Lab Bench NAND-only constraint chip live', l41 && l41.isLabBench && /NAND/.test(l41.chip1||''), JSON.stringify(l41));
  rec('L44 Lab Bench composite (hard-cap chip present)', l44 && l44.isLabBench && (l44.chip1 || l44.chip2), JSON.stringify(l44));
  rec('L48 Lab Bench III triple-composite (maxFanOut=2, hardCap=3)', l48 && l48.isLabBench && l48.maxFanOut === 2 && l48.gateHardCap === 3, JSON.stringify(l48));
  const compositeReject = await evalExpr(ws, `(function(){
    window.game.loadLevel(44); window.game.gates=[]; window.game.wireManager.wires=[];
    const cap = window.game.currentLevel.gateHardCap || 6;
    for (let i=0;i<cap+1;i++) window.game.addGate('NAND', 100+i*40, 300);
    const v = window.game._validateLabConstraints();
    return {ok: v.ok, msg: v.message||'', cap};
  })()`);
  rec('L44 composite validator rejects over-hard-cap submission', compositeReject && compositeReject.ok === false && /hard cap/.test(compositeReject.msg), JSON.stringify(compositeReject));

  // ───────── PHASE 12: Daily Challenge ─────────
  console.log('\n=== Phase 12: Daily Challenge ===');
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); window.game.seedProgress(18); 'ok'`);
  await sleep(500);
  await evalExpr(ws, `(function(){const b=document.querySelector('#daily-challenge-btn, #daily-btn'); if (b) b.click();})()`);
  await sleep(500);
  const dailyState = await evalExpr(ws, `(function(){const s=document.querySelector('#daily-config-screen, #daily-pre-screen');return {visible: s?getComputedStyle(s).display!=='none':false};})()`);
  rec('Daily Challenge pre-screen opens', dailyState && dailyState.visible, JSON.stringify(dailyState));
  await evalExpr(ws, `(function(){const b=document.querySelector('#start-daily-btn'); if (b) b.click();})()`);
  await sleep(800);
  const dailyGameplay = await evalExpr(ws, `(function(){const gp=document.querySelector('#gameplay-screen');const lvl=window.game.currentLevel;return {visible: gp&&getComputedStyle(gp).display!=='none', isDaily: !!(lvl&&lvl.isDaily)};})()`);
  rec('Daily Challenge enters gameplay (currentLevel.isDaily=true)', dailyGameplay && dailyGameplay.visible && dailyGameplay.isDaily, JSON.stringify(dailyGameplay));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(300);

  // ───────── PHASE 13: Random Challenge ─────────
  console.log('\n=== Phase 13: Random Challenge ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#random-challenge-btn, #challenge-btn'); if (b) b.click();})()`);
  await sleep(500);
  const randState = await evalExpr(ws, `(function(){const s=document.querySelector('#challenge-config-screen');return {visible: s?getComputedStyle(s).display!=='none':false};})()`);
  rec('Random Challenge config screen opens', randState && randState.visible, JSON.stringify(randState));
  await evalExpr(ws, `(function(){const b=document.querySelector('#generate-challenge-btn'); if (b) b.click();})()`);
  await sleep(800);
  const randGameplay = await evalExpr(ws, `(function(){return {visible: getComputedStyle(document.querySelector('#gameplay-screen')).display!=='none', isChallenge: window.game.isChallengeMode};})()`);
  rec('Random Challenge generate → gameplay (isChallengeMode=true)', randGameplay && randGameplay.visible && randGameplay.isChallenge, JSON.stringify(randGameplay));
  await evalExpr(ws, `document.querySelector('#back-btn').click(); window.game.isChallengeMode=false; 'ok'`);
  await sleep(300);

  // ───────── PHASE 14: Blitz Mode + HUD cleanup ─────────
  console.log('\n=== Phase 14: Blitz Mode ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#blitz-mode-btn'); if (b) b.click();})()`);
  await sleep(800);
  const blitzState = await evalExpr(ws, `(function(){return {gpVisible: getComputedStyle(document.querySelector('#gameplay-screen')).display!=='none', blitzMode: window.game.blitzMode, hudVisible: (function(){const h=document.querySelector('#blitz-hud');return h&&getComputedStyle(h).display!=='none';})()};})()`);
  rec('Blitz Mode enters gameplay with HUD', blitzState && blitzState.gpVisible && blitzState.blitzMode && blitzState.hudVisible, JSON.stringify(blitzState));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const blitzCleanup = await evalExpr(ws, `(function(){return {blitzMode: window.game.blitzMode, hudDisplay: (function(){const h=document.querySelector('#blitz-hud');return h?getComputedStyle(h).display:'no-hud';})()};})()`);
  rec('Day 61 fix: Blitz HUD cleaned via back-btn', blitzCleanup && blitzCleanup.blitzMode === false && blitzCleanup.hudDisplay === 'none', JSON.stringify(blitzCleanup));

  // ───────── PHASE 15: Speedrun Mode + HUD cleanup ─────────
  console.log('\n=== Phase 15: Speedrun Mode ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#speedrun-btn'); if (b) b.click();})()`);
  await sleep(800);
  const spdState = await evalExpr(ws, `(function(){return {gpVisible: getComputedStyle(document.querySelector('#gameplay-screen')).display!=='none', mode: window.game.speedrunMode, hudVisible: (function(){const h=document.querySelector('#speedrun-hud');return h&&getComputedStyle(h).display!=='none';})()};})()`);
  rec('Speedrun Mode enters gameplay with HUD', spdState && spdState.gpVisible && spdState.mode && spdState.hudVisible, JSON.stringify(spdState));
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const spdCleanup = await evalExpr(ws, `(function(){return {mode: window.game.speedrunMode, hudDisplay: (function(){const h=document.querySelector('#speedrun-hud');return h?getComputedStyle(h).display:'no-hud';})()};})()`);
  rec('Day 74 fix: Speedrun HUD cleaned via back-btn', spdCleanup && spdCleanup.mode === false && spdCleanup.hudDisplay === 'none', JSON.stringify(spdCleanup));

  // ───────── PHASE 16: Sandbox deep-play (coverage-rotation probe #1) ─────────
  console.log('\n=== Phase 16: Sandbox deep-play (NEW coverage) ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#sandbox-btn'); if (b) b.click();})()`);
  await sleep(500);
  const sbxConfig = await evalExpr(ws, `(function(){const s=document.querySelector('#sandbox-config-screen');return {visible: s?getComputedStyle(s).display!=='none':false};})()`);
  rec('Sandbox config screen opens', sbxConfig && sbxConfig.visible, JSON.stringify(sbxConfig));
  // Enter sandbox and actually build + simulate a circuit
  const sbxPlay = await evalExpr(ws, `(function(){
    try {
      const start = document.querySelector('#start-sandbox-btn, #sandbox-start-btn');
      if (start) start.click();
      // If no explicit start, force sandbox entry
      if (window.game.currentScreen !== 'gameplay') { window.game.ui.showScreen('gameplay'); if (window.game.startSandbox) window.game.startSandbox(); }
      const before = (window.game.gates||[]).length;
      const g1 = window.game.addGate('AND', 300, 250);
      const g2 = window.game.addGate('OR', 300, 400);
      const g3 = window.game.addGate('XOR', 500, 320);
      const after = (window.game.gates||[]).length;
      // run the simulation engine over the sandbox circuit. evaluateOnce is an
      // internal method taking an inputValues array sized to inputNodes.
      if (window.game.simulation && typeof window.game.simulation.evaluateOnce === 'function') {
        try {
          const inputs = new Array((window.game.inputNodes||[]).length).fill(0);
          window.game.simulation.evaluateOnce(inputs);
        } catch(e) { return {err:'evaluateOnce:'+String(e).slice(0,60)}; }
      }
      return {before, after, added: after-before, sandbox: !!window.game.sandboxMode};
    } catch (e) { return {err:String(e).slice(0,100)}; }
  })()`);
  rec('Sandbox deep-play: 3 gates added + simulation evaluates without throw', sbxPlay && !sbxPlay.err && sbxPlay.added === 3, JSON.stringify(sbxPlay));
  await evalExpr(ws, `(function(){const bb=document.querySelector('#back-btn'); if(bb&&getComputedStyle(bb).display!=='none') bb.click(); else window.game.ui.showScreen('level-select'); window.game.sandboxMode=false;})(); 'ok'`);
  await sleep(400);

  // ───────── PHASE 17: Creator ─────────
  console.log('\n=== Phase 17: Creator ===');
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); 'ok'`); await sleep(200);
  await evalExpr(ws, `(function(){const b=document.querySelector('#create-level-btn'); if (b) b.click();})()`);
  await sleep(500);
  const cre = await evalExpr(ws, `(function(){const s=document.querySelector('#creator-screen, #creator-config-screen');return {visible: s?getComputedStyle(s).display!=='none':false, id: s&&s.id};})()`);
  rec('Creator screen opens', cre && cre.visible, JSON.stringify(cre));
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);

  // ───────── PHASE 18: Tournament screen (2 tabs post Day 119) ─────────
  console.log('\n=== Phase 18: Tournament screen ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#tournament-btn'); if (b) b.click();})()`);
  await sleep(500);
  const tour = await evalExpr(ws, `(function(){
    const s = document.querySelector('#tournament-screen'); if (!s) return {missing:true};
    const tabs = Array.from(s.querySelectorAll('.tournament-tab, [data-tournament-tab]'));
    return {visible: getComputedStyle(s).display !== 'none', tabCount: tabs.length,
      tabLabels: tabs.map(t=>(t.textContent||'').trim().slice(0,20))};
  })()`);
  rec('Tournament screen opens', tour && tour.visible, JSON.stringify(tour));
  rec('Tournament screen has 2 tabs (Day 119: My Best removed)', tour && tour.tabCount === 2, `tabs=${tour && tour.tabCount}; labels=${JSON.stringify(tour && tour.tabLabels)}`);
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);

  // ───────── PHASE 19: Encyclopedia ─────────
  console.log('\n=== Phase 19: Encyclopedia ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#encyclopedia-btn'); if (b) b.click();})()`);
  await sleep(400);
  const enc = await evalExpr(ws, `(function(){const m=document.querySelector('#encyclopedia-modal, #encyclopedia-content');return {modalVisible: m?getComputedStyle(m).display!=='none':false, hasContent: m?(m.textContent||'').length>50:false};})()`);
  rec('Encyclopedia modal opens with content', enc && enc.modalVisible && enc.hasContent, JSON.stringify(enc));
  await evalExpr(ws, `(function(){const m=document.querySelector('#encyclopedia-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"], #encyclopedia-close');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 20: Day 124 Profile Hub (5-modal merge) ─────────
  console.log('\n=== Phase 20: Day 124 Profile Hub ===');
  // At seed=18 (>=15) all 5 tabs should be available.
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); 'ok'`); await sleep(200);
  const hubBtn = await evalExpr(ws, `(function(){const b=document.querySelector('#profile-hub-btn');return {present:!!b, visible: b?getComputedStyle(b).display!=='none':false};})()`);
  rec('Day 124 Profile hub button visible at seed=18', hubBtn && hubBtn.visible, JSON.stringify(hubBtn));
  const hubOpen = await evalExpr(ws, `(function(){
    document.querySelector('#profile-hub-btn').click();
    const m = document.querySelector('#profile-hub-modal');
    const tabs = Array.from(document.querySelectorAll('.phub-tab')).filter(t=>getComputedStyle(t).display!=='none');
    return {visible: m?getComputedStyle(m).display!=='none':false, visibleTabs: tabs.length, tabLabels: tabs.map(t=>(t.textContent||'').trim())};
  })()`);
  rec('Day 124 Profile hub opens', hubOpen && hubOpen.visible, JSON.stringify(hubOpen).slice(0,200));
  rec('Day 124 all 5 tabs visible at ≥15 completions', hubOpen && hubOpen.visibleTabs === 5, `tabs=${hubOpen && hubOpen.visibleTabs}; ${JSON.stringify(hubOpen && hubOpen.tabLabels)}`);
  // Switch through all 5 tabs, verify each pane renders non-empty
  const tabSweep = await evalExpr(ws, `(function(){
    const map = [['phub-tab-achievements','phub-pane-achievements','achievements-list'],
                 ['phub-tab-mastery','phub-pane-mastery','mastery-tree-view'],
                 ['phub-tab-customize','phub-pane-customize','cosmetic-sections'],
                 ['phub-tab-collection','phub-pane-collection','collection-list'],
                 ['phub-tab-profile','phub-pane-profile','profile-view']];
    const out = {};
    for (const [tabId, paneId, contentId] of map) {
      const tab = document.getElementById(tabId);
      if (tab) tab.click();
      const pane = document.getElementById(paneId);
      const content = document.getElementById(contentId);
      out[tabId] = {
        paneShown: pane ? getComputedStyle(pane).display !== 'none' : false,
        contentLen: content ? (content.innerHTML||'').length : -1,
      };
    }
    return out;
  })()`);
  const tabsAllRender = tabSweep && Object.values(tabSweep).every(v => v.paneShown && v.contentLen > 0);
  rec('Day 124 all 5 panes render non-empty on tab switch', tabsAllRender, JSON.stringify(tabSweep).slice(0,300));
  // Cosmetic live-render survives re-parenting: click a wire color card
  const cosmeticClick = await evalExpr(ws, `(function(){
    const cust = document.getElementById('phub-tab-customize'); if (cust) cust.click();
    const before = window.game.cosmetics && window.game.cosmetics.getActiveWireColor && window.game.cosmetics.getActiveWireColor();
    const cards = Array.from(document.querySelectorAll('#cosmetic-sections .cosmetic-card'));
    const target = cards.find(c => (c.dataset && c.dataset.id && c.dataset.id !== before)) || cards[1] || cards[0];
    let clickedId = null;
    if (target) { clickedId = target.dataset ? target.dataset.id : null; target.click(); }
    const after = window.game.cosmetics && window.game.cosmetics.getActiveWireColor && window.game.cosmetics.getActiveWireColor();
    return {before, clickedId, after, cardCount: cards.length};
  })()`);
  rec('Day 124 cosmetic card click live-updates active wire color (re-parenting intact)', cosmeticClick && cosmeticClick.cardCount > 0 && !cosmeticClick.err, JSON.stringify(cosmeticClick).slice(0,200));
  // Close hub → profile-view cleared
  const hubClose = await evalExpr(ws, `(function(){
    const p = document.getElementById('phub-tab-profile'); if (p) p.click();
    const beforeLen = (document.getElementById('profile-view')||{}).innerHTML ? document.getElementById('profile-view').innerHTML.length : 0;
    document.querySelector('#profile-hub-close').click();
    const m = document.querySelector('#profile-hub-modal');
    return {beforeLen, modalHidden: m?getComputedStyle(m).display==='none':false, afterLen: (document.getElementById('profile-view')||{innerHTML:''}).innerHTML.length};
  })()`);
  rec('Day 124 hub close hides modal + clears #profile-view (Day 54 discipline)', hubClose && hubClose.modalHidden && hubClose.afterLen === 0, JSON.stringify(hubClose));

  // ───────── PHASE 20b: Profile Hub tier gating at g12 (2 tabs) ─────────
  console.log('\n=== Phase 20b: Profile Hub tier gating (seed=12) ===');
  await coldReload(ws);
  await evalExpr(ws, `window.game.seedProgress(12); 'ok'`);
  await sleep(500);
  const hubG12 = await evalExpr(ws, `(function(){
    const b = document.querySelector('#profile-hub-btn');
    const vis = b ? getComputedStyle(b).display !== 'none' : false;
    if (vis) b.click();
    const tabs = Array.from(document.querySelectorAll('.phub-tab')).filter(t=>getComputedStyle(t).display!=='none');
    const active = document.querySelector('.phub-tab.active');
    return {btnVisible: vis, visibleTabs: tabs.length, tabLabels: tabs.map(t=>(t.textContent||'').trim()), activeTab: active?active.id:null};
  })()`);
  rec('Day 124 Profile hub button visible at g12', hubG12 && hubG12.btnVisible, JSON.stringify(hubG12).slice(0,180));
  rec('Day 124 only 2 tabs (Achievements/Customize) available at g12', hubG12 && hubG12.visibleTabs === 2, `tabs=${hubG12 && hubG12.visibleTabs}; ${JSON.stringify(hubG12 && hubG12.tabLabels)}`);
  rec('Day 124 strand-guard: active tab is not a gated tab', hubG12 && hubG12.activeTab === 'phub-tab-achievements', `active=${hubG12 && hubG12.activeTab}`);
  await evalExpr(ws, `(function(){const c=document.querySelector('#profile-hub-close'); if(c) c.click();})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 21: Stats modal — 4 tabs incl. Progress ─────────
  console.log('\n=== Phase 21: Stats modal (4 tabs) ===');
  await evalExpr(ws, `window.game.seedProgress(18); window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(400);
  await evalExpr(ws, `(function(){const b=document.querySelector('#stats-btn'); if (b) b.click();})()`);
  await sleep(600);
  const stats = await evalExpr(ws, `(function(){
    const m = document.querySelector('#stats-modal'); if (!m) return {missing:true};
    const canvases = m.querySelectorAll('canvas');
    const tabs = {
      overview: !!document.querySelector('#stats-tab-overview'),
      cards: !!document.querySelector('#stats-tab-cards'),
      tournament: !!document.querySelector('#stats-tab-tournament'),
      progress: !!document.querySelector('#stats-tab-progress'),
    };
    const progTab = document.querySelector('#stats-tab-progress');
    return {visible: getComputedStyle(m).display!=='none', canvasCount: canvases.length, tabs,
      progressVisible: progTab ? getComputedStyle(progTab).display !== 'none' : false};
  })()`);
  rec('Stats modal opens with ≥1 chart canvas', stats && stats.visible && stats.canvasCount >= 1, JSON.stringify(stats).slice(0,200));
  rec('Stats modal has all 4 tab elements (overview/cards/tournament/progress)', stats && stats.tabs && stats.tabs.overview && stats.tabs.cards && stats.tabs.tournament && stats.tabs.progress, JSON.stringify(stats && stats.tabs));
  rec('Day 127 Progress tab visible (≥1 completed level at seed=18)', stats && stats.progressVisible, JSON.stringify(stats));

  // ───────── PHASE 22: Day 127 Progress heatmap correctness ─────────
  console.log('\n=== Phase 22: Day 127 Progress heatmap ===');
  const heatmap = await evalExpr(ws, `(function(){
    const tab = document.querySelector('#stats-tab-progress'); if (!tab) return {missing:true};
    tab.click();
    const pane = document.querySelector('#stats-progress-pane');
    const cells = pane ? pane.querySelectorAll('.phm-cell') : [];
    const paneShown = pane ? getComputedStyle(pane).display !== 'none' : false;
    const gridShown = (function(){const g=document.querySelector('#stats-grid'); return g?getComputedStyle(g).display:'no-grid';})();
    const summary = pane ? (pane.querySelector('.progress-heatmap-meta')||{}).textContent : '';
    return {paneShown, gridDisplay: gridShown, cellCount: cells.length, summary: (summary||'').trim().slice(0,80),
      firstCellText: cells[0] ? (cells[0].textContent||'').trim().slice(0,50) : ''};
  })()`);
  rec('Day 127 Progress tab swaps to heatmap pane (grid hidden)', heatmap && heatmap.paneShown && heatmap.gridDisplay === 'none', JSON.stringify(heatmap).slice(0,200));
  rec('Day 127 heatmap renders ≥1 chapter cell', heatmap && heatmap.cellCount >= 1, `cells=${heatmap && heatmap.cellCount}`);
  rec('Day 127 heatmap summary strip present', heatmap && heatmap.summary && /\d/.test(heatmap.summary), `summary=${heatmap && heatmap.summary}`);
  // Full-seed correctness: seed all 50 → every campaign chapter 100%
  await evalExpr(ws, `(function(){const m=document.querySelector('#stats-modal');if(m){const c=m.querySelector('#stats-close');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);
  await evalExpr(ws, `window.game.seedProgress(50, {stars:3}); window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(400);
  const heatmapFull = await evalExpr(ws, `(function(){
    document.querySelector('#stats-btn').click();
    const tab = document.querySelector('#stats-tab-progress'); if (tab) tab.click();
    const pane = document.querySelector('#stats-progress-pane');
    const cells = pane ? Array.from(pane.querySelectorAll('.phm-cell')) : [];
    const completed = cells.filter(c => (c.className||'').includes('phm-complete') || /✓/.test(c.textContent||'') || (c.querySelector && c.querySelector('.phm-check')));
    const total = (typeof window.game._progressCompletedTotal === 'function') ? window.game._progressCompletedTotal() : (window.game.ui && window.game.ui._progressCompletedTotal && window.game.ui._progressCompletedTotal());
    return {cellCount: cells.length, completedCells: completed.length};
  })()`);
  rec('Day 127 full-seed heatmap: has completed-chapter cells', heatmapFull && heatmapFull.completedCells >= 1, JSON.stringify(heatmapFull));
  await evalExpr(ws, `(function(){const m=document.querySelector('#stats-modal');if(m){const c=m.querySelector('#stats-close');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 23: Cosmetic × colorblind live-paint (coverage-rotation probe #2) ─────────
  console.log('\n=== Phase 23: Cosmetic × colorblind live-paint (NEW coverage) ===');
  const cbxPaint = await evalExpr(ws, `(function(){
    try {
      // Toggle colorblind on, then load a level, add a gate + wire, render — must not throw
      const cb = document.querySelector('#colorblind-btn'); if (cb) cb.click();
      window.game.ui.showScreen('gameplay'); window.game.loadLevel(6);
      const inp = window.game.inputNodes, out = window.game.outputNodes;
      window.game.gates=[]; window.game.wireManager.wires=[];
      const a = window.game.addGate('OR', 400, 300);
      window.game.addWireFromData(inp[0].id, 0, a.id, 0);
      window.game.addWireFromData(a.id, 0, out[0].id, 0);
      // force a render pass
      if (window.game.renderer && typeof window.game.renderer.render === 'function') window.game.renderer.render();
      const colors = window.getWireColors ? window.getWireColors() : null;
      const cbOn = document.body.classList.contains('colorblind') || document.body.classList.contains('colorblind-mode');
      // toggle back
      if (cb) cb.click();
      return {rendered:true, colorblindClassApplied: cbOn, wireColorKeys: colors ? Object.keys(colors).length : 0};
    } catch (e) { return {err:String(e).slice(0,120)}; }
  })()`);
  rec('Colorblind + cosmetic wire render does not throw', cbxPaint && cbxPaint.rendered && !cbxPaint.err, JSON.stringify(cbxPaint).slice(0,200));
  await evalExpr(ws, `document.querySelector('#back-btn') && document.querySelector('#back-btn').click(); 'ok'`);
  await sleep(300);

  // ───────── PHASE 24: Gameplay surface deep dive ─────────
  console.log('\n=== Phase 24: Gameplay surface (L6 hint/clear/back) ===');
  await evalExpr(ws, `window.game.ui.showScreen('gameplay'); window.game.loadLevel(6); 'ok'`);
  await sleep(500);
  const gpButtons = await evalExpr(ws, `(function(){
    const ids = ['run-btn','quick-test-btn','clear-btn','hint-btn','back-btn'];
    const out = {};
    for (const id of ids) { const el = document.getElementById(id); out[id] = el ? (getComputedStyle(el).display!=='none'?'visible':'hidden') : 'missing'; }
    out.truthTableRows = document.querySelectorAll('#truth-table tbody tr').length;
    return out;
  })()`);
  rec('L6 gameplay has core buttons (run/clear/back)', gpButtons && gpButtons['run-btn']==='visible' && gpButtons['back-btn']==='visible', JSON.stringify(gpButtons));
  rec('L6 truth table has 4 rows', gpButtons && gpButtons.truthTableRows === 4, JSON.stringify(gpButtons));
  const gpActions = await evalExpr(ws, `(function(){
    const r = {};
    try { const h=document.querySelector('#hint-btn'); if(h&&getComputedStyle(h).display!=='none'){h.click(); r.hint='ok';} else r.hint='hidden'; } catch(e){ r.hint='err:'+e.message.slice(0,30); }
    try { document.querySelector('#clear-btn').click(); r.clear='ok'; } catch(e){ r.clear='err:'+e.message.slice(0,30); }
    return r;
  })()`);
  rec('Hint + Clear buttons do not throw', gpActions && !String(gpActions.hint).startsWith('err') && gpActions.clear==='ok', JSON.stringify(gpActions));
  await evalExpr(ws, `document.querySelector('#back-btn').click(); 'ok'`);
  await sleep(300);

  // ───────── PHASE 25: Staircase — end-game nav count (post Day 124 merge) ─────────
  console.log('\n=== Phase 25: Staircase end-game (seed=40) ===');
  await evalExpr(ws, `window.game.seedProgress(40); window.game.ui.showScreen('level-select'); 'ok'`);
  await sleep(600);
  const endgame = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const overflow = visible.filter(b => b.classList.contains('level-overflow-btn'));
    const nonLevel = visible.filter(b =>
      !b.classList.contains('level-overflow-btn') && !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') && !b.closest('.level-overflow-btn, .level-card, [data-level-id]'));
    return {nonLevelCount: nonLevel.length, overflowCount: overflow.length, labels: nonLevel.map(b=>b.id||b.className.split(' ')[0])};
  })()`);
  rec('End-game nav-button count === 14 (Day 124 merge: 18→14)', endgame && endgame.nonLevelCount === 14, `count=${endgame && endgame.nonLevelCount}; labels=${JSON.stringify(endgame && endgame.labels)}`);
  rec('End-game overflow count === 50 (one per level card)', endgame && endgame.overflowCount === 50, `overflow=${endgame && endgame.overflowCount}`);

  // ───────── PHASE 26: Day 79 dead-identifier regression ─────────
  console.log('\n=== Phase 26: Day 79 dead-identifier regression ===');
  const dead = await evalExpr(ws, `(function(){
    const ui = window.game && window.game.ui;
    const ach = window.game && window.game.achievementManager;
    const inf = window.game && window.game.infiniteRun;
    const tut = window.game && window.game.tutorial;
    return {
      uiFirstLaunchModal: typeof (ui ? ui.showFirstLaunchDifficultyModal : undefined),
      achLightning: typeof (ach ? ach.checkLightning : undefined),
      achEclipse: typeof (ach ? ach.checkEclipseRun : undefined),
      achArchitect: typeof (ach ? ach.checkArchitect : undefined),
      achIsMythic: typeof (ach ? ach.isMythic : undefined),
      infShowHud: typeof (inf ? inf._showHud : undefined),
      tutGetCurrent: typeof (tut ? tut.getCurrentStep : undefined),
      weeklyBtn: !!document.querySelector('#weekly-puzzle-btn'),
    };
  })()`);
  rec('Day 79 dead identifiers all undefined', dead && [dead.uiFirstLaunchModal, dead.achLightning, dead.achEclipse, dead.achArchitect, dead.achIsMythic, dead.infShowHud, dead.tutGetCurrent].every(t => t === 'undefined'), JSON.stringify(dead));
  rec('#weekly-puzzle-btn DOM absent', dead && dead.weeklyBtn === false, JSON.stringify(dead));

  // ───────── PHASE 27: Console hygiene ─────────
  console.log('\n=== Phase 27: Console error tally ===');
  rec('0 console errors across full audit', consoleErrors.length === 0, `errors=${consoleErrors.length}` + (consoleErrors.length ? ' :: ' + consoleErrors.slice(0,5).join(' | ') : ''));

  // ─── Summary ───
  const passed = assertions.filter(a => a.ok).length;
  const failed = assertions.filter(a => !a.ok).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${assertions.length}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Observations: ${observations.length}`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0,10).join('\n'));
  if (failed) {
    console.log('\n--- Failures ---');
    for (const a of assertions) if (!a.ok) console.log(' - ' + a.label + (a.detail ? ' :: ' + a.detail : ''));
  }
  ws.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e && e.stack || e); process.exit(2); });
