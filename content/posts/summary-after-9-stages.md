---
title: stage9 之后的架构与内容发布治理总结
slug: summary-after-9-stages
date: 2026-09-13
tags:
  - architecture
  - content-publishing
  - sync
  - Next.js
status: published
excerpt: 总结 Stage 9 之后博客与 Gallery 的架构现状、同步边界、发布流程、恢复策略和后续治理建议。
---
# 总体判断

Stage 9 之后，项目已经具备了较完整的“内容源 → 校验 → 同步 → 数据库运行时副本 → Dashboard → 快照恢复”架构，工程治理明显比早期成熟。

但从“一个人长期使用、方便写文章和管理照片”的角度看，目前最大的问题不是缺少功能，而是：

> **系统的安全边界和工程抽象越来越完整，但日常使用路径仍然偏复杂；同时部分关键的“dry-run、同步、恢复、CI 只读”语义并没有完全落实。**

目前更像是一个小型内容发布平台，而不是一个足够轻便的个人博客/Gallery 工具。

我将问题按优先级分为：

- **P0：可能造成内容被意外修改、数据不一致或错误发布**
- **P1：明显影响日常使用便利性和维护成本**
- **P2：架构复杂度、测试覆盖和长期演进风险**

---

# 一、P0：需要优先处理的问题

## 1. `dry-run` 并不是真正只读

这是目前最值得优先修复的问题。

Stage 9 文档和 README 将 `dry-run` 描述为预览、不写入，但实际链路中存在多个写入行为。

### 1.1 Post dry-run 可能修改本地 Markdown

`scripts/sync-content.ts` 中，无论是否开启 `--dry-run`，都会先执行：

```ts
if (scope === 'POSTS' || scope === 'ALL') await writeBackDatabasePosters()
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\scripts\sync-content.ts:63
```

`writeBackDatabasePosters()` 会调用：

```ts
writeBackPostPoster(localPost.path, databasePost.poster)
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\scripts\sync-content.ts:76-101
```

这意味着以下命令理论上可能修改本地内容：

```bash
bun run sync -- --scope posts --dry-run
bun run content:verify
bun run content:prepare
```

而 `content:verify` 和 `content:prepare` 都明确宣称不会写入内容。

这会造成几个问题：

- CI 的 dry-run 可能修改工作区；
- 执行验证命令后出现未预期的 Markdown diff；
- 数据库中的封面 URL 可能覆盖本地 frontmatter；
- 用户很难判断“验证命令是否安全”。

### 建议

将“数据库封面回写”明确拆成独立操作：

```text
dry-run       永远不允许 write-back
sync          只在显式开启 write-back 时执行
dashboard     由用户主动点击“回写本地源文件”
```

至少应将逻辑改为：

```ts
if (!dryRun && (scope === 'POSTS' || scope === 'ALL')) {
  await writeBackDatabasePosters()
}
```

更好的设计是增加显式参数：

```bash
bun run sync -- --scope posts --write-back
```

默认同步不回写，避免数据库内容意外反向修改 Git 内容源。

---

## 2. Gallery dry-run 也可能产生文件系统副作用

`gallery-sync-service.ts` 中，在处理相册时无条件执行：

```ts
await fs.mkdir(path.join(albumDirectory, 'images'), { recursive: true })
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\gallery\gallery-sync-service.ts:240
```

该操作发生在判断 `dryRun` 之前，因此 Gallery dry-run 可能：

- 创建新的相册目录；
- 创建 `images/` 目录；
- 改变工作区目录结构；
- 在某些异常场景下留下半成品目录。

此外，真正同步时还会写入：

```ts
await fs.writeFile(outputPath, prepared.buffer)
await fs.writeFile(config.configPath, ...)
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\gallery\gallery-sync-service.ts:288、414-422
```

这些写操作有 `!dryRun` 保护，但目录创建没有。

### 建议

所有文件系统写操作必须统一经过一个安全层，例如：

```ts
if (!dryRun) {
  await fs.mkdir(...)
}
```

并且在代码审查中建立约束：

```text
dryRun=true 时：
- 不能写 Markdown
- 不能写 YAML
- 不能创建目录
- 不能写 WebP
- 不能上传 Cloudinary
- 不能修改数据库业务数据
```

---

