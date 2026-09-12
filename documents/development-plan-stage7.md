# 第七阶段开发计划（Stage 7：Gallery 内容同步与管理闭环）

> 制定日期：2026-09-12  
> 前置阶段：Stage 6 独立 Gallery 内容体系  
> 本阶段定位：在 Stage 6 的本地 Gallery 内容、数据库副本、Cloudinary 和前台路由基础上，补齐 Gallery 管理后台、可恢复同步、冲突保护、回写协议和独立运行文档。

---

## 一、为什么要拆分 Stage 7

Stage 6 主要解决 Gallery 的内容基础和前台展示：

- `album.yaml` 解析和校验；
- `gallery.yaml` 自动索引；
- Gallery/GalleryImage 数据表；
- WebP、hash、尺寸和公开 EXIF；
- Cloudinary 增量上传；
- `/gallery` 与 `/gallery/[slug]`；
- 响应式 Grid、Lightbox、触摸、键盘和隐私展示。

这些能力已经构成了一个可运行的只读 Gallery，但还没有解决“谁可以编辑、编辑后如何回写、两端同时变更怎么办、Forker 如何从零部署”的工程问题。因此 Dashboard 和双向同步不应继续堆在 Stage 6 中，而应作为独立的 Stage 7 实施。

Stage 7 的目标不是重构整个 Blog App 的同步体系，而是让 Gallery 形成可独立运行的内容管理闭环，并为 Stage 8 的 Post/Gallery 同步整合提供清晰、可迁移的协议边界。新 Forker 应能够清楚回答以下 Gallery 相关问题：

1. 哪些文件是人工编辑源？
2. 哪些数据是数据库运行时副本？
3. 哪些文件只属于临时输入，不能提交 Git？
4. 哪条命令负责检查、转换、上传、入库和回写？
5. 同时修改本地文件和 Dashboard 时，系统如何避免覆盖？
6. 新环境如何配置数据库、Cloudinary、管理员和 Gallery 内容目录？
7. Gallery 出错后如何 dry-run、查看日志、恢复和重试？

Post 在本阶段继续使用现有 `sync` / `sync:pull` 流程。Stage 7 可以参考 Post 的现有约定，但不重写 Post 同步、不合并 CLI 入口，也不建立跨 Post/Gallery 的原子同步。两种内容域的最终整合属于 Stage 8。

---

## 二、当前真实代码流和已知问题

### 2.1 当前代码流

```text
content/posts/**/*.md
        ↓
bun run sync
        ↓
PostgreSQL Post / Tag
        ↓
/posts、首页、搜索、Dashboard Posts
```

```text
content/.gallery-input/{album}/*
        ↓ 外部原始输入，不进入 Git
sync:galleries
        ↓ Sharp + EXIF 白名单 + hash
content/photo-gallery/{album}/images/*.webp
        ↓ 同一份 WebP
Cloudinary photo-gallery/{albumSlug}/...
        ↓
PostgreSQL Gallery / GalleryImage
        ↓
/gallery、/gallery/[slug]
```

人工编辑源：

```text
content/photo-gallery/{album}/album.yaml
```

自动生成文件：

```text
content/photo-gallery/gallery.yaml
```

运行时副本：

```text
PostgreSQL Gallery / GalleryImage
```

当前已实现的主要入口：

| 能力 | 当前入口 | 当前状态 |
| :--- | :--- | :--- |
| Post 内容检查 | `bun run content:check` | 已实现 |
| Gallery 内容检查 | `bun run content:check` | 已实现 |
| Gallery 索引 | `bun run gallery:index` | 已实现 |
| Gallery 媒体同步 | `bun run sync:galleries` | 已实现，RAW 输入会报告 unsupported |
| Gallery 查询 | `fetchGalleries()`、`fetchGalleryBySlug()` | 已实现 |
| Gallery 前台 | `/gallery`、`/gallery/[slug]` | 已实现 |
| Gallery EXIF 过滤 | `src/lib/gallery/exif.ts` | 已实现 |
| Gallery Dashboard | `/dashboard/gallery` | 未实现 |
| Gallery ADMIN Actions | `src/lib/actions/gallery-admin.ts` | 未实现 |
| Gallery 双向回写 | `gallery:pull` / patch / ZIP | 未实现 |
| 字段级冲突合并 | merge base / revision | 未实现 |

