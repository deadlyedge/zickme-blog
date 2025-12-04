我先把目前看到的整体情况和可以着手优化的方向，按“结构 / 数据流 / 交互体验 / 工程化”这四块帮你梳理一下，方便你后续一步步迭代。

---
## 一、整体印象

- 技术栈比较现代：Next 16 + React 19 + Zustand + Payload CMS + Tailwind 4 beta 生态，选型前瞻但也带来一定复杂度。
- 路由和页面结构清晰：`/(frontend)` 里首页、Blog 列表 + 详情、Projects 列表 + 详情、About 页面划分合理。
- 数据来源分层：
  - server 组件页面通过 `lib/content-providers` 获取首屏数据；
  - 客户端通过 `lib/actions/*` + `zustand store` 做缓存和二次加载（如 Blog 详情）。
- UI 方面有自己的一套组件库：`components/ui/*` + 一些效果组件（PageTransition、Glitch、ScrollArea 等），利于统一风格。

总体来说已经明显超过“脚手架级别 demo”，更接近一个有意识地设计过的数据流 + 体验层的博客/作品集。

下面重点说“值得优化”而不是“对错”。

---
## 二、架构与数据流

### 2.1 SSR / SSG 与 Client Cache 的边界

当前模式：
- 列表页（/blog, /projects, /about, /）是 **Server Component + `revalidate`**，很好；
- Blog 详情页是纯 `use client` + `useParams` + Zustand 异步拉取，**不利用 Next 的路由级 SSG/缓存能力**。

**建议：**
1. 优先考虑让详情页回到“服务端拿首屏数据”：
   - 使用动态路由 `generateStaticParams` + `fetchBlogPost`（从 content-providers 或 payload 直接拉）；
   - `revalidate` 控制增量更新；
   - 客户端只用 Zustand 做“返回列表时保持状态 / 预加载”的增强，而不是“首屏也要等 client fetch”。
2. 如果你是有意做“全 Client 驱动的 cache 模式”，那可以：
   - 把 `BlogPostPage` 拆成：
     - `page.tsx`：Server shell（负责 SEO、metadata、skeleton）；
     - `BlogPostClient`：只承载当前的逻辑（`useAppStore`、`useEffect` 等）。
   - 这样既保留当前体验，又避免完全丢掉 SSR + metadata 的好处。

### 2.2 Zustand store 的角色要更“专一”

`content-slice` 已经做了不少事情：Map 缓存、时间戳、防抖 fetch、preloading 状态。

**可以优化的点：**
1. **命名与责任更清晰：**
   - 现在既有 `fetchBlogPosts`（自己去调 action），又有 `setBlogPosts`（直接灌数据）。
   - 列表页目前是 Server 渲染 + `setBlogPosts` 灌缓存，这很好；
   - 建议约定一个清晰的使用规范：
     - 页面（RSC）永远只用 `setXxx` 写入首屏数据；
     - 客户端跳转后才调用 `fetchXxx`（比如从 /blog → /blog/[slug]）做补充拉取。
2. **错误 / 加载状态：**
   - `fetchBlogPost` 只在 console 打错误，UI 完全不知道发生了什么。
   - 建议为 `singleBlogPost` 和 `singleProject` 增加：
     - `loadingStates: { blogPostBySlug: Record<string, boolean> }`
     - `errorStates: { blogPostBySlug: Record<string, string | null> }`
   - 详情页就能区分“404”与“网络错误/服务端错误”并给到不同反馈。
3. **缓存策略抽象一下：**
   - 现在缓存常量散落在 slice 里：`BLOG_CACHE_DURATION`、`PROJECT_CACHE_DURATION` 等；
   - 可以考虑抽到 `lib/store/cacheConfig.ts`，顺便注释你的设计意图：
     - “列表 10min、项目 1h、tags 10min、单篇 10min” 等
   - 之后要调策略时不会到处找常量。

---
## 三、UI 组件与交互体验

### 3.1 HeaderNav 与 NavigationProvider 的角色重叠

