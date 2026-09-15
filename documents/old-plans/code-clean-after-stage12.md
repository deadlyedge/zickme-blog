# 结论摘要

当前项目已经基本完成了“Git-first、单向 Publish”的架构收敛，但实现层仍保留了一批旧 Sync 体系和 Dashboard 兼容能力。

最明确的可清理对象是：

### 现在基本可以删除

```text
scripts/upload-to-cloudinary.ts
src/lib/frontmatter-writeback.ts
src/lib/sync/sync-merge.ts
src/lib/sync/sync-hash.ts
```

其中：

- `upload-to-cloudinary.ts` 是旧的 Post 图片批量上传入口；
- `frontmatter-writeback.ts` 实现数据库 → Markdown 的回写；
- `sync-merge.ts` 实现旧三方合并；
- `sync-hash.ts` 当前没有实际代码调用，且现有 Gallery 已自行计算 hash。

### 当前不能直接删除，但未来应删除或迁移

```text
src/lib/content-diff.ts
src/lib/post-exporter.ts
src/lib/publish/publish-legacy.ts
src/lib/sync-service.ts
src/lib/sync/*
src/lib/gallery/gallery-sync-service.ts
```

原因是这些模块目前仍被 `publish-workflow`、Dashboard 或测试实际引用，只是它们属于兼容期或旧架构实现。

---

# 一、scripts 分析

## 1. `scripts/audit-docs.ts`

### 当前状态

**保留。**

它调用：

```ts
src/lib/docs/architecture-audit.ts
```

并且对应：

```json
"docs:audit": "bun run scripts/audit-docs.ts"
```

`AGENTS.md` 也要求执行：

```bash
bun run docs:audit
```

### 未来状态

仍然需要。

这是当前架构治理的一部分，不是内容同步逻辑，也不违背 Git-first。它能够防止 README、AGENTS、架构文档互相描述不一致。

---

## 2. `scripts/audit-migrations.ts`

### 当前状态

**保留。**

对应命令：

```json
"db:audit-migrations": "bun run scripts/audit-migrations.ts"
```

它是纯只读审计，不连接数据库，也不执行 migration：

```text
drizzle/*.sql
drizzle/meta/_journal.json
```

### 未来状态

仍然需要，至少在 migration 压缩和生产环境迁移审计完成前需要。

未来如果 migration 流程稳定，也可以把它迁移成 CI 检查，但不建议删除其能力。

---

## 3. `scripts/check-content.ts`

### 当前状态

**保留，是正式入口。**

对应：

```json
"content:check": "bun run scripts/check-content.ts",
"content:fix": "bun run scripts/check-content.ts --fix"
```

它目前负责：

- 检查 Markdown；
- 检查 Frontmatter；
- 检查 slug 冲突；
- 检查图片路径；
- 检查 Post metadata；
- 检查 Gallery；
- 可选自动补全 Frontmatter；
- 可选生成 `album.yaml` 和 `gallery.yaml`。

### 问题

它与以下脚本有部分重复：

```text
scripts/prepare-post-frontmatter.ts
scripts/rebuild-content.ts
scripts/gallery-index.ts
scripts/format-content.ts
```

特别是 Frontmatter 修复和 Gallery `album.yaml` 自动生成存在重复。

### 未来状态

保留，但建议逐步收敛职责：

```text
content:check   → 只检查
content:fix     → 显式修复 Frontmatter / album.yaml
content:format  → 只做格式化
gallery:index   → 只生成 gallery.yaml
```

目前 `check-content.ts` 的 `--fix` 同时修改 Post 和 Gallery，边界偏宽。未来可以让它只负责校验，把修复行为拆成更明确的命令。

---

## 4. `scripts/content-verify-utils.ts`

### 当前状态

**保留。**

它被以下两个脚本使用：

```text
scripts/prepare-content.ts
scripts/verify-content.ts
```

提供：

```ts
runBunScript()
runGitCheck()
```

### 未来状态

可以保留，也可以把它并入一个验证编排模块。

它本身没有架构问题，只是一个很小的脚本工具模块，不是优先清理对象。

---

## 5. `scripts/format-content.ts`

### 当前状态

**保留。**

