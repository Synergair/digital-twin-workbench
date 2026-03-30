#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRIMARY_WASM="$ROOT_DIR/node_modules/web-ifc/web-ifc.wasm"
PRIMARY_MT_WASM="$ROOT_DIR/node_modules/web-ifc/web-ifc-mt.wasm"
WASM_PATH=""

if [[ -f "$PRIMARY_WASM" ]]; then
  WASM_PATH="$PRIMARY_WASM"
else
  WASM_PATH="$(find "$ROOT_DIR/node_modules" -type f -name "web-ifc.wasm" -print -quit)"
fi

if [[ -z "$WASM_PATH" ]]; then
  echo "web-ifc.wasm not found. Run npm install first."
  exit 1
fi

mkdir -p "$ROOT_DIR/public/web-ifc"
cp "$WASM_PATH" "$ROOT_DIR/public/web-ifc/web-ifc.wasm"

if [[ -f "$PRIMARY_MT_WASM" ]]; then
  cp "$PRIMARY_MT_WASM" "$ROOT_DIR/public/web-ifc/web-ifc-mt.wasm"
  echo "Copied web-ifc-mt.wasm to $ROOT_DIR/public/web-ifc/web-ifc-mt.wasm"
fi

echo "Copied web-ifc.wasm to $ROOT_DIR/public/web-ifc/web-ifc.wasm"
