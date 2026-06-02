#!/usr/bin/env node
/**
 * Day 95 QA harness — Onboarding Experiment Readout UI.
 *
 * Verifies:
 *   P1 (3): Build identity — 11 ?v=1780531200 cache-bust refs, sw v64,
 *           index.html declares #onboarding-readout-card placeholder.
 *   P2 (3): Debug gate OFF — settings opens, developer section hidden,
 *           readout card hidden, 2 cold-start non-level buttons.
 *   P3 (5): Debug gate ON — developer section visible, readout card
 *           visible, variant pill present, applied-at populated (silent-
 *           standard fires on cold start), 7 counter rows + reset button.
 *   P4 (5): Counter wiring — ?onboarding=explicit-chooser reload → chooser
 *           opens → click "Standard" → counters reflect the funnel walk
 *           after re-opening Settings (chooserShown=1, picked=1, firstLaunches=1,
 *           appliedAt non-null).
 *   P5 (4): Reset — click readout card's reset → counters back to zero,
 *           appliedAt refreshes (new timestamp), card re-renders in place.
 *   P6 (3): L1 regression — startLevel(1), gameplay-screen visible, 4 truth rows.
 *   P7 (3): Day 78 + Day 94 regression — cold-start 2 non-level buttons hold
 *           (after another reload), L42 hardCap=4 rejection byte-equivalent,
 *           L44 NAND-only + hard cap 6 still enforced.
 *   P8 (2): Console hygiene — 0 Runtime.exceptionThrown + 0 console.error.
 *
 * Total target: 28 assertions across 8 phases.
 *
 * Uses raw CDP via ws@8.20.0 from OpenClaw's node_modules (Day 86+ pattern).
 *
 * Run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node \
 *     qa-reports/day-95-qa.cdp.js
 */

const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const APP_URL = 'http://localhost:8901/';
const CACHE_BUST = '1780531200';
const SW_VERSION = 'signal-circuit-v64';

const results = [];
let exceptionCount = 0;
let consoleErrorCount = 0;

