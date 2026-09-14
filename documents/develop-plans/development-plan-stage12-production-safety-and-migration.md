# 第十二阶段开发计划（Stage 12：生产安全、删除闭环与 Migration 执行）

> 制定日期：2026-09-14
>
> 前置阶段：Stage 11 架构治理、数据安全与代码质量（仓库级治理已完成）
>
> 主要输入：
>
> - [`development-plan-stage11-architecture-governance.md`](development-plan-stage11-architecture-governance.md)
> - [`../architecture/stage11-implementation-summary.md`](../architecture/stage11-implementation-summary.md)
> - [`../architecture/stage11-deprecated-fields-and-migration-audit.md`](../architecture/stage11-deprecated-fields-and-migration-audit.md)
> - [`../architecture-reduction.md`](../architecture-reduction.md)
>
> 阶段目标：在真实环境证据、备份和回滚窗口都已确认后，先清理现有数据库中的废弃内容，再删除已确认无用字段，最后生成清晰的最终 baseline，并完成删除安全闭环和 Publish 核心进一步脱离旧 Sync 实现。
>
> 当前状态：Phase 0 未通过；已实现仓库级删除预览/确认安全核心和脱敏盘点证据登记。生产盘点、备份恢复、字段删除、migration 清理/压缩和 Cloudinary destroy 仍未完成，不得描述为已完成。

---

## 一、Stage 11 对比结论

### 1.1 Stage 11 已完成

- Publish 对新调用方不再暴露 `SyncRunSummary`、`SyncScope`、`retryOf`、`mergeBase`、`revision`、`syncVersion`；
- CLI、TUI、Dashboard 复用同一 Publish Workflow；
- source missing 默认只报告，不自动归档、不设置 `PENDING_DELETE`、不删除 Cloudinary；
- Publish、Gallery、Comment 类型按领域分层，`@/types` 兼容导出保持稳定；
- Publish/Gallery 业务常量已建立 `src/lib/constants/` 分层；
- 当前入口文档已整理，`docs:audit` 可阻止旧正式 Sync 命令重新进入入口文档；
- `db:audit-migrations` 可验证仓库 migration SQL 与 Drizzle journal 一致；
- lint、测试、TypeScript、内容检查和 build 回归通过。

### 1.2 Stage 11 仅部分完成

- `runSync` 仍是 Publish 内部兼容 adapter，Publish lock/history 尚未完全独立；
- `src/lib/sync-service.ts` 仍混合 Post、媒体、Cloudinary 和数据库职责；
- Gallery 服务仍保留旧 `sync` 命名；
- build 仍存在 Gallery 动态文件系统 tracing warning；
- 文档入口已整理，但历史文档尚未移动到 `active/completed/legacy/discussions/summaries` 目录；
- 仅完成仓库级字段审计，尚未完成任何真实环境读取审计。

### 1.3 Stage 11 未完成且转入 Stage 12

- 本地、测试、预发布、生产 migration journal/schema 状态盘点；
- 生产读取方、Dashboard、运维脚本、日志查询和 Snapshot 使用审计；
- migration 压缩或新 baseline 方案；
- 废弃字段删除；
- 独立 ADMIN 删除确认 Action；
- 删除前评论、媒体、Cloudinary 影响范围预览；
- 数据库保护快照和 Cloudinary 二次确认闭环；
- 删除/归档回滚演练与发布演练。

---

## 二、不可突破的 Stage 12 边界

```text
没有环境 journal/schema 证据 → 不压缩 migration
没有生产读取审计       → 不删除字段
没有备份和回滚窗口      → 不执行破坏性 migration
没有 ADMIN + 二次确认   → 不删除内容或 Cloudinary
source missing          → 只报告，不等同于删除确认
```

禁止：

- 通过猜测或环境变量存在性判断生产 migration 已应用；
- 修改已经可能应用到生产的历史 migration SQL；
- 在同一数据库重复执行 baseline 与旧 migration 链；
- 将 `db:audit-migrations` 的仓库文件一致性结果当作生产状态结果；
- 普通 Publish 隐式调用删除 Action、Cloudinary destroy 或数据库归档；
- 允许非 ADMIN 确认删除；
- 使用 Snapshot 宣称可以恢复 Git 内容源或 Cloudinary 二进制；
- 在删除闭环完成前删除评论或切断评论外键；
- 将新的双向同步、自动回写或自动 Git commit/push 引入系统。

