# 第八阶段开发计划（Stage 8：Post 与 Gallery 同步整合及全站优化）

> 制定日期：2026-09-12  
> 前置阶段：Stage 7 Gallery 内容同步与管理闭环  
> 本阶段定位：在 Post 现有同步流程和 Gallery Stage 7 独立同步闭环的基础上，抽取可复用的同步基础设施，统一编排、观测、审计、冲突处理、CI 和 Forker 文档，同时保持 Post 与 Gallery 的领域边界。

---

## 一、为什么需要 Stage 8

Stage 7 只解决 Gallery 的本地内容、数据库副本、Dashboard、Cloudinary 和回写问题。Post 继续沿用现有 `sync` / `sync:pull` 流程，Gallery 继续使用独立的 `sync:galleries` / `gallery:pull` 流程。

这种拆分可以降低 Stage 7 的实施风险，但也会暂时保留以下重复：

1. Post 和 Gallery 使用不同的同步入口和摘要格式；
2. 版本、快照、merge base、revision 和时间戳的语义可能不完全一致；
3. 同步锁、重试、审计、错误码和日志脱敏可能重复实现；
4. Dashboard 不能从一个入口查看全站同步状态和冲突；
5. CI、部署和 Forker 文档需要记忆多组命令和边界。

Stage 8 的目标是整合这些工程能力，而不是把 Post 和 Gallery 强行合并为一种内容模型。

核心原则：

```text
统一编排，不统一领域数据源；
统一基础设施，不统一所有业务字段；
统一可观测性，不牺牲 Post/Gallery 的独立失败隔离；
先兼容现有命令，再逐步迁移到统一入口。
```

---

## 二、Stage 8 的目标与非目标

### 2.1 目标

1. 建立可同时编排 Post 和 Gallery 的同步入口，并支持按 scope 单独执行。
2. 统一 dry-run、同步锁、重试、取消、退出码和结构化同步摘要。
3. 对比并统一 `contentHash`、`mergeBase`、`revision`、`sourceUpdatedAt` 和 `lastSyncedAt` 的语义。
4. 抽取通用的三方变更判断和乐观锁能力，但保留 Post/Gallery 各自的字段级 merge 规则。
5. 建立统一同步运行记录、审计事件、冲突记录和错误码映射。
6. 提供全站同步 Dashboard，能够分别查看 Post、Gallery 和整体状态。
7. 统一 CI、部署、回滚和 Forker 文档中的内容同步流程。
8. 保证 Post-only、Gallery-only 和完整 Blog 三种部署方式都可以独立工作。
9. 保证 Post 或 Gallery 单域失败时能够明确报告失败，不因为无关域失败而静默覆盖或丢失数据。
10. 在迁移期间保留现有 `sync`、`sync:pull`、`sync:galleries` 和 `gallery:pull` 的兼容行为，或提供明确的弃用周期。

### 2.2 非目标

1. 不把 Gallery 写入 `Post` 表，也不把 Post 转换为 Gallery 内容。
2. 不取消 `album.yaml`、Post Markdown 或 `gallery.yaml` 的既有责任边界。
3. 不让 `gallery.yaml` 成为 Dashboard 编辑源。
4. 不把 Cloudinary Admin API 暴露给前台或通用同步核心。
5. 不实现跨 Post/Gallery 的原子数据库事务；两个内容域必须支持部分成功和独立重试。
6. 不用全局“最后写入覆盖”替代字段级冲突保护。
7. 不在没有迁移、回滚和数据备份方案的情况下强制删除旧 CLI 入口。
8. 不为了统一类型而牺牲领域特有字段、媒体处理或删除确认规则。
9. 不把 Post 和 Gallery 的所有错误强行压缩成无法定位的单一错误码。

---

## 三、Stage 7 交付物和整合前提

Stage 8 开始前，Stage 7 至少应提供：

```text
GallerySyncService
Gallery 内容 hash 和媒体 hash
Gallery merge base / revision / 冲突状态
Gallery Dashboard Admin Actions
Gallery patch/ZIP 回写协议
Gallery 独立 sync run 和错误摘要
Cloudinary 删除确认和 PENDING_DELETE 流程
Gallery dry-run、重试和同步锁
```

Post 侧需要盘点并记录当前能力：

```text
Post 本地 Markdown 解析和 content:check
Post sync / sync:pull
Post 草稿、发布和归档语义
Post frontmatter 与正文的回写边界
Post 当前 revision、更新时间和冲突处理能力
Post 图片、封面和外链媒体处理方式
```

