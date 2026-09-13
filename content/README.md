# 内容目录说明

## 普通文章

将 Markdown 文件放入 `content/posts/`，图片放在文章同级的 `images/` 目录。

示例：

```text
content/posts/my-post.md
content/posts/images/cover.webp
```

文章至少包含：

```yaml
---
title: 我的文章标题
slug: my-post-slug
date: 2026-09-09
status: draft
tags:
  - Next.js
excerpt: 文章摘要
image: ./images/cover.webp
---
```

建议手动填写唯一 `slug`。中文标题会自动转换为拼音，但重名时同步会失败，不会覆盖其他文章。

## 图片相册（Stage 7）

相册未来放在 `content/photo-gallery/{album-name}/`，每个相册使用 `album.yaml`，图片只保存处理后的 WebP：

```text
content/photo-gallery/japan-autumn/
├── album.yaml
└── images/
    ├── 001.webp
    └── 002.webp
```

Gallery 前台和管理后台已实现。`album.yaml` 是人工编辑源，`gallery.yaml` 是自动生成索引，不要直接编辑。不要将原始 JPEG、PNG、TIFF、BMP 或 RAW 文件提交到 Gallery 目录；原始输入只能放入 Git 忽略的 `content/.gallery-input/{album}/`，先执行 `bun run sync:galleries -- --dry-run`。

## 常用命令

```bash
bun run content:check
bun run content:fix
bun run sync -- --dry-run
bun run sync
bun run sync:pull
bun run gallery:index
bun run sync:galleries -- --dry-run
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
```

`sync:pull` 默认不会覆盖已有本地文件。确认无冲突后才使用：

```bash
bun run sync:pull -- --force
```

不要提交 `.env`、密钥、数据库导出文件和 Gallery 原始图片。

Cloudinary 缺失时 Post-only 流程仍可运行；非 dry-run Gallery 媒体同步需要三项 Cloudinary 环境变量。新环境先执行 `bun run db:migrate`，再使用 `bun run reset-admin-password` 初始化或重置管理员。生产环境禁止使用 `bun run db:reset`。
