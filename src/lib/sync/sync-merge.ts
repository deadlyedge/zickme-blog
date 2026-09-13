import type { SyncConflict } from './sync-types'

export type ThreeWayStatus =
	| 'IN_SYNC'
	| 'LOCAL_ONLY'
	| 'REMOTE_ONLY'
	| 'CONFLICT'

export type ThreeWayResult<T extends Record<string, unknown>> = {
	status: ThreeWayStatus
	merged: Partial<T>
	conflicts: SyncConflict[]
}

export function mergeSyncFields<T extends Record<string, unknown>>(
	entityType: SyncConflict['entityType'],
	entityId: string,
	base: Partial<T> | null,
	local: Partial<T> | null,
	remote: Partial<T> | null,
): ThreeWayResult<T> {
	const baseValue: Record<string, unknown> = base ?? {}
	const localValue: Record<string, unknown> = local ?? {}
	const remoteValue: Record<string, unknown> = remote ?? {}
	const keys = new Set([
		...Object.keys(baseValue),
		...Object.keys(localValue),
		...Object.keys(remoteValue),
	])
	const merged: Partial<T> = {}
	const conflicts: SyncConflict[] = []
	let localChanged = false
	let remoteChanged = false

	for (const field of keys) {
		const baseField = baseValue[field]
		const localField = localValue[field]
		const remoteField = remoteValue[field]
		const localModified =
			JSON.stringify(localField) !== JSON.stringify(baseField)
		const remoteModified =
			JSON.stringify(remoteField) !== JSON.stringify(baseField)
		localChanged ||= localModified
		remoteChanged ||= remoteModified

		if (localModified && remoteModified) {
			if (JSON.stringify(localField) !== JSON.stringify(remoteField)) {
				conflicts.push({
					entityType,
					entityId,
					field,
					baseValue: baseField,
					localValue: localField,
					remoteValue: remoteField,
					resolution: 'UNRESOLVED',
				})
			} else merged[field as keyof T] = localField as T[keyof T]
		} else if (localModified)
			merged[field as keyof T] = localField as T[keyof T]
		else if (remoteModified)
			merged[field as keyof T] = remoteField as T[keyof T]
		else merged[field as keyof T] = baseField as T[keyof T]
	}

	return {
		status:
			conflicts.length > 0
				? 'CONFLICT'
				: localChanged && remoteChanged
					? 'IN_SYNC'
					: localChanged
						? 'LOCAL_ONLY'
						: remoteChanged
							? 'REMOTE_ONLY'
							: 'IN_SYNC',
		merged,
		conflicts,
	}
}
