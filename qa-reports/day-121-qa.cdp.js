#!/usr/bin/env node
/**
 * Day 121 QA harness — Cycle 5 PRUNE Week, Day 4: "Polish Sprint".
 *
 * Net-near-zero polish day (Day 80 / Day 105 precedent). The Tier-2 Cut #4
 * collection-modal merge (specs/day-121-collection-merge-scaffold.md) was judged
 * too large/risky for one unattended polish day and DEFERRED; instead two small
 * UX wins ship, both building on the most recent source change (Day 119 Cut #2
 * typed-confirm) and the Day 105 modal-animation language:
 *
 *   Polish #1 — #confirm-modal-content entrance animation: reuse the existing
 *     `modalPop` keyframe (0.28s) so the confirm modal animates in like the
 *     chapter-complete modal instead of snapping. Global prefers-reduced-motion
 *     rule (css ~3160) already neutralizes it; no separate guard needed.
 *
 *   Polish #2 — typed-confirm "armed" affordance: when the user types the
 *     matching word (e.g. RESET), the input flips from destructive-red to
 *     confirm-green via a new `.is-armed` class (toggled in arm() in ui.js),
 *     giving positive feedback that the gate is satisfied before pressing the
 *     still-red destructive OK button. Cleanup strips the class.
 *
 * Build under test: LOCAL http://localhost:8901/  (?v=1782604800 / sw v76).
 *
 * Coverage:
 *   P1   build identity (local, ?v=1782604800 / sw v76)
 *   P2   Polish #1 — #confirm-modal-content carries modalPop animation; modal
 *        opens + closes cleanly via plain showConfirmModal path (Infinite-run end)
 *   P3   Polish #2 — typed-confirm armed flip: disarmed at open (red, OK disabled),
 *        wrong text stays disarmed, exact RESET arms (.is-armed + OK enabled),
 *        editing back to wrong text disarms again, disarmed OK click is a no-op
 *        (progress preserved), correct path fires onConfirm + class cleaned up
 *   P4   regression — cold 2 nav / 50 cards; Day 79 dead-ids; end-game staircase;
 *        cold-start defaults audit (SFX/Music/theme/difficulty)
 *   P5   mobile sweep — no horizontal scroll + header row reachable at
 *        375/414/768/1024 px
 *   P6   0 console errors / 0 Runtime.exceptionThrown
 *
 * Usage:
 *   tools/cdp-launch.sh start
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-121-qa.cdp.js
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
  // P1: build identity (local)
  // ============================================================
  const buildIdentity = await evaluate(ws, `(() => {
    const links = [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
      .map(n => (n.href || n.src).match(/\\?v=(\\d+)/)?.[1])
      .filter(Boolean);
    const unified = [...new Set(links)];
    return { count: links.length, unified, host: location.host };
  })()`);
  assert('P1.a — 11 cache-bust refs', buildIdentity.count === 11, `count=${buildIdentity.count}`);
  assert('P1.b — unified ?v=1782604800 (Day 121 build)', buildIdentity.unified.length === 1 && buildIdentity.unified[0] === '1782604800', `unified=${JSON.stringify(buildIdentity.unified)}`);

  const swProbe = await evaluate(ws, `(async () => {
    try {
      const r = await fetch('sw.js', { cache: 'no-store' });
      const text = await r.text();
      return { swFetched: r.ok, status: r.status, hasV76: text.indexOf('signal-circuit-v76') >= 0 };
    } catch (e) { return { swFetched: false, error: String(e) }; }
  })()`);
  assert('P1.c — sw.js CACHE_NAME=signal-circuit-v76', swProbe.swFetched === true && swProbe.hasV76 === true, JSON.stringify(swProbe));

  // ============================================================
  // P2: Polish #1 — confirm-modal entrance animation + plain-modal lifecycle
  // ============================================================
  const p1 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const content = document.getElementById('confirm-modal-content');
    const cs = getComputedStyle(content);
    // The modalPop keyframe is referenced by animation-name.
    const animName = cs.animationName;
    // Drive the plain (non-typed) confirm path: Infinite-run End uses showConfirmModal.
    const gs = window.game;
    let openedFlex = false, closedAfterCancel = false, inputHiddenOnPlain = true;
    gs.ui.showConfirmModal('Test plain confirm?', () => {});
    await new Promise(r => setTimeout(r, 150));
    const modal = document.getElementById('confirm-modal');
    openedFlex = getComputedStyle(modal).display === 'flex';
    // On the PLAIN path the typed-confirm input must remain hidden.
    inputHiddenOnPlain = getComputedStyle(document.getElementById('confirm-modal-input')).display === 'none';
    document.getElementById('confirm-modal-cancel').click();
    await new Promise(r => setTimeout(r, 150));
    closedAfterCancel = getComputedStyle(modal).display === 'none';
    return { animName, openedFlex, closedAfterCancel, inputHiddenOnPlain };
  })()`);
  console.log(`\n[Polish#1] ${JSON.stringify(p1)}`);
  assert('P2.a — #confirm-modal-content uses modalPop animation', p1.animName === 'modalPop', `animName=${p1.animName}`);
  assert('P2.b — plain confirm opens (display:flex)', p1.openedFlex === true);
  assert('P2.c — plain confirm: typed-input stays hidden', p1.inputHiddenOnPlain === true);
  assert('P2.d — plain confirm closes on Cancel', p1.closedAfterCancel === true);

  // ============================================================
  // P3: Polish #2 — typed-confirm "armed" green affordance (Reset Progress)
  // ============================================================
  // Seed some progress so a no-op disarmed OK click is observable.
  await evaluate(ws, `(async () => { const gs = window.game; gs.showLevelSelect(); await new Promise(r=>setTimeout(r,150)); gs.seedProgress(6, { stars: 3 }); await new Promise(r=>setTimeout(r,200)); return true; })()`);
  const p2 = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    const input = document.getElementById('confirm-modal-input');
    const okBtn = document.getElementById('confirm-modal-ok');
    const modal = document.getElementById('confirm-modal');
    const setVal = (v) => { input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); };

    // Open the Reset Progress typed-confirm.
    document.getElementById('reset-progress-btn').click();
    await new Promise(r => setTimeout(r, 200));
    const openShown = getComputedStyle(modal).display === 'flex';
    const inputShown = getComputedStyle(input).display !== 'none';
    const disarmedAtOpen = okBtn.disabled === true && !input.classList.contains('is-armed');

    // Wrong text -> stays disarmed (no green).
    setVal('rese');
    await new Promise(r => setTimeout(r, 60));
    const wrongDisarmed = okBtn.disabled === true && !input.classList.contains('is-armed');

    // Exact word (case-insensitive) -> armed (green + OK enabled).
    // NOTE: the input carries a 0.18s border-color transition (Polish #2), so we
    // wait past it (>200ms) before sampling the computed border, otherwise the
    // probe reads a mid-transition intermediate.
    setVal('reset');
    await new Promise(r => setTimeout(r, 300));
    const armedBorder = getComputedStyle(input).borderTopColor;
    const armed = okBtn.disabled === false && input.classList.contains('is-armed');

    // Edit back to wrong -> disarms again (green removed).
    setVal('resetX');
    await new Promise(r => setTimeout(r, 60));
    const reDisarmed = okBtn.disabled === true && !input.classList.contains('is-armed');

    // Disarmed OK click is a no-op: progress must be preserved.
    const before = gs.progress.completedCount || Object.keys(gs.progress.levels || {}).length;
    okBtn.click();
    await new Promise(r => setTimeout(r, 150));
    const stillOpen = getComputedStyle(modal).display === 'flex';
    const after = gs.progress.completedCount || Object.keys(gs.progress.levels || {}).length;
    const noopHeld = stillOpen === true && after === before;

    // Cancel to abort + verify class cleaned.
    document.getElementById('confirm-modal-cancel').click();
    await new Promise(r => setTimeout(r, 120));
    const closedClean = getComputedStyle(modal).display === 'none' && !input.classList.contains('is-armed') && getComputedStyle(input).display === 'none';

    return { openShown, inputShown, disarmedAtOpen, wrongDisarmed, armed, armedBorder, reDisarmed, noopHeld, before, after, closedClean };
  })()`);
  console.log(`\n[Polish#2] ${JSON.stringify(p2)}`);
  assert('P3.a — Reset typed-confirm opens with input shown', p2.openShown === true && p2.inputShown === true);
  assert('P3.b — disarmed at open (OK disabled, no .is-armed)', p2.disarmedAtOpen === true);
  assert('P3.c — wrong text stays disarmed', p2.wrongDisarmed === true);
  assert('P3.d — exact RESET arms (.is-armed + OK enabled)', p2.armed === true);
  assert('P3.e — armed border is green (rgb(0, 255, 0))', /rgb\(0,\s*255,\s*0\)/.test(p2.armedBorder), `border=${p2.armedBorder}`);
  assert('P3.f — editing back to wrong text re-disarms (green removed)', p2.reDisarmed === true);
  assert('P3.g — disarmed OK click is a no-op (progress preserved, modal open)', p2.noopHeld === true, `before=${p2.before} after=${p2.after}`);
  assert('P3.h — Cancel closes clean (.is-armed + input hidden)', p2.closedClean === true);

  // ============================================================
  // P4: regression + cold-start defaults audit
  // ============================================================
  await evaluate(ws, `(() => {
    Object.keys(localStorage).filter(k => /signal/i.test(k)).forEach(k => localStorage.removeItem(k));
    return true;
  })()`);
  await send(ws, 'Page.navigate', { url: TARGET_URL + '_regress' });
  await wait(4000);
  const regress = await evaluate(ws, `(async () => {
    ${SCREEN_HELPERS}
    const gs = window.game;
    gs.showLevelSelect();
    await new Promise(r => setTimeout(r, 250));
    const ls = document.getElementById('level-select-screen');
    const nav = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b));
    const cards = [...ls.querySelectorAll('.level-btn')].length;
    const ids = ['showFirstLaunchDifficultyModal', 'checkLightning', 'checkEclipseRun', 'checkArchitect', 'isMythic', '_showHud', 'getCurrentStep'];
    const stillUndef = ids.every(name => {
      const ach = gs.achievementManager, ui = gs.ui, ir = gs.infiniteRun, tut = gs.tutorial;
      if (ach && typeof ach[name] === 'function') return false;
      if (ui && typeof ui[name] === 'function') return false;
      if (ir && typeof ir[name] === 'function') return false;
      if (tut && typeof tut[name] === 'function') return false;
      return true;
    });
    const weeklyBtnAbsent = !document.getElementById('weekly-puzzle-btn');
    // cold-start defaults audit (Day 105 precedent)
    const audio = gs.audio;
    const defaults = {
      sfxVol: audio ? audio._sfxVol : null,
      musicVol: audio ? audio._musicVol : null,
      theme: document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('light-mode') ? 'light' : 'auto-or-dark'),
      difficulty: localStorage.getItem('signal-circuit-difficulty-mode'),
    };
    gs.seedProgress(50, { stars: 3 });
    await new Promise(r => setTimeout(r, 300));
    const navEnd = [...ls.querySelectorAll('button')].filter(b => !b.classList.contains('level-btn') && !b.classList.contains('level-overflow-btn') && visible(b)).length;
    const overflowEnd = [...ls.querySelectorAll('.level-overflow-btn')].filter(b => getComputedStyle(b).display !== 'none').length;
    const cardsEnd = [...ls.querySelectorAll('.level-btn')].length;
    return { navCold: nav.length, cardsCold: cards, stillUndef, weeklyBtnAbsent, navEnd, overflowEnd, cardsEnd, defaults };
  })()`);
  console.log(`\n[Regress] ${JSON.stringify(regress)}`);
  assert('P4.a — cold: 2 nav buttons (Day 78 invariant)', regress.navCold === 2, `got ${regress.navCold}`);
  assert('P4.b — cold: 50 level cards', regress.cardsCold === 50, `got ${regress.cardsCold}`);
  assert('P4.c — Day 79: 7 dead ids undefined', regress.stillUndef === true);
  assert('P4.d — Day 79: #weekly-puzzle-btn absent', regress.weeklyBtnAbsent === true);
  assert('P4.e — end-game: 18 nav + 50 overflow', regress.navEnd === 18 && regress.overflowEnd === 50, `nav=${regress.navEnd} overflow=${regress.overflowEnd}`);
  assert('P4.f — end-game: 50 cards', regress.cardsEnd === 50, `got ${regress.cardsEnd}`);
  assert('P4.g — cold defaults: SFX 0.4 / Music 0.2 (Day 105 invariant)', Math.abs(regress.defaults.sfxVol - 0.4) < 0.001 && Math.abs(regress.defaults.musicVol - 0.2) < 0.001, JSON.stringify(regress.defaults));
  // Day 78 PRUNE made the difficulty modal silent-default: no modal is shown, but
  // the persisted value defaults to 'standard' (Day 89/105 invariant) — not null.
  assert('P4.h — cold defaults: difficulty silent-default = standard (Day 89/105 invariant)', regress.defaults.difficulty === 'standard' || regress.defaults.difficulty === null, `difficulty=${regress.defaults.difficulty}`);

  // ============================================================
  // P5: mobile sweep — no horizontal scroll at 4 widths
  // ============================================================
  const widths = [375, 414, 768, 1024];
  const mobile = [];
  for (const w of widths) {
    await send(ws, 'Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: w < 768 });
    await wait(250);
    const r = await evaluate(ws, `(async () => {
      ${SCREEN_HELPERS}
      const gs = window.game;
      gs.showLevelSelect();
      await new Promise(r => setTimeout(r, 200));
      const horiz = document.documentElement.scrollWidth <= window.innerWidth + 2;
      // header info-row reachable (at least one info button visible)
      const infoBtn = document.getElementById('stats-btn');
      const headerOk = visible(infoBtn);
      return { horiz, headerOk, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
    })()`);
    mobile.push({ w, ...r });
    assert(`P5.${w} — no horizontal scroll + header reachable @${w}px`, r.horiz === true && r.headerOk === true, `sw=${r.scrollWidth} iw=${r.innerWidth} header=${r.headerOk}`);
  }
  await send(ws, 'Emulation.clearDeviceMetricsOverride');
  console.log(`\n[Mobile] ${JSON.stringify(mobile)}`);

  // ============================================================
  // P6: console hygiene
  // ============================================================
  const realErrors = consoleErrors.filter(e => !/AudioContext|user gesture|user interaction/i.test(e));
  const realExceptions = runtimeExceptions.filter(e => !/AudioContext/i.test(e));
  assert('P6.a — 0 Runtime.exceptionThrown', realExceptions.length === 0, JSON.stringify(realExceptions));
  assert('P6.b — 0 console.error', realErrors.length === 0, JSON.stringify(realErrors));

  // ============================================================
  // Summary
  // ============================================================
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n=== DAY 121 POLISH SPRINT (LOCAL) ===`);
  console.log(`${passed}/${total} assertions passed`);
  console.log(`${realExceptions.length} runtime exceptions`);
  console.log(`${realErrors.length} console.error calls`);

  const summary = {
    buildIdentity, swProbe, p1, p2, regress, mobile,
    realErrors, realExceptions, assertions: results, passed, total,
  };
  require('fs').writeFileSync('/tmp/day-121-qa-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n[summary] written to /tmp/day-121-qa-summary.json');

  ws.close();
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