## 3. CI 所谓“只读质量门禁”实际上会写入数据库

`.github/workflows/quality.yml` 执行：

```bash
bun run content:verify
```

而 `content:verify` 会执行多次：

```bash
bun run scripts/sync-content.ts --scope posts --dry-run
bun run scripts/sync-content.ts --scope galleries --dry-run
bun run scripts/sync-content.ts --scope all --dry-run
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\scripts\verify-content.ts:31-66
```

但 `runSync()` 即使是 dry-run，仍然会：

1. 获取数据库同步锁；
2. 创建 `SyncRun`；
3. 执行同步逻辑；
4. 最后更新 `SyncRun` 状态。

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\sync\sync-orchestrator.ts:55-66
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\sync\sync-orchestrator.ts:140-143
```

`acquireSyncLock()` 也会调用：

```ts
await createSyncRun(...)
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\sync\sync-lock.ts:23-37
```

因此，Stage 9 文档中“质量门禁只读”的表述并不准确：

> CI 不会修改内容源，但会修改 Neon 数据库中的 SyncRun 运行记录。

这会导致：

- 每次 PR 产生多条 dry-run 运行记录；
- 真实运行历史被大量验证记录污染；
- CI 依赖真实数据库；
- 并行 PR 可能互相争用同步锁；
- CI dry-run 可能因为数据库锁而失败；
- 所有开发者都需要配置数据库和 Cloudinary secrets 才能跑内容校验。

### 建议

dry-run 分成两种模式：

```text
local dry-run：
  不连接数据库，不创建 SyncRun，不使用 Cloudinary

release dry-run：
  可以连接数据库，但必须显式开启

real sync：
  创建 SyncRun、获取锁、写数据库
```

或者至少：

```ts
if (options.dryRun) {
  // 不 createSyncRun
  // 不 acquire database lock
}
```

如果确实需要记录 dry-run，也应该写入单独的非持久化日志，不能污染生产运行表。

---

## 4. 同步不是跨 Post/Gallery 的事务，容易出现半成功状态

Stage 9 的统一编排器提供了：

```text
POSTS
GALLERIES
ALL
PARTIAL_SUCCESS
```

但 `ALL` 并不是数据库事务。

执行逻辑是：

```ts
先同步 Posts
再同步 Galleries
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\sync\sync-orchestrator.ts:90-123
```

Gallery 同步内部也不是一个完整事务，而是逐张图片处理、逐条写数据库：

```ts
for (const sourcePath of sourceFiles) {
  ...
  await db.insert(...)
}
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\gallery\gallery-sync-service.ts:260-413
```

因此可能出现：

- 前 3 张图片上传成功，第 4 张失败；
- WebP 已经写入本地，但 Cloudinary 上传失败；
- Cloudinary 上传成功，数据库写入失败；
- Gallery 数据库写入一半后进程终止；
- Post 已同步，Gallery 未同步；
- 下一次同步依赖数据库中的不完整状态。

这不一定是错误设计，但必须明确它是：

> **可重入的最终一致同步，而不是原子发布。**

当前文档没有充分强调这一点。

### 建议

短期：

- 每个 album 建立明确的阶段状态；
- 记录 `prepared / uploaded / db-written / local-written`；
- 失败后可以安全重试；
- summary 中增加 `partial` 和失败文件列表；
- 同步前不要把业务状态直接标记为 `IN_SYNC`。

长期：

```text
Prepare
  ↓
Upload media
  ↓
Validate all media
  ↓
Commit DB transaction
  ↓
Write local generated files
```

或者使用 staging 表，成功后再切换正式版本。

---

## 5. Gallery 的 `deleteOld` 参数似乎没有真正生效

`GallerySyncOptions` 定义了：

```ts
deleteOld?: boolean
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\gallery\gallery-sync-service.ts:34-39
```

但在实际清理逻辑中，发现旧图片后直接标记：

```ts
await db
  .update(galleryImages)
  .set({ syncStatus: 'PENDING_DELETE' })
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\gallery\gallery-sync-service.ts:431-443
```

这里没有看到对 `deleteOld` 的判断。

这会造成 API 语义和用户认知不一致：

- CLI `sync-galleries` 通过 `--delete-old` 控制删除行为；
- 统一 `sync` 又传入 `deleteOld`；
- 但 Gallery 内部可能无论参数如何都标记旧资源；
- summary 中的 `pendingDelete` 也没有被实际递增。

项目文档还声称：

> 删除只会进入 `PENDING_DELETE`，不会直接删除 Cloudinary 资源。

但当前实现至少需要进一步确认：

- `deleteOld=false` 是否真的不改变状态；
- `PENDING_DELETE` 是否只是一种展示状态；
- 是否有后续确认删除流程；
- 旧数据库图片是否最终会被隐藏或继续出现在 Gallery。

### 建议

明确三种操作：

```text
默认同步：
  只新增和更新，不处理删除