如果任一侧缺少对应能力，Stage 8 应先建立兼容适配器或迁移计划，不得在统一编排层中假设两侧已经完全对齐。

---

## 四、统一同步协议

### 4.1 内容域和人工源

| 内容域 | 人工编辑源 | 数据库副本 | 特有媒体/索引 |
| :--- | :--- | :--- | :--- |
| Post | `content/posts/**/*.md` | `Post` / `Tag` | 文章媒体、frontmatter、正文 |
| Gallery | `content/photo-gallery/{album}/album.yaml` | `Gallery` / `GalleryImage` | Cloudinary、处理后 WebP、EXIF |
| Gallery index | 无 | 查询/索引结果 | `gallery.yaml`，自动生成 |

统一协议只定义同步元数据和生命周期，不改变上述人工源责任。

### 4.2 版本字段职责

```text
contentHash       规范化人工内容的语义 hash
mediaHash         领域媒体集合或处理后文件的 hash
mergeBase         上一次成功同步时的共同快照
revision          数据库端乐观锁版本
sourceUpdatedAt   来源端修改时间，用于展示和审计
lastSyncedAt      上一次成功同步时间
syncStatus        当前域或实体的同步状态
syncRunId         所属同步运行记录
```

时间戳不得单独决定自动覆盖。统一冲突判断必须优先使用 `mergeBase + contentHash`，Dashboard 并发保存必须使用 `revision` 或等价的条件更新。

文件系统 mtime 只能作为诊断字段，例如 `localFileModifiedAt`，不能作为版本顺序的唯一依据。

### 4.3 通用三方判断

```text
BASE = 上一次成功同步的 merge base
LOCAL = 当前本地规范化内容
REMOTE = 当前数据库规范化内容
```

```text
localChanged  = hash(LOCAL)  != hash(BASE)
remoteChanged = hash(REMOTE) != hash(BASE)
```

决策：

| 本地 | 数据库 | 统一结果 |
| :--- | :--- | :--- |
| 未变更 | 未变更 | `IN_SYNC` |
| 已变更 | 未变更 | 接受本地，更新数据库 |
| 未变更 | 已变更 | 生成对应领域的本地 patch/回写结果 |
| 已变更 | 已变更且结果相同 | `IN_SYNC`，记录重复变更 |
| 已变更 | 已变更且字段冲突 | `CONFLICT`，停止自动覆盖 |
| 删除 | 未变更 | 进入领域对应的待删除/归档流程 |
| 两边删除 | 两边删除 | 保留审计记录并归档 |

Post 和 Gallery 可以各自定义字段级自动合并器，但必须返回统一的冲突结构：

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

## 五、统一同步编排

### 5.1 入口设计

优先提供统一入口：

```bash
bun run sync -- --scope posts
bun run sync -- --scope galleries
bun run sync -- --scope all
bun run sync -- --scope all --dry-run
```

兼容保留：

```bash
bun run sync
bun run sync:pull
bun run sync:galleries
bun run gallery:pull
```

统一入口应调用独立领域服务，而不是把两套业务逻辑复制到一个脚本中：

```text
SyncOrchestrator
├── PostSyncService
└── GallerySyncService
```

### 5.2 Scope 和部分成功

每次运行必须明确：

```text
scope: POSTS | GALLERIES | ALL
dryRun: boolean
triggeredBy: CLI | DASHBOARD | CI
```

`ALL` 模式下：

1. Post 和 Gallery 使用独立的领域锁或可区分的锁键；
2. 一个领域失败不能回滚另一个领域已经成功的结果；
3. 最终运行状态为 `SUCCEEDED`、`PARTIAL_SUCCESS` 或 `FAILED`；
4. 失败项必须可按领域和实体重试；
5. 摘要必须分别列出 Post 和 Gallery 统计。

### 5.3 统一摘要

```ts
type SyncRunSummary = {
  runId: string
  scope: 'POSTS' | 'GALLERIES' | 'ALL'
  status: 'SUCCEEDED' | 'PARTIAL_SUCCESS' | 'FAILED'
  dryRun: boolean
  startedAt: string
  finishedAt: string
  posts: PostSyncSummary
  galleries: GallerySyncSummary
  conflicts: number
  errors: number
}
```

领域摘要保留自身字段，例如 Gallery 的 `uploaded`、`unsupported`、`archived` 和 Cloudinary 删除确认，Post 的文章、标签和媒体统计不能被强行复用。

