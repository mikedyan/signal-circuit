#!/usr/bin/env node
/**
 * Day 96 QA harness — Snapshot Cards Library Tab.
 *
 * Verifies:
 *   P1 (3): Build identity — 11 ?v=1780617600 cache-bust refs, sw v65,
 *           index.html declares #stats-tabs + #stats-cards-pane scaffolding.
 *   P2 (4): Empty-state library — fresh profile shows empty pane copy
 *           after switching to "📸 My Cards" tab, no cards in storage,
 *           cold-start 2 non-level buttons hold, no console errors so far.
 *   P3 (5): Capture flow — solve L1 twice (2 different share cards),
 *           library length = 2, each entry has dataUrl/levelId/stars,
 *           My Cards tab badge says "(2)", grid renders 2 .card-thumb.
 *   P4 (4): Cap eviction — flood library to 25 cards via direct API,
 *           library trimmed to 20, the 5 oldest cards evicted (newest tail
 *           preserved), tab badge says "(20)".
 *   P5 (3): Click-to-reopen — click a thumbnail, share-card modal reappears
 *           with the cached image painted on the canvas, _lastShareCardMeta
 *           carries the cached metadata.
 *   P6 (3): Reset Game wipes library — call gs.resetProgress(), card library
 *           empty afterwards, empty-state copy returns.
 *   P7 (4): Regression — Day 78 cold-start 2 non-level buttons hold;
 *           Day 95 silent-standard onboarding still resolves; Day 94 L42
 *           hardCap=4 rejection byte-equivalent; L1 entry still works.
 *   P8 (2): Console hygiene — 0 Runtime.exceptionThrown + 0 console.error.
 *
 * Total target: 28 assertions across 8 phases.
 *
 * Uses raw CDP via ws@8.20.0 from OpenClaw's node_modules (Day 86+ pattern).
 *
 * Run:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node \
 *     qa-reports/day-96-qa.cdp.js
 */

