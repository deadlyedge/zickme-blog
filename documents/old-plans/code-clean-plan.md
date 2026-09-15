# 删除 / 拆分 / 整合计划

## 一、总体目标

将代码库收敛为以下清晰结构：

```text
Git 内容源
  ├── content/posts/**/*.md
  ├── content/photo-gallery/**/album.yaml
  └── content/photo-gallery/**/images/*.webp
          │
          ▼
内容检查 / 媒体准备 / Gallery 索引
          │
          ▼
Publish Workflow
  ├── Post Publish Service
  ├── Gallery Publish Service
  ├── Publish Lock
  └── Publish Run Repository
          │
          ├── PostgreSQL 运行时副本
          └── Cloudinary 媒体 CDN
```

执行流程统一为：

```text
bun run publish:tui
        │
        ├── 检查内容
        ├── 显示问题和修复建议
        ├── 执行显式修复命令
        ├── 用户确认生成文件
        ├── 检查 Git diff
        ├── 执行 publish dry-run
        └── 用户确认后执行真实 publish
```

非交互式场景使用：

```bash
bun run publish -- --scope all --dry-run --json
bun run publish -- --scope all
```

---

# 二、最终保留的职责边界

## 1. 内容源工具

负责 Git 工作区中的内容，不接触数据库：

```text
scripts/check-content.ts
scripts/format-content.ts
scripts/prepare-media.ts
scripts/gallery-index.ts
scripts/verify-content.ts
```

职责如下：

| 工具 | 唯一职责 |
|---|---|
| `content:check` | 检查 Markdown、Frontmatter、Gallery 配置、图片路径和 slug |
| `content:format` | 格式化 Frontmatter 和 `album.yaml` |
| `content:prepare-media` | 原始图片转换为 Git 管理的 WebP |
| `gallery:index` | 生成 `gallery.yaml` |
| `content:verify` | 串联检查、dry-run 和 Git 检查 |

## 2. Publish 工具

```text
scripts/publish.ts
scripts/publish-tui.ts
src/lib/publish/*
```

其中：

- `publish.ts`：机器可读、脚本化发布入口；
- `publish-tui.ts`：用户维护习惯引导入口；
- `src/lib/publish`：唯一发布业务实现。

明确保留 `publish:tui`，不将其视为待删除的旧入口。

## 3. 运维工具

```text
scripts/audit-docs.ts
scripts/audit-migrations.ts
scripts/init-content.ts
scripts/reset-admin-password.ts
scripts/reset-db.ts
```

这些工具不属于内容发布业务，可以独立保留。

---

# 三、第一阶段：立即删除无效实现

这一阶段不改变正式流程，风险最低。

## 1. 删除旧的独立 Cloudinary 上传脚本

删除：

```text
scripts/upload-to-cloudinary.ts
```

同时清理：

```text
scripts/README.md
```

中的：

```text
bun run scripts/upload-to-cloudinary.ts
```

原因：

- 没有正式 package script；
- 只处理 Post 图片；
- 与 Publish 内部 Cloudinary 上传重复；
- 容易形成第二个媒体发布入口；
- 当前正式架构要求媒体随着 Publish 一起处理。

正式入口统一为：

```bash
bun run publish -- --scope posts
bun run publish -- --scope galleries
```

---

## 2. 删除数据库到 Markdown 的 write-back 模块

删除：

```text
src/lib/frontmatter-writeback.ts
```

需要同步清理：

- 历史测试；
- 非历史文档中的 `writeBackPostPoster` 示例；
- `ENABLE_LEGACY_CONTENT_WRITEBACK` 相关说明；
- Dashboard 中任何与 poster write-back 相关的残留入口。

保留现有禁用 Action 的提示：

```text
文章内容源由 Git 管理，请直接编辑 Markdown 后通过 publish 发布。
```

---

## 3. 删除旧三方合并实现

删除：

```text
src/lib/sync/sync-merge.ts
```

原因：

- 当前没有有效生产调用方；
- `mergeSyncFields()` 属于旧的 base/local/remote 三方合并；
- 当前架构明确禁止新增 merge、冲突解决和字段级同步；
- 新 Publish 类型也不应包含 `SyncConflict`、`CONFLICT`、`REMOTE_ONLY` 等协议。

同时删除或清理：

```text
SyncConflict
ThreeWayStatus
ThreeWayResult
mergeBase
```

