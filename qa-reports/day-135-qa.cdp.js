#!/usr/bin/env node
/**
 * Day 135 QA harness — Cycle 6 PRUNE Week, Day 3: "Code Cleanup".
 *
 * Ships Tier-2 Cut #3 from the Day 133 PRUNE_REPORT against the LOCAL build:
 *   Dead-id sweep of the 5 collection buttons/modals retired by the Day 124
 *   Profile-hub merge. Removed the 5 orphaned setup* binders
 *   (setupAchievements / setupMasteryTree / setupCircuitCollection /
 *   setupLogicProfile / setupCosmeticModal) — each only bound btn/modal/close
 *   ids that no longer exist in index.html, so all 5 no-op'd. Their render*()
 *   methods stay LIVE (reached via setupProfileHub → _switchProfileTab).
 *
 * The whole risk of this cleanup is: did removing the setup* wiring break the
 * hub's ability to render those 5 panes? So the harness OPENS the hub, switches
 * all 5 tabs, and proves each pane renders non-empty + the cosmetic click still
 * flips the active wire color (Day 124 P4 primitive).
 *
 * Build under test: LOCAL http://localhost:8901/ — new ?v=1783814400 / sw v83.
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-135-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const HTTP_PORT = 8901;
const BASE = `http://localhost:${HTTP_PORT}/`;
const TARGET_URL = BASE + '?_ts=' + Date.now();
const NEWV = '1783814400';

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const runtimeExceptions = [];

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (err) { reject(err); } });
    }).on('error', reject);
  });
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(ws, expression) {
  const result = await send(ws, 'Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, timeout: 15000,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate threw: ${result.exceptionDetails.text} :: ${expression.slice(0, 200)}`);
  }
  return result.result && result.result.value;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const targets = await getJSON('/json/list');
  let target = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) throw new Error('No CDP page target found');
  console.log(`[cdp] target: ${target.url}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (_) { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => (a && a.value) || (a && a.description) || '').join(' ');
      consoleErrors.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      runtimeExceptions.push(msg.params.exceptionDetails.text || String(msg.params));
    }
  });

  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.enable');
  await send(ws, 'Page.navigate', { url: TARGET_URL });
  await wait(4000);

  // Clear localStorage + SW caches + unregister SWs so we read fresh source
  // (Day 134 lesson: a stale same-version precache masked a real CSS fix).
  await evaluate(ws, `(async () => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    try {
      if ('caches' in self) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
      if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
    } catch (e) {}
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: BASE + '?_ts=' + Date.now() });
  await wait(4500);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity (local, bumped)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — on local host', buildIdentity.host === 'localhost:' + HTTP_PORT, `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=' + NEWV, buildIdentity.unified.length === 1 && buildIdentity.unified[0] === NEWV, `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, hasV83: text.indexOf('signal-circuit-v83') >= 0, hasV82: text.indexOf('signal-circuit-v82') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js CACHE_NAME bumped to signal-circuit-v83', swProbe.swFetched && swProbe.hasV83 && !swProbe.hasV82, JSON.stringify(swProbe));

  // ============================================================
  // P2: dead setup* binders removed; render*() kept live
  // ============================================================
  const proto = await evaluate(ws, `(() => {
    const ui = window.game && window.game.ui;
    if (!ui) return { noUi: true };
    const t = (n) => typeof ui[n];
    return {
      // The 5 retired setup binders must be gone.
      setupAchievements: t('setupAchievements'),
      setupMasteryTree: t('setupMasteryTree'),
      setupCircuitCollection: t('setupCircuitCollection'),
      setupLogicProfile: t('setupLogicProfile'),
      setupCosmeticModal: t('setupCosmeticModal'),
      // The render methods they used to call must still be functions.
      renderAchievements: t('renderAchievements'),
      renderMasteryTree: t('renderMasteryTree'),
      renderMasterySection: t('renderMasterySection'),
      renderCircuitCollection: t('renderCircuitCollection'),
      renderLogicProfile: t('renderLogicProfile'),
      renderCosmeticModal: t('renderCosmeticModal'),
      // The merge entry point stays.
      setupProfileHub: t('setupProfileHub'),
      _switchProfileTab: t('_switchProfileTab'),
    };
  })()`);
  assert('P2.a — setupAchievements removed', proto.setupAchievements === 'undefined', `type=${proto.setupAchievements}`);
  assert('P2.b — setupMasteryTree removed', proto.setupMasteryTree === 'undefined', `type=${proto.setupMasteryTree}`);
  assert('P2.c — setupCircuitCollection removed', proto.setupCircuitCollection === 'undefined', `type=${proto.setupCircuitCollection}`);
  assert('P2.d — setupLogicProfile removed', proto.setupLogicProfile === 'undefined', `type=${proto.setupLogicProfile}`);
  assert('P2.e — setupCosmeticModal removed', proto.setupCosmeticModal === 'undefined', `type=${proto.setupCosmeticModal}`);
  assert('P2.f — renderAchievements kept', proto.renderAchievements === 'function', `type=${proto.renderAchievements}`);
  assert('P2.g — renderMasteryTree kept', proto.renderMasteryTree === 'function', `type=${proto.renderMasteryTree}`);
  assert('P2.h — renderMasterySection kept', proto.renderMasterySection === 'function', `type=${proto.renderMasterySection}`);
  assert('P2.i — renderCircuitCollection kept', proto.renderCircuitCollection === 'function', `type=${proto.renderCircuitCollection}`);
  assert('P2.j — renderLogicProfile kept', proto.renderLogicProfile === 'function', `type=${proto.renderLogicProfile}`);
  assert('P2.k — renderCosmeticModal kept', proto.renderCosmeticModal === 'function', `type=${proto.renderCosmeticModal}`);
  assert('P2.l — setupProfileHub + _switchProfileTab live', proto.setupProfileHub === 'function' && proto._switchProfileTab === 'function', JSON.stringify(proto));

  // ============================================================
  // P3: source-level confirmation — the 5 setup defs are gone from ui.js
  //     (fetch the actual served source and grep for the definitions)
  // ============================================================
  const src = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('js/ui.js?v=${NEWV}', { cache: 'no-store' });
      const text = await r.text();
      const has = (re) => new RegExp(re).test(text);
      return {
        defAch: has('\\\\n\\\\s*setupAchievements\\\\s*\\\\('),
        defMast: has('\\\\n\\\\s*setupMasteryTree\\\\s*\\\\('),
        defColl: has('\\\\n\\\\s*setupCircuitCollection\\\\s*\\\\('),
        defProf: has('\\\\n\\\\s*setupLogicProfile\\\\s*\\\\('),
        defCos: has('\\\\n\\\\s*setupCosmeticModal\\\\s*\\\\('),
        // the this.setupX() call sites in the constructor should also be gone
        callAch: has('this\\\\.setupAchievements\\\\('),
        callMast: has('this\\\\.setupMasteryTree\\\\('),
        callColl: has('this\\\\.setupCircuitCollection\\\\('),
        callProf: has('this\\\\.setupLogicProfile\\\\('),
        callCos: has('this\\\\.setupCosmeticModal\\\\('),
        bytes: text.length,
      };
    } catch (e) { return { error: String(e) }; }
  })()`);
  assert('P3.a — no setupAchievements() definition in served ui.js', src.defAch === false, JSON.stringify(src));
  assert('P3.b — no setupMasteryTree() definition', src.defMast === false, `defMast=${src.defMast}`);
  assert('P3.c — no setupCircuitCollection() definition', src.defColl === false, `defColl=${src.defColl}`);
  assert('P3.d — no setupLogicProfile() definition', src.defProf === false, `defProf=${src.defProf}`);
  assert('P3.e — no setupCosmeticModal() definition', src.defCos === false, `defCos=${src.defCos}`);
  assert('P3.f — no this.setupAchievements() call site', src.callAch === false, `callAch=${src.callAch}`);
  assert('P3.g — no this.setupMasteryTree/Collection/LogicProfile/Cosmetic call sites',
    src.callMast === false && src.callColl === false && src.callProf === false && src.callCos === false,
    JSON.stringify({ callMast: src.callMast, callColl: src.callColl, callProf: src.callProf, callCos: src.callCos }));

  // ============================================================
  // P4: THE cleanup-safety proof — Profile hub still renders all 5 panes.
  //     Seed to 15 completions so every tab is tier-available (g15 gate).
  // ============================================================
  await evaluate(ws, `(() => { if (window.game && window.game.seedProgress) window.game.seedProgress(15, {stars:3}); return true; })()`);
  await wait(500);
  // Open the hub via its real button so the Day 124 openHub() path runs.
  const opened = await evaluate(ws, `(() => {
    const btn = document.getElementById('profile-hub-btn');
    if (btn) btn.click();
    const m = document.getElementById('profile-hub-modal');
    return { clicked: !!btn, modalDisplay: m ? getComputedStyle(m).display : null };
  })()`);
  assert('P4.a — Profile hub button present + opens modal', opened.clicked && opened.modalDisplay === 'flex', JSON.stringify(opened));

  const tabProbe = async (key, paneId) => {
    return await evaluate(ws, `(() => {
      window.game.ui._switchProfileTab('${key}');
      const pane = document.getElementById('${paneId}');
      const visible = pane ? getComputedStyle(pane).display !== 'none' : false;
      const content = pane ? pane.textContent.trim().length : 0;
      const childEls = pane ? pane.querySelectorAll('*').length : 0;
      return { visible, content, childEls };
    })()`);
  };
  const ach = await tabProbe('achievements', 'phub-pane-achievements');
  assert('P4.b — Achievements pane renders non-empty', ach.visible && ach.childEls > 0, JSON.stringify(ach));
  const mast = await tabProbe('mastery', 'phub-pane-mastery');
  assert('P4.c — Mastery pane renders non-empty (renderMasteryTree+Section)', mast.visible && mast.childEls > 0, JSON.stringify(mast));
  const cust = await tabProbe('customize', 'phub-pane-customize');
  assert('P4.d — Customize pane renders non-empty (renderCosmeticModal)', cust.visible && cust.childEls > 0, JSON.stringify(cust));
  const coll = await tabProbe('collection', 'phub-pane-collection');
  assert('P4.e — Collection pane renders non-empty', coll.visible && coll.childEls > 0, JSON.stringify(coll));
  const prof = await tabProbe('profile', 'phub-pane-profile');
  assert('P4.f — Logic Profile pane renders non-empty (renderLogicProfile)', prof.visible && prof.childEls > 0, JSON.stringify(prof));

  // ============================================================
  // P5: cosmetic card click still flips active wire color (Day 124 P4 primitive)
  //     — proves renderCosmeticModal's delegation survived the setup* removal.
  // ============================================================
  const cosClick = await evaluate(ws, `(() => {
    window.game.ui._switchProfileTab('customize');
    const before = window.game.cosmetics ? window.game.cosmetics.activeWireColor : null;
    // find an unlocked, non-active wireColor card and click it
    const cards = [...document.querySelectorAll('#phub-pane-customize .cosmetic-card[data-category="wireColor"]:not(.cosmetic-locked)')];
    const target = cards.find(c => !c.classList.contains('cosmetic-active')) || cards[0];
    const targetId = target ? target.getAttribute('data-id') : null;
    if (target) target.click();
    const after = window.game.cosmetics ? window.game.cosmetics.activeWireColor : null;
    return { before, after, targetId, cardCount: cards.length };
  })()`);
  assert('P5.a — customize pane has clickable wireColor cards', cosClick.cardCount > 0, JSON.stringify(cosClick));
  assert('P5.b — clicking a wireColor card sets it active (delegation live)',
    cosClick.after === cosClick.targetId && cosClick.after !== null, JSON.stringify(cosClick));

  // Close the hub cleanly (Day 54 discipline: profile-view cleared)
  const closed = await evaluate(ws, `(() => {
    const closeBtn = document.getElementById('profile-hub-close');
    if (closeBtn) closeBtn.click();
    const m = document.getElementById('profile-hub-modal');
    const pv = document.getElementById('profile-view');
    return { modalDisplay: m ? getComputedStyle(m).display : null, pvChars: pv ? pv.textContent.trim().length : -1 };
  })()`);
  assert('P5.c — hub closes + profile-view cleared', closed.modalDisplay === 'none' && closed.pvChars === 0, JSON.stringify(closed));

  // ============================================================
  // P6: regression floor (clean reload)
  // ============================================================
  await evaluate(ws, `(() => { Object.keys(localStorage).filter(k=>/signal/i.test(k)).forEach(k=>localStorage.removeItem(k)); return true; })()`);
  await send(ws, 'Page.navigate', { url: BASE + '?_ts=' + Date.now() });
  await wait(4000);

  const floor = await evaluate(ws, `(() => {
    const vis = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const ls = document.getElementById('level-select') || document;
    const navBtns = [...ls.querySelectorAll('button')].filter(b =>
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-overflow-btn') && vis(b));
    const cards = [...document.querySelectorAll('.level-btn')].filter(vis);
    return {
      navCount: navBtns.length,
      cardCount: cards.length,
      gateOK: typeof window.Gate === 'function',
      gateTypes: window.GateTypes ? Object.keys(window.GateTypes).length : 0,
      wireOK: typeof window.Wire === 'function',
      simOK: typeof window.Simulation === 'function',
      simInstance: !!(window.game && window.game.simulation instanceof window.Simulation),
      levels: (typeof getLevelCount === 'function' ? getLevelCount() : 0),
      deadIds: ['weekly-puzzle-btn','achievements-btn','customize-btn','mastery-tree-btn','collection-btn','profile-btn']
        .map(id => document.getElementById(id) === null),
      hubModalExists: !!document.getElementById('profile-hub-modal'),
      hubBtnExists: !!document.getElementById('profile-hub-btn'),
    };
  })()`);
  assert('P6.a — cold nav count 2 (Day 78 invariant)', floor.navCount === 2, `nav=${floor.navCount}`);
  assert('P6.b — 50 level cards', floor.cardCount === 50, `cards=${floor.cardCount}`);
  assert('P6.c — Gate ESM binding + 8 GateTypes', floor.gateOK && floor.gateTypes === 8, `gate=${floor.gateOK} types=${floor.gateTypes}`);
  assert('P6.d — Wire ESM binding (Day 107)', floor.wireOK, `wire=${floor.wireOK}`);
  assert('P6.e — Simulation ESM canonical binding (Day 123)', floor.simOK && floor.simInstance, `sim=${floor.simOK} inst=${floor.simInstance}`);
  assert('P6.f — LEVELS = 50', floor.levels === 50, `levels=${floor.levels}`);
  assert('P6.g — 6 retired/dead ids absent from DOM', floor.deadIds.every(Boolean), JSON.stringify(floor.deadIds));
  assert('P6.h — Profile hub modal + button still present (Day 124)', floor.hubModalExists && floor.hubBtnExists, JSON.stringify({ m: floor.hubModalExists, b: floor.hubBtnExists }));

  // ============================================================
  // P7: console hygiene
  // ============================================================
  assert('P7.a — 0 console.error', consoleErrors.length === 0, `count=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''}`);
  assert('P7.b — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, `count=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.slice(0,3).join(' | ') : ''}`);

  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`\n===== Day 135 QA: ${passed}/${results.length} assertions passed =====`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach(f => console.log(`  ✗ ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  ws.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