标记删除：
  仅设置 PENDING_DELETE

确认清理：
  管理员明确操作后再清理数据库和 Cloudinary
```

同时让 summary 真实反映：

```text
pendingDelete
archived
skipped
deleted
```

---

# 二、P1：明显影响个人日常使用的问题

## 6. 日常内容生产路径过长，个人使用成本偏高

当前推荐流程是：

```bash
bun run content:prepare
git diff
git diff --check
git status
git add
git commit
bun run sync
```

Gallery 还需要：

```bash
放入原始图片
bun run gallery:index
bun run sync -- --scope galleries
```

实际涉及的概念和工具包括：

- Markdown
- Frontmatter
- album.yaml
- gallery.yaml
- content:check
- content:format
- content:verify
- content:prepare
- gallery:index
- sync
- sync:galleries
- Cloudinary
- PostgreSQL
- Git
- GitHub Actions
- Dashboard
- SiteSnapshot

对于一个个人博客，系统目前需要用户理解过多内部概念。

### 具体问题

#### Post 有多个入口

- 本地 Markdown
- Dashboard 文章管理
- Dashboard 上传 ZIP
- Dashboard 修改封面
- `sync`
- `sync:pull`
- 数据库导出
- frontmatter write-back

#### Gallery 也有多个入口

- `.gallery-input`
- `album.yaml`
- `gallery.yaml`
- `/dashboard/gallery`
- `gallery:index`
- `sync:galleries`
- 统一 `sync`
- `gallery:pull`

这容易产生疑问：

- 我应该改本地文件还是后台？
- 改了 Dashboard 是否会回写 Git？
- 什么时候运行 `gallery:index`？
- `sync` 和 `sync:galleries` 有什么区别？
- `content:prepare` 是否会写文件？
- 快照恢复后是否要重新同步？
- 图片已经上传 Cloudinary，为什么还要提交 WebP？

### 建议

为个人使用提供一条“推荐黄金路径”，并隐藏内部复杂度：

```bash
bun run content:publish
```

内部自动执行：

```text
检查内容
检查图片
生成 Gallery 索引
dry-run
输出 diff 摘要
要求确认
执行 Post + Gallery 同步
```

同时保留底层命令，但 README 只把一条路径作为主路径。

例如：

```bash
bun run publish
bun run publish --scope posts
bun run publish --scope galleries
bun run publish --dry-run
```

---

## 7. Stage 9 完成后，旧文档仍然描述过时架构

`AGENTS.md` 当前仍然写着：

```text
当前正在推进 Stage 5.2 / Stage 5.2.1
阶段六（规划中）：独立 Gallery 内容体系
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\AGENTS.md:18
Z:\CodeBase\projects.NEXT\zickme-blog\AGENTS.md:52-64
```

但代码和 Git 已经完成 Stage 9，且已有：

- Gallery
- Snapshot
- Sync Orchestrator
- CI
- Dashboard 快照
- 受控发布

这会导致未来 Agent 或开发者产生错误判断：

- 误认为 Gallery 还未实现；
- 重复创建已存在的功能；
- 继续依据 Stage 5.2 的目标开发；
- 不清楚 Stage 9 是否为当前基线；
- 误把旧文档中的“建议”当成待办任务。

### 建议

增加一份单一事实来源，例如：

```text
documents/project-status.md
```

包含：

```text
当前阶段：Stage 9.6
已完成能力
当前已知问题
下一阶段建议
废弃入口
```

并更新：

- `AGENTS.md`
- `README.md`
- `documents/stage8-summary.md`
- `documents/development-plan-stage8*.md`
- Stage 6/7 设计文档中的“尚未创建”描述

---

## 8. Gallery Dashboard 仍然不是完整的内容编辑器

Dashboard Gallery 页面目前主要支持：

- 修改标题；
- 修改描述；
- 修改状态；
- 查看图片；
- 标记图片待删除。

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\app\dashboard\gallery\page.tsx
```