---

## 六、统一 Dashboard 和管理能力

新增或整理：

```text
src/app/dashboard/sync/page.tsx
src/app/dashboard/sync/loading.tsx
src/app/dashboard/sync/error.tsx
src/lib/actions/sync-admin.ts
src/lib/sync/
```

同步中心至少提供：

1. 按 Post、Gallery、全部范围查看同步运行；
2. 查看 dry-run、触发者、开始/结束时间和部分成功状态；
3. 查看领域级错误和冲突，不泄露 Secret、数据库 URL 或服务器绝对路径；
4. 按领域、实体和错误码重试；
5. 查看 merge base、revision、contentHash 的安全摘要；
6. 对 Gallery 删除继续要求管理员确认；
7. 对 Post 和 Gallery 使用各自的编辑器与字段校验；
8. 不允许同步中心绕过领域 Action 的权限、revision 和业务规则。

全站 Dashboard 仍然只允许 ADMIN 执行写操作和同步操作。USER 可以看到的内容继续由现有公开查询和授权规则决定。

---

## 七、建议的代码库调整

### 7.1 通用同步核心

```text
src/lib/sync/
  sync-types.ts          运行记录、状态、摘要和冲突类型
  sync-hash.ts           规范化和 hash 工具
  sync-merge.ts          通用三方判断，不包含领域字段规则
  sync-lock.ts           同步锁和并发保护
  sync-run.ts            运行记录、状态转换和重试
  sync-audit.ts          统一审计事件
  sync-errors.ts         公共错误码和安全错误映射
  sync-orchestrator.ts   scope 编排和部分成功策略
```

### 7.2 领域服务继续独立

```text
src/lib/posts/
  post-sync-service.ts
  post-conflicts.ts
  post-writeback.ts

src/lib/gallery/
  gallery-sync-service.ts
  gallery-conflicts.ts
  gallery-writeback.ts
  cloudinary.ts
```

通用核心不得：

- 解析 Markdown 或 YAML 业务字段；
- 决定 Post 发布状态或 Gallery 公开状态；
- 直接调用 Cloudinary Admin API；
- 绕过领域 Action 的权限和 revision 校验；
- 将 Gallery 图片媒体误当作 Post 媒体。

### 7.3 数据迁移策略

优先复用已有领域表，只有在确认查询、写入、回滚和性能影响后才新增通用表。建议新增或整理：

```text
sync_runs
sync_conflicts
sync_audit_events
```

如果 Stage 7 已有 Gallery 专用记录，Stage 8 应通过迁移或适配视图兼容旧数据，不直接删除历史审计和冲突记录。

---

## 八、CI、部署和回滚

### 8.1 Pull Request 检查

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

PR 不执行真实 Cloudinary 删除，不执行生产数据库写入，不执行生产环境的全量同步。

### 8.2 部署流程

```text
1. 迁移数据库并确认迁移版本；
2. 确认目标环境和 Secret；
3. 执行 Post dry-run；
4. 执行 Gallery dry-run；
5. 执行统一 all dry-run 并检查部分成功风险；
6. 按发布策略执行 scope=posts、scope=galleries 或 scope=all；
7. 验证 /posts、/gallery、/dashboard 和 /dashboard/sync；
8. 保存运行摘要和审计记录。
```

### 8.3 回滚

1. 先停止新的同步任务并保留 `syncRunId`；
2. 回滚 Git 中的 Post Markdown 或 Gallery `album.yaml`；
3. 对对应 scope 执行 dry-run；
4. 按领域重新同步，不使用全局强制覆盖；
5. 不自动删除 Cloudinary 资源；
6. 保留失败运行、冲突和 patch/ZIP 记录；
7. 必要时使用数据库备份恢复运行时副本，并再次执行领域校验。

---

## 九、Forker 和文档整合

Stage 8 应统一以下入口：

```text
README.md
content/README.md
scripts/README.md
.env.example
.github/README.md
documents/photo-gallery-design.md
documents/development-plan-stage7.md
```

README 应根据环境提供三条清晰路径：

```text
Post-only：不配置 Cloudinary，运行 Post 检查和同步；
Gallery-enabled：增加 Gallery 目录、Cloudinary 和 Gallery dry-run；
Full Blog：使用统一 scope=all 编排和同步中心。
```

文档必须明确：

