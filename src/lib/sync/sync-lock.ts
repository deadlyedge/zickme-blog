import { SyncError } from './sync-errors'
import type { SyncScope } from './sync-types'

const activeLocks = new Map<SyncScope, string>()

export function acquireSyncLock(scope: SyncScope, runId: string): () => void {
	const lockScopes: SyncScope[] =
		scope === 'ALL' ? ['POSTS', 'GALLERIES'] : [scope]
	if (
		lockScopes.some((item) => activeLocks.has(item) || activeLocks.has('ALL'))
	) {
		const owner = lockScopes.map((item) => activeLocks.get(item)).find(Boolean)
		throw new SyncError(
			'LOCKED',
			`同步范围正在运行${owner ? `（runId: ${owner}）` : ''}`,
		)
	}
	if (scope === 'ALL' && activeLocks.has('ALL'))
		throw new SyncError(
			'LOCKED',
			`同步范围正在运行（runId: ${activeLocks.get('ALL')}）`,
		)
	activeLocks.set(scope, runId)
	for (const item of lockScopes) activeLocks.set(item, runId)
	return () => {
		for (const item of [scope, ...lockScopes]) {
			if (activeLocks.get(item) === runId) activeLocks.delete(item)
		}
	}
}
