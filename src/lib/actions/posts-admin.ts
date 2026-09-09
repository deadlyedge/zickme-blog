'use server'

import * as path from 'node:path'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import JSZip from 'jszip'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { posts, syncLogs, tags } from '@/db/schema'
import { auth } from '@/lib/auth'
import { diffContent, scanLocalContent } from '@/lib/content-diff'
import { postToMarkdown, safeMarkdownFileName } from '@/lib/post-exporter'
import { ContentSyncService } from '@/lib/sync-service'
import type { PostWithTags, StatusType, SyncLog, SyncResult } from '@/types'

const postIdSchema = z.string().min(1).max(128)
const posterSchema = z
	.string()
	.url()
	.refine((value) => /^https?:\/\//i.test(value), '只允许 HTTP(S) 图片地址')

/**
 * 校验当前请求是否为 ADMIN
 */
async function requireAdminSession() {
	const headersList = await headers()
	const session = await auth.api.getSession({
		headers: headersList,
	})

	if (!session?.user?.id || session.user.role !== 'ADMIN') {
		throw new Error('权限不足：需要管理员权限')
	}

	return session
}

/**
 * 1. 获取管理后台文章列表（支持状态、标签、搜索筛选）
 */
export async function getDashboardPosts(options?: {
	status?: StatusType | 'ALL'
	tagSlug?: string
	search?: string
	includeArchived?: boolean
}): Promise<PostWithTags[]> {
	try {
		await requireAdminSession()

		const conditions = []

		if (options?.status && options.status !== 'ALL') {
			conditions.push(eq(posts.status, options.status))
		}

		if (options?.includeArchived) {
			// 包含已归档
		} else if (options?.status === 'ARCHIVED') {
			// 显式查归档
		} else {
			// 默认排除已软删除/归档的
			conditions.push(isNull(posts.archivedAt))
		}

		if (options?.search) {
			const searchTerm = `%${options.search.trim()}%`
			conditions.push(
				sql`(${posts.title} ILIKE ${searchTerm} OR ${posts.slug} ILIKE ${searchTerm})`,
			)
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined

		const results = await db.query.posts.findMany({
			where: whereClause,
			with: {
				postsToTags: {
					with: {
						tag: true,
					},
				},
			},
			orderBy: [desc(posts.updatedAt)],
		})

		let postList = results.map((post) => ({
			...post,
			tags: post.postsToTags.map((pt) => pt.tag),
		})) as PostWithTags[]

		if (options?.tagSlug && options.tagSlug !== 'ALL') {
			postList = postList.filter((p) =>
				p.tags?.some((t) => t.slug === options.tagSlug),
			)
		}

		return postList
	} catch (error) {
		console.error('Failed to get dashboard posts:', error)
		throw new Error(error instanceof Error ? error.message : '获取文章列表失败')
	}
}

export async function updatePostPosterAction(
	postId: string,
	poster: string | null,
) {
	try {
		await requireAdminSession()
		const parsedId = postIdSchema.safeParse(postId)
		if (!parsedId.success) return { success: false, error: '文章 ID 无效' }
		if (poster !== null && !posterSchema.safeParse(poster).success) {
			return { success: false, error: '封面必须是有效的 HTTP(S) 图片地址' }
		}
		await db
			.update(posts)
			.set({ poster, updatedAt: new Date() })
			.where(eq(posts.id, postId))
		revalidatePath('/dashboard/posts')
		revalidatePath('/posts')
		revalidatePath('/')
		return { success: true, poster }
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : '更新封面失败',
		}
	}
}

export async function uploadPostPosterAction(
	postId: string,
	formData: FormData,
) {
	try {
		await requireAdminSession()
		const file = formData.get('file')
		if (!(file instanceof File) || file.size === 0)
			return { success: false, error: '未选择图片' }
		if (!file.type.startsWith('image/'))
			return { success: false, error: '只支持图片文件' }
		if (file.size > 10 * 1024 * 1024)
			return { success: false, error: '图片不能超过 10MB' }
		const service = new ContentSyncService()
		const url = await service.uploadImageBuffer(
			Buffer.from(await file.arrayBuffer()),
			`${postId}-${file.name}`,
		)
		if (!url) return { success: false, error: 'Cloudinary 未配置或上传失败' }
		return await updatePostPosterAction(postId, url)
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : '上传封面失败',
		}
	}
}

