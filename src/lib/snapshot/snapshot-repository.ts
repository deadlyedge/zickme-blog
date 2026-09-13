import { and, desc, eq, inArray, ne } from 'drizzle-orm'
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

export async function getSnapshot(id: string) {
	return db.query.siteSnapshots.findFirst({ where: eq(siteSnapshots.id, id) })
}

export async function listSnapshots(limit = 50) {
	return db.query.siteSnapshots.findMany({
		where: ne(siteSnapshots.status, 'DELETED'),
		orderBy: [desc(siteSnapshots.createdAt)],
		limit: Math.min(Math.max(limit, 1), 100),
	})
}

export async function countRecoverableSnapshots() {
	const rows = await db
		.select({ id: siteSnapshots.id })
		.from(siteSnapshots)
		.where(
			and(
				ne(siteSnapshots.status, 'DELETED'),
				inArray(siteSnapshots.status, ['READY', 'RESTORED']),
			),
		)
	return rows.length
}

export {
	comments,
	galleries,
	galleryImages,
	posts,
	postsToTags,
	siteProfile,
	siteSnapshots,
	tags,
}