注意：数据库字段删除需要按现有 migration 流程处理，不能仅删除 TypeScript 类型。

---

## 4. 删除未使用的旧 Sync Hash 工具

删除：

```text
src/lib/sync/sync-hash.ts
```

原因：

- 当前没有有效调用方；
- Gallery 已在自己的媒体处理流程中计算 hash；
- `syncContentHash()` 只是旧同步协议辅助函数。

如果未来确实需要内容 hash，应在对应领域重新定义：

```text
src/lib/publish/content-hash.ts
```

但当前没有必要提前保留抽象。

---

## 5. 删除未使用的 Gravatar Profile API

保留：

```ts
getGravatarAvatarUrl()
```

删除：

```ts
getGravatarProfile()
GravatarProfile
GetGravatarOptions
```

原因：

- 当前头像切换只需要 Gravatar avatar URL；
- Profile API 需要额外 `GRAVATAR_API_KEY`；
- 当前没有实际 UI 或 Action 调用；
- 历史计划中提到的“未来打开 Gravatar 个人资料”尚未成为产品需求。

---

# 四、第二阶段：整合重复的内容修复脚本

这一阶段重点解决“多个命令做相近事情”的问题。

## 1. 删除 `prepare-post-frontmatter.ts`

当前文件：

```text
scripts/prepare-post-frontmatter.ts
```

已有正式替代能力：

```bash
bun run content:check -- --fix
```

以及 `check-content.ts` 中已有的 Frontmatter 生成逻辑。

### 迁移方式

将测试中的：

```ts
preparePostFrontmatter()
```

改为测试：

```text
checkContent()
```

或者将纯函数提取到：

```text
src/lib/content/post-frontmatter.ts
```

建议最终结构：

```text
src/lib/content/post-frontmatter.ts
  ├── generateTitleFromFileName
  ├── normalizeTags
  ├── buildStandardFrontmatter
  └── parseStatusType
```

脚本只负责调用，不重复实现 Frontmatter 规则。

### 删除后保留的命令

```bash
bun run content:check
bun run content:check -- --fix
```

---

## 2. 整合 `rebuild-content.ts`

当前有三个相近能力：

```text
scripts/check-content.ts --fix
scripts/rebuild-content.ts
scripts/gallery-index.ts
```

建议将职责拆为：

```text
content:check --fix
  → 修复或补齐 album.yaml

gallery:index
  → 生成 gallery.yaml
```

然后删除：

```text
scripts/rebuild-content.ts
```

### 发布助手的修复命令调整

当前 `publish-repair.ts` 对 `ALBUM_REBUILD_REQUIRED` 返回：

```text
scripts/rebuild-content.ts
```

应改成：

```text
scripts/check-content.ts
--scope galleries
--fix
--no-examples
```

或者更清晰地新增：

```text
scripts/gallery-repair.ts
```

我的建议是优先使用已有 `check-content.ts --fix`，避免为了替代一个小脚本再增加新入口。

### 推荐最终命令

```bash
bun run content:check -- --scope galleries --fix --no-examples
bun run gallery:index
```

---

## 3. 保留 `gallery-index.ts`

不要把 `gallery.yaml` 生成隐式塞进 Publish。

原因：

- `gallery.yaml` 是 Git 工作区文件；
- Publish 不应悄悄修改工作区；
- 用户需要通过 Git diff 审查生成结果；
- Publish Assistant 可以明确展示“已生成文件，请检查 diff”。

因此：

```text
album.yaml 修复 → content:check --fix
gallery.yaml 生成 → gallery:index
真实发布 → publish
```

边界清晰。

---

# 五、第三阶段：整合 `verify-content` 和 `prepare-content`

当前两个脚本职责高度重叠：

```text
scripts/verify-content.ts
scripts/prepare-content.ts
```

## 当前差异

`verify-content.ts`：

```text
检查安全边界
检查内容
格式预览
Gallery 索引预览
Post dry-run
Gallery dry-run
全站 dry-run
git diff --check
```

`prepare-content.ts`：

```text
检查安全边界
检查内容
格式预览
Gallery 索引预览
全站 dry-run
git diff --check
```

## 推荐方案

删除：

```text
scripts/prepare-content.ts
```

保留：

```text
scripts/verify-content.ts
```

原因：

- `content:verify` 已被 CI、文档和架构基线使用；
- `verify-content.ts` 覆盖更完整；
- `content:prepare` 与 `content:verify` 对用户来说不容易区分；
- 当前正式架构强调 `content:verify`，没有必要保留两个提交前检查入口。

