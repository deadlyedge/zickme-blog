# ignore-build.sh
# 只要本次提交里只有 content/ 下的变更，就跳过构建

CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

echo "Changed files:"
echo "$CHANGED_FILES"

if echo "$CHANGED_FILES" | grep -vE '^(content/|README\.md)$' > /dev/null; then
  # 有不在 content/ 的变更 → 正常构建
  echo "Build required."
  exit 1
else
  # 只有 content/ 变化 → 跳过构建
  echo "🛑 Build skipped (only content/* changed)"
  exit 0
fi
