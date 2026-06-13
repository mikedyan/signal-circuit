#!/usr/bin/env node
/**
 * Day 106 QA harness — Cycle 4 PRUNE Week, Day 5: Expert Panel + Validation.
 *
 * Day 81 / Day 67 precedent: re-score the 10-dimension expert rubric across
 * 5 sampled levels (L1 cold-tutorial, L6 end-Ch1, L18 Tier-3 unlock, L36
 * Lab Bench I, L44 Lab Bench II composite) on the Day 105 build
 * (?v=1780876800 / sw v68 — unchanged from Day 105).
 *
 * Phases:
 *   P1 Build identity            (11 ?v=1780876800 refs, sw v68, GameState)
 *   P2 Cold-start (cleared)      (2 nav buttons, 45 cards, light/dark auto,
 *                                 silent-default difficulty, defaults audit,
 *                                 mastery cards gated out of grid post-Day-103)
 *   P3 Tier staircase            (seeds 0/3/6/9/12/15/18/45 reveal cadence)
 *   P4 Level samples             (L1/L6/L18/L36/L44 — truth tables, HUDs,
 *                                 lab identity, hint-footer policy)
 *   P5 Cycle-4 invariants        (Day 103 LO-1 fix, Day 103 tournament label,
 *                                 Day 103 Stats default-to-cards, Day 103
 *                                 mastery card gating, Day 103 lab budget
 *                                 row split, Day 104 Gameplay section,
 *                                 Day 104 .empty stats tab, Day 105
 *                                 settings fade-in keyframe)
 *   P6 Day-79 dead-id regression (7 identifiers undefined + DOM gone)
 *   P7 Console hygiene
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium 146 on port 9301
 *
 * Usage:
 *   node qa-reports/day-106-qa.cdp.js
 */

