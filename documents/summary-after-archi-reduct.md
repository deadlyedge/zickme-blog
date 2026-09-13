# 架构减法审计结论

本次基于 `documents/architecture-reduction.md` 对当前仓库进行了静态审计，并执行了：

- `bun run lint`：通过
- `bun run content:check -- --no-examples`：通过
- `bun run test`：3 个测试全部通过
- `bun run content:verify`：通过
- `bunx tsc --noEmit --pretty false`：通过
- `bun run build`：通过，但存在 Turbopack 文件系统 tracing 警告

工作区没有被修改，`git status` 保持干净。

总体判断：

> 当前项目已经完成了“表面上的单向 publish 收敛”，但内部实现仍然保留较多旧同步系统语义，并且存在几个与 Git-first 单向发布原则直接冲突的边界问题。最重要的问题不是类型或构建失败，而是“发布流程是否真的只读取 Git 内容源，以及发布是否可能改写内容源”。

---

# 一、P0：优先修复的问题

## 1. `publish` 仍可能修改 Git 内容源

这是当前最严重的问题。

### 1.1 Post publish 会自动写入 Frontmatter

`/scripts/publish.ts`：

```ts
const frontmatter = await preparePostFrontmatter(undefined, dryRun)
```

当 `dryRun === false` 且发现缺失字段时，会写入 Markdown：

```ts
if (frontmatter.changed.length > 0) {
    ...
    if (dryRun) {
        ...
        return
    }
}
```

项目文档明确写着：

> publish 流程默认不回写内容源。

但当前实现允许正式 `publish` 自动补齐 Frontmatter。这与以下原则冲突：

- Git 内容源是唯一人工内容源；
- publish 负责读取和发布；
- 所有内容变化都应在 Git diff 中被发现；
- publish 不应默认修改 Markdown/YAML。

`scripts/README.md` 甚至明确描述：

> 正式 publish 可以写入缺失的 Frontmatter。

这说明代码与架构文档之间存在直接矛盾。

### 建议

将 Frontmatter 补齐完全移出 `publish`：

```text
content:check / content:fix
        ↓
git diff 审查
        ↓
publish 只读内容源并发布
```

推荐行为：

- `publish` 发现必需字段缺失时直接失败；
- 输出具体文件和字段；
- 由 `content:fix` 或人工编辑修复；
- `publish --dry-run` 与正式 publish 使用相同的解析和校验结果。

不要让正式 publish 产生工作区变更。

---

## 2. Gallery publish 会写入 `album.yaml`

`src/lib/gallery/gallery-sync-service.ts` 中，正式流程包含：

```ts
if (!dryRun)
    await fs.mkdir(path.join(albumDirectory, 'images'), { recursive: true })
```

并且后续会写入：

```ts
if (!dryRun)
    await fs.writeFile(
        config.configPath,
        stringify(
            { ...config.data, images: processedImages },
            { lineWidth: 120 },
        ),
        'utf8',
    )
```

这意味着 Gallery publish 可能执行以下操作：

```text
content/.gallery-input
        ↓
生成/修改 album.yaml
        ↓
处理图片
        ↓
写数据库 / 上传 Cloudinary
```

但架构方案规定：

- `album.yaml` 是人工编辑源；
- `gallery.yaml` 是自动生成文件；
- publish 默认不回写内容源；
- Dashboard、数据库、Cloudinary 不得成为内容源修改入口。

因此当前 Gallery publish 的职责仍然过重，实际上包含了“内容生成/回写”。

### 建议

将 Gallery 流程拆成两个明确阶段：

```text
content:prepare / gallery:index
    ├── 生成或更新 album.yaml
    ├── 生成 gallery.yaml
    └── 用户审查 git diff

publish
    ├── 只读取 album.yaml
    ├── 只读取已处理的 WebP
    ├── 上传 Cloudinary
    └── 写 PostgreSQL
```

正式 `publish` 中应删除：

- `fs.mkdir` 创建内容源目录；
- `fs.writeFile(config.configPath, ...)`；
- 任何对 `album.yaml` 的自动补齐或重写。

如果仍然需要支持 `.gallery-input` 自动处理，应将其独立为显式命令，例如：

