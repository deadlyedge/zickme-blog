# GitHub Actions 自动化工作流

本项目配置了基于 **GitHub Actions + Bun + Cloudinary + Drizzle ORM (Neon PostgreSQL)** 的内容质量门禁和受控发布流水线。

Post 与 Gallery 保持独立领域，但通过统一 `bun run sync` 编排器按 scope 管理。PR/Push 质量门禁只执行内容检查、索引预览和 Post/Gallery/ALL dry-run；受控发布工作流才执行数据库迁移和真实全站同步。原始图片只能放在 `content/.gallery-input/`，不能提交到 Git。Dashboard 生成的 patch 必须通过 `gallery:pull` 的 dry-run 和 hash 检查后再应用。

---

## 🔄 工作流架构与流程

```mermaid
graph TD
    A[Push / Pull Request] --> Q[quality.yml]
    Q -->|检查、格式预览、双域 dry-run| R[只读质量门禁]
    P[受控发布 / workflow_dispatch] --> M[media.yml]
    M -->|媒体处理| C[Cloudinary CDN]
    C --> S[sync-db.yml]
    S -->|迁移、统一 ALL 同步| E[Neon PostgreSQL 运行时副本]
```

---

## 📋 工作流列表

### 1. `media.yml` - 媒体资源自动优化与上传
- **触发条件**：
  - 当 `content/posts/**/images/**` 或 `content/posts/**/*.md` 产生变更并推送到仓库时自动触发。
  - 支持在 GitHub Actions 控制台手动运行（`workflow_dispatch`）。
- **执行任务**：
  - 使用 `oven-sh/setup-bun` 配置高效的 Bun 运行环境。
  - 执行 `bun run scripts/upload-to-cloudinary.ts`。
  - 自动将本地 JPG / PNG / BMP 格式图片在内存中预压缩为高质量 WebP（quality: 85, effort: 4），并按文件路径映射唯一 Public ID 上传至 Cloudinary。

### 2. `sync-db.yml` - 内容解析与数据库同步
- **触发条件**：
  - 在 `Upload Media to Cloudinary` 工作流运行完成且状态为 `success` 时自动级联触发。
  - 支持手动触发（`workflow_dispatch`）。
- **执行任务**：
   - 受控环境先执行 `bun run db:migrate`，再执行 `bun run sync -- --scope all`。
   - 统一编排器按顺序处理 Post 和 Gallery，并写入 SyncRun 运行摘要；失败时保留 scope 结果，不执行队列或自动 Cloudinary 删除。

### 3. `quality.yml` - PR/Push 质量门禁

- 只读执行 `bun run lint`、TypeScript、`bun run content:verify` 和生产构建；
- `content:verify` 包含 Gallery 原始输入保护、索引预览、Post/Gallery/ALL dry-run 和 `git diff --check`；
- 不执行 `db:reset`、真实数据库同步、真实 Cloudinary 删除或自动 Git commit/push。

---

## 🔐 必需的 GitHub Secrets 配置

为了确保 GitHub Actions 顺利执行，请在仓库的 **Settings ➡️ Secrets and variables ➡️ Actions** 中配置以下密钥：

| Secret 变量名 | 必填 | 说明 | 示例 |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **是** | Neon PostgreSQL 数据库连接字符串（事务/连接池模式） | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `CLOUDINARY_CLOUD_NAME` | **是** | Cloudinary 账户云名称 | `my-cloud-name` |
| `CLOUDINARY_API_KEY` | **是** | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **是** | Cloudinary API Secret | `abcdefghijklmnopqrstuv_wxyz` |

---

## 💡 本地与 CI 联动建议

1. **本地推送前验证**：
   在向 GitHub 提交文章前，推荐先在本地执行：
   ```bash
    bun run content:prepare
   ```
2. **免 CI 紧急同步**：
   管理员可以直接在网站后台控制台（`/dashboard/sync`）点击“扫描本地文章”或直接上传 ZIP 压缩包手动完成入库，无需等待 Actions 队列。
