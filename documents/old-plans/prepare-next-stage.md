## 分析计划

我会从以下几个方面分析 `documents/thoughts.md` 中的想法：

1. 将每条想法转换为明确的产品需求；
2. 对照项目当前的 Git-first、Post/Gallery 独立领域和单向 Publish 架构；
3. 判断是否会引入新的内容源、数据库写入或双向同步复杂度；
4. 评估实现优先级、技术方案和潜在风险；
5. 给出可以直接补充到开发计划中的需求拆分。

---

# 一、总体判断

`thoughts.md` 中的三条需求，整体上都属于**前台展示与查询体验增强**，不会直接破坏当前的架构减法方向。

它们不会引入：

- Dashboard 内容编辑；
- 数据库回写 Markdown 或 `album.yaml`；
- 新的同步入口；
- Cloudinary 独立内容管理；
- Gallery 与 Post 合并；
- 双向数据流。

因此，这些需求原则上可以继续推进。

但需要特别注意：

> 这些功能应该建立在现有 `Gallery`、`GalleryImage`、标签和运行时查询能力之上，而不是为前台功能新增一套内容索引或独立数据源。

推荐的数据流仍然保持为：

```text
album.yaml / WebP
        ↓
content check / gallery:index
        ↓
publish
        ↓
PostgreSQL Gallery 副本
        ↓
首页 / 搜索 / Gallery 详情页
```

前台只读取数据库或现有查询服务，不直接读取 Cloudinary，也不直接解析 Git 内容文件。

---

# 二、需求一：首页体现部分 Gallery 内容

原始想法：

> 首页应该能够体现部分 gallery 内容

## 1. 转换后的产品需求

首页增加 Gallery 展示模块，向用户展示部分 Gallery 内容，例如：

- 最近发布的 Gallery；
- 精选 Gallery；
- 每个 Gallery 的封面图；
- Gallery 标题；
- Gallery 发布时间；
- Gallery 标签；
- Gallery 中的图片数量；
- “查看全部 Gallery”入口。

这里需要区分两种需求：

### 方案 A：自动展示

例如按照以下规则自动选择：

```text
按 publishedAt 倒序
取最新 3 个 Gallery
```

优点：

- 不需要新增内容配置；
- 不需要 Dashboard 编辑；
- 完全符合 Git-first；
- 实现和维护成本较低。

缺点：

- 管理员不能精确控制首页展示哪些相册；
- 首页内容可能随 Gallery 发布自动变化。

### 方案 B：人工精选

例如在 `album.yaml` 中增加：

```yaml
featured: true
```

或：

```yaml
home:
  featured: true
  order: 1
```

优点：

- 首页展示内容可控；
- 适合长期稳定的个人主页；
- 精选内容可以独立于发布时间排序。

缺点：

- 需要扩展 Gallery 内容规范；
- 需要同步 schema、解析器、数据库字段或 metadata；
- 需要补充内容校验和文档；
- 如果只是为了首页展示，可能略微增加复杂度。

## 2. 与架构减法的关系

如果只是展示“最近 Gallery”，这是非常适合当前架构的功能。

如果增加“精选状态”，也没有违背 Git-first，但应该确保：

- 精选标记来自 `album.yaml`；
- 不允许 Dashboard 直接修改精选状态；
- 不新增数据库到 YAML 的回写；
- 仍然通过正常 publish 进入数据库；
- 不把首页展示配置做成数据库独有状态。

## 3. 推荐方案

建议分两步：

### 第一阶段：自动展示最近 Gallery

先实现一个只读查询：

```text
getLatestGalleries(limit)
```

首页展示：

- 2～4 个 Gallery；
- 使用已有封面图；
- 使用现有 Cloudinary URL；
- 没有 Gallery 时隐藏模块，而不是展示空状态；
- 提供 `/gallery` 链接。

### 第二阶段：如果确实需要，再增加精选能力

只有当“最新 Gallery”无法满足首页策划需求时，再考虑：

```yaml
featured: true
featuredOrder: 1
```

不建议一开始就在数据库里新增 `isFeatured`，否则容易形成：

```text
Git 中的 Gallery
数据库中的首页配置
```

这会产生两个来源，增加维护成本。

## 4. 需要明确的问题

正式实现前需要确认：

