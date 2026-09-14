import type {
	GallerySyncSummary,
	PostSyncSummary,
	SyncRunSummary,
} from '@/lib/sync/sync-types'
import type { PublishScope } from './publish-types'

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

function publishScopeFromSyncScope(
	scope: SyncRunSummary['scope'],
): PublishScope {
	return scope === 'POSTS'
		? 'posts'
		: scope === 'GALLERIES'
			? 'galleries'
			: 'all'
}

/**
 * Compatibility boundary for the frozen Sync adapter.
 * Sync-only fields are deliberately not copied into the public Publish DTO.
 */
export function publishSummaryFromSync(
	summary: SyncRunSummary,
): PublishSummary {
	return {
		runId: summary.runId,
		scope: publishScopeFromSyncScope(summary.scope),
		status: summary.status,
		dryRun: summary.dryRun,
		triggeredBy: summary.triggeredBy,
		startedAt: summary.startedAt,
		finishedAt: summary.finishedAt,
		posts: {
			...summary.posts,
			sourceMissing: summary.posts.sourceMissing ?? [],
		},
		galleries: {
			...summary.galleries,
			sourceMissing: summary.galleries.sourceMissing ?? [],
		},
		conflicts: summary.conflicts,
		errors: summary.errors,
		errorCode: summary.errorCode,
	}
}