- Post Markdown、Gallery `album.yaml`、`gallery.yaml` 和原始输入的责任边界；
- 哪些文件进入 Git，哪些文件只能存在于 `.gallery-input`；
- `sync --scope` 与旧命令的兼容关系；
- Cloudinary 缺失时 Post-only 环境的行为；
- 如何处理部分成功、冲突、重试和回滚；
- 如何区分数据库副本、媒体副本和人工源；
- 如何初始化空数据库和首次管理员；
- 如何读取同步摘要而不暴露敏感信息。

---

## 十、实施顺序

### 阶段 8.1：能力盘点和兼容测试

- 记录 Post 与 Gallery 现有同步行为；
- 为两侧建立相同场景的 fixture；
- 比较 hash、时间戳、revision、删除和回写语义；
- 确认 Stage 7 Gallery 数据可迁移、可回滚；
- 固化旧命令的兼容测试。

### 阶段 8.2：公共同步核心

- 实现公共类型、hash、merge base 和三方判断；
- 实现同步锁、运行状态、退出码和重试；
- 实现公共安全日志、审计事件和错误映射；
- 保持 Post/Gallery 领域服务独立。

### 阶段 8.3：统一编排和 CLI

- 实现 `--scope posts|galleries|all`；
- 实现部分成功和领域独立重试；
- 输出统一摘要和机器可读结果；
- 将旧命令接入适配层或保留兼容入口。

### 阶段 8.4：同步 Dashboard

- 建立 `/dashboard/sync`；
- 汇总 Post/Gallery 运行记录；
- 展示冲突、错误、重试和审计；
- 保持领域编辑器和删除确认独立。

### 阶段 8.5：CI、部署和 Forker 收敛

- 更新 README、脚本说明、环境变量和 GitHub Actions；
- 增加 Post-only、Gallery-enabled、Full Blog 验收矩阵；
- 完成迁移、回滚和旧命令弃用说明；
- 评估性能、日志量和大型相册/文章集合的分页与并发策略。

---

## 十一、交付门禁

- Post 和 Gallery 可以通过 scope 独立同步；
- `scope=all` 失败时不会静默丢失另一领域的成功结果；
- 统一入口不会绕过领域权限、校验、revision 或 Cloudinary 删除确认；
- 同一实体基于 merge base 同时变更时进入 `CONFLICT`；
- 时间戳不作为自动覆盖的唯一依据；
- 旧命令在迁移期仍有明确且经过测试的行为；
- 同步摘要能区分 Post、Gallery、媒体、冲突和错误；
- Post-only 环境不依赖 Cloudinary；
- Gallery-enabled 环境不要求重写 Post 内容；
- 全站 Dashboard 不能修改 `gallery.yaml`；
- 审计、错误和日志均不泄露 Secret、密码、数据库 URL 或绝对路径；
- CI 不执行生产写入和真实删除；
- 新 Forker 可以按文档完成所选部署模式的初始化和首次同步。

---

## 十二、验收命令和场景

基础质量：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
```

同步命令：

```bash
bun run sync -- --scope posts --dry-run
bun run sync -- --scope galleries --dry-run
bun run sync -- --scope all --dry-run
bun run sync:galleries -- --dry-run
```

必须验收：

- Post-only、Gallery-enabled 和 Full Blog 三种环境；
- 空数据库、空内容目录和缺失 Cloudinary 凭证；
- Post 单域成功、Gallery 单域成功和单域失败；
- `scope=all` 的成功、部分成功、失败和重试；
- 本地只修改 Post、只修改 Gallery、两边同时修改；
- Dashboard 并发 revision 冲突；
- Gallery 图片 hash 未变化和变化；
- Cloudinary 删除确认和回滚；
- patch/ZIP 应用前的 merge base 不匹配；
- ADMIN、USER 和未登录访问同步中心；
- 旧命令与统一入口产生等价的领域结果。

---

## 十三、风险和后续扩展

1. Post 和 Gallery 的字段级 merge 复杂度不同，公共核心必须避免过度抽象；
2. `scope=all` 的部分成功需要明确告警和可重复执行语义；
3. 大型相册和大量文章需要队列化、分页、有限并发和幂等重试；
4. 多部署环境需要区分数据库、媒体 namespace 和同步来源；
5. 多人编辑需要从单一 revision 扩展为变更历史和人工合并界面；
6. 旧命令长期兼容会增加维护成本，应在迁移完成后制定移除版本；
7. 如果未来增加其他内容域，应复用编排和审计能力，但必须新增独立领域适配器。