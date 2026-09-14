# 第十一阶段开发计划（Stage 11：架构治理、数据安全与代码质量）

> 制定日期：2026-09-14  
> 前置阶段：Stage 10 Gallery 浏览体验与互动优化  
> 主要输入：`documents/architecture-reduction.md`、`documents/develop-plans/development-plan-stage10-gallery.md`、当前 Publish/Sync、Schema、Migration 和文档结构  
> 阶段目标：将 Stage 10 遗留的架构治理任务收敛为可审计、可回滚、低破坏性的工程流程  
> 当前状态：规划中

---

## 一、阶段定位

Stage 10 已完成 Gallery 前台体验的主要能力：

- `/gallery/[slug]` 直达指定相册；
- 单标签筛选、缩略图加载和统一底部信息面板；
- GalleryImage 独立评论、回复、Spam 操作和 Snapshot 边界；
- GalleryImage 评论 migration `0006_amusing_sleepwalker.sql` 已生成。

Stage 11 不继续增加 Gallery 视觉功能，而是处理：

1. Iteration 6：Publish/Sync 架构收敛；
2. Iteration 7：types/constants 分层整理；
3. Iteration 8：Post/Image/Album 非破坏性删除逻辑；
4. Iteration 9：documents、`AGENTS.md` 和 `README.md` 整理；
5. 数据库 migration 压缩、基线和废弃字段清理策略。

核心原则：

```text
先审计，再迁移；
先停止新增依赖，再迁移调用方，最后删除实现；
先标记缺失，再人工确认删除；
先确认生产状态，再压缩 migration；
破坏性操作必须有 dry-run、备份和回滚路径。
```

---

## 二、不可突破的架构边界

```text
Markdown / album.yaml / processed WebP
                 ↓
        content check / publish
                 ↓
       PostgreSQL / Cloudinary
                 ↓
          Blog / Gallery
```

禁止：

- 数据库回写 Markdown、YAML 或 WebP；
- 新增 `sync:pull`、`gallery:pull` 或新的同步入口；
- 新增 merge base、实体级同步任务或自动 Git commit/push；
- 将 Dashboard 发展为第二套内容编辑器；
- 将 Cloudinary 作为人工元数据源；
- 未经生产读取审计直接删除 schema 字段或历史 migration；
- 未经人工确认删除 Post、Gallery、GalleryImage 或 Cloudinary 资源。

本阶段数据库修改只允许：兼容迁移、已审计的废弃字段删除、运行时互动数据维护、migration 历史压缩或新基线建立。

---

## 三、当前基线与主要问题

### 3.1 Publish 仍依赖 Sync 核心

```text
publish-workflow
  → runSync
  → sync-orchestrator
      → ContentSyncService
      → gallery-sync-service
      → sync-lock / sync-repository
      → SyncRunSummary
```

主要问题：

- Publish 对外暴露 `SyncRunSummary`、`SyncScope` 等旧协议；
- `src/lib/sync-service.ts` 混合 Post 内容、媒体、Cloudinary 和数据库职责；
- Gallery 服务仍保留 `sync` 命名和旧状态语义；
- 构建仍会因为旧同步路径的动态文件系统访问产生 tracing warning；
- `mergeBase`、`revision`、`syncVersion`、`syncStatus` 等历史字段尚未完成生产读取审计。

### 3.2 Migration 当前状态

```text
0000_baseline.sql
0001_mean_chimera.sql
0002_damp_black_bolt.sql
0003_gallery_stage7.sql
0004_mighty_hiroim.sql
0005_nervous_thunderbird.sql
0006_amusing_sleepwalker.sql
```

`0006` 引入 GalleryImageComment。不能仅根据文件名假设这些 migration 是否已应用到生产，必须先盘点各环境的 migration journal 和 schema 状态。

### 3.3 删除逻辑风险

内容源暂时缺失可能由重命名、分支切换、不完整 checkout、发布中断、校验失败或误操作导致。因此“当前扫描不到”不能直接等价为用户确认删除。

---

