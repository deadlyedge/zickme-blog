# Stage 13：首页 Gallery 与混合热门内容体验

> 制定日期：2026-09-16  
> 前置依据：`documents/project-summary-0915.md`、`documents/thoughts.md`、`documents/architecture/current-code-structure-summary.md`  
> 阶段性质：前台只读展示增强  
> 当前状态：规划中

## 1. 阶段目标

本阶段优化首页内容编排，使 Blog 与 Gallery 在首页形成清晰但统一的内容体验：

1. 将顶部热门轮播从 5 篇热门 Post 调整为 3 篇有封面的热门 Post；
2. 在同一个顶部轮播中加入 2 张热门讨论 Gallery 图片；
3. 在最近 Posts 模块下方增加 2 张最近 Gallery 卡片；
4. 根据 Gallery 封面图片宽高比自动选择卡片布局；
5. 保持 Git-first、Post/Gallery 独立领域和单向 Publish 边界；
6. 不新增 Dashboard 内容编辑入口、数据库回写或新的人工内容源。

目标首页结构：

```text
Hero / 顶部区域
    ↓
混合热门轮播
    ├── 3 个有封面的热门 Post
    └── 2 张热门讨论 Gallery 图片
    ↓
最新 Posts
    ↓
最近 Gallery
    ├── Gallery 卡片 1
    └── Gallery 卡片 2
```

## 2. 架构边界

本阶段只增加前台读取能力，不改变内容生产链路：

```text
Markdown / album.yaml / WebP
        ↓
content check / media prepare / publish
        ↓
PostgreSQL 运行时副本 + Cloudinary CDN
        ↓
首页查询与展示
```

必须遵守以下约束：

- Git 仍然是唯一人工内容源；
- 数据库只作为首页运行时查询副本；
- Cloudinary 只提供已发布媒体，不作为首页元数据来源；
- Post 和 Gallery 使用独立查询与领域类型；
- 不新增 `homepageGalleryIds`、`featuredGalleryImageIds` 等数据库专属配置；
- 不新增 Dashboard 首页内容编辑能力；
- 不在首页查询中解析 Git 文件、直接读取 `album.yaml` 或访问原始图片；
- EXIF 必须继续遵守 Gallery 的 `showExif` 配置和现有白名单过滤；
- 未发布、隐藏或归档内容不得出现在公开首页。

## 3. 顶部混合热门轮播

### 3.1 内容组成

顶部轮播最终最多包含 5 项：

```text
3 个有封面的热门 Post
2 张热门讨论 Gallery 图片
```

Post 与 Gallery 图片必须保留各自领域语义，不应将 Gallery 图片伪装成 `PostWithTags`。

建议引入首页专用联合 DTO，例如：

```ts
type HomeHighlight =
  | {
      type: 'post'
      id: string
      title: string
      href: string
      coverUrl: string
      tags: string[]
      excerpt: string | null
      commentCount: number
    }
  | {
      type: 'gallery-image'
      id: string
      title: string | null
      href: string
      imageUrl: string
      thumbnailUrl: string | null
      gallerySlug: string
      galleryTitle: string
      tags: string[]
      width: number | null
      height: number | null
      exif: GalleryExif | null
      commentCount: number
    }
```

实际字段应以现有公开类型和数据库 schema 为准，不能直接把 Drizzle 查询结果发送到浏览器。

### 3.2 有封面的热门 Post：强制筛选规则

这是本阶段的硬性要求：

> 顶部轮播必须获得“有封面的 3 个热门 Post”，而不是先获取 3 个热门 Post，再在 UI 层剔除无封面文章。

正确流程：

```text
查询或构造热门 Post 候选
        ↓
在服务端判断合法公开封面
        ↓
只保留有封面的 Post
        ↓
按热门排序
        ↓
取前 3 个
```

不能采用：

```text
fetchTopHottestPosts(3)
        ↓
前端过滤没有封面的 Post
        ↓
轮播只剩 1～2 个 Post
```

实现时应优先在数据库查询层或 Provider 层完成过滤。由于现有 Post 热门查询可能先按评论数聚合，建议采用以下任一方式：

1. 在热门候选查询中加入封面存在条件；或
2. 按热门顺序取得足够候选，映射后过滤封面，并继续获取下一批候选，直到得到 3 个或候选耗尽。

