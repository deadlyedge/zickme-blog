# Stage 9.2：代码结构优化记录

> 本阶段采用兼容式、小步重构。同步领域行为、数据库结构、CLI 参数和旧 Dashboard 返回契约保持不变。

## 1. 已完成的边界整理

### Post 内容纯函数

Post 内容源相关的类型和纯函数已从较大的 `src/lib/sync-service.ts` 中收敛：

| 模块 | 职责 |
| :--- | :--- |
| `src/lib/content/post-types.ts` | `MarkdownFrontmatter`、`ProcessedPost`、`SyncRunnerOptions` |
| `src/lib/content/post-frontmatter.ts` | 状态解析、标签规范化、文件名标题生成 |
| `src/lib/sync-service.ts` | Post 文件扫描、Markdown 解析、媒体处理、数据库写入和兼容服务入口 |

`sync-service.ts` 仍然重新导出旧的 Post 类型和纯函数，因此以下旧入口不需要立即修改：

- `scripts/sync-content.ts`；
- `src/lib/actions/posts-admin.ts` 的上传导入；
- 其他历史内部调用方。

这保留了 `@/lib/sync-service` 的兼容性，同时让新增代码可以直接依赖 `@/lib/content/*`。

### Content Check 复用公共逻辑

`scripts/check-content.ts` 不再维护重复的 Frontmatter 类型、标签规范化和标题生成实现，而是复用 Post 内容纯函数。这样检查命令和真实同步使用相同的基础规则，避免未来出现“检查通过但同步解析不同”的漂移。

### 统一旧 DTO 适配

新增 `src/lib/sync/sync-result.ts`：

- `syncResultFromSummary`：将统一 `SyncRunSummary` 映射为旧 `SyncResult`；
- `failedSyncResult`：生成旧入口需要的安全失败结果。

该适配层被以下边界使用：

- `src/lib/actions/posts-admin.ts` 的旧 Post 手动同步 Action；
- `/dashboard/sync` 的旧结果展示状态。

统一编排器仍然只返回 `SyncRunSummary`，不会反向依赖旧 UI DTO。

## 2. 依赖方向

```text
content pure types/functions
        ↑             ↑
Post Sync Service   content:check

SyncRunSummary → sync-result adapter → legacy Action/UI DTO
        ↑
Sync Orchestrator
```

约束：

- `src/lib/content/` 不依赖数据库、Cloudinary、Next.js 或 Server Action；
- `src/lib/sync/` 负责同步协议、锁、摘要和适配，不解析 Post/Gallery 业务字段；
- Post 与 Gallery 领域服务不互相读取业务字段；
- Action 负责权限、Zod 输入和响应映射，不复制领域同步逻辑；
- 旧入口通过兼容导出和适配器保留，不建立第二套同步协议。

## 3. 行为兼容性

以下行为保持不变：

- `bun run sync` 默认 `ALL` 的 Stage 9.1 行为；
- `--scope posts|galleries|all` 和 dry-run/JSON 协议；
- Post Frontmatter 的状态、标签和标题默认值；
- 上传 Markdown/ZIP 的 `ContentSyncService` 入口；
- Dashboard 的旧 `SyncResult` 字段结构；
- Post/Gallery 独立领域同步和 `PARTIAL_SUCCESS` 语义。

本阶段没有移动 `sync-service.ts` 文件，也没有删除旧导出，降低后续阶段逐步拆分时的回归风险。

## 4. 未在本阶段处理的内容

- 数据库快照和恢复；
- 数据库字段删除或 Schema 迁移；
- ZIP 大小/路径安全边界的完整产品化；
- Dashboard 全站同步页面重写；
- Gallery 业务逻辑迁移到新的文件名；
- 新增测试框架和集成测试数据库。

这些内容分别属于 Stage 9.3、9.4、9.5 或后续质量治理，不通过本次低风险边界整理提前引入。