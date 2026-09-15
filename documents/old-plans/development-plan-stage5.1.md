# Stage 5.1 开发计划：账户隐私、稳定头像与评论体验优化

> 制定依据：
>
> - `documents/stage5-summary.md`
> - `documents/thoughts.md`
> - 当前项目实际代码结构
>
> 建议阶段名称：**Stage 5.1：账户隐私、稳定头像与评论体验优化**  
> 建议优先级：**先安全与数据稳定，再交互和视觉优化**  
> 与 Stage 6 的关系：**独立实施，不涉及 Gallery/Photo Album 内容体系。**

---

## 一、阶段背景

Stage 5 已完成：

- Post Frontmatter 扩展；
- 外链展示；
- Dashboard 封面管理；
- 本地与数据库双向同步；
- 中文 slug 冲突保护；
- Drizzle baseline 整理。

Stage 5 的主要遗留问题集中在用户系统和评论体验：

1. 评论区暴露完整邮箱；
2. 用户头像可能在访问或登录时被重复生成；
3. Dicebear/Gravatar 头像缺少明确、稳定的来源管理；
4. 用户可以保存任意外链头像，存在第三方请求、追踪、内容替换和安全风险；
5. 评论作者信息与用户个人设置入口之间存在体验冲突；
6. Dashboard 顶部缺少快速返回博客的入口；
7. 文章标签过滤器中的“全部文章”与清除标签功能重复。

因此，Stage 5.1 不再扩展内容同步，而是专注于：

> **降低用户隐私暴露、稳定头像数据来源、增强评论区身份展示，并完成若干导航和过滤器细节优化。**

---

# 二、阶段目标

## 2.1 主要目标

### 目标一：保护评论用户邮箱隐私

评论区不得向前端返回或显示用户完整邮箱。

评论作者展示为：

```text
头像 + 用户名
```

如果没有用户名，则使用：

```text
邮箱 @ 之前的部分
```

例如：

```text
alice@example.com
```

展示为：

```text
alice
```

完整邮箱仍然只保留在数据库和服务端必要逻辑中，不进入公开评论响应。

---

### 目标二：使头像生成稳定且可控

头像生成应该遵循以下规则：

1. 用户注册时生成一次默认 Dicebear 头像；
2. 后续访问用户页面、登录、刷新页面时，不重新生成；
3. 用户只有主动点击头像切换操作时，才更新头像；
4. 用户当前选择的头像 URL 保存在 `user.image`；
5. 如果 `user.image` 已存在，系统不得自动覆盖；
6. 头像切换失败时，不应破坏原头像。

---

### 目标三：彻底禁用任意外链头像

移除或禁用“自定义外链头像”能力。

不允许用户直接提交：

```text
https://example.com/avatar.png
```

作为头像地址。

原因包括：

- 前端访问时可能向第三方服务器泄露用户访问信息；
- 第三方图片可以随时被替换；
- 图片地址可能携带追踪参数；
- 可能返回非图片内容；
- 图片服务不可控，存在隐私和内容安全风险；
- Next.js Image 或浏览器加载时可能引入额外域名配置问题。

Stage 5.1 只保留：

- Dicebear 生成头像；
- Gravatar 头像；
- 必要时保留站内托管头像，但不开放任意远程 URL。

---

### 目标四：优化评论区身份展示

评论区应展示：

- 稳定头像；
- 脱敏后的显示名称；
- 评论内容；
- 相对时间；
- 回复和管理操作。

建议的视觉方案：

```text
┌──────────────────────────────────┐
│ 头像       用户名 · 3 分钟前       │
│                                  │
│  评论内容                         │
│                                  │
└──────────────────────────────────┘
```

针对较大的头像背景效果，可以采用渐隐装饰，而不是直接将头像作为完整背景图，以避免：

- 文字可读性下降；
- 深色头像影响评论内容；
- 大量评论时页面视觉噪音过高；
- 编辑状态受到背景图片干扰。

如果最终采用背景头像，应满足：

- `opacity` 较低；
- 增加渐变遮罩；
- 编辑状态隐藏背景；
- 不影响键盘焦点和文字对比度；
- `aria-hidden="true"`；
- 不使用用户邮箱作为图片 URL 生成条件。

---

### 目标五：优化评论区用户入口

