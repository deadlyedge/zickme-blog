# 第六阶段开发计划（Stage 6：独立图片相册与 Gallery 内容体系）

> 来源：从 `documents/development-plan-stage5.md` 拆分出的纯图片/摄影相册需求  
> 制定日期：2026-09-09  
> 前置总结：`documents/stage5-summary.md`

---

## 一、架构决策

Stage 6 不再将相册伪装成普通 Markdown Post，而是建立独立的 Gallery 内容体系。

由于 `content/` 目录由 Git 管理，Gallery 不保存原始 JPEG、PNG、TIFF、BMP、RAW 等文件。Gallery 本地内容目录只保存经过统一处理的 WebP 文件，并且该 WebP 与上传到 Cloudinary 的展示版本保持一致。原始文件只作为同步输入，不进入仓库、Cloudinary 或可下载备份。

```text
content/posts/
    Markdown → Post → /posts/[slug]

content/photo-gallery/
    gallery.yaml + album.yaml + images/
    ↓
    GallerySyncService
    ↓
    Gallery / GalleryImage
    ↓
    Cloudinary photo-gallery/{albumSlug}/...
    ↓
    /gallery/[albumSlug]
```

Gallery 不默认进入 `/posts`、普通文章搜索或 `PostCard`。如果首页需要混排，应分别查询和渲染 Post 与 Gallery。

---

## 二、目标与非目标

### 目标

1. 支持 `content/photo-gallery/{album}/album.yaml` 作为单个相册的人工编辑源；
2. 自动生成 `content/photo-gallery/gallery.yaml` 作为全局相册索引；
3. 为每张图片提供可编辑的标题、描述、替代文本、排序和隐藏状态；
4. 将图片同步到独立 Cloudinary folder；
5. 在数据库中保存相册和图片索引；
6. 提供 `/gallery` 与 `/gallery/[albumSlug]`；
7. 实现响应式 Masonry/Grid；
8. 实现支持键盘和触摸的 Lightbox；
9. 支持图片顺序、尺寸、标题、描述和受控 EXIF 展示；
10. 为 Dashboard 提供同步、编辑、添加、减少、封面和排序管理。
11. 在不保存原图的前提下保留必要的尺寸、EXIF 和人工描述信息。

### 非目标

1. 不把 Gallery 写入 `Post` 表；
2. 不把 Cloudinary folder 当作唯一数据源；
3. 第一版不实现复杂图片编辑器；
4. 默认不公开 GPS 等敏感 EXIF；
5. 前台不请求 Cloudinary Admin API。

---

## 三、本地目录规范

```text
content/
├── posts/
└── photo-gallery/
    ├── gallery.yaml              # 自动生成的全局索引，不建议手动编辑
    ├── japan-autumn/
    │   ├── album.yaml            # 单个相册的人工编辑源
    │   └── images/
    │       ├── 001.webp
    │       ├── 002.webp
    │       └── 003.webp
    └── studio-design/
        ├── album.yaml
        └── images/
            ├── cover.webp
            └── detail-01.webp
```

`album.yaml` 示例：

```yaml
slug: japan-autumn
title: 秋日京都
description: 2025 年秋季京都旅行摄影记录
date: 2025-11-12
status: published
cover: images/001.webp
tags:
  - Photography
  - Travel
location: Kyoto, Japan
layout: masonry
sort: filename
showExif: false
showLocation: false

images:
  - file: images/001.webp
    title: 雨后的街道
    description: 清晨雨后的京都街道。
    alt: 雨后的京都街道
    order: 1
    hidden: false

  - file: images/002.webp
    title: 枫叶
    description: 东山地区秋日的红色枫叶。
    alt: 京都秋日枫叶
    order: 2
    hidden: false
```

