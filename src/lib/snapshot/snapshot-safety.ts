import { createHash } from 'node:crypto'
import type {
	SnapshotPayload,
	SnapshotSummary,
} from '@/types/snapshot/snapshot'

export function normalizeSnapshotValue(value: unknown): unknown {
	if (value instanceof Date) return value.toISOString()
	if (Array.isArray(value)) return value.map(normalizeSnapshotValue)
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.filter(([, item]) => item !== undefined)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, item]) => [key, normalizeSnapshotValue(item)]),
		)
	return value
}

export function serializeSnapshotPayload(payload: SnapshotPayload): string {
	return JSON.stringify(normalizeSnapshotValue(payload))
}

export function hashSnapshotPayload(payload: SnapshotPayload): string {
	return createHash('sha256')
		.update(serializeSnapshotPayload(payload))
		.digest('hex')
}

export function summarizeSnapshotPayload(
	payload: SnapshotPayload,
): SnapshotSummary {
	const summary = {
		posts: payload.posts.length,
		tags: payload.tags.length,
		postTags: payload.postTags.length,
		galleries: payload.galleries.length,
		galleryImages: payload.galleryImages.length,
		siteProfile: payload.siteProfile.length,
		comments: payload.comments?.length ?? 0,
		galleryImageComments: payload.galleryImageComments?.length ?? 0,
		includesComments: Boolean(payload.comments),
		totalRows: 0,
	}
	summary.totalRows =
		summary.posts +
		summary.tags +
		summary.postTags +
		summary.galleries +
		summary.galleryImages +
		summary.siteProfile +
		summary.comments +
		summary.galleryImageComments
	return summary
}

export function reviveDate(value: unknown): Date | undefined {
	if (typeof value !== 'string') return undefined
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? undefined : date
}

export function assertSnapshotPayload(
	value: unknown,
): asserts value is SnapshotPayload {
	if (!value || typeof value !== 'object') throw new Error('快照 payload 无效')
	const payload = value as Record<string, unknown>
	for (const key of [
		'posts',
		'tags',
		'postTags',
		'galleries',
		'galleryImages',
		siteProfileKey,
	] as const) {
		if (!Array.isArray(payload[key])) throw new Error(`快照缺少 ${key} 数据`)
	}
	if (payload.comments !== undefined && !Array.isArray(payload.comments))
		throw new Error('快照 comments 数据无效')
	if (
		payload.galleryImageComments !== undefined &&
		!Array.isArray(payload.galleryImageComments)
	)
		throw new Error('快照 galleryImageComments 数据无效')
}

const siteProfileKey = 'siteProfile' as const