对应：

```json
"content:format": "bun run scripts/format-content.ts"
```

它只格式化：

- Markdown Frontmatter；
- `album.yaml`；
- 不修改正文；
- 默认 dry-run；
- 通过 `--write` 才写文件。

### 未来状态

保留。

这是符合 Git-first 的本地内容工具，不涉及数据库，也不涉及反向同步。

建议继续保持它与 `check-content.ts` 的职责分离：

```text
check-content → 语义检查
format-content → YAML / Frontmatter 排版
```

---

## 6. `scripts/gallery-index.ts`

### 当前状态

**保留。**

对应：

```json
"gallery:index": "bun run scripts/gallery-index.ts"
```

用途是根据相册目录生成：

```text
content/photo-gallery/gallery.yaml
```

它目前还被 `publish-validation.ts` 作为修复建议使用：

```text
bun run gallery:index
```

### 未来状态

保留。

虽然 `gallery.yaml` 是自动生成文件，但它仍然是 Git 内容源的一部分，且索引生成需要一个明确、可审查的命令。

不建议把它删除并完全隐式放进 Publish，因为当前架构要求 Publish 不应该悄悄修改工作区。

---

## 7. `scripts/init-content.ts`

### 当前状态

**可保留，但不是核心流程。**

用途是初始化：

```text
content/README.md
content/templates/
content/posts/
content/photo-gallery/
```

它适合：

- 新仓库初始化；
- 新内容仓库初始化；
- 生成示例模板。

### 未来状态

属于可选工具，不是正式发布链路。

如果项目不会支持新的独立内容仓库，可以删除。但删除优先级较低，因为它是纯本地初始化工具，不引入架构复杂度。

建议标记为：

```text
辅助工具，非正式内容发布入口
```

---

## 8. `scripts/prepare-content.ts`

### 当前状态

**当前仍在使用，但和 `verify-content.ts` 有明显重叠。**

它执行：

```text
content safety
content check
format dry-run
gallery index dry-run
publish all dry-run
git diff --check
```

### 与 `verify-content.ts` 的区别

`verify-content.ts` 执行：

```text
content safety
content check
format dry-run
gallery index dry-run
publish posts dry-run
publish galleries dry-run
publish all dry-run
git diff --check
```

两者本质上都是“提交前预检”。

### 未来状态

建议删除或合并。

架构文档正式保留的是：

```text
content:check
content:format
content:verify
publish
```

而不是 `content:prepare`。

建议未来选择一个方案：

### 方案 A：删除 `prepare-content.ts`

统一使用：

```bash
bun run content:verify
```

### 方案 B：保留 `prepare-content.ts`，删除重复的 `verify-content.ts`

但从当前文档和 CI 使用情况看，方案 A 更符合现有架构。

---

## 9. `scripts/prepare-media.ts`

### 当前状态

**保留。**

它使用：

```ts
prepareGalleryImage()
```

将：

```text
content/.gallery-input/{album}/*
```

转换为：

```text
content/photo-gallery/{album}/images/*.webp
```

这是当前 Git-first 流程中必要的媒体准备步骤。

### 未来状态

仍然需要。

不过它现在从：

```ts
src/lib/gallery/gallery-sync-service.ts
```

导入 `prepareGalleryImage`，未来应该迁移到独立的媒体模块，例如：

```text
src/lib/gallery/media-preparation.ts
```

或者：

```text
src/lib/publish/gallery-media.ts
```

需要删除的是旧的 `sync` 命名和职责混合，不是媒体预处理能力本身。

---

## 10. `scripts/prepare-post-frontmatter.ts`

### 当前状态

**接近废弃。**

它当前没有 package.json 命令，也没有正式 CLI 入口。

实际引用只有：

```text
tests/publish-boundaries.test.ts
```

它实现的能力与：

```text
scripts/check-content.ts --fix
```

以及 Publish 校验流程存在重复。

### 未来状态

建议删除，但需要先处理测试。

可选处理方式：

1. 将测试改为测试 `check-content.ts` 的导出函数；
2. 将它内部的纯 Frontmatter 逻辑移动到 `src/lib/content/post-frontmatter.ts`；
3. 删除该脚本。

