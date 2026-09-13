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

## 图片相册（Gallery）

相册未来放在 `content/photo-gallery/{album-name}/`，每个相册使用 `album.yaml`，图片只保存处理后的 WebP：

```text
content/photo-gallery/japan-autumn/
├── album.yaml
└── images/
    ├── 001.webp
    └── 002.webp
```

Gallery 前台和管理后台已实现。`album.yaml` 是人工编辑源，`gallery.yaml` 是自动生成索引，不要直接编辑。不要将原始 JPEG、PNG、TIFF、BMP 或 RAW 文件提交到 Gallery 目录；原始输入只能放入 Git 忽略的 `content/.gallery-input/{album}/`。处理图片后执行 `bun run gallery:index`，再进行检查和同步。

## 常用命令

```bash
bun run content:check
bun run content:fix
bun run content:format
bun run content:verify
bun run content:prepare
bun run gallery:index
bun run content:check -- --no-examples
bun run publish -- --scope all --dry-run --json
bun run publish -- --scope all
bun run publish -- --scope posts --dry-run --json
bun run sync -- --scope galleries --dry-run --json
bun run sync:pull
bun run gallery:pull -- --patch ./gallery-patch.yaml --dry-run
```

不带 `--scope` 的 `bun run publish` 默认发布 Post 和 Gallery，等价于 `bun run publish -- --scope all`。`--scope posts` 和 `--scope galleries` 用于单域预览或受控发布；`sync` 与 `sync:galleries` 仍作为兼容入口保留。

`content:format` 默认只预览 Frontmatter 和 `album.yaml` 的结构格式，不修改文件；确认后使用 `bun run content:format -- --write`。`content:verify` 运行完整检查和三个 scope 的 dry-run，`content:prepare` 是提交前预览流程，默认不写文件、不执行真实同步、不 commit、不 push。

`sync:pull` 默认不会覆盖已有本地文件。确认无冲突后才使用：

```bash
bun run sync:pull -- --force
```

不要提交 `.env`、密钥、数据库导出文件和 Gallery 原始图片。

Cloudinary 缺失时 Post-only 流程仍可运行；非 dry-run Gallery 媒体同步需要三项 Cloudinary 环境变量。若全站同步中 Gallery 配置不可用，先使用 `--scope posts` 完成 Post 同步，再修复 Gallery 配置并按 scope 重跑。新环境先执行 `bun run db:migrate`，再使用 `bun run reset-admin-password` 初始化或重置管理员。生产环境禁止使用 `bun run db:reset`。
