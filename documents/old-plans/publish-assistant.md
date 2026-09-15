# Publish Assistant：交互式本地发布引导设计

> 状态：设计中，待分阶段实施。
>
> 本文定义本地 Publish Assistant（TUI）的目标、边界、用户流程、内部接口、实施顺序和验收标准。它是 [`architecture-reduction.md`](./architecture-reduction.md) 与 [`architecture-reduction-implementation-plan.md`](./architecture-reduction-implementation-plan.md) 的补充设计，不改变 Git-first 单向发布决策。

## 1. 背景与目标

当前内容发布流程包含多个显式命令：

```text
content:check
content:format
content:prepare-media
content:check -- --scope galleries --fix
gallery:index
publish
git diff / git diff --check
```

这些命令需要按照内容问题选择和重复执行。Publish Assistant 的目标是提供一个本地、交互式、可退出的终端引导界面，让维护者可以：

- 选择 `posts`、`galleries` 或 `all` scope；
- 执行只读内容检查并查看结构化问题；
- 根据问题进入正确的显式修复命令；
- 在修复后自动重新检查；
- 查看 Git 工作区摘要和待提交 diff；
- 先执行 dry-run，再明确确认真实 publish；
- 清楚区分本地内容变更、数据库写入和 Cloudinary 上传。

目标不是创建另一套发布系统，而是降低现有 Git-first 流程的操作门槛。

推荐命令：

```bash
bun run publish:tui
```

## 2. 非目标

Publish Assistant 不得：

1. 成为新的内容编辑器；
2. 修改 Markdown 正文或代替用户确认 Frontmatter；
3. 从 PostgreSQL、Cloudinary 或 Snapshot 生成 Markdown/YAML；
4. 自动执行 Git commit、push、revert 或 checkout；
5. 绕过 `content:check` 直接 publish；
6. 隐式执行媒体准备、Frontmatter 写入、内容结构重建或 Gallery 索引写入；
7. 恢复 `sync`、`pull`、`patch`、`write-back`、merge 或 retry 入口；
8. 调用 GitHub Actions；
9. 启用或恢复 Snapshot；
10. 在非交互终端中未经明确参数确认执行真实发布。

TUI 只能调用已经批准的本地命令和 publish service。它不拥有独立的数据库写入或媒体上传实现。

## 3. 架构边界

### 3.1 数据流

Publish Assistant 必须保持以下单向数据流：

```text
Git 内容源 / .gallery-input
          ↓
  只读内容检查与问题分类
          ↓
显式修复命令（用户确认后执行）
          ↓
       Git diff 审查
          ↓
       publish dry-run
          ↓
      用户确认真实发布
          ↓
 PostgreSQL / Cloudinary
```

允许 TUI 读取：

- `content/posts/**/*.md`；
- `content/photo-gallery/**/album.yaml`；
- `content/photo-gallery/**/gallery.yaml`；
- `content/photo-gallery/**/images/*.webp`；
- 被 Git 忽略的 `content/.gallery-input/`，仅用于诊断；
- Git status、diff check 和 diff summary；
- publish 返回的运行摘要。

禁止 TUI 读取数据库或 Cloudinary 作为内容检查和修复的元数据来源。真实 publish 阶段由现有单向 publish service 负责运行时写入。

### 3.2 Actions 与 Snapshot 状态

在架构减法验收完成前：

- `.github/workflows/` 不包含可执行 workflow；
- TUI 不调用 GitHub API 或 GitHub Actions；
- Snapshot 页面、Action、service 和 repository 不能被 TUI 调用；
- TUI 必须显示“GitHub Actions 已暂停”和“Snapshot 已停用”的状态信息，避免用户误解发布链路。

### 3.3 CLI、TUI 和 Dashboard 复用

TUI、普通 CLI 和未来允许的 Dashboard 发布触发必须共享同一个 publish service，不应通过互相调用命令行脚本实现：

```text
publish service
    ├── scripts/publish.ts
    ├── scripts/publish-tui.ts
    └── Dashboard publish action（未来如恢复）
```

TUI 负责交互和展示，publish service 负责校验、锁、数据库、媒体和运行摘要。

## 4. 用户流程

### 4.1 启动与环境检查

启动时依次检查：

1. 当前目录是否为项目根目录；
2. `stdin` 和 `stdout` 是否为 TTY；
3. 当前是否存在未处理的上一次 TUI 退出状态；
4. Git 是否可用；
5. 内容目录是否存在；
6. 当前 Actions 是否处于仓库暂停状态；
7. Snapshot 是否处于停用状态。

