请参考 https://www.juice.agency 设计我的主页，参考 https://www.juice.agency/work 设计我的projects页面。

# Next.js + Payload CMS 博客+简历网站开发指南

## 📋 项目概述

这是一个基于 **Next.js 16** + **Payload CMS** + **PostgreSQL** 的个人博客和简历网站项目。项目已经配置了基础架构，现在需要分步完善内容建模、前端页面和功能实现。

### 🛠️ 技术栈

- **前端框架**: Next.js 16 (App Router)
- **内容管理系统**: Payload CMS 3.65.0
- **数据库**: PostgreSQL
- **样式**: Tailwind CSS 4.x
- **类型安全**: TypeScript + Payload自动生成类型
- **包管理**: Bun

### 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (frontend)/        # 前端页面
│   ├── (payload)/         # Payload管理后台
│   └── api/               # API路由
├── collections/           # Payload内容模型
│   ├── Users.ts          # 用户管理 ✅
│   └── Media.ts          # 媒体文件 ✅
├── lib/                   # 工具库
└── payload-types.ts       # 自动生成的类型定义
```

### 🎯 开发目标

1. **博客功能**: 发布技术文章，支持Markdown格式
2. **简历展示**: 展示个人经历、技能和项目经验
3. **管理后台**: 易用的内容管理界面
4. **响应式设计**: 适配桌面端和移动端
5. **SEO优化**: 良好的搜索引擎优化

---

## 🚀 开发步骤

### 第一阶段：环境配置和基础设置

#### 1. 数据库和环境配置

**1.1 PostgreSQL数据库设置**

确保PostgreSQL服务正在运行，并创建数据库：

```bash
# 创建数据库
createdb zick_me_blog

# 或使用Docker
docker run --name postgres-blog -e POSTGRES_DB=zick_me_blog -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

**1.2 环境变量配置**

创建 `.env.local` 文件：

```env
# 数据库连接
DATABASE_URL=postgresql://postgres:password@localhost:5432/zick_me_blog

# Payload配置
PAYLOAD_SECRET=your-super-secret-key-here

# Next.js配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**1.3 运行项目**

```bash
# 安装依赖
bun install

# 生成Payload类型
bun run generate:types

# 运行数据库迁移
bun run db:fresh

# 启动开发服务器
bun run dev
```

#### 2. Payload初始化

访问 `http://localhost:3000/admin` 创建第一个管理员用户。

---

### 第二阶段：内容建模

#### 1. 创建博客文章Collection

创建 `src/collections/Posts.ts`：

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'createdAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: '博客文章标题',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL友好的标识符',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.title && !data.slug) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return data?.slug
          },
        ],
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: '文章内容，支持Markdown',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: '文章摘要（可选）',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: '特色图片',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: '文章标签',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: '发布日期',
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (siblingData.status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
}
```

#### 2. 创建标签Collection

创建 `src/collections/Tags.ts`：

```typescript
import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: '标签名称',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL友好的标识符',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.name && !data.slug) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return data?.slug
          },
        ],
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: '标签颜色 (可选)',
      },
    },
  ],
}
```

#### 3. 创建项目经验Collection

创建 `src/collections/Projects.ts`：

```typescript
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'longDescription',
      type: 'richText',
    },
    {
      name: 'technologies',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'demoUrl',
      type: 'text',
      admin: {
        description: '演示地址',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: '源码地址',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: '设为精选项目',
      },
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
  ],
}
```

#### 4. 创建个人资料Collection

创建 `src/collections/Profile.ts`：

```typescript
import type { CollectionConfig } from 'payload'