但图片级元数据在页面上基本不可编辑：

- title
- description
- alt
- order
- hidden
- cover
- location
- EXIF 展示策略

虽然数据库中存在这些字段，但 UI 没有完整暴露。

这意味着 Gallery 仍然需要用户回到：

```text
content/photo-gallery/{album}/album.yaml
```

手动编辑。

对于个人使用来说，这会让 Dashboard 的存在价值下降：

- 文章可以在后台方便管理；
- Gallery 仍需要理解 YAML；
- 图片排序和 alt 文本不能直接拖拽或批量编辑；
- 封面切换不够直观；
- 图片预览和上传管理不完整。

### 建议

Gallery Dashboard 至少增加：

- 图片缩略图预览；
- 拖拽排序；
- alt / title / description 编辑；
- 批量隐藏；
- 设置封面；
- 图片删除确认；
- 保存前 diff 预览；
- 以 revision 为基础的冲突提示。

---

## 9. 原始图片目录被 Git 忽略，个人备份边界不够清晰

文档明确规定：

```text
原始图片放在 content/.gallery-input/
原始图片不进入 Git
```

这是保护仓库体积和隐私的合理设计，但对个人用户有一个重要风险：

> Git 仓库中没有原始照片，数据库快照中也没有 Cloudinary 二进制，Gallery 本地只保留 WebP。

因此，如果原始图片只存放在本地目录，而没有额外备份：

- 硬盘损坏后原图丢失；
- Git clone 后只有处理后的 WebP；
- Cloudinary 删除或账号异常后不能恢复原图；
- SiteSnapshot 也无法恢复原始媒体；
- Gallery 的“可恢复”实际只覆盖数据库元数据和展示图引用。

Stage 9 文档已经说明 Cloudinary 不属于数据库快照，但对个人用户来说，这个限制应该更醒目。

### 建议

增加明确的媒体备份策略：

```text
content/.gallery-input/
  → 本地备份盘 / NAS / 对象存储
content/photo-gallery/**/*.webp
  → Git
Cloudinary
  → 展示媒体和 CDN
PostgreSQL
  → 元数据和运行时副本
```

并在 Dashboard 或 README 中显示：

```text
数据库快照不包含原始图片
Cloudinary 不等于原图备份
```

---

## 10. 快照恢复容易造成“数据库恢复成功，但下一次同步又覆盖”的误解

项目已经正确地在界面中提示：

```text
快照只保存运行时业务副本，不回滚 Markdown、album.yaml、代码或 Cloudinary 媒体。
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\app\dashboard\snapshots\page.tsx:15-18
```

这条边界是正确的，但用户流程仍然比较危险：

```text
恢复数据库快照
  ↓
下一次 sync
  ↓
Markdown / album.yaml 再次覆盖数据库
```

这实际上不是传统意义上的完整回滚，而是：

> 恢复运行时数据库副本。

个人用户可能会自然理解为“恢复网站到昨天状态”，但实际：

- 文章源文件没有回滚；
- Gallery 源文件没有回滚；
- Cloudinary 文件没有回滚；
- 下次发布会再次覆盖恢复结果；
- 生成的 `gallery.yaml` 和 WebP 状态也可能与快照不一致。

### 建议

恢复成功后增加状态提示：

```text
已恢复数据库运行时副本。
人工内容源仍为当前版本。
在下一次同步前，请检查：
- git diff
- content:verify
- gallery:verify
```

更进一步，可以在恢复后生成一个“内容源与数据库不一致”状态，阻止直接发布，直到用户明确确认。

---

## 11. CI 依赖真实数据库和 Cloudinary，反馈链路不够轻

`.github/workflows/quality.yml` 为 `content:verify` 配置了：

```yaml
DATABASE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\.github\workflows\quality.yml:28-34
```

但这个工作流的目标是 PR/Push 质量检查。

问题是：

