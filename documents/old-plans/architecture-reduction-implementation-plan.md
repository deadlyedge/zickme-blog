# 架构减法实施指导：内容检查、单向 publish 与历史能力清理

> 状态：待实施。
>
> 本文根据 [`architecture-reduction.md`](./architecture-reduction.md) 和 [`summary-after-archi-reduct.md`](./summary-after-archi-reduct.md) 编制，是下一阶段实施计划，不代表当前代码已经满足本文验收条件。
>
> 核心决策：Git 是唯一人工内容源；publish 只读取已通过检查的内容；旧三方同步能力不再保留兼容实现；GitHub Actions 暂时停用；SiteSnapshot 暂时禁用。

## 1. 目标和硬性边界

```text
用户编辑 content/posts/*.md
用户增删 content/.gallery-input/{album}/*
        ↓
publish：第一入口、检查器和发布器
        ↓ 发现问题则停止并给出修复命令
content:format / content:prepare-media / content:rebuild / gallery:index
        ↓ 用户编辑并审查 Frontmatter、album.yaml 和 Git diff
        ↓
再次运行 publish
        ↓
PostgreSQL / Cloudinary
```

Git 管理的 Markdown、`album.yaml` 和处理后的 WebP 是唯一人工内容源。`content/.gallery-input` 是被 Git 忽略的原始图片输入目录，不是数据库或 Cloudinary 的内容源。只允许 `Git 内容源 → 检查/准备 → publish → 运行时副本`，禁止 PostgreSQL、Dashboard、Cloudinary 或 Snapshot 反向修改 Markdown/YAML。

必须满足：

1. `publish` 不得创建、修改或删除 Git 管理的 Markdown、YAML、WebP。
2. `publish` 发现内容错误时立即停止，不能边修边发。
3. 内容重建和媒体准备由显式命令完成，并产生可审查的 Git diff；publish 不隐式调用这些写入命令。
4. 检查和 publish 支持 `posts`、`galleries`、`all`，默认是 `all`。
5. 不保留旧三方同步的兼容入口、环境开关、Dashboard 写入能力或新调用方。
6. 在 publish 语义确认前，所有 GitHub Actions 停止执行。
7. Snapshot 页面、Action 和恢复逻辑暂时不可用。
8. 暂不删除生产字段和历史 migration；删除 schema 前必须完成读取审计、迁移说明和回滚方案。

## 2. 实施顺序

```text
阶段 0：冻结 workflow、Snapshot 和高风险入口
阶段 1：建立 content:check / content:rebuild
阶段 2：使 publish 只读并强制检查
阶段 3：删除 Dashboard 内容写入和三方同步残留
阶段 4：整理 publish 内部结构及数据库遗留字段
阶段 5：离线验收后，重新评估是否恢复单一 workflow
```

阶段 0 至阶段 4 完成前，不恢复真实发布 workflow。

## 3. 阶段 0：冻结自动化和 Snapshot

### 3.1 暂停 GitHub Actions

当前相关文件：

```text
.github/workflows/quality.yml
.github/workflows/media.yml
.github/workflows/sync-db.yml
```

执行要求：

1. 在 GitHub 仓库设置中暂时禁用 Actions；
2. 停止 `workflow_dispatch` 和 `workflow_run` 入口；
3. 不允许 media workflow 触发数据库 publish；
4. 在 `.github/README.md` 中写明“自动化发布已暂停”；
5. 如果保留 workflow 文件，必须是不会执行任务的归档说明，不能只依赖注释停用。

### 3.2 暂停 Snapshot

暂时禁用 Snapshot Dashboard、`snapshot-admin.ts`、snapshot service 和 repository。Action 必须返回“功能暂时停用”，但第一阶段不删除 `SiteSnapshot` 表、schema 或 migration，也不新增调用方。文档必须说明恢复依赖 Git、Neon/数据库备份和 Cloudinary 原始媒体备份，不能把 Snapshot 描述为完整站点备份。

