# 第九阶段开发计划（Stage 9：内容生产闭环、架构治理与数据快照）

> 制定日期：2026-09-13  
> 前置阶段：Stage 8 Post 与 Gallery 轻量统一同步平台  
> 主要输入：`documents/thoughts.md`、`documents/stage8-summary.md`、`documents/development-plan-stage8.1.md`  
> 阶段目标：将项目从“已经可以同步”整理为“用户可以稳定完成内容生产、检查、提交、同步和发布”的轻量个人 Blog 系统  
> 当前状态：规划中

---

## 一、阶段定位与完成定义

Stage 8 已完成 Post/Gallery 的统一同步入口、运行摘要和 TTL 防卡死保护。Stage 9 不再重点扩展并发能力，而是围绕四条主线治理项目：

1. 项目整体架构梳理；
2. 代码目录、模块边界和依赖方向优化；
3. 数据库表和字段审计、整理与快照恢复；
4. 从内容编辑到站点发布的完整用户流程优化。

本阶段正式纳入 `documents/thoughts.md` 中的两个 Todo：

- Dashboard 管理数据库快照，并允许管理员恢复整站运行时内容；
- `bun run sync` 未指定 scope 时默认尝试同步所有 content 内容。

Stage 9 的轻量原则：

```text
不引入多人协作平台；
不引入队列、Redis 或复杂分布式任务；
不把数据库快照当作 Git 内容源；
不让格式化工具覆盖用户正文；
不删除未知用途数据库字段；
不自动删除 Cloudinary 资源；
优先让用户看懂、检查和确认，再自动执行。
```

### 1.1 完成标准

- 架构说明与实际目录一致；
- Post、Gallery、Sync、Auth、Dashboard 边界明确；
- 关键重复逻辑完成收敛；
- 数据库表和字段完成使用审计；
- 废弃字段具有兼容期、备份和回滚说明；
- `bun run sync` 默认执行 `ALL`；
- 用户可以完成编辑、检查、格式化、提交、同步和发布；
- ADMIN 可以创建、查看和恢复数据库快照；
- 恢复前自动创建保护快照；
- 快照恢复不覆盖认证安全表；
- lint、TypeScript、内容检查、双域 dry-run、迁移和生产构建通过。

---

## 二、当前项目基线

### 2.1 内容责任边界

| 内容 | 人工编辑源 | 自动生成内容 | 数据库副本 | 媒体副本 |
| :--- | :--- | :--- | :--- | :--- |
| Post | `content/posts/**/*.md` | Frontmatter/图片引用 | `Post`、`Tag`、`_PostToTag` | Post Cloudinary media |
| Gallery album | `content/photo-gallery/{album}/album.yaml` | `gallery.yaml`、WebP | `Gallery`、`GalleryImage` | Gallery Cloudinary media |
| Gallery 原始输入 | `content/.gallery-input/{album}/` | 处理后的 WebP | 不直接入库 | 临时处理输入 |
| 同步状态 | 非人工源 | 运行摘要 | `SyncRun`、旧 `SyncLog` | 不适用 |

规则不变：`gallery.yaml` 只能由 `gallery:index` 生成；数据库不取代 Markdown/album.yaml；`.gallery-input` 不提交 Git；Post 和 Gallery 不合并业务表。

### 2.2 当前主要目录

```text
src/
├── app/                    # 页面、布局和路由
│   ├── dashboard/           # ADMIN 后台
│   ├── posts/               # Post 前台
│   ├── gallery/             # Gallery 前台
│   └── api/auth/            # Better Auth
├── components/             # UI 和展示组件
├── db/schema/              # Drizzle 表定义
├── lib/actions/            # Server Actions
├── lib/gallery/            # Gallery 领域服务
├── lib/sync/               # 统一同步基础设施
├── lib/sync-service.ts     # Post 领域同步服务
└── types/                  # DTO 和领域类型

scripts/
├── check-content.ts
├── gallery-index.ts
├── gallery-pull.ts
├── sync-content.ts
├── sync-galleries.ts
└── sync-pull.ts

content/
├── posts/
├── photo-gallery/
└── .gallery-input/
```

### 2.3 当前结构问题

Stage 9 重点处理：

1. `src/lib/sync-service.ts` 较大，解析、媒体、数据库和摘要逻辑耦合；
2. `posts-admin.ts` 同时承担管理、导入、导出、差异和同步触发；
3. `/dashboard/sync` 仍保留旧 Post 日志 UI，与新 `SyncRun` 摘要并存；
4. `src/lib/sync/` 与旧同步服务的边界还可以更清晰；
5. Drizzle 推导类型、Action DTO 和公共类型存在整理空间；
6. 多阶段迁移后需要审计表字段和索引是否仍然使用；
7. README、content README、scripts README 和 CI 命令需要统一；
8. `bun run sync` 当前不带 scope 时仍默认偏向 Posts；
9. 还没有一条清晰的提交前内容检查流水线；
10. 还没有数据库快照和管理员恢复能力。

