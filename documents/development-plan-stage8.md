# 第八阶段开发计划（Stage 8：Post 与 Gallery 产品化同步平台）

> 制定日期：2026-09-13<br>
> 前置阶段：Stage 7 Gallery 内容同步与管理闭环<br>
> 阶段目标：将 Post 和 Gallery 两套可以独立运行的内容流程，收敛为一个可观测、可恢复、可部署、可回滚的全站同步产品。<br>
> 产品原则：统一编排和运维体验，不合并 Post/Gallery 的领域模型、人工源或媒体规则。

---

## 一、阶段定位与产品完成定义

Stage 8 不再是“继续补同步脚本”，而是一次面向生产环境的同步平台收敛。完成后，管理员和 Forker 只需要理解一套同步运行模型，同时仍然能够按内容域独立执行、独立失败和独立重试。

产品必须能够回答：

1. 这次同步由谁、何时、以什么 scope 触发？
2. Post 和 Gallery 分别成功了什么、失败了什么？
3. 哪些变更是本地变更、远端变更或冲突？
4. 失败后能否只重试失败的领域或实体？
5. 同步是否正在运行，如何避免并发覆盖？
6. 回滚哪一份人工源、哪一份数据库副本、哪一份媒体资源？
7. Post-only、Gallery-enabled 和 Full Blog 如何分别部署？

核心原则：

```text
统一入口，不统一人工源；
统一运行记录，不统一领域字段；
统一锁、重试和退出码，不共享业务事务；
统一 Dashboard，不绕过领域权限和冲突规则；
先兼容现有命令，再迁移默认入口。
```

只有通过本文的代码、迁移、测试和部署验收，才能将 Stage 8 标记为“阶段完成”。

---

## 二、Stage 7 基线：已完成与待补齐

### 2.1 已完成能力

以下能力视为稳定前置条件，不再作为 Stage 8 的重复目标：

| 能力 | 当前实现 |
| :--- | :--- |
| Gallery 内容源 | `content/photo-gallery/{album}/album.yaml` |
| Gallery 自动索引 | `bun run gallery:index` 生成 `gallery.yaml` |
| Gallery 媒体同步 | `bun run sync:galleries`，支持 dry-run、WebP、hash、EXIF 白名单和 RAW unsupported 摘要 |
| Gallery 数据模型 | `Gallery`、`GalleryImage`，含 `revision`、`syncStatus`、`contentHash`、`mergeBase` |
| Gallery 管理后台 | `/dashboard/gallery`，仅 ADMIN 访问 |
| Gallery 写操作 | `src/lib/actions/gallery-admin.ts`，含 Zod 和 revision 条件更新 |
| Gallery 冲突基础 | `src/lib/gallery/gallery-conflicts.ts`，字段级三方判断 |
| Gallery 回写入口 | `bun run gallery:pull -- --patch ... [--dry-run]` |
| 删除保护 | 图片删除先进入 `PENDING_DELETE`，不直接删除 Cloudinary 资源 |
| 数据库迁移 | Stage 7 Gallery 字段迁移已纳入 Drizzle |
| 质量基线 | lint、TypeScript、内容检查、Gallery dry-run、生产构建可执行 |

### 2.2 尚未形成全站产品能力的部分

1. `sync -- --scope posts|galleries|all` 尚未实现，当前 `sync` 仍是 Post 入口。
2. Post 和 Gallery 尚未共享统一的 sync run、锁、重试、退出码和结构化摘要。
3. 现有 `SyncLog` 主要服务 Post，不能假设已经覆盖 Gallery。
4. Gallery patch 已支持安全应用和 hash 检查，但还没有 Dashboard patch/ZIP 生成下载闭环。
5. `PENDING_DELETE` 已保护误删，但 Cloudinary 删除确认、延迟删除和恢复流程仍需产品化。
6. `/dashboard/sync` 尚未成为 Post/Gallery 全站同步中心。
7. Post 侧还缺少与 Gallery 对齐的明确 merge base、content hash 和冲突 DTO。

