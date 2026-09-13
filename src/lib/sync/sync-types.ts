export const SYNC_SCOPES = ['POSTS', 'GALLERIES', 'ALL'] as const
export type SyncScope = (typeof SYNC_SCOPES)[number]

export const SYNC_RUN_STATUSES = [
	'QUEUED',
	'RUNNING',
	'SUCCEEDED',
	'PARTIAL_SUCCESS',
	'FAILED',
	'CANCELLED',
] as const
export type SyncRunStatus = (typeof SYNC_RUN_STATUSES)[number]

export type SyncTrigger = 'CLI' | 'DASHBOARD' | 'CI'

export type PostSyncSummary = {
	total: number
	processed: number
	succeeded: number
	errors: number
	mediaErrors: number
	archived: number
}

export type GallerySyncSummary = {
	albums: number
	images: number
	processed: number
	uploaded: number
	skipped: number
	unsupported: number
	archived: number
	pendingDelete: number
	conflicts: number
	errors: number
}

export type SyncRunSummary = {
	runId: string
	scope: SyncScope
	status: SyncRunStatus
	dryRun: boolean
	triggeredBy: SyncTrigger
	startedAt: string
	finishedAt: string | null
	posts: PostSyncSummary
	galleries: GallerySyncSummary
	conflicts: number
	errors: number
	errorCode?: string
	retryOf?: string
}

export type SyncConflict = {
	entityType: 'POST' | 'GALLERY' | 'GALLERY_IMAGE'
	entityId: string
	field: string
	baseValue: unknown
	localValue: unknown
	remoteValue: unknown
	resolution: 'UNRESOLVED' | 'LOCAL' | 'REMOTE' | 'MANUAL'
}

export function parseSyncScope(value: string | undefined): SyncScope {
	const normalized = value?.trim().toUpperCase()
	if (
		normalized === 'POSTS' ||
		normalized === 'GALLERIES' ||
		normalized === 'ALL'
	)
		return normalized
	throw new Error('scope 必须是 posts、galleries 或 all')
}

export function emptyPostSummary(): PostSyncSummary {
	return {
		total: 0,
		processed: 0,
		succeeded: 0,
		errors: 0,
		mediaErrors: 0,
		archived: 0,
	}
}

export function emptyGallerySummary(): GallerySyncSummary {
	return {
		albums: 0,
		images: 0,
		processed: 0,
		uploaded: 0,
		skipped: 0,
		unsupported: 0,
		archived: 0,
		pendingDelete: 0,
		conflicts: 0,
		errors: 0,
	}
}
