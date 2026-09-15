# 第十阶段开发计划（Stage 10：Gallery 浏览体验与互动优化）

> 制定日期：2026-09-14  
> 前置阶段：Stage 9.6 架构减法与 Git-first 单向发布基线  
> 主要输入：`documents/thoughts.md`、`documents/architecture-reduction.md`、当前 Gallery 前台实现  
> 阶段目标：在不改变 Gallery 内容源和发布边界的前提下，优化图片加载、相册浏览、标签筛选、图片信息展示和图片评论体验  
> 当前状态：规划中

---

## 一、阶段定位与范围

Stage 10 只处理 Gallery 前台的产品体验和必要的数据模型支持，不继续扩展同步平台，也不处理全局代码治理。

本阶段确认的产品方向如下：

1. 保留当前 Gallery 的“共用图片浏览器”模式；
2. `/gallery` 继续浏览全部相册；
3. `/gallery/[slug]` 支持直接定位到指定相册，并高亮当前相册；
4. 相册导航区域默认仍展示全部相册，复杂的“相关相册”计算留到后续阶段；
5. Gallery 标签过滤只支持单标签，保持极简视觉和交互；
6. 评论绑定到具体 `GalleryImage`，暂不做相册级评论汇总；
7. 桌面端和移动端统一使用图片显示区域底部的可折叠信息面板；
8. 信息面板采用 Gallery 自身的深色、克制风格，不复用 Post 区的强标签视觉和复杂动效；
9. 图片加载优先使用已有的缩略图 URL，原图只用于主图和 Lightbox；
10. Iteration 6（Publish/Sync 清理）和 Iteration 7（types/constants 整理）明确留到下一阶段。

本阶段不包含：

- 新增或恢复 `sync`、`sync:pull`、`gallery:pull` 等旧入口；
- 数据库反向写入 Markdown、`album.yaml` 或 `gallery.yaml`；
- 自动 Git commit、push 或新的双向同步方向；
- Gallery 搜索系统和复杂的 URL 状态同步；
- 多标签组合过滤；
- 相册级评论、评论汇总、评论通知；
- 图片点赞、收藏、匿名评论；
- Publish/Sync 目录清理；
- 全局 types/constants 重构。

---

## 二、架构和数据边界

### 2.1 内容源保持不变

Gallery 的人工内容源仍然是：

```text
content/photo-gallery/{album}/album.yaml
content/photo-gallery/{album}/images/*.webp
```

其中：

- `album.yaml` 保存相册标题、描述、标签、位置、布局和图片级人工元数据；
- `gallery.yaml` 继续由索引工具自动生成，不作为人工编辑源；
- PostgreSQL 中的 `Gallery` 和 `GalleryImage` 仍然只是运行时副本；
- Cloudinary 仍然只负责媒体 CDN 和展示资源；
- 前台功能不得反向修改上述内容源。

### 2.2 本阶段允许的数据变化

本阶段允许新增 GalleryImage 评论数据模型和必要的查询/Action，但该数据属于运行时互动数据，不改变 Markdown/YAML/WebP 的人工内容源。

标签过滤只读取现有 `Gallery.metadata.tags`，不新增独立 Gallery 标签表，也不要求修改 `album.yaml` 格式。

图片信息展示只消费已有的标题、描述、EXIF、位置和媒体 URL，不新增 Cloudinary 元数据源。

### 2.3 现有实现基线

当前相关文件主要包括：

```text
src/app/gallery/page.tsx
src/app/gallery/[slug]/page.tsx
src/components/gallery/GalleryPostView.tsx
src/components/gallery/GalleryGrid.tsx
src/components/gallery/GalleryLightbox.tsx
src/components/gallery/GalleryImageInfo.tsx
src/components/gallery/GalleryCard.tsx
src/lib/gallery/gallery-queries.ts
src/lib/gallery/gallery-sync-service.ts
src/types/gallery.ts
src/db/schema/gallery.ts
```

当前已经存在：

- `/gallery` 和 `/gallery/[slug]` 路由；
- `fetchGalleries()` 和 `fetchGalleryBySlug()`；
- 共用的 `GalleryPostView` 图片浏览器；
- `GalleryPublicImage.thumbnailUrl`；
- `album.yaml` 的 `tags` 字段；
- Gallery metadata JSONB 中的 tags；
- Gallery EXIF 白名单解析；
- `GalleryImageInfo` 和 Lightbox 内的折叠雏形；
- Post 评论组件、评论 Action 和评论公开用户 DTO 的部分实现。