- `HeaderNav` 使用了 `useAppStore((state) => state.isNavigating)` 来控制按钮 disabled / 半透明；
- 同时又有一个独立的 `NavigationProvider` 提供 `isNavigating` 和 `navigate()`，但目前 HeaderNav 并没用这个 context。

**建议：**统一导航状态来源，避免双系统：
1. 要么：统一到 **Zustand**：
   - 把 `NavigationProvider` 的逻辑（`isNavigating`, `currentPath`, `navigate`）合并进 `navigation-slice`；
   - 所有需要“导航 loading 状态”的地方都用 `useAppStore`。
2. 要么：统一到 **NavigationProvider**：
   - 把 `HeaderNav` 改写成使用 `useNavigation`；
   - 移除 `isNavigating` 这块 Zustand 逻辑。

两套并存会增加后期维护的心智负担，而且因为 Next 自带 `Link` 的 prefetch、router 状态，你其实可以把自定义的导航 loading 做得非常轻量。

### 3.2 PageTransition / AdvancedPageTransition 的使用

-


那我就按刚才给你的 roadmap，往下“收缩到可落地的改动方案”，你可以选一两步先做。如果后面你想让我帮你具体改代码，再帮你审一轮，可以再把我切到 Act mode。

下面的内容我会尽量偏“怎么改”而不是再讲“为什么”。

---
## Step 1：梳理详情页的数据获取边界（推荐路线）

这里以 **Blog 详情页** 为例，目标是：
- 首屏依然有数据（利于 SEO / 分享卡片 / 不白屏）；
- 继续保留你现在的 Zustand cache 优势（从列表进详情体验流畅）。

### 1.1 拆分为 `page.tsx` + Client 组件

当前：`src/app/(frontend)/blog/[slug]/page.tsx` 是全 client：
- `use client`
- `useParams` + `useAppStore` + `useEffect(fetchBlogPost)`

推荐改造方向：
1. 把现有逻辑 90% 抽到 `BlogPostClient.tsx`（放在同目录下）：
   - 保留 `useAppStore` + skeleton + not-found UI；
   - 接收一个可选的 `initialPost` props；
   - 如果 store 里没有，就用 `initialPost` 初始化。
2. `page.tsx` 改成 Server 组件：
   - 负责：
     - 从 Payload/`content-providers` 拉单篇数据；
     - 把数据以 props 形式传给 `BlogPostClient`；
     - 可选：实现 `generateStaticParams` / `generateMetadata`。

这样做的好处是：
- 首屏一定有内容（即使客户端 JS 慢一点）；
- 你原有的 preloading、Zustand cache 不用大改。

> 这一块在 Act mode 里，我可以直接按这个结构帮你改出一版示例，然后你再按同样方式改 projects 详情页。

---
## Step 2：统一导航与加载状态

目前：
- `HeaderNav` 用的是 `useAppStore((state) => state.isNavigating)`；
- 同时有一个 `NavigationProvider` + `useNavigation`，但 HeaderNav 没用它。

我会更建议：
- **二选一，并优先选“Zustand”方案**，原因：
  - 你已经有 navigation-slice；
  - store 在其他地方也会需要“导航中”的信息；
  - 避免 hook 嵌套过多（context + store）。

具体可以做：
1. 看一下 `src/lib/store/navigation-slice.ts`（我没展开，但推测已有 `setIsNavigating` / `currentPath` 一类字段）；
2. 把 `NavigationProvider` 里那套逻辑 merge 进去：
   - `navigate(path)` 封装为 store 里的 action：
     ```ts
     navigate: (path: string) => {
       const { pathname } = get()
       const router = useRouter() // 这里要注意 hook 不能在 store 里用 —— 所以更好的做法是：
     ```
   - 更现实的方案是：保留 `NavigationProvider`，但它不再暴露自己的 context，而是把状态同步到 store：
     ```ts
     const setIsNavigating = useAppStore(s => s.setIsNavigating)
     ```
   - 或者干脆反向：在 `HeaderNav` 里只用 `useNavigation()`，然后把 store 里的 `isNavigating` 删掉。

