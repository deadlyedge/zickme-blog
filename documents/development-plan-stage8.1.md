# 第八阶段第一子阶段开发计划（Stage 8.1：轻量同步运行保护与统一入口）

> 制定日期：2026-09-13<br>
> 所属阶段：Stage 8 Post 与 Gallery 产品化同步平台<br>
> 前置阶段：Stage 7 Gallery 内容同步与管理闭环<br>
> 本阶段定位：以轻量方案补齐统一同步入口、运行摘要、TTL 防卡死保护和可读并发提示<br>
> 完成状态：规划中。不得将 Stage 8 或 Stage 8.1 标记为已完成，除非通过本文末尾的代码、迁移、测试和部署验收。

---

## 一、阶段目标

Stage 8.1 不负责一次性完成整个同步产品，也不负责构建分布式任务平台。考虑到本项目是单管理员、低并发的个人 Blog，目标是以最小复杂度把当前统一 CLI 雏形提升为可用的同步入口：

```text
统一摘要可被 CLI、Server Action 和 CI 复用；
每次运行具有可诊断的 runId 和有限期限的运行保护；
Post/Gallery 领域仍然独立，只通过适配器接入编排器；
同域重复触发得到明确提示，异常退出不会永久阻塞；
运行摘要和错误码具备稳定契约；
旧入口与统一入口的兼容边界明确且可测试；
不为低概率恶意并发引入队列、心跳、实体任务和复杂审计系统。
```

本阶段完成后，系统应当能够真实回答：

1. 某次同步由谁、何时、以什么 scope 和模式触发；
2. 运行当前处于什么状态，是否被锁占用；
3. Post 和 Gallery 各自处理了多少实体、媒体和错误；
4. 失败后是否可以按 scope 重新执行；
5. 是否有明确的“已有同步正在运行，请稍后重试”提示；
6. 旧命令和统一入口分别调用了什么领域服务。

---

## 二、当前 Stage 8 完成状况

### 2.1 已完成或基本完成的能力

| 能力 | 当前状态 | 代码依据 | 结论 |
| :--- | :--- | :--- | :--- |
| `posts`、`galleries`、`all` scope | 已有 CLI 雏形 | `scripts/sync-content.ts`、`src/lib/sync/sync-types.ts` | 可继续复用，但需要持久化运行记录 |
| 双域编排 | 已有基础实现 | `src/lib/sync/sync-orchestrator.ts` | 保持适配器方向，不应继续把领域逻辑塞入公共核心 |
| `runId`、开始/结束时间 | 已存在于进程内摘要 | `SyncRunSummary` | 建议轻量持久化，至少保留诊断能力 |
| `dry-run` | Post/Gallery 领域服务均可调用 | 两个现有领域 Service | 需要增加等价结果测试 |
| `--json` 摘要 | 已有 | `scripts/sync-content.ts` | 需要固定 schema 和版本策略 |
| `--retry` 参数 | 仅记录 `retryOf` 并重新执行 scope | `scripts/sync-content.ts`、`sync-orchestrator.ts` | 明确定位为 scope 重试，不实现实体级重试 |
| 部分成功 | `ALL` 失败一域时会形成摘要 | `sync-orchestrator.ts` | 需要持久化领域结果和独立退出码规则 |
| 三方字段合并函数 | 公共版本和 Gallery 版本均存在 | `src/lib/sync/sync-merge.ts`、`src/lib/gallery/gallery-conflicts.ts` | 需要统一字段比较和 `undefined/null` 规则 |
| Gallery revision/hash/mergeBase | 已存在 | `src/db/schema/gallery.ts` | 需要校正快照和 hash 的语义一致性 |
| ADMIN Dashboard 入口 | 已有旧 Post 同步页面 | `src/app/dashboard/sync/page.tsx` | 不是全站同步中心，需要后续改造 |
| Post/Gallery 领域独立 | 当前仍保持独立 | `ContentSyncService`、`syncGalleries` | 是正确边界，必须保留 |

### 2.2 明确未完成的能力

