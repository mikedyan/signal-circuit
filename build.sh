#!/bin/bash
# Day 35 T4: Cache-busting automation
# Replaces all ?v=<number> with ?v=<unix_timestamp> in index.html
# Run before each deploy: ./build.sh

set -e

TIMESTAMP=$(date +%s)
FILE="index.html"

if [ ! -f "$FILE" ]; then
  echo "Error: $FILE not found. Run from the project root."
  exit 1
fi

# Replace all ?v=<number> patterns with ?v=<timestamp>
sed -i '' "s/?v=[0-9]*/?v=${TIMESTAMP}/g" "$FILE"

echo "✅ Cache bust: updated all ?v= tags to ?v=${TIMESTAMP}"
