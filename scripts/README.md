# 🛠️ 运维与内容管理脚本指南 (Scripts)

本目录包含用于管理博客内容校验、兼容期内容同步、媒体处理、数据库运维及管理员凭据找回的专用脚本工具，均基于 **Bun + Drizzle ORM + Better-Auth** 编写。Git 内容源是唯一人工内容源；禁止新增数据库回写、merge 或新的双向同步入口。

---

## 📋 脚本清单与功能概览

| 脚本文件 | 推荐调用命令 | 说明 |
| :--- | :--- | :--- |
| **`publish.ts`** | `bun run publish` | 单向读取 Post/Gallery 内容并发布到运行时副本；未指定 scope 时默认执行 `all` |
| **`check-content.ts`** | `bun run content:check` | 检查并标准化本地 Markdown 文件的 Frontmatter 元数据 |
| **`format-content.ts`** | `bun run content:format` | 预览或写入白名单 Frontmatter/YAML 格式，不修改 Markdown 正文 |
| **`verify-content.ts`** | `bun run content:verify` | 串联内容检查、格式预览、索引预览、双域 dry-run 和 Git diff 检查 |
| **`prepare-content.ts`** | `bun run content:prepare` | 提交前预览流水线，默认不写入、不提交、不推送 |
| **`init-content.ts`** | `bun run content:init` | 生成内容目录、模板和用户说明（默认不覆盖已有文件） |
| **`upload-to-cloudinary.ts`** | `bun run scripts/upload-to-cloudinary.ts` | 批量扫描图片、预转高质量 WebP 并上传至 Cloudinary CDN |
| **`reset-admin-password.ts`** | `bun run reset-admin-password` | 服务端安全重置管理员密码（免邮件系统的自救方案） |
| **`reset-db.ts`** | `bun run db:reset` | 级联清空数据库所有业务表与会话数据（谨慎使用） |

---

## 📖 详细使用说明

### 1. `publish.ts` - 单向内容发布
正式发布入口会先检查并补齐 Post Frontmatter，再读取 Git 工作区中的 Markdown、`album.yaml` 和处理后的 WebP，并将结果写入 PostgreSQL 运行时副本和 Cloudinary 媒体 CDN。正式 publish 可以写入缺失的 Frontmatter，但不会修改正文；dry-run 只预览缺失字段并停止，不写入任何内容。它支持 `posts`、`galleries`、`all` 三种 scope，不执行数据库到文件的回写、merge、自动 commit 或 push。

```bash
# 预览全站发布，不写入文件、数据库、Cloudinary 或 SyncRun
bun run publish -- --scope all --dry-run --json

# 发布单个内容域
bun run publish -- --scope posts
bun run publish -- --scope galleries
```

### 2. `check-content.ts` - 内容格式检查与自动修复
自动扫描所有 Markdown 文章，验证必要字段（`title`, `slug`, `date`, `tags`, `status`）及本地图片路径的有效性。

```bash
# 1. 快速检查全量文件
bun run content:check

# 2. 自动格式化并补齐标准 Frontmatter
bun run content:fix
```

### 3. `init-content.ts` - 生成内容目录模板

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

### 4. `format-content.ts` / `verify-content.ts` / `prepare-content.ts` - 提交前流水线

```bash
# 默认只预览格式变化
bun run content:format

# 明确确认后才写入 Frontmatter/YAML 结构
bun run content:format -- --write

# 运行完整验证：检查、索引预览、Post/Gallery/ALL dry-run、git diff --check
bun run content:verify

# 面向日常提交前操作；不真实同步、不 commit、不 push
bun run content:prepare
```

格式化器只处理 Markdown Frontmatter 和 `album.yaml` 的 YAML 结构，不修改正文语义，也不手工编辑或生成 `gallery.yaml`。验证流程会拒绝被 Git 跟踪的 `content/.gallery-input/` 原始图片，以及放入 Gallery 目录的 JPEG、PNG、TIFF、BMP 或 RAW 文件。

---

### 5. `upload-to-cloudinary.ts` - 图片优化与 CDN 上传
扫描 `content/posts/**/images/` 目录下的所有媒体资源，通过 `sharp` 在内存中自动压缩并转换为高质量 `.webp` 格式（降低上传体积并提升前端加载速度），随后推送至 Cloudinary。

```bash
# 执行图片预转换与上传（需配置 CLOUDINARY 相关环境变量）
bun run scripts/upload-to-cloudinary.ts
```

---

Gallery 媒体处理、索引和数据库发布统一由 `bun run publish -- --scope galleries` 完成。原始输入默认读取 `content/.gallery-input/`，只允许通过 Git 内容变更进入 publish 流程。当前版本不直接解码 RAW 格式；请先转换为 JPEG、PNG 或 TIFF。

---

### 6. `reset-admin-password.ts` - 管理员密码重置 (CLI)
针对免邮件系统设计的管理员自救方案。直接使用 `better-auth/crypto` 安全哈希密码，更新指定管理员凭据并清空历史 Session 强制重新登录。

```bash
# 交互式引导重置
bun run reset-admin-password

# 指定参数直接重置
bun run reset-admin-password --email admin@example.com --password myNewSecurePassword123
```

---

### 6. `reset-db.ts` - 数据库数据重置
使用 `TRUNCATE TABLE ... CASCADE` 一键清空全站数据表（文章、标签、评论、站点设置、用户、会话等）。

```bash
# 交互式提示确认清空
bun run db:reset

# 强制执行清空（跳过确认提示）
bun run scripts/reset-db.ts --force
```

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
