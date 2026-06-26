#!/usr/bin/env node
/**
 * Day 119 QA harness — Cycle 5 PRUNE Week, Day 2: "Design Simplification".
 *
 * Ships the 3 Tier-1 cuts from PRUNE_REPORT.md (Day 118):
 *   Cut #1: De-duplicate tournament history — remove the `My Best` tab from the
 *           Tournament screen; personal history is now canonical in
 *           Stats → 🏆 Tournament (Day 111). Tournament screen = This Week + Archive.
 *   Cut #2: `⚠ Reset Progress` behind a typed-confirm gate (type RESET).
 *   Cut #3: Hide zero-count Stats tabs (📸 My Cards (0) / 🏆 Tournament (0))
 *           until the count goes positive (supersedes Day 104/111 .empty dim).
 *
 * Build under test: LOCAL http://localhost:8901/  (?v=1782432000 / sw v74).
 *
 * Coverage:
 *   P1   build identity (local, ?v=1782432000 / sw v74)
 *   P2   Cut #1 — Tournament screen: 2 tabs (This Week + Archive), no My Best,
 *        history pointer present, archive tab still works
 *   P3   Cut #2 — Reset typed-confirm: input shown, OK disarmed until RESET typed,
 *        arms on match, cancel aborts, wrong word no-op, RESET fires resetProgress
 *   P4   Cut #3 — Stats tabs hidden at zero count cold; revealed when count > 0
 *   P5   regression — cold-start 2 nav / 50 cards; tier staircase; Day 79 dead-ids
 *   P6   0 console errors / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-119-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

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

const SCREEN_HELPERS = `
  const screenVisible = (id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  };
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };
`;

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

  // Cold-start wipe + reload.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_clean' });
  await wait(4000);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity (local)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — unified ?v=1782432000 (Day 119 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782432000', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV74: text.indexOf('signal-circuit-v74') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v74', swProbe.swFetched === true && swProbe.hasV74 === true, JSON.stringify(swProbe));

  // ============================================================
  // P2: Cut #1 — Tournament screen de-duplication
  // ============================================================
  const cut1 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const trnBtn = document.getElementById('tournament-btn');
    trnBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const onScreen = screenVisible('tournament-screen');
    const tabs = [...document.querySelectorAll('.tournament-tab')].map(t => t.getAttribute('data-tab'));
    const myBestTabExists = !!document.querySelector('.tournament-tab[data-tab="my-best"]');
    const myBestPaneExists = !!document.getElementById('tournament-tab-my-best');
    const myBestContainerExists = !!document.getElementById('tournament-mybest');
    const pointer = document.querySelector('.tournament-history-pointer');
    const pointerVisible = pointer ? visible(pointer) : false;
    const pointerText = pointer ? pointer.textContent.trim() : '';
    // Archive tab still works
    const archiveTab = document.querySelector('.tournament-tab[data-tab="archive"]');
    if (archiveTab) archiveTab.click();
    await new Promise(r => setTimeout(r, 300));
    const archivePaneVisible = screenVisible('tournament-tab-archive');
    const archiveListExists = !!document.getElementById('tournament-archive-list');
    // This Week tab returns
    const thisWeekTab = document.querySelector('.tournament-tab[data-tab="this-week"]');
    if (thisWeekTab) thisWeekTab.click();
    await new Promise(r => setTimeout(r, 250));
    const thisWeekVisible = screenVisible('tournament-tab-this-week');
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 150));
    return { onScreen, tabs, myBestTabExists, myBestPaneExists, myBestContainerExists,
             pointerVisible, pointerText, archivePaneVisible, archiveListExists, thisWeekVisible };
  })()`);
  console.log(`\n[Cut #1] tabs=${JSON.stringify(cut1.tabs)} pointer="${cut1.pointerText}"`);
  assert('P2.a — Tournament screen opens', cut1.onScreen === true);
  assert('P2.b — exactly 2 tabs: This Week + Archive', cut1.tabs.length === 2 && cut1.tabs.includes('this-week') && cut1.tabs.includes('archive'), JSON.stringify(cut1.tabs));
  assert('P2.c — My Best tab removed', cut1.myBestTabExists === false);
  assert('P2.d — My Best pane removed', cut1.myBestPaneExists === false && cut1.myBestContainerExists === false);
  assert('P2.e — history pointer present + visible', cut1.pointerVisible === true && /Stats/.test(cut1.pointerText) && /Tournament/.test(cut1.pointerText), `text="${cut1.pointerText}"`);
  assert('P2.f — Archive tab still functions', cut1.archivePaneVisible === true && cut1.archiveListExists === true);
  assert('P2.g — This Week tab returns cleanly', cut1.thisWeekVisible === true);

  // ============================================================
  // P3: Cut #2 — Reset Progress typed-confirm gate
  // ============================================================
  const cut2 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 150));
    gs.seedProgress(10, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));
    const methodExists = typeof gs.ui.showTypedConfirmModal === 'function';
    // Open settings, click Reset Progress
    document.getElementById('open-settings-btn').click();
    await new Promise(r => setTimeout(r, 350));
    document.getElementById('reset-progress-btn').click();
    await new Promise(r => setTimeout(r, 300));
    const modal = document.getElementById('confirm-modal');
    const input = document.getElementById('confirm-modal-input');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const modalVisible = screenVisible('confirm-modal');
    const inputVisible = input ? visible(input) : false;
    const okDisabledInitial = okBtn ? (okBtn.disabled === true) : null;
    const placeholder = input ? input.getAttribute('placeholder') : '';
    // Type wrong word
    input.value = 'reZet';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    const okDisabledWrong = okBtn ? okBtn.disabled : null;
    // Clicking OK while disarmed must NOT reset
    const progressBefore = Object.keys(gs.progress.levels || {}).length;
    okBtn.click();
    await new Promise(r => setTimeout(r, 120));
    const stillOpenAfterBadClick = screenVisible('confirm-modal');
    const progressAfterBadClick = Object.keys(gs.progress.levels || {}).length;
    // Type correct word (case-insensitive) -> arms
    input.value = 'reset';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    const okArmedLower = okBtn ? (okBtn.disabled === false) : null;
    input.value = 'RESET';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    const okArmed = okBtn ? (okBtn.disabled === false) : null;
    // Cancel path: abort without reset
    cancelBtn.click();
    await new Promise(r => setTimeout(r, 150));
    const closedAfterCancel = !screenVisible('confirm-modal');
    const inputHiddenAfterCancel = input ? (getComputedStyle(input).display === 'none') : null;
    const progressAfterCancel = Object.keys(gs.progress.levels || {}).length;
    // Now actually reset via the gate
    document.getElementById('reset-progress-btn').click();
    await new Promise(r => setTimeout(r, 250));
    const input2 = document.getElementById('confirm-modal-input');
    input2.value = 'RESET';
    input2.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
    document.getElementById('confirm-modal-ok').click();
    await new Promise(r => setTimeout(r, 300));
    const progressAfterReset = Object.keys(gs.progress.levels || {}).length;
    const modalClosedAfterReset = !screenVisible('confirm-modal');
    // Ensure settings shared confirm still plain (input hidden by default)
    return {
      methodExists, modalVisible, inputVisible, okDisabledInitial, placeholder,
      okDisabledWrong, stillOpenAfterBadClick, progressBefore, progressAfterBadClick,
      okArmedLower, okArmed, closedAfterCancel, inputHiddenAfterCancel, progressAfterCancel,
      progressAfterReset, modalClosedAfterReset,
    };
  })()`);
  console.log(`\n[Cut #2] ${JSON.stringify(cut2)}`);
  assert('P3.a — showTypedConfirmModal method exists', cut2.methodExists === true);
  assert('P3.b — confirm modal opens with input visible', cut2.modalVisible === true && cut2.inputVisible === true);
  assert('P3.c — OK disarmed initially', cut2.okDisabledInitial === true);
  assert('P3.d — placeholder prompts for RESET', /RESET/.test(cut2.placeholder || ''), `ph="${cut2.placeholder}"`);
  assert('P3.e — OK stays disarmed on wrong word', cut2.okDisabledWrong === true);
  assert('P3.f — disarmed OK click does NOT reset (modal stays, progress intact)', cut2.stillOpenAfterBadClick === true && cut2.progressAfterBadClick === cut2.progressBefore, `before=${cut2.progressBefore} after=${cut2.progressAfterBadClick}`);
  assert('P3.g — OK arms on "reset" (case-insensitive)', cut2.okArmedLower === true);
  assert('P3.h — OK armed on "RESET"', cut2.okArmed === true);
  assert('P3.i — Cancel aborts (modal closed, input hidden, progress intact)', cut2.closedAfterCancel === true && cut2.inputHiddenAfterCancel === true && cut2.progressAfterCancel === cut2.progressBefore, JSON.stringify(cut2));
  assert('P3.j — typed RESET + OK wipes progress', cut2.progressAfterReset === 0 && cut2.modalClosedAfterReset === true, `after=${cut2.progressAfterReset}`);

  // P3.k — shared showConfirmModal still hides the input (non-destructive flows unaffected)
  const sharedConfirm = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.ui.showConfirmModal('Plain confirm test?', () => {});
    await new Promise(r => setTimeout(r, 150));
    const input = document.getElementById('confirm-modal-input');
    const inputHidden = input ? (getComputedStyle(input).display === 'none') : null;
    document.getElementById('confirm-modal-cancel').click();
    await new Promise(r => setTimeout(r, 120));
    return { inputHidden };
  })()`);
  assert('P3.k — plain showConfirmModal keeps input hidden', sharedConfirm.inputHidden === true);

  // ============================================================
  // P4: Cut #3 — Hide zero-count Stats tabs
  // ============================================================
  // Cold wipe + reload so card library + tournament history are both empty.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_stats_cold' });
  await wait(4000);
  const cut3cold = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(12, { stars: 3 });
    await new Promise(r => setTimeout(r, 250));
    document.getElementById('stats-btn').click();
    await new Promise(r => setTimeout(r, 500));
    const cardsTab = document.getElementById('stats-tab-cards');
    const tournamentTab = document.getElementById('stats-tab-tournament');
    const overviewTab = document.getElementById('stats-tab-overview');
    const cardsHidden = cardsTab ? (getComputedStyle(cardsTab).display === 'none') : null;
    const tournamentHidden = tournamentTab ? (getComputedStyle(tournamentTab).display === 'none') : null;
    const overviewVisible = overviewTab ? visible(overviewTab) : false;
    const visibleTabs = [...document.querySelectorAll('#stats-tabs .stats-tab')].filter(visible).map(t => t.textContent.trim());
    const activeTab = gs.ui._activeStatsTab;
    const closeBtn = document.getElementById('stats-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 200));
    return { cardsHidden, tournamentHidden, overviewVisible, visibleTabs, activeTab };
  })()`);
  console.log(`\n[Cut #3 cold] visibleTabs=${JSON.stringify(cut3cold.visibleTabs)} active=${cut3cold.activeTab}`);
  assert('P4.a — cold: My Cards tab hidden (0 cards)', cut3cold.cardsHidden === true);
  assert('P4.b — cold: Tournament tab hidden (0 submissions)', cut3cold.tournamentHidden === true);
  assert('P4.c — cold: only Overview tab visible', cut3cold.overviewVisible === true && cut3cold.visibleTabs.length === 1, JSON.stringify(cut3cold.visibleTabs));
  assert('P4.d — cold: active tab is overview (no strand)', cut3cold.activeTab === 'overview', `active=${cut3cold.activeTab}`);

  // Now add a card -> My Cards tab reveals
  const cut3reveal = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    // Inject a synthetic snapshot card via the public API if present
    let added = false;
    if (typeof gs.addSnapshotCard === 'function') {
      gs.addSnapshotCard({ levelId: 1, title: 'Test Card', dataUrl: 'data:image/png;base64,iVBORw0KGgo=', text: 't', fileName: 'c.png', savedAt: Date.now() });
      added = true;
    }
    document.getElementById('stats-btn').click();
    await new Promise(r => setTimeout(r, 500));
    const cardsTab = document.getElementById('stats-tab-cards');
    const cardsVisible = cardsTab ? visible(cardsTab) : false;
    const cardsText = cardsTab ? cardsTab.textContent.trim() : '';
    const cardsLen = (typeof gs.getCardLibrary === 'function') ? gs.getCardLibrary().length : -1;
    const closeBtn = document.getElementById('stats-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 150));
    return { added, cardsVisible, cardsText, cardsLen };
  })()`);
  console.log(`[Cut #3 reveal] ${JSON.stringify(cut3reveal)}`);
  assert('P4.e — adding a card reveals My Cards tab', cut3reveal.added === true && cut3reveal.cardsLen >= 1 && cut3reveal.cardsVisible === true, JSON.stringify(cut3reveal));
  assert('P4.f — revealed tab shows positive count', /My Cards \(1\)/.test(cut3reveal.cardsText), `text=${cut3reveal.cardsText}`);

  // ============================================================
  // P5: regression
  // ============================================================
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_regress' });
  await wait(4000);
  const regress = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 250));
    const ls = document.getElementById('level-select-screen');
    const nav = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const cards = [...ls.querySelectorAll('.level-btn')].length;
    // Day 79 dead ids
    const ids = ['showFirstLaunchDifficultyModal', 'checkLightning', 'checkEclipseRun', 'checkArchitect', 'isMythic', '_showHud', 'getCurrentStep'];
    const stillUndef = ids.every(name => {
      const ach = gs.achievementManager, ui = gs.ui, ir = gs.infiniteRun, tut = gs.tutorial;
      if (ach && typeof ach[name] === 'function') return false;
      if (ui && typeof ui[name] === 'function') return false;
      if (ir && typeof ir[name] === 'function') return false;
      if (tut && typeof tut[name] === 'function') return false;
      return true;
    });
    const weeklyBtnAbsent = !document.getElementById('weekly-puzzle-btn');
    // end-game staircase
    gs.seedProgress(50, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const navEnd = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    const overflowEnd = [...ls.querySelectorAll('.level-overflow-btn')].filter(b => getComputedStyle(b).display !== 'none').length;
    const cardsEnd = [...ls.querySelectorAll('.level-btn')].length;
    return { navCold: nav.length, cardsCold: cards, stillUndef, weeklyBtnAbsent, navEnd, overflowEnd, cardsEnd };
  })()`);
  console.log(`\n[Regress] navCold=${regress.navCold} cardsCold=${regress.cardsCold} navEnd=${regress.navEnd} overflowEnd=${regress.overflowEnd} cardsEnd=${regress.cardsEnd}`);
  assert('P5.a — cold: 2 nav buttons (Day 78 invariant)', regress.navCold === 2, `got ${regress.navCold}`);
  assert('P5.b — cold: 50 level cards', regress.cardsCold === 50, `got ${regress.cardsCold}`);
  assert('P5.c — Day 79: 7 dead ids undefined', regress.stillUndef === true);
  assert('P5.d — Day 79: #weekly-puzzle-btn absent', regress.weeklyBtnAbsent === true);
  assert('P5.e — end-game: 18 nav + 50 overflow', regress.navEnd === 18 && regress.overflowEnd === 50, `nav=${regress.navEnd} overflow=${regress.overflowEnd}`);
  assert('P5.f — end-game: 50 cards (mastery gated out, Day 103)', regress.cardsEnd === 50, `got ${regress.cardsEnd}`);

  // ============================================================
  // P6: console hygiene
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P6.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P6.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 119 DESIGN SIMPLIFICATION (LOCAL) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);

  const summary = {
    buildIdentity, swProbe, cut1, cut2, sharedConfirm, cut3cold, cut3reveal, regress,
    realErrors, realExceptions, assertions: results, passed, total,
  };
  require('fs').writeFileSync('/tmp/day-119-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-119-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
