import type { PUBLISH_SCOPES, PUBLISH_STATUSES } from '@/lib/constants/publish'
import type { GallerySyncSummary, PostSyncSummary } from '@/lib/sync/sync-types'

export type PublishScope = (typeof PUBLISH_SCOPES)[number]

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
