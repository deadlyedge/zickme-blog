'use server'

import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { comments, users } from '@/db/schema'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireSession } from '@/lib/auth/guards'
import { generateAvatarUri } from '@/lib/generate-avatar'
import { getGravatarAvatarUrl } from '@/lib/get-avatar'
import { createLogger } from '@/lib/logger'
import type {
	UserCommentItem,
	UserPortalData,
	UserReplyItem,
} from '@/types/user'

const logger = createLogger('actions/user-portal')

const updateAvatarPresetSchema = z.enum(['dicebear', 'gravatar', 'custom'])

export type {
	UserCommentItem,
	UserPortalData,
	UserReplyItem,
} from '@/types/user'

/**
 * 1. 获取当前登录用户的个人门户数据（个人信息、历史评论、收到的回复）
 */
export async function getUserPortalData(): Promise<
	ActionResult<UserPortalData>
> {
	try {
		const session = await requireSession()

		const userId = session.user.id

		// 查询用户基本信息
		const userRecord = await db.query.users.findFirst({
			where: eq(users.id, userId),
		})

		if (!userRecord) {
			return actionFailure('用户不存在')
		}

		// 查询我发布的所有评论
		const myComments = await db.query.comments.findMany({
			where: eq(comments.authorId, userId),
			with: {
				post: {
					columns: {
						id: true,
						title: true,
						slug: true,
					},
				},
				parent: {
					with: {
						author: {
							columns: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: [desc(comments.createdAt)],
		})

		const formattedMyComments: UserCommentItem[] = myComments.map((c) => ({
			id: c.id,
			content: c.content,
			status: c.status,
			createdAt: c.createdAt,
			postId: c.postId,
			postTitle: c.post?.title || '未知文章',
			postSlug: c.post?.slug || '',
			parentCommentId: c.parentId,
			parentAuthorName: c.parent?.author?.name || null,
		}))

		// 查询针对我发布的评论的所有回复 (Others replied to my comments)
		const myCommentIds = myComments.map((c) => c.id)

		let formattedReplies: UserReplyItem[] = []
		if (myCommentIds.length > 0) {
			const replies = await db.query.comments.findMany({
				where: and(
					inArray(comments.parentId, myCommentIds),
					eq(comments.status, 'PUBLISHED'),
				),
				with: {
					author: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
					post: {
						columns: {
							id: true,
							title: true,
							slug: true,
						},
					},
					parent: true,
				},
				orderBy: [desc(comments.createdAt)],
			})

			// 过滤掉自己回复自己的情况
			formattedReplies = replies
				.filter((r) => r.authorId !== userId)
				.map((r) => ({
					id: r.id,
					content: r.content,
					createdAt: r.createdAt,
					status: r.status,
					postId: r.postId,
					postTitle: r.post?.title || '未知文章',
					postSlug: r.post?.slug || '',
					replyAuthor: {
						id: r.author.id,
						name: r.author.name,
						image: r.author.image,
					},
					originalCommentContent: r.parent?.content || '',
				}))
		}

		return actionSuccess({
			user: {
				id: userRecord.id,
				name: userRecord.name,
				email: userRecord.email,
				image: userRecord.image,
				role: userRecord.role,
				createdAt: userRecord.createdAt,
			},
			comments: formattedMyComments,
			repliesToMe: formattedReplies,
		})
	} catch (error) {
		logger.error('Get user portal data failed', error)
		return actionFailure(
			error instanceof Error ? error.message : '获取用户信息失败',
		)
	}
}

/**
 * 2. 用户自选头像更新方式（Dicebear / Gravatar）
 */
export async function updateUserAvatarPreset(
	type: 'dicebear' | 'gravatar' | 'custom',
): Promise<ActionResult<{ avatarUrl: string }>> {
	try {
		const parsedType = updateAvatarPresetSchema.safeParse(type)
		if (!parsedType.success) {
			return actionFailure('无效的头像类型')
		}

		const session = await requireSession('未登录')

		if (parsedType.data === 'custom') {
			return actionFailure('不支持自定义外链头像')
		}

		const userId = session.user.id
		let targetAvatarUrl = ''

		if (parsedType.data === 'gravatar') {
			targetAvatarUrl = getGravatarAvatarUrl(session.user.email)
		} else if (parsedType.data === 'dicebear') {
			targetAvatarUrl = generateAvatarUri({
				seed: `${session.user.id}-${Date.now()}`,
				variant: 'croodles',
			})
		}

		if (!targetAvatarUrl) {
			return actionFailure('未能生成或获取到有效头像')
		}

		await db
			.update(users)
			.set({
				image: targetAvatarUrl,
			})
			.where(eq(users.id, userId))

		revalidatePath('/user')
		revalidatePath('/dashboard')
		return actionSuccess({ avatarUrl: targetAvatarUrl })
	} catch (error) {
		logger.error('Update avatar failed', error)
		return actionFailure(
			error instanceof Error ? error.message : '头像更新失败',
		)
	}
}