Stage 8 不得通过文档措辞掩盖这些差异；只有代码、迁移、测试和部署验证完成后才能标记为已完成。

### 2.3 不在 Stage 8 重写的内容

- 不重写 Markdown、`album.yaml` 或 `gallery.yaml` 的人工源责任；
- 不把 Gallery 写入 `Post` 表；
- 不将 Cloudinary Admin API 放入前台或通用同步核心；
- 不把 Post 与 Gallery 放进跨域数据库事务；
- 不取消 `sync`、`sync:pull`、`sync:galleries`、`gallery:pull`，除非完成兼容迁移和弃用周期；
- 不实现在线图片裁剪、RAW 解码或复杂媒体编辑器；
- 不以“最后写入覆盖全部字段”替代冲突保护。

---

## 三、最终可部署产品的验收定义

### 3.1 同步运行

- 新入口支持 `posts`、`galleries`、`all` 三种 scope；
- dry-run 与真实执行使用同一领域服务，只改变写入策略；
- 同一领域禁止并发同步，重复触发返回可读的运行中状态；
- `all` 允许部分成功，不回滚另一个已经成功的领域；
- 每次运行拥有稳定 `runId`、开始/结束时间、触发者、scope、状态和退出码；
- 失败项可以按领域、相册、文章或错误码重试；
- 旧入口和新入口对相同输入产生等价领域结果。

### 3.2 一致性与安全

- Post 和 Gallery 均使用规范化 `contentHash`；
- `mergeBase` 是上次成功同步的快照；
- Dashboard 写操作使用 `revision` 或等价条件更新；
- 两端相对同一 base 同时变更时进入 `CONFLICT`；
- 冲突不会生成可直接覆盖人工源的 patch；
- Gallery 删除先进入 `PENDING_DELETE`，真实 Cloudinary 删除需要二次确认；
- 日志不得泄露 Secret、密码、DATABASE_URL、绝对路径或原始图片数据。

### 3.3 部署与运维

- Post-only 需要配置 Cloudinary 以存储 Post 图片和封面，但不需要 Gallery 输入目录；
- Gallery-enabled 能完成 Gallery dry-run、媒体同步和数据库同步；
- Full Blog 能执行 `scope=all` 并显示部分成功；
- 空数据库、空内容目录、缺失可选媒体凭证都有明确行为；
- 迁移可重复执行，失败可定位，回滚有说明；
- CI 只执行 dry-run 和构建，不执行生产写入或真实删除；
- ADMIN 可以查看运行摘要、冲突和安全错误；
- 发布失败时可以按 scope 回滚。

---

## 四、统一内容责任边界

| 内容域 | 人工编辑源 | 数据库副本 | 自动生成/媒体副本 | 删除责任 |
| :--- | :--- | :--- | :--- | :--- |
| Post | `content/posts/**/*.md` | `Post`、`Tag` | Post 图片和 Cloudinary 媒体 | 按 Post 现有归档规则 |
| Gallery | `content/photo-gallery/{album}/album.yaml` | `Gallery`、`GalleryImage` | `gallery.yaml`、WebP、Cloudinary 资源 | `PENDING_DELETE` 后管理员确认 |
| Gallery 原始输入 | `content/.gallery-input/{album}/` | 不作为人工内容入库 | 临时处理输入，不提交 Git | 外部工具或人工清理 |

规则：

1. `gallery.yaml` 永远由 `gallery:index` 生成，不能成为 Dashboard 编辑源。
2. Gallery 原始 JPEG、PNG、TIFF、RAW 只能进入 `.gallery-input`。
3. 数据库是运行时副本，不取代 Post Markdown 或 Gallery `album.yaml`。
4. Cloudinary URL、public ID、处理后 WebP 都是自动字段，不反向成为人工源。
5. 通用同步核心只处理元数据、运行状态和编排，不决定领域业务字段。

---

## 五、统一同步协议

### 5.1 统一运行模型

