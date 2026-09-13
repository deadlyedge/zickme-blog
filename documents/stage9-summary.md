# Stage 9 总结：内容生产闭环、架构治理与数据快照

> Stage 9.6 收口日期：2026-09-13

## 1. 最终架构

```text
Markdown / album.yaml / 原始图片
          ↓
content:check / content:format / gallery:index
          ↓
content:verify / content:prepare / git diff
          ↓
Sync Orchestrator（scope / runId / TTL / summary）
       ↙                         ↘
Post Domain                 Gallery Domain
       ↘                         ↙
PostgreSQL / Drizzle 运行时副本 + Cloudinary 媒体
          ↓
Blog / Gallery / Dashboard
          ↓
SiteSnapshot 业务快照与 PRE_RESTORE 恢复保护
```

内容源仍是 Markdown、`album.yaml` 和处理后的 WebP。数据库不是 Git 内容源替代品，Cloudinary 不是数据库快照的一部分。

## 2. Stage 9 交付矩阵

| 阶段 | 交付 | 状态 |
| :--- | :--- | :---: |
| 9.1 | 架构图、目录职责、领域边界、默认 `sync=ALL`、内容流程 | ✅ |
| 9.2 | Post 纯函数边界、旧 DTO 适配、兼容入口和依赖方向 | ✅ |
| 9.3 | Schema 字段使用矩阵、废弃策略、SiteSnapshot migration | ✅ |
| 9.4 | `content:format`、`content:verify`、`content:prepare`、原始输入保护 | ✅ |
| 9.5 | Snapshot Repository/Service、ADMIN Actions、Dashboard 创建/删除/恢复 | ✅ |
| 9.6 | README、CI、GitHub Actions、Stage 9 总结和验收门禁 | ✅ |

## 3. 用户最终流程

```bash
# 编辑 Post / Gallery 内容
bun run content:prepare

# 审查变更并提交
git diff -- content/posts content/photo-gallery
git diff --check
git status --short
git add content/posts content/photo-gallery
git commit -m "content: update blog"

# 默认同步 Post + Gallery
bun run sync
```

失败时按 scope 重跑：

```bash
bun run sync -- --scope posts
bun run sync -- --scope galleries
```

管理员可在 `/dashboard/snapshots` 创建数据库快照。恢复时必须二次确认，系统自动创建 `PRE_RESTORE`，只恢复数据库业务副本，不回滚人工源或媒体资源。

## 4. CI 与发布边界

### PR/Push 质量门禁

`.github/workflows/quality.yml` 执行：

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit --pretty false
bun run content:verify
bun run build
```

质量门禁不执行真实同步、`db:reset`、Cloudinary 删除、Git commit 或 push。

### 受控发布

`.github/workflows/sync-db.yml` 在媒体工作流成功或手动触发后执行：

```text
content:verify
  ↓
db:migrate
  ↓
sync --scope all
```

真实同步只发生在受控发布工作流，且保留 SyncRun、scope、TTL 锁和失败摘要。

## 5. 数据恢复边界

快照默认包含 Post、Tag、关系、Gallery、GalleryImage 和 SiteProfile；评论需明确选择。认证表、SyncRun、SyncLog、锁、密码、Token、Secret 和 Cloudinary 二进制永不进入快照。

恢复失败通过数据库事务回滚；删除快照是软删除；至少保留一个可恢复快照；`PRE_RESTORE` 保护快照不能删除。恢复后人工内容源未回滚，下一次同步可能覆盖数据库恢复结果。

## 6. 完成门禁

- [x] `bun run sync` 默认执行 ALL；
- [x] Post/Gallery/ALL 显式 scope 可用；
- [x] 内容检查、格式预览和提交前验证可执行；
- [x] Gallery 原始输入和非 WebP 媒体受保护；
- [x] Schema 使用矩阵和废弃字段策略完成；
- [x] SiteSnapshot migration 可重复执行；
- [x] ADMIN 快照创建、查看、删除和恢复可用；
- [x] 恢复前自动创建 PRE_RESTORE；
- [x] 恢复不覆盖认证表、运行记录、锁或 Cloudinary；
- [x] CI 只读质量门禁与受控发布边界明确；
- [x] lint、TypeScript、内容检查、双域 dry-run、migration 和 build 通过。

## 7. Stage 9 不包含

Stage 9 仍不引入多人协作、审批工作流、邮件系统、Redis/队列、实体级任务平台、自动 Cloudinary 回收站、RAW 解码、在线图片裁剪或自动 Git commit/push。