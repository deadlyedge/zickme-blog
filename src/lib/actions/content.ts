'use server'

import { z } from 'zod'
import {
	fetchAllPostsForSearch,
	fetchAllTagsForSearch,
	fetchHomeContent as fetchHomeContentProvider,
	fetchPinnedPosts,
	fetchPostBySlug,
	fetchPosts,
	fetchTags,
	fetchTopHottestPosts,
} from '@/lib/content-providers'
import { createLogger } from '@/lib/logger'
import type { PostWithTags, Tag } from '@/types'
import { getSiteProfile } from './profile'

const logger = createLogger('actions/content')

const limitSchema = z.number().int().min(1).max(200).default(100)
const slugSchema = z.string().trim().min(1).max(200)
const pinnedIdsSchema = z.array(z.string().min(1).max(128))

export async function fetchPostsAction(limit = 100): Promise<PostWithTags[]> {
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
	limit = 5,
): Promise<PostWithTags[]> {
	try {
		const safeLimit =
			z.number().int().min(1).max(20).default(5).safeParse(limit).data ?? 5
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

export async function fetchHomeContent() {
	try {
		logger.debug('[Drizzle fetch]: home content')
		return await fetchHomeContentProvider()
	} catch (error) {
		logger.error('Error fetching home content', error)
		throw new Error('Failed to fetch home content')
	}
}

export async function fetchAllContentForSearchAction() {
	try {
		logger.debug('[Drizzle fetch]: all content for search')
		const [allPosts, allTags] = await Promise.all([
			fetchAllPostsForSearch(),
			fetchAllTagsForSearch(),
		])

		return {
			posts: allPosts,
			tags: allTags,
		}
	} catch (error) {
		logger.error('Error fetching content for search', error)
		throw new Error('Failed to fetch content for search')
	}
}