---

## 三、整体架构目标

```text
编辑 Markdown / album.yaml / 原始图片
              ↓
内容检查、格式化、索引和 Git diff
              ↓
       Sync Orchestrator
  scope / runId / TTL / summary
          ↙             ↘
   Post Domain       Gallery Domain
   Markdown          album.yaml
   Post/Tag          Gallery/Image
          ↘             ↙
       PostgreSQL / Drizzle
     runtime copy + snapshot
              ↓
       Blog / Gallery UI
```

### 3.1 分层职责

#### 内容源层

负责 Markdown、YAML、Frontmatter、Git diff 和提交；不直接写数据库、不直接删除 Cloudinary、不手工编辑 `gallery.yaml`。

#### 领域服务层

Post 负责 Markdown、metadata、标签、Post 图片和 Post 表；Gallery 负责 album.yaml、图片处理、EXIF、Gallery 表和 Gallery 媒体。两个领域不得互相读取业务字段。

#### 同步编排层

负责 scope、runId、TTL、dry-run、部分成功、错误摘要和统一入口；不解析领域业务字段，不承担 Cloudinary Admin API 细节，不建立跨域业务事务。

#### 管理层

Dashboard 负责安全触发、摘要、快照和恢复确认；页面不直接操作 Drizzle、工作区文件或 Cloudinary。

### 3.2 目标代码结构

```text
src/lib/
├── actions/
│   ├── content-admin.ts
│   ├── gallery-admin.ts
│   ├── snapshot-admin.ts
│   ├── sync-admin.ts
│   └── user-admin.ts
├── content/
│   ├── post-parser.ts
│   ├── post-snapshot.ts
│   ├── content-check.ts
│   └── content-format.ts
├── gallery/
│   ├── gallery-parser.ts
│   ├── gallery-sync-service.ts
│   ├── gallery-conflicts.ts
│   └── gallery-snapshot.ts
├── snapshot/
│   ├── snapshot-types.ts
│   ├── snapshot-repository.ts
│   ├── snapshot-service.ts
│   └── snapshot-safety.ts
├── sync/
│   ├── sync-types.ts
│   ├── sync-orchestrator.ts
│   ├── sync-lock.ts
│   ├── sync-repository.ts
│   ├── sync-errors.ts
│   └── sync-hash.ts
└── ...
```

目录移动必须保持 `@/` 别名、领域行为和旧入口兼容；不要求一次性移动全部文件。

---

## 四、用户内容生产闭环

### 4.1 Post 编辑

```text
content/posts/**/*.md
```

检查 title、slug、date、status、tags、image、Frontmatter、图片路径、slug 冲突、绝对路径和敏感字段。自动修复必须可查看 diff，不能修改正文语义。

### 4.2 Gallery 编辑

原始图片只能放：

```text
content/.gallery-input/{album}/
```

人工配置位于：

```text
content/photo-gallery/{album}/album.yaml
```

检查 album slug、title、status、cover、图片引用、排序、RAW 输入和 `.gallery-input` Git 忽略状态。处理结果写入 `content/photo-gallery/{album}/images/`，`gallery.yaml` 只能自动生成。

### 4.3 提交前命令

建议新增：

```bash
bun run content:check
bun run content:format
bun run content:verify
bun run content:prepare
```

职责：

- `content:check`：检查 Markdown、YAML、slug、图片、Gallery 和敏感字段；
- `content:format`：只格式化白名单结构，支持 `--dry-run`/`--write`；
- `content:verify`：检查、索引、双域 dry-run、`git diff --check` 和 build；
- `content:prepare`：面向用户串联检查步骤，不执行 Git commit。

### 4.4 提交到 Git

用户检查：

```bash
git status --short
git diff -- content/posts
git diff -- content/photo-gallery
git diff --stat
```

允许提交 Markdown、album.yaml、自动生成的 gallery.yaml、处理后的 WebP 和内容模板；禁止提交 `.env`、密钥、数据库导出、`.gallery-input` 原始图片、临时 patch 和未审查 ZIP。

### 4.5 同步数据库

Stage 9 调整默认行为：

```bash
bun run sync
```

等价于：

```bash
bun run sync -- --scope all
```

显式 scope 仍可使用：

