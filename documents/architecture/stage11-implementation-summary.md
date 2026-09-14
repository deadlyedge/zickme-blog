# Stage 11 实施总结

> 总结日期：2026-09-14
>
> 当前状态：仓库级治理、baseline 收敛和无用字段删除已完成；项目按单库、可重置的个人 Blog 维护，不建立多环境治理平台。Publish/Sync 进一步简化仍是可选后续工作。

## 1. 已完成范围

### Publish/Sync 边界

- Publish 已拥有独立的 `PublishScope`、`PublishStatus`、`PublishSummary`、`PublishResult` 和 `PublishTrigger` 类型；
- 新调用方不再直接暴露 `SyncRunSummary`、`retryOf` 或已删除的旧字段；
- Dashboard 的发布触发能力直接返回统一 Publish Workflow 结果，不再保留旧 `SyncResult` 兼容 DTO；
- `runSync` 仅作为兼容期内部 adapter 和历史实现保留；
- CLI、TUI、Dashboard 复用同一 Publish Workflow；
- dry-run 不获取锁、不写 SyncRun/SyncLog、不上传 Cloudinary、不写工作区。

### source missing 安全边界

- Post、Gallery 和 GalleryImage 的 source missing 进入只读摘要；
- 普通 Publish 不自动归档 Post/Gallery，不设置 `PENDING_DELETE`；
- 评论和 Cloudinary 资源不会因暂时缺失而被删除；
- 普通 Publish 不会隐式执行 Cloudinary 删除；
- source missing 会通过 CLI 文本/JSON 和兼容 Dashboard DTO 暴露。

### 类型与常量分层

已建立并保留兼容入口：

```text
src/types/publish/
src/types/gallery/
src/types/comments/
src/lib/constants/
```

`@/types`、`@/types/gallery`、`@/types/public-user` 等历史导入仍可用，新的领域类型可以从对应领域文件导入。

### Migration 与废弃字段审计

- 已完成旧字段、`syncStatus`、SyncRun、SyncLog 的仓库级读取审计；无用字段已从 schema、baseline 和运行时代码删除；
- 当前正式 migration 已收敛为唯一 `0000_stage12_baseline.sql`；
- 新增只读命令：

```bash
bun run db:audit-migrations
```

- 该命令只读取 Git 工作区 migration 文件和 `_journal.json`，不连接数据库、不执行 migration；
- 未修改任何历史 migration、schema 字段或数据库数据。

### 文档治理

- 当前架构入口：`documents/architecture/README.md`；
- Stage 11 计划：`documents/develop-plans/development-plan-stage11-architecture-governance.md`；
- 废弃字段/Migration 审计：`stage11-deprecated-fields-and-migration-audit.md`；
- 当前入口文档审计命令：

```bash
bun run docs:audit
```

该命令只审计 README、根 AGENTS、当前架构规范和当前架构目录，不扫描历史阶段计划与历史总结。

## 2. 验证证据

当前回归基线：

- `bun run docs:audit`：通过；
- `bun run db:audit-migrations`：1 条 SQL 与 1 条 journal entry 一致；
- `bun run lint`：通过；
- `bun test`：23 tests passed；
- `bunx tsc --noEmit --pretty false`：通过；
- `bun run content:check -- --no-examples`：通过；
- `bun run build`：通过。

Build 仍有 Gallery 动态文件系统 tracing warning，属于旧 Gallery 发布路径的已知治理项，不影响本轮类型、安全边界和文档验收。

## 3. 明确未完成事项

以下事项仍未完成：

1. 删除 Action 集成测试和 Dashboard UI；
2. 当前唯一数据库的 baseline 初始化和 content publish 验证；
3. 评估是否进一步简化 SyncRun/SyncLog。

灾难恢复、Cloudinary 原始媒体备份和更复杂审计仅在实际需要时增加，不是当前个人 Blog 的默认前置条件。

## 4. 后续准入条件

字段删除前只需要确认当前仓库代码不再读取字段，并同步更新 schema、baseline、测试和文档。仍被当前代码使用的字段（如 `retryOf`）先移除代码依赖再删除。