## 4. 阶段 1：内容检查、媒体准备和结构重建命令

### 4.1 推荐命令

```bash
# 普通用户的第一入口：检查并尝试发布全部内容
bun run publish

# 按 publish 的错误提示执行显式修复
bun run content:format -- --scope posts --write
bun run content:prepare-media -- --scope galleries
bun run content:rebuild -- --scope galleries
bun run gallery:index

# 也可以单独检查某个内容域
bun run content:check -- --scope all
bun run content:check -- --scope posts
bun run content:check -- --scope galleries

# 预览结构重建，不修改文件
bun run content:rebuild -- --scope all --dry-run
```

建议提供 `content:rebuild:posts`、`content:rebuild:galleries` 和 `content:prepare-media` 别名，但它们必须调用同一套校验/准备实现。禁止新增含义模糊的 `sync`、`pull`、`patch`、`write-back` 命令。

普通用户不需要在第一次运行 publish 前预先判断应该执行哪个修复命令。publish 必须先检查并报告问题，再由用户根据提示运行格式化、媒体准备或结构重建命令。

### 4.2 `content:check`

Posts 检查 Markdown 位置、Frontmatter YAML、`title`/`slug`/`date`/`tags`/`status`、slug 唯一性、status 合法性、本地图片路径、路径穿越、正文解析和禁止的数据库字段。

Galleries 检查每个 `album.yaml`、YAML 合法性、album slug 唯一性、`images/` 文件、WebP 限制、图片路径安全、`gallery.yaml` 的稳定生成以及原始图片是否误入 Git 跟踪目录。检查还必须扫描被 Git 忽略的 `content/.gallery-input`，报告新增、删除或尚未转换的原始图片，但不得修改该目录。

失败输出必须包含 scope、文件路径、问题类型、字段/图片和建议命令：

```text
[posts] content/posts/example.md
缺少字段：slug
建议：bun run content:format -- --scope posts --write，然后编辑并确认 Frontmatter，最后重新运行 bun run publish -- --scope posts
```

### 4.3 `content:format`

`content:format --write` 是 Post Frontmatter 的显式修复命令。它可以生成安全的结构默认值，但用户必须检查并编辑结果，尤其是 `title`、`slug`、`date`、`tags`、`status` 和文章封面。它不得读取数据库或 Cloudinary，也不得修改 Markdown 正文。

publish 发现 Post 缺少 Frontmatter 时，应输出类似：

```text
发布已停止：[posts] content/posts/example.md 缺少 Frontmatter 字段：slug、date、status
建议：bun run content:format -- --scope posts --write
请编辑并确认 Frontmatter 后，重新运行 bun run publish -- --scope posts
```

### 4.4 `content:prepare-media`

`content:prepare-media` 负责处理 `content/.gallery-input/{album}/` 中的原始图片：

- 读取原始图片但不把原图加入 Git；
- 执行格式转换、尺寸限制和 EXIF 隐私处理；
- 将处理后的 WebP 写入 `content/photo-gallery/{album}/images/`；
- 输出新增、删除、跳过和不支持的图片摘要；
- 不读取数据库或 Cloudinary 作为元数据来源；
- 不修改 `album.yaml` 中用户已经填写的字段。

publish 只能读取 `.gallery-input` 做诊断，不能在发布过程中自动转换图片或写入 WebP。发现未处理原图时，应输出类似：

```text
发布已停止：[galleries] content/.gallery-input/travel/IMG_001.JPG 尚未完成媒体准备
建议：bun run content:prepare-media -- --album travel
完成后确认 content/photo-gallery/travel/images/IMG_001.webp 和 album.yaml，再重新运行 bun run publish -- --scope galleries
```

### 4.5 `content:rebuild`

这是唯一允许自动重建内容结构的命令，必须支持 dry-run；写入前列出文件；只修改结构字段；不读取数据库或 Cloudinary；不执行 publish、数据库写入或媒体上传；完成后由用户审查 `git diff`。

