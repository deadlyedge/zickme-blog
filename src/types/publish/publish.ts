import type { PUBLISH_SCOPES, PUBLISH_STATUSES } from '@/lib/constants/publish'

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
