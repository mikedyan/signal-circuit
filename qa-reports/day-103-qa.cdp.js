#!/usr/bin/env node
/**
 * Day 103 QA harness — Cycle 4 PRUNE Week, Day 2: Design Simplification.
 *
 * Verifies the 5 Tier-1 PRUNE cuts against the local build at localhost:8901:
 *   Cut #1  LO-1 fix — UI.showScreen('level-select') now cleans BOTH Blitz +
 *           Speedrun HUDs, so the Day 102 reproduction harness should FAIL
 *           to reproduce LO-1 (success signal = bypass path is clean).
 *   Cut #2  Tournament backend describe() returns compressed mode labels.
 *   Cut #3  Stats modal defaults to Cards tab when library is non-empty.
 *   Cut #4  Mastery cards no longer co-render in the campaign grid — end-game
 *           level-card count returns to 45 (was 50). Mastery Tree modal still
 *           surfaces all 5 challenges.
 *   Cut #5  #lab-budget lives in its own row OUTSIDE the constraint strip.
 *
 * Build identity expected:
 *   - ?v=1780704000 (Day 103 bump from Day 96's 1780617600)
 *   - sw v66 (bump from v65)
 *   - 0 console errors throughout the run
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301:
 *       /Users/openclaw/Applications/Chromium.app/Contents/MacOS/Chromium \
 *         --headless=new --remote-debugging-port=9301 \
 *         '--remote-allow-origins=*' --user-data-dir=/tmp/sc-cdp-d103 \
 *         --no-first-run --no-default-browser-check about:blank
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-103-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();

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

  // Wipe ALL signal-* localStorage keys
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
  // P1: build identity
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — on localhost test host', /localhost|127\.0\.0\.1/.test(buildIdentity.host), `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=1780704000 (Day 103 bump)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1780704000', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV66: text.indexOf('signal-circuit-v66') >= 0, hasV65: text.indexOf('signal-circuit-v65') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js bumped to CACHE_NAME=signal-circuit-v66', swProbe.swFetched === true && swProbe.hasV66 === true, JSON.stringify(swProbe));
  assert('P1.e — sw.js no longer references v65', swProbe.hasV65 === false, JSON.stringify(swProbe));

  // ============================================================
  // P2: LO-1 fix — Speedrun bypass path now CLEANS HUD
  // ============================================================
  const lo1Speedrun = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));

    // -- BYPASS PATH (direct ui.showScreen): Day 103 fix should CLEAN HUD --
    const srBtn = document.getElementById('speedrun-btn');
    srBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const enteredSr = !!gs.speedrunMode;
    const enteredHud = getComputedStyle(document.getElementById('speedrun-hud')).display;
    // Bypass through ui.showScreen() directly — Day 103 fix puts cleanup here.
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 300));
    const bypassAfterSr = !!gs.speedrunMode;
    const bypassAfterHud = getComputedStyle(document.getElementById('speedrun-hud')).display;
    const bypassTimer = !!gs.speedrunTimer;
    const bypassStart = gs.speedrunStart;

    // Cleanup so subsequent phases aren't polluted
    gs.speedrunMode = false;
    if (gs.speedrunTimer) { clearInterval(gs.speedrunTimer); gs.speedrunTimer = null; }
    document.getElementById('speedrun-hud').style.display = 'none';

    return { enteredSr, enteredHud, bypassAfterSr, bypassAfterHud, bypassTimer, bypassStart };
  })()`);
  console.log(`[LO-1 fix Speedrun] entered: sr=${lo1Speedrun.enteredSr}/hud=${lo1Speedrun.enteredHud}  after-bypass: sr=${lo1Speedrun.bypassAfterSr}/hud=${lo1Speedrun.bypassAfterHud}/timer=${lo1Speedrun.bypassTimer}`);
  assert('P2.a — Speedrun entry still sets speedrunMode=true + HUD visible', lo1Speedrun.enteredSr === true && lo1Speedrun.enteredHud !== 'none');
  assert('P2.b — Day 103 LO-1 FIX: bypass path now sets speedrunMode=false (Day 102 P5.c REPRODUCTION HARNESS FAILS)', lo1Speedrun.bypassAfterSr === false, `sr=${lo1Speedrun.bypassAfterSr}`);
  assert('P2.c — Day 103 LO-1 FIX: bypass path now hides #speedrun-hud (Day 102 P5.d REPRODUCTION HARNESS FAILS)', lo1Speedrun.bypassAfterHud === 'none', `hud=${lo1Speedrun.bypassAfterHud}`);
  assert('P2.d — Day 103 LO-1 FIX: bypass path clears speedrunTimer + speedrunStart', lo1Speedrun.bypassTimer === false && lo1Speedrun.bypassStart == null, `timer=${lo1Speedrun.bypassTimer} start=${lo1Speedrun.bypassStart}`);

  // ============================================================
  // P3: LO-1 fix — Blitz bypass path now CLEANS HUD
  // ============================================================
  const lo1Blitz = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 200));
    const blBtn = document.getElementById('blitz-mode-btn');
    blBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const enteredBl = !!gs.blitzMode;
    const enteredHud = getComputedStyle(document.getElementById('blitz-hud')).display;
    // Bypass
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 300));
    const bypassAfterBl = !!gs.blitzMode;
    const bypassAfterHud = getComputedStyle(document.getElementById('blitz-hud')).display;
    const bypassTimer = !!gs.blitzTimer;
    // Cleanup
    gs.blitzMode = false;
    if (gs.blitzTimer) { clearInterval(gs.blitzTimer); gs.blitzTimer = null; }
    document.getElementById('blitz-hud').style.display = 'none';
    return { enteredBl, enteredHud, bypassAfterBl, bypassAfterHud, bypassTimer };
  })()`);
  console.log(`[LO-1 fix Blitz] entered: bl=${lo1Blitz.enteredBl}/hud=${lo1Blitz.enteredHud}  after-bypass: bl=${lo1Blitz.bypassAfterBl}/hud=${lo1Blitz.bypassAfterHud}/timer=${lo1Blitz.bypassTimer}`);
  assert('P3.a — Blitz entry still sets blitzMode=true + HUD visible', lo1Blitz.enteredBl === true && lo1Blitz.enteredHud !== 'none');
  assert('P3.b — Day 103 LO-1 FIX: Blitz bypass path now sets blitzMode=false', lo1Blitz.bypassAfterBl === false, `bl=${lo1Blitz.bypassAfterBl}`);
  assert('P3.c — Day 103 LO-1 FIX: Blitz bypass path now hides #blitz-hud', lo1Blitz.bypassAfterHud === 'none', `hud=${lo1Blitz.bypassAfterHud}`);
  assert('P3.d — Day 103 LO-1 FIX: Blitz bypass path clears blitzTimer', lo1Blitz.bypassTimer === false, `timer=${lo1Blitz.bypassTimer}`);

  // ============================================================
  // P4: Cut #2 — Tournament label compression
  // ============================================================
  const tournLabels = await evaluate(ws, `(async () => {
    const gs = window.game;
    const wt = gs.weeklyTournament;
    // Local adapter
    const local = new window.LocalTournamentAdapter(wt);
    const localDesc = local.describe();
    // Remote adapter — three states by faking _isReachable
    const remote = new window.RemoteTournamentAdapter(wt, { workerUrl: 'http://example.invalid' });
    // cloud-ready (configured but never probed)
    remote._lastReachable = null;
    remote._lastReachAt = 0;
    const cloudReadyDesc = remote.describe();
    // remote (reachable)
    remote._lastReachable = true;
    remote._lastReachAt = Date.now();
    const remoteDesc = remote.describe();
    // remote-fallback (unreachable)
    remote._lastReachable = false;
    remote._lastReachAt = Date.now();
    const fallbackDesc = remote.describe();
    // CSS check on #tournament-mode-label
    const labelEl = document.getElementById('tournament-mode-label');
    const cs = labelEl ? getComputedStyle(labelEl) : null;
    return {
      localDesc,
      cloudReadyDesc,
      remoteDesc,
      fallbackDesc,
      textOverflow: cs ? cs.textOverflow : null,
      whiteSpace: cs ? cs.whiteSpace : null,
      overflow: cs ? cs.overflow : null,
    };
  })()`);
  console.log(`[Tournament labels] local="${tournLabels.localDesc}" cloudReady="${tournLabels.cloudReadyDesc}" remote="${tournLabels.remoteDesc}" fallback="${tournLabels.fallbackDesc}"`);
  assert('P4.a — local → "🏠 Local leaderboard"', tournLabels.localDesc === '🏠 Local leaderboard', tournLabels.localDesc);
  assert('P4.b — remote → "🌐 Live leaderboard"', tournLabels.remoteDesc === '🌐 Live leaderboard', tournLabels.remoteDesc);
  assert('P4.c — remote-fallback → "🌐 Live · offline"', tournLabels.fallbackDesc === '🌐 Live · offline', tournLabels.fallbackDesc);
  assert('P4.d — cloud-ready → "🌐 Connecting…"', tournLabels.cloudReadyDesc === '🌐 Connecting…', tournLabels.cloudReadyDesc);
  assert('P4.e — local label is ≤ 22 chars (was 51)', tournLabels.localDesc.length <= 22, `len=${tournLabels.localDesc.length}`);
  assert('P4.f — #tournament-mode-label has text-overflow:ellipsis', tournLabels.textOverflow === 'ellipsis', `textOverflow=${tournLabels.textOverflow}`);
  assert('P4.g — #tournament-mode-label has white-space:nowrap', tournLabels.whiteSpace === 'nowrap', `whiteSpace=${tournLabels.whiteSpace}`);

  // ============================================================
  // P5: Cut #3 — Stats default to Cards when library non-empty
  // ============================================================
  const statsDefault = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    // Clear any existing library
    if (typeof gs.getCardLibrary === 'function') {
      const cur = gs.getCardLibrary();
      cur.length = 0;
    }
    // Probe 1: empty library → default = overview
    document.getElementById('stats-modal').style.display = 'none';
    document.getElementById('stats-btn').click();
    await new Promise(r => setTimeout(r, 250));
    const emptyTab = gs.ui._activeStatsTab;
    const emptyOverviewVis = getComputedStyle(document.getElementById('stats-grid')).display !== 'none';
    document.getElementById('stats-close').click();
    await new Promise(r => setTimeout(r, 200));

    // Probe 2: simulate a saved card by directly mutating storage
    try {
      gs.addSnapshotCard({
        id: 'd103-test', levelId: 1, levelTitle: 'AND', gateCount: 3,
        time: 12, stars: 3, savedAt: Date.now(), pngDataUrl: 'data:image/png;base64,'
      });
    } catch (e) {
      // Fallback: poke directly into the library array
      const lib = gs.getCardLibrary ? gs.getCardLibrary() : [];
      lib.push({ id: 'd103-test', levelId: 1, levelTitle: 'AND', gateCount: 3, time: 12, stars: 3, savedAt: Date.now(), pngDataUrl: 'data:image/png;base64,' });
    }
    await new Promise(r => setTimeout(r, 150));
    document.getElementById('stats-btn').click();
    await new Promise(r => setTimeout(r, 250));
    const filledTab = gs.ui._activeStatsTab;
    const cardsPaneVis = getComputedStyle(document.getElementById('stats-cards-pane')).display !== 'none';
    const overviewPaneVis = getComputedStyle(document.getElementById('stats-grid')).display !== 'none';
    const tabBadgeText = document.getElementById('stats-tab-cards')?.textContent || '';
    document.getElementById('stats-close').click();
    await new Promise(r => setTimeout(r, 200));

    return { emptyTab, emptyOverviewVis, filledTab, cardsPaneVis, overviewPaneVis, tabBadgeText, libCount: gs.getCardLibrary ? gs.getCardLibrary().length : 0 };
  })()`);
  console.log(`[Stats default tab] empty=${statsDefault.emptyTab}/${statsDefault.emptyOverviewVis}  filled=${statsDefault.filledTab}/cards=${statsDefault.cardsPaneVis}/ov=${statsDefault.overviewPaneVis}  badge="${statsDefault.tabBadgeText}"  lib=${statsDefault.libCount}`);
  assert('P5.a — Empty library → default tab is Overview', statsDefault.emptyTab === 'overview', `tab=${statsDefault.emptyTab}`);
  assert('P5.b — Empty library → Overview pane visible', statsDefault.emptyOverviewVis === true, `vis=${statsDefault.emptyOverviewVis}`);
  assert('P5.c — Library non-empty → default tab is Cards', statsDefault.filledTab === 'cards', `tab=${statsDefault.filledTab}`);
  assert('P5.d — Library non-empty → Cards pane visible', statsDefault.cardsPaneVis === true, `vis=${statsDefault.cardsPaneVis}`);
  assert('P5.e — Library non-empty → Overview pane hidden', statsDefault.overviewPaneVis === false, `vis=${statsDefault.overviewPaneVis}`);
  assert('P5.f — Cards tab badge reflects live count', /📸 My Cards \(\d+\)/.test(statsDefault.tabBadgeText), `badge="${statsDefault.tabBadgeText}"`);

  // ============================================================
  // P6: Cut #4 — Mastery card gating
  // ============================================================
  const mastery = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    // Wipe + seed all 45 campaign levels solved
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(45, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    // Count level cards in the campaign grid (level-select-screen) — should be 45
    const ls = document.getElementById('level-select-screen');
    const allLevelBtns = [...ls.querySelectorAll('.level-btn')].filter(b => visible(b));
    const campaignCount = allLevelBtns.length;
    // Verify #mastery-section is NOT in the level-select panel (moved into modal)
    const lsPanel = document.getElementById('level-select-panel') || ls;
    const masterySectionInLs = lsPanel.querySelector('#mastery-section');
    // Open the Mastery Tree modal — should now surface the 5 challenges
    document.getElementById('mastery-tree-btn').click();
    await new Promise(r => setTimeout(r, 250));
    const masteryModal = document.getElementById('mastery-tree-modal');
    const modalVisible = getComputedStyle(masteryModal).display !== 'none';
    const masterySection = document.getElementById('mastery-section');
    const masteryInModal = masteryModal.contains(masterySection);
    const masterySectionVisible = masterySection ? getComputedStyle(masterySection).display !== 'none' : false;
    const masteryCards = [...document.querySelectorAll('#mastery-levels-grid .level-btn')].filter(b => visible(b));
    const masteryCardCount = masteryCards.length;
    // Close modal
    document.getElementById('mastery-tree-close').click();
    await new Promise(r => setTimeout(r, 200));
    return {
      campaignCount,
      masterySectionInLs: !!masterySectionInLs,
      modalVisible,
      masteryInModal,
      masterySectionVisible,
      masteryCardCount,
    };
  })()`);
  console.log(`[Mastery] campaign=${mastery.campaignCount} (target 45)  modal.shows.section=${mastery.masterySectionVisible}  challenges=${mastery.masteryCardCount} (target 5)  mastery-section-in-LS=${mastery.masterySectionInLs}`);
  assert('P6.a — End-game level-select grid = 45 cards (mastery suppressed from campaign grid)', mastery.campaignCount === 45, `count=${mastery.campaignCount}`);
  assert('P6.b — #mastery-section no longer lives inside level-select panel', mastery.masterySectionInLs === false, `inLs=${mastery.masterySectionInLs}`);
  assert('P6.c — Mastery Tree modal opens', mastery.modalVisible === true);
  assert('P6.d — #mastery-section is now inside the Mastery Tree modal', mastery.masteryInModal === true);
  assert('P6.e — Mastery Tree modal surfaces 5 challenge cards', mastery.masteryCardCount === 5, `count=${mastery.masteryCardCount}`);

  // ============================================================
  // P7: Cut #5 — #lab-budget moved out of constraint chip strip
  // ============================================================
  const labLayout = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    // Seed past Lab Bench gate (need 40+ levels)
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    gs.seedProgress(45, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    // Enter L44 (composite Lab Bench II level)
    gs.startLevel(44);
    await new Promise(r => setTimeout(r, 600));
    const hud = document.getElementById('lab-hud');
    const hudVisible = getComputedStyle(hud).display !== 'none';
    const labBudget = document.getElementById('lab-budget');
    const labConstraint = document.getElementById('lab-constraint');
    const labConstraint2 = document.getElementById('lab-constraint-2');
    const labTries = document.getElementById('lab-tries');
    const budgetParent = labBudget ? labBudget.parentElement : null;
    const constraintParent = labConstraint ? labConstraint.parentElement : null;
    const budgetParentCls = budgetParent ? budgetParent.className : null;
    const constraintParentCls = constraintParent ? constraintParent.className : null;
    const sameParent = budgetParent && constraintParent && budgetParent === constraintParent;
    const trySameAsConstraint = labTries && labConstraint && labTries.parentElement === labConstraint.parentElement;
    // Vertical position check — budget should be BELOW constraints
    const bRect = labBudget ? labBudget.getBoundingClientRect() : null;
    const cRect = labConstraint ? labConstraint.getBoundingClientRect() : null;
    const budgetBelowConstraint = (bRect && cRect) ? bRect.top > cRect.top : null;
    // HUD itself should now be flex-direction: column
    const hudFlexDir = getComputedStyle(hud).flexDirection;
    return {
      hudVisible,
      hudFlexDir,
      budgetParentCls,
      constraintParentCls,
      sameParent: !!sameParent,
      trySameAsConstraint: !!trySameAsConstraint,
      budgetBelowConstraint,
      bTop: bRect ? bRect.top : null,
      cTop: cRect ? cRect.top : null,
      budgetText: labBudget ? labBudget.textContent : null,
      c1Text: labConstraint ? labConstraint.textContent : null,
      c2Text: labConstraint2 ? labConstraint2.textContent : null,
    };
  })()`);
  console.log(`[Lab HUD] visible=${labLayout.hudVisible} flexDir=${labLayout.hudFlexDir}  budget.parent="${labLayout.budgetParentCls}"  constraint.parent="${labLayout.constraintParentCls}"  budget-below=${labLayout.budgetBelowConstraint}  budget="${labLayout.budgetText}"  c1="${labLayout.c1Text}"  c2="${labLayout.c2Text}"`);
  assert('P7.a — Lab HUD visible on L44', labLayout.hudVisible === true);
  assert('P7.b — #lab-hud is flex-direction:column (two-row stack)', labLayout.hudFlexDir === 'column', `dir=${labLayout.hudFlexDir}`);
  assert('P7.c — #lab-budget parent class includes "lab-hud-budget-row"', /lab-hud-budget-row/.test(labLayout.budgetParentCls || ''), `cls=${labLayout.budgetParentCls}`);
  assert('P7.d — #lab-budget and #lab-constraint have DIFFERENT parents', labLayout.sameParent === false, `same=${labLayout.sameParent}`);
  assert('P7.e — #lab-tries stays in the same row as constraints (top row)', labLayout.trySameAsConstraint === true, `same=${labLayout.trySameAsConstraint}`);
  assert('P7.f — #lab-budget renders BELOW the constraint strip', labLayout.budgetBelowConstraint === true, `bTop=${labLayout.bTop} cTop=${labLayout.cTop}`);
  assert('P7.g — L44 composite still surfaces 2 constraint chips', labLayout.c1Text && labLayout.c1Text.length > 0 && labLayout.c2Text && labLayout.c2Text.length > 0, `c1="${labLayout.c1Text}" c2="${labLayout.c2Text}"`);

  // ============================================================
  // P8: Console hygiene
  // ============================================================
  assert('P8.a — 0 console.error across all phases', consoleErrors.length === 0, `count=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.join(' | ') : ''}`);
  assert('P8.b — 0 Runtime.exceptionThrown across all phases', runtimeExceptions.length === 0, `count=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.join(' | ') : ''}`);

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`\n========== DAY 103 QA SUMMARY ==========`);
  console.log(`Total: ${results.length} | Pass: ${passed} | Fail: ${failed.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Runtime exceptions: ${runtimeExceptions.length}`);
  if (failed.length) {
    console.log(`\nFAILED:`);
    failed.forEach(f => console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
  }
  console.log(`\nLO-1 STATUS:`);
  const lo1FixedSr = results.find(r => r.name.startsWith('P2.b'))?.pass;
  const lo1FixedBl = results.find(r => r.name.startsWith('P3.b'))?.pass;
  console.log(`  Speedrun bypass clean: ${lo1FixedSr ? '✓ FIXED' : '✗ STILL LEAKS'}`);
  console.log(`  Blitz bypass clean:    ${lo1FixedBl ? '✓ FIXED' : '✗ STILL LEAKS'}`);
  if (lo1FixedSr && lo1FixedBl) {
    console.log(`  → Day 102 LO-1 reproduction harness FAILS as expected (success signal).`);
  }

  ws.close();
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(2); });
