# 🛠️ 运维与内容管理脚本指南 (Scripts)

本目录包含用于管理个人 Blog 内容校验、单向 publish、媒体处理、数据库运维及管理员凭据找回的专用脚本工具，均基于 **Bun + Drizzle ORM + Better-Auth** 编写。Git 内容源是唯一人工内容源；禁止新增数据库回写、merge 或新的双向同步入口。保持工具少而清晰优先于建设复杂运维平台。

---

## 📋 脚本清单与功能概览

| 脚本文件 | 推荐调用命令 | 说明 |
| :--- | :--- | :--- |
| **`publish.ts`** | `bun run publish` | 单向读取 Post/Gallery 内容并发布到运行时副本；未指定 scope 时默认执行 `all` |
| **`publish-tui.ts`** | `bun run publish:tui` | 推荐的交互式入口；执行内容检查、修复确认、Git diff、dry-run 和真实发布确认 |
| **`check-content.ts`** | `bun run content:check` | 检查并标准化本地 Markdown 文件的 Frontmatter 元数据 |
| **`format-content.ts`** | `bun run content:format` | 预览或写入白名单 Frontmatter/YAML 格式，不修改 Markdown 正文 |
| **`prepare-media.ts`** | `bun run content:prepare-media` | 将 Gallery 原始输入转换为 Git 管理的 WebP |
| **`gallery-index.ts`** | `bun run gallery:index` | 生成自动维护的 `gallery.yaml` |
| **`verify-content.ts`** | `bun run content:verify` | 串联内容检查、格式预览、索引预览、双域 dry-run 和 Git diff 检查 |
| **`init-content.ts`** | `bun run content:init` | 生成内容目录、模板和用户说明（默认不覆盖已有文件） |
| **`reset-admin-password.ts`** | `bun run reset-admin-password` | 服务端安全重置管理员密码（免邮件系统的自救方案） |
| **`reset-db.ts`** | `bun run db:reset` | 级联清空数据库所有业务表与会话数据（谨慎使用） |
| **`media-cleanup.ts`** | `bun run media:audit` / `bun run media:cleanup` | 审计并在显式确认后清理未被当前数据库引用的 `myblog/` Cloudinary 图片资产 |

---

## 📖 详细使用说明

### 1. `publish.ts` - 单向内容发布
正式发布入口会先检查 Git 工作区中的 Markdown、`album.yaml` 和处理后的 WebP，再将结果写入 PostgreSQL 运行时副本和 Cloudinary 媒体 CDN。缺失 Frontmatter、album 配置或 WebP 时会停止并给出显式修复命令；dry-run 不写入工作区、数据库、Cloudinary 或运行记录。解析失败、媒体上传失败和数据库写入失败都会进入发布摘要，不能被静默视为成功。它支持 `posts`、`galleries`、`all` 三种 scope，不执行数据库到文件的回写、merge、自动 commit 或 push。

```bash
# 预览全站发布，不写入文件、数据库、Cloudinary 或运行记录
bun run publish -- --scope all --dry-run --json

# 发布单个内容域
bun run publish -- --scope posts
bun run publish -- --scope galleries

# 查看交互式维护工具帮助
bun run publish:tui -- --help
```

真实 Cloudinary 上传要求同时配置 `CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY` 和 `CLOUDINARY_API_SECRET`。部署者使用自己的 Cloudinary 账号；系统不会回退到项目作者的账号。缺少配置时，正式 Publish 会报告媒体错误，dry-run 保留本地图片路径。

### 2. `publish-tui.ts` - 交互式发布维护

日常推荐直接启动 TUI，由它引导检查、dry-run 和真实发布确认：

```bash
bun run publish:tui
```

TUI 只负责引导，不拥有独立的发布、数据库或媒体实现；它与 CLI 复用同一个 `runPublishWorkflow()`。如果需要调试或只处理单个内容域，可以显式传参：

```bash
bun run publish:tui -- --scope posts
bun run publish:tui -- --scope galleries --dry-run
bun run publish:tui -- --help
```

`--` 是 Bun 将参数传给项目脚本的分隔符。非交互式终端中应使用 `bun run publish` 或 `package.json` 中已配置的快捷 script。不要使用 `bun publish:tui`。

### 3. `media-cleanup.ts` - Cloudinary 资产审计与清理

```bash
# 只读扫描，生成被 .gitignore 忽略的 manifest
bun run media:audit

# 使用 manifest，重新检查数据库和 Cloudinary 后显式删除未引用资产
bun run media:cleanup -- --manifest media-cleanup-manifest.json --confirm
```

脚本只处理 Cloudinary `myblog/` 根目录下的图片资源，删除前会重新确认当前数据库没有引用；不会使用按前缀全量删除，也不会触碰 `myblog/` 之外的资产。

