# Stage 11 废弃字段与 Migration 只读审计

> 审计日期：2026-09-14
>
> 状态：只读审计完成，未执行数据库连接、migration、schema 删除或生产变更。
>
> 目的：为废弃字段删除和 migration 压缩建立证据清单；本文不能证明任何环境已经应用某条 migration。

## 1. 审计范围与结论

本次审计覆盖：

- TypeScript schema、运行时服务、Server Actions 和 Dashboard 兼容入口；
- SyncRun、SyncLog、锁和历史查询；
- `drizzle/*.sql`、`drizzle/meta/_journal.json` 和归档 migration；
- Snapshot、日志和恢复边界相关引用；
- 当前架构减法文档与 Stage 11 开发计划。

总体结论：

1. 当前代码仓库仍需要保留历史字段和 SyncRun 兼容表，不能直接删除。
2. 正式 Publish 已停止新增旧双向协议依赖；但“没有新写入”不等于“生产没有读取”。
3. Gallery `syncStatus` 仍是运行时状态字段，不能作为本轮废弃字段删除对象。
4. 本地 migration 文件与 journal 在文件名和顺序上匹配：`0000` 至 `0006` 共 7 条。
5. 未读取任何环境的 Drizzle journal 或数据库 schema，因此生产应用状态仍为未知。
6. 本轮没有执行 `db:migrate`、`db:push`、`db:generate`、`DROP COLUMN`、enum 修改或 migration 重写。

## 2. 废弃字段分类

| 字段/协议 | 代码仓库状态 | 当前运行时风险 | 删除前置条件 | 当前动作 |
| --- | --- | --- | --- | --- |
| `Gallery.mergeBase` | Schema 保留，标记 legacy merge protocol | 历史数据、旧查询或恢复流程可能读取 | 生产 SQL、Dashboard、运维查询和备份恢复读取审计 | 暂不删除 |
| `Gallery.revision` | Schema 保留，Gallery Admin 兼容参数仍存在 | 旧乐观锁入口或历史数据读取 | 禁用/迁移所有兼容读取方，并完成观察期 | 暂不删除 |
| `GalleryImage.mergeBase` | Schema 保留，标记 legacy merge protocol | 历史数据和旧 Gallery 协议 | 生产读取审计与回滚演练 | 暂不删除 |
| `GalleryImage.revision` | Schema 保留，兼容字段 | 旧 Dashboard/API 参数或历史读取 | 兼容入口删除、生产读取审计 | 暂不删除 |
| `GalleryImage.syncVersion` | Schema 保留，标记 legacy version protocol | 历史同步记录和旧查询 | SQL/日志/Snapshot/运维脚本读取审计 | 暂不删除 |
| Gallery `syncStatus` | 运行时仍读写 | `IN_SYNC` 和显式删除审计状态仍依赖它 | 设计新的公开状态协议并完成数据迁移 | 保留 |
| GalleryImage `syncStatus` | 运行时仍读写 | `IN_SYNC`、`PENDING_DELETE` 和 Dashboard 展示依赖它 | 独立删除安全流程和生产备份 | 保留 |
| `SyncRun.retryOf` | Schema、类型和兼容 repository 保留；新 Publish 不传入 | 历史运行记录读取和旧数据库数据 | 历史读取方、日志查询、恢复流程审计 | 停止新写入，保留历史读取 |
| `SyncRun` | 真实 Publish 仍通过兼容 adapter 创建/更新 | 发布锁、历史摘要、Dashboard 查询 | 迁移到最小 publish runs 或明确替代方案 | 冻结，不删除 |
| `SyncLog` | Post legacy service 真实 Publish 仍可写入 | 历史日志和 Dashboard 诊断 | 迁移日志读取方并完成观察期 | 冻结，不删除 |

## 3. 运行时调用审计

### 3.1 Publish 与 Sync 边界

当前正式调用方向为：

```text
CLI / TUI / Dashboard
        ↓
publish-workflow
        ↓ 兼容期内部 adapter
runSync / sync-orchestrator
        ↓
Post service / Gallery service / SyncRun / lock
```

已完成的治理约束：

- Publish 对外返回 `PublishSummary`，不复制 `retryOf`、`mergeBase`、`revision` 或 `syncVersion`；
- Dashboard 通过 Publish Workflow 调用，旧 `SyncResult` 只在兼容 adapter 返回；
- `runSync` 当前只保留在 Publish 内部 adapter 和 Sync 实现内部；
- dry-run 不获取锁、不创建或更新 SyncRun、不写 SyncLog、不上传 Cloudinary；
- Publish source missing 只进入摘要，不自动归档、标记删除或删除 Cloudinary。