### 配置字段

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `slug` | string | 是 | 相册唯一标识 |
| `title` | string | 是 | 相册标题 |
| `description` | string | 否 | 相册描述 |
| `date` | date | 否 | 相册日期 |
| `status` | string | 是 | `published` / `draft` / `archived` |
| `cover` | string | 否 | 相对相册目录的封面路径 |
| `tags` | string[] | 否 | 相册标签 |
| `layout` | string | 否 | `masonry` / `grid` / `justified` |
| `sort` | string | 否 | `filename` / `mtime` / `manual` |
| `showExif` | boolean | 否 | 是否显示允许的 EXIF |
| `showLocation` | boolean | 否 | 是否显示地点，默认关闭 |
| `images` | object[] | 否 | 图片级配置列表 |

图片级字段：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `file` | string | 是 | 相对于相册目录的图片路径 |
| `title` | string | 否 | 图片标题 |
| `description` | string | 否 | 图片描述 |
| `alt` | string | 否 | 无障碍替代文本 |
| `order` | number | 否 | 手动排序值 |
| `hidden` | boolean | 否 | 是否在前台隐藏 |

第一版自动扫描 `images/` 目录中的处理后 WebP 文件，并为每张图片生成 `images` 配置骨架。未填写的 `title`、`description` 和 `alt` 使用空值或安全默认值。外部 JPEG/PNG 等原始输入应在进入 `content/photo-gallery/` 前完成转换，不提交到 Git。

### `gallery.yaml` 自动索引

`gallery.yaml` 是 `content/photo-gallery/` 下的自动生成文件，不是人工编辑源。它用于记录所有相册的索引摘要：

```yaml
# This file is generated. Do not edit manually.
generatedAt: 2026-09-09T12:00:00.000Z
albums:
  - slug: japan-autumn
    title: 秋日京都
    description: 2025 年秋季京都旅行摄影记录
    path: japan-autumn/album.yaml
    cover: japan-autumn/images/001.webp
    imageCount: 24
    status: published
    updatedAt: 2026-09-09T11:58:00.000Z
```

规则：

1. `gallery.yaml` 由 `check-content --fix`、Gallery 索引命令或 Gallery 同步服务生成；
2. 不建议手动编辑，下一次生成时会被覆盖；
3. `album.yaml` 才是相册及图片元数据的真实编辑源；
4. 如果发现手动修改 `gallery.yaml`，检查工具应提示该文件会被重新生成。

### 自动生成 `album.yaml` 骨架

当发现以下目录但缺少配置文件时：

```text
content/photo-gallery/japan-autumn/
```

执行：

```bash
bun run content:check -- --fix
```

应自动生成 `album.yaml`，包括：

- 根据目录名生成的 `slug`；
- 根据目录名生成的初始 `title`；
- `status: draft`；
- 空的 `description`、`cover`、`location` 和 `tags`；
- 默认 `layout: masonry` 和 `sort: filename`；
- 扫描 `images/` 生成的图片配置；
- 每张图片的 `title`、`description`、`alt`、`order` 和 `hidden` 字段。

如果 `album.yaml` 已存在，`--fix` 不得覆盖已有的人工内容，只能补充缺失的图片配置。

---

## 四、数据库模型

### Gallery

```text
Gallery
- id
- slug
- title
- description
- cover
- status
- publishedAt
- sourcePath
- metadata
- createdAt
- updatedAt
```

### GalleryImage

```text
GalleryImage
- id
- galleryId
- sourcePath
- publicId
- url
- thumbnailUrl
- title
- description
- alt
- sortOrder
- width
- height
- exif
- fileHash
- fileSize
- sourceModifiedAt
- fileHash
- fileSize
- sourceModifiedAt
- lastSyncedAt
- syncVersion
- revision
- createdAt
- updatedAt
```

约束：

```text
Gallery.slug unique
(galleryId, sourcePath) unique
(galleryId, sortOrder) unique
```