推荐首页：

```text
╭────────────────────────────────────────────╮
│ zick.me Publish Assistant                  │
│ Git-first · Actions paused · Snapshot off  │
╰────────────────────────────────────────────╯

工作区：Z:/CodeBase/projects.NEXT/zickme-blog
```

如果不是交互式终端，TUI 不应启动全屏界面，也不应自动执行真实 publish：

```text
当前环境不是交互式终端。
请使用 bun run publish，或在真实终端中运行 bun run publish:tui。
```

### 4.2 Scope 选择

默认 scope 为 `all`。用户可以选择：

```text
❯ All      检查并发布 Posts 与 Galleries
  Posts    只处理 content/posts
  Galleries 只处理 Gallery 内容和媒体
```

TUI 内部统一使用小写显示和大写服务类型之间的明确映射，不能出现新的 scope 名称。

### 4.3 工作区检查

选择 scope 后，TUI 执行只读检查并显示阶段状态：

```text
✓ 检查 Posts Frontmatter
✓ 检查 Gallery album.yaml
✗ 检查 Gallery 图片路径
! 扫描 .gallery-input 原始图片
✓ 检查 gallery.yaml
```

`all` 必须先完成 Posts 和 Galleries 两个域的检查。任一域失败时，不得执行任何数据库或 Cloudinary 写入。

### 4.4 问题展示与修复引导

每个问题至少包含：

- scope；
- 文件或目录路径；
- 稳定错误 code；
- 人类可读说明；
- 影响字段或图片；
- 建议命令；
- 是否允许 TUI 代为执行；
- 是否需要用户编辑和确认。

示例：

```text
[galleries] content/.gallery-input/travel/IMG_001.JPG
MEDIA_PREPARATION_REQUIRED
原始图片尚未转换为 Git 管理的 WebP。

建议命令：
  bun run content:prepare-media -- --album travel

该命令会写入 content/photo-gallery/travel/images/。
写入后必须检查 git diff，并确认 album.yaml。

❯ 执行命令
  复制命令并返回
  跳过此问题
```

问题修复后，TUI 必须重新执行检查，不能假设命令成功就直接进入 publish。

### 4.5 显式修复命令

TUI 可以引导或经用户确认执行以下命令：

| 问题类型 | 命令 | TUI 行为 |
| --- | --- | --- |
| Frontmatter 缺失或格式异常 | `bun run content:format -- --scope posts --write` | 执行前警告会写 Markdown Frontmatter；执行后要求用户审查 |
| 原始图片未处理 | `bun run content:prepare-media -- --album <album>` | 执行前显示输入/输出目录；不修改原图输入目录 |
| 缺失 `album.yaml` | `bun run content:check -- --scope galleries --fix --no-examples` | 生成后要求用户编辑确认 |
| 缺失或过期 `gallery.yaml` | `bun run gallery:index` | 显示这是自动生成文件，不应手动编辑 |

TUI 不应把“跳过”解释为“问题已解决”。只要检查未通过，就不能进入真实 publish。

### 4.5.1 人工编辑确认与编辑器引导

凡是修复命令生成或修改了需要人工确认的内容源，TUI 必须在命令结束后暂停，明确显示：

- 已生成或修改的文件和目录；
- 文件的项目相对路径；
- 需要用户填写、编辑或检查的字段；
- 建议使用编辑器打开的文件或目录；
- 保存后必须重新执行检查的说明。

修复命令返回成功不代表问题已经解决。TUI 不得自动跳过人工确认，也不得因为命令退出码为 `0` 就直接进入 Git 审查、dry-run 或真实 publish。

对于需要人工编辑的文件，推荐显示明确的暂停页：

```text
┌──────────────────────────────────────────────┐
│ 需要人工确认                                  │
├──────────────────────────────────────────────┤
│ 已生成需要人工编辑的内容。                     │
│                                              │
│ 文件：                                        │
│   content/photo-gallery/travel/album.yaml    │
│                                              │
│ 请使用编辑器打开文件，填写并保存内容。         │
│ 完成后选择“我已完成编辑，重新检查”。           │
└──────────────────────────────────────────────┘

❯ 使用 VS Code 打开文件
  使用 VS Code 打开相册目录
  我已完成编辑，重新检查
  返回问题列表
  退出
```

TUI 可以提供使用 VS Code 打开的快捷选项，例如：

