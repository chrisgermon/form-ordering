#!/usr/bin/env bash

set -euo pipefail

BASE_BRANCH="${1:-main}"

# Ensure we are up-to-date
git fetch origin "$BASE_BRANCH"

git checkout "$BASE_BRANCH"

echo "Merging Codex branches into $BASE_BRANCH"

for branch in $(git branch -r | grep "origin/codex/" | sed 's|origin/||'); do
  echo "Merging $branch"
  git merge --no-edit "origin/$branch"
done

echo "Done."
