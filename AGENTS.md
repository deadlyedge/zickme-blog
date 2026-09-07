# AGENTS.md - AI Coding Agents 开发与协作指南

> 本指南用于约束和指导所有参与本项目（`zickme-blog`）开发的 AI Agents（如 Cline、Claude Code、Cursor 等），确保架构一致性、代码规范与有序交付。

---

## 🎯 1. 项目核心背景与目标

`zickme-blog` 是基于 **Next.js (App Router) + React 19 + TypeScript + Bun** 构建的现代化个人博客与作品集系统。

当前项目正处于从早期架构向 **Stage 2 架构** 演进的重构阶段：
- **简化运维**：免去繁琐的邮件系统维护，管理员密码通过 CLI 脚本重置，普通用户重置请求走管理员后台手动重设。
- **内容架构统一**：彻底移除 `blogs` 与 `projects` 的双轨结构，全站统一为 `Post` 体系（由 tags/category 标识特征）。
- **ORM 现代化**：从 Prisma 7 逐步迁移至更加轻量、适合 Serverless 的 **Drizzle ORM**。
- **Dashboard 内容掌控力**：在后台提供可视化的文章管理（草稿/发布/归档）与导入诊断，减轻对单一 GitHub Actions 的脆弱依赖。

详细路线图请务必参考：[`documents/development-plan-stage2.md`](documents/development-plan-stage2.md)。

---

## 🧭 2. Agents 核心行为准则

1. **先规划后编码（Plan-Then-Act）**：
   - 涉及任何跨模块、数据模型调整或破坏性修改前，必须先查阅相关文件并梳理调用链。
   - 遵循 `development-plan-stage2.md` 中定义的步骤执行，不要跳步或一次性引入过大范围的无关改动。

2. **严禁引入未经确认的重型外部服务**：
   - **不引入邮件发送服务**（如 Resend、Nodemailer、SendGrid 等），用户密码重置通过后台手动修改，管理员自救通过 CLI 脚本。

3. **代码风格与工具链强制约定**：
   - **包管理器**：优先使用 `bun`（如 `bun run build`、`bun add ...`）。
   - **代码格式与 Lint**：统一使用 **Biome**（`bun run lint` / `bun run format`），遵循项目根目录 `biome.json`。
   - **绝对路径导入**：统一使用 `@/...` 路径别名引用 `src/` 下模块。

4. **安全与健壮性**：
   - 敏感配置必须且仅能来自环境变量（如 `.env`），不得硬编码任何 Key/Secret。
   - Server Actions 与 API 端点必须进行严格的 Session 与 Role（`ADMIN`/`USER`）权限校验及 Zod 输入验证。

---

## 🗺️ 3. Stage 2 阶段开发任务指引

### 阶段一：管理员与用户密码重置及运维增强（免邮件方案）
- **目标文件**：`scripts/reset-admin-password.ts`, `src/app/(pages)/dashboard/users/*`, `src/lib/actions/*`
- **规范**：
  - 编写独立的 Bun 脚本 `scripts/reset-admin-password.ts`，调用 Better-Auth 密码加密哈希工具直接更新指定管理员密码。
  - 在 Dashboard 用户管理列表中增加“修改/重置密码”的操作对话框（仅限 ADMIN 角色调用），支持手动为忘记密码的用户设置新密码。
  - 在已登录用户的个人设置（`EditProfile.tsx`）中补充密码修改面板。

### 阶段二：统一内容架构（移除 blogs / projects 分裂）
- **目标文件**：`content/posts/`, `src/lib/slug.ts`, `src/lib/content-queries.ts`, `src/app/(pages)/posts/*`, 导航与卡片组件
- **规范**：
  - 将 `content/posts/blogs` 与 `content/posts/projects` 统一归集至 `content/posts/`。
  - 统一 slug 解析逻辑，移除 `blogs-` / `projects-` 等硬编码前缀。
  - 前端路由统一收拢为 `/posts` / `/posts/[slug]`，并配置旧路由向后兼容重定向。
  - 废弃针对 Project 特有的非通用硬编码字段，通过 Markdown 扩展或通用 tags/meta 呈现。

### 阶段三：ORM 迁移至 Drizzle ORM
- **目标文件**：`src/db/schema/*`, `src/db/index.ts`, `drizzle.config.ts`, 迁移 Better-Auth 适配器
- **规范**：
  - 配置 `drizzle-orm` 与 PostgreSQL（Neon）连接池。
  - 迁移现有 Prisma Schema（users, accounts, sessions, posts, tags, comments, site_profile）到 Drizzle Schema。
  - 重写查询层（`content-queries.ts`、actions）与内容同步脚本，确保类型安全。
  - 验证完成后彻底卸载 Prisma 相关依赖与生成文件。

### 阶段四：Dashboard 文章管理与可视化导入
- **目标文件**：`src/app/(pages)/dashboard/posts/*`, `src/app/(pages)/dashboard/sync/*`
- **规范**：
  - 实现文章列表、状态筛选（PUBLISHED / DRAFT / ARCHIVED）、批量操作与状态切换。
  - 实现网页端手动触发同步并分阶段显示进度日志（Frontmatter 校验 ➡️ 图片/Cloudinary 状态 ➡️ 数据库落库）。

---

## 🧪 4. 验证与检查清单

在完成任何任务交卷前，Agent 必须在终端运行以下验证：
```bash
# 1. 检查代码格式与 Lint
bun run lint

# 2. 验证 TypeScript 类型与生产构建
bun run build
```
确保无未捕获的 TypeScript 错误与 Lint 报错后方可完成交付。