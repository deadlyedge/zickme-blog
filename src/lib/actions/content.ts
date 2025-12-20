'use server'

import {
	fetchPosts,
	fetchPostBySlug,
	fetchTags,
	fetchAllPostsForSearch,
	fetchAllTagsForSearch,
} from '@/lib/content-providers'
import type { PostWithTags, PostType, Tag } from '@/types'
import { getSiteProfile } from './profile'

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

export async function fetchSiteProfile() {
	return await getSiteProfile()
}

export async function fetchHomeContent() {
	const [projects, blog, siteProfile] = await Promise.all([
		fetchPostsAction('PROJECT').then((posts) => posts.slice(0, 3)),
		fetchPostsAction('BLOG').then((posts) => posts.slice(0, 3)),
		fetchSiteProfile(),
	])

	return {
		projects,
		blog,
		profile: siteProfile.profile,
	}
}

export async function fetchAllContentForSearchAction() {
	try {
		if (isDevelopment) console.log('[Prisma fetch]: all content for search')
		const [posts, tags] = await Promise.all([
			fetchAllPostsForSearch(),
			fetchAllTagsForSearch(),
		])

		// 区分不同类型的posts
		const blogPosts = posts.filter((post) => post.type === 'BLOG')
		const projectPosts = posts.filter((post) => post.type === 'PROJECT')

		// 为每个tag添加类型信息
		const blogTags = tags
			.filter((tag) => tag.postTypes.includes('BLOG'))
			.map((tag) => ({ ...tag, type: 'BLOG' as const }))

		const projectTags = tags
			.filter((tag) => tag.postTypes.includes('PROJECT'))
			.map((tag) => ({ ...tag, type: 'PROJECT' as const }))

		return {
			blogPosts,
			projectPosts,
			blogTags,
			projectTags,
		}
	} catch (error) {
		console.error('Error fetching content for search:', error)
		throw new Error('Failed to fetch content for search')
	}
}
