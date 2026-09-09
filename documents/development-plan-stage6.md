# 第六阶段开发计划（Stage 6：独立图片相册与 Gallery 内容体系）

> 来源：从 `documents/development-plan-stage5.md` 拆分出的纯图片/摄影相册需求  
> 制定日期：2026-09-09  
> 前置总结：`documents/stage5-summary.md`

---

## 一、架构决策

Stage 6 不再将相册伪装成普通 Markdown Post，而是建立独立的 Gallery 内容体系。

```text
content/posts/
    Markdown → Post → /posts/[slug]

content/photo-gallery/
    album.yaml + images/
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

1. 支持独立相册目录和 `album.yaml` 配置；
2. 将图片同步到独立 Cloudinary folder；
3. 在数据库中保存相册和图片索引；
4. 提供 `/gallery` 与 `/gallery/[albumSlug]`；
5. 实现响应式 Masonry/Grid；
6. 实现支持键盘和触摸的 Lightbox；
7. 支持图片顺序、尺寸、标题、描述和受控 EXIF 展示；
8. 为 Dashboard 提供同步、封面和排序管理。

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
    ├── japan-autumn/
    │   ├── album.yaml
    │   └── images/
    │       ├── 001.jpg
    │       ├── 002.jpg
    │       └── 003.jpg
    └── studio-design/
        ├── album.yaml
        └── images/
            ├── cover.png
            └── detail-01.png
```

`album.yaml` 示例：

```yaml
slug: japan-autumn
title: 秋日京都
description: 2025 年秋季京都旅行摄影记录
date: 2025-11-12
status: published
cover: images/001.jpg
tags:
  - Photography
  - Travel
location: Kyoto, Japan
layout: masonry
sort: filename
showExif: false
showLocation: false
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

第一版自动扫描 `images/`，只有需要自定义标题、描述或手动顺序时才增加图片级配置。

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
- fileHash
- fileSize
- sourceModifiedAt
- exif
- createdAt
- updatedAt
```

约束：

```text
Gallery.slug unique
(galleryId, sourcePath) unique
(galleryId, sortOrder) unique
```

EXIF 使用 JSONB 保存，但前台只展示白名单字段：相机、镜头、ISO、光圈、曝光时间、焦距和拍摄时间。GPS 默认不公开。

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
3. 原图 URL 和缩略图 URL 写入数据库；
4. 使用文件 hash、大小和修改时间实现增量上传；
5. 删除操作提供 dry-run，避免误删 Cloudinary 资源。

同步规则：

```text
本地图片不存在数据库 → 新增并上传
hash 未变化 → 跳过上传
hash 变化 → 覆盖同一 public ID 并更新记录
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

任务：新增 Gallery/GalleryImage 表、类型、`album.yaml` 解析、slug/封面/状态校验、图片扫描和稳定排序。

### 阶段二：GallerySyncService

目标文件：

```text
src/lib/gallery/gallery-sync-service.ts
src/lib/gallery/cloudinary.ts
scripts/sync-galleries.ts
```

任务：实现 hash、图片尺寸、WebP/缩略图处理、Cloudinary 上传、增量更新、删除归档、失败重试和阶段日志。

命令：

```bash
bun run sync:galleries
```

可选地由 `bun run sync` 串联执行，但 Post 与 Gallery 的日志、错误和统计必须保持可区分。

### 阶段三：查询与路由

目标文件：

```text
src/lib/gallery/gallery-queries.ts
src/app/gallery/page.tsx
src/app/gallery/[slug]/page.tsx
src/components/gallery/GalleryCard.tsx
```

任务：新增相册列表、相册详情、SEO metadata、canonical URL 和空状态；不改变普通 Post 查询。

### 阶段四：Masonry 与 Lightbox

目标文件：

```text
src/components/gallery/GalleryGrid.tsx
src/components/gallery/GalleryLightbox.tsx
src/components/gallery/GalleryPostView.tsx
```

任务：响应式 Masonry/Grid、比例保留、上一张/下一张、Escape、左右键、全屏、原图打开、触摸操作、加载失败处理和 reduced motion。

### 阶段五：EXIF 与隐私

目标文件：

```text
src/lib/gallery/exif.ts
src/components/gallery/ExifPanel.tsx
```

任务：读取 EXIF 白名单字段，根据 `showExif` 控制显示，默认关闭 GPS，解析失败时不影响图片展示。

### 阶段六：Dashboard 管理

目标文件：

```text
src/app/dashboard/gallery/page.tsx
src/lib/actions/gallery-admin.ts
```

任务：相册列表、手动同步、同步错误、封面设置、图片排序、隐藏和归档。所有写操作要求 ADMIN Session。

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

---

## 八、验收标准

### 内容与同步

- `content/photo-gallery/{album}/album.yaml` 可创建相册；
- slug 冲突时同步失败且不覆盖其他相册；
- 图片进入 `photo-gallery/{albumSlug}/`；
- 未修改图片不会重复上传；
- 本地删除图片后数据库状态正确更新；
- 普通 Post 同步不受 Gallery 影响。

### 前台

- `/gallery` 和 `/gallery/[slug]` 可访问；
- Masonry/Grid 适配手机、平板和桌面；
- Lightbox 支持鼠标、触摸和键盘；
- 原图、缩略图、空相册和失败状态处理正确；
- GPS 默认不公开；
- SEO metadata 正确。

### 后台与安全

- 只有 ADMIN 可执行同步和编辑；
- 凭证仅来自环境变量；
- 文件路径防止路径穿越；
- public ID 不允许非法路径注入；
- 图片格式和大小有限制；
- 删除操作支持 dry-run。

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
2. Lightbox 需要限制原图预加载数量；
3. EXIF 必须采用白名单并考虑隐私；
4. Cloudinary 删除策略需要人工确认；
5. 图片评论、收藏和点赞应继续扩展 GalleryImage，不重新并入 Post；
6. 如需旧相册 URL 重定向，新增 Gallery slug history 表。