- PR 检查依赖外部 Neon；
- PR 检查依赖 Cloudinary 配置；
- dry-run 仍可能创建 SyncRun；
- 外部服务不可用时，代码质量检查无法完成；
- 个人项目的 CI 运维复杂度偏高；
- 可能产生真实服务调用和费用风险。

### 建议

拆成两层：

```text
quality.yml
  - lint
  - tsc
  - content parser check
  - gallery parser check
  - dry-run without DB
  - build

release-sync.yml
  - content verify
  - db migrate
  - real sync
  - Cloudinary
```

质量门禁不应该要求生产数据库连接。

---

# 三、P2：测试与架构治理风险

## 12. Stage 9 声称完成门禁，但项目没有真正的自动化测试

当前搜索结果显示：

- 没有 Vitest 配置；
- 没有 Jest 配置；
- 没有 Playwright 配置；
- 没有实际测试文件；
- `package.json` 没有 `test` 脚本；
- CI 没有执行测试。

目前质量门禁主要是：

```bash
bun run lint
bunx tsc --noEmit
bun run content:verify
bun run build
```

这些可以验证：

- 代码能编译；
- 当前内容能解析；
- 构建能通过。

但无法验证：

- Snapshot restore 是否真的正确；
- PRE_RESTORE 是否一定创建；
- 非 ADMIN 是否无法操作；
- revision 冲突是否有效；
- Gallery 删除状态是否正确；
- dry-run 是否写入文件；
- SyncRun 锁是否存在竞态；
- `ALL` 失败时状态是否准确；
- Post/Gallery 旧入口与统一入口是否等价。

`documents/development-plan-stage9.md` 本身也明确提到需要测试：

```text
补齐 content parser、Post snapshot/hash、Gallery parser/hash、SyncRun/TTL 锁、Snapshot create/restore、ADMIN Action 和 CLI 默认 ALL 测试
```

但实际项目尚未落地。

### 建议优先增加的测试

#### 纯函数测试

- `slug.ts`
- `gallery-parser.ts`
- `snapshot-safety.ts`
- `sync-types.ts`
- `content-diff.ts`
- `post-metadata.ts`

#### 同步行为测试

- dry-run 不写文件；
- dry-run 不写数据库；
- `--scope posts` 不处理 Gallery；
- `--scope galleries` 不处理 Post；
- `ALL` 的成功/部分成功/失败状态；
- lock TTL 和 stale run；
- retry 只按 scope 重试。

#### 快照测试

- 创建快照不包含认证表；
- hash 稳定；
- payload 被修改后恢复失败；
- 恢复前自动生成 PRE_RESTORE；
- 恢复失败事务回滚；
- 默认不恢复评论；
- includeComments 的行为正确；
- 至少保留一个可恢复快照。

#### E2E 测试

- ADMIN 能访问 Dashboard；
- 普通用户不能执行快照操作；
- Gallery 发布/草稿状态；
- 文章同步页面；
- 移动端基本操作。

---

## 13. 同步锁存在检查与创建之间的竞态窗口

`acquireSyncLock()` 当前逻辑是：

```ts
先查询是否存在 active run
再 insert 新 SyncRun
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\sync\sync-lock.ts:23-37
```

两个进程可能同时执行：

```text
进程 A：查询，无活动运行
进程 B：查询，无活动运行
进程 A：插入
进程 B：插入
```

当前数据库层没有看到针对 `lockKey` 的唯一活动锁约束，也没有数据库 advisory lock。

这在以下场景尤其容易发生：

- GitHub Actions 和 Dashboard 同时触发；
- CLI 和 Dashboard 同时触发；
- 两个 workflow 并行；
- Neon 网络延迟下的并发请求。

### 建议

可以采用以下方案之一：

1. PostgreSQL advisory lock；
2. 单独的同步锁表；
3. 数据库唯一约束 + 状态条件；
4. `INSERT ... ON CONFLICT` 原子抢锁；
5. 使用带条件的 `UPDATE ... WHERE status != RUNNING`。

目前的 TTL 只能解决“进程死掉后最终释放”，不能解决“两个进程同时抢锁”。

---

## 14. Snapshot 恢复的安全性主要依赖应用层，数据库层保护不足

删除快照流程是：