const http = require('http');
const path = require('path');
const wsPath = require.resolve('ws', {
  paths: [
    '/Users/openclaw/src/openclaw/node_modules',
    process.cwd(),
  ],
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
    allowUnsafeEvalBlocking: true,
  }).then((r) => {
    if (r.exceptionDetails) {
      throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
    }
    return r.result && r.result.value;
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function assert(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function getDebugTarget() {
  return new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const tabs = JSON.parse(body);
          const tab = tabs.find((t) => t.type === 'page') || tabs[0];
          resolve(tab.webSocketDebuggerUrl);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function connect() {
  const url = await getDebugTarget();
  ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message));
      else resolve(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
    } else if (m.method === 'Runtime.exceptionThrown') {
      exceptions.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
}

async function navigate(url) {
  await send('Page.navigate', { url });
  // Wait for load via polling readiness
  for (let i = 0; i < 60; i++) {
    await sleep(150);
    const ready = await evalExpr('document.readyState === "complete" && !!window.game && !!window.game.ui');
    if (ready) {
      await sleep(400); // let init finish
      return;
    }
  }
  throw new Error('navigation timeout: ' + url);
}

async function clearAndReload() {
  await evalExpr('try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}');
  await navigate(TARGET_URL);
}

async function seedAndReload(n, opts = {}) {
  await evalExpr('try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}');
  await navigate(TARGET_URL);
  await evalExpr(`window.game.seedProgress(${n}, ${JSON.stringify(opts)})`);
  await sleep(300);
}

(async () => {
  console.log('=== Day 106 PRUNE Week Day 5 — Expert Panel + Validation ===\n');
  await connect();

  // ──────────────────────────────────────────────────────────────
  // P1 Build identity
  // ──────────────────────────────────────────────────────────────
  console.log('--- P1 Build identity ---');
  await clearAndReload();

  const v = await evalExpr(`
    Array.from(document.querySelectorAll('script[src*="v="], link[href*="v="]'))
      .map(e => (e.src||e.href).match(/v=(\\d+)/))
      .filter(Boolean).map(m => m[1])
  `);
  assert('11 cache-bust refs unified', v.length === 11, `count=${v.length}`);
  assert('all refs = 1780876800', v.every(x => x === '1780876800'), `unique=${[...new Set(v)].join(',')}`);

  const swState = await evalExpr(`
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg && reg.active && reg.active.scriptURL ? reg.active.scriptURL.split('/').pop() : null;
    })()
  `, true);
  assert('SW registered', swState === 'sw.js', `scriptURL=${swState}`);

  const gameName = await evalExpr('window.game && window.game.constructor && window.game.constructor.name');
  assert('GameState constructed', gameName === 'GameState');

  // ──────────────────────────────────────────────────────────────
  // P2 Cold-start audit
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P2 Cold-start audit ---');
  await clearAndReload();

  const coldUI = await evalExpr(`
    (() => {
      const visible = (el) => { if (!el) return false; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null; };
      const ls = document.getElementById('level-select-screen');
      const navBtns = ls ? [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)) : [];
      const cards = ls ? [...ls.querySelectorAll('.level-btn')].filter(c => visible(c)) : [];
      const masteryInGrid = ls ? [...ls.querySelectorAll('.mastery-completed, .mastery-level')] : [];
      return {
        levelSelectVisible: visible(ls),
        navButtons: navBtns.length,
        navIds: navBtns.map(b => b.id || b.textContent.trim().slice(0,30)),
        levelCards: cards.length,
        masteryCardsInGrid: masteryInGrid.length,
        tournamentBtnVisible: visible(document.getElementById('tournament-btn')),
        weeklyPuzzleDom: !!document.getElementById('weekly-puzzle-btn'),
        lightMode: document.body.classList.contains('light-mode'),
        sfxVol: window.game.audio && window.game.audio._sfxVol,
        musicVol: window.game.audio && window.game.audio._musicVol,
        placementVisible: visible(document.getElementById('placement-test-modal')),
        difficultyModalVisible: visible(document.getElementById('difficulty-modal')),
      };
    })()
  `);
  assert('level-select-screen visible cold', coldUI.levelSelectVisible === true);
  assert('cold nav buttons = 2 (How to Play + Settings)', coldUI.navButtons === 2, `count=${coldUI.navButtons} ids=${JSON.stringify(coldUI.navIds)}`);
  assert('45 level cards visible cold', coldUI.levelCards === 45, `count=${coldUI.levelCards}`);
  assert('mastery cards gated out of grid (Day 103 Cut #4)', coldUI.masteryCardsInGrid === 0, `count=${coldUI.masteryCardsInGrid}`);
  assert('tournament-btn hidden cold (tier3-gated)', coldUI.tournamentBtnVisible === false);
  assert('weekly-puzzle-btn DOM gone (Day 79)', coldUI.weeklyPuzzleDom === false);
  assert('placement modal hidden (Day 64)', coldUI.placementVisible === false);
  assert('difficulty modal hidden (Day 78 silent-default)', coldUI.difficultyModalVisible === false);
  // silent-default writes 'standard' shortly after init; let it settle.
  await sleep(500);
  const difficultyAfter = await evalExpr(`localStorage.getItem('signal-circuit-difficulty-mode')`);
  assert("silent-default difficulty = 'standard'", difficultyAfter === 'standard', `value=${difficultyAfter}`);
  assert('SFX vol = 0.4 (Day 46/80/105)', coldUI.sfxVol === 0.4, `value=${coldUI.sfxVol}`);
  assert('Music vol = 0.2 (Day 46/80/105)', coldUI.musicVol === 0.2, `value=${coldUI.musicVol}`);

  // ──────────────────────────────────────────────────────────────
  // P3 Tier staircase (seed 0/3/6/9/12/15/18/45)
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P3 Tier staircase ---');
  const expectedStaircase = [
    { seed: 0, nav: 2, overflow: 0 },
    { seed: 3, nav: 2, overflow: 3 },
    { seed: 6, nav: 5, overflow: 6 },
    { seed: 9, nav: 7, overflow: 9 },
    { seed: 12, nav: 10, overflow: 12 },
    { seed: 15, nav: 13, overflow: 15 },
    { seed: 18, nav: 18, overflow: 18 },
    { seed: 45, nav: 18, overflow: 45 },
  ];
  for (const step of expectedStaircase) {
    await seedAndReload(step.seed);
    const counts = await evalExpr(`
      (() => {
        const visible = (el) => { if (!el) return false; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null; };
        const ls = document.getElementById('level-select-screen');
        const nav = ls ? [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)) : [];
        const overflow = ls ? [...ls.querySelectorAll('.level-overflow-btn')].filter(b => visible(b)) : [];
        return {
          nav: nav.length,
          overflow: overflow.length,
          tournament: visible(document.getElementById('tournament-btn')),
        };
      })()
    `);
    assert(`seed=${step.seed} nav=${step.nav}`, counts.nav === step.nav, `got nav=${counts.nav}`);
    assert(`seed=${step.seed} overflow=${step.overflow}`, counts.overflow === step.overflow, `got overflow=${counts.overflow}`);
    if (step.seed >= 18) {
      assert(`seed=${step.seed} tournament-btn visible`, counts.tournament === true);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // P4 Level samples (L1 / L6 / L18 / L36 / L44)
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P4 Level samples ---');

  // L1 (AND Gate Basics — cold tutorial path)
  await clearAndReload();
  await evalExpr(`window.game.startLevel(1)`);
  await sleep(500);
  const L1 = await evalExpr(`
    (() => {
      const lvl = window.game.currentLevel;
      const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
      const tutorial = (() => { const e = document.getElementById('tutorial-overlay'); return !!e && e.offsetParent !== null; })();
      const hintFooter = (() => { const e = document.getElementById('hint-info'); return !!e && e.offsetParent !== null; })();
      const labHud = (() => { const e = document.getElementById('lab-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      const runLabel = document.getElementById('run-btn') && document.getElementById('run-btn').textContent.trim();
      return { id: lvl.id, title: lvl.title, ttRows, tutorial, hintFooter, labHud, runLabel, isLab: !!lvl.isLabBench };
    })()
  `);
  assert('L1 loaded', L1.id === 1, JSON.stringify(L1));
  assert('L1 truth table = 4 rows', L1.ttRows === 4);
  assert('L1 tutorial overlay fires', L1.tutorial === true);
  assert('L1 hint footer hidden (Day 78 #4)', L1.hintFooter === false);
  assert('L1 lab HUD hidden', L1.labHud === false);
  assert('L1 RUN label = "▶ RUN"', /▶/.test(L1.runLabel || ''), L1.runLabel);
  assert('L1 isLabBench = false', L1.isLab === false);

  // L6 (Signal Selector — end of Chapter 1)
  await clearAndReload();
  await evalExpr(`window.game.startLevel(6)`);
  await sleep(400);
  const L6 = await evalExpr(`
    (() => {
      const lvl = window.game.currentLevel;
      const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
      const hintFooter = (() => { const e = document.getElementById('hint-info'); return !!e && e.offsetParent !== null; })();
      const labHud = (() => { const e = document.getElementById('lab-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      return { id: lvl.id, title: lvl.title, ttRows, hintFooter, labHud };
    })()
  `);
  assert('L6 loaded', L6.id === 6, JSON.stringify(L6));
  assert('L6 truth table populated', L6.ttRows >= 4, `rows=${L6.ttRows}`);
  assert('L6 hint footer visible (Day 78 #4 only hides L<4)', L6.hintFooter === true);
  assert('L6 lab HUD hidden', L6.labHud === false);

  // L18 (2-Input Decoder — Tier-3 unlock surface)
  await clearAndReload();
  await evalExpr(`window.game.startLevel(18)`);
  await sleep(400);
  const L18 = await evalExpr(`
    (() => {
      const lvl = window.game.currentLevel;
      const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
      const labHud = (() => { const e = document.getElementById('lab-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      return { id: lvl.id, title: lvl.title, ttRows, labHud };
    })()
  `);
  assert('L18 loaded', L18.id === 18, JSON.stringify(L18));
  assert('L18 truth table populated', L18.ttRows >= 4, `rows=${L18.ttRows}`);
  assert('L18 lab HUD hidden', L18.labHud === false);

  // L36 (Lab Bench I)
  await clearAndReload();
  await evalExpr(`window.game.startLevel(36)`);
  await sleep(400);
  const L36 = await evalExpr(`
    (() => {
      const lvl = window.game.currentLevel;
      const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
      const labHud = (() => { const e = document.getElementById('lab-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      const runLabel = document.getElementById('run-btn') && document.getElementById('run-btn').textContent.trim();
      const quickTestVisible = (() => { const e = document.getElementById('quick-test-btn'); return e && e.offsetParent !== null; })();
      const labState = window.game._lab && { ...window.game._lab };
      return { id: lvl.id, title: lvl.title, ttRows, labHud, runLabel, quickTestVisible, isLab: !!lvl.isLabBench, labState };
    })()
  `);
  assert('L36 loaded', L36.id === 36, JSON.stringify(L36));
  assert('L36 isLabBench = true', L36.isLab === true);
  assert('L36 lab HUD visible', L36.labHud === true);
  assert('L36 RUN label = "📐 Submit Blueprint"', /Submit Blueprint/.test(L36.runLabel || ''), L36.runLabel);
  assert('L36 Quick Test hidden (lab mode)', L36.quickTestVisible === false);
  assert('L36 lab state attempts=0/max=3', L36.labState && L36.labState.attempts === 0 && L36.labState.maxAttempts === 3, JSON.stringify(L36.labState));

  // L44 (Lab Bench II composite: NAND-only + cap-6)
  await clearAndReload();
  await evalExpr(`window.game.startLevel(44)`);
  await sleep(400);
  const L44 = await evalExpr(`
    (() => {
      const lvl = window.game.currentLevel;
      const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
      const labHud = (() => { const e = document.getElementById('lab-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      const constraintChip = (() => { const e = document.getElementById('lab-constraint'); return !!e && e.offsetParent !== null && e.textContent.trim(); })();
      const constraintChip2 = (() => { const e = document.getElementById('lab-constraint-2'); return !!e && e.offsetParent !== null && e.textContent.trim(); })();
      const budgetChip = (() => { const e = document.getElementById('lab-budget'); return !!e && e.offsetParent !== null; })();
      return { id: lvl.id, title: lvl.title, ttRows, labHud, isLab: !!lvl.isLabBench, constraintChip, constraintChip2, budgetChip, hardCap: lvl.gateHardCap, mustInclude: lvl.mustIncludeGate };
    })()
  `);
  assert('L44 loaded', L44.id === 44, JSON.stringify(L44));
  assert('L44 isLabBench = true', L44.isLab === true);
  assert('L44 lab HUD visible', L44.labHud === true);
  assert('L44 constraint chip 1 populated', !!L44.constraintChip, `text=${L44.constraintChip}`);
  // L44 composite may have 1 or 2 chips depending on definition
  assert('L44 budget chip visible', L44.budgetChip === true);

  // Day 84 / Day 94 enforce: try over-budget submission rejected
  const labRejection = await evalExpr(`
    (() => {
      // Build a hypothetical violating submission using internal validator
      // For L44 with hardCap=6, pretend we have 7 NAND gates
      const game = window.game;
      const fake = { gates: Array.from({length:7}, ()=>({type:'NAND'})) };
      const real = game.gates;
      try {
        game.gates = fake.gates;
        const r = game._validateLabConstraints();
        game.gates = real;
        return r;
      } catch(e) { game.gates = real; return { error: String(e) }; }
    })()
  `);
  assert('L44 validator rejects 7-gate submission', labRejection && labRejection.ok === false && /cap/i.test(labRejection.message || ''), JSON.stringify(labRejection));

  // ──────────────────────────────────────────────────────────────
  // P5 Cycle-4 invariants
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P5 Cycle-4 invariants ---');
  await clearAndReload();

  // Day 103 Cut #1: LO-1 fix — UI.showScreen owns HUD cleanup
  const lo1 = await evalExpr(`
    (async () => {
      // Enter Blitz directly, then call ui.showScreen('level-select') (bypass path)
      window.game.startBlitz && window.game.startBlitz();
      await new Promise(r => setTimeout(r, 250));
      const blitzMode = !!window.game.blitzMode;
      const blitzHudPre = (() => { const e = document.getElementById('blitz-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      window.game.ui.showScreen('level-select');
      await new Promise(r => setTimeout(r, 200));
      const blitzModeAfter = !!window.game.blitzMode;
      const blitzHudAfter = (() => { const e = document.getElementById('blitz-hud'); return !!e && getComputedStyle(e).display !== 'none'; })();
      return { blitzMode, blitzHudPre, blitzModeAfter, blitzHudAfter };
    })()
  `, true);
  assert('LO-1 fix: bypass path cleans blitzMode', lo1.blitzModeAfter === false, JSON.stringify(lo1));
  assert('LO-1 fix: bypass path hides blitz HUD', lo1.blitzHudAfter === false, JSON.stringify(lo1));

  await clearAndReload();

  // Day 103 Cut #2: Tournament label compression — backend.describe()
  const tournamentLabel = await evalExpr(`
    (() => {
      const backend = window.game.tournamentBackend;
      const describe = backend && backend.describe();
      const mode = backend && backend.getMode();
      return { describe, mode };
    })()
  `);
  assert('Tournament backend mode = local', tournamentLabel.mode === 'local', JSON.stringify(tournamentLabel));
  assert('Tournament label compressed (<=30 chars)', (tournamentLabel.describe || '').length <= 30, `len=${(tournamentLabel.describe || '').length} text="${tournamentLabel.describe}"`);
  assert("Tournament label starts '🏠 Local'", /🏠 Local/.test(tournamentLabel.describe || ''), tournamentLabel.describe);

  // Day 103 Cut #3: Stats default-to-Cards when non-empty
  const statsDefault = await evalExpr(`
    (() => {
      // Cold: library empty → default Overview
      const btn = document.getElementById('stats-btn');
      btn && btn.click();
      const activeTab = document.querySelector('#stats-modal .stats-tab.active') || document.querySelector('.stats-tab.active');
      const initialTabId = activeTab && (activeTab.id || '');
      // close
      const closeBtn = document.getElementById('stats-close');
      closeBtn && closeBtn.click();
      return { initialTabId };
    })()
  `);
  assert('Stats cold default tab = overview (empty library)', /overview/.test(statsDefault.initialTabId || ''), JSON.stringify(statsDefault));

  // Day 103 Cut #5: #lab-budget in separate row (not in constraint chip strip)
  await evalExpr(`window.game.startLevel(44)`);
  await sleep(300);
  const labHudRows = await evalExpr(`
    (() => {
      const hud = document.getElementById('lab-hud');
      const rows = hud ? hud.querySelectorAll('.lab-hud-row').length : 0;
      const budgetInRow = (() => {
        const b = document.getElementById('lab-budget');
        if (!b) return false;
        const row = b.closest('.lab-hud-row');
        if (!row) return false;
        return !row.contains(document.getElementById('lab-constraint'));
      })();
      return { rows, budgetInOwnRow: budgetInRow };
    })()
  `);
  assert('Lab HUD has 2 .lab-hud-row containers (Day 103 #5)', labHudRows.rows === 2, JSON.stringify(labHudRows));
  assert('Lab budget chip in its own row (Day 103 #5)', labHudRows.budgetInOwnRow === true);

  await clearAndReload();

  // Day 104 Cut #2: Gameplay section in settings modal
  const settingsSections = await evalExpr(`
    (() => {
      const btn = document.getElementById('open-settings-btn');
      btn && btn.click();
      return new Promise(r => setTimeout(() => {
        const sections = Array.from(document.querySelectorAll('#settings-modal .settings-section'));
        const headings = sections.map(s => {
          const h = s.querySelector('.settings-section-title, .section-title, h3, h4');
          return h ? h.textContent.trim() : '(none)';
        });
        const diffBtnInGameplay = (() => {
          const diff = document.getElementById('difficulty-mode-btn');
          if (!diff) return false;
          const sec = diff.closest('.settings-section');
          if (!sec) return false;
          const h = sec.querySelector('.settings-section-title, .section-title, h3, h4');
          return h && /gameplay/i.test(h.textContent);
        })();
        // close modal
        const close = document.getElementById('settings-close');
        close && close.click();
        r({ count: sections.length, headings, diffBtnInGameplay });
      }, 700));
    })()
  `, true);
  // 6 sections in DOM (Developer is debug-hidden by default but still in DOM)
  assert('Settings modal sections in canonical order', settingsSections.count >= 5 && settingsSections.headings.slice(0,5).join('|') === 'Display & Accessibility|Gameplay|Audio|Notifications|Data', JSON.stringify(settingsSections));
  assert('Difficulty Mode filed under Gameplay (Day 104 #2)', settingsSections.diffBtnInGameplay === true);

  // Day 105 Polish #1: settingsSectionFadeIn keyframe present
  const day105Polish = await evalExpr(`
    (() => {
      let hasFadeIn = false;
      let hasStatsTabOpacity = false;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.type === CSSRule.KEYFRAMES_RULE && /settingsSectionFadeIn/.test(rule.name)) hasFadeIn = true;
            if (rule.selectorText && /\\.stats-tab/.test(rule.selectorText) && /opacity/.test((rule.style && rule.style.transition) || '')) hasStatsTabOpacity = true;
          }
        } catch(e){}
      }
      return { hasFadeIn, hasStatsTabOpacity };
    })()
  `);
  assert('settingsSectionFadeIn keyframe present (Day 105 #1)', day105Polish.hasFadeIn === true);

  // ──────────────────────────────────────────────────────────────
  // P6 Day-79 dead-id regression
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P6 Day-79 dead-id regression ---');
  const deadIds = await evalExpr(`
    ({
      showFirstLaunchDifficultyModal: typeof (window.game && window.game.ui && window.game.ui.showFirstLaunchDifficultyModal),
      checkLightning: typeof (window.AchievementManager && window.AchievementManager.prototype && window.AchievementManager.prototype.checkLightning),
      checkEclipseRun: typeof (window.AchievementManager && window.AchievementManager.prototype && window.AchievementManager.prototype.checkEclipseRun),
      checkArchitect: typeof (window.AchievementManager && window.AchievementManager.prototype && window.AchievementManager.prototype.checkArchitect),
      isMythic: typeof (window.AchievementManager && window.AchievementManager.prototype && window.AchievementManager.prototype.isMythic),
      showHud: typeof (window.InfiniteRunManager && window.InfiniteRunManager.prototype && window.InfiniteRunManager.prototype._showHud),
      getCurrentStep: typeof (window.InteractiveTutorial && window.InteractiveTutorial.prototype && window.InteractiveTutorial.prototype.getCurrentStep),
      weeklyPuzzleDom: !!document.getElementById('weekly-puzzle-btn'),
    })
  `);
  assert('showFirstLaunchDifficultyModal undefined', deadIds.showFirstLaunchDifficultyModal === 'undefined');
  assert('checkLightning undefined', deadIds.checkLightning === 'undefined');
  assert('checkEclipseRun undefined', deadIds.checkEclipseRun === 'undefined');
  assert('checkArchitect undefined', deadIds.checkArchitect === 'undefined');
  assert('isMythic undefined', deadIds.isMythic === 'undefined');
  assert('_showHud undefined', deadIds.showHud === 'undefined');
  assert('getCurrentStep undefined', deadIds.getCurrentStep === 'undefined');
  assert('#weekly-puzzle-btn DOM absent', deadIds.weeklyPuzzleDom === false);

  // ──────────────────────────────────────────────────────────────
  // P7 Console hygiene
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- P7 Console hygiene ---');
  assert('0 console.error', consoleErrors.length === 0, `count=${consoleErrors.length} :: ${consoleErrors.slice(0, 3).join(' | ')}`);
  assert('0 Runtime.exceptionThrown', exceptions.length === 0, `count=${exceptions.length} :: ${exceptions.slice(0, 3).join(' | ')}`);

  // ──────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log(`\n=== Result: ${passed}/${results.length} assertions passed ===`);
  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach(f => console.log(`  ❌ ${f.name} :: ${f.detail || ''}`));
  }

  ws.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('Harness error:', e);
  try { ws && ws.close(); } catch(_) {}
  process.exit(2);
});
