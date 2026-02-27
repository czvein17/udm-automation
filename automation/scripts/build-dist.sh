#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building dist..."

# Ensure tsup is available via npx
npx tsup src/cli.ts --format cjs --target node18 --out-dir dist --entry-names cli --external:playwright,@playwright/*

mkdir -p dist
cp -v scripts/dist-templates/run.sh dist/run.sh
cp -v scripts/dist-templates/run.ps1 dist/run.ps1
cp -v scripts/dist-templates/setup.sh dist/setup.sh
cp -v scripts/dist-templates/setup.ps1 dist/setup.ps1
cp -v scripts/dist-templates/README-local.md dist/README-local.md

chmod +x dist/run.sh dist/setup.sh || true

echo "Built dist in: $ROOT/dist"