```ts
type SyncScope = 'POSTS' | 'GALLERIES' | 'ALL'
type SyncRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'PARTIAL_SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

type SyncRunSummary = {
  runId: string
  scope: SyncScope
  status: SyncRunStatus
  dryRun: boolean
  triggeredBy: 'CLI' | 'DASHBOARD' | 'CI'
  startedAt: string
  finishedAt: string | null
  posts: PostSyncSummary
  galleries: GallerySyncSummary
  conflicts: number
  errors: number
}
```

Gallery 摘要至少保留 `albums`、`images`、`processed`、`uploaded`、`skipped`、`unsupported`、`archived`、`pendingDelete`、`conflicts`、`errors`；Post 保留文章、标签、媒体和归档统计。

### 5.2 统一版本字段

```text
contentHash       规范化人工内容的语义 hash
mediaHash         领域媒体集合或处理后文件的 hash
mergeBase         上一次成功同步的共同快照
revision          数据库侧乐观锁版本
sourceUpdatedAt   人工源修改时间，仅用于诊断和展示
lastSyncedAt      上一次成功同步时间
syncStatus        当前实体同步状态
syncRunId         最后一次处理该实体的运行记录
```

mtime 不能单独决定覆盖。自动决策优先使用 `mergeBase + contentHash`；Dashboard 保存优先使用 `revision` 条件更新。

### 5.3 通用三方判断

```text
BASE   = 上一次成功同步的 mergeBase
LOCAL  = 当前本地规范化内容
REMOTE = 当前数据库规范化内容
```

| LOCAL 相对 BASE | REMOTE 相对 BASE | 结果 |
| :--- | :--- | :--- |
| 未变更 | 未变更 | `IN_SYNC` |
| 已变更 | 未变更 | 接受本地，更新数据库 |
| 未变更 | 已变更 | 生成领域 patch/回写结果 |
| 已变更 | 已变更且语义相同 | `IN_SYNC`，记录重复变更 |
| 已变更 | 已变更且字段不同 | `CONFLICT`，停止自动覆盖 |
| 删除 | 未变更 | 进入领域归档或待删除流程 |
| 两边删除 | 两边删除 | 保留审计记录并归档 |

统一冲突 DTO：

```ts
type SyncConflict = {
  entityType: 'POST' | 'GALLERY' | 'GALLERY_IMAGE'
  entityId: string
  field: string
  baseValue: unknown
  localValue: unknown
  remoteValue: unknown
  resolution: 'UNRESOLVED' | 'LOCAL' | 'REMOTE' | 'MANUAL'
}
```

---

## 六、统一入口与兼容策略

### 6.1 Stage 8 完成后的主入口

```bash
bun run sync -- --scope posts --dry-run
bun run sync -- --scope posts
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope galleries
bun run sync -- --scope all --dry-run
bun run sync -- --scope all
bun run sync -- --retry <run-id> --scope galleries
```

`--scope` 和 `--retry` 是 Stage 8 必须新增的能力；在实现前不得在 README 中将它们当作现有命令。

### 6.2 兼容入口

Stage 8 期间继续保留：

```bash
bun run sync
bun run sync:pull
bun run sync:galleries -- --dry-run
bun run sync:galleries
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
```

旧命令通过适配层调用领域服务，不复制逻辑；保留原有退出行为并输出 `runId` 或等价诊断标识。至少经过一个稳定版本周期和等价结果测试后，才可以发布弃用提示。

### 6.3 编排模型

```text
SyncOrchestrator
├── PostSyncAdapter
│   └── existing sync / sync:pull service
└── GallerySyncAdapter
    └── GallerySyncService / gallery:pull service
```

`ALL` 使用独立领域锁。一个领域失败不能回滚另一个已经成功的领域；最终状态为 `SUCCEEDED`、`PARTIAL_SUCCESS` 或 `FAILED`。

---

## 七、实施阶段与交付物

### 阶段 8.1：领域适配和协议冻结