## 四、阶段完成定义

Stage 11 完成后：

1. Publish 对外不再暴露旧 Sync 核心类型；
2. Publish、媒体处理和历史运行记录职责清晰；
3. 旧 Sync helper 有调用审计和删除计划；
4. types/constants 按领域分层，`@/types` 兼容导出保持稳定；
5. Post、Gallery、GalleryImage 缺失内容源只标记，不自动删除；
6. 删除确认具备 ADMIN 权限、审计、dry-run 和回滚说明；
7. 生产 migration 状态已盘点；
8. migration 压缩方案与实际环境匹配；
9. 已应用生产 migration 历史没有被无记录重写；
10. 文档入口和协作规范描述当前真实架构；
11. Git-first 单向数据流没有改变；
12. lint、测试、TypeScript、内容检查和 build 通过。

---

## 五、Iteration 6：Publish/Sync 架构收敛

优先级：P0；风险：高。

### 6.1 Publish 对外协议

建议完善：

```text
src/lib/publish/
  publish-types.ts
  publish-workflow.ts
  publish-summary.ts
  publish-lock.ts
  post-publish-service.ts
  gallery-publish-service.ts
```

对外只暴露：

```text
PublishScope
PublishStatus
PublishSummary
PublishResult
PublishTrigger
```

新代码不得依赖：`SyncScope`、`SyncRunSummary`、`SyncTrigger`、`SyncConflict`、`retryOf`、`mergeBase`、`revision`、`syncVersion`。

### 6.2 迁移顺序

1. 新增 Publish 类型和纯函数，不删除旧类型；
2. 迁移 CLI、TUI、Dashboard 调用方；
3. 把 `runSync` 限制为临时内部 adapter；
4. 将锁迁移到 `publish-lock.ts`；
5. 用兼容 recorder 写入历史 `SyncRun`；
6. 拆分 `src/lib/sync-service.ts` 的 Post/media 职责；
7. 将 Gallery 发布服务迁移到 Publish 命名空间；
8. 删除无生产调用方的 merge/conflict/helper；
9. 最后评估 `SyncRun` 是否迁移为最小 `publish_runs`。

### 6.3 必须保持

- `bun run publish -- --scope posts|galleries|all`；
- `--dry-run` 完全只读；
- CLI、TUI、Dashboard 复用同一 Publish service；
- 真实 Publish 才获取锁；
- 不回写 Markdown/YAML，不自动 commit/push；
- Post 与 Gallery 仍保持独立领域模型。

---

## 六、Iteration 7：types/constants 分层整理

优先级：P1；风险：中。

### 7.1 目标目录

```text
src/types/
  content/post.ts
  content/tag.ts
  content/metadata.ts
  gallery/album.ts
  gallery/image.ts
  gallery/public.ts
  comments/comment.ts
  comments/public-comment.ts
  publish/publish.ts
  index.ts

src/lib/constants/
  gallery.ts
  media.ts
  publish.ts
  routes.ts
```

### 7.2 规则

- 先新增领域类型，再迁移调用方，最后删除重复定义；
- `src/types/index.ts` 保持兼容导出；
- DB Infer 类型、内容源类型和前台 DTO 不混用；
- Server Action 不直接向 Client 返回数据库原始对象；
- GalleryImage 评论公开 DTO 独立于内部表结构；
- 只集中有业务语义和跨模块使用的 constants；
- 每个领域文件不得依赖页面组件；
- 每次迁移后运行 TypeScript、Biome 和测试。

---

## 七、Iteration 8：Post/Image/Album 非破坏性删除逻辑

优先级：P0；风险：高。

### 7.1 核心决策

以下情况不得直接删除数据库或 Cloudinary 资源：

- Markdown 暂时不存在；
- `album.yaml` 暂时不存在；
- `gallery.yaml` 尚未重新生成；
- image hash 暂时无法比对；
- branch、checkout 或发布中断造成的局部缺失；
- dry-run 发现数据库实体不在当前扫描结果中。

只能产生运行时标记，例如：

