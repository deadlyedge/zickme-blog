# 想法


# Todos

- 进入/gallery以后，目前的读取优化还是存在问题，普通页面似乎可以同时读取缩略图和原图，但点击切换当前图片时仍有明显延迟，应该是预读取逻辑有问题
- 如果album图片较多，普通页面会有右侧滚动缩略图，那么应该同时lazy加载缩略图和原图，以保证点击缩略图可以立刻打开图片
- 应该结合nextjs的图片优化功能，我不确定这是否意味着不再需要cloudinary的缩略图读取，因为nextjs本身就会将图片优化成需要的尺寸。一次读取cloudinary，优化成两种尺寸：显示大图和缩略小图。这样是否更快速逻辑更清晰？


## 结论先说

你提出的三个问题本质上是三个不同层面的事情：

1. **缩略图是否及时加载**：由缩略图 URL、`next/image` 的 `sizes`、浏览器 lazy-loading 和滚动容器共同决定。
2. **点击后主图是否立即显示**：需要单独做“当前图 + 相邻图片”的原图预取，不能只依赖 `next/image` 的 `priority`/`preload`。
3. **Cloudinary 与 Next.js 图片优化如何分工**：Next.js Image Optimizer 可以承担尺寸和格式优化，但它不会自动把一次 Cloudinary 请求同时变成两个尺寸，也不会替代浏览器缓存和预取策略。

我建议采用：

> **Cloudinary 保存并提供原图；Next.js Image Optimizer 负责前台最终尺寸优化；Gallery 组件显式预取当前图相邻的 1～2 张主图；缩略图继续使用独立的 Cloudinary thumbnail URL，或改成更小尺寸的 Cloudinary URL。**

暂时不建议直接删除 `thumbnailUrl`。

---

# 一、当前代码中已经确认的问题

当前 Gallery 的主要结构是：

```text
GalleryPostView
    ↓
GalleryGrid
    ├── 桌面主图：image.url
    ├── 桌面右侧缩略图：image.thumbnailUrl
    ├── 移动端图片网格：image.thumbnailUrl
    ↓
GalleryLightbox
    └── image.url
```

当前代码中：

```tsx
<GalleryImage
    image={images[selectedIndex]}
    priority
    sizes="(min-width: 768px) 75vw, 100vw"
/>
```

桌面右侧缩略图：

```tsx
<GalleryImage
    image={image}
    sizes="160px"
    variant="thumbnail"
/>
```

而 `GalleryImage` 内部实际是：

```tsx
<Image
    src={getGalleryImageUrl(image, variant)}
    fill
    priority={priority}
    sizes={sizes}
    className="object-contain"
/>
```

几个问题比较明显。

## 1. 当前主图切换没有真正的预读取

`priority` 只作用于当前已经渲染的 `<Image>`。

当：

```tsx
selectedIndex
```

从 0 变成 1 时，组件的 `src` 变了。浏览器此时才开始请求下一张主图。

也就是说，当前逻辑是：

```text
点击缩略图
    ↓
selectedIndex 改变
    ↓
主图 src 改变
    ↓
Next Image Optimizer 请求新尺寸
    ↓
Next 服务端请求 Cloudinary 原图
    ↓
处理并返回
    ↓
浏览器显示
```

这就会产生明显延迟。

`priority` 并没有让所有可能切换到的图片提前准备好。

此外，项目使用的是 Next.js 16.3.5。本版本文档已经将 `preload` 作为新的显式预加载属性，`priority` 属于旧的兼容方式。即使改成：

```tsx
<Image preload />
```

也只适合当前首屏主图，不适合给整个相册所有图片都设置。

---

## 2. 当前桌面缩略图确实使用了 lazy loading，但行为不够可控

没有显式指定 `loading` 时，`next/image` 默认会进行 lazy loading。

这对于右侧滚动区域理论上是合理的，但有两个问题：

### 第一，滚动容器会影响浏览器的预加载边界

右侧缩略图并不是页面主滚动区，而是：

```tsx
<div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
```

浏览器会根据这个内部滚动容器的可视区域和预加载距离决定什么时候加载图片。不同浏览器、网络条件下表现不完全一致。

因此可能出现：

```text
缩略图刚进入内部滚动区域
    ↓
仍未完成加载
    ↓
用户马上点击
    ↓
主图切换 + 原图再请求
```

### 第二，thumbnail URL 当前是 640×640 的 Cloudinary 变换

Cloudinary 当前生成：

```ts
width: 640,
height: 640,
crop: 'limit',
quality: 'auto',
fetch_format: 'auto',
```

但桌面缩略图实际只有约 160px 宽：

```tsx
sizes="160px"
```

这意味着：

