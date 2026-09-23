# 可读性与结构化重构实施计划

> 状态：待实施计划（尚未开始代码重构）  
> 目标：分三条独立工作流逐步降低高复杂度模块的阅读成本，同时保持现有功能、CLI 入口和架构边界不变。

## 总体原则

1. **小步、可回滚**：每个阶段应形成可单独验证的变更；不把多个领域或大规模目录迁移混在一次改动中。
2. **先保行为，再整理结构**：不改变页面交互、Publish 写入结果、内容检查规则或现有脚本参数语义；重构前后使用现有测试和命令验证。
3. **保持项目边界**：Git 仍是唯一人工内容源，Publish 仍是单向流程；dry-run 不得产生文件、数据库或 Cloudinary 副作用。Post 与 Gallery 继续独立。
4. **按职责拆分，不以文件行数为唯一目标**：只有当模块有清晰输入、输出和单一职责时才提取；避免制造只转发调用的薄封装或过度拆分 JSX。
5. **遵循现有工具约定**：使用 Bun、TypeScript、Biome 和 `@/...` 导入别名；不引入新的运行时依赖。

## 工作流一：拆分 Dashboard 文章管理页面

### 现状与目标

目标入口为 [`src/app/dashboard/posts/page.tsx`](../../src/app/dashboard/posts/page.tsx)，目前约 900 行，并同时承担数据加载、筛选/选择状态、文章操作、桌面表格、移动卡片和多个对话框的渲染。

目标是让路由文件成为轻量入口，将状态与交互编排集中在文章管理 Client 组件，把重复/独立的展示区域提取为可理解的子组件。不得改变页面功能、权限检查或 Server Action 行为。

### 目标文件

建议按实际拆分需要新增：

```text
src/app/dashboard/posts/page.tsx                         # 保留路由入口
src/components/dashboard/posts/DashboardPostsClient.tsx  # 页面状态和交互编排
src/components/dashboard/posts/PostsFilters.tsx          # 搜索、状态和标签筛选
src/components/dashboard/posts/PostsBulkActions.tsx      # 批量选择后的操作条
src/components/dashboard/posts/PostsTable.tsx            # 桌面端文章表格
src/components/dashboard/posts/PostsMobileList.tsx      # 移动端文章卡片与操作
src/components/dashboard/posts/PostPreviewDialog.tsx    # 文章预览
src/components/dashboard/posts/PostPosterDialog.tsx     # 封面编辑/上传
src/components/dashboard/posts/PostDeleteDialog.tsx     # 永久删除确认
src/components/dashboard/posts/constants.ts              # 状态徽章配置（若被多组件复用）
```

文件名可根据最后确定的组件边界微调；如果两个弹窗共享状态或代码很少，可以保留在一个文件中，不要求每个 UI 区域都单独建文件。

### 实施阶段

1. **建立行为基线**：记录现有筛选、搜索提交、全选/单选、批量改状态、状态即时更新、归档/恢复、永久删除、封面 URL/文件上传与移除、预览及移动端操作。确认数据来自 `@/lib/actions/posts-admin`，本次不改 Server Actions。
2. **抽离静态配置和纯展示**：先提取状态 Badge 配置，以及 Props 清晰的筛选栏、批量操作条等低耦合组件。保留原有状态和事件由父级传入，避免子组件自行加载数据。
3. **拆分文章列表呈现**：将桌面表格与移动端列表分离，统一传入文章数据、选中 ID、pending 状态和回调。避免复制状态更新逻辑；操作行为继续由页面编排层提供。
4. **集中对话框边界**：分别提取预览、封面编辑和永久删除确认 UI。封面上传/更新与删除确认仍调用原有 action；明确成功、失败和关闭时的状态清理行为。
5. **整理状态编排并收薄路由**：将数据加载、筛选条件、选中项和 Server Action 调用集中在 `DashboardPostsClient`。仅当状态逻辑在该阶段变得清楚且可独立复用时，再提取 hook；否则保留在 Client 组件，避免过早抽象。路由页负责渲染该入口组件。
6. **回归检查与清理**：核对桌面/移动端行为、错误提示、加载态和空状态；移除失效导入与临时重复代码。

### 验收标准

- 页面路由、访问路径与 ADMIN 权限行为不变。
- 搜索、状态/标签筛选、刷新、批量选择/更新、归档/恢复、封面管理、预览、删除功能保持一致。
- 桌面表格与移动卡片均使用同一组状态和 action 回调；没有新增重复的业务规则。
- 不改变 Server Action、数据库查询或内容源边界。
- 运行 `bun run lint`、`bun run build`；如本次新增/调整可测试的状态或纯逻辑，补充针对性测试并运行相关测试。

## 工作流二：整理 Post 与 Gallery Publish 服务职责

### 现状与目标