export async function exportPostsZipAction() {
	try {
		await requireAdminSession()
		const rows = await db.query.posts.findMany({
			where: isNull(posts.archivedAt),
			with: { postsToTags: { with: { tag: true } } },
		})
		const zip = new JSZip()
		for (const row of rows) {
			const post = {
				...row,
				tags: row.postsToTags.map((item) => item.tag),
			} as PostWithTags
			zip.file(safeMarkdownFileName(post.slug), postToMarkdown(post))
		}
		return {
			success: true,
			fileName: `posts-backup-${new Date().toISOString().slice(0, 10)}.zip`,
			base64: await zip.generateAsync({ type: 'base64' }),
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : '导出文章失败',
		}
	}
}

export async function getRemotePostDiffAction() {
	try {
		await requireAdminSession()
		const local = await scanLocalContent(
			path.join(process.cwd(), 'content/posts'),
		)
		const rows = await db
			.select({ slug: posts.slug, updatedAt: posts.updatedAt })
			.from(posts)
			.where(isNull(posts.archivedAt))
		return {
			success: true,
			posts: diffContent(local, rows).map((item) => item),
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : '获取远端文章失败',
			posts: [],
		}
	}
}

/**
 * 2. 更新文章状态 (PUBLISHED / DRAFT / ARCHIVED 等)
 */
export async function updatePostStatus(postId: string, status: StatusType) {
	try {
		await requireAdminSession()

		const updatePayload: Record<string, any> = {
			status,
			updatedAt: new Date(),
		}

		if (status === 'ARCHIVED') {
			updatePayload.archivedAt = new Date()
		} else {
			updatePayload.archivedAt = null
		}

		await db.update(posts).set(updatePayload).where(eq(posts.id, postId))

		revalidatePath('/dashboard/posts')
		revalidatePath('/posts')
		revalidatePath('/')

		return { success: true }
	} catch (error) {
		console.error('Failed to update post status:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '更新状态失败',
		}
	}
}

/**
 * 3. 批量更新文章状态
 */
export async function batchUpdatePostStatus(
	postIds: string[],
	status: StatusType,
) {
	try {
		await requireAdminSession()

		if (!postIds || postIds.length === 0) {
			return { success: false, error: '未选中任何文章' }
		}

		const updatePayload: Record<string, any> = {
			status,
			updatedAt: new Date(),
		}

		if (status === 'ARCHIVED') {
			updatePayload.archivedAt = new Date()
		} else {
			updatePayload.archivedAt = null
		}

		await db.update(posts).set(updatePayload).where(inArray(posts.id, postIds))

		revalidatePath('/dashboard/posts')
		revalidatePath('/posts')
		revalidatePath('/')

		return { success: true }
	} catch (error) {
		console.error('Failed to batch update post status:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '批量更新状态失败',
		}
	}
}

/**
 * 4. 软删除/归档文章
 */
export async function archivePost(postId: string) {
	return updatePostStatus(postId, 'ARCHIVED')
}

/**
 * 5. 恢复软删除/归档的文章
 */
export async function restorePost(postId: string) {
	return updatePostStatus(postId, 'PUBLISHED')
}

/**
 * 6. 彻底物理删除文章（永久删除）
 */
export async function deletePostPermanently(postId: string) {
	try {
		await requireAdminSession()

		await db.delete(posts).where(eq(posts.id, postId))

		revalidatePath('/dashboard/posts')
		revalidatePath('/posts')
		revalidatePath('/')

		return { success: true }
	} catch (error) {
		console.error('Failed to delete post permanently:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '永久删除文章失败',
		}
	}
}

/**
 * 7. 获取全量标签列表（供筛选使用）
 */
