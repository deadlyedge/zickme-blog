# ADR:本地内容工作台与站点设置入 Git(阶段 0 结论)

> 状态:阶段 0 已完成;决策 3、4、5 已确认,独立前置改动已完成;阶段 1 尚未开始实现
> 日期:2026-10-02
> 依据:[`../development-plan-local-content-workbench.md`](../development-plan-local-content-workbench.md)
> 验证方式:阶段 0 的临时探测已删除;本次增加 Cloudinary 站点头像命名/引用测试并运行项目验证。仓库内没有迁入头像图片,需在站点设置迁移时人工准备 `content/site/portrait.webp`。
> 说明:"已验证"表示实际运行过;"建议"表示设计决定,尚未实现。

---

## 1. 决策摘要

| 议题 | 结论 |
|---|---|
| 工作台形态 | 独立 Bun 进程 + `Bun.serve` 的 HTML 导入,可行。已验证 loopback 绑定、Host/Origin/令牌校验、React + `@/` 别名 + Tailwind 打包 |
| 复用 `src/lib` | Publish 主链路没有 Next 依赖,可直接复用。`lib/actions/*` 和 `lib/auth/guards.ts` 不能调用 |
| 构建隔离 | `workbench/` 存在时 `next build` 与 `tsc` 通过;Next 只打包 `src/app` 引用图,工作台不会进入产物(阶段 2 用测试固化) |
| 轮询可行性 | 可行,但 `runId` 要等运行结束才返回(见 3.2) |
| 站点设置 | 阶段 0 原型的 7 个 YAML Zod 草案已用**真实数据库行**验证通过；阶段 1 实施时按手动编辑上下文聚合为 3 个 YAML(见 4.1),并处理 6 个必须项(见 4.3) |
| 阶段 1 最大风险 | `pinnedPostIds` 是随机 UUID,`db:reset` 后失效,会直接违反验收标准 1 |

---

## 2. 工作台运行形态

### 2.1 已验证

用 `Bun.serve({ hostname: '127.0.0.1', port: 0, routes: { '/': htmlImport } })` 做了探测:

| 检查 | 结果 |
|---|---|
| 绑定地址 | `127.0.0.1` |
| 无令牌访问 API | 401 |
| 正确令牌 | 200 |
| 错误 `Origin` / 伪造 `Host`(模拟 DNS rebinding) | 均 403 |
| HTML 导入打包 React + `@/components/ui/button` | 成功,JS 约 250 KB,不含 `next/link`、`next/image`、`next/navigation`、`next/headers` |
| `bunx tsc --noEmit`(含 `workbench/*.ts`) | 通过(需要 Bun 类型,见 2.2) |
| `bun run build`(`workbench/` 存在时) | 通过 |
| 构建产物扫描 | `.next` 中没有 `x-workbench-token` / `Bun.serve` 标记(扫描时临时探测目录在仓库内但未被引用) |

### 2.2 阶段 2 需要的配置

1. `package.json` 新增脚本 `"workbench": "bun run workbench/server.ts"`。
2. 新增 devDependencies:`@types/bun`、`bun-plugin-tailwind`。
3. 新增 `bunfig.toml`:
   ```toml
   [serve.static]
   plugins = ["bun-plugin-tailwind"]
   ```
   没有该插件时 Tailwind 指令不会被处理(实测 CSS 约 22 KB 且不含工具类);加上后 `@import "../src/app/globals.css"` 能生成工具类(约 58 KB)。
4. 新增 `workbench/bun-env.d.ts`,内容为 `/// <reference types="bun" />`。
   - 根 `tsconfig.json` 的 `include` 是 `**/*.ts`,`workbench/` 会同时被 `tsc` 和 `next build` 的类型检查覆盖。
   - 不加这一行会报 `Cannot find name 'Bun'` 和 `Cannot find module './index.html'`。
   - 副作用:`Bun` 全局类型对 `src/` 也可见。可接受,用 import 边界测试兜底。
5. 不要把 `"types": ["bun"]` 写进根 tsconfig(会改变整个项目的全局类型)。
6. Biome 已通过 `"**"` 覆盖 `workbench/`;HTML 模板需要写 `lang="zh-CN"` 以通过 `useHtmlLang`。
7. `bun add` 后 Bun 提示若干 postinstall 被阻止(`bun`、`esbuild`)。本次探测未受影响,实现时再确认是否需要加入 `trustedDependencies`。

