import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { eq, isNull } from 'drizzle-orm'
import matter from 'gray-matter'
import sharp from 'sharp'
import { db } from '@/db'
import { posts, postsToTags, syncLogs, tags } from '@/db/schema'
import { normalizePostMetadata } from '@/lib/post-metadata'
import { generateSlug, generateSlugFromPath } from '@/lib/slug'
import type {
	PostMetadata,
	StatusType,
	SyncLogItem,
	SyncResult,
	SyncStatus,
} from '@/types'

const MAX_IMAGE_WIDTH = 3840
const MAX_IMAGE_HEIGHT = 2160

export interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[] | string
	date?: string
	slug?: string
	status?: string
	draft?: boolean
	sourceUrl?: string
	links?: unknown[]
	github?: string
	demo?: string
	figma?: string
	paper?: string
	category?: string
	series?: string
	canonicalUrl?: string
	outdatedWarning?: string
	layout?: 'article' | 'gallery' | 'photo'
}

export interface ProcessedPost {
	slug: string
	title: string
	excerpt?: string
	poster?: string
	content: string
	publishedAt: Date
	tags: string[]
	status: StatusType
	sourceUrl?: string
	metadata: PostMetadata
}

export interface SyncRunnerOptions {
	triggerType?: 'MANUAL' | 'UPLOAD' | 'CLI'
	dryRun?: boolean
	deleteOld?: boolean
	customPostsDir?: string
	virtualFiles?: Array<{
		relativePath: string
		content: string
	}>
	virtualImages?: Array<{
		relativePath: string
		buffer: Buffer
	}>
}

