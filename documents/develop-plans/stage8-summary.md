# Stage 8 阶段交付总结

> 阶段名称：Post 与 Gallery 轻量产品化同步平台  
> 阶段范围：统一同步入口、运行摘要、TTL 防卡死保护和低并发运维体验  
> 完成日期：2026-09-13  
> 对应计划：`documents/development-plan-stage8.md`、`documents/development-plan-stage8.1.md`  
> 当前结论：**Stage 8 轻量版核心已完成；完整分布式同步平台能力不在本项目范围内**

---

## 一、阶段结论

Stage 8 已按照个人 Blog 的实际规模完成收敛：Post 和 Gallery 继续保持独立领域模型、独立人工源和独立媒体规则，同时通过统一编排器提供统一的 scope、runId、状态摘要、dry-run、退出行为和运行保护。

本阶段没有引入队列、Redis、实体任务表、复杂审计系统、心跳服务或跨域事务。同步并发策略是有意保持简单：

```text
同一 scope 不建议同时触发；
重复触发直接提示已有同步正在运行；
不排队、不覆盖、不自动合并；
异常退出后的运行保护在 TTL 到期后释放；
失败后按 posts、galleries 或 all 重新执行。
```

对于单管理员、低并发的个人 Blog，这种方案可以解决最主要的工程风险：避免 Bun 进程或 Server Action 异常结束后留下永久锁死状态，同时不为低概率并发操作引入过重的运维复杂度。

Stage 8 当前不应被描述为“多人协作同步平台”或“分布式任务系统”，而应描述为：

> **面向个人 Blog 的统一内容同步入口与轻量运行保护。**

---

## 二、项目整体进度

### 2.1 基础平台与账户系统

项目已经形成以下基础能力：

- Next.js 16 App Router；
- React 19；
- TypeScript；
- Bun 脚本和运行环境；
- Tailwind CSS 4；
- Drizzle ORM；
- PostgreSQL/Neon 数据库；
- Better Auth 登录和 Session；
- ADMIN、USER 等角色权限边界；
- Zod 输入校验；
- Biome 代码质量工具；
- Cloudinary 媒体存储；
- Sharp 图片处理；
- Markdown、Frontmatter 和 Gallery YAML 内容解析。

### 2.2 Post 内容体系

Post 体系已经支持：

- Markdown 人工编辑源：`content/posts/**/*.md`；
- Frontmatter 标题、摘要、标签、状态、slug 和扩展元数据；
- GitHub、Demo、文档、Figma、Paper 等外链展示；
- Post 状态：发布、草稿、归档等；
- 文章标签和分类；
- Cloudinary 封面上传、替换和删除；
- 图片 WebP 优化和尺寸处理；
- 数据库文章导出 ZIP；
- 数据库封面回写本地 Frontmatter；
- `sync:pull` 数据库文章拉取；
- 本地与数据库文章差异检查；
- slug 冲突保护；
- Post Dashboard 管理；
- Post 领域同步服务：`ContentSyncService`。

### 2.3 Gallery 内容体系

Gallery 已独立于 Post 建立：

- 人工源：`content/photo-gallery/{album}/album.yaml`；
- 自动索引：`content/photo-gallery/gallery.yaml`；
- 原始图片输入：`content/.gallery-input/`；
- WebP 生成和图片尺寸限制；
- EXIF 白名单处理；
- RAW/ORF/CR2 等 unsupported 摘要；
- Cloudinary 独立 Gallery folder；
- `Gallery`、`GalleryImage` 数据模型；
- Gallery revision、syncStatus、contentHash、mergeBase；
- `/gallery` 和 `/gallery/[slug]` 前台页面；
- `/dashboard/gallery` ADMIN 管理页面；
- 相册和图片编辑；
- PENDING_DELETE 删除保护；
- Gallery patch dry-run 和 hash 检查；
- Gallery 三方字段冲突基础逻辑；
- Gallery 领域同步服务：`syncGalleries`。

### 2.4 Stage 8 统一同步体系

Stage 8 新增或完善了以下统一能力：

