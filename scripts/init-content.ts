import * as fs from 'node:fs/promises'
import * as path from 'node:path'

type TemplateFile = { relativePath: string; content: string }

const args = process.argv.slice(2)
const force = args.includes('--force')
const dryRun = args.includes('--dry-run')
const dirIndex = args.indexOf('--dir')
const customDir = dirIndex >= 0 ? args[dirIndex + 1] : undefined

if (dirIndex >= 0 && (!customDir || customDir.startsWith('--'))) {
	console.error('错误：--dir 需要提供一个目录路径。')
	process.exit(1)
}

const contentDir = path.resolve(
	customDir || path.join(process.cwd(), 'content'),
)

const templates: TemplateFile[] = [
	{
		relativePath: 'README.md',
		content: `# 内容目录说明

## 普通文章

将 Markdown 文件放入 content/posts/，图片放在文章同级的 images/ 目录。

示例：

\`\`\`text
content/posts/my-post.md
content/posts/images/cover.webp
\`\`\`

文章至少包含：

\`\`\`yaml
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
\`\`\`

建议手动填写唯一 slug。中文标题会自动转换为拼音，但重名时同步会失败，不会覆盖其他文章。

## 图片相册（Stage 6 规划中）

相册未来放在 content/photo-gallery/{album-name}/，每个相册使用 album.yaml，图片只保存处理后的 WebP：

\`\`\`text
content/photo-gallery/japan-autumn/
├── album.yaml
└── images/
    ├── 001.webp
    └── 002.webp
\`\`\`

Gallery 目前尚未实现。不要将原始 JPEG、PNG、TIFF、BMP 或 RAW 文件提交到 Gallery 目录。计划见 documents/development-plan-stage6.md。

## 常用命令

\`\`\`bash
bun run content:check
bun run content:fix
bun run sync -- --dry-run
bun run sync
bun run sync:pull
\`\`\`

sync:pull 默认不会覆盖已有文件。确认无冲突后才使用 bun run sync:pull -- --force。

不要提交 .env、密钥、数据库导出文件和 Gallery 原始图片。
`,
	},
	{
		relativePath: 'templates/post.md',
		content: `---
title: 我的文章标题
slug: my-post-slug
date: 2026-09-09
status: draft
tags:
  - Next.js
excerpt: 文章摘要
image: ./images/cover.webp
# links:
#   - label: GitHub
#     url: https://github.com/your-name/your-repository
#     type: github
---

# 我的文章标题

在这里写 Markdown 正文。
`,
	},
	{
		relativePath: 'templates/album.yaml',
		content: `slug: example-album
title: 示例相册
description: 相册描述
date: 2026-09-09
status: draft
cover: ''
tags: []
location: ''
layout: masonry
sort: filename
showExif: false
showLocation: false
images: []
`,
	},
	{
		relativePath: 'photo-gallery/gallery.yaml',
		content:
			"# This file is generated. Do not edit manually.\ngeneratedAt: ''\nalbums: []\n",
	},
	{
		relativePath: 'photo-gallery/example-album/album.yaml',
		content: `slug: example-album
title: 示例相册
description: ''
date: 2026-09-09
status: draft
cover: ''
tags: []
layout: masonry
sort: filename
showExif: false
showLocation: false
images: []
`,
	},
	{ relativePath: 'posts/.gitkeep', content: '' },
	{ relativePath: 'posts/images/.gitkeep', content: '' },
	{ relativePath: 'photo-gallery/example-album/images/.gitkeep', content: '' },
]

async function exists(filePath: string) {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

async function main() {
	console.log(`${dryRun ? '[预览] ' : ''}内容模板目录: ${contentDir}`)
	for (const template of templates) {
		const target = path.join(contentDir, template.relativePath)
		const alreadyExists = await exists(target)
		console.log(
			`- ${alreadyExists ? (force ? '覆盖' : '跳过') : '创建'}: ${path.relative(process.cwd(), target)}`,
		)
		if (dryRun || (alreadyExists && !force)) continue
		await fs.mkdir(path.dirname(target), { recursive: true })
		await fs.writeFile(target, template.content, 'utf8')
	}
	console.log(
		dryRun
			? '预览完成，没有修改文件。'
			: '内容模板初始化完成。已有文件默认未被覆盖。',
	)
}

main().catch((error) => {
	console.error('内容模板初始化失败:', error)
	process.exitCode = 1
})