### package.json 调整

删除：

```json
"content:prepare": "bun run scripts/prepare-content.ts"
```

### Publish Assistant 不受影响

必须保留：

```json
"publish:tui": "bun run scripts/publish-tui.ts"
```

Publish Assistant 不是 `prepare-content` 的替代品，而是交互式维护流程。

---

# 六、第四阶段：清理 Dashboard 旧内容能力

这是删除旧兼容模块的前置阶段。

当前 `src/lib/actions/posts-admin.ts` 仍保留以下旧能力：

```text
exportPostsZipAction
getRemotePostDiffAction
triggerManualSync
旧 SyncResult 返回
```

## 1. 删除数据库文章导出

删除：

```ts
exportPostsZipAction()
```

然后删除：

```text
src/lib/post-exporter.ts
```

原因：

- 数据库导出不能作为 Git 内容恢复方式；
- 当前正式恢复方式是 Git revert、tag、branch 或仓库备份；
- 数据库不是人工内容源；
- `post-exporter.ts` 只被这个 Action 使用。

同步删除：

```text
JSZip 相关 import
@types/jszip
jszip 依赖
```

但需要确认项目其他地方没有使用 `jszip` 后再移除依赖。

---

## 2. 删除远端 Post Diff

删除：

```ts
getRemotePostDiffAction()
```

然后删除：

```text
src/lib/content-diff.ts
```

同步删除 Dashboard 中：

- “远端差异”页面；
- “本地 / 远端冲突”展示；
- `LOCAL_ONLY`；
- `REMOTE_ONLY`；
- `CONFLICT`；
- `IN_SYNC` 对比逻辑。

原因：

Git-first 架构不再把数据库视为需要与本地内容合并的来源。

如果仍希望显示运行状态，应改为展示：

```text
最近 Publish 运行
sourceMissing
发布状态
数据库副本状态
Cloudinary 上传结果
```

而不是比较数据库和 Markdown 的更新时间。

---

## 3. 将 `triggerManualSync()` 改名

当前函数：

```ts
triggerManualSync()
```

建议改为：

```ts
triggerPublish()
```

返回值直接使用：

```ts
PublishSummary
```

不再返回：

```ts
SyncResult
```

调用：

```ts
runPublishWorkflow({
  scope: 'posts',
  triggeredBy: 'DASHBOARD',
  actorId: session.user.id,
  dryRun: ...
})
```

### 迁移后删除

```text
src/lib/publish/publish-legacy.ts
src/lib/sync/sync-result.ts
```

以及：

```text
legacySyncResultFromPublish()
failedSyncResult()
```

如果 Dashboard 仍需要失败结果，使用 Publish 领域的统一结果：

```ts
type PublishWorkflowResult =
  | { kind: 'validation'; report: ValidationReport }
  | { kind: 'published'; summary: PublishSummary }
```

---

# 七、第五阶段：将 Publish 从 Sync 核心中解耦

这是整个计划的核心阶段。

当前：

```text
publish-workflow
  → runSync
  → sync-orchestrator
      → ContentSyncService
      → gallery-sync-service
      → sync-lock
      → sync-repository
```

目标：

```text
publish-workflow
  → publish-service
      ├── post-publish-service
      ├── gallery-publish-service
      ├── publish-lock
      ├── publish-run-repository
      └── publish-summary
```

---

## 1. 新建 Post Publish Service

建议新增：

```text
src/lib/publish/post-publish-service.ts
```

职责：

- 扫描 Post Markdown；
- 解析 Frontmatter；
- 生成 slug；
- 解析正文图片；
- 调用媒体上传服务；
- 写入 `Post`；
- 写入 Tag；
- 返回 Post 发布摘要；
- 报告 source missing；
- 不执行数据库回写 Markdown；
- 不执行 merge；
- 不执行实体级 retry。

从：

```text
src/lib/sync-service.ts
```

迁移以下能力：

```text
scanMarkdownFiles
parseMarkdown
resolveAndUploadImage
resolveMarkdownImages
savePostsToDb
```

---

## 2. 新建 Gallery Publish Service

建议新增：

```text
src/lib/publish/gallery-publish-service.ts
```

职责：