```bash
code --reuse-window "content/photo-gallery/travel/album.yaml"
code --reuse-window "content/photo-gallery/travel"
```

但不能假设 `code` 命令一定存在。编辑器未安装、命令不可用或打开失败时，TUI 必须保留文件路径并提示用户手动使用任意编辑器打开；打开失败不能绕过人工确认。用户只有明确选择“我已完成编辑，重新检查”后，TUI 才能重新执行结构化检查。

不同文件类型的反馈必须区分：

#### Frontmatter

执行 `content:format --write` 后，必须列出每个生成或修改的 Markdown 文件，并提示检查：

```text
✓ 已生成或更新 Post Frontmatter

请使用编辑器打开并检查：
  content/posts/example.md

至少确认以下字段：
  - title
  - slug
  - date
  - tags
  - status
  - image / excerpt（如适用）

Markdown 正文未被修改。
请保存后选择“我已完成编辑，重新检查”。
```

#### `album.yaml`

执行 `content:check -- --scope galleries --fix --no-examples` 生成相册骨架后，必须明确说明 `album.yaml` 是人工内容源，并建议打开文件或相册目录：

```text
✓ 已生成 Gallery 配置骨架

请使用编辑器打开并填写：
  content/photo-gallery/travel/album.yaml

请至少检查或填写：
  - title
  - description
  - cover
  - status
  - 图片顺序
  - 图片标题、description 和 alt 文本

建议查看整个相册目录：
  content/photo-gallery/travel/

完成编辑并保存后，必须重新执行检查。
```

#### `gallery.yaml`

`gallery.yaml` 是自动生成文件，不是人工编辑源。执行 `gallery:index` 后，TUI 应提示查看 Git diff，而不是建议用户手动编辑：

```text
✓ 已重新生成 Gallery 索引

文件：
  content/photo-gallery/gallery.yaml

该文件由 gallery:index 自动生成，通常不需要手动编辑。
请检查 Git diff，确认相册、图片数量和 cover 路径正确：
  git diff -- content/photo-gallery/gallery.yaml
```

#### WebP 输出

执行 `content:prepare-media` 后，TUI 必须显示输出目录和生成文件摘要，并建议用户检查图片是否生成、命名是否正确：

```text
✓ 媒体准备完成

输出目录：
  content/photo-gallery/travel/images/

请确认 WebP 文件已生成，并检查对应的 album.yaml。
完成后选择“我已完成编辑，重新检查”。
```

统一流程必须保持如下顺序：

```text
执行显式修复命令
        ↓
显示生成/修改的文件、目录和待确认字段
        ↓
建议使用编辑器打开
        ↓
等待用户编辑并保存
        ↓
用户明确选择“重新检查”
        ↓
结构化 validation
        ↓
检查通过后才能进入 Git diff、dry-run 和真实 publish
```

### 4.6 Git 审查

检查通过后，TUI 显示：

```text
Git 工作区摘要
  M content/posts/example.md
  M content/photo-gallery/travel/album.yaml
  M content/photo-gallery/gallery.yaml
  ?? content/photo-gallery/travel/images/IMG_001.webp

建议审查：
  git diff --check
  git diff -- content/posts content/photo-gallery
```

TUI 可以执行只读的 `git status --short`、`git diff --check` 和 diff stat，但不得自动 stage、commit 或 push。

### 4.7 Publish dry-run

真实 publish 前必须先执行对应 scope 的 dry-run：

```bash
bun run publish -- --scope all --dry-run --json
```

TUI 展示：

- Post 数量和处理结果；
- Gallery 相册和图片数量；
- skipped、unsupported、error 摘要；
- dry-run 不写文件、不连接生产写入路径、不上传 Cloudinary、不创建生产运行记录的确认信息。

dry-run 失败时回到问题列表，不进入真实发布确认。

### 4.8 真实发布确认

确认页必须明确显示副作用：

```text
即将执行真实 publish

scope                    all
读取 Git 内容源           是
修改 Markdown/YAML/WebP   否
写入 PostgreSQL           是
上传 Cloudinary           可能
执行 Git commit/push      否
调用 GitHub Actions       否
使用 Snapshot             否

确认执行真实 publish？ [y/N]
```

默认选项必须是“不执行”。用户没有明确输入确认时，TUI 退出或返回菜单，不得继续。

### 4.9 发布结果

成功时显示：