- `POSTS`、`GALLERIES`、`ALL` 三种 scope；
- Post/Gallery 独立领域编排；
- 统一 `SyncRunSummary`；
- 统一 `runId`；
- 统一运行状态：`RUNNING`、`SUCCEEDED`、`PARTIAL_SUCCESS`、`FAILED` 等；
- 统一错误码基础；
- 统一 `--json` 结构化摘要；
- scope 级 `--retry`；
- `ALL` 模式部分成功；
- CLI 和 Dashboard 共用编排器；
- Gallery 旧 CLI 接入统一编排器；
- 轻量 `SyncRun` 数据库记录；
- TTL 运行保护；
- 同域重复运行提示；
- ADMIN 同步 Action；
- Dashboard scope 选择；
- 数据库迁移和运行记录查询；
- CI/部署可使用双域 dry-run。

---

## 三、Stage 8 已完成内容

### 3.1 统一同步入口

统一入口：

```bash
bun run sync -- --scope posts --dry-run
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope all --dry-run
bun run sync -- --scope all --dry-run --json
```

不传 scope 时继续兼容原有 Post 默认行为：

```bash
bun run sync
```

统一入口仍然复用原有领域服务，没有将 Post 和 Gallery 写入同一张业务表，也没有创建跨域业务事务。

### 3.2 统一运行摘要

每次统一同步都会生成：

- `runId`；
- scope；
- 状态；
- dry-run 标记；
- 触发来源；
- 开始时间；
- 结束时间；
- Post 摘要；
- Gallery 摘要；
- 错误数；
- 冲突数；
- retryOf 关联信息。

Post 摘要包括：

- 总文章数；
- 已处理数；
- 成功数；
- 错误数；
- 媒体错误数；
- 归档数。

Gallery 摘要包括：

- 相册数；
- 图片数；
- 处理数；
- 上传数；
- 跳过数；
- unsupported 数；
- 归档数；
- pendingDelete 数；
- 冲突数；
- 错误数。

### 3.3 轻量 SyncRun 运行记录

新增：

```text
src/db/schema/sync-runs.ts
src/lib/sync/sync-repository.ts
drizzle/0004_mighty_hiroim.sql
```

`SyncRun` 用于保存最近的同步运行摘要和运行保护信息。

它不是完整审计系统，也不是实体任务队列。个人 Blog 只需要能够回答：

- 最近一次同步是什么时候执行的；
- 执行了哪个 scope；
- 是否成功；
- 失败时的错误摘要是什么；
- 当前是否有同步正在运行；
- 是否可以按 scope 重新执行。

### 3.4 TTL 运行保护

同步锁使用 `SyncRun` 中的锁字段：

```text
lockKey
lockExpiresAt
```

默认 TTL：

```text
30 分钟
```

保护行为：

1. 启动同步前检查过期运行；
2. 过期运行被标记为失败并释放锁；
3. 新运行尝试写入唯一锁 key；
4. 已有有效运行时返回 `LOCKED`；
5. 运行结束后清理锁字段；
6. 不在整个同步过程中持有数据库长事务锁。

### 3.5 Dashboard 统一触发

新增：

```text
src/lib/actions/sync-admin.ts
```

提供：

- `triggerSyncAction()`；
- `listSyncRuns()`；
- `getSyncRunAction()`；
- `retrySyncRun()`。

所有 Action 都要求 ADMIN Session，并通过 Zod 校验 scope、runId 和参数。

`/dashboard/sync` 已增加 scope 选择：

- Posts；
- Gallery；
- 全部。

页面同时提示管理员不要同时从 CLI 和 Dashboard 启动同一 scope。

### 3.6 兼容入口

以下旧入口继续保留：

```bash
bun run sync
bun run sync:pull
bun run sync:galleries -- --dry-run
bun run sync:galleries
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
```

其中 `sync:galleries` 已接入统一编排器和运行摘要。

`sync:pull`、`gallery:pull` 仍然保持各自的人工源回写职责，不被强行合并为统一业务流程。

---

## 四、有意保持轻量的设计取舍

### 4.1 不引入实体任务表

本项目是单管理员、低并发 Blog，不实现：

