#!/bin/bash

# 如果只有 content/ 目录发生变化，就跳过构建

# 获取变更文件列表（考虑 shallow clone 的情况）
if git rev-parse HEAD~1 >/dev/null 2>&1; then
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
else
  CHANGED_FILES=$(git diff --name-only HEAD)
fi

echo "Changed files:"
echo "$CHANGED_FILES"

# 如果没有变更，正常构建（避免意外）
if [ -z "$CHANGED_FILES" ]; then
  echo "✅ Build required (no changes detected by script, default to build)"
  exit 1
fi

# 检查是否存在“非 content/ 路径”的变更
NON_CONTENT_CHANGED=$(echo "$CHANGED_FILES" | grep -vE '^content/' || true)

if [ -n "$NON_CONTENT_CHANGED" ]; then
  echo "✅ Build required (files outside content/ changed):"
  echo "$NON_CONTENT_CHANGED"
  exit 1   # 触发构建
else
  echo "🛑 Build skipped (only content/ changed)"
  exit 0   # 跳过构建
fi