---

## 三、阶段完成定义

Stage 12 完成后必须满足：

1. 四类环境的 migration journal 和关键 schema 状态可审计；
2. 生产备份、恢复窗口和回滚路径已记录并演练；
3. 已应用 migration 历史未被重写；
4. 废弃数据内容已在独立清理 migration 中完成清理并通过校验；
5. 废弃字段删除前完成生产读取审计和兼容观察期；
6. 字段删除 migration 与数据清理 migration 分离且可分别回滚；
7. 最终 baseline 已从清理后的最终 schema 生成并通过空库验证；
8. Post、Gallery、GalleryImage 均有独立 ADMIN 删除确认流程；
8. 删除前可展示实体、评论数量、Cloudinary 资源和回滚边界；
9. dry-run 删除预览不写数据库、不写 Git、不修改 Cloudinary；
10. Cloudinary 删除有二次确认、审计记录和失败恢复说明；
11. 内容源暂时缺失不会删除评论或媒体；
12. Publish lock/history 与 Sync 兼容实现职责进一步分离；
13. Gallery tracing warning 有明确处理方案或已消除；
14. 文档入口、运行手册和回滚说明与实际环境一致；
15. 完整回归、发布演练和删除演练通过。

---

## 四、Phase 0：环境与生产状态盘点

优先级：P0；风险：高；前置条件：获得各环境只读连接或由运维提供导出结果。

### 4.1 每个环境必须记录

| 环境 | 必须收集 |
| --- | --- |
| 本地开发库 | Drizzle journal、schema dump、是否可 reset、是否有需要保留的数据 |
| 测试库 | journal、schema diff、业务数据量、是否允许 reset |
| 预发布库 | journal、schema diff、关键表行数、索引/enum/外键、回滚窗口 |
| 生产库 | journal、schema dump、备份时间、恢复演练、回滚窗口、关键表行数 |

### 4.2 只读盘点命令约束

盘点脚本必须：

- 默认只读；
- 不调用 `db:migrate`、`db:push` 或 `db:reset`；
- 不写 `SyncRun`、Snapshot 或业务表；
- 不上传或删除 Cloudinary；
- 输出 secrets 脱敏后的环境标识和 schema 摘要；
- 将结果保存为脱敏审计附件，不提交密码、连接串或用户数据。

### 4.3 Phase 0 输出

```text
documents/architecture/stage12-environment-inventory.md
```

必须包含：

- 每个环境已应用 migration tag；
- journal 与 schema 是否一致；
- 生产是否已应用 `0006_amusing_sleepwalker`；
- 是否存在无法解释的 schema drift；
- 是否可以 reset 或必须保留历史链；
- 备份、恢复和回滚窗口；
- 未确认项和责任人。

若任一关键环境无法确认，Phase 0 不通过，后续不得进入 migration 执行。

---

## 五、Phase 1：备份与废弃数据盘点

优先级：P0；风险：高；前置条件：Phase 0 通过。

### 5.1 备份要求

在任何清理 SQL 之前必须完成：

- 目标数据库备份或可恢复副本；
- 备份时间、数据库标识和恢复方式记录；
- 关键表行数记录；
- Git 内容源 commit/tag 记录；
- Cloudinary 资源只记录影响范围，不作为数据库备份替代品。

### 5.2 废弃内容盘点

至少盘点以下字段的行数、非空数量、非默认值数量和关联记录：

```text
Gallery.mergeBase
Gallery.revision
GalleryImage.mergeBase
GalleryImage.revision
GalleryImage.syncVersion
SyncRun.retryOf
```

`syncStatus` 不在本阶段按废弃字段清理，因为当前 Gallery 运行时仍使用 `IN_SYNC`、`PENDING_DELETE` 和 `ARCHIVED`。

输出：

```text
documents/architecture/stage12-environment-inventory.md
```

该输出必须脱敏，不提交连接串、密码、用户内容或完整业务数据。