| 缺陷 | 影响 | Stage 8.1 处理方式 |
| :--- | :--- | :--- |
| 没有独立 `SyncRun` 表 | 运行结束后缺少统一历史摘要 | 本阶段可新增轻量运行记录，也可先保留安全 JSON 日志；不要求任务表 |
| 只有进程内 Map 锁 | 同一进程之外无法识别运行中状态 | 本阶段使用带 TTL 的轻量数据库锁；不做队列和复杂心跳 |
| 没有实体级任务记录 | 无法只重试失败文章/相册 | 本阶段明确不实现；失败后按 scope 人工重跑 |
| `SyncLog` 只描述 Post | Gallery 结果无法进入统一审计查询 | 保留历史 `SyncLog`，新增统一表并建立兼容关联 |
| Post 没有 `contentHash`/`mergeBase` | 无法证明 Post 双向同步的三方结果 | 本阶段定义规范化快照和迁移字段 |
| Gallery album hash 不稳定 | 当前部分写入使用单张图片 hash，不能代表 album 内容 | 本阶段统一 album metadata/media hash 计算策略 |
| Dashboard 仍调用 Post Action | 无 scope 选择和统一提示 | 本阶段增加统一触发入口或明确提示，完整筛选后置 |
| Cloudinary 删除无确认闭环 | `PENDING_DELETE` 只是状态，不是安全删除流程 | 本阶段定义状态机和确认接口；实际延迟回收可后置 |
| CI 仍直接执行旧脚本 | 不能验证双域统一入口和禁止生产写入 | 本阶段增加 dry-run 门禁和环境保护 |
| 全局 lint 有既有失败 | 无法宣称质量门禁完整通过 | 本阶段记录并修复 `HeaderNav.tsx` 基线问题 |

### 2.3 当前验证基线

当前已验证：

```bash
bunx tsc --noEmit --pretty false
bunx biome check src/lib/sync scripts/sync-content.ts
bun run content:check -- --no-examples
bun run gallery:index
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
bun run build
```

当前仍存在的质量问题：

```text
bun run lint
```

会被现有 `src/components/HeaderNav.tsx` 的 Biome import 排序和格式问题阻塞。Stage 8.1 不得忽略该问题，也不得只因为新增同步模块单独通过 Biome 就声称全仓库 lint 已通过。

---

## 三、未完成缺陷的实施可能性分析（轻量个人 Blog 方案）

### 3.1 统一运行记录：轻量可选持久化

**判断：高可行性 / 不应过度设计。**

当前已有 `SyncLog`，但字段固定服务 Post：只有 `totalPosts`、`successCount`、`errorCount` 和 Post 日志数组。对于个人 Blog，不需要引入完整事件溯源模型。推荐增加一个轻量的 `SyncRun` 表，或者在短期内复用 `SyncLog` 并将统一摘要写入安全 JSON 字段；不要为了低频运行引入多张审计表。

```text
SyncRun（建议）
SyncLock（建议与 SyncRun 合并或独立）
```

历史 `SyncLog` 继续用于兼容查询；新运行写入 `SyncRun`，必要时使用 `legacySyncLogId` 关联旧记录。这样可以：

- 保留旧 Dashboard 历史数据；
- 避免把 Gallery 字段强行加入 Post 日志模型；
- 为 Dashboard 提供最近运行摘要；
- 为锁超时恢复提供 owner runId；
- 为人工按 scope 重跑提供诊断信息。

运行记录不是业务事务。记录写入失败时，真实同步应在开始写入人工源或媒体前返回可读错误；dry-run 可以退化为 stdout JSON，但必须明确说明没有持久化记录。历史记录只保留最近若干条即可，不需要完整审计保留策略。

### 3.2 防卡死锁：低复杂度、带 TTL 的运行保护

当前 `sync-lock.ts` 使用模块级 `Map`，只能保护同一进程内的调用。它可以保留作为单进程快速保护，但不能解决 Server Action 和 Bun CLI 同时运行的问题。

推荐使用一张简单的数据库锁/运行表：

```text
lockKey          POSTS | GALLERIES | ALL
ownerRunId       当前运行 ID
acquiredAt       获取时间
heartbeatAt      最近心跳
expiresAt        超时时间
```

获取锁使用唯一键和条件更新；释放锁必须带 `ownerRunId`；超过 TTL 的锁允许新运行接管。不要排队，不要自动合并，不要实现复杂心跳。重复触发直接返回：`已有同步正在运行，请等待完成后再重试`。`ALL` 可以按固定顺序获取两个 scope；如果第二个锁失败，释放第一个并终止本次运行。

