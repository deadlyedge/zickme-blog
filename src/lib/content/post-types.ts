import type { PostMetadata, StatusType } from '@/types'

export interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[] | string
	date?: string
	slug?: string
	status?: string
	draft?: boolean
	sourceUrl?: string
	links?: unknown[]
	github?: string
	demo?: string
	figma?: string
	paper?: string
	category?: string
	series?: string
	canonicalUrl?: string
	outdatedWarning?: string
	layout?: 'article' | 'gallery' | 'photo'
}

export interface ProcessedPost {
	slug: string
	sourcePath: string
	title: string
	excerpt?: string
	poster?: string
	content: string
	publishedAt: Date
	tags: string[]
	status: StatusType
	sourceUrl?: string
	metadata: PostMetadata
}

export interface SyncRunnerOptions {
	triggerType?: 'MANUAL' | 'UPLOAD' | 'CLI'
	dryRun?: boolean
	deleteOld?: boolean
	customPostsDir?: string
	virtualFiles?: Array<{
		relativePath: string
		content: string
	}>
	virtualImages?: Array<{
		relativePath: string
		buffer: Buffer
	}>
}
