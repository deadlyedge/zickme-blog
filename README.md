# Zickme Blog

这是一个基于 [Next.js](https://nextjs.org) 和 [Payload CMS](https://payloadcms.com) 构建的个人博客项目。

## 功能特性

- 📝 博客文章管理
- 🚀 项目展示
- 🏷️ 标签过滤
- 📱 响应式设计
- 🔍 SEO 优化

## 技术栈

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Payload CMS
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 本地开发

### 环境要求

- Node.js 24+
- ~~npm / yarn / pnpm~~ / bun

### 安装依赖

```bash
bun install
```

### 环境变量
创建一个 `.env` 文件，添加以下环境变量：

```env
# use https://payloadsecret.com :)
PAYLOAD_SECRET="FmEDmfgMH8qJf5/y7cjJNB947VN32J4nVQ7Co020ymE="

DATABASE_URL="postgresql://xxxxx"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

如果是生产环境：
```env
# 在上面的基础上
BLOB_READ_WRITE_TOKEN="xxxxxxxxxxxxxxxxxxxxxx"
```

### 启动开发服务器

```bash
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看前端，[http://localhost:3000/admin](http://localhost:3000/admin) 访问管理后台。

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── (frontend)/      # 前端页面
│   └── (payload)/       # Payload CMS 管理后台
├── collections/         # Payload 内容集合
├── components/          # React 组件
└── lib/                 # 工具函数
```

## 部署

该项目配置为部署到 Vercel。推送代码到主分支将自动触发部署。

## 许可证

MIT License