当前 Post 发布逻辑集中在 [`src/lib/publish/post-publish-service.ts`](../../src/lib/publish/post-publish-service.ts)：目录扫描、Markdown/Frontmatter 解析、媒体解析/上传、数据库写入和流程结果处理均位于同一服务中。Gallery 发布逻辑集中在 [`src/lib/publish/gallery-publish-service.ts`](../../src/lib/publish/gallery-publish-service.ts)：输入扫描、album 配置读取、图片准备/上传、Gallery 与图片持久化、旧数据检查和摘要汇总交织在一起。

目标是建立“领域服务编排流程，职责模块处理单一步骤”的结构，同时保留现有导出接口和调用方，确保 Post 与 Gallery 各自独立。首轮只做模块拆分，不借机重命名 Sync 类型、改数据库表或改变发布协议。

### 目标文件

现有核心文件继续保留为入口/协调层，并按分析结果逐步新增：

```text
src/lib/publish/post-publish-service.ts       # 保留 PostPublishService 公共入口并编排步骤
src/lib/publish/post-source-reader.ts          # Markdown 文件扫描、源文件读取/解析（视耦合度决定）
src/lib/publish/post-media-resolver.ts         # 本地/虚拟图片解析、上传协调与 Markdown 图片替换
src/lib/publish/post-repository.ts              # Post、Tag、postsToTags 的数据库持久化
src/lib/publish/gallery-publish-service.ts     # 保留 publishGallery 公共入口并编排步骤
src/lib/publish/gallery-input-reader.ts         # 输入目录、album.yaml 配置及图片列表读取
src/lib/publish/gallery-album-publisher.ts    # 单个相册的图片准备和发布步骤（仅在流程边界清楚时提取）
src/lib/publish/gallery-repository.ts           # Gallery/图片的持久化、元数据更新及缺失源检查
```

以上是候选目标，不要求一次性创建全部文件。优先按现有 `src/lib/publish/media-upload.ts` 等模块的边界复用，避免重复实现媒体策略。

### 实施阶段

1. **画清调用与副作用清单**：梳理 `PostPublishService.runPublish/runSync`、`publishGallery` 的调用方和返回值；标记读文件、写文件、数据库、Cloudinary、日志各自发生位置。核实 dry-run 路径必须保持只读，不连接数据库、不写本地文件、不上传媒体。
2. **抽离可独立验证的 Post 图片逻辑**：先分离图片路径解析/Markdown 替换与上传调用，维持原有 dry-run、虚拟图片映射、本地文件回退和失败日志语义。`PostPublishService` 继续管理日志和公共方法，必要时通过回调传递日志能力。
3. **抽离 Post 数据库持久化**：将标签 upsert、文章 upsert、来源路径 slug 冲突保护及文章-标签关系更新迁入 Repository。服务层仍负责组织解析结果、 dry-run 行为及结果汇总；不能削弱冲突保护或部分失败记录。
4. **评估 Post 源读取/解析拆分**：只有当解析步骤能用明确输入/输出表达、不会绕开统一日志语义时，才将递归扫描与 Frontmatter 转换迁入 reader/parser 模块。稳定 `MarkdownFrontmatter`、`ProcessedPost` 和现有公共导出。
5. **先抽离 Gallery 读取边界**：将输入文件枚举和 `album.yaml` 读取/缺省配置处理迁入输入 reader，保持排序、扩展名支持、缺少配置时的 skeleton 行为不变。
6. **再拆 Gallery 单相册发布及持久化**：在不改变处理顺序的前提下拆分图片准备/不变检测/上传与数据库写入。将多处数据库写入及 album-only metadata 更新集中到 Repository；文件生成仍须写入 Git 管理的 Gallery 工作区，且只在真实运行中发生。
7. **保留门面和兼容导出**：现有 `PostPublishService`、`publishGallery`、`GallerySyncOptions`、`GallerySyncSummary` 及旧调用方短期不变；新模块由门面内部调用。是否后续清理历史命名作为单独任务，不纳入本计划。

### 验收标准

- Post/Gallery 发布范围、摘要、日志、错误统计、slug/source 冲突保护和缺失源行为不变。
- `dry-run` 不新增文件/数据库/Cloudinary 副作用；真实 Publish 仍复用现有统一工作流和保护机制。
- Post 与 Gallery 没有合并成通用“大服务”，两者媒体策略仍分别清晰。
- 新模块不引入重复的 schema、Frontmatter 规则或 Cloudinary 策略。
- 增加或更新针对提取逻辑的纯函数/边界测试；运行相关 Publish 测试、`bun run lint`、`bun run build`。涉及内容源/发布流程时另运行 `bun run content:check -- --no-examples`、`bun run content:verify`、`bunx tsc --noEmit --pretty false` 及 `bun run publish -- --scope all --dry-run --json`，并确认 dry-run 无副作用。

## 工作流三：收敛内容检查与修复脚本职责

