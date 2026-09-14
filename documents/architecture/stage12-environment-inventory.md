# Stage 12 环境与生产状态盘点

> 记录日期：2026-09-14
>
> 状态：**未通过 Phase 0**。本文是脱敏盘点模板和当前证据登记，不代表任何环境已经应用某条 migration。

## 1. 证据边界

本仓库的 `db:audit-migrations` 只检查 Git 中的 SQL 文件与 Drizzle journal，不能替代目标环境的只读 journal、schema dump、备份和恢复演练。当前没有提交任何数据库导出、连接串、密码、用户内容或 Cloudinary 凭据。

在获得下表所需证据前，禁止执行 `0007`/`0008`、压缩 migration、生成最终 baseline、删除字段或执行破坏性数据清理。

## 2. 环境状态

| 环境 | Migration journal | 关键 schema dump | 关键表行数 | 备份/恢复证据 | 是否可 reset | 责任人 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 本地开发库 | 未提供 | 未提供 | 未提供 | 未提供 | 未确认 | 未指定 | 未知 |
| 测试库 | 未提供 | 未提供 | 未提供 | 未提供 | 未确认 | 未指定 | 未知 |
| 预发布库 | 未提供 | 未提供 | 未提供 | 未提供 | 未确认 | 未指定 | 未知 |
| 生产库 | 未提供 | 未提供 | 未提供 | 未提供 | 未确认 | 未指定 | 未知 |

## 3. 必须收集的脱敏证据

每个环境应由受控运维流程提供以下内容：

- 数据库标识的脱敏值和采集时间；
- `_drizzle_migrations` 的 tag、hash/时间戳和顺序；
- `Post`、`Gallery`、`GalleryImage`、`Comment`、`GalleryImageComment`、`SyncRun`、`SyncLog`、`SiteSnapshot` 的行数；
- 目标字段的非空数、非默认值数和关联记录数：`mergeBase`、`revision`、`syncVersion`、`retryOf`；
- Gallery 状态 enum、索引、外键和默认值摘要；
- 备份时间、恢复方式、最近一次恢复演练和可接受回滚窗口；
- 是否已应用 `0006_amusing_sleepwalker`；
- 与仓库 schema 的 drift 说明。

只读盘点不得调用 `db:migrate`、`db:push`、`db:reset`，不得写业务表、`SyncRun`、Snapshot 或 Cloudinary。

## 4. 当前仓库证据

- [x] 仓库 `0000`–`0006` SQL 与 journal 可由 `bun run db:audit-migrations` 检查；
- [x] `0006_amusing_sleepwalker` 在仓库中创建 `GalleryImageComment`；
- [x] 已知废弃字段仍保留在 Drizzle schema；
- [ ] 本地数据库 journal/schema 读取；
- [ ] 测试数据库 journal/schema 读取；
- [ ] 预发布数据库 journal/schema 读取；
- [ ] 生产数据库 journal/schema 读取；
- [ ] 生产读取方、Dashboard、运维 SQL、日志查询和 Snapshot 审计；
- [ ] 备份恢复演练和回滚窗口确认。

## 5. 当前结论

Phase 0 **不通过**。因此本阶段仓库只实现不依赖生产状态的删除预览安全核心；不新增清理/字段删除 migration，不修改历史 migration，不执行 Cloudinary destroy。任何环境盘点结果必须由运维补充到本文后，才能进入 Stage 12 Phase 1 及后续 migration 准入评审。