```bash
bun run content:prepare
bun run gallery:index
git diff
bun run publish
```

而不是把内容生成隐含在 publish 内。

---

## 3. Dashboard 旧内容写入能力仍可以通过环境变量重新启用

多个 Server Action 使用：

```ts
if (process.env.ENABLE_LEGACY_CONTENT_WRITEBACK !== '1')
    return { success: false, ... }
```

涉及：

- `src/lib/actions/gallery-admin.ts`
- `src/lib/actions/posts-admin.ts`

包括：

- 更新文章封面；
- 上传文章封面；
- 更新文章状态；
- 删除文章；
- 更新 Gallery；
- 更新 Gallery 图片；
- 标记 Gallery 图片删除；
- ZIP 内容导入。

这意味着只要生产环境设置：

```env
ENABLE_LEGACY_CONTENT_WRITEBACK=1
```

旧内容编辑/回写逻辑就可能重新启用。

这与当前架构的“禁止反向编辑和回写”不一致。兼容期入口可以保留，但不应该由一个环境变量把已禁用能力重新打开，尤其不能把它当成普通运行时开关。

### 更严重的地方

`updatePostStatus`、`deletePostPermanently` 等能力即便不一定直接写 Markdown，也会直接修改数据库中由 Git 管理的内容状态。这样数据库仍然可以成为内容状态的人工编辑入口。

`exportPostsZipAction` 也仍然有效，而架构文档已经规定：

> 数据库文章导出不能作为内容恢复手段。

### 建议

分三个层次处理：

#### 第一阶段：立即移除生产开关

不要允许普通环境变量重新启用：

```ts
ENABLE_LEGACY_CONTENT_WRITEBACK
```

如果确实需要兼容调试，应改为：

- 仅测试环境可用；
- 仅本地显式构建开关；
- 或直接删除实现。

#### 第二阶段：将内容修改 Action 改为永久拒绝

保留函数签名用于兼容前端调用，但始终返回迁移提示：

```text
内容源由 Git 管理，请修改 Markdown/album.yaml 后提交并执行 publish。
```

#### 第三阶段：移除无效 UI 和导出能力

建议逐步删除：

- 内容编辑表单；
- ZIP 导入；
- 数据库导出；
- “发布/转草稿/归档”数据库直接修改入口；
- Gallery 元数据直接编辑入口。

Dashboard 只保留：

- 运行时查看；
- 评论管理；
- 用户管理；
- 站点设置；
- 发布触发；
- 发布状态查看；
- 数据库快照。

---

# 二、P1：高风险架构问题

## 4. `publish` 名义上统一，内部仍是旧 `sync` 系统

当前入口：

```text
scripts/publish.ts
    ↓
runSync()
    ↓
sync-orchestrator.ts
    ↓
sync-lock.ts
    ↓
SyncRun
```

核心类型仍然是：

- `SyncScope`
- `SyncRunSummary`
- `SyncTrigger`
- `SyncRunRecord`
- `SyncConflict`
- `SYNC_PROTOCOL_VERSION`
- `retryOf`
- `syncStatus`
- `syncVersion`
- `mergeBase`
- `revision`

这并不一定立即造成错误，但说明“架构减法”目前主要完成了入口重命名，内部协议还没有真正收敛。

尤其是：

```ts
runSync()
```

仍然负责：

- 获取同步锁；
- 创建 SyncRun；
- 执行 Post；
- 执行 Gallery；
- 计算部分成功；
- 管理旧 retry 字段；
- 完成 SyncRun。

建议后续将语义逐步调整为：

```text
publish service
├── PublishOptions
├── PublishSummary
├── PublishResult
├── publishPosts()
├── publishGalleries()
└── publishAll()
```

而不是继续扩大 `sync-orchestrator.ts`。

### 推荐迁移方向

第一阶段不必立即删除数据库表，但可以先完成代码层隔离：

```text
src/lib/publish/
├── publish-service.ts
├── publish-types.ts
├── publish-summary.ts
└── publish-lock.ts
```

旧 `sync` 模块只保留：

- 历史运行记录读取；
- 兼容 Dashboard 查询；
- 旧数据库字段映射。

新的 publish 代码不再暴露：

- `retryOf`
- `SyncConflict`
- `mergeBase`
- `revision`
- `syncVersion`

