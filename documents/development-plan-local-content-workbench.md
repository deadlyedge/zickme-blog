# 下一阶段开发计划:本地内容工作台与 Dashboard 收敛

> 状态:阶段 0 已完成(结论见 [`architecture/adr-local-content-workbench.md`](architecture/adr-local-content-workbench.md),待你确认其中第 8 节决策后进入阶段 1);阶段 1 及之后尚未开始代码实现
> 目标:让**所有会被 Publish 覆盖的内容**都只在本地(Git)编辑;线上 Dashboard 收敛为运行时只读观察与运维工具;本地工作台提供可视化的编辑、检查、发布和评论查看。
> 前置架构:Git 是唯一人工内容源;PostgreSQL 与 Cloudinary 是可重建的运行时副本;Publish 保持单向。
> 相关文档:[`next-stage-discuss.md`](next-stage-discuss.md)、[`architecture/current-code-structure-summary.md`](architecture/current-code-structure-summary.md)。
> 本版相对旧版的变化:新增"数据归属"判定表和 Dashboard 收敛计划;站点设置纳入 Git;移除线上 Publish;实时进度、多来源、Git 写操作延后;保留评论只读查看。

---

## 一、核心判定:数据归属

唯一的判定问题:**这个字段被下一次 Publish 覆盖后,还能保留吗?** 不能,则它的真相必须在 Git,只能在本地改。

| 数据 | 真相所在 | 本地工作台 | 线上 Dashboard |
|---|---|---|---|
| Post 正文、frontmatter(含 `status`、封面 `image`) | Git `content/posts/` | 编辑 | 只读 |
| Gallery `album.yaml`(标题、说明、图片元数据) | Git `content/photo-gallery/` | 编辑 | 只读 |
| **站点设置**(profile、社交、skills、slogans、主题、Landing、About) | **Git `content/site/`(新增)** | 编辑 | 只读 |
| 处理后的图片(WebP) | Git | 导入/生成 | — |
| Publish 运行记录、同步日志 | 运行时 | 查看结果 | 只读 |
| 用户、评论、封禁/垃圾标记 | 运行时 | 评论**只读查看** | 管理(保留) |
| 站点统计 | 运行时 | — | 只读 |
| Snapshot 备份/恢复 | 运行时 | — | 保留 |
| 文章删除/归档 | Git(删除文件或改 `status`) | 经 frontmatter 与 Publish | **不提供**(线上无删除入口) |

判定规则落地为代码审查红线:

> **Dashboard 的任何 Server Action 不得写入 `posts`、`galleries`、`galleryImages`、`siteProfile` 中由 Git 内容派生的字段。**

**可重建性验收**:执行 `bun run db:reset` 后,仅凭 `content/` 与 `bun run publish` 就能还原全部站点外观与内容(不含用户账户、评论、会话)。

## 二、Dashboard 收敛计划

### 2.1 现有写操作处置清单

| 现有入口 | 处置 |
|---|---|
| `posts-admin`:`updatePostStatus`、`batchUpdatePostStatus`、`archivePost`、`restorePost` | **移除**。状态改为在工作台修改 frontmatter `status` 后 Publish |
| `posts-admin`:`updatePostPosterAction`、`uploadPostPosterAction` | **移除**。封面在工作台改 frontmatter `image` |
| `posts-admin`:`triggerPublish` | **移除**(线上不再发布,见 2.3) |
| `sync-admin`:`triggerSyncAction` | **移除**;`listSyncRuns`/`getSyncRunAction` 保留为只读 |
| `gallery-admin`:`updateGallery`、`updateGalleryImage` | **移除**。改为在工作台编辑 `album.yaml` |
| `deletion-admin` 的 `post` 分支(`previewDeletion`/`confirmDeletion`) | **移除**。现状 `confirmDeletion` 会把文章写成 `ARCHIVED`,同样属于会被 Publish 覆盖的写入 |
| `gallery-admin`:`markGalleryImageForDeletion`、`deletion-admin` 的 gallery/图片分支 | **建议同口径移除**(见 2.4,待你确认) |
| `profile`:`updateSiteProfile` 及 Settings 页全部表单 | **迁出**:Settings 页改只读展示,编辑能力在工作台实现(见第三章) |
| `profile`:`updateProfile`、`updateAvatar`(用户个人资料) | 保留,属用户运行时数据,与站点设置无关 |
| 用户、评论、Snapshot、统计 | 保留 |
| `posts-admin`:`deletePostPermanently` | **移除**。当前已是只返回失败提示的空实现,连同 Dashboard 的 `PostDeleteDialog` 与删除按钮一并删除 |

### 2.2 迁移顺序(每步独立提交,可回滚)

1. **先只读化**:在工作台就绪前不要删除线上写入口导致无处可改。每一类写操作的迁出流程为:工作台具备等价编辑能力 → Dashboard 对应 UI 改为只读(隐藏按钮)→ 删除 Server Action 与相关测试 → 更新 README。
2. 顺序建议:**状态 → 封面 → Gallery 元数据 → 站点设置**(按冲突严重度与实现成本排序)。
3. 收敛完成后,在 `tests/` 增加边界测试:扫描 `lib/actions/*-admin.ts` 与 `profile.ts` 的导出,断言不存在对内容派生表的 `db.update/insert/delete`(参考现有 `publish-boundaries.test.ts` 风格)。

### 2.3 移除线上 Publish

- 线上(Vercel)进程读不到本机 Git 内容,在线触发的 Publish 语义不清,且违背"内容只在本地发布"。删除 `triggerPublish` 与 Dashboard 的发布按钮;`PublishTriggeredBy` 中的 `DASHBOARD` 值保留以兼容历史运行记录,不再产生新记录。
- Dashboard 的 `sync` 页面改名/定位为**"发布状态"**:展示最近运行、Post/Gallery(及 Site)分项摘要、错误、source missing 信息、最近一次成功发布时间。只读。
- 同时展示"内容新鲜度"提示:数据库最新发布时间 vs 当前部署版本,不尝试判断本地 Git 状态(线上不可知)。

### 2.4 删除的新语义

- **线上不再有任何删除/归档文章的入口**。文章下线的方式:本地把 frontmatter `status` 改为 `archived`/`draft` 后 Publish;或删除 Markdown 源文件。
- 删除 Markdown 后 Publish 只报告 source missing,**不自动删库**(沿用现有保护),数据库会残留一篇无源文件的文章。阶段 0 在两种方案中二选一:
  1. **用 `archived` 表达下线(推荐)**:工作台发现 source missing 时,引导用户恢复文件并设 `status: archived`,而不是删除文件。保留评论和链接历史,无需新增任何删除能力。
  2. **本地显式清理命令**:如 `bun run publish -- --scope posts --prune-missing --confirm`,经预览(列出评论与 Cloudinary 影响)和显式确认后才清理运行时副本。
- Gallery 删除目前由同一 `deletion-admin` 处理。为保持"线上 Dashboard 无内容写入",建议同样移除线上入口并按同一方案处理;如果你想保留相册层面的线上删除,请在阶段 0 说明理由。

## 三、站点设置纳入 Git

### 3.1 内容格式

```text
content/site/
├── profile.yaml        # name/title/bio/location/email/website/portraitImage(引用 portraitImage/ 下的文件)
├── social.yaml         # socialLinks
├── skills.yaml
├── slogans.yaml
├── theme.yaml          # themeConfig
├── landing.yaml        # landingPageConfig
├── about.yaml          # aboutPageConfig(hero/timeline/featured projects 等)
└── portraitImage/      # 站点头像/肖像的本地源图片(Git 管理)
```

拆分原则:一个文件对应一个概念,避免单个超大 YAML;文件与 `siteProfile` 的列/JSON 字段一一映射,便于校验与 diff。

### 3.2 发布方式

- 新增第三个独立内容域 `site`:`PublishScope` 扩展为 `posts | galleries | site | all`;**与 Post、Gallery 保持独立**,不合并为通用服务。
- 实现位置:`src/lib/publish/site-input-reader.ts`(读取+Zod 校验)、`site-repository.ts`(upsert 单行 `siteProfile`)、`site-publish-service.ts`(编排,支持 dry-run)。复用现有 `publish-workflow` 的锁、运行记录和摘要。
- Zod schema 复用现有 `src/types/site.ts` / `constants/profile.ts` 的规则,不重复定义。
- 语义:Git 文件是整体权威来源;Publish 整体覆盖 `siteProfile` 单行;`dry-run` 只读(不连库、不写文件)。
- 缺少文件时的行为:报校验错误并阻止该域发布,**不**以默认值静默覆盖线上设置。首次迁移时提供一次性导出命令。

### 3.3 一次性迁移

- 提供 `bun run site:export`(一次性、显式、只读数据库→写 `content/site/*.yaml` 到工作区,默认不覆盖已有文件)。这是**唯一**允许的"数据库到文件"方向,仅用于初次迁移,完成后建议从 `package.json` 移除或标注为迁移用途,避免被理解为回写通道。
- 迁移后 `site:export` 的输出必须经人工审阅并提交 Git,再 `publish --scope site` 验证数据库内容无差异。

### 3.4 媒体

- **站点头像先走 Cloudinary**:源图片放在 `content/site/portraitImage/`,`profile.yaml` 中只写相对路径(如 `portraitImage/portrait.webp`)。Publish 时上传 Cloudinary,并把 CDN 链接写入 `siteProfile.avatar`。
- 复用 `src/lib/publish/media-upload.ts` 与 `cloudinary-public-id.ts`,在 `myblog/` 根目录下使用独立前缀(如 `myblog/site/`),保证 `media:audit` 能识别引用,不会被当作未引用资产清理。
- 与 Post 媒体规则一致:`dry-run` 不上传、保留本地路径;缺失文件、不支持的格式、超限尺寸都在校验阶段报错;建议本地文件已是 WebP 以便 Git 管理。
- 不支持直接填写任意外链(沿用现有隐私/安全约束);确有需要时再显式放宽。
- `site:export` 迁移时,数据库中现有头像若为 Cloudinary 链接,只输出待人工处理的提示,不自动下载图片。

## 四、本地内容工作台(MVP)

### 4.1 定位与运行方式

- 工作台是**只在本机运行的 Bun 服务 + 浏览器界面**，同仓库。它不是新的内容源，也不替代 CLI/TUI。
- **已确定选型**：独立 Bun 进程，通过 `bun run workbench` 启动（`package.json` 新增脚本），绑定 `127.0.0.1`。**不放进 Next.js 应用的路由**，因此线上构建物理上不包含工作台代码，从根本上避免"线上暴露本地文件接口"。
- 建议目录：
  ```text
  workbench/
  ├── server.ts          # Bun.serve 入口（loopback、Host/Origin 校验、令牌）
  ├── api/               # 路由处理：content / check / publish / comments / git
  ├── ui/                # 浏览器界面（静态资源）
  └── lib/               # workspace-paths、content-writer、DTO 与 Zod 校验
  ```
  复用 `src/lib/*` 的校验、Publish、媒体逻辑（`@/...` 别名保持可用）；`src/` 不得引用 `workbench/`，`next build` 不包含它，需确认 `tsconfig` 与 Biome 配置覆盖该目录。
- 界面技术：优先 Bun 原生 HTML 导入 + React（项目已依赖 React 19、Radix、Tailwind），表单可复用 `components/ui/` 的基础组件；**不引入新的前端框架或打包工具**。复用时避免带入 Next 专属 API（`next/link`、`next/image`、Server Action）。
- 工作台服务是文件、Git、数据库只读查询和 Publish 调用的唯一执行边界。UI 不直连数据库、不拼 Shell 命令。

### 4.2 MVP 功能

**M1:内容浏览与结构化编辑**
- 列出 Post / Gallery / Site 的本地内容及关键字段(来源为 Git 工作区,非数据库)。
- Post:frontmatter 表单(`title/slug/date/status/tags/excerpt/image` 等);未纳入表单的合法字段必须保留;正文用外部编辑器或简单 Markdown 文本框,不做富文本。
- Gallery:`album.yaml` 常用字段表单;`gallery.yaml` 只读标注"生成文件"。
- Site:对应 `content/site/*.yaml` 的各设置表单(迁移现有 Settings 组件的表单逻辑,但改为读写本地文件)。
- 所有写入前展示目标文件与 diff;默认不覆盖已有内容;slug 或文件冲突明确提示。

**M2:检查、预览、发布**
- 调用现有 `publish-validation` / `content:check`,以结构化列表展示问题。
- 需要写入的修复(`content:fix`、`content:format`、`gallery:index`)先预览再确认。
- 执行 `dry-run` 并展示 scope 和分项摘要。
- 用户确认后调用 `runPublishWorkflow()`,**以最终结构化结果为主**:总体状态、运行 ID、Post/Gallery/Site 分项、错误、source missing。运行期间可用简单轮询刷新运行状态(读取运行记录),不要求事件流。
- 防止重复提交;未 commit 的内容允许发布,但界面须提示。

**M3:Gallery 导入向导**
- 从外部选择图片/文件夹,预览文件、格式与目标相册,复制到 `content/.gallery-input/`,调用现有 `prepare-media` 与 `gallery:index`;展示每张图的处理结果与失败原因,不静默忽略。

**M4:评论只读查看**
- 在 Post / Gallery 图片的详情处显示相关评论与回复,支撑"是否归档/改状态"的决策。
- 仅读:不提供创建、回复、编辑、删除、审核、标记垃圾等操作(这些仍留在线上 Dashboard)。
- 必须使用最小返回 DTO:作者显示名、头像标识、内容、时间、状态(垃圾/正常)、所属内容;**不返回邮箱、凭据等**。
- 查询失败时显示"数据不可用 + 更新时间",**不得显示为 0 条**。查询失败不阻塞编辑和 Publish。
- 数据库只读连接使用现有 `DATABASE_URL`;建议在文档中提醒用户可配置只读账号,但不强制。
- 评论按内容项(`postId` / 图片 ID)聚合显示数量,列表分页。

**M5(可选):Git 状态与 diff 视图**
- 只读显示 `git status`、选定路径 diff,区分工作台修改的文件与其他未提交变更。
- 不做 stage/commit/push。

### 4.3 内部抽象(保持克制)

首期只有一个来源(当前项目 Git 内容工作区)和一种文件写入路径,**不要为多来源提前建立 `WorkspaceSource`/`ContentChangeSet` 类型体系**。只需保证:

- 写入逻辑集中在一个 `content-writer` 模块中,输入是"目标路径 + 新内容",输出是"预览 diff / 已写入结果",便于以后包装成变更集;
- 路径解析集中在一个 `workspace-paths` 模块,所有写入都经过路径范围校验。

当出现第二种来源的真实需求时再提取抽象。

## 五、延后事项(Backlog)

以下不在本阶段范围,不得作为验收条件:

1. Publish 实时阶段事件流(SSE)、断线重连、服务重启后运行快照恢复。M2 的轮询 + 运行记录已满足基本可见性;后续如需实时进度,再由 `runPublishWorkflow()` 提供可选的进度回调。
2. 多本地来源扫描与持续变化监控。
3. Git stage / commit / push 的 UI 与服务接口(含凭据)。
4. 数据库删除、Cloudinary 清理与本地备份的整合闭环(2.4 方案 2 仅在确有需要时实现)。
5. Short URL、二维码及 Gallery 图片规范长链接。
6. 数据库 schema 规范化。
7. 添加本地ai整理功能。

## 六、非目标与硬约束

1. 不把线上 Dashboard 做成内容编辑器;反之,工作台不提供评论/用户/垃圾标记等运行时管理写操作。
2. 不实现第二套校验器、Publish 引擎、数据库写入器或 Cloudinary 上传实现;一律复用 `src/lib/publish` 及现有脚本逻辑。
3. 除第三章的一次性 `site:export` 外,不新增任何数据库→文件的回写。
4. Publish 不因源文件缺失自动删除数据库记录、评论或 Cloudinary 资源。
5. 不默认自动 commit/push;不新增队列、桌面壳(Electron/Tauri)或外部服务。
6. Post、Gallery、Site 三个内容域保持独立。

## 七、安全与运行边界

- **只允许本机访问**:绑定 loopback;校验 `Host` 与 `Origin`;使用启动时生成的短期本机令牌或等价 CSRF 防护,防范 DNS rebinding 和恶意网页对本机端口的跨站请求。
- 工作台是独立 Bun 进程,线上构建(Vercel/Next)**不得引用**它;增加测试确认 `src/` 不导入 `workbench/`、生产产物无本地文件操作端点。
- 文件操作限定在项目 `content/` 目录(及明确的输入区 `content/.gallery-input/`);路径规范化后校验,拒绝路径穿越与符号链接逃逸。
- 限制文件名、数量、单文件及总大小;校验文件类型与内容。
- 不向浏览器返回 `.env`、数据库凭据、Auth secret、Cloudinary secret 或其他本机信息。
- 调用现有脚本/命令时使用固定可执行程序与参数数组、明确工作目录和受限环境变量,禁止把用户输入拼接为 Shell 字符串。
- 写入错误时保留可诊断结果,避免含糊的半成品状态(先写临时文件再原子替换)。
- 不新增含糊的 `.backup-content` 目录;内容恢复依赖 Git 历史。

## 八、实施阶段

### 阶段 0:小型验证与契约(1 个短周期)

1. 验证 Bun 服务形态:`bun run workbench` 启动、loopback 绑定、Host/Origin 与令牌校验;确认 `src/lib` 模块可在 Bun 独立进程中直接导入(梳理哪些依赖 `next/headers`、`revalidatePath` 等 Next 专属 API);确认 `next build` 与生产产物不含 `workbench/`;确认 `@/...` 别名与 Biome/tsc 覆盖。
2. 梳理 `runPublishWorkflow()` 的输入/输出/副作用和运行记录读取方式,确认轮询可行。
3. 定稿 `content/site/*.yaml` 的字段与 Zod schema,盘点 Settings 页现有表单与 `siteProfile` 字段的映射。
4. 输出简短的架构决策记录(ADR):选型、威胁清单、对 `AGENTS.md`/README 的潜在影响(更新 `AGENTS.md` 前需先确认)。

### 阶段 1:站点设置进入 Git(Publish 侧,不涉及 UI)

1. 新增 `site` 内容域:reader / repository / publish service(含 `portraitImage` 的 Cloudinary 上传与 dry-run 行为),`PublishScope` 扩展,`content:check`/`content:verify` 覆盖 `content/site/`。
2. 提供 `site:export` 一次性迁移,生成初始 YAML 并人工审阅提交。
3. 验证:`publish --scope site --dry-run --json` 只读;真实 publish 后数据库与导出前一致;`db:reset` + `publish --scope all` 可还原站点外观。
4. 增加测试:缺文件阻止发布、dry-run 无副作用、Zod 校验、与 Post/Gallery 域互不影响。

### 阶段 2:工作台骨架 + 内容浏览(M1 前半)

1. 建立 `workbench/` Bun 服务与 UI 最小纵向切片,含 `bun run workbench` 脚本、安全启动与 Host/Origin 校验。
2. `workspace-paths`、`content-writer` 模块与单元测试(使用临时目录夹具)。
3. 列出 Post/Gallery/Site 内容与关键字段;Git 状态(只读)。

### 阶段 3:结构化编辑 + Dashboard 第一批收敛(M1 后半)

1. Post frontmatter 表单(含 `status`、封面),保留未知字段,写前 diff。
2. 完成后:移除 Dashboard 的状态变更、封面编辑与删除入口(`updatePostStatus`、`batchUpdatePostStatus`、`archivePost`、`restorePost`、封面相关 action、`deletePostPermanently`、`PostDeleteDialog`、`deletion-admin` 的 post 分支),Dashboard 文章页改只读。
3. Gallery `album.yaml` 表单 → 移除 `updateGallery`、`updateGalleryImage`,Dashboard 相册页改只读。
4. Site 设置表单(迁移 Settings 组件逻辑)→ Dashboard Settings 页改只读展示;删除 `updateSiteProfile` 的 Dashboard 调用路径。

### 阶段 4:检查、发布与线上 Publish 移除(M2)

1. 结构化校验结果、修复预览确认、dry-run、真实 Publish(轮询运行记录)。
2. 移除 `triggerPublish`、`triggerSyncAction`;Dashboard `sync` 页改为"发布状态"只读。
3. 加入"Dashboard 不写内容派生表"的边界测试。

### 阶段 5:评论只读查看与 Gallery 导入(M3、M4)

1. 评论只读 DTO 与查询(失败/不可用与零条可区分);Post 与 Gallery 图片详情展示。
2. Gallery 导入向导,复用 `prepare-media` / `gallery:index`。

### 阶段 6(可选):Git diff 视图与文档收尾

1. M5 只读 Git 视图。
2. 更新根 `README.md`、`scripts/README.md`(启动方式、命令变化、Dashboard 角色);如需改 `AGENTS.md` 先确认。

## 九、测试与验证

每阶段至少覆盖:

- 路径规范化、允许根目录、路径穿越、符号链接逃逸、拒绝敏感文件。
- Frontmatter/YAML 读写往返、未知字段保留、slug/文件冲突、默认不覆盖。
- `site` 域:校验、缺文件阻止发布、dry-run 只读、与其他域独立。
- Publish 仅经 `runPublishWorkflow()` 触发;重复提交防护;成功/部分成功/失败结果映射。
- `dry-run` 在文件、数据库、Cloudinary、锁与运行记录上无副作用。
- Dashboard 边界:不存在对内容派生表的写入 action;生产构建不含工作台端点。
- 评论 DTO 不含邮箱等敏感字段;失败状态不显示为 0 条;无写入能力。

命令:

```bash
bun run lint
bun test
bun run content:check -- --no-examples
bun run content:verify
bunx tsc --noEmit --pretty false
bun run publish -- --scope all --dry-run --json
bun run build
```

涉及本地服务监听和浏览器交互的功能,另做使用临时工作区与测试配置的集成验证,不触发生产 Publish。

## 十、验收标准

1. `content/` 单独即可完整还原站点:`db:reset` → `publish --scope all` 后,文章、相册、站点设置与重置前一致(不含用户与评论)。
2. 线上 Dashboard 无任何会被 Publish 覆盖的内容写入;无 Publish 触发入口、无文章删除/归档入口;提供发布状态只读视图。
3. 工作台能编辑 Post(含状态、封面)、Gallery(`album.yaml`)、Site 设置,写入前有 diff,默认不覆盖。
4. 工作台能运行检查、dry-run 和真实 Publish,展示 Workflow 返回的真实结果,不伪造进度或把校验通过当作发布成功。
5. 工作台可只读查看评论,不提供评论写操作;不可用状态与零条评论可区分。
6. 本机访问与路径边界、生产构建隔离的测试通过;现有 CLI/TUI 行为不变,且调用同一套 Publish Workflow。
7. README 与实际启动方式、命令和 Dashboard 角色一致。

## 十一、已确认的决策

| 议题 | 决定 |
|---|---|
| 站点设置 | 纳入 Git 真相,新增 `site` 内容域 |
| 线上 Publish | 移除;线上 Dashboard 对内容只读 |
| 实时进度 | 延后;MVP 以最终结果与轮询为主 |
| 评论 | 工作台只读查看,管理写操作留在线上 Dashboard |
| 本地服务 | 独立 Bun 进程(`bun run workbench`),只在本机运行,不放进 Next 路由 |
| 站点头像 | 源文件放 `content/site/portraitImage/`,Publish 上传 Cloudinary |
| 线上文章删除 | 不保留;下线通过本地 `status` + Publish |
| 多来源、Git 写操作 | 延后 |

## 十二、仍需在阶段 0 确认

1. `src/lib` 中哪些模块依赖 Next 专属 API,需要拆出纯逻辑才能被 Bun 服务复用。
2. source missing 选 2.4 的方案 1 还是 2;Gallery 线上删除是否同口径移除。
3. Dashboard 页面的最终命名与导航(例如把 `sync` 改为"发布状态"、Settings 改为"站点信息(只读)")。
