import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { posts, tags } from '@/db/schema'
import type { ContentResponse, PostWithTags, SiteProfile, Tag } from '@/types'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
	throw new Error('content-providers can only be used on the server side')
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

export const fetchHomeContent = async (): Promise<ContentResponse> => {
	const [profile, latestPosts] = await Promise.all([
		fetchProfile(),
		fetchPosts(6),
	])

	return {
		profile,
		posts: latestPosts,
	}
}

export const fetchAllPostsForSearch = async (): Promise<PostWithTags[]> => {
	return await fetchPosts(200)
}

export const fetchAllTagsForSearch = async (): Promise<Tag[]> => {
	return await fetchTags()
}
