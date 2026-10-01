'use server'

import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { posts, tags } from '@/db/schema'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireAdminSession } from '@/lib/auth/guards'
import { createLogger } from '@/lib/logger'
import type { PublishWorkflowResult } from '@/lib/publish/publish-workflow'
import { runPublishWorkflow } from '@/lib/publish/publish-workflow'
import type { PostWithTags, StatusType } from '@/types/content/post'

const logger = createLogger('actions/posts-admin')

const postIdSchema = z.string().min(1, '文章ID不能为空').max(128)
const _posterSchema = z
	.url('必须是有效的URL地址')
	.refine((value) => /^https?:\/\//i.test(value), '只允许 HTTP(S) 图片地址')

const getDashboardPostsOptionsSchema = z
	.object({
		status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED', 'ALL']).optional(),
		tagSlug: z.string().max(100).optional(),
		search: z.string().max(100).optional(),
		includeArchived: z.boolean().optional(),
	})
	.optional()

const _updatePostStatusSchema = z.object({
	postId: postIdSchema,
	status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
})

const _batchUpdatePostStatusSchema = z.object({
	postIds: z.array(postIdSchema).min(1, '未选中任何文章'),
	status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
})

/**
 * 1. 获取管理后台文章列表（支持状态、标签、搜索筛选）
 */
export async function getDashboardPosts(options?: {
	status?: StatusType | 'ALL'
	tagSlug?: string
	search?: string
	includeArchived?: boolean
}): Promise<ActionResult<PostWithTags[]>> {
	try {
		await requireAdminSession()

		const parsedOptions = getDashboardPostsOptionsSchema.safeParse(options)
		const opts = parsedOptions.success ? parsedOptions.data : options

		const conditions = []

		if (opts?.status && opts.status !== 'ALL') {
			conditions.push(eq(posts.status, opts.status))
		}

		if (opts?.includeArchived) {
			// 包含已归档
		} else if (opts?.status === 'ARCHIVED') {
			// 显式查归档
		} else {
			// 默认排除已软删除/归档的
			conditions.push(isNull(posts.archivedAt))
		}

		if (opts?.search) {
			const searchTerm = `%${opts.search.trim()}%`
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

		if (opts?.tagSlug && opts.tagSlug !== 'ALL') {
			postList = postList.filter((p) =>
				p.tags?.some((t) => t.slug === opts.tagSlug),
			)
		}

		return actionSuccess(postList)
	} catch (error) {
		logger.error('Failed to get dashboard posts', error)
		return actionFailure(
			error instanceof Error ? error.message : '获取文章列表失败',
		)
	}
}

export async function updatePostPosterAction(
	postId: string,
	poster: string | null,
): Promise<ActionResult<{ poster: string | null }>> {
	void postId
	void poster
	return actionFailure(
		'文章内容源由 Git 管理，请直接编辑 Markdown 后通过 publish 发布。',
	)
}

export async function uploadPostPosterAction(
	postId: string,
	formData: FormData,
): Promise<ActionResult<{ poster: string | null }>> {
	void postId
	void formData
	return actionFailure(
		'文章封面不能通过 Dashboard 回写内容源，请编辑 Markdown 后通过 publish 发布。',
	)
}

/**
 * 2. 更新文章状态 (PUBLISHED / DRAFT / ARCHIVED 等)
 */
export async function updatePostStatus(
	postId: string,
	status: StatusType,
): Promise<ActionResult<null>> {
	void postId
	void status
	return actionFailure(
		'文章状态由 Git Frontmatter 管理，请编辑 Markdown 后通过 publish 发布。',
	)
}

/**
 * 3. 批量更新文章状态
 */
export async function batchUpdatePostStatus(
	postIds: string[],
	status: StatusType,
): Promise<ActionResult<null>> {
	void postIds
	void status
	return actionFailure(
		'文章状态由 Git Frontmatter 管理，请编辑 Markdown 后通过 publish 发布。',
	)
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
	void postId
	return actionFailure(
		'不能从 Dashboard 删除 Git 内容源，请删除 Markdown 后通过 publish 发布。',
	)
}

/**
 * 7. 获取全量标签列表（供筛选使用）
 */
export async function getDashboardTags(): Promise<
	ActionResult<(typeof tags.$inferSelect)[]>
> {
	try {
		await requireAdminSession()
		return actionSuccess(
			await db.query.tags.findMany({
				orderBy: [desc(tags.name)],
			}),
		)
	} catch (error) {
		logger.error('Failed to get tags for dashboard', error)
		return actionFailure(
			error instanceof Error ? error.message : '获取标签失败',
		)
	}
}

/**
 * 8. 由 Dashboard 触发统一的 Git-first Publish Workflow。
 * 内容仍只能来自 Git；Dashboard 不提供内容编辑或导入能力。
 */
export async function triggerPublish(options?: {
	dryRun?: boolean
}): Promise<ActionResult<PublishWorkflowResult>> {
	try {
		const session = await requireAdminSession()
		return actionSuccess(
			await runPublishWorkflow({
				scope: 'all',
				triggeredBy: 'DASHBOARD',
				actorId: session.user.id,
				dryRun: options?.dryRun ?? false,
				deleteOld: false,
			}),
		)
	} catch (error) {
		logger.error('Dashboard publish failed', error)
		return actionFailure(error instanceof Error ? error.message : '发布失败')
	}
}
