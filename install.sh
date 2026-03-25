#!/bin/bash
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "OpenClaw UI installer currently supports macOS only."
  exit 1
fi

if ! command -v bash >/dev/null 2>&1; then
  echo "bash is required."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required."
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "tar is required."
  exit 1
fi

REPO_SLUG="${OPENCLAW_UI_REPO_SLUG:-MuhammadDaudNasir/OpenClaw-UI}"
REPO_REF="${OPENCLAW_UI_REF:-main}"
ARCHIVE_URL="https://codeload.github.com/${REPO_SLUG}/tar.gz/refs/heads/${REPO_REF}"
WORK_DIR="$(mktemp -d /tmp/openclaw-ui-install.XXXXXX)"

echo "OpenClaw UI One-Command Installer"
echo "Repository: https://github.com/${REPO_SLUG}"
echo "Ref: $REPO_REF"
echo "Working dir: $WORK_DIR"
echo

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "Downloading source archive..."
curl -fsSL "$ARCHIVE_URL" -o "$WORK_DIR/repo.tar.gz"
mkdir -p "$WORK_DIR/repo"
tar -xzf "$WORK_DIR/repo.tar.gz" -C "$WORK_DIR/repo" --strip-components=1
cd "$WORK_DIR/repo"

./commands/deploy.command --app

echo
echo "Install complete."
echo "Launch from Applications: OpenClaw UI"
