# 第十二阶段开发计划（Stage 12：个人 Blog 简化、安全删除与 Schema 收敛）

> 制定日期：2026-09-14
>
> 适用范围：单人维护的个人 Blog；当前只有本地开发工作区和一个可重置的实际数据库，不设计测试/预发布/多生产环境治理平台。
>
> 核心原则：Git 中的 `content/` 是唯一人工内容源；数据库是可重建的运行时副本；`reset-db` 只清空数据；migration 只在 schema 确实变化时执行。

## 一、当前状态总览

### 已完成

- [x] Publish、CLI、TUI、Dashboard 复用同一 Publish Workflow。
- [x] 正式内容流程保持 Git-first 单向发布。
- [x] source missing 只报告，不自动删除数据库内容、评论或 Cloudinary 资源。
- [x] `dry-run` 不写工作区、数据库、SyncRun 或 Cloudinary。
- [x] `reset-db` 与 migration/baseline 职责分离，只清空运行时数据。
- [x] 历史 migration 已收敛为唯一正式 baseline：`drizzle/0000_stage12_baseline.sql`。
- [x] `db:audit-migrations` 可验证当前 baseline 与 journal 一致。
- [x] Post、Gallery、GalleryImage 删除 Preview/Confirm 的 ADMIN 安全核心已实现。
- [x] Preview 使用 Zod、ADMIN Session、签名 token、过期时间和实体版本校验。
- [x] 删除 Preview 展示评论数量、媒体清单、Cloudinary publicId 和数据库/Git/Cloudinary 回滚边界。
- [x] 仓库级 lint、测试、TypeScript、内容检查、文档审计和 build 通过。

### 未完成

- [ ] 直接删除当前代码不再需要的 schema 字段：`mergeBase`、Gallery/GalleryImage 的 `revision`、GalleryImage 的 `syncVersion`。
- [ ] 移除 `retryOf` 的当前 Sync 代码依赖后，再删除 `SyncRun.retryOf`。
- [ ] 评估是否继续保留低频运行记录 `SyncRun`/`SyncLog`；当前暂不删除，因为 Publish 兼容路径仍使用它们。
- [ ] 将 Gallery 动态 filesystem tracing warning 降低或消除。
- [ ] 删除 Preview/Confirm 的数据库集成测试和真实 Dashboard UI 接入。
- [ ] 决定是否实现 Cloudinary 删除；当前默认不执行 destroy。
- [ ] 在当前唯一实际数据库上执行 baseline 初始化/升级和内容发布验证。

### 不做或不作为当前阻塞项

- 不建立“四类环境”登记、预发布平台、环境矩阵或复杂运维审批流。
- 不要求生产读取审计、兼容观察期或多环境回滚演练作为个人 Blog 字段删除的前置条件。
- 不为低频个人 Blog 引入事件溯源、任务队列、删除任务表或完整灾难恢复平台。
- 不把 SiteSnapshot 描述为 Git 或 Cloudinary 备份。
- 不引入邮件服务、双向同步、数据库回写 Markdown/YAML、自动 Git commit/push。

## 二、简单运行模型

```text
content/ + Git
    ↓
content check / publish
    ↓
PostgreSQL 运行时副本 + Cloudinary 媒体
```

日常内容清空：

```bash
bun run db:reset -- --confirm-production-reset
bun run publish -- --scope all --no-delete
```

`reset-db`：

- 只执行 `TRUNCATE ... RESTART IDENTITY CASCADE`；
- 清空 Post、Gallery、评论、用户、快照、SyncRun/SyncLog 等运行时数据；
- 不执行 migration；
- 不修改 schema、enum 或 migration journal；
- 不修改 Git、content/ 或 Cloudinary。

Schema 初始化或升级：

```bash
bun run db:migrate
```

当前可重建数据库使用唯一 baseline：

```text
drizzle/0000_stage12_baseline.sql
```

## 三、Schema 收敛规则

### 3.1 当前字段决定

| 字段/协议 | 当前决定 | 后续动作 |
| --- | --- | --- |
| `Gallery.mergeBase` | 当前运行时代码不再需要 | 直接从 schema 和 baseline 删除 |
| `Gallery.revision` | 当前删除流程使用 `updatedAt`，不再需要该字段 | 直接删除 |
| `GalleryImage.mergeBase` | 当前运行时代码不再需要 | 直接删除 |
| `GalleryImage.revision` | 当前删除流程使用 `updatedAt`，不再需要该字段 | 直接删除 |
| `GalleryImage.syncVersion` | Publish 不再更新，当前代码不依赖 | 直接删除 |
| `SyncRun.retryOf` | 当前 Sync 兼容代码仍引用 | 先移除代码依赖，再删除 |
| Gallery/GalleryImage `syncStatus` | 当前发布和删除状态仍使用 | 保留 |
| `SyncRun`/`SyncLog` | 当前兼容 Publish 仍使用 | 暂不删除，后续低频简化时再评估 |

