# 🛠️ 运维与内容管理脚本指南 (Scripts)

本目录包含用于管理博客内容同步、媒体处理、数据库运维及管理员凭据找回的专用脚本工具，均基于 **Bun + Drizzle ORM + Better-Auth** 编写。

---

## 📋 脚本清单与功能概览

| 脚本文件 | 推荐调用命令 | 说明 |
| :--- | :--- | :--- |
| **`sync-content.ts`** | `bun run sync` | 将 `content/posts/` 下的 Markdown 文章同步入库至 PostgreSQL |
| **`check-content.ts`** | `bun run content:check` | 检查并标准化本地 Markdown 文件的 Frontmatter 元数据 |
| **`upload-to-cloudinary.ts`** | `bun run scripts/upload-to-cloudinary.ts` | 批量扫描图片、预转高质量 WebP 并上传至 Cloudinary CDN |
| **`reset-admin-password.ts`** | `bun run reset-admin-password` | 服务端安全重置管理员密码（免邮件系统的自救方案） |
| **`reset-db.ts`** | `bun run db:reset` | 级联清空数据库所有业务表与会话数据（谨慎使用） |

---

## 📖 详细使用说明

### 1. `sync-content.ts` - 文章内容同步
将本地 Markdown 解析并同步至 Neon PostgreSQL 数据库（支持 Frontmatter 校验、Cloudinary CDN 图片自动映射、标签级联入库与废弃文章软删除）。

```bash
# 1. 默认执行同步
bun run sync

# 2. 预览模式（仅输出将要执行的改动日志，不修改数据库）
bun run scripts/sync-content.ts --dry-run

# 3. 同步时跳过软删除（保留已在本地删除的文章）
bun run scripts/sync-content.ts --no-delete
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

---

### 3. `upload-to-cloudinary.ts` - 图片优化与 CDN 上传
扫描 `content/posts/**/images/` 目录下的所有媒体资源，通过 `sharp` 在内存中自动压缩并转换为高质量 `.webp` 格式（降低上传体积并提升前端加载速度），随后推送至 Cloudinary。

```bash
# 执行图片预转换与上传（需配置 CLOUDINARY 相关环境变量）
bun run scripts/upload-to-cloudinary.ts
```

---

### 4. `reset-admin-password.ts` - 管理员密码重置 (CLI)
针对免邮件系统设计的管理员自救方案。直接使用 `better-auth/crypto` 安全哈希密码，更新指定管理员凭据并清空历史 Session 强制重新登录。

```bash
# 交互式引导重置
bun run reset-admin-password

# 指定参数直接重置
bun run reset-admin-password --email admin@example.com --password myNewSecurePassword123
```

---

### 5. `reset-db.ts` - 数据库数据重置
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
