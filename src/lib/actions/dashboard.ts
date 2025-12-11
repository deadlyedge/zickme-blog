'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getDashboardStats() {
	try {
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
		throw new Error('Failed to fetch dashboard statistics')
	}
}

export async function getUsersList() {
	try {
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
		throw new Error('Failed to fetch users list')
	}
}

export async function toggleUserBan(userId: string, banned: boolean) {
	try {
		await prisma.user.update({
			where: { id: userId },
			data: { banned },
		})

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to toggle user ban:', error)
		throw new Error('Failed to update user status')
	}
}

export async function markCommentAsSpam(commentId: string) {
	try {
		await prisma.comment.update({
			where: { id: commentId },
			data: { status: 'SPAM' },
		})

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		console.error('Failed to mark comment as spam:', error)
		throw new Error('Failed to mark comment as spam')
	}
}

export async function deleteComment(commentId: string) {
	try {
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
		throw new Error('Failed to delete comment')
	}
}
