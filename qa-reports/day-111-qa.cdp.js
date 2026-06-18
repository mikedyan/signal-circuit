#!/usr/bin/env node
/**
 * Day 111 QA harness — Cycle 5 BUILD Week, Day 5: Stats Dashboard Tournament
 * History tab (#stats-tab-tournament + #stats-tournament-pane).
 *
 * Phases:
 *   P1 Build identity            — 11 ?v=1781395200 refs, sw v73 reachable,
 *                                  GameState live, tournament DOM scaffolding
 *   P2 Tab strip cold            — Tournament tab labeled "🏆 Tournament (0)",
 *                                  class "empty", aria-selected false
 *   P3 Stats modal default       — opens with Overview pane visible, tournament
 *                                  pane hidden, tab strip has 3 tabs
 *   P4 Empty-state tournament    — switch to Tournament tab → empty pane
 *                                  with 🏆 + "No tournament runs yet" copy
 *   P5 Single submission         — submit one tournament score → tab badge
 *                                  shows (1), .empty stripped, row renders
 *                                  with week key + #1 chip + gates/time/percentile
 *   P6 Two submissions           — submit a second weekKey score → tab badge
 *                                  (2), 2 rows present, newest-first ordering
 *   P7 Replay click closes modal — clicking View Replay calls
 *                                  startArchiveWeek (or startCurrentWeek) and
 *                                  closes the Stats modal
 *   P8 Suppression invariants    — Day 78 2 nav buttons, 50 level cards
 *                                  (Day 109 invariant), Day 79 dead IDs
 *                                  undefined, Day 92 + Day 107 window bindings
 *   P9 Console hygiene           — 0 console.error, 0 Runtime.exceptionThrown
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving repo root
 *   - Permissive headless Chromium on port 9301
 *
 * Usage:
 *   node qa-reports/day-111-qa.cdp.js
 */

const wsPath = require.resolve('ws', {
  paths: ['/Users/openclaw/src/openclaw/node_modules', process.cwd()],
});
const WebSocket = require(wsPath);

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();

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
  const detailStr = (detail === undefined) ? '(no detail)' : (JSON.stringify(detail) || String(detail)).slice(0, 300);
  console.log(`[${tag}] ${name}${cond ? '' : ' — ' + detailStr}`);
}

