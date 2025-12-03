import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Profile, Post, Project } from '@/payload-types'
import { safeExtract } from '@/lib/utils'

export type TagViewModel = {
	name: string
	slug: string
	color: string | null
}

export type BlogPostViewModel = Omit<Post, 'tags'> & {
	featuredImageUrl: string | null
	tags: TagViewModel[]
}

export type BlogPostDetailViewModel = Omit<Post, 'tags' | 'featuredImage'> & {
	featuredImageUrl: string | null
	tags: TagViewModel[]
}

export type ProjectViewModel = Omit<Project, 'images'> & {
	images: {
		url: string | null
		caption?: string | null
	}[]
}

export type ProfileViewModel = {
	avatarUrl: string | null
} & Profile

export type ContentResponse = {
	profile: ProfileViewModel | null
	projects: ProjectViewModel[]
	blogPosts: BlogPostViewModel[]
}

const mapProfile = (profile: Profile | null): ProfileViewModel | null => {
	if (!profile) {
		return null
	}

	const avatar = safeExtract(profile.avatar)

	return {
		...profile,
		avatarUrl: avatar?.url ?? null,
	}
}

const mapProject = (project: Project): ProjectViewModel => {
	const images =
		project.images?.map((img) => {
			const image = safeExtract(img.image)
			return {
				url: image?.url ?? null,
				caption: img.caption ?? null,
			}
		}) ?? []

	return {
		...project,
		images,
	}
}

const mapBlogPost = (post: Post): BlogPostViewModel => {
	const featuredImage = safeExtract(post.featuredImage)

	// 处理 tags，可能是 number[] 或 Tag[]，需要安全提取
	const tags =
		post.tags
			?.map((tag) => {
				if (typeof tag === 'number') {
					// 如果是 number，说明 depth 不够，返回空对象或跳过
					return null
				}
				return {
					name: tag.name,
					slug: tag.slug,
					color: tag.color,
				}
			})
			.filter((tag): tag is TagViewModel => tag !== null) ?? []

	return {
		...post,
		featuredImageUrl: featuredImage?.url ?? null,
		tags,
	}
}

const mapBlogPostDetail = (post: Post): BlogPostDetailViewModel => {
	const featuredImage = safeExtract(post.featuredImage)

	// 处理 tags，可能是 number[] 或 Tag[]，需要安全提取
	const tags =
		post.tags
			?.map((tag) => {
				if (typeof tag === 'number') {
					// 如果是 number，说明 depth 不够，返回空对象或跳过
					return null
				}
				return {
					name: tag.name,
					slug: tag.slug,
					color: tag.color,
				}
			})
			.filter((tag): tag is TagViewModel => tag !== null) ?? []

	return {
		...post,
		featuredImageUrl: featuredImage?.url ?? null,
		tags,
	}
}

export const fetchProfile = async (): Promise<ProfileViewModel | null> => {
	const payload = await getPayload({
		config: configPromise,
	})

	const profileResult = await payload.find({
		collection: 'profile',
		limit: 1,
		sort: '-createdAt',
		depth: 2,
	})

	return mapProfile(profileResult.docs[0] ?? null)
}

export const fetchProjects = async (): Promise<ProjectViewModel[]> => {
	const payload = await getPayload({
		config: configPromise,
	})

	const projectsResult = await payload.find({
		collection: 'projects',
		sort: '-createdAt',
		limit: 10,
		depth: 2,
	})

	return projectsResult.docs.map(mapProject)
}

export const fetchBlogPosts = async (): Promise<BlogPostViewModel[]> => {
	const payload = await getPayload({
		config: configPromise,
	})

	// const where: Record<string, any> = {
	// 	status: {
	// 		equals: 'published',
	// 	},
	// }

	// // 如果提供了标签slug，则添加标签过滤条件
	// if (tagSlug) {
	// 	where.tags = {
	// 		slug: {
	// 			equals: tagSlug,
	// 		},
	// 	}
	// }

	const postsResult = await payload.find({
		collection: 'posts',
		// where,
		sort: '-publishedAt',
		limit: 6,
		depth: 2,
	})

	return postsResult.docs.map(mapBlogPost)
}

export const fetchBlogPostBySlug = async (
	slug: string,
): Promise<BlogPostDetailViewModel | null> => {
	const payload = await getPayload({
		config: configPromise,
	})

	const postsResult = await payload.find({
		collection: 'posts',
		where: {
			slug: {
				equals: slug,
			},
			status: {
				equals: 'published',
			},
		},
		depth: 2,
	})

	const post = postsResult.docs[0]
	if (!post) {
		return null
	}

	return mapBlogPostDetail(post)
}

export const fetchTags = async (): Promise<TagViewModel[]> => {
	const payload = await getPayload({
		config: configPromise,
	})

	const tagsResult = await payload.find({
		collection: 'tags',
		sort: 'name',
	})

	return tagsResult.docs.map((tag) => ({
		name: tag.name,
		slug: tag.slug,
		color: tag.color ?? null,
	}))
}

export const fetchHomeContent = async (): Promise<ContentResponse> => {
	const payload = await getPayload({ config: configPromise })

	const [profileResult, projectsResult, postsResult] = await Promise.all([
		payload.find({
			collection: 'profile',
			limit: 1,
			sort: '-createdAt',
			depth: 2,
		}),
		payload.find({
			collection: 'projects',
			sort: '-createdAt',
			limit: 3, // 只获取首页需要的3个项目
			depth: 2,
		}),
		payload.find({
			collection: 'posts',
			sort: '-publishedAt',
			limit: 3, // 只获取首页需要的3个博客文章
			depth: 2,
		}),
	])

	return {
		profile: mapProfile(profileResult.docs[0] ?? null),
		projects: projectsResult.docs.map(mapProject),
		blogPosts: postsResult.docs.map(mapBlogPost),
	}
}

export const fetchContent = async (): Promise<ContentResponse> => {
	const [profile, projects, blogPosts] = await Promise.all([
		fetchProfile(),
		fetchProjects(),
		fetchBlogPosts(),
	])

	return {
		profile,
		projects,
		blogPosts,
	}
}