### 2.3 威胁清单与对策

| 威胁 | 对策 |
|---|---|
| 恶意网页跨站请求本机端口 | 校验 `Origin`;写接口要求自定义请求头并校验 `Host` |
| DNS rebinding | `Host` 白名单(`127.0.0.1:{port}`、`localhost:{port}`),已验证 |
| 令牌泄露 | 启动时随机生成;首次访问换成 `HttpOnly; SameSite=Strict` Cookie 并重定向去掉 URL 中的令牌(建议) |
| 路径穿越 / 符号链接逃逸 | 所有写入经过 `workspace-paths`,用 `realpath` 校验,限定在 `content/` 与 `content/.gallery-input/` |
| 泄露 `.env` 与凭据 | 响应只返回固定 DTO;不提供通用文件读取接口 |
| Shell 注入 | 固定可执行程序 + 参数数组;沿用 `publish-repair.ts` 的参数白名单做法 |
| 重复提交 Publish | 进程内互斥,再叠加数据库 `SyncRun` 锁 |
| 站点 `customCss` 注入 | 见 4.3 第 5 项 |

---

## 3. 复用边界与 Publish 契约

### 3.1 Next 专属 API 盘点

| 位置 | 依赖 | 影响 |
|---|---|---|
| `src/lib/auth/guards.ts` | `next/headers` | 请求作用域外调用会抛错(已验证:`headers was called outside a request scope`) |
| `src/lib/actions/profile.ts` | `next/headers`、`next/cache` | 同上,不得调用 |
| `src/lib/actions/{comments-admin, comments, gallery-image-comments, user-portal, users-admin}.ts` | `revalidatePath` | 请求作用域外调用会抛错(已验证:`static generation store missing`) |
| `src/lib/seo.ts` | `import type { Metadata } from 'next'` | 仅类型,无运行时影响 |
| `src/lib/auth.ts` | `better-auth/next-js` | 可导入,工作台不需要 |
| `src/components/ui/sonner.tsx` | `next-themes` | 工作台避免使用 |
| `src/components/dashboard/settings/SettingsClient.tsx` | `next/navigation`、`updateSiteProfile` | 容器组件需重写,不能直接搬 |

其余结论:

- 在 Bun 里 `import` 了 11 个候选模块(含 `actions/profile`、`auth`、`post-queries`、`publish-workflow`、`sync-repository`、`media/post-media`、`gallery-parser`、`content-safety`、`theme`),全部成功。**能导入不代表能调用**,上表的调用会失败。
- Publish 主链路(`publish-workflow` → `sync-orchestrator` → `post/gallery-publish-service` → repository → `media/*`)没有 `next/*` 引用,可直接复用;现有 CLI 也是 `bun run` + `@/` 别名。
- `src/db` 使用 Neon serverless `Pool` + `DATABASE_URL`;已验证在 Bun 中可读取 `SyncRun`,评论只读查询走同一路径。
- 约束:**工作台只能导入非 `'use server'`、且无 `next/*` 运行时调用的模块**。阶段 2 的边界测试把 `src/lib/actions/*`、`src/lib/auth/guards` 列为禁止导入。

### 3.2 `runPublishWorkflow()` 契约

**输入**:`{ scope, dryRun, deleteOld?, triggeredBy?, actorId? }`。`deleteOld` 被强制为 `false`。

**输出**:`{ kind: 'validation', report } | { kind: 'published', report, summary }`。

**流程**:
1. `validatePublishContent(scope)`:只读文件。
2. 无效 → 返回 `validation`,不写库、不加锁。
3. 有效 → `runPublish` → `runSync`:
   - **dry-run**:不加锁、不建 `SyncRun`、不调用 `finishSyncRun`。
   - **真实运行**:`acquireSyncLock`(先 `expireStaleSyncRuns`,再插入 `status=RUNNING` 的 `SyncRun`,TTL 30 分钟)→ 按域执行 → `finally` 里 `finishSyncRun` 写入状态与 `summary`。
4. 状态:`SUCCEEDED` / `PARTIAL_SUCCESS` / `FAILED`。