- 首页展示最新 Gallery，还是人工精选 Gallery？
- 展示 Gallery 卡片，还是直接展示图片瀑布流？
- 一张 Gallery 展示一张封面图，还是多张图片？
- 是否需要排除隐藏、草稿或未发布 Gallery？
- Gallery 没有封面图时使用什么降级策略？

从当前架构和复杂度控制角度，建议默认选择：

> 首页展示最近发布的 Gallery，每个 Gallery 使用一个封面图。

---

# 三、需求二：搜索支持图片 / Album 标题和 Tag

原始想法：

> 搜索支持图片/album标题搜索和tag

这是三条需求中范围最大的一条，因为它可能涉及 Post、Gallery、GalleryImage 三类对象。

## 1. 需要先定义搜索对象

“图片/album标题搜索和 tag”至少可能包含以下字段：

### Gallery 级别

- Gallery title；
- Gallery description；
- Gallery slug；
- Gallery tags。

### 图片级别

- 图片 title；
- 图片 caption；
- 图片 alt；
- 图片 tags；
- EXIF 中允许公开的字段，例如地点或拍摄时间。

### Post 级别

- Post title；
- Post excerpt；
- Post tags；
- Post category。

建议不要一开始把所有字段都纳入搜索。可以先定义搜索范围：

```text
Posts:
- title
- summary
- tags

Galleries:
- title
- description
- tags

Gallery images:
- title
- caption
- tags
```

但需要注意，Gallery 图片的搜索结果不能简单等同于 Gallery 搜索结果。

例如用户搜索某张图片时，结果应该能够表达：

```text
图片标题
所属 Gallery
图片缩略图
跳转地址
```

而不是只返回所属相册。

## 2. 建议的搜索结果模型

可以统一为搜索结果 DTO，但保留领域类型：

```ts
type SearchResult =
  | {
      type: "post";
      title: string;
      slug: string;
      excerpt?: string;
      tags: string[];
      href: string;
    }
  | {
      type: "gallery";
      title: string;
      slug: string;
      coverUrl?: string;
      tags: string[];
      href: string;
    }
  | {
      type: "gallery-image";
      title: string;
      galleryTitle: string;
      gallerySlug: string;
      imageId: string;
      thumbnailUrl: string;
      tags: string[];
      href: string;
    };
```

这样可以避免：

- 直接把 Drizzle 查询结果暴露给前端；
- Post、Gallery、GalleryImage 字段强行统一；
- 内部字段泄露；
- 图片结果无法定位到具体图片。

这也符合项目总结中的原则：

> 内部数据库模型 ≠ 公开 API 模型 ≠ 管理后台模型。

## 3. 搜索是否应该搜索图片文件名

不建议把图片文件名作为主要搜索字段，除非它已经是明确的人工内容字段。

例如：

```text
IMG_20240915_001.webp
```

通常没有用户价值，也可能暴露内部处理命名。

更适合搜索：

- album title；
- image title；
- caption；
- tag；
- 可公开的元数据。

## 4. 搜索实现建议

当前阶段不建议为了搜索引入新的外部搜索服务或额外基础设施。

可以按复杂度分阶段：

### 第一阶段：数据库查询

对 PostgreSQL 使用已有字段进行：

- `ILIKE`；
- tag 关联查询；
- title/caption 关键词匹配；
- 分页；
- 类型筛选。

例如：

```text
q=mountain
type=all|posts|galleries|images
tag=travel
page=1
```

优点：

- 不新增服务；
- 使用现有 PostgreSQL；
- 与运行时副本一致；
- 实现简单；
- 适合个人博客的数据规模。

### 第二阶段：数据库全文搜索

只有当数据量、查询体验或相关性排序出现实际问题时，再考虑：

- PostgreSQL `tsvector`；
- `websearch_to_tsquery`；
- trigram；
- 权重排序。

目前没有必要直接引入 Algolia、Meilisearch、Elasticsearch 等搜索服务。

## 5. Tag 的一致性问题

需求中的“tag 搜索”需要先明确 Tag 的来源：

- Post tag；
- Gallery tag；
- Image tag；
- 是否允许图片继承 Gallery tag；
- Tag 是否大小写不敏感；
- 是否使用 slug；
- 是否支持多个 tag 同时筛选。

建议定义为：

```text
Gallery 标签只匹配 Gallery；
图片标签匹配图片；
Post 标签匹配 Post；
搜索结果可以按领域分组展示。
```