推荐方案：

```text
prepare-post-frontmatter.ts → 删除
Frontmatter 纯函数 → 保留在 src/lib/content/post-frontmatter.ts
```

它不应该继续作为一个没有正式命令的脚本文件存在。

---

## 11. `scripts/publish-tui.ts`

### 当前状态

**当前可用，但属于辅助入口。**

它：

- 复用 `runPublishWorkflow`；
- 复用 Publish 校验；
- 允许交互式查看错误；
- 允许执行明确的修复命令；
- 支持 VS Code 打开待修复文件；
- 最后确认是否执行真实 Publish。

### 未来状态

可以保留，不违反 Git-first。

但它不是架构必需品。未来如果希望工具数量更少，可以删除 TUI，仅保留：

```bash
bun run publish
```

不过从用户体验上看，TUI 对图片、Gallery 和 Frontmatter 修复比较友好，因此不建议在当前阶段优先删除。

需要注意的是：

```text
TUI 只能调用 Publish service
不能重新引入独立 Sync 逻辑
```

当前这一点基本符合。

---

## 12. `scripts/publish.ts`

### 当前状态

**保留，是正式发布入口。**

对应：

```json
"publish": "bun run scripts/publish.ts"
```

架构文档也明确规定：

```bash
bun run publish -- --scope all
```

它支持：

```text
posts
galleries
all
--dry-run
--json
--no-delete
```

### 未来状态

保留。

但内部实现应该从：

```text
publish.ts
  → publish-workflow
  → sync-orchestrator
  → ContentSyncService / gallery-sync-service
```

逐步改为：

```text
publish.ts
  → publish-workflow
  → post-publish-service
  → gallery-publish-service
```

也就是说，CLI 不需要删除，底层 Sync 实现需要逐步替换。

---

## 13. `scripts/rebuild-content.ts`

### 当前状态

**当前仍有入口，但和 `check-content.ts --fix` 重复。**

它主要做：

- 发现缺失的 `album.yaml`；
- 生成默认 `album.yaml`；
- 重新生成 `gallery.yaml`。

而 `check-content.ts` 的 Gallery 修复逻辑已经包含类似功能：

```ts
createAlbumSkeleton()
writeGalleryIndex()
```

同时 `publish-validation.ts` 还会建议：

```text
bun run content:rebuild -- --scope galleries --album ...
```

### 未来状态

建议删除或改造成明确的 Gallery 修复命令。

推荐方案：

```text
content:rebuild → 删除
```

然后将建议统一为：

```bash
bun run content:check -- --scope galleries --fix
bun run gallery:index
```

或者新增一个语义更清晰的命令：

```bash
bun run gallery:repair
```

当前项目已经有三个 Gallery 生成/修复入口：

```text
check-content --fix
rebuild-content
gallery-index
```

未来应收敛为：

```text
gallery:repair  → 修复缺少的 album.yaml
gallery:index   → 生成 gallery.yaml
```

---

## 14. `scripts/reset-admin-password.ts`

### 当前状态

**保留。**

这是架构文档明确要求的免邮件自救方案：

- 不依赖邮件服务；
- 使用 `better-auth/crypto`；
- 可以重置管理员密码；
- 清理现有 Session。

### 未来状态

仍然需要。

可以继续增强：

- 禁止通过命令行参数传递明文密码，避免 shell history 泄露；
- 改成只交互式输入密码；
- 增加生产环境目标确认；
- 检查是否真的为管理员账号。

但不建议删除。

---

## 15. `scripts/reset-db.ts`

### 当前状态

**保留，但属于高风险运维工具。**

它的职责很清晰：

```text
TRUNCATE runtime tables
不修改 schema
不修改 migration journal
不修改 content
不删除 Cloudinary
```

并且有：

```text
--confirm-production-reset
--force
```

保护。

### 未来状态

保留，除非未来完全交由 Neon、数据库平台或专门运维工具处理。

它不是内容同步体系的一部分，仍然是数据库灾难恢复或测试环境重置工具。

建议未来进一步：

- 增加明确环境识别；
- 生产环境强制二次确认；
- 检查表名是否和当前 schema 自动同步；
- 将表清单从手工维护改为受控常量或 schema 审计。