- 为 Post 和 Gallery 定义摘要适配器；
- 为 Post 补充规范化 content hash 和 merge base 兼容结构；
- 接入 Gallery Stage 7 的 `revision`、`contentHash`、`mergeBase` 和冲突状态；
- 固化旧命令退出码、dry-run 和错误摘要；
- 建立 Post-only、Gallery-enabled、Full Blog fixture；
- 确认历史 `SyncLog` 可以继续查询。

交付物：协议类型、兼容测试和迁移说明，不改变现有生产命令行为。

### 阶段 8.2：公共同步基础设施

```text
src/lib/sync/
  sync-types.ts       运行记录、状态、摘要和冲突类型
  sync-hash.ts        规范化和 hash
  sync-merge.ts       通用三方判断
  sync-lock.ts        并发保护
  sync-run.ts         状态机和运行记录
  sync-retry.ts       可重试任务
  sync-errors.ts      错误码和安全错误映射
  sync-audit.ts       审计事件
  sync-orchestrator.ts scope 编排和部分成功
```

必须实现稳定 hash、锁、运行状态机、安全日志、可重试错误分类和可恢复运行摘要。公共核心不得解析 Markdown/YAML 业务字段、决定发布状态、调用 Cloudinary Admin API 或绕过领域 Action。

建议错误码：

```ts
type SyncErrorCode =
  | 'INVALID_INPUT'
  | 'LOCKED'
  | 'DATABASE_UNAVAILABLE'
  | 'MIGRATION_REQUIRED'
  | 'CONTENT_INVALID'
  | 'SLUG_CONFLICT'
  | 'REVISION_CONFLICT'
  | 'MERGE_CONFLICT'
  | 'UNSUPPORTED_MEDIA'
  | 'CLOUDINARY_UNAVAILABLE'
  | 'CLOUDINARY_UPLOAD_FAILED'
  | 'PENDING_DELETE_CONFIRMATION'
  | 'WRITEBACK_CONFLICT'
```

### 阶段 8.3：统一 CLI 和部分成功

- 实现 `--scope posts|galleries|all`、`--dry-run`、`--retry`、`--json`；
- `ALL` 分别执行两域并支持部分成功；
- 失败项记录实体级标识，支持按领域重试；
- 为空目录、缺少 Cloudinary、RAW、slug 冲突和数据库不可用提供可读摘要；
- 将 `sync:galleries` 和 `gallery:pull` 接入适配层，保留兼容行为。

### 阶段 8.4：全站同步 Dashboard

整理现有 `/dashboard/sync`，补齐：

```text
src/app/dashboard/sync/page.tsx
src/app/dashboard/sync/loading.tsx
src/app/dashboard/sync/error.tsx
src/lib/actions/sync-admin.ts
```

必须支持按 scope/状态/触发者/时间筛选，展示 Post、Gallery 和整体摘要，查看冲突和安全字段摘要，仅 ADMIN 重试失败项，显示运行锁和可重试状态。页面只能调用领域 Action，不能直接操作 Drizzle、Cloudinary 或工作区文件。

### 阶段 8.5：部署、CI 和文档产品化

- 更新 README、内容说明、脚本说明、环境模板和 GitHub Actions；
- CI 执行 lint、类型检查、内容检查、索引、双域 dry-run 和 build；
- 生产发布前执行迁移检测和双域 dry-run；
- 文档提供三种 Forker 初始化路径；
- 明确备份、迁移、回滚、Cloudinary 删除恢复和冲突处理；
- 记录旧命令兼容期和移除条件。

---

## 八、数据库、锁与审计

### 8.1 运行记录

优先新增独立同步表，不改变 Post/Gallery 领域语义：

```text
SyncRun
- id, scope, status, dryRun, triggeredBy
- startedAt, finishedAt, exitCode
- summary, errorCount, conflictCount

SyncConflict
- id, syncRunId, entityType, entityId, field
- baseValue, localValue, remoteValue
- resolution, resolvedBy, resolvedAt

SyncAuditEvent
- id, syncRunId, actorId, action
- entityType, entityId, result, metadata, createdAt
```

