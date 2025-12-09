'use server'

import {
	fetchPosts,
	fetchPostBySlug,
	fetchTags,
	PostWithTags,
} from '../content-providers'
import type { PostType, Tag } from '@/generated/prisma/client'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function fetchPostsAction(
	type: PostType = 'BLOG',
): Promise<PostWithTags[]> {
	try {
		if (isDevelopment) console.log('[Prisma fetch]: blog posts')
		return await fetchPosts(type)
	} catch (error) {
		console.error('Error fetching blog posts:', error)
		throw new Error('Failed to fetch blog posts')
	}
}

export async function fetchTagsAction(): Promise<Tag[]> {
	try {
		if (isDevelopment) console.log('[Prisma fetch]: tags')
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
		if (isDevelopment) console.log(`[Prisma fetch]: blog post "${slug}"`)
		return await fetchPostBySlug(slug)
	} catch (error) {
		console.error(`Error fetching blog post ${slug}:`, error)
		throw new Error(`Failed to fetch blog post ${slug}`)
	}
}