```bash
bun run sync -- --scope posts
bun run sync -- --scope galleries
bun run sync -- --scope all --dry-run --json
```

Post 成功/Gallery 失败返回 `PARTIAL_SUCCESS`；缺少 Gallery 目录、Cloudinary 凭证或数据库时必须给出明确摘要；失败后按 scope 重跑。

### 4.6 完成站点验证

同步后检查：

```text
/posts
/posts/[slug]
/gallery
/gallery/[slug]
/dashboard/sync
```

确认标题、状态、图片、相册数量、排序、封面、EXIF 和 runId 摘要均正确。

---

## 五、数据库表和字段整理

### 5.1 表分类

```text
认证：user、session、account、verification
Post：Post、tag、_PostToTag
Gallery：Gallery、GalleryImage
互动/配置：Comment、siteProfile
同步：SyncLog、SyncRun
```

Stage 9 不允许快照恢复覆盖认证表、`SyncRun`、`SyncLog` 或当前锁状态。

### 5.2 SiteSnapshot

建议新增轻量快照表：

```text
SiteSnapshot
- id, name, description
- status: CREATING | READY | RESTORING | RESTORED | FAILED | DELETED
- createdBy, createdAt, completedAt
- source: MANUAL | PRE_RESTORE | DEPLOYMENT
- schemaVersion
- summary jsonb
- payload jsonb
- payloadHash
- errorMessage nullable
```

第一版使用单个 JSONB payload，不新增 SnapshotItem 表。默认包含 Posts、Tags、关系、Galleries、GalleryImages 和 SiteProfile；评论由管理员选择是否包含；认证表、运行记录、锁和 Cloudinary 二进制不参与恢复。

### 5.3 快照流程

创建：ADMIN 校验 → 读取允许快照的业务表 → 规范化 JSON → 生成 SHA-256 hash → 保存摘要和 payload。

恢复：验证 ADMIN、READY 和 schemaVersion → 自动创建 `PRE_RESTORE` 快照 → 展示影响范围 → 二次确认 → 事务恢复业务副本 → 重新计算摘要并刷新页面。

恢复数据库不会回滚 Markdown 或 album.yaml。必须提示用户：人工源仍是新版本时，下一次同步可能重新覆盖数据库。

删除快照只允许 ADMIN；不得删除最近的 PRE_RESTORE；至少保留一个可恢复快照；不删除 Cloudinary 资源。

### 5.4 字段审计和整理

建立表格记录字段的当前用途、读取位置、写入位置、索引需求和保留结论，至少覆盖 `Post.metadata`、`Post.sourcePath`、`Gallery.contentHash`、`Gallery.mergeBase`、`GalleryImage.fileHash`、`GalleryImage.publicId`、旧 `SyncLog` 字段和 `SyncRun.summary`。

整理原则：不直接删除未知字段；先搜索代码和实际数据；先 deprecated；至少保留一个稳定版本周期；删除前导出数据并提供回滚 SQL；不使用 `db:reset`。

---

## 六、代码结构优化计划

### 6.1 边界整理

- 标出 `sync-service.ts` 的 Post Domain API；
- 将纯函数抽到 `src/lib/content/`；
- 独立 Post snapshot/hash；
- 将 Action 的权限、schema、业务调用和响应映射分开；
- 为 Post、Gallery、Sync 建立明确 public API；
- 清理重复 DTO、错误转换和无用 import。

退出条件：CLI、Dashboard 结果不变，TypeScript、定向 Biome 和旧入口等价检查通过。

### 6.2 Action/Service 分层

```text
Action -> requireAdmin -> Zod -> domain service -> safe DTO -> revalidatePath
```

Action 不应直接解析 Markdown、拼 SQL、操作任意工作区路径、返回 Drizzle 原始对象或暴露 Cloudinary 细节。

### 6.3 错误和测试

统一错误至少覆盖 `INVALID_INPUT`、`CONTENT_INVALID`、`DATABASE_UNAVAILABLE`、`LOCKED`、`CLOUDINARY_UNAVAILABLE`、`WRITEBACK_CONFLICT`、`SNAPSHOT_INVALID` 和 `SNAPSHOT_RESTORE_FAILED`。

补齐 content parser、Post snapshot/hash、Gallery parser/hash、SyncRun/TTL 锁、Snapshot create/restore、ADMIN Action 和 CLI 默认 `ALL` 测试，并增加旧入口与统一入口等价测试。

---

## 七、命令和流程实施计划

### 7.1 默认 sync

`bun run sync` 默认等价于 `bun run sync -- --scope all`。帮助信息必须说明默认同步所有内容域；单域同步需要显式指定 scope。

### 7.2 建议新增命令