**真实 Publish 的副作用**(README 未强调):
- Gallery 真实发布会**重写工作区文件**:写入生成的 WebP(`gallery-publish-service.ts` 第 149 行)和重写 `album.yaml`(第 237 行)。Post 域不写文件。
- 因此工作台在真实 Publish 后必须提示"工作区可能出现 Git 变更"并引导查看 diff,这也使 M5(只读 Git 视图)对发布流程有实际价值。

**轮询可行性**:
- 真实运行开始时 `SyncRun` 已入库(`RUNNING`),结束才写入 `summary`。轮询只能得到"运行中/已结束",得不到进度,与"以最终结果为主"一致。
- 限制:`runId` 在 `runSync` 内部生成,函数返回前调用方拿不到。变通:按 scope 查 `RUNNING` 记录(`findActiveSyncRun('SYNC:{SCOPE}')`,单用户本机可靠)。
- dry-run 没有任何记录,工作台只能用自己进程内的"进行中"状态。
- 建议(阶段 4,小改动):给 `runPublishWorkflow` 增加可选回调 `onRunStarted(runId)`。
- 进程崩溃会让 `RUNNING` 记录残留到 TTL 过期(30 分钟),下一次 `acquireSyncLock` 才清理;UI 需要解释这种状态。

**`triggeredBy`**:`PublishTrigger` 目前只有 `CLI | DASHBOARD | CI`。数据库列是 `text`,新增 `'WORKBENCH'` 不需要迁移,但要同步修改三处联合类型(`types/publish.ts`、`sync-types.ts`、`runPublish` 的内联类型)。见决策 6。

### 3.3 `PublishScope` 扩展的真实触及点(阶段 1 清单)

| 文件 | 问题 |
|---|---|
| `constants/publish.ts` | `PUBLISH_SCOPES` 列表 |
| `types/publish.ts` | `parsePublishScope` 逐个字符串判断;错误提示文案 |
| `lib/sync/sync-types.ts` | `SYNC_SCOPES`、`parseSyncScope` |
| `lib/sync/sync-orchestrator.ts` | `runPublish` 的 scope 映射是内联三元;失败判定写死 `scope === 'ALL' ? 2 : 1`;`PublishSummary` 没有 `site` 段 |
| `lib/sync/sync-lock.ts` | `ALL` 的冲突键列表需要加入 `SITE` |
| `lib/publish/publish-validation.ts` | `scope === 'galleries' ? 0 : validatePosts(...)`:新增 `site` 后 `site` scope 会误跑 Post 校验,必须改写 |
| `scripts/check-content.ts`、`content-check-types.ts` | `parseContentScope`、`scope` 类型 |
| `scripts/publish.ts`、`publish-tui.ts`、`verify-content.ts` | 用法文案、dry-run 步骤 |
| `tests/publish-boundaries.test.ts` | 断言 `PUBLISH_SCOPES` 精确等于 `['posts','galleries','all']`,必须同步更新 |

---


## 4. 站点设置契约

### 4.1 字段映射

| `siteProfile` 列 | 文件 | 现有 Dashboard 表单位置 |
|---|---|---|
| `name`/`title`/`bio`/`location`/`email`/`website` | `profile.yaml` | About 页内容 → 基础站点资料 |
| `avatar` | `profile.yaml` 的 `portraitImage`(本地路径) | 同上("头像 URL") |
| `socialLinks` | `profile.yaml` 的 `socialLinks` 区块 | Social Networks |
| `skills` | `profile.yaml` 的 `skills` 区块 | About 页内容 → Skills |
| `slogans` | `landing.yaml` 的 `slogans` 区块 | About 页内容 → Slogans |
| `themeConfig` | `theme.yaml` | 动态主题 |
| `landingPageConfig` | `landing.yaml`(不含 slogans 区块) | 首页编排 |
| `aboutPageConfig` | `profile.yaml` 的 `about` 区块 | About 页内容 → Hero / 经历 / 精选项目 |

文件按手动编辑上下文聚合，当前必需 YAML 为 `profile.yaml`、`landing.yaml`、`theme.yaml`；旧的 `social.yaml`、`skills.yaml`、`slogans.yaml`、`about.yaml` 不再接受。

