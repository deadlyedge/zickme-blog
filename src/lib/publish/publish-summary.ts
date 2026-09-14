import type { SyncRunSummary } from '@/lib/sync/sync-types'
import type { PublishScope, PublishSummary } from '@/types/publish/publish'

export { PUBLISH_SCOPES, PUBLISH_STATUSES } from '@/lib/constants/publish'
export type {
	PublishResult,
	PublishScope,
	PublishStatus,
	PublishSummary,
	PublishTrigger,
} from '@/types/publish/publish'

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
