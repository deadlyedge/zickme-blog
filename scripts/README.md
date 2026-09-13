# 🛠️ 运维与内容管理脚本指南 (Scripts)

本目录包含用于管理博客内容同步、媒体处理、数据库运维及管理员凭据找回的专用脚本工具，均基于 **Bun + Drizzle ORM + Better-Auth** 编写。

---

## 📋 脚本清单与功能概览

| 脚本文件 | 推荐调用命令 | 说明 |
| :--- | :--- | :--- |
| **`sync-content.ts`** | `bun run sync` | 统一同步 Post 与 Gallery；未指定 scope 时默认执行 `all` |
| **`check-content.ts`** | `bun run content:check` | 检查并标准化本地 Markdown 文件的 Frontmatter 元数据 |
| **`init-content.ts`** | `bun run content:init` | 生成内容目录、模板和用户说明（默认不覆盖已有文件） |
| **`upload-to-cloudinary.ts`** | `bun run scripts/upload-to-cloudinary.ts` | 批量扫描图片、预转高质量 WebP 并上传至 Cloudinary CDN |
| **`sync-galleries.ts`** | `bun run sync:galleries` | 将外部 Gallery 原始输入处理为 WebP，并通过统一编排器同步 Cloudinary 与数据库 |
| **`reset-admin-password.ts`** | `bun run reset-admin-password` | 服务端安全重置管理员密码（免邮件系统的自救方案） |
| **`reset-db.ts`** | `bun run db:reset` | 级联清空数据库所有业务表与会话数据（谨慎使用） |

---

## 📖 详细使用说明

### 1. `sync-content.ts` - 文章内容同步
统一入口解析本地 Post 与 Gallery 内容并同步至 Neon PostgreSQL 数据库。Post 支持 Frontmatter 校验、Cloudinary CDN 图片自动映射、标签级联入库与废弃文章软删除；Gallery 负责 album.yaml、处理后的 WebP、EXIF 与相册媒体同步。

```bash
# 1. 默认执行全站同步（等价于 --scope all）
bun run sync

# 2. 预览全站同步并输出机器可读摘要
bun run sync -- --scope all --dry-run --json

# 3. 只同步 Post 或 Gallery
bun run sync -- --scope posts --dry-run
bun run sync -- --scope galleries --dry-run

# 4. 同步 Post 时跳过软删除
bun run sync -- --scope posts --no-delete
```

---

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

脚本会生成 `README.md`、`templates/post.md`、`templates/album.yaml`、`photo-gallery/gallery.yaml`、示例相册配置以及必要的目录占位文件。已有文件默认跳过。Post 和 Gallery 由统一 `sync` 编排器按 scope 执行，`sync:galleries` 仅作为支持额外输入目录的兼容专用入口保留。

---

### 4. `upload-to-cloudinary.ts` - 图片优化与 CDN 上传
扫描 `content/posts/**/images/` 目录下的所有媒体资源，通过 `sharp` 在内存中自动压缩并转换为高质量 `.webp` 格式（降低上传体积并提升前端加载速度），随后推送至 Cloudinary。

```bash
# 执行图片预转换与上传（需配置 CLOUDINARY 相关环境变量）
bun run scripts/upload-to-cloudinary.ts
```

---

### 5. `sync-galleries.ts` - Gallery 图片同步

Gallery 原始输入默认读取 `content/.gallery-input/`，也可以通过 `GALLERY_INPUT_DIR` 覆盖。该目录已被 Git 忽略。同步会读取尺寸和公开 EXIF 白名单，使用最高 `6000×4000`、WebP `quality: 95`、`effort: 6` 的 Gallery 专用参数生成 WebP，然后将同一份内容写入 `content/photo-gallery/` 并上传至独立的 `photo-gallery/{albumSlug}/` Cloudinary folder。

不要同时从 CLI 和 Dashboard 启动同一 scope 的同步。统一入口会写入运行摘要并使用带 TTL 的运行保护；重复触发会直接提示已有同步正在运行，不会排队或覆盖。

```bash
bun run sync:galleries -- --dry-run
bun run sync:galleries -- --input-dir ./private-gallery-input
bun run sync:galleries
```

同步不会把 JPEG、PNG、RAW 等原始输入写入 Git 管理的 Gallery 目录；本地缺失的相册会被标记为数据库中的 `ARCHIVED`，不会自动删除 Cloudinary 资源。

Dashboard 产生的 patch 应先检查再应用：

```bash
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
bun run gallery:pull -- --patch ./gallery-patch.yaml
bun run gallery:index
```

`expectedHash` 不匹配时会停止，避免覆盖本地人工修改；Gallery 删除仅标记 `PENDING_DELETE`，不会自动调用 Cloudinary 删除。

当前版本不直接解码 ORF、RAW、CR2、CR3、NEF、ARW 等 RAW 格式。发现这些文件时会报告为 `unsupported`，不会写入 WebP 或上传。请先将 RAW 转换为 JPEG、PNG 或 TIFF，再重新执行同步。

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
