# Zick.me Blog & Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1.0-lightgreen)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org/)

一个现代化的个人博客和作品集网站，采用最新的 Web 技术栈构建。

## ✨ 特色功能

### 🎨 现代化设计
- **响应式设计**: 支持桌面端、平板和移动设备
- **暗色主题**: 优雅的视觉体验
- **流畅动画**: 基于 Framer Motion 的页面过渡效果
- **中英文字体**: Noto Sans/Serif 中英双语字体支持

### 📝 内容管理系统
- **Markdown 驱动**: 基于文件的内容管理
- **多级分类**: 博客文章和项目展示分类
- **智能同步**: 自动将 Markdown 文件同步到数据库(github action)
- **标签系统**: 灵活的内容标签管理

### 🖼️ 媒体管理
- **Cloudinary 集成**: 高效的图片 CDN
- **自动优化**: 图片压缩和格式转换
- **多级路径**: 支持复杂的文件夹结构

### 🔐 用户系统
- **现代化认证**: Better Auth 认证方案
- **评论系统**: 支持文章评论和回复
- **用户管理**: 完整的用户权限系统

## 🛠️ 技术栈

### 前端框架
- **Next.js 16** - React 全栈框架，支持 App Router
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript

### 样式与动画
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Radix UI** - 无障碍访问的组件库
- **Framer Motion** - 动画库
- **Lenis** - 平滑滚动库

### 数据库与 API
- **Prisma** - 类型安全的 ORM
- **PostgreSQL** - 关系型数据库
- **Better Auth** - 现代化认证解决方案

### 开发工具
- **ESLint** - 代码质量检查
- **TypeScript** - 类型检查
- **Bun** - 快速的 JavaScript 运行时

## 🚀 快速开始

### 环境要求

- **Node.js** 18+
- **PostgreSQL** 16+
- **Bun** (推荐) 或 npm/yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/zickme-blog.git
   cd zickme-blog
   ```

2. **安装依赖**
   ```bash
   # 使用 Bun (推荐)
   bun install

   # 或使用 npm
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，配置以下变量：
   ```env
   # 数据库连接
   DATABASE_URL="postgresql://username:password@localhost:5432/zickme_blog"

   # Better Auth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Cloudinary (可选)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **数据库设置**
   ```bash
   # 生成 Prisma 客户端
   bun run db:generate

   # 运行数据库迁移
   bun run db:migrate

   # 可选：打开 Prisma Studio 查看数据库
   bun run db:studio
   ```

5. **启动开发服务器**
   ```bash
   bun run dev
   ```

   访问 [http://localhost:3000](http://localhost:3000) 查看网站。

## 📁 项目结构

```
zickme-blog/
├── content/                 # Markdown 内容文件
│   └── posts/              # 文章和项目
│       ├── blogs/          # 博客文章
│       └── projects/       # 项目展示
├── prisma/                 # 数据库模式和迁移
│   ├── schema.prisma       # Prisma 模式定义
│   └── migrations/         # 数据库迁移文件
├── public/                 # 静态资源
├── scripts/                # 工具脚本
│   ├── check-content.ts    # 内容检查和格式化
│   ├── sync-content.ts     # 内容同步到数据库
│   └── README.md           # 脚本使用指南
├── src/
│   ├── app/                # Next.js App Router 页面
│   │   ├── (pages)/        # 网站页面
│   │   ├── api/            # API 路由
│   │   └── globals.css     # 全局样式
│   ├── components/         # React 组件
│   │   ├── ui/             # UI 组件库
│   │   └── ...             # 业务组件
│   └── lib/                # 工具库
│       ├── auth.ts         # 认证配置
│       ├── prisma.ts       # 数据库客户端
│       ├── seo.ts          # SEO 工具
│       └── ...             # 其他工具
└── package.json
```

## 📝 内容管理

### 创建新内容

1. **在相应目录创建 Markdown 文件**：
   ```bash
   # 博客文章
   content/posts/blogs/tech/new-article.md

   # 项目展示
   content/posts/projects/web/new-project.md
   ```

2. **添加 Frontmatter**：
   ```yaml
   ---
   title: "文章标题"
   date: "2025-12-09"
   tags: ["标签1", "标签2"]
   status: "published"
   excerpt: "文章摘要"
   ---
   ```

3. **检查格式**：
   ```bash
   bun run content:check
   ```
   
   注意：如果使用obsidian编辑markdown文件，建议按以下配置：

   ```json
   # content/.obsidian/app.json
   {
   "newLinkFormat": "relative",
   "attachmentFolderPath": "./images",
   "useMarkdownLinks": true
   }
   ```

   目前本app并未完全支持parse obsidian生成的 `"[](images/curry_dunk.webp)"` 
   和vscode生成的 `![alt text](images/curry_dunk.webp)` ，使用中要注意。

4. **同步到数据库**：
   ```bash
   bun run sync
   ```

### 可用脚本

| 脚本                    | 说明               |
| ----------------------- | ------------------ |
| `bun run dev`           | 启动开发服务器     |
| `bun run build`         | 构建生产版本       |
| `bun run start`         | 启动生产服务器     |
| `bun run content:check` | 检查内容格式       |
| `bun run content:fix`   | 自动修复内容格式   |
| `bun run sync`          | 同步内容到数据库   |
| `bun run db:generate`   | 生成 Prisma 客户端 |
| `bun run db:migrate`    | 运行数据库迁移     |
| `bun run db:studio`     | 打开 Prisma Studio |

## 🎨 设计特色

### 响应式布局
- **移动优先**: 从小屏幕开始设计
- **断点系统**: 智能的响应式断点
- **性能优化**: 针对移动设备的优化

### 动画系统
- **页面过渡**: 平滑的页面切换动画
- **微交互**: 按钮悬停、加载状态等
- **滚动效果**: 基于 Lenis 的平滑滚动

### 无障碍访问
- **键盘导航**: 完整的键盘操作支持
- **屏幕阅读器**: ARIA 属性和语义化标签
- **色彩对比**: 符合 WCAG 标准的色彩对比度

## 🔧 开发指南

### 代码规范

- **TypeScript**: 严格的类型检查
- **ESLint**: 代码质量和风格检查
- **Prettier**: 自动代码格式化

### 提交规范

```bash
# 功能提交
git commit -m "feat: 添加用户评论功能"

# 修复提交
git commit -m "fix: 修复移动端布局问题"

# 文档提交
git commit -m "docs: 更新 README 安装指南"
```

### 部署

项目支持 Vercel 一键部署：

1. **连接 GitHub 仓库**
2. **配置环境变量**
3. **自动部署**

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'feat: 添加新功能'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🙏 致谢

感谢以下开源项目的支持：
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://prisma.io/) - 数据库 ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://radix-ui.com/) - 组件库
- [Framer Motion](https://framer.com/motion/) - 动画库

---

## 📞 联系方式

- **网站**: [zick.me](https://zick.me)
- **邮箱**: xdream@gmail.com
- **GitHub**: [@deadlyedge](https://github.com/deadlyedge)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
