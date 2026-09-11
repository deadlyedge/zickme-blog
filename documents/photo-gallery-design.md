# Photo Gallery 体验设计与实施指导

> 状态：设计稿，供 Stage 6 后续实施使用  
> 关联计划：[`development-plan-stage6.md`](development-plan-stage6.md)  
> 适用版本：Next.js 16 App Router、React 19、TypeScript、Tailwind CSS v4、Bun

## 1. 目标与范围

Photo Gallery 是独立于文章（Post）的图片内容体系。本文件只定义前台相册列表/详情页的视觉、交互和实现边界；内容目录、数据库、Cloudinary、同步和 Dashboard 的完整计划以 `development-plan-stage6.md` 为准。

### 目标

1. 访问 Gallery 页面时，页面主体、固定导航栏和 Lightbox 使用统一的深灰色沉浸式视觉。
2. 横向桌面屏幕（例如 16:9）显示“左侧主图预览 + 右侧缩略图列表”的单列详情布局。
3. 点击右侧缩略图后，左侧直接切换主图，并在主图上显示标题、描述和受控 EXIF 信息。
4. 移动设备显示双列、保留原始比例的 Masonry 瀑布流；点击图片后打开全屏 Lightbox，并显示同一套信息浮层。
5. 支持键盘、触摸、屏幕阅读器、加载失败和 reduced motion 等可访问性与健壮性要求。

### 非目标

- 不将相册或图片伪装成 `Post`，不通过 `layout: gallery` 混入文章查询。
- 第一版不引入第三方 Masonry、灯箱或图片画廊库；使用项目已有的 Tailwind、Radix Dialog、Motion 和 `next/image`。
- 不在浏览器调用 Cloudinary Admin API；前台只消费数据库中的已过滤数据和 Cloudinary CDN URL。
- 不公开 GPS、设备序列号等敏感 EXIF，不展示原始图片下载地址。

## 2. 现有框架与可复用能力

当前代码库已经具备以下能力，实施时应优先复用：

| 现有能力 | 用途 | 约束 |
| :--- | :--- | :--- |
| `src/app/gallery/page.tsx`、`src/app/gallery/[slug]/page.tsx` | Gallery 列表和相册详情路由 | 目前尚未创建，按 Stage 6 新增 |
| `Gallery` / `GalleryImage` | 相册及图片的运行时副本 | 新增 `src/db/schema/gallery.ts`，不要扩展 `posts.ts` |
| `album.yaml` | 相册和图片人工元数据的真实编辑源 | `gallery.yaml` 只允许自动生成 |
| `GallerySyncService`、`sharp` | WebP 处理、尺寸、hash、EXIF 提取 | 上传 Cloudinary 和本地保存使用同一份处理后的 WebP |
| Cloudinary | CDN 图片、缩略图和尺寸变换 | 使用 `photo-gallery/{albumSlug}/...` 独立目录 |
| `next/image` | 主图和缩略图加载优化 | 复用已配置的 `res.cloudinary.com` remote pattern |
| `@radix-ui/react-dialog` | 移动端全屏 Lightbox 的语义基础 | 需要自定义全屏样式和图片切换逻辑 |
| `motion/react` | 预览切换和浮层过渡 | 遵守 `useReducedMotion()` |
| `lucide-react` | 关闭、前后切换、信息等图标 | 所有纯图标按钮必须有可读标签 |
| `src/app/globals.css` | 全局基础变量和滚动条 | Gallery 用页面作用域覆盖，不修改默认主题语义 |

当前根布局在 `src/app/layout.tsx` 中渲染全局 `HeaderNav`，且 `HeaderNav` 是固定定位客户端组件。因此 Gallery 深色状态不能只设置详情内容容器；必须有一个页面作用域方案同时覆盖 `body`、`main`、导航和 Lightbox。

## 3. 数据与 URL 约定

### 3.1 内容链路

```text
content/photo-gallery/{albumSlug}/album.yaml
  + images/*.webp
          ↓ GallerySyncService
PostgreSQL Gallery / GalleryImage
          ↓ gallery-queries.ts
/gallery
/gallery/[slug]
```