export const Profile: CollectionConfig = {
  slug: 'profile',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: '职位头衔',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            'GitHub',
            'LinkedIn',
            'Twitter',
            'Instagram',
            'YouTube',
            'Other',
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'username',
          type: 'text',
        },
      ],
    },
    {
      name: 'skills',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
        },
        {
          name: 'technologies',
          type: 'array',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'level',
              type: 'select',
              options: [
                { label: '入门', value: 'beginner' },
                { label: '熟悉', value: 'intermediate' },
                { label: '熟练', value: 'advanced' },
                { label: '专家', value: 'expert' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
```

#### 5. 更新Payload配置

修改 `src/payload.config.ts`：

```typescript
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Projects } from './collections/Projects'
import { Profile } from './collections/Profile'

export default buildConfig({
  // ... 其他配置
  collections: [Users, Media, Posts, Tags, Projects, Profile],
  // ... 其他配置
})
```

#### 6. 生成新类型

```bash
bun run generate:types
```

---

### 第三阶段：前端页面开发

#### 1. 更新主页

修改 `src/app/(frontend)/page.tsx`：

```typescript
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // 获取最新文章
  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    limit: 5,
  })

  // 获取个人资料
  const profile = await payload.find({
    collection: 'profile',
    limit: 1,
  })

  const profileData = profile.docs[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              {profileData?.name || 'Your Name'}
            </Link>
            <div className="space-x-6">
              <Link href="/blog" className="hover:underline">博客</Link>
              <Link href="/projects" className="hover:underline">项目</Link>
              <Link href="/about" className="hover:underline">关于</Link>
              {user && (
                <a
                  href={payloadConfig.routes.admin}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded"
                >
                  管理后台
                </a>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          {profileData?.avatar && (
            <Image
              src={profileData.avatar.url!}
              alt={profileData.name}
              width={120}
              height={120}
              className="rounded-full mx-auto mb-6"
            />
          )}
          <h1 className="text-4xl font-bold mb-4">{profileData?.name}</h1>
          <p className="text-xl text-muted-foreground mb-6">{profileData?.title}</p>
          <p className="text-lg max-w-2xl mx-auto">{profileData?.bio}</p>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">最新文章</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.docs.map((post) => (
              <article key={post.id} className="bg-card rounded-lg p-6 shadow">
                {post.featuredImage && (
                  <Image
                    src={post.featuredImage.url!}
                    alt={post.title}
                    width={400}
                    height={200}
                    className="rounded mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((tag: any) => (
                    <span key={tag.id} className="bg-secondary px-2 py-1 rounded text-sm">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/blog" className="bg-primary text-primary-foreground px-6 py-3 rounded">
              查看全部文章
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
```

#### 2. 创建博客列表页面

创建 `src/app/(frontend)/blog/page.tsx`：

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function BlogPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
  })

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">博客文章</h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.docs.map((post) => (
          <article key={post.id} className="bg-card rounded-lg overflow-hidden shadow">
            {post.featuredImage && (
              <Image
                src={post.featuredImage.url!}
                alt={post.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags?.map((tag: any) => (
                  <span key={tag.id} className="bg-secondary px-2 py-1 rounded text-sm">
                    {tag.name}
                  </span>
                ))}
              </div>
              <time className="text-sm text-muted-foreground">
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
              </time>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
```

#### 3. 创建博客详情页面

创建 `src/app/(frontend)/blog/[slug]/page.tsx`：

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { RichText } from '@/components/RichText'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: 'published',
      },
    },
  })

  if (!posts.docs.length) {
    notFound()
  }

  const post = posts.docs[0]

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          {post.featuredImage && (
            <Image
              src={post.featuredImage.url!}
              alt={post.title}
              width={800}
              height={400}
              className="rounded-lg mb-6"
            />
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag: any) => (
              <span key={tag.id} className="bg-secondary px-3 py-1 rounded">
                {tag.name}
              </span>
            ))}
          </div>

          <time className="text-muted-foreground">
            发布于 {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
          </time>
        </header>

        <div className="prose prose-lg max-w-none">
          <RichText content={post.content} />
        </div>
      </article>
    </div>
  )
}
```

#### 4. 创建项目展示页面

创建 `src/app/(frontend)/projects/page.tsx`：

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function ProjectsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const projects = await payload.find({
    collection: 'projects',
    sort: '-createdAt',
  })

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">项目经验</h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.docs.map((project) => (
          <div key={project.id} className="bg-card rounded-lg overflow-hidden shadow">
            {project.images?.[0] && (
              <Image
                src={project.images[0].image.url!}
                alt={project.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
              <p className="text-muted-foreground mb-4">{project.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies?.map((tech: any, index: number) => (
                  <span key={index} className="bg-secondary px-2 py-1 rounded text-sm">
                    {tech.name}
                  </span>
                ))}
              </div>

              <div className="flex gap-4">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    演示
                  </a>
                )}
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    源码
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 5. 创建关于页面

创建 `src/app/(frontend)/about/page.tsx`：

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'

export default async function AboutPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const profile = await payload.find({
    collection: 'profile',
    limit: 1,
  })

  const profileData = profile.docs[0]

  if (!profileData) {
    return <div>暂无个人资料</div>
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          {profileData.avatar && (
            <Image
              src={profileData.avatar.url!}
              alt={profileData.name}
              width={300}
              height={300}
              className="rounded-lg"
            />
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4">{profileData.name}</h1>
          <p className="text-xl text-muted-foreground mb-6">{profileData.title}</p>
          <p className="text-lg mb-6">{profileData.bio}</p>

          {profileData.location && (
            <p className="mb-2">📍 {profileData.location}</p>
          )}

          {profileData.email && (
            <p className="mb-2">📧 {profileData.email}</p>
          )}

          {profileData.website && (
            <p className="mb-6">
              🌐 <a href={profileData.website} className="text-primary hover:underline">
                {profileData.website}
              </a>
            </p>
          )}

          {profileData.socialLinks && (
            <div className="flex gap-4">
              {profileData.socialLinks.map((link: any, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  className="text-2xl hover:opacity-75"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {profileData.skills && (
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">技能专长</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {profileData.skills.map((skill: any, index: number) => (
              <div key={index}>
                <h3 className="text-lg font-semibold mb-4">{skill.category}</h3>
                <div className="space-y-2">
                  {skill.technologies?.map((tech: any, techIndex: number) => (
                    <div key={techIndex} className="flex justify-between">
                      <span>{tech.name}</span>
                      <span className="text-muted-foreground">{tech.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

---

### 第四阶段：样式优化

#### 1. 更新全局样式

修改 `src/app/(frontend)/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .prose {
    color: var(--foreground);
    max-width: none;
  }

  .prose h1 {
    @apply text-3xl font-bold mt-8 mb-4;
  }

  .prose h2 {
    @apply text-2xl font-bold mt-6 mb-3;
  }

  .prose h3 {
    @apply text-xl font-semibold mt-4 mb-2;
  }

  .prose p {
    @apply mb-4;
  }

  .prose ul {
    @apply list-disc list-inside mb-4;
  }

  .prose ol {
    @apply list-decimal list-inside mb-4;
  }

  .prose code {
    @apply bg-muted px-1 py-0.5 rounded text-sm;
  }

  .prose pre {
    @apply bg-muted p-4 rounded overflow-x-auto mb-4;
  }

  .prose blockquote {
    @apply border-l-4 border-primary pl-4 italic;
  }
}
```

#### 2. 创建布局组件

创建 `src/components/Layout.tsx`：

```typescript
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function Header() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const profile = await payload.find({
    collection: 'profile',
    limit: 1,
  })

  const profileData = profile.docs[0]

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            {profileData?.name || 'Your Name'}
          </Link>
          <div className="space-x-6">
            <Link href="/blog" className="hover:underline">博客</Link>
            <Link href="/projects" className="hover:underline">项目</Link>
            <Link href="/about" className="hover:underline">关于</Link>
            {user && (
              <a
                href={payloadConfig.routes.admin}
                className="bg-primary text-primary-foreground px-4 py-2 rounded"
              >
                管理后台
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; 2024 Your Name. All rights reserved.</p>
      </div>
    </footer>
  )
}
```

---

### 第五阶段：功能增强

#### 1. 创建富文本渲染组件

创建 `src/components/RichText.tsx`：

```typescript
'use client'

