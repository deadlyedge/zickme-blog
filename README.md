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

同时提供带有 ADMIN 权限控制的 Dashboard、单向发布、媒体管理和运行时诊断工具。

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

文章通过 Frontmatter 管理，可通过脚本自动生成模板，用户应编辑内容如下：

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
- 查看文章状态和运行时数据；
- 手动触发单向 publish；
- 查看发布摘要和运行时状态；
- 手动触发统一的单向 Publish Workflow；
- 旧的封面编辑、内容导入、数据库导出和内容状态修改入口已移除或仅保留 Git-first 提示，不回写 Git 内容源。

Gallery 的人工编辑源是 `content/photo-gallery/{album}/album.yaml`；`gallery.yaml` 只能由索引命令生成，原始图片只能放在 Git 忽略的 `content/.gallery-input/`。Dashboard 的旧内容编辑/patch 能力仅为兼容期能力，不应作为新的内容源：

```bash
bun run gallery:index
bun run publish -- --scope galleries
bun run publish -- --scope galleries --dry-run --json
```

RAW/ORF/CR2 等格式不会被静默处理，请先转换为 JPEG、PNG 或 TIFF。Publish 发现 source missing 时只报告，不会自动删除数据库记录、评论或 Cloudinary 资源；删除必须通过独立的 ADMIN 确认流程。Post/Gallery 领域仍保持独立。真实 publish 使用运行保护；`dry-run` 完全只读，不获取数据库锁、不创建或更新 `SyncRun`，也不写文件或上传媒体。

所有 Dashboard 写操作都要求 ADMIN Session。项目不依赖邮件服务处理密码重置。

### 内容检查、发布与 slug 保护

- 使用 Sharp 进行图片尺寸限制和 WebP 优化；
- 支持本地 Markdown 图片路径解析和 CDN URL 替换；
- 数据库封面回写、文章导出和反向 pull 已删除；内容恢复请使用 Git 历史；
- 默认不覆盖已有本地文件；
- slug 冲突时拒绝发布，不静默覆盖其他文章；
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
- **内容解析**：gray-matter、react-markdown、remark-gfm；
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

当前仓库正式 migration 链只有一个 baseline，文件和 journal 由 Drizzle migration 机制管理：

```text
drizzle/0000_stage12_baseline.sql
drizzle/meta/_journal.json
```

新环境执行：

```bash
bun run db:migrate
bun run publish:tui
bun run dev
```

访问：

```text
http://localhost:3000
```

已有可重建数据库按需执行 `bun run db:migrate`；`bun run db:reset` 只清空运行时数据，不修改 schema，之后可从本地 `content/` 重新 publish。

---

## 🔄 常用命令

