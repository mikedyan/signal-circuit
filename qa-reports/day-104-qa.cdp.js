#!/usr/bin/env node
/**
 * Day 104 QA harness — Cycle 4 PRUNE Week, Day 3: Code Cleanup.
 *
 * Verifies 4 PRUNE cuts against the local build at localhost:8901:
 *   Cut #1  Orphan `.mastery-level` CSS rules removed (5 selectors).
 *   Cut #2  🔧 Difficulty Mode button moved out of Display & Accessibility
 *           into a new Gameplay section in Settings.
 *   Cut #3  📲 Install App button hidden when standalone (PWA installed).
 *   Cut #4  📸 My Cards stats tab dimmed when library empty (.empty class).
 *
 * Also re-verifies Day 103 invariants (LO-1 retired, end-game grid 45 cards,
 * 4-state tournament label) and Day 79 dead-identifier purge.
 *
 * Build identity expected:
 *   - ?v=1780790400 (Day 104 bump from Day 103's 1780704000)
 *   - sw v67 (bump from v66)
 *   - 0 console errors throughout the run
 *
 * Prereqs:
 *   - python3 -m http.server 8901 serving the repo root
 *   - Permissive headless Chromium on port 9301
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-104-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/index.html?_ts=' + Date.now();

let msgId = 0;
let ws;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];

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

const results = [];
function assert(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}` + (detail ? ` — ${detail}` : ''));
}

async function main() {
  const wsUrl = await getDebugTarget();
  ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.on('open', r));
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg.result);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.type;
      if (t === 'error') {
        const txt = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        consoleErrors.push(txt);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.text || JSON.stringify(msg.params.exceptionDetails).slice(0, 200));
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: TARGET_URL });
  await sleep(2200);

  // === Phase 1: Build identity + console hygiene ===
  console.log('\n=== P1: Build identity ===');
  const buildId = await evalExpr(`(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')];
    const versions = new Set(links.map(l => (l.href || l.src).match(/\\?v=(\\d+)/)?.[1]));
    return { count: links.length, versions: [...versions] };
  })()`);
  assert('P1.a — 11 cache-busted refs unified', buildId.count === 11 && buildId.versions.length === 1, JSON.stringify(buildId));
  assert('P1.b — version is 1780790400 (Day 104 bump)', buildId.versions[0] === '1780790400', `got ${buildId.versions[0]}`);

  // === Phase 2: Cut #1 — Orphan `.mastery-level` CSS removed ===
  console.log('\n=== P2: Cut #1 — Orphan .mastery-level CSS removed ===');
  const cssCheck = await evalExpr(`(async () => {
    const r = await fetch('css/style.css?_t=' + Date.now()).then(r => r.text());
    return {
      masteryLevelSelectorMatches: (r.match(/#mastery-levels-grid[^{]*\\.mastery-level/g) || []).length,
      masterySectionPresent: r.includes('#mastery-section {'),
      masteryCompletedPresent: r.includes('.mastery-completed {'),
    };
  })()`, true);
  assert('P2.a — .mastery-level selectors removed from CSS', cssCheck.masteryLevelSelectorMatches === 0, `count=${cssCheck.masteryLevelSelectorMatches}`);
  assert('P2.b — #mastery-section rule retained', cssCheck.masterySectionPresent === true);
  assert('P2.c — .mastery-completed rule retained', cssCheck.masteryCompletedPresent === true);

  // === Phase 3: Cut #2 — Difficulty Mode filed under Gameplay ===
  console.log('\n=== P3: Cut #2 — Difficulty Mode in new Gameplay section ===');
  const settingsLayout = await evalExpr(`(() => {
    const settingsBtn = document.getElementById('open-settings-btn');
    if (settingsBtn) settingsBtn.click();
    const modal = document.getElementById('settings-modal');
    const sections = [...document.querySelectorAll('#settings-content .settings-section h4')].map(h => h.textContent.trim());
    const diffBtn = document.getElementById('difficulty-mode-btn');
    let diffSection = null;
    if (diffBtn) {
      const sec = diffBtn.closest('.settings-section');
      const h = sec ? sec.querySelector('h4') : null;
      diffSection = h ? h.textContent.trim() : null;
    }
    const gameplayRow = document.getElementById('settings-gameplay-row');
    return {
      modalOpen: modal && modal.style.display === 'flex',
      sections,
      diffBtnExists: !!diffBtn,
      diffSection,
      diffBtnLabel: diffBtn ? diffBtn.textContent.trim() : null,
      gameplayRowHasDiffBtn: gameplayRow && gameplayRow.contains(diffBtn),
    };
  })()`);
  assert('P3.a — Settings modal opens', settingsLayout.modalOpen);
  assert('P3.b — Sections in canonical order with Gameplay between Display and Audio',
    JSON.stringify(settingsLayout.sections) === JSON.stringify(['Display & Accessibility','Gameplay','Audio','Notifications','Data','Developer']),
    JSON.stringify(settingsLayout.sections));
  assert('P3.c — Difficulty button exists', settingsLayout.diffBtnExists);
  assert('P3.d — Difficulty button now under Gameplay section', settingsLayout.diffSection === 'Gameplay', `got "${settingsLayout.diffSection}"`);
  assert('P3.e — #settings-gameplay-row contains the difficulty button', settingsLayout.gameplayRowHasDiffBtn === true);
  assert('P3.f — Difficulty button label preserved', /Mode/.test(settingsLayout.diffBtnLabel || ''), settingsLayout.diffBtnLabel);

  // Difficulty chooser still opens
  const chooserOpens = await evalExpr(`(() => {
    document.getElementById('difficulty-mode-btn').click();
    const confirm = document.getElementById('confirm-modal');
    const visible = confirm && getComputedStyle(confirm).display !== 'none';
    const buttons = confirm ? [...confirm.querySelectorAll('button')].map(b => b.textContent.trim()) : [];
    // Close
    const close = document.getElementById('confirm-cancel');
    if (close) close.click();
    return { visible, buttonCount: buttons.length, sample: buttons.slice(0, 5) };
  })()`);
  assert('P3.g — Difficulty chooser modal opens with options', chooserOpens.visible && chooserOpens.buttonCount >= 3, JSON.stringify(chooserOpens));

  // === Phase 4: Cut #3 — Install-App standalone gating ===
  console.log('\n=== P4: Cut #3 — Install-App hidden when standalone ===');
  // Browser is NOT standalone — button should be visible
  const installState = await evalExpr(`(() => {
    const btn = document.getElementById('install-app-btn');
    if (!btn) return { exists: false };
    const styleDisplay = btn.style.display;
    const computed = getComputedStyle(btn).display;
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const gsStandalone = window._notifManager && window._notifManager._isStandalone();
    return { exists: true, styleDisplay, computed, isStandalone, gsStandalone };
  })()`);
  assert('P4.a — Install-App button exists in DOM', installState.exists);
  assert('P4.b — Non-standalone: button visible (style.display !== "none")', installState.styleDisplay !== 'none', `style.display="${installState.styleDisplay}"`);
  assert('P4.c — Non-standalone matchMedia confirms', installState.isStandalone === false);

  // Now simulate standalone path by directly calling _isStandalone shadow
  const standaloneSim = await evalExpr(`(() => {
    const nm = window._notifManager;
    if (!nm) return { ok: false };
    // Verify the gating logic exists in source
    const fn = nm.setupInstallPrompt.toString();
    return {
      ok: true,
      hasGate: fn.includes('_isStandalone()'),
      hasHideBranch: fn.includes("style.display = 'none'") || fn.includes('style.display="none"') || fn.includes("style.display='none'"),
    };
  })()`);
  assert('P4.d — setupInstallPrompt() consults _isStandalone()', standaloneSim.hasGate === true);
  assert('P4.e — setupInstallPrompt() has hide branch', standaloneSim.hasHideBranch === true);

  // Close settings modal
  await evalExpr(`document.getElementById('settings-close').click()`);
  await sleep(200);

  // === Phase 5: Cut #4 — My Cards tab dimmed when empty ===
  console.log('\n=== P5: Cut #4 — My Cards tab dimmed when library empty ===');
  const emptyTabState = await evalExpr(`(() => {
    // Clear card library to be safe
    try { window.game.resetProgress && window.game.resetProgress(); } catch(e){}
    localStorage.removeItem('signal-circuit-card-library');
    // Open stats
    document.getElementById('stats-btn').click();
    const cardsTab = document.getElementById('stats-tab-cards');
    return {
      tabText: cardsTab ? cardsTab.textContent : null,
      hasEmptyClass: cardsTab ? cardsTab.classList.contains('empty') : false,
      opacity: cardsTab ? getComputedStyle(cardsTab).opacity : null,
      isActive: cardsTab ? cardsTab.classList.contains('active') : false,
    };
  })()`);
  assert('P5.a — My Cards tab shows (0)', /\(0\)/.test(emptyTabState.tabText || ""), emptyTabState.tabText);
  assert('P5.b — Empty library adds .empty class to tab', emptyTabState.hasEmptyClass === true);
  assert('P5.c — .empty (not active) dims tab opacity ≤ 0.6', parseFloat(emptyTabState.opacity) <= 0.6, `opacity=${emptyTabState.opacity}`);
  assert('P5.d — Default tab is Overview when empty', emptyTabState.isActive === false);

  await evalExpr(`document.getElementById('stats-close').click()`);
  await sleep(200);

  // === Phase 6: Day 103 invariants still hold ===
  console.log('\n=== P6: Day 103 invariants re-verified ===');
  // Tournament 4-state label
  const tournLabel = await evalExpr(`(() => {
    const b = window.game && window.game.tournamentBackend;
    return b ? b.describe() : null;
  })()`);
  assert('P6.a — Tournament label uses compressed 4-state vocabulary', /Local leaderboard|Live leaderboard|Live · offline|Connecting/.test(tournLabel || ''), tournLabel);

  // LO-1: bypass path should still clean HUD (Day 103 fix)
  const lo1Check = await evalExpr(`(async () => {
    const gs = window.game;
    // Force Blitz HUD on
    gs.blitzMode = true;
    const hud = document.getElementById('blitz-hud');
    if (hud) hud.style.display = 'flex';
    // Trigger bypass: ui.showScreen('level-select') directly
    gs.ui.showScreen('level-select');
    await new Promise(r => setTimeout(r, 100));
    return {
      blitzMode: gs.blitzMode,
      hudDisplay: hud ? hud.style.display : null,
    };
  })()`, true);
  assert('P6.b — LO-1 fix: bypass path clears Blitz mode flag', lo1Check.blitzMode === false);
  assert('P6.c — LO-1 fix: bypass path hides Blitz HUD', lo1Check.hudDisplay === 'none', `hud=${lo1Check.hudDisplay}`);

  // Mastery grid still gated to modal (Cut #4 invariant)
  const masterySection = await evalExpr(`(() => {
    const section = document.getElementById('mastery-section');
    const inMastery = section && section.closest('#mastery-tree-modal');
    return {
      exists: !!section,
      hostedInModal: !!inMastery,
    };
  })()`);
  assert('P6.d — #mastery-section lives inside the Mastery Tree modal', masterySection.hostedInModal === true);

  // === Phase 7: Day 79 dead-identifier purge still intact ===
  console.log('\n=== P7: Day 79 dead-id sweep regression ===');
  const deadIds = await evalExpr(`(() => {
    const probes = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','_showHud','getCurrentStep'];
    const out = {};
    const ui = window.game && window.game.ui;
    const irm = window.game && window.game._infiniteRun;
    const tut = window.game && window.game.tutorial;
    const am = window.game && window.game.achievementManager;
    out.showFirstLaunchDifficultyModal = !!(ui && ui.showFirstLaunchDifficultyModal);
    out.checkLightning = !!(am && am.checkLightning);
    out.checkEclipseRun = !!(am && am.checkEclipseRun);
    out.checkArchitect = !!(am && am.checkArchitect);
    out._showHud = !!(irm && irm._showHud);
    out.getCurrentStep = !!(tut && tut.getCurrentStep);
    out.weeklyPuzzleBtn = !!document.getElementById('weekly-puzzle-btn');
    return out;
  })()`);
  for (const k of Object.keys(deadIds)) {
    assert(`P7 — ${k} stays removed`, deadIds[k] === false, String(deadIds[k]));
  }

  // === Phase 8: Console hygiene ===
  console.log('\n=== P8: Console hygiene ===');
  assert('P8.a — 0 console.error during full run', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  assert('P8.b — 0 Runtime.exceptionThrown during full run', exceptions.length === 0, exceptions.slice(0, 3).join(' | '));

  // === Summary ===
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  console.log(`\n=== SUMMARY: ${passed}/${total} passed ===`);
  if (passed < total) {
    console.log('FAILED:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name} — ${r.detail || ''}`));
    process.exit(1);
  }
  ws.close();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });
