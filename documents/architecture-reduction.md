# 架构减法实施方案：回归 Git-first 单向发布

> 状态：提案，作为 Stage 9.6 之后的架构治理基线
>
> 目标：降低个人使用、发布和维护成本，不再继续扩展三方双向同步体系。

## 1. 背景与核心判断

Stage 9 已建立内容校验、Post/Gallery 同步、运行记录、锁、冲突处理和数据库快照能力。但对于单人维护的博客/Gallery，这套体系已经引入了超出实际收益的复杂度：

- Git 内容源、数据库副本和 Dashboard 都可能成为编辑入口；
- Post 与 Gallery 同时存在独立入口和统一入口；
- 数据库与本地文件之间存在回写、拉取、导出和冲突合并；
- `SyncRun`、TTL 锁、scope、retry、revision、merge base 和快照形成了近似任务平台的内部协议；
- Cloudinary、数据库和 Git 的恢复边界不一致，容易把“恢复运行时数据”误解为“恢复整个站点”。

本方案的核心判断是：

> 个人博客的首要目标是可靠、可理解、低摩擦地发布内容，而不是实现一个通用的双向内容管理平台。

后续架构应从“同步系统优先”收敛为“内容源优先”。

## 2. 目标架构

```text
Markdown / album.yaml / processed WebP
                │
                ▼
      content check / media prepare
                │
                ▼
             Git commit
                │
                ▼
       单向 publish / deploy pipeline
          ┌─────┴────────┐
          ▼              ▼
   PostgreSQL         Cloudinary
  运行时查询副本       媒体 CDN
          └─────┬────────┘
                ▼
          Blog / Gallery
```

### 2.1 唯一内容源

Git 管理的文件是唯一人工内容源：

```text
content/posts/**/*.md
content/photo-gallery/**/album.yaml
content/photo-gallery/**/images/*.webp
```

数据库不是人工内容源的替代品，Cloudinary 不是内容元数据源。

### 2.2 单向数据流

允许的方向只有：

```text
Git 内容源 → 校验/处理 → PostgreSQL 与 Cloudinary → 公开站点
```

默认禁止以下方向：

```text
PostgreSQL → Markdown
Dashboard → Markdown
Dashboard → album.yaml
Cloudinary → Git 内容源
```

### 2.3 恢复边界

| 数据 | 恢复方式 |
| --- | --- |
| Markdown、album.yaml、WebP | Git revert、分支、tag、备份仓库 |
| PostgreSQL 运行时数据 | Neon/数据库备份、`pg_dump` 或受控数据库恢复 |
| Cloudinary 媒体 | Cloudinary 保留策略和原始图片备份 |
| 应用代码和配置 | Git 与部署平台 |

业务快照不能被描述为完整站点备份。若保留 `SiteSnapshot`，它只能是数据库业务副本保护工具。

## 3. 明确的职责边界

### 3.1 内容作者工作区

负责编辑 Markdown、`album.yaml` 和处理后的 WebP，执行内容校验和媒体预处理，审查 Git diff，并提交和推送内容变更。

不负责手动编辑生成的 `gallery.yaml`，不通过数据库反向生成内容源，也不把 Dashboard 当成第二套正文编辑器。

### 3.2 publish 流程

负责读取 Git 内容源、校验 Frontmatter/YAML/图片路径/slug、处理或上传媒体、幂等写入 PostgreSQL 运行时副本，并输出清晰的发布摘要。

不负责自动 commit/push，默认不回写本地 Markdown/YAML，不通过复杂 merge 解决双向编辑冲突，也不在 CI 质量检查中修改生产数据库。

### 3.3 Dashboard

Dashboard 保留为运行时管理和观察工具：查看站点和发布状态、查看文章和相册状态、管理评论/用户/站点设置、查看发布错误摘要，以及手动触发单向 publish。

Dashboard 不再作为内容源编辑器。若暂时保留旧编辑能力，必须标记为兼容期能力，禁止新增依赖。

### 3.4 Cloudinary

Cloudinary 只负责图片存储、CDN、展示尺寸和缩略图，以及由单向发布流程产生的媒体资源。它不负责决定内容发布状态，也不作为原始照片备份。

## 4. 能力分类

### 4.1 保留

- `content:check`、`content:format`、`content:verify` 的纯校验能力；
- Post 和 Gallery 独立的内容模型；
- Sharp WebP 处理、尺寸限制和 EXIF 隐私策略；
- Cloudinary 上传和幂等媒体更新；
- 数据库运行时查询；
- 简单、可重入的单向发布；
- ADMIN 权限、评论管理和站点设置；
- GitHub Actions 的 lint、TypeScript、内容检查和构建门禁。

### 4.2 冻结，不再扩展

- `SyncRun`、运行摘要和最近发布记录；
- `scope=posts|galleries|all`，直到单向 publish 收敛完成；
- 现有 Dashboard 同步页面；
- `SiteSnapshot`；
- Gallery revision 和待删除状态；
- 旧的 Post/Gallery 兼容入口。

冻结意味着只修复安全、数据一致性和阻断性缺陷，不新增实体级任务、冲突 UI、自动回写或新的同步方向。

### 4.3 逐步废弃

- `sync:pull`；
- `gallery:pull` 和 patch/ZIP 回写；
- Dashboard 修改内容后回写 Markdown/YAML；
- 数据库文章导出作为内容恢复手段；
- frontmatter poster 自动 write-back；
- `mergeBase`、字段级 merge 和实体级冲突协议；
- 仅为双向同步存在的 `revision`、`syncVersion` 和复杂状态枚举。

