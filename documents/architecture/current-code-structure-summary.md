# 当前代码结构与后续优化方向

> 更新时间：2026-09-16
>
> 本文以当前真实代码为准，目标是说明职责边界和后续优化方向，而不是继续追求清除所有历史命名。

## 1. 当前架构

```text
Git 内容源
  ├── content/posts/**/*.md
  ├── content/photo-gallery/**/album.yaml
  └── content/photo-gallery/**/images/*.webp
          │
          ▼
检查 / 格式化 / 媒体准备 / Gallery 索引
          │
          ▼
统一 Publish Workflow
  ├── PostPublishService
  ├── Gallery Publish Service
  ├── 媒体上传
  └── 运行记录与并发保护
          │
          ├── PostgreSQL 运行时副本
          └── Cloudinary 媒体 CDN
```

Git 是唯一人工内容源。数据库和 Cloudinary 是运行时副本或媒体服务，不反向生成 Markdown、YAML 或 WebP。

## 2. 当前入口

### 内容工作区

```text
content:check
content:format
content:prepare-media
gallery:index
content:verify
```

这些命令处理 Git 工作区和本地内容，不承担数据库发布职责。

### 发布入口

```text
publish
publish:tui
```

- `publish` 是非交互式正式入口；
- `publish:tui` 是保留的维护引导工具，帮助用户形成“检查、修复、看 diff、dry-run、确认发布”的习惯；
- `publish:tui -- --help` 提供交互式工具参数说明；
- CLI、TUI、Dashboard 复用同一个 `runPublishWorkflow()`；
- TUI 不拥有独立的数据库写入、媒体上传或内容编辑实现。

## 3. 当前业务模块

### 内容检查

```text
scripts/check-content.ts
scripts/format-content.ts
src/lib/publish/publish-validation.ts
src/lib/content/content-safety.ts
```

负责 Frontmatter、slug、图片路径、`album.yaml`、WebP、`gallery.yaml` 和原始图片边界检查。

### 媒体

```text
src/lib/gallery/media-preparation.ts
src/lib/media/cloudinary-client.ts
src/lib/media/cloudinary-public-id.ts
src/lib/media/cloudinary-upload.ts
src/lib/media/post-media.ts
src/lib/media/gallery-media.ts
src/lib/media/cloudinary-asset-audit.ts
src/lib/gallery/exif.ts
```

- `media-preparation.ts`：原始图片转换为 Git 管理的 WebP，负责尺寸、hash、mtime 和安全 EXIF；
- `src/lib/media/*`：统一的 Cloudinary client、public ID、上传基础层和 Post/Gallery 媒体策略；
- Post 使用 `myblog/posts/{postSlug}/{imageName}` 命名空间；
- Gallery 使用 `myblog/gallery/{albumSlug}/{imageName}` 命名空间，并生成 320px 缩略图 URL；
- Cloudinary 三个凭据必须同时存在才会启用真实上传；缺少配置时不生成伪造 URL；
- `cloudinary-asset-audit.ts`：收集数据库引用并支持只读审计/显式确认清理；
- `exif.ts`：Gallery EXIF 白名单和隐私过滤。

### Post 发布

```text
src/lib/publish/post-publish-service.ts
```

负责 Markdown 扫描、Frontmatter 解析、slug 和 metadata、文章图片、Post/Tag 写入、slug 冲突和 source missing。

### Gallery 发布

```text
src/lib/publish/gallery-publish-service.ts
```

负责读取 `album.yaml`、调用媒体准备、写入 WebP、上传 Gallery 图片、写入 Gallery/GalleryImage、保留人工字段以及发布摘要。

### Publish 编排

```text
src/lib/publish/publish-workflow.ts
src/lib/sync/sync-orchestrator.ts
```

`runPublishWorkflow()` 对外提供统一流程；`runPublish()` 是 Publish-facing adapter；底层暂时继续复用 SyncRun、锁和运行记录。

## 4. 已完成的架构减法

以下能力已经删除：