```text
Cloudinary 先生成最多 640px 的图片
    ↓
Next Image Optimizer 再处理成接近 160px 的尺寸
```

这不一定会造成非常严重的问题，但存在重复优化和不必要的中间体积。

---

## 3. Gallery 页面把所有 album 的完整图片数据都传到了客户端

`/gallery/[slug]` 当前执行：

```tsx
const gallery = await fetchGalleryBySlug(slug)
const galleries = await fetchGalleries()
return <GalleryPostView albums={galleries} initialAlbumSlug={gallery.slug} />
```

所以进入一个相册详情页时，服务端会查询所有公开相册及其所有图片，并把完整的 `url`、`thumbnailUrl` 等数据传给客户端。

这不一定会直接触发所有图片下载，但会带来：

- 较大的 RSC/HTML 数据；
- 所有 album 的图片元数据进入客户端；
- 客户端初次渲染和 hydration 成本增加；
- 如果缩略图实际已经进入渲染树，浏览器可能开始加载很多图片。

这属于另一个可以后续优化的问题：

```text
当前相册内容
    ↓
首屏直接传输

其他相册
    ↓
只传递轻量导航数据，切换时再读取
```

不过它不是当前主图点击延迟的唯一原因，应该和图片预加载问题分开处理。

---

# 二、Next.js Image Optimizer 是否能取代 Cloudinary 缩略图？

## 简短答案：可以取代一部分职责，但不是简单的“一次读取，两种尺寸”

你设想的逻辑是：

```text
Cloudinary 原图
    ↓
Next.js Image Optimizer
    ├── 大图
    └── 缩略图
```

理论上可行，但实际请求关系更接近：

```text
浏览器请求 Next 优化 URL（大图）
    ↓
Next 服务端请求 Cloudinary 原图
    ↓
Next 生成大图并缓存

浏览器请求 Next 优化 URL（缩略图）
    ↓
Next 服务端请求 Cloudinary 原图
    ↓
Next 生成缩略图并缓存
```

两个不同尺寸通常是两个不同的优化缓存键，不能假设 Next.js 会只从 Cloudinary 读取一次原图然后同步生成两种尺寸。

可能的情况是：

- 第一次请求大图时，Next 拉取 Cloudinary 原图并缓存大图；
- 第一次请求缩略图时，Next 又需要处理另一个尺寸；
- Next 的缓存机制可以减少后续重复请求；
- 但这不是应用层面可以依赖的“一次请求复用全部尺寸”。

另外，如果采用默认 Next.js Image Optimizer：

```tsx
<Image src="https://res.cloudinary.com/..." />
```

Next.js 会把 Cloudinary URL 作为原始输入，再通过：

```text
/_next/image?url=...&w=...&q=...
```

产生自己的优化结果。

这带来的优点：

- 根据 `sizes` 生成合适宽度；
- 使用 Next 支持的现代格式；
- 对浏览器提供响应式 `srcset`；
- 缩略图和主图可以统一走同一套 React 组件；
- 不需要业务层手动生成很多尺寸。

但也有成本：

- 额外经过一次 Next.js 服务端优化；
- Vercel 或自托管服务增加 Image Optimization 请求；
- 同一张图片会同时存在 Cloudinary 和 Next 缓存；
- 首次请求某个尺寸仍然有服务端处理延迟；
- 如果 Cloudinary 本身已经生成了合适尺寸，Next 可能做了重复工作。

---

# 三、Cloudinary 缩略图是否应该保留？

## 我的建议：保留，但调整职责和尺寸

目前 `thumbnailUrl` 有几个价值：

1. 缩略图不会直接触碰原图；
2. Cloudinary 可以在源头降低传输体积；
3. 移动端图片网格不需要让 Next 读取大原图；
4. Gallery 卡片、首页 Gallery、右侧缩略栏都可以复用；
5. 如果 Next Image Optimizer 不可用，仍有合理的 CDN fallback。

但是当前 640px 对右侧缩略图偏大。

更合理的拆分是：

```text
Cloudinary 原始 URL
    用于主图 / Lightbox

Cloudinary thumbnail URL
    约 320px 或 480px
    用于移动端网格、右侧缩略图、首页卡片
```

例如：

```text
thumbnail: width 320, height 320, crop limit
main: 使用原图 URL，由 next/image 根据 sizes 生成
```

对于右侧 160px 缩略图，320px 通常已经足够，尤其需要考虑高 DPR 屏幕。

如果希望完全避免重复优化，可以使用更明确的分工：

```text
主图：
  Cloudinary 原图 → next/image → Next 优化

缩略图：
  Cloudinary 320px URL → next/image
```

也可以让缩略图直接使用：