const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const APP_URL = 'http://localhost:8901/';
const CACHE_BUST = '1780617600';
const SW_VERSION = 'signal-circuit-v65';

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
  console.log('Day 96 QA harness — Snapshot Cards Library Tab');
  console.log('===============================================');

  // ─── P1: Build identity ───
  phase('P1 — Build identity');

  const { body: html } = await httpGet('localhost', 8901, '/');
  const cacheRefs = (html.match(new RegExp(`\\?v=${CACHE_BUST}`, 'g')) || []).length;
  if (cacheRefs === 11) ok('P1.1: 11 cache-bust refs unified at ?v=' + CACHE_BUST, `${cacheRefs}/11`);
  else fail('P1.1: cache-bust refs', `expected 11, got ${cacheRefs}`);

  const { body: swSrc } = await httpGet('localhost', 8901, '/sw.js');
  if (swSrc.includes(`CACHE_NAME = '${SW_VERSION}'`)) ok('P1.2: sw.js CACHE_NAME = ' + SW_VERSION);
  else fail('P1.2: sw.js CACHE_NAME', `expected ${SW_VERSION}`);

  const hasScaffold = html.includes('id="stats-tabs"') &&
    html.includes('id="stats-tab-overview"') &&
    html.includes('id="stats-tab-cards"') &&
    html.includes('id="stats-cards-pane"');
  if (hasScaffold) ok('P1.3: index.html declares stats tab scaffolding (#stats-tabs + #stats-cards-pane)');
  else fail('P1.3: tab scaffolding missing');

  // ─── Connect to CDP ───
  const target = await pickTarget();
  const { send } = await cdpConnect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  try { await send('Storage.clearDataForOrigin', { origin: APP_URL.replace(/\/$/, ''), storageTypes: 'all' }); } catch (e) { /* best effort */ }

  // ─── P2: Empty-state library ───
  phase('P2 — Empty-state library (fresh profile)');

  await navigateClean(send, APP_URL + '?day96p2=' + Date.now());

  const p2 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      // Wipe any leftover keys for a fully cold profile
      const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
      keys.forEach((k) => { if (k && /^signal/.test(k)) localStorage.removeItem(k); });
      // Open stats modal
      document.getElementById('stats-btn').click();
      const modalOpen = (function() {
        const m = document.getElementById('stats-modal');
        return m && getComputedStyle(m).display !== 'none';
      })();
      // Switch to My Cards tab
      document.getElementById('stats-tab-cards').click();
      const pane = document.getElementById('stats-cards-pane');
      const grid = document.getElementById('stats-grid');
      const tabBadge = document.getElementById('stats-tab-cards').textContent;
      const empty = pane ? !!pane.querySelector('.card-library-empty') : false;
      const lib = gs.getCardLibrary();
      const result = {
        modalOpen,
        paneVisible: pane && getComputedStyle(pane).display !== 'none',
        overviewHidden: grid && getComputedStyle(grid).display === 'none',
        emptyShown: empty,
        tabBadge,
        libLength: lib.length,
        nonLevel: (function() {
          let c = 0;
          const h = document.getElementById('how-to-play-btn');
          const s = document.getElementById('open-settings-btn');
          if (h && getComputedStyle(h).display !== 'none') c++;
          if (s && getComputedStyle(s).display !== 'none') c++;
          return c;
        })(),
      };
      document.getElementById('stats-close').click();
      return result;
    })()
  `);
  if (p2.modalOpen && p2.paneVisible && p2.overviewHidden) ok('P2.1: Stats modal opens, My Cards tab switches panes');
  else fail('P2.1: tab switch', JSON.stringify(p2));
  if (p2.libLength === 0 && p2.emptyShown) ok('P2.2: empty-state copy renders when library is empty');
  else fail('P2.2: empty-state', JSON.stringify(p2));
  if (p2.tabBadge && /\(0\)/.test(p2.tabBadge)) ok('P2.3: tab badge shows "(0)" with no cards');
  else fail('P2.3: badge text', String(p2.tabBadge));
  if (p2.nonLevel === 2) ok('P2.4: cold-start 2 non-level buttons hold');
  else fail('P2.4: non-level button count', `expected 2, got ${p2.nonLevel}`);

  // ─── P3: Capture flow — solve L1 twice ───
  phase('P3 — Capture flow (solve L1 twice)');

  const p3 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      function solveL1() {
        gs.startLevel(1);
        gs.gates = [];
        const g = gs.addGate('AND', 400, 300);
        const inA = gs.inputNodes[0], inB = gs.inputNodes[1], out = gs.outputNodes[0];
        gs.addWireFromData(inA.id, 0, g.id, 0);
        gs.addWireFromData(inB.id, 0, g.id, 1);
        gs.addWireFromData(g.id, 0, out.id, 0);
        gs.runQuickTest();
      }
      function generateCard() {
        // Find the share-card button (only shows after a campaign completion)
        const btn = document.getElementById('share-card-btn');
        if (!btn) return false;
        btn.click();
        return true;
      }
      solveL1();
      const c1 = generateCard();
      // Close the modal and solve again
      const closeBtn = document.getElementById('share-card-close');
      if (closeBtn) closeBtn.click();
      solveL1();
      const c2 = generateCard();
      if (closeBtn) closeBtn.click();
      const lib = gs.getCardLibrary();
      // Snapshot the first card's shape
      const sample = lib[0] || {};
      return {
        c1, c2,
        libLength: lib.length,
        hasDataUrl: !!sample.dataUrl && /^data:image\\/png/.test(sample.dataUrl),
        sampleShape: {
          id: typeof sample.id === 'string',
          levelId: sample.levelId,
          stars: sample.stars,
          gateCount: sample.gateCount,
          savedAt: typeof sample.savedAt === 'number',
        },
      };
    })()
  `);
  if (p3.c1 && p3.c2) ok('P3.1: share-card button surfaced after L1 completion (twice)');
  else fail('P3.1: share-card btn missing', JSON.stringify(p3));
  if (p3.libLength === 2) ok('P3.2: library length = 2 after two captures');
  else fail('P3.2: library length', `expected 2, got ${p3.libLength}`);
  if (p3.hasDataUrl) ok('P3.3: stored card has a PNG dataUrl');
  else fail('P3.3: dataUrl missing or wrong shape');
  if (p3.sampleShape.id && p3.sampleShape.levelId === 1 &&
      p3.sampleShape.stars === 3 && p3.sampleShape.gateCount === 1 &&
      p3.sampleShape.savedAt) {
    ok('P3.4: card record carries {id, levelId, stars, gateCount, savedAt}');
  } else {
    fail('P3.4: card shape', JSON.stringify(p3.sampleShape));
  }

  // Re-open stats and verify grid renders 2 thumbnails + badge says "(2)"
  const p3grid = await evalExpr(send, `
    (function() {
      document.getElementById('stats-btn').click();
      document.getElementById('stats-tab-cards').click();
      const thumbs = document.querySelectorAll('#stats-cards-pane .card-thumb');
      const badge = document.getElementById('stats-tab-cards').textContent;
      const result = { thumbCount: thumbs.length, badge };
      document.getElementById('stats-close').click();
      return result;
    })()
  `);
  if (p3grid.thumbCount === 2 && /\(2\)/.test(p3grid.badge)) {
    ok('P3.5: My Cards grid renders 2 thumbnails + tab badge says "(2)"');
  } else {
    fail('P3.5: grid render', JSON.stringify(p3grid));
  }

  // ─── P4: Cap eviction ───
  phase('P4 — Cap eviction at 20');

  const p4 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      // Already has 2 cards. Add 23 more synthetic entries → expect overflow to 25, trimmed to 20.
      const TINY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZqfQqYAAAAASUVORK5CYII=';
      // Snapshot the very first card (oldest) so we can prove it got evicted.
      const firstBefore = gs.getCardLibrary()[0];
      for (let i = 0; i < 23; i++) {
        gs.addSnapshotCard({
          levelId: 1,
          levelTitle: 'Synthetic L1 #' + i,
          stars: 3,
          gateCount: 1,
          dataUrl: TINY,
          title: 'Synthetic',
          text: 'syn',
          fileName: 'syn.png',
        });
      }
      const lib = gs.getCardLibrary();
      // The last entry should be the newest synthetic ("Synthetic L1 #22").
      const tail = lib[lib.length - 1] || {};
      // Does the original first card still exist?
      const stillHasOriginalFirst = !!(firstBefore && lib.find((c) => c.id === firstBefore.id));
      return {
        libLength: lib.length,
        firstBeforeId: firstBefore && firstBefore.id,
        stillHasOriginalFirst,
        tailTitle: tail.levelTitle,
      };
    })()
  `);
  if (p4.libLength === 20) ok('P4.1: library capped at 20 after flooding 25 entries');
  else fail('P4.1: cap', `expected 20, got ${p4.libLength}`);
  if (p4.stillHasOriginalFirst === false) ok('P4.2: original first card was evicted (oldest dropped)');
  else fail('P4.2: oldest not evicted', JSON.stringify(p4));
  if (p4.tailTitle === 'Synthetic L1 #22') ok('P4.3: newest tail entry preserved (LRU tail policy)');
  else fail('P4.3: tail', String(p4.tailTitle));

  // Badge update
  const p4badge = await evalExpr(send, `
    (function() {
      document.getElementById('stats-btn').click();
      document.getElementById('stats-tab-cards').click();
      const badge = document.getElementById('stats-tab-cards').textContent;
      const thumbs = document.querySelectorAll('#stats-cards-pane .card-thumb').length;
      document.getElementById('stats-close').click();
      return { badge, thumbs };
    })()
  `);
  if (/\(20\)/.test(p4badge.badge) && p4badge.thumbs === 20) {
    ok('P4.4: tab badge "(20)" + grid renders 20 thumbnails');
  } else {
    fail('P4.4: badge/thumbs', JSON.stringify(p4badge));
  }

  // ─── P5: Click-to-reopen ───
  phase('P5 — Click thumbnail re-opens share-card modal');

  // Add a fresh REAL share card (1200×630) so the newest-first thumbnail is
  // a full-resolution snapshot — the P4 synthetic flood replaced the two
  // P3 originals with 1×1 placeholders, which would skew the canvas-size check.
  await evalExpr(send, `
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
      const btn = document.getElementById('share-card-btn');
      if (btn) btn.click();
      const close = document.getElementById('share-card-close');
      if (close) close.click();
      return true;
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const p5 = await evalExpr(send, `
    (function() {
      return new Promise((resolve) => {
        document.getElementById('stats-btn').click();
        document.getElementById('stats-tab-cards').click();
        const thumb = document.querySelector('#stats-cards-pane .card-thumb');
        if (!thumb) { resolve({ err: 'no-thumb' }); return; }
        // Pick a known cached card's id to verify _lastShareCardMeta after click
        const targetCardId = thumb.getAttribute('data-card-id');
        thumb.click();
        // Image onload paint is async; poll for the share-card modal to display
        let tries = 0;
        const tick = () => {
          const modal = document.getElementById('share-card-modal');
          const visible = modal && getComputedStyle(modal).display !== 'none';
          const meta = window.game.ui && window.game.ui._lastShareCardMeta;
          if (visible && meta && meta.libraryId === targetCardId) {
            const canvas = document.getElementById('share-card-canvas');
            const result = {
              modalVisible: visible,
              metaLibraryId: meta.libraryId,
              targetCardId,
              canvasW: canvas.width,
              canvasH: canvas.height,
              hasFileName: !!meta.fileName,
            };
            const close = document.getElementById('share-card-close');
            if (close) close.click();
            const statsClose = document.getElementById('stats-close');
            if (statsClose) statsClose.click();
            resolve(result);
            return;
          }
          if (++tries > 50) { resolve({ err: 'timeout', tries }); return; }
          setTimeout(tick, 50);
        };
        setTimeout(tick, 50);
      });
    })()
  `, { awaitPromise: true });
  // (Above eval intentionally awaits the promise.)
  if (p5.modalVisible && p5.metaLibraryId === p5.targetCardId) {
    ok('P5.1: share-card modal re-opens with cached metadata after thumbnail click');
  } else {
    fail('P5.1: re-open flow', JSON.stringify(p5));
  }
  if (p5.canvasW === 1200 && p5.canvasH === 630) ok('P5.2: cached image painted at 1200×630 native resolution');
  else fail('P5.2: canvas size', JSON.stringify({ w: p5.canvasW, h: p5.canvasH }));
  if (p5.hasFileName) ok('P5.3: _lastShareCardMeta carries fileName for download');
  else fail('P5.3: meta fileName', JSON.stringify(p5));

  // ─── P6: Reset Game wipes library ───
  phase('P6 — resetProgress() wipes the library');

  const p6 = await evalExpr(send, `
    (function() {
      const gs = window.game;
      const lengthBefore = gs.getCardLibrary().length;
      gs.resetProgress();
      const lengthAfter = gs.getCardLibrary().length;
      // Re-open the cards tab to verify empty-state copy renders
      document.getElementById('stats-btn').click();
      document.getElementById('stats-tab-cards').click();
      const empty = !!document.querySelector('#stats-cards-pane .card-library-empty');
      const badge = document.getElementById('stats-tab-cards').textContent;
      document.getElementById('stats-close').click();
      return { lengthBefore, lengthAfter, empty, badge };
    })()
  `);
  if (p6.lengthBefore === 20 && p6.lengthAfter === 0) ok('P6.1: resetProgress() empties the card library', `${p6.lengthBefore} → 0`);
  else fail('P6.1: reset behavior', JSON.stringify(p6));
  if (p6.empty) ok('P6.2: empty-state copy returns after reset');
  else fail('P6.2: empty-state missing post-reset');
  if (/\(0\)/.test(p6.badge)) ok('P6.3: tab badge returns to "(0)"');
  else fail('P6.3: badge after reset', String(p6.badge));

  // ─── P7: Regression — Day 78 + 94 + 95 ───
  phase('P7 — Day 78/94/95 regression');

  await evalExpr(send, `
    (function() {
      const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
      keys.forEach((k) => { if (k && /^signal/.test(k)) localStorage.removeItem(k); });
      return true;
    })()
  `);
  await navigateClean(send, APP_URL + '?day96p7=' + Date.now());

  const p7 = await evalExpr(send, `
    (function() {
      function vis(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }
      const result = {};
      result.nonLevel = (vis('how-to-play-btn') ? 1 : 0) + (vis('open-settings-btn') ? 1 : 0);
      result.onboardingVariant = window.__onboardingExperiment.getVariant();
      // L42 hardCap regression
      const gs = window.game;
      gs.startLevel(42);
      gs.gates = [];
      for (let i = 0; i < 5; i++) gs.addGate('AND', 200 + i * 40, 300);
      result.l42 = gs._validateLabConstraints();
      // L1 entry
      gs.startLevel(1);
      result.l1Gameplay = (function() {
        const el = document.getElementById('gameplay-screen');
        return el && getComputedStyle(el).display !== 'none';
      })();
      result.l1Rows = document.querySelectorAll('#truth-table tr').length;
      return result;
    })()
  `);
  if (p7.nonLevel === 2) ok('P7.1: cold-start 2 non-level buttons hold (Day 78 invariant)');
  else fail('P7.1: cold-start non-level', `expected 2, got ${p7.nonLevel}`);
  if (p7.onboardingVariant === 'silent-standard') ok('P7.2: Day 95 silent-standard onboarding still resolves');
  else fail('P7.2: onboarding variant', String(p7.onboardingVariant));
  const expectedL42 = 'Submission rejected: 5 gates exceeds hard cap of 4.';
  if (p7.l42 && p7.l42.ok === false && p7.l42.message === expectedL42) {
    ok('P7.3: L42 hardCap rejection message byte-equivalent to Day 84/94/95');
  } else {
    fail('P7.3: L42 regression', JSON.stringify(p7.l42));
  }
  if (p7.l1Gameplay && p7.l1Rows >= 4) ok('P7.4: L1 gameplay-screen + 4 truth rows render after startLevel(1)');
  else fail('P7.4: L1 entry', JSON.stringify(p7));

  // ─── P8: Console hygiene ───
  phase('P8 — Console hygiene');

  await new Promise((r) => setTimeout(r, 500));
  if (exceptionCount === 0) ok('P8.1: 0 Runtime.exceptionThrown');
  else fail('P8.1: Runtime.exceptionThrown', String(exceptionCount));
  if (consoleErrorCount === 0) ok('P8.2: 0 console.error');
  else fail('P8.2: console.error', String(consoleErrorCount));

  // ─── Summary ───
  console.log('\n===============================================');
  const pass = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`Day 96 QA: ${pass}/${total} assertions passed`);
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
