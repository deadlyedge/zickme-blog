'use server'

import { z } from 'zod'
import { POST_QUERY_LIMITS, POST_RULES } from '@/constants/post'
import { createLogger } from '@/lib/logger'
import {
	fetchAllPostsForSearch,
	fetchAllTagsForSearch,
	fetchHomePageData as fetchHomePageDataProvider,
	fetchPinnedPosts,
	fetchPostBySlug,
	fetchPosts,
	fetchTags,
	fetchTopHottestPosts,
} from '@/lib/post-providers'
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
): Promise<PostWithTags[]> {
	try {
		const safeLimit = limitSchema.safeParse(limit).data ?? 100
		logger.debug('[Drizzle fetch]: posts')
		return await fetchPosts(safeLimit)
	} catch (error) {
		logger.error('Error fetching posts', error)
		throw new Error('Failed to fetch posts')
	}
}

export async function fetchTagsAction(): Promise<Tag[]> {
	try {
		logger.debug('[Drizzle fetch]: tags')
		return await fetchTags()
	} catch (error) {
		logger.error('Error fetching tags', error)
		throw new Error('Failed to fetch tags')
	}
}

export async function fetchPostBySlugAction(
	slug: string,
): Promise<PostWithTags | null> {
	try {
		const parsedSlug = slugSchema.safeParse(slug)
		if (!parsedSlug.success) return null
		logger.debug(`[Drizzle fetch]: post "${parsedSlug.data}"`)
		return await fetchPostBySlug(parsedSlug.data)
	} catch (error) {
		logger.error(`Error fetching post ${slug}`, error)
		throw new Error(`Failed to fetch post ${slug}`)
	}
}

export async function fetchTopHottestPostsAction(
	limit = POST_QUERY_LIMITS.hottestPosts.default,
): Promise<PostWithTags[]> {
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
		return await fetchTopHottestPosts(safeLimit)
	} catch (error) {
		logger.error('Error fetching hottest posts', error)
		throw new Error('Failed to fetch hottest posts')
	}
}

export async function fetchPinnedPostsAction(
	pinnedPostIds: string[] = [],
): Promise<PostWithTags[]> {
	try {
		const parsedIds = pinnedIdsSchema.safeParse(pinnedPostIds)
		const safeIds = parsedIds.success ? parsedIds.data : []
		logger.debug('[Drizzle fetch]: pinned posts')
		return await fetchPinnedPosts(safeIds)
	} catch (error) {
		logger.error('Error fetching pinned posts', error)
		throw new Error('Failed to fetch pinned posts')
	}
}

export async function fetchSiteProfile() {
	return await getSiteProfile()
}

export async function fetchHomePageData(): Promise<HomePageData> {
	try {
		logger.debug('[Drizzle fetch]: home content')
		return await fetchHomePageDataProvider()
	} catch (error) {
		logger.error('Error fetching home content', error)
		throw new Error('Failed to fetch home content')
	}
}

export async function fetchPostsForSearchAction() {
	try {
		logger.debug('[Drizzle fetch]: posts for search')
		const [allPosts, allTags] = await Promise.all([
			fetchAllPostsForSearch(),
			fetchAllTagsForSearch(),
		])

		return {
			posts: allPosts,
			tags: allTags,
		}
	} catch (error) {
		logger.error('Error fetching posts for search', error)
		throw new Error('Failed to fetch posts for search')
	}
}
