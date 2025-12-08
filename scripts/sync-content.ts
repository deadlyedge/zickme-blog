import { prisma } from '../src/lib/prisma'
import matter from 'gray-matter'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import { marked } from 'marked'
import { generateSlug } from '../src/lib/slug'
import type { Stats } from 'fs'

interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[]
	date?: string
	slug?: string
}

interface ProcessedPost {
	slug: string
	title: string
	excerpt?: string
	poster?: string
	content: string
	publishedAt: Date
	tags: string[]
	type: 'BLOG' | 'PROJECT'
	fileStats: Stats
}

interface SyncConfig {
	dryRun: boolean
	batchSize: number
	deleteOld: boolean
	cloudinaryBaseUrl: string
}

const DEFAULT_CONFIG: SyncConfig = {
	dryRun: process.argv.includes('--dry-run'),
	batchSize: 2, // 进一步减少批量大小到2，避免事务超时
	deleteOld: !process.argv.includes('--no-delete'),
	cloudinaryBaseUrl:
		'https://res.cloudinary.com/zickme-blog/image/upload/myblog/',
}

/**
 * 从文件名生成标题
 */
function generateTitleFromFileName(fileName: string): string {
	return fileName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}



/**
 * 根据文件路径判断文章类型
 */
function getPostType(filePath: string, postsDir: string): 'BLOG' | 'PROJECT' {
	const relativePath = path.relative(postsDir, filePath)
	if (relativePath.startsWith('blogs/')) return 'BLOG'
	if (relativePath.startsWith('projects/')) return 'PROJECT'
	return 'BLOG' // 默认值
}

/**
 * 从文件路径生成slug，支持多级文件夹
 */
function generateSlugFromPath(filePath: string, postsDir: string): string {
	const relativePath = path.relative(postsDir, filePath) // blogs/tech/前端开发.md
	const pathWithoutExt = relativePath.replace(/\.md$/, '') // blogs/tech/前端开发
	const pathParts = pathWithoutExt.split('/') // ['blogs', 'tech', '前端开发']

	// 对每个路径部分进行slugify
	const slugParts = pathParts.map(part => generateSlug(part))

	return slugParts.join('-') // blogs-tech-前端开发
}

/**
 * 处理图片URL，根据文件位置找到对应的Cloudinary图片
 */
function processImageUrl(
	imagePath: string | undefined,
	config: SyncConfig,
	filePath: string,
	postsDir: string,
): string | undefined {
	if (!imagePath) return undefined

	// 新的引用格式：./images/xxx.jpg
	if (imagePath.startsWith('./images/')) {
		// 获取当前文件所在的文件夹
		const fileDir = path.dirname(filePath)
		const relativeDir = path.relative(postsDir, fileDir)

		// 构建Cloudinary publicId路径
		const imageName = imagePath.replace('./images/', '').replace(/\.[^/.]+$/, '')
		const publicIdPath = relativeDir ? `${relativeDir}-images-${imageName}` : `images-${imageName}`

		return `${config.cloudinaryBaseUrl}${publicIdPath}`
	}

	return imagePath
}

/**
 * 递归扫描所有Markdown文件
 */
async function scanMarkdownFiles(dirPath: string): Promise<string[]> {
	const files: string[] = []

	async function scan(dir: string) {
		const entries = await fsPromises.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				// 递归扫描子文件夹
				await scan(fullPath)
			} else if (entry.isFile() && entry.name.endsWith('.md')) {
				files.push(fullPath)
			}
		}
	}

	await scan(dirPath)
	return files
}

/**
 * 处理单个Markdown文件
 */
async function processMarkdownFile(
	filePath: string,
	config: SyncConfig,
	postsDir: string,
): Promise<ProcessedPost | null> {
	try {
		const [content, stats] = await Promise.all([
			fsPromises.readFile(filePath, 'utf8'),
			fsPromises.stat(filePath),
		])

		const { data: frontmatter, content: body } = matter(content) as unknown as {
			data: MarkdownFrontmatter
			content: string
		}

		const fileName = path.basename(filePath, '.md')

		// 智能字段生成
		const title = frontmatter.title || generateTitleFromFileName(fileName)
		const slug = frontmatter.slug || generateSlugFromPath(filePath, postsDir)
		const type = getPostType(filePath, postsDir)
		const publishedAt = frontmatter.date
			? new Date(frontmatter.date)
			: stats.mtime

		const poster = processImageUrl(frontmatter.image, config, filePath, postsDir)

		// 替换正文中的图片地址
		let processedBody = body

		// 处理新的 ./images/ 引用
		processedBody = processedBody.replace(
			/!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
			(match, alt, src) => {
				// 获取当前文件所在的文件夹
				const fileDir = path.dirname(filePath)
				const relativeDir = path.relative(postsDir, fileDir)
				const imageName = src.replace(/\.[^/.]+$/, '')
				const publicIdPath = relativeDir ? `${relativeDir}-images-${imageName}` : `images-${imageName}`
				return `![${alt}](${config.cloudinaryBaseUrl}${publicIdPath})`
			},
		)

		// 兼容旧的 ../images/ 引用（过渡期支持）
		processedBody = processedBody.replace(
			/!\[([^\]]*)\]\(\.\.\/images\/([^)]+)\)/g,
			(match, alt, src) => `![${alt}](${config.cloudinaryBaseUrl}${src})`,
		)

		// 在事务外部进行marked转换，减少事务时间
		const htmlContent = await marked(processedBody)

		return {
			slug,
			title,
			excerpt: frontmatter.excerpt,
			poster,
			content: htmlContent,
			publishedAt,
			tags: frontmatter.tags || [],
			type,
			fileStats: stats,
		}
	} catch (error) {
		console.error(`❌ 处理文件失败 ${filePath}:`, error)
		return null
	}
}

