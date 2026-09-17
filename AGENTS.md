# AGENTS.md - AI Coding Agents 开发与协作指南

> 本指南用于约束和指导所有参与本项目（`zickme-blog`）开发的 AI Agents（如 Cline、Claude Code、Cursor 等），确保架构一致性、代码规范与有序交付。

本项目是基于 Next.js App Router、React 19、TypeScript、Bun、Drizzle ORM 和 PostgreSQL 构建的超轻量个人博客与作品集系统。

项目采用以下核心架构：

```text
Git 内容源
    ↓
检查与媒体准备
    ↓
单向 Publish
    ↓
PostgreSQL 运行时副本
    ↓
Cloudinary CDN
    ↓
Blog / Gallery
```
同时提供带有 ADMIN 权限控制的 Dashboard、单向发布、媒体管理和运行时诊断工具。

---

## 🧭 1. Agents 核心行为准则

1. **先规划后编码（Plan-Then-Act）**：
   - 涉及任何跨模块、数据模型调整或破坏性修改前，必须先查阅相关文件并梳理调用链。
   - 涉及内容源、数据库、Cloudinary 或 Dashboard 的修改，必须先说明是否保持单向数据流。

2. **严禁引入未经确认的重型外部服务**：
   - **不引入邮件发送服务**（如 Resend、Nodemailer、SendGrid 等），用户密码重置通过后台手动修改，管理员自救通过 CLI 脚本。

3. **代码风格与工具链强制约定**：
   - **包管理器**：优先使用 `bun`（如 `bun run build`、`bun add ...`）。
   - **代码格式与 Lint**：统一使用 **Biome**（`bun run lint` / `bun run format`），遵循项目根目录 `biome.json`。
   - **绝对路径导入**：统一使用 `@/...` 路径别名引用 `src/` 下模块。
   - **快捷脚本**：如果 `package.json` 已提供 `publish:*` 快捷命令，优先按其名称调用。

4. **安全与健壮性**：
   - 敏感配置必须且仅能来自环境变量（如 `.env`），不得硬编码任何 Key/Secret。
   - Server Actions 与 API 端点必须进行严格的 Session 与 Role（`ADMIN`/`USER`）权限校验及 Zod 输入验证。
   - 渲染外部 HTML 时必须进行安全过滤与净化，防范 XSS 漏洞。

5. **内容源与架构边界**：
   - Git 是唯一人工内容源，禁止新增数据库到 Markdown/YAML 的自动回写。
   - Dashboard 是运行时管理和观察工具，不得发展为第二套内容编辑器。
   - Cloudinary 只负责媒体存储/CDN，不是原始图片备份，也不是内容元数据源。
   - `dry-run` 必须真正只读：不得写文件、数据库、Cloudinary 或生成生产运行记录。

---

## 🗺️ 2. 当前开发状况

如果需要了解项目发展进程，`documents\project-summary-0915.md` 保存了上一阶段开发要点

---

## 🧪 3. 验证与检查清单

在完成任何任务交卷前，Agent 必须在终端运行以下验证：
```bash
# 1. 检查代码格式与 Lint
bun run lint

# 2. 验证 TypeScript 类型与生产构建
bun run build

```
涉及内容或发布流程时，还应运行：
```bash
# 2. 检查本地 Markdown 内容与 Frontmatter 规范
bun run content:check -- --no-examples

bun run content:verify
bunx tsc --noEmit --pretty false
```
涉及 Publish/TUI 调试时，至少执行：
```bash
# 自动化/非交互式验证
bun run publish -- --scope all --dry-run --json
```
并需要确认交互式发布代码（publish:tui）代码和非交互式功能一致。

如果修改了同步、快照、权限或内容边界，必须增加相应测试；在测试基础设施补齐前，至少提供可复现的纯函数或 dry-run 验证。确保无未捕获的 TypeScript 错误、Lint 报错或未说明的工作区副作用后方可完成交付。

## 4. 文档同步

如果阶段性任务被完成或者涉及了功能变化/脚本入口变化等，需要检查根`README.md`是否同步，同时检查`AGENTS.md`是否需要更新。更新`AGENTS.md`前应该进行确认。