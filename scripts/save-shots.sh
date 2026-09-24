#!/usr/bin/env bash
set -euo pipefail
LABEL="${1:?usage: save-shots.sh <label>}"
ROOT="$(git rev-parse --show-toplevel)"
WT="$ROOT/.worktrees/pr-shots"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"

if [ ! -d "$WT" ]; then
  git -C "$ROOT" fetch origin pr-shots:pr-shots || true
  git -C "$ROOT" worktree add "$WT" pr-shots
fi

DEST="$WT/shots/$(date +%Y%m%d-%H%M%S)-${BRANCH//\//-}-$LABEL"
mkdir -p "$DEST"
node "$ROOT/scripts/screenshot.mjs" "$LABEL" "$DEST"

git -C "$WT" add shots
git -C "$WT" commit -m "shots: $BRANCH $LABEL"
git -C "$WT" push -u origin pr-shots
echo "Saved to $DEST"
git -C "$WT" rev-parse --short HEAD
