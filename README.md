# Zick.me Blog & Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-blue)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-green)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-1.7-orange)](https://www.better-auth.com/)

基于 Next.js App Router、React 19、TypeScript、Bun、Drizzle ORM 和 PostgreSQL 构建的个人博客与作品集系统。

项目采用以下核心架构：

```text
Git 管理的 Markdown 内容
        ↓
PostgreSQL / Drizzle 运行时数据
        ↓
Cloudinary 媒体 CDN
```

同时提供带有 ADMIN 权限控制的 Dashboard、内容同步、媒体管理和同步诊断工具。

---

## ✨ 当前特性

### 前台阅读体验

- 响应式博客与作品集布局；
- 深色模式和主题配置；
- 页面过渡动画与平滑滚动；
- 文章阅读进度条；
- 桌面 Sticky TOC 和移动端文章目录；
- 中英文混合阅读时长和字数估算；
- Markdown 代码块语言标识和一键复制；
- 文章标签、搜索和状态管理；
- 评论与回复功能。

### Post 内容系统

普通文章存放于：

```text
content/posts/**/*.md
```

文章通过 Frontmatter 管理：

```yaml
---
title: 前端开发指南
slug: qian-duan-kai-fa-zhi-nan
date: 2026-09-09
status: published
tags:
  - Next.js
  - TypeScript
excerpt: 一篇前端开发实践文章
image: ./images/cover.webp
links:
  - label: GitHub
    url: https://github.com/example/project
    type: github
---
```

支持 `links`、`github`、`twitter`、`demo`、`figma`、`paper`、`category`、`series`、`canonicalUrl`、`outdatedWarning` 和 `layout` 等扩展字段。

文章外链会显示可识别图标和完整 URL。GitHub 与 X/Twitter 使用项目内置的自定义 SVG 图标。

### Dashboard

管理员可以：

- 按状态、标签和关键词筛选文章；
- 发布、转为草稿、归档和恢复文章；
- 批量更新文章状态；
- 预览文章；
- 输入外部封面 URL；
- 上传、替换和移除文章封面；
- 通过 Cloudinary WebP 流程处理上传图片；
- 手动触发内容同步；
- 上传 Markdown 或 ZIP 内容；
- 查看分阶段同步日志；
- 导出数据库文章 ZIP；
- 检查本地与数据库文章差异。

所有 Dashboard 写操作都要求 ADMIN Session。项目不依赖邮件服务处理密码重置。

### 内容同步与 slug 保护

- 使用 Sharp 进行图片尺寸限制和 WebP 优化；
- 支持本地 Markdown 图片路径解析和 CDN URL 替换；
- 支持数据库封面回写至本地 Frontmatter；
- 支持数据库文章导出为标准 Markdown；
- 支持数据库文章安全拉取到本地；
- 默认不覆盖已有本地文件；
- 支持本地新增、远端新增和冲突诊断；
- 中文 slug 冲突时拒绝同步，不静默覆盖其他文章；
- `Post.sourcePath` 保存本地来源路径。

---

## 🛠️ 技术栈

- **框架**：Next.js 16、React 19、TypeScript；
- **运行时**：Bun、Node.js 24+；
- **样式与 UI**：Tailwind CSS 4、Radix UI、Motion、Lucide React；
- **数据库**：PostgreSQL，推荐 Neon Serverless Postgres；
- **ORM**：Drizzle ORM；
- **认证**：Better Auth；
- **媒体**：Sharp、Cloudinary；
- **内容解析**：gray-matter、marked；
- **校验**：Zod；
- **质量工具**：Biome；
- **客户端缓存**：TanStack Query。

---

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/your-username/zickme-blog.git
cd zickme-blog
bun install
```

### 环境变量

```bash
cp .env.example .env
```

至少配置：

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

需要 Cloudinary 媒体上传时配置：

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

不要将真实密钥提交到 Git。

### 初始化数据库和运行项目

当前正式迁移目录使用单一 baseline：

```text
drizzle/0000_baseline.sql
drizzle/meta/
```

新环境执行：

```bash
bun run db:migrate
bun run sync
bun run dev
```

访问：

```text
http://localhost:3000
```

已有数据库如需根据当前 Schema 同步，可以使用 `bun run db:push`。生产环境不要执行 `bun run db:reset`。

---

## 🔄 常用命令

| 命令 | 说明 |
| :--- | :--- |
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run lint` | 运行 Biome 检查 |
| `bun run format` | 使用 Biome 格式化代码 |
| `bun run sync` | 扫描 `content/posts` 并同步到数据库 |
| `bun run sync:pull` | 拉取数据库中本地不存在的文章 |
| `bun run sync:pull -- --force` | 强制覆盖同名本地 Markdown |
| `bun run content:check` | 检查 Frontmatter、图片路径和元数据 |
| `bun run content:fix` | 自动修复可安全修复的问题 |
| `bun run content:init` | 生成内容目录模板和使用说明 |
| `bun run db:generate` | 根据 Schema 生成迁移 |
| `bun run db:migrate` | 执行未应用的迁移 |
| `bun run db:push` | 将当前 Schema 推送到数据库 |
| `bun run db:studio` | 启动 Drizzle Studio |
| `bun run db:reset` | 重置数据库，危险操作 |
| `bun run reset-admin-password` | CLI 重置管理员密码 |

推荐提交流程：