---

## 16. `scripts/upload-to-cloudinary.ts`

### 当前状态

**建议现在删除。**

理由：

1. 没有 package.json 正式命令；
2. 没有代码调用；
3. 只扫描：

   ```text
   content/posts/**/images/
   ```

   不处理 Gallery；
4. 它重复实现了图片优化和 Cloudinary 上传；
5. 正式 Publish 已经负责 Cloudinary 上传；
6. `scripts/README.md` 自己也说明 Gallery 已统一由 Publish 处理；
7. 它容易让人误以为 Cloudinary 是独立内容发布入口。

当前正式流程应为：

```text
Post / Gallery 内容
  → publish
  → Cloudinary + PostgreSQL
```

而不是：

```text
upload-to-cloudinary
  → Cloudinary
```

### 未来状态

不需要。

如果未来确实需要独立媒体上传，应新增一个明确的媒体服务，而不是保留这个旧的 Post-only 脚本。

---

# 二、`src/lib` 分析

## 1. `src/lib/auth-client.ts`

### 结论

**当前及未来都需要。**

被登录、注册、登出和 Session 相关组件使用。

---

## 2. `src/lib/auth.ts`

### 结论

**当前及未来都需要。**

它是 Better Auth 服务端配置，连接：

```text
Better Auth
Drizzle Adapter
PostgreSQL
Next.js cookies
```

不能删除。

---

## 3. `src/lib/content-diff.ts`

### 当前状态

**当前仍被使用，但属于旧 Dashboard 能力。**

调用方：

```text
src/lib/actions/posts-admin.ts
```

使用：

```ts
scanLocalContent()
diffContent()
```

对应：

```ts
getRemotePostDiffAction()
```

该功能用于比较：

```text
本地 Markdown
数据库 Post
```

并产生：

```text
LOCAL_ONLY
REMOTE_ONLY
CONFLICT
IN_SYNC
```

### 架构问题

这正是旧双向同步思路的残留：

- 比较本地和远端；
- 将数据库视为内容来源；
- 使用时间戳判断冲突；
- 向 Dashboard 暴露远端差异。

当前架构已经明确：

```text
Git 内容源 → Publish → 数据库运行时副本
```

不再需要数据库和 Markdown 双向比较。

### 未来状态

建议删除。

删除前需要先删除或禁用：

```ts
getRemotePostDiffAction()
```

以及 Dashboard 中对应的“远端差异”页面或按钮。

因此：

```text
现在：不能直接删除
未来：应删除
```

---

## 4. `src/lib/content-providers.ts`

### 结论

**当前及未来都需要。**

它负责：

- 首页内容；
- Post 列表；
- 单篇 Post；
- 标签；
- 热门文章；
- 置顶文章；
- 搜索内容。

它是运行时数据库查询层，符合目标架构：

```text
PostgreSQL → Blog 前台
```

不属于旧内容同步体系。

---

## 5. `src/lib/content-queries.ts`

### 结论

**当前及未来都需要。**

它集中管理 React Query：

```text
contentKeys
postsOptions
tagsOptions
homeContentOptions
postOptions
commentsOptions
searchContentOptions
```

被：

```text
src/lib/hooks/useContent.ts
src/lib/hooks/useNavigationPreload.ts
src/app/posts/page.tsx
```

等处使用。

不能删除。

---

## 6. `src/lib/frontmatter-writeback.ts`

### 当前状态

**现在即可删除。**

它提供：

```ts
writeBackPostPoster()
shouldWriteBackPoster()
```

功能是：

```text
数据库 poster → Markdown frontmatter.image
```

这和当前架构直接冲突。架构文档已经明确标记：

```text
frontmatter poster 自动 write-back
```

为废弃能力。

当前代码搜索中没有找到有效运行时调用，只有历史文档文字提及。

### 未来状态

不需要。

建议删除后同步清理：

- 历史架构文档中仍被误认为现行代码的描述；
- 旧测试或示例代码；
- 任何 write-back 类型或接口。

---

## 7. `src/lib/generate-avatar.ts`

### 结论

**当前及未来都需要。**

当前被：