```text
✓ publish 完成

Posts      10/10 succeeded
Galleries  3 albums, 6 images
Cloudinary 6 uploaded, 0 errors
Database   updated

内容源未被修改。请按需要审查并提交 Git diff。
```

失败时显示：

- 稳定错误 code；
- scope；
- 失败文件或媒体；
- 是否已经发生数据库或 Cloudinary 副作用；
- 是否可以安全重新运行；
- 建议的下一步。

TUI 不提供实体级 retry。重新执行必须由用户从完整 publish 流程重新开始。

## 5. 结构化报告模型

TUI 不应依赖解析中文终端日志。实施时应先将检查能力提取为可复用的结构化函数。

建议模型：

```ts
type PublishScope = 'posts' | 'galleries' | 'all'

type ContentIssueCode =
  | 'CONTENT_INVALID'
  | 'FRONTMATTER_REBUILD_REQUIRED'
  | 'MEDIA_PREPARATION_REQUIRED'
  | 'ALBUM_REBUILD_REQUIRED'
  | 'GALLERY_INDEX_REQUIRED'
  | 'MEDIA_INVALID'

type ContentIssue = {
  scope: 'posts' | 'galleries'
  code: ContentIssueCode
  filePath: string
  message: string
  field?: string
  mediaPath?: string
  suggestedCommand?: string
  canExecuteFromTui: boolean
  requiresManualReview: boolean
  repairReviewMode?: RepairReviewMode
  generatedPaths?: string[]
  generatedDirectories?: string[]
  reviewFields?: string[]
}

type RepairReviewMode =
  | 'none'
  | 'inspect-generated-file'
  | 'inspect-generated-directory'
  | 'review-git-diff'

type ValidationReport = {
  scope: PublishScope
  valid: boolean
  issues: ContentIssue[]
  warnings: string[]
  checkedFiles: number
  checkedAlbums: number
  checkedImages: number
}
```

建议目录结构：

```text
src/lib/publish/
├── publish-types.ts
├── publish-validation.ts
├── publish-workflow.ts
├── publish-summary.ts
└── publish-lock.ts

scripts/
└── publish-tui.ts
```

职责建议：

- `publish-types.ts`：scope、issue、report 和 summary 类型；
- `publish-validation.ts`：纯读取检查，不写文件、不连接数据库；
- `publish-workflow.ts`：检查、dry-run、真实 publish 的统一编排；
- `publish-summary.ts`：文本、JSON、TUI 展示所需的摘要转换；
- `publish-lock.ts`：仅真实 publish 使用的发布锁；dry-run 不获取锁；
- `publish-tui.ts`：键盘输入、菜单、确认、进度和错误展示。

普通 CLI、TUI 和 `content:verify` 应复用相同的 validation 和 publish service，而不是互相 spawn 并解析输出。

## 6. 命令接口

建议在 `package.json` 中增加：

```json
{
  "publish:tui": "bun run scripts/publish-tui.ts"
}
```

支持的调用方式：

```bash
bun run publish:tui
bun run publish:tui -- --scope posts
bun run publish:tui -- --scope galleries
bun run publish:tui -- --scope all
bun run publish:tui -- --dry-run
```

规则：

- 不指定 scope 时默认为 `all`；
- `--dry-run` 可以跳过真实发布确认，只执行检查和预览；
- TUI 不接受 `--json`，机器消费使用普通 `publish --json`；
- 非 TTY 环境拒绝启动交互界面；
- 不新增 `sync`、`pull`、`patch`、`write-back` 或其他含义模糊的别名；
- TUI 不能通过环境变量启用旧逻辑。

## 7. 技术选型

第一阶段优先使用 Bun/Node 原生终端能力：

- `process.stdin`；
- `process.stdout`；
- `process.stdin.setRawMode(true)`；
- `readline`；
- ANSI 光标、清屏、颜色和尺寸控制序列。

当前项目没有 `ink`、`blessed`、`@clack/prompts` 或其他 TUI 依赖。第一阶段不建议引入 React-based TUI 或大型终端框架，原因是：

- 不增加第三方依赖和维护成本；
- TUI 不是业务逻辑层；
- 原生终端能力足以实现菜单、上下移动、Enter、Escape、确认和滚动摘要；
- 更符合架构减法的低耦合目标。

第一阶段的重点不是追求复杂视觉效果，而是确保提示和反馈清晰、明确、可执行，尤其是生成 Frontmatter、`album.yaml` 或 WebP 后，必须引导用户打开并审查对应文件或目录。