Gallery 可以根据 Git 工作区生成缺失的 `album.yaml` 骨架，并根据人工 `album.yaml` 生成 `gallery.yaml`，不得从数据库或 Cloudinary 反向生成 album 元数据。用户必须在生成后编辑并确认 `album.yaml`；`gallery.yaml` 是自动生成文件，不是人工编辑源。

publish 发现 Gallery 缺少 `album.yaml` 时，应提示：

```text
发布已停止：[galleries] content/photo-gallery/travel/album.yaml 不存在
建议：bun run content:rebuild -- --scope galleries --album travel
请编辑并确认 album.yaml 后，重新运行 bun run publish -- --scope galleries
```

publish 发现 `gallery.yaml` 缺失或过期时，应提示：

```text
发布已停止：[galleries] content/photo-gallery/gallery.yaml 缺失或已过期
建议：bun run gallery:index
然后重新运行 bun run publish -- --scope galleries
```

```bash
bun run content:rebuild -- --scope all --dry-run
git diff -- content/posts content/photo-gallery
bun run content:rebuild -- --scope all
bun run content:check -- --scope all
git diff --check
git diff -- content/posts content/photo-gallery
```

## 5. 阶段 2：publish 只读并强制检查

### 5.1 新职责：第一入口、检查器和发布器

```text
用户编辑 Markdown 或增删 .gallery-input 原图
        ↓
运行 publish
        ↓
检查 Frontmatter、album.yaml、gallery.yaml、WebP 和 .gallery-input
        ↓ 失败：停止并输出修复命令
content:format / content:prepare-media / content:rebuild / gallery:index
        ↓ 用户编辑、确认并审查 git diff
再次运行 publish
        ↓
读取 Markdown / album.yaml / WebP
        ↓
处理媒体并写运行时副本
        ↓
输出摘要
```

publish 是普通用户的第一入口，也是检查器和发布器。它可以读取 `.gallery-input` 进行诊断，但不得执行 Frontmatter 写入、原图转换、WebP 写入、`fs.writeFile` 写入 Markdown/YAML、自动生成 `album.yaml`/`gallery.yaml`、数据库到文件 write-back、merge、pull、patch、retry、实体级任务、自动 commit 或 push。

### 5.2 Scope 和错误语义

```bash
bun run publish
bun run publish -- --scope posts
bun run publish -- --scope galleries
bun run publish -- --scope all --dry-run --json
```

不指定 scope 等价于 `all`。`all` 必须先完成两个域的内容检查，任一域失败都不得进入数据库或 Cloudinary 写入。建议错误码：`CONTENT_INVALID`、`FRONTMATTER_REBUILD_REQUIRED`、`MEDIA_PREPARATION_REQUIRED`、`ALBUM_REBUILD_REQUIRED`、`GALLERY_INDEX_REQUIRED`、`MEDIA_INVALID`、`DATABASE_UNAVAILABLE`、`CLOUDINARY_UNAVAILABLE`、`PUBLISH_FAILED`。错误信息必须给出文件、问题类型、建议命令以及修复后重新执行的 publish 命令。

错误处理必须遵循：

```text
publish 第一次运行
  ├─ 缺 Frontmatter → content:format --write → 用户编辑确认
  ├─ 有未处理原图 → content:prepare-media → 确认 WebP
  ├─ 缺 album.yaml → content:rebuild → 用户编辑确认
  ├─ gallery.yaml 过期 → gallery:index
  └─ 所有检查通过 → 写 PostgreSQL / Cloudinary

每个修复分支完成后，都必须重新运行 publish。
```

### 5.3 必须新增的测试

- publish 前后 `content/posts` 和 `content/photo-gallery` 文件 hash 不变；
- 内容检查失败时不写文件、不写数据库、不上传媒体；
- publish 可以诊断 `.gallery-input`，但不修改原图输入目录；
- publish 发现未处理原图时输出 `content:prepare-media` 建议并停止；
- publish 发现缺失 Frontmatter 时输出 `content:format` 建议并停止；
- publish 发现缺失/过期 YAML 时输出 `content:rebuild` 或 `gallery:index` 建议并停止；
- dry-run 不连接数据库、不获取锁、不创建或更新运行记录；
- Gallery dry-run 不创建目录、不写 `album.yaml` 或 `gallery.yaml`；
- Posts、Galleries、All scope 行为一致。

