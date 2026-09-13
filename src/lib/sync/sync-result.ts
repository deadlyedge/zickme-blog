import type { SyncResult } from '@/types'
import type { SyncRunSummary } from './sync-types'

export function syncResultFromSummary(summary: SyncRunSummary): SyncResult {
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
				message: `同步运行 ${summary.runId}：${summary.status}`,
				detail: summary.errorCode,
				timestamp: summary.finishedAt ?? new Date().toISOString(),
			},
		],
	}
}

export function failedSyncResult(message: string, error: unknown): SyncResult {
	return {
		success: false,
		status: 'FAILED',
		totalPosts: 0,
		successCount: 0,
		errorCount: 1,
		logs: [
			{
				stage: 'general',
				level: 'error',
				message,
				detail: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			},
		],
	}
}
