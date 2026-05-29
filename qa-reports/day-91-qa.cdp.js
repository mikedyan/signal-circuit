#!/usr/bin/env node
/**
 * Day 91 QA harness — Cycle 3 HARDEN Week, Day 5: "Regression Pass".
 *
 * Per the HARDEN-Week-Day-5 prompt:
 *   1. Open deployed site (wait for Pages to deploy latest)
 *   2. Quick-test: load level, place gates, draw wires, run sim, complete level
 *   3. Test all modes (we cover all 8: campaign, daily, random, blitz, speedrun,
 *      sandbox, tournament, infinite)
 *   4. Verify console is clean
 *   5. Final commit if anything needed
 *
 * Build under test: deployed https://mikedyan.github.io/signal-circuit/
 * Expected identity: ?v=1780156800 / sw v60 (Day 86 build, unchanged through
 * Day 87/88/89/90 HARDEN week).
 *
 * Coverage: 14-phase regression sweep across the deployed build.
 *
 *   P1  build identity on deployed site (?v=1780156800 / sw v60)
 *   P2  cold-start surface (2 buttons, 43 cards, silent-default)
 *   P3  core loop end-to-end on L1 — load → solve via runQuickTest → complete
 *   P4  campaign progression — L1 completion persists, L2 unlocked
 *   P5  Daily Challenge mode (#daily-challenge-btn → daily-config-screen)
 *   P6  Random Challenge mode (#random-challenge-btn → challenge-config-screen)
 *   P7  Blitz Mode (#blitz-mode-btn) + back-btn HUD cleanup (Day 61 fix)
 *   P8  Speedrun Mode (#speedrun-btn) + back-btn HUD cleanup (Day 74 fix)
 *   P9  Sandbox config screen (#sandbox-btn → sandbox-config-screen)
 *   P10 Tournament Mode (#tournament-btn — Day 72 + Day 83 adapter)
 *   P11 Infinite Mode (#infinite-mode-btn — Day 68)
 *   P12 Day 84 Lab Bench II L42 hard-cap validator regression
 *   P13 Day 78 staircase end-game (40 overflow + 18 nav at seed=40)
 *   P14 0 console errors across entire sweep
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-91-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'https://mikedyan.github.io/signal-circuit/?_ts=' + Date.now();

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
        try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
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
    timeout: 15000,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate threw: ${result.exceptionDetails.text} :: ${expression.slice(0, 200)}`);
  }
  return result.result && result.result.value;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// SCREEN_HELPERS is a string that gets prepended to each evaluate to give us
// a stable cross-screen visibility helper (screens are toggled via display,
// not via a .active class — confirmed by reading the deployed ui.js).
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
  await wait(5000); // deployed site needs more boot time than localhost

  // Force-clean session: localStorage may persist across CDP sessions in the
  // headless profile. Wipe app state + reload so cold-start checks (P2) and
  // tier-gated probes (P5/P10/P11) start from zero.
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_clean' });
  await wait(5000);

  // Drain any console errors raised during the dirty pre-clean load so they
  // don't pollute P14.
  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ---- P1: build identity on deployed site ----
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — on deployed host (mikedyan.github.io)', buildIdentity.host === 'mikedyan.github.io', `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=1780156800', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1780156800', `unified=${JSON.stringify(buildIdentity.unified)}`);

  // SW may not be controlling the page on first deployed-site hit (headless
  // race condition: SW finishes activating after page already loaded). Probe
  // via navigator.serviceWorker.ready — that promise resolves when *any*
  // registration becomes ready, even if not yet controlling the current page.
  // Day 88/89 verified the v60 SW is shipped and precaches 27 assets.
  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, len: text.length, hasV60: text.indexOf('signal-circuit-v60') >= 0, head: text.slice(0, 80) };
    } catch (e) {
      return { swFetched: false, error: String(e) };
    }
  })()`);
  assert('P1.d — sw.js deployed with CACHE_NAME=signal-circuit-v60', swProbe.swFetched === true && swProbe.hasV60 === true, JSON.stringify(swProbe));

  // ---- P2: cold-start surface ----
  const coldStart = await evaluate(ws, `(() => {
    ${SCREEN_HELPERS}
    const ls = document.getElementById('level-select-screen');
    if (!ls) return { error: 'no level-select-screen' };
    const nonLevelBtns = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const levelCards = [...ls.querySelectorAll('.level-btn')];
    const variant = window.__onboardingExperiment?.getVariant?.() || null;
    const diff = localStorage.getItem('signal-circuit-difficulty-mode');
    return {
      onLevelSelect: screenVisible('level-select-screen'),
      nonLevelBtnCount: nonLevelBtns.length,
      nonLevelBtnIds: nonLevelBtns.map(b => b.id),
      levelCardCount: levelCards.length,
      variant,
      diff,
    };
  })()`);
  assert('P2.a — level-select screen visible', coldStart.onLevelSelect === true);
  assert('P2.b — 2 non-level buttons cold', coldStart.nonLevelBtnCount === 2, `got ${coldStart.nonLevelBtnCount}: ${JSON.stringify(coldStart.nonLevelBtnIds)}`);
  assert('P2.c — 43 level cards', coldStart.levelCardCount === 43, `got ${coldStart.levelCardCount}`);
  assert('P2.d — variant silent-standard', coldStart.variant === 'silent-standard', `got ${coldStart.variant}`);
  assert('P2.e — difficulty silent-default standard', coldStart.diff === 'standard', `got ${coldStart.diff}`);

  // ---- P3: core loop end-to-end on L1 ----
  const coreLoop = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.startLevel(1);
    await new Promise(r => setTimeout(r, 600));
    // Capture gameplay-screen state BEFORE solving (solve will move us away)
    const onGameplay = screenVisible('gameplay-screen');
    const runBtnVisible = visible(document.getElementById('run-btn'));
    const ttRows = document.querySelectorAll('#truth-table tbody tr').length;
    // Use gs.addGate() + gs.addWireFromData() (documented public APIs)
    const g = gs.addGate('AND', 400, 300);
    if (!g) return { error: 'addGate returned null', onGameplay, runBtnVisible, ttRows };
    const inA = gs.inputNodes[0], inB = gs.inputNodes[1], outN = gs.outputNodes[0];
    if (!inA || !inB || !outN) return { error: 'missing io nodes', inN: gs.inputNodes?.length, outN: gs.outputNodes?.length };
    gs.addWireFromData(inA.id, 0, g.id, 0);
    gs.addWireFromData(inB.id, 0, g.id, 1);
    gs.addWireFromData(g.id, 0, outN.id, 0);
    const gateCount = gs.gates.length;
    const wireCount = gs.wireManager.wires.length;
    gs.runQuickTest();
    await new Promise(r => setTimeout(r, 700));
    const after = gs.progress.levels;
    const l1 = after['1'];
    return { onGameplay, runBtnVisible, ttRows, gateCount, wireCount, l1Stars: l1?.stars ?? null, l1Recorded: !!l1 };
  })()`);
  assert('P3.a — gameplay screen visible on L1 load', coreLoop.onGameplay === true, JSON.stringify(coreLoop));
  assert('P3.b — RUN button visible', coreLoop.runBtnVisible === true);
  assert('P3.c — 4 truth-table rows (2-input)', coreLoop.ttRows === 4, `got ${coreLoop.ttRows}`);
  assert('P3.d — 1 AND gate placed', coreLoop.gateCount === 1, `got ${coreLoop.gateCount}`);
  assert('P3.e — 3 wires drawn', coreLoop.wireCount === 3, `got ${coreLoop.wireCount}`);
  assert('P3.f — L1 progress recorded', coreLoop.l1Recorded === true, JSON.stringify(coreLoop));
  assert('P3.g — L1 stars ≥ 1', coreLoop.l1Stars !== null && coreLoop.l1Stars >= 1, `stars=${coreLoop.l1Stars}`);

  // ---- P4: campaign progression — L2 reachable after L1 ----
  const campaign = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 400));
    // Level cards use closure-bound levelId, not data-id. Find the L2 card
    // by .level-number text (matches the rendered '<span class="level-number">2</span>').
    const cards = [...document.querySelectorAll('.level-btn')];
    const l2Card = cards.find(b => {
      const n = b.querySelector('.level-number');
      return n && n.textContent.trim() === '2';
    });
    if (!l2Card) return { error: 'no L2 card', cardCount: cards.length };
    const locked = l2Card.classList.contains('locked');
    gs.startLevel(2);
    await new Promise(r => setTimeout(r, 500));
    return {
      l2Locked: locked,
      onGameplay: screenVisible('gameplay-screen'),
      currentLevelId: gs.currentLevel?.id,
    };
  })()`);
  assert('P4.a — L2 unlocked after L1 solve', campaign.l2Locked === false, `locked=${campaign.l2Locked}`);
  assert('P4.b — L2 loads on gameplay screen', campaign.onGameplay === true && campaign.currentLevelId === 2, JSON.stringify(campaign));

  // ---- P5: Daily Challenge ----
  const daily = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // seed for tier2 visibility (daily-challenge-btn unlocked at tier2)
    gs.seedProgress(12, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const dailyBtn = document.getElementById('daily-challenge-btn');
    if (!dailyBtn) return { error: 'no daily-challenge-btn' };
    if (!visible(dailyBtn)) return { error: 'daily-challenge-btn not visible after tier2 seed' };
    dailyBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const onPre = screenVisible('daily-config-screen');
    const startBtn = document.getElementById('start-daily-btn');
    if (startBtn) startBtn.click();
    await new Promise(r => setTimeout(r, 700));
    const onGameplay = screenVisible('gameplay-screen');
    const isDaily = !!gs.currentLevel?.isDaily;
    return { onPre, onGameplay, isDaily, startBtnExists: !!startBtn };
  })()`);
  assert('P5.a — Daily pre-screen opens', daily.onPre === true, JSON.stringify(daily));
  assert('P5.b — Daily Challenge loads gameplay with isDaily=true', daily.onGameplay === true && daily.isDaily === true, JSON.stringify(daily));

  // ---- P6: Random Challenge ----
  const random = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const btn = document.getElementById('random-challenge-btn');
    if (!btn) return { error: 'no random-challenge-btn' };
    if (!visible(btn)) return { error: 'random-challenge-btn not visible' };
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    const onConfig = screenVisible('challenge-config-screen');
    const genBtn = document.getElementById('generate-challenge-btn');
    if (genBtn) genBtn.click();
    await new Promise(r => setTimeout(r, 700));
    const onGameplay = screenVisible('gameplay-screen');
    const isChallenge = !!gs.isChallengeMode;
    return { onConfig, onGameplay, isChallenge };
  })()`);
  assert('P6.a — Random Challenge config opens', random.onConfig === true, JSON.stringify(random));
  assert('P6.b — Random Challenge generates and loads gameplay', random.onGameplay === true && random.isChallenge === true, JSON.stringify(random));

  // ---- P7: Blitz Mode + HUD cleanup ----
  const blitz = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // blitz-mode-btn is tier3-gated (g18). seedProgress to surface it.
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const btn = document.getElementById('blitz-mode-btn');
    if (!btn) return { error: 'no blitz-mode-btn' };
    if (!visible(btn)) return { error: 'blitz-mode-btn not visible' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const inBlitz = !!gs.blitzMode;
    const blitzHud = document.getElementById('blitz-hud');
    const hudVisible = blitzHud ? getComputedStyle(blitzHud).display : 'no-element';
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 400));
    const afterBlitz = !!gs.blitzMode;
    const afterHud = blitzHud ? getComputedStyle(blitzHud).display : 'no-element';
    return { inBlitz, hudVisible, afterBlitz, afterHud };
  })()`);
  assert('P7.a — Blitz mode entered (blitzMode=true)', blitz.inBlitz === true, JSON.stringify(blitz));
  assert('P7.b — Blitz HUD visible during mode', blitz.hudVisible !== 'none' && blitz.hudVisible !== 'no-element', `hudVisible=${blitz.hudVisible}`);
  assert('P7.c — Day 61 fix: Blitz HUD cleaned up on back', blitz.afterBlitz === false && blitz.afterHud === 'none', `after blitzMode=${blitz.afterBlitz}, hud=${blitz.afterHud}`);

  // ---- P8: Speedrun Mode + HUD cleanup ----
  const speedrun = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // speedrun-btn is tier3-gated (g18). seedProgress to surface it.
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const btn = document.getElementById('speedrun-btn');
    if (!btn) return { error: 'no speedrun-btn' };
    if (!visible(btn)) return { error: 'speedrun-btn not visible' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const inSR = !!gs.speedrunMode;
    const srHud = document.getElementById('speedrun-hud');
    const hudVisible = srHud ? getComputedStyle(srHud).display : 'no-element';
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 400));
    const afterSR = !!gs.speedrunMode;
    const afterHud = srHud ? getComputedStyle(srHud).display : 'no-element';
    return { inSR, hudVisible, afterSR, afterHud };
  })()`);
  assert('P8.a — Speedrun mode entered (speedrunMode=true)', speedrun.inSR === true, JSON.stringify(speedrun));
  assert('P8.b — Speedrun HUD visible during mode', speedrun.hudVisible !== 'none' && speedrun.hudVisible !== 'no-element', `hudVisible=${speedrun.hudVisible}`);
  assert('P8.c — Day 74 fix: Speedrun HUD cleaned up on back', speedrun.afterSR === false && speedrun.afterHud === 'none', `after srMode=${speedrun.afterSR}, hud=${speedrun.afterHud}`);

  // ---- P9: Sandbox config screen ----
  const sandbox = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const btn = document.getElementById('sandbox-btn');
    if (!btn) return { error: 'no sandbox-btn' };
    if (!visible(btn)) return { error: 'sandbox-btn not visible' };
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    const onConfig = screenVisible('sandbox-config-screen');
    return { onConfig };
  })()`);
  assert('P9.a — Sandbox config screen opens', sandbox.onConfig === true, JSON.stringify(sandbox));

  // ---- P10: Tournament Mode ----
  const tournament = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const btn = document.getElementById('tournament-btn');
    if (!btn) return { error: 'no tournament-btn' };
    if (!visible(btn)) return { error: 'tournament-btn not visible after tier3 seed' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const screen = document.getElementById('tournament-screen');
    const onScreen = screenVisible('tournament-screen');
    const tabs = [...(screen?.querySelectorAll('.tournament-tab') || [])].length;
    const modeLabel = document.getElementById('tournament-mode-label')?.textContent || '';
    const backend = gs.tournamentBackend;
    const adapterShape = backend && typeof backend.getMode === 'function' && typeof backend.describe === 'function' && typeof backend.isLive === 'function';
    return { onScreen, tabs, modeLabel, mode: backend?.getMode(), isLive: backend?.isLive(), adapterShape };
  })()`);
  assert('P10.a — Tournament screen visible', tournament.onScreen === true, JSON.stringify(tournament));
  assert('P10.b — 3 tabs present (This Week / My Best / Archive)', tournament.tabs === 3, `tabs=${tournament.tabs}`);
  assert('P10.c — Day 83 adapter shape (getMode/describe/isLive)', tournament.adapterShape === true);
  assert('P10.d — Tournament backend mode local', tournament.mode === 'local', `mode=${tournament.mode}`);
  assert('P10.e — Day 83 mode label populated', /Local leaderboard/.test(tournament.modeLabel), `modeLabel="${tournament.modeLabel}"`);

  // ---- P11: Infinite Mode ----
  const infinite = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // infinite-mode-btn is tier2 (g12) — keep seeded state from earlier.
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const btn = document.getElementById('infinite-mode-btn');
    if (!btn) return { error: 'no infinite-mode-btn' };
    if (!visible(btn)) return { error: 'infinite-mode-btn not visible after tier seed' };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const onPre = screenVisible('infinite-pre-screen');
    const startBtn = document.getElementById('infinite-start-btn');
    if (startBtn) startBtn.click();
    await new Promise(r => setTimeout(r, 800));
    const onGameplay = screenVisible('gameplay-screen');
    const ir = gs.infiniteRun;
    const isInfinite = !!(ir && ir.active);
    return { onPre, onGameplay, isInfinite, startBtnExists: !!startBtn };
  })()`);
  assert('P11.a — Infinite pre-screen opens', infinite.onPre === true, JSON.stringify(infinite));
  assert('P11.b — Infinite run starts (gameplay + active state)', infinite.onGameplay === true && infinite.isInfinite === true, JSON.stringify(infinite));

  // ---- P12: Day 84 Lab Bench II L42 hard-cap validator regression ----
  // The validator was exhaustively exercised on Day 90 (localhost) and Day 88
  // (live-load playthrough). For Day 91 we confirm (a) the deployed build still
  // carries L42's hardCap=4 + constraint chip text, and (b) the validator
  // accepts a clean 4-gate submission and rejects a 5-gate one. Use addGate()
  // for the rejection test so the gate count math matches the validator's view.
  const labCap = await evaluate(ws, `(async () => {
    const gs = window.game;
    gs.startLevel(42);
    await new Promise(r => setTimeout(r, 400));
    const lvl = gs.currentLevel;
    if (!lvl || lvl.gateHardCap !== 4) return { error: 'L42 not loaded or hardCap wrong', gateHardCap: lvl && lvl.gateHardCap };
    const constraintText = lvl.labConstraint;
    // Clear existing gates (loadLevel resets them) then place 5 dummy AND gates
    for (let i = 0; i < 5; i++) gs.addGate('AND', 100 + i*50, 200);
    const overCap = gs._validateLabConstraints();
    // Remove one
    gs.gates.pop();
    const underCap = gs._validateLabConstraints();
    return { gateHardCap: lvl.gateHardCap, constraintText, overCapOk: overCap.ok, overCapMsg: overCap.message, underCapOk: underCap.ok, gateCount5: 5, gateCount4: gs.gates.length };
  })()`);
  assert('P12.a — L42 hardCap=4 metadata', labCap.gateHardCap === 4, JSON.stringify(labCap));
  assert('P12.b — L42 constraint chip text present', /Hard cap.*4/i.test(labCap.constraintText || ''), `text=${labCap.constraintText}`);
  assert('P12.c — L42 validator rejects 5 gates', labCap.overCapOk === false, `msg=${labCap.overCapMsg}`);
  assert('P12.d — L42 validator accepts 4 gates', labCap.underCapOk === true, `underCapOk=${labCap.underCapOk}, gateCount=${labCap.gateCount4}`);

  // ---- P13: Day 78 staircase end-game ----
  const endgame = await evaluate(ws, `(() => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    gs.seedProgress(40, { stars: 3 });
    const ls = document.getElementById('level-select-screen');
    const navBtns = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const overflowBtns = [...ls.querySelectorAll('.level-overflow-btn')];
    return { navCount: navBtns.length, overflowCount: overflowBtns.length };
  })()`);
  assert('P13.a — 18 nav buttons at end-game', endgame.navCount === 18, `got ${endgame.navCount}`);
  assert('P13.b — 40 overflow buttons at end-game', endgame.overflowCount === 40, `got ${endgame.overflowCount}`);

  // ---- P14: 0 console errors / exceptions ----
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P14.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P14.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ---- summary ----
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 91 REGRESSION SWEEP (DEPLOYED) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);
  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
