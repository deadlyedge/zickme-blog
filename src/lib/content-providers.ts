import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Profile, Post, Project } from '@/payload-types'
import { safeExtract } from '@/lib/utils'

// type PostDocument = Config['collections']['posts']
// type ProjectDocument = Config['collections']['projects']
// type ProfileDocument = Config['collections']['profile']
// type TagDocument = Config['collections']['tags']

// 使用继承生成type
// export type SocialLink = NonNullable<Profile['socialLinks']>[0]

// export type Skill = Omit<NonNullable<Profile['skills']>[0], 'technologies'> & {
// 	technologies: NonNullable<NonNullable<Profile['skills']>[0]['technologies']>
// }

// export type SocialLink = {
// 	platform:
// 		| 'GitHub'
// 		| 'LinkedIn'
// 		| 'Twitter'
// 		| 'Instagram'
// 		| 'YouTube'
// 		| 'Other'
// 	url: string
// 	username?: string | null
// }

// export type Skill = {
// 	category: string
// 	technologies: {
// 		name: string
// 		level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
// 	}[]
// }

export type TagViewModel = {
	name: string
	slug: string
	color: string | null
}

export type BlogPostViewModel = Omit<Post, 'tags'> & {
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
	// name: string
	// title: string
	// bio: string
	// avatarUrl: string | null
	// location?: string | null
	// email?: string | null
	// website?: string | null
	// socialLinks: SocialLink[]
	// skills: Skill[]
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
		// socialLinks: profile.socialLinks ?? [],
		// skills:
		// 	profile.skills?.map((skill) => ({
		// 		category: skill.category,
		// 		technologies: skill.technologies ?? [],
		// 	})) ?? [],
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

	const postsResult = await payload.find({
		collection: 'posts',
		where: {
			status: {
				equals: 'published',
			},
		},
		sort: '-publishedAt',
		limit: 6,
		depth: 2,
	})

	return postsResult.docs.map(mapBlogPost)
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
