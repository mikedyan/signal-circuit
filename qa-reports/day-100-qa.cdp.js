#!/usr/bin/env node
/**
 * Day 100 QA harness — Cycle 4 HARDEN Week, Day 4: "Fix Everything".
 *
 * Open Bugs queue is empty at start of day (has been since Day 76 — 24-day streak
 * as of Day 99). LO-1 latent observation is explicitly deferred to Cycle 4 PRUNE
 * Week per roadmaps/cycle-4-build.md § Week Guardrails, so HARDEN policy says:
 * don't ship code today. This is the "Fix Day: nothing to fix" confirmation probe
 * shape — Day 90 precedent applied to Cycle 4 artifacts.
 *
 * Coverage: a tight confirmation sweep (NOT the Day 99 stress suite — that ran
 * clean yesterday and the build has not changed since Day 96).
 *
 *   P1  build identity unchanged (?v=1780617600 / sw v65)
 *   P2  cold-start surface (2 non-level buttons, 45 cards, silent-default)
 *   P3  Day 99 stress invariants — RUN/Quick Test spam still no-throw
 *   P4  Day 94 Lab Bench II L44 composite validator still rejects 7 NAND
 *       (hard cap 6) + L45 composite (cap 5 + XOR-mandate) emits both clauses
 *   P5  Day 83/93 Tournament backend still local + describe label live
 *   P6  Day 85/95 onboarding default variant + readout debug-gating
 *   P7  Day 78 staircase end-game still 18 nav + 45 overflow at seed=45
 *   P8  Day 79 dead-identifier regression still holds (7 undefined + DOM)
 *   P9  Day 92 ES module + Day 96 snapshot card library health
 *   P10 LO-1 latent observation re-verified non-user-reachable
 *   P11 0 console errors across entire probe
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-100-qa.cdp.js
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
  await wait(2800);

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
  assert('P1.b — single ?v=1780617600', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1780617600', `unified=${JSON.stringify(buildIdentity.unified)}`);

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
  assert('P2.b — 45 level cards (post-Day-94)', coldStart.levelCardCount === 45, `got ${coldStart.levelCardCount}`);
  assert('P2.c — variant silent-standard', coldStart.variant === 'silent-standard', `got ${coldStart.variant}`);
  assert('P2.d — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ---- P3: Day 99 stress invariants ----
  const stress = await evaluate(ws, `(async () => {
    const gs = window.game;
    if (!gs) return { error: 'no window.game' };
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

  // ---- P4: Day 94 Lab Bench II composite constraints (NEW for Cycle 4) ----
  const labComposite = await evaluate(ws, `(() => {
    const gs = window.game;
    // L44 — composite: NAND-only (toolbox-level) + gateHardCap 6
    gs.loadLevel(44);
    const l44 = gs.currentLevel;
    if (!l44) return { error: 'L44 not loaded' };
    const l44Cap = l44.gateHardCap;
    // Validator (caps + mustInclude) only — NAND-only is toolbox-level.
    gs.gates = new Array(7).fill(0).map((_, i) => ({ type: 'NAND', x: 50 + i*30, y: 100 }));
    const l44Over = gs._validateLabConstraints();
    gs.gates = new Array(6).fill(0).map((_, i) => ({ type: 'NAND', x: 50 + i*30, y: 100 }));
    const l44Under = gs._validateLabConstraints();

    // L45 — composite: must include XOR + gateHardCap 5
    gs.loadLevel(45);
    const l45 = gs.currentLevel;
    const l45Cap = l45.gateHardCap;
    const l45Must = JSON.stringify(l45.mustIncludeGate);
    // 6 ANDs → cap violation AND missing-XOR violation; both clauses in one string.
    gs.gates = new Array(6).fill(0).map((_, i) => ({ type: 'AND', x: 50 + i*30, y: 100 }));
    const l45Both = gs._validateLabConstraints();
    // 4 gates including an XOR → ok.
    gs.gates = [
      { type: 'XOR', x: 100, y: 100 },
      { type: 'AND', x: 130, y: 100 },
      { type: 'OR', x: 160, y: 100 },
    ];
    const l45Ok = gs._validateLabConstraints();

    return {
      l44Cap, l44OverOk: l44Over.ok, l44OverMsg: l44Over.message, l44UnderOk: l44Under.ok,
      l45Cap, l45Must, l45BothOk: l45Both.ok, l45BothMsg: l45Both.message, l45Ok: l45Ok.ok,
    };
  })()`);
  assert('P4.a — L44 hardCap=6', labComposite.l44Cap === 6, `got ${labComposite.l44Cap}`);
  assert('P4.b — L44 validator rejects 7 NAND', labComposite.l44OverOk === false && /7 gates exceeds hard cap of 6/.test(labComposite.l44OverMsg || ''), `msg=${labComposite.l44OverMsg}`);
  assert('P4.c — L44 validator accepts 6 NAND', labComposite.l44UnderOk === true, `underOk=${labComposite.l44UnderOk}`);
  assert('P4.d — L45 hardCap=5', labComposite.l45Cap === 5, `got ${labComposite.l45Cap}`);
  assert('P4.e — L45 mustIncludeGate XOR', labComposite.l45Must === '["XOR"]', `got ${labComposite.l45Must}`);
  assert('P4.f — L45 composite rejects 6 ANDs with both clauses', labComposite.l45BothOk === false && /exceeds hard cap of 5/.test(labComposite.l45BothMsg || '') && /XOR gate/.test(labComposite.l45BothMsg || ''), `msg=${labComposite.l45BothMsg}`);
  assert('P4.g — L45 validator accepts XOR-containing 3-gate solve', labComposite.l45Ok === true, `ok=${labComposite.l45Ok}`);

  // ---- P5: Day 83 Tournament backend ----
  const tournament = await evaluate(ws, `(() => {
    const b = window.game?.tournamentBackend;
    if (!b) return { error: 'no tournamentBackend' };
    const factoryExists = typeof window.selectTournamentBackend === 'function';
    const localAdapterExists = typeof window.LocalTournamentAdapter === 'function';
    const remoteAdapterExists = typeof window.RemoteTournamentAdapter === 'function';
    return {
      mode: b.getMode(),
      describe: b.describe(),
      isLive: b.isLive(),
      factoryExists, localAdapterExists, remoteAdapterExists,
    };
  })()`);
  assert('P5.a — Tournament getMode local', tournament.mode === 'local', `mode=${tournament.mode}`);
  assert('P5.b — Tournament describe local label', /Local leaderboard/.test(tournament.describe || ''), `describe=${tournament.describe}`);
  assert('P5.c — Tournament isLive false', tournament.isLive === false);
  assert('P5.d — selectTournamentBackend factory exposed', tournament.factoryExists === true);
  assert('P5.e — Local + Remote adapters exposed', tournament.localAdapterExists === true && tournament.remoteAdapterExists === true);

  // ---- P6: Day 85 onboarding + Day 95 readout debug-gating ----
  const onboard = await evaluate(ws, `(() => {
    const oe = window.__onboardingExperiment;
    if (!oe) return { error: 'no __onboardingExperiment' };
    const counters = oe.getCounters();
    // Debug section is hidden by default; opening Settings without flag should keep it hidden.
    localStorage.removeItem('signal-circuit-debug');
    const settingsBtn = document.getElementById('open-settings-btn');
    settingsBtn?.click();
    const devSection = document.getElementById('settings-developer-section');
    const hiddenDefault = devSection ? getComputedStyle(devSection).display === 'none' : null;
    document.getElementById('settings-close')?.click();

    // With flag set, dev section should become visible.
    localStorage.setItem('signal-circuit-debug', '1');
    settingsBtn?.click();
    const visibleWithFlag = devSection ? getComputedStyle(devSection).display !== 'none' : null;
    document.getElementById('settings-close')?.click();
    localStorage.removeItem('signal-circuit-debug');

    return {
      variant: oe.getVariant(),
      countersOk: typeof counters === 'object' && counters !== null,
      devSectionExists: !!devSection,
      hiddenDefault,
      visibleWithFlag,
    };
  })()`);
  assert('P6.a — default variant silent-standard', onboard.variant === 'silent-standard');
  assert('P6.b — counters JSON-serializable object', onboard.countersOk === true);
  assert('P6.c — developer section DOM exists', onboard.devSectionExists === true);
  assert('P6.d — developer section hidden when debug flag absent', onboard.hiddenDefault === true, `hiddenDefault=${onboard.hiddenDefault}`);
  assert('P6.e — developer section visible when debug flag set', onboard.visibleWithFlag === true, `visibleWithFlag=${onboard.visibleWithFlag}`);

  // ---- P7: Day 78 staircase end-game seed=45 (post-Day-94) ----
  const endgame = await evaluate(ws, `(() => {
    const gs = window.game;
    gs.seedProgress(45, { stars: 3 });
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
  assert('P7.b — 45 overflow buttons at end-game (post-Day-94)', endgame.overflowCount === 45, `got ${endgame.overflowCount}`);

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

  // ---- P9: Day 92 ES module + Day 96 snapshot card library ----
  const cycle4Health = await evaluate(ws, `(() => {
    // Day 92: ES module exports rebound to window
    const gateType = typeof window.Gate;
    const ioNodeType = typeof window.IONode;
    const gateTypesKeys = window.GateTypes ? Object.keys(window.GateTypes).sort() : null;
    const roundRectType = typeof window.roundRect;

    // Day 96: snapshot card library API + cap
    const gs = window.game;
    const libBefore = gs.getCardLibrary().length;
    // Push 3 fake cards; cap is 20; library should grow to libBefore+3 (or stay capped).
    for (let i = 0; i < 3; i++) {
      gs.addSnapshotCard({
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        title: 'probe',
        text: 'probe',
        fileName: 'probe.png',
      });
    }
    const libAfter = gs.getCardLibrary().length;
    gs.resetCardLibrary();
    const libCleared = gs.getCardLibrary().length;

    return {
      gateType, ioNodeType, gateTypesKeys, roundRectType,
      libBefore, libAfter, libCleared,
    };
  })()`);
  assert('P9.a — window.Gate is function (Day 92)', cycle4Health.gateType === 'function', `got ${cycle4Health.gateType}`);
  assert('P9.b — window.IONode is function (Day 92)', cycle4Health.ioNodeType === 'function', `got ${cycle4Health.ioNodeType}`);
  assert('P9.c — window.GateTypes has 8 expected keys', JSON.stringify(cycle4Health.gateTypesKeys) === '["AND","MYSTERY","MYSTERY3","NAND","NOR","NOT","OR","XOR"]', `got ${JSON.stringify(cycle4Health.gateTypesKeys)}`);
  assert('P9.d — window.roundRect is function (Day 92)', cycle4Health.roundRectType === 'function', `got ${cycle4Health.roundRectType}`);
  assert('P9.e — card library accepts add (Day 96)', cycle4Health.libAfter === Math.min(cycle4Health.libBefore + 3, 20), `before=${cycle4Health.libBefore} after=${cycle4Health.libAfter}`);
  assert('P9.f — resetCardLibrary wipes library', cycle4Health.libCleared === 0, `cleared=${cycle4Health.libCleared}`);

  // ---- P10: LO-1 re-verification ----
  const lo1 = await evaluate(ws, `(async () => {
    const gs = window.game;
    const srBtn = document.getElementById('speedrun-btn');
    if (!srBtn) return { error: 'no #speedrun-btn' };
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
  assert('P10.a — user back-btn path cleans HUD (Day 74 fix intact)', lo1.afterUserPath && lo1.afterUserPath.speedrunMode === false && lo1.afterUserPath.hudVisible === 'none', JSON.stringify(lo1.afterUserPath));
  assert('P10.b — LO-1 reproducible: bypass path leaves HUD visible (code-smell only, not user-reachable)', lo1.afterBypassPath && (lo1.afterBypassPath.speedrunMode === true || lo1.afterBypassPath.hudVisible === 'flex'), JSON.stringify(lo1.afterBypassPath));

  // ---- P11: 0 console errors / exceptions ----
  assert('P11.a — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, JSON.stringify(runtimeExceptions));
  assert('P11.b — 0 console.error', consoleErrors.length === 0, JSON.stringify(consoleErrors));

  // ---- summary ----
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 100 CONFIRMATION PROBE ===`);
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
