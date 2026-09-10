'use server'

import { hashPassword } from 'better-auth/crypto'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { accounts, comments, posts, sessions, tags, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { formatZodError } from './types'

const logger = createLogger('actions/dashboard')

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

const adminResetPasswordSchema = z.object({
	userId: z.string().min(1, '用户ID不能为空').max(128),
	newPassword: z.string().min(6, '密码长度至少6位').max(128, '密码过长'),
})

const toggleUserBanSchema = z.object({
	userId: z.string().min(1, '用户ID不能为空').max(128),
	banned: z.boolean(),
})

const toggleCommentSpamSchema = z.object({
	commentId: z.string().min(1, '评论ID不能为空').max(128),
	isSpam: z.boolean(),
})

const deleteCommentSchema = z.string().min(1, '评论ID不能为空').max(128)

export async function resetUserPasswordByAdmin(data: {
	userId: string
	newPassword: string
}) {
	try {
		await requireAdminSession()

		const parsed = adminResetPasswordSchema.safeParse(data)
		if (!parsed.success) {
			return {
				success: false,
				error: formatZodError(parsed.error),
			}
		}

		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, parsed.data.userId),
		})

		if (!targetUser) {
			return { success: false, error: '用户不存在' }
		}

		// 使用 Better-Auth 的哈希算法加密密码
		const hashedPassword = await hashPassword(parsed.data.newPassword)

		const credentialAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.userId, targetUser.id),
				eq(accounts.providerId, 'credential'),
			),
		})

		if (credentialAccount) {
			await db
				.update(accounts)
				.set({
					password: hashedPassword,
					updatedAt: new Date(),
				})
				.where(eq(accounts.id, credentialAccount.id))
		} else {
			await db.insert(accounts).values({
				userId: targetUser.id,
				accountId: targetUser.id,
				providerId: 'credential',
				password: hashedPassword,
			})
		}

		// 清理该用户现有的全部登录会话，强制其使用新密码重新登录
		await db.delete(sessions).where(eq(sessions.userId, targetUser.id))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		logger.error('Reset user password by admin error', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '重置密码失败',
		}
	}
}

/**
 * 获取仪表板核心统计指标
 */
export async function getDashboardStats() {
	try {
		await requireAdminSession()

		// 总用户数
		const [userCountResult] = await db.select({ value: count() }).from(users)
		const totalUsers = userCountResult?.value ?? 0

		// 总评论数
		const [commentCountResult] = await db
			.select({ value: count() })
			.from(comments)
		const totalComments = commentCountResult?.value ?? 0

		// 总文章数
		const [postCountResult] = await db
			.select({ value: count() })
			.from(posts)
			.where(isNull(posts.archivedAt))
		const totalPosts = postCountResult?.value ?? 0

		// 已发布文章数
		const [pubPostCountResult] = await db
			.select({ value: count() })
			.from(posts)
			.where(and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)))
		const publishedPosts = pubPostCountResult?.value ?? 0

		// 草稿文章数
		const [draftPostCountResult] = await db
			.select({ value: count() })
			.from(posts)
			.where(and(eq(posts.status, 'DRAFT'), isNull(posts.archivedAt)))
		const draftPosts = draftPostCountResult?.value ?? 0

		// 标签总数
		const [tagCountResult] = await db.select({ value: count() }).from(tags)
		const totalTags = tagCountResult?.value ?? 0

		// 评论数前5的文章
		const topCommentedPostsRaw = await db
			.select({
				id: posts.id,
				title: posts.title,
				slug: posts.slug,
				commentsCount: count(comments.id),
			})
			.from(posts)
			.innerJoin(
				comments,
				and(eq(comments.postId, posts.id), eq(comments.status, 'PUBLISHED')),
			)
			.groupBy(posts.id, posts.title, posts.slug)
			.orderBy(desc(count(comments.id)))
			.limit(5)

		// 发表最多评论的前5用户
		const topCommentingUsersRaw = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				commentsCount: count(comments.id),
			})
			.from(users)
			.innerJoin(comments, eq(comments.authorId, users.id))
			.groupBy(users.id, users.name, users.email)
			.orderBy(desc(count(comments.id)))
			.limit(5)

		// 最近5条评论
		const recentComments = await db.query.comments.findMany({
			with: {
				author: {
					columns: {
						id: true,
						name: true,
						email: true,
					},
				},
				post: {
					columns: {
						id: true,
						title: true,
						slug: true,
					},
				},
			},
			orderBy: [desc(comments.createdAt)],
			limit: 5,
		})

		return {
			overview: {
				totalUsers,
				totalComments,
				totalPosts,
				publishedPosts,
				draftPosts,
				totalTags,
			},
			topCommentedPosts: topCommentedPostsRaw.map((p) => ({
				id: p.id,
				title: p.title,
				slug: p.slug,
				commentCount: p.commentsCount,
			})),
			topCommentingUsers: topCommentingUsersRaw.map((u) => ({
				id: u.id,
				name: u.name,
				email: u.email,
				commentCount: u.commentsCount,
			})),
			recentComments: recentComments.map((c) => ({
				id: c.id,
				content: c.content,
				authorName: c.author?.name || '匿名读者',
				postTitle: c.post?.title || '未知文章',
				postSlug: c.post?.slug || '',
				createdAt: c.createdAt,
			})),
		}
	} catch (error) {
		logger.error('Get dashboard stats error', error)
		throw error
	}
}

