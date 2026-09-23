import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import { eq, isNull } from 'drizzle-orm'
import matter from 'gray-matter'
import { db } from '@/db'
import { posts, syncLogs } from '@/db/schema'
import {
	generateTitleFromFileName,
	normalizeTags,
	parseStatusType,
} from '@/lib/content/post-frontmatter'
import { createLogger } from '@/lib/logger'
import { uploadPostImage } from '@/lib/media/post-media'
import { normalizePostMetadata } from '@/lib/post-metadata'
import { PostMediaResolver } from '@/lib/publish/post-media-resolver'
import { postRepository } from '@/lib/publish/post-repository'
import { generateSlug, generateSlugFromPath } from '@/lib/slug'
import type {
	MarkdownFrontmatter,
	ProcessedPost,
	SyncRunnerOptions,
} from '@/types/post-types'
import type { SyncLogItem, SyncResult, SyncStatus } from '@/types/sync'

export type {
	MarkdownFrontmatter,
	ProcessedPost,
	SyncRunnerOptions,
} from '@/types/post-types'

const logger = createLogger('lib/publish/post-publish-service')

export {
	generateTitleFromFileName,
	normalizeTags,
	parseStatusType,
} from '@/lib/content/post-frontmatter'

export class PostPublishService {
	private logs: SyncLogItem[] = []
	private dryRun = false
	private mediaResolver: PostMediaResolver | null = null

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

	private async uploadBufferToCloudinary(
		buffer: Buffer,
		publicId: string,
	): Promise<string | null> {
		return uploadPostImage(buffer, publicId, {
			dryRun: this.dryRun,
			onLog: (level, message, detail) =>
				this.addLog(
					'media',
					level === 'info' ? 'info' : level,
					message,
					detail,
				),
		})
	}

	public async uploadImageBuffer(
		buffer: Buffer,
		publicId: string,
	): Promise<string | null> {
		return this.uploadBufferToCloudinary(buffer, publicId)
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
				if (!this.mediaResolver)
					throw new Error('Post media resolver is not initialized')
				poster = await this.mediaResolver.resolveAndUploadImage(
					poster,
					relativeFilePath,
					slug,
					virtualImagesMap,
					basePostsDir,
				)
			}

			if (!this.mediaResolver)
				throw new Error('Post media resolver is not initialized')
			const processedContent = await this.mediaResolver.resolveMarkdownImages(
				rawBody,
				relativeFilePath,
				slug,
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
				sourcePath: relativeFilePath.replace(/\\/g, '/'),
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
		return postRepository.savePosts(postsList, (...args) =>
			this.addLog(...args),
		)
	}
	public async runPublish(
		options: SyncRunnerOptions = {},
	): Promise<SyncResult> {
		this.logs = []
		const triggerType = options.triggerType || 'MANUAL'
		const dryRun = options.dryRun || false
		this.dryRun = dryRun
		this.mediaResolver = new PostMediaResolver({
			dryRun,
			uploadBuffer: (buffer, publicId) =>
				this.uploadBufferToCloudinary(buffer, publicId),
		})

		this.addLog(
			'general',
			'info',
			`🚀 开始执行内容同步 (${triggerType} 模式${dryRun ? ' - 预览' : ''})`,
		)

		const processedPosts: ProcessedPost[] = []
		let parseErrorCount = 0
		let scannedPostCount = 0

		if (options.virtualFiles && options.virtualFiles.length > 0) {
			scannedPostCount = options.virtualFiles.length
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
				else parseErrorCount++
			}
		} else {
			const postsDir =
				options.customPostsDir || path.join(process.cwd(), 'content/posts')
			this.addLog('frontmatter', 'info', `扫描本地文章目录: ${postsDir}`)

			const files = await this.scanMarkdownFiles(postsDir)
			scannedPostCount = files.length
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
					else parseErrorCount++
				} catch (err) {
					parseErrorCount++
					this.addLog(
						'frontmatter',
						'error',
						`读取文件失败: ${file}`,
						err instanceof Error ? err.message : String(err),
					)
				}
			}
		}

		const slugMap = new Map<string, ProcessedPost>()
		const conflictingSlugs = new Set<string>()
		const uniquePosts: ProcessedPost[] = []
		for (const p of processedPosts) {
			if (slugMap.has(p.slug)) {
				conflictingSlugs.add(p.slug)
				this.addLog(
					'frontmatter',
					'error',
					`发现重复的 Slug: "${p.slug}"`,
					`冲突文件: ${slugMap.get(p.slug)?.sourcePath} 与 ${p.sourcePath}，请手动指定唯一 slug`,
				)
			} else {
				slugMap.set(p.slug, p)
				uniquePosts.push(p)
			}
		}
		const safePosts = uniquePosts.filter(
			(post) => !conflictingSlugs.has(post.slug),
		)

		const successCount = await this.savePostsToDb(safePosts, dryRun)
		const errorCount = parseErrorCount + processedPosts.length - successCount
		let sourceMissing: string[] = []
		if (!dryRun && !options.virtualFiles) {
			const dbPosts = await db
				.select({ slug: posts.slug })
				.from(posts)
				.where(isNull(posts.archivedAt))
			const currentSlugs = new Set(safePosts.map((post) => post.slug))
			sourceMissing = dbPosts
				.map((post) => post.slug)
				.filter((slug) => !currentSlugs.has(slug))
		}

		if (
			options.deleteOld &&
			!options.virtualFiles &&
			uniquePosts.length > 0 &&
			!dryRun
		) {
			try {
				const existingSlugs = new Set(safePosts.map((p) => p.slug))
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
					totalPosts: String(scannedPostCount),
					successCount: String(successCount),
					errorCount: String(errorCount),
					logs: this.logs,
				})
			} catch (err) {
				logger.error('Failed to save sync log to database', err)
			}
		}

		this.addLog(
			'general',
			status === 'SUCCESS' ? 'success' : 'warn',
			`🏁 同步任务结束: 总计 ${scannedPostCount} 篇，成功 ${successCount} 篇，失败 ${errorCount} 篇`,
		)

		return {
			success: status === 'SUCCESS',
			status,
			totalPosts: scannedPostCount,
			successCount,
			errorCount,
			logs: this.logs,
			sourceMissing,
		}
	}

	/** Temporary compatibility alias while the Sync orchestrator is migrated. */
	public async runSync(options: SyncRunnerOptions = {}): Promise<SyncResult> {
		return this.runPublish(options)
	}
}
