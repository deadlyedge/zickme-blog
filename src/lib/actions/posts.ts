'use server'

import { z } from 'zod'
import { POST_QUERY_LIMITS, POST_RULES } from '@/constants/post'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { createLogger } from '@/lib/logger'
import {
	fetchHomePageData as fetchHomePageDataProvider,
	fetchPinnedPosts,
	fetchTopHottestPosts,
} from '@/lib/posts/home-queries'
import {
	fetchPostBySlug,
	fetchPosts,
	fetchTags,
} from '@/lib/posts/post-queries'
import type { HomePageData } from '@/types/content/home'
import type { PostWithTags } from '@/types/content/post'
import type { Tag } from '@/types/content/tag'
import { getSiteProfile } from './profile'

const logger = createLogger('actions/posts')

const limitSchema = z
	.number()
	.int()
	.min(1)
	.max(POST_QUERY_LIMITS.posts.max)
	.default(POST_QUERY_LIMITS.posts.default)
const slugSchema = z.string().trim().min(1).max(POST_RULES.slugMaxLength)
const pinnedIdsSchema = z.array(z.string().min(1).max(POST_RULES.idMaxLength))

export async function fetchPostsAction(
	limit = POST_QUERY_LIMITS.posts.default,
): Promise<ActionResult<PostWithTags[]>> {
	try {
		const safeLimit = limitSchema.safeParse(limit).data ?? 100
		logger.debug('[Drizzle fetch]: posts')
		return actionSuccess(await fetchPosts(safeLimit))
	} catch (error) {
		logger.error('Error fetching posts', error)
		return actionFailure('Failed to fetch posts')
	}
}

export async function fetchTagsAction(): Promise<ActionResult<Tag[]>> {
	try {
		logger.debug('[Drizzle fetch]: tags')
		return actionSuccess(await fetchTags())
	} catch (error) {
		logger.error('Error fetching tags', error)
		return actionFailure('Failed to fetch tags')
	}
}

export async function fetchPostBySlugAction(
	slug: string,
): Promise<ActionResult<PostWithTags | null>> {
	try {
		const parsedSlug = slugSchema.safeParse(slug)
		if (!parsedSlug.success) return actionFailure('文章标识无效')
		logger.debug(`[Drizzle fetch]: post "${parsedSlug.data}"`)
		return actionSuccess(await fetchPostBySlug(parsedSlug.data))
	} catch (error) {
		logger.error(`Error fetching post ${slug}`, error)
		return actionFailure(`Failed to fetch post ${slug}`)
	}
}

export async function fetchTopHottestPostsAction(
	limit = POST_QUERY_LIMITS.hottestPosts.default,
): Promise<ActionResult<PostWithTags[]>> {
	try {
		const safeLimit =
			z
				.number()
				.int()
				.min(1)
				.max(POST_QUERY_LIMITS.hottestPosts.max)
				.default(POST_QUERY_LIMITS.hottestPosts.default)
				.safeParse(limit).data ?? POST_QUERY_LIMITS.hottestPosts.default
		logger.debug('[Drizzle fetch]: hottest posts')
		return actionSuccess(await fetchTopHottestPosts(safeLimit))
	} catch (error) {
		logger.error('Error fetching hottest posts', error)
		return actionFailure('Failed to fetch hottest posts')
	}
}

export async function fetchPinnedPostsAction(
	pinnedPostIds: string[] = [],
): Promise<ActionResult<PostWithTags[]>> {
	try {
		const parsedIds = pinnedIdsSchema.safeParse(pinnedPostIds)
		const safeIds = parsedIds.success ? parsedIds.data : []
		logger.debug('[Drizzle fetch]: pinned posts')
		return actionSuccess(await fetchPinnedPosts(safeIds))
	} catch (error) {
		logger.error('Error fetching pinned posts', error)
		return actionFailure('Failed to fetch pinned posts')
	}
}

export async function fetchSiteProfile(): Promise<
	Awaited<ReturnType<typeof getSiteProfile>>
> {
	return await getSiteProfile()
}

export async function fetchHomePageData(): Promise<ActionResult<HomePageData>> {
	try {
		logger.debug('[Drizzle fetch]: home content')
		return actionSuccess(await fetchHomePageDataProvider())
	} catch (error) {
		logger.error('Error fetching home content', error)
		return actionFailure('Failed to fetch home content')
	}
}

export async function fetchPostsForSearchAction(): Promise<
	ActionResult<{ posts: PostWithTags[]; tags: Tag[] }>
> {
	try {
		logger.debug('[Drizzle fetch]: posts for search')
		const [allPosts, allTags] = await Promise.all([
			fetchPosts(200),
			fetchTags(),
		])

		return actionSuccess({
			posts: allPosts,
			tags: allTags,
		})
	} catch (error) {
		logger.error('Error fetching posts for search', error)
		return actionFailure('Failed to fetch posts for search')
	}
}