补充:
- `educationTimeline` 在 Dashboard 里**没有编辑入口**(`SettingsClient` 把 setter 丢弃),只能在 YAML 里维护,工作台必须保留该字段。
- Settings 子组件(`SkillsSettings`、`ThemeSettings`、`LandingSettings` 等)只依赖 `components/ui`、`@/types/site`、`@/lib/theme`,是纯展示组件,可复用;`SettingsClient` 是单体容器(耦合 Next 路由与 Server Action),需要重写。
- `LandingSettings` 的置顶选择依赖 `allPosts`,工作台应改为读取本地 Markdown。

### 4.2 Zod 草案

在临时原型中实现了 7 个 schema 并用**真实数据库行**验证:7 个全部通过,6 个反例全部被拒绝(`javascript:` 链接、拼写错误字段、`customCss` 含 `</style>`、头像路径穿越、头像非 webp、时间线条目缺 `id`)。

- 所有对象使用 `.strict()`:拼写错误的字段会报错,不会被静默忽略。
- 可选字符串用 `preprocess('' → undefined)`,兼容现有数据里的空串。
- 长度上限复用 `constants/profile.ts` 的 `PROFILE_RULES`;社交平台枚举复用 `types/site.ts` 的取值。
- 实现时放在 `src/lib/publish/` 下的独立 schema 模块,由 Publish 与工作台共同导入,避免两份规则。
- 数据库当前值(只检查结构,未输出内容):`socialLinks` 2 项、`skills` 2 类、`slogans` 2 条、`careerTimeline` 2 项、`featuredProjects` 2 项、`educationTimeline` 空数组、`pinnedPostIds` 2 个。

### 4.3 阶段 1 必须处理的问题

**1. `pinnedPostIds` 是随机 UUID(最高优先级)**
`posts.id` 由 `crypto.randomUUID()` 生成,`db:reset` 后重新 Publish 会得到新 ID,现有置顶配置会全部失效,违反验收标准 1。
- 决策 5 已确认:Git 中改存 `pinnedPostSlugs`;Publish 站点域时解析 slug → 当前 `posts.id`,再写入数据库的 `pinnedPostIds`。运行时代码(`fetchPinnedPosts` 等)无需改动。
- 约束:`all` 范围必须先发布 Post 再发布 Site;dry-run 不连库,所以 dry-run 对照**本地 Markdown 的 slug** 校验;真实发布找不到对应 Post 时该域失败。
- 已验证:现有 2 个置顶 ID 都能解析回 slug。

**2. `z.url()` 接受 `javascript:`**
已验证 `z.url().safeParse('javascript:alert(1)')` 成功。现有 `updateSiteProfileSchema` 使用 `z.url()`,且多处字段是 `z.any()`。这些 URL 会被渲染成链接。
- 要求:站点 schema 一律使用 `z.httpUrl()`(Zod 4.6.5 已提供,已验证会拒绝 `javascript:` 与 `ftp:`)。

**3. 头像迁移**
数据库现有 `avatar` 是外部地址(`c.zick.xyz`),不是 Cloudinary。计划中的 `portraitImage` 本地文件方案不允许外链,`site:export` 无法生成与现有数据库一致的结果,"发布后与导出前一致"的验证会在 `avatar` 上不一致。决策 4 已确认:迁移时人工把现有头像保存为 `content/site/portrait.webp`;导出只提示,不下载,不开放任意外链。

**4. Cloudinary 前缀与 `media:cleanup` 冲突(会导致误删)**
- 现有常量:`CLOUDINARY_ROOT_PREFIX='myblog'`,Post 为 `posts`,Gallery 为 `gallery`。
- 原先 `scripts/media-cleanup.ts` 的 `getReferences()` 只收集 `galleryImages` 与 `posts`,站点头像会被误判为未引用。
- **阶段 0 前置改动已完成**:新增 `SITE_CLOUDINARY_PUBLIC_ID_PREFIX='site'` 与 `buildSitePublicId`;审计识别 `site/` 前缀,清理从 `siteProfile.avatar` 收集引用,并补充头像公有 ID/URL 与未引用判断测试。