不建议在当前项目引入 Redis、队列或依赖连接生命周期的 PostgreSQL advisory lock。TTL 锁表足以防止 Bun/Server Action 异常退出后永久卡住。

### 3.3 重试：只做 scope 级人工重跑

当前 Post Service 和 Gallery Service 都是批量运行接口，只有最终摘要，没有统一任务列表。对于个人 Blog，这不是必须补齐的缺陷。`--retry` 直接定义为上一次失败 scope 的重新执行即可。

推荐保持简单：

```ts
type SyncRetry = {
	previousRunId: string
	scope: 'POSTS' | 'GALLERIES' | 'ALL'
	dryRun: boolean
}
```

失败项通过摘要、日志和错误码展示；用户确认后按 `posts` 或 `galleries` scope 重跑。不要在文档或 CLI 中声称支持文章/相册实体级重试。

### 3.4 Post contentHash / mergeBase：中等可行性，必须先冻结规范

Post 当前有 Markdown frontmatter、正文、标签、媒体和自动字段；不能直接对原始文件全文 hash，否则换行、字段顺序或生成字段变化会制造误报。

建议 Post 快照至少包括：

```text
slug
title
excerpt
content
status
sourceUrl
normalized metadata
normalized tags
poster reference
```

以下字段必须排除或单独处理：

- `updatedAt`、`createdAt`；
- Cloudinary 临时 URL；
- 运行 ID；
- 本地绝对路径；
- 仅由索引或媒体处理生成的字段。

首个版本可以将 `mergeBase` 存为 JSONB 快照，将 `contentHash` 存为 SHA-256。迁移前必须对现有 Post 批量生成基线，并区分“未初始化”与“空内容 hash”。

### 3.5 Gallery hash / mergeBase：中等可行性，现有实现需要修正

Gallery 已有相关字段，但当前 Gallery 同步中存在语义风险：相册的 `contentHash` 在处理图片时可能使用单张处理图片 hash，不能完整代表 `album.yaml` 元数据、图片集合和排序。

推荐拆分：

```text
contentHash = album.yaml 规范化人工字段 hash
mediaHash   = 按 sourcePath + fileHash + order 排序后的媒体集合 hash
mergeBase   = 上次成功同步的人工字段快照
```

`gallery.yaml` 仍然只是自动生成索引，不能进入人工源 hash。GalleryImage 的 `contentHash` 单独表示图片人工字段或处理结果，不能与 Gallery album hash 混用。

### 3.6 Dashboard 全站同步中心：轻量触发和提示即可

当前 `/dashboard/sync` 是 Client Component，直接调用 Post 专用 Action。若先改 UI、后定义统一运行记录，容易产生第二套状态模型。

推荐顺序：

1. 建立一个轻量 `sync-admin.ts` Server Action；
2. Action 内部校验 ADMIN、Zod 和 scope；
3. 页面只显示最近运行、当前锁状态和错误摘要；
4. 运行触发通过 Action 调用 `SyncOrchestrator`，不能直接访问工作区文件；
5. 不实现复杂分页、冲突工作台和实体级重试。

Next.js 页面可以保持 Client Component，但查询、权限和写操作必须在 Server Action/Server Component 边界内完成。

### 3.7 Gallery 删除确认与恢复：保留人工确认即可

Stage 8.1 只实现最小安全流程，不实现复杂回收站：

```text
IN_SYNC
  -> PENDING_DELETE
  -> DELETE_CONFIRMED
  -> DELETE_QUEUED
  -> DELETE_SUCCEEDED / DELETE_FAILED
```

要求：

- 普通 Dashboard 编辑只能进入 `PENDING_DELETE`；
- Cloudinary 删除必须由 ADMIN 二次确认；
- 确认操作使用 revision 条件更新；
- 删除前保存 publicId、sourcePath、fileHash 和 runId；
- 删除失败不能伪装成成功；
- 取消删除可以恢复到上一个安全状态。

实际 Cloudinary 删除和延迟回收窗口不作为 Stage 8.1 阻塞项。只要普通同步不直接删除、管理员确认前不调用删除 API，并且失败后能人工处理即可。

### 3.8 CI、部署和回滚：高可行性，依赖前述契约

