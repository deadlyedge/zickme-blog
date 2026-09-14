# GitHub Actions 自动化已暂停

根据架构减法实施计划，GitHub Actions 当前**明确停用**。仓库不会执行质量 workflow、媒体 workflow、数据库 workflow，也不会响应 `workflow_dispatch` 或 `workflow_run`。

`.github/workflows/README.md` 是当前唯一的归档说明。恢复自动化前，必须完成离线验收、人工发布演练，并重新评估为单一受控 publish workflow；不得恢复独立 media workflow 或 workflow_run 级联。

Git 是唯一人工内容源。暂停期间请使用本地 Bun 命令完成检查、dry-run 和人工 publish；`.gallery-input` 原始照片必须在仓库外自行备份。Snapshot 只保护数据库业务副本，不能恢复 Git 内容源或 Cloudinary 原始媒体。
## 本地验证

```bash
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run publish -- --scope all --dry-run --json
bun run test
bunx tsc --noEmit --pretty false
bun run build
```

Dashboard 不是内容编辑器，也不提供 ZIP 导入、数据库导出恢复或旧同步触发。请修改 Markdown、`album.yaml` 和处理后的 WebP，审查 Git diff 后再进行受控的本地 publish。
1. **本地推送前验证**：
   在向 GitHub 提交文章前，推荐先在本地执行：
   ```bash
     bun run content:verify
   ```
2. 暂停期间不提供 CI 紧急发布或 Dashboard 导入；请按本地验证命令执行人工流程。
