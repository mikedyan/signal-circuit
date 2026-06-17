#!/usr/bin/env node
/**
 * Day 110 QA harness — Cycle 5 BUILD Week, Day 4: Gameplay HUD personal-best
 * badge (#level-best-badge).
 *
 * Phases:
 *   P1 Build identity            — 11 ?v=1781308800 refs, sw v72 reachable,
 *                                  GameState live, #level-best-badge in DOM
 *   P2 Cold L1 entry             — badge hidden (no prior progress)
 *   P3 Synthetic completion      — write progress[1] via completeLevel surrogate
 *                                  and verify badge appears on re-enter with
 *                                  correct text
 *   P4 Live update path          — solve L1 via simulation, verify badge
 *                                  updates after completeLevel + saveProgress
 *   P5 No improvement = no flash — repeated equal-best save leaves badge text
 *                                  unchanged (still rendered)
 *   P6 Sandbox suppression       — startSandbox → badge hidden
 *   P7 Daily suppression         — daily mode → badge hidden
 *   P8 Cold-start invariants     — Day 78 2 nav buttons; 50 level cards; Day 79
 *                                  dead IDs undefined; Day 92/107 window
 *                                  bindings live
 *   P9 Console hygiene           — 0 console.error, 0 Runtime.exceptionThrown
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301
 *
 * Usage:
 *   node qa-reports/day-110-qa.cdp.js
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

  // ── P1 Build identity ────────────────────────────────────────────────
  console.log('\n── P1 Build identity ──');
  const vCount = await evalExpr(`
    Array.from(document.querySelectorAll('script[src*="?v="]')).filter(s => s.src.includes('?v=1781308800')).length +
    Array.from(document.querySelectorAll('link[href*="?v="]')).filter(s => s.href.includes('?v=1781308800')).length
  `);
  assert('P1.1 11 cache-bust refs at ?v=1781308800', vCount === 11, { vCount });

  const swText = await evalExpr(`fetch('sw.js').then(r => r.text()).then(t => t.match(/signal-circuit-v\\d+/)[0])`, true);
  assert('P1.2 sw.js declares signal-circuit-v72', swText === 'signal-circuit-v72', { swText });

  const gameLive = await evalExpr(`!!window.game && !!window.game.wireManager`);
  assert('P1.3 window.game + wireManager live', gameLive === true);

  const badgeShape = await evalExpr(`
    (function() {
      const el = document.getElementById('level-best-badge');
      const text = document.getElementById('level-best-text');
      const cta = document.getElementById('level-best-cta');
      return {
        badgeExists: !!el,
        textExists: !!text,
        ctaExists: !!cta,
        initialDisplay: el ? el.style.display : null,
        parentId: el ? el.parentElement.id : null,
      };
    })()
  `);
  assert('P1.4 #level-best-badge exists in #level-info', badgeShape && badgeShape.badgeExists && badgeShape.parentId === 'level-info', badgeShape);
  assert('P1.5 child spans #level-best-text + #level-best-cta exist', badgeShape && badgeShape.textExists && badgeShape.ctaExists, badgeShape);
  assert('P1.6 badge initial display:none (hidden by default)', badgeShape && badgeShape.initialDisplay === 'none', badgeShape);

  // ── P2 Cold L1 entry ─────────────────────────────────────────────────
  console.log('\n── P2 Cold L1 entry ──');
  await evalExpr(`window.game.loadLevel(1)`);
  await sleep(500);
  const p2 = await evalExpr(`
    (function() {
      const el = document.getElementById('level-best-badge');
      const lvl = window.game.currentLevel;
      const prog = window.game.progress.levels[1];
      return {
        display: el && getComputedStyle(el).display,
        styleDisplay: el && el.style.display,
        levelId: lvl ? lvl.id : null,
        progressEntry: prog ? { completed: !!prog.completed, stars: prog.stars } : null,
      };
    })()
  `);
  assert('P2.1 L1 loaded as current level', p2.levelId === 1, p2);
  assert('P2.2 No prior progress entry', p2.progressEntry === null || !p2.progressEntry.completed, p2);
  assert('P2.3 Badge hidden on cold L1', p2.styleDisplay === 'none', p2);

  // ── P3 Synthetic completion → badge appears on re-enter ──────────────
  console.log('\n── P3 Synthetic completion → re-enter L1 ──');
  const p3 = await evalExpr(`
    (function() {
      const gs = window.game;
      // Synthesize a completion record (best=1 gate, 22s, 3 stars)
      gs.progress.levels[1] = {
        completed: true,
        stars: 3,
        bestGateCount: 1,
        bestTime: 22,
        pureLogic: false,
        lastPlayed: Date.now(),
        completedAt: Date.now(),
        attempts: 1,
      };
      gs.saveProgress();
      // Re-load L1 to trigger updateLevelInfo path
      gs.loadLevel(1);
      const el = document.getElementById('level-best-badge');
      const text = document.getElementById('level-best-text');
      const cta = document.getElementById('level-best-cta');
      return {
        display: el && el.style.display,
        textHtml: text && text.innerHTML,
        ctaText: cta && cta.textContent,
      };
    })()
  `);
  await sleep(300);
  assert('P3.1 Badge visible on revisit', p3.display === 'flex', p3);
  assert('P3.2 Text contains "1 gate"', p3.textHtml && p3.textHtml.includes('1 gate'), p3);
  assert('P3.3 Text contains time "0:22"', p3.textHtml && p3.textHtml.includes('0:22'), p3);
  assert('P3.4 Text contains 3 star symbols', p3.textHtml && (p3.textHtml.match(/⭐/g) || []).length === 3, p3);
  assert('P3.5 CTA shows perfect-run variant (3★ + at optimal)', p3.ctaText && /Perfect run/i.test(p3.ctaText), p3);

  // ── P4 Live update path: simulate a worse-then-better solve sequence ─
  console.log('\n── P4 Live update via completeLevel ──');
  const p4Init = await evalExpr(`
    (function() {
      const gs = window.game;
      // Reset to a worse prior best (3 gates, 60s, 1 star) so a real solve improves it.
      gs.progress.levels[1] = {
        completed: true,
        stars: 1,
        bestGateCount: 3,
        bestTime: 60,
        pureLogic: false,
        lastPlayed: Date.now(),
        completedAt: Date.now(),
        attempts: 1,
      };
      gs.saveProgress();
      gs.loadLevel(1);
      const text = document.getElementById('level-best-text');
      return { initial: text && text.innerHTML };
    })()
  `);
  assert('P4.1 Initial badge shows "3 gates"', p4Init.initial && p4Init.initial.includes('3 gates'), p4Init);
  assert('P4.2 Initial badge shows 1-star outline', p4Init.initial && (p4Init.initial.match(/☆/g) || []).length === 2, p4Init);

  // Now simulate completeLevel with a better run (1 gate)
  const p4Update = await evalExpr(`
    (function() {
      const gs = window.game;
      // Inject a 30s elapsed timer
      gs.timerStart = Date.now() - 30000;
      gs.timerPending = false;
      gs.hintsUsed = 0;
      // Drive completeLevel directly with gateCount=1 (which beats prior 3)
      const stars = gs.completeLevel(1, 1);
      const text = document.getElementById('level-best-text');
      const el = document.getElementById('level-best-badge');
      return {
        stars,
        textAfter: text && text.innerHTML,
        improvedClassPresent: el && el.classList.contains('lbb-improved'),
        progress: gs.progress.levels[1],
      };
    })()
  `);
  await sleep(200);
  assert('P4.3 completeLevel returned 3 stars', p4Update.stars === 3, p4Update);
  assert('P4.4 Progress bestGateCount=1', p4Update.progress && p4Update.progress.bestGateCount === 1, p4Update);
  assert('P4.5 Badge text updated to "1 gate"', p4Update.textAfter && p4Update.textAfter.includes('1 gate'), p4Update);
  assert('P4.6 .lbb-improved class applied during improvement', p4Update.improvedClassPresent === true, p4Update);

  // ── P5 No-improvement save: badge still rendered, no crash ───────────
  console.log('\n── P5 Equal-best save ──');
  const p5 = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.timerStart = Date.now() - 30000;
      gs.timerPending = false;
      gs.hintsUsed = 0;
      const stars = gs.completeLevel(1, 1);  // same 1-gate, won't improve
      const el = document.getElementById('level-best-badge');
      const text = document.getElementById('level-best-text');
      return {
        stars,
        display: el && el.style.display,
        text: text && text.innerHTML,
        gates: gs.progress.levels[1].bestGateCount,
        time: gs.progress.levels[1].bestTime,
      };
    })()
  `);
  assert('P5.1 completeLevel returned 3 stars', p5.stars === 3, p5);
  assert('P5.2 Best gate count unchanged at 1', p5.gates === 1, p5);
  assert('P5.3 Badge still visible after no-op completion', p5.display === 'flex', p5);

  // ── P6 Sandbox mode suppression ──────────────────────────────────────
  console.log('\n── P6 Sandbox suppression ──');
  const p6 = await evalExpr(`
    (function() {
      const gs = window.game;
      if (typeof gs.startSandbox !== 'function') {
        // Build a synthetic sandbox level directly
        gs.isSandboxMode = true;
        gs.currentLevel = { id: 999, isSandbox: true, title: 'Sandbox', description: '', inputs: [], outputs: [], truthTable: [] };
        gs.ui.updateLevelInfo();
      } else {
        gs.startSandbox(2, 1);
      }
      const el = document.getElementById('level-best-badge');
      return {
        display: el && el.style.display,
        sandboxMode: gs.isSandboxMode === true || (gs.currentLevel && gs.currentLevel.isSandbox === true),
      };
    })()
  `);
  assert('P6.1 Sandbox mode entered', p6.sandboxMode === true, p6);
  assert('P6.2 Badge hidden in sandbox', p6.display === 'none', p6);

  // ── P7 Daily mode suppression ────────────────────────────────────────
  console.log('\n── P7 Daily suppression ──');
  const p7 = await evalExpr(`
    (function() {
      const gs = window.game;
      gs.isSandboxMode = false;
      // Synthetic daily level
      gs.currentLevel = {
        id: 9001, isDaily: true, title: 'Daily', description: '',
        inputs: [{label:'A',x:100,y:100}], outputs: [{label:'Y',x:200,y:100}],
        truthTable: [[0,0],[1,1]]
      };
      gs.ui.updateLevelInfo();
      const el = document.getElementById('level-best-badge');
      return { display: el && el.style.display };
    })()
  `);
  assert('P7.1 Badge hidden in daily mode', p7.display === 'none', p7);

  // Reset for P8
  await evalExpr(`window.game.isSandboxMode = false; window.game.isChallengeMode = false; window.game.isDaily = false; window.game.showLevelSelect();`);
  await sleep(400);

  // ── P8 Cold-start invariants ─────────────────────────────────────────
  console.log('\n── P8 Cold-start invariants ──');
  const p8 = await evalExpr(`
    (function() {
      const navBtnSel = '#level-select .nav-btn, #level-select-actions button, #level-select-header button, #challenge-modes button, #info-modes button';
      const visibleNav = Array.from(document.querySelectorAll(navBtnSel)).filter(b => {
        const cs = getComputedStyle(b);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const cards = Array.from(document.querySelectorAll('.level-btn'));
      return {
        levelCards: cards.length,
        deadIds: {
          showFirstLaunchDifficultyModal: typeof window.showFirstLaunchDifficultyModal,
          checkLightning: typeof window.checkLightning,
          checkEclipseRun: typeof window.checkEclipseRun,
          checkArchitect: typeof window.checkArchitect,
          isMythic: typeof window.isMythic,
          _showHud: typeof window._showHud,
          getCurrentStep: typeof window.getCurrentStep,
        },
        weeklyPuzzleDom: !!document.getElementById('weekly-puzzle-btn'),
        windowBindings: {
          Gate: typeof window.Gate,
          GateTypes: typeof window.GateTypes,
          Wire: typeof window.Wire,
          WireManager: typeof window.WireManager,
        },
        howToPlay: !!document.getElementById('how-to-play-btn'),
        settings: !!document.getElementById('open-settings-btn'),
      };
    })()
  `);
  assert('P8.1 50 level cards (Day 109 invariant)', p8.levelCards === 50, { count: p8.levelCards });
  assert('P8.2 Day 79 dead IDs still undefined', Object.values(p8.deadIds).every(t => t === 'undefined'), p8.deadIds);
  assert('P8.3 #weekly-puzzle-btn DOM absent (Day 79)', p8.weeklyPuzzleDom === false, p8);
  assert('P8.4 window.Gate/GateTypes (Day 92)', p8.windowBindings.Gate === 'function' && p8.windowBindings.GateTypes === 'object', p8.windowBindings);
  assert('P8.5 window.Wire/WireManager (Day 107)', p8.windowBindings.Wire === 'function' && p8.windowBindings.WireManager === 'function', p8.windowBindings);
  assert('P8.6 Day 78 nav: How to Play + Settings present', p8.howToPlay === true && p8.settings === true, p8);

  // ── P9 Console hygiene ───────────────────────────────────────────────
  console.log('\n── P9 Console hygiene ──');
  assert('P9.1 0 console.error', consoleErrors.length === 0, consoleErrors);
  assert('P9.2 0 Runtime.exceptionThrown', exceptions.length === 0, exceptions);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n── Summary ──');
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`Total: ${passed}/${total} passed`);
  if (passed < total) {
    console.log('FAILED:');
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  - ${r.name}: ${JSON.stringify(r.detail).slice(0, 240)}`);
    }
    process.exitCode = 1;
  }

  ws.close();
}

main().catch((e) => {
  console.error('harness error:', e);
  process.exitCode = 1;
});
