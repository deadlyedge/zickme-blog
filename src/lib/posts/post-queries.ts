import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { posts, tags } from '@/db/schema'
import type { PostWithTags } from '@/types/content/post'
import type { Tag } from '@/types/content/tag'
import type { SiteProfile } from '@/types/site'

if (typeof window !== 'undefined') {
	throw new Error('Post queries can only be used on the server side')
}

/** Fetches the site profile used by public pages and dashboard settings. */
export const fetchProfile = async (): Promise<SiteProfile | null> => {
	const result = await db.query.siteProfile.findFirst()
	return (result as unknown as SiteProfile) ?? null
}

/** Fetches published, non-archived posts and their tags, newest first. */
export const fetchPosts = async (limit = 100): Promise<PostWithTags[]> => {
	const results = await db.query.posts.findMany({
		where: and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)),
		orderBy: [desc(posts.publishedAt)],
		limit,
		with: { postsToTags: { with: { tag: true } } },
	})

	return results.map((post) => ({
		...post,
		tags: post.postsToTags.map((postTag) => postTag.tag),
	})) as PostWithTags[]
}

/** Fetches one published post by slug, including its tags. */
export const fetchPostBySlug = async (
	slug: string,
): Promise<PostWithTags | null> => {
	const post = await db.query.posts.findFirst({
		where: and(
			eq(posts.slug, slug),
			eq(posts.status, 'PUBLISHED'),
			isNull(posts.archivedAt),
		),
		with: { postsToTags: { with: { tag: true } } },
	})

	if (!post) return null
	return {
		...post,
		tags: post.postsToTags.map((postTag) => postTag.tag),
	} as PostWithTags
}

/** Fetches all published, non-archived post slugs for static route generation. */
export const fetchAllPostSlugs = async (): Promise<string[]> => {
	const results = await db
		.select({ slug: posts.slug })
		.from(posts)
		.where(and(eq(posts.status, 'PUBLISHED'), isNull(posts.archivedAt)))
	return results.map((post) => post.slug)
}

/** Fetches all tags alphabetically. */
export const fetchTags = async (): Promise<Tag[]> =>
	db.query.tags.findMany({ orderBy: [asc(tags.name)] })

/** Fetches the bounded list of published posts used by global search. */
export const fetchAllPostsForSearch = async (): Promise<PostWithTags[]> =>
	fetchPosts(200)

/** Fetches tags used by global search. */
export const fetchAllTagsForSearch = async (): Promise<Tag[]> => fetchTags()
