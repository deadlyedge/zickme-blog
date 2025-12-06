# 个人博客部署文档：GitHub Actions 全自动化方案

## 🎯 项目架构总览

```
GitHub Markdown + Images
    ↓ push 触发
GitHub Actions (Cloudinary + Neon Sync)
    ↓ 数据库更新
Vercel Next.js (Prisma + Server Actions)
    ↓ 展示 + 互动 (评论/标签)
```

**总成本**：**$0**（全免费层）
**自动化程度**：100%（git push 即完成）

## 📋 开发步骤

### **Step 1: 环境准备（10分钟）**

#### 1.1 服务注册 & API Key
| 服务 | 注册地址 | 获取内容 | GitHub Secrets 名 |
|------|----------|----------|------------------|
| **Cloudinary** | [cloudinary.com](https://cloudinary.com) | Cloud Name, API Key, API Secret | `CLOUDINARY_*` |
| **Neon Postgres** | [neon.tech](https://neon.tech) | Database URL | `NEON_DATABASE_URL` |

#### 1.2 GitHub Secrets 配置
```
仓库 → Settings → Secrets and variables → Actions → New repository secret
```

```
CLOUDINARY_CLOUD_NAME     # your-cloud-name
CLOUDINARY_API_KEY        # 123456789012345
CLOUDINARY_API_SECRET     # abcdefghijklmnopqrstuvwxyz
NEON_DATABASE_URL         # postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db
```

### **Step 2: 项目结构调整（15分钟）**

```
my-blog/
├── content/
│   ├── posts/           # *.md 文件
│   └── images/          # 图片文件夹
├── prisma/
│   └── schema.prisma    # 数据库模型
├── scripts/
│   └── sync-content.ts  # 同步脚本
├── app/                 # 你的 Next.js 前端
├── .github/workflows/
│   ├── media.yml        # Cloudinary 上传
│   └── sync-db.yml      # Neon 同步
└── package.json
```

#### 2.1 MD 文件规范（`content/posts/my-first-post.md`）
```markdown
---
slug: "my-first-post"
title: "我的第一篇文章"
excerpt: "简短描述"
image: "./images/hero.webp"
tags: ["Next.js", "Prisma"]
date: "2025-12-06"
---

正文内容，支持 Markdown 语法...
![内嵌图片](./images/inline.webp)
```

### **Step 3: 核心代码实现（20分钟）**

#### 3.1 Prisma Schema (`prisma/schema.prisma`)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  excerpt     String?
  image       String?  // Cloudinary CDN URL
  tags        String[]
  content     String   // HTML (marked 转换)
  published   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  content   String
  author    String
  createdAt DateTime @default(now())
  
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

#### 3.2 同步脚本 (`scripts/sync-content.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';
import marked from 'marked';

const prisma = new PrismaClient();

async function syncPosts() {
  console.log('🚀 开始同步内容...');
  
  const postsDir = path.join(process.cwd(), 'content/posts');
  const files = await fs.readdir(postsDir);
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    console.log(`📄 处理: ${file}`);
    const filePath = path.join(postsDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);
    
    // Cloudinary URL 转换
    const imageUrl = frontmatter.image?.startsWith('./images/')
      ? frontmatter.image.replace('./images/', 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/myblog/')
      : frontmatter.image;
    
    await prisma.post.upsert({
      where: { slug: frontmatter.slug as string },
      update: {
        title: frontmatter.title as string,
        excerpt: frontmatter.excerpt as string,
        image: imageUrl,
        tags: frontmatter.tags as string[],
        content: marked(body),
        published: new Date(frontmatter.date as string),
        updatedAt: new Date(),
      },
      create: {
        slug: frontmatter.slug as string,
        title: frontmatter.title as string,
        excerpt: frontmatter.excerpt as string,
        image: imageUrl,
        tags: frontmatter.tags as string[],
        content: marked(body),
        published: new Date(frontmatter.date as string),
      }
    });
  }
  
  await prisma.$disconnect();
  console.log('✅ 同步完成！');
}

syncPosts().catch(console.error);
```

#### 3.3 GitHub Actions 工作流

**`media.yml`**（上传媒体）
```yaml
name: Upload Media to Cloudinary
on:
  push:
    paths:
      - 'content/images/**'
      - 'content/posts/**'
jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Upload to Cloudinary
        uses: cloudinary/actions@master
        env:
          CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
        with:
          folder: 'myblog'
          source: './content/images/*'
          overwrite: true
```

**`sync-db.yml`**（同步数据库）
```yaml
name: Sync Content to Database
on:
  workflow_run:
    workflows: ["Upload Media to Cloudinary"]
    types: [completed]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Sync to Neon
        env:
          DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
        run: |
          npx prisma generate
          npx prisma db push
          npx tsx scripts/sync-content.ts
```

#### 3.4 package.json 脚本
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "sync": "tsx scripts/sync-content.ts",
    "db:push": "prisma db push"
  },
  "devDependencies": {
    "prisma": "^5.10.0",
    "tsx": "^4.7.0"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "marked": "^13.0.2"
  }
}
```

### **Step 4: 前端集成（已有代码微调，5分钟）**

#### 4.1 Server Actions (`app/actions.ts`)
```typescript
'use server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function addComment(formData: FormData) {
  const postId = formData.get('postId') as string;
  const content = formData.get('content') as string;
  const author = formData.get('author') as string || '匿名用户';
  
  await prisma.comment.create({
    data: { postId, content, author }
  });
  
  revalidatePath(`/posts/${postId}`);
}
```

#### 4.2 数据获取 (`app/posts/[slug]/page.tsx`)
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { comments: { orderBy: { createdAt: 'desc' } } }
  });
  
  return (
    <article>
      <img src={post?.image} alt={post?.title} />
      <div dangerouslySetInnerHTML={{ __html: post?.content || '' }} />
      {/* 评论列表 + 新增表单 */}
    </article>
  );
}
```

### **Step 5: 部署 & 测试（5分钟）**

#### 5.1 Vercel 部署
```
1. vercel.com → Import GitHub Repo
2. Framework: Next.js
3. 自动检测 Prisma → 添加 DATABASE_URL 到 Vercel Environment Variables
4. Deploy!
```

#### 5.2 测试流程
```
1. content/posts/test.md + content/images/hero.webp
2. git add . && git commit -m "Add test post" && git push
3. ✅ Actions 自动跑完 (2-3分钟)
4. ✅ 访问 your-site.vercel.app/posts/test
```

## 🚀 故障排查

| 问题 | 解决方法 |
|------|----------|
| **Actions 失败** | Actions 日志 → 检查 Secrets 是否正确 |
| **图片 404** | Cloudinary Dashboard 确认上传 → 检查 URL 替换逻辑 |
| **Prisma 连不上** | Vercel Env → `DATABASE_URL` 是否包含 `?pgbouncer=true` |
| **内容不同步** | `npx prisma studio` 检查数据库 → 手动跑 `npm run sync` |

## 📈 扩展功能（可选）

```
- Clerk/NextAuth 登录系统
- 搜索 (pg_trgm / tsvector)
- RSS 生成
- OG 图片 (Cloudinary template)
```

**🎉 完成！** 现在你有了一个完全自动化的博客系统，`git push` 即上线！

**需要帮助？** 贴出具体的 Actions 错误日志或 Prisma 问题，我帮你 debug！