`album.yaml` 中已有的 `title`、`description`、`alt`、`order`、`hidden` 是人工字段；`width`、`height`、`exif`、`url`、`thumbnailUrl` 和 hash 是自动字段。详情页只查询 `status: PUBLISHED` 且未归档的相册，并过滤 `hidden: true` 的图片。

### 3.2 建议的路由状态

- `/gallery`：已发布相册列表，使用封面卡片和标题/描述/图片数量。
- `/gallery/[slug]`：相册详情；桌面端默认选中排序后的第一张可见图片。
- 桌面端当前图片可使用 `?image=<imageId>` 保存在 URL，支持刷新、复制链接和浏览器前进/后退；如果实现成本过高，第一版可先使用客户端状态，但必须在后续迭代补齐 URL 同步。
- 移动端 Lightbox 打开时不要求改变 URL，但关闭后必须返回原滚动位置。

查询层新增 `src/lib/gallery/gallery-queries.ts`，提供 `fetchGalleries()`、`fetchGalleryBySlug()`；禁止复用 `fetchPosts()` 或普通文章搜索查询。

## 4. 页面视觉与布局

### 4.1 Gallery 页面主题

Gallery 深色主题是“页面作用域主题”，不是用户的全局 Light/Dark 主题切换：

- 建议由 `GalleryShell` 在客户端挂载时给 `body` 添加 `gallery-mode`（或 `data-gallery-mode="true"`），卸载时清理；服务端渲染的最外层容器同时带 `className="gallery-page"`，避免首屏闪烁时完全没有样式。
- `gallery-page` / `gallery-mode` 应显式设置深灰背景、浅色前景、边框、卡片和 muted 文本变量；不要切换全局 `.dark`，避免影响其他并行 UI 和用户主题偏好。
- `HeaderNav` 根据 `usePathname()` 判断 `/gallery`，添加 `gallery-mode` 样式分支：背景改为半透明深灰、边框改为浅色透明边框、文字/Logo/按钮改为浅色，并将 Gallery 导航项标记为 active。
- `body`、`main`、Gallery 内容根节点和滚动条轨道必须使用同一深灰基色，不能出现页面底部或导航下方的浅色露出。
- Lightbox 打开时使用更深的不透明遮罩，信息浮层应有足够对比度；不要依赖背景图片保证文字可读。

建议的语义色（最终可按设计稿微调）：

```css
.gallery-page {
  --gallery-background: #242424;
  --gallery-surface: #2f2f2f;
  --gallery-foreground: #f5f5f5;
  --gallery-muted: #b5b5b5;
  --gallery-border: rgb(255 255 255 / 16%);
}
```

不要把这些值写入数据库 `themeConfig`；它们属于功能页面的固定视觉边界。

### 4.2 桌面端：主预览 + 右侧缩略图单列

以 `min-width: 768px` 作为第一版桌面布局断点，最终以实际测试调整：

```text
┌──────────────────────────────────────────────┐
│ fixed HeaderNav                               │
├──────────────────────────────┬───────────────┤
│                              │ 001           │
│       主图预览区             │ 002           │
│       object-contain         │ 003           │
│                              │ ...           │
│   title / description / EXIF │ 可滚动缩略图列 │
└──────────────────────────────┴───────────────┘
```

- 内容从 `pt-16` 开始，避免被 `HeaderNav` 覆盖；主容器使用 `min-h-[calc(100svh-4rem)]`，宽度限制为 `max-w-7xl`。
- 使用 CSS Grid：主预览区 `minmax(0, 1fr)`，缩略图列约 `clamp(5rem, 12vw, 9rem)`；两区之间保留固定 gap。
- 主图使用 `next/image` 的 `fill` + `object-contain`，主图容器必须拥有稳定的 `aspect-ratio` 或 `min-height`，避免切图时 CLS。
- 主图切换只更新客户端 selected image，不跳转页面；切换时可用轻量 opacity/scale 过渡，reduced motion 下取消动画。
- 右侧缩略图是可聚焦的 `<button>` 列表，每项必须包含 `alt`、选中态 `aria-current="true"` 或等价状态；列表本身独立纵向滚动。
- 主图底部使用渐变信息区或主图外侧 surface 区域，不遮挡主体；长描述折叠/截断时提供可展开方式。
- 桌面端应提供上一张/下一张按钮；缩略图列滚动到底部时仍能通过键盘继续切换。

