import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Config } from '@/payload-types'
import { getCoverUrl, safeExtract } from '@/lib/utils'

type PostDocument = Config['collections']['posts']
type ProjectDocument = Config['collections']['projects']
type ProfileDocument = Config['collections']['profile']
type TagDocument = Config['collections']['tags']

export type SocialLink = {
	platform: 'GitHub' | 'LinkedIn' | 'Twitter' | 'Instagram' | 'YouTube' | 'Other'
	url: string
	username?: string | null
}

export type Skill = {
	category: string
	technologies: {
		name: string
		level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
	}[]
}

export type BlogPostViewModel = {
	title: string
	slug: string
	excerpt: string | null
	publishedAt: string | null
	featuredImageUrl: string | null
	tags: {
		name: string
		slug: string
		color?: string | null
	}[]
}

export type ProjectViewModel = {
	title: string
	description: string
	technologies: {
		name: string
		url?: string | null
	}[]
	images: {
		url: string | null
		caption?: string | null
	}[]
	demoUrl?: string | null
	sourceUrl?: string | null
	featured?: boolean | null
	startDate?: string | null
	endDate?: string | null
}

export type ProfileViewModel = {
	name: string
	title: string
	bio: string
	avatarUrl: string | null
	location?: string | null
	email?: string | null
	website?: string | null
	socialLinks: SocialLink[]
	skills: Skill[]
}

export type ContentResponse = {
	profile: ProfileViewModel | null
	projects: ProjectViewModel[]
	blogPosts: BlogPostViewModel[]
}

const mapProfile = (profile: ProfileDocument | null): ProfileViewModel | null => {
	if (!profile) {
		return null
	}

	const avatar = safeExtract(profile.avatar)

	return {
		name: profile.name,
		title: profile.title,
		bio: profile.bio,
		avatarUrl: avatar?.url ?? null,
		location: profile.location ?? null,
		email: profile.email ?? null,
		website: profile.website ?? null,
		socialLinks: profile.socialLinks ?? [],
		skills: profile.skills?.map(skill => ({
			category: skill.category,
			technologies: skill.technologies ?? []
		})) ?? []
	}
}

const mapProject = (project: ProjectDocument): ProjectViewModel => {
	const images = project.images?.map(img => {
		const image = safeExtract(img.image)
		return {
			url: image?.url ?? null,
			caption: img.caption ?? null
		}
	}) ?? []

	return {
		title: project.title,
		description: project.description,
		technologies: project.technologies ?? [],
		images,
		demoUrl: project.demoUrl ?? null,
		sourceUrl: project.sourceUrl ?? null,
		featured: project.featured ?? null,
		startDate: project.startDate ?? null,
		endDate: project.endDate ?? null,
	}
}

const mapBlogPost = (post: PostDocument): BlogPostViewModel => {
	const featuredImage = safeExtract(post.featuredImage)

	// 处理 tags，可能是 number[] 或 Tag[]，需要安全提取
	const tags = post.tags?.map(tag => {
		if (typeof tag === 'number') {
			// 如果是 number，说明 depth 不够，返回空对象或跳过
			return null
		}
		return {
			name: tag.name,
			slug: tag.slug,
			color: tag.color ?? null
		}
	}).filter((tag): tag is { name: string; slug: string; color: string | null } => tag !== null) ?? []

	return {
		title: post.title,
		slug: post.slug,
		excerpt: post.excerpt ?? null,
		publishedAt: post.publishedAt ?? null,
		featuredImageUrl: featuredImage?.url ?? null,
		tags
	}
}

export const fetchContent = async (): Promise<ContentResponse> => {
	const payload = await getPayload({
		config: configPromise,
	})

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
			limit: 10,
			depth: 2,
		}),
		payload.find({
			collection: 'posts',
			where: {
				status: {
					equals: 'published',
				},
			},
			sort: '-publishedAt',
			limit: 6,
			depth: 2,
		}),
	])

	return {
		profile: mapProfile(profileResult.docs[0] ?? null),
		projects: projectsResult.docs.map(mapProject),
		blogPosts: postsResult.docs.map(mapBlogPost),
	}
}