### 现状与目标

[`scripts/check-content.ts`](../../scripts/check-content.ts) 同时承载 Post 校验、slug 冲突分析、Frontmatter 标准化、可选写入修复、Gallery 校验/自动补 album 配置、终端输出和命令入口。`package.json` 中 `content:check` 与 `content:fix` 当前都运行这个脚本，分别通过参数控制行为；[`tests/publish-boundaries.test.ts`](../../tests/publish-boundaries.test.ts) 直接导入 `checkContent` 与 `DEFAULT_CONFIG`。

目标是将只读检查与显式写入修复的责任分开，保留现有用户入口和可复用的校验规则。第一阶段不改变规则、不移除 `--fix`，避免脚本使用者和测试调用方受到不兼容影响。

### 目标文件

建议逐步形成以下结构：

```text
scripts/check-content.ts                   # CLI 参数解析、检查编排、输出与退出码
scripts/content/check-posts.ts              # Post 文件扫描和只读校验
scripts/content/check-galleries.ts          # Gallery 只读校验
scripts/content/fix-post-frontmatter.ts     # 显式 Post Frontmatter 修复
scripts/content/fix-gallery-config.ts       # 显式 album.yaml 修复
scripts/content/content-check-types.ts      # 共享配置/结果类型（仅在确有跨文件共享时）
scripts/fix-content.ts                      # 可选的清晰修复 CLI 入口/兼容委托
package.json                                # 逐步明确 content:check 与 content:fix 的目标
```

如果现有测试继续从 `scripts/check-content.ts` 导入函数，可以暂时从该入口 re-export 类型和函数，或在迁移测试时统一改用新模块；不得为了拆分而保留多套实现。

### 实施阶段

1. **明确命令行为基线**：核对 `content:check`、`content:fix`、`--fix`、`--dry-run`、`--no-examples`、`--scope posts|galleries|all` 及当前默认 scope；记录哪些模式会写 Markdown 或 `album.yaml`。检查 `scripts/README.md`、根 README 和测试中的命令描述。
2. **提取只读校验函数**：先分离 Post 扫描/逐文件检查、slug 冲突计算和 Gallery 扫描检查。让这些函数只返回结构化结果，不直接写文件；格式化终端输出仍由入口或报告模块负责。
3. **隔离修复副作用**：将 `generateStandardFrontmatter` 与相应写入迁入 Post 修复模块；将 Gallery skeleton/补齐 images 与 `writeFile` 迁入 Gallery 修复模块。修复函数须接收明确的 `dryRun` 配置，并确保 dry-run 不执行写入。
4. **保留原入口做适配**：`check-content.ts` 继续负责参数解析、按 scope 调用检查器、输出统计并设置退出码。短期保留 `--fix` 兼容模式，将其委托给修复模块，不能让只读 checker 内部暗中写文件。
5. **清晰化 package scripts**：稳定后让 `content:check` 明确只读；`content:fix` 指向修复入口。迁移期可以保留旧 `bun run scripts/check-content.ts --fix` 作为兼容别名，并在脚本 README 中说明。任何移除兼容参数的动作都需另行确认并更新文档。
6. **巩固边界测试**：保留 `tests/publish-boundaries.test.ts` 的 dry-run 不写工作区断言；添加修复模式预期写入、检查模式只读、scope 选择及原正文不变等测试。尽量使用临时 fixtures，确保测试清理副作用。

### 验收标准

- `content:check` 对 Post 与 Gallery 均为只读；修复操作只能经显式 fix 命令/参数触发。
- 兼容期既有参数与输出统计语义不变；scope 行为一致。
- dry-run 只读且有测试覆盖；Frontmatter 修复不改 Markdown 正文，Gallery 修复不覆盖人工维护字段。
- 根 [`README.md`](../../README.md) 和 [`scripts/README.md`](../../scripts/README.md) 中的脚本说明与实际入口同步；不修改 `AGENTS.md`。
- 运行相关内容边界测试、`bun run lint`、`bun run build`、`bun run content:check -- --no-examples`、`bun run content:verify` 和 `bunx tsc --noEmit --pretty false`。

## 建议交付批次

| 批次 | 范围 | 建议顺序 | 主要风险控制 |
|---|---|---:|---|
| A | Dashboard 文章列表展示拆分 | 1 | 以 Props 显式传递状态和回调；核对桌面/移动端与对话框行为 |
| B | Publish 图片与数据库职责拆分 | 2 | 先补副作用边界测试，再移动实现；保持 dry-run 只读 |
| C | 内容检查与修复分离 | 3 | CLI 参数兼容；用临时 fixture 覆盖只读与写入模式 |

三个批次彼此独立，可分开审查和回滚。推荐先完成 A，再分别推进 B、C；B 与 C 涉及发布边界，需优先审查副作用和测试覆盖。