如果继续使用已有 `SyncLog`，必须通过扩展字段或兼容视图接入统一查询，不能丢弃历史记录。

### 8.2 锁策略

- 锁键至少区分 `POSTS`、`GALLERIES` 和 `ALL`；
- `ALL` 以固定顺序获取两个领域锁，避免死锁；
- 锁具有超时、持有者 `runId` 和安全释放机制；
- 进程崩溃后不能永久阻塞后续同步；
- dry-run 也要防止同域真实同步并发运行；
- 锁失败返回 `LOCKED`，不能无提示地排队覆盖用户操作。

---

## 九、CI、部署和回滚

### 9.1 Pull Request 门禁

统一入口完成后执行：

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run gallery:index
bun run sync -- --scope posts --dry-run
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope all --dry-run
bun run build
```

PR 禁止生产数据库写入、真实 Cloudinary 删除、未经确认的工作区回写、`db:reset` 和提交 `.gallery-input` 原始图片。

### 9.2 部署顺序

```text
1. 备份目标数据库并确认 DATABASE_URL；
2. bun run db:migrate；
3. 确认迁移版本和管理员账号；
4. 执行 scope=posts dry-run；
5. Gallery-enabled 执行 scope=galleries dry-run；
6. Full Blog 执行 scope=all dry-run；
7. 检查 conflicts、unsupported、errors、pendingDelete；
8. 按发布窗口执行对应 scope；
9. 验证 /posts、/gallery、/dashboard、/dashboard/sync；
10. 保存 runId、摘要和部署记录。
```

Post-only 跳过 Gallery scope，但仍必须配置 Cloudinary 以完成 Post 图片和封面上传。Post 媒体同步缺少 Cloudinary 凭证时必须明确失败，不能将本地图片伪装成已完成的 CDN 同步。Gallery 凭证或 Gallery 输入目录缺失时，Gallery scope 单独失败或跳过，并且不影响已经成功的 Post scope。

### 9.3 回滚

1. 停止新的同步触发并记录 `runId`；
2. 回滚 Git 中的 Post Markdown 或 Gallery `album.yaml`；
3. 重新生成 `gallery.yaml`；
4. 对受影响 scope 执行 dry-run；
5. 按领域重新同步，不使用全局强制覆盖；
6. 不自动删除 Cloudinary，误删使用备份或恢复窗口；
7. 数据库副本异常时使用数据库备份恢复，再执行领域校验；
8. 保留失败运行、冲突、审计和 patch 记录。

禁止把 `db:reset` 作为回滚方案。迁移回滚必须提供对应 SQL、影响范围和备份说明。

---

## 十、Forker 三种部署路径

### 10.1 Post-only

```bash
bun install
cp .env.example .env
# 配置 DATABASE_URL、BETTER_AUTH_SECRET、BETTER_AUTH_URL
# Post 图片/封面同步还必须配置 CLOUDINARY_CLOUD_NAME、CLOUDINARY_API_KEY、CLOUDINARY_API_SECRET
bun run db:migrate
bun run content:check -- --no-examples
bun run sync -- --scope posts --dry-run
bun run sync -- --scope posts
bun run reset-admin-password
bun run dev
```

需要 Cloudinary 以存储 Post 图片和封面；不要求配置 Gallery 输入目录，也不要求执行 Gallery 同步。

### 10.2 Gallery-enabled

在 Post-only 已配置 Cloudinary 的基础上，增加 `GALLERY_INPUT_DIR`（或使用默认的 `./content/.gallery-input`），然后执行：

```bash
bun run gallery:index
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope galleries
```

RAW 必须先由外部工具转换为 JPEG、PNG 或 TIFF。Dashboard 修改后先检查 revision 和冲突，再通过受保护的 patch/回写流程应用到工作区。

### 10.3 Full Blog

```bash
bun run db:migrate
bun run content:check -- --no-examples
bun run sync -- --scope all --dry-run
bun run sync -- --scope all
bun run dev
```

`scope=all` 必须区分 `SUCCEEDED`、`PARTIAL_SUCCESS` 和 `FAILED`，不可因单域失败输出整体成功。

---

## 十一、交付门禁

### 必须通过

- [ ] `scope=posts`、`scope=galleries`、`scope=all` 可独立执行；
- [ ] `scope=all` 支持部分成功、失败项重试和独立退出码；
- [ ] 同域并发同步会被锁拒绝；
- [ ] 每次运行有 `runId`、状态、摘要、错误和冲突统计；
- [ ] Post/Gallery 领域服务保持独立；
- [ ] 统一入口不绕过 ADMIN、Zod、revision 和删除确认；
- [ ] merge base 同时变更必然进入 `CONFLICT`；
- [ ] patch/ZIP/hash 不匹配不会覆盖人工源；
- [ ] `gallery.yaml` 只能由索引命令生成；
- [ ] Post-only 已配置 Cloudinary，可完成 Post 图片和封面同步；
- [ ] CI 不执行生产写入、真实删除或 `db:reset`；
- [ ] Dashboard 只向 ADMIN 展示和开放同步操作；
- [ ] 新环境可以按文档完成迁移、管理员初始化、dry-run 和首次同步；
- [ ] lint、TypeScript、内容检查和生产构建全部通过。

### 不得声称已完成

以下任一项未完成时，Stage 8 只能标记为“开发中”或“候选发布”：

- 没有统一运行记录却声称支持全站审计；
- 没有领域锁却声称支持并发安全；
- 没有失败项重试却声称支持可恢复同步；
- 没有真实 scope 入口却在 README 中把它当作现有命令；
- 没有迁移和回滚说明却要求生产执行；
- Gallery 只有 `PENDING_DELETE` 标记却声称完成 Cloudinary 回收；
- 只通过 TypeScript，却没有 dry-run、构建和部署路径验证。

---

## 十二、验收命令和场景

### 12.1 当前仓库基线

统一入口完成前，当前可执行基线为：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run gallery:index
bun run sync:galleries -- --dry-run
bun run db:migrate
bun run build
```

