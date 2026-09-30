import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { comments, posts, tags, users } from '@/db/schema'
import type { DashboardStats } from './stats-types'

/** 查询并组装仪表盘统计数据。 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
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
}