如果后续需要复杂布局、鼠标操作或多窗格日志，再单独评估轻量依赖，并先确认不会改变 CLI 和 publish service 边界。只有在以下条件全部满足时，才允许引入额外 TUI 依赖：

1. `publish-validation` 已经输出结构化问题；
2. `publish-workflow` 已经与 CLI 和 TUI 解耦；
3. 原生 TUI 已完成最小工作流；
4. 已确认原生实现造成实际维护或可用性问题，而不是单纯追求视觉效果；
5. 新依赖只负责交互展示，不实现内容检查、修复命令、数据库写入或 Cloudinary 上传；
6. 已验证 Bun、Windows Terminal 和 VS Code 集成终端兼容性。

如只需要更好的 select、confirm 和 spinner，可单独评估轻量 prompt 库；不应因此引入 React-based TUI 或完整多窗格终端框架。

### 7.1 结构化输出约束

普通 CLI 的 `--json` 模式必须输出合法、可直接解析的 JSON：

- stdout 只能输出 JSON 内容；
- 人类可读提示、进度和诊断信息输出到 stderr；
- TUI 优先直接调用 publish service，不通过解析中文日志复用功能；
- TUI 执行修复命令时使用固定命令白名单和参数数组，不拼接任意 shell 字符串，也不启用 `shell: true`。

## 8. 分阶段实施计划

### 阶段 0：设计和边界冻结

- 将本文作为 Publish Assistant 设计基线；
- 确认 TUI 不恢复 Actions、Snapshot 或旧同步入口；
- 确认 TUI 不直接实现数据库、Cloudinary 或文件写入；
- 确认普通 CLI 仍然可以独立运行。

验收：文档、AGENTS 和架构减法实施计划之间不存在相互矛盾的发布语义。

### 阶段 1：结构化内容检查

- 从 `check-content.ts` 提取 `publish-validation.ts`；
- 增加 `posts`、`galleries`、`all` 的严格 scope 行为；
- 为缺失 Frontmatter、未处理媒体、缺失 album、索引过期等问题定义稳定 code；
- 保留现有 CLI 文本输出；
- 增加纯函数和 fixture 测试。

验收：检查失败可以由程序稳定识别，且不需要解析人类可读日志。

### 阶段 2：最小可用 TUI

- 新增 `scripts/publish-tui.ts`；
- 实现启动检查、scope 菜单、检查进度、问题列表和退出；
- 实现非 TTY 拒绝；
- 不执行自动修复和真实 publish。

验收：用户可以在 TUI 中完成检查、查看建议命令和安全退出。

### 阶段 3：显式修复引导

- 增加命令确认菜单；
- 支持执行 `content:format`、`content:prepare-media`、`content:rebuild` 和 `gallery:index`；
- 每个命令执行后重新检查；
- 显示命令生成或修改的文件、目录和需要人工审查的字段；
- 为 Frontmatter 和 `album.yaml` 提供打开文件或目录的编辑器引导；
- 对 `gallery.yaml` 明确提示查看 Git diff，不提示手动编辑；
- 修复命令成功后暂停，只有用户明确选择重新检查才允许继续。

验收：TUI 不会把未重新检查的问题视为已修复；生成 Frontmatter 或 `album.yaml` 后会提示用户打开并填写文件；编辑器打开失败不会绕过人工确认；TUI 不会自动修改正文或自动提交 Git。

### 阶段 4：dry-run 和真实 publish

- 集成统一 publish service；
- 检查通过后自动建议 dry-run；
- 显示 Git diff 摘要；
- 增加真实 publish 二次确认；
- 展示数据库和 Cloudinary 副作用摘要。

验收：任何内容检查失败、dry-run 失败或确认取消，都不会进入真实 publish。

### 阶段 5：增强与维护

- 支持终端尺寸变化和长日志滚动；
- 支持保存/复制建议命令；
- 优化错误信息和恢复提示；
- 评估是否需要引入轻量 TUI 依赖；
- 不扩展为 Dashboard、远程运维面板或第二套内容编辑器。

## 9. 测试要求

至少增加以下测试：

### 9.1 纯函数测试

- scope 解析只接受 `posts`、`galleries`、`all`；
- issue code 到建议命令的映射稳定；
- `all` scope 任一域失败时报告整体失败；
- 不可自动执行的问题必须标记 `requiresManualReview`；
- 需要人工编辑的修复问题必须包含 `repairReviewMode`、生成路径和待确认字段；
- Frontmatter、`album.yaml`、`gallery.yaml` 和 WebP 分别映射到正确的人工审查行为；
- 确认输入为空、`n` 或 Escape 时均不执行真实 publish。

