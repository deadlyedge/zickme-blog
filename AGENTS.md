# AGENTS.md - AI Coding Agents 开发与协作指南

> 本指南用于约束和指导所有参与本项目（`zickme-blog`）开发的 AI Agents（如 Cline、Claude Code、Cursor 等），确保架构一致性、代码规范与有序交付。

---

## 🎯 1. 项目核心背景与目标

`zickme-blog` 是基于 **Next.js 16 (App Router) + React 19 + TypeScript + Bun + Tailwind CSS v4** 构建的现代化个人博客与作品集系统。

当前项目已完成早期架构重构与 Stage 2 ~ Stage 5.1 阶段演进：
- **简化运维**：免去繁琐的邮件系统维护，管理员密码通过 CLI 脚本重置，普通用户重置请求走管理员后台手动重设。
- **内容架构统一**：彻底移除 `blogs` 与 `projects` 的双轨结构，全站统一为 `Post` 体系（由 tags/category 标识特征）。
- **ORM 现代化**：全面采用轻量、适合 Serverless 的 **Drizzle ORM** 与 PostgreSQL (Neon)。
- **Dashboard 内容掌控力**：在后台提供可视化的文章管理（草稿/发布/归档）、在线配图修改与本地回写、以及双向内容同步（`bun run sync:pull`）。
- **隐私与体验**：公开评论与内部用户模型隔离，内置稳定 Dicebear / Gravatar 头像体系。

当前正在推进 **Stage 5.2 / Stage 5.2.1 代码质量与工程可靠性治理**，并为后续 **Stage 6 独立 Gallery 内容体系** 奠定坚实基础。

---

## 🧭 2. Agents 核心行为准则

1. **先规划后编码（Plan-Then-Act）**：
   - 涉及任何跨模块、数据模型调整或破坏性修改前，必须先查阅相关文件并梳理调用链。
   - 遵循 `documents/` 下定义的阶段计划执行，不要跳步或一次性引入过大范围的无关改动。

2. **严禁引入未经确认的重型外部服务**：
   - **不引入邮件发送服务**（如 Resend、Nodemailer、SendGrid 等），用户密码重置通过后台手动修改，管理员自救通过 CLI 脚本。

3. **代码风格与工具链强制约定**：
   - **包管理器**：优先使用 `bun`（如 `bun run build`、`bun add ...`）。
   - **代码格式与 Lint**：统一使用 **Biome**（`bun run lint` / `bun run format`），遵循项目根目录 `biome.json`。
   - **绝对路径导入**：统一使用 `@/...` 路径别名引用 `src/` 下模块。

4. **安全与健壮性**：
   - 敏感配置必须且仅能来自环境变量（如 `.env`），不得硬编码任何 Key/Secret。
   - Server Actions 与 API 端点必须进行严格的 Session 与 Role（`ADMIN`/`USER`）权限校验及 Zod 输入验证。
   - 渲染外部 HTML 时必须进行安全过滤与净化，防范 XSS 漏洞。

---

## 🗺️ 3. 当前开发与阶段任务指引

### 阶段五（已完成）：内容双向同步、富媒体扩展与体验升级
- **核心成果**：
  - Frontmatter 扩展支持 GitHub/Demo/Doc/Video 等外链胶囊展示。
  - Dashboard 支持直接上传/更换文章封面并回写本地 Markdown 文件。
  - 支持双向同步（`bun run sync:pull`）与本地增量拉取。
  - 评论系统隐私保护（隔离邮箱，公开展示 `displayName`）与稳定头像机制。

### 阶段 5.2 / 5.2.1（当前进行中）：代码质量、安全边界与工程可靠性提升
- **目标文件**：`src/components/PostClient.tsx`, `src/lib/theme.ts`, `src/lib/actions/*`, `biome.json`, 测试文件
- **规范**：
  - **安全加固**：Markdown HTML 渲染净化防 XSS；动态主题 CSS 注入限制；ZIP 与文件上传大小/路径防护。
  - **类型与 Lint**：消除业务代码中的 `Record<string, any>` 等逃逸类型；逐步恢复 Biome 规则。
  - **统一日志与错误**：封装统一的 Logger 与 Action 返回结构，杜绝裸 `console` 与敏感异常泄漏。
  - **测试与 CI**：引入自动化测试工具（如 Vitest），建立纯函数单测与 CI 质量门禁。

### 阶段六（规划中）：独立 Gallery 内容体系
- **目标文件**：`content/galleries/`, `src/db/schema/gallery.ts`, `src/app/gallery/*`, `src/lib/actions/gallery-admin.ts`
- **规范**：
  - 建立独立于文章的画廊与相册数据模型。
  - 支持独立 Cloudinary 文件夹与高吞吐图片压缩处理。

---

## 🧪 4. 验证与检查清单

在完成任何任务交卷前，Agent 必须在终端运行以下验证：
```bash
# 1. 检查代码格式与 Lint
bun run lint

# 2. 检查本地 Markdown 内容与 Frontmatter 规范
bun run content:check -- --no-examples

# 3. 验证 TypeScript 类型与生产构建
bun run build
```
确保无未捕获的 TypeScript 错误与 Lint 报错后方可完成交付。