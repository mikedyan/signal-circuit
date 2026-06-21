#!/usr/bin/env bash
# cdp-launch.sh — boot the QA test harness dependencies (LO-2 fix, Day 114).
#
# Why this exists: the factory's CDP harness (qa-reports/day-*-qa.cdp.js) talks
# raw Chrome DevTools Protocol over a WebSocket (ws@8.x from the openclaw
# node_modules). It does NOT need puppeteer. Day 113 failed because it tried to
# auto-launch Chromium via @puppeteer/browsers, which isn't installed on this
# orchestrator. The fix: launch the Chromium binary that ships with the OpenClaw
# browser tool directly, with remote debugging + permissive origins.
#
# Usage:
#   tools/cdp-launch.sh start   # start static server (8901) + headless Chromium (9301)
#   tools/cdp-launch.sh stop    # tear both down
#   tools/cdp-launch.sh status  # show readiness
#
# Then run a harness with:
#   NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-NNN-qa.cdp.js
set -u

HTTP_PORT=8901
CDP_PORT=9301
CDP_PROFILE=/tmp/sc-cdp-profile
PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Resolve a Chromium binary. Prefer the OpenClaw-managed app, fall back to the
# Playwright cache, then any system Chromium/Chrome.
find_chrome() {
  local cands=(
    "/Users/openclaw/Applications/Chromium.app/Contents/MacOS/Chromium"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  )
  for c in "${cands[@]}"; do
    [ -x "$c" ] && { echo "$c"; return 0; }
  done
  local pw
  pw=$(find "$HOME/Library/Caches/ms-playwright" -maxdepth 3 -type f \
        \( -name 'Chromium' -o -name 'Google Chrome for Testing' \) 2>/dev/null | head -1)
  [ -n "$pw" ] && { echo "$pw"; return 0; }
  return 1
}

start() {
  # Static server
  if ! curl -s --max-time 3 -o /dev/null "http://localhost:${HTTP_PORT}/"; then
    ( cd "$PROJ_DIR" && python3 -m http.server "$HTTP_PORT" >/tmp/sc-http.log 2>&1 & )
    sleep 1
  fi
  curl -s --max-time 4 -o /dev/null -w "http :: %{http_code}\n" "http://localhost:${HTTP_PORT}/"

  # Headless Chromium with CDP
  if ! curl -s --max-time 3 "http://127.0.0.1:${CDP_PORT}/json/version" >/dev/null 2>&1; then
    local chrome
    chrome=$(find_chrome) || { echo "ERROR: no Chromium binary found"; exit 1; }
    echo "chromium :: $chrome"
    "$chrome" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
      --remote-debugging-port="$CDP_PORT" "--remote-allow-origins=*" \
      --user-data-dir="$CDP_PROFILE" about:blank >/tmp/sc-chrome.log 2>&1 &
    sleep 3
  fi
  curl -s --max-time 4 "http://127.0.0.1:${CDP_PORT}/json/version" | sed -n 's/.*"Browser": *"\([^"]*\)".*/cdp :: \1/p'
}

stop() {
  pkill -f "remote-debugging-port=${CDP_PORT}" 2>/dev/null && echo "stopped chromium"
  pkill -f "http.server ${HTTP_PORT}" 2>/dev/null && echo "stopped http server"
  true
}

status() {
  curl -s --max-time 3 -o /dev/null -w "http(${HTTP_PORT}) :: %{http_code}\n" "http://localhost:${HTTP_PORT}/" || echo "http down"
  curl -s --max-time 3 "http://127.0.0.1:${CDP_PORT}/json/version" >/dev/null 2>&1 \
    && echo "cdp(${CDP_PORT}) :: up" || echo "cdp(${CDP_PORT}) :: down"
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *) echo "usage: $0 {start|stop|status}"; exit 1 ;;
esac
