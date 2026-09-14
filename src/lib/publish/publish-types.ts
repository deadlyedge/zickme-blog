import type { PublishScope } from '@/types/publish/publish'

export { PUBLISH_SCOPES } from '@/lib/constants/publish'
export type { PublishScope } from '@/types/publish/publish'

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
