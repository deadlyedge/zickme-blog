# Stage 5 阶段交付总结

> 阶段名称：UI 视觉微调、Frontmatter 增强与双向内容同步  
> 完成日期：2026-09-09  
> 对应计划：`documents/development-plan-stage5.md`

---

## 一、阶段结论

Stage 5 实际完成了以下四个方向：

1. 品牌与基础 UI 微调；
2. Frontmatter 扩展与外链展示；
3. Dashboard 文章封面管理与本地回写；
4. 本地与数据库双向内容同步。

原计划中的纯图片/摄影相册功能没有继续塞入普通 `Post` 模型，而是根据内容源、媒体组织、查询方式和前台交互的差异，整体拆分为独立的 Stage 6。

详细计划见：`documents/development-plan-stage6.md`。

---

## 二、主要交付内容

### 1. Frontmatter 元数据扩展

支持 `links`、`github`、`twitter`、`demo`、`figma`、`paper`、`category`、`series`、`canonicalUrl`、`outdatedWarning` 和 `layout` 等字段。

扩展元数据统一保存于 `Post.metadata` JSONB 字段。

核心文件：

- `src/lib/post-metadata.ts`
- `src/types/content.ts`
- `src/db/schema/posts.ts`
- `src/lib/sync-service.ts`
- `scripts/check-content.ts`

### 2. 外链展示

新增 `src/components/PostLinks.tsx`，接入文章详情页和卡片。

支持：

- GitHub 和 X/Twitter 自定义 SVG 图标；
- Demo、文档、Figma、Paper/PDF 类型识别；
- 完整 URL 展示；
- 行内链接样式，不使用整行按钮；
- 安全的新窗口跳转；
- 长 URL 自动换行。

### 3. Dashboard 封面管理

在 `/dashboard/posts` 中支持外部图片 URL、本地图片上传、Cloudinary WebP 压缩、16:9 预览、替换和移除封面。

新增管理员 Actions：

- `updatePostPosterAction()`
- `uploadPostPosterAction()`

操作要求 ADMIN Session，并校验文章 ID、URL、图片类型和文件大小。

### 4. 本地 Frontmatter 回写

新增 `src/lib/frontmatter-writeback.ts`。

本地运行同步命令时，如果数据库版本较新，会根据 slug 找到 Markdown 文件，并将数据库封面 URL 回写到 `image` 字段。支持多级目录文章。

### 5. 双向内容同步

新增：

- `src/lib/post-exporter.ts`
- `src/lib/content-diff.ts`
- `scripts/sync-pull.ts`

新增命令：

```bash
bun run sync:pull
```

默认只拉取本地不存在的远端文章，不覆盖本地文件。强制覆盖使用 `bun run sync:pull -- --force`。

Dashboard `/dashboard/sync` 支持数据库文章 ZIP 导出和本地/远端差异统计。

差异类型包括 `LOCAL_ONLY`、`REMOTE_ONLY`、`CONFLICT` 和 `IN_SYNC`。

### 6. 中文 slug 冲突保护

`Post` 表新增 `sourcePath` 字段，用于记录本地 Markdown 来源路径。

同步规则：

- 显式 Frontmatter slug 优先；
- 缺少 slug 时自动生成；
- 同一批次重复 slug 时全部拒绝写库；
- 数据库来源路径不同的同 slug 文章拒绝覆盖；
- `check-content --fix` 只为无冲突文章写回自动生成 slug；
- 不根据扫描顺序自动追加 `-2`，避免 URL 不稳定。

### 7. Drizzle Migration 精简

迁移已整理为单一 baseline：

- `drizzle/0000_baseline.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`

旧迁移保留在 `drizzle/archive/`。

数据库已确认 `Post.metadata` 和 `Post.sourcePath` 存在，文章数量未减少，baseline hash 已登记，`bun run db:migrate` 可幂等执行。

---

## 三、质量验证

已通过：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
bun run db:migrate
```

构建使用 Next.js 16 Turbopack，TypeScript、静态页面生成和数据库迁移验证均通过。

内容检查中仅保留原有 `excerpt` 建议，不属于错误。

---

## 四、已知边界

1. 封面编辑目前提供 16:9 预览建议，尚未实现可视化裁剪工具；
2. 双向差异当前主要基于 slug 和文件修改时间，尚未使用完整正文 hash；
3. Dashboard 网页端导出 ZIP，不直接写入开发机本地工作区；
4. `sync:pull --force` 会覆盖同名本地文件；
5. 尚未实现 slug 历史表和旧 URL 重定向；
6. Gallery/Photo Album 未在 Stage 5 中实现，已拆分到 Stage 6。

---

## 五、Stage 6 衔接

Stage 6 将建立独立的图片相册内容体系：

```text
content/photo-gallery/
        ↓
GallerySyncService
        ↓
Gallery / GalleryImage
        ↓
Cloudinary photo-gallery/{albumSlug}/...
        ↓
/gallery/[albumSlug]
```