- 读取 `album.yaml`；
- 读取 Git 管理的 WebP；
- 上传 Gallery WebP；
- 写入 `Gallery`；
- 写入 `GalleryImage`；
- 计算并保存必要 hash；
- 返回 Gallery 发布摘要；
- 仅报告 source missing；
- 不修改 `album.yaml`；
- 不修改 `gallery.yaml`；
- 不自动删除 Cloudinary；
- 不自动归档暂时缺失内容。

从：

```text
src/lib/gallery/gallery-sync-service.ts
```

迁移数据库发布和 Cloudinary 发布能力。

---

## 3. 抽取媒体准备模块

当前：

```text
scripts/prepare-media.ts
  → gallery-sync-service.ts
```

建议迁移为：

```text
src/lib/gallery/media-preparation.ts
```

负责：

```ts
prepareGalleryImage()
```

包括：

- Sharp 转 WebP；
- 最大尺寸限制；
- EXIF 读取和隐私处理；
- hash；
- width / height；
- mtime；
- 输出文件名。

这样脚本依赖变为：

```text
prepare-media.ts
  → gallery/media-preparation.ts
```

而不是依赖带有数据库和同步语义的服务。

---

## 4. 抽取 Post 媒体上传模块

建议新增：

```text
src/lib/publish/media-upload.ts
```

职责：

- 接收图片 Buffer；
- 处理 WebP；
- 上传 Cloudinary；
- 统一处理 Cloudinary 配置；
- 返回 URL / publicId；
- dry-run 时不上传。

这样 Post 和 Gallery 可以共享底层上传能力，但不共享完整发布流程。

---

# 八、第六阶段：迁移锁和运行记录

## 1. 新建 Publish Lock

新增：

```text
src/lib/publish/publish-lock.ts
```

迁移：

```text
src/lib/sync/sync-lock.ts
```

目标命名：

```text
acquirePublishLock()
publishLockKey()
```

Publish 对外不再出现：

```text
SyncScope
SyncTrigger
```

改用：

```text
PublishScope
PublishTrigger
```

### 注意

当前真实 Publish 仍然需要并发保护，因此不能简单删除锁逻辑。

---

## 2. 新建 Publish Run Repository

当前：

```text
src/lib/sync/sync-repository.ts
```

建议先迁移为：

```text
src/lib/publish/publish-run-repository.ts
```

第一阶段可以继续写入现有：

```text
SyncRun
```

这是兼容期的内部存储，不要求立即修改数据库表。

未来如果确认不再需要旧表名，再考虑：

```text
SyncRun → PublishRun
```

或者：

```text
SyncRun → publish_runs
```

数据库表重命名需要单独 migration，不应与 TypeScript 重构混在同一个变更中。

---

## 3. 迁移 Publish Summary

当前：

```text
src/lib/publish/publish-summary.ts
  → SyncRunSummary
```

应改为：

```text
PublishSummary
```

不再使用：

```ts
publishSummaryFromSync()
```

最终删除：

```text
src/lib/sync/sync-types.ts
```

前提是所有以下类型已经迁移：

```text
SyncScope
SyncTrigger
SyncRunSummary
PostSyncSummary
GallerySyncSummary
SyncRunStatus
SyncConflict
PersistedSyncRun
```

---

# 九、第七阶段：删除旧 Sync 目录和服务

完成前面迁移后，执行最终删除：

```text
src/lib/sync-service.ts
src/lib/sync/sync-orchestrator.ts
src/lib/sync/sync-errors.ts
src/lib/sync/sync-lock.ts
src/lib/sync/sync-repository.ts
src/lib/sync/sync-result.ts
src/lib/sync/sync-types.ts
src/lib/sync/sync-merge.ts
src/lib/sync/sync-hash.ts
src/lib/gallery/gallery-sync-service.ts
```

删除条件必须全部满足：

- `publish-workflow.ts` 不再导入 `runSync`；
- `publish-summary.ts` 不再导入 `SyncRunSummary`；
- `src/types/publish/publish.ts` 不再导入 Sync 类型；
- Dashboard 不再返回 `SyncResult`；
- `posts-admin.ts` 不再导入 `failedSyncResult`；
- `sync-admin.ts` 已迁移到 Publish Run 查询；
- `prepare-media.ts` 不再依赖 `gallery-sync-service.ts`；
- 没有任何生产代码导入旧 Sync 文件；
- 测试不再验证旧 Sync 兼容转换；
- 文档不再把旧 Sync 路径描述为当前正式架构。

---

# 十、Publish Assistant 的保留与重定位

