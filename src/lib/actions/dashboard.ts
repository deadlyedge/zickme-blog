'use server'

import { hashPassword } from 'better-auth/crypto'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

		const targetUser = await prisma.user.findUnique({
			where: { id: parsed.data.userId },
		})

		if (!targetUser) {
			return { success: false, error: '目标用户不存在' }
		}

		const hashedPassword = await hashPassword(parsed.data.newPassword)

		const existingAccount = await prisma.account.findFirst({
			where: {
				userId: targetUser.id,
				providerId: 'credential',
			},
		})

		if (existingAccount) {
			await prisma.account.update({
				where: { id: existingAccount.id },
				data: {
					password: hashedPassword,
					updatedAt: new Date(),
				},
			})
		} else {
			await prisma.account.create({
				data: {
					id: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
					accountId: targetUser.id,
					providerId: 'credential',
					userId: targetUser.id,
					password: hashedPassword,
					updatedAt: new Date(),
				},
			})
		}

		// 撤销该用户的所有 session，强制重新登录
		await prisma.session.deleteMany({
			where: { userId: targetUser.id },
		})

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
		const totalUsers = await prisma.user.count()

		// 总评论数
		const totalComments = await prisma.comment.count()

		// 评论数前5的文章
		const topCommentedPosts = await prisma.post.findMany({
			select: {
				id: true,
				title: true,
				slug: true,
				_count: {
					select: {
						comments: true,
					},
				},
			},
			where: {
				comments: {
					some: {
						status: 'PUBLISHED',
					},
				},
			},
			orderBy: {
				comments: {
					_count: 'desc',
				},
			},
			take: 5,
		})

		// 发表最多评论的前五用户
		const topCommentingUsers = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				_count: {
					select: {
						comments: true,
					},
				},
			},
			orderBy: {
				comments: {
					_count: 'desc',
				},
			},
			take: 5,
		})

		// 其他统计数据
		const totalPosts = await prisma.post.count()
		const publishedPosts = await prisma.post.count({
			where: {
				status: 'PUBLISHED',
			},
		})
		const draftPosts = await prisma.post.count({
			where: {
				status: 'DRAFT',
			},
		})

		const recentComments = await prisma.comment.findMany({
			select: {
				id: true,
				content: true,
				createdAt: true,
				author: {
					select: {
						name: true,
					},
				},
				post: {
					select: {
						title: true,
						slug: true,
					},
				},
			},
			where: {
				status: 'PUBLISHED',
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 5,
		})

		return {
			totalUsers,
			totalComments,
			totalPosts,
			publishedPosts,
			draftPosts,
			topCommentedPosts: topCommentedPosts.map((post) => ({
				id: post.id,
				title: post.title,
				slug: post.slug,
				commentCount: post._count.comments,
			})),
			topCommentingUsers: topCommentingUsers.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				commentCount: user._count.comments,
			})),
			recentComments: recentComments.map((comment) => ({
				id: comment.id,
				content:
					comment.content.substring(0, 100) +
					(comment.content.length > 100 ? '...' : ''),
				createdAt: comment.createdAt,
				authorName: comment.author.name,
				postTitle: comment.post.title,
				postSlug: comment.post.slug,
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

		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				banned: true,
				role: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						comments: true,
					},
				},
				comments: {
					select: {
						id: true,
						content: true,
						status: true,
						createdAt: true,
						post: {
							select: {
								id: true,
								title: true,
								slug: true,
							},
						},
					},
					orderBy: {
						createdAt: 'desc',
					},
					take: 10, // 只显示最近10条评论
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return users.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			banned: user.banned,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			totalComments: user._count.comments,
			comments: user.comments.map((comment) => ({
				id: comment.id,
				content: comment.content,
				status: comment.status,
				createdAt: comment.createdAt,
				post: {
					id: comment.post.id,
					title: comment.post.title,
					slug: comment.post.slug,
				},
			})),
		}))
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

		await prisma.user.update({
			where: { id: userId },
			data: { banned },
		})

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

		await prisma.comment.update({
			where: { id: commentId },
			data: { status: isSpam ? 'SPAM' : 'PUBLISHED' },
		})

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

		await prisma.comment.update({
			where: { id: commentId },
			data: {
				deleted: true,
				content: '[已删除]',
			},
		})

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to delete comment:', error)
		throw new Error(
			error instanceof Error ? error.message : 'Failed to delete comment',
		)
	}
}
