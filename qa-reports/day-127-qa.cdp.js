#!/usr/bin/env node
/**
 * Day 127 QA harness — Cycle 6 BUILD Week Day 5:
 * Stats Dashboard — per-chapter completion heatmap tab (closes Cycle 6 BUILD).
 *
 * What shipped today:
 *   1. New 📈 Progress tab in #stats-tabs (+ #stats-progress-pane).
 *   2. _renderProgressHeatmap(): one cell per chapter, tinted by completion band
 *      over the chapter's own hue; ★ earned/max overlay; ✓ + glow on 100%;
 *      summary strip (X/Y levels · ★ A/B); bonus chapters in a second section.
 *   3. Hidden-when-empty (Day 119): tab display:none until ≥1 level completed;
 *      _switchStatsTab('progress') strand-guards to Overview on an empty profile.
 *
 * Phases:
 *   P1 Build identity        — 11 ?v=1783036800 refs, sw v81, game live, tab in DOM
 *   P2 Cold empty state      — progress tab hidden; strand-guard → overview
 *   P3 Seeded correctness    — seedProgress(18): tab reveals; per-chapter tallies
 *                              match a harness re-derivation from progress.levels
 *   P4 Full completion band  — seedProgress(50,{stars:3}): all non-bonus 100% + ✓;
 *                              summary totals match getLevelCount()/3×count
 *   P5 Tab switching         — panes toggle; only one visible; active class tracks
 *   P6 Regression invariants — Day 78 / 79 / 92 / 107 / 123 ESM + cold backend local
 *   P7 Console hygiene
 *
 * Prereqs:
 *   - tools/cdp-launch.sh start   (static server 8901 + headless Chromium 9301)
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-127-qa.cdp.js
 */

const http = require('http');

