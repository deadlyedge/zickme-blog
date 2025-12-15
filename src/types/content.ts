import { Post } from '@/generated/prisma/client'

// Enums
export type PostType = 'BLOG' | 'PROJECT'
export type StatusType = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'PENDING' | 'SPAM'

// Tag type
export interface Tag {
	id: string
	name: string
	slug: string
	color: string | null
	background: string | null
	createdAt?: Date
	updatedAt?: Date
}

// Social links and profile types
export type SocialLink = {
	platform:
		| 'GitHub'
		| 'LinkedIn'
		| 'Twitter'
		| 'Instagram'
		| 'YouTube'
		| 'Facebook'
		| 'Other'
	url: string
	username?: string
}

export type Technology = {
	name: string
	level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export type Skill = {
	category: string
	technologies: Technology[]
}

export type Slogan = {
	text: string
	fontSize?: string
	color?: string
}

// Simplified SiteProfile interface
export interface SiteProfile {
	id?: string
	name: string
	title: string
	bio: string
	location?: string
	email?: string
	website?: string
	avatar?: string
	socialLinks?: SocialLink[]
	skills?: Skill[]
	slogans?: Slogan[]
	createdAt?: Date
	updatedAt?: Date
}

// Content response types
export interface ContentResponse {
	profile: SiteProfile | null
	projects: PostWithTags[]
	blog: PostWithTags[]
}

// Post with tags type (simplified from content-providers)
export type PostWithTags = Post & {
	tags?: {
		id: string
		name: string
		slug: string
		color: string | null
	}[] | null
}

// Type guards
export function isSiteProfile(data: unknown): data is SiteProfile {
	return data !== null && typeof data === 'object' &&
		   'name' in data && typeof data.name === 'string' &&
		   'bio' in data && typeof data.bio === 'string'
}

export function isPostWithTags(post: unknown): post is PostWithTags {
	return post !== null && typeof post === 'object' &&
		   'id' in post && typeof post.id === 'string' &&
		   'title' in post && typeof post.title === 'string'
}

export function isSocialLink(link: unknown): link is SocialLink {
	return link !== null && typeof link === 'object' &&
		   'url' in link && typeof link.url === 'string' &&
		   'platform' in link && typeof link.platform === 'string'
}