当前评论区登录用户点击自己的名字会打开 Profile 编辑弹窗，导致评论区继续承担密码修改入口。

建议调整为：

- 点击用户名：进入 `/user`；
- 用户设置和密码修改只在用户中心完成；
- 评论区只显示用户信息和登出操作；
- 不再从评论区直接打开带密码修改功能的 Profile Modal。

如果仍需保留快捷入口，可以改为：

```text
查看个人中心
```

而不是：

```text
修改个人资料 / 修改密码
```

---

### 目标六：优化 Dashboard 导航

Dashboard 当前顶部主要提供退出登录，但缺少最重要的“返回博客”入口。

应增加明显的：

```text
返回博客
```

入口，指向：

```text
/
```

建议位置：

- Dashboard 顶部主导航；
- 位于 Logo 或管理控制台标题附近；
- 移动端保留图标和 Tooltip；
- 桌面端显示文字。

退出登录继续保留，但不应成为顶部最主要的视觉操作。

---

### 目标七：简化文章标签过滤器

当前“全部”按钮与以下功能重复：

- 点击当前标签的关闭按钮；
- 点击“清除筛选”；
- 删除 URL 中的 `tag` 参数；
- 空状态下“返回查看全部”。

建议：

1. 删除过滤器左侧的“全部”按钮；
2. 默认没有 `tag` 参数时表示全部文章；
3. 当前有标签时，只显示当前标签和关闭按钮；
4. 过滤器入口放置在最左侧；
5. 保留 Popover 中的标签列表，但删除其中的“全部文章”选项；
6. 保留当前标签的 `X` 清除按钮；
7. 空状态仍可保留“返回查看全部”，但可以考虑复用清除筛选行为。

新的布局建议：

```text
[过滤标签 4]                         [当前标签 ×]
```

默认状态：

```text
[过滤标签 4]
```

---

# 三、现状与关键问题分析

## 3.1 头像相关现状

当前用户表已有：

```ts
user.image
```

位于：

```text
src/db/schema/auth.ts
```

因此第一版不需要新增头像字段或数据库迁移。

当前头像逻辑主要位于：

```text
src/lib/generate-avatar.ts
src/lib/get-avatar.ts
src/lib/actions/profile.ts
src/lib/actions/user-portal.ts
src/components/auth/AuthModal.tsx
src/app/user/UserPortalClient.tsx
```

当前存在的问题：

- `updateAvatar()` 同时处理 Gravatar 和 Dicebear；
- Dicebear 使用用户名作为 seed，虽然相同 seed 本身是稳定的，但如果被重复写入仍然会造成头像来源和状态混乱；
- 登录流程中存在头像同步逻辑，需要移除自动更新；
- 用户中心支持自定义头像 URL；
- Gravatar Profile 查询依赖 `GRAVATAR_API_KEY`，不应该把第三方 Profile API 作为普通头像展示的必要条件。

---

## 3.2 评论隐私现状

当前评论查询在：

```text
src/lib/actions/comments.ts
```

目前 `getComments()` 返回：

```ts
author: {
  id,
  name,
  email,
  image,
  banned
}
```

这意味着完整邮箱会被发送到浏览器。

类型定义也包含完整邮箱：

```text
src/types/index.ts
```

当前评论项主要位于：

```text
src/components/comments/CommentItem.tsx
src/components/comments/CommentList.tsx
src/components/comments/CommentsSection.tsx
```

需要注意：

> 仅仅在 `CommentItem` 中不渲染邮箱是不够的。  
> 必须在 Server Action 返回数据之前移除完整邮箱，避免邮箱通过网络响应泄露。

---

## 3.3 评论作者关系查询

当前评论查询使用：

```ts
with: {
  author: true,
}
```

因此会加载完整用户对象。

Stage 5.1 应改为显式选择公开字段：

```ts
author: {
  columns: {
    id: true,
    name: true,
    image: true,
    banned: true,
  },
}
```

不要继续把 `email` 放到公开评论 DTO 中。

---

# 四、任务拆解

## Step 1：建立公开用户信息 DTO

### 目标

将内部 User 类型与公开评论作者类型分离，避免误把数据库用户对象直接传给前端。

### 建议新增

```text
src/types/public-user.ts
```

或者放入现有：

```text
src/types/content.ts
```

建议定义：

