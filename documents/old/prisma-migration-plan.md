# Prisma 数据迁移计划（专注 Blog）

## 🎯 目标
- 完全用 Prisma 替代 Payload，为首页/博客页以及博客详情提供数据。
- 先移除所有与 “Projects” 相关的查询、模型和 UI（只保留 blog flow），等 blog 体系稳定再决定是否重新引入其他内容。
- 保持现有 view-model（`BlogPostViewModel`、`ProfileViewModel`、`TagViewModel`）与客户端缓存逻辑，只替换底层数据来源与种子脚本。

## 🧭 现状与参考
- `content-providers.ts` 目前依赖 Payload (`getPayload`, `safeExtract`) 同时返回 `blogPosts`、`projects`、`profile`、`tags`。
- `actions/content.ts`、`store/content-slice.ts` 直接复用 provider 的接口；client-state 以 `BlogPostViewModel`/`ProjectViewModel` 为基础缓存数据。
- `app/page.tsx`、`app/blog/page.tsx`、`app/blog/[slug]/page.tsx` 以及 `BlogPostClient`、`BlogGridClient`、`Hero` 等组件是当前流量核心，`projects` 相关功能目前已禁用可暂时忽略。
- `prisma/schema.prisma` 有 `Post`/`Project`/`Profile`/`Tag`/`Comment` 等模型；我们只需关注支持博客字段（`content`、`slug`、`tags`、`publishedAt` 等）。
- `scripts/seed.ts` 还在调用 Payload，必须改为 Prisma 来初始化博客、标签、个人资料、评论。

## 迁移步骤

### 1. 精简 Prisma Schema（`prisma/schema.prisma`）
- 只保留 `Post`、`Tag`、`Profile`、`Comment` 等博客相关模型，删除 `Project` 模型和 `images`/`technologies` 等字段。
- `Post` 模型至少包含：
  - `id`, `slug`, `title`, `excerpt`, `content`（`Json` 用于 Lexical）、`featuredImageUrl`, `status`, `publishedAt`, `createdAt`, `updatedAt`
  - `tags` 与 `Tag` 的多对多关系，`comments` 的一对多。
  - `type: PostType` 保留但可以默认 `BLOG`。
  - 适当的 `@@index`（`slug`, `status`, `publishedAt`）。
- `Profile` 继续持有 `slogans`/`skills`/`socialLinks` JSON，`Tag` 写 `color`/`slug`。
- `Comment` 关联 `Post`，只暴露 `content`, `status`, `authorName`, `createdAt`。
- 运行 `npx prisma generate && npx prisma db push`（或 `migrate dev`）更新客户端。

### 2. 重写 `content-providers.ts`
- 全部改用 `import { prisma } from '@/lib/prisma'`。
- `fetchBlogPosts`：`findMany({ where: { type: 'BLOG', status: 'PUBLISHED' }, include: { tags: true }, orderBy: { publishedAt: 'desc' }, take: 6 })`，映射 `BlogPostViewModel`（`tags` 只取 `name/slug/color`，`content` 直接沿用 Lexical JSON）。
- `fetchBlogPostBySlug`：`findUnique({ where: { slug }, include: { tags: true } })`，如果没找到返回 `null`。
- `fetchAllBlogPostSlugs`：`findMany({ where: { type: 'BLOG', status: 'PUBLISHED' }, select: { slug: true } })`。
- `fetchTags`：`prisma.tag.findMany({ orderBy: { name: 'asc' } })`。
- `fetchHomeContent`：组合 `profile` + `blogPosts`，`projects` 可暂设 `[]`，并在 `ContentResponse` 类型里标注项目尚未提供。
- 删除 `safeExtract` 和所有与 Payload 深度字段有关的逻辑。
- 更新 view-model 类型，使 `content` 为 `SerializedEditorState | null`，`tags` 里只含必要字段。

### 3. 清理 Actions 与 Store
- `actions/content.ts` 只保留 `fetchBlogPostsAction`、`fetchBlogPostBySlugAction`、`fetchTagsAction` 并让它们直接调用优化后的 provider。
- 移除 `fetchProjectsAction`/`fetchProjectBySlugAction`、也不再导出 `ProjectViewModel` 相关内容（可保留空壳待后续拓展）。
- `store/content-slice.ts` 只维护与博客/标签有关的 `Map` 与时间戳；删除 `projects`/`singleProjects`、相关预加载字段以及 `setProjects`、`fetchProjects` 等逻辑。
- 确保缓存一致性逻辑仍适用；适配使用 `Map<string, BlogPostViewModel>`。

### 4. 调整页面与组件
- `app/page.tsx`：调用新的 `fetchHomeContent`，UI 侧只渲染 `projects`（空数组）/`blogPosts`/`profile`，避免报错。
- `app/blog/page.tsx` + `BlogGridClient`：继续显示 `posts`，只要 view-model 提供 `content`/`tags`/`featuredImageUrl` 就无需改动。
- `app/blog/[slug]/page.tsx` 与 `BlogPostClient`：绑定新版 `fetchBlogPostBySlug`，`generateMetadata`/`generateStaticParams` 使用新的数据。
- 删除或注释掉 `ProjectClient`、`ProjectCard`、`ProjectsGridClient` 等导出，以便未来重建，防止未更新时引用 Payload。
- `HomeScrollArea`、`Hero`、`BlogPostCard` 等组件保持不变；只需要确认 `profile` 中 `slogans`/`skills` 依旧存在。

### 5. 重建 Prisma 种子脚本
- 改用 `import { prisma } from '@/lib/prisma'` 和硬编码的 demo 数据（博客文章、tag、profile、comments）。
- `Post.content` 使用简单的 Lexical JSON 或从 Markdown 转换的结构，`featuredImageUrl` 指向 `public/media` 中的图片。
- `tags` 通过 `connectOrCreate` 关联，`comments` 直接写入 `prisma.comment.create`、`postId` 外键。
- 最后 `await prisma.$disconnect()`。
- 删除 Payload 相关脚本（`payload.config.ts`、`collections/*`）或者保留但标注即将弃用。

### 6. 验证
- 运行 `npx prisma generate && npx prisma db push` 更新 Client。
- `npm run lint`/`npm run dev` 并访问 `/`, `/blog`, `/blog/welcome-to-my-blog` 确认数据正确渲染。
- 打开 `HomeScrollArea` 相关组件，确保 `projects` 数组为空时不会报错（可能需要在组件中默认 `[]`）。
- 把文档中标注 “projects 暂时为空” 以提醒后续恢复工作。

### 7. 后续拓展（可选）
- 当 blog flow 稳定后，再决定是否重新引入项目内容：可以用 `Post.type = PROJECT` 扩展 view-model 并在 `projects` 页面中按语义过滤。
- 将 `CommentsSection` 重构为直接查询 Prisma `Comment`（与 blog post 关联），再次启用注释。
