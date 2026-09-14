# AGENTS.md - AI Coding Agents 开发与协作指南

> 本指南用于约束和指导所有参与本项目（`zickme-blog`）开发的 AI Agents（如 Cline、Claude Code、Cursor 等），确保架构一致性、代码规范与有序交付。

---

## 🎯 1. 项目核心背景与目标

`zickme-blog` 是基于 **Next.js 16 (App Router) + React 19 + TypeScript + Bun + Tailwind CSS v4** 构建的个人博客与 Gallery 系统。

当前项目已完成 Stage 2 ~ Stage 10，正在实施 Stage 11 架构治理。Stage 9/10 建立了内容校验、Gallery 浏览体验、数据库运行时副本、Dashboard 和业务快照能力；当前治理方向不是继续扩展同步平台，而是执行“架构减法”，回归 Git-first 的单向发布模型：
- **简化运维**：免去繁琐的邮件系统维护，管理员密码通过 CLI 脚本重置，普通用户重置请求走管理员后台手动重设。
- **内容架构统一**：彻底移除 `blogs` 与 `projects` 的双轨结构，全站统一为 `Post` 体系（由 tags/category 标识特征）。
- **ORM 现代化**：全面采用轻量、适合 Serverless 的 **Drizzle ORM** 与 PostgreSQL (Neon)。
- **单向内容发布**：Git 管理的 Markdown、`album.yaml` 和处理后的 WebP 是唯一人工内容源；数据库是运行时副本，Cloudinary 是媒体 CDN，内容只从 Git 流向运行时。
- **隐私与体验**：公开评论与内部用户模型隔离，内置稳定 Dicebear / Gravatar 头像体系。

当前架构减法的正式指导文档为 [`documents/architecture-reduction.md`](documents/architecture-reduction.md)，Stage 11 计划为 [`documents/develop-plans/development-plan-stage11-architecture-governance.md`](documents/develop-plans/development-plan-stage11-architecture-governance.md)，当前治理记录入口为 [`documents/architecture/`](documents/architecture/)。历史阶段计划统一存放在 [`documents/develop-plans/`](documents/develop-plans/) 中。

---

## 🧭 2. Agents 核心行为准则

1. **先规划后编码（Plan-Then-Act）**：
   - 涉及任何跨模块、数据模型调整或破坏性修改前，必须先查阅相关文件并梳理调用链。
   - 先阅读 `documents/architecture-reduction.md`；历史阶段计划位于 `documents/develop-plans/`，不能当作当前架构规范。
   - 涉及内容源、数据库、Cloudinary 或 Dashboard 的修改，必须先说明是否保持单向数据流。

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

5. **内容源与架构边界**：
   - Git 是唯一人工内容源，禁止新增数据库到 Markdown/YAML 的自动回写。
   - Dashboard 是运行时管理和观察工具，不得发展为第二套内容编辑器。
   - Cloudinary 只负责媒体存储/CDN，不是原始图片备份，也不是内容元数据源。
   - `dry-run` 必须真正只读：不得写文件、数据库、Cloudinary 或生成生产运行记录。
   - 在架构减法完成前，禁止新增双向同步、merge base、实体级任务、自动 Git commit/push 或新的同步入口。

---

## 🗺️ 3. 当前开发与阶段任务指引

### Stage 11（当前阶段）：架构治理、数据安全与代码质量
- Publish 是唯一正式内容发布入口；Sync 仅作为兼容期内部实现，不得新增依赖；
- source missing 默认只报告，不自动归档、标记删除或删除 Cloudinary；
- 废弃字段和 migration 只能在生产读取审计、备份和回滚方案完成后处理；
- 当前只读 migration 链审计命令为 `bun run db:audit-migrations`。

### Stage 9.6/10（已完成基线）
- 内容源为 Markdown、`album.yaml` 和处理后的 WebP；
- Post 与 Gallery 已有独立领域模型和同步流程；
- Dashboard 支持运行状态、内容管理和数据库快照；
- 快照只保护数据库业务副本，不回滚 Git 内容源、Cloudinary 或原始图片。

当前实施方向：架构治理（Stage 11 Phase 0–3 已逐步实施，Phase 4 migration 仅完成只读审计）
- 将现有同步体系收敛为 Git-first、单向 publish；
- 先冻结双向同步能力，再逐步禁用 pull、patch、write-back 和 merge；
- 修复 `dry-run` 的所有副作用；
- 降低 Dashboard、CLI、CI 和数据库之间的耦合；
- 具体阶段、兼容期、删除边界和验收标准见 [`documents/architecture-reduction.md`](documents/architecture-reduction.md)。

阶段 E 边界：正式内容流程只使用 `content:check`、`publish`、Git 和受控 CI；旧双向 CLI 已删除。`dry-run` 不得获取数据库锁、创建或更新 `SyncRun`、写入工作区、写入数据库或上传 Cloudinary。质量门禁必须不依赖生产数据库和 Cloudinary secrets。

阶段 B/E 边界：`publish` 是唯一正式单向发布入口，支持 `posts|galleries|all` scope；Dashboard 和受控 CI 必须复用同一个 publish service。publish 不执行数据库到 Markdown/YAML 的回写、不执行 merge、实体级重试、自动 commit 或 push。

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

# 4. 审计当前入口文档和治理命令
bun run docs:audit
```
涉及内容或发布流程时，还应运行：
```bash
bun run content:verify
bunx tsc --noEmit --pretty false
```
如果修改了同步、快照、权限或内容边界，必须增加相应测试；在测试基础设施补齐前，至少提供可复现的纯函数或 dry-run 验证。确保无未捕获的 TypeScript 错误、Lint 报错或未说明的工作区副作用后方可完成交付。