#!/usr/bin/env bash
# Build apiclaw.mcpb (Claude Desktop Extension)
# Installs deps into mcpb/server and zips manifest + server + icon into landing/public/apiclaw.mcpb
set -euo pipefail

cd "$(dirname "$0")"
ROOT_DIR="$(cd .. && pwd)"
LANDING_PUBLIC="$ROOT_DIR/landing/public"
ICON_SRC="$LANDING_PUBLIC/android-chrome-512x512.png"
OUTPUT="$LANDING_PUBLIC/apiclaw.mcpb"
STAGE="$(mktemp -d -t apiclaw-mcpb.XXXXXX)"

echo "→ Staging into $STAGE"

cp manifest.json "$STAGE/manifest.json"

if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$STAGE/icon.png"
else
  echo "  (warning: $ICON_SRC missing — packaging without icon)"
fi

mkdir -p "$STAGE/server"
cp server/package.json "$STAGE/server/package.json"
cp server/index.js     "$STAGE/server/index.js"

echo "→ Installing @nordsym/apiclaw into bundle"
( cd "$STAGE/server" && npm install --omit=dev --no-audit --no-fund --silent )

echo "→ Trimming bundle"
find "$STAGE/server/node_modules" -type d \( -name test -o -name tests -o -name __tests__ -o -name docs -o -name examples \) -prune -exec rm -rf {} + 2>/dev/null || true
find "$STAGE/server/node_modules" -type f \( -name "*.md" -o -name "*.markdown" -o -name "*.map" -o -name "LICENSE*" -o -name "CHANGELOG*" \) -delete 2>/dev/null || true

echo "→ Zipping → $OUTPUT"
rm -f "$OUTPUT"
( cd "$STAGE" && zip -qr "$OUTPUT" . )

rm -rf "$STAGE"
ls -lh "$OUTPUT"
echo "✓ apiclaw.mcpb ready"