```text
src/lib/actions/profile.ts
src/lib/actions/user-portal.ts
```

使用，生成 Dicebear 头像。

这属于用户体验和认证系统，不是内容发布逻辑。

---

## 8. `src/lib/get-avatar.ts`

### 当前状态

模块本身保留。

当前实际使用的是：

```ts
getGravatarAvatarUrl()
```

被：

```text
src/lib/actions/user-portal.ts
```

调用。

### `getGravatarProfile()` 的状态

`getGravatarProfile()` 当前没有实际调用，仅在历史开发计划中被提到。

它依赖：

```text
GRAVATAR_API_KEY
Gravatar Profile API
```

而头像切换功能实际上只使用 Gravatar avatar URL：

```ts
getGravatarAvatarUrl(email)
```

### 建议

可以删除函数级别的：

```ts
getGravatarProfile()
GravatarProfile
GetGravatarOptions
```

并保留：

```ts
getGravatarAvatarUrl()
```

结论：

```text
get-avatar.ts：保留
getGravatarProfile：现在即可删除
```

---

## 9. `src/lib/logger.ts`

### 结论

**当前及未来都需要。**

多个领域使用：

```text
actions
content-providers
gallery
sync
avatar
```

并且包含：

- 日志等级；
- 生产 JSON 日志；
- 错误序列化；
- 敏感字段脱敏。

不能删除。

---

## 10. `src/lib/post-exporter.ts`

### 当前状态

**当前仍被使用，但功能属于旧内容导出能力。**

调用方：

```text
src/lib/actions/posts-admin.ts
```

用途是生成数据库文章备份 ZIP：

```ts
postToMarkdown()
safeMarkdownFileName()
```

对应 Dashboard 的文章导出能力。

### 架构问题

当前架构已经规定：

```text
数据库文章导出不是内容恢复手段
```

内容恢复应该使用：

```text
Git revert
Git branch
Git tag
仓库备份
```

因此，数据库 → Markdown 的导出功能不再属于正式内容架构。

### 未来状态

建议删除：

1. 删除 `posts-admin.ts` 中的文章导出 Action；
2. 删除 Dashboard 的“导出文章”按钮；
3. 删除 `post-exporter.ts`。

结论：

```text
现在：因 posts-admin 仍调用，不能直接删除
未来：应删除
```

---

## 11. `src/lib/post-metadata.ts`

### 结论

**当前及未来都需要。**

它负责：

- 外链校验；
- 归一化 Post links；
- GitHub、Twitter、Demo、Figma、Paper 等类型推断；
- category；
- series；
- canonicalUrl；
- outdatedWarning；
- layout。

被内容检查和 Publish 使用，是内容模型的一部分。

---

## 12. `src/lib/public-user.ts`

### 结论

**当前及未来都需要。**

它用于公开评论用户信息处理：

```ts
getPublicUserName()
getAvatarFallback()
```

符合“公开评论用户模型和内部用户模型隔离”的架构要求。

---

## 13. `src/lib/query-client.ts`

### 结论

**当前及未来都需要。**

它负责 React Query 的：

- Server QueryClient；
- Browser QueryClient；
- dehydration；
- pending query dehydration；
- staleTime。

被：

```text
src/lib/hooks/useNavigationPreload.ts
src/app/posts/page.tsx
```

等使用。

---

## 14. `src/lib/seo.ts`

### 结论

**当前及未来都需要。**

被多个页面使用：

```text
about
gallery
gallery/[slug]
home
posts
user
dashboard/settings
```

不能删除。

---

## 15. `src/lib/slug.ts`

### 结论

**当前及未来都需要。**

用于：

- 中文转拼音；
- Post slug 生成；
- Frontmatter 缺失时推导 slug；
- 标签 slug；
- 内容检查；
- Publish。

它是 Git 内容源和数据库之间的基础纯函数。

---

## 16. `src/lib/store.ts`

### 结论

**当前需要，但未来可以重构。**

当前用于：

```text
AuthModal
CommentForm
CommentItem
CommentsSection
User 相关交互
```

存储：

```text
isAuthModalOpen
authModalView
activeReplyId
```

### 未来状态

不是架构减法的直接删除对象。

不过可以考虑拆分：

