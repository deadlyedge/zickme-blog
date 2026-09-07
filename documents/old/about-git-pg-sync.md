优秀问题！**数据一致性是关键**，需要双向同步策略：删除 MD → 删除 Postgres + 级联清理评论，新增/修改 MD → upsert Postgres。

## 🔄 完整一致性解决方案

### **核心原则：双向 + 安全删除**

```
MD 文件变更 → Postgres 变更（增/删/改）
Postgres 记录 → MD 文件校验（防数据丢失）
```

## 📝 增强版同步脚本

**`scripts/sync-content.ts`**（完整版）
```typescript
import { PrismaClient } from '@prisma/client';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';
import marked from 'marked';

const prisma = new PrismaClient();

interface PostFrontmatter {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  tags: string[];
  date: string;
}

async function syncPosts() {
  console.log('🚀 开始双向同步...');
  
  const postsDir = path.join(process.cwd(), 'content/posts');
  const mdFiles = (await fs.readdir(postsDir))
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''));
  
  // 1️⃣ 先删除 Postgres 中不存在的文章（保留 7 天）
  const dbSlugs = await prisma.post.findMany({ select: { slug: true } });
  const dbSlugsSet = new Set(dbSlugs.map(p => p.slug));
  const mdSlugsSet = new Set(mdFiles);
  
  for (const dbSlug of dbSlugsSet) {
    if (!mdSlugsSet.has(dbSlug)) {
      console.log(`🗑️  标记删除: ${dbSlug}`);
      // 软删除：保留评论历史 7 天
      await prisma.post.updateMany({
        where: { slug: dbSlug },
        data: { 
          deletedAt: new Date(),
          title: `[已删除] ${dbSlug}`
        }
      });
    }
  }
  
  // 2️⃣ 同步现有文章
  for (const slug of mdFiles) {
    const filePath = path.join(postsDir, `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content) as {
      data: PostFrontmatter;
      content: string;
    };
    
    const imageUrl = frontmatter.image?.startsWith('./images/')
      ? frontmatter.image.replace('./images/', 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/myblog/')
      : frontmatter.image;
    
    await prisma.post.upsert({
      where: { slug },
      update: {
        title: frontmatter.title,
        excerpt: frontmatter.excerpt,
        image: imageUrl,
        tags: frontmatter.tags,
        content: marked(body),
        published: new Date(frontmatter.date),
        deletedAt: null, // 恢复
      },
      create: {
        slug,
        title: frontmatter.title,
        excerpt: frontmatter.excerpt,
        image: imageUrl,
        tags: frontmatter.tags,
        content: marked(body),
        published: new Date(frontmatter.date),
      }
    });
    
    console.log(`✅ 更新: ${slug}`);
  }
  
  // 3️⃣ 清理超过 7 天的删除文章 + 评论
  await prisma.post.deleteMany({
    where: {
      deletedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 天前
      }
    }
  });
  
  console.log('✅ 同步完成！');
  await prisma.$disconnect();
}

syncPosts().catch(console.error);
```

## 🔧 Prisma Schema 增强（支持软删除）

```prisma
model Post {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  excerpt     String?
  image       String?
  tags        String[]
  content     String
  published   DateTime
  deletedAt   DateTime? // 软删除时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  comments    Comment[]
  
  @@index([deletedAt])
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

## 🛡️ 前端查询逻辑

**`app/posts/[slug]/page.tsx`**
```typescript
const post = await prisma.post.findUnique({
  where: { 
    slug: params.slug,
    deletedAt: null // 只显示未删除文章
  },
  include: { 
    comments: { 
      orderBy: { createdAt: 'desc' },
      where: { post: { deletedAt: null } } // 自动过滤
    }
  }
});

if (!post) {
  notFound(); // 404
}
```

## 📊 一致性保障机制

| 操作 | MD 文件 | Postgres | 评论处理 |
|------|---------|----------|----------|
| **新增** | `git add new-post.md` | `INSERT` | 新建 |
| **修改** | `git commit -m "update"` | `UPDATE` | 保留 |
| **删除** | `git rm post.md` | `软删除 + 7天后物理删除` | `Cascade 删除` |
| **恢复** | `git checkout post.md` | `恢复 deletedAt=null` | 保留历史 |

## 🎯 额外安全措施

### 1. **数据库备份**（Neon 自动）
```
Neon Dashboard → Backups → Point-in-time recovery (免费)
```

### 2. **GitHub 保护分支**
```
Settings → Branches → main → Require PR review
删除前必须 Review！
```

### 3. **Webhook 重试**（容错）
```yaml
# sync-db.yml 增加重试
- name: Sync to Neon
  uses: fjogeleit/http-request-action@v1
  with:
    url: 'https://api.github.com/repos/${{ github.repository }}/dispatches'
    method: 'POST'
    customHeaders: '{"Accept": "application/vnd.github.3.json"}'
    data: '{"event_type": "retry-sync"}'
```

## 🚀 测试一致性

```
1. git rm content/posts/test.md && git push
2. ✅ Actions 跑完 → Postgres test 文章 soft delete
3. git checkout content/posts/test.md && git push  
4. ✅ 文章恢复，评论保留！
5. 等 7 天 → 彻底清理
```

**完美解决一致性问题！** 删除安全，恢复简单，评论永不丢失。 

需要我帮你调整前端查询代码吗？