- `SyncTask` 表；
- 单文章重试；
- 单相册重试；
- 单图片重试；
- 任务队列；
- 自动调度。

失败后按 scope 重跑：

```bash
bun run sync -- --retry <run-id> --scope posts
bun run sync -- --retry <run-id> --scope galleries
```

### 4.2 不引入复杂分布式锁

本项目不使用：

- Redis；
- 外部队列；
- 心跳服务；
- 复杂 leader election；
- 长时间 PostgreSQL advisory lock；
- 跨域事务锁。

TTL 运行记录已经足以解决主要问题：异常退出不会永久阻塞下一次同步。

### 4.3 不合并 Post 和 Gallery 领域模型

以下边界保持不变：

```text
Post       -> Markdown -> Post -> Post media
Gallery    -> album.yaml -> Gallery/GalleryImage -> Gallery media
```

统一的是：

- 入口；
- scope；
- 运行摘要；
- 错误提示；
- 锁保护；
- Dashboard 触发方式。

不统一的是：

- 人工源；
- 数据库业务模型；
- 媒体处理规则；
- 发布规则；
- 回写规则。

---

## 五、数据库与迁移

Stage 8 新增迁移：

```text
drizzle/0004_mighty_hiroim.sql
drizzle/meta/0004_snapshot.json
```

新增 `SyncRun` 表，包含：

- 运行标识；
- 协议版本；
- scope；
- status；
- dryRun；
- triggeredBy；
- actorId；
- startedAt；
- finishedAt；
- exitCode；
- summary；
- errorCount；
- conflictCount；
- retryOf；
- lockKey；
- lockExpiresAt；
- createdAt；
- updatedAt。

迁移已实际执行：

```bash
bun run db:migrate
```

并确认可以重复执行而不会再次修改数据库。

---

## 六、质量验证

### 6.1 已通过

```bash
bunx tsc --noEmit --pretty false
bunx biome check <Stage 8 修改文件>
bun run content:check -- --no-examples
bun run db:migrate
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
bun run build
```

实际 dry-run 结果：

- Posts：9 篇文章成功处理；
- Gallery：3 个相册、6 张图片成功处理；
- All：Post 与 Gallery 均成功；
- 每次运行均生成独立 runId；
- 数据库中可以保存运行摘要；
- TTL 过期运行可以自动释放保护。

### 6.2 全仓库 lint 状态

当前：

```bash
bun run lint
```

仍然被既有文件阻塞：

```text
src/components/HeaderNav.tsx
```

问题是 Lucide import 排序和格式化。Stage 8 新增和修改的同步文件已经通过定向 Biome 检查，但在修复 `HeaderNav.tsx` 前不能声称全仓库 lint 完全通过。

### 6.3 构建警告

生产构建可以成功完成，但 Next.js/Turbopack 会对 Gallery 同步服务的动态文件系统访问给出 tracing warning。这是已有 Gallery 同步设计带来的部署提示，不阻塞本阶段构建，但后续可以通过限制动态路径或增加 Turbopack ignore 注释进一步优化。

---

## 七、当前未完成和部分完成能力

### 7.1 Post 完整双向冲突协议

Post 仍未完全具备与 Gallery 对齐的：

- contentHash；
- mediaHash；
- mergeBase 快照；
- revision 条件更新；
- 完整字段级三方冲突 DTO。

当前 Stage 8 只完成了统一入口和运行保护，没有声称 Post 已完成完整双向合并平台。

### 7.2 Gallery hash 语义进一步校正

Gallery 已有 hash、revision 和 mergeBase 字段，但 album metadata hash、媒体集合 hash 和单图 hash 仍可以继续细化。

当前实现足以支持 Stage 7 的 Gallery 同步和 Stage 8 的运行摘要，但不应描述为完整多人协作冲突解决系统。

### 7.3 Cloudinary 删除确认

当前已有：

- PENDING_DELETE；
- 不因普通本地删除直接调用 Cloudinary 删除；
- Dashboard 删除保护基础。

尚未作为 Stage 8 轻量版阻塞项完成：

- 延迟回收站；
- 删除恢复窗口；
- 完整 DELETE_CONFIRMED/DELETE_QUEUED 状态流转；
- 自动化回收任务。