当前 CI 仍调用旧脚本，尚未执行双域统一入口。Stage 8.1 完成迁移后即可加入：

```bash
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
```

CI 必须禁止：

- 生产数据库真实写入；
- Cloudinary 真实删除；
- `db:reset`；
- 未确认的工作区回写；
- 提交 `.gallery-input` 原始媒体。

回滚优先采用人工源 Git 回滚和领域重同步，不通过 `db:reset`。数据库迁移回滚需要提供向下 SQL 或明确的备份恢复说明。

---

## 四、Stage 8.1 范围（轻量版）

### 4.1 必须实施

1. 冻结统一 `SyncScope`、`SyncRunStatus`、`SyncErrorCode`、`SyncConflict` 摘要 DTO；
2. 新增轻量 `SyncRun`/`SyncLock` 记录，或在现有 `SyncLog` 上增加兼容字段；
3. 新增可重复执行的最小 Drizzle migration；
4. 保留历史 `SyncLog`，不得删除或重解释旧字段；
5. 让 CLI 和 Dashboard 共用同一个轻量编排器；
6. 保存 `runId`、scope、触发者、dry-run、状态、退出码、摘要和错误数；
7. 将进程内 Map 锁替换为带 TTL 的数据库可见保护；
8. 统一 Post/Gallery 的基础 hash 计算和错误摘要，不要求完整双向合并平台；
9. 将 `--retry` 明确定义为按 scope 重新执行；
10. 增加公共纯函数、锁、并发提示和双域 dry-run 测试；
11. 修复全仓库 lint 基线问题；
12. 更新命令帮助、用户提示、Stage 8 文档和 CI dry-run 门禁。

### 4.2 本阶段不实施

- 不重写 Markdown、`album.yaml` 或 `gallery.yaml` 的人工源责任；
- 不把 Gallery 写入 Post 表；
- 不引入邮件、队列、Redis 或新的外部同步服务；
- 不引入 `SyncTask`、`SyncAuditEvent` 或完整事件溯源模型；
- 不实现实体级重试、任务调度、自动排队或复杂心跳；
- 不实现跨域数据库事务；
- 不实现复杂人工合并工作台；
- 不实现 RAW 解码、在线裁剪或媒体编辑器；
- 不直接删除已有 Cloudinary 资源；
- 不删除旧的 `sync:galleries`、`sync:pull`、`gallery:pull`；
- 不把 `SyncLog` 历史数据强制转换为不存在的 Gallery 运行记录。

---

## 五、实施任务分解

### 8.1.1 协议冻结和轻量适配器边界

**目标：** 让 CLI、Server Action 和 CI 使用同一组纯 TypeScript DTO。

任务：

- 将 `src/lib/sync/sync-types.ts` 固定为运行、摘要、冲突和错误类型；
- 为 CLI/Action 输入增加 Zod schema，输出保持安全 DTO；
- 增加 `protocolVersion`，初始值为 `1`；
- 定义最小 PostAdapter 和 GalleryAdapter 接口；
- 明确适配器不能调用另一个领域的表、事务或 Cloudinary Admin API；
- 为旧命令增加兼容适配器，不复制领域逻辑。

建议接口：

```ts
interface SyncDomainAdapter<TOptions, TResult> {
	readonly scope: 'POSTS' | 'GALLERIES'
	validate(options: TOptions): Promise<void>
	run(context: SyncRunContext, options: TOptions): Promise<TResult>
	retry(context: SyncRunContext): Promise<TResult>
}
```

### 8.1.2 轻量数据库运行记录和锁

新增一张轻量运行/锁表即可，建议如下：

```text
SyncRun
- id
- protocolVersion
- scope
- status
- dryRun
- triggeredBy
- actorId nullable
- startedAt
- finishedAt nullable
- exitCode
- summary jsonb
- errorCount
- conflictCount
- retryOf nullable
- createdAt
- updatedAt
- lockKey nullable
- lockExpiresAt nullable
```

约束：

- 运行状态使用受控 text 或 PostgreSQL enum；
- `summary` 不得写入 Secret、绝对路径、密码、DATABASE_URL 或原始图片数据；
- 运行记录建议只保留最近 30～100 条，个人 Blog 不要求永久审计；
- 锁获取、释放和 TTL 接管必须校验 `runId`；
- 不在同步业务中持有长事务数据库锁。

