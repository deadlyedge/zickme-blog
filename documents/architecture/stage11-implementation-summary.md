# Stage 11 实施总结

> 总结日期：2026-09-14
>
> 当前状态：Phase 0–6 的仓库级治理工作已完成；生产数据库状态、生产字段删除和 migration 压缩仍需要独立的受控运维窗口。

## 1. 已完成范围

### Publish/Sync 边界

- Publish 已拥有独立的 `PublishScope`、`PublishStatus`、`PublishSummary`、`PublishResult` 和 `PublishTrigger` 类型；
- 新调用方不再直接暴露 `SyncRunSummary`、`retryOf`、`mergeBase`、`revision` 或 `syncVersion`；
- Dashboard 已通过统一 Publish Workflow 调用，旧 `SyncResult` 仅保留为兼容 DTO；
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

- 已完成 `mergeBase`、`revision`、`syncVersion`、`syncStatus`、`retryOf`、SyncRun、SyncLog 的仓库级读取审计；
- 已确认历史 migration 文件与仓库 journal 的 `0000`–`0006` 链一致；
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
- `bun run db:audit-migrations`：7 条 SQL 与 7 条 journal entry 一致；
- `bun run lint`：通过；
- `bun test`：23 tests passed；
- `bunx tsc --noEmit --pretty false`：通过；
- `bun run content:check -- --no-examples`：通过；
- `bun run build`：通过。

Build 仍有 Gallery 动态文件系统 tracing warning，属于旧 Gallery 发布路径的已知治理项，不影响本轮类型、安全边界和文档验收。

## 3. 明确未完成事项

以下事项不能仅通过仓库静态分析宣称完成：

1. 本地、测试、预发布和生产环境的实际 migration journal 盘点；
2. 生产 schema、enum、索引、外键和关键表数据量对照；
3. `mergeBase`、`revision`、`syncVersion`、`retryOf` 的生产读取审计；
4. migration 压缩或新 baseline 建立；
5. 生产废弃字段删除；
6. 独立 ADMIN 删除流程、评论/媒体影响范围预览和 Cloudinary 二次确认流程。

这些事项必须在独立、可回滚的运维工作流中处理，不能与普通重构或 Publish 类型迁移混合提交。

## 4. 后续准入条件

进入 migration 压缩或字段删除前，必须获得：

- 每个环境的 journal 和 schema dump；
- 生产备份与恢复演练记录；
- 生产读取方、Dashboard、运维脚本、日志查询和 Snapshot 使用情况确认；
- 明确区分数据库、Git 内容源和 Cloudinary 的回滚路径；
- 单独 migration/删除提交及回滚方案。

在这些证据完成前，继续保留历史 migration、废弃字段、SyncRun 和兼容读取路径。