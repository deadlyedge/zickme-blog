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

## 图片相册（Stage 6 规划中）

相册未来放在 `content/photo-gallery/{album-name}/`，每个相册使用 `album.yaml`，图片只保存处理后的 WebP：

```text
content/photo-gallery/japan-autumn/
├── album.yaml
└── images/
    ├── 001.webp
    └── 002.webp
```

Gallery 目前尚未实现。不要将原始 JPEG、PNG、TIFF、BMP 或 RAW 文件提交到 Gallery 目录。计划见 `documents/development-plan-stage6.md`。

## 常用命令

```bash
bun run content:check
bun run content:fix
bun run sync -- --dry-run
bun run sync
bun run sync:pull
```

`sync:pull` 默认不会覆盖已有本地文件。确认无冲突后才使用：

```bash
bun run sync:pull -- --force
```

不要提交 `.env`、密钥、数据库导出文件和 Gallery 原始图片。