当前主要缺口：

- 详情页只向浏览器传入当前相册，无法同时显示和切换全部相册；
- `GalleryPublic` 没有暴露 tags；
- 缩略图区域仍然多处使用主图 URL；
- 桌面端信息面板主要依赖 hover，Info 按钮没有完整控制状态；
- GalleryImage 没有独立评论模型；
- 现有评论 Action 强绑定 `comments.postId`，不能直接接受 GalleryImage ID。

---

## 三、阶段完成定义

Stage 10 完成后，用户应能够：

1. 打开 `/gallery`，继续使用当前共用图片浏览器；
2. 打开 `/gallery/{slug}`，直接进入指定相册；
3. 在相册导航列表中看到全部相册，并识别当前高亮相册；
4. 在 Gallery 中选择一个标签，仅查看对应标签的相册；
5. 使用简单的关闭操作清除当前标签筛选；
6. 在缩略图和移动端网格中优先加载缩略图，而不是完整原图；
7. 在所有设备上通过统一的底部面板查看图片标题、描述、位置、EXIF 和评论；
8. 展开或收起图片信息面板，并在面板内部滚动较长内容；
9. 在登录后对当前图片发表评论和回复；
10. 不影响原有 Post 评论、Gallery 发布和 Git-first 内容流程。

工程完成标准：

- `GalleryPublic` 的 tags 数据经过安全解析；
- `/gallery/[slug]` 的初始相册由 slug 决定；
- 当前相册切换不会破坏选中图片索引和面板状态；
- 缩略图区有明确的 thumbnail fallback；
- 评论查询、提交和回复均进行权限和 Zod 输入校验；
- GalleryImage 评论不会混入 Post 评论；
- 不新增旧同步入口或反向内容写入；
- 纯函数、数据转换和关键交互边界有测试；
- lint、TypeScript、内容检查和生产构建通过。

---

## 四、实施迭代

## Iteration 1：统一 `/gallery` 与 `/gallery/[slug]` 的浏览上下文

优先级：P0  
风险：中低  
目标：保留共用浏览器，但支持详情 URL 直接定位相册。

### 任务

1. 修改 `/gallery/[slug]` 页面，使其读取全部已发布相册；
2. 根据 slug 找到初始相册，并将全部相册传入 `GalleryPostView`；
3. 为 `GalleryPostView` 增加可选的 `initialAlbumSlug`；
4. 初始化 `albumIndex` 时定位到指定 slug；
5. `/gallery` 未提供 slug 时保持默认打开第一本相册；
6. 相册导航仍然展示传入的全部相册；
7. 当前相册使用 `aria-current` 或等价语义进行高亮；
8. 不在本迭代强制修改浏览器 URL，不引入复杂的 router 状态同步；
9. 保持详情页 `generateMetadata()` 使用当前 slug 对应的相册信息；
10. 不存在的 slug 继续返回 `notFound()`。

### 建议接口

```tsx
<GalleryPostView
  albums={galleries}
  initialAlbumSlug={slug}
/>
```

### 初始相册规则

```text
存在 initialAlbumSlug 且能匹配：打开匹配相册
没有 initialAlbumSlug：打开第一本相册
无法匹配 initialAlbumSlug：由路由层 notFound()
```

### 验收标准

- `/gallery` 可正常打开并显示全部相册；
- `/gallery/testalbum` 默认打开 `testalbum`；
- 相册导航仍然能切换到其他相册；
- 当前相册明确高亮；
- 直接链接打开后不需要先访问 `/gallery`；
- 不存在的 slug 不会显示错误相册；
- 图片切换、Lightbox 和已有 metadata 行为不回归。

---

## Iteration 2：Gallery tags DTO 与极简单标签过滤

优先级：P0  
风险：中低  
目标：利用已有 `album.yaml` 标签，实现单标签相册过滤。

### 任务

1. 为 `GalleryPublic` 增加 `tags: string[]`；
2. 在查询层安全读取 `gallery.metadata.tags`；
3. 过滤非字符串、空字符串和重复标签；
4. 为所有公开 Gallery 查询复用同一套标签转换逻辑；
5. 新增 Gallery 专用的极简标签过滤组件；
6. 第一版只支持单个 active tag；
7. 选择标签后过滤相册导航列表；
8. 当前 active tag 提供简单的关闭按钮；
9. 不复用 PostTagFilter 的强视觉、数量徽章和复杂 Motion；
10. 当前阶段不增加 `?tag=` URL 查询参数；
11. `/gallery/[slug]` 先保持全部相册上下文，复杂筛选上下文留到后续；
12. 无匹配结果时显示简单空状态。