### 4.4 原则上删除

兼容期结束并完成数据确认后，删除不再使用的双向同步 CLI、Server Actions、DTO adapter、Snapshot Dashboard 交互，以及仅服务于双向同步的字段、迁移和状态枚举。

删除前必须完成使用情况检查、迁移说明和回滚方案，不能直接删除生产数据字段。

## 5. 推荐用户流程

### 5.1 Post

```bash
# 编辑 content/posts/example.md
bun run content:check -- --no-examples
bun run publish -- --scope posts --dry-run
git diff -- content/posts
git diff --check
git add content/posts
git commit -m "content: update post"
git push
bun run publish -- --scope posts
```

### 5.2 Gallery

```bash
# 原始图片放入 content/.gallery-input/{album}/，并自行备份
bun run gallery:prepare
bun run content:verify
bun run publish -- --scope galleries --dry-run
git diff -- content/photo-gallery
git add content/photo-gallery
git commit -m "content: add gallery"
git push
bun run publish -- --scope galleries
```

在命令合并完成前，可暂时使用现有 `bun run sync -- --scope ...` 作为兼容入口，但 README 和新文档不应继续扩展旧入口语义。

## 6. 分阶段实施计划

### 阶段 A：冻结和建立安全边界

- 将本方案作为当前架构决策记录；
- 更新 `AGENTS.md`、README 和发布说明；
- 明确 Git 内容源唯一性；
- 禁止新增双向同步、merge、pull、write-back 功能；
- 修复 `dry-run` 的所有文件、数据库和 Cloudinary 副作用；
- 让质量门禁不依赖生产数据库写入；
- 为现有兼容入口增加废弃提示。

验收：dry-run 不写文件、不上传媒体、不创建或更新生产 `SyncRun`。

### 阶段 B：收敛为单向 publish

- 新增或重命名为 `publish` 的统一 CLI；
- Post 和 Gallery 只作为 publish 的两个读取域；
- 保留 `posts|galleries|all` scope，但不再引入实体级重试；
- 输出成功、跳过、待处理、失败文件和媒体摘要；
- 发布流程默认不回写内容源；
- Dashboard 仅触发同一个 publish service。

验收：本地 CLI、Dashboard 和受控 CI 发布使用同一个单向 Service。

### 阶段 C：禁用反向编辑和回写

- 禁止 `sync:pull` 作为正常流程；
- 禁止数据库 poster 自动回写 Markdown；
- 禁止 Gallery patch/ZIP 自动回写 `album.yaml`；
- Dashboard 内容编辑入口改为只读或显示废弃提示；
- 为旧入口保留明确错误信息和迁移说明一段兼容期。

验收：所有内容变化都能在 Git diff 中被发现，数据库操作不会静默修改工作区文件。

### 阶段 D：清理数据模型和运行协议

- 审计 `mergeBase`、`revision`、`syncVersion`、`syncStatus` 使用情况；
- 将仅用于双向同步的字段标记 deprecated；
- 删除旧 Action、DTO、脚本和页面；
- 简化 SyncRun 为发布记录，或迁移到最小化 `publish_runs`；
- 决定 `SiteSnapshot` 是继续保留为数据库保护工具，还是交由平台备份取代；
- 删除对应 migration 和过期文档中的现行语义。

验收：核心发布链路不再依赖 merge base、实体冲突、反向拉取和双向 revision。

### 阶段 E：删除与验证

- 删除兼容入口和废弃代码；
- 更新 README、CI、环境变量说明和目录说明；
- 增加纯函数和 publish service 测试；
- 验证全新环境可以从 Git 内容源完成初始化；
- 验证内容检查不依赖数据库和 Cloudinary；
- 验证失败发布不会破坏既有运行时数据。

验收：用户可以只依赖 README 完成“编辑、检查、提交、发布、回滚”。

## 7. 兼容期规则

1. 先停止新增依赖，再迁移调用方，最后删除实现；
2. 废弃入口不能悄悄改变含义，必须输出迁移提示；
3. 不因为删除双向同步而自动删除数据库现有内容；
4. Schema 字段删除前必须确认生产数据不再读取；
5. 任何影响 Cloudinary 的删除操作仍需显式确认；
6. 内容恢复优先使用 Git 历史，不把数据库快照当作 Git 替代品；
7. 每个阶段只解决一类边界问题，避免在减法过程中重新引入新的编排层。

## 8. 后续开发禁止事项

在本方案完成或被明确替代前，不得新增数据库到 Markdown/YAML 的自动回写、自动 Git commit/push、新的双向 merge 协议、实体级同步任务、Cloudinary 原始内容备份语义、完整站点快照语义或第三套内容源。

如果一个新功能需要同时修改 Git 内容源、数据库副本和 Cloudinary，必须先说明它为何不能通过单向发布完成，并评估是否违反本方案。

## 9. 最终验收标准

- [ ] Git 是唯一人工内容源；
- [ ] Post 和 Gallery 都能通过单向 publish 发布；
- [ ] `dry-run` 完全不写文件、不写数据库、不上传媒体；
- [ ] Dashboard 不会静默回写 Markdown 或 YAML；
- [ ] CI 质量检查不依赖生产数据库写入；
- [ ] 旧双向入口有废弃提示或已删除；
- [ ] 运行时数据库和 Cloudinary 的职责被明确记录；
- [ ] 原始照片备份责任已记录；
- [ ] Git 内容回滚和数据库恢复路径分别可执行；
- [ ] 核心 publish、parser 和恢复边界有自动化测试；
- [ ] README、AGENTS.md 和本方案没有互相矛盾的现行流程。