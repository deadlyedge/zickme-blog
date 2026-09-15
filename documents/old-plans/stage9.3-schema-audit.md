# Stage 9.3：数据库表和字段审计

> 本文记录当前 Schema 的使用结论和 SiteSnapshot 第一版边界。审计不等于删除字段；未知用途字段在兼容期内保留。

## 1. 表分类和快照边界

| 分类 | 表 | SiteSnapshot 第一版 |
| :--- | :--- | :--- |
| 认证安全 | `user`、`session`、`account`、`verification` | 排除 |
| Post 内容 | `Post`、`tag`、`_PostToTag` | 默认包含 |
| Gallery 内容 | `Gallery`、`GalleryImage` | 默认包含 |
| 互动/配置 | `Comment`、`siteProfile` | `Comment` 可选；`siteProfile` 默认包含 |
| 同步审计 | `SyncLog`、`SyncRun` | 排除 |
| 同步锁 | `SyncRun.lockKey`、`SyncRun.lockExpiresAt` | 排除 |
| 媒体二进制 | Cloudinary 资源及原始输入 | 不进入数据库快照 |
| 快照自身 | `SiteSnapshot` | 不嵌套进 payload |

快照恢复只恢复运行时业务副本，不回滚 Markdown、`album.yaml`、`gallery.yaml`、代码或 Cloudinary 资源。恢复前必须由后续 Snapshot Service 创建 `PRE_RESTORE` 保护快照。

## 2. 字段使用矩阵

| 表.字段 | 读取位置 | 写入位置 | 索引/约束 | 当前结论 |
| :--- | :--- | :--- | :--- | :--- |
| `Post.metadata` | Post 查询、Post 展示类型、导出/同步结果 | `ContentSyncService`、Post 管理 | 暂不索引 JSONB | 保留；需在 9.4/后续阶段冻结 JSON 结构 |
| `Post.sourcePath` | Post 导出、管理查询和诊断 | `ContentSyncService` | 暂不单独索引 | 保留；人工源定位字段，不能删除 |
| `Gallery.contentHash` | Gallery 同步、冲突/hash 诊断 | Gallery 同步服务 | 暂不新增索引 | 保留；代表相册规范化内容 hash |
| `Gallery.mergeBase` | Gallery 冲突/三方合并基础 | Gallery 同步和冲突逻辑 | 暂不索引 JSONB | 保留；恢复时作为业务副本字段处理 |
| `GalleryImage.fileHash` | Gallery 媒体去重、媒体同步 | Gallery 同步服务 | 暂不新增索引 | 保留；代表处理后文件 hash |
| `GalleryImage.publicId` | Gallery Cloudinary URL/媒体管理 | Gallery Cloudinary 同步 | 不自动删除资源 | 保留；是媒体引用，不是二进制备份 |
| `GalleryImage.contentHash` | Gallery 图片冲突与快照信息 | Gallery 同步服务 | 暂不索引 | 保留；与 `fileHash` 语义分离 |
| `SyncLog.logs` | 旧 `/dashboard/sync`、Post 历史日志 | 旧 Post 同步入口 | 按 `createdAt` 查询 | 保留兼容；不纳入 SiteSnapshot |
| `SyncLog.totalPosts`/`successCount`/`errorCount` | 旧同步历史 UI | 旧 Post 同步入口 | 无 | 保留兼容；不扩展为全站审计 |
| `SyncRun.summary` | 统一同步记录、Dashboard 运行摘要 | Sync Repository/Orchestrator | 按运行状态和时间查询 | 保留；不纳入 SiteSnapshot |
| `SyncRun.lockKey`/`lockExpiresAt` | TTL 并发保护 | Sync Lock | `lockKey` 唯一、组合索引 | 保留运行时状态；恢复绝不覆盖 |

## 3. SiteSnapshot Schema

新增：

- `src/db/schema/site-snapshots.ts`
- `SiteSnapshotStatus`: `CREATING`、`READY`、`RESTORING`、`RESTORED`、`FAILED`、`DELETED`
- `SiteSnapshotSource`: `MANUAL`、`PRE_RESTORE`、`DEPLOYMENT`
- `summary`、`payload`: JSONB
- `payloadHash`: SHA-256 hex 字符串，由后续 Snapshot Service 生成
- `schemaVersion`: 第一版默认 `1`

`createdBy` 只保存创建者 ID，不建立恢复级联关系，也不允许通过快照删除认证用户。第一版不新增 `SnapshotItem` 表。

### 允许的 payload 顶层键

```text
posts
tags
postTags
galleries
galleryImages
siteProfile
comments       # 只有管理员明确选择时才包含
```

以下内容严禁进入 payload：

```text
user / session / account / verification
SyncRun / SyncLog / lockKey / lockExpiresAt
Cloudinary 二进制、Secret、DATABASE_URL、密码和认证 Token
SiteSnapshot 嵌套记录
```

## 4. 废弃字段和回滚策略

当前没有足够证据证明目标字段已废弃，因此本阶段不删除、不重命名、不收紧 nullable 状态。后续若发现字段废弃，必须遵循：

1. 搜索源码读写位置和现有数据；
2. 在文档中标记 deprecated，至少保留一个稳定版本周期；
3. 先导出受影响数据并准备向下迁移/回滚 SQL；
4. 在空库、已有库、重复迁移场景验证；
5. 经快照和部署回滚演练后，才允许删除。

未知用途字段永远不能因为“暂时没有搜索结果”直接删除。

## 5. 迁移与恢复边界

- `SiteSnapshot` migration 只新增枚举、表和索引，不修改认证安全表；
- 迁移不写入业务数据、不建立 Cloudinary 依赖；
- 恢复功能属于 Stage 9.5，必须事务化并在恢复前创建 `PRE_RESTORE`；
- 恢复失败必须回滚业务表事务，但不能回滚认证表、同步记录或锁；
- 删除快照不得删除 Cloudinary 资源；
- 数据库恢复后必须提示人工源仍可能在下一次同步时覆盖数据库副本。