```text
auth-store
comment-store
```

或者将简单状态改为组件状态 / Context。

当前不建议删除。

---

## 17. `src/lib/sync-service.ts`

### 当前状态

**当前仍是 Publish 的核心实现，不能直接删除。**

调用链：

```text
publish.ts
  → publish-workflow.ts
  → sync-orchestrator.ts
  → ContentSyncService
```

它混合了：

- Markdown 扫描；
- Frontmatter 解析；
- slug 生成；
- Post 数据库写入；
- 标签写入；
- 图片解析；
- Sharp 处理；
- Cloudinary 上传；
- Markdown 图片替换；
- source missing；
- archived 处理；
- SyncLog 写入。

### 架构问题

这是当前 Stage 11 的主要治理目标之一。

文档已经明确指出：

```text
src/lib/sync-service.ts 混合 Post 内容、媒体、Cloudinary 和数据库职责
```

### 未来状态

不是“删除全部能力”，而是拆分并最终删除这个文件：

建议拆成：

```text
src/lib/publish/post-publish-service.ts
src/lib/publish/media-publish-service.ts
src/lib/publish/publish-repository.ts
```

然后：

```text
publish-workflow.ts
```

直接依赖新的 Publish 服务。

最终：

```text
src/lib/sync-service.ts → 删除
```

---

# 三、`src/lib/publish` 分析

## 1. `publish-workflow.ts`

### 当前状态

保留，但内部依赖旧 Sync：

```ts
import { runSync } from '@/lib/sync/sync-orchestrator'
```

### 未来状态

保留并改造为真正的 Publish 编排器。

目标是：

```text
publish-workflow
  → post-publish-service
  → gallery-publish-service
  → publish-lock
  → publish-summary
```

而不是：

```text
publish-workflow
  → runSync
```

---

## 2. `publish-validation.ts`

### 结论

**当前及未来都需要。**

它负责：

- Post Frontmatter 校验；
- Gallery 配置校验；
- gallery.yaml 是否过期；
- 原图是否存在对应 WebP；
- 生成 TUI 修复建议；
- dry-run 前置检查。

这是 Git-first 发布前的核心安全边界。

---

## 3. `publish-summary.ts`

### 当前状态

保留，但仍依赖：

```ts
SyncRunSummary
```

### 未来状态

保留，但应完全迁移到 Publish 类型。

目标：

```text
PublishSummary 不再依赖 SyncRunSummary
```

---

## 4. `publish-types.ts`

### 结论

保留。

它是 Publish 对外协议的一部分。

---

## 5. `publish-repair.ts`

### 结论

保留。

它为 TUI 提供显式修复命令映射，符合：

```text
自动修复必须是明确、可审查的命令
```

不能让 Publish 隐式修改工作区，因此这个模块仍有价值。

---

## 6. `publish-legacy.ts`

### 当前状态

**兼容期保留。**

调用方：

```text
src/lib/actions/posts-admin.ts
```

它把：

```text
PublishSummary
```

转换为旧的：

```text
SyncResult
```

### 未来状态

应删除。

当 Dashboard 的 `triggerManualSync()` 改成直接返回 Publish 结果后，就可以删除：

```ts
legacySyncResultFromPublish()
```

---

# 四、`src/lib/sync` 分析

## 1. `sync-merge.ts`

### 结论

**现在即可删除。**

它实现：

```ts
mergeSyncFields()
```

支持：

```text
base
local
remote
conflicts
```

这是明确的三方合并逻辑。

当前架构已经禁止继续扩展：

```text
mergeBase
字段级 merge
实体级冲突
SyncConflict
```

代码搜索没有发现有效运行时调用，主要只有历史文档和类型定义引用。

---

## 2. `sync-hash.ts`

### 结论

**现在即可删除。**

它提供：

```ts
normalizeSyncValue()
syncContentHash()
```

当前没有有效代码调用。

虽然数据库中仍存在：

```text
contentHash
```

但 Gallery 当前直接在：

```text
gallery-sync-service.ts
```

内使用：

```ts
createHash('sha256').update(processed)
```

因此 `sync-hash.ts` 不是当前实际 hash 实现的依赖。

---

