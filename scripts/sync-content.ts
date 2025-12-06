import { prisma } from '@/lib/prisma'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'
import { marked } from 'marked'

interface MarkdownFrontmatter {
	title: string
	excerpt?: string
	image?: string
	tags: string[]
	date: string
}

async function syncPosts() {
	console.log('🚀 开始双向同步...')

	const postsDir = path.join(process.cwd(), 'content/posts')
	const mdFiles = (await fs.readdir(postsDir))
		.filter((file) => file.endsWith('.md'))
		.map((file) => file.replace('.md', ''))

	// 1️⃣ 先删除 Postgres 中不存在的文章（保留 7 天）
	const dbSlugs = await prisma.post.findMany({ select: { slug: true } })
	const dbSlugsSet = new Set(dbSlugs.map((p) => p.slug))
	const mdSlugsSet = new Set(mdFiles)

	for (const dbSlug of dbSlugsSet) {
		if (!mdSlugsSet.has(dbSlug)) {
			console.log(`🗑️  标记删除: ${dbSlug}`)
			// 软删除：保留评论历史 7 天
			await prisma.post.updateMany({
				where: { slug: dbSlug },
				data: {
					deletedAt: new Date(),
					title: `[已删除] ${dbSlug}`,
				},
			})
		}
	}

	// 2️⃣ 同步现有文章
	for (const slug of mdFiles) {
		const filePath = path.join(postsDir, `${slug}.md`)
		const content = await fs.readFile(filePath, 'utf8')
		const { data: frontmatter, content: body } = matter(content) as unknown as {
			data: MarkdownFrontmatter
			content: string
		}

		const imageUrl = frontmatter.image?.startsWith('./images/')
			? frontmatter.image.replace(
					'./images/',
					'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/myblog/',
				)
			: frontmatter.image

		await prisma.post.upsert({
			where: { slug },
			update: {
				title: frontmatter.title,
				excerpt: frontmatter.excerpt,
				image: imageUrl,
				tags: frontmatter.tags,
				content: await marked(body),
				published: new Date(frontmatter.date),
				deletedAt: null, // 恢复
			},
			create: {
				slug,
				title: frontmatter.title,
				excerpt: frontmatter.excerpt,
				image: imageUrl,
				tags: frontmatter.tags,
				content: await marked(body),
				published: new Date(frontmatter.date),
			},
		})

		console.log(`✅ 更新: ${slug}`)
	}

	// 3️⃣ 清理超过 7 天的删除文章 + 评论
	await prisma.post.deleteMany({
		where: {
			deletedAt: {
				lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 天前
			},
		},
	})

	console.log('✅ 同步完成！')
	await prisma.$disconnect()
}

syncPosts().catch(console.error)