/**
 * 获取全站用户列表（包含评论和封禁状态）
 */
export async function getUsersList() {
	try {
		await requireAdminSession()

		const allUsers = await db.query.users.findMany({
			with: {
				comments: {
					with: {
						post: {
							columns: {
								id: true,
								title: true,
								slug: true,
							},
						},
					},
					orderBy: [desc(comments.createdAt)],
				},
			},
			orderBy: [desc(users.createdAt)],
		})

		return allUsers.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			image: u.image,
			banned: Boolean(u.banned),
			role: u.role || 'USER',
			emailVerified: u.emailVerified,
			createdAt: u.createdAt,
			updatedAt: u.updatedAt,
			totalComments: u.comments?.length || 0,
			comments: (u.comments || []).map((c) => ({
				id: c.id,
				content: c.content,
				status: c.status,
				createdAt: c.createdAt,
				post: {
					id: c.post?.id || '',
					title: c.post?.title || '未知文章',
					slug: c.post?.slug || '',
				},
			})),
		}))
	} catch (error) {
		logger.error('Get users list error', error)
		throw error
	}
}

/**
 * 切换用户封禁状态
 */
export async function toggleUserBan(userId: string, banned: boolean) {
	try {
		await requireAdminSession()

		const parsed = toggleUserBanSchema.safeParse({ userId, banned })
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		await db
			.update(users)
			.set({ banned: parsed.data.banned })
			.where(eq(users.id, parsed.data.userId))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		logger.error('Toggle user ban error', error)
		throw error
	}
}

/**
 * 切换评论垃圾/正常状态
 */
export async function toggleCommentSpam(commentId: string, isSpam: boolean) {
	try {
		await requireAdminSession()

		const parsed = toggleCommentSpamSchema.safeParse({ commentId, isSpam })
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		await db
			.update(comments)
			.set({
				status: parsed.data.isSpam ? 'SPAM' : 'PUBLISHED',
			})
			.where(eq(comments.id, parsed.data.commentId))

		revalidatePath('/dashboard/users')
		revalidatePath('/dashboard')
		return { success: true }
	} catch (error) {
		logger.error('Toggle comment spam error', error)
		throw error
	}
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: string) {
	try {
		await requireAdminSession()

		const parsed = deleteCommentSchema.safeParse(commentId)
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		await db.delete(comments).where(eq(comments.id, parsed.data))

		revalidatePath('/dashboard/users')
		revalidatePath('/dashboard')
		return { success: true }
	} catch (error) {
		logger.error('Delete comment error', error)
		throw error
	}
}