## 3. `sync-errors.ts`

### 当前状态

不能直接删除。

当前被：

```text
sync-orchestrator.ts
```

使用：

```ts
safeSyncError()
```

### 未来状态

应迁移到 Publish 领域：

```text
src/lib/publish/publish-errors.ts
```

旧类型中的这些错误也应逐步删除：

```text
REVISION_CONFLICT
MERGE_CONFLICT
WRITEBACK_CONFLICT
PENDING_DELETE_CONFIRMATION
```

最终旧 `sync-errors.ts` 可以删除。

---

## 4. `sync-lock.ts`

### 当前状态

不能删除。

真实 Publish 目前仍通过它获取锁。

### 未来状态

迁移到：

```text
src/lib/publish/publish-lock.ts
```

架构文档已经明确规划这一迁移。

---

## 5. `sync-repository.ts`

### 当前状态

不能直接删除。

当前用于：

- 创建 SyncRun；
- 完成 SyncRun；
- 查询运行记录；
- 查找活跃运行；
- 释放锁；
- 处理过期运行。

调用方包括：

```text
sync-orchestrator.ts
sync-lock.ts
actions/sync-admin.ts
```

### 未来状态

有两种可能：

#### 方案 A

继续保留 `SyncRun` 作为兼容期历史记录，但重命名为：

```text
publish-run-repository.ts
```

#### 方案 B

迁移为最小：

```text
publish_runs
publish-run-repository.ts
```

在迁移完成前不能删除。

---

## 6. `sync-result.ts`

### 当前状态

仍被：

```text
src/lib/actions/posts-admin.ts
```

使用：

```ts
failedSyncResult()
```

### 未来状态

应删除旧 SyncResult DTO，改为统一：

```text
PublishResult
PublishError
```

但当前 Dashboard Action 仍返回：

```text
SyncResult
```

因此暂时不能删除。

---

## 7. `sync-types.ts`

### 当前状态

仍被多个模块使用：

```text
publish-summary.ts
publish-workflow.ts
sync-orchestrator.ts
sync-lock.ts
sync-repository.ts
src/types/publish/publish.ts
```

### 未来状态

应拆分迁移。

其中以下内容明显属于旧协议，应删除：

```text
SyncConflict
PersistedSyncRun
REMOTE_ONLY
CONFLICT
merge 相关类型
```

以下内容可能需要迁移到 Publish：

```text
SyncScope → PublishScope
SyncTrigger → PublishTrigger
SyncRunSummary → PublishSummary
SyncRunStatus → PublishStatus
```

最终 `sync-types.ts` 应删除，但必须最后处理。

---

## 8. `sync-orchestrator.ts`

### 当前状态

它仍是 Publish 的实际底层编排器。

### 未来状态

应删除或改名为：

```text
publish-orchestrator.ts
```

当前不建议直接删除，否则 `publish.ts` 会失效。

目标迁移完成后：

```text
publish-workflow → publish-orchestrator
```

而不是：

```text
publish-workflow → sync-orchestrator
```

---

# 五、`src/lib/gallery` 分析

## `gallery-sync-service.ts`

### 当前状态

**当前不能删除。**

它现在承担：

- `prepareGalleryImage()`；
- Gallery 图片读取；
- Sharp 转 WebP；
- EXIF 处理；
- Cloudinary 上传；
- Gallery 数据库写入；
- GalleryImage 写入；
- album.yaml 处理；
- source missing；
- 删除标记；
- Gallery 同步摘要。

调用方：

```text
scripts/prepare-media.ts
src/lib/sync/sync-orchestrator.ts
```

### 架构问题

虽然 Gallery 领域本身必须保留，但当前文件仍然叫：

```text
gallery-sync-service.ts
```

并且混合了：

```text
媒体准备
媒体上传
数据库发布
旧 Sync 状态
删除标记
```

### 未来状态

建议拆分：

```text
src/lib/gallery/media-preparation.ts
src/lib/publish/gallery-publish-service.ts
src/lib/gallery/gallery-parser.ts
src/lib/gallery/cloudinary.ts
src/lib/gallery/exif.ts
```

最终删除旧的：

```text
src/lib/gallery/gallery-sync-service.ts
```

