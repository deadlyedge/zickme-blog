import { randomUUID } from 'node:crypto'
import { syncGalleries } from '@/lib/gallery/gallery-sync-service'
import { ContentSyncService } from '@/lib/sync-service'
import { safeSyncError } from './sync-errors'
import { acquireSyncLock } from './sync-lock'
import { finishSyncRun } from './sync-repository'
import {
	emptyGallerySummary,
	type SyncRunSummary,
	type SyncScope,
	type SyncTrigger,
} from './sync-types'

export type SyncOrchestratorOptions = {
	scope: SyncScope
	dryRun?: boolean
	triggeredBy?: SyncTrigger
	deleteOld?: boolean
	actorId?: string | null
	galleryInputDir?: string
}

function postSummary(
	result: Awaited<ReturnType<ContentSyncService['runSync']>>,
) {
	return {
		total: result.totalPosts,
		processed: result.successCount + result.errorCount,
		succeeded: result.successCount,
		errors: result.errorCount,
		mediaErrors: result.logs.filter(
			(log) => log.stage === 'media' && log.level === 'error',
		).length,
		archived: 0,
		sourceMissing: result.sourceMissing ?? [],
	}
}

function gallerySummary(result: {
	albums: number
	images: number
	processed: number
	uploaded: number
	skipped: number
	unsupported: number
	archived: number
	errors: number
	sourceMissing: string[]
}) {
	return { ...emptyGallerySummary(), ...result }
}

export async function runSync(
	options: SyncOrchestratorOptions,
): Promise<SyncRunSummary> {
	const runId = randomUUID()
	const startedAt = new Date().toISOString()
	const started = new Date(startedAt)
	const dryRun = options.dryRun === true
	if (!dryRun)
		await acquireSyncLock({
			runId,
			scope: options.scope,
			dryRun,
			triggeredBy: options.triggeredBy ?? 'CLI',
			actorId: options.actorId,
			startedAt: started,
		})
	const summary: SyncRunSummary = {
		runId,
		scope: options.scope,
		status: 'RUNNING',
		dryRun,
		triggeredBy: options.triggeredBy ?? 'CLI',
		startedAt,
		finishedAt: null,
		posts: {
			total: 0,
			processed: 0,
			succeeded: 0,
			errors: 0,
			mediaErrors: 0,
			archived: 0,
			sourceMissing: [],
		},
		galleries: emptyGallerySummary(),
		conflicts: 0,
		errors: 0,
	}
	const failures: string[] = []

	try {
		if (options.scope === 'POSTS' || options.scope === 'ALL') {
			try {
				const result = await new ContentSyncService().runSync({
					triggerType: options.triggeredBy === 'CLI' ? 'CLI' : 'MANUAL',
					dryRun: options.dryRun,
					deleteOld: options.deleteOld ?? false,
				})
				summary.posts = postSummary(result)
				if (!result.success) failures.push('posts')
			} catch (error) {
				failures.push('posts')
				summary.errors++
				summary.errorCode = safeSyncError(error).code
			}
		}

		if (options.scope === 'GALLERIES' || options.scope === 'ALL') {
			try {
				summary.galleries = gallerySummary(
					await syncGalleries({
						dryRun: options.dryRun,
						inputDir: options.galleryInputDir,
						deleteOld: options.deleteOld ?? false,
					}),
				)
				if (summary.galleries.errors > 0 || summary.galleries.unsupported > 0)
					failures.push('galleries')
			} catch (error) {
				failures.push('galleries')
				summary.errors++
				summary.errorCode = safeSyncError(error).code
			}
		}

		summary.errors +=
			summary.posts.errors +
			summary.galleries.errors +
			summary.galleries.unsupported
		summary.status =
			failures.length === 0
				? 'SUCCEEDED'
				: failures.length < (options.scope === 'ALL' ? 2 : 1)
					? 'PARTIAL_SUCCESS'
					: 'FAILED'
	} catch (error) {
		const safe = safeSyncError(error)
		summary.status = 'FAILED'
		summary.errorCode = safe.code
		summary.errors++
	} finally {
		summary.finishedAt = new Date().toISOString()
		if (!dryRun)
			await finishSyncRun(summary, summary.status === 'SUCCEEDED' ? 0 : 1)
	}
	return summary
}
