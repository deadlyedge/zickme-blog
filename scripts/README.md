# Content Management Scripts

本目录包含用于管理博客内容的工具脚本。

## 📋 脚本概览

### 1. `sync-content.ts` - 内容同步脚本
将本地 Markdown 文件同步到数据库。

**使用方法:**
```bash
# 预览模式 (推荐先运行)
npx tsx scripts/sync-content.ts --dry-run

# 执行同步
npx tsx scripts/sync-content.ts

# 跳过删除已不存在的文件
npx tsx scripts/sync-content.ts --no-delete
```

### 2. `check-content.ts` - 内容检查和格式化脚本
检查并格式化本地 Markdown 文件的 frontmatter。

**使用方法:**
```bash
# 预览检查 (推荐先运行)
npx tsx scripts/check-content.ts --dry-run

# 显示完整的字段指南和示例
npx tsx scripts/check-content.ts

# 自动修复发现的问题
npx tsx scripts/check-content.ts --fix

# 仅显示检查结果，不显示指南
npx tsx scripts/check-content.ts --no-examples
```

## 📚 Markdown Frontmatter 字段指南

### 🔹 通用字段 (所有文章都需要)
- `title`: 文章标题 (必需)
- `date`: 发布时间 (格式: YYYY-MM-DD, 建议填写)
- `tags`: 标签数组或逗号分隔字符串 (建议填写)
- `status`: 文章状态 (published/draft/archived/pending/spam)
- `draft`: 布尔值，设为true表示草稿 (优先级高于status)

### 🔹 博客文章字段
- `excerpt`: 文章摘要 (建议填写)
- `image`: 封面图片路径 (./images/xxx.jpg)

### 🔹 项目展示字段
- `excerpt`: 项目简介 (必需)
- `images`: 项目截图数组
  - `image`: 图片路径
  - `caption`: 图片说明 (可选)
- `sourceUrl`: 项目源码链接 (可选)

## 💡 使用建议

1. **创建新内容时**: 先运行 `check-content.ts` 查看字段指南
2. **批量检查**: 使用 `check-content.ts --dry-run` 检查所有文件
3. **自动修复**: 使用 `check-content.ts --fix` 自动标准化格式
4. **同步前检查**: 同步到数据库前先用 `check-content.ts` 确保格式正确
5. **预览同步**: 使用 `sync-content.ts --dry-run` 预览将要进行的更改

## 📝 示例

### 博客文章
```yaml
---
title: "React 最佳实践指南"
date: "2025-12-09"
tags: ["React", "JavaScript", "前端开发"]
status: "published"
excerpt: "本文介绍了React开发中的最佳实践和常见模式"
image: "./images/react-guide.jpg"
---
```

### 项目展示
```yaml
---
title: "个人博客网站"
date: "2025-12-08"
tags: ["Next.js", "React", "TypeScript"]
status: "published"
excerpt: "使用Next.js构建的现代化个人博客网站"
images:
  - image: "./images/homepage.jpg"
    caption: "网站首页截图"
  - image: "./images/blog-post.jpg"
    caption: "博客文章页面"
sourceUrl: "https://github.com/username/blog"
---
```