```text
数据库 → Markdown/YAML write-back
数据库文章 ZIP 导出
本地 Markdown 与数据库远端 Diff
Dashboard 内容导入
三方 merge 和字段级冲突解决
独立 Post Cloudinary 上传脚本
旧 sync / pull / patch CLI
旧 SyncResult Dashboard 兼容 DTO
重复的 content:prepare / content:rebuild / Frontmatter 脚本
```

代表性删除包括：

```text
src/lib/frontmatter-writeback.ts
src/lib/content-diff.ts
src/lib/post-exporter.ts
src/lib/publish/publish-legacy.ts
src/lib/sync/sync-result.ts
src/lib/sync/sync-merge.ts
src/lib/sync/sync-hash.ts
src/lib/sync-service.ts
src/lib/gallery/gallery-sync-service.ts
```

## 5. SyncRun 的当前定位

`SyncRun` 仍然保留，但它现在只是运行时基础设施：

- 记录真实 Publish 的开始、完成、失败和摘要；
- 为真实 Publish 提供并发保护；
- 保存锁过期信息；
- 为 Dashboard 或运维诊断提供最近运行记录。

它不再代表数据库与 Git 的双向同步，也不负责回写、merge、pull、patch、实体级 retry 或 Cloudinary 元数据。

因此当前不建议仅为了名称重命名数据库表。运行记录和并发保护仍然有实际价值。

## 6. 后续优化方向

### P0：维护边界优先

- 新业务只依赖 `src/lib/publish`，不新增 `src/lib/sync` 调用方；
- Publish 只读取 Git 内容源；
- dry-run 不连接数据库、不获取锁、不上传 Cloudinary；
- Post/Gallery 解析、媒体上传和数据库错误必须进入 Publish 摘要；
- Post 解析失败不能从总数中消失，也不能被报告为成功；
- Post 和 Gallery 保持独立服务；
- Dashboard 只触发 Publish 或查看运行时状态；
- 不新增 merge、pull、patch、retry 或自动删除协议。

### P1：整理 Publish 编排

可以新增 `src/lib/publish/publish-service.ts`，将 scope 转换、Post/Gallery 调用、错误汇总迁入 Publish 命名空间。`sync-orchestrator.ts` 之后只保留薄兼容层。

### P1：隔离运行记录和锁

可以新增：

```text
src/lib/publish/publish-run-repository.ts
src/lib/publish/publish-lock.ts
```

初期仍可读写现有 `SyncRun` 表，不需要立即做数据库 migration。这样先获得代码结构收益，再单独决定是否改表名。

### P2：清理领域 DTO 和错误类型

后续可将：

```text
SyncRunnerOptions → PostPublishOptions
sync-errors.ts    → publish-errors.ts
SyncLogItem       → PublishLogItem
```

并移除 `MERGE_CONFLICT`、`REVISION_CONFLICT`、`WRITEBACK_CONFLICT` 等不再适用的错误语义。

### P2：更新当前入口文档

历史总结可以保留旧命令作为历史记录；当前架构计划和治理文档不应继续把以下内容描述为当前入口：

```text
content:prepare
content:rebuild
gallery-sync-service
ContentSyncService
```

## 7. 暂不建议做的事情

当前不建议：

1. 仅为了改名立即重命名 `SyncRun` 数据库表；
2. 为了删除所有 `sync` 字样而修改 migration；
3. 删除运行历史和并发保护；
4. 把 Post、Gallery 合并成一个大服务；
5. 把媒体准备、Cloudinary 上传和数据库写入重新合并；
6. 重新引入 Dashboard 内容编辑器、队列或多环境审批系统。

## 8. 当前验收基线

涉及发布、内容或媒体的改动继续运行：

```bash
bun run lint
bun test
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run content:verify
bun run build
```

结构优化的完成标准不是“所有文件都不再出现 sync”，而是：内容源只有 Git；Publish 是唯一正式发布流程；Post、Gallery、媒体和运行记录职责清晰；CLI、TUI、Dashboard 复用同一 Publish Workflow；dry-run 完全只读；旧双向能力没有新的调用方。