export function parseStatusType(
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

export function normalizeTags(
	tagsInput: string[] | string | undefined,
): string[] {
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

export function generateTitleFromFileName(fileName: string): string {
	return fileName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export class ContentSyncService {
	private logs: SyncLogItem[] = []
	private cloudinaryConfigured = false
	private cloudinaryBaseUrl =
		'https://res.cloudinary.com/zickme-blog/image/upload/myblog/'

	constructor() {
		if (
			process.env.CLOUDINARY_CLOUD_NAME &&
			process.env.CLOUDINARY_API_KEY &&
			process.env.CLOUDINARY_API_SECRET
		) {
			cloudinary.config({
				cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
				api_key: process.env.CLOUDINARY_API_KEY,
				api_secret: process.env.CLOUDINARY_API_SECRET,
				secure: true,
			})
			this.cloudinaryBaseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/myblog/`
			this.cloudinaryConfigured = true
		}
	}

	private addLog(
		stage: SyncLogItem['stage'],
		level: SyncLogItem['level'],
		message: string,
		detail?: string,
	) {
		this.logs.push({
			stage,
			level,
			message,
			detail,
			timestamp: new Date().toISOString(),
		})
	}

	private async scanMarkdownFiles(dir: string): Promise<string[]> {
		const files: string[] = []
		try {
			const entries = await fsPromises.readdir(dir, { withFileTypes: true })
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name)
				if (entry.isDirectory()) {
					if (entry.name !== '.obsidian' && entry.name !== 'node_modules') {
						const subFiles = await this.scanMarkdownFiles(fullPath)
						files.push(...subFiles)
					}
				} else if (entry.isFile() && entry.name.endsWith('.md')) {
					files.push(fullPath)
				}
			}
		} catch (error) {
			this.addLog(
				'frontmatter',
				'warn',
				`扫描目录失败: ${dir}`,
				error instanceof Error ? error.message : String(error),
			)
		}
		return files
	}

	private async optimizeImageBuffer(
		inputBuffer: Buffer,
	): Promise<{ buffer: Buffer; format: string; resized: boolean }> {
		try {
			const image = sharp(inputBuffer)
			const metadata = await image.metadata()

			let resized = false
			let pipeline = image

			if (
				(metadata.width && metadata.width > MAX_IMAGE_WIDTH) ||
				(metadata.height && metadata.height > MAX_IMAGE_HEIGHT)
			) {
				pipeline = pipeline.resize({
					width: MAX_IMAGE_WIDTH,
					height: MAX_IMAGE_HEIGHT,
					fit: 'inside',
					withoutEnlargement: true,
				})
				resized = true
			}

			const outputBuffer = await pipeline.webp({ quality: 85 }).toBuffer()
			return { buffer: outputBuffer, format: 'webp', resized }
		} catch {
			return { buffer: inputBuffer, format: 'original', resized: false }
		}
	}

	private async uploadBufferToCloudinary(
		buffer: Buffer,
		publicId: string,
	): Promise<string | null> {
		if (!this.cloudinaryConfigured) {
			this.addLog(
				'media',
				'warn',
				`Cloudinary 未配置环境变量，跳过远程上传: ${publicId}`,
			)
			return `${this.cloudinaryBaseUrl}${publicId}`
		}

		try {
			const { buffer: optimizedBuffer, resized } =
				await this.optimizeImageBuffer(buffer)

			if (resized) {
				this.addLog(
					'media',
					'info',
					`图片超过 4K 规范已自动等比缩小优化: ${publicId}`,
				)
			}

			return new Promise((resolve) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						public_id: publicId,
						resource_type: 'image',
						overwrite: true,
					},
					(error, result) => {
						if (error || !result) {
							this.addLog(
								'media',
								'error',
								`Cloudinary 上传失败: ${publicId}`,
								error?.message,
							)
							resolve(null)
						} else {
							this.addLog(
								'media',
								'success',
								`图片成功上传至 Cloudinary: ${publicId}`,
								result.secure_url,
							)
							resolve(result.secure_url)
						}
					},
				)
				uploadStream.end(optimizedBuffer)
			})
		} catch (err) {
			this.addLog(
				'media',
				'error',
				`处理图片异常: ${publicId}`,
				err instanceof Error ? err.message : String(err),
			)
			return null
		}
	}

	public async uploadImageBuffer(
		buffer: Buffer,
		publicId: string,
	): Promise<string | null> {
		if (!this.cloudinaryConfigured) {
			this.addLog('media', 'error', '封面上传失败：Cloudinary 未配置')
			return null
		}
		const optimized = await sharp(buffer)
			.resize({
				width: MAX_IMAGE_WIDTH,
				height: MAX_IMAGE_HEIGHT,
				fit: 'inside',
				withoutEnlargement: true,
			})
			.webp({ quality: 85, effort: 4 })
			.toBuffer()
		return this.uploadBufferToCloudinary(
			optimized,
			publicId.replace(/[^a-zA-Z0-9_-]/g, '-'),
		)
	}

	private async parseMarkdown(
		rawContent: string,
		relativeFilePath: string,
		virtualImagesMap?: Map<string, Buffer>,
		basePostsDir?: string,
	): Promise<ProcessedPost | null> {
		const fileName = path.basename(relativeFilePath, '.md')

		try {
			const { data: frontmatter, content: rawBody } = matter(
				rawContent,
			) as unknown as {
				data: MarkdownFrontmatter
				content: string
			}

			const title =
				frontmatter.title?.trim() || generateTitleFromFileName(fileName)
			const slug =
				frontmatter.slug?.trim() ||
				(basePostsDir
					? generateSlugFromPath(relativeFilePath, basePostsDir)
					: generateSlug(relativeFilePath.replace(/\.md$/i, '')))

			if (!title) {
				this.addLog('frontmatter', 'error', `文章标题缺失: ${relativeFilePath}`)
				return null
			}

			if (!slug) {
				this.addLog(
					'frontmatter',
					'error',
					`无法生成 Slug: ${relativeFilePath}`,
				)
				return null
			}

			this.addLog(
				'frontmatter',
				'info',
				`解析文章 Frontmatter: [${title}] (slug: ${slug})`,
			)

			let poster = frontmatter.image
			if (poster) {
				poster = await this.resolveAndUploadImage(
					poster,
					relativeFilePath,
					virtualImagesMap,
					basePostsDir,
				)
			}

			const processedContent = await this.resolveMarkdownImages(
				rawBody,
				relativeFilePath,
				virtualImagesMap,
				basePostsDir,
			)

			const publishedAt = frontmatter.date
				? new Date(frontmatter.date)
				: new Date()
			const status = parseStatusType(frontmatter.status, frontmatter.draft)
			const tags = normalizeTags(frontmatter.tags)
			const metadata = normalizePostMetadata({
				...frontmatter,
				links: frontmatter.links,
			})

			return {
				slug,
				title,
				excerpt: frontmatter.excerpt || undefined,
				poster: poster || undefined,
				content: processedContent,
				publishedAt,
				tags,
				status,
				sourceUrl: frontmatter.sourceUrl || undefined,
				metadata,
			}
		} catch (error) {
			this.addLog(
				'frontmatter',
				'error',
				`解析 Markdown 语法失败: ${relativeFilePath}`,
				error instanceof Error ? error.message : String(error),
			)
			return null
		}
	}

	private async resolveAndUploadImage(
		imagePath: string,
		relativeFilePath: string,
		virtualImagesMap?: Map<string, Buffer>,
		basePostsDir?: string,
	): Promise<string> {
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
			return imagePath
		}

		const fileDir = path.dirname(relativeFilePath)
		let normalizedImgPath = imagePath
		if (imagePath.startsWith('./')) normalizedImgPath = imagePath.slice(2)
		if (imagePath.startsWith('/')) normalizedImgPath = imagePath.slice(1)

		const combinedPath =
			fileDir && fileDir !== '.'
				? path.join(fileDir, normalizedImgPath)
				: normalizedImgPath
		const cleanCombinedPath = combinedPath.replace(/\\/g, '/')
		const publicId = cleanCombinedPath
			.replace(/\.[^/.]+$/, '')
			.replace(/[\\/]/g, '-')

		if (virtualImagesMap) {
			for (const [vPath, buf] of virtualImagesMap.entries()) {
				const normVPath = vPath.replace(/\\/g, '/')
				if (
					normVPath === cleanCombinedPath ||
					normVPath.endsWith(normalizedImgPath)
				) {
					const url = await this.uploadBufferToCloudinary(buf, publicId)
					return url || `${this.cloudinaryBaseUrl}${publicId}`
				}
			}
		}

		if (basePostsDir) {
			const absoluteImgPath = path.resolve(
				path.isAbsolute(relativeFilePath)
					? path.dirname(relativeFilePath)
					: path.join(basePostsDir, path.dirname(relativeFilePath)),
				imagePath,
			)

			try {
				const imgStat = await fsPromises.stat(absoluteImgPath)
				if (imgStat.isFile()) {
					const buf = await fsPromises.readFile(absoluteImgPath)
					const url = await this.uploadBufferToCloudinary(buf, publicId)
					return url || `${this.cloudinaryBaseUrl}${publicId}`
				}
			} catch {
				// fallback
			}
		}

		return `${this.cloudinaryBaseUrl}${publicId}`
	}

	private async resolveMarkdownImages(
		content: string,
		relativeFilePath: string,
		virtualImagesMap?: Map<string, Buffer>,
		basePostsDir?: string,
	): Promise<string> {
		const imageReplacements: Array<{ original: string; replaced: string }> = []
		const imgRegex = /!\[(.*?)\]\((.*?)\)/g
		const matches = Array.from(content.matchAll(imgRegex))

		for (const match of matches) {
			const fullMatch = match[0]
			const altText = match[1]
			const src = match[2]?.split(' ')[0]

			if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
				const uploadedUrl = await this.resolveAndUploadImage(
					src,
					relativeFilePath,
					virtualImagesMap,
					basePostsDir,
				)
				imageReplacements.push({
					original: fullMatch,
					replaced: `![${altText}](${uploadedUrl})`,
				})
			}
		}

		let finalContent = content
		for (const rep of imageReplacements) {
			finalContent = finalContent.replace(rep.original, rep.replaced)
		}

		return finalContent
	}

	private async savePostsToDb(
		postsList: ProcessedPost[],
		dryRun = false,
	): Promise<number> {
		if (dryRun) {
			this.addLog(
				'db',
				'info',
				`[DRY RUN 预览模式] 校验通过，预计写入/更新 ${postsList.length} 篇文章`,
			)
			return postsList.length
		}

		const allTagNames = Array.from(
			new Set(postsList.flatMap((p) => p.tags)),
		).filter(Boolean)
		const tagNameToId = new Map<string, string>()

		for (const tagName of allTagNames) {
			const tagSlug = generateSlug(tagName)
			try {
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
							slug: tagSlug,
						})
						.returning()
					tagNameToId.set(tagName, newTag.id)
					this.addLog('db', 'info', `创建新标签: ${tagName}`)
				}
			} catch (err) {
				this.addLog(
					'db',
					'warn',
					`处理标签失败: ${tagName}`,
					err instanceof Error ? err.message : String(err),
				)
			}
		}

		let successCount = 0
		for (const post of postsList) {
			try {
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
							metadata: post.metadata,
							archivedAt: null,
							updatedAt: new Date(),
						})
						.where(eq(posts.id, postId))
					this.addLog(
						'db',
						'success',
						`文章更新成功: [${post.title}] (${post.slug})`,
					)
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
							metadata: post.metadata,
						})
						.returning()
					postId = newPost.id
					this.addLog(
						'db',
						'success',
						`文章新建入库: [${post.title}] (${post.slug})`,
					)
				}

				await db.delete(postsToTags).where(eq(postsToTags.postId, postId))
				for (const tName of post.tags) {
					const tId = tagNameToId.get(tName)
					if (tId) {
						await db.insert(postsToTags).values({
							postId,
							tagId: tId,
						})
					}
				}
				successCount++
			} catch (err) {
				this.addLog(
					'db',
					'error',
					`写入文章失败: ${post.slug}`,
					err instanceof Error ? err.message : String(err),
				)
			}
		}

		return successCount
	}

	public async runSync(options: SyncRunnerOptions = {}): Promise<SyncResult> {
		this.logs = []
		const triggerType = options.triggerType || 'MANUAL'
		const dryRun = options.dryRun || false

		this.addLog(
			'general',
			'info',
			`🚀 开始执行内容同步 (${triggerType} 模式${dryRun ? ' - 预览' : ''})`,
		)

		const processedPosts: ProcessedPost[] = []

		if (options.virtualFiles && options.virtualFiles.length > 0) {
			this.addLog(
				'frontmatter',
				'info',
				`检测到内存/上传文件: ${options.virtualFiles.length} 个 Markdown 文件`,
			)

			const virtualImagesMap = new Map<string, Buffer>()
			if (options.virtualImages) {
				for (const img of options.virtualImages) {
					virtualImagesMap.set(img.relativePath, img.buffer)
				}
				this.addLog(
					'media',
					'info',
					`关联随附图片资源: ${options.virtualImages.length} 张`,
				)
			}

			for (const file of options.virtualFiles) {
				const post = await this.parseMarkdown(
					file.content,
					file.relativePath,
					virtualImagesMap,
				)
				if (post) processedPosts.push(post)
			}
		} else {
			const postsDir =
				options.customPostsDir || path.join(process.cwd(), 'content/posts')
			this.addLog('frontmatter', 'info', `扫描本地文章目录: ${postsDir}`)

			const files = await this.scanMarkdownFiles(postsDir)
			this.addLog(
				'frontmatter',
				'info',
				`发现 ${files.length} 个 Markdown 文件`,
			)

			for (const file of files) {
				try {
					const content = await fsPromises.readFile(file, 'utf-8')
					const relativePath = path.relative(postsDir, file)
					const post = await this.parseMarkdown(
						content,
						relativePath,
						undefined,
						postsDir,
					)
					if (post) processedPosts.push(post)
				} catch (err) {
					this.addLog(
						'frontmatter',
						'error',
						`读取文件失败: ${file}`,
						err instanceof Error ? err.message : String(err),
					)
				}
			}
		}

		const slugMap = new Map<string, string>()
		const uniquePosts: ProcessedPost[] = []
		for (const p of processedPosts) {
			if (slugMap.has(p.slug)) {
				this.addLog(
					'frontmatter',
					'warn',
					`发现重复的 Slug: "${p.slug}" (已跳过重复项: ${p.title})`,
				)
			} else {
				slugMap.set(p.slug, p.title)
				uniquePosts.push(p)
			}
		}

		const successCount = await this.savePostsToDb(uniquePosts, dryRun)
		const errorCount = uniquePosts.length - successCount

		if (
			options.deleteOld &&
			!options.virtualFiles &&
			uniquePosts.length > 0 &&
			!dryRun
		) {
			try {
				const existingSlugs = new Set(uniquePosts.map((p) => p.slug))
				const dbPosts = await db
					.select({ slug: posts.slug })
					.from(posts)
					.where(isNull(posts.archivedAt))

				const deletedSlugs = dbPosts
					.map((p) => p.slug)
					.filter((slug) => !existingSlugs.has(slug))

				for (const slug of deletedSlugs) {
					await db
						.update(posts)
						.set({
							archivedAt: new Date(),
							status: 'ARCHIVED',
						})
						.where(eq(posts.slug, slug))
					this.addLog('db', 'warn', `本地已移除，标记文章归档: ${slug}`)
				}
			} catch (err) {
				this.addLog(
					'db',
					'warn',
					'处理归档清理失败',
					err instanceof Error ? err.message : String(err),
				)
			}
		}

		const status: SyncStatus =
			errorCount === 0 ? 'SUCCESS' : successCount > 0 ? 'PARTIAL' : 'FAILED'

		if (!dryRun) {
			try {
				await db.insert(syncLogs).values({
					triggerType,
					status,
					totalPosts: String(uniquePosts.length),
					successCount: String(successCount),
					errorCount: String(errorCount),
					logs: this.logs,
				})
			} catch (err) {
				console.error('Failed to save sync log to database:', err)
			}
		}

		this.addLog(
			'general',
			status === 'SUCCESS' ? 'success' : 'warn',
			`🏁 同步任务结束: 总计 ${uniquePosts.length} 篇，成功 ${successCount} 篇，失败 ${errorCount} 篇`,
		)

		return {
			success: status !== 'FAILED',
			status,
			totalPosts: uniquePosts.length,
			successCount,
			errorCount,
			logs: this.logs,
		}
	}
}