```tsx
<Image
  src={image.thumbnailUrl}
  width={...}
  height={...}
  unoptimized
/>
```

但是否 `unoptimized` 要通过实际网络和缓存测试后决定。因为这样会绕过 Next 对 thumbnail 的进一步优化，但能避免双重处理。

---

# 四、推荐的加载策略

## 1. 初始主图：显式 preload

只有初始当前主图使用：

```tsx
<Image
  preload
  ...
/>
```

或者在确实需要兼容旧代码时保留 `priority`，但不应同时给大量图片使用。

主图需要提供准确的：

```tsx
sizes="(min-width: 768px) 75vw, 100vw"
```

当前这个 `sizes` 基本方向是对的，不过可以根据实际最大容器宽度进一步收窄，避免浏览器选择过大的资源。

---

## 2. 缩略图：继续 lazy，但用合理的预加载距离

右侧缩略图建议：

```tsx
<Image
  loading="lazy"
  sizes="160px"
  ...
/>
```

这不会保证用户点击前百分之百加载完成，但会明确表达缩略图不是首屏关键内容。

同时建议：

- 当前缩略图和当前图前后各一张不要 lazy；
- 其他缩略图保持 lazy；
- 鼠标/触摸即将经过的缩略图可以提前加载；
- 不要给整个右侧列表的所有缩略图设置 `preload`。

可以采用：

```text
当前缩略图：eager
当前前后 1 张：eager 或主动预取
其余缩略图：lazy
```

但是这里要注意：缩略图是否 eager 不应等同于原图是否 eager。

---

## 3. 主图：预取相邻图片，而不是预取全部原图

对于用户点击切换的 Gallery，最有效的策略通常是：

```text
当前图片
    preload

下一张
    主动预取

上一张
    主动预取

更远图片
    等用户接近时再预取
```

相册有 100 张图片时，不应该一进入页面就请求 100 张原图。

推荐的预取窗口：

```text
当前 index - 1
当前 index
当前 index + 1
```

当用户切换到下一张时，再继续把新的下一张加入预取窗口。

也就是说：

```text
初始：[0]
预取：[0, 1]

切换到 1：
预取：[0, 1, 2]

切换到 2：
预取：[1, 2, 3]
```

这比“所有缩略图 + 所有原图同时读取”更加稳定。

---

## 4. Lightbox 也应该沿用同一个预取策略

目前桌面主图和移动端 Lightbox 是两个展示链路：

```text
桌面：
GalleryGrid 当前主图

移动端：
GalleryGrid 缩略图 → GalleryLightbox 原图
```

如果用户在移动端点击一个已经加载完成的缩略图，Lightbox 仍然要第一次请求 `image.url`。

所以在 `onOpen` 或 Lightbox 打开前，应立即预取：

```text
当前图片原图
下一张原图
上一张原图
```

否则移动端会出现：

```text
点击缩略图
    ↓
打开 Lightbox
    ↓
才开始请求大图
    ↓
明显白屏/延迟
```

---

# 五、一个重要的实现细节：预取必须和 `next/image` 的最终 URL 对齐

如果直接这样写：

```ts
const preload = new window.Image()
preload.src = image.url
```

预取的是 Cloudinary 原图 URL。

但实际页面中的：

```tsx
<Image src={image.url} sizes="..." />
```

请求的却是：

```text
/_next/image?url=...&w=...&q=...
```

这两个 URL 不相同，因此浏览器缓存不能直接复用。

结果可能是：

```text
预取 Cloudinary 原图
    ↓
点击后 Next Image 又请求优化 URL
    ↓
仍然产生等待
```

这是目前“看似做了预读取但点击仍有延迟”的高风险原因之一。

因此需要二选一：

## 方案 A：预取原始 Cloudinary URL，展示主图也绕过 Next 优化

这种方案逻辑简单，但失去了部分 Next Image 优化能力。

## 方案 B：预取 Next Image Optimizer 生成的 URL

预取必须使用和 `<Image>` 一致的：

```text
src
width
quality
```

生成等价的：

```text
/_next/image?url=...&w=...&q=...
```

或者将相邻图片实际渲染成隐藏的 `<Image>`，让 Next 自动生成正确的优化 URL。

例如概念上：

```tsx
<div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
  <Image
    src={nextImage}
    alt=""
    width={...}
    height={...}
    loading="eager"
  />
</div>
```

这样浏览器请求的就是与真实主图一致的 Next 优化资源。

不过要注意隐藏图片仍然会占用带宽，所以只建议预取相邻一两张。

---

# 六、建议采用的整体架构

## 推荐方案

```text
数据库 GalleryPublicImage
    ├── url
    │   └── Cloudinary 原图
    │
    ├── thumbnailUrl
    │   └── Cloudinary 320/480px 缩略图
    │
    ├── width
    └── height
```