### 4.3 移动端：双列瀑布 + 全屏 Lightbox

以 `<768px` 作为第一版移动布局：

- 使用 CSS columns（如 `columns-2`、固定 gap），每个图片卡 `break-inside-avoid`，图片按数据库 `width / height` 设置比例，禁止统一裁剪成固定比例。
- 图片卡使用原生按钮语义，显示处理后的缩略图；标题可作为视觉辅助，但完整 `alt` 来自人工字段。
- 不建议用 JS 测量瀑布高度或引入 Masonry 库；CSS columns 已满足双列要求且减少客户端逻辑。
- 点击卡片打开全屏 Lightbox，锁定背景滚动；关闭后恢复打开前的滚动位置和焦点。
- 移动端 Lightbox 采用 `fixed inset-0`，顶部提供关闭按钮，底部提供信息面板和前后切换按钮。图片区域使用 `object-contain`，不能因适配屏幕而裁掉照片。
- 信息面板默认显示标题和描述；当相册 `showExif` 为 `true` 时才显示 EXIF 白名单字段。
- 触摸左右滑动切换图片，垂直滑动不应误触发切换；点击遮罩关闭需避开信息面板和控件。

## 5. Lightbox 交互规范

建议组件：

```text
src/components/gallery/GalleryShell.tsx       # 页面主题和整体状态
src/components/gallery/GalleryGrid.tsx        # 移动双列 / 桌面缩略图
src/components/gallery/GalleryPreview.tsx     # 桌面主预览
src/components/gallery/GalleryLightbox.tsx    # 移动全屏及通用灯箱
src/components/gallery/GalleryImageInfo.tsx   # title / description / EXIF
src/components/gallery/ExifPanel.tsx          # 白名单字段展示
```

交互要求：

1. `Enter` / `Space` 打开当前图片；`Escape` 关闭；`ArrowLeft` / `ArrowRight` 切换；到首尾时可循环，但必须保持可预期并在按钮 disabled 状态与实际行为间一致。
2. 打开 Lightbox 时将焦点移到关闭按钮或图片标题；关闭时恢复到原图片卡按钮。Radix Dialog 可复用其 focus trap、Escape 和 aria 语义。
3. 图片加载中显示低干扰 skeleton；加载失败显示占位图和可读错误，不阻塞其他图片。
4. 图片加载策略：首屏主图/可见缩略图优先，移动瀑布使用 lazy loading；不要一次预加载整个相册。只预加载当前图相邻的有限图片。
5. 所有按钮有可见 focus ring；触摸目标至少满足项目现有按钮规范，不能只有一个很小的图标热区。
6. `prefers-reduced-motion` 下禁用切图缩放、页面过渡和复杂拖拽动画，但保留状态变化和可用性。
7. Lightbox 内可提供“在新标签页打开展示图”操作，但不要暴露原始文件或 Cloudinary 管理链接。

## 6. 信息与 EXIF 展示

图片信息组件接收已经由服务端过滤的类型化数据，不在客户端解析任意 JSON：

- 总是显示：`title`（无值时使用相册或文件名安全回退）、`description`（存在时）、图片序号/总数。
- 仅在 `album.yaml` 的 `showExif: true` 时显示：相机、镜头、ISO、光圈、曝光时间、焦距、拍摄时间。
- `showLocation` 默认关闭；即使开启，也只显示人工维护的粗粒度地点，不展示 GPS 坐标。
- 丢弃或不返回 GPS、设备序列号、原始文件名中可能包含的隐私信息；EXIF 解析失败不能影响图片展示。
- 文本按普通文本渲染，不使用 `dangerouslySetInnerHTML`；长度和换行应防止浮层撑破视口。

## 7. 实施顺序

在开始前先处理现有工作区中的 Gallery 资产：当前 `content/photo-gallery/` 下存在 PNG、JPG 和 ORF 等原始/测试文件，与“Git 只保存处理后 WebP”的 Stage 6 规则冲突。应先将原始输入移出受 Git 管理目录，转换为 WebP，补齐 `album.yaml`，并由检查工具确认通过；不要把这些文件直接接入前台。

推荐按以下顺序实施：