### 2.2 当前必须在 Stage 7 修复或明确的 Gallery 风险

1. `album.yaml` 的人工字段和数据库字段必须继续保持明确优先级，不能在同步时用数据库旧值覆盖本地新值。
2. 只修改 `album.yaml` 时也必须能够同步，不能强依赖本次存在新的原始图片输入。
3. `gallery.yaml` 不能成为 Dashboard 编辑入口，必须始终由索引命令重新生成。
4. Cloudinary 删除不能由本地删除直接触发，必须经过 `PENDING_DELETE` 和管理员确认。
5. `revision`、`syncVersion`、`contentHash`、`mergeBase` 目前还没有形成完整的冲突协议。
6. 新 Forker 不应被要求理解隐藏的 Gallery 数据库表名、Cloudinary public ID 或内部脚本顺序。
7. Gallery 必须拥有独立日志、错误统计、重试和故障排查说明；与 Post 的日志整合留给 Stage 8。
8. Gallery 相关 README、`content/README.md`、`scripts/README.md` 和 Stage 6 文档中的过时描述必须统一，但不在本阶段重写 Post 同步文档。

---

## 三、Stage 7 的目标与非目标

### 3.1 目标

1. 新增 `/dashboard/gallery`，仅 ADMIN 可访问和写入。
2. 提供 Gallery 相册列表、状态、同步状态、图片数量和错误摘要。
3. 支持相册标题、描述、状态、封面、tags、location、showExif、showLocation 编辑。
4. 支持图片标题、描述、alt、排序、隐藏和待删除状态管理。
5. Dashboard 修改可以生成 `album.yaml` 回写、patch 或 ZIP。
6. CLI 可以安全地将回写结果应用到本地工作区。
7. 使用 `revision` 或 `expectedUpdatedAt` 实现乐观锁。
8. 使用 merge base 进行字段级冲突识别，不整份静默覆盖。
9. Cloudinary 删除必须支持 dry-run 和管理员确认。
10. 为启用 Gallery 的 Forker 提供从环境变量、数据库迁移、管理员初始化到首次同步的完整路径。
11. 定义 Gallery 独立的日志、错误码、同步摘要、重试和故障排查说明。
12. 记录与 Post 的兼容边界和 Stage 8 的整合输入，不在本阶段实施全站同步整合。

### 3.2 非目标

1. 不把 Gallery 写入 `Post` 表。
2. 不在前台调用 Cloudinary Admin API。
3. 不实现在线复杂图片编辑器、裁剪器或 RAW 解码器。
4. 不自动公开 GPS、设备序列号和原始文件路径。
5. 不让 Dashboard 直接修改 `gallery.yaml`。
6. 不用“最后一次写入覆盖全部字段”的方式实现同步。
7. 不把管理员权限扩大到普通 USER。
8. 不为了兼容旧环境而在生产代码中保留多套不可解释的 Gallery 数据源。
9. 不重写 Post 的 `sync`、`sync:pull` 或现有数据库同步逻辑。
10. 不把 `sync` 与 `sync:galleries` 合并为一个入口。
11. 不建立统一的全站 `/dashboard/sync`、跨域事务或全站审计模型。
12. 不要求 Post 在 Stage 7 立即采用 Gallery 的快照表、状态枚举或冲突 UI。

---

## 四、三方同步的正式协议

### 4.1 数据源责任