当前策略是管理员确认后再人工处理，不自动进行高风险资源清理。

### 7.4 Dashboard 历史展示仍可继续增强

Dashboard 已经可以通过统一 Action 触发同步并选择 scope，但旧页面仍保留较多 Post 历史日志 UI。

后续可继续增加：

- 最近 `SyncRun` 列表展示；
- 运行状态筛选；
- Gallery 摘要卡片；
- `retryOf` 展示；
- 锁状态展示；
- 更清晰的部分成功提示。

这些属于体验增强，不影响当前轻量同步保护核心。

### 7.5 CI 统一入口仍可继续接入

代码和命令已经支持双域 dry-run，但现有 GitHub Actions 仍需要继续收敛为：

```bash
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
```

CI 不应执行生产真实写入、Cloudinary 删除或 `db:reset`。

---

## 八、当前项目能力分层

### 已完成

- 现代 Next.js 博客/作品集基础；
- Post Markdown 内容体系；
- Post Dashboard 管理；
- Post 图片和封面同步；
- Post 双向拉取基础；
- Gallery 独立内容体系；
- Gallery 前台和后台；
- Gallery 媒体处理和 Cloudinary 同步；
- Gallery revision 和 PENDING_DELETE 基础；
- 统一 Post/Gallery scope 入口；
- 统一运行摘要和 runId；
- 轻量 SyncRun 记录；
- TTL 防卡死保护；
- Dashboard ADMIN 触发和 scope 选择；
- 双域 dry-run；
- 生产构建。

### 部分完成

- Post contentHash/mergeBase；
- Gallery album/media hash 语义；
- Gallery Cloudinary 删除确认；
- Dashboard 全站历史运行展示；
- CI 统一入口；
- 全仓库 lint 质量门禁。

### 明确不实施

- 多人协作任务队列；
- 实体级自动重试；
- Redis/外部队列；
- 复杂分布式锁；
- 完整事件溯源审计；
- 在线媒体编辑器；
- RAW 解码；
- 跨域数据库事务。

---

## 九、后续建议

### 优先级一：修复质量基线

修复：

```text
src/components/HeaderNav.tsx
```

使以下命令完全通过：

```bash
bun run lint
```

### 优先级二：统一 CI

将 GitHub Actions 从旧脚本逐步调整到统一 dry-run 入口，并确保不会执行生产写入。

### 优先级三：增强 Dashboard 摘要

把 `SyncRun` 最近运行记录展示到 `/dashboard/sync`，提供：

- scope；
- status；
- runId；
- 时间；
- 错误数；
- retryOf；
- TTL 锁提示。

### 优先级四：按实际需求补 Post hash

如果未来确实需要 Post 本地和数据库同时修改保护，再补充 Post 的规范化 snapshot、contentHash 和 mergeBase。当前个人 Blog 单管理员场景不需要提前实现复杂冲突工作台。

### 优先级五：保持运维简单

后续实现继续遵守：

```text
能提示用户解决的问题，不自动化为复杂系统；
能按 scope 重跑的问题，不拆成任务队列；
能通过 TTL 恢复的问题，不引入心跳服务；
能保留人工确认的问题，不自动删除媒体资源。
```

---

## 十、最终项目状态

当前项目已经从单一 Post 博客发展为：

```text
个人博客与作品集
├── Post Markdown 内容体系
├── Gallery 独立相册体系
├── Cloudinary 媒体处理
├── PostgreSQL/Drizzle 数据库副本
├── ADMIN Dashboard 管理
├── Post/Gallery 独立领域同步
└── 轻量统一同步入口与 TTL 运行保护
```

当前最准确的项目定位是：

> **一个具备 Post、Gallery、媒体、后台管理和轻量统一同步能力的个人博客系统。**

Stage 8 的主要目标已经完成到适合当前产品规模的程度。剩余工作主要是质量门禁、CI 收敛、Dashboard 展示增强，以及在真实需求出现后再补充 Post 双向 hash 和 Gallery 删除回收细节，而不是继续扩展成复杂的分布式同步平台。