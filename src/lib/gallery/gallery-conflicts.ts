export type GallerySyncConflict =
	| 'LOCAL_ONLY'
	| 'REMOTE_ONLY'
	| 'IN_SYNC'
	| 'CONFLICT'

export interface ThreeWayMergeResult<T extends Record<string, unknown>> {
	status: GallerySyncConflict
	merged: Partial<T>
	conflicts: string[]
}

/**
 * 三方字段合并：只有一方相对 merge base 发生变化时才自动采用该方。
 * 两方都变化且结果不同则必须停在 CONFLICT，禁止静默覆盖。
 */
export function mergeGalleryFields<T extends Record<string, unknown>>(
	base: Partial<T> | null,
	local: Partial<T> | null,
	remote: Partial<T> | null,
): ThreeWayMergeResult<T> {
	const baseValue: Record<string, unknown> = base ?? {}
	const localValue: Record<string, unknown> = local ?? {}
	const remoteValue: Record<string, unknown> = remote ?? {}
	const keys = new Set([
		...Object.keys(baseValue),
		...Object.keys(localValue),
		...Object.keys(remoteValue),
	])
	const merged: Partial<T> = {}
	const conflicts: string[] = []
	let localChanged = false
	let remoteChanged = false

	for (const key of keys) {
		const baseField = baseValue[key]
		const localField = localValue[key]
		const remoteField = remoteValue[key]
		const localModified =
			JSON.stringify(localField) !== JSON.stringify(baseField)
		const remoteModified =
			JSON.stringify(remoteField) !== JSON.stringify(baseField)
		localChanged ||= localModified
		remoteChanged ||= remoteModified
		if (localModified && remoteModified) {
			if (JSON.stringify(localField) !== JSON.stringify(remoteField))
				conflicts.push(key)
			else merged[key as keyof T] = localField as T[keyof T]
		} else if (localModified) {
			merged[key as keyof T] = localField as T[keyof T]
		} else if (remoteModified) {
			merged[key as keyof T] = remoteField as T[keyof T]
		} else {
			merged[key as keyof T] = baseField as T[keyof T]
		}
	}

	return {
		status:
			conflicts.length > 0
				? 'CONFLICT'
				: localChanged
					? remoteChanged
						? 'IN_SYNC'
						: 'LOCAL_ONLY'
					: remoteChanged
						? 'REMOTE_ONLY'
						: 'IN_SYNC',
		merged,
		conflicts,
	}
}

export function galleryManualSnapshot(input: {
	title: string
	description: string | null
	cover: string | null
	status: string
	metadata: unknown
}) {
	return {
		title: input.title,
		description: input.description,
		cover: input.cover,
		status: input.status,
		metadata: input.metadata,
	}
}