EXIF 使用 JSONB 保存，但前台只展示白名单字段：相机、镜头、ISO、光圈、曝光时间、焦距和拍摄时间。GPS 默认不公开。人工维护的 `title`、`description`、`alt`、`sortOrder` 和 `hidden` 不得因重新扫描或重新生成 WebP 被覆盖。

---

## 五、Cloudinary 与增量同步

统一 public ID：

```text
photo-gallery/{albumSlug}/{fileNameWithoutExtension}
```

示例：

```text
photo-gallery/japan-autumn/001
```

要求：

1. Gallery 图片不进入普通 `myblog` folder；
2. 相册 slug 和文件名必须安全清洗；
3. 处理后的展示版 WebP URL 和缩略图 URL 写入数据库；
4. 使用文件 hash、大小和修改时间实现增量上传；
5. 删除操作提供 dry-run，避免误删 Cloudinary 资源。

### WebP 处理与 EXIF 策略

媒体处理流程必须在上传前完成：

```text
外部原始输入（不进入 Git）
        ↓
读取尺寸、文件 hash 和 EXIF
        ↓
按最大尺寸限制缩放
        ↓
生成 WebP 展示文件
        ↓
将同一个 WebP 文件保存到 content/photo-gallery/
        ↓
将同一个 WebP 文件上传到 Cloudinary
```

规则：

1. 本地 Git 目录只允许保存 `.webp` 展示文件；
2. 不保存或上传原始 JPEG、PNG、TIFF、BMP、RAW 文件；
3. 本地 WebP 与 Cloudinary 上传版本使用同一处理结果，避免两端内容不一致；
4. 转换前读取 EXIF，转换后的 WebP 默认移除完整 EXIF；
5. 公开 EXIF 白名单写入 `GalleryImage.exif`，不依赖 WebP 文件是否携带 EXIF；
6. GPS、设备序列号等敏感信息默认丢弃或不返回前台；
7. 如果未来需要重新处理图片，以原始输入重新生成新的 WebP，不从已压缩 WebP 反复转换。

同步规则：

```text
本地处理后 WebP 不存在数据库 → 新增并上传
WebP hash 未变化 → 跳过上传
WebP hash 变化 → 覆盖同一 public ID 并更新记录
数据库有、本地没有 → 标记删除/归档
相册目录消失 → Gallery 标记 ARCHIVED
```

---

## 六、开发阶段

### 阶段一：Schema 与解析器

目标文件：

```text
src/db/schema/gallery.ts
src/db/schema/index.ts
src/types/gallery.ts
src/lib/gallery/gallery-parser.ts
drizzle/*
```

任务：新增 Gallery/GalleryImage 表、类型、`album.yaml` 解析、slug/封面/状态校验、WebP 图片扫描和稳定排序；扩展 `check-content --fix`，自动为缺少配置的相册生成 `album.yaml` 骨架、补齐图片级配置并生成 `gallery.yaml`。检查工具必须拒绝未处理的原始图片进入受 Git 管理的 Gallery 目录。

### 阶段二：GallerySyncService

目标文件：

```text
src/lib/gallery/gallery-sync-service.ts
src/lib/gallery/cloudinary.ts
scripts/sync-galleries.ts
```

任务：实现原始输入到 WebP 的一次性处理、hash、图片尺寸、公开 EXIF 提取、WebP/缩略图处理、Cloudinary 上传、增量更新、删除归档、失败重试和阶段日志。上传和本地保存必须使用同一份处理后 WebP，不保留原图。

命令：

```bash
bun run sync:galleries
```

可选地由 `bun run sync` 串联执行，但 Post 与 Gallery 的日志、错误和统计必须保持可区分。

### 阶段三：Gallery 索引与内容检查工具

目标文件：

```text
scripts/check-gallery.ts
scripts/check-content.ts
src/lib/gallery/gallery-index.ts
```

任务：

