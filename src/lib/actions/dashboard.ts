'use server'

import { prisma } from '@/lib/prisma'

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