### 8.1.3 Post 基础 hash 和迁移

Post 如现有业务确实需要双向保护，再增加以下字段；若 Stage 8.1 只做单向同步，可先只保留运行摘要：

```text
contentHash text nullable
mediaHash text nullable
mergeBase jsonb nullable
revision integer not null default 0
syncStatus controlled value
syncRunId text nullable
lastSyncedAt timestamp nullable
sourceUpdatedAt timestamp nullable
```

迁移策略：

1. 先增加 nullable 字段，不改变现有 Post 写入行为；
2. 用只读基线脚本扫描当前 Markdown 和数据库副本；
3. 对无法确定共同 base 的记录标记 `UNINITIALIZED` 或保留 null，不猜测为 IN_SYNC；
4. 只对下一次成功同步写入新的 merge base；
5. 基线脚本支持 dry-run 和 JSON 报告；
6. 迁移失败不得执行 Post 内容覆盖。

### 8.1.4 Gallery hash 和状态校正

Gallery 保留现有领域字段，但补充或明确：

```text
Gallery.contentHash = album.yaml 人工元数据规范化 hash
Gallery.mediaHash   = 当前媒体集合规范化 hash
Gallery.mergeBase   = 上次成功同步的 album 人工字段快照
GalleryImage.contentHash = 图片人工字段或处理结果的领域 hash
```

实施要求：

- hash 输入字段顺序固定；
- 数组排序规则固定且写入文档；
- `gallery.yaml` 不进入人工源 hash；
- mtime 只能用于诊断，不能单独决定覆盖；
- hash 变化和 revision 冲突分别处理，不得互相替代。

### 8.1.5 TTL 锁和异常恢复

实现：

- `acquire(lockKey, runId, ttl)`；
- `release(lockKey, runId)`；
- `inspect(lockKey)`；
- `takeoverExpired(lockKey, runId)`。

行为：

- 同域重复触发返回 `LOCKED` 和当前 owner runId；
- `ALL` 使用固定顺序获取 `POSTS`、`GALLERIES`；
- dry-run 也获取锁；
- 进程崩溃后，超过 TTL 的锁可以安全恢复；
- 释放必须校验 ownerRunId，不能误释放其他运行的锁；
- 锁操作失败必须区分 `LOCKED` 和 `DATABASE_UNAVAILABLE`；
- 不实现队列、自动等待或复杂心跳。

### 8.1.6 Scope 重试模型

第一版本允许：

```bash
bun run sync -- --retry <run-id> --scope posts
bun run sync -- --retry <run-id> --scope all
bun run sync -- --retry <run-id> --scope galleries
```

规则：

- `run-id` 仅用于诊断和关联，不要求读取任务表；
- `--scope` 必须明确指定；
- 每次重试创建新的 `runId`，保留 `retryOf`；
- 重试必须重新检查锁、凭证和 dry-run 参数；
- 冲突和 revision 问题提示用户先处理内容，再重新执行；
- CLI 不得声称支持文章、相册或图片级重试。

### 8.1.7 兼容命令

保留：

```bash
bun run sync
bun run sync:pull
bun run sync:galleries -- --dry-run
bun run sync:galleries
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
```

兼容策略：

- 旧入口调用对应领域 Adapter；
- 旧入口输出原有领域摘要，并增加 `runId`；
- 旧入口不直接创建另一套锁；
- 旧入口真实执行也必须写入统一 `SyncRun`；
- 至少一个稳定版本周期后，才可以增加弃用提示；
- 兼容测试必须比较旧入口和新入口的领域结果，而不比较日志文字。

### 8.1.8 Dashboard 轻量 Action 契约

新增或规划：

```text
src/lib/actions/sync-admin.ts
```

本阶段至少实现 Server Action 的契约和查询层：

- `listSyncRuns(input)`；
- `getSyncRun(runId)`；
- `getSyncLockStatus(scope)`；
- `retrySyncRun(input)`。

所有 Action 必须：

- 调用统一 `requireAdminSession`；
- 使用 Zod 校验；
- 返回安全 DTO，不返回 Drizzle 原始对象；
- 不接受前台传入任意工作区路径、Cloudinary publicId 或 SQL 条件；
- 对不存在的 run 使用可读但不泄露内部结构的错误；
- 触发并发时返回“已有同步正在运行，请稍后再试”。