```ts
export interface PublicCommentAuthor {
  id: string
  displayName: string
  image: string | null
  banned: boolean
}
```

同时修改：

```text
src/types/index.ts
```

将 `CommentWithReplies.author` 从：

```ts
{
  id: string
  name: string
  email: string
  image: string | null
  banned: boolean
}
```

改为：

```ts
{
  id: string
  displayName: string
  image: string | null
  banned: boolean
}
```

### 显示名称规则

建议新增工具：

```text
src/lib/public-user.ts
```

提供：

```ts
getPublicUserName({
  name,
  email,
}: {
  name?: string | null
  email?: string | null
}): string
```

规则：

1. 有效用户名优先；
2. 用户名为空时使用邮箱 `@` 前的部分；
3. 邮箱为空时使用 `Anonymous`；
4. 不返回原始邮箱；
5. 对过长名称进行长度限制；
6. 必要时对控制字符进行清理。

示例：

```text
name: "Alice"
email: "alice@example.com"
=> Alice
```

```text
name: ""
email: "alice@example.com"
=> alice
```

---

## Step 2：移除评论 API 中的完整邮箱

### 目标文件

```text
src/lib/actions/comments.ts
```

### 修改内容

将：

```ts
with: {
  author: true,
}
```

改为显式字段查询，仅返回：

- `id`
- `name`
- `image`
- `banned`

邮箱只用于服务端生成 `displayName`，生成后立即丢弃。

最终评论响应中不得出现：

```ts
author.email
```

也不应出现其他可能暴露邮箱的字段。

### 需要同步检查

搜索并确认以下位置不再依赖评论作者邮箱：

```text
src/components/comments/*
src/lib/hooks/useContent.ts
src/types/index.ts
src/app/user/UserPortalClient.tsx
```

注意：

- 用户中心的私有页面可以继续显示当前用户自己的邮箱；
- 评论公开数据不得显示作者完整邮箱；
- Dashboard 管理员用户列表是否显示完整邮箱，应作为后台权限范围单独处理，不与公开评论 DTO 混用。

---

## Step 3：评论区接入头像与脱敏名称

### 目标文件

```text
src/components/comments/CommentItem.tsx
src/components/comments/CommentsSection.tsx
src/components/comments/CommentList.tsx
```

### 评论项改造

`CommentItem` 当前只显示：

```text
authorName
```

应增加：

```tsx
<Avatar>
  <AvatarImage src={comment.author.image ?? undefined} />
  <AvatarFallback>{...}</AvatarFallback>
</Avatar>
```

显示顺序建议：

1. 头像；
2. `displayName`；
3. 发布时间；
4. 折叠/展开控制。

### 头像 fallback

不能使用固定的：

```text
CN
```

建议根据 `displayName` 生成 1～2 个字符：

```text
Alice -> AL
张三 -> 张三
```

可以新增通用工具：

```text
src/lib/avatar.ts
```

提供：

```ts
getAvatarFallback(displayName: string): string
```

### 评论内容背景装饰

建议分两步：

#### 第一版

先实现稳定头像和普通头像展示，不立即加入大面积背景图。

#### 第二版

如果视觉效果验证通过，再增加：

```text
低透明度头像装饰层
```

要求：

- 头像层 `pointer-events-none`；
- `aria-hidden="true"`；
- 编辑状态不显示；
- 使用 `object-cover`；
- 使用渐变 mask；
- 深浅色主题均可读；
- 不改变评论内容实际布局。

这样可以降低一次修改的风险。

---

## Step 4：调整评论区个人入口

### 当前问题

`CommentsSection.tsx` 中：

```ts
const handleEditProfile = () => {
  openAuthModal('profile')
}
```

用户点击评论区头像/用户名时，会打开带有密码修改能力的 Profile Modal。

### 建议调整

评论区用户区域改为：

```tsx
<Link href="/user">
  查看个人中心
</Link>
```

或将头像、用户名作为链接：

```tsx
<Link href="/user">
  <Avatar />
  <span>{user.displayName}</span>
</Link>
```

不建议在评论区继续使用：

```ts
openAuthModal('profile')
```

### AuthModal 处理策略

如果 `profile` Tab 仅由评论区触发：

- 可以移除 `profile` Tab；
- 或保留兼容代码，但不再从公开评论区调用；
- 最终用户资料和密码修改统一由 `/user` 页面处理。