### 标签转换规则

```text
metadata 无效 → []
tags 不是数组 → []
非字符串值 → 丢弃
空字符串 → 丢弃
重复值 → 去重
有效标签 → 保留原有顺序
```

### 第一版路由规则

```text
/gallery
  标签筛选只影响当前浏览器中的相册列表

/gallery/{slug}
  直接加载指定相册
  默认仍展示全部相册
  暂不持久化 tag 筛选状态到 URL
```

这样可以先完成极简体验，避免当前阶段引入筛选状态、浏览器历史和直链上下文的复杂耦合。

### 验收标准

- 没有 tags 的相册正常显示；
- metadata 格式异常不会导致页面崩溃；
- 选择标签后只显示包含该标签的相册；
- 点击 `x` 后恢复全部相册；
- 标签列表没有重复项；
- 标签视觉保持克制，不出现 Post 区的大块强调样式；
- `/gallery/{slug}` 仍能正常直达指定相册。

---

## Iteration 3：Gallery 图片加载性能优化

优先级：P0  
风险：低  
目标：减少首屏和缩略图区域对原图的请求。

### 加载策略

| 使用场景 | 首选资源 | fallback |
| --- | --- | --- |
| 桌面主图 | `image.url` | 无可用图片时显示错误状态 |
| 桌面缩略图 | `image.thumbnailUrl` | `image.url` |
| 移动端图片网格 | `image.thumbnailUrl` | `image.url` |
| Lightbox | `image.url` | 显示加载失败状态 |
| 相册导航封面 | `gallery.cover` 或首张图缩略图 | 首张图 URL |

### 任务

1. `GalleryGrid` 的桌面缩略图使用 `thumbnailUrl ?? url`；
2. 移动端图片网格使用 `thumbnailUrl ?? url`；
3. 主图和 Lightbox 继续使用完整图片 URL；
4. 重新检查 `next/image` 的 `sizes` 是否符合实际布局；
5. 只有当前主图保留 `priority`；
6. 缩略图不设置 `priority`；
7. 不预加载整个相册的原图；
8. 评估是否只预加载当前图片相邻的一张或两张图片；
9. 保留无缩略图旧数据的 fallback；
10. 检查 Cloudinary 缩略图尺寸、质量和自动格式转换设置；
11. 不引入第三方 Gallery 或图片预加载依赖。

### 验收标准

- 缩略图区域请求 URL 不再默认使用完整主图；
- 首次打开相册不会同时请求所有原图；
- Lightbox 仍然显示高质量原图；
- 无 `thumbnailUrl` 的旧数据仍可显示；
- 移动端请求体积和加载等待时间有可观察改善；
- 图片加载失败时仍显示现有错误状态。

---

## Iteration 4：统一底部可折叠图片信息面板

优先级：P1  
风险：中  
目标：统一桌面和移动端的图片信息交互，替代主要依赖 hover 的信息展示。

### 产品规则

信息面板统一位于图片显示区域底部，支持：

- 收起状态：显示标题、图片序号和展开按钮；
- 展开状态：显示标题、描述、位置、EXIF、评论列表和评论入口；
- 面板最大高度约为图片显示区域的 40%～50%；
- 面板内部内容超出时独立滚动；
- 图片仍保持视觉主体，不被信息面板完全遮挡；
- 不要求第一版支持拖动调整高度。

### 视觉规则

- 使用 Gallery 现有深色背景、低透明度和轻微 backdrop blur；
- 不使用 Post 区的卡片、明显 primary 色块或复杂标签动画；
- 展开/收起动画保持克制，并支持 `prefers-reduced-motion`；
- 控件必须支持键盘焦点和明确 aria-label；
- 面板中的文字、按钮和滚动区域需要满足深色背景可读性。

### 任务

1. 抽取 `GalleryBottomPanel` 或等价的 Gallery 内部组件；
2. 将面板展开状态从 hover CSS 改为 React state 控制；
3. Info/展开按钮真正控制面板开关；
4. 桌面端和移动端使用相同的信息结构；
5. 重排标题、描述、拍摄位置和 EXIF 信息；
6. 将 `ExifPanel` 保持为纯展示子组件；
7. 处理图片切换时面板状态和滚动位置；
8. 处理 Lightbox 与普通浏览器之间的信息面板一致性；
9. 防止长描述和长评论撑破图片容器；
10. 保留图片加载失败、关闭 Lightbox 和键盘切图行为。

