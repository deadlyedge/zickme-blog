import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	ne,
	sql,
} from 'drizzle-orm'
import { db } from '@/db'
import { comments, posts, tags } from '@/db/schema'
import {
	fetchRecentGalleriesForHome,
	fetchTopDiscussedGalleryImages,
} from '@/lib/gallery/home-queries'
import { createLogger } from '@/lib/logger'
import type { HomePageData } from '@/types/content/home'
import type { PostWithTags } from '@/types/content/post'
import type { Tag } from '@/types/content/tag'
import type { SiteProfile } from '@/types/site'

const logger = createLogger('lib/post-providers')

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
	throw new Error('post-providers can only be used on the server side')
}

export const fetchProfile = async (): Promise<SiteProfile | null> => {
	const res = await db.query.siteProfile.findFirst()
	return (res as unknown as SiteProfile) ?? null
}

export const fetchPosts = async (limit = 100): Promise<PostWithTags[]> => {
	const results = await db.query.posts.findMany({
		where: and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)),
		orderBy: [desc(posts.publishedAt)],
		limit,
		with: {
			postsToTags: {
				with: {
					tag: true,
				},
			},
		},
	})

	return results.map((post) => ({
		...post,
		tags: post.postsToTags.map((pt) => pt.tag),
	})) as PostWithTags[]
}

export const fetchPostBySlug = async (
	slug: string,
): Promise<PostWithTags | null> => {
	const post = await db.query.posts.findFirst({
		where: and(
			eq(posts.slug, slug),
			eq(posts.status, 'PUBLISHED'),
			isNull(posts.archivedAt),
		),
		with: {
			postsToTags: {
				with: {
					tag: true,
				},
			},
		},
	})

	if (!post) return null

	return {
		...post,
		tags: post.postsToTags.map((pt) => pt.tag),
	} as PostWithTags
}

export const fetchAllPostSlugs = async (): Promise<string[]> => {
	const results = await db
		.select({ slug: posts.slug })
		.from(posts)
		.where(and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)))

	return results.map((post) => post.slug)
}

export const fetchTags = async (): Promise<Tag[]> => {
	return await db.query.tags.findMany({
		orderBy: [asc(tags.name)],
	})
}

export const fetchTopHottestPosts = async (
	limit = 5,
): Promise<PostWithTags[]> => {
	try {
		// 查询全站评论数最多的已发布文章
		const topCommentedPostsRaw = await db
			.select({
				id: posts.id,
				commentsCount: count(comments.id),
			})
			.from(posts)
			.innerJoin(
				comments,
				and(eq(comments.postId, posts.id), eq(comments.status, 'PUBLISHED')),
			)
			.where(and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)))
			.groupBy(posts.id)
			.orderBy(desc(count(comments.id)))
			.limit(limit)

		const topIds = topCommentedPostsRaw.map((p) => p.id)

		if (topIds.length === 0) {
			// 如果暂无评论，退化为获取最新发布的文章
			return await fetchPosts(limit)
		}

		// 如果有评论数排名，拉取详情并补充不足 limit 的最新文章
		const results = await db.query.posts.findMany({
			where: inArray(posts.id, topIds),
			with: {
				postsToTags: {
					with: {
						tag: true,
					},
				},
			},
		})

		const mappedResults = results.map((post) => ({
			...post,
			tags: post.postsToTags.map((pt) => pt.tag),
		})) as PostWithTags[]

		// 保持评论数从高到低的排序
		const sorted = topIds
			.map((id) => mappedResults.find((p) => p.id === id))
			.filter((p): p is PostWithTags => Boolean(p))

		if (sorted.length < limit) {
			const excludeIds = sorted.map((p) => p.id)
			const fallbackPosts = await db.query.posts.findMany({
				where: and(
					eq(posts.status, 'PUBLISHED'),
					isNull(posts.archivedAt),
					excludeIds.length > 0
						? sql`${posts.id} NOT IN (${sql.join(
								excludeIds.map((id) => sql`${id}`),
								sql`, `,
							)})`
						: undefined,
				),
				orderBy: [desc(posts.publishedAt)],
				limit: limit - sorted.length,
				with: {
					postsToTags: {
						with: {
							tag: true,
						},
					},
				},
			})

			const fallbackMapped = fallbackPosts.map((post) => ({
				...post,
				tags: post.postsToTags.map((pt) => pt.tag),
			})) as PostWithTags[]

			return [...sorted, ...fallbackMapped]
		}

		return sorted
	} catch (error) {
		logger.error(
			'Failed to fetch hottest posts; falling back to latest posts',
			error,
			{
				limit,
			},
		)
		try {
			return await fetchPosts(limit)
		} catch (fallbackError) {
			logger.error('Failed to fetch fallback latest posts', fallbackError, {
				limit,
			})
			return []
		}
	}
}

