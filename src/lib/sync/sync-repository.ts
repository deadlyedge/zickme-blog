import { and, desc, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/db'
import { syncRuns } from '@/db/schema'
import type { SyncRunSummary, SyncScope, SyncTrigger } from './sync-types'
import { SYNC_PROTOCOL_VERSION } from './sync-types'

export async function createSyncRun(input: {
	runId: string
	scope: SyncScope
	dryRun: boolean
	triggeredBy: SyncTrigger
	actorId?: string | null
	lockKey: string
	lockExpiresAt: Date
	startedAt: Date
}) {
	await db.insert(syncRuns).values({
		id: input.runId,
		protocolVersion: SYNC_PROTOCOL_VERSION,
		scope: input.scope,
		status: 'RUNNING',
		dryRun: input.dryRun,
		triggeredBy: input.triggeredBy,
		actorId: input.actorId ?? null,
		startedAt: input.startedAt,
		lockKey: input.lockKey,
		lockExpiresAt: input.lockExpiresAt,
	})
}

export async function finishSyncRun(summary: SyncRunSummary, exitCode: number) {
	await db
		.update(syncRuns)
		.set({
			status: summary.status,
			finishedAt: summary.finishedAt
				? new Date(summary.finishedAt)
				: new Date(),
			exitCode,
			summary,
			errorCount: summary.errors,
			conflictCount: summary.conflicts,
			lockKey: null,
			lockExpiresAt: null,
		})
		.where(eq(syncRuns.id, summary.runId))
}

export async function releaseSyncRunLock(runId: string) {
	await db
		.update(syncRuns)
		.set({ lockKey: null, lockExpiresAt: null })
		.where(eq(syncRuns.id, runId))
}

export async function findActiveSyncRun(lockKey: string) {
	const now = new Date()
	const [run] = await db
		.select({
			id: syncRuns.id,
			scope: syncRuns.scope,
			expiresAt: syncRuns.lockExpiresAt,
		})
		.from(syncRuns)
		.where(
			and(
				eq(syncRuns.lockKey, lockKey),
				or(isNull(syncRuns.lockExpiresAt), gt(syncRuns.lockExpiresAt, now)),
				eq(syncRuns.status, 'RUNNING'),
			),
		)
		.limit(1)
	return run ?? null
}

export async function findActiveSyncRunForScopes(lockKeys: string[]) {
	for (const lockKey of lockKeys) {
		const active = await findActiveSyncRun(lockKey)
		if (active) return active
	}
	return null
}

export async function listRecentSyncRuns(limit = 30) {
	return db
		.select()
		.from(syncRuns)
		.orderBy(desc(syncRuns.createdAt))
		.limit(Math.min(Math.max(limit, 1), 100))
}

export async function getSyncRun(runId: string) {
	const [run] = await db
		.select()
		.from(syncRuns)
		.where(eq(syncRuns.id, runId))
		.limit(1)
	return run ?? null
}

export async function expireStaleSyncRuns() {
	const now = new Date()
	await db
		.update(syncRuns)
		.set({
			status: 'FAILED',
			finishedAt: now,
			exitCode: 1,
			lockKey: null,
			lockExpiresAt: null,
			summary: {
				errorCode: 'LOCK_EXPIRED',
				message: '同步进程超时，已释放运行保护',
			},
		})
		.where(
			and(eq(syncRuns.status, 'RUNNING'), lte(syncRuns.lockExpiresAt, now)),
		)
}