### 建议组件边界

```text
GalleryGrid / GalleryLightbox
  └── GalleryBottomPanel
        ├── GalleryImageSummary
        ├── GalleryImageMetadata
        └── GalleryImageComments
```

`GalleryImageInfo` 不应继续同时承担评论数据查询、评论提交、面板状态和布局控制。

### 验收标准

- 桌面和移动端都能通过按钮展开、收起信息面板；
- 不依赖 hover 才能访问图片信息；
- 面板展开后最多占据图片区域约一半；
- 长内容可以在面板内部滚动；
- 键盘用户可以访问所有控制；
- 深色 Gallery 风格与 Post 区明显区分；
- 图片切换、Lightbox、Escape 和方向键行为不回归。

---

## Iteration 5：GalleryImage 级评论

优先级：P1  
风险：高  
目标：允许用户对当前选中的具体图片发表评论和回复。

### 数据模型决策

推荐新增独立的 GalleryImage 评论表，而不是把现有 Post 评论表改成多态结构：

```text
GalleryImageComment
  id
  galleryImageId
  content
  status
  authorId
  parentId
  createdAt
  editedAt
  editedBy
  deleted
  deletedBy
```

原因：

- 现有 `Comment.postId` 有明确外键；
- GalleryImage 评论和 Post 评论属于不同领域；
- 独立表可以保留外键和级联删除；
- 不需要用 `targetType + targetId` 牺牲数据库约束；
- 管理后台和 Snapshot 可以明确区分两类评论。

### 任务

1. 新增 Drizzle GalleryImage 评论 schema；
2. 增加 GalleryImage 与评论的关系定义；
3. 创建迁移并提供回滚说明；
4. 增加 GalleryImage 评论查询函数；
5. 增加创建评论和回复的 Server Action；
6. 对内容、图片 ID、父评论 ID 和路径进行 Zod 校验；
7. 校验父评论必须属于同一张图片；
8. 复用现有评论 UI 的列表、回复和公开作者展示能力；
9. 抽取 Post/Gallery 共用的评论树处理逻辑；
10. 评论提交后只 revalidate 当前 Gallery 页面；
11. 接入 ADMIN 评论审核、隐藏和删除能力；
12. 确认 Snapshot 是否包含 GalleryImage 评论，并更新快照说明；
13. 保证公开响应不泄露完整邮箱或内部用户字段。

### 第一版明确不做

- 相册级评论汇总；
- 相册卡片评论数量；
- 跨图片评论列表；
- 评论通知；
- 匿名评论；
- 评论分页和全文搜索；
- 点赞、收藏和社交互动。

### 验收标准

- 评论绑定到 `GalleryImage`，不会混入 Post 评论；
- 切换图片后评论内容不会串图；
- 登录用户可以发表评论和回复；
- 未登录用户只能查看并被引导登录；
- 评论输入和父评论关系经过 Zod 与服务端校验；
- 管理员可以处理 GalleryImage 评论；
- 公开数据不包含完整邮箱；
- Post 原有评论功能全部通过回归测试。

---

## 五、测试计划

### 5.1 纯函数和数据转换测试

至少覆盖：

- Gallery metadata tags 解析；
- tags 去重、空值和异常值处理；
- active tag 过滤相册；
- initialAlbumSlug 转换为 album index；
- 不存在 slug 的处理；
- thumbnailUrl fallback 选择；
- 评论树构建和父评论归属校验。

### 5.2 Gallery 组件测试或可复现验收

至少验证：

- `/gallery` 默认打开第一本相册；
- `/gallery/{slug}` 默认打开指定相册；
- 当前相册高亮；
- 标签选择和关闭；
- 无匹配标签的空状态；
- 信息面板展开和收起；
- 面板内部滚动；
- 图片切换后显示对应信息和评论；
- Lightbox 键盘控制和移动端基础操作。

### 5.3 评论和权限测试

至少验证：

- 未登录不能创建评论；
- 非法内容被拒绝；
- 不存在的图片 ID 被拒绝；
- 不属于当前图片的 parentId 被拒绝；
- 评论公开 DTO 不包含完整邮箱；
- 普通用户不能执行管理员审核操作；
- Post 评论路径不受 Gallery 评论改造影响。

---

## 六、验证命令

每个迭代完成后至少运行针对性检查，整个 Stage 10 交付前运行完整检查：

```bash
bun run lint
bun run content:check -- --no-examples
bun run content:verify
bun run test
bunx tsc --noEmit --pretty false
bun run build
```