如果图片没有独立 tag，可以暂时让图片继承所属 Gallery 的 tag 用于筛选，但应该在查询层明确表达，而不是复制一份 tag 数据。

不建议为了搜索便利，在多个表中冗余保存同一套 tag，避免出现同步问题。

## 6. 推荐优先级

搜索功能建议拆为：

1. 搜索 Post 和 Gallery 的 title/tag；
2. 增加 GalleryImage 的 title/caption 搜索；
3. 增加类型筛选；
4. 增加分页和排序；
5. 再评估全文搜索和相关性排序。

这样可以避免第一次实现就同时处理所有结果类型、标签继承、全文索引和复杂 UI。

---

# 四、需求三：Gallery 地址栏定位到某张图片

原始想法：

> 当前 /gallery 地址栏没有任何信息，gallery中的某张图片应该可以通过地址栏 `/gallery/album_name#picture_title` 定位到。是否需要引入 nuqs？还是和 posts 使用同样的逻辑就够了。

这是一个非常合理的需求，而且和当前架构关系较小，主要是前端 URL 状态设计问题。

## 1. 推荐 URL 形式

建议使用：

```text
/gallery/[albumSlug]#image-[imageId]
```

例如：

```text
/gallery/travel-in-japan#image-42
```

不建议优先使用：

```text
/gallery/travel-in-japan#picture-title
```

原因是图片标题可能：

- 包含中文；
- 包含空格；
- 包含特殊字符；
- 被用户修改；
- 不唯一；
- 与 HTML ID 编码规则冲突。

如果图片已经有稳定的数据库 ID，可以使用 ID：

```text
#image-42
```

如果项目已有稳定的图片 slug，也可以使用：

```text
#image-fuji-sunset
```

但必须保证 slug 稳定且唯一。

推荐优先级：

```text
稳定 imageId > 稳定 imageSlug > title slug
```

## 2. 是否需要 nuqs

对于单纯的 hash 定位，不建议引入 `nuqs`。

`nuqs` 更适合管理：

- 搜索关键词；
- 分类筛选；
- 分页；
- 排序；
- 多个 URL query 参数；
- 需要与 React state 双向同步的页面状态。

而当前需求是：

```text
URL path     = Gallery slug
URL hash     = 当前图片
```

这属于浏览器原生 fragment 行为，使用原生能力即可：

```ts
window.location.hash = `image-${imageId}`;
```

页面打开后：

```ts
document.getElementById(`image-${imageId}`)?.scrollIntoView();
```

如果 Lightbox 是由客户端状态控制，还需要在 hydration 后读取 hash，并打开对应图片。

## 3. 与 Posts 使用相同逻辑是否合适

如果 Posts 当前已有类似的 URL 状态或锚点处理，应优先复用其**行为模式**，但不应为了“统一”而强行复用领域组件。

可以复用：

- hash 解析工具；
- 安全的 ID 编码规则；
- 滚动到目标元素的工具；
- 浏览器历史记录更新方式；
- `pushState` / `replaceState` 策略。

但 Gallery 仍应保持独立的领域逻辑：

```text
Post anchor → 文章标题或段落
Gallery anchor → 图片或 Lightbox 项
```

## 4. Lightbox 场景需要额外考虑

如果 Gallery 使用 Lightbox，单纯的 HTML anchor 不一定足够。

需要明确进入 URL 后的行为：

### 方案 A：只滚动到图片

```text
/gallery/album#image-42
```

页面加载后滚动到对应图片，但不打开 Lightbox。

优点：

- 行为简单；
- 对无 JavaScript 访问更友好；
- 适合 Grid 页面。

### 方案 B：自动打开 Lightbox

```text
/gallery/album#image-42
```

页面加载后：

1. 解析 hash；
2. 找到图片；
3. 打开 Lightbox；
4. 当前图片成为 active image。

优点：

- 更符合“定位到某张图片”的直觉；
- 可以直接分享某张图片。

缺点：

- 需要处理 hydration；
- 需要等待图片列表加载；
- 需要处理移动端；
- 需要管理浏览器历史；
- Lightbox 关闭时是否清除 hash 需要定义。

建议采用：

> 首次加载 hash 时自动定位并打开 Lightbox；用户关闭 Lightbox 时使用 `history.replaceState` 清除 hash，避免关闭操作产生多余历史记录。

## 5. Hash 更新策略

点击 Gallery 图片时：