### 3.2 Gallery 状态

Gallery 发布服务仍会：

- 正常发布时写入必要的 `IN_SYNC`；
- 只读计算 source missing；
- 只有显式内部 `deleteOld === true` 且非 dry-run 时才进入 `PENDING_DELETE`/`ARCHIVED` 处理；
- Dashboard 展示 `PENDING_DELETE` 状态。

因此不能把整个 `syncStatus` enum 作为废弃字段处理。未来如果需要简化，必须先定义新的状态机、迁移历史数据并提供回滚方案。

## 4. Migration 文件与 Journal 审计

### 4.1 当前正式链

仓库中存在：

```text
drizzle/0000_baseline.sql
drizzle/0001_mean_chimera.sql
drizzle/0002_damp_black_bolt.sql
drizzle/0003_gallery_stage7.sql
drizzle/0004_mighty_hiroim.sql
drizzle/0005_nervous_thunderbird.sql
drizzle/0006_amusing_sleepwalker.sql
```

`drizzle/meta/_journal.json` 包含 `idx=0..6`、相同 tag 的 7 条记录，仓库内文件链与 journal 顺序一致。

### 4.2 已确认的 schema 事实

- `0000_baseline.sql` 创建基础 `SyncLog`、Post、Comment、User 等结构；
- Gallery 相关字段和 enum 由后续 `0001`–`0005` 引入或扩展；
- `0006_amusing_sleepwalker.sql` 创建 `GalleryImageComment`，包含外键和必要索引；
- 当前仓库未发现针对废弃字段的 `DROP COLUMN` migration；
- `drizzle/archive/` 存在旧历史链和 snapshot，不能作为当前生产应用状态证据。

### 4.3 环境状态限制

仅凭 SQL 文件名、journal 或 Git commit 不能确认下列环境是否已应用 migration：

| 环境 | 当前证据 | 状态 |
| --- | --- | --- |
| 本地开发库 | 本轮未读取数据库 journal | 未知 |
| 测试库 | 未提供连接/读取结果 | 未知 |
| 预发布库 | 未提供连接/读取结果 | 未知 |
| 生产库 | 未提供连接/读取结果 | 未知 |

在得到每个环境的 migration journal、关键表/列/enum/index schema dump 和备份窗口前，禁止：

- 压缩 `0000`–`0006`；
- 重写或删除已应用 migration；
- 新 baseline 与旧链同时作用于同一数据库；
- 删除 `mergeBase`、`revision`、`syncVersion`、`retryOf` 或旧 enum 值。

## 5. 删除或压缩的后续准入条件

### 字段删除

必须按以下顺序完成：

```text
生产 SQL / Dashboard / 运维 / Snapshot 读取审计
  ↓
停止新写入并发布兼容版本
  ↓
观察历史读取和错误日志
  ↓
生产备份与恢复窗口确认
  ↓
新增兼容 migration
  ↓
验证行数、外键、索引、enum 和日志
  ↓
执行回滚演练
```

### Migration 压缩

只有在确认目标生产环境尚未应用旧链时，才可以考虑新 baseline；即使如此，也必须：

1. 在空数据库执行完整旧链；
2. 导出最终 schema；
3. 与代码 schema 和新 baseline 做 diff；
4. 将旧链移动到 `drizzle/archive/pre-stage11/`，不删除历史；
5. 单独提交并记录等价性；
6. 使用 seed、content check、publish dry-run、测试和 build 验证。

若任一生产环境已经应用旧链，则默认保留旧链，只新增后续兼容 migration。

## 6. 本轮审计结论

- [x] 完成废弃字段全仓代码/Schema/文档搜索；
- [x] 确认 Publish 不再向外暴露旧 Sync 字段；
- [x] 确认 Gallery `syncStatus` 仍是运行时字段；
- [x] 确认本地 migration 文件与 journal 顺序匹配；
- [x] 记录 `0006` GalleryImageComment migration；
- [x] 明确生产 migration 状态尚未盘点；
- [x] 明确本轮不执行 schema/migration/数据库变更；
- [ ] 获取本地、测试、预发布、生产的实际 journal 和 schema dump；
- [ ] 生产读取方和恢复流程人工确认；
- [ ] 制定独立字段删除或 migration baseline 实施方案。