export async function getDashboardTags() {
	try {
		await requireAdminSession()
		return await db.query.tags.findMany({
			orderBy: [desc(tags.name)],
		})
	} catch (error) {
		console.error('Failed to get tags for dashboard:', error)
		return []
	}
}

/**
 * 8. 触发本地全量扫描同步
 */
export async function triggerManualSync(options?: {
	dryRun?: boolean
	deleteOld?: boolean
}): Promise<SyncResult> {
	try {
		await requireAdminSession()

		const service = new ContentSyncService()
		const result = await service.runSync({
			triggerType: 'MANUAL',
			dryRun: options?.dryRun ?? false,
			deleteOld: options?.deleteOld ?? true,
		})

		revalidatePath('/dashboard/posts')
		revalidatePath('/dashboard/sync')
		revalidatePath('/posts')
		revalidatePath('/')

		return result
	} catch (error) {
		console.error('Manual sync failed:', error)
		return {
			success: false,
			status: 'FAILED',
			totalPosts: 0,
			successCount: 0,
			errorCount: 1,
			logs: [
				{
					stage: 'general',
					level: 'error',
					message: '手动同步异常中断',
					detail: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				},
			],
		}
	}
}

/**
 * 9. 上传并导入单个或多个文件 / 压缩包 (Zip / Md)
 */
export async function importUploadedContent(
	formData: FormData,
): Promise<SyncResult> {
	try {
		await requireAdminSession()

		const files = formData.getAll('files') as File[]
		if (!files || files.length === 0) {
			return {
				success: false,
				status: 'FAILED',
				totalPosts: 0,
				successCount: 0,
				errorCount: 1,
				logs: [
					{
						stage: 'frontmatter',
						level: 'error',
						message: '未选择任何上传文件',
						timestamp: new Date().toISOString(),
					},
				],
			}
		}

		const virtualFiles: Array<{ relativePath: string; content: string }> = []
		const virtualImages: Array<{ relativePath: string; buffer: Buffer }> = []

		for (const file of files) {
			const fileName = file.name
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			if (fileName.endsWith('.zip')) {
				const zip = await JSZip.loadAsync(buffer)
				for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
					if (zipEntry.dir) continue
					if (relativePath.startsWith('__MACOSX/')) continue

					if (relativePath.endsWith('.md')) {
						const content = await zipEntry.async('string')
						virtualFiles.push({ relativePath, content })
					} else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(relativePath)) {
						const imgBuffer = await zipEntry.async('nodebuffer')
						virtualImages.push({ relativePath, buffer: imgBuffer })
					}
				}
			} else if (fileName.endsWith('.md')) {
				const content = buffer.toString('utf-8')
				virtualFiles.push({ relativePath: fileName, content })
			} else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(fileName)) {
				virtualImages.push({ relativePath: fileName, buffer })
			}
		}

		const service = new ContentSyncService()
		const result = await service.runSync({
			triggerType: 'UPLOAD',
			virtualFiles,
			virtualImages,
			dryRun: false,
			deleteOld: false,
		})

		revalidatePath('/dashboard/posts')
		revalidatePath('/dashboard/sync')
		revalidatePath('/posts')
		revalidatePath('/')

		return result
	} catch (error) {
		console.error('Import uploaded content failed:', error)
		return {
			success: false,
			status: 'FAILED',
			totalPosts: 0,
			successCount: 0,
			errorCount: 1,
			logs: [
				{
					stage: 'general',
					level: 'error',
					message: '文件上传解析失败',
					detail: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				},
			],
		}
	}
}

/**
 * 10. 获取历史同步日志列表
 */
export async function getSyncHistoryLogs(limit = 20): Promise<SyncLog[]> {
	try {
		await requireAdminSession()

		const logs = await db.query.syncLogs.findMany({
			orderBy: [desc(syncLogs.createdAt)],
			limit,
		})

		return logs
	} catch (error) {
		console.error('Failed to get sync history logs:', error)
		return []
	}
}