不能只把 `limit` 从 3 改为一个未经说明的固定大数后假设一定足够。建议 Provider 支持“目标数量”和“候选批次”概念，并在无法满足数量时返回实际可用数量。

封面判定必须复用项目已有的 Post 图片/媒体解析规则，至少满足：

- URL 或公开媒体引用存在；
- 不是空字符串；
- 不是无法解析的本地源路径；
- 不把缺失媒体转换为破图 URL；
- 公开 URL 由现有 Publish/媒体查询逻辑提供。

如果最终不足 3 个有封面热门 Post：

- 不使用没有封面的文章补位；
- 返回实际可用数量；
- 轮播正常渲染 0～3 个 Post 项；
- 日志记录候选不足原因，但不向访客暴露内部错误。

### 3.3 热门讨论 Gallery 图片

第一版将“热门讨论图片”定义为：

```text
公开评论数最多的 Gallery 图片
```

查询约束：

- Gallery 必须为 `PUBLISHED`；
- GalleryImage 必须为非隐藏状态；
- 只统计状态为 `PUBLISHED` 的图片评论；
- 按公开评论数降序；
- 评论数相同时按最近公开评论时间降序；
- 再按 Gallery/图片发布时间或更新时间作为稳定排序；
- 最多返回 2 张；
- 同一图片不能重复出现；
- 结果必须包含所属 Gallery 信息和可分享的图片地址。

建议排序逻辑：

```text
commentCount DESC
lastPublishedCommentAt DESC
galleryPublishedAt DESC
galleryImageId ASC
```

如果热门讨论图片少于 2 张：

- 第一版不得为了凑数引入新的人工精选配置；
- 可以只显示实际存在的图片项；
- 是否使用最近 Gallery 图片补位，必须作为单独产品决策，不能隐式混入“热门讨论”语义。

### 3.4 轮播布局

posts页卡保持现有布局不变，album每个轮播项采用宽容器的左右结构：

```text
┌────────────────────────────────────────────┐
│ 左侧信息区                  │ 右侧图片区  │
│ 类型标识                     │             │
│ 标题                         │             │
│ tags                         │    4:3      │
│ 日期 / 评论 / EXIF           │             │
└────────────────────────────────────────────┘
```

推荐比例：

- 左侧信息区：约 45%～50%；
- 右侧图片区：约 50%～55%；
- 右侧图片固定为 `aspect-ratio: 4 / 3`；
- 首页轮播图片优先使用 `object-fit: cover`，详情页保留原始比例。

信息区必须明确区分内容类型：

### Post 项

- `热门文章` 类型标识；
- Post 标题；
- excerpt 或简短摘要；
- tags；
- 发布时间；
- 公开评论数。

### Gallery 图片项

- `热门讨论图片` 类型标识；
- 图片标题；
- 所属 Album 标题；
- Gallery tags；
- 允许公开的 EXIF；
- 公开评论数；
- 指向 `/gallery/[slug]#image-[stableImageId]` 的链接。

EXIF 展示要求：

- `showExif !== true` 时不得展示 EXIF；
- 只能使用现有白名单字段；
- 不展示 GPS、原始文件路径、Cloudinary public ID 等内部信息；
- 没有 EXIF 时隐藏该信息块，不显示空占位文本。

## 4. 最近 Gallery 双卡片

### 4.1 数据选择

位置：最新 Posts 模块下方。

数量：最多 2 个最近发布的 Gallery。

排序：

```text
publishedAt DESC
updatedAt DESC
slug ASC
```

只读取：

- `PUBLISHED` Gallery；
- 非隐藏图片；
- 可用的 cover 或第一张可见图片；
- 公开 URL 和尺寸元数据。

没有可展示图片的 Gallery 不应进入首页卡片结果。查询层应继续寻找下一条合格 Gallery，而不是返回一个空卡片。

建议新增首页轻量 DTO，而不是直接复用完整 `GalleryPublic`：

```ts
interface HomeRecentGallery {
  slug: string
  title: string
  href: string
  coverUrl: string
  coverTitle: string | null
  width: number | null
  height: number | null
}
```

### 4.2 封面选择与方向判断

封面选择规则：

1. 优先使用 Gallery 配置的 cover 对应的可见图片；
2. cover 无法匹配时，使用 `sortOrder ASC` 的第一张可见图片；
3. 没有可见图片或 URL 无效时排除该 Gallery。

方向判断规则：