---

## 5. 发布锁存在“先查询、后插入”的竞态设计

`src/lib/sync/sync-lock.ts` 当前逻辑：

```ts
const active = await findActiveSyncRunForScopes(conflictKeys)

if (active) throw ...

await createSyncRun(...)
```

这是典型的：

```text
SELECT 是否存在
INSERT 新运行记录
```

虽然 `sync_run_lock_unique` 唯一约束可以在部分情况下阻止重复锁，但当前设计仍存在几个问题：

1. 依赖数据库唯一约束报错来完成竞争控制；
2. 异常后再次查询 active run；
3. 过期记录、`NULL` 锁和历史状态的组合语义较复杂；
4. `releaseSyncRunLock()` 返回空函数，实际没有额外释放行为；
5. 锁、运行记录和发布状态耦合在同一张历史表中。

对于个人博客，当前锁系统明显比实际需要复杂。

### 建议

短期：

- 增加并发集成测试；
- 同时启动两个 `publish --scope all`；
- 验证只允许一个执行；
- 验证失败时不会留下永久 RUNNING 记录；
- 验证过期锁不会误杀新任务。

中期：

- 使用独立的 `publish_lock` 表；
- 或使用 PostgreSQL advisory lock；
- `publish_runs` 仅存运行摘要，不承担锁状态；
- 删除 `retryOf`、`lockKey`、`lockExpiresAt` 的新流程依赖。

---

## 6. Snapshot restore 没有与 publish 共享并发保护

`restoreSnapshot()` 在事务中会：

```ts
delete comments
delete postsToTags
delete galleryImages
delete galleries
delete posts
delete tags
delete siteProfile
insert snapshot payload
```

但它没有获取 publish 锁，也没有阻止 publish 同时运行。

可能出现：

```text
T1: Snapshot restore 删除当前业务数据
T2: publish 写入新内容
T1: Snapshot restore 插入旧快照数据
```

或者：

```text
T1: publish 正在上传媒体并准备写 Gallery
T2: snapshot restore 回滚数据库
```

最终可能出现：

- 数据库内容是旧快照；
- Cloudinary 是新媒体；
- 下一次 publish 又覆盖数据库；
- SyncRun 记录无法说明恢复期间发生了什么。

这正是架构文档强调的恢复边界问题。

### 建议

Snapshot restore 至少需要：

1. 使用与 publish 相同的数据库级互斥锁；
2. 恢复期间禁止 publish；
3. 恢复前检查没有 RUNNING publish；
4. 恢复完成后明确提示：
   - Git 内容源没有回滚；
   - Cloudinary 没有回滚；
   - 下一次 publish 可能覆盖恢复结果。

更理想的方向是直接依赖 Neon/数据库备份，逐步弱化自定义 `SiteSnapshot`。

---

## 7. Gallery 数据写入不是事务性的

Gallery 发布流程目前大致是：

```text
处理图片
上传 Cloudinary
写入 Gallery
逐张写入 GalleryImage
写 album.yaml
清理/标记旧数据
```

这些数据库操作不是一个完整事务。

如果在中途发生错误，可能出现：

- Cloudinary 已经上传部分图片；
- Gallery 已写入；
- GalleryImage 只写入了一部分；
- `album.yaml` 只写了一部分或还未写入；
- 最终运行状态是部分失败；
- 下一次重跑依靠幂等逻辑恢复。

这不一定是错误，但必须明确这是“可重入最终一致性”，而不是原子发布。

当前文档中使用了“简单、可重入的单向发布”，因此建议把这个语义明确写入实现和文档。

### 建议

短期：

- 对每个 album 使用数据库事务；
- 媒体上传失败时不要写入对应 GalleryImage；
- 给摘要增加：
  - 已上传媒体；
  - 已写入数据库；
  - 未完成媒体；
  - 待人工处理媒体。

中期：

- 将 Cloudinary 上传和数据库提交拆成清晰阶段；
- 不自动删除 Cloudinary；
- 明确孤儿媒体清理策略；
- 不把 `PENDING_DELETE` 当作内容状态来源。

---

# 三、P1：CI 和发布工作流存在职责冲突

## 8. `media.yml` 和 `publish` 重复处理媒体