function ok(name, detail) { results.push({ ok: true, name, detail }); console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail) { results.push({ ok: false, name, detail }); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
function phase(label) { console.log('\n' + label); }

function httpGet(host, port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host, port, path }, (res) => {
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

async function navigateClean(send, url) {
  await send('Page.navigate', { url });
  await waitFor(send, 'typeof window.game === "object" && window.game !== null', 12000);
  await new Promise((r) => setTimeout(r, 400));
}

async function main() {
  console.log('Day 95 QA harness — Onboarding Experiment Readout UI');
  console.log('====================================================');

  // ─── P1: Build identity ───
  phase('P1 — Build identity');

  const { body: html } = await httpGet('localhost', 8901, '/');
  const cacheRefs = (html.match(new RegExp(`\\?v=${CACHE_BUST}`, 'g')) || []).length;
  if (cacheRefs === 11) ok('P1.1: 11 cache-bust refs unified at ?v=' + CACHE_BUST, `${cacheRefs}/11`);
  else fail('P1.1: cache-bust refs', `expected 11, got ${cacheRefs}`);

  const { body: swSrc } = await httpGet('localhost', 8901, '/sw.js');
  if (swSrc.includes(`CACHE_NAME = '${SW_VERSION}'`)) ok('P1.2: sw.js CACHE_NAME = ' + SW_VERSION);
  else fail('P1.2: sw.js CACHE_NAME', `expected ${SW_VERSION}`);

  if (html.includes('id="onboarding-readout-card"')) ok('P1.3: index.html declares #onboarding-readout-card placeholder');
  else fail('P1.3: #onboarding-readout-card placeholder missing');

  // ─── Connect to CDP ───
  const target = await pickTarget();
  const { send } = await cdpConnect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  try { await send('Storage.clearDataForOrigin', { origin: APP_URL.replace(/\/$/, ''), storageTypes: 'all' }); } catch (e) { /* best effort */ }

  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { Object.defineProperty(navigator, 'vibrate', { value: () => true, writable: true }); } catch (e) {}`,
  });

  // ─── P2: Debug gate OFF ───
  phase('P2 — Debug gate OFF (default cold start)');

  await navigateClean(send, APP_URL + '?day95p2=' + Date.now());

  // Ensure debug flag is NOT set
  await evalExpr(send, `localStorage.removeItem('signal-circuit-debug'); true;`);

  const p2State = await evalExpr(send, `
    (function() {
      // Open settings programmatically by clicking the trigger
      const open = document.getElementById('open-settings-btn');
      if (open) open.click();
      const modal = document.getElementById('settings-modal');
      const dev = document.getElementById('settings-developer-section');
      const card = document.getElementById('onboarding-readout-card');
      function vis(el) {
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      function visById(id) { return vis(document.getElementById(id)); }
      const result = {
        modalOpen: vis(modal),
        devVisible: vis(dev),
        cardVisible: vis(card),
        nonLevel: (visById('how-to-play-btn') ? 1 : 0) + (visById('open-settings-btn') ? 1 : 0),
      };
      // Close it again
      const close = document.getElementById('settings-close');
      if (close) close.click();
      return result;
    })()
  `);
  if (p2State.modalOpen && p2State.devVisible === false) ok('P2.1: Settings opens, Developer section hidden when debug flag off');
  else fail('P2.1: Developer gate OFF', JSON.stringify(p2State));
  if (p2State.cardVisible === false) ok('P2.2: Readout card hidden when debug flag off');
  else fail('P2.2: Readout card should be hidden', JSON.stringify(p2State));
  if (p2State.nonLevel === 2) ok('P2.3: Cold-start 2 non-level buttons hold');
  else fail('P2.3: non-level button count', `expected 2, got ${p2State.nonLevel}`);

  // ─── P3: Debug gate ON ───
  phase('P3 — Debug gate ON (readout card renders inline)');

  await evalExpr(send, `localStorage.setItem('signal-circuit-debug', '1'); true;`);

  const p3State = await evalExpr(send, `
    (function() {
      const open = document.getElementById('open-settings-btn');
      if (open) open.click();
      const dev = document.getElementById('settings-developer-section');
      const card = document.getElementById('onboarding-readout-card');
      function vis(el) {
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      const variantPill = card ? card.querySelector('#onboarding-readout-variant') : null;
      const countersTable = card ? card.querySelector('#onboarding-readout-counters') : null;
      const resetBtn = card ? card.querySelector('#onboarding-readout-reset') : null;
      // Capture text of applied-at line (a div containing "Applied:")
      const appliedText = card ? (card.textContent.match(/Applied:[^\\n]*/) || ['(none)'])[0] : '(none)';
      const result = {
        devVisible: vis(dev),
        cardVisible: vis(card),
        variantText: variantPill ? variantPill.textContent : null,
        rowCount: countersTable ? countersTable.querySelectorAll('tr').length : 0,
        hasReset: !!resetBtn,
        appliedText: appliedText.slice(0, 80),
        oeVariant: window.__onboardingExperiment.getVariant(),
        oeAppliedAt: window.__onboardingExperiment.getAppliedAt(),
      };
      const close = document.getElementById('settings-close');
      if (close) close.click();
      return result;
    })()
  `);
  if (p3State.devVisible && p3State.cardVisible) ok('P3.1: Developer section + readout card both visible');
  else fail('P3.1: dev/card visibility', JSON.stringify(p3State));
  if (p3State.variantText === 'silent-standard' && p3State.oeVariant === 'silent-standard') {
    ok('P3.2: variant pill renders "silent-standard"');
  } else {
    fail('P3.2: variant text', JSON.stringify({ pill: p3State.variantText, oe: p3State.oeVariant }));
  }
  if (typeof p3State.oeAppliedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(p3State.oeAppliedAt)) {
    ok('P3.3: appliedAt ISO timestamp set on cold start', p3State.oeAppliedAt);
  } else {
    fail('P3.3: appliedAt missing/invalid', String(p3State.oeAppliedAt));
  }
  if (p3State.rowCount === 7) ok('P3.4: counters table has 7 rows');
  else fail('P3.4: counters row count', `expected 7, got ${p3State.rowCount}`);
  if (p3State.hasReset) ok('P3.5: Reset button present in card');
  else fail('P3.5: Reset button missing');

  // ─── P4: Counter wiring (explicit-chooser funnel) ───
  phase('P4 — Counter wiring (explicit-chooser funnel)');

  // Clear ALL signal-* localStorage keys for a clean funnel walk. The
  // critical one is signal-circuit-placement-done — _checkPlacementTest()
  // returns early when it's true, which skips applyFirstLaunch() entirely.
  // Preserve the debug flag so the readout card keeps rendering inline.
  await evalExpr(send, `
    (function() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
      keys.forEach((k) => { if (k && /^signal/.test(k)) localStorage.removeItem(k); });
      localStorage.setItem('signal-circuit-debug', '1');
      return true;
    })()
  `);

  await navigateClean(send, APP_URL + '?onboarding=explicit-chooser&day95p4=' + Date.now());

  // Wait for the explicit-chooser modal to appear (deferred ~600ms in main.js)
  await new Promise((r) => setTimeout(r, 1500));

  const chooserVisible = await evalExpr(send, `
    (function() {
      const opts = document.querySelectorAll('#diff-options .diff-option-btn');
      return { opts: opts.length, variant: window.__onboardingExperiment.getVariant() };
    })()
  `);
  if (chooserVisible.opts >= 1 && chooserVisible.variant === 'explicit-chooser') {
    ok('P4.1: explicit-chooser variant resolved + chooser modal rendered', `${chooserVisible.opts} options`);
  } else {
    fail('P4.1: chooser did not render', JSON.stringify(chooserVisible));
  }

  // Click the "Standard" option
  await evalExpr(send, `
    (function() {
      const opts = document.querySelectorAll('#diff-options .diff-option-btn');
      for (const b of opts) {
        if (b.dataset && b.dataset.mode === 'standard') { b.click(); return true; }
      }
      return false;
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  // Re-open settings, verify counters reflect the funnel
  const p4After = await evalExpr(send, `
    (function() {
      const open = document.getElementById('open-settings-btn');
      if (open) open.click();
      const c = window.__onboardingExperiment.getCounters();
      const card = document.getElementById('onboarding-readout-card');
      const rowText = card ? card.querySelector('#onboarding-readout-counters').textContent : '';
      const result = {
        counters: c,
        appliedAt: window.__onboardingExperiment.getAppliedAt(),
        cardHasChooserShown: /chooserShown[^0-9]*1/.test(rowText),
        cardHasPickedStandard: /chooserPickedStandard[^0-9]*1/.test(rowText),
      };
      const close = document.getElementById('settings-close');
      if (close) close.click();
      return result;
    })()
  `);
  if (p4After.counters.firstLaunches === 1) ok('P4.2: firstLaunches counter = 1 after applyFirstLaunch');
  else fail('P4.2: firstLaunches', JSON.stringify(p4After.counters));
  if (p4After.counters.chooserShown === 1) ok('P4.3: chooserShown counter = 1');
  else fail('P4.3: chooserShown', JSON.stringify(p4After.counters));
  if (p4After.counters.chooserPickedStandard === 1) ok('P4.4: chooserPickedStandard = 1 after picking Standard');
  else fail('P4.4: chooserPickedStandard', JSON.stringify(p4After.counters));
  if (p4After.cardHasChooserShown && p4After.cardHasPickedStandard) {
    ok('P4.5: card auto-refresh reflects counters on re-open');
  } else {
    fail('P4.5: card auto-refresh', `chooserShown? ${p4After.cardHasChooserShown}, pickedStandard? ${p4After.cardHasPickedStandard}`);
  }

  // ─── P5: Reset ───
  phase('P5 — Reset wipes state + re-renders in place');

  const p5Before = await evalExpr(send, `
    (function() {
      const open = document.getElementById('open-settings-btn');
      if (open) open.click();
      return {
        appliedAtBefore: window.__onboardingExperiment.getAppliedAt(),
        countersBefore: window.__onboardingExperiment.getCounters(),
      };
    })()
  `);
  // Sleep ≥1s to ensure the new appliedAt is strictly different
  await new Promise((r) => setTimeout(r, 1100));
  const p5After = await evalExpr(send, `
    (function() {
      const card = document.getElementById('onboarding-readout-card');
      const btn = card ? card.querySelector('#onboarding-readout-reset') : null;
      if (btn) btn.click();
      // Card should re-render in place — no reload
      const variantPill = card ? card.querySelector('#onboarding-readout-variant') : null;
      const cTable = card ? card.querySelector('#onboarding-readout-counters') : null;
      const result = {
        cardStillVisible: card && getComputedStyle(card).display !== 'none',
        appliedAtAfter: window.__onboardingExperiment.getAppliedAt(),
        countersAfter: window.__onboardingExperiment.getCounters(),
        variantAfter: variantPill ? variantPill.textContent : null,
        rowCountAfter: cTable ? cTable.querySelectorAll('tr').length : 0,
      };
      const close = document.getElementById('settings-close');
      if (close) close.click();
      return result;
    })()
  `);

  // After reset() + applyFirstLaunch refire, the variant comes from the
  // current URL (?onboarding=explicit-chooser is still in the URL bar from
  // P4's navigation), so:
  //   variant=explicit-chooser, firstLaunches=1, chooserShown=1 (chooser
  //   opened again by refire), chooserPickedStandard=0 (the pick cleared),
  //   toastShown=0 (not the silent-standard path). This is correct "funnel
  //   restart" behavior — the user is back at the top of the chooser flow.
  if (p5After.countersAfter.chooserPickedStandard === 0 &&
      p5After.countersAfter.chooserPickedRelaxed === 0 &&
      p5After.countersAfter.chooserPickedHardcore === 0) {
    ok('P5.1: Reset wiped funnel-pick counters back to 0 (chooserPicked* cleared)');
  } else {
    fail('P5.1: pick counters after reset', JSON.stringify(p5After.countersAfter));
  }
  // applyFirstLaunch re-fired for the persisted variant (explicit-chooser),
  // so firstLaunches=1 and chooserShown=1 are expected; toastShown=0 because
  // this variant doesn't fire the toast path.
  if (p5After.countersAfter.firstLaunches === 1 &&
      p5After.countersAfter.chooserShown === 1 &&
      p5After.countersAfter.toastShown === 0) {
    ok('P5.2: applyFirstLaunch re-fired for persisted explicit-chooser variant');
  } else {
    fail('P5.2: counters after reset+refire', JSON.stringify(p5After.countersAfter));
  }
  if (typeof p5After.appliedAtAfter === 'string' &&
      p5After.appliedAtAfter !== p5Before.appliedAtBefore &&
      /^\d{4}-\d{2}-\d{2}T/.test(p5After.appliedAtAfter)) {
    ok('P5.3: appliedAt refreshed to a new ISO timestamp', `${p5Before.appliedAtBefore} → ${p5After.appliedAtAfter}`);
  } else {
    fail('P5.3: appliedAt did not refresh', JSON.stringify({ before: p5Before.appliedAtBefore, after: p5After.appliedAtAfter }));
  }
  if (p5After.cardStillVisible && p5After.rowCountAfter === 7 && p5After.variantAfter === 'explicit-chooser') {
    ok('P5.4: card re-rendered in place (no reload), 7 rows, persisted variant intact');
  } else {
    fail('P5.4: re-render in place', JSON.stringify(p5After));
  }

  // ─── P6: L1 regression ───
  phase('P6 — L1 core loop regression');

  const l1 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(1);
      gs.gates = [];
      const g = gs.addGate('AND', 400, 300);
      const inA = gs.inputNodes[0], inB = gs.inputNodes[1], out = gs.outputNodes[0];
      gs.addWireFromData(inA.id, 0, g.id, 0);
      gs.addWireFromData(inB.id, 0, g.id, 1);
      gs.addWireFromData(g.id, 0, out.id, 0);
      gs.runQuickTest();
      const e = gs.progress.levels && gs.progress.levels['1'];
      const truthRows = document.querySelectorAll('#truth-table tr').length;
      const gameplayVisible = (function() {
        const el = document.getElementById('gameplay-screen');
        if (!el) return false;
        return getComputedStyle(el).display !== 'none';
      })();
      return { stars: e && e.stars, gates: gs.gates.length, truthRows, gameplayVisible };
    })()
  `);
  if (l1.gameplayVisible) ok('P6.1: gameplay-screen visible after startLevel(1)');
  else fail('P6.1: gameplay-screen not visible', JSON.stringify(l1));
  if (l1.truthRows >= 4) ok('P6.2: truth table rendered with ≥4 rows', `${l1.truthRows} rows`);
  else fail('P6.2: truth rows', String(l1.truthRows));
  if (l1.stars === 3 && l1.gates === 1) ok('P6.3: L1 1-gate AND solve persists 3 stars');
  else fail('P6.3: L1 regression', JSON.stringify(l1));

  // ─── P7: Day 78 + Day 94 regression ───
  phase('P7 — Day 78 + Day 94 regression');

  // Wipe state and re-cold-start to verify the 2-button invariant on a fresh load
  await evalExpr(send, `
    (function() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
      keys.forEach((k) => { if (k && /^signal/.test(k)) localStorage.removeItem(k); });
      return true;
    })()
  `);
  await navigateClean(send, APP_URL + '?day95p7=' + Date.now());

  const p7Cold = await evalExpr(send, `
    (function() {
      function vis(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      let count = 0;
      if (vis('how-to-play-btn')) count++;
      if (vis('open-settings-btn')) count++;
      return count;
    })()
  `);
  if (p7Cold === 2) ok('P7.1: cold-start non-level button count = 2 (Day 78 invariant)');
  else fail('P7.1: cold-start non-level buttons', `expected 2, got ${p7Cold}`);

  const l42 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(42);
      gs.gates = [];
      for (let i = 0; i < 5; i++) gs.addGate('AND', 200 + i * 40, 300);
      return gs._validateLabConstraints();
    })()
  `);
  const expectedL42 = 'Submission rejected: 5 gates exceeds hard cap of 4.';
  if (l42 && l42.ok === false && l42.message === expectedL42) {
    ok('P7.2: L42 hardCap rejection message byte-equivalent to Day 84/94', l42.message);
  } else {
    fail('P7.2: L42 regression', JSON.stringify(l42));
  }

  const l44 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      gs.startLevel(44);
      const lvl = gs.currentLevel;
      // 7-NAND build should reject for hard-cap reason
      gs.gates = [];
      for (let i = 0; i < 7; i++) gs.addGate('NAND', 200 + i * 40, 200);
      const reject = gs._validateLabConstraints();
      // 5-NAND build should accept
      gs.gates = [];
      for (let i = 0; i < 5; i++) gs.addGate('NAND', 200 + i * 40, 200);
      const accept = gs._validateLabConstraints();
      return {
        cap: lvl.gateHardCap,
        avail: lvl.availableGates,
        rejectOk: reject && reject.ok,
        rejectMsg: reject && reject.message,
        acceptOk: accept && accept.ok,
      };
    })()
  `);
  if (l44.cap === 6 && Array.isArray(l44.avail) && l44.avail[0] === 'NAND' &&
      l44.rejectOk === false && /7 gates exceeds hard cap of 6/.test(l44.rejectMsg) &&
      l44.acceptOk === true) {
    ok('P7.3: L44 NAND-only + hard cap 6 composite regression holds');
  } else {
    fail('P7.3: L44 composite regression', JSON.stringify(l44));
  }

  // ─── P8: Console hygiene ───
  phase('P8 — Console hygiene');

  await new Promise((r) => setTimeout(r, 500));
  if (exceptionCount === 0) ok('P8.1: 0 Runtime.exceptionThrown');
  else fail('P8.1: Runtime.exceptionThrown', String(exceptionCount));
  if (consoleErrorCount === 0) ok('P8.2: 0 console.error');
  else fail('P8.2: console.error', String(consoleErrorCount));

  // ─── Summary ───
  console.log('\n====================================================');
  const pass = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`Day 95 QA: ${pass}/${total} assertions passed`);
  console.log(`Exceptions: ${exceptionCount} · console.error: ${consoleErrorCount}`);
  if (pass !== total) {
    console.log('\nFAILED:');
    for (const r of results) if (!r.ok) console.log(`  ❌ ${r.name} — ${r.detail || ''}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Harness error:', e);
  process.exit(2);
});