**5. `customCss` 注入 `<style>`**
`src/app/layout.tsx` 用 `dangerouslySetInnerHTML` 把 `generateDynamicThemeCss(themeConfig)` 注入 `<style>`,内容含 `</style>` 即可跳出样式标签。内容来自 Git 且作者可信,但按"外部 HTML 必须净化"的原则,校验阶段应拒绝 `customCss` 与 `light/dark` 变量值中的 `<`、`>`(已验证该规则能拦截 `</style><script>`)。

**6. About 页缓存 24 小时**
`about/page.tsx` 设置 `revalidate = 86400`,靠 `updateSiteProfile` 里的 `revalidatePath('/about')` 立即失效。迁移后 Publish 在 CLI 进程里运行,调不了 `revalidatePath`,站点设置发布后 About 页最长 24 小时才更新,首页最长 1 小时。
- **阶段 0 前置改动已完成**:`about/page.tsx` 的 `revalidate` 已调整为 3600 秒,与首页同为小时级 ISR;不新增带密钥的按需失效端点。

**可选 id**
原型里把时间线/精选项目的 `id` 设为必填,定稿建议改为**可选**:公共页面渲染本来就有回退 key(`item.id || ...`)。`skills`/`slogans`/`technologies` 的 `id` 不进 YAML(`SettingsClient` 加载时本来就会重新生成)。

---


## 5. 对计划原文的修正

核对代码后,计划中几处前提与现状不同:

1. **多数线上写入口已是空实现**。`updatePostStatus`、`batchUpdatePostStatus`、`archivePost`、`restorePost`、`updatePostPosterAction`、`uploadPostPosterAction`、`deletePostPermanently`、`updateGallery`、`updateGalleryImage`、`markGalleryImageForDeletion`、`triggerSyncAction` 都只返回 `actionFailure`。
   - 仍会写内容派生表的只有两处:**`updateSiteProfile`**(`profile.ts`)与 **`confirmDeletion`**(`deletion-admin.ts`:Post/Gallery 写成 `ARCHIVED`,GalleryImage 写成 `PENDING_DELETE`)。
   - 阶段 3 的"移除"主要是**清理失效 UI 与空实现**,而非迁移功能。
2. **没有 Dashboard 发布按钮**。`triggerPublish` 没有 UI 调用方;`/dashboard/sync` 现在是静态的"旧同步入口已停用"页面,导航栏里也没有它。"发布状态"页是**新建**,不是改名。
3. **`'use server'` 导出等同公开端点**。没有 UI 调用的 `confirmDeletion`、`triggerPublish` 仍可被任何 ADMIN 会话直接调用,所以"移除"同时是缩小攻击面。
4. **Snapshot 恢复会写内容派生表**。`snapshot-service` 的恢复事务会清空并重建 `posts`、`galleries`、`galleryImages`、`siteProfile`,与"Dashboard 不得写内容派生表"的红线冲突。
   - 决策:Snapshot 属于运行时副本的灾难恢复,保留;下一次 Publish 以 Git 为准覆盖。边界测试把 `snapshot-admin` / `lib/snapshot` 列为显式白名单并写明理由。
5. **单张图片下线路径缺失**。`markRemovedSources` 只在 `deleteOld === true` 时运行,而工作流强制 `deleteOld=false`,所以从 `album.yaml` 删除图片不会让它下线。移除 Dashboard 的 `PENDING_DELETE` 入口后,建议用 `album.yaml` 的 `hidden: true`(相册用 `status: archived`)。已核对:`hidden` 在 `gallery-queries`、`home-queries`、`gallery-image-comments` 中都有 `eq(galleryImages.hidden, false)` 过滤,**该方案可行**。
6. `post-publish-service.ts` 的 `deleteOld` 归档分支在当前工作流下永远不会执行,属于可清理的死代码,不影响阶段 1。
7. **文章 `archived` 状态**:`parseStatusType` 支持 `archived`,Post 域按 Markdown 文件扫描,`archived` 的文章仍在扫描结果里,不会被计入 source missing,所以决策 1(方案 1)可行。公开页面查询要求 `status='PUBLISHED'`,因此 `archived` 文章不会展示。

---

## 6. 基线状态与本次验证

阶段 0 初始探测时的历史基线:

