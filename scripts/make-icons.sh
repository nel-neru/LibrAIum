#!/usr/bin/env bash
# Derives all Tauri icon sizes + macOS .icns from the generated 1024px master.
# Requires macOS (sips, iconutil). Run: bash scripts/make-icons.sh
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/generate-icons.mjs

ICONS=src-tauri/icons
MASTER=$ICONS/icon-1024.png

sips -z 32 32     "$MASTER" --out "$ICONS/32x32.png" >/dev/null
sips -z 128 128   "$MASTER" --out "$ICONS/128x128.png" >/dev/null
sips -z 256 256   "$MASTER" --out "$ICONS/128x128@2x.png" >/dev/null
cp "$MASTER" "$ICONS/icon.png"

ICONSET=$(mktemp -d)/icon.iconset
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$MASTER" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z $d $d "$MASTER" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$ICONS/icon.icns"
echo "icons written to $ICONS"
