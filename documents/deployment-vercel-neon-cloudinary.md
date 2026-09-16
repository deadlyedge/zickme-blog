# Vercel 部署、Neon 数据库与 Cloudinary 配置

本文说明如何将项目部署到 [Vercel](https://vercel.com/)，如何创建并连接 [Neon](https://neon.tech/) PostgreSQL 数据库，以及如何申请和配置 [Cloudinary](https://cloudinary.com/) 媒体存储。

项目的运行时数据流是：

```text
Git 中的 Markdown / YAML / WebP
          ↓ 受控 Publish
Neon PostgreSQL 运行时副本
          ↓
Cloudinary 图片 CDN
```

Git 仍然是文章、相册和图片元数据的唯一人工内容源。Neon 和 Cloudinary 不会反向写回仓库中的 Markdown、YAML 或图片文件。

## 一、部署前准备

开始之前准备以下账号和工具：

- 一个可以访问代码仓库的 GitHub、GitLab 或 Bitbucket 账号；
- 一个 [Vercel 账号](https://vercel.com/signup)；
- 一个 [Neon 账号](https://console.neon.tech/signup)；
- 一个 [Cloudinary 账号](https://cloudinary.com/users/register/free)（只有需要图片上传、Gallery 或文章图片 CDN 时才必须）；
- 本地安装 [Bun](https://bun.sh/)。

先在本地确认项目可以安装和构建：

```bash
bun install
bun run lint
bun run build
```

不要把 `.env`、数据库连接串、Cloudinary API Secret 或 Better Auth Secret 提交到 Git。仓库中的 `.env.example` 只包含变量名和示例值。

## 二、创建 Neon 数据库

### 1. 创建项目

1. 打开 [Neon Console](https://console.neon.tech/)，注册或登录。
2. 点击 **New project**。
3. 填写项目名称，例如 `zickme-blog-production`。
4. 选择离 Vercel 主要访问用户较近的区域。区域创建后通常不应频繁变更，因此要先确认。
5. 选择 PostgreSQL 版本和计算资源；个人博客通常可以先使用 Neon 默认配置。
6. 创建项目后，进入项目的 **Connect** 页面。

### 2. 获取连接字符串

在 Neon 的 **Connect** 面板中：

1. 选择生产分支（通常是 `main` 或 Neon 默认的 primary branch）。
2. 选择数据库和角色。
3. 复制 PostgreSQL connection string。
4. 优先使用 Neon 提供的 pooled connection string；项目运行在 Vercel Serverless 环境，连接池地址更适合频繁创建短生命周期函数。
5. 确认连接串包含 `sslmode=require`（Neon 通常会自动生成）。

连接串格式类似下面这样，实际值不要照抄：

```env
DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

`DATABASE_URL` 同时用于应用和 Drizzle migration。不要把连接串中的密码单独拆出来，也不要把它写进源代码。

### 3. 初始化数据库结构

在本地终端使用刚复制的生产连接串执行 migration。PowerShell 示例：

```powershell
$env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
bun run db:migrate
```

也可以在本地 `.env` 中临时配置后执行：

```bash
bun run db:migrate
```

执行后，Neon 数据库应包含仓库当前 migration 定义的表结构。生产数据库只执行 `bun run db:migrate`；不要用 `bun run db:reset`，也不要在生产环境随意执行 `db:push`。

如果要创建或重置管理员账号，使用受控的本地 CLI，并确保 CLI 使用的是目标 Neon 数据库：

```bash
bun run reset-admin-password
```

该命令不是 Vercel Web Function 的一部分，不能依赖 Vercel 的临时文件系统或交互式终端。

更多资料：

- [Neon 创建项目文档](https://neon.tech/docs/introduction/create-a-project)
- [Neon 连接数据库文档](https://neon.tech/docs/connect/connect-from-any-app)
- [Neon 分支文档](https://neon.tech/docs/introduction/branching)

> 如果上面的官方文档路径发生变化，可从 [Neon Documentation](https://neon.tech/docs) 主页进入对应章节。生产库和 Preview 库建议使用不同的 Neon branch 或不同项目，避免预览部署误写生产数据。

## 三、申请 Cloudinary 存储

Cloudinary 负责图片的存储和 CDN 分发；它不是 Git 原始图片备份，也不是文章或相册元数据源。原始照片仍应在仓库外自行备份。

### 1. 注册并创建 Media 环境

1. 打开 [Cloudinary 免费注册页](https://cloudinary.com/users/register/free) 并完成注册。
2. 登录后进入 [Cloudinary Console](https://console.cloudinary.com/)。
3. 在 **Dashboard** 或 **Product Environment Settings** 中找到当前 Product Environment 的信息。
4. 记录 **Cloud name**。
5. 打开 **Settings → Access Keys**（不同界面版本可能显示为 API Keys），找到 **API Key** 和 **API Secret**。
6. API Secret 只用于服务端签名上传，不能放到 `NEXT_PUBLIC_*` 变量中，也不能暴露到浏览器。

项目需要以下三项变量，三项必须同时存在：

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

项目会将 Gallery 资源放到 `myblog/gallery/{albumSlug}/{imageName}` 命名空间下。Cloudinary 账号中已有同名资源时，不要直接删除；先确认数据库记录和 Git 内容源，避免只删除 CDN 资源造成运行时图片失效。

更多资料：

- [Cloudinary Console](https://console.cloudinary.com/)
- [Cloudinary 图片上传文档](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary API Key 与安全文档](https://cloudinary.com/documentation/keys)
- [Cloudinary 媒体库文档](https://cloudinary.com/documentation/digital_asset_management)

### 2. 费用与安全注意事项

- 免费计划有存储、带宽和变换额度限制，正式使用前查看 [Cloudinary 计划与限制](https://cloudinary.com/pricing)。
- 不要把 API Secret 复制到 README、Issue、日志或前端代码。
- 如果怀疑 API Secret 泄露，应在 Cloudinary 控制台轮换密钥，并同步更新 Vercel 环境变量。
- Cloudinary 的删除和清理不是内容发布的自动回写过程；删除前先确认 Git、Neon 和 CDN 三者的状态。

## 四、创建 Vercel 项目

### 1. 从 Git 仓库导入

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)，点击 **Add New → Project**。
2. 连接保存本项目的 Git 提供商。
3. 选择 `zickme-blog` 仓库并点击 **Import**。
4. 在配置页确认：
   - **Framework Preset**：`Next.js`；
   - **Install Command**：`bun install`；
   - **Build Command**：`bun run build`；
   - **Root Directory**：仓库根目录；
   - 不要把 `content/`、`src/` 或 `documents/` 设置成 Root Directory。
5. 先不要急着部署，完成下一节的环境变量配置后再点击 **Deploy**。

仓库中的 `vercel.json` 已声明 Next.js、`bun install` 和 `bun run build`。如果 Vercel UI 已自动读取这些值，保持默认即可。

### 2. 添加环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加下列变量：

| 变量 | Production | Preview / Development | 说明 |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | 必填 | 必填 | Neon pooled PostgreSQL 连接串 |
| `BETTER_AUTH_SECRET` | 必填 | 必填 | 每个环境使用独立的随机长密钥 |
| `BETTER_AUTH_URL` | 必填 | 按环境填写 | 当前部署的完整 HTTPS URL |
| `CLOUDINARY_CLOUD_NAME` | 启用图片时必填 | 启用图片时必填 | Cloudinary Cloud name |
| `CLOUDINARY_API_KEY` | 启用图片时必填 | 启用图片时必填 | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | 启用图片时必填 | 启用图片时必填 | Cloudinary API Secret |

推荐做法：

1. Production 使用生产 Neon branch、生产 Cloudinary 环境和正式域名。
2. Preview 使用独立 Neon branch 或独立 Neon 项目，并使用独立的 `BETTER_AUTH_SECRET`。
3. Preview 的 `BETTER_AUTH_URL` 填写对应的 Vercel Preview URL；如果 Preview URL 会变化，应按 Vercel 的域名策略更新，或仅把 Preview 用作不登录的构建检查。
4. 不要为了方便把 Production 的 `DATABASE_URL` 和 Cloudinary Secret 复制到所有 Preview 环境。
5. 保存变量后必须重新部署；环境变量修改不会自动注入已经完成的旧部署。

生成 Better Auth 密钥可以使用：

```bash
openssl rand -base64 32
```

也可以使用密码管理器生成至少 32 字节的随机字符串。`BETTER_AUTH_URL` 示例：

```env
BETTER_AUTH_URL="https://your-domain.example"
```

不要在生产环境继续使用 `http://localhost:3000`。

### 3. 绑定自定义域名（可选）

如果使用自己的域名：

1. 打开 Vercel 项目的 **Settings → Domains**。
2. 添加域名并按 Vercel 显示的 DNS 记录完成解析。
3. 等待 Vercel 显示域名验证和 HTTPS 证书生效。
4. 将 Vercel 中 Production 环境的 `BETTER_AUTH_URL` 改成最终域名，例如 `https://zick.me`。
5. 重新部署并测试登录、退出、评论和 Dashboard 权限。

参考：[Vercel 添加域名](https://vercel.com/docs/domains/working-with-domains) 和 [Vercel 环境变量](https://vercel.com/docs/environment-variables)。

## 五、首次部署后的操作顺序

推荐严格按以下顺序执行：

1. 在 Neon 创建生产项目并复制 pooled connection string。
2. 在 Cloudinary 创建账号并取得 Cloud name、API Key、API Secret。
3. 在 Vercel 添加所有 Production 环境变量。
4. 部署项目，确认 `bun run build` 成功。
5. 在本地使用生产 `DATABASE_URL` 执行 `bun run db:migrate`。
6. 使用同一个生产 `DATABASE_URL` 配置本地 CLI，执行 `bun run reset-admin-password` 初始化或重置管理员。
7. 确认 Vercel 的 `BETTER_AUTH_URL` 是最终访问地址后重新部署。
8. 如果要发布图片，先在本地运行内容检查和只读预览：

   ```bash
   bun run content:check -- --no-examples
   bun run content:verify
   bun run publish -- --scope all --dry-run --json
   ```

9. 确认 Git 已提交并推送内容源后，再从受控环境执行正式发布：

   ```bash
   bun run publish -- --scope all
   ```

10. 打开网站检查首页、文章、Gallery、图片 CDN、登录和 Dashboard。

> Vercel 部署实例的文件系统不是持久化工作区。不要在运行中的 Vercel Function 中生成并依赖本地文件，也不要把服务器本地文件当作原始图片备份。正式内容仍应从 Git 内容源发布。

## 六、部署后检查清单

- [ ] Vercel Production 部署状态为 Ready。
- [ ] `BETTER_AUTH_URL` 与浏览器实际访问域名完全一致，包含 `https://`，不带多余路径。
- [ ] `DATABASE_URL` 指向正确的 Neon 生产 branch，并包含 SSL 参数。
- [ ] migration 已成功执行，且不是使用 `db:reset` 或未经审查的 `db:push`。
- [ ] 已创建或确认 ADMIN 账号。
- [ ] Cloudinary 三项变量已同时配置，API Secret 没有暴露到客户端。
- [ ] 首页和文章可打开，图片 URL 使用 `res.cloudinary.com`。
- [ ] 登录、退出、评论和 Dashboard 的 ADMIN 权限工作正常。
- [ ] 已运行 `bun run publish -- --scope all --dry-run --json`，确认 dry-run 没有写数据库、Cloudinary 或工作区。
- [ ] 已为 Git 内容、Neon 数据库和 Cloudinary 原始媒体分别安排备份/恢复策略。

## 七、常见问题

### Vercel 构建成功，但页面访问时报数据库错误

检查 Vercel Production 环境是否配置了 `DATABASE_URL`，并确认 Neon 项目没有暂停、连接串没有复制错误。环境变量修改后必须重新部署。

### 登录后重定向到 localhost 或登录状态丢失

检查 `BETTER_AUTH_URL` 是否仍是本地地址，或是否与当前自定义域名不一致。修改后重新部署，并清除浏览器旧 Cookie 再测试。

### Gallery 发布提示缺少 Cloudinary 凭据

确认 `CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET` 三项均已配置在执行发布的环境中。dry-run 不上传 Cloudinary；正式 Gallery 发布才会验证并使用这些凭据。

### Preview 误用了生产数据

在 Vercel 环境变量中检查变量作用域，并为 Preview 配置独立 Neon branch/项目。不要只依赖分支名称来推断数据库隔离。

### 能否在 Vercel 上直接运行 migration 或 publish？

Migration 和正式 publish 都是受控运维操作，不应依赖 Vercel Function 的临时文件系统。建议使用本地受控终端、独立发布机或 CI，在确认目标数据库和 Git 提交后执行。Vercel 负责构建和托管 Web 应用，不是 Git 内容源、数据库迁移仓库或 Cloudinary 原始媒体备份。