当前有两套媒体流程：

### `media.yml`

```bash
bun run scripts/upload-to-cloudinary.ts
```

### `publish --scope galleries`

内部也会处理 Gallery 图片并上传 Cloudinary。

这会造成：

- 两个上传入口；
- 两种 Public ID 规则；
- 两套图片压缩逻辑；
- 重复上传；
- 工作流之间存在隐式依赖；
- 用户不知道应该运行哪个入口。

架构文档要求：

> publish 是唯一正式单向发布入口。

但当前 `media.yml` 仍然是独立的 Cloudinary 上传入口。

### 建议

删除独立的 `upload-to-cloudinary.ts` 正式入口，统一为：

```text
Git push
  ↓
quality.yml
  ↓
受控 publish workflow
  ↓
publish --scope all
  ├── Cloudinary
  └── PostgreSQL
```

如果必须保留媒体预处理，应将其改成纯本地准备工具，不直接上传 Cloudinary。

---

## 9. Gallery 内容变更不会自动触发发布

`media.yml` 的触发路径只有：

```yaml
content/posts/**/images/**
content/posts/**/*.md
```

没有：

```yaml
content/photo-gallery/**
content/.gallery-input/**
```

因此：

- 修改 Post Markdown：会触发 media workflow，再级联 `sync-db.yml`；
- 修改 Gallery `album.yaml`：不会触发 media workflow；
- 修改 Gallery WebP：不会自动触发 `sync-db.yml`；
- Gallery 只能依靠手动 workflow_dispatch 发布。

这与“Post 和 Gallery 都能通过统一 publish 发布”的目标不完全一致。

### 建议

不要继续用媒体工作流作为发布触发器。

应改成一个明确的受控发布工作流：

```yaml
on:
  push:
    branches: [main]
    paths:
      - content/posts/**
      - content/photo-gallery/**
  workflow_dispatch:
```

然后一次执行：

```bash
bun run content:check -- --no-examples
bun run content:verify
bun run db:migrate
bun run publish -- --scope all
```

这样可以避免：

```text
媒体上传成功
  ↓
触发数据库发布
```

这种隐式链路。

---

## 10. `sync-db.yml` 的命名与职责已经过时

文件名仍然是：

```text
.github/workflows/sync-db.yml
```

但当前架构已经不再强调 sync，而是 publish。

建议改名为：

```text
publish.yml
```

并同步更新：

- `.github/README.md`
- README
- 架构文档
- workflow 触发关系
- GitHub Actions 页面说明

否则维护者仍然会认为项目存在一个独立的“数据库同步系统”。

---

# 四、P1：构建和部署优化

## 11. Gallery 动态文件系统访问触发 Turbopack tracing 警告

`bun run build` 成功，但出现了明确警告：

```text
Dynamic filesystem access causes tracing of the whole project
```

来源包括：

```text
src/lib/gallery/gallery-sync-service.ts
```

例如：

```ts
path.resolve(...)
fs.readdir(inputRoot, ...)
path.join(inputRoot, ...)
```

因为该模块被 Server Component / Server Action 引用，Next.js 可能将整个项目目录纳入 tracing。

影响：

- 部署包变大；
- 构建速度变慢；
- 生产环境可能包含不必要的 content、public 或源文件；
- Serverless 部署可能遇到体积限制；
- 动态路径在 Vercel 上可能无法按预期存在。

### 建议

最优方案是分离发布服务和 Web Runtime：

```text
scripts/publish.ts
src/lib/publish/
    └── 仅在 CLI / CI 中使用
```

不要让包含本地文件系统和 Sharp/Cloudinary 上传逻辑的模块被页面或普通 Server Action 静态引用。

Dashboard 触发发布时可以改成：

- 调用独立受控发布任务；
- 或只创建发布请求；
- 不在 Next.js Web 进程中直接执行完整文件扫描和媒体处理。

如果暂时无法拆分，可对受控目录使用静态路径和 tracing ignore，但这只是缓解，不是根本解决。

---

# 五、P2：文档和实现不一致

## 12. README 仍残留已删除的旧脚本

`README.md` 的项目结构仍列出：

```text
scripts/sync-content.ts
scripts/sync-galleries.ts
scripts/sync-pull.ts
```