### 4. `check-content.ts` - 内容格式检查与自动修复
自动扫描所有 Markdown 文章，验证必要字段（`title`, `slug`, `date`, `tags`, `status`）及本地图片路径的有效性。

```bash
# 1. 快速检查全量文件
bun run content:check

# 2. 自动格式化并补齐标准 Frontmatter
bun run content:fix
```

### 5. `init-content.ts` - 生成内容目录模板

为新项目或新的内容目录生成可直接使用的模板：

```bash
# 在项目默认的 content/ 目录生成模板
bun run content:init

# 预览将要生成的文件，不修改任何内容
bun run content:init -- --dry-run

# 生成到指定目录，适合初始化新的内容仓库
bun run content:init -- --dir ./my-content

# 明确覆盖脚本管理的模板文件（不会覆盖文章和图片）
bun run content:init -- --force
```

脚本会生成 `README.md`、`templates/post.md`、`templates/album.yaml`、`photo-gallery/gallery.yaml`、示例相册配置以及必要的目录占位文件。已有文件默认跳过。Post 和 Gallery 由统一 `publish` service 按 scope 执行；旧 sync 入口不属于正式内容流程。

### 6. `format-content.ts` / `verify-content.ts` - 提交前流水线

```bash
# 默认只预览格式变化
bun run content:format

# 明确确认后才写入 Frontmatter/YAML 结构
bun run content:format -- --write

# 运行完整验证：检查、索引预览、Post/Gallery/ALL dry-run、git diff --check
bun run content:verify

```

格式化器只处理 Markdown Frontmatter 和 `album.yaml` 的 YAML 结构，不修改正文语义，也不手工编辑或生成 `gallery.yaml`。验证流程会拒绝被 Git 跟踪的 `content/.gallery-input/` 原始图片，以及放入 Gallery 目录的 JPEG、PNG、TIFF、BMP 或 RAW 文件。

---

### 7. Gallery 媒体处理与发布

Gallery 原始输入默认读取 `content/.gallery-input/`，通过 `content:prepare-media` 生成 Git 管理的 WebP；索引通过 `gallery:index` 生成，数据库和 Cloudinary 发布统一由 `bun run publish -- --scope galleries` 完成。当前版本不直接解码 RAW 格式；请先转换为 JPEG、PNG 或 TIFF。媒体准备、Gallery 发布和 Post 发布分别位于 `src/lib/gallery` 与 `src/lib/publish`，不再由旧 Sync Service 承担。

---

### 8. `reset-admin-password.ts` - 管理员密码重置 (CLI)
针对免邮件系统设计的管理员自救方案。直接使用 `better-auth/crypto` 安全哈希密码，更新指定管理员凭据并清空历史 Session 强制重新登录。

```bash
# 交互式引导重置
bun run reset-admin-password

# 指定参数直接重置
bun run reset-admin-password --email admin@example.com --password myNewSecurePassword123
```

---

### 9. `reset-db.ts` - 数据库数据重置
使用 `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` 清空当前 schema 的全部运行时表，包括 Post、Gallery、GalleryImage、评论、站点设置、Snapshot、SyncRun/SyncLog 和认证数据。不会删除表结构、Drizzle migration journal、`content/` 或 Cloudinary 资源。

该命令是破坏性操作，生产环境必须同时提供目标确认参数和交互确认：

```bash
# 交互式生产重置
bun run db:reset -- --confirm-production-reset

# 自动化环境：跳过交互，但仍必须显式声明生产重置
bun run db:reset -- --confirm-production-reset --force
```

`reset-db` 只清空数据，不执行 migration、不修改 schema、不删除 migration journal，也不读取开发 baseline。重置不会恢复用户、评论或 Cloudinary 原始媒体。重置后运行 `bun run publish -- --scope all --no-delete` 从 Git 内容源重建运行时内容。

Migration 压缩已经作为独立的 Stage 12 baseline 提交完成。后续 schema 变更应从 `0000_stage12_baseline.sql` 继续生成新的 migration；不要把 migration 压缩逻辑放入 `reset-db`。

---

## 📝 Markdown Frontmatter 字段规范

所有存放在 `content/posts/` 下的 Markdown 文件应遵循以下 YAML Frontmatter 格式：

```yaml
---
title: "深入理解 Next.js 16 架构"
slug: "nextjs-16-deep-dive" # 可选，缺省时自动根据文件名转换拼音/英文字符串
date: "2026-09-08"
tags: ["Next.js", "React", "TypeScript"] # 标签数组或逗号分隔字符串
status: "published" # published | draft | archived
excerpt: "本文深入探讨 Next.js 16 全新特性与最佳实践" # 推荐填写
image: "./images/cover.png" # 封面图本地相对路径（同步时自动转为 CDN 链接）
sourceUrl: "https://github.com/your-name/repo" # 可选的项目开源地址
---

这里是文章正文内容...
```