```text
album.yaml       Gallery 人工字段的内容源
gallery.yaml     自动生成的索引，不是编辑源
PostgreSQL       前台查询和 Dashboard 的运行时副本
Cloudinary       与处理后 WebP 对应的 CDN 媒体存储
content/.gallery-input
                 不进入 Git 的原始输入暂存区
Dashboard        受权限保护的数据库编辑入口和回写生成器
CLI              本地检查、合并、应用 patch 和执行同步
```

### 4.2 字段分类

人工字段：

```text
gallery.title
gallery.description
gallery.cover
gallery.status
metadata.tags
metadata.location
metadata.showExif
metadata.showLocation
image.title
image.description
image.alt
image.sortOrder
image.hidden
```

自动字段：

```text
fileHash
fileSize
width
height
exif
publicId
url
thumbnailUrl
sourceModifiedAt
lastSyncedAt
syncVersion
```

规则：

- 重新处理图片只能更新自动字段；
- 本地 `album.yaml` 中的人工字段不能被图片处理覆盖；
- Dashboard 修改人工字段后必须生成本地回写结果或明确记录为数据库侧变更；
- `gallery.yaml` 永远由索引命令生成；
- Cloudinary URL 不能反向成为人工编辑源。

### 4.3 同步状态

相册和图片统一使用以下逻辑状态：

```text
LOCAL_ONLY       本地存在，数据库没有
REMOTE_ONLY      数据库存在，本地没有
IN_SYNC          本地、数据库和媒体快照一致
CONFLICT         本地和数据库均相对 merge base 发生变化
PENDING_DELETE   本地或 Dashboard 请求删除，等待确认
ARCHIVED         相册已归档，不从前台公开
```

### 4.4 同步决策表

| 本地 | 数据库 | 处理 |
| :--- | :--- | :--- |
| 未变更 | 未变更 | 跳过 |
| 变更 | 未变更 | 接受本地并更新数据库 |
| 未变更 | 变更 | 生成 `album.yaml` patch 或 ZIP |
| 都变更 | 都变更 | 进入 `CONFLICT`，禁止自动覆盖 |
| 本地删除 | 未变更 | 标记 `PENDING_DELETE`，等待确认 |
| Dashboard 删除 | 本地未变更 | 生成本地删除 patch，Cloudinary 删除需确认 |
| 本地和数据库都删除 | 都删除 | 归档记录，保留审计信息 |

比较必须基于上一次成功同步的 merge base，而不是当前两份内容直接比较。

---

## 五、启用 Gallery 的 Forker 搭建流程

### 5.1 最小环境

Forker 首先复制：

```bash
git clone <your-fork-url>
cd zickme-blog
bun install
cp .env.example .env
```