```text
SOURCE_MISSING
PENDING_REVIEW
PENDING_DELETE
ARCHIVED
```

具体状态名必须先审计现有 `status` 和 `syncStatus`，不能重复制造历史协议。

### 7.2 建议状态流

```text
IN_SYNC
  ↓ 内容源缺失
SOURCE_MISSING / PENDING_REVIEW
  ↓ ADMIN 查看 diff 和影响范围
PENDING_DELETE
  ↓ ADMIN 明确确认
ARCHIVED 或 DELETED
```

默认行为：

- Post、Gallery、GalleryImage 数据保留；
- 评论保留；
- Cloudinary 不自动删除；
- 前台隐藏由明确公开状态决定；
- Snapshot 不因扫描缺失而丢失评论。

### 7.3 Publish 参数

- dry-run 永远不改变状态；
- 默认 Publish 只报告 source missing；
- 不再把 source missing 直接变为 PENDING_DELETE；
- 删除必须使用独立 ADMIN Action；
- 删除前显示受影响实体、评论数量和 Cloudinary 资源；
- Cloudinary 删除必须二次确认；
- 删除前创建数据库保护快照，并明确其不能恢复 Cloudinary 二进制。

---

## 八、Iteration 9：文档和项目入口整理

优先级：P1；风险：中低。

### 8.1 建议目录

```text
documents/
  architecture/
    architecture-reduction.md
    database-migration-policy.md
    deletion-safety.md
  develop-plans/
    active/
    completed/
    legacy/
  discussions/
  summaries/
```

实际移动前必须全仓搜索链接，保留旧路径说明，并区分当前规范、历史规划和讨论记录。

### 8.2 AGENTS.md

更新为：

- 当前阶段为 Stage 11；
- Stage 10 Gallery 能力已完成；
- Publish 是唯一正式内容发布入口；
- Sync 仅为兼容期内部实现，不得新增依赖；
- 删除默认非破坏性；
- migration 压缩必须遵守生产环境策略；
- 常用验证命令和禁止副作用。

### 8.3 README.md

必须能独立说明：

```text
编辑 Git 内容
→ content:check / content:verify
→ publish dry-run
→ git review
→ publish
→ PostgreSQL / Cloudinary
```

删除或标记过时的 sync 命令、Dashboard 内容编辑、数据库导出恢复和完整站点快照描述。

---

## 九、数据库 Migration 压缩与清理策略

Migration 压缩是独立高风险工作流，不与普通重构混在一个提交中。

### 9.1 当前链

```text
0000_baseline
0001_mean_chimera
0002_damp_black_bolt
0003_gallery_stage7
0004_mighty_hiroim
0005_nervous_thunderbird
0006_amusing_sleepwalker
```

### 9.2 环境盘点

必须分别确认：

| 环境 | 需要确认 |
| --- | --- |
| 本地开发库 | 已应用 migration、是否可重建 |
| 测试库 | 是否有业务数据、是否可 reset |
| 预发布库 | journal、schema diff、数据量 |
| 生产库 | 已应用 migration、备份、回滚窗口 |

不能仅根据 Git 文件名判断生产状态。

### 9.3 尚未生产应用

若确认旧链尚未应用到需要保留的生产环境：

1. 导出最终 schema；
2. 在空数据库执行完整旧链；
3. 校验最终 schema 与代码一致；
4. 生成新的 baseline；
5. 将旧链移入 `drizzle/archive/pre-stage11/`，不直接删除；
6. 新环境使用新 baseline；
7. 记录旧链与新 baseline 的等价性；
8. 使用 seed、content dry-run、测试和 build 验证。

### 9.4 已生产应用

如果旧链已经应用到生产：

- 不重写旧 migration；
- 不修改旧 SQL；
- 不只删除本地文件而不处理 journal；
- 不让同一数据库重复执行 baseline 和旧链。

优先方案是保留历史链，后续只新增必要 migration。若必须为新环境建立 baseline，需让生产继续使用旧链，并根据环境选择 migration 路径。

### 9.5 废弃字段删除

