#!/bin/bash

# 如果只有 content/ 目录发生变化，就跳过构建

# 获取最近两次提交的 diff，如果只有一次提交（shallow clone），退回单次 HEAD
if git rev-parse HEAD~1 >/dev/null 2>&1; then
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
else
  CHANGED_FILES=$(git diff --name-only HEAD)
fi

echo "Changed files:"
echo "$CHANGED_FILES"

# 如果存在非 content/ 的改动 → 需要构建
if echo "$CHANGED_FILES" | grep -vE '^(content/|README\.md)$' | grep -q '.'; then
  echo "✅ Build required (files outside content/ changed)"
  exit 1
else
  echo "🛑 Build skipped (only content/ or README changed)"
  exit 0
fi
