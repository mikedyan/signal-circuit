#!/usr/bin/env node
/**
 * Local mock of the Cloudflare Worker.
 *
 * Same HTTP surface as `worker.js` but runs as a plain Node http server
 * with an in-memory store. Used by the Day 93 CDP harness (and any future
 * local dev) so the game can exercise the remote-mode code path without
 * touching a real Cloudflare account.
 *
 * Boot:
 *   node tools/tournament-worker/local-mock-worker.js [--port 8902]
 *
 * Routes (identical to the Cloudflare Worker):
 *   GET  /health
 *   POST /scores              body: {weekKey, gates, time, score, name, meta?}
 *   POST /submit/:weekKey     body: {gates, time, score, name, meta?}   (Day 108)
 *   GET  /leaderboard/:wkkey
 *
 * Extra debug-only route:
 *   POST /__reset             clears the in-memory store
 *
 * Process signals:
 *   SIGINT / SIGTERM         -> graceful shutdown
 */

const http = require('http');

const args = process.argv.slice(2);
let port = 8902;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  }
}

const TOP_N = 50;
const store = new Map(); // weekKey -> sorted array

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    ...CORS,
  });
  res.end(buf);
}

function safeStr(v, max) {
  if (typeof v !== 'string') return '';
  return v.slice(0, max).replace(/[\u0000-\u001f]/g, '');
}

function safeInt(v, lo, hi) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n < lo || n > hi) return null;
  return n;
}

function isValidWeekKey(s) {
  return typeof s === 'string' && /^\d{4}-W\d{2}$/.test(s);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      chunks.push(c);
      size += c.length;
      if (size > 64 * 1024) {
        reject(new Error('body_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function handleSubmit(body, weekKeyFromUrl) {
  let parsed;
  try { parsed = JSON.parse(body); } catch (e) { return { status: 400, body: { ok: false, error: 'invalid_json' } }; }
  const candidateKey = weekKeyFromUrl || parsed.weekKey;
  const weekKey = isValidWeekKey(candidateKey) ? candidateKey : null;
  const gates = safeInt(parsed.gates, 0, 10000);
  const time = safeInt(parsed.time, 0, 24 * 3600);
  const score = safeInt(parsed.score, 0, 10_000_000);
  const name = safeStr(parsed.name, 32) || 'Player';
  if (!weekKey || gates === null || time === null || score === null) {
    return { status: 400, body: { ok: false, error: 'invalid_payload' } };
  }
  let list = store.get(weekKey) || [];
  list.push({ name, gates, time, score, ts: Date.now() });
  list.sort((a, b) => a.score - b.score);
  const total = list.length;
  if (list.length > TOP_N) list = list.slice(0, TOP_N);
  store.set(weekKey, list);
  const rank = list.findIndex((e) => e.score === score && e.name === name && e.gates === gates && e.time === time);
  return { status: 200, body: { ok: true, rank: rank >= 0 ? rank + 1 : null, total, weekKey } };
}

function handleLeaderboard(weekKey) {
  if (!isValidWeekKey(weekKey)) return { status: 400, body: { ok: false, error: 'invalid_weekkey' } };
  const entries = store.get(weekKey) || [];
  return { status: 200, body: { ok: true, weekKey, entries, total: entries.length } };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      res.end();
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, mode: 'local-mock-worker', ts: Date.now() });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/scores') {
      const raw = await readBody(req);
      const result = handleSubmit(raw, null);
      sendJson(res, result.status, result.body);
      return;
    }
    // Day 108: roadmap-spec POST /submit/:weekKey alias.
    const sm = url.pathname.match(/^\/submit\/(.+)$/);
    if (req.method === 'POST' && sm) {
      const raw = await readBody(req);
      const result = handleSubmit(raw, decodeURIComponent(sm[1]));
      sendJson(res, result.status, result.body);
      return;
    }
    const m = url.pathname.match(/^\/leaderboard\/(.+)$/);
    if (req.method === 'GET' && m) {
      const result = handleLeaderboard(decodeURIComponent(m[1]));
      sendJson(res, result.status, result.body);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/__reset') {
      store.clear();
      sendJson(res, 200, { ok: true, cleared: true });
      return;
    }
    sendJson(res, 404, { ok: false, error: 'not_found', path: url.pathname });
  } catch (e) {
    sendJson(res, 500, { ok: false, error: 'server_error', message: String(e && e.message || e) });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[mock-worker] listening on http://127.0.0.1:${port}`);
});

function shutdown(sig) {
  console.log(`[mock-worker] ${sig} received, closing`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