```bash
bun run content:check
bun run sync -- --dry-run
bun run sync
git diff -- content/posts
git add content/posts
git commit
```

首次准备内容目录时，可以运行：

```bash
bun run content:init
```

该命令会生成 `content/README.md`、文章模板、相册模板和 Gallery 索引模板。默认不会覆盖已有文件；使用 `--dry-run` 预览，使用 `--force` 才覆盖模板文件。具体放置规则见 [`content/README.md`](content/README.md)。

---

## 📁 项目结构

```text
zickme-blog/
├── content/
│   ├── posts/                     # Markdown Post 内容源
│   │   ├── images/                # Post 本地媒体
│   │   └── *.md
│   └── .obsidian/                 # Obsidian 配置
├── documents/
│   ├── development-plan-stage2.md
│   ├── development-plan-stage3.md
│   ├── development-plan-stage4.md
│   ├── development-plan-stage5.md
│   ├── development-plan-stage6.md # 独立 Gallery 规划
│   ├── stage4-summary.md
│   └── stage5-summary.md
├── drizzle/
│   ├── 0000_baseline.sql           # 当前正式 baseline
│   ├── meta/                       # 当前迁移元数据
│   └── archive/                    # 历史迁移归档
├── scripts/
│   ├── check-content.ts
│   ├── init-content.ts             # 生成 content 目录模板
│   ├── sync-content.ts
│   ├── sync-pull.ts
│   ├── reset-db.ts
│   └── reset-admin-password.ts
├── src/
│   ├── app/                        # 页面、路由和 Dashboard
│   ├── components/                 # 业务组件和 UI 组件
│   ├── db/                         # Drizzle Schema 与连接
│   ├── lib/                        # Actions、查询、同步和工具
│   └── types/                      # TypeScript 类型
├── AGENTS.md
├── biome.json
└── package.json
```

---

## 🧭 当前阶段与后续规划

### 已完成：Stage 2–5

- Post 内容架构统一；
- Drizzle ORM 迁移；
- Dashboard 文章状态管理与同步诊断；
- WebP 图片处理；
- 品牌与基础 UI 优化；
- Frontmatter 外链和扩展元数据；
- 文章封面在线管理与本地回写；
- 数据库文章导出和 `sync:pull`；
- 中文 slug 冲突保护；
- Drizzle migration baseline 精简。

详细总结：[Stage 5 交付总结](documents/stage5-summary.md)。

### 规划中：Stage 6 独立 Gallery

纯图片相册不会作为 Post 的 `layout: gallery` 分支，而是规划为独立内容系统：

```text
content/photo-gallery/
├── gallery.yaml              # 自动生成的全局索引
├── japan-autumn/
│   ├── album.yaml            # 相册和图片元数据的人工编辑源
│   └── images/*.webp         # 只保存处理后的 WebP，不保存原图
```

Stage 6 计划包括：

- `Gallery` / `GalleryImage` 数据模型；
- `GallerySyncService`；
- Cloudinary `photo-gallery/{albumSlug}/...` folder；
- `check-content --fix` 自动生成 `album.yaml` 骨架；
- 自动生成 `gallery.yaml`；
- 每张图片的 `title`、`description`、`alt`、`order` 和 `hidden`；
- `/gallery` 和 `/gallery/[albumSlug]`；
- Masonry/Grid、Lightbox 和受控 EXIF 展示；
- Dashboard 添加、编辑、减少图片；
- 基于 merge base、revision 和字段级合并的双向同步；
- 不保存原始 JPEG/PNG/TIFF/BMP/RAW 文件。

Stage 6 目前仅为开发计划，尚未在应用中实现。详见：[Stage 6 开发计划](documents/development-plan-stage6.md)。

---

## ☁️ 部署说明

| 环境变量 | 必填 | 说明 |
| :--- | :---: | :--- |
| `DATABASE_URL` | 是 | PostgreSQL/Neon 连接字符串 |
| `BETTER_AUTH_SECRET` | 是 | Better Auth 服务端密钥 |
| `BETTER_AUTH_URL` | 是 | 生产环境完整 URL |
| `CLOUDINARY_CLOUD_NAME` | 按功能 | Cloudinary 云名称 |
| `CLOUDINARY_API_KEY` | 按功能 | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | 按功能 | Cloudinary API Secret |

部署注意：

1. 部署环境的文件系统不应被当作开发机工作区；
2. Dashboard 导出内容使用 ZIP 下载；
3. 本地 Markdown 回写和 `sync:pull` 应在本地或 CI 工作区执行；
4. 数据库迁移在受控环境执行 `bun run db:migrate`；
5. 不要在生产环境执行 `bun run db:reset`。

---

## ✅ 质量检查

提交前建议执行：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
```

项目统一使用 Biome，不使用 ESLint/Prettier 作为主格式化工具。

---

## 📚 项目文档

- [Stage 2 开发计划](documents/development-plan-stage2.md)
- [Stage 3 开发计划](documents/development-plan-stage3.md)
- [Stage 4 开发计划](documents/development-plan-stage4.md)
- [Stage 5 开发计划](documents/development-plan-stage5.md)
- [Stage 5 交付总结](documents/stage5-summary.md)
- [Stage 6 Gallery 开发计划](documents/development-plan-stage6.md)
- [AI Agent 协作规范](AGENTS.md)

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。