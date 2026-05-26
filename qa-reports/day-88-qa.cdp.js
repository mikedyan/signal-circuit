#!/usr/bin/env node
/**
 * Day 88 QA harness — Cycle 3 HARDEN Week, Day 2: Level Playthrough.
 *
 * Verifies a representative sample of campaign levels (1, 5, 10, 15, 20, 25,
 * 30, 35, 40) plus the Day 84 Lab Bench II additions (41, 42, 43) for:
 *   - truth-table correctness vs. each level's documented semantics
 *   - hints[] shape + hint-token consumption via runtime button click
 *   - calculateStars() at optimal / good / over-good gate counts
 *   - completeLevel() persistence + celebration hook
 *   - no console errors during load+inspect+hint+score check
 *
 * Also exercises each mode entry/exit (Daily, Random, Blitz, Speedrun,
 * Sandbox), and loads 4 community levels (community_1..4) via
 * ui.playCommunityLevel() to confirm buildCustomLevel + the gameplay
 * entry path.
 *
 * Requires:
 *   python3 -m http.server 8901  in the repo root
 *   chrome-for-testing --headless=new --remote-debugging-port=9301 \
 *                      --remote-allow-origins='*' about:blank
 *
 * Usage:
 *   NODE_PATH=/Users/openclaw/src/openclaw/node_modules \
 *     node qa-reports/day-88-qa.cdp.js
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9301;
const TARGET_URL = 'http://localhost:8901/?_ts=' + Date.now();

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const assertions = [];

function rec(label, ok, detail) {
  assertions.push({ label, ok: !!ok, detail });
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : ''));
}
function note(label, detail) { console.log(`ℹ️  ${label}` + (detail ? ` :: ${String(detail).slice(0, 240)}` : '')); }

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c));
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function send(ws, method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}
async function evalExpr(ws, expr, { returnByValue = true, awaitPromise = false } = {}) {
  const r = await send(ws, 'Runtime.evaluate', {
    expression: expr, returnByValue, awaitPromise, allowUnsafeEvalBlockedByCSP: true,
  });
  if (r.exceptionDetails) {
    const text = r.exceptionDetails.exception?.description || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails);
    throw new Error('eval threw: ' + text);
  }
  return r.result && r.result.value;
}
async function waitFor(ws, predicate, { timeoutMs = 10000, intervalMs = 200, label = 'waitFor' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const v = await evalExpr(ws, `(${predicate})()`); if (v) return v; } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timeout: ${label}`);
}
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function navigateAndWait(ws, url) {
  await send(ws, 'Page.navigate', { url });
  await sleep(1500);
  await waitFor(ws, `() => !!document.body && !!window.game`, { label: 'body+game present', timeoutMs: 20000 });
}

// ------------------------------------------------------------------
// Expected truth tables, computed from each level's stated semantics.
// We re-derive in JS and feed into the in-page assertions so the QA
// is self-contained.
// ------------------------------------------------------------------
function expectedTT(id) {
  function combos(n) {
    const rows = [];
    for (let i = 0; i < 1 << n; i++) {
      const r = [];
      for (let b = n - 1; b >= 0; b--) r.push((i >> b) & 1);
      rows.push(r);
    }
    return rows;
  }
  const tt = (n, fn) => combos(n).map((r) => ({ inputs: r, outputs: [].concat(fn(...r)) }));
  switch (id) {
    case 1:  return tt(2, (a, b) => a & b);                // AND
    case 5:  return tt(2, (a, b) => 1 - (a | b));          // NOR
    case 10: return tt(2, (a, b) => a | b);                // OR
    case 15: return tt(3, (a, b, c) => ((a + b + c) >= 2 ? 1 : 0)); // Majority
    case 20: return tt(3, (a, b, s) => (s === 0 ? a : b)); // 2:1 MUX (A,B,S)
    case 30: return tt(3, (d, s1, s0) => {
      const sel = (s1 << 1) | s0;
      return [sel === 0 ? d : 0, sel === 1 ? d : 0, sel === 2 ? d : 0, sel === 3 ? d : 0];
    });
    case 35: return tt(2, (a, b) => a ^ b);                // Dark Gate (XOR)
    case 40: return tt(2, (a, b) => a & b);                // Phase1 AND
    case 41: return tt(2, (a, b) => a & b);                // AND via NAND-only
    case 42: return tt(3, (s, a, b) => (s === 0 ? a : b)); // 2:1 MUX (S,A,B)
    case 43: return tt(3, (a, b, c) => a ^ b ^ c);         // 3-input XOR (parity)
    case 25: { // 2-bit ripple adder, order (A1,A0,B1,B0) -> (Cout,S1,S0)
      const rows = [];
      for (let i = 0; i < 16; i++) {
        const a1 = (i >> 3) & 1, a0 = (i >> 2) & 1;
        const b1 = (i >> 1) & 1, b0 = i & 1;
        const a = (a1 << 1) | a0;
        const b = (b1 << 1) | b0;
        const sum = a + b; // 0..6
        const Cout = (sum >> 2) & 1;
        const S1 = (sum >> 1) & 1;
        const S0 = sum & 1;
        rows.push({ inputs: [a1, a0, b1, b0], outputs: [Cout, S1, S0] });
      }
      return rows;
    }
    default: return null;
  }
}

async function main() {
  const list = await fetchJson('/json/list');
  let target = list.find((t) => t.type === 'page');
  if (!target) target = await fetchJson('/json/new?about:blank');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  ws.on('message', (data) => {
    let msg; try { msg = JSON.parse(data.toString()); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const e = msg.params?.exceptionDetails;
      const text = e?.exception?.description || e?.text || JSON.stringify(e);
      consoleErrors.push({ kind: 'Runtime.exceptionThrown', text });
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const p = msg.params;
      if (p?.type === 'error' || p?.type === 'assert') {
        const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        consoleErrors.push({ kind: 'console.' + p.type, text });
      }
    }
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Network.enable');
  await navigateAndWait(ws, TARGET_URL);

  // Reset localStorage so every run starts from a clean profile (hint tokens etc.)
  await evalExpr(ws, `(()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('signal')||k.includes('signal-circuit')||k==='communityPlays'||k==='blitzMode'||k==='speedrunBest').forEach(k=>localStorage.removeItem(k));}catch(e){}})()`);
  await navigateAndWait(ws, TARGET_URL);

  // ------------- Phase 1: build identity (Day 87 unchanged) -------------
  {
    const cb = await evalExpr(ws, `Array.from(document.querySelectorAll('link,script')).map(e=>(e.src||e.href||'')).filter(u=>u.includes('?v=1780156800')).length`);
    rec('Phase 1.1 — 11 cache-bust refs at ?v=1780156800', cb === 11, `count=${cb}`);
    const sw = await evalExpr(ws, `(async()=>{try{const r=await fetch('/sw.js');const t=await r.text();const m=t.match(/CACHE_NAME\\s*=\\s*['"]([^'"]+)['"]/);return m?m[1]:null}catch(e){return 'err:'+e.message}})()`, { awaitPromise: true });
    rec('Phase 1.2 — sw.js CACHE_NAME signal-circuit-v60', sw === 'signal-circuit-v60', `sw=${sw}`);
  }

  // ------------- Phase 2: ensure gs ready, Standard mode default -------------
  await waitFor(ws, `() => !!window.game && !!window.game.ui`, { label: 'window.game' });
  await sleep(200);
  const diffMode = await evalExpr(ws, `window.game.difficultyMode`);
  rec('Phase 2.1 — difficulty mode default = standard', diffMode === 'standard', `mode=${diffMode}`);

  // ------------- Phase 3: per-level validation -------------
  const sampled = [1, 5, 10, 15, 20, 25, 30, 35, 40, 41, 42, 43];
  for (const lvlId of sampled) {
    const expected = expectedTT(lvlId);
    const result = await evalExpr(ws, `(() => {
      try {
        const lvl = getLevel(${lvlId});
        if (!lvl) return { ok:false, err:'no level' };
        const hintsLen = Array.isArray(lvl.hints) ? lvl.hints.length : -1;
        const tt = lvl.truthTable.map(r => ({ inputs: r.inputs.slice(), outputs: (Array.isArray(r.outputs) ? r.outputs.slice() : [r.outputs]) }));
        const inputCount = (lvl.inputs || []).length;
        const outputCount = (lvl.outputs || []).length;
        return {
          ok: true, id: lvl.id, title: lvl.title,
          inputCount, outputCount,
          truthTable: tt, hintsLen,
          optimalGates: lvl.optimalGates, goodGates: lvl.goodGates,
          isLabBench: !!lvl.isLabBench, isDiscovery: !!lvl.isDiscovery,
          availableGates: lvl.availableGates,
          labConstraint: lvl.labConstraint || null,
          gateHardCap: lvl.gateHardCap || null,
          mustIncludeGate: lvl.mustIncludeGate || null,
        };
      } catch (e) { return { ok:false, err:e.message }; }
    })()`);
    rec(`Phase 3 L${lvlId} — level resolves`, result.ok, result.err || result.title);
    if (!result.ok) continue;

    // Truth-table semantic check
    if (expected) {
      const rowsOk = result.truthTable.length === expected.length;
      let mismatch = null;
      if (rowsOk) {
        for (let i = 0; i < expected.length; i++) {
          const e = expected[i], r = result.truthTable[i];
          if (e.inputs.length !== r.inputs.length || e.outputs.length !== r.outputs.length) {
            mismatch = `row ${i} shape ${JSON.stringify(r)} vs expected ${JSON.stringify(e)}`; break;
          }
          for (let j = 0; j < e.inputs.length; j++) {
            if (e.inputs[j] !== r.inputs[j]) { mismatch = `row ${i} input[${j}] ${r.inputs[j]} vs ${e.inputs[j]}`; break; }
          }
          if (mismatch) break;
          for (let j = 0; j < e.outputs.length; j++) {
            if (e.outputs[j] !== r.outputs[j]) { mismatch = `row ${i} output[${j}] ${r.outputs[j]} vs ${e.outputs[j]}`; break; }
          }
          if (mismatch) break;
        }
      }
      rec(`Phase 3 L${lvlId} — truth table matches semantics`, rowsOk && !mismatch, mismatch || `${expected.length} rows`);
    } else {
      note(`Phase 3 L${lvlId} — no semantic expectation registered`);
    }

    // Hints array shape
    rec(`Phase 3 L${lvlId} — hints length is 3`, result.hintsLen === 3, `hints=${result.hintsLen}`);

    // calculateStars at optimal / good / over-good
    const starCheck = await evalExpr(ws, `(() => {
      const lvl = getLevel(${lvlId});
      const opt = lvl.optimalGates, good = lvl.goodGates;
      const s3 = window.game.calculateStars(opt, lvl);
      const s2 = window.game.calculateStars(Math.max(opt + 1, good), lvl);
      const s1 = window.game.calculateStars(good + 5, lvl);
      return { s3, s2, s1, opt, good };
    })()`);
    rec(`Phase 3 L${lvlId} — calculateStars(opt=${starCheck.opt})=3`, starCheck.s3 === 3, `s3=${starCheck.s3}`);
    rec(`Phase 3 L${lvlId} — calculateStars(good=${starCheck.good})≤2`, starCheck.s2 <= 2, `s2=${starCheck.s2}`);
    rec(`Phase 3 L${lvlId} — calculateStars(over)=1`, starCheck.s1 === 1, `s1=${starCheck.s1}`);
  }

  // ------------- Phase 4: live load L1 + hint button consumption -------------
  await evalExpr(ws, `window.game.startLevel(1)`);
  await sleep(400);
  const beforeHint = await evalExpr(ws, `({ hintsUsed: window.game.hintsUsed, screen: document.querySelector('.screen-active')?.id, hintBtn: !!document.getElementById('hint-btn'), tokenText: document.querySelector('#hint-btn .hint-tokens')?.textContent || document.getElementById('hint-btn')?.textContent || null })`);
  rec('Phase 4.1 — L1 gameplay screen active', beforeHint.screen === 'gameplay-screen', `screen=${beforeHint.screen}`);
  rec('Phase 4.2 — Hint button present', !!beforeHint.hintBtn);
  rec('Phase 4.3 — hintsUsed starts at 0', beforeHint.hintsUsed === 0, `hintsUsed=${beforeHint.hintsUsed}`);
  // Click hint (after token state confirmed)
  const preTokenState = await evalExpr(ws, `({ tokens: window.game.hintTokens && window.game.hintTokens.tokens, isHardcore: window.game.isHardcoreMode(), isSandbox: window.game.isSandboxMode, isChallenge: window.game.isChallengeMode })`);
  note('Phase 4.x — hint pre-state', JSON.stringify(preTokenState));
  await evalExpr(ws, `document.getElementById('hint-btn').click()`);
  await sleep(500);
  const afterHint = await evalExpr(ws, `({ hintsUsed: window.game.hintsUsed, hintModalText: document.getElementById('hint-text')?.textContent || document.querySelector('.hint-popup')?.textContent || null })`);
  rec('Phase 4.4 — hintsUsed increments after click', afterHint.hintsUsed === 1, `hintsUsed=${afterHint.hintsUsed}`);
  // Close any modal
  await evalExpr(ws, `(()=>{const cb=document.querySelector('#confirm-modal #confirm-modal-close, .modal-close-btn, #confirm-modal-ok, #hint-close-btn'); if(cb) cb.click();})()`);
  await sleep(120);

  // ------------- Phase 5: completeLevel persistence smoke -------------
  // Save existing progress for L1, then call completeLevel(1, optimalGates) and confirm record.
  const completeSmoke = await evalExpr(ws, `(() => {
    const lvl = getLevel(1);
    const before = window.game.progress.levels[1] ? Object.assign({}, window.game.progress.levels[1]) : null;
    try { window.game.completeLevel(1, lvl.optimalGates); } catch (e) { return { ok:false, err:e.message, before }; }
    const after = window.game.progress.levels[1];
    return { ok:true, before, after };
  })()`);
  rec('Phase 5.1 — completeLevel(1, opt) records progress', !!completeSmoke.after, JSON.stringify(completeSmoke.after));
  rec('Phase 5.2 — completion stars >=3', completeSmoke.after && completeSmoke.after.stars >= 3, `stars=${completeSmoke.after && completeSmoke.after.stars}`);
  // Reset to level select so subsequent navigations are clean
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);

  // ------------- Phase 6: Daily Challenge -------------
  await evalExpr(ws, `document.getElementById('daily-challenge-btn')?.click()`);
  await sleep(400);
  const dailyPre = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, startBtn: !!document.getElementById('start-daily-btn') })`);
  rec('Phase 6.1 — daily-config-screen visible', dailyPre.screen === 'daily-config-screen', `screen=${dailyPre.screen}`);
  rec('Phase 6.2 — daily start button present', dailyPre.startBtn);
  await evalExpr(ws, `document.getElementById('start-daily-btn').click()`);
  await sleep(500);
  const dailyGame = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, isDaily: !!window.game.currentLevel?.isDaily, hintsAvail: Array.isArray(window.game.currentLevel?.hints) })`);
  rec('Phase 6.3 — daily gameplay loaded with isDaily=true', dailyGame.screen === 'gameplay-screen' && dailyGame.isDaily, JSON.stringify(dailyGame));
  await evalExpr(ws, `document.getElementById('back-btn')?.click()`);
  await sleep(300);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(300);
  rec('Phase 6.4 — back-btn returns to level-select', (await evalExpr(ws, `document.querySelector('.screen-active')?.id`)) === 'level-select-screen');

  // ------------- Phase 7: Random Challenge -------------
  // Seed enough progress for tier gating.
  await evalExpr(ws, `window.game.seedProgress(18, {stars:3})`);
  await sleep(200);
  await evalExpr(ws, `document.getElementById('random-challenge-btn')?.click()`);
  await sleep(300);
  const rndPre = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, gen: !!document.getElementById('generate-challenge-btn') })`);
  rec('Phase 7.1 — challenge-config-screen visible', rndPre.screen === 'challenge-config-screen', `screen=${rndPre.screen}`);
  await evalExpr(ws, `document.getElementById('generate-challenge-btn').click()`);
  await sleep(500);
  const rndGame = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, isChallengeMode: !!window.game.isChallengeMode, lvl: window.game.currentLevel ? { title: window.game.currentLevel.title, ttRows: (window.game.currentLevel.truthTable||[]).length } : null })`);
  rec('Phase 7.2 — random challenge gameplay with isChallengeMode=true', rndGame.screen === 'gameplay-screen' && rndGame.isChallengeMode === true, JSON.stringify(rndGame.lvl));
  await evalExpr(ws, `document.getElementById('back-btn')?.click()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(300);

  // ------------- Phase 8: Blitz Mode -------------
  await evalExpr(ws, `document.getElementById('blitz-mode-btn')?.click()`);
  await sleep(500);
  const blitzGame = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, blitzMode: !!window.game.blitzMode, hud: getComputedStyle(document.getElementById('blitz-hud')).display })`);
  rec('Phase 8.1 — blitz gameplay + HUD visible', blitzGame.screen === 'gameplay-screen' && blitzGame.blitzMode && blitzGame.hud !== 'none', JSON.stringify(blitzGame));
  await evalExpr(ws, `document.getElementById('back-btn')?.click()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(300);
  const blitzCleanup = await evalExpr(ws, `({ blitzMode: window.game.blitzMode, hud: getComputedStyle(document.getElementById('blitz-hud')).display, screen: document.querySelector('.screen-active')?.id })`);
  rec('Phase 8.2 — blitz HUD cleanup after back-btn', blitzCleanup.blitzMode === false && blitzCleanup.hud === 'none' && blitzCleanup.screen === 'level-select-screen', JSON.stringify(blitzCleanup));

  // ------------- Phase 9: Speedrun Mode -------------
  await evalExpr(ws, `document.getElementById('speedrun-btn')?.click()`);
  await sleep(500);
  const speed = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, speedrunMode: !!window.game.speedrunMode, hud: getComputedStyle(document.getElementById('speedrun-hud')).display })`);
  rec('Phase 9.1 — speedrun gameplay + HUD visible', speed.screen === 'gameplay-screen' && speed.speedrunMode && speed.hud !== 'none', JSON.stringify(speed));
  await evalExpr(ws, `document.getElementById('back-btn')?.click()`);
  await sleep(200);
  await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
  await sleep(300);
  const speedCleanup = await evalExpr(ws, `({ speedrunMode: window.game.speedrunMode, hud: getComputedStyle(document.getElementById('speedrun-hud')).display, screen: document.querySelector('.screen-active')?.id, timer: !!window.game.speedrunTimer })`);
  rec('Phase 9.2 — speedrun HUD cleanup after back-btn', speedCleanup.speedrunMode === false && speedCleanup.hud === 'none' && speedCleanup.screen === 'level-select-screen' && speedCleanup.timer === false, JSON.stringify(speedCleanup));

  // ------------- Phase 10: Sandbox -------------
  await evalExpr(ws, `document.getElementById('sandbox-btn')?.click()`);
  await sleep(300);
  const sb = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id })`);
  rec('Phase 10.1 — sandbox-config-screen visible', sb.screen === 'sandbox-config-screen', `screen=${sb.screen}`);
  await evalExpr(ws, `document.getElementById('sandbox-back-btn')?.click()`);
  await sleep(200);

  // ------------- Phase 11: Community levels -------------
  const communityIds = ['community_1', 'community_2', 'community_3', 'community_4'];
  for (const cid of communityIds) {
    await evalExpr(ws, `window.game.ui.playCommunityLevel('${cid}')`);
    await sleep(500);
    const r = await evalExpr(ws, `({ screen: document.querySelector('.screen-active')?.id, lvlId: window.game.currentLevel?.id, isCommunityLevel: !!window.game.currentLevel?.isCommunityLevel, ttRows: (window.game.currentLevel?.truthTable||[]).length, hasGates: Array.isArray(window.game.currentLevel?.availableGates) && window.game.currentLevel.availableGates.length > 0 })`);
    const ok = r.screen === 'gameplay-screen' && r.lvlId === cid && r.isCommunityLevel === true && r.ttRows > 0 && r.hasGates;
    rec(`Phase 11 — ${cid} loads as gameplay`, ok, JSON.stringify(r));
    await evalExpr(ws, `document.getElementById('back-btn')?.click()`);
    await sleep(200);
    await evalExpr(ws, `(()=>{const ok=document.querySelector('#confirm-modal-ok'); if(ok && ok.offsetParent) ok.click();})()`);
    await sleep(200);
  }

  // ------------- Phase 12: Lab Bench II additions live -------------
  // L41 NAND-only chip
  await evalExpr(ws, `window.game.startLevel(41)`);
  await sleep(300);
  const lab41 = await evalExpr(ws, `({ gates: window.game.currentLevel.availableGates, chip: document.getElementById('lab-constraint')?.textContent, hud: getComputedStyle(document.getElementById('lab-hud')).display, run: document.getElementById('run-btn')?.textContent })`);
  rec('Phase 12.1 — L41 NAND-only palette + chip live', JSON.stringify(lab41.gates) === '["NAND"]' && (lab41.chip || '').includes('NAND'), JSON.stringify(lab41));
  // L42 hard cap chip
  await evalExpr(ws, `window.game.startLevel(42)`);
  await sleep(300);
  const lab42 = await evalExpr(ws, `({ chip: document.getElementById('lab-constraint')?.textContent, cap: window.game.currentLevel.gateHardCap, run: document.getElementById('run-btn')?.textContent })`);
  rec('Phase 12.2 — L42 hard cap=4 chip live', lab42.cap === 4 && (lab42.chip || '').includes('Hard cap'), JSON.stringify(lab42));
  // L43 mustInclude XOR chip
  await evalExpr(ws, `window.game.startLevel(43)`);
  await sleep(300);
  const lab43 = await evalExpr(ws, `({ chip: document.getElementById('lab-constraint')?.textContent, mustInclude: window.game.currentLevel.mustIncludeGate })`);
  rec('Phase 12.3 — L43 mustInclude XOR chip live', Array.isArray(lab43.mustInclude) && lab43.mustInclude[0] === 'XOR' && (lab43.chip || '').includes('XOR'), JSON.stringify(lab43));
  await evalExpr(ws, `window.game.showLevelSelect()`);
  await sleep(200);

  // ------------- Phase 13: Console error tally -------------
  rec('Phase 13 — 0 Runtime exceptions / console.error across suite', consoleErrors.length === 0, `errors=${consoleErrors.length}: ${JSON.stringify(consoleErrors).slice(0, 240)}`);

  // ------------- Summary -------------
  const passed = assertions.filter((a) => a.ok).length;
  const failed = assertions.length - passed;
  console.log('\n========================================');
  console.log(`Day 88 QA: ${passed} / ${assertions.length} assertions passed (${failed} failed)`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log('========================================\n');
  if (failed > 0) {
    console.log('Failed assertions:');
    for (const a of assertions) if (!a.ok) console.log(' ❌', a.label, '::', a.detail);
  }
  ws.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(2); });
