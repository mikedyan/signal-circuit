#!/usr/bin/env node
/**
 * Day 124 QA harness — Cycle 6 BUILD Week, Day 2: "Collection-Modal Merge".
 *
 * Merges the 5 standalone collection modals (Achievements / Mastery / Customize
 * / Collection / Logic Profile) into ONE tabbed #profile-hub-modal. Re-parents
 * (does not rewrite) each content root; each render*() stays untouched. A single
 * 🗂️ Profile button (reveals at g12) replaces the 5 header buttons; the three
 * g15 tabs (Mastery/Collection/Logic) self-hide until g15.
 *
 * Build under test: LOCAL http://localhost:8901/ (?v=1782777600 / sw v78).
 *
 * Coverage (9 phases):
 *   P1  build identity (11 cache-bust refs ?v=1782777600 / sw v78)
 *   P2  hub opens from #profile-hub-btn (display:flex)
 *   P3  all 5 tabs switch + lazy-render their content root (non-empty)
 *   P4  cosmetic select still mutates live render (setWireColor via card click)
 *   P5  close via button + backdrop; #profile-view cleared; overlay hidden
 *   P6  tier gating: g12 hides Mastery/Collection/Logic tabs; g15 shows all 5
 *   P7  end-game: 5 old collection buttons removed from DOM; hub button present
 *   P8  Day 79 dead-id purge intact; cold 2 nav / 50 cards
 *   P9  0 console.error / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-124-qa.cdp.js
 *   tools/cdp-launch.sh stop
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
  // P1: build identity
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    return { count: links.length, unified: [...new Set(links)] };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — unified ?v=1782777600 (Day 124 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782777600', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { ok: r.ok, hasV78: text.indexOf('signal-circuit-v78') >= 0 };
    } catch (e) { return { ok: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v78', swProbe.ok === true && swProbe.hasV78 === true, JSON.stringify(swProbe));

  // Structural: hub present, 5 old modals gone, 5 content roots each present once.
  const structure = await evaluate(ws, `(() => {
    const oldModals = ['achievements-modal','mastery-tree-modal','collection-modal','profile-modal','cosmetic-modal'];
    const oldModalsPresent = oldModals.filter(id => !!document.getElementById(id));
    const roots = ['achievements-list','mastery-tree-view','mastery-section','cosmetic-sections','collection-list','profile-view'];
    const rootCounts = roots.map(id => document.querySelectorAll('#' + CSS.escape(id)).length);
    const hub = !!document.getElementById('profile-hub-modal');
    const tabs = ['phub-tab-achievements','phub-tab-mastery','phub-tab-customize','phub-tab-collection','phub-tab-profile'].filter(id => !!document.getElementById(id)).length;
    const panes = document.querySelectorAll('#profile-hub-panes .phub-pane').length;
    return { oldModalsPresent, rootCounts, hub, tabs, panes };
  })()`);
  console.log(`\n[Structure] ${JSON.stringify(structure)}`);
  assert('P1.d — 5 old collection modals removed from DOM', structure.oldModalsPresent.length === 0, `present=${JSON.stringify(structure.oldModalsPresent)}`);
  assert('P1.e — all 6 content roots present exactly once', structure.rootCounts.every(c => c === 1), `counts=${JSON.stringify(structure.rootCounts)}`);
  assert('P1.f — hub modal + 5 tabs + 5 panes exist', structure.hub && structure.tabs === 5 && structure.panes === 5, JSON.stringify(structure));

  // ============================================================
  // Seed g15 so all 5 tabs are available for P2–P5.
  // ============================================================
  await evaluate(ws, `(() => { window.game.seedProgress(15, { stars: 3 }); return true; })()`);
  await wait(300);

  // ============================================================
  // P2: hub opens from the single Profile button
  // ============================================================
  const open = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    window.game.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const btn = document.getElementById('profile-hub-btn');
    const btnVisible = visible(btn);
    btn.click();
    await new Promise(r => setTimeout(r, 250));
    const modal = document.getElementById('profile-hub-modal');
    return { btnVisible, modalDisplay: getComputedStyle(modal).display };
  })()`);
  console.log(`\n[Open] ${JSON.stringify(open)}`);
  assert('P2.a — #profile-hub-btn visible at g15', open.btnVisible === true, `btnVisible=${open.btnVisible}`);
  assert('P2.b — hub opens (display:flex)', open.modalDisplay === 'flex', `display=${open.modalDisplay}`);

  // ============================================================
  // P3: all 5 tabs switch + lazy-render (non-empty content root)
  // ============================================================
  const tabsProbe = await evaluate(ws, `(async () => {
    const ui = window.game.ui;
    const tabRoots = {
      achievements: 'achievements-list',
      mastery: 'mastery-tree-view',
      customize: 'cosmetic-sections',
      collection: 'collection-list',
      profile: 'profile-view',
    };
    const out = {};
    for (const [tab, rootId] of Object.entries(tabRoots)) {
      ui._switchProfileTab(tab);
      await new Promise(r => setTimeout(r, 120));
      const pane = document.getElementById('phub-pane-' + tab);
      const root = document.getElementById(rootId);
      out[tab] = {
        active: ui._activeProfileTab === tab,
        paneShown: pane && getComputedStyle(pane).display !== 'none',
        rendered: root && root.innerHTML.trim().length > 0,
      };
    }
    return out;
  })()`);
  console.log(`\n[Tabs] ${JSON.stringify(tabsProbe)}`);
  for (const tab of ['achievements','mastery','customize','collection','profile']) {
    const t = tabsProbe[tab];
    assert(`P3.${tab} — tab active + pane shown + content rendered`, t.active && t.paneShown && t.rendered, JSON.stringify(t));
  }

  // ============================================================
  // P4: cosmetic select still mutates live render
  // ============================================================
  const cosmetic = await evaluate(ws, `(async () => {
    const ui = window.game.ui;
    ui._switchProfileTab('customize');
    await new Promise(r => setTimeout(r, 150));
    const cos = window.game.cosmetics;
    const before = cos.getAllForUI().wireColors.find(c => c.active);
    // Find an unlocked wireColor card that is NOT currently active.
    const cards = [...document.querySelectorAll('#cosmetic-sections .cosmetic-card[data-category="wireColor"]:not(.cosmetic-locked)')];
    const target = cards.find(c => c.dataset.id !== (before ? before.id : null));
    let clickedId = null;
    if (target) { clickedId = target.dataset.id; target.click(); await new Promise(r => setTimeout(r, 150)); }
    const after = cos.getAllForUI().wireColors.find(c => c.active);
    return {
      unlockedCards: cards.length,
      beforeId: before ? before.id : null,
      clickedId,
      afterId: after ? after.id : null,
      changed: !!(clickedId && after && after.id === clickedId),
    };
  })()`);
  console.log(`\n[Cosmetic] ${JSON.stringify(cosmetic)}`);
  assert('P4.a — customize pane has ≥1 unlocked wire-color card', cosmetic.unlockedCards >= 1, `cards=${cosmetic.unlockedCards}`);
  assert('P4.b — clicking a card mutates the active wire color (live render)', cosmetic.changed === true, JSON.stringify(cosmetic));

  // ============================================================
  // P5: close via button + backdrop; #profile-view cleared
  // ============================================================
  const close = await evaluate(ws, `(async () => {
    const modal = document.getElementById('profile-hub-modal');
    // Switch to Logic so #profile-view has content, then close via button.
    window.game.ui._switchProfileTab('profile');
    await new Promise(r => setTimeout(r, 150));
    const pvBefore = document.getElementById('profile-view').innerHTML.trim().length;
    document.getElementById('profile-hub-close').click();
    await new Promise(r => setTimeout(r, 150));
    const displayAfterBtn = getComputedStyle(modal).display;
    const pvAfter = document.getElementById('profile-view').innerHTML.trim().length;
    // Re-open + close via backdrop click.
    document.getElementById('profile-hub-btn').click();
    await new Promise(r => setTimeout(r, 150));
    const reopened = getComputedStyle(modal).display === 'flex';
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // The backdrop handler checks e.target === modal; dispatch directly on modal.
    const evt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(evt, 'target', { value: modal });
    modal.dispatchEvent(evt);
    await new Promise(r => setTimeout(r, 150));
    const displayAfterBackdrop = getComputedStyle(modal).display;
    return { pvBefore, displayAfterBtn, pvAfter, reopened, displayAfterBackdrop };
  })()`);
  console.log(`\n[Close] ${JSON.stringify(close)}`);
  assert('P5.a — Logic pane had content before close', close.pvBefore > 0, `len=${close.pvBefore}`);
  assert('P5.b — close button hides hub', close.displayAfterBtn === 'none', `display=${close.displayAfterBtn}`);
  assert('P5.c — #profile-view cleared on close (no lingering sparkline)', close.pvAfter === 0, `len=${close.pvAfter}`);
  assert('P5.d — hub re-opens', close.reopened === true, `reopened=${close.reopened}`);
  assert('P5.e — backdrop click closes hub', close.displayAfterBackdrop === 'none', `display=${close.displayAfterBackdrop}`);

  // ============================================================
  // P6: tier gating — g12 hides the 3 g15 tabs; g15 shows all 5
  // ============================================================
  const gating = await evaluate(ws, `(async () => {
    const ui = window.game.ui;
    const readTabs = () => {
      const ids = { achievements:'phub-tab-achievements', mastery:'phub-tab-mastery', customize:'phub-tab-customize', collection:'phub-tab-collection', profile:'phub-tab-profile' };
      const out = {};
      for (const [k, id] of Object.entries(ids)) {
        const t = document.getElementById(id);
        out[k] = t ? getComputedStyle(t).display !== 'none' : null;
      }
      return out;
    };
    // g12: seed 12, open hub, read tab visibility.
    window.game.seedProgress(0, { clear: true });
    window.game.seedProgress(12, { stars: 3 });
    await new Promise(r => setTimeout(r, 150));
    document.getElementById('profile-hub-btn').click();
    await new Promise(r => setTimeout(r, 200));
    const at12 = readTabs();
    const active12 = ui._activeProfileTab;
    document.getElementById('profile-hub-close').click();
    await new Promise(r => setTimeout(r, 100));
    // g15: seed to 15, re-open.
    window.game.seedProgress(15, { stars: 3 });
    await new Promise(r => setTimeout(r, 150));
    document.getElementById('profile-hub-btn').click();
    await new Promise(r => setTimeout(r, 200));
    const at15 = readTabs();
    document.getElementById('profile-hub-close').click();
    return { at12, active12, at15 };
  })()`);
  console.log(`\n[Gating] ${JSON.stringify(gating)}`);
  assert('P6.a — g12: Achievements + Customize tabs visible', gating.at12.achievements === true && gating.at12.customize === true, JSON.stringify(gating.at12));
  assert('P6.b — g12: Mastery/Collection/Logic tabs hidden', gating.at12.mastery === false && gating.at12.collection === false && gating.at12.profile === false, JSON.stringify(gating.at12));
  assert('P6.c — g12: active tab is a visible one (no strand)', gating.active12 === 'achievements' || gating.active12 === 'customize', `active=${gating.active12}`);
  assert('P6.d — g15: all 5 tabs visible', Object.values(gating.at15).every(v => v === true), JSON.stringify(gating.at15));

  // ============================================================
  // P7: end-game — 5 old collection buttons gone; hub button present+visible
  // ============================================================
  const endgame = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    window.game.seedProgress(18, { stars: 3 });
    await new Promise(r => setTimeout(r, 150));
    window.game.showLevelSelect();
    await new Promise(r => setTimeout(r, 200));
    const oldBtns = ['achievements-btn','customize-btn','mastery-tree-btn','collection-btn','profile-btn'];
    const oldPresent = oldBtns.filter(id => !!document.getElementById(id));
    const hubBtn = document.getElementById('profile-hub-btn');
    const hubVisible = visible(hubBtn);
    const ls = document.getElementById('level-select-screen');
    const navCount = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    return { oldPresent, hubVisible, navCount };
  })()`);
  console.log(`\n[Endgame] ${JSON.stringify(endgame)}`);
  assert('P7.a — 5 old collection buttons removed from DOM', endgame.oldPresent.length === 0, `present=${JSON.stringify(endgame.oldPresent)}`);
  assert('P7.b — single 🗂️ Profile hub button visible at end-game', endgame.hubVisible === true, `hubVisible=${endgame.hubVisible}`);
  console.log(`   (end-game nav-button count = ${endgame.navCount})`);

  // ============================================================
  // P8: cold-start invariants + Day 79 dead-id purge
  // ============================================================
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_cold' });
  await wait(4000);
  const cold = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 250));
    const ls = document.getElementById('level-select-screen');
    const navCount = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    const cardCount = [...ls.querySelectorAll('.level-btn')].length;
    const hubVisibleCold = visible(document.getElementById('profile-hub-btn'));
    const ids = ['showFirstLaunchDifficultyModal','checkLightning','checkEclipseRun','checkArchitect','isMythic','_showHud','getCurrentStep'];
    const undefinedCount = ids.filter(n => typeof window[n] === 'undefined').length;
    const weeklyAbsent = !document.getElementById('weekly-puzzle-btn');
    return { navCount, cardCount, hubVisibleCold, undefinedCount, total: ids.length, weeklyAbsent };
  })()`);
  console.log(`\n[Cold] ${JSON.stringify(cold)}`);
  assert('P8.a — cold: 2 nav buttons (Day 78 invariant)', cold.navCount === 2, `got ${cold.navCount}`);
  assert('P8.b — cold: 50 level cards (Day 109 invariant)', cold.cardCount === 50, `got ${cold.cardCount}`);
  assert('P8.c — cold: Profile hub button hidden (reveals at g12)', cold.hubVisibleCold === false, `hubVisibleCold=${cold.hubVisibleCold}`);
  assert('P8.d — 7 dead identifiers still undefined', cold.undefinedCount === cold.total, `${cold.undefinedCount}/${cold.total}`);
  assert('P8.e — #weekly-puzzle-btn DOM absent', cold.weeklyAbsent === true, `weeklyAbsent=${cold.weeklyAbsent}`);

  // ============================================================
  // P9: console hygiene
  // ============================================================
  assert('P9.a — 0 console.error', consoleErrors.length === 0, `errors=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''}`);
  assert('P9.b — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, `exceptions=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.slice(0,3).join(' | ') : ''}`);

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Day 124 QA — Collection-Modal Merge → tabbed Profile hub`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`console.error: ${consoleErrors.length} | Runtime.exceptionThrown: ${runtimeExceptions.length}`);
  console.log(`${'='.repeat(60)}`);
  if (passed !== total) {
    console.log('\nFAILURES:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name} — ${r.detail || ''}`));
  }

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('HARNESS ERROR:', err); process.exit(2); });
