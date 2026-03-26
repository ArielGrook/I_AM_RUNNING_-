#!/bin/bash
# ============================================================
# Git post-commit hook for iam-client-os
# Checks that no required memory/ files were deleted by a commit.
# If deleted → revert the commit automatically.
# ============================================================
# Install: cp scripts/post-commit.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit
# ============================================================

REQUIRED_FILES=(
  "memory/SYSTEM_IDENTITY.md"
  "memory/CURRENT_GOAL.md"
  "memory/NEXT_ACTIONS.md"
  "memory/WEEKLY_PROGRESS.md"
  "memory/RULES.md"
)

deleted=()

for file in "${REQUIRED_FILES[@]}"; do
  if ! git show HEAD:"$file" > /dev/null 2>&1; then
    deleted+=("$file")
  fi
done

if [ ${#deleted[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  WATCHDOG: Required memory files were deleted by this commit:"
  for f in "${deleted[@]}"; do
    echo "   - $f"
  done
  echo ""
  echo "Reverting commit $(git rev-parse --short HEAD)..."
  git revert --no-edit HEAD
  echo "✓ Commit reverted. Memory files restored."
  echo ""
fi
