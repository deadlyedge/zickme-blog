import { prisma } from '@/lib/prisma'
import type { SiteProfile, Post, Tag } from '@/generated/prisma/client'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
	throw new Error('content-providers can only be used on the server side')
}

export type ContentResponse = {
	profile: SiteProfile | null
	blogPosts: Post[]
}

export const fetchProfile = async (): Promise<SiteProfile | null> => {
	return prisma.siteProfile.findFirst({
		include: { avatar: true },
		orderBy: { createdAt: 'desc' },
	})
}

export const fetchBlogPosts = async (): Promise<Post[]> => {
	return prisma.post.findMany({
		where: {
			type: 'BLOG',
			status: 'PUBLISHED',
		},
		include: { tags: true },
		orderBy: { publishedAt: 'desc' },
		take: 6,
	})
}

export const fetchBlogPostBySlug = async (slug: string): Promise<Post | null> => {
	return prisma.post.findFirst({
		where: {
			slug,
			type: 'BLOG',
			status: 'PUBLISHED',
		},
		include: { tags: true },
	})
}

export const fetchAllBlogPostSlugs = async (): Promise<string[]> => {
	const posts = await prisma.post.findMany({
		where: {
			type: 'BLOG',
			status: 'PUBLISHED',
		},
		select: {
			slug: true,
		},
	})

	return posts.map((post) => post.slug)
}

export const fetchTags = async (): Promise<Tag[]> => {
	return prisma.tag.findMany({
		orderBy: { name: 'asc' },
	})
}

export const fetchHomeContent = async (): Promise<ContentResponse> => {
	const [profile, blogPosts] = await Promise.all([
		prisma.siteProfile.findFirst({
			include: { avatar: true },
			orderBy: { createdAt: 'desc' },
		}),
		prisma.post.findMany({
			where: {
				type: 'BLOG',
				status: 'PUBLISHED',
			},
			include: { tags: true },
			orderBy: { publishedAt: 'desc' },
			take: 3,
		}),
	])

	return {
		profile,
		blogPosts,
	}
}

export const fetchContent = async (): Promise<ContentResponse> => {
	const [profile, blogPosts] = await Promise.all([
		fetchProfile(),
		fetchBlogPosts(),
	])

	return {
		profile,
		blogPosts,
	}
}
