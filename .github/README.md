# GitHub Actions 自动化工作流

本项目配置了基于 **GitHub Actions + Bun + Cloudinary + Drizzle ORM (Neon PostgreSQL)** 的自动化双阶段内容同步流水线。

---

## 🔄 工作流架构与流程

```mermaid
graph TD
    A[推送提交到 content/posts] --> B[.github/workflows/media.yml]
    B -->|1. 扫描图片并 WebP 预转换| C[上传图片至 Cloudinary CDN]
    C -->|2. 执行完成且成功| D[.github/workflows/sync-db.yml]
    D -->|3. 解析 Markdown Frontmatter| E[写入/更新 Neon PostgreSQL]
    D -->|4. 自动关联 CDN 图片与标签| F[完成数据库入库与发布]
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
  - 安装依赖后执行 `bun run scripts/sync-content.ts`。
  - 调用基于 Drizzle ORM 的 `ContentSyncService`，解析所有文章的 Frontmatter、替换本地图片引用为 Cloudinary CDN URL，将文章、标签、状态增量同步/软删除至 PostgreSQL (Neon)。

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
   bun run content:check
   ```
2. **免 CI 紧急同步**：
   管理员可以直接在网站后台控制台（`/dashboard/sync`）点击“扫描本地文章”或直接上传 ZIP 压缩包手动完成入库，无需等待 Actions 队列。