建议优先采用：

> 保留 AuthModal 内部兼容能力，先移除评论区调用，待全站确认无引用后再删除 `profile` Tab。

---

## Step 5：头像稳定化

## 5.1 注册时生成默认头像

注册流程建议改为：

1. 创建用户；
2. 生成稳定 Dicebear 头像；
3. 写入 `user.image`；
4. 后续登录不再自动调用头像同步逻辑。

头像 seed 建议使用稳定值：

优先级：

```text
user.id
```

或者注册时生成的稳定随机 seed。

不建议只使用用户名作为长期身份 seed，因为用户名可能被修改。

如果 Better Auth 的注册流程无法直接拿到用户 ID，可以：

- 注册成功后只执行一次初始化头像；
- 初始化 Action 内先查询用户；
- 只有 `image IS NULL` 时才写入；
- 如果已有头像，直接返回，不覆盖。

核心原则：

```ts
if (user.image) {
  return
}
```

---

## 5.2 移除登录时头像自动同步

需要检查：

```text
src/components/auth/AuthModal.tsx
```

当前登录流程中已经存在头像同步相关逻辑，需要移除类似：

```ts
await updateAvatar()
```

或者登录成功后自动调用 Gravatar/Dicebear 的逻辑。

登录只负责：

- 校验账号；
- 创建 Session；
- 刷新用户状态。

登录不应该改变：

- 用户头像；
- 用户名；
- 其他用户资料。

---

## 5.3 保留主动切换头像

用户中心保留两个主动操作：

```text
重新生成 Dicebear 头像
使用 Gravatar 头像
```

但行为必须明确：

### Dicebear

- 点击后生成新的 seed；
- 将生成结果保存至 `user.image`；
- 不在页面渲染时生成；
- 不在登录时生成；
- 不在访问 `/user` 时生成。

### Gravatar

推荐使用稳定头像 URL：

```text
https://www.gravatar.com/avatar/{hash}?s=256&d=identicon
```

需要根据 Gravatar 当前规范确认 hash 算法和默认参数。

不建议为了获取普通头像而依赖：

```text
GRAVATAR_API_KEY
```

原因：

- Profile API 与头像图片 URL 是两个不同能力；
- 普通头像显示不应因为 API Key 不存在而失败；
- 减少第三方 API 调用；
- 降低登录和头像切换的复杂度。

`getGravatarProfile()` 可以保留用于未来“打开 Gravatar 个人资料”的功能，但不应作为头像更新的必需步骤。

---

## Step 6：移除自定义外链头像

### 目标文件

```text
src/app/user/UserPortalClient.tsx
src/lib/actions/user-portal.ts
src/lib/actions/profile.ts
```

### 前端

删除：

- 自定义头像 URL 输入框；
- “应用”按钮；
- `customAvatarUrl` 状态；
- `handleAvatarSwitch('custom', ...)` 分支；
- 相关提示文案。

### Server Action

在服务端禁止：

```ts
type === 'custom'
```

即使旧客户端仍然提交请求，也必须返回错误：

```text
不支持自定义外链头像
```

不能只删除前端控件而不处理 Server Action。

### 数据清理

现有数据库中可能已经存在第三方外链头像。

建议分两个层次处理：

#### 第一阶段

读取时识别并标记非受支持头像，但不立即破坏已有用户头像。

#### 第二阶段

提供一次性迁移或后台清理：

- 将不受支持的外链头像替换为 Dicebear；
- 或将其设置为 `NULL`，由 fallback 展示；
- 不直接请求或下载外部图片；
- 不自动把外链图片转存到本站。

推荐默认策略：

```text
外链头像 -> 清空 image -> 生成稳定 Dicebear
```

清理前应先备份受影响用户 ID 和原始 URL，不能把 URL 输出到普通日志。

---

## Step 7：提供 Gravatar 生成方法和链接

### 目标

在用户中心头像面板中增加说明：

```text
Gravatar 使用邮箱生成全球头像。
如果你还没有 Gravatar 头像，可以前往 Gravatar 创建或管理头像。
```

提供链接：

```text
https://gravatar.com/
```

链接要求：

```html
target="_blank"
rel="noopener noreferrer"
```

### 页面内容建议

```text
Gravatar 会根据你的邮箱地址匹配头像。
点击“同步 Gravatar”后，系统只保存头像地址，不会保存 Gravatar 密码。
```