export const fetchTopHottestPostsWithCover = async (
	limit = 3,
): Promise<PostWithTags[]> => {
	try {
		const topCommentedPosts = await db
			.select({
				id: posts.id,
				commentsCount: count(comments.id),
			})
			.from(posts)
			.innerJoin(
				comments,
				and(eq(comments.postId, posts.id), eq(comments.status, 'PUBLISHED')),
			)
			.where(
				and(
					eq(posts.status, 'PUBLISHED'),
					isNull(posts.archivedAt),
					isNotNull(posts.poster),
					ne(posts.poster, ''),
				),
			)
			.groupBy(posts.id)
			.orderBy(desc(count(comments.id)))
			.limit(limit)

		const topIds = topCommentedPosts.map(({ id }) => id)
		const topPosts = await db.query.posts.findMany({
			where: and(
				inArray(posts.id, topIds.length > 0 ? topIds : ['']),
				isNotNull(posts.poster),
			),
			with: {
				postsToTags: { with: { tag: true } },
			},
		})
		const mappedTop = topIds
			.map((id) => topPosts.find((post) => post.id === id))
			.filter((post): post is (typeof topPosts)[number] => Boolean(post))
			.map((post) => ({
				...post,
				tags: post.postsToTags.map((pt) => pt.tag),
			})) as PostWithTags[]

		if (mappedTop.length >= limit) return mappedTop.slice(0, limit)

		const excludedIds = mappedTop.map((post) => post.id)
		const fallback = await db.query.posts.findMany({
			where: and(
				eq(posts.status, 'PUBLISHED'),
				isNull(posts.archivedAt),
				isNotNull(posts.poster),
				ne(posts.poster, ''),
				excludedIds.length > 0
					? sql`${posts.id} NOT IN (${sql.join(
							excludedIds.map((id) => sql`${id}`),
							sql`, `,
						)})`
					: undefined,
			),
			orderBy: [desc(posts.publishedAt)],
			limit: limit - mappedTop.length,
			with: {
				postsToTags: { with: { tag: true } },
			},
		})
		return [
			...mappedTop,
			...(fallback.map((post) => ({
				...post,
				tags: post.postsToTags.map((pt) => pt.tag),
			})) as PostWithTags[]),
		]
	} catch (error) {
		logger.error('Failed to fetch hottest posts with cover', error, { limit })
		return []
	}
}

export const fetchPinnedPosts = async (
	pinnedPostIds: string[] = [],
): Promise<PostWithTags[]> => {
	if (!pinnedPostIds || pinnedPostIds.length === 0) {
		return []
	}

	const results = await db.query.posts.findMany({
		where: and(
			inArray(posts.id, pinnedPostIds),
			eq(posts.status, 'PUBLISHED'),
			isNull(posts.archivedAt),
		),
		with: {
			postsToTags: {
				with: {
					tag: true,
				},
			},
		},
	})

	const mapped = results.map((post) => ({
		...post,
		tags: post.postsToTags.map((pt) => pt.tag),
	})) as PostWithTags[]

	// 按 pinnedPostIds 给定的指定顺序返回
	return pinnedPostIds
		.map((id) => mapped.find((p) => p.id === id))
		.filter((p): p is PostWithTags => Boolean(p))
}

export const fetchHomePageData = async (): Promise<HomePageData> => {
	const profile = await fetchProfile()
	const landingConfig = profile?.landingPageConfig

	const pinnedIds = landingConfig?.pinnedPostIds ?? []

	const [
		latestPosts,
		hottestPosts,
		hotGalleryImages,
		recentGalleries,
		pinnedPosts,
	] = await Promise.all([
		fetchPosts(6),
		fetchTopHottestPostsWithCover(3),
		fetchTopDiscussedGalleryImages(2),
		fetchRecentGalleriesForHome(2),
		pinnedIds.length > 0 ? fetchPinnedPosts(pinnedIds) : Promise.resolve([]),
	])

	return {
		profile,
		latestPosts,
		hottestPosts,
		hotGalleryImages,
		recentGalleries,
		pinnedPosts,
	}
}

export const fetchAllPostsForSearch = async (): Promise<PostWithTags[]> => {
	return await fetchPosts(200)
}

export const fetchAllTagsForSearch = async (): Promise<Tag[]> => {
	return await fetchTags()
}