至少配置：

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="随机生成的长密钥"
BETTER_AUTH_URL="http://localhost:3000"
```

需要媒体同步时再配置：

```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
GALLERY_INPUT_DIR="./content/.gallery-input"
```

规则：

- `.env` 永不提交；
- `.env.example` 只能放变量名和示例格式；
- 生产环境使用部署平台 Secret；
- 不要求 Forker 自行理解 Cloudinary Admin API；
- 如果只运行文章博客，Cloudinary Gallery 配置可以暂时为空。

### 5.2 初始化顺序

```bash
bun run db:migrate
bun run content:init
bun run content:check -- --no-examples
bun run sync
bun run dev
```

首次管理员初始化必须有明确的 CLI 或初始化说明：

```bash
bun run reset-admin-password
```

Stage 7 需要补充 Gallery 相关说明：

- 首次管理员创建/升级方式；
- 数据库连接失败提示；
- 迁移已执行检测；
- 空数据库和空内容目录的可运行状态；
- 不允许生产环境使用 `db:reset` 的醒目警告。

Post-only Forker 不要求配置 Cloudinary，也不要求执行 Gallery 同步。Stage 7 只保证 Gallery 配置缺失时，Post 流程仍可独立运行；Post/Gallery 的统一初始化向导和统一同步命令属于 Stage 8。

### 5.3 首次 Gallery 流程

```text
1. 将原始输入放入 content/.gallery-input/{album}/
2. 执行 bun run sync:galleries -- --dry-run
3. 检查 unsupported、errors、slug conflict 和预计文件
4. 执行 bun run sync:galleries
5. 编辑 content/photo-gallery/{album}/album.yaml
6. 再次执行 bun run sync:galleries
7. 执行 bun run gallery:index
8. 执行 bun run content:check -- --no-examples
9. 访问 /gallery 验证发布状态
```

RAW/ORF/CR2 等文件必须在进入同步前由外部工具转换为 JPEG、PNG 或 TIFF。同步脚本不得静默丢弃或伪造 RAW 结果。

---

## 六、Dashboard 实施计划

### 阶段 7.1：Dashboard 路由和权限边界

目标文件：

```text
src/app/dashboard/gallery/page.tsx
src/app/dashboard/gallery/loading.tsx
src/app/dashboard/gallery/error.tsx
src/lib/actions/gallery-admin.ts
```

任务：

1. 所有页面和 Server Action 调用 `requireAdminSession()`；
2. 未登录用户跳转登录；
3. USER 不能读取管理数据或执行同步；
4. 同步错误只显示安全摘要，不泄露数据库 URL、Cloudinary Secret 或完整异常堆栈；
5. 页面提供空状态、同步中状态、冲突状态和错误重试。

### 阶段 7.2：相册和图片管理

支持：

- 相册标题、描述、状态、封面；
- tags、location、showExif、showLocation；
- 图片标题、描述、alt；
- 图片排序和隐藏；
- 添加图片到待处理队列；
- 标记删除和取消删除；
- 查看 fileHash、同步状态、更新时间和错误；
- 查看来源 `sourcePath`，但不暴露服务器绝对路径。

所有保存操作使用：

```text
revision 或 expectedUpdatedAt
```

版本不一致时返回可读冲突，不允许后保存覆盖先保存。

### 阶段 7.3：回写协议

Dashboard 不直接写部署环境的工作区。根据运行环境选择：

```text
可写工作区：生成受保护的 album.yaml 更新
只读/Serverless：生成 patch 或 ZIP 下载
Git 工作流：生成提交内容和变更摘要
```

生成内容必须：

- 只修改对应 `album.yaml`；
- 不改 `gallery.yaml`；
- 保留未知字段和人工注释（如果 YAML 工具支持）；
- 写入前进行路径和字段验证；
- 提供变更前后 diff；
- 发生冲突时不生成可直接覆盖的文件。

### 阶段 7.4：同步中心

Dashboard 应显示独立的 Gallery 同步记录：

```text
startedAt
finishedAt
triggeredBy
dryRun
albums
images
uploaded
skipped
unsupported
archived
errors
conflicts
```

同步必须支持：

- dry-run；
- 手动重试；
- 单相册同步；
- 失败项重试；
- Cloudinary 删除确认；
- 日志脱敏；
- 同步锁，防止并发执行覆盖。

---

## 七、代码库整理计划

### 7.1 目录责任

```text
src/lib/gallery/
  exif.ts                 EXIF 白名单和规范化
  gallery-parser.ts       本地 YAML 和图片目录解析
  gallery-queries.ts      前台只读查询和 DTO 过滤
  gallery-sync-service.ts 本地/数据库/Cloudinary 同步编排
  cloudinary.ts           Gallery Cloudinary 客户端和 public ID
  gallery-conflicts.ts    merge base 和字段级冲突
  gallery-writeback.ts    album.yaml patch/ZIP 生成

src/components/gallery/
  GalleryPostView.tsx     前台相册状态和布局组合
  GalleryGrid.tsx         Grid、主图和缩略图
  GalleryLightbox.tsx     Radix Dialog、键盘和触摸
  GalleryImageInfo.tsx    标题、描述、地点组合
  ExifPanel.tsx           白名单 EXIF 展示
  GalleryCard.tsx         相册列表卡片