但当前正式流程已经删除这些入口。

README 还保留：

```bash
bun run sync
```

位于初始化数据库流程：

```text
bun run db:migrate
bun run sync
bun run dev
```

这与架构文档中的正式流程冲突：

```bash
bun run publish -- --scope all
```

这会直接影响新用户，因为 README 是项目的主要操作入口。

---

## 13. README 的 Stage 6 仍写成“规划中”

当前 README 写着：

```text
### 规划中：Stage 6 独立 Gallery
```

但 Gallery 已经实现，并且当前项目已经进入 Stage 9.6 / 架构减法阶段。

这会产生两个问题：

- 文档无法准确描述当前系统；
- 新维护者会误以为 Gallery 仍处于设计阶段。

应改为：

```text
### 已实现：独立 Gallery 内容系统
```

并只保留当前实际能力。

---

## 14. README 仍描述双向同步能力

README 仍有以下描述：

```text
支持本地新增、远端新增和冲突诊断
```

以及：

```text
Stage 6 计划包括：
- 基于 merge base、revision 和字段级合并的双向同步
```

这些内容不应出现在当前正式流程文档中，即使它们是历史计划，也容易被理解为仍然支持。

建议：

- 当前架构文档只描述现行能力；
- 历史计划移到 `documents/develop-plans/`；
- 在历史文档顶部加上明确提示：

```text
本文为历史规划，不代表当前实现和正式操作流程。
```

---

## 15. `scripts/README.md` 仍写有兼容入口

其中仍然写着：

```text
sync:galleries 仅作为支持额外输入目录的兼容专用入口保留。
```

但架构文档明确说：

> 旧双向 CLI 已删除。

如果实际入口已删除，这句话就是错误的；如果仍有隐藏入口，则与“旧入口已删除”的验收结果冲突。

需要统一为以下两者之一：

- 彻底删除该描述；
- 明确它是内部函数，不是用户可调用 CLI。

---

# 六、P2：测试覆盖不足

当前测试只有：

```text
tests/publish-boundaries.test.ts
```

覆盖内容：

- Post dry-run 不写文件；
- Frontmatter 正式准备会写入文件；
- scope 解析。

测试数量只有 3 个，无法支撑当前文档中的完整验收声明。

## 建议新增测试

### 1. Gallery dry-run

验证：

- 不创建 album 目录；
- 不写 `album.yaml`；
- 不写 `gallery.yaml`；
- 不写数据库；
- 不上传 Cloudinary。

### 2. Publish 正式流程不修改内容源

应加入快照测试：

```text
运行 publish
比较 Git 管理内容目录前后 diff
必须为空
```

当前测试反而明确验证正式 Frontmatter 准备会修改文件，这正好暴露了架构矛盾。

### 3. SyncRun 边界

验证：

- dry-run 不连接数据库；
- dry-run 不调用 `createSyncRun`；
- dry-run 不获取锁；
- dry-run 不调用 `finishSyncRun`。

### 4. 并发锁

验证：

- 两个 `ALL` 只能有一个成功；
- `POSTS` 和 `GALLERIES` 可以按设计并发或互斥；
- `ALL` 与任一子 scope 正确互斥；
- 锁过期后可以恢复；
- 失败不会永久留下 RUNNING。

### 5. Dashboard 权限

至少测试：

- 未登录不能触发 publish；
- USER 不能触发 publish；
- ADMIN 可以触发 publish；
- 输入 scope、dryRun、deleteOld 经过 Zod 校验。

### 6. Snapshot restore

验证：

- 恢复前自动创建 `PRE_RESTORE`；
- 不覆盖认证表；
- 不覆盖 SyncRun；
- 失败时事务回滚；
- 恢复期间 publish 被阻止。

---

# 七、数据库字段清理方向

当前 schema 仍保留：

`Gallery`：

```text
mergeBase
revision
syncStatus
```

`GalleryImage`：

```text
syncVersion
revision
mergeBase
syncStatus
```

`SyncRun`：

```text
protocolVersion
retryOf
lockKey
lockExpiresAt
conflictCount
```

这些字段暂时保留是合理的，但建议建立正式的字段使用矩阵：