| 检查 | 结果 |
|---|---|
| `bun test` | 50 通过 / 0 失败 |
| `bunx tsc --noEmit` | 通过 |
| `bun run build` | 通过 |
| `bun run publish -- --scope all --dry-run --json` | 通过(10 篇 Post、3 个相册、6 张图,0 错误) |
| `bun run lint` | 当时报告 `.pi/settings.json` 缺少结尾换行;本次 lint 全量通过 |

本次完成独立前置改动后的验证:

| 检查 | 结果 |
|---|---|
| `bun run lint` | 通过(Biome 检查 268 个文件) |
| Cloudinary 与 Gallery 相关测试 | 11 通过 / 0 失败 |
| `bun test` | 52 通过 / 0 失败 |
| `bunx tsc --noEmit --pretty false` | 通过 |
| `bun run content:check -- --no-examples` | 通过(10 篇 Post、3 个相册;0 错误) |
| `bun run content:verify` | 通过;含格式/索引检查及 Post/Gallery/all dry-run |
| `bun run publish -- --scope all --dry-run --json` | 通过(10 篇 Post、3 个相册、6 张图,0 错误) |
| `bun run build` | 通过;`/about` 构建输出为 1h ISR |
| `git diff --check` | 通过 |

探测期间对 `package.json`、`bun.lock` 的依赖变更已撤销,`bun install` 确认无差异。

---

## 7. 对 `AGENTS.md` / README 的潜在影响

本次没有新增/修改命令,但调整了 About ISR 与 Cloudinary 媒体引用审计范围。**本次没有修改根 `README.md` 与 `AGENTS.md`**。后续需要同步:

- 阶段 0 收尾:本次更新 `scripts/README.md` 的 Cloudinary 引用范围说明;About ISR 改为 3600 秒。根 `README.md` 与命令行为未改变。
- 阶段 1:`scripts/README.md`、根 `README.md`(`site` scope、`site:export`、`publish:site`)、`AGENTS.md` 的"内容源与架构边界"(增加 `content/site/`)。
- 阶段 2:根 `README.md` 与 `AGENTS.md` 增加 `bun run workbench`、`bunfig.toml`、`@types/bun`。
- 阶段 4/6:Dashboard 角色描述(只读 + 运行时管理)。
- 修改 `AGENTS.md` 前需要先经过你确认(见决策 7)。

---

## 8. 待用户确认的决策

| # | 议题 | 决定 / 状态 |
|---|---|---|
| 1 | source missing 的处理方式 | 建议方案 1(`status: archived`);**待确认**,不阻塞阶段 1 |
| 2 | Gallery 线上删除 | 建议移除线上 Gallery/图片删除分支;**待确认**,在 Dashboard 收敛阶段处理 |
| 3 | Dashboard 命名 | 文章 → "文章(只读)";Gallery → "相册(只读)";站点与主题 → "站点信息(只读)";新建"发布状态"页;**已确认** |
| 4 | 头像迁移 | 人工准备 `content/site/portrait.webp`;`site:export` 对外链头像只提示、不下载;不开放外链字段;**已确认** |
| 5 | 置顶文章表示 | Git 中使用 `pinnedPostSlugs`,Publish 时解析为数据库 ID;**已确认** |
| 6 | 触发来源标记 | 建议新增 `'WORKBENCH'`(无需数据库迁移);**待阶段 4 确认/实现** |
| 7 | 是否更新 `AGENTS.md` | 阶段 2、4 完成后给出修改稿,经你确认再改 |

---

## 9. 阶段 1 入口状态与实施顺序

- [x] 决策 3、4、5 已确认,并统一头像文件路径为 `content/site/portrait.webp`。
- [x] 新增 `site` Cloudinary public ID 命名;审计和清理引用 `siteProfile.avatar`;补充纯函数测试。
- [x] About 页 ISR 调整为 3600 秒,与首页保持同量级。
- [ ] **阶段 1 第一个纵向切片**:新增 `site` scope 时,须与 reader / repository / publish service、summary、Workflow 执行顺序、锁和校验同步实现。前置阶段不单独把 `site` 加进 scope 常量/解析器,避免它被旧 Workflow 当作 `all` 处理。

决策 1、2 不影响站点设置的 Git/Publish 契约,可在 Dashboard 收敛实施前确认;决策 6 在工作台真实 Publish 接入前确认。本次未修改 `AGENTS.md`。

