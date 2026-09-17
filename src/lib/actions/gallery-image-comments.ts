'use server'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { COMMENT_MESSAGES, COMMENT_RULES } from '@/constants/comments'
import { CONTENT_RULES } from '@/constants/content'
import { db } from '@/db'
import { galleryImageComments, galleryImages } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { getPublicUserName } from '@/lib/public-user'
import type { GalleryImageCommentPublic } from '@/types/comment/gallery-image-comment'
import { formatZodError } from './zodError'

const logger = createLogger('actions/gallery-image-comments')

const commentInputSchema = z.object({
	content: z
		.string()
		.trim()
		.min(COMMENT_RULES.content.minLength, COMMENT_MESSAGES.contentRequired)
		.max(COMMENT_RULES.content.maxLength, COMMENT_MESSAGES.contentTooLong),
	imageId: z.string().min(1).max(CONTENT_RULES.idMaxLength),
	parentId: z.string().min(1).max(CONTENT_RULES.idMaxLength).optional(),
	path: z.string().min(1).max(COMMENT_RULES.pathMaxLength),
})

export type GalleryImageCommentInput = z.infer<typeof commentInputSchema>

export type { GalleryImageCommentPublic } from '@/types/comment/gallery-image-comment'

export async function createGalleryImageComment(
	data: GalleryImageCommentInput,
) {
	try {
		const parsed = commentInputSchema.safeParse(data)
		if (!parsed.success)
			return { success: false, error: formatZodError(parsed.error) }
		const session = await auth.api.getSession({ headers: await headers() })
		if (!session?.user?.id) return { success: false, error: '用户未登录' }

		const image = await db.query.galleryImages.findFirst({
			where: and(
				eq(galleryImages.id, parsed.data.imageId),
				eq(galleryImages.hidden, false),
			),
		})
		if (!image) return { success: false, error: '图片不存在' }

		if (parsed.data.parentId) {
			const parent = await db.query.galleryImageComments.findFirst({
				where: and(
					eq(galleryImageComments.id, parsed.data.parentId),
					eq(galleryImageComments.galleryImageId, parsed.data.imageId),
				),
			})
			if (!parent) return { success: false, error: '引用的父评论不存在' }
		}

		const [comment] = await db
			.insert(galleryImageComments)
			.values({
				galleryImageId: parsed.data.imageId,
				content: parsed.data.content,
				authorId: session.user.id,
				parentId: parsed.data.parentId ?? null,
				status: 'PUBLISHED',
			})
			.returning()
		revalidatePath(parsed.data.path)
		return { success: true, comment }
	} catch (error) {
		logger.error('Error creating GalleryImage comment', error)
		return { success: false, error: '发表评论失败' }
	}
}

export async function getGalleryImageComments(
	imageId: string,
): Promise<GalleryImageCommentPublic[]> {
	const parsed = z
		.string()
		.min(1)
		.max(CONTENT_RULES.idMaxLength)
		.safeParse(imageId)
	if (!parsed.success) return []
	try {
		const rows = await db.query.galleryImageComments.findMany({
			where: and(
				eq(galleryImageComments.galleryImageId, parsed.data),
				inArray(galleryImageComments.status, ['PUBLISHED', 'SPAM']),
			),
			with: {
				author: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						banned: true,
					},
				},
			},
			orderBy: [asc(galleryImageComments.createdAt)],
		})
		const map = new Map<string, GalleryImageCommentPublic>()
		const roots: GalleryImageCommentPublic[] = []
		for (const row of rows) {
			const item: GalleryImageCommentPublic = {
				id: row.id,
				content:
					row.status === 'SPAM'
						? '[此评论已被标记为垃圾信息]'
						: row.author.banned
							? '[此用户已被封禁]'
							: row.content,
				status: row.status,
				createdAt: row.createdAt,
				parentId: row.parentId,
				author: {
					id: row.author.id,
					displayName: getPublicUserName(row.author.name, row.author.email),
					image: row.author.image,
					banned: row.author.banned,
				},
				replies: [],
			}
			map.set(item.id, item)
		}
		for (const item of map.values()) {
			if (item.parentId && map.has(item.parentId))
				map.get(item.parentId)?.replies.push(item)
			else roots.push(item)
		}
		return roots
	} catch (error) {
		logger.error('Error fetching GalleryImage comments', error)
		return []
	}
}

export async function toggleGalleryImageCommentSpam(
	commentId: string,
	isSpam: boolean,
) {
	const parsed = z
		.object({
			commentId: z.string().min(1).max(CONTENT_RULES.idMaxLength),
			isSpam: z.boolean(),
		})
		.safeParse({ commentId, isSpam })
	if (!parsed.success)
		return { success: false, error: formatZodError(parsed.error) }

	try {
		const session = await auth.api.getSession({ headers: await headers() })
		if (!session?.user?.id || session.user.role !== 'ADMIN') {
			return { success: false, error: '权限不足：需要管理员权限' }
		}
		await db
			.update(galleryImageComments)
			.set({ status: parsed.data.isSpam ? 'SPAM' : 'PUBLISHED' })
			.where(eq(galleryImageComments.id, parsed.data.commentId))
		return { success: true }
	} catch (error) {
		logger.error('Error toggling GalleryImage comment spam', error)
		return { success: false, error: '评论状态更新失败' }
	}
}
