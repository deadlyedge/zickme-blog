'use server'

import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { db } from '@/db'
import { comments, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { generateAvatarUri } from '@/lib/generate-avatar'
import { getGravatarProfile } from '@/lib/get-avatar'

export interface UserCommentItem {
	id: string
	content: string
	status: string
	createdAt: Date
	postId: string
	postTitle: string
	postSlug: string
	parentCommentId?: string | null
	parentAuthorName?: string | null
}

export interface UserReplyItem {
	id: string
	content: string
	createdAt: Date
	status: string
	postId: string
	postTitle: string
	postSlug: string
	replyAuthor: {
		id: string
		name: string
		image?: string | null
	}
	originalCommentContent: string
}

export interface UserPortalData {
	user: {
		id: string
		name: string
		email: string
		image?: string | null
		role: string
		createdAt: Date
	}
	comments: UserCommentItem[]
	repliesToMe: UserReplyItem[]
}

/**
 * 1. 获取当前登录用户的个人门户数据（个人信息、历史评论、收到的回复）
 */
export async function getUserPortalData(): Promise<UserPortalData> {
	const headersList = await headers()
	const session = await auth.api.getSession({
		headers: headersList,
	})

	if (!session?.user?.id) {
		throw new Error('用户未登录')
	}

	const userId = session.user.id

	// 查询用户基本信息
	const userRecord = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!userRecord) {
		throw new Error('用户不存在')
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

	return {
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
	}
}

/**
 * 2. 用户自选头像更新方式（Dicebear / Gravatar / 自定义 URL）
 */
export async function updateUserAvatarPreset(
	type: 'dicebear' | 'gravatar' | 'custom',
	customUrl?: string,
) {
	try {
		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id) {
			throw new Error('未登录')
		}

		const userId = session.user.id
		let targetAvatarUrl = ''

		if (type === 'gravatar') {
			const { avatarUrl } = await getGravatarProfile({
				email: session.user.email,
			})
			targetAvatarUrl =
				avatarUrl ||
				generateAvatarUri({
					seed: session.user.name,
					variant: 'initials',
				})
		} else if (type === 'dicebear') {
			targetAvatarUrl = generateAvatarUri({
				seed: `${session.user.name}-${Date.now()}`,
				variant: 'croodles',
			})
		} else if (type === 'custom' && customUrl) {
			targetAvatarUrl = customUrl
		}

		if (!targetAvatarUrl) {
			throw new Error('未能生成或获取到有效头像')
		}

		await db
			.update(users)
			.set({
				image: targetAvatarUrl,
			})
			.where(eq(users.id, userId))

		revalidatePath('/user')
		revalidatePath('/dashboard')
		return { success: true, avatarUrl: targetAvatarUrl }
	} catch (error) {
		console.error('Update avatar failed:', error)
		throw new Error(error instanceof Error ? error.message : '头像更新失败')
	}
}
