import { prisma } from '@/lib/prisma'
import type {
	SiteProfile,
	Post,
	Tag,
	PostType,
} from '@/generated/prisma/client'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
	throw new Error('content-providers can only be used on the server side')
}

export type ContentResponse = {
	profile: SiteProfile | null
	posts: PostWithTags[]
}

export type PostWithTags = Post & {
	tags:
		| {
				id: string
				name: string
				slug: string
				color: string | null
		  }[]
		| null
}

export const fetchProfile = async (): Promise<SiteProfile | null> => {
	return prisma.siteProfile.findFirst({
		include: { avatar: true },
		orderBy: { createdAt: 'desc' },
	})
}

export const fetchPosts = async (
	type: PostType = 'BLOG',
): Promise<PostWithTags[]> => {
	return prisma.post.findMany({
		where: {
			type,
			status: 'PUBLISHED',
		},
		include: { tags: true },
		orderBy: { publishedAt: 'desc' },
		take: 6,
	})
}

export const fetchPostBySlug = async (
	slug: string,
): Promise<PostWithTags | null> => {
	return prisma.post.findFirst({
		where: {
			slug,
			// type: 'BLOG',
			status: 'PUBLISHED',
		},
		include: { tags: true },
	})
}

export const fetchAllPostSlugs = async (type?: PostType): Promise<string[]> => {
	const posts = await prisma.post.findMany({
		where: {
			type: type ?? 'BLOG',
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
	const [profile, posts] = await Promise.all([
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
		posts,
	}
}

export const fetchContent = async (): Promise<ContentResponse> => {
	const [profile, posts] = await Promise.all([fetchProfile(), fetchPosts()])

	return {
		profile,
		posts,
	}
}