const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();
const V = '1783036800';

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
  const gameLive = await evalExpr(`!!window.game && !!window.game.ui && typeof window.game.seedProgress === 'function'`);
  assert('P1.2 window.game + ui + seedProgress live', gameLive === true);
  const swVer = await evalExpr(`fetch('sw.js?probe=' + Date.now()).then(r=>r.text()).then(t=>{const m=t.match(/signal-circuit-v(\\d+)/);return m?m[1]:null;})`, true);
  assert('P1.3 sw.js CACHE_NAME = signal-circuit-v81', swVer === '81', { swVer });

  const dom = await evalExpr(`({
    tab: !!document.getElementById('stats-tab-progress'),
    pane: !!document.getElementById('stats-progress-pane'),
    render: typeof window.game.ui._renderProgressHeatmap,
    tally: typeof window.game.ui._progressCompletedTotal,
  })`);
  assert('P1.4 Day 127 progress tab + pane in DOM', dom.tab === true && dom.pane === true, dom);
  assert('P1.5 _renderProgressHeatmap + _progressCompletedTotal present', dom.render === 'function' && dom.tally === 'function', dom);

  // ── P2 Cold empty state ─────────────────────────────────────────────
  console.log('\n── P2 Cold empty state ──');
  await evalExpr(`localStorage.clear()`);
  await navigateAndWait(TARGET_URL + '_cold');
  await sleep(400);

  const p2 = await evalExpr(`
    (function(){
      const ui = window.game.ui;
      // Open stats (mirrors the openStats handler path).
      document.getElementById('stats-btn') && document.getElementById('stats-btn').click();
      const tab = document.getElementById('stats-tab-progress');
      const tabHidden = tab ? getComputedStyle(tab).display === 'none' : null;
      const completed = ui._progressCompletedTotal();
      // Strand-guard: force-switch to progress on an empty profile.
      ui._switchStatsTab('progress');
      const active = ui._activeStatsTab;
      const pane = document.getElementById('stats-progress-pane');
      const paneVisible = pane ? getComputedStyle(pane).display !== 'none' : null;
      return { tabHidden, completed, active, paneVisible };
    })()
  `);
  assert('P2.1 progress tab hidden cold (0 completions)', p2.tabHidden === true, p2);
  assert('P2.2 _progressCompletedTotal() === 0 cold', p2.completed === 0, p2);
  assert('P2.3 strand-guard routes empty progress → overview', p2.active === 'overview' && p2.paneVisible === false, p2);

  // ── P3 Seeded correctness ───────────────────────────────────────────
  console.log('\n── P3 Seeded correctness ──');
  const p3 = await evalExpr(`
    (function(){
      const g = window.game, ui = g.ui;
      g.seedProgress(18);
      // Open stats + switch to progress.
      ui._switchStatsTab('progress');
      const tab = document.getElementById('stats-tab-progress');
      const tabShown = tab ? getComputedStyle(tab).display !== 'none' : null;
      const active = ui._activeStatsTab;
      const cells = document.querySelectorAll('#stats-progress-pane .phm-cell').length;
      const chapters = (typeof getChapters === 'function') ? getChapters() : [];
      const lp = g.progress.levels || {};
      // Re-derive per-chapter tallies independently.
      const derived = chapters.map(ch => {
        let done = 0, stars = 0;
        for (const id of (ch.levels||[])) {
          const p = lp[id];
          if (p && p.completed) { done++; stars += Math.max(0, Math.min(3, p.stars||0)); }
        }
        return { title: ch.title, done, stars, total: (ch.levels||[]).length };
      });
      const totalDone = derived.reduce((a,r)=>a+r.done,0);
      return { tabShown, active, cells, nChapters: chapters.length, derived, totalDone,
               tallyMethod: ui._progressCompletedTotal() };
    })()
  `);
  assert('P3.1 progress tab reveals after seedProgress(18)', p3.tabShown === true, { tabShown: p3.tabShown });
  assert('P3.2 progress pane is active tab', p3.active === 'progress', { active: p3.active });
  assert('P3.3 one heatmap cell per chapter', p3.cells === p3.nChapters && p3.cells > 0, { cells: p3.cells, nChapters: p3.nChapters });
  assert('P3.4 _progressCompletedTotal matches re-derived total', p3.tallyMethod === p3.totalDone && p3.totalDone > 0, { tally: p3.tallyMethod, totalDone: p3.totalDone });
  // Verify the rendered cell text for the first non-empty chapter matches derivation.
  const p3cell = await evalExpr(`
    (function(){
      const cells = Array.from(document.querySelectorAll('#stats-progress-pane .phm-cell'));
      const chapters = (typeof getChapters === 'function') ? getChapters() : [];
      const lp = window.game.progress.levels || {};
      // Find first chapter with ≥1 completion.
      let idx = -1, derived = null;
      for (let i=0;i<chapters.length;i++){
        const ch = chapters[i]; let done=0, stars=0;
        for (const id of (ch.levels||[])){ const p=lp[id]; if(p&&p.completed){done++;stars+=Math.max(0,Math.min(3,p.stars||0));} }
        if (done>0){ idx=i; derived={done,stars,total:(ch.levels||[]).length}; break; }
      }
      if (idx<0) return { ok:false };
      const sub = cells[idx].querySelector('.phm-sub');
      const txt = sub ? sub.textContent : '';
      const expect = derived.done + '/' + derived.total + ' · ★' + derived.stars + '/' + (derived.total*3);
      return { ok:true, txt, expect, match: txt === expect };
    })()
  `);
  assert('P3.5 rendered cell sub-text matches per-chapter derivation', p3cell.ok === true && p3cell.match === true, p3cell);

  // ── P4 Full completion band ─────────────────────────────────────────
  console.log('\n── P4 Full completion band ──');
  const p4 = await evalExpr(`
    (function(){
      const g = window.game, ui = g.ui;
      g.seedProgress(50, {stars:3});
      ui._switchStatsTab('progress');
      const chapters = (typeof getChapters === 'function') ? getChapters() : [];
      const mainChapters = chapters.filter(c => !c.isBonus);
      const cells = Array.from(document.querySelectorAll('#stats-progress-pane .phm-cell'));
      // Count 100% cells (have phm-done class + a ✓ check).
      const doneCells = cells.filter(c => c.classList.contains('phm-done')).length;
      const checks = document.querySelectorAll('#stats-progress-pane .phm-check').length;
      const meta = document.querySelector('#stats-progress-pane .progress-heatmap-meta');
      const metaTxt = meta ? meta.textContent : '';
      const levelCount = (typeof getLevelCount === 'function') ? getLevelCount() : null;
      const tally = ui._progressCompletedTotal();
      return { nChapters: chapters.length, doneCells, checks, metaTxt, levelCount, tally,
               allMainDone: mainChapters.length };
    })()
  `);
  assert('P4.1 all chapters 100% show phm-done + ✓', p4.doneCells === p4.nChapters && p4.checks === p4.nChapters, p4);
  assert('P4.2 _progressCompletedTotal === getLevelCount() after full seed', p4.tally === p4.levelCount && p4.levelCount > 0, { tally: p4.tally, levelCount: p4.levelCount });
  assert('P4.3 summary strip totals reflect full completion', p4.metaTxt.indexOf(p4.levelCount + ' / ' + p4.levelCount) !== -1 && p4.metaTxt.indexOf('★ ' + (p4.levelCount * 3) + ' / ' + (p4.levelCount * 3)) !== -1, { metaTxt: p4.metaTxt });

  // ── P5 Tab switching ────────────────────────────────────────────────
  console.log('\n── P5 Tab switching ──');
  const p5 = await evalExpr(`
    (function(){
      const ui = window.game.ui;
      const vis = () => ({
        overview: getComputedStyle(document.getElementById('stats-grid')).display !== 'none',
        progress: getComputedStyle(document.getElementById('stats-progress-pane')).display !== 'none',
        cards: getComputedStyle(document.getElementById('stats-cards-pane')).display !== 'none',
        tournament: getComputedStyle(document.getElementById('stats-tournament-pane')).display !== 'none',
      });
      ui._switchStatsTab('overview');
      const a = vis();
      ui._switchStatsTab('progress');
      const b = vis();
      const progTabActive = document.getElementById('stats-tab-progress').classList.contains('active');
      const overTabActive = document.getElementById('stats-tab-overview').classList.contains('active');
      ui._switchStatsTab('overview');
      const c = vis();
      // Count how many panes visible in each state (must be exactly 1).
      const count = (o) => Object.values(o).filter(Boolean).length;
      return { a, b, c, progTabActive, overTabActive, ca: count(a), cb: count(b), cc: count(c) };
    })()
  `);
  assert('P5.1 overview → only overview pane visible', p5.a.overview === true && p5.ca === 1, p5.a);
  assert('P5.2 progress → only progress pane visible', p5.b.progress === true && p5.cb === 1, p5.b);
  assert('P5.3 progress tab active class set, overview cleared', p5.progTabActive === true && p5.overTabActive === false, { prog: p5.progTabActive, over: p5.overTabActive });
  assert('P5.4 back to overview → only overview pane visible', p5.c.overview === true && p5.cc === 1, p5.c);

  // ── P6 Regression invariants ────────────────────────────────────────
  console.log('\n── P6 Regression invariants ──');
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
  assert('P6.1 cold-start non-level button count = 2 (Day 78)', coldNavBtns === 2, { coldNavBtns });
  const cardCount = await evalExpr(`document.querySelectorAll('#level-select-screen .level-btn').length`);
  assert('P6.2 50 level cards visible cold (Day 109)', cardCount === 50, { cardCount });

  const day79 = await evalExpr(`({
    showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
    weeklyPuzzleBtn: !!document.getElementById('weekly-puzzle-btn'),
  })`);
  assert('P6.3 Day 79 dead-id showFirstLaunchDifficultyModal undefined', day79.showFirstLaunchDifficultyModal === 'undefined', day79);
  assert('P6.4 Day 79 #weekly-puzzle-btn DOM absent', day79.weeklyPuzzleBtn === false, day79);

  const esm = await evalExpr(`({
    Gate: typeof window.Gate,
    GateTypes: typeof window.GateTypes,
    Wire: typeof window.Wire,
    WireManager: typeof window.WireManager,
    Simulation: typeof window.Simulation,
    simInstance: window.game.simulation instanceof window.Simulation,
  })`);
  assert('P6.5 Day 92 window.Gate / GateTypes bound', esm.Gate === 'function' && esm.GateTypes === 'object', esm);
  assert('P6.6 Day 107 window.Wire / WireManager bound', esm.Wire === 'function' && esm.WireManager === 'function', esm);
  assert('P6.7 Day 123 window.Simulation bound + instance identity', esm.Simulation === 'function' && esm.simInstance === true, esm);

  const coldBackend = await evalExpr(`window.game.tournamentBackend.getMode()`);
  assert('P6.8 cold tournament backend = local (Day 125)', coldBackend === 'local', { coldBackend });

  // Progress tab still hidden cold post-clear (empty-state discipline holds).
  const progHiddenCold = await evalExpr(`
    (function(){
      window.game.ui._updateStatsTabsUI();
      const tab = document.getElementById('stats-tab-progress');
      return tab ? getComputedStyle(tab).display === 'none' : null;
    })()
  `);
  assert('P6.9 progress tab hidden again after localStorage clear', progHiddenCold === true, { progHiddenCold });

  // ── P7 Console hygiene ──────────────────────────────────────────────
  console.log('\n── P7 Console hygiene ──');
  assert('P7.1 0 console.error', consoleErrors.length === 0, consoleErrors.slice(0, 3));
  assert('P7.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions.slice(0, 3));

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