```json
{
  "content:format": "bun run scripts/format-content.ts",
  "content:verify": "bun run scripts/verify-content.ts",
  "content:prepare": "bun run scripts/prepare-content.ts"
}
```

`content:prepare` 串联检查、格式预览、Gallery 索引、全站 dry-run 和 `git diff --check`，默认不 commit、不 push、不真实写数据库。`content:verify` 用于 CI。

### 7.3 推荐用户流程

#### Post

```bash
$EDITOR content/posts/my-post.md
bun run content:check -- --no-examples
bun run sync -- --scope all --dry-run --json
git diff -- content/posts
git add content/posts
git commit -m "content: update post"
bun run sync -- --scope posts
```

#### Gallery

```bash
cp ./photos/* content/.gallery-input/travel/
$EDITOR content/photo-gallery/travel/album.yaml
bun run gallery:index
bun run content:check -- --no-examples
bun run sync -- --scope galleries --dry-run --json
git diff -- content/photo-gallery
git add content/photo-gallery
git commit -m "content: update gallery"
bun run sync -- --scope galleries
```

#### Full Blog

```bash
bun run content:prepare
git diff --check
git status --short
git add content/posts content/photo-gallery
git commit -m "content: update blog"
bun run sync
```

### 7.4 CI 和生产发布

CI 只执行检查和 dry-run；受控发布环境才执行 `db:migrate`、全站 dry-run 和真实同步。禁止真实 Cloudinary 删除、`db:reset`、未经确认的工作区回写和 `.gallery-input` 原始媒体提交。

---

## 八、Dashboard 数据库快照

建议新增：

```text
src/app/dashboard/snapshots/page.tsx
src/app/dashboard/snapshots/loading.tsx
src/app/dashboard/snapshots/error.tsx
src/lib/actions/snapshot-admin.ts
src/lib/snapshot/snapshot-service.ts
```

页面提供最近快照、创建、详情、删除、恢复、影响范围和二次确认。恢复前自动创建 PRE_RESTORE，恢复失败事务回滚。

默认恢复 Posts、Tags/关系、Galleries、GalleryImages 和 SiteProfile；默认不恢复 User、Account、Session、Verification、SyncRun、SyncLog、锁和 Cloudinary 二进制。评论由管理员明确选择。

```text
Git rollback       -> Markdown、album.yaml、gallery.yaml 和代码
Database snapshot  -> 运行时数据库副本
Cloudinary backup  -> 媒体资源恢复
```

恢复数据库后必须提示：人工源未回滚，下一次同步可能重新覆盖恢复结果。

---

## 九、实施阶段

### 阶段 9.1：架构和流程基线

交付架构图、目录职责、领域边界、命令行为表、内容生产流程和默认 `sync=ALL` 设计。

验收：新用户只阅读 README 和 content README 就能理解完整流程，文档命令一致。

### 阶段 9.2：代码结构优化

交付 Post/Gallery/Sync Action 与 Service 边界、纯函数抽离、重复 DTO/错误清理、依赖方向检查和兼容测试。

验收：旧入口和统一入口结果不变，无新增循环依赖。

### 阶段 9.3：数据库表和字段审计

交付 Schema 使用矩阵、废弃字段清单、索引检查、JSONB 规范、快照 Schema 和 migration。

验收：空库、已有库和重复迁移通过；未知字段不直接删除；快照不包含认证安全表。

### 阶段 9.4：内容工作流产品化

交付 `content:format`、`content:verify`、`content:prepare`、Post/Gallery 提交前检查、原始输入保护和默认 `sync=ALL`。

验收：新用户可以完成 Post、Gallery 和 Full Blog 流程；检查失败时退出码非零。

### 阶段 9.5：Dashboard 快照和恢复

交付 Snapshot schema、Repository、Service、ADMIN Actions、Dashboard 页面、创建/查看/删除/恢复和 PRE_RESTORE 保护。

验收：只有 ADMIN 可以操作；恢复失败可回滚；不覆盖认证表；恢复后提示人工源状态。

### 阶段 9.6：整体验收和文档收敛

交付 README、content README、scripts README、GitHub Actions、Forker 路径、快照说明和 Stage 9 总结。

---

## 十、验收命令和测试场景