删除规则很简单：如果当前应用代码不再需要字段，就删除 schema 字段并更新唯一 baseline；不为不存在的环境保留永久兼容字段。

### 3.2 Migration 规则

- 当前可重建数据库直接使用 `0000_stage12_baseline.sql`。
- 后续字段删除使用一个明确的 schema 更新 migration，或在下一次明确的 baseline 收敛中完成。
- `reset-db` 永远不调用 migration。
- 不在文档中假设存在多个长期维护环境。
- 如果未来出现不可重建数据库，再单独设计备份/回滚流程；这不是当前 Stage 12 的阻塞项。

## 四、删除安全闭环

### 已完成的安全边界

```text
previewDeletion
  → ADMIN Session
  → Zod 校验
  → 实体、评论、媒体、Cloudinary publicId 预览
  → 签名、过期、实体版本 token

confirmDeletion
  → ADMIN Session
  → confirmation=DELETE
  → token/版本校验
  → Post 归档 / Gallery ARCHIVED / GalleryImage PENDING_DELETE
  → 不自动删除 Cloudinary
```

必须保持：

- 非 ADMIN 不得确认；
- Preview 不改变状态；
- source missing 不创建删除任务；
- 普通 Publish 不调用删除 Action；
- 评论数量和媒体清单在确认前可见；
- 数据库、Git、Cloudinary 的恢复边界分开说明。

### 未完成的删除能力

- Cloudinary destroy 尚未实现；如果未来实现，必须是独立的 ADMIN 二次确认，不得绑定普通 Publish。
- 删除 Action 尚缺数据库集成测试和 Dashboard 操作界面。
- 当前数据库日志不是独立删除审计表；个人 Blog 暂以应用日志为最低记录，不引入复杂审计平台。

## 五、后续开发顺序

### P0：直接清理无用 schema 字段

1. 删除 `mergeBase`、`revision`、`syncVersion` 的 schema 属性。
2. 更新 `0000_stage12_baseline.sql`。
3. 运行 TypeScript、测试、migration audit、content check 和 build。
4. 确认 Gallery 发布、删除 Preview/Confirm 不再引用这些字段。

### P1：移除 retry 协议

1. 从 `sync-orchestrator`、`sync-lock`、Sync 类型和兼容 DTO 中移除 `retryOf`。
2. 删除 `SyncRun.retryOf`。
3. 保持失败后按 scope 手动重跑，不实现实体级 retry。

### P1：Publish/Sync 简化

- 继续保留现有 Publish Workflow，不引入新的同步入口；
- 将锁/运行摘要逐步改为简单 Publish 语义；
- 不为个人 Blog 引入新的任务平台；
- 处理 Gallery tracing warning，但不以此阻塞内容发布。

### P2：可选恢复能力

只有真实需要时再考虑：

- 数据库备份和恢复演练；
- Cloudinary 原始媒体备份；
- 独立 Cloudinary 删除审计；
- 更完整的删除中断恢复。

## 六、验收清单

### 已通过的仓库级验收

- [x] `bun run docs:audit`
- [x] `bun run db:audit-migrations`
- [x] `bun test`
- [x] `bunx tsc --noEmit --pretty false`
- [x] `bun run content:check -- --no-examples`
- [x] `bun run build`
- [x] `git diff --check`

### 尚未通过的后续验收

- [ ] 无用字段从 schema、baseline 和运行时代码移除。
- [ ] `retryOf` 依赖移除并删除字段。
- [ ] 删除 Action 数据库集成测试。
- [ ] 当前唯一数据库完成 baseline 初始化/升级验证。
- [ ] 当前 content 完成一次 Post/Gallery 正常 publish。
- [ ] tracing warning 已处理或记录为明确的低风险遗留项。

## 七、阶段结论

```text
Stage 12 当前状态：部分完成

已完成：
  Git-first 发布边界、reset-db 职责分离、baseline 收敛、删除 Preview/Confirm 核心、仓库质量检查

未完成：
  无用字段直接删除、retry 协议移除、删除集成测试、单库 baseline/publish 验证、tracing warning 处理

明确不做：
  四类环境治理、多环境审批、复杂灾难恢复平台、事件溯源和新的双向同步体系
```