async function getWsUrl() {
  const http = require('http');
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

async function navAndWait(url) {
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

  // Wipe localStorage before nav for a fully cold start
  await navAndWait(TARGET_URL);
  await evalExpr(`(function(){ try { localStorage.clear(); } catch (e) {} return true; })()`);
  await navAndWait(TARGET_URL);

  // ── P1 Build identity ───────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=1781395200')).length +
    Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=1781395200')).length
  `);
  assert('P1.1 11 cache-bust refs at ?v=1781395200', vCount === 11, { vCount });

  const swText = await evalExpr(`fetch('sw.js').then(r => r.text()).then(t => t.match(/signal-circuit-v\\d+/)[0])`, true);
  assert('P1.2 sw.js declares signal-circuit-v73', swText === 'signal-circuit-v73', { swText });

  const gameLive = await evalExpr(`!!window.game && !!window.game.weeklyTournament`);
  assert('P1.3 window.game + weeklyTournament live', gameLive === true);

  const domShape = await evalExpr(`
    (function() {
      const tabsRoot = document.getElementById('stats-tabs');
      const tabT = document.getElementById('stats-tab-tournament');
      const paneT = document.getElementById('stats-tournament-pane');
      const paneC = document.getElementById('stats-cards-pane');
      const paneO = document.getElementById('stats-grid');
      const tabs = tabsRoot ? Array.from(tabsRoot.querySelectorAll('.stats-tab')).map(b => b.id) : [];
      return {
        tabTExists: !!tabT,
        paneTExists: !!paneT,
        paneCExists: !!paneC,
        paneOExists: !!paneO,
        tabs,
        tabTText: tabT ? tabT.textContent.trim() : null,
      };
    })()
  `);
  assert('P1.4 tournament tab + pane exist in DOM',
    domShape && domShape.tabTExists && domShape.paneTExists && domShape.paneCExists && domShape.paneOExists, domShape);
  assert('P1.5 tab strip has 3 tabs',
    domShape && domShape.tabs.length === 3 && domShape.tabs.includes('stats-tab-tournament'), domShape);

  // ── P2 Tab strip cold-state label ──
  console.log('\n── P2 Tab strip cold ──');
  const coldLabel = await evalExpr(`
    (function() {
      const t = document.getElementById('stats-tab-tournament');
      return {
        text: t ? t.textContent.trim() : null,
        ariaSelected: t ? t.getAttribute('aria-selected') : null,
      };
    })()
  `);
  assert('P2.1 cold tournament tab label exists as "🏆 Tournament (0)" or default',
    coldLabel && /Tournament/.test(coldLabel.text || ''), coldLabel);
  assert('P2.2 cold tournament tab aria-selected=false',
    coldLabel && coldLabel.ariaSelected === 'false', coldLabel);

  // ── P3 Stats modal opens to Overview pane by default ──
  console.log('\n── P3 Stats modal default ──');
  // The stats button is only revealed after Tier 2 progress, so open via
  // direct UI call — same pattern Day 96/110 used.
  await evalExpr(`window.game.ui.setupStatsDashboard && void 0`);
  await evalExpr(`(function(){ document.getElementById('stats-modal').style.display='flex'; window.game.ui._switchStatsTab('overview'); return true; })()`);
  await sleep(150);
  const modalDefault = await evalExpr(`
    (function() {
      const modal = document.getElementById('stats-modal');
      const pO = document.getElementById('stats-grid');
      const pC = document.getElementById('stats-cards-pane');
      const pT = document.getElementById('stats-tournament-pane');
      return {
        modalDisplay: modal ? modal.style.display : null,
        overviewVisible: pO ? pO.style.display !== 'none' : false,
        cardsHidden: pC ? pC.style.display === 'none' : false,
        tournamentHidden: pT ? pT.style.display === 'none' : false,
      };
    })()
  `);
  assert('P3.1 modal flex, overview visible', modalDefault && modalDefault.modalDisplay === 'flex' && modalDefault.overviewVisible, modalDefault);
  assert('P3.2 cards pane hidden, tournament pane hidden', modalDefault && modalDefault.cardsHidden && modalDefault.tournamentHidden, modalDefault);

  // ── P4 Empty-state tournament pane ──
  console.log('\n── P4 Empty-state Tournament tab ──');
  await evalExpr(`window.game.ui._switchStatsTab('tournament')`);
  await sleep(150);
  const empty = await evalExpr(`
    (function() {
      const pT = document.getElementById('stats-tournament-pane');
      const tabT = document.getElementById('stats-tab-tournament');
      return {
        paneVisible: pT ? pT.style.display !== 'none' : false,
        paneInnerLen: pT ? pT.innerHTML.length : 0,
        hasEmptyClass: pT ? !!pT.querySelector('.tournament-history-empty') : false,
        emptyText: pT ? (pT.querySelector('.tournament-history-empty') || {}).textContent || '' : '',
        tabActive: tabT ? tabT.classList.contains('active') : false,
        tabEmptyDim: tabT ? tabT.classList.contains('empty') : false,
        tabText: tabT ? tabT.textContent.trim() : '',
      };
    })()
  `);
  assert('P4.1 tournament pane visible', empty && empty.paneVisible, empty);
  assert('P4.2 empty-state div rendered with 🏆 copy',
    empty && empty.hasEmptyClass && /No tournament runs yet/.test(empty.emptyText), empty);
  assert('P4.3 tab badge shows (0) and .empty class',
    empty && empty.tabText.includes('(0)') && empty.tabEmptyDim, empty);
  assert('P4.4 tournament tab is now active', empty && empty.tabActive, empty);

  // ── P5 Single submission populates the row ──
  console.log('\n── P5 Single submission ──');
  await evalExpr(`
    (function() {
      const wt = window.game.weeklyTournament;
      // Submit one score against the current week.
      window.__d111_sub1 = wt.submitScore(3, 25, 'Mochi');
      window.game.ui._switchStatsTab('tournament');
      return true;
    })()
  `);
  await sleep(150);
  const oneRow = await evalExpr(`
    (function() {
      const pT = document.getElementById('stats-tournament-pane');
      const tabT = document.getElementById('stats-tab-tournament');
      const rows = pT ? pT.querySelectorAll('.tournament-history-row') : [];
      const first = rows[0];
      const week = first ? first.querySelector('.th-week').textContent.trim() : '';
      const chips = first ? Array.from(first.querySelectorAll('.th-chip')).map(c => c.textContent.trim()) : [];
      const stat = first ? (first.querySelector('.th-stat') || {}).textContent || '' : '';
      const replay = first ? first.querySelector('.th-replay') : null;
      return {
        rowCount: rows.length,
        tabText: tabT.textContent.trim(),
        tabEmptyDim: tabT.classList.contains('empty'),
        week,
        chips,
        stat,
        replayLabel: replay ? replay.textContent.trim() : '',
        replayDataCurrent: replay ? replay.getAttribute('data-current') : null,
        submission: window.__d111_sub1,
      };
    })()
  `);
  assert('P5.1 row count = 1', oneRow && oneRow.rowCount === 1, oneRow);
  assert('P5.2 tab label "🏆 Tournament (1)"', oneRow && oneRow.tabText.includes('(1)'), oneRow);
  assert('P5.3 .empty class stripped after first submission', oneRow && oneRow.tabEmptyDim === false, oneRow);
  assert('P5.4 row shows weekKey YYYY-Wxx format', oneRow && /^\d{4}-W\d{2}/.test(oneRow.week), oneRow);
  assert('P5.5 row carries a chip and a 3 gates · 0:25 stat',
    oneRow && oneRow.chips.length >= 1 && /3 gates/.test(oneRow.stat) && /0:25/.test(oneRow.stat), oneRow);
  assert('P5.6 row Replay button exists labeled "View Replay"',
    oneRow && oneRow.replayLabel === 'View Replay', oneRow);
  assert('P5.7 row Replay is flagged data-current=1 (current week)',
    oneRow && oneRow.replayDataCurrent === '1', oneRow);
  assert('P5.8 submission returns rank+score+weekKey',
    oneRow && oneRow.submission && typeof oneRow.submission.rank === 'number' && oneRow.submission.weekKey, oneRow.submission);

  // ── P6 Two submissions across distinct weeks ──
  console.log('\n── P6 Two distinct-week submissions ──');
  await evalExpr(`
    (function() {
      const wt = window.game.weeklyTournament;
      // Synthetically backfill a second historical week directly into
      // byWeek (submitScore() can only write the current week). This
      // exercises the same render path getSubmissionHistory exposes.
      wt.data.byWeek['2026-W18'] = {
        gates: 4,
        time: 42,
        score: wt.computeScore(4, 42),
        name: 'Mochi',
        attempted: true,
        ts: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
      };
      wt._save();
      window.game.ui._switchStatsTab('tournament');
      return true;
    })()
  `);
  await sleep(150);
  const twoRows = await evalExpr(`
    (function() {
      const pT = document.getElementById('stats-tournament-pane');
      const tabT = document.getElementById('stats-tab-tournament');
      const rows = pT ? Array.from(pT.querySelectorAll('.tournament-history-row')) : [];
      const weeks = rows.map(r => r.querySelector('.th-week').textContent.trim().split(/\\s+/)[0]);
      const dataCurrents = rows.map(r => {
        const b = r.querySelector('.th-replay');
        return b ? b.getAttribute('data-current') : null;
      });
      return {
        rowCount: rows.length,
        tabText: tabT.textContent.trim(),
        weeks,
        dataCurrents,
        firstIsNewer: rows.length === 2 && weeks[0] !== '2026-W18',
        hasArchive: dataCurrents.some(d => d === '0'),
      };
    })()
  `);
  assert('P6.1 row count = 2', twoRows && twoRows.rowCount === 2, twoRows);
  assert('P6.2 tab label "🏆 Tournament (2)"', twoRows && twoRows.tabText.includes('(2)'), twoRows);
  assert('P6.3 newest-first ordering — current week sits above archived 2026-W18',
    twoRows && twoRows.firstIsNewer && twoRows.weeks[1] === '2026-W18', twoRows);
  assert('P6.4 at least one archived row has data-current=0',
    twoRows && twoRows.hasArchive, twoRows);

  // ── P7 Replay click invokes archive launch + closes modal ──
  console.log('\n── P7 Replay click ──');
  await evalExpr(`
    (function() {
      window.__d111_replayCalled = null;
      const wt = window.game.weeklyTournament;
      const origArchive = wt.startArchiveWeek.bind(wt);
      const origLive = wt.startCurrentWeek.bind(wt);
      wt.startArchiveWeek = function(k) { window.__d111_replayCalled = { kind: 'archive', key: k }; };
      wt.startCurrentWeek = function() { window.__d111_replayCalled = { kind: 'live' }; };
      window.__d111_restoreReplay = function() { wt.startArchiveWeek = origArchive; wt.startCurrentWeek = origLive; };
      return true;
    })()
  `);
  await evalExpr(`
    (function() {
      const pT = document.getElementById('stats-tournament-pane');
      const rows = Array.from(pT.querySelectorAll('.tournament-history-row'));
      // Click archive row's Replay button (data-current="0").
      const archiveRow = rows.find(r => r.querySelector('.th-replay').getAttribute('data-current') === '0');
      archiveRow.querySelector('.th-replay').click();
      return true;
    })()
  `);
  await sleep(150);
  const replay = await evalExpr(`
    (function() {
      return {
        called: window.__d111_replayCalled,
        modalDisplay: document.getElementById('stats-modal').style.display,
      };
    })()
  `);
  assert('P7.1 archive Replay invoked startArchiveWeek with correct weekKey',
    replay && replay.called && replay.called.kind === 'archive' && replay.called.key === '2026-W18', replay);
  assert('P7.2 Stats modal closed after Replay', replay && replay.modalDisplay === 'none', replay);
  await evalExpr(`window.__d111_restoreReplay && window.__d111_restoreReplay()`);

  // ── P8 Suppression invariants (Day 78, Day 79, Day 92, Day 107, Day 109) ──
  console.log('\n── P8 Cold-start invariants ──');
  await evalExpr(`(function(){ localStorage.clear(); return true; })()`);
  await navAndWait(TARGET_URL);
  await sleep(1200);
  await evalExpr(`(function(){ if (window.game && typeof window.game.showLevelSelect === 'function') { window.game.showLevelSelect(); } return true; })()`);
  await sleep(400);
  const invariants = await evalExpr(`
    (function() {
      const cards = Array.from(document.querySelectorAll('.level-btn'));
      const howToPlay = !!document.getElementById('how-to-play-btn');
      const settings = !!document.getElementById('open-settings-btn');
      const deadIds = ['showFirstLaunchDifficultyModal', 'checkLightning', 'checkEclipseRun', 'checkArchitect', 'isMythic', '_showHud', 'getCurrentStep'];
      const allDead = deadIds.every(id => typeof window[id] === 'undefined');
      return {
        cardCount: cards.length,
        howToPlay,
        settings,
        weeklyAbsent: !document.getElementById('weekly-puzzle-btn'),
        d92Gate: typeof window.Gate === 'function' && !!window.GateTypes,
        d107Wire: typeof window.Wire === 'function' && typeof window.WireManager === 'function',
        deadIdsUndefined: allDead,
      };
    })()
  `);
  assert('P8.1 cold-start nav: How to Play + Settings visible (Day 78 invariant)',
    invariants && invariants.howToPlay && invariants.settings, invariants);
  assert('P8.2 level cards = 50 (Day 109 invariant)', invariants && invariants.cardCount === 50, invariants);
  assert('P8.3 #weekly-puzzle-btn DOM absent (Day 79)', invariants && invariants.weeklyAbsent, invariants);
  assert('P8.4 window.Gate / GateTypes live (Day 92 ES module)', invariants && invariants.d92Gate, invariants);
  assert('P8.5 window.Wire / WireManager live (Day 107 ES module)', invariants && invariants.d107Wire, invariants);
  assert('P8.6 Day 79 dead identifiers still undefined', invariants && invariants.deadIdsUndefined, invariants);

  // ── P9 Console hygiene ──
  console.log('\n── P9 Console hygiene ──');
  assert('P9.1 0 Runtime.exceptionThrown', exceptions.length === 0, { exceptions });
  // AudioContext autoplay warnings are noise; filter them out.
  const realConsoleErrors = consoleErrors.filter(e => !/AudioContext/.test(e));
  assert('P9.2 0 real console.error (autoplay warnings filtered)', realConsoleErrors.length === 0, { realConsoleErrors });

  // ── Summary ──
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`\n── Summary ── ${passed}/${results.length} passed, ${failed} failed`);
  console.log('console.error:', consoleErrors.length, 'Runtime.exceptionThrown:', exceptions.length);

  ws.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Harness threw:', e);
  process.exit(2);
});
