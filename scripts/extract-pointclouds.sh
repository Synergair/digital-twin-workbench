#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="$ROOT_DIR/public/documents/scans/stanford_bunny_scan.tar.gz"
OUTPUT_DIR="$ROOT_DIR/public/documents/scans"
PLY_DIR="$OUTPUT_DIR/ply"
MANIFEST="$OUTPUT_DIR/pointclouds.json"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Archive not found: $ARCHIVE"
  exit 1
fi

mkdir -p "$PLY_DIR"
tar -xzf "$ARCHIVE" -C "$PLY_DIR"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'public', 'documents', 'scans');
const plyDir = path.join(outputDir, 'ply');
const manifest = path.join(outputDir, 'pointclouds.json');

const files = fs.readdirSync(plyDir).filter((file) => file.toLowerCase().endsWith('.ply'));
const entries = files.map((file) => ({ file: `ply/${file}`, label: file.replace(/_/g, ' '), points: 'PLY scan' }));

fs.writeFileSync(manifest, JSON.stringify({ files: entries }, null, 2));
console.log(`Wrote ${entries.length} entries to ${manifest}`);
NODE

echo "Point cloud PLY files extracted to $PLY_DIR"
