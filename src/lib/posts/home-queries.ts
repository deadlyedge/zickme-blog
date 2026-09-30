import {
	and,
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
import { comments, posts } from '@/db/schema'
import {
	fetchRecentGalleriesForHome,
	fetchTopDiscussedGalleryImages,
} from '@/lib/gallery/home-queries'
import { createLogger } from '@/lib/logger'
import { fetchPosts, fetchProfile } from '@/lib/posts/post-queries'
import type { HomePageData } from '@/types/content/home'
import type { PostWithTags } from '@/types/content/post'

const logger = createLogger('lib/posts/home-queries')

if (typeof window !== 'undefined') {
	throw new Error('Homepage queries can only be used on the server side')
}

/** Fetches the most-discussed published posts, falling back to recent posts. */
export const fetchTopHottestPosts = async (
	limit = 5,
): Promise<PostWithTags[]> => {
	try {
		const topCommentedPostsRaw = await db
			.select({ id: posts.id, commentsCount: count(comments.id) })
			.from(posts)
			.innerJoin(
				comments,
				and(eq(comments.postId, posts.id), eq(comments.status, 'PUBLISHED')),
			)
			.where(and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)))
			.groupBy(posts.id)
			.orderBy(desc(count(comments.id)))
			.limit(limit)

		const topIds = topCommentedPostsRaw.map((post) => post.id)
		if (topIds.length === 0) return fetchPosts(limit)

		const results = await db.query.posts.findMany({
			where: inArray(posts.id, topIds),
			with: { postsToTags: { with: { tag: true } } },
		})
		const mappedResults = results.map((post) => ({
			...post,
			tags: post.postsToTags.map((postTag) => postTag.tag),
		})) as PostWithTags[]

		const sorted = topIds
			.map((id) => mappedResults.find((post) => post.id === id))
			.filter((post): post is PostWithTags => Boolean(post))

		if (sorted.length >= limit) return sorted

		const excludeIds = sorted.map((post) => post.id)
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
			with: { postsToTags: { with: { tag: true } } },
		})
		const fallbackMapped = fallbackPosts.map((post) => ({
			...post,
			tags: post.postsToTags.map((postTag) => postTag.tag),
		})) as PostWithTags[]
		return [...sorted, ...fallbackMapped]
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

/** Fetches the most-discussed posts that have a cover image, then recent covered posts. */
export const fetchTopHottestPostsWithCover = async (
	limit = 3,
): Promise<PostWithTags[]> => {
	try {
		const topCommentedPosts = await db
			.select({ id: posts.id, commentsCount: count(comments.id) })
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
			with: { postsToTags: { with: { tag: true } } },
		})
		const mappedTop = topIds
			.map((id) => topPosts.find((post) => post.id === id))
			.filter((post): post is (typeof topPosts)[number] => Boolean(post))
			.map((post) => ({
				...post,
				tags: post.postsToTags.map((postTag) => postTag.tag),
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
			with: { postsToTags: { with: { tag: true } } },
		})
		return [
			...mappedTop,
			...(fallback.map((post) => ({
				...post,
				tags: post.postsToTags.map((postTag) => postTag.tag),
			})) as PostWithTags[]),
		]
	} catch (error) {
		logger.error('Failed to fetch hottest posts with cover', error, { limit })
		return []
	}
}

/** Returns pinned published posts in the configured ID order. */
export const fetchPinnedPosts = async (
	pinnedPostIds: string[] = [],
): Promise<PostWithTags[]> => {
	if (pinnedPostIds.length === 0) return []

	const results = await db.query.posts.findMany({
		where: and(
			inArray(posts.id, pinnedPostIds),
			eq(posts.status, 'PUBLISHED'),
			isNull(posts.archivedAt),
		),
		with: { postsToTags: { with: { tag: true } } },
	})
	const mapped = results.map((post) => ({
		...post,
		tags: post.postsToTags.map((postTag) => postTag.tag),
	})) as PostWithTags[]
	return pinnedPostIds
		.map((id) => mapped.find((post) => post.id === id))
		.filter((post): post is PostWithTags => Boolean(post))
}

/** Assembles all Post and Gallery data used by the landing page. */
export const fetchHomePageData = async (): Promise<HomePageData> => {
	const profile = await fetchProfile()
	const pinnedIds = profile?.landingPageConfig?.pinnedPostIds ?? []
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
