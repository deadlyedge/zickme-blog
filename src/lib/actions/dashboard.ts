'use server'

import { hashPassword } from 'better-auth/crypto'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { accounts, comments, posts, sessions, users } from '@/db/schema'
import { auth } from '@/lib/auth'

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
	userId: z.string().min(1, '用户ID不能为空'),
	newPassword: z.string().min(6, '密码长度至少6位'),
})

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
				error: parsed.error.issues[0]?.message || '输入参数有误',
			}
		}

		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, parsed.data.userId),
		})

		if (!targetUser) {
			return { success: false, error: '目标用户不存在' }
		}

		const hashedPassword = await hashPassword(parsed.data.newPassword)

		const existingAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.userId, targetUser.id),
				eq(accounts.providerId, 'credential'),
			),
		})

		if (existingAccount) {
			await db
				.update(accounts)
				.set({
					password: hashedPassword,
					updatedAt: new Date(),
				})
				.where(eq(accounts.id, existingAccount.id))
		} else {
			await db.insert(accounts).values({
				id: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
				accountId: targetUser.id,
				providerId: 'credential',
				userId: targetUser.id,
				password: hashedPassword,
				updatedAt: new Date(),
			})
		}

		// 撤销该用户的所有 session，强制重新登录
		await db.delete(sessions).where(eq(sessions.userId, targetUser.id))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to reset user password by admin:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '重置密码失败',
		}
	}
}

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
				status: c.status,
				createdAt: c.createdAt,
				authorName: c.author?.name || 'Unknown',
				authorEmail: c.author?.email || 'Unknown',
				postTitle: c.post?.title || 'Unknown',
				postSlug: c.post?.slug || '',
			})),
		}
	} catch (error) {
		console.error('Failed to fetch dashboard stats:', error)
		throw new Error(
			error instanceof Error
				? error.message
				: 'Failed to fetch dashboard statistics',
		)
	}
}

export async function getUsersList() {
	try {
		await requireAdminSession()

		const allUsers = await db.query.users.findMany({
			orderBy: [desc(users.createdAt)],
		})

		const usersWithDetails = await Promise.all(
			allUsers.map(async (u) => {
				const [cCount] = await db
					.select({ value: count() })
					.from(comments)
					.where(eq(comments.authorId, u.id))

				const userComments = await db.query.comments.findMany({
					where: eq(comments.authorId, u.id),
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
					limit: 10,
				})

				return {
					id: u.id,
					name: u.name,
					email: u.email,
					image: u.image,
					banned: u.banned,
					role: u.role,
					emailVerified: u.emailVerified,
					createdAt: u.createdAt,
					updatedAt: u.updatedAt,
					totalComments: cCount?.value ?? 0,
					comments: userComments.map((c) => ({
						id: c.id,
						content: c.content,
						status: c.status,
						createdAt: c.createdAt,
						post: {
							id: c.post?.id || '',
							title: c.post?.title || '',
							slug: c.post?.slug || '',
						},
					})),
				}
			}),
		)

		return usersWithDetails
	} catch (error) {
		console.error('Failed to fetch users list:', error)
		throw new Error(
			error instanceof Error ? error.message : 'Failed to fetch users list',
		)
	}
}

export async function toggleUserBan(userId: string, banned: boolean) {
	try {
		await requireAdminSession()

		await db.update(users).set({ banned }).where(eq(users.id, userId))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to toggle user ban:', error)
		throw new Error(
			error instanceof Error ? error.message : 'Failed to update user status',
		)
	}
}

export async function toggleCommentSpam(commentId: string, isSpam: boolean) {
	try {
		await requireAdminSession()

		await db
			.update(comments)
			.set({ status: isSpam ? 'SPAM' : 'PUBLISHED' })
			.where(eq(comments.id, commentId))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to toggle comment spam status:', error)
		throw new Error(
			error instanceof Error
				? error.message
				: 'Failed to toggle comment spam status',
		)
	}
}

export async function deleteComment(commentId: string) {
	try {
		await requireAdminSession()

		await db
			.update(comments)
			.set({
				deleted: true,
				content: '[已删除]',
			})
			.where(eq(comments.id, commentId))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to delete comment:', error)
		throw new Error(
			error instanceof Error ? error.message : 'Failed to delete comment',
		)
	}
}
