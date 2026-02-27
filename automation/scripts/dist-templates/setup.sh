#!/usr/bin/env bash
set -euo pipefail
echo "One-time setup for udm-automation (Node + Playwright must be present)."

PROFILE_DIR="${PROFILE_DIR:-$HOME/.udm-automation/profile}"
LOG_DIR="${LOG_DIR:-$HOME/.udm-automation/logs}"

mkdir -p "$PROFILE_DIR" "$LOG_DIR"
echo "Profile dir: $PROFILE_DIR"
echo "Log dir: $LOG_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found. Install Node LTS first."
  exit 2
fi

if command -v npx >/dev/null 2>&1; then
  echo "Installing Playwright browsers (one-time)."
  npx playwright install --with-deps || true
else
  echo "npx not found; install npm or run Playwright install manually."
fi

echo "Setup complete. Use: ./run.sh --job udm:copy_elements_to_another_cycle --runId <id>"