import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  // 可以在这里添加自定义转换器
})

interface RichTextProps {
  content: any
}

export function RichText({ content }: RichTextProps) {
  return (
    <PayloadRichText
      converters={jsxConverters}
      data={content}
    />
  )
}
```

#### 2. 添加SEO优化

创建 `src/lib/seo.ts`：

```typescript
export function generateMetadata({
  title,
  description,
  image,
  url,
}: {
  title: string
  description?: string
  image?: string
  url?: string
}) {
  const siteName = 'Your Name - Personal Blog'
  const defaultDescription = 'Personal blog and portfolio website'

  return {
    title: `${title} | ${siteName}`,
    description: description || defaultDescription,
    openGraph: {
      title: `${title} | ${siteName}`,
      description: description || defaultDescription,
      url,
      siteName,
      images: image ? [{ url: image }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description: description || defaultDescription,
      images: image ? [image] : [],
    },
  }
}
```

#### 3. 添加搜索功能

创建 `src/app/api/search/route.ts`：

```typescript
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return Response.json({ results: [] })
  }

  const payload = await getPayload({ config: await config })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      and: [
        {
          status: {
            equals: 'published',
          },
        },
        {
          or: [
            {
              title: {
                like: query,
              },
            },
            {
              content: {
                like: query,
              },
            },
          ],
        },
      ],
    },
    limit: 10,
  })

  const results = posts.docs.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    type: 'post',
  }))

  return Response.json({ results })
}
```

---

### 第六阶段：部署和优化

#### 1. Vercel部署配置

创建 `vercel.json`：

```json
{
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2. 环境变量配置

在Vercel中配置以下环境变量：
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`

#### 3. 数据库迁移

```bash
# 在生产环境中运行迁移
bun run db:fresh
```

#### 4. SEO和性能优化

- 配置 `robots.txt`
- 添加站点地图
- 配置Open Graph图片生成
- 启用图片优化

---

## 📝 开发清单

### ✅ 已完成
- [x] 项目初始化
- [x] 数据库配置
- [x] Payload基础设置
- [x] 用户和媒体管理

### 🔄 进行中
- [ ] 创建内容Collections (Posts, Tags, Projects, Profile)
- [ ] 开发前端页面
- [ ] 样式优化
- [ ] SEO配置

### 📋 待完成
- [ ] API开发
- [ ] 搜索功能
- [ ] 部署配置
- [ ] 性能优化
- [ ] 测试编写

---

## 🐛 常见问题

### 1. 类型错误
```bash
bun run generate:types
```

### 2. 数据库连接问题
检查 `DATABASE_URL` 配置是否正确

### 3. Payload admin访问
确保已创建管理员用户

### 4. 图片上传问题
检查Media collection配置和文件权限

---

## 📚 参考资料

- [Payload CMS 文档](https://payloadcms.com/docs)
- [Next.js 16 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

*最后更新: 2024年11月29日*
