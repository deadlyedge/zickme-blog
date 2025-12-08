'use server'

import {
	fetchPosts,
	fetchPostBySlug,
	fetchTags,
} from '../content-providers'
import type { Post, Tag } from '@/generated/prisma/client'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function fetchPostsAction(): Promise<Post[]> {
	try {
		if (isDevelopment) console.log('[Prisma fetch]: blog posts')
		return await fetchPosts()
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
): Promise<Post | null> {
	try {
		if (isDevelopment) console.log(`[Prisma fetch]: blog post "${slug}"`)
		return await fetchPostBySlug(slug)
	} catch (error) {
		console.error(`Error fetching blog post ${slug}:`, error)
		throw new Error(`Failed to fetch blog post ${slug}`)
	}
}