页面只需展示最近运行摘要、scope、状态、错误和锁提示；复杂筛选、冲突工作台和实体重试不属于本阶段。

---

## 六、测试计划

### 6.1 纯函数测试

至少覆盖：

- 同一对象不同 key 顺序产生同一 hash；
- `undefined`、`null`、空数组和空对象规则固定；
- Post 快照排除自动字段；
- Gallery album/media hash 不混用；
- local 变更、remote 变更、双方相同变更；
- 双方不同字段变更合并成功；
- 同一字段双方不同变更进入 `CONFLICT`；
- 删除和两边删除状态；
- 错误码映射不输出 Secret 和绝对路径。

### 6.2 数据库和锁测试

- 空数据库执行迁移；
- 已有 `SyncLog` 数据执行迁移；
- 迁移重复执行不破坏数据；
- SyncRun 状态转换拒绝非法跳转；
- 锁唯一约束拒绝同域并发；
- 过期锁可恢复，非 owner 不能释放锁；
- CLI 和 Server Action 同时触发时其中一个得到可读的 `LOCKED` 提示。

### 6.3 适配器和 CLI 测试

必须测试：

| 场景 | 预期 |
| :--- | :--- |
| `posts --dry-run` | 只调用 Post adapter，返回运行记录 |
| `galleries --dry-run` | 只调用 Gallery adapter，返回运行记录 |
| `all` 双域成功 | `SUCCEEDED` |
| Post 成功、Gallery 失败 | `PARTIAL_SUCCESS`，Post 任务保留成功 |
| Post 失败、Gallery 成功 | `PARTIAL_SUCCESS`，Gallery 任务保留成功 |
| 双域失败 | `FAILED` |
| 同域重复触发 | `LOCKED`，不产生覆盖写入 |
| 失败 scope 重试 | 生成新的 run，保留 `retryOf` |
| 实体级重试参数 | 明确拒绝，不伪装支持 |
| 旧入口 | 领域结果与统一入口等价 |
| `--json` | 输出符合固定协议，不混入非 JSON 日志 |

### 6.4 安全测试

- 未登录访问同步 Action；
- USER 访问同步 Action；
- ADMIN 正常查询和重试；
- 伪造 runId、taskId、scope；
- 传入绝对路径和目录穿越字符串；
- 错误信息包含 Secret、DATABASE_URL、密码或绝对路径；
- Gallery 删除未二次确认时不能触发 Cloudinary 删除。

---

## 七、迁移、部署和回滚

### 7.1 迁移顺序

```text
1. 备份数据库；
2. 部署只增加 nullable 字段和轻量运行记录的版本；
3. 执行 db:migrate；
4. 检查运行记录、TTL 字段和唯一约束；
5. 执行 Post/Gallery hash 基线 dry-run；
6. 检查未初始化、冲突和不可重建记录；
7. 只读验证统一查询；
8. 开启统一入口 dry-run；
9. 观察一个稳定窗口后开启真实写入。
```

### 7.2 回滚原则

- 先停止新的同步触发；
- 记录正在运行和最近失败的 runId；
- 不执行 `db:reset`；
- 代码回滚前保留运行记录，便于诊断；
- 如果需要回滚 schema，先导出 `SyncRun` 运行摘要；
- 领域人工源通过 Git 回滚；
- Gallery 重新生成 `gallery.yaml` 后按 scope dry-run；
- 不自动删除 Cloudinary；
- 迁移向下脚本必须列出影响表、字段和数据备份要求。

### 7.3 CI 门禁

