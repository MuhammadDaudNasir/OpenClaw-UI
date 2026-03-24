#!/bin/bash
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "OpenClaw UI installer currently supports macOS only."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required. Install Xcode Command Line Tools first:"
  echo "  xcode-select --install"
  exit 1
fi

if ! command -v bash >/dev/null 2>&1; then
  echo "bash is required."
  exit 1
fi

REPO_URL="${OPENCLAW_UI_REPO:-https://github.com/MuhammadDaudNasir/OpenClaw-UI.git}"
WORK_DIR="$(mktemp -d /tmp/openclaw-ui-install.XXXXXX)"

echo "OpenClaw UI One-Command Installer"
echo "Repository: $REPO_URL"
echo "Working dir: $WORK_DIR"
echo

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

git clone --depth 1 "$REPO_URL" "$WORK_DIR/repo"
cd "$WORK_DIR/repo"

./deploy.command --app

echo
echo "Install complete."
echo "Launch from Applications: OpenClaw UI"