src/lib/actions/
  gallery-admin.ts        ADMIN-only Gallery 写操作

scripts/
  check-content.ts         Post + Gallery 内容检查入口
  gallery-index.ts         只生成 gallery.yaml
  sync-galleries.ts        Gallery 媒体和数据库同步入口
  gallery-pull.ts          应用回写 patch/ZIP 前的本地合并
```

### 7.2 禁止的职责混合

- 页面组件不能直接访问 Drizzle；
- `GalleryGrid` 不能解析任意 EXIF JSON；
- `GalleryLightbox` 不能决定相册发布权限；
- `gallery.yaml` 不能作为 Dashboard 编辑源；
- `sync-galleries.ts` 不能复用 Post 的媒体 public ID；
- Post 查询不能通过 `layout === 'gallery'` 读取 Gallery；
- Cloudinary 客户端不能进入前台 bundle；
- Actions 不能绕过 revision 检查。

### 7.3 统一错误和日志

Stage 7 应定义：

```ts
type GallerySyncErrorCode =
  | 'INVALID_ALBUM'
  | 'SLUG_CONFLICT'
  | 'MISSING_IMAGE'
  | 'UNSUPPORTED_INPUT'
  | 'CLOUDINARY_UPLOAD_FAILED'
  | 'DATABASE_WRITE_FAILED'
  | 'REVISION_CONFLICT'
  | 'PENDING_DELETE'
```

CLI 输出适合人阅读的摘要；数据库日志保存结构化统计；生产日志不得输出：

- `DATABASE_URL`；
- Cloudinary Secret；
- 用户密码；
- 原始图片二进制；
- 服务器绝对路径。

---

## 八、Gallery 的 CI、部署和发布流程

### 8.1 Pull Request 检查

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run gallery:index
bun run build
bun run sync:galleries -- --dry-run
```

PR 不执行真实 Cloudinary 删除，不执行生产数据库写入。

### 8.2 部署前检查

```text
1. 确认 DATABASE_URL 指向目标环境
2. 执行 bun run db:migrate
3. 确认 BETTER_AUTH_SECRET 和 BETTER_AUTH_URL
4. 如果启用 Gallery，确认 Cloudinary 三项 Secret
5. 执行 Gallery dry-run
6. 检查 unsupported/errors/conflicts
7. 确认后执行 Gallery 媒体同步
8. 按现有独立流程执行 Post 同步（本阶段不改造）
9. 验证 /gallery、/dashboard/gallery；Post 验证沿用现有流程
```

如果部署脚本暂时串联 Post 和 Gallery 命令，二者仍必须保持独立的退出状态、日志、失败码和统计。Stage 8 才评估统一编排、部分成功策略和全站同步锁。

### 8.3 回滚

回滚优先级：

1. 回滚 Git 中的 `album.yaml`；
2. 重新生成 `gallery.yaml`；
3. 重新执行 dry-run；
4. 确认后同步数据库人工字段；
5. 不自动删除 Cloudinary 资源；
6. 对误删请求使用备份或 Cloudinary 管理恢复；
7. Dashboard 的 patch/ZIP 必须保留生成记录。

---

## 九、Gallery Forker 文档整理任务

Stage 7 必须同步更新以下文档，不能只新增计划而不更新入口：

```text
README.md
content/README.md
scripts/README.md
.env.example
.github/README.md
documents/photo-gallery-design.md
documents/development-plan-stage6.md
```

README 和 Gallery 专题文档应提供 Gallery 最短路径；全站基础启动路径继续沿用现有 README，不在本阶段重写 Post 流程：

```bash
bun install
cp .env.example .env
bun run db:migrate
bun run content:check -- --no-examples
bun run sync
bun run dev
```

Gallery 专门提供：

```bash
bun run gallery:index
bun run sync:galleries -- --dry-run
bun run sync:galleries
```