Stage 8.1 完成后 CI 至少执行：

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run gallery:index
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
bun run build
```

CI 不得执行：

- 生产数据库真实同步；
- Cloudinary 真实删除；
- `db:reset`；
- 未经确认的本地回写；
- `.gallery-input` 原始媒体提交。

---

## 八、交付门禁

### 8.1 Stage 8.1 必须通过

- [ ] 统一 DTO 已冻结并有 Zod schema；
- [ ] 轻量 `SyncRun`/`SyncLock` 迁移可重复执行；
- [ ] 历史 `SyncLog` 仍可查询；
- [ ] CLI、旧命令和未来 Dashboard 共用同一运行摘要模型；
- [ ] 每次真实或 dry-run 执行均有 runId；数据库可用时持久化，数据库不可用时明确失败或按配置降级为 JSON 诊断；
- [ ] 同域锁跨进程可见，并支持 TTL 恢复；
- [ ] `ALL` 固定顺序获取领域锁，不能死锁；
- [ ] Post 与 Gallery 结果分别写入统一运行摘要；
- [ ] `PARTIAL_SUCCESS` 不会回滚已成功领域；
- [ ] `--retry` 不再伪装成实体级重试；
- [ ] Post contentHash、mediaHash、mergeBase 规范已冻结；
- [ ] Gallery album hash 和 media hash 语义已分离；
- [ ] 错误和运行摘要经过安全过滤；
- [ ] ADMIN Action 契约和权限测试完成；
- [ ] 旧入口与统一入口有等价结果测试；
- [ ] lint、TypeScript、内容检查、双域 dry-run 和 build 通过。

### 8.2 不得声称完成

以下任一项未完成时，Stage 8.1 只能标记为“开发中”或“候选发布”：

- 只有内存锁，没有跨进程锁；
- 没有任何 runId 或运行摘要；
- `--retry` 只是重新执行全量 scope，却宣称支持失败实体重试；
- Post 没有明确共同 base，却宣称支持 Post 双向冲突保护；
- Gallery hash 仍把单张图片 hash 当作相册 hash；
- Dashboard 可以直接访问 Drizzle、Cloudinary 或工作区文件；
- 迁移没有备份和回滚说明；
- 全仓库质量门禁仍失败且未明确记录原因。

---

## 九、建议实施顺序和里程碑

### Milestone A：协议冻结

交付：统一 DTO、Zod schema、Adapter 接口、hash/merge 规范、测试 fixture。

退出条件：不修改领域业务结果，纯函数测试通过。

### Milestone B：轻量运行记录和锁

交付：轻量 `SyncRun`/`SyncLock` 记录、Drizzle migration、最小 Repository、状态转换和安全序列化。

退出条件：空数据库和已有 `SyncLog` 数据迁移通过，重复迁移无破坏，TTL 锁可恢复。

### Milestone C：编排器和并发提示改造

交付：跨进程 TTL 锁、运行记录写入、双域摘要、并发提示。

退出条件：并发、异常退出、部分成功和数据库不可用场景通过；不引入排队。

### Milestone D：Post/Gallery 快照基线

交付：Post 字段迁移、基线 dry-run、Gallery hash 语义修正、merge base 初始化策略。

退出条件：未初始化记录可识别，任何不确定记录不会静默覆盖。

### Milestone E：Scope 重试和 Action 契约

交付：scope 重试协议、`sync-admin.ts` 轻量查询和重试 Action、ADMIN 测试。

退出条件：失败 scope 可以生成新 run；实体级重试参数被明确拒绝。

### Milestone F：CI 和候选发布

交付：双域 dry-run CI、部署/回滚说明、兼容命令等价测试、质量基线修复。

退出条件：Stage 8.2 可以在不改变领域模型的情况下继续开发 Dashboard。

---

## 十、Stage 8.1 完成后的后续依赖

Stage 8.1 完成后，后续阶段建议按以下顺序推进：

```text
Stage 8.2：公共同步基础设施正式化
  - 运行查询、TTL 锁、错误和 scope 重试服务稳定化

Stage 8.3：统一 CLI 和 scope 级部分成功
  - 完成退出码、兼容入口、JSON 协议和人工 scope 重跑

Stage 8.4：全站同步 Dashboard
  - 使用 sync-admin Action 实现运行摘要、scope、锁提示和重试 UI

Stage 8.5：部署、CI、备份和回滚产品化
  - 完成 Forker 三种路径、生产检查和稳定版本弃用周期
```

Stage 8.1 不应通过提前实现大量 UI 来掩盖运行记录和 TTL 锁的缺失。后续所有 UI、CLI 和 CI 功能都必须复用本阶段冻结的运行摘要、scope、错误码和锁边界。实体任务、复杂审计、队列和自动恢复属于未来扩展，不是个人 Blog 的 Stage 8 完成前置条件。