1. **内容与数据基础**：新增 `gallery.ts` schema、`src/types/gallery.ts`、解析器、查询函数和内容检查；先实现 `album.yaml` 校验、稳定排序、隐藏过滤和路径穿越防护。
2. **同步与媒体**：实现 Gallery 专用同步服务、Sharp WebP 处理、EXIF 白名单、hash 增量同步及 Cloudinary `photo-gallery/{albumSlug}/...` 路径。
3. **静态路由**：新增 `/gallery`、`/gallery/[slug]`、metadata、空状态、错误状态和 `notFound()`；先用服务端数据确认查询边界。
4. **页面主题**：实现 `GalleryShell` 和 HeaderNav 的 Gallery 分支，验证进入/离开页面时 body、main、navbar 和滚动条颜色都正确恢复。
5. **桌面布局**：先完成主预览、缩略图单列、选中态、键盘切换和 EXIF 面板。
6. **移动布局**：增加 CSS columns 双列、全屏 Lightbox、滚动锁定、焦点恢复和触摸切换。
7. **性能与质量**：检查首屏图片优先级、lazy loading、CLS、失败占位、reduced motion、无障碍树和小屏横竖屏。
8. **Dashboard 与双向同步**：最后实现 ADMIN 权限的排序、编辑、隐藏、封面、添加/删除和冲突保护，不以 Dashboard 功能反向简化前台数据模型。

## 8. 文件边界

预计新增或修改的文件：

```text
src/db/schema/gallery.ts
src/db/schema/index.ts
src/types/gallery.ts
src/lib/gallery/gallery-parser.ts
src/lib/gallery/gallery-queries.ts
src/lib/gallery/gallery-sync-service.ts
src/lib/gallery/exif.ts
src/app/gallery/page.tsx
src/app/gallery/[slug]/page.tsx
src/components/HeaderNav.tsx
src/components/gallery/*
src/app/globals.css                 # 仅增加 Gallery 作用域样式
scripts/check-gallery.ts
scripts/sync-galleries.ts
drizzle/*
```

不要在本次实现中修改普通 Post 查询、Post 卡片语义、全局用户主题配置或 Cloudinary 的普通 `myblog` 目录约定。

## 9. 验收清单

### 视觉与响应式

- [ ] `/gallery` 和 `/gallery/[slug]` 的 body、main、navbar、滚动条均为深灰色；离开后普通页面样式恢复。
- [ ] 桌面端为左主图/右缩略图单列；主图保持比例且切换不产生明显布局跳动。
- [ ] 移动端为双列 CSS Masonry；图片保留比例，不发生意外裁剪。
- [ ] 移动端点击图片打开全屏 Lightbox，信息浮层不遮挡关闭和切换控件。

### 交互与无障碍

- [ ] 缩略图和图片卡可通过键盘聚焦、打开和切换。
- [ ] Lightbox 支持 Escape、左右键、关闭、焦点陷阱和关闭后的焦点恢复。
- [ ] 移动端支持合理的左右滑动；打开期间背景不可滚动，关闭后恢复位置。
- [ ] 所有图片有人工 `alt` 或安全回退；图标按钮有 accessible name。
- [ ] reduced motion 下不执行非必要动画。

### 内容、安全与性能

- [ ] 前台只读取已发布 Gallery 和未隐藏 GalleryImage。
- [ ] EXIF 只显示白名单字段，GPS 默认不返回/不展示。
- [ ] Gallery 目录不包含原始 JPEG、PNG、TIFF、BMP、RAW；本地和 Cloudinary 使用同一处理后 WebP。
- [ ] 图片路径、slug、public ID 防路径穿越和非法注入；前台不调用 Cloudinary Admin API。
- [ ] 图片加载失败、空相册、未知 slug、同步未完成均有可读兜底。
- [ ] 大相册不会一次加载全部高清图，缩略图和主图加载策略可观察。

## 10. 验证命令

实现阶段至少运行：

```bash
bun run lint
bun run content:check -- --no-examples
bun run build
```

Gallery 数据模型和同步实现完成后，再补充：

```bash
bunx tsc --noEmit --pretty false
bun run gallery:index
bun run sync:galleries -- --dry-run
```

浏览器验收应覆盖桌面 16:9、平板宽度、窄屏移动端、横竖屏切换、键盘操作、触摸操作、暗色系统偏好和 `prefers-reduced-motion`。