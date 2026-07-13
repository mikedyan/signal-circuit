#!/usr/bin/env node
/**
 * Day 136 QA harness — Cycle 6 PRUNE Week, Day 4: "Polish Sprint".
 *
 * Ships the 2 Tier-3 polish cuts from the Day 133 PRUNE_REPORT + a cold-start
 * defaults re-audit, against the LOCAL build:
 *
 *   Cut #6 — Tournament mode-label cross-fade. The Day 93 four-state connection
 *   label (🏠 Local / 🌐 Live / 🌐 Live · offline / 🌐 Connecting…) used to SNAP
 *   when describe() flipped state after the async reachability probe landed. New
 *   UI._crossfadeLabel(el, text) fades the label out (opacity → 0 over 130ms via
 *   the .label-crossfade-out CSS rule), swaps the text, fades back in — but only
 *   when the text actually changed, and never under prefers-reduced-motion.
 *   Wired into showTournamentScreen()'s async repaints + updateTournament
 *   ConnectionStatus()'s settings-modal repaint.
 *
 *   Cut #7 — Progress-heatmap cell detail popover. The Day 127 .phm-cell tiles
 *   had only a bare native `title` tooltip (kept for a11y). Each cell now carries
 *   a pure-CSS .phm-pop child (chapter name + N/M levels + ★earned/max) shown on
 *   :hover / :focus-within / :focus. Cells gained tabindex="0" + role=button so
 *   the popover is discoverable via tap (mobile) and keyboard Tab, not just mouse.
 *   No JS wiring, no orphaned body element — self-cleaning with the cell.
 *
 *   Cold-start defaults re-audit (Day 80/105 precedent): SFX 0.4 / Music 0.2 /
 *   theme auto / difficulty silent-default standard / 2 cold nav buttons / 50
 *   cards — all unchanged.
 *
 * Build under test: LOCAL http://localhost:8901/ — new ?v=1783900800 / sw v84.
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-136-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const HTTP_PORT = 8901;
const BASE = `http://localhost:${HTTP_PORT}/`;
const TARGET_URL = BASE + '?_ts=' + Date.now();
const NEWV = '1783900800';

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

  // Fresh read: clear localStorage + SW caches + unregister SWs (Day 134 lesson).
  await evaluate(ws, `(async () => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    try {
      if ('caches' in self) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
      if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
    } catch (e) {}
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: BASE + '?_ts=' + Date.now() });
  await wait(4500);

  consoleErrors.length = 0;
  runtimeExceptions.length = 0;

  const results = [];
  const assert = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // ============================================================
  // P1: build identity (local, bumped to ?v=1783900800 / sw v84)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    return { count: links.length, unified: [...new Set(links)], host: location.host };
  })()`);
  assert('P1.a — on local host', buildIdentity.host === 'localhost:' + HTTP_PORT, `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=' + NEWV, buildIdentity.unified.length === 1 && buildIdentity.unified[0] === NEWV, `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, hasV84: text.indexOf('signal-circuit-v84') >= 0, hasV83: text.indexOf('signal-circuit-v83') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js CACHE_NAME bumped to signal-circuit-v84', swProbe.swFetched && swProbe.hasV84 && !swProbe.hasV83, JSON.stringify(swProbe));

  // ============================================================
  // P2: Cut #6 — tournament mode-label cross-fade
  // ============================================================
  const cf = await evaluate(ws, `(() => {
    const ui = window.game && window.game.ui;
    return { hasMethod: ui && typeof ui._crossfadeLabel === 'function' };
  })()`);
  assert('P2.a — UI._crossfadeLabel is a function', cf.hasMethod, JSON.stringify(cf));

  // CSS: transition + .label-crossfade-out rule present on both labels.
  const cfCss = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('css/style.css?v=${NEWV}', { cache: 'no-store' });
      const t = await r.text();
      return {
        hasTransition: /#tournament-mode-label[\\s\\S]{0,120}transition:\\s*opacity/.test(t),
        hasOutRule: /label-crossfade-out\\s*\\{\\s*opacity:\\s*0/.test(t),
        hasReducedGuard: /prefers-reduced-motion[\\s\\S]{0,260}tournament-mode-label/.test(t) || /tournament-mode-label[\\s\\S]{0,260}transition:\\s*none/.test(t),
      };
    } catch (e) { return { error: String(e) }; }
  })()`);
  assert('P2.b — CSS opacity transition on mode label', cfCss.hasTransition, JSON.stringify(cfCss));
  assert('P2.c — .label-crossfade-out { opacity:0 } rule present', cfCss.hasOutRule, `hasOutRule=${cfCss.hasOutRule}`);
  assert('P2.d — reduced-motion guard present for labels', cfCss.hasReducedGuard, `guard=${cfCss.hasReducedGuard}`);

  // Behavioral: changing text via _crossfadeLabel arms .label-crossfade-out,
  // then settles to the new text; unchanged text is an immediate no-op (no class).
  const cfBehavior = await evaluate(ws, `(async () => {
    const ui = window.game.ui;
    // build a throwaway span to exercise the helper deterministically
    const el = document.createElement('span');
    el.textContent = '🌐 Connecting…';
    document.body.appendChild(el);
    // 1) same text → no-op, no class added
    ui._crossfadeLabel(el, '🌐 Connecting…');
    const sameNoClass = !el.classList.contains('label-crossfade-out');
    const sameText = el.textContent;
    // 2) changed text → class armed immediately
    ui._crossfadeLabel(el, '🌐 Live · offline');
    const armed = el.classList.contains('label-crossfade-out');
    // wait for the 130ms swap
    await new Promise(r => setTimeout(r, 220));
    const settledText = el.textContent;
    const settledNoClass = !el.classList.contains('label-crossfade-out');
    el.remove();
    return { sameNoClass, sameText, armed, settledText, settledNoClass };
  })()`);
  assert('P2.e — unchanged text is a no-op (no fade class)', cfBehavior.sameNoClass && cfBehavior.sameText === '🌐 Connecting…', JSON.stringify(cfBehavior));
  assert('P2.f — changed text arms .label-crossfade-out immediately', cfBehavior.armed === true, `armed=${cfBehavior.armed}`);
  assert('P2.g — text settles to new value + class cleared', cfBehavior.settledText === '🌐 Live · offline' && cfBehavior.settledNoClass, JSON.stringify(cfBehavior));

  // Wiring: the async repaints in showTournamentScreen + settings status use the
  // crossfade helper (served-source check — the snap setText calls were replaced).
  const cfWire = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('js/ui.js?v=${NEWV}', { cache: 'no-store' });
      const t = await r.text();
      const crossCalls = (t.match(/_crossfadeLabel\\(/g) || []).length;
      // the initial (first-paint) label set stays a direct setText — one such line remains
      const stillHasInitialSet = /setText\\('tournament-mode-label', modeLabel\\)/.test(t);
      return { crossCalls, stillHasInitialSet };
    } catch (e) { return { error: String(e) }; }
  })()`);
  // 1 definition + at least 3 call sites (2 tournament async repaints + 1 settings repaint)
  assert('P2.h — _crossfadeLabel wired into async repaints (def + ≥3 uses)', cfWire.crossCalls >= 4, `crossCalls=${cfWire.crossCalls}`);
  assert('P2.i — first-paint label still direct (no gratuitous fade on open)', cfWire.stillHasInitialSet === true, `initial=${cfWire.stillHasInitialSet}`);

  // ============================================================
  // P3: Cut #7 — progress-heatmap cell detail popover
  // ============================================================
  // Seed 10 completions so the Progress tab is available + heatmap renders.
  await evaluate(ws, `(() => { if (window.game && window.game.seedProgress) window.game.seedProgress(10, {stars:3}); return true; })()`);
  await wait(400);

  // Open Stats modal + switch to Progress tab.
  const openStats = await evaluate(ws, `(() => {
    const ui = window.game.ui;
    if (typeof ui.showStats === 'function') ui.showStats();
    else { const b = document.getElementById('stats-btn'); if (b) b.click(); }
    if (typeof ui._switchStatsTab === 'function') ui._switchStatsTab('progress');
    const pane = document.getElementById('stats-progress-pane');
    const cells = pane ? pane.querySelectorAll('.phm-cell') : [];
    const first = cells[0] || null;
    const pop = first ? first.querySelector('.phm-pop') : null;
    return {
      paneVisible: pane ? getComputedStyle(pane).display !== 'none' : false,
      cellCount: cells.length,
      firstHasTabindex: first ? first.getAttribute('tabindex') === '0' : false,
      firstRole: first ? first.getAttribute('role') : null,
      hasPopChild: !!pop,
      popText: pop ? pop.textContent : '',
    };
  })()`);
  assert('P3.b — Progress pane visible + cells render', openStats.paneVisible && openStats.cellCount > 0, JSON.stringify(openStats));
  assert('P3.c — cells are keyboard-focusable (tabindex=0, role=button)', openStats.firstHasTabindex && openStats.firstRole === 'button', JSON.stringify({ tab: openStats.firstHasTabindex, role: openStats.firstRole }));
  assert('P3.d — cell has .phm-pop child with title + N/M levels + ★', openStats.hasPopChild && /levels/.test(openStats.popText) && openStats.popText.indexOf('★') >= 0, JSON.stringify(openStats));

  // Focus a cell → :focus / :focus-within makes the .phm-pop child visible.
  // Wait past the .14s opacity transition before sampling the settled value.
  const popShow = await evaluate(ws, `(async () => {
    const pane = document.getElementById('stats-progress-pane');
    const cell = pane.querySelector('.phm-cell');
    const pop = cell.querySelector('.phm-pop');
    const opacityBefore = getComputedStyle(pop).opacity;
    cell.focus();
    await new Promise(r => setTimeout(r, 280));
    const opacityFocused = getComputedStyle(pop).opacity;
    const isFocused = document.activeElement === cell;
    return { opacityBefore, opacityFocused, isFocused };
  })()`);
  assert('P3.e — .phm-pop hidden by default (opacity 0)', parseFloat(popShow.opacityBefore) === 0, JSON.stringify(popShow));
  assert('P3.f — .phm-pop visible on cell focus (:focus/:focus-within → opacity 1)', popShow.isFocused && parseFloat(popShow.opacityFocused) >= 0.9, JSON.stringify(popShow));

  // Blur hides it again (computed opacity returns to 0 after the fade-out).
  const popHide = await evaluate(ws, `(async () => {
    const pane = document.getElementById('stats-progress-pane');
    const cell = pane.querySelector('.phm-cell');
    cell.blur();
    if (document.activeElement) document.activeElement.blur();
    await new Promise(r => setTimeout(r, 280));
    const pop = cell.querySelector('.phm-pop');
    return { opacity: getComputedStyle(pop).opacity };
  })()`);
  assert('P3.g — .phm-pop hides on blur (opacity back to 0)', parseFloat(popHide.opacity) <= 0.1, `opacity=${popHide.opacity}`);

  // Native title kept for a11y fallback.
  const titleKept = await evaluate(ws, `(() => {
    const cell = document.querySelector('#stats-progress-pane .phm-cell');
    return { hasTitle: cell ? !!cell.getAttribute('title') : false };
  })()`);
  assert('P3.h — native title attr retained for a11y', titleKept.hasTitle, `hasTitle=${titleKept.hasTitle}`);

  // Close stats.
  await evaluate(ws, `(() => { const c = document.getElementById('stats-close') || document.getElementById('close-stats'); if (c) c.click(); const m = document.getElementById('stats-modal'); if (m) m.style.display='none'; return true; })()`);

  // ============================================================
  // P4: cold-start defaults re-audit (clean reload)
  // ============================================================
  await evaluate(ws, `(() => { Object.keys(localStorage).filter(k=>/signal/i.test(k)).forEach(k=>localStorage.removeItem(k)); return true; })()`);
  await send(ws, 'Page.navigate', { url: BASE + '?_ts=' + Date.now() });
  await wait(4000);

  const defaults = await evaluate(ws, `(() => {
    const g = window.game;
    const sfx = (g && g.audio) ? g.audio.sfxVolume : undefined;
    const music = (g && g.audio) ? g.audio.musicVolume : undefined;
    let diff = null;
    try { diff = (typeof g.getDifficultyMode === 'function') ? g.getDifficultyMode() : (g.difficultyMode || (g.settings && g.settings.difficultyMode)); } catch(e){}
    // any onboarding modal forced up on cold start?
    const modalUp = [...document.querySelectorAll('.modal, [id$="-modal"]')].some(m => getComputedStyle(m).display === 'flex' && !/tutorial/i.test(m.id));
    return {
      sfx, music, diff,
      themeAttr: document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('light-mode') ? 'light' : 'auto/dark'),
      lightModeClass: document.body.classList.contains('light-mode'),
      modalUp,
    };
  })()`);
  assert('P4.a — SFX default 0.4', Math.abs((defaults.sfx ?? -1) - 0.4) < 0.001, `sfx=${defaults.sfx}`);
  assert('P4.b — Music default 0.2', Math.abs((defaults.music ?? -1) - 0.2) < 0.001, `music=${defaults.music}`);
  assert('P4.c — difficulty silent-default standard', defaults.diff === 'standard', `diff=${defaults.diff}`);
  assert('P4.d — no forced onboarding modal on cold start', defaults.modalUp === false, `modalUp=${defaults.modalUp}`);

  // ============================================================
  // P5: regression floor
  // ============================================================
  const floor = await evaluate(ws, `(() => {
    const vis = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const ls = document.getElementById('level-select') || document;
    const navBtns = [...ls.querySelectorAll('button')].filter(b =>
      !b.classList.contains('level-btn') &&
      !b.classList.contains('level-overflow-btn') && vis(b));
    const cards = [...document.querySelectorAll('.level-btn')].filter(vis);
    return {
      navCount: navBtns.length,
      cardCount: cards.length,
      gateOK: typeof window.Gate === 'function',
      gateTypes: window.GateTypes ? Object.keys(window.GateTypes).length : 0,
      wireOK: typeof window.Wire === 'function',
      simOK: typeof window.Simulation === 'function',
      simInstance: !!(window.game && window.game.simulation instanceof window.Simulation),
      levels: (typeof getLevelCount === 'function' ? getLevelCount() : 0),
      deadIds: ['weekly-puzzle-btn','achievements-btn','customize-btn','mastery-tree-btn','collection-btn','profile-btn']
        .map(id => document.getElementById(id) === null),
      hubModalExists: !!document.getElementById('profile-hub-modal'),
      hubBtnExists: !!document.getElementById('profile-hub-btn'),
    };
  })()`);
  assert('P5.a — cold nav count 2 (Day 78 invariant)', floor.navCount === 2, `nav=${floor.navCount}`);
  assert('P5.b — 50 level cards', floor.cardCount === 50, `cards=${floor.cardCount}`);
  assert('P5.c — Gate ESM binding + 8 GateTypes', floor.gateOK && floor.gateTypes === 8, `gate=${floor.gateOK} types=${floor.gateTypes}`);
  assert('P5.d — Wire ESM binding (Day 107)', floor.wireOK, `wire=${floor.wireOK}`);
  assert('P5.e — Simulation ESM canonical binding (Day 123)', floor.simOK && floor.simInstance, `sim=${floor.simOK} inst=${floor.simInstance}`);
  assert('P5.f — LEVELS = 50', floor.levels === 50, `levels=${floor.levels}`);
  assert('P5.g — 6 retired/dead ids absent from DOM', floor.deadIds.every(Boolean), JSON.stringify(floor.deadIds));
  assert('P5.h — Profile hub modal + button present (Day 124)', floor.hubModalExists && floor.hubBtnExists, JSON.stringify({ m: floor.hubModalExists, b: floor.hubBtnExists }));

  // ============================================================
  // P6: console hygiene
  // ============================================================
  assert('P6.a — 0 console.error', consoleErrors.length === 0, `count=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''}`);
  assert('P6.b — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, `count=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.slice(0,3).join(' | ') : ''}`);

  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`\n===== Day 136 QA: ${passed}/${results.length} assertions passed =====`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach(f => console.log(`  ✗ ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  ws.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