---

## 六、Phase 2：废弃数据清理 Migration

优先级：P0；风险：高；仅在 Phase 0/1 通过后执行。

### 6.1 清理边界

数据清理必须独立于字段删除，建议使用：

```text
0007_cleanup_legacy_sync_data.sql
```

允许：

- 将确认无业务意义的 legacy JSON 内容置空或归档到受控备份；
- 清理无效 `SyncRun.retryOf` 引用；
- 统一已经确认无效的旧状态数据到兼容状态；
- 保留必要历史运行记录和审计记录。

禁止：

- 删除评论；
- 删除 Cloudinary 资源；
- 修改 Git 内容源；
- 删除字段；
- 清理仍被生产读取的内容；
- 在同一 migration 中混入最终 baseline。

### 6.2 清理后验证

清理 migration 执行后必须独立验证：

- 行数和非空数量符合盘点预期；
- 外键、索引、enum 和默认值未改变；
- SyncRun/SyncLog 历史查询仍可用；
- 评论、GalleryImageComment 和 Snapshot 边界未受影响；
- Publish dry-run、测试和 build 通过；
- 恢复备份后可重现清理前状态。

清理失败时只恢复数据库备份，不自动修改 Git 或 Cloudinary。

---

## 七、Phase 3：废弃字段生产读取审计

优先级：P0；风险：高。

### 5.1 审计对象

- `mergeBase`；
- `revision`；
- `syncVersion`；
- Gallery/GalleryImage `syncStatus`；
- `SyncRun.retryOf`；
- SyncRun/SyncLog 的历史摘要字段；
- Snapshot、Dashboard、日志查询、恢复脚本和 SQL 运维查询。

### 5.2 证据要求

不能只依赖 TypeScript 搜索。必须同时提供：

- SQL 查询审计；
- 应用日志和 Dashboard 读取审计；
- 生产备份中的列存在性和数据分布；
- 历史记录读取方式；
- 兼容版本观察期结果；
- 字段删除后的回滚 SQL 或恢复备份。

### 5.3 处理策略

| 结果 | 策略 |
| --- | --- |
| 生产仍有读取 | 迁移读取方，继续保留字段 |
| 仅历史数据存在 | 保留备份，制定归档/删除窗口 |
| 无读取且无业务数据 | 生成独立兼容 migration，演练后删除 |
| 状态字段仍参与前台行为 | 不删除，先设计新状态协议 |

---

## 八、Phase 4：废弃字段删除 Migration

优先级：P0；风险：高；仅在清理后验证和生产读取审计通过后执行。

### 8.1 删除边界

字段删除必须使用独立 migration，例如：

```text
0008_remove_legacy_sync_fields.sql
```

只允许删除已经满足以下条件的字段：

- 生产读取方已迁移或确认不存在；
- 清理 migration 已执行并验证；
- 兼容观察期已完成；
- 生产备份和回滚窗口已确认。

优先候选：

- `mergeBase`；
- `revision`；
- `syncVersion`；
- `retryOf`。

`syncStatus` 不得在本 migration 中整体删除。若要简化状态，必须另立状态迁移和前台行为方案。

### 8.2 删除后验证

- 代码、SQL、Snapshot、Dashboard 和运维脚本不再读取字段；
- Drizzle schema 与 migration 一致；
- `db:audit-migrations` 通过；
- 空库安装和已有库升级分别验证；
- 回滚使用数据库备份或反向兼容 migration，不修改 Git 内容源和 Cloudinary。

---

## 九、Phase 5：最终 baseline 与新旧环境分流

优先级：P0；风险：高；仅在 Phase 2–4 完成后执行。

### 9.1 最终 baseline

从清理和字段删除后的最终 schema 生成新的 baseline，目标是：

```text
新环境：最终 baseline → db:migrate
```

必须在空数据库验证：

- 表、列、索引、外键、enum、默认值；
- `GalleryImageComment`；
- Snapshot 结构；
- 关键表 seed 和查询；
- content check、publish dry-run、测试和 build。

### 9.2 新旧环境分流

#### 已应用旧链的环境

- 不重写 `0000`–`0006`；
- 继续执行 `0007`/`0008` 等兼容 migration；
- 不让该数据库重复执行最终 baseline。

