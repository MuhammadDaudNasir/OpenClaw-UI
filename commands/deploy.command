#!/bin/bash
set -euo pipefail

# Resolve to repo root (one level up from commands/)
cd "$(dirname "$0")/.."

usage() {
  cat <<'USAGE'
OpenClaw UI One-Command Deploy

Usage:
  ./commands/deploy.command [--app] [--no-run]

Options:
  --app     Deploy as macOS app into /Applications
  --no-run  Setup/build only (do not auto-launch)
  -h, --help
USAGE
}

MODE="dev"
RUN_AFTER=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      MODE="app"
      ;;
    --no-run)
      RUN_AFTER=0
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

if [[ "$MODE" == "app" ]]; then
  echo "Deploy mode: macOS app"
  ./commands/bootstrap.command --app
  exit 0
fi

if [[ "$RUN_AFTER" == "1" ]]; then
  echo "Deploy mode: source + auto-run"
  ./commands/bootstrap.command --dev --run
else
  echo "Deploy mode: source setup/build only"
  ./commands/bootstrap.command --dev
fi
