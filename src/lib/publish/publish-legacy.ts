import type { SyncResult } from '@/types'
import type { PublishSummary } from './publish-summary'

/**
 * Compatibility adapter for the frozen Dashboard result shape.
 * New Publish callers must use PublishSummary instead.
 */
export function legacySyncResultFromPublish(
	summary: PublishSummary,
): SyncResult {
	return {
		success: summary.status === 'SUCCEEDED',
		status:
			summary.status === 'SUCCEEDED'
				? 'SUCCESS'
				: summary.status === 'PARTIAL_SUCCESS'
					? 'PARTIAL'
					: 'FAILED',
		totalPosts: summary.posts.total,
		successCount: summary.posts.succeeded,
		errorCount: summary.errors,
		logs: [
			{
				stage: 'general',
				level: summary.status === 'SUCCEEDED' ? 'success' : 'error',
				message: `发布运行 ${summary.runId}：${summary.status}`,
				detail: summary.errorCode,
				timestamp: summary.finishedAt ?? new Date().toISOString(),
			},
		],
	}
}