#### 尚未应用旧链的环境

- 使用最终 baseline；
- 旧链归档到 `drizzle/archive/pre-stage12/`；
- 记录旧链与最终 baseline 的等价性；
- 明确该 baseline 只适用于未应用旧链的新环境。

### 9.3 回滚边界

- 数据库回滚：数据库备份或兼容逆向 migration；
- Git 回滚：revert/branch/tag；
- Cloudinary：保留策略和人工资源恢复；
- 三者不互相伪装为完整站点恢复。

---

## 十、Phase 6：删除安全闭环

优先级：P0；风险：高。

### 6.1 ADMIN Action

新增删除能力前必须定义：

```text
previewDeletion(input)
  → ADMIN session + Zod 校验
  → 实体、评论、媒体、Cloudinary publicId 影响范围
  → 数据库快照/保护记录边界

confirmDeletion(input + previewToken)
  → ADMIN session
  → 二次确认
  → 校验 preview 未过期且实体版本未变化
  → 数据库软删除/归档
  → Cloudinary 删除单独确认
  → 审计日志
```

### 6.2 必须保持

- source missing 不自动创建删除任务；
- preview 不改变任何状态；
- confirm 必须二次确认；
- 删除评论前显示评论数量并记录审计；
- Cloudinary destroy 不与普通 Publish 隐式绑定；
- 失败时能区分数据库成功、Cloudinary 失败和 Git 内容源状态；
- 回滚说明明确区分数据库、Git 和 Cloudinary。

### 6.3 测试要求

- 非 ADMIN 拒绝；
- 无效/过期 previewToken 拒绝；
- revision/hash 变化后拒绝确认；
- dry-run/preview 无副作用；
- 评论计数和媒体清单稳定；
- Cloudinary 二次确认缺失时不调用 destroy；
- 删除中断可恢复或进入明确人工处理状态。

---

## 十一、Phase 7：Publish/Sync 最终解耦

优先级：P1；风险：中高。

只有不影响前述安全工作的情况下执行：

- 将锁能力迁移到 `src/lib/publish/publish-lock.ts`；
- 将历史 recorder 迁移到 Publish 命名空间，继续兼容 `SyncRun`；
- 拆分 `sync-service.ts` 的 Post 内容、媒体和数据库职责；
- 将 Gallery 发布服务迁移到 Publish 命名空间；
- 删除无生产调用方的 merge/conflict helper；
- 处理动态 filesystem tracing warning；
- 每一步都保留兼容回滚点。

不得在此 Phase 顺便删除生产字段或压缩 migration。

---

## 十二、Phase 8：发布、删除与回滚演练

最终验收必须实际演练：

1. Post 正常 publish；
2. Gallery 正常 publish；
3. Publish dry-run；
4. source missing 报告；
5. ADMIN 删除 preview；
6. ADMIN 删除 confirm；
7. Cloudinary 二次确认；
8. 数据库备份恢复；
9. Git revert 回滚；
10. Cloudinary 与数据库恢复边界说明。

每次演练需要记录：

- 时间、环境和 commit；
- actor/role；
- 输入和影响范围；
- 数据库、Git、Cloudinary 结果；
- 失败点和回滚动作；
- 是否允许进入下一阶段。

---

## 十三、验证命令

仓库级只读检查：

```bash
bun run docs:audit
bun run db:audit-migrations
bun run lint
bun test
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
```

生产相关检查必须在受控环境中额外执行，并提供脱敏审计记录；不得用本地仓库命令替代生产状态证据。

---

## 十四、建议提交边界

```text
1. governance: inventory environment migration state
2. governance: audit production reads of deprecated fields
3. safety: add ADMIN deletion preview and confirmation
4. database: execute compatibility migration or audited baseline
5. refactor: complete Publish lock/history and service split
6. governance: run deletion, publish and rollback rehearsals
```

每个提交必须说明：

- 是否修改 schema/migration；
- 是否修改 Publish 或删除行为；
- 是否访问生产数据库；
- 是否调用 Cloudinary；
- 备份和回滚路径；
- 是否改变 Git-first 单向数据流。