## 1. 明确保留

保留：

```text
scripts/publish-tui.ts
src/lib/publish/publish-repair.ts
tests/publish-assistant.test.ts
```

保留 package script：

```json
"publish:tui": "bun run scripts/publish-tui.ts"
```

## 2. Publish Assistant 的产品定位

它不是：

```text
新的同步入口
新的内容编辑器
新的发布实现
数据库管理工具
```

它是：

```text
交互式维护流程教练
```

帮助用户形成以下习惯：

```text
检查 → 修复 → 人工确认 → 看 Git diff → dry-run → 正式发布
```

## 3. 建议的 TUI 固定流程

```text
1. 选择 scope
2. 检查工作区安全边界
3. 检查 Post / Gallery 内容
4. 显示第一个问题及建议
5. 用户确认后执行显式修复命令
6. 提示用户查看生成文件
7. 重新执行检查
8. 检查 git status
9. 执行 git diff --check
10. 执行 publish dry-run
11. 用户确认后执行真实 publish
12. 输出发布摘要
```

## 4. TUI 不应承担的职责

TUI 不应直接实现：

```text
Post 解析
Gallery 写库
Cloudinary 上传
数据库锁
SyncRun 写入
Markdown 修改
album.yaml 自动编辑
```

这些都必须调用统一的 Publish 或内容工具。

## 5. TUI 修复命令最终建议

```text
FRONTMATTER_REBUILD_REQUIRED
  → bun run content:check -- --scope posts --fix --no-examples

ALBUM_REBUILD_REQUIRED
  → bun run content:check -- --scope galleries --fix --no-examples

MEDIA_PREPARATION_REQUIRED
  → bun run content:prepare-media -- --album <safe-album>

GALLERY_INDEX_REQUIRED
  → bun run gallery:index
```

每次自动修复后必须：

```text
提示用户检查文件
重新运行 validateForPublish()
```

不能认为脚本退出码为 0 就代表内容已经正确。

---

# 十一、推荐的最终脚本目录

```text
scripts/
├── audit-docs.ts
├── audit-migrations.ts
├── check-content.ts
├── content-verify-utils.ts
├── format-content.ts
├── gallery-index.ts
├── init-content.ts
├── prepare-media.ts
├── publish-tui.ts
├── publish.ts
├── README.md
├── reset-admin-password.ts
├── reset-db.ts
└── verify-content.ts
```

建议删除：

```text
upload-to-cloudinary.ts
prepare-post-frontmatter.ts
rebuild-content.ts
prepare-content.ts
```

其中：

- 前三个属于重复或错误入口；
- `prepare-content.ts` 与 `verify-content.ts` 重复度过高；
- `publish-tui.ts` 明确保留。

---

# 十二、推荐的最终 `src/lib` 结构

```text
src/lib/
├── actions/
│   ├── comments.ts
│   ├── content.ts
│   ├── dashboard.ts
│   ├── deletion-admin.ts
│   ├── gallery-image-comments.ts
│   ├── posts-admin.ts
│   ├── profile.ts
│   ├── snapshot-admin.ts
│   ├── user-portal.ts
│   └── ...
│
├── content/
│   ├── content-safety.ts
│   ├── post-frontmatter.ts
│   └── post-types.ts
│
├── gallery/
│   ├── cloudinary.ts
│   ├── exif.ts
│   ├── gallery-parser.ts
│   ├── gallery-public.ts
│   ├── gallery-queries.ts
│   └── media-preparation.ts
│
├── publish/
│   ├── gallery-publish-service.ts
│   ├── media-upload.ts
│   ├── post-publish-service.ts
│   ├── publish-errors.ts
│   ├── publish-lock.ts
│   ├── publish-repair.ts
│   ├── publish-run-repository.ts
│   ├── publish-service.ts
│   ├── publish-summary.ts
│   ├── publish-types.ts
│   ├── publish-validation.ts
│   └── publish-workflow.ts
│
├── snapshot/
├── constants/
├── db/
├── deletion/
├── docs/
├── hooks/
├── auth.ts
├── auth-client.ts
├── content-providers.ts
├── content-queries.ts
├── generate-avatar.ts
├── get-avatar.ts
├── logger.ts
├── post-metadata.ts
├── public-user.ts
├── query-client.ts
├── seo.ts
├── slug.ts
├── store.ts
├── theme.ts
└── utils.ts
```

最终删除：