### 10.1 质量命令

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run content:verify
bun run gallery:index
bun run sync -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync -- --scope all --dry-run --json
bun run db:migrate
bun run build
```

### 10.2 用户流程场景

- 新建/修改 Post 并检查；
- Post 图片引用错误和 slug 冲突；
- 新建 Gallery album；
- Gallery 原始图片放错目录；
- 缺失 album.yaml、cover 或图片引用；
- Gallery RAW 输入；
- `gallery:index` 后检查 Git diff；
- 无 scope 执行 `bun run sync`；
- 显式执行 posts、galleries、all；
- Post 成功/Gallery 失败；
- Post 失败/Gallery 成功；
- 同时启动 CLI 和 Dashboard；
- 运行锁过期后再次同步；
- 数据库不可用；
- Cloudinary 凭证缺失；
- 提交前检查失败；
- 同步成功后检查 Blog/Gallery 页面。

### 10.3 快照场景

- 创建空站点快照；
- 创建包含 Post/Gallery 的快照；
- 可选包含评论；
- payload hash 稳定；
- 快照内容脱敏；
- 恢复前自动创建 PRE_RESTORE；
- 恢复 Post、Gallery 和站点配置；
- 恢复失败事务回滚；
- 不恢复 User/Account/Session；
- 删除旧快照并保留至少一个可恢复快照；
- 恢复后提示人工源版本差异。

### 10.4 权限场景

- 未登录访问快照页面；
- USER 访问快照页面；
- ADMIN 创建、删除和恢复快照；
- 伪造 snapshot ID 和恢复范围；
- 恢复未完成或失败快照。

---

## 十一、风险与控制

### 11.1 快照过大

第一版只保存数据库元数据和内容字段，不保存二进制媒体；超过限制时返回错误，后续需要时再引入对象存储。

### 11.2 快照恢复覆盖新内容

使用 PRE_RESTORE、二次确认、影响范围展示、人工源未回滚提示和恢复后 dry-run，避免把数据库恢复误解为 Git 回滚。

### 11.3 字段清理误删

先审计读写位置、先 deprecated、保留迁移回滚和数据库备份，不使用 `db:reset`。

### 11.4 默认 sync=ALL 后 Gallery 失败

保留 `scope=posts`、优先 dry-run、返回 `PARTIAL_SUCCESS`，并在 README 中区分 Post-only、Gallery-enabled 和 Full Blog。

### 11.5 重构改变同步行为

先做 fixture，按小提交移动边界，比较旧入口和新入口领域结果，每阶段独立构建和 dry-run。

---

## 十二、Stage 9 不实施的内容

- 多人协作编辑；
- 在线 Markdown 协作；
- 复杂发布审批；
- 邮件通知系统；
- Redis/队列；
- 实体级同步任务平台；
- 自动 Cloudinary 回收站；
- RAW 解码；
- 在线图片裁剪；
- 全量数据库二进制备份；
- 自动 Git commit/push；
- 自动覆盖用户未确认的内容；
- 把数据库快照当作 Git 内容源替代品。

---

## 十三、Stage 9 交付门禁

- [ ] 架构图、目录说明和实际代码一致；
- [ ] Post/Gallery/Sync/Auth/Dashboard 边界明确；
- [ ] `bun run sync` 默认执行所有内容域；
- [ ] `scope=posts|galleries|all` 仍可显式使用；
- [ ] 内容检查、格式化和提交前验证命令可执行；
- [ ] Gallery 原始输入不会被误提交；
- [ ] `gallery.yaml` 仍然只能自动生成；
- [ ] 数据库表和字段使用矩阵完成；
- [ ] 废弃字段有兼容期和回滚说明；
- [ ] SiteSnapshot migration 可重复执行；
- [ ] ADMIN 可以创建和查看快照；
- [ ] ADMIN 可以二次确认恢复快照；
- [ ] 恢复前自动创建 PRE_RESTORE 快照；
- [ ] 恢复不覆盖认证安全表；
- [ ] 恢复不自动删除 Cloudinary；
- [ ] 快照恢复失败可回滚；
- [ ] Post、Gallery、Full Blog 用户流程通过；
- [ ] CLI 和 Dashboard 并发提示通过；
- [ ] lint、TypeScript、内容检查、双域 dry-run、迁移和 build 通过；
- [ ] README、content README、scripts README 和 CI 命令一致。

---

## 十四、Stage 9 完成后的项目状态

```text
用户编辑 Markdown / album.yaml / 原始图片
        ↓
content:check / content:format / gallery:index
        ↓
content:verify / sync --scope all --dry-run
        ↓
Git diff 审查与提交
        ↓
bun run sync（默认 ALL）
        ↓
SyncRun 摘要与 TTL 保护
        ↓
Post/Gallery 数据库副本和 Cloudinary
        ↓
Blog/Gallery 前台验证
        ↓
Dashboard 数据库快照和恢复保护
```

最终定位：

> **一个结构清晰、内容流程明确、数据库可治理、可通过快照恢复、适合个人维护的 Post + Gallery Blog 系统。**