### 9.2 边界测试

- 非 TTY 环境不会执行真实 publish；
- 内容检查失败不会连接数据库或 Cloudinary；
- TUI 修复命令失败后不会继续发布；
- TUI 修复后必须重新检查；
- Frontmatter 生成后显示具体 Markdown 文件路径和待确认字段；
- `album.yaml` 生成后显示具体文件路径、相册目录和待填写字段；
- 生成 `album.yaml` 后不能直接进入 publish 或 dry-run；
- `gallery.yaml` 生成后提示查看 Git diff，而不是提示手动编辑；
- WebP 生成后显示输出目录并提示检查 `album.yaml`；
- VS Code 命令不可用或打开失败时仍保留人工确认阻断；
- `--dry-run` 不写 Markdown、YAML、WebP；
- TUI 不执行 Git commit、push、stage 或 checkout；
- TUI 不调用 GitHub Actions；
- TUI 不调用 Snapshot；
- publish 前后 Git 内容源 hash 保持不变。

### 9.3 手工验收

在真实终端依次演练：

1. 缺少 Frontmatter；
2. 存在未处理 Gallery 原图；
3. 缺少 `album.yaml`；
4. `gallery.yaml` 过期；
5. Posts 检查通过、Galleries 失败；
6. All scope dry-run 成功；
7. 真实 publish 确认取消；
8. 真实 publish 成功；
9. publish 中途发生数据库或 Cloudinary 错误。

其中第 1 至第 4 项必须额外确认：修复命令完成后，TUI 是否显示了具体文件/目录、待确认字段、编辑器打开建议，并在用户明确选择重新检查前阻止后续流程。

## 10. 验收清单

### 功能

- [ ] 提供 `bun run publish:tui`；
- [ ] 支持 `posts`、`galleries`、`all`；
- [ ] 默认 scope 为 `all`；
- [ ] 能展示结构化检查问题；
- [ ] 能展示建议命令；
- [ ] 能在用户确认后执行显式修复命令；
- [ ] 修复后自动重新检查；
- [ ] 生成 Frontmatter 后提示打开具体 Markdown 文件并检查字段；
- [ ] 生成 `album.yaml` 后提示打开文件或相册目录并填写内容；
- [ ] 生成 WebP 后提示检查输出目录和 `album.yaml`；
- [ ] 生成 `gallery.yaml` 后提示查看 Git diff，不提示手动编辑；
- [ ] 修复后在用户明确确认前保持人工审查暂停状态；
- [ ] 支持 dry-run；
- [ ] 真实 publish 前必须二次确认；
- [ ] 展示发布前后的摘要。

### 内容边界

- [ ] TUI 不修改 Markdown 正文；
- [ ] TUI 不隐式执行格式化、媒体准备或结构重建；
- [ ] TUI 不从数据库或 Cloudinary 生成内容源；
- [ ] TUI 不自动 commit、push、stage 或 checkout；
- [ ] TUI 不提供旧 sync/pull/patch/write-back 能力。

### 安全边界

- [ ] 非 TTY 不执行真实 publish；
- [ ] dry-run 不写文件、数据库、Cloudinary 或运行记录；
- [ ] 检查失败不进入数据库或 Cloudinary 写入；
- [ ] GitHub Actions 保持停用；
- [ ] Snapshot 保持停用；
- [ ] 不通过环境变量恢复旧逻辑。

### 质量验证

```bash
bun run lint
bun run content:check -- --scope all --no-examples
bun run content:verify
bun run test
bunx tsc --noEmit --pretty false
bun run build
git diff --check
```

## 11. 与恢复原则的关系

Publish Assistant 只负责本地发布引导，不改变恢复边界：

| 数据 | 恢复方式 |
| --- | --- |
| Markdown、album.yaml、WebP | Git revert、分支、tag、备份仓库 |
| PostgreSQL 运行时副本 | Neon/数据库备份、`pg_dump` 或受控恢复 |
| Cloudinary 媒体 | Cloudinary 保留策略和仓库外原始图片备份 |
| Snapshot | 当前停用，且从来不是完整站点备份 |

任何未来功能若需要 TUI 同时修改 Git、数据库和 Cloudinary，必须先重新审查是否违反 Git-first 单向发布边界。
