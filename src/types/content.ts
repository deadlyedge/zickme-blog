import type { InferSelectModel } from 'drizzle-orm'
import type { comments, posts, syncLogs, tags, users } from '@/db/schema'

// Enums / Status
export type StatusType = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'PENDING' | 'SPAM'
export type Role = 'ADMIN' | 'EDITOR' | 'USER'
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'

// Base Models
export type Post = InferSelectModel<typeof posts>
export type Tag = InferSelectModel<typeof tags>
export type Comment = InferSelectModel<typeof comments>
export type User = InferSelectModel<typeof users>
export type SyncLog = InferSelectModel<typeof syncLogs>

// Sync Log detail types
export interface SyncLogItem {
	stage: 'frontmatter' | 'media' | 'db' | 'general'
	level: 'info' | 'warn' | 'error' | 'success'
	message: string
	detail?: string
	timestamp: string
}

export interface SyncResult {
	success: boolean
	status: SyncStatus
	totalPosts: number
	successCount: number
	errorCount: number
	logs: SyncLogItem[]
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
		| 'Bilibili'
		| 'Zhihu'
		| 'Other'
	url: string
	username?: string
}

export type Technology = {
	id: string
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

export interface SiteProfile {
	id?: string
	name: string
	title: string
	bio: string
	location?: string | null
	email?: string | null
	website?: string | null
	avatar?: string | null
	socialLinks?: SocialLink[] | null
	skills?: Skill[] | null
	slogans?: Slogan[] | null
	createdAt?: Date
	updatedAt?: Date
}

// Content response types
export interface ContentResponse {
	profile: SiteProfile | null
	posts: PostWithTags[]
}

// Post with tags type
export type PostWithTags = Post & {
	tags?:
		| {
				id: string
				name: string
				slug: string
				color: string | null
		  }[]
		| null
}

// Type guards
export function isSiteProfile(data: unknown): data is SiteProfile {
	return (
		data !== null &&
		typeof data === 'object' &&
		'name' in data &&
		typeof (data as Record<string, unknown>).name === 'string' &&
		'bio' in data &&
		typeof (data as Record<string, unknown>).bio === 'string'
	)
}

export function isPostWithTags(post: unknown): post is PostWithTags {
	return (
		post !== null &&
		typeof post === 'object' &&
		'id' in post &&
		typeof (post as Record<string, unknown>).id === 'string' &&
		'title' in post &&
		typeof (post as Record<string, unknown>).title === 'string'
	)
}

export function isSocialLink(link: unknown): link is SocialLink {
	return (
		link !== null &&
		typeof link === 'object' &&
		'url' in link &&
		typeof (link as Record<string, unknown>).url === 'string' &&
		'platform' in link &&
		typeof (link as Record<string, unknown>).platform === 'string'
	)
}
