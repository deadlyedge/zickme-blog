import type { GallerySyncSummary, PostSyncSummary } from '@/lib/sync/sync-types'

export const PUBLISH_SCOPES = ['posts', 'galleries', 'all'] as const
export type PublishScope = (typeof PUBLISH_SCOPES)[number]

export const PUBLISH_STATUSES = [
	'QUEUED',
	'RUNNING',
	'SUCCEEDED',
	'PARTIAL_SUCCESS',
	'FAILED',
	'CANCELLED',
] as const
export type PublishStatus = (typeof PUBLISH_STATUSES)[number]

export type PublishTrigger = 'CLI' | 'DASHBOARD' | 'CI'

export type PublishSummary = {
	runId: string
	scope: PublishScope
	status: PublishStatus
	dryRun: boolean
	triggeredBy: PublishTrigger
	startedAt: string
	finishedAt: string | null
	posts: PostSyncSummary
	galleries: GallerySyncSummary
	conflicts: number
	errors: number
	errorCode?: string
}

export type PublishResult = {
	summary: PublishSummary
}