**我个人倾向于：**如果导航 loading 状态只在 HeaderNav 用，就用 `NavigationProvider` 一套就够了，把 store 的 `isNavigating` 干掉，HeaderNav 全面改用 `useNavigation()`。

---
## Step 3：拆分“逻辑组件”和“展示组件”（以 BlogGridClient 为例）

当前 `BlogGridClient`：
- 一部分是 UI：筛选按钮、Grid、空状态文案；
- 一部分是副作用：`useEffect(() => setBlogPosts(posts); setTags(tags), [...])`。

推荐改造：
1. 新建一个“容器组件”，比如：`src/components/BlogGrid.tsx`：
   ```tsx
   'use client'
   import { useEffect } from 'react'
   import { useAppStore } from '@/lib/store'
   import type { BlogPostViewModel, TagViewModel } from '@/lib/content-providers'
   import { BlogGridView } from './BlogGridView'

   type Props = { posts: BlogPostViewModel[]; tags: TagViewModel[] }

   export function BlogGrid({ posts, tags }: Props) {
     const setBlogPosts = useAppStore((s) => s.setBlogPosts)
     const setTags = useAppStore((s) => s.setTags)

     useEffect(() => {
       setBlogPosts(posts)
       setTags(tags)
     }, [posts, tags, setBlogPosts, setTags])

     return <BlogGridView posts={posts} tags={tags} />
   }
   ```
2. 把目前 `BlogGridClient` 中与 UI 相关的部分抽成 `BlogGridView`：
   - 保留 `useState(activeTag)` / `useMemo(filteredPosts)` 等；
   - 不再关心 store。

这样：
- UI 组件是“纯的”，以后换数据源（例如完全 client 拉取）时可以复用；
- 逻辑组件负责“把 SSR 的数据写入全局 cache”，边界清晰。

同样的模式可以套用到 `ProjectsGridClient` 上。

---
## Step 4：补齐单篇内容的错误处理

这一块你可以先把“用户看得到的错”补起来，不必一上来就做复杂的错误模型。

针对 `content-slice` 里的 `fetchBlogPost` / `fetchProject`：
1. 在 store 里增加简单的 `singleErrors: Map<string, string | null>`；
2. `fetchBlogPost` 里：
   - 如果是 404（比如 action 返回 null），在 map 里记一个 `'NOT_FOUND'`；
   - 其他错误记 `'ERROR'` 或具体 message；
3. 详情页组件里：
   - 根据 `singleErrors.get(slug)` 显示“文章未找到”或“加载失败，请稍后再试”。

你现在的 Blog 详情页已经有“文章未找到”的 UI，只是依据的是“`!post && !isLoading`”，可以再精细一点，避免“网络瞬断时也提示 404”的情况。

---
## Step 5：SEO 小增强

等前面几步稳定后，可以：
1. 在 Blog、Project 详情页里加：
   - `export async function generateMetadata({ params }) { ... }`
   - 利用 Payload 的 title / description / tags / 封面图生成 meta；
2. 统一用一个小 helper：
   - 比如 `getOgImageFromPost(post)`，生成公开可访问的 og image url；
3. 这对博客的长期可见性帮助很大，但实现成本不高。

---
## 我建议你下一步做什么？

如果你想要一个非常具体的“下一步”：
- **先选定 Blog 详情页要不要回到 SSR + SSG**：
  - 如果是：我们就按我上面说的 `page.tsx + BlogPostClient` 结构来设计；
  - 如果你更喜欢纯 client（比如为了和某些实验特性配合），我们就做“结构拆分 + 错误状态细化”。

你可以先回复我：
1. 更偏好哪一种详情页形态（SSR+SSG / 继续 client-first）；
2. 有没有哪一块是你最想先改的（比如“导航体验”优先、还是“SEO 优先”）。

我会根据你的选择，给一份 **按文件拆解的、接近可以直接 copy 的重构草稿**，这样你在 Act mode 里就可以快速落地。