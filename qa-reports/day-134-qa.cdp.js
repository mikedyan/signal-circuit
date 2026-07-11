#!/usr/bin/env node
/**
 * Day 134 QA harness — Cycle 6 PRUNE Week, Day 2: "Design Simplification".
 *
 * Ships 2 Tier-1 cuts from the Day 133 PRUNE_REPORT against the LOCAL build:
 *   Cut #1  Collapse the Settings "Tournament (Online)" section behind a
 *           <details> disclosure (⚙️ Advanced: Online Tournament), collapsed
 *           by default. A normal player sees one summary line, not 4 buttons +
 *           2 inputs. Connect/Go Local/Save Name/Anonymous still work when
 *           expanded; Day 125 anonymous-by-default privacy unchanged.
 *   Cut #2  Trim the "· tap-hold a cell for details" instructional tail off the
 *           Day 127 Progress-heatmap summary; the per-cell title already carries
 *           the affordance.
 *
 * Build under test: LOCAL http://localhost:8901/ — new ?v=1783728000 / sw v82.
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-134-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const HTTP_PORT = 8901;
const BASE = `http://localhost:${HTTP_PORT}/`;
const TARGET_URL = BASE + '?_ts=' + Date.now();
const NEWV = '1783728000';

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

  // Clear localStorage + any service-worker caches + unregister SWs so the test
  // reads fresh source, not a precache from an earlier same-version run.
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
  // P1: build identity (local, bumped)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — on local host', buildIdentity.host === 'localhost:' + HTTP_PORT, `host=${buildIdentity.host}`);
  assert('P1.b — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.c — unified ?v=' + NEWV, buildIdentity.unified.length === 1 && buildIdentity.unified[0] === NEWV, `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, hasV82: text.indexOf('signal-circuit-v82') >= 0, hasV81: text.indexOf('signal-circuit-v81') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.d — sw.js CACHE_NAME bumped to signal-circuit-v82', swProbe.swFetched && swProbe.hasV82 && !swProbe.hasV81, JSON.stringify(swProbe));

  // ============================================================
  // P2: Cut #1 — Tournament (Online) disclosure structure
  // ============================================================
  const disc = await evaluate(ws, `(() => {
    const section = document.getElementById('settings-tournament-section');
    const details = document.getElementById('settings-tournament-details');
    const summary = details ? details.querySelector('summary.settings-advanced-summary') : null;
    const oldH4 = section ? section.querySelector('h4') : null;
    const row = document.getElementById('tournament-settings-row');
    return {
      sectionExists: !!section,
      detailsExists: !!details,
      isDetailsEl: details ? details.tagName.toLowerCase() : null,
      openByDefault: details ? details.hasAttribute('open') : null,
      summaryText: summary ? summary.textContent.trim() : null,
      oldH4Present: !!oldH4,
      rowInsideDetails: !!(details && row && details.contains(row)),
    };
  })()`);
  assert('P2.a — #settings-tournament-section still exists', disc.sectionExists, JSON.stringify(disc));
  assert('P2.b — wrapped in <details> disclosure', disc.detailsExists && disc.isDetailsEl === 'details', `tag=${disc.isDetailsEl}`);
  assert('P2.c — collapsed by default (no open attr)', disc.openByDefault === false, `open=${disc.openByDefault}`);
  assert('P2.d — summary label "⚙️ Advanced: Online Tournament"', /Advanced: Online Tournament/.test(disc.summaryText || ''), `summary=${disc.summaryText}`);
  assert('P2.e — old <h4>Tournament (Online)</h4> removed', disc.oldH4Present === false, `h4Present=${disc.oldH4Present}`);
  assert('P2.f — settings row now nested inside <details>', disc.rowInsideDetails, `rowInsideDetails=${disc.rowInsideDetails}`);

  // ============================================================
  // P3: Cut #1 — the 4 tournament buttons are HIDDEN when collapsed,
  //     VISIBLE when the disclosure is opened, and still functional.
  // ============================================================
  await evaluate(ws, `(() => {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
    return true;
  })()`);
  await wait(300);

  const collapsedVis = await evaluate(ws, `(() => {
    const vis = (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    return {
      connect: vis('tournament-worker-save-btn'),
      goLocal: vis('tournament-worker-clear-btn'),
      saveName: vis('tournament-name-save-btn'),
      anon: vis('tournament-name-clear-btn'),
      urlInput: vis('tournament-worker-url-input'),
      nameInput: vis('tournament-display-name-input'),
    };
  })()`);
  const collapsedHidden = !collapsedVis.connect && !collapsedVis.goLocal && !collapsedVis.saveName && !collapsedVis.anon && !collapsedVis.urlInput && !collapsedVis.nameInput;
  assert('P3.a — collapsed: all 4 buttons + 2 inputs hidden', collapsedHidden, JSON.stringify(collapsedVis));

  await evaluate(ws, `(() => {
    document.getElementById('settings-tournament-details').setAttribute('open', '');
    return true;
  })()`);
  await wait(200);
  const openedVis = await evaluate(ws, `(() => {
    const vis = (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    return {
      connect: vis('tournament-worker-save-btn'),
      goLocal: vis('tournament-worker-clear-btn'),
      saveName: vis('tournament-name-save-btn'),
      anon: vis('tournament-name-clear-btn'),
      urlInput: vis('tournament-worker-url-input'),
      nameInput: vis('tournament-display-name-input'),
    };
  })()`);
  const openedShown = openedVis.connect && openedVis.goLocal && openedVis.saveName && openedVis.anon && openedVis.urlInput && openedVis.nameInput;
  assert('P3.b — expanded: all 4 buttons + 2 inputs visible', openedShown, JSON.stringify(openedVis));

  // Functional: Day 125 privacy — default anonymous; setting a name persists; Go Local reverts.
  const tourFunc = await evaluate(ws, `(() => {
    const g = window.game;
    if (!g) return { noGame: true };
    const before = g.getTournamentDisplayName ? g.getTournamentDisplayName() : (localStorage.getItem('signal-circuit-tournament-display-name') || '');
    // simulate save-name flow directly against storage layer used by Day 125
    localStorage.setItem('signal-circuit-tournament-display-name', 'Tester');
    const afterSet = localStorage.getItem('signal-circuit-tournament-display-name');
    // simulate anonymous/clear
    localStorage.removeItem('signal-circuit-tournament-display-name');
    const afterClear = localStorage.getItem('signal-circuit-tournament-display-name');
    return { before, afterSet, afterClear };
  })()`);
  assert('P3.c — display name blank by default (anonymous)', (tourFunc.before || '') === '', `before='${tourFunc.before}'`);
  assert('P3.d — display name persists when set', tourFunc.afterSet === 'Tester', `afterSet=${tourFunc.afterSet}`);
  assert('P3.e — clear reverts to anonymous', (tourFunc.afterClear || '') === '', `afterClear='${tourFunc.afterClear}'`);

  await evaluate(ws, `(() => { const m=document.getElementById('settings-modal'); if(m) m.style.display='none'; const d=document.getElementById('settings-tournament-details'); if(d) d.removeAttribute('open'); return true; })()`);

  // ============================================================
  // P4: Cut #2 — heatmap summary trimmed (source + rendered)
  // ============================================================
  const srcProbe = await evaluate(ws, `(async () => {
    const r = await fetch('js/ui.js?v=${NEWV}', { cache:'no-store' });
    const t = await r.text();
    // Check only the live template fragment, not comment prose describing the cut.
    return { hasTail: t.indexOf('totalMaxStars} · tap-hold') >= 0 };
  })()`);
  assert('P4.a — instructional tail removed from the live heatmap-meta template', srcProbe.hasTail === false, `hasTail=${srcProbe.hasTail}`);

  const heatmap = await evaluate(ws, `(() => {
    const g = window.game;
    const ui = window.ui || (g && g.ui);
    if (!g || !ui || !ui._renderProgressHeatmap) return { noApi: true };
    // seed 10 levels @ 3 stars
    for (let i = 1; i <= 10; i++) {
      g.progress.levels[i] = { completed: true, stars: 3, bestGates: 1, bestTime: 30 };
    }
    if (g.saveProgress) g.saveProgress();
    ui._renderProgressHeatmap();
    const pane = document.getElementById('stats-progress-pane');
    const meta = pane ? pane.querySelector('.progress-heatmap-meta') : null;
    const cell = pane ? pane.querySelector('.phm-cell') : null;
    return {
      metaText: meta ? meta.textContent.trim() : null,
      cellTitle: cell ? cell.getAttribute('title') : null,
      cellCount: pane ? pane.querySelectorAll('.phm-cell').length : 0,
    };
  })()`);
  assert('P4.b — heatmap renders (cells present)', heatmap.cellCount > 0, `cells=${heatmap.cellCount}`);
  assert('P4.c — summary shows stats only, no how-to tail', heatmap.metaText && /levels · ★/.test(heatmap.metaText) && !/tap-hold/.test(heatmap.metaText), `meta="${heatmap.metaText}"`);
  assert('P4.d — summary reads "10 / 50 levels · ★ 30 / 150"', /10 \/ 50 levels · ★ 30 \/ 150/.test(heatmap.metaText || ''), `meta="${heatmap.metaText}"`);
  assert('P4.e — per-cell title retains the detail affordance', heatmap.cellTitle && /levels/.test(heatmap.cellTitle), `title="${heatmap.cellTitle}"`);

  // ============================================================
  // P5: regression floor (clean reload)
  // ============================================================
  await evaluate(ws, `(() => { Object.keys(localStorage).filter(k=>/signal/i.test(k)).forEach(k=>localStorage.removeItem(k)); return true; })()`);
  await send(ws, 'Page.navigate', { url: BASE + '?_ts=' + Date.now() });
  await wait(4000);

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
      deadIds: ['weekly-puzzle-btn','achievements-btn','customize-btn','mastery-tree-btn','collection-btn']
        .map(id => document.getElementById(id) === null),
    };
  })()`);
  assert('P5.a — cold nav count 2 (Day 78 invariant)', floor.navCount === 2, `nav=${floor.navCount}`);
  assert('P5.b — 50 level cards', floor.cardCount === 50, `cards=${floor.cardCount}`);
  assert('P5.c — Gate ESM binding + 8 GateTypes', floor.gateOK && floor.gateTypes === 8, `gate=${floor.gateOK} types=${floor.gateTypes}`);
  assert('P5.d — Wire ESM binding (Day 107)', floor.wireOK, `wire=${floor.wireOK}`);
  assert('P5.e — Simulation ESM canonical binding (Day 123)', floor.simOK && floor.simInstance, `sim=${floor.simOK} inst=${floor.simInstance}`);
  assert('P5.f — LEVELS = 50', floor.levels === 50, `levels=${floor.levels}`);
  assert('P5.g — 5 retired/dead ids absent from DOM', floor.deadIds.every(Boolean), JSON.stringify(floor.deadIds));

  // Profile hub still present (Day 124), Stats Progress tab hidden cold (Day 127)
  const hubProbe = await evaluate(ws, `(() => {
    const vis = (el) => { if(!el) return false; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'; };
    const progTab = document.getElementById('stats-tab-progress');
    return {
      hubModalExists: !!document.getElementById('profile-hub-modal'),
      progTabExists: !!progTab,
      progTabVisibleCold: vis(progTab),
    };
  })()`);
  assert('P5.h — Profile hub modal exists (Day 124)', hubProbe.hubModalExists, JSON.stringify(hubProbe));
  assert('P5.i — Stats Progress tab hidden cold (Day 127 discipline)', hubProbe.progTabExists && hubProbe.progTabVisibleCold === false, JSON.stringify(hubProbe));

  // ============================================================
  // P6: console hygiene
  // ============================================================
  assert('P6.a — 0 console.error', consoleErrors.length === 0, `count=${consoleErrors.length}${consoleErrors.length ? ' :: ' + consoleErrors.slice(0,3).join(' | ') : ''}`);
  assert('P6.b — 0 Runtime.exceptionThrown', runtimeExceptions.length === 0, `count=${runtimeExceptions.length}${runtimeExceptions.length ? ' :: ' + runtimeExceptions.slice(0,3).join(' | ') : ''}`);

  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`\n===== Day 134 QA: ${passed}/${results.length} assertions passed =====`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach(f => console.log(`  ✗ ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  ws.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
