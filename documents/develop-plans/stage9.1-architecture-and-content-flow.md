# Stage 9.1：架构和内容流程基线

> 本文是 Stage 9.1 的交付基线。它描述当前实际代码边界和用户流程，不代表快照恢复、内容格式化器或数据库字段清理已经完成。

## 1. 系统架构

```text
编辑 Markdown / album.yaml / 原始图片
                │
                ▼
内容检查、Gallery 索引、Git diff
                │
                ▼
        Sync Orchestrator
       scope / runId / TTL / summary
          ┌─────┴─────┐
          ▼           ▼
     Post Domain  Gallery Domain
     Markdown     album.yaml + WebP
     Post/Tag     Gallery/Image
          └─────┬─────┘
                ▼
       PostgreSQL / Drizzle
       运行时副本与运行摘要
                │
                ▼
         Blog / Gallery UI
```

内容源是人工编辑事实来源，数据库是站点运行时副本。同步不会把数据库变成 Markdown 或 `album.yaml` 的替代品，也不会自动删除 Cloudinary 资源。

## 2. 目录职责和依赖方向

| 目录 | 职责 | 不应承担的职责 |
| :--- | :--- | :--- |
| `content/posts/` | Post Markdown、Frontmatter 和文章本地图片 | 直接写数据库 |
| `content/photo-gallery/` | Gallery 的 `album.yaml`、自动生成的 `gallery.yaml` 和 WebP | 手工编辑 `gallery.yaml`、存放原始图片 |
| `content/.gallery-input/` | 被 Git 忽略的 Gallery 原始输入 | 作为可发布内容或 Git 提交内容 |
| `src/app/` | 页面、布局、路由和 Dashboard UI | 直接拼接 SQL 或操作 Cloudinary |
| `src/components/` | 可复用展示和交互组件 | 领域同步编排 |
| `src/db/schema/` | Drizzle 表定义和 schema 导出 | 内容解析和媒体处理 |
| `src/lib/actions/` | 权限校验、输入校验、调用服务、返回安全 DTO | 直接承担完整领域同步流程 |
| `src/lib/gallery/` | Gallery 解析、图片处理、媒体和数据库同步 | 读取或修改 Post 业务字段 |
| `src/lib/sync/` | scope、runId、TTL 锁、运行摘要和统一编排 | 解析 Post/Gallery 业务字段 |
| `src/lib/sync-service.ts` | 当前 Post 领域同步服务兼容入口 | 被 Dashboard 直接调用内部实现 |
| `scripts/` | CLI 入口、内容检查、索引和运维工具 | 绕过统一编排器实现另一套同步协议 |

依赖方向固定为：

```text
CLI / Dashboard Action → Sync Orchestrator → Post 或 Gallery Domain → DB / Cloudinary
```

Post 与 Gallery 保持独立业务表和领域服务；`ALL` 只是顺序编排，不表示跨域原子事务。

## 3. 命令行为表

| 命令 | 行为 | 是否真实写入 |
| :--- | :--- | :--- |
| `bun run content:check -- --no-examples` | 检查 Post、Gallery、路径和敏感内容 | 否 |
| `bun run gallery:index` | 根据相册源重新生成 `gallery.yaml` | 写入生成文件 |
| `bun run sync` | 默认执行 `ALL`，即 Post 后 Gallery | 是 |
| `bun run sync -- --scope posts` | 仅同步 Post | 是 |
| `bun run sync -- --scope galleries` | 仅同步 Gallery | 是，可能处理媒体 |
| `bun run sync -- --scope all --dry-run --json` | 双域模拟并输出运行摘要 | 否；仅允许 dry-run 范围内的预览行为 |
| `bun run sync:galleries` | Gallery 专用兼容入口，支持 `--input-dir` | 是 |
| `bun run sync:pull` | 将数据库中本地缺失的 Post 拉回内容源 | 可能写入本地文件 |
| `bun run gallery:pull` | 校验并应用已确认的 Gallery patch | 可能写入本地文件 |

`bun run sync` 无 scope 时等价于 `bun run sync -- --scope all`。单域同步必须显式指定 scope。`--retry` 是 scope 级重跑，不是实体级重试。

## 4. 推荐内容生产闭环

### Post

```bash
$EDITOR content/posts/my-post.md
bun run content:check -- --no-examples
bun run sync -- --scope all --dry-run --json
git diff -- content/posts
git diff --check
git add content/posts
git commit -m "content: update post"
bun run sync -- --scope posts
```

### Gallery

```bash
cp ./photos/* content/.gallery-input/travel/
$EDITOR content/photo-gallery/travel/album.yaml
bun run gallery:index
bun run content:check -- --no-examples
bun run sync -- --scope galleries --dry-run --json
git diff -- content/photo-gallery
git add content/photo-gallery
git commit -m "content: update gallery"
bun run sync -- --scope galleries
```

### Full Blog

```bash
bun run content:check -- --no-examples
bun run gallery:index
bun run sync -- --scope all --dry-run --json
git diff --check
git status --short
git add content/posts content/photo-gallery
git commit -m "content: update blog"
bun run sync
```

失败时先阅读 JSON/运行摘要，再按 `posts` 或 `galleries` 单域重跑。Post 成功而 Gallery 失败时，不重复覆盖已成功的 Post 结果；修复 Gallery 后使用显式 Gallery scope 重跑。

## 5. 内容边界和安全规则

- `album.yaml` 是人工编辑源，`gallery.yaml` 只能由 `gallery:index` 生成。
- 原始 JPEG、PNG、TIFF、BMP 和 RAW 只能放在 `.gallery-input`，该目录已被 Git 忽略。
- 不提交 `.env`、密钥、数据库导出、临时 patch 或原始 Gallery 媒体。
- dry-run、`git diff` 和 `git diff --check` 是真实同步前的确认步骤。
- 同一 scope 不要同时从 CLI 和 Dashboard 启动；TTL 锁会拒绝重复运行。
- 数据库同步不会回滚 Markdown、`album.yaml` 或 Cloudinary 二进制资源。

## 6. Stage 9.1 范围

本阶段已建立架构、目录职责、领域边界、命令行为和内容生产路径，并将默认 `sync` 统一为 `ALL`。以下内容留在后续阶段：

- 纯函数抽离、Action/Service 深度重构和循环依赖治理（9.2）；
- 字段使用矩阵、废弃字段和 SiteSnapshot migration（9.3）；
- `content:format`、`content:verify`、`content:prepare`（9.4）；
- Dashboard 数据库快照创建、恢复、删除和 PRE_RESTORE 保护（9.5）。