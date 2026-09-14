import { SyncError } from './sync-errors'
import {
	createSyncRun,
	expireStaleSyncRuns,
	findActiveSyncRunForScopes,
} from './sync-repository'
import type { SyncScope, SyncTrigger } from './sync-types'
import { SYNC_LOCK_TTL_MS } from './sync-types'

export function syncLockKey(scope: SyncScope): string {
	return `SYNC:${scope}`
}

export async function acquireSyncLock(input: {
	runId: string
	scope: SyncScope
	dryRun: boolean
	triggeredBy: SyncTrigger
	actorId?: string | null
	startedAt: Date
}): Promise<() => Promise<void>> {
	await expireStaleSyncRuns()
	const lockKey = syncLockKey(input.scope)
	const conflictKeys =
		input.scope === 'ALL'
			? [lockKey, syncLockKey('POSTS'), syncLockKey('GALLERIES')]
			: [lockKey, syncLockKey('ALL')]
	const lockExpiresAt = new Date(input.startedAt.getTime() + SYNC_LOCK_TTL_MS)
	try {
		const active = await findActiveSyncRunForScopes(conflictKeys)
		if (active)
			throw new SyncError(
				'LOCKED',
				`已有同步正在运行，请稍后重试（runId: ${active.id}）`,
			)
		await createSyncRun({ ...input, lockKey, lockExpiresAt })
	} catch (error) {
		const active = await findActiveSyncRunForScopes(conflictKeys)
		if (active) {
			throw new SyncError(
				'LOCKED',
				`已有${input.scope.toLowerCase()}同步正在运行，请稍后重试（runId: ${active.id}）`,
			)
		}
		throw error
	}
	return async () => undefined
}