需要明确告知：

- Gravatar 与用户邮箱存在关联；
- 用户可以自行选择 Dicebear；
- 不强制用户使用 Gravatar；
- 不在公开页面显示完整邮箱。

### 隐私注意

如果前端直接加载 Gravatar 图片，浏览器仍会向 Gravatar 请求资源。

因此可以在 UI 中明确区分：

- Dicebear：默认、低第三方依赖；
- Gravatar：用户主动选择后使用。

如果未来对隐私要求进一步提高，可以考虑将 Gravatar 图片下载并存储到 Cloudinary，但这不建议放入 Stage 5.1，避免引入图片代理和版权处理复杂度。

---

## Step 8：Dashboard 增加返回博客入口

### 目标文件

```text
src/components/dashboard/DashboardNavHeader.tsx
```

当前已有：

```ts
Link href="/dashboard"
```

建议增加：

```tsx
<Link href="/" ...>
  <ArrowLeft />
  <span>返回博客</span>
</Link>
```

或者使用：

```text
ExternalLink
```

图标。

### 交互要求

- 使用 Next.js `Link`；
- 不使用 `window.location`；
- 桌面端显示“返回博客”；
- 移动端至少显示图标；
- 具有 Tooltip 或 `aria-label`；
- 不替换退出登录功能；
- 返回博客不应触发登出。

### 导航布局建议

```text
[Logo 管理控制台] [返回博客]                  [用户信息] [退出]
```

移动端：

```text
[Logo] [返回]                                  [用户] [退出]
```

---

## Step 9：移除标签过滤器中的“全部文章”按钮

### 目标文件

```text
src/components/PostGridClient.tsx
src/components/PostTagFilter.tsx
```

### 逻辑调整

当前使用：

```ts
const activeTag = urlTag || 'All'
```

建议改为：

```ts
const activeTag = urlTag
```

过滤逻辑：

```ts
if (!activeTag) return posts
```

### 删除内容

`PostTagFilter.tsx` 中删除：

- 左侧“全部”按钮；
- Popover 内“全部文章”选项；
- 与“全部”按钮相关的 `LayoutGrid`；
- `totalPostsCount` 如果不再使用；
- `activeTag === 'All'` 相关判断。

### 保留内容

- 当前标签显示；
- 当前标签关闭按钮；
- Popover 过滤入口；
- 搜索标签；
- 标签文章数量；
- 清除筛选；
- 空状态返回全部文章。

### 类型建议

将：

```ts
activeTag: string
```

改为：

```ts
activeTag?: string
```

或：

```ts
activeTag: string | null
```

以准确表达“没有筛选条件”的状态。

---

# 五、推荐开发顺序

## Phase 1：隐私与数据边界

优先级：P0

任务：

1. 创建公开评论作者类型；
2. 修改 `getComments()`；
3. 不再返回完整邮箱；
4. 修改 `CommentWithReplies` 类型；
5. 增加显示名称生成工具；
6. 增加评论接口安全检查。

验收标准：

- 浏览器 Network 响应中不出现评论作者完整邮箱；
- React Server Component 或 JSON 数据中不包含 `author.email`；
- 未登录用户也无法通过评论接口获取邮箱；
- 评论作者仍可以正常显示。

---

## Phase 2：头像稳定性和安全控制

优先级：P0/P1

任务：

1. 移除登录时自动头像更新；
2. 头像初始化改为只在 `image` 为空时执行；
3. Dicebear 使用稳定 seed；
4. 用户主动切换时才更新头像；
5. 删除自定义外链头像 UI；
6. Server Action 拒绝 custom avatar；
7. 检查已有外链头像数据。

验收标准：

- 连续刷新用户页面，头像 URL 不变；
- 登录前后头像 URL 不变；
- 用户名变更不会自动改变已保存头像；
- 点击 Dicebear 后头像才变化；
- custom avatar 请求被服务端拒绝；
- 不再发起不必要的 Gravatar Profile API 请求。

---

## Phase 3：评论体验

优先级：P1

任务：

1. 评论显示稳定头像；
2. 增加头像 fallback；
3. 使用脱敏显示名称；
4. 用户头像/名称进入 `/user`；
5. 评论区不再直接打开密码修改弹窗；
6. 评估评论头像背景装饰。