可能涉及：`mergeBase`、`revision`、`syncVersion`、旧 `syncStatus` 枚举、`retryOf` 和旧运行协议字段。

顺序必须是：

```text
全仓读取审计
  ↓ 停止新写入
  ↓ 迁移读取方
  ↓ 兼容期观察
  ↓ 生产备份
  ↓ 删除 migration
  ↓ 验证和回滚演练
```

TypeScript 无引用不是唯一证据，还要检查 SQL、Snapshot、Dashboard、运维脚本、日志查询和恢复流程。

### 9.6 验收

- 新环境能从选定入口完整建立 schema；
- 生产不会重复执行 migration；
- Drizzle journal 与文件一致；
- `db:generate` 无意外 diff；
- 行数、外键、索引、枚举和默认值通过检查；
- GalleryImageComment migration 纳入部署说明；
- 回滚明确区分数据库、Git 内容源和 Cloudinary。

---

## 十、测试与验证计划

### Publish/Sync

- Publish DTO 不暴露 Sync 字段；
- dry-run 不锁、不写 SyncRun、不上传媒体；
- scope、失败摘要和历史 recorder 稳定。

### 删除安全

- source missing 只产生标记；
- `--no-delete` 不改变数据库状态；
- 删除需要 ADMIN；
- 删除前显示评论和媒体影响范围；
- Cloudinary 删除需要确认；
- 内容源短暂缺失不会删除评论。

### Migration

- 空数据库安装旧链或新 baseline；
- journal 一致性；
- schema diff；
- 关键表行数和约束；
- 中断恢复演练。

### 文档

- 链接检查；
- 过时 sync 命令扫描；
- README、AGENTS 和 architecture-reduction 语义一致。

---

## 十一、建议实施顺序

```text
Phase 0：生产环境、Schema 和 migration 状态盘点
Phase 1：Publish DTO/Service 脱离 Sync 协议
Phase 2：source missing 标记和 ADMIN 确认删除
Phase 3：types/constants 分层迁移
Phase 4：废弃字段审计和 migration 策略执行
Phase 5：文档目录、README、AGENTS.md 整理
Phase 6：完整回归、发布演练和阶段总结
```

Migration 压缩不能提前到环境盘点之前，也不能和 Publish 迁移混在同一个不可回滚提交中。

---

## 十二、建议提交边界

```text
1. governance: add publish/sync dependency audit
2. safety: disable destructive source-missing behavior by default
3. refactor: split shared content types and domain constants
4. database: perform audited baseline or compatibility migration
5. docs: reorganize active, completed, legacy and discussion documents
6. governance: add regression tests and stage summary
```

每个提交必须说明是否修改 schema、发布流程、Cloudinary、删除行为以及生产回滚路径。

---

## 十三、Stage 11 最终验收清单

- [x] Publish 不再向新调用方暴露 Sync 专有类型；
- [x] `runSync` 只保留在兼容 adapter 或历史读取路径；
- [x] Post/Gallery 继续共享同一个 Publish service；
- [x] dry-run 完全只读；
- [x] types 按领域分层，`@/types` 兼容导出可用；
- [x] source missing 默认只标记、不自动删除；
- [x] Post、Album、Image 删除入口未由普通 Publish 隐式触发；独立 ADMIN 删除流程仍待后续实施；
- [x] Cloudinary 删除不由普通 Publish 隐式触发；
- [x] 评论不会因内容源短暂缺失而丢失；
- [ ] migration 环境状态已盘点；
- [ ] migration 压缩方案与生产状态匹配；
- [x] 已应用生产 migration 没有被重写；本轮未修改任何历史 migration；
- [x] 废弃字段已完成仓库级读取审计；生产读取审计仍待环境凭据；
- [x] 当前文档可区分 architecture、active plan 和审计记录；历史目录未移动；
- [x] README、AGENTS.md、architecture-reduction.md 当前入口语义一致，并由 `bun run docs:audit` 检查；
- [x] lint、内容检查、测试、TypeScript 和 build 全部通过。