```text
width > height  → 横向
width <= height → 纵向/正方形
缺少尺寸        → 默认按横向处理，但记录可诊断信息
```

这里将正方形归入纵向/正方形卡片分支。

### 4.3 横向卡片

横向图片使用 4:3 卡片：

```text
┌────────────────────────┐
│                        │
│       cover image      │
│                        │
│   Album title overlay  │
└────────────────────────┘
```

要求：

- 卡片整体链接到 `/gallery/[slug]`；
- 图片区域固定 4:3；
- 图片使用 `object-fit: cover` 填满卡片；
- Album title 浮于图片底部；
- 使用渐变遮罩保证标题可读性；
- 长标题截断，不允许撑高卡片；
- 鼠标悬停时只增加轻量缩放或遮罩变化，不影响布局。

### 4.4 纵向/正方形卡片

纵向和正方形图片使用整体 3:4 卡片，但标题布局与横向卡片保持一致：

```text
┌──────────────────┐
│                  │
│     image        │
│                  │
│   Album title    │
└──────────────────┘
```

要求：

- 整体卡片比例为 3:4；
- 图片使用 `object-cover` 填满卡片；
- Album title 使用图片底部渐变浮层；
- 不再单独创建右侧标题区或竖排标题；
- 标题过长时截断；
- 整个卡片仍然是一个可点击链接；
- 横向和纵向卡片都复用 `CardTilt` / `CardTiltContent` 的整体 hover 动画，图片本身不单独放大。

### 4.5 响应式降级

桌面端：

- 两张卡片并排；
- 保持横向/纵向差异化布局。

移动端：

- 两张卡片改为单列；
- 纵向/正方形卡片继续使用图片底部横向标题；
- 图片和标题必须保持可读、可点击和稳定高度。

## 5. 首页数据层改造

当前首页查询需要从：

```ts
fetchPosts(6)
fetchTopHottestPosts(5)
fetchPinnedPosts(...)
```

调整为职责清晰的查询组合：

```ts
fetchPosts(6)
fetchTopHottestPostsWithCover(3)
fetchTopDiscussedGalleryImages(2)
fetchRecentGalleriesForHome(2)
fetchPinnedPosts(...)
```

建议 `HomePageData` 增加：

```ts
recentGalleries: HomeRecentGallery[]
hotGalleryImages: HomeGalleryImage[]
```

`hottestPosts` 必须已经是“有封面的热门 Post”结果，组件层不再负责筛选。

首页查询可以使用 `Promise.all` 并行执行，但每个查询必须独立处理失败：

- Gallery 查询失败不应导致已有 Post 首页全部不可用；
- 热门图片查询失败时隐藏图片项并记录服务端日志；
- 查询返回空数组时组件隐藏对应模块；
- 不向公开页面输出数据库、Cloudinary 或内部异常详情。

## 6. 组件建议

建议将当前单一热门轮播拆为以下职责：

```text
HomeScrollArea
├── TopMixedHighlights
│   ├── PostHighlightSlide
│   ├── GalleryImageHighlightSlide
│   └── HighlightControls
├── LatestPostsSection
└── RecentGallerySection
    └── RecentGalleryCard
```

组件职责：

- `TopMixedHighlights`：轮播索引、自动播放、暂停、方向和统一动画；
- `PostHighlightSlide`：Post 信息区和封面；
- `GalleryImageHighlightSlide`：图片信息、所属 Album 和 EXIF；
- `RecentGallerySection`：最多两张 Gallery 卡片及空状态隐藏；
- `RecentGalleryCard`：根据宽高比选择横向或纵向卡片布局。

不建议把 Gallery 图片强制转换为 `PostWithTags`，也不建议让 `TopHottestSection` 继续承担混合领域数据的全部渲染职责。

## 7. URL 与图片深链接

Gallery 图片项必须使用稳定图片 ID 生成地址：

```text
/gallery/{gallerySlug}#image-{stableImageId}
```

不使用图片标题作为唯一定位标识，因为标题可能重复、变更或包含特殊字符。

本阶段不因 hash 定位引入 `nuqs`。普通 fragment 和现有 Gallery 客户端状态逻辑即可满足需求。

如果当前 Gallery 查看器还未支持 hash 初始定位，应将其作为独立子任务：

- 首次加载 hash 时定位/打开对应图片；
- Lightbox 内切换使用 `replaceState`；
- 关闭 Lightbox 时清除 hash；
- 无效 hash 不导致页面报错。