1. 查询快照；
2. 查询可恢复快照数量；
3. 更新为 `DELETED`。

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\actions\snapshot-admin.ts:98-119
```

两个管理员请求并发时可能出现：

```text
请求 A：发现可恢复快照数量为 2
请求 B：发现可恢复快照数量为 2
请求 A：删除一个
请求 B：再删除一个
```

最终可能低于“至少保留一个可恢复快照”的约束。

个人系统虽然通常只有一个管理员，但这仍然属于逻辑完整性风险。

此外，`PRE_RESTORE` 的“不可删除”也是应用层判断，不是数据库约束。

### 建议

使用事务和行锁，或者改为数据库函数/存储过程原子完成：

```text
SELECT ... FOR UPDATE
检查可恢复数量
检查 source/status
执行软删除
```

---

## 15. 生产代码和 references 遗留代码混在仓库中，增加理解成本

项目中存在大量：

```text
references/
references/old-documents/
references/deprecated_payload_documents/
references/api/
```

搜索结果还显示这些目录中存在：

- 旧 API；
- 旧 Prisma 代码；
- 旧 Payload 配置；
- 旧认证实现；
- 裸 `console.error`；
- 与当前架构相矛盾的文档。

例如：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\references\api\blog\[slug]\route.ts
Z:\CodeBase\projects.NEXT\zickme-blog\references\payload\payload.config.ts
```

这类文件如果不会参与构建，应该明确隔离；否则会带来：

- 搜索结果噪声；
- Agent 误引用旧代码；
- 代码审查误判；
- 依赖关系分析困难；
- Biome 扫描范围扩大；
- 新人不清楚哪些代码仍然有效。

### 建议

二选一：

#### 方案 A：移出代码仓库

迁移到：

```text
documents/archive/
```

只保留文档和历史说明。

#### 方案 B：保留但明确隔离

在 README 和目录中标注：

```text
references/ 仅供历史参考，不参与构建，不得直接复用
```

同时从 Biome、TypeScript 和搜索范围中排除。

---

## 16. 日志和错误协议仍未完全统一

项目已经有：

```text
src/lib/logger.ts
```

但 Dashboard 同步页面中仍有：

```ts
console.error(err)
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\app\dashboard\sync\page.tsx:114-116
Z:\CodeBase\projects.NEXT\zickme-blog\src\app\dashboard\sync\page.tsx:222-224
```

同步 Action 也存在直接返回异常消息的情况：

```ts
error: error instanceof Error ? error.message : '启动同步失败'
```

位置：

```text
Z:\CodeBase\projects.NEXT\zickme-blog\src\lib\actions\sync-admin.ts:120-124
```

这可能将内部错误信息直接暴露给用户。

另外，项目的错误码体系虽然在 Stage 文档中规划了：

```text
INVALID_INPUT
CONTENT_INVALID
DATABASE_UNAVAILABLE
LOCKED
CLOUDINARY_UNAVAILABLE
WRITEBACK_CONFLICT
SNAPSHOT_INVALID
SNAPSHOT_RESTORE_FAILED
```

但实际用户界面仍然大量使用普通字符串。

### 建议

统一为：

```ts
type ActionError = {
  code: string
  message: string
  retryable?: boolean
}
```

用户只看到安全消息，详细错误进入 Logger：

```text
用户：
  同步失败，请查看运行详情

日志：
  runId
  scope
  actorId
  errorCode
  stack
  safe metadata
```

---

# 四、文档与实现之间的几个明显不一致

## 1. Stage 9 声称 CI 是只读，但 dry-run 会写 SyncRun

这属于确定的不一致。

## 2. Stage 9 声称 `content:prepare` 不写入，但 Post write-back 未跳过 dry-run

这是高风险不一致。

## 3. 文档说“同步入口统一”，但仍有多个入口

当前仍存在：

```text
sync
sync:galleries
sync:pull
gallery:pull
triggerManualSync
triggerSyncAction
```

这不一定错误，但应该明确：

- 哪些是正式入口；
- 哪些是兼容入口；
- 哪些只支持 Post；
- 哪些只支持 Gallery；
- 哪些将来废弃。

## 4. README 中的 `bun run sync:galleries` 和统一 `bun run sync` 语义没有完全统一

README 仍同时推荐：

```bash
bun run sync:galleries
bun run sync
```

而 Stage 9 又强调统一入口。

建议将旧入口标记为：

```text
兼容入口，不建议新流程使用
```

