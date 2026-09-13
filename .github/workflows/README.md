# GitHub Actions 已暂停

本目录中的 GitHub Actions 已按架构减法实施计划暂停。当前仓库**不会启用或执行任何 workflow**，包括质量检查、媒体处理、数据库迁移和发布。

暂停期间请在本地执行质量验证：

```bash
bun run lint
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run test
bunx tsc --noEmit --pretty false
bun run build
```

恢复前必须完成 publish 边界验收、人工发布演练，并重新评估是否只恢复一个受控 workflow。不得通过 `workflow_dispatch`、`workflow_run` 或其他入口绕过本暂停状态。

恢复边界：Git 内容源使用 Git revert/branch/tag；PostgreSQL 使用 Neon/数据库备份；Cloudinary 媒体使用保留策略及仓库外原始媒体备份。Snapshot 不是完整站点备份。