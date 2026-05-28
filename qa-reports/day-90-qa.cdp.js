#!/usr/bin/env node
/**
 * Day 90 QA harness — Cycle 3 HARDEN Week, Day 4: "Fix Everything".
 *
 * Open Bugs queue is empty at start of day (has been since Day 76).
 * LO-1 latent observation is explicitly tagged as future Polish/Prune Week
 * fix in BUGS.md, so HARDEN policy says: don't ship code today.
 *
 * This is the "Fix Day: nothing to fix" confirmation probe per FACTORY_STATE
 * nextCycle plan, shape (1).
 *
 * Coverage: a tight 10-phase confirmation sweep (not the full Day 89 stress
 * suite — that ran clean yesterday and the build has not changed).
 *
 *   P1  build identity unchanged (?v=1780156800 / sw v60)
 *   P2  cold-start surface (2 buttons, 43 cards, silent-default)
 *   P3  Day 89 stress invariants — RUN/Quick Test spam still no-throw
 *   P4  Day 84 Lab Bench II L42 hard-cap validator still rejects 5 gates
 *   P5  Day 83 Tournament backend still reports local mode + describe label
 *   P6  Day 85 onboarding default variant still 'silent-standard'
 *   P7  Day 78 staircase end-game still 18 nav + 40 overflow at seed=40
 *   P8  Day 79 dead-identifier regression still holds (7 undefined + DOM)
 *   P9  LO-1 latent observation re-verified non-user-reachable
 *   P10 0 console errors across entire probe
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-90-qa.cdp.js
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
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
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
    expression,
    returnByValue: true,
    awaitPromise: true,
    timeout: 10000,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate threw: ${result.exceptionDetails.text} :: ${expression.slice(0, 200)}`);
  }
  return result.result && result.result.value;
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const targets = await getJSON('/json/list');
  let target = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) throw new Error('No CDP page target found');
  console.log(`[cdp] target: ${target.url}`);

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

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
  // wait for app boot + level-select render
  await wait(2500);

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ---- P1: build identity ----
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — single ?v=1780156800', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1780156800', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swReg = await evaluate(ws, `(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active);
  })()`);
  assert('P1.c — SW active', swReg === true);

  // ---- P2: cold-start surface ----
  const coldStart = await evaluate(ws, `(() => {
    const ls = document.getElementById('level-select-screen');
    if (!ls) return { error: 'no level-select-screen' };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const nonLevelBtns = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const levelCards = [...ls.querySelectorAll('.level-btn')];
    const variant = window.__onboardingExperiment?.getVariant?.() || null;
    const diff = localStorage.getItem('signal-circuit-difficulty-mode');
    return {
      nonLevelBtnCount: nonLevelBtns.length,
      levelCardCount: levelCards.length,
      variant,
      diff,
    };
  })()`);
  assert('P2.a — 2 non-level buttons cold', coldStart.nonLevelBtnCount === 2, `got ${coldStart.nonLevelBtnCount}`);
  assert('P2.b — 43 level cards', coldStart.levelCardCount === 43, `got ${coldStart.levelCardCount}`);
  assert('P2.c — variant silent-standard', coldStart.variant === 'silent-standard', `got ${coldStart.variant}`);
  assert('P2.d — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ---- P3: Day 89 stress invariants ----
  const stress = await evaluate(ws, `(async () => {
    const gs = window.game;
    if (!gs) return { error: 'no window.game' };
    // need to be on a level for runSimulation to make sense
    gs.loadLevel(1);
    await new Promise(r => setTimeout(r, 250));
    let runThrew = 0, qtThrew = 0;
    for (let i = 0; i < 10; i++) {
      try { gs.runSimulation(); } catch (e) { runThrew++; }
    }
    for (let i = 0; i < 10; i++) {
      try { gs.runQuickTest(); } catch (e) { qtThrew++; }
    }
    return { runThrew, qtThrew };
  })()`);
  assert('P3.a — RUN spam 10× no-throw', stress.runThrew === 0, `threw ${stress.runThrew}`);
  assert('P3.b — Quick Test spam 10× no-throw', stress.qtThrew === 0, `threw ${stress.qtThrew}`);

  // ---- P4: Day 84 L42 hard-cap validator still rejects 5 gates ----
  const labCap = await evaluate(ws, `(() => {
    const gs = window.game;
    gs.loadLevel(42);
    const lvl = gs.currentLevel;
    if (!lvl || lvl.gateHardCap !== 4) return { error: 'L42 not loaded or hardCap wrong', gateHardCap: lvl && lvl.gateHardCap };
    // probe validator
    gs.gates = new Array(5).fill(0).map((_, i) => ({ type: 'AND', x: 50 + i*30, y: 100 }));
    const overCap = gs._validateLabConstraints();
    gs.gates = new Array(4).fill(0).map((_, i) => ({ type: 'AND', x: 50 + i*30, y: 100 }));
    const underCap = gs._validateLabConstraints();
    return { overCapOk: overCap.ok, overCapMsg: overCap.message, underCapOk: underCap.ok };
  })()`);
  assert('P4.a — L42 validator rejects 5 gates', labCap.overCapOk === false, `msg=${labCap.overCapMsg}`);
  assert('P4.b — L42 validator accepts 4 gates', labCap.underCapOk === true, `underCapOk=${labCap.underCapOk}`);

  // ---- P5: Day 83 Tournament backend ----
  const tournament = await evaluate(ws, `(() => {
    const b = window.game?.tournamentBackend;
    if (!b) return { error: 'no tournamentBackend' };
    return { mode: b.getMode(), describe: b.describe(), isLive: b.isLive() };
  })()`);
  assert('P5.a — Tournament getMode local', tournament.mode === 'local', `mode=${tournament.mode}`);
  assert('P5.b — Tournament describe local label', /Local leaderboard/.test(tournament.describe || ''), `describe=${tournament.describe}`);
  assert('P5.c — Tournament isLive false', tournament.isLive === false);

  // ---- P6: Day 85 onboarding default variant ----
  const onboard = await evaluate(ws, `(() => {
    const oe = window.__onboardingExperiment;
    if (!oe) return { error: 'no __onboardingExperiment' };
    const counters = oe.getCounters();
    return { variant: oe.getVariant(), countersOk: typeof counters === 'object' && counters !== null };
  })()`);
  assert('P6.a — default variant silent-standard', onboard.variant === 'silent-standard');
  assert('P6.b — counters JSON-serializable object', onboard.countersOk === true);

  // ---- P7: Day 78 staircase end-game seed=40 ----
  const endgame = await evaluate(ws, `(() => {
    const gs = window.game;
    gs.seedProgress(40, { stars: 3 });
    const ls = document.getElementById('level-select-screen');
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const navBtns = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const overflowBtns = [...ls.querySelectorAll('.level-overflow-btn')];
    return { navCount: navBtns.length, overflowCount: overflowBtns.length };
  })()`);
  assert('P7.a — 18 nav buttons at end-game', endgame.navCount === 18, `got ${endgame.navCount}`);
  assert('P7.b — 40 overflow buttons at end-game', endgame.overflowCount === 40, `got ${endgame.overflowCount}`);

  // ---- P8: Day 79 dead-identifier regression ----
  const deadIds = await evaluate(ws, `(() => {
    const ui = window.game?.ui;
    const am = window.game?.achievementManager;
    const ir = window.game?.infiniteRun;
    const tut = window.game?.interactiveTutorial;
    return {
      showFirstLaunchDifficultyModal: typeof ui?.showFirstLaunchDifficultyModal,
      checkLightning: typeof am?.checkLightning,
      checkEclipseRun: typeof am?.checkEclipseRun,
      checkArchitect: typeof am?.checkArchitect,
      isMythic: typeof am?.isMythic,
      irShowHud: typeof ir?._showHud,
      tutGetCurrentStep: typeof tut?.getCurrentStep,
      weeklyBtn: !!document.getElementById('weekly-puzzle-btn'),
    };
  })()`);
  const allDead = Object.entries(deadIds).every(([k, v]) => k === 'weeklyBtn' ? v === false : v === 'undefined');
  assert('P8.a — all 7 dead identifiers undefined + #weekly-puzzle-btn DOM absent', allDead, JSON.stringify(deadIds));

  // ---- P9: LO-1 re-verification ----
  // The LO-1 latent observation says: calling ui.showScreen('level-select') DIRECTLY
  // (bypassing GameState.showLevelSelect) leaves speedrun HUD visible.
  // BUT all user paths go through GameState.showLevelSelect (back-btn handler).
  // We re-verify both today.
  const lo1 = await evaluate(ws, `(async () => {
    const gs = window.game;
    // Enter Speedrun mode
    const srBtn = document.getElementById('speedrun-btn');
    if (!srBtn) return { error: 'no #speedrun-btn — try seedProgress first' };
    // start speedrun directly
    gs.startSpeedrunMode();
    await new Promise(r => setTimeout(r, 200));
    const before = {
      speedrunMode: !!gs.speedrunMode,
      hudVisible: getComputedStyle(document.getElementById('speedrun-hud')).display,
    };

    // path 1: user-reachable — back-btn → GameState.showLevelSelect (the wrapper)
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const afterUserPath = {
      speedrunMode: !!gs.speedrunMode,
      hudVisible: getComputedStyle(document.getElementById('speedrun-hud')).display,
    };

    // re-enter speedrun
    gs.startSpeedrunMode();
    await new Promise(r => setTimeout(r, 200));

    // path 2: bypass wrapper (LO-1)
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 200));
    const afterBypassPath = {
      speedrunMode: !!gs.speedrunMode,
      hudVisible: getComputedStyle(document.getElementById('speedrun-hud')).display,
    };

    return { before, afterUserPath, afterBypassPath };
  })()`);
  assert('P9.a — user back-btn path cleans HUD (Day 74 fix intact)', lo1.afterUserPath && lo1.afterUserPath.speedrunMode === false && lo1.afterUserPath.hudVisible === 'none', JSON.stringify(lo1.afterUserPath));
  assert('P9.b — LO-1 reproducible: bypass path leaves HUD visible (code-smell only, not user-reachable)', lo1.afterBypassPath && (lo1.afterBypassPath.speedrunMode === true || lo1.afterBypassPath.hudVisible === 'flex'), JSON.stringify(lo1.afterBypassPath));

  // ---- P10: 0 console errors / exceptions ----
  assert('P10.a — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, JSON.stringify(runtimeExceptions));
  assert('P10.b — 0 console.error', consoleErrors.length === 0, JSON.stringify(consoleErrors));

  // ---- summary ----
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 90 CONFIRMATION PROBE ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${runtimeExceptions.length} runtime exceptions`);
  console.log(`${consoleErrors.length} console.error calls`);
  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
