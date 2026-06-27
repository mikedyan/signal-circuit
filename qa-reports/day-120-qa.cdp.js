#!/usr/bin/env node
/**
 * Day 120 QA harness — Cycle 5 PRUNE Week, Day 3: "Code Cleanup".
 *
 * Net-negative day. Removes dead code left behind by Day 119 Cut #1:
 *   - js/ui.js: orphaned `_renderTournamentMyBest()` (caller + My Best tab/pane
 *     deleted Day 119) removed.
 *   - css/style.css: its sole-consumer rules removed — `.tournament-stat-row`(+:last-child
 *     + light-mode), `.tournament-best-card`(+light-mode), `.tournament-mybest-empty`,
 *     `.tournament-badge-gold`. KEPT: `.tournament-badge` (archive Live pill),
 *     `.tcard-title` (#tournament-puzzle-title), `.tournament-section-title` (index.html).
 *   - specs/day-121-collection-merge-scaffold.md: Tier-2 Cut #4 groundwork (planning only).
 *
 * Build under test: LOCAL http://localhost:8901/  (?v=1782518400 / sw v75).
 *
 * Coverage:
 *   P1   build identity (local, ?v=1782518400 / sw v75)
 *   P2   orphan removal — gs.ui._renderTournamentMyBest undefined; #tournament-mybest
 *        absent; Tournament screen still 2 tabs + Archive works (no collateral breakage)
 *   P3   dead-CSS removal — removed selectors match 0 rules; kept selectors still present
 *   P4   regression — cold 2 nav / 50 cards; Day 79 dead-ids; end-game staircase
 *   P5   0 console errors / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-120-qa.cdp.js
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
  assert('P1.b — unified ?v=1782518400 (Day 120 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782518400', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV75: text.indexOf('signal-circuit-v75') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v75', swProbe.swFetched === true && swProbe.hasV75 === true, JSON.stringify(swProbe));

  // ============================================================
  // P2: orphan removal — no collateral breakage on Tournament screen
  // ============================================================
  const orphan = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    // The orphaned renderer must be gone from the UI prototype.
    const rendererGone = typeof gs.ui._renderTournamentMyBest === 'undefined';
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    document.getElementById('tournament-btn').click();
    await new Promise(r => setTimeout(r, 600));
    const onScreen = screenVisible('tournament-screen');
    const tabs = [...document.querySelectorAll('.tournament-tab')].map(t => t.getAttribute('data-tab'));
    const myBestContainerExists = !!document.getElementById('tournament-mybest');
    const myBestTabExists = !!document.querySelector('.tournament-tab[data-tab="my-best"]');
    // Archive tab still works after the JS removal
    const archiveTab = document.querySelector('.tournament-tab[data-tab="archive"]');
    if (archiveTab) archiveTab.click();
    await new Promise(r => setTimeout(r, 300));
    const archivePaneVisible = screenVisible('tournament-tab-archive');
    const archiveListExists = !!document.getElementById('tournament-archive-list');
    // This Week returns
    const thisWeekTab = document.querySelector('.tournament-tab[data-tab="this-week"]');
    if (thisWeekTab) thisWeekTab.click();
    await new Promise(r => setTimeout(r, 250));
    const thisWeekVisible = screenVisible('tournament-tab-this-week');
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 150));
    return { rendererGone, onScreen, tabs, myBestContainerExists, myBestTabExists,
             archivePaneVisible, archiveListExists, thisWeekVisible };
  })()`);
  console.log(`\n[Orphan] rendererGone=${orphan.rendererGone} tabs=${JSON.stringify(orphan.tabs)}`);
  assert('P2.a — _renderTournamentMyBest removed from UI prototype', orphan.rendererGone === true);
  assert('P2.b — Tournament screen opens', orphan.onScreen === true);
  assert('P2.c — still exactly 2 tabs (This Week + Archive)', orphan.tabs.length === 2 && orphan.tabs.includes('this-week') && orphan.tabs.includes('archive'), JSON.stringify(orphan.tabs));
  assert('P2.d — #tournament-mybest container absent + My Best tab absent', orphan.myBestContainerExists === false && orphan.myBestTabExists === false);
  assert('P2.e — Archive tab still functions', orphan.archivePaneVisible === true && orphan.archiveListExists === true);
  assert('P2.f — This Week tab returns cleanly', orphan.thisWeekVisible === true);

  // ============================================================
  // P3: dead-CSS removal verification (stylesheet rule scan)
  // ============================================================
  const css = await evaluate(ws, `(async () => {
    // Collect every CSS rule selectorText across all same-origin sheets.
    const selectors = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.selectorText) selectors.push(rule.selectorText);
      }
    }
    const has = (frag) => selectors.some(s => s.indexOf(frag) >= 0);
    return {
      total: selectors.length,
      // removed (must be 0 matches):
      hasMybestEmpty: has('.tournament-mybest-empty'),
      hasBestCard: has('.tournament-best-card'),
      hasStatRow: has('.tournament-stat-row'),
      hasBadgeGold: has('.tournament-badge-gold'),
      // kept (must still exist):
      hasBadgeBase: has('.tournament-badge'),
      hasTcardTitle: has('.tcard-title'),
      hasSectionTitle: has('.tournament-section-title'),
      hasArchiveRow: has('.tournament-archive-row'),
    };
  })()`);
  console.log(`\n[CSS] ${JSON.stringify(css)}`);
  assert('P3.a — .tournament-mybest-empty removed', css.hasMybestEmpty === false);
  assert('P3.b — .tournament-best-card removed', css.hasBestCard === false);
  assert('P3.c — .tournament-stat-row removed', css.hasStatRow === false);
  assert('P3.d — .tournament-badge-gold removed', css.hasBadgeGold === false);
  assert('P3.e — .tournament-badge base KEPT (archive Live pill)', css.hasBadgeBase === true);
  assert('P3.f — .tcard-title KEPT (#tournament-puzzle-title)', css.hasTcardTitle === true);
  assert('P3.g — .tournament-section-title KEPT (index.html leaderboard/archive)', css.hasSectionTitle === true);
  assert('P3.h — .tournament-archive-row KEPT', css.hasArchiveRow === true);

  // ============================================================
  // P4: regression
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
  assert('P4.a — cold: 2 nav buttons (Day 78 invariant)', regress.navCold === 2, `got ${regress.navCold}`);
  assert('P4.b — cold: 50 level cards', regress.cardsCold === 50, `got ${regress.cardsCold}`);
  assert('P4.c — Day 79: 7 dead ids undefined', regress.stillUndef === true);
  assert('P4.d — Day 79: #weekly-puzzle-btn absent', regress.weeklyBtnAbsent === true);
  assert('P4.e — end-game: 18 nav + 50 overflow', regress.navEnd === 18 && regress.overflowEnd === 50, `nav=${regress.navEnd} overflow=${regress.overflowEnd}`);
  assert('P4.f — end-game: 50 cards (mastery gated out, Day 103)', regress.cardsEnd === 50, `got ${regress.cardsEnd}`);

  // ============================================================
  // P5: console hygiene
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P5.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P5.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 120 CODE CLEANUP (LOCAL) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);

  const summary = {
    buildIdentity, swProbe, orphan, css, regress,
    realErrors, realExceptions, assertions: results, passed, total,
  };
  require('fs').writeFileSync('/tmp/day-120-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-120-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