## 6. 阶段 3：删除三方同步和 Dashboard 内容写入

不再保留 `ENABLE_LEGACY_CONTENT_WRITEBACK`、Dashboard 内容/状态编辑、Markdown/ZIP 导入、数据库文章导出恢复、frontmatter poster write-back、`sync`/`sync:galleries`/`sync:pull`/`gallery:pull`、merge base、字段级 merge、冲突解决、scope/entity retry，以及 Cloudinary 内容元数据来源。

若 Server Action 暂时保留以兼容前端，必须始终返回：

```text
内容源由 Git 管理，请修改 Markdown 或 album.yaml，执行 content:check 后再 publish。
```

不得再通过环境变量启用旧逻辑。

Dashboard 仅保留运行时查看、发布摘要、评论管理、用户管理、站点设置和 ADMIN 校验；移除或禁用内容编辑、导入、数据库导出、Snapshot、retry、patch 和冲突 UI。

新的业务代码迁移到：

```text
src/lib/publish/
├── publish-service.ts
├── publish-types.ts
├── publish-validation.ts
├── publish-summary.ts
└── publish-lock.ts
```

旧 `src/lib/sync/` 只允许作为迁移对象存在，不得新增调用方。新的 publish 类型不得暴露 `retryOf`、`SyncConflict`、`mergeBase`、`revision`、`syncVersion`、`REMOTE_ONLY` 或 `CONFLICT`。

### 数据库字段

第一阶段不直接删除生产字段：

| 字段/表 | 当前动作 | 后续动作 |
| --- | --- | --- |
| `mergeBase` | 新流程停止读写 | 生产审计后删除 |
| `revision` | 禁止新 Dashboard/publish 使用 | 兼容入口删除后迁移 |
| `syncVersion` | 新流程不写 | 迁移窗口删除 |
| `syncStatus` | 只保留必要运行时状态 | 简化枚举 |
| `retryOf` | 不创建新记录 | 历史读取确认后删除 |
| `SyncRun` | 暂留必要发布摘要 | 评估迁移为 `publish_runs` |
| `SiteSnapshot` | 入口停用 | 后续决定删除或恢复 |

删除字段前必须提供生产查询审计、migration、回滚方案和验证结果。

## 7. 阶段 4：重新评估 workflow

只有以下条件全部满足才可恢复自动化：publish 不修改 Git 内容源；check/rebuild 有自动化测试；没有独立媒体上传 workflow；没有 `workflow_run` 级联；Post 和 Gallery 使用同一 publish service；Snapshot 不会与 publish 并发修改数据库；旧三方同步 Action 和环境开关已删除；README、AGENTS 和本计划一致；完成至少一次人工发布演练。

恢复时只新增一个受控 workflow，例如 `.github/workflows/publish.yml`，直接执行：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run test
bun run db:migrate
bun run publish -- --scope all
```

不得恢复独立 `media.yml`、`sync-db.yml`、`workflow_run` 级联或自动 Git commit/push。

## 8. 最终用户流程

`publish` 是普通用户的第一入口。用户不需要先判断应该运行哪个检查或重建命令：先运行 publish，看到错误后按照提示修复，再次运行 publish。

### 8.1 Post

```text
打开 content/posts
  ↓
新增、删除或修改 Markdown
  ↓
运行 bun run publish -- --scope posts
  ↓
若缺少 Frontmatter：
  运行 bun run content:format -- --scope posts --write
  编辑并确认 title、slug、date、tags、status 等字段
  ↓
再次运行 bun run publish -- --scope posts
  ↓
