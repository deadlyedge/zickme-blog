import type { Stats } from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import { eq, isNull } from 'drizzle-orm'
import matter from 'gray-matter'
import { marked } from 'marked'
import { db } from '../src/db'
import { posts, postsToTags, tags } from '../src/db/schema'
import { generateSlugFromPath } from '../src/lib/slug'
import type { StatusType } from '../src/types'

interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[] | string
	date?: string
	slug?: string
	status?: string
	draft?: boolean
	sourceUrl?: string
}

interface ProcessedPost {
	slug: string
	title: string
	excerpt?: string
	poster?: string
	content: string
	publishedAt: Date
	tags: string[]
	status: StatusType
	sourceUrl?: string
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
	batchSize: 5,
	deleteOld: !process.argv.includes('--no-delete'),
	cloudinaryBaseUrl:
		'https://res.cloudinary.com/zickme-blog/image/upload/myblog/',
}

/**
 * 转换状态字符串为 StatusType 枚举值
 */
function parseStatusType(
	statusStr: string | undefined,
	draft: boolean | undefined,
): StatusType {
	if (draft === true) return 'DRAFT'
	if (statusStr) {
		const upperStatus = statusStr.toUpperCase()
		if (
			['PUBLISHED', 'DRAFT', 'ARCHIVED', 'PENDING', 'SPAM'].includes(
				upperStatus,
			)
		) {
			return upperStatus as StatusType
		}
	}
	return 'PUBLISHED'
}

/**
 * 规范化标签数组
 */
function normalizeTags(tagsInput: string[] | string | undefined): string[] {
	if (!tagsInput) return []
	if (Array.isArray(tagsInput)) return tagsInput
	if (typeof tagsInput === 'string') {
		return tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0)
	}
	return []
}

/**
 * 从文件名生成标题
 */
function generateTitleFromFileName(fileName: string): string {
	return fileName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * 处理图片URL，根据文件位置找到对应的 Cloudinary 图片
 */
function processImageUrl(
	imagePath: string | undefined,
	config: SyncConfig,
	filePath: string,
	postsDir: string,
): string | undefined {
	if (!imagePath) return undefined

	if (imagePath.startsWith('./images/')) {
		const fileDir = path.dirname(filePath)
		const relativeDir = path.relative(postsDir, fileDir)

		const imageName = imagePath
			.replace('./images/', '')
			.replace(/\.[^/.]+$/, '')
		const fullRelativePath = relativeDir
			? `${relativeDir}/images/${imageName}`
			: `images/${imageName}`
		const publicId = fullRelativePath.replace(/\//g, '-')

		return `${config.cloudinaryBaseUrl}${publicId}`
	}

	if (imagePath.startsWith('/images/')) {
		const imageName = imagePath.replace('/images/', '').replace(/\.[^/.]+$/, '')
		return `${config.cloudinaryBaseUrl}images-${imageName}`
	}

	return imagePath
}

/**
 * 处理 Markdown 内容中的图片链接
 */
function processMarkdownContent(
	content: string,
	config: SyncConfig,
	filePath: string,
	postsDir: string,
): string {
	const renderer = new marked.Renderer()
	const originalImage = renderer.image.bind(renderer)

	renderer.image = (imageToken) => {
		const processedHref = processImageUrl(
			imageToken.href,
			config,
			filePath,
			postsDir,
		)
		return originalImage({
			...imageToken,
			href: processedHref || imageToken.href,
		})
	}

	return marked.parse(content, { renderer }) as string
}

/**
 * 扫描指定目录下的所有 Markdown 文件
 */
async function scanMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await fsPromises.readdir(dir, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			if (entry.name !== 'images') {
				const subFiles = await scanMarkdownFiles(fullPath)
				files.push(...subFiles)
			}
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath)
		}
	}

	return files
}

/**
 * 处理单个 Markdown 文件
 */
async function processMarkdownFile(
	filePath: string,
	config: SyncConfig,
	postsDir: string,
): Promise<ProcessedPost | null> {
	try {
		const fileContent = await fsPromises.readFile(filePath, 'utf-8')
		const stats = await fsPromises.stat(filePath)
		const fileName = path.basename(filePath, '.md')

		const { data, content } = matter(fileContent)
		const frontmatter = data as MarkdownFrontmatter

		const title = frontmatter.title || generateTitleFromFileName(fileName)
		const slug = frontmatter.slug || generateSlugFromPath(filePath, postsDir)
		const publishedAt = frontmatter.date
			? new Date(frontmatter.date)
			: stats.birthtime

		const poster = processImageUrl(
			frontmatter.image,
			config,
			filePath,
			postsDir,
		)
		const processedContent = processMarkdownContent(
			content,
			config,
			filePath,
			postsDir,
		)

		return {
			slug,
			title,
			excerpt: frontmatter.excerpt,
			poster,
			content: processedContent,
			publishedAt,
			tags: normalizeTags(frontmatter.tags),
			status: parseStatusType(frontmatter.status, frontmatter.draft),
			sourceUrl: frontmatter.sourceUrl,
			fileStats: stats,
		}
	} catch (error) {
		console.error(`处理文件失败 ${filePath}:`, error)
		return null
	}
}

/**
 * 预创建或更新所有标签
 */
async function preCreateTags(
	postsList: ProcessedPost[],
	config: SyncConfig,
): Promise<Map<string, string>> {
	const allTags = new Set<string>()
	for (const post of postsList) {
		for (const tag of post.tags) {
			allTags.add(tag)
		}
	}

	const tagNameToId = new Map<string, string>()

	if (config.dryRun) {
		console.log(`🏷️ [DRY RUN] 预处理 ${allTags.size} 个标签`)
		return tagNameToId
	}

	for (const tagName of allTags) {
		const tagSlug = tagName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')

		const existing = await db.query.tags.findFirst({
			where: eq(tags.name, tagName),
		})

		if (existing) {
			tagNameToId.set(tagName, existing.id)
		} else {
			const [newTag] = await db
				.insert(tags)
				.values({
					name: tagName,
					slug: tagSlug || tagName.toLowerCase(),
				})
				.returning()
			if (newTag) {
				tagNameToId.set(tagName, newTag.id)
			}
		}
	}

	return tagNameToId
}

/**
 * 批量同步文章到数据库
 */
async function syncPostsToDatabase(
	postsList: ProcessedPost[],
	tagNameToId: Map<string, string>,
	config: SyncConfig,
): Promise<void> {
	if (config.dryRun) {
		console.log(`📝 [DRY RUN] 准备同步 ${postsList.length} 篇文章:`)
		for (const post of postsList) {
			console.log(`  - [${post.status}] ${post.title} (${post.slug})`)
		}
		return
	}

	for (const post of postsList) {
		// Upsert post
		const existingPost = await db.query.posts.findFirst({
			where: eq(posts.slug, post.slug),
		})

		let postId: string

		if (existingPost) {
			postId = existingPost.id
			await db
				.update(posts)
				.set({
					title: post.title,
					excerpt: post.excerpt,
					poster: post.poster,
					content: post.content,
					publishedAt: post.publishedAt,
					status: post.status,
					sourceUrl: post.sourceUrl,
					archivedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(posts.id, postId))
		} else {
			const [newPost] = await db
				.insert(posts)
				.values({
					slug: post.slug,
					title: post.title,
					excerpt: post.excerpt,
					poster: post.poster,
					content: post.content,
					publishedAt: post.publishedAt,
					status: post.status,
					sourceUrl: post.sourceUrl,
				})
				.returning()
			postId = newPost.id
		}

		// Update tags
		await db.delete(postsToTags).where(eq(postsToTags.postId, postId))

		for (const tagName of post.tags) {
			const tagId = tagNameToId.get(tagName)
			if (tagId) {
				await db.insert(postsToTags).values({
					postId,
					tagId,
				})
			}
		}

		console.log(`✅ 同步完成: ${post.slug}`)
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

	const dbPosts = await db
		.select({ slug: posts.slug })
		.from(posts)
		.where(isNull(posts.archivedAt))

	const deletedSlugs = dbPosts
		.map((p) => p.slug)
		.filter((slug) => !existingSlugs.has(slug))

	if (deletedSlugs.length === 0) return

	if (config.dryRun) {
		console.log(`📋 [DRY RUN] 将标记删除 ${deletedSlugs.length} 篇文章:`)
		for (const slug of deletedSlugs) {
			console.log(`  - ${slug}`)
		}
		return
	}

	for (const slug of deletedSlugs) {
		await db
			.update(posts)
			.set({
				archivedAt: new Date(),
				title: `[已删除] ${slug}`,
			})
			.where(eq(posts.slug, slug))
		console.log(`🗑️ 标记删除: ${slug}`)
	}
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
		const mdFiles = await scanMarkdownFiles(postsDir)
		console.log(`📁 发现 ${mdFiles.length} 个Markdown文件`)

		const processedPosts = await Promise.all(
			mdFiles.map((file) => processMarkdownFile(file, config, postsDir)),
		)

		const validPosts = processedPosts.filter(
			(post): post is ProcessedPost => post !== null,
		)

		if (validPosts.length === 0) {
			console.log('⚠️ 没有有效的文章可同步')
			return
		}

		console.log(`✅ 成功处理 ${validPosts.length} 篇文章`)

		const tagNameToId = await preCreateTags(validPosts, config)
		await syncPostsToDatabase(validPosts, tagNameToId, config)

		const existingSlugs = new Set(validPosts.map((p) => p.slug))
		await handleDeletedPosts(existingSlugs, config)

		console.log('✅ 同步完成！')
	} catch (error) {
		console.error('❌ 同步失败:', error)
		process.exit(1)
	}
}

if (require.main === module) {
	syncPosts().catch(console.error)
}

export type { ProcessedPost, SyncConfig }
export { DEFAULT_CONFIG, syncPosts }
