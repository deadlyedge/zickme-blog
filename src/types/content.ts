import type { InferSelectModel } from 'drizzle-orm'
import type { comments, posts, syncLogs, tags, users } from '@/db/schema'

// Enums / Status
export type StatusType = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'PENDING' | 'SPAM'
export type Role = 'ADMIN' | 'EDITOR' | 'USER'
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'

export type PostLinkType =
	| 'github'
	| 'twitter'
	| 'demo'
	| 'documentation'
	| 'figma'
	| 'paper'
	| 'website'
	| 'other'

export interface PostLink {
	url: string
	label?: string
	type: PostLinkType
}

export interface PostMetadata {
	links: PostLink[]
	category?: string
	series?: string
	canonicalUrl?: string
	outdatedWarning?: string
	layout?: 'article' | 'gallery' | 'photo'
}

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
	id?: string
	category: string
	technologies: Technology[]
}

export type Slogan = {
	id?: string
	text: string
	fontSize?: string
	color?: string
}

// Theme configuration types (compatible with shadcn / CSS variables)
export interface ThemeVariables {
	background?: string
	foreground?: string
	card?: string
	cardForeground?: string
	popover?: string
	popoverForeground?: string
	primary?: string
	primaryForeground?: string
	secondary?: string
	secondaryForeground?: string
	muted?: string
	mutedForeground?: string
	accent?: string
	accentForeground?: string
	destructive?: string
	destructiveForeground?: string
	border?: string
	input?: string
	ring?: string
	radius?: string
	fontSans?: string
	fontSerif?: string
	fontMono?: string
	[key: string]: string | undefined
}

export interface ThemeConfig {
	preset?: 'default' | 'minimal-slate' | 'cyber-green' | 'warm-amber' | 'custom'
	customCss?: string
	light?: ThemeVariables
	dark?: ThemeVariables
}

// Landing Page configuration types
export interface LandingPageConfig {
	enabled?: boolean
	showTopHottest?: boolean
	showSlogans?: boolean
	showPinnedPosts?: boolean
	showLatestPosts?: boolean
	pinnedPostIds?: string[]
}

// About Page extended configuration types (referencing mafifi.dev style)
export interface TimelineItem {
	id: string
	period: string
	role: string
	company: string
	companyUrl?: string
	location?: string
	description?: string
	achievements?: string[]
	technologies?: string[]
}

export interface FeaturedProject {
	id: string
	title: string
	description: string
	url?: string
	githubUrl?: string
	stars?: string
	tags?: string[]
}

export interface AboutPageConfig {
	headline?: string
	subheadline?: string
	statusText?: string
	careerTimeline?: TimelineItem[]
	educationTimeline?: TimelineItem[]
	featuredProjects?: FeaturedProject[]
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
	themeConfig?: ThemeConfig | null
	landingPageConfig?: LandingPageConfig | null
	aboutPageConfig?: AboutPageConfig | null
	createdAt?: Date
	updatedAt?: Date
}

// Content response types
export interface ContentResponse {
	profile: SiteProfile | null
	posts: PostWithTags[]
	hottestPosts?: PostWithTags[]
	pinnedPosts?: PostWithTags[]
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
