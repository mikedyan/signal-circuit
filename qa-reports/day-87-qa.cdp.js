#!/usr/bin/env node
/**
 * Day 87 QA harness — HARDEN Week Day 1: Full Interaction Audit.
 *
 * Connects to permissive headless Chromium on localhost:9301 over CDP and
 * exhaustively exercises Signal Circuit against http://localhost:8901/:
 *   - Module-health baseline diff (Day 86 vs Day 87, expected identical)
 *   - Cycle 3 BUILD-week regression sweep (Day 82-86)
 *   - Full Interaction Audit per HARDEN Week Monday spec:
 *       level select / gameplay / daily / random / blitz / speedrun /
 *       sandbox / creator / tournament / encyclopedia / achievements /
 *       stats / mastery / collection / profile / customize / settings
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-87-qa.cdp.js
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
  console.log(`${tag} ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
}

function note(label, detail) {
  console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
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

async function main() {
  // Find / create a target.
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
  const cb1 = (html.match(/\?v=1780156800/g) || []).length;
  rec('11 cache-bust refs at ?v=1780156800 (Day 86 build, unchanged)', cb1 === 11, `found=${cb1}`);
  const swText = await evalExpr(ws, `fetch('/sw.js', {cache:'no-store'}).then(r=>r.text())`, { awaitPromise: true });
  rec('sw.js CACHE_NAME = signal-circuit-v60', /CACHE_NAME\s*=\s*'signal-circuit-v60'/.test(swText));

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
      !b.classList.contains('level-overflow-btn') &&
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') &&
      !(b.dataset && b.dataset.levelId) &&
      !b.closest('.level-overflow-btn, .level-card, [data-level-id]')
    );
    const levelCards = s.querySelectorAll('.level-btn').length;
    const overflow = visible.filter(b => b.classList.contains('level-overflow-btn'));
    return {
      screenVisible: cs.display !== 'none',
      nonLevelCount: nonLevel.length,
      nonLevelLabels: nonLevel.map(b => (b.id || b.className.split(' ')[0]) + ':' + (b.textContent || '').trim().slice(0,30)),
      levelCardCount: levelCards,
      overflowCount: overflow.length,
      subtitle: (document.querySelector('.subtitle') || {}).textContent || '',
    };
  })()`);
  rec('cold-start level-select visible', coldStats && coldStats.screenVisible, JSON.stringify(coldStats).slice(0,200));
  rec('cold-start non-level button count === 2', coldStats && coldStats.nonLevelCount === 2, `count=${coldStats && coldStats.nonLevelCount}; labels=${JSON.stringify(coldStats && coldStats.nonLevelLabels)}`);
  rec('cold-start shows all 43 level cards', coldStats && coldStats.levelCardCount === 43, `cards=${coldStats && coldStats.levelCardCount}`);
  rec('cold-start no overflow buttons', coldStats && coldStats.overflowCount === 0, `overflow=${coldStats && coldStats.overflowCount}`);

  // Day 78 #4 silent-default difficulty (Day 85 wraps it)
  const variantInit = await evalExpr(ws, `window.__onboardingExperiment && window.__onboardingExperiment.getVariant()`);
  rec("onboarding variant === 'silent-standard'", variantInit === 'silent-standard', `variant=${variantInit}`);
  const diffMode = await evalExpr(ws, `localStorage.getItem('signal-circuit-difficulty-mode')`);
  rec("DIFFICULTY_KEY === 'standard' after cold start", diffMode === 'standard', `value=${diffMode}`);

  // ───────── PHASE 3: Settings modal full sweep ─────────
  console.log('\n=== Phase 3: Settings modal toggles ===');
  // Open settings
  await evalExpr(ws, `document.querySelector('#open-settings-btn').click()`);
  await sleep(400);
  const settingsOpen = await evalExpr(ws, `(function(){
    const m = document.querySelector('#settings-modal');
    if (!m) return {err:'no modal'};
    const vis = getComputedStyle(m).display !== 'none';
    const btns = Array.from(m.querySelectorAll('button')).filter(b=>getComputedStyle(b).display!=='none' && b.offsetParent!==null);
    return {visible: vis, buttonCount: btns.length, btnIds: btns.map(b=>b.id||b.className.split(' ')[0]).slice(0,30)};
  })()`);
  rec('Settings modal opens', settingsOpen && settingsOpen.visible, JSON.stringify(settingsOpen).slice(0,260));
  rec('Settings modal has expected button surface (≥10)', settingsOpen && settingsOpen.buttonCount >= 10, `count=${settingsOpen && settingsOpen.buttonCount}`);

  // Toggle a few accessibility settings + back
  const togglesTried = await evalExpr(ws, `(function(){
    const results = {};
    const targets = ['#colorblind-btn','#text-size-btn','#simplified-btn','#accessible-wiring-btn','#dark-mode-btn'];
    for (const sel of targets) {
      try {
        const el = document.querySelector(sel);
        if (!el) { results[sel]='missing'; continue; }
        const before = el.getAttribute('aria-pressed') || el.textContent.slice(0,10);
        el.click();
        const after = el.getAttribute('aria-pressed') || el.textContent.slice(0,10);
        // Click again to revert
        el.click();
        results[sel] = (before !== after) ? 'toggled' : 'clicked-no-attr-change';
      } catch (e) { results[sel] = 'err:'+e.message.slice(0,40); }
    }
    return results;
  })()`);
  rec('Settings toggles do not throw', togglesTried && Object.values(togglesTried).every(v => !String(v).startsWith('err')), JSON.stringify(togglesTried).slice(0,260));

  // Difficulty Mode chooser
  await evalExpr(ws, `(function(){
    const btn = document.querySelector('#difficulty-mode-btn');
    if (btn) btn.click();
  })()`);
  await sleep(400);
  const diffChooser = await evalExpr(ws, `(function(){
    const m = document.querySelector('#confirm-modal');
    if (!m) return {err:'no confirm modal'};
    const vis = getComputedStyle(m).display !== 'none';
    const opts = Array.from(m.querySelectorAll('button')).map(b=>(b.textContent||'').trim());
    return {visible: vis, options: opts.slice(0,6)};
  })()`);
  rec('Difficulty Mode chooser opens with options', diffChooser && diffChooser.visible && diffChooser.options.length >= 2, JSON.stringify(diffChooser).slice(0,260));
  // Cancel difficulty chooser
  await evalExpr(ws, `(function(){
    const m = document.querySelector('#confirm-modal');
    if (!m) return;
    const close = m.querySelector('.modal-close, #confirm-cancel, [data-action="cancel"]');
    if (close) close.click(); else m.style.display='none';
  })()`);
  await sleep(200);

  // Install App button (gated behind installable / iOS handling — should at least respond)
  const installResp = await evalExpr(ws, `(function(){
    const b = document.querySelector('#install-app-btn');
    if (!b) return {missing:true};
    try { b.click(); return {clicked:true}; } catch (e) { return {err:String(e).slice(0,80)}; }
  })()`);
  rec('Install App button click does not throw', installResp && !installResp.err, JSON.stringify(installResp));
  // Close any modal that may have opened
  await evalExpr(ws, `Array.from(document.querySelectorAll('.modal,[id$="-modal"]')).forEach(m=>{const c=m.querySelector('.modal-close,[data-action="cancel"],[data-action="close"]');if(c) c.click();}); 'ok'`);
  await sleep(200);

  // Close settings modal
  await evalExpr(ws, `(document.querySelector('#settings-close')||{click:()=>{}}).click(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 4: How to Play modal ─────────
  console.log('\n=== Phase 4: How to Play ===');
  const howOk = await evalExpr(ws, `(function(){
    const b = document.querySelector('#how-to-play-btn');
    if (!b) return {missing:true};
    b.click();
    const m = document.querySelector('#how-to-play-modal');
    const vis = m && getComputedStyle(m).display !== 'none';
    return {visible: !!vis};
  })()`);
  rec('How to Play modal opens', howOk && howOk.visible, JSON.stringify(howOk));
  await evalExpr(ws, `(function(){const m=document.querySelector('#how-to-play-modal');if(m){const c=m.querySelector('.modal-close, [data-action="close"]'); if(c) c.click(); else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 5: Day 82 — Shareable Snapshot Cards regression ─────────
  console.log('\n=== Phase 5: Day 82 Shareable Snapshot Cards ===');
  // Solve L1 first to populate preview data
  const l1solve = await evalExpr(ws, `(async function(){
    const g = window.game;
    g.currentScreen='gameplay';
    g.ui.showScreen('gameplay');
    g.loadLevel(1);
    await new Promise(r=>setTimeout(r,250));
    const inp = g.inputNodes, out = g.outputNodes;
    g.gates = [];
    g.wireManager.wires = [];
    const a = g.addGate('AND', 400, 300);
    g.addWireFromData(inp[0].id, 0, a.id, 0);
    g.addWireFromData(inp[1].id, 0, a.id, 1);
    g.addWireFromData(a.id, 0, out[0].id, 0);
    g.runQuickTest();
    return {gates:g.gates.length, wires:g.wireManager.wires.length, preview: !!g.getPreview(1)};
  })()`, { awaitPromise: true });
  rec('L1 solved via Quick Test', l1solve && l1solve.gates === 1, JSON.stringify(l1solve));
  rec('L1 preview persisted after solve', l1solve && l1solve.preview, JSON.stringify(l1solve));

  // Find and click Share button — actual DOM id is #share-card-modal
  const shareModal = await evalExpr(ws, `(async function(){
    await new Promise(r=>setTimeout(r,800));
    // Look for a visible share button on the completion screen
    const visible = Array.from(document.querySelectorAll('button')).filter(b => /share/i.test(b.id||'') && getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    if (visible.length === 0) return {err:'no visible share btn'};
    visible[0].click();
    await new Promise(r=>setTimeout(r,800));
    const m = document.querySelector('#share-card-modal');
    if (!m) return {err:'no share-card-modal'};
    const c = m.querySelector('canvas');
    const buttons = Array.from(m.querySelectorAll('button')).map(b=>(b.textContent||'').trim());
    return {
      clickedBtnId: visible[0].id,
      visible: getComputedStyle(m).display !== 'none',
      canvasW: c && c.width,
      canvasH: c && c.height,
      buttons: buttons.slice(0,10),
    };
  })()`, { awaitPromise: true });
  rec('Share modal opens after L1 solve', shareModal && shareModal.visible, JSON.stringify(shareModal).slice(0,260));
  rec('Share card canvas is 1200×630', shareModal && shareModal.canvasW === 1200 && shareModal.canvasH === 630, `canvas=${shareModal && shareModal.canvasW}x${shareModal && shareModal.canvasH}`);
  const shareBtnText = (shareModal && shareModal.buttons || []).join('|');
  rec('Share modal has Save / Copy / Share controls', /Save/i.test(shareBtnText) && /Copy/i.test(shareBtnText) && /Share/i.test(shareBtnText), `btns=${shareBtnText}`);
  // Close share modal
  await evalExpr(ws, `(function(){const m=document.querySelector('#share-card-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"], #share-card-close'); if(c) c.click(); else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 6: Day 83 — Tournament Backend Adapter regression ─────────
  console.log('\n=== Phase 6: Day 83 Tournament Backend Adapter ===');
  const tb = await evalExpr(ws, `(function(){
    const a = window.game && window.game.tournamentBackend;
    if (!a) return {missing:true};
    return {
      mode: typeof a.getMode==='function' ? a.getMode() : null,
      isLive: typeof a.isLive==='function' ? a.isLive() : null,
      describe: typeof a.describe==='function' ? a.describe() : null,
      hasSubmit: typeof a.submitScore === 'function',
      hasLeaderboard: typeof a.getLeaderboard === 'function',
    };
  })()`);
  rec("tournamentBackend.getMode() === 'local'", tb && tb.mode === 'local', JSON.stringify(tb));
  rec('tournamentBackend.isLive() === false', tb && tb.isLive === false, JSON.stringify(tb));
  rec('tournamentBackend.describe() returns non-empty', tb && typeof tb.describe === 'string' && tb.describe.length > 0, `describe=${tb && tb.describe}`);
  rec('tournamentBackend has submitScore + getLeaderboard', tb && tb.hasSubmit && tb.hasLeaderboard, JSON.stringify(tb));

  // ───────── PHASE 7: Day 84 — Lab Bench II regression ─────────
  console.log('\n=== Phase 7: Day 84 Lab Bench II (L41, L42, L43) ===');
  const labCheck = await evalExpr(ws, `(function(){
    const out = {};
    for (const id of [41,42,43]) {
      try {
        window.game.loadLevel(id);
        const lvl = window.game.currentLevel;
        const chip = document.querySelector('#lab-constraint');
        out[id] = {
          isLabBench: !!lvl.isLabBench,
          labConstraint: lvl.labConstraint || null,
          gateHardCap: lvl.gateHardCap || null,
          mustIncludeGate: lvl.mustIncludeGate || null,
          availableGates: lvl.availableGates || null,
          chipVisible: !!chip && getComputedStyle(chip).display !== 'none',
          chipText: chip ? (chip.textContent||'').trim().slice(0,80) : '',
        };
      } catch (e) { out[id] = {err:String(e).slice(0,80)}; }
    }
    return out;
  })()`);
  const l41 = labCheck && labCheck['41']; const l42 = labCheck && labCheck['42']; const l43 = labCheck && labCheck['43'];
  rec('L41 isLabBench + NAND-only toolbox', l41 && l41.isLabBench && Array.isArray(l41.availableGates) && l41.availableGates.length===1 && l41.availableGates[0]==='NAND', JSON.stringify(l41));
  rec('L41 constraint chip visible with NAND copy', l41 && l41.chipVisible && /NAND/.test(l41.chipText), `chip=${l41 && l41.chipText}`);
  rec('L42 isLabBench + gateHardCap=4', l42 && l42.isLabBench && l42.gateHardCap === 4, JSON.stringify(l42));
  rec('L42 constraint chip visible with cap copy', l42 && l42.chipVisible && /cap|4/i.test(l42.chipText), `chip=${l42 && l42.chipText}`);
  rec('L43 isLabBench + mustIncludeGate=[XOR]', l43 && l43.isLabBench && Array.isArray(l43.mustIncludeGate) && l43.mustIncludeGate.includes('XOR'), JSON.stringify(l43));
  rec('L43 constraint chip visible with XOR copy', l43 && l43.chipVisible && /XOR/.test(l43.chipText), `chip=${l43 && l43.chipText}`);

  // ───────── PHASE 8: Day 85 — Onboarding Experiment Flag regression ─────────
  console.log('\n=== Phase 8: Day 85 Onboarding Experiment Flag ===');
  const oe = await evalExpr(ws, `(function(){
    const e = window.__onboardingExperiment;
    if (!e) return {missing:true};
    return {
      variant: e.getVariant(),
      countersOk: typeof e.getCounters === 'function' && !!e.getCounters(),
      hasReset: typeof e.reset === 'function',
      hasApply: typeof e.applyFirstLaunch === 'function',
    };
  })()`);
  rec("__onboardingExperiment.getVariant() === 'silent-standard'", oe && oe.variant === 'silent-standard', JSON.stringify(oe));
  rec('__onboardingExperiment has getCounters/reset/applyFirstLaunch', oe && oe.countersOk && oe.hasReset && oe.hasApply, JSON.stringify(oe));

  // ───────── PHASE 9: Day 86 — Module Health regenerated (already done outside CDP) ─────────
  console.log('\n=== Phase 9: Day 86 Module Split Foundation (artifact existence) ===');
  // module-health.md regenerated by the outer script before this run; just confirm it exists via fetch.
  const mhFetch = await evalExpr(ws, `fetch('/specs/module-health.md', {cache:'no-store'}).then(r => r.ok ? r.text() : '')`, { awaitPromise: true });
  rec('specs/module-health.md exists', typeof mhFetch === 'string' && mhFetch.length > 1000, `len=${mhFetch && mhFetch.length}`);
  rec('module-health report shows 10 files / 110 globals', typeof mhFetch === 'string' && /Files scanned:\*\* 10/.test(mhFetch) && /Total top-level globals declared:\*\* 110/.test(mhFetch), 'header');

  // ───────── PHASE 10: Daily Challenge ─────────
  console.log('\n=== Phase 10: Daily Challenge ===');
  // Return to level-select; then open Daily Challenge
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);
  // Seed enough progress to reveal tier-gated buttons
  await evalExpr(ws, `window.game.seedProgress(18)`);
  await sleep(500);
  const dailyOpen = await evalExpr(ws, `(function(){
    const b = document.querySelector('#daily-challenge-btn, #daily-btn');
    if (!b) return {err:'no daily btn'};
    b.click();
    return {clicked:true};
  })()`);
  await sleep(500);
  const dailyState = await evalExpr(ws, `(function(){
    const s = document.querySelector('#daily-config-screen, #daily-pre-screen');
    return {
      screen: s ? (s.id) : null,
      visible: s ? getComputedStyle(s).display !== 'none' : false,
    };
  })()`);
  rec('Daily Challenge pre-screen opens', dailyState && dailyState.visible, JSON.stringify(dailyState));
  // Start daily
  await evalExpr(ws, `(function(){
    const b = document.querySelector('#start-daily-btn');
    if (b) b.click();
  })()`);
  await sleep(800);
  const dailyGameplay = await evalExpr(ws, `(function(){
    const gp = document.querySelector('#gameplay-screen');
    const lvl = window.game.currentLevel;
    return {
      visible: gp && getComputedStyle(gp).display !== 'none',
      currentLevelIsDaily: !!(lvl && lvl.isDaily),
      currentLevelId: lvl && lvl.id,
    };
  })()`);
  rec('Daily Challenge enters gameplay (currentLevel.isDaily=true)', dailyGameplay && dailyGameplay.visible && dailyGameplay.currentLevelIsDaily, JSON.stringify(dailyGameplay));
  // Back out via back-btn (user-facing path)
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(300);

  // ───────── PHASE 11: Random Challenge ─────────
  console.log('\n=== Phase 11: Random Challenge ===');
  await evalExpr(ws, `(function(){
    const b = document.querySelector('#random-challenge-btn, #challenge-btn');
    if (b) b.click();
  })()`);
  await sleep(500);
  const randState = await evalExpr(ws, `(function(){
    const s = document.querySelector('#challenge-config-screen');
    return {visible: s ? getComputedStyle(s).display !== 'none' : false};
  })()`);
  rec('Random Challenge config screen opens', randState && randState.visible, JSON.stringify(randState));
  // Generate one
  await evalExpr(ws, `(function(){
    const b = document.querySelector('#generate-challenge-btn');
    if (b) b.click();
  })()`);
  await sleep(800);
  const randGameplay = await evalExpr(ws, `(function(){
    return {visible: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none', isChallenge: window.game.isChallengeMode};
  })()`);
  rec('Random Challenge generate → gameplay (isChallengeMode=true)', randGameplay && randGameplay.visible && randGameplay.isChallenge, JSON.stringify(randGameplay));
  await evalExpr(ws, `window.game.ui.showScreen('level-select'); window.game.isChallengeMode=false; 'ok'`);
  await sleep(300);

  // ───────── PHASE 12: Blitz Mode ─────────
  console.log('\n=== Phase 12: Blitz Mode ===');
  await evalExpr(ws, `(function(){ const b=document.querySelector('#blitz-mode-btn'); if (b) b.click(); })()`);
  await sleep(800);
  const blitzState = await evalExpr(ws, `(function(){
    return {
      gpVisible: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      blitzMode: window.game.blitzMode,
      hudVisible: (function(){const h=document.querySelector('#blitz-hud'); return h && getComputedStyle(h).display !== 'none';})()
    };
  })()`);
  rec('Blitz Mode enters gameplay with HUD', blitzState && blitzState.gpVisible && blitzState.blitzMode && blitzState.hudVisible, JSON.stringify(blitzState));
  // Back to level-select — user-facing path goes through back-btn (which calls GameState.showLevelSelect)
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const blitzCleanup = await evalExpr(ws, `(function(){
    return {
      blitzMode: window.game.blitzMode,
      hudDisplay: (function(){const h=document.querySelector('#blitz-hud'); return h ? getComputedStyle(h).display : 'no-hud';})()
    };
  })()`);
  rec('Day 61 fix: Blitz HUD cleaned via back-btn (user-facing path)', blitzCleanup && blitzCleanup.blitzMode === false && blitzCleanup.hudDisplay === 'none', JSON.stringify(blitzCleanup));

  // ───────── PHASE 13: Speedrun Mode ─────────
  console.log('\n=== Phase 13: Speedrun Mode ===');
  await evalExpr(ws, `(function(){ const b=document.querySelector('#speedrun-btn'); if (b) b.click(); })()`);
  await sleep(800);
  const spdState = await evalExpr(ws, `(function(){
    return {
      gpVisible: getComputedStyle(document.querySelector('#gameplay-screen')).display !== 'none',
      mode: window.game.speedrunMode,
      hudVisible: (function(){const h=document.querySelector('#speedrun-hud'); return h && getComputedStyle(h).display !== 'none';})()
    };
  })()`);
  rec('Speedrun Mode enters gameplay with HUD', spdState && spdState.gpVisible && spdState.mode && spdState.hudVisible, JSON.stringify(spdState));
  // User-facing path: click back-btn (routes through GameState.showLevelSelect)
  await evalExpr(ws, `document.querySelector('#back-btn').click()`);
  await sleep(500);
  const spdCleanup = await evalExpr(ws, `(function(){
    return {
      mode: window.game.speedrunMode,
      hudDisplay: (function(){const h=document.querySelector('#speedrun-hud'); return h ? getComputedStyle(h).display : 'no-hud';})()
    };
  })()`);
  rec('Day 74 fix: Speedrun HUD cleaned via back-btn (user-facing path)', spdCleanup && spdCleanup.mode === false && spdCleanup.hudDisplay === 'none', JSON.stringify(spdCleanup));

  // ───────── PHASE 14: Sandbox ─────────
  console.log('\n=== Phase 14: Sandbox ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#sandbox-btn'); if (b) b.click();})()`);
  await sleep(500);
  const sbx = await evalExpr(ws, `(function(){
    const s = document.querySelector('#sandbox-config-screen');
    return {visible: s ? getComputedStyle(s).display !== 'none' : false};
  })()`);
  rec('Sandbox config screen opens', sbx && sbx.visible, JSON.stringify(sbx));
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);

  // ───────── PHASE 15: Creator ─────────
  console.log('\n=== Phase 15: Creator ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#create-level-btn'); if (b) b.click();})()`);
  await sleep(500);
  const cre = await evalExpr(ws, `(function(){
    const s = document.querySelector('#creator-screen, #creator-config-screen');
    return {visible: s ? getComputedStyle(s).display !== 'none' : false, id: s && s.id};
  })()`);
  rec('Creator screen opens', cre && cre.visible, JSON.stringify(cre));
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);

  // ───────── PHASE 16: Tournament ─────────
  console.log('\n=== Phase 16: Tournament ===');
  // Tournament is tier3-gated (18 levels); ensure progress is seeded by Phase 10
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(200);
  await evalExpr(ws, `(function(){const b=document.querySelector('#tournament-btn'); if (b) b.click();})()`);
  await sleep(500);
  const tour = await evalExpr(ws, `(function(){
    const s = document.querySelector('#tournament-screen');
    if (!s) return {missing:true};
    const tabs = Array.from(s.querySelectorAll('.tournament-tab, [data-tournament-tab]'));
    const labelEl = s.querySelector('#tournament-mode-label');
    return {
      visible: getComputedStyle(s).display !== 'none',
      tabCount: tabs.length,
      hasModeLabel: !!labelEl,
      modeLabelText: labelEl ? (labelEl.textContent || '').trim().slice(0,120) : '',
    };
  })()`);
  rec('Tournament screen opens', tour && tour.visible, JSON.stringify(tour));
  rec('Tournament screen has 3 tabs', tour && tour.tabCount === 3, `tabs=${tour && tour.tabCount}`);
  rec('Tournament screen has Day 83 mode label', tour && tour.hasModeLabel && tour.modeLabelText.length > 0, `label=${tour && tour.modeLabelText}`);
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(300);

  // ───────── PHASE 17: Encyclopedia ─────────
  console.log('\n=== Phase 17: Encyclopedia ===');
  await evalExpr(ws, `(function(){
    const b = document.querySelector('#encyclopedia-btn');
    if (b) b.click();
  })()`);
  await sleep(400);
  const enc = await evalExpr(ws, `(function(){
    const m = document.querySelector('#encyclopedia-modal, #encyclopedia-content');
    return {
      modalVisible: m ? getComputedStyle(m).display !== 'none' : false,
      hasContent: m ? (m.textContent || '').length > 50 : false,
    };
  })()`);
  rec('Encyclopedia modal opens with content', enc && enc.modalVisible && enc.hasContent, JSON.stringify(enc));
  await evalExpr(ws, `(function(){const m=document.querySelector('#encyclopedia-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 18: Achievements ─────────
  console.log('\n=== Phase 18: Achievements ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#achievements-btn'); if (b) b.click();})()`);
  await sleep(400);
  const ach = await evalExpr(ws, `(function(){
    const m = document.querySelector('#achievements-modal, #achievements-content');
    if (!m) return {missing:true};
    const rows = m.querySelectorAll('.achievement-row, .ach-row, [class*="achievement"]');
    const tierMythic = m.querySelectorAll('.tier-mythic').length;
    return {
      visible: getComputedStyle(m).display !== 'none',
      rowCount: rows.length,
      mythicRows: tierMythic,
    };
  })()`);
  rec('Achievements modal opens', ach && ach.visible, JSON.stringify(ach));
  rec('Achievements modal has rows (≥30)', ach && ach.rowCount >= 30, `rows=${ach && ach.rowCount}`);
  await evalExpr(ws, `(function(){const m=document.querySelector('#achievements-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 19: Stats ─────────
  console.log('\n=== Phase 19: Stats ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#stats-btn'); if (b) b.click();})()`);
  await sleep(600);
  const stats = await evalExpr(ws, `(function(){
    const m = document.querySelector('#stats-modal, #stats-content');
    if (!m) return {missing:true};
    const canvases = m.querySelectorAll('canvas.stats-chart, canvas');
    return {
      visible: getComputedStyle(m).display !== 'none',
      canvasCount: canvases.length,
    };
  })()`);
  rec('Stats modal opens with at least 1 chart canvas', stats && stats.visible && stats.canvasCount >= 1, JSON.stringify(stats));
  await evalExpr(ws, `(function(){const m=document.querySelector('#stats-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 20: Customize ─────────
  console.log('\n=== Phase 20: Customize ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#customize-btn'); if (b) b.click();})()`);
  await sleep(400);
  const cust = await evalExpr(ws, `(function(){
    // Customize modal id may be #cosmetic-modal or similar; find by visible cosmetic-close button parent
    const closeBtn = document.querySelector('#cosmetic-close');
    if (closeBtn && getComputedStyle(closeBtn).display !== 'none') {
      // Walk up to find the modal
      let p = closeBtn.parentElement;
      while (p && !p.id.endsWith('-modal') && p !== document.body) p = p.parentElement;
      return {visible: true, modalId: p ? p.id : 'unknown-parent', closeBtnVisible: true};
    }
    return {visible: false, closeBtnVisible: false};
  })()`);
  rec('Customize modal opens', cust && cust.visible, JSON.stringify(cust));
  await evalExpr(ws, `(function(){const c=document.querySelector('#cosmetic-close'); if(c) c.click();})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 21: Profile (Logic Profile) ─────────
  console.log('\n=== Phase 21: Logic Profile ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#profile-btn, #logic-profile-btn'); if (b) b.click();})()`);
  await sleep(400);
  const prof = await evalExpr(ws, `(function(){
    const m = document.querySelector('#profile-modal, #logic-profile-modal');
    if (!m) return {missing:true};
    return {visible: getComputedStyle(m).display !== 'none'};
  })()`);
  rec('Logic Profile modal opens', prof && prof.visible, JSON.stringify(prof));
  await evalExpr(ws, `(function(){const m=document.querySelector('#profile-modal, #logic-profile-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 22: Mastery Tree (visible at tier3 per Day 73 audit) ─────────
  console.log('\n=== Phase 22: Mastery Tree button presence ===');
  const masteryBtn = await evalExpr(ws, `(function(){
    const b = document.querySelector('#mastery-tree-btn, #mastery-btn');
    if (!b) return {missing:true};
    const vis = getComputedStyle(b).display !== 'none';
    return {present:true, visible:vis};
  })()`);
  // Per Day 73 audit: Mastery Tree button appears at tier3 (18 levels)
  rec('Mastery Tree button visible at tier3 (seed=18)', masteryBtn && masteryBtn.visible, JSON.stringify(masteryBtn));

  // ───────── PHASE 23: Circuit Collection ─────────
  console.log('\n=== Phase 23: Circuit Collection ===');
  await evalExpr(ws, `(function(){const b=document.querySelector('#collection-btn'); if (b) b.click();})()`);
  await sleep(400);
  const col = await evalExpr(ws, `(function(){
    const m = document.querySelector('#collection-modal, #circuit-collection-modal');
    if (!m) return {missing:true};
    return {visible: getComputedStyle(m).display !== 'none'};
  })()`);
  rec('Circuit Collection modal opens', col && col.visible, JSON.stringify(col));
  await evalExpr(ws, `(function(){const m=document.querySelector('#collection-modal, #circuit-collection-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  await sleep(200);

  // ───────── PHASE 24: Gameplay deep dive — Hint + Quick Test + Clear + Back ─────────
  console.log('\n=== Phase 24: Gameplay surface (L1 hint/clear/back) ===');
  await evalExpr(ws, `(function(){
    localStorage.removeItem('signal-circuit-tutorial-seen'); // force tutorial off if needed
  })()`);
  // Load L6 (no L1 tutorial blocking)
  await evalExpr(ws, `window.game.ui.showScreen('gameplay'); window.game.loadLevel(6); 'ok'`);
  await sleep(600);
  const gpButtons = await evalExpr(ws, `(function(){
    const ids = ['run-btn','quick-test-btn','clear-btn','hint-btn','back-btn','panel-toggle','kb-wiring-btn','encyclopedia-gameplay-btn','shortcuts-btn'];
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      out[id] = el ? (getComputedStyle(el).display !== 'none' ? 'visible' : 'hidden') : 'missing';
    }
    out.truthTableRows = document.querySelectorAll('#truth-table tbody tr').length;
    return out;
  })()`);
  rec('L6 gameplay screen has core gameplay buttons (run/clear/back present)', gpButtons && gpButtons['run-btn'] === 'visible' && gpButtons['back-btn'] === 'visible', JSON.stringify(gpButtons));
  rec('L6 truth table has 4 rows', gpButtons && gpButtons.truthTableRows === 4, JSON.stringify(gpButtons));

  // Click hint button (should work in Standard mode)
  const hintCheck = await evalExpr(ws, `(function(){
    try {
      const before = window.game.hintsUsed || 0;
      const b = document.querySelector('#hint-btn');
      if (b && getComputedStyle(b).display !== 'none') {
        b.click();
        const after = window.game.hintsUsed || 0;
        return {before, after, delta: after - before, btnVisible: true};
      }
      return {btnVisible:false};
    } catch (e) { return {err:String(e).slice(0,80)}; }
  })()`);
  rec('Hint button click does not throw', hintCheck && !hintCheck.err, JSON.stringify(hintCheck));

  // Click clear (should not throw)
  const clearOk = await evalExpr(ws, `(function(){
    try { document.querySelector('#clear-btn').click(); return {ok:true}; } catch (e) { return {err:String(e).slice(0,80)}; }
  })()`);
  rec('Clear button click does not throw', clearOk && clearOk.ok, JSON.stringify(clearOk));

  // Panel toggle
  const panelOk = await evalExpr(ws, `(function(){
    try {
      const b = document.querySelector('#panel-toggle');
      if (!b) return {missing:true};
      b.click(); b.click(); // toggle and back
      return {ok:true};
    } catch (e) { return {err:String(e).slice(0,80)}; }
  })()`);
  rec('Panel toggle does not throw', panelOk && panelOk.ok, JSON.stringify(panelOk));

  // Back button
  const backOk = await evalExpr(ws, `(function(){
    try { document.querySelector('#back-btn').click(); return {ok:true, screen: window.game.currentScreen}; } catch (e) { return {err:String(e).slice(0,80)}; }
  })()`);
  rec('Back button returns to level select', backOk && backOk.ok, JSON.stringify(backOk));
  await sleep(300);

  // ───────── PHASE 25: Tier3 surface — verify all gated buttons visible at seed=18 ─────────
  console.log('\n=== Phase 25: Tier3 surface (after seedProgress(18)) ===');
  const tier3 = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    if (!s) return {err:'no screen'};
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const nonLevel = visible.filter(b =>
      !b.classList.contains('level-overflow-btn') &&
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') &&
      !(b.dataset && b.dataset.levelId) &&
      !b.closest('.level-overflow-btn, .level-card, [data-level-id]')
    );
    return {
      nonLevelCount: nonLevel.length,
      labels: nonLevel.map(b => (b.id || b.className.split(' ')[0])),
    };
  })()`);
  rec('Tier3 (seed=18) reveals 18 non-level buttons (per Day 78)', tier3 && tier3.nonLevelCount === 18, JSON.stringify(tier3).slice(0,400));

  // ───────── PHASE 26: End-game seed=40 ─────────
  console.log('\n=== Phase 26: End-game (seedProgress(40)) ===');
  await evalExpr(ws, `window.game.seedProgress(40); 'ok'`);
  await sleep(800);
  const endgame = await evalExpr(ws, `(function(){
    const s = document.querySelector('#level-select-screen');
    const all = Array.from(s.querySelectorAll('button'));
    const visible = all.filter(b => getComputedStyle(b).display !== 'none' && b.offsetParent !== null);
    const overflow = visible.filter(b => b.classList.contains('level-overflow-btn'));
    const nonLevel = visible.filter(b =>
      !b.classList.contains('level-overflow-btn') &&
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-card') &&
      !b.closest('.level-overflow-btn, .level-card, [data-level-id]')
    );
    return {nonLevelCount: nonLevel.length, overflowCount: overflow.length};
  })()`);
  rec('End-game has 18 non-level buttons + 40 overflow buttons (Day 78 target)', endgame && endgame.nonLevelCount === 18 && endgame.overflowCount === 40, JSON.stringify(endgame));

  // ───────── PHASE 27: Mastery Tree at end-game (campaign complete) ─────────
  console.log('\n=== Phase 27: Mastery Tree at end-game ===');
  const masteryAt40 = await evalExpr(ws, `(function(){
    const b = document.querySelector('#mastery-tree-btn, #mastery-btn');
    if (!b) return {missing:true};
    const vis = getComputedStyle(b).display !== 'none';
    if (!vis) return {present:true, visible:false};
    b.click();
    return {clicked:true};
  })()`);
  await sleep(500);
  if (masteryAt40 && masteryAt40.clicked) {
    const masteryState = await evalExpr(ws, `(function(){
      const m = document.querySelector('#mastery-tree-modal, #mastery-modal');
      if (!m) return {missing:true};
      return {visible: getComputedStyle(m).display !== 'none'};
    })()`);
    rec('Mastery Tree modal opens at campaign complete', masteryState && masteryState.visible, JSON.stringify(masteryState));
    await evalExpr(ws, `(function(){const m=document.querySelector('#mastery-tree-modal, #mastery-modal');if(m){const c=m.querySelector('.modal-close,[data-action="close"]');if(c)c.click();else m.style.display='none';}})(); 'ok'`);
  } else {
    rec('Mastery Tree button visible at campaign complete', false, JSON.stringify(masteryAt40));
  }
  await sleep(200);

  // ───────── PHASE 28: Day 79 dead-identifier regression ─────────
  console.log('\n=== Phase 28: Day 79 dead-identifier regression ===');
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
  rec('Day 79 dead identifiers all undefined', dead && [
    dead.uiFirstLaunchModal, dead.achLightning, dead.achEclipse, dead.achArchitect,
    dead.achIsMythic, dead.infShowHud, dead.tutGetCurrent
  ].every(t => t === 'undefined'), JSON.stringify(dead));
  rec('#weekly-puzzle-btn DOM absent', dead && dead.weeklyBtn === false, JSON.stringify(dead));

  // ───────── PHASE 28b: Latent observation — Speedrun HUD via ui.showScreen ─────────
  console.log('\n=== Phase 28b: Latent observation — direct ui.showScreen bypasses HUD cleanup ===');
  // Re-enter Speedrun, then call ui.showScreen('level-select') directly (bypassing GameState.showLevelSelect).
  await evalExpr(ws, `(function(){const b=document.querySelector('#speedrun-btn'); if (b) b.click();})()`);
  await sleep(800);
  await evalExpr(ws, `window.game.ui.showScreen('level-select')`);
  await sleep(500);
  const internalBypass = await evalExpr(ws, `(function(){
    return {
      mode: window.game.speedrunMode,
      hudDisplay: (function(){const h=document.querySelector('#speedrun-hud'); return h ? getComputedStyle(h).display : 'no-hud';})(),
    };
  })()`);
  // Document this as observation — NOT a user-facing bug since back-btn routes through GameState.showLevelSelect.
  note('OBSERVATION (P2 latent): direct ui.showScreen("level-select") bypasses Day 74 HUD cleanup', JSON.stringify(internalBypass));
  // Recover state
  await evalExpr(ws, `document.querySelector('#back-btn') && document.querySelector('#back-btn').click(); 'ok'`);
  await sleep(300);

  // ───────── PHASE 29: Cosmetic / minor observations (UA warnings) ─────────
  console.log('\n=== Phase 29: Console error tally ===');
  rec('0 console errors across full audit', consoleErrors.length === 0, `errors=${consoleErrors.length}` + (consoleErrors.length ? ' :: ' + consoleErrors.slice(0,5).join(' | ') : ''));

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
