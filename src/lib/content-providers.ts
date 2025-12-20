import { prisma } from '@/lib/prisma'
import type { ContentResponse, PostWithTags, SiteProfile, Tag, PostType } from '@/types'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
	throw new Error('content-providers can only be used on the server side')
}

export const fetchProfile = async (): Promise<SiteProfile> => {
	return prisma.siteProfile.findFirst() as Promise<SiteProfile>
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
	const [profile, projects, blog] = await Promise.all([
		prisma.siteProfile.findFirst() as Promise<SiteProfile>,
		prisma.post.findMany({
			where: {
				type: 'PROJECT',
				status: 'PUBLISHED',
			},
			include: { tags: true },
			orderBy: { publishedAt: 'desc' },
			take: 3,
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
		projects,
		blog,
	}
}

export const fetchAllPostsForSearch = async (): Promise<PostWithTags[]> => {
	return prisma.post.findMany({
		where: {
			status: 'PUBLISHED',
		},
		include: { tags: true },
		orderBy: { publishedAt: 'desc' },
	})
}

export const fetchAllTagsForSearch = async (): Promise<(Tag & { postTypes: string[] })[]> => {
	const tags = await prisma.tag.findMany({
		include: {
			posts: {
				where: {
					status: 'PUBLISHED',
				},
				select: {
					type: true,
				},
			},
		},
		orderBy: { name: 'asc' },
	})

	// 为每个tag添加postTypes数组
	return tags.map(tag => ({
		...tag,
		postTypes: [...new Set(tag.posts.map(post => post.type))], // 去重
	}))
}

// export const fetchContent = async (): Promise<ContentResponse> => {
// 	const [profile, posts] = await Promise.all([fetchProfile(), fetchPosts()])

// 	return {
// 		profile,
// 		posts,
// 	}
// }