验收标准：

- 评论区显示头像和公开名称；
- 用户名为空时显示邮箱前缀；
- 完整邮箱不出现在页面或网络响应；
- 点击评论区自己的头像或名字进入 `/user`；
- 评论编辑区域不受背景头像干扰；
- 深色和浅色主题下文字对比度正常。

---

## Phase 4：导航和过滤器优化

优先级：P2

任务：

1. Dashboard 增加“返回博客”；
2. 删除文章过滤器“全部”按钮；
3. 删除 Popover 中“全部文章”选项；
4. 用清除 `tag` 参数表达全部文章状态；
5. 检查空状态、浏览器前进后退和直接访问 URL。

验收标准：

- Dashboard 顶部可以一键返回 `/`；
- 过滤器入口位于左侧；
- 默认状态不显示冗余“全部文章”；
- 当前标签可以通过 `X` 清除；
- `/posts?tag=xxx` 和 `/posts` 行为正确；
- 浏览器前进/后退状态同步正常。

---

## Phase 5：Gravatar 指引和数据清理

优先级：P1/P2

任务：

1. 提供 Gravatar 创建/管理链接；
2. 将 Gravatar 头像生成与 Profile API 解耦；
3. 检查现有外链头像；
4. 设计旧数据清理脚本；
5. 记录清理结果，不记录敏感 URL。

建议新增脚本：

```text
scripts/cleanup-user-avatars.ts
```

建议命令：

```bash
bun run scripts/cleanup-user-avatars.ts --dry-run
bun run scripts/cleanup-user-avatars.ts
```

清理脚本必须：

- 默认 dry-run；
- 仅处理明确属于 custom 外链的记录；
- 不下载外部图片；
- 输出数量而不是输出完整头像 URL；
- 支持回滚前备份。

---

# 六、建议涉及文件

## 主要修改文件

```text
src/lib/actions/comments.ts
src/lib/actions/profile.ts
src/lib/actions/user-portal.ts
src/components/comments/CommentItem.tsx
src/components/comments/CommentList.tsx
src/components/comments/CommentsSection.tsx
src/components/auth/AuthModal.tsx
src/app/user/UserPortalClient.tsx
src/components/dashboard/DashboardNavHeader.tsx
src/components/PostGridClient.tsx
src/components/PostTagFilter.tsx
src/types/index.ts
```

## 建议新增文件

```text
src/lib/public-user.ts
src/lib/avatar.ts
src/types/public-user.ts
scripts/cleanup-user-avatars.ts
```

## 可能需要更新的文档

```text
documents/thoughts.md
documents/development-plan-stage5.md
documents/stage5-summary.md
```

建议不要修改 Stage 5 总结中的历史交付内容，而是在完成后新增：

```text
documents/stage5.1-summary.md
```

---

# 七、数据库迁移判断

## 默认方案：不新增数据库字段

现有：

```text
user.image
```

已经能够保存当前头像 URL，因此 Stage 5.1 第一版不建议新增：

- `avatarType`
- `avatarSeed`
- `avatarUpdatedAt`
- `avatarSource`

这样可以避免不必要的迁移和 Better Auth 用户表适配风险。

---

## 何时需要增加字段

如果后续需要精确区分头像来源，再考虑增加：

```text
avatarType: 'DICEBEAR' | 'GRAVATAR' | 'LOCAL'
avatarSeed: string | null
```

但这不是 Stage 5.1 的必需项。

当前可以通过 URL 或服务端操作类型推断来源，但不建议在前端依赖 URL 字符串判断业务状态。

---

# 八、安全要求

## 评论数据

- Server Action 不返回完整邮箱；
- 不在公开 DTO 中保留 email；
- 不通过前端隐藏方式处理隐私；
- 不把完整邮箱放入 `data-*` 属性；
- 不把完整邮箱用于评论作者头像 fallback；
- 管理员功能和公开评论接口使用不同 DTO。

## 头像 URL

- 禁止用户提交任意 URL；
- 禁止仅依赖前端校验；
- Server Action 必须再次校验；
- 不允许 `javascript:`、`data:` 或任意外部协议；
- 不自动抓取第三方图片；
- Gravatar 只能通过固定生成逻辑生成；
- Dicebear 只能通过内部生成函数生成。

## Gravatar