| 命令 | 说明 |
| :--- | :--- |
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run lint` | 运行 Biome 检查 |
| `bun run format` | 使用 Biome 格式化代码 |
| `bun run publish` | 单向发布所有内容域；未指定 scope 时等价于 `all` |
| `bun run publish -- --scope posts --dry-run --json` | 只读预览 Post 发布并输出 JSON 摘要 |
| `bun run publish -- --scope galleries --dry-run --json` | 只读预览 Gallery 发布并输出 JSON 摘要 |
| `bun run publish -- --scope all --dry-run --json` | 只读预览全站发布并输出双域摘要 |
| `bun run content:check` | 检查 Frontmatter、图片路径和元数据 |
| `bun run content:fix` | 自动修复可安全修复的问题 |
| `bun run content:format` | 默认预览 Frontmatter/YAML 格式化；使用 `-- --write` 才写入 |
| `bun run content:prepare-media` | 将 `.gallery-input` 原始图片转换为 Git 管理的 WebP |
| `bun run gallery:index` | 生成自动维护的 `gallery.yaml` |
| `bun run content:verify` | 检查、格式预览、索引预览、双域 dry-run 和 Git diff 检查 |
| `bun run content:init` | 生成内容目录模板和使用说明 |
| `bun run db:generate` | 根据 Schema 生成迁移 |
| `bun run db:migrate` | 执行未应用的迁移 |
| `bun run db:push` | 将当前 Schema 推送到数据库 |
| `bun run db:studio` | 启动 Drizzle Studio |
| `bun run db:reset` | 重置数据库，危险操作 |
| `bun run reset-admin-password` | CLI 重置管理员密码 |
| `bun run gallery:index` | 重新生成 Gallery 索引 |
| `bun run test` | 运行发布边界测试 |

推荐提交流程（阶段 E）：

```bash
bun run content:check -- --no-examples
bun run gallery:index
bun run publish -- --scope all --dry-run --json # 只读预览，不写 DB/Cloudinary/工作区
git diff --check
git status --short
git add content/posts content/photo-gallery
git commit -m "content: update blog"
bun run publish -- --scope all # 受控单向发布；提交 Git 后再执行
```

提交前也可以直接运行：

```bash
bun run content:verify
git diff --check
git status --short
```

`content:format` 和 `content:verify` 默认不会覆盖用户文件。确认格式预览后，单独执行 `bun run content:format -- --write` 才会重写白名单 Frontmatter/YAML 结构；正文语义不会被格式化器处理。

`bun run publish` 未指定 scope 时会依次发布 Post 和 Gallery；如果某个内容域失败，运行摘要会保留已成功内容域的结果，并返回 `PARTIAL_SUCCESS` 或 `FAILED`。只发布单个域时必须显式指定 `--scope posts` 或 `--scope galleries`。旧同步 CLI 已删除。

Publish 失败不会把解析失败或媒体上传失败的 Post 静默视为成功：摘要会统计实际扫描数量、失败数量和媒体错误。`--dry-run` 不上传 Cloudinary、不写数据库、不创建运行记录；本地图片在 dry-run 中保留原始路径。

交互式维护工具使用：

```bash
# 推荐：启动交互式 Publish Assistant，由 TUI 引导后续流程
bun run publish:tui
```

TUI 会依次执行内容检查、修复确认、Git diff 检查和 publish dry-run，只有用户确认后才执行真实发布。日常不需要手动填写 scope；如果需要调试或只处理单个域，才使用脚本参数，例如 `bun run publish:tui -- --scope galleries`。

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
│   ├── photo-gallery/             # album.yaml 与自动生成的 Gallery 文件
│   └── .gallery-input/            # Git 忽略的原始图片输入
├── documents/
├── drizzle/
│   ├── 0000_stage12_baseline.sql   # 当前正式 baseline
│   ├── meta/                       # 当前迁移元数据
│   └── archive/                    # 历史迁移归档
├── scripts/
│   ├── check-content.ts
│   ├── format-content.ts
│   ├── prepare-media.ts
│   ├── gallery-index.ts
│   ├── publish.ts                  # 正式单向发布入口
│   ├── publish-tui.ts              # 交互式维护引导
│   ├── verify-content.ts
│   ├── init-content.ts             # 生成 content 目录模板
│   ├── reset-db.ts
│   └── reset-admin-password.ts
├── src/
│   ├── app/                        # 页面、路由和 Dashboard
│   ├── components/                 # 业务组件和 UI 组件
│   ├── db/                         # Drizzle Schema 与连接
│   ├── lib/                        # Actions、查询、同步和工具
│   ├── constants/                  # 项目层共用常量
│   └── types/                      # TypeScript 类型
├── AGENTS.md
├── biome.json
└── package.json
```

---

## 🧭 当前阶段与后续规划

### 内容模型统一

原本文章和项目分别处理，导致：

- 路由不同；
- 数据字段不同；
- 前端组件存在分支；
- 查询逻辑重复；
- 后续扩展成本较高。

最终统一为 `Post`，使用 tags、category 和 metadata 表达不同内容特征。这是一个正确的抽象收敛。

### ORM 和数据库现代化

从 Prisma 切换到 Drizzle，带来了：

- 更轻量的运行时依赖；
- 更直接的 SQL/schema 控制；
- 更适合 Serverless/Neon 的数据访问方式；
- 更明确的 migration 和 schema 管理。

但后续经验也表明，ORM 迁移本身只是基础设施工作，并不会自动解决业务边界问题。

### 权限和运维基础

项目没有引入邮件服务，而是选择：

- 管理员通过 CLI 重置密码；
- 普通用户由管理员在后台手动处理；
- Server Actions 统一进行 Session 和 Role 校验。

这说明对于个人项目，运维流程不必照搬 SaaS 产品的完整机制。低频操作可以使用受控 CLI 解决，不必为了“功能完整”引入邮件、任务队列等新系统。

---

## ☁️ 部署说明

完整的 Vercel 部署、Neon 数据库创建、Cloudinary 申请和环境变量配置步骤，请参阅 [`documents/deployment-vercel-neon-cloudinary.md`](documents/deployment-vercel-neon-cloudinary.md)。

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
2. 内容恢复优先使用 Git revert/分支/tag；数据库快照不替代 Git 内容源；
4. 数据库迁移在受控环境执行 `bun run db:migrate`；质量门禁不执行生产数据库写入；
5. `bun run db:reset` 是清空网站运行时数据的显式工具；确认后可用于从本地 `content/` 重建清爽站点。schema 变更使用 `bun run db:migrate`。
6. 数据库快照只恢复运行时业务副本，不回滚 Markdown、album.yaml、代码或 Cloudinary；原始照片须由作者自行备份。

Cloudinary 三个环境变量必须同时配置才会启用上传。

---

## ✅ 质量检查

提交前建议执行：

```bash
bun run lint
bunx tsc --noEmit --pretty false
bun run content:verify
bun run build
```

当前代码结构、已完成清理和后续优化方向见 [`documents/architecture/current-code-structure-summary.md`](documents/architecture/current-code-structure-summary.md)。历史阶段总结仍位于 `documents/`，不作为当前实现规范。

项目统一使用 Biome，不使用 ESLint/Prettier 作为主格式化工具。

---

## 📚 项目文档

- [AI Agent 协作规范](AGENTS.md)

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。