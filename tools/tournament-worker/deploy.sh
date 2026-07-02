#!/usr/bin/env bash
# deploy.sh — Signal Circuit Tournament Worker deploy helper (Day 125).
#
# Purpose: make the Cloudflare Worker deploy path idempotent, safe to re-run,
# and self-documenting. This script does NOT wire Cloudflare credentials or run
# `wrangler deploy` automatically — that remains a deliberate human step so an
# accidental run can't write to the wrong account. It validates prerequisites,
# guards against the placeholder-KV-id footgun, and prints the exact commands.
#
# Usage:
#   tools/tournament-worker/deploy.sh check     # verify prereqs + config (default)
#   tools/tournament-worker/deploy.sh plan      # print the deploy command sequence
#   tools/tournament-worker/deploy.sh deploy    # run `wrangler deploy` (requires --yes)
#
# Flags:
#   --yes         Actually invoke `wrangler deploy` in `deploy` mode.
#   --url URL     After deploy, print the client bootstrap for this worker URL.
#
# Exit codes: 0 ok · 1 prereq/config failure · 2 usage error
set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
TOML="$DIR/wrangler.toml"
WORKER="$DIR/worker.js"
MODE="${1:-check}"
ASSUME_YES=0
CLIENT_URL=""

shift $(( $# > 0 ? 1 : 0 )) || true
while [ $# -gt 0 ]; do
  case "$1" in
    --yes) ASSUME_YES=1 ;;
    --url) shift; CLIENT_URL="${1:-}" ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
  shift || true
done

info() { printf '  \033[36m%s\033[0m %s\n' "::" "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
err()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }

check() {
  local fail=0
  echo "Signal Circuit Tournament Worker — preflight"

  if [ -f "$WORKER" ]; then ok "worker.js present"; else err "worker.js missing at $WORKER"; fail=1; fi
  if [ -f "$TOML" ]; then ok "wrangler.toml present"; else err "wrangler.toml missing at $TOML"; fail=1; fi

  if command -v wrangler >/dev/null 2>&1; then
    ok "wrangler on PATH ($(wrangler --version 2>/dev/null | head -1))"
  else
    warn "wrangler not installed — 'npm i -g wrangler' before deploying"
  fi

  # Guard against deploying with placeholder KV ids (would fail or hit the wrong namespace).
  if grep -q 'REPLACE_WITH_PROD_NAMESPACE_ID\|REPLACE_WITH_PREVIEW_NAMESPACE_ID' "$TOML" 2>/dev/null; then
    warn "wrangler.toml still has placeholder KV ids — create namespaces + paste ids before deploy"
    info "  wrangler kv:namespace create TOURNAMENT_KV"
    info "  wrangler kv:namespace create TOURNAMENT_KV --preview"
  else
    ok "KV namespace ids look populated"
  fi

  # Static syntax sanity on the worker module (no deps, node -c is enough).
  if command -v node >/dev/null 2>&1; then
    if node -c "$WORKER" 2>/dev/null; then ok "worker.js syntax OK"; else err "worker.js failed node -c"; fail=1; fi
  fi

  return $fail
}

plan() {
  cat <<'PLAN'

Deploy plan (run from a Cloudflare-credentialed machine):

  cd tools/tournament-worker

  # 1. One-time: create KV namespaces (prod + preview)
  wrangler kv:namespace create TOURNAMENT_KV
  wrangler kv:namespace create TOURNAMENT_KV --preview

  # 2. Paste the returned ids into wrangler.toml -> [[kv_namespaces]] id / preview_id

  # 3. Deploy (idempotent — safe to re-run; wrangler diffs + updates in place)
  wrangler deploy

  # 4. Note the assigned https://signal-circuit-tournament.<account>.workers.dev URL.
  #    Then, in the game: Settings -> Tournament (Online) -> paste URL -> Connect.
  #    (No DevTools needed anymore as of Day 125.)

PLAN
}

client_bootstrap() {
  local url="$1"
  cat <<BOOT

Client bootstrap for: $url

  In-game (preferred, Day 125):
    Settings -> Tournament (Online) -> Worker URL -> paste -> 🔌 Connect

  Or DevTools console (legacy):
    localStorage.setItem('signal-circuit-tournament-backend', 'remote');
    localStorage.setItem('signal-circuit-tournament-worker-url', '$url');
    location.reload();

BOOT
}

case "$MODE" in
  check)
    check; rc=$?
    [ $rc -eq 0 ] && echo "" && ok "preflight passed" || { echo ""; err "preflight had blocking failures"; }
    exit $rc
    ;;
  plan)
    plan
    [ -n "$CLIENT_URL" ] && client_bootstrap "$CLIENT_URL"
    exit 0
    ;;
  deploy)
    check || { err "preflight failed — aborting deploy"; exit 1; }
    if grep -q 'REPLACE_WITH_PROD_NAMESPACE_ID\|REPLACE_WITH_PREVIEW_NAMESPACE_ID' "$TOML" 2>/dev/null; then
      err "refusing to deploy with placeholder KV ids in wrangler.toml"
      exit 1
    fi
    if [ "$ASSUME_YES" -ne 1 ]; then
      warn "dry-run: pass --yes to actually invoke 'wrangler deploy'"
      plan
      exit 0
    fi
    command -v wrangler >/dev/null 2>&1 || { err "wrangler not installed"; exit 1; }
    ( cd "$DIR" && wrangler deploy )
    rc=$?
    [ -n "$CLIENT_URL" ] && client_bootstrap "$CLIENT_URL"
    exit $rc
    ;;
  *)
    echo "usage: $0 {check|plan|deploy} [--yes] [--url URL]" >&2
    exit 2
    ;;
esac