1. 扫描 `content/photo-gallery/` 下的相册目录；
2. 检查 `album.yaml` 是否存在、格式是否正确；
3. 检查相册 slug、封面和图片路径；
4. 检查图片 `order` 是否重复；
5. 检查配置中登记但文件不存在的图片；
6. 检查实际存在但未登记的图片；
7. 通过 `--fix` 生成缺失的 `album.yaml` 骨架；
8. 通过 `--fix` 补齐图片配置，但不得覆盖已有人工字段；
9. 自动生成 `content/photo-gallery/gallery.yaml`；
10. 提示 `gallery.yaml` 为生成文件，不接受人工修改作为内容源。

命令：

```bash
bun run content:check
bun run content:check -- --fix
bun run gallery:index
```

其中 `gallery:index` 只重新生成 `gallery.yaml`，不修改 `album.yaml`。

建议命令：

```bash
bun run gallery:diff
bun run gallery:pull
bun run gallery:pull -- --force
```

其中 `gallery:pull` 默认只生成本地不存在的 `album.yaml` 或图片配置变更；`--force` 也必须在冲突确认后使用，不得静默覆盖人工字段。

### 阶段四：查询与路由

目标文件：

```text
src/lib/gallery/gallery-queries.ts
src/app/gallery/page.tsx
src/app/gallery/[slug]/page.tsx
src/components/gallery/GalleryCard.tsx
```

任务：新增相册列表、相册详情、SEO metadata、canonical URL 和空状态；不改变普通 Post 查询。

### 阶段五：Masonry 与 Lightbox

目标文件：

```text
src/components/gallery/GalleryGrid.tsx
src/components/gallery/GalleryLightbox.tsx
src/components/gallery/GalleryPostView.tsx
```

任务：响应式 Masonry/Grid、比例保留、上一张/下一张、Escape、左右键、全屏、原图打开、触摸操作、加载失败处理和 reduced motion。

### 阶段六：EXIF 与隐私

目标文件：

```text
src/lib/gallery/exif.ts
src/components/gallery/ExifPanel.tsx
```

任务：读取 EXIF 白名单字段，根据 `showExif` 控制显示，默认关闭 GPS，解析失败时不影响图片展示。

### 阶段七：Dashboard 管理与双向同步

目标文件：

```text
src/app/dashboard/gallery/page.tsx
src/lib/actions/gallery-admin.ts
```

任务：相册列表、手动同步、同步错误、封面设置、图片排序、图片标题和描述编辑、图片添加/减少、隐藏和归档。所有写操作要求 ADMIN Session。

Dashboard 编辑、添加或减少相册/图片时，必须同时更新数据库和本地内容同步状态：

1. 可直接回写 `album.yaml` 的变更生成结果；
2. 在无法写入部署环境工作区时，提供 ZIP 或 patch 下载；
3. 不直接编辑 `gallery.yaml`，由索引工具重新生成；
4. 本地与数据库均发生修改时标记 `CONFLICT`，不自动覆盖；
5. 本地删除图片时先标记待删除，Cloudinary 删除需要管理员确认；
6. Dashboard 新增图片后应进入 `album.yaml` 的 `images` 列表或待回写队列。

### 三方同步与防信息流失

三方同步不把三个系统都视为独立真相源：

```text
album.yaml       单个相册及图片人工元数据的内容源
gallery.yaml     自动生成的全局索引，不是编辑源
PostgreSQL       Gallery/GalleryImage 运行时副本
Dashboard        数据库管理入口和本地回写变更生成器
Cloudinary       与本地 WebP 一致的媒体存储和 CDN
CLI              本地文件应用、合并和冲突处理
```

同步必须区分两类字段：

```text
自动字段：fileHash、fileSize、width、height、exif、publicId、url、sourceModifiedAt
人工字段：title、description、alt、sortOrder、hidden、cover、tags、location
```

自动字段可以重新计算；人工字段不能被图片重新处理覆盖。

建议保存：

