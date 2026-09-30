# 代码优雅化与结构化优化指导

> 目标：**不改变现有功能**，让代码更易读、职责更清晰、更模块化。
> 本文基于 2026-09 对 `src/`、`scripts/`、`tests/` 的静态检查，是对
> [`readability-refactor-plan.md`](./readability-refactor-plan.md) 的补充：该计划中的
> Dashboard 文章页拆分、Publish 服务拆分已基本落地，本文聚焦**尚未处理的热点**与**跨模块的一致性规则**。
> 判断当前行为时仍以现行代码为准。

---

## 1. 原则（做取舍时回来看这一节）

1. **一次只做一类整理**：拆文件、改命名、改逻辑不混在同一个提交里。
2. **先保行为**：每步都能通过 `bun run lint`、`bun run build`、`bun test`；涉及 Publish 的整理另跑 `bun run publish -- --scope all --dry-run --json`。
3. **按职责拆，不按行数拆**：只有输入/输出清晰时才抽取；不要制造只转发调用的薄封装。
4. **不新增依赖，不改架构边界**：Git 单向内容源、dry-run 只读、Post/Gallery 独立，均不动。
5. **抽取的目的是删除重复或隔离变化点**，不是让文件变短。

---

## 2. 目标分层（现状基本符合，需要防止漂移）

```text
app/ (路由、页面，薄)
  └─ components/ (展示 + 交互编排)
       └─ lib/actions/ (Server Actions：鉴权 + Zod 校验 + 调用 service/repository)
            └─ lib/<domain>/ (领域逻辑、repository、纯函数)
                 └─ db/ (schema、连接)
```

规则：

- `app/` 与 `components/` **不直接访问 `@/db`**（目前只有类型导入，保持）。
- Server Action 只做“鉴权 → 校验 → 委托 → revalidate → 返回结果”，不承载大段查询/业务规则。
- 纯函数（解析、映射、格式化）与副作用（DB、文件、网络）分文件放置，纯函数才易测试。
- 依赖只能自上而下；`lib/` 不得引用 `components/`。

---

## 3. 优先级清单

### P1 —— 高收益、低风险（建议先做）

#### 3.1 合并重复的 `requireAdminSession`

`src/lib/actions/` 中 `dashboard.ts`、`posts-admin.ts`、`gallery-admin.ts`、`deletion-admin.ts`、`sync-admin.ts`
各自定义了一份 `requireAdminSession()`（`sync-admin.ts` 叫 `requireAdmin`），另有多处内联 `auth.api.getSession`。

- 新增 `src/lib/auth/guards.ts`（或 `src/lib/actions/_guards.ts`），导出：
  - `requireSession()`：登录即可；
  - `requireAdminSession()`：要求 `role === 'ADMIN'`。
- 各 action 文件改为导入。**错误信息与抛出方式保持一致**，避免前端提示变化。
- 权限逻辑只有一处，后续调整（如新增 EDITOR 角色）不会遗漏。

#### 3.2 拆分 `lib/actions/dashboard.ts`（390 行，三类职责混合）

当前混合了：管理员重置密码、仪表盘统计（`getDashboardStats`，约 130 行查询）、用户列表/封禁、评论审核。

建议按领域拆：

```text
src/lib/actions/users-admin.ts       # resetUserPasswordByAdmin / getUsersList / toggleUserBan
src/lib/actions/comments-admin.ts    # toggleCommentSpam / deleteComment
src/lib/dashboard/stats.ts           # getDashboardStats 的查询组装（纯查询，无 'use server'）
src/lib/actions/dashboard.ts         # 仅保留 getDashboardStats 的鉴权包装（或直接并入页面调用）
```

要点：`'use server'` 文件只导出 action；查询函数放到无 `'use server'` 的模块，避免被误暴露为可调用端点。

#### 3.3 清理“Sync”遗留命名与类型(delayed)

`README` 已声明旧同步入口删除，但仍存在：

- `src/lib/sync/`（`sync-orchestrator`、`sync-lock`、`sync-repository`、`sync-errors`、`sync-types`）；
- `src/types/sync.ts`、`src/types/post-types.ts` 中的 `SyncRunnerOptions`；
- `lib/actions/sync-admin.ts`、DB 表 `sync-runs` / `sync-logs`。

它们实际被 `publish-workflow`、`post-repository` 使用，说明“运行记录/锁”已成为 Publish 的基础设施。建议：