检查通过后完成 PostgreSQL / Cloudinary 发布
```

### 8.2 Gallery

```text
打开 content/.gallery-input/{album}
  ↓
新增或删除原始图片
  ↓
运行 bun run publish -- --scope galleries
  ↓
若发现原图尚未入库：
  运行 bun run content:prepare-media -- --album {album}
  确认 content/photo-gallery/{album}/images/*.webp
  ↓
若缺少 album.yaml：
  运行 bun run content:rebuild -- --scope galleries --album {album}
  编辑并确认 album.yaml
  ↓
若 gallery.yaml 缺失或过期：
  运行 bun run gallery:index
  ↓
再次运行 bun run publish -- --scope galleries
  ↓
检查通过后完成 PostgreSQL / Cloudinary 发布
```

### 8.3 全站最短流程

```bash
# 编辑 Post，或增删 content/.gallery-input 中的原始图片
bun run publish

# 按 publish 输出的建议执行修复：
bun run content:format -- --scope posts --write
bun run content:prepare-media -- --scope galleries
bun run content:rebuild -- --scope galleries
bun run gallery:index

# 每个修复分支完成后都重新执行
bun run publish
```

### 8.4 发布前审查和提交

publish 成功前后都不得替用户修改 Git 内容源。内容结构修复或媒体准备完成后，必须审查：

```bash
git diff -- content/posts content/photo-gallery
git diff --check
git status --short
```

确认 diff 后再提交：

```bash
git add content/posts content/photo-gallery
git commit -m "content: update site content"
```

`content/.gallery-input` 被 Git 忽略，原始照片必须由用户在仓库之外或备份介质中自行备份。

### 8.5 完整维护者验证流程

```bash
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run publish -- --scope all --dry-run --json
git diff --check
bun run publish -- --scope all
```

## 9. 验收清单

### 内容边界

- [ ] publish 不修改 Markdown、YAML、WebP；
- [ ] publish 发现内容错误立即失败；
- [ ] check/rebuild 支持 `posts`、`galleries`、`all`；
- [ ] rebuild 支持 dry-run 和 Git diff 审查；
- [ ] Post rebuild 不修改正文；
- [ ] Gallery rebuild 只根据 Git 工作区生成结构文件；
- [ ] 数据库和 Cloudinary 不参与 rebuild。

### 旧能力清理

- [ ] `ENABLE_LEGACY_CONTENT_WRITEBACK` 已移除；
- [ ] Dashboard 内容写入已删除或永久拒绝；
- [ ] sync/pull/patch/merge/retry 入口已删除；
- [ ] 独立 Cloudinary 上传 workflow 已移除；
- [ ] 新流程不写 retry/merge/conflict 协议；
- [ ] 废弃字段没有新读取和写入调用方。

### 暂停状态

- [ ] GitHub Actions 不会执行发布或数据库写入；
- [ ] Snapshot Dashboard 和 Actions 不可用；
- [ ] 文档记录暂停原因和恢复条件；
- [ ] 生产发布期间没有脚本竞争。

### 本地验证

```bash
bun run lint
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run test
bunx tsc --noEmit --pretty false
bun run build
git diff --check
git status --short
```

workflow 暂停期间，上述命令只代表本地质量验证，不能据此自动恢复发布。

## 10. 恢复原则和完成标准

内容源使用 Git 恢复：

```bash
git log -- content/posts content/photo-gallery
git revert <commit>
git checkout <tag> -- content/posts content/photo-gallery
```

PostgreSQL 使用 Neon 备份、`pg_dump` 或受控恢复；Cloudinary 使用保留策略和原始图片备份。任何运行时恢复都不会恢复 Git 内容源或 Cloudinary 原始媒体。

本计划完成的标准是：任何内容变化先出现在 Git diff；publish 只读内容源并写运行时副本；Dashboard 不是第二套编辑器；没有两个脚本处理同一发布链路；Snapshot 不被误解为完整站点备份；GitHub Actions 只在新 publish 边界通过验收后恢复。