## 8. 测试与验收

### 8.1 查询层

- 热门 Post 结果最多 3 个；
- 每个热门 Post 都有合法公开封面；
- 无封面热门 Post 不会占用 3 个名额；
- 候选不足时不会用无封面 Post 补位；
- 热门 Gallery 图片最多 2 张；
- 只统计 `PUBLISHED` 图片评论；
- 隐藏图片、未发布 Gallery 不会出现在结果中；
- 最近 Gallery 最多 2 个；
- 无可用封面的 Gallery 会被跳过；
- 查询结果使用首页 DTO，不暴露完整 ORM 行。

### 8.2 纯函数与组件

- 横向图片进入 4:3 卡片；
- 纵向图片进入 3:4 卡片；
- 正方形图片进入 3:4 卡片；
- 缺少宽高时有稳定降级；
- 长标题不会撑破卡片；
- `showExif=false` 时不显示 EXIF；
- Gallery 图片链接包含稳定 image ID；
- 空数据时模块隐藏而不是渲染空壳；
- 移动端标题由竖排降级为横排；
- `prefers-reduced-motion` 下轮播动画不会造成明显干扰。

### 8.3 工程验证

完成实现后必须运行：

```bash
bun run lint
bun run build
bunx tsc --noEmit --pretty false
```

如果新增查询、评论聚合或 Gallery 公开 DTO 测试，还应运行项目现有测试命令，并补充：

- 有封面热门 Post 过滤测试；
- 候选不足测试；
- Gallery 图片公开字段和 EXIF 隐私测试；
- Gallery 卡片方向判断测试；
- 热门评论排序测试。

## 9. 实施顺序

### Phase 1：查询和 DTO

1. 确认 Post 封面字段及合法公开封面判定规则；
2. 实现有封面热门 Post 查询；
3. 实现最近 Gallery 轻量查询；
4. 实现热门讨论图片查询；
5. 扩展 `HomePageData` 和首页 DTO；
6. 为查询和纯函数补充测试。

### Phase 2：首页 Gallery 卡片

1. 增加 `RecentGallerySection`；
2. 实现 cover 优先、第一张可见图片回退；
3. 实现横向 4:3 卡片；
4. 实现纵向/正方形 3:4 卡片；
5. 实现移动端布局降级。

### Phase 3：混合热门轮播

1. 将热门 Post 数量改为 3；
2. 将当前轮播抽象为混合高亮轮播；
3. 增加 2 张 Gallery 图片项；
4. 实现左右信息区与右侧固定 4:3 图片；
5. 增加类型标识、EXIF 和图片深链接；
6. 补充键盘、暂停、reduced-motion 和空数据处理。

### Phase 4：回归验证

1. 使用真实 Post、Gallery、评论和缺失封面数据验证首页；
2. 检查公开数据没有邮箱、GPS、内部路径或 Cloudinary public ID；
3. 检查首页查询只读，不触发 Publish、锁、Cloudinary 上传或内容写入；
4. 运行 lint、TypeScript 检查、build 和测试；
5. 更新 README 或当前架构文档中的首页模块说明。

## 10. 明确不在本阶段范围内

- 首页人工精选 Gallery 配置；
- Dashboard 直接编辑首页卡片顺序；
- 数据库回写 Markdown 或 `album.yaml`；
- 外部搜索服务或推荐服务；
- 图片浏览量统计系统；
- 为“热门”新增复杂推荐算法；
- Cloudinary 独立媒体管理入口；
- 自动删除或媒体回收协议；
- Post 与 Gallery 领域模型合并；
- 为 Gallery hash 定位引入 `nuqs`。

## 11. 完成标准

本阶段完成时，应满足：

```text
首页顶部最多显示：
  3 个有封面的热门 Post
  2 张热门讨论 Gallery 图片

最新 Posts 下方最多显示：
  2 个最近发布且有可用封面的 Gallery

所有首页内容：
  来自 PostgreSQL 运行时副本
  遵守公开 DTO 和 EXIF 隐私边界
  不修改 Git 内容源
  不产生 Publish、锁、Cloudinary 或数据库写入副作用
```

最关键的回归条件是：

> 当热门排序前几名包含无封面 Post 时，系统必须继续从后续热门候选中寻找，直到获得 3 个有封面的热门 Post 或候选耗尽；不能让无封面文章占用轮播名额，也不能依赖前端过滤来补救。