1. **先不动数据库表名**（需要 migration，风险高）。
2. 代码层先做**别名过渡**：新建 `src/lib/publish/run/`（或 `lib/publish-run/`），用 `export { ... as ... }` 引入新名称（如 `PublishRun*`），调用方逐步迁移。
3. 全部迁完后再决定是否用 migration 改表名；不改也可，但在 schema 文件顶部加注释说明历史命名。
4. `Role` 类型目前定义在 `types/sync.ts`，与同步无关，应移到 `types/user/`。

#### 3.4 整理 `types/` 的入口(almost done)

现状存在三种风格并存：`types/content/*`（按领域目录）、`types/post-types.ts`、`types/publish-types.ts`（顶层散文件）、`types/sync.ts`。

- 统一为“目录 + `index.ts`”：`types/publish/`（已有 `publish.ts`，把 `publish-types.ts` 的内容并入）、`types/post/` 或并入 `types/content/`。
- `MarkdownFrontmatter`、`ProcessedPost` 更接近发布内部类型，应放在 `lib/content/` 或 `lib/publish/` 旁边，而不是全局 `types/`。
- 判断标准：**只被单个领域使用的类型，与该领域代码放在一起**；跨领域共享的才进 `types/`。

### P2 —— 结构性整理（逐个文件推进）

#### 3.5 超大客户端组件/页面

| 文件 | 行数 | 现象 | 建议 |
|---|---|---|---|
| `components/auth/AuthModal.tsx` | 640 | 登录/注册/表单状态、校验、UI 同文件 | 拆 `LoginForm`、`RegisterForm`、共享字段组件；表单逻辑用 `react-hook-form` + zod schema（项目已依赖） |
| `app/dashboard/users/page.tsx` | 537 | **页面路由文件是 `'use client'`**，含表格、弹窗、8 个 state | 参照 `dashboard/posts` 的做法：路由保持 Server 入口，抽出 `components/dashboard/users/UsersClient.tsx`、`UsersTable`、`ResetPasswordDialog` |
| `components/dashboard/settings/AboutSettings.tsx` | 544 | 多个子区块（时间线/技能/项目）堆在一起 | 每个区块一个组件 + 共享的“可增删列表”组件 |
| `components/post/PostClient.tsx` | 476 | 阅读进度、TOC、代码复制、渲染混合 | 抽 hooks：`useReadingProgress`、`useTableOfContents`；代码块复制单独组件 |
| `components/UserPortalClient.tsx` | 450 | 多个 tab 内容混合 | 按 tab 拆组件，父组件只管切换 |
| `app/dashboard/page.tsx` | 378 | 统计卡片、表格重复 JSX | 抽 `StatCard`、`RecentList` 等展示组件 |

拆分时的通用规则：

- 子组件只通过 props 接收数据与回调，**不自行加载数据**。
- hook 只在逻辑被至少两处使用、或明显能命名一个概念时提取（如 `useReadingProgress`）。
- 不为一次性小片段创建文件。

#### 3.6 `lib/` 根目录的“杂物间”

根目录散落：`post-providers.ts`（347 行，含首页/热门/置顶多种查询）、`content-queries.ts`（React Query 选项）、`utils.ts`（cn / 日期 / 阅读时间 / 颜色转换混合）、`store.ts`、`theme.ts`、`seo.ts` 等。

- `post-providers.ts` → `lib/posts/`：`post-queries.ts`（列表/详情/slug）、`home-queries.ts`（热门、置顶、首页聚合）。命名上 `providers` 易与 React Provider 混淆，改为 `queries` 更准确（`lib/gallery/` 已采用此命名，保持一致）。
- `content-queries.ts` 是客户端 query options，与服务端查询同名易混，可改名 `lib/query/content-query-options.ts`。
- `utils.ts` → 保留 `cn`；`formatPublishedDate`、`calculateReadingTime` 移至 `lib/posts/format.ts`；`convertToTailwindColor` 移至 `lib/theme.ts`。
- 每次移动后用 re-export 保留旧路径一个阶段，全仓库替换完再删除。

#### 3.7 统一 Action 返回形态与错误处理

- 现在 action 有的 `throw`、有的返回 `{ success, error }`。为每类调用约定一种：**面向表单/按钮的 action 返回结构化结果，内部 service 抛异常**，并在 action 边界统一转换（可复用现有 `zodError.ts`）。
- 抽一个小的 `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`，新写/重构的 action 使用；旧的按文件逐步迁移，不做一次性大改。