涉及数据库 schema、评论权限或 Gallery 发布边界时，还需要：

- 检查 Drizzle migration 内容；
- 验证 dry-run 不写文件、不写数据库、不上传 Cloudinary；
- 验证 Gallery 发布仍然只从 Git 内容源流向数据库和 Cloudinary；
- 验证 Post 发布和 Post 评论没有回归。

---

## 七、与架构减法的关系

Stage 10 必须遵守以下边界：

```text
Git 内容源 → publish → PostgreSQL / Cloudinary → Gallery 前台
```

Gallery 前台的新功能只读取运行时副本和 Cloudinary 展示 URL。评论属于运行时互动数据，不反向写入 `album.yaml` 或 Markdown。

本阶段不得：

- 新增数据库到 YAML 的自动回写；
- 新增 Gallery pull、patch 或 merge；
- 新增实体级同步任务；
- 新增自动 Git 操作；
- 让 Dashboard 成为 Gallery 内容编辑器；
- 将 Cloudinary 作为人工元数据源；
- 恢复已经删除的旧同步 CLI。

### 暂缓到下一阶段

以下内容明确不属于 Stage 10：

#### Iteration 6：Publish/Sync 架构收敛

- `publish-workflow` 脱离 `runSync`；
- `SyncRunSummary` 迁移为 Publish 类型；
- publish lock 和历史运行记录重新分层；
- 拆分 `src/lib/sync-service.ts`；
- 删除不再使用的 sync helper；
- 保留 schema 字段直到完成生产读取审计和迁移窗口。

#### Iteration 7：types/constants 整理

- 拆分 `src/types/content.ts`；
- 分离 Gallery 内容源类型、数据库类型和前台 DTO；
- 集中 Gallery、Publish 和媒体处理 constants；
- 保持 `@/types` 兼容导出；
- 清理循环依赖和重复类型定义。

这两个迭代必须在 Stage 10 的 Gallery 功能稳定并完成回归验证后单独规划和实施，不能在本阶段顺带重构。

#### Iteration 8：关于posts/images/album的删除逻辑优化

- 讨论：是否应该彻底关闭自动删除功能，因为数据上传和比对依赖frontmatter/gallery.yaml/album.yaml/image hash...不可控性比较强，容易被无意中的操作导致标记文章删除，并损失所有相关评论。发现文章/图片不再存在于数据源后，应采用数据库标记（数据源不存在或类似描述）来供管理员在dashboard中确认删除。

#### Iteration 9：documents 整理

- 整理开发文档文件夹结构，明确文档都会被归类：已完成/旧文档，开发中，讨论过程，阶段总结...
- 整理agents.md和readme



---

## 八、建议提交顺序

建议按以下边界拆分提交或小阶段：

```text
1. gallery: support direct album selection by slug
2. gallery: expose album tags and add simple filtering
3. gallery: use thumbnails for previews
4. gallery: unify collapsible image info panel
5. gallery: add image-level comments
6. gallery: add regression tests and update documentation
```

每个提交都应保持可独立检查，避免将 Gallery UI、评论迁移和 Publish/Sync 清理混在同一个变更中。

---

## 九、Stage 10 最终验收清单

- [ ] `/gallery` 仍然使用共用图片浏览器；
- [ ] `/gallery/[slug]` 可以直接定位指定相册；
- [ ] 当前相册在导航区域高亮；
- [ ] 相册导航默认列出全部相册；
- [ ] Gallery 支持单标签极简筛选；
- [ ] 标签筛选支持 `x` 关闭；
- [ ] Gallery 缩略图优先使用 `thumbnailUrl`；
- [ ] 主图和 Lightbox 仍使用清晰原图；
- [ ] 桌面端和移动端统一使用底部可折叠信息面板；
- [ ] 面板最大高度约为图片区域一半；
- [ ] 面板支持键盘操作和内部滚动；
- [ ] 图片信息排列清晰且符合 Gallery 风格；
- [ ] 评论绑定到具体 GalleryImage；
- [ ] 评论支持登录用户发布和回复；
- [ ] 评论权限、输入和公开 DTO 经过验证；
- [ ] Post 评论功能无回归；
- [ ] Git-first 单向发布边界未改变；
- [ ] 没有恢复或新增旧 sync 入口；
- [ ] Iteration 6 和 Iteration 7 未混入本阶段实现；
- [ ] lint、内容检查、测试、TypeScript 和 build 全部通过。
