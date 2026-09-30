import type { PUBLISH_SCOPES, PUBLISH_STATUSES } from '@/constants/publish'

export type PublishScope = (typeof PUBLISH_SCOPES)[number]

export type PublishStatus = (typeof PUBLISH_STATUSES)[number]

export type PublishTrigger = 'CLI' | 'DASHBOARD' | 'CI'

export type PostPublishSummary = {
	total: number
	processed: number
	succeeded: number
	errors: number
	mediaErrors: number
	archived: number
	sourceMissing: string[]
}

export type GalleryPublishSummary = {
	albums: number
	images: number
	processed: number
	uploaded: number
	skipped: number
	unsupported: number
	archived: number
	pendingDelete: number
	conflicts: number
	errors: number
	sourceMissing: string[]
}

export type PublishSummary = {
	runId: string
	scope: PublishScope
	status: PublishStatus
	dryRun: boolean
	triggeredBy: PublishTrigger
	startedAt: string
	finishedAt: string | null
	posts: PostPublishSummary
	galleries: GalleryPublishSummary
	conflicts: number
	errors: number
	errorCode?: string
}

export type PublishResult = {
	summary: PublishSummary
}

export type ContentIssueCode =
	| 'CONTENT_INVALID'
	| 'FRONTMATTER_REBUILD_REQUIRED'
	| 'MEDIA_PREPARATION_REQUIRED'
	| 'ALBUM_REBUILD_REQUIRED'
	| 'GALLERY_INDEX_REQUIRED'
	| 'MEDIA_INVALID'

export type RepairReviewMode =
	| 'none'
	| 'inspect-generated-file'
	| 'inspect-generated-directory'
	| 'review-git-diff'

export type ContentIssue = {
	scope: Exclude<PublishScope, 'all'>
	code: ContentIssueCode
	filePath: string
	message: string
	field?: string
	mediaPath?: string
	suggestedCommand?: string
	canExecuteFromTui: boolean
	requiresManualReview: boolean
	repairReviewMode: RepairReviewMode
	generatedPaths?: string[]
	generatedDirectories?: string[]
	reviewFields?: string[]
}

export type ValidationReport = {
	scope: PublishScope
	valid: boolean
	issues: ContentIssue[]
	warnings: string[]
	checkedFiles: number
	checkedAlbums: number
	checkedImages: number
}

export function parsePublishScope(value: string | undefined): PublishScope {
	if (value === undefined || value.trim() === '') return 'all'
	const normalized = value?.trim().toLowerCase()
	if (
		normalized === 'posts' ||
		normalized === 'galleries' ||
		normalized === 'all'
	)
		return normalized
	throw new Error('scope 必须是 posts、galleries 或 all')
}