- 不在公开页面显示邮箱；
- 不把 Gravatar Profile API 作为头像显示前置条件；
- 个人中心明确说明 Gravatar 与邮箱的关联；
- 外链使用 `noopener noreferrer`；
- 用户可以随时切换回 Dicebear。

---

# 九、测试计划

## 9.1 单元测试

如果项目当前还没有测试框架，建议 Stage 5.1 第一版至少抽取可测试的纯函数：

```text
getPublicUserName()
getAvatarFallback()
createStableDicebearAvatar()
isSupportedAvatarUrl()
```

重点测试：

- 用户名优先；
- 邮箱前缀 fallback；
- 没有邮箱时使用 Anonymous；
- 中文用户名；
- 特殊字符；
- 空字符串；
- 外链头像被拒绝；
- Dicebear seed 稳定。

---

## 9.2 手工验收

### 评论隐私

- 注册两个测试用户；
- 使用用户 A 发表评论；
- 使用浏览器 Network 查看评论响应；
- 确认响应中没有用户 A 完整邮箱；
- 检查页面源码和 DOM 属性；
- 检查未登录访问。

### 头像稳定性

- 注册新用户；
- 确认首次有头像；
- 刷新 `/user` 多次；
- 注销并重新登录；
- 确认头像地址不变；
- 修改用户名；
- 确认头像不变；
- 手动点击 Dicebear；
- 确认头像只在操作后变化。

### 外链头像

- 尝试提交外部头像 URL；
- 确认 UI 已无输入框；
- 使用旧客户端请求 Server Action；
- 确认服务端拒绝；
- 检查页面是否向任意头像域名发起请求。

### Dashboard

- 登录管理员；
- 检查“返回博客”入口；
- 点击后回到 `/`；
- 确认不会退出登录。

### 标签过滤器

- 访问 `/posts`；
- 确认默认显示全部文章；
- 选择某个标签；
- 确认 URL 出现 `tag`；
- 点击 `X`；
- 确认恢复 `/posts`；
- 使用浏览器后退/前进；
- 确认筛选状态同步。

---

# 十、Stage 5.1 验收标准

## 必须完成

- [ ] 评论公开数据不包含完整邮箱；
- [ ] 评论区显示头像和脱敏用户名；
- [ ] 头像不会在登录、刷新、访问页面时自动变化；
- [ ] Dicebear 只在用户主动操作时重新生成；
- [ ] 自定义外链头像 UI 已删除；
- [ ] 服务端拒绝自定义外链头像请求；
- [ ] Gravatar 创建/管理链接已提供；
- [ ] 评论区点击用户信息进入 `/user`；
- [ ] Dashboard 增加返回博客入口；
- [ ] 文章过滤器移除冗余“全部文章”按钮；
- [ ] Light/Dark 模式下评论文字均可读；
- [ ] 没有新增不必要的数据库字段或迁移。

## 质量验证

完成后运行：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
bun run db:migrate
```

如果新增测试脚本，再执行项目实际使用的测试命令。

---

# 十一、阶段边界

Stage 5.1 不包含：

1. Gallery/Photo Album；
2. 评论点赞系统；
3. 评论通知邮件；
4. 新的第三方头像服务；
5. 头像上传和图片裁剪；
6. 评论全文搜索；
7. slug 历史表和旧 URL 重定向；
8. 完整正文 hash 双向同步；
9. Dashboard 评论管理重构。

这些内容应继续分别归入：

- Gallery：Stage 6；
- 评论通知和更复杂社交能力：后续 User/Community 阶段；
- 内容同步增强：Stage 5.x 或单独的 Sync Enhancement 阶段。

---

# 十二、推荐最终交付物

Stage 5.1 完成后建议新增：

```text
documents/stage5.1-summary.md
```

内容包括：

1. 评论邮箱隐私处理；
2. 头像稳定化策略；
3. 自定义外链头像禁用；
4. Gravatar 使用说明；
5. 评论区视觉调整；
6. Dashboard 返回博客；
7. 标签过滤器简化；
8. 是否产生数据库迁移；
9. 验证命令和结果；
10. 遗留问题。

整体上，Stage 5.1 应优先完成 **邮箱脱敏、头像稳定化和外链头像禁用**，这三项属于安全与数据一致性问题；评论背景头像、过滤器视觉细节则可以在核心逻辑稳定后再完成。