/**
 * 预创建所有标签
 */
async function preCreateTags(
	posts: ProcessedPost[],
	config: SyncConfig,
): Promise<void> {
	const allTags = new Set<string>()
	posts.forEach((post) => {
		post.tags.forEach((tag) => allTags.add(tag))
	})

	if (allTags.size === 0) return

	if (config.dryRun) {
		console.log(`📋 [DRY RUN] 将预创建 ${allTags.size} 个标签:`)
		allTags.forEach((tag) => console.log(`  - ${tag}`))
		return
	}

	// 批量创建标签（忽略已存在的）
	const tagCreates = Array.from(allTags).map((tagName: string) => ({
		name: tagName,
		slug: tagName.toLowerCase().replace(/\s+/g, '-'),
	}))

	await prisma.$transaction(async (tx) => {
		for (const tagData of tagCreates) {
			try {
				await tx.tag.upsert({
					where: { name: tagData.name },
					update: {},
					create: tagData,
				})
			} catch (error) {
				console.warn(`⚠️ 标签创建失败: ${tagData.name}`, error)
				// 继续处理其他标签，不要中断
			}
		}
	})

	console.log(`✅ 预创建完成: ${allTags.size} 个标签`)
}

/**
 * 批量同步文章到数据库
 */
async function syncPostsToDatabase(
	posts: ProcessedPost[],
	config: SyncConfig,
): Promise<void> {
	const batches = []
	for (let i = 0; i < posts.length; i += config.batchSize) {
		batches.push(posts.slice(i, i + config.batchSize))
	}

	for (const batch of batches) {
		await prisma.$transaction(async (tx) => {
			for (const post of batch) {
				if (config.dryRun) {
					console.log(`📋 [DRY RUN] 将同步: ${post.slug} - ${post.title}`)
					continue
				}

				// Upsert post
				await tx.post.upsert({
					where: { slug: post.slug },
					update: {
						title: post.title,
						excerpt: post.excerpt,
						poster: post.poster,
						content: post.content,
						publishedAt: post.publishedAt,
						type: post.type,
						archivedAt: null, // 恢复
					},
					create: {
						slug: post.slug,
						title: post.title,
						excerpt: post.excerpt,
						poster: post.poster,
						content: post.content,
						publishedAt: post.publishedAt,
						type: post.type,
					},
				})

				// Handle tags - 现在标签已经预创建，直接连接
				if (post.tags.length > 0) {
					const tagConnections = post.tags.map((tagName: string) => ({
						name: tagName,
					}))

					await tx.post.update({
						where: { slug: post.slug },
						data: {
							tags: {
								set: [], // 清除现有标签
								connect: tagConnections,
							},
						},
					})
				}

				console.log(`✅ 同步完成: ${post.slug}`)
			}
		})
	}
}

/**
 * 处理已删除的文章
 */
async function handleDeletedPosts(
	existingSlugs: Set<string>,
	config: SyncConfig,
): Promise<void> {
	if (!config.deleteOld) return

	const dbSlugs = await prisma.post.findMany({
		where: { archivedAt: null },
		select: { slug: true },
	})

	const deletedSlugs = dbSlugs
		.map((p) => p.slug)
		.filter((slug) => !existingSlugs.has(slug))

	if (deletedSlugs.length === 0) return

	if (config.dryRun) {
		console.log(`📋 [DRY RUN] 将标记删除 ${deletedSlugs.length} 篇文章:`)
		deletedSlugs.forEach((slug) => console.log(`  - ${slug}`))
		return
	}

	await prisma.$transaction(async (tx) => {
		for (const slug of deletedSlugs) {
			await tx.post.update({
				where: { slug },
				data: {
					archivedAt: new Date(),
					title: `[已删除] ${slug}`,
				},
			})
			console.log(`🗑️ 标记删除: ${slug}`)
		}
	})
}

/**
 * 主同步函数
 */
async function syncPosts(config: SyncConfig = DEFAULT_CONFIG) {
	console.log('🚀 开始智能内容同步...')
	console.log(
		`配置: ${config.dryRun ? '预览模式' : '执行模式'}, 批量大小: ${config.batchSize}`,
	)

	const postsDir = path.join(process.cwd(), 'content/posts')

	try {
		// 递归扫描所有Markdown文件
		const mdFiles = await scanMarkdownFiles(postsDir)

		console.log(`📁 发现 ${mdFiles.length} 个Markdown文件`)

		// 并行处理所有文件
		const processedPosts = await Promise.all(
			mdFiles.map((file) => processMarkdownFile(file, config, postsDir)),
		)

		// 过滤掉处理失败的文件
		const validPosts = processedPosts.filter(
			(post): post is ProcessedPost => post !== null,
		)

		if (validPosts.length === 0) {
			console.log('⚠️ 没有有效的文章可同步')
			return
		}

		console.log(`✅ 成功处理 ${validPosts.length} 篇文章`)

		// 预创建标签
		await preCreateTags(validPosts, config)

		// 同步到数据库
		await syncPostsToDatabase(validPosts, config)

		// 处理已删除的文章
		const existingSlugs = new Set(validPosts.map((p: ProcessedPost) => p.slug))
		await handleDeletedPosts(existingSlugs, config)

		console.log('✅ 同步完成！')

		if (config.dryRun) {
			console.log('💡 使用 --dry-run 查看预览，移除参数执行实际同步')
		}
	} catch (error) {
		console.error('❌ 同步失败:', error)
		process.exit(1)
	} finally {
		await prisma.$disconnect()
	}
}

// 如果直接运行此脚本
if (require.main === module) {
	syncPosts().catch(console.error)
}

export { syncPosts, DEFAULT_CONFIG }
export type { SyncConfig, ProcessedPost }
