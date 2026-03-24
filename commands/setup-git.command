#!/bin/bash
set -euo pipefail

# Resolve to repo root (one level up from commands/)
cd "$(dirname "$0")/.."

ORIGIN_URL=""
UPSTREAM_URL=""
DO_PUSH=0

usage() {
  cat <<'USAGE'
OpenClaw UI GitHub Setup

Usage:
  ./commands/setup-git.command --origin <repo-url> [--upstream <repo-url>] [--push]

Examples:
  ./commands/setup-git.command --origin https://github.com/you/openclaw-ui.git
  ./commands/setup-git.command --origin git@github.com:you/openclaw-ui.git --push
  ./commands/setup-git.command --origin https://github.com/you/openclaw-ui.git --upstream https://github.com/lcoutodemos/clui-cc.git
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --origin)
      ORIGIN_URL="${2:-}"
      shift
      ;;
    --upstream)
      UPSTREAM_URL="${2:-}"
      shift
      ;;
    --push)
      DO_PUSH=1
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

if [[ -z "$ORIGIN_URL" ]]; then
  echo "Missing required --origin argument."
  echo
  usage
  exit 1
fi

if [[ ! -d ".git" ]]; then
  echo "This directory is not a git repository."
  echo "Run: git init"
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$ORIGIN_URL"
  echo "Updated origin -> $ORIGIN_URL"
else
  git remote add origin "$ORIGIN_URL"
  echo "Added origin -> $ORIGIN_URL"
fi

if [[ -n "$UPSTREAM_URL" ]]; then
  if git remote get-url upstream >/dev/null 2>&1; then
    git remote set-url upstream "$UPSTREAM_URL"
    echo "Updated upstream -> $UPSTREAM_URL"
  else
    git remote add upstream "$UPSTREAM_URL"
    echo "Added upstream -> $UPSTREAM_URL"
  fi
fi

echo
echo "Current branch: $CURRENT_BRANCH"
echo "Remotes:"
git remote -v

if [[ "$DO_PUSH" == "1" ]]; then
  echo
  echo "Pushing $CURRENT_BRANCH to origin..."
  git push -u origin "$CURRENT_BRANCH"
  echo "Push complete."
else
  echo
  echo "Next step:"
  echo "  git push -u origin $CURRENT_BRANCH"
fi
