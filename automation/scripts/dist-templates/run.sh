#!/usr/bin/env bash
set -euo pipefail
export PROFILE_DIR="${PROFILE_DIR:-$HOME/.udm-automation/profile}"
export REPORTER_DISABLED="${REPORTER_DISABLED:-1}"
node "$(dirname "$0")/cli.js" "$@"