前台：

```text
右侧缩略图 / 移动端网格
    ↓
thumbnailUrl
    ↓
next/image
    ↓
loading=lazy
    ↓
sizes=160px 或实际网格宽度

桌面当前主图
    ↓
url
    ↓
next/image
    ↓
初始图 preload
    ↓
相邻图主动预取

Lightbox
    ↓
url
    ↓
next/image
    ↓
当前图 + 前后图预取
```

---

# 七、是否应该删除 `thumbnailUrl`？

## 不建议现在删除

因为删除后会把所有优化压力转移给 Next.js：

```text
每个缩略图都使用 Cloudinary 原图作为输入
    ↓
Next Image Optimizer 分别处理大量小尺寸图
```

对于图片数量较多的 album，可能出现：

- Next 服务端首次生成大量缩略图；
- 首屏或内部滚动容器出现较多优化请求；
- Cloudinary 到 Next 的上游传输成本增加；
- 自托管环境下 CPU 和缓存压力增大；
- 本地开发时更容易看到明显延迟。

更合理的是先做一次对比测试：

### A 现状

```text
Cloudinary 640px thumbnail
    ↓
next/image
```

### B 推荐

```text
Cloudinary 320px thumbnail
    ↓
next/image
```

### C 全部交给 Next

```text
Cloudinary original
    ↓
next/image
```

重点比较：

- 首次进入页面时间；
- 右侧缩略图首次可见时间；
- 点击下一张主图的等待时间；
- 网络请求数量；
- Cloudinary 到 Next 的响应体积；
- Next Image Optimizer 的响应时间；
- 移动网络下体验。

在没有实际网络瀑布数据前，不应该仅凭理论删除 `thumbnailUrl`。

---

# 八、建议的实施顺序

当前任务适合拆成几个小阶段，而不是一次性重构所有图片逻辑。

## 阶段 1：先修复主图预取

目标：

- 初始主图使用 `preload`；
- 只预取当前图前后各一张；
- 桌面主图和移动端 Lightbox 共用预取逻辑；
- 避免预取所有原图；
- 确保预取 URL 与实际显示 URL 一致。

这是最可能直接解决“点击切换有明显延迟”的部分。

---

## 阶段 2：调整缩略图加载

目标：

- 右侧缩略图明确使用 `thumbnailUrl`；
- 明确设置 `loading="lazy"`；
- 当前缩略图及邻近缩略图优先加载；
- 缩略图 `sizes` 与真实显示尺寸匹配；
- 检查内部滚动容器中的加载行为。

---

## 阶段 3：降低 Cloudinary thumbnail 尺寸

将当前：

```ts
width: 640,
height: 640
```

评估调整到：

```ts
width: 320,
height: 320
```

或者按实际布局使用 400/480px。

这里要注意 `crop: 'limit'` 会保持原始宽高比，不会强制裁切成正方形，这符合当前图片展示逻辑。

---

## 阶段 4：再评估是否统一到 Next.js Image Optimizer

等前面三个阶段完成并观察真实网络请求后，再决定是否：

- 保留 Cloudinary thumbnail；
- 为 Cloudinary 增加 Next 自定义 loader；
- 对 thumbnail 使用 `unoptimized`；
- 逐步删除数据库中的 `thumbnailUrl`。

我不建议把这几个决定和预取逻辑同时修改，否则很难判断性能变化究竟来自哪一项。

---

# 九、最终建议

我的推荐结论是：

```text
不要简单理解为：
Next.js Image Optimizer = 不再需要 Cloudinary thumbnail
```

更准确的理解应该是：

```text
Cloudinary：
    负责原始媒体存储、CDN 和粗粒度媒体变换

Next.js Image：
    负责根据页面布局产生适合当前浏览器的最终响应尺寸

Gallery 交互逻辑：
    负责决定什么时候预取当前图和相邻图
```

推荐保留：

```text
url           = Cloudinary 原图
thumbnailUrl  = Cloudinary 320/480px 缩略图
```

推荐加载规则：

```text
初始主图：
    preload

当前图：
    立即加载

前一张/后一张主图：
    主动预取

右侧缩略图：
    thumbnailUrl + loading="lazy"

移动端网格：
    thumbnailUrl + loading="lazy"

Lightbox：
    使用原图，但提前预取当前图和相邻图
```

最需要优先检查的点是：

> 当前所谓的“预读取”是否预取了 Cloudinary 原始 URL，而实际页面使用的是 Next.js `/ _next/image` 优化 URL。如果两者不同，浏览器缓存无法复用，这很可能就是点击切换仍然延迟的核心原因。