## 5. AGENTS.md 明显滞后

它仍然将 Stage 6 描述为规划中，必须更新。

---

# 五、当前项目做得比较好的地方

问题很多，但 Stage 9 的基础方向总体是正确的。

## 1. 内容源和运行时副本边界清晰

明确区分：

```text
Markdown / album.yaml / WebP
```

与：

```text
PostgreSQL / Cloudinary
```

这是正确的架构选择，避免数据库成为唯一内容源。

## 2. Gallery 独立于 Post

Gallery 使用独立的：

- `Gallery`
- `GalleryImage`
- `album.yaml`
- 独立同步逻辑
- 独立 Cloudinary public ID

这比把 Gallery 强行塞进 Post 模型更容易长期维护。

## 3. 快照没有包含认证敏感数据

快照默认只包含业务数据，不包含：

- User
- Account
- Session
- Verification
- SyncRun
- SyncLog
- 密码
- Token
- Secret
- Cloudinary 二进制

这是正确且必要的安全边界。

## 4. PRE_RESTORE 思路正确

恢复前自动创建保护快照是非常有价值的防护措施，尤其适合个人系统，因为管理员通常没有专门的运维团队。

## 5. Gallery 原始格式保护方向正确

明确拒绝 RAW 静默处理，避免用户误以为 ORF/CR2 已安全完成转换。

## 6. 当前基础验证可以通过

实际运行结果：

```text
content:verify: 通过
TypeScript: 通过
```

当前内容样例中：

- 9 个 Markdown 文件；
- 3 个 Gallery；
- 6 张图片；
- Post dry-run 成功；
- Gallery dry-run 成功；
- ALL dry-run 成功。

但这只是当前样例的静态验证，不能替代自动化测试和真实恢复验证。

---

# 六、建议的改进顺序

## 第一阶段：先修复语义和数据安全

优先级最高：

1. 修复 Post dry-run 的 frontmatter write-back；
2. 修复 Gallery dry-run 的目录创建；
3. 让 dry-run 不创建或更新 SyncRun；
4. 确认 `deleteOld` 在 Gallery 中真正生效；
5. 为同步锁增加数据库级原子竞争保护；
6. 增加失败文件和半成功状态记录；
7. 增加恢复后的“内容源未回滚”强提示。

## 第二阶段：降低个人使用复杂度

1. 增加统一命令：

```bash
bun run publish
bun run publish --scope posts
bun run publish --scope galleries
bun run publish --dry-run
```

2. README 只保留一条推荐路径；
3. 旧命令标记为兼容入口；
4. Dashboard 提供统一同步状态页；
5. Gallery Dashboard 增加图片级编辑和排序；
6. 提供“一键复制发布摘要”和失败重试。

## 第三阶段：补齐测试

优先不需要数据库的纯函数测试：

- Gallery parser；
- Snapshot hash；
- slug；
- content diff；
- sync scope；
- dry-run safety。

然后增加：

- Snapshot service 集成测试；
- Sync lock 集成测试；
- ADMIN Action 测试；
- Gallery revision 冲突测试。

最后增加少量 E2E 测试。

## 第四阶段：整理文档和遗留代码

1. 更新 `AGENTS.md` 到 Stage 9.6；
2. 创建项目当前状态文档；
3. 清理或隔离 `references/`；
4. 标注兼容入口；
5. 统一 README、Stage 文档和代码命名；
6. 明确原始图片备份策略。

---

# 最终结论

目前项目的核心问题可以概括为四句话：

1. **工程治理已经超过个人博客的最低需求，但日常使用流程仍然过于复杂。**
2. **dry-run、CI 只读、同步删除等关键语义存在实现与文档不一致。**
3. **快照解决了数据库业务副本恢复，但没有解决完整内容源和媒体备份恢复。**
4. **缺少自动化测试，使 Stage 9 的很多安全承诺目前主要依赖人工审查。**

最应该先解决的不是继续增加功能，而是：

```text
确保 dry-run 真正只读
确保同步失败后可安全重试
确保删除和回写行为明确可控
确保 CI 不依赖生产运行时
确保核心边界有自动化测试
```

这些问题修复后，再继续优化 Gallery 编辑器和一键发布流程，项目才会更适合长期作为个人 blog/gallery 系统使用。