但这是迁移完成之后删除，不是现在删除。

---

# 六、推荐删除顺序

## 第一批：可以直接清理

建议优先处理：

```text
scripts/upload-to-cloudinary.ts
src/lib/frontmatter-writeback.ts
src/lib/sync/sync-merge.ts
src/lib/sync/sync-hash.ts
```

同时可删除 `getGravatarProfile()` 函数及其未使用类型。

---

## 第二批：先迁移调用方，再删除

```text
scripts/prepare-post-frontmatter.ts
scripts/rebuild-content.ts
scripts/prepare-content.ts
```

建议方向：

```text
prepare-post-frontmatter → 并入内容纯函数或删除
rebuild-content           → 并入 gallery repair 或 content:check --fix
prepare-content           → 与 verify-content 合并，优先删除
```

---

## 第三批：Dashboard 兼容功能清理后删除

```text
src/lib/content-diff.ts
src/lib/post-exporter.ts
src/lib/publish/publish-legacy.ts
src/lib/sync/sync-result.ts
```

需要先清理：

```text
getRemotePostDiffAction()
数据库文章导出 Action
旧 SyncResult 返回类型
Dashboard 远端差异 UI
Dashboard 数据库导出 UI
```

---

## 第四批：Publish 与 Sync 解耦后删除

```text
src/lib/sync-service.ts
src/lib/sync/sync-orchestrator.ts
src/lib/sync/sync-lock.ts
src/lib/sync/sync-repository.ts
src/lib/sync/sync-errors.ts
src/lib/sync/sync-types.ts
src/lib/gallery/gallery-sync-service.ts
```

迁移目标：

```text
src/lib/publish/post-publish-service.ts
src/lib/publish/gallery-publish-service.ts
src/lib/publish/publish-lock.ts
src/lib/publish/publish-run-repository.ts
src/lib/publish/publish-errors.ts
```

---

# 七、最终建议的保留脚本集合

未来建议保留的正式脚本大致是：

```text
scripts/audit-docs.ts
scripts/audit-migrations.ts
scripts/check-content.ts
scripts/content-verify-utils.ts
scripts/format-content.ts
scripts/gallery-index.ts
scripts/init-content.ts
scripts/prepare-media.ts
scripts/publish.ts
scripts/publish-tui.ts
scripts/reset-admin-password.ts
scripts/reset-db.ts
scripts/verify-content.ts
```

其中可选删除：

```text
scripts/init-content.ts
scripts/publish-tui.ts
```

它们是辅助工具，不是架构核心。

建议删除：

```text
scripts/upload-to-cloudinary.ts
scripts/prepare-post-frontmatter.ts
scripts/rebuild-content.ts
scripts/prepare-content.ts
```

不过后三者需要先完成命令和测试迁移。

---

# 八、最重要的架构判断

当前真正需要清理的不是所有带有 `sync` 字样的文件，而是以下几类能力：

```text
数据库 → Markdown/YAML 回写
数据库与 Git 内容双向 diff
数据库文章导出作为恢复方式
三方 merge / conflict resolution
独立 Cloudinary 上传入口
Dashboard 内容编辑和导入
```

当前 Publish 仍然依赖旧 Sync 实现，因此不建议现在直接删除整个：

```text
src/lib/sync/
```

正确顺序应是：

```text
停止新增 Sync 依赖
→ 迁移 Publish 调用方
→ 迁移 Dashboard 兼容 DTO
→ 删除无调用方 helper
→ 拆分 Post/Gallery Publish Service
→ 删除旧 Sync 核心
```

换句话说：

- `frontmatter-writeback.ts`、`sync-merge.ts`、`sync-hash.ts`、旧 Cloudinary 脚本已经基本没有保留价值；
- `sync-service.ts` 和 `gallery-sync-service.ts` 不是永久需要，但目前仍承载真正的 Publish 功能；
- `content-diff.ts`、`post-exporter.ts` 和 `publish-legacy.ts` 是 Dashboard 兼容期遗留，应在 Dashboard 旧功能清理后删除；
- 认证、查询、评论、头像、主题、SEO、slug、内容 metadata 等模块与架构减法无冲突，应继续保留。