import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
	comments,
	galleries,
	galleryImages,
	posts,
	postsToTags,
	siteProfile,
	siteSnapshots,
	tags,
} from '@/db/schema'
import {
	assertSnapshotPayload,
	hashSnapshotPayload,
	normalizeSnapshotValue,
	reviveDate,
	summarizeSnapshotPayload,
} from './snapshot-safety'
import {
	SNAPSHOT_SCHEMA_VERSION,
	type SnapshotPayload,
	type SnapshotSource,
} from './snapshot-types'

type SnapshotTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function readPayload(
	tx: SnapshotTransaction,
	includeComments: boolean,
): Promise<SnapshotPayload> {
	const payload: SnapshotPayload = {
		posts: await tx.select().from(posts),
		tags: await tx.select().from(tags),
		postTags: await tx.select().from(postsToTags),
		galleries: await tx.select().from(galleries),
		galleryImages: await tx.select().from(galleryImages),
		siteProfile: await tx.select().from(siteProfile),
	}
	if (includeComments) payload.comments = await tx.select().from(comments)
	return normalizeSnapshotValue(payload) as SnapshotPayload
}

export async function createSnapshot(input: {
	name: string
	description?: string
	createdBy: string
	source?: SnapshotSource
	includeComments?: boolean
}) {
	return db.transaction(async (tx) => {
		const payload = await readPayload(tx, input.includeComments === true)
		const summary = summarizeSnapshotPayload(payload)
		const [snapshot] = await tx
			.insert(siteSnapshots)
			.values({
				name: input.name,
				description: input.description || null,
				status: 'READY',
				createdBy: input.createdBy,
				completedAt: new Date(),
				source: input.source ?? 'MANUAL',
				schemaVersion: SNAPSHOT_SCHEMA_VERSION,
				summary,
				payload,
				payloadHash: hashSnapshotPayload(payload),
			})
			.returning()
		return snapshot
	})
}

export async function restoreSnapshot(input: {
	snapshotId: string
	createdBy: string
	includeComments?: boolean
}) {
	return db.transaction(async (tx) => {
		const snapshot = await tx.query.siteSnapshots.findFirst({
			where: (table, { eq }) => eq(table.id, input.snapshotId),
		})
		if (!snapshot) throw new Error('找不到快照')
		if (snapshot.status !== 'READY' && snapshot.status !== 'RESTORED')
			throw new Error('只有 READY 或 RESTORED 快照可以恢复')
		if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION)
			throw new Error('快照版本不受当前系统支持')
		assertSnapshotPayload(snapshot.payload)
		if (hashSnapshotPayload(snapshot.payload) !== snapshot.payloadHash)
			throw new Error('快照校验失败，payload hash 不匹配')

		const currentPayload = await readPayload(tx, input.includeComments === true)
		const currentComments = await tx.select().from(comments)
		const protectionPayload = currentPayload
		const [protection] = await tx
			.insert(siteSnapshots)
			.values({
				name: `恢复保护：${snapshot.name}`,
				description: '恢复前自动创建的保护快照，禁止删除',
				status: 'READY',
				createdBy: input.createdBy,
				completedAt: new Date(),
				source: 'PRE_RESTORE',
				schemaVersion: SNAPSHOT_SCHEMA_VERSION,
				summary: summarizeSnapshotPayload(protectionPayload),
				payload: protectionPayload,
				payloadHash: hashSnapshotPayload(protectionPayload),
			})
			.returning()

		await tx
			.update(siteSnapshots)
			.set({ status: 'RESTORING', errorMessage: null })
			.where(eq(siteSnapshots.id, snapshot.id))

		// Comments are deliberately not part of the default restore. Clear the
		// runtime interaction copy before deleting posts to avoid stale comments
		// and foreign-key surprises; restore them only when explicitly included.
		await tx.delete(comments)
		await tx.delete(postsToTags)
		await tx.delete(galleryImages)
		await tx.delete(galleries)
		await tx.delete(posts)
		await tx.delete(tags)
		await tx.delete(siteProfile)
		const restored = snapshot.payload
		if (restored.posts.length)
			await tx.insert(posts).values(restored.posts.map(toPostRow))
		if (restored.tags.length)
			await tx.insert(tags).values(restored.tags.map(toTagRow))
		if (restored.postTags.length)
			await tx
				.insert(postsToTags)
				.values(restored.postTags as (typeof postsToTags.$inferInsert)[])
		if (restored.galleries.length)
			await tx.insert(galleries).values(restored.galleries.map(toGalleryRow))
		if (restored.galleryImages.length)
			await tx
				.insert(galleryImages)
				.values(restored.galleryImages.map(toGalleryImageRow))
		if (restored.siteProfile.length)
			await tx
				.insert(siteProfile)
				.values(restored.siteProfile.map(toSiteProfileRow))
		const commentsToRestore =
			input.includeComments === true && restored.comments
				? restored.comments
				: currentComments
		if (commentsToRestore.length)
			await tx.insert(comments).values(commentsToRestore.map(toCommentRow))

		await tx
			.update(siteSnapshots)
			.set({ status: 'RESTORED', completedAt: new Date() })
			.where(eq(siteSnapshots.id, snapshot.id))
		return { snapshotId: snapshot.id, protectionSnapshotId: protection.id }
	})
}

function date(value: unknown) {
	return reviveDate(value) ?? null
}
function toPostRow(row: Record<string, unknown>) {
	return {
		...row,
		publishedAt: date(row.publishedAt),
		archivedAt: date(row.archivedAt),
		createdAt: date(row.createdAt) ?? new Date(),
		updatedAt: date(row.updatedAt) ?? new Date(),
	} as typeof posts.$inferInsert
}
function toTagRow(row: Record<string, unknown>) {
	return {
		...row,
		createdAt: date(row.createdAt) ?? new Date(),
		updatedAt: date(row.updatedAt) ?? new Date(),
	} as typeof tags.$inferInsert
}
function toGalleryRow(row: Record<string, unknown>) {
	return {
		...row,
		publishedAt: date(row.publishedAt),
		createdAt: date(row.createdAt) ?? new Date(),
		updatedAt: date(row.updatedAt) ?? new Date(),
	} as typeof galleries.$inferInsert
}
function toGalleryImageRow(row: Record<string, unknown>) {
	return {
		...row,
		sourceModifiedAt: date(row.sourceModifiedAt),
		lastSyncedAt: date(row.lastSyncedAt),
		createdAt: date(row.createdAt) ?? new Date(),
		updatedAt: date(row.updatedAt) ?? new Date(),
	} as typeof galleryImages.$inferInsert
}
function toSiteProfileRow(row: Record<string, unknown>) {
	return {
		...row,
		createdAt: date(row.createdAt) ?? new Date(),
		updatedAt: date(row.updatedAt) ?? new Date(),
	} as typeof siteProfile.$inferInsert
}
function toCommentRow(row: Record<string, unknown>) {
	return {
		...row,
		createdAt: date(row.createdAt) ?? new Date(),
		editedAt: date(row.editedAt),
	} as typeof comments.$inferInsert
}