```text
contentHash
fileHash
sourceModifiedAt
lastSyncedAt
syncVersion
revision
mergeBase
```

冲突规则：

```text
本地变更，数据库未变更 → 接受本地并推送
数据库变更，本地未变更 → 生成 album.yaml 回写或 patch
本地和数据库都变更 → CONFLICT，不自动覆盖
本地删除图片 → PENDING_DELETE，等待确认
Dashboard 删除图片 → 先更新状态，再生成本地回写变更
```

比较必须基于上一次同步快照（merge base）进行字段级合并，而不是简单地整份覆盖 `album.yaml`。Dashboard 保存时使用 `revision` 或 `expectedUpdatedAt` 乐观锁；版本不一致时拒绝保存并要求重新加载。

---

## 七、集成规则

普通文章：

```ts
fetchPosts()
fetchPostBySlug()
```

图片相册：

```ts
fetchGalleries()
fetchGalleryBySlug()
```

禁止通过 `layout === 'gallery'` 把相册混入 `fetchPosts()`。如果首页展示最新相册，使用独立的 `fetchLatestGalleries()`。

同步状态建议：

```text
LOCAL_ONLY
REMOTE_ONLY
CONFLICT
IN_SYNC
PENDING_DELETE
```

相册和图片的变更建议记录 `contentHash`、`sourceModifiedAt`、`lastSyncedAt` 与 `syncVersion`。当本地和 Dashboard 同时修改时，必须进入冲突状态，等待人工合并。

---

## 八、验收标准

### 内容与同步

- `content/photo-gallery/{album}/album.yaml` 可创建相册；
- `bun run content:check -- --fix` 能为缺少配置的相册生成 `album.yaml` 内容骨架；
- 每张图片的 `title`、`description`、`alt`、`order` 和 `hidden` 可独立编辑；
- `content/photo-gallery/gallery.yaml` 能自动生成且不作为人工编辑源；
- slug 冲突时同步失败且不覆盖其他相册；
- 本地只保存处理后的 WebP，且与上传到 Cloudinary 的 WebP 内容一致；
- 不保存、不同步或导出原始 JPEG/PNG/TIFF/BMP/RAW 文件；
- 转换前提取 EXIF，转换后的 WebP 默认不携带完整 EXIF；
- 公开 EXIF 由数据库白名单字段提供；
- 图片进入 `photo-gallery/{albumSlug}/`；
- 未修改图片不会重复上传；
- 本地删除图片后数据库状态正确更新；
- Dashboard 添加、编辑或减少图片后能生成可回写 `album.yaml` 的变更；
- 本地和数据库同时修改时能识别冲突且不自动覆盖；
- 普通 Post 同步不受 Gallery 影响。

### 前台

- `/gallery` 和 `/gallery/[slug]` 可访问；
- Masonry/Grid 适配手机、平板和桌面；
- Lightbox 支持鼠标、触摸和键盘；
- 处理后的 WebP、缩略图、空相册和失败状态处理正确；
- GPS 默认不公开；
- SEO metadata 正确。

### 后台与安全

- 只有 ADMIN 可执行同步和编辑；
- 凭证仅来自环境变量；
- 文件路径防止路径穿越；
- public ID 不允许非法路径注入；
- 图片格式和大小有限制；
- 删除操作支持 dry-run。
- Dashboard 编辑、添加和减少图片不会静默丢失本地人工字段；
- 三方同时修改时能通过 merge base 识别冲突；

### 质量验证

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
bun run db:migrate
```

---

## 九、风险与后续扩展

1. 大型相册需要分页或分批加载；
2. Lightbox 需要限制展示版 WebP 的预加载数量；
3. EXIF 必须采用白名单并考虑隐私；
4. Cloudinary 删除策略需要人工确认；
5. 图片评论、收藏和点赞应继续扩展 GalleryImage，不重新并入 Post；
6. 如需旧相册 URL 重定向，新增 Gallery slug history 表。