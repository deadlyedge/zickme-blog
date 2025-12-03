# add user comments

现代博客评论区的表现形式强调极简主义、线程化嵌套和交互流畅性，优先阅读性和移动适配，避免杂乱按钮堆积。

## 平面视图（Flat View）
去除装饰元素，使用纯文本、大间距和浅色调营造轻盈感，便于快速扫描评论。评论以线性排列，字体简洁无额外样式。

## 线程视图（Threaded View）
通过缩进、细线或图形连接回复，形成清晰层级，便于追踪长对话，支持触屏手势展开/折叠。移动端动态调整缩进级别，提升可读性。

## 动态折叠与截断
长评论自动截断，仅显示首行，用户点击展开；低层级回复默认折叠，减少视觉 clutter，按需加载子线程。


# 评论功能实现方案
基于 `documents/stage-1.md` 的需求和现有项目结构（Next.js App Router + PayloadCMS v3），用于实现博客和项目的评论功能的方案如下。

### 1. 方案概述
我们将构建一个轻量级、支持无限嵌套的评论系统。
**核心特点：**
*   **Backend**: 新增 `Comments` 集合，支持多态关联（同时支持 Blog Post 和 Project）和层级关系（Parent/Child）。
*   **Frontend**: 采用服务端组件 (RSC) 获取数据，客户端组件处理交互（展开/折叠、提交）。
*   **UI/UX**: 严格遵循 "Flat View" 和 "Threaded View" 规范，使用极简排版，动态处理深层嵌套的显示。

### 2. 核心变更 (Key Changes)

#### A. 后端架构 (PayloadCMS)
*   **New Collection**: `src/collections/Comments.ts`
    *   `content`: 纯文本域 (Textarea)，保持极简。
    *   `doc`: Polymorphic Relationship (多态关联)，允许评论挂载到 `posts` 或 `projects`。
    *   `parent`: Self-relationship，指向父评论 ID，实现线程化。
    *   `author`: 混合模式。关联 `users` 集合（针对已登录用户）或存储 `guestName/email`（针对游客）。
    *   `status`: 状态管理 ('published', 'draft', 'pending')，默认 'published' 或需审核。

#### B. 前端组件 (src/components/comments/)
*   `CommentsSection.tsx`: 容器组件，负责获取初始数据和布局。
*   `CommentList.tsx`: 递归或扁平化渲染评论树，处理缩进逻辑。
*   `CommentItem.tsx`: 单个评论视图，实现“平面化”视觉和“折叠/展开”交互。
*   `CommentForm.tsx`: 极简输入框，支持顶层评论和回复。

#### C. 页面集成
*   修改 `src/app/(frontend)/blog/[slug]/page.tsx` 和 `src/app/(frontend)/projects/[slug]/page.tsx` 引入评论区。

### 3. 实施步骤 (Implementation Steps)

1.  **创建后端 Schema**
    *   定义 `Comments` Collection 配置 (Fields: content, author (relation/text), relationTo (post/project), parent, status)。
    *   更新 `payload.config.ts` 注册新集合。
2.  **生成类型**
    *   无需手动操作，Payload 会在保存时自动更新 `payload-types.ts`。
3.  **开发后端 API / Server Actions**
    *   创建 `src/lib/actions/comments.ts` (或类似工具函数)，包含：
        *   `getComments(docId, collectionSlug)`: 获取并构建评论树。
        *   `createComment(data)`: 处理提交，包含验证。
4.  **开发 UI 组件**
    *   实现 `CommentItems`：应用大间距、浅色调、去除多余装饰。
    *   实现 `CommentList`：处理 `Threaded View` 的缩进逻辑（移动端自动减少缩进宽度）。
    *   实现逻辑：长评论截断（"Show more"）、子线程折叠。
5.  **集成到页面**
    *   在 Blog 和 Project 详情页底部加入 `<CommentsSection />`。
6.  **验证与调整**
    *   测试嵌套回复的视觉表现。
    *   验证移动端适配（触屏展开/折叠）。

### 4. 技术考量
*   **游客评论**: 默认允许游客评论（需输入昵称），以降低参与门槛。
*   **嵌套性能**: 建议在 Server Action 中通过一次查询获取所有相关评论，然后在内存中组装成树状结构，避免 N+1 查询问题。
*   **样式**: 使用 Tailwind CSS 实现动态缩进（例如 `pl-4 md:pl-8`），深层嵌套（如 > 5层）可转为“点击查看上下文”或保持扁平以避免布局崩坏。

### 5. 成功标准
- [ ] 后台可以看到并管理 `Comments` 数据。
- [ ] 文章和项目页显示评论区。
- [ ] 支持回复特定评论，并正确显示层级（线程视图）。
- [ ] 视觉上符合“极简、大间距、纯文本”的要求。
- [ ] 移动端操作流畅，无布局溢出。

请确认是否需要调整**游客评论策略**（是否强制登录），如果无异议，请切换到 **Act Mode** 开始实施。