### P3 —— 锦上添花

- **日志**：`src/lib/logger.ts` 已存在，统一使用；检查是否残留 `console.*`。
- **常量**：魔法字符串（状态、角色、路径）集中到 `src/constants/`，已有基础，按需补充。
- **UI 层**：`components/ui/` 是 shadcn 式基础组件，**不要重构**；自定义效果放 `ui/effects/`，如仅单页使用可迁到对应功能目录。
- **注释**：保留“为什么”，删除复述代码的注释；对导出的公共函数写一行 JSDoc（输入、输出、副作用）。
- **`scripts/`**：入口文件保持薄，只解析参数并调用 `src/lib` 中的逻辑，`check-content.ts` 等的只读/修复拆分按原计划工作流三推进。
- **`index.ts` 桶文件**：仅在目录对外有稳定 API 时使用，避免循环依赖与不必要的整体打包。

---

## 4. 编码约定（写新代码和重构时的检查项）

**文件/命名**

- 一个文件一个主要概念；文件名与主要导出一致（组件 PascalCase，模块 kebab-case，hook `useXxx`）。
- 函数名用动词：`fetchXxx`（网络/DB 读取）、`buildXxx`/`mapXxx`（纯转换）、`requireXxx`（守卫，失败即抛）。
- 避免 `utils`、`helpers`、`common` 等无语义名称。

**函数**

- 单个函数尽量能一屏读完；超过约 60 行先找“可命名的步骤”。
- 嵌套超过三层时，用提前返回（guard clause）压平。
- 参数超过三个改用对象参数，并给类型命名。

**React 组件**

- Server Component 优先；仅交互部分标 `'use client'`，并尽量下沉到叶子。
- `useState` 超过约 5 个通常说明有可提取的子组件或 hook。
- 展示组件不调用 Server Action；由容器组件传入回调。

**类型**

- 数据库模型 ≠ 公共 DTO ≠ 管理后台模型；跨边界时显式选择字段（沿用评论隐私的处理方式）。
- 不使用 `any`；确需断言时写明原因。当前仅 `input-group.tsx`、`CardTilt.tsx`、`layout.tsx`、`GalleryImageComments.tsx` 有少量 `any`/ignore 标记，可顺手清理。

**导入**

- 使用 `@/...`；同目录内可用相对路径。按 Biome 规则排序，不手动调整。

---

## 5. 推荐执行顺序

| 步骤 | 内容 | 预估风险 |
|---|---|---|
| 1 | 3.1 合并 `requireAdminSession` | 低 |
| 2 | 3.2 拆分 `dashboard.ts` | 低 |
| 3 | 3.4 整理 `types/`（先移动，保留 re-export） | 低 |
| 4 | 3.5 `dashboard/users` 页面拆分 | 中 |
| 5 | 3.6 `lib/` 根目录整理 | 中（大量 import 变更） |
| 6 | 3.5 `AuthModal`、`PostClient` 等拆分 | 中 |
| 7 | 3.3 Sync → Publish Run 命名迁移（代码层） | 中 |
| 8 | 3.7 Action 返回形态统一（渐进） | 中 |

每步一个独立提交，提交信息示例：`refactor(actions): extract shared admin guard`。

---

## 6. 每步的验收清单

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun test
bun run build
```

涉及 Publish / 内容 / 运行记录（3.3）时追加：

```bash
bun run content:check -- --no-examples
bun run content:verify
bun run publish -- --scope all --dry-run --json
```

同时确认：

- 页面路由、权限行为、错误提示文案未变化；
- 没有引入新的循环依赖（`lib/` → `components/`、领域之间互相引用）；
- 旧路径 re-export 已在迁移完成后清理；
- 若脚本入口或目录约定变化，同步检查根 `README.md` 与 `scripts/README.md`；修改 `AGENTS.md` 前先确认。

---

## 7. 不建议现在做的事

- 不引入状态管理/表单/目录结构类的新框架或大重构（如整体迁移到 feature 目录）。
- 不重命名数据库表、不修改 migration 基线，除非单独立项。
- 不把 Post 与 Gallery 合并为通用发布“大服务”。
- 不对 `components/ui/` 的第三方风格组件做风格统一。
- 不为了覆盖率给纯 UI 拆分补大量快照测试；优先给**抽出的纯函数**和**权限/边界**补测试。