| 字段 | 当前代码读取 | 当前代码写入 | 是否正式流程需要 | 后续动作 |
|---|---:|---:|---:|---|
| `mergeBase` | 需确认 | 不应写 | 否 | 迁移窗口删除 |
| `revision` | Dashboard 旧逻辑仍读取/写入 | 是 | 否 | 删除兼容 Action 后删除 |
| `syncVersion` | 基本无 | 不应写 | 否 | 迁移窗口删除 |
| `syncStatus` | 前台/兼容查询可能读取 | Gallery publish 写入 | 部分 | 重新定义或简化 |
| `retryOf` | Dashboard 历史读取 | 新流程不应写 | 否 | 保留历史后删除 |
| `lockKey` | 锁逻辑使用 | 新流程暂时需要 | 过渡需要 | 独立 lock 表 |
| `conflictCount` | 历史摘要 | 新流程无冲突 | 否 | 迁移后删除 |

特别需要注意：

> 文档声称 `revision` 已不再递增，但 `gallery-admin.ts` 中兼容逻辑仍然会执行 `revision + 1`。

因此当前更准确的描述应该是：

```text
publish 不再递增 revision，但兼容 Dashboard Action 在环境开关开启时仍会递增 revision。
```

这与“已降级”相比更准确。

---

# 八、推荐实施顺序

## 第一阶段：修复内容源边界

优先处理：

1. 禁止 `publish` 写 Frontmatter；
2. 禁止 Gallery publish 写 `album.yaml`；
3. 移除 `ENABLE_LEGACY_CONTENT_WRITEBACK` 的生产启用路径；
4. 明确 `publish` 运行前内容必须已通过校验；
5. 新增“publish 前后 Git 内容目录不变”测试。

这是最重要的阶段。

---

## 第二阶段：统一 CI 发布入口

1. 删除或降级独立 `upload-to-cloudinary.ts`；
2. 新增统一 `publish.yml`；
3. 支持 Post、Gallery 内容变更触发；
4. 不再通过 media workflow 间接触发数据库发布；
5. 将 `sync-db.yml` 改名为 `publish.yml`；
6. CI 流程统一为：

```bash
bun run content:check -- --no-examples
bun run content:verify
bun run db:migrate
bun run publish -- --scope all
```

---

## 第三阶段：从 sync 语义迁移到 publish 语义

1. 新增 `src/lib/publish/`；
2. 将 `runSync` 逐步迁移为 `runPublish`；
3. 新流程不暴露 `retryOf`、`mergeBase`、`revision`、`SyncConflict`；
4. `SyncRun` 仅作为兼容历史运行表；
5. 未来迁移到最小化的 `publish_runs`。

---

## 第四阶段：修复恢复和并发边界

1. Snapshot restore 与 publish 共用互斥机制；
2. 增加 restore/publish 并发测试；
3. 明确 Snapshot 仅恢复 PostgreSQL 业务副本；
4. Dashboard 中强提示 Git、数据库、Cloudinary 三种恢复边界；
5. 评估是否由 Neon 备份替代 SiteSnapshot。

---

## 第五阶段：清理文档和遗留模型

最后再处理：

- README 旧脚本；
- `sync` 旧命名；
- 历史阶段文档；
- 废弃 Action；
- `mergeBase`、`revision`、`syncVersion`；
- `SyncRun` 锁字段；
- 旧同步枚举和 migration。

---

# 最终结论

当前项目的基础质量不错：

- Lint 通过；
- TypeScript 通过；
- 测试通过；
- 内容验证通过；
- 生产构建通过。

但是从架构减法目标看，仍有四个关键问题：

1. **正式 publish 仍可能修改 Markdown 和 album.yaml；**
2. **旧 Dashboard 内容写入能力可以通过环境变量重新启用；**
3. **Cloudinary media workflow 与 publish 存在重复入口和隐式依赖；**
4. **sync 内部协议尚未真正收敛为 publish 语义。**

最建议优先解决的是第 1 项。只要 publish 仍能改变 Git 内容源，就不能完全声称已经实现了 Git-first 单向发布。

本次仅完成分析和验证，没有修改任何文件。若要开始实施，建议先从“禁止 publish 写入内容源 + 补齐 Gallery/dry-run 边界测试”开始。