### 12.2 Stage 8 完成后

```bash
bun run sync -- --scope posts --dry-run
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope all --dry-run
bun run sync -- --scope all
bun run sync -- --retry <run-id> --scope galleries
```

### 12.3 必测场景

- Post-only、Gallery-enabled、Full Blog；
- 空数据库、空内容目录、缺少 Cloudinary；
- Post 成功/Gallery 失败、Post 失败/Gallery 成功、双域成功；
- `SUCCEEDED`、`PARTIAL_SUCCESS`、`FAILED`、`CANCELLED`；
- 重复触发、锁超时恢复和失败重试；
- 只修改 Post、只修改 `album.yaml`、两边同时修改；
- Dashboard revision 冲突和 merge base 冲突；
- 图片 hash 未变化、变化、unsupported RAW；
- slug 冲突、数据库不可用、Cloudinary 上传失败；
- `PENDING_DELETE`、确认删除、取消删除和回滚；
- patch/ZIP/hash 不匹配；
- ADMIN、USER、未登录访问同步中心；
- 旧命令与统一入口产生等价领域结果；
- 移动端、桌面端和低带宽下的同步中心体验。

---

## 十三、Stage 8 之后的范围

以下内容不阻塞 Stage 8 的可部署产品：

1. 大型相册和文章集合的队列化、分页和有限并发；
2. 多人编辑的完整变更历史和人工合并工作台；
3. Cloudinary 延迟回收站、跨环境媒体 namespace 和自动恢复；
4. Gallery slug history 与旧 URL 迁移；
5. 本地/其他 CDN provider 抽象；
6. 发布审批、通知和运营分析；
7. 新内容域接入统一编排器。

这些扩展必须复用 Stage 8 的运行记录、锁、冲突 DTO、错误码和审计边界，不能重新建立平行同步体系。