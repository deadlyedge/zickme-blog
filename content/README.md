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

建议手动填写唯一 `slug`。中文标题会自动转换为拼音，但重名时 Publish 会停止，不会覆盖其他文章。

## 图片相册（Gallery）

相册未来放在 `content/photo-gallery/{album-name}/`，每个相册使用 `album.yaml`，图片只保存处理后的 WebP：

```text
content/photo-gallery/japan-autumn/
├── album.yaml
└── images/
    ├── 001.webp
    └── 002.webp
```

Gallery 前台和管理后台已实现。`album.yaml` 是人工编辑源，`gallery.yaml` 是自动生成索引，不要直接编辑。不要将原始 JPEG、PNG、TIFF、BMP 或 RAW 文件提交到 Gallery 目录；原始输入只能放入 Git 忽略的 `content/.gallery-input/{album}/`。处理图片后执行 `bun run content:prepare-media` 和 `bun run gallery:index`，再执行 Publish。

## 站点设置（Site）

站点外观和公开资料也由 Git 管理，文件结构如下：

```text
content/site/
├── profile.yaml
├── social.yaml
├── skills.yaml
├── slogans.yaml
├── theme.yaml
├── landing.yaml
├── about.yaml
└── portrait.webp       # 可选；profile.yaml 中 portraitImage: portrait.webp 时必需
```

Landing 配置将 `pinnedPostIds` 改为稳定的 `pinnedPostSlugs`。Site 发布时会解析 slug 并写入当前数据库 ID；`all` 发布先处理 Posts 再处理 Site。头像须为有效 WebP，本地文件上传 Cloudinary 后写入运行时 profile；YAML 不记录外部头像 URL。

## 常用命令

```bash
bun run content:check
bun run content:check -- --scope galleries --no-examples
bun run content:fix -- --dry-run
bun run content:fix -- --scope posts
bun run content:fix -- --scope galleries
bun run content:format
bun run content:prepare-media
bun run content:verify
bun run gallery:index
bun run content:check -- --no-examples
bun run publish -- --scope all --dry-run --json
bun run publish -- --scope all
bun run publish -- --scope posts --dry-run --json
bun run publish -- --scope galleries --dry-run --json
bun run publish -- --scope site --dry-run --json
bun run publish -- --scope site
bun run site:export
```

不带 `--scope` 的 `bun run publish` 默认发布 Post、Gallery 和 Site，等价于 `bun run publish -- --scope all`。`--scope posts`、`--scope galleries` 和 `--scope site` 用于单域预览或受控发布。旧同步 CLI 已删除。

`content:check` 是只读命令，即使误传 `--fix` 也不会修改 Markdown 或 YAML。`content:fix` 是显式写入修复入口；可用 `--scope posts|galleries|all` 选择范围，并用 `--dry-run` 预览而不落盘。修复后请审查 Git diff，并人工确认新建的 `album.yaml` 字段。

`content:format` 默认只预览 Frontmatter、`album.yaml` 和 `content/site/*.yaml` 的结构格式，不修改文件；确认后使用 `bun run content:format -- --write`。`content:verify` 运行完整检查和 Post/Gallery/Site/all 的 dry-run，默认不写文件、不执行真实 Publish、不 commit、不 push。

数据库不再回写 Markdown/YAML。内容恢复请使用 Git 历史：`git log -- content/posts`、`git revert <commit>` 或恢复分支/tag。

不要提交 `.env`、密钥、数据库导出文件和 Gallery 原始图片。

Cloudinary 缺失时 Post dry-run 仍可运行；非 dry-run Gallery 发布需要三项 Cloudinary 环境变量。新环境先执行 `bun run db:migrate`，再使用 `bun run reset-admin-password` 初始化或重置管理员。`bun run db:reset` 只清空当前 schema 的网站运行时数据，不执行 migration；重置后可运行 `bun run publish -- --scope all --no-delete` 从本地 `content/` 重建运行时副本。当前正式 schema baseline 是 `drizzle/0000_stage12_baseline.sql`。
