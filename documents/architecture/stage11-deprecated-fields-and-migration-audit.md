# 废弃字段与 Migration 当前审计

> 审计日期：2026-09-14
>
> 适用范围：单人维护的个人 Blog。当前不建立测试、预发布或多生产环境矩阵。

## 一、当前结论

- Publish 新调用方不再暴露 `mergeBase`、`revision`、`syncVersion`、`retryOf` 等旧协议字段。
- `source missing` 只报告，不自动删除内容、评论或 Cloudinary 资源。
- 当前正式 migration 已收敛为唯一 baseline：`drizzle/0000_stage12_baseline.sql`。
- `reset-db` 只清空运行时数据，不执行 migration、不修改 schema。
- `Gallery`/`GalleryImage` 的 `syncStatus` 仍是当前运行状态，保留。
- `SyncRun`/`SyncLog` 仍被 Publish 内部运行记录路径使用，暂不删除；旧 Dashboard `SyncResult` 兼容层已移除。

## 二、字段处理决定

| 字段 | 当前代码状态 | 决定 |
| --- | --- | --- |
| `Gallery.mergeBase` | 当前运行时代码不再使用 | 下一步直接删除 |
| `Gallery.revision` | 删除流程使用 `updatedAt` | 下一步直接删除 |
| `GalleryImage.mergeBase` | 当前运行时代码不再使用 | 下一步直接删除 |
| `GalleryImage.revision` | 删除流程使用 `updatedAt` | 下一步直接删除 |
| `GalleryImage.syncVersion` | Publish 不再更新 | 下一步直接删除 |
| `SyncRun.retryOf` | 当前 Sync 兼容代码仍引用 | 先移除代码依赖，再删除 |
| `Gallery.syncStatus` | 当前发布/归档状态使用 | 保留 |
| `GalleryImage.syncStatus` | 当前发布/待处理状态使用 | 保留 |
| `SyncRun`/`SyncLog` | 当前兼容 Publish 使用 | 暂不删除 |

字段删除规则：当前应用不再需要的字段直接删除 schema、baseline、代码引用和测试；不为不存在的环境建立永久兼容窗口。

## 三、Publish/Sync 边界

当前调用链仍为：

```text
CLI / TUI / Dashboard
        ↓
publish-workflow
        ↓ 兼容 adapter
runSync / sync-orchestrator
        ↓
Post / Gallery service / SyncRun
```

已完成：

- Publish 对外类型不暴露旧 Sync 字段；
- dry-run 不获取锁、不写 SyncRun/SyncLog、不上传 Cloudinary；
- 普通 Publish 不执行删除 Action；
- Git 是唯一人工内容源。

未完成：

- `retryOf` 仍在 Sync 内部协议中；
- Publish lock/history 尚未完全独立；
- `sync-service.ts` 仍混合内容、媒体和数据库职责；
- Gallery tracing warning 仍存在。

## 四、Migration

当前正式链：

```text
drizzle/0000_stage12_baseline.sql
drizzle/meta/_journal.json
```

数据库使用 `bun run db:migrate` 执行正式 migration；数据库可重置时使用 baseline 初始化，日常内容清空使用 `reset-db`，不执行 migration。当前不再提供独立的 migration audit 脚本。

## 五、后续开发

1. 删除 `mergeBase`、`revision`、`syncVersion`。
2. 移除 `retryOf` 代码依赖并删除该字段。
3. 再评估是否简化 `SyncRun`/`SyncLog`。
4. 处理 tracing warning。

灾难恢复、Cloudinary 原始媒体备份和更复杂审计属于按需能力，不是当前个人 Blog 的完成前置条件。