```text
content-diff.ts
frontmatter-writeback.ts
post-exporter.ts
sync-service.ts
sync/
gallery/gallery-sync-service.ts
```

---

# 十三、测试迁移计划

## 第一批：删除无效能力测试

删除或改写：

```text
frontmatter write-back 测试
sync merge 测试
database export 测试
remote diff 测试
```

## 第二批：增强 Publish 边界测试

重点增加：

```text
publish dry-run 不写工作区
publish dry-run 不连接数据库
publish dry-run 不上传 Cloudinary
publish dry-run 不创建 SyncRun
publish 不执行 Markdown write-back
publish 不执行 album.yaml write-back
publish 不执行 gallery.yaml 隐式生成
publish 不自动删除 source missing 内容
```

## 第三批：增强 Publish Assistant 测试

保留并扩展：

```text
scope 解析
修复命令固定且安全
相册名路径注入防护
修复后要求重新检查
TUI 使用统一 Publish Workflow
TUI 不实现独立发布逻辑
```

## 第四批：拆分服务测试

新增纯函数或服务测试：

```text
Post Frontmatter 解析
Post slug 生成
Post metadata 归一化
Gallery WebP 生成
Gallery source missing 报告
Cloudinary dry-run 跳过上传
Publish summary 生成
Publish lock 冲突
```

---

# 十四、推荐执行顺序总表

| 阶段 | 动作 | 风险 |
|---|---|---|
| 1 | 删除旧 Cloudinary 脚本、write-back、sync hash、sync merge | 低 |
| 2 | 删除未使用的 Gravatar Profile API | 低 |
| 3 | 将 Frontmatter 逻辑迁移到内容模块，删除 `prepare-post-frontmatter` | 低 |
| 4 | 将 Gallery 修复整合到 `check-content --fix`，删除 `rebuild-content` | 中 |
| 5 | 删除 `prepare-content`，统一 `content:verify` | 中 |
| 6 | 删除 Dashboard 数据库导出 | 中 |
| 7 | 删除 Dashboard 远端 Diff | 中 |
| 8 | Dashboard 从 `SyncResult` 迁移到 `PublishSummary` | 中 |
| 9 | 删除 `content-diff`、`post-exporter`、`publish-legacy`、`sync-result` | 中 |
| 10 | 拆分 Post Publish Service | 高 |
| 11 | 拆分 Gallery Publish Service 和媒体准备 | 高 |
| 12 | 迁移锁和运行记录到 Publish 命名空间 | 高 |
| 13 | 删除 `sync-service.ts` 和 `sync/` | 高 |
| 14 | 删除旧 Gallery Sync Service | 高 |
| 15 | 清理 schema、类型、baseline 和文档 | 高 |

---

# 十五、每一阶段的验收标准

每完成一个阶段，都执行：

```bash
bun run lint
bun run content:check -- --no-examples
bun run content:verify
bun run test
bunx tsc --noEmit --pretty false
bun run build
bun run docs:audit
bun run db:audit-migrations
```

涉及 Publish 或媒体时增加：

```bash
bun run publish -- --scope all --dry-run --json
bun run publish:tui -- --dry-run
```

最终需要验证：

```text
没有生产代码引用旧 Sync 文件
没有数据库到 Markdown/YAML 的回写
没有独立 Cloudinary 发布入口
没有数据库与 Git 内容 diff UI
没有旧三方 merge
publish:tui 仍然可以完成完整维护流程
CLI、TUI、Dashboard 仍复用同一个 Publish Workflow
dry-run 仍然完全只读
```

---

# 最终建议

最合理的实施策略不是一次性删除整个 `src/lib/sync/`，而是：

```text
先删除无调用方的旧能力
→ 合并重复脚本
→ 清理 Dashboard 旧内容能力
→ 迁移 Publish 类型和返回值
→ 拆分 Post / Gallery Publish Service
→ 迁移锁与运行记录
→ 最后删除 Sync 核心
```

同时明确：

```text
publish.ts       = 非交互式正式入口
publish-tui.ts   = 保留的交互式维护教练
content:verify   = 自动化验证入口
content:check    = 内容检查与显式修复入口
gallery:index    = Gallery 索引生成入口
prepare-media    = 原始图片到 WebP 的媒体准备入口
```

这样可以在不牺牲 Publish Assistant 用户体验的前提下，逐步消除旧 Sync 体系、重复脚本和 Dashboard 内容编辑残留。