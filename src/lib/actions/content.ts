'use server'

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
import type { PostWithTags, Tag } from '@/types'
import { getSiteProfile } from './profile'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function fetchPostsAction(limit = 100): Promise<PostWithTags[]> {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: posts')
		return await fetchPosts(limit)
	} catch (error) {
		console.error('Error fetching posts:', error)
		throw new Error('Failed to fetch posts')
	}
}

export async function fetchTagsAction(): Promise<Tag[]> {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: tags')
		return await fetchTags()
	} catch (error) {
		console.error('Error fetching tags:', error)
		throw new Error('Failed to fetch tags')
	}
}

export async function fetchPostBySlugAction(
	slug: string,
): Promise<PostWithTags | null> {
	try {
		if (isDevelopment) console.log(`[Drizzle fetch]: post "${slug}"`)
		return await fetchPostBySlug(slug)
	} catch (error) {
		console.error(`Error fetching post ${slug}:`, error)
		throw new Error(`Failed to fetch post ${slug}`)
	}
}

export async function fetchTopHottestPostsAction(
	limit = 5,
): Promise<PostWithTags[]> {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: hottest posts')
		return await fetchTopHottestPosts(limit)
	} catch (error) {
		console.error('Error fetching hottest posts:', error)
		throw new Error('Failed to fetch hottest posts')
	}
}

export async function fetchPinnedPostsAction(
	pinnedPostIds: string[] = [],
): Promise<PostWithTags[]> {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: pinned posts')
		return await fetchPinnedPosts(pinnedPostIds)
	} catch (error) {
		console.error('Error fetching pinned posts:', error)
		throw new Error('Failed to fetch pinned posts')
	}
}

export async function fetchSiteProfile() {
	return await getSiteProfile()
}

export async function fetchHomeContent() {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: home content')
		return await fetchHomeContentProvider()
	} catch (error) {
		console.error('Error fetching home content:', error)
		throw new Error('Failed to fetch home content')
	}
}

export async function fetchAllContentForSearchAction() {
	try {
		if (isDevelopment) console.log('[Drizzle fetch]: all content for search')
		const [allPosts, allTags] = await Promise.all([
			fetchAllPostsForSearch(),
			fetchAllTagsForSearch(),
		])

		return {
			posts: allPosts,
			tags: allTags,
		}
	} catch (error) {
		console.error('Error fetching content for search:', error)
		throw new Error('Failed to fetch content for search')
	}
}