文档必须明确：

- 哪些内容提交 Git；
- 哪些原始图片只能放在 `.gallery-input`；
- RAW 为什么不会自动处理；
- 为什么要先 dry-run；
- 如何发布相册；
- 如何创建管理员；
- 如何处理 Cloudinary 缺失；
- 如何从空数据库启动；
- 如何确认 Gallery 数据库副本已更新；
- Post-only 环境为什么可以不配置 Cloudinary；
- Stage 7 与 Stage 8 的同步边界。

---

## 十、实施顺序和交付门禁

### 阶段 7.1：同步协议和数据快照

- 增加 `contentHash`、`mergeBase` 或等价快照结构；
- 确定字段级 merge 算法；
- 补充 `CONFLICT`、`PENDING_DELETE`、`REMOTE_ONLY` 测试 fixture；
- 修正 sync summary 和结构化错误码。

### 阶段 7.2：Gallery Admin Actions

- ADMIN session 校验；
- Zod 输入校验；
- revision 乐观锁；
- 相册/图片编辑；
- 同步和 dry-run 触发；
- 变更审计。

### 阶段 7.3：Dashboard Gallery

- 列表、编辑器、图片排序；
- 封面、状态、隐藏、删除确认；
- 错误和冲突 UI；
- patch/ZIP 下载。

### 阶段 7.4：CLI 回写和 CI

- `gallery:pull`；
- patch 应用前检查；
- 冲突停止机制；
- GitHub Actions Gallery dry-run；
- Forker 文档和模板收敛。

### Stage 8 输入清单（本阶段只记录，不实施）

- 比较 Post 与 Gallery 的 `contentHash` 规范化策略；
- 评估是否抽取通用 Snapshot、merge base 和 revision 模型；
- 评估统一 `sync` / `sync:galleries` 的编排入口；
- 评估统一同步锁、重试、审计和 Dashboard 同步中心；
- 评估统一 dry-run 输出、CI 门禁和 Forker 初始化文档。

### 交付门禁

- 没有 ADMIN Session 不能修改 Gallery；
- 没有 revision 确认不能覆盖数据库字段；
- 没有 dry-run 不能执行批量删除；
- 没有 merge base 不能声称支持双向同步；
- 本地和数据库同时变更必须进入 `CONFLICT`；
- `gallery.yaml` 不允许作为编辑源；
- 新 Forker 能按 README 完成空数据库启动；
- Post 流程和 Gallery 流程可以独立运行，Gallery 不依赖 Post 同步成功；
- Stage 7 不声称已经完成 Post/Gallery 全站同步整合；
- 文档命令必须与 `package.json` 和实际脚本一致。

---

## 十一、验收命令

基础质量：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
```

Gallery 内容和同步：

```bash
bun run gallery:index
bun run sync:galleries -- --dry-run
bun run sync:galleries
```

数据库：

```bash
bun run db:migrate
```

浏览器验收：

- 空数据库；
- 空相册；
- published/draft/archived；
- 隐藏图片；
- 只修改 album.yaml；
- 图片 hash 未变化；
- 图片 hash 变化；
- Cloudinary 凭证缺失；
- RAW 输入；
- slug 冲突；
- 本地和 Dashboard 同时修改；
- 移动端和桌面端；
- ADMIN、USER、未登录三种权限。

---

## 十二、风险和后续扩展

1. 大型相册需要分页和有限预加载；
2. Cloudinary 删除需要保留回收站或延迟删除窗口；
3. 三方同步需要审计日志和人工合并界面；
4. 如果未来允许多个部署环境，需要区分数据库和媒体 namespace；
5. 如果支持多人编辑，需要将 revision 扩展为完整变更历史；
6. 如果需要旧 URL 迁移，应增加 Gallery slug history；
7. 如果 Forker 不使用 Cloudinary，应提供本地/其他 CDN provider 抽象，但不能让前台依赖 Cloudinary Admin API。