#!/bin/bash
set -euo pipefail

# Resolve to repo root (one level up from commands/)
cd "$(dirname "$0")/.."

MODE="dev"
RUN_AFTER_BOOTSTRAP=0

usage() {
  cat <<'USAGE'
OpenClaw UI Bootstrap

Usage:
  ./commands/bootstrap.command [--dev|--app] [--run]

Options:
  --dev   Set up + build from source (default)
  --app   Run full macOS app installer (/Applications)
  --run   Start from source after successful bootstrap (dev mode only)
  -h, --help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      MODE="dev"
      ;;
    --app)
      MODE="app"
      ;;
    --run)
      RUN_AFTER_BOOTSTRAP=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo
      usage
      exit 1
      ;;
  esac
  shift
done

echo "OpenClaw UI Bootstrap"
echo "====================="
echo

if [[ "$MODE" == "app" ]]; then
  echo "Mode: macOS app install"
  echo
  ./commands/install-app.command
  exit 0
fi

echo "Mode: developer/source install"
echo
echo "Step 1/3: Environment setup"
if ! ./commands/setup.command; then
  if [[ -d "node_modules" ]]; then
    echo
    echo "Setup checks failed, but existing dependencies were found."
    echo "Continuing with build using current environment..."
  else
    echo
    echo "Setup failed and no existing dependencies were found."
    echo "Please fix setup issues, then rerun bootstrap."
    exit 1
  fi
fi

echo
echo "Step 2/3: Build"
npm run build

echo
echo "Step 3/3: Doctor check"
npm run doctor || true

echo
echo "Bootstrap complete."
echo "Run: ./commands/start.command"

if [[ "$RUN_AFTER_BOOTSTRAP" == "1" ]]; then
  echo
  echo "Starting OpenClaw UI..."
  ./commands/start.command
fi