```text
点击图片
→ 更新 #image-id
→ 打开 Lightbox
```

切换 Lightbox 中的下一张图片时：

```text
切换图片
→ 使用 history.replaceState 更新 hash
```

不建议每次切换图片都调用 `pushState`，否则用户按返回键时会经历完整的图片浏览历史。

可以采用：

```text
首次打开 Lightbox：pushState
Lightbox 内切换图片：replaceState
关闭 Lightbox：replaceState 清除 hash
```

## 6. 可访问性要求

如果使用 hash 定位，需要确保目标元素有稳定的 DOM ID：

```html
<figure id="image-42">
```

同时还应提供：

- 可访问的图片标题；
- `alt`；
- Lightbox 关闭按钮；
- 键盘 Escape 关闭；
- 键盘左右方向切换；
- 焦点恢复到原始图片；
- hash 定位失败时不抛出错误。

---

# 五、三条需求的优先级建议

建议按照以下顺序实施：

## P0：Gallery 图片深链接

```text
/gallery/[slug]#image-[id]
```

理由：

- 用户价值清晰；
- 技术范围小；
- 不涉及数据库模型；
- 方便分享具体图片；
- 不引入新基础设施；
- 可以验证 Gallery 前端状态管理模式。

## P1：首页 Gallery 模块

先使用“最近 Gallery”方案：

```text
首页展示最新 3 个 Gallery
```

理由：

- 查询简单；
- 不需要增加字段；
- 能明显增强首页内容覆盖；
- 与当前运行时副本模型一致。

## P1/P2：统一搜索

建议先实现：

```text
Post title/tag
Gallery title/tag
```

再扩展：

```text
Gallery image title/caption/tag
```

理由：

- 搜索涉及多个领域；
- 需要先定义结果 DTO；
- 需要明确 tag 归属；
- 可能影响数据库查询和 UI；
- 不适合在需求尚未明确时直接实现。

---

# 六、建议补充的明确需求

当前 `thoughts.md` 更像想法清单，还缺少验收条件。建议将其整理为以下形式：

```md
# Gallery 与搜索体验

## 首页 Gallery 模块

- 首页展示最近发布的 3 个 Gallery。
- 每个 Gallery 展示标题、封面图和跳转链接。
- 没有 Gallery 时不展示空模块。
- 首页只读取已发布的 Gallery 运行时副本。
- 不新增 Dashboard 编辑入口。
- 不新增数据库到 album.yaml 的回写。

## 搜索

- 支持搜索 Post 标题和标签。
- 支持搜索 Gallery 标题和标签。
- 第二阶段支持 GalleryImage 标题、caption 和标签。
- 搜索结果必须返回公开 DTO，不直接暴露数据库对象。
- 图片搜索结果必须包含所属 Gallery 和图片定位地址。
- 搜索不连接 Cloudinary，也不创建新的搜索服务。
- 支持分页和类型筛选。

## Gallery 图片深链接

- Gallery 详情页使用 `/gallery/[slug]`。
- 单张图片使用 `#image-[stableId]` 定位。
- 图片 ID 必须稳定且唯一。
- 首次访问带 hash 时自动打开对应图片 Lightbox。
- Lightbox 内切换图片使用 replaceState。
- 关闭 Lightbox 后清除 hash。
- 无效 hash 不应导致页面报错。
- 分享链接刷新后仍然能够定位到对应图片。
```

---

# 七、最终建议

这份 `thoughts.md` 中的需求方向是合理的，但建议做三项架构约束：

1. **首页 Gallery 使用现有 Gallery 查询，不新增首页专属数据库状态。**
2. **搜索先使用 PostgreSQL 和现有领域数据，不引入外部搜索服务。**
3. **图片深链接使用原生 hash 和稳定图片 ID，不为此引入 `nuqs`。**

最推荐的第一批实现范围是：

```text
1. /gallery/[slug]#image-[imageId] 深链接
2. 首页最近 Gallery 模块
3. Post + Gallery 标题和 Tag 搜索
```

暂时不要在第一轮同时加入：

- 精选 Gallery 配置；
- 图片全文搜索；
- 复杂搜索排序；
- 外部搜索服务；
- `nuqs`；
- 图片 title slug 重构；
- Dashboard 搜索配置；
- 数据库新增首页展示字段。

这样可以保持需求与当前架构减法目标一致：**增强读取体验，但不增加新的内容源和管理系统。**