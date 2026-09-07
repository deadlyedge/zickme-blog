# Zick.me Blog & Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-1.7-orange)](https://www.better-auth.com/)

一个现代化的个人博客和作品集系统，采用最新的 Web 技术栈构建。

---

## ✨ 核心特性

### 🎨 现代化交互与设计
- **响应式布局**: 完美适配桌面端、平板和移动设备。
- **暗色与多主题**: 基于 `next-themes` 的视觉设计。
- **平滑动画与动效**: 基于 Framer Motion 的页面过渡与 Lenis 平滑滚动。

### 📝 统一内容管理系统 (Post System)
- **Markdown 驱动**: 基于 Git 与 Markdown 的纯文本内容管理。
- **多维度组织**: 灵活的标签（Tags）与状态（Published / Draft / Archived）管理。
- **自动化与手动同步**: 支持通过 GitHub Actions 自动化或在管理后台（Dashboard）手动一键同步。
- **图片与媒体优化**: Cloudinary CDN 集成，支持智能图片压缩与多级路径映射。

### 🔐 简易且安全的账户系统
- **认证方案**: 基于 Better-Auth 的安全认证与 Session 管理。
- **权限角色**: 支持 `ADMIN`、`EDITOR`、`USER` 多角色控制。
- **免邮件系统方案**: 
  - 管理员若遗失密码，可通过服务端 CLI 运维脚本直接重置。
  - 用户若需重置密码，可向管理员申请，由管理员在后台用户管理面板手动重设，避免配置复杂的 SMTP/邮件服务。

---

## 🛠️ 技术栈

- **框架与运行时**: Next.js 16 (App Router + React 19) + TypeScript + Bun
- **样式与 UI**: Tailwind CSS 4 + Radix UI + Motion
- **数据库与 ORM**: PostgreSQL (Neon) + Prisma 7 (正在逐步向 Drizzle ORM 迁移)
- **认证与鉴权**: Better Auth + RBAC 权限系统
- **代码质量与格式化**: Biome

---

## 🚀 快速开始

### 1. 环境准备
- **Bun** (推荐) 或 Node.js 20+
- **PostgreSQL** 16+

### 2. 安装与配置

```bash
# 1. 克隆项目
git clone https://github.com/your-username/zickme-blog.git
cd zickme-blog

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
```

编辑 `.env` 文件，配置关键变量：
```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/zickme_blog"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudinary (可选)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. 数据库与初始化

```bash
# 生成客户端并运行迁移
bun run db:generate
bun run db:migrate

# 导入/同步本地文章至数据库
bun run sync
```

### 4. 启动开发环境

```bash
bun run dev
```
访问 [http://localhost:3000](http://localhost:3000) 查看网站。

---

## 📁 核心目录结构

```
zickme-blog/
├── content/                 # Markdown 内容文件
│   └── posts/               # 文章仓库
├── documents/               # 当前有效规划文档 (Stage 2 规划等)
│   └── development-plan-stage2.md
├── references/              # 归档的历史文档与遗留代码
│   └── old-documents/       # 历史开发文档
├── prisma/                  # 数据库模式与迁移
├── public/                  # 静态资源
├── scripts/                 # 运维与同步工具脚本
│   ├── check-content.ts     # Markdown 内容检查
│   ├── sync-content.ts      # 内容同步入库脚本
│   └── reset-admin-password.ts # 管理员密码重置脚本
├── src/
│   ├── app/                 # Next.js App Router (页面、路由、Dashboard)
│   ├── components/          # React 业务与 UI 组件
│   ├── lib/                 # 核心工具库 (auth, db, utils)
│   └── constants.ts         # 全局常量与校验规则
├── AGENTS.md                # AI Agent 开发指南与规范
└── biome.json               # 代码格式化与 Linter 配置
```

---

## 🛠️ 常用开发指令

| 指令 | 说明 |
| :--- | :--- |
| `bun run dev` | 启动本地 Next.js 开发服务器 |
| `bun run build` | 编译生产版本 |
| `bun run lint` | 运行 Biome 检查代码规范与类型 |
| `bun run format` | 运行 Biome 自动格式化代码 |
| `bun run sync` | 执行本地 Markdown 内容向数据库同步 |
| `bun run content:check` | 校验本地 Markdown frontmatter 与格式 |
| `bun run db:migrate` | 运行数据库迁移 |
| `bun run db:studio` | 打开数据库可视化管理工具 |

---

## 📖 阶段开发与 AI 协作

- 详细的重构与功能演进计划请查阅：[`documents/development-plan-stage2.md`](documents/development-plan-stage2.md)
- AI Coding Agents 协同开发规范请查阅：[`AGENTS.md`](AGENTS.md)

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。
