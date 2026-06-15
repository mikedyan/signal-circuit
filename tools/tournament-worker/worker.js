/**
 * Signal Circuit — Tournament Backend Worker
 *
 * Cloudflare Worker shape. Ships with Day 93 but is NOT deployed by the
 * factory build (no Cloudflare credentials in scope). To deploy:
 *
 *   cd tools/tournament-worker
 *   wrangler kv:namespace create SIGNAL_CIRCUIT_TOURNAMENT
 *   # update wrangler.toml with the returned id + preview_id
 *   wrangler deploy
 *
 * Storage:
 *   Key `lb:{weekKey}` -> JSON array of {name, gates, time, score, ts}
 *   sorted by score ascending (lower wins). Capped at top 50.
 *
 * Routes:
 *   GET  /health
 *   POST /scores              body: {weekKey, gates, time, score, name, meta?}
 *   POST /submit/:weekKey     body: {gates, time, score, name, meta?}   (Day 108 alias)
 *   GET  /leaderboard/:wkkey
 */

const TOP_N = 50;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extraHeaders },
  });
}

function safeStr(v, max = 64) {
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

async function handleHealth() {
  return json({ ok: true, mode: 'cloudflare-worker', ts: Date.now() });
}

function _kv(env) {
  // Day 108: roadmap binding is TOURNAMENT_KV. Legacy binding name
  // SIGNAL_CIRCUIT_TOURNAMENT is honored for backward compat if an existing
  // wrangler.toml still uses it.
  return (env && (env.TOURNAMENT_KV || env.SIGNAL_CIRCUIT_TOURNAMENT)) || null;
}

async function handleSubmit(request, env, weekKeyFromUrl) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  // Day 108: URL-scoped /submit/:weekKey wins; legacy /scores reads weekKey from body.
  const candidateKey = weekKeyFromUrl || body.weekKey;
  const weekKey = isValidWeekKey(candidateKey) ? candidateKey : null;
  const gates = safeInt(body.gates, 0, 10000);
  const time = safeInt(body.time, 0, 24 * 3600);
  const score = safeInt(body.score, 0, 10_000_000);
  const name = safeStr(body.name, 32) || 'Player';
  if (!weekKey || gates === null || time === null || score === null) {
    return json({ ok: false, error: 'invalid_payload' }, 400);
  }
  const kv = _kv(env);
  if (!kv) return json({ ok: false, error: 'kv_unbound' }, 500);
  const kvKey = `lb:${weekKey}`;
  const raw = await kv.get(kvKey);
  let list = [];
  try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  list.push({ name, gates, time, score, ts: Date.now() });
  list.sort((a, b) => a.score - b.score);
  const total = list.length;
  if (list.length > TOP_N) list = list.slice(0, TOP_N);
  await kv.put(kvKey, JSON.stringify(list));
  const rank = list.findIndex((e) => e.score === score && e.name === name && e.gates === gates && e.time === time);
  return json({ ok: true, rank: rank >= 0 ? rank + 1 : null, total, weekKey });
}

async function handleLeaderboard(weekKey, env) {
  if (!isValidWeekKey(weekKey)) return json({ ok: false, error: 'invalid_weekkey' }, 400);
  const kv = _kv(env);
  if (!kv) return json({ ok: false, error: 'kv_unbound' }, 500);
  const raw = await kv.get(`lb:${weekKey}`);
  let list = [];
  try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  return json({ ok: true, weekKey, entries: list, total: list.length });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return handleHealth();
    }
    if (request.method === 'POST' && url.pathname === '/scores') {
      return handleSubmit(request, env, null);
    }
    // Day 108: roadmap-spec alias POST /submit/:weekKey.
    const sm = url.pathname.match(/^\/submit\/(.+)$/);
    if (request.method === 'POST' && sm) {
      return handleSubmit(request, env, decodeURIComponent(sm[1]));
    }
    const m = url.pathname.match(/^\/leaderboard\/(.+)$/);
    if (request.method === 'GET' && m) {
      return handleLeaderboard(decodeURIComponent(m[1]), env);
    }
    return json({ ok: false, error: 'not